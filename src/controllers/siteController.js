const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

exports.getAll = async (req, res) => {
  try {
    const sites = await prisma.site.findMany({ orderBy: { createdAt: "desc" } });
    res.json({ sites });
  } catch (err) { res.status(500).json({ error: err.message }); }
};

exports.create = async (req, res) => {
  try {
    const { name, domain } = req.body;
    if (!name || !domain) return res.status(400).json({ error: "Name and domain are required" });
    const site = await prisma.site.create({ data: { name, domain } });
    res.status(201).json({ site });
  } catch (err) {
    if (err.code === "P2002") return res.status(409).json({ error: "Domain already exists" });
    res.status(500).json({ error: err.message });
  }
};

exports.update = async (req, res) => {
  try {
    const site = await prisma.site.update({ where: { id: req.params.id }, data: req.body });
    res.json({ site });
  } catch (err) { res.status(500).json({ error: err.message }); }
};

exports.remove = async (req, res) => {
  try {
    const id = req.params.id;
    // Delete in order to respect foreign key constraints
    await prisma.blogTag.deleteMany({ where: { blog: { siteId: id } } });
    await prisma.comment.deleteMany({ where: { blog: { siteId: id } } });
    await prisma.blog.deleteMany({ where: { siteId: id } });
    await prisma.category.deleteMany({ where: { siteId: id } });
    await prisma.site.delete({ where: { id } });
    res.json({ message: "Site deleted" });
  } catch (err) { res.status(500).json({ error: err.message }); }
};

exports.regenerateKey = async (req, res) => {
  try {
    const { v4: uuidv4 } = require("uuid");
    const site = await prisma.site.update({ where: { id: req.params.id }, data: { apiKey: uuidv4() } });
    res.json({ site });
  } catch (err) { res.status(500).json({ error: err.message }); }
};
