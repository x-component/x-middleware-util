'use strict';
/**
 * adds some utility functions to respons and request
 */
var
	url      = require('url'),
	extend   = require('x-common').extend,
	merge    = require('x-common').merge,
	set      = require('x-common').set;


var add_query = function(req,u){
	//debugger;
	if(req.query){
		try {
			u = url.parse(u,true);
			u = merge({},{query:req.query},u);
			delete u.search;
			u = url.format(u);
		} catch(e) {
			var log = req.log ? req.log(__filename) : {};
			log.error && log.error('can not parse/format redirect target url to add query parameters',{url:u});
		}
	}
	return u;
};

// request and response utilities
var util = function(req,res){
	
	var log = req.log ? req.log(__filename) : {};
	
	return {
		
		request: {
			/**
			 * get a header and add the name to response Vary headers,
			 * as the requested header will determine the response content.
			 *
			 * Note: besides the header value often also its absence
			 * will determine the response content. Therefore the header
			 * still should occur in the Vary headers.
			 * Only a correct response Vary header allows a correct
			 * web caching.
			 */
			vary : function(name){
				var h = this.headers ? this.headers[name] : void 0;
				
				res.addHeader('Vary',name);
				return h;
			},
			
			/**
			 * mix between accept and url matching to check for a specfic request type
			 * because accept is offten to wide in accepting results
			 * therefore express accept is no good enough
			 * p.e. a chrome request will lead to accept image
			 * also if it accepts html. While correct the sematics
			 * is problematic.
			 */
			type : function(options){
				options = set(options || 'html|xhr|js|css|json|image|pdf');
				
				req.headers = req.headers || {};
				
				var
					tmp,
					u                = this.url,
					isXMLHttpRequest = (tmp=req.headers['x-requested-with']) && /XMLHttpRequest/i.test(tmp),
					isWicketAjax     = (tmp=req.headers['wicket-ajax']) && /true/.test(tmp),
					accept           = req.headers['Accept'],
					accepts_html     = !accept || /html/i.test(accept), // no accept means implicit html ok
					// note: we must also match xhtml here
					// NOTE: chrome sends p.e. text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,* / *;q=0.8
					// thus image/webp
					// others do likely same things so
					// therefore image only if not html.
					
					check = {
						xhr   : isXMLHttpRequest || isWicketAjax,
						image : accept && /image/i .test(accept) && !accepts_html || /\.(gif|png|jpg|jpeg)(\?|$)/.test(u),
						json  : accept && /json/i  .test(accept)                  || /\.json(\?|$)/.test(u),
						js    : accept && /script/i.test(accept)                  || /\.js(\?|$)/  .test(u),
						css   : accept && /css/i   .test(accept)                  || /\.css(\?|$)/ .test(u),
						pdf   : accept && /pdf/i   .test(accept)                  || /\.pdf(\?|$)/ .test(u),
						xml   : accept && /xml/i   .test(accept)                  || /\.xml(\?|$)/ .test(u)
					};
					
					// note we can not test on !xml because browsers DO accept often xml and html and (xhtml)
				check.html = !check.xhr
				          && !check.image
				          && !check.json
				          && !check.js
				          && !check.css
				          && !check.pdf
				          && accepts_html;
				
				var result = false;
				for( var type in options ){
					result = result || ( options[type] && check[type] );
				}
				return result ? check : null;
			},
			/**
			 * rewrite the current url to the a new url, adapts also req.query
			 * optionally passes previous req.query {query:true}
			 */
			rewrite : function( u, options ){
				if( options && options.query ) u = add_query(req,u);
				this.url = u;
				var q = url.parse(u,true).query;
				if(q){
					this.query = q;
				} else {
					delete this.query;
				}
			}
		},
		
		response: {
			/**
			 * add an header value,
			 * if a value already exists then add this value to an array of values
			 * as node allows multiple header values within an array
			 * Note: this is case sensitive, as we can send in node with a specific
			 * upper/lower case name.
			 * Only values with same case in the name are merged into an array
			 * This is done for compatibility. Case should be ignored in HTTP,
			 * but some clients and other server don't ignore it. Thereby we should
			 * SEND in the common upper/lower case format: Set-Cooke, Content-Type etc.
			 */
			addHeader : function(n,v){
				// NOTE: do not do an add header here for 'set-cookie'
				// because the connect lib tried to "fix" set header and
				// already does already an "add header"
				// if you call "set header('set-cookie',value) :-/
				if( n.toLowerCase() === 'set-cookie' ) return this.setHeader(n,v);
				var value=this.getHeader(n) || [];
				if(!Array.isArray(value)) value=[value];
				this.setHeader(n,merge(value,v));
			},
			/**
			 * we wrap setHeader to check if
			 * some one tries to to set the heder after the response is al ready send
			 * this is a common mistake if a pipeline already has ended or there
			 * is some where a double next call. The first one sends the repsonse body
			 * The wrong second call tries to set headers and/or send again a body
			 * Note: the Etag setting of express connect sometimes produces this error
			 */
			setHeader : (function(original_setHeader){
				return function(name, value) {
					if (this._header) {
						log.error && log.error('tried to set header after headers where already send',{header:{name:name,value:value}});
						//debugger;
						return;
					}
					original_setHeader.call(this,name,value);
				};
			})(res.setHeader),
			
			/**
			 * get all headers set with their *case sensitive* names as they where set
			 * in node we can receive headers just in lower case, 
			 * but send them in the case we define
			 */
			getHeaders : function(){
				if( !this || !this._headers || !this._headerNames ){
					return;
				}
				
				var
					headers = {},
					keys = Object.keys(this._headers);
				
				for (var i = 0, l = keys.length; i < l; i++) {
					var key = keys[i];
					headers[this._headerNames[key]] = this._headers[key];
				}
				
				return headers;
			},
			
			/**
			 * wrap writeHead
			 * to convert the vary header to a single string if it is an array, as Varnish requires this format
			 * and set a header x-o2-set-cookies to inform varnish about all cookie names we set
			 * this way varnish doesn't need to parse the single set cookie headers
			 */
			writeHead : (function(original_writeHead){
				return function(){
					// convert vary to single string
					var vary = this._headers['vary'];
					if ( Array.isArray(vary) ) this._headers['vary']=vary.join(',');
					
					var set_cookie = this._headers['set-cookie'];
					if(set_cookie){
						if(!Array.isArray(set_cookie)) set_cookie=[set_cookie];
						
						//set a header x-o2-set-cookies to inform varnish about all cookie names we set
						var set_cookie_names = [];
						for( var i=0,l=set_cookie.length;i<l;i++){
							set_cookie_names.push( set_cookie[i].replace(/^\s*([^=]+)=.*$/,'$1') );
						}
						this.setHeader('x-o2-set-cookie', set_cookie_names.join(',') );
					}
					
					return original_writeHead.apply(this,arguments);
				};
			})(res.writeHead),
		}
	};
};


