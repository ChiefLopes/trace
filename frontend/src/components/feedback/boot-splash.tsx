import { siteConfig } from "@/config/site";

import { TraceLoader } from "./trace-loader";

/**
 * Hides the splash once the DOM is ready. Inlined in <head> so it runs
 * before React: the splash is plain server HTML and must not wait for hydration.
 */
export const bootSplashScript = `(function(){var r=document.documentElement;function d(){r.classList.add("boot-done")}if(document.readyState!=="loading"){d()}else{addEventListener("DOMContentLoaded",d)}})()`;

/**
 * Full-screen TRACE loader shown on every full page load (landing, auth and
 * game pages alike) until fonts and images are in. See `.boot-splash` in
 * globals.css for how it is dismissed.
 */
export function BootSplash() {
  return (
    <div className="boot-splash fixed inset-0 z-[100] flex flex-col bg-[linear-gradient(178deg,#000614_2%,#002472_45%,#011b55_84%)]">
      <noscript>
        <style>{".boot-splash{display:none}"}</style>
      </noscript>
      <p className="px-6 pt-5 font-display text-xl font-black tracking-wide uppercase lg:px-8 lg:pt-6 lg:text-2xl">
        {siteConfig.name}
      </p>
      <TraceLoader label="Loading the case files" className="flex-1" />
    </div>
  );
}
