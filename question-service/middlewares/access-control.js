import ForbiddenError from "../errors/ForbiddenError.js";

const checkAdmin = (req, res, next) => {
    // Assuming 'isAdmin' is stored in cookies
    console.log(req.cookies);
    const { isAdmin }= req.cookies;

    if (isAdmin === 'true') {
        return next();
    } else {
        throw new ForbiddenError("You are not authorized to perform this action");
    }
}

export default checkAdmin;