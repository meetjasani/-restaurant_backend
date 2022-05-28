import Joi from "joi";
import { SubCategory } from "../../../models";
import { CustomeErrorHandler } from "../../../services";

const updateSubCategory = {
    async update(req, res, next) {
        //Validating Req Data
        const subCategorySchema = Joi.object({
            _id: Joi.string().required(),
            name: Joi.string().min(3).required().messages({
                'string.min': `Name should minimum {#limit} character.`,
                'string.empty': `Name is required field.`
            }),
            description: Joi.string().allow('')
        })

        const { error } = subCategorySchema.validate(req.body);

        if (error) {
            return next(error);
        }

        const { _id, name, description } = req.body;

        // Check For Duplicate Record
        let result;
        try {
            result = await SubCategory.findOne({
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
                upResult = await SubCategory.findByIdAndUpdate({ _id: _id }, {
                    name: name,
                    description: description,
                    userId: req.user._id,
                    licenseId: req.user.licenseId
                }, { new: true })
            } catch (error) {
                return next(error);
            }
            res.status(202).json(upResult);
        }
    }
}
export default updateSubCategory;