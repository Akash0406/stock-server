require('./config/env');

const express = require('express');
const path = require('path');
const cors = require('cors');

const connectDB = require('./config/database');
const finnhubClient = require('./config/finnhub');
const Portfolio = require('./src/model/Portfolio');

const app = express();
const PORT = process.env.PORT || 4000;
const CLIENT_ORIGINS = (process.env.CLIENT_ORIGINS || 'http://localhost:4000,https://stocks-akash0406.vercel.app')
  .split(',')
  .map((origin) => origin.trim())
  .filter(Boolean);

const POPULAR_SYMBOLS = ['AAPL', 'MSFT', 'GOOGL', 'AMZN', 'NVDA', 'META', 'TSLA', 'NFLX', 'AMD', 'INTC'];
const POPULAR_CACHE_TTL_MS = 30 * 1000;
let popularStocksCache = { data: null, expires: 0 };

app.use(cors({
  origin(origin, callback) {
    if (!origin || CLIENT_ORIGINS.includes(origin)) {
      return callback(null, true);
    }

    return callback(new Error('Origin not allowed by CORS'));
  },
  methods: ['GET', 'POST'],
  credentials: true,
}));

app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.get('/purchase', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'purchase.html'));
});

app.get('/buy', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'purchase.html'));
});

app.get('/api/health', (req, res) => {
  res.status(200).json({ status: 'ok' });
});

app.get('/api/quote/:symbol', async (req, res) => {
  try {
    const quote = await getStockQuote(req.params.symbol);
    res.status(200).json(quote);
  } catch (error) {
    res.status(error.statusCode || 500).json({ message: error.message || 'Error fetching quote' });
  }
});

app.get('/api/search', async (req, res) => {
  try {
    const query = String(req.query.q || '').trim();

    if (!query) {
      return res.status(200).json({ results: [] });
    }

    const { data } = await finnhubClient.get('/search', { params: { q: query } });

    const results = (data.result || [])
      .filter((item) => item.symbol && !item.symbol.includes('.'))
      .slice(0, 8)
      .map((item) => ({
        symbol: item.symbol,
        description: item.description || '',
        type: item.type || '',
      }));

    res.status(200).json({ results });
  } catch (error) {
    res.status(error.statusCode || 500).json({ message: error.message || 'Error searching symbols' });
  }
});

app.get('/api/stocks/popular', async (req, res) => {
  try {
    if (popularStocksCache.data && popularStocksCache.expires > Date.now()) {
      return res.status(200).json({ stocks: popularStocksCache.data });
    }

    const quotes = await Promise.all(POPULAR_SYMBOLS.map(async (symbol) => {
      try {
        return await getStockQuote(symbol);
      } catch (error) {
        return null;
      }
    }));

    const stocks = quotes.filter(Boolean);
    popularStocksCache = { data: stocks, expires: Date.now() + POPULAR_CACHE_TTL_MS };

    res.status(200).json({ stocks });
  } catch (error) {
    res.status(error.statusCode || 500).json({ message: error.message || 'Error fetching stocks' });
  }
});

app.post('/api/portfolio', async (req, res) => {
  try {
    const symbol = normalizeSymbol(req.body.symbol);
    const units = Number(req.body.units);

    if (!symbol) {
      return res.status(400).json({ message: 'Stock symbol is required' });
    }

    if (!Number.isFinite(units) || units <= 0) {
      return res.status(400).json({ message: 'Units must be a positive number' });
    }

    const quote = await getStockQuote(symbol);
    const existingStock = await Portfolio.findOne({ symbol });

    if (existingStock) {
      const totalUnits = roundQuantity(existingStock.units + units);
      const totalCost = roundMoney(existingStock.purchasePrice + quote.price * units);

      existingStock.units = totalUnits;
      existingStock.purchasePrice = totalCost;
      existingStock.unitPrice = roundMoney(totalCost / totalUnits);
      await existingStock.save();

      return res.status(200).json({
        message: `Added ${units} more share(s) of ${symbol} to your portfolio`,
        stock: existingStock,
        added: true,
      });
    }

    const newStock = await Portfolio.create({
      symbol,
      units,
      unitPrice: quote.price,
      purchasePrice: roundMoney(quote.price * units),
      purchaseDate: new Date(),
    });

    res.status(201).json({ message: 'Stock purchased successfully', stock: newStock });
  } catch (error) {
    res.status(error.statusCode || 500).json({ message: error.message || 'Error purchasing stock' });
  }
});

