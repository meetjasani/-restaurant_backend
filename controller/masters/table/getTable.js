import { ObjectId } from "mongodb";
import { Table } from "../../../models";

const getTable = {
    async getAll(req, res, next) {
        let result;
        result = await Table.find({ isDelete: false, licenseId: req.user.licenseId })
            .select('_id name capicity description entryEnabled sequanceNo userId')
            .populate('userId', '_id name')
            .sort({ 'sequanceNo': 1 });
        return res.json(result);
    },

    async getAvailableTables(req, res, next) {
        let result;
        result = await Table.aggregate([
            {
                '$match': {
                    'isDelete': false,
                    'entryEnabled': true,
                    'licenseId': new ObjectId(req.user.licenseId)
                }
            }, {
                '$lookup': {
                    'from': 'orders',
                    'localField': '_id',
                    'foreignField': 'tables',
                    'as': 'orders'
                }
            }, {
                '$unwind': {
                    'path': '$orders',
                    'preserveNullAndEmptyArrays': true
                }
            }, {
                '$project': {
                    '_id': 1,
                    'name': 1,
                    'capicity': 1,
                    'sequanceNo': 1,
                    'orderStatus': {
                        '$cond': [
                            {
                                '$eq': [
                                    '$orders.orderStatus', 'open'
                                ]
                            }, 1, 0
                        ]
                    }
                }
            }, {
                '$group': {
                    '_id': '$_id',
                    'name': {
                        '$first': '$name'
                    },
                    'capicity': {
                        '$first': '$capicity'
                    },
                    'sequanceNo': {
                        '$first': '$sequanceNo'
                    },
                    'orderStatus': {
                        '$sum': '$orderStatus'
                    }
                }
            }, {
                '$match': {
                    'orderStatus': {
                        '$lt': 1
                    }
                }
            }, {
                '$sort': {
                    'sequanceNo': 1
                }
            }
        ])
        return res.json(result);
    },

    // async getByName(name) {
    //     let result;
    //     result = await Table.find({ name, isDelete: false })
    //         .collation({ locale: 'en', strength: 2 })
    //         .select('_id name capicity description entryEnabled userId')
    //         .populate('userId', '_id name');
    //     return result;
    // },
}
export default getTable