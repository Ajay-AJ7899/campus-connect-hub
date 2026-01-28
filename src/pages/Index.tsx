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
      {/* Hero Section - Soft Gradient Background */}
      <section className="relative overflow-hidden gradient-hero min-h-[50vh] flex items-center">
        {/* Decorative Elements */}
        <div className="absolute top-10 right-10 w-32 h-32 rounded-full bg-[hsl(30,100%,90%)] opacity-60 animate-float" />
        <div className="absolute bottom-20 left-10 w-24 h-24 rounded-full bg-[hsl(210,100%,90%)] opacity-50 animate-bounce-gentle" style={{ animationDelay: "0.5s" }} />
        <div className="absolute top-1/2 right-1/4 w-16 h-16 rounded-full bg-[hsl(0,80%,92%)] opacity-40 animate-float" style={{ animationDelay: "1s" }} />
        
        <div className="container mx-auto px-4 py-12 md:py-16 relative z-10">
          <div className="max-w-3xl mx-auto text-center">
            {/* Greeting */}
            {profile?.full_name && (
              <div className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-white shadow-float text-sm font-semibold mb-6 animate-fade-in">
                <span className="w-2.5 h-2.5 rounded-full bg-success animate-pulse" />
                <span className="text-foreground">Welcome back, {profile.full_name.split(' ')[0]}! 👋</span>
              </div>
            )}

            {/* Main Heading - Big Typography */}
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-5 text-foreground animate-slide-up leading-tight">
              Smarter Campus Life,{" "}
              <span className="gradient-text">Safer Together</span>
            </h1>

            {/* Subheading */}
            <p 
              className="text-lg md:text-xl text-muted-foreground mb-8 max-w-xl mx-auto animate-slide-up leading-relaxed"
              style={{ animationDelay: "0.15s" }}
            >
              Travel, errands, and emergency help — all in one place.
            </p>
          </div>
        </div>
      </section>

      {/* Feature Cards Section */}
      <FeatureCards />

      {/* Benefits Section */}
      <section className="py-16 md:py-20 bg-background">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <span className="inline-block px-5 py-2 rounded-full bg-secondary text-secondary-foreground text-sm font-semibold mb-4">
              Why Campus ONE?
            </span>
            <h2 className="text-3xl md:text-4xl font-bold mb-4 text-foreground">
              Built for Students, By Students
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Every feature designed to make your campus commute easier, safer, and more affordable.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 max-w-5xl mx-auto">
            {benefits.map((benefit, index) => (
              <Card 
                key={benefit.title} 
                className="group bg-card border-0 shadow-float card-float rounded-2xl animate-fade-in-up"
                style={{ animationDelay: `${index * 0.1}s` }}
              >
                <CardContent className="p-6">
                  <div className="w-14 h-14 rounded-2xl bg-secondary flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300">
                    <benefit.icon className="w-7 h-7 text-primary" strokeWidth={1.5} />
                  </div>
                  <h3 className="text-lg font-bold mb-2 text-foreground">{benefit.title}</h3>
                  <p className="text-muted-foreground text-sm leading-relaxed">{benefit.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 md:py-20 bg-secondary/50">
        <div className="container mx-auto px-4">
          <div className="max-w-2xl mx-auto text-center">
            <div className="inline-flex items-center gap-2 px-5 py-2 rounded-full bg-white shadow-float text-sm font-semibold mb-6">
              <Sparkles className="w-4 h-4 text-primary" />
              <span className="text-foreground">Ready to ride?</span>
            </div>
            <h2 className="text-3xl md:text-4xl font-bold mb-5 text-foreground">
              Start Your Journey Today
            </h2>
            <p className="text-lg text-muted-foreground mb-8">
              Find your first ride in seconds. No hassle, just hop in and go.
            </p>
            <Link to="/carpooling">
              <Button 
                size="lg" 
                className="gradient-primary text-primary-foreground text-lg px-10 py-6 rounded-2xl shadow-glow hover:shadow-glow-lg transition-all duration-300 font-semibold"
              >
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
