
'use client';

import { useState, useMemo, useEffect } from 'react';
import Chat from '@/components/chat';
import DocumentViewer from '@/components/document-viewer';
import FileUpload from '@/components/file-upload';
import DocumentComparison from '@/components/document-comparison';
import { Sidebar, SidebarProvider, SidebarInset } from '@/components/ui/sidebar';
import {
  FileText,
  LayoutGrid,
  Settings,
  HelpCircle,
  LogOut,
  Scale,
  Trash2,
  PlusSquare,
  GitCompareArrows,
  History as HistoryIcon,
  MessageSquare,
  Search,
  Download,
  X,
  User as UserIcon,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { Skeleton } from '@/components/ui/skeleton';
import type { DemystifyDocumentOutput } from '@/ai/flows/demystify';
import { CompareDocumentsOutput, CompareDocumentsInput } from '@/ai/flows/compare';
import type { Message } from '@/components/chat';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
  } from "@/components/ui/dialog"
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';
import { GradientCard } from '@/components/ui/gradient-card';
import { Input } from '@/components/ui/input';
import Logo from '@/components/logo';
import Faq from '@/components/faq';
import { ScrollAnimation } from '@/components/ui/scroll-animation';
import { saveAs } from 'file-saver';
import { useAuth, useUser, type AuthUser } from '@/auth';
import { useRouter } from 'next/navigation';
import type { Document, HistoryItem, DisplayDocument, AnalysisResult, ComparisonResult } from '@/lib/history';
import { useHistory } from '@/hooks/use-history';
import { useDocuments } from '@/hooks/use-documents';


type AppMode = 'chat' | 'compare' | 'my-documents' | 'faq';
type UploadTab = 'upload' | 'paste' | 'ocr';


function AppSidebar({ onSwitchMode, activeMode, onNewSession, searchQuery, setSearchQuery, onLogout, user }: { onSwitchMode: (mode: AppMode) => void, activeMode: AppMode, onNewSession: () => void, searchQuery: string, setSearchQuery: (query: string) => void, onLogout: () => void, user: AuthUser | null }) {
    return (
    <Sidebar
      className="border-r"
      collapsible="icon"
      variant="sidebar"
    >
      <div className="flex h-full flex-col bg-[#111317] text-gray-300">
        <div className="flex h-16 shrink-0 items-center gap-3 border-b border-gray-700 px-4">
          <Logo className="h-7 w-7 text-primary" />
          <h1 className="font-headline text-xl font-semibold text-white">
            Vidhik
          </h1>
        </div>
        <div className="p-4">
            <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                    placeholder="Search..."
                    className="pl-9 bg-gray-800 border-gray-700 focus:ring-primary"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                />
            </div>
        </div>
        <div className="flex-1 overflow-y-auto">
          <nav className="flex flex-col gap-2 p-4 pt-0">
            <Button
              variant="ghost"
              className={cn(`justify-start gap-3`, activeMode === 'chat' ? 'bg-gray-700/50 text-white' : '')}
              onClick={() => onSwitchMode('chat')}
            >
              <FileText className={cn("h-5 w-5", activeMode === 'chat' && 'text-primary')} />
              <span>AI Document Helper</span>
            </Button>
            <Button
              variant="ghost"
              className={cn(`justify-start gap-3`, activeMode === 'compare' ? 'bg-gray-700/50 text-white' : '')}
              onClick={() => onSwitchMode('compare')}
            >
              <GitCompareArrows className={cn("h-5 w-5", activeMode === 'compare' && 'text-primary')} />
              <span>Compare Documents</span>
            </Button>
            <Button
              variant="ghost"
              className="justify-start gap-3"
              onClick={onNewSession}
            >
              <PlusSquare className="h-5 w-5" />
              <span>New Session</span>
            </Button>
            <Button
              variant="ghost"
              className={cn(`justify-start gap-3`, activeMode === 'my-documents' ? 'bg-gray-700/50 text-white' : '')}
              onClick={() => onSwitchMode('my-documents')}>
              <LayoutGrid className={cn("h-5 w-5", activeMode === 'my-documents' && 'text-primary')} />
              <span>My Documents</span>
            </Button>
            <Button
              variant="ghost"
              className={cn(`justify-start gap-3`, activeMode === 'faq' ? 'bg-gray-700/50 text-white' : '')}
              onClick={() => onSwitchMode('faq')}>
              <HelpCircle className={cn("h-5 w-5", activeMode === 'faq' && 'text-primary')} />
              <span>Info & FAQ</span>
            </Button>
          </nav>
        </div>
        <div className="mt-auto p-4">
          <Card className="bg-gradient-to-br from-orange-400 to-orange-600 text-white">
            <CardContent className="p-4">
              <div className="mb-2 flex items-center gap-3">
                <Scale />
                <h3 className="text-lg font-semibold">Demystifying Legal Documents</h3>
              </div>
              <p className="text-sm text-orange-100">
                Upload a document to get a simple explanation of complex legal terms.
              </p>
            </CardContent>
          </Card>
        </div>
        <div className="border-t border-gray-700 p-4 space-y-2">
            {user && (
                <div className="flex items-center gap-3 px-2 text-sm">
                    <UserIcon className="h-5 w-5" />
                    <span className="truncate" title={user.email || ''}>{user.email}</span>
                </div>
            )}
          <Button variant="ghost" className="w-full justify-start gap-3" onClick={onLogout}>
            <LogOut className="h-5 w-5" />
            <span>Log out</span>
          </Button>
        </div>
      </div>
    </Sidebar>
  );
}

