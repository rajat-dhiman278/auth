require("dotenv").config();
const express = require("express");
const cors = require("cors");
const bodyParser = require("body-parser");
const connectToDB = require("./database/db");
const authRoutes = require("./routes/auth-routes");
const homeRoutes = require("./routes/home-routes");
const adminRoutes = require("./routes/admin-routes");
const uploadImageRoutes = require("./routes/image-routes");

connectToDB();
const app = express();
const PORT = process.env.PORT || 8000;

// Middlewares
app.use(cors());
app.use(bodyParser.json()); // Parse JSON bodies
app.use(bodyParser.urlencoded({ extended: true }));

app.use("/api/auth", authRoutes);
app.use("/api/home", homeRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/image", uploadImageRoutes);

app.listen(PORT, () => {
  console.log(`server is now running on port: ${PORT}`);
});
