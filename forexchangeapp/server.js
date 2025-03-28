require('dotenv').config();
const express = require('express');
const axios = require('axios');
const cors = require('cors');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

// Enhanced CORS configuration
app.use(cors({
    origin: ['http://localhost:5500', 'http://localhost:3000'],
    methods: ['GET', 'OPTIONS']
}));

app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// Extended list of 50+ currencies
const allCurrencies = [
    'USD', 'EUR', 'GBP', 'JPY', 'AUD', 'CAD', 'CHF', 'CNY', 'HKD', 'SGD',
    'INR', 'MXN', 'BRL', 'RUB', 'ZAR', 'KRW', 'TRY', 'SEK', 'NOK', 'DKK',
    'NZD', 'THB', 'MYR', 'PHP', 'IDR', 'SAR', 'AED', 'PLN', 'HUF', 'CZK',
    'ILS', 'CLP', 'ARS', 'COP', 'PEN', 'VND', 'PKR', 'BGN', 'RON', 'HRK',
    'ISK', 'UAH', 'QAR', 'KWD', 'EGP', 'NGN', 'BDT', 'KES', 'MAD', 'TWD'
];

// Enhanced fallback rates for all currencies
const fallbackRates = {
    USD: Object.fromEntries(allCurrencies.map(currency => {
        const baseRate = {
            USD: 1, EUR: 0.93, GBP: 0.79, JPY: 151.34, AUD: 1.52, CAD: 1.36,
            CHF: 0.91, CNY: 7.23, HKD: 7.83, SGD: 1.35, INR: 83.12, MXN: 16.89,
            BRL: 4.92, RUB: 91.45, ZAR: 18.67, KRW: 1332.56, TRY: 32.01, SEK: 10.68,
            NOK: 10.62, DKK: 6.93, NZD: 1.66, THB: 35.89, MYR: 4.72, PHP: 56.23,
            IDR: 15678.45, SAR: 3.75, AED: 3.67, PLN: 4.12, HUF: 358.23, CZK: 23.12,
            ILS: 3.67, CLP: 876.45, ARS: 350.12, COP: 3901.23, PEN: 3.78, VND: 24345.67,
            PKR: 278.34, BGN: 1.83, RON: 4.56, HRK: 7.01, ISK: 137.89, UAH: 36.78,
            QAR: 3.64, KWD: 0.31, EGP: 30.90, NGN: 770.12, BDT: 109.45, KES: 150.67,
            MAD: 10.12, TWD: 31.45
        };
        return [currency, baseRate[currency] || (Math.random() * 100).toFixed(2)];
    }))
};

// Generate fallback rates for other bases
for (const base of allCurrencies.filter(c => c !== 'USD')) {
    fallbackRates[base] = {};
    for (const currency of allCurrencies) {
        if (base === currency) {
            fallbackRates[base][currency] = 1;
        } else {
            fallbackRates[base][currency] = fallbackRates.USD[currency] / fallbackRates.USD[base];
        }
    }
}

// API Endpoint with all currencies
app.get('/api/rates', async (req, res) => {
    try {
        const { base = 'USD' } = req.query;
        const response = await axios.get(`https://api.frankfurter.app/latest?from=${base}`);
        
        // Filter to only include our supported currencies
        const filteredRates = {};
        allCurrencies.forEach(currency => {
            if (response.data.rates[currency]) {
                filteredRates[currency] = response.data.rates[currency];
            }
        });
        
        res.json({
            base: response.data.base,
            rates: filteredRates,
            lastUpdated: new Date().toISOString()
        });
    } catch (error) {
        console.error('API Error:', error);
        const base = req.query.base || 'USD';
        res.json({
            base: base,
            rates: fallbackRates[base] || fallbackRates.USD,
            lastUpdated: new Date().toISOString(),
            message: "Using fallback data"
        });
    }
});

// Chart endpoint with realistic data
app.get('/api/chart', (req, res) => {
    const base = req.query.base || 'USD';
    const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun"];
    
    // Generate realistic rate fluctuations
    const baseRate = fallbackRates.USD[base] || 1;
    const rates = months.map((_, i) => {
        const fluctuation = 0.95 + (Math.random() * 0.1);
        return (baseRate * fluctuation * (1 + i * 0.01)).toFixed(4);
    });
    
    res.json({
        base: base,
        labels: months,
        rates: rates
    });
});

// Health check endpoint
app.get('/api/health', (req, res) => {
    res.json({
        status: 'healthy',
        currencies: allCurrencies,
        timestamp: new Date().toISOString()
    });
});

app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
    console.log(`Supporting ${allCurrencies.length} currencies`);
});