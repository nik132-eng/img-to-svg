import { MetadataRoute } from 'next';

const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://img-to-svg-converter-steel.vercel.app';

const formats = ['png', 'jpg', 'jpeg', 'gif', 'bmp', 'webp'] as const;

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();

  const staticPages: MetadataRoute.Sitemap = [
    {
      url: `${baseUrl}/`,
      lastModified: now,
      changeFrequency: 'weekly',
      priority: 1,
    },
  ];

  const landingPages: MetadataRoute.Sitemap = formats.map((f) => ({
    url: `${baseUrl}/${f}-to-svg`,
    lastModified: now,
    changeFrequency: 'weekly',
    priority: 0.9,
  }));

  return [...staticPages, ...landingPages];
}


