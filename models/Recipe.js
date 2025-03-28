const mongoose = require("mongoose");

const ingredientSchema = new mongoose.Schema({
  productId: { type: mongoose.Schema.Types.ObjectId, ref: "Product", required: true },
  cantidad: { type: Number, required: true } // cantidad en gramos
});

const recipeSchema = new mongoose.Schema({
  nombre: { type: String, required: true },
  ingredientes: [ingredientSchema],
  pesoFinal: { type: Number, required: true }, // peso final del plato preparado
  calorias: { type: Number, required: true },
  proteinas: { type: Number, required: true },
  carbohidratos: { type: Number, required: true },
  grasas: { type: Number, required: true },
  // Si es receta creada por un usuario, se guarda el id del creador; de lo contrario, puede ser null (global)
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null }
});

module.exports = mongoose.model("Recipe", recipeSchema);
