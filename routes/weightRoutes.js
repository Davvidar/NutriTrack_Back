const express = require("express");
const {
  getHistorialPeso,
  getMediaSemanalPeso
} = require("../controllers/weightController");

const authMiddleware = require("../middlewares/authMiddleware");

const router = express.Router();

router.get("/historial", authMiddleware, getHistorialPeso);
router.get("/media-semanal", authMiddleware, getMediaSemanalPeso);

module.exports = router;
