import { useState } from 'react';
import { ArrowLeft, Coins, TrendingUp, Check, Dumbbell, Users, Crown, Zap } from 'lucide-react';
import { HamburgerMenu } from './HamburgerMenu';
import type { UserRole } from '../App';
import { useLanguage } from '../contexts/LanguageContext';
import { interpolate } from '../translations';

interface ClaimENTProps {
  onBack: () => void;
  onNavigate: (view: string) => void;
  userRole: UserRole;
  isPro: boolean;
}

interface TokenTransaction {
  id: string;
  type: 'earned' | 'claimed' | 'spent';
  amount: number;
  reason: string;
  date: Date;
}

export function ClaimENT({ onBack, onNavigate, userRole, isPro }: ClaimENTProps) {
  const { t, language } = useLanguage();
  
  // Mock token data (in a real app, this would come from blockchain/backend)
  const [totalEarned] = useState(12.5);
  const [claimedBalance] = useState(7.0);
  const [pendingBalance, setPendingBalance] = useState(5.5);
  
  const availableBalance = claimedBalance;
  
  const [transactions] = useState<TokenTransaction[]>([
    {
      id: '1',
      type: 'earned',
      amount: 0.1,
      reason: 'Exercise Completed',
      date: new Date(2024, 11, 5, 14, 30),
    },
    {
      id: '2',
      type: 'earned',
      amount: 1.0,
      reason: 'Client Added',
      date: new Date(2024, 11, 4, 10, 15),
    },
    {
      id: '3',
      type: 'claimed',
      amount: 3.5,
      reason: 'Claimed',
      date: new Date(2024, 11, 3, 16, 45),
    },
    {
      id: '4',
      type: 'earned',
      amount: 0.1,
      reason: 'Exercise Completed',
      date: new Date(2024, 11, 3, 9, 20),
    },
    {
      id: '5',
      type: 'earned',
      amount: 0.1,
      reason: 'Exercise Completed',
      date: new Date(2024, 11, 2, 15, 10),
    },
    {
      id: '6',
      type: 'claimed',
      amount: 3.5,
      reason: 'Claimed',
      date: new Date(2024, 11, 1, 11, 30),
    },
  ]);

  const handleClaimAll = () => {
    // Claiming is currently disabled until on-chain distribution
    alert(t('claimingComingSoon') || 'Claiming will be available soon after token distribution and listing. Keep earning!');
  };

  const formatDate = (date: Date): string => {
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    
    return date.toLocaleDateString();
  };

  return (
    <div className="min-h-screen bg-[#0A0A28] pb-20">
      {/* Header */}
      <div className="bg-[#0E0E55] px-4 py-6 sticky top-0 z-10 border-b border-[#1A1A6E]">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <button onClick={onBack} className="text-white hover:text-gray-300">
              <ArrowLeft className="w-6 h-6" />
            </button>
            <div className="flex items-center gap-2">
              <Zap className="w-6 h-6 text-yellow-500" />
              <h1 className="text-white text-xl">{t('sparkRewards')}</h1>
            </div>
          </div>
          <HamburgerMenu 
            userRole={userRole}
            onNavigate={onNavigate}
            isPro={isPro}
          />
        </div>

        {/* Balance Cards */}
        <div className="grid grid-cols-2 gap-3">
          {/* Available Balance */}
          <div className="bg-yellow-500 rounded-lg p-4">
            <div className="flex items-center gap-2 mb-2">
              <Coins className="w-5 h-5 text-[#0E0E55]" />
              <span className="text-[#0E0E55] text-sm">{t('appBalance')}</span>
            </div>
            <div className="text-[#0E0E55] text-3xl font-bold">
              {availableBalance.toFixed(1)}
            </div>
            <div className="text-[#0E0E55]/70 text-xs mt-1">SPARK</div>
          </div>

          {/* Pending Balance */}
          <div className="bg-[#1A1A40] rounded-lg p-4 border-2 border-yellow-500/50">
            <div className="flex items-center gap-2 mb-2">
              <TrendingUp className="w-5 h-5 text-yellow-500" />
              <span className="text-white text-sm">{t('pending')}</span>
            </div>
            <div className="text-white text-3xl font-bold">
              {pendingBalance.toFixed(1)}
            </div>
            <div className="text-gray-400 text-xs mt-1">SPARK</div>
          </div>
        </div>

        {/* Claim Button (Disabled State) */}
        <div className="mt-4 bg-[#1A1A40] rounded-lg p-4 border border-[#1A1A6E]">
          <div className="flex items-start gap-3">
            <div className="bg-yellow-500/20 p-2 rounded-lg">
              <Crown className="w-5 h-5 text-yellow-500" />
            </div>
            <div>
              <h3 className="text-white font-medium text-sm mb-1">{t('claimingComingSoon')}</h3>
              <p className="text-gray-300 text-xs leading-relaxed">
                Tokens are not distributed on-chain yet. Just hold your tokens on the app. As soon as the token is distributed and listed, you will be allowed to claim it right after.
              </p>
            </div>
          </div>
          <button
            disabled
            className="w-full mt-3 bg-[#0E0E55] text-gray-400 py-3 rounded-lg flex items-center justify-center gap-2 font-semibold cursor-not-allowed border border-[#1A1A6E]"
          >
            <Zap className="w-5 h-5" />
            <span>{t('withdrawalsPaused')}</span>
          </button>
        </div>
      </div>

      <div className="p-4 space-y-4">
        {/* Total Earned Card */}
        <div className="bg-[#1A1A40] rounded-lg shadow-md p-5 border border-[#1A1A6E]">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-white">{t('totalEarned')}</h3>
            <div className="flex items-center gap-2">
              <Coins className="w-5 h-5 text-yellow-500" />
              <span className="text-2xl font-bold text-yellow-500">{totalEarned.toFixed(1)}</span>
              <span className="text-gray-400">SPARK</span>
            </div>
          </div>
          <div className="text-sm text-gray-300">
            {t('claimedTokens')}: {claimedBalance.toFixed(1)} SPARK
          </div>
          <div className="text-sm text-gray-300">
            {t('pendingTokens')}: {pendingBalance.toFixed(1)} SPARK
          </div>
        </div>

        {/* How to Earn */}
        <div className="bg-gradient-to-br from-yellow-500 to-yellow-400 rounded-lg shadow-lg p-5 border-2 border-yellow-600">
          <h3 className="text-[#0E0E55] mb-4 flex items-center gap-2">
            <Crown className="w-5 h-5" />
            {t('howToEarn')}
          </h3>
          <div className="space-y-3">
            <div className="bg-[#0E0E55] rounded-lg p-3 flex items-start gap-3">
              <div className="bg-yellow-500 rounded-lg p-2">
                <Dumbbell className="w-5 h-5 text-[#0E0E55]" />
              </div>
              <div className="flex-1">
                <div className="text-white font-medium">{t('earnByExercising')}</div>
                <div className="text-yellow-400 text-sm">{t('earnPerExercise')}</div>
              </div>
            </div>

            {userRole === 'coach' && (
              <div className="bg-[#0E0E55] rounded-lg p-3 flex items-start gap-3">
                <div className="bg-yellow-500 rounded-lg p-2">
                  <Users className="w-5 h-5 text-[#0E0E55]" />
                </div>
                <div className="flex-1">
                  <div className="text-white font-medium">{t('earnByAddingClients')}</div>
                  <div className="text-yellow-400 text-sm">{t('earnPerClient')}</div>
                </div>
              </div>
            )}
          </div>

          {!isPro && (
            <div className="mt-4 bg-[#0E0E55] rounded-lg p-3">
              <div className="text-white text-sm mb-2">
                {t('upgradeWithTokens')}
              </div>
              <button
                onClick={() => onNavigate('pro-subscription')}
                className="w-full bg-yellow-500 text-[#0E0E55] py-2 rounded-lg hover:bg-yellow-400 transition-colors font-semibold"
              >
                {t('becomePro')} (10 SPARK)
              </button>
              {availableBalance < 10 && (
                <div className="text-yellow-400 text-xs mt-2 text-center">
                  {interpolate(t('needMoreTokens'), { amount: (10 - availableBalance).toFixed(1) })}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Transaction History */}
        <div className="bg-[#1A1A40] rounded-lg shadow-md border border-[#1A1A6E]">
          <div className="p-5 border-b border-[#1A1A6E]">
            <h3 className="text-white">{t('tokenHistory')}</h3>
          </div>

          <div className="divide-y divide-[#1A1A6E]">
            {transactions.map((tx) => (
              <div key={tx.id} className="p-4 flex items-center gap-4 hover:bg-[#0E0E55] transition-colors">
                <div className={`rounded-full p-2 ${
                  tx.type === 'earned' 
                    ? 'bg-green-900/30' 
                    : tx.type === 'claimed'
                    ? 'bg-blue-900/30'
                    : 'bg-red-900/30'
                }`}>
                  {tx.type === 'earned' ? (
                    <TrendingUp className={`w-5 h-5 ${
                      tx.amount === 1.0 ? 'text-green-500' : 'text-green-400'
                    }`} />
                  ) : tx.type === 'claimed' ? (
                    <Check className="w-5 h-5 text-blue-500" />
                  ) : (
                    <Crown className="w-5 h-5 text-red-500" />
                  )}
                </div>

                <div className="flex-1">
                  <div className="text-gray-200 font-medium">
                    {tx.type === 'earned' ? t('earned') : tx.type === 'claimed' ? t('claimed') : t('spent')}
                  </div>
                  <div className="text-gray-400 text-sm">
                    {tx.reason === 'Exercise Completed' && t('exerciseCompleted')}
                    {tx.reason === 'Client Added' && t('clientAdded')}
                    {tx.reason === 'Claimed' && t('claimed')}
                    {tx.reason === 'Pro Upgrade' && t('proUpgrade')}
                  </div>
                  <div className="text-gray-500 text-xs mt-1">{formatDate(tx.date)}</div>
                </div>

                <div className={`text-lg font-bold ${
                  tx.type === 'earned'
                    ? 'text-green-500'
                    : tx.type === 'claimed'
                    ? 'text-blue-500'
                    : 'text-red-500'
                }`}>
                  {tx.type === 'earned' && '+'}
                  {tx.type === 'spent' && '-'}
                  {tx.amount.toFixed(1)}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Info Box */}
        <div className="bg-yellow-900/20 border border-yellow-500/30 rounded-lg p-4">
          <div className="flex gap-3">
            <Zap className="w-5 h-5 text-yellow-500 flex-shrink-0 mt-0.5" />
            <div className="text-sm text-gray-200">
              <div className="font-semibold mb-1 text-yellow-500">{t('whatIsSpark')}</div>
              <div className="text-gray-300">
                Spark is the energy currency of Coachwise. Earn it by staying active, coaching others, and contributing to the community. Hold your Spark tokens here until they are ready to be claimed on-chain!
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}