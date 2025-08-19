import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Image to SVG Converter",
  description: "Convert your images to high-quality SVG vector graphics with advanced conversion settings",
  keywords: ["SVG", "converter", "vector", "image", "conversion", "graphics"],
  authors: [{ name: "Nikunj Rohit" }],
  creator: "Nikunj Rohit",
  openGraph: {
    title: "Image to SVG Converter",
    description: "Convert your images to high-quality SVG vector graphics with advanced conversion settings",
    type: "website",
    locale: "en_US",
  },
  twitter: {
    card: "summary_large_image",
    title: "Image to SVG Converter",
    description: "Convert your images to high-quality SVG vector graphics with advanced conversion settings",
  },
  robots: "index, follow",
};

export const viewport = {
  width: 'device-width',
  initialScale: 1,
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
