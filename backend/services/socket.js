// backend/services/socket.js
const { Server } = require("socket.io");

const initializeSocket = (server) => {
  const io = new Server(server, {
    cors: {
      origin: "http://localhost:3000",
      methods: ["GET", "POST"],
    },
  });

  io.on("connection", (socket) => {
    console.log("A client connected");
    socket.on("disconnect", () => {
      console.log("A client disconnected");
    });
  });

  return io;
};

module.exports = initializeSocket;