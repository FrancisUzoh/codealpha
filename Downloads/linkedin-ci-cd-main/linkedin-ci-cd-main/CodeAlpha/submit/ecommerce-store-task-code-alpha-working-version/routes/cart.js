const express = require('express');
const Cart = require('../models/cart');
const Product = require('../models/product');
const authMiddleware = require('../middleware/auth');

const router = express.Router();

// -------------------------------------------------------------
// Route to get the authenticated user's cart
// @route   GET /
// @access  Private
// -------------------------------------------------------------
router.get('/', authMiddleware, async (req, res) => {
    try {
        let cart = await Cart.findOne({ user: req.user.id }).populate('items.product');

        // Handle the case where the cart doesn't exist
        if (!cart) {
            return res.json({ items: [] });
        }

        // --- THE FIX ---
        // Filter out any items where the product object is null.
        // This handles cases where a product was deleted from the database
        // after being added to the cart.
        cart.items = cart.items.filter(item => item.product !== null);

        res.json(cart);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

// -------------------------------------------------------------
// Route to add a product to the user's cart
// @route   POST /
// @access  Private
// -------------------------------------------------------------
router.post('/', authMiddleware, async (req, res) => {
    console.log('Attempting to add a product to the cart...')
    const { productId, quantity } = req.body;
    try {
        // First, check if the product actually exists
        const product = await Product.findById(productId);
        if (!product) {
            return res.status(404).json({ message: 'Product not found' });
        }

        let cart = await Cart.findOne({ user: req.user.id });

        if (cart) {
            // Cart exists for the user
            const itemIndex = cart.items.findIndex(item => item.product.toString() === productId);

            if (itemIndex > -1) {
                // Product exists in the cart, update the quantity
                let productItem = cart.items[itemIndex];
                productItem.quantity += quantity;
                cart.items[itemIndex] = productItem;
            } else {
                // Product does not exist in cart, add new item
                cart.items.push({ product: productId, quantity });
            }
            cart = await cart.save();
            return res.status(200).json(cart);
        } else {
            // No cart exists for user, create a new one
            const newCart = await Cart.create({
                user: req.user.id,
                items: [{ product: productId, quantity }],
            });
            return res.status(201).json(newCart);
        }
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

// -------------------------------------------------------------
// Route to update a product's quantity in the cart
// @route   PUT /:productId
// @access  Private
// -------------------------------------------------------------
router.put('/:productId', authMiddleware, async (req, res) => {
    try {
        const { quantity } = req.body;
        const cart = await Cart.findOne({ user: req.user.id });
        if (!cart) {
            return res.status(404).json({ message: 'Cart not found' });
        }

        const itemIndex = cart.items.findIndex(item => item.product.toString() === req.params.productId);
        if (itemIndex > -1) {
            cart.items[itemIndex].quantity = quantity;
            await cart.save();
            res.json(cart);
        } else {
            res.status(404).json({ message: 'Item not found in cart' });
        }
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

// -------------------------------------------------------------
// Route to remove an item from the cart
// @route   DELETE /:productId
// @access  Private
// -------------------------------------------------------------
router.delete('/:productId', authMiddleware, async (req, res) => {
    try {
        const cart = await Cart.findOne({ user: req.user.id });
        if (!cart) {
            return res.status(404).json({ message: 'Cart not found' });
        }

        cart.items = cart.items.filter(item => item.product.toString() !== req.params.productId);//remove products not submitted by the user
        await cart.save();
        res.json({ message: 'Item removed from cart' });
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

module.exports = router;
