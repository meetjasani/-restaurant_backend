import { Invoice } from "../../../models";

const getInvoice = {
    async getAll(req, res, next) {

        const { fromDate, toDate } = req.query
        let result;
        try {
            result = await Invoice.find({ isDelete: false, date: { $gte: fromDate, $lte: toDate }, licenseId: req.user.licenseId })
                .select('-createdAt, -updatedAt, -__v')
                .populate('items.itemId', '_id name')
                .populate('userId', '_id name')
                .populate('customerId', '_id name contactNumber gstNumber')
                .sort({ date: -1 });

            // for (let index = 0; index < 100; index++) {
            //     result.push(JSON.parse(JSON.stringify(result[0])))
            // }
        } catch (error) {
            console.log(error);
            return next(error);
        }
        return res.json(result);
    },

    async getGstInvoice(req, res, next) {

        const { fromDate, toDate } = req.query
        let result;
        try {
            result = await Invoice.find({ isDelete: false, date: { $gte: fromDate, $lte: toDate }, $or: [{ sgstRate: { $gt: 0 } }, { cgstRate: { $gt: 0 } }, { igstRate: { $gt: 0 } }], licenseId: req.user.licenseId })
                .select('-createdAt, -updatedAt, -__v')
                .populate('items.itemId', '_id name')
                .populate('userId', '_id name')
                .sort({ date: -1 });

            // for (let index = 0; index < 100; index++) {
            //     result.push(JSON.parse(JSON.stringify(result[0])))
            // }
        } catch (error) {
            console.log(error);
            return next(error);
        }
        return res.json(result);
    },

    async getOne(req, res, next) {
        const { id } = req.params
        let result;
        try {
            result = await Invoice.findById({ _id: id })
                .select('-createdAt, -updatedAt, -__v')
                .populate('items.itemId', '_id name')
                .populate('userId', '_id name');
        } catch (error) {
            return next(error);
        }
        return res.json(result);
    },

    async getByInvoiceNumber(invoiceNumber, next) {
        let result;
        try {
            result = await Invoice.findOne({ invoiceNumber: invoiceNumber })
                .select('-createdAt, -updatedAt, -__v')
                .populate('tables', '_id name capicity')
                .populate('items.itemId', '_id name')
                .populate('userId', '_id name');
        } catch (error) {
            return next(error);
        }
        return result;
    },
}
export default getInvoice;