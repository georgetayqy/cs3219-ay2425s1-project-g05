import BaseError from "./BaseError.js";

class UnauthorisedError extends BaseError {
  constructor(message) {
    super(401, message);
    this.name = "UnauthorizedError";
    this.statusCode = 401;
  }
}

export default UnauthorisedError;