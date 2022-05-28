import { getOrder } from "../..";
import { Order, Table } from "../../../models";
import { CustomeErrorHandler } from "../../../services";

const deleteTable = {
    async delete(req, res, next) {
        const _id = req.params.id;

        const order = await getOrder.getByTable(_id, req.user.licenseId, next);
        let result;
        try {
            if (order === 0) {
                result = await Table.findByIdAndUpdate({ _id: _id }, { userId: req.user._id, isDelete: true }, { new: true });
            } else {
                return next(CustomeErrorHandler.recordContainsData('Table Not Deleted. \nTable has orders.'))
            }
        } catch (error) {
            return next(error)
        }

        res.status(202).json(result);
    }
}
export default deleteTable;