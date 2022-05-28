import Joi from "joi";
import { Category } from "../../../models";
import { CustomeErrorHandler } from "../../../services";

const addCategory = {
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

        const category = new Category({
            name,
            description,
            userId: req.user._id,
            licenseId: req.user.licenseId
        });

        // Check For Duplicate Record
        try {
            const exist = await Category.exists({
                name: name, licenseId: req.user.licenseId, isDelete: false
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
            result = await category.save();
        } catch (err) {
            return next(err);
        }

        return res.json(result);
    }
}

export default addCategory;