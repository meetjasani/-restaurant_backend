import { SubCategory } from "../../../models";

const getSubCategory = {
    async getAll(req, res, next) {
        let result;
        result = await SubCategory.find({ isDelete: false, licenseId: req.user.licenseId })
            .select('_id name categoryId description userId')
            .populate('userId', '_id name');
        return res.json(result);
    },

    async getAllForList(req, res, next) {
        let result;
        result = await SubCategory.find({ isDelete: false, licenseId: req.user.licenseId })
            .select('_id name')
        return res.json(result);
    },

    // async getByName(name) {
    //     let result;
    //     result = await SubCategory.find({ name, isDelete: false })
    //         .collation({ locale: 'en', strength: 2 })
    //         .select('_id name categoryId description userId')
    //         .populate('categoryId', '_id name')
    //         .populate('userId', '_id name');
    //     return result;
    // },

    async getByCategoryId(id, licenseId) {
        let result;
        result = await SubCategory.find({ categoryId: id, isDelete: false, licenseId: licenseId }).count()
        return result;
    }
}
export default getSubCategory;