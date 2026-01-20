import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "My eBay Listings - ThomasTSC & C Ventures LLC",
  description: "Browse items for sale from our eBay stores - ThomasTSC and C Ventures LLC",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased">
        {children}
      </body>
    </html>
  );
}
