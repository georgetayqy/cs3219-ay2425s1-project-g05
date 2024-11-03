import { ormCreateUser, ormDeleteUser, ormFindUser, ormUpdateUser, ormFindUserById } from '../models/user-orm.js';
import { comparePassword, hashPassword, generateAccessToken, checkPasswordStrength } from '../services.js';

export async function loginUser(req, res) {
    try {
        const { email, password } = req.body;

        // Check if email and password are provided
        if (!email || !password) {
            return res.status(400).json({ statusCode: 400, message: "Email and password are required" })
        }

        // Check if user exists (isDeleted is false)
        const user = await ormFindUser(email);
        console.log(user)
        if (!user) {
            return res.status(401).json({ statusCode: 401, message: "Incorrect email or password" })
        }

        // Delete password field from user object
        const returnedUser = { ...user }
        delete returnedUser.password

        // Check if password is correct
        const isCorrectPassword = await comparePassword(password, user.password);
        if (!isCorrectPassword) {
            return res.status(401).json({ statusCode: 401, message: "Incorrect email or password" })
        }

        // Generate access token
        const accessToken = generateAccessToken(user);
        console.log(accessToken)
        if (process.env.NODE_ENV === 'DEV') {
            res.cookie('accessToken', accessToken, { httpOnly: true, sameSite: 'none', secure: true }); // 60 minutes
        } else {
            res.cookie('accessToken', accessToken, { httpOnly: true }); // 60 minutes
        }

        return res.status(200).json({ statusCode: 200, message: "Login successful", data: { user: returnedUser } })
    } catch (error) {
        console.log(error)
        return res.status(500).json({ statusCode: 500, message: "Unknown server error" })
    }
}

export async function logoutUser(req, res) {
    try {
        // Clear access token cookie
        res.clearCookie('accessToken');
        return res.status(200).json({ statusCode: 200, message: "Logout successful" })
    } catch (error) {
        console.log(error)
        return res.status(500).json({ statusCode: 500, message: "Unknown server error" })
    }
}

export async function createUser(req, res) {
    try {
        const { email, password, displayName } = req.body;

        // Check if email, password and displayName are provided
        if (!email || !password || !displayName) {
            return res.status(400).json({ statusCode: 400, message: "Email, password and displayName are required" })
        }

        // Check if user already exists (isDeleted is false)
        const existingUser = await ormFindUser(email);
        console.log(existingUser)
        if (existingUser) {
            return res.status(409).json({ statusCode: 409, message: "Email already exists" })
        }

        // Check if password is strong enough
        if (!checkPasswordStrength(password)) {
            return res.status(400).json({
                statusCode: 400,
                message: "Password does not meet strength requirement. Passwords should have minimum 8 characters, with at least alphabets and numbers",
            });
        }

        // Hash password and create user
        const hashedPassword = hashPassword(password);
        const user = await ormCreateUser(email, hashedPassword, displayName);
        if (!user) {
            return res.status(500).json({ statusCode: 500, message: "Unknown server error" })
        }

        // Delete password field from user object
        const returnedUser = { ...user }
        delete returnedUser.password

        return res.status(201).json({ statusCode: 201, message: "New user created successfully", data: { user: returnedUser } })
    } catch (error) {
        console.log(error)
        return res.status(500).json({ statusCode: 500, message: "Unknown server error" })
    }
}

export async function deleteUser(req, res) { // SOFT DELETE
    try {
        const email = req.user.email; // Delete the user specified from token

        // Check if email is provided
        if (!email) {
            return res.status(400).json({ statusCode: 400, message: "Email is required" })
        }

        // Check if user exists
        const existingUser = await ormFindUser(email);
        console.log(existingUser)
        if (!existingUser) {
            return res.status(404).json({ statusCode: 404, message: "User not found" })
        }

        // Delete user (soft delete, only sets isDeleted to true)
        const user = await ormDeleteUser(email);
        if (!user) {
            return res.status(500).json({ statusCode: 500, message: "Unknown server error" })
        }

        // Delete password field from user object
        const returnedUser = { ...user }
        delete returnedUser.password

        // Clear access token cookie
        res.clearCookie('accessToken');

        return res.status(200).json({ statusCode: 200, message: "User deleted successfully", data: { user: returnedUser } })
    } catch (error) {
        console.log(error)
        return res.status(500).json({ statusCode: 500, message: "Unknown server error" })
    }
}

