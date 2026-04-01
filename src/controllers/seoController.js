const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

exports.get = async (req, res) => {
  try {
    let settings = await prisma.seoSettings.findFirst();
    if (!settings) settings = await prisma.seoSettings.create({ data: { siteName: "Blog CMS" } });
    res.json({ settings });
  } catch (err) { res.status(500).json({ error: err.message }); }
};

exports.update = async (req, res) => {
  try {
    let settings = await prisma.seoSettings.findFirst();
    if (!settings) settings = await prisma.seoSettings.create({ data: { siteName: "Blog CMS" } });
    const updated = await prisma.seoSettings.update({ where: { id: settings.id }, data: req.body });
    res.json({ settings: updated });
  } catch (err) { res.status(500).json({ error: err.message }); }
};
