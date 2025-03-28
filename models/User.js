const mongoose = require("mongoose");

const userSchema = new mongoose.Schema({
  nombre: { type: String, required: true },
  apellido: { type: String, required: true },
  correo: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  peso: { type: Number, required: true },
  altura: { type: Number, required: true },
  sexo: { type: String, enum: ["masculino", "femenino", "otro"], required: true },
  edad: { type: Number, required: true },
  objetivo: { type: String, enum: ["perder peso", "mantenerse", "ganar músculo"], required: true },
  actividad: { type: String, enum: ["sedentario", "ligero", "moderado", "activo", "muy activo"], required: true },
  favoritos: [{
    tipo: { type: String, enum: ["product", "recipe"], required: true },
    refId: { type: mongoose.Schema.Types.ObjectId, required: true, refPath: "favoritos.tipo" }
  }],
  isActive: { type: Boolean, default: false }
});

module.exports = mongoose.model("User", userSchema);
