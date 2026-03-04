const express = require('express');
const db = require('./database');

const app = express();
app.use(express.json());

const PORT = 5000;
app.listen(PORT, () => {
  console.log(`Servern körs på http://localhost:${PORT}`);
});