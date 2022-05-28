import mongoose from 'mongoose'

const Schema = mongoose.Schema;

const licenseStringSchema = new Schema({
    licenseId: { type: mongoose.Schema.Types.ObjectId, ref: 'license' },
    licenseType: { type: String, required: true },
    functionalityId: [{ type: mongoose.Schema.Types.ObjectId, ref: 'functionality' }],
    licenseEndDate: { type: Date, required: true },
    userLimit: { type: Number, required: true },
    itemLimit: { type: Number, required: true },
    tableLimit: { type: Number, required: true },
    isEnabled: { type: Boolean, default: true },
    isDelete: { type: Boolean, default: false },
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'user' },    
}, { timestamps: true })

export default mongoose.model('LicenseString', licenseStringSchema, 'licenseStrings');