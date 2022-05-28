import Joi from "joi";
import { Item } from "../../../models";
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


const updateItem = {
    async update(req, res, next) {
        handleMultipartData(req, res, async (err) => {
            if (err) {
                return next(CustomeErrorHandler.serverError());
            }

            let filePath;
            if (req.file) {
                filePath = req.file.path;
            }
            // console.log(req.body.itemImg);
            //Validating Req Data
            const itemSchema = Joi.object({
                _id: Joi.string().required(),
                name: Joi.string().min(3).required().messages({
                    'string.min': `Name should minimum {#limit} character.`,
                    'string.empty': `Name is required field.`
                }),
                categoryId: Joi.string().required(),
                subCategoryId: Joi.string().required(),
                price: Joi.number().required(),
                description: Joi.string().allow(''),
                itemImg: Joi.string().allow(''),
                isAvailable: Joi.boolean()
            })

            const { error } = itemSchema.validate(req.body);

            if (req.file) {
                if (error) {
                    //Delete Image
                    fs.unlink(`${appRoot}/${filePath}`, (err) => {
                        if (err) {
                            return next(CustomeErrorHandler.serverError(err.message));
                        }
                    })
                    return next(error);
                }
            }

            const { _id, name, categoryId, subCategoryId, price, description, itemImg, isAvailable } = req.body;

            // Check For Duplicate Record
            let result;
            try {
                result = await Item.findOne({
                    name: name, _id: { $ne: _id }, isDelete: false, licenseId: req.user.licenseId
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
                    upResult = await Item.findByIdAndUpdate({ _id: _id }, {
                        $set: {
                            name,
                            categoryId,
                            subCategoryId,
                            price,
                            description,
                            ...(req.file && { itemImg: filePath }),
                            isAvailable,
                            userId: req.user._id,
                            licenseId: req.user.licenseId
                        }
                    }, { new: true })
                    //Socket to send message to client
                    globalEmit("availableItem", "update");
                } catch (error) {
                    return next(error);
                }
                res.status(202).json(upResult);
            }
        });
    }
}
export default updateItem;