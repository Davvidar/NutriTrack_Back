const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const dotenv = require("dotenv");

// Cargar variables de entorno
dotenv.config();

const app = express();

const corsOptions = {
  origin: ['http://localhost:8100', 'http://localhost:4200', 'https://nutritrack-app.netlify.app'],
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true
};
// Middleware
app.use(express.json());
app.use(cors(corsOptions));

// Conectar a MongoDB
mongoose
  .connect(process.env.MONGO_URI)
  .then(() => console.log("MongoDB conectado 🚀"))
  .catch((err) => console.error("Error al conectar MongoDB:", err));

// Importar rutas
const recipeRoutes = require("./routes/recipesRoutes");
const userRoutes = require("./routes/userRoutes");
const productRoutes = require("./routes/productRoutes");
const dailyLogRoutes = require("./routes/dailyLogRoutes");

app.use("/api/users", userRoutes);
app.use("/api/products", productRoutes);
app.use("/api/dailylogs", dailyLogRoutes);
app.use("/api/weight", require("./routes/weightRoutes"));
app.use("/api/recipes", recipeRoutes);

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Servidor corriendo en el puerto ${PORT}`));
