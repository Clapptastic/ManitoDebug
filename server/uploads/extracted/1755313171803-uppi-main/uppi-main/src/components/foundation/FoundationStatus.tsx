/**
 * Phase 0: Foundation Status Component
 * Displays Phase 0 completion status and validation results
 */

import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { CheckCircle, XCircle, AlertTriangle, RefreshCw } from 'lucide-react';
import { validationService, Phase0ValidationResult } from '@/services/foundation/ValidationService';

export const FoundationStatus: React.FC = () => {
  const [validation, setValidation] = useState<Phase0ValidationResult | null>(null);
  const [loading, setLoading] = useState(false);

  const runValidation = async () => {
    setLoading(true);
    try {
      const result = await validationService.validatePhase0();
      setValidation(result);
    } catch (error) {
      console.error('Validation failed:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    runValidation();
  }, []);

  const getStatusIcon = (passed: boolean) => {
    return passed ? (
      <CheckCircle className="h-5 w-5 text-green-500" />
    ) : (
      <XCircle className="h-5 w-5 text-red-500" />
    );
  };

  const getStatusBadge = (passed: boolean) => {
    return (
      <Badge variant={passed ? "default" : "destructive"}>
        {passed ? "PASSED" : "FAILED"}
      </Badge>
    );
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          Phase 0: Foundation Status
          <Button
            variant="outline"
            size="sm"
            onClick={runValidation}
            disabled={loading}
          >
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            Validate
          </Button>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {validation && (
          <>
            <div className="flex items-center justify-between">
              <span className="font-medium">Overall Status:</span>
              {getStatusBadge(validation.passed)}
            </div>

            <div className="w-full bg-secondary rounded-full h-2">
              <div
                className="bg-primary h-2 rounded-full transition-all duration-300"
                style={{ width: `${validation.completionPercentage}%` }}
              />
            </div>
            <p className="text-sm text-muted-foreground">
              {validation.completionPercentage.toFixed(1)}% Complete
            </p>

            <div className="space-y-2">
              <h4 className="font-medium">Component Status:</h4>
              
              <div className="flex items-center gap-2">
                {getStatusIcon(validation.details.database)}
                <span>Database Tables</span>
              </div>
              
              <div className="flex items-center gap-2">
                {getStatusIcon(validation.details.rls)}
                <span>RLS Policies</span>
              </div>
              
              <div className="flex items-center gap-2">
                {getStatusIcon(validation.details.services)}
                <span>Foundation Services</span>
              </div>
              
              <div className="flex items-center gap-2">
                {getStatusIcon(validation.details.components)}
                <span>Foundation Components</span>
              </div>
            </div>

            {validation.errors.length > 0 && (
              <Alert variant="destructive">
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>
                  <strong>Errors:</strong>
                  <ul className="mt-1 list-disc list-inside">
                    {validation.errors.map((error, index) => (
                      <li key={index}>{error}</li>
                    ))}
                  </ul>
                </AlertDescription>
              </Alert>
            )}

            {validation.warnings.length > 0 && (
              <Alert>
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>
                  <strong>Warnings:</strong>
                  <ul className="mt-1 list-disc list-inside">
                    {validation.warnings.map((warning, index) => (
                      <li key={index}>{warning}</li>
                    ))}
                  </ul>
                </AlertDescription>
              </Alert>
            )}
          </>
        )}

        {loading && (
          <div className="text-center text-muted-foreground">
            Running Phase 0 validation...
          </div>
        )}
      </CardContent>
    </Card>
  );
};