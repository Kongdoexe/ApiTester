const request = require("supertest");
const app = require("../app");
const db = require("../database/database"); 

afterAll(async () => {
  if (db.end) await db.end();
});

describe("API Tests (Real DB)", () => {
  it("GET /getUsers ควรได้ users กลับมา", async () => {
    const res = await request(app).get("/"); 
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body.length).toBeGreaterThan(0);

    const user = res.body[0];
    expect(user).toHaveProperty("uid");
    expect(user).toHaveProperty("gmail");
  });

  it("POST /register ควรสมัครสำเร็จ", async () => {
    const gmail = `flimsalove@gmail.com`;
    const res = await request(app).post("/register").send({
      gmail,
      username: "realuser",
      password: "Password@123",
    });
    expect(res.status).toBe(201);
    expect(res.body).toHaveProperty("message", "สมัครสมาชิกสำเร็จ");
  });

  it("POST /register ถ้า password อ่อนเกินไปควร error", async () => {
    const gmail = `Kongeiei@gmail.com`;
    const res = await request(app).post("/register").send({
      gmail,
      username: "weak",
      password: "1234",
    });
    expect(res.status).toBe(400);
    expect(res.body.message).toMatch(/Password/);
  });

  it("POST /login ถ้าข้อมูลผิดควร 401", async () => {
    const res = await request(app).post("/login").send({
      gmail: "notfound@gmail.com",
      password: "wrong",
    });
    expect([400, 401]).toContain(res.status);
  });
});
