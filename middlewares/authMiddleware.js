const jwt = require("jsonwebtoken");
const User = require("../models/User");

const authMiddleware = async (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ message: "No autorizado, token ausente" });
  }

  const token = authHeader.split(" ")[1];

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    const user = await User.findById(decoded.id).select("_id rol");

    if (!user) {
      return res.status(401).json({ message: "Usuario no encontrado" });
    }

    req.user = {
      userId: user._id.toString(),
      rol: user.rol || "user" // por si no tiene campo 'rol', se asume user
    };

    next();
  } catch (error) {
    return res.status(401).json({ message: "Token inválido o expirado", error });
  }
};

module.exports = authMiddleware;
