import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '../../../lib/auth';
import { prisma } from '../../../lib/prisma';

// POST - Submit a new suggestion (only endpoint needed - viewing is database-only)
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    const { title, description, category, priority } = await request.json();

    // Validate required fields
    if (!title || !description) {
      return NextResponse.json({ error: 'Title and description are required' }, { status: 400 });
    }

    // Validate category and priority
    const validCategories = ['general', 'feature', 'bug', 'improvement'];
    const validPriorities = ['low', 'medium', 'high'];

    if (category && !validCategories.includes(category)) {
      return NextResponse.json({ error: 'Invalid category' }, { status: 400 });
    }

    if (priority && !validPriorities.includes(priority)) {
      return NextResponse.json({ error: 'Invalid priority' }, { status: 400 });
    }

    let suggestionData: any = {
      title: title.trim(),
      description: description.trim(),
      category: category || 'general',
      priority: priority || 'medium',
      status: 'pending'
    };

    // If user is logged in, add user context
    if (session?.user?.email) {
      const currentUser = await prisma.user.findUnique({
        where: { email: session.user.email },
        include: { family: true }
      });

      if (currentUser) {
        suggestionData.userId = currentUser.id;
        suggestionData.familyId = currentUser.familyId;
        suggestionData.userEmail = currentUser.email;
        suggestionData.userName = currentUser.name || currentUser.nickname || 'Unknown User';
      }
    } else {
      // Anonymous suggestion - still allow it
      suggestionData.userEmail = 'anonymous';
      suggestionData.userName = 'Anonymous User';
    }

    // Try to create suggestion in database
    try {
      const suggestion = await prisma.suggestion.create({
        data: suggestionData
      });

      return NextResponse.json({ 
        success: true,
        message: 'Thank you for your suggestion! Your feedback has been submitted and will be reviewed.',
        suggestionId: suggestion.id
      });

    } catch (dbError) {
      // If suggestion table doesn't exist or there's a database error, log for manual review
      console.error('Database error creating suggestion:', dbError);
      console.log('SUGGESTION SUBMITTED (Database fallback):', {
        timestamp: new Date().toISOString(),
        error: dbError instanceof Error ? dbError.message : 'Unknown error',
        ...suggestionData
      });

      return NextResponse.json({ 
        success: true,
        message: 'Thank you for your suggestion! Your feedback has been logged and will be reviewed.' 
      });
    }

  } catch (error) {
    console.error('Error creating suggestion:', error);
    return NextResponse.json({ error: 'Failed to submit suggestion' }, { status: 500 });
  }
}
