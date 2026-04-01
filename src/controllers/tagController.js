const { PrismaClient } = require("@prisma/client");
const { generateSlug, paginate } = require("../utils/helpers");
const prisma = new PrismaClient();

exports.getAll = async (req, res) => {
  try {
    const tags = await prisma.tag.findMany({ orderBy: { name: "asc" }, include: { _count: { select: { blogs: true } } } });
    res.json({ tags });
  } catch (err) { res.status(500).json({ error: err.message }); }
};

exports.getBySlug = async (req, res) => {
  try {
    const { page, limit } = req.query;
    const { skip, take, page: p, limit: l } = paginate(page, limit);
    const tag = await prisma.tag.findUnique({ where: { slug: req.params.slug } });
    if (!tag) return res.status(404).json({ error: "Tag not found" });
    const [blogTags, total] = await Promise.all([
      prisma.blogTag.findMany({ where: { tagId: tag.id, blog: { status: "published" } }, skip, take, include: { blog: { include: { author: { select: { id: true, name: true, avatar: true } }, category: { select: { id: true, name: true, slug: true } }, tags: { include: { tag: true } } } } }, orderBy: { blog: { publishedAt: "desc" } } }),
      prisma.blogTag.count({ where: { tagId: tag.id, blog: { status: "published" } } }),
    ]);
    res.json({ tag, blogs: blogTags.map((bt) => ({ ...bt.blog, tags: bt.blog.tags.map((t) => t.tag) })), pagination: { page: p, limit: l, total, pages: Math.ceil(total / l) } });
  } catch (err) { res.status(500).json({ error: err.message }); }
};

exports.create = async (req, res) => {
  try {
    const { name } = req.body;
    const tag = await prisma.tag.create({ data: { name, slug: generateSlug(name) } });
    res.status(201).json({ tag });
  } catch (err) { res.status(500).json({ error: err.message }); }
};

exports.update = async (req, res) => {
  try {
    const { name } = req.body;
    const tag = await prisma.tag.update({ where: { id: req.params.id }, data: { name, slug: generateSlug(name) } });
    res.json({ tag });
  } catch (err) { res.status(500).json({ error: err.message }); }
};

exports.remove = async (req, res) => {
  try {
    await prisma.tag.delete({ where: { id: req.params.id } });
    res.json({ message: "Tag deleted" });
  } catch (err) { res.status(500).json({ error: err.message }); }
};
