'use strict';

var
	url      = require('url'),
	bool     = require('x-common').bool;

module.exports = function(req, res, next){
	var
		u      = req.url,
		target = u ? url.parse(u,true) : null,
		log    = req.log ? req.log(__filename) : {};
	
	var tmp;
	if( target && (tmp=target.query) && (tmp=tmp.redirect) && bool(tmp) ){
		
		u=u.replace(/redirect=[^&]*/,'');
	
		if(u.slice(-1)==='?') u=u.substring(0,u.length-1);
		
		log.info && log.info('redirect middleware, perfroms redirect to:'+u );
		
		// simple hack just to prevent delivering already cached version
		u+= ( ~u.indexOf('?') ? '&' : '?' )+'t='+ (+new Date());
		
		res.redirect(u);
		return;
	}
	
	next && next();
};
