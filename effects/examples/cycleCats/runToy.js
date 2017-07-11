var main = require('./toy');
var xs = require('xstream').default;
var Cycle = require('@cycle/xstream-run').default;
var fromEvent = require('xstream/extra/fromEvent').default;

function handleError(error) {
    console.error(error)
}

function handleComplete() {
    console.log('completed')
}

function HTTPToyDumbDriver(effects$) {
    var results$ = xs.create();
    effects$.addListener({
        next: eff => fetch(eff.url).then(res => results$.shamefullySendNext(res)),
        error: handleError,
        complete: handleComplete,
    });
    return results$;
}

function HTTPToyDriver(effects$) {
    return effects$
        .map(eff => xs.fromPromise(fetch(eff.url)))
        .flatten();
}

function DOMToyDumbDriver(effects$) {
    var results$ = xs.create();
    document.addEventListener('click', evt => results.shamefullySendNext(evt));
    effects$.addListener({
        next: eff => document.querySelector(eff.selector)[eff.op].apply(eff.args),
        error: handleError,
        complete: handleComplete
    });
    return results$;
}

function DOMToyDriver(effects$) {
    var results$ = fromEvent(document, 'click');
    effects$.addListener({
        next: eff => document.querySelector(eff.selector)[eff.op].apply(eff.args),
        error: handleError,
        complete: handleComplete
    });
    return results$;
}

Cycle.run(main, {
    DOM: DOMToyDriver,
    HTTP: HTTPToyDriver
});
