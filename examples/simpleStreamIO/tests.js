var EventEmitter = require('events');
var assert = require('assert');
var Component = require('./render');

var testResults = new EventEmitter();
var testEffects = Component.render(testResults);
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

['DOM', 'HTTP'].forEach(type => emitter.on(type, event => assert.deepEqual(event, expected.shift())));

testResults.emit('DOM', {target: {tagName: 'BUTTON'}});
testResults.emit('HTTP', {json: () => ({data: {image_url: 'SOME_URL'}})});

console.log('All Tests passed');
