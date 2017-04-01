var engine = require('../js/engine');

var fs = require('fs');

console.log('parsing...');

var program = document.getElementById('program').innerHTML;

var ret = engine.consult(program+'\r\n');
//ret = engine.parseProgram('?- template(S), solution(S).\n');

engine.registerPredicate('test',3,function(a,b,c){
   console.log('A: %s B: %s C: %s',a,b,c);
    return true;
});

ret = engine.executeQuery('assertz(a(1)),assertz(a(2)),retract(a(Z)),a(Y).');
console.log(ret);
