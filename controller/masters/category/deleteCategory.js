import { Category } from "../../../models";
import { getSubCategory } from '../../';
import { CustomeErrorHandler } from "../../../services";

const deleteCategory = {
    async delete(req, res, next) {
        const _id = req.params.id;

        const items = await getItem.getBySubCategoryId(req.user.licenseId, _id);
        let result;
        if (items === 0) {
            try {
                result = await Category.findByIdAndUpdate({ _id }, { userId: req.user._id, isDelete: true }, { new: true });
            } catch (error) {
                console.log(error);
            }
        } else {
            return next(CustomeErrorHandler.recordContainsData('Category Not Deleted. \nCategory has items.'))
        }

        res.status(202).json(result._id);
    }
}

export default deleteCategory;