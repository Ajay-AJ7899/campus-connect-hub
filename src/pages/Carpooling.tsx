import { useSearchParams } from "react-router-dom";
import { Car, Plus, MapPin } from "lucide-react";
import Layout from "@/components/layout/Layout";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import FindRides from "@/components/carpooling/FindRides";
import OfferRide from "@/components/carpooling/OfferRide";
import MyTripsTab from "@/components/carpooling/MyTripsTab";

const Carpooling = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const currentTab = searchParams.get("tab") || "find";

  const handleTabChange = (value: string) => {
    setSearchParams({ tab: value });
  };

  return (
    <Layout>
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 rounded-xl gradient-primary flex items-center justify-center">
              <Car className="w-6 h-6 text-primary-foreground" />
            </div>
            <div>
              <h1 className="text-3xl font-bold">Carpooling</h1>
              <p className="text-muted-foreground">Share rides with fellow students</p>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <Tabs value={currentTab} onValueChange={handleTabChange} className="space-y-8">
          <TabsList className="grid w-full max-w-lg grid-cols-3">
            <TabsTrigger value="find" className="flex items-center gap-2">
              <Car className="w-4 h-4" />
              <span className="hidden sm:inline">Find Rides</span>
              <span className="sm:hidden">Find</span>
            </TabsTrigger>
            <TabsTrigger value="offer" className="flex items-center gap-2">
              <Plus className="w-4 h-4" />
              <span className="hidden sm:inline">Offer Ride</span>
              <span className="sm:hidden">Offer</span>
            </TabsTrigger>
            <TabsTrigger value="trips" className="flex items-center gap-2">
              <MapPin className="w-4 h-4" />
              <span className="hidden sm:inline">My Trips</span>
              <span className="sm:hidden">Trips</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="find">
            <FindRides onOfferRide={() => handleTabChange("offer")} />
          </TabsContent>

          <TabsContent value="offer">
            <OfferRide onSuccess={() => handleTabChange("trips")} />
          </TabsContent>

          <TabsContent value="trips">
            <MyTripsTab 
              onOfferRide={() => handleTabChange("offer")} 
              onFindRides={() => handleTabChange("find")} 
            />
          </TabsContent>
        </Tabs>
      </div>
    </Layout>
  );
};

export default Carpooling;
