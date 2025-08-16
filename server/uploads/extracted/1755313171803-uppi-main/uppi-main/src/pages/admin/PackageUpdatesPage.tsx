import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Input } from '@/components/ui/input';
import { toast } from '@/hooks/use-toast';
import { Package, Download, RefreshCw, Search, AlertTriangle, CheckCircle, Clock, ArrowUp } from 'lucide-react';

interface PackageInfo {
  name: string;
  currentVersion: string;
  latestVersion: string;
  description: string;
  updateType: 'major' | 'minor' | 'patch';
  hasSecurityUpdate: boolean;
  lastUpdated: string;
}

export default function PackageUpdatesPage() {
  const [packages, setPackages] = useState<PackageInfo[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isUpdating, setIsUpdating] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  const mockPackages: PackageInfo[] = [
    {
      name: '@radix-ui/react-dialog',
      currentVersion: '1.1.2',
      latestVersion: '1.2.0',
      description: 'A modal dialog component',
      updateType: 'minor',
      hasSecurityUpdate: false,
      lastUpdated: '2 days ago'
    },
    {
      name: 'react',
      currentVersion: '18.3.1',
      latestVersion: '18.3.2',
      description: 'React JavaScript library',
      updateType: 'patch',
      hasSecurityUpdate: true,
      lastUpdated: '1 week ago'
    },
    {
      name: 'typescript',
      currentVersion: '5.0.4',
      latestVersion: '5.3.0',
      description: 'TypeScript language and compiler',
      updateType: 'minor',
      hasSecurityUpdate: false,
      lastUpdated: '3 days ago'
    },
    {
      name: 'tailwindcss',
      currentVersion: '3.3.0',
      latestVersion: '3.4.0',
      description: 'Utility-first CSS framework',
      updateType: 'minor',
      hasSecurityUpdate: false,
      lastUpdated: '1 day ago'
    },
    {
      name: 'lodash',
      currentVersion: '4.17.20',
      latestVersion: '4.17.21',
      description: 'JavaScript utility library',
      updateType: 'patch',
      hasSecurityUpdate: true,
      lastUpdated: '2 weeks ago'
    }
  ];

  useEffect(() => {
    setPackages(mockPackages);
  }, []);

  const checkForUpdates = async () => {
    setIsLoading(true);
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 2000));
      setPackages(mockPackages);
      toast({
        title: "Success",
        description: "Package information updated successfully",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to check for updates",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const updatePackage = async (packageName: string) => {
    setIsUpdating(packageName);
    try {
      // Simulate package update
      await new Promise(resolve => setTimeout(resolve, 3000));
      
      setPackages(prev => prev.map(pkg => 
        pkg.name === packageName 
          ? { ...pkg, currentVersion: pkg.latestVersion, hasSecurityUpdate: false }
          : pkg
      ));
      
      toast({
        title: "Success",
        description: `${packageName} updated successfully`,
      });
    } catch (error) {
      toast({
        title: "Error",
        description: `Failed to update ${packageName}`,
        variant: "destructive",
      });
    } finally {
      setIsUpdating(null);
    }
  };

  const updateAllPackages = async () => {
    setIsLoading(true);
    try {
      for (const pkg of packages) {
        if (pkg.currentVersion !== pkg.latestVersion) {
          await new Promise(resolve => setTimeout(resolve, 1000));
        }
      }
      
      setPackages(prev => prev.map(pkg => ({
        ...pkg,
        currentVersion: pkg.latestVersion,
        hasSecurityUpdate: false
      })));
      
      toast({
        title: "Success",
        description: "All packages updated successfully",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update packages",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const getUpdateBadgeVariant = (updateType: string) => {
    switch (updateType) {
      case 'major':
        return 'destructive';
      case 'minor':
        return 'default';
      case 'patch':
        return 'secondary';
      default:
        return 'secondary';
    }
  };

  const getUpdateIcon = (updateType: string) => {
    switch (updateType) {
      case 'major':
        return <AlertTriangle className="h-3 w-3" />;
      case 'minor':
        return <ArrowUp className="h-3 w-3" />;
      case 'patch':
        return <CheckCircle className="h-3 w-3" />;
      default:
        return <Clock className="h-3 w-3" />;
    }
  };

  const filteredPackages = packages.filter(pkg =>
    pkg.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const outdatedPackages = packages.filter(pkg => pkg.currentVersion !== pkg.latestVersion);
  const securityUpdates = packages.filter(pkg => pkg.hasSecurityUpdate);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Package Updates</h1>
        <p className="text-muted-foreground">Monitor and update project dependencies</p>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Packages</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{packages.length}</div>
            <p className="text-xs text-muted-foreground">
              dependencies tracked
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Updates Available</CardTitle>
            <Download className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{outdatedPackages.length}</div>
            <p className="text-xs text-muted-foreground">
              packages need updates
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Security Updates</CardTitle>
            <AlertTriangle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-destructive">{securityUpdates.length}</div>
            <p className="text-xs text-muted-foreground">
              critical updates
            </p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Package className="h-5 w-5" />
              Package Management
            </CardTitle>
            <div className="flex gap-2">
              <Button 
                variant="outline" 
                onClick={checkForUpdates}
                disabled={isLoading}
              >
                <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
                Check Updates
              </Button>
              <Button 
                onClick={updateAllPackages}
                disabled={isLoading || outdatedPackages.length === 0}
              >
                <Download className="h-4 w-4 mr-2" />
                Update All
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="relative">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search packages..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-8"
              />
            </div>

            <div className="space-y-3">
              {filteredPackages.map((pkg) => (
                <div key={pkg.name} className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex-1 space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-medium">{pkg.name}</span>
                      {pkg.hasSecurityUpdate && (
                        <Badge variant="destructive" className="text-xs">
                          Security
                        </Badge>
                      )}
                      <Badge variant={getUpdateBadgeVariant(pkg.updateType)} className="text-xs flex items-center gap-1">
                        {getUpdateIcon(pkg.updateType)}
                        {pkg.updateType}
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground">{pkg.description}</p>
                    <div className="text-xs text-muted-foreground">
                      Current: {pkg.currentVersion} → Latest: {pkg.latestVersion} • Updated {pkg.lastUpdated}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {pkg.currentVersion === pkg.latestVersion ? (
                      <Badge variant="default" className="flex items-center gap-1">
                        <CheckCircle className="h-3 w-3" />
                        Up to date
                      </Badge>
                    ) : (
                      <Button
                        size="sm"
                        onClick={() => updatePackage(pkg.name)}
                        disabled={isUpdating === pkg.name || isLoading}
                        variant={pkg.hasSecurityUpdate ? "destructive" : "default"}
                      >
                        {isUpdating === pkg.name ? (
                          <RefreshCw className="h-3 w-3 animate-spin" />
                        ) : (
                          <Download className="h-3 w-3" />
                        )}
                        Update
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}