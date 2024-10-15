import BaseError from "./BaseError.js";

class ForbiddenError extends BaseError {
  constructor(message) {
    super(403, message);
    this.name = "UnauthorizedError";
    this.statusCode = 403;
  }
}

export default ForbiddenError;