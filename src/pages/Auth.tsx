import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Eye, EyeOff, Mail, Lock, User, Loader2, Car, Users, Shield, Sparkles } from "lucide-react";
import { z } from "zod";
import { useAuth } from "@/contexts/AuthContext";
import { lovable } from "@/integrations/lovable";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import AuthHero from "@/components/auth/AuthHero";
import CampusPicker from "@/components/auth/CampusPicker";

const emailSchema = z.string().email("Please enter a valid email address");
const passwordSchema = z.string().min(6, "Password must be at least 6 characters");
const nameSchema = z.string().min(2, "Name must be at least 2 characters").max(100, "Name is too long");
const campusSchema = z.string().min(1, "Please select your campus");

const LAST_CAMPUS_KEY = "campus_one:last_campus_id";

const Auth = () => {
  const navigate = useNavigate();
  const { user, signIn, signUp } = useAuth();
  const { toast } = useToast();

  const [isLogin, setIsLogin] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [campusId, setCampusId] = useState("");

  const [errors, setErrors] = useState<{
    email?: string;
    password?: string;
    fullName?: string;
    campusId?: string;
  }>({});

  useEffect(() => {
    const saved = localStorage.getItem(LAST_CAMPUS_KEY);
    if (saved) setCampusId(saved);
  }, []);

  // Redirect if already logged in
  useEffect(() => {
    if (user) {
      navigate("/home");
    }
  }, [user, navigate]);

  const validateForm = () => {
    const newErrors: typeof errors = {};

    const emailResult = emailSchema.safeParse(email);
    if (!emailResult.success) {
      newErrors.email = emailResult.error.errors[0].message;
    }

    const passwordResult = passwordSchema.safeParse(password);
    if (!passwordResult.success) {
      newErrors.password = passwordResult.error.errors[0].message;
    }

    if (!isLogin) {
      const nameResult = nameSchema.safeParse(fullName);
      if (!nameResult.success) {
        newErrors.fullName = nameResult.error.errors[0].message;
      }

      const campusResult = campusSchema.safeParse(campusId);
      if (!campusResult.success) {
        newErrors.campusId = campusResult.error.errors[0].message;
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const applyCampusToProfile = async (selectedCampusId: string) => {
    if (!selectedCampusId) return;

    // Persist for the next person/session on this device.
    localStorage.setItem(LAST_CAMPUS_KEY, selectedCampusId);

    // If the user is authenticated, store it in their profile for campus-scoped features.
    const { data, error } = await supabase.auth.getUser();
    if (error) {
      console.warn("Could not read current user for campus update:", error);
      return;
    }

    const userId = data.user?.id;
    if (!userId) return;

    const { error: updateError } = await supabase
      .from("profiles")
      .update({ campus_id: selectedCampusId })
      .eq("user_id", userId);

    if (updateError) {
      console.warn("Could not update profile campus:", updateError);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) return;

    setLoading(true);

    try {
      if (isLogin) {
        const { error } = await signIn(email, password);
        if (error) {
          if (error.message.includes("Invalid login credentials")) {
            toast({
              variant: "destructive",
              title: "Login failed",
              description: "Invalid email or password. Please try again.",
            });
          } else {
            toast({
              variant: "destructive",
              title: "Login failed",
              description: error.message,
            });
          }
        } else {
          // If the user picked a campus here, save it and apply it to the profile.
          // (Helpful for users whose profile campus is still empty.)
          await applyCampusToProfile(campusId);
          toast({
            title: "Welcome back! 👋",
            description: "You've successfully signed in.",
          });
          navigate("/home");
        }
      } else {
        const { error } = await signUp(email, password, fullName);
        if (error) {
          if (error.message.includes("already registered")) {
            toast({
              variant: "destructive",
              title: "Account exists",
              description: "This email is already registered. Try logging in instead.",
            });
          } else {
            toast({
              variant: "destructive",
              title: "Sign up failed",
              description: error.message,
            });
          }
        } else {
          // Save the campus immediately; once the session exists, also persist it to the profile.
          await applyCampusToProfile(campusId);
          toast({
            title: "Welcome to Campus ONE! 🎉",
            description: "Your account has been created successfully.",
          });
          navigate("/home");
        }
      }
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setGoogleLoading(true);
    try {
      const result = await lovable.auth.signInWithOAuth("google", {
        redirect_uri: window.location.origin,
      });

      if (result.redirected) return; // browser will navigate
      if (result.error) {
        toast({
          variant: "destructive",
          title: "Google sign-in failed",
          description: result.error.message,
        });
      }
    } finally {
      setGoogleLoading(false);
    }
  };

  const features = [
    { icon: Car, text: "Share rides & save money" },
    { icon: Users, text: "Connect with campus community" },
    { icon: Shield, text: "Verified student profiles" },
    { icon: Sparkles, text: "Smart ride matching" },
  ];

  return (
    <div className="min-h-screen flex">
      {/* Left Side - Login Form */}
      <div className="w-full lg:w-1/2 flex flex-col justify-center px-8 md:px-16 lg:px-20 py-12 bg-background">
        <div className="max-w-md mx-auto w-full animate-fade-in">
          {/* Logo */}
          <div className="flex items-center gap-3 mb-12">
            <div className="w-12 h-12 rounded-xl gradient-primary flex items-center justify-center shadow-glow">
              <Car className="w-6 h-6 text-primary-foreground" />
            </div>
            <span className="text-2xl font-extrabold tracking-tight text-foreground">Campus ONE</span>
          </div>

          {/* Heading */}
          <div className="mb-8">
            <h1 className="text-3xl md:text-5xl font-extrabold tracking-tight text-foreground mb-2">
              {isLogin ? "Welcome Back!" : "Join Us Today"}
            </h1>
            <p className="text-muted-foreground text-lg font-medium">
              {isLogin
                ? "Sign in to continue your journey"
                : "Create an account to get started"}
            </p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Campus (asked on both; required for signup) */}
            <CampusPicker
              value={campusId}
              onChange={(val) => {
                setCampusId(val);
                if (val) localStorage.setItem(LAST_CAMPUS_KEY, val);
              }}
              required={!isLogin}
              error={!isLogin ? errors.campusId : undefined}
              hint={isLogin ? "Optional on sign-in — helps enable campus features immediately." : undefined}
            />

            {/* Full Name (signup only) */}
            {!isLogin && (
              <div className="space-y-2">
                <Label htmlFor="fullName" className="text-foreground font-medium">Full Name</Label>
                <div className="relative">
                  <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                  <Input
                    id="fullName"
                    type="text"
                    placeholder="Enter your full name"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    className={`h-14 pl-12 text-base rounded-xl border-2 bg-secondary/50 transition-all focus:bg-background focus:border-primary ${errors.fullName ? "border-destructive" : "border-border"}`}
                  />
                </div>
                {errors.fullName && (
                  <p className="text-sm text-destructive">{errors.fullName}</p>
                )}
              </div>
            )}

            {/* Email */}
            <div className="space-y-2">
              <Label htmlFor="email" className="text-foreground font-medium">Email Address</Label>
              <div className="relative">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                <Input
                  id="email"
                  type="email"
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className={`h-14 pl-12 text-base rounded-xl border-2 bg-secondary/50 transition-all focus:bg-background focus:border-primary ${errors.email ? "border-destructive" : "border-border"}`}
                />
              </div>
              {errors.email && (
                <p className="text-sm text-destructive">{errors.email}</p>
              )}
            </div>

            {/* Password */}
            <div className="space-y-2">
              <Label htmlFor="password" className="text-foreground font-medium">Password</Label>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className={`h-14 pl-12 pr-12 text-base rounded-xl border-2 bg-secondary/50 transition-all focus:bg-background focus:border-primary ${errors.password ? "border-destructive" : "border-border"}`}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
              {errors.password && (
                <p className="text-sm text-destructive">{errors.password}</p>
              )}
            </div>

            {/* Submit Button */}
            <Button
              type="submit"
              className="w-full h-14 text-lg font-semibold gradient-primary text-primary-foreground rounded-xl shadow-glow hover:shadow-glow-lg transition-all duration-300"
              disabled={loading}
            >
              {loading ? (
                <>
                  <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                  {isLogin ? "Signing in..." : "Creating account..."}
                </>
              ) : (
                <>{isLogin ? "Sign In" : "Create Account"}</>
              )}
            </Button>
          </form>

          {/* Divider */}
          <div className="relative my-8">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-border"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-4 bg-background text-muted-foreground">or continue with</span>
            </div>
          </div>

          {/* Social Login */}
          <Button
            type="button"
            variant="outline"
            className="w-full h-14 text-base rounded-xl border-2 hover:bg-secondary/50 transition-all"
            onClick={handleGoogleSignIn}
            disabled={googleLoading}
          >
            {googleLoading ? (
              <>
                <Loader2 className="w-5 h-5 mr-3 animate-spin" />
                Connecting to Google...
              </>
            ) : (
              "Continue with Google"
            )}
          </Button>

          {/* Toggle login/signup */}
          <p className="mt-8 text-center text-muted-foreground">
            {isLogin ? "Don't have an account? " : "Already have an account? "}
            <button
              type="button"
              onClick={() => {
                setIsLogin(!isLogin);
                setErrors({});
              }}
              className="font-semibold text-primary hover:underline"
            >
              {isLogin ? "Sign up for free" : "Sign in"}
            </button>
          </p>
        </div>
      </div>

      {/* Right Side - Theme-aware Video Hero */}
      <AuthHero />
    </div>
  );
};

export default Auth;
