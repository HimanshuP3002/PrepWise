// requestValidationMiddleware.js - Request Validation Middleware

function requestValidationMiddleware(req, res, next) {
    // Validate the incoming request here
    // For example, check if required fields are present
    const { body } = req;

    if (!body.email || !body.password) {
        return res.status(400).json({ message: 'Email and password are required.' });
    }

    // Add more validations as needed

    next(); // Proceed to the next middleware or route handler
}

module.exports = requestValidationMiddleware;