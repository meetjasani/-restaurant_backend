import mongoose from 'mongoose'

const Schema = mongoose.Schema;

const functionalitySchema = new Schema({
    name: { type: String, required: true },
    description: { type: String },
    view: { type: Boolean, default: false },
    insert: { type: Boolean, default: false },
    update: { type: Boolean, default: false },
    drop: { type: Boolean, default: false },
    isEnabled: { type: Boolean, default: true },
    isDefault: { type: Boolean, default: false },
    isDelete: { type: Boolean, default: false },
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'user' },
}, { timestamps: true })

export default mongoose.model('Functionality', functionalitySchema, 'functionalities');