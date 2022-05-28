import { getOrder } from "../..";
import { Item } from "../../../models";
import { CustomeErrorHandler } from "../../../services";

const deleteItem = {
    async delete(req, res, next) {
        const _id = req.params.id;

        const order = await getOrder.getByItem(_id, req.user.licenseId, next);
        let result;
        try {
            if (order === 0) {
                result = await Item.findByIdAndUpdate({ _id: _id }, { userId: req.user._id, isDelete: true }, { new: true });
            } else {
                return next(CustomeErrorHandler.recordContainsData('Item Not Deleted. \nItem has orders.'))
            }
        } catch (error) {
            return next(error)
        }

        res.status(202).json(result._id);
    }
}
export default deleteItem;