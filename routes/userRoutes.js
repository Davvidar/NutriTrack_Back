const express = require("express");
const { registerUser, loginUser, getProfile, activateAccount, resetPasswordRequest, resetPassword } = require("../controllers/userController");
const authMiddleware = require("../middlewares/authMiddleware");

const router = express.Router();

router.post("/register", registerUser);
router.post("/login", loginUser);
router.get("/profile", authMiddleware, getProfile);
router.get("/activate/:token", activateAccount);

router.post("/reset-password-request", resetPasswordRequest);
router.post("/reset-password/:token", resetPassword);

module.exports = router;
