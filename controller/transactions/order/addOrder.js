import Joi from "joi";
import { License, Order } from "../../../models";
import { InvoiceNumber } from 'invoice-number';
import getOrder from "./getOrder";
import moment from "moment";
import addInvoice from "../invoice/addInvoice";

const ORDER_TYPE = {
    DINE_IN: 'dineIn',
    TAKE_AWAY: 'takeAway',
}

const addOrder = {
    async add(req, res, next) {
        //Validating Req Data
        const tableSchema = Joi.object({
            customerId: Joi.string().allow(''),
            tables: Joi.array().required(),
        })

        const { error } = tableSchema.validate(req.body);

        if (error) {
            return next(error);
        }

        const { customerId, tables } = req.body;

        //Get New Inv Number
        const orderNumber = await getNewOrderNumber(req.user.licenseId);

        const order = new Order({
            date: moment().format('YYYY-MM-DD'),
            customerId,
            orderNumber,
            orderType: ORDER_TYPE.DINE_IN,
            tables,
            userId: req.user._id,
            licenseId: req.user.licenseId
        })

        //Insert New Record
        let result;
        try {
            // console.log('New Data');
            const newRecord = await order.save();
            result = await getOrder.getById(newRecord._id.toString(), next)

            //Socket to send message to client
            globalEmit("updateTable", "update");
        } catch (err) {
            // console.log(err);
            return next(err);
        }

        return res.json(result);
    },

    async addTakeAway(req, res, next) {
        //Validating Req Data
        const itemSchema = Joi.object().keys({
            itemId: Joi.string().required(),
            quantity: Joi.number().required(),
            rate: Joi.number().required(),
            amount: Joi.number().required(),
        })

        const tableSchema = Joi.object({
            customerId: Joi.string().optional().allow(''),
            items: Joi.array().items(itemSchema),
            grossAmount: Joi.number().required(),
            paymentMethod: Joi.string().valid('CASH', 'CARD', 'UPI')
        })

        const { error } = tableSchema.validate(req.body);

        if (error) {
            return next(error);
        }

        const { customerId, items, grossAmount, paymentMethod } = req.body;

        //Get New Inv Number
        const orderNumber = await getNewOrderNumber(req.user.licenseId);

        const order = new Order({
            date: moment().format('YYYY-MM-DD'),
            customerId,
            orderNumber,
            orderType: ORDER_TYPE.TAKE_AWAY,
            items,
            grossAmount,
            tipToWaiter: 0,
            netAmount: grossAmount,
            userId: req.user._id,
            licenseId: req.user.licenseId
        })

        //Insert New Record
        let result;
        try {
            // console.log('New Data');
            let newRecord;
            await order.save().then(async updateResult => {
                newRecord = updateResult;
                const invoiceData = {
                    order_id: updateResult._id.toString(),
                    paymentMethod: paymentMethod,
                    userId: req.user._id,
                    licenseId: req.user.licenseId
                }
                const invoiceResult = await addInvoice.add(invoiceData, next);
                console.log("invoiceResult : ", invoiceResult);
            });
            result = await getOrder.getById(newRecord._id.toString(), next)
            //Socket to send message to client
            globalEmit("takeAwayData", "update");

        } catch (err) {
            console.log(err);
            return next(err);
        }

        return res.json(result[0]);
    },
}
export default addOrder;

const getNewOrderNumber = async (licenseId) => {
    // console.log(licenseId);
    const lastOrder = await Order.find({ licenseId: licenseId }).sort({ createdAt: -1 }).limit(1);
    const license = await License.findById({ _id: licenseId });
    // console.log("lastOrder",lastOrder);
    let orderNumber;
    if (!lastOrder.length) {
        orderNumber = license.orderPrefix === "" ? "" : (license.orderPrefix + '/') + moment().format('YYYY') + '/' + moment().format('MM') + '/1001'
    } else {
        orderNumber = InvoiceNumber.next(lastOrder[0].orderNumber)
    }
    // console.log('orderNumber', orderNumber);
    return orderNumber;
}
