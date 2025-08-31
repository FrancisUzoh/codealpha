const express = require('express');
const Cart = require('../models/cart');
const Order = require('../models/order');
const Product = require('../models/product');
const authMiddleware = require('../middleware/auth');

const router = express.Router();

// Create order from cart (checkout)
router.post('/', authMiddleware, async (req, res) => {
    console.log('Attempting to create a new order...')

    try {
        // 1. Find the user's cart and populate product details
        const cart = await Cart.findOne({ user: req.user.id }).populate('items.product');

        if (!cart || cart.items.length === 0) {
            return res.status(400).json({ message: 'Cart is empty, cannot create an order.' });
        }

        // 2. Calculate total price and prepare order items
        let totalPrice = 0;
        const orderItems = cart.items.map(cartItem => {
            const itemPrice = cartItem.product.price * cartItem.quantity;
            totalPrice += itemPrice;
            return {
                product: cartItem.product._id,
                quantity: cartItem.quantity,
                price: itemPrice,
            };
        });

        // 3. Create a new order with the prepared data
        const newOrder = new Order({
            user: req.user.id,
            items: orderItems,
            totalPrice: totalPrice,
        });

        await newOrder.save();

        // 4. Clear the user's cart after a successful order
        cart.items = [];
        await cart.save();

        // 5. Send a success response
        res.status(201).json({ message: 'Order created successfully', order: newOrder });

    } catch (err) {
        // Log the error and send a 500 server error response
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

// View order history
router.get('/history', authMiddleware, async (req, res) => {
    try {
            const orders = await Order.find({ user: req.user.id })
            .sort({ createdAt: -1 })
            .populate({
                path: 'items.product',
                model: 'Product'
            });

        console.log('Found orders for current user:', orders.length);
        console.log('================================');

        res.json(orders);
    } catch (err) {
        console.error('Error in order history:', err.message);
        res.status(500).send('Server Error');
    }
});
module.exports = router;