import { createClient } from "@supabase/supabase-js";

export function useUpload() {
  async function uploadFile(file: File) {
    const client = createClient(
      "https://dagrxagqkexvgylcbiqz.supabase.co",
      "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRhZ3J4YWdxa2V4dmd5bGNiaXF6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3MTMyODYwNDYsImV4cCI6MjAyODg2MjA0Nn0.VACjQ4rzyKtJMamkkErkfCT8Sj1WOA-U6bO25URpOQ4"
    );

    const response = await fetch("https://www.boonda.app/api/upload", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        name: file.name,
        sizeInBytes: file.size,
      }),
    });

    const { uploadInfo, expiresAt, url } = await response.json();

    const { error } = await client.storage
      .from("files")
      .uploadToSignedUrl(uploadInfo.data.path, uploadInfo.data.token, file);

    if (error) {
      throw error;
    }

    return {
      expiresAt,
      url,
    };
  }

  return {
    uploadFile,
  };
}
