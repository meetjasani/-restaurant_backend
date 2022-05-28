import { ObjectId } from "mongodb";
import { Order } from "../../../models";

const ORDER_TYPE = {
    DINE_IN: 'dineIn',
    TAKE_AWAY: 'takeAway',
}
const ORDER_STATUS = {
    OPEN: 'open',
    IN_PROGRESS: 'inProgress',
    READY: 'ready',
    DELIVERED: 'closed',
}

const getOrder = {
    async getAll(req, res, next) {
        const { fromDate, toDate, type } = req.query

        let query = {
            orderStatus: 'closed',
            isDelete: false,
            date: { $gte: fromDate, $lte: toDate },
            licenseId: req.user.licenseId
        }

        if (type != "all") {
            query.orderType = type
        }

        let result;
        try {
            result = await Order.find(query)
                .select('-licenseId -isDelete -createdAt -updatedAt -__v')
                .populate('tables', '_id name capicity')
                .populate('items.itemId', '_id name')
                .populate('userId', '_id name')
                .populate('attendantId', '_id name')
                .sort({ date: -1 });
        } catch (error) {
            return next(error);
        }
        return res.json(result);
    },

    async getOne(req, res, next) {
        const { id } = req.params
        const result = await Order.findById(id);
        return res.json(result);
    },

    async getById(orderId, next) {
        let result;
        try {
            result = await Order.aggregate([
                {
                    '$match': {
                        '_id': new ObjectId(orderId)
                    }
                }, {
                    '$lookup': {
                        'from': 'tables',
                        'localField': 'tables',
                        'foreignField': '_id',
                        'as': 'tables'
                    }
                }, {
                    '$lookup': {
                        'from': 'users',
                        'localField': 'userId',
                        'foreignField': '_id',
                        'as': 'userId'
                    }
                }, {
                    '$unwind': {
                        'path': '$userId',
                        'preserveNullAndEmptyArrays': true
                    }
                }, {
                    '$project': {
                        '_id': '$_id',
                        'date': '$date',
                        'orderNumber': '$orderNumber',
                        'tables': '$tables._id',
                        'tableNames': '$tables.name',
                        'grossAmount': '$grossAmount',
                        'tipToWaiter': '$tipToWaiter',
                        'netAmount': '$netAmount',
                        'orderStatus': '$orderStatus',
                        'userName': '$userId.name',
                        'items': '$items',
                        'attendantId': '$attendantId',
                    }
                }
            ])
        } catch (error) {
            return next(error);
        }
        return result;
    },

    async getByItem(itemId, licenseId, next) {
        let result;
        try {
            result = await Order.find({ isDelete: false, 'items.itemId': itemId, licenseId: licenseId }).count();
        } catch (error) {
            return next(error);
        }
        return result;
    },

    async getByTable(tableId, licenseId, next) {
        let result;
        try {
            result = await Order.find({ isDelete: false, tables: tableId, licenseId: licenseId }).count();
        } catch (error) {
            return next(error);
        }
        return result;
    },

    async getOpenOrders(req, res, next) {
        let result;
        try {
            result = await Order.aggregate([
                {
                    '$match': {
                        'orderStatus': 'open',
                        'isDelete': false,
                        'licenseId': new ObjectId(req.user.licenseId),
                        'attendantId': new ObjectId(req.user._id),
                    }
                }, {
                    '$lookup': {
                        'from': 'tables',
                        'localField': 'tables',
                        'foreignField': '_id',
                        'as': 'tables'
                    }
                }, {
                    '$lookup': {
                        'from': 'users',
                        'localField': 'userId',
                        'foreignField': '_id',
                        'as': 'userId'
                    }
                }, {
                    '$unwind': {
                        'path': '$userId',
                        'preserveNullAndEmptyArrays': true
                    }
                }, {
                    '$project': {
                        '_id': '$_id',
                        'date': '$date',
                        'orderNumber': '$orderNumber',
                        'tables': '$tables._id',
                        'tableNames': '$tables.name',
                        'grossAmount': '$grossAmount',
                        'tipToWaiter': '$tipToWaiter',
                        'netAmount': '$netAmount',
                        'orderStatus': '$orderStatus',
                        'userName': '$userId.name',
                        'items': '$items',
                        'updatedAt': '$updatedAt',
                        'attendantId': '$attendantId',
                    }
                }, {
                    '$sort': {
                        'updatedAt': 1
                    }
                }
            ])
        } catch (error) {
            return next(error);
        }
        return res.json(result);
    },

    async getAllOpenOrders(req, res, next) {

        let result;
        try {
            result = await Order.aggregate([
                {
                    '$match': {
                        'orderStatus': 'open',
                        'orderType': ORDER_TYPE.DINE_IN,
                        'isDelete': false,
                        'licenseId': new ObjectId(req.user.licenseId)
                    }
                }, {
                    '$lookup': {
                        'from': 'tables',
                        'localField': 'tables',
                        'foreignField': '_id',
                        'as': 'tables'
                    }
                }, {
                    '$lookup': {
                        'from': 'users',
                        'localField': 'userId',
                        'foreignField': '_id',
                        'as': 'userId'
                    }
                }, {
                    '$lookup': {
                        'from': 'users',
                        'localField': 'attendantId',
                        'foreignField': '_id',
                        'as': 'attendant'
                    }
                }, {
                    '$unwind': {
                        'path': '$userId',
                        'preserveNullAndEmptyArrays': true
                    }
                }, {
                    '$unwind': {
                        'path': '$attendant',
                        'preserveNullAndEmptyArrays': true
                    }
                }, {
                    '$project': {
                        '_id': '$_id',
                        'date': '$date',
                        'orderNumber': '$orderNumber',
                        'tables': '$tables._id',
                        'tableNames': '$tables.name',
                        'grossAmount': '$grossAmount',
                        'tipToWaiter': '$tipToWaiter',
                        'netAmount': '$netAmount',
                        'orderStatus': '$orderStatus',
                        'userName': '$userId.name',
                        'items': '$items',
                        'attendant': '$attendant.name',
                        'attendantId': '$attendant._id',
                        'createdAt': '$createdAt',
                        'updatedAt': '$updatedAt',
                    }
                }, {
                    '$sort': {
                        'updatedAt': 1
                    }
                }
            ])
        } catch (error) {
            return next(error);
        }
        return res.json(result);
    },

    async getOpenTakeAwayOrders(req, res, next) {
        const result = await Order.aggregate([
            {
                '$match': {
                    'orderType': ORDER_TYPE.TAKE_AWAY,
                    'orderStatus': {
                        '$ne': ORDER_STATUS.DELIVERED
                    },
                    'licenseId': new ObjectId(req.user.licenseId)
                }
            }, {
                '$lookup': {
                    'from': 'invoices',
                    'localField': '_id',
                    'foreignField': 'orderIds',
                    'as': 'invoices'
                }
            }, {
                '$unwind': {
                    'path': '$invoices',
                    'preserveNullAndEmptyArrays': true
                }
            }, {
                '$project': {
                    '_id': 1,
                    'date': 1,
                    'orderNumber': 1,
                    'items': 1,
                    'grossAmount': 1,
                    'orderStatus': 1,
                    'createdAt': 1,
                    'updatedAt': 1,
                    'paymentMethod': '$invoices.paymentMethod'
                }
            }
        ])
        return res.json(result);
    },

    async getTakeAwayOrdersByStatus(req, res, next) {
        const status = req.params.status
        // console.log(status);
        const result = await Order.
            find({ orderType: ORDER_TYPE.TAKE_AWAY, orderStatus: status, isDelete: false, licenseId: req.user.licenseId })
            .populate('items.itemId', '-_id name')
            .select('-updatedAt -userId -licenseId -__v -invoiceGenerated -isDelete -netAmount -orderType -tables -tipToWaiter');
        return res.json(result);
    },

    async getUnattendedOrders(req, res, next) {
        // const result = await Order.find({ isDelete: false, licenseId: req.user.licenseId, attendantId: { $exists: false } })
        const result = await Order.aggregate([
            {
                '$match': {
                    'orderStatus': 'open',
                    'isDelete': false,
                    'attendantId': { $exists: false },
                    'licenseId': new ObjectId(req.user.licenseId)
                }
            }, {
                '$lookup': {
                    'from': 'tables',
                    'localField': 'tables',
                    'foreignField': '_id',
                    'as': 'tables'
                }
            }, {
                '$lookup': {
                    'from': 'users',
                    'localField': 'userId',
                    'foreignField': '_id',
                    'as': 'userId'
                }
            }, {
                '$unwind': {
                    'path': '$userId',
                    'preserveNullAndEmptyArrays': true
                }
            }, {
                '$project': {
                    '_id': '$_id',
                    'date': '$date',
                    'orderNumber': '$orderNumber',
                    'tables': '$tables._id',
                    'tableNames': '$tables.name',
                    'grossAmount': '$grossAmount',
                    'tipToWaiter': '$tipToWaiter',
                    'netAmount': '$netAmount',
                    'orderStatus': '$orderStatus',
                    'userName': '$userId.name',
                    'items': '$items',
                }
            }, {
                '$sort': {
                    'updatedAt': 1
                }
            }
        ])
        return res.json(result);
    },
}
export default getOrder;