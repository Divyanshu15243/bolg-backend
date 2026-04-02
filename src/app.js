require("dotenv").config();
const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const rateLimit = require("express-rate-limit");
const path = require("path");

const authRoutes = require("./routes/auth");
const blogRoutes = require("./routes/blogs");
const categoryRoutes = require("./routes/categories");
const tagRoutes = require("./routes/tags");
const commentRoutes = require("./routes/comments");
const mediaRoutes = require("./routes/media");
const userRoutes = require("./routes/users");
const seoRoutes = require("./routes/seo");
const dashboardRoutes = require("./routes/dashboard");
const sitemapRoutes = require("./routes/sitemap");
const siteRoutes = require("./routes/sites");

const app = express();

app.use(helmet());
app.use(cors({ origin: (origin, cb) => cb(null, true), credentials: true }));
app.use(express.json({ limit: "10mb" }));
app.use("/uploads", express.static(path.join(__dirname, "../uploads")));

const limiter = rateLimit({ windowMs: 15 * 60 * 1000, max: 500 });
app.use("/api/", limiter);

app.use("/api/auth", authRoutes);
app.use("/api/blogs", blogRoutes);
app.use("/api/categories", categoryRoutes);
app.use("/api/tags", tagRoutes);
app.use("/api/comments", commentRoutes);
app.use("/api/media", mediaRoutes);
app.use("/api/users", userRoutes);
app.use("/api/seo", seoRoutes);
app.use("/api/dashboard", dashboardRoutes);
app.use("/api", sitemapRoutes);
app.use("/api/sites", siteRoutes);

app.get("/api/health", (req, res) => res.json({ status: "ok", timestamp: new Date().toISOString() }));

app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(err.status || 500).json({ error: err.message || "Internal server error" });
});

module.exports = app;
