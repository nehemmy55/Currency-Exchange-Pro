document.addEventListener('DOMContentLoaded', function() {
    // Configuration - works for both ports
    const BACKEND_URL = window.location.port === '5500' 
        ? 'http://localhost:3000' 
        : 'http://localhost:3000';
    
    console.log(`Connecting to backend at: ${BACKEND_URL}`);

    // DOM Elements
    const elements = {
        fromCurrency: document.getElementById('fromCurrency'),
        toCurrency: document.getElementById('toCurrency'),
        baseSelect: document.getElementById('baseSelect'),
        amount: document.getElementById('amount'),
        convertBtn: document.getElementById('convertBtn'),
        result: document.getElementById('result'),
        ratesTable: document.getElementById('ratesTable'),
        baseCurrency: document.getElementById('baseCurrency'),
        lastUpdated: document.getElementById('lastUpdated'),
        chartCanvas: document.getElementById('exchangeRateChart'),
        loadingIndicator: document.getElementById('loadingIndicator')
    };

    let currentBase = 'USD';
    let currentRates = {};
    let exchangeChart = null;
    let allCurrencies = [];

    // Utility Functions
    function showLoading(isLoading) {
        elements.loadingIndicator.style.display = isLoading ? 'block' : 'none';
        document.querySelectorAll('button, select').forEach(el => {
            el.disabled = isLoading;
        });
    }

    function showError(message) {
        const alertDiv = document.createElement('div');
        alertDiv.className = 'alert alert-danger';
        alertDiv.textContent = message;
        document.querySelector('.container').prepend(alertDiv);
        setTimeout(() => alertDiv.remove(), 5000);
    }

    // Initialize Application
    init();

    async function init() {
        showLoading(true);
        try {
            // First get the list of available currencies
            const healthResponse = await fetch(`${BACKEND_URL}/api/health`);
            const healthData = await healthResponse.json();
            allCurrencies = healthData.currencies || ['USD', 'EUR', 'GBP'];
            
            populateCurrencySelects();
            await fetchRates(currentBase);
            await fetchChartData(currentBase);
            setupEventListeners();
        } catch (error) {
            showError('Initialization failed. Using limited functionality.');
            console.error('Initialization error:', error);
            
            // Fallback to basic currencies
            allCurrencies = ['USD', 'EUR', 'GBP', 'JPY', 'AUD', 'CAD'];
            populateCurrencySelects();
        } finally {
            showLoading(false);
        }
    }

    function populateCurrencySelects() {
        // Clear existing options
        elements.fromCurrency.innerHTML = '';
        elements.toCurrency.innerHTML = '';
        elements.baseSelect.innerHTML = '';
        
        // Add default option
        const defaultOption = '<option value="" disabled selected>Select currency</option>';
        elements.fromCurrency.innerHTML = defaultOption;
        elements.toCurrency.innerHTML = defaultOption;
        elements.baseSelect.innerHTML = defaultOption;
        
        // Add all currencies
        allCurrencies.forEach(currency => {
            const option = `<option value="${currency}">${currency}</option>`;
            elements.fromCurrency.innerHTML += option;
            elements.toCurrency.innerHTML += option;
            elements.baseSelect.innerHTML += option;
        });
        
        // Set default values
        elements.fromCurrency.value = 'USD';
        elements.toCurrency.value = 'EUR';
        elements.baseSelect.value = 'USD';
        elements.baseCurrency.textContent = 'USD';
    }

    async function fetchRates(base) {
        try {
            const response = await fetch(`${BACKEND_URL}/api/rates?base=${base}`);
            if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
            
            const data = await response.json();
            currentRates = data.rates;
            displayRates(data);
        } catch (error) {
            showError('Failed to fetch current rates. Using fallback data.');
            console.error('Fetch rates error:', error);
            
            // Create mock rates based on USD if available
            if (currentRates.USD) {
                const baseRate = currentRates.USD[base] || 1;
                currentRates = {};
                allCurrencies.forEach(currency => {
                    currentRates[currency] = currentRates.USD[currency] / baseRate;
                });
            }
            
            displayRates({
                base: base,
                rates: currentRates,
                lastUpdated: new Date().toISOString(),
                message: "Using fallback data"
            });
        }
    }

    function displayRates(data) {
        let html = '';
        allCurrencies.forEach(currency => {
            if (data.rates[currency]) {
                html += `<tr>
                    <td>${currency}</td>
                    <td>${data.rates[currency].toFixed(6)}</td>
                </tr>`;
            }
        });
        elements.ratesTable.innerHTML = html;
        
        let updateText = `Last updated: ${new Date(data.lastUpdated).toLocaleString()}`;
        if (data.message) {
            updateText += ` (${data.message})`;
        }
        elements.lastUpdated.textContent = updateText;
    }

    async function fetchChartData(base) {
        try {
            const response = await fetch(`${BACKEND_URL}/api/chart?base=${base}`);
            if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
            
            const data = await response.json();
            renderChart(data);
        } catch (error) {
            showError('Failed to load chart data. Showing sample data.');
            console.error('Chart error:', error);
            renderChart({
                base: base,
                labels: ["Jan", "Feb", "Mar", "Apr", "May", "Jun"],
                rates: [1, 0.98, 0.96, 0.97, 0.99, 1.01]
            });
        }
    }

    function renderChart(data) {
        if (exchangeChart) {
            exchangeChart.destroy();
        }

        const ctx = elements.chartCanvas.getContext('2d');
        exchangeChart = new Chart(ctx, {
            type: 'line',
            data: {
                labels: data.labels,
                datasets: [{
                    label: `${data.base} Exchange Rate Trend`,
                    data: data.rates,
                    borderColor: '#3498db',
                    backgroundColor: 'rgba(52, 152, 219, 0.1)',
                    borderWidth: 2,
                    tension: 0.1,
                    fill: true
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        position: 'top',
                    },
                    tooltip: {
                        callbacks: {
                            label: function(context) {
                                return `Rate: ${context.parsed.y.toFixed(4)}`;
                            }
                        }
                    }
                }
            }
        });
    }

    function setupEventListeners() {
        elements.convertBtn.addEventListener('click', convertCurrency);
        elements.baseSelect.addEventListener('change', async function() {
            currentBase = this.value;
            elements.baseCurrency.textContent = currentBase;
            showLoading(true);
            try {
                await Promise.all([
                    fetchRates(currentBase),
                    fetchChartData(currentBase)
                ]);
            } catch (error) {
                showError('Failed to update data');
                console.error('Base change error:', error);
            } finally {
                showLoading(false);
            }
        });
    }

    async function convertCurrency() {
        const amount = parseFloat(elements.amount.value);
        const from = elements.fromCurrency.value;
        const to = elements.toCurrency.value;

        if (isNaN(amount)) {
            showError('Please enter a valid amount');
            return;
        }

        if (!from || !to) {
            showError('Please select both currencies');
            return;
        }

        if (from === to) {
            elements.result.innerHTML = `<div class="alert alert-info">${amount} ${from} = ${amount} ${to}</div>`;
            return;
        }

        showLoading(true);
        try {
            // If rates aren't available for this base, fetch them
            if (currentBase !== from || !currentRates[to]) {
                await fetchRates(from);
            }

            const rate = currentRates[to];
            const convertedAmount = (amount * rate).toFixed(2);
            
            elements.result.innerHTML = `
                <div class="conversion-result">
                    <h4>${amount} ${from} = ${convertedAmount} ${to}</h4>
                    <div class="rate-info">
                        <span>1 ${from} = ${rate.toFixed(6)} ${to}</span>
                        <span>1 ${to} = ${(1 / rate).toFixed(6)} ${from}</span>
                    </div>
                </div>
            `;
        } catch (error) {
            showError('Conversion failed. Please try again.');
            console.error('Conversion error:', error);
        } finally {
            showLoading(false);
        }
    }
});