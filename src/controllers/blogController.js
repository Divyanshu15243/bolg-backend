const { PrismaClient } = require("@prisma/client");
const { generateSlug, calculateReadingTime, calculateSeoScore, paginate } = require("../utils/helpers");
const prisma = new PrismaClient();

const resolveSite = async (req) => {
  const apiKey = req.headers["x-api-key"] || req.query.apiKey;
  if (apiKey) {
    const site = await prisma.site.findUnique({ where: { apiKey } });
    return site?.id || null;
  }
  return req.query.siteId || req.body.siteId || null;
};

exports.getAll = async (req, res) => {
  try {
    const siteId = await resolveSite(req);
    const { search, category, status, tag, sort = "newest", page, limit } = req.query;
    const { skip, take, page: p, limit: l } = paginate(page, limit);
    const where = {};
    if (siteId) where.siteId = siteId;
    if (search) where.OR = [{ title: { contains: search, mode: "insensitive" } }, { excerpt: { contains: search, mode: "insensitive" } }];
    if (category) where.category = { slug: category };
    if (status) where.status = status;
    if (tag) where.tags = { some: { tag: { slug: tag } } };
    const orderBy = sort === "oldest" ? { createdAt: "asc" } : sort === "popular" ? { views: "desc" } : sort === "title" ? { title: "asc" } : { createdAt: "desc" };
    const [blogs, total] = await Promise.all([
      prisma.blog.findMany({ where, skip, take, orderBy, include: { author: { select: { id: true, name: true, avatar: true } }, category: { select: { id: true, name: true, slug: true } }, tags: { include: { tag: true } }, site: { select: { id: true, name: true, domain: true } } } }),
      prisma.blog.count({ where }),
    ]);
    res.json({ blogs: blogs.map((b) => ({ ...b, tags: b.tags.map((t) => t.tag) })), pagination: { page: p, limit: l, total, pages: Math.ceil(total / l) } });
  } catch (err) { res.status(500).json({ error: err.message }); }
};

exports.getPublished = async (req, res) => {
  try {
    const siteId = await resolveSite(req);
    const { search, category, tag, sort = "newest", page, limit } = req.query;
    const { skip, take, page: p, limit: l } = paginate(page, limit);
    const where = { status: "published", publishedAt: { lte: new Date() } };
    if (siteId) where.siteId = siteId;
    if (search) where.OR = [{ title: { contains: search, mode: "insensitive" } }, { excerpt: { contains: search, mode: "insensitive" } }];
    if (category) where.category = { slug: category };
    if (tag) where.tags = { some: { tag: { slug: tag } } };
    const orderBy = sort === "oldest" ? { publishedAt: "asc" } : sort === "popular" ? { views: "desc" } : { publishedAt: "desc" };
    const [blogs, total] = await Promise.all([
      prisma.blog.findMany({ where, skip, take, orderBy, include: { author: { select: { id: true, name: true, avatar: true } }, category: { select: { id: true, name: true, slug: true } }, tags: { include: { tag: true } } } }),
      prisma.blog.count({ where }),
    ]);
    res.json({ blogs: blogs.map((b) => ({ ...b, tags: b.tags.map((t) => t.tag) })), pagination: { page: p, limit: l, total, pages: Math.ceil(total / l) } });
  } catch (err) { res.status(500).json({ error: err.message }); }
};

exports.getBySlug = async (req, res) => {
  try {
    const blog = await prisma.blog.findUnique({ where: { slug: req.params.slug }, include: { author: { select: { id: true, name: true, avatar: true, bio: true } }, category: { select: { id: true, name: true, slug: true } }, tags: { include: { tag: true } }, comments: { where: { isApproved: true }, orderBy: { createdAt: "desc" } } } });
    if (!blog) return res.status(404).json({ error: "Blog not found" });
    await prisma.blog.update({ where: { id: blog.id }, data: { views: { increment: 1 } } });
    res.json({ blog: { ...blog, tags: blog.tags.map((t) => t.tag) } });
  } catch (err) { res.status(500).json({ error: err.message }); }
};

exports.create = async (req, res) => {
  try {
    const { title, content, excerpt, categoryId, tagIds = [], featuredImage, status, scheduledAt, isFeatured, showOnHomepage, metaTitle, metaDescription, metaKeywords, canonicalUrl, ogTitle, ogDescription, ogImage, schemaType, siteId } = req.body;
    if (!siteId) return res.status(400).json({ error: "siteId is required" });
    const slug = generateSlug(title);
    const existingSlug = await prisma.blog.findUnique({ where: { slug } });
    const finalSlug = existingSlug ? `${slug}-${Date.now()}` : slug;
    const readingTime = calculateReadingTime(content);
    const blogData = { title, slug: finalSlug, excerpt, content, featuredImage, status: status || "draft", publishedAt: status === "published" ? new Date() : null, scheduledAt: scheduledAt ? new Date(scheduledAt) : null, isFeatured: isFeatured || false, showOnHomepage: showOnHomepage || false, readingTime, metaTitle, metaDescription, metaKeywords, canonicalUrl, ogTitle, ogDescription, ogImage, schemaType, authorId: req.user.id, categoryId, siteId };
    blogData.seoScore = calculateSeoScore(blogData);
    const blog = await prisma.blog.create({ data: blogData, include: { author: { select: { id: true, name: true, avatar: true } }, category: { select: { id: true, name: true, slug: true } } } });
    if (tagIds.length) await prisma.blogTag.createMany({ data: tagIds.map((tagId) => ({ blogId: blog.id, tagId })) });
    const fullBlog = await prisma.blog.findUnique({ where: { id: blog.id }, include: { author: { select: { id: true, name: true, avatar: true } }, category: { select: { id: true, name: true, slug: true } }, tags: { include: { tag: true } } } });
    res.status(201).json({ blog: { ...fullBlog, tags: fullBlog.tags.map((t) => t.tag) } });
  } catch (err) { res.status(500).json({ error: err.message }); }
};

