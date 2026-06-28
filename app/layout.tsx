import type { Metadata } from "next";
import { ThemeProvider } from "@/components/providers/theme-provider";
import { Toaster } from "@/components/providers/toaster";
import "./globals.css";

export const metadata: Metadata = {
  title: {
    default: "StickerBiz — Inventory Management",
    template: "%s | StickerBiz",
  },
  description:
    "Production-ready order and inventory management system for Flipkart sticker business operations.",
  keywords: ["inventory", "stickers", "flipkart", "order management", "dashboard"],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="min-h-screen bg-background antialiased">
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          {children}
          <Toaster />
        </ThemeProvider>
      </body>
    </html>
  );
}