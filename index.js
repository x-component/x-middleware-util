'use strict';

var extend = require('x-common').extend;

module.exports =extend(require('./util'),{
	redirect  : require('./redirect'),
	condition : require('./condition'),
	end       : require('./end'),
	mode      : require('./mode'),
	error     : require('./error')
});
