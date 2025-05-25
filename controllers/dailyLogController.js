const DailyLog = require("../models/DailyLog");
const Product = require("../models/Producto");
const Recipe = require("../models/Recipe");
const User = require("../models/User");
const moment = require('moment-timezone'); // Import moment-timezone

// Define the timezone for Spain
const SPAIN_TIMEZONE = 'Europe/Madrid';

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
    let { fecha, pesoDelDia, comidas } = req.body;

    let dateToSave;
    if (fecha) {
      dateToSave = moment.tz(fecha, 'YYYY-MM-DD', SPAIN_TIMEZONE).startOf('day').toDate();
    } else {
      dateToSave = moment.tz(SPAIN_TIMEZONE).startOf('day').toDate();
    }

    console.log('Backend - Creando registro para fecha (UTC almacenada):', dateToSave);
    const startOfSpainDayUTC = moment.tz(dateToSave, SPAIN_TIMEZONE).startOf('day').toDate();
    const endOfSpainDayUTC = moment.tz(dateToSave, SPAIN_TIMEZONE).endOf('day').toDate();


    const logExistente = await DailyLog.findOne({
      userId,
      fecha: { $gte: startOfSpainDayUTC, $lte: endOfSpainDayUTC }
    });

    if (logExistente) {
      return res.status(400).json({ message: "Ya existe un registro para esta fecha" });
    }

    const nuevoLog = new DailyLog({ userId, fecha: dateToSave, pesoDelDia, comidas });
    await nuevoLog.save();
    res.status(201).json(nuevoLog);
  } catch (error) {
    console.error("Error al crear registro diario:", error);
    res.status(500).json({ message: "Error al crear registro diario", error: error.message });
  }
};

// Obtener todos los registros del usuario
const getDailyLogs = async (req, res) => {
  try {
    const userId = req.user.userId;
    const logs = await DailyLog.find({ userId }).sort({ fecha: -1 });
    res.json(logs);
  } catch (error) {
    console.error("Error al obtener registros diarios:", error);
    res.status(500).json({ message: "Error al obtener registros diarios", error: error.message });
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
    console.error("Error al obtener registro diario por ID:", error);
    res.status(500).json({ message: "Error al obtener registro diario", error: error.message });
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
    console.error("Error al actualizar registro:", error);
    res.status(500).json({ message: "Error al actualizar registro", error: error.message });
  }
};

// Obtener registro por fecha o devolver estructura vacía
const getDailyLogByDate = async (req, res) => {
  try {
    const userId = req.user.userId;
    const fechaParam = req.query.fecha; // Assuming fechaParam is 'YYYY-MM-DD'

    let dateToQuery;

    if (fechaParam) {
      // Create a moment object for the start of the specified day in Spain's timezone
      dateToQuery = moment.tz(fechaParam, 'YYYY-MM-DD', SPAIN_TIMEZONE);
      if (!dateToQuery.isValid()) {
        return res.status(400).json({ message: "Formato de fecha inválido. Use YYYY-MM-DD." });
      }
    } else {
      // If no date, use the start of the current day in Spain's timezone
      dateToQuery = moment.tz(SPAIN_TIMEZONE);
    }

    // Calculate the UTC range corresponding to the start and end of the day in Spain
    const startOfSpainDayUTC = dateToQuery.clone().startOf('day').toDate();
    const endOfSpainDayUTC = dateToQuery.clone().endOf('day').toDate();

    console.log('Backend - Buscando registro entre (UTC):', startOfSpainDayUTC, 'y', endOfSpainDayUTC);

    const dailyLog = await DailyLog.findOne({
      userId,
      fecha: { $gte: startOfSpainDayUTC, $lte: endOfSpainDayUTC }
    });

    if (dailyLog) {
      // Date retrieved is UTC. Convert if frontend needs Spain's time specifically.
      return res.json(dailyLog);
    }

    // If no record exists, return a default structure with the date set to
    // the start of the queried/current day in Spain's timezone (as a Date object, stored as UTC)
    const defaultDate = dateToQuery.startOf('day').toDate(); // Store UTC equivalent of start of day in Spain

    res.json({
      userId,
      fecha: defaultDate,
      pesoDelDia: null,
      comidas: generarComidasVacias()
    });
  } catch (error) {
    console.error("Error al obtener el registro diario por fecha:", error);
    res.status(500).json({ message: "Error al obtener el registro diario", error: error.message });
  }
};


