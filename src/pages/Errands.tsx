import { useSearchParams } from "react-router-dom";
import { ShoppingBag, Plus, Users, ClipboardList } from "lucide-react";
import Layout from "@/components/layout/Layout";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import FeatureHubHeader from "@/components/common/FeatureHubHeader";
import ErrandsFeed from "@/components/errands/ErrandsFeed";
import ErrandPostForm from "@/components/errands/ErrandPostForm";
import { useAuth } from "@/contexts/AuthContext";
import GroupOrdersPanel from "@/components/group-orders/GroupOrdersPanel";

const Errands = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const currentTab = searchParams.get("tab") || "browse";
  const { profile } = useAuth();

  const handleTabChange = (value: string) => {
    setSearchParams({ tab: value });
  };

  return (
    <Layout>
      <div className="container mx-auto px-4 py-8">
        <FeatureHubHeader
          title="Errands"
          subtitle="Get help with tasks and quick pickups"
          icon={ShoppingBag}
          badgeTone="warning"
          badgeClassName="gradient-warm"
        />

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
            <ErrandsFeed mode="feed" />
          </TabsContent>

          <TabsContent value="post">
            <ErrandPostForm onSuccess={() => handleTabChange("browse")} />
          </TabsContent>

          <TabsContent value="orders">
            <GroupOrdersPanel />
          </TabsContent>

          <TabsContent value="my-requests">
            <ErrandsFeed mode="mine" requesterProfileId={profile?.id} />
          </TabsContent>
        </Tabs>
      </div>
    </Layout>
  );
};

export default Errands;
