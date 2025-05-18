const Recipe = require("../models/Recipe");
const User = require("../models/User");

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
    const { favoritos } = req.query;

    // Buscar todas las recetas (globales + propias del usuario)
    let recipes = await Recipe.find({
      $or: [{ userId: null }, { userId }]
    }).populate('ingredientes.productId', 'nombre marca');
    
    // Si se solicita filtrar por favoritos
    if (favoritos === "true") {
      const user = await User.findById(userId);
      if (user && user.favoritos && user.favoritos.length > 0) {
        // Crear un conjunto de IDs de recetas favoritas
        // Filtrando solo los favoritos de tipo 'recipe'
        const favoritosSet = new Set(
          user.favoritos
            .filter(fav => fav.tipo === 'recipe')
            .map(fav => fav.refId.toString())
        );
        
        // Filtrar recetas que están en el conjunto de favoritos
        recipes = recipes.filter(r => favoritosSet.has(r._id.toString()));
        console.log(`Filtrado por favoritos: ${recipes.length} recetas`);
      } else {
        console.log('No hay favoritos definidos para el usuario');
        recipes = []; // Si no hay favoritos, devolvemos array vacío
      }
    }
    
    res.json(recipes);
  } catch (error) {
    res.status(500).json({ message: "Error obteniendo recetas", error });
  }
};


// Obtener receta por ID
const getRecipeById = async (req, res) => {
  try {
    const recipe = await Recipe.findById(req.params.id)
      .populate('ingredientes.productId', 'nombre marca calorias proteinas carbohidratos grasas');
    
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
const searchRecipes = async (req, res) => {
  try {
    const userId = req.user.userId;
    const { query = "", favoritos } = req.query;

    const normalized = query.normalize("NFD").replace(/[\u0300-\u036f]/g, ""); // sin tildes
    const regex = new RegExp(normalized, "i");

    // Buscar recetas que coincidan con la consulta
    let recipes = await Recipe.find({
      $or: [{ userId: null }, { userId }],
      nombre: { $regex: regex }
    });

    // Si se solicita filtrar por favoritos
    if (favoritos === "true") {
      const user = await User.findById(userId);
      if (user && user.favoritos && user.favoritos.length > 0) {
        // Filtrar favoritos de tipo receta
        const favoritosSet = new Set(
          user.favoritos
            .filter(fav => fav.tipo === 'recipe')
            .map(fav => fav.refId.toString())
        );
        
        recipes = recipes.filter(r => favoritosSet.has(r._id.toString()));
      } else {
        recipes = []; // Si no hay favoritos, devolver array vacío
      }
    }

    res.json(recipes);
  } catch (error) {
    res.status(500).json({ message: "Error en la búsqueda de recetas", error });
  }
};

module.exports = {
  createRecipe,
  getRecipes,
  getRecipeById,
  updateRecipe,
  deleteRecipe,
  searchRecipes
};
