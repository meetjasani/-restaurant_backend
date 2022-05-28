import Joi from "joi";
import _, { remove } from "lodash";
import { Functionality, License, LicenseString, Role } from "../../models";
import { CustomeErrorHandler } from "../../services";

const licenseStringController = {
    async add(req, res, next) {
        //Validating Req Data
        const licenseStringSchema = Joi.object({
            licenseId: Joi.string().required(),
            licenseType: Joi.string().required().messages({
                'string.empty': `License type is required field.`
            }),
            functionalityId: Joi.array().required(),
            licenseEndDate: Joi.date().required(),
            userLimit: Joi.number().min(1).required(),
            itemLimit: Joi.number().min(1).required(),
            tableLimit: Joi.number().min(1).required(),
        })

        const { error } = licenseStringSchema.validate(req.body);

        if (error) {
            return next(error);
        }

        const { licenseId, licenseType, functionalityId, licenseEndDate, userLimit, itemLimit } = req.body

        const licenseString = new LicenseString({ licenseId, licenseType, functionalityId, licenseEndDate, userLimit, itemLimit, tableLimit, userId: req.user._id })

        // Check For Duplicate Record
        // try {
        //     const exist = await LicenseString.exists({ formName }).collation({ locale: 'en', strength: 2 });

        //     if (exist) {
        //         return next(CustomeErrorHandler.alreadyExist());
        //     }
        // } catch (error) {
        //     return next(error);
        // }

        //Insert New Record
        let result;
        try {
            //console.log('New Data');
            result = await licenseString.save();
        } catch (err) {
            return next(err);
        }

        return res.json(result);
    },

    async update(req, res, next) {
        // console.log(req.body);
        //Validating Req Data
        const licenseStringSchema = Joi.object({
            _id: Joi.string().required(),
            licenseId: Joi.string().optional(),
            licenseType: Joi.string().required().messages({
                'string.empty': `License type is required field.`
            }),
            functionalityId: Joi.array().required(),
            licenseEndDate: Joi.date().required(),
            userLimit: Joi.number().min(1).required(),
            itemLimit: Joi.number().min(1).required(),
            tableLimit: Joi.number().min(1).required(),
            isEnabled: Joi.boolean().required(),
            createdAt: Joi.string().optional()
        })

        const { error } = licenseStringSchema.validate(req.body);

        if (error) {
            return next(error);
        }

        const { _id, licenseType, functionalityId, licenseEndDate, userLimit, itemLimit, tableLimit, isEnabled } = req.body;

        //Tracing changes in functionalityId
        const lStringDocument = await LicenseString.findById(_id);
        const oldFunctionalityId = JSON.parse(JSON.stringify(lStringDocument.functionalityId));
        const removed = _.difference(oldFunctionalityId, functionalityId);
        console.log("removed", removed);

        let upResult = "Done";
        try {
            const upResult = await LicenseString.findByIdAndUpdate({ _id: _id }, {
                $set: {
                    licenseType, functionalityId, licenseEndDate, userLimit, itemLimit, tableLimit, isEnabled, userId: req.user._id
                }
            }, { new: true })
            if (removed.length > 0) {
                const roleDocument = await Role.updateMany({ licenseId: lStringDocument.licenseId }, { $pull: { rights: { functionalityId: { $in: removed } } } }, { multi: true })
                console.log("removed", roleDocument);
            }
            return res.status(202).json(upResult);
        } catch (error) {
            console.log(error);
            return next(error);
        }
    },

    async delete(req, res, next) {
        const _id = req.params.id;
        try {
            await LicenseString.findByIdAndUpdate({ _id: _id }, { isDelete: true, userId: req.user._id }, { new: true })
        } catch (error) {
            return next(error);
        }
        res.status(202).json('Deleted');
    },

    async getAll(req, res, next) {
        try {
            const result = await LicenseString.find({ isDelete: false }).select('-isDelete -createdAt -updatedAt -__v')
                .populate('functionalityId', 'name', Functionality)
                .populate('licenseId', '-isDelete -createdAt -updatedAt -__v', License);
            res.status(202).json(result);

        } catch (error) {
            return next(error);
        }
    }
}
export default licenseStringController;