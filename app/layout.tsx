import "@/styles/globals.css";
import { Metadata, Viewport } from "next";
import { Link } from "@heroui/link";
import clsx from "clsx";

import { Providers } from "./providers";

import { siteConfig } from "@/config/site";
import { fontSans } from "@/config/fonts";
import { Navbar } from "@/components/navbar";
import { Toaster } from "react-hot-toast";
import SessionAppProvider from "@/config/session";

export const metadata: Metadata = {
  title: {
    default: siteConfig.name,
    template: `%s - ${siteConfig.name}`,
  },
  description: siteConfig.description,
  icons: {
    icon: "/logo.png",
  },
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "white" },
    { media: "(prefers-color-scheme: dark)", color: "black" },
  ],
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html suppressHydrationWarning lang="en">
      <head />
      <body>
        <SessionAppProvider>
        <Providers themeProps={{ attribute: "class", defaultTheme: "light" }}>
          <div >
            <main >
              <Toaster/>
              {children}
            </main>
            <footer className="w-full flex items-center justify-center py-3">
                <span className="text-default-600">Powered by</span>
                <p className="text-primary">Code Git</p>
            </footer>
          </div>
        </Providers>
        </SessionAppProvider>
      </body>
    </html>
  );
}
