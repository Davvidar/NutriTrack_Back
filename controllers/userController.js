const User = require("../models/User");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const nodemailer = require("nodemailer");
const { calcularObjetivosNutricionales } = require("../utils/calculonutricional")

// Registro de usuario con cálculo automático
const registerUser = async (req, res) => {
  try {
    const { nombre, apellido, correo, password, peso, altura, sexo, edad, objetivo, actividad } = req.body;

    const existingUser = await User.findOne({ correo });
    if (existingUser) return res.status(400).json({ message: "El correo ya está en uso" });

    const hashedPassword = await bcrypt.hash(password, 10);

    const objetivosNutricionales = calcularObjetivosNutricionales({
      peso,
      altura,
      edad,
      sexo,
      actividad,
      objetivo
    });

    const newUser = new User({
      nombre,
      apellido,
      correo,
      password: hashedPassword,
      peso,
      altura,
      sexo,
      edad,
      objetivo,
      actividad,
      objetivosNutricionales
    });

    await newUser.save();

    const activationToken = jwt.sign({ userId: newUser._id }, process.env.JWT_SECRET, { expiresIn: "1d" });

    const transporter = nodemailer.createTransport({
      service: "Gmail",
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
      }
    });

    const activationLink = `${process.env.BASE_URL}/api/users/activate/${activationToken}`;

    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: newUser.correo,
      subject: "Activa tu cuenta en NutriTrack",
      html: `<p>Hola ${newUser.nombre},</p>
             <p>Gracias por registrarte. Haz clic en el siguiente enlace para activar tu cuenta:</p>
             <a href="${activationLink}">Activar cuenta</a>
             <p>Este enlace expirará en 24 horas.</p>`
    };

    transporter.sendMail(mailOptions, (err, info) => {
      if (err) console.error("Error al enviar email de activación:", err);
    });

    res.status(201).json({ message: "Usuario registrado. Revisa tu correo para activar la cuenta." });

  } catch (error) {
    res.status(500).json({ message: "Error al registrar usuario", error });
  }
};

// Login
const loginUser = async (req, res) => {
  try {
    const { correo, password } = req.body;

    const user = await User.findOne({ correo });
    if (!user) return res.status(400).json({ message: "Usuario no encontrado" });

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(400).json({ message: "Contraseña incorrecta" });

    const token = jwt.sign({ id: user._id, rol: user.rol }, process.env.JWT_SECRET, { expiresIn: "30d" });

    res.json({ token, user });
  } catch (error) {
    res.status(500).json({ message: "Error en el inicio de sesión", error });
  }
};

// Obtener perfil
const getProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user.userId).select("-password");
    res.json(user);
  } catch (error) {
    res.status(500).json({ message: "Error al obtener perfil", error });
  }
};

// Actualizar perfil (peso, altura, objetivo, y macros manuales)
const updateProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user.userId);
    if (!user) return res.status(404).json({ message: "Usuario no encontrado" });

    const {
      peso,
      altura,
      edad,
      sexo,
      actividad,
      objetivo,
      objetivosNutricionales // opcional si se editan manualmente
    } = req.body;

    if (peso !== undefined) user.peso = peso;
    if (altura !== undefined) user.altura = altura;
    if (edad !== undefined) user.edad = edad;
    if (sexo) user.sexo = sexo;
    if (actividad) user.actividad = actividad;
    if (objetivo) user.objetivo = objetivo;

    if (objetivosNutricionales) {
      user.objetivosNutricionales = objetivosNutricionales;
    } else {
      // recalcula automáticamente si no se pasa manualmente
      user.objetivosNutricionales = calcularObjetivosNutricionales({
        peso: user.peso,
        altura: user.altura,
        edad: user.edad,
        sexo: user.sexo,
        actividad: user.actividad,
        objetivo: user.objetivo
      });
    }

    await user.save();
    res.json({ message: "Perfil actualizado", user: { ...user.toObject(), password: undefined } });
  } catch (error) {
    res.status(500).json({ message: "Error al actualizar perfil", error });
  }
};

// Activar cuenta
const activateAccount = async (req, res) => {
  try {
    const { token } = req.params;
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    await User.findByIdAndUpdate(decoded.userId, { isActive: true });
    res.json({ message: "Cuenta activada exitosamente" });
  } catch (error) {
    res.status(400).json({ message: "Token inválido o expirado" });
  }
};

