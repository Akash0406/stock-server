
const axios = require('axios');

if (!process.env.FINNHUB_API_KEY) {
  throw new Error('FINNHUB_API_KEY is not configured');
}

const finnhubClient = axios.create({
  baseURL: 'https://finnhub.io/api/v1/',
  params: {
    token: process.env.FINNHUB_API_KEY
  }
});

module.exports = finnhubClient;
