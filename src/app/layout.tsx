import type { Metadata, Viewport } from "next";
import { Playfair_Display, Manrope, Geist, Geist_Mono, Montserrat } from "next/font/google";
import "./globals.css";

const geist = Geist({
  variable: "--font-geist",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

/* The headlines: a clean, wide geometric sans — light and bold (variable weight). */
const hero = Montserrat({
  variable: "--font-hero",
  subsets: ["latin"],
});

/* Used only by the service pages from the previous direction; not preloaded. */
const display = Playfair_Display({
  variable: "--font-display-src",
  subsets: ["latin"],
  weight: ["400", "500"],
  style: ["normal", "italic"],
  preload: false,
});

const sans = Manrope({
  variable: "--font-sans-src",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600"],
  preload: false,
});

const mono = Geist_Mono({
  variable: "--font-mono-src",
  subsets: ["latin"],
  weight: ["400", "500"],
});

export const metadata: Metadata = {
  title: "codERA — We build digital experiences",
  description:
    "codERA builds custom websites, produces premium visuals and keeps everything running with ongoing website care. Websites × visual production.",
};

export const viewport: Viewport = {
  themeColor: "#15110e",
  colorScheme: "dark",
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className={`${geist.variable} ${hero.variable} ${display.variable} ${sans.variable} ${mono.variable} h-full antialiased`}>
      <body className="min-h-full">{children}</body>
    </html>
  );
}
