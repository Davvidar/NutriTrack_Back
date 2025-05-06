const express = require("express");
const {
  createRecipe,
  getRecipes,
  getRecipeById,
  updateRecipe,
  deleteRecipe
} = require("../controllers/recipeController");

const authMiddleware = require("../middlewares/authMiddleware");
const recipeValidator = require("../middlewares/recipeValidator");
const validateFields = require("../middlewares/validateFields");

const router = express.Router();

// Rutas protegidas con validación
router.post("/", authMiddleware, recipeValidator, validateFields, createRecipe);
router.put("/:id", authMiddleware, recipeValidator, validateFields, updateRecipe);

// Rutas de lectura protegidas
router.get("/", authMiddleware, getRecipes);
router.get("/:id", authMiddleware, getRecipeById);

// Eliminar receta
router.delete("/:id", authMiddleware, deleteRecipe);

module.exports = router;
