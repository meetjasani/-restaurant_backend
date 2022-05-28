import { Invoice, Order } from "../../../models";

const deleteOrder = {
    async delete(req, res, next) {
        const _id = req.params.id;
        try {
            const result = await deleteOrder.deleteById(_id, req, next);
            res.status(202).json(result);
        } catch (error) {
            console.log(error);
            return next(error);
        }
    },

    async deleteById(_id, req, next) {
        try {
            return await Order.findByIdAndUpdate({ _id: _id }, { userId: req.user._id, orderStatus: 'closed', isDelete: true }, { new: true })
                .then(async (result) => {
                    const invoiceDocument = await Invoice.findOne({ orderIds: result._id });
                    if (result.items.length > 1) {
                        if (invoiceDocument.orderIds.length > 1) {
                            await this.deleteOrderAndUpdateInvoice(_id, invoiceDocument, req.user._id, next)
                        } else {
                            await Invoice.findOneAndUpdate({ orderIds: result._id }, { userId: req.user._id, isDelete: true }, { new: true });
                        }
                    }
                });
        } catch (error) {
            console.log(error);
            return next(error);
        }
    },

    async deleteOrderAndUpdateInvoice(orderId, invoiceDocument, userId, next) {
        let orderIds = JSON.parse(JSON.stringify(invoiceDocument.orderIds))
        orderIds = orderIds.filter(order => order != orderId);
        const ordersDocument = await Order.find({ _id: { $in: orderIds } });

        //Changind data of invoice document
        const invoiceData = {
            orderIds: orderIds,
            items: [],
            grossAmount: 0,
            tipAmount: 0,
            totalAmount: 0,
            userId: userId,
        }

        ordersDocument.map(order => {
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

        invoiceData.totalAmount = invoiceData.grossAmount + invoiceData.tipAmount + (invoiceData.grossAmount * invoiceDocument.sgstRate / 100) + (invoiceData.grossAmount * invoiceDocument.cgstRate / 100) + (invoiceData.grossAmount * invoiceDocument.igstRate / 100)

        console.log(invoiceData);
        return Invoice.findByIdAndUpdate(invoiceDocument._id, { $set: invoiceData });

    }
}
export default deleteOrder;