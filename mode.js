'use strict';
/**
 * Test middleware, checks if differents modes are active
 * e.g. header X-x-template
 */

var
	bool  = require('x-common').bool,
	merge = require('x-common').merge;

module.exports = function(mode, default_value, obj){
	
	default_value = default_value || false;
	
	return function (req, res, next) {
		var
			log    = req.log ? req.log(__filename) : {},
			header = 'x-x-' + mode,
			value  = req.headers ? req.headers[header] : null;
		
		if(value && typeof(value) === 'string' && value[0] === '{') {
			try{
				value = JSON.parse(value);
			} catch(e) {
				log.error && log.error('Problem while parsing header.',
					{
						header: {
							name : header,
							value: value
						},
						error: e
					}
				);
				value = null;
			}
		}
		
		res.addHeader && res.addHeader('Vary', header);
		
		var active = (!!value && typeof(value) === 'object') || req.headers && bool( req.headers[header], default_value );
		
		if(active) {
			req[mode] = merge({ active: true}, obj || {},  value || {});
			if(obj) { // merge headers into obj defaults
				for(var p in obj){
					header = 'x-x-' + mode + '-' + p;
					var parameter = 'x-x-' + mode + '-' + p;
					value  = req.param(parameter) || req.headers[header];
						
					res.addHeader && res.addHeader('Vary', header);
					if(value) {
						var o = req[mode];
						Object.defineProperty(o,p, {
							enumerable: true,
							get: (function(value){ return function() { return value; }; })(value),
							set: function(value) { }
						});
					}
				}
			}
			log.add && log.add((function(mode){
				return function () {
					return ({})[mode]=this[mode]; // jshint ignore:line
				};
			}(mode))); // add to log entries
		}else {
			delete req[mode];
		}
		
		next && next();
	};
};
