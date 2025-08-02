import { prisma } from './prisma';

interface ActivityLogData {
  userId: string;
  familyId: string;
  action: string;
  details?: string;
}

export async function createActivityLog(data: ActivityLogData) {
  try {
    // Create ActivityLog with details field only
    return await prisma.activityLog.create({
      data: {
        userId: data.userId,
        familyId: data.familyId,
        action: data.action,
        details: data.details || null
      }
    });
    
  } catch (error) {
    // If ActivityLog creation fails, log the error but don't fail the main operation
    console.error('Failed to create activity log:', error);
    console.log('Activity log data:', data);
    
    // Return a mock success response so the main operation continues
    return { id: 'failed-log', ...data };
  }
}
