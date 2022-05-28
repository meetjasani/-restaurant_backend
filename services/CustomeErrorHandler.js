class CustomeErrorHandler extends Error {
    constructor(status, msg) {
        super();
        this.status = status;
        this.message = msg;
    }

    static alreadyExist(message = 'Data Already Exist') {
        return new CustomeErrorHandler(409, message);
    }

    static recordNotFound(message = 'Data Not Found') {
        return new CustomeErrorHandler(404, message);
    }

    static personNotFound(message = 'Person Not Found') {
        return new CustomeErrorHandler(404, message);
    }

    static wrongCredentials(message = 'User name or Password is Wrong.') {
        return new CustomeErrorHandler(401, message);
    }

    static unAuthorized(message = 'unAuthorized request') {
        return new CustomeErrorHandler(401, message);
    }

    static recordContainsData(message = 'Record Contains Data') {
        return new CustomeErrorHandler(404, message);
    }

    static licenseLimitExceeded(message = 'License Limit Full') {
        return new CustomeErrorHandler(402, message);
    }
}

export default CustomeErrorHandler;