# Project FRIDA0: Anti-Fraud Pipeline

**Internship Project | 2-Day Sprint**

Your task is to build a transaction processing engine that ingests e-commerce data, enriches it with security metadata, and applies automated fraud-detection logic.

## Tech Stack

* **Language:** JavaScript (Node.js)
* **Framework:** [Express](https://expressjs.com/)
* **Database:** [SQLite](https://sqlite.org/index.html) (via `better-sqlite3`)

---

## Phase 1: Data Architecture & Ingestion

**Goal:** Establish the "source of truth" and move data from API to Database.

### Task 1: The Data Models

Define your schema. You will need to handle two primary entities:

* **Transaction:** `transaction_id`, `customerId`, `priceInEuro`, `currency`, `timestamp`, `token` (for fingerprinting), `fraud_score`, `fraudStatus` (Enum: `Fraud`, `NoFraud`, or `null`).
* **Address (Nested/Related):** `street`, `houseNumber`, `zipCode`, `city`, `country`.
> *Pro-tip: Since we are using SQLite, decide if you want to store the Address as a separate table with a Foreign Key or as a JSON string in the Transaction table.*


### Task 2: Ingestor API (POST)

Build an endpoint `POST /transactions` that accepts a JSON payload, validates the data, and saves it to your SQLite database.

### Task 3: Retrieval API (GET)

Build an endpoint `GET /transactions` that returns all stored transactions from the database.

### Task 4: The Simple UI

Create a simple `index.html` file. Use a standard HTML `<table>` and the `fetch()` API to display the current state of your database.

* **Note:** Don't spend time on CSS.

---

## Phase 2: The Enrichment Layer

**Goal:** Use incoming data to "detect" hidden information about the user's device.

### Task 5: Device Fingerprint Service

Build an internal service (or a mock API route) that takes a `token` and returns:

* `deviceId`: A unique string identifier. the mock API should return random value out of the three values {`device1`, `device2`, `device3`}
* `vpnDetected`: A boolean. the mock API should return vpn_detected = true if token = 'token_vpn_botnet', false otherwise


### Task 6: Enrichment Integration

Update your Ingestor logic. For every new transaction:

1. Extract the `token`.
2. Call your Fingerprint Service.
3. Update the database record with the returned `deviceId` and `vpnDetected` status.

---

## Phase 3: The Intelligence Engine

**Goal:** Implement the business logic to identify high-risk activity.

### Task 7: Fraud Scoring Service

Create a service that calculates a `risk_score` (0-100) based on these rules:

* **Rule A:** If `vpnDetected` is `true`, add **30 points**.
* **Rule B:** If the `deviceId` has been associated with more than **3 different** `customerId`s in the last 24 hours, add **50 points**.

### Task 8: Automated Labeling

After scoring is calculated, apply the following labels to the `fraudStatus` field:

* **Risk Score > 80:** Set to `Fraud`.
* **Risk Score < 20:** Set to `NoFraud`.
* **Otherwise:** Leave as `null` (Pending Review).

### Task 9: Final Pipeline Sync

Ensure your `POST /transactions` flow now executes everything in order:
`Save` $\rightarrow$ `Enrich` $\rightarrow$ `Score` $\rightarrow$ `Label` $\rightarrow$ `Final DB Update`.

---

## Bonus Task (If you finish early)

**API Rate Limiting:**
Implement a safety mechanism to prevent spam. If a single `customerId` attempts to post more than **5 transactions per minute**, return a `429 Too Many Requests` error.


## Sample JSON Payload

```JSON
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
}
```