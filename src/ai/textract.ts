import {
  TextractClient,
  DetectDocumentTextCommand,
  StartDocumentTextDetectionCommand,
  GetDocumentTextDetectionCommand,
} from "@aws-sdk/client-textract";
import { RekognitionClient, DetectTextCommand } from "@aws-sdk/client-rekognition";
import { S3Client, GetObjectCommand } from "@aws-sdk/client-s3";
import { s3Bucket } from "@/ai/s3";
import * as mammoth from "mammoth";

const region = (process.env.AWS_REGION ?? 'us-east-1').trim();
const textract = new TextractClient({ region });
const rekognition = new RekognitionClient({ region });
const s3Client = new S3Client({ region });

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function isPdfKey(key: string) {
  return key.toLowerCase().endsWith(".pdf");
}

function isTextFile(key: string) {
  const lower = key.toLowerCase();
  return lower.endsWith(".txt") || 
         lower.endsWith(".text") || 
         lower.endsWith(".md") || 
         lower.endsWith(".json") ||
         lower.endsWith(".xml") ||
         lower.endsWith(".csv");
}

function isDocxFile(key: string) {
  return key.toLowerCase().endsWith(".docx");
}

async function extractPdfLocally(key: string): Promise<string> {
  console.log('[textract:extractPdfLocally] extracting PDF using pdfjs-dist — key:', key);
  if (!s3Bucket) throw new Error("Missing S3_BUCKET env var");
  
  try {
    const response = await s3Client.send(
      new GetObjectCommand({
        Bucket: s3Bucket,
        Key: key,
      })
    );
    
    const buffer = await response.Body?.transformToByteArray();
    if (!buffer) throw new Error("Failed to read PDF from S3");
    
    // Dynamically import pdfjs and worker
    const pdfjs = await import('pdfjs-dist/legacy/build/pdf.js');
    await import('pdfjs-dist/legacy/build/pdf.worker.js');
    
    const loadingTask = pdfjs.getDocument({ 
      data: buffer,
      useWorkerFetch: false,
      isEvalSupported: false,
      useSystemFonts: true
    });
    const pdf = await loadingTask.promise;
    
    const textParts: string[] = [];
    
    for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
      const page = await pdf.getPage(pageNum);
      const textContent = await page.getTextContent();
      const pageText = textContent.items
        .map((item: any) => item.str)
        .join(' ');
      textParts.push(pageText);
    }
    
    const fullText = textParts.join('\n').trim();
    console.log('[textract:extractPdfLocally] PDF parsed successfully — text length:', fullText.length);
    return fullText;
  } catch (err) {
    console.error('[textract:extractPdfLocally] failed to parse PDF:', err);
    throw new Error(`PDF parsing failed: ${err instanceof Error ? err.message : 'Unknown error'}`);
  }
}

async function extractDocxLocally(key: string): Promise<string> {
  console.log('[textract:extractDocxLocally] extracting DOCX using mammoth — key:', key);
  if (!s3Bucket) throw new Error("Missing S3_BUCKET env var");
  
  try {
    const response = await s3Client.send(
      new GetObjectCommand({
        Bucket: s3Bucket,
        Key: key,
      })
    );
    
    const buffer = await response.Body?.transformToByteArray();
    if (!buffer) throw new Error("Failed to read DOCX from S3");
    
    const result = await mammoth.extractRawText({ buffer: Buffer.from(buffer) });
    console.log('[textract:extractDocxLocally] DOCX parsed successfully — text length:', result.value.length);
    return result.value.trim();
  } catch (err) {
    console.error('[textract:extractDocxLocally] failed to parse DOCX:', err);
    throw err;
  }
}

async function readTextFromS3(key: string): Promise<string> {
  console.log('[textract:readTextFromS3] reading text file directly from S3 — key:', key);
  if (!s3Bucket) throw new Error("Missing S3_BUCKET env var");
  
  try {
    const response = await s3Client.send(
      new GetObjectCommand({
        Bucket: s3Bucket,
        Key: key,
      })
    );
    
    const bodyString = await response.Body?.transformToString('utf-8');
    console.log('[textract:readTextFromS3] text file read successfully — length:', bodyString?.length);
    return bodyString || '';
  } catch (err) {
    console.error('[textract:readTextFromS3] failed to read text file:', err);
    throw err;
  }
}

export async function extractTextFromS3Object(key: string) {
  console.log('[textract:extractTextFromS3Object] called — key:', key);
  console.log('[textract:extractTextFromS3Object] s3Bucket:', s3Bucket ?? 'NOT SET');
  if (!s3Bucket) throw new Error("Missing S3_BUCKET env var");

  // Handle plain text files by reading directly from S3
  if (isTextFile(key)) {
    console.log('[textract:extractTextFromS3Object] detected text file — reading directly from S3');
    return await readTextFromS3(key);
  }

  // Handle DOCX files
  if (isDocxFile(key)) {
    console.log('[textract:extractTextFromS3Object] detected DOCX — using local parser');
    return await extractDocxLocally(key);
  }

  // Handle PDF files - use local parser only (no Textract fallback)
  if (isPdfKey(key)) {
    console.log('[textract:extractTextFromS3Object] detected PDF — using local pdf parser');
    return await extractPdfLocally(key);
  }

  // For images, use Rekognition DetectText
  console.log('[textract:extractTextFromS3Object] detected image — using Rekognition DetectText');
  return await extractImageWithRekognition(key);
}

