const app = require("./app.js");
const http = require("http");
const port = 3000;

const server = http.createServer(app);

server.on("listening", () => {
  const addr = server.address();
  const bind = port
  console.log("Server started on " + bind);
});

server.listen(port);
