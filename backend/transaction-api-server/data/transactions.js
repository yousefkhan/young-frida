const transactions = [
  // {
  //   id: 1,
  //   date: '2024-01-15',
  //   order: { priceInEuro: 24.50, items: ['Coffee', 'Sandwich'] },
  //   customer: { firstName: 'Anna', lastName: 'Lee' },
  //   address: { city: 'Berlin', country: 'Germany' }
  // },
  // {
  //   id: 2,
  //   date: '2024-01-16',
  //   order: { priceInEuro: 12.00, items: ['Lunch'] },
  //   customer: { firstName: 'Bob', lastName: 'Smith' },
  //   address: { city: 'Paris', country: 'France' }
  // },
  // {
  //   id: 3,
  //   date: '2024-01-17',
  //   order: { priceInEuro: 89.00, items: ['Shoes', 'Socks'] },
  //   customer: { firstName: 'Clara', lastName: 'Jones' },
  //   address: { city: 'London', country: 'UK' }
  // },
  // {
  //   id: 4,
  //   date: '2024-01-18',
  //   order: { priceInEuro: 15.50, items: ['Book', 'Pen'] },
  //   customer: { firstName: 'David', lastName: 'Brown' },
  //   address: { city: 'Madrid', country: 'Spain' }
  // },
  // {
  //   id: 5,
  //   date: '2024-01-19',
  //   order: { priceInEuro: 45.00, items: ['Bus pass'] },
  //   customer: { firstName: 'Eva', lastName: 'Garcia' },
  //   address: { city: 'Amsterdam', country: 'Netherlands' }
  // }
  {
  "transaction_id": "tx_normal_001",
  "customerId": "user_789",
  "priceInEuro": 45.50,
  "currency": "EUR",
  "timestamp": "2026-03-16T10:00:00Z",
  "token": "token_safe_device",
  "address": {
    "street": "Main St",
    "houseNumber": "10",
    "zipCode": "10115",
    "city": "Berlin",
    "country": "Germany"
  }
} ,

{
  "transaction_id": "tx_normal_002",
  "customerId": "user_123",
  "priceInEuro": 45.50,
  "currency": "EUR",
  "timestamp": "2026-03-16T10:00:00Z",
  "token": "token_safe_device",
  "address": {
    "street": "Main St",
    "houseNumber": "10",
    "zipCode": "10115",
    "city": "Berlin",
    "country": "Germany"
  }
},
];
export default transactions

curl -X POST http://localhost:3000/api/complete-transaction \
     -H "Content-Type: application/json" \
     -d '{
          "transaction_id": "tx_normal_001",
          "customerId": "user_888",
          "priceInEuro": 500.00,
          "currency": "EUR",
          "timestamp": "2026-03-16T15:00:00Z",
          "token": "token_vpn_botnet",
          "address": { "street": "Unknown", "houseNumber": 0, "zipCode": "00000", "city": "ProxyCity", "country": "VPN" }
        }'

curl -X POST http://localhost:3000/api/complete-transaction \
     -H "Content-Type: application/json" \
     -d '{
          "transaction_id": "tx_normal_001",
          "customerId": "user_821",
          "priceInEuro": 50.00,
          "currency": "EUR",
          "timestamp": "2026-03-16T15:45:34Z",
          "token": "token_safe_device",
          "address": { "street": "Main St.", "houseNumber": 25, "zipCode": "23245", "city": "ProxyCity", "country": "VPN" }
        }'