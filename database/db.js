const mongoose = require("mongoose");
const mongodb_uri = process.env.MONGO_URI;
const connectToDB = async () => {
  try {
    await mongoose.connect(mongodb_uri);
    console.log("MongoDb connected successfully");
  } catch (e) {
    console.error("MongoDb connection failed");
    process.exit(1);
  }
};

module.exports = connectToDB;
