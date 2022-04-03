const mongoose = require("mongoose");
const express = require("express");
const cors = require("cors");
const quizRoute = require("./api/QuizRoute");
require("dotenv").config();
const server = express();
const errorHandler = require("./middleware/errorHandler");
const path = require("path");

mongoose.connect(process.env.DB_PASSKEY, () => console.log("Connected to DB"));

server.use(cors());
server.use(express.json());
server.use("/api", quizRoute);
server.use(errorHandler);
server.use((req, res, next) => {
  const err = new Error("Not found!");
  res.status(404);
  res.send({ message: err });
});

server.listen(process.env.PORT || 3001);
