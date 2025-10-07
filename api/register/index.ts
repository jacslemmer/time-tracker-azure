import { app, HttpRequest, HttpResponseInit, InvocationContext } from '@azure/functions';
import * as TE from 'fp-ts/TaskEither';
import * as E from 'fp-ts/Either';
import { pipe } from 'fp-ts/function';
import { getContainers } from '../shared/cosmosClient';
import {
  validateEmail,
  validatePassword,
  hashPassword,
  generateToken,
  User,
  AuthResponse
} from '../shared/auth';

export async function register(
  request: HttpRequest,
  context: InvocationContext
): Promise<HttpResponseInit> {
  try {
    const body = await request.json() as { email: string; password: string };
    const { email, password } = body;

    const result = await pipe(
      TE.fromEither(validateEmail(email)),
      TE.chain(() => TE.fromEither(validatePassword(password))),
      TE.chain(() =>
        TE.tryCatch(
          async () => {
            const { usersContainer } = getContainers();
            const { resources } = await usersContainer.items
              .query({
                query: 'SELECT * FROM c WHERE c.email = @email',
                parameters: [{ name: '@email', value: email }]
              })
              .fetchAll();

            if (resources.length > 0) {
              throw new Error('User already exists');
            }
            return true;
          },
          () => 'Database query failed'
        )
      ),
      TE.chain(() => hashPassword(password)),
      TE.chain((passwordHash) =>
        TE.tryCatch(
          async () => {
            const { usersContainer } = getContainers();
            const newUser: User = {
              id: `user-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
              email,
              password_hash: passwordHash,
              created_at: new Date().toISOString()
            };

            await usersContainer.items.create(newUser);
            return newUser;
          },
          () => 'Failed to create user'
        )
      ),
      TE.map((user): AuthResponse => {
        const userWithoutPassword = {
          id: user.id,
          email: user.email,
          created_at: user.created_at
        };
        const token = generateToken(userWithoutPassword);
        return { token, user: userWithoutPassword };
      })
    )();

    if (E.isLeft(result)) {
      const statusCode = result.left === 'User already exists' ? 409 : 400;
      return {
        status: statusCode,
        jsonBody: { error: result.left }
      };
    }

    return {
      status: 201,
      jsonBody: result.right
    };
  } catch (error) {
    context.error('Register error:', error);
    return {
      status: 500,
      jsonBody: { error: 'Internal server error' }
    };
  }
}

app.http('register', {
  methods: ['POST'],
  authLevel: 'anonymous',
  route: 'auth/register',
  handler: register
});
