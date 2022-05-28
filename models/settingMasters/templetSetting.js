import mongoose from 'mongoose'

const Schema = mongoose.Schema;

const templetSettingSchema = new Schema({
    name: { type: String, required: true },
    type: { type: String, required: true },
    content: { type: String, required: true },
    isDefault: { type: Boolean, default: false },
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    isDelete: { type: Boolean, default: false },
    licenseId: { type: mongoose.Schema.Types.ObjectId, ref: 'License', required: true },
}, { timestamps: true })

export default mongoose.model('TempletSetting', templetSettingSchema, 'templetSettings');