const User = require("../models/User");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const nodemailer = require("nodemailer");

// Función de registro (ya existente)
const registerUser = async (req, res) => {
  try {
    const { nombre, apellido, correo, password, peso, altura, sexo, edad, objetivo, actividad } = req.body;

    const existingUser = await User.findOne({ correo });
    if (existingUser) return res.status(400).json({ message: "El correo ya está en uso" });

    const hashedPassword = await bcrypt.hash(password, 10);

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
    });

    await newUser.save();

    // Generar token de activación (expira en 1 día)
    const activationToken = jwt.sign({ userId: newUser._id }, process.env.JWT_SECRET, { expiresIn: "1d" });

    // Configurar nodemailer (ejemplo con Gmail)
    const transporter = nodemailer.createTransport({
      service: "Gmail",
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
      }
    });

    // Construir link de activación (asegúrate de definir BASE_URL en tu .env)
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
      if (err) {
        console.error("Error al enviar email de activación:", err);
      } else {
        console.log("Email de activación enviado:", info.response);
      }
    });

    res.status(201).json({ message: "Usuario registrado. Revisa tu correo para activar la cuenta." });

  } catch (error) {
    res.status(500).json({ message: "Error al registrar usuario", error });
  }
};

// Función de login (ya existente)
const loginUser = async (req, res) => {
  try {
    const { correo, password } = req.body;

    const user = await User.findOne({ correo });
    if (!user) return res.status(400).json({ message: "Usuario no encontrado" });

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(400).json({ message: "Contraseña incorrecta" });

    const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET, { expiresIn: "7d" });

    res.json({ token, user });

  } catch (error) {
    res.status(500).json({ message: "Error en el inicio de sesión", error });
  }
};

// Obtener perfil (ya existente)
const getProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user.userId).select("-password");
    res.json(user);
  } catch (error) {
    res.status(500).json({ message: "Error al obtener perfil", error });
  }
};

// Activar cuenta (ya existente)
const activateAccount = async (req, res) => {
  try {
    const { token } = req.params;
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const userId = decoded.userId;
  
    await User.findByIdAndUpdate(userId, { isActive: true });
  
    res.json({ message: "Cuenta activada exitosamente" });
  } catch (error) {
    res.status(400).json({ message: "Token inválido o expirado" });
  }
};

// ------------------------------
// NUEVA FUNCIONALIDAD: Restablecimiento de contraseña
// ------------------------------

// Endpoint para solicitar el restablecimiento de contraseña
const resetPasswordRequest = async (req, res) => {
  const { correo } = req.body;
  try {
    const user = await User.findOne({ correo });
    if (!user) {
      return res.status(404).json({ message: "Usuario no encontrado" });
    }

    // Generar token de restablecimiento que expira en 15 minutos
    const resetToken = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: "15m" });
    const resetLink = `${process.env.BASE_URL}/api/users/reset-password/${resetToken}`;

    // Enviar email con el link de recuperación
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
    console.error("Error en resetPasswordRequest:", error);
    res.status(500).json({ message: "Error interno al solicitar restablecimiento de contraseña." });
  }
};

// Endpoint para restablecer la contraseña usando el token
const resetPassword = async (req, res) => {
  const { token } = req.params;
  const { newPassword } = req.body;
  try {
    // Verificar el token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.id);
    if (!user) return res.status(404).json({ message: "Usuario no encontrado" });

    // Encriptar la nueva contraseña
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    user.password = hashedPassword;
    await user.save();

    res.json({ message: "Contraseña actualizada correctamente." });
  } catch (error) {
    console.error("Error en resetPassword:", error);
    res.status(400).json({ message: "Token inválido o expirado." });
  }
};

module.exports = { 
  registerUser, 
  loginUser, 
  getProfile, 
  activateAccount, 
  resetPasswordRequest, 
  resetPassword 
};
