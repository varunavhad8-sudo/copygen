const fs = require('fs');
const path = require('path');

const BASE_URL = 'https://copygen.in';

const routes = [
  '',
  '/about',
  '/services',
  '/work',
  '/contact',
  '/privacy',
  '/terms',
  '/login',
  '/signup'
];

const generateSitemap = () => {
  const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  ${routes
    .map((route) => {
      return `
  <url>
    <loc>${BASE_URL}${route}</loc>
    <lastmod>${new Date().toISOString().split('T')[0]}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>${route === '' ? '1.0' : '0.8'}</priority>
  </url>`;
    })
    .join('')}
</urlset>`;

  const publicPath = path.join(__dirname, '../../public/sitemap.xml');
  
  try {
    fs.writeFileSync(publicPath, sitemap);
    console.log('✅ Sitemap generated successfully at:', publicPath);
  } catch (error) {
    console.error('❌ Error generating sitemap:', error);
  }
};

generateSitemap();


