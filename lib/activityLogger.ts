import { prisma } from './prisma';

interface ActivityLogData {
  userId: string;
  familyId: string;
  action: string;
  details?: string;
  description?: string;
}

export async function createActivityLog(data: ActivityLogData) {
  try {
    // Try with details field first (local schema)
    if (data.details) {
      return await prisma.activityLog.create({
        data: {
          userId: data.userId,
          familyId: data.familyId,
          action: data.action,
          details: data.details
        }
      });
    }
    
    // Try with description field (production schema)
    if (data.description) {
      return await prisma.activityLog.create({
        data: {
          userId: data.userId,
          familyId: data.familyId,
          action: data.action,
          description: data.description
        } as any // Type assertion to handle schema mismatch
      });
    }

    // Fallback - try both fields
    const logData = data.details || data.description;
    return await prisma.activityLog.create({
      data: {
        userId: data.userId,
        familyId: data.familyId,
        action: data.action,
        details: logData,
        description: logData
      } as any
    });
    
  } catch (error) {
    // If ActivityLog creation fails, log the error but don't fail the main operation
    console.error('Failed to create activity log:', error);
    console.log('Activity log data:', data);
    
    // Return a mock success response so the main operation continues
    return { id: 'failed-log', ...data };
  }
}
