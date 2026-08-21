import { registerPlugin } from "@capacitor/core";

export interface AutoUpdatePlugin {
  downloadAndInstall(options: { url: string }): Promise<{ success: boolean }>;
}

const AutoUpdate = registerPlugin<AutoUpdatePlugin>("AutoUpdate");

export default AutoUpdate;
