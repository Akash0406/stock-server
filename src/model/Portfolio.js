const mongoose = require('mongoose');

const portfolioSchema = new mongoose.Schema({
    symbol: {
        type: String,
        required: true
    },
    units: {
        type: Number,
        required: true
    },
    unitPrice: {
        type: Number,
        require: true
    },
    purchasePrice: { 
        type: Number, 
        required: true 
    },
    purchaseDate: { 
        type: Date 
    },
});

const Portfolio = mongoose.model('Portfolio', portfolioSchema);
module.exports = Portfolio;
