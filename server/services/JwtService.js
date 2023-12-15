var jwt = require('jsonwebtoken');
var config = require('../config/config');
var issue = payload => {
    return jwt.sign(payload, config.SecretKey);
};
var verify = (token, cb) => {
    return jwt.verify(token, config.SecretKey, {}, cb);
};

module.exports = {
    issue: issue,
    verify: verify
};
