import {
    ormFindPendingUserByCriteria,
    ormDeletePendingUserByEmail,
    ormCreatePendingUser,
    ormFindPendingUserByEmail,
    ormDeletePendingUserBySocketId,
    ormFindAllPendingUsers,
    ormDeletePendingUserByDocId
} from "../models/orm.js";

export async function onDisconnect(socket) {
    try {
        console.log(`Socket disconnected: ${socket.id}`);

        // Delete pending user with socketId after disconnect, to prevent connecting with disconnected user
        const deletedUser = await ormDeletePendingUserBySocketId(socket.id);
        if (!deletedUser) {
            console.log(`No pending user of socket id ${socket.id} to delete when disconnected`);
            return;
        }

        console.log(`Deleted pending user ${deletedUser.email} after disconnect`);
        socket.emit('disconnect-while-match');
        return;
    } catch (error) {
        console.log(`Error when disconnect: ${error.message}`);
        socket.emit('error', error.message);
    }
}

export async function onCancelMatch(socket) {
    try {
        console.log(`Cancelling match: ${socket.id}`);

        // Delete pending user with socketId
        const deletedUser = await ormDeletePendingUserBySocketId(socket.id);
        if (!deletedUser) {
            // Cancel match means a pending user was in the queue, so there should be a pending user to delete, but its cant be deleted
            throw new Error(`No pending user of socket id ${socket.id} to delete when cancelling match`);
        }

        console.log(`Deleted pending user ${deletedUser.email} after cancelling match`);
        return;
    } catch (error) {
        console.log(`Error when cancelling match: ${error.message}`);
        socket.emit('error', error.message);
    }
};

export async function onCreateMatch(socket, data, io) {
    try {
        const { difficulties, categories, email, displayName } = data;
        const socketId = socket.id;
        const priority = categories.length; // Priority based on number of categories selected

        console.log(`Initiate create match by ${socket.id} (${displayName}), with data:`);
        console.log(data);

        // Get and log pending user queue
        const queue = await ormFindAllPendingUsers();
        console.log(`Pending user queue before matching:`);
        console.log(queue);

        // Check if user is already in pending users
        const existingUser = await ormFindPendingUserByEmail(email);
        if (existingUser) {
            // User exists, so don't create new pending user entry and just return finding-match event
            console.log(`User already in pending users`);
            socket.emit('finding-match');
            return;
        }

        // User does not exist
        console.log(`User not in pending users`);

        // Find if there is a match with a pending user
        const matchedUser = await ormFindPendingUserByCriteria({ difficulties, categories, email, displayName });
        if (!matchedUser) {

            // No match found
            console.log(`No matching users with the criteria, create new match`);

            // Create pending user entry
            console.log({ email, displayName, socketId, difficulties, categories, priority })
            const pendingUser = await ormCreatePendingUser({ email, displayName, socketId, difficulties, categories, priority });
            if (!pendingUser) {
                throw new Error(`Could not create pending user entry for new match`);
            } else {
                console.log(`Created pending user with details:`);
                console.log(pendingUser);
            }

            // Get and log pending user queue
            const queue = await ormFindAllPendingUsers();
            console.log(`Pending user queue after creating new pending user:`);
            console.log(queue);

            // Create timeout for deleting pending user
            setTimeout(async () => {
                console.log(`Timeout for pending user ${pendingUser.email}, try to delete pending user`);

                // Delete pending user after timeout based on docId
                const deletedUser = await ormDeletePendingUserByDocId(pendingUser._id);
                if (!deletedUser) {
                    console.log(`No pending user by docId to delete for timeout`);
                    return;
                }

                // Get and log pending user queue
                const queue = await ormFindAllPendingUsers();
                console.log(`Pending user queue after no match:`);
                console.log(queue);

                console.log(`Deleted pending user ${deletedUser.email} after timeout`);
                socket.emit('no-match');
                return;

            }, 50000); // 50 seconds (frontend has timer of 60secs, hence a 10 sec buffer fallback in case this service dies)

            // Emit finding-match event
            socket.emit('finding-match');
            return;
        } else {

            // Match found
            console.log(`Match found with ${matchedUser.displayName}, with details:`);
            console.log(matchedUser);

            // Delete pending user from database which should be in queue
            const deletedUser = await ormDeletePendingUserByEmail(matchedUser.email);
            if (!deletedUser) {
                throw new Error(`Could not delete matched user by email after match found`);
            }

            // Get and log pending user queue
            const queue = await ormFindAllPendingUsers();
            console.log(`Pending user queue after match:`);
            console.log(queue);

            // Find intersection of difficulties and categories in both users
            const commonDifficulties = difficulties.filter(d => matchedUser.difficulties.includes(d));
            const commonCategories = categories.filter(c => matchedUser.categories.includes(c));
            console.log(`Common difficulties: ${commonDifficulties}`);
            console.log(`Common categories: ${commonCategories}`);

            // Create match object
            const matchObject = {
                emails: [email, matchedUser.email],
                displayNames: [displayName, matchedUser.displayName],
                difficulties: commonDifficulties,
                categories: commonCategories,
            }
            console.log(`Match object:`);
            console.log(matchObject);

            // Emit found-match event to both users
            socket.emit("found-match", matchObject);
            io.to(matchedUser.socketId).emit("found-match", matchObject);
        }
    } catch (error) {
        console.log(`Error when creating match: ${error.message}`);
        socket.emit('error', error.message);
    }
}