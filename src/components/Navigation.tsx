import { Home, Dumbbell, User } from 'lucide-react';
import type { ViewType, UserRole } from '../App';

interface NavigationProps {
  currentView: ViewType;
  setCurrentView: (view: ViewType) => void;
  userRole: UserRole;
}

export function Navigation({ currentView, setCurrentView, userRole }: NavigationProps) {
  const navItems = [
    { id: 'feed' as ViewType, icon: Home, label: 'Feed' },
    { id: 'workouts-home' as ViewType, icon: Dumbbell, label: 'Workouts' },
    ...(userRole === 'coach' ? [{ id: 'coach-dashboard' as ViewType, icon: User, label: 'Dashboard' }] : []),
    { id: 'profile' as ViewType, icon: User, label: 'Profile' },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-[#0E0E55] max-w-md mx-auto">
      <div className="flex items-center justify-around px-4 py-3">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = currentView === item.id || 
            (item.id === 'workouts-home' && (currentView === 'workout-session' || currentView === 'logging'));
          
          return (
            <button
              key={item.id}
              onClick={() => setCurrentView(item.id)}
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