const express = require('express');
const http = require('http');
const { Server } = require('socket.io');

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: "http://localhost:5173", // set cors origin to frontend
    credentials: true,
  },
  path: '/api/communication-service',
  transports: ['websocket'],
});

app.use(express.static('public'));

/**
 * 
 * @param {Server<DefaultEventsMap, DefaultEventsMap, DefaultEventsMap, any>} io 
 * @param {Socket<DefaultEventsMap, DefaultEventsMap, DefaultEventsMap, any>} socket 
 * @param {{
 *  roomId: string,
 *  user: {
 *    userId: string,
 *    displayName: string,
 *    email: string
 *    }
 *  }} data 
 *
 */
function onJoinRoom(io, socket, data) {
  const { roomId, user } = data
  onSetUsername(io, socket, user)

  socket.join(roomId); // User joins the specified room
  console.log(`User ${socket.id} joined room ${roomId}`);

  // broadcast that a user has joined the room
  io.to(roomId).emit("user-joined", {
    userSocketId: socket.id,
    timestamp: new Date()
  })

  // update users in room
  onRoomPeopleUpdate(io, socket, { roomId })


}

/**
 * 
 * @param {Server<DefaultEventsMap, DefaultEventsMap, DefaultEventsMap, any>} io 
 * @param {Socket<DefaultEventsMap, DefaultEventsMap, DefaultEventsMap, any>} socket 
 * @param {*} data 
 * @param {string?} removeUserId
 */
function onRoomPeopleUpdate(io, socket, data, removeUserId) {
  const { roomId } = data

  console.log("LOG: Remove user id", removeUserId)
  io.in(roomId).fetchSockets().then((sockets) => {
    console.log(`LOG: userIds in room = ${sockets.map(socket => socket.userId)}`)
    // in this loop, this is all the users in this room 
    const userSocketsInRoom = sockets.filter(socket => !removeUserId ? true : socket.userId !== removeUserId)


    // tell frontend who is in the room
    // if removeUserId is not null, means that we are calling this function
    // from onBeforeDisconnect, and we want to remove the user who is about to disconenct
    // from this list
    const users = userSocketsInRoom.map(socket => ({
      userId: socket.userId,
      name: socket.name,
      email: socket.email,
      userSocketId: socket.id
    }))

    // console.log("<<<<<<<<<")
    // console.log({ usersInRoom })

    console.log(`INFO: there are now { ${users.length} } users in the room`)
    userSocketsInRoom.forEach(socket => {
      socket.emit("room-people-update", {
        users: users
      })
    })

  })
}

/**
 * 
 * @param {Server<DefaultEventsMap, DefaultEventsMap, DefaultEventsMap, any>} io 
 * @param {Socket<DefaultEventsMap, DefaultEventsMap, DefaultEventsMap, any>} socket  
 * @param {{
 *  name: string,
 *  email: string,
 *  userId: string,
 * }} data 
 */
function onSetUsername(io, socket, data) {
  const { name, email, userId } = data
  socket.name = name
  socket.email = email
  socket.userId = userId
  console.log(`User socketId { ${socket.id} } set name to ${name} and email to ${email}`)

  // note: username-set not captured on the client side
  socket.emit("username-set", { name, email })
}


function onChatMessage(io, socket, data) {
  const { roomId, message } = data

  console.log(`Received message { ${message} } for room id { ${roomId} }`)
  io.to(roomId).emit('chat-message', {
    sender: {
      userId: socket.userId,
      name: socket.name,
      email: socket.email,
      userSocketId: socket.id
    },
    content: message,
    timestamp: new Date()
  }); // Broadcast to users in the room

  // send back confirmation saying server received sent chat message
  socket.emit("message-sent")
}


function onBeforeDisconnect(io, socket) {
  console.log("LOG: onBeforeDisconnect")

  // because each socket is automatically assigned to a room with the same id as the socket id
  // remove tha troom
  const rooms = socket.rooms
  rooms.delete(socket.id)

  rooms.forEach(roomId => {

    onRoomPeopleUpdate(io, socket, { roomId }, socket.userId)
    io.to(roomId).emit("user-left", {
      userId: socket.id,
      timestamp: new Date()
    })

  })
}

io.on('connection', (socket) => {
  console.log('A user connected:', socket.id);


  // Listen for a join request from the client
  socket.on('joinRoom', (data) => onJoinRoom(io, socket, data))

  // Handle chat messages for a specific room
  socket.on('chat-message', (data) => onChatMessage(io, socket, data));

  // capture event before fully disconnect to alert other user of leaving the chatroom
  socket.on("disconnecting", () => onBeforeDisconnect(io, socket))

  // set user details
  socket.on("set-details", (data) => onSetUsername(io, socket, data))


  socket.on('disconnect', () => {
    console.log(`INFO: User disconnected with socket id { ${socket.id} }`);
  });
});

const PORT = process.env.PORT || 8005;
server.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});

