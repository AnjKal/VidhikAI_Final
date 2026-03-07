import { CognitoJwtVerifier } from 'aws-jwt-verify';

let verifier:
  | ReturnType<typeof CognitoJwtVerifier.create>
  | undefined;

function getVerifier() {
  if (verifier) return verifier;

  const userPoolId = (process.env.COGNITO_USER_POOL_ID ?? process.env.NEXT_PUBLIC_COGNITO_USER_POOL_ID)?.trim();
  const clientId = (
    process.env.COGNITO_USER_POOL_CLIENT_ID ??
    process.env.NEXT_PUBLIC_COGNITO_USER_POOL_CLIENT_ID
  )?.trim();

  if (!userPoolId || !clientId) {
    throw new Error(
      'Missing Cognito env vars. Set COGNITO_USER_POOL_ID and COGNITO_USER_POOL_CLIENT_ID (or NEXT_PUBLIC_* equivalents).' 
    );
  }

  verifier = CognitoJwtVerifier.create({
    userPoolId,
    tokenUse: 'id',
    clientId,
  });

  return verifier;
}

export type CognitoIdTokenPayload = {
  sub: string;
  email?: string;
  [key: string]: unknown;
};

export async function verifyCognitoIdToken(authHeader: string | null): Promise<CognitoIdTokenPayload> {
  if (!authHeader) throw new Error('Missing Authorization header');

  const [scheme, token] = authHeader.split(' ');
  if (scheme !== 'Bearer' || !token) {
    throw new Error('Invalid Authorization header format');
  }

  const payload = (await getVerifier().verify(token)) as unknown as CognitoIdTokenPayload;
  if (!payload?.sub) throw new Error('Invalid token payload');
  return payload;
}
