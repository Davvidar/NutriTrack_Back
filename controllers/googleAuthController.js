/* // controllers/googleAuthController.js
const { OAuth2Client } = require('google-auth-library');
const User = require("../models/User");
const jwt = require("jsonwebtoken");
const { calcularObjetivosNutricionales } = require("../utils/calculonutricional");

const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

// Verificar token de Google y crear/obtener usuario
const googleAuth = async (req, res) => {
  try {
    const { token, userInfo } = req.body;

    // Verificar el token con Google
    let payload;
    try {
      const ticket = await client.verifyIdToken({
        idToken: token,
        audience: process.env.GOOGLE_CLIENT_ID
      });
      payload = ticket.getPayload();
    } catch (error) {
      console.error('Error verificando token de Google:', error);
      return res.status(400).json({ 
        message: "Token de Google inválido",
        error: error.message 
      });
    }

    const { email, name, given_name, family_name, picture } = payload;

    // Buscar usuario existente por email
    let user = await User.findOne({ correo: email });

    if (user) {
      // Usuario existente - login
      const appToken = jwt.sign(
        { id: user._id, rol: user.rol }, 
        process.env.JWT_SECRET, 
        { expiresIn: "30d" }
      );

      return res.json({ 
        token: appToken, 
        user: {
          ...user.toObject(),
          password: undefined // No enviar password
        },
        isNewUser: false
      });
    }

    // Usuario nuevo - necesitamos datos adicionales para registro completo
    if (!userInfo || !userInfo.peso || !userInfo.altura || !userInfo.edad || !userInfo.sexo || !userInfo.objetivo || !userInfo.actividad) {
      return res.status(400).json({ 
        message: "Datos adicionales requeridos para completar registro",
        requiresAdditionalInfo: true,
        googleUserInfo: {
          correo: email,
          nombre: given_name || name,
          apellido: family_name || '',
          picture
        }
      });
    }

    // Crear nuevo usuario
    const objetivosNutricionales = calcularObjetivosNutricionales({
      peso: userInfo.peso,
      altura: userInfo.altura,
      edad: userInfo.edad,
      sexo: userInfo.sexo,
      actividad: userInfo.actividad,
      objetivo: userInfo.objetivo
    });

    const newUser = new User({
      nombre: given_name || userInfo.nombre || name,
      apellido: family_name || userInfo.apellido || '',
      correo: email,
      password: 'GOOGLE_AUTH', // Placeholder, no se usará
      peso: userInfo.peso,
      altura: userInfo.altura,
      sexo: userInfo.sexo,
      edad: userInfo.edad,
      objetivo: userInfo.objetivo,
      actividad: userInfo.actividad,
      objetivosNutricionales,
      isActive: true, // Los usuarios de Google se activan automáticamente
      googleUser: true, // Flag para identificar usuarios de Google
      profilePicture: picture
    });

    await newUser.save();

    const appToken = jwt.sign(
      { id: newUser._id, rol: newUser.rol }, 
      process.env.JWT_SECRET, 
      { expiresIn: "30d" }
    );

    res.status(201).json({ 
      token: appToken, 
      user: {
        ...newUser.toObject(),
        password: undefined
      },
      isNewUser: true,
      message: "Usuario registrado exitosamente con Google"
    });

  } catch (error) {
    console.error('Error en googleAuth:', error);
    res.status(500).json({ 
      message: "Error en autenticación con Google", 
      error: error.message 
    });
  }
};

module.exports = {
  googleAuth
}; */