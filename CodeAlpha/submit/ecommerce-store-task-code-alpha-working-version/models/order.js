const mongoose = require('mongoose');

// Define the schema for a single item within an order
const orderItemSchema = new mongoose.Schema({
    product: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Product',
        required: true,
    },
    quantity: {
        type: Number,
        required: true,
        min: 1,
    },
    price: {
        type: Number,
        required: true,
        min: 0,
    }
}, { _id: false }); // Use a sub-document without its own _id

// Define the main Order schema
const orderSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
    },
    items: [orderItemSchema], // An array of the orderItemSchema
    totalPrice: {
        type: Number,
        required: true,
        min: 0,
    },
    status: {
        type: String,
        enum: ['pending', 'completed', 'shipped', 'cancelled'],
        default: 'pending',
    },
    // The `category` field is now optional to prevent validation errors.
    // An order can contain products from many different categories.
    category: {
        type: String,
    },
}, { timestamps: true }); // Mongoose will automatically add createdAt and updatedAt fields

module.exports = mongoose.model('Order', orderSchema);
