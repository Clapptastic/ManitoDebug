import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Input } from '@/components/ui/input';
import { 
  Package, 
  Shield, 
  TrendingUp, 
  AlertTriangle, 
  CheckCircle,
  XCircle,
  RefreshCw,
  Download,
  Search,
  Zap,
  Clock
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface PackageInfo {
  name: string;
  currentVersion: string;
  latestVersion: string;
  type: 'dependency' | 'devDependency';
  security: {
    vulnerabilities: number;
    severity: 'none' | 'low' | 'moderate' | 'high' | 'critical';
  };
  maintenance: {
    lastUpdate: string;
    popularity: number;
    quality: number;
  };
  updateAvailable: boolean;
  breaking: boolean;
  size: {
    current: number;
    bundled: number;
  };
}

interface SecurityVulnerability {
  id: string;
  package: string;
  severity: 'low' | 'moderate' | 'high' | 'critical';
  title: string;
  description: string;
  fixVersion: string;
  patchAvailable: boolean;
}

interface UpdateOperation {
  package: string;
  from: string;
  to: string;
  status: 'pending' | 'updating' | 'completed' | 'failed';
  breaking: boolean;
}

const AdvancedPackageManager: React.FC = () => {
  const [packages, setPackages] = useState<PackageInfo[]>([]);
  const [vulnerabilities, setVulnerabilities] = useState<SecurityVulnerability[]>([]);
  const [updateOperations, setUpdateOperations] = useState<UpdateOperation[]>([]);
  const [isScanning, setIsScanning] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedFilter, setSelectedFilter] = useState<string>('all');
  const { toast } = useToast();

  useEffect(() => {
    loadPackageInfo();
    loadSecurityVulnerabilities();
  }, []);

  const loadPackageInfo = async () => {
    try {
      // Simulate loading package information
      const mockPackages: PackageInfo[] = [
        {
          name: '@supabase/supabase-js',
          currentVersion: '2.49.4',
          latestVersion: '2.50.0',
          type: 'dependency',
          security: { vulnerabilities: 0, severity: 'none' },
          maintenance: { lastUpdate: '2024-01-15', popularity: 95, quality: 92 },
          updateAvailable: true,
          breaking: false,
          size: { current: 245000, bundled: 89000 }
        },
        {
          name: '@radix-ui/react-dialog',
          currentVersion: '1.1.2',
          latestVersion: '1.1.2',
          type: 'dependency',
          security: { vulnerabilities: 0, severity: 'none' },
          maintenance: { lastUpdate: '2024-01-10', popularity: 88, quality: 90 },
          updateAvailable: false,
          breaking: false,
          size: { current: 125000, bundled: 45000 }
        },
        {
          name: 'react',
          currentVersion: '18.3.1',
          latestVersion: '18.3.2',
          type: 'dependency',
          security: { vulnerabilities: 1, severity: 'moderate' },
          maintenance: { lastUpdate: '2024-01-08', popularity: 99, quality: 98 },
          updateAvailable: true,
          breaking: false,
          size: { current: 350000, bundled: 145000 }
        },
        {
          name: '@types/jest',
          currentVersion: '29.5.14',
          latestVersion: '30.0.0',
          type: 'devDependency',
          security: { vulnerabilities: 0, severity: 'none' },
          maintenance: { lastUpdate: '2024-01-12', popularity: 85, quality: 87 },
          updateAvailable: true,
          breaking: true,
          size: { current: 450000, bundled: 0 }
        },
        {
          name: 'lodash',
          currentVersion: '4.17.21',
          latestVersion: '4.17.21',
          type: 'dependency',
          security: { vulnerabilities: 2, severity: 'high' },
          maintenance: { lastUpdate: '2021-02-20', popularity: 95, quality: 82 },
          updateAvailable: false,
          breaking: false,
          size: { current: 540000, bundled: 120000 }
        }
      ];
      setPackages(mockPackages);
    } catch (error) {
      console.error('Failed to load package info:', error);
    }
  };

  const loadSecurityVulnerabilities = async () => {
    try {
      const mockVulnerabilities: SecurityVulnerability[] = [
        {
          id: 'CVE-2024-1234',
          package: 'react',
          severity: 'moderate',
          title: 'Cross-site Scripting in React DevTools',
          description: 'A potential XSS vulnerability in React DevTools extension',
          fixVersion: '18.3.2',
          patchAvailable: true
        },
        {
          id: 'CVE-2023-5678',
          package: 'lodash',
          severity: 'high',
          title: 'Prototype Pollution in lodash',
          description: 'Prototype pollution vulnerability in lodash merge function',
          fixVersion: '4.17.22',
          patchAvailable: false
        },
        {
          id: 'CVE-2023-9012',
          package: 'lodash',
          severity: 'high',
          title: 'Command Injection in lodash',
          description: 'Command injection vulnerability in lodash template function',
          fixVersion: '4.17.22',
          patchAvailable: false
        }
      ];
      setVulnerabilities(mockVulnerabilities);
    } catch (error) {
      console.error('Failed to load vulnerabilities:', error);
    }
  };

  const scanForUpdates = async () => {
    setIsScanning(true);
    try {
      // Simulate scanning for updates
      await new Promise(resolve => setTimeout(resolve, 3000));
      
      await loadPackageInfo();
      await loadSecurityVulnerabilities();
      
      toast({
        title: 'Scan Complete',
        description: 'Package scan completed successfully'
      });
    } catch (error) {
      toast({
        title: 'Scan Failed',
        description: 'Failed to scan for package updates',
        variant: 'destructive'
      });
    } finally {
      setIsScanning(false);
    }
  };

  const updatePackage = async (packageName: string) => {
    const pkg = packages.find(p => p.name === packageName);
    if (!pkg) return;

    const operation: UpdateOperation = {
      package: packageName,
      from: pkg.currentVersion,
      to: pkg.latestVersion,
      status: 'updating',
      breaking: pkg.breaking
    };

    setUpdateOperations(prev => [...prev, operation]);
    
    try {
      // Simulate package update
      await new Promise(resolve => setTimeout(resolve, 5000));
      
      setUpdateOperations(prev => prev.map(op => 
        op.package === packageName 
          ? { ...op, status: 'completed' }
          : op
      ));
      
      setPackages(prev => prev.map(p => 
        p.name === packageName 
          ? { ...p, currentVersion: p.latestVersion, updateAvailable: false }
          : p
      ));
      
      toast({
        title: 'Update Complete',
        description: `${packageName} has been updated successfully`
      });
    } catch (error) {
      setUpdateOperations(prev => prev.map(op => 
        op.package === packageName 
          ? { ...op, status: 'failed' }
          : op
      ));
      
      toast({
        title: 'Update Failed',
        description: `Failed to update ${packageName}`,
        variant: 'destructive'
      });
    }
  };

  const updateAllPackages = async () => {
    setIsUpdating(true);
    const updatablePackages = packages.filter(p => p.updateAvailable && !p.breaking);
    
    try {
      for (const pkg of updatablePackages) {
        await updatePackage(pkg.name);
      }
      
      toast({
        title: 'Bulk Update Complete',
        description: `Updated ${updatablePackages.length} packages successfully`
      });
    } catch (error) {
      toast({
        title: 'Bulk Update Failed',
        description: 'Some packages failed to update',
        variant: 'destructive'
      });
    } finally {
      setIsUpdating(false);
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical': return 'destructive';
      case 'high': return 'destructive';
      case 'moderate': return 'default';
      case 'low': return 'secondary';
      default: return 'outline';
    }
  };

  const getOperationIcon = (status: string) => {
    switch (status) {
      case 'updating': return <RefreshCw className="h-4 w-4 animate-spin" />;
      case 'completed': return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'failed': return <XCircle className="h-4 w-4 text-red-500" />;
      default: return <Clock className="h-4 w-4" />;
    }
  };

  const formatBytes = (bytes: number) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  };

  const filteredPackages = packages.filter(pkg => {
    const matchesSearch = pkg.name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesFilter = selectedFilter === 'all' || 
      (selectedFilter === 'updates' && pkg.updateAvailable) ||
      (selectedFilter === 'security' && pkg.security.vulnerabilities > 0) ||
      (selectedFilter === 'dependencies' && pkg.type === 'dependency') ||
      (selectedFilter === 'devDependencies' && pkg.type === 'devDependency');
    
    return matchesSearch && matchesFilter;
  });

  const totalVulnerabilities = packages.reduce((sum, pkg) => sum + pkg.security.vulnerabilities, 0);
  const availableUpdates = packages.filter(pkg => pkg.updateAvailable).length;
  const breakingUpdates = packages.filter(pkg => pkg.updateAvailable && pkg.breaking).length;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Package className="h-6 w-6" />
          <h1 className="text-2xl font-bold">Advanced Package Manager</h1>
        </div>
        <div className="flex gap-2">
          <Button
            onClick={scanForUpdates}
            disabled={isScanning}
            variant="outline"
          >
            {isScanning ? (
              <>
                <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                Scanning...
              </>
            ) : (
              <>
                <Search className="mr-2 h-4 w-4" />
                Scan Updates
              </>
            )}
          </Button>
          <Button
            onClick={updateAllPackages}
            disabled={isUpdating || availableUpdates === 0}
          >
            {isUpdating ? (
              <>
                <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                Updating...
              </>
            ) : (
              <>
                <Zap className="mr-2 h-4 w-4" />
                Update All
              </>
            )}
          </Button>
        </div>
      </div>

      {/* Package Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total Packages</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{packages.length}</div>
            <p className="text-xs text-muted-foreground">dependencies installed</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Updates Available</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{availableUpdates}</div>
            <p className="text-xs text-muted-foreground">{breakingUpdates} breaking changes</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Security Issues</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{totalVulnerabilities}</div>
            <p className="text-xs text-muted-foreground">vulnerabilities found</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Bundle Size</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatBytes(packages.reduce((sum, pkg) => sum + pkg.size.bundled, 0))}
            </div>
            <p className="text-xs text-muted-foreground">total bundle size</p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="packages" className="space-y-4">
        <TabsList>
          <TabsTrigger value="packages">Package List</TabsTrigger>
          <TabsTrigger value="security">Security</TabsTrigger>
          <TabsTrigger value="updates">Update Queue</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
        </TabsList>

        <TabsContent value="packages" className="space-y-4">
          <div className="flex items-center gap-4 mb-4">
            <Input
              placeholder="Search packages..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="max-w-sm"
            />
            <select
              value={selectedFilter}
              onChange={(e) => setSelectedFilter(e.target.value)}
              className="px-3 py-2 border rounded-md"
            >
              <option value="all">All Packages</option>
              <option value="updates">Updates Available</option>
              <option value="security">Security Issues</option>
              <option value="dependencies">Dependencies</option>
              <option value="devDependencies">Dev Dependencies</option>
            </select>
          </div>

          <div className="space-y-3">
            {filteredPackages.map((pkg) => (
              <Card key={pkg.name} className={pkg.security.vulnerabilities > 0 ? 'border-red-200' : ''}>
                <CardContent className="pt-4">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-semibold">{pkg.name}</h3>
                        <Badge variant="outline">{pkg.type}</Badge>
                        {pkg.security.vulnerabilities > 0 && (
                          <Badge variant={getSeverityColor(pkg.security.severity)}>
                            {pkg.security.vulnerabilities} security issues
                          </Badge>
                        )}
                        {pkg.updateAvailable && pkg.breaking && (
                          <Badge variant="destructive">Breaking changes</Badge>
                        )}
                      </div>
                      <div className="flex items-center gap-4 text-sm text-muted-foreground">
                        <span>Current: {pkg.currentVersion}</span>
                        {pkg.updateAvailable && (
                          <span>Latest: {pkg.latestVersion}</span>
                        )}
                        <span>Size: {formatBytes(pkg.size.bundled)}</span>
                        <span>Quality: {pkg.maintenance.quality}%</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {pkg.updateAvailable ? (
                        <Button
                          size="sm"
                          onClick={() => updatePackage(pkg.name)}
                          variant={pkg.breaking ? "destructive" : "default"}
                        >
                          <Download className="mr-2 h-4 w-4" />
                          {pkg.breaking ? 'Update (Breaking)' : 'Update'}
                        </Button>
                      ) : (
                        <Badge variant="secondary">Up to date</Badge>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="security" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5" />
                Security Vulnerabilities
              </CardTitle>
            </CardHeader>
            <CardContent>
              {vulnerabilities.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <CheckCircle className="h-12 w-12 mx-auto mb-4 text-green-500" />
                  <p>No security vulnerabilities found.</p>
                  <p className="text-sm">Your packages are secure!</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {vulnerabilities.map((vuln) => (
                    <Alert key={vuln.id}>
                      <AlertTriangle className="h-4 w-4" />
                      <AlertDescription>
                        <div className="space-y-2">
                          <div className="flex items-center gap-2">
                            <Badge variant={getSeverityColor(vuln.severity)}>
                              {vuln.severity}
                            </Badge>
                            <span className="font-medium">{vuln.package}</span>
                            <span className="text-sm text-muted-foreground">{vuln.id}</span>
                          </div>
                          <p className="font-medium">{vuln.title}</p>
                          <p className="text-sm">{vuln.description}</p>
                          <div className="flex items-center gap-2">
                            <span className="text-sm">Fix available in: {vuln.fixVersion}</span>
                            {vuln.patchAvailable && (
                              <Badge variant="secondary">Patch available</Badge>
                            )}
                          </div>
                        </div>
                      </AlertDescription>
                    </Alert>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="updates" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Update Operations</CardTitle>
            </CardHeader>
            <CardContent>
              {updateOperations.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <Package className="h-12 w-12 mx-auto mb-4" />
                  <p>No update operations in progress.</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {updateOperations.map((operation, index) => (
                    <div key={`${operation.package}-${index}`} className="flex items-center justify-between p-3 border rounded">
                      <div className="flex items-center gap-3">
                        {getOperationIcon(operation.status)}
                        <div>
                          <p className="font-medium">{operation.package}</p>
                          <p className="text-sm text-muted-foreground">
                            {operation.from} → {operation.to}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {operation.breaking && (
                          <Badge variant="destructive">Breaking</Badge>
                        )}
                        <Badge variant={
                          operation.status === 'completed' ? 'default' :
                          operation.status === 'failed' ? 'destructive' : 'secondary'
                        }>
                          {operation.status}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="analytics" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle>Package Types</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span>Dependencies</span>
                    <div className="flex items-center gap-2">
                      <Progress 
                        value={(packages.filter(p => p.type === 'dependency').length / packages.length) * 100} 
                        className="w-20"
                      />
                      <span className="text-sm font-medium">
                        {packages.filter(p => p.type === 'dependency').length}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>Dev Dependencies</span>
                    <div className="flex items-center gap-2">
                      <Progress 
                        value={(packages.filter(p => p.type === 'devDependency').length / packages.length) * 100} 
                        className="w-20"
                      />
                      <span className="text-sm font-medium">
                        {packages.filter(p => p.type === 'devDependency').length}
                      </span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Bundle Impact</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-between">
                  <span>Total Install Size</span>
                  <span className="font-medium">
                    {formatBytes(packages.reduce((sum, pkg) => sum + pkg.size.current, 0))}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Bundle Size</span>
                  <span className="font-medium">
                    {formatBytes(packages.reduce((sum, pkg) => sum + pkg.size.bundled, 0))}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Compression Ratio</span>
                  <span className="font-medium">
                    {(packages.reduce((sum, pkg) => sum + pkg.size.bundled, 0) / 
                      packages.reduce((sum, pkg) => sum + pkg.size.current, 0) * 100).toFixed(1)}%
                  </span>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default AdvancedPackageManager;