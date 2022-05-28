import mongoose from 'mongoose'

const Schema = mongoose.Schema;

const itemSchema = new Schema({
    name: { type: String, required: true },
    categoryId: { type: mongoose.Schema.Types.ObjectId, ref: 'Category', required: true },
    subCategoryId: { type: mongoose.Schema.Types.ObjectId, ref: 'SubCategory', required: true },
    price: { type: Number, required: true },
    description: { type: String, default: '' },
    itemImg: { type: String, default: '' },
    isAvailable: { type: Boolean, default: true },
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    isDelete: { type: Boolean, default: false },
    licenseId: { type: mongoose.Schema.Types.ObjectId, ref: 'license', required: true },
}, { timestamps: true })

export default mongoose.model('Item', itemSchema, 'items');