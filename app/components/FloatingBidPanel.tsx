'use client';

import { useState, useEffect } from 'react';

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
  ChoreBid: ChoreBid[];
}

interface User {
  id: string;
  name: string;
  nickname: string;
  age: number;
  isAdmin: boolean;
  isOwner: boolean;
}

interface FloatingBidPanelProps {
  currentUser: User;
  auctions: ChoreAuction[];
  onPlaceBid: (auctionId: string, bidAmount: number) => Promise<void>;
  loading: boolean;
}

export default function FloatingBidPanel({ currentUser, auctions, onPlaceBid, loading }: FloatingBidPanelProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [bidAmounts, setBidAmounts] = useState<{ [key: string]: number }>({});

  // Get user's active bids
  const userBids = auctions.flatMap(auction => 
    auction.ChoreBid
      .filter(bid => bid.User.id === currentUser.id)
      .map(bid => ({
        ...bid,
        auctionId: auction.id,
        choreName: auction.Chore.name,
        isWinning: auction.ChoreBid[0]?.id === bid.id,
        timeRemaining: getTimeRemaining(auction.endsAt),
        hasEnded: new Date() > new Date(auction.endsAt)
      }))
  );

  // Get auctions user can bid on
  const availableAuctions = auctions.filter(auction => 
    auction.status === 'active' && 
    new Date() <= new Date(auction.endsAt) &&
    (!currentUser.age || currentUser.age >= auction.Chore.minAge)
  );

  function getTimeRemaining(endsAt: string): string {
    const now = new Date();
    const end = new Date(endsAt);
    const diff = end.getTime() - now.getTime();
    
    if (diff <= 0) return 'Ended';
    
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    
    if (hours > 24) {
      const days = Math.floor(hours / 24);
      return `${days}d ${hours % 24}h`;
    } else if (hours > 0) {
      return `${hours}h ${minutes}m`;
    } else {
      return `${minutes}m`;
    }
  }

  const handleQuickBid = async (auctionId: string) => {
    const bidAmount = bidAmounts[auctionId];
    if (!bidAmount || bidAmount <= 0) return;
    
    await onPlaceBid(auctionId, bidAmount);
    setBidAmounts(prev => ({ ...prev, [auctionId]: 0 }));
  };

  return (
    <div className="fixed top-4 right-4 z-50">
      {/* Floating Panel */}
      <div className={`bg-white rounded-lg shadow-xl border transition-all duration-300 ${
        isExpanded ? 'w-80 h-96' : 'w-16 h-16'
      }`}>
        
        {/* Toggle Button */}
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="absolute top-2 right-2 w-12 h-12 bg-blue-600 text-white rounded-full hover:bg-blue-700 transition-colors flex items-center justify-center shadow-lg"
        >
          {isExpanded ? '✕' : '🏛️'}
        </button>

        {/* Panel Content */}
        {isExpanded && (
          <div className="p-4 pt-16 h-full overflow-y-auto">
            <h3 className="font-bold text-gray-800 mb-3">Quick Bid Panel</h3>
            
            {/* User's Active Bids */}
            {userBids.length > 0 && (
              <div className="mb-4">
                <h4 className="font-medium text-gray-700 mb-2 text-sm">Your Bids ({userBids.length})</h4>
                <div className="space-y-2">
                  {userBids.slice(0, 3).map((bid) => (
                    <div key={bid.id} className={`p-2 rounded text-xs ${
                      bid.isWinning ? 'bg-green-50 border border-green-200' : 'bg-gray-50'
                    }`}>
                      <div className="font-medium truncate">{bid.choreName}</div>
                      <div className="flex justify-between items-center">
                        <span className={bid.isWinning ? 'text-green-600' : 'text-gray-600'}>
                          {bid.bidPoints}pts {bid.isWinning && '🥇'}
                        </span>
                        <span className="text-gray-500">{bid.timeRemaining}</span>
                      </div>
                    </div>
                  ))}
                  {userBids.length > 3 && (
                    <div className="text-xs text-gray-500 text-center">
                      +{userBids.length - 3} more bids
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Quick Bid Section */}
            {availableAuctions.length > 0 && (
              <div>
                <h4 className="font-medium text-gray-700 mb-2 text-sm">Quick Bid</h4>
                <div className="space-y-2">
                  {availableAuctions.slice(0, 2).map((auction) => {
                    const lowestBid = auction.ChoreBid[0];
                    const maxBid = lowestBid ? lowestBid.bidPoints - 1 : auction.startPoints;
                    
                    return (
                      <div key={auction.id} className="p-2 bg-blue-50 rounded text-xs">
                        <div className="font-medium truncate mb-1">{auction.Chore.name}</div>
                        <div className="flex items-center space-x-1">
                          <input
                            type="number"
                            min="1"
                            max={maxBid}
                            value={bidAmounts[auction.id] || ''}
                            onChange={(e) => setBidAmounts(prev => ({
                              ...prev,
                              [auction.id]: parseInt(e.target.value) || 0
                            }))}
                            className="w-16 px-1 py-1 text-xs border rounded"
                            placeholder={`Max: ${maxBid}`}
                          />
                          <button
                            onClick={() => handleQuickBid(auction.id)}
                            disabled={loading || !bidAmounts[auction.id] || bidAmounts[auction.id] <= 0}
                            className={`px-2 py-1 text-xs rounded transition-colors ${
                              loading || !bidAmounts[auction.id] || bidAmounts[auction.id] <= 0
                                ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                                : 'bg-blue-600 hover:bg-blue-700 text-white'
                            }`}
                          >
                            Bid
                          </button>
                        </div>
                        <div className="text-gray-500 mt-1">
                          Current: {lowestBid ? `${lowestBid.bidPoints}pts` : 'No bids'}
                        </div>
                      </div>
                    );
                  })}
                  {availableAuctions.length > 2 && (
                    <div className="text-xs text-gray-500 text-center">
                      +{availableAuctions.length - 2} more auctions
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* No Content Message */}
            {userBids.length === 0 && availableAuctions.length === 0 && (
              <div className="text-center text-gray-500 text-sm py-8">
                <div className="text-2xl mb-2">🏛️</div>
                <p>No active auctions or bids</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
