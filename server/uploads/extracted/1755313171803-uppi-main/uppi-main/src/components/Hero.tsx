
import { Button } from "@/components/ui/button";
import { Rocket, ArrowRight } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";

const Hero = () => {
  const navigate = useNavigate();
  const { toast } = useToast();

  const handleWatchDemo = () => {
    // Navigate to competitor analysis demo
    navigate("/competitor-analysis");
  };

  return (
    <div className="relative min-h-screen flex items-center justify-center overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-secondary/5" />
      <div className="container mx-auto px-4 pb-16 text-center relative animate-fade-in">
        <div className="inline-flex items-center gap-2 bg-primary/10 text-primary px-4 py-2 rounded-full mb-8">
          <Rocket className="w-4 h-4" />
          <span className="text-sm font-medium">Build Better with AI</span>
        </div>
        <h1 className="text-4xl md:text-6xl font-bold mb-6 bg-clip-text text-transparent bg-gradient-to-r from-primary to-primary/80">
          uppi.ai - Market Research & Validation
        </h1>
        <p className="text-xl md:text-2xl text-muted-foreground max-w-2xl mx-auto mb-8">
          Transform your ideas into successful businesses with our AI-powered platform. Get instant guidance, validate your market, and build your MVP faster.
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Button size="lg" className="text-lg" onClick={() => navigate("/login")}>
            Start Free Trial
            <ArrowRight className="ml-2 w-4 h-4" />
          </Button>
          <Button size="lg" variant="outline" className="text-lg" onClick={handleWatchDemo}>
            Watch Demo
          </Button>
        </div>
        <div className="mt-12 text-muted-foreground">
          <p className="text-sm">Trusted by entrepreneurs worldwide</p>
        </div>
      </div>
    </div>
  );
};

export default Hero;

