import { ArrowLeft, Lock, Eye, EyeOff, Shield, UserX, Bell, Mail, Users, Globe, ChevronRight } from 'lucide-react';
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

  const blockedUsers = [
    { id: '1', name: 'John Doe', username: '@johndoe', avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=100&h=100&fit=crop' },
  ];

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      {/* Header */}
      <div className="bg-[#0E0E55] px-4 py-4 sticky top-0 z-10">
        <div className="flex items-center gap-3">
          <button 
            onClick={onBack}
            className="p-2 -ml-2 hover:bg-[#1A1A6E] rounded-lg transition-colors"
          >
            <ArrowLeft className="w-6 h-6 text-white" />
          </button>
          <div className="flex items-center gap-2">
            <Shield className="w-6 h-6 text-yellow-500" />
            <h1 className="text-white text-xl">Privacy & Security</h1>
          </div>
        </div>
      </div>

      <div className="max-w-2xl mx-auto p-4 space-y-6">
        {/* Account Privacy Section */}
        <div className="bg-white rounded-lg shadow-sm">
          <div className="p-4 border-b border-gray-200">
            <h2 className="text-[#0E0E55] flex items-center gap-2">
              <Lock className="w-5 h-5" />
              Account Privacy
            </h2>
          </div>
          
          <div className="p-4 space-y-4">
            {/* Profile Visibility */}
            <div>
              <label className="block text-gray-900 mb-2">
                Profile Visibility
              </label>
              <p className="text-sm text-gray-600 mb-3">
                Control who can see your profile information
              </p>
              <select
                value={profileVisibility}
                onChange={(e) => setProfileVisibility(e.target.value as any)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-transparent"
              >
                <option value="public">Public - Anyone can view</option>
                <option value="followers">Followers Only</option>
                <option value="private">Private - Only you</option>
              </select>
            </div>

            {/* Workout Visibility */}
            <div className="pt-4 border-t border-gray-200">
              <label className="block text-gray-900 mb-2">
                Workout Visibility
              </label>
              <p className="text-sm text-gray-600 mb-3">
                Control who can see your workouts and progress
              </p>
              <select
                value={workoutVisibility}
                onChange={(e) => setWorkoutVisibility(e.target.value as any)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-transparent"
              >
                <option value="public">Public - Anyone can view</option>
                <option value="followers">Followers Only</option>
                <option value="private">Private - Only you</option>
              </select>
            </div>

            {/* Show Email */}
            <div className="pt-4 border-t border-gray-200">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <label className="block text-gray-900">
                    Show Email on Profile
                  </label>
                  <p className="text-sm text-gray-600 mt-1">
                    Let others see your email address
                  </p>
                </div>
                <button
                  onClick={() => setShowEmail(!showEmail)}
                  className={`relative w-14 h-8 rounded-full transition-colors ${
                    showEmail ? 'bg-yellow-500' : 'bg-gray-300'
                  }`}
                >
                  <div
                    className={`absolute top-1 left-1 w-6 h-6 bg-white rounded-full transition-transform ${
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
                    Show Phone Number
                  </label>
                  <p className="text-sm text-gray-600 mt-1">
                    Let others see your phone number
                  </p>
                </div>
                <button
                  onClick={() => setShowPhone(!showPhone)}
                  className={`relative w-14 h-8 rounded-full transition-colors ${
                    showPhone ? 'bg-yellow-500' : 'bg-gray-300'
                  }`}
                >
                  <div
                    className={`absolute top-1 left-1 w-6 h-6 bg-white rounded-full transition-transform ${
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
                    Show Activity Status
                  </label>
                  <p className="text-sm text-gray-600 mt-1">
                    Let others see when you're active
                  </p>
                </div>
                <button
                  onClick={() => setShowActivity(!showActivity)}
                  className={`relative w-14 h-8 rounded-full transition-colors ${
                    showActivity ? 'bg-yellow-500' : 'bg-gray-300'
                  }`}
                >
                  <div
                    className={`absolute top-1 left-1 w-6 h-6 bg-white rounded-full transition-transform ${
                      showActivity ? 'translate-x-6' : 'translate-x-0'
                    }`}
                  />
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Interactions Section */}
        <div className="bg-white rounded-lg shadow-sm">
          <div className="p-4 border-b border-gray-200">
            <h2 className="text-[#0E0E55] flex items-center gap-2">
              <Users className="w-5 h-5" />
              Interactions
            </h2>
          </div>
          
          <div className="p-4 space-y-4">
            {/* Allow Messages From */}
            <div>
              <label className="block text-gray-900 mb-2">
                Allow Messages From
              </label>
              <p className="text-sm text-gray-600 mb-3">
                Control who can send you direct messages
              </p>
              <select
                value={allowMessages}
                onChange={(e) => setAllowMessages(e.target.value as any)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-transparent"
              >
                <option value="everyone">Everyone</option>
                <option value="followers">Followers I Follow Back</option>
                <option value="coaches">Coaches Only</option>
              </select>
            </div>

            {/* Allow Tagging */}
            <div className="pt-4 border-t border-gray-200">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <label className="block text-gray-900">
                    Allow Tagging in Posts
                  </label>
                  <p className="text-sm text-gray-600 mt-1">
                    Let others tag you in their posts
                  </p>
                </div>
                <button
                  onClick={() => setAllowTagging(!allowTagging)}
                  className={`relative w-14 h-8 rounded-full transition-colors ${
                    allowTagging ? 'bg-yellow-500' : 'bg-gray-300'
                  }`}
                >
                  <div
                    className={`absolute top-1 left-1 w-6 h-6 bg-white rounded-full transition-transform ${
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
                    Allow Follow Requests
                  </label>
                  <p className="text-sm text-gray-600 mt-1">
                    Let others send you follow requests
                  </p>
                </div>
                <button
                  onClick={() => setAllowFollowRequests(!allowFollowRequests)}
                  className={`relative w-14 h-8 rounded-full transition-colors ${
                    allowFollowRequests ? 'bg-yellow-500' : 'bg-gray-300'
                  }`}
                >
                  <div
                    className={`absolute top-1 left-1 w-6 h-6 bg-white rounded-full transition-transform ${
                      allowFollowRequests ? 'translate-x-6' : 'translate-x-0'
                    }`}
                  />
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Security Section */}
        <div className="bg-white rounded-lg shadow-sm">
          <div className="p-4 border-b border-gray-200">
            <h2 className="text-[#0E0E55] flex items-center gap-2">
              <Shield className="w-5 h-5" />
              Security
            </h2>
          </div>
          
          <div className="p-4 space-y-4">
            {/* Change Password */}
            <button className="w-full flex items-center justify-between p-3 hover:bg-gray-50 rounded-lg transition-colors">
              <div className="flex items-center gap-3">
                <Lock className="w-5 h-5 text-[#0E0E55]" />
                <div className="text-left">
                  <p className="text-gray-900">Change Password</p>
                  <p className="text-sm text-gray-600">Update your account password</p>
                </div>
              </div>
              <ChevronRight className="w-5 h-5 text-gray-400" />
            </button>

            {/* Two-Factor Authentication */}
            <div className="pt-4 border-t border-gray-200">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3 flex-1">
                  <Shield className="w-5 h-5 text-[#0E0E55]" />
                  <div>
                    <label className="block text-gray-900">
                      Two-Factor Authentication
                    </label>
                    <p className="text-sm text-gray-600 mt-1">
                      Add an extra layer of security
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
                    className={`absolute top-1 left-1 w-6 h-6 bg-white rounded-full transition-transform ${
                      twoFactorEnabled ? 'translate-x-6' : 'translate-x-0'
                    }`}
                  />
                </button>
              </div>
            </div>

            {/* Login Activity */}
            <button className="w-full flex items-center justify-between p-3 hover:bg-gray-50 rounded-lg transition-colors border-t border-gray-200 pt-4">
              <div className="flex items-center gap-3">
                <Eye className="w-5 h-5 text-[#0E0E55]" />
                <div className="text-left">
                  <p className="text-gray-900">Login Activity</p>
                  <p className="text-sm text-gray-600">See where you're logged in</p>
                </div>
              </div>
              <ChevronRight className="w-5 h-5 text-gray-400" />
            </button>
          </div>
        </div>

        {/* Blocked Users Section */}
        <div className="bg-white rounded-lg shadow-sm">
          <button
            onClick={() => setShowBlockedUsers(!showBlockedUsers)}
            className="w-full p-4 border-b border-gray-200 flex items-center justify-between"
          >
            <h2 className="text-[#0E0E55] flex items-center gap-2">
              <UserX className="w-5 h-5" />
              Blocked Users ({blockedUsers.length})
            </h2>
            <ChevronRight className={`w-5 h-5 text-gray-400 transition-transform ${showBlockedUsers ? 'rotate-90' : ''}`} />
          </button>
          
          {showBlockedUsers && (
            <div className="p-4">
              {blockedUsers.length === 0 ? (
                <p className="text-gray-600 text-center py-4">No blocked users</p>
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
                      <button className="px-4 py-2 bg-[#0E0E55] text-white rounded-lg hover:bg-[#1A1A6E] transition-colors text-sm">
                        Unblock
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Data & Account Section */}
        <div className="bg-white rounded-lg shadow-sm">
          <div className="p-4 border-b border-gray-200">
            <h2 className="text-[#0E0E55] flex items-center gap-2">
              <Globe className="w-5 h-5" />
              Data & Account
            </h2>
          </div>
          
          <div className="p-4 space-y-4">
            <button className="w-full flex items-center justify-between p-3 hover:bg-gray-50 rounded-lg transition-colors">
              <div className="text-left">
                <p className="text-gray-900">Download Your Data</p>
                <p className="text-sm text-gray-600">Get a copy of your information</p>
              </div>
              <ChevronRight className="w-5 h-5 text-gray-400" />
            </button>

            <button className="w-full flex items-center justify-between p-3 hover:bg-gray-50 rounded-lg transition-colors border-t border-gray-200 pt-4">
              <div className="text-left">
                <p className="text-gray-900">Deactivate Account</p>
                <p className="text-sm text-gray-600">Temporarily disable your account</p>
              </div>
              <ChevronRight className="w-5 h-5 text-gray-400" />
            </button>

            <button className="w-full flex items-center justify-between p-3 hover:bg-red-50 rounded-lg transition-colors border-t border-gray-200 pt-4">
              <div className="text-left">
                <p className="text-red-500">Delete Account</p>
                <p className="text-sm text-red-400">Permanently delete your account</p>
              </div>
              <ChevronRight className="w-5 h-5 text-red-400" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
