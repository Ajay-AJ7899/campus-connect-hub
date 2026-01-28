import { Link } from "react-router-dom";
import { Car, ShoppingBag, Shield, ArrowRight } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

const features = [
  {
    href: "/carpooling",
    icon: Car,
    title: "Carpooling",
    description: "Share rides with fellow students and split costs on your commute.",
    gradient: "from-primary to-accent",
    bgColor: "bg-primary/10",
    iconColor: "text-primary",
  },
  {
    href: "/errands",
    icon: ShoppingBag,
    title: "Errands & Orders",
    description: "Get help with tasks, deliveries, and join group food orders.",
    gradient: "from-success to-emerald-400",
    bgColor: "bg-success/10",
    iconColor: "text-success",
  },
  {
    href: "/help",
    icon: Shield,
    title: "Urgent Help",
    description: "Report emergencies and get quick assistance from your community.",
    gradient: "from-destructive to-rose-400",
    bgColor: "bg-destructive/10",
    iconColor: "text-destructive",
  },
];

const FeatureCards = () => {
  return (
    <section className="py-16 md:py-24 bg-muted/30">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12">
          <span className="inline-block px-4 py-1.5 rounded-full bg-primary/10 text-primary text-sm font-semibold mb-4">
            Quick Access
          </span>
          <h2 className="text-3xl md:text-4xl font-bold mb-4 text-foreground">
            Everything You Need
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            All your campus essentials in one place. Tap to explore.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl mx-auto">
          {features.map((feature, index) => (
            <Link 
              key={feature.href} 
              to={feature.href}
              className="group block"
            >
              <Card 
                className="h-full border-2 border-transparent hover:border-primary/30 bg-card transition-all duration-300 hover:shadow-xl hover:shadow-primary/10 hover:-translate-y-2 overflow-hidden animate-fade-in-up"
                style={{ animationDelay: `${index * 0.1}s` }}
              >
                <CardContent className="p-8 flex flex-col items-center text-center">
                  {/* Icon */}
                  <div 
                    className={`w-20 h-20 rounded-2xl ${feature.bgColor} flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300`}
                  >
                    <feature.icon className={`w-10 h-10 ${feature.iconColor}`} />
                  </div>

                  {/* Title */}
                  <h3 className="text-xl font-bold mb-3 text-foreground group-hover:text-primary transition-colors">
                    {feature.title}
                  </h3>

                  {/* Description */}
                  <p className="text-muted-foreground mb-6">
                    {feature.description}
                  </p>

                  {/* Arrow */}
                  <div className="flex items-center gap-2 text-primary font-semibold opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                    <span>Explore</span>
                    <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
};

export default FeatureCards;
