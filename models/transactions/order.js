import mongoose from 'mongoose'

const Schema = mongoose.Schema;

const orderSchema = new Schema({
    date: { type: Date, required: true },
    customerId: { type: mongoose.Schema.Types.ObjectId, ref: 'customer', default: "" },
    orderNumber: { type: String, required: true, unique: true },
    orderType: { type: String, required: true },
    tables: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Table', required: true }],
    items: [{
        itemId: { type: mongoose.Schema.Types.ObjectId, ref: 'Item' },
        quantity: { type: Number, default: 0 },
        rate: { type: Number, default: 0 },
        amount: { type: Number, default: 0 },
    }],
    grossAmount: { type: Number, default: 0 },
    tipToWaiter: { type: Number, default: 0 },
    netAmount: { type: Number, default: 0 },
    orderStatus: { type: String, default: 'open' },
    attendantId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    invoiceGenerated: { type: Boolean, default: false },
    isDelete: { type: Boolean, default: false },
    licenseId: { type: mongoose.Schema.Types.ObjectId, ref: 'license', required: true },
}, { timestamps: true })

export default mongoose.model('Order', orderSchema, 'orders');