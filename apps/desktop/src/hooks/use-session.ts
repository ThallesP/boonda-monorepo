import { createClient } from "@/utils/supabase/client";
import { useQuery } from "@tanstack/react-query";

export function useSession() {
  return useQuery({
    queryKey: ["session"],
    refetchInterval: 1000 * 10,
    queryFn: async () => {
      const client = createClient();
      const { data, error } = await client.auth.getUser();

      if (error) return null;

      return data;
    },
  });
}
