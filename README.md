## ขั้นตอนการติดตั้งและรันโปรเจกต์

1. **โคลนโปรเจกต์**
   ```bash
   git clone <repository-url>
   cd <project-folder>
2. **ติดตั้ง dependencies**
   ```bash
   npm install
4. **รันเซิร์ฟเวอร์**
   ```bash
   node server.js

## ขั้นตอนการใช้งาน API
1. **localhost:3000/**
   จะได้ข้อมูล User ทั้งหมด
2. **localhost:3000/register**
   ```json
   {
      "gmail" : "",
      "password" : "",
      "username" : ""
   }
3. **localhost:3000/login**
   ```json
   {
      "gmail": "",
      "password": ""
   }
4. **localhost:3000/clearDatabase**
   
## ขั้นตอนการใช้ Test ( Jest + SuperTest )
1. **รัน API เพื่อเคลียร์ database**
   ```bash
   localhost:3000/clearDatabase
2. **รันคำสั่งเพื่อลองทดสอบข้อมูลเทส**
   ```bash
   npm test tests/app.test.js
