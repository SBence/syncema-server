/* export function addToRoom(rooms, socket, roomID, username) {
  if (rooms[roomID]) {
    rooms[roomID].members[socket.id] = {
      name: username,
    };
    console.log(`Added user ${username} (ID: ${socket.id}) to room: ${roomID}`);
  } else {
    rooms[roomID] = {
      // Add additional properties here
      members: {
        [socket.id]: {
          name: username,
        },
      },
    };
    console.log(
      `Created room: ${roomID} for user: ${username} (ID: ${socket.id})`
    );
  }
} */

export function addToRoom(rooms, socket, roomID, username) {
  if (rooms[roomID]) {
    rooms[roomID].members[socket.id] = username;
    console.log(`Added user ${username} (ID: ${socket.id}) to room: ${roomID}`);
  } else {
    rooms[roomID] = {
      // Add additional properties here
      members: {
        [socket.id]: username,
      },
    };
    console.log(
      `Created room: ${roomID} for user: ${username} (ID: ${socket.id})`
    );
  }
}

export function generateRoomID(length) {
  let result = "";
  let characters = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  for (let i = 0; i < length; i++) {
    result += characters.charAt(Math.floor(Math.random() * characters.length));
  }
  return result;
}
