import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { format } from "date-fns";
import { CalendarIcon, MapPin, Clock, Car, Bus, Footprints, Users, ArrowRight, Loader2 } from "lucide-react";
import { z } from "zod";
import { useAuth } from "@/contexts/AuthContext";
import { useCampuses } from "@/hooks/useCampuses";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import { parseMoneyToCents } from "@/lib/money";

const formSchema = z.object({
  from_location: z.string().min(2, "Please enter a starting location"),
  to_location: z.string().min(2, "Please enter a destination"),
  departure_date: z.date({ required_error: "Please select a date" }),
  departure_time: z.string().min(1, "Please select a time"),
  transport_mode: z.enum(["car", "bus", "walk"]),
  total_seats: z.number().min(1).max(8),
  notes: z.string().optional(),
  campus_id: z.string().optional(),
  price: z.string().optional(),
});

type FormData = z.infer<typeof formSchema>;

const transportModes = [
  { value: "car", label: "Car", icon: Car },
  { value: "bus", label: "Bus", icon: Bus },
  { value: "walk", label: "Walk", icon: Footprints },
];

interface OfferRideProps {
  onSuccess?: () => void;
}

const OfferRide = ({ onSuccess }: OfferRideProps) => {
  const navigate = useNavigate();
  const { profile, user } = useAuth();
  const { campuses } = useCampuses();
  const { toast } = useToast();

  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState<Partial<FormData>>({
    transport_mode: "car",
    total_seats: 4,
    campus_id: profile?.campus_id || undefined,
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Redirect to auth if not logged in
  if (!user) {
    navigate("/auth");
    return null;
  }

  const validateForm = () => {
    try {
      formSchema.parse(formData);
      setErrors({});
      return true;
    } catch (err) {
      if (err instanceof z.ZodError) {
        const newErrors: Record<string, string> = {};
        err.errors.forEach((e) => {
          if (e.path[0]) {
            newErrors[e.path[0].toString()] = e.message;
          }
        });
        setErrors(newErrors);
      }
      return false;
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm() || !profile) return;

    setLoading(true);

    try {
      const price_cents = parseMoneyToCents(formData.price ?? "");

      const { error } = await supabase.from("travel_posts").insert({
        driver_id: profile.id,
        from_location: formData.from_location!,
        to_location: formData.to_location!,
        departure_date: format(formData.departure_date!, "yyyy-MM-dd"),
        departure_time: formData.departure_time!,
        transport_mode: formData.transport_mode!,
        total_seats: formData.total_seats!,
        available_seats: formData.total_seats!,
        notes: formData.notes || null,
        campus_id: formData.campus_id || null,
        price_cents,
      });

      if (error) throw error;

      toast({
        title: "Ride created! 🚗",
        description: "Your ride has been posted. Others can now request to join.",
      });

      // Reset form
      setFormData({
        transport_mode: "car",
        total_seats: 4,
        campus_id: profile?.campus_id || undefined,
        price: "",
      });

      onSuccess?.();
    } catch (err) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to create ride. Please try again.",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto">
      <div className="mb-8">
        <h2 className="text-2xl font-bold mb-2">Offer a Ride</h2>
        <p className="text-muted-foreground">
          Share your journey and help fellow students get where they need to go.
        </p>
      </div>

      <Card className="shadow-card">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MapPin className="w-5 h-5 text-primary" />
            Trip Details
          </CardTitle>
          <CardDescription>
            Fill in the details of your upcoming trip
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Route Section */}
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="from">From</Label>
                <div className="relative">
                  <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    id="from"
                    placeholder="Starting location"
                    className={cn("pl-10", errors.from_location && "border-destructive")}
                    value={formData.from_location || ""}
                    onChange={(e) => setFormData({ ...formData, from_location: e.target.value })}
                  />
                </div>
                {errors.from_location && (
                  <p className="text-sm text-destructive">{errors.from_location}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="to">To</Label>
                <div className="relative">
                  <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-primary" />
                  <Input
                    id="to"
                    placeholder="Destination"
                    className={cn("pl-10", errors.to_location && "border-destructive")}
                    value={formData.to_location || ""}
                    onChange={(e) => setFormData({ ...formData, to_location: e.target.value })}
                  />
                </div>
                {errors.to_location && (
                  <p className="text-sm text-destructive">{errors.to_location}</p>
                )}
              </div>
            </div>

            {/* Date & Time */}
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label>Date</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        "w-full justify-start text-left font-normal",
                        !formData.departure_date && "text-muted-foreground",
                        errors.departure_date && "border-destructive"
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {formData.departure_date ? (
                        format(formData.departure_date, "PPP")
                      ) : (
                        <span>Pick a date</span>
                      )}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={formData.departure_date}
                      onSelect={(date) => setFormData({ ...formData, departure_date: date })}
                      disabled={(date) => date < new Date()}
                      initialFocus
                      className="pointer-events-auto"
                    />
                  </PopoverContent>
                </Popover>
                {errors.departure_date && (
                  <p className="text-sm text-destructive">{errors.departure_date}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="time">Time</Label>
                <div className="relative">
                  <Clock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    id="time"
                    type="time"
                    className={cn("pl-10", errors.departure_time && "border-destructive")}
                    value={formData.departure_time || ""}
                    onChange={(e) => setFormData({ ...formData, departure_time: e.target.value })}
                  />
                </div>
                {errors.departure_time && (
                  <p className="text-sm text-destructive">{errors.departure_time}</p>
                )}
              </div>
            </div>

            {/* Transport Mode & Seats */}
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label>Transport Mode</Label>
                <div className="flex gap-2">
                  {transportModes.map((mode) => (
                    <Button
                      key={mode.value}
                      type="button"
                      variant={formData.transport_mode === mode.value ? "default" : "outline"}
                      className={cn(
                        "flex-1",
                        formData.transport_mode === mode.value && "gradient-primary text-primary-foreground"
                      )}
                      onClick={() => setFormData({ ...formData, transport_mode: mode.value as "car" | "bus" | "walk" })}
                    >
                      <mode.icon className="w-4 h-4 mr-2" />
                      {mode.label}
                    </Button>
                  ))}
                </div>
              </div>

              <div className="space-y-2">
                <Label>Available Seats</Label>
                <div className="flex items-center gap-2">
                  <Users className="w-4 h-4 text-muted-foreground" />
                  <Select
                    value={formData.total_seats?.toString()}
                    onValueChange={(v) => setFormData({ ...formData, total_seats: parseInt(v) })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Seats" />
                    </SelectTrigger>
                    <SelectContent>
                      {[1, 2, 3, 4, 5, 6, 7, 8].map((n) => (
                        <SelectItem key={n} value={n.toString()}>
                          {n} {n === 1 ? "seat" : "seats"}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>

            {/* Campus */}
            <div className="space-y-2">
              <Label>Campus (optional)</Label>
              <Select
                value={formData.campus_id}
                onValueChange={(v) => setFormData({ ...formData, campus_id: v })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select a campus" />
                </SelectTrigger>
                <SelectContent>
                  {campuses.map((campus) => (
                    <SelectItem key={campus.id} value={campus.id}>
                      {campus.name} - {campus.city}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Notes */}
            <div className="space-y-2">
              <Label htmlFor="notes">Notes (optional)</Label>
              <Textarea
                id="notes"
                placeholder="Any additional details about the ride..."
                value={formData.notes || ""}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                rows={3}
              />
            </div>

            {/* Price */}
            <div className="space-y-2">
              <Label htmlFor="price">Price (optional)</Label>
              <Input
                id="price"
                inputMode="decimal"
                placeholder="$5"
                value={formData.price || ""}
                onChange={(e) => setFormData({ ...formData, price: e.target.value })}
              />
              <p className="text-xs text-muted-foreground">Leave empty if it’s free.</p>
            </div>

            {/* Submit */}
            <Button
              type="submit"
              size="lg"
              className="w-full gradient-primary text-primary-foreground"
              disabled={loading}
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Creating ride...
                </>
              ) : (
                <>
                  Post Ride
                  <ArrowRight className="w-4 h-4 ml-2" />
                </>
              )}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default OfferRide;
