results.DOM = [{target: {tagName: 'DIV'}}, {target: {tagName: 'BUTTON'}}, {target: {tagName: 'H2'}}];
HTTPEffects = [{url: URL}];


var HTTPEffects = [];
results.DOM.forEach(event => {
    if (event.target.tagName === 'BUTTON') { // фильтрация
        HTTPEffects.push({url: URL});        // трансформация
    }
});

var HTTPEffects = results.DOM
    .filter(event => event.target.tagName === 'BUTTON')
    .map(event => ({url: URL}));
