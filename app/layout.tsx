/*import "./globals.css";
import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { Header } from "@/components/layout/Header";
import { Toaster } from "@/components/ui/sonner";
import { AuthProvider } from "@/context/AuthContext";
import { ThemeProvider } from "@/providers/ThemeProviders";
import { HelpButton } from "@/components/layout/HelpButton"; 

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "CollabNet - Connect with Instagram Creators",
  description:
    "Find and collaborate with Instagram content creators for sponsorships and partnerships. Build your creator network.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={inter.className}>
        <AuthProvider>
          <ThemeProvider>
            <Header />
            <main>{children}</main>
            <HelpButton /> 
            <Toaster />
          </ThemeProvider>
        </AuthProvider>
      </body>
    </html>
  );
}*/
// app/layout.tsx
/*import "./globals.css";
import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { Header } from "@/components/layout/Header";
import { AuthProvider } from "@/context/AuthContext";
import { ThemeProvider } from "@/providers/ThemeProviders";
import { HelpButton } from "@/components/layout/HelpButton";
import { ToastProvider } from "@/src/components/ui/use-toast";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "CollabNet - Connect with Instagram Creators",
  description:
    "Find and collaborate with Instagram content creators for sponsorships and partnerships. Build your creator network.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={inter.className}>
        <AuthProvider>
          <ThemeProvider>
            <ToastProvider>
              <Header />
              <main>{children}</main>
              <HelpButton />
            </ToastProvider>
          </ThemeProvider>
        </AuthProvider>
      </body>
    </html>
  );
}*/
// app/layout.tsx
/*
import "./globals.css";
import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { Header } from "@/components/layout/Header";

import { AuthProvider } from "@/context/AuthContext";
import { ThemeProvider } from "@/providers/ThemeProviders";
import { HelpButton } from "@/components/layout/HelpButton";
import { ToastProvider } from "@/src/components/ui/use-toast";




const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "CollabNet - Connect with Instagram Creators",
  description:
    "Find and collaborate with Instagram content creators for sponsorships and partnerships. Build your creator network.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={inter.className}>
        <AuthProvider> <ThemeProvider> <ToastProvider> <Header /> <main>{children}</main> <HelpButton /> </ToastProvider> </ThemeProvider> </AuthProvider>

      </body>
    </html>
  );
}*/
import "./globals.css";
import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { Header } from "@/components/layout/Header";

import { AuthProvider } from "@/context/AuthContext";
import { ThemeProvider } from "@/providers/ThemeProviders";
import { HelpButton } from "@/components/layout/HelpButton";
import { ToastProvider } from "@/src/components/ui/use-toast";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "CollabNet - Connect with Instagram Creators",
  description:
    "Find and collaborate with Instagram content creators for sponsorships and partnerships. Build your creator network.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning className="dark"> {/* ✅ force dark at start */}
      <body className={inter.className}>
        <AuthProvider>
          <ThemeProvider>
            <ToastProvider>
              <Header />
              <main>{children}</main>
              <HelpButton />
            </ToastProvider>
          </ThemeProvider>
        </AuthProvider>
      </body>
    </html>
  );
}


