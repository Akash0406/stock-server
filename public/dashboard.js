const moneyFormatter = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD',
});

const numberFormatter = new Intl.NumberFormat('en-US', {
  maximumFractionDigits: 6,
});

const totalValueElement = document.getElementById('total-value');
const totalProfitLossElement = document.getElementById('total-profit-loss');
const positionCountElement = document.getElementById('position-count');
const lastUpdatedElement = document.getElementById('last-updated');
const statusMessageElement = document.getElementById('status-message');
const portfolioRowsElement = document.getElementById('portfolio-rows');
const refreshButton = document.getElementById('refresh-btn');
const modal = document.getElementById('sell-modal');
const sellForm = document.getElementById('sell-form');
const sellError = document.getElementById('sell-error');

let selectedStock = null;

refreshButton.addEventListener('click', fetchPortfolioData);
document.getElementById('cancel-btn').addEventListener('click', closeSellModal);
document.getElementById('close-modal-btn').addEventListener('click', closeSellModal);
modal.addEventListener('click', (event) => {
  if (event.target === modal) {
    closeSellModal();
  }
});

sellForm.addEventListener('submit', async (event) => {
  event.preventDefault();

  if (!selectedStock) {
    return;
  }

  const unitsToSell = Number(document.getElementById('sell-units').value);
  if (!Number.isFinite(unitsToSell) || unitsToSell <= 0) {
    sellError.textContent = 'Enter a positive number of shares.';
    return;
  }

  if (unitsToSell > selectedStock.units) {
    sellError.textContent = 'You cannot sell more shares than you own.';
    return;
  }

  try {
    sellError.textContent = '';
    const response = await fetch('/api/portfolio/sell', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ symbol: selectedStock.symbol, unitsToSell }),
    });
    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || 'Unable to sell stock');
    }

    closeSellModal();
    await fetchPortfolioData();
  } catch (error) {
    sellError.textContent = error.message;
  }
});

async function fetchPortfolioData() {
  try {
    statusMessageElement.textContent = 'Loading portfolio...';
    refreshButton.disabled = true;

    const response = await fetch('/api/portfolio');
    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || 'Unable to load portfolio');
    }

    renderSummary(data);
    renderPortfolio(data.portfolio || []);
    statusMessageElement.textContent = '';
    lastUpdatedElement.textContent = `Updated ${new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
  } catch (error) {
    statusMessageElement.textContent = error.message;
    portfolioRowsElement.innerHTML = '';
  } finally {
    refreshButton.disabled = false;
  }
}

function renderSummary(data) {
  const totalValue = Number(data.totalValueNow || 0);
  const totalProfitLoss = Number(data.totalProfitLoss || 0);

  totalValueElement.textContent = moneyFormatter.format(totalValue);
  totalProfitLossElement.textContent = moneyFormatter.format(totalProfitLoss);
  totalProfitLossElement.classList.toggle('gain', totalProfitLoss >= 0);
  totalProfitLossElement.classList.toggle('loss', totalProfitLoss < 0);
}

function renderPortfolio(portfolio) {
  positionCountElement.textContent = `${portfolio.length} ${portfolio.length === 1 ? 'position' : 'positions'}`;

  if (!portfolio.length) {
    portfolioRowsElement.innerHTML = `
      <tr>
        <td colspan="6" class="empty-state">No stocks yet. Use Buy Stock to add your first position.</td>
      </tr>
    `;
    return;
  }

  portfolioRowsElement.innerHTML = portfolio.map((stock) => {
    const profitLoss = Number(stock.profitLoss || 0);
    const profitLossClass = profitLoss >= 0 ? 'gain' : 'loss';
    const purchaseDate = stock.purchaseDate
      ? new Date(stock.purchaseDate).toLocaleDateString()
      : 'Unknown date';

    return `
      <tr>
        <td class="symbol-cell">
          <strong>${escapeHtml(stock.symbol)}</strong>
          <span>Purchased ${purchaseDate}</span>
        </td>
        <td>
          <strong>${moneyFormatter.format(stock.currentValue || 0)}</strong>
          <div class="subtle">${moneyFormatter.format(stock.currentPrice || 0)} / share</div>
        </td>
        <td>${numberFormatter.format(stock.units || 0)}</td>
        <td>${moneyFormatter.format(stock.unitPrice || 0)}</td>
        <td class="${profitLossClass}">${moneyFormatter.format(profitLoss)}</td>
        <td>
          <button class="button button-secondary" type="button" data-symbol="${escapeHtml(stock.symbol)}">Sell</button>
        </td>
      </tr>
    `;
  }).join('');

  portfolioRowsElement.querySelectorAll('button[data-symbol]').forEach((button) => {
    button.addEventListener('click', () => {
      const stock = portfolio.find((item) => item.symbol === button.dataset.symbol);
      openSellModal(stock);
    });
  });
}

function openSellModal(stock) {
  selectedStock = stock;
  sellError.textContent = '';
  document.getElementById('stock-symbol').textContent = stock.symbol;
  document.getElementById('stock-units').textContent = numberFormatter.format(stock.units);
  document.getElementById('stock-price').textContent = moneyFormatter.format(stock.currentPrice);
  document.getElementById('sell-units').value = '';
  document.getElementById('sell-units').max = stock.units;
  modal.hidden = false;
  document.getElementById('sell-units').focus();
}

function closeSellModal() {
  selectedStock = null;
  modal.hidden = true;
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

fetchPortfolioData();
