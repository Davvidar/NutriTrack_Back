const DailyLog = require("../models/DailyLog");
const moment = require('moment-timezone');

// Define the timezone for Spain
const SPAIN_TIMEZONE = 'Europe/Madrid';

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
      // Si se proporcionan fechas específicas, usarlas con zona horaria de España
      fechaInicio = moment.tz(startDate, 'YYYY-MM-DD', SPAIN_TIMEZONE).startOf('day').toDate();
      fechaFin = moment.tz(endDate, 'YYYY-MM-DD', SPAIN_TIMEZONE).endOf('day').toDate();
    } else {
      // Si no se proporcionan fechas, usar los últimos 7 días en zona horaria de España
      const todaySpain = moment.tz(SPAIN_TIMEZONE);
      fechaFin = todaySpain.clone().endOf('day').toDate();
      fechaInicio = todaySpain.clone().subtract(7, 'days').startOf('day').toDate();
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

    // Agrupar por semanas usando zona horaria de España
    const weeklyData = new Map();
    
    logs.forEach(log => {
      // Convertir la fecha del log a zona horaria de España
      const fechaSpain = moment.tz(log.fecha, SPAIN_TIMEZONE);
      
      // Obtener el lunes de la semana de esta fecha
      const monday = fechaSpain.clone().startOf('isoWeek'); // isoWeek empieza en lunes
      const weekKey = monday.format('YYYY-MM-DD'); // YYYY-MM-DD del lunes
      
      if (!weeklyData.has(weekKey)) {
        weeklyData.set(weekKey, {
          fecha: weekKey,
          pesos: [],
          fechaLunes: monday.toDate()
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

// MEJORADO: Obtener comparación semanal detallada con zona horaria correcta
const getComparacionSemanal = async (req, res) => {
  try {
    const userId = req.user.userId;
    
    // IMPORTANTE: Usar zona horaria de España para "hoy"
    const todaySpain = moment.tz(SPAIN_TIMEZONE);
    
    console.log('🔍 Backend - Fecha de hoy en España:', todaySpain.format('YYYY-MM-DD HH:mm:ss'));
    
    // Calcular fechas para semana actual y anterior usando zona horaria de España
    const currentWeekStart = todaySpain.clone().startOf('isoWeek'); // Lunes de esta semana
    const currentWeekEnd = todaySpain.clone().endOf('isoWeek'); // Domingo de esta semana
    
    const previousWeekStart = currentWeekStart.clone().subtract(1, 'week');
    const previousWeekEnd = currentWeekStart.clone().subtract(1, 'day').endOf('day');

    console.log('🔍 Backend - Rangos de fechas:', {
      hoySpain: todaySpain.format('YYYY-MM-DD'),
      semanaActualInicio: currentWeekStart.format('YYYY-MM-DD'),
      semanaActualFin: currentWeekEnd.format('YYYY-MM-DD'),
      semanaAnteriorInicio: previousWeekStart.format('YYYY-MM-DD'),
      semanaAnteriorFin: previousWeekEnd.format('YYYY-MM-DD')
    });

    // Obtener peso de HOY usando rango de todo el día en España
    const todayStartUTC = todaySpain.clone().startOf('day').toDate();
    const todayEndUTC = todaySpain.clone().endOf('day').toDate();
    
    console.log('🔍 Backend - Buscando peso de hoy entre (UTC):', {
      inicio: todayStartUTC,
      fin: todayEndUTC
    });
    
    const todayLog = await DailyLog.findOne({
      userId,
      fecha: { $gte: todayStartUTC, $lte: todayEndUTC },
      pesoDelDia: { $exists: true, $ne: null }
    });

    console.log('🔍 Backend - Log de hoy encontrado:', {
      encontrado: !!todayLog,
      fecha: todayLog?.fecha,
      peso: todayLog?.pesoDelDia
    });

    // Obtener datos de ambas semanas en paralelo
    const [currentWeekLogs, previousWeekLogs] = await Promise.all([
      DailyLog.find({
        userId,
        fecha: { 
          $gte: currentWeekStart.toDate(), 
          $lte: currentWeekEnd.toDate() 
        },
        pesoDelDia: { $exists: true, $ne: null }
      }),
      DailyLog.find({
        userId,
        fecha: { 
          $gte: previousWeekStart.toDate(), 
          $lte: previousWeekEnd.toDate() 
        },
        pesoDelDia: { $exists: true, $ne: null }
      })
    ]);

    console.log('🔍 Backend - Logs encontrados:', {
      semanaActual: currentWeekLogs.length,
      semanaAnterior: previousWeekLogs.length
    });

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
      currentWeekStart: currentWeekStart.format('YYYY-MM-DD'),
      previousWeekStart: previousWeekStart.format('YYYY-MM-DD'),
      // Información adicional para debugging
      todaySpainDate: todaySpain.format('YYYY-MM-DD'),
      timezone: SPAIN_TIMEZONE
    };

    console.log('🔍 Backend - Comparación semanal calculada:', response);
    res.json(response);

  } catch (error) {
    console.error('Error al obtener comparación semanal:', error);
    res.status(500).json({ message: "Error al obtener comparación semanal", error });
  }
};

module.exports = {
  getHistorialPeso,
  getMediaSemanalPeso,
  getMediasSemanales,
  getComparacionSemanal
};