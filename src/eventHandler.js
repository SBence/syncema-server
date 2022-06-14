import { rooms, users } from "./stores.js";
import ytdl from "ytdl-core";
import secondsToString from "./utils/secondsToString.js";
import addToRoom from "./utils/room/addToRoom.js";
import generateID from "./utils/generateID.js";

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

    const details = (await ytdl.getBasicInfo(videoURL)).videoDetails;

    rooms[roomID].queue.push({
      URL: videoURL,
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
}
