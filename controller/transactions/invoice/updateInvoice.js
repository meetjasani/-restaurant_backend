import Joi from "joi";
import { Invoice } from "../../../models";
import customerController from "../../masters/customerController";

const updateInvoice = {
    async update(req, res, next) {
        //Validating Req Data
        const invoiceSchema = Joi.object({
            _id: Joi.string().required(),
            customerId: Joi.string().allow(''),
            custName: Joi.string().allow(''),
            custGstNo: Joi.string().regex(/^([0][1-9]|[1-2][0-9]|[3][0-7])([a-zA-Z]{5}[0-9]{4}[a-zA-Z]{1}[1-9a-zA-Z]{1}[zZ]{1}[0-9a-zA-Z]{1})+$/).allow('')
                .messages({
                    'string.pattern.base': 'Invalid GST Number',
                    'string.length': 'GST number must be {#limit} character long',
                    'string.empty': `GST number is required field.`
                }),
            contactNumber: Joi.string().regex(/^[0-9]{10}$/).optional().allow('').messages({ 'string.pattern.base': `Contact number must have 10 digits.` }),
            sgstRate: Joi.number().required(),
            cgstRate: Joi.number().required(),
            igstRate: Joi.number().required(),
            totalAmount: Joi.number().required(),
            paymentMethod: Joi.string().valid('CASH', 'CARD', 'UPI')
        })

        const { error } = invoiceSchema.validate(req.body);

        if (error) {
            return next(error);
        }

        const { _id, customerId, custName, custGstNo, contactNumber, sgstRate, cgstRate, igstRate, totalAmount, paymentMethod } = req.body;

        const dataToUpdate = {
            sgstRate, cgstRate, igstRate, totalAmount, paymentMethod, userId: req.user._id
        };

        let customerDocument;
        if (contactNumber !== "") {
            const customerData = {
                name: custName,
                contactNumber: contactNumber,
                gstNumber: custGstNo
            }
            req.body = customerData
            customerDocument = await customerController.insert(req, next)
        }

        if (customerDocument !== undefined) {
            dataToUpdate.customerId = customerDocument._id.toString()
        }

        let result;
        try {
            result = await Invoice.findByIdAndUpdate(_id, {
                $set: dataToUpdate
            }, { new: true })
        } catch (error) {
            return next(error);
        }

        res.status(202).json(result);
    },

    async updateInvoiceByOrderId(orderData, next) {
        const { orderDocument, paymentMethod, userId } = orderData;

        const invoiceDocument = await Invoice.findOne({ orderIds: orderDocument._id, licenseId: orderDocument.licenseId })

        const dataToUpdate = {
            items: orderDocument.items,
            grossAmount: orderDocument.grossAmount,
            totalAmount: (orderDocument.grossAmount) + (orderDocument.grossAmount * invoiceDocument.sgstRate / 100) + (orderDocument.grossAmount * invoiceDocument.cgstRate / 100) + (orderDocument.grossAmount * invoiceDocument.igstRate / 100),
            paymentMethod,
            userId
        };

        let result;
        try {
            result = await Invoice.findByIdAndUpdate(invoiceDocument._id, {
                $set: dataToUpdate
            }, { new: true })
        } catch (error) {
            return next(error);
        }

        return;
    },

    async updatePaymentReceivedByOrderID(orderId, userId, next) {
        try {
            await Invoice.findOneAndUpdate({ orderIds: orderId }, { paymentReceived: true, userId: userId })
        } catch (error) {
            return next(error);
        }
        return;
    },
}
export default updateInvoice