type HistoryPanelProps = {
    history: HistoryItem[];
    activeSessionId: string | null;
    onSelectSession: (id: string) => void;
    onClearHistory: () => void;
    onDeleteItem: (id: string) => void;
    searchQuery: string;
};

function HistoryPanel({ history, activeSessionId, onSelectSession, onClearHistory, onDeleteItem, searchQuery }: HistoryPanelProps) {
    const filteredHistory = history.filter(item => {
        const query = searchQuery.toLowerCase();
        if (item.type === 'chat') {
            return item.document.name.toLowerCase().includes(query);
        } else {
            return item.documentA.name.toLowerCase().includes(query) || item.documentB.name.toLowerCase().includes(query);
        }
    });

    return (
      <aside className="hidden w-80 flex-col border-l bg-card p-4 lg:flex">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold">History</h2>
          <span className="text-sm text-muted-foreground">{history.length}</span>
        </div>
        <div className="mt-4 flex-1 space-y-2 overflow-y-auto">
          {filteredHistory.map((item) => (
            <div key={item.id} className="group relative">
                <button
                onClick={() => onSelectSession(item.id)}
                className={`flex w-full items-start gap-3 rounded-md p-2 text-left transition-colors hover:bg-muted ${
                    item.id === activeSessionId ? 'bg-muted' : ''
                }`}
                >
                {item.type === 'chat' ? <FileText className="mt-1 h-4 w-4 shrink-0" /> : <GitCompareArrows className="mt-1 h-4 w-4 shrink-0" />}
                <div className="overflow-hidden">
                    <p className="font-medium truncate">
                        {item.type === 'chat'
                            ? item.document.name
                            : `Compare: ${item.documentA.name} vs ${item.documentB.name}`
                        }
                    </p>
                    <p className="text-sm text-muted-foreground line-clamp-2">
                    {item.type === 'chat'
                        ? (item.analysis?.summary ? item.analysis.summary.substring(0, 70) + '...' : 'Awaiting analysis...')
                        : (item.comparison?.summary ? item.comparison.summary.substring(0, 70) + '...' : 'Awaiting comparison...')
                    }
                    </p>
                </div>
                </button>
                <Button
                    variant="ghost"
                    size="icon"
                    className="absolute right-1 top-1/2 -translate-y-1/2 h-6 w-6 opacity-0 group-hover:opacity-100"
                    onClick={(e) => {
                        e.stopPropagation();
                        onDeleteItem(item.id);
                    }}
                >
                    <X className="h-4 w-4" />
                </Button>
            </div>
          ))}
        </div>
        <AlertDialog>
          <AlertDialogTrigger asChild>
             <Button variant="outline" className="mt-4 w-full" disabled={history.length === 0}>
                <Trash2 className="mr-2 h-4 w-4" />
                Clear History
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
              <AlertDialogDescription>
                This action cannot be undone. This will permanently delete your history.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={onClearHistory}>Continue</AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </aside>
    );
  }

