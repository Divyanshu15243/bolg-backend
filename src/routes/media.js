const router = require("express").Router();
const c = require("../controllers/mediaController");
const { authenticate } = require("../middleware/auth");
const upload = require("../middleware/upload");
router.get("/", authenticate, c.getAll);
router.post("/upload", authenticate, upload.single("file"), c.upload);
router.put("/:id", authenticate, c.update);
router.delete("/:id", authenticate, c.remove);
module.exports = router;
