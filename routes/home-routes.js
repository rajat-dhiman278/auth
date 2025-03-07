const express = require("express");
const authMiddleware = require("../middleware/auth-middleware");
const router = express.Router();

router.get("/welcome", authMiddleware, (req, res) => {
  const { userId, username, role, userEmail } = req.userInfo;

  res.json({
    message: "Welcome to the home page",
    user: {
      _id: userId,
      username,
      role,
      email: userEmail,
    },
  });
});

module.exports = router;
