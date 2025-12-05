import { useState, useEffect } from 'react';
import { X, UserPlus, UserCheck, CheckCircle2 } from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';

interface FollowersModalProps {
  isOpen: boolean;
  onClose: () => void;
  mode: 'followers' | 'following';
  userId: string;
  onViewProfile?: (userId: string) => void;
}

interface User {
  id: string;
  name: string;
  username: string;
  avatar: string;
  bio: string;
  isCoach: boolean;
  isFollowing: boolean;
}

const ITEMS_PER_PAGE = 10;

export function FollowersModal({ isOpen, onClose, mode, userId, onViewProfile }: FollowersModalProps) {
  const { t } = useLanguage();
  const [currentPage, setCurrentPage] = useState(1);
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(false);

  // Mock data - in real app, this would be fetched from API
  const generateMockUsers = (count: number): User[] => {
    const names = [
      'Sarah Martinez', 'Alex Chen', 'Jordan Smith', 'Emma Wilson', 'Mike Johnson',
      'Lisa Anderson', 'David Brown', 'Maria Garcia', 'Tom Wilson', 'Rachel Kim',
      'Chris Taylor', 'Anna Lee', 'James Moore', 'Sophie Clark', 'Ryan Martinez'
    ];
    const usernames = [
      '@sarahm', '@alexchen', '@jordansmith', '@emmaw', '@mikej',
      '@lisaa', '@davidb', '@mariag', '@tomw', '@rachelk',
      '@christ', '@annal', '@jamesm', '@sophiec', '@ryanm'
    ];
    const avatars = [
      'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=100&h=100&fit=crop',
      'https://images.unsplash.com/photo-1568602471122-7832951cc4c5?w=100&h=100&fit=crop',
      'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100&h=100&fit=crop',
      'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&h=100&fit=crop',
      'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=100&h=100&fit=crop',
    ];

    return Array.from({ length: count }, (_, i) => ({
      id: `user-${i}`,
      name: names[i % names.length],
      username: usernames[i % usernames.length],
      avatar: avatars[i % avatars.length],
      bio: 'Fitness enthusiast | Training hard every day 💪',
      isCoach: i % 3 === 0,
      isFollowing: mode === 'followers' ? Math.random() > 0.5 : true,
    }));
  };

  useEffect(() => {
    if (isOpen) {
      setCurrentPage(1);
      // Simulate API call
      setLoading(true);
      setTimeout(() => {
        setUsers(generateMockUsers(25));
        setLoading(false);
      }, 300);
    }
  }, [isOpen, mode]);

  const toggleFollow = (userId: string) => {
    setUsers(users.map(user => 
      user.id === userId 
        ? { ...user, isFollowing: !user.isFollowing }
        : user
    ));
  };

  const totalPages = Math.ceil(users.length / ITEMS_PER_PAGE);
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const endIndex = startIndex + ITEMS_PER_PAGE;
  const currentUsers = users.slice(startIndex, endIndex);

  const loadMore = () => {
    if (currentPage < totalPages) {
      setCurrentPage(currentPage + 1);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-end sm:items-center justify-center">
      <div 
        className="bg-white w-full sm:max-w-lg sm:rounded-2xl rounded-t-2xl max-h-[90vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-4 border-b border-gray-200">
          <h2 className="text-[#0E0E55] text-lg">
            {mode === 'followers' ? t('followers') : t('following')} ({users.length})
          </h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
          >
            <X className="w-5 h-5 text-gray-600" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4">
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-yellow-500"></div>
            </div>
          ) : users.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-gray-600">
                {mode === 'followers' ? t('noFollowers') : t('noFollowing')}
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {currentUsers.map((user) => (
                <div key={user.id} className="flex items-center gap-3 p-3 hover:bg-gray-50 rounded-lg transition-colors">
                  <button 
                    onClick={() => {
                      if (onViewProfile) {
                        onViewProfile(user.id);
                        onClose();
                      }
                    }}
                    className="flex-shrink-0"
                  >
                    <img 
                      src={user.avatar} 
                      alt={user.name}
                      className="w-12 h-12 rounded-full object-cover hover:opacity-80 transition-opacity"
                    />
                  </button>
                  <button 
                    onClick={() => {
                      if (onViewProfile) {
                        onViewProfile(user.id);
                        onClose();
                      }
                    }}
                    className="flex-1 min-w-0 text-left"
                  >
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-[#0E0E55] truncate hover:opacity-80 transition-opacity">{user.name}</span>
                      {user.isCoach && (
                        <CheckCircle2 className="w-4 h-4 text-yellow-500 flex-shrink-0" />
                      )}
                    </div>
                    <p className="text-gray-600 text-sm truncate">{user.username}</p>
                    <p className="text-gray-700 text-sm truncate">{user.bio}</p>
                  </button>
                  <button
                    onClick={() => toggleFollow(user.id)}
                    className={`px-4 py-2 rounded-lg transition-colors flex items-center gap-2 ${
                      user.isFollowing
                        ? 'bg-gray-200 text-[#0E0E55] hover:bg-gray-300'
                        : 'bg-yellow-500 text-[#0E0E55] hover:bg-yellow-400'
                    }`}
                  >
                    {user.isFollowing ? (
                      <>
                        <UserCheck className="w-4 h-4" />
                        <span className="hidden sm:inline">{t('following')}</span>
                      </>
                    ) : (
                      <>
                        <UserPlus className="w-4 h-4" />
                        <span className="hidden sm:inline">{t('follow')}</span>
                      </>
                    )}
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Pagination */}
        {!loading && currentPage < totalPages && (
          <div className="px-4 py-4 border-t border-gray-200">
            <button
              onClick={loadMore}
              className="w-full py-3 bg-yellow-500 text-[#0E0E55] rounded-lg hover:bg-yellow-400 transition-colors"
            >
              {t('loadMore')} ({endIndex} / {users.length})
            </button>
          </div>
        )}

        {/* Page indicator */}
        {!loading && totalPages > 1 && (
          <div className="px-4 pb-4 text-center">
            <p className="text-sm text-gray-600">
              Page {currentPage} of {totalPages}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}