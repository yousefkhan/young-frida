async function fetchTransactions() {
  const tableBody = document.querySelector('#transactionTable tbody');

  try {
    const response = await fetch('/api/transactions');
    const data = await response.json();

    tableBody.innerHTML = '';

    if (data.length === 0) {
      tableBody.innerHTML = '<tr><td colspan="5">No transactions found.</td></tr>';
      return;
    }

    data.forEach(tx => {
      const row = document.createElement('tr');

      const statusText = tx.fraud_status == 1 ? ' Fraud' : ' Safe';
      const statusClass = tx.fraud_status == 1 ? 'status-fraud' : 'status-safe';

      row.innerHTML = `
    <td>${tx.transaction_id}</td>
    <td>${tx.customerId}</td> 
    <td>${tx.country}</td> 
    <td>${tx.street} ${tx.houseNumber}, ${tx.city}</td>
    <td>${tx.price.toFixed(2)} ${tx.currency}</td>
    <td>${tx.fraud_score}</td>
    <td class="${statusClass}">${statusText}</td>
`;
      tableBody.appendChild(row);
    });

  } catch (error) {
    console.error('Error fetching data:', error);
    tableBody.innerHTML = '<tr><td colspan="5" style="color:red">Failed to load data. Check console.</td></tr>';
  }
}

// Event listener for the refresh button
document.getElementById('refreshBtn').addEventListener('click', fetchTransactions);

// Initial load
fetchTransactions();