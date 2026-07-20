import { useEffect, useRef, useState } from 'react';
import { Camera, User as UserIcon, AtSign, Loader2, Check, X } from 'lucide-react';
import { Button } from './ui/button';
import { Brand } from './ui/logo';
import { useAuth } from '../contexts/AuthContext';
import { useLanguage } from '../contexts/LanguageContext';
import * as UsersAPI from '../api/users';
import * as MediaAPI from '../api/media';
import * as AuthAPI from '../api/auth';
import { errorText } from '../api/errors';
import { prepareImage, UnsupportedImageError, type PreparedImage } from '../lib/image';
import { setTheme, accentForGender } from '../lib/theme';
import type { Gender } from '../api/types';
import { AvatarCropper } from './AvatarCropper';

interface OnboardingProps {
  onDone: () => void;
}

// A username is 5–24 letters and digits, matching the API's binding rule
// (min=5,max=24,alphanum). Returns the translation key of the problem, or null.
function usernameProblem(raw: string): string | null {
  const handle = raw.trim().replace(/^@+/, '');
  if (handle.length < 5 || handle.length > 24) return 'usernameLength';
  if (!/^[a-zA-Z0-9]+$/.test(handle)) return 'usernameCharset';
  return null;
}

// Shown once after a first (typically phone) login, before the app: the
// passwordless account has an auto username and no name, so we collect the
// essentials that make the app usable. Everything else lives in profile settings.
export function Onboarding({ onDone }: OnboardingProps) {
  const { user, tokens, refreshUser } = useAuth();
  const { t, isRTL } = useLanguage();
  const fileRef = useRef<HTMLInputElement>(null);

  const [firstName, setFirstName] = useState(user?.first_name ?? '');
  const [lastName, setLastName] = useState(user?.last_name ?? '');
  const [username, setUsername] = useState(user?.username ?? '');
  const [gender, setGender] = useState<Gender>(user?.gender ?? 'UNSPECIFIED');
  const [avatarId, setAvatarId] = useState<string | null>(user?.avatar_id ?? null);
  const [avatarUrl, setAvatarUrl] = useState<string | null>(user?.avatar?.url ?? null);
  const [uploading, setUploading] = useState(false);
  const [pending, setPending] = useState<PreparedImage | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  // Check username availability as they type (debounced) so we catch a clash
  // before submitting rather than surfacing a server error.
  const [usernameStatus, setUsernameStatus] = useState<'idle' | 'checking' | 'available' | 'taken'>('idle');

  useEffect(() => {
    const handle = username.trim().replace(/^@/, '');
    // Don't ask the server whether an invalid handle is free — the form already
    // knows the answer is "you can't have it either way".
    if (!handle || handle === user?.username || usernameProblem(handle)) {
      setUsernameStatus('idle');
      return;
    }
    setUsernameStatus('checking');
    const timer = setTimeout(async () => {
      try {
        const res = await AuthAPI.preRegister({ username: handle });
        setUsernameStatus(res.username === 'EXISTS' ? 'taken' : 'available');
      } catch {
        setUsernameStatus('idle');
      }
    }, 400);
    return () => clearTimeout(timer);
  }, [username, user?.username]);

  const iconSide = isRTL ? 'right-3' : 'left-3';
  const inputPad = isRTL ? 'pr-10 pl-4' : 'pl-10 pr-4';
  const inputCls = `w-full bg-gray-50 border border-gray-200 rounded-lg py-3 ${inputPad} text-foreground focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:border-transparent`;

  // Picking a photo opens the cropper; the upload happens once it's framed.
  const handleAvatar = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    setError(null);
    try {
      setPending(await prepareImage(file));
    } catch (err) {
      setError(err instanceof UnsupportedImageError ? t('imageFormatUnsupported') : errorText(t, err));
    }
  };

  const closeCropper = () => {
    pending?.release();
    setPending(null);
  };

  // Picking gender previews the matching brand theme instantly (azure for men,
  // pink for women); it's saved with the profile and changeable later in Appearance.
  const chooseGender = (g: Gender) => {
    setGender(g);
    setTheme({ accent: accentForGender(g) });
  };

  const uploadAvatar = async (avatar: File) => {
    if (!tokens?.access_token) return;
    setUploading(true);
    try {
      const media = await MediaAPI.uploadMedia(tokens.access_token, avatar);
      setAvatarId(media.id);
      setAvatarUrl(media.url);
      closeCropper();
    } catch (err) {
      setError(errorText(t, err));
    } finally {
      setUploading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!tokens?.access_token) return;
    if (!firstName.trim()) { setError(t('firstNameRequired')); return; }
    if (!lastName.trim()) { setError(t('lastNameRequired')); return; }
    if (!username.trim()) { setError(t('usernameRequired')); return; }
    const problem = usernameProblem(username);
    if (problem) { setError(t(problem)); return; }
    if (usernameStatus === 'taken') { setError(t('usernameExists')); return; }
    setSaving(true);
    setError(null);
    try {
      await UsersAPI.updateMe(tokens.access_token, {
        first_name: firstName.trim(),
        last_name: lastName.trim(),
        username: username.trim().replace(/^@/, ''),
        avatar_id: avatarId || undefined,
        gender,
      });
      await refreshUser();
      onDone();
    } catch (err) {
      setError(errorText(t, err));
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-tint flex items-center justify-center p-4">
      {pending && (
        <AvatarCropper image={pending} busy={uploading} onCancel={closeCropper} onDone={uploadAvatar} />
      )}
      <div className="w-full max-w-md">
        <div className="text-center mb-6">
          <Brand name={t('appName')} tile="yellow" size="sm" className="text-tint-fg mb-3" />
          <h1 className="text-foreground text-2xl mb-1">{t('welcomeToCoachwise')}</h1>
          <p className="text-muted-foreground text-sm">{t('completeProfileHint')}</p>
        </div>

        <div className="bg-card rounded-2xl shadow-2xl p-6">
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && <div className="bg-red-50 text-red-700 border border-red-200 rounded-lg p-3 text-sm">{error}</div>}

            {/* Avatar (optional) */}
            <div className="flex justify-center">
              <button
                type="button"
                onClick={() => fileRef.current?.click()}
                className="relative w-24 h-24 rounded-full bg-gray-100 border-2 border-dashed border-gray-300 overflow-hidden flex items-center justify-center hover:border-yellow-500 transition-colors"
              >
                {avatarUrl ? (
                  <img src={avatarUrl} alt="" className="w-full h-full object-cover" />
                ) : (
                  <UserIcon className="w-9 h-9 text-gray-400" />
                )}
                <span className="absolute bottom-0 inset-x-0 bg-black/40 py-1 flex items-center justify-center">
                  {uploading ? <Loader2 className="w-4 h-4 text-white animate-spin" /> : <Camera className="w-4 h-4 text-white" />}
                </span>
              </button>
              <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleAvatar} />
            </div>

            <div className="flex gap-3">
              <div className="flex-1">
                <label className="block text-foreground text-sm mb-2">{t('firstName')}</label>
                <div className="relative">
                  <UserIcon className={`absolute top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 ${iconSide}`} />
                  <input value={firstName} onChange={(e) => setFirstName(e.target.value)} placeholder={t('firstNamePlaceholder')} className={inputCls} required autoFocus />
                </div>
              </div>
              <div className="flex-1">
                <label className="block text-foreground text-sm mb-2">{t('lastName')}</label>
                <input value={lastName} onChange={(e) => setLastName(e.target.value)} placeholder={t('lastNamePlaceholder')} className="w-full bg-gray-50 border border-gray-200 rounded-lg py-3 px-4 text-foreground focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:border-transparent" required />
              </div>
            </div>

            <div>
              <label className="block text-foreground text-sm mb-2">{t('gender')}</label>
              <div className="grid grid-cols-2 gap-3">
                {([['MALE', 'genderMale'], ['FEMALE', 'genderFemale']] as const).map(([g, key]) => (
                  <button
                    key={g}
                    type="button"
                    onClick={() => chooseGender(g)}
                    aria-pressed={gender === g}
                    className={`py-3 rounded-lg border text-sm font-medium transition-colors ${
                      gender === g
                        ? 'bg-tint text-tint-fg border-tint'
                        : 'bg-gray-50 text-foreground border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    {t(key)}
                  </button>
                ))}
              </div>
              <p className="text-gray-400 text-xs mt-1.5">{t('genderHint')}</p>
            </div>

            <div>
              <label className="block text-foreground text-sm mb-2">{t('username')}</label>
              <div className="relative">
                <AtSign className={`absolute top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 ${iconSide}`} />
                <input
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="yourname"
                  maxLength={24}
                  className={inputCls}
                  required
                />
                <span className={`absolute top-1/2 -translate-y-1/2 ${isRTL ? 'left-3' : 'right-3'}`}>
                  {usernameStatus === 'checking' && <Loader2 className="w-4 h-4 text-gray-400 animate-spin" />}
                  {usernameStatus === 'available' && <Check className="w-4 h-4 text-green-600" />}
                  {(usernameStatus === 'taken' || (username.trim() !== '' && usernameProblem(username))) && (
                    <X className="w-4 h-4 text-red-500" />
                  )}
                </span>
              </div>
              {username.trim() !== '' && usernameProblem(username) ? (
                <p className="text-red-500 text-xs mt-1.5">{t(usernameProblem(username)!)}</p>
              ) : usernameStatus === 'taken' ? (
                <p className="text-red-500 text-xs mt-1.5">{t('usernameExists')}</p>
              ) : usernameStatus === 'available' ? (
                <p className="text-green-600 text-xs mt-1.5">{t('usernameAvailable')}</p>
              ) : (
                <p className="text-gray-400 text-xs mt-1.5">{t('usernameHint')}</p>
              )}
            </div>

            <Button type="submit" variant="brand" size="block" loading={saving} disabled={uploading || usernameStatus === 'taken' || usernameStatus === 'checking'}>
              {saving ? t('pleaseWait') : t('continueLabel')}
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
}
