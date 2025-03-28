const mongoose = require("mongoose");

const mealItemSchema = new mongoose.Schema({
  productId: { type: mongoose.Schema.Types.ObjectId, ref: "Product", required: true },
  cantidad: { type: Number, required: true } // cantidad en gramos
});

const dailyLogSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  fecha: { type: Date, default: Date.now },
  pesoDelDia: { type: Number }, // peso registrado ese día
  comidas: {
    // Las claves pueden tener nombres por defecto pero el usuario podrá personalizarlos en la interfaz
    desayuno: [mealItemSchema],
    almuerzo: [mealItemSchema],
    comida: [mealItemSchema],
    merienda: [mealItemSchema],
    cena: [mealItemSchema],
    recena: [mealItemSchema]
  }
});

module.exports = mongoose.model("DailyLog", dailyLogSchema);
