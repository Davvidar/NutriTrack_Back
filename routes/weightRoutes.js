const express = require("express");
const {
  getHistorialPeso,
  getMediaSemanalPeso,
  getMediasSemanales,       
  getComparacionSemanal     
} = require("../controllers/weightController");

const authMiddleware = require("../middlewares/authMiddleware");

const router = express.Router();


router.get("/historial", authMiddleware, getHistorialPeso);
router.get("/media-semanal", authMiddleware, getMediaSemanalPeso);
router.get("/medias-semanales", authMiddleware, getMediasSemanales);
router.get("/comparacion-semanal", authMiddleware, getComparacionSemanal);

module.exports = router;