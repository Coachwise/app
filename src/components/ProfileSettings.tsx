import { User, Mail, Phone, Calendar, Briefcase, Instagram, Globe, Camera, Save } from 'lucide-react';
import { Button } from './ui/button';
import { BackButton } from './ui/back-button';
import { useState, useRef, useEffect } from 'react';
import { useLanguage } from '../contexts/LanguageContext';
import type { UserRole } from '../App';
import { useAuth } from '../contexts/AuthContext';
import * as UsersAPI from '../api/users';
import * as MediaAPI from '../api/media';
import { prepareImage, UnsupportedImageError, type PreparedImage } from '../lib/image';
import { AvatarCropper } from './AvatarCropper';

interface ProfileSettingsProps {
  userRole: UserRole;
  onBack: () => void;
}

// A username is 5–24 letters and digits, matching the API's binding rule
// (min=5,max=24,alphanum). Returns the translation key of the problem, or null.
function usernameProblem(raw: string): string | null {
  const handle = raw.trim().replace(/^@+/, '');
  if (handle.length < 5 || handle.length > 24) return 'usernameLength';
  if (!/^[a-zA-Z0-9]+$/.test(handle)) return 'usernameCharset';
  return null;
}

export function ProfileSettings({ onBack }: ProfileSettingsProps) {
  const { t } = useLanguage();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { user, tokens, refreshUser } = useAuth();

  const [profileImage, setProfileImage] = useState<string | null>(null);
  const [avatarId, setAvatarId] = useState<string | null>(null);
  const [pending, setPending] = useState<PreparedImage | null>(null);
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [jobTitle, setJobTitle] = useState('');
  const [bio, setBio] = useState('');
  const [birthday, setBirthday] = useState('');
  const [website, setWebsite] = useState('');
  const [instagram, setInstagram] = useState('');

  const [uploadingImage, setUploadingImage] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Load the real profile — no mock defaults.
  useEffect(() => {
    if (!user) return;
    setProfileImage(user.avatar?.url || null);
    setAvatarId(user.avatar_id || null);
    setFirstName(user.first_name || '');
    setLastName(user.last_name || '');
    setUsername(user.username || '');
    setEmail(user.email || '');
    setPhone(user.phone || '');
    setJobTitle(user.job_title || '');
    setBio(user.bio || '');
    setBirthday(user.birthday ? user.birthday.slice(0, 10) : '');
    setWebsite(user.website || '');
    setInstagram(user.instagram || '');
  }, [user]);

  const handleImageSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    if (!tokens?.access_token) {
      setError(t('notAuthenticated'));
      return;
    }
    setError(null);
    try {
      setPending(await prepareImage(file));
    } catch (e) {
      if (e instanceof UnsupportedImageError) setError(t('imageFormatUnsupported'));
      else setError(e instanceof Error ? e.message : t('unableToUploadImage'));
    } finally {
      event.target.value = '';
    }
  };

  const closeCropper = () => {
    pending?.release();
    setPending(null);
  };

  const uploadAvatar = async (avatar: File) => {
    if (!tokens?.access_token) return;
    setUploadingImage(true);
    try {
      const media = await MediaAPI.uploadMedia(tokens.access_token, avatar);
      setProfileImage(media.url);
      setAvatarId(media.id);
      closeCropper();
    } catch (e) {
      setError(e instanceof Error ? e.message : t('unableToUploadImage'));
    } finally {
      setUploadingImage(false);
    }
  };

  const handleSave = async () => {
    if (!tokens?.access_token) {
      setError(t('notAuthenticated'));
      return;
    }
    const problem = username.trim() ? usernameProblem(username) : null;
    if (problem) {
      setError(t(problem));
      return;
    }
    setSaving(true);
    setError(null);
    try {
      await UsersAPI.updateMe(tokens.access_token, {
        first_name: firstName.trim() || undefined,
        last_name: lastName.trim() || undefined,
        username: username.replace(/^@/, '').trim() || undefined,
        job_title: jobTitle.trim(),
        bio: bio.trim(),
        phone: phone.trim() || undefined,
        website: website.trim(),
        instagram: instagram.replace(/^@/, '').trim(),
        birthday, // "YYYY-MM-DD" or "" to clear
        avatar_id: avatarId || undefined,
      });
      await refreshUser();
      onBack();
    } catch (e) {
      setError(e instanceof Error ? e.message : t('unableToSaveProfile'));
    } finally {
      setSaving(false);
    }
  };

  const initials =
    (firstName || lastName || 'User').split(' ').map((n) => n[0]).join('').slice(0, 2).toUpperCase() || 'U';

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      {pending && (
        <AvatarCropper image={pending} busy={uploadingImage} onCancel={closeCropper} onDone={uploadAvatar} />
      )}

      {/* Header */}
      <div className="bg-navy px-4 py-4 sticky top-0 z-10">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <BackButton onClick={onBack} aria-label={t('back')} />
            <div className="flex items-center gap-2">
              <User className="w-6 h-6 text-yellow-500" />
              <h1 className="text-white text-xl">{t('profileSettings')}</h1>
            </div>
          </div>
          <Button variant="brand" size="sm" icon={<Save />} loading={saving} onClick={handleSave}>
            {t('save')}
          </Button>
        </div>
      </div>

      <div className="max-w-2xl mx-auto">
        {/* Avatar */}
        <div className="px-4 pt-6 mb-6 flex justify-center">
          <div className="relative inline-block">
            {profileImage ? (
              <img
                src={profileImage}
                alt={(firstName || lastName) || 'Profile'}
                className="w-28 h-28 rounded-full border-4 border-white object-cover shadow"
              />
            ) : (
              <div className="w-28 h-28 rounded-full border-4 border-white bg-navy/10 flex items-center justify-center text-navy font-bold text-xl shadow">
                {initials}
              </div>
            )}
            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={uploadingImage}
              className="absolute bottom-0 right-0 p-2 bg-navy text-white rounded-full hover:bg-navy-light transition-colors border-2 border-white disabled:opacity-60"
            >
              <Camera className="w-4 h-4" />
            </button>
          </div>
        </div>

        <input ref={fileInputRef} type="file" accept="image/*" onChange={handleImageSelect} className="hidden" />

        <div className="p-4 space-y-6">
          {error && <div className="p-3 bg-red-100 text-red-800 rounded">{error}</div>}

          {/* Basic Information */}
          <div className="bg-white rounded-lg shadow-sm">
            <div className="p-4 border-b border-gray-200">
              <h2 className="text-navy">{t('basicInformation')}</h2>
            </div>
            <div className="p-4 space-y-4">
              <Field label={t('firstName')}>
                <input type="text" value={firstName} onChange={(e) => setFirstName(e.target.value)} className={inputCls} />
              </Field>
              <Field label={t('lastName')}>
                <input type="text" value={lastName} onChange={(e) => setLastName(e.target.value)} className={inputCls} />
              </Field>
              <Field label={t('username')}>
                <input type="text" value={username} onChange={(e) => setUsername(e.target.value)} maxLength={24} className={inputCls} />
                {username.trim() !== '' && usernameProblem(username) && (
                  <p className="text-red-500 text-xs mt-1.5">{t(usernameProblem(username)!)}</p>
                )}
              </Field>
              <Field label={t('jobTitle')} icon={<Briefcase className="w-4 h-4" />}>
                <input type="text" value={jobTitle} onChange={(e) => setJobTitle(e.target.value)} className={inputCls} placeholder={t('jobTitlePlaceholder')} />
              </Field>
              <Field label={t('bio')}>
                <textarea
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  rows={4}
                  className={`${inputCls} resize-none`}
                  placeholder={t('bioPlaceholder')}
                />
                <p className="text-sm text-gray-600 mt-1">{t('charactersCount', { count: bio.length })}</p>
              </Field>
              <Field label={t('birthday')} icon={<Calendar className="w-4 h-4" />}>
                <input type="date" value={birthday} onChange={(e) => setBirthday(e.target.value)} className={inputCls} />
              </Field>
            </div>
          </div>

          {/* Contact */}
          <div className="bg-white rounded-lg shadow-sm">
            <div className="p-4 border-b border-gray-200">
              <h2 className="text-navy">{t('contactInformation')}</h2>
            </div>
            <div className="p-4 space-y-4">
              <Field label={t('email')} icon={<Mail className="w-4 h-4" />}>
                <input type="email" value={email} disabled className={`${inputCls} bg-gray-100 text-gray-500 cursor-not-allowed`} />
              </Field>
              <Field label={t('phoneNumber')} icon={<Phone className="w-4 h-4" />}>
                <input type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} className={inputCls} dir="ltr" />
              </Field>
            </div>
          </div>

          {/* Social Links */}
          <div className="bg-white rounded-lg shadow-sm">
            <div className="p-4 border-b border-gray-200">
              <h2 className="text-navy">{t('socialLinks')}</h2>
            </div>
            <div className="p-4 space-y-4">
              <Field label={t('website')} icon={<Globe className="w-4 h-4" />}>
                <input type="url" value={website} onChange={(e) => setWebsite(e.target.value)} className={inputCls} placeholder="https://example.com" dir="ltr" />
              </Field>
              <Field label={t('instagram')} icon={<Instagram className="w-4 h-4" />}>
                <input type="text" value={instagram} onChange={(e) => setInstagram(e.target.value)} className={inputCls} placeholder="@username" dir="ltr" />
              </Field>
            </div>
          </div>

          <Button variant="brand" size="block" loading={saving} onClick={handleSave}>
            {t('saveChanges')}
          </Button>
        </div>
      </div>
    </div>
  );
}

const inputCls =
  'w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-transparent';

function Field({ label, icon, children }: { label: string; icon?: React.ReactNode; children: React.ReactNode }) {
  return (
    <div>
      <label className="text-gray-900 mb-2 flex items-center gap-2">
        {icon}
        {label}
      </label>
      {children}
    </div>
  );
}