exports.update = async (req, res) => {
  try {
    const { id } = req.params;
    const existing = await prisma.blog.findUnique({ where: { id } });
    if (!existing) return res.status(404).json({ error: "Blog not found" });
    if (req.user.role === "writer" && existing.authorId !== req.user.id) return res.status(403).json({ error: "Not authorized" });
    const { tagIds, ...data } = req.body;
    if (data.title && data.title !== existing.title) data.slug = generateSlug(data.title);
    if (data.content) data.readingTime = calculateReadingTime(data.content);
    if (data.status === "published" && existing.status !== "published") data.publishedAt = new Date();
    data.seoScore = calculateSeoScore({ ...existing, ...data });
    const blog = await prisma.blog.update({ where: { id }, data });
    if (tagIds) {
      await prisma.blogTag.deleteMany({ where: { blogId: id } });
      if (tagIds.length) await prisma.blogTag.createMany({ data: tagIds.map((tagId) => ({ blogId: id, tagId })) });
    }
    const fullBlog = await prisma.blog.findUnique({ where: { id }, include: { author: { select: { id: true, name: true, avatar: true } }, category: { select: { id: true, name: true, slug: true } }, tags: { include: { tag: true } } } });
    res.json({ blog: { ...fullBlog, tags: fullBlog.tags.map((t) => t.tag) } });
  } catch (err) { res.status(500).json({ error: err.message }); }
};

exports.remove = async (req, res) => {
  try {
    const { id } = req.params;
    const blog = await prisma.blog.findUnique({ where: { id } });
    if (!blog) return res.status(404).json({ error: "Blog not found" });
    if (req.user.role === "writer" && blog.authorId !== req.user.id) return res.status(403).json({ error: "Not authorized" });
    await prisma.blog.delete({ where: { id } });
    res.json({ message: "Blog deleted" });
  } catch (err) { res.status(500).json({ error: err.message }); }
};

exports.bulkAction = async (req, res) => {
  try {
    const { ids, action, categoryId } = req.body;
    if (!ids?.length) return res.status(400).json({ error: "No blog IDs provided" });
    let result;
    switch (action) {
      case "publish": result = await prisma.blog.updateMany({ where: { id: { in: ids } }, data: { status: "published", publishedAt: new Date() } }); break;
      case "unpublish": result = await prisma.blog.updateMany({ where: { id: { in: ids } }, data: { status: "draft" } }); break;
      case "delete": result = await prisma.blog.deleteMany({ where: { id: { in: ids } } }); break;
      case "move_category": if (!categoryId) return res.status(400).json({ error: "Category ID required" }); result = await prisma.blog.updateMany({ where: { id: { in: ids } }, data: { categoryId } }); break;
      default: return res.status(400).json({ error: "Invalid action" });
    }
    res.json({ message: `Bulk ${action} completed`, count: result.count });
  } catch (err) { res.status(500).json({ error: err.message }); }
};

exports.getFeatured = async (req, res) => {
  try {
    const blogs = await prisma.blog.findMany({ where: { status: "published", isFeatured: true }, take: 5, orderBy: { publishedAt: "desc" }, include: { author: { select: { id: true, name: true, avatar: true } }, category: { select: { id: true, name: true, slug: true } } } });
    res.json({ blogs });
  } catch (err) { res.status(500).json({ error: err.message }); }
};

exports.getRelated = async (req, res) => {
  try {
    const blog = await prisma.blog.findUnique({ where: { slug: req.params.slug }, include: { tags: true } });
    if (!blog) return res.status(404).json({ error: "Blog not found" });
    const related = await prisma.blog.findMany({ where: { status: "published", id: { not: blog.id }, OR: [{ categoryId: blog.categoryId }, { tags: { some: { tagId: { in: blog.tags.map((t) => t.tagId) } } } }] }, take: 4, orderBy: { publishedAt: "desc" }, include: { author: { select: { id: true, name: true, avatar: true } }, category: { select: { id: true, name: true, slug: true } } } });
    res.json({ blogs: related });
  } catch (err) { res.status(500).json({ error: err.message }); }
};
