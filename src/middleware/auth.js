const jwt = require("jsonwebtoken");
const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

const authenticate = async (req, res, next) => {
  try {
    const token = req.headers.authorization?.split(" ")[1];
    if (!token) return res.status(401).json({ error: "Authentication required" });
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await prisma.user.findUnique({ where: { id: decoded.userId } });
    if (!user || !user.isActive) return res.status(401).json({ error: "Invalid or inactive user" });
    req.user = user;
    next();
  } catch (err) {
    res.status(401).json({ error: "Invalid token" });
  }
};

const roleHierarchy = { super_admin: 4, admin: 3, editor: 2, writer: 1 };

const authorize = (...roles) => (req, res, next) => {
  const userLevel = roleHierarchy[req.user.role] || 0;
  const requiredLevel = Math.min(...roles.map((r) => roleHierarchy[r] || 0));
  if (userLevel < requiredLevel) return res.status(403).json({ error: "Insufficient permissions" });
  next();
};

module.exports = { authenticate, authorize };
