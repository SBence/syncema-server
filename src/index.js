import { createServer } from "http";
import { Server } from "socket.io";
import eventHandler from "./eventHandler.js";

const PORT = process.env.PORT || 3031;

const httpServer = createServer();

httpServer.listen(PORT, () =>
  console.log(`Listening on http://localhost:${PORT}...`)
);

const io = new Server(httpServer, {
  cors: {
    origin: "http://localhost:3000",
  },
});

io.on("connection", (socket) => {
  eventHandler(io, socket);
});
