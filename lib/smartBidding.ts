// Smart Bidding Algorithm for Family Chore Auctions
// Ensures family members can meet weekly goals even with bid losses

interface SmartBiddingParams {
  weeklyGoal: number;
  totalChores: number;
  familyMemberCount: number;
  userCurrentPoints: number;
  choreOriginalPoints: number;
  currentLowestBid?: number;
  userExistingBids: number; // Number of auctions user has already bid on
  timeRemainingHours: number;
}

interface BiddingLimits {
  minBid: number;
  maxBid: number;
  recommendedBid: number;
  strategy: 'conservative' | 'balanced' | 'aggressive';
  reasoning: string;
  warningMessage?: string;
}

export function calculateSmartBiddingLimits(params: SmartBiddingParams): BiddingLimits {
  const {
    weeklyGoal,
    totalChores,
    familyMemberCount,
    userCurrentPoints,
    choreOriginalPoints,
    currentLowestBid,
    userExistingBids,
    timeRemainingHours
  } = params;

  // Calculate points needed to reach weekly goal
  const pointsNeeded = Math.max(0, weeklyGoal - userCurrentPoints);
  
  // Estimate chores per person (assuming fair distribution)
  const estimatedChoresPerPerson = Math.ceil(totalChores / familyMemberCount);
  
  // Calculate average points needed per chore to meet goal
  const avgPointsNeededPerChore = pointsNeeded / estimatedChoresPerPerson;
  
  // Safety factor: assume user might lose some bids
  const winRateFactor = calculateWinRateFactor(familyMemberCount, userExistingBids, timeRemainingHours);
  const safetyMultiplier = 1 / winRateFactor; // If win rate is 50%, we need 2x more points per won chore
  
  const adjustedPointsNeeded = avgPointsNeededPerChore * safetyMultiplier;

  // Calculate bidding limits
  const maxAffordableBid = Math.max(1, Math.floor(adjustedPointsNeeded));
  const conservativeBid = Math.max(1, Math.floor(adjustedPointsNeeded * 0.8));
  const aggressiveBid = Math.min(choreOriginalPoints - 1, Math.floor(adjustedPointsNeeded * 1.2));

  // Determine strategy based on situation
  let strategy: 'conservative' | 'balanced' | 'aggressive';
  let recommendedBid: number;
  let reasoning: string;
  let warningMessage: string | undefined;

  // Strategy determination logic
  if (pointsNeeded <= userCurrentPoints * 0.1) {
    // User is close to goal - can be aggressive
    strategy = 'aggressive';
    recommendedBid = Math.min(aggressiveBid, currentLowestBid ? currentLowestBid - 1 : choreOriginalPoints - 1);
    reasoning = "You're close to your weekly goal - you can bid more aggressively for preferred chores.";
  } else if (userExistingBids >= estimatedChoresPerPerson * 1.5) {
    // User has bid on many chores - be conservative
    strategy = 'conservative';
    recommendedBid = conservativeBid;
    reasoning = "You've bid on many chores already - bid conservatively to ensure you can meet your goal.";
    warningMessage = "Consider your existing bids when placing new ones.";
  } else if (timeRemainingHours < 6) {
    // Time is running out - be more aggressive
    strategy = 'aggressive';
    recommendedBid = Math.min(aggressiveBid, currentLowestBid ? currentLowestBid - 1 : choreOriginalPoints - 1);
    reasoning = "Time is running out - bid more aggressively to secure chores.";
  } else {
    // Balanced approach
    strategy = 'balanced';
    recommendedBid = maxAffordableBid;
    reasoning = "Balanced bidding strategy based on your weekly goal and available chores.";
  }

  // Ensure bids are within reasonable bounds
  const minBid = Math.max(1, Math.min(conservativeBid, choreOriginalPoints - 1));
  const maxBid = Math.max(minBid, Math.min(maxAffordableBid, choreOriginalPoints - 1));
  recommendedBid = Math.max(minBid, Math.min(recommendedBid, maxBid));

  // Additional warnings
  if (pointsNeeded > totalChores * (choreOriginalPoints * 0.7)) {
    warningMessage = "Your weekly goal might be challenging to achieve with current chore availability.";
  }

  if (userExistingBids === 0 && totalChores / familyMemberCount < 2) {
    warningMessage = "Limited chores available - consider bidding on multiple chores to ensure you meet your goal.";
  }

  return {
    minBid,
    maxBid,
    recommendedBid,
    strategy,
    reasoning,
    warningMessage
  };
}

function calculateWinRateFactor(familyMemberCount: number, userExistingBids: number, timeRemainingHours: number): number {
  // Base win rate decreases with more family members
  let baseWinRate = 1 / familyMemberCount;
  
  // Adjust based on user's bidding activity
  if (userExistingBids > familyMemberCount) {
    baseWinRate *= 0.8; // Lower win rate if bidding on too many
  }
  
  // Adjust based on time remaining
  if (timeRemainingHours < 12) {
    baseWinRate *= 1.2; // Higher win rate as deadline approaches (less competition)
  }
  
  // Ensure reasonable bounds
  return Math.max(0.2, Math.min(0.8, baseWinRate));
}

export function getBiddingAdvice(limits: BiddingLimits, currentBid?: number): string {
  if (!currentBid) {
    return `💡 Recommended bid: ${limits.recommendedBid} points (${limits.strategy} strategy)`;
  }

  if (currentBid < limits.minBid) {
    return `⚠️ This bid might be too low to help you meet your weekly goal. Consider bidding at least ${limits.minBid} points.`;
  }

  if (currentBid > limits.maxBid) {
    return `⚠️ This bid might be too high and could prevent you from meeting your weekly goal. Consider bidding no more than ${limits.maxBid} points.`;
  }

  if (currentBid === limits.recommendedBid) {
    return `✅ Perfect! This bid aligns with your ${limits.strategy} strategy.`;
  }

  return `👍 This bid is within your safe range (${limits.minBid}-${limits.maxBid} points).`;
}

export function formatBiddingStrategy(limits: BiddingLimits): {
  title: string;
  description: string;
  color: string;
} {
  switch (limits.strategy) {
    case 'conservative':
      return {
        title: '🛡️ Conservative Strategy',
        description: 'Playing it safe to ensure you meet your weekly goal',
        color: 'text-green-600 bg-green-50 border-green-200'
      };
    case 'aggressive':
      return {
        title: '⚡ Aggressive Strategy', 
        description: 'Bidding competitively for preferred chores',
        color: 'text-red-600 bg-red-50 border-red-200'
      };
    default:
      return {
        title: '⚖️ Balanced Strategy',
        description: 'Optimal bidding based on your goals and competition',
        color: 'text-blue-600 bg-blue-50 border-blue-200'
      };
  }
}
