import { SubCategory } from "../../../models";
import { getItem } from "../../";
import { CustomeErrorHandler } from "../../../services";

const deleteSubCategory = {
    async delete(req, res, next) {
        const _id = req.params.id;

        const items = await getItem.getBySubCategoryId(req.user.licenseId, _id);
        let result;
        if (items === 0) {
            try {
                result = await SubCategory.findByIdAndUpdate({ _id: _id }, { userId: req.user._id, isDelete: true }, { new: true });
            } catch (error) {
                console.log(error);
            }
        } else {
            return next(CustomeErrorHandler.recordContainsData('Subcategory Not Deleted. \nSubcategory has items.'))
        }

        res.status(202).json(result);
    }
}
export default deleteSubCategory;