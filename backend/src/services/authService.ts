import * as TE from 'fp-ts/TaskEither';
import * as E from 'fp-ts/Either';
import { pipe } from 'fp-ts/function';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { DbConnection, queryRows, query } from '../utils/database';
import { AsyncResult, authenticationError, conflictError, validationError, tryCatch } from '../utils/Result';

export interface AuthServiceDeps {
  readonly pool: DbConnection;
}

export interface User {
  readonly id: string;
  readonly email: string;
}

export interface AuthResponse {
  readonly token: string;
  readonly user: User;
}

interface UserRow {
  readonly id: string;
  readonly email: string;
  readonly password_hash: string;
  readonly created_at: Date;
}

// Pure function to validate email
const validateEmail = (email: string): E.Either<any, string> =>
  /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
    ? E.right(email)
    : E.left(validationError('Invalid email format'));

// Pure function to validate password
const validatePassword = (password: string): E.Either<any, string> =>
  password.length >= 6
    ? E.right(password)
    : E.left(validationError('Password must be at least 6 characters'));

// Pure function to generate JWT
const generateToken = (user: User, secret: string, expiresIn: string): string =>
  jwt.sign({ id: user.id, email: user.email }, secret, { expiresIn } as jwt.SignOptions);

// Hash password
const hashPassword = (password: string): AsyncResult<any, string> =>
  tryCatch(
    () => bcrypt.hash(password, 10),
    () => validationError('Password hashing failed')
  );

// Verify password
const verifyPassword = (password: string, hash: string): AsyncResult<any, boolean> =>
  tryCatch(
    () => bcrypt.compare(password, hash),
    () => authenticationError('Password verification failed')
  );

// Check if user exists
const checkUserExists =
  (pool: DbConnection) =>
  (email: string): AsyncResult<any, boolean> =>
    pipe(
      queryRows<{ id: string }>(pool, 'SELECT id FROM users WHERE email = $1', [email]),
      TE.map((rows) => rows.length > 0)
    );

// Find user by email
const findUserByEmail =
  (pool: DbConnection) =>
  (email: string): AsyncResult<any, UserRow> =>
    pipe(
      queryRows<UserRow>(
        pool,
        'SELECT id, email, password_hash, created_at FROM users WHERE email = $1',
        [email]
      ),
      TE.chain((rows) =>
        rows.length > 0
          ? TE.right(rows[0])
          : TE.left(authenticationError('Invalid credentials'))
      )
    );

// Create user
const createUser =
  (pool: DbConnection) =>
  (email: string, passwordHash: string): AsyncResult<any, UserRow> =>
    pipe(
      query<UserRow>(
        pool,
        'INSERT INTO users (email, password_hash) VALUES ($1, $2) RETURNING id, email, created_at',
        [email, passwordHash]
      ),
      TE.map((result) => result.rows[0])
    );

// Register new user
export const register =
  ({ pool }: AuthServiceDeps) =>
  (email: string, password: string): AsyncResult<any, AuthResponse> =>
    pipe(
      TE.fromEither(validateEmail(email)),
      TE.chain(() => TE.fromEither(validatePassword(password))),
      TE.chain(() => checkUserExists(pool)(email)),
      TE.chain((exists) =>
        exists ? TE.left(conflictError('User already exists')) : TE.right(undefined)
      ),
      TE.chain(() => hashPassword(password)),
      TE.chain((passwordHash) => createUser(pool)(email, passwordHash)),
      TE.map((userRow) => {
        const user: User = { id: userRow.id, email: userRow.email };
        const secret = process.env.JWT_SECRET!;
        const expiresIn = process.env.JWT_EXPIRES_IN || '7d';
        const token = generateToken(user, secret, expiresIn);

        return { token, user };
      })
    );

// Login user
export const login =
  ({ pool }: AuthServiceDeps) =>
  (email: string, password: string): AsyncResult<any, AuthResponse> =>
    pipe(
      TE.fromEither(validateEmail(email)),
      TE.chain(() => findUserByEmail(pool)(email)),
      TE.chain((userRow) =>
        pipe(
          verifyPassword(password, userRow.password_hash),
          TE.chain((isValid) =>
            isValid
              ? TE.right(userRow)
              : TE.left(authenticationError('Invalid credentials'))
          )
        )
      ),
      TE.map((userRow) => {
        const user: User = { id: userRow.id, email: userRow.email };
        const secret = process.env.JWT_SECRET!;
        const expiresIn = process.env.JWT_EXPIRES_IN || '7d';
        const token = generateToken(user, secret, expiresIn);

        return { token, user };
      })
    );
