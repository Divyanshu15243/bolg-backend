const router = require("express").Router();
const c = require("../controllers/commentController");
const { authenticate, authorize } = require("../middleware/auth");
router.get("/", authenticate, authorize("editor"), c.getAll);
router.post("/", c.create);
router.put("/:id/approve", authenticate, authorize("editor"), c.approve);
router.put("/:id/reject", authenticate, authorize("editor"), c.reject);
router.delete("/:id", authenticate, authorize("editor"), c.remove);
module.exports = router;
