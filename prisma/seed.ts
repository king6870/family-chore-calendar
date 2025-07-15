import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

const defaultChores = [
  // Easy chores (suitable for younger kids)
  { name: 'Make bed', description: 'Make your bed every morning', points: 5, minAge: 5, difficulty: 'Easy' },
  { name: 'Put toys away', description: 'Clean up toys and put them in their place', points: 5, minAge: 3, difficulty: 'Easy' },
  { name: 'Feed pets', description: 'Give food and water to pets', points: 10, minAge: 6, difficulty: 'Easy' },
  { name: 'Set the table', description: 'Put plates, cups, and utensils on the table', points: 8, minAge: 5, difficulty: 'Easy' },
  { name: 'Water plants', description: 'Water indoor and outdoor plants', points: 8, minAge: 6, difficulty: 'Easy' },
  
  // Medium chores
  { name: 'Load dishwasher', description: 'Put dirty dishes in the dishwasher', points: 15, minAge: 8, difficulty: 'Medium' },
  { name: 'Vacuum living room', description: 'Vacuum the living room carpet and furniture', points: 20, minAge: 10, difficulty: 'Medium' },
  { name: 'Take out trash', description: 'Empty trash cans and take bags to curb', points: 15, minAge: 8, difficulty: 'Medium' },
  { name: 'Fold laundry', description: 'Fold clean clothes and put them away', points: 20, minAge: 9, difficulty: 'Medium' },
  { name: 'Clean bathroom sink', description: 'Wipe down bathroom sink and mirror', points: 15, minAge: 8, difficulty: 'Medium' },
  
  // Hard chores (suitable for older kids and adults)
  { name: 'Cook dinner', description: 'Prepare a full meal for the family', points: 35, minAge: 12, difficulty: 'Hard' },
  { name: 'Mow the lawn', description: 'Cut grass in front and back yard', points: 30, minAge: 14, difficulty: 'Hard' },
  { name: 'Deep clean kitchen', description: 'Clean counters, appliances, and floors thoroughly', points: 40, minAge: 12, difficulty: 'Hard' },
  { name: 'Wash and fold all laundry', description: 'Complete laundry process from start to finish', points: 35, minAge: 12, difficulty: 'Hard' },
  { name: 'Grocery shopping', description: 'Shop for weekly groceries with list', points: 25, minAge: 16, difficulty: 'Hard' },
  { name: 'Clean entire bathroom', description: 'Deep clean toilet, shower, sink, and floors', points: 30, minAge: 10, difficulty: 'Hard' },
]

async function main() {
  console.log('Seeding database with default chores...')
  
  // This seed will be run when families are created
  // For now, just log that the seed data is ready
  console.log(`Prepared ${defaultChores.length} default chores for families`)
  console.log('Default chores will be added when families are created')
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })

export { defaultChores }
