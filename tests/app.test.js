const request = require("supertest");
const app = require("../app");

// mock database connection (ป้องกัน query ของจริงเวลาทดสอบ)
// Persist users array across all mock connections
const mockUsers = [
  { uid: 99, gmail: "mock@gmail.com", username: "mockuser", password: "hashed" }
];

jest.mock("../database/database", () => {
  return {
    connectdb: jest.fn().mockResolvedValue({
      query: jest.fn(function (sql, params) {
        if (sql.startsWith("SELECT * FROM users")) {
          // Return all users, including those registered during tests
          return Promise.resolve([mockUsers.length ? mockUsers : [
            { uid: 99, gmail: "mock@gmail.com", username: "mockuser", password: "hashed" }
          ], []]);
        }
        if (sql.startsWith("SELECT 1 FROM users")) {
          // Check for duplicate gmail
          const exists = mockUsers.some(u => u.gmail === params[0]);
          return Promise.resolve([exists ? [{ '1': 1 }] : []]);
        }
        if (sql.startsWith("INSERT INTO users")) {
          // Simulate user registration
          const newUser = {
            uid: mockUsers.length + 1,
            gmail: params[0],
            username: params[1],
            password: params[2]
          };
          mockUsers.push(newUser);
          return Promise.resolve([{ insertId: newUser.uid }]);
        }
        return Promise.resolve([[]]);
      }),
      release: jest.fn(),
    }),
  };
});

describe("API Tests", () => {
  // it("GET / ควรได้ users กลับมา", async () => {
  //   // สร้าง user ใหม่
  //   await request(app).post("/register").send({
  //     gmail: "jest_test@gmail.com",
  //     username: "jestuser",
  //     password: "Password@123"
  //   });

  //   // ดึง user list
  //   const res = await request(app).get("/");
  //   expect(res.status).toBe(200);
  //   expect(Array.isArray(res.body)).toBe(true);
  //   expect(res.body.length).toBeGreaterThan(0);

  //   // ตรวจว่ามี user ที่เพิ่งสมัคร
  //   const user = res.body.find(u => u.gmail === "jest_test@gmail.com");
  //   expect(user).toBeDefined();
  //   expect(user).toHaveProperty("username", "jestuser");
  // });


  it("POST /register ควรสมัครสำเร็จ", async () => {
    const res = await request(app).post("/register").send({
      gmail: "newuser@gmail.com",
      username: "newbie",
      password: "Password@123",
    });
    expect(res.status).toBe(201);
    expect(res.body).toHaveProperty("message", "สมัครสมาชิกสำเร็จ");
  });

  it("POST /register ถ้า password อ่อนเกินไปควร error", async () => {
    const res = await request(app).post("/register").send({
      gmail: "weakpass@gmail.com",
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
