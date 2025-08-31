const express = require("express");
const router = express.Router();
const Post = require("../models/posts");
const Comment = require("../models/comments");
const auth = require("../middleware/auth"); // <-- Make sure this is imported

// POST /comments - Create a new comment, now with secure authentication
router.post("/", auth, async (req, res) => {
    try {
        // Use the user ID from the token, not the request body
        const userId = req.user.id;
        const { text, post } = req.body;

        if (!text || !post) {
            return res.status(400).json({ success: false, message: "Text and post ID are required." });
        }

        const newComment = new Comment({
            text,
            user: userId, // Securely use the ID from the auth token
            post
        });

        const savedComment = await newComment.save();

        // Also, add the new comment to the corresponding post
        await Post.findByIdAndUpdate(post, { $push: { comments: savedComment._id } });

        res.status(201).json({
            success: true,
            message: "Comment created successfully",
            comment: savedComment
        });

    } catch (err) {
        if (err.name === 'ValidationError') {
            return res.status(400).json({ success: false, message: err.message });
        }
        res.status(500).json({ success: false, message: "Server error" });
    }
});
module.exports = router;