module.exports = (req, res, next) => {
    res.success = function (message, data, isUser) {
        res.status(200).send({
            response: { success: true, message: message || '', isUser: isUser === 0 ? 0 : 1, logout: 0 },
            data: data || {}
        });
    };
    next();
};