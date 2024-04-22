import { Database } from "@/lib/database.types";
import { createClient } from "@supabase/supabase-js";
import { z } from "zod";

const InsertFileBody = z.object({
  type: z.literal("INSERT"),
  table: z.literal("objects"),
  record: z.object({
    id: z.string(),
    name: z.string(),
  }),
});
export async function POST(request: Request) {
  const { record } = InsertFileBody.parse(await request.json());
  const client = createClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_KEY!
  );

  const { error } = await client
    .from("files")
    .update({ object_id: record.id })
    .eq("name", record.name);

  if (error) {
    return new Response(
      JSON.stringify({
        error: "Failed to update file",
      }),
      {
        status: 400,
      }
    );
  }

  return new Response(null, { status: 204 });
}
