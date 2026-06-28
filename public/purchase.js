const moneyFormatter = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD',
});

const numberFormatter = new Intl.NumberFormat('en-US', {
  maximumFractionDigits: 6,
});

const symbolInput = document.getElementById('symbol');
const unitsInput = document.getElementById('units');
const totalInput = document.getElementById('purchasePrice');
const quotePrice = document.getElementById('quote-price');
const quoteMeta = document.getElementById('quote-meta');
const formMessage = document.getElementById('form-message');
const purchaseButton = document.getElementById('purchase-btn');
const suggestionsList = document.getElementById('symbol-suggestions');
const ownedHint = document.getElementById('owned-hint');
const stockList = document.getElementById('stock-list');
const stocksStatus = document.getElementById('stocks-status');
const refreshStocksButton = document.getElementById('refresh-stocks-btn');

let activeQuote = null;
let quoteRequestId = 0;
let searchRequestId = 0;
let lookupTimer = null;
let holdings = new Map();

symbolInput.addEventListener('input', () => {
  const symbol = normalizeSymbol(symbolInput.value);
  symbolInput.value = symbol;
  formMessage.textContent = '';
  formMessage.classList.add('form-error');
  formMessage.classList.remove('form-success');

  clearTimeout(lookupTimer);

  if (!symbol) {
    activeQuote = null;
    renderEmptyQuote();
    hideSuggestions();
    updateOwnedHint('');
    return;
  }

  lookupTimer = setTimeout(() => {
    handleQuoteLookup(symbol);
    fetchSuggestions(symbol);
  }, 250);
});

symbolInput.addEventListener('keydown', (event) => {
  if (event.key === 'Escape') {
    hideSuggestions();
  }
});

symbolInput.addEventListener('blur', () => {
  setTimeout(hideSuggestions, 150);
});

unitsInput.addEventListener('input', updateTotal);
refreshStocksButton.addEventListener('click', loadPopularStocks);

document.getElementById('purchase-form').addEventListener('submit', async (event) => {
  event.preventDefault();

  const symbol = normalizeSymbol(symbolInput.value);
  const units = Number(unitsInput.value);

  if (!symbol) {
    showError('Enter a NASDAQ symbol.');
    return;
  }

  if (!Number.isFinite(units) || units <= 0) {
    showError('Enter a positive number of shares.');
    return;
  }

  try {
    purchaseButton.disabled = true;
    formMessage.textContent = '';

    if (!activeQuote || activeQuote.symbol !== symbol) {
      activeQuote = await fetchQuote(symbol);
      renderQuote(activeQuote);
    }

    const response = await fetch('/api/portfolio', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ symbol, units }),
    });
    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || 'Unable to buy stock');
    }

    formMessage.classList.remove('form-error');
    formMessage.classList.add('form-success');
    formMessage.textContent = data.message || `${symbol} was added to your portfolio.`;
    symbolInput.value = '';
    unitsInput.value = '1';
    activeQuote = null;
    renderEmptyQuote();
    hideSuggestions();
    updateOwnedHint('');
    await loadHoldings();
  } catch (error) {
    showError(error.message);
  } finally {
    purchaseButton.disabled = false;
  }
});

async function handleQuoteLookup(rawSymbol) {
  const symbol = normalizeSymbol(rawSymbol !== undefined ? rawSymbol : symbolInput.value);

  if (!symbol) {
    activeQuote = null;
    renderEmptyQuote();
    return;
  }

  updateOwnedHint(symbol);

  const requestId = ++quoteRequestId;
  quoteMeta.textContent = 'Looking up latest quote...';

  try {
    const quote = await fetchQuote(symbol);
    if (requestId !== quoteRequestId) {
      return;
    }

    activeQuote = quote;
    renderQuote(quote);
  } catch (error) {
    if (requestId !== quoteRequestId) {
      return;
    }

    activeQuote = null;
    quotePrice.textContent = '$0.00';
    quoteMeta.textContent = error.message;
    updateTotal();
  }
}

async function fetchSuggestions(query) {
  const requestId = ++searchRequestId;

  try {
    const response = await fetch(`/api/search?q=${encodeURIComponent(query)}`);
    const data = await response.json();

    if (requestId !== searchRequestId || normalizeSymbol(symbolInput.value) !== query) {
      return;
    }

    renderSuggestions(data.results || []);
  } catch (error) {
    hideSuggestions();
  }
}

