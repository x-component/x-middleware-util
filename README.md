# x-middleware-util

[Build Status](https://travis-ci.org/x-component/x-middleware-util.png?v1.0.0)](https://travis-ci.org/x-component/x-middleware-util)

- [./condition.js](#conditionjs) 
- [./end.js](#endjs) 
- [./error.js](#errorjs) 
- [./index.js](#indexjs) 
- [./mode.js](#modejs) 
- [./redirect.js](#redirectjs) 
- [./util.js](#utiljs) 

# ./condition.js




# ./end.js




# ./error.js




# ./index.js




# ./mode.js

  - [bool](#bool)

## bool

  Test middleware, checks if differents modes are active
  e.g. header X-x-template

# ./redirect.js




# ./util.js

  - [url](#url)
  - [undefined.vary()](#undefinedvary)
  - [undefined.type()](#undefinedtype)
  - [undefined.rewrite()](#undefinedrewrite)
  - [undefined.addHeader()](#undefinedaddheader)
  - [setHeader](#setheader)
  - [undefined.getHeaders()](#undefinedgetheaders)
  - [writeHead](#writehead)
  - [undefined.setHeaderFilter():)](#undefinedsetheaderfilternamefilternamevalue)

## url

  adds some utility functions to respons and request

## undefined.vary()

  get a header and add the name to response Vary headers,
  as the requested header will determine the response content.
  
  Note: besides the header value often also its absence
  will determine the response content. Therefore the header
  still should occur in the Vary headers.
  Only a correct response Vary header allows a correct
  web caching.

## undefined.type()

  mix between accept and url matching to check for a specfic request type
  because accept is offten to wide in accepting results
  therefore express accept is no good enough
  p.e. a chrome request will lead to accept image
  also if it accepts html. While correct the sematics
  is problematic.

## undefined.rewrite()

  rewrite the current url to the a new url, adapts also req.query
  optionally passes previous req.query {query:true}

## undefined.addHeader()

  add an header value,
  if a value already exists then add this value to an array of values
  as node allows multiple header values within an array
  Note: this is case sensitive, as we can send in node with a specific
  upper/lower case name.
  Only values with same case in the name are merged into an array
  This is done for compatibility. Case should be ignored in HTTP,
  but some clients and other server don't ignore it. Thereby we should
  SEND in the common upper/lower case format: Set-Cooke, Content-Type etc.

## setHeader

  we wrap setHeader to check if
  some one tries to to set the heder after the response is al ready send
  this is a common mistake if a pipeline already has ended or there
  is some where a double next call. The first one sends the repsonse body
  The wrong second call tries to set headers and/or send again a body
  Note: the Etag setting of express connect sometimes produces this error

## undefined.getHeaders()

  get all headers set with their *case sensitive* names as they where set
  in node we can receive headers just in lower case, 
  but send them in the case we define

## writeHead

  wrap writeHead
  to convert the vary header to a single string if it is an array, as Varnish requires this format
  and set a header x-o2-set-cookies to inform varnish about all cookie names we set
  this way varnish doesn't need to parse the single set cookie headers

## undefined.setHeaderFilter(name:, filter(name,value):)

  this allows the to define a function which is
  called whenever a setHeader is called.
  On can therfore change/prevent certain header settings
  if perfromed by (external) middlewares lateron in the pipeline
