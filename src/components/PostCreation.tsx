import { useState } from 'react';
import { ArrowLeft, Image, TrendingUp, Tag, Globe, Users, AlertTriangle, X, Video, Upload } from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';

interface PostCreationProps {
  onCancel: () => void;
  onPost: () => void;
}

export function PostCreation({ onCancel, onPost }: PostCreationProps) {
  const { t } = useLanguage();
  const [content, setContent] = useState('');
  const [privacy, setPrivacy] = useState<'public' | 'followers'>('public');
  const [contentWarning, setContentWarning] = useState(false);
  const [mediaType, setMediaType] = useState<'none' | 'image' | 'video'>('none');
  const [mediaPreview, setMediaPreview] = useState<string | null>(null);

  const handlePost = () => {
    if (content.trim()) {
      onPost();
    }
  };

  const handleMediaSelect = (type: 'image' | 'video') => {
    setMediaType(type);
    // Simulate file selection - in real app, would open file picker
    if (type === 'image') {
      setMediaPreview('https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=600&h=400&fit=crop');
    } else {
      setMediaPreview('https://images.unsplash.com/photo-1522163182402-834f871fd851?w=600&h=400&fit=crop');
    }
  };

  const clearMedia = () => {
    setMediaType('none');
    setMediaPreview(null);
  };

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Header */}
      <div className="bg-[#0E0E55] px-4 py-4 sticky top-0 z-10">
        <div className="flex items-center justify-between">
          <button onClick={onCancel} className="p-2 -ml-2 hover:bg-[#1A1A6E] rounded-lg transition-colors">
            <ArrowLeft className="w-6 h-6 text-white" />
          </button>
          <h2 className="text-white">{t('createPost')}</h2>
          <button
            onClick={handlePost}
            disabled={!content.trim()}
            className="px-4 py-2 bg-yellow-500 text-[#0E0E55] rounded-lg hover:bg-yellow-400 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
          >
            {t('post')}
          </button>
        </div>
      </div>

      <div className="p-4 space-y-4">
        {/* Post Content */}
        <div className="bg-white rounded-lg p-4 shadow-md border border-gray-200">
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder={t('shareProgressPlaceholder')}
            className="w-full h-32 p-3 border border-gray-300 rounded-lg resize-none focus:ring-2 focus:ring-yellow-500 focus:border-transparent text-[#0E0E55]"
          />

          {/* Media Preview */}
          {mediaPreview && (
            <div className="mt-3 relative">
              <img 
                src={mediaPreview} 
                alt="Media preview"
                className="w-full rounded-lg max-h-64 object-cover"
              />
              {mediaType === 'video' && (
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="w-12 h-12 bg-white/90 rounded-full flex items-center justify-center">
                    <Video className="w-6 h-6 text-[#0E0E55]" />
                  </div>
                </div>
              )}
              <button 
                onClick={clearMedia}
                className="absolute top-2 right-2 p-1 bg-black/50 rounded-full hover:bg-black/70 transition-colors"
              >
                <X className="w-4 h-4 text-white" />
              </button>
              <div className="absolute bottom-2 left-2 px-2 py-1 bg-black/50 rounded text-white text-xs">
                {mediaType === 'image' ? t('imageLabel') : t('videoLabel')}
              </div>
            </div>
          )}
        </div>

        {/* Media & Tags */}
        <div className="bg-white rounded-lg p-4 shadow-md border border-gray-200">
          <h3 className="text-[#0E0E55] mb-3">{t('addToYourPost')}</h3>
          <div className="space-y-3">
            <button 
              onClick={() => handleMediaSelect('image')}
              disabled={mediaType !== 'none'}
              className={`w-full flex items-center gap-3 p-3 rounded-lg transition-colors ${
                mediaType === 'image' 
                  ? 'bg-yellow-50 border-2 border-yellow-500' 
                  : mediaType === 'none'
                  ? 'bg-gray-50 hover:bg-gray-100 border-2 border-transparent'
                  : 'bg-gray-100 opacity-50 cursor-not-allowed border-2 border-transparent'
              }`}
            >
              <Image className="w-5 h-5 text-yellow-600" />
              <span className="text-[#0E0E55]">{t('addPhoto')}</span>
            </button>
            <button 
              onClick={() => handleMediaSelect('video')}
              disabled={mediaType !== 'none'}
              className={`w-full flex items-center gap-3 p-3 rounded-lg transition-colors ${
                mediaType === 'video' 
                  ? 'bg-yellow-50 border-2 border-yellow-500' 
                  : mediaType === 'none'
                  ? 'bg-gray-50 hover:bg-gray-100 border-2 border-transparent'
                  : 'bg-gray-100 opacity-50 cursor-not-allowed border-2 border-transparent'
              }`}
            >
              <Video className="w-5 h-5 text-yellow-600" />
              <span className="text-[#0E0E55]">{t('addVideo')}</span>
            </button>
            <button className="w-full flex items-center gap-3 p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors border-2 border-transparent">
              <TrendingUp className="w-5 h-5 text-yellow-600" />
              <span className="text-[#0E0E55]">{t('tagAsPR')}</span>
            </button>
            <button className="w-full flex items-center gap-3 p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors border-2 border-transparent">
              <Tag className="w-5 h-5 text-yellow-600" />
              <span className="text-[#0E0E55]">{t('addTags')}</span>
            </button>
          </div>
        </div>

        {/* Privacy Settings */}
        <div className="bg-white rounded-lg p-4 shadow-md border border-gray-200">
          <h3 className="text-[#0E0E55] mb-3">{t('whoCanSee')}</h3>
          <div className="space-y-3">
            <button
              onClick={() => setPrivacy('public')}
              className={`w-full flex items-center gap-3 p-3 rounded-lg transition-colors border-2 ${
                privacy === 'public' 
                  ? 'border-yellow-500 bg-yellow-50' 
                  : 'border-gray-200 bg-white hover:border-gray-300'
              }`}
            >
              <Globe className={`w-5 h-5 ${privacy === 'public' ? 'text-yellow-600' : 'text-gray-600'}`} />
              <div className="text-left">
                <div className={`${privacy === 'public' ? 'text-[#0E0E55]' : 'text-gray-900'}`}>{t('publicLabel')}</div>
                <div className="text-gray-600 text-sm">{t('anyoneCanSee')}</div>
              </div>
            </button>
            <button
              onClick={() => setPrivacy('followers')}
              className={`w-full flex items-center gap-3 p-3 rounded-lg transition-colors border-2 ${
                privacy === 'followers' 
                  ? 'border-yellow-500 bg-yellow-50' 
                  : 'border-gray-200 bg-white hover:border-gray-300'
              }`}
            >
              <Users className={`w-5 h-5 ${privacy === 'followers' ? 'text-yellow-600' : 'text-gray-600'}`} />
              <div className="text-left">
                <div className={`${privacy === 'followers' ? 'text-[#0E0E55]' : 'text-gray-900'}`}>{t('followersOnly')}</div>
                <div className="text-gray-600 text-sm">{t('onlyFollowersSee')}</div>
              </div>
            </button>
          </div>

          {/* Content Warning */}
          <div className="mt-4 pt-4 border-t border-gray-200">
            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={contentWarning}
                onChange={(e) => setContentWarning(e.target.checked)}
                className="w-5 h-5 text-yellow-600 rounded border-gray-300 focus:ring-yellow-500"
              />
              <div>
                <div className="text-[#0E0E55]">{t('addContentWarning')}</div>
                <div className="text-gray-600 text-sm">{t('forSensitiveContent')}</div>
              </div>
            </label>
          </div>
        </div>
      </div>
    </div>
  );
}