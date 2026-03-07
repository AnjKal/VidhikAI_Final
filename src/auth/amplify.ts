'use client';

import { Amplify } from 'aws-amplify';

let configured = false;

export function ensureAmplifyConfigured() {
  if (configured) return;

  const region =
    process.env.NEXT_PUBLIC_COGNITO_REGION ??
    process.env.NEXT_PUBLIC_AWS_REGION ??
    undefined;

  const userPoolId = process.env.NEXT_PUBLIC_COGNITO_USER_POOL_ID;
  const userPoolClientId = process.env.NEXT_PUBLIC_COGNITO_USER_POOL_CLIENT_ID;

  if (!userPoolId || !userPoolClientId) {
    throw new Error(
      'Missing Cognito env vars. Set NEXT_PUBLIC_COGNITO_USER_POOL_ID and NEXT_PUBLIC_COGNITO_USER_POOL_CLIENT_ID.'
    );
  }

  Amplify.configure({
    Auth: {
      Cognito: {
        userPoolId,
        userPoolClientId,
        ...(region ? { region } : {}),
      },
    },
  });

  configured = true;
}
