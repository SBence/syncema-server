import { rooms, users } from "./stores.js";
import ytdl from "ytdl-core";
import secondsToString from "./utils/secondsToString.js";
import addToRoom from "./utils/room/addToRoom.js";
import generateID from "./utils/generateID.js";

const directionMap = {
  up: -1,
  down: 1,
};

function onRoomError(socket) {
  socket.emit("roomError");
}

export default function eventHandler(io, socket) {
  socket.on("joinRoom", async ({ roomID, userID, username }) => {
    if (!userID) {
      do {
        userID = generateID(4);
      } while (users[userID]);
    }

    if (!roomID) {
      do {
        roomID = generateID(4);
      } while (rooms[roomID]);
    }

    addToRoom(roomID, userID, username);

    socket.join(roomID);
    socket.emit("joinedRoom", { roomID, userID });

    socket.to(roomID).emit("memberJoined", username);
    io.to(roomID).emit("queueUpdate", rooms[roomID].queue);
    io.to(roomID).emit("newMessage", rooms[roomID].messages);
  });

  socket.on("sendMessage", async ({ userID, content }) => {
    if (!users[userID]) return onRoomError(socket);

    const username = users[userID].name;
    const roomID = users[userID].room;

    rooms[roomID].messages.push({
      author: username,
      content: content,
    });

    io.to(roomID).emit("newMessage", rooms[roomID].messages);
  });

  socket.on("enqueueVideo", async ({ userID, videoURL }) => {
    if (!users[userID]) return onRoomError(socket);

    const username = users[userID].name;
    const roomID = users[userID].room;

    let details;
    try {
      details = (await ytdl.getBasicInfo(videoURL)).videoDetails;
    } catch (error) {
      socket.emit("videoAddError");
      console.log(
        `Failed to get video info for URL: ${videoURL} queued by user: ${userID} in room: ${roomID}`
      );
      return error;
    }

    rooms[roomID].queue.push({
      url: videoURL,
      title: details.title,
      queuedByID: userID,
      queuedBy: username,
      uploader: details.ownerChannelName,
      duration: details.lengthSeconds
        ? secondsToString(details.lengthSeconds)
        : "Live",
      thumbnailURL: details.thumbnails[details.thumbnails.length - 2].url,
      channelImage:
        details.author.thumbnails[details.author.thumbnails.length - 1].url,
    });

    io.to(roomID).emit("queueUpdate", rooms[roomID].queue);
  });

  socket.on("removeVideo", async ({ userID, videoIndex }) => {
    if (!users[userID]) return onRoomError(socket);

    const roomID = users[userID].room;

    rooms[roomID].queue.splice(videoIndex, 1);

    io.to(roomID).emit("queueUpdate", rooms[roomID].queue);
  });

  socket.on("moveVideo", async ({ userID, videoIndex, direction }) => {
    if (!users[userID]) return onRoomError(socket);

    const roomID = users[userID].room;
    const roomQueue = rooms[roomID].queue;

    if (
      (videoIndex === 0 && direction === "up") ||
      (videoIndex === roomQueue.length - 1 && direction === "down")
    ) {
      return;
    }

    [roomQueue[videoIndex], roomQueue[videoIndex + directionMap[direction]]] = [
      roomQueue[videoIndex + directionMap[direction]],
      roomQueue[videoIndex],
    ];

    io.to(roomID).emit("queueUpdate", rooms[roomID].queue);
  });

  socket.on("makeFirst", async ({ userID, videoIndex }) => {
    if (!users[userID]) return onRoomError(socket);

    const roomID = users[userID].room;
    const roomQueue = rooms[roomID].queue;

    roomQueue.splice(0, videoIndex);

    io.to(roomID).emit("queueUpdate", rooms[roomID].queue);
  });

  socket.on("seekTo", async ({ userID, time }) => {
    if (!users[userID]) return onRoomError(socket);

    const roomID = users[userID].room;
    socket.to(roomID).emit("videoSeek", time);
    console.log(`Seeked to: ${time} by user: ${userID} in room: ${roomID}`);
  });

  socket.on("pauseVideo", async ({ userID }) => {
    if (!users[userID]) return onRoomError(socket);

    const roomID = users[userID].room;
    if (rooms[roomID].playing) {
      socket.to(roomID).emit("videoPause");
      rooms[roomID].playing = false;
      console.log(`Video paused by user: ${userID} in room: ${roomID}`);
    }
  });

  socket.on("playVideo", async ({ userID }) => {
    if (!users[userID]) return onRoomError(socket);

    const roomID = users[userID].room;
    if (!rooms[roomID].playing) {
      socket.to(roomID).emit("videoPlay");
      rooms[roomID].playing = true;
      console.log(`Video played by user: ${userID} in room: ${roomID}`);
    }
  });

  socket.on("disconnecting", () => {
    for (const room of socket.rooms) {
      socket.to(room).emit("memberLeft");
    }
  });

  socket.on("changeName", ({ userID, username }) => {
    if (!users[userID]) return onRoomError(socket);

    users[userID].name = username;
    rooms[users[userID].room].members[userID].name = username;
    socket.emit("nameChanged", username);
  });
}
