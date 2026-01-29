import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

async function fetchIsAdmin() {
  // Server-validated: returns empty array for non-admins.
  const { data, error } = await supabase.rpc("admin_accessible_campuses");
  if (error) throw error;
  return (data ?? []).length > 0;
}

export function useIsAdmin(enabled = true) {
  return useQuery({
    queryKey: ["is_admin"],
    queryFn: fetchIsAdmin,
    enabled,
    staleTime: 60_000,
  });
}
