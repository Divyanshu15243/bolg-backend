const { PrismaClient } = require("@prisma/client");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const prisma = new PrismaClient();

const generateToken = (userId) => jwt.sign({ userId }, process.env.JWT_SECRET, { expiresIn: process.env.JWT_EXPIRES_IN || "7d" });

exports.register = async (req, res) => {
  try {
    const { email, password, name } = req.body;
    if (!email || !password || !name) return res.status(400).json({ error: "Email, password and name are required" });
    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) return res.status(409).json({ error: "Email already registered" });
    const hashed = await bcrypt.hash(password, 12);
    const user = await prisma.user.create({ data: { email, password: hashed, name, role: "writer" } });
    const token = generateToken(user.id);
    res.status(201).json({ token, user: { id: user.id, email: user.email, name: user.name, role: user.role, avatar: user.avatar } });
  } catch (err) { res.status(500).json({ error: err.message }); }
};

exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) return res.status(400).json({ error: "Email and password are required" });
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user || !user.isActive) return res.status(401).json({ error: "Invalid credentials" });
    const valid = await bcrypt.compare(password, user.password);
    if (!valid) return res.status(401).json({ error: "Invalid credentials" });
    const token = generateToken(user.id);
    res.json({ token, user: { id: user.id, email: user.email, name: user.name, role: user.role, avatar: user.avatar, bio: user.bio } });
  } catch (err) { res.status(500).json({ error: err.message }); }
};

exports.me = async (req, res) => {
  const { password, ...user } = req.user;
  res.json({ user });
};

exports.updateProfile = async (req, res) => {
  try {
    const { name, bio, avatar } = req.body;
    const user = await prisma.user.update({ where: { id: req.user.id }, data: { name, bio, avatar }, select: { id: true, email: true, name: true, role: true, avatar: true, bio: true } });
    res.json({ user });
  } catch (err) { res.status(500).json({ error: err.message }); }
};

exports.changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    const valid = await bcrypt.compare(currentPassword, req.user.password);
    if (!valid) return res.status(400).json({ error: "Current password is incorrect" });
    const hashed = await bcrypt.hash(newPassword, 12);
    await prisma.user.update({ where: { id: req.user.id }, data: { password: hashed } });
    res.json({ message: "Password updated successfully" });
  } catch (err) { res.status(500).json({ error: err.message }); }
};
