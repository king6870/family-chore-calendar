'use client';

import React, { useState } from 'react';

interface ChoreBid {
  id: string;
  bidPoints: number;
  createdAt: string;
  User: {
    id: string;
    name: string;
    nickname: string;
  };
}

interface ChoreAuction {
  id: string;
  weekStart: string;
  status: string;
  startPoints: number;
  finalPoints: number | null;
  winnerId: string | null;
  createdAt: string;
  endsAt: string;
  Chore: {
    id: string;
    name: string;
    description: string | null;
    points: number;
    difficulty: string;
    minAge: number;
  };
  User: {
    id: string;
    name: string;
    nickname: string;
  } | null;
  ChoreBid?: ChoreBid[];
}

interface FloatingBidPanelProps {
  auctions: ChoreAuction[];
  currentUserId: string;
  isVisible: boolean;
  onToggle: () => void;
}

export default function FloatingBidPanel({ auctions, currentUserId, isVisible, onToggle }: FloatingBidPanelProps) {
  const [activeTab, setActiveTab] = useState<'my-bids' | 'winning' | 'all-auctions'>('my-bids');

  // Get auctions where user has placed bids
  const myBidAuctions = auctions.filter(auction => 
    auction.ChoreBid && auction.ChoreBid.some(bid => bid.User.id === currentUserId)
  );

  // Get auctions where user is currently winning
  const winningAuctions = auctions.filter(auction => {
    if (!auction.ChoreBid || auction.ChoreBid.length === 0) return false;
    const lowestBid = auction.ChoreBid.reduce((lowest, bid) => 
      !lowest || bid.bidPoints < lowest.bidPoints ? bid : lowest, 
      null as ChoreBid | null
    );
    return lowestBid?.User.id === currentUserId;
  });

  // Get user's bid for a specific auction
  const getUserBid = (auction: ChoreAuction) => {
    if (!auction.ChoreBid) return null;
    return auction.ChoreBid
      .filter(bid => bid.User.id === currentUserId)
      .sort((a, b) => a.bidPoints - b.bidPoints)[0]; // Get lowest bid from user
  };

  // Check if user is winning an auction
  const isUserWinning = (auction: ChoreAuction) => {
    if (!auction.ChoreBid || auction.ChoreBid.length === 0) return false;
    const lowestBid = auction.ChoreBid.reduce((lowest, bid) => 
      !lowest || bid.bidPoints < lowest.bidPoints ? bid : lowest, 
      null as ChoreBid | null
    );
    return lowestBid?.User.id === currentUserId;
  };

  // Get the current lowest bid for an auction
  const getLowestBid = (auction: ChoreAuction) => {
    if (!auction.ChoreBid || auction.ChoreBid.length === 0) return null;
    return auction.ChoreBid.reduce((lowest, bid) => 
      !lowest || bid.bidPoints < lowest.bidPoints ? bid : lowest, 
      null as ChoreBid | null
    );
  };

  const formatTimeRemaining = (endsAt: string) => {
    const now = new Date();
    const end = new Date(endsAt);
    const diff = end.getTime() - now.getTime();
    
    if (diff <= 0) return 'Ended';
    
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    
    if (hours > 24) {
      const days = Math.floor(hours / 24);
      return `${days}d ${hours % 24}h`;
    }
    
    return `${hours}h ${minutes}m`;
  };

  if (!isVisible) {
    return (
      <button
        onClick={onToggle}
        className="fixed top-4 right-4 z-50 bg-blue-600 hover:bg-blue-700 text-white p-3 rounded-full shadow-lg transition-all duration-200 hover:scale-105"
        title="Open Bid Panel"
      >
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
        </svg>
      </button>
    );
  }

  return (
    <div className="fixed top-4 right-4 z-50 w-96 max-h-[80vh] bg-white rounded-lg shadow-2xl border border-gray-200 overflow-hidden">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white p-4 flex justify-between items-center">
        <h3 className="text-lg font-semibold">🏛️ My Auction Dashboard</h3>
        <button
          onClick={onToggle}
          className="text-white hover:text-gray-200 transition-colors"
          title="Close Panel"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-gray-200">
        <button
          onClick={() => setActiveTab('my-bids')}
          className={`flex-1 py-3 px-4 text-sm font-medium transition-colors ${
            activeTab === 'my-bids'
              ? 'bg-blue-50 text-blue-600 border-b-2 border-blue-600'
              : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          My Bids ({myBidAuctions.length})
        </button>
        <button
          onClick={() => setActiveTab('winning')}
          className={`flex-1 py-3 px-4 text-sm font-medium transition-colors ${
            activeTab === 'winning'
              ? 'bg-green-50 text-green-600 border-b-2 border-green-600'
              : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          Winning ({winningAuctions.length})
        </button>
        <button
          onClick={() => setActiveTab('all-auctions')}
          className={`flex-1 py-3 px-4 text-sm font-medium transition-colors ${
            activeTab === 'all-auctions'
              ? 'bg-purple-50 text-purple-600 border-b-2 border-purple-600'
              : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          All ({auctions.length})
        </button>
      </div>

      {/* Content */}
      <div className="max-h-96 overflow-y-auto">
        {activeTab === 'my-bids' && (
          <div className="p-4 space-y-3">
            {myBidAuctions.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <div className="text-4xl mb-2">🤷‍♂️</div>
                <p>No bids placed yet</p>
                <p className="text-sm">Start bidding on auctions below!</p>
              </div>
            ) : (
              myBidAuctions.map(auction => {
                const userBid = getUserBid(auction);
                const isWinning = isUserWinning(auction);
                const lowestBid = getLowestBid(auction);
                
                return (
                  <div key={auction.id} className={`p-3 rounded-lg border-2 ${
                    isWinning ? 'border-green-200 bg-green-50' : 'border-gray-200 bg-gray-50'
                  }`}>
                    <div className="flex justify-between items-start mb-2">
                      <h4 className="font-medium text-sm">{auction.Chore.name}</h4>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        isWinning 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-gray-100 text-gray-800'
                      }`}>
                        {isWinning ? '🏆 Winning' : '📊 Bidding'}
                      </span>
                    </div>
                    <div className="space-y-1 text-xs text-gray-600">
                      <div>Your bid: <span className="font-medium text-blue-600">{userBid?.bidPoints} pts</span></div>
                      <div>Current lowest: <span className="font-medium">{lowestBid?.bidPoints} pts</span></div>
                      <div>Time left: <span className="font-medium">{formatTimeRemaining(auction.endsAt)}</span></div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        )}

        {activeTab === 'winning' && (
          <div className="p-4 space-y-3">
            {winningAuctions.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <div className="text-4xl mb-2">🎯</div>
                <p>Not winning any auctions yet</p>
                <p className="text-sm">Place lower bids to win!</p>
              </div>
            ) : (
              winningAuctions.map(auction => {
                const userBid = getUserBid(auction);
                
                return (
                  <div key={auction.id} className="p-3 rounded-lg border-2 border-green-200 bg-green-50">
                    <div className="flex justify-between items-start mb-2">
                      <h4 className="font-medium text-sm">{auction.Chore.name}</h4>
                      <span className="px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                        🏆 Winning
                      </span>
                    </div>
                    <div className="space-y-1 text-xs text-gray-600">
                      <div>Your winning bid: <span className="font-medium text-green-600">{userBid?.bidPoints} pts</span></div>
                      <div>Original points: <span className="font-medium">{auction.startPoints} pts</span></div>
                      <div>Time left: <span className="font-medium">{formatTimeRemaining(auction.endsAt)}</span></div>
                      <div className="text-green-600 font-medium">💰 You'll save {auction.startPoints - (userBid?.bidPoints || 0)} points!</div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        )}

        {activeTab === 'all-auctions' && (
          <div className="p-4 space-y-3">
            {auctions.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <div className="text-4xl mb-2">📭</div>
                <p>No active auctions</p>
                <p className="text-sm">Check back later!</p>
              </div>
            ) : (
              auctions.map(auction => {
                const lowestBid = getLowestBid(auction);
                const userBid = getUserBid(auction);
                const isWinning = isUserWinning(auction);
                
                return (
                  <div key={auction.id} className="p-3 rounded-lg border border-gray-200 bg-gray-50">
                    <div className="flex justify-between items-start mb-2">
                      <h4 className="font-medium text-sm">{auction.Chore.name}</h4>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        auction.status === 'ACTIVE' 
                          ? 'bg-blue-100 text-blue-800' 
                          : 'bg-gray-100 text-gray-800'
                      }`}>
                        {auction.status}
                      </span>
                    </div>
                    <div className="space-y-1 text-xs text-gray-600">
                      <div>Current lowest: <span className="font-medium">{lowestBid?.bidPoints || auction.startPoints} pts</span></div>
                      {userBid && (
                        <div>Your bid: <span className={`font-medium ${isWinning ? 'text-green-600' : 'text-blue-600'}`}>
                          {userBid.bidPoints} pts {isWinning && '🏆'}
                        </span></div>
                      )}
                      <div>Time left: <span className="font-medium">{formatTimeRemaining(auction.endsAt)}</span></div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="bg-gray-50 px-4 py-3 border-t border-gray-200">
        <div className="text-xs text-gray-500 text-center">
          🏛️ Auction Dashboard • Real-time updates
        </div>
      </div>
    </div>
  );
}
