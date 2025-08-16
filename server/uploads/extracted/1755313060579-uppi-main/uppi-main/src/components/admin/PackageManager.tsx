import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  Package, 
  RefreshCw, 
  AlertTriangle, 
  CheckCircle, 
  Download,
  Loader2,
  Shield,
  Clock
} from 'lucide-react';
import { toast } from '@/hooks/use-toast';

interface PackageInfo {
  name: string;
  currentVersion: string;
  latestVersion: string;
  status: 'up-to-date' | 'update-available' | 'security-update' | 'deprecated';
  description: string;
  severity?: 'low' | 'medium' | 'high' | 'critical';
  lastUpdated: string;
  category: 'core' | 'ui' | 'dev' | 'testing';
}

export const PackageManager: React.FC = () => {
  const [packages, setPackages] = useState<PackageInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState<string[]>([]);
  const [scanProgress, setScanProgress] = useState(0);

  const mockPackages: PackageInfo[] = [
    {
      name: '@radix-ui/react-dialog',
      currentVersion: '1.1.2',
      latestVersion: '1.1.2',
      status: 'up-to-date',
      description: 'Modal dialog component library',
      lastUpdated: '2024-01-15',
      category: 'ui'
    },
    {
      name: '@supabase/supabase-js',
      currentVersion: '2.49.4',
      latestVersion: '2.50.1',
      status: 'update-available',
      description: 'Supabase JavaScript client',
      lastUpdated: '2024-01-10',
      category: 'core'
    },
    {
      name: 'react',
      currentVersion: '18.3.1',
      latestVersion: '18.3.1',
      status: 'up-to-date',
      description: 'React library for building user interfaces',
      lastUpdated: '2024-01-20',
      category: 'core'
    },
    {
      name: 'axios',
      currentVersion: '1.6.2',
      latestVersion: '1.6.8',
      status: 'security-update',
      severity: 'high',
      description: 'Promise based HTTP client',
      lastUpdated: '2023-12-15',
      category: 'core'
    },
    {
      name: '@testing-library/react',
      currentVersion: '16.2.0',
      latestVersion: '16.2.0',
      status: 'up-to-date',
      description: 'React testing utilities',
      lastUpdated: '2024-01-18',
      category: 'testing'
    },
    {
      name: 'lodash',
      currentVersion: '4.17.21',
      latestVersion: '4.17.21',
      status: 'deprecated',
      description: 'JavaScript utility library (consider alternatives)',
      lastUpdated: '2023-08-15',
      category: 'core'
    }
  ];

  const scanPackages = async () => {
    setLoading(true);
    setScanProgress(0);

    // Simulate scanning progress
    const interval = setInterval(() => {
      setScanProgress(prev => {
        if (prev >= 100) {
          clearInterval(interval);
          return 100;
        }
        return prev + 10;
      });
    }, 200);

    // Simulate delay
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    setPackages(mockPackages);
    setLoading(false);
  };

  const updatePackage = async (packageName: string) => {
    setUpdating(prev => [...prev, packageName]);
    
    try {
      // Simulate update process
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      setPackages(prev => 
        prev.map(pkg => 
          pkg.name === packageName 
            ? { ...pkg, currentVersion: pkg.latestVersion, status: 'up-to-date' as const }
            : pkg
        )
      );

      toast({
        title: 'Package Updated',
        description: `${packageName} has been updated successfully`,
      });
    } catch (error) {
      toast({
        title: 'Update Failed',
        description: `Failed to update ${packageName}`,
        variant: 'destructive'
      });
    } finally {
      setUpdating(prev => prev.filter(name => name !== packageName));
    }
  };

  const updateAll = async () => {
    const packagesToUpdate = packages.filter(pkg => 
      pkg.status === 'update-available' || pkg.status === 'security-update'
    );

    for (const pkg of packagesToUpdate) {
      await updatePackage(pkg.name);
    }
  };

  useEffect(() => {
    scanPackages();
  }, []);

  const getStatusBadge = (status: string, severity?: string) => {
    switch (status) {
      case 'up-to-date':
        return <Badge variant="default" className="bg-green-100 text-green-800">Up to date</Badge>;
      case 'update-available':
        return <Badge variant="secondary">Update available</Badge>;
      case 'security-update':
        return (
          <Badge variant="destructive" className="flex items-center gap-1">
            <Shield className="h-3 w-3" />
            Security {severity}
          </Badge>
        );
      case 'deprecated':
        return <Badge variant="outline" className="bg-orange-100 text-orange-800">Deprecated</Badge>;
      default:
        return <Badge variant="outline">Unknown</Badge>;
    }
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'core': return <Package className="h-4 w-4" />;
      case 'ui': return <Package className="h-4 w-4" />;
      case 'dev': return <Package className="h-4 w-4" />;
      case 'testing': return <Package className="h-4 w-4" />;
      default: return <Package className="h-4 w-4" />;
    }
  };

  const securityUpdates = packages.filter(pkg => pkg.status === 'security-update').length;
  const availableUpdates = packages.filter(pkg => 
    pkg.status === 'update-available' || pkg.status === 'security-update'
  ).length;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Package Manager</h2>
          <p className="text-muted-foreground">Manage and update project dependencies</p>
        </div>
        <div className="flex gap-2">
          <Button onClick={scanPackages} disabled={loading} variant="outline">
            {loading ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <RefreshCw className="h-4 w-4 mr-2" />
            )}
            Scan
          </Button>
          {availableUpdates > 0 && (
            <Button onClick={updateAll} disabled={updating.length > 0}>
              <Download className="h-4 w-4 mr-2" />
              Update All ({availableUpdates})
            </Button>
          )}
        </div>
      </div>

      {loading && (
        <Card>
          <CardContent className="p-6">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Scanning packages...</span>
                <span className="text-sm text-muted-foreground">{scanProgress}%</span>
              </div>
              <Progress value={scanProgress} className="w-full" />
            </div>
          </CardContent>
        </Card>
      )}

      {!loading && (
        <>
          <div className="grid gap-4 md:grid-cols-3">
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-5 w-5 text-green-600" />
                  <div>
                    <div className="text-2xl font-bold">
                      {packages.filter(p => p.status === 'up-to-date').length}
                    </div>
                    <div className="text-sm text-muted-foreground">Up to date</div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-2">
                  <Download className="h-5 w-5 text-blue-600" />
                  <div>
                    <div className="text-2xl font-bold">{availableUpdates}</div>
                    <div className="text-sm text-muted-foreground">Updates available</div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-2">
                  <AlertTriangle className="h-5 w-5 text-red-600" />
                  <div>
                    <div className="text-2xl font-bold">{securityUpdates}</div>
                    <div className="text-sm text-muted-foreground">Security updates</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Dependencies</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {packages.map((pkg, index) => (
                  <div key={index} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center gap-3">
                      {getCategoryIcon(pkg.category)}
                      <div>
                        <div className="font-medium">{pkg.name}</div>
                        <div className="text-sm text-muted-foreground">{pkg.description}</div>
                        <div className="text-xs text-muted-foreground flex items-center gap-2 mt-1">
                          <Clock className="h-3 w-3" />
                          Last updated: {pkg.lastUpdated}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-4">
                      <div className="text-right">
                        <div className="text-sm font-medium">
                          {pkg.currentVersion}
                          {pkg.currentVersion !== pkg.latestVersion && (
                            <span className="text-muted-foreground"> → {pkg.latestVersion}</span>
                          )}
                        </div>
                        {getStatusBadge(pkg.status, pkg.severity)}
                      </div>

                      {(pkg.status === 'update-available' || pkg.status === 'security-update') && (
                        <Button
                          size="sm"
                          onClick={() => updatePackage(pkg.name)}
                          disabled={updating.includes(pkg.name)}
                        >
                          {updating.includes(pkg.name) ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            'Update'
                          )}
                        </Button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
};