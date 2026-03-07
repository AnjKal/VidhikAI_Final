'use client';
import { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { FileUp, GitCompareArrows, Loader2, FileText, Bot, Plus, Minus, Pencil } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import type { Document, HistoryItem } from '@/lib/history';
import type { CompareDocumentsOutput } from '@/ai/flows/compare';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from './ui/accordion';
import { GradientCard } from './ui/gradient-card';
import { ScrollAnimation } from './ui/scroll-animation';
import { useAuth } from '@/auth';

type FileSlot = 'A' | 'B';

type DocumentComparisonProps = {
  session: Extract<HistoryItem, { type: 'compare' }> | null;
  onComparisonComplete: (
    documentA: Document,
    documentB: Document,
    comparison: CompareDocumentsOutput
  ) => void;
};

function FilePlaceholder({
  onFileUpload,
  slot,
  authFetch,
}: {
  onFileUpload: (slot: FileSlot, file: Document) => void;
  slot: FileSlot;
  authFetch: (input: string | URL, init?: RequestInit) => Promise<Response>;
}) {
  const { toast } = useToast();
  const [isUploading, setIsUploading] = useState(false);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    console.log('[FilePlaceholder] file selected:', file.name, 'slot:', slot);
    setIsUploading(true);

    const reader = new FileReader();

    reader.onload = async (e) => {
      try {
        const dataUrl = e.target?.result as string;

        const res = await authFetch('/api/upload', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ filename: file.name, dataUrl }),
        });

        const json = await res.json();

        if (!res.ok) {
          throw new Error(json?.error || 'Upload failed');
        }

        const doc: Document = {
          name: file.name,
          url: json.url,
          s3Key: json.key,
          mimeType: json.mimeType,
        };

        onFileUpload(slot, doc);

        toast({
          title: 'Upload Successful',
          description: `Document ${slot} uploaded successfully.`,
        });
      } catch (err: any) {
        toast({
          title: 'Upload Error',
          description: err?.message || 'Failed to upload the file.',
          variant: 'destructive',
        });
      } finally {
        setIsUploading(false);
      }
    };

    reader.onerror = () => {
      setIsUploading(false);
      toast({
        title: 'Read Error',
        description: 'Failed to read the file.',
        variant: 'destructive',
      });
    };

    reader.readAsDataURL(file);

    event.target.value = '';
  };

  if (isUploading) {
    return (
      <div className="flex h-full w-full flex-col items-center justify-center rounded-lg border-2 border-dashed border-border p-8 text-center">
        <Loader2 className="h-10 w-10 text-primary animate-spin" />
        <h3 className="mt-4 font-semibold">Uploading Document {slot}...</h3>
        <p className="mt-1 text-sm text-muted-foreground">Please wait</p>
      </div>
    );
  }

  return (
    <label className="flex h-full w-full cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed border-border p-8 text-center transition-colors hover:border-primary/50">
      <FileUp className="h-10 w-10 text-muted-foreground" />
      <h3 className="mt-4 font-semibold">Upload Document {slot}</h3>
      <p className="mt-1 text-sm text-muted-foreground">Click or drag file here</p>
      <input
        type="file"
        className="sr-only"
        onChange={handleFileChange}
        accept=".txt,.pdf,.docx,.json,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document,image/png,image/jpeg"
      />
    </label>
  );
}

function FileDisplay({ file }: { file: Document }) {
  return (
    <div className="flex h-full w-full flex-col items-center justify-center rounded-lg border bg-card p-8 text-center">
      <FileText className="h-10 w-10 text-primary" />
      <h3 className="mt-4 font-semibold truncate" title={file.name}>
        {file.name}
      </h3>
      <p className="mt-1 text-sm text-muted-foreground">Ready for comparison</p>
    </div>
  );
}

