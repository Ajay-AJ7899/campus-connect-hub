import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { format, parseISO } from "date-fns";
import { MapPin, Calendar, Clock, Users, Car, Bus, Footprints, Plus, Loader2, Check, X, UserMinus } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import Layout from "@/components/layout/Layout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";

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
  status: string;
}

interface CarpoolRequest {
  id: string;
  status: string;
  passenger: {
    id: string;
    full_name: string | null;
    avatar_url: string | null;
    is_verified: boolean;
    trips_completed: number;
  };
}

interface JoinedRide {
  id: string;
  status: string;
  travel_post: TravelPost & {
    driver: {
      id: string;
      full_name: string | null;
      avatar_url: string | null;
    };
  };
}

const transportIcons = {
  car: Car,
  bus: Bus,
  walk: Footprints,
};

const MyTrips = () => {
  const { user, profile } = useAuth();
  const { toast } = useToast();

  const [myRides, setMyRides] = useState<(TravelPost & { requests: CarpoolRequest[] })[]>([]);
  const [joinedRides, setJoinedRides] = useState<JoinedRide[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  useEffect(() => {
    if (profile) {
      fetchMyTrips();
    }
  }, [profile]);

  const fetchMyTrips = async () => {
    if (!profile) return;

    try {
      // Fetch rides I'm driving
      const { data: drivingData, error: drivingError } = await supabase
        .from("travel_posts")
        .select(`
          *,
          requests:carpool_requests (
            id,
            status,
            passenger:profiles!carpool_requests_passenger_id_fkey (
              id,
              full_name,
              avatar_url,
              is_verified,
              trips_completed
            )
          )
        `)
        .eq("driver_id", profile.id)
        .order("departure_date", { ascending: true });

      if (drivingError) throw drivingError;
      setMyRides(drivingData || []);

      // Fetch rides I've joined
      const { data: joinedData, error: joinedError } = await supabase
        .from("carpool_requests")
        .select(`
          id,
          status,
          travel_post:travel_posts (
            *,
            driver:profiles!travel_posts_driver_id_fkey (
              id,
              full_name,
              avatar_url
            )
          )
        `)
        .eq("passenger_id", profile.id)
        .order("created_at", { ascending: false });

      if (joinedError) throw joinedError;
      setJoinedRides(joinedData || []);
    } catch (err) {
      console.error("Error fetching trips:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleRequestAction = async (requestId: string, action: "approved" | "declined") => {
    setActionLoading(requestId);
    try {
      const { error } = await supabase
        .from("carpool_requests")
        .update({ status: action })
        .eq("id", requestId);

      if (error) throw error;

      toast({
        title: action === "approved" ? "Request approved! ✓" : "Request declined",
        description: action === "approved" 
          ? "The passenger has been added to your ride."
          : "The request has been declined.",
      });

      fetchMyTrips();
    } catch (err) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to update request. Please try again.",
      });
    } finally {
      setActionLoading(null);
    }
  };

  const handleLeaveRide = async (requestId: string) => {
    setActionLoading(requestId);
    try {
      const { error } = await supabase
        .from("carpool_requests")
        .update({ status: "cancelled" })
        .eq("id", requestId);

      if (error) throw error;

      toast({
        title: "Left ride",
        description: "You've left this carpool.",
      });

      fetchMyTrips();
    } catch (err) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to leave ride. Please try again.",
      });
    } finally {
      setActionLoading(null);
    }
  };

  const getInitials = (name: string | null) => {
    if (!name) return "U";
    return name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2);
  };

  if (!user) {
    return (
      <Layout>
        <div className="container mx-auto px-4 py-20 text-center">
          <h1 className="text-2xl font-bold mb-4">Sign in to view your trips</h1>
          <Link to="/auth">
            <Button className="gradient-primary text-primary-foreground">Sign In</Button>
          </Link>
        </div>
      </Layout>
    );
  }

  if (loading) {
    return (
      <Layout>
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="container mx-auto px-4 py-8">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-bold mb-2">My Trips</h1>
            <p className="text-muted-foreground">
              Manage your rides and requests
            </p>
          </div>
          <Link to="/create-ride">
            <Button className="gradient-primary text-primary-foreground">
              <Plus className="w-4 h-4 mr-2" />
              Offer a Ride
            </Button>
          </Link>
        </div>

        <Tabs defaultValue="driving" className="space-y-6">
          <TabsList className="grid w-full max-w-md grid-cols-2">
            <TabsTrigger value="driving">Rides I'm Driving ({myRides.length})</TabsTrigger>
            <TabsTrigger value="joined">Rides I've Joined ({joinedRides.length})</TabsTrigger>
          </TabsList>

          {/* Rides I'm Driving */}
          <TabsContent value="driving">
            {myRides.length === 0 ? (
              <div className="text-center py-16">
                <div className="w-20 h-20 rounded-full bg-muted flex items-center justify-center mx-auto mb-4">
                  <Car className="w-10 h-10 text-muted-foreground" />
                </div>
                <h3 className="text-xl font-semibold mb-2">No rides yet</h3>
                <p className="text-muted-foreground mb-6">
                  Start sharing your commute with others!
                </p>
                <Link to="/create-ride">
                  <Button className="gradient-primary text-primary-foreground">
                    <Plus className="w-4 h-4 mr-2" />
                    Offer Your First Ride
                  </Button>
                </Link>
              </div>
            ) : (
              <div className="space-y-6">
                {myRides.map((ride) => {
                  const TransportIcon = transportIcons[ride.transport_mode as keyof typeof transportIcons] || Car;
                  const pendingRequests = ride.requests.filter((r) => r.status === "pending");
                  const approvedPassengers = ride.requests.filter((r) => r.status === "approved");

                  return (
                    <Card key={ride.id} className="shadow-card">
                      <CardHeader>
                        <div className="flex items-start justify-between">
                          <div className="flex items-start gap-3">
                            <div className="flex flex-col items-center">
                              <div className="w-3 h-3 rounded-full bg-primary" />
                              <div className="w-0.5 h-8 bg-gradient-to-b from-primary to-accent" />
                              <div className="w-3 h-3 rounded-full bg-accent" />
                            </div>
                            <div>
                              <p className="font-medium">{ride.from_location}</p>
                              <p className="font-medium mt-4">{ride.to_location}</p>
                            </div>
                          </div>
                          <Badge variant={ride.status === "active" ? "default" : "secondary"}>
                            {ride.status}
                          </Badge>
                        </div>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <div className="flex flex-wrap gap-2">
                          <Badge variant="secondary">
                            <Calendar className="w-3 h-3 mr-1" />
                            {format(parseISO(ride.departure_date), "MMM d, yyyy")}
                          </Badge>
                          <Badge variant="secondary">
                            <Clock className="w-3 h-3 mr-1" />
                            {ride.departure_time.slice(0, 5)}
                          </Badge>
                          <Badge variant="secondary">
                            <TransportIcon className="w-3 h-3 mr-1" />
                            {ride.transport_mode}
                          </Badge>
                          <Badge variant="secondary">
                            <Users className="w-3 h-3 mr-1" />
                            {ride.available_seats}/{ride.total_seats} seats
                          </Badge>
                        </div>

                        {/* Pending Requests */}
                        {pendingRequests.length > 0 && (
                          <div className="space-y-3">
                            <h4 className="font-medium text-sm text-muted-foreground">
                              Pending Requests ({pendingRequests.length})
                            </h4>
                            {pendingRequests.map((request) => (
                              <div
                                key={request.id}
                                className="flex items-center justify-between p-3 rounded-lg bg-secondary/50"
                              >
                                <div className="flex items-center gap-3">
                                  <Avatar>
                                    <AvatarImage src={request.passenger.avatar_url || undefined} />
                                    <AvatarFallback className="bg-primary text-primary-foreground">
                                      {getInitials(request.passenger.full_name)}
                                    </AvatarFallback>
                                  </Avatar>
                                  <div>
                                    <p className="font-medium">{request.passenger.full_name || "User"}</p>
                                    <p className="text-sm text-muted-foreground">
                                      {request.passenger.trips_completed} trips
                                    </p>
                                  </div>
                                </div>
                                <div className="flex gap-2">
                                  <Button
                                    size="sm"
                                    className="bg-success hover:bg-success/90 text-success-foreground"
                                    disabled={actionLoading === request.id}
                                    onClick={() => handleRequestAction(request.id, "approved")}
                                  >
                                    {actionLoading === request.id ? (
                                      <Loader2 className="w-4 h-4 animate-spin" />
                                    ) : (
                                      <>
                                        <Check className="w-4 h-4 mr-1" />
                                        Approve
                                      </>
                                    )}
                                  </Button>
                                  <Button
                                    size="sm"
                                    variant="destructive"
                                    disabled={actionLoading === request.id}
                                    onClick={() => handleRequestAction(request.id, "declined")}
                                  >
                                    <X className="w-4 h-4" />
                                  </Button>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}

                        {/* Approved Passengers */}
                        {approvedPassengers.length > 0 && (
                          <div className="space-y-3">
                            <h4 className="font-medium text-sm text-muted-foreground">
                              Passengers ({approvedPassengers.length})
                            </h4>
                            <div className="flex flex-wrap gap-2">
                              {approvedPassengers.map((request) => (
                                <div
                                  key={request.id}
                                  className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-secondary"
                                >
                                  <Avatar className="w-6 h-6">
                                    <AvatarImage src={request.passenger.avatar_url || undefined} />
                                    <AvatarFallback className="bg-primary text-primary-foreground text-xs">
                                      {getInitials(request.passenger.full_name)}
                                    </AvatarFallback>
                                  </Avatar>
                                  <span className="text-sm font-medium">
                                    {request.passenger.full_name || "User"}
                                  </span>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            )}
          </TabsContent>

          {/* Rides I've Joined */}
          <TabsContent value="joined">
            {joinedRides.length === 0 ? (
              <div className="text-center py-16">
                <div className="w-20 h-20 rounded-full bg-muted flex items-center justify-center mx-auto mb-4">
                  <Users className="w-10 h-10 text-muted-foreground" />
                </div>
                <h3 className="text-xl font-semibold mb-2">No joined rides</h3>
                <p className="text-muted-foreground mb-6">
                  Find a ride that matches your route!
                </p>
                <Link to="/rides">
                  <Button className="gradient-primary text-primary-foreground">
                    Find Rides
                  </Button>
                </Link>
              </div>
            ) : (
              <div className="space-y-4">
                {joinedRides.map((request) => {
                  const ride = request.travel_post;
                  const TransportIcon = transportIcons[ride.transport_mode as keyof typeof transportIcons] || Car;

                  return (
                    <Card key={request.id} className="shadow-card">
                      <CardContent className="p-6">
                        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                          <div className="flex items-start gap-3">
                            <div className="flex flex-col items-center">
                              <div className="w-3 h-3 rounded-full bg-primary" />
                              <div className="w-0.5 h-8 bg-gradient-to-b from-primary to-accent" />
                              <div className="w-3 h-3 rounded-full bg-accent" />
                            </div>
                            <div>
                              <p className="font-medium">{ride.from_location}</p>
                              <p className="font-medium mt-4">{ride.to_location}</p>
                            </div>
                          </div>

                          <div className="flex flex-wrap gap-2">
                            <Badge variant="secondary">
                              <Calendar className="w-3 h-3 mr-1" />
                              {format(parseISO(ride.departure_date), "MMM d")}
                            </Badge>
                            <Badge variant="secondary">
                              <Clock className="w-3 h-3 mr-1" />
                              {ride.departure_time.slice(0, 5)}
                            </Badge>
                            <Badge
                              variant={
                                request.status === "approved"
                                  ? "default"
                                  : request.status === "pending"
                                  ? "secondary"
                                  : "destructive"
                              }
                            >
                              {request.status}
                            </Badge>
                          </div>

                          <div className="flex items-center gap-3">
                            <Avatar>
                              <AvatarImage src={ride.driver.avatar_url || undefined} />
                              <AvatarFallback className="bg-primary text-primary-foreground">
                                {getInitials(ride.driver.full_name)}
                              </AvatarFallback>
                            </Avatar>
                            <div>
                              <p className="text-sm text-muted-foreground">Driver</p>
                              <p className="font-medium">{ride.driver.full_name || "User"}</p>
                            </div>
                          </div>

                          {request.status === "approved" && (
                            <Button
                              variant="outline"
                              size="sm"
                              className="text-destructive hover:text-destructive"
                              disabled={actionLoading === request.id}
                              onClick={() => handleLeaveRide(request.id)}
                            >
                              {actionLoading === request.id ? (
                                <Loader2 className="w-4 h-4 animate-spin" />
                              ) : (
                                <>
                                  <UserMinus className="w-4 h-4 mr-1" />
                                  Leave
                                </>
                              )}
                            </Button>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </Layout>
  );
};

export default MyTrips;
