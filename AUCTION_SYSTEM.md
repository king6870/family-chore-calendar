# Chore Auction System

The chore auction system has been implemented but is currently hidden. All code is preserved and can be re-enabled when needed.

## Features Implemented

### 🏛️ Core Auction System
- **Auction Creation**: Admins can create auctions for all family chores
- **Bidding System**: Family members bid LOWER points to win chores
- **Automatic Finalization**: Lowest bidder wins and gets chore assignments
- **Point Integration**: Winners earn the points they bid (not original chore points)

### 🎯 Admin Controls
- **Individual Controls**: Stop or delete specific auctions
- **Bulk Operations**: Stop All Auctions, Delete All Auctions
- **Finalization**: Convert winning bids to chore assignments
- **Re-creation**: Create new auctions after finalization

### 💰 Advanced Features
- **Bid Points System**: Assignments store bid amounts for correct point awards
- **Age Restrictions**: Users can only bid on age-appropriate chores
- **Auction Lifecycle**: Active → Stopped/Completed → Hidden → Re-creatable
- **No-Bid Handling**: Chores with no bids get +10% points and extended time

## Files Involved

### API Routes
- `app/api/auctions/route.ts` - Create and fetch auctions
- `app/api/auctions/[id]/route.ts` - Stop/delete individual auctions
- `app/api/auctions/bulk/route.ts` - Bulk operations (stop all, delete all)
- `app/api/auctions/finalize/route.ts` - Finalize auctions and create assignments
- `app/api/auctions/bid/route.ts` - Place bids on auctions

### Components
- `app/components/ChoreAuction.tsx` - Main auction interface
- Database schema includes Auction and AuctionBid models

### Database Models
```prisma
model Auction {
  id        String   @id @default(cuid())
  choreId   String
  familyId  String
  weekStart DateTime
  endTime   DateTime
  status    String   @default("active") // active, stopped, completed
  // ... relations
}

model AuctionBid {
  id        String @id @default(cuid())
  auctionId String
  userId    String
  bidPoints Int
  // ... relations
}

model ChoreAssignment {
  // ... existing fields
  bidPoints Int? // Points from auction bid (if assignment came from auction)
}
```

## How to Re-Enable

### 1. Enable Feature Flag
In `app/page.tsx`, change:
```typescript
const ENABLE_AUCTIONS = false
```
to:
```typescript
const ENABLE_AUCTIONS = true
```

### 2. Uncomment Import
In `app/page.tsx`, uncomment:
```typescript
import ChoreAuction from './components/ChoreAuction'
```

### 3. Update Component Section
In `app/page.tsx`, replace the placeholder with the actual component:
```typescript
{ENABLE_AUCTIONS && activeSection === 'auctions' && (
  <ChoreAuction currentUser={{
    id: user.id,
    name: user.name,
    nickname: user.nickname,
    age: user.age,
    isAdmin: user.isAdmin,
    isOwner: user.isOwner,
    totalPoints: user.totalPoints,
    email: user.email
  }} />
)}
```

## System Architecture

### Auction Workflow
1. **Admin creates auctions** for the week
2. **Users place bids** (lower points = better chance to win)
3. **Admin finalizes auctions** (creates chore assignments for winners)
4. **Auctions disappear** from view (completed status)
5. **New auctions can be created** for the same week

### Point System Integration
- When users complete auction-won chores, they earn the points they bid
- `ChoreAssignment.bidPoints` stores the bid amount
- Assignment completion logic uses `bidPoints || chore.points`

### Safety Features
- Admin-only auction management
- Confirmation dialogs for destructive actions
- Cannot delete completed auctions (preserves history)
- Age restrictions on bidding
- Proper error handling throughout

## Testing Checklist

When re-enabling, test:
- [ ] Auction creation works
- [ ] Bidding system functions
- [ ] Finalization creates assignments
- [ ] Bid points are awarded correctly
- [ ] Admin controls work (stop, delete, bulk operations)
- [ ] Auctions disappear after finalization
- [ ] New auctions can be created after finalization
- [ ] Age restrictions are enforced
- [ ] Error handling works properly

## Notes

- All auction code is preserved and functional
- Database schema supports the full auction system
- No data loss when re-enabling
- System designed for easy activation/deactivation
