import BaseError from './BaseError.js';
import UserRegistrationError from './UserRegistrationError.js';

class UserDeregistrationError extends UserRegistrationError {
  constructor(message) {
    super(403, message);
    this.name = 'UserDeregistrationError';
    this.statusCode = 403;
  }
}

export default UserDeregistrationError;
