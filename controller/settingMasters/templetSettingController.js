import Joi from "joi";
import { TempletSetting } from "../../models";
import { CustomeErrorHandler } from "../../services";

const templetSettingController = {
    async add(req, res, next) {
        //Validating Req Data
        const templetSettingSchema = Joi.object({
            name: Joi.string().required(),
            type: Joi.string().required(),
            content: Joi.string().required(),
            isDefault: Joi.boolean().required(),
        })

        const { error } = templetSettingSchema.validate(req.body, { abortEarly: false });

        if (error) {
            return next(error);
        }

        let { name, type, content, isDefault } = req.body;

        const templetSetting = new TempletSetting({
            name, type, content, isDefault, userId: req.user._id, licenseId: req.user.licenseId
        });

        // Check For Duplicate Record
        try {
            const exist = await TempletSetting.exists({
                name, type, isDelete: false, licenseId: req.user.licenseId
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
            result = await templetSetting.save();
        } catch (err) {
            return next(err);
        }

        return res.json(result);
    },
    async update(req, res, next) {
        //Validating Req Data
        const templetSettingSchema = Joi.object({
            _id: Joi.string().required(),
            name: Joi.string().required(),
            type: Joi.string().required(),
            content: Joi.string().required(),
            isDefault: Joi.boolean().required(),
        })

        const { error } = templetSettingSchema.validate(req.body, { abortEarly: false });

        if (error) {
            return next(error);
        }

        let { _id, name, type, content, isDefault } = req.body;

        // Check For Duplicate Record
        let result;
        try {
            result = await TempletSetting.findOne({
                name, type, isDelete: false, _id: { $ne: _id }, licenseId: req.user.licenseId
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
                upResult = await TempletSetting.findByIdAndUpdate(_id, {
                    $set: {
                        name, type, content, isDefault,
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
            result = await TempletSetting.findByIdAndUpdate(_id, { userId: req.user._id, isDelete: true }, { new: true });
        } catch (error) {
            console.log(error);
            return next(error);
        }

        res.status(202).json(result._id);
    },
    async getAll(req, res, next) {
        let result;
        try {
            result = await TempletSetting.find({ isDelete: false, licenseId: req.user.licenseId })
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
export default templetSettingController;