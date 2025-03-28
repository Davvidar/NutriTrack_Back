const express = require("express");
const { 
  createProduct, 
  getProducts, 
  getProductById, 
  updateProduct, 
  deleteProduct 
} = require("../controllers/productController");
const authMiddleware = require("../middlewares/authMiddleware");

const router = express.Router();

// Rutas protegidas por autenticación
router.get("/", authMiddleware, getProducts);
router.post("/", authMiddleware, createProduct);
router.get("/:id", authMiddleware, getProductById);
router.put("/:id", authMiddleware, updateProduct);
router.delete("/:id", authMiddleware, deleteProduct);

module.exports = router;
