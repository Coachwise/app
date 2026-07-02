import { ArrowLeft, User, Mail, Phone, MapPin, Calendar, Briefcase, Instagram, Globe, Camera, Save } from 'lucide-react';
import { useState, useRef, useEffect } from 'react';
import { useLanguage } from '../contexts/LanguageContext';
import type { UserRole } from '../App';
import { useAuth } from '../contexts/AuthContext';
import * as UsersAPI from '../api/users';
import * as MediaAPI from '../api/media';

interface ProfileSettingsProps {
  userRole: UserRole;
  onBack: () => void;
}

export function ProfileSettings({ userRole, onBack }: ProfileSettingsProps) {
  const { t } = useLanguage();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { user, tokens, refreshUser } = useAuth();
  
  // Profile data
  const [profileImage, setProfileImage] = useState<string | null>(null);
  const [avatarId, setAvatarId] = useState<string | null>(null);
  const [coverImage, setCoverImage] = useState<string | null>(null);
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [bio, setBio] = useState('');
  const [location, setLocation] = useState('');
  const [birthday, setBirthday] = useState('');
  const [website, setWebsite] = useState('');
  const [instagram, setInstagram] = useState('');
  
  // Coach-specific fields
  const [specialization, setSpecialization] = useState('Strength Training, Olympic Lifting');
  const [certification, setCertification] = useState('NSCA-CSCS, USAW Level 2');
  const [experience, setExperience] = useState('8 years');
  const [rate, setRate] = useState('$75/session');
  
  const [uploadingImage, setUploadingImage] = useState<'profile' | 'cover' | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!user) return;
    setProfileImage(user.avatar?.url || null);
    setAvatarId(user.avatar_id || null);
    setFirstName(user.first_name || '');
    setLastName(user.last_name || '');
    setUsername(user.username || '');
    setEmail(user.email || '');
    setPhone(user.phone || '');
    setBio(user.bio || '');
  }, [user]);

  const handleImageSelect = async (event: React.ChangeEvent<HTMLInputElement>, type: 'profile' | 'cover') => {
    const file = event.target.files?.[0];
    if (!file) return;
    if (!tokens?.access_token) {
      setError(t('notAuthenticated'));
      return;
    }

    setUploadingImage(type);
    setError(null);
    try {
      if (type === 'profile') {
        const media = await MediaAPI.uploadMedia(tokens.access_token, file);
        setProfileImage(media.url);
        setAvatarId(media.id);
      } else {
        const reader = new FileReader();
        reader.onloadend = () => setCoverImage(reader.result as string);
        reader.readAsDataURL(file);
      }
    } catch (e) {
      const msg = e instanceof Error ? e.message : t('unableToUploadImage');
      setError(msg);
    } finally {
      setUploadingImage(null);
      event.target.value = '';
    }
  };

  const handleSave = async () => {
    if (!tokens?.access_token) {
      setError(t('notAuthenticated'));
      return;
    }
    setSaving(true);
    setError(null);
    try {
      await UsersAPI.updateMe(tokens.access_token, {
        first_name: firstName?.trim() || undefined,
        last_name: lastName?.trim() || undefined,
        username: username?.replace(/^@/, ''),
        bio: bio || undefined,
        phone: phone || undefined,
        job_title: specialization || undefined,
        avatar_id: avatarId || undefined,
      });
      await refreshUser();
      onBack();
    } catch (e) {
      const msg = e instanceof Error ? e.message : t('unableToSaveProfile');
      setError(msg);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      {/* Header */}
      <div className="bg-[#0E0E55] px-4 py-4 sticky top-0 z-10">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button 
              onClick={onBack}
              className="p-2 -ml-2 hover:bg-[#1A1A6E] rounded-lg transition-colors"
            >
              <ArrowLeft className="w-6 h-6 text-white" />
            </button>
            <div className="flex items-center gap-2">
              <User className="w-6 h-6 text-yellow-500" />
              <h1 className="text-white text-xl">{t('profileSettings')}</h1>
            </div>
          </div>
          <button
            onClick={handleSave}
            disabled={saving}
            className="flex items-center gap-2 px-4 py-2 bg-yellow-500 text-[#0E0E55] rounded-lg hover:bg-yellow-400 transition-colors disabled:opacity-60"
          >
            <Save className="w-4 h-4" />
            <span className="text-sm">{saving ? t('saving') : t('save')}</span>
          </button>
        </div>
      </div>

      <div className="max-w-2xl mx-auto">
        {/* Cover Image */}
        <div className="relative h-48 bg-gray-300">
          {coverImage ? (
            <img 
              src={coverImage} 
              alt={t('coverAlt')}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full bg-gradient-to-r from-[#0E0E55] to-[#1A1A6E]" />
          )}
          <button
            onClick={() => {
              setUploadingImage('cover');
              fileInputRef.current?.click();
            }}
            className="absolute bottom-4 right-4 p-3 bg-[#0E0E55]/80 text-white rounded-full hover:bg-[#0E0E55] transition-colors"
          >
            <Camera className="w-5 h-5" />
          </button>
        </div>

        {/* Profile Image */}
        <div className="px-4 -mt-16 mb-6">
          <div className="relative inline-block">
            {profileImage ? (
              <img 
                src={profileImage} 
                alt={(firstName || lastName) || 'Profile'} 
                className="w-32 h-32 rounded-full border-4 border-white object-cover"
              />
            ) : (
              <div className="w-32 h-32 rounded-full border-4 border-white bg-[#0E0E55]/10 flex items-center justify-center text-[#0E0E55] font-bold text-xl">
                {(firstName || lastName || 'User').split(' ').map((n) => n[0]).join('').slice(0, 2).toUpperCase() || 'U'}
              </div>
            )}
            <button
              onClick={() => {
                setUploadingImage('profile');
                fileInputRef.current?.click();
              }}
              className="absolute bottom-0 right-0 p-2 bg-[#0E0E55] text-white rounded-full hover:bg-[#1A1A6E] transition-colors border-2 border-white"
            >
              <Camera className="w-4 h-4" />
            </button>
          </div>
        </div>

        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={(e) => handleImageSelect(e, uploadingImage || 'profile')}
          className="hidden"
        />

        <div className="p-4 space-y-6">
          {error && <div className="p-3 bg-red-100 text-red-800 rounded">{error}</div>}
          {/* Basic Information Section */}
          <div className="bg-white rounded-lg shadow-sm">
            <div className="p-4 border-b border-gray-200">
              <h2 className="text-[#0E0E55]">{t('basicInformation')}</h2>
            </div>
            
            <div className="p-4 space-y-4">
              {/* First Name */}
              <div>
                <label className="block text-gray-900 mb-2">
                  {t('firstName')}
                </label>
                <input
                  type="text"
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-transparent"
                />
              </div>

              {/* Last Name */}
              <div>
                <label className="block text-gray-900 mb-2">
                  {t('lastName')}
                </label>
                <input
                  type="text"
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-transparent"
                />
              </div>

              {/* Username */}
              <div>
                <label className="block text-gray-900 mb-2">
                  {t('username')}
                </label>
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-transparent"
                />
              </div>

              {/* Bio */}
              <div>
                <label className="block text-gray-900 mb-2">
                  {t('bio')}
                </label>
                <textarea
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  rows={4}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-transparent resize-none"
                  placeholder={t('bioPlaceholder')}
                />
                <p className="text-sm text-gray-600 mt-1">
                  {t('charactersCount', { count: bio.length })}
                </p>
              </div>

              {/* Location */}
              <div>
                <label className="block text-gray-900 mb-2 flex items-center gap-2">
                  <MapPin className="w-4 h-4" />
                  {t('location')}
                </label>
                <input
                  type="text"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-transparent"
                  placeholder={t('cityCountry')}
                />
              </div>

              {/* Birthday */}
              <div>
                <label className="block text-gray-900 mb-2 flex items-center gap-2">
                  <Calendar className="w-4 h-4" />
                  {t('birthday')}
                </label>
                <input
                  type="date"
                  value={birthday}
                  onChange={(e) => setBirthday(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-transparent"
                />
              </div>
            </div>
          </div>

          {/* Contact Information Section */}
          <div className="bg-white rounded-lg shadow-sm">
            <div className="p-4 border-b border-gray-200">
              <h2 className="text-[#0E0E55]">{t('contactInformation')}</h2>
            </div>
            
            <div className="p-4 space-y-4">
              {/* Email */}
              <div>
                <label className="block text-gray-900 mb-2 flex items-center gap-2">
                  <Mail className="w-4 h-4" />
                  {t('email')}
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-transparent"
                />
              </div>

              {/* Phone */}
              <div>
                <label className="block text-gray-900 mb-2 flex items-center gap-2">
                  <Phone className="w-4 h-4" />
                  {t('phoneNumber')}
                </label>
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-transparent"
                />
              </div>
            </div>
          </div>

          {/* Social Links Section */}
          <div className="bg-white rounded-lg shadow-sm">
            <div className="p-4 border-b border-gray-200">
              <h2 className="text-[#0E0E55]">{t('socialLinks')}</h2>
            </div>
            
            <div className="p-4 space-y-4">
              {/* Website */}
              <div>
                <label className="block text-gray-900 mb-2 flex items-center gap-2">
                  <Globe className="w-4 h-4" />
                  {t('website')}
                </label>
                <input
                  type="url"
                  value={website}
                  onChange={(e) => setWebsite(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-transparent"
                  placeholder="www.example.com"
                />
              </div>

              {/* Instagram */}
              <div>
                <label className="block text-gray-900 mb-2 flex items-center gap-2">
                  <Instagram className="w-4 h-4" />
                  {t('instagram')}
                </label>
                <input
                  type="text"
                  value={instagram}
                  onChange={(e) => setInstagram(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-transparent"
                  placeholder="@username"
                />
              </div>
            </div>
          </div>

          {/* Coach-Specific Section */}
          {userRole === 'coach' && (
            <div className="bg-white rounded-lg shadow-sm">
              <div className="p-4 border-b border-gray-200">
                <h2 className="text-[#0E0E55] flex items-center gap-2">
                  <Briefcase className="w-5 h-5" />
                  {t('professionalInformation')}
                </h2>
              </div>
              
              <div className="p-4 space-y-4">
                {/* Specialization */}
                <div>
                  <label className="block text-gray-900 mb-2">
                    {t('specialization')}
                  </label>
                  <input
                    type="text"
                    value={specialization}
                    onChange={(e) => setSpecialization(e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-transparent"
                    placeholder={t('specializationPlaceholder')}
                  />
                </div>

                {/* Certifications */}
                <div>
                  <label className="block text-gray-900 mb-2">
                    {t('certifications')}
                  </label>
                  <input
                    type="text"
                    value={certification}
                    onChange={(e) => setCertification(e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-transparent"
                    placeholder={t('certificationsPlaceholder')}
                  />
                </div>

                {/* Years of Experience */}
                <div>
                  <label className="block text-gray-900 mb-2">
                    {t('yearsExperience')}
                  </label>
                  <input
                    type="text"
                    value={experience}
                    onChange={(e) => setExperience(e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-transparent"
                    placeholder={t('experiencePlaceholder')}
                  />
                </div>

                {/* Session Rate */}
                <div>
                  <label className="block text-gray-900 mb-2">
                    {t('sessionRate')}
                  </label>
                  <input
                    type="text"
                    value={rate}
                    onChange={(e) => setRate(e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-transparent"
                    placeholder={t('ratePlaceholder')}
                  />
                </div>
              </div>
            </div>
          )}

          {/* Save Button */}
          <button
            onClick={handleSave}
            className="w-full py-3 bg-[#0E0E55] text-white rounded-lg hover:bg-[#1A1A6E] transition-colors"
          >
            {t('saveChanges')}
          </button>
        </div>
      </div>
    </div>
  );
}
