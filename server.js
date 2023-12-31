const mongoose = require("mongoose");
require("dotenv").config();
const Document = require("./Document");
const {
  MONGO_CONNECTION_URL,
  DEFAULT_STRING,
  CLIENT_URL,
  PORT,
} = require("./constants");

mongoose
  .connect(MONGO_CONNECTION_URL)
  .then(() => console.log("MongoDB connection established!"));

const io = require("socket.io")(PORT, {
  cors: {
    origin: CLIENT_URL,
    method: ["GET", "POST"],
  },
});

io.on("connection", (socket) => {
  socket.on("get-document", async (documentId) => {
    const document = await findOrCreateDocument(documentId);
    socket.join(documentId);
    socket.emit("load-document", document.data);

    socket.on("send-changes", (delta) => {
      socket.broadcast.to(documentId).emit("receive-changes", delta);
    });

    socket.on("save-document", async (data) => {
      await Document.findByIdAndUpdate(documentId, { data });
    });
  });
});

const findOrCreateDocument = async (id) => {
  if (id === null) return;

  const document = await Document.findById(id);
  if (document) return document;
  return await Document.create({ _id: id, data: DEFAULT_STRING });
};
