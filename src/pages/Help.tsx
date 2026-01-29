import { useSearchParams } from "react-router-dom";
import { Shield, AlertTriangle, ClipboardList, Bell } from "lucide-react";
import Layout from "@/components/layout/Layout";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import FeatureHubHeader from "@/components/common/FeatureHubHeader";
import ComingSoonPlaceholder from "@/components/common/ComingSoonPlaceholder";

const Help = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const currentTab = searchParams.get("tab") || "report";

  const handleTabChange = (value: string) => {
    setSearchParams({ tab: value });
  };

  return (
    <Layout>
      <div className="container mx-auto px-4 py-8">
        <FeatureHubHeader
          title="Urgent Help"
          subtitle="Report emergencies and get assistance"
          icon={Shield}
          badgeTone="destructive"
        />

        {/* Tabs */}
        <Tabs value={currentTab} onValueChange={handleTabChange} className="space-y-8">
          <TabsList className="grid w-full max-w-lg grid-cols-3">
            <TabsTrigger value="report" className="flex items-center gap-2">
              <AlertTriangle className="w-4 h-4" />
              <span className="hidden sm:inline">Report</span>
            </TabsTrigger>
            <TabsTrigger value="active" className="flex items-center gap-2">
              <Bell className="w-4 h-4" />
              <span className="hidden sm:inline">Active Tickets</span>
            </TabsTrigger>
            <TabsTrigger value="my-requests" className="flex items-center gap-2">
              <ClipboardList className="w-4 h-4" />
              <span className="hidden sm:inline">My Requests</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="report">
            <div>
              <ComingSoonPlaceholder
                title="Report Emergency"
                description="Need urgent help? Report an emergency and get assistance from your campus community."
                icon={AlertTriangle}
              />
            </div>
          </TabsContent>

          <TabsContent value="active">
            <div>
              <ComingSoonPlaceholder
                title="Active Tickets"
                description="View ongoing help requests in your campus community. See where help is needed."
                icon={Bell}
              />
            </div>
          </TabsContent>

          <TabsContent value="my-requests">
            <div>
              <ComingSoonPlaceholder
                title="My Help Requests"
                description="Track your submitted help tickets and their current status."
                icon={ClipboardList}
              />
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </Layout>
  );
};

export default Help;
