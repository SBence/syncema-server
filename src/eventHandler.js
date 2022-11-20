import { rooms, users } from "./stores.js";
import ytdl from "ytdl-core";
import secondsToString from "./utils/secondsToString.js";
import addToRoom from "./utils/room/addToRoom.js";
import generateID from "./utils/generateID.js";

const directionMap = {
  up: -1,
  down: 1,
};

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

    io.to(roomID).emit("queueUpdate", rooms[roomID].queue);
    io.to(roomID).emit("newMessage", rooms[roomID].messages);
  });

  socket.on("sendMessage", async ({ userID, content }) => {
    const username = users[userID].name;
    const roomID = users[userID].room;

    rooms[roomID].messages.push({
      author: username,
      content: content,
    });

    io.to(roomID).emit("newMessage", rooms[roomID].messages);
  });

  socket.on("enqueueVideo", async ({ userID, videoURL }) => {
    const username = users[userID].name;
    const roomID = users[userID].room;

    let details;
    try {
      details = (await ytdl.getBasicInfo(videoURL)).videoDetails;
    } catch (error) {
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
    const roomID = users[userID].room;

    rooms[roomID].queue.splice(videoIndex, 1);

    io.to(roomID).emit("queueUpdate", rooms[roomID].queue);
  });

  socket.on("moveVideo", async ({ userID, videoIndex, direction }) => {
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

  socket.on("seekTo", async ({ userID, time }) => {
    const roomID = users[userID].room;
    socket.to(roomID).emit("videoSeek", time);
    console.log(`Seeked to: ${time} by user: ${userID} in room: ${roomID}`);
  });

  socket.on("pauseVideo", async ({ userID }) => {
    const roomID = users[userID].room;
    if (rooms[roomID].playing) {
      socket.to(roomID).emit("videoPause");
      rooms[roomID].playing = false;
      console.log(`Video paused by user: ${userID} in room: ${roomID}`);
    }
  });

  socket.on("playVideo", async ({ userID }) => {
    const roomID = users[userID].room;
    if (!rooms[roomID].playing) {
      socket.to(roomID).emit("videoPlay");
      rooms[roomID].playing = true;
      console.log(`Video played by user: ${userID} in room: ${roomID}`);
    }
  });
}
