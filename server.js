const express = require("express");
const db = require("./database");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");

const app = express();
app.use(express.json());

const PORT = 3000;
const SECRET = "hemlignyckel123123";

function authMiddleware(req, res, next) {
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1]; // förväntar "Bearer <token>"

  if (!token) {
    return res.status(401).json({ error: "Ingen token angiven" });
  }

  try {
    const decoded = jwt.verify(token, SECRET);
    req.user = decoded;
    next();
  } catch (error) {
    return res.status(403).json({ error: "Ogiltig eller utgången token" });
  }
}

app.get("/", (req, res) => {
  res.send(`
    <h1>Dokumentation av det här APIet</h1>
    <h2>Routes</h2>
    <ul>
      <li><i>POST /register</i> - skapar en ny användare med lösenord</li>
      <li><i>POST /login</i> - loggar in och returnerar en JWT-token</li>
      <li>🔒 <i>GET /users</i> - returnerar alla användare</li>
      <li>🔒 <i>GET /users/{id}</i> - returnerar en användare med angivet id</li>
      <li>🔒 <i>POST /users</i> - skapar en ny användare</li>
      <li>🔒 <i>PUT /users/{id}</i> - uppdaterar en användare</li>
    </ul>
    <p>🔒 = kräver ett giltigt bearer token i authorization headern</p>
  `);
});

app.get("/users", authMiddleware, (req, res) => {
  const users = db.prepare("SELECT * FROM users").all();
  res.status(200).json(users);
});

app.post("/users", authMiddleware, async (req, res) => {
  const { username, first_name, last_name, password } = req.body;

  if (!username || !password) {
    return res
      .status(400)
      .json({ error: "username och password är obligatoriskt" });
  }

  try {
    const hashedPassword = await bcrypt.hash(password, 10);
    const result = db
      .prepare(
        "INSERT INTO users (username, first_name, last_name, password) VALUES (?, ?, ?, ?)",
      )
      .run(username, first_name, last_name, hashedPassword);

    const newUser = db
      .prepare(
        "SELECT id, username, first_name, last_name FROM users WHERE id = ?",
      )
      .get(result.lastInsertRowid);
    res.status(201).json(newUser);
  } catch (error) {
    res.status(400).json({ error: "username måste vara unikt" });
  }
});

app.get("/users/:id", authMiddleware, (req, res) => {
  const user = db
    .prepare("SELECT * FROM users WHERE id = ?")
    .get(req.params.id);

  if (!user) {
    return res.status(204).send();
  }

  res.status(200).json(user);
});

app.put("/users/:id", authMiddleware, (req, res) => {
  const { username, first_name, last_name } = req.body;

  const user = db
    .prepare("SELECT * FROM users WHERE id = ?")
    .get(req.params.id);

  if (!user) {
    return res.status(404).json({ error: "Användaren hittades inte" });
  }

  try {
    db.prepare(
      "UPDATE users SET username = ?, first_name = ?, last_name = ? WHERE id = ?",
    ).run(
      username ?? user.username,
      first_name ?? user.first_name,
      last_name ?? user.last_name,
      req.params.id,
    );

    const updatedUser = db
      .prepare("SELECT * FROM users WHERE id = ?")
      .get(req.params.id);
    res.status(200).json(updatedUser);
  } catch (error) {
    res.status(400).json({ error: "username måste vara unikt" });
  }
});

app.post("/register", async (req, res) => {
  const { username, first_name, last_name, password } = req.body;

  if (!username || !password) {
    return res
      .status(400)
      .json({ error: "username och password är obligatoriska" });
  }

  try {
    const hashedPassword = await bcrypt.hash(password, 10);
    const result = db
      .prepare(
        "INSERT INTO users (username, first_name, last_name, password) VALUES (?, ?, ?, ?)",
      )
      .run(username, first_name, last_name, hashedPassword);

    const newUser = db
      .prepare(
        "SELECT id, username, first_name, last_name FROM users WHERE id = ?",
      )
      .get(result.lastInsertRowid);
    res.status(201).json(newUser);
  } catch (error) {
    res.status(400).json({ error: "username måste vara unikt" });
  }
});

app.post("/login", async (req, res) => {
  const { username, password } = req.body;

  const user = db
    .prepare("SELECT * FROM users WHERE username = ?")
    .get(username);

  if (!user) {
    return res
      .status(401)
      .json({ error: "Felaktigt användarnamn eller lösenord" });
  }

  const passwordMatch = await bcrypt.compare(password, user.password);

  if (!passwordMatch) {
    return res
      .status(401)
      .json({ error: "Felaktigt användarnamn eller lösenord" });
  }

  const token = jwt.sign({ id: user.id, username: user.username }, SECRET, {
    expiresIn: "1h",
  });
  res.status(200).json({ token });
});

app.listen(PORT, () => {
  console.log(`Servern körs på http://localhost:${PORT}`);
});
