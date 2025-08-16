import React from 'react';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { User, Briefcase, Building2 } from 'lucide-react';

interface ProfileSetupStepProps {
  data: any;
  onUpdate: (data: any) => void;
  onNext: () => void;
}

export const ProfileSetupStep: React.FC<ProfileSetupStepProps> = ({ 
  data, 
  onUpdate 
}) => {
  const companySizes = [
    { value: 'solo', label: 'Just me (Solo entrepreneur)' },
    { value: 'small', label: '2-10 employees' },
    { value: 'medium', label: '11-50 employees' },
    { value: 'large', label: '51-200 employees' },
    { value: 'enterprise', label: '200+ employees' }
  ];

  return (
    <div className="space-y-6">
      <div className="text-center space-y-2">
        <h2 className="text-2xl font-bold text-foreground">Tell us about yourself</h2>
        <p className="text-muted-foreground">
          Help us personalize your experience by sharing some basic information.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-lg">
              <User className="w-5 h-5 text-primary" />
              Personal Information
            </CardTitle>
            <CardDescription>
              Your basic profile details
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="fullName" className="text-sm font-medium">
                Full Name *
              </Label>
              <Input
                id="fullName"
                placeholder="Enter your full name"
                value={data.fullName || ''}
                onChange={(e) => onUpdate({ fullName: e.target.value })}
                className="w-full"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="jobTitle" className="text-sm font-medium">
                Job Title *
              </Label>
              <Input
                id="jobTitle"
                placeholder="e.g., Founder, CEO, Product Manager"
                value={data.jobTitle || ''}
                onChange={(e) => onUpdate({ jobTitle: e.target.value })}
                className="w-full"
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-lg">
              <Building2 className="w-5 h-5 text-primary" />
              Company Information
            </CardTitle>
            <CardDescription>
              Details about your organization
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="companySize" className="text-sm font-medium">
                Company Size *
              </Label>
              <Select 
                value={data.companySize || ''} 
                onValueChange={(value) => onUpdate({ companySize: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select company size" />
                </SelectTrigger>
                <SelectContent>
                  {companySizes.map((size) => (
                    <SelectItem key={size.value} value={size.value}>
                      {size.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="industry" className="text-sm font-medium">
                Industry (Optional)
              </Label>
              <Input
                id="industry"
                placeholder="e.g., SaaS, E-commerce, Consulting"
                value={data.industry || ''}
                onChange={(e) => onUpdate({ industry: e.target.value })}
                className="w-full"
              />
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="bg-muted/30">
        <CardContent className="pt-6">
          <div className="flex items-start gap-3">
            <Briefcase className="w-5 h-5 text-primary mt-0.5" />
            <div>
              <h4 className="font-medium text-foreground mb-1">
                Why do we need this information?
              </h4>
              <p className="text-sm text-muted-foreground">
                This helps us customize your dashboard, recommend relevant features, 
                and provide more accurate market analysis based on your company stage and industry.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};