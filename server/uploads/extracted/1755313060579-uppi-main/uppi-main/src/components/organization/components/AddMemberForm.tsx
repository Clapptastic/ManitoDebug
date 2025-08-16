
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { UserPlus } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";

interface AddMemberFormProps {
  newMemberEmail: string;
  onEmailChange: (email: string) => void;
  onAddMember: () => void;
  disabled: boolean;
  error?: string;
}

const AddMemberForm = ({ 
  newMemberEmail, 
  onEmailChange, 
  onAddMember, 
  disabled,
  error 
}: AddMemberFormProps) => {
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      await onAddMember();
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}
      <div className="flex gap-4">
        <Input
          type="email"
          placeholder="Enter member email"
          value={newMemberEmail}
          onChange={(e) => onEmailChange(e.target.value)}
          disabled={disabled || isSubmitting}
          required
        />
        <Button 
          type="submit" 
          disabled={disabled || isSubmitting || !newMemberEmail}
        >
          <UserPlus className="w-4 h-4 mr-2" />
          Add Member
        </Button>
      </div>
    </form>
  );
};

export default AddMemberForm;
