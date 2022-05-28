import Joi from "joi";
import { licenseDefaultController } from "..";
import { LicenseDefault } from '../../models'

const licenseDefault = {
    async add(userId, licenseId) {
        console.log(userId);
        // //Validating Req Data
        // const licenseDefaultSchema = Joi.object({
        //     sgstRate: Joi.number().required(),
        //     cgstRate: Joi.number().required(),
        //     igstRate: Joi.number().required(),
        //     maxAttend: Joi.number().required(),
        // })

        // const { error } = licenseDefaultSchema.validate(req.body, { abortEarly: false });

        // if (error) {
        //     return next(error);
        // }

        // let { sgstRate, cgstRate, igstRate, maxAttend } = req.body;

        const licenseDefault = new LicenseDefault({
            sgstRate: 0,
            cgstRate: 0,
            igstRate: 0,
            maxAttend: 0,
            userId: userId,
            licenseId: licenseId
        });

        //Insert New Record
        let result;
        try {
            //console.log('New Data');
            result = await licenseDefault.save();
        } catch (err) {
            return next(err);
        }

        return result;
    },

    async update(req, res, next) {
        //Validating Req Data
        const licenseDefaultSchema = Joi.object({
            _id: Joi.string().required(),
            sgstRate: Joi.number().max(14).required(),
            cgstRate: Joi.number().max(14).required(),
            igstRate: Joi.number().max(28).required(),
            maxAttend: Joi.number().required(),
        })

        const { error } = licenseDefaultSchema.validate(req.body, { abortEarly: false });

        if (error) {
            return next(error);
        }

        let { _id, sgstRate, cgstRate, igstRate, maxAttend } = req.body;

        let upResult;
        try {
            upResult = await LicenseDefault.findByIdAndUpdate(_id, {
                $set: {
                    sgstRate, cgstRate, igstRate, maxAttend,
                    userId: req.user._id,
                }
            }, { new: true })
        } catch (error) {
            console.log(error);
            return next(error);
        }

        res.status(202).json(upResult._id);
    },

    async delete(req, res, next) {
        res.status(202).json("Not required and implemented.");
    },

    async getAll(req, res, next) {
        let result;
        try {
            result = await LicenseDefault.findOne({ isDelete: false, licenseId: req.user.licenseId })
                // .populate('userId', '_id name')
                .select('-userId -licenseId -createdAt -isDelete -updatedAt -__v')
            if (result === null) {
                result = await licenseDefaultController.add(req.user._id, req.user.licenseId);
            }
            return res.json(result);
        } catch (error) {
            console.log(error);
            return next(error);
        }
    },
}
export default licenseDefault;