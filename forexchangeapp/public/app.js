document.addEventListener('DOMContentLoaded', function() {
    const BACKEND_URL = 'http://localhost:3000';
    const CURRENCIES = Object.keys({
      USD:1, EUR:1, GBP:1, JPY:1, AUD:1, CAD:1, CHF:1, CNY:1, INR:1,
      KRW:1, SGD:1, MXN:1, BRL:1, ZAR:1, TRY:1, RUB:1, SEK:1, NOK:1,
      DKK:1, PLN:1, THB:1, MYR:1, PHP:1, IDR:1, SAR:1, AED:1, ILS:1,
      NGN:1, EGP:1, KES:1
    });
  
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
      loadingIndicator: document.getElementById('loadingIndicator'),
      convertText: document.getElementById('convertText'),
      convertSpinner: document.getElementById('convertSpinner')
    };
  
    let currentBase = 'USD';
    let currentRates = {};
    let exchangeChart = null;
  
    init();
  
    async function init() {
      showLoading(true);
      populateCurrencySelects();
      await fetchRates(currentBase);
      await fetchCurrencyTrend(currentBase);
      setupEventListeners();
      showLoading(false);
    }
  
    function populateCurrencySelects() {
      const optionHTML = CURRENCIES.map(currency => 
        `<option value="${currency}">${currency}</option>`
      ).join('');
  
      elements.fromCurrency.innerHTML = 
        `<option value="USD" selected>USD</option>` + optionHTML;
      elements.toCurrency.innerHTML = 
        `<option value="EUR" selected>EUR</option>` + optionHTML;
      elements.baseSelect.innerHTML = 
        `<option value="USD" selected>USD</option>` + optionHTML;
    }
  
    async function fetchRates(base) {
      try {
        const response = await fetch(`${BACKEND_URL}/api/rates?base=${base}`);
        const data = await response.json();
        currentRates = data.rates;
        displayRates(data);
      } catch (error) {
        console.error("Failed to fetch rates:", error);
      }
    }
  
    function displayRates(data) {
      let html = '';
      CURRENCIES.forEach(currency => {
        if (data.rates[currency]) {
          html += `<tr><td>${currency}</td><td>${data.rates[currency].toFixed(6)}</td></tr>`;
        }
      });
      elements.ratesTable.innerHTML = html;
      elements.lastUpdated.textContent = `Last updated: ${new Date(data.lastUpdated).toLocaleString()}`;
    }
  
    async function fetchCurrencyTrend(base) {
      try {
        const response = await fetch(`${BACKEND_URL}/api/history?base=${base}`);
        const data = await response.json();
        updateTrendChart(data);
      } catch (error) {
        console.error("Failed to fetch trends:", error);
      }
    }
  
    function updateTrendChart(data) {
      if (exchangeChart) exchangeChart.destroy();
      const ctx = elements.chartCanvas.getContext('2d');
      
      exchangeChart = new Chart(ctx, {
        type: 'line',
        data: {
          labels: data.labels,
          datasets: [{
            label: `${data.base} Value Trend`,
            data: data.rates,
            borderColor: 'rgba(75, 192, 192, 1)',
            backgroundColor: 'rgba(75, 192, 192, 0.2)',
            borderWidth: 2,
            tension: 0.1,
            fill: true
          }]
        },
        options: {
          responsive: true,
          plugins: {
            title: {
              display: true,
              text: `${data.base} Currency Value Trend`,
              font: { size: 16 }
            },
            tooltip: {
              callbacks: {
                label: function(context) {
                  return `Value: ${context.parsed.y.toFixed(4)}`;
                }
              }
            }
          },
          scales: {
            y: {
              beginAtZero: false,
              title: {
                display: true,
                text: `Value of 1 ${data.base}`
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
        await fetchRates(currentBase);
        await fetchCurrencyTrend(currentBase);
        showLoading(false);
      });
    }
  
    async function convertCurrency() {
      const amount = parseFloat(elements.amount.value);
      const from = elements.fromCurrency.value;
      const to = elements.toCurrency.value;
  
      if (!amount || !from || !to) {
        alert("Please fill all fields");
        return;
      }
  
      showButtonLoading(true);
      await fetchRates(from);
      const rate = currentRates[to];
      const convertedAmount = (amount * rate).toFixed(2);
  
      elements.result.innerHTML = `
        <div class="conversion-result">
          <h4>${amount} ${from} = ${convertedAmount} ${to}</h4>
          <div class="rate-info">
            <span>1 ${from} = ${rate.toFixed(6)} ${to}</span>
            <span>1 ${to} = ${(1/rate).toFixed(6)} ${from}</span>
          </div>
        </div>
      `;
      showButtonLoading(false);
    }
  
    function showLoading(isLoading) {
      elements.loadingIndicator.style.display = isLoading ? 'block' : 'none';
    }
  
    function showButtonLoading(isLoading) {
      elements.convertText.classList.toggle('d-none', isLoading);
      elements.convertSpinner.classList.toggle('d-none', !isLoading);
      elements.convertBtn.disabled = isLoading;
    }
  });