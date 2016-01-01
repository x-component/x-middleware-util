"use strict";
/**
 * adds some utility functions to respons and request
 */

var
	location = require('x-middleware-proxy').location;

module.exports = function(req, res, next){
	var log = req.log ? req.log(__filename) : {};
	
	res.addHeader=function(n,v){
		
		var value=this.getHeader(n) || [];
		if(!Array.isArray(value)) value=[value];
		value.push(v);
		this.setHeader(n,value);
		
	};
	
	// redefine redirect to accept relative urls
	// and automatically produce absolute urls with http server port / complete path
	var res_redirect = res.redirect;
	res.redirect = function( u ){
		res_redirect.call(this,location.absolutize(req,u));
	};
	
	var res_setHeader = res.setHeader;
	res.setHeader = function(name, value) {
		if (this._header) {
			log.error && log.error('tried to set header >'+name+':'+value+'< after headers where already send');
			//debugger;
			return;
		}
		res_setHeader.call(this,name,value);
	};
	
	next && next();
};
