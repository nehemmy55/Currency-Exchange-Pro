require('dotenv').config();
const express = require('express');
const axios = require('axios');
const cors = require('cors');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;
const API_KEY = process.env.EXCHANGE_RATE_API_KEY;
const API_URL = `https://v6.exchangerate-api.com/v6/${API_KEY}/latest/`;


const FALLBACK_RATES = {
  USD: 1.0,     EUR: 0.93,    GBP: 0.79,    JPY: 157.34,
  AUD: 1.51,    CAD: 1.37,    CHF: 0.89,    CNY: 7.25,
  INR: 83.45,   KRW: 1372.18, SGD: 1.35,    MXN: 16.83,
  BRL: 5.05,    ZAR: 18.32,   TRY: 32.21,   RUB: 91.45,
  SEK: 10.62,   NOK: 10.68,   DKK: 6.92,    PLN: 4.03,
  THB: 36.63,   MYR: 4.72,    PHP: 57.45,   IDR: 16123.5,
  SAR: 3.75,    AED: 3.67,    ILS: 3.72,    HKD: 7.83,
  NGN: 1482.5,  EGP: 47.58,   MAD: 10.12,   XOF: 608.5,
  KES: 157.8,   GHS: 12.45,   ETB: 56.89
};

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

app.get('/api/rates', async (req, res) => {
  const base = req.query.base || 'USD';
  try {
    if (API_KEY) {
      const response = await axios.get(`${API_URL}${base}`);
      return res.json({
        base: response.data.base_code,
        rates: response.data.conversion_rates,
        lastUpdated: new Date().toISOString()
      });
    }
    const rates = {};
    Object.keys(FALLBACK_RATES).forEach(currency => {
      rates[currency] = FALLBACK_RATES[currency] / FALLBACK_RATES[base];
    });
    res.json({
      base: base,
      rates: rates,
      lastUpdated: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch rates' });
  }
});

app.get('/api/history', (req, res) => {
  const { base = 'USD' } = req.query;
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'];
  const rates = months.map((_, i) => {
    return 1 + (0.02 * Math.sin(i)) + (0.01 * Math.random());
  });
  res.json({ 
    base: base,
    labels: months,
    rates: rates
  });
});

app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.listen(PORT, () => {
  console.log(`Server running with ${Object.keys(FALLBACK_RATES).length} currencies`);
});