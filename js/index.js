var El = new Slim.Virtual(),
    times = new Slim.SyntheticValue(0),
    calc = [
        new Slim.SyntheticValue(0),
        new Slim.SyntheticValue(0),
        new Slim.SyntheticValue(0)
    ];
El.rootApp = document.querySelector('slim-app');
function state1(){
    var el = El.element('div', {id: '40'}, 
        El.element('h1', null, 'Bonjour le monde'),
        El.element('input', {value: calc[0], oninput: function(){
            console.log('[bien]')
            calc[0].value = this.value;
            calc[2].value = calc[0].value * 1 + calc[1].value * 1;
            El.setState();
        }}),
        El.element('input', {value: calc[1], oninput: function(){
            calc[1].value = this.value;
            calc[2].value = calc[0].value * 1 + calc[1].value * 1;
            El.setState();
        }}),
        El.element('input', {value: calc[2]})
    );
    El.render(el);
}

state1();

function state2(){
    var el = El.element('div', {id: '40'},
        El.element('h2', null, 'Bonjour le monde'),
        El.element('p', null, 'Le monde des fauchés !'),
        El.element('input', {type: 'text', placeholder: 'Votre nom'}),
        El.element('input', {type: 'password', placeholder: 'Mot de passe'}),
        El.element('button', {onclick: state1}, 'Click me !')
    );
    El.render(el, document.querySelector('slim-app'));
}