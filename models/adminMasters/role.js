import mongoose from 'mongoose'

const Schema = mongoose.Schema;

const roleSchema = new Schema({
    name: { type: String, required: true },
    description: { type: String },
    rights: [{
        functionalityId: { type: mongoose.Schema.Types.ObjectId, ref: 'Functionality' },
        canView: { type: Boolean, default: false },
        canInsert: { type: Boolean, default: false },
        canUpdate: { type: Boolean, default: false },
        canDelete: { type: Boolean, default: false },
    }],
    isEnabled: { type: Boolean, default: true },
    isDelete: { type: Boolean, default: false },
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'user' },
    licenseId: { type: mongoose.Schema.Types.ObjectId, ref: 'license', required: true },
}, { timestamps: true })

export default mongoose.model('Role', roleSchema, 'roles');