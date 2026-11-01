const express = require("express");
const path = require("path");
const { open } = require("sqlite");
const sqlite3 = require("sqlite3");

const app = express();
app.use(express.json());

const dbPath = path.join(__dirname, "books.db");
const PORT = process.env.PORT || 3000;
let db = null;

const initializeDBAndServer = async () => {
  try {
    db = await open({ filename: dbPath, driver: sqlite3.Database });
    app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
    });
  } catch (error) {
    console.log(`DB Error: ${error.message}`);
    process.exit(1);
  }
};

initializeDBAndServer();

// GET all books
app.get("/books/", async (req, res) => {
  const books = await db.all("SELECT * FROM book ORDER BY id;");
  res.status(200).json(books);
});

// GET one book
app.get("/books/:bookId/", async (req, res) => {
  const { bookId } = req.params;
  const book = await db.get("SELECT * FROM book WHERE id = ?;", [bookId]);
  if (!book) {
    return res.status(404).json({ error: "Book not found" });
  }
  res.status(200).json(book);
});

// POST add a book
app.post("/books/", async (req, res) => {
  const { title, author, price, pages } = req.body;
  const result = await db.run(
    "INSERT INTO book (title, author, price, pages) VALUES (?, ?, ?, ?);",
    [title, author, price, pages]
  );
  res.status(201).json({ message: "Book added", bookId: result.lastID });
});

// PUT update a book
app.put("/books/:bookId/", async (req, res) => {
  const { bookId } = req.params;
  const { title, author, price, pages } = req.body;
  const result = await db.run(
    "UPDATE book SET title = ?, author = ?, price = ?, pages = ? WHERE id = ?;",
    [title, author, price, pages, bookId]
  );
  if (result.changes === 0) {
    return res.status(404).json({ error: "Book not found" });
  }
  res.status(200).json({ message: "Book updated" });
});

// DELETE a book
app.delete("/books/:bookId/", async (req, res) => {
  const { bookId } = req.params;
  const result = await db.run("DELETE FROM book WHERE id = ?;", [bookId]);
  if (result.changes === 0) {
    return res.status(404).json({ error: "Book not found" });
  }
  res.status(200).json({ message: "Book deleted" });
});