export default function Page() {
  const { user, isLoading: isUserLoading } = useUser();
  const { history, addHistoryItem, updateHistoryItem, deleteHistoryItem, clearHistory } = useHistory(user?.id);
  const allDocuments = useDocuments(user?.id);

  const [activeSessionId, setActiveSessionId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [mode, setMode] = useState<AppMode>('chat');
  const [uploadTab, setUploadTab] = useState<UploadTab>('ocr');
  const [isNewSessionDialogOpen, setIsNewSessionDialogOpen] = useState(false);
  const [isHistoryVisible, setIsHistoryVisible] = useState(false);
  const [isChatVisible, setIsChatVisible] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const { toast } = useToast();

  const auth = useAuth();
  const router = useRouter();

  const authFetch = async (input: RequestInfo | URL, init?: RequestInit) => {
    const token = await auth.getIdToken();
    const headers = new Headers(init?.headers);
    headers.set('Authorization', `Bearer ${token}`);
    return fetch(input, { ...init, headers });
  };


  useEffect(() => {
    if (!isUserLoading && !user) {
      router.push('/login');
    }
  }, [user, isUserLoading, router]);

  const activeSession = history.find((item) => item.id === activeSessionId) || null;
  
  const handleDocumentSelect = async (document: Document) => {
    console.log('[page:handleDocumentSelect] called — document:', document);
    if (!user) {
      console.warn('[page:handleDocumentSelect] no user, aborting');
      return;
    }
    const newSession: Omit<Extract<HistoryItem, {type: 'chat'}>, 'id' | 'createdAt'> = {
        userId: user.id,
        type: 'chat',
        document,
        analysis: null,
        messages: [],
    };
    console.log('[page:handleDocumentSelect] adding history item...');
    const newId = await addHistoryItem(newSession);
    console.log('[page:handleDocumentSelect] history item added — newId:', newId);
    setMode('chat');
    setActiveSessionId(newId);
    console.log('[page:handleDocumentSelect] mode set to chat, activeSessionId set to', newId);
  };
  
  const handleDemystify = async () => {
    console.log('[page:handleDemystify] called — activeSession:', activeSession?.id, 'type:', activeSession?.type);
    if (!activeSession || activeSession.type !== 'chat') {
      console.warn('[page:handleDemystify] no valid chat session, aborting');
      return;
    }
    console.log('[page:handleDemystify] document:', activeSession.document);
    setIsLoading(true);
    toast({ title: 'Analyzing Document...', description: 'This may take a moment. Please wait.' });

    try {
        console.log('[page:handleDemystify] sending POST /api/demystify...');
        const res = await authFetch('/api/demystify', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ document: activeSession.document }),
        });
        console.log('[page:handleDemystify] /api/demystify response status:', res.status, res.statusText);
        const json = await res.json();
        console.log('[page:handleDemystify] /api/demystify response body keys:', json ? Object.keys(json) : 'null');
        if (!res.ok) {
          console.error('[page:handleDemystify] request failed:', json?.error);
          throw new Error(json?.error || 'Demystify failed');
        }
        const result = json as DemystifyDocumentOutput;
        console.log('[page:handleDemystify] analysis succeeded — summary length:', result.summary?.length, '— risks:', result.riskAnalysis?.length);

        await updateHistoryItem(activeSession.id, { analysis: result });
        console.log('[page:handleDemystify] history item updated with analysis');

    } catch (e: any) {
        console.error("[page:handleDemystify] Analysis Error:", e);
        const errorMessage = e.message || 'An unknown error occurred during analysis.';
        toast({
            title: 'Analysis Failed',
            description: `Server returned: ${errorMessage}`,
            variant: 'destructive',
        });
    } finally {
        setIsLoading(false);
        console.log('[page:handleDemystify] done, isLoading set to false');
    }
  };

  const handleComparisonComplete = async (documentA: Document, documentB: Document, comparison: CompareDocumentsOutput) => {
    if (!user) return;
    const newSession: Omit<Extract<HistoryItem, {type: 'compare'}>, 'id' | 'createdAt'> = {
        userId: user.id,
        type: 'compare',
        documentA,
        documentB,
        comparison,
    };
    const newId = await addHistoryItem(newSession);
    setActiveSessionId(newId);
  };

  const handleClearHistory = async () => {
    await clearHistory();
    setActiveSessionId(null);
    toast({
        title: 'History Cleared',
        description: 'Your session history has been deleted.',
    });
  };

  const handleDeleteHistoryItem = async (id: string) => {
    await deleteHistoryItem(id);
    if (activeSessionId === id) {
        setActiveSessionId(null);
        setMode('chat'); // Or a default mode
    }
    toast({
        title: 'Session Deleted',
        description: 'The selected session has been removed from your history.',
    });
  };

  const handleRiskLevelChange = async (clauseIndex: number, newRiskLevel: 'High' | 'Medium' | 'Low') => {
    if (!activeSession || activeSession.type !== 'chat' || !activeSession.analysis) return;

    const updatedAnalysis = {
        ...activeSession.analysis,
        riskAnalysis: activeSession.analysis.riskAnalysis.map((risk, index) =>
            index === clauseIndex ? { ...risk, riskLevel: newRiskLevel } : risk
        ),
    };
    
    await updateHistoryItem(activeSession.id, { analysis: updatedAnalysis });
  };


  const handleSwitchMode = (newMode: AppMode) => {
    setMode(newMode);
    if (newMode !== 'chat' && newMode !== 'compare') {
      setActiveSessionId(null);
    }
    setIsChatVisible(false); // Hide chat when switching modes
  };

  const handleSelectSession = (id: string) => {
    const session = history.find(s => s.id === id);
    if (session) {
        setMode(session.type);
        setActiveSessionId(id);
        setIsChatVisible(session.type === 'chat' && !!session.analysis);
    }
  }

  const handleNewSession = () => {
    setIsNewSessionDialogOpen(true);
  };

  const handleStartNewSession = (newMode: AppMode) => {
    setMode(newMode);
    setActiveSessionId(null);
    setIsNewSessionDialogOpen(false);
    setIsChatVisible(false);
  };

  const handleSelectDocumentFromList = (doc: Document) => {
    handleDocumentSelect(doc);
  };

  const handleDownload = async (doc: Document, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
        const downloadUrl = doc.s3Key
          ? (await authFetch('/api/presign', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ key: doc.s3Key }),
            }).then((r) => r.json())).url
          : doc.url;

        const response = await fetch(downloadUrl);
        const blob = await response.blob();
        saveAs(blob, doc.name);
        toast({
            title: 'Download Started',
            description: `${doc.name} is being downloaded.`,
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

  const handleLogout = async () => {
    try {
      await auth.signOut();
      router.push('/login');
      toast({
        title: 'Logged Out',
        description: 'You have been successfully logged out.',
      });
    } catch (error) {
      console.error('Logout failed:', error);
      toast({
        title: 'Logout Failed',
        description: 'An error occurred during logout.',
        variant: 'destructive',
      });
    }
  };


  if (isUserLoading || !user) {
    return (
      <div className="flex h-screen w-screen items-center justify-center">
        <div className="flex items-center space-x-2">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
          <p>Loading...</p>
        </div>
      </div>
    );
  }


  const AnalysisLoadingSkeleton = () => (
    <div className="p-4 space-y-4">
      <Skeleton className="h-8 w-1/3" />
      <Skeleton className="h-4 w-full" />
      <Skeleton className="h-4 w-full" />
      <Skeleton className="h-4 w-3/4" />
      <Skeleton className="h-8 w-1/4 mt-6" />
      <Skeleton className="h-4 w-full" />
      <Skeleton className="h-4 w-5/6" />
    </div>
  );


  const ChatView = () => (
    <div className='flex flex-1'>
      <div className="flex flex-1 flex-col">
        <header className="flex h-16 items-center justify-between border-b px-6">
          <h1 className="text-lg font-semibold">AI Document Helper</h1>
          <div className="flex items-center gap-2">
            {activeSession?.type === 'chat' && activeSession.analysis && (
              <Button variant="ghost" size="icon" onClick={() => setIsChatVisible(!isChatVisible)}>
                  <MessageSquare className="h-5 w-5" />
              </Button>
            )}
            <Button variant="ghost" size="icon" onClick={() => setIsHistoryVisible(!isHistoryVisible)}>
              <HistoryIcon className="h-5 w-5" />
            </Button>
          </div>
        </header>
        <main className={cn("grid flex-1 gap-4 overflow-hidden p-4", isChatVisible ? "grid-cols-1 md:grid-cols-2" : "grid-cols-1")}>
          <GradientCard className="h-full min-h-0 flex flex-col">
            {mode === 'chat' && !activeSession && <FileUpload onDocumentSelect={handleDocumentSelect} activeTab={uploadTab} onTabChange={setUploadTab} />}
            {activeSession?.type === 'chat' && !activeSession.analysis && !isLoading && (
              <div className="flex flex-col items-center justify-center h-full p-6 text-center">
                <FileText className="h-12 w-12 text-muted-foreground" />
                <p className="mt-4 font-headline text-lg font-semibold">
                  {activeSession.document.name}
                </p>
                <p className="mt-2 text-sm text-muted-foreground">
                  Ready to be demystified.
                </p>
                <Button onClick={() => { console.log('[page] Demystify button clicked'); handleDemystify(); }} className="mt-6">
                  Demystify Document
                </Button>
              </div>
            )}
            {isLoading && (
                <div className="p-4">
                    <h2 className="text-lg font-semibold mb-2">Analyzing...</h2>
                    <AnalysisLoadingSkeleton />
                </div>
            )}
            {activeSession?.type === 'chat' && activeSession.analysis && !isLoading && (
              <DocumentViewer 
                document={activeSession.document} 
                analysis={activeSession.analysis}
                onRiskLevelChange={handleRiskLevelChange}
               />
            )}
          </GradientCard>
          {isChatVisible && (
            <GradientCard className="h-full min-h-0 flex-col hidden md:flex">
              <Chat
                  key={activeSessionId} // Add key to force re-mount on session change
                  session={activeSession?.type === 'chat' ? activeSession : null}
                  searchQuery={searchQuery}
                  onMessagesChange={(messages) => {
                      if (activeSessionId !== null && activeSession?.type === 'chat') {
                        updateHistoryItem(activeSessionId, { messages });
                      }
                  }}
              />
            </GradientCard>
          )}
        </main>
      </div>
      {isHistoryVisible && (
        <HistoryPanel
            history={history}
            activeSessionId={activeSessionId}
            onSelectSession={handleSelectSession}
            onClearHistory={handleClearHistory}
            onDeleteItem={handleDeleteHistoryItem}
            searchQuery={searchQuery}
        />
      )}
    </div>
  );



  const MyDocumentsView = () => {
    const filteredDocuments = allDocuments.filter(doc =>
        doc.name.toLowerCase().includes(searchQuery.toLowerCase())
    );

    return (
        <div className="flex flex-1 flex-col">
            <header className="flex h-16 items-center justify-between border-b px-6">
                <h1 className="text-lg font-semibold">My Documents</h1>
            </header>
            <main className="flex-1 overflow-auto p-6">
                {filteredDocuments.length > 0 ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                        {filteredDocuments.map((doc, index) => (
                            <Card
                                key={index}
                                className="flex flex-col transition-shadow hover:shadow-lg"
                            >
                                <CardHeader className="flex-row items-start gap-4 space-y-0 pb-2">
                                    <FileText className="h-8 w-8 text-primary mt-1" />
                                    <CardTitle 
                                      className="text-base font-medium truncate flex-1 cursor-pointer" 
                                      title={doc.name}
                                      onClick={() => handleSelectDocumentFromList(doc)}
                                    >
                                        {doc.name}
                                    </CardTitle>
                                </CardHeader>
                                <CardContent 
                                  className="flex-1 text-sm text-muted-foreground cursor-pointer"
                                  onClick={() => handleSelectDocumentFromList(doc)}
                                >
                                    <p className="line-clamp-3">
                                        {doc.summary || "Click to open this document in the AI Document Helper."}
                                    </p>
                                </CardContent>
                                <CardFooter className="pt-4">
                                    <Button variant="outline" size="sm" className="w-full" onClick={(e) => handleDownload(doc, e)}>
                                        <Download className="mr-2 h-4 w-4" />
                                        Download
                                    </Button>
                                </CardFooter>
                            </Card>
                        ))}
                    </div>
                ) : (
                    <div className="flex flex-col items-center justify-center h-full text-center text-muted-foreground">
                        <LayoutGrid className="h-12 w-12" />
                        <h2 className="mt-6 text-xl font-semibold">
                            {searchQuery ? 'No Matching Documents' : 'No Documents Found'}
                        </h2>
                        <p className="mt-2">
                            {searchQuery
                                ? 'Try a different search term.'
                                : 'Start by uploading a document in the "AI Document Helper" to see it here.'
                            }
                        </p>
                    </div>
                )}
            </main>
        </div>
    );
  };
  
  const FaqView = () => (
    <div className="flex flex-1 flex-col">
      <header className="flex h-16 items-center justify-between border-b px-6">
        <h1 className="text-lg font-semibold">Information & FAQ</h1>
      </header>
      <main className="flex-1 overflow-auto p-6">
        <div className="max-w-4xl mx-auto">
            <Faq onStartSession={handleNewSession} />
        </div>
      </main>
    </div>
  );

  const renderContent = () => {
    switch(mode) {
        case 'chat':
            return <ChatView />;
        case 'compare':
            return (
                <div className="flex flex-1">
                    <div className="flex flex-1 flex-col">
                        <header className="flex h-16 items-center justify-between border-b px-6">
                            <h1 className="text-lg font-semibold">Compare Documents</h1>
                            <Button variant="ghost" size="icon" onClick={() => setIsHistoryVisible(!isHistoryVisible)}>
                                <HistoryIcon className="h-5 w-5" />
                            </Button>
                        </header>
                        <main className="flex-1 overflow-auto p-4">
                            <DocumentComparison
                                session={activeSession?.type === 'compare' ? activeSession : null}
                                onComparisonComplete={handleComparisonComplete}
                            />
                        </main>
                    </div>
                    {isHistoryVisible && (
                        <HistoryPanel
                            history={history}
                            activeSessionId={activeSessionId}
                            onSelectSession={handleSelectSession}
                            onClearHistory={handleClearHistory}
                            onDeleteItem={handleDeleteHistoryItem}
                            searchQuery={searchQuery}
                        />
                    )}
                </div>
            );
        case 'my-documents':
            return <MyDocumentsView />;
        case 'faq':
            return <FaqView />;
        default:
            return <ChatView />;
    }
  }

  return (
    <SidebarProvider>
      <div className="flex h-screen w-screen bg-background text-foreground">
        <AppSidebar
            onSwitchMode={handleSwitchMode}
            activeMode={mode}
            onNewSession={handleNewSession}
            searchQuery={searchQuery}
            setSearchQuery={setSearchQuery}
            onLogout={handleLogout}
            user={user}
        />
        <SidebarInset>
            {renderContent()}
        </SidebarInset>
        <Dialog open={isNewSessionDialogOpen} onOpenChange={setIsNewSessionDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Start a new session</DialogTitle>
              <DialogDescription>
                Choose the type of session you would like to begin.
              </DialogDescription>
            </DialogHeader>
            <div className="grid grid-cols-2 gap-4 py-4">
                <Button variant="outline" className="h-20 flex-col" onClick={() => handleStartNewSession('chat')}>
                    <FileText className="h-6 w-6 mb-2" />
                    AI Document Helper
                </Button>
                <Button variant="outline" className="h-20 flex-col" onClick={() => handleStartNewSession('compare')}>
                    <GitCompareArrows className="h-6 w-6 mb-2" />
                    Compare Documents
                </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </SidebarProvider>
  );
}

    
