import React, { useCallback, useMemo, useState } from 'react';
import { Helmet } from 'react-helmet-async';
import AdminPageLayout from '@/components/admin/layout/AdminPageLayout';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Info, Loader2, SortAsc, Rows3 } from 'lucide-react';
import { Progress } from '@/components/ui/progress';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { ErrorBoundary } from 'react-error-boundary';
import { toast } from '@/hooks/use-toast';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';

// Local metadata cache for approximate created/updated times (per-admin session)
interface UnusedMeta {
  firstSeen: string; // ISO timestamp when first detected by this tool
  lastModified: string; // ISO when code hash changed
  lastHash: string; // content hash
  type: string; // derived from folder under /components
}

const META_STORAGE_KEY = 'admin_unused_components_meta_v1';

function deriveType(path: string): string {
  const after = path.split('/src/components/')[1] || '';
  const head = after.split('/')[0] || 'root';
  return head;
}

function hashCode(str: string): string {
  let h = 0;
  for (let i = 0; i < str.length; i++) {
    h = (h << 5) - h + str.charCodeAt(i);
    h |= 0;
  }
  return `${h}`;
}

// Eagerly import all project sources and components as raw strings for static analysis
const allSources = import.meta.glob('/src/**/*.{ts,tsx}', { as: 'raw', eager: true });
const componentFiles = Object.keys(import.meta.glob('/src/components/**/*.tsx'));
// Lazy module map for dynamic visual preview of components
const componentModules = import.meta.glob('/src/components/**/*.tsx');

function toAliasSpecifier(path: string): string {
  return path.replace('/src/', '@/').replace(/\.(tsx|ts)$/, '');
}