function ComparisonResults({ results }: { results: CompareDocumentsOutput }) {
  return (
    <ScrollAnimation>
      <GradientCard className="mt-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bot />
            Comparison Report
          </CardTitle>
        </CardHeader>

        <CardContent className="prose prose-sm dark:prose-invert max-w-none space-y-4">
          <div>
            <h3>Summary of Changes</h3>
            <p>{results.summary}</p>
          </div>

          <Accordion type="multiple" className="w-full">
            <AccordionItem value="new">
              <AccordionTrigger>
                <h4 className="flex items-center gap-2 font-semibold text-green-600">
                  <Plus /> New Clauses
                </h4>
              </AccordionTrigger>

              <AccordionContent>
                <ul className="list-disc pl-5 space-y-2">
                  {results.newClauses.map((item, i) => (
                    <li key={i}>
                      <strong>{item.clause}:</strong> {item.description}
                    </li>
                  ))}
                </ul>

                {results.newClauses.length === 0 && (
                  <p className="text-muted-foreground">No new clauses found.</p>
                )}
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="deleted">
              <AccordionTrigger>
                <h4 className="flex items-center gap-2 font-semibold text-red-600">
                  <Minus /> Deleted Clauses
                </h4>
              </AccordionTrigger>

              <AccordionContent>
                <ul className="list-disc pl-5 space-y-2">
                  {results.deletedClauses.map((item, i) => (
                    <li key={i}>
                      <strong>{item.clause}:</strong> {item.description}
                    </li>
                  ))}
                </ul>

                {results.deletedClauses.length === 0 && (
                  <p className="text-muted-foreground">No deleted clauses found.</p>
                )}
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        </CardContent>
      </GradientCard>
    </ScrollAnimation>
  );
}

export default function DocumentComparison({
  session,
  onComparisonComplete,
}: DocumentComparisonProps) {
  const [fileA, setFileA] = useState<Document | null>(null);
  const [fileB, setFileB] = useState<Document | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [results, setResults] = useState<CompareDocumentsOutput | null>(null);

  const { toast } = useToast();
  const auth = useAuth();

  const fileARef = useRef<Document | null>(null);
  const fileBRef = useRef<Document | null>(null);

  useEffect(() => {
    if (!fileA && fileARef.current) setFileA(fileARef.current);
    if (!fileB && fileBRef.current) setFileB(fileBRef.current);
  });

  const authFetch = async (input: string | URL, init?: RequestInit) => {
    const token = await auth.getIdToken();

    const headers = new Headers(init?.headers);
    headers.set('Authorization', `Bearer ${token}`);

    return fetch(input, { ...init, headers });
  };

  const handleFileUpload = (slot: FileSlot, file: Document) => {
  if (slot === 'A') {
    setFileA(file);
    localStorage.setItem("fileA", JSON.stringify(file));
  } else {
    setFileB(file);
    localStorage.setItem("fileB", JSON.stringify(file));
  }
};


  const handleCompare = async () => {
    if (!fileA || !fileB) {
      toast({
        title: 'Missing Documents',
        description: 'Please upload both documents before comparing.',
        variant: 'destructive',
      });
      return;
    }

    setIsLoading(true);

    try {
      const res = await authFetch('/api/compare', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ documentA: fileA, documentB: fileB }),
      });

      const json = await res.json();

      if (!res.ok) throw new Error(json?.error || 'Comparison failed');

      const comparison = json as CompareDocumentsOutput;

      setResults(comparison);

      onComparisonComplete(fileA, fileB, comparison);
    } catch (e: any) {
      toast({
        title: 'Comparison Failed',
        description: e.message || 'An unknown error occurred.',
        variant: 'destructive',
      });
    }

    setIsLoading(false);
  };

  return (
    <div className="h-full">
      <ScrollAnimation>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <GradientCard>
            {fileA ? (
              <FileDisplay file={fileA} />
            ) : (
              <FilePlaceholder
                onFileUpload={handleFileUpload}
                slot="A"
                authFetch={authFetch}
              />
            )}
          </GradientCard>

          <GradientCard>
            {fileB ? (
              <FileDisplay file={fileB} />
            ) : (
              <FilePlaceholder
                onFileUpload={handleFileUpload}
                slot="B"
                authFetch={authFetch}
              />
            )}
          </GradientCard>
        </div>
      </ScrollAnimation>

      <div className="mt-6 flex justify-center">
        <Button onClick={handleCompare} disabled={!fileA || !fileB || isLoading} size="lg">
          {isLoading ? (
            <Loader2 className="mr-2 h-5 w-5 animate-spin" />
          ) : (
            <GitCompareArrows className="mr-2 h-5 w-5" />
          )}

          {isLoading ? 'Analyzing...' : 'Compare Documents'}
        </Button>
      </div>

      {results && <ComparisonResults results={results} />}
    </div>
  );
}