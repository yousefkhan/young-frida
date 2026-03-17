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

const db = new sqlite3.Database("frida0.db");

/**
 * ENRICHMENT LOGIC
 */
function getDeviceFingerprint(token, userId) {
  if (!userId || typeof userId !== 'string') {
    let vpnDetected;
    if (token === 'token_vpn_botnet') {
      vpnDetected = 1;
    } else {
      vpnDetected = 0;
    }
    return { deviceId: 'device_unknown', vpnDetected: vpnDetected };
  }

  const match = userId.match(/\d+/);
  const num = match ? parseInt(match[0], 10) : 0;

  let deviceId;
  if (num % 3 === 0) {
    deviceId = 'device3';
  } else if (num % 2 === 0) {
    deviceId = 'device2';
  } else {
    deviceId = 'device1';
  }

  let vpnStatus;
  if (token === 'token_vpn_botnet') {
    vpnStatus = 1;
  } else {
    vpnStatus = 0;
  }
  
  return { deviceId, vpnDetected: vpnStatus };
}

/**
 * SCORING LOGIC
 */
async function calculateFraudScore(deviceId, vpnDetected) {
  let score = 0;
  if (vpnDetected === 1) {
    score += 30;
  }

  // WRAPPER: datetime(timestamp) ensures ISO strings compare correctly
  const velocityQuery = `
    SELECT COUNT(DISTINCT customerId) as count 
    FROM transactions 
    WHERE deviceId = ? 
    AND datetime(timestamp) > datetime('now', '-24 hours')
  `;

  return new Promise((resolve, reject) => {
    db.get(velocityQuery, [deviceId], (err, row) => {
      if (err) {
        return reject(err);
      }
      if (row && row.count > 3) {
        score += 50;
      }
      resolve(Math.min(score, 100));
    });
  });
}

const initDB = async () => {
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
        fraud_status INTEGER, 
        FOREIGN KEY(customerId) REFERENCES address(customerId),
        FOREIGN KEY(transaction_id) REFERENCES transactions(transaction_id),
        PRIMARY KEY (customerId, transaction_id)
      );
    `);
    console.log("Database initialized.");
  } catch (error) {
    console.error("Initialization Error:", error);
  }
};
initDB();

app.use((req, res, next) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  next();
});

app.get('/api/transactions', (req, res) => {
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
      return res.status(500).json({ error: err.message });
    }
    res.json(rows);
  });
});

app.post('/api/complete-transaction', async (req, res) => {
  const { token, customerId, priceInEuro, currency, transaction_id, address } = req.body;
  const { street, houseNumber, zipCode, city, country } = address || {};
  const serverTimestamp = new Date().toISOString();

  if (!customerId || !transaction_id) {
    return res.status(400).json({ error: "Missing customerId or transaction_id" });
  }

  try {
    // --- STEP 0: RATE LIMITING (With datetime wrapper) ---
    const rateLimitCount = await new Promise((resolve, reject) => {
      const sql = `
        SELECT COUNT(*) as count 
        FROM transactions 
        WHERE customerId = ? 
        AND datetime(timestamp) > datetime('now', '-1 minute')
      `;
      db.get(sql, [customerId], (err, row) => {
        if (err) {
          reject(err);
        } else {
          let count;
          if (row) {
            count = row.count;
          } else {
            count = 0;
          }
          resolve(count);
        }
      });
    });

    if (rateLimitCount >= 5) {
      return res.status(429).json({ 
        error: "Too Many Requests", 
        message: "Limit: 5 transactions per minute." 
      });
    }

    // --- STEP 1: SAVE ---
    await new Promise((resolve, reject) => {
      db.serialize(() => {
        db.run("INSERT OR IGNORE INTO address (customerId, street, houseNumber, zipCode, city, country) VALUES (?, ?, ?, ?, ?, ?)",
          [customerId, street, houseNumber, zipCode, city, country]);
        db.run("INSERT INTO transactions (transaction_id, customerId, price, currency, timestamp, token) VALUES (?, ?, ?, ?, ?, ?)",
          [transaction_id, customerId, priceInEuro, currency, serverTimestamp, token], (err) => {
            if (err) {
              reject(err);
            } else {
              resolve();
            }
          });
      });
    });

    // --- STEP 2: ENRICH ---
    const securityProfile = getDeviceFingerprint(token, customerId);
    await new Promise((resolve, reject) => {
      db.run(`UPDATE transactions SET deviceId = ?, vpnDetected = ? WHERE transaction_id = ?`,
        [securityProfile.deviceId, securityProfile.vpnDetected, transaction_id], (err) => {
          if (err) {
            reject(err);
          } else {
            resolve();
          }
        });
    });

    // --- STEP 3: SCORE ---
    const calculatedScore = await calculateFraudScore(securityProfile.deviceId, securityProfile.vpnDetected);
    await new Promise((resolve, reject) => {
      db.run(`INSERT INTO fraud_data (customerId, transaction_id, fraud_score) VALUES (?, ?, ?)`,
        [customerId, transaction_id, calculatedScore], (err) => {
          if (err) {
            reject(err);
          } else {
            resolve();
          }
        });
    });

    // --- STEP 4: LABEL ---
    let calculatedStatus;
    if (calculatedScore >= 80) {
      calculatedStatus = 1;
    } else if (calculatedScore < 20) {
      calculatedStatus = 0;
    } else {
      calculatedStatus = null;
    }

    // --- STEP 5: FINAL UPDATE ---
    await new Promise((resolve, reject) => {
      db.run(`UPDATE fraud_data SET fraud_status = ? WHERE transaction_id = ?`,
        [calculatedStatus, transaction_id], (err) => {
          if (err) {
            reject(err);
          } else {
            resolve();
          }
        });
    });

    let statusLabel;
    if (calculatedStatus === 1) {
      statusLabel = "Fraud";
    } else if (calculatedStatus === 0) {
      statusLabel = "Safe";
    } else {
      statusLabel = "Pending";
    }

    res.status(201).json({
      message: "Transaction processed successfully",
      transaction_id,
      fraud_score: calculatedScore,
      status: statusLabel
    });

  } catch (error) {
    console.error("Pipeline Error:", error);
    res.status(500).json({ error: "Transaction failed during processing." });
  }
});

app.use(express.static(path.join(__dirname, '..', '..', 'frontend')));
app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});