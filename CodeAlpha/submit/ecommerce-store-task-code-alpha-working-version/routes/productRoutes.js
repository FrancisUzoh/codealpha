const express = require('express');
const router = express.Router();
const Product = require('../models/product');
const authMiddleware = require('../middleware/auth');
const initialProducts = require('./initial-products');

// Helper function to seed the database with initial products
const seedProducts = async () => {
    try {
        const count = await Product.countDocuments();
        console.log('Product count before seeding:', count);
        if (count === 0) {
            await Product.insertMany(initialProducts);
            console.log('Database seeded with initial products.');
        } else {
            console.log('Database already contains products. Skipping seeding.');
        }
    } catch (error) {
        console.error('Error seeding products:', error);
    }
};

// Route to get all products
router.get('/', async (req, res) => {
    try {
        const products = await Product.find({});
        res.json(products);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching products', error });
    }
});

// Route to get all unique categories
router.get('/categories', async (req, res) => {
    try {
        const categories = await Product.distinct('category');
        console.log('Categories returned from database:', categories);
        res.json(categories);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching categories', error });
    }
});

// Route to get products by category name
router.get('/category/:name', async (req, res) => {
    try {
        const categoryName = req.params.name;
        const filteredProducts = await Product.find({ category: new RegExp(categoryName, 'i') });

        if (filteredProducts.length > 0) {
            res.json(filteredProducts);
        } else {
            res.status(404).json({ message: 'No products found for this category.' });
        }
    } catch (error) {
        res.status(500).json({ message: 'Error fetching products by category', error });
    }
});

// Run the seeding function when the server starts
seedProducts();

module.exports = router;
