/**
 * Created by gcannata on 27/02/2015.
 */
var jacob =  require('jacob');
var parser = jacob.parser;
var engine =  require('./engine');
var junq = require('jacob/node_modules/junq');


var isAtom = engine.isAtom;
var Pred = engine.Pred;
var Rule = engine.Rule;
var buildPrologList = engine.buildPrologList;

    var tokenspecs = {
        definitions: {
            "digits": "[0-9]",
            "symbol-char": "[\\+\\-*/\\^<>=`~:\\.\\?@#\\$&]",
            "word": "[a-z]\\w*"
        },
        tokens: [
            {
                'regexp': '{digits}*\\.{digits}+', action: function () {
                this.jjval = parseFloat(this.jjtext);
                return 'float';
            }
            },
            {
                "regexp": '{digits}+', action: function () {
                this.jjval = parseInt(this.jjtext);
                return 'integer';
            }
            },
            {
                'regexp': '[_A-Z]\\w*', action: function () {
                return 'variable';
            }
            },
            {
                'regexp': ':\\-|\\?\\-', action: function () {
                return this.jjtext;
            }
            },
            {
                'regexp': '[\\[\\]\\{\\}\\|]', action: function () {
                return this.jjtext;
            }
            },
            {
                'regexp': '\\./\\s', action: function () {
                return 'fullstop';
            }
            },


            {
                id: 'name', 'regexp': '{word}|{symbol-char}+|[!]', action: function () {
                this.jjval = this.jjtext;
                return 'name';
            }
            },
            //quoted atoms
            {
                'regexp': '\'', action: function () {
                this.pushState('QUOTE');
                this.quote = '';
            }
            },
            {
                'regexp': '\'', action: function () {
                this.popState();
                this.jjtext = this.quote;
                this.jjval = this.jjtext;
                return 'name'
            }, state: 'QUOTE'
            },
            {
                'regexp': "[^\'\\\\]+", action: function () {
                this.quote += this.jjtext;
            }, state: 'QUOTE'
            },

            {
                'regexp': '\\\\', action: function () {
                this.pushState('ESCAPE')
            }, state: 'QUOTE'
            },
            {
                'regexp': '.', action: function () {
                this.popState();
                this.quote += this.jjtext;
            }, state: 'ESCAPE'
            },
            //strings
            {
                'regexp': '"', action: function () {
                this.pushState('STRING');
                this.quote = '';
            }
            },
            {
                'regexp': '[^"\\\\]+', action: function () {
                this.quote += this.jjtext;
            }, state: 'STRING'
            },
            {
                'regexp': '\\\\', action: function () {
                this.pushState('ESCAPE')
            }, state: 'STRING'
            },
            {
                'regexp': '"', action: function () {
                this.popState();
                this.jjtext = this.quote;
                this.jjval = this.jjtext;
                return 'string';
            }, state: 'STRING'
            },

            {
                'regexp': '\\', action: function () {
                this.pushState('ESCAPE')
            }, state: 'ESCAPE'
            },

            {
                'regexp': '\\s*', action: function () {
            }
            },//ignoring spaces
            {
                'regexp': '.', action: function () {
                return this.jjtext;
            }
            },
            {
                'regexp': '<<EOF>>', action: function () {
                console.log('end of file');
                return 'EOF';
            }
            }
        ]
    };

    var prologGrammar = {
        tokens: ['(', ')', 'name', 'variable', 'float', 'integer', ',', ':-', '?-', '.','[', ']', '|', ';', 'fullstop', 'string'],
        operators: [[':-','nonassoc',0],
                    [',','left',200]
                    ],
        productions: [

            ['Program', [parser.Repeat('Sentence', 'fullstop')], function (whatever) {
                return whatever;
            }],
            ['Sentence', ['Rule'], function (rules) {
                for (var i = 0; i < rules.length; i++)
                    this.engine.db.addRule(rules[i]);
            }],
            ['Sentence', ['Query'], function (disj) {
                return this.engine.executeQuery(disj);
            }],

            ['Rule', ['Term'], function (head) {
                return [new Rule(head, [])];
            }],
            ['Rule', ['Term', ':-', 'Body'], function (head, _, body) {
                var rules = junq(body).map(function (b) {
                    return new Rule(head, b);
                }).toArray();

                return rules;
            }],
            ['Body', ['Conjunction', parser.Repeat(';', 'Conjunction')], function (b, list) {
                //debugger;
                return [b].concat(env.junq(list).even().toArray());
            }],
            ['Conjunction', ['Term', parser.Repeat(',', 'Term')], function (t1, list) {
                var l = [t1].concat(env.junq(list).even().toArray());

                return l;
            }],
            ['Query', ['?-', 'Body'], function (_, disjunction) {

                return disjunction;

            }],
            ['Term', ['Functor', '(', 'Arguments', ')'], function (F, _, args) {
                return buildPred(F, args);
            }],


            ['Term', ['Constant'], function (C) {
                return buildAtom(C);
            }],
            ['Term', ['Variable'], function (C) {
                return C;
            }],
            ['Term', ['List'], function (L) {
                return L;
            }],
            ['Term', ['String'], function (s) {
                return s;
            }],
            ['Term', ['(', 'Term', ')'], function (_, term) {
                //return buildPred(op,[term1,term2]);
                return term;
            }],
            ['Functor', ['name'], function (F) {
                return F;
            }],
            ['Atom', ['name'], function (F) {
                return F;
            }],
            ['Op', ['name'], function (O) {
                return O;
            }],
            ['String', ['string'], function (S) {
                var charlist = junq(S.split('')).map(function (c) {
                    return c.charCodeAt(0);
                }).toArray();
                return buildPrologList(charlist);
            }],
            ['Arguments', ['Term', parser.Repeat(',', 'Term')], function (T1, Tail) {
                return [T1].concat(env.junq(Tail).even().toArray());
            }],
            ['Constant', [parser.Group(['Atom'], ['Number'])], function (C) {
                return C;
            }],
            ['Number', [parser.Optional(['Sign']), parser.Group(['float'], ['integer'])], function (sign, number) {
                if (!sign || sign === '+') return number;
                return -number;
            }],
            ['Sign', [parser.Group(['+'], ['-'])], function (C) {
                console.log('Sign');
                return C;
            }],
            ['Variable', ['variable'], function (V) {
                return V;
            }],
            ['List', ['[', ']'], function (el) {
                return emptylist;
            }],
            ['List', ['[', 'ListExpression', ']'], function (_, list) {
                return list;
            }],
            ['ListExpression', ['Term'], function (term) {
                return List('.', [term, emptylist]);
            }],
            ['ListExpression', ['Term', ',', 'ListExpression'], function (head, _, tail) {
                return List('.', [head, tail]);
            }],
            ['ListExpression', ['Term', '|', 'Term'], function (head, _, tail) {
                return List('.', [head, tail]);
            }]

            //,['Term',['Term','is','Term'],function(term1,op,term2){
            //    return buildPred(op,[term1,term2]);
            //}]
        ]
        , moduleName: 'PrologParser',
        mode: 'SLR'
    };

    function buildBinary(term1, op, term2) {
        return buildPred(op, [term1, term2]);
    }

    function buildUnary(op, term) {
        return buildPred(op, [term]);
    }

    function buildBinaryPrefix(op, term1, term2) {
        return buildPred(op, [term1, term2]);
    }




    var regexescape = /[-\/\\^$*+?.()|[\]{}]/g;
    var operatorre = /[xy]?f[xy]/;

    function addOperator(prec, type, name) {

        if (!type.match(operatorre)) {
            throw Error('Operator type ' + type + ' is not a valid operator type.');
        }

        //we convert prolog precedence (0-1200) to jacob (1200-0).
        var jacobprec = 1200 - prec;
        var assoc = 'nonassoc';
        if (type[0] === 'y') {
            assoc = 'left';
        }
        if (type[type.length - 1] === 'y') {
            assoc = 'right';
        }

        var unary = type.length === 2;

        var insertPoint;
        for (var i = 0; i < tokenspecs.tokens.length; i++) {
            if (tokenspecs.tokens[i].id === 'name') {
                insertPoint = i;
                break;
            }
        }

        var escaperegex = name.replace(regexescape, '\\$&');

        tokenspecs.tokens.splice(insertPoint, 0, {
            regexp: escaperegex, action: function () {
                return this.jjtext;
            }
        });
        prologGrammar.tokens.push(name);
        prologGrammar.operators.push([name, assoc, jacobprec]);

        if (unary) {
            prologGrammar.productions.push(['Term', [name, 'Term'], buildUnary]);
        } else {
            prologGrammar.productions.push(['Term', ['Term', name, 'Term'], buildBinary]);
            //prologGrammar.productions.push(['Term',[name,'(','Term',',','Term',')'],buildBinaryPrefix]);
        }

    }



    var builtins = require('./builtins');
    var emptylist = engine.emptylist;
    var List = engine.List;


    function buildPred(functor, args){
        if(builtins !== undefined){
            var arity = args.length;
            var key = functor + '_' + arity;
            var bi = builtins[key];
            if(bi!==undefined){
                return new bi(functor,args);
            }
            return new Pred(functor,args);
        }

    }

function buildAtom(functor){
    if(builtins !== undefined && isAtom(functor)){

        var key = functor + '_' + 0;
        var bi = builtins[key];
        if(bi!==undefined){
            return new bi(functor,[]);
        }

    }
    return functor;
}

var env = {junq: junq, jslog: engine};

function generateParser(engine){
    //List = builtins.List;
    //var parsersrc = jacob.parser.generateParser(prologGrammar);
    var p = new jacob.parser.Parser(prologGrammar);
    return p;
    return (function(){
        //console.log(parsersrc);
        var ex = module.exports;
        eval(parsersrc);
        module.exports = ex;
        return new PrologParser({junq: junq, jslog: engine});

    })();

}

function generateLexer(){

    return  new jacob.lexer.Lexer(tokenspecs);
}

exports.addOperator = addOperator;
exports.generateParser = generateParser;
exports.generateLexer = generateLexer;
exports.StringReader = jacob.StringReader;



