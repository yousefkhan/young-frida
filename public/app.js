const tbody = document.getElementById('table-body');

fetch('/api/transactions')
  .then(res => res.json())
  .then(data => {
    tbody.innerHTML = data
      .map(t => {
        const customer = `${t.customer.firstName} ${t.customer.lastName}`;
        const items = t.order.items.join(', ');
        return `
          <tr>
            <td>${t.id}</td>
            <td>${t.date}</td>
            <td>${t.order.priceInEuro}</td>
            <td>${items}</td>
            <td>${customer}</td>
            <td>${t.address.city}</td>
            <td>${t.address.country}</td>
          </tr>
        `;
      })
      .join('');
  })
  .catch(() => {
    tbody.innerHTML = '<tr><td colspan="7">Failed to load transactions.</td></tr>';
  });
