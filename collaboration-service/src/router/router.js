import express from 'express';
import {
  createRoom,
  getRoomDetails,
  getUserDetails,
  deleteRoom,
  registerUser,
  deregisterUser,
  getRoomStatus,
  updateRoomStatus,
} from '../session/api.js';

const router = express.Router();

// retrieve details about the room
router.route('/users/').get(getUserDetails);

// retrieve details about the user
router.route('/rooms/:roomId').get(getRoomDetails);

// check if room is deleted or not
router.route('/rooms/status/:roomId').get(getRoomStatus);

// mark a room as deleted
router.route('/rooms/status/:roomId').post(updateRoomStatus);

// create a room
router.route('/create-room').post(createRoom);

// delete a room
router.route('/rooms/').delete(deleteRoom);

// register user to room
router.route('/register/').post(registerUser);

// deregister user to room
router.route('/deregister/').post(deregisterUser);

export { router };
