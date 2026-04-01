const { PrismaClient } = require("@prisma/client");
const { generateSlug, paginate } = require("../utils/helpers");
const prisma = new PrismaClient();

// Resolve siteId from API key header or query param
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
    const where = siteId ? { siteId } : {};
    const categories = await prisma.category.findMany({ where, orderBy: { sortOrder: "asc" }, include: { _count: { select: { blogs: true } } } });
    res.json({ categories });
  } catch (err) { res.status(500).json({ error: err.message }); }
};

exports.getBySlug = async (req, res) => {
  try {
    const siteId = await resolveSite(req);
    const { page, limit } = req.query;
    const { skip, take, page: p, limit: l } = paginate(page, limit);
    const where = { slug: req.params.slug, ...(siteId ? { siteId } : {}) };
    const category = await prisma.category.findFirst({ where });
    if (!category) return res.status(404).json({ error: "Category not found" });
    const blogWhere = { categoryId: category.id, status: "published" };
    const [blogs, total] = await Promise.all([
      prisma.blog.findMany({ where: blogWhere, skip, take, orderBy: { publishedAt: "desc" }, include: { author: { select: { id: true, name: true, avatar: true } }, category: { select: { id: true, name: true, slug: true } }, tags: { include: { tag: true } } } }),
      prisma.blog.count({ where: blogWhere }),
    ]);
    res.json({ category, blogs: blogs.map((b) => ({ ...b, tags: b.tags.map((t) => t.tag) })), pagination: { page: p, limit: l, total, pages: Math.ceil(total / l) } });
  } catch (err) { res.status(500).json({ error: err.message }); }
};

exports.create = async (req, res) => {
  try {
    const { name, description, image, metaTitle, metaDescription, isActive, sortOrder, siteId } = req.body;
    if (!siteId) return res.status(400).json({ error: "siteId is required" });
    const slug = generateSlug(name);
    const category = await prisma.category.create({ data: { name, slug, description, image, metaTitle, metaDescription, isActive: isActive !== false, sortOrder: sortOrder || 0, siteId } });
    res.status(201).json({ category });
  } catch (err) { res.status(500).json({ error: err.message }); }
};

exports.update = async (req, res) => {
  try {
    const data = { ...req.body };
    if (data.name) data.slug = generateSlug(data.name);
    const category = await prisma.category.update({ where: { id: req.params.id }, data });
    res.json({ category });
  } catch (err) { res.status(500).json({ error: err.message }); }
};

exports.remove = async (req, res) => {
  try {
    const blogCount = await prisma.blog.count({ where: { categoryId: req.params.id } });
    if (blogCount > 0) return res.status(400).json({ error: `Cannot delete: ${blogCount} blogs use this category` });
    await prisma.category.delete({ where: { id: req.params.id } });
    res.json({ message: "Category deleted" });
  } catch (err) { res.status(500).json({ error: err.message }); }
};
