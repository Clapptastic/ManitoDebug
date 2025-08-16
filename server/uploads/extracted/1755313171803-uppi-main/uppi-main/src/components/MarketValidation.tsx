import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useIsMobile } from "@/hooks/use-mobile";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { MarketResearchStep } from "@/types/market";

const MarketValidation = () => {
  const isMobile = useIsMobile();
  
  // Define all steps in proper order using the enum
  const steps = [
    MarketResearchStep.INITIALIZING,
    MarketResearchStep.INPUTTING,
    MarketResearchStep.PROCESSING,
    MarketResearchStep.ANALYZING,
    MarketResearchStep.VISUALIZING,
    MarketResearchStep.COMPLETED
  ];

  // Simplified step handler
  const handleStepClick = (step: MarketResearchStep) => {
    console.log("Step clicked:", step);
  };

  return (
    <section className={cn(
      "py-16 w-full",
      isMobile && "py-10"
    )}>
      <div className="container">
        <div className="flex flex-col items-center text-center mb-10">
          <Badge variant="outline" className="mb-4">Market Validation</Badge>
          <h2 className={cn(
            "text-3xl font-bold tracking-tighter",
            isMobile && "text-2xl"
          )}>
            Validate Your Market Confidently
          </h2>
          <p className="text-muted-foreground mt-4 max-w-2xl mx-auto">
            Use AI-powered market research tools to analyze competitors, identify market gaps, and validate your business idea with real data.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-6">
          {/* Market Size Analysis */}
          <Card className="bg-card hover:bg-card/90 transition-colors">
            <CardContent className="p-6">
              <div className="mb-4">
                <h3 className="text-xl font-semibold mb-2">Market Size</h3>
                <p className="text-muted-foreground text-sm">Estimate market size and growth potential for your industry.</p>
              </div>
              <Button variant="outline" size="sm" className="w-full">
                Analyze Market Size
              </Button>
            </CardContent>
          </Card>

          {/* Competitor Analysis */}
          <Card className="bg-card hover:bg-card/90 transition-colors">
            <CardContent className="p-6">
              <div className="mb-4">
                <h3 className="text-xl font-semibold mb-2">Competitor Analysis</h3>
                <p className="text-muted-foreground text-sm">Identify key competitors and analyze their strategies and weaknesses.</p>
              </div>
              <Button variant="outline" size="sm" className="w-full">
                Analyze Competitors
              </Button>
            </CardContent>
          </Card>

          {/* Customer Surveys */}
          <Card className="bg-card hover:bg-card/90 transition-colors">
            <CardContent className="p-6">
              <div className="mb-4">
                <h3 className="text-xl font-semibold mb-2">Customer Surveys</h3>
                <p className="text-muted-foreground text-sm">Create and analyze customer surveys to validate product demand.</p>
              </div>
              <Button variant="outline" size="sm" className="w-full">
                Create Survey
              </Button>
            </CardContent>
          </Card>
        </div>

        <div className="mt-10 text-center">
          <Button size="lg">
            Start Market Validation
          </Button>
        </div>
      </div>
    </section>
  );
};

export default MarketValidation;
