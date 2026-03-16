const express = require('express');
const path = require('path');
const transactions = require('./data/transactions');

const app = express();
const PORT = process.env.PORT || 3000;

app.use((req, res, next) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  next();
});

app.get('/api/transactions', (req, res) => {
  res.json(transactions);
});

app.use(express.static(path.join(__dirname, '..', '..', 'frontend')));

app.listen(PORT, () => {
  console.log('Server running at http://localhost:' + PORT);
});
