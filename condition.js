'use strict';

var composite = require('x-middleware-composite');

module.exports = function(condition, middleware_true, middleware_false) {
	return function(req, res, next){
		if ( condition && condition(req, res) ) {
			return composite( middleware_true  )(req, res, next);
		} else {
			return composite( middleware_false )(req, res, next);
		}
	};
};
