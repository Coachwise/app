import { ArrowLeft, User, Mail, Phone, MapPin, Calendar, Briefcase, Instagram, Globe, Camera, Save } from 'lucide-react';
import { useState, useRef } from 'react';
import { useLanguage } from '../contexts/LanguageContext';
import type { UserRole } from '../App';

interface ProfileSettingsProps {
  userRole: UserRole;
  onBack: () => void;
}

export function ProfileSettings({ userRole, onBack }: ProfileSettingsProps) {
  const { t } = useLanguage();
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // Profile data
  const [profileImage, setProfileImage] = useState('https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=200&h=200&fit=crop');
  const [coverImage, setCoverImage] = useState('https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=800&h=300&fit=crop');
  const [name, setName] = useState('Sarah Martinez');
  const [username, setUsername] = useState('@sarahmartinez');
  const [email, setEmail] = useState('sarah.martinez@email.com');
  const [phone, setPhone] = useState('+1 (555) 123-4567');
  const [bio, setBio] = useState('Certified strength & conditioning coach helping athletes reach their peak performance. 💪🏋️');
  const [location, setLocation] = useState('San Francisco, CA');
  const [birthday, setBirthday] = useState('1990-05-15');
  const [website, setWebsite] = useState('www.sarahcoaching.com');
  const [instagram, setInstagram] = useState('@sarahcoach');
  
  // Coach-specific fields
  const [specialization, setSpecialization] = useState('Strength Training, Olympic Lifting');
  const [certification, setCertification] = useState('NSCA-CSCS, USAW Level 2');
  const [experience, setExperience] = useState('8 years');
  const [rate, setRate] = useState('$75/session');
  
  const [uploadingImage, setUploadingImage] = useState<'profile' | 'cover' | null>(null);

  const handleImageSelect = (event: React.ChangeEvent<HTMLInputElement>, type: 'profile' | 'cover') => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onloadend = () => {
      if (type === 'profile') {
        setProfileImage(reader.result as string);
      } else {
        setCoverImage(reader.result as string);
      }
      setUploadingImage(null);
    };
    reader.readAsDataURL(file);
  };

  const handleSave = () => {
    // In a real app, save to backend
    onBack();
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
              <h1 className="text-white text-xl">Profile Settings</h1>
            </div>
          </div>
          <button
            onClick={handleSave}
            className="flex items-center gap-2 px-4 py-2 bg-yellow-500 text-[#0E0E55] rounded-lg hover:bg-yellow-400 transition-colors"
          >
            <Save className="w-4 h-4" />
            <span className="text-sm">Save</span>
          </button>
        </div>
      </div>

      <div className="max-w-2xl mx-auto">
        {/* Cover Image */}
        <div className="relative h-48 bg-gray-300">
          <img 
            src={coverImage} 
            alt="Cover"
            className="w-full h-full object-cover"
          />
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
            <img 
              src={profileImage} 
              alt={name}
              className="w-32 h-32 rounded-full border-4 border-white object-cover"
            />
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
          {/* Basic Information Section */}
          <div className="bg-white rounded-lg shadow-sm">
            <div className="p-4 border-b border-gray-200">
              <h2 className="text-[#0E0E55]">Basic Information</h2>
            </div>
            
            <div className="p-4 space-y-4">
              {/* Full Name */}
              <div>
                <label className="block text-gray-900 mb-2">
                  Full Name
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-transparent"
                />
              </div>

              {/* Username */}
              <div>
                <label className="block text-gray-900 mb-2">
                  Username
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
                  Bio
                </label>
                <textarea
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  rows={4}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-transparent resize-none"
                  placeholder="Tell us about yourself..."
                />
                <p className="text-sm text-gray-600 mt-1">
                  {bio.length}/200 characters
                </p>
              </div>

              {/* Location */}
              <div>
                <label className="block text-gray-900 mb-2 flex items-center gap-2">
                  <MapPin className="w-4 h-4" />
                  Location
                </label>
                <input
                  type="text"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-transparent"
                  placeholder="City, Country"
                />
              </div>

              {/* Birthday */}
              <div>
                <label className="block text-gray-900 mb-2 flex items-center gap-2">
                  <Calendar className="w-4 h-4" />
                  Birthday
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
              <h2 className="text-[#0E0E55]">Contact Information</h2>
            </div>
            
            <div className="p-4 space-y-4">
              {/* Email */}
              <div>
                <label className="block text-gray-900 mb-2 flex items-center gap-2">
                  <Mail className="w-4 h-4" />
                  Email
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
                  Phone Number
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
              <h2 className="text-[#0E0E55]">Social Links</h2>
            </div>
            
            <div className="p-4 space-y-4">
              {/* Website */}
              <div>
                <label className="block text-gray-900 mb-2 flex items-center gap-2">
                  <Globe className="w-4 h-4" />
                  Website
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
                  Instagram
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
                  Professional Information
                </h2>
              </div>
              
              <div className="p-4 space-y-4">
                {/* Specialization */}
                <div>
                  <label className="block text-gray-900 mb-2">
                    Specialization
                  </label>
                  <input
                    type="text"
                    value={specialization}
                    onChange={(e) => setSpecialization(e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-transparent"
                    placeholder="e.g., Strength Training, Olympic Lifting"
                  />
                </div>

                {/* Certifications */}
                <div>
                  <label className="block text-gray-900 mb-2">
                    Certifications
                  </label>
                  <input
                    type="text"
                    value={certification}
                    onChange={(e) => setCertification(e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-transparent"
                    placeholder="e.g., NSCA-CSCS, ACE"
                  />
                </div>

                {/* Years of Experience */}
                <div>
                  <label className="block text-gray-900 mb-2">
                    Years of Experience
                  </label>
                  <input
                    type="text"
                    value={experience}
                    onChange={(e) => setExperience(e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-transparent"
                    placeholder="e.g., 5 years"
                  />
                </div>

                {/* Session Rate */}
                <div>
                  <label className="block text-gray-900 mb-2">
                    Session Rate
                  </label>
                  <input
                    type="text"
                    value={rate}
                    onChange={(e) => setRate(e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-transparent"
                    placeholder="e.g., $50/session"
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
            Save Changes
          </button>
        </div>
      </div>
    </div>
  );
}
