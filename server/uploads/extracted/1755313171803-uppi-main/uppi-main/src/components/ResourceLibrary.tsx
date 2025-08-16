import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Book, Video, FileText, Users, Download, ExternalLink } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useNavigate } from "react-router-dom";

const resources = [
  {
    title: "Startup Playbook",
    description: "Step-by-step guide to launching your startup",
    icon: Book,
    type: "Guide",
    downloadUrl: "#",
  },
  {
    title: "Market Research Templates",
    description: "Ready-to-use templates for market analysis",
    icon: FileText,
    type: "Template",
    downloadUrl: "#",
  },
  {
    title: "Founder Interviews",
    description: "Learn from successful entrepreneurs",
    icon: Video,
    type: "Video Series",
    downloadUrl: "#",
  },
  {
    title: "Community Workshops",
    description: "Weekly online sessions with experts",
    icon: Users,
    type: "Live Sessions",
    downloadUrl: "#",
  },
];

const ResourceLibrary = () => {
  const { toast } = useToast();
  const navigate = useNavigate();

  const handleResourceClick = (resource: typeof resources[0]) => {
    // Navigate to the appropriate resource page
    if (resource.title === "Startup Playbook") {
      navigate("/business-plan");
    } else if (resource.title === "Market Research Templates") {
      navigate("/market-research/competitor-analysis");
    } else {
      toast({
        title: "Resource Available",
        description: `${resource.title} - Check our main features for this content.`,
      });
    }
  };

  return (
    <section className="py-20 bg-background">
      <div className="container mx-auto px-4">
        <h2 className="text-3xl md:text-4xl font-bold text-center mb-4">
          Resource Library
        </h2>
        <p className="text-muted-foreground text-center mb-12 max-w-2xl mx-auto">
          Access our curated collection of startup resources, templates, and guides
        </p>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {resources.map((resource, index) => (
            <Card 
              key={index} 
              className="hover:shadow-lg transition-shadow animate-fade-in"
              style={{ animationDelay: `${index * 100}ms` }}
            >
              <CardHeader>
                <resource.icon className="w-12 h-12 text-primary mb-4" />
                <CardTitle className="flex items-center gap-2">
                  {resource.title}
                </CardTitle>
                <CardDescription>{resource.description}</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">
                    {resource.type}
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex items-center gap-2"
                    onClick={() => handleResourceClick(resource)}
                  >
                    <Download className="w-4 h-4" />
                    Access
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="mt-12 text-center">
          <Button
            variant="outline"
            size="lg"
            className="flex items-center gap-2 mx-auto"
            onClick={() => navigate("/dashboard")}
          >
            <ExternalLink className="w-4 h-4" />
            View All Resources
          </Button>
        </div>
      </div>
    </section>
  );
};

export default ResourceLibrary;