import Joi from "joi";
import { ObjectId } from "mongodb";
import { Customer } from "../../models";
import { CustomeErrorHandler } from "../../services";

const customerController = {
    async add(req, res, next) {
        const customer = await customerController.insert(req, next);
        res.status(202).json(customer);
    },

    async insert(req, next) {
        //Validating Req Data
        const customerSchema = Joi.object({
            _id: Joi.string().optional().allow(''),
            name: Joi.string().min(3).required().messages({
                'string.min': `Name should minimum {#limit} character.`,
                'string.empty': `Name is required field.`
            }),
            contactNumber: Joi.string().regex(/^[0-9]{10}$/).allow("").messages({ 'string.pattern.base': `Mobile number must have 10 digits.` }),
            gstNumber: Joi.string().length(15).regex(/^([0][1-9]|[1-2][0-9]|[3][0-7])([a-zA-Z]{5}[0-9]{4}[a-zA-Z]{1}[1-9a-zA-Z]{1}[zZ]{1}[0-9a-zA-Z]{1})+$/).optional().allow('')
                .messages({ 'string.pattern.base': 'Invalid GST Number', 'string.length': 'GST number must be {#limit} character long' }),
        })

        const { error } = customerSchema.validate(req.body);

        if (error) {
            return next(error);
        }

        const { name, contactNumber, gstNumber } = req.body;

        const customer = new Customer({
            name, contactNumber, gstNumber, userId: req.user._id, licenseId: req.user.licenseId
        });

        // Check For Duplicate Record
        try {
            let result = await Customer.findOne({
                contactNumber, isDelete: false, licenseId: req.user.licenseId
            }).collation({ locale: 'en', strength: 2 });

            if (result) {
                result = await Customer.findByIdAndUpdate({ _id: result._id }, {
                    $set: { name, contactNumber, gstNumber, userId: req.user._id, licenseId: req.user.licenseId }
                }, { new: true });
                return result;
            }
        } catch (error) {
            console.log(error);
            return next(error);
        }

        //Insert New Record
        let result;
        try {
            //console.log('New Data');
            result = await customer.save();
        } catch (err) {
            console.log(err);
            return next(err);
        }

        return result;
    },

    async update(req, res, next) {
        //Validating Req Data
        const customerSchema = Joi.object({
            _id: Joi.string().optional().allow(''),
            name: Joi.string().min(3).required().messages({
                'string.min': `Name should minimum {#limit} character.`,
                'string.empty': `Name is required field.`
            }),
            contactNumber: Joi.string().regex(/^[0-9]{10}$/).optional().allow('').messages({ 'string.pattern.base': `Mobile number must have 10 digits.` }),
            gstNumber: Joi.string().length(15).regex(/^([0][1-9]|[1-2][0-9]|[3][0-7])([a-zA-Z]{5}[0-9]{4}[a-zA-Z]{1}[1-9a-zA-Z]{1}[zZ]{1}[0-9a-zA-Z]{1})+$/).optional().allow('')
                .messages({ 'string.pattern.base': 'Invalid GST Number', 'string.length': 'GST number must be {#limit} character long' }),
        })

        const { error } = customerSchema.validate(req.body);

        if (error) {
            return next(error);
        }

        const { _id, name, contactNumber, gstNumber } = req.body;

        // Check For Duplicate Record
        // try {
        //     const exist = await Customer.exists({
        //         name, contactNumber, gstNumber, isDelete: false, _id: { $ne: _id }, licenseId: req.user.licenseId
        //     }).collation({ locale: 'en', strength: 2 });

        //     if (exist) {
        //         return res.status(202).json("Same Data");
        //     }
        // } catch (error) {
        //     return next(error);
        // }

        let upResult;
        try {
            upResult = await Customer.findByIdAndUpdate({ _id: _id }, {
                $set: { name, contactNumber, gstNumber, userId: req.user._id, licenseId: req.user.licenseId }
            }, { new: true });
        } catch (error) {
            console.log(error);
            return next(error);
        }
        res.status(202).json(upResult);
    },

    async delete(req, res, next) {
        const _id = req.params.id;
        try {
            await Customer.findByIdAndUpdate({ _id: _id }, { isDelete: true }, { new: true });
        } catch (error) {
            console.log(error);
            return next(error);
        }
        res.status(202).json('Deleted');
    },

    async getAll(req, res, next) {
        let result;
        try {
            result = await Customer.find({ isDelete: false, licenseId: req.user.licenseId })
                .select('-userId -createdAt -isDelete -updatedAt -__v')
                .populate('userId', '_id name');
            return res.json(result);
        } catch (error) {
            return next(error);
        }
    },

    async getCustomerList(req, res, next) {
        let result;
        try {
            result = await Customer.aggregate([
                {
                    '$match': {
                        'isDelete': false,
                        'licenseId': new ObjectId(req.user.licenseId),
                    }
                }, {
                    '$project': {
                        '_id': 0,
                        'value': '$_id',
                        'label': '$name',
                        'contactNumber': '$contactNumber',
                        'gstNumber': '$gstNumber'
                    }
                }
            ])
            return res.json(result);
        } catch (error) {
            return next(error);
        }
    },
}
export default customerController;