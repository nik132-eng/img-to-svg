import { Metadata } from 'next';
import { ThreeBackground } from '@/components/ThreeBackground';
import { UploadSection } from '@/components/UploadSection';
import { VisitorCounter } from '@/components/VisitorCounter';

const SUPPORTED_FORMATS = [
  'png',
  'jpg',
  'jpeg',
  'gif',
  'bmp',
  'webp',
] as const;

type SupportedFormat = typeof SUPPORTED_FORMATS[number];

function parseSlug(slug: string | undefined) {
  const normalized = (slug || '').toLowerCase();
  if (!normalized.endsWith('-to-svg')) return { from: undefined, isSupported: false };
  const from = normalized.replace('-to-svg', '');
  const isSupported = SUPPORTED_FORMATS.includes(from as SupportedFormat);
  return { from, isSupported } as { from: string | undefined; isSupported: boolean };
}

export async function generateStaticParams() {
  return SUPPORTED_FORMATS.map((format) => ({ slug: `${format}-to-svg` }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const { from, isSupported } = parseSlug(slug);

  const prettyFrom = from ? from.toUpperCase() : 'Image';
  const year = new Date().getFullYear();

  const title = isSupported
    ? `${prettyFrom} to SVG Converter (Free) | ${year}`
    : `Image to SVG Converter (Free) | ${year}`;

  const description = isSupported
    ? `Convert ${prettyFrom} to SVG online for free. High‑quality vectorization with advanced controls. Fast, no signup.`
    : 'Free online image to SVG converter. Vectorize PNG, JPG, JPEG, GIF, BMP, and WebP to clean, optimized SVGs.';

  const canonical = isSupported ? `/${slug}` : '/';

  return {
    title,
    description,
    alternates: { canonical },
    openGraph: { title, description, type: 'website', url: canonical },
    twitter: { card: 'summary_large_image', title, description },
  };
}

export default async function FormatLandingPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const { from, isSupported } = parseSlug(slug);

  return (
    <div className="min-h-screen relative">
      <ThreeBackground />
      <main className="relative z-10 container mx-auto px-4 py-10 space-y-8">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg overflow-hidden shadow">
              <img src="/paint-palette.gif" alt="Logo" className="w-full h-full object-contain" />
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-900">
              {isSupported ? (
                <span>{from!.toUpperCase()} to SVG Converter</span>
              ) : (
                <span>Image to SVG Converter</span>
              )}
            </h1>
          </div>
          <VisitorCounter />
        </div>

        <p className="text-gray-600 max-w-2xl">
          {isSupported
            ? `Upload a ${from!.toUpperCase()} file and instantly convert it to a clean, optimized SVG vector. Adjust advanced settings for perfect results.`
            : 'Upload your image and instantly convert it to a clean, optimized SVG vector. Adjust advanced settings for perfect results.'}
        </p>

        <UploadSection />

        <FormatLinks active={isSupported ? (from as SupportedFormat) : undefined} />

        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              '@context': 'https://schema.org',
              '@type': 'SoftwareApplication',
              name: isSupported ? `${from!.toUpperCase()} to SVG Converter` : 'Image to SVG Converter',
              applicationCategory: 'MultimediaApplication',
              operatingSystem: 'Web',
              offers: { '@type': 'Offer', price: '0', priceCurrency: 'USD' },
            }),
          }}
        />
      </main>
    </div>
  );
}

function FormatLinks({ active }: { active?: SupportedFormat }) {
  const links = SUPPORTED_FORMATS.map((fmt) => ({ label: `${fmt.toUpperCase()} to SVG`, href: `/${fmt}-to-svg` }));
  return (
    <div className="bg-white/70 backdrop-blur-sm border border-white/40 rounded-xl p-4">
      <div className="text-sm font-semibold text-gray-700 mb-3">Popular conversions</div>
      <div className="flex flex-wrap gap-2">
        {links.map((l) => (
          <a
            key={l.href}
            href={l.href}
            className={`px-3 py-1.5 rounded-full text-sm border transition-colors ${
              active && l.label.toLowerCase().startsWith(active)
                ? 'bg-blue-600 text-white border-blue-600'
                : 'bg-white text-gray-700 border-gray-200 hover:border-gray-300'
            }`}
          >
            {l.label}
          </a>
        ))}
      </div>
    </div>
  );
}

// UploadSection moved to a dedicated client component for reuse and cleaner SSR boundary


