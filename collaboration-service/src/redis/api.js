import BaseError from '../errors/BaseError.js';
import RedisClient from './client.js';

const client = new RedisClient();
await client.createIfAbsent();

const createRoom = async (request, response, next) => {
  try {
    const users = [];

    // If users do not specify
    if ('users' in request.body) {
      users = request.body.users; // list of email addresses
    }

    const roomId = await client.createRoom(users);

    return response.status(200).json({
      statusCode: 200,
      data: {
        roomId: roomId,
      },
    });
  } catch (err) {
    next(
      err instanceof BaseError
        ? err
        : new BaseError(500, 'Unable to query Redis')
    );
  }
};

const deleteRoom = async (request, response, next) => {
  try {
    const { roomId } = request.params;
    await client.deleteRoom(roomId);
  } catch (err) {
    next(
      err instanceof BaseError
        ? err
        : new BaseError(500, 'Unable to query Redis')
    );
  }
};

const getRoomDetails = async (request, response, next) => {
  try {
    const { roomId } = request.query;
    const users = await client.findUsersFromRoom(roomId);

    return response.status(200).json({
      statusCode: 200,
      data: {
        roomId: roomId,
        users: users,
      },
    });
  } catch (err) {
    next(
      err instanceof BaseError
        ? err
        : new BaseError(500, 'Unable to query Redis')
    );
  }
};

const getUserDetails = async (request, response, next) => {
  try {
    const { userId } = request.query;
    const roomId = await client.findRoomByUser(userId);

    return response.status(200).json({
      statusCode: 200,
      data: {
        userId: userId,
        roomId: roomId,
      },
    });
  } catch (err) {
    next(
      err instanceof BaseError
        ? err
        : new BaseError(500, 'Unable to query Redis')
    );
  }
};

const registerUser = async (request, response, next) => {
  try {
    const { roomId, userId } = request.query;
    await client.registerUser(roomId, userId);
  } catch (err) {
    next(
      err instanceof BaseError
        ? err
        : new BaseError(500, 'Unable to query Redis')
    );
  }
};

const deregisterUser = async (request, response, next) => {
  try {
    const { roomId, userId } = request.query;
    await client.deregisterUser(roomId, userId);
  } catch (err) {
    next(
      err instanceof BaseError
        ? err
        : new BaseError(500, 'Unable to query Redis')
    );
  }
};

export {
  client,
  createRoom,
  getRoomDetails,
  getUserDetails,
  deleteRoom,
  registerUser,
  deregisterUser,
};
