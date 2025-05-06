const express = require("express");
const {
  registerUser,
  loginUser,
  getProfile,
  updateProfile,
  activateAccount,
  resetPasswordRequest,
  resetPassword
} = require("../controllers/userController");

const authMiddleware = require("../middlewares/authMiddleware");
const validateFields = require("../middlewares/validateFields");
const {
  userRegisterValidator,
  userLoginValidator,
  passwordResetRequestValidator,
  passwordResetValidator
} = require("../middlewares/userValidator");

const router = express.Router();

// Registro y login
router.post("/register", userRegisterValidator, validateFields, registerUser);
router.post("/login", userLoginValidator, validateFields, loginUser);

// Perfil
router.get("/profile", authMiddleware, getProfile);
router.put("/profile", authMiddleware, updateProfile); // ✅ NUEVO ENDPOINT

// Activación
router.get("/activate/:token", activateAccount);

// Restablecimiento de contraseña
router.post("/reset-password-request", passwordResetRequestValidator, validateFields, resetPasswordRequest);
router.post("/reset-password/:token", passwordResetValidator, validateFields, resetPassword);

module.exports = router;
