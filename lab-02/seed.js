const sqlite3 = require("sqlite3");
const fs = require("fs");

const db = new sqlite3.Database("books.db");
db.exec(fs.readFileSync("seed.sql", "utf8"), (err) => {
  console.log(err ? err.message : "Database seeded");
  db.close();
});