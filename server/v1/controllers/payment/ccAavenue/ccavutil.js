var crypto = require('crypto');
module.exports.encrypt = async (plainText, workingKey) => {
	var hash = await crypto.createHash('md5').update(workingKey).digest('hex');
	console.log(hash,"encrypt");
      	var iv = crypto.randomBytes(16);	
	var cipher = crypto.createCipheriv('aes-256-cbc', hash, iv);
	var encoded = cipher.update(plainText,'utf8','hex');
	encoded += cipher.final('hex');
    	return encoded;
};


module.exports.decrypt = async (encText, workingKey) =>{
	var hash = await crypto.createHash('md5').update(workingKey).digest('hex');
	console.log(hash,"decrypt");
	var iv = crypto.randomBytes(16);	
	var decipher = await crypto.createDecipheriv('aes-256-cbc', hash, iv);
	console.log(decipher,"decipherdecipher")
    var decoded = decipher.update(encText,'hex','utf8');
	decoded += decipher.final('utf8');
    return decoded;
};

