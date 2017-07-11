var Cycle = require('@cycle/xstream-run').default;
var makeDOMDriver = require('@cycle/dom').makeDOMDriver;
var makeHTTPDriver = require('@cycle/http').makeHTTPDriver;
var main = require('./real');

Cycle.run(main, {
    HTTP: makeHTTPDriver(),
    DOM: makeDOMDriver('body')
});
