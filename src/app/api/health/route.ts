import { NextResponse } from 'next/server';
import mongoose from 'mongoose';
import connectDB from '@/lib/db/mongoose';

export async function GET() {
  try {
    await connectDB();

    const dbState = mongoose.connection.readyState;
    const states: Record<number, string> = {
      0: 'disconnected',
      1: 'connected',
      2: 'connecting',
      3: 'disconnecting',
    };

    return NextResponse.json({
      success: true,
      status: 'healthy',
      timestamp: new Date().toISOString(),
      database: {
        status: states[dbState] || 'unknown',
        name: mongoose.connection.name,
      },
    });
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        status: 'unhealthy',
        error: error instanceof Error ? error.message : 'Database connection failed',
      },
      { status: 500 }
    );
  }
}
