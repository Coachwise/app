import { useState } from 'react';
import { Search, MessageCircle, Image as ImageIcon, CheckCheck, Check } from 'lucide-react';
import { HamburgerMenu } from './HamburgerMenu';
import type { UserRole } from '../App';
import { useLanguage } from '../contexts/LanguageContext';

interface MessagesProps {
  userRole: UserRole;
  onNavigate: (view: string) => void;
  onViewProfile?: (userId: string) => void;
  setCurrentConversationId: (id: string) => void;
}

interface Conversation {
  id: string;
  userId: string;
  name: string;
  username: string;
  avatar: string;
  isCoach: boolean;
  lastMessage: {
    text: string;
    timestamp: string;
    isRead: boolean;
    isSent: boolean;
    hasMedia?: boolean;
  };
  unreadCount: number;
}

export function Messages({ userRole, onNavigate, onViewProfile, setCurrentConversationId }: MessagesProps) {
  const { t } = useLanguage();
  const [searchQuery, setSearchQuery] = useState('');

  const [conversations] = useState<Conversation[]>([
    {
      id: '1',
      userId: 'coach-sarah',
      name: 'Sarah Martinez',
      username: '@sarahmartinez',
      avatar: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=100&h=100&fit=crop',
      isCoach: true,
      lastMessage: {
        text: 'Great progress on your deadlifts! Keep it up! 💪',
        timestamp: '10m ago',
        isRead: false,
        isSent: false,
      },
      unreadCount: 2,
    },
    {
      id: '2',
      userId: 'user-mike',
      name: 'Mike Chen',
      username: '@mikechen',
      avatar: 'https://images.unsplash.com/photo-1568602471122-7832951cc4c5?w=100&h=100&fit=crop',
      isCoach: false,
      lastMessage: {
        text: 'You: Thanks for the workout plan!',
        timestamp: '2h ago',
        isRead: true,
        isSent: true,
      },
      unreadCount: 0,
    },
    {
      id: '3',
      userId: 'coach-alex',
      name: 'Alex Thompson',
      username: '@alexthompson',
      avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100&h=100&fit=crop',
      isCoach: true,
      lastMessage: {
        text: 'Check out this climbing technique',
        timestamp: '1d ago',
        isRead: true,
        isSent: false,
        hasMedia: true,
      },
      unreadCount: 0,
    },
    {
      id: '4',
      userId: 'user-emma',
      name: 'Emma Wilson',
      username: '@emmawilson',
      avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&h=100&fit=crop',
      isCoach: false,
      lastMessage: {
        text: 'You: See you at the gym tomorrow!',
        timestamp: '2d ago',
        isRead: true,
        isSent: true,
      },
      unreadCount: 0,
    },
    {
      id: '5',
      userId: 'coach-jordan',
      name: 'Jordan Smith',
      username: '@jordansmith',
      avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&h=100&fit=crop',
      isCoach: true,
      lastMessage: {
        text: 'Your new training plan is ready',
        timestamp: '3d ago',
        isRead: false,
        isSent: false,
      },
      unreadCount: 1,
    },
  ]);

  const filteredConversations = conversations.filter(conv =>
    conv.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    conv.username.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const totalUnread = conversations.reduce((sum, conv) => sum + conv.unreadCount, 0);

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Header */}
      <div className="bg-[#0E0E55] px-4 py-4 sticky top-0 z-10">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-white text-xl">{t('messages')}</h1>
            {totalUnread > 0 && (
              <p className="text-gray-300 text-sm">
                {totalUnread} unread message{totalUnread !== 1 ? 's' : ''}
              </p>
            )}
          </div>
          <HamburgerMenu 
            userRole={userRole}
            onNavigate={onNavigate}
          />
        </div>

        {/* Search Bar */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search messages..."
            className="w-full pl-10 pr-4 py-2.5 bg-white border border-gray-200 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-transparent"
          />
        </div>
      </div>

      {/* Conversations List */}
      <div className="p-4 space-y-2">
        {filteredConversations.length === 0 ? (
          <div className="text-center py-12">
            <div className="w-20 h-20 bg-gray-200 rounded-full flex items-center justify-center mx-auto mb-4">
              <MessageCircle className="w-10 h-10 text-gray-400" />
            </div>
            <p className="text-[#0E0E55] mb-1">No conversations found</p>
            <p className="text-gray-600 text-sm">Start messaging your coaches or athletes</p>
          </div>
        ) : (
          filteredConversations.map((conversation) => (
            <button
              key={conversation.id}
              onClick={() => {
                setCurrentConversationId(conversation.id);
                onNavigate('message-thread');
              }}
              className="w-full bg-white rounded-lg p-4 shadow-sm border border-gray-200 hover:border-yellow-500 transition-colors"
            >
              <div className="flex items-start gap-3">
                {/* Avatar with online indicator */}
                <div className="relative flex-shrink-0">
                  <img 
                    src={conversation.avatar} 
                    alt={conversation.name}
                    className="w-14 h-14 rounded-full object-cover"
                  />
                  {conversation.unreadCount > 0 && (
                    <div className="absolute -top-1 -right-1 w-6 h-6 bg-red-500 rounded-full flex items-center justify-center border-2 border-white">
                      <span className="text-white text-xs">{conversation.unreadCount}</span>
                    </div>
                  )}
                </div>

                {/* Message Info */}
                <div className="flex-1 min-w-0 text-left">
                  <div className="flex items-center justify-between mb-1">
                    <div className="flex items-center gap-2">
                      <span className={`${conversation.unreadCount > 0 ? 'text-[#0E0E55]' : 'text-gray-900'}`}>
                        {conversation.name}
                      </span>
                      {conversation.isCoach && (
                        <span className="px-2 py-0.5 bg-yellow-500 text-[#0E0E55] rounded text-xs">
                          Coach
                        </span>
                      )}
                    </div>
                    <span className="text-gray-500 text-xs flex-shrink-0">
                      {conversation.lastMessage.timestamp}
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    {conversation.lastMessage.hasMedia && (
                      <ImageIcon className="w-4 h-4 text-gray-400 flex-shrink-0" />
                    )}
                    <p className={`text-sm truncate ${
                      conversation.unreadCount > 0 ? 'text-[#0E0E55]' : 'text-gray-600'
                    }`}>
                      {conversation.lastMessage.text}
                    </p>
                    {conversation.lastMessage.isSent && (
                      <div className="flex-shrink-0">
                        {conversation.lastMessage.isRead ? (
                          <CheckCheck className="w-4 h-4 text-blue-500" />
                        ) : (
                          <Check className="w-4 h-4 text-gray-400" />
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </button>
          ))
        )}
      </div>

      {/* Empty State for No Conversations */}
      {conversations.length === 0 && (
        <div className="text-center py-12 px-4">
          <div className="w-24 h-24 bg-[#0E0E55] rounded-full flex items-center justify-center mx-auto mb-4">
            <MessageCircle className="w-12 h-12 text-yellow-500" />
          </div>
          <h3 className="text-[#0E0E55] text-lg mb-2">No Messages Yet</h3>
          <p className="text-gray-600 mb-6">
            Connect with coaches or athletes to start conversations
          </p>
          <button
            onClick={() => onNavigate('athlete-search')}
            className="px-6 py-3 bg-yellow-500 text-[#0E0E55] rounded-lg hover:bg-yellow-400 transition-colors"
          >
            Find People
          </button>
        </div>
      )}
    </div>
  );
}