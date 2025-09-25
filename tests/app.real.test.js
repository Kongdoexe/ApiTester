const request = require("supertest");
const app = require("../app");
const db = require("../database/database");

afterAll(async () => {
  if (db.end) await db.end();
});

describe("API Tests (Real DB)", () => {
  // it("GET /getUsers ควรได้ users กลับมา", async () => {
  //   const res = await request(app).get("/");
  //   expect(res.status).toBe(200);
  //   expect(Array.isArray(res.body)).toBe(true);
  //   expect(res.body.length).toBeGreaterThan(0);

  //   const user = res.body[0];
  //   expect(user).toHaveProperty("uid");
  //   expect(user).toHaveProperty("gmail");
  // });

  // it("POST /register ควรสมัครสำเร็จ", async () => {
  //   const gmail = `flimsalove@gmail.com`;
  //   const res = await request(app).post("/register").send({
  //     gmail,
  //     username: "realuser",
  //     password: "Password@123",
  //   });
  //   expect(res.status).toBe(201);
  //   expect(res.body).toHaveProperty("message", "สมัครสมาชิกสำเร็จ");
  // });

  // it("POST /register ถ้า password อ่อนเกินไปควร error", async () => {
  //   const gmail = `Kongeiei@gmail.com`;
  //   const res = await request(app).post("/register").send({
  //     gmail,
  //     username: "weak",
  //     password: "1234",
  //   });
  //   expect(res.status).toBe(400);
  //   expect(res.body.message).toMatch(/Password/);
  // });

  // it("POST /login ถ้าข้อมูลผิดควร 401", async () => {
  //   const res = await request(app).post("/login").send({
  //     gmail: "notfound@gmail.com",
  //     password: "wrong",
  //   });
  //   expect([400, 401]).toContain(res.status);
  // });

  //กรณีสมัครสมาชิกสำเร็จของ Email
  // เคสที่1 กรณีสมัครสมาชิกสำเร็จด้วยข้อมูลemailที่ถูกต้องตามเงื่อนไขทั้งหมด (กรณีที่ข้างหน้า@เป็นตัวพิมพ์เล็กทั้งหมด)
  it("POST /register กรณีสมัครสมาชิกสำเร็จด้วยข้อมูลemailที่ถูกต้องตามเงื่อนไข กรณีที่ข้างหน้า@เป็นตัวพิมพ์เล็กทั้งหมด", async () => {
    const gmail = `Kongfha.a@gmail.com`;
    const res = await request(app).post("/register").send({
      gmail,
      username: "ก้องเองจ้า",
      password: "a@?Kaiiii1@",
    });
    expect(res.status).toBe(201);
    expect(res.body).toHaveProperty("message", "สมัครสมาชิกสำเร็จ");
  });

  //เคสที่2 กรณีสมัครสมาชิกสำเร็จด้วยข้อมูลemailที่ถูกต้องตามเงื่อนไขทั้งหมด (กรณีที่ข้างหน้า@เป็นตัวพิมพ์ใหญ่ทั้งหมด)
  it("POST /register กรณีสมัครสมาชิกสำเร็จด้วยข้อมูลemailที่ถูกต้องตามเงื่อนไข กรณีที่เป็นตัวพิมพ์ใหญ่ทั้งหมด", async () => {
    const gmail = `KONG@gmail.com`;
    const res = await request(app).post("/register").send({
      gmail,
      username: "ก้องเอง",
      password: "KONGKAIZ45@Eiei",
    });
    expect(res.status).toBe(201);
    expect(res.body).toHaveProperty("message", "สมัครสมาชิกสำเร็จ");
  });
});

//เคสที่3 กรณีสมัครสมาชิกสำเร็จด้วยข้อมูลemailที่ถูกต้องตามเงื่อนไขทั้งหมด (กรณีที่ข้างหน้า@เป็นตัวเลขทั้งหมด)
it("POST /register กรณีสมัครสมาชิกสำเร็จด้วยข้อมูลemailที่ถูกต้องตามเงื่อนไข กรณีที่ข้างหน้า@เป็นตัวเลขทั้งหมด", async () => {
  const gmail = `002@gmail.com`;
  const res = await request(app).post("/register").send({
    gmail,
    username: "002เอง",
    password: "002ZaZa!@Eiei",
  });
  expect(res.status).toBe(201);
  expect(res.body).toHaveProperty("message", "สมัครสมาชิกสำเร็จ");
});

//กรณีสมัครสมาชิกไม่สำเร็จของ Email
//เคสที่4 กรณีสมัครสมาชิกไม่สำเร็จเพราะ Email ต้องไม่เกิน 50 ตัวอักษร
it("POST /register ถ้า email เกิน 50 ตัวอักษรควร error", async () => {
  const gmail = `KongnaphaANDAnayaANDPanidaANDNanthawatANDAtsadawut@gmail.com`;
  const res = await request(app).post("/register").send({
    gmail,
    username: "เดอะแก๊งจ้า่",
    password: "@KaA4PaNaA@",
  });
  expect(res.status).toBe(400);
  expect(res.body).toHaveProperty("message", "gmail ต้องไม่เกิน 50 ตัวอักษร");
});

//เคสที่5 กรณีสมัครสมาชิกไม่สำเร็จเพราะ ตัวแรกต้องเป็น A-Z หรือ a-z หรือ 0-9
it("POST /register ถ้า email ตัวแรกไม่เป็น A-Z หรือ a-z หรือ 0-9 ควร error", async () => {
  const gmail = `!Panid.a@gmail.com`;
  const res = await request(app).post("/register").send({
    gmail,
    username: "ภนิดาคิมคนสวย",
    password: "Panid4@Kim",
  });
  expect(res.status).toBe(400);
  expect(res.body).toHaveProperty("message", "gmail must be a valid Gmail address");
});

