var http = require('http'),
    fs = require('fs'),
    ccav = require('./ccavutil.js'),
    qs = require('querystring');

    module.exports.postReq = async (request,response) => {
    var body = '',
	workingKey = 'BB4D61208AC10DE904A1368BF317BB4A',	//Put in the 32-Bit Key provided by CCAvenue.
	accessCode = 'AVSF03IJ90BL46FSLB',			//Put in the Access Code provided by CCAvenue.
	encRequest = '',
	formbody = '';
				
    request.on('data', async (data) => {
    console.log(data,"postReq dataa")
	body += data;
	encRequest = await ccav.encrypt(body,workingKey); 
    console.log(encRequest,"encRequest");
	formbody = `<form id="nonseamless" method="post" name="redirect" action="https://secure.ccavenue.com/transaction/transaction.do?command=initiateTransaction"> <input type="hidden" id="encRequest" name="encRequest" value=${encRequest}><input type="hidden" name="access_code" id="access_code" value=${accessCode}><script language="javascript">document.redirect.submit();</script></form>`;
    });
				
    request.on('end', function () {
    response.writeHeader(200, {"Content-Type": "text/html"});
	response.write(formbody);
	response.end();
    });
   return; 
};