app.get('/api/portfolio', async (req, res) => {
  try {
    const portfolio = await Portfolio.find().sort({ symbol: 1 });
    const enrichedPortfolio = await Promise.all(portfolio.map(enrichStock));

    const totals = enrichedPortfolio.reduce((summary, stock) => {
      summary.totalValueNow += stock.currentValue;
      summary.totalValueAtPurchase += stock.purchasePrice;
      return summary;
    }, { totalValueNow: 0, totalValueAtPurchase: 0 });

    res.status(200).json({
      totalValueNow: roundMoney(totals.totalValueNow),
      totalProfitLoss: roundMoney(totals.totalValueNow - totals.totalValueAtPurchase),
      portfolio: enrichedPortfolio,
    });
  } catch (error) {
    res.status(error.statusCode || 500).json({ message: error.message || 'Error fetching portfolio data' });
  }
});

app.post('/api/portfolio/sell', async (req, res) => {
  try {
    const symbol = normalizeSymbol(req.body.symbol);
    const unitsToSell = Number(req.body.unitsToSell);

    if (!symbol) {
      return res.status(400).json({ message: 'Stock symbol is required' });
    }

    if (!Number.isFinite(unitsToSell) || unitsToSell <= 0) {
      return res.status(400).json({ message: 'Units to sell must be a positive number' });
    }

    const stock = await Portfolio.findOne({ symbol });
    if (!stock) {
      return res.status(404).json({ message: 'Stock not found' });
    }

    if (stock.units < unitsToSell) {
      return res.status(400).json({ message: 'Not enough units to sell' });
    }

    stock.units = roundQuantity(stock.units - unitsToSell);

    if (stock.units === 0) {
      await Portfolio.deleteOne({ symbol });
      return res.status(200).json({ message: 'Stock sold and removed from portfolio' });
    }

    stock.purchasePrice = roundMoney(stock.unitPrice * stock.units);
    await stock.save();

    res.status(200).json({ message: 'Stock sold successfully', stock });
  } catch (error) {
    res.status(500).json({ message: error.message || 'Error selling stock' });
  }
});

function normalizeSymbol(symbol) {
  return String(symbol || '').trim().toUpperCase();
}

async function getStockQuote(symbol) {
  const normalizedSymbol = normalizeSymbol(symbol);

  if (!normalizedSymbol) {
    const error = new Error('Stock symbol is required');
    error.statusCode = 400;
    throw error;
  }

  const { data } = await finnhubClient.get('/quote', {
    params: { symbol: normalizedSymbol },
  });

  if (!data || !Number.isFinite(data.c) || data.c <= 0) {
    const error = new Error('No current price found for this symbol');
    error.statusCode = 404;
    throw error;
  }

  return {
    symbol: normalizedSymbol,
    price: roundMoney(data.c),
    change: roundMoney(data.d || 0),
    changePercent: roundMoney(data.dp || 0),
    previousClose: roundMoney(data.pc || 0),
  };
}

async function enrichStock(stock) {
  const quote = await getStockQuote(stock.symbol);
  const currentValue = quote.price * stock.units;
  const profitLoss = currentValue - stock.purchasePrice;

  return {
    id: stock._id,
    symbol: stock.symbol,
    units: stock.units,
    unitPrice: stock.unitPrice,
    purchasePrice: roundMoney(stock.purchasePrice),
    purchaseDate: stock.purchaseDate,
    currentPrice: quote.price,
    currentValue: roundMoney(currentValue),
    profitLoss: roundMoney(profitLoss),
    change: quote.change,
    changePercent: quote.changePercent,
  };
}

function roundMoney(value) {
  return Math.round((Number(value) || 0) * 100) / 100;
}

function roundQuantity(value) {
  return Math.round((Number(value) || 0) * 1000000) / 1000000;
}

if (require.main === module) {
  connectDB()
    .then(() => {
      app.listen(PORT, () => {
        console.log(`Server is running on port ${PORT}`);
      });
    })
    .catch((error) => {
      console.error('Failed to connect to the database', error);
      process.exit(1);
    });
}

module.exports = app;
