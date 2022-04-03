const mongoose = require("mongoose");

const Quiz = mongoose.Schema({
  quizName: String,
  quizCode: String,
  quizDescription: String,
});

module.exports = mongoose.model("quizes", Quiz);
