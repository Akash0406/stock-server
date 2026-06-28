const mongoose = require('mongoose');

const portfolioSchema = new mongoose.Schema({
    symbol: {
        type: String,
        required: true,
        trim: true,
        uppercase: true,
        unique: true
    },
    units: {
        type: Number,
        required: true,
        min: 0
    },
    unitPrice: {
        type: Number,
        required: true,
        min: 0
    },
    purchasePrice: { 
        type: Number, 
        required: true,
        min: 0
    },
    purchaseDate: { 
        type: Date,
        default: Date.now
    },
}, { timestamps: true });

const Portfolio = mongoose.model('Portfolio', portfolioSchema);
module.exports = Portfolio;