// Solicitar restablecimiento de contraseña
const resetPasswordRequest = async (req, res) => {
  const { correo } = req.body;
  try {
    const user = await User.findOne({ correo });
    if (!user) return res.status(404).json({ message: "Usuario no encontrado" });

    const resetToken = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: "15m" });
    const resetLink = `${process.env.BASE_URL}/api/users/reset-password/${resetToken}`;

    const transporter = nodemailer.createTransport({
      service: "Gmail",
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
      }
    });

    await transporter.sendMail({
      from: process.env.EMAIL_USER,
      to: correo,
      subject: "Recuperación de contraseña - NutriTrack",
      html: `<p>Hola ${user.nombre},</p>
             <p>Para restablecer tu contraseña, haz clic en el siguiente enlace:</p>
             <a href="${resetLink}">Restablecer contraseña</a>
             <p>El enlace expirará en 15 minutos.</p>`
    });

    res.json({ message: "Se ha enviado un email con instrucciones para restablecer la contraseña." });
  } catch (error) {
    res.status(500).json({ message: "Error interno al solicitar restablecimiento de contraseña." });
  }
};

const changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    const userId = req.user.userId;

    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ message: "Usuario no encontrado" });

    // Verificar contraseña actual
    const isMatch = await bcrypt.compare(currentPassword, user.password);
    if (!isMatch) return res.status(400).json({ message: "Contraseña actual incorrecta" });

    // Hashear nueva contraseña
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    
    // Actualizar contraseña
    user.password = hashedPassword;
    await user.save();

    res.json({ message: "Contraseña actualizada correctamente" });
  } catch (error) {
    res.status(500).json({ message: "Error al cambiar contraseña", error });
  }
};

// Eliminar cuenta
const deleteAccount = async (req, res) => {
  try {
    const { password } = req.body;
    const userId = req.user.userId;

    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ message: "Usuario no encontrado" });

    // Verificar contraseña
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(400).json({ message: "Contraseña incorrecta" });

    // Eliminar registros asociados (DailyLogs, Productos personales, etc.)
    await DailyLog.deleteMany({ userId });
    await Product.deleteMany({ userId });
    await Recipe.deleteMany({ userId });
    
    // Eliminar el usuario
    await User.findByIdAndDelete(userId);

    res.json({ message: "Cuenta eliminada correctamente" });
  } catch (error) {
    res.status(500).json({ message: "Error al eliminar cuenta", error });
  }
};

// Restablecer contraseña
const resetPassword = async (req, res) => {
  const { token } = req.params;
  const { newPassword } = req.body;
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.id);
    if (!user) return res.status(404).json({ message: "Usuario no encontrado" });

    const hashedPassword = await bcrypt.hash(newPassword, 10);
    user.password = hashedPassword;
    await user.save();

    res.json({ message: "Contraseña actualizada correctamente." });
  } catch (error) {
    res.status(400).json({ message: "Token inválido o expirado." });
  }
};
const logoutUser = async (req, res) => {
  try {
    res.json({ message: "Sesión cerrada correctamente." });
  } catch (error) {
    res.status(500).json({ message: "Error al cerrar sesión", error });
  }
};



const updateFavorites = async (req, res) => {
  try {
    const { favoritos } = req.body;
    const userId = req.user.userId;

    if (!Array.isArray(favoritos)) {
      return res.status(400).json({
        message: "Formato incorrecto",
        details: "Se esperaba un array de favoritos"
      });
    }

    // Validar estructura de cada favorito
    const isValidFavoritos = favoritos.every(fav =>
      fav.tipo && ['product', 'recipe'].includes(fav.tipo) &&
      fav.refId
    );

    if (!isValidFavoritos && favoritos.length > 0) {
      return res.status(400).json({
        message: "Formato de favoritos inválido",
        details: "Cada favorito debe tener un campo 'tipo' (product o recipe) y un campo 'refId'"
      });
    }

    // Actualizar solo el campo favoritos
    const user = await User.findByIdAndUpdate(
      userId,
      { $set: { favoritos } },
      { new: true, select: "-password" }
    );

    if (!user) {
      return res.status(404).json({ message: "Usuario no encontrado" });
    }

    res.json({
      message: "Favoritos actualizados",
      favoritos: user.favoritos
    });

  } catch (error) {
    res.status(500).json({
      message: "Error al actualizar favoritos",
      error: error.message
    });
  }
};
module.exports = {
  registerUser,
  loginUser,
  getProfile,
  updateProfile,
  activateAccount,
  resetPasswordRequest,
  resetPassword,
  logoutUser,
  updateFavorites,
  changePassword,
  deleteAccount
};
