const { timeStamp } = require('console');
const express = require('express');
const http = require('http');
const { Server } = require('socket.io');

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: "http://localhost:5173" // set cors origin to frontend
  }
});

app.use(express.static('public'));

function onJoinRoom(io, socket, data) {
  const roomId = data
  socket.join(roomId); // User joins the specified room
  console.log(`User ${socket.id} joined room ${roomId}`);

  // broadcast that a user has joined the room
  io.to(roomId).emit("user-joined", {
    userId: socket.id,
    timeStamp: new Date()
  })
}

function onChatMessage(io, socket, data) {
  const { roomId, message } = data

  console.log(`Received message { ${message} } for room id { ${roomId} }`)
  io.to(roomId).emit('chat-message', {
    senderId: socket.id,
    content: message,
    timeStamp: new Date()
  }); // Broadcast to users in the room

  // send back confirmation saying server received sent chat message
  socket.emit("message-sent")
}

function onBeforeDisconnect(io, socket) {
  const rooms = socket.rooms;

  rooms.forEach(roomId => {
    io.to(roomId).emit("user-left", {
      userId: socket.id,
      timeStamp: new Date()
    })
  })
}

io.on('connection', (socket) => {
  console.log('A user connected:', socket.id);

  // Listen for a join request from the client
  socket.on('joinRoom', (data) => onJoinRoom(io, socket, data))

  // Handle chat messages for a specific room
  socket.on('chat message', (data) => onChatMessage(data));

  // capture event before fully disconnect to alert other user of leaving the chatroom
  socket.on("disconnecting", () => onBeforeDisconnect(io, socket))


  socket.on('disconnect', () => {
    console.log('User disconnected:', socket.id);
  });
});

const PORT = process.env.PORT || 8005;
server.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});

