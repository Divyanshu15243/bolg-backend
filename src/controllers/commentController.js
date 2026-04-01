const { PrismaClient } = require("@prisma/client");
const { paginate } = require("../utils/helpers");
const prisma = new PrismaClient();

exports.getAll = async (req, res) => {
  try {
    const { status, page, limit } = req.query;
    const { skip, take, page: p, limit: l } = paginate(page, limit);
    const where = {};
    if (status === "approved") where.isApproved = true;
    else if (status === "pending") where.isApproved = false;
    const [comments, total] = await Promise.all([
      prisma.comment.findMany({ where, skip, take, orderBy: { createdAt: "desc" }, include: { blog: { select: { id: true, title: true, slug: true } } } }),
      prisma.comment.count({ where }),
    ]);
    res.json({ comments, pagination: { page: p, limit: l, total, pages: Math.ceil(total / l) } });
  } catch (err) { res.status(500).json({ error: err.message }); }
};

exports.create = async (req, res) => {
  try {
    const { blogId, content, authorName, authorEmail } = req.body;
    const comment = await prisma.comment.create({ data: { blogId, content, authorName, authorEmail, userId: req.user?.id, isApproved: !!req.user } });
    res.status(201).json({ comment });
  } catch (err) { res.status(500).json({ error: err.message }); }
};

exports.approve = async (req, res) => {
  try {
    const comment = await prisma.comment.update({ where: { id: req.params.id }, data: { isApproved: true } });
    res.json({ comment });
  } catch (err) { res.status(500).json({ error: err.message }); }
};

exports.reject = async (req, res) => {
  try {
    const comment = await prisma.comment.update({ where: { id: req.params.id }, data: { isApproved: false } });
    res.json({ comment });
  } catch (err) { res.status(500).json({ error: err.message }); }
};

exports.remove = async (req, res) => {
  try {
    await prisma.comment.delete({ where: { id: req.params.id } });
    res.json({ message: "Comment deleted" });
  } catch (err) { res.status(500).json({ error: err.message }); }
};
