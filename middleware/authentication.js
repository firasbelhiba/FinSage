const jwt = require('jsonwebtoken');
const { UnauthorizedError } = require('../errors');

const authenticateUser = async (req, res, next) => {
    try {
        // Get token from header
        const authHeader = req.headers.authorization;
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            throw new UnauthorizedError('Authentication invalid');
        }

        const token = authHeader.split(' ')[1];

        try {
            const payload = jwt.verify(token, process.env.JWT_SECRET);
            // Attach the user to the request object
            req.user = {
                userId: payload.userId,
                name: payload.name
            };
            next();
        } catch (error) {
            throw new UnauthorizedError('Authentication invalid');
        }
    } catch (error) {
        next(error);
    }
};

module.exports = {
    authenticateUser
}; 