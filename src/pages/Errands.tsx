import { useSearchParams } from "react-router-dom";
import { ShoppingBag, Plus, Users, ClipboardList } from "lucide-react";
import Layout from "@/components/layout/Layout";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

const Errands = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const currentTab = searchParams.get("tab") || "browse";

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
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-orange-500 to-amber-500 flex items-center justify-center">
              <ShoppingBag className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold">Errands & Orders</h1>
              <p className="text-muted-foreground">Get help with tasks and group orders</p>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <Tabs value={currentTab} onValueChange={handleTabChange} className="space-y-8">
          <TabsList className="grid w-full max-w-2xl grid-cols-4">
            <TabsTrigger value="browse" className="flex items-center gap-2">
              <ShoppingBag className="w-4 h-4" />
              <span className="hidden sm:inline">Browse</span>
            </TabsTrigger>
            <TabsTrigger value="post" className="flex items-center gap-2">
              <Plus className="w-4 h-4" />
              <span className="hidden sm:inline">Post</span>
            </TabsTrigger>
            <TabsTrigger value="orders" className="flex items-center gap-2">
              <Users className="w-4 h-4" />
              <span className="hidden sm:inline">Group Orders</span>
            </TabsTrigger>
            <TabsTrigger value="my-requests" className="flex items-center gap-2">
              <ClipboardList className="w-4 h-4" />
              <span className="hidden sm:inline">My Requests</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="browse">
            <ComingSoonPlaceholder 
              title="Browse Errands" 
              description="See errands others need help with. Pick up items, deliver packages, or help with tasks around campus."
              icon={ShoppingBag}
            />
          </TabsContent>

          <TabsContent value="post">
            <ComingSoonPlaceholder 
              title="Post an Errand" 
              description="Need help with something? Post your errand and let others on campus help you out."
              icon={Plus}
            />
          </TabsContent>

          <TabsContent value="orders">
            <ComingSoonPlaceholder 
              title="Group Orders" 
              description="Join group food orders to save on delivery fees. Or create your own order for others to join."
              icon={Users}
            />
          </TabsContent>

          <TabsContent value="my-requests">
            <ComingSoonPlaceholder 
              title="My Requests" 
              description="Track your posted errands and tasks you've accepted from others."
              icon={ClipboardList}
            />
          </TabsContent>
        </Tabs>
      </div>
    </Layout>
  );
};

export default Errands;
