import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Brain, Rocket, Users, ChartBar } from "lucide-react";

const features = [
  {
    title: "AI-Powered Guidance",
    description: "Get personalized advice and insights from our advanced AI assistant.",
    icon: Brain,
  },
  {
    title: "Market Validation",
    description: "Validate your ideas with automated market research and analysis.",
    icon: ChartBar,
  },
  {
    title: "Community Support",
    description: "Connect with fellow entrepreneurs and share experiences.",
    icon: Users,
  },
  {
    title: "Launch Faster",
    description: "Build and launch your MVP with our no-code tools and templates.",
    icon: Rocket,
  },
];

const Features = () => {
  return (
    <section className="py-20 bg-secondary/50">
      <div className="container mx-auto px-4">
        <h2 className="text-3xl md:text-4xl font-bold text-center mb-12">
          Everything You Need to Succeed
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {features.map((feature, index) => (
            <Card key={index} className="bg-card hover:shadow-lg transition-shadow">
              <CardHeader>
                <feature.icon className="w-12 h-12 text-primary mb-4" />
                <CardTitle>{feature.title}</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">{feature.description}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Features;