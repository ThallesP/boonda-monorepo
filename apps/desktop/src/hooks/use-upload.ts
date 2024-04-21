import { DEFAULT_URL } from "@/lib/constants";
import { createClient } from "@/utils/supabase/client";
import { useMutation } from "@tanstack/react-query";

export function useUpload() {
  return useMutation({
    mutationKey: ["upload"],
    mutationFn: async (file: File) => {
      const client = createClient();

      const response = await fetch(`${DEFAULT_URL}/api/upload`, {
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
    },
  });
}
