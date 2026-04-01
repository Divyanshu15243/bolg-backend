const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

exports.getStats = async (req, res) => {
  try {
    const [totalBlogs, published, drafts, scheduled, totalCategories, totalTags, totalUsers, totalComments, pendingComments, totalViews, recentBlogs, popularBlogs] = await Promise.all([
      prisma.blog.count(),
      prisma.blog.count({ where: { status: "published" } }),
      prisma.blog.count({ where: { status: "draft" } }),
      prisma.blog.count({ where: { status: "scheduled" } }),
      prisma.category.count(),
      prisma.tag.count(),
      prisma.user.count(),
      prisma.comment.count(),
      prisma.comment.count({ where: { isApproved: false } }),
      prisma.blog.aggregate({ _sum: { views: true } }),
      prisma.blog.findMany({ take: 5, orderBy: { createdAt: "desc" }, select: { id: true, title: true, slug: true, status: true, createdAt: true, author: { select: { name: true } } } }),
      prisma.blog.findMany({ take: 5, where: { status: "published" }, orderBy: { views: "desc" }, select: { id: true, title: true, slug: true, views: true } }),
    ]);
    res.json({ stats: { totalBlogs, published, drafts, scheduled, totalCategories, totalTags, totalUsers, totalComments, pendingComments, totalViews: totalViews._sum.views || 0 }, recentBlogs, popularBlogs });
  } catch (err) { res.status(500).json({ error: err.message }); }
};
