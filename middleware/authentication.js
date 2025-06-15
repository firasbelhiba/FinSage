const jwt = require('jsonwebtoken');
const { UnauthorizedError } = require('../errors');

const authenticateUser = async (req, res, next) => {
    try {
        // Get token from header
        const authHeader = req.headers.authorization;
        console.log('Auth header:', authHeader);
        
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            console.log('Invalid auth header format');
            throw new UnauthorizedError('Authentication invalid');
        }

        const token = authHeader.split(' ')[1];
        console.log('Token:', token);

        try {
            const payload = jwt.verify(token, process.env.JWT_SECRET);
            console.log('Token payload:', payload);
            
            // Check if payload has the required fields
            if (!payload.id) {
                console.log('Missing id in token payload');
                throw new UnauthorizedError('Invalid token payload');
            }

            // Attach the user to the request object
            req.user = {
                userId: payload.id,
                name: payload.name
            };
            
            next();
        } catch (error) {
            console.error('JWT verification error:', error);
            throw new UnauthorizedError('Authentication invalid');
        }
    } catch (error) {
        console.error('Authentication error:', error);
        next(error);
    }
};

module.exports = {
    authenticateUser
}; 