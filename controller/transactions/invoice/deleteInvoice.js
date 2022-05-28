import { Invoice } from "../../../models";

const deleteInvoice = {
    async delete(req, res, next) {
        const _id = req.params.id;
        try {
            const result = await Invoice.findByIdAndUpdate({ _id: _id }, { userId: req.user._id, isDelete: true }, { new: true });
            res.status(202).json(result);
        } catch (error) {
            return next(error);
        }
    },
}
export default deleteInvoice;