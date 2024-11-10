import { onDisconnect, onCancelMatch, onCreateMatch, onConnect } from "./controller.js";

export async function socketHandler(io) {

    io.on("connection", async (socket) => {

        // Connect event
        await onConnect(socket, socket.handshake.auth.token);

        // Disconnect event
        socket.on("disconnect", async () => onDisconnect(socket));

        // Cancel match event
        socket.on("cancel-match", async () => onCancelMatch(socket));

        // Create match event
        socket.on("create-match", async (data) => onCreateMatch(socket, data, io));
    });

}