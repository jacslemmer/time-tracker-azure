import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import * as TE from 'fp-ts/TaskEither';
import * as E from 'fp-ts/Either';
import { pipe } from 'fp-ts/function';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '7d';

export interface User {
  id: string;
  email: string;
  password_hash?: string;
  created_at: string;
}

export interface AuthResponse {
  token: string;
  user: Omit<User, 'password_hash'>;
}

// Pure function to validate email
export const validateEmail = (email: string): E.Either<string, string> =>
  /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
    ? E.right(email)
    : E.left('Invalid email format');

// Pure function to validate password
export const validatePassword = (password: string): E.Either<string, string> =>
  password.length >= 6
    ? E.right(password)
    : E.left('Password must be at least 6 characters');

// Hash password
export const hashPassword = (password: string): TE.TaskEither<string, string> =>
  TE.tryCatch(
    () => bcrypt.hash(password, 10),
    () => 'Password hashing failed'
  );

// Verify password
export const verifyPassword = (
  password: string,
  hash: string
): TE.TaskEither<string, boolean> =>
  TE.tryCatch(
    () => bcrypt.compare(password, hash),
    () => 'Password verification failed'
  );

// Generate JWT token
export const generateToken = (user: Omit<User, 'password_hash'>): string =>
  jwt.sign({ id: user.id, email: user.email }, JWT_SECRET, {
    expiresIn: JWT_EXPIRES_IN
  } as jwt.SignOptions);

// Verify JWT token
export const verifyToken = (token: string): E.Either<string, any> =>
  E.tryCatch(
    () => jwt.verify(token, JWT_SECRET),
    () => 'Invalid or expired token'
  );

// Extract user from authorization header
export const extractUserFromHeader = (authHeader?: string): E.Either<string, any> => {
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return E.left('Missing or invalid authorization header');
  }

  const token = authHeader.substring(7);
  return verifyToken(token);
};
