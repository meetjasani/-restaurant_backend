import Joi from "joi";
import { ObjectId } from "mongodb";
import { Functionality, Role } from "../../models";
import { CustomeErrorHandler } from "../../services";
import getUsers from "../masters/user/getUsers";

const roleController = {
    async add(req, res, next) {
        //Validating Req Data
        const rightsSchema = Joi.object({
            functionalityId: Joi.string().required(),
            canInsert: Joi.boolean(),
            canUpdate: Joi.boolean(),
            canDelete: Joi.boolean(),
            canView: Joi.boolean(),
        });

        const roleSchema = Joi.object({
            _id: Joi.string().optional().allow(''),
            name: Joi.string().min(3).required().messages({
                'string.min': `Name should minimum {#limit} character.`,
                'string.empty': `Name is required field.`
            }),
            description: Joi.string().allow(''),
            rights: Joi.array().items(rightsSchema),
            isEnabled: Joi.boolean(),
        })

        const { error } = roleSchema.validate(req.body);

        if (error) {
            return next(error);
        }

        const { name, description, rights } = req.body;

        const role = new Role({
            name, description, rights, userId: req.user._id, licenseId: req.user.licenseId
        });

        // Check For Duplicate Record
        try {
            const exist = await Role.exists({
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
            result = await role.save();
        } catch (err) {
            return next(err);
        }

        return res.json(result);
    },

    async update(req, res, next) {
        //Validating Req Data
        const rightsSchema = Joi.object({
            _id: Joi.string().optional(),
            functionalityId: Joi.string().required(),
            canInsert: Joi.boolean(),
            canUpdate: Joi.boolean(),
            canDelete: Joi.boolean(),
            canView: Joi.boolean(),
        });

        const roleSchema = Joi.object({
            _id: Joi.string().required(),
            name: Joi.string().min(3).required().messages({
                'string.min': `Name should minimum {#limit} character.`,
                'string.empty': `Name is required field.`
            }),
            description: Joi.string().allow(''),
            rights: Joi.array().items(rightsSchema),
            isEnabled: Joi.boolean(),
        })

        const { error } = roleSchema.validate(req.body);

        if (error) {
            return next(error);
        }

        const { _id, name, description, rights, isEnabled } = req.body;

        // Check For Duplicate Record
        let result;
        try {
            result = await Role.findOne({
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
                upResult = await Role.findByIdAndUpdate({ _id: _id }, {
                    $set: {
                        name: name,
                        description: description,
                        rights: rights,
                        isEnabled: isEnabled,
                        userId: req.user._id,
                        licenseId: req.user.licenseId
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
        const user = await getUsers.hasUserRoleId(req, _id);
        if (!user) {
            try {
                result = await Role.findByIdAndUpdate({ _id }, { userId: req.user._id, isDelete: true }, { new: true });
            } catch (error) {
                console.log(error);
                return next(error);
            }
        } else {
            return next(CustomeErrorHandler.recordContainsData('Role Not Deleted. \Role has users \nYou can disable instead.'))
        }

        res.status(202).json(result._id);
    },

    async getAll(req, res, next) {
        let result;
        try {
            result = await Role.find({ isDelete: false, licenseId: req.user.licenseId })
                .populate('rights.functionalityId', '_id name')
                .select('-licenseId -userId -createdAt -isDelete -updatedAt -__v')
                .sort({ name: 1 })
            return res.json(result);
        } catch (error) {
            console.log(error);
            return next(error);
        }
    },

    async getRoleList(req, res, next) {
        let result;
        try {
            result = await Role.aggregate([
                {
                    '$match': {
                        'isEnabled': true,
                        'isDelete': false,
                        'licenseId': new ObjectId(req.user.licenseId),
                    }
                }, {
                    '$project': {
                        'value': '$_id',
                        'label': '$name',
                    }
                }
            ])
            return res.json(result);
        } catch (error) {
            return next(error);
        }
    },

    async hasRoleFunctionalityId(req, functionalityId) {
        return await Role.exists({ 'rights.functionalityId': functionalityId, licenseId: req.user.licenseId });
    },

    // This is for License User
    async getRoleByName(roleName) {
        return await Role.findOne({ name: roleName, isDelete: false }).collation({ locale: 'en', strength: 2 });
    },
}
export default roleController;