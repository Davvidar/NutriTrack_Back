// middlewares/productValidator.js
const { body } = require("express-validator");

const productValidationRules = [
  body("nombre").notEmpty().withMessage("El nombre es obligatorio"),
  body("calorias").isFloat({ min: 0 }).withMessage("Las calorías deben ser un número válido"),
  body("proteinas").isFloat({ min: 0 }).withMessage("Las proteínas deben ser un número válido"),
  body("carbohidratos").isFloat({ min: 0 }).withMessage("Los carbohidratos deben ser un número válido"),
  body("grasas").isFloat({ min: 0 }).withMessage("Las grasas deben ser un número válido"),
  // Opcionales pero si se envían, deben ser válidos:
  body("azucares").optional().isFloat({ min: 0 }).withMessage("Azúcares debe ser un número válido"),
  body("grasasSaturadas").optional().isFloat({ min: 0 }).withMessage("Grasas saturadas debe ser un número válido"),
  body("fibra").optional().isFloat({ min: 0 }).withMessage("Fibra debe ser un número válido"),
  body("sal").optional().isFloat({ min: 0 }).withMessage("Sal debe ser un número válido"),
  body("porcion").optional().isFloat({ min: 0 }).withMessage("Porción debe ser un número válido")
];

module.exports = productValidationRules;
