import mongoose from 'mongoose'

const Schema = mongoose.Schema;

const emailSettingSchema = new Schema({
    serverName: { type: String, required: true },
    userName: { type: String, required: true },
    password: { type: String, required: true },
    port: { type: Number, required: true },
    enableSSL: { type: Boolean, required: true },
    fromEmail: { type: String, required: true },
    isDefault: { type: Boolean, default: false },
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    isDelete: { type: Boolean, default: false },
    licenseId: { type: mongoose.Schema.Types.ObjectId, ref: 'License', required: true },
}, { timestamps: true })

export default mongoose.model('EmailSetting', emailSettingSchema, 'emailSettings');