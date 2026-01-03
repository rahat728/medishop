import { NextRequest } from 'next/server';
import connectDB from '@/lib/db/mongoose';
import { User } from '@/lib/db/models';
import {
  successResponse,
  errorResponse,
  serverErrorResponse,
  validationErrorResponse,
} from '@/lib/api-response';

// =============================================================================
// Registration Validation
// =============================================================================

interface RegisterBody {
  name: string;
  email: string;
  password: string;
  phone?: string;
}

function validateRegistration(body: RegisterBody): string[] {
  const errors: string[] = [];

  if (!body.name || body.name.trim().length < 2) {
    errors.push('Name must be at least 2 characters');
  }

  if (!body.email || !/^\S+@\S+\.\S+$/.test(body.email)) {
    errors.push('Valid email is required');
  }

  if (!body.password || body.password.length < 6) {
    errors.push('Password must be at least 6 characters');
  }

  return errors;
}

// =============================================================================
// POST /api/auth/register
// =============================================================================

export async function POST(request: NextRequest) {
  try {
    await connectDB();

    const body: RegisterBody = await request.json();

    // Validate input
    const errors = validateRegistration(body);
    if (errors.length > 0) {
      return validationErrorResponse(errors);
    }

    // Check if email already exists
    const existingUser = await User.findOne({
      email: body.email.toLowerCase()
    });

    if (existingUser) {
      return errorResponse('An account with this email already exists', 409);
    }

    // Create user (password will be hashed by pre-save hook)
    const user = await User.create({
      name: body.name.trim(),
      email: body.email.toLowerCase().trim(),
      password: body.password,
      phone: body.phone?.trim(),
      role: 'customer', // Always customer for self-registration
    });

    // Return user without password
    const userResponse = {
      id: user._id.toString(),
      name: user.name,
      email: user.email,
      role: user.role,
    };

    return successResponse(userResponse, 'Account created successfully', 201);
  } catch (error: any) {
    // Handle mongoose validation errors
    if (error.name === 'ValidationError') {
      const errors = Object.values(error.errors).map((e: any) => e.message);
      return validationErrorResponse(errors);
    }

    // Handle duplicate key error
    if (error.code === 11000) {
      return errorResponse('An account with this email already exists', 409);
    }

    return serverErrorResponse(error);
  }
}
