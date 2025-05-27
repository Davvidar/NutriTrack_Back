// routes/userRoutes.js - Versión actualizada
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const User = require('../models/User');

const express = require("express");
const {
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
} = require("../controllers/userController");

// Importar el nuevo controlador de Google Auth
const { googleAuth } = require("../controllers/googleAuthController");

const authMiddleware = require("../middlewares/authMiddleware");
const validateFields = require("../middlewares/validateFields");
const {
  userRegisterValidator,
  userLoginValidator,
  passwordResetRequestValidator,
  passwordResetValidator,
  loguoutValidator
} = require("../middlewares/userValidator");

const router = express.Router();

// Registro y login tradicional
router.post("/register", userRegisterValidator, validateFields, registerUser);
router.post("/login", userLoginValidator, validateFields, loginUser);
router.post("/logout", logoutUser);

// Nueva ruta para autenticación con Google
router.post("/google-auth", googleAuth);

// Perfil
router.get("/profile", authMiddleware, getProfile);
router.put("/profile", authMiddleware, updateProfile); 
router.put("/favorites", authMiddleware, updateFavorites);

// Activación
router.get("/activate/:token", activateAccount);

// Restablecimiento de contraseña
router.post("/reset-password-request", passwordResetRequestValidator, validateFields, resetPasswordRequest);
router.post("/reset-password/:token", passwordResetValidator, validateFields, resetPassword);

// Gestión de cuenta
router.post("/delete-account", authMiddleware, deleteAccount);
router.post("/change-password", authMiddleware, changePassword);

// Rutas EJS para restablecimiento de contraseña
router.get("/reset-password/:token", (req, res) => {
  try {
    const { token } = req.params;
    jwt.verify(token, process.env.JWT_SECRET);
    res.render('auth/reset-password', { token, error: null });
  } catch (error) {
    console.error("Error al verificar token:", error);
    res.render('auth/reset-error');
  }
});

// Restablecimiento desde el formulario EJS
router.post("/reset-password/:token", async (req, res) => {
  const { token } = req.params;
  const { newPassword, confirmPassword } = req.body;
  
  if (!newPassword || newPassword.length < 6) {
    return res.render('auth/reset-password', { 
      token, 
      error: "La contraseña debe tener al menos 6 caracteres" 
    });
  }
  
  if (newPassword !== confirmPassword) {
    return res.render('auth/reset-password', { 
      token, 
      error: "Las contraseñas no coinciden" 
    });
  }
  
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.id);
    
    if (!user) {
      return res.render('auth/reset-error');
    }
    
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    user.password = hashedPassword;
    await user.save();
    
    res.render('auth/reset-success');
    
  } catch (error) {
    console.error("Error en reset-password:", error);
    res.render('auth/reset-error');
  }
});

module.exports = router;