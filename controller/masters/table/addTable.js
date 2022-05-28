import Joi from "joi";
import { LicenseString, Table } from "../../../models";
import { CustomeErrorHandler } from "../../../services";

const addTable = {
    async add(req, res, next) {
        //Validating Req Data
        const tableSchema = Joi.object({
            name: Joi.string().min(3).required().messages({
                'string.min': `Name should minimum {#limit} character.`,
                'string.empty': `Name is required field.`
            }),
            capicity: Joi.number().min(1).required(),
            description: Joi.string().allow(''),
            entryEnabled: Joi.boolean(),
            sequanceNo: Joi.number().min(1).required(),
        })

        const { error } = tableSchema.validate(req.body);

        if (error) {
            return next(error);
        }

        const { name, capicity, description, sequanceNo } = req.body;

        const table = new Table({
            name,
            capicity,
            description,
            sequanceNo,
            userId: req.user._id,
            licenseId: req.user.licenseId
        })

        // Checking license limit
        const tableLimit = await LicenseString.find({ isDelete: false, licenseId: req.user.licenseId, licenseEndDate: { $gte: new Date() } }).sort({ createdAt: 1 }).limit(1);
        const countTable = await Table.find({ isDelete: false, licenseId: req.user.licenseId }).count();

        try {
            if (countTable >= tableLimit[0]['tableLimit']) {
                return next(CustomeErrorHandler.licenseLimitExceeded());
            }
        } catch (error) {

        }
        // console.log(tableLimit[0]['tableLimit'], countTable);

        // Check For Duplicate Record
        try {
            const exist = await Table.exists({
                name: name, isDelete: false, licenseId: req.user.licenseId
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
            result = await table.save();
        } catch (err) {
            return next(err);
        }

        return res.json({ result });
    }
}
export default addTable;