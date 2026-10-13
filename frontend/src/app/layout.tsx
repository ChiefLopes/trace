import type { Metadata, Viewport } from "next";
import { Inter, JetBrains_Mono, Roboto } from "next/font/google";

import { BootSplash, bootSplashScript } from "@/components/feedback/boot-splash";
import { siteConfig } from "@/config/site";

import { Providers } from "./providers";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

// Body copy on several Figma screens (briefing, scores) is set in Roboto.
const roboto = Roboto({
  variable: "--font-roboto-src",
  subsets: ["latin"],
  weight: ["400", "600", "700"],
});

// Monospace accents: labels, timestamps and wallet addresses.
const jetbrainsMono = JetBrains_Mono({
  variable: "--font-jetbrains-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  metadataBase: new URL(siteConfig.url),
  title: {
    default: siteConfig.name,
    template: `%s · ${siteConfig.name}`,
  },
  description: siteConfig.description,
  icons: {
    icon: [
      { url: "/favicon.ico" },
      { url: "/avatar.svg", type: "image/svg+xml" },
      { url: "/avatar.png", type: "image/png" },
    ],
    apple: [{ url: "/apple-icon.png" }],
  },
  openGraph: {
    type: "website",
    siteName: siteConfig.name,
    title: siteConfig.name,
    description: siteConfig.description,
    images: [{ url: "/project-avatar.png", width: 180, height: 180, alt: "TRACE Project Avatar" }],
  },
};

export const viewport: Viewport = {
  themeColor: "#020a23",
  colorScheme: "dark",
};

/**
 * Publishes the viewport width (unitless, scrollbar excluded) as `--vw` for
 * `.design-canvas` scaling. Runs before first paint so there's no jump.
 */
const viewportWidthScript = `(function(){var r=document.documentElement;function s(){r.style.setProperty("--vw",String(r.clientWidth||innerWidth))}s();addEventListener("resize",s);addEventListener("DOMContentLoaded",s)})()`;

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    // suppressHydrationWarning: the head scripts set a style and a class on <html> before React hydrates.
    <html
      lang="en"
      suppressHydrationWarning
      className={`${inter.variable} ${roboto.variable} ${jetbrainsMono.variable} h-full antialiased`}
    >
      <head>
        <script dangerouslySetInnerHTML={{ __html: viewportWidthScript }} />
        <script dangerouslySetInnerHTML={{ __html: bootSplashScript }} />
      </head>
      <body className="flex min-h-full flex-col">
        <BootSplash />
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
