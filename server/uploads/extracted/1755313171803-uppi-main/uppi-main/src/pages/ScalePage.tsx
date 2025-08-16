
import Header from "@/components/Header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { LineChart, Users, Settings, Globe, Megaphone, HeadphonesIcon } from "lucide-react";

const ScalePage = () => {
  const tools = [
    {
      title: "Growth Strategy",
      description: "Plan and execute your startup's growth strategy",
      icon: LineChart,
      features: ["Market expansion", "Revenue optimization", "Growth modeling"]
    },
    {
      title: "Team Management",
      description: "Build and manage your growing team effectively",
      icon: Users,
      features: ["Hiring plans", "Team structure", "Role definitions"]
    },
    {
      title: "Process Optimization",
      description: "Streamline and automate your business processes",
      icon: Settings,
      features: ["Workflow automation", "Resource optimization", "Efficiency metrics"]
    },
    {
      title: "Global Expansion",
      description: "Tools and resources for international growth",
      icon: Globe,
      features: ["Market entry", "Localization", "Compliance"]
    },
    {
      title: "Marketing Strategy",
      description: "Develop and optimize your marketing campaigns",
      icon: Megaphone,
      features: ["Campaign planning", "Channel optimization", "ROI tracking"]
    },
    {
      title: "Support Infrastructure",
      description: "Build a scalable customer support system",
      icon: HeadphonesIcon,
      features: ["Support workflows", "Knowledge base", "Customer feedback"]
    }
  ];

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="container mx-auto px-4 py-20">
        <div className="space-y-8">
          <div className="text-center space-y-4">
            <h1 className="text-4xl font-bold tracking-tight">Scale Your Startup</h1>
            <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
              Take your startup to the next level with our comprehensive scaling tools and resources.
            </p>
          </div>

          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {tools.map((tool) => (
              <Card key={tool.title} className="group hover:shadow-lg transition-all cursor-pointer">
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
                  <Button className="mt-4 w-full">Start Scaling</Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </main>
    </div>
  );
};

export default ScalePage;
