import mongoose from 'mongoose'

const Schema = mongoose.Schema;

const tableSchema = new Schema({
    name: { type: String, required: true },
    capicity: { type: Number, required: true },
    description: { type: String, default: '' },
    entryEnabled: { type: Boolean, default: true },
    sequanceNo: { type: Number, required: true },
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    isDelete: { type: Boolean, default: false },
    licenseId: { type: mongoose.Schema.Types.ObjectId, ref: 'license', required: true },
}, { timestamps: true })

export default mongoose.model('Table', tableSchema, 'tables');