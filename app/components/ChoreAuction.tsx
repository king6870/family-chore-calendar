'use client';

import React, { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import FloatingBidPanel from './FloatingBidPanel';
import SmartBiddingPanel from './SmartBiddingPanel';

interface ChoreBid {
  id: string;
  bidPoints: number;
  createdAt: string;
  user: {
    id: string;
    name: string;
    nickname: string;
  };
}

interface ChoreAuction {
  id: string;
  weekStart: string;
  status: string;
  finalPoints: number | null;
  winnerId: string | null;
  createdAt: string;
  endTime: string;
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
  bids?: ChoreBid[];
}

interface User {
  id: string;
  name: string;
  nickname: string;
  age: number;
  isAdmin: boolean;
  isOwner: boolean;
  totalPoints: number;
  email: string;
}

interface ChoreAuctionProps {
  currentUser: User;
}

export default function ChoreAuction({ currentUser }: ChoreAuctionProps) {
  const { data: session } = useSession();
  const [auctions, setAuctions] = useState<ChoreAuction[]>([]);
  const [currentWeek, setCurrentWeek] = useState<Date>(getStartOfWeek(new Date()));
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error' | 'info'; text: string } | null>(null);
  const [bidAmounts, setBidAmounts] = useState<{ [key: string]: number }>({});
  const [showFloatingPanel, setShowFloatingPanel] = useState(false);
  const [showSmartBidding, setShowSmartBidding] = useState<{ [key: string]: boolean }>({});

  // Get start of week (Sunday)
  function getStartOfWeek(date: Date): Date {
    const start = new Date(date);
    const day = start.getDay();
    const diff = start.getDate() - day;
    start.setDate(diff);
    start.setHours(0, 0, 0, 0);
    return start;
  }

  useEffect(() => {
    fetchAuctions();
  }, [currentWeek]);

  const fetchAuctions = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/auctions?weekStart=${currentWeek.toISOString()}`);
      if (response.ok) {
        const data = await response.json();
        setAuctions(data.auctions || []);
      } else {
        console.error('Failed to fetch auctions');
        setAuctions([]);
      }
    } catch (error) {
      console.error('Error fetching auctions:', error);
      setAuctions([]);
    } finally {
      setLoading(false);
    }
  };

  const createAuctions = async () => {
    if (!confirm('This will create new auctions for all chores this week. Continue?')) {
      return;
    }

    try {
      setLoading(true);
      setMessage(null);

      const response = await fetch('/api/auctions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          weekStart: currentWeek.toISOString(),
          auctionDurationHours: 24
        })
      });

      if (response.ok) {
        const data = await response.json();
        setMessage({
          type: 'success',
          text: data.message
        });
        await fetchAuctions();
      } else {
        const error = await response.json();
        setMessage({
          type: 'error',
          text: error.error || 'Failed to create auctions'
        });
      }
    } catch (error) {
      setMessage({
        type: 'error',
        text: 'An error occurred while creating auctions'
      });
    } finally {
      setLoading(false);
    }

    setTimeout(() => setMessage(null), 5000);
  };

  const placeBid = async (auctionId: string) => {
    const bidAmount = bidAmounts[auctionId];
    
    if (!bidAmount || bidAmount <= 0) {
      setMessage({
        type: 'error',
        text: 'Please enter a valid bid amount'
      });
      setTimeout(() => setMessage(null), 3000);
      return;
    }

    // Preserve scroll position
    const scrollPosition = window.pageYOffset || document.documentElement.scrollTop;

    try {
      setLoading(true);

      const response = await fetch('/api/auctions/bid', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          auctionId,
          bidPoints: bidAmount
        })
      });

      if (response.ok) {
        const data = await response.json();
        
        // Update auctions state directly instead of full reload
        if (data.auction) {
          setAuctions(prevAuctions => 
            prevAuctions.map(auction => 
              auction.id === auctionId ? data.auction : auction
            )
          );
        }
        
        // Clear the bid input
        setBidAmounts(prev => ({ ...prev, [auctionId]: 0 }));
        
        // Show success message briefly
        setMessage({
          type: 'success',
          text: `Bid placed successfully! ${data.isLowestBid ? 'You\'re winning! 🎉' : ''}`
        });
        setTimeout(() => setMessage(null), 3000);
        
        // Restore scroll position after state updates
        setTimeout(() => {
          window.scrollTo(0, scrollPosition);
        }, 0);
        
      } else {
        const error = await response.json();
        setMessage({
          type: 'error',
          text: error.error || 'Failed to place bid'
        });
        setTimeout(() => setMessage(null), 3000);
      }
    } catch (error) {
      setMessage({
        type: 'error',
        text: 'An error occurred while placing bid'
      });
      setTimeout(() => setMessage(null), 3000);
    } finally {
      setLoading(false);
      // Ensure scroll position is maintained
      setTimeout(() => {
        window.scrollTo(0, scrollPosition);
      }, 100);
    }
  };

  const finalizeAuctions = async () => {
    if (!confirm('This will finalize all auctions and assign chores. Continue?')) {
      return;
    }

    try {
      setLoading(true);
      setMessage(null);

      const response = await fetch('/api/auctions/finalize', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          weekStart: currentWeek.toISOString()
        })
      });

      if (response.ok) {
        const data = await response.json();
        setMessage({
          type: 'success',
          text: data.message
        });
        await fetchAuctions();
      } else {
        const error = await response.json();
        setMessage({
          type: 'error',
          text: error.error || 'Failed to finalize auctions'
        });
      }
    } catch (error) {
      setMessage({
        type: 'error',
        text: 'An error occurred while finalizing auctions'
      });
    } finally {
      setLoading(false);
    }

    setTimeout(() => setMessage(null), 5000);
  };

  const navigateWeek = (direction: 'prev' | 'next') => {
    const newWeek = new Date(currentWeek);
    newWeek.setDate(currentWeek.getDate() + (direction === 'next' ? 7 : -7));
    setCurrentWeek(newWeek);
  };

  const goToCurrentWeek = () => {
    setCurrentWeek(getStartOfWeek(new Date()));
  };

  const formatWeekRange = (startDate: Date): string => {
    const endDate = new Date(startDate);
    endDate.setDate(startDate.getDate() + 6);
    
    const startMonth = startDate.toLocaleDateString('en-US', { month: 'short' });
    const endMonth = endDate.toLocaleDateString('en-US', { month: 'short' });
    const startDay = startDate.getDate();
    const endDay = endDate.getDate();
    const year = startDate.getFullYear();
    
    if (startMonth === endMonth) {
      return `${startMonth} ${startDay}-${endDay}, ${year}`;
    } else {
      return `${startMonth} ${startDay} - ${endMonth} ${endDay}, ${year}`;
    }
  };

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty.toLowerCase()) {
      case 'easy': return 'bg-green-100 text-green-800 border-green-200';
      case 'medium': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'hard': return 'bg-red-100 text-red-800 border-red-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getTimeRemaining = (endsAt: string): string => {
    // Validate input
    if (!endsAt) return 'Invalid date';
    
    const now = new Date();
    const end = new Date(endsAt);
    
    // Check if the date is valid
    if (isNaN(end.getTime())) return 'Invalid date';
    
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
  };

  const canBidOnChore = (auction: ChoreAuction): boolean => {
    // Check age requirement
    if (currentUser.age && currentUser.age < auction.Chore.minAge) {
      return false;
    }
    
    // Check if auction is active and not ended
    if (auction.status !== 'active' || new Date() > new Date(auction.endTime)) {
      return false;
    }
    
    return true;
  };

  const getLowestBid = (auction: ChoreAuction): ChoreBid | null => {
    return auction.bids && auction.bids.length > 0 ? auction.bids[0] : null;
  };

  const isUserWinning = (auction: ChoreAuction): boolean => {
    const lowestBid = getLowestBid(auction);
    return lowestBid?.user.id === currentUser.id;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h2 className="text-2xl font-bold text-gray-800">🏛️ Chore Auctions</h2>
            <p className="text-gray-600 mt-1">Bid on chores to get the best deals!</p>
            <p className="text-sm text-gray-500 mt-1">{formatWeekRange(currentWeek)}</p>
          </div>
          
          <div className="flex items-center space-x-2">
            <button
              type="button"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                navigateWeek('prev');
              }}
              className="px-3 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
              disabled={loading}
            >
              ← Previous
            </button>
            
            <button
              type="button"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                goToCurrentWeek();
              }}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              disabled={loading}
            >
              Current Week
            </button>
            
            <button
              type="button"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                navigateWeek('next');
              }}
              className="px-3 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
              disabled={loading}
            >
              Next →
            </button>
          </div>
        </div>

        {/* Admin Controls */}
        {currentUser.isAdmin && (
          <div className="mt-4 flex flex-wrap gap-2">
            <button
              type="button"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                createAuctions();
              }}
              disabled={loading || auctions.length > 0}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                loading || auctions.length > 0
                  ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                  : 'bg-green-600 hover:bg-green-700 text-white'
              }`}
            >
              {auctions.length > 0 ? 'Auctions Already Created' : '🏛️ Create Auctions'}
            </button>
            
            {auctions.length > 0 && (
              <button
                type="button"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  finalizeAuctions();
                }}
                disabled={loading}
                className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                  loading
                    ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                    : 'bg-orange-600 hover:bg-orange-700 text-white'
                }`}
              >
                ⚡ Finalize Auctions
              </button>
            )}
          </div>
        )}

        {/* Messages */}
        {message && (
          <div className={`mt-4 p-4 rounded-lg ${
            message.type === 'success' ? 'bg-green-50 text-green-800 border border-green-200' :
            message.type === 'error' ? 'bg-red-50 text-red-800 border border-red-200' :
            'bg-blue-50 text-blue-800 border border-blue-200'
          }`}>
            {message.text}
          </div>
        )}
      </div>

      {/* Auctions List */}
      <div className="space-y-4">
        {loading ? (
          <div className="bg-white rounded-lg shadow-md p-8 text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
            <p className="text-gray-600 mt-2">Loading auctions...</p>
          </div>
        ) : auctions.length === 0 ? (
          <div className="bg-white rounded-lg shadow-md p-8 text-center">
            <div className="text-4xl mb-4">🏛️</div>
            <h3 className="text-lg font-semibold text-gray-800 mb-2">No Auctions Available</h3>
            <p className="text-gray-600 mb-4">
              {currentUser.isAdmin 
                ? 'Create auctions for this week to get started!' 
                : 'Ask an admin to create auctions for this week.'}
            </p>
          </div>
        ) : (
          auctions.map((auction) => {
            const lowestBid = getLowestBid(auction);
            const canBid = canBidOnChore(auction);
            const isWinning = isUserWinning(auction);
            const timeRemaining = getTimeRemaining(auction.endTime);
            const hasEnded = new Date() > new Date(auction.endTime);
            
            return (
              <div key={auction.id} className="bg-white rounded-lg shadow-md p-6">
                <div className="flex flex-col lg:flex-row gap-6">
                  {/* Chore Info */}
                  <div className="flex-1">
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <h3 className="text-xl font-semibold text-gray-800">{auction.Chore.name}</h3>
                        {auction.Chore.description && (
                          <p className="text-gray-600 mt-1">{auction.Chore.description}</p>
                        )}
                      </div>
                      
                      <div className="flex items-center space-x-2">
                        <span className={`px-2 py-1 rounded text-sm ${getDifficultyColor(auction.Chore.difficulty)}`}>
                          {auction.Chore.difficulty}
                        </span>
                        <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded text-sm">
                          Min Age: {auction.Chore.minAge}
                        </span>
                      </div>
                    </div>

                    {/* Auction Status */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                      <div>
                        <div className="text-sm text-gray-600">Starting Points</div>
                        <div className="text-lg font-semibold text-gray-800">{auction.Chore.points}</div>
                      </div>
                      
                      <div>
                        <div className="text-sm text-gray-600">Current Lowest</div>
                        <div className="text-lg font-semibold text-green-600">
                          {lowestBid ? `${lowestBid.bidPoints}pts` : 'No bids'}
                        </div>
                      </div>
                      
                      <div>
                        <div className="text-sm text-gray-600">Time Remaining</div>
                        <div className={`text-lg font-semibold ${hasEnded ? 'text-red-600' : 'text-orange-600'}`}>
                          {timeRemaining}
                        </div>
                      </div>
                      
                      <div>
                        <div className="text-sm text-gray-600">Status</div>
                        <div className={`text-lg font-semibold ${
                          auction.status === 'completed' ? 'text-green-600' :
                          hasEnded ? 'text-red-600' : 'text-blue-600'
                        }`}>
                          {auction.status === 'completed' ? 'Completed' :
                           hasEnded ? 'Ended' : 'Active'}
                        </div>
                      </div>
                    </div>

                    {/* Current Bids */}
                    {auction.bids && auction.bids.length > 0 && (
                      <div className="mb-4">
                        <h4 className="font-medium text-gray-800 mb-2">Current Bids ({auction.bids.length})</h4>
                        <div className="space-y-1">
                          {auction.bids.slice(0, 3).map((bid, index) => (
                            <div key={bid.id} className={`flex justify-between items-center p-2 rounded ${
                              bid.user.id === currentUser.id ? 'bg-blue-50 border border-blue-200' : 'bg-gray-50'
                            }`}>
                              <span className="font-medium">
                                {index === 0 && '🥇 '}
                                {bid.user.nickname || bid.user.name}
                                {bid.user.id === currentUser.id && ' (You)'}
                              </span>
                              <span className="font-semibold text-green-600">{bid.bidPoints}pts</span>
                            </div>
                          ))}
                          {auction.bids && auction.bids.length > 3 && (
                            <div className="text-sm text-gray-500 text-center">
                              +{auction.bids.length - 3} more bids
                            </div>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Winner Display */}
                    {auction.status === 'completed' && auction.User && (
                      <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                        <div className="flex items-center">
                          <span className="text-green-600 mr-2">🏆</span>
                          <span className="font-medium text-green-800">
                            Won by {auction.User.nickname || auction.User.name} for {auction.finalPoints}pts
                          </span>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Bidding Section */}
                  {auction.status === 'active' && !hasEnded && (
                    <div className="lg:w-80">
                      <div className="bg-gray-50 rounded-lg p-4">
                        <h4 className="font-semibold text-gray-800 mb-3">Place Your Bid</h4>
                        
                        {!canBid ? (
                          <div className="text-center py-4">
                            <div className="text-gray-500 mb-2">
                              {currentUser.age && currentUser.age < auction.Chore.minAge 
                                ? `You must be at least ${auction.Chore.minAge} years old`
                                : 'Cannot bid on this auction'}
                            </div>
                          </div>
                        ) : (
                          <div className="space-y-3">
                            {/* Smart Bidding Toggle */}
                            <div className="flex items-center justify-between">
                              <label className="block text-sm font-medium text-gray-700">
                                Bid Amount (points)
                              </label>
                              <button
                                type="button"
                                onClick={() => setShowSmartBidding(prev => ({
                                  ...prev,
                                  [auction.id]: !prev[auction.id]
                                }))}
                                className="text-xs px-2 py-1 bg-purple-100 text-purple-700 rounded-full hover:bg-purple-200 transition-colors"
                              >
                                🧠 {showSmartBidding[auction.id] ? 'Hide' : 'Smart'} Assistant
                              </button>
                            </div>

                            {/* Smart Bidding Panel */}
                            <SmartBiddingPanel
                              auctionId={auction.id}
                              currentBidAmount={bidAmounts[auction.id] || 0}
                              onBidRecommendation={(recommendedBid) => {
                                setBidAmounts(prev => ({
                                  ...prev,
                                  [auction.id]: recommendedBid
                                }));
                              }}
                              isVisible={showSmartBidding[auction.id] || false}
                            />

                            <div>
                              <input
                                type="number"
                                min="1"
                                max={lowestBid ? lowestBid.bidPoints - 1 : auction.Chore.points}
                                value={bidAmounts[auction.id] || ''}
                                onChange={(e) => setBidAmounts(prev => ({
                                  ...prev,
                                  [auction.id]: parseInt(e.target.value) || 0
                                }))}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                placeholder={`Max: ${lowestBid ? lowestBid.bidPoints - 1 : auction.Chore.points}`}
                              />
                            </div>
                            
                            <button
                              type="button"
                              onClick={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                                placeBid(auction.id);
                              }}
                              disabled={loading || !bidAmounts[auction.id] || bidAmounts[auction.id] <= 0}
                              className={`w-full py-2 px-4 rounded-lg font-medium transition-colors ${
                                loading || !bidAmounts[auction.id] || bidAmounts[auction.id] <= 0
                                  ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                                  : isWinning
                                  ? 'bg-green-600 hover:bg-green-700 text-white'
                                  : 'bg-blue-600 hover:bg-blue-700 text-white'
                              }`}
                            >
                              {isWinning ? '🥇 Update Winning Bid' : '💰 Place Bid'}
                            </button>
                            
                            {isWinning && (
                              <div className="text-center text-sm text-green-600 font-medium">
                                You're currently winning! 🎉
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Help Section */}
      <div className="bg-blue-50 rounded-lg p-6 border border-blue-200">
        <h3 className="text-lg font-semibold text-blue-800 mb-3">💡 How Chore Auctions Work</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-blue-700">
          <div>
            <h4 className="font-medium mb-2">🏛️ Bidding Process</h4>
            <ul className="text-sm space-y-1">
              <li>• Bid LOWER points to win the chore</li>
              <li>• Lowest bid wins when auction ends</li>
              <li>• You can update your bid anytime</li>
              <li>• Must meet age requirements to bid</li>
            </ul>
          </div>
          <div>
            <h4 className="font-medium mb-2">📈 No Bids = Higher Points</h4>
            <ul className="text-sm space-y-1">
              <li>• Chores with no bids get +10% points</li>
              <li>• Auction extends for 24 more hours</li>
              <li>• Process repeats until someone bids</li>
              <li>• Great opportunity for higher rewards!</li>
            </ul>
          </div>
        </div>
      </div>

      {/* Floating Bid Panel */}
      <FloatingBidPanel
        auctions={auctions}
        currentUserId={currentUser.id}
        isVisible={showFloatingPanel}
        onToggle={() => setShowFloatingPanel(!showFloatingPanel)}
      />
    </div>
  );
}
