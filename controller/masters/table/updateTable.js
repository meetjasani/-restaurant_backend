import Joi from "joi";
import { CustomeErrorHandler } from "../../../services";
import { Table } from "../../../models";

const updateTable = {
    async update(req, res, next) {
        //Validating Req Data
        const tableSchema = Joi.object({
            _id: Joi.string().required(),
            name: Joi.string().min(3).required().messages({
                'string.min': `Name should minimum {#limit} character.`,
                'string.empty': `Name is required field.`
            }),
            capicity: Joi.number().min(1).required(),
            description: Joi.string().allow(''),
            entryEnabled: Joi.boolean().required(),
            sequanceNo: Joi.number().min(1).required(),
        })

        const { error } = tableSchema.validate(req.body);

        if (error) {
            return next(error);
        }
        const { _id, name, capicity, description, entryEnabled, sequanceNo } = req.body;

        // Check For Duplicate Record
        let result;
        try {
            result = await Table.findOne({
                name: name, isDelete: false, _id: { $ne: _id }, licenseId: req.user.licenseId
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
                upResult = await Table.findByIdAndUpdate({ _id: _id }, {
                    name, capicity, description, entryEnabled, sequanceNo,
                    userId: req.user._id
                }).then(async result => {
                    // if (sequanceNo !== result.sequanceNo) {
                    let incDec = sequanceNo - result.sequanceNo
                    const gteValue = incDec > 0 ? result.sequanceNo : sequanceNo;
                    const lteValue = incDec > 0 ? sequanceNo : result.sequanceNo;
                    incDec = incDec > 0 ? -1 : 1;
                    await Table.updateMany(
                        {
                            $and: [
                                { sequanceNo: { $gte: gteValue } },
                                { sequanceNo: { $lte: lteValue } }
                            ], _id: { $ne: _id }, isDelete: false, licenseId: req.user.licenseId
                        },
                        { $inc: { sequanceNo: incDec } }
                    )
                    // }
                })
                //Socket to send message to client
                globalEmit("updateTable", "update");
            } catch (error) {
                console.log(error);
                return next(error);
            }
            res.status(202).json(upResult);
        }
    }
}
export default updateTable;