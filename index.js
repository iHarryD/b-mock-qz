const mongoose = require("mongoose");
const express = require("express");
const app = express();
const server = require("http").createServer(app);
const cors = require("cors");
const authRoutes = require("./api/authRoute");
const quizRoute = require("./api/QuizRoute");
const questionRoute = require("./api/QuestionRoute");
require("dotenv").config();
const io = require("socket.io")(server, {
  cors: {
    origin: "*",
  },
});
const errorHandler = require("./middleware/errorHandler");
app.use(cors());

mongoose.connect(
  process.env.DB_PASSKEY,
  {
    enableUtf8Validation: true,
  },
  () => console.log("MongoDB connection established.")
);

io.on("connection", (socket) => {
  console.log(`${socket.id} connected`);
  socket.on("disconnect", (socket) => console.log(`${socket.id} disconnected`));
  socket.on("createRoom", (roomID) => {
    socket.join(String(roomID));
    io.emit("messageToAll", `Room ${roomID} created by ${socket.id}`);
  });
  socket.on("joinRoom", (roomID) => {
    socket.join(String(roomID));
    io.emit("messageToAll", `${socket.id} joined room ${roomID}`);
  });
  socket.on("messageToAll", (message) => {
    io.emit("messageToAll", `${socket.id}: ${message}`);
  });
  socket.on("messageToRoom", (roomID, message) => {
    io.in(roomID).emit("messageToRoom", `${socket.id}: ${message}`);
  });
});

app.use(express.json());
app.use("/api", authRoutes);
app.use("/api", quizRoute);
app.use("/api", questionRoute);
app.use(errorHandler);
app.use((req, res, next) => {
  const err = new Error("Not found!");
  res.status(404);
  res.send({ message: err });
});

server.listen(process.env.PORT || 3001);
