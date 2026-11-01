CREATE TABLE IF NOT EXISTS book (
  id INTEGER PRIMARY KEY,
  title TEXT,
  author TEXT,
  price INTEGER,
  pages INTEGER
);

INSERT INTO book (title, author, price, pages) VALUES
('The Alchemist', 'Paulo Coelho', 299, 208),
('Wings of Fire', 'A.P.J. Abdul Kalam', 250, 180),
('Atomic Habits', 'James Clear', 399, 320),
('Rich Dad Poor Dad', 'Robert Kiyosaki', 350, 336),
('The Monk Who Sold His Ferrari', 'Robin Sharma', 275, 198),
('Ikigai', 'Hector Garcia', 320, 208),
('Think and Grow Rich', 'Napoleon Hill', 299, 238),
('The Power of Now', 'Eckhart Tolle', 380, 236),
('Deep Work', 'Cal Newport', 410, 304),
('Zero to One', 'Peter Thiel', 360, 224);