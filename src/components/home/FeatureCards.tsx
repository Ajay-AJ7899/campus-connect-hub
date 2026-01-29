import { Link } from "react-router-dom";
import { Car, Package, Shield } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
const features = [{
  href: "/carpooling",
  icon: Car,
  title: "Find a Carpool",
  description: "Share rides with fellow students",
  buttonText: "Find Rides",
  iconColor: "text-primary",
  borderColor: "border-primary/20",
  hoverBorder: "group-hover:border-primary/40"
}, {
  href: "/errands",
  icon: Package,
  title: "Need an Errand?",
  description: "Get help with tasks and orders",
  buttonText: "Request Help",
  iconColor: "text-primary",
  borderColor: "border-primary/20",
  hoverBorder: "group-hover:border-primary/40"
}, {
  href: "/help",
  icon: Shield,
  title: "Urgent Assistance",
  description: "Get emergency help live instantly",
  buttonText: "Get Help Now",
  iconColor: "text-primary",
  borderColor: "border-primary/20",
  hoverBorder: "group-hover:border-primary/40"
}];
const FeatureCards = () => {
  return <section className="py-12 md:py-16">
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl mx-auto">
          {features.map((feature, index) => <Link key={feature.href} to={feature.href} className="group block">
              <Card className="h-full bg-card border border-border/50 shadow-float card-float overflow-hidden rounded-2xl animate-fade-in-up transition-all duration-300 hover:shadow-float-lg hover:border-primary/30" style={{
            animationDelay: `${index * 0.15}s`
          }}>
                <CardContent className="p-8 flex flex-col items-center text-center">
                  {/* Icon Container - Clean bordered style */}
                  <div className={`w-20 h-20 rounded-2xl bg-card border-2 ${feature.borderColor} ${feature.hoverBorder} flex items-center justify-center mb-6 transition-all duration-300 group-hover:scale-105`}>
                    <feature.icon className={`w-10 h-10 ${feature.iconColor}`} strokeWidth={1.5} />
                  </div>

                  {/* Title */}
                  <h3 className="text-xl font-bold mb-2 text-foreground tracking-tight">
                    {feature.title}
                  </h3>

                  {/* Description */}
                  <p className="text-muted-foreground text-sm mb-6 leading-relaxed">
                    {feature.description}
                  </p>

                  {/* Button */}
                  <Button className="w-full rounded-xl h-12 font-semibold text-sm gradient-primary text-primary-foreground shadow-glow group-hover:shadow-glow-lg transition-all duration-300">
                    {feature.buttonText}
                  </Button>
                </CardContent>
              </Card>
            </Link>)}
        </div>

        {/* Stats Section */}
        
      </div>
    </section>;
};
export default FeatureCards;