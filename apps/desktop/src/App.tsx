import "./globals.css";
import { UploadComponent } from "./components/upload-component";
import { TanStackQueryProvider } from "./providers/tanstack-query-provider";
import { X } from "lucide-react";
import { listen } from "@tauri-apps/api/event";
import { Window } from "@tauri-apps/api/window";
import { open } from "@tauri-apps/plugin-shell";
import { invoke } from "@tauri-apps/api/core";
import { createClient } from "./utils/supabase/client";
import { DEFAULT_URL } from "./lib/constants";

const appWindow = new Window("main");

export type Tokens = {
  payload: {
    access_token: string;
    refresh_token: string;
  };
};

listen("login-tokens", async (data: Tokens) => {
  const { access_token, refresh_token } = data.payload;
  const client = createClient();
  await client.auth.setSession({
    access_token,
    refresh_token,
  });
  localStorage.setItem("isLogged", "true");
  window.location.reload();
});

listen("login-requested", async () => {
  const port = await invoke("setup_callback");
  await open(`${DEFAULT_URL}/desktop-sign-in?port=` + port);
});

function App() {
  return (
    <TanStackQueryProvider>
      <div className="bg-zinc-950 flex absolute justify-end items-center w-full">
        <button
          className="text-zinc-700 flex flex-row-reverse"
          onClick={() => appWindow.hide()}
        >
          <X size={24} />
        </button>
      </div>
      <div className="bg-zinc-950 h-screen w-full flex justify-center items-center">
        <div className="flex flex-col gap-16 w-full">
          <UploadComponent />
        </div>
      </div>
    </TanStackQueryProvider>
  );
}

export default App;
