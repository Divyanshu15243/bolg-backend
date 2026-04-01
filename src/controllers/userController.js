const { PrismaClient } = require("@prisma/client");
const bcrypt = require("bcryptjs");
const { paginate } = require("../utils/helpers");
const prisma = new PrismaClient();

exports.getAll = async (req, res) => {
  try {
    const { role, search, page, limit } = req.query;
    const { skip, take, page: p, limit: l } = paginate(page, limit);
    const where = {};
    if (role) where.role = role;
    if (search) where.OR = [{ name: { contains: search, mode: "insensitive" } }, { email: { contains: search, mode: "insensitive" } }];
    const [users, total] = await Promise.all([
      prisma.user.findMany({ where, skip, take, orderBy: { createdAt: "desc" }, select: { id: true, email: true, name: true, role: true, avatar: true, isActive: true, createdAt: true, _count: { select: { blogs: true } } } }),
      prisma.user.count({ where }),
    ]);
    res.json({ users, pagination: { page: p, limit: l, total, pages: Math.ceil(total / l) } });
  } catch (err) { res.status(500).json({ error: err.message }); }
};

exports.create = async (req, res) => {
  try {
    const { email, password, name, role } = req.body;
    const hashed = await bcrypt.hash(password, 12);
    const user = await prisma.user.create({ data: { email, password: hashed, name, role: role || "writer" }, select: { id: true, email: true, name: true, role: true, createdAt: true } });
    res.status(201).json({ user });
  } catch (err) { res.status(500).json({ error: err.message }); }
};

exports.update = async (req, res) => {
  try {
    const { id } = req.params;
    const { password, ...data } = req.body;
    if (password) data.password = await bcrypt.hash(password, 12);
    const user = await prisma.user.update({ where: { id }, data, select: { id: true, email: true, name: true, role: true, avatar: true, isActive: true } });
    res.json({ user });
  } catch (err) { res.status(500).json({ error: err.message }); }
};

exports.remove = async (req, res) => {
  try {
    if (req.params.id === req.user.id) return res.status(400).json({ error: "Cannot delete yourself" });
    await prisma.user.delete({ where: { id: req.params.id } });
    res.json({ message: "User deleted" });
  } catch (err) { res.status(500).json({ error: err.message }); }
};
