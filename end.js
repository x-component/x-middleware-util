'use strict';

/** here we end the pipeline */

module.exports = function (req, res, next) {
	
	var log = req.log ? req.log(__filename) : {};
	
	if (log.debug) log.debug('end of the pipeline');
};
