const express = require('express');
const { Pool } = require('pg');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const cors = require('cors');

const app = express();
app.use(cors());
app.use(express.json());

const pool = new Pool({
  user: 'postgres',
  host: 'localhost',
  database: 'dreamstudy',
  port: 5432,
});

const JWT_SECRET = 'dev_secret_key';

// 🔐 Регистрация
app.post('/auth/register', async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: 'email и password обязательны' });
  }

  try {
    const hash = await bcrypt.hash(password, 10);

    const user = await pool.query(
      'INSERT INTO users(email, password) VALUES($1,$2) RETURNING id, email',
      [email, hash]
    );

    res.json(user.rows[0]);
  } catch (err) {
    res.status(500).json({ error: 'Пользователь уже существует' });
  }
});

// 🔑 Логин
app.post('/auth/login', async (req, res) => {
  const { email, password } = req.body;

  const result = await pool.query(
    'SELECT * FROM users WHERE email = $1',
    [email]
  );

  const user = result.rows[0];
  if (!user) {
    return res.status(401).json({ error: 'Неверные данные' });
  }

  const valid = await bcrypt.compare(password, user.password);
  if (!valid) {
    return res.status(401).json({ error: 'Неверные данные' });
  }

  const token = jwt.sign({ userId: user.id }, JWT_SECRET);

  res.json({ token });
});

// 🧪 Тест
app.get('/db-test', async (req, res) => {
  const result = await pool.query('SELECT NOW()');
  res.json(result.rows[0]);
});

app.listen(3001, () => {
  console.log('Backend запущен: http://localhost:3001');
});

// Получение всех курсов
app.get('/courses', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM courses');
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Покупка курса
app.post('/courses/buy', async (req, res) => {
  const { userId, courseId } = req.body;

  if (!userId || !courseId) return res.status(400).json({ error: 'userId и courseId обязательны' });

  try {
    const result = await pool.query(
      'INSERT INTO purchases(user_id, course_id, paid) VALUES($1,$2,$3) RETURNING *',
      [userId, courseId, false]
    );
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Список покупок пользователя
app.get('/purchases/:userId', async (req, res) => {
  const { userId } = req.params;
  try {
    const result = await pool.query(
      'SELECT p.id, c.title, c.price, p.paid FROM purchases p JOIN courses c ON p.course_id = c.id WHERE p.user_id = $1',
      [userId]
    );
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Webhook от CloudPayments
app.post('/cloudpayments/webhook', async (req, res) => {
  try {
    const { InvoiceId, Status } = req.body;

    console.log('CloudPayments webhook:', req.body);

    if (Status === 'Completed') {
      await pool.query(
        'UPDATE purchases SET paid = true WHERE id = $1',
        [InvoiceId]
      );
    }

    res.json({ code: 0 }); // обязательно
  } catch (err) {
    console.error(err);
    res.status(500).json({ code: 13 });
  }
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