// Obtener resumen nutricional del día comparado con los objetivos
const getResumenNutricional = async (req, res) => {
  try {
    const userId = req.user.userId;
    const fechaParam = req.query.fecha; // Assuming fechaParam is 'YYYY-MM-DD'

    let dateToQuery;

    if (fechaParam) {
      // Create a moment object for the start of the specified day in Spain's timezone
      dateToQuery = moment.tz(fechaParam, 'YYYY-MM-DD', SPAIN_TIMEZONE);
      if (!dateToQuery.isValid()) {
        return res.status(400).json({ message: "Formato de fecha inválido. Use YYYY-MM-DD." });
      }
    } else {
      // If no date, use the start of the current day in Spain's timezone
      dateToQuery = moment.tz(SPAIN_TIMEZONE);
    }

    // Calculate the UTC range corresponding to the start and end of the day in Spain
    const startOfSpainDayUTC = dateToQuery.clone().startOf('day').toDate();
    const endOfSpainDayUTC = dateToQuery.clone().endOf('day').toDate();

    console.log('Backend - Resumen - Buscando registro entre (UTC):', startOfSpainDayUTC, 'y', endOfSpainDayUTC);


    // Obtener el registro diario y el usuario en paralelo
    const [dailyLog, user] = await Promise.all([
      DailyLog.findOne({ userId, fecha: { $gte: startOfSpainDayUTC, $lte: endOfSpainDayUTC } }),
      User.findById(userId, 'objetivosNutricionales')
    ]);

    if (!user) {
      return res.status(404).json({ message: "Usuario no encontrado." });
    }

    if (!dailyLog) {
      // Return structure with date set to the start of the queried/current day in Spain's timezone
      const defaultDate = dateToQuery.startOf('day').toDate(); // Store UTC equivalent of start of day in Spain
      return res.json({
        message: "Sin registro en esta fecha",
        fecha: defaultDate, // Include the date for clarity
        consumido: { calorias: 0, proteinas: 0, carbohidratos: 0, grasas: 0 },
        objetivo: user.objetivosNutricionales || { calorias: 0, proteinas: 0, carbohidratos: 0, grasas: 0 }, // Ensure objective is not null
        diferencia: user.objetivosNutricionales ? {
          calorias: user.objetivosNutricionales.calorias,
          proteinas: user.objetivosNutricionales.proteinas,
          carbohidratos: user.objetivosNutricionales.carbohidratos,
          grasas: user.objetivosNutricionales.grasas
        } : { calorias: 0, proteinas: 0, carbohidratos: 0, grasas: 0 }
      });
    }

    // Aplanar todos los items de comidas
    const items = Object.values(dailyLog.comidas).flat();

    // Separar IDs de productos y recetas
    const productItems = items.filter(i => i.productId);
    const recipeItems = items.filter(i => i.recipeId);

    const productIds = productItems.map(i => i.productId);
    const recipeIds = recipeItems.map(i => i.recipeId);


    // Obtener productos y recetas en paralelo
    const [products, recipes] = await Promise.all([
      productIds.length > 0 ?
        Product.find({ _id: { $in: productIds } }) :
        [],
      recipeIds.length > 0 ?
        Recipe.find({ _id: { $in: recipeIds } }) :
        []
    ]);

    // Crear mapas para acceso rápido
    const productMap = new Map(products.map(p => [p._id.toString(), p]));
    const recipeMap = new Map(recipes.map(r => [r._id.toString(), r]));

    // Calcular nutrientes en un solo bucle
    const consumido = { calorias: 0, proteinas: 0, carbohidratos: 0, grasas: 0 };

    // Procesar productos
    productItems.forEach(({ productId, cantidad }) => {
      const product = productMap.get(productId.toString());
      if (product) {
        const factor = cantidad / 100; // Assuming nutrients are per 100g
        consumido.calorias += product.calorias * factor;
        consumido.proteinas += product.proteinas * factor;
        consumido.carbohidratos += product.carbohidratos * factor;
        consumido.grasas += product.grasas * factor;
      }
    });

    // Procesar recetas
    recipeItems.forEach(({ recipeId, cantidad }) => {
      const recipe = recipeMap.get(recipeId.toString());
      if (recipe && recipe.pesoFinal > 0) { // Prevent division by zero
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

    const objetivo = user.objetivosNutricionales || { calorias: 0, proteinas: 0, carbohidratos: 0, grasas: 0 }; // Ensure objective is not null
    const diferencia = {
      calorias: objetivo.calorias - consumido.calorias,
      proteinas: objetivo.proteinas - consumido.proteinas,
      carbohidratos: objetivo.carbohidratos - consumido.carbohidratos,
      grasas: objetivo.grasas - consumido.grasas
    };

    res.json({
      fecha: dailyLog.fecha, // Include the date for clarity
      consumido,
      objetivo,
      diferencia
    });
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