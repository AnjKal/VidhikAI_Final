'use client';

import { UploadCloud, FileText, Scan } from 'lucide-react';
import type { ChangeEvent } from 'react';
import { useState } from 'react';
import { useToast } from '@/hooks/use-toast';
import type { Document } from '@/lib/history';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from './ui/textarea';
import { Button } from './ui/button';
import { Card, CardContent } from './ui/card';
import { useAuth } from '@/auth';

type FileUploadProps = {
  onDocumentSelect: (document: Document) => void;
  activeTab: 'upload' | 'paste' | 'ocr';
  onTabChange: (tab: 'upload' | 'paste' | 'ocr') => void;
};

export default function FileUpload({ onDocumentSelect, activeTab, onTabChange }: FileUploadProps) {
  const { toast } = useToast();
  const [pastedText, setPastedText] = useState('');
  const auth = useAuth();

  const uploadDataUrl = async (filename: string, dataUrl: string): Promise<Document> => {
    console.log('[FileUpload:uploadDataUrl] starting — filename:', filename, 'dataUrl length:', dataUrl.length);
    const token = await auth.getIdToken();
    console.log('[FileUpload:uploadDataUrl] got auth token:', token ? 'YES (length ' + token.length + ')' : 'NO/EMPTY');
    console.log('[FileUpload:uploadDataUrl] sending POST /api/upload...');
    const res = await fetch('/api/upload', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ filename, dataUrl }),
    });
    console.log('[FileUpload:uploadDataUrl] /api/upload response status:', res.status, res.statusText);
    const json = await res.json();
    console.log('[FileUpload:uploadDataUrl] /api/upload response body:', json);
    if (!res.ok) {
      console.error('[FileUpload:uploadDataUrl] upload failed:', json?.error);
      throw new Error(json?.error || 'Upload failed');
    }
    const doc: Document = { name: filename, url: json.url, s3Key: json.key, mimeType: json.mimeType };
    console.log('[FileUpload:uploadDataUrl] upload succeeded — doc:', doc);
    return doc;
  };

  const handleFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) {
      console.log('[FileUpload:handleFileChange] no file selected, returning');
      return;
    }
    console.log('[FileUpload:handleFileChange] file selected — name:', file.name, 'type:', file.type, 'size:', file.size, 'bytes');

    const reader = new FileReader();

    reader.onload = async (e) => {
      try {
        const dataUrl = e.target?.result as string;
        console.log('[FileUpload:handleFileChange] FileReader.onload — dataUrl length:', dataUrl?.length);
        const doc = await uploadDataUrl(file.name, dataUrl);
        console.log('[FileUpload:handleFileChange] calling onDocumentSelect with doc:', doc);
        onDocumentSelect(doc);
        console.log('[FileUpload:handleFileChange] onDocumentSelect returned');
      } catch (err: any) {
        console.error('[FileUpload:handleFileChange] error during upload:', err);
        toast({
          title: 'Upload Error',
          description: err?.message || 'Failed to upload the file.',
          variant: 'destructive',
        });
      }
    };

    reader.onerror = () => {
      console.error('[FileUpload:handleFileChange] FileReader.onerror triggered');
      toast({
        title: 'Read Error',
        description: 'Failed to read the file.',
        variant: 'destructive',
      });
    };

    console.log('[FileUpload:handleFileChange] calling reader.readAsDataURL...');
    reader.readAsDataURL(file);
    // Reset the input value to allow uploading the same file again
    event.target.value = '';
  };

  const handleTextSubmit = () => {
    console.log('[FileUpload:handleTextSubmit] called — pastedText length:', pastedText.length);
    if (!pastedText.trim()) {
        console.warn('[FileUpload:handleTextSubmit] empty text, aborting');
        toast({
            title: 'Empty Content',
            description: 'Please paste some text to analyze.',
            variant: 'destructive',
        });
        return;
    }
    // Convert plain text to a data URI, then upload to S3.
    const textDataUri = `data:text/plain;base64,${Buffer.from(pastedText).toString('base64')}`;
    console.log('[FileUpload:handleTextSubmit] calling uploadDataUrl for pasted text...');
    uploadDataUrl('Pasted Content.txt', textDataUri)
      .then((doc) => {
        console.log('[FileUpload:handleTextSubmit] upload succeeded, calling onDocumentSelect:', doc);
        onDocumentSelect(doc);
      })
      .catch((err: any) => {
        console.error('[FileUpload:handleTextSubmit] upload failed:', err);
        toast({
          title: 'Upload Error',
          description: err?.message || 'Failed to upload pasted text.',
          variant: 'destructive',
        });
      });
  };


  return (
    <div className="flex h-full flex-col items-center justify-center p-6">
       <Tabs value={activeTab} onValueChange={(value) => onTabChange(value as 'upload' | 'paste' | 'ocr')} className="w-full max-w-lg">
        <TabsList className="grid w-full grid-cols-1">
            {/* <TabsTrigger value="upload">
                <UploadCloud className="mr-2 h-4 w-4"/>
                Upload File
            </TabsTrigger>
            <TabsTrigger value="paste">
                <FileText className="mr-2 h-4 w-4"/>
                Paste Text
            </TabsTrigger> */}
             <TabsTrigger value="ocr">
                <Scan className="mr-2 h-4 w-4"/>
                Scanned/Image
            </TabsTrigger>
        </TabsList>
        {/* <TabsContent value="upload">
            <Card className="border-t-0 rounded-t-none">
                <CardContent className="p-0">
                     <label htmlFor="file-upload" className="w-full cursor-pointer rounded-b-lg border-2 border-dashed border-border p-12 text-center transition-colors hover:border-primary/50 flex flex-col items-center justify-center h-[288px]">
                        <UploadCloud className="mx-auto h-12 w-12 text-muted-foreground" />
                        <p className="mt-4 font-headline text-lg font-semibold">
                        Click to upload a document
                        </p>
                        <p className="mt-2 text-sm text-muted-foreground">
                        For text-based files like .txt, .docx
                        </p>
                    </label>
                    <Input id="file-upload" type="file" className="sr-only" onChange={handleFileChange} accept=".txt,.pdf,.docx,.json,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document" />
                </CardContent>
            </Card>
        </TabsContent>
        <TabsContent value="paste">
             <Card className="border-t-0 rounded-t-none">
                <CardContent className="p-6 space-y-4">
                     <Textarea
                        placeholder="Paste your document content here..."
                        className="h-64"
                        value={pastedText}
                        onChange={(e) => setPastedText(e.target.value)}
                    />
                    <Button onClick={handleTextSubmit} className="w-full">
                        Demystify Text
                    </Button>
                </CardContent>
            </Card>
        </TabsContent> */}
        <TabsContent value="ocr">
            <Card className="border-t-0 rounded-t-none">
                <CardContent className="p-0">
                     <label htmlFor="ocr-file-upload" className="w-full cursor-pointer rounded-b-lg border-2 border-dashed border-border p-12 text-center transition-colors hover:border-primary/50 flex flex-col items-center justify-center h-[288px]">
                        <Scan className="mx-auto h-12 w-12 text-muted-foreground" />
                        <p className="mt-4 font-headline text-lg font-semibold">
                        Upload Scanned Document or Image
                        </p>
                        <p className="mt-2 text-sm text-muted-foreground">
                        For images or scanned PDFs (.pdf, .png, .jpg)
                        </p>
                    </label>
                    <Input id="ocr-file-upload" type="file" className="sr-only" onChange={handleFileChange} accept="application/pdf,image/png,image/jpeg,image/webp" />
                </CardContent>
            </Card>
        </TabsContent>
       </Tabs>
    </div>
  );
}
