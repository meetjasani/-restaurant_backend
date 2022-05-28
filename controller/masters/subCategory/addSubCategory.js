import Joi from "joi";
import { SubCategory } from "../../../models";
import { CustomeErrorHandler } from "../../../services";

const addSubCategory = {
    async add(req, res, next) {
        //Validating Req Data
        const categorySchema = Joi.object({
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

        const { name, description } = req.body;

        const subCategory = new SubCategory({
            name,
            categoryId,
            description,
            userId: req.user._id,
            licenseId: req.user.licenseId
        })

        // Check For Duplicate Record
        try {
            const exist = await SubCategory.exists({
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
            result = await subCategory.save();
        } catch (err) {
            return next(err);
        }

        return res.json({ result });
    }
}
export default addSubCategory;