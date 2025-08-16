
import Header from "@/components/Header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Code2, FileText, PenTool, LayoutGrid } from "lucide-react";

const MvpPage = () => {
  const tools = [
    {
      title: "No-Code Builder",
      description: "Create your MVP without writing any code",
      icon: LayoutGrid,
      features: ["Drag-and-drop interface", "Responsive design", "Pre-built templates"]
    },
    {
      title: "Low-Code Development",
      description: "Extend functionality with minimal coding",
      icon: Code2,
      features: ["API integration", "Custom logic", "Database management"]
    },
    {
      title: "Design Tools",
      description: "Create beautiful user interfaces",
      icon: PenTool,
      features: ["UI/UX design", "Wireframing", "Prototyping"]
    },
    {
      title: "Documentation",
      description: "Generate documentation for your MVP",
      icon: FileText,
      features: ["Technical docs", "User guides", "API reference"]
    }
  ];

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="container mx-auto px-4 py-20">
        <div className="space-y-8">
          <div className="text-center space-y-4">
            <h1 className="text-4xl font-bold tracking-tight">MVP Builder</h1>
            <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
              Build your minimum viable product quickly and efficiently with our suite of tools.
            </p>
          </div>

          <div className="grid gap-6 md:grid-cols-2">
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
                  <Button className="mt-4 w-full">Get Started</Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </main>
    </div>
  );
};

export default MvpPage;
