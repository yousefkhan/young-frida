async function fetchTransactions() {
  const tableBody = document.querySelector('#transactionTable tbody');

  try {
    const response = await fetch('/api/transactions');
    const data = await response.json();

    tableBody.innerHTML = '';

    if (data.length === 0) {
      tableBody.innerHTML = '<tr><td colspan="7">No transactions found.</td></tr>';
      return;
    }

    data.forEach(tx => {
      let statusText;
      let statusClass;

      if (tx.fraud_status === 1) {
        statusText = 'Fraud';
        statusClass = 'status-fraud';
      } else if (tx.fraud_status === 0) {
        statusText = 'Safe';
        statusClass = 'status-safe';
      } else {
        statusText = 'Pending';
        statusClass = 'status-pending';
      }

      let vpnText;
      if (tx.vpnDetected === 1) {
        vpnText = 'Yes';
      } else {
        vpnText = 'No';
      }

      const berlinTime = new Date(tx.timestamp).toLocaleString('de-DE', {
        timeZone: 'Europe/Berlin',
        hour12: false
      });

      const mainRow = document.createElement('tr');
      mainRow.className = 'clickable-row';
      mainRow.innerHTML = `
        <td>${tx.transaction_id}</td>
        <td>${tx.customerId}</td> 
        <td>${tx.country}</td> 
        <td>${tx.street} ${tx.houseNumber}</td>
        <td>${tx.price.toFixed(2)} ${tx.currency}</td>
        <td>${tx.fraud_score}</td>
        <td class="${statusClass}">${statusText}</td>
      `;

      const detailsRow = document.createElement('tr');
      detailsRow.className = 'details-row';
      detailsRow.style.display = 'none'; 
      detailsRow.innerHTML = `
        <td colspan="7">
          <div class="details-content">
            <strong>Full Parameters:</strong><br>
            <ul>
              <li><strong>Exact Timestamp (Berlin):</strong> ${berlinTime}</li>
              <li><strong>Device ID:</strong> ${tx.deviceId}</li>
              <li><strong>VPN Detected:</strong> ${vpnText}</li>
              <li><strong>Auth Token:</strong> <code>${tx.token}</code></li>
              <li><strong>Full Address:</strong> ${tx.street} ${tx.houseNumber}, ${tx.zipCode} ${tx.city}, ${tx.country}</li>
            </ul>
          </div>
        </td>
      `;

      mainRow.addEventListener('click', () => {
        if (detailsRow.style.display === 'none') {
          detailsRow.style.display = 'table-row';
        } else {
          detailsRow.style.display = 'none';
        }
      });

      tableBody.appendChild(mainRow);
      tableBody.appendChild(detailsRow);
    });

  } catch (error) {
    console.error('Error fetching data:', error);
    tableBody.innerHTML = '<tr><td colspan="7" style="color:red">Failed to load data.</td></tr>';
  }
}

document.getElementById('refreshBtn').addEventListener('click', fetchTransactions);
fetchTransactions();