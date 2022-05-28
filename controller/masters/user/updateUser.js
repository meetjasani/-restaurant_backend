import Joi from "joi";
import { User } from "../../../models";
import bcrypt from 'bcrypt';
import { CustomeErrorHandler } from "../../../services";

const updateUser = {
    async update(req, res, next) {
        const registerSchema = Joi.object({
            _id: Joi.string(),
            name: Joi.string().min(3).max(30).required().messages({
                'string.min': `Name should minimum {#limit} character.`,
                'string.max': `Name should maximum {#limit} character.`,
                'string.empty': `Name is required field.`
            }),
            username: Joi.string().min(3).required()
                .messages({
                    'string.min': `Username should have a minimum length of {#limit}.`,
                    'string.empty': `Username is required field.`
                }),
            mobileNumber: Joi.string().regex(/^[0-9]{10}$/).messages({ 'string.pattern.base': `Mobile number must have 10 digits.` }).required(),
            roleId: Joi.string(),
            isEnabled: Joi.boolean().optional()
        });

        const { error } = registerSchema.validate(req.body);

        if (error) {
            return next(error);
        }

        const { _id, name, username, mobileNumber, roleId, isEnabled } = req.body;
        console.log(_id);

        // Duplicate Mobile Number
        try {
            const mobileExist = await User.exists({ mobileNumber: mobileNumber, _id: { $ne: _id }, isDelete: false });
            const userNameExist = await User.exists({ username: username, _id: { $ne: _id }, isDelete: false });

            if (mobileExist || userNameExist) {
                let errorMsg = [];
                if (mobileExist) {
                    errorMsg.push('Mobile Number Already Exist');
                }
                if (userNameExist) {
                    errorMsg.push('Username Already Exist');
                }
                return next(CustomeErrorHandler.alreadyExist(errorMsg.join(', ')));
            }

            let res = await User.findByIdAndUpdate({ _id: _id }, {
                $set: {
                    name, username, mobileNumber, roleId, isEnabled, licenseId: req.user.licenseId, userId: req.user._id,
                }
            }, { new: true })

            if (!isEnabled) {
                //Socket to send message to client
                globalEmit("logout", { user_id: _id });
            }

        } catch (err) {
            console.log(err);
            return next(err);
        }

        res.json("Updated");
    },

    async toggleEnable(req, res, next) {
        const { id } = req.params
        try {
            const user = await User.findById(id);
            if (user) {
                await User.findByIdAndUpdate({ _id: id }, {
                    $set: {
                        userId: req.user._id,
                        isEnabled: user.isEnabled ? false : true
                    }
                }, { new: true })
                if (user.isEnabled) {
                    //Socket to send message to client
                    globalEmit("logout", { user_id: id });
                }
            }
        } catch (error) {
            console.log(error);
            return next(error);
        }
        res.json("Updated");
    },

    async passwordChange(req, res, next) {
        const registerSchema = Joi.object({
            name: Joi.string().min(3).max(30).required().messages({
                'string.min': `Name should minimum {#limit} character.`,
                'string.max': `Name should maximum {#limit} character.`,
                'string.empty': `Name is required field.`
            }),
            password: Joi.string().min(5).required().messages({
                'string.min': `Password should have a minimum length of {#limit}.`,
            }),
            repeat_password: Joi.any().valid(Joi.ref('password')).required().messages({
                "any.only": "Password must match"
            }),
        });

        const { error } = registerSchema.validate(req.body);

        if (error) {
            return next(error);
        }

        const { name, password } = req.body;
        const hasedPassword = await bcrypt.hash(password, 10);

        let result;
        try {
            result = await User.findByIdAndUpdate({ _id: req.user._id }, {
                $set: {
                    name: name,
                    password: hasedPassword
                }
            }, { new: true })
        } catch (error) {
            console.log(error);
            return next(error);
        }
        res.json(result.name);

    }
}
export default updateUser;