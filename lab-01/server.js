const express = require("express");
const app = express();

const PORT = process.env.PORT || 3000;

app.get("/", (req, res) => {
  res.status(200).send("Welcome to my Express server!");
});

app.get("/about", (req, res) => {
  res.status(200).json({ name: "Sai Sudheer", section: "112", registration_number: "252U1R9127" });
});

app.get("/time", (req, res) => {
  res.status(200).send(new Date().toString());
});

app.use((req, res) => {
  res.status(404).send("404 - Route not found");
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});