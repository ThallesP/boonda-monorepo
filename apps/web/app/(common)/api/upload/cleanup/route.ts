import { Database } from "@/lib/database.types";
import { createClient } from "@supabase/supabase-js";

export async function POST(request: Request) {
  if (
    request.headers.get("authorization") !== `Bearer ${process.env.CRON_SECRET}`
  ) {
    return new Response(
      JSON.stringify({
        error: "Unauthorized",
      }),
      {
        status: 401,
      }
    );
  }

  const client = createClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_KEY!
  );

  const { data, error } = await client
    .from("files")
    .select()
    .not("object_id", "is", null)
    .lt("expiresAt", new Date().toISOString());

  if (error) {
    return new Response(
      JSON.stringify({
        error: "Failed to cleanup files",
      }),
      {
        status: 400,
      }
    );
  }

  await Promise.all([
    client
      .from("files")
      .delete()
      .eq(
        "id",
        data.map((file) => file.id)
      ),
    client.storage.from("files").remove(data.map((file) => file.name)),
  ]);

  return new Response(null, { status: 204 });
}
