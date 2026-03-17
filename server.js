const express = require('express');
const db = require('./database');

const app = express();
app.use(express.json());

app.get('/', (req, res) => {
  res.send(`
    <h1>Dokumentation av det här apiet</h1>
    <h2>Routes</h2>
    <ul>
      <li><i>GET /users</i> - returnerar alla användare</li>
      <li><i>GET /users/{id}</i> - returnerar en user med angivet id eller status 204 om användaren saknas</li>
      <li><i>POST /users</i> - skapar en ny användare. Accepterar JSON på formatet {"username": "unikt namn", "first_name": "", "last_name": ""}. username är obligatoriskt och ska vara unikt</li>
    </ul>
  `);
});

app.get('/users', (req, res) => {
  const users = db.prepare('SELECT * FROM users').all();
  res.status(200).json(users);
});

app.get('/users/:id', (req, res) => {
  const user = db.prepare('SELECT * FROM users WHERE id = ?').get(req.params.id);

  if (!user) {
    return res.status(204).send();
  }

  res.status(200).json(user);
});

const PORT = 3000;
app.listen(PORT, () => {
  console.log(`Servern körs på http://localhost:${PORT}`);
});