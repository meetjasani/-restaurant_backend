import Joi from "joi";
import moment from "moment";
import { ObjectId } from "mongodb";
import { Customer, Order, User, WaitingList } from "../../models";
import customerController from "../masters/customerController";

const BOOKING_TYPE = {
    IN_PERSON: 'In Person',
    ON_CALL: 'On Call'
}

const WAITING_STATUS = {
    WAITING: 'Waiting',
    ALLOCATED: 'Allocated',
    NOT_ARRIVED: 'Not arrived',
    LEFT: 'Left',
}

const waitingListController = {

    async add(req, res, next) {
        //Validating Req Data
        const waitingListSchema = Joi.object({
            _id: Joi.string().optional().allow(''),
            customerId: Joi.string().required().allow(''),
            customerName: Joi.string().min(3).required().messages({
                'string.min': `Name should minimum {#limit} character.`,
                'string.empty': `Name is required field.`
            }),
            contactNumber: Joi.string().regex(/^[0-9]{10}$/).optional().allow('').messages({ 'string.pattern.base': `Contact number must have 10 digits.` }),
            bookingType: Joi.string().valid(BOOKING_TYPE.IN_PERSON, BOOKING_TYPE.ON_CALL).required(),
            persons: Joi.number().min(1).required(),
            comments: Joi.string().allow(''),
        })

        const { error } = waitingListSchema.validate(req.body);

        if (error) {
            return next(error);
        }

        let { customerId, customerName, contactNumber, bookingType, persons, comments } = req.body;

        if (customerId === "") {
            req.body = {
                name: customerName,
                contactNumber: contactNumber,
                gstNumber: ''
            }

            const customer = await customerController.insert(req, next);
            customerId = customer._id
        }

        const waitingList = new WaitingList({
            customerId, bookingType, persons, comments, userId: req.user._id, licenseId: req.user.licenseId
        });

        //Insert New Record
        let result;
        try {
            //console.log('New Data');
            result = await waitingList.save();
        } catch (err) {
            console.log(err);
            return next(err);
        }

        return res.json(result);
    },

    async update(req, res, next) {
        //Validating Req Data
        const customerSchema = Joi.object({
            _id: Joi.string().optional().allow(''),
            customerId: Joi.string().required(),
            customerName: Joi.string().min(3).required().messages({
                'string.min': `Name should minimum {#limit} character.`,
                'string.empty': `Name is required field.`
            }),
            contactNumber: Joi.string().regex(/^[0-9]{10}$/).optional().allow('').messages({ 'string.pattern.base': `Contact number must have 10 digits.` }),
            bookingType: Joi.string().valid(BOOKING_TYPE.IN_PERSON, BOOKING_TYPE.ON_CALL).required(),
            persons: Joi.number().min(1).required(),
            // status: Joi.string().valid(WAITING_STATUS.WAITING, WAITING_STATUS.ALLOCATED, WAITING_STATUS.LEFT).required(),
            comments: Joi.string().allow(''),
        })

        const { error } = customerSchema.validate(req.body);

        if (error) {
            return next(error);
        }

        const { _id, customerId, customerName, contactNumber, bookingType, persons, comments } = req.body;

        let upResult;
        try {
            upResult = await WaitingList.findByIdAndUpdate({ _id: _id }, {
                $set: { customerId, bookingType, persons, comments, userId: req.user._id }
            }, { new: true });
            await Customer.findByIdAndUpdate(customerId, { customerName, contactNumber }, { new: true })
        } catch (error) {
            console.log(error);
            return next(error);
        }
        res.status(202).json(upResult);

    },

    async updateStatus(req, res, next) {
        //Validating Req Data
        const customerSchema = Joi.object({
            _id: Joi.string().required(),
            status: Joi.string().valid(WAITING_STATUS.WAITING, WAITING_STATUS.ALLOCATED, WAITING_STATUS.LEFT, WAITING_STATUS.NOT_ARRIVED).required(),
        })

        const { error } = customerSchema.validate(req.body);

        if (error) {
            return next(error);
        }

        const { _id, status } = req.body;

        let upResult;
        try {
            upResult = await WaitingList.findByIdAndUpdate({ _id: _id }, {
                $set: { status, userId: req.user._id }
            }, { new: true });
        } catch (error) {
            console.log(error);
            return next(error);
        }
        res.status(202).json(upResult);
    },

    async delete(req, res, next) {
        const id = req.params.id;
        let upResult;
        try {
            upResult = await WaitingList.findByIdAndUpdate({ _id: id }, { userId: req.user._id, isDelete: true }, { new: true });
        } catch (error) {
            console.log(error);
            return next(error);
        }
        res.status(202).json(upResult);
    },

    async getAll(req, res, next) {
        const { fromDate, toDate, status } = req.query

        const query = {
            datetime: { $gte: moment(fromDate), $lt: moment(toDate).add(1, 'days') },
            isDelete: false,
            licenseId: req.user.licenseId
        }

        if (status !== "all") {
            query.status = status;
        }


        let result;
        try {
            result = await WaitingList.find(query)
                .select('-licenseId -isDelete -updatedAt -__v')
                .populate('customerId', 'name contactNumber', Customer)
                .populate('orderId', '', Order)
                .populate('userId', 'name', User);
        } catch (error) {
            console.log(error);
            return next(error);
        }
        return res.json(result);
    },

    async getStatusWaiting(req, res, next) {
        let result;
        try {
            result = await WaitingList.aggregate([
                {
                    '$match': {
                        'status': 'Waiting',
                        'isDelete': false,
                        'licenseId': new ObjectId(req.user.licenseId)
                    }
                }, {
                    '$lookup': {
                        'from': 'orders',
                        'let': {
                            'customerId': '$customerId'
                        },
                        'pipeline': [
                            {
                                '$match': {
                                    '$expr': {
                                        '$and': [
                                            {
                                                '$eq': [
                                                    '$customerId', '$$customerId'
                                                ]
                                            }, {
                                                '$eq': [
                                                    '$orderStatus', 'open'
                                                ]
                                            }, {
                                                '$eq': [
                                                    '$isDelete', false
                                                ]
                                            }, {
                                                '$eq': [
                                                    '$licenseId', new ObjectId(req.user.licenseId)
                                                ]
                                            }
                                        ]
                                    }
                                }
                            }, {
                                '$project': {
                                    'tables': '$tables',
                                    'contactNumber': '$contactNumber'
                                }
                            }
                        ],
                        'as': 'orders'
                    }
                }, {
                    '$unwind': {
                        'path': '$orders',
                        'preserveNullAndEmptyArrays': true
                    }
                }, {
                    '$lookup': {
                        'from': 'tables',
                        'localField': 'orders.tables',
                        'foreignField': '_id',
                        'as': 'tables'
                    }
                }, {
                    '$unwind': {
                        'path': '$tables',
                        'preserveNullAndEmptyArrays': true
                    }
                }, {
                    '$group': {
                        '_id': '$_id',
                        'datetime': {
                            '$first': '$datetime'
                        },
                        'bookingType': {
                            '$first': '$bookingType'
                        },
                        'persons': {
                            '$first': '$persons'
                        },
                        'status': {
                            '$first': '$status'
                        },
                        'comments': {
                            '$first': '$comments'
                        },
                        'allocated': {
                            '$sum': '$tables.capicity'
                        },
                        'customerId': {
                            '$first': '$customerId'
                        },
                        'userId': {
                            '$first': '$userId'
                        },
                        'createdAt': {
                            '$first': '$createdAt'
                        },
                        'updatedAt': {
                            '$first': '$updatedAt'
                        }
                    }
                }, {
                    '$addFields': {
                        'pending': {
                            '$subtract': [
                                '$persons', '$allocated'
                            ]
                        }
                    }
                }, {
                    '$lookup': {
                        'from': 'customers',
                        'let': {
                            'customerId': '$customerId'
                        },
                        'pipeline': [
                            {
                                '$match': {
                                    '$expr': {
                                        '$eq': [
                                            '$_id', '$$customerId'
                                        ]
                                    }
                                }
                            }, {
                                '$project': {
                                    'name': '$name',
                                    'contactNumber': '$contactNumber'
                                }
                            }
                        ],
                        'as': 'customerId'
                    }
                }, {
                    '$lookup': {
                        'from': 'users',
                        'let': {
                            'userId': '$userId'
                        },
                        'pipeline': [
                            {
                                '$match': {
                                    '$expr': {
                                        '$eq': [
                                            '$_id', '$$userId'
                                        ]
                                    }
                                }
                            }, {
                                '$project': {
                                    'name': '$name'
                                }
                            }
                        ],
                        'as': 'userId'
                    }
                }, {
                    '$unwind': {
                        'path': '$customerId',
                        'preserveNullAndEmptyArrays': true
                    }
                }, {
                    '$unwind': {
                        'path': '$userId',
                        'preserveNullAndEmptyArrays': true
                    }
                }, {
                    '$sort': {
                        'datetime': 1
                    }
                }
            ])

            return res.json(result);
        } catch (error) {
            console.log(error);
            return next(error);
        }
    },

}
export default waitingListController;

