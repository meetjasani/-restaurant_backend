import Joi from 'joi';
import { LicenseString, User } from '../../../models';
import bcrypt from 'bcrypt';
import { CustomeErrorHandler } from '../../../services';

const registerUser = {
    async register(req, res, next) {
        //validation
        const registerSchema = Joi.object({
            name: Joi.string().min(3).max(50).required().messages({
                'string.min': `Name should minimum {#limit} character.`,
                'string.max': `Name should maximum {#limit} character.`,
                'string.empty': `Name is required field.`
            }),
            username: Joi.string().min(3).required()
                .messages({
                    'string.min': `Username should have a minimum length of {#limit}.`,
                    'string.empty': `Username is required field.`
                }),
            mobileNumber: Joi.string().regex(/^[0-9]{10}$/).messages({ 'string.pattern.base': `Mobile number must have 10 digits.` }).optional().allow(''),
            // password: Joi.string().min(5).required().messages({
            //     'string.min': `Password should have a minimum length of {#limit}.`,
            // }),
            // repeat_password: Joi.any().valid(Joi.ref('password')).required().messages({
            //     "any.only": "Password must match"
            // }),
            roleId: Joi.string(),
            isEnabled: Joi.boolean().optional()
        });

        const { error } = registerSchema.validate(req.body);

        if (error) {
            return next(error);
        }

        const { name, username, mobileNumber, roleId } = req.body;

        // Checking license limit
        const userLimit = await LicenseString.find({ isDelete: false, licenseId: req.user.licenseId, licenseEndDate: { $gte: new Date() } }).sort({ createdAt: 1 }).limit(1);
        const countUser = await User.find({ isDelete: false, licenseId: req.user.licenseId }).count();

        try {
            if (countItem >= itemLimit[0]['userLimit']) {
                return next(CustomeErrorHandler.licenseLimitExceeded());
            }
        } catch (error) {

        }

        // Duplicate Mobile Number
        try {
            const existNumber = await User.exists({ mobileNumber: mobileNumber, isDelete: false });
            if (existNumber) {
                return next(CustomeErrorHandler.alreadyExist('Mobile Number Already Exist'));
            }
            const existUsername = await User.exists({ username: username, isDelete: false });
            if (existUsername) {
                return next(CustomeErrorHandler.alreadyExist('Username Already Exist'));
            }

        } catch (err) {
            return next(err);
        }

        // Hash Password

        const hasedPassword = await bcrypt.hash("12345678", 10);
        console.log(req.user);

        const user = new User({
            name,
            username,
            mobileNumber,
            password: hasedPassword,
            roleId,
            licenseId: req.user.licenseId,
            userId: req.user._id,
        });
        console.log(user);

        let access_token;
        let refresh_token;

        let result;
        try {
            result = await user.save();
        } catch (err) {
            console.log(err);
            return next(err);
        }

        res.json(result);
    }
}

export default registerUser;