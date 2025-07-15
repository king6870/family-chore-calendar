'use client';

import React, { useState, useEffect } from 'react';
import { formatBiddingStrategy, getBiddingAdvice } from '../../lib/smartBidding';

interface BiddingLimits {
  minBid: number;
  maxBid: number;
  recommendedBid: number;
  strategy: 'conservative' | 'balanced' | 'aggressive';
  reasoning: string;
  warningMessage?: string;
}

interface SmartBiddingData {
  biddingLimits: BiddingLimits;
  auctionInfo: {
    choreId: string;
    choreName: string;
    originalPoints: number;
    currentLowestBid?: number;
    timeRemainingHours: number;
    userCurrentBid?: number;
  };
  userInfo: {
    currentPoints: number;
    weeklyGoal: number;
    existingBidsCount: number;
    familyMemberCount: number;
  };
  weeklyContext: {
    totalChores: number;
    averageChoresPerPerson: number;
  };
}

interface SmartBiddingPanelProps {
  auctionId: string;
  currentBidAmount: number;
  onBidRecommendation: (recommendedBid: number) => void;
  isVisible: boolean;
}

export default function SmartBiddingPanel({ 
  auctionId, 
  currentBidAmount, 
  onBidRecommendation, 
  isVisible 
}: SmartBiddingPanelProps) {
  const [smartData, setSmartData] = useState<SmartBiddingData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isVisible && auctionId) {
      fetchSmartBiddingData();
    }
  }, [auctionId, isVisible]);

  const fetchSmartBiddingData = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await fetch('/api/auctions/smart-bidding', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ auctionId })
      });

      if (!response.ok) {
        throw new Error('Failed to fetch smart bidding data');
      }

      const data = await response.json();
      setSmartData(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  if (!isVisible) return null;

  if (loading) {
    return (
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
        <div className="flex items-center space-x-2">
          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
          <span className="text-blue-700">Calculating smart bidding strategy...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
        <div className="text-red-700">
          <strong>⚠️ Smart Bidding Unavailable</strong>
          <p className="text-sm mt-1">{error}</p>
        </div>
      </div>
    );
  }

  if (!smartData) return null;

  const { biddingLimits, auctionInfo, userInfo, weeklyContext } = smartData;
  const strategyInfo = formatBiddingStrategy(biddingLimits);
  const biddingAdvice = getBiddingAdvice(biddingLimits, currentBidAmount);

  const progressToGoal = (userInfo.currentPoints / userInfo.weeklyGoal) * 100;
  const pointsNeeded = Math.max(0, userInfo.weeklyGoal - userInfo.currentPoints);

  return (
    <div className="bg-gradient-to-br from-purple-50 to-blue-50 border border-purple-200 rounded-lg p-4 mb-4">
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-lg font-semibold text-purple-800 flex items-center">
          🧠 Smart Bidding Assistant
        </h3>
        <button
          onClick={() => onBidRecommendation(biddingLimits.recommendedBid)}
          className="px-3 py-1 bg-purple-600 text-white text-sm rounded-full hover:bg-purple-700 transition-colors"
        >
          Use Recommended: {biddingLimits.recommendedBid}
        </button>
      </div>

      {/* Strategy Badge */}
      <div className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium border mb-3 ${strategyInfo.color}`}>
        {strategyInfo.title}
      </div>

      {/* Current Bid Advice */}
      <div className="bg-white rounded-lg p-3 mb-3 border border-gray-200">
        <div className="text-sm font-medium text-gray-700 mb-1">Current Bid Analysis:</div>
        <div className="text-sm text-gray-600">{biddingAdvice}</div>
      </div>

      {/* Bidding Range */}
      <div className="grid grid-cols-3 gap-3 mb-3">
        <div className="text-center">
          <div className="text-xs text-gray-500 uppercase tracking-wide">Min Safe</div>
          <div className="text-lg font-bold text-green-600">{biddingLimits.minBid}</div>
        </div>
        <div className="text-center">
          <div className="text-xs text-gray-500 uppercase tracking-wide">Recommended</div>
          <div className="text-lg font-bold text-blue-600">{biddingLimits.recommendedBid}</div>
        </div>
        <div className="text-center">
          <div className="text-xs text-gray-500 uppercase tracking-wide">Max Safe</div>
          <div className="text-lg font-bold text-orange-600">{biddingLimits.maxBid}</div>
        </div>
      </div>

      {/* Visual Bidding Range */}
      <div className="mb-3">
        <div className="flex items-center justify-between text-xs text-gray-500 mb-1">
          <span>1 pt</span>
          <span>Safe Bidding Range</span>
          <span>{auctionInfo.originalPoints} pts</span>
        </div>
        <div className="relative h-2 bg-gray-200 rounded-full">
          {/* Safe range */}
          <div 
            className="absolute h-2 bg-green-300 rounded-full"
            style={{
              left: `${(biddingLimits.minBid / auctionInfo.originalPoints) * 100}%`,
              width: `${((biddingLimits.maxBid - biddingLimits.minBid) / auctionInfo.originalPoints) * 100}%`
            }}
          />
          {/* Recommended bid marker */}
          <div 
            className="absolute w-1 h-4 bg-blue-600 rounded-full -top-1"
            style={{
              left: `${(biddingLimits.recommendedBid / auctionInfo.originalPoints) * 100}%`
            }}
          />
          {/* Current bid marker (if exists) */}
          {currentBidAmount > 0 && (
            <div 
              className="absolute w-1 h-4 bg-purple-600 rounded-full -top-1"
              style={{
                left: `${(currentBidAmount / auctionInfo.originalPoints) * 100}%`
              }}
            />
          )}
        </div>
      </div>

      {/* Weekly Goal Progress */}
      <div className="bg-white rounded-lg p-3 mb-3 border border-gray-200">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium text-gray-700">Weekly Goal Progress</span>
          <span className="text-sm text-gray-600">
            {userInfo.currentPoints} / {userInfo.weeklyGoal} pts
          </span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div 
            className="bg-gradient-to-r from-green-400 to-blue-500 h-2 rounded-full transition-all duration-300"
            style={{ width: `${Math.min(100, progressToGoal)}%` }}
          />
        </div>
        <div className="text-xs text-gray-500 mt-1">
          {pointsNeeded > 0 ? `${pointsNeeded} points needed` : 'Goal achieved! 🎉'}
        </div>
      </div>

      {/* Context Information */}
      <div className="grid grid-cols-2 gap-3 mb-3">
        <div className="bg-white rounded-lg p-2 border border-gray-200">
          <div className="text-xs text-gray-500">Your Bids</div>
          <div className="text-sm font-medium">{userInfo.existingBidsCount} / {weeklyContext.totalChores}</div>
        </div>
        <div className="bg-white rounded-lg p-2 border border-gray-200">
          <div className="text-xs text-gray-500">Time Left</div>
          <div className="text-sm font-medium">{auctionInfo.timeRemainingHours.toFixed(1)}h</div>
        </div>
      </div>

      {/* Strategy Reasoning */}
      <div className="bg-white rounded-lg p-3 border border-gray-200">
        <div className="text-sm font-medium text-gray-700 mb-1">Strategy Reasoning:</div>
        <div className="text-sm text-gray-600">{biddingLimits.reasoning}</div>
        {biddingLimits.warningMessage && (
          <div className="mt-2 text-sm text-amber-600 bg-amber-50 p-2 rounded border border-amber-200">
            ⚠️ {biddingLimits.warningMessage}
          </div>
        )}
      </div>
    </div>
  );
}
