const { body } = require("express-validator");

const recipeValidator = [
  body("nombre").notEmpty().withMessage("El nombre es obligatorio"),
  body("pesoFinal").isFloat({ gt: 0 }).withMessage("El peso final debe ser un número positivo"),
  body("calorias").isFloat({ min: 0 }).withMessage("Las calorías deben ser un número válido"),
  body("proteinas").isFloat({ min: 0 }).withMessage("Las proteínas deben ser un número válido"),
  body("carbohidratos").isFloat({ min: 0 }).withMessage("Los carbohidratos deben ser un número válido"),
  body("grasas").isFloat({ min: 0 }).withMessage("Las grasas deben ser un número válido"),
  body("azucares").optional().isFloat({ min: 0 }).withMessage("Azúcares debe ser un número válido"),
  body("grasasSaturadas").optional().isFloat({ min: 0 }).withMessage("Grasas saturadas debe ser un número válido"),
  body("fibra").optional().isFloat({ min: 0 }).withMessage("Fibra debe ser un número válido"),
  body("ingredientes").isArray({ min: 1 }).withMessage("Debes añadir al menos un ingrediente")
];

module.exports = recipeValidator;
