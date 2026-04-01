const slugify = require("slugify");

const generateSlug = (text) => slugify(text, { lower: true, strict: true, trim: true });

const calculateReadingTime = (content) => {
  const text = content.replace(/<[^>]*>/g, "");
  const words = text.split(/\s+/).filter(Boolean).length;
  return Math.max(1, Math.ceil(words / 200));
};

const calculateSeoScore = (blog) => {
  let score = 0;
  if (blog.metaTitle && blog.metaTitle.length >= 30 && blog.metaTitle.length <= 60) score += 20;
  else if (blog.metaTitle) score += 10;
  if (blog.metaDescription && blog.metaDescription.length >= 120 && blog.metaDescription.length <= 160) score += 20;
  else if (blog.metaDescription) score += 10;
  if (blog.metaKeywords) score += 10;
  if (blog.featuredImage) score += 15;
  if (blog.excerpt && blog.excerpt.length >= 50) score += 10;
  else if (blog.excerpt) score += 5;
  if (blog.canonicalUrl) score += 10;
  if (blog.ogTitle && blog.ogDescription) score += 15;
  else if (blog.ogTitle || blog.ogDescription) score += 7;
  return Math.min(100, score);
};

const paginate = (page = 1, limit = 10) => {
  const p = Math.max(1, parseInt(page));
  const l = Math.min(100, Math.max(1, parseInt(limit)));
  return { skip: (p - 1) * l, take: l, page: p, limit: l };
};

module.exports = { generateSlug, calculateReadingTime, calculateSeoScore, paginate };
