const mongoose = require("mongoose");

const Question = mongoose.Schema({
  quizName: String,
  quizCode: String,
  questions: Array,
});

module.exports = mongoose.model("questions", Question);
