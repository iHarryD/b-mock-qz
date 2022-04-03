const router = require("express").Router();
const QuestionModel = require("../models/QuestionModel");

router.get("/get-questions", async (req, res, next) => {
  try {
    const data = await QuestionModel.findOne({ quizCode: req.query.quizCode });
    res.send(data);
  } catch (err) {
    next(err);
  }
});

module.exports = router;
