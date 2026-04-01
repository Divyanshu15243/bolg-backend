const router = require("express").Router();
const c = require("../controllers/seoController");
const { authenticate, authorize } = require("../middleware/auth");
router.get("/", authenticate, authorize("admin"), c.get);
router.put("/", authenticate, authorize("admin"), c.update);
module.exports = router;
