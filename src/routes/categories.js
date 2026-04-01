const router = require("express").Router();
const c = require("../controllers/categoryController");
const { authenticate, authorize } = require("../middleware/auth");
router.get("/", c.getAll);
router.get("/:slug", c.getBySlug);
router.post("/", authenticate, authorize("editor"), c.create);
router.put("/:id", authenticate, authorize("editor"), c.update);
router.delete("/:id", authenticate, authorize("admin"), c.remove);
module.exports = router;
