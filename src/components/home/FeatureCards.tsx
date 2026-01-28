import { Link } from "react-router-dom";
import { Car, ShoppingBag, Heart, ArrowRight } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

const features = [
  {
    href: "/carpooling",
    icon: Car,
    title: "Find a Carpool",
    description: "Share rides with fellow students",
    buttonText: "Find Rides",
    pastelBg: "bg-[hsl(210,100%,92%)]",
    iconBg: "bg-[hsl(210,100%,85%)]",
    iconColor: "text-[hsl(210,80%,45%)]",
  },
  {
    href: "/errands",
    icon: ShoppingBag,
    title: "Need an Errand?",
    description: "Get help with tasks and orders",
    buttonText: "Request Help",
    pastelBg: "bg-[hsl(30,100%,92%)]",
    iconBg: "bg-[hsl(30,100%,85%)]",
    iconColor: "text-[hsl(24,100%,45%)]",
  },
  {
    href: "/help",
    icon: Heart,
    title: "Urgent Assistance",
    description: "Get emergency help live instantly",
    buttonText: "Get Help Now",
    pastelBg: "bg-[hsl(0,80%,92%)]",
    iconBg: "bg-[hsl(0,80%,85%)]",
    iconColor: "text-[hsl(0,70%,50%)]",
  },
];

const FeatureCards = () => {
  return (
    <section className="py-12 md:py-16">
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl mx-auto">
          {features.map((feature, index) => (
            <Link 
              key={feature.href} 
              to={feature.href}
              className="group block"
            >
              <Card 
                className="h-full bg-card border-0 shadow-float card-float overflow-hidden rounded-3xl animate-fade-in-up"
                style={{ animationDelay: `${index * 0.15}s` }}
              >
                <CardContent className="p-6 flex flex-col items-center text-center">
                  {/* Pastel Background with Icon */}
                  <div 
                    className={`w-full aspect-[4/3] rounded-2xl ${feature.pastelBg} flex items-center justify-center mb-5 overflow-hidden relative`}
                  >
                    {/* Decorative circles */}
                    <div className="absolute top-2 right-2 w-8 h-8 rounded-full bg-white/40" />
                    <div className="absolute bottom-4 left-4 w-12 h-12 rounded-full bg-white/30" />
                    
                    <div 
                      className={`w-20 h-20 rounded-2xl ${feature.iconBg} flex items-center justify-center group-hover:scale-110 transition-transform duration-500`}
                    >
                      <feature.icon className={`w-10 h-10 ${feature.iconColor}`} strokeWidth={1.5} />
                    </div>
                  </div>

                  {/* Title - Big Typography */}
                  <h3 className="text-xl font-bold mb-2 text-foreground">
                    {feature.title}
                  </h3>

                  {/* Description */}
                  <p className="text-muted-foreground text-sm mb-5">
                    {feature.description}
                  </p>

                  {/* Rounded Button */}
                  <Button 
                    className="w-full rounded-xl h-11 font-semibold text-sm gradient-primary text-primary-foreground shadow-glow group-hover:shadow-glow-lg transition-all duration-300"
                  >
                    {feature.buttonText}
                  </Button>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>

        {/* Stats Section */}
        <div className="flex justify-center gap-8 md:gap-16 mt-12 animate-fade-in-up" style={{ animationDelay: "0.5s" }}>
          <div className="text-center">
            <div className="flex items-baseline gap-1 justify-center">
              <span className="text-4xl md:text-5xl font-bold text-primary">12</span>
            </div>
            <p className="text-sm text-muted-foreground mt-1">Carpools<br/>Today</p>
          </div>
          <div className="text-center">
            <div className="flex items-baseline gap-1 justify-center">
              <span className="text-4xl md:text-5xl font-bold text-primary">8</span>
            </div>
            <p className="text-sm text-muted-foreground mt-1">Errands<br/>In Progress</p>
          </div>
          <div className="text-center">
            <div className="flex items-baseline gap-1 justify-center">
              <span className="text-4xl md:text-5xl font-bold text-primary">2</span>
            </div>
            <p className="text-sm text-muted-foreground mt-1">Active<br/>Emergencies</p>
          </div>
        </div>
      </div>
    </section>
  );
};

export default FeatureCards;
