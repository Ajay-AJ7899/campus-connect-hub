import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { format, parseISO } from "date-fns";
import { MapPin, Calendar, Clock, Users, Car, Bus, Footprints, Search, Filter, Plus, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useCampuses } from "@/hooks/useCampuses";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

interface TravelPost {
  id: string;
  from_location: string;
  to_location: string;
  departure_date: string;
  departure_time: string;
  transport_mode: string;
  total_seats: number;
  available_seats: number;
  notes: string | null;
  campus_id: string | null;
  driver: {
    id: string;
    full_name: string | null;
    avatar_url: string | null;
    is_verified: boolean;
    trips_completed: number;
  };
}

const transportIcons = {
  car: Car,
  bus: Bus,
  walk: Footprints,
};

interface FindRidesProps {
  onOfferRide?: () => void;
}

const FindRides = ({ onOfferRide }: FindRidesProps) => {
  const { user, profile } = useAuth();
  const { campuses } = useCampuses();
  const { toast } = useToast();
  const navigate = useNavigate();

  const [rides, setRides] = useState<TravelPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchFrom, setSearchFrom] = useState("");
  const [searchTo, setSearchTo] = useState("");
  const [campusFilter, setCampusFilter] = useState<string>("all");
  const [requestingId, setRequestingId] = useState<string | null>(null);

  useEffect(() => {
    fetchRides();
  }, []);

  const fetchRides = async () => {
    try {
      const { data, error } = await supabase
        .from("travel_posts")
        .select(`
          *,
          driver:profiles!travel_posts_driver_id_fkey (
            id,
            full_name,
            avatar_url,
            is_verified,
            trips_completed
          )
        `)
        .eq("status", "active")
        .gte("departure_date", format(new Date(), "yyyy-MM-dd"))
        .order("departure_date", { ascending: true })
        .order("departure_time", { ascending: true });

      if (error) throw error;
      setRides(data || []);
    } catch (err) {
      console.error("Error fetching rides:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleRequestToJoin = async (postId: string) => {
    if (!user || !profile) {
      toast({
        variant: "destructive",
        title: "Sign in required",
        description: "Please sign in to request to join a ride.",
      });
      navigate("/auth");
      return;
    }

    setRequestingId(postId);

    try {
      const { error } = await supabase.from("carpool_requests").insert({
        travel_post_id: postId,
        passenger_id: profile.id,
      });

      if (error) {
        if (error.code === "23505") {
          toast({
            variant: "destructive",
            title: "Already requested",
            description: "You've already requested to join this ride.",
          });
        } else {
          throw error;
        }
      } else {
        toast({
          title: "Request sent! 🎉",
          description: "The driver will be notified of your request.",
        });
      }
    } catch (err) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to send request. Please try again.",
      });
    } finally {
      setRequestingId(null);
    }
  };

  const filteredRides = rides.filter((ride) => {
    const matchesFrom = !searchFrom || 
      ride.from_location.toLowerCase().includes(searchFrom.toLowerCase());
    const matchesTo = !searchTo || 
      ride.to_location.toLowerCase().includes(searchTo.toLowerCase());
    const matchesCampus = campusFilter === "all" || ride.campus_id === campusFilter;
    
    return matchesFrom && matchesTo && matchesCampus;
  });

  const getInitials = (name: string | null) => {
    if (!name) return "U";
    return name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2);
  };

  return (
    <div>
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div>
          <h2 className="text-2xl font-bold mb-2">Find a Ride</h2>
          <p className="text-muted-foreground">
            Browse available rides and request to join one that matches your route.
          </p>
        </div>
        {user && onOfferRide && (
          <Button className="gradient-primary text-primary-foreground" onClick={onOfferRide}>
            <Plus className="w-4 h-4 mr-2" />
            Offer a Ride
          </Button>
        )}
      </div>

      {/* Filters */}
      <Card className="mb-8 shadow-card">
        <CardContent className="p-4">
          <div className="grid gap-4 md:grid-cols-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="From..."
                className="pl-10"
                value={searchFrom}
                onChange={(e) => setSearchFrom(e.target.value)}
              />
            </div>
            <div className="relative">
              <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="To..."
                className="pl-10"
                value={searchTo}
                onChange={(e) => setSearchTo(e.target.value)}
              />
            </div>
            <Select value={campusFilter} onValueChange={setCampusFilter}>
              <SelectTrigger>
                <Filter className="w-4 h-4 mr-2" />
                <SelectValue placeholder="Filter by campus" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Campuses</SelectItem>
                {campuses.map((campus) => (
                  <SelectItem key={campus.id} value={campus.id}>
                    {campus.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button 
              variant="outline" 
              onClick={() => {
                setSearchFrom("");
                setSearchTo("");
                setCampusFilter("all");
              }}
            >
              Clear Filters
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Rides Grid */}
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      ) : filteredRides.length === 0 ? (
        <div className="text-center py-20">
          <div className="w-20 h-20 rounded-full bg-muted flex items-center justify-center mx-auto mb-4">
            <Car className="w-10 h-10 text-muted-foreground" />
          </div>
          <h3 className="text-xl font-semibold mb-2">No rides found</h3>
          <p className="text-muted-foreground mb-6">
            {searchFrom || searchTo || campusFilter !== "all"
              ? "Try adjusting your filters to find more rides."
              : "Be the first to offer a ride!"}
          </p>
          {user && onOfferRide && (
            <Button className="gradient-primary text-primary-foreground" onClick={onOfferRide}>
              <Plus className="w-4 h-4 mr-2" />
              Offer a Ride
            </Button>
          )}
        </div>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {filteredRides.map((ride) => {
            const TransportIcon = transportIcons[ride.transport_mode as keyof typeof transportIcons] || Car;
            const isOwnRide = profile?.id === ride.driver.id;

            return (
              <Card key={ride.id} className="group hover:shadow-card-hover transition-all duration-300 overflow-hidden">
                <CardContent className="p-6">
                  {/* Route */}
                  <div className="flex items-start gap-3 mb-4">
                    <div className="flex flex-col items-center">
                      <div className="w-3 h-3 rounded-full bg-primary" />
                      <div className="w-0.5 h-12 bg-gradient-to-b from-primary to-accent" />
                      <div className="w-3 h-3 rounded-full bg-accent" />
                    </div>
                    <div className="flex-1 space-y-4">
                      <div>
                        <p className="font-medium">{ride.from_location}</p>
                      </div>
                      <div>
                        <p className="font-medium">{ride.to_location}</p>
                      </div>
                    </div>
                  </div>

                  {/* Details */}
                  <div className="flex flex-wrap gap-2 mb-4">
                    <Badge variant="secondary" className="flex items-center gap-1">
                      <Calendar className="w-3 h-3" />
                      {format(parseISO(ride.departure_date), "MMM d")}
                    </Badge>
                    <Badge variant="secondary" className="flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {ride.departure_time.slice(0, 5)}
                    </Badge>
                    <Badge variant="secondary" className="flex items-center gap-1">
                      <TransportIcon className="w-3 h-3" />
                      {ride.transport_mode}
                    </Badge>
                    <Badge 
                      variant={ride.available_seats > 0 ? "default" : "destructive"}
                      className="flex items-center gap-1"
                    >
                      <Users className="w-3 h-3" />
                      {ride.available_seats} {ride.available_seats === 1 ? "seat" : "seats"} left
                    </Badge>
                  </div>

                  {/* Notes */}
                  {ride.notes && (
                    <p className="text-sm text-muted-foreground mb-4 line-clamp-2">
                      {ride.notes}
                    </p>
                  )}

                  {/* Driver */}
                  <div className="flex items-center gap-3 pt-4 border-t border-border">
                    <Avatar>
                      <AvatarImage src={ride.driver.avatar_url || undefined} />
                      <AvatarFallback className="bg-primary text-primary-foreground">
                        {getInitials(ride.driver.full_name)}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="font-medium truncate">{ride.driver.full_name || "User"}</p>
                        {ride.driver.is_verified && (
                          <Badge variant="secondary" className="text-xs bg-success/10 text-success">
                            ✓ Verified
                          </Badge>
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground">
                        {ride.driver.trips_completed} trips completed
                      </p>
                    </div>
                  </div>
                </CardContent>
                <CardFooter className="p-4 pt-0">
                  <Button
                    className={cn(
                      "w-full",
                      isOwnRide 
                        ? "bg-muted text-muted-foreground cursor-not-allowed" 
                        : "gradient-primary text-primary-foreground"
                    )}
                    disabled={isOwnRide || ride.available_seats === 0 || requestingId === ride.id}
                    onClick={() => handleRequestToJoin(ride.id)}
                  >
                    {requestingId === ride.id ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Requesting...
                      </>
                    ) : isOwnRide ? (
                      "Your Ride"
                    ) : ride.available_seats === 0 ? (
                      "Full"
                    ) : (
                      "Request to Join"
                    )}
                  </Button>
                </CardFooter>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default FindRides;
