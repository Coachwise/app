import { useState } from 'react';
import { Search, Star, Filter, CheckCircle2, MapPin, ArrowLeft } from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';

interface Coach {
  id: string;
  name: string;
  avatar: string;
  specialty: string;
  rating: number;
  reviewCount: number;
  isVerified: boolean;
  certifications: string[];
  priceRange: string;
  bio: string;
  clientCount: number;
  coverImage: string;
  location: string;
  priceFrom: number;
}

interface CoachMarketplaceProps {
  onBack: () => void;
  onViewProfile?: (userId: string) => void;
}

export function CoachMarketplace({ onBack, onViewProfile }: CoachMarketplaceProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSpecialty, setSelectedSpecialty] = useState('all');

  const { t } = useLanguage();

  const specialties = [
    { key: 'all', label: t('all') },
    { key: 'powerlifting', label: t('powerlifting') },
    { key: 'olympicWeightlifting', label: t('olympicWeightlifting') },
    { key: 'bodybuilding', label: t('bodybuilding') },
    { key: 'crossfit', label: t('crossfit') },
    { key: 'rockClimbing', label: t('rockClimbing') },
    { key: 'calisthenics', label: t('calisthenics') },
    { key: 'generalFitness', label: t('generalFitness') },
  ];

  const mockCoaches: Coach[] = [
    {
      id: '1',
      name: 'Sarah Martinez',
      avatar: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=200&h=200&fit=crop',
      specialty: 'Powerlifting',
      rating: 4.9,
      reviewCount: 127,
      isVerified: true,
      certifications: ['NSCA-CSCS', 'USAPL Coach'],
      priceRange: '$40-80/mo',
      bio: 'Elite powerlifting coach with 12+ years experience. Specialized in strength development and competition prep.',
      clientCount: 45,
      coverImage: 'https://images.unsplash.com/photo-1518791841217-8f162f1e1131?w=400&h=300&fit=crop',
      location: 'Los Angeles, CA',
      priceFrom: 40,
    },
    {
      id: '2',
      name: 'Mike Chen',
      avatar: 'https://images.unsplash.com/photo-1568602471122-7832951cc4c5?w=200&h=200&fit=crop',
      specialty: 'Rock Climbing',
      rating: 4.8,
      reviewCount: 89,
      isVerified: true,
      certifications: ['USAC Level 2', 'AMGA SPI'],
      priceRange: '$30-60/mo',
      bio: 'Professional climber turned coach. Helping climbers break through plateaus since 2015.',
      clientCount: 32,
      coverImage: 'https://images.unsplash.com/photo-1518791841217-8f162f1e1131?w=400&h=300&fit=crop',
      location: 'San Francisco, CA',
      priceFrom: 30,
    },
    {
      id: '3',
      name: 'Jessica Thompson',
      avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=200&h=200&fit=crop',
      specialty: 'CrossFit',
      rating: 4.7,
      reviewCount: 64,
      isVerified: true,
      certifications: ['CF-L3', 'USAW Sports Performance'],
      priceRange: '$35-70/mo',
      bio: 'CrossFit regional competitor. Programming for athletes of all levels with focus on functional fitness.',
      clientCount: 28,
      coverImage: 'https://images.unsplash.com/photo-1518791841217-8f162f1e1131?w=400&h=300&fit=crop',
      location: 'New York, NY',
      priceFrom: 35,
    },
  ];

  const filteredCoaches = mockCoaches.filter(coach => {
    const matchesSearch = coach.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         coach.specialty.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesSpecialty = selectedSpecialty === 'all' || 
                            coach.specialty.toLowerCase() === selectedSpecialty.toLowerCase();
    return matchesSearch && matchesSpecialty;
  });

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Header */}
      <div className="bg-navy px-4 py-6 sticky top-0 z-10">
        <div className="flex items-center gap-3 mb-4">
          <button 
            onClick={onBack}
            className="p-2 -ml-2 hover:bg-navy-light rounded-lg transition-colors"
          >
            <ArrowLeft className="w-6 h-6 text-white" />
          </button>
          <h1 className="text-white">{t('findYourCoach')}</h1>
        </div>
        
        {/* Search */}
        <div className="relative mb-3">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={t('searchByNameOrSpecialty')}
            className="w-full pl-12 pr-4 py-3 bg-white border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-transparent"
          />
        </div>

        {/* Specialty Filter */}
        <div className="flex gap-2 overflow-x-auto pb-2 -mx-4 px-4">
          {specialties.map(specialty => (
            <button
              key={specialty.key}
              onClick={() => setSelectedSpecialty(specialty.key)}
              className={`px-4 py-2 rounded-full whitespace-nowrap transition-colors ${
                selectedSpecialty === specialty.key
                  ? 'bg-yellow-500 text-navy'
                  : 'bg-white/10 text-white border border-white/20 hover:bg-white/20'
              }`}
            >
              {specialty.label}
            </button>
          ))}
        </div>
      </div>

      {/* Coach Cards */}
      <div className="p-4 space-y-4">
        {filteredCoaches.map((coach) => (
          <div key={coach.id} className="bg-white rounded-lg shadow-md overflow-hidden border border-gray-200">
            <div className="relative h-32 bg-gray-200">
              <img
                src={coach.coverImage}
                alt={coach.name}
                className="w-full h-full object-cover"
              />
              <div className="absolute -bottom-12 left-4">
                <img
                  src={coach.avatar}
                  alt={coach.name}
                  onClick={() => onViewProfile?.(coach.id)}
                  className="w-24 h-24 rounded-full object-cover border-4 border-white cursor-pointer hover:opacity-80 transition-opacity"
                />
              </div>
            </div>

            <div className="pt-14 px-4 pb-4">
              <div className="flex items-start justify-between mb-3">
                <div 
                  onClick={() => onViewProfile?.(coach.id)}
                  className="cursor-pointer hover:opacity-80 transition-opacity"
                >
                  <h3 className="text-navy mb-1">{coach.name}</h3>
                  <p className="text-gray-600 text-sm">{coach.specialty}</p>
                </div>
                <div className="text-right">
                  <div className="flex items-center gap-1 text-yellow-600 mb-1">
                    <Star className="w-4 h-4 fill-yellow-600" />
                    <span className="text-sm">{coach.rating}</span>
                  </div>
                  <p className="text-gray-600 text-xs">{coach.clientCount} {t('clients_lower')}</p>
                </div>
              </div>

              <p className="text-gray-700 text-sm mb-4">{coach.bio}</p>

              <div className="flex items-center gap-2 mb-4">
                <MapPin className="w-4 h-4 text-gray-400" />
                <span className="text-gray-600 text-sm">{coach.location}</span>
              </div>

              <div className="flex items-center justify-between pt-4 border-t border-gray-200">
                <div>
                  <span className="text-gray-600 text-sm">{t('from')} </span>
                  <span className="text-navy">${coach.priceFrom}/{t('month')}</span>
                </div>
                <button className="px-6 py-2 bg-yellow-500 text-navy rounded-lg hover:bg-yellow-400 transition-colors" onClick={() => onViewProfile?.(coach.id)}>
                  {t('viewProfile')}
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}