//เคสที่6 กรณีสมัครสมาชิกไม่สำเร็จเพราะ ต้องลงท้ายด้วย @gmail.com
it("POST /register ถ้า email ไม่ลงท้ายด้วย @gmail.com ควร error", async () => {
  const gmail = `Anaya@msu.ac.th`;
  const res = await request(app).post("/register").send({
    gmail,
    username: "อนันยา",
    password: "AnayaJ4a@",
  });
  expect(res.status).toBe(400);
  expect(res.body).toHaveProperty("message", "gmail must be a valid Gmail address");
});

//เคสที่7 กรณีสมัครสมาชิกไม่สำเร็จเพราะ ไม่มี @
it("POST /register ถ้า email ไม่มี @ ควร error", async () => {
  const gmail = `Nanthawat.fluxgmail.com`;
  const res = await request(app).post("/register").send({
    gmail,
    username: "นันทวัน",
    password: "Nanth4?w4t",
  });
  expect(res.status).toBe(400);
  expect(res.body).toHaveProperty("message", "gmail must be a valid Gmail address");
});

//เคสที่8 กรณีสมัครสมาชิกไม่สำเร็จเพราะ ต้องมี @ แค่ 1 ตัว
it("POST /register ถ้า email มี @ มากกว่า 1 ตัว ควร error", async () => {
  const gmail = `Nanthawat.flux@a@gmail.com`;
  const res = await request(app).post("/register").send({
    gmail,
    username: "นันทวัน",
    password: "N4nt!h4wat",
  });
  expect(res.status).toBe(400);
  expect(res.body).toHaveProperty("message", "gmail must be a valid Gmail address");
});

//เคสที่9 กรณีสมัครสมาชิกไม่สำเร็จเพราะ ห้ามมี . ติดกัน (..)
it("POST /register ถ้า email มี . ติดกัน ควร error", async () => {
  const gmail = `Atsadawut..toey@gmail.com`;
  const res = await request(app).post("/register").send({
    gmail,
    username: "อสดา",
    password: "Atsa?d4wut",
  });
  expect(res.status).toBe(400);
  expect(res.body).toHaveProperty("message", "gmail must be a valid Gmail address");
});

//กรณีสมัครสมาชิกสำเร็จของ Password
//เคสที่1 กรณีสมัครสมาชิกสำเร็จด้วยข้อมูล Password ที่ถูกต้องตามเงื่อนไขทั้งหมด
it("POST /register กรณีสมัครสมาชิกสำเร็จด้วยข้อมูล Password ที่ถูกต้องตามเงื่อนไขทั้งหมด", async () => {
  const gmail = `kongfh.a@gmail.com`;
  const res = await request(app).post("/register").send({
    gmail,
    username: "ก้องอีกแล้ว",
    password: "@?Kaiiii1@",
  });
  expect(res.status).toBe(201);
  expect(res.body).toMatchObject({ message: "สมัครสมาชิกสำเร็จ" });
});

//กรณีสมัครสมาชิกไม่สำเร็จของ Password
//เคสที่2 กรณีสมัครสมาชิกไม่สำเร็จเพราะ Password ต้องมีอย่างน้อย 8 ตัวอักษร
it("POST /register ถ้า password น้อยกว่า 8 ตัวอักษร ควร error", async () => {
  const gmail = `Pani.a@gmail.com`;
  const res = await request(app).post("/register").send({
    gmail,
    username: "ภนิดาคิมคนสวย",
    password: "@P4nida",
  });
  expect(res.status).toBe(400);
  expect(res.body.message).toMatch(/Password/);
});

//เคสที่3 กรณีสมัครสมาชิกไม่สำเร็จเพราะ Password ต้องมีตัวพิมพ์ใหญ่ A-Z อย่างน้อย 1 ตัว
it("POST /register ถ้า password ไม่มีตัวพิมพ์ใหญ่ A-Z ควร error", async () => {
  const gmail = `Nanthawa.flux@gmail.com`;
  const res = await request(app).post("/register").send({
    gmail,
    username: "นันทวัน",
    password: "@n4nthaw4t",
  });
  expect(res.status).toBe(400);
  expect(res.body.message).toMatch(/Password/);
});

//เคสที่4 กรณีสมัครสมาชิกไม่สำเร็จเพราะ Password ต้องมีตัวเลข 0-9 อย่างน้อย 1 ตัว
it("POST /register ถ้า password ไม่มีตัวเลข 0-9 ควร error", async () => {
  const gmail = `Anay@gmail.com`;
  const res = await request(app).post("/register").send({
    gmail,
    username: "อนันยา",
    password: "AnayaKanpi@",
  });
  expect(res.status).toBe(400);
  expect(res.body.message).toMatch(/Password/);
});

//เคสที่5 กรณีสมัครสมาชิกไม่สำเร็จเพราะ Password ต้องมีอักขระพิเศษ อย่างน้อย 1 ตัว เช่น @$!%*?&
it("POST /register ถ้า password ไม่มีอักขระพิเศษ @$!%*?& ควร error", async () => {
  const gmail = `Atsadawu.toey@gmail.com`;
  const res = await request(app).post("/register").send({
    gmail,
    username: "อสดา",
    password: "Atsad4wut",
  });
  expect(res.status).toBe(400);
  expect(res.body.message).toMatch(/Password/);
});

//กรณีที่ผู้ใช้ไม่กรอกข้อมูลที่จำเป็น (gmail, username, password)
it("POST /register ถ้าไม่กรอก gmail, username, password ควร error", async () => {
  const res = await request(app).post("/register").send({});
  expect(res.status).toBe(400);
  expect(res.body.message).toMatch(/gmail, username, password/);
});