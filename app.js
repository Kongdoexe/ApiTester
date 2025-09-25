const express = require("express");
const bodyParser = require("body-parser"); // ใช้ได้ แต่ถ้าเป็น Express 4.16+ ใช้ app.use(express.json()) ก็ได้
const cors = require("cors");
const bcrypt = require("bcryptjs");
const { pool, connectdb } = require("./database/database");

const app = express();
app.disable("etag");
app.use(cors());
app.use(bodyParser.json());
// หรือใช้แทนได้: app.use(express.json());

function validateGmail(gmailInput) {
  // normalize: ตัดช่องว่าง และทำเป็นตัวเล็ก
  const gmail = (gmailInput ?? "").trim().toLowerCase();

  // 1) ต้องมี @ แค่ 1 ตัว
  const atCount = (gmail.match(/@/g) || []).length;
  if (atCount !== 1) {
    return { valid: false, reason: "ต้องมี @ แค่ 1 ตัว" };
  }

  // 2) ต้องลงท้ายด้วย @gmail.com
  if (!gmail.endsWith("@gmail.com")) {
    return { valid: false, reason: "ต้องลงท้ายด้วย @gmail.com" };
  }

  // แยก local-part (ก่อน @)
  const local = gmail.slice(0, gmail.indexOf("@"));

  // 3) ความยาวก่อน @ ต้อง 1-64 ตัว
  if (local.length < 1 || local.length > 64) {
    return { valid: false, reason: "ความยาวส่วนก่อน @ ต้อง 1–64 อักขระ" };
  }

  // 4) ตัวแรกต้องเป็น a-z หรือ 0-9
  if (!/^[a-z0-9]/i.test(local[0])) {
    return { valid: false, reason: "ตัวแรกต้องเป็น a-z หรือ 0-9" };
  }

  // 5) ตัวสุดท้ายต้องเป็น a-z หรือ 0-9
  if (!/[a-z0-9]$/i.test(local)) {
    return { valid: false, reason: "ตัวสุดท้ายต้องเป็น a-z หรือ 0-9" };
  }

  // 6) ห้ามมีจุดติดกัน
  if (local.includes("..")) {
    return { valid: false, reason: "ห้ามมีจุดติดกัน (..)" };
  }

  // 7) อนุญาตเฉพาะ a-z 0-9 และจุด เท่านั้น
  if (!/^[a-z0-9.]+$/i.test(local)) {
    return { valid: false, reason: "ใช้ได้เฉพาะ a-z, 0-9 และจุด(.) ในส่วนก่อน @" };
  }

  return { valid: true, reason: "" };
}

app.get("/", async (_req, res) => {
  let conn; // ✅ เพิ่มประกาศตัวแปร
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

    // จำกัดความยาวรวมของอีเมลเพื่อกัน input ยาวผิดปกติ
    if (gmailTrim.length > 100) {
      return res.status(400).json({ message: "gmail ต้องไม่ยาวเกิน 100 อักขระ" });
    }

    // ตรวจสอบกฎ gmail แบบแยกเคส
    const { valid, reason } = validateGmail(gmailTrim); // ✅ แก้จาก valid, reason = ...
    if (!valid) {
      return res.status(400).json({ message: reason });
    }

    // ตรวจรหัสผ่าน: อย่างน้อย 8 ตัว ต้องมี a-z, A-Z, ตัวเลข, อักขระพิเศษ (ไม่รวมจุด)
    const passRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
    if (!passRegex.test(password)) {
      return res.status(400).json({
        message: "Password ต้องมีอย่างน้อย 8 ตัวอักษร และมีทั้ง A-Z, a-z, ตัวเลข, และอักขระพิเศษ (@$!%*?&)",
      });
    }

    // เช็คซ้ำใน DB
    const [dupgmail] = await conn.query(
      "SELECT 1 FROM users WHERE gmail = ? LIMIT 1",
      [gmailTrim]
    );
    if (dupgmail.length > 0) {
      return res.status(409).json({ message: "อีเมลนี้ถูกใช้แล้ว" });
    }

    // บันทึก
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
