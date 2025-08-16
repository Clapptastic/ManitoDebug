import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { 
  FileCode, 
  Search, 
  RefreshCw, 
  Trash2,
  Database,
  Activity,
  Clock,
  BarChart3,
  Download,
  Eye,
  FileText
} from 'lucide-react';
import { useCodeEmbeddings } from '@/hooks/useCodeEmbeddings';

import { toast } from '@/hooks/use-toast';
import LoadingSpinner from '@/components/ui/loading-spinner';
import { CodeEmbeddingResult } from '@/services/codeEmbeddings';

const CodeEmbeddingsPage: React.FC = () => {
  const {
    embeddings,
    stats,
    isLoading,
    error,
    refresh,
    refreshEmbeddings,
    uploadCodeFile,
    removeEmbedding,
    isRefreshing,
    status,
    requestEmbeddingGeneration,
    searchSimilarCode
  } = useCodeEmbeddings();

  const [isIndexing, setIsIndexing] = useState(false);
  const [indexProgress, setIndexProgress] = useState(0);
  const [indexTotal, setIndexTotal] = useState(0);
  const [indexCurrentPath, setIndexCurrentPath] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<CodeEmbeddingResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [selectedEmbedding, setSelectedEmbedding] = useState<any>(null);

  // Index this application's codebase using Vite import.meta.glob (admin-only)
  const indexAppCodebase = async () => {
    try {
      setIsIndexing(true);
      setIndexProgress(0);
      setIndexTotal(0);
      setIndexCurrentPath(null);
      toast({ title: 'Indexing started', description: 'Scanning application source files...' });
      const files: Record<string, () => Promise<string>> = import.meta.glob(
        ['/src/**/*.ts', '/src/**/*.tsx', '/src/**/*.js', '/src/**/*.jsx'],
        { as: 'raw' }
      ) as any;

      const entries = Object.entries(files);
      setIndexTotal(entries.length);

      for (let i = 0; i < entries.length; i++) {
        const [path, loader] = entries[i];
        setIndexCurrentPath(path.replace(/^\//, ''));
        const content = await loader();
        const blob = new Blob([content], { type: 'text/plain' });
        const file = new File([blob], path.replace(/^\//, ''), { type: 'text/plain' });
        await uploadCodeFile(file);
        setIndexProgress(Math.round(((i + 1) / entries.length) * 100));
      }

      await refreshEmbeddings();
      toast({ title: 'Indexing complete', description: 'Application codebase has been embedded.' });
    } catch (e) {
      console.error('Index app codebase failed:', e);
      toast({ title: 'Indexing failed', description: 'Could not index application codebase', variant: 'destructive' });
    } finally {
      setIndexCurrentPath(null);
      setIsIndexing(false);
    }
  };


  const handleSearch = async () => {
    if (!searchQuery.trim()) return;

    setIsSearching(true);
    try {
      const results = await searchSimilarCode(searchQuery);
      setSearchResults(results);
    } catch (err) {
      console.error('Search failed:', err);
      toast({
        title: 'Search Failed',
        description: 'Failed to search embeddings',
        variant: 'destructive',
      });
    } finally {
      setIsSearching(false);
    }
  };

  const handleRemoveEmbedding = async (id: string) => {
    const success = await removeEmbedding(id);
    if (success && selectedEmbedding?.id === id) {
      setSelectedEmbedding(null);
    }
  };

  const formatFileSize = (content: string) => {
    const bytes = new Blob([content]).size;
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return <Badge variant="default" className="bg-green-500">Active</Badge>;
      case 'processing':
        return <Badge variant="secondary">Processing</Badge>;
      case 'error':
        return <Badge variant="destructive">Error</Badge>;
      default:
        return <Badge variant="outline">Unknown</Badge>;
    }
  };

  if (isLoading) return <LoadingSpinner />;

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
            <Database className="h-8 w-8" />
            Code Embeddings
          </h1>
          <p className="text-muted-foreground">
            Manage and search your code embeddings for AI-powered development assistance.
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={refresh} disabled={isRefreshing}>
            <RefreshCw className={`h-4 w-4 mr-2 ${isRefreshing ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          <Button onClick={indexAppCodebase} variant="outline" disabled={isIndexing}>
            {isIndexing ? (
              <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <FileCode className="h-4 w-4 mr-2" />
            )}
            {isIndexing ? `Indexing... ${indexProgress}%` : 'Index App Codebase'}
          </Button>
          <Button onClick={requestEmbeddingGeneration}>
            <Activity className="h-4 w-4 mr-2" />
            Generate Embeddings
          </Button>
        </div>
      </div>

      {error && (
        <Card className="border-destructive">
          <CardContent className="pt-6">
            <p className="text-destructive">{error}</p>
          </CardContent>
        </Card>
      )}

      {isIndexing && (
        <Card>
          <CardHeader>
            <CardTitle>Indexing Application Codebase</CardTitle>
            <CardDescription>{indexCurrentPath || 'Preparing files...'}</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex justify-between text-sm mb-2">
              <span>Progress</span>
              <span>{indexProgress}% ({Math.round((indexProgress/100)*indexTotal)} / {indexTotal})</span>
            </div>
            <Progress value={indexProgress} className="w-full" />
          </CardContent>
        </Card>
      )}

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Files</CardTitle>
            <FileCode className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total}</div>
            <p className="text-xs text-muted-foreground">
              Code files indexed
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Token Count</CardTitle>
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.tokenCount.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">
              Total tokens processed
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg Tokens/File</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.avgTokensPerFile}</div>
            <p className="text-xs text-muted-foreground">
              Average file complexity
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Status</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="flex items-center space-x-2">
              {getStatusBadge(stats.status || 'unknown')}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {stats.lastUpdated ? `Updated ${new Date(stats.lastUpdated).toLocaleString()}` : 'No updates'}
            </p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="search" className="space-y-4">
        <TabsList>
          <TabsTrigger value="search">Search</TabsTrigger>
          <TabsTrigger value="browse">Browse Files</TabsTrigger>
        </TabsList>


        <TabsContent value="search" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Semantic Code Search</CardTitle>
              <CardDescription>
                Search your code embeddings using natural language or code snippets
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex gap-2">
                <Input
                  placeholder="Search for functions, patterns, or describe what you're looking for..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                />
                <Button onClick={handleSearch} disabled={isSearching}>
                  <Search className="h-4 w-4 mr-2" />
                  {isSearching ? 'Searching...' : 'Search'}
                </Button>
              </div>

              {searchResults.length > 0 && (
                <div className="space-y-3">
                  <h3 className="font-medium">Search Results</h3>
                  {searchResults.map((result, index) => (
                    <Card key={index} className="p-4">
                      <div className="flex justify-between items-start mb-2">
                        <h4 className="font-medium">{result.file_path}</h4>
                        <Badge variant="outline">
                          {Math.round(result.similarity * 100)}% match
                        </Badge>
                      </div>
                      <pre className="text-sm bg-muted p-2 rounded overflow-x-auto">
                        {result.content.substring(0, 200)}...
                      </pre>
                    </Card>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="browse" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Embedded Files</CardTitle>
              <CardDescription>
                Browse embedded application source files
              </CardDescription>
            </CardHeader>
            <CardContent>
              {embeddings.length === 0 ? (
                <div className="text-center py-6">
                  <FileCode className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                  <p className="text-muted-foreground">No embedded files yet. Use "Index App Codebase" to start.</p>
                </div>
              ) : (
                <div className="rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>File Path</TableHead>
                        <TableHead>Size</TableHead>
                        <TableHead>Tokens</TableHead>
                        <TableHead>Created</TableHead>
                        <TableHead>Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {embeddings.map((embedding) => (
                        <TableRow key={embedding.id}>
                          <TableCell className="font-mono">
                            {embedding.file_path}
                          </TableCell>
                          <TableCell>
                            {formatFileSize(embedding.content || '')}
                          </TableCell>
                          <TableCell>
                            {embedding.token_count?.toLocaleString() || 'N/A'}
                          </TableCell>
                          <TableCell>
                            {new Date(embedding.created_at).toLocaleDateString()}
                          </TableCell>
                          <TableCell>
                            <div className="flex gap-2">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => setSelectedEmbedding(embedding)}
                              >
                                <Eye className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleRemoveEmbedding(embedding.id)}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* File Preview Modal */}
      {selectedEmbedding && (
        <Card className="fixed inset-4 z-50 bg-background shadow-lg">
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>{selectedEmbedding.file_path}</CardTitle>
              <CardDescription>
                {selectedEmbedding.token_count} tokens • {formatFileSize(selectedEmbedding.content)}
              </CardDescription>
            </div>
            <Button variant="outline" onClick={() => setSelectedEmbedding(null)}>
              Close
            </Button>
          </CardHeader>
          <CardContent className="overflow-auto">
            <pre className="text-sm bg-muted p-4 rounded">
              {selectedEmbedding.content}
            </pre>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default CodeEmbeddingsPage;