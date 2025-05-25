const mongoose = require("mongoose");

const productSchema = new mongoose.Schema({
  nombre: { type: String, required: true },
  marca: { type: String },
  codigoBarras: { type: String, unique: true, sparse: true },

  // Información nutricional por cada 100g del producto
  calorias: { type: Number, required: true },
  proteinas: { type: Number, required: true },
  carbohidratos: { type: Number, required: true },
  azucares: { type: Number },           // opcional
  grasas: { type: Number, required: true },
  grasasSaturadas: { type: Number },      // opcional
  fibra: { type: Number },                // opcional
  sal: { type: Number },                  // opcional


  porcion: { type: Number },
  
  // Si es creado por un usuario, se almacena su id, si es global userId es null
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null }
});

module.exports = mongoose.model("Product", productSchema);
