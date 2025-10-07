import { app, HttpRequest, HttpResponseInit, InvocationContext } from '@azure/functions';
import * as TE from 'fp-ts/TaskEither';
import * as E from 'fp-ts/Either';
import { pipe } from 'fp-ts/function';
import { getContainers } from '../shared/cosmosClient';
import {
  validateEmail,
  validatePassword,
  verifyPassword,
  generateToken,
  User,
  AuthResponse
} from '../shared/auth';

export async function login(
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

            if (resources.length === 0) {
              throw new Error('Invalid credentials');
            }

            return resources[0] as User;
          },
          () => 'Database query failed'
        )
      ),
      TE.chain((user) =>
        pipe(
          verifyPassword(password, user.password_hash!),
          TE.chain((isValid) =>
            isValid
              ? TE.right(user)
              : TE.left('Invalid credentials')
          )
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
      return {
        status: 401,
        jsonBody: { error: result.left }
      };
    }

    return {
      status: 200,
      jsonBody: result.right
    };
  } catch (error) {
    context.error('Login error:', error);
    return {
      status: 500,
      jsonBody: { error: 'Internal server error' }
    };
  }
}

app.http('login', {
  methods: ['POST'],
  authLevel: 'anonymous',
  route: 'auth/login',
  handler: login
});
