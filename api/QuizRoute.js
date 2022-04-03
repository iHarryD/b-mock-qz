const router = require("express").Router();
const QuizesModel = require("../models/QuizModel");

router.get("/get-quizes", async (req, res, next) => {
  try {
    const data = await QuizesModel.find();
    res.send({ quizes: data });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
