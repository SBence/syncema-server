import { addToRoom, generateRoomID } from "./roomUtils.js";

const rooms = {};

export default function eventHandler(io, socket) {
  socket.on("joinRoom", ({ name: username, roomID }) => {
    if (!roomID) {
      do {
        roomID = generateRoomID(4);
      } while (rooms[roomID]);
    }

    addToRoom(rooms, socket, roomID, username);

    socket.join(roomID);
    socket.emit("joinedRoom", roomID);
  });
}
