import Joi from "joi";
import { SmsSettings } from "../../models";
import { CustomeErrorHandler } from "../../services";

const smsSettingController = {
    async add(req, res, next) {
        //Validating Req Data
        const smsSettingSchema = Joi.object({
            smsUserId: Joi.string().required(),
            senderId: Joi.string().required(),
            password: Joi.string().required(),
            isDefault: Joi.boolean().required(),
        })

        const { error } = smsSettingSchema.validate(req.body, { abortEarly: false });

        if (error) {
            return next(error);
        }

        let { smsUserId, senderId, password, isDefault } = req.body;

        const smsSetting = new SmsSettings({
            smsUserId, senderId, password, isDefault, userId: req.user._id, licenseId: req.user.licenseId
        });

        // Check For Duplicate Record
        try {
            const exist = await SmsSettings.exists({
                smsUserId, senderId, isDelete: false, licenseId: req.user.licenseId
            }).collation({ locale: 'en', strength: 2 });

            if (exist) {
                return next(CustomeErrorHandler.alreadyExist());
            }
        } catch (error) {
            return next(error);
        }

        //Insert New Record
        let result;
        try {
            //console.log('New Data');
            result = await smsSetting.save();
        } catch (err) {
            return next(err);
        }

        return res.json(result);
    },
    async update(req, res, next) {
        //Validating Req Data
        const smsSettingSchema = Joi.object({
            _id: Joi.string().required(),
            smsUserId: Joi.string().required(),
            senderId: Joi.string().required(),
            password: Joi.string().required(),
            isDefault: Joi.boolean().required(),
        })

        const { error } = smsSettingSchema.validate(req.body, { abortEarly: false });

        if (error) {
            return next(error);
        }

        let { _id, smsUserId, senderId, password, isDefault } = req.body;

        // Check For Duplicate Record
        let result;
        try {
            result = await SmsSettings.findOne({
                smsUserId, senderId, isDelete: false, _id: { $ne: _id }, licenseId: req.user.licenseId
            }).collation({ locale: 'en', strength: 2 });
        } catch (error) {
            return next(err);
        }

        //Updating Record
        if (result) {
            return next(CustomeErrorHandler.alreadyExist());
        } else {
            let upResult;
            try {
                upResult = await SmsSettings.findByIdAndUpdate(_id, {
                    $set: {
                        smsUserId, senderId, password, isDefault,
                        userId: req.user._id,
                    }
                }, { new: true })
            } catch (error) {
                return next(error);
            }
            res.status(202).json(upResult._id);
        }
    },
    async delete(req, res, next) {
        const _id = req.params.id;
        let result;

        try {
            result = await SmsSettings.findByIdAndUpdate(_id, { userId: req.user._id, isDelete: true }, { new: true });
        } catch (error) {
            console.log(error);
            return next(error);
        }

        res.status(202).json(result._id);
    },
    async getAll(req, res, next) {
        let result;
        try {
            result = await SmsSettings.find({ isDelete: false, licenseId: req.user.licenseId })
                // .populate('userId', '_id name')
                .select('-userId -licenseId -createdAt -isDelete -updatedAt -__v')
                .sort({ serverName: 1 })
            return res.json(result);
        } catch (error) {
            console.log(error);
            return next(error);
        }
    },
}
export default smsSettingController;