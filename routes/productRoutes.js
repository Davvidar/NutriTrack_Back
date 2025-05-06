const express = require("express");
const {
  createProduct,
  getProducts,
  getProductById,
  updateProduct,
  deleteProduct,
  getProductByBarcode,
  searchProducts,
  getProductosRecientes,
  cargarProductosMasivos
} = require("../controllers/productController");




const authMiddleware = require("../middlewares/authMiddleware");
const validateFields = require("../middlewares/validateFields");
const productValidator = require("../middlewares/productValidator");

const router = express.Router();
router.post("/cargar-masivos", authMiddleware, cargarProductosMasivos);

// Rutas específicas primero
router.get("/barcode/:codigoBarras", authMiddleware, getProductByBarcode);
router.get("/search", authMiddleware, searchProducts);
router.get("/recientes", authMiddleware, getProductosRecientes);

// Luego las generales
router.get("/", authMiddleware, getProducts);
router.get("/:id", authMiddleware, getProductById);

// CRUD
router.post("/", authMiddleware, productValidator, validateFields, createProduct);
router.put("/:id", authMiddleware, productValidator, validateFields, updateProduct);
router.delete("/:id", authMiddleware, deleteProduct);

module.exports = router;