function computeUnused(): { unused: string[]; total: number } {
  // Fresh globs each run so refresh reflects latest code without reload
  const freshSources = import.meta.glob('/src/**/*.{ts,tsx}', { as: 'raw', eager: true });
  const freshComponentFiles = Object.keys(import.meta.glob('/src/components/**/*.tsx'));

  // Collect all import specifiers used across the repository
  const used = new Set<string>();
  const importRx = /import\s+[^'"\n]+\s+from\s+['"]([^'"\n]+)['"];?/g;
  const dynamicRx = /import\(\s*['"]([^'"\n]+)['"]\s*\)/g;

  Object.values(freshSources).forEach((src) => {
    if (typeof src !== 'string') return;
    let m: RegExpExecArray | null;
    while ((m = importRx.exec(src))) {
      used.add(m[1]);
    }
    while ((m = dynamicRx.exec(src))) {
      used.add(m[1]);
    }
  });

  // Heuristics: exclude UI primitives and legacy folders by default
  const candidates = freshComponentFiles.filter((p) => {
    if (/\/components\/ui\//.test(p)) return false;
    if (/\.test\.tsx$/.test(p)) return false;
    if (/\/legacy\//.test(p)) return true; // keep for visibility
    return true;
  });

  const unused = candidates.filter((p) => {
    const alias = toAliasSpecifier(p);
    return !used.has(alias);
  });

  return { unused: unused.sort(), total: candidates.length };
}

// Heuristic detector for React components from a module export
function isLikelyReactComponent(val: unknown, exportName?: string): val is React.ComponentType<any> {
  if (typeof val === 'function') {
    const name = (val as Function).name || exportName || '';
    return /^[A-Z]/.test(name);
  }
  return false;
}

// Estimate completion percentage based on code heuristics and renderability
function estimateCompletion(code: string, canRender: boolean, hasTests: boolean): number {
  let score = 0;
  const lines = code ? code.split('\n').length : 0;
  const hasDefaultExport = /export\s+default\s+/.test(code);
  const hasProps = /(interface|type)\s+\w*Props\b/.test(code) || /React\.FC|React\.FunctionComponent/.test(code);
  const hasHandlers = /onClick=|onChange=|onSubmit=/.test(code);
  const hasA11y = /aria-\w+|role=/.test(code);
  const usesUI = /from\s+['"]@\/components\/ui\//.test(code);
  const hasTodos = /(TODO|FIXME|WIP)/i.test(code);

  if (hasDefaultExport) score += 20; else score += 10;
  if (hasProps) score += 10;
  if (hasHandlers) score += 10;
  if (hasA11y) score += 5;
  if (usesUI) score += 10;
  if (lines > 80) score += 10; else if (lines > 30) score += 5;
  if (hasTests) score += 10;
  if (hasTodos) score -= 20;
  if (canRender) score += 20;

  return Math.max(0, Math.min(100, score));
}

export default function UnusedComponentsPage() {
  const [result, setResult] = useState(computeUnused());
  const [refreshing, setRefreshing] = useState(false);
  const onRefresh = useCallback(() => {
    setRefreshing(true);
    const start = performance.now();
    try {
      const next = computeUnused();
      setResult(next);
      const ms = Math.max(1, Math.round(performance.now() - start));
      toast({ title: 'Refreshed', description: `Scanned ${next.total} files · ${next.unused.length} unused · ${ms}ms` });
    } catch (e: any) {
      toast({ title: 'Refresh failed', description: e?.message || 'Unknown error', variant: 'destructive' });
    } finally {
      setRefreshing(false);
    }
  }, []);
  const counts = useMemo(() => ({ total: result.total, unused: result.unused.length }), [result]);
  const [query, setQuery] = useState('');
  const [sortBy, setSortBy] = useState<'alpha' | 'updated_desc' | 'created_desc' | 'type'>('alpha');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [meta, setMeta] = useState<Record<string, UnusedMeta>>(() => {
    try { return JSON.parse(localStorage.getItem(META_STORAGE_KEY) ?? '{}') as Record<string, UnusedMeta>; } catch { return {}; }
  });

  // Build or update local metadata for approximate created/updated times and type
  React.useEffect(() => {
    const nowIso = new Date().toISOString();
    const nextMeta: Record<string, UnusedMeta> = { ...meta };
    for (const p of result.unused) {
      const code = (allSources as Record<string, string>)[p] || '';
      const h = hashCode(code);
      const t = deriveType(p);
      const prev = nextMeta[p];
      if (!prev) {
        nextMeta[p] = { firstSeen: nowIso, lastModified: nowIso, lastHash: h, type: t };
      } else if (prev.lastHash !== h) {
        nextMeta[p] = { ...prev, lastModified: nowIso, lastHash: h, type: t };
      } else if (prev.type !== t) {
        nextMeta[p] = { ...prev, type: t };
      }
    }
    // Prune stale entries
    Object.keys(nextMeta).forEach((k) => { if (!result.unused.includes(k)) delete nextMeta[k]; });
    setMeta(nextMeta);
    try { localStorage.setItem(META_STORAGE_KEY, JSON.stringify(nextMeta)); } catch {}
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [result.unused]);

  const uniqueTypes = useMemo(() => {
    const set = new Set<string>();
    result.unused.forEach((p) => set.add(meta[p]?.type ?? deriveType(p)));
    return ['all', ...Array.from(set).sort()];
  }, [result.unused, meta]);

  const processed = useMemo(() => {
    const q = query.trim().toLowerCase();
    let list = q ? result.unused.filter((p) => p.toLowerCase().includes(q)) : [...result.unused];
    if (typeFilter !== 'all') {
      list = list.filter((p) => (meta[p]?.type ?? deriveType(p)) === typeFilter);
    }
    list.sort((a, b) => {
      switch (sortBy) {
        case 'type':
          return (meta[a]?.type ?? deriveType(a)).localeCompare(meta[b]?.type ?? deriveType(b)) || a.localeCompare(b);
        case 'created_desc':
          return (new Date(meta[b]?.firstSeen ?? 0).getTime()) - (new Date(meta[a]?.firstSeen ?? 0).getTime());
        case 'updated_desc':
          return (new Date(meta[b]?.lastModified ?? 0).getTime()) - (new Date(meta[a]?.lastModified ?? 0).getTime());
        case 'alpha':
        default:
          return a.localeCompare(b);
      }
    });
    return list;
  }, [result.unused, query, sortBy, typeFilter, meta]);

  const [previewOpen, setPreviewOpen] = useState(false);
  const [selectedPath, setSelectedPath] = useState<string | null>(null);
  const selectedCode = useMemo(() => (selectedPath ? (allSources as Record<string, string>)[selectedPath] ?? 'Source not found' : ''), [selectedPath]);

  // Live preview state
  const [PreviewComp, setPreviewComp] = useState<React.ComponentType<any> | null>(null);
  const [exportPicked, setExportPicked] = useState<string | null>(null);
  const [renderOk, setRenderOk] = useState(false);
  const [estimated, setEstimated] = useState(0);
  const [loadErr, setLoadErr] = useState<string | null>(null);

  const openPreview = useCallback(async (path: string) => {
    setSelectedPath(path);
    setPreviewComp(null);
    setExportPicked(null);
    setRenderOk(false);
    setLoadErr(null);

    // Code-based heuristics (initial)
    const code = (allSources as Record<string, string>)[path] || '';
    const baseName = path.split('/').pop()?.replace(/\.tsx$/, '') || '';
    const hasTests = Object.keys(allSources).some(p => /\.test\.tsx$/.test(p) && p.includes(baseName));
    setEstimated(estimateCompletion(code, false, hasTests));

    // Attempt dynamic import for visual preview
    try {
      const importer = (componentModules as Record<string, () => Promise<any>>)[path];
      if (importer) {
        const mod = await importer();
        let Comp: any = mod?.default;
        let picked: string | null = 'default';
        if (!Comp) {
          for (const [k, v] of Object.entries(mod)) {
            if (isLikelyReactComponent(v, k)) {
              Comp = v; picked = k; break;
            }
          }
        }
        if (Comp) {
          setPreviewComp(() => Comp as React.ComponentType<any>);
          setExportPicked(picked);
          // Boost estimate if we have a component to render
          setEstimated(prev => Math.min(100, prev + 10));
        } else {
          setLoadErr('No React component export found');
        }
      } else {
        setLoadErr('Module not found in components glob');
      }
    } catch (e: any) {
      setLoadErr(e?.message || 'Failed to load component module');
    }

    setPreviewOpen(true);
  }, []);

  // Wrapper to signal successful mount of previewed component
  const LiveWrapper: React.FC<{ onMounted?: () => void; children: React.ReactNode }> = ({ onMounted, children }) => {
    React.useEffect(() => { onMounted?.(); }, []);
    return <>{children}</>;
  };

  return (
    <>
      <Helmet>
        <title>Unused Components Audit</title>
        <meta name="description" content="List of components that appear unused across the repository." />
        <link rel="canonical" href="/admin/unused-components" />
      </Helmet>

      <AdminPageLayout
        title="Unused Components"
        description="Heuristic-based discovery of components that are not imported anywhere."
        actions={<Button size="sm" onClick={onRefresh} disabled={refreshing} aria-busy={refreshing} className="min-w-[120px]">{refreshing ? (<><Loader2 className="mr-2 h-4 w-4 animate-spin" />Refreshing...</>) : 'Refresh'}</Button>}
      >
        <div className="grid gap-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Card>
              <CardContent className="pt-4 flex items-center justify-between">
                <div className="text-sm">Components Scanned</div>
                <Badge variant="secondary">{counts.total}</Badge>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-4 flex items-center justify-between">
                <div className="text-sm">Potentially Unused</div>
                <Badge variant={counts.unused > 0 ? 'destructive' : 'secondary'}>
                  {counts.unused}
                </Badge>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardContent className="pt-4">
              <div className="grid gap-3">
                <div className="flex items-start gap-2 text-sm">
                  <Info className="h-4 w-4 mt-0.5" />
                  <p>Uses alias-based import matching (e.g., '@/components/...'). Relative imports may not be detected.</p>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <Input
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder="Search by name or path (e.g. Button, admin/...)"
                    aria-label="Search unused components"
                    className="flex-1 min-w-[220px]"
                  />
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="outline" className="whitespace-nowrap" aria-label="Sort options">
                        <SortAsc className="mr-2 h-4 w-4" />
                        Sort
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent className="z-50 bg-popover">
                      <DropdownMenuLabel>Sort by</DropdownMenuLabel>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem onClick={() => setSortBy('alpha')}>Alphabetical (A–Z)</DropdownMenuItem>
                      <DropdownMenuItem onClick={() => setSortBy('updated_desc')}>Most recently edited</DropdownMenuItem>
                      <DropdownMenuItem onClick={() => setSortBy('created_desc')}>Most recently detected</DropdownMenuItem>
                      <DropdownMenuItem onClick={() => setSortBy('type')}>Type (folder)</DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="outline" className="whitespace-nowrap" aria-label="Type filter">
                        <Rows3 className="mr-2 h-4 w-4" />
                        Type: {typeFilter}
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent className="z-50 bg-popover max-h-[300px] overflow-auto">
                      <DropdownMenuLabel>Filter by type</DropdownMenuLabel>
                      <DropdownMenuSeparator />
                      {uniqueTypes.map((t) => (
                        <DropdownMenuItem key={t} onClick={() => setTypeFilter(t)}>{t}</DropdownMenuItem>
                      ))}
                    </DropdownMenuContent>
                  </DropdownMenu>
                  <Badge variant="secondary">Showing {processed.length} of {result.unused.length}</Badge>
                </div>
              </div>
            </CardContent>
          </Card>

          <section>
            <h2 className="text-xl font-semibold mb-3">Potentially Unused Components</h2>
            {processed.length === 0 ? (
              <p className="text-sm text-muted-foreground">No components match your search.</p>
            ) : (
              <ul className="space-y-2">
                {processed.map((p) => (
                  <li key={p} className="text-sm">
                    <button
                      type="button"
                      className="underline text-primary hover:opacity-80"
                      onClick={() => openPreview(p)}
                      aria-label={`View source for ${p}`}
                    >
                      <code>{p.replace('/src/', '')}</code>
                    </button>
                    <div className="text-xs text-muted-foreground mt-1">
                      <span className="mr-3">Type: {meta[p]?.type ?? deriveType(p)}</span>
                      <span className="mr-3">Detected: {meta[p]?.firstSeen ? new Date(meta[p].firstSeen).toLocaleString() : '—'}</span>
                      <span>Edited: {meta[p]?.lastModified ? new Date(meta[p].lastModified).toLocaleString() : '—'}</span>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </div>
      </AdminPageLayout>

      <Dialog open={previewOpen} onOpenChange={setPreviewOpen}>
        <DialogContent className="max-w-5xl">
          <DialogHeader>
            <DialogTitle>Component preview</DialogTitle>
            <DialogDescription className="truncate">{selectedPath?.replace('/src/', '')}</DialogDescription>
          </DialogHeader>

          <div className="space-y-3">
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs">
                <div className="flex gap-4 text-muted-foreground">
                  <span>Export: {exportPicked ?? 'N/A'}</span>
                  <span>Renderable: {(renderOk || !!PreviewComp) ? 'Yes' : 'No'}</span>
                </div>
                <span className="font-medium">{estimated}%</span>
              </div>
              <Progress value={estimated} />
              {loadErr && <div className="text-xs text-destructive">Preview note: {loadErr}</div>}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <div className="rounded-md border p-3 bg-background">
                <div className="text-xs text-muted-foreground mb-2">Live preview</div>
                {PreviewComp ? (
                  <ErrorBoundary
                    fallbackRender={({ error }) => {
                      setLoadErr(error?.message || 'Render error');
                      setRenderOk(false);
                      return <div className="text-xs text-destructive">Render failed: {String(error?.message || error)}</div>;
                    }}
                  >
                    <LiveWrapper onMounted={() => { if (!renderOk) { setRenderOk(true); setEstimated(prev => Math.min(100, prev + 10)); } }}>
                      <div className="p-2 border rounded-md bg-muted/30">
                        <PreviewComp />
                      </div>
                    </LiveWrapper>
                  </ErrorBoundary>
                ) : (
                  <div className="text-sm text-muted-foreground">No preview available for this module.</div>
                )}
              </div>

              <div className="rounded-md border bg-muted/50 p-3 max-h-[60vh] overflow-auto">
                <div className="text-xs text-muted-foreground mb-2">Source code</div>
                <pre className="text-xs leading-relaxed">
                  <code>{selectedCode}</code>
                </pre>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}

