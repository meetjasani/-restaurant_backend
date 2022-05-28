import mongoose from 'mongoose'

const Schema = mongoose.Schema;

const customerSchema = new Schema({
    name: { type: String, required: true },
    contactNumber: { type: String},
    gstNumber: {type:String},
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    isDelete: { type: Boolean, default: false },
    licenseId: { type: mongoose.Schema.Types.ObjectId, ref: 'license', required: true },
}, { timestamps: true })

export default mongoose.model('Customer', customerSchema, 'customers');