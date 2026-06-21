import { supabase } from "@/integrations/supabase/client";
import type { QueryClient } from "@tanstack/react-query";
import type { Router } from "@tanstack/react-router";

export async function signOutCleanly(
  queryClient: QueryClient,
  router: Pick<Router<any, any>, "navigate">,
) {
  await queryClient.cancelQueries();
  queryClient.clear();
  await supabase.auth.signOut();
  await router.navigate({ to: "/auth", replace: true });
}
