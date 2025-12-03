import { useState } from 'react';
import { Menu, X, Bell, Shield, LogOut, Settings, Users, DollarSign } from 'lucide-react';
import type { UserRole } from '../App';

interface HamburgerMenuProps {
  userRole: UserRole;
  onNavigate: (view: string) => void;
  userName?: string;
  userAvatar?: string;
  userUsername?: string;
}

export function HamburgerMenu({ 
  userRole, 
  onNavigate,
  userName = 'Jordan Smith',
  userAvatar = 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=200&h=200&fit=crop',
  userUsername = '@jordansmith'
}: HamburgerMenuProps) {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  return (
    <>
      {/* Hamburger Menu Overlay */}
      {isMenuOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-40"
          onClick={() => setIsMenuOpen(false)}
        />
      )}

      {/* Slide-out Menu */}
      <div className={`fixed top-0 right-0 h-full w-80 bg-white shadow-2xl z-50 transform transition-transform duration-300 ${
        isMenuOpen ? 'translate-x-0' : 'translate-x-full'
      }`}>
        <div className="flex flex-col h-full">
          {/* Menu Header */}
          <div className="bg-[#0E0E55] px-4 py-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-white text-lg">Menu</h2>
              <button 
                onClick={() => setIsMenuOpen(false)}
                className="p-2 hover:bg-[#1A1A6E] rounded-lg transition-colors"
              >
                <X className="w-6 h-6 text-white" />
              </button>
            </div>
            {/* User Info in Menu */}
            <div className="flex items-center gap-3">
              <img 
                src={userAvatar} 
                alt={userName}
                className="w-12 h-12 rounded-full object-cover border-2 border-white"
              />
              <div>
                <p className="text-white font-medium">{userName}</p>
                <p className="text-gray-300 text-sm">{userUsername}</p>
              </div>
            </div>
          </div>

          {/* Menu Items */}
          <div className="flex-1 overflow-y-auto p-4">
            <div className="space-y-2">
              {/* Coach-specific actions */}
              {userRole === 'coach' && (
                <>
                  <button 
                    onClick={() => {
                      onNavigate('coach-dashboard');
                      setIsMenuOpen(false);
                    }}
                    className="w-full flex items-center gap-3 p-3 bg-yellow-500 text-[#0E0E55] rounded-lg hover:bg-yellow-400 transition-colors"
                  >
                    <Users className="w-5 h-5" />
                    <span>Dashboard</span>
                  </button>
                  <button 
                    onClick={() => {
                      onNavigate('tier-builder');
                      setIsMenuOpen(false);
                    }}
                    className="w-full flex items-center gap-3 p-3 hover:bg-gray-50 rounded-lg transition-colors"
                  >
                    <DollarSign className="w-5 h-5 text-gray-600" />
                    <span className="text-[#0E0E55]">Create Subscription Tier</span>
                  </button>
                  <div className="border-t border-gray-200 my-2"></div>
                </>
              )}

              {/* Athlete-specific action */}
              {userRole !== 'coach' && (
                <>
                  <button 
                    onClick={() => {
                      onNavigate('coach-application');
                      setIsMenuOpen(false);
                    }}
                    className="w-full flex items-center gap-3 p-3 bg-yellow-500 text-[#0E0E55] rounded-lg hover:bg-yellow-400 transition-colors"
                  >
                    <Users className="w-5 h-5" />
                    <span>Become a Coach</span>
                  </button>
                  <div className="border-t border-gray-200 my-2"></div>
                </>
              )}

              {/* Common actions */}
              <button 
                onClick={() => {
                  onNavigate('coach-marketplace');
                  setIsMenuOpen(false);
                }}
                className="w-full flex items-center gap-3 p-3 hover:bg-gray-50 rounded-lg transition-colors"
              >
                <Users className="w-5 h-5 text-gray-600" />
                <span className="text-[#0E0E55]">Find a Coach</span>
              </button>

              <button className="w-full flex items-center gap-3 p-3 hover:bg-gray-50 rounded-lg transition-colors">
                <Bell className="w-5 h-5 text-gray-600" />
                <span className="text-[#0E0E55]">Notifications</span>
              </button>

              <button className="w-full flex items-center gap-3 p-3 hover:bg-gray-50 rounded-lg transition-colors">
                <Settings className="w-5 h-5 text-gray-600" />
                <span className="text-[#0E0E55]">Settings</span>
              </button>

              <button className="w-full flex items-center gap-3 p-3 hover:bg-gray-50 rounded-lg transition-colors">
                <Shield className="w-5 h-5 text-gray-600" />
                <span className="text-[#0E0E55]">Privacy & Security</span>
              </button>

              <div className="border-t border-gray-200 my-2"></div>

              <button className="w-full flex items-center gap-3 p-3 hover:bg-red-50 rounded-lg transition-colors text-red-600">
                <LogOut className="w-5 h-5" />
                <span>Log Out</span>
              </button>
            </div>
          </div>

          {/* Menu Footer */}
          <div className="p-4 border-t border-gray-200">
            <p className="text-gray-600 text-xs text-center">Coachwise v1.0.0</p>
          </div>
        </div>
      </div>

      {/* Hamburger Button */}
      <button 
        onClick={() => setIsMenuOpen(true)}
        className="p-2 hover:bg-[#1A1A6E] rounded-lg transition-colors"
      >
        <Menu className="w-6 h-6 text-white" />
      </button>
    </>
  );
}