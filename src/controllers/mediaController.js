const { PrismaClient } = require("@prisma/client");
const path = require("path");
const fs = require("fs");
const { paginate } = require("../utils/helpers");
const prisma = new PrismaClient();

exports.getAll = async (req, res) => {
  try {
    const { page, limit, type } = req.query;
    const { skip, take, page: p, limit: l } = paginate(page, limit);
    const where = {};
    if (type) where.mimeType = { startsWith: type };
    const [media, total] = await Promise.all([
      prisma.media.findMany({ where, skip, take, orderBy: { createdAt: "desc" }, include: { uploadedBy: { select: { id: true, name: true } } } }),
      prisma.media.count({ where }),
    ]);
    res.json({ media, pagination: { page: p, limit: l, total, pages: Math.ceil(total / l) } });
  } catch (err) { res.status(500).json({ error: err.message }); }
};

exports.upload = async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: "No file uploaded" });
    const { filename, originalname, mimetype, size } = req.file;
    const url = `/uploads/${filename}`;
    const media = await prisma.media.create({ data: { filename, originalName: originalname, mimeType: mimetype, size, url, uploadedById: req.user.id } });
    res.status(201).json({ media });
  } catch (err) { res.status(500).json({ error: err.message }); }
};

exports.update = async (req, res) => {
  try {
    const { altText } = req.body;
    const media = await prisma.media.update({ where: { id: req.params.id }, data: { altText } });
    res.json({ media });
  } catch (err) { res.status(500).json({ error: err.message }); }
};

exports.remove = async (req, res) => {
  try {
    const media = await prisma.media.findUnique({ where: { id: req.params.id } });
    if (!media) return res.status(404).json({ error: "Media not found" });
    const filePath = path.join(__dirname, "../../uploads", media.filename);
    if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
    await prisma.media.delete({ where: { id: req.params.id } });
    res.json({ message: "Media deleted" });
  } catch (err) { res.status(500).json({ error: err.message }); }
};
