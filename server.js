const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const dotenv = require("dotenv");

// Cargar variables de entorno
dotenv.config();

const app = express();

// Middleware
app.use(express.json());
app.use(cors());

// Conectar a MongoDB
mongoose
  .connect(process.env.MONGO_URI)
  .then(() => console.log("MongoDB conectado 🚀"))
  .catch((err) => console.error("Error al conectar MongoDB:", err));

// Importar rutas
const userRoutes = require("./routes/userRoutes");

app.use("/api/users", userRoutes);

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Servidor corriendo en el puerto ${PORT}`));
