import { Home, Dumbbell, LayoutDashboard, MessageCircle } from 'lucide-react';
import type { ViewType, UserRole } from '../App';
import { useLanguage } from '../contexts/LanguageContext';

interface NavigationProps {
  currentView: ViewType;
  onNavigate: (view: string) => void;
  userRole: UserRole;
}

export function Navigation({ currentView, onNavigate, userRole }: NavigationProps) {
  const { t } = useLanguage();
  
  const navItems = [
    { id: 'feed' as ViewType, icon: Home, label: t('feed') },
    { id: 'workouts-home' as ViewType, icon: Dumbbell, label: t('workouts') },
    ...(userRole === 'coach' ? [
      { id: 'messages' as ViewType, icon: MessageCircle, label: t('messages') },
      { id: 'coach-dashboard' as ViewType, icon: LayoutDashboard, label: t('dashboard') }
    ] : [
      { id: 'messages' as ViewType, icon: MessageCircle, label: t('messages') }
    ]),
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-[#0E0E55] max-w-md mx-auto">
      <div className="flex items-center justify-around px-4 py-3">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = currentView === item.id || 
            (item.id === 'workouts-home' && (currentView === 'workout-session' || currentView === 'logging')) ||
            (item.id === 'messages' && (currentView === 'message-thread' || currentView === 'channel-view'));
          
          return (
            <button
              key={item.id}
              onClick={() => onNavigate(item.id)}
              className={`flex flex-col items-center gap-1 py-2 px-4 transition-all ${
                isActive ? 'text-yellow-500' : 'text-gray-300'
              }`}
            >
              <Icon className="w-6 h-6" />
              <span className="text-xs">{item.label}</span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}