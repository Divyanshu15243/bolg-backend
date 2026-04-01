const router = require("express").Router();
const { getStats } = require("../controllers/dashboardController");
const { authenticate, authorize } = require("../middleware/auth");
router.get("/stats", authenticate, authorize("writer"), getStats);
module.exports = router;
