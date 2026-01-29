import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { Menu, X, Bell, User, Car, ShoppingBag, Shield, LogOut, Plus, ChevronDown, MapPin, Users, AlertTriangle, ClipboardList, Moon, Sun } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useTheme } from "next-themes";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  NavigationMenu,
  NavigationMenuContent,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  NavigationMenuTrigger,
} from "@/components/ui/navigation-menu";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { cn } from "@/lib/utils";
import { useAuth } from "@/contexts/AuthContext";
import NotificationsMenu from "@/components/notifications/NotificationsMenu";
import { useIsAdmin } from "@/hooks/useIsAdmin";
import logo from "@/assets/logo.png";

const navItems = [
  {
    label: "Carpooling",
    href: "/carpooling",
    icon: Car,
    gradient: "from-primary to-primary/80",
    items: [
      { label: "Find Rides", href: "/carpooling?tab=find", icon: Car, description: "Browse available rides" },
      { label: "Offer a Ride", href: "/carpooling?tab=offer", icon: Plus, description: "Share your journey" },
      { label: "My Trips", href: "/carpooling?tab=trips", icon: MapPin, description: "Manage your rides" },
    ],
  },
  {
    label: "Errands",
    href: "/errands",
    icon: ShoppingBag,
    gradient: "from-orange-500 to-amber-500",
    items: [
      { label: "Browse Errands", href: "/errands?tab=browse", icon: ShoppingBag, description: "Help others with tasks" },
      { label: "Post Errand", href: "/errands?tab=post", icon: Plus, description: "Request help" },
      { label: "Group Orders", href: "/errands?tab=orders", icon: Users, description: "Join food orders" },
      { label: "My Requests", href: "/errands?tab=my-requests", icon: ClipboardList, description: "Track your errands" },
    ],
  },
  {
    label: "Help",
    href: "/help",
    icon: Shield,
    gradient: "from-red-500 to-rose-500",
    items: [
      { label: "Report Emergency", href: "/help?tab=report", icon: AlertTriangle, description: "Get urgent help" },
      { label: "Active Tickets", href: "/help?tab=active", icon: Bell, description: "Community requests" },
      { label: "My Requests", href: "/help?tab=my-requests", icon: ClipboardList, description: "Your submitted tickets" },
    ],
  },
];

