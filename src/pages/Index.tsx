import { Link } from "react-router-dom";
import { ArrowRight, Car, Users, Shield, MapPin, Clock, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import Layout from "@/components/layout/Layout";
import FeatureCards from "@/components/home/FeatureCards";

const Index = () => {
  const benefits = [
    {
      icon: Car,
      title: "Smart Carpooling",
      description: "Find rides going your way with intelligent route matching and time flexibility.",
    },
    {
      icon: Users,
      title: "Campus Community",
      description: "Connect with verified students from your campus. Travel safe with people you can trust.",
    },
    {
      icon: Shield,
      title: "Verified Profiles",
      description: "Every member is verified. See trip history, badges, and ratings before you ride.",
    },
    {
      icon: Clock,
      title: "Real-time Updates",
      description: "Get instant notifications when someone wants to join or when your ride is ready.",
    },
    {
      icon: MapPin,
      title: "Multi-Campus",
      description: "Whether you're commuting across town or to another campus, we've got you covered.",
    },
    {
      icon: Zap,
      title: "Quick Matching",
      description: "Our smart algorithm finds the best matches based on route, time, and preferences.",
    },
  ];

  return (
    <Layout>
      {/* Hero Section */}
      <section className="relative overflow-hidden">
        {/* Background gradient */}
        <div className="absolute inset-0 gradient-hero opacity-10" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-primary/20 via-transparent to-transparent" />
        
        <div className="container mx-auto px-4 py-20 md:py-32 relative">
          <div className="max-w-3xl mx-auto text-center">
            {/* Badge */}
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-secondary text-secondary-foreground text-sm font-medium mb-8 animate-fade-in">
              <span className="w-2 h-2 rounded-full bg-success animate-pulse" />
              Multi-campus carpool network
            </div>

            {/* Main Heading */}
            <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold mb-6 animate-fade-in-up">
              Your Campus,{" "}
              <span className="gradient-text">Connected</span>
            </h1>

            {/* Subheading */}
            <p className="text-lg md:text-xl text-muted-foreground mb-10 max-w-2xl mx-auto animate-fade-in-up" style={{ animationDelay: "0.1s" }}>
              Join thousands of students sharing rides, splitting costs, and making campus life easier. 
              Find your perfect carpool match today.
            </p>

            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 animate-fade-in-up" style={{ animationDelay: "0.2s" }}>
              <Link to="/carpooling?tab=find">
                <Button size="lg" className="gradient-primary text-primary-foreground text-lg px-8 py-6 shadow-glow hover:shadow-glow-lg transition-all duration-300">
                  Find a Ride
                  <ArrowRight className="w-5 h-5 ml-2" />
                </Button>
              </Link>
              <Link to="/carpooling?tab=offer">
                <Button size="lg" variant="outline" className="text-lg px-8 py-6 border-2 hover:bg-secondary transition-all duration-300">
                  Offer a Ride
                </Button>
              </Link>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-3 gap-8 mt-16 max-w-lg mx-auto animate-fade-in-up" style={{ animationDelay: "0.3s" }}>
              <div className="text-center">
                <div className="text-3xl md:text-4xl font-bold gradient-text">500+</div>
                <div className="text-sm text-muted-foreground">Active Riders</div>
              </div>
              <div className="text-center">
                <div className="text-3xl md:text-4xl font-bold gradient-text">15</div>
                <div className="text-sm text-muted-foreground">Campuses</div>
              </div>
              <div className="text-center">
                <div className="text-3xl md:text-4xl font-bold gradient-text">2K+</div>
                <div className="text-sm text-muted-foreground">Trips Shared</div>
              </div>
            </div>
          </div>
        </div>

        {/* Decorative elements */}
        <div className="absolute bottom-0 left-0 w-72 h-72 bg-primary/10 rounded-full blur-3xl -translate-x-1/2 translate-y-1/2" />
        <div className="absolute top-20 right-0 w-96 h-96 bg-accent/10 rounded-full blur-3xl translate-x-1/2" />
      </section>

      {/* Feature Cards Section */}
      <FeatureCards />

      {/* Benefits Section */}
      <section className="py-20 md:py-32 bg-muted/30">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Why Students Love{" "}
              <span className="gradient-text">Campus ONE</span>
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Built by students, for students. Every feature designed to make your campus commute 
              easier, safer, and more fun.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {benefits.map((benefit, index) => (
              <Card 
                key={benefit.title}
                className="group hover:shadow-card-hover transition-all duration-300 border-transparent hover:border-primary/20 animate-fade-in-up"
                style={{ animationDelay: `${index * 0.1}s` }}
              >
                <CardContent className="p-6">
                  <div className="w-12 h-12 rounded-xl gradient-primary flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300">
                    <benefit.icon className="w-6 h-6 text-primary-foreground" />
                  </div>
                  <h3 className="text-lg font-semibold mb-2">{benefit.title}</h3>
                  <p className="text-muted-foreground text-sm">{benefit.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 md:py-32 relative overflow-hidden">
        <div className="absolute inset-0 gradient-hero opacity-5" />
        <div className="container mx-auto px-4 relative">
          <div className="max-w-3xl mx-auto text-center">
            <h2 className="text-3xl md:text-4xl font-bold mb-6">
              Ready to Start Your Journey?
            </h2>
            <p className="text-lg text-muted-foreground mb-10">
              Join the campus carpool revolution. Sign up in seconds and find your first ride today.
            </p>
            <Link to="/auth">
              <Button size="lg" className="gradient-primary text-primary-foreground text-lg px-10 py-6 shadow-glow hover:shadow-glow-lg transition-all duration-300">
                Get Started Free
                <ArrowRight className="w-5 h-5 ml-2" />
              </Button>
            </Link>
          </div>
        </div>
      </section>
    </Layout>
  );
};

export default Index;
