const mongoose = require("mongoose");

require("dotenv").config();

const MONGO_URI = process.env.MONGO_URI;

async function connectMongo() {
  try {
    await mongoose.connect(MONGO_URI);
    console.log("Database connected.");
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}

module.exports = {
  connectMongo,
};
