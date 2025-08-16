# Developer Quick Reference

## Admin Dashboard Quick Start

### Essential Components

```typescript
// 1. Protect admin routes
<ProtectedRoute requireAdmin>
  <YourAdminComponent />
</ProtectedRoute>

// 2. Wrap with error boundary
<AdminErrorBoundary>
  <YourComponent />
</AdminErrorBoundary>

// 3. Use admin context
const { state, actions } = useAdminContext();

// 4. Check user roles
const { isAdmin, isSuperAdmin } = useUserRole();
```

### Common Patterns

#### Admin Service Integration
```typescript
import { adminService } from '@/services/adminService';

// Always wrap in try-catch
try {
  const data = await adminService.fetchSystemHealth();
  // Handle success
} catch (error) {
  console.error('[Component] Error:', error);
  // Handle error
}
```

#### Role-based UI
```typescript
{isAdmin && <AdminControls />}
{isSuperAdmin && <SuperAdminSettings />}
```

#### Error Handling
```typescript
// Component level
<AdminErrorBoundary fallback={<ErrorFallback />}>
  <Component />
</AdminErrorBoundary>

// Service level
const handleError = (error: Error) => {
  console.error('[Service] Error:', error);
  toast.error('Operation failed');
};
```

### Database Patterns

#### RLS Policy Template
```sql
-- Standard admin policy
CREATE POLICY "Admins can manage [table]" 
ON [table] 
FOR ALL 
USING (
  EXISTS (
    SELECT 1 FROM profiles 
    WHERE id = auth.uid() 
    AND role IN ('admin', 'super_admin')
  )
);
```

#### Query Pattern
```typescript
const { data, error } = await supabase
  .from('table')
  .select('*')
  .order('created_at', { ascending: false });

if (error) throw error;
return data;
```

### Performance Guidelines

1. **Use AdminContext** for shared state
2. **Cache role checks** - don't query on every render
3. **Batch database operations** when possible
4. **Implement loading states** for better UX

### Security Checklist

- [ ] Route protected with `ProtectedRoute`
- [ ] RLS policies implemented
- [ ] User input validated
- [ ] Error messages sanitized
- [ ] Audit logging implemented

### Testing Commands

```bash
# Run all tests
npm run test

# Test admin components
npm run test -- --testPathPattern=admin

# Test with coverage
npm run test -- --coverage
```

---

*For complete documentation, see [ADMIN_DASHBOARD.md](ADMIN_DASHBOARD.md)*