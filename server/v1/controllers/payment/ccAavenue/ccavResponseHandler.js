var http = require('http');
var fs = require('fs');
var ccav = require('./ccavutil.js');
var qs = require('querystring');
const workingKey = 'BB4D61208AC10DE904A1368BF317BB4A';

module.exports.postRes = async (request, response) => {
    let ccavEncResponse = '';
    let ccavResponse = ''; //Put in the 32-Bit Key provided by CCAvenue.

    // request.on('data', async (data) => {
    // 	ccavEncResponse += data;
    // 	console.log(data, "postRespostRespostRespostRespostRespostRespostRespostRespostRes")
    // 	ccavPOST = await qs.parse(ccavEncResponse);
    // 	var encryption = ccavPOST.encResp;
    // 	ccavResponse = await ccav.decrypt(encryption, workingKey);
    // 	console.log(ccavEncResponse, "ccavEncResponse");
    // });
    // var ccavPOST = ;
    let bodyData = request.body;
    for (let key in bodyData) {
        ccavEncResponse += `${key}=${bodyData[key]}&`;
    }
    ccavEncResponse = ccavEncResponse.substring(0, ccavEncResponse.length -1);
    console.log(ccavEncResponse,"ccavEncResponse")
    // var encryption = qs.parse(ccavEncResponse);
    console.log(typeof ccavEncResponse, ccavEncResponse, "ccavPost");
    ccavResponse = await ccav.decrypt(ccavEncResponse, workingKey);
    console.log(ccavEncResponse, "ccavEncResponse");

    request.on('end', function () {
        var pData = '';
        pData = '<table border=1 cellspacing=2 cellpadding=2><tr><td>'
        pData = pData + ccavResponse.replace(/=/gi, '</td><td>')
        pData = pData.replace(/&/gi, '</td></tr><tr><td>')
        pData = pData + '</td></tr></table>'
        htmlcode = '<html><head><meta http-equiv="Content-Type" content="text/html; charset=UTF-8"><title>Response Handler</title></head><body><center><font size="4" color="blue"><b>Response Page</b></font><br>' + pData + '</center><br></body></html>';
        response.writeHeader(200, {
            "Content-Type": "text/html"
        });
        response.write(htmlcode);
        response.end();
    });
};