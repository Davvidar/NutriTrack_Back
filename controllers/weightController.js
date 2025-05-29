const DailyLog = require("../models/DailyLog");

// Obtener historial completo de peso del usuario
const getHistorialPeso = async (req, res) => {
  try {
    const userId = req.user.userId;

    const logs = await DailyLog.find({
      userId,
      pesoDelDia: { $exists: true, $ne: null }
    }).sort({ fecha: 1 }); // orden cronológico ascendente

    const historial = logs.map(log => ({
      fecha: log.fecha,
      peso: log.pesoDelDia
    }));

    res.json(historial);
  } catch (error) {
    res.status(500).json({ message: "Error al obtener historial de peso", error });
  }
};

// Calcular media semanal del peso
const getMediaSemanalPeso = async (req, res) => {
  try {
    const userId = req.user.userId;
    const { startDate, endDate } = req.query;

    let fechaInicio, fechaFin;

    if (startDate && endDate) {
      // Si se proporcionan fechas específicas, usarlas
      fechaInicio = new Date(startDate);
      fechaFin = new Date(endDate);
      fechaFin.setHours(23, 59, 59, 999); // Final del día
    } else {
      // Si no se proporcionan fechas, usar los últimos 7 días (comportamiento original)
      fechaFin = new Date();
      fechaInicio = new Date();
      fechaInicio.setDate(fechaInicio.getDate() - 7);
    }

    console.log('Calculando media semanal desde:', fechaInicio, 'hasta:', fechaFin);

    const logs = await DailyLog.find({
      userId,
      fecha: { $gte: fechaInicio, $lte: fechaFin },
      pesoDelDia: { $exists: true, $ne: null }
    });

    if (logs.length === 0) {
      return res.status(200).json({ media: null, diasConDatos: 0 });
    }

    const suma = logs.reduce((acc, log) => acc + log.pesoDelDia, 0);
    const media = suma / logs.length;

    res.json({ media: Number(media.toFixed(2)), diasConDatos: logs.length });
  } catch (error) {
    console.error('Error al calcular media semanal:', error);
    res.status(500).json({ message: "Error al calcular media semanal", error });
  }
};

// NUEVO: Obtener medias semanales para gráfico
const getMediasSemanales = async (req, res) => {
  try {
    const userId = req.user.userId;

    // Obtener todos los registros de peso del usuario
    const logs = await DailyLog.find({
      userId,
      pesoDelDia: { $exists: true, $ne: null }
    }).sort({ fecha: 1 });

    if (logs.length === 0) {
      return res.json([]);
    }

    // Agrupar por semanas
    const weeklyData = new Map();
    
    logs.forEach(log => {
      const fecha = new Date(log.fecha);
      
      // Obtener el lunes de la semana de esta fecha
      const dayOfWeek = fecha.getDay();
      const daysToMonday = (dayOfWeek === 0 ? 6 : dayOfWeek - 1); // Domingo = 0, queremos Lunes = 0
      const monday = new Date(fecha);
      monday.setDate(fecha.getDate() - daysToMonday);
      monday.setHours(0, 0, 0, 0);
      
      const weekKey = monday.toISOString().split('T')[0]; // YYYY-MM-DD del lunes
      
      if (!weeklyData.has(weekKey)) {
        weeklyData.set(weekKey, {
          fecha: weekKey,
          pesos: [],
          fechaLunes: monday
        });
      }
      
      weeklyData.get(weekKey).pesos.push(log.pesoDelDia);
    });

    // Calcular medias y formatear respuesta
    const medias = Array.from(weeklyData.values())
      .filter(week => week.pesos.length > 0) // Solo semanas con datos
      .map(week => {
        const suma = week.pesos.reduce((acc, peso) => acc + peso, 0);
        const media = suma / week.pesos.length;
        
        return {
          fecha: week.fecha, // Fecha del lunes de la semana
          peso: Number(media.toFixed(1))
        };
      })
      .sort((a, b) => new Date(a.fecha) - new Date(b.fecha));

    console.log(`Calculadas ${medias.length} medias semanales para usuario ${userId}`);
    res.json(medias);

  } catch (error) {
    console.error('Error al calcular medias semanales:', error);
    res.status(500).json({ message: "Error al calcular medias semanales", error });
  }
};

// NUEVO: Obtener comparación semanal detallada
const getComparacionSemanal = async (req, res) => {
  try {
    const userId = req.user.userId;
    const today = new Date();
    
    // Calcular fechas para semana actual y anterior
    const currentWeekStart = new Date(today);
    const dayOfWeek = today.getDay();
    const daysToMonday = (dayOfWeek === 0 ? 6 : dayOfWeek - 1);
    currentWeekStart.setDate(today.getDate() - daysToMonday);
    currentWeekStart.setHours(0, 0, 0, 0);
    
    const currentWeekEnd = new Date(currentWeekStart);
    currentWeekEnd.setDate(currentWeekStart.getDate() + 6);
    currentWeekEnd.setHours(23, 59, 59, 999);
    
    const previousWeekStart = new Date(currentWeekStart);
    previousWeekStart.setDate(currentWeekStart.getDate() - 7);
    
    const previousWeekEnd = new Date(currentWeekStart);
    previousWeekEnd.setDate(currentWeekStart.getDate() - 1);
    previousWeekEnd.setHours(23, 59, 59, 999);

    // Obtener peso de hoy
    const todayStart = new Date(today);
    todayStart.setHours(0, 0, 0, 0);
    const todayEnd = new Date(today);
    todayEnd.setHours(23, 59, 59, 999);
    
    const todayLog = await DailyLog.findOne({
      userId,
      fecha: { $gte: todayStart, $lte: todayEnd },
      pesoDelDia: { $exists: true, $ne: null }
    });

    // Obtener datos de ambas semanas en paralelo
    const [currentWeekLogs, previousWeekLogs] = await Promise.all([
      DailyLog.find({
        userId,
        fecha: { $gte: currentWeekStart, $lte: currentWeekEnd },
        pesoDelDia: { $exists: true, $ne: null }
      }),
      DailyLog.find({
        userId,
        fecha: { $gte: previousWeekStart, $lte: previousWeekEnd },
        pesoDelDia: { $exists: true, $ne: null }
      })
    ]);

    // Calcular medias
    const currentWeekAverage = currentWeekLogs.length > 0 ? 
      Number((currentWeekLogs.reduce((sum, log) => sum + log.pesoDelDia, 0) / currentWeekLogs.length).toFixed(1)) : 
      null;
      
    const previousWeekAverage = previousWeekLogs.length > 0 ? 
      Number((previousWeekLogs.reduce((sum, log) => sum + log.pesoDelDia, 0) / previousWeekLogs.length).toFixed(1)) : 
      null;

    const response = {
      currentWeekAverage,
      previousWeekAverage,
      todayWeight: todayLog ? Number(todayLog.pesoDelDia.toFixed(1)) : null,
      currentWeekDays: currentWeekLogs.length,
      previousWeekDays: previousWeekLogs.length,
      currentWeekStart: currentWeekStart.toISOString().split('T')[0],
      previousWeekStart: previousWeekStart.toISOString().split('T')[0]
    };

    console.log('Comparación semanal calculada:', response);
    res.json(response);

  } catch (error) {
    console.error('Error al obtener comparación semanal:', error);
    res.status(500).json({ message: "Error al obtener comparación semanal", error });
  }
};

module.exports = {
  getHistorialPeso,
  getMediaSemanalPeso,
  getMediasSemanales,        // NUEVO
  getComparacionSemanal      // NUEVO
};