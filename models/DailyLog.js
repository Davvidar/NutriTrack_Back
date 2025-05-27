const mongoose = require("mongoose");

const mealItemSchema = new mongoose.Schema({
  productId: { type: mongoose.Schema.Types.ObjectId, ref: "Product" },
  recipeId: { type: mongoose.Schema.Types.ObjectId, ref: "Recipe" }, // opcional, si es una receta
  cantidad: { type: Number, required: true } // cantidad en gramos
});

const dailyLogSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  fecha: { type: Date, default: Date.now },
  pesoDelDia: { type: Number },
  
  comidas: {

    desayuno: [mealItemSchema],
    almuerzo: [mealItemSchema],
    comida: [mealItemSchema],
    merienda: [mealItemSchema],
    cena: [mealItemSchema],
    recena: [mealItemSchema]
  }

});

module.exports = mongoose.model("DailyLog", dailyLogSchema);
