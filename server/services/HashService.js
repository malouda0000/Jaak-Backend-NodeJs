const Encrypt = require('cryptr');
const crypt = new Encrypt(require('../config/config').cryptHash);
module.exports = {
    encrypt: text => {
        return crypt.encrypt(text);
    },
    decrypt: text => {
        return crypt.decrypt(text);
    },
};
