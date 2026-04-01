const router = require("express").Router();
const c = require("../controllers/userController");
const { authenticate, authorize } = require("../middleware/auth");
router.get("/", authenticate, authorize("admin"), c.getAll);
router.post("/", authenticate, authorize("admin"), c.create);
router.put("/:id", authenticate, authorize("admin"), c.update);
router.delete("/:id", authenticate, authorize("super_admin"), c.remove);
module.exports = router;
