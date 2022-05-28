import Joi from "joi";
import { ObjectId } from "mongodb";
import { Functionality, License } from "../../models";
import { CustomeErrorHandler } from "../../services";
import roleController from "./roleController";

const functionalityController = {
    async add(req, res, next) {
        //Validating Req Data
        const functionalitySchema = Joi.object({
            _id: Joi.string().optional().allow(''),
            name: Joi.string().min(3).required().messages({
                'string.min': `Name should minimum {#limit} character.`,
                'string.empty': `Name is required field.`
            }),
            description: Joi.string().allow(''),
            view: Joi.boolean(),
            insert: Joi.boolean(),
            update: Joi.boolean(),
            drop: Joi.boolean(),
            isEnabled: Joi.boolean(),
            isDefault: Joi.boolean(),
        })

        const { error } = functionalitySchema.validate(req.body);

        if (error) {
            return next(error);
        }

        const { name, description, view, insert, update, drop, isEnabled, isDefault } = req.body;

        const functionality = new Functionality({
            name, description, view, insert, update, drop, isEnabled, isDefault, userId: req.user._id
        });

        // Check For Duplicate Record
        try {
            const exist = await Functionality.exists({
                name: name, isDelete: false
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
            result = await functionality.save();
        } catch (err) {
            return next(err);
        }

        return res.json(result);
    },

    async update(req, res, next) {
        //Validating Req Data
        const functionalitySchema = Joi.object({
            _id: Joi.string(),
            name: Joi.string().min(3).required().messages({
                'string.min': `Name should minimum {#limit} character.`,
                'string.empty': `Name is required field.`
            }),
            description: Joi.string().allow(''),
            view: Joi.boolean(),
            insert: Joi.boolean(),
            update: Joi.boolean(),
            drop: Joi.boolean(),
            isEnabled: Joi.boolean(),
            isDefault: Joi.boolean(),
        })

        const { error } = functionalitySchema.validate(req.body);

        if (error) {
            return next(error);
        }

        const { _id, name, description, view, insert, update, drop, isEnabled, isDefault } = req.body;

        // Check For Duplicate Record
        let result;
        try {
            result = await Functionality.findOne({
                name: name, isDelete: false, _id: { $ne: _id }
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
                upResult = await Functionality.findByIdAndUpdate({ _id: _id }, {
                    $set: {
                        name: name,
                        description: description,
                        view: view,
                        insert: insert,
                        update: update,
                        drop: drop,
                        isEnabled: isEnabled,
                        isDefault: isDefault,
                        userId: req.user._id
                    }
                }, { new: true })
            } catch (error) {
                return next(error);
            }
            res.status(202).json(upResult._id);
        }
    },

    async delete(req, res, next) {
        const _id = req.params.id;

        let result;
        const role = await roleController.hasRoleFunctionalityId(req, _id)
        if (!role) {
            try {
                result = await Functionality.findByIdAndUpdate({ _id }, { userId: req.user._id, isDelete: true }, { new: true });
            } catch (error) {
                console.log(error);
            }
        } else {
            return next(CustomeErrorHandler.recordContainsData('Functionality Not Deleted. \nFunctionality has role \nYou can disable instead.'))
        }

        res.status(202).json(result._id);
    },

    async getAll(req, res, next) {
        let result;
        try {
            result = await Functionality.find({ isDelete: false }).select('-userId -createdAt -isDelete -updatedAt -__v')
            return res.json(result);
        } catch (error) {
            return next(error);
        }
    },

    async getAllFunctionalityList(req, res, next) {
        let result;
        try {
            result = await Functionality.aggregate([
                {
                    '$match': {
                        'isEnabled': true,
                        'isDelete': false
                    }
                }, {
                    '$project': {
                        'value': '$_id',
                        'label': '$name',
                        'view': '$view',
                        'insert': '$insert',
                        'update': '$update',
                        'drop': '$drop',
                        'isDefault': '$isDefault'
                    }
                }, {
                    '$sort': {
                        'label': 1
                    }
                }
            ]);
            return res.json(result);
        } catch (error) {
            return next(error);
        }
    },

    async getFunctionalityList(req, res, next) {
        let result;
        try {
            // result = await Functionality.aggregate([
            //     {
            //         '$match': {
            //             'isEnabled': true,
            //             'isDelete': false
            //         }
            //     }, {
            //         '$project': {
            //             'value': '$_id',
            //             'label': '$name',
            //             'view': '$view',
            //             'insert': '$insert',
            //             'update': '$update',
            //             'drop': '$drop',
            //             'isDefault':'$isDefault'
            //         }
            //     }
            // ])
            result = await License.aggregate([
                {
                    '$match': {
                        '_id': new ObjectId(req.user.licenseId)
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
                                                '$gt': [
                                                    '$licenseEndDate', new Date()
                                                ]
                                            }
                                        ]
                                    }
                                }
                            }, {
                                '$sort': {
                                    'createdAt': 1
                                }
                            }, {
                                '$limit': 1
                            }
                        ],
                        'as': 'licenseStrings'
                    }
                }, {
                    '$unwind': {
                        'path': '$licenseStrings',
                        'preserveNullAndEmptyArrays': true
                    }
                }, {
                    '$lookup': {
                        'from': 'functionalities',
                        'localField': 'licenseStrings.functionalityId',
                        'foreignField': '_id',
                        'as': 'functionalities'
                    }
                }, {
                    '$unwind': {
                        'path': '$functionalities',
                        'preserveNullAndEmptyArrays': true
                    }
                }, {
                    '$project': {
                        '_id': '$functionalities._id',
                        'value': '$functionalities._id',
                        'label': '$functionalities.name',
                        'view': '$functionalities.view',
                        'insert': '$functionalities.insert',
                        'update': '$functionalities.update',
                        'drop': '$functionalities.drop',
                        'isDefault': '$functionalities.isDefault'
                    }
                }
            ])
            return res.json(result);
        } catch (error) {
            return next(error);
        }
    },
}

export default functionalityController