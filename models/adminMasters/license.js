import mongoose from 'mongoose'

const Schema = mongoose.Schema;

const licenseSchema = new Schema({
    name: { type: String, required: true },
    gstNo: { type: String, required: true },
    address: { type: String },
    contactNo: { type: String },
    logo: { type: String },
    orderPrefix: { type: String },
    mainUserId: { type: mongoose.Schema.Types.ObjectId, ref: 'user' },
    isEnabled: { type: Boolean, default: true },
    isDelete: { type: Boolean, default: false },
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'user' },
}, { timestamps: true })

export default mongoose.model('License', licenseSchema, 'licenses');