const Navbar = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [openMobileSection, setOpenMobileSection] = useState<string | null>(null);
  const location = useLocation();
  const navigate = useNavigate();
  const { theme, setTheme } = useTheme();
  const { user, profile, signOut } = useAuth();
  const { data: isAdmin } = useIsAdmin(Boolean(user));

  const isActive = (path: string) => location.pathname.startsWith(path.split("?")[0]);

  const handleSignOut = async () => {
    await signOut();
    navigate("/");
  };

  const getInitials = (name: string | null | undefined) => {
    if (!name) return "U";
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <nav className="sticky top-0 z-50 glass border-b border-border/50">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link to="/home" className="flex items-center gap-2">
            <div className="w-10 h-10 rounded-xl gradient-primary flex items-center justify-center shadow-glow-sm">
              <img
                src={logo}
                alt="Campus ONE logo"
                className="h-6 w-6 object-contain contrast-125"
              />
            </div>
            <span className="text-xl font-bold gradient-text hidden sm:block">
              Campus ONE
            </span>
          </Link>

          {/* Desktop Navigation */}
          <NavigationMenu className="hidden md:flex">
            <NavigationMenuList>
              {navItems.map((item) => (
                <NavigationMenuItem key={item.label}>
                  <NavigationMenuTrigger 
                    className={cn(
                      "bg-transparent",
                      isActive(item.href) && "text-primary"
                    )}
                  >
                    <item.icon className="w-4 h-4 mr-2" />
                    {item.label}
                  </NavigationMenuTrigger>
                  <NavigationMenuContent>
                    <ul className="grid w-[320px] gap-2 p-4 bg-background">
                      {item.items.map((subItem) => (
                        <li key={subItem.href}>
                          <NavigationMenuLink asChild>
                            <Link
                              to={subItem.href}
                              className="flex items-start gap-3 p-3 rounded-lg hover:bg-muted transition-colors"
                            >
                              <div className={cn(
                                "w-8 h-8 rounded-lg bg-gradient-to-br flex items-center justify-center shrink-0",
                                item.gradient
                              )}>
                                <subItem.icon className="w-4 h-4 text-white" />
                              </div>
                              <div>
                                <div className="font-medium text-sm">{subItem.label}</div>
                                <div className="text-xs text-muted-foreground">{subItem.description}</div>
                              </div>
                            </Link>
                          </NavigationMenuLink>
                        </li>
                      ))}
                    </ul>
                  </NavigationMenuContent>
                </NavigationMenuItem>
              ))}
            </NavigationMenuList>
          </NavigationMenu>

          {/* Right Side Actions */}
          <div className="flex items-center gap-2">
            {/* Theme Toggle */}
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
              aria-label="Toggle theme"
            >
              <Sun className="w-5 h-5 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
              <Moon className="absolute w-5 h-5 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
            </Button>

            {user ? (
              <>
                {/* Notifications */}
                <NotificationsMenu />

                {/* Profile Dropdown */}
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" className="relative">
                      <Avatar className="w-8 h-8">
                        <AvatarImage src={profile?.avatar_url || undefined} />
                        <AvatarFallback className="bg-primary text-primary-foreground text-xs">
                          {getInitials(profile?.full_name)}
                        </AvatarFallback>
                      </Avatar>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-56 bg-background">
                    <div className="px-2 py-1.5">
                      <p className="font-medium">{profile?.full_name || "User"}</p>
                      <p className="text-sm text-muted-foreground">{user.email}</p>
                    </div>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem asChild>
                      <Link to="/profile" className="cursor-pointer">
                        <User className="w-4 h-4 mr-2" />
                        Profile
                      </Link>
                    </DropdownMenuItem>

                    {isAdmin && (
                      <DropdownMenuItem asChild>
                        <Link to="/admin" className="cursor-pointer">
                          <Shield className="w-4 h-4 mr-2" />
                          Admin
                        </Link>
                      </DropdownMenuItem>
                    )}
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={handleSignOut} className="cursor-pointer text-destructive">
                      <LogOut className="w-4 h-4 mr-2" />
                      Sign Out
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </>
            ) : (
              <Link to="/auth">
                <Button className="gradient-primary text-primary-foreground hover:opacity-90 transition-opacity">
                  <User className="w-4 h-4 mr-2" />
                  Sign In
                </Button>
              </Link>
            )}

            {/* Mobile Menu Toggle */}
            <Button
              variant="ghost"
              size="icon"
              className="md:hidden"
              onClick={() => setIsOpen(!isOpen)}
            >
              {isOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </Button>
          </div>
        </div>

        {/* Mobile Navigation */}
        {isOpen && (
          <div className="md:hidden py-4 border-t border-border/50 animate-fade-in">
            <div className="flex flex-col gap-2">
              {navItems.map((item) => (
                <Collapsible 
                  key={item.label}
                  open={openMobileSection === item.label}
                  onOpenChange={(open) => setOpenMobileSection(open ? item.label : null)}
                >
                  <CollapsibleTrigger className={cn(
                    "flex items-center justify-between w-full px-4 py-3 rounded-lg text-sm font-medium transition-all duration-200",
                    isActive(item.href)
                      ? "bg-primary/10 text-primary"
                      : "text-muted-foreground hover:text-foreground hover:bg-muted"
                  )}>
                    <div className="flex items-center gap-3">
                      <item.icon className="w-5 h-5" />
                      {item.label}
                    </div>
                    <ChevronDown className={cn(
                      "w-4 h-4 transition-transform duration-200",
                      openMobileSection === item.label && "rotate-180"
                    )} />
                  </CollapsibleTrigger>
                  <CollapsibleContent className="pl-8 pr-4 py-2 space-y-1">
                    {item.items.map((subItem) => (
                      <Link
                        key={subItem.href}
                        to={subItem.href}
                        onClick={() => setIsOpen(false)}
                        className="flex items-center gap-3 px-4 py-2 rounded-lg text-sm text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
                      >
                        <subItem.icon className="w-4 h-4" />
                        {subItem.label}
                      </Link>
                    ))}
                  </CollapsibleContent>
                </Collapsible>
              ))}
              
            </div>
          </div>
        )}
      </div>
    </nav>
  );
};

export default Navbar;
