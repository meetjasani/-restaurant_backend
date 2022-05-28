import mongoose from 'mongoose'

const Schema = mongoose.Schema;

const invoiceSchema = new Schema({
    date: { type: Date, required: true },
    invoiceNumber: { type: String, required: true, unique: true },
    orderIds: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Order', required: true }],
    customerId: { type: mongoose.Schema.Types.ObjectId, ref: 'Customer' },
    items: [{
        itemId: { type: mongoose.Schema.Types.ObjectId, ref: 'Item' },
        quantity: { type: Number, default: 0 },
        rate: { type: Number, default: 0 },
        amount: { type: Number, default: 0 },
    }],
    grossAmount: { type: Number, default: 0 },
    sgstRate: { type: Number, required: true },
    cgstRate: { type: Number, required: true },
    igstRate: { type: Number, required: true },
    tipAmount: { type: Number, default: 0 },
    totalAmount: { type: Number, default: 0 },
    paymentMethod: { type: String, required: true },
    paymentReceived: { type: Boolean, default: false },
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    isDelete: { type: Boolean, default: false },
    licenseId: { type: mongoose.Schema.Types.ObjectId, ref: 'license', required: true },
}, { timestamps: true })

export default mongoose.model('Invoice', invoiceSchema, 'invoices');