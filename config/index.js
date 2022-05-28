import dotenv from 'dotenv';
dotenv.config();

export const {
    APP_PORT,
    DB_CON,
    DEBUG_MODE,
    JWT_SECRET,
    REFRESH_SECRET,
    TOKEN_EXPIRY,
    REFRESH_TOKEN_EXPIRY,
    SOCKET_URL,
} = process.env;