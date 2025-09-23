const express = require("express");
const bodyParser = require("body-parser");
const cors = require("cors");
const bcrypt = require("bcryptjs");
const { pool, connectdb } = require("./database/database");

const app = express();
app.disable("etag");
app.use(cors());
app.use(bodyParser.json());

app.get("/", async (_req, res) => {
    try {
        conn = await connectdb();
        const [rows] = await conn.query("Select * FROM users")
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

        if (gmail.length > 50) {
            return res.status(400).json({ message: "gmail ต้องไม่เกิน 50 ตัวอักษร" });
        }

        const gmailRegex = /^(?!.*\.\.)[a-z0-9](?:[a-z0-9.]{0,62}[a-z0-9])?@gmail\.com$/i;
        if (!gmailRegex.test(gmail)) {
            return res.status(400).json({ message: "gmail must be a valid Gmail address" });
        }

        const passRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
        if (!passRegex.test(password)) {
            return res.status(400).json({ 
                message: "Password ต้องมีอย่างน้อย 8 ตัวอักษร และมีทั้ง A-Z, a-z, ตัวเลข, และอักขระพิเศษ" 
            });
        }

        const [dupgmail] = await conn.query(
            "SELECT 1 FROM users WHERE gmail = ? LIMIT 1",
            [gmail]
        );
        if (dupgmail.length > 0) {
            return res.status(409).json({ message: "อีเมลนี้ถูกใช้แล้ว" });
        }

        const passwordHash = await bcrypt.hash(password, 12);
        await conn.query(
            "INSERT INTO users (gmail, username, password) VALUES (?, ?, ?)",
            [gmail, username, passwordHash]
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

        const [rows] = await conn.query(
            "SELECT * FROM users WHERE gmail = ? LIMIT 1",
            [gmail]
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