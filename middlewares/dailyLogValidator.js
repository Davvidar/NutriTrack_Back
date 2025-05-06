const { body } = require("express-validator");

const isValidObjectId = (value) => {
  return /^[a-fA-F0-9]{24}$/.test(value);
};

const mealItemValidator = (items, { path }) => {
  if (!Array.isArray(items)) return false;
  for (const item of items) {
    if (
      typeof item !== "object" ||
      !item.productId ||
      !isValidObjectId(item.productId) ||
      typeof item.cantidad !== "number" ||
      item.cantidad <= 0
    ) {
      throw new Error(`Comida '${path}' contiene un producto inválido`);
    }
  }
  return true;
};

const dailyLogValidator = [
  body("pesoDelDia")
    .optional()
    .isFloat({ gt: 0 })
    .withMessage("El peso debe ser un número positivo"),

  // Valida que comidas sea un objeto con 6 arrays válidos (opcionalmente puedes reducir la cantidad si permites comidas personalizadas)
  body("comidas.desayuno").optional().custom(mealItemValidator),
  body("comidas.almuerzo").optional().custom(mealItemValidator),
  body("comidas.comida").optional().custom(mealItemValidator),
  body("comidas.merienda").optional().custom(mealItemValidator),
  body("comidas.cena").optional().custom(mealItemValidator),
  body("comidas.recena").optional().custom(mealItemValidator)
];

module.exports = dailyLogValidator;
