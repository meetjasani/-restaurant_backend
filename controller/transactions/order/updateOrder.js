import Joi from "joi";
import { Order } from "../../../models";
import addInvoice from "../invoice/addInvoice";
import updateInvoice from "../invoice/updateInvoice";
import deleteOrder from "./deleteOrder";
import getOrder from "./getOrder";

const ORDER_STATUS = {
    OPEN: 'open',
    IN_PROGRESS: 'inProgress',
    READY: 'ready',
    DELIVERED: 'closed',
}

const updateOrder = {
    async update(req, res, next) {
        //Validating Req Data
        const itemSchema = Joi.object().keys({
            _id: Joi.string().optional(),
            itemId: Joi.string().required(),
            quantity: Joi.number().required(),
            rate: Joi.number().required(),
            amount: Joi.number().required(),
        })

        const orderSchema = Joi.object({
            _id: Joi.string().required(),
            items: Joi.array().items(itemSchema),
            grossAmount: Joi.number().required(),
            tipToWaiter: Joi.number().required(),
            netAmount: Joi.number().required(),
            orderStatus: Joi.string().valid(ORDER_STATUS.OPEN, ORDER_STATUS.IN_PROGRESS, ORDER_STATUS.READY, ORDER_STATUS.DELIVERED),
            paymentMethod: Joi.string().valid('CASH', 'CARD', 'UPI')
        })

        const { error } = orderSchema.validate(req.body);

        if (error) {
            return next(error);
        }

        const { _id, items, grossAmount, tipToWaiter, netAmount, orderStatus, paymentMethod } = req.body;

        if (items.length === 0 && orderStatus === ORDER_STATUS.DELIVERED) {
            const result = await deleteOrder.deleteById(_id, req, next);
            return res.status(202).json(result);
        }

        try {
            let result;
            let invoiceResult;
            await Order.findByIdAndUpdate({ _id: _id }, {
                $set: {
                    items,
                    grossAmount,
                    tipToWaiter,
                    netAmount,
                    orderStatus,
                    userId: req.user._id,
                }
            }, { new: true }).then(async (updateResult) => {
                if (updateResult.orderStatus !== ORDER_STATUS.DELIVERED) {
                    result = await getOrder.getById(updateResult._id.toString(), next)
                } else {
                    const invoiceData = {
                        order_id: updateResult._id.toString(),
                        customerId: updateResult.customerId.toString(),
                        paymentMethod: paymentMethod,
                        userId: req.user._id,
                        licenseId: req.user.licenseId
                    }
                    invoiceResult = await addInvoice.add(invoiceData, next);
                    // console.log("invoiceResult : ", invoiceResult);
                }
            })
            res.status(202).json(result);
        } catch (error) {
            console.log(error);
            return next(error);
        }
    },

    async updateAttendantId(req, res, next) {
        const orderSchema = Joi.object({
            _id: Joi.string().required(),
            attendantId: Joi.string().required(),
        })

        const { error } = orderSchema.validate(req.body);

        if (error) {
            return next(error);
        }

        const { _id, attendantId } = req.body;

        let result;
        try {
            result = await Order.findByIdAndUpdate({ _id: _id }, {
                $set: { attendantId, userId: req.user._id }
            }).then(async (result) => {
                const newRecord = await getOrder.getById(result._id.toString(), next)
                const data = { old: result.attendantId ? result.attendantId.toString() : "", new: attendantId.toString(), oldData: result._id.toString(), newData: JSON.parse(JSON.stringify(newRecord[0])) }
                //Socket to send message to client
                globalEmit("openOrderUpdate", data);

            })
        } catch (error) {
            console.log(error);
            return next(error);
        }

        res.status(202).json(result);
    },

    async updateTakeAway(req, res, next) {
        //Validating Req Data
        const itemSchema = Joi.object().keys({
            _id: Joi.string().optional().allow(''),
            itemId: Joi.string().required(),
            quantity: Joi.number().required(),
            rate: Joi.number().required(),
            amount: Joi.number().required(),
        })

        const orderSchema = Joi.object({
            _id: Joi.string().required(),
            orderNumber: Joi.string().optional().allow(''),
            items: Joi.array().items(itemSchema),
            grossAmount: Joi.number().required(),
            paymentMethod: Joi.string().valid('CASH', 'CARD', 'UPI')
        })

        const { error } = orderSchema.validate(req.body);

        if (error) {
            return next(error);
        }

        const { _id, items, grossAmount, orderStatus, paymentMethod } = req.body;

        if (items.length === 0 && orderStatus === ORDER_STATUS.DELIVERED) {
            const result = await deleteOrder.deleteById(_id, req, next);
            return res.status(202).json(result);
        }

        let result;
        let invoiceResult;
        try {
            result = await Order.findByIdAndUpdate({ _id: _id }, {
                $set: { items, grossAmount, netAmount: grossAmount, orderStatus, userId: req.user._id }
            }, { new: true }).then(async (updateResult) => {
                const orderData = {
                    orderDocument: updateResult,
                    paymentMethod: paymentMethod,
                    userId: req.user._id
                }

                invoiceResult = await updateInvoice.updateInvoiceByOrderId(orderData, next);
                //Socket to send message to client
                globalEmit("takeAwayData", "update");
            })
        } catch (error) {
            console.log(error);
            return next(error);
        }

        res.status(202).json(result);
    },

    async updateStatus(req, res, next) {
        const { _id, status } = req.body;
        let updatedResult;
        try {
            updatedResult = await Order.findByIdAndUpdate(_id, { orderStatus: status, userId: req.user._id }).then(async result => {
                if (status === ORDER_STATUS.DELIVERED) {
                    await updateInvoice.updatePaymentReceivedByOrderID(_id, req.user._id, next);
                }
            })
            //Socket to send message to client
            globalEmit("takeAwayStatus", "update");
        } catch (error) {
            console.log(error);
            return next(error);
        }
        res.status(202).json(updatedResult);
    },
}
export default updateOrder;