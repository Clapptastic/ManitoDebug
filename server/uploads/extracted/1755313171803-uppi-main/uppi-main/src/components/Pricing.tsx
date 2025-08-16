
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Check } from "lucide-react";
import { useNavigate } from "react-router-dom";
import type { SubscriptionTierInfo } from "@/types/subscription";

const plans: SubscriptionTierInfo[] = [
  {
    name: "individual",
    description: "Perfect for independent entrepreneurs",
    monthlyPrice: 0,
    supportLevel: 'email',
    features: [
      "1 team member",
      "2 API keys",
      "5 competitor analyses",
      "100MB storage",
      "Basic market research",
      "Email support (48h response)"
    ],
  },
  {
    name: "pro",
    description: "For growing startups",
    monthlyPrice: 49,
    supportLevel: 'priority',
    features: [
      "5 team members",
      "5 API keys",
      "20 competitor analyses",
      "500MB storage",
      "Advanced market research",
      "Priority support (24h response)",
      "Custom branding"
    ],
  },
  {
    name: "business",
    description: "For established businesses",
    monthlyPrice: 99,
    supportLevel: '24/7_priority',
    features: [
      "20 team members",
      "15 API keys",
      "100 competitor analyses",
      "2GB storage",
      "Full market intelligence",
      "24/7 priority support (4h response)",
      "Custom integrations",
      "Team collaboration tools"
    ],
  },
  {
    name: "enterprise",
    description: "For large organizations",
    monthlyPrice: 499,
    supportLevel: 'dedicated',
    features: [
      "Unlimited team members",
      "Unlimited API keys",
      "Unlimited analyses",
      "Unlimited storage",
      "Custom AI solutions",
      "Dedicated account manager",
      "Custom feature development",
      "SLA guarantees",
      "1h response time guaranteed"
    ],
  },
];

const Pricing = () => {
  const navigate = useNavigate();

  return (
    <section className="py-20 bg-secondary/50">
      <div className="container mx-auto px-4">
        <h2 className="text-3xl md:text-4xl font-bold text-center mb-12">
          Choose Your Plan
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {plans.map((plan) => (
            <Card key={plan.name} className={`bg-card hover:shadow-lg transition-shadow
              ${plan.name === 'business' ? 'border-primary' : ''}`}>
              <CardHeader>
                <CardTitle className="text-2xl capitalize">{plan.name}</CardTitle>
                <div className="mt-4">
                  <span className="text-4xl font-bold">
                    ${plan.monthlyPrice}
                  </span>
                  <span className="text-muted-foreground">/month</span>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground mb-6">{plan.description}</p>
                <ul className="space-y-3 mb-6">
                  {plan.features.map((feature, i) => (
                    <li key={i} className="flex items-center gap-2">
                      <Check className="w-5 h-5 text-primary" />
                      <span>{feature}</span>
                    </li>
                  ))}
                </ul>
                <Button
                  className="w-full"
                  variant={plan.name === 'business' ? "default" : "outline"}
                  onClick={() => navigate("/login")}
                >
                  Get Started
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
        <p className="text-center text-muted-foreground mt-8">
          All plans include access to our core features. Upgrade or downgrade anytime.
        </p>
      </div>
    </section>
  );
};

export default Pricing;
