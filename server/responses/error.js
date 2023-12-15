module.exports = (req, res, next) => {
    res.reject = function (message, data, isUser) {
        res.status(200).send({
            response: { success: false, message: message || '', isUser: isUser || 1, logout: 0 },
            data: data || {}
        });
    };
    next();
};