export async function changePassword(req, res) {
    try {
        const { password, newPassword } = req.body;
        const email = req.user.email; // Change password for logged in user from token

        // Check if email, password and newPassword are provided
        if (!email || !password || !newPassword) {
            return res.status(400).json({ statusCode: 400, message: "Email, password and newPassword are required" })
        }

        // Check if user exists
        const existingUser = await ormFindUser(email);
        console.log(existingUser)
        if (!existingUser) {
            return res.status(404).json({ statusCode: 404, message: "User not found" })
        }

        // Check if password is correct
        const isCorrectPassword = await comparePassword(password, existingUser.password);
        if (!isCorrectPassword) {
            return res.status(401).json({ statusCode: 401, message: "Incorrect old password needed to change password" })
        }

        // Check if password is strong enough
        if (!checkPasswordStrength(newPassword)) {
            return res.status(400).json({
                statusCode: 400,
                message: "Password does not meet strength requirement. Passwords should have minimum 8 characters, with at least alphabets and numbers",
            });
        }

        // Hash new password and update user
        const hashedNewPassword = hashPassword(newPassword);
        const updatedUser = await ormUpdateUser(email, { password: hashedNewPassword });
        if (!updatedUser) {
            return res.status(500).json({ statusCode: 500, message: "Unknown server error" })
        }

        // Delete password field from user object
        const returnedUser = { ...updatedUser }
        delete returnedUser.password

        return res.status(200).json({ statusCode: 200, message: "User password updated successfully", data: { user: returnedUser } })
    } catch (error) {
        return res.status(500).json({ statusCode: 500, message: "Unknown server error" })
    }
}

export async function changeDisplayName(req, res) {
    try {
        const { newDisplayName } = req.body;
        const email = req.user.email; // Change displayName for logged in user from token

        // Check if email and newDisplayName are provided
        if (!email || !newDisplayName) {
            return res.status(400).json({ statusCode: 400, message: "Email and newDisplayName are required" })
        }

        // Check if user exists
        const existingUser = await ormFindUser(email);
        console.log(existingUser)
        if (!existingUser) {
            return res.status(404).json({ statusCode: 404, message: "User not found" })
        }

        const updatedUser = await ormUpdateUser(email, { displayName: newDisplayName });
        if (!updatedUser) {
            return res.status(500).json({ statusCode: 500, message: "Unknown server error" })
        }

        // Delete password field from user object
        const returnedUser = { ...updatedUser }
        delete returnedUser.password

        return res.status(200).json({ statusCode: 200, message: "User display name updated successfully", data: { user: returnedUser } })
    } catch (error) {
        return res.status(500).json({ statusCode: 500, message: "Unknown server error" })
    }
}

export async function getUser(req, res) {
    try {
        const { id } = req.params;

        // Check if id is provided
        if (!id) {
            return res.status(400).json({ statusCode: 400, message: "Id is required" })
        }

        // Check if user exists
        const existingUser = await ormFindUserById(id);
        console.log(existingUser)
        if (!existingUser) {
            return res.status(404).json({ statusCode: 404, message: "User not found" })
        }

        // Delete password field from user object
        const returnedUser = { ...existingUser }
        delete returnedUser.password

        return res.status(200).json({ statusCode: 200, message: "User found by id", data: { user: returnedUser } })
    } catch (error) {
        return res.status(500).json({ statusCode: 500, message: "Unknown server error" })
    }
}