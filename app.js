// app.js

const express = require('express');
const mongoose = require('mongoose');
const bodyParser = require('body-parser');
const path = require('path');
const cors = require('cors');

// MongoDB Connection String
const uri = 'mongodb+srv://akash0406:Akash%400406@stock-portfolio.xw7wy.mongodb.net/stocks-Akash0406?retryWrites=true&w=majority';

// Function to Connect to MongoDB
const connectDB = async () => {
  try {
    await mongoose.connect(uri, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('MongoDB connected');
  } catch (error) {
    console.error('MongoDB connection error:', error.message);
    process.exit(1);
  }
};

// Define Mongoose Schema for Portfolio
const PortfolioSchema = new mongoose.Schema({
  symbol: { type: String, required: true },
  units: { type: Number, required: true },
  unitPrice: { type: Number, required: true },
  purchasePrice: { type: Number, required: true },
  purchaseDate: { type: Date, default: Date.now },
});

// Mongoose Model for Portfolio
const Portfolio = mongoose.model('Portfolio', PortfolioSchema);

const app = express();

// CORS configuration
app.use(cors({
  origin: ["https://stocks-akash0406.vercel.app"],
  methods: ["POST", "GET"],
  credentials: true,
}));

app.use(express.json());
app.use(bodyParser.json());
app.use(express.static('public'));

// Test route for API connection
app.get("/", (req, res) => {
  res.json("API Connected...");
});

// Route to serve the purchase.html page
app.get('/purchase', (req, res) => {
  res.sendFile(path.join(__dirname, '../public/purchase.html'));
});

// Purchase Stock - POST Route
app.post('/api/portfolio', async (req, res) => {
  const { symbol, units, unitPrice, purchasePrice, purchaseDate } = req.body;

  try {
    let stock = await Portfolio.findOne({ symbol });

    if (stock) {
      res.status(405).json({ message: 'Stock already purchased; cannot purchase again' });
    } else {
      const newStock = new Portfolio({
        symbol,
        units,
        unitPrice,
        purchasePrice,
        purchaseDate,
      });

      await newStock.save();
      res.status(200).json({ message: 'Stock purchased successfully' });
    }
  } catch (error) {
    res.status(500).json({ message: 'Error purchasing stock', error });
  }
});

// Get Portfolio Data
app.get('/api/portfolio', async (req, res) => {
  try {
    const portfolio = await Portfolio.find();
    let totalValueNow = 0;
    let totalValueAtPurchase = 0;

    // Calculate total value and profit/loss
    for (const stock of portfolio) {
      const stockPrice = await getStockPrice(stock.symbol);
      totalValueNow += stock.units * stockPrice;
      totalValueAtPurchase += stock.units * stock.unitPrice;
    }
    const totalProfitLoss = totalValueNow - totalValueAtPurchase;
    res.status(200).json({ totalValueNow, totalProfitLoss, portfolio });
  } catch (error) {
    res.status(500).json({ message: 'Error fetching portfolio data', error });
  }
});

// Sell Stock - POST Route
app.post('/api/portfolio/sell', async (req, res) => {
  const { symbol, unitsToSell } = req.body;

  try {
    let stock = await Portfolio.findOne({ symbol });

    if (!stock) {
      return res.status(404).json({ message: 'Stock not found' });
    }

    if (stock.units < unitsToSell) {
      return res.status(400).json({ message: 'Not enough units to sell' });
    }

    stock.units -= unitsToSell;

    if (stock.units === 0) {
      await Portfolio.deleteOne({ symbol });
      return res.status(200).json({ message: 'Stock sold and removed from portfolio' });
    }

    await stock.save();
    res.status(200).json({ message: 'Stock sold successfully' });

  } catch (error) {
    res.status(500).json({ message: 'Error selling stock', error });
  }
});

// Helper function to get stock price using Finnhub API
async function getStockPrice(symbol) {
  const apiKey = 'crcoge9r01qibo2g3sg0crcoge9r01qibo2g3sgg';
  const response = await fetch(`https://finnhub.io/api/v1/quote?symbol=${symbol}&token=${apiKey}`);
  const data = await response.json();
  return data.c; // 'c' is the current price
}

// Start the server
const PORT = process.env.PORT || 4000;
connectDB()
  .then(() => {
    app.listen(PORT, () => {
      console.log(`Server is running on port ${PORT}`);
    });
  })
  .catch((error) => {
    console.error('Failed to connect to the database', error);
  });
