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

const ALLOWED_ORDER_BY = ["id", "title", "author", "price", "pages"];

const isNumeric = (value) =>
  value !== undefined && value !== null && value !== "" && !isNaN(Number(value));

const validateBook = (body) => {
  const { title, author, price, pages } = body || {};
  if (typeof title !== "string" || title.trim() === "") {
    return "title is required";
  }
  if (typeof author !== "string" || author.trim() === "") {
    return "author is required";
  }
  if (!isNumeric(price)) {
    return "price must be a number";
  }
  if (pages !== undefined && pages !== null && !isNumeric(pages)) {
    return "pages must be a number";
  }
  return null;
};

// GET all books with search, sort, price range and pagination
app.get("/books/", async (req, res) => {
  try {
    const {
      search_q = "",
      order_by = "id",
      order = "ASC",
      limit = 10,
      offset = 0,
      min_price = 0,
      max_price = 1000000,
    } = req.query;

    if (!ALLOWED_ORDER_BY.includes(order_by)) {
      return res.status(400).json({
        message: `order_by must be one of: ${ALLOWED_ORDER_BY.join(", ")}`,
      });
    }
    const orderDir = String(order).toUpperCase();
    if (orderDir !== "ASC" && orderDir !== "DESC") {
      return res.status(400).json({ message: "order must be ASC or DESC" });
    }
    if (!isNumeric(limit) || Number(limit) < 1) {
      return res.status(400).json({ message: "limit must be a positive number" });
    }
    if (!isNumeric(offset) || Number(offset) < 0) {
      return res.status(400).json({ message: "offset must be 0 or more" });
    }
    if (!isNumeric(min_price) || !isNumeric(max_price)) {
      return res.status(400).json({ message: "min_price and max_price must be numbers" });
    }

    // order_by and orderDir are checked against a whitelist above,
    // so it is safe to place them in the SQL text.
    const query = `
      SELECT * FROM book
      WHERE title LIKE ? AND price BETWEEN ? AND ?
      ORDER BY ${order_by} ${orderDir}
      LIMIT ? OFFSET ?;`;

    const books = await db.all(query, [
      `%${search_q}%`,
      Number(min_price),
      Number(max_price),
      Number(limit),
      Number(offset),
    ]);
    res.status(200).json(books);
  } catch (error) {
    res.status(500).json({ message: "Internal server error" });
  }
});

// GET one book
app.get("/books/:bookId/", async (req, res) => {
  try {
    const { bookId } = req.params;
    if (!isNumeric(bookId)) {
      return res.status(400).json({ message: "bookId must be a number" });
    }
    const book = await db.get("SELECT * FROM book WHERE id = ?;", [bookId]);
    if (!book) {
      return res.status(404).json({ message: "Book not found" });
    }
    res.status(200).json(book);
  } catch (error) {
    res.status(500).json({ message: "Internal server error" });
  }
});

// POST add a book
app.post("/books/", async (req, res) => {
  try {
    const problem = validateBook(req.body);
    if (problem) {
      return res.status(400).json({ message: problem });
    }
    const { title, author, price, pages } = req.body;
    const result = await db.run(
      "INSERT INTO book (title, author, price, pages) VALUES (?, ?, ?, ?);",
      [title.trim(), author.trim(), Number(price), pages === undefined ? null : Number(pages)]
    );
    res.status(201).json({ message: "Book added", bookId: result.lastID });
  } catch (error) {
    res.status(500).json({ message: "Internal server error" });
  }
});

// PUT update a book
app.put("/books/:bookId/", async (req, res) => {
  try {
    const { bookId } = req.params;
    if (!isNumeric(bookId)) {
      return res.status(400).json({ message: "bookId must be a number" });
    }
    const problem = validateBook(req.body);
    if (problem) {
      return res.status(400).json({ message: problem });
    }
    const { title, author, price, pages } = req.body;
    const result = await db.run(
      "UPDATE book SET title = ?, author = ?, price = ?, pages = ? WHERE id = ?;",
      [title.trim(), author.trim(), Number(price), pages === undefined ? null : Number(pages), bookId]
    );
    if (result.changes === 0) {
      return res.status(404).json({ message: "Book not found" });
    }
    res.status(200).json({ message: "Book updated" });
  } catch (error) {
    res.status(500).json({ message: "Internal server error" });
  }
});

// DELETE a book
app.delete("/books/:bookId/", async (req, res) => {
  try {
    const { bookId } = req.params;
    if (!isNumeric(bookId)) {
      return res.status(400).json({ message: "bookId must be a number" });
    }
    const result = await db.run("DELETE FROM book WHERE id = ?;", [bookId]);
    if (result.changes === 0) {
      return res.status(404).json({ message: "Book not found" });
    }
    res.status(200).json({ message: "Book deleted" });
  } catch (error) {
    res.status(500).json({ message: "Internal server error" });
  }
});

// Unknown routes
app.use((req, res) => {
  res.status(404).json({ message: "Route not found" });
});

// Bad JSON body and other errors
app.use((err, req, res, next) => {
  if (err.type === "entity.parse.failed") {
    return res.status(400).json({ message: "Invalid JSON body" });
  }
  res.status(500).json({ message: "Internal server error" });
});