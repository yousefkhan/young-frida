console.log("Node.js + SQLite");

import sqlite3 from "sqlite3";

const db = new sqlite3.Database("frida0.db" , sqlite3.OPEN_CREATE | sqlite3.OPEN_READWRITE)
export const execute = async (db, sql) => {
  return new Promise((resolve, reject) => {
    db.exec(sql, (err) => {
      if (err) reject(err);
      resolve();
    });
  });
};;

export default db;