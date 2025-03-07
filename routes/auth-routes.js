const express = require("express");
const {
  registerUser,
  loginUser,
  changePassword,
  forgotPassword,
  resetPassword,
} = require("../controllers/auth-controller");
const authMiddleware = require("../middleware/auth-middleware");
const router = express.Router();

// all routes are related to authentication & authorization

router.post("/register", registerUser);
router.post("/login", loginUser);
router.post("/change-password", authMiddleware, changePassword);
router.post("/forgot-password", forgotPassword);
router.post("/reset-password", resetPassword);

module.exports = router;
