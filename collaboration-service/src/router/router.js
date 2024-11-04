import express from 'express';
import {
  createRoom,
  getRoomDetails,
  getUserDetails,
  deleteRoom,
  registerUser,
  deregisterUser,
} from '../session/api.js';

// disable admin checks for now
import checkAdmin from '../middlewares/access-control.js';
import LocalClient from '../session/client.js';

const router = express.Router();

// retrieve details about the room
router.route('/users/').get(getUserDetails);

// retrieve details about the user
router.route('/rooms/:roomId').get(getRoomDetails);

// create a room
router.route('/create-room').post(createRoom);

// delete a room
router.route('/rooms/').delete(deleteRoom);

// register user to room
router.route('/register/').post(registerUser);

// deregister user to room
router.route('/deregister/').post(deregisterUser);

router.route('/').get((req, resp, nxt) => {
  return resp.status(200).json({
    data: LocalClient.getState(),
  });
});

export { router };
