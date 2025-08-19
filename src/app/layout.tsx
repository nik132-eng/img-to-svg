import type { Metadata } from "next";
import "./globals.css";

const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "https://img-to-svg-converter-steel.vercel.app";

export const metadata: Metadata = {
  metadataBase: new URL(baseUrl),
  title: {
    default: "Free Image to SVG Converter Online (JPG, PNG) - Convert to Vector Instantly",
    template: "%s | Free Image to SVG Converter",
  },
  description: "Convert JPG, PNG, or GIF images to SVG vector format online for free. No software needed. Fast, easy, and privacy-friendly. Transform raster images to scalable vectors instantly.",
  keywords: [
    // Core Actions & File Types
    "convert image to svg",
    "jpg to svg converter", 
    "png to svg online",
    "free image to vector converter",
    "svg converter online",
    "image to svg",
    "convert to svg",
    "svg converter",
    "svg generator",
    "png to svg",
    "jpg to svg",
    "jpeg to svg",
    "gif to svg",
    "bmp to svg",
    "webp to svg",
    "picture to svg",
    "photo to svg",
    // User Problem / Intent (Long-tail keywords)
    "vectorize image",
    "vectorize logo",
    "vectorize drawing",
    "convert logo to vector",
    "create svg from image",
    "turn image into svg",
    "make image scalable",
    "raster to vector",
    "bitmap to vector",
    "trace image online",
    "image tracing tool",
    // "Free" and "Online" Modifiers (High-traffic terms)
    "free svg converter",
    "online image to svg converter",
    "png to svg online free",
    "free vectorizer",
    // Use Case Specific
    "svg for cricut",
    "svg for laser cutting",
    "convert image for illustrator",
    "svg for web design",
    "scalable icon generator",
    // Technical & Broader Terms
    "SVG",
    "Scalable Vector Graphics",
    "vector graphics",
    "vector conversion",
    "vector art",
    "path conversion",
    "svg optimization",
    "graphics converter"
  ],
  authors: [{ name: "Nikunj Rohit", url: "https://x.com/nikunj_rohit10" }],
  creator: "Nikunj Rohit",
  alternates: {
    canonical: "/",
  },
  openGraph: {
    title: "Free Image to SVG Converter Online (JPG, PNG) - Convert to Vector Instantly",
    description: "Convert JPG, PNG, or GIF images to SVG vector format online for free. No software needed. Fast, easy, and privacy-friendly.",
    type: "website",
    locale: "en_US",
    url: "/",
    images: [
      {
        url: '/og-image.png',
        width: 1200,
        height: 630,
        alt: 'Free Online Image to SVG Converter - Convert JPG, PNG to Vector',
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Free Image to SVG Converter Online (JPG, PNG) - Convert to Vector Instantly",
    description: "Convert JPG, PNG, or GIF images to SVG vector format online for free. No software needed. Fast, easy, and privacy-friendly.",
    images: ['/og-image.png'],
    creator: '@nikunj_rohit10',
  },
  robots: "index, follow",
  icons: {
    icon: [
      { url: "/paint-palette.gif", type: "image/gif" },
      { url: "/favicon.ico", type: "image/x-icon" },
      { url: "/favicon-16x16.png", sizes: "16x16", type: "image/png" },
      { url: "/favicon-32x32.png", sizes: "32x32", type: "image/png" },
    ],
    shortcut: [
      { url: "/paint-palette.gif", type: "image/gif" },
      "/favicon.ico",
    ],
    apple: [
      { url: "/apple-touch-icon.png", sizes: "180x180", type: "image/png" },
    ],
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
      <head>
        <link rel="icon" type="image/x-icon" href="/favicon.ico" />
        <link rel="icon" type="image/gif" href="/paint-palette.gif" />
        <link rel="apple-touch-icon" sizes="180x180" href="/apple-touch-icon.png" />
        <link rel="icon" type="image/png" sizes="32x32" href="/favicon-32x32.png" />
        <link rel="icon" type="image/png" sizes="16x16" href="/favicon-16x16.png" />
      </head>
      <body suppressHydrationWarning className="antialiased">
        {children}
      </body>
    </html>
  );
}
