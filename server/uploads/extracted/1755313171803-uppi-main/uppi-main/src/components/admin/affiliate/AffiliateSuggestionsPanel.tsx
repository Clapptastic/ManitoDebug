import React, { useEffect, useMemo, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Check, ExternalLink, Filter, Loader2, Plus, X } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { OutboundLink } from '@/components/shared/OutboundLink';

export type SuggestionStatus = 'new' | 'reviewed' | 'ignored';

interface SuggestionRow {
  id: string;
  domain: string;
  original_url: string;
  detected_program_name: string | null;
  provider: string | null;
  signup_url: string | null;
  status: SuggestionStatus;
  created_at: string;
  created_by: string;
}

interface CreateProgramForm {
  program_name: string;
  affiliate_code: string;
  affiliate_url?: string;
}

/**
 * AffiliateSuggestionsPanel
 * - Displays incoming affiliate link suggestions with filterable status
 * - Allows admins to mark reviewed/ignored, set signup URL, and create a program
 * - Uses OutboundLink for external links and follows design system tokens
 */
export const AffiliateSuggestionsPanel: React.FC = () => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [rows, setRows] = useState<SuggestionRow[]>([]);
  const [filter, setFilter] = useState<SuggestionStatus | 'all'>('new');
  const [editingUrl, setEditingUrl] = useState<Record<string, string>>({});
  const [creatingId, setCreatingId] = useState<string | null>(null);
  const [createForm, setCreateForm] = useState<CreateProgramForm>({ program_name: '', affiliate_code: '' });

  useEffect(() => {
    loadSuggestions();
  }, []);

  const loadSuggestions = async () => {
    try {
      setLoading(true);
      let query = supabase
        .from('affiliate_link_suggestions')
        .select('id, domain, original_url, detected_program_name, provider, signup_url, status, created_at, created_by')
        .order('created_at', { ascending: false });

      const { data, error } = await query;
      if (error) throw error;
      setRows((data || []) as SuggestionRow[]);
    } catch (e: any) {
      console.error(e);
      toast({ title: 'Error', description: 'Failed to load suggestions', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  const filtered = useMemo(() => {
    if (filter === 'all') return rows;
    return rows.filter(r => r.status === filter);
  }, [rows, filter]);

  const setStatus = async (id: string, status: SuggestionStatus) => {
    const { error } = await supabase
      .from('affiliate_link_suggestions')
      .update({ status })
      .eq('id', id);
    if (error) {
      toast({ title: 'Error', description: 'Failed to update status', variant: 'destructive' });
      return;
    }
    setRows(prev => prev.map(r => (r.id === id ? { ...r, status } : r)));
    toast({ title: 'Updated', description: `Suggestion marked as ${status}` });
  };

  const saveSignupUrl = async (id: string) => {
    const url = editingUrl[id]?.trim();
    const { error } = await supabase
      .from('affiliate_link_suggestions')
      .update({ signup_url: url || null })
      .eq('id', id);
    if (error) {
      toast({ title: 'Error', description: 'Failed to save signup URL', variant: 'destructive' });
      return;
    }
    setRows(prev => prev.map(r => (r.id === id ? { ...r, signup_url: url || null } : r)));
    toast({ title: 'Saved', description: 'Signup URL updated' });
  };

  const openCreate = (s: SuggestionRow) => {
    setCreatingId(s.id);
    setCreateForm({
      program_name: s.detected_program_name || s.domain,
      affiliate_code: '',
      affiliate_url: s.signup_url || undefined,
    });
  };

  const createProgram = async (s: SuggestionRow) => {
    if (!createForm.program_name || !createForm.affiliate_code) {
      toast({ title: 'Missing fields', description: 'Program name and affiliate code are required', variant: 'destructive' });
      return;
    }

    const payload: any = {
      program_name: createForm.program_name,
      affiliate_code: createForm.affiliate_code,
      affiliate_url: createForm.affiliate_url || null,
      default_url: s.signup_url || null,
      domain: s.domain,
      provider: s.provider,
      status: 'active',
      is_active: true,
    };

    const { error } = await supabase.from('affiliate_programs').insert(payload);
    if (error) {
      toast({ title: 'Error', description: 'Failed to create program', variant: 'destructive' });
      return;
    }

    // Mark suggestion reviewed after creation
    await setStatus(s.id, 'reviewed');
    setCreatingId(null);
    toast({ title: 'Program created', description: `${payload.program_name} added` });
  };

  const StatusBadge = ({ status }: { status: SuggestionStatus }) => {
    const text = status === 'new' ? 'New' : status === 'reviewed' ? 'Reviewed' : 'Ignored';
    const variant = status === 'new' ? 'default' : status === 'reviewed' ? 'secondary' : 'outline';
    return <Badge variant={variant}>{text}</Badge>;
  };

  return (
    <Card className="animate-fade-in">
      <CardHeader>
        <CardTitle>Affiliate Suggestions</CardTitle>
        <CardDescription>Review and promote suggestions to programs</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Filter className="h-4 w-4" />
            <div className="flex gap-2">
              {(['all', 'new', 'reviewed', 'ignored'] as const).map((f) => (
                <Button
                  key={f}
                  size="sm"
                  variant={filter === f ? 'default' : 'outline'}
                  onClick={() => setFilter(f as any)}
                >
                  {String(f).toUpperCase()}
                </Button>
              ))}
            </div>
          </div>
          <Button variant="outline" size="sm" onClick={loadSuggestions}>Refresh</Button>
        </div>

        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Domain</TableHead>
                <TableHead>Provider</TableHead>
                <TableHead>Program</TableHead>
                <TableHead>Signup URL</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center">
                    <div className="flex items-center justify-center gap-2 py-6 text-muted-foreground">
                      <Loader2 className="h-4 w-4 animate-spin" /> Loading suggestions...
                    </div>
                  </TableCell>
                </TableRow>
              ) : filtered.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center text-muted-foreground py-6">
                    No suggestions
                  </TableCell>
                </TableRow>
              ) : (
                filtered.map((s) => (
                  <TableRow key={s.id}>
                    <TableCell className="font-medium">{s.domain}</TableCell>
                    <TableCell className="capitalize">{s.provider || '-'}</TableCell>
                    <TableCell>{s.detected_program_name || '-'}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Input
                          placeholder="https://..."
                          value={editingUrl[s.id] ?? s.signup_url ?? ''}
                          onChange={(e) => setEditingUrl((m) => ({ ...m, [s.id]: e.target.value }))}
                          className="max-w-sm"
                        />
                        <Button size="sm" variant="secondary" onClick={() => saveSignupUrl(s.id)}>
                          <Check className="h-4 w-4" />
                        </Button>
                        {s.signup_url && (
                          <Button size="sm" variant="outline" asChild>
                            <OutboundLink href={s.signup_url}>
                              <ExternalLink className="h-4 w-4" />
                            </OutboundLink>
                          </Button>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <StatusBadge status={s.status} />
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button size="sm" variant="outline" onClick={() => setStatus(s.id, 'reviewed')}>
                          Mark reviewed
                        </Button>
                        <Button size="sm" variant="outline" onClick={() => setStatus(s.id, 'ignored')}>
                          <X className="h-4 w-4 mr-1" /> Ignore
                        </Button>
                        <Button size="sm" onClick={() => openCreate(s)}>
                          <Plus className="h-4 w-4 mr-1" /> Create Program
                        </Button>
                      </div>

                      {creatingId === s.id && (
                        <div className="mt-3 p-3 rounded-md border bg-card animate-fade-in">
                          <div className="grid gap-2 md:grid-cols-3">
                            <Input
                              placeholder="Program name"
                              value={createForm.program_name}
                              onChange={(e) => setCreateForm((f) => ({ ...f, program_name: e.target.value }))}
                            />
                            <Input
                              placeholder="Affiliate code"
                              value={createForm.affiliate_code}
                              onChange={(e) => setCreateForm((f) => ({ ...f, affiliate_code: e.target.value }))}
                            />
                            <Input
                              placeholder="Affiliate URL (optional)"
                              value={createForm.affiliate_url || ''}
                              onChange={(e) => setCreateForm((f) => ({ ...f, affiliate_url: e.target.value }))}
                            />
                          </div>
                          <div className="mt-2 flex justify-end gap-2">
                            <Button size="sm" variant="ghost" onClick={() => setCreatingId(null)}>Cancel</Button>
                            <Button size="sm" onClick={() => createProgram(s)}>Create</Button>
                          </div>
                        </div>
                      )}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
};

export default AffiliateSuggestionsPanel;
