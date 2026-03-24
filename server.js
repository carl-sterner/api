const express = require('express');
const db = require('./database');

const app = express();
app.use(express.json());

const PORT = 3000;

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

app.post('/users', (req, res) => {
  const { username, first_name, last_name } = req.body;

  if (!username) {
    return res.status(400).json({ error: 'username är obligatoriskt' });
  }

  try {
    const result = db.prepare(
      'INSERT INTO users (username, first_name, last_name) VALUES (?, ?, ?)'
    ).run(username, first_name, last_name);

    const newUser = db.prepare('SELECT * FROM users WHERE id = ?').get(result.lastInsertRowid);
    res.status(201).json(newUser);
  } catch (error) {
    res.status(400).json({ error: 'username måste vara unikt' });
  }
});

app.put('/users/:id', (req, res) => {
  const { username, first_name, last_name } = req.body;

  const user = db.prepare('SELECT * FROM users WHERE id = ?').get(req.params.id);

  if (!user) {
    return res.status(404).json({ error: 'Användaren hittades inte' });
  }

  try {
    db.prepare(
      'UPDATE users SET username = ?, first_name = ?, last_name = ? WHERE id = ?'
    ).run(
      username ?? user.username,
      first_name ?? user.first_name,
      last_name ?? user.last_name,
      req.params.id
    );

    const updatedUser = db.prepare('SELECT * FROM users WHERE id = ?').get(req.params.id);
    res.status(200).json(updatedUser);
  } catch (error) {
    res.status(400).json({ error: 'username måste vara unikt' });
  }
});

app.listen(PORT, () => {
  console.log(`Servern körs på http://localhost:${PORT}`);
});