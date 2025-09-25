const request = require("supertest");
const app = require("../app");

const initialMockUser = {
  uid: 99,
  gmail: "pingpong@gmail.com",
  username: "pingpong",
  password: "PasW0rd@55"
};

const mockUsers = [{ ...initialMockUser }];

jest.mock("../database/database", () => ({
  connectdb: jest.fn().mockResolvedValue({
    query: jest.fn((sql, params) => {
      if (sql.startsWith("SELECT * FROM users")) {
        return Promise.resolve([[...mockUsers], []]);
      }
      if (sql.startsWith("SELECT 1 FROM users")) {
        const exists = mockUsers.some(u => u.gmail === params[0]);
        return Promise.resolve([exists ? [{ '1': 1 }] : []]);
      }
      if (sql.startsWith("INSERT INTO users")) {
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
}));

describe("API Tests", () => {
  beforeEach(() => {
    mockUsers.length = 0;
    mockUsers.push({ ...initialMockUser });
  });

  it("should get list of users", async () => {
    const registerData = {
      gmail: "winnie@gmail.com", 
      username: "winnie",
      password: "Password@123"
    };
    
    const registerRes = await request(app)
      .post("/register")
      .send(registerData);
      
    expect(registerRes.status).toBe(201);
    console.log('Mock users after registration:', JSON.stringify(mockUsers, null, 2));

    const res = await request(app).get("/");
    console.log('Raw SQL Query Result:', JSON.stringify([[...mockUsers], []], null, 2));
    console.log('API Response:', JSON.stringify(res.body, null, 2));
    
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body.length).toBeGreaterThan(0);
    
    expect(res.body).toEqual(expect.arrayContaining([
      expect.objectContaining({
        gmail: registerData.gmail,
        username: registerData.username
      })
    ]));
});

  it("should register a new user successfully", async () => {
    const res = await request(app).post("/register").send({
      gmail: "newuser@gmail.com",
      username: "newbie",
      password: "Password@123",
    });
    expect(res.status).toBe(201);
    expect(res.body).toHaveProperty("message", "สมัครสมาชิกสำเร็จ");
  });

  it("should reject registration with weak password", async () => {
    const res = await request(app).post("/register").send({
      gmail: "weakpass@gmail.com",
      username: "weak",
      password: "1234",
    });
    expect(res.status).toBe(400);
    expect(res.body.message).toMatch(/Password/);
  });

  it("should reject login with invalid credentials", async () => {
    const res = await request(app).post("/login").send({
      gmail: "notfound@gmail.com",
      password: "wrong",
    });
    expect([400, 401]).toContain(res.status);
  });
});
