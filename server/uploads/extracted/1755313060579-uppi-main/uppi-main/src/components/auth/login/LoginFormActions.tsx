
import React from "react";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";

interface LoginFormActionsProps {
  loading: boolean;
  passkeyLoading: boolean;
  onPasskeyLogin: () => void;
}

export const LoginFormActions: React.FC<LoginFormActionsProps> = ({
  loading,
  passkeyLoading,
  onPasskeyLogin
}) => {
  return (
    <div className="space-y-4">
      <Button 
        type="submit" 
        className="w-full" 
        disabled={loading || passkeyLoading}
      >
        {loading ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Logging in...
          </>
        ) : (
          "Login"
        )}
      </Button>
      
      <div className="relative">
        <div className="absolute inset-0 flex items-center">
          <span className="w-full border-t" />
        </div>
        <div className="relative flex justify-center text-xs uppercase">
          <span className="bg-background px-2 text-muted-foreground">
            Or continue with
          </span>
        </div>
      </div>
      
      <Button
        type="button"
        variant="outline"
        className="w-full"
        onClick={onPasskeyLogin}
        disabled={loading || passkeyLoading}
      >
        {passkeyLoading ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Logging in...
          </>
        ) : (
          "Sign in with Google"
        )}
      </Button>
    </div>
  );
};
