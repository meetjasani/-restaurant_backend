import { InvoiceNumber } from "invoice-number";
import Joi from "joi";
import moment from "moment";
import { Customer, Invoice, Order } from "../../../models";

const ORDER_STATUS = {
    OPEN: 'open',
    IN_PROGRESS: 'inProgress',
    READY: 'ready',
    DELIVERED: 'closed',
}

const ORDER_TYPE = {
    DINE_IN: 'dineIn',
    TAKE_AWAY: 'takeAway',
}

const addInvoice = {
    async add(orderData, next) {
        //Validating Req Data
        // const invoiceSchema = Joi.object({
        //     order_id: Joi.string().required(),
        //     customerId: Joi.string().allow(''),
        //     paymentMethod: Joi.string().valid('CASH', 'CARD', 'UPI')
        // })

        // const { error } = invoiceSchema.validate(req.body);

        // if (error) {
        //     return next(error);
        // }
        const { order_id, customerId, paymentMethod, licenseId, userId } = orderData;
        // console.log("orderData", orderData);

        const openOrderCount = await Order.find({ customerId, orderStatus: ORDER_STATUS.OPEN, orderType: ORDER_TYPE.DINE_IN, licenseId: licenseId }).count();

        if (openOrderCount > 0) {
            return "Partial Order, Invoice not generated";
        } else {
            const query = {
                invoiceGenerated: false,
                licenseId: licenseId
            }

            if (customerId !== undefined) {
                query.customerId = customerId;
            } else {
                query._id = order_id
            }

            let orders = await Order.find(query).sort({ createdAt: 1 })
            orders = JSON.parse(JSON.stringify(orders));
            // console.log(orders);

            let customer = {
                _id: "",
                name: "",
                gstNumber: ""
            }
            if (customerId !== undefined) {
                customer = await Customer.findById({ _id: customerId })
            }

            //Get New Inv Number
            const invoiceNumber = await getNewInvoiceNumber(licenseId);
            const defaultSgstRate = 5; //We will get rates from database yet not implemented so hard coded
            const defaultCgstRate = 5; //We will get rates from database yet not implemented so hard coded
            const defaultIgstRate = 0; //We will get rates from database yet not implemented so hard coded

            const invoiceData = {
                date: moment().format('YYYY-MM-DD'),
                invoiceNumber: invoiceNumber,
                orderIds: [],
                items: [],
                grossAmount: 0,
                sgstRate: defaultSgstRate,
                cgstRate: defaultCgstRate,
                igstRate: defaultIgstRate,
                tipAmount: 0,
                totalAmount: 0,
                paymentMethod: paymentMethod,
                userId: userId,
                licenseId: licenseId
            }

            if (customerId !== undefined) {
                invoiceData.customerId = customer._id.toString();
                invoiceData.custName = customer.name;
                invoiceData.custGstNo = customer.gstNumber;
            }

            orders.map(order => {
                invoiceData.orderIds.push(order._id);
                order.items.map(item => {
                    const index = invoiceData.items.findIndex((res) => res.itemId === item.itemId)
                    if (index < 0) {
                        delete item._id
                        invoiceData.items.push(item);
                    } else {
                        invoiceData.items[index].quantity = +invoiceData.items[index].quantity + +item.quantity;
                        invoiceData.items[index].amount = invoiceData.items[index].quantity * item.rate;
                    }
                    invoiceData.grossAmount += item.amount;
                })
                invoiceData.tipAmount += order.tipToWaiter
            })

            invoiceData.totalAmount = invoiceData.grossAmount + invoiceData.tipAmount + (invoiceData.grossAmount * defaultSgstRate / 100) + (invoiceData.grossAmount * defaultCgstRate / 100) + (invoiceData.grossAmount * defaultIgstRate / 100)

            // console.log(invoiceData);
            const invoice = new Invoice(invoiceData)

            let result;
            try {
                result = await invoice.save().then(async res => {
                    await Order.updateMany({ _id: { $in: invoiceData.orderIds } }, { $set: { invoiceGenerated: true, userId } })
                });
            } catch (error) {
                console.log(error);
                return next(error);
            }
            return "Invoice generated";
        }
    }
}
export default addInvoice;

const getNewInvoiceNumber = async (licenseId) => {

    const lastInvoice = await Invoice.find({ licenseId: licenseId }).sort({ createdAt: -1 }).limit(1);

    // console.log("lastOrder",lastOrder);
    let invoiceNumber;
    if (!lastInvoice.length) {
        invoiceNumber = moment().format('YYYY') + '/' + moment().format('MM') + '/1001'
    } else {
        invoiceNumber = InvoiceNumber.next(lastInvoice[0].invoiceNumber)
    }
    // console.log('invoiceNumber', invoiceNumber);
    return invoiceNumber;
}