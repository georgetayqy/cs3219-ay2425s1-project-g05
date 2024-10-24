import BaseError from './BaseError.js';

class UserAlreadyFoundInRoomError extends BaseError {
  constructor(message) {
    super(403, message);
    this.name = 'UserAlreadyFoundInRoomError';
    this.statusCode = 403;
  }
}

export default UserAlreadyFoundInRoomError;
