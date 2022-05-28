import Joi from "joi";
import moment from "moment";
import { Functionality, License, LicenseString, Role, User } from "../../models";
import { CustomeErrorHandler } from "../../services";
import multer from 'multer';
import path from 'path';
import fs from "fs";
import roleController from "./roleController";
import bcrypt from 'bcrypt';
import { ObjectId } from "mongodb";
import { ObjectID } from "bson";

const storage = multer.diskStorage({
    destination: (req, file, cb) => cb(null, 'uploads/logo/'),
    filename: (req, file, cb) => {
        const uniqueName = `${Date.now()}-${Math.round(Math.random() * 1E9)}${path.extname(file.originalname)}`;
        cb(null, uniqueName)
    }
});

const handleMultipartData = multer({
    storage,
    limits: { fileSize: 1024 * 1024 },
}).single('logo');

const licenseController = {
    async add(req, res, next) {
        handleMultipartData(req, res, async (err) => {
            if (err) {
                return next(CustomeErrorHandler.serverError());
            }

            let filePath;
            if (req.file) {
                filePath = req.file.path;
            }

            //Validating Req Data
            const licenseSchema = Joi.object({
                _id: Joi.string().optional().allow(''),
                name: Joi.string().min(3).required().messages({
                    'string.min': `Name should minimum {#limit} character.`,
                    'string.empty': `Name is required field.`
                }),
                gstNo: Joi.string().length(15).regex(/^([0][1-9]|[1-2][0-9]|[3][0-7])([a-zA-Z]{5}[0-9]{4}[a-zA-Z]{1}[1-9a-zA-Z]{1}[zZ]{1}[0-9a-zA-Z]{1})+$/).required()
                    .messages({
                        'string.pattern.base': 'Invalid GST Number',
                        'string.length': 'GST number must be {#limit} character long',
                        'string.empty': `GST number is required field.`
                    }),
                address: Joi.string().optional().allow(''),
                contactNo: Joi.string().optional().allow(''),
                logo: Joi.string(),
                orderPrefix: Joi.string().optional().allow(''),
                licenseType: Joi.string().required().messages({
                    'string.empty': `License type is required field.`
                }),
                functionalityId: Joi.array().required(),
                licenseEndDate: Joi.date().required().greater(moment()).messages({
                    'date.greater': "License end date must a future date."
                }),
                userLimit: Joi.number().min(1).required(),
                itemLimit: Joi.number().min(1).required(),
                tableLimit: Joi.number().min(1).required(),
                username: Joi.string().min(3).required()
                    .messages({
                        'string.min': `Username should have a minimum length of {#limit}.`,
                        'string.empty': `Username is required field.`
                    }),
            })

            const { error } = licenseSchema.validate(req.body);


            if (error) {
                if (req.file) {   //Delete Image
                    fs.unlink(`${appRoot}/${filePath}`, (err) => {
                        if (err) {
                            // return next(CustomeErrorHandler.serverError(err.message));
                        }
                    })
                }
                return next(error);
            }

            const { name, gstNo, address, contactNo, logo, orderPrefix, licenseType, functionalityId, licenseEndDate, userLimit, itemLimit, tableLimit, username } = req.body

            // Check For Duplicate Record and Insert
            let licenseDocument, licStringDocument, roleDocument, userDocument;
            try {
                const exist = await License.exists({
                    name, gstNo, isDelete: false
                }).collation({ locale: 'en', strength: 2 });

                if (exist) {
                    return next(CustomeErrorHandler.alreadyExist());
                }

                //Insert New Record
                //console.log('New Data');
                const rights = await Functionality.aggregate([
                    {
                        '$match': {
                            '_id': {
                                '$in': functionalityId.map(ObjectID)
                            }
                        }
                    }, {
                        '$project': {
                            '_id': 0,
                            'functionalityId': '$_id',
                            'canInsert': '$insert',
                            'canUpdate': '$update',
                            'canDelete': '$drop',
                            'canView': '$view'
                        }
                    }
                ])

                licenseDocument = await new License({
                    name, gstNo, address, contactNo, logo, orderPrefix,
                    userId: req.user._id,
                }).save();

                licStringDocument = await new LicenseString({
                    licenseType, functionalityId, licenseEndDate, userLimit, itemLimit, tableLimit,
                    userId: req.user._id,
                    licenseId: licenseDocument._id,
                }).save()

                roleDocument = await new Role({
                    name: 'Admin',
                    description: `Main admin role for ${name}`,
                    rights: rights,
                    userId: req.user._id,
                    licenseId: licenseDocument._id,
                }).save();

                // Creating user
                // Hash Password
                const hasedPassword = await bcrypt.hash("12345678", 10);
                userDocument = await new User({
                    name,
                    username,
                    mobileNumber: contactNo,
                    password: hasedPassword,
                    roleId: roleDocument._id.toString(),
                    userId: req.user._id,
                    licenseId: licenseDocument._id,
                }).save();

                //Updating Mainuserid to license
                licenseDocument = await License.findByIdAndUpdate({ _id: licenseDocument._id }, {
                    $set: {
                        mainUserId: userDocument._id,
                        userId: req.user._id
                    }
                });

            } catch (error) {
                console.log(error);
                console.log(licenseDocument._id, licStringDocument._id, roleDocument._id);
                // licenseDocument, licStringDocument, roleDocument, userDocument
                licenseDocument !== undefined ? await License.findByIdAndDelete(licenseDocument._id) : "";
                licStringDocument !== undefined ? await LicenseString.findByIdAndDelete(licStringDocument._id) : "";
                roleDocument !== undefined ? await Role.findByIdAndDelete(roleDocument._id) : "";
                userDocument !== undefined ? await User.findByIdAndDelete(userDocument._id) : "";
                return next(error);
            }

            return res.json(licenseDocument, licStringDocument, roleDocument, userDocument);
        });
    },

    async update(req, res, next) {
        handleMultipartData(req, res, async (err) => {
            if (err) {
                return next(CustomeErrorHandler.serverError());
            }

            let filePath;
            if (req.file) {
                filePath = req.file.path;
            }
            //Validating Req Data
            const licenseSchema = Joi.object({
                _id: Joi.string().required(),
                name: Joi.string().min(3).required().messages({
                    'string.min': `Name should minimum {#limit} character.`,
                    'string.empty': `Name is required field.`
                }),
                gstNo: Joi.string().length(15).regex(/^([0][1-9]|[1-2][0-9]|[3][0-7])([a-zA-Z]{5}[0-9]{4}[a-zA-Z]{1}[1-9a-zA-Z]{1}[zZ]{1}[0-9a-zA-Z]{1})+$/).required()
                    .messages({
                        'string.pattern.base': 'Invalid GST Number',
                        'string.length': 'GST number must be {#limit} character long',
                        'string.empty': `GST number is required field.`
                    }),
                address: Joi.string().optional().allow(''),
                contactNo: Joi.string().optional().allow(''),
                logo: Joi.string(),
                orderPrefix: Joi.string().optional().allow(''),
                isEnabled: Joi.boolean().required()
            })

            const { error } = licenseSchema.validate(req.body);

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

            const { _id, name, gstNo, address, contactNo, logo, orderPrefix, isEnabled } = req.body

            // Check For Duplicate Record 
            try {
                const license = await License.findOne({
                    name, gstNo, _id: { $ne: _id }, isDelete: false
                }).collation({ locale: 'en', strength: 2 });

                let upResult;
                if (license) {
                    return next(CustomeErrorHandler.alreadyExist());
                } else {
                    upResult = await License.findByIdAndUpdate({ _id: _id }, {
                        $set: {
                            name, gstNo, address, contactNo, ...(req.file && { logo: filePath }), orderPrefix, isEnabled, userId: req.user._id,
                        }
                    }, { new: true })
                    return res.status(202).json(upResult);
                }
            } catch (error) {
                return next(error);
            }
        });
    },

    async delete(req, res, next) {
        const _id = req.params.id;
        try {
            await License.findByIdAndUpdate({ _id: _id }, { isDelete: true, userId: req.user._id }, { new: true });
            await LicenseString.findOneAndUpdate({ licenseId: _id }, { isDelete: true, userId: req.user._id }, { new: true });

        } catch (error) {
            return next(error);
        }
        res.status(202).json('Deleted');
    },

    async getAll(req, res, next) {
        try {
            const result = await License.aggregate([
                {
                    '$match': {
                        'isDelete': false
                    }
                }, {
                    '$lookup': {
                        'from': 'users',
                        'localField': 'mainUserId',
                        'foreignField': '_id',
                        'as': 'mainUser'
                    }
                }, {
                    '$lookup': {
                        'from': 'users',
                        'localField': 'userId',
                        'foreignField': '_id',
                        'as': 'userDet'
                    }
                }, {
                    '$unwind': {
                        'path': '$mainUser',
                        'preserveNullAndEmptyArrays': true
                    }
                }, {
                    '$unwind': {
                        'path': '$userDet',
                        'preserveNullAndEmptyArrays': true
                    }
                }, {
                    '$lookup': {
                        'from': 'licenseStrings',
                        'let': {
                            'licenseId': '$_id'
                        },
                        'pipeline': [
                            {
                                '$match': {
                                    '$expr': {
                                        '$and': [
                                            {
                                                '$eq': [
                                                    '$licenseId', '$$licenseId'
                                                ]
                                            }, {
                                                '$eq': [
                                                    '$isDelete', false
                                                ]
                                            }
                                        ]
                                    }
                                }
                            }, {
                                '$project': {
                                    'licenseId': '$licenseId',
                                    'licenseType': '$licenseType',
                                    'functionalityId': '$functionalityId',
                                    'licenseEndDate': {
                                        '$dateToString': {
                                            'format': '%Y-%m-%d',
                                            'date': '$licenseEndDate'
                                        }
                                    },
                                    'userLimit': '$userLimit',
                                    'itemLimit': '$itemLimit',
                                    'tableLimit': '$tableLimit',
                                    'isEnabled': '$isEnabled',
                                    'createdAt': '$createdAt'
                                }
                            }
                        ],
                        'as': 'licenseStrings'
                    }
                }, {
                    '$project': {
                        '_id': '$_id',
                        'name': '$name',
                        'gstNo': '$gstNo',
                        'address': '$address',
                        'contactNo': '$contactNo',
                        'orderPrefix': '$orderPrefix',
                        'logo': '$logo',
                        'mainUserName': '$mainUser.username',
                        'isEnabled': '$isEnabled',
                        'licenseStrings': '$licenseStrings',
                        'username': '$userDet.name'
                    }
                }
            ])
            res.status(202).json(result);
        } catch (error) {
            return next(error);
        }
    },
}
export default licenseController