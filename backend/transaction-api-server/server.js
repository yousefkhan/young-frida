import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import sqlite3 from "sqlite3";
import { execute } from "./sql.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());

// Shared Database Connection
const db = new sqlite3.Database("frida0.db");

// Helper: Fingerprint Service
function getDeviceFingerprint(token) {
  const devices = ['device1', 'device2', 'device3'];
  const randomDevice = devices[Math.floor(Math.random() * devices.length)];
  const vpnStatus = (token === 'token_vpn_botnet') ? 1 : 0;
  return { deviceId: randomDevice, vpnDetected: vpnStatus };
}

// Helper: Fraud Scoring Service
async function calculateFraudScore(deviceId, vpnDetected) {
  let score = 0;
  if (vpnDetected === 1) score += 30;

  const velocityQuery = `
    SELECT COUNT(DISTINCT customerId) as count 
    FROM transactions 
    WHERE deviceId = ? 
    AND timestamp > datetime('now', '-24 hours')
  `;

  return new Promise((resolve, reject) => {
    db.get(velocityQuery, [deviceId], (err, row) => {
      if (err) return reject(err);
      if (row && row.count >= 3) score += 50;
      resolve(Math.min(score, 100));
    });
  });
}

// Initialize Database
const main = async () => {
  try {
    await execute(db, `
      PRAGMA foreign_keys = ON;

      CREATE TABLE IF NOT EXISTS address (
        customerId TEXT PRIMARY KEY,
        street TEXT NOT NULL,
        houseNumber INTEGER NOT NULL,
        zipCode TEXT NOT NULL,  
        city TEXT NOT NULL,
        country TEXT NOT NULL      
      );

      CREATE TABLE IF NOT EXISTS transactions (
        transaction_id TEXT PRIMARY KEY,
        customerId TEXT,
        vpnDetected INTEGER,
        deviceId TEXT,
        price REAL NOT NULL,
        currency TEXT NOT NULL,
        timestamp TEXT NOT NULL,
        token TEXT,
        FOREIGN KEY(customerId) REFERENCES address(customerId)
      );

      CREATE TABLE IF NOT EXISTS fraud_data (
        customerId TEXT NOT NULL,
        transaction_id TEXT NOT NULL,
        fraud_score REAL NOT NULL,
        fraud_status INTEGER, -- Removed NOT NULL to allow NULL (Pending Review)
        FOREIGN KEY(customerId) REFERENCES address(customerId),
        FOREIGN KEY(transaction_id) REFERENCES transactions(transaction_id),
        PRIMARY KEY (customerId, transaction_id)
      );
    `);
    console.log("Database tables initialized.");
  } catch (error) {
    console.error("Initialization Error:", error);
  }
};
main();

app.use((req, res, next) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  next();
});

// --- ROUTES ---

// 1. GET Transactions (Dashboard)
app.get('/api/transactions', (_req, res) => {
  const sql = `
    SELECT 
      t.deviceId, t.vpnDetected, t.token, t.transaction_id, 
      t.price, t.currency, t.timestamp,
      a.customerId, a.street, a.houseNumber, a.zipCode, a.city, a.country,
      f.fraud_score, f.fraud_status
    FROM transactions t
    JOIN address a ON t.customerId = a.customerId  
    LEFT JOIN fraud_data f ON t.transaction_id = f.transaction_id
  `;

  db.all(sql, [], (err, rows) => {
    if (err) {
      console.error("SQL Error:", err.message);
      return res.status(500).json({ error: err.message });
    }
    res.json(rows);
  });
});

app.post('/api/complete-transaction', async (req, res) => {
  const {
    token,
    customerId,
    priceInEuro,
    currency,
    timestamp,
    transaction_id,
    address
  } = req.body;

  const { street, houseNumber, zipCode, city, country } = address || {};

  if (!customerId || !transaction_id) {
    return res.status(400).json({ error: "Missing customerId or transaction_id" });
  }

  // 2. Enrichment & Scoring
  const securityProfile = getDeviceFingerprint(token);
  
  let calculatedScore = 0; 
  try {
    calculatedScore = await calculateFraudScore(securityProfile.deviceId, securityProfile.vpnDetected);
  } catch (err) {
    console.error("Fraud Service Error:", err);
    calculatedScore = 0; 
  }

  // 3. Threshold Logic
  let calculatedStatus = null; 
  if (calculatedScore >= 80) {
    calculatedStatus = 1; 
  } else if (calculatedScore < 20) {
    calculatedStatus = 0; 
  }

  db.serialize(() => {
    db.run("BEGIN TRANSACTION");

    // Address Insert
    db.run(`INSERT OR IGNORE INTO address (customerId, street, houseNumber, zipCode, city, country) VALUES (?, ?, ?, ?, ?, ?)`,
      [customerId, street, houseNumber, zipCode, city, country]);

    // Transaction Insert (8 columns, 8 placeholders)
    const sqlTrans = `INSERT INTO transactions (transaction_id, customerId, price, currency, timestamp, token, deviceId, vpnDetected) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`;
    db.run(sqlTrans, [
      transaction_id, 
      customerId, 
      priceInEuro, 
      currency, 
      timestamp, 
      token, 
      securityProfile.deviceId, 
      securityProfile.vpnDetected
    ]);

    const sqlFraud = `INSERT INTO fraud_data (customerId, transaction_id, fraud_score, fraud_status) VALUES (?, ?, ?, ?)`;
    db.run(sqlFraud, [customerId, transaction_id, calculatedScore, calculatedStatus], (err) => {
      if (err) {
        console.error("Error during inserts:", err.message);
        db.run("ROLLBACK");
        return res.status(500).json({ error: err.message });
      }

      db.run("COMMIT");
      res.status(201).json({
        message: "Transaction processed successfully",
        transaction_id,
        fraud_score: calculatedScore,
        status: calculatedStatus === 1 ? "Fraud" : calculatedStatus === 0 ? "Safe" : "Pending"
      });
    });
  });
});
app.use(express.static(path.join(__dirname, '..', '..', 'frontend')));

app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});