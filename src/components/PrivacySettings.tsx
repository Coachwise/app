import { Lock, Eye, EyeOff, Shield, UserX, Bell, Mail, Users, Globe, ChevronRight } from 'lucide-react';
import { BackButton } from './ui/back-button';
import { useState } from 'react';
import { useLanguage } from '../contexts/LanguageContext';

interface PrivacySettingsProps {
  onBack: () => void;
}

export function PrivacySettings({ onBack }: PrivacySettingsProps) {
  const { t } = useLanguage();
  const [profileVisibility, setProfileVisibility] = useState<'public' | 'followers' | 'private'>('public');
  const [workoutVisibility, setWorkoutVisibility] = useState<'public' | 'followers' | 'private'>('public');
  const [allowMessages, setAllowMessages] = useState<'everyone' | 'followers' | 'coaches'>('everyone');
  const [showEmail, setShowEmail] = useState(false);
  const [showPhone, setShowPhone] = useState(false);
  const [allowTagging, setAllowTagging] = useState(true);
  const [showActivity, setShowActivity] = useState(true);
  const [allowFollowRequests, setAllowFollowRequests] = useState(true);
  const [twoFactorEnabled, setTwoFactorEnabled] = useState(false);
  const [showBlockedUsers, setShowBlockedUsers] = useState(false);

  // No block API yet — show a real (empty) list rather than a mock user.
  const blockedUsers: { id: string; name: string; username: string; avatar: string }[] = [];

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      {/* Header */}
      <div className="bg-card border-b border-border px-4 py-4 sticky top-0 z-10">
        <div className="flex items-center gap-3">
          <BackButton onClick={onBack} aria-label={t('back')} />
          <div className="flex items-center gap-2">
            <Shield className="w-6 h-6 text-tint-ink" />
            <h1 className="text-foreground text-xl">{t('privacySecurity')}</h1>
          </div>
        </div>
      </div>

      <div className="max-w-2xl mx-auto p-4 space-y-6">
        {/* Account Privacy Section */}
        <div className="bg-card rounded-lg shadow-sm">
          <div className="p-4 border-b border-gray-200">
            <h2 className="text-foreground flex items-center gap-2">
              <Lock className="w-5 h-5" />
              {t('accountPrivacy')}
            </h2>
          </div>
          
          <div className="p-4 space-y-4">
            {/* Profile Visibility */}
            <div>
              <label className="block text-gray-900 mb-2">
                {t('profileVisibility')}
              </label>
              <p className="text-sm text-gray-600 mb-3">
                {t('profileVisibilityDesc')}
              </p>
              <select
                value={profileVisibility}
                onChange={(e) => setProfileVisibility(e.target.value as any)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-transparent"
              >
                <option value="public">{t('visibilityPublic')}</option>
                <option value="followers">{t('followersOnly')}</option>
                <option value="private">{t('visibilityPrivate')}</option>
              </select>
            </div>

            {/* Workout Visibility */}
            <div className="pt-4 border-t border-gray-200">
              <label className="block text-gray-900 mb-2">
                {t('workoutVisibility')}
              </label>
              <p className="text-sm text-gray-600 mb-3">
                {t('workoutVisibilityDesc')}
              </p>
              <select
                value={workoutVisibility}
                onChange={(e) => setWorkoutVisibility(e.target.value as any)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-transparent"
              >
                <option value="public">{t('visibilityPublic')}</option>
                <option value="followers">{t('followersOnly')}</option>
                <option value="private">{t('visibilityPrivate')}</option>
              </select>
            </div>

            {/* Show Email */}
            <div className="pt-4 border-t border-gray-200">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <label className="block text-gray-900">
                    {t('showEmailProfile')}
                  </label>
                  <p className="text-sm text-gray-600 mt-1">
                    {t('showEmailDesc')}
                  </p>
                </div>
                <button
                  onClick={() => setShowEmail(!showEmail)}
                  className={`relative w-14 h-8 rounded-full transition-colors ${
                    showEmail ? 'bg-yellow-500' : 'bg-gray-300'
                  }`}
                >
                  <div
                    className={`absolute top-1 left-1 w-6 h-6 bg-card rounded-full transition-transform ${
                      showEmail ? 'translate-x-6' : 'translate-x-0'
                    }`}
                  />
                </button>
              </div>
            </div>

            {/* Show Phone */}
            <div className="pt-4 border-t border-gray-200">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <label className="block text-gray-900">
                    {t('showPhoneNumber')}
                  </label>
                  <p className="text-sm text-gray-600 mt-1">
                    {t('showPhoneDesc')}
                  </p>
                </div>
                <button
                  onClick={() => setShowPhone(!showPhone)}
                  className={`relative w-14 h-8 rounded-full transition-colors ${
                    showPhone ? 'bg-yellow-500' : 'bg-gray-300'
                  }`}
                >
                  <div
                    className={`absolute top-1 left-1 w-6 h-6 bg-card rounded-full transition-transform ${
                      showPhone ? 'translate-x-6' : 'translate-x-0'
                    }`}
                  />
                </button>
              </div>
            </div>

            {/* Show Activity Status */}
            <div className="pt-4 border-t border-gray-200">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <label className="block text-gray-900">
                    {t('showActivityStatus')}
                  </label>
                  <p className="text-sm text-gray-600 mt-1">
                    {t('showActivityDesc')}
                  </p>
                </div>
                <button
                  onClick={() => setShowActivity(!showActivity)}
                  className={`relative w-14 h-8 rounded-full transition-colors ${
                    showActivity ? 'bg-yellow-500' : 'bg-gray-300'
                  }`}
                >
                  <div
                    className={`absolute top-1 left-1 w-6 h-6 bg-card rounded-full transition-transform ${
                      showActivity ? 'translate-x-6' : 'translate-x-0'
                    }`}
                  />
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Interactions Section */}
        <div className="bg-card rounded-lg shadow-sm">
          <div className="p-4 border-b border-gray-200">
            <h2 className="text-foreground flex items-center gap-2">
              <Users className="w-5 h-5" />
              {t('interactions')}
            </h2>
          </div>
          
          <div className="p-4 space-y-4">
            {/* Allow Messages From */}
            <div>
              <label className="block text-gray-900 mb-2">
                {t('allowMessagesFrom')}
              </label>
              <p className="text-sm text-gray-600 mb-3">
                {t('allowMessagesDesc')}
              </p>
              <select
                value={allowMessages}
                onChange={(e) => setAllowMessages(e.target.value as any)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-transparent"
              >
                <option value="everyone">{t('everyone')}</option>
                <option value="followers">{t('followersIFollow')}</option>
                <option value="coaches">{t('coachesOnly')}</option>
              </select>
            </div>

            {/* Allow Tagging */}
            <div className="pt-4 border-t border-gray-200">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <label className="block text-gray-900">
                    {t('allowTagging')}
                  </label>
                  <p className="text-sm text-gray-600 mt-1">
                    {t('allowTaggingDesc')}
                  </p>
                </div>
                <button
                  onClick={() => setAllowTagging(!allowTagging)}
                  className={`relative w-14 h-8 rounded-full transition-colors ${
                    allowTagging ? 'bg-yellow-500' : 'bg-gray-300'
                  }`}
                >
                  <div
                    className={`absolute top-1 left-1 w-6 h-6 bg-card rounded-full transition-transform ${
                      allowTagging ? 'translate-x-6' : 'translate-x-0'
                    }`}
                  />
                </button>
              </div>
            </div>

            {/* Allow Follow Requests */}
            <div className="pt-4 border-t border-gray-200">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <label className="block text-gray-900">
                    {t('allowFollowRequests')}
                  </label>
                  <p className="text-sm text-gray-600 mt-1">
                    {t('allowFollowRequestsDesc')}
                  </p>
                </div>
                <button
                  onClick={() => setAllowFollowRequests(!allowFollowRequests)}
                  className={`relative w-14 h-8 rounded-full transition-colors ${
                    allowFollowRequests ? 'bg-yellow-500' : 'bg-gray-300'
                  }`}
                >
                  <div
                    className={`absolute top-1 left-1 w-6 h-6 bg-card rounded-full transition-transform ${
                      allowFollowRequests ? 'translate-x-6' : 'translate-x-0'
                    }`}
                  />
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Security Section */}
        <div className="bg-card rounded-lg shadow-sm">
          <div className="p-4 border-b border-gray-200">
            <h2 className="text-foreground flex items-center gap-2">
              <Shield className="w-5 h-5" />
              {t('security')}
            </h2>
          </div>
          
          <div className="p-4 space-y-4">
            {/* Change Password */}
            <button className="w-full flex items-center justify-between p-3 hover:bg-gray-50 rounded-lg transition-colors">
              <div className="flex items-center gap-3">
                <Lock className="w-5 h-5 text-foreground" />
                <div className="text-left">
                  <p className="text-gray-900">{t('changePassword')}</p>
                  <p className="text-sm text-gray-600">{t('changePasswordDesc')}</p>
                </div>
              </div>
              <ChevronRight className="w-5 h-5 text-gray-400" />
            </button>

            {/* Two-Factor Authentication */}
            <div className="pt-4 border-t border-gray-200">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3 flex-1">
                  <Shield className="w-5 h-5 text-foreground" />
                  <div>
                    <label className="block text-gray-900">
                      {t('twoFactorAuth')}
                    </label>
                    <p className="text-sm text-gray-600 mt-1">
                      {t('twoFactorDesc')}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setTwoFactorEnabled(!twoFactorEnabled)}
                  className={`relative w-14 h-8 rounded-full transition-colors ${
                    twoFactorEnabled ? 'bg-yellow-500' : 'bg-gray-300'
                  }`}
                >
                  <div
                    className={`absolute top-1 left-1 w-6 h-6 bg-card rounded-full transition-transform ${
                      twoFactorEnabled ? 'translate-x-6' : 'translate-x-0'
                    }`}
                  />
                </button>
              </div>
            </div>

            {/* Login Activity */}
            <button className="w-full flex items-center justify-between p-3 hover:bg-gray-50 rounded-lg transition-colors border-t border-gray-200 pt-4">
              <div className="flex items-center gap-3">
                <Eye className="w-5 h-5 text-foreground" />
                <div className="text-left">
                  <p className="text-gray-900">{t('loginActivity')}</p>
                  <p className="text-sm text-gray-600">{t('loginActivityDesc')}</p>
                </div>
              </div>
              <ChevronRight className="w-5 h-5 text-gray-400" />
            </button>
          </div>
        </div>

        {/* Blocked Users Section */}
        <div className="bg-card rounded-lg shadow-sm">
          <button
            onClick={() => setShowBlockedUsers(!showBlockedUsers)}
            className="w-full p-4 border-b border-gray-200 flex items-center justify-between"
          >
            <h2 className="text-foreground flex items-center gap-2">
              <UserX className="w-5 h-5" />
              {t('blockedUsers', { count: blockedUsers.length })}
            </h2>
            <ChevronRight className={`w-5 h-5 text-gray-400 transition-transform ${showBlockedUsers ? 'rotate-90' : ''}`} />
          </button>
          
          {showBlockedUsers && (
            <div className="p-4">
              {blockedUsers.length === 0 ? (
                <p className="text-gray-600 text-center py-4">{t('noBlockedUsers')}</p>
              ) : (
                <div className="space-y-3">
                  {blockedUsers.map((user) => (
                    <div key={user.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div className="flex items-center gap-3">
                        <img 
                          src={user.avatar} 
                          alt={user.name}
                          className="w-10 h-10 rounded-full object-cover"
                        />
                        <div>
                          <p className="text-gray-900">{user.name}</p>
                          <p className="text-sm text-gray-600">{user.username}</p>
                        </div>
                      </div>
                      <button className="px-4 py-2 bg-tint text-tint-fg rounded-lg hover:bg-tint-2 transition-colors text-sm">
                        {t('unblock')}
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Data & Account Section */}
        <div className="bg-card rounded-lg shadow-sm">
          <div className="p-4 border-b border-gray-200">
            <h2 className="text-foreground flex items-center gap-2">
              <Globe className="w-5 h-5" />
              {t('dataAccount')}
            </h2>
          </div>
          
          <div className="p-4 space-y-4">
            <button className="w-full flex items-center justify-between p-3 hover:bg-gray-50 rounded-lg transition-colors">
              <div className="text-left">
                <p className="text-gray-900">{t('downloadData')}</p>
                <p className="text-sm text-gray-600">{t('downloadDataDesc')}</p>
              </div>
              <ChevronRight className="w-5 h-5 text-gray-400" />
            </button>

            <button className="w-full flex items-center justify-between p-3 hover:bg-gray-50 rounded-lg transition-colors border-t border-gray-200 pt-4">
              <div className="text-left">
                <p className="text-gray-900">{t('deactivateAccount')}</p>
                <p className="text-sm text-gray-600">{t('deactivateDesc')}</p>
              </div>
              <ChevronRight className="w-5 h-5 text-gray-400" />
            </button>

            <button className="w-full flex items-center justify-between p-3 hover:bg-red-50 rounded-lg transition-colors border-t border-gray-200 pt-4">
              <div className="text-left">
                <p className="text-red-500">{t('deleteAccount')}</p>
                <p className="text-sm text-red-400">{t('deleteAccountDesc')}</p>
              </div>
              <ChevronRight className="w-5 h-5 text-red-400" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
