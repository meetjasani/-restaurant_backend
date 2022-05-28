import moment from 'moment';
import mongoose from 'mongoose'

const Schema = mongoose.Schema;

const waitingListSchema = new Schema({
    datetime: { type: Date, required: true, default: moment() },
    customerId: { type: mongoose.Schema.Types.ObjectId, required: true, ref: 'customer' },
    bookingType: { type: String, required: true },
    persons: { type: Number, required: true },
    status: { type: String, required: true, default: 'Waiting' },
    comments: { type: String },
    orderId: { type: mongoose.Schema.Types.ObjectId, ref: 'order' },
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'user' },
    isDelete: { type: Boolean, default: false },
    licenseId: { type: mongoose.Schema.Types.ObjectId, ref: 'license', required: true },
}, { timestamps: true })

export default mongoose.model('WaitingList', waitingListSchema, 'waitingLists');