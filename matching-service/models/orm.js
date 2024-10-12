import {
    _findPendingUserByCriteria,
    _deletePendingUserByEmail,
    _createPendingUser,
    _findPendingUserByEmail,
    _deletePendingUserById,
    _findAllPendingUsers
} from "./repository.js";

export async function ormFindPendingUserByCriteria(criteria) {
    try {
        const pendingUser = await _findPendingUserByCriteria(criteria);
        if (!pendingUser) {
            console.log(`ORM: No matching users with the criteria`);
            return undefined;
        }
        return pendingUser.toObject();
    } catch (error) {
        console.log(`Error: could not find pending user due to: ${error}`);
        return undefined;
    }
}

export async function ormDeletePendingUserByEmail(email) {
    try {
        const deletedUser = await _deletePendingUserByEmail(email);
        if (!deletedUser) {
            console.log(`ORM: Could not delete pending user`);
            return undefined;
        }
        return deletedUser.toObject();
    } catch (error) {
        console.log(`Error: could not delete pending user due to: ${error}`);
        return undefined;
    }
}

export async function ormCreateRoom(data) {
    try {
        const room = await _createRoom(data);
        if (!room) {
            console.log(`ORM: Could not create room`);
            return undefined;
        }
        return room.toObject();
    } catch (error) {
        console.log(`Error: could not create room due to: ${error}`);
        return undefined;
    }
}

export async function ormFindPendingUserByEmail(email) {
    try {
        const pendingUser = await _findPendingUserByEmail(email);
        if (!pendingUser) {
            console.log(`ORM: Could not find pending user`);
            return undefined;
        }
        return pendingUser.toObject();
    } catch (error) {
        console.log(`Error: could not find pending user due to: ${error}`);
        return undefined;
    }
}

export async function ormCreatePendingUser(data) {
    try {
        const pendingUser = await _createPendingUser(data);
        if (!pendingUser) {
            console.log(`ORM: Could not create pending user`);
            return undefined;
        }
        return pendingUser.toObject();
    } catch (error) {
        console.log(`Error: could not create pending user due to: ${error}`);
        return undefined;
    }
}

export async function ormDeletePendingUserById(socketId) {
    try {
        const deletedUser = await _deletePendingUserById(socketId);
        if (!deletedUser) {
            console.log(`ORM: Could not delete pending user`);
            return undefined;
        }
        return deletedUser.toObject();
    } catch (error) {
        console.log(`Error: could not delete pending user due to: ${error}`);
        return undefined;
    }
}

export async function ormFindAllPendingUsers() {
    try {
        const queue = await _findAllPendingUsers();
        if (!queue) {
            console.log(`ORM: Cant get all pending users`);
            return undefined;
        }
        return queue;
    } catch (error) {
        console.log(`Error: could not find all pending users due to: ${error}`);
        return undefined;
    }
}