import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "DGG-NHC | NexusHub Community (Enterprise Master Edition)",
  description: "Pan-African Campus Talent & Enterprise Apprenticeship Gateway",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full" suppressHydrationWarning>
      <body
        className="min-h-full flex flex-col justify-between selection:bg-[#f2b42c] selection:text-[#512d7c] antialiased"
        suppressHydrationWarning
      >
        {children}
      </body>
    </html>
  );
}