import { useState } from 'react';
import { Search, MessageCircle, Image as ImageIcon, CheckCheck, Check, Users, Plus, Link as LinkIcon, Hash } from 'lucide-react';
import { HamburgerMenu } from './HamburgerMenu';
import type { UserRole } from '../App';
import { useLanguage } from '../contexts/LanguageContext';

interface MessagesProps {
  userRole: UserRole;
  onNavigate: (view: string) => void;
  onViewProfile?: (userId: string) => void;
  setCurrentConversationId: (id: string) => void;
  setCurrentChannelId: (id: string | null) => void;
  activeTab: 'dms' | 'channels';
  setActiveTab: (tab: 'dms' | 'channels') => void;
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

interface Channel {
  id: string;
  name: string;
  description: string;
  coachId: string;
  coachName: string;
  coachAvatar: string;
  memberCount: number;
  lastMessage?: {
    text: string;
    timestamp: string;
  };
  isOwner: boolean;
  unreadCount: number;
}

export function MessagesWithChannels({ userRole, onNavigate, onViewProfile, setCurrentConversationId, setCurrentChannelId, activeTab, setActiveTab }: MessagesProps) {
  const { t } = useLanguage();
  const [searchQuery, setSearchQuery] = useState('');
  const [showCreateChannel, setShowCreateChannel] = useState(false);
  const [channelName, setChannelName] = useState('');
  const [channelDescription, setChannelDescription] = useState('');

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

  const [channels, setChannels] = useState<Channel[]>([
    {
      id: 'channel-1',
      name: 'Strength Training Tips',
      description: 'Daily tips and motivation for strength training',
      coachId: 'coach-sarah',
      coachName: 'Sarah Martinez',
      coachAvatar: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=100&h=100&fit=crop',
      memberCount: 24,
      lastMessage: {
        text: 'Remember: Progressive overload is key to muscle growth!',
        timestamp: '1h ago',
      },
      isOwner: userRole === 'coach',
      unreadCount: 3,
    },
    {
      id: 'channel-2',
      name: 'Climbing Community',
      description: 'Share climbing progress and techniques',
      coachId: 'coach-alex',
      coachName: 'Alex Thompson',
      coachAvatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100&h=100&fit=crop',
      memberCount: 18,
      lastMessage: {
        text: 'New bouldering challenge posted!',
        timestamp: '3h ago',
      },
      isOwner: false,
      unreadCount: 0,
    },
  ]);

  const filteredConversations = conversations.filter(conv =>
    conv.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    conv.username.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredChannels = channels.filter(channel =>
    channel.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    channel.description.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const totalUnread = conversations.reduce((sum, conv) => sum + conv.unreadCount, 0);
  const totalChannelUnread = channels.reduce((sum, channel) => sum + channel.unreadCount, 0);

  const handleCreateChannel = () => {
    if (!channelName.trim()) return;

    const newChannel: Channel = {
      id: `channel-${Date.now()}`,
      name: channelName,
      description: channelDescription,
      coachId: 'current-user',
      coachName: 'You',
      coachAvatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100&h=100&fit=crop',
      memberCount: 0,
      isOwner: true,
      unreadCount: 0,
    };

    setChannels([newChannel, ...channels]);
    setChannelName('');
    setChannelDescription('');
    setShowCreateChannel(false);
  };

  const handleOpenChannel = (channelId: string) => {
    setCurrentChannelId(channelId);
    setActiveTab('channels'); // Ensure we remember we're in channels tab
    onNavigate('channel-view');
  };

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Header */}
      <div className="bg-[#0E0E55] px-4 py-4 sticky top-0 z-10">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-white text-xl">{t('messages')}</h1>
            {(totalUnread > 0 || totalChannelUnread > 0) && (
              <p className="text-gray-300 text-sm">
                {totalUnread + totalChannelUnread} unread message{(totalUnread + totalChannelUnread) !== 1 ? 's' : ''}
              </p>
            )}
          </div>
          <HamburgerMenu 
            userRole={userRole}
            onNavigate={onNavigate}
          />
        </div>

        {/* Tabs */}
        <div className="flex gap-2 mb-4">
          <button
            onClick={() => setActiveTab('dms')}
            className={`flex-1 py-2.5 rounded-lg transition-colors ${
              activeTab === 'dms'
                ? 'bg-yellow-500 text-[#0E0E55]'
                : 'bg-[#1A1A6E] text-gray-300'
            }`}
          >
            <div className="flex items-center justify-center gap-2">
              <MessageCircle className="w-4 h-4" />
              <span>Direct Messages</span>
              {totalUnread > 0 && (
                <span className="bg-red-500 text-white text-xs px-2 py-0.5 rounded-full">
                  {totalUnread}
                </span>
              )}
            </div>
          </button>
          <button
            onClick={() => setActiveTab('channels')}
            className={`flex-1 py-2.5 rounded-lg transition-colors ${
              activeTab === 'channels'
                ? 'bg-yellow-500 text-[#0E0E55]'
                : 'bg-[#1A1A6E] text-gray-300'
            }`}
          >
            <div className="flex items-center justify-center gap-2">
              <Hash className="w-4 h-4" />
              <span>Channels</span>
              {totalChannelUnread > 0 && (
                <span className="bg-red-500 text-white text-xs px-2 py-0.5 rounded-full">
                  {totalChannelUnread}
                </span>
              )}
            </div>
          </button>
        </div>

        {/* Search Bar */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={activeTab === 'dms' ? 'Search messages...' : 'Search channels...'}
            className="w-full pl-10 pr-4 py-2.5 bg-white border border-gray-200 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-transparent"
          />
        </div>
      </div>

      {/* Content */}
      <div className="p-4 space-y-2">
        {/* Direct Messages Tab */}
        {activeTab === 'dms' && (
          <>
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
                    setCurrentChannelId(null);
                    onNavigate('message-thread');
                  }}
                  className="w-full bg-white rounded-lg p-4 shadow-sm border border-gray-200 hover:border-yellow-500 transition-colors"
                >
                  <div className="flex items-start gap-3">
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
          </>
        )}

        {/* Channels Tab */}
        {activeTab === 'channels' && (
          <>
            {/* Create Channel Button (Coaches Only) */}
            {userRole === 'coach' && !showCreateChannel && (
              <button
                onClick={() => setShowCreateChannel(true)}
                className="w-full bg-yellow-500 text-[#0E0E55] rounded-lg p-4 shadow-sm hover:bg-yellow-400 transition-colors mb-4"
              >
                <div className="flex items-center justify-center gap-2">
                  <Plus className="w-5 h-5" />
                  <span className="font-medium">Create New Channel</span>
                </div>
              </button>
            )}

            {/* Create Channel Form */}
            {showCreateChannel && (
              <div className="bg-white rounded-lg p-5 shadow-lg border-2 border-yellow-500 mb-4">
                <h3 className="text-[#0E0E55] mb-4">Create New Channel</h3>
                
                <div className="space-y-3 mb-4">
                  <div>
                    <label className="block text-sm text-gray-700 mb-1">Channel Name</label>
                    <input
                      type="text"
                      value={channelName}
                      onChange={(e) => setChannelName(e.target.value)}
                      placeholder="e.g., Weekly Training Tips"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-transparent"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm text-gray-700 mb-1">Description</label>
                    <textarea
                      value={channelDescription}
                      onChange={(e) => setChannelDescription(e.target.value)}
                      placeholder="Brief description of your channel..."
                      rows={2}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-transparent resize-none"
                    />
                  </div>
                </div>

                <div className="flex gap-2">
                  <button
                    onClick={handleCreateChannel}
                    disabled={!channelName.trim()}
                    className="flex-1 py-2.5 bg-[#0E0E55] text-white rounded-lg hover:bg-[#1A1A6E] disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
                  >
                    Create Channel
                  </button>
                  <button
                    onClick={() => {
                      setShowCreateChannel(false);
                      setChannelName('');
                      setChannelDescription('');
                    }}
                    className="flex-1 py-2.5 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}

            {/* Channels List */}
            {filteredChannels.length === 0 ? (
              <div className="text-center py-12">
                <div className="w-20 h-20 bg-gray-200 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Hash className="w-10 h-10 text-gray-400" />
                </div>
                <p className="text-[#0E0E55] mb-1">No channels found</p>
                <p className="text-gray-600 text-sm">
                  {userRole === 'coach' 
                    ? 'Create your first channel to broadcast messages to your clients'
                    : 'Join channels from your coaches to receive updates'}
                </p>
              </div>
            ) : (
              filteredChannels.map((channel) => (
                <button
                  key={channel.id}
                  onClick={() => handleOpenChannel(channel.id)}
                  className="w-full bg-white rounded-lg p-4 shadow-sm border border-gray-200 hover:border-yellow-500 transition-colors"
                >
                  <div className="flex items-start gap-3">
                    <div className="w-14 h-14 bg-yellow-100 rounded-full flex items-center justify-center flex-shrink-0">
                      <Hash className="w-7 h-7 text-yellow-600" />
                    </div>

                    <div className="flex-1 min-w-0 text-left">
                      <div className="flex items-center justify-between mb-1">
                        <div className="flex items-center gap-2">
                          <span className={`${channel.unreadCount > 0 ? 'text-[#0E0E55]' : 'text-gray-900'}`}>
                            {channel.name}
                          </span>
                          {channel.isOwner && (
                            <span className="px-2 py-0.5 bg-green-100 text-green-700 rounded text-xs">
                              Owner
                            </span>
                          )}
                          {channel.unreadCount > 0 && (
                            <div className="w-5 h-5 bg-red-500 rounded-full flex items-center justify-center">
                              <span className="text-white text-xs">{channel.unreadCount}</span>
                            </div>
                          )}
                        </div>
                      </div>

                      <p className="text-sm text-gray-600 mb-2 truncate">
                        {channel.description}
                      </p>

                      {channel.lastMessage && (
                        <p className="text-xs text-gray-500 truncate">
                          {channel.lastMessage.text} • {channel.lastMessage.timestamp}
                        </p>
                      )}

                      <div className="flex items-center gap-3 mt-2">
                        <div className="flex items-center gap-1 text-xs text-gray-500">
                          <Users className="w-3 h-3" />
                          <span>{channel.memberCount} members</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <img 
                            src={channel.coachAvatar} 
                            alt={channel.coachName}
                            className="w-4 h-4 rounded-full object-cover"
                          />
                          <span className="text-xs text-gray-500">{channel.coachName}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </button>
              ))
            )}
          </>
        )}
      </div>
    </div>
  );
}