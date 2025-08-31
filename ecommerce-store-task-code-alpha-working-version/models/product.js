const mongoose = require('mongoose');

const productSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        trim: true,          // Optional: trims whitespace
    },
    price: {
        type: Number,
        required: true,
        min: 0,              // Optional: price can't be negative
    },
    description: {
        type: String,
        required: true,
        trim: true,
    },
    image: {
        type: String,
        default: '',         // Optional: default empty string if no image provided
    },
    stock: {
        type: Number,
        default: 0,
        min: 0,              // Optional: stock can't be negative
    },
    category: {
        type: String,
        trim: true,
        default: 'General',  // Optional: default category if none specified
    },
});

// Check if the 'Product' model already exists. If it does, use it.
// If it doesn't, create it using mongoose.model.
module.exports = mongoose.models.Product || mongoose.model('Product', productSchema);
