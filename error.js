'use strict';

var
	extend  = require('x-common').extend;

var Catched=function() {};
Catched.prototype = new Error('catched error');

var create = function(name,err){
	var e      = new Catched();
	e.name     = name || 'unknown';
	e.cause    = err;
	e.toString = function(){
		return this.name + ':' + Catched.toString.call(this);
	};
	return e;
};

module.exports = function(name){
	return extend(function(err, req, res, next) {
		// check if not alread catched and converted to an Error
		if(err && !(err instanceof Catched)){
			var log = req.log ? req.log(__filename) : {};
			log.debug && log.debug('catched error converted',{catched:{error:err,to:name}});
			err = create(name,err);
		}
		next && next(err);
	},{
		create: function(req,res,next){
			next && next(create(name));
		}
	});
};

