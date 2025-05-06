const { body } = require("express-validator");

const userRegisterValidator = [
  body("nombre").notEmpty().withMessage("El nombre es obligatorio"),
  body("apellido").notEmpty().withMessage("El apellido es obligatorio"),
  body("correo").isEmail().withMessage("Correo electrónico no válido"),
  body("password").isLength({ min: 6 }).withMessage("La contraseña debe tener al menos 6 caracteres"),
  body("peso").isFloat({ gt: 0 }).withMessage("El peso debe ser un número positivo"),
  body("altura").isFloat({ gt: 0 }).withMessage("La altura debe ser un número positivo"),
  body("edad").isInt({ gt: 0 }).withMessage("La edad debe ser un número entero positivo"),
  body("sexo").notEmpty().withMessage("El sexo es obligatorio"),
  body("objetivo").notEmpty().withMessage("El objetivo es obligatorio"),
  body("actividad").notEmpty().withMessage("El nivel de actividad es obligatorio")
];

const userLoginValidator = [
  body("correo").isEmail().withMessage("Correo electrónico no válido"),
  body("password").notEmpty().withMessage("La contraseña es obligatoria")
];

const passwordResetRequestValidator = [
  body("correo").isEmail().withMessage("Correo electrónico no válido")
];

const passwordResetValidator = [
  body("newPassword").isLength({ min: 6 }).withMessage("La nueva contraseña debe tener al menos 6 caracteres")
];

module.exports = {
  userRegisterValidator,
  userLoginValidator,
  passwordResetRequestValidator,
  passwordResetValidator
};
