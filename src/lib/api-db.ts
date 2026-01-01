import connectDB from './db/mongoose';
import { serverErrorResponse } from './api-response';

// =============================================================================
// Database Connection Wrapper for API Routes
// =============================================================================

export async function withDB<T>(
  handler: () => Promise<T>
): Promise<T> {
  await connectDB();
  return handler();
}

// =============================================================================
// Try-Catch Wrapper for API Handlers
// =============================================================================

export async function apiHandler<T>(
  handler: () => Promise<T>
): Promise<T | ReturnType<typeof serverErrorResponse>> {
  try {
    await connectDB();
    return await handler();
  } catch (error) {
    return serverErrorResponse(error);
  }
}
