const Recipe = require("../models/Recipe");

// Crear receta
const createRecipe = async (req, res) => {
  try {
    const {
      nombre,
      ingredientes,
      pesoFinal,
      calorias,
      proteinas,
      carbohidratos,
      grasas,
      azucares,
      grasasSaturadas,
      fibra
    } = req.body;

    const userId = req.user.userId;

    const newRecipe = new Recipe({
      nombre,
      ingredientes,
      pesoFinal,
      calorias,
      proteinas,
      carbohidratos,
      grasas,
      azucares,
      grasasSaturadas,
      fibra,
      userId
    });

    await newRecipe.save();
    res.status(201).json({ message: "Receta creada", recipe: newRecipe });
  } catch (error) {
    res.status(500).json({ message: "Error creando receta", error });
  }
};

// Obtener recetas (globales y del usuario)
const getRecipes = async (req, res) => {
  try {
    const userId = req.user.userId;
    const recipes = await Recipe.find({
      $or: [{ userId: null }, { userId }]
    });
    res.json(recipes);
  } catch (error) {
    res.status(500).json({ message: "Error obteniendo recetas", error });
  }
};

// Obtener receta por ID
const getRecipeById = async (req, res) => {
  try {
    const recipe = await Recipe.findById(req.params.id);
    if (!recipe) return res.status(404).json({ message: "Receta no encontrada" });

    if (recipe.userId && recipe.userId.toString() !== req.user.userId) {
      return res.status(403).json({ message: "No tienes permiso para ver esta receta" });
    }

    res.json(recipe);
  } catch (error) {
    res.status(500).json({ message: "Error obteniendo receta", error });
  }
};

// Actualizar receta
const updateRecipe = async (req, res) => {
  try {
    const recipe = await Recipe.findById(req.params.id);
    if (!recipe) return res.status(404).json({ message: "Receta no encontrada" });

    if (recipe.userId && recipe.userId.toString() !== req.user.userId) {
      return res.status(403).json({ message: "No tienes permiso para modificar esta receta" });
    }

    const {
      nombre,
      ingredientes,
      pesoFinal,
      calorias,
      proteinas,
      carbohidratos,
      grasas,
      azucares,
      grasasSaturadas,
      fibra
    } = req.body;

    if (nombre) recipe.nombre = nombre;
    if (ingredientes) recipe.ingredientes = ingredientes;
    if (pesoFinal !== undefined) recipe.pesoFinal = pesoFinal;
    if (calorias !== undefined) recipe.calorias = calorias;
    if (proteinas !== undefined) recipe.proteinas = proteinas;
    if (carbohidratos !== undefined) recipe.carbohidratos = carbohidratos;
    if (grasas !== undefined) recipe.grasas = grasas;
    if (azucares !== undefined) recipe.azucares = azucares;
    if (grasasSaturadas !== undefined) recipe.grasasSaturadas = grasasSaturadas;
    if (fibra !== undefined) recipe.fibra = fibra;

    await recipe.save();
    res.json({ message: "Receta actualizada", recipe });
  } catch (error) {
    res.status(500).json({ message: "Error actualizando receta", error });
  }
};

// Eliminar receta
const deleteRecipe = async (req, res) => {
  try {
    const recipe = await Recipe.findById(req.params.id);
    if (!recipe) return res.status(404).json({ message: "Receta no encontrada" });

    if (recipe.userId && recipe.userId.toString() !== req.user.userId) {
      return res.status(403).json({ message: "No tienes permiso para eliminar esta receta" });
    }

    await recipe.deleteOne();
    res.json({ message: "Receta eliminada" });
  } catch (error) {
    res.status(500).json({ message: "Error eliminando receta", error });
  }
};

module.exports = {
  createRecipe,
  getRecipes,
  getRecipeById,
  updateRecipe,
  deleteRecipe
};
