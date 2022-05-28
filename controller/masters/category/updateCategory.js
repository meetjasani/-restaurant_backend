import Joi from "joi";
import { Category } from "../../../models";
import { CustomeErrorHandler } from "../../../services";

const updateCategory = {
    async update(req, res, next) {

        //Validating Req Data
        const categorySchema = Joi.object({
            _id: Joi.string().required(),
            name: Joi.string().min(3).required().messages({
                'string.min': `Name should minimum {#limit} character.`,
                'string.empty': `Name is required field.`
            }),
            description: Joi.string().allow('')
        })

        const { error } = categorySchema.validate(req.body);

        if (error) {
            return next(error);
        }

        const { _id, name, description } = req.body;

        // Check For Duplicate Record
        let result;
        try {
            result = await Category.findOne({
                name: name, _id: { $ne: _id }, licenseId: req.user.licenseId, isDelete: false
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
                upResult = await Category.findByIdAndUpdate({ _id: _id }, {
                    $set: {
                        name: name,
                        description: description,
                        userId: req.user._id,
                        licenseId: req.user.licenseId
                    }
                }, { new: true })
            } catch (error) {
                return next(error);
            }
            res.status(202).json(upResult._id);
        }
    }
}
export default updateCategory;