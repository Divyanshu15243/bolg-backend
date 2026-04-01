const router = require("express").Router();
const c = require("../controllers/siteController");
const { authenticate, authorize } = require("../middleware/auth");

router.get("/", authenticate, c.getAll);
router.post("/", authenticate, authorize("admin"), c.create);
router.put("/:id", authenticate, authorize("admin"), c.update);
router.delete("/:id", authenticate, authorize("super_admin"), c.remove);
router.post("/:id/regenerate-key", authenticate, authorize("admin"), c.regenerateKey);

module.exports = router;
