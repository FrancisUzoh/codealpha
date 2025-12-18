const mongoose = require("mongoose");

const PostSchema = new mongoose.Schema({
    // Optional title field - add this if you want titles
    title: {
        type: String,
        required: false, // Make it optional or required based on your needs
        trim: true,
        maxlength: 200
    },

    // Content is required
    content: {
        type: String,
        required: [true, 'Content is required'],
        trim: true,
        maxlength: 5000
    },

    // Optional image field
    image: {
        type: String,
        required: false
    },

    // Likes array
    likes: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
    }],

    // User who posted (required)
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: [true, 'User is required'],
    },

    // Comments array
    comments: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: "Comment",
    }],

    // Creation timestamp
    date: {
        type: Date,
        default: Date.now,
    },

    // Optional: Last updated timestamp
    updatedAt: {
        type: Date,
        default: Date.now,
    }
});

// Add indexes for better performance
PostSchema.index({ date: -1 }); // For sorting by date
PostSchema.index({ user: 1 });  // For finding user's posts

module.exports = mongoose.model("Post", PostSchema); // Changed from "posts" to "Post" (singular, capitalized)