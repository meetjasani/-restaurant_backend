import { ObjectId } from "mongodb";
import { Item } from "../../../models";

const getItem = {
    async getAll(req, res, next) {
        let result;
        result = await Item.aggregate([
            {
                '$match': {
                    'isDelete': false,
                    'licenseId': new ObjectId(req.user.licenseId),
                }
            }, {
                '$lookup': {
                    'from': 'subCategories',
                    'localField': 'subCategoryId',
                    'foreignField': '_id',
                    'as': 'subCategories'
                }
            }, {
                '$unwind': {
                    'path': '$subCategories',
                    'preserveNullAndEmptyArrays': true
                }
            }, {
                '$lookup': {
                    'from': 'categories',
                    'localField': 'categoryId',
                    'foreignField': '_id',
                    'as': 'categories'
                }
            }, {
                '$unwind': {
                    'path': '$categories',
                    'preserveNullAndEmptyArrays': true
                }
            }, {
                '$lookup': {
                    'from': 'users',
                    'localField': 'userId',
                    'foreignField': '_id',
                    'as': 'users'
                }
            }, {
                '$unwind': {
                    'path': '$users',
                    'preserveNullAndEmptyArrays': true
                }
            }, {
                '$project': {
                    '_id': '$_id',
                    'name': '$name',
                    'subCategoryId': '$subCategoryId',
                    'subCategoryName': '$subCategories.name',
                    'categoryId': '$subCategories.categoryId',
                    'categoryName': '$categories.name',
                    'price': '$price',
                    'description': '$description',
                    'isAvailable': '$isAvailable',
                    'userName': '$users.name',
                    'updatedAt': '$updatedAt',
                    'itemImg': '$itemImg'
                }
            }, {
                '$sort': {
                    'subCategoryName': 1
                }
            }
        ]);

        return res.json(result);
    },

    async getBySubCategoryId(id, licenseId) {
        let result;
        result = await Item.find({ subCategoryId: id, isDelete: false, licenseId: licenseId }).count();
        return result;
    },

    async getAvailableItems(req, res, next) {
        // console.log(req.user);
        let result;
        result = await Item.aggregate([
            {
                '$match': {
                    'isAvailable': true,
                    'isDelete': false,
                    'licenseId': new ObjectId(req.user.licenseId),
                }
            }, {
                '$lookup': {
                    'from': 'subCategories',
                    'localField': 'subCategoryId',
                    'foreignField': '_id',
                    'as': 'subCategories'
                }
            }, {
                '$unwind': {
                    'path': '$subCategories',
                    'preserveNullAndEmptyArrays': true
                }
            }, {
                '$lookup': {
                    'from': 'categories',
                    'localField': 'categoryId',
                    'foreignField': '_id',
                    'as': 'categories'
                }
            }, {
                '$unwind': {
                    'path': '$categories',
                    'preserveNullAndEmptyArrays': true
                }
            }, {
                '$lookup': {
                    'from': 'users',
                    'localField': 'userId',
                    'foreignField': '_id',
                    'as': 'users'
                }
            }, {
                '$unwind': {
                    'path': '$users',
                    'preserveNullAndEmptyArrays': true
                }
            }, {
                '$project': {
                    '_id': '$_id',
                    'name': '$name',
                    'subCategoryId': '$subCategoryId',
                    'subCategoryName': '$subCategories.name',
                    'categoryId': '$subCategories.categoryId',
                    'categoryName': '$categories.name',
                    'price': '$price',
                    'description': '$description',
                    'isAvailable': '$isAvailable',
                    'userName': '$users.name',
                    'updatedAt': '$updatedAt',
                    'itemImg': '$itemImg'
                }
            }, {
                '$sort': {
                    'subCategoryName': 1
                }
            }
        ])
        return res.json(result);
    },

    async getAvailableItemsList(req, res, next) {
        let result;
        result = await Item.aggregate([
            {
                '$match': {
                    'isAvailable': true,
                    'isDelete': false,
                    'licenseId': new ObjectId(req.user.licenseId),
                }
            }, {
                '$lookup': {
                    'from': 'subCategories',
                    'localField': 'subCategoryId',
                    'foreignField': '_id',
                    'as': 'subCategories'
                }
            }, {
                '$unwind': {
                    'path': '$subCategories',
                    'preserveNullAndEmptyArrays': true
                }
            }, {
                '$project': {
                    'value': '$_id',
                    'label': '$name',
                    'price': '$price',
                    'subCategoryName': '$subCategories.name',
                    'itemImg': '$itemImg'
                }
            }, {
                '$sort': {
                    'name': 1
                }
            }
        ])
        return res.json(result);
    }

}
export default getItem;