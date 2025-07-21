import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET() {
  try {
    // Check environment variables (without exposing secrets)
    const envCheck = {
      NEXTAUTH_URL: !!process.env.NEXTAUTH_URL,
      NEXTAUTH_SECRET: !!process.env.NEXTAUTH_SECRET,
      GOOGLE_CLIENT_ID: !!process.env.GOOGLE_CLIENT_ID,
      GOOGLE_CLIENT_SECRET: !!process.env.GOOGLE_CLIENT_SECRET,
      DATABASE_URL: !!process.env.DATABASE_URL,
      NEXTAUTH_URL_VALUE: process.env.NEXTAUTH_URL, // Safe to show URL
    }

    // Test database connection
    let dbStatus = 'unknown'
    let dbError = null
    try {
      await prisma.$connect()
      await prisma.user.findFirst()
      dbStatus = 'connected'
    } catch (error) {
      dbStatus = 'error'
      dbError = error instanceof Error ? error.message : 'Unknown error'
    }

    return NextResponse.json({
      environment: process.env.NODE_ENV,
      envVariables: envCheck,
      database: {
        status: dbStatus,
        error: dbError
      },
      timestamp: new Date().toISOString()
    })
  } catch (error) {
    return NextResponse.json({
      error: 'Debug check failed',
      message: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}
