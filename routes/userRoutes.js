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

// Registro y login
router.post("/register", userRegisterValidator, validateFields, registerUser);
router.post("/login", userLoginValidator, validateFields, loginUser);
router.post("/logout", logoutUser);

// Perfil
router.get("/profile", authMiddleware, getProfile);
router.put("/profile", authMiddleware, updateProfile); 

router.put("/favorites", authMiddleware, updateFavorites);


// Activación
router.get("/activate/:token", activateAccount);

// Restablecimiento de contraseña
router.post("/reset-password-request", passwordResetRequestValidator, validateFields, resetPasswordRequest);
router.post("/reset-password/:token", passwordResetValidator, validateFields, resetPassword);

// Cambiar contraseña y eliminar cuenta
router.get("/reset-password/:token", (req, res) => {
  try {
    const { token } = req.params;
    // Verificamos que el token sea válido, pero no lo consumimos todavía
    jwt.verify(token, process.env.JWT_SECRET);
    
    // Render de la plantilla con el token
    res.render('auth/reset-password', { token, error: null });
  } catch (error) {
    console.error("Error al verificar token:", error);
    // Si el token es inválido o expirado, mostramos página de error
    res.render('auth/reset-error');
  }
});

// Procesamiento del restablecimiento desde el formulario EJS
router.post("/reset-password/:token", async (req, res) => {
  const { token } = req.params;
  const { newPassword, confirmPassword } = req.body;
  
  // Validaciones básicas
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
    // Verificar token y obtener ID de usuario
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.id);
    
    if (!user) {
      return res.render('auth/reset-error');
    }
    
    // Actualizar contraseña
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    user.password = hashedPassword;
    await user.save();
    
    // Mostrar página de éxito
    res.render('auth/reset-success');
    
  } catch (error) {
    console.error("Error en reset-password:", error);
    res.render('auth/reset-error');
  }
});


module.exports = router;
