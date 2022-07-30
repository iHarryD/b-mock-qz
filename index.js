const mongoose = require("mongoose");
const express = require("express");
const app = express();
const server = require("http").createServer(app);
const cors = require("cors");
const authRoutes = require("./api/authRoute");
const quizRoute = require("./api/QuizRoute");
const questionRoute = require("./api/QuestionRoute");
const getRandomNumber = require("./helpers/getRandomNumber");
const questions = require("./models/QuestionModel");
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

function handleCustomRoom(socket) {
  socket.on("create-room", (quizDetails, callbackFunction) => {
    removeUserFromAllRooms(socket);
    const existingRooms = Array.from(io.sockets.adapter.rooms).filter(
      (room) => !room[1].has(room[0])
    );
    const newRoomID = existingRooms.length
      ? String(Number(existingRooms[existingRooms.length - 1][0]) + 1)
      : "1";
    removeUserFromAllRooms(socket);
    socket.join(newRoomID);
    handleQuiz(socket, newRoomID);
    socket.on("ready", async (roomID, quizDetails) => {
      try {
        if (io.sockets.adapter.rooms.get(roomID).size === 2) {
          io.in(roomID).emit("message", "Quiz will begin soon.");
          const result = await questions.findOne({
            quizCode: quizDetails.code,
          });
          io.in(roomID).emit("start", {
            name: result.quizName,
            code: result.quizCode,
            questions: result.questions,
          });
        } else {
          io.in(roomID).emit(
            "error-message",
            "Cannot start with one player only."
          );
        }
      } catch (err) {
        return io.in(roomID).emit("error-message", err);
      }
    });
    io.in(newRoomID).emit(
      "message",
      `${socket.data.nickname} created room ${newRoomID} for ${quizDetails.name} quiz`
    );
    if (callbackFunction) callbackFunction(newRoomID);
  });
  socket.on("join-room", (roomID, callbackFunction) => {
    const searchedRoom = io.sockets.adapter.rooms.get(roomID);
    if (!searchedRoom)
      return io.emit("error-message", `Room ${roomID} does not exist.`);
    if (searchedRoom.size >= 2)
      return io.emit("error-message", `Room ${roomID} is full.`);
    removeUserFromAllRooms(socket);
    socket.join(String(roomID));
    handleQuiz(socket, roomID);
    io.in(roomID).emit(
      "message",
      `${socket.data.nickname} joined room ${roomID}`
    );
    if (callbackFunction) callbackFunction(roomID);
  });
}

function removeUserFromAllRooms(socket) {
  const existingRooms = Array.from(io.sockets.adapter.rooms).filter(
    (room) => !room[1].has(room[0])
  );
  existingRooms.forEach((room) => socket.leave(room[0]));
}

function handleQuiz(socket, roomID) {
  socket.on("next-question", (opponentScoreFromCurrentQuestion) => {
    socket.to(roomID).emit("next-question", opponentScoreFromCurrentQuestion);
  });
  socket.on("end-quiz", () => {
    io.in(roomID).emit("end-quiz");
  });
}

io.on("connection", (socket) => {
  console.log(`${socket.id} connected`);
  socket.on("disconnect", (socket) => console.log(`${socket.id} disconnected`));
  socket.on("add-nickname", (nickname) => (socket.data.nickname = nickname));
  handleCustomRoom(socket);
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
