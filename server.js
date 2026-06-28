const express = require("express");
const http = require("http");
const { Server } = require("socket.io");

const app = express();
const server = http.createServer(app);
const io = new Server(server);

app.use(express.static("public"));

let users = {};
let events = [];
let commander = null;

io.on("connection", (socket) => {

  socket.on("join", (user) => {
    socket.user = user;

    if (user.role === "commander") {
      commander = socket.id;
    }

    users[user.name] = {
      ...user,
      socketId: socket.id
    };

    io.emit("users", users);
  });

  socket.on("gps", (data) => {
    users[data.name] = {
      ...users[data.name],
      lat: data.lat,
      lng: data.lng
    };

    events.push({ type:"GPS", ...data, time:Date.now() });

    io.emit("users", users);
  });

  socket.on("emergency", (data) => {
    events.push({ type:"EMERGENCY", ...data });
    io.emit("emergency", data);
  });

  socket.on("terminate", () => {
    if (socket.id !== commander) return;

    io.emit("terminated", events);
    users = {};
    events = [];
  });

});

server.listen(3000, () => {
  console.log("TACNET LIVE RUNNING");
});
