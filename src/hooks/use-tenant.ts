import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export function useTenantId() {
  return useQuery({
    queryKey: ["tenant-id"],
    queryFn: async () => {
      const { data, error } = await supabase.rpc("current_tenant_id");
      if (error) throw error;
      return data as string | null;
    },
    staleTime: 1000 * 60 * 30,
  });
}
