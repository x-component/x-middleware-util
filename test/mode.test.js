'use strict';

var
	vows   = require('vows'),
	assert = require('assert'),
	suite  = vows.describe('mode');

suite.addBatch({
	'mode with x-x-dummy header test': {
		topic: function() { return require('../mode')('dummy',false);
		},
		'with set dummy mode': function (mode_middleware) {
			var
				res = {
					addHeader: function(key, value) {
						assert.equal(key, 'Vary');
						assert.equal(value, 'x-x-dummy');
					}
				},
				req = {
					headers: { 'x-x-dummy': true }
				};
			mode_middleware(req,res,null);
			
			assert.equal(req.dummy.active, true);
		},
		'with unset dummy mode': function (mode_middleware) {
			var
				res = {
					addHeader: function(key, value) {
						assert.equal(key, 'Vary');
						assert.equal(value, 'x-x-dummy');
					}
				},
				req = { headers: {} , dummy: true };
				
			mode_middleware(req, res, null);
			
			assert.isUndefined(req.preview);
		}
	}
});

suite.export(module,{error:false});
