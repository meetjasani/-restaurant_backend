import Joi from "joi";
import { Item, LicenseString } from "../../../models";
import { CustomeErrorHandler } from "../../../services";
import multer from 'multer';
import path from 'path';
import fs from "fs";

const storage = multer.diskStorage({
    destination: (req, file, cb) => cb(null, 'uploads/items/'),
    filename: (req, file, cb) => {
        const uniqueName = `${Date.now()}-${Math.round(Math.random() * 1E9)}${path.extname(file.originalname)}`;
        cb(null, uniqueName)
    }
});

const handleMultipartData = multer({
    storage,
    limits: { fileSize: 1024 * 1024 },
}).single('itemImg');

const addItem = {
    async add(req, res, next) {
        //Uploading image
        handleMultipartData(req, res, async (err) => {
            if (err) {
                return next(CustomeErrorHandler.serverError(err));
            }
            const filePath = req.file ? req.file.path : "";

            //Validating Req Data
            const itemSchema = Joi.object({
                name: Joi.string().min(3).required().messages({
                    'string.min': `Name should minimum {#limit} character.`,
                    'string.empty': `Name is required field.`
                }),
                categoryId: Joi.string().required(),
                subCategoryId: Joi.string().required(),
                price: Joi.number().required(),
                description: Joi.string().allow(''),
                itemImg: Joi.any(),
                isAvailable: Joi.boolean()
            })

            const { error } = itemSchema.validate(req.body);

            if (error) {
                fs.unlink(`${appRoot}/${filePath}`, (err) => {
                    if (err) {
                        console.log(err);
                        return next(CustomeErrorHandler.serverError(err.message));
                    }
                })
                return next(error);
            }

            const { name, categoryId, subCategoryId, price, description, itemImg, isAvailable } = req.body;

            const item = new Item({
                name,
                categoryId,
                subCategoryId,
                price,
                description,
                itemImg: filePath,
                isAvailable,
                userId: req.user._id,
                licenseId: req.user.licenseId
            })

            // Checking license limit
            const itemLimit = await LicenseString.find({ isDelete: false, licenseId: req.user.licenseId, licenseEndDate: { $gte: new Date() } }).sort({ createdAt: 1 }).limit(1);
            const countItem = await Item.find({ isDelete: false, licenseId: req.user.licenseId }).count();

            try {
                if (countItem >= itemLimit[0]['itemLimit']) {
                    return next(CustomeErrorHandler.licenseLimitExceeded());
                }
            } catch (error) {

            }

            // Check For Duplicate Record
            try {
                const exist = await Item.exists({
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
                result = await item.save();
            } catch (err) {
                return next(err);
            }

            return res.json({ result });
        });
    }
}
export default addItem;