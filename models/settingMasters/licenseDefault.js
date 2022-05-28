import mongoose from 'mongoose'

const Schema = mongoose.Schema;

const licenseDefaultSchema = new Schema({
    sgstRate: { type: Number, required: true, default: 0 },
    cgstRate: { type: Number, required: true, default: 0 },
    igstRate: { type: Number, required: true, default: 0 },
    maxAttend: { type: Number, required: true, default: 0 },
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    isDelete: { type: Boolean, default: false },
    licenseId: { type: mongoose.Schema.Types.ObjectId, ref: 'License', required: true },
}, { timestamps: true })

export default mongoose.model('LicenseDefault', licenseDefaultSchema, 'licenseDefaults');