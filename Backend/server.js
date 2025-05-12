const express = require("express");
const cors = require("cors");
const http = require("http");
const { Server } = require("socket.io");

const app = express();
app.use(cors());
app.use(express.json());

const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: "http://localhost:5173", // Replace with your frontend URL
    methods: ["GET", "POST"],
  },
});

const activeUsers = new Map(); // Map to track users by socket.id

io.on("connection", (socket) => {
  console.log(`User connected: ${socket.id}`);

  // Handle user joining with a username
  socket.on("user_joined", (username) => {
    if (Array.from(activeUsers.values()).includes(username)) {
      socket.emit("username_taken", username);
      return;
    }

    activeUsers.set(socket.id, username);
    console.log("Active Users:", activeUsers);

    io.emit("user_list", Array.from(activeUsers.values()));
    io.emit("message", {
      text: `${username} has joined the chat!`,
      sender: "System",
      timestamp: new Date(),
    });
  });

  // Handle messages
  socket.on("send_message", (messageData) => {
    console.log("Message received:", messageData);
    io.emit("message", messageData); // Broadcast message to all clients
  });

  // Handle disconnection
  socket.on("disconnect", () => {
    const username = activeUsers.get(socket.id);
    activeUsers.delete(socket.id);
    console.log(`User disconnected: ${username} (${socket.id})`);

    io.emit("user_list", Array.from(activeUsers.values()));
    if (username) {
      io.emit("message", {
        text: `${username} has left the chat.`,
        sender: "System",
        timestamp: new Date(),
      });
    }
  });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log("Server is running on port " + PORT);
});
