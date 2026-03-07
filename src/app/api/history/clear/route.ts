import { NextResponse } from 'next/server';
import { ScanCommand, BatchWriteCommand } from '@aws-sdk/lib-dynamodb';
import { ddbDoc, historyTableName } from '@/server/dynamodb';
import { verifyCognitoIdToken } from '@/server/cognito-auth';
import { deleteObjectIfExists } from '@/server/s3-json';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

function userPrefix(uid: string) {
  return `USER#${uid}#SESSION#`;
}

export async function POST(req: Request) {
  try {
    if (!historyTableName) throw new Error('Missing DDB_HISTORY_TABLE env var');
    const decoded = await verifyCognitoIdToken(req.headers.get('authorization'));
    const uid = decoded.sub;

    // Scan all sessions for the user.
    const result = await ddbDoc.send(
      new ScanCommand({
        TableName: historyTableName,
        FilterExpression: 'begins_with(PK, :prefix)',
        ExpressionAttributeValues: { ':prefix': userPrefix(uid) },
        ProjectionExpression: 'PK, messagesKey, analysisKey, comparisonKey',
      })
    );

    const items = result.Items ?? [];

    // Delete associated S3 blobs (best effort).
    await Promise.all(
      items.flatMap((it: any) => [
        deleteObjectIfExists(it.messagesKey),
        deleteObjectIfExists(it.analysisKey),
        deleteObjectIfExists(it.comparisonKey),
      ])
    );

    // Batch delete DDB items (25 at a time).
    for (let i = 0; i < items.length; i += 25) {
      const chunk = items.slice(i, i + 25);
      await ddbDoc.send(
        new BatchWriteCommand({
          RequestItems: {
            [historyTableName]: chunk.map((it: any) => ({
              DeleteRequest: { Key: { PK: it.PK } },
            })),
          },
        })
      );
    }

    return NextResponse.json({ ok: true });
  } catch (err: any) {
    const message = err?.message ?? 'Failed to clear history';
    const status = message.includes('Authorization') ? 401 : 400;
    return NextResponse.json({ error: message }, { status });
  }
}
