import type { Metadata } from "next";
import "./globals.css";

const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "https://img-to-svg-converter-steel.vercel.app";

export const metadata: Metadata = {
  metadataBase: new URL(baseUrl),
  title: {
    default: "Image to SVG Converter | Free Online PNG, JPG to SVG",
    template: "%s | Image to SVG Converter",
  },
  description: "Free online image to SVG converter. Instantly vectorize your PNG, JPG, GIF, BMP, and WebP images to create high-quality, scalable SVG files. Perfect for logos, icons, and illustrations. No signup required.",
  keywords: [
    // Core Actions & File Types
    "image to svg", "convert to svg", "svg converter", "svg generator", "png to svg",
    "jpg to svg", "jpeg to svg", "gif to svg", "bmp to svg", "webp to svg", "heic to svg", "picture to svg", "photo to svg",
    // User Problem / Intent
    "vectorize image", "vectorize logo", "vectorize drawing", "convert logo to vector",
    "create svg from image", "turn image into svg", "make image scalable", "raster to vector",
    "bitmap to vector", "trace image online", "image tracing tool",
    // Modifiers
    "free svg converter", "online image to svg converter", "png to svg online free", "free vectorizer",
    // Use Case Specific
    "svg for cricut", "svg for laser cutting", "convert image for illustrator", "svg for web design", "scalable icon generator",
    // Technical & Broader Terms
    "SVG", "Scalable Vector Graphics", "vector graphics", "vector conversion", "vector art", "path conversion", "svg optimization", "graphics converter",
    // Long-tail & Questions
    "how to make a picture a vector", "turn logo into vector free", "create svg for cricut from image", "convert image for laser cutting",
    "image to svg without losing quality", "high resolution image to svg", "vectorize signature online", "free online image tracer",
    "raster to vector converter", "bitmap to svg", "vectorize pixels online", "convert to scalable vector graphics",
    "best free online image to svg converter", "how to convert png to svg without software", "online tool to vectorize a drawing",
    "what is the best way to convert a jpg to svg"
  ],
  authors: [{ name: "Nikunj Rohit", url: "https://your-portfolio-or-social-link.com" }],
  creator: "Nikunj Rohit",
  alternates: {
    canonical: "/",
  },
  openGraph: {
    title: "Free Online Image to SVG Converter",
    description: "Instantly convert your raster images (PNG, JPG) into clean, scalable SVG vector graphics. Free, fast, and no registration required.",
    type: "website",
    locale: "en_US",
    url: "/",
    images: [
      {
        url: '/og-image.png',
        width: 1200,
        height: 630,
        alt: 'Online Image to SVG Converter',
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Free Online Image to SVG Converter",
    description: "Instantly convert your raster images (PNG, JPG) into clean, scalable SVG vector graphics. Free, fast, and no registration required.",
    images: ['/og-image.png'],
  },
  robots: "index, follow",
  icons: {
    icon: [
      { url: "/paint-palette.gif?v=1", type: "image/gif" },
      "/favicon.ico",
    ],
    shortcut: [
      { url: "/paint-palette.gif?v=1", type: "image/gif" },
    ],
    apple: "/apple-touch-icon.png?v=2",
  },
  category: "technology",
};

export const viewport = {
  width: 'device-width',
  initialScale: 1,
  themeColor: '#ffffff',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body suppressHydrationWarning className="antialiased">
        {children}
      </body>
    </html>
  );
}
