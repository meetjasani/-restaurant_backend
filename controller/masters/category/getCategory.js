import { Category } from "../../../models";

const getCategory = {
    async getAll(req, res, next) {
        let result;
        try {
            result = await Category.find({ isDelete: false, licenseId: req.user.licenseId })
                .select('_id name description userId updatedAt')
                .populate('userId', '_id name');
        } catch (error) {
            return next(error);
        }
        return res.json(result);
    },

    // async getByName(name) {
    //     let result;
    //     try {
    //         result = await Category.find({name, isDelete: false })
    //         .collation({ locale: 'en', strength: 2 })
    //         .select('_id name description userId updatedAt')
    //         .populate('userId','_id name');
    //     } catch (error) {
    //         return next(error);
    //     }
    //     return result;
    // },

    async getAllForList(req, res, next) {
        let result;
        try {
            result = await Category.find({ isDelete: false, licenseId: req.user.licenseId })
                .select('_id name')
        } catch (error) {
            return next(error);
        }
        return res.json(result);
    }
}
export default getCategory;