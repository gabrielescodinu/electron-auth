const express = require('express');
const mysql = require('mysql');
const bcrypt = require('bcrypt');
const session = require('express-session');
const app = express();
const cookieParser = require('cookie-parser');

app.use(cookieParser());
app.use(session({
    secret: 'your-session-secret',
    resave: false,
    saveUninitialized: true,
    cookie: {
        secure: false, // Imposta su true se si utilizza HTTPS
        maxAge: 24 * 60 * 60 * 1000, // Durata del cookie (24 ore)
    },
}));


// Configura la connessione al database MySQL
const db = mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: 'password', // Cambia questa password con quella del tuo DB
    database: 'electron-auth'
});

// Connetti al database
db.connect((err) => {
    if (err) throw err;
    console.log('Connected to MySQL database');
});

// Usa JSON per il middleware del body-parser
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// Configura la sessione
app.use(session({
    secret: 'secret-key',
    resave: false,
    saveUninitialized: false
}));

// Endpoint per la registrazione
app.post('/register', async (req, res) => {
    const { name, email, password } = req.body;
    const hashedPassword = await bcrypt.hash(password, 10);

    const query = `INSERT INTO users (name, email, password) VALUES (?, ?, ?)`;

    db.query(query, [name, email, hashedPassword], (err, result) => {
        if (err) {
            console.error(err);
            res.sendStatus(500);
        } else {
            res.sendStatus(200);
        }
    });
});

// Endpoint per il login
app.post('/login', (req, res) => {
    const { email, password } = req.body;
    const query = 'SELECT * FROM users WHERE email = ?';

    db.query(query, [email], async (err, result) => {
        if (err || result.length === 0) {
            res.sendStatus(500);
        } else {
            const user = result[0];
            const match = await bcrypt.compare(password, user.password);

            if (match) {
                req.session.userId = user.id;
                res.sendStatus(200);
            } else {
                res.sendStatus(401);
            }
        }
    });
});

// Endpoint per il logout
app.post('/logout', (req, res) => {
    req.session.destroy();
    res.sendStatus(200);
});

// Middleware di autenticazione
function isAuthenticated(req, res, next) {
    if (req.session && req.session.userId) {
        return next();
    }
    res.sendStatus(401);
}

// Rotte protette (aggiungi la rotta della dashboard qui)
app.get('/dashboard', isAuthenticated, (req, res) => {
    res.sendFile(path.join(__dirname, 'dashboard.html'));
});

// Aggiungi queste rotte dopo le rotte di autenticazione

// Ottieni tutte le canzoni
app.get('/songs', async (req, res) => {
    // Verifica se l'utente è autenticato
    if (!req.session.userId) {
        return res.status(401).send('Non autorizzato');
    }

    try {
        const songs = await db.query('SELECT * FROM songs');
        res.json(songs);
    } catch (error) {
        console.error(error);
        res.status(500).send('Errore interno del server');
    }
});

// Aggiungi una nuova canzone
app.post('/songs', async (req, res) => {
    // Verifica se l'utente è autenticato
    if (!req.session.userId) {
        return res.status(401).send('Non autorizzato');
    }

    const { name, description } = req.body;

    try {
        await db.query('INSERT INTO songs (name, description) VALUES (?, ?)', [name, description]);
        res.sendStatus(200);
    } catch (error) {
        console.error(error);
        res.status(500).send('Errore interno del server');
    }
});

// Elimina una canzone
app.delete('/songs/:id', async (req, res) => {
    // Verifica se l'utente è autenticato
    if (!req.session.userId) {
        return res.status(401).send('Non autorizzato');
    }

    const songId = req.params.id;

    try {
        await db.query('DELETE FROM songs WHERE id = ?', [songId]);
        res.sendStatus(200);
    } catch (error) {
        console.error(error);
        res.status(500).send('Errore interno del server');
    }
});

function ensureAuthenticated(req, res, next) {
    if (req.isAuthenticated()) {
      return next();
    }
    res.status(401).send('Unauthorized');
  }
  

const port = 3000;
app.listen(port, () => {
    console.log(`Server listening on port ${port}`);
});

// Esporta l'URL del server Express
module.exports = `http://localhost:${port}`;
