import { JWT_SECRET, TOKEN_EXPIRY } from '../config';
import jwt from 'jsonwebtoken';

class JwtService {
    static sign(payload, secret = JWT_SECRET, expiry = TOKEN_EXPIRY) {
        return jwt.sign(payload, secret, { expiresIn: expiry });
    }

    static verify(token, secret = JWT_SECRET) {
        return jwt.verify(token, secret);
    }
}

export default JwtService;