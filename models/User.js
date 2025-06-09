const mongoose = require("mongoose");

const userSchema = new mongoose.Schema({
  nombre: { type: String, required: true },
  apellido: { type: String, required: true },
  correo: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  peso: { type: Number, required: true },
  altura: { type: Number, required: true },
  sexo: { type: String, enum: ["masculino", "femenino"], required: true },
  edad: { type: Number, required: true },
  objetivo: { type: String, enum: ["perder peso", "mantenerse", "ganar músculo"], required: true },
  actividad: { type: String, enum: ["sedentario", "ligero", "moderado", "activo", "muy activo"], required: true },
  objetivosNutricionales: {
    calorias: { type: Number },
    proteinas: { type: Number },
    carbohidratos: { type: Number },
    grasas: { type: Number }
  },
  
  favoritos: [{
    tipo: { type: String, enum: ["product", "recipe"], required: true },
    refId: { type: mongoose.Schema.Types.ObjectId, required: true, refPath: "favoritos.tipo" }
  }],
  
  isActive: { type: Boolean, default: false },
  rol: {
    type: String,
    enum: ["user", "admin"],
    default: "user"
  },
  
  // Nuevos campos para autenticación con Google
  googleUser: { type: Boolean, default: false },
  googleId: { type: String, sparse: true },
  profilePicture: { type: String }, // URL de la imagen de perfil de Google
  
  // Metadatos
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

// Middleware para actualizar updatedAt antes de guardar
userSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

module.exports = mongoose.model("User", userSchema);