function renderSuggestions(results) {
  if (!results.length) {
    hideSuggestions();
    return;
  }

  suggestionsList.innerHTML = results.map((item) => {
    const owned = holdings.has(item.symbol);
    return `
      <li role="option">
        <button type="button" data-symbol="${escapeHtml(item.symbol)}">
          <span class="suggestion-symbol">${escapeHtml(item.symbol)}${owned ? '<span class="owned-badge">Owned</span>' : ''}</span>
          <span class="suggestion-name">${escapeHtml(item.description)}</span>
        </button>
      </li>
    `;
  }).join('');

  suggestionsList.hidden = false;
  symbolInput.setAttribute('aria-expanded', 'true');

  suggestionsList.querySelectorAll('button[data-symbol]').forEach((button) => {
    button.addEventListener('click', () => selectSymbol(button.dataset.symbol));
  });
}

function hideSuggestions() {
  suggestionsList.hidden = true;
  suggestionsList.innerHTML = '';
  symbolInput.setAttribute('aria-expanded', 'false');
}

function selectSymbol(symbol) {
  const normalized = normalizeSymbol(symbol);
  symbolInput.value = normalized;
  formMessage.textContent = '';
  hideSuggestions();
  clearTimeout(lookupTimer);
  handleQuoteLookup(normalized);
}

async function loadPopularStocks() {
  try {
    refreshStocksButton.disabled = true;
    stocksStatus.textContent = 'Loading stocks...';

    const response = await fetch('/api/stocks/popular');
    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || 'Unable to load stocks');
    }

    renderStockList(data.stocks || []);
    stocksStatus.textContent = '';
  } catch (error) {
    stocksStatus.textContent = error.message;
    stockList.innerHTML = '';
  } finally {
    refreshStocksButton.disabled = false;
  }
}

function renderStockList(stocks) {
  if (!stocks.length) {
    stockList.innerHTML = '';
    return;
  }

  stockList.innerHTML = stocks.map((stock) => {
    const changeClass = stock.change >= 0 ? 'gain' : 'loss';
    const sign = stock.change >= 0 ? '+' : '';
    const owned = holdings.get(stock.symbol);

    return `
      <li>
        <button type="button" class="stock-row" data-symbol="${escapeHtml(stock.symbol)}">
          <span class="stock-row-main">
            <strong>${escapeHtml(stock.symbol)}</strong>
            ${owned ? `<span class="owned-badge">${numberFormatter.format(owned)} owned</span>` : ''}
          </span>
          <span class="stock-row-price">
            <strong>${moneyFormatter.format(stock.price || 0)}</strong>
            <span class="${changeClass}">${sign}${moneyFormatter.format(stock.change || 0)} (${sign}${stock.changePercent}%)</span>
          </span>
        </button>
      </li>
    `;
  }).join('');

  stockList.querySelectorAll('button[data-symbol]').forEach((button) => {
    button.addEventListener('click', () => selectSymbol(button.dataset.symbol));
  });
}

async function loadHoldings() {
  try {
    const response = await fetch('/api/portfolio');
    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || 'Unable to load portfolio');
    }

    holdings = new Map((data.portfolio || []).map((stock) => [stock.symbol, stock.units]));
    updateOwnedHint(normalizeSymbol(symbolInput.value));
    await loadPopularStocks();
  } catch (error) {
    holdings = new Map();
    await loadPopularStocks();
  }
}

function updateOwnedHint(symbol) {
  const ownedUnits = symbol ? holdings.get(symbol) : undefined;

  if (ownedUnits) {
    ownedHint.hidden = false;
    ownedHint.textContent = `You already own ${numberFormatter.format(ownedUnits)} share(s) of ${symbol}. Buying more will be added to this position and update your average cost.`;
    purchaseButton.textContent = 'Buy More';
  } else {
    ownedHint.hidden = true;
    ownedHint.textContent = '';
    purchaseButton.textContent = 'Buy Stock';
  }
}

async function fetchQuote(symbol) {
  const response = await fetch(`/api/quote/${encodeURIComponent(symbol)}`);
  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.message || 'No quote found for this symbol');
  }

  return data;
}

function renderQuote(quote) {
  quotePrice.textContent = moneyFormatter.format(quote.price);
  quoteMeta.textContent = `${quote.symbol} ${quote.change >= 0 ? '+' : ''}${moneyFormatter.format(quote.change)} (${quote.changePercent}%) today`;
  updateTotal();
}

function renderEmptyQuote() {
  quotePrice.textContent = '$0.00';
  quoteMeta.textContent = 'Enter a symbol to preview the current price.';
  updateTotal();
}

function updateTotal() {
  const units = Number(unitsInput.value);
  const price = activeQuote ? activeQuote.price : 0;
  const total = Number.isFinite(units) && units > 0 ? units * price : 0;
  totalInput.value = moneyFormatter.format(total);
}

function normalizeSymbol(symbol) {
  return String(symbol || '').trim().toUpperCase();
}

function showError(message) {
  formMessage.classList.add('form-error');
  formMessage.classList.remove('form-success');
  formMessage.textContent = message;
}

function escapeHtml(value) {
  return String(value).replace(/[&<>"']/g, (character) => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;',
  }[character]));
}

loadHoldings();