async function extractImageWithRekognition(key: string): Promise<string> {
  console.log('[textract:extractImageWithRekognition] using Rekognition DetectText');
  if (!s3Bucket) throw new Error("Missing S3_BUCKET env var");
  
  try {
    const result = await rekognition.send(
      new DetectTextCommand({
        Image: {
          S3Object: {
            Bucket: s3Bucket,
            Name: key,
          },
        },
      })
    );
    
    console.log('[textract:extractImageWithRekognition] DetectText succeeded — detections:', result.TextDetections?.length);
    
    // Extract LINE type text (not individual words)
    const lines = (result.TextDetections ?? [])
      .filter((detection) => detection.Type === "LINE" && detection.DetectedText)
      .map((detection) => detection.DetectedText as string);
    
    const output = lines.join("\n").trim();
    console.log('[textract:extractImageWithRekognition] image extraction complete — lines:', lines.length, '— output length:', output.length);
    return output;
  } catch (err) {
    console.error('[textract:extractImageWithRekognition] DetectText failed:', err);
    throw new Error(`Image text extraction failed: ${err instanceof Error ? err.message : 'Unknown error'}`);
  }
}

async function extractPdfWithTextract(key: string): Promise<string> {
  console.log('[textract:extractPdfWithTextract] using async StartDocumentTextDetection');
  let start;
  try {
    start = await textract.send(
      new StartDocumentTextDetectionCommand({
        DocumentLocation: { S3Object: { Bucket: s3Bucket, Name: key } },
      })
    );
    console.log('[textract:extractPdfWithTextract] StartDocumentTextDetection succeeded — JobId:', start.JobId);
  } catch (err) {
    console.error('[textract:extractPdfWithTextract] StartDocumentTextDetection failed:', err);
    throw err;
  }

  const jobId = start.JobId;
  if (!jobId) throw new Error("Textract did not return a JobId");

  const lines: string[] = [];

  // Wait for completion
  for (let attempt = 0; attempt < 60; attempt++) {
    console.log(`[textract:extractPdfWithTextract] polling attempt ${attempt + 1}/60 — jobId: ${jobId}`);
    const result = await textract.send(
      new GetDocumentTextDetectionCommand({ JobId: jobId })
    );

    const status = result.JobStatus;
    console.log('[textract:extractPdfWithTextract] job status:', status);
    if (status === "IN_PROGRESS") {
      await sleep(1000);
      continue;
    }
    if (status !== "SUCCEEDED") {
      console.error('[textract:extractPdfWithTextract] job failed with status:', status);
      throw new Error(`Textract job failed: ${status ?? "UNKNOWN"}`);
    }

    // Collect all pages
    console.log('[textract:extractPdfWithTextract] job SUCCEEDED — collecting pages...');
    let pageToken: string | undefined = undefined;
    do {
      const page = await textract.send(
        new GetDocumentTextDetectionCommand({ JobId: jobId, NextToken: pageToken })
      );
      const pageLines = (page.Blocks ?? []).filter(b => b.BlockType === 'LINE' && b.Text);
      console.log('[textract:extractPdfWithTextract] page fetched — line blocks:', pageLines.length, '— nextToken present:', !!page.NextToken);
      pageLines.forEach((b) => {
        if (b.BlockType === "LINE" && b.Text) lines.push(b.Text);
      });
      pageToken = page.NextToken;
    } while (pageToken);

    console.log('[textract:extractPdfWithTextract] all pages collected — total lines:', lines.length);
    break;
  }

  const output = lines.join("\n").trim();
  console.log('[textract:extractPdfWithTextract] PDF extraction complete — output length:', output.length);
  return output;
}

async function extractImageWithTextract(key: string): Promise<string> {
  console.log('[textract:extractImageWithTextract] using sync DetectDocumentText');
  let detected;
  try {
    detected = await textract.send(
      new DetectDocumentTextCommand({
        Document: { S3Object: { Bucket: s3Bucket, Name: key } },
      })
    );
    console.log('[textract:extractImageWithTextract] DetectDocumentText succeeded — total blocks:', detected.Blocks?.length);
  } catch (err) {
    console.error('[textract:extractImageWithTextract] DetectDocumentText failed:', err);
    throw err;
  }

  const lines = (detected.Blocks ?? [])
    .filter((b) => b.BlockType === "LINE" && b.Text)
    .map((b) => b.Text as string);

  const output = lines.join("\n").trim();
  console.log('[textract:extractImageWithTextract] image extraction complete — lines:', lines.length, '— output length:', output.length);
  return output;
}
