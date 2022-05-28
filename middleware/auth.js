import { CustomeErrorHandler, JwtService } from "../services";



const auth = async (req, res, next) => {
    let authHeader = req.headers.authorization;

    if (!authHeader) {
        return next(CustomeErrorHandler.unAuthorized());
    }

    const token = authHeader.split(' ')[1];

    try {
        const { _id, role, licenseId } = JwtService.verify(token);
        const user = {
            _id,
            role,
            licenseId
        }
        // console.log(user);
        req.user = user;
        
        next();
    } catch (err) {
        return next(CustomeErrorHandler.unAuthorized());
    }
};

export default auth;