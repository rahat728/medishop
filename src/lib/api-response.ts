import { NextResponse } from 'next/server';

// =============================================================================
// API Response Types
// =============================================================================

export interface ApiSuccessResponse<T = unknown> {
  success: true;
  data: T;
  message?: string;
}

export interface ApiErrorResponse {
  success: false;
  error: string;
  details?: unknown;
}

export type ApiResponse<T = unknown> = ApiSuccessResponse<T> | ApiErrorResponse;

// =============================================================================
// Response Helpers
// =============================================================================

export function successResponse<T>(
  data: T,
  message?: string,
  status: number = 200
): NextResponse<ApiSuccessResponse<T>> {
  return NextResponse.json(
    {
      success: true as const,
      data,
      message,
    },
    { status }
  );
}

export function errorResponse(
  error: string,
  status: number = 400,
  details?: unknown
): NextResponse<ApiErrorResponse> {
  return NextResponse.json(
    {
      success: false as const,
      error,
      details,
    },
    { status }
  );
}

export function createdResponse<T>(
  data: T,
  message: string = 'Created successfully'
): NextResponse<ApiSuccessResponse<T>> {
  return successResponse(data, message, 201);
}

export function notFoundResponse(
  message: string = 'Resource not found'
): NextResponse<ApiErrorResponse> {
  return errorResponse(message, 404);
}

export function unauthorizedResponse(
  message: string = 'Unauthorized'
): NextResponse<ApiErrorResponse> {
  return errorResponse(message, 401);
}

export function forbiddenResponse(
  message: string = 'Forbidden'
): NextResponse<ApiErrorResponse> {
  return errorResponse(message, 403);
}

export function serverErrorResponse(
  error: unknown
): NextResponse<ApiErrorResponse> {
  console.error('Server Error:', error);
  
  const message = error instanceof Error ? error.message : 'Internal server error';
  
  return errorResponse(message, 500);
}

// =============================================================================
// Validation Error Helper
// =============================================================================

export function validationErrorResponse(
  errors: Record<string, string[]> | string[]
): NextResponse<ApiErrorResponse> {
  return NextResponse.json(
    {
      success: false as const,
      error: 'Validation failed',
      details: errors,
    },
    { status: 422 }
  );
}
