import { useState } from 'react';
import { Search, UserPlus, UserCheck, CheckCircle2 } from 'lucide-react';
import { HamburgerMenu } from './HamburgerMenu';
import type { UserRole } from '../App';
import { useLanguage } from '../contexts/LanguageContext';

interface AthleteSearchProps {
  userRole: UserRole;
  onNavigate: (view: string) => void;
  onViewProfile: (userId: string) => void;
}

interface Athlete {
  id: string;
  name: string;
  username: string;
  avatar: string;
  bio: string;
  isCoach: boolean;
  isFollowing: boolean;
  followers: number;
  workouts: number;
}

export function AthleteSearch({ userRole, onNavigate, onViewProfile }: AthleteSearchProps) {
  const { t, isRTL } = useLanguage();
  const [searchQuery, setSearchQuery] = useState('');
  const [filterCoachesOnly, setFilterCoachesOnly] = useState(false);
  const [athletes, setAthletes] = useState<Athlete[]>([
    {
      id: '1',
      name: 'Sarah Martinez',
      username: '@sarahm',
      avatar: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=100&h=100&fit=crop',
      bio: 'Powerlifter | Coach | Helping you get stronger 💪',
      isCoach: true,
      isFollowing: false,
      followers: 2543,
      workouts: 892,
    },
    {
      id: '2',
      name: 'Alex Chen',
      username: '@alexchen',
      avatar: 'https://images.unsplash.com/photo-1568602471122-7832951cc4c5?w=100&h=100&fit=crop',
      bio: 'Sport climber | V10+ | Training for competitions',
      isCoach: false,
      isFollowing: true,
      followers: 1234,
      workouts: 445,
    },
    {
      id: '3',
      name: 'Jordan Smith',
      username: '@jordansmith',
      avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100&h=100&fit=crop',
      bio: 'Certified Strength & Climbing Coach',
      isCoach: true,
      isFollowing: false,
      followers: 3421,
      workouts: 1203,
    },
    {
      id: '4',
      name: 'Emma Wilson',
      username: '@emmaw',
      avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&h=100&fit=crop',
      bio: 'CrossFit athlete | Marathon runner',
      isCoach: false,
      isFollowing: false,
      followers: 892,
      workouts: 567,
    },
    {
      id: '5',
      name: 'Mike Johnson',
      username: '@mikej',
      avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=100&h=100&fit=crop',
      bio: 'Bodybuilder | Nutrition enthusiast',
      isCoach: false,
      isFollowing: false,
      followers: 1567,
      workouts: 734,
    },
    {
      id: '6',
      name: 'Lisa Anderson',
      username: '@lisaa',
      avatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=100&h=100&fit=crop',
      bio: 'Yoga instructor | Mindfulness coach',
      isCoach: true,
      isFollowing: false,
      followers: 4321,
      workouts: 1890,
    },
  ]);

  const toggleFollow = (athleteId: string) => {
    setAthletes(athletes.map(athlete => 
      athlete.id === athleteId 
        ? { 
            ...athlete, 
            isFollowing: !athlete.isFollowing,
            followers: athlete.isFollowing ? athlete.followers - 1 : athlete.followers + 1
          }
        : athlete
    ));
  };

  const filteredAthletes = athletes.filter(athlete => {
    const matchesSearch = athlete.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      athlete.username.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesFilter = !filterCoachesOnly || athlete.isCoach;
    return matchesSearch && matchesFilter;
  });

  const suggestedAthletes = athletes.filter(a => !a.isFollowing).slice(0, 3);

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Header */}
      <div className="bg-[#0E0E55] px-4 py-4 sticky top-0 z-10">
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-white text-xl">{t('discoverAthletes')}</h1>
          <HamburgerMenu 
            userRole={userRole}
            onNavigate={onNavigate}
          />
        </div>

        {/* Search Bar */}
        <div className="relative mb-3">
          <Search className={`absolute top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 ${isRTL ? 'right-3' : 'left-3'}`} />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={t('searchPlaceholder')}
            className={`w-full bg-white border-0 rounded-lg py-3 ${isRTL ? 'pr-10 pl-4' : 'pl-10 pr-4'} text-[#0E0E55] focus:outline-none focus:ring-2 focus:ring-yellow-500`}
          />
        </div>

        {/* Filter Toggle */}
        <button
          onClick={() => setFilterCoachesOnly(!filterCoachesOnly)}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
            filterCoachesOnly
              ? 'bg-yellow-500 text-[#0E0E55]'
              : 'bg-white/10 text-white border border-white/20'
          }`}
        >
          <CheckCircle2 className="w-4 h-4" />
          <span className="text-sm">{t('findACoach')}</span>
        </button>
      </div>

      <div className="p-4 space-y-6">
        {/* Suggested For You */}
        {searchQuery === '' && (
          <div>
            <h2 className="text-[#0E0E55] mb-3">{t('suggestedForYou')}</h2>
            <div className="space-y-3">
              {suggestedAthletes.map((athlete) => (
                <div key={athlete.id} className="bg-white rounded-lg p-4 shadow-md border border-gray-200">
                  <div className="flex items-start gap-3">
                    <img 
                      src={athlete.avatar} 
                      alt={athlete.name}
                      className="w-12 h-12 rounded-full object-cover"
                    />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-[#0E0E55] truncate">{athlete.name}</span>
                        {athlete.isCoach && (
                          <CheckCircle2 className="w-4 h-4 text-yellow-500 flex-shrink-0" />
                        )}
                      </div>
                      <p className="text-gray-600 text-sm mb-1">{athlete.username}</p>
                      <p className="text-gray-700 text-sm mb-2 line-clamp-2">{athlete.bio}</p>
                      
                      <div className="flex items-center gap-4 text-xs text-gray-600 mb-3">
                        <span>{athlete.followers.toLocaleString()} {t('followers')}</span>
                        <span>{athlete.workouts} {t('workouts')}</span>
                      </div>

                      <div className="flex gap-2">
                        <button
                          onClick={() => toggleFollow(athlete.id)}
                          className={`flex-1 py-2 rounded-lg transition-colors flex items-center justify-center gap-2 ${
                            athlete.isFollowing
                              ? 'bg-gray-200 text-[#0E0E55] hover:bg-gray-300'
                              : 'bg-yellow-500 text-[#0E0E55] hover:bg-yellow-400'
                          }`}
                        >
                          {athlete.isFollowing ? (
                            <>
                              <UserCheck className="w-4 h-4" />
                              <span>{t('following')}</span>
                            </>
                          ) : (
                            <>
                              <UserPlus className="w-4 h-4" />
                              <span>{t('follow')}</span>
                            </>
                          )}
                        </button>
                        <button
                          onClick={() => onViewProfile(athlete.id)}
                          className="px-4 py-2 border border-[#0E0E55] text-[#0E0E55] rounded-lg hover:bg-gray-50 transition-colors"
                        >
                          {t('viewProfile')}
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* All Athletes / Search Results */}
        <div>
          <h2 className="text-[#0E0E55] mb-3">
            {searchQuery === '' ? t('allAthletes') : `${filteredAthletes.length} ${t('athletes')}`}
          </h2>
          
          {filteredAthletes.length === 0 ? (
            <div className="bg-white rounded-lg p-8 text-center shadow-md border border-gray-200">
              <p className="text-gray-600">{t('noFollowers')}</p>
            </div>
          ) : (
            <div className="space-y-3">
              {filteredAthletes.map((athlete) => (
                <div key={athlete.id} className="bg-white rounded-lg p-4 shadow-md border border-gray-200">
                  <div className="flex items-center gap-3">
                    <img 
                      src={athlete.avatar} 
                      alt={athlete.name}
                      className="w-12 h-12 rounded-full object-cover"
                    />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-[#0E0E55] truncate">{athlete.name}</span>
                        {athlete.isCoach && (
                          <CheckCircle2 className="w-4 h-4 text-yellow-500 flex-shrink-0" />
                        )}
                      </div>
                      <p className="text-gray-600 text-sm">{athlete.username}</p>
                      <div className="flex items-center gap-3 text-xs text-gray-600 mt-1">
                        <span>{athlete.followers.toLocaleString()} {t('followers')}</span>
                        <span>{athlete.workouts} {t('workouts')}</span>
                      </div>
                    </div>
                    <button
                      onClick={() => toggleFollow(athlete.id)}
                      className={`px-4 py-2 rounded-lg transition-colors flex items-center gap-2 ${
                        athlete.isFollowing
                          ? 'bg-gray-200 text-[#0E0E55] hover:bg-gray-300'
                          : 'bg-yellow-500 text-[#0E0E55] hover:bg-yellow-400'
                      }`}
                    >
                      {athlete.isFollowing ? (
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
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}