var app = require('./toy');
var xs = require('xstream').default;
var assert = require('assert');
var testResults = {
    HTTP: xs.create(),
    DOM: xs.create()
};
var testEffects = app(testResults);
var expected = [
    {type: 'HTTP', event: {url: 'https://api.giphy.com/v1/gifs/random?api_key=dc6zaTOxFJmzC&tag=cats'}},
    {
        type: 'DOM',
        event: {
            selector: 'img', 
            op: 'setAttribute',
            args: ['src', 'SOME_URL']
        }
    }
];

Object.keys(testEffects).forEach(type => testEffects[type].addListener({
    next: event => assert.deepEqual({event, type}, expected.shift()),
    error: err => console.error(err),
    complete: () => console.log('Completed')
}));

testResults.DOM.shamefullySendNext({target: {tagName: 'BUTTON'}});
testResults.HTTP.shamefullySendNext({json: () => ({data: {image_url: 'SOME_URL'}})});
console.log('All Tests passed')