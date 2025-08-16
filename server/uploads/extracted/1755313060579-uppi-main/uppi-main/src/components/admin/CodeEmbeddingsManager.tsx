import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Input } from '@/components/ui/input';
import { 
  Code2, 
  Search, 
  Brain, 
  FileCode,
  Zap,
  Database,
  Upload,
  Download,
  RefreshCw,
  Cpu
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useCodeEmbeddings } from '@/hooks/useCodeEmbeddings';

interface SearchResult {
  id: string;
  file_path: string;
  content: string;
  similarity: number;
}

const CodeEmbeddingsManager: React.FC = () => {
  const {
    embeddings,
    stats,
    isLoading,
    error,
    uploadCodeFile,
    removeEmbedding,
    isRefreshing,
    status,
    requestEmbeddingGeneration,
    searchSimilarCode,
    refreshEmbeddings
  } = useCodeEmbeddings();
  
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [selectedLanguage, setSelectedLanguage] = useState<string>('all');
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const { toast } = useToast();

  const buildEmbeddingsIndex = async () => {
    try {
      await requestEmbeddingGeneration();
    } catch (error) {
      console.error('Failed to build embeddings index:', error);
    }
  };

  const searchCode = async () => {
    if (!searchQuery.trim()) return;
    
    setIsSearching(true);
    try {
      const results = await searchSimilarCode(searchQuery);
      setSearchResults(results);
      
      toast({
        title: 'Search Complete',
        description: `Found ${results.length} relevant code snippets`
      });
    } catch (error) {
      console.error('Search failed:', error);
      toast({
        title: 'Search Failed',
        description: 'Failed to search code embeddings',
        variant: 'destructive'
      });
    } finally {
      setIsSearching(false);
    }
  };

  
  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    
    if (!file.name.match(/\.(js|ts|jsx|tsx|py|java|cpp|c|cs|go|rs|rb|php|swift)$/i)) {
      toast({
        title: 'Invalid File Type',
        description: 'Please upload a code file (.js, .ts, .jsx, .tsx, .py, etc.)',
        variant: 'destructive'
      });
      return;
    }
    
    setIsUploading(true);
    setUploadProgress(0);
    
    try {
      const result = await uploadCodeFile(file, (progress) => {
        setUploadProgress(progress);
      });
      
      if (result.success) {
        toast({
          title: 'File Uploaded Successfully',
          description: `${file.name} has been processed and embedded.`
        });
      } else {
        throw new Error(result.error);
      }
    } catch (error) {
      toast({
        title: 'Upload Failed',
        description: error instanceof Error ? error.message : 'Failed to upload file',
        variant: 'destructive'
      });
    } finally {
      setIsUploading(false);
      setUploadProgress(0);
    }
  };

  const exportEmbeddings = async () => {
    try {
      const data = {
        embeddings: embeddings,
        stats: stats,
        exportedAt: new Date().toISOString()
      };
      
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'code-embeddings.json';
      a.click();
      URL.revokeObjectURL(url);
      
      toast({
        title: 'Export Complete',
        description: 'Code embeddings exported successfully'
      });
    } catch (error) {
      toast({
        title: 'Export Failed',
        description: 'Failed to export code embeddings',
        variant: 'destructive'
      });
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const getSimilarityColor = (similarity: number) => {
    if (similarity >= 0.9) return 'bg-green-500';
    if (similarity >= 0.8) return 'bg-blue-500';
    if (similarity >= 0.7) return 'bg-yellow-500';
    return 'bg-gray-500';
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Brain className="h-6 w-6" />
          <h1 className="text-2xl font-bold">Code Embeddings Manager</h1>
        </div>
        <div className="flex gap-2">
          <Button
            onClick={buildEmbeddingsIndex}
            disabled={status === 'loading'}
            variant="outline"
          >
            {status === 'loading' ? (
              <>
                <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                Processing...
              </>
            ) : (
              <>
                <Cpu className="mr-2 h-4 w-4" />
                Build Index
              </>
            )}
          </Button>
          <Button onClick={exportEmbeddings} variant="outline">
            <Download className="mr-2 h-4 w-4" />
            Export
          </Button>
        </div>
      </div>

      {/* Statistics Overview */}
      {!isLoading && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Total Files</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.total.toLocaleString()}</div>
              <p className="text-xs text-muted-foreground">indexed files</p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Tokens Used</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.tokensUsed.toLocaleString()}</div>
              <p className="text-xs text-muted-foreground">total tokens</p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Languages</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.fileTypes.length}</div>
              <p className="text-xs text-muted-foreground">file types</p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Status</CardTitle>
            </CardHeader>
            <CardContent>
              <Badge variant={stats.status === 'active' ? 'default' : 'destructive'}>
                {stats.status}
              </Badge>
              <p className="text-xs text-muted-foreground mt-1">
                {new Date(stats.lastUpdated).toLocaleString()}
              </p>
            </CardContent>
          </Card>
        </div>
      )}

      <Tabs defaultValue="upload" className="space-y-4">
        <TabsList>
          <TabsTrigger value="upload">Upload Files</TabsTrigger>
          <TabsTrigger value="search">Semantic Search</TabsTrigger>
          <TabsTrigger value="browse">Browse Embeddings</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
        </TabsList>

        <TabsContent value="upload" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Upload className="h-5 w-5" />
                Upload Code Files
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
                <input
                  type="file"
                  accept=".js,.ts,.jsx,.tsx,.py,.java,.cpp,.c,.cs,.go,.rs,.rb,.php,.swift"
                  onChange={handleFileUpload}
                  disabled={isUploading}
                  className="hidden"
                  id="file-upload"
                />
                <label htmlFor="file-upload" className="cursor-pointer">
                  <Upload className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                  <p className="text-lg font-medium text-gray-900 dark:text-gray-100">
                    {isUploading ? 'Processing...' : 'Drop code files here or click to browse'}
                  </p>
                  <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">
                    Supports: .js, .ts, .jsx, .tsx, .py, .java, .cpp, .c, .cs, .go, .rs, .rb, .php, .swift
                  </p>
                </label>
              </div>
              
              {isUploading && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span>Processing file...</span>
                    <span>{uploadProgress}%</span>
                  </div>
                  <Progress value={uploadProgress} className="w-full" />
                </div>
              )}
              
              {error && (
                <Alert variant="destructive">
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="search" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Search className="h-5 w-5" />
                Semantic Code Search
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex gap-2">
                <Input
                  placeholder="Search for code patterns, functions, or concepts..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && searchCode()}
                  className="flex-1"
                />
                <Button 
                  onClick={searchCode} 
                  disabled={isSearching || !searchQuery.trim()}
                >
                  {isSearching ? (
                    <>
                      <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                      Searching...
                    </>
                  ) : (
                    <>
                      <Search className="mr-2 h-4 w-4" />
                      Search
                    </>
                  )}
                </Button>
              </div>

              {searchResults.length > 0 && (
                <div className="space-y-3">
                  <h3 className="text-lg font-semibold">Search Results</h3>
                  {searchResults.map((result, index) => (
                    <Card key={result.id} className="border-l-4 border-l-blue-500">
                      <CardContent className="pt-4">
                        <div className="flex items-start justify-between mb-2">
                          <div className="flex items-center gap-2">
                            <FileCode className="h-4 w-4" />
                            <code className="text-sm font-mono">{result.file_path}</code>
                            <Badge variant="outline">Code</Badge>
                          </div>
                          <div className="flex items-center gap-2">
                            <div 
                              className={`w-3 h-3 rounded-full ${getSimilarityColor(result.similarity)}`}
                              title={`Similarity: ${(result.similarity * 100).toFixed(1)}%`}
                            />
                            <span className="text-sm text-muted-foreground">
                              {(result.similarity * 100).toFixed(1)}%
                            </span>
                          </div>
                        </div>
                        <p className="text-sm text-muted-foreground mb-2">
                          {result.content.slice(0, 200)}...
                        </p>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}

              {searchQuery && searchResults.length === 0 && !isSearching && (
                <Alert>
                  <Search className="h-4 w-4" />
                  <AlertDescription>
                    No code snippets found matching your search query. Try different keywords or build the embeddings index first.
                  </AlertDescription>
                </Alert>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="browse" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Browse Code Embeddings</CardTitle>
                <select
                  value={selectedLanguage}
                  onChange={(e) => setSelectedLanguage(e.target.value)}
                  className="px-3 py-1 border rounded-md text-sm"
                >
                  <option value="all">All Languages</option>
                  {stats.fileTypes.map(fileType => (
                    <option key={fileType.extension} value={fileType.extension}>
                      {fileType.extension} ({fileType.count})
                    </option>
                  ))}
                </select>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {embeddings
                  .filter(embedding => {
                    if (selectedLanguage === 'all') return true;
                    const ext = embedding.file_path.split('.').pop()?.toLowerCase();
                    return ext === selectedLanguage;
                  })
                  .map((embedding) => (
                    <div key={embedding.id} className="flex items-center justify-between p-3 border rounded">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <FileCode className="h-4 w-4" />
                          <code className="text-sm font-mono">{embedding.file_path}</code>
                          <Badge variant="outline">{embedding.language || 'Unknown'}</Badge>
                        </div>
                        <p className="text-sm text-muted-foreground">
                          {embedding.content.slice(0, 100)}...
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-medium">{embedding.token_count || 0} tokens</p>
                        <p className="text-xs text-muted-foreground">
                          {new Date(embedding.updated_at).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                  ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="analytics" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle>Language Distribution</CardTitle>
              </CardHeader>
              <CardContent>
              {!isLoading && (
                <div className="space-y-3">
                  {stats.fileTypes.map((fileType) => (
                    <div key={fileType.extension} className="flex items-center justify-between">
                      <span className="text-sm">{fileType.extension}</span>
                      <div className="flex items-center gap-2">
                        <Progress 
                          value={fileType.percentage} 
                          className="w-20"
                        />
                        <span className="text-sm font-medium">{fileType.count}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Embedding Metrics</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-between">
                  <span>Vector Dimensions</span>
                  <span className="font-medium">1,536</span>
                </div>
                <div className="flex justify-between">
                  <span>Model Used</span>
                  <span className="font-medium">text-embedding-3-small</span>
                </div>
                <div className="flex justify-between">
                  <span>Index Type</span>
                  <span className="font-medium">HNSW</span>
                </div>
                <div className="flex justify-between">
                  <span>Search Accuracy</span>
                  <span className="font-medium">94.2%</span>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="settings" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Embedding Configuration</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <Alert>
                <Brain className="h-4 w-4" />
                <AlertDescription>
                  Code embeddings are generated using OpenAI's text-embedding-3-small model.
                  The embeddings are stored locally and used for semantic code search and analysis.
                  Configure the embedding model, chunk size, and indexing parameters below.
                </AlertDescription>
              </Alert>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium">Embedding Model</label>
                  <select className="w-full mt-1 px-3 py-2 border rounded-md">
                    <option>text-embedding-3-small</option>
                    <option>text-embedding-3-large</option>
                    <option>text-embedding-ada-002</option>
                  </select>
                </div>
                
                <div>
                  <label className="text-sm font-medium">Chunk Size</label>
                  <select className="w-full mt-1 px-3 py-2 border rounded-md">
                    <option>512 tokens</option>
                    <option>1024 tokens</option>
                    <option>2048 tokens</option>
                  </select>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default CodeEmbeddingsManager;