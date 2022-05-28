import mongoose from 'mongoose'

const Schema = mongoose.Schema;

const subCategorySchema = new Schema({
    name: { type: String, required: true },
    description: { type: String, default: '' },
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    isDelete: { type: Boolean, default: false },
    licenseId: { type: mongoose.Schema.Types.ObjectId, ref: 'license', required: true },
}, { timestamps: true })

export default mongoose.model('SubCategory', subCategorySchema, 'subCategories');