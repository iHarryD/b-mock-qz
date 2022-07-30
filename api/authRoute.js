const router = require("express").Router();
const jwt = require("jsonwebtoken");
const bcrypt = require("bcrypt");
const users = require("../models/UserModel");
const {
  signupJoiValidation,
  loginJoiValidation,
} = require("../validations/authJoiValidation");

router.post("/signup", async (req, res, next) => {
  const { error } = signupJoiValidation(req.body);
  if (error) return res.status(400).send({ message: error.details[0].message });
  try {
    const userData = await users.findOne({
      email: req.body.email,
    });
    if (userData)
      return res
        .status(403)
        .send({ message: "This email is already registered with us." });
    const encryptedPassword = await bcrypt.hash(req.body.password, 10);
    const newUser = new users({ ...req.body, password: encryptedPassword });
    await newUser.save();
    res.status(200).send({ message: "Successfully registered." });
  } catch (err) {
    next(err);
  }
});

router.post("/login", async (req, res, next) => {
  const wrongCredentialsMessage = "Invalid email or password.";
  const { error } = loginJoiValidation(req.body);
  if (error) return res.status(400).send({ message: error.details[0].message });
  try {
    const userData = await users.findOne({ email: req.body.email });
    if (!userData)
      return res.status(401).send({ message: wrongCredentialsMessage });
    const passwordMatches = await bcrypt.compare(
      req.body.password,
      userData.password
    );
    if (!passwordMatches)
      return res.status(401).send({ message: wrongCredentialsMessage });
    const token = jwt.sign({ email: userData.email }, process.env.TOKEN_SECRET);
    res.status(200).send({
      message: "Successfully logged in!",
      data: {
        email: userData.email,
        token,
      },
    });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
