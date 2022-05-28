import mongoose from 'mongoose'

const Schema = mongoose.Schema;

const smsSettingSchema = new Schema({
    smsUserId: { type: String, required: true },
    senderId: { type: String, required: true },
    password: { type: String, required: true },
    isDefault: { type: Boolean, default: false },
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    isDelete: { type: Boolean, default: false },
    licenseId: { type: mongoose.Schema.Types.ObjectId, ref: 'License', required: true },
}, { timestamps: true })

export default mongoose.model('SmsSetting', smsSettingSchema, 'smsSettings');