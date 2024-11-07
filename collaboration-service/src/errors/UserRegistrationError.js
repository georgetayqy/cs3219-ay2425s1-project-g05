import BaseError from './BaseError.js';

class UserRegistrationError extends BaseError {
  constructor(message) {
    super(403, message);
    this.name = 'UserRegistrationError';
    this.statusCode = 403;
  }
}

export default UserRegistrationError;
