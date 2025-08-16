import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Helmet } from 'react-helmet-async';
import AdminPageLayout from '@/components/admin/layout/AdminPageLayout';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Info } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useToast } from '@/hooks/use-toast';

// Build-time loader of AdminRoutes source for static analysis (lazy to avoid cycles)
// Note: We load the raw content on-demand to prevent circular import issues with AdminRoutes
import { adminItems } from '@/components/admin/layout/AdminNavItems';
const routesRawLoaderMap = import.meta.glob('/src/routes/AdminRoutes.tsx', { as: 'raw' });
const routesLoader = (Object.values(routesRawLoaderMap)[0] as unknown as (() => Promise<string>)) || undefined;

const STORAGE_KEY = 'navCoverageAuditCache_v1';

function parseAdminRoutePaths(src: string): string[] {
  const rx = /<Route\s+path=\"([^\"]+)\"/g; // capture paths
  const results = new Set<string>();
  let m: RegExpExecArray | null;
  while ((m = rx.exec(src))) {
    const rel = m[1];
    if (!rel) continue;
    // Skip legacy redirects or obvious non-content paths if needed later
    const full = rel === '' || rel === 'dashboard' ? '/admin' : `/admin/${rel}`;
    results.add(full);
  }
  return Array.from(results).sort();
}

export default function NavCoverageAuditPage() {
  const [routesSource, setRoutesSource] = useState<string>('');
  // Toast helper for user feedback on refresh actions
  const { toast } = useToast();
  // UI loading state: indicates when a manual Refresh is in progress
  const [isRefreshing, setIsRefreshing] = useState(false);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const src = routesLoader ? await routesLoader() : '';
        if (mounted) setRoutesSource(src || '');
      } catch (e) {
        console.warn('Failed to load AdminRoutes source', e);
      }
    })();
    return () => { mounted = false; };
  }, []);

  const compute = useCallback(() => {
    const routePaths = parseAdminRoutePaths(routesSource || '');
    const navHrefs = new Set(adminItems.map(i => i.href));
    const missing = routePaths.filter(p => !navHrefs.has(p));
    return { routePaths, navHrefs: Array.from(navHrefs).sort(), missing };
  }, [routesSource]);

  const [data, setData] = useState(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) return JSON.parse(raw);
    } catch {}
    return compute();
  });
  const onRefresh = useCallback(() => {
    setIsRefreshing(true);
    const next = compute();
    setData(next);
    setIsRefreshing(false);
    // Non-blocking UX feedback to confirm action and outcome
    toast({
      title: 'Audit updated',
      description: `Routes: ${next.routePaths.length} • Nav: ${next.navHrefs.length} • Missing: ${next.missing.length}`,
      variant: next.missing.length > 0 ? 'destructive' : 'default',
    });
  }, [compute, toast]);

  // Recompute when the AdminRoutes source changes
  useEffect(() => {
    if (routesSource) {
      const next = compute();
      setData(next);
    }
  }, [routesSource, compute]);

  // Persist latest results to localStorage for frontend persistence across reloads
  useEffect(() => {
    try {
      localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({ ...data, updatedAt: new Date().toISOString() })
      );
    } catch {}
  }, [data]);

  const counts = useMemo(() => ({
    routes: data.routePaths.length,
    nav: data.navHrefs.length,
    missing: data.missing.length,
  }), [data]);

  return (
    <>
      <Helmet>
        <title>Admin Nav Coverage Audit</title>
        <meta name="description" content="List of admin routes not present in the sidebar navigation." />
        <link rel="canonical" href="/admin/nav-coverage" />
      </Helmet>

      <AdminPageLayout
        title="Navigation Coverage Audit"
        description="Review admin routes that are missing from the sidebar navigation."
        actions={<Button size="sm" onClick={onRefresh} disabled={isRefreshing} aria-busy={isRefreshing}>{isRefreshing ? 'Refreshing...' : 'Refresh'}</Button>}
      >
        <div className="grid gap-6">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <Card>
              <CardContent className="pt-4 flex items-center justify-between">
                <div className="text-sm">Total Admin Routes</div>
                <Badge variant="secondary">{counts.routes}</Badge>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-4 flex items-center justify-between">
                <div className="text-sm">Nav Items</div>
                <Badge variant="secondary">{counts.nav}</Badge>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-4 flex items-center justify-between">
                <div className="text-sm">Missing in Nav</div>
                <Badge variant={counts.missing > 0 ? 'destructive' : 'secondary'}>
                  {counts.missing}
                </Badge>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardContent className="pt-4">
              <div className="flex items-start gap-2 text-sm">
                <Info className="h-4 w-4 mt-0.5" />
                <p>This list is generated from AdminRoutes.tsx and compared against AdminNavItems. Use Refresh after edits.</p>
              </div>
            </CardContent>
          </Card>

          <section>
            <h2 className="text-xl font-semibold mb-3">Routes Missing from Navigation</h2>
            {data.missing.length === 0 ? (
              <p className="text-sm text-muted-foreground">All routes are represented in the sidebar navigation.</p>
            ) : (
              <ul className="space-y-2">
                {data.missing.map((p) => (
                  <li key={p}>
                    <Link className="underline" to={p}>{p}</Link>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </div>
      </AdminPageLayout>
    </>
  );
}
