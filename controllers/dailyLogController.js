const DailyLog = require("../models/DailyLog");
const Product = require("../models/Producto");
const Recipe = require("../models/Recipe");
const User = require("../models/User");

// Utilidad: generar estructura vacía de comidas
const generarComidasVacias = () => ({
  desayuno: [],
  almuerzo: [],
  comida: [],
  merienda: [],
  cena: [],
  recena: []
});

// Crear un nuevo registro diario
const createDailyLog = async (req, res) => {
  try {
    const userId = req.user.userId;
    const { fecha, pesoDelDia, comidas } = req.body;

    const logExistente = await DailyLog.findOne({ userId, fecha });
    if (logExistente) {
      return res.status(400).json({ message: "Ya existe un registro para esta fecha" });
    }

    const nuevoLog = new DailyLog({ userId, fecha, pesoDelDia, comidas });
    await nuevoLog.save();
    res.status(201).json(nuevoLog);
  } catch (error) {
    res.status(500).json({ message: "Error al crear registro diario", error });
  }
};

// Obtener todos los registros del usuario
const getDailyLogs = async (req, res) => {
  try {
    const userId = req.user.userId;
    const logs = await DailyLog.find({ userId }).sort({ fecha: -1 });
    res.json(logs);
  } catch (error) {
    res.status(500).json({ message: "Error al obtener registros diarios", error });
  }
};

// Obtener un registro por ID
const getDailyLogById = async (req, res) => {
  try {
    const log = await DailyLog.findById(req.params.id);
    if (!log || log.userId.toString() !== req.user.userId) {
      return res.status(404).json({ message: "Registro no encontrado o sin acceso" });
    }
    res.json(log);
  } catch (error) {
    res.status(500).json({ message: "Error al obtener registro diario", error });
  }
};

// Actualizar un registro diario existente
const updateDailyLog = async (req, res) => {
  try {
    const log = await DailyLog.findById(req.params.id);
    if (!log || log.userId.toString() !== req.user.userId) {
      return res.status(404).json({ message: "Registro no encontrado o sin acceso" });
    }

    const { pesoDelDia, comidas } = req.body;
    if (pesoDelDia !== undefined) log.pesoDelDia = pesoDelDia;
    if (comidas !== undefined) log.comidas = comidas;

    await log.save();
    res.json(log);
  } catch (error) {
    res.status(500).json({ message: "Error al actualizar registro", error });
  }
};

// Obtener registro por fecha o devolver estructura vacía
const getDailyLogByDate = async (req, res) => {
  try {
    const userId = req.user.userId;
    const fechaParam = req.query.fecha;
    const fecha = fechaParam ? new Date(fechaParam) : new Date();

    const inicio = new Date(fecha.setHours(0, 0, 0, 0));
    const fin = new Date(fecha.setHours(23, 59, 59, 999));

    const dailyLog = await DailyLog.findOne({ userId, fecha: { $gte: inicio, $lte: fin } });

    if (dailyLog) return res.json(dailyLog);

    res.json({
      userId,
      fecha: inicio,
      pesoDelDia: null,
      comidas: generarComidasVacias()
    });
  } catch (error) {
    res.status(500).json({ message: "Error al obtener el registro diario", error });
  }
};

// Obtener resumen nutricional del día comparado con los objetivos
const getResumenNutricional = async (req, res) => {
  try {
    const userId = req.user.userId;
    const fechaParam = req.query.fecha;
    const fecha = fechaParam ? new Date(fechaParam) : new Date();

    const inicio = new Date(fecha.setHours(0, 0, 0, 0));
    const fin = new Date(fecha.setHours(23, 59, 59, 999));

    const dailyLog = await DailyLog.findOne({ userId, fecha: { $gte: inicio, $lte: fin } });

    if (!dailyLog) {
      return res.json({ message: "Sin registro en esta fecha", consumido: {}, diferencia: {} });
    }

    const items = Object.values(dailyLog.comidas).flat();

    let consumido = { calorias: 0, proteinas: 0, carbohidratos: 0, grasas: 0 };
    const productMap = new Map();
    const recipeMap = new Map();

    items.forEach(item => {
      if (item.productId) {
        const key = item.productId.toString();
        productMap.set(key, (productMap.get(key) || 0) + item.cantidad);
      } else if (item.recipeId) {
        const key = item.recipeId.toString();
        recipeMap.set(key, (recipeMap.get(key) || 0) + item.cantidad);
      }
    });

    const products = await Product.find({ _id: { $in: Array.from(productMap.keys()) } });
    products.forEach(p => {
      const gramos = productMap.get(p._id.toString()) / 100;
      consumido.calorias += p.calorias * gramos;
      consumido.proteinas += p.proteinas * gramos;
      consumido.carbohidratos += p.carbohidratos * gramos;
      consumido.grasas += p.grasas * gramos;
    });

    const recipes = await Recipe.find({ _id: { $in: Array.from(recipeMap.keys()) } });
    recipes.forEach(r => {
      const gramosConsumidos = recipeMap.get(r._id.toString());
      const proporcion = gramosConsumidos / r.pesoFinal;
      consumido.calorias += r.calorias * proporcion;
      consumido.proteinas += r.proteinas * proporcion;
      consumido.carbohidratos += r.carbohidratos * proporcion;
      consumido.grasas += r.grasas * proporcion;
    });

    Object.keys(consumido).forEach(k => {
      consumido[k] = Math.round(consumido[k]);
    });

    const user = await User.findById(userId);
    const objetivo = user.objetivosNutricionales;

    const diferencia = {
      calorias: objetivo.calorias - consumido.calorias,
      proteinas: objetivo.proteinas - consumido.proteinas,
      carbohidratos: objetivo.carbohidratos - consumido.carbohidratos,
      grasas: objetivo.grasas - consumido.grasas
    };

    res.json({ consumido, objetivo, diferencia });

  } catch (error) {
    res.status(500).json({ message: "Error al calcular resumen nutricional", error });
  }
};

module.exports = {
  createDailyLog,
  getDailyLogs,
  getDailyLogById,
  updateDailyLog,
  getDailyLogByDate,
  getResumenNutricional
};
