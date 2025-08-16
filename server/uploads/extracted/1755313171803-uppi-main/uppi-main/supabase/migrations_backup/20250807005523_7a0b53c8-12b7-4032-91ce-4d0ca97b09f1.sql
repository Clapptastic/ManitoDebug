-- Add missing RLS policies for the new tables

-- RLS policies for business_tools_usage
CREATE POLICY "Users can manage their own business tools usage"
ON business_tools_usage
FOR ALL
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Service role full access to business tools usage"
ON business_tools_usage
FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

-- RLS policies for scale_metrics
CREATE POLICY "Users can manage their own scale metrics"
ON scale_metrics
FOR ALL
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Service role full access to scale metrics"
ON scale_metrics
FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

-- RLS policies for user_permissions
CREATE POLICY "Users can view their own permissions"
ON user_permissions
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Super admin can manage all permissions"
ON user_permissions
FOR ALL
TO authenticated
USING ((auth.uid())::text = '5a922aca-e1a4-4a1f-a32b-aaec11b645f3'::text OR get_user_role(auth.uid()) = ANY (ARRAY['admin'::text, 'super_admin'::text]))
WITH CHECK ((auth.uid())::text = '5a922aca-e1a4-4a1f-a32b-aaec11b645f3'::text OR get_user_role(auth.uid()) = ANY (ARRAY['admin'::text, 'super_admin'::text]));

CREATE POLICY "Service role full access to user permissions"
ON user_permissions
FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

-- RLS policies for test_results
CREATE POLICY "Users can manage their own test results"
ON test_results
FOR ALL
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Service role full access to test results"
ON test_results
FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

-- Add triggers for updated_at timestamps
CREATE TRIGGER update_business_tools_usage_updated_at
  BEFORE UPDATE ON business_tools_usage
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_scale_metrics_updated_at
  BEFORE UPDATE ON scale_metrics
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();