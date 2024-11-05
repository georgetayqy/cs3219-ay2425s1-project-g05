import BaseError from './BaseError.js';

class RoomCapacityError extends BaseError {
  constructor(message) {
    super(403, message);
    this.name = 'RoomCapacityError';
    this.statusCode = 403;
  }
}

export default RoomCapacityError;
