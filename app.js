const express = require("express");
const bodyParser = require("body-parser");
const cors = require("cors");
const bcrypt = require("bcryptjs");
const { pool, connectdb } = require("./database/database");

const app = express();
app.disable("etag");
app.use(cors());
app.use(bodyParser.json());

function validateGmail(gmailInput) {
  const gmail = (gmailInput ?? "").trim().toLowerCase();

  const atCount = (gmail.match(/@/g) || []).length;
  if (atCount !== 1) {
    return { valid: false, reason: "ต้องมี @ แค่ 1 ตัว" };
  }

  if (!gmail.endsWith("@gmail.com")) {
    return { valid: false, reason: "ต้องลงท้ายด้วย @gmail.com" };
  }

  const local = gmail.slice(0, gmail.indexOf("@"));

  if (local.length < 1 || local.length > 64) {
    return { valid: false, reason: "ความยาวส่วนก่อน @ ต้อง 1–64 อักขระ" };
  }

  if (!/^[a-z0-9]/i.test(local[0])) {
    return { valid: false, reason: "ตัวแรกต้องเป็น a-z หรือ 0-9" };
  }

  if (!/[a-z0-9]$/i.test(local)) {
    return { valid: false, reason: "ตัวสุดท้ายต้องเป็น a-z หรือ 0-9" };
  }

  if (local.includes("..")) {
    return { valid: false, reason: "ห้ามมีจุดติดกัน (..)" };
  }

  if (!/^[a-z0-9.]+$/i.test(local)) {
    return { valid: false, reason: "ใช้ได้เฉพาะ a-z, 0-9 และจุด(.) ในส่วนก่อน @" };
  }

  return { valid: true, reason: "" };
}

function validatePassword(password) {
  if (password.length < 8) {
    return { valid: false, reason: "Password ต้องมีอย่างน้อย 8 ตัวอักษร" };
  }

  if (!/[a-z]/.test(password)) {
    return { valid: false, reason: "ต้องมีตัวอักษรเล็ก (a-z) อย่างน้อย 1 ตัว" };
  }

  if (!/[A-Z]/.test(password)) {
    return { valid: false, reason: "ต้องมีตัวอักษรใหญ่ (A-Z) อย่างน้อย 1 ตัว" };
  }

  if (!/[0-9]/.test(password)) {
    return { valid: false, reason: "ต้องมีตัวเลข (0-9) อย่างน้อย 1 ตัว" };
  }

  if (!/[@$!%*?&]/.test(password)) {
    return { valid: false, reason: "ต้องมีอักขระพิเศษอย่างน้อย 1 ตัว (@$!%*?&)" };
  }

  if (!/^[A-Za-z\d@$!%*?&]+$/.test(password)) {
    return { valid: false, reason: "ใช้ได้เฉพาะ A-Z, a-z, 0-9 และ @$!%*?& เท่านั้น" };
  }

  return { valid: true, reason: "" };
}

app.get("/", async (_req, res) => {
  let conn;
  try {
    conn = await connectdb();
    const [rows] = await conn.query("SELECT * FROM users");
    return res.json(rows);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: "DB error" });
  } finally {
    if (conn) conn.release();
  }
});

app.post("/register", async (req, res) => {
  let conn;
  try {
    conn = await connectdb();
    const { gmail, password, username } = req.body ?? {};

    if (!gmail || !password || !username) {
      return res.status(400).json({ message: "gmail, username, password จำเป็นต้องมี" });
    }

    const gmailTrim = gmail.trim().toLowerCase();

    if (gmailTrim.length > 50) {
      return res.status(400).json({ message: "gmail ต้องไม่ยาวเกิน 50 อักขระ" });
    }

    const { valid, reason } = validateGmail(gmailTrim);
    if (!valid) {
      return res.status(400).json({ message: reason });
    }

    const { validPassword, reasonPassword } = validatePassword(password);
    if (!validPassword) {
      return res.status(400).json({ message: reasonPassword });
    }

    const [dupgmail] = await conn.query(
      "SELECT 1 FROM users WHERE gmail = ? LIMIT 1",
      [gmailTrim]
    );
    if (dupgmail.length > 0) {
      return res.status(409).json({ message: "อีเมลนี้ถูกใช้แล้ว" });
    }

    const passwordHash = await bcrypt.hash(password, 12);
    await conn.query(
      "INSERT INTO users (gmail, username, password) VALUES (?, ?, ?)",
      [gmailTrim, username, passwordHash]
    );

    return res.status(201).json({ message: "สมัครสมาชิกสำเร็จ" });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: "DB error" });
  } finally {
    if (conn) conn.release();
  }
});

app.post("/login", async (req, res) => {
  let conn;
  try {
    conn = await connectdb();
    const { gmail, password } = req.body ?? {};

    if (!gmail || !password) {
      return res.status(400).json({ message: "gmail, password จำเป็นต้องมี" });
    }

    const gmailTrim = gmail.trim().toLowerCase();

    const [rows] = await conn.query(
      "SELECT * FROM users WHERE gmail = ? LIMIT 1",
      [gmailTrim]
    );

    if (rows.length === 0) {
      return res.status(401).json({ message: "อีเมลหรือรหัสผ่านไม่ถูกต้อง" });
    }

    const user = rows[0];
    const ok = await bcrypt.compare(password, user.password);
    if (!ok) {
      return res.status(401).json({ message: "อีเมลหรือรหัสผ่านไม่ถูกต้อง" });
    }

    return res.status(200).json({
      message: "เข้าสู่ระบบสำเร็จ",
      data: {
        email: user.gmail,
        username: user.username,
      },
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: "DB error" });
  } finally {
    if (conn) conn.release();
  }
});

module.exports = app;
