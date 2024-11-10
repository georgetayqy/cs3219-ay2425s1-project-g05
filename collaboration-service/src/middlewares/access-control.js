import { config } from 'dotenv';
import jwt from 'jsonwebtoken';

config();

export function verifyAccessToken(token) {
  return jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, (err, user) => {
    if (err) {
      return null;
    }
    return user;
  });
}

export default verifyAccessToken;
