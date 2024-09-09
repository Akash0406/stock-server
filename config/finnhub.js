
const axios = require('axios');
const API_KEY = 'crcoge9r01qibo2g3sg0crcoge9r01qibo2g3sgg';

const finnhubClient = axios.create({
  baseURL: 'https://finnhub.io/api/v1/',
  params: {
    token: API_KEY
  }
});

module.exports = finnhubClient;
            