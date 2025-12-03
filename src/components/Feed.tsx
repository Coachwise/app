import { useState } from 'react';
import { Heart, MessageCircle, Share2, Trophy, Plus, Video } from 'lucide-react';
import { HamburgerMenu } from './HamburgerMenu';
import type { UserRole } from '../App';
import { useLanguage } from '../contexts/LanguageContext';

interface FeedProps {
  onCreatePost: () => void;
  userRole: UserRole;
  onNavigate: (view: string) => void;
}

interface Post {
  id: string;
  author: {
    name: string;
    username: string;
    avatar: string;
    isCoach: boolean;
  };
  content: string;
  timestamp: string;
  likes: number;
  comments: number;
  isLiked: boolean;
  isPR?: boolean;
  prDetails?: {
    exercise: string;
    weight: string;
    reps: number;
  };
  media?: {
    type: 'image' | 'video';
    url: string;
    thumbnail?: string;
  };
}

export function Feed({ onCreatePost, userRole, onNavigate }: FeedProps) {
  const { t } = useLanguage();
  const [posts, setPosts] = useState<Post[]>([
    {
      id: '1',
      author: {
        name: 'Sarah Martinez',
        username: '@sarahm',
        avatar: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=100&h=100&fit=crop',
        isCoach: true,
      },
      content: 'Just hit a new PR on deadlifts! 200kg × 3 reps 💪 The programming has been perfect lately.',
      timestamp: '2 hours ago',
      likes: 47,
      comments: 12,
      isLiked: false,
      isPR: true,
      prDetails: {
        exercise: 'Deadlift',
        weight: '200kg',
        reps: 3,
      },
      media: {
        type: 'image',
        url: 'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=600&h=400&fit=crop'
      }
    },
    {
      id: '2',
      author: {
        name: 'Mike Johnson',
        username: '@mikej',
        avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=100&h=100&fit=crop',
        isCoach: false,
      },
      content: 'Finally sent my project! V7 after 4 weeks of attempts 🧗',
      timestamp: '5 hours ago',
      likes: 89,
      comments: 23,
      isLiked: true,
      isPR: false,
      media: {
        type: 'video',
        url: 'https://images.unsplash.com/photo-1522163182402-834f871fd851?w=600&h=400&fit=crop',
        thumbnail: 'https://images.unsplash.com/photo-1522163182402-834f871fd851?w=600&h=400&fit=crop'
      }
    },
    {
      id: '3',
      author: {
        name: 'Alex Chen',
        username: '@alexc',
        avatar: 'https://images.unsplash.com/photo-1568602471122-7832951cc4c5?w=100&h=100&fit=crop',
        isCoach: false,
      },
      content: 'Recovery day thoughts: Don\'t underestimate the importance of rest. Your gains happen during recovery, not just in the gym!',
      timestamp: '1 day ago',
      likes: 156,
      comments: 34,
      isLiked: true,
      isPR: false,
    },
    {
      id: '4',
      author: {
        name: 'Jordan Smith',
        username: '@jordansmith',
        avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100&h=100&fit=crop',
        isCoach: true,
      },
      content: 'New training cycle starting next week! Focus on building a solid foundation with compound movements 🎯',
      timestamp: '2 days ago',
      likes: 203,
      comments: 45,
      isLiked: false,
      isPR: false,
    },
  ]);

  const toggleLike = (postId: string) => {
    setPosts(posts.map(post => 
      post.id === postId 
        ? { ...post, isLiked: !post.isLiked, likes: post.isLiked ? post.likes - 1 : post.likes + 1 }
        : post
    ));
  };

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Header */}
      <div className="bg-[#0E0E55] px-4 py-4 sticky top-0 z-10">
        <div className="flex items-center justify-between">
          <h1 className="text-white text-xl">{t('feed')}</h1>
          <HamburgerMenu 
            userRole={userRole}
            onNavigate={onNavigate}
          />
        </div>
      </div>

      {/* Posts */}
      <div className="space-y-4 p-4">
        {posts.map((post) => (
          <div key={post.id} className="bg-white rounded-lg p-4 shadow-md border border-gray-200">
            {/* User Info */}
            <div className="flex items-start gap-3 mb-3">
              <img 
                src={post.author.avatar} 
                alt={post.author.name}
                className="w-10 h-10 rounded-full object-cover"
              />
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <span className="text-[#0E0E55]">{post.author.name}</span>
                  {post.author.isCoach && (
                    <span className="px-2 py-0.5 bg-yellow-500 text-[#0E0E55] rounded text-xs">
                      Coach
                    </span>
                  )}
                </div>
                <span className="text-gray-500 text-sm">{post.timestamp}</span>
              </div>
            </div>

            {/* PR Badge */}
            {post.isPR && (
              <div className="bg-yellow-500 rounded-lg p-3 mb-3 flex items-start gap-3">
                <Trophy className="w-5 h-5 text-[#0E0E55] mt-0.5" />
                <div>
                  <div className="text-[#0E0E55] text-sm mb-1">Personal Record!</div>
                  <div className="text-[#0E0E55]/80 text-sm">
                    {post.prDetails?.exercise}: {post.prDetails?.weight} × {post.prDetails?.reps} reps
                  </div>
                </div>
              </div>
            )}

            {/* Content */}
            <p className="text-gray-800 mb-3">{post.content}</p>

            {/* Media Content */}
            {post.media && (
              <div className="mb-3 -mx-4">
                {post.media.type === 'image' && (
                  <img 
                    src={post.media.url} 
                    alt="Post media"
                    className="w-full object-cover max-h-96"
                  />
                )}
                {post.media.type === 'video' && (
                  <div className="relative bg-gray-900">
                    <img 
                      src={post.media.thumbnail} 
                      alt="Video thumbnail"
                      className="w-full object-cover max-h-96 opacity-80"
                    />
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="w-16 h-16 bg-white/90 rounded-full flex items-center justify-center">
                        <Video className="w-8 h-8 text-[#0E0E55] ml-1" />
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Actions */}
            <div className="flex items-center gap-6 pt-3 border-t border-gray-200">
              <button
                onClick={() => toggleLike(post.id)}
                className={`flex items-center gap-2 transition-colors ${
                  post.isLiked ? 'text-red-500' : 'text-gray-600 hover:text-red-500'
                }`}
              >
                <Heart className={`w-5 h-5 ${post.isLiked ? 'fill-red-500' : ''}`} />
                <span className="text-sm">{post.likes}</span>
              </button>
              <button className="flex items-center gap-2 text-gray-600 hover:text-[#0E0E55] transition-colors">
                <MessageCircle className="w-5 h-5" />
                <span className="text-sm">{post.comments}</span>
              </button>
              <button className="flex items-center gap-2 text-gray-600 hover:text-[#0E0E55] transition-colors">
                <Share2 className="w-5 h-5" />
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Floating Action Button */}
      <button
        onClick={onCreatePost}
        className="fixed bottom-20 right-4 w-14 h-14 bg-yellow-500 text-[#0E0E55] rounded-full shadow-xl hover:bg-yellow-400 transition-all active:scale-95 flex items-center justify-center z-10"
      >
        <Plus className="w-6 h-6" />
      </button>
    </div>
  );
}