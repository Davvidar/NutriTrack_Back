const mongoose = require("mongoose");

const ingredientSchema = new mongoose.Schema({
  productId: { type: mongoose.Schema.Types.ObjectId, ref: "Product", required: true },
  cantidad: { type: Number, required: true } // cantidad en gramos
});

const recipeSchema = new mongoose.Schema({
  nombre: { type: String, required: true },
  ingredientes: [ingredientSchema],
  pesoFinal: { type: Number, required: true },
  calorias: { type: Number, required: true },
  proteinas: { type: Number, required: true },
  carbohidratos: { type: Number, required: true },
  grasas: { type: Number, required: true },
  azucares: { type: Number },           
  grasasSaturadas: { type: Number },    
  fibra: { type: Number },              
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null }
});

module.exports = mongoose.model("Recipe", recipeSchema);
