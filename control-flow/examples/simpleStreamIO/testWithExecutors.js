var EventEmitter = require('events');
var assert = require('assert');
var app = require('./appWithExecutors');
var testResults = {
    DOM: new EventEmitter(),
    HTTP: new EventEmitter()
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



Object.keys(testEffects).forEach(type => testEffects[type].addListener('EFFECT', event => assert.deepEqual({ event, type }, expected.shift())));

testResults.DOM.emit('EFFECT', {target: {tagName: 'BUTTON'}});
testResults.HTTP.emit('EFFECT', {json: () => ({data: {image_url: 'SOME_URL'}})});

console.log('All Tests passed');
