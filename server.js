const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const dotenv = require("dotenv");
const path = require("path");
// Cargar variables de entorno
dotenv.config();

const app = express();

// Middleware
app.use(express.json());
app.use(cors());


app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));
app.use(express.urlencoded({ extended: true }));
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
