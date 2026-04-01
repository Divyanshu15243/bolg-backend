const { PrismaClient } = require("@prisma/client");
const bcrypt = require("bcryptjs");
const prisma = new PrismaClient();

async function main() {
  const password = await bcrypt.hash("admin123", 12);

  const admin = await prisma.user.upsert({
    where: { email: "admin@blogcms.com" },
    update: {},
    create: { email: "admin@blogcms.com", password, name: "Super Admin", role: "super_admin", bio: "Platform administrator" },
  });

  // Default site
  const site = await prisma.site.upsert({
    where: { domain: "localhost" },
    update: {},
    create: { name: "My Blog", domain: "localhost" },
  });

  const categories = await Promise.all(
    [
      { name: "Technology", slug: "technology", description: "Tech news and tutorials" },
      { name: "Design", slug: "design", description: "UI/UX and graphic design" },
      { name: "Business", slug: "business", description: "Business strategies and insights" },
      { name: "Lifestyle", slug: "lifestyle", description: "Life tips and wellness" },
    ].map((c) =>
      prisma.category.upsert({
        where: { slug_siteId: { slug: c.slug, siteId: site.id } },
        update: {},
        create: { ...c, siteId: site.id },
      })
    )
  );

  const tags = await Promise.all(
    ["React", "Node.js", "CSS", "JavaScript", "TypeScript", "Prisma", "PostgreSQL", "AI"].map((name) =>
      prisma.tag.upsert({ where: { slug: name.toLowerCase().replace(/[^a-z0-9]+/g, "-") }, update: {}, create: { name, slug: name.toLowerCase().replace(/[^a-z0-9]+/g, "-") } })
    )
  );

  const blog = await prisma.blog.upsert({
    where: { slug: "getting-started-with-blog-cms" },
    update: {},
    create: {
      title: "Getting Started with Blog CMS",
      slug: "getting-started-with-blog-cms",
      excerpt: "Learn how to set up and use the Blog CMS platform effectively.",
      content: "<h2>Welcome to Blog CMS</h2><p>This is your first blog post. Start creating amazing content!</p>",
      status: "published",
      publishedAt: new Date(),
      isFeatured: true,
      showOnHomepage: true,
      readingTime: 3,
      seoScore: 85,
      authorId: admin.id,
      categoryId: categories[0].id,
      siteId: site.id,
    },
  });

  await prisma.blogTag.createMany({
    data: [
      { blogId: blog.id, tagId: tags[0].id },
      { blogId: blog.id, tagId: tags[3].id },
    ],
    skipDuplicates: true,
  });

  await prisma.seoSettings.upsert({
    where: { id: "default" },
    update: {},
    create: {
      id: "default",
      siteName: "Blog CMS",
      titleFormat: "%title% | %sitename%",
      defaultDescription: "A modern blog content management system",
      robotsTxt: "User-agent: *\nAllow: /\nDisallow: /admin\nSitemap: /sitemap.xml",
      enableSitemap: true,
    },
  });

  console.log("✅ Seed complete. Site API Key:", site.apiKey);
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
