/**
 * Created by gcannata on 11/03/2015.
 */
var engine = require('./engine');

var fs = require('fs');

console.log('parsing...');

fs.readFile('test/eightqueens.pl','utf8',function(err, data){
    if(err) throw err;
    var ret = engine.parseProgram(data+'\r\n');
    ret = engine.parseProgram('?- template(S), solution(S).\n');


    console.log(ret);
});



