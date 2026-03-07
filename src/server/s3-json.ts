import { S3Client, PutObjectCommand, GetObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3';
import { Readable } from 'stream';

const region = process.env.AWS_REGION ?? 'us-east-1';
export const historyBlobBucket = process.env.S3_BUCKET;

if (!historyBlobBucket) {
  console.warn('S3_BUCKET is not set; history blob storage will fail at runtime.');
}

const s3 = new S3Client({ region });

async function streamToString(stream: any): Promise<string> {
  if (!stream) return '';
  if (typeof stream.transformToString === 'function') {
    return stream.transformToString();
  }
  const readable = stream as Readable;
  return await new Promise<string>((resolve, reject) => {
    const chunks: Buffer[] = [];
    readable.on('data', (chunk) => chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk)));
    readable.on('error', reject);
    readable.on('end', () => resolve(Buffer.concat(chunks).toString('utf-8')));
  });
}

export async function putJson(key: string, value: unknown) {
  if (!historyBlobBucket) throw new Error('Missing S3_BUCKET env var');
  const body = Buffer.from(JSON.stringify(value), 'utf-8');
  await s3.send(
    new PutObjectCommand({
      Bucket: historyBlobBucket,
      Key: key,
      Body: body,
      ContentType: 'application/json',
    })
  );
}

export async function getJson<T>(key: string): Promise<T | null> {
  if (!historyBlobBucket) throw new Error('Missing S3_BUCKET env var');
  const res = await s3.send(
    new GetObjectCommand({
      Bucket: historyBlobBucket,
      Key: key,
    })
  );

  const text = await streamToString(res.Body);
  if (!text) return null;
  return JSON.parse(text) as T;
}

export async function deleteObjectIfExists(key: string | undefined) {
  if (!key) return;
  if (!historyBlobBucket) throw new Error('Missing S3_BUCKET env var');
  await s3.send(
    new DeleteObjectCommand({
      Bucket: historyBlobBucket,
      Key: key,
    })
  );
}
