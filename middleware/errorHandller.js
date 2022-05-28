import { DEBUG_MODE } from "../config";
import { ValidationError } from 'joi';
import {CustomeErrorHandler} from "../services";

const errorHandller = (err, req, res, next) => {

    let statusCode = 500;
    let data = {
        message: 'Internal Server Error',
        ...(DEBUG_MODE === 'true' && { originalMessage: err.originalMessage })
    };

    

    if (err instanceof ValidationError) {
        statusCode = 422,
            data = {
                message: err.message
            }
        // console.log('ValidationError : '+data.message,'Status Code : '+statusCode);
    }

    if (err instanceof CustomeErrorHandler) {
        statusCode = err.status,
        data = {
            message : err.message
        }
        // console.log('CustomeErrorHandler : '+data.message,'Status Code : '+statusCode);
    }

    return res.status(statusCode).json(data);

};

export default errorHandller;
