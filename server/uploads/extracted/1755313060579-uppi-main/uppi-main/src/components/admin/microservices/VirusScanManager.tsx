import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Shield, 
  Scan, 
  Upload, 
  AlertTriangle, 
  CheckCircle, 
  Clock,
  FileText,
  Database,
  HardDrive 
} from 'lucide-react';
import { toast } from 'sonner';

interface ScanResult {
  id: string;
  fileName: string;
  fileSize: number;
  scanTime: string;
  status: 'clean' | 'infected' | 'suspicious' | 'scanning';
  threats?: string[];
  scanDuration: number;
}

const VirusScanManager: React.FC = () => {
  const [isScanning, setIsScanning] = useState(false);
  const [scanProgress, setScanProgress] = useState(0);
  const [scanResults, setScanResults] = useState<ScanResult[]>([
    {
      id: '1',
      fileName: 'upload_1.pdf',
      fileSize: 2048000,
      scanTime: new Date().toISOString(),
      status: 'clean',
      scanDuration: 1200
    },
    {
      id: '2',
      fileName: 'document.docx',
      fileSize: 1024000,
      scanTime: new Date(Date.now() - 3600000).toISOString(),
      status: 'suspicious',
      threats: ['Potential macro detected'],
      scanDuration: 2100
    }
  ]);

  const runFullSystemScan = async () => {
    setIsScanning(true);
    setScanProgress(0);

    // Simulate scanning progress
    for (let i = 0; i <= 100; i += 10) {
      setScanProgress(i);
      await new Promise(resolve => setTimeout(resolve, 300));
    }

    toast.success('System scan completed - No threats detected');
    setIsScanning(false);
  };

  const runQuickScan = async () => {
    setIsScanning(true);
    setScanProgress(0);

    for (let i = 0; i <= 100; i += 20) {
      setScanProgress(i);
      await new Promise(resolve => setTimeout(resolve, 150));
    }

    toast.success('Quick scan completed');
    setIsScanning(false);
  };

  const formatFileSize = (bytes: number) => {
    return (bytes / 1024 / 1024).toFixed(2) + ' MB';
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'clean':
        return <Badge variant="default" className="bg-green-100 text-green-800"><CheckCircle className="h-3 w-3 mr-1" />Clean</Badge>;
      case 'infected':
        return <Badge variant="destructive"><AlertTriangle className="h-3 w-3 mr-1" />Infected</Badge>;
      case 'suspicious':
        return <Badge variant="secondary" className="bg-yellow-100 text-yellow-800"><AlertTriangle className="h-3 w-3 mr-1" />Suspicious</Badge>;
      case 'scanning':
        return <Badge variant="outline"><Clock className="h-3 w-3 mr-1" />Scanning</Badge>;
      default:
        return <Badge variant="outline">Unknown</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <Shield className="h-6 w-6" />
        <h2 className="text-2xl font-bold">Virus & Malware Scanner</h2>
      </div>

      <Tabs defaultValue="scanner" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="scanner">Scanner</TabsTrigger>
          <TabsTrigger value="results">Scan Results</TabsTrigger>
          <TabsTrigger value="quarantine">Quarantine</TabsTrigger>
          <TabsTrigger value="settings">Settings</TabsTrigger>
        </TabsList>

        <TabsContent value="scanner" className="space-y-6">
          {/* Scan Controls */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Scan className="h-5 w-5" />
                Security Scanning
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <Button 
                  onClick={runQuickScan} 
                  disabled={isScanning}
                  className="w-full"
                  variant="outline"
                >
                  <Scan className="h-4 w-4 mr-2" />
                  Quick Scan
                </Button>
                <Button 
                  onClick={runFullSystemScan} 
                  disabled={isScanning}
                  className="w-full"
                >
                  <Shield className="h-4 w-4 mr-2" />
                  Full System Scan
                </Button>
              </div>

              {isScanning && (
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Scanning files...</span>
                    <span>{scanProgress}%</span>
                  </div>
                  <Progress value={scanProgress} className="w-full" />
                </div>
              )}
            </CardContent>
          </Card>

          {/* File Upload Scanner */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Upload className="h-5 w-5" />
                File Upload Scanner
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <Alert>
                <Shield className="h-4 w-4" />
                <AlertDescription>
                  All uploaded files are automatically scanned for viruses and malware.
                  Files are quarantined if threats are detected.
                </AlertDescription>
              </Alert>

              <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
                <Upload className="h-12 w-12 mx-auto text-gray-400 mb-4" />
                <p className="text-lg font-medium mb-2">Drop files here to scan</p>
                <p className="text-sm text-muted-foreground mb-4">
                  Or click to select files (Max 100MB per file)
                </p>
                <Button variant="outline">
                  Select Files
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Real-time Protection Status */}
          <Card>
            <CardHeader>
              <CardTitle>Real-time Protection</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-3">
                <div className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex items-center gap-2">
                    <FileText className="h-4 w-4" />
                    <span className="text-sm">File Monitor</span>
                  </div>
                  <Badge variant="default">Active</Badge>
                </div>
                <div className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex items-center gap-2">
                    <Database className="h-4 w-4" />
                    <span className="text-sm">Database Monitor</span>
                  </div>
                  <Badge variant="default">Active</Badge>
                </div>
                <div className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex items-center gap-2">
                    <HardDrive className="h-4 w-4" />
                    <span className="text-sm">Storage Monitor</span>
                  </div>
                  <Badge variant="default">Active</Badge>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="results" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Recent Scan Results</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {scanResults.map((result) => (
                  <div key={result.id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center gap-4">
                      <FileText className="h-8 w-8 text-muted-foreground" />
                      <div>
                        <p className="font-medium">{result.fileName}</p>
                        <p className="text-sm text-muted-foreground">
                          {formatFileSize(result.fileSize)} • Scanned {new Date(result.scanTime).toLocaleString()}
                        </p>
                        {result.threats && (
                          <p className="text-sm text-red-600">
                            Threats: {result.threats.join(', ')}
                          </p>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="text-right">
                        <p className="text-sm text-muted-foreground">
                          {(result.scanDuration / 1000).toFixed(1)}s
                        </p>
                      </div>
                      {getStatusBadge(result.status)}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="quarantine" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Quarantined Files</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8">
                <Shield className="h-12 w-12 mx-auto text-green-600 mb-4" />
                <p className="text-lg font-medium mb-2">No quarantined files</p>
                <p className="text-sm text-muted-foreground">
                  All scanned files are clean. Infected files will appear here.
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="settings" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Scanner Settings</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">Real-time scanning</p>
                    <p className="text-sm text-muted-foreground">
                      Automatically scan files on upload
                    </p>
                  </div>
                  <Badge variant="default">Enabled</Badge>
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">Quarantine infected files</p>
                    <p className="text-sm text-muted-foreground">
                      Move infected files to quarantine
                    </p>
                  </div>
                  <Badge variant="default">Enabled</Badge>
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">Scan archives</p>
                    <p className="text-sm text-muted-foreground">
                      Scan inside ZIP and RAR files
                    </p>
                  </div>
                  <Badge variant="default">Enabled</Badge>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default VirusScanManager;