module.exports = extend(function (req, res, next) {  // if x-wapcli exists it must match
	
	var utils = util(req,res);
	extend(req,utils.request);
	extend(res,utils.response);
	
	next && next();
},{
	create:util,
	response :{
		/**
		 * this allows the to define a function which is
		 * called whenever a setHeader is called.
		 * On can therfore change/prevent certain header settings
		 * if perfromed by (external) middlewares lateron in the pipeline
		 *
		 * @param name of the header to filter, can also be an regexp
		 * @param filter(name,value) , called when name matches the name in setHeader
		 */
		setHeaderFilter:function(res, name,filter,options){
			if(typeof(name)==='string') name = new RegExp(name,'i');
			
			options = options || {};
			var log = options.log || {};
			
			res.setHeader=(function(original_setHeader){
				return function(n,v){ // name value
					if(n && v && name.test(n)){
						var new_v = filter ? filter(n,v) : void 0;
						if(new_v){
							log.debug && log.debug('filtered setHeader:',{name:n, value:v, new_value:new_v});
							return original_setHeader.call(this,n,new_v);
						} else {
							// case we simply prevent the change
							log.debug && log.debug('filtered setHeader prevented',{name:n, value:v});
							return;
						}
					}
					return original_setHeader.call(this,n,v);
				};
			})(res.setHeader);
		}
	}
});
