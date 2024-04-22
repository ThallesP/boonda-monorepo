import { Button } from "@/components/ui/button";
import { Dropzone } from "@/components/ui/dropzone";
import {
  FormControl,
  FormField,
  FormItem,
  FormMessage,
} from "@/components/ui/form";
import { useUpload } from "@/hooks/use-upload";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader } from "lucide-react";
import { FormProvider, useForm } from "react-hook-form";
import { z } from "zod";
import { MAX_ANON_SIZE_BYTES, MAX_LOGGED_SIZE_BYTES } from "@/lib/constants";
import { writeText } from "@tauri-apps/plugin-clipboard-manager";
import { useRef, useState } from "react";
import { Copy, Check } from "lucide-react";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { useSession } from "@/hooks/use-session";

const UploadSchema = z.object({
  file: z.instanceof(File).nullable(),
});

export function UploadComponent() {
  const inputRef = useRef<HTMLInputElement | null>(null);
  const copiedTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const [isCopied, setIsCopied] = useState(false);
  const [uploadedURL, setUploadedURL] = useState<string | null>(null);
  const [uploadedURLDuration, setUploadedURLDuration] = useState<number | null>(
    null
  );
  const { mutate: upload, isPending: isUploading } = useUpload();
  const { data, isPending } = useSession();

  const defaultValues: { file: null | File } = {
    file: null,
  };

  const form = useForm<z.infer<typeof UploadSchema>>({
    resolver: zodResolver(UploadSchema),
    defaultValues,
    shouldFocusError: true,
    shouldUnregister: false,
    shouldUseNativeValidation: false,
  });

  function handleOnDrop(acceptedFiles: FileList | null) {
    if (acceptedFiles && acceptedFiles.length > 0) {
      const maxSize = data ? MAX_LOGGED_SIZE_BYTES : MAX_ANON_SIZE_BYTES;
      if (acceptedFiles[0].size > maxSize) {
        form.setValue("file", null);
        return form.setError("file", {
          message: "File is too big",
          type: "typeError",
        });
      }

      form.setValue("file", acceptedFiles[0]);
      form.clearErrors("file");
    } else {
      form.setValue("file", null);
      form.setError("file", {
        message: "File is required",
        type: "typeError",
      });
    }
  }

  function handleFormSubmit(values: z.infer<typeof UploadSchema>) {
    if (!values.file) {
      return;
    }

    upload(values.file, {
      onSuccess: async ({ url, expiresAt }) => {
        if (!url) {
          return;
        }

        await writeText(url);
        setUploadedURL(url);
        setUploadedURLDuration(expiresAt);
      },
    });
  }

  async function copyToClipboard() {
    if (copiedTimeoutRef.current) {
      clearTimeout(copiedTimeoutRef.current);
    }

    await writeText(inputRef.current?.value || "");
    setIsCopied(true);
    const t = setTimeout(() => {
      setIsCopied(false);
    }, 3000);

    copiedTimeoutRef.current = t;
  }

  return (
    <div className="flex flex-col gap-4 bg-zinc-950/55 p-4">
      <FormProvider {...form}>
        <form
          className="flex flex-col items-center justify-center w-full min-h-36 gap-2 z-[1] relative"
          onSubmit={form.handleSubmit(handleFormSubmit)}
          noValidate
          autoComplete="off"
        >
          <FormField
            control={form.control}
            name="file"
            render={({ field }) => (
              <FormItem className="w-full h-full">
                <FormControl>
                  <Dropzone
                    {...field}
                    classNameWrapper="bg-zinc-800/30 border-0 hover:bg-zinc-800/40 transition-colors backdrop-blur-md"
                    dropMessage="Drag and drop a file or click to select one"
                    isLoggedIn={!isPending && !!data}
                    handleOnDrop={handleOnDrop}
                  />
                </FormControl>
                <FormMessage className="text-red-500" />
              </FormItem>
            )}
          />
          <div className="flex justify-end items-center w-full">
            <Button
              className="w-full opacity-100"
              type="submit"
              disabled={!form.watch("file") && !isUploading}
            >
              {isUploading && <Loader className="size-4 animate-spin mr-2" />}
              Upload
            </Button>

            <Button className="ml-2" onClick={() => window.location.reload()}>
              Reset
            </Button>
          </div>
        </form>
      </FormProvider>

      {uploadedURL && uploadedURLDuration != null && (
        <>
          <div className="flex flex-col gap-2">
            <Label className="text-muted-foreground">File URL</Label>
            <div className="flex items-start justify-start w-full gap-2">
              <Input
                ref={inputRef}
                id="file-url"
                value={uploadedURL}
                onFocus={() => {
                  inputRef.current?.select();
                }}
                className="bg-zinc-900 border-zinc-800 text-background"
              />
              <Button
                className="relative"
                size="icon"
                variant="secondary"
                onClick={copyToClipboard}
              >
                <Copy
                  className="size-4 absolute top-1/2 -translate-y-1/2 right-1/2 translate-x-1/2 data-[copied=true]:opacity-0 transition-all"
                  data-copied={isCopied}
                />
                <Check
                  className="size-4 absolute top-1/2 -translate-y-1/2 right-1/2 translate-x-1/2 opacity-0 data-[copied=true]:opacity-100 transition-all"
                  data-copied={isCopied}
                />
                <span className="opacity-0"></span>
              </Button>
            </div>
          </div>
          <div className="flex flex-col gap-2">
            <Label className="text-muted-foreground">File Expiration</Label>
            <p className="text-background">
              {new Date(uploadedURLDuration).toLocaleDateString(undefined, {
                day: "2-digit",
                month: "long",
                year: "numeric",
                hour: "2-digit",
                minute: "2-digit",
              })}
            </p>
          </div>
        </>
      )}
    </div>
  );
}
