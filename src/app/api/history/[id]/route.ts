import { NextResponse } from 'next/server';
import { z } from 'zod';
import { GetCommand, UpdateCommand, DeleteCommand } from '@aws-sdk/lib-dynamodb';
import { ddbDoc, historyTableName } from '@/server/dynamodb';
import { verifyCognitoIdToken } from '@/server/cognito-auth';
import { deleteObjectIfExists, getJson, putJson } from '@/server/s3-json';
import { presignGetUrl } from '@/ai/s3';
import type { HistoryItem, Document } from '@/lib/history';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const PatchSchema = z
  .object({
    document: z.any().optional(),
    documentA: z.any().optional(),
    documentB: z.any().optional(),
    messages: z.any().optional(),
    analysis: z.any().nullable().optional(),
    comparison: z.any().nullable().optional(),
  })
  .strict();

function itemPk(uid: string, sessionId: string) {
  return `USER#${uid}#SESSION#${sessionId}`;
}

async function hydrateDocumentUrls(doc: Document): Promise<Document> {
  if (doc.s3Key) {
    const url = await presignGetUrl(doc.s3Key);
    return { ...doc, url };
  }
  return doc;
}

async function hydrate(item: any): Promise<HistoryItem> {
  const base = {
    id: item.id as string,
    userId: item.userId as string,
    createdAt: item.createdAt as number,
  };

  if (item.type === 'chat') {
    const [analysis, messages] = await Promise.all([
      item.analysisKey ? getJson<any>(item.analysisKey) : Promise.resolve(null),
      item.messagesKey ? getJson<any>(item.messagesKey) : Promise.resolve([]),
    ]);

    return {
      ...base,
      type: 'chat',
      document: await hydrateDocumentUrls(item.document as Document),
      analysis,
      messages: Array.isArray(messages) ? messages : [],
    } as HistoryItem;
  }

  const comparison = item.comparisonKey ? await getJson<any>(item.comparisonKey) : null;

  return {
    ...base,
    type: 'compare',
    documentA: await hydrateDocumentUrls(item.documentA as Document),
    documentB: await hydrateDocumentUrls(item.documentB as Document),
    comparison,
  } as HistoryItem;
}

export async function GET(req: Request, ctx: { params: Promise<{ id: string }> }) {
  try {
    if (!historyTableName) throw new Error('Missing DDB_HISTORY_TABLE env var');
    const decoded = await verifyCognitoIdToken(req.headers.get('authorization'));
    const uid = decoded.sub;

    const { id } = await ctx.params;

    const res = await ddbDoc.send(
      new GetCommand({
        TableName: historyTableName,
        Key: { PK: itemPk(uid, id) },
      })
    );

    if (!res.Item) return NextResponse.json({ error: 'Not found' }, { status: 404 });

    return NextResponse.json({ item: await hydrate(res.Item) });
  } catch (err: any) {
    const message = err?.message ?? 'Failed to load session';
    const status = message.includes('Authorization') ? 401 : 400;
    return NextResponse.json({ error: message }, { status });
  }
}

export async function PATCH(req: Request, ctx: { params: Promise<{ id: string }> }) {
  try {
    if (!historyTableName) throw new Error('Missing DDB_HISTORY_TABLE env var');
    const decoded = await verifyCognitoIdToken(req.headers.get('authorization'));
    const uid = decoded.sub;

    const { id } = await ctx.params;
    const patch = PatchSchema.parse(await req.json());

    const key = { PK: itemPk(uid, id) };

    const current = await ddbDoc.send(
      new GetCommand({
        TableName: historyTableName,
        Key: key,
      })
    );
    if (!current.Item) return NextResponse.json({ error: 'Not found' }, { status: 404 });

    const item: any = current.Item;

    const updates: Record<string, any> = {};

    if (patch.document) updates.document = patch.document;
    if (patch.documentA) updates.documentA = patch.documentA;
    if (patch.documentB) updates.documentB = patch.documentB;

    if (patch.messages !== undefined) {
      const messagesKey = item.messagesKey ?? `history/${uid}/${id}/messages.json`;
      await putJson(messagesKey, patch.messages);
      updates.messagesKey = messagesKey;
    }

    if (patch.analysis !== undefined) {
      if (patch.analysis === null) {
        // Keep key but set value to null by deleting object if exists
        await deleteObjectIfExists(item.analysisKey);
        updates.analysisKey = undefined;
      } else {
        const analysisKey = item.analysisKey ?? `history/${uid}/${id}/analysis.json`;
        await putJson(analysisKey, patch.analysis);
        updates.analysisKey = analysisKey;
      }
    }

    if (patch.comparison !== undefined) {
      if (patch.comparison === null) {
        await deleteObjectIfExists(item.comparisonKey);
        updates.comparisonKey = undefined;
      } else {
        const comparisonKey = item.comparisonKey ?? `history/${uid}/${id}/comparison.json`;
        await putJson(comparisonKey, patch.comparison);
        updates.comparisonKey = comparisonKey;
      }
    }

    updates.updatedAt = Date.now();

    const names: Record<string, string> = {};
    const values: Record<string, any> = {};
    const sets: string[] = [];
    const removes: string[] = [];

    for (const [k, v] of Object.entries(updates)) {
      const nameKey = `#${k}`;
      names[nameKey] = k;
      if (v === undefined) {
        removes.push(nameKey);
      } else {
        const valueKey = `:${k}`;
        values[valueKey] = v;
        sets.push(`${nameKey} = ${valueKey}`);
      }
    }

    const updateExpressionParts: string[] = [];
    if (sets.length) updateExpressionParts.push(`SET ${sets.join(', ')}`);
    if (removes.length) updateExpressionParts.push(`REMOVE ${removes.join(', ')}`);

    if (updateExpressionParts.length) {
      await ddbDoc.send(
        new UpdateCommand({
          TableName: historyTableName,
          Key: key,
          UpdateExpression: updateExpressionParts.join(' '),
          ExpressionAttributeNames: names,
          ExpressionAttributeValues: Object.keys(values).length ? values : undefined,
        })
      );
    }

    return NextResponse.json({ ok: true });
  } catch (err: any) {
    const message = err?.message ?? 'Failed to update session';
    const status = message.includes('Authorization') ? 401 : 400;
    return NextResponse.json({ error: message }, { status });
  }
}

export async function DELETE(req: Request, ctx: { params: Promise<{ id: string }> }) {
  try {
    if (!historyTableName) throw new Error('Missing DDB_HISTORY_TABLE env var');
    const decoded = await verifyCognitoIdToken(req.headers.get('authorization'));
    const uid = decoded.sub;

    const { id } = await ctx.params;
    const key = { PK: itemPk(uid, id) };

    const current = await ddbDoc.send(
      new GetCommand({
        TableName: historyTableName,
        Key: key,
      })
    );

    if (current.Item) {
      await Promise.all([
        deleteObjectIfExists((current.Item as any).messagesKey),
        deleteObjectIfExists((current.Item as any).analysisKey),
        deleteObjectIfExists((current.Item as any).comparisonKey),
      ]);
    }

    await ddbDoc.send(
      new DeleteCommand({
        TableName: historyTableName,
        Key: key,
      })
    );

    return NextResponse.json({ ok: true });
  } catch (err: any) {
    const message = err?.message ?? 'Failed to delete session';
    const status = message.includes('Authorization') ? 401 : 400;
    return NextResponse.json({ error: message }, { status });
  }
}
