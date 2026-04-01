const router = require("express").Router();
const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

router.get("/sitemap.xml", async (req, res) => {
  try {
    const settings = await prisma.seoSettings.findFirst();
    if (!settings?.enableSitemap) return res.status(404).send("Sitemap disabled");
    const blogs = await prisma.blog.findMany({ where: { status: "published" }, select: { slug: true, updatedAt: true } });
    const categories = await prisma.category.findMany({ where: { isActive: true }, select: { slug: true, updatedAt: true } });
    const baseUrl = process.env.FRONTEND_URL || "http://localhost:5173";
    let xml = '<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n';
    xml += `<url><loc>${baseUrl}</loc><changefreq>daily</changefreq><priority>1.0</priority></url>\n`;
    xml += `<url><loc>${baseUrl}/blogs</loc><changefreq>daily</changefreq><priority>0.8</priority></url>\n`;
    blogs.forEach((b) => { xml += `<url><loc>${baseUrl}/blogs/${b.slug}</loc><lastmod>${b.updatedAt.toISOString()}</lastmod><changefreq>weekly</changefreq><priority>0.7</priority></url>\n`; });
    categories.forEach((c) => { xml += `<url><loc>${baseUrl}/category/${c.slug}</loc><lastmod>${c.updatedAt.toISOString()}</lastmod><changefreq>weekly</changefreq><priority>0.6</priority></url>\n`; });
    xml += "</urlset>";
    res.header("Content-Type", "application/xml").send(xml);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.get("/robots.txt", async (req, res) => {
  try {
    const settings = await prisma.seoSettings.findFirst();
    res.header("Content-Type", "text/plain").send(settings?.robotsTxt || "User-agent: *\nAllow: /");
  } catch (err) { res.status(500).send("User-agent: *\nAllow: /"); }
});

module.exports = router;
