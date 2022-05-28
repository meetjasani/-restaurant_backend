import mongoose from 'mongoose';

const Schema = mongoose.Schema;

const userSchema = new Schema({
    name: { type: String, required: true },
    username: { type: String, required: true, unique: true },
    mobileNumber: { type: String, unique: true },
    password: { type: String, required: true },
    roleId: { type: mongoose.Schema.Types.ObjectId, ref: 'role' },
    isEnabled: { type: Boolean, default: true },
    isDelete: { type: Boolean, default: false },
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'user' },
    licenseId: { type: mongoose.Schema.Types.ObjectId, ref: 'license', required: true },
}, { timestamps: true });

export default mongoose.model('User', userSchema, 'users');