const router = require("express").Router();
const { generateDescription } = require("../controllers/aiController");
const { authenticate } = require("../middleware/auth");

router.post("/generate-description", authenticate, generateDescription);

module.exports = router;
