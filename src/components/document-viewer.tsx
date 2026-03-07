"use client";

import * as React from 'react';
import type { Document, AnalysisResult } from '@/lib/history';
import { ScrollArea } from '@/components/ui/scroll-area';
import { FileText, CalendarClock, Download, AlertTriangle } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import ReactMarkdown from 'react-markdown';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion"
import { Button } from './ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from './ui/card';
import { createEvents } from 'ics';
import { saveAs } from 'file-saver';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { Badge } from './ui/badge';
import { ScrollAnimation } from './ui/scroll-animation';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import { useAuth } from '@/auth';


type DocumentViewerProps = {
  document: Document;
  analysis: AnalysisResult;
  onRiskLevelChange: (clauseIndex: number, newRiskLevel: 'High' | 'Medium' | 'Low') => void;
};

const riskLevelColors = {
    High: 'bg-red-500 hover:bg-red-500 text-white border-red-500',
    Medium: 'bg-yellow-500 hover:bg-yellow-500 text-white border-yellow-500',
    Low: 'bg-green-500 hover:bg-green-500 text-white border-green-500',
};


export default function DocumentViewer({ document, analysis, onRiskLevelChange }: DocumentViewerProps) {
  const { toast } = useToast();
    const auth = useAuth();
    const isDataUrl = document.url.startsWith('data:');

    const authFetch = React.useCallback(
        async (input: RequestInfo | URL, init?: RequestInit) => {
            const token = await auth.getIdToken();
            const headers = new Headers(init?.headers);
            headers.set('Authorization', `Bearer ${token}`);
            return fetch(input, { ...init, headers });
        },
        [auth]
    );

  const getFileMimeType = (dataUrl: string) => {
    try {
        return dataUrl.substring(dataUrl.indexOf(':') + 1, dataUrl.indexOf(';'));
    } catch (e) {
        return 'application/octet-stream';
    }
  };

    const mimeType = document.mimeType ?? (isDataUrl ? getFileMimeType(document.url) : 'application/octet-stream');
  const isTextFile = mimeType.startsWith('text/');
  
  // Decode base64 content for text files. Handle potential errors.
    const [remoteTextContent, setRemoteTextContent] = React.useState<string | null>(null);

    const textContent = React.useMemo(() => {
        if (isDataUrl && isTextFile) {
            try {
                const base64Content = document.url.substring(document.url.indexOf(',') + 1);
                return Buffer.from(base64Content, 'base64').toString('utf-8');
            } catch (e) {
                console.error('Failed to decode base64 content:', e);
                return 'Error: Could not display file content.';
            }
        }
        if (!isDataUrl && isTextFile) {
            return remoteTextContent;
        }
        return null;
    }, [document.url, isDataUrl, isTextFile, remoteTextContent]);

    React.useEffect(() => {
        let isMounted = true;
        if (!isDataUrl && isTextFile) {
            (async () => {
                try {
                    const url = document.s3Key
                        ? (await authFetch('/api/presign', {
                                method: 'POST',
                                headers: { 'Content-Type': 'application/json' },
                                body: JSON.stringify({ key: document.s3Key }),
                            }).then((r) => r.json())).url
                        : document.url;

                    const res = await fetch(url);
                    const text = await res.text();
                    if (isMounted) setRemoteTextContent(text);
                } catch (e) {
                    console.error('Failed to fetch text content:', e);
                    if (isMounted) setRemoteTextContent('Error: Could not load file content.');
                }
            })();
        } else {
            setRemoteTextContent(null);
        }
        return () => {
            isMounted = false;
        };
    }, [authFetch, document.url, document.s3Key, isDataUrl, isTextFile]);

  const handleDownload = async () => {
    try {
                const downloadUrl = document.s3Key
                    ? (await authFetch('/api/presign', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({ key: document.s3Key }),
                        }).then((r) => r.json())).url
                    : document.url;

                const response = await fetch(downloadUrl);
        const blob = await response.blob();
        saveAs(blob, document.name);
        toast({
            title: 'Download Started',
            description: `${document.name} is being downloaded.`,
        });
    } catch (error) {
        console.error("Download failed:", error);
        toast({
            title: 'Download Failed',
            description: 'Could not download the document.',
            variant: 'destructive',
        });
    }
  };

  const handleExportToCalendar = () => {
    const events = (analysis.obligations || []).map(obligation => {
        const now = new Date();
        let start: [number, number, number] = [now.getFullYear(), now.getMonth() + 1, now.getDate()];
        
        // Attempt to parse date string like YYYY-MM-DD
        const dateMatch = obligation.date.match(/^(\d{4})-(\d{2})-(\d{2})$/);
        if (dateMatch) {
            start = [parseInt(dateMatch[1]), parseInt(dateMatch[2]), parseInt(dateMatch[3])];
        } else {
            // Attempt to parse relative dates like "Within X days"
            const daysMatch = obligation.date.match(/within (\d+) days/i);
            if (daysMatch) {
                const futureDate = new Date();
                futureDate.setDate(now.getDate() + parseInt(daysMatch[1]));
                start = [futureDate.getFullYear(), futureDate.getMonth() + 1, futureDate.getDate()];
            }
        }

        return {
            title: obligation.description,
            start: start,
            duration: { hours: 1 },
            description: `From document: ${document.name}`,
        };
    });

    if (events.length === 0) {
        toast({
            title: 'No Events',
            description: 'No obligations with specific dates were found to export.',
        });
        return;
    }

    createEvents(events, (error, value) => {
        if (error) {
            console.error(error);
            toast({
              title: 'Export Failed',
              description: 'Could not generate the calendar file.',
              variant: 'destructive',
            });
            return;
        }
        const blob = new Blob([value], { type: 'text/calendar;charset=utf-8' });
        saveAs(blob, `${document.name.split('.')[0]}-obligations.ics`);
    });
  };


  return (
    <div className="flex h-full flex-col">
      <div className="flex h-14 shrink-0 items-center justify-between border-b px-4">
        <div className="flex items-center gap-3 overflow-hidden">
            <FileText className="h-5 w-5 text-muted-foreground flex-shrink-0"/>
            <h2 className="font-headline text-lg font-semibold truncate">{document.name}</h2>
        </div>
        <Button variant="outline" size="sm" onClick={handleDownload}>
            <Download className="mr-2 h-4 w-4" />
            Download Original
        </Button>
      </div>
      <Tabs defaultValue="summary" className="flex-1 flex flex-col overflow-hidden">
        <TabsList className="shrink-0 mx-4 mt-4">
          <TabsTrigger value="summary">Feature Summary</TabsTrigger>
          <TabsTrigger value="risk">Risk Analysis</TabsTrigger>
          <TabsTrigger value="jargon">Jargon Buster</TabsTrigger>
          <TabsTrigger value="obligations">Obligations &amp; Deadlines</TabsTrigger>
          <TabsTrigger value="original">Original Document</TabsTrigger>
        </TabsList>
        <div className="flex-1 overflow-hidden">
            <ScrollArea className="h-full px-4">
            <TabsContent value="summary" className="py-4">
                <ScrollAnimation>
                    <ReactMarkdown className="prose prose-sm dark:prose-invert max-w-none">
                        {analysis.summary}
                    </ReactMarkdown>
                </ScrollAnimation>
            </TabsContent>
            <TabsContent value="risk" className="py-4 space-y-4">
                    {(analysis.riskAnalysis && analysis.riskAnalysis.length > 0) ? (
                        analysis.riskAnalysis.map((item, index) => (
                            <ScrollAnimation key={index} delay={index * 0.1}>
                                <Card>
                                    <CardHeader>
                                        <CardTitle className="flex items-center justify-between text-lg">
                                            <div className='flex items-center gap-2'>
                                                <AlertTriangle className={cn(
                                                    item.riskLevel === 'High' && 'text-red-500',
                                                    item.riskLevel === 'Medium' && 'text-yellow-500',
                                                    item.riskLevel === 'Low' && 'text-green-500',
                                                )} />
                                                <span>{item.clause}</span>
                                            </div>
                                            <Select
                                                value={item.riskLevel}
                                                onValueChange={(value: 'High' | 'Medium' | 'Low') => onRiskLevelChange(index, value)}
                                            >
                                                <SelectTrigger className={cn("w-[120px]", riskLevelColors[item.riskLevel])}>
                                                    <SelectValue placeholder="Set risk" />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="High">High Risk</SelectItem>
                                                    <SelectItem value="Medium">Medium Risk</SelectItem>
                                                    <SelectItem value="Low">Low Risk</SelectItem>
                                                </SelectContent>
                                            </Select>
                                        </CardTitle>
                                    </CardHeader>
                                    <CardContent>
                                    <p className='text-muted-foreground'>{item.explanation}</p>
                                    </CardContent>
                                </Card>
                            </ScrollAnimation>
                        ))
                    ) : (
                        <ScrollAnimation>
                            <Card className='text-center'>
                                <CardHeader>
                                    <CardTitle>No Risks Detected</CardTitle>
                                    <CardDescription>
                                        The automated analysis did not find any clauses that are typically considered high-risk.
                                    </CardDescription>
                                </CardHeader>
                            </Card>
                        </ScrollAnimation>
                    )}
            </TabsContent>
            <TabsContent value="jargon" className="py-4">
                <Accordion type="single" collapsible className="w-full">
                {(analysis.jargonBuster || []).map((item, index) => (
                    <ScrollAnimation key={index} delay={index * 0.05}>
                        <AccordionItem value={`item-${index}`}>
                        <AccordionTrigger>{item.term}</AccordionTrigger>
                        <AccordionContent>
                            {item.definition}
                        </AccordionContent>
                        </AccordionItem>
                    </ScrollAnimation>
                ))}
                </Accordion>
            </TabsContent>
            <TabsContent value="obligations" className="py-4">
                <ScrollAnimation>
                    <Card>
                        <CardHeader className='flex-row items-center justify-between'>
                            <div className='space-y-1'>
                                <CardTitle>Obligations &amp; Deadlines</CardTitle>
                            </div>
                            <Button variant="outline" size="sm" onClick={handleExportToCalendar} disabled={!analysis.obligations || analysis.obligations.length === 0}>
                                <Download className="mr-2 h-4 w-4" />
                                Export to Calendar
                            </Button>
                        </CardHeader>
                        <CardContent>
                            <ul className="space-y-4">
                            {(analysis.obligations || []).map((item, index) => (
                                <li key={index} className="flex items-start gap-4">
                                    <div className="flex-shrink-0 pt-1">
                                        <CalendarClock className="h-5 w-5 text-primary" />
                                    </div>
                                    <div>
                                        <p className="font-semibold">{item.date}</p>
                                        <p className="text-muted-foreground">{item.description}</p>
                                    </div>
                                </li>
                            ))}
                            {(!analysis.obligations || analysis.obligations.length === 0) && (
                                <p className="text-sm text-muted-foreground">No specific obligations or deadlines were found in this document.</p>
                            )}
                            </ul>
                        </CardContent>
                    </Card>
                </ScrollAnimation>
            </TabsContent>
            <TabsContent value="original" className="py-4 h-[calc(100vh-12rem)]">
                {textContent ? (
                    <pre className="whitespace-pre-wrap text-sm font-body">{textContent}</pre>
                ) : (
                    <object
                            data={document.url}
                        type={mimeType}
                        className="w-full h-full border rounded-md"
                        aria-label={document.name}
                    >
                        <div className="flex flex-col items-center justify-center h-full text-center text-muted-foreground">
                            <p>Preview is not available for this file type.</p>
                            <p className="text-sm">Try opening the file on your device.</p>
                        </div>
                    </object>
                )}
            </TabsContent>
            </ScrollArea>
        </div>
      </Tabs>
    </div>
  );
}
