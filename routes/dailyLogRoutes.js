const express = require("express");
const {
  createDailyLog,
  getDailyLogs,
  getDailyLogById,
  updateDailyLog,
  getDailyLogByDate,
  getResumenNutricional
} = require("../controllers/dailyLogController");


const authMiddleware = require("../middlewares/authMiddleware");
const validateFields = require("../middlewares/validateFields");
const dailyLogValidator = require("../middlewares/dailyLogValidator");

const router = express.Router();

router.get("/por-fecha", authMiddleware, getDailyLogByDate);
router.get("/resumen", authMiddleware, getResumenNutricional);

router.post("/", authMiddleware, dailyLogValidator, validateFields, createDailyLog);
router.put("/:id", authMiddleware, dailyLogValidator, validateFields, updateDailyLog);

router.get("/", authMiddleware, getDailyLogs);
router.get("/:id", authMiddleware, getDailyLogById);



module.exports = router;
