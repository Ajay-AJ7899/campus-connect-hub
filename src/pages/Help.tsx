import { useSearchParams } from "react-router-dom";
import { Shield, AlertTriangle, ClipboardList, Bell } from "lucide-react";
import Layout from "@/components/layout/Layout";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";

const Help = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const currentTab = searchParams.get("tab") || "report";

  const handleTabChange = (value: string) => {
    setSearchParams({ tab: value });
  };

  const ComingSoonPlaceholder = ({ title, description, icon: Icon }: { title: string; description: string; icon: React.ComponentType<{ className?: string }> }) => (
    <div className="text-center py-16">
      <div className="w-20 h-20 rounded-full bg-muted flex items-center justify-center mx-auto mb-4">
        <Icon className="w-10 h-10 text-muted-foreground" />
      </div>
      <h3 className="text-xl font-semibold mb-2">{title}</h3>
      <p className="text-muted-foreground mb-6 max-w-md mx-auto">{description}</p>
      <Button variant="outline" disabled>
        Coming Soon
      </Button>
    </div>
  );

  return (
    <Layout>
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-red-500 to-rose-500 flex items-center justify-center">
              <Shield className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold">Urgent Help</h1>
              <p className="text-muted-foreground">Report emergencies and get assistance</p>
            </div>
          </div>
        </div>

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
            <ComingSoonPlaceholder 
              title="Report Emergency" 
              description="Need urgent help? Report an emergency and get assistance from your campus community."
              icon={AlertTriangle}
            />
          </TabsContent>

          <TabsContent value="active">
            <ComingSoonPlaceholder 
              title="Active Tickets" 
              description="View ongoing help requests in your campus community. See where help is needed."
              icon={Bell}
            />
          </TabsContent>

          <TabsContent value="my-requests">
            <ComingSoonPlaceholder 
              title="My Help Requests" 
              description="Track your submitted help tickets and their current status."
              icon={ClipboardList}
            />
          </TabsContent>
        </Tabs>
      </div>
    </Layout>
  );
};

export default Help;
