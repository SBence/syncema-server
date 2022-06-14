import { rooms, users } from "../../stores.js";

export default function addToRoom(roomID, userID, username) {
  users[userID] = {
    name: username,
    room: roomID,
  };

  if (rooms[roomID]) {
    rooms[roomID].members[userID] = {
      name: username,
    };
    console.log(`Added user: ${username} (ID: ${userID}) to room: ${roomID}`);
  } else {
    rooms[roomID] = {
      members: {
        [userID]: {
          name: username,
        },
      },
      queue: [],
      messages: [],
    };
    console.log(
      `Created room: ${roomID} for user: ${username} (ID: ${userID})`
    );
  }
}
