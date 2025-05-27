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
}

  module.exports = {
    getHistorialPeso,
    getMediaSemanalPeso
  };
