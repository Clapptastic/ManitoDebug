
import Header from "@/components/Header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Search, Users, ChartBar, Target } from "lucide-react";
import { Link } from "react-router-dom";

const ResearchValidationPage = () => {
  const tools = [
    {
      title: "Market Research",
      description: "Analyze market trends, size, and potential opportunities",
      icon: Search,
      features: ["Competitor analysis", "Market size estimation", "Trend tracking"],
      route: "/market-research"
    },
    {
      title: "Customer Interviews",
      description: "Gather insights directly from potential customers",
      icon: Users,
      features: ["Interview templates", "Response analysis", "Insight generation"],
      route: "/market-research/customer-interviews"
    },
    {
      title: "Data Analytics",
      description: "Track and analyze key metrics for validation",
      icon: ChartBar,
      features: ["Data visualization", "Metric tracking", "Custom reports"],
      route: "/market-research/trend-analysis"
    },
    {
      title: "Validation Framework",
      description: "Structured approach to validate your business ideas",
      icon: Target,
      features: ["Validation checklist", "Progress tracking", "Action items"],
      route: "/market-research/documentation"
    }
  ];

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="container mx-auto px-4 py-20">
        <div className="space-y-8">
          <div className="text-center space-y-4">
            <h1 className="text-4xl font-bold tracking-tight">Research & Validation</h1>
            <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
              Validate your startup idea with comprehensive market research and customer feedback tools.
            </p>
          </div>

          <div className="grid gap-6 md:grid-cols-2">
            {tools.map((tool) => (
              <Card key={tool.title} className="group hover:shadow-lg transition-all">
                <CardHeader>
                  <div className="flex items-center gap-4">
                    <div className="p-2 rounded-lg bg-primary/10">
                      <tool.icon className="w-6 h-6 text-primary" />
                    </div>
                    <CardTitle>{tool.title}</CardTitle>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground mb-4">{tool.description}</p>
                  <ul className="space-y-2">
                    {tool.features.map((feature) => (
                      <li key={feature} className="flex items-center gap-2 text-sm">
                        <div className="w-1.5 h-1.5 rounded-full bg-primary" />
                        {feature}
                      </li>
                    ))}
                  </ul>
                  <Button className="mt-4 w-full" asChild>
                    <Link to={tool.route}>Explore Tools</Link>
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </main>
    </div>
  );
};

export default ResearchValidationPage;
