import { S3Client, PutObjectCommand, GetObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

const region = (process.env.AWS_REGION ?? 'us-east-1').trim();
export const s3Bucket = process.env.S3_BUCKET?.trim();

if (!s3Bucket) {
  console.warn("[s3] S3_BUCKET is not set; S3 features will fail at runtime.");
}

const s3 = new S3Client({ region });

export type UploadResult = {
  key: string;
  url: string;
  mimeType: string;
};

function sanitizeFilename(name: string) {
  return name.replace(/[^a-zA-Z0-9._-]/g, "_");
}

export async function uploadToS3(params: {
  filename: string;
  body: Uint8Array;
  mimeType: string;
}) {
  if (!s3Bucket) {
    throw new Error("Missing S3_BUCKET env var");
  }

  const key = `uploads/${Date.now()}-${crypto.randomUUID()}-${sanitizeFilename(params.filename)}`;

  try {
    await s3.send(
      new PutObjectCommand({
        Bucket: s3Bucket,
        Key: key,
        Body: params.body,
        ContentType: params.mimeType,
      })
    );
  } catch (err) {
    throw err;
  }

  try {
    const url = await getSignedUrl(
      s3,
      new GetObjectCommand({ Bucket: s3Bucket, Key: key }),
      { expiresIn: 60 * 60 }
    );
    return { key, url, mimeType: params.mimeType } satisfies UploadResult;
  } catch (err) {
    throw err;
  }
}

export async function presignGetUrl(key: string, expiresInSeconds = 60 * 60) {
  if (!s3Bucket) {
    throw new Error("Missing S3_BUCKET env var");
  }

  try {
    const url = await getSignedUrl(
      s3,
      new GetObjectCommand({ Bucket: s3Bucket, Key: key }),
      { expiresIn: expiresInSeconds }
    );
    return url;
  } catch (err) {
    throw err;
  }
}
