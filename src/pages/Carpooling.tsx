import { useSearchParams } from "react-router-dom";
import { Car, Plus, MapPin } from "lucide-react";
import Layout from "@/components/layout/Layout";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import FindRides from "@/components/carpooling/FindRides";
import OfferRide from "@/components/carpooling/OfferRide";
import MyTripsTab from "@/components/carpooling/MyTripsTab";
import FeatureHubHeader from "@/components/common/FeatureHubHeader";

const Carpooling = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const currentTab = searchParams.get("tab") || "find";

  const handleTabChange = (value: string) => {
    setSearchParams({ tab: value });
  };

  return (
    <Layout>
      <div className="container mx-auto px-4 py-8">
        <FeatureHubHeader
          title="Carpooling"
          subtitle="Share rides with fellow students"
          icon={Car}
          badgeTone="primary"
        />

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
