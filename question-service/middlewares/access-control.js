import ForbiddenError from "../errors/ForbiddenError";

const checkAdmin = (req, res, next) => {
    // Assuming 'isAdmin' is stored in cookies
    const isAdmin = req.cookies.isAdmin;

    if (isAdmin === 'true') {
        return next();
    } else {
        throw new ForbiddenError("You are not authorized to perform this action");
    }
}

export default checkAdmin;