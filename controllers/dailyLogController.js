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
// controllers/dailyLogController.js - Versión optimizada de getResumenNutricional
const getResumenNutricional = async (req, res) => {
  try {
    const userId = req.user.userId;
    const fechaParam = req.query.fecha;
    const fecha = fechaParam ? new Date(fechaParam) : new Date();

    const inicio = new Date(fecha);
    inicio.setHours(0, 0, 0, 0);
    const fin = new Date(fecha);
    fin.setHours(23, 59, 59, 999);

    // Obtener el registro diario y el usuario en paralelo
    const [dailyLog, user] = await Promise.all([
      DailyLog.findOne({ userId, fecha: { $gte: inicio, $lte: fin } }),
      User.findById(userId, 'objetivosNutricionales')
    ]);

    if (!dailyLog) {
      return res.json({
        message: "Sin registro en esta fecha",
        consumido: { calorias: 0, proteinas: 0, carbohidratos: 0, grasas: 0 },
        objetivo: user.objetivosNutricionales,
        diferencia: {
          calorias: user.objetivosNutricionales.calorias,
          proteinas: user.objetivosNutricionales.proteinas,
          carbohidratos: user.objetivosNutricionales.carbohidratos,
          grasas: user.objetivosNutricionales.grasas
        }
      });
    }

    // Aplanar todos los items de comidas
    const items = Object.values(dailyLog.comidas).flat();
    
    // Separar IDs de productos y recetas
    const productIds = items.filter(i => i.productId).map(i => ({
      id: i.productId,
      cantidad: i.cantidad
    }));
    
    const recipeIds = items.filter(i => i.recipeId).map(i => ({
      id: i.recipeId,
      cantidad: i.cantidad
    }));

    // Obtener productos y recetas en paralelo
    const [products, recipes] = await Promise.all([
      productIds.length > 0 ? 
        Product.find({ _id: { $in: productIds.map(p => p.id) } }) : 
        [],
      recipeIds.length > 0 ? 
        Recipe.find({ _id: { $in: recipeIds.map(r => r.id) } }) : 
        []
    ]);

    // Crear mapas para acceso rápido
    const productMap = new Map(products.map(p => [p._id.toString(), p]));
    const recipeMap = new Map(recipes.map(r => [r._id.toString(), r]));

    // Calcular nutrientes en un solo bucle
    const consumido = { calorias: 0, proteinas: 0, carbohidratos: 0, grasas: 0 };

    // Procesar productos
    productIds.forEach(({ id, cantidad }) => {
      const product = productMap.get(id.toString());
      if (product) {
        const factor = cantidad / 100;
        consumido.calorias += product.calorias * factor;
        consumido.proteinas += product.proteinas * factor;
        consumido.carbohidratos += product.carbohidratos * factor;
        consumido.grasas += product.grasas * factor;
      }
    });

    // Procesar recetas
    recipeIds.forEach(({ id, cantidad }) => {
      const recipe = recipeMap.get(id.toString());
      if (recipe) {
        const factor = cantidad / recipe.pesoFinal;
        consumido.calorias += recipe.calorias * factor;
        consumido.proteinas += recipe.proteinas * factor;
        consumido.carbohidratos += recipe.carbohidratos * factor;
        consumido.grasas += recipe.grasas * factor;
      }
    });

    // Redondear todos los valores
    Object.keys(consumido).forEach(k => {
      consumido[k] = Math.round(consumido[k]);
    });

    const objetivo = user.objetivosNutricionales;
    const diferencia = {
      calorias: objetivo.calorias - consumido.calorias,
      proteinas: objetivo.proteinas - consumido.proteinas,
      carbohidratos: objetivo.carbohidratos - consumido.carbohidratos,
      grasas: objetivo.grasas - consumido.grasas
    };

    res.json({ consumido, objetivo, diferencia });
  } catch (error) {
    console.error("Error en getResumenNutricional:", error);
    res.status(500).json({ message: "Error al calcular resumen nutricional", error: error.message });
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
