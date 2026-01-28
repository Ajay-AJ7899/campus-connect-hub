import { Link } from "react-router-dom";
import { ArrowRight, Car, Users, Clock, MapPin, Sparkles, TrendingUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import Layout from "@/components/layout/Layout";
import FeatureCards from "@/components/home/FeatureCards";
import { useAuth } from "@/contexts/AuthContext";

const Index = () => {
  const { profile } = useAuth();

  const benefits = [
    {
      icon: Car,
      title: "Smart Carpooling",
      description: "Find rides going your way with intelligent route matching.",
    },
    {
      icon: Users,
      title: "Campus Community",
      description: "Connect with verified students from your campus.",
    },
    {
      icon: Clock,
      title: "Real-time Updates",
      description: "Get instant notifications for ride requests and updates.",
    },
    {
      icon: MapPin,
      title: "Multi-Campus",
      description: "Commute across town or to another campus seamlessly.",
    },
    {
      icon: Sparkles,
      title: "Quick Matching",
      description: "Smart algorithm finds the best matches for your route.",
    },
    {
      icon: TrendingUp,
      title: "Save Money",
      description: "Split costs and save up to 60% on your daily commute.",
    },
  ];

  return (
    <Layout>
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-background">
        {/* Decorative elements */}
        <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-primary/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
        <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-warning/5 rounded-full blur-3xl translate-y-1/2 -translate-x-1/2" />
        
        <div className="container mx-auto px-4 py-16 md:py-24 relative">
          <div className="max-w-4xl mx-auto text-center">
            {/* Greeting */}
            {profile?.full_name && (
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary text-sm font-semibold mb-6 animate-fade-in">
                <span className="w-2 h-2 rounded-full bg-success animate-pulse" />
                Welcome back, {profile.full_name.split(' ')[0]}! 👋
              </div>
            )}

            {/* Main Heading */}
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-6 text-foreground animate-fade-in-up">
              Your Campus,{" "}
              <span className="gradient-text">Connected</span>
            </h1>

            {/* Subheading */}
            <p className="text-lg md:text-xl text-muted-foreground mb-10 max-w-2xl mx-auto animate-fade-in-up" style={{ animationDelay: "0.1s" }}>
              Share rides, split costs, and make campus life easier. 
              Find your perfect carpool match in seconds.
            </p>

            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 animate-fade-in-up" style={{ animationDelay: "0.2s" }}>
              <Link to="/carpooling?tab=find">
                <Button size="lg" className="gradient-primary text-primary-foreground text-lg px-8 py-6 rounded-xl shadow-glow hover:shadow-glow-lg transition-all duration-300">
                  Find a Ride
                  <ArrowRight className="w-5 h-5 ml-2" />
                </Button>
              </Link>
              <Link to="/carpooling?tab=offer">
                <Button size="lg" variant="outline" className="text-lg px-8 py-6 rounded-xl border-2 border-primary/30 hover:bg-primary/5 hover:border-primary transition-all duration-300">
                  Offer a Ride
                </Button>
              </Link>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-3 gap-8 mt-16 max-w-md mx-auto animate-fade-in-up" style={{ animationDelay: "0.3s" }}>
              <div className="text-center">
                <div className="text-3xl md:text-4xl font-bold text-primary">500+</div>
                <div className="text-sm text-muted-foreground mt-1">Active Riders</div>
              </div>
              <div className="text-center">
                <div className="text-3xl md:text-4xl font-bold text-primary">15</div>
                <div className="text-sm text-muted-foreground mt-1">Campuses</div>
              </div>
              <div className="text-center">
                <div className="text-3xl md:text-4xl font-bold text-primary">2K+</div>
                <div className="text-sm text-muted-foreground mt-1">Trips Shared</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Feature Cards Section */}
      <FeatureCards />

      {/* Benefits Section */}
      <section className="py-20 md:py-28 bg-background">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <span className="inline-block px-4 py-1.5 rounded-full bg-primary/10 text-primary text-sm font-semibold mb-4">
              Why Campus ONE?
            </span>
            <h2 className="text-3xl md:text-4xl font-bold mb-4 text-foreground">
              Built for Students, By Students
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Every feature designed to make your campus commute easier, safer, and more affordable.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl mx-auto">
            {benefits.map((benefit, index) => (
              <Card 
                key={benefit.title}
                className="group bg-card border border-border/50 hover:border-primary/30 hover:shadow-lg hover:shadow-primary/5 transition-all duration-300 animate-fade-in-up"
                style={{ animationDelay: `${index * 0.1}s` }}
              >
                <CardContent className="p-6">
                  <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mb-4 group-hover:bg-primary/20 transition-colors duration-300">
                    <benefit.icon className="w-6 h-6 text-primary" />
                  </div>
                  <h3 className="text-lg font-semibold mb-2 text-foreground">{benefit.title}</h3>
                  <p className="text-muted-foreground text-sm">{benefit.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 md:py-28 bg-muted/30">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto text-center">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-primary/10 text-primary text-sm font-semibold mb-6">
              <Sparkles className="w-4 h-4" />
              Ready to ride?
            </div>
            <h2 className="text-3xl md:text-4xl font-bold mb-6 text-foreground">
              Start Your Journey Today
            </h2>
            <p className="text-lg text-muted-foreground mb-10">
              Find your first ride in seconds. No hassle, just hop in and go.
            </p>
            <Link to="/carpooling">
              <Button size="lg" className="gradient-primary text-primary-foreground text-lg px-10 py-6 rounded-xl shadow-glow hover:shadow-glow-lg transition-all duration-300">
                Explore Rides
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
