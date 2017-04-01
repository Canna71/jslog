(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
/**
 * Created by gcannata on 28/02/2015.
 */

var engine = require('./engine');
var junq = require('jacob/node_modules/junq');



var builtins = new engine.DB();
module.exports = builtins;


var Pred = engine.Pred;
var Binary = engine.Binary;
var Rule = engine.Rule;
var addOperator = (require('./parser.js')).addOperator;
var isConstant = engine.isConstant;
var isVariable = engine.isVariable;
var isComp = engine.isComp;
var isAtom = engine.isAtom;
var isNumber = engine.isNumber;
var emptylist = engine.emptylist;

function Unify(_, args) {
    if (!(this instanceof Unify)) return new Unify('=', args);
    Binary.call(this, '=', args);
}
Unify.prototype = Object.create(Binary.prototype);
Unify.prototype.constructor = Unify;

Unify.prototype.call = function (engine) {
    if (engine.bc.unify(this.args[0], this.args[1])) {
        return true;
    }
    return false;
};

builtins['=_2'] = Unify;
addOperator(700, 'xfx', '=');



function Operand(op, args) {
    if (!(this instanceof Operand)) return new Operand(op, args);
    Binary.call(this, op, args);
}

Operand.prototype = Object.create(Binary.prototype);
Operand.prototype.constructor = Operand;

Operand.prototype.eval = function (bc) {
    if (typeof bc === 'undefined') debugger;
    var term1 = bc.eval(this.args[0]);
    var term2 = bc.eval(this.args[1]);

    switch (this.functor) {
        case '+':
            return term1 + term2;
        case '-':
            return term1 - term2;
        case '*':
            return term1 * term2;
        case '/':
            return (term1 / term2);
        case 'mod':
            return term1 % term2;
    }
};

builtins['+_2'] = Operand;
builtins['-_2'] = Operand;
builtins['*_2'] = Operand;
builtins['/_2'] = Operand;
builtins['mod_2'] = Operand;

addOperator(400, 'yfx', 'mod');
addOperator(400, 'yfx', '*');
addOperator(400, 'yfx', '/');
addOperator(500, 'yfx', '+');
addOperator(500, 'yfx', '-');

function Is(op, args) {
    if (!(this instanceof Is)) return new Is('is', args);
    Binary.call(this, 'is', args);
}

Is.prototype = Object.create(Binary.prototype);
Is.prototype.constructor = Is;

Is.prototype.call = function (engine) {
    if (engine.bc.unify(this.args[0], this.args[1].eval(engine))) {
        return true;
    }
    return false;
};

builtins['is_2'] = Is;
//TODO: use actual precedence
addOperator(700, 'xfx', 'is');

function Comparator(op, args) {
    if (!(this instanceof Comparator)) return new Comparator(op, args);
    Binary.call(this, op, args);
}
Comparator.prototype = Object.create(Binary.prototype);
Comparator.prototype.constructor = Comparator;

Comparator.prototype.call = function (engine) {
    var term1 = engine.bc.eval(this.args[0]);
    var term2 = engine.bc.eval(this.args[1]);

    var res = false;

    switch (this.functor) {
        case '<':
            res = term1 < term2;
            break;
        case '=<':
            res = term1 <= term2;
            break;
        case '=:=':
            res = term1 === term2;
            break;
        case '=\\=':
            res = (term1 !== term2);
            break;
        case '>=':
            res = term1 >= term2;
            break;
        case '>':
            res = term1 > term2;
            break;
    }

    return res;
};
//TODO: use actual precedences
builtins['<_2'] = Comparator;
builtins['=<_2'] = Comparator;
builtins['=:=_2'] = Comparator;
builtins['=\\=_2'] = Comparator;
builtins['>=_2'] = Comparator;
builtins['>'] = Comparator;
addOperator(700, 'xfx', '<');
addOperator(700, 'xfx', '=<');
addOperator(700, 'xfx', '=:=');
addOperator(700, 'xfx', '=\\=');
addOperator(700, 'xfx', '>=');
addOperator(700, 'xfx', '>');


/*
 1200	xfx	-->, :-
 1200	fx	:-, ?-
 1150	fx	dynamic, discontiguous, initialization, meta_predicate, module_transparent, multifile, public, thread_local, thread_initialization, volatile
 1100	xfy	;, |
 1050	xfy	->, *->
 1000	xfy	,
 990	xfx	:=
 900	fy	\+
 700	xfx	<, =, =.., =@=, \=@=, =:=, =<, ==, =\=, >, >=, @<, @=<, @>, @>=, \=, \==, as, is, >:<, :<
 600	xfy	:
 500	yfx	+, -, /\, \/, xor
 500	fx	?
 400	yfx	*, /, //, div, rdiv, <<, >>, mod, rem
 200	xfx	**
 200	xfy	^
 200	fy	+, -, \
 100	yfx	.
 1	fx	$
 */

function Call_1(_, args) {
    if (!(this instanceof Call_1)) return new Call_1('call', args);
    Pred.call(this, 'call', args);
    //this.head = this.args[0];
    //this.tail = this.args[1];
}

Call_1.prototype = Object.create(Pred.prototype);
Call_1.prototype.constructor = Call_1;

Call_1.prototype.call = function (engine) {
    var goal = engine.bc.resolveTerm(this.args[0]);
    //TODO: check arguments
    return {goals: [goal], bc: engine.bc, rule: 0, nrules: 0};
};

builtins['call_1'] = Call_1;

function Fail_0(_, args) {
    if (!(this instanceof Fail_0)) return new Fail_0('fail', args);
    Pred.call(this, 'fail', []);
    //this.head = this.args[0];
    //this.tail = this.args[1];
}

Fail_0.prototype = Object.create(Pred.prototype);
Fail_0.prototype.constructor = Fail_0;

Fail_0.prototype.call = function (engine) {

    return false;
};

builtins['fail_0'] = Fail_0;


function Cut_0() {
    if (!(this instanceof Cut_0)) return new Cut_0();
    Pred.call(this, '!', [])
}

Cut_0.prototype = Object.create(Pred.prototype);
Cut_0.prototype.constructor = Cut_0;

Cut_0.prototype.call = function (engine) {
    if (this.topstack) {
        var i = engine.redostack.indexOf(this.topstack);
        if (i < 0) {
            throw Error('Choice point not found!');
        }
        engine.redostack = engine.redostack.slice(0, i + 1);
    } else {
        engine.redostack.length = 0
    }
    return true;
};

Cut_0.prototype.renameVars = function (acc) {
    return new Cut_0();
};

Cut_0.prototype.init = function (engine) {
    this.topstack = engine.redostack[engine.redostack.length - 1];
};

builtins['!_0'] = Cut_0;

/*
 function Not_1(_,args){
 if (!(this instanceof Not_1)) return new Not_1('not',args);
 Pred.call(this,'not',args);
 //this.head = this.args[0];
 //this.tail = this.args[1];
 }

 Not_1.prototype = Object.create(Pred.prototype);
 Not_1.prototype.constructor = Not_1;

 Not_1.prototype.call = function(engine){
 //TODO: check arguments
 if(engine.startrule===0)
 return {goals: [Call_1('call',[this.args[0]]),Cut_0(),Fail_0()], bc: engine.bc, rule: 0, nrules: 2};
 else //this means the above goal failed, so the negation is true
 return {goals: [], bc: engine.bc, rule: 0, nrules: 0};
 };

 builtins['not_1'] = Not_1;
 */

builtins.addRule(Rule(Pred('not', ["G"]), [Call_1('call', ["G"]), Cut_0(), Fail_0()]));
builtins.addRule(Rule(Pred('not', ["G"]), []));

builtins.addRule(Rule(Pred('\\+', ["G"]), [Call_1('call', ["G"]), Cut_0(), Fail_0()]));
builtins.addRule(Rule(Pred('\\+', ["G"]), []));

addOperator(900, 'fy', '\\+');

function Identical(name, args) {
    if (!(this instanceof Identical)) return new Identical(name, args);
    Pred.call(this, '==', args)
}

Identical.prototype = Object.create(Pred.prototype);
Identical.prototype.constructor = Identical;

var equals = function (bc, term1, term2) {
    if (isConstant(term1) && isConstant(term2)) {
        return term1 === term2;
    }
    if (isVariable(term1) && isVariable(term2)) {
        return term1 === term2 || bc[term1] === term2 ||
            bc[term2] === term1;
    }
    if (isComp(term1) && isComp(term2)) {
        if (term1.key === term2.key) {
            for (var i = 0; i < term1.arity; i++) {
                if (!equals(bc, term1.args[i], term2.args[i]))
                    return false;
            }
            return true;
        }
    }
    return false;
};

Identical.prototype.call = function (engine) {
    var term1 = engine.bc.resolveTerm(this.args[0]);
    var term2 = engine.bc.resolveTerm(this.args[1]);
    return equals(engine.bc, term1, term2);
};


builtins['==_2'] = Identical;
addOperator(700, 'xfx', '==');

function NotIdentical(name, args) {
    if (!(this instanceof NotIdentical)) return new NotIdentical(name, args);
    Pred.call(this, '==', args)
}

NotIdentical.prototype = Object.create(Pred.prototype);
NotIdentical.prototype.constructor = NotIdentical;

NotIdentical.prototype.call = function (engine) {
    var term1 = engine.bc.resolveTerm(this.args[0]);
    var term2 = engine.bc.resolveTerm(this.args[1]);
    var res = equals(engine.bc, term1, term2);
    return !res;
};

builtins['\\==_2'] = NotIdentical;
addOperator(700, 'xfx', '\\==');




function Atom_1(name, args) {
    if (!(this instanceof Atom_1)) return new Atom_1(name, args);
    Pred.call(this, 'atom', args)
}

Atom_1.prototype = Object.create(Pred.prototype);
Atom_1.prototype.constructor = Atom_1;

Atom_1.prototype.call = function (engine) {
    var term = engine.bc.resolveTerm(this.args[0]);
    return isAtom(term);
};
builtins['atom_1'] = Atom_1;

function Integer_1(name, args) {
    if (!(this instanceof Integer_1)) return new Integer_1(name, args);
    Pred.call(this, 'integer', args)
}

function isInteger(n){
    return isNumber(n) && (n % 1 === 0);
}

Integer_1.prototype = Object.create(Pred.prototype);
Integer_1.prototype.constructor = Integer_1;

Integer_1.prototype.call = function (engine) {
    var term = engine.bc.resolveTerm(this.args[0]);
    return isInteger(term);
};

builtins['integer_1'] = Integer_1;

function Float_1(name, args) {
    if (!(this instanceof Float_1)) return new Float_1(name, args);
    Pred.call(this, 'float', args)
}

Float_1.prototype = Object.create(Pred.prototype);
Float_1.prototype.constructor = Float_1;

Float_1.prototype.call = function (engine) {
    var term = engine.bc.resolveTerm(this.args[0]);
    return isNumber(term) && (term % 1 !== 0);
};

builtins['float_1'] = Float_1;

function Number_1(name, args) {
    if (!(this instanceof Number_1)) return new Number_1(name, args);
    Pred.call(this, 'number', args)
}

Number_1.prototype = Object.create(Pred.prototype);
Number_1.prototype.constructor = Number_1;

Number_1.prototype.call = function (engine) {
    var term = engine.bc.resolveTerm(this.args[0]);
    return isNumber(term);
};

builtins['number_1'] = Number_1;

function Atomic_1(name, args) {
    if (!(this instanceof Atomic_1)) return new Atomic_1(name, args);
    Pred.call(this, 'atomic', args)
}

Atomic_1.prototype = Object.create(Pred.prototype);
Atomic_1.prototype.constructor = Atomic_1;

Atomic_1.prototype.call = function (engine) {
    var term = engine.bc.resolveTerm(this.args[0]);
    return isConstant(term);
};

builtins['atomic_1'] = Atomic_1;

function Var_1(name, args) {
    if (!(this instanceof Var_1)) return new Var_1(name, args);
    Pred.call(this, 'var', args)
}

Var_1.prototype = Object.create(Pred.prototype);
Var_1.prototype.constructor = Var_1;

Var_1.prototype.call = function (engine) {
    var term = engine.bc.resolveTerm(this.args[0]);
    return isVariable(term);
};

builtins['var_1'] = Var_1;

function Nonvar_1(name, args) {
    if (!(this instanceof Nonvar_1)) return new Nonvar_1(name, args);
    Pred.call(this, 'nonvar', args)
}

Nonvar_1.prototype = Object.create(Pred.prototype);
Nonvar_1.prototype.constructor = Nonvar_1;

Nonvar_1.prototype.call = function (engine) {
    var term = engine.bc.resolveTerm(this.args[0]);
    return !isNonvariable(term);
};

builtins['nonvar_1'] = Nonvar_1;


function Write_1(name, args) {
    if (!(this instanceof Write_1)) return new Write_1(name, args);
    Pred.call(this, 'write', args)
}

Write_1.prototype = Object.create(Pred.prototype);
Write_1.prototype.constructor = Write_1;

Write_1.prototype.call = function (engine) {
    var term = engine.bc.resolveTerm(this.args[0]);
    console.log(term.toString());
    return true;
};

builtins['write_1'] = Write_1;
//TODO: write an ad hoc toString method for display
builtins['display_1'] = Write_1;

function Functor_3(name, args) {
    if (!(this instanceof Functor_3)) return new Functor_3(name, args);
    Pred.call(this, 'functor', args)
}

Functor_3.prototype = Object.create(Pred.prototype);
Functor_3.prototype.constructor = Functor_3;

Functor_3.prototype.call = function (engine) {
    var term = engine.bc.resolveTerm(this.args[0]);
    var name = engine.bc.resolveTerm(this.args[1]);
    var arity = engine.bc.resolveTerm(this.args[2]);
    if(!isVariable(term)){
        //TODO: unify head with name and arity
        if(isAtom(term)){
            return engine.bc.unify(term,name) && engine.bc.unify(0,arity);
        }
        if(isComp(term)){
            return engine.bc.unify(term.functor,name) && engine.bc.unify(term.arity,arity);
        }
        throw new Error('atom or complex term expected');
    } else {
        //term is an unbound variable
        if(isVariable(name) || isVariable(arity))
            throw Error('Arguments not sufficiently instantiated!');
        if(!isAtom(name)) throw Error('atom expected');
        if(!isInteger(arity)) throw Error('intger expected');
        var vars = [];
        junq.range(arity).forEach(function(){vars.push(engine.getNewVarName());});
        var skeleton = new Pred(name,vars);
        return engine.bc.unify(term,skeleton);
    }

};

builtins['functor_3'] = Functor_3;

function Univ_2(name, args) {
    if (!(this instanceof Univ_2)) return new Univ_2(name, args);
    Pred.call(this, '=..', args)
}

Univ_2.prototype = Object.create(Pred.prototype);
Univ_2.prototype.constructor = Univ_2;
Univ_2.prototype.call = function (e) {
    var term = e.bc.resolveTerm(this.args[0]);
    var list = e.bc.resolveTerm(this.args[1]);


    if(engine.isList(list)){
        list = list.toList();
        var functor = list.shift();
        var args = list;
        var skel = new Pred(functor,args);
        return e.bc.unify(term, skel);
    } else //list must be a variable
    {
        if(isVariable(term)) throw Error('Arguments are not sufficiently instantiated');
        var tmp = [];
        if(engine.isComp(term)){
            tmp.push(term.functor);
            tmp.append(term.args);
        }else{
            tmp.append(term);
        }
        tmp = engine.buildPrologList(tmp);
        return e.bc.unify(tmp, list);

    }
};

builtins['=.._2'] = Univ_2;
addOperator(700, 'xfx', '=..');

function Asserta_1(name, args){
    if (!(this instanceof Asserta_1)) return new Asserta_1(name, args);
    Pred.call(this, 'asserta', args)
}
Asserta_1.prototype = Object.create(Pred.prototype);
Asserta_1.prototype.constructor = Asserta_1;
Asserta_1.prototype.call = function (e) {
    var term = e.bc.resolveTerm(this.args[0]);
    e.db.addRule(new Rule(term,[]),true);
    return true;
};
builtins['asserta_1']=Asserta_1;

function Assertz_1(name, args){
    if (!(this instanceof Assertz_1)) return new Assertz_1(name, args);
    Pred.call(this, 'assertz', args)
}
Assertz_1.prototype = Object.create(Pred.prototype);
Assertz_1.prototype.constructor = Assertz_1;
Assertz_1.prototype.call = function (e) {
    var term = e.bc.resolveTerm(this.args[0]);
    if(term.key === ':-_2'){
        throw Error('Sorry, asserting rules is not possible.');
        var head = term.args[0];
        //TODO: flatten
        var body = term.args[1];
        debugger;
    }else{
        e.db.addRule(new Rule(term,[]),false);
    }

    return true;
};
builtins['assertz_1']=Assertz_1;


function Retract_1(name, args){
    if (!(this instanceof Retract_1)) return new Retract_1(name, args);
    Pred.call(this, 'retract', args)
}
Retract_1.prototype = Object.create(Pred.prototype);
Retract_1.prototype.constructor = Retract_1;
Retract_1.prototype.call = function (e) {
    var term = /*e.bc.resolveTerm*/(this.args[0]);
    if(isComp(term)){
        var rules = e.db.rules[term.key];

        for (var i = 0; i < rules.length; i++) {
            var cxt = e.bc.createChild();

            var rule = rules[i].renameVars(this,{});

            if (cxt.unify(term, rule.head)) {
                //retract rule
                rules.splice(i,1);
                e.bc=cxt;
                break;
            }
        }
    }
    else{
        throw Error('Compound Expected');
    }

    return true;
};
builtins['retract_1']=Retract_1;
},{"./engine":2,"./parser.js":3,"jacob/node_modules/junq":19}],2:[function(require,module,exports){
/**
 * Created by gcannata on 21/02/2015.
 */

var uppercase = /[A-Z_]/;
var junq = require('jacob/node_modules/junq');
var emptylist = '[]';

function isVariable(term) {
    return (typeof(term) === 'string' && (uppercase.exec(term[0])));
}

function isComp(term) {
    return term instanceof Pred;
}

function isAtomic(term) {
    return !isComp(term);
}

function isAtom(term) {
    return (typeof(term) === 'string' && term[0] === term[0].toLowerCase() && term[0] !== '_');
}

function isNumber(term) {
    return (typeof term === 'number');
}

function isConstant(term) {
    if(term.arity){
        if (term.arity>0)return false;
        return true;
    }
    return isAtom(term) || isNumber(term);
}

function isList(term){
    return isComp(term) && term.key === '._2';
}

//TODO: put inside binding context
function isGround(term, bc){
    if(!bc){debugger;}
    if(isConstant(term)){
        return true;
    }
    if(isComp(term)){
        return term.isGround(bc);
    }
    return bc.isGround(term);
}


function Pred(name, args) {
    if (!(this instanceof Pred)) {
        //return new (Pred.bind.apply(Pred, [null].concat(Array.prototype.slice.apply(arguments))))();
        return new Pred(name, args)
    }

    this.functor = name;
    this.args = args;
/*    for (i = 1; i < args.length; i++) {

        this.args.push(arguments[i]);

    }*/

    this.arity = this.args.length;
    this.fullName = this.functor + '/' + this.arity;
    this.key = this.functor + '_' + this.arity;
}

Pred.prototype.renameVars = function (engine, ctx) {
    var self = this;
    var newArgs = this.args.map(function (a) {
        if (isVariable(a)) {

            if (a === '_' || ctx[a] === undefined) {
                var name = engine.getNewVarName();
                ctx[a] = name;
                //Test to see if it gets checked out
            }
            return ctx[a];
        }
        if (isComp(a)) {
            return a.renameVars(engine, ctx);
        }
        return a;
    });
    return new this.constructor(this.functor, newArgs);
};

Pred.prototype.init = function(engine){

};

Pred.prototype.eval = function(engine){
    throw Error(this.toString() + ' is not a function.');
};

Pred.prototype.toString = function(){
    return this.functor+'('+this.args.join(',')+')';
};

Pred.prototype.isGround = function(bc){
    for(var a = 0, arg=this.args[a];a<this.args.length;a++){
       if(!isGround(arg,bc)) return false;
    }
    return true;
};

Pred.prototype.resolve = function(bc){
    var args = [];
    for(var a = 0 ;a<this.args.length;a++){
        var arg = this.args[a];
        args.push(bc.resolveTerm(arg));
    }
    return new this.constructor(this.functor, args);
};



function Binary(name, args){
    if (!(this instanceof Binary)) {
        return new Binary(name,args)
    }
    Pred.call(this,name,args);
}
Binary.prototype = Object.create(Pred.prototype);
Binary.prototype.constructor = Binary;

Binary.prototype.toString = function(){
    return this.args[0]+' '+this.functor + ' ' + this.args[1].toString();
};

function Unary(name, args){
    if (!(this instanceof Unary)) {
        return new Unary(name,args)
    }
    Pred.call(this,name,args);
}
Unary.prototype = Object.create(Pred.prototype);
Unary.prototype.constructor = Unary;

Unary.prototype.toString = function(){
    return this.args[0]+this.functor + this.args[1].toString();
};




function BindingContext() {

}

function createBindingContext(parent) {
    if (!parent) return new BindingContext();

    function BindingContext1() {
    }

    BindingContext1.prototype = parent;
    return new BindingContext1();

}

BindingContext.prototype.unify = function unify(term1, term2) {
    term1 = this.resolveTerm(term1);
    term2 = this.resolveTerm(term2);
    if (isConstant(term1) && isConstant(term2)) {
        return term1 === term2;
    }
    //TODO occur check
    if (isVariable(term1)) {
        this[term1] = term2;
        return true;
    }
    if (isVariable(term2)) {
        this[term2] = term1;
        return true;
    }
    if (isComp(term1) && isComp(term2)) {
        //comparing key should be enough
        if (term1.key === term2.key && term1.functor === term2.functor && term1.arity === term2.arity) {
            for (var i = 0; i < term1.arity; i++) {
                if (!unify.call(this, term1.args[i], term2.args[i]))
                    return false;
            }
            return true;
        }
    }
    return false;
};

BindingContext.prototype.createChild = function(){
  return createBindingContext(this);
};

BindingContext.prototype.resolveTerm = function resolveTerm(term) {
    if(isVariable(term)){
        var val = this[term];
        if (val) return this.resolveTerm(val);
        else return term;
    }
    if(isConstant(term)) return term;
    return term.resolve(this);

};

BindingContext.prototype.resolveOwn = function resolveOwn(variable) {
    for (var name in this) {
        if (this.hasOwnProperty(name)) {
            if (isVariable(this[name]))
                this[name] = this.resolveTerm(name);
        }
    }
};


BindingContext.prototype.unbindOwn = function unbindOwn(variable) {
    for (var name in this) {
        if (this.hasOwnProperty(name) && (isVariable(this[name]))) {
            delete this[name];
        }
    }
};

BindingContext.prototype.resolveAll = function resolveAll(variable) {
    for (var name in this) {
        //if(name === 'S') debugger;
        //if (isVariable(this[name]))
        if(typeof this[name] !== 'function')
            this[name] = this.resolveTerm(name);

    }
};

BindingContext.prototype.eval = function(term){
    var v = this.resolveTerm(term);
    if(isConstant(v)) return v;
    if(term.eval)
        return term.eval(this);
    throw Error(term.toString() + ' is not evaluable.')
};

BindingContext.prototype.isGround = function(variable){
    var v = variable;
    while(isVariable(v)){
        if(!this[v]) return false;
        v = this[v];
        if( v === variable ) return false; //cycle
    }
    return isGround(v,this);
};

function Rule(head, tail) {
    if (!(this instanceof Rule)) return new Rule(head, tail);
    //if(! head instanceof Pred) throw Error('Head must be a predicate');

    this.head = head;
    this.tail = tail;
}

Rule.prototype.renameVars = function (engine, cxt) {

    var ret = new Rule(this.head.renameVars(engine,cxt), this.tail.map(function (pred) {
        try{
            return pred.renameVars(engine, cxt);
        }
        catch(e){
            debugger;
        }
    }));


    return ret;

};

Rule.prototype.toString = function(){
    return this.head.toString()+ ' :- ' + this.tail.join(',')+'.';
};

function List(_, args) {
    if (!(this instanceof List)) return new List('.', args);
    Pred.call(this, '.', args);
    //this.head = this.args[0];
    //this.tail = this.args[1];
}

List.prototype = Object.create(Pred.prototype);
List.prototype.constructor = List;

List.prototype.toString = function () {
    var node = this;
    var lst = '[';
    while (node.key === '._2') {
        if (lst !== '[') lst += ', ';
        lst += node.args[0].toString();
        //if(node.args[1] !== emptylist) lst+=', ';
        node = node.args[1];
    }
    if (node === emptylist) {
        lst += ']';
    } else {
        lst += '|' + node.toString() + ']';
    }

    return lst;
};

List.prototype.toJSList = function() {
    var node = this;
    var lst = [];
    while (node.key === '._2') {
        lst.push(marshall(node.args[0]));
        node = node.args[1];
    }
    return lst;
};

List.prototype.toList = function() {
    var node = this;
    var lst = [];
    while (node.key === '._2') {
        lst.push(node.args[0]);
        node = node.args[1];
    }
    return lst;
};


function DB() {
    this.rules = {};
}

DB.prototype.addRule = function (rule,insert) {
    var head = (this.rules[rule.head.key] = this.rules[rule.head.key] || []);
    if(!insert)
        head.push(rule);
    else
        head.unshift(rule);
};

function Engine(db) {
    this.stack = [];
    this.db = db;
    this.varcount = 0;
    builtins = require('./builtins');

}

Engine.prototype.executeQuery = function(disjunction){
    this.redostack = [];
    this.goalstack = [];
    this.db['query'] = [];
    //TODO: extract variables from query and create a goal predicate in the db
    //this.db.addRule(new Rule(Pred('current_query')))

    this.current_query = this.processQuery(disjunction);
    return this.solve([this.current_query]);
};

Engine.prototype.processQuery = function(disjunction){
    var acc = {};
    var accs = [];
    var queryvariables = [];
    for(var i = 0;i<disjunction.length;i++){
        accs[i] = {};
        disjunction[i].map(function(pred){
            pred.renameVars(this,accs[i]);
        }.bind(this));

        for(var v in accs[i]){
            if(accs[i].hasOwnProperty(v)){
                acc[v] = accs[i][v];

            }
        }
    }
    //now acc contains the variables from the query



    for( i = 0;i<disjunction.length;i++){
        var headvariables = [];
       var goals = disjunction[i];
        for( v in acc){
            if(acc.hasOwnProperty(v)){
                if(accs[i][v])
                    headvariables.push(v);
                else
                    headvariables.push('_');
            }
        }
        var queryRule = new Rule(Pred('query',headvariables),goals);
        this.db.addRule(queryRule);
    }

    for( v in acc){
        if(acc.hasOwnProperty(v)){
            queryvariables.push(v);
        }
    }
    return new Pred('query',queryvariables);
};

Engine.prototype.solve = function (goal) {
    this.redostack = [];
    this.goalstack = goal;

    this.bc = createBindingContext();
    //this.addGoals([goal],rootbc);

    var ret = this.solveInternal();
    if(ret){
        return this.cleanupResult(this.bc);
    } else {
        return this.redo();
    }
};

Engine.prototype.redo = function () {
    var ret = false;
    while (!ret && this.backtrack()) {
        ret = this.solveInternal();
    }
    return ret ? this.cleanupResult(this.bc) : false;
};

Engine.prototype.cleanupResult = function(res){
    //res.resolveAll();
    var cr = {};
    for(var v in res){
        if(/*res.hasOwnProperty(v) &&*/ (this.current_query.args.indexOf(v)>=0) /*&& res.isGround(v)*/)
        {
            cr[v] = res.resolveTerm(v);
        }
    }
    return cr;
};

Engine.prototype.solveInternal = function () {
    while (this.goalstack.length > 0) {

        if (!this.callGoals()) {
            return false;
        }
    }
    return true;
};


Engine.prototype.backtrack = function () {
    if (this.redostack.length === 0) return false;
    var choice = this.redostack.pop();

    this.goalstack = choice.goals;
    this.bc = choice.bc;
    this.startrule = choice.rule + 1;

    return true;


};

Engine.prototype.getNewVarName = function(){
    this.varcounter = (this.varcounter ||0)+1;
    return '_'+this.varcounter;
};


Engine.prototype.callGoals = function () {


    var pred = this.goalstack[0];

    var ret = this.callGoal(pred, this.bc, this.startrule);
    this.startrule = 0;
    if (ret === false) return false;
    if (ret.nrules - 1 > ret.rule) {
        //create a choice point
        this.redostack.push({goals: this.goalstack.slice(), bc: this.bc, rule: ret.rule});
    }

    var clauses = ret.goals;
    var cont = this.goalstack.slice(1);

    cont = clauses.concat(cont);
    this.goalstack = cont;

    this.bc = ret.bc;
    //this.bc.resolveOwn();
    //this.bc.resolveAll();
    return true;

};



Engine.prototype.callGoal = function (goal, bc, startrule) {
    var rules = undefined;
    if(typeof (goal.call)==='function'){
        var res = goal.call(this);
        if(res === true){//TODO: what to do with other values like undefined?
            return {goals: [], bc: this.bc, rule: 0, nrules: 0};
        }
        return res;
    }

    if(builtins){
        rules = builtins.rules[goal.key];
    }

    rules = rules || this.db.rules[goal.key];
    if (rules === undefined) return false;
    if (rules.length === 0) return false;

    var startrule = startrule || 0;

    for (var i = startrule; i < rules.length; i++) {
        var cxt = createBindingContext(bc);

        var rule = rules[i].renameVars(this,{});

        if (cxt.unify(goal, rule.head)) {
            rule.tail.forEach(function(p){p.init(this)}.bind(this));
            return {goals: rule.tail, bc: cxt, rule: i, nrules: rules.length}
        }
    }
    return false;
};

function buildPrologList(enumerable) {
    var ret = list = emptylist;
    junq(enumerable).forEach(function (el) {
        var currentNode = new List('.', [el, emptylist]);
        if (list != emptylist)  list.args[1] = currentNode;
        else ret = currentNode;
        list = currentNode;
    });
    return ret;
}

var builtins = undefined;
var p = undefined;
var lexer = undefined;
var db = undefined;
var engine = undefined;
var plparser = undefined;

function ensureParser(){
    if(typeof (db) === 'undefined'){
        db = new DB();
    }
    if(typeof (engine) === 'undefined'){
        engine = new Engine(db);
    }

    builtins = builtins || require('./builtins');
    plparser  = plparser || require('./parser');

    if(typeof (p)==='undefined'){
        p = plparser.generateParser(engine);
    }

    if(typeof (lexer)==='undefined'){
        lexer =plparser.generateLexer();
    }

}

function parseProgram(src){

   ensureParser();

    lexer.setInput(new plparser.StringReader(src+'\n'));

    return p.parse(lexer,{engine: engine});;
}

function consult(prog){
    parseProgram(prog);
    return true;
}

function executeQuery(query){
    var ret = parseProgram("?- "+query);
    return ret[0];
}

function redo(){
    ensureParser();
    return engine.redo();
}

function generateVars(engine,n){

}

function marshall(ob){
    if(isVariable(ob)) return undefined;
    if(isComp(ob)){
        if(ob instanceof List){
            return ob.toJSList();
        }
        //we return term as plain pred
        return {functor: ob.functor,arguments: junq(ob.args).map(marshall).toArray()};
    }
    return ob;
}

function registerPredicate(name, arity, callback){

/*    var args = [];
    for(var i=1;i<=arity;i++){
        args.push('X'+i);
    }*/

    var f = function(_,args){ Pred.call(this,name,args);}

    f.prototype = Object.create(Pred.prototype);
    f.prototype.constructor = f;

    f.prototype.call = function(engine){
        var terms = this.args.map(function(arg){return engine.bc.resolveTerm(arg)}).map(marshall);

        return callback.apply(this,terms);
    };

    builtins[name+'_'+arity] = f;
}


exports.DB = DB;
exports.Engine = Engine;
exports.Pred = Pred;
exports.Binary = Binary;
exports.Rule = Rule;
exports.isAtom = isAtom;
exports.isConstant = isConstant;
exports.isVariable = isVariable;
exports.isComp = isComp;
exports.isAtomic = isAtomic;
exports.isNumber = isNumber;
exports.isList = isList;
exports.registerPredicate = registerPredicate;
exports.buildPrologList = buildPrologList;
exports.List = List;
exports.emptylist =  emptylist;
exports.consult = consult;
exports.executeQuery = executeQuery;
exports.redo = redo;


},{"./builtins":1,"./parser":3,"jacob/node_modules/junq":19}],3:[function(require,module,exports){
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




},{"./builtins":1,"./engine":2,"jacob":7,"jacob/node_modules/junq":19}],4:[function(require,module,exports){

},{}],5:[function(require,module,exports){
(function (process){
// Copyright Joyent, Inc. and other Node contributors.
//
// Permission is hereby granted, free of charge, to any person obtaining a
// copy of this software and associated documentation files (the
// "Software"), to deal in the Software without restriction, including
// without limitation the rights to use, copy, modify, merge, publish,
// distribute, sublicense, and/or sell copies of the Software, and to permit
// persons to whom the Software is furnished to do so, subject to the
// following conditions:
//
// The above copyright notice and this permission notice shall be included
// in all copies or substantial portions of the Software.
//
// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS
// OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
// MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN
// NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM,
// DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR
// OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE
// USE OR OTHER DEALINGS IN THE SOFTWARE.

// resolves . and .. elements in a path array with directory names there
// must be no slashes, empty elements, or device names (c:\) in the array
// (so also no leading and trailing slashes - it does not distinguish
// relative and absolute paths)
function normalizeArray(parts, allowAboveRoot) {
  // if the path tries to go above the root, `up` ends up > 0
  var up = 0;
  for (var i = parts.length - 1; i >= 0; i--) {
    var last = parts[i];
    if (last === '.') {
      parts.splice(i, 1);
    } else if (last === '..') {
      parts.splice(i, 1);
      up++;
    } else if (up) {
      parts.splice(i, 1);
      up--;
    }
  }

  // if the path is allowed to go above the root, restore leading ..s
  if (allowAboveRoot) {
    for (; up--; up) {
      parts.unshift('..');
    }
  }

  return parts;
}

// Split a filename into [root, dir, basename, ext], unix version
// 'root' is just a slash, or nothing.
var splitPathRe =
    /^(\/?|)([\s\S]*?)((?:\.{1,2}|[^\/]+?|)(\.[^.\/]*|))(?:[\/]*)$/;
var splitPath = function(filename) {
  return splitPathRe.exec(filename).slice(1);
};

// path.resolve([from ...], to)
// posix version
exports.resolve = function() {
  var resolvedPath = '',
      resolvedAbsolute = false;

  for (var i = arguments.length - 1; i >= -1 && !resolvedAbsolute; i--) {
    var path = (i >= 0) ? arguments[i] : process.cwd();

    // Skip empty and invalid entries
    if (typeof path !== 'string') {
      throw new TypeError('Arguments to path.resolve must be strings');
    } else if (!path) {
      continue;
    }

    resolvedPath = path + '/' + resolvedPath;
    resolvedAbsolute = path.charAt(0) === '/';
  }

  // At this point the path should be resolved to a full absolute path, but
  // handle relative paths to be safe (might happen when process.cwd() fails)

  // Normalize the path
  resolvedPath = normalizeArray(filter(resolvedPath.split('/'), function(p) {
    return !!p;
  }), !resolvedAbsolute).join('/');

  return ((resolvedAbsolute ? '/' : '') + resolvedPath) || '.';
};

// path.normalize(path)
// posix version
exports.normalize = function(path) {
  var isAbsolute = exports.isAbsolute(path),
      trailingSlash = substr(path, -1) === '/';

  // Normalize the path
  path = normalizeArray(filter(path.split('/'), function(p) {
    return !!p;
  }), !isAbsolute).join('/');

  if (!path && !isAbsolute) {
    path = '.';
  }
  if (path && trailingSlash) {
    path += '/';
  }

  return (isAbsolute ? '/' : '') + path;
};

// posix version
exports.isAbsolute = function(path) {
  return path.charAt(0) === '/';
};

// posix version
exports.join = function() {
  var paths = Array.prototype.slice.call(arguments, 0);
  return exports.normalize(filter(paths, function(p, index) {
    if (typeof p !== 'string') {
      throw new TypeError('Arguments to path.join must be strings');
    }
    return p;
  }).join('/'));
};


// path.relative(from, to)
// posix version
exports.relative = function(from, to) {
  from = exports.resolve(from).substr(1);
  to = exports.resolve(to).substr(1);

  function trim(arr) {
    var start = 0;
    for (; start < arr.length; start++) {
      if (arr[start] !== '') break;
    }

    var end = arr.length - 1;
    for (; end >= 0; end--) {
      if (arr[end] !== '') break;
    }

    if (start > end) return [];
    return arr.slice(start, end - start + 1);
  }

  var fromParts = trim(from.split('/'));
  var toParts = trim(to.split('/'));

  var length = Math.min(fromParts.length, toParts.length);
  var samePartsLength = length;
  for (var i = 0; i < length; i++) {
    if (fromParts[i] !== toParts[i]) {
      samePartsLength = i;
      break;
    }
  }

  var outputParts = [];
  for (var i = samePartsLength; i < fromParts.length; i++) {
    outputParts.push('..');
  }

  outputParts = outputParts.concat(toParts.slice(samePartsLength));

  return outputParts.join('/');
};

exports.sep = '/';
exports.delimiter = ':';

exports.dirname = function(path) {
  var result = splitPath(path),
      root = result[0],
      dir = result[1];

  if (!root && !dir) {
    // No dirname whatsoever
    return '.';
  }

  if (dir) {
    // It has a dirname, strip trailing slash
    dir = dir.substr(0, dir.length - 1);
  }

  return root + dir;
};


exports.basename = function(path, ext) {
  var f = splitPath(path)[2];
  // TODO: make this comparison case-insensitive on windows?
  if (ext && f.substr(-1 * ext.length) === ext) {
    f = f.substr(0, f.length - ext.length);
  }
  return f;
};


exports.extname = function(path) {
  return splitPath(path)[3];
};

function filter (xs, f) {
    if (xs.filter) return xs.filter(f);
    var res = [];
    for (var i = 0; i < xs.length; i++) {
        if (f(xs[i], i, xs)) res.push(xs[i]);
    }
    return res;
}

// String.prototype.substr - negative index don't work in IE8
var substr = 'ab'.substr(-1) === 'b'
    ? function (str, start, len) { return str.substr(start, len) }
    : function (str, start, len) {
        if (start < 0) start = str.length + start;
        return str.substr(start, len);
    }
;

}).call(this,require('_process'))
},{"_process":6}],6:[function(require,module,exports){
// shim for using process in browser

var process = module.exports = {};
var queue = [];
var draining = false;

function drainQueue() {
    if (draining) {
        return;
    }
    draining = true;
    var currentQueue;
    var len = queue.length;
    while(len) {
        currentQueue = queue;
        queue = [];
        var i = -1;
        while (++i < len) {
            currentQueue[i]();
        }
        len = queue.length;
    }
    draining = false;
}
process.nextTick = function (fun) {
    queue.push(fun);
    if (!draining) {
        setTimeout(drainQueue, 0);
    }
};

process.title = 'browser';
process.browser = true;
process.env = {};
process.argv = [];
process.version = ''; // empty string to avoid regexp issues
process.versions = {};

function noop() {}

process.on = noop;
process.addListener = noop;
process.once = noop;
process.off = noop;
process.removeListener = noop;
process.removeAllListeners = noop;
process.emit = noop;

process.binding = function (name) {
    throw new Error('process.binding is not supported');
};

// TODO(shtylman)
process.cwd = function () { return '/' };
process.chdir = function (dir) {
    throw new Error('process.chdir is not supported');
};
process.umask = function() { return 0; };

},{}],7:[function(require,module,exports){
/**
 * Created by gcannata on 18/08/2014.
 */

var lexer = require('./lib/lexer');
var parser = require('./lib/parser');

exports.lexer = lexer;
exports.parser = parser;
exports.StringReader =  require('./lib/stringreader');


function generateLexerSource(jacoblex){

    var tokenspecs;
    if(typeof jacoblex === 'string'){
        tokenspecs = require('./lib/parser/JacobLex')(jacoblex);
    } else {
        tokenspecs = jacoblex;
    }

    return lexer.generateLexer(tokenspecs);
}
exports.generateLexerSource = generateLexerSource;

function elaborateLexFile(tokenfile, outfile) {
    var fs = fs || require('fs');
    var path = require('path');
    var tokensrc = fs.readFileSync(tokenfile).toString();
    var tokenspecs;
    if (tokenfile.indexOf('.js', tokenfile.length - 3) !== -1) {
        tokenspecs = eval(tokensrc);
    } else {
        tokenspecs = tokensrc;
    }

    var lexersrc = generateLexerSource(tokenspecs);
    var lexerout = outfile || path.join(path.dirname(tokenfile), (tokenspecs.moduleName || path.basename(tokenfile)+'.out') + '.js');
    console.log('Generated file '+lexerout);
    fs.writeFileSync(lexerout, lexersrc);
}
exports.elaborateLexFile = elaborateLexFile;



function generateParserSource(jacobgram){
    var parserspecs;
    if(typeof  jacobgram === 'string'){
        parserspecs = require('./lib/parser/JacobGram')(jacobgram);
    } else {
        parserspecs = jacobgram;
    }

    return parser.generateParser(parserspecs);
}

exports.generateParserSource = generateParserSource;

function elaborateGramFile(grammarfile, outfile) {
    var fs = fs || require('fs');
    var path = require('path');
    var grammarsrc = fs.readFileSync(grammarfile).toString();
    var grammar;
    if (grammarfile.indexOf('.js', grammarfile.length - 3) !== -1) {
        grammar = eval(grammarsrc);
    } else {
        grammar = grammarsrc;
    }

    var parsersrc = generateParserSource(grammar);
    var parserout = outfile || path.join(path.dirname(grammarfile), ( grammar.moduleName || path.basename(grammarfile)+'.out') + '.js');
    console.log('Generated file '+parserout);
    fs.writeFileSync(parserout, parsersrc);
}

exports.elaborateGramFile = elaborateGramFile;
},{"./lib/lexer":9,"./lib/parser":10,"./lib/parser/JacobGram":11,"./lib/parser/JacobLex":14,"./lib/stringreader":18,"fs":4,"path":5}],8:[function(require,module,exports){
/*****************************************************/
/* test editing */
var junq = junq || require('junq');
var sets = sets || require('junq/sets');
//TODO: NFA-to-DFA  construction may  yield  several states  that  cannot reach  any  accepting  state (Dragon Book 195)

var automata;
(function (automata, undefined) {

    var NFA;
    var FIRSTCHAR = '\0';
    automata.FIRSTCHAR = FIRSTCHAR;
    var LASTCHAR = '\uFFFF';
    automata.LASTCHAR = LASTCHAR;

    var falseConstant = function () {
        return false;
    };

    var emptySet = new sets.Set();
    automata.emptySet = emptySet;

    var eps = {
        toString: function () {
            return 'ε'
        },
        match: function (c) {
            return c === this;
        },
        matchChar: falseConstant,
        matchRange: falseConstant,
        matchTerminal: falseConstant,
        matchNonTerminal: falseConstant,
        isRange: falseConstant,
        appendRange: function (r) {
            return r;
        }
    }; //
    automata.eps = eps;

    /*
     var InputChar = (function () {
     function InputChar(character) {
     this.character = character;
     }

     //when match is called the object is the Rule's definition
     InputChar.prototype.match = function (c) {

     if(typeof c === 'string'){
     return this.character === c;
     }
     return c.matchChar(this);
     //return this.character === c;
     };

     //when matchRange and matchChar are called, the object is an actual input
     //and the argument is the Rule we are trying to match
     InputChar.prototype.matchRange = function (range) {
     return  range.from <= this.character && this.character <= range.to;
     };

     InputChar.prototype.matchChar = function (c) {
     return this.character === c.character;
     };

     InputChar.prototype.toString = function () {
     return this.character.toString();
     };

     InputChar.prototype.isRange = function () {
     return false;
     };

     InputChar.prototype.appendRange = function (ranges) {
     ranges.push(new InputRange(this.character, this.character));
     return ranges;
     };
     return InputChar;

     })();
     automata.InputChar = InputChar;
     */

    var InputRange = (function () {
        function InputRange(from, to, negate) {
            if (from <= to) {
                this.from = from;
                this.to = to;
            } else {
                this.from = to;
                this.to = from;
            }
            if(negate !== undefined){
                this.negate = negate;
            } else {
                this.negate = false;
            }

        }

        InputRange.prototype.clone = function(){
            "use strict";
            var ret = new InputRange(this.from,this.to,this.negate);
            if(this.next){
                ret.next = this.next.clone();
            }
            return ret;
        };

        //when match is called the object is the Rule's definition
        InputRange.prototype.match = function (c) {

            if (typeof c === 'string') {
                c = new InputRange(c, c);
            }
            if (c == eps) return false;

            return c.matchRange(this);

        };
        //when matchRange and matchChar are called, the object is an actual input
        //and the argument is the Rule we are trying to match
        //TODO: multiple negation are not Working!!!
        InputRange.prototype.matchRange = function (range) {

            var result = false;
            if (range.from <= this.from && this.to <= range.to)
            {   //the input is comprised in the range
                //no need to check the other ranges
                return !range.negate;
            } else {
                //this input doesn't match the input
                //we must still check other ranges if available
                result = range.negate;
            }

            if (range.next)
                return this.matchRange(range.next);
            return result;
        };

        InputRange.prototype.matchChar = function (c) {
            if (this.from === c.character && this.to === c.character)
                return true;
            if (this.next)
                return this.next.matchChar(range);
            return false;
        };

        InputRange.prototype.toString = function () {
            return '[' + this.toStringInternal()
                + ']';
        };

        InputRange.prototype.toDebug = function () {
            var str = this.from.charCodeAt(0)+' - '+this.to.charCodeAt(0);
            if(this.next !== undefined){
                return str+', '+this.next.toDebug();
            } else return str;
        };

        //This toString is a bit complicated but helps debugging
        InputRange.prototype.toStringInternal = function () {
            var str  = '';
            if ( this.from === FIRSTCHAR)
            {
                var lower = this;
                var upper = lower.next;
                while(upper){
                    var a = String.fromCharCode(lower.to.charCodeAt(0)+1);
                    var b = String.fromCharCode(upper.from.charCodeAt(0)-1);
                    str = str + '^'+a+'-'+b;
                     lower = upper;
                     upper = lower.next;
                }

            }
            
            if(str.length===0) {
                str = str + ((this.from < this.to) ? this.from + '-' + this.to : this.from);
                if (this.next) return str + this.next.toStringInternal();
            }

            

            return str;
        };

        InputRange.prototype.compile = function () {
            var str = '';
            if (this.from === FIRSTCHAR) {
                var lower = this;
                var upper = lower.next;
                while (upper) {
/*                    var a = String.fromCharCode(lower.to.charCodeAt(0) + 1);
                    var b = String.fromCharCode(upper.from.charCodeAt(0) - 1);*/

                    var a = lower.to.charCodeAt(0)+1;
                    var b = upper.from.charCodeAt(0)-1;

                    a = String.fromCharCode(a);
                    b = String.fromCharCode(b);
                    //str = str + '^'+a+'-'+b;
                    //TODO: we could use char codes here.
                    //str = str + "(c < " + JSON.stringify(a) + " && " + JSON.stringify(b) + " < c) ";
                    if(str.length>0){
                        str = str+" && ";
                    }
                    //str = str + "(c.charCodeAt(0) < "+ a + " || "+ b + " < c.charCodeAt(0)) ";
                    str = str + "(c < "+ JSON.stringify(a) + " || "+ JSON.stringify(b) + " < c) ";
                        lower = upper;
                    upper = lower.next;
                }

            }


            if (str.length === 0) {
                //TODO: consider equals
                if (this.to === this.from) {
                    str = str + '(' + JSON.stringify(this.from) + ' === c )';
                } else {
                    str = str + "(" + JSON.stringify(this.from) + " <= c && c <= " + JSON.stringify(this.to) + ") ";
                }

                if (this.next) return str + ' || ' + this.next.compile();
            }


            return str;
        };

        InputRange.prototype.isRange = function () {
            return true;
        };

        InputRange.prototype.overlaps = function (other) {
            return this.to >= other.from && this.from <= other, to;
        };

        InputRange.prototype.append = function (range) {
            //The append method is actually trying to merge multiple ranges into one, if possible
            //First check if one set is inside the other:
            if(this.from <= range.from && range.to <= this.to){
                //the range to append is included in this, do nothing
                return;
            }
            if(range.from <= this.from && this.to <= range.to){
                //it's the other way around
                this.from = range.from;
                this.to = range.to;
                return;
            }
            //check if the two ranges are head-to-tail (there should be no overlapping but better safe than sorry)
            if ((this.to === range.from) || (this.to.charCodeAt(0) + 1 === range.from.charCodeAt(0))) {
                this.to = range.to;

            } else if ((range.to === this.from) || (range.to.charCodeAt(0) + 1 === this.from.charCodeAt(0))) {
                this.from = range.from;
            }
            else if (!this.next) {
                this.next = range;
            }
            else {
                this.next.append(range);
            }

        };

        /*        InputRange.prototype.getEnumerator = function (range) {
         var current = this;
         return {
         moveNext: function(){
         if(!current) return false;

         },
         getCurrent: function(){

         }

         }
         };*/

        InputRange.prototype.appendRange = function (ranges) {
            if(!this.negate) {
                ranges.push(this);
            } else {
                var lower = new automata.InputRange(automata.FIRSTCHAR,String.fromCharCode((this.from.charCodeAt(0)-1)),true);
                var upper = new automata.InputRange(String.fromCharCode((this.to.charCodeAt(0)+1)),automata.LASTCHAR,true);
                ranges.push(lower);
                ranges.push(upper);
            }
            if (this.next)
                return this.next.appendRange(ranges);
            return ranges;
        };


        return InputRange;
    })();
    automata.InputRange = InputRange;

    var State = (function () {

        var stateSeq = 1;

        function State(id, label) {
            if (id !== undefined) {
                this.id = id;
            } else {
                this.id = stateSeq++;
            }
            if (label !== undefined) {
                this.label = label;
            }
        }

        State.prototype.toString = function () {
            return this.id.toString();
        };
        return State;
    })();
    automata.State = State;

    var Target = (function () {
        function Target() {
            this.states = arguments;
        }

        return Target;
    })();
    automata.Target = Target;


    var Rule = (function () {
        function Rule(state, input, next) {
            this.state = state;
            this.input = input;
            this.next = next;
        }

        Rule.prototype.appliesTo = function (state, input) {
            //return this.state == state && this.input == input;


            return this.state === state && this.input.match(input);
        };

        Rule.prototype.toString = function () {
            return this.state.toString() + '\t\t->\t\t' + this.input.toString() + '\t\t->\t\t' + this.next.toString();
        };

        return Rule;
    })();
    automata.Rule = Rule;

    var RuleBook = (function () {
        function RuleBook(rules) {
            this.rules = rules;
        }

        function findElementalIntervals(ranges) {
            //computes a list of extremes
            if (ranges.length < 2) return ranges;
            var points = [];
            var intervals = [];
            var code;
            junq(ranges).forEach(function (r) {
                points.push({val: r.from, dir: +1});
                points.push({val: r.to, dir: -1});
            });
            //sort them
            points.sort(function (a, b) {
                if (a.val < b.val) {
                    return -1;
                }
                if (a.val > b.val) {
                    return +1;
                }
                return (b.dir - a.dir);
            });
            var np = points.length - 1;
            var ni = 0;
            for (var i = 0; i < np; i++) {
                var cur = points[i], fol = points[i + 1];
                var from, to;
                ni += cur.dir; //we count the intervals along

                //+1 -1: [ ]
                //+1 +1: [ [
                //-1 -1: ] ]
                //-1 +1: ] [ (*)

                //TODO: guard against going overboard!
                if (cur.dir > 0) {
                    from = cur.val;

                } else { //cur.dir<0
                    if(cur.val===LASTCHAR) continue;
                    //if(cur.val === LASTCHAR) cur.val = '\uFFFE'
                    from = String.fromCharCode(cur.val.charCodeAt(0) + 1);
                }

                if (fol.dir > 0) {
                    code = fol.val.charCodeAt(0);
                    if(code===0) continue;
                    //if(code === 1) code = 1;
                    to = String.fromCharCode(code - 1);
                } else { //fol.dir<0
                    to = fol.val;
                }
                if (from <= to && (ni > 0 || cur.dir > 0 || fol.dir < 0)) {
                    var newInt;

                    //if(from<to)
                    newInt = new InputRange(from, to);
                    //else
                    //    newInt= new InputChar(from);
                    intervals.push(newInt);
                }

            }

            return intervals;
        }

        automata.findElementalIntervals = findElementalIntervals;

        function splitRanges(ranges) {
            if (ranges.lenth < 2) return ranges;
            sortRanges(ranges);

            var i = 1;
            while (i < ranges.length) {
                if (ranges[i].from <= ranges[i - 1].to) {

                    //calculate itersection
                    var subs = intersectRanges(ranges[i - 1], ranges[i]);

                    //remove the overlapping ranges
                    ranges.splice(i - 1, 2);
                    for (var j = subs.length - 1; j >= 0; j--) {
                        ranges.splice(i - 1, 0, subs[j]);
                    }
                    sortRanges(ranges);


                } else {
                    i++;
                }

            }

            return ranges;
        }


        function intersectRanges(a, b) {
            res = [];
            var is = new InputRange(b.from, a.to < b.to ? a.to : b.to);
            res.push(is);
            var isless1 = String.fromCharCode(is.from.charCodeAt(0) - 1);
            if (a.from <= isless1) {
                res.push(new InputRange(a.from, isless1));
            }
            var isplus1 = String.fromCharCode(is.to.charCodeAt(0) + 1);

            var rx = a.to < b.to ? b.to : a.to;

            if (isplus1 <= rx) {
                res.push(new InputRange(isplus1, rx));
            }
            //sortRanges(res);
            return res;
        }

        function sortRanges(ranges) {
            ranges.sort(function (a, b) {
                if (a.from < b.from) {
                    return -1;
                }
                if (a.from > b.from) {
                    return 1;
                }
                //look right extreme
                if (a.to < b.to) {
                    return -1;
                }
                if (a.to > b.to) {
                    return 1;
                }
                return 0;
            });
        }

        RuleBook.prototype.match = function (state, input) {

            return junq(this.rules).first(function (rule) {
                return rule.appliesTo(state, input);
            });
        };


        RuleBook.prototype.nextState = function (state, input) {
            var rule = this.match(state, input);
            if (rule === undefined) {
                //throw new Error('No transition on state ' + state + ' on input ' + input);
                return undefined;
            }
            return rule.next;
        };

        RuleBook.prototype.toString = function () {
            return junq(this.rules).map(function (rule) {
                return rule.toString();
            }).toArray().join('\r\n');
        };

        RuleBook.prototype.getSymbols = function () {

            var ranges =
                junq(this.rules)
                    .filter(function (rule) {
                        return ((rule.input !== automata.eps) /* && !(rule.input.negate)*/);
                    })
                    .map(function (rule) {
                        return rule.input;
                    })
                    .aggregate(function (ranges, s) {
                        s.appendRange(ranges);
                        //s.push(ranges)
                        return ranges;
                    }, []);
            var elemental = findElementalIntervals(ranges);
            return elemental;
        };

        return RuleBook;
    })();
    automata.RuleBook = RuleBook;

    var NDRuleBook = (function () {
        function NDRuleBook(rules) {
            this.rules = rules;
        }

        NDRuleBook.prototype = new RuleBook();

        NDRuleBook.prototype.match = function (states, input) {
            var self = this;
            var rules = junq(states).map(
                function (state) {
                    return junq(self.rules).filter(function (rule) {
                        return rule.appliesTo(state, input);
                    })
                }
            ).flatmap();

            return rules;
        };


        NDRuleBook.prototype.nextState = function (states, input) {
            return this.match(states, input).map(
                function (rule) {
                    return rule.next;
                }
            );
        };


        return NDRuleBook;
    })();
    automata.NDRuleBook = NDRuleBook;

    var DFA = (function () {
        function DFA(specs) {
            if(specs !== undefined){
                this.rulebook = specs.rulebook;
                this.acceptstates = specs.acceptstates;
                this.currentstate = this.startstate = specs.startstate;
                this.alphabet = specs.alphabet;
                this.tokenTable = specs.tokenTable;
                this.secondaryTokenTable = specs.secondaryTokenTable;
            } else {
                //no specs, used as prototype?
            }

        }

        DFA.prototype.readSymbol = function (symbol) {
            this.currentstate = this.rulebook.nextState(this.currentstate, symbol);
            return this;
        };

        DFA.prototype.nextState = function (state,symbol) {
            return this.rulebook.nextState(state, symbol);
        };

        DFA.prototype.isAccepting = function () {
            var accepting = junq(this.acceptstates).contains(this.currentstate);
            if((this.secondaryTokenTable[this.currentstate] === -1)//means this rule is bol and no secondar available
                && !this.bol)
                accepting=false;
            return accepting;
        };

        DFA.prototype.isInDeadState = function () {
            return this.currentstate === undefined || this.currentstate === 0;
        };

        DFA.prototype.readString = function (str) {
            var self = this;
            if (str.length > 0) {
                /*junq(str).forEach(function (c) {
                 self.readSymbol(c);
                 });*/
                for (var i = 0, l = str.length; i < l; i++) {
                    if (this.isInDeadState()) return;
                    self.readSymbol(str.charAt(i));
                }
            }

        };

        DFA.prototype.getCurrentToken = function () {
            if (this.tokenTable !== undefined) {
                var token = this.tokenTable[this.currentstate];
                var secondary = this.secondaryTokenTable[this.currentstate];
                if(secondary !== undefined){
                    //means token is bol
                    if(this.bol) return token;
                    else return secondary;
                }
                return token;
            }
        };

        DFA.prototype.reset = function (state) {
            this.currentstate = state || this.startstate;
            this.bol = false;
            return this;
        };

        DFA.prototype.getRules = function () {
            return this.rulebook.rules;
        };

        DFA.prototype.getStatesWithTransisions = function () {
            return new sets.Set(junq(this.rulebook.rules)
                .map(function (rule) {
                    return rule.state;
                }));
        };

        DFA.prototype.getStates = function () {
            return new sets.Set(junq(this.rulebook.rules)
                .flatmap(function (rule) {
                    return [rule.state,rule.next];
                }));
        };

        DFA.prototype.matches = function (str) {
            this.reset();
            this.readString(str);
            return this.isAccepting();
        };

        DFA.prototype.toString = function () {
            return "startstate: " + this.startstate.toString() + '\t\t\t\t' +
                "acceptstates: " + this.acceptstates.toString() + '\r\n' +
                "currentstate: " + (this.currentstate ? this.currentstate.toString() : '∅') + '\t\t\t accepting: ' + this.isAccepting() + '\r\n' +
                '*************** Rules *********************\r\n' +
                'From\tinput\tTo\r\n' +
                this.rulebook.toString() +
                "\r\n********************************";
        };

        DFA.prototype.invert = function () {
            var start;
            var invertedRules = junq(this.getRules())
                .map(function (rule) {
                    return new Rule(rule.next, rule.input, rule.state);
                });
            /*if(this.acceptstates.length>1)*/
            {
                start = new State();
                invertedRules = invertedRules.append(junq(this.acceptstates).map(function (as) {
                        return new Rule(start, eps, as);
                    }))
                    .append(junq(this.acceptstates).map(function (as) {
                        return new Rule(as, eps, start);
                    }));
            }
            /*else {
             start = this.acceptstates;
             }*/
            invertedRules = invertedRules.toArray();
            var acceptstates = [this.startstate];
            var invNFA = new NFA(new NDRuleBook(invertedRules), acceptstates, start);
            if(this.logEnabled) {
                console.log(invNFA.toString());
            }
            return invNFA.toDFA();
        };

        DFA.prototype.minimize = function () {
            var self = this;
            //start with a partition accepting, non accepting
            var part = [];
            //group 0 is non final states
            part[0] = this.getStates().subtract(new sets.Set(this.acceptstates)).toArray();
            //we have to distinguish finals by their token id
            var tg = {};

            for(var i= 0;i< this.acceptstates.length;i++){
                var as = this.acceptstates[i];
                var tokenid = this.tokenTable[ as];
                (tg[tokenid] = tg[tokenid] || []).push(as);
            }
            for(var prop in tg){
                part.push(tg[prop]);
            }
            //part[1] = this.acceptstates;
            var ab = this.alphabet;
            //var ab = this.rulebook.getSymbols();
            var pm = new Partition(part, ab, this.rulebook);
            pm.partitionGroups();
            if (!pm.isMinimal()) {
                //gets the partitions and mess with the states
                junq(part).where(function (group) {
                    return group.length > 1;
                })
                    .forEach(function (group) {
                        self.identifyStates(group[0], group.slice(1))
                    });
            }
        };

        DFA.prototype.identifyStates = function (representative, others) {
            var self = this;
            //we can make all of s2’s
            //incoming edges point to s1 instead and delete s2
            //that is s -> input -> S2 becomes
            //        a -> input -> S1
            // and we delete all s2 -> *
            junq(others).forEach(function (s2) {
                junq(self.getRules()).where(function (rule) {
                    return rule.next === s2
                })
                    .forEach(function (rule) {
                        rule.next = representative;
                    });
                self.rulebook.rules = junq(self.getRules()).where(function (rule) {
                    return rule.state !== s2;
                }).toArray();
            });

        };

        DFA.prototype.compileBase = function(classname){
            this.source = [];
            var specs = {className: classname || 'CDFAbase'};
            this.compileCtor(specs);
            this.compilStdMethods(specs);
            //this.compileStateSwitch(specs);
            return this.source.join('');
        };

        DFA.prototype.compile = function(specs){
            this.source = [];

            //this.emit('function (){\r\n');

            specs = specs || {};
            specs.className = specs.className || 'CDFA';
            specs.baseClass = specs.baseClass || 'CDFAbase';
            this.compileCtor(specs);

            this.emit(specs.className+'.prototype= new '+specs.baseClass+'();\n')

            this.compileStateSwitch(specs);

            //this.emit('return new '+specs.className +'();\r\n');
            //this.emit('}');
            return this.source.join('');
        };

        DFA.prototype.emit = function(code){
            this.source.push(code);
        };

        DFA.prototype.compileCtor = function(specs){
            this.emit('function '+ specs.className+ '(){\n\tthis.ss=');
            this.emit(this.startstate + ';\n\tthis.as=');
            this.emit(JSON.stringify(this.acceptstates)+';\n\tthis.tt=');
            this.emit(JSON.stringify(this.tokenTable)+';\n');
            var stt={};
            if(this.secondaryTokenTable!==undefined){
                for(var i=0;i<this.secondaryTokenTable.length;i++){
                    if(this.secondaryTokenTable[i]!==undefined){
                        stt[i]=this.secondaryTokenTable[i];
                    }
                }
            }
            this.emit('this.stt='+JSON.stringify(stt)+';\n');

            this.emit('}\n');
        };

        DFA.prototype.compilStdMethods = function(specs){
            this.emit(specs.className+".prototype.reset = function (state) {\n\tthis.cs = state || \tthis.ss;\nthis.bol=false;\n};\n" +
                specs.className+".prototype.readSymbol = function (c) {\n\tthis.cs = this.nextState(this.cs, c);\n};\n" +
                specs.className+".prototype.isAccepting = function () {\n\tvar acc = this.as.indexOf(this.cs)\x3E=0;\nif((this.stt[this.cs]===-1)&&!this.bol){\nacc=false;}\nreturn acc;};\n" +
                specs.className+".prototype.isInDeadState = function () {\n\treturn this.cs === undefined || this.cs === 0;\n};\n" +
                specs.className+".prototype.getCurrentToken = function(){\n\tvar t= this.tt[this.cs];\nvar s=this.stt[this.cs];\nif(s!==undefined){return this.bol?t:s;}\nreturn t;};\n"

            );
        };

        DFA.prototype.compileStateSwitch = function(specs){
            this.emit(specs.className+'.prototype.nextState = function(state, c){\n    var next = 0;\n    switch(state){\n');
            var self=this,rules, i,rl;
            junq(this.getStatesWithTransisions()).forEach(function(state){
                self.emit('case '+state+':\n');
                rules = junq(self.rulebook.rules).where(function(rule){return rule.state===state;}).toArray();
                for(i=0,rl=rules.length;i<rl;i++){
                    self.emit('if(');
                    self.compileRule(rules[i]);

                    self.emit('){\n');

                    self.emit('next = '+rules[i].next);

                    self.emit(';\n}');
                    if(i<rl-1){
                        self.emit(' else ');
                    }
                }

                self.emit('\nbreak;\n')
            });
            this.emit('\t}\n\treturn next;\n};\n');
        };

        DFA.prototype.compileRule = function(rule){
            var str = rule.input.compile();
            this.emit(str);
        };


        function Partition(part, ab, rb) {
            this.part = part;
            this.ab = ab;
            this.rb = rb;
        }

        Partition.prototype.getGroup = function (state) {

            for (var i = 0; i < this.part.length; i++) {
                var j = this.part[i].indexOf(state);
                if (j >= 0) return i;
            }
        };

        Partition.prototype.partitionGroups = function () {
            var done = false;
            do {
                done = false;
                for (var i = 0, pl = this.part.length; i < pl; i++) {
                    done = done || this.partitionGroup(i);
                }
            } while (done)

        };

        Partition.prototype.partitionGroup = function (i) {
            var group = this.part[i];
            var dg;
            var self = this;
            var done = false;
            //debugger;
            for(var c = 0,abl=this.ab.length;c<abl;c++)
            {
                var inp = this.ab[c];
                dg = {};
                for (var j = 0; j < group.length; j++) {
                    var st = self.rb.nextState(group[j], inp);
                    //determine the group of this state st
                    var g = self.getGroup(st);
                    //we store in dg the group in which the current input directs the state
                    //dg[j] = g;
                    //if(typeof(g) !== 'undefined')
                    (dg[g] = dg[g] || []).push(group[j]);


                }
                //see if dg has more than one property
                var n = 0;
                for (var prop in dg) {
                    n++
                }

                if (n > 1) {//we can distinguish some states
                    //let's split group i:
                    self.part.splice(i, 1);
                    for (prop in dg) {
                        self.part.splice(i, 0, dg[prop]);
                    }
                    done = true;
                    break;
                }


            }
            return done;
        };

        Partition.prototype.isMinimal = function () {
            for (var i = 0, n = this.part.length; i < n; i++) {
                if (this.part[i].length > 1) return false;
            }
            return true;
        };


        return DFA;
    })();
    automata.DFA = DFA;

    NFA = (function () {
        function NFA(specs) {
            DFA.apply(this, arguments);
            //ensure acceptstates and startstatesì are set
            this.acceptstates = new sets.Set(specs.acceptstates);
            this.startstate = specs.startstate;
            this.currentstate = this.epsClosure(this.startstate);
        }

        NFA.prototype = new DFA();

        NFA.prototype.readSymbol = function (symbol) {

            //this.currentstate = new sets.Set(this.rulebook.nextState(this.currentstate, symbol));
            //this.currentstate = this.epsClosure(this.currentstate);
            this.currentstate = this.lexEdge(this.currentstate, symbol);
            return this;
        };

        NFA.prototype.lexEdge = function (state, symbol) {
            var states = new sets.Set(this.rulebook.nextState(state, symbol));
            state = this.epsClosure(states);
            return state;
        };

        NFA.prototype.isAccepting = function () {
            return !this.currentstate.intersect(this.acceptstates).isEmpty();
        };


        NFA.prototype.epsClosure2 = function (state) {
            //finds all state reached from current state(s) with epsilon moves
            var S = state;
            if (!sets.isSet(S)) S = new sets.Set(S);
            do {
                var S1 = S.clone();
                S = new sets.Set(this.rulebook.nextState(S1, automata.eps)).union(S1);
            }
            while (!S.equalTo(S1));


            return S;
        };

        NFA.prototype.epsClosure = function (state) {
            state = sets.isSet(state) ? state : new sets.Set(state);
            var states = state.toArray();
            var eps = state.clone();
            while (states.length > 0) {
                var t = states.pop();
                this.rulebook.nextState(t, automata.eps).forEach(function (u) {
                    if (!eps.contains(u)) {
                        eps.add(u);//TODO: avoid having to check twice for u being in the set
                        states.push(u);
                    }


                });
            }
            return eps;
        };

        NFA.prototype.reset = function (state) {
            this.currentstate = this.epsClosure(state || this.startstate);
            return this;
        };

        //junq(symbols2).forEach(function(s){console.log(s.from.charCodeAt(0)+'-'+s.to.charCodeAt(0));})


        NFA.prototype.toDFA = function () {
            var lex;
            var rb;
            var j, self, nstates;
            var startstate;
            var rules;
            var acceptstates;
            var states = [];
            var tokentable = [];
            var secondarytokentable = [];
            states[0] = emptySet;
            states[1] = this.epsClosure(this.startstate);
            rules = [];
            startstate = 1;
            acceptstates = [];
            j = 1;
            self = this;
                var ab = this.alphabet;
/*                junq(ab).forEach(function(s){console.log(s.from.charCodeAt(0)+'-'+s.to.charCodeAt(0));})
                ab = this.rulebook.getSymbols();
                junq(ab).forEach(function(s){console.log(s.from.charCodeAt(0)+'-'+s.to.charCodeAt(0));})*/
            while (j < states.length) {

                junq(ab).forEach(function (c) {
                    var next;
                    var e = self.lexEdge(states[j], c);

                    next = undefined;
                    for (var i = 0, sl = states.length; i < sl; i++) {
                        if (e.equalTo(states[i])) { // we must use sets equality
                            next = i;
                            break;
                        }
                    }
                    if (next === undefined) {
                        next = states.push(e) - 1;
                    }

                    //add transition if not to the empty state
                    if (next > 0) {
                        //clone input because merge rule will actually modify the ranges concatenating them.
                        //This could cause infinite loops if a range is reinserted in a different position
                        var cc = c.clone !== undefined ? c.clone() : c;
                        var rule = new Rule(j, cc, next);

                        mergeRule(rule, rules);
                        if(this.logEnabled)
                            console.log(rule.toString());
                    }
                });
                j++;
            }
            nstates = states.length;
            for (var i = 1; i < nstates; i++) {

                /*
                var final = junq(this.acceptstates).first(function(as){
                    "use strict";
                    return states[i].contains(as);
                });
                */
                var acceptStates = junq(this.acceptstates).where(function(as){
                    return states[i].contains(as);
                }).toArray();
                var final = acceptStates[0];

                var secondary = junq(acceptStates.slice(1)).first(function(as){
                    return !(as.bol);
                });
                //var finals = states[i].intersect(this.acceptstates);
                if (final !== undefined) {
                    //this state contains at least one accept state.
                    //Here we take the higher in rank
                    acceptstates.push(i);
                    tokentable[i] = final.tokenid;
                    if(final.bol ){//the corresponding rule is matched only at begginning-of-line
                        secondarytokentable[i] = secondary ? secondary.tokenid : -1;
                    }
                }
            }

            rb = new RuleBook(rules);
            var ret = {
                rulebook: rb,
                acceptstates: acceptstates,
                startstate: startstate,
                tokenTable: tokentable,
                secondaryTokenTable: secondarytokentable,
                statesTable: states
            };

            //automata = new DFA(specs);
            //automata.tokenTable = tokentable;
/*            if(this.logEnabled) {
                for (i = 0; i < states.length; i++) {
                    console.log('Dstate ' + i + ' corresponds to NFA states ' + states[i].toString());
                }
            }
            if(specs.savestates){
                automata.statesTable = states;
            }*/
            return ret;
        };

        var mergeRule = function (rule, rules) {
            "use strict";
            var existing = junq(rules).first(function (r) {
                return r.state === rule.state && r.next === rule.next;
            });
            if (existing) {
/*                console.log('merging existing '+existing.input.toDebug()
                    + ' with ' + rule.input.toDebug());*/
                
                existing.input.append(rule.input);
//                console.log('result: '+existing.input.toDebug());
            
            }
            else {
                rules.push(rule);
            }


        };


        return NFA;
    })();
    automata.NFA = NFA;



})(automata || (automata = {}));

if (typeof(module) !== 'undefined') { module.exports = automata; }



},{"junq":19,"junq/sets":20}],9:[function(require,module,exports){
var junq = junq || require('junq');
var sets = sets || require('junq/sets');
var StringReader = StringReader || require('./stringreader.js');
var automata = automata || require('./automata.js');
var regex = regex || require('./regex');

var lexer;
(function (lexer,dfa,regex, undefined) {
    "use strict";

    var EOF = {};

    var mergeNFAs = function (nfas) {
        var start = new dfa.State();
        var rules = junq(nfas)
            .flatmap(function (nfa) {
                return nfa.getRules();
            })

            .append(
                junq(nfas)
                    .map(function (nfa) {
                        return nfa.startstate;
                    })
                    .map(function (ss) {
                        return new dfa.Rule(start, dfa.eps, ss);
                    })
            ) //we append an empty move from the new start to each of the NFA start state

            .toArray();
        var acceptstates = junq(nfas)
            .flatmap(function (nfa) {
                return nfa.acceptstates;
            });

        var nrb = new dfa.NDRuleBook(rules);
        var specs = {rulebook:nrb, acceptstates:acceptstates, startstate:start,alphabet:nrb.getSymbols()};
        var compositeNFA = new dfa.NFA(specs);
        return compositeNFA;

    };

    function processRules(specs)
    {
        var res = {};
        res.rules=[];
        res.actions=[];
        res.states = {};
        //compile tokens
        var tokenid=0;
        junq(specs.tokens).map(function(tokenspec){
            var rule = {re: regex.parseRegExp(resolveDefinitions(specs, tokenspec.regexp)), state: tokenspec.state, action: tokenspec.action};
            return  rule;
        }) //here we have resolved definitions and parsed regexp
            .map(function(rule){
                return expandLookAheads(rule, tokenid++);
            })
            .flatmap(function(r){return r;})
            .forEach(function(tokenspec){
                res.rules.push(tokenspec);

                var actionid = res.actions.push(tokenspec.action)-1;
                var statesList = tokenspec.state ||['DEFAULT'];
                if(typeof statesList === 'string'){
                    if(statesList.length === 0){
                        statesList = 'DEFAULT';
                    }
                    statesList = [statesList];
                }
                junq(statesList).forEach(function(state){
                    res.states[state] = res.states[state] || {dfa:null};
                    if(tokenspec.re === dfa.EOF){
                        res.states[state].eofaction = actionid;
                    }
                });

            })
        ;
        return res;
    }

    function expandLookAheads(rule, tokenid){
        if(rule.re.isLookAhead()){
            
            var minmax=rule.re.second.getMinMaxLength();
            //nullable, we use just the head of the original RE
            if(minmax.min===0) {
                rule1 = {};
                rule1.re = rule.re.first;
                rule1.action = rule.action;
                rule1.state = rule.state;
                return rule1;
            }
            //non nullable and not fixed length, we have to find the shortest tail
            if(minmax.max===Infinity){
                var internalStateName = '_LA_'+tokenid;
                var rules = [];
                var rule1 = {};
                rule1.re = new regex.Concat(rule.re.first,rule.re.second);
                rule1.action = new Function("this.pushState('"+internalStateName+"');\nthis.lawhole=this.jjtext;");
                rule1.state = rule.state;
                rules.push(rule1);
                var rule2 = {state: internalStateName};
                rule2.re = rule.re.second;
                rule2.action = new Function("this.restoreLookAhead();\nreturn ("+rule.action.toString()+').apply(this);');
                rules.push(rule2);
                var rule3 = {state: internalStateName};
                rule3.re = regex.parseRegExp('\\n|\\r|.');
                rule3.action = new Function('this.less(2);\n');

                rules.push(rule3);
                return rules;
            }

            //fixed length, we use a simpler method
            if((minmax.min===minmax.max) && minmax.max<Infinity){
                rule1 = {};
                rule1.re = new regex.Concat(rule.re.first,rule.re.second);
                rule1.action = new Function("this.evictTail("+minmax.max+");\nreturn ("+rule.action.toString()+').apply(this);');
                rule1.state = rule.state;
                return rule1;
            }
        }else{
            return rule;
        }
    }


    function resolveDefinitions(specs, str) {
        for (var def in specs.definitions) {
            if(specs.definitions.hasOwnProperty(def)){
                var re = new RegExp('\\{' + def + '\\}', "g");
                str = str.replace(re, specs.definitions[def]);
            }
        }
        return str;
    }

    function buildAutomataInternal(rules, rulesforstate, nfas) {
        //resolveDefinitions(specs, tokenspecs);
        for (var i = 0; i < rulesforstate.length; i++) {
            var rule = rulesforstate[i];
            {
                if(rule.re != regex.EOF)
                {
                    //var tokenclass = tokenspec['class'];
                    var nfa = rule.re.toNFA();
                    junq(nfa.acceptstates).forEach(function (as) {
                        as.tokenid = rules.indexOf(rule);
                        if(rule.re.bol){
                            as.bol=true;
                        }
                    });
                    nfas.push(nfa);
                }
            }
        }
    }

    var buildAutomata = function (rules, state) {
        var nfas = [], rulesforstate = junq(rules).where(function(rule){
            if(typeof rule.state === 'undefined'){
                return state === 'DEFAULT';
            }
            return ( (rule.state === state) || (rule.state.indexOf(state)>=0));
        }).toArray();
        //var nfas = [], tokenspecs =specs.tokens;
        buildAutomataInternal(rules, rulesforstate, nfas);
        //TODO: check if nfas.length>1
        var composite = mergeNFAs(nfas);
        var dfaspecs = composite.toDFA();
        dfaspecs.alphabet = dfaspecs.rulebook.getSymbols();
        var compositeDFA = new dfa.DFA(dfaspecs);
        compositeDFA.minimize();
        return compositeDFA;
    };

    //lex.buildAutomata = buildAutomata;


    function generateLexer(specs){
        var lexerName ='Lexer';
        if(specs && specs.moduleName){
            lexerName = specs.moduleName;
        }

        var str = [];
        str.push('var '+lexerName+' = (function (undefined) {');

        var res = processRules(specs);


        str.push(new dfa.DFA().compileBase('CDFA_base'));

        for(var specialstate in res.states){
            if(res.states.hasOwnProperty(specialstate)){
                if(specialstate === 'undefined') specialstate='DEFAULT';

                str.push(buildAutomata(res.rules,specialstate).compile(
                    {   className:'CDFA_'+specialstate,
                        baseClass: 'CDFA_base'
                    }));
            }
        }
        str.push('var EOF={};');
        str.push('function Lexer(){\n');
        str.push('if(!(this instanceof Lexer)) return new Lexer();\n');
        str.push('this.pos={line:0,col:0};\n');
        str.push('this.states={};');
        str.push('this.state = [\'DEFAULT\'];');
        str.push('this.lastChar = \'\\n\';');

        str.push('this.actions = ['+res.actions+'];');


        for(specialstate in res.states){
            if(res.states.hasOwnProperty(specialstate)){
                //if(specialstate === 'undefined') specialstate=undefined;
                str.push('this.states["'+specialstate+'"] = {};');
                str.push('this.states["'+specialstate+'"].dfa = new '+ 'CDFA_'+specialstate+'();');
                if( res.states[specialstate].eofaction){
                    str.push('this.states["'+specialstate+'"].eofaction = '+res.states[specialstate].eofaction+';');
                }
            }

        }

        str.push('}');


        str.push(
            junq(['setInput','nextToken','resetToken','halt','more','less','getDFA','getAction',
                'pushState', 'popState','getState','restoreLookAhead','evictTail','isEOF']).map(function(mname){
                return 'Lexer.prototype.'+mname+'=' + Lexer.prototype[mname].toString();
            }).toArray().join(';\n')
        );
        str.push(';');

        str.push(StringReader.toString());
        for(var mname in StringReader.prototype){
            str.push('StringReader.prototype.'+mname+'=' + StringReader.prototype[mname].toString()+';' );
        }
        str.push('if (typeof(module) !== \'undefined\') { module.exports = Lexer; }');
        str.push('return Lexer;})();');

        return str.join('\r\n');
    }
    lexer.generateLexer = generateLexer;

/*********** LEXER *************/
    function Lexer(specs) {
        if(!(this instanceof Lexer)) return new Lexer(specs);
        this.input = undefined;
        this.actions = [];
        this.states = {};
        this.state = [undefined];
        this.lawhole=undefined;
        var res = processRules(specs);
        this.actions = res.actions;
        this.states = res.states;

        for(var specialstate in this.states){
            if(this.states.hasOwnProperty(specialstate)){
                if(specialstate === 'undefined') specialstate=undefined;
                this.states[specialstate].dfa = buildAutomata(res.rules,specialstate);
            }
        }

    }

    Lexer.prototype.setInput = function(input){
        this.pos={row:0, col:0};
        if(typeof input === 'string')
        {input = new StringReader(input);}
        this.input = input;
        this.state = ['DEFAULT'];
        this.lastChar='\n';
        this.getDFA().reset();
        return this;
    };

    Lexer.prototype.pushState = function(state){
        this.state.push(state);
        this.getDFA().reset();
    };

    Lexer.prototype.popState = function(){
        if(this.state.length>1) {
            this.state.pop();
            this.getDFA().reset();
        }
    };

    Lexer.prototype.restoreLookAhead = function(){
        this.tailLength = this.jjtext.length;
        this.popState();
        this.less(this.tailLength);
        this.jjtext = this.lawhole.substring(0,this.lawhole.length-this.tailLength);


    };

    Lexer.prototype.evictTail = function(length){
        this.less(length);
        this.jjtext = this.jjtext.substring(0,this.jjtext.length-length);
    };


    Lexer.prototype.getState = function(){
        return this.state[this.state.length-1];
    };

    Lexer.prototype.getDFA = function(){
        return this.states[this.getState()].dfa;
    };

    Lexer.prototype.getAction = function(i){
        return this.actions[i];
    };

    Lexer.prototype.nextToken = function () {


        var ret = undefined;
        while(ret === undefined){
            this.resetToken();
            ret = this.more();
        }


        if (ret === EOF) {
            this.current = EOF;
        } else {
            this.current = {};
            this.current.name = ret;
            this.current.value = this.jjval;
            this.current.lexeme = this.jjtext;
            this.current.position = this.jjpos;
            this.current.pos = {col: this.jjcol, line: this.jjline};
        }
        return this.current;
    };


    Lexer.prototype.more = function(){
        var ret;
        while (this.input.more()) {
            var c = this.input.peek();
            this.getDFA().readSymbol(c);
            if (this.getDFA().isInDeadState()) {

                ret = this.halt();
                return ret;

            } else {
                if (this.getDFA().isAccepting()) {
                    this.lastValid = this.getDFA().getCurrentToken();
                    this.lastValidPos = this.input.getPos();

                }
                this.buffer = this.buffer + c;
                this.lastChar = c;
                this.input.next();
            }

        }
        ret = this.halt();
        return ret;
    };

    Lexer.prototype.resetToken = function(){
        this.getDFA().reset();
        this.getDFA().bol = (this.lastChar === '\n');
        this.lastValid = undefined;
        this.lastValidPos = -1;
        this.jjtext = '';
        this.remains = '';
        this.buffer = '';
        this.startpos = this.input.getPos();
        this.jjline = this.input.line;
        this.jjcol = this.input.col;
    };

    Lexer.prototype.halt = function () {
        if (this.lastValidPos >= 0) {
            var lastValidLength = this.lastValidPos-this.startpos+1;
            this.jjtext = this.buffer.substring(0, lastValidLength);
            this.remains = this.buffer.substring(lastValidLength);
            this.jjval = this.jjtext;
            this.jjpos = this.lastValidPos + 1-this.jjtext.length;
            this.input.rollback(this.remains);
            var action = this.getAction(this.lastValid);
            if (typeof ( action) === 'function') {
                return action.call(this);
            }
            this.resetToken();
        }
        else if(!this.input.more()){//EOF
            var actionid = this.states[this.getState()].eofaction;
            if(actionid){
                action = this.getAction(actionid);
                if (typeof ( action) === 'function') {
                    //Note we don't care of returned token, must return 'EOF'
                    action.call(this);
                }
            }
            return EOF;
        } else {//Unexpected character
            throw new Error('Unexpected char \''+this.input.peek()+'\' at '+this.jjline +':'+this.jjcol);
        }
    };


    Lexer.prototype.less = function(length){
        this.input.rollback(length);
    };

    Lexer.prototype.isEOF = function(o){
        return o===EOF;
    };

    lexer.EOF = EOF;
    lexer.Lexer = Lexer;

})( lexer || (lexer={}),automata,regex);

if (typeof(module) !== 'undefined') { module.exports = lexer; }
},{"./automata.js":8,"./regex":17,"./stringreader.js":18,"junq":19,"junq/sets":20}],10:[function(require,module,exports){
/**
 * Copyright by Gabriele Cannata 2013-2014
 */

var junq = junq || require('junq');
var sets = sets || require('junq/sets');
var automata = automata || require('./automata');

var parser;

(function (parser, dfa,  undefined) {


    /* Production */
    function Production(head, body) {
        "use strict";

        this.head = head;
        this.body = body;
    }

    Production.prototype.toString = function () {
        var str = [];

        str.push(this.head.toString());
        str.push(' ::= ');
        for (var i = 0; i < this.body.length; i++) {
            if (i === this.dot) str.push('.');
            str.push(this.body[i].toString());
            str.push(' ');
        }
        return str.join('');
    };

    Production.prototype.getItems = function () {
        "use strict";
        if (this.items === undefined) {
            var self = this;
            self.items = junq.range(self.body.length + 1, 0).map(function (i) {
                return new GItem(self, i);
            }).toArray();
        }
        return this.items;

    };

    parser.Production = Production;



    /* Non Terminals */


    var eps = parser.eps = dfa.eps;

    function NT(name) {
        "use strict";
        this.name = name;

    }


    NT.prototype.toString = function () {
        "use strict";
        return '<<' + this.name + '>>';
    };

    NT.prototype.match = function (other) {
        "use strict";
        return other.matchNonTerminal(this);
    };

    NT.prototype.matchTerminal = function (terminal) {
        "use strict";
        return false;
    };

    NT.prototype.matchNonTerminal = function (other) {
        "use strict";
        return other.name === this.name;
    };

    NT.prototype.clone = function () {
        "use strict";
        return new NT(this.name);
    };

    parser.NT = NT;

    function T(ob) {
        "use strict";
        this.name = ob;
    }

    T.prototype.match = function (other) {
        "use strict";
        return other.matchTerminal(this);
    };

    T.prototype.matchTerminal = function (terminal) {
        "use strict";
        return terminal.name === (this.name);
    };

    T.prototype.matchNonTerminal = function (nonterm) {
        "use strict";
        return false;
    };

    T.prototype.toString = function () {
        "use strict";
        return this.name.toString();
    };

    parser.T = T;

    var eof = new T('<<EOF>>');
    var EOFNUM = 0;
    //parser.eof = eof;

    function GItem(production, num) {
        "use strict";
        this.production = production;
        this.dot = num || 0;
    }


    GItem.prototype.toString = function () {
        "use strict";
        var str = [];
        var head = this.production.head;
        var body = this.production.body;
        str.push(head.toString());
        str.push(' ::= ');
        for (var i = 0; i < body.length; i++) {
            if (i === this.dot) str.push('.');
            str.push(body[i].toString());
            str.push(' ');
        }
        if (i === this.dot) str.push('.');
        return str.join('');
    };

    GItem.prototype.isAtStart = function () {
        "use strict";
        return this.dot === 0;
    };

    GItem.prototype.isAtEnd = function () {
        "use strict";
        return this.dot >= this.production.body.length;
    };

    GItem.prototype.symbolAhead = function () {
        "use strict";
        return this.production.body[this.dot];
    };

    GItem.prototype.tail = function () {
        "use strict";
        return this.production.body.slice(this.dot + 1, this.production.body.length);
    };

    GItem.prototype.nextItem = function () {
        "use strict";
        return this.production.getItems()[this.dot + 1];
    };

    GItem.prototype.equals = function (other) {
        "use strict";
        return other.production === this.production && other.dot === this.dot;
    };

    function LR1Item(item, lookahead) {
        "use strict";
        this.item = item;
        this.lookahead = lookahead;
    }

    LR1Item.prototype.toString = function () {
        "use strict";
        return '[' + this.item.toString() + ', ' + this.lookahead.toString() + ']';
    };

    LR1Item.prototype.equals = function (other) {
        "use strict";
        return this.item.equals(other.item) && this.lookahead === other.lookahead;
    };

    //TODO: find safest way to distinguish
    function isTerminal(e) {
        "use strict";
        return e instanceof T;
    }

    function isNonTerminal(e) {
        "use strict";
        return e instanceof NT;
    }

    function PG(grammar) {
        "use strict";
        var self = this;
        //this.grammar = grammar;
        this.tokens = grammar.tokens;
        this.nonTerminals = [];
        this.terminals = [];
        this.moduleName = grammar.moduleName;
        this.actionMode = grammar.actionMode || 'function';
        this.symbols = [eof];
        this.symbolsTable = {};
        this.symbolsTable[eof.name]=0;
        //eof will have index 0
        this.terminals.push(eof);
        this.processProductions(grammar.productions);

        self.operators={};
        if(grammar.operators !== undefined){
            junq(grammar.operators).forEach(function(oplist){
               self.operators[oplist[0].toString()] = oplist.slice(1,3);
            });
        }

        this.start = this.productions[0].head;

        this.computeFirstAndFollow();

        var mode = (grammar.mode || '').toUpperCase();
        if(mode==='LALR1'){
            this.computeLALR1();
        } else if (mode==='SLR'){
            this.computeSLR();
        } else if (mode === 'LR1'){
            this.computeLR1();
        } else {
            this.computeAuto();
        }
    }

    PG.prototype.computeAuto = function () {
        try{
            this.computeSLR();
        }catch(e)
        {
            try{
                this.computeLALR1();
            }
            catch(e)
            {
                    this.computeLR1();
            }
        }
    };

    PG.prototype.processProductions = function(productions){
        //here we split productions and actions, create internal productions and validate them
        var self = this;
        this.productions=[];
        this.actions=[];
        var additionalProductions = [];
        var head;
        while(productions.length>0){
            junq(productions).forEach(function(production){
                head = production[0] || head;
                var body = production[1];
                var action = production[2];

                body = junq(body).map(function(el){
                    return self.parseProduction(head, el,additionalProductions);
                }).toArray();

                var p = new Production(
                    self.addGrammarElement(head),
                    body.map(function(element){return self.addGrammarElement(element);})
                );
                self.productions.push(p);
                self.actions.push(action);

            });
            productions = additionalProductions;
            additionalProductions = [];
        }

    };

    var prodRE = /[\(\)\[\]\*\+\?\{\}]|(\\[\(\)\[\]\*\+\?\{\}]|[^\s()])*/g

    PG.prototype.parseProduction = function (head, element, additional) {
        if(element.isEBNF)
        {
            var id = this.productions.length;
            var ret = element.toBNF(head, id, additional);
            return ret;
        }
        else return element;

    };

    PG.prototype.addGrammarElement = function (element){

        if(this.symbolsTable[element]==undefined){
            var el=undefined;
            if(this.tokens.indexOf(element)>-1){
            //it's a terminal
                el = new T(element);
                this.terminals.push(el);
            }else{
                el = new NT(element);
                this.nonTerminals.push(el);
            }
            var index = this.symbols.push(el)-1;
            this.symbolsTable[element]=index;
        }
        return this.symbols[this.symbolsTable[element]];
    };

    //Computes FIRST and FOLLOW sets
    PG.prototype.computeFirstAndFollow = function () {
        "use strict";

        var first = {};
        var nullable = {};
        var follow = {};
        junq(this.terminals).forEach(function (t) {
            first[t] = new sets.Set(t);
        });

        var done = false;
        var self = this;
        //compute FIRST
        do {
            done = false;
            junq(this.productions).forEach(function (p) {
                var lhs = p.head;
                var rhs = p.body;
                first[lhs] = first[lhs] || new sets.Set();
                if (rhs.length == 0) {
                    done = first[lhs].add(eps) || done;
                    nullable[lhs] = true;
                } else {
                    var i;
                    for(i = 0;i<rhs.length;i++){
                        var e = rhs[i];
                        first[e] = first[e] || new sets.Set();
                        var fwe = first[e].clone();
                        fwe.remove(eps);
                        done = first[lhs].addSet(fwe) || done;
                        if(!first[e].contains(eps))  break;
                    }
                    //let's check if all rhs elements were nullable
                    if((i === rhs.length) && (first[rhs[i-1]].contains(eps))){
                        done = first[lhs].add(eps) || done;
                    }

                }
            });

        } while (done);

        //this is needed for computeFirst
        this.first = first;

        //compute FOLLOW
        follow[this.start] = follow[this.start] || new sets.Set();
        follow[this.start].add(eof);
        do {
            done = false;
            junq(this.productions).forEach(function (p) {
                var rhs = p.body;
                var lhs = p.head;
                for (var i = 0; i < rhs.length; i++) {

                    if (isNonTerminal(rhs[i])) {
                        follow[rhs[i]] = follow[rhs[i]] || new sets.Set();
                        if (i < rhs.length - 1) {
                            //BUG: here we need to compute first(rhs[i+1]...rhs[n])
                            var tail = rhs.slice(i+1);
                            //var f = first[rhs[i + 1]].clone();
                            var f = self.computeFirst(tail);
                            var epsfound = f.remove(eps);
                            done = follow[rhs[i]].addSet(f) || done;
                            if (epsfound) {
                                follow[lhs] = follow[lhs] || new sets.Set();
                                done = follow[rhs[i]].addSet(follow[lhs]) || done;
                            }
                        } else {

                            follow[lhs] = follow[lhs] || new sets.Set();
                            done = follow[rhs[i]].addSet(follow[lhs]) || done;
                        }


                    }


                }
            });

        } while (done);

        this.follow = follow;
    };

    PG.prototype.getProdutionsByHead = function (head) {
        "use strict";
        return junq(this.productions).where(function (p) {
            return p.head === head;
        });
    };
    PG.prototype.computeFirst = function (list) {
        var ret = new sets.Set();
        var self = this;

        for (var i = 0; i < list.length; i++) {
            var epsfound = false;
            var f = this.first[list[i]];
            if(typeof f === 'undefined'){
                throw Error('Unexpected element "'+list[i]+'"');
            }
            junq(f).forEach(function (e) {
                "use strict";
                if (e === eps) {
                    epsfound = true;
                } else {
                    ret.add(e);
                }
            });
            if (!epsfound) break;

        }
        if (i == list.length) {
            ret.add(eps);
        }
        return ret;
    };


    PG.prototype.closure = function (items) {
        "use strict";
        var self = this;
        var stack = items;//.toArray();
        var p = 0;
        while (p < stack.length) {
            var item = stack[p];
            var B = item.symbolAhead();
            if (isNonTerminal(B)) {
                junq(self.getProdutionsByHead(B)).forEach(function (prod) {
                var ni = prod.getItems()[0];

                            if (!junq(stack).any(function (i) {
                                return ni.equals(i);
                            })) {
                                stack.push(ni);
                            }

                });
            }
            p = p + 1;
        }
        return stack;
    };

    PG.prototype.closureLR1 = function (items) {
        "use strict";
        var self = this;
        var stack = items;//.toArray();
        var p = 0;
        while (p < stack.length) {
            var item = stack[p].item;
            var lookahead = stack[p].lookahead;
            var B = item.symbolAhead();
            if (isNonTerminal(B)) {
                junq(self.getProdutionsByHead(B)).forEach(function (prod) {
                    var suffix = item.tail();
                    suffix.push(lookahead);
                    var first = self.computeFirst(suffix);
                    junq(first).filter(function (symbol) {
                        return isTerminal(symbol);
                    })
                        .forEach(function (b) {
                            var ni = new LR1Item(prod.getItems()[0], b);
                            if (!junq(stack).any(function (item) {
                                return ni.equals(item);
                            })) {
                                stack.push(ni);
                            }
                        });
                });
            }
            p = p + 1;
        }
        return stack;
    };

    PG.prototype.gotoLR0 = function (i, x) {
        "use strict";
        var j = [];
        junq(i).forEach(function (item) {
            if (!item.isAtEnd()) {
                if(item.symbolAhead()===x) {
                    j.push(item.nextItem());
                }
            }
        });
        //Nota: potrebbero esserci ripetizioni.
        return this.closure(j);
    };

    PG.prototype.gotoLR1 = function (i, x) {
        "use strict";
        var j = [];
        junq(i).forEach(function (lr1item) {
            var gitem = lr1item.item;
            if (!gitem.isAtEnd()) {
                var a = lr1item.lookahead;
                if (gitem.symbolAhead() === x) {
                    j.push(new LR1Item(gitem.nextItem(), a));
                }
            }
        });
        //Nota: potrebbero esserci ripetizioni.
        return this.closureLR1(j);
    };

    PG.prototype.computeSLR = function () {
        this.S1 = new NT('S\'');
        var states = [];
        var self = this;
        var newAction;
        self.action = {};
        self.goto = {};
        this.startproduction = new Production(this.S1, [this.start]);
        //Inizia da I0 (stato 0): closure({[S'::=S,§]}) sullo stack da elaborare
        this.startitem = self.closure([this.startproduction.getItems()[0]]);

        states.push(this.startitem);
        var i = 0;
        while (i < states.length) {
            //prendi lo stato Ii da elaborare in cima allo stack
            var Ii = states[i];
            var act = (self.action[i] = self.action[i] || {});
            junq(Ii).forEach(
                function (gitem) {
                    //per ogni item
                    if (gitem.isAtEnd()) {
                        //se A non è S' aggiungi ACTION(i,a) = reduce (A-> X)
                        var p = gitem.production;
                        var pindex = self.productions.indexOf(p);

                        if (p.head !== self.S1) {
                            var follow = self.follow[p.head];
                            junq(follow).forEach(function(a)
                            {
                                newAction = ['reduce', [self.symbolsTable[gitem.production.head.name], gitem.production.body.length, pindex]];
                                self.tryAddAction(act, gitem, a, newAction);
                            });
                        }
                        else { //A == S'
                            act[EOFNUM] = ['accept', []];
                        }
                    }
                    else //not at end
                    {
                        var a = gitem.symbolAhead();
                        //Calcola Ij=gotoLR1(Ii,X)
                        var Ij = self.gotoLR0(Ii,a);
                        //check if IJ is on the stack
                        var j = self.findState(states, Ij);
                        if (j < 0) {
                            //Se Ij non è sullo stack, fare push
                            j = states.push(Ij)-1;
                        }
                        else{
                            //console.log("state already found");
                        }
                        var an = self.symbolsTable[a.name];
                        if (isNonTerminal(a)) {
                            //Se X è non terminale: aggiungi a tabella GOTO(i,X)=j
                            (self.goto[i] = self.goto[i] || {})[an] = j;
                        }else{
                            //Se X è terminale: aggiungi a ACTION(i,X) = shift j
                            newAction = ['shift', [j]];
                            self.tryAddAction(act,gitem,a,newAction);
                        }
                    }
                }
            );
            i = i+1;
        }
        this.statesTable = states;
        this.startState = 0;
    };

    PG.prototype.computeLR1 = function () {
        this.S1 = new NT('S\'');
        var states = [];
        var self = this;
        var newAction;
        self.action = {};
        self.goto = {};
        this.startproduction = new Production(this.S1, [this.start]);
        //Inizia da I0 (stato 0): closureLR1({[S'::=S,§]}) sullo stack da elaborare
        this.startitem = self.closureLR1([new LR1Item(this.startproduction.getItems()[0], eof)]);

        states.push(this.startitem);
        var i = 0;
        while (i < states.length) {
            //prendi lo stato Ii da elaborare in cima allo stack
            var Ii = states[i];
            var act = (self.action[i] = self.action[i] || {});
            junq(Ii).forEach(
                function (lr1item) {
                    //per ogni LR1item
                    var gitem = lr1item.item;

                    var lookahead = lr1item.lookahead;
                    if (gitem.isAtEnd()) {
                        //se A non è S' aggiungi ACTION(i,a) = reduce (A-> X)
                        var p = gitem.production;
                        var pindex = self.productions.indexOf(p);
                        if (p.head !== self.S1) {

                            newAction = ['reduce', [self.symbolsTable[gitem.production.head.name], gitem.production.body.length, pindex]];
                            self.tryAddAction(act,gitem,lookahead,newAction);
                        }
                        else { //A == S'
                            act[EOFNUM] = ['accept', []];
                        }
                    }
                    else //not at end
                    {
                        var a = gitem.symbolAhead();
                        //Calcola Ij=gotoLR1(Ii,X)
                        var Ij = self.gotoLR1(Ii, a);
                        //check if IJ is on the stack
                        var j = self.findState(states, Ij);
                        if (j < 0) {
                            //Se Ij non è sullo stack, fare push
                            j = states.push(Ij)-1;
                        }
                        else{
                            //console.log("state already found");
                        }
                        //altrimenti j = posizione di Ij sullo stack
                        var an = self.symbolsTable[a.name];
                        if (isNonTerminal(a)) {
                            //Se X è non terminale: aggiungi a tabella GOTO(i,X)=j
                            (self.goto[i] = self.goto[i] || {})[an] = j;
                        }else{
                            //Se X è terminale: aggiungi a ACTION(i,X) = shift j
                            newAction = ['shift', [j]];
                            self.tryAddAction(act,gitem,a,newAction);
                        }
                    }
                }
            );
            i = i+1;
        }
        this.statesTable = states;
        this.startState = 0;
    };

    PG.prototype.computeLALR1 = function () {
        this.S1 = new NT('S\'');
        var states = [];
        var self = this;
        var newAction;
        self.action = {};
        self.goto = {};
        this.startproduction = new Production(this.S1, [this.start]);
        //Inizia da I0 (stato 0): closureLR1({[S'::=S,§]}) sullo stack da elaborare
        this.startitem = self.closureLR1([new LR1Item(this.startproduction.getItems()[0], eof)]);

        states.push(this.startitem);
        var i = 0;
        while (i < states.length) {
            //prendi lo stato Ii da elaborare in cima allo stack
            var Ii = states[i];
            var act = (self.action[i] = self.action[i] || {});
            junq(Ii).forEach(
                function (lr1item) {
                    //per ogni LR1item
                    var gitem = lr1item.item;

                    var lookahead = lr1item.lookahead;
                    if (gitem.isAtEnd()) {
                        //se A non è S' aggiungi ACTION(i,a) = reduce (A-> X)
                        var p = gitem.production;
                        var pindex = self.productions.indexOf(p);
                        if (p.head !== self.S1) {
                            newAction = ['reduce', [self.symbolsTable[gitem.production.head.name], gitem.production.body.length, pindex]];
                            self.tryAddAction(act,gitem,lookahead,newAction);
                        }
                        else { //A == S'
                            act[EOFNUM] = ['accept', []];
                        }
                    }
                    else //not at end
                    {
                        var a = gitem.symbolAhead();
                        //Calcola Ij=gotoLR1(Ii,X)
                        var Ij = self.gotoLR1(Ii, a);
                        //check if IJ is on the stack
                        var j = self.findSimilarState(states, Ij);
                        if (j < 0) {
                            //Se Ij non è sullo stack, fare push
                            j = states.push(Ij)-1;
                        }
                        else{
                            self.mergeStates(j,states[j],Ij)
                        }
                        //altrimenti j = posizione di Ij sullo stack
                        var an = self.symbolsTable[a.name];
                        if (isNonTerminal(a)) {
                            //Se X è non terminale: aggiungi a tabella GOTO(i,X)=j
                            (self.goto[i] = self.goto[i] || {})[an] = j;
                        }else{
                            //Se X è terminale: aggiungi a ACTION(i,X) = shift j

                            newAction = ['shift', [j]];
                            self.tryAddAction(act,gitem,a,newAction);
                        }
                    }
                }
            );
            i = i+1;
        }
        this.statesTable = states;
        this.startState = 0;
    };

    PG.prototype.findState = function (list, state) {
        var self = this;
        for (var i = 0; i < list.length; i++) {
            var s = list[i];
            if (s.length != state.length) continue;
            //check if every item in s is also in state
            var equals = true;
            for (var i1 = 0; i1 < s.length; i1++) {
                var item1 = s[i1];

                var found = junq(state).any(
                    function (item2) {
                        return item2.equals(item1);
                    }
                );
                if (!found) {
                    equals = false;
                    break;
                }
            }
            if (equals) return i;
        }
        //we exited the loop, the state was not found
        return -1;
    };

    PG.prototype.findSimilarState = function (list, state) {
        var self = this;
        for (var i = 0; i < list.length; i++) {
            var s = list[i];
            if (s.length != state.length) continue;
            //check if every item in s is also in state
            var equals = true;
            for (var i1 = 0; i1 < s.length; i1++) {
                var item1 = s[i1];

                var found = junq(state).any(
                    function (item2) {
                        return item2.item.equals(item1.item);
                    }
                );
                if (!found) {
                    equals = false;
                    break;
                }
            }
            if (equals) return i;
        }
        //we exited the loop, the state was not found
        return -1;
    };

    PG.prototype.mergeStates = function(j,state, other){
        var self=this;
        junq(state).forEach(function(lr1item){
            if(lr1item.item.isAtEnd()) {
                var otherLR1item = junq(other).first(function (oLR1item) {
                    return oLR1item.item.equals(lr1item.item);
                });
                //merge the lookahead of otherLR1item into the ones of lr1item
                var gitem = otherLR1item.item;
                var p = gitem.production;
                var lookahead = otherLR1item.lookahead;
                var pindex = self.productions.indexOf(p);
                var act = (self.action[j] = self.action[j] || {});
                if (p.head !== self.S1) {
                    var newAction = ['reduce', [self.symbolsTable[gitem.production.head.name], gitem.production.body.length, pindex]];
                    self.tryAddAction(act,gitem,lookahead,newAction);
                }
                else { //A == S'
                    act[EOFNUM] = ['accept', []];
                }
            }

        });
    };

    PG.prototype.tryAddAction = function(act, gitem, lookahead, newAction){
        var self = this;
        var an = self.symbolsTable[lookahead] || 0;

        if (act[an] === undefined) {
            act[an] = newAction;
        } else {
            //check if prod contains an operator and compare it to a
            act[an] = self.resolveConflict(act[an], newAction, lookahead, gitem);
        }
    };





    PG.prototype.getSymbols = function () {
        return junq(this.getNonTerminals()).append(this.getTerminals()).toArray();
    };






    PG.prototype.resolveConflict = function (currentAction, newAction, a, gitem) {
        "use strict";
        //if current action is reduce we have a prod, otherwise?
        var shiftAction, reduceAction;
        var curtype = currentAction[0];
        var prod;
        if (curtype === 'reduce') {
            reduceAction = currentAction;

            if (newAction[0] == 'reduce') {
                if(newAction[1][0]!=currentAction[1][0] || newAction[1][1]!=currentAction[1][1]
                    || newAction[1][2]!=currentAction[1][2]){
                    throw new Error('Reduce/Reduce conflict in ' + gitem + ' on ' + a);
                }
                else{
                    return currentAction;
                }
            } else {
                shiftAction = newAction;
            }
        } else { //current is shift
            shiftAction = currentAction;
            if (newAction[0] === 'shift') {
                if(newAction[1][0] != currentAction[1][0]) {
                    throw new Error('Shift/Shift conflict in ' + gitem + ' ob ' + a);
                } else {
                    return currentAction;
                }
            } else {
                //new Action is Reduce
                reduceAction = newAction;
            }
        }

        prod = this.productions[reduceAction[1][2]];

        //check if a is an operator

        var operators = this.operators;
        if (operators && operators[a.name]) {
            var aassoc = operators[a.name][0];
            var aprio = operators[a.name][1];
            //check if prod contains an operator
            var op = junq(prod.body).first(function (t) {
                return isTerminal(t) && operators[t.name];
            });
            if (op) {
                var redassoc = operators[op.name][0];
                var redprio = operators[op.name][1];
                //first check if it is the same priority
                if (aprio === redprio) {
                    //check associativity
                    if(redassoc === 'nonassoc') {
                        return ['error',['operator "'+op+'" is non associative']]
                    } else if (redassoc === 'left') {
                        //prefer reduce
                        return reduceAction;
                    } else {
                        //prefer shift
                        return shiftAction;
                    }
                } else if (aprio > redprio) {
                    return shiftAction;
                } else { //aprio < redprio
                    return reduceAction;
                }
            }
            else {

            }

        } else {
            //a is not an operator
        }
        throw new Error('Shift / Reduce conflict on ' + gitem + ' on ' + a)
    };


    PG.prototype.printActionTable = function () {
        var str;
        for (var i = 1; i < this.action.length; i++) {
            str = [];
            str.push(i);
            str.push(': ');
            for (var p in this.action[i]) {
                str.push(p);
                str.push('->');
                str.push(this.action[i][p][0]);
                str.push(this.action[i][p][1][0]);
                str.push('\t');
            }

            console.log(str.join(''));
        }
    };

    PG.prototype.generateParser = function() {
        var self=this;
        this.moduleName =  this.moduleName  || 'Parser';
        var str = [];
        str.push('var '+this.moduleName +' = (function (undefined) {');
        //Constructor
        //str.push('var eof='+JSON.stringify(eof)+';');
        str.push('function Parser(environment){');
        str.push('if(!(this instanceof Parser)) return new Parser(environment);');
        str.push('var env,modules,imports;')
        str.push('env=modules=imports=environment;');
        str.push('this.action='+JSON.stringify(this.action)+';');
        str.push('this.goto='+JSON.stringify(this.goto)+';');
        if(this.actions !== undefined){
            str.push('this.actions=['+this.actions.toString()+'];');
        }
        str.push('this.startstate='+this.startState+';');
        str.push('this.symbolsTable='+JSON.stringify(this.symbolsTable)+';');
        str.push('this.actionMode=\''+this.actionMode+'\';');
/*
        if(specs.debug){
            str.push('this.symbols='+JSON.stringify(this.symbols)+';');
        }
*/
        str.push('}');

        junq(['identity','parse','shift','reduce','accept','error','create']).forEach(function(mname){
            str.push('Parser.prototype.'+mname+'=' + Parser.prototype[mname].toString()+';');
        });


        str.push('if (typeof(module) !== \'undefined\') { module.exports = Parser; }');
        str.push('return Parser;');
        str.push('})();');
        return str.join('\r\n');
    };


    function LRRuleBook(rules) {
        "use strict";
        this.rules = rules;
    }

    LRRuleBook.prototype = new dfa.NDRuleBook();

    //TODO: move the getSymbol function out of rulebook
    LRRuleBook.prototype.getSymbols = function () {
        "use strict";
        var symbols = [];
        junq(this.rules)
            .filter(function (rule) {
                return ((rule.input !== dfa.eps) /* && !(rule.input.negate)*/);
            })
            .map(function (rule) {
                return rule.input;
            })
            .forEach(function (i) {
                if (!junq(symbols).any(function (s) {
                    return s.match(i);
                })) {
                    symbols.push(i);
                }
            });

        return symbols;
    };

    //This will be compiled
    function Parser(grammar) {
        "use strict";
        if(!(this instanceof Parser)) return new Parser(grammar);
        var specs = new PG(grammar);
        this.action = specs.action;
        this.goto = specs.goto;
        this.actions = specs.actions;
        this.startstate = specs.startState;
        //This is needed to translate from lexer names to parser numbers
        this.symbolsTable = specs.symbolsTable;
        this.actionMode = specs.actionMode;
        this.symbols = specs.symbols;
    }

    Parser.prototype.identity = function (x) {
        "use strict";
        return x;
    };

    Parser.prototype.create = function(ctor,args){
        var args = [this.context].concat(args);
        var factory = ctor.bind.apply(ctor,args);
        return new factory();
    }

    //Note: this only actually needs:
    //* symbolsTable
    //* action
    //* actions
    //* startstate
    Parser.prototype.parse = function (lexer, context) {
        this.stack = [];
        this.context =  context || {};

        this.lexer = lexer;
        this.a = this.lexer.nextToken();
        this.stack.push({s: this.startstate, i: 0});
        this.accepted = false;
        this.inerror = false;
        while (!this.accepted && !this.inerror) {
            var top = this.stack[this.stack.length - 1];
            var s = top.s;
            //this.a = this.currentToken;
            if(lexer.isEOF(this.a))
                this.an = 0;
            else
                this.an = this.symbolsTable[this.a.name];
            var action = this.action[s][this.an];
            if (action !== undefined) {
                this[action[0]].apply(this, action[1]);
            } else {
                this.inerror = true;
                this.error(this.a,this);
            }
        }
        return top.i.value;
    };

    Parser.prototype.shift = function (state) {
        "use strict";
        this.stack.push({s: state, i: this.a});
        this.a = this.lexer.nextToken();

    };

    Parser.prototype.reduce = function (head, length, prodindex) {
        "use strict";
        //var prod = this.productions[prodnumber];
        var self = this;
        var rhs = this.stack.splice(-length, length);
        var t = this.stack[this.stack.length - 1];
        var ns = this.goto[t.s][head];
        var value;
        if (this.actions) {
            var action = this.actions[prodindex] || this.identity;
            var values = rhs.map(function (si) {
                return si.i.value;
            });

            if(self.actionMode==='constructor')
                value =  this.create(action,values);
            else
                value =  action.apply(this.context, values);
        }
        //If we are debugging

        if(this.symbols) {
            var nt = {name: this.symbols[head].name, value:value};
            this.stack.push({s: ns, i: nt});
        }
        else
        {
            this.stack.push({s: ns,i:{value: value}});
        }

    };

    Parser.prototype.accept = function () {
        "use strict";
        this.accepted = true;
    };

    Parser.prototype.error = function(token){
        if(typeof token === 'string')
        {
            throw Error(token);
        }
        if(this.lexer.isEOF(token)){
            throw Error("Unexpected EOF at "+this.lexer.jjline+':'+this.lexer.jjcol);
        } else
        throw Error('Unexpected token '+token.name+' "'+token.lexeme+'" at ('+token.pos.line+':'+token.pos.col+')');
    };


    function Optional(){
        if(!(this instanceof Optional)) return new Optional(Array.prototype.slice.apply(arguments));
        this.productionlist = arguments[0];
        this.isEBNF = true;
    }

    Optional.prototype.toBNF = function(_,id, additional){
        //arrange an unique name
        var prod2;
        var prod1;
        var name = 'Optional_'+id+'_'+additional.length;
        if(this.productionlist.length > 1){
            prod1 = [name, [], function () {
                return [];
            }];
            prod2 = [name, this.productionlist, function () {
                return [].slice.apply(arguments);
            }];
        } else {
            prod1 = [name, [], function () {
                return undefined;
            }];
            prod2 = [name, this.productionlist, function () {
                return arguments[0];
            }];
        }

        additional.push(prod1);
        additional.push(prod2);
        return name;
    };

    function Repeat(){
        if(!(this instanceof Repeat)) return new Repeat(Array.prototype.slice.apply(arguments));
        this.productionlist = arguments[0];
        this.isEBNF = true;
    }

    Repeat.prototype.toBNF = function(_,id, additional){
        //arrange an unique name
        var name = 'Repeat_'+id+'_'+additional.length;

        var prod1 = [name, [], function(){return [];}];
        var prod2 = [name, [name].concat(this.productionlist),
            function(){
                return arguments[0].concat(Array.prototype.slice.call(arguments,1));
            }
        ];
        additional.push(prod1);
        additional.push(prod2);
        return name;
    };

    function Group(){
        if(!(this instanceof Group)) return new Group(Array.prototype.slice.apply(arguments));
        this.productionlist = arguments[0];
        this.isEBNF = true;
    }

    Group.prototype.toBNF = function(_,id,additional){
        var name = 'Group'+id+'_'+additional.length;
        //we must determine if we have alternatives
        var alternatives = [this.productionlist];
        if(this.productionlist.length>1 && Array.isArray(this.productionlist[0])){
            alternatives = this.productionlist;
        }
        junq(alternatives).forEach(function(e){
            var prod;
            if(!Array.isArray(e)) e = [e];
            if(e.length>1){
                prod = [name, e, function () {
                    return Array.prototype.slice.call(arguments);
                }];
            } else {
                prod = [name, e, function () {
                    return arguments[0];
                }];
            }

            additional.push(prod);
        });
        return name;
    };

    function generateParser(grammar){
        var pg = new PG(grammar);
        return pg.generateParser();
    }

    function log(){
        console.log(arguments);
    }

    parser.Parser = Parser;
    parser.generateParser = generateParser;
    parser.Optional = Optional;
    parser.Repeat = Repeat;
    parser.Group = Group;
    //parser.ParserGenerator = PG;
    //PG.LexerAdapter = LexerAdapter;

})(parser || (parser = {}), automata);

if (typeof(module) !== 'undefined') { module.exports = parser; }

},{"./automata":8,"junq":19,"junq/sets":20}],11:[function(require,module,exports){
/**
 * Created by gcannata on 27/08/2014.
 */

//node ./cmd/cmd.js -t ./lib/parser/gramlex.jacoblex -g ./lib/parser/gramgram.js -l ./lib/parser/jacobgramlexer.js -p ./lib/parser/jacobgraminterpreter.js



function parseJacobGrammar(str){
    var Lexer = require('./JacobGramLexer');
    var Parser = require('./JacobGramInterpreter');
    var junq = require('junq');
    var _p = require('../parser');
    var l = new Lexer().setInput(str);
    var p = new Parser({junq: junq, parser:_p});
    var grammar = {};
    var ret = p.parse(l,grammar);
    return grammar;
}

module.exports = parseJacobGrammar;
},{"../parser":10,"./JacobGramInterpreter":12,"./JacobGramLexer":13,"junq":19}],12:[function(require,module,exports){
var jacobgraminterpreter = (function (undefined) {
function Parser(environment){
if(!(this instanceof Parser)) return new Parser(environment);
var env = environment;
this.action={"0":{"0":["reduce",[2,0,15]],"5":["reduce",[2,0,15]],"9":["reduce",[2,0,15]],"10":["reduce",[2,0,15]]},"1":{"0":["accept",[]]},"2":{"0":["reduce",[3,0,17]],"5":["shift",[7]],"9":["shift",[8]],"10":["reduce",[3,0,17]]},"3":{"0":["reduce",[1,2,0]],"10":["shift",[10]]},"4":{"0":["reduce",[2,2,16]],"5":["reduce",[2,2,16]],"9":["reduce",[2,2,16]],"10":["reduce",[2,2,16]]},"5":{"0":["reduce",[30,1,27]],"5":["reduce",[30,1,27]],"9":["reduce",[30,1,27]],"10":["reduce",[30,1,27]]},"6":{"0":["reduce",[30,1,28]],"5":["reduce",[30,1,28]],"9":["reduce",[30,1,28]],"10":["reduce",[30,1,28]]},"7":{"6":["shift",[11]]},"8":{"10":["shift",[12]]},"9":{"0":["reduce",[3,2,18]],"10":["reduce",[3,2,18]]},"10":{"12":["shift",[13]]},"11":{"0":["reduce",[7,0,19]],"5":["reduce",[7,0,19]],"6":["reduce",[7,0,19]],"9":["reduce",[7,0,19]],"10":["reduce",[7,0,19]]},"12":{"0":["reduce",[8,2,2]],"5":["reduce",[8,2,2]],"9":["reduce",[8,2,2]],"10":["reduce",[8,2,2]]},"13":{"6":["reduce",[28,0,23]],"10":["reduce",[28,0,23]],"14":["reduce",[28,0,23]],"18":["reduce",[28,0,23]],"22":["reduce",[28,0,23]],"23":["reduce",[28,0,23]],"24":["reduce",[28,0,23]],"25":["reduce",[28,0,23]],"26":["reduce",[28,0,23]],"27":["reduce",[28,0,23]],"31":["reduce",[28,0,23]]},"14":{"0":["reduce",[4,3,1]],"5":["reduce",[4,3,1]],"6":["shift",[18]],"9":["reduce",[4,3,1]],"10":["reduce",[4,3,1]]},"15":{"14":["shift",[19]]},"16":{"14":["reduce",[29,0,25]],"18":["reduce",[29,0,25]],"31":["shift",[22]]},"17":{"6":["shift",[25]],"10":["shift",[24]],"14":["reduce",[15,1,13]],"18":["reduce",[15,1,13]],"22":["shift",[26]],"23":["reduce",[15,1,13]],"24":["shift",[27]],"25":["reduce",[15,1,13]],"26":["shift",[28]],"27":["reduce",[15,1,13]],"31":["reduce",[15,1,13]]},"18":{"0":["reduce",[7,2,20]],"5":["reduce",[7,2,20]],"6":["reduce",[7,2,20]],"9":["reduce",[7,2,20]],"10":["reduce",[7,2,20]]},"19":{"0":["reduce",[11,4,3]],"10":["reduce",[11,4,3]]},"20":{"14":["reduce",[17,0,6]],"18":["reduce",[17,0,6]]},"21":{"14":["reduce",[16,1,14]],"18":["reduce",[16,1,14]]},"22":{"14":["reduce",[29,1,26]],"18":["reduce",[29,1,26]]},"23":{"6":["reduce",[28,2,24]],"10":["reduce",[28,2,24]],"14":["reduce",[28,2,24]],"18":["reduce",[28,2,24]],"22":["reduce",[28,2,24]],"23":["reduce",[28,2,24]],"24":["reduce",[28,2,24]],"25":["reduce",[28,2,24]],"26":["reduce",[28,2,24]],"27":["reduce",[28,2,24]],"31":["reduce",[28,2,24]]},"24":{"6":["reduce",[21,1,8]],"10":["reduce",[21,1,8]],"14":["reduce",[21,1,8]],"18":["reduce",[21,1,8]],"22":["reduce",[21,1,8]],"23":["reduce",[21,1,8]],"24":["reduce",[21,1,8]],"25":["reduce",[21,1,8]],"26":["reduce",[21,1,8]],"27":["reduce",[21,1,8]],"31":["reduce",[21,1,8]]},"25":{"6":["reduce",[21,1,9]],"10":["reduce",[21,1,9]],"14":["reduce",[21,1,9]],"18":["reduce",[21,1,9]],"22":["reduce",[21,1,9]],"23":["reduce",[21,1,9]],"24":["reduce",[21,1,9]],"25":["reduce",[21,1,9]],"26":["reduce",[21,1,9]],"27":["reduce",[21,1,9]],"31":["reduce",[21,1,9]]},"26":{"6":["reduce",[28,0,23]],"10":["reduce",[28,0,23]],"14":["reduce",[28,0,23]],"18":["reduce",[28,0,23]],"22":["reduce",[28,0,23]],"23":["reduce",[28,0,23]],"24":["reduce",[28,0,23]],"25":["reduce",[28,0,23]],"26":["reduce",[28,0,23]],"27":["reduce",[28,0,23]],"31":["reduce",[28,0,23]]},"27":{"6":["reduce",[28,0,23]],"10":["reduce",[28,0,23]],"14":["reduce",[28,0,23]],"18":["reduce",[28,0,23]],"22":["reduce",[28,0,23]],"23":["reduce",[28,0,23]],"24":["reduce",[28,0,23]],"25":["reduce",[28,0,23]],"26":["reduce",[28,0,23]],"27":["reduce",[28,0,23]],"31":["reduce",[28,0,23]]},"28":{"6":["reduce",[28,0,23]],"10":["reduce",[28,0,23]],"14":["reduce",[28,0,23]],"18":["reduce",[28,0,23]],"22":["reduce",[28,0,23]],"23":["reduce",[28,0,23]],"24":["reduce",[28,0,23]],"25":["reduce",[28,0,23]],"26":["reduce",[28,0,23]],"27":["reduce",[28,0,23]],"31":["reduce",[28,0,23]]},"29":{"14":["reduce",[13,3,4]],"18":["shift",[34]]},"30":{"23":["shift",[35]]},"31":{"25":["shift",[36]]},"32":{"18":["reduce",[20,0,21]],"25":["reduce",[20,0,21]]},"33":{"27":["shift",[38]]},"34":{"6":["reduce",[28,0,23]],"10":["reduce",[28,0,23]],"14":["reduce",[28,0,23]],"18":["reduce",[28,0,23]],"22":["reduce",[28,0,23]],"23":["reduce",[28,0,23]],"24":["reduce",[28,0,23]],"25":["reduce",[28,0,23]],"26":["reduce",[28,0,23]],"27":["reduce",[28,0,23]],"31":["reduce",[28,0,23]]},"35":{"6":["reduce",[21,3,10]],"10":["reduce",[21,3,10]],"14":["reduce",[21,3,10]],"18":["reduce",[21,3,10]],"22":["reduce",[21,3,10]],"23":["reduce",[21,3,10]],"24":["reduce",[21,3,10]],"25":["reduce",[21,3,10]],"26":["reduce",[21,3,10]],"27":["reduce",[21,3,10]],"31":["reduce",[21,3,10]]},"36":{"6":["reduce",[21,3,11]],"10":["reduce",[21,3,11]],"14":["reduce",[21,3,11]],"18":["reduce",[21,3,11]],"22":["reduce",[21,3,11]],"23":["reduce",[21,3,11]],"24":["reduce",[21,3,11]],"25":["reduce",[21,3,11]],"26":["reduce",[21,3,11]],"27":["reduce",[21,3,11]],"31":["reduce",[21,3,11]]},"37":{"18":["shift",[40]],"25":["reduce",[19,2,7]]},"38":{"6":["reduce",[21,3,12]],"10":["reduce",[21,3,12]],"14":["reduce",[21,3,12]],"18":["reduce",[21,3,12]],"22":["reduce",[21,3,12]],"23":["reduce",[21,3,12]],"24":["reduce",[21,3,12]],"25":["reduce",[21,3,12]],"26":["reduce",[21,3,12]],"27":["reduce",[21,3,12]],"31":["reduce",[21,3,12]]},"39":{"14":["reduce",[29,0,25]],"18":["reduce",[29,0,25]],"31":["shift",[22]]},"40":{"6":["reduce",[28,0,23]],"10":["reduce",[28,0,23]],"14":["reduce",[28,0,23]],"18":["reduce",[28,0,23]],"22":["reduce",[28,0,23]],"23":["reduce",[28,0,23]],"24":["reduce",[28,0,23]],"25":["reduce",[28,0,23]],"26":["reduce",[28,0,23]],"27":["reduce",[28,0,23]],"31":["reduce",[28,0,23]]},"41":{"14":["reduce",[17,4,5]],"18":["reduce",[17,4,5]]},"42":{"18":["reduce",[20,3,22]],"25":["reduce",[20,3,22]]}};
this.goto={"0":{"1":1,"2":2},"2":{"3":3,"4":5,"8":6,"30":4},"3":{"11":9},"11":{"7":14},"13":{"13":15,"15":16,"28":17},"16":{"16":20,"29":21},"17":{"21":23},"20":{"17":29},"26":{"15":30,"28":17},"27":{"15":32,"19":31,"28":17},"28":{"15":33,"28":17},"32":{"20":37},"34":{"15":39,"28":17},"39":{"16":41,"29":21},"40":{"15":42,"28":17}};
this.actions=[function (operators, prods){
                this.productions = [].concat.apply([],prods);
                return prods;
            },function (assoc, symbol, symbols){

                var symbols = [symbol].concat(symbols);
                this.operators = this.operators || [];
                var max = 0;
                if(this.operators.length>0){
                    max = this.operators[this.operators.length-1][2];
                }
                max = max + 100;
                for(var i=0;i<symbols.length;i++){
                    this.operators.push([symbols[i],assoc,max]);
                }
                return this.operators;
            },function (directive, id){
                this[directive] = id;
            },function (head,_1,rhs){
                    var ret = environment.junq(rhs).map(function(pa){
                        return [head].concat(pa);
                    });
                return ret.toArray();
            },function (rhs1, act1, list){
                //AlternativesWithActions
                var ret = [[rhs1, act1]];

                return ret.concat(list);

            },function (acc, _, rhs, act){
                //AlternativesWithActions
                acc.push([rhs,act]);
                return acc;

            },function (_){
                //RHSRepeat empty
                return ([]);

            },function (rhs1, list){
                //AlternativesWithoutActions
                return [rhs1].concat(list);
            },function (id){
                //id
                return id;
            },function (terminal){
                //terminal

                this.tokens = (this.tokens || []).concat(terminal);
                return terminal;
            },function (_,rhs){
                return env.parser.Optional.apply(null,rhs);
            },function (_,rhs){
                return env.parser.Group.apply(null,env.junq(rhs).odd().toArray());
            },function (_,rhs){

                return env.parser.Repeat(rhs);
            },function (atoms){

                    return atoms;
            },function (action){
                var f;
                if(typeof action !== 'undefined') {
                    f = eval('(' + action + ')');
                }
                return f;
            },function (){return [];},function (){
                return arguments[0].concat(Array.prototype.slice.call(arguments,1));
            },function (){return [];},function (){
                return arguments[0].concat(Array.prototype.slice.call(arguments,1));
            },function (){return [];},function (){
                return arguments[0].concat(Array.prototype.slice.call(arguments,1));
            },function (){return [];},function (){
                return arguments[0].concat(Array.prototype.slice.call(arguments,1));
            },function (){return [];},function (){
                return arguments[0].concat(Array.prototype.slice.call(arguments,1));
            },function () {
                return undefined;
            },function () {
                return arguments[0];
            },function () {
                    return arguments[0];
                },function () {
                    return arguments[0];
                }];
this.startstate=0;
this.symbolsTable={"<<EOF>>":0,"Grammar":1,"Repeat_0_0":2,"Repeat_0_2":3,"OperatorDecl":4,"Op":5,"Terminal":6,"Repeat_1_4":7,"DirectiveDecl":8,"Directive":9,"id":10,"Rule":11,"=":12,"AlternativesWithActions":13,";":14,"RHS":15,"Action":16,"RHSRepeat":17,"|":18,"Alternatives":19,"Repeat_7_6":20,"RHSAtom":21,"[":22,"]":23,"(":24,")":25,"{":26,"}":27,"Repeat_13_8":28,"Optional_14_10":29,"Group16_0":30,"function":31};
this.actionMode='function';
}
Parser.prototype.identity=function (x) {
        "use strict";
        return x;
    };
Parser.prototype.parse=function (lexer, context) {
        this.stack = [];
        this.context =  context || {};

        this.lexer = lexer;
        this.a = this.lexer.nextToken();
        this.stack.push({s: this.startstate, i: 0});
        this.accepted = false;
        this.inerror = false;
        while (!this.accepted && !this.inerror) {
            var top = this.stack[this.stack.length - 1];
            var s = top.s;
            //this.a = this.currentToken;
            if(lexer.isEOF(this.a))
                this.an = 0;
            else
                this.an = this.symbolsTable[this.a.name];
            var action = this.action[s][this.an];
            if (action !== undefined) {
                this[action[0]].apply(this, action[1]);
            } else {
                this.inerror = true;
                this.error(this.a,this);
            }
        }
        return top.i.value;
    };
Parser.prototype.shift=function (state) {
        "use strict";
        this.stack.push({s: state, i: this.a});
        this.a = this.lexer.nextToken();

    };
Parser.prototype.reduce=function (head, length, prodindex) {
        "use strict";
        //var prod = this.productions[prodnumber];
        var self = this;
        var rhs = this.stack.splice(-length, length);
        var t = this.stack[this.stack.length - 1];
        var ns = this.goto[t.s][head];
        var value;
        if (this.actions) {
            var action = this.actions[prodindex] || this.identity;
            var values = rhs.map(function (si) {
                return si.i.value;
            });

            if(self.actionMode==='constructor')
                value =  this.create(action,values);
            else
                value =  action.apply(this.context, values);
        }
        //If we are debugging

        if(this.symbols) {
            var nt = {name: this.symbols[head].name, value:value};
            this.stack.push({s: ns, i: nt});
        }
        else
        {
            this.stack.push({s: ns,i:{value: value}});
        }

    };
Parser.prototype.accept=function () {
        "use strict";
        this.accepted = true;
    };
Parser.prototype.error=function (token){
        if(this.lexer.isEOF(token)){
            throw Error("Unexpected EOF at "+this.lexer.jjline+':'+this.lexer.jjcol);
        } else
        throw Error('Unexpected token '+token.name+' "'+token.lexeme+'" at ('+token.pos.line+':'+token.pos.col+')');
    };
Parser.prototype.create=function (ctor,args){
        var args = [this.context].concat(args);
        var factory = ctor.bind.apply(ctor,args);
        return new factory();
    };
if (typeof(module) !== 'undefined') { module.exports = Parser; }
return Parser;
})();
},{}],13:[function(require,module,exports){
var JacobGramLexer = (function (undefined) {
function CDFA_base(){
	this.ss=undefined;
	this.as=undefined;
	this.tt=undefined;
this.stt={};
}
CDFA_base.prototype.reset = function (state) {
	this.cs = state || 	this.ss;
this.bol=false;
};
CDFA_base.prototype.readSymbol = function (c) {
	this.cs = this.nextState(this.cs, c);
};
CDFA_base.prototype.isAccepting = function () {
	var acc = this.as.indexOf(this.cs)>=0;
if((this.stt[this.cs]===-1)&&!this.bol){
acc=false;}
return acc;};
CDFA_base.prototype.isInDeadState = function () {
	return this.cs === undefined || this.cs === 0;
};
CDFA_base.prototype.getCurrentToken = function(){
	var t= this.tt[this.cs];
var s=this.stt[this.cs];
if(s!==undefined){return this.bol?t:s;}
return t;};

function CDFA_DEFAULT(){
	this.ss=1;
	this.as=[2,3,4,5,6,7,8,9,10,11,12,13,15,16,17,18,19,20,21,22,23,24,25,26,27,28,29,30,31,32,33,34,35,36,37,38,39];
	this.tt=[null,null,15,14,14,15,15,15,13,13,7,7,7,7,null,0,3,13,13,7,7,7,8,13,7,7,7,13,6,7,7,13,7,6,13,7,13,7,9,6];
this.stt={};
}
CDFA_DEFAULT.prototype= new CDFA_base();
CDFA_DEFAULT.prototype.nextState = function(state, c){
    var next = 0;
    switch(state){
case 1:
if((c < "\t" || "\n" < c)  && (c < "\r" || "\r" < c)  && (c < " " || " " < c)  && (c < "%" || "%" < c)  && (c < "'" || "'" < c)  && (c < "/" || "9" < c)  && (c < "A" || "Z" < c)  && (c < "_" || "_" < c)  && (c < "a" || "z" < c) ){
next = 2;
} else if(("\t" === c ) || (" " === c )){
next = 3;
} else if(("\n" === c ) || ("\r" === c )){
next = 3;
} else if(("%" === c )){
next = 5;
} else if(("'" === c )){
next = 6;
} else if(("/" === c )){
next = 7;
} else if(("0" <= c && c <= "9")  || ("A" <= c && c <= "Z")  || ("_" === c ) || ("a" <= c && c <= "e")  || ("g" <= c && c <= "z") ){
next = 8;
} else if(("f" === c )){
next = 9;
}
break;
case 5:
if(("0" <= c && c <= "9")  || ("A" <= c && c <= "Z")  || ("_" === c ) || ("a" <= c && c <= "k")  || ("m" === c ) || ("o" <= c && c <= "q")  || ("s" <= c && c <= "z") ){
next = 10;
} else if(("l" === c )){
next = 11;
} else if(("n" === c )){
next = 12;
} else if(("r" === c )){
next = 13;
}
break;
case 6:
if((c < "'" || "'" < c)  && (c < "|" || "|" < c) ){
next = 14;
}
break;
case 7:
if(("*" === c )){
next = 15;
} else if(("/" === c )){
next = 16;
}
break;
case 8:
if(("0" <= c && c <= "9")  || ("A" <= c && c <= "Z")  || ("_" === c ) || ("a" <= c && c <= "z") ){
next = 8;
}
break;
case 9:
if(("0" <= c && c <= "9")  || ("A" <= c && c <= "Z")  || ("_" === c ) || ("a" <= c && c <= "t")  || ("v" <= c && c <= "z") ){
next = 8;
} else if(("u" === c )){
next = 18;
}
break;
case 10:
if(("0" <= c && c <= "9")  || ("A" <= c && c <= "Z")  || ("_" === c ) || ("a" <= c && c <= "z") ){
next = 10;
}
break;
case 11:
if(("0" <= c && c <= "9")  || ("A" <= c && c <= "Z")  || ("_" === c ) || ("a" <= c && c <= "d")  || ("f" <= c && c <= "z") ){
next = 10;
} else if(("e" === c )){
next = 19;
}
break;
case 12:
if(("0" <= c && c <= "9")  || ("A" <= c && c <= "Z")  || ("_" === c ) || ("a" <= c && c <= "n")  || ("p" <= c && c <= "z") ){
next = 10;
} else if(("o" === c )){
next = 20;
}
break;
case 13:
if(("0" <= c && c <= "9")  || ("A" <= c && c <= "Z")  || ("_" === c ) || ("a" <= c && c <= "h")  || ("j" <= c && c <= "z") ){
next = 10;
} else if(("i" === c )){
next = 21;
}
break;
case 14:
if((c < "'" || "'" < c)  && (c < "|" || "|" < c) ){
next = 14;
} else if(("'" === c )){
next = 22;
}
break;
case 18:
if(("0" <= c && c <= "9")  || ("A" <= c && c <= "Z")  || ("_" === c ) || ("a" <= c && c <= "m")  || ("o" <= c && c <= "z") ){
next = 8;
} else if(("n" === c )){
next = 23;
}
break;
case 19:
if(("0" <= c && c <= "9")  || ("A" <= c && c <= "Z")  || ("_" === c ) || ("a" <= c && c <= "e")  || ("g" <= c && c <= "z") ){
next = 10;
} else if(("f" === c )){
next = 24;
}
break;
case 20:
if(("0" <= c && c <= "9")  || ("A" <= c && c <= "Z")  || ("_" === c ) || ("a" <= c && c <= "m")  || ("o" <= c && c <= "z") ){
next = 10;
} else if(("n" === c )){
next = 25;
}
break;
case 21:
if(("0" <= c && c <= "9")  || ("A" <= c && c <= "Z")  || ("_" === c ) || ("a" <= c && c <= "f")  || ("h" <= c && c <= "z") ){
next = 10;
} else if(("g" === c )){
next = 26;
}
break;
case 23:
if(("0" <= c && c <= "9")  || ("A" <= c && c <= "Z")  || ("_" === c ) || ("a" <= c && c <= "b")  || ("d" <= c && c <= "z") ){
next = 8;
} else if(("c" === c )){
next = 27;
}
break;
case 24:
if(("0" <= c && c <= "9")  || ("A" <= c && c <= "Z")  || ("_" === c ) || ("a" <= c && c <= "s")  || ("u" <= c && c <= "z") ){
next = 10;
} else if(("t" === c )){
next = 28;
}
break;
case 25:
if(("0" <= c && c <= "9")  || ("A" <= c && c <= "Z")  || ("_" === c ) || ("b" <= c && c <= "z") ){
next = 10;
} else if(("a" === c )){
next = 29;
}
break;
case 26:
if(("0" <= c && c <= "9")  || ("A" <= c && c <= "Z")  || ("_" === c ) || ("a" <= c && c <= "g")  || ("i" <= c && c <= "z") ){
next = 10;
} else if(("h" === c )){
next = 24;
}
break;
case 27:
if(("0" <= c && c <= "9")  || ("A" <= c && c <= "Z")  || ("_" === c ) || ("a" <= c && c <= "s")  || ("u" <= c && c <= "z") ){
next = 8;
} else if(("t" === c )){
next = 31;
}
break;
case 28:
if(("0" <= c && c <= "9")  || ("A" <= c && c <= "Z")  || ("_" === c ) || ("a" <= c && c <= "z") ){
next = 10;
}
break;
case 29:
if(("0" <= c && c <= "9")  || ("A" <= c && c <= "Z")  || ("_" === c ) || ("a" <= c && c <= "r")  || ("t" <= c && c <= "z") ){
next = 10;
} else if(("s" === c )){
next = 32;
}
break;
case 31:
if(("0" <= c && c <= "9")  || ("A" <= c && c <= "Z")  || ("_" === c ) || ("a" <= c && c <= "h")  || ("j" <= c && c <= "z") ){
next = 8;
} else if(("i" === c )){
next = 34;
}
break;
case 32:
if(("0" <= c && c <= "9")  || ("A" <= c && c <= "Z")  || ("_" === c ) || ("a" <= c && c <= "r")  || ("t" <= c && c <= "z") ){
next = 10;
} else if(("s" === c )){
next = 35;
}
break;
case 34:
if(("0" <= c && c <= "9")  || ("A" <= c && c <= "Z")  || ("_" === c ) || ("a" <= c && c <= "n")  || ("p" <= c && c <= "z") ){
next = 8;
} else if(("o" === c )){
next = 36;
}
break;
case 35:
if(("0" <= c && c <= "9")  || ("A" <= c && c <= "Z")  || ("_" === c ) || ("a" <= c && c <= "n")  || ("p" <= c && c <= "z") ){
next = 10;
} else if(("o" === c )){
next = 37;
}
break;
case 36:
if(("0" <= c && c <= "9")  || ("A" <= c && c <= "Z")  || ("_" === c ) || ("a" <= c && c <= "m")  || ("o" <= c && c <= "z") ){
next = 8;
} else if(("n" === c )){
next = 38;
}
break;
case 37:
if(("0" <= c && c <= "9")  || ("A" <= c && c <= "Z")  || ("_" === c ) || ("a" <= c && c <= "b")  || ("d" <= c && c <= "z") ){
next = 10;
} else if(("c" === c )){
next = 28;
}
break;
case 38:
if(("0" <= c && c <= "9")  || ("A" <= c && c <= "Z")  || ("_" === c ) || ("a" <= c && c <= "z") ){
next = 8;
}
break;
	}
	return next;
};

function CDFA_BLOCKCOMMENT(){
	this.ss=1;
	this.as=[2,3,4,5,6];
	this.tt=[null,null,2,2,2,2,1];
this.stt={};
}
CDFA_BLOCKCOMMENT.prototype= new CDFA_base();
CDFA_BLOCKCOMMENT.prototype.nextState = function(state, c){
    var next = 0;
    switch(state){
case 1:
if((c < "\n" || "\n" < c)  && (c < "\r" || "\r" < c)  && (c < "*" || "*" < c) ){
next = 2;
} else if(("\n" === c )){
next = 2;
} else if(("\r" === c )){
next = 2;
} else if(("*" === c )){
next = 5;
}
break;
case 5:
if(("/" === c )){
next = 6;
}
break;
	}
	return next;
};

function CDFA_LINECOMMENT(){
	this.ss=1;
	this.as=[1,2,3];
	this.tt=[null,4,4,5];
this.stt={};
}
CDFA_LINECOMMENT.prototype= new CDFA_base();
CDFA_LINECOMMENT.prototype.nextState = function(state, c){
    var next = 0;
    switch(state){
case 1:
if((c < "\n" || "\n" < c) ){
next = 2;
} else if(("\n" === c )){
next = 3;
}
break;
case 2:
if((c < "\n" || "\n" < c) ){
next = 2;
}
break;
	}
	return next;
};

function CDFA_FUNCTION(){
	this.ss=1;
	this.as=[1,2,3,4];
	this.tt=[null,10,10,11,12];
this.stt={};
}
CDFA_FUNCTION.prototype= new CDFA_base();
CDFA_FUNCTION.prototype.nextState = function(state, c){
    var next = 0;
    switch(state){
case 1:
if((c < "{" || "{" < c)  && (c < "}" || "}" < c) ){
next = 2;
} else if(("{" === c )){
next = 3;
} else if(("}" === c )){
next = 4;
}
break;
case 2:
if((c < "{" || "{" < c)  && (c < "}" || "}" < c) ){
next = 2;
}
break;
	}
	return next;
};

var EOF={};
function Lexer(){

if(!(this instanceof Lexer)) return new Lexer();

this.pos={line:0,col:0};

this.states={};
this.state = ['DEFAULT'];
this.lastChar = '\n';
this.actions = [function anonymous() {
this.pushState('BLOCKCOMMENT');
},function anonymous() {
this.popState();
},,function anonymous() {
this.pushState('LINECOMMENT');
},,function anonymous() {
this.popState();
},function anonymous() {
 this.jjval = this.jjtext.substring(1); return 'Op';
},function anonymous() {
this.jjval = this.jjtext.substring(1); return 'Directive'; 
},function anonymous() {
 this.jjval = this.jjtext.substring(1,this.jjtext.length-1); return 'Terminal'; 
},function anonymous() {
this.func=this.jjtext;this.blocklevel=0; this.pushState('FUNCTION');
},function anonymous() {
this.func+=this.jjtext;
},function anonymous() {
this.func+=this.jjtext; this.blocklevel++
},function anonymous() {
this.func+=this.jjtext; this.blocklevel--; if(this.blocklevel===0) {this.popState(); this.jjtext = this.jjval = this.func; return 'function'; }
},function anonymous() {
 return 'id'; 
},function anonymous() {
 //mah 
},function anonymous() {
 return this.jjtext; 
}];
this.states["DEFAULT"] = {};
this.states["DEFAULT"].dfa = new CDFA_DEFAULT();
this.states["BLOCKCOMMENT"] = {};
this.states["BLOCKCOMMENT"].dfa = new CDFA_BLOCKCOMMENT();
this.states["LINECOMMENT"] = {};
this.states["LINECOMMENT"].dfa = new CDFA_LINECOMMENT();
this.states["FUNCTION"] = {};
this.states["FUNCTION"].dfa = new CDFA_FUNCTION();
}
Lexer.prototype.setInput=function (input){
        this.pos={row:0, col:0};
        if(typeof input === 'string')
        {input = new StringReader(input);}
        this.input = input;
        this.state = ['DEFAULT'];
        this.lastChar='\n';
        this.getDFA().reset();
        return this;
    };
Lexer.prototype.nextToken=function () {


        var ret = undefined;
        while(ret === undefined){
            this.resetToken();
            ret = this.more();
        }


        if (ret === EOF) {
            this.current = EOF;
        } else {
            this.current = {};
            this.current.name = ret;
            this.current.value = this.jjval;
            this.current.lexeme = this.jjtext;
            this.current.position = this.jjpos;
            this.current.pos = {col: this.jjcol, line: this.jjline};
        }
        return this.current;
    };
Lexer.prototype.resetToken=function (){
        this.getDFA().reset();
        this.getDFA().bol = (this.lastChar === '\n');
        this.lastValid = undefined;
        this.lastValidPos = -1;
        this.jjtext = '';
        this.remains = '';
        this.buffer = '';
        this.jjline = this.input.line;
        this.jjcol = this.input.col;
    };
Lexer.prototype.halt=function () {
        if (this.lastValidPos >= 0) {
            this.jjtext = this.buffer.substring(0, this.lastValidPos + 1);
            this.remains = this.buffer.substring(this.lastValidPos + 1);
            this.jjval = this.jjtext;
            this.jjpos = this.lastValidPos + 1-this.jjtext.length;
            this.input.rollback(this.remains);
            var action = this.getAction(this.lastValid);
            if (typeof ( action) === 'function') {
                return action.call(this);
            }
            this.resetToken();
        }
        else if(!this.input.more()){//EOF
            var actionid = this.states[this.getState()].eofaction;
            if(actionid){
                action = this.getAction(actionid);
                if (typeof ( action) === 'function') {
                    //Note we don't care of returned token, must return 'EOF'
                    action.call(this);
                }
            }
            return EOF;
        } else {//Unexpected character
            throw new Error('Unexpected char \''+this.input.peek()+'\' at '+this.jjline +':'+this.jjcol);
        }
    };
Lexer.prototype.more=function (){
        var ret;
        while (this.input.more()) {
            var c = this.input.peek();
            this.getDFA().readSymbol(c);
            if (this.getDFA().isInDeadState()) {

                ret = this.halt();
                return ret;

            } else {
                if (this.getDFA().isAccepting()) {
                    this.lastValid = this.getDFA().getCurrentToken();
                    this.lastValidPos = this.input.getPos();

                }
                this.buffer = this.buffer + c;
                this.lastChar = c;
                this.input.next();
            }

        }
        ret = this.halt();
        return ret;
    };
Lexer.prototype.less=function (length){
        this.input.rollback(length);
    };
Lexer.prototype.getDFA=function (){
        return this.states[this.getState()].dfa;
    };
Lexer.prototype.getAction=function (i){
        return this.actions[i];
    };
Lexer.prototype.pushState=function (state){
        this.state.push(state);
        this.getDFA().reset();
    };
Lexer.prototype.popState=function (){
        if(this.state.length>1) {
            this.state.pop();
            this.getDFA().reset();
        }
    };
Lexer.prototype.getState=function (){
        return this.state[this.state.length-1];
    };
Lexer.prototype.restoreLookAhead=function (){
        this.tailLength = this.jjtext.length;
        this.popState();
        this.less(this.tailLength);
        this.jjtext = this.lawhole.substring(0,this.lawhole.length-this.tailLength);


    };
Lexer.prototype.evictTail=function (length){
        this.less(length);
        this.jjtext = this.jjtext.substring(0,this.jjtext.length-length);
    };
Lexer.prototype.isEOF=function (o){
        return o===EOF;
    }
;
function StringReader(str){
        if(!(this instanceof StringReader)) return new StringReader(str);
		this.str = str;
		this.pos = 0;
        this.line = 0;
        this.col = 0;
	}
StringReader.prototype.getPos=function (){
        return this.pos;
    };
StringReader.prototype.peek=function ()
	{
		//TODO: handle EOF
		return this.str.charAt(this.pos);
	};
StringReader.prototype.eat=function (str)
	{
		var istr = this.str.substring(this.pos,this.pos+str.length);
		if(istr===str){
			this.pos+=str.length;
            this.updatePos(str,1);
		} else {
			throw new Error('Expected "'+str+'", got "'+istr+'"!');
		}
	};
StringReader.prototype.updatePos=function (str,delta){
        for(var i=0;i<str.length;i++){
            if(str[i]=='\n'){
                this.col=0;
                this.line+=delta;
            }else{
                this.col+=delta;
            }
        }
    };
StringReader.prototype.rollback=function (str)
    {
        if(typeof str === 'string')
        {
            var istr = this.str.substring(this.pos-str.length,this.pos);
            if(istr===str){
                this.pos-=str.length;
                this.updatePos(str,-1);
            } else {
                throw new Error('Expected "'+str+'", got "'+istr+'"!');
            }
        } else {
            this.pos-=str;
            this.updatePos(str,-1);
        }

    };
StringReader.prototype.next=function ()
	{
		var s = this.str.charAt(this.pos);
		this.pos=this.pos+1;
		this.updatePos(s,1);
		return s;
	};
StringReader.prototype.more=function ()
	{
		return this.pos<this.str.length;
	};
StringReader.prototype.reset=function (){
        this.pos=0;
    };
if (typeof(module) !== 'undefined') { module.exports = Lexer; }
return Lexer;})();
},{}],14:[function(require,module,exports){
/**
 * Created by gcannata on 22/08/2014.
 */

//node ./cmd/cmd.js -t ./lib/parser/lexlex.js -g ./lib/parser/lexgram.js -l ./lib/parser/jacoblexerlexer.js -p ./lib/parser/jacoblexinterpreter.js

function parseJacobLex(str){
    var Lexer = require('./JacobLexerLexer');
    var Parser = require('./JacobLexInterpreter');
    var junq = require('junq');
    var l = new Lexer().setInput(str);
    var lexerspec = {};
    var ret = (new Parser({junq: junq})).parse(l,lexerspec);
    return lexerspec;
}

module.exports = parseJacobLex;



},{"./JacobLexInterpreter":15,"./JacobLexerLexer":16,"junq":19}],15:[function(require,module,exports){
var JacobLexInterpreter = (function (undefined) {
function Parser(environment){
if(!(this instanceof Parser)) return new Parser(environment);
var env = environment;
this.action={"0":{"3":["reduce",[2,0,5]],"7":["reduce",[2,0,5]]},"1":{"0":["accept",[]]},"2":{"3":["shift",[3]],"7":["shift",[5]]},"3":{"3":["reduce",[4,0,7]],"8":["reduce",[4,0,7]]},"4":{"3":["reduce",[2,2,6]],"7":["reduce",[2,2,6]]},"5":{"8":["shift",[7]]},"6":{"3":["shift",[8]],"8":["shift",[10]]},"7":{"3":["reduce",[6,2,1]],"7":["reduce",[6,2,1]]},"8":{"0":["reduce",[5,0,9]],"16":["reduce",[5,0,9]]},"9":{"3":["reduce",[4,2,8]],"8":["reduce",[4,2,8]]},"10":{"10":["shift",[12]]},"11":{"0":["reduce",[1,5,0]],"16":["shift",[15]]},"12":{"11":["shift",[16]]},"13":{"0":["reduce",[5,2,10]],"16":["reduce",[5,2,10]]},"14":{"8":["shift",[19]],"11":["shift",[18]]},"15":{"8":["shift",[21]],"18":["reduce",[17,0,15]]},"16":{"3":["reduce",[9,3,2]],"8":["reduce",[9,3,2]]},"17":{"0":["reduce",[15,0,13]],"16":["reduce",[15,0,13]],"19":["shift",[23]]},"18":{"0":["reduce",[14,1,11]],"16":["reduce",[14,1,11]],"19":["reduce",[14,1,11]]},"19":{"0":["reduce",[14,1,12]],"16":["reduce",[14,1,12]],"19":["reduce",[14,1,12]]},"20":{"18":["shift",[24]]},"21":{"18":["reduce",[20,0,17]],"21":["reduce",[20,0,17]]},"22":{"0":["reduce",[12,3,3]],"16":["reduce",[12,3,3]]},"23":{"0":["reduce",[15,1,14]],"16":["reduce",[15,1,14]]},"24":{"8":["reduce",[13,3,4]],"11":["reduce",[13,3,4]]},"25":{"18":["reduce",[17,2,16]],"21":["shift",[26]]},"26":{"8":["shift",[27]]},"27":{"18":["reduce",[20,3,18]],"21":["reduce",[20,3,18]]}};
this.goto={"0":{"1":1,"2":2},"2":{"6":4},"3":{"4":6},"6":{"9":9},"8":{"5":11},"11":{"12":13,"13":14},"14":{"14":17},"15":{"17":20},"17":{"15":22},"21":{"20":25}};
this.actions=[function (directives,_1, definitions,_2, rules) {

                },function (d, id) {
                    this[d] = id;
                },function (def, _, re) {
                        this.definitions = this.definitions || {};
                        this.definitions[def] = re;
                    },function (state, re, action) {
                    if((typeof state != 'undefined') && state.length===0){
                        state = undefined;
                    }
                    this.tokens = this.tokens || [];
                    var rule = {};
                    rule.regexp = re;
                    rule.state = state;
                    rule.action = undefined;
                    if( (typeof action != 'undefined') && action.length>0){
                        try {
                            rule.action = new Function(action)
                        }catch(e){
                            throw Error(e.toString() + ' in rule ' + this.tokens.length+1);
                        }
                    }
                    this.tokens.push(rule);
                },function (_,list){
                //StatesList
                return env.junq(list).flatmap().odd().toArray();
            },function (){return [];},function (){
                return arguments[0].concat(Array.prototype.slice.call(arguments,1));
            },function (){return [];},function (){
                return arguments[0].concat(Array.prototype.slice.call(arguments,1));
            },function (){return [];},function (){
                return arguments[0].concat(Array.prototype.slice.call(arguments,1));
            },function () {
                    return arguments[0];
                },function () {
                    return arguments[0];
                },function () {
                return undefined;
            },function () {
                return arguments[0];
            },function () {
                return [];
            },function () {
                return [].slice.apply(arguments);
            },function (){return [];},function (){
                return arguments[0].concat(Array.prototype.slice.call(arguments,1));
            }];
this.startstate=0;
this.symbolsTable={"<<EOF>>":0,"LexPec":1,"Repeat_0_0":2,"SEPARATOR":3,"Repeat_0_2":4,"Repeat_0_4":5,"Directive":6,"directive":7,"id":8,"Definition":9,"=":10,"regex":11,"TokenRule":12,"StatesList":13,"Group3_6":14,"Optional_3_8":15,"<":16,"Optional_4_10":17,">":18,"actionblock":19,"Repeat_16_0":20,",":21};
this.actionMode='function';
}
Parser.prototype.identity=function (x) {
        "use strict";
        return x;
    };
Parser.prototype.parse=function (lexer, context) {
        this.stack = [];
        this.context =  context || {};

        this.lexer = lexer;
        this.a = this.lexer.nextToken();
        this.stack.push({s: this.startstate, i: 0});
        this.accepted = false;
        this.inerror = false;
        while (!this.accepted && !this.inerror) {
            var top = this.stack[this.stack.length - 1];
            var s = top.s;
            //this.a = this.currentToken;
            if(lexer.isEOF(this.a))
                this.an = 0;
            else
                this.an = this.symbolsTable[this.a.name];
            var action = this.action[s][this.an];
            if (action !== undefined) {
                this[action[0]].apply(this, action[1]);
            } else {
                this.inerror = true;
                this.error(this.a,this);
            }
        }
        return top.i.value;
    };
Parser.prototype.shift=function (state) {
        "use strict";
        this.stack.push({s: state, i: this.a});
        this.a = this.lexer.nextToken();

    };
Parser.prototype.reduce=function (head, length, prodindex) {
        "use strict";
        //var prod = this.productions[prodnumber];
        var self = this;
        var rhs = this.stack.splice(-length, length);
        var t = this.stack[this.stack.length - 1];
        var ns = this.goto[t.s][head];
        var value;
        if (this.actions) {
            var action = this.actions[prodindex] || this.identity;
            var values = rhs.map(function (si) {
                return si.i.value;
            });

            if(self.actionMode==='constructor')
                value =  this.create(action,values);
            else
                value =  action.apply(this.context, values);
        }
        //If we are debugging

        if(this.symbols) {
            var nt = {name: this.symbols[head].name, value:value};
            this.stack.push({s: ns, i: nt});
        }
        else
        {
            this.stack.push({s: ns,i:{value: value}});
        }

    };
Parser.prototype.accept=function () {
        "use strict";
        this.accepted = true;
    };
Parser.prototype.error=function (token){
        if(this.lexer.isEOF(token)){
            throw Error("Unexpected EOF at "+this.lexer.jjline+':'+this.lexer.jjcol);
        } else
        throw Error('Unexpected token '+token.name+' "'+token.lexeme+'" at ('+token.pos.line+':'+token.pos.col+')');
    };
Parser.prototype.create=function (ctor,args){
        var args = [this.context].concat(args);
        var factory = ctor.bind.apply(ctor,args);
        return new factory();
    };
if (typeof(module) !== 'undefined') { module.exports = Parser; }
return Parser;
})();
},{}],16:[function(require,module,exports){
var JacobLexerLexer = (function (undefined) {
function CDFA_base(){
	this.ss=undefined;
	this.as=undefined;
	this.tt=undefined;
this.stt={};
}
CDFA_base.prototype.reset = function (state) {
	this.cs = state || 	this.ss;
this.bol=false;
};
CDFA_base.prototype.readSymbol = function (c) {
	this.cs = this.nextState(this.cs, c);
};
CDFA_base.prototype.isAccepting = function () {
	var acc = this.as.indexOf(this.cs)>=0;
if((this.stt[this.cs]===-1)&&!this.bol){
acc=false;}
return acc;};
CDFA_base.prototype.isInDeadState = function () {
	return this.cs === undefined || this.cs === 0;
};
CDFA_base.prototype.getCurrentToken = function(){
	var t= this.tt[this.cs];
var s=this.stt[this.cs];
if(s!==undefined){return this.bol?t:s;}
return t;};

function CDFA_DEFAULT(){
	this.ss=1;
	this.as=[1,2,3,4,5,6,7,8,9,10,11,12,13,14,15];
	this.tt=[null,16,17,16,16,17,17,13,14,12,3,10,11,0,7,13];
this.stt={};
}
CDFA_DEFAULT.prototype= new CDFA_base();
CDFA_DEFAULT.prototype.nextState = function(state, c){
    var next = 0;
    switch(state){
case 1:
if((c < "\t" || "\n" < c)  && (c < "\r" || "\r" < c)  && (c < " " || " " < c)  && (c < "%" || "%" < c)  && (c < "/" || "9" < c)  && (c < "=" || ">" < c)  && (c < "A" || "Z" < c)  && (c < "_" || "_" < c)  && (c < "a" || "{" < c) ){
next = 2;
} else if(("\t" === c ) || (" " === c )){
next = 3;
} else if(("\n" === c ) || ("\r" === c )){
next = 3;
} else if(("%" === c )){
next = 5;
} else if(("/" === c )){
next = 6;
} else if(("0" <= c && c <= "9")  || ("A" <= c && c <= "Z")  || ("_" === c ) || ("a" <= c && c <= "z") ){
next = 7;
} else if(("=" === c )){
next = 8;
} else if((">" === c )){
next = 9;
} else if(("{" === c )){
next = 10;
}
break;
case 3:
if(("\t" <= c && c <= "\n")  || ("\r" === c ) || (" " === c )){
next = 3;
}
break;
case 5:
if(("%" === c )){
next = 11;
} else if(("0" <= c && c <= "9")  || ("A" <= c && c <= "Z")  || ("_" === c ) || ("a" <= c && c <= "z") ){
next = 12;
}
break;
case 6:
if(("*" === c )){
next = 13;
} else if(("/" === c )){
next = 14;
}
break;
case 7:
if(("0" <= c && c <= "9")  || ("A" <= c && c <= "Z")  || ("_" === c ) || ("a" <= c && c <= "z") ){
next = 7;
}
break;
case 12:
if(("0" <= c && c <= "9")  || ("A" <= c && c <= "Z")  || ("_" === c ) || ("a" <= c && c <= "z") ){
next = 12;
}
break;
	}
	return next;
};

function CDFA_BLOCKCOMMENT(){
	this.ss=1;
	this.as=[2,3,4,5,6];
	this.tt=[null,null,2,2,2,2,1];
this.stt={};
}
CDFA_BLOCKCOMMENT.prototype= new CDFA_base();
CDFA_BLOCKCOMMENT.prototype.nextState = function(state, c){
    var next = 0;
    switch(state){
case 1:
if((c < "\n" || "\n" < c)  && (c < "\r" || "\r" < c)  && (c < "*" || "*" < c) ){
next = 2;
} else if(("\n" === c )){
next = 2;
} else if(("\r" === c )){
next = 2;
} else if(("*" === c )){
next = 5;
}
break;
case 5:
if(("/" === c )){
next = 6;
}
break;
	}
	return next;
};

function CDFA_ACTIONBLOCK(){
	this.ss=1;
	this.as=[1,2,3,4];
	this.tt=[null,6,6,4,5];
this.stt={};
}
CDFA_ACTIONBLOCK.prototype= new CDFA_base();
CDFA_ACTIONBLOCK.prototype.nextState = function(state, c){
    var next = 0;
    switch(state){
case 1:
if((c < "{" || "{" < c)  && (c < "}" || "}" < c) ){
next = 2;
} else if(("{" === c )){
next = 3;
} else if(("}" === c )){
next = 4;
}
break;
case 2:
if((c < "{" || "{" < c)  && (c < "}" || "}" < c) ){
next = 2;
}
break;
	}
	return next;
};

function CDFA_LINECOMMENT(){
	this.ss=1;
	this.as=[1,2,3];
	this.tt=[null,8,8,9];
this.stt={};
}
CDFA_LINECOMMENT.prototype= new CDFA_base();
CDFA_LINECOMMENT.prototype.nextState = function(state, c){
    var next = 0;
    switch(state){
case 1:
if((c < "\n" || "\n" < c) ){
next = 2;
} else if(("\n" === c )){
next = 3;
}
break;
case 2:
if((c < "\n" || "\n" < c) ){
next = 2;
}
break;
	}
	return next;
};

function CDFA_RE(){
	this.ss=1;
	this.as=[1,2,3];
	this.tt=[null,16,15,16];
this.stt={};
}
CDFA_RE.prototype= new CDFA_base();
CDFA_RE.prototype.nextState = function(state, c){
    var next = 0;
    switch(state){
case 1:
if((c < "\t" || "\n" < c)  && (c < "\r" || "\r" < c)  && (c < " " || " " < c) ){
next = 2;
} else if(("\t" <= c && c <= "\n")  || ("\r" === c ) || (" " === c )){
next = 3;
}
break;
case 2:
if((c < "\t" || "\n" < c)  && (c < "\r" || "\r" < c)  && (c < " " || " " < c) ){
next = 2;
}
break;
case 3:
if(("\t" <= c && c <= "\n")  || ("\r" === c ) || (" " === c )){
next = 3;
}
break;
	}
	return next;
};

var EOF={};
function Lexer(){

if(!(this instanceof Lexer)) return new Lexer();

this.pos={line:0,col:0};

this.states={};
this.state = ['DEFAULT'];
this.lastChar = '\n';
this.actions = [function (){this.pushState('BLOCKCOMMENT');},function (){this.popState();},function (){},function (){
                this.pushState('ACTIONBLOCK'); this.blocklevel=1;this.func='';},function (){
                this.blocklevel++;this.func+='{'},function (){
                this.blocklevel--;if(this.blocklevel===0) {
                this.popState();
                this.jjval = this.func;
                this.jjtext = this.func;
                return 'actionblock';
            }else{
                this.func+='}';
            }},function (){
                this.func+=this.jjtext; },function (){
                this.pushState('LINECOMMENT');},function (){},function (){this.popState();},function () {
                this.jjval = (this.jjtext);
                return 'SEPARATOR';
            },function () {
                this.jjval = this.jjtext.substring(1);
                return 'directive';
            },function () {
                //this.jjval = this.jjtext.substring(1,this.jjtext.length-1);
                this.pushState('RE');
                return this.jjtext;
            },function () {

                return 'id';
            },function () {
                this.pushState('RE');
                return this.jjtext;
            },function () {
                this.popState();
                return 'regex';
            },function () {
                //ignore spaces
            },function () {
                return this.jjtext;
            },function () {
                console.log('end of file');
                return 'EOF';
            }];
this.states["DEFAULT"] = {};
this.states["DEFAULT"].dfa = new CDFA_DEFAULT();
this.states["BLOCKCOMMENT"] = {};
this.states["BLOCKCOMMENT"].dfa = new CDFA_BLOCKCOMMENT();
this.states["ACTIONBLOCK"] = {};
this.states["ACTIONBLOCK"].dfa = new CDFA_ACTIONBLOCK();
this.states["LINECOMMENT"] = {};
this.states["LINECOMMENT"].dfa = new CDFA_LINECOMMENT();
this.states["RE"] = {};
this.states["RE"].dfa = new CDFA_RE();
}
Lexer.prototype.setInput=function (input){
        this.pos={row:0, col:0};
        if(typeof input === 'string')
        {input = new StringReader(input);}
        this.input = input;
        this.state = ['DEFAULT'];
        this.lastChar='\n';
        this.getDFA().reset();
        return this;
    };
Lexer.prototype.nextToken=function () {


        var ret = undefined;
        while(ret === undefined){
            this.resetToken();
            ret = this.more();
        }


        if (ret === EOF) {
            this.current = EOF;
        } else {
            this.current = {};
            this.current.name = ret;
            this.current.value = this.jjval;
            this.current.lexeme = this.jjtext;
            this.current.position = this.jjpos;
            this.current.pos = {col: this.jjcol, line: this.jjline};
        }
        return this.current;
    };
Lexer.prototype.resetToken=function (){
        this.getDFA().reset();
        this.getDFA().bol = (this.lastChar === '\n');
        this.lastValid = undefined;
        this.lastValidPos = -1;
        this.jjtext = '';
        this.remains = '';
        this.buffer = '';
        this.jjline = this.input.line;
        this.jjcol = this.input.col;
    };
Lexer.prototype.halt=function () {
        if (this.lastValidPos >= 0) {
            this.jjtext = this.buffer.substring(0, this.lastValidPos + 1);
            this.remains = this.buffer.substring(this.lastValidPos + 1);
            this.jjval = this.jjtext;
            this.jjpos = this.lastValidPos + 1-this.jjtext.length;
            this.input.rollback(this.remains);
            var action = this.getAction(this.lastValid);
            if (typeof ( action) === 'function') {
                return action.call(this);
            }
            this.resetToken();
        }
        else if(!this.input.more()){//EOF
            var actionid = this.states[this.getState()].eofaction;
            if(actionid){
                action = this.getAction(actionid);
                if (typeof ( action) === 'function') {
                    //Note we don't care of returned token, must return 'EOF'
                    action.call(this);
                }
            }
            return EOF;
        } else {//Unexpected character
            throw new Error('Unexpected char \''+this.input.peek()+'\' at '+this.jjline +':'+this.jjcol);
        }
    };
Lexer.prototype.more=function (){
        var ret;
        while (this.input.more()) {
            var c = this.input.peek();
            this.getDFA().readSymbol(c);
            if (this.getDFA().isInDeadState()) {

                ret = this.halt();
                return ret;

            } else {
                if (this.getDFA().isAccepting()) {
                    this.lastValid = this.getDFA().getCurrentToken();
                    this.lastValidPos = this.input.getPos();

                }
                this.buffer = this.buffer + c;
                this.lastChar = c;
                this.input.next();
            }

        }
        ret = this.halt();
        return ret;
    };
Lexer.prototype.less=function (length){
        this.input.rollback(length);
    };
Lexer.prototype.getDFA=function (){
        return this.states[this.getState()].dfa;
    };
Lexer.prototype.getAction=function (i){
        return this.actions[i];
    };
Lexer.prototype.pushState=function (state){
        this.state.push(state);
        this.getDFA().reset();
    };
Lexer.prototype.popState=function (){
        if(this.state.length>1) {
            this.state.pop();
            this.getDFA().reset();
        }
    };
Lexer.prototype.getState=function (){
        return this.state[this.state.length-1];
    };
Lexer.prototype.restoreLookAhead=function (){
        this.tailLength = this.jjtext.length;
        this.popState();
        this.less(this.tailLength);
        this.jjtext = this.lawhole.substring(0,this.lawhole.length-this.tailLength);


    };
Lexer.prototype.evictTail=function (length){
        this.less(length);
        this.jjtext = this.jjtext.substring(0,this.jjtext.length-length);
    };
Lexer.prototype.isEOF=function (o){
        return o===EOF;
    }
;
function StringReader(str){
        if(!(this instanceof StringReader)) return new StringReader(str);
		this.str = str;
		this.pos = 0;
        this.line = 0;
        this.col = 0;
	}
StringReader.prototype.getPos=function (){
        return this.pos;
    };
StringReader.prototype.peek=function ()
	{
		//TODO: handle EOF
		return this.str.charAt(this.pos);
	};
StringReader.prototype.eat=function (str)
	{
		var istr = this.str.substring(this.pos,this.pos+str.length);
		if(istr===str){
			this.pos+=str.length;
            this.updatePos(str,1);
		} else {
			throw new Error('Expected "'+str+'", got "'+istr+'"!');
		}
	};
StringReader.prototype.updatePos=function (str,delta){
        for(var i=0;i<str.length;i++){
            if(str[i]=='\n'){
                this.col=0;
                this.line+=delta;
            }else{
                this.col+=delta;
            }
        }
    };
StringReader.prototype.rollback=function (str)
    {
        if(typeof str === 'string')
        {
            var istr = this.str.substring(this.pos-str.length,this.pos);
            if(istr===str){
                this.pos-=str.length;
                this.updatePos(str,-1);
            } else {
                throw new Error('Expected "'+str+'", got "'+istr+'"!');
            }
        } else {
            this.pos-=str;
            this.updatePos(str,-1);
        }

    };
StringReader.prototype.next=function ()
	{
		var s = this.str.charAt(this.pos);
		this.pos=this.pos+1;
		this.updatePos(s,1);
		return s;
	};
StringReader.prototype.more=function ()
	{
		return this.pos<this.str.length;
	};
StringReader.prototype.reset=function (){
        this.pos=0;
    };
if (typeof(module) !== 'undefined') { module.exports = Lexer; }
return Lexer;})();
},{}],17:[function(require,module,exports){
var junq = junq || require('junq');
var sets = sets || require('junq/sets');
var StringReader = StringReader || require('./stringreader');
var automata = automata || require('./automata');
//TODO: negation in ranges
//TODO: multiple ranges inside squares

var regex;
(function (regex,dfa, StringReader, undefined) {


    function RegPart() {

    }

    RegPart.prototype.getPrecedence = function () {
        throw new Error('Should not evaluate this!');
    };
    RegPart.prototype.toNFA = function () {
        throw new Error('Should not evaluate this!');
    };
    RegPart.prototype.matches = function (str) {
        return this.toNFA().matches(str);
    };
    RegPart.prototype.isEmpty = function () {
        return false;
    };
    RegPart.prototype.isLookAhead = function () {
        return false;
    };

    RegPart.prototype.getMinMaxLength = function () {
        return {min:0, max:Infinity};
    };



    function Empty() {

    }

    Empty.prototype = new RegPart();
    Empty.prototype.getPrecedence = function () {
        return 3;
    };
    Empty.prototype.isEmpty = function () {
        return true;
    };
    Empty.prototype.toNFA = function () {
        var start = new dfa.State(undefined, 'EmptyStart');
        var accept = new dfa.State(undefined, 'EmptyAceppt');

        var rb = new dfa.NDRuleBook([new dfa.Rule(start, dfa.eps, accept)]);
        
        var specs = {rulebook: rb, acceptstates: [accept], startstate: start};
        
        return new dfa.NFA(specs);
    };

    Empty.prototype.toString = function () {
        return '';
    };

    Empty.prototype.getMinMaxLength = function () {
        return {min:0, max:0};
    };

    regex.Empty = Empty;



    function Character(character) {
        this.character = character;
    }

    Character.prototype = new RegPart();
    Character.prototype.getPrecedence = function () {
        return 3;
    };

    Character.prototype.toString = function () {
        return this.character.toString();
    };
    Character.prototype.toNFA = function () {
        var newStart = new dfa.State(undefined, 'start  \'' + this.character + '\'');
        var newEnd = new dfa.State(undefined, 'stop \'' + this.character + '\'');
        var accepting = [newEnd];
        //var rb = new dfa.NDRuleBook([new dfa.Rule(newStart, new dfa.InputChar(this.character), newEnd)]);
        var rb = new dfa.NDRuleBook(
            [new dfa.Rule(newStart, new dfa.InputRange(this.character,this.character), newEnd)]
        );
        var specs = {rulebook:rb, acceptstates:accepting, startstate:newStart};
        return new dfa.NFA(specs);
    };

    Character.prototype.getMinMaxLength = function () {
        return {min:1, max:1};
    };

    regex.Character = Character;

    function CharactersRange(from,to) {
        this.from=from;
        this.to = to;
        //note: it will put itself as input!
        this.character = this;
    }



    CharactersRange.prototype = new Character();

    CharactersRange.prototype.setNegate = function(negate){
        this.negate = negate;
        if(this.next)
        {
            this.next.setNegate(negate);
        }
    };

    CharactersRange.prototype.getPrecedence = function () {
        return 3;
    };

    CharactersRange.prototype.append = function (range) {
        if(!this.next) this.next = range;
        else this.next.append(range);
    };


    CharactersRange.prototype.toString = function () {
        return '[' + this.toStringInternal()
            + ']';
    };
    CharactersRange.prototype.toStringInternal = function () {
        var str = this.negate ? '^' : '';
        str = str + ((this.from < this.to) ? this.from + '-' + this.to : this.from);
        if(this.next) return str+this.next.toStringInternal();
        return str;
    };

    CharactersRange.prototype.toNFA = function () {
        var newStart = new dfa.State(undefined, 'start reading\'' + this.character + '\'');
        var newEnd = new dfa.State(undefined, 'read\'' + this.character + '\'');
        var accepting = [newEnd];
        var base;
        var cr = this, ir = base = {}, negate = this.negate;
        while(cr){
            if(!negate){
                ir.next = new dfa.InputRange(cr.from,cr.to);
            } else {
                //it's a complement range, we split into its two positive ones
                //TODO: guard aginst going over range
                /*
                var lower = new dfa.InputRange(dfa.FIRSTCHAR,String.fromCharCode((cr.from.charCodeAt(0)-1)),negate);
                var upper = new dfa.InputRange(String.fromCharCode((cr.to.charCodeAt(0)+1)),dfa.LASTCHAR,negate);
                ir.next = lower;
                lower.next = upper;
                ir = lower;
                */
                ir.next = new dfa.InputRange(cr.from,cr.to,negate);
            }
            cr = cr.next;
            ir=ir.next
        }

        var rb = new dfa.NDRuleBook([new dfa.Rule(newStart, base.next, newEnd)]);
        var specs = {rulebook:rb, acceptstates:accepting, startstate:newStart};
        return new dfa.NFA(specs);
    };

    regex.CharactersRange = CharactersRange;

    function Composite() {

    }

    Composite.prototype = new RegPart();
    Composite.prototype.printSubExp = function (subexp) {
        if (this.getPrecedence() > subexp.getPrecedence()) {
            return '(' + subexp.toString() + ')';
        } else {
            return subexp.toString();
        }
    };

    function Concat(first, second) {
        this.first = first;
        this.second = second;
    }

    Concat.prototype = new Composite();


    Concat.prototype.getPrecedence = function () {
        return 1;
    };
    Concat.prototype.toString = function () {
        return this.printSubExp(this.first) + this.printSubExp(this.second);
    };


    Concat.prototype.toNFA = function () {

        var firstNFA = this.first.toNFA();
        if(this.second.toNFA == undefined){
            debugger;
        }

        var secondNFA = this.second.toNFA();

        if (this.first.isEmpty()) return secondNFA;
        if (this.second.isEmpty()) return firstNFA;
        var startstate = firstNFA.startstate;
        var acceptstates = secondNFA.acceptstates;
        var newRules = junq(firstNFA.acceptstates).map(function (state) {
            return new dfa.Rule(state, dfa.eps, secondNFA.startstate);
        }); //no need to have an array here


        var rules = junq(firstNFA.getRules()).append(newRules).append(secondNFA.getRules()).toArray();
        var rb = new dfa.NDRuleBook(rules);
        var specs = {rulebook:rb, acceptstates:acceptstates, startstate:startstate};
        var nfa = new dfa.NFA(specs);
        return nfa;
    };

    Concat.prototype.getMinMaxLength = function () {
        var firstMinMax = this.first.getMinMaxLength();
        var secondMinMax = this.second.getMinMaxLength();
        return {min:firstMinMax.min+secondMinMax.min, max:firstMinMax.max+secondMinMax.max};
    };

    regex.Concat = Concat;

    function Choice(either, or) {
        this.either = either;
        this.or = or;
    }

    Choice.prototype = new Composite();

    Choice.prototype.getPrecedence = function () {
        return 0;
    };
    Choice.prototype.toString = function () {
        return this.printSubExp(this.either) + '|' + this.printSubExp(this.or);
    };

    //TODO: check for empty to optimize
    Choice.prototype.toNFA = function () {
        var eitherNFA = this.either.toNFA();
        var orNFA = this.or.toNFA();
        var start = new dfa.State(undefined, 'Choice start');
        //var accept = new dfa.State(undefined, 'Choice accept');
        var newRules = junq([
            new dfa.Rule(start, dfa.eps, eitherNFA.startstate),
            new dfa.Rule(start, dfa.eps, orNFA.startstate)
        ])
            .append(eitherNFA.getRules())
            .append(orNFA.getRules())

            .toArray();
        var acceptstates = eitherNFA.acceptstates.union(orNFA.acceptstates);
        var specs = {rulebook:new dfa.NDRuleBook(newRules), acceptstates:acceptstates, startstate:start};
        var nfa = new dfa.NFA(specs);
        return nfa;
    };

    Choice.prototype.getMinMaxLength = function () {
        var eitherMinMax = this.either.getMinMaxLength();
        var orMinMax = this.or.getMinMaxLength();
        return {min:(eitherMinMax.min<orMinMax.min?eitherMinMax.min:orMinMax.min),
                max:(eitherMinMax.max>orMinMax.max?eitherMinMax.max:orMinMax.max)};
    };

    regex.Choice = Choice;

    function Repeat(exp, pattern) {
        this.exp = exp;
        this.pattern = pattern || '*';
    }

    Repeat.prototype = new Composite();
    Repeat.prototype.getPrecedence = function () {
        return 2;
    };

    Repeat.prototype.toString = function () {
        return this.printSubExp(this.exp) + this.pattern;
    };

    Repeat.prototype.toNFA = function () {
        var expNFA = this.exp.toNFA();


        var start = new dfa.State();
        var accept = expNFA.acceptstates;
        if(this.pattern==='*') accept=accept.union(start);
        var rules =
            junq(expNFA.getRules())
                .append(

                    new dfa.Rule(start, dfa.eps, expNFA.startstate)
                )
                .append(junq(expNFA.acceptstates).map(function(as){
                    return new dfa.Rule(as,dfa.eps,expNFA.startstate);
                }))
                .toArray();
        var rb = new dfa.NDRuleBook(rules);
        var specs = {rulebook:rb, acceptstates:accept, startstate:start};
        var nfa = new dfa.NFA(specs);
        return nfa;
    };

    Repeat.prototype.getMinMaxLength = function () {

        return {min:(this.pattern==='+'?this.exp.getMinMaxLength().min:0), max:Infinity};
    };

    regex.Repeat = Repeat;

    function ZeroOrOne(exp) {
        this.pattern = '?';
        this.exp = exp;


    }

    ZeroOrOne.prototype = new Repeat();

    ZeroOrOne.prototype.toNFA = function () {

        var expNFA = this.exp.toNFA();
        var start = expNFA.startstate;

        var accept = expNFA.acceptstates;

        var newRules = junq(expNFA.getRules())
            .append(junq(expNFA.acceptstates).map(function (state) {
                return new dfa.Rule(start, dfa.eps, state);
            })
            )
            .toArray();
        var specs = {rulebook:new dfa.NDRuleBook(newRules), acceptstates:accept, startstate:start};
        var nfa = new dfa.NFA(specs);
        return nfa;
    };

    ZeroOrOne.prototype.getMinMaxLength = function () {
        return {min:0, max:this.exp.getMinMaxLength().max};
    };

    function Interval(base, from, to) {
        this.exp = base;
        this.from = from<to?from:to;
        this.to = from<to?to:from;
    }

    Interval.prototype = new Repeat();
    Interval.prototype.toString = function () {
        return this.printSubExp(this.exp) + '{'+this.from+','+this.to+'}';
    };

    Interval.prototype.toNFA = function () {

        if(this.from===0 && this.to===0){
            return new Empty().toNFA();
        }
        if((this.from===0)&&(this.to===Infinity)){
            return new Repeat(this.exp,'*');
        }

        var n = this.from;
        if(this.to<Infinity){
            n = this.to;
        }

        var rules=[];

        var start ;
        var accept = new sets.Set();

        var previous = new sets.Set();
        for(var i=1;i<=n;i++){
            var expNFA = this.exp.toNFA();
            if(i===1){
                start = expNFA.startstate;
                if(this.from===0){
                    accept = accept.union(start);
                }
            }
            if(i>=this.from){
                accept = accept.union(expNFA.acceptstates);
            }

            rules = rules.concat(expNFA.getRules());
            rules = rules.concat(junq(previous).map(
                function(prevState){
                    return new dfa.Rule(prevState, dfa.eps, expNFA.startstate);
                }
            ).toArray());

            if(i===this.from && this.to===Infinity){
                rules = rules.concat(junq(expNFA.acceptstates).map(
                    function(as){
                        return new dfa.Rule(as, dfa.eps, expNFA.startstate);
                    }
                ).toArray());
            }

            previous = expNFA.acceptstates;

        }



        var rb = new dfa.NDRuleBook(rules);
        var specs = {rulebook:rb, acceptstates:accept, startstate:start};
        var nfa = new dfa.NFA(specs);
        return nfa;
    };

    Interval.prototype.getMinMaxLength = function () {
        var explength = this.exp.getMinMaxLength();
        return {min: this.from*explength.min, max:this.to*explength.max};
    };


    function LookAhead(head,tail){
        this.first = head;
        this.second = tail;
    }

    LookAhead.prototype = new Concat();
    LookAhead.prototype.toString = function () {
        return this.first.toString() + '/' + this.second.toString();
    };
    LookAhead.prototype.isLookAhead = function () {
        return true;
    };

    function parseRegExp(str) {
        if(str==='$') return regex.EOF;
        var sr = new StringReader(str);
        var bol = false;
        if(sr.peek()=='^'){
            sr.eat('^');
            bol=true;
        }
        var ret = parseLookAhead(sr);
        if(bol) ret.bol = bol;
        return ret;
    }

    function parseLookAhead(input){
        var head = parseRE(input);
        var c = input.peek();
        var tail;
        if (input.more() && c === '/' || c==='$') {
            switch(c){
                case '/':
                    input.eat('/');
                    tail = parseRE(input);
                break;
                case '$':
                    input.eat('$');
                    tail = parseRegExp('\r|\n');
                break;
                }
            return new LookAhead(head, tail);
        } else {
            return head;
        }

    }

    function parseRE(input) {

        var term = parseTerm(input);

        if (input.more() && input.peek() === '|') {
            input.eat('|');
            var term2 = parseRE(input);
            return new Choice(term, term2);
        } else {
            return term;
        }
    }

    function parseTerm(input) {
        var factor = new Empty();

        while (input.more() && input.peek() !== ')' && input.peek() !== '|' && input.peek() !== '/'  && input.peek() !== '$') {
            var nextFactor = parseFactor(input);
            factor = new Concat(factor, nextFactor);
        }

        return factor;
    }

    function parseFactor(input) {
        var base = parseAtom(input);

        while (input.more() &&
            (input.peek() === '*' || input.peek() == '+' || input.peek() == '?' || input.peek()=='{')) {
            var pattern = input.next();
            if (pattern === '?') {
                base = new ZeroOrOne(base);
            } else if (pattern === '{'){
                base = parseInterval(base,input);
            } else {
                base = new Repeat(base, pattern);
            }

        }

        return base;
    }

    function parseAtom(input) {
        var range;
        switch (input.peek()) {
            case '(':
                input.eat('(');
                var r = parseRE(input);
                input.eat(')');
                return r;
            case '[':
               return parseCharacterClass(input);
            case '.':
                input.eat('.');
                return DOT();
            case '\\':
                return parseAtomEscape(input);

            default:
                return parseCharacter(input);
        }
    }

    function parseCharacterClass(input){
        "use strict";
        input.eat('[');
        var negate = false;
        var range;
        if(input.peek() === '^') {
            input.eat('^');
            negate = true;
        }

        do{
            var r = parseRange(input);
            if(!(r instanceof(CharactersRange))){
                r = r.second;    
            }
            r.setNegate(negate);
            if(!range){
                range = r;
            }
            else {
                range.append(r);
            }
        }
        while(input.peek()!=']');
        input.eat(']');
        return range;
    }

    function parseAtomEscape(input){
        input.eat('\\');
        var c = input.next();
        "use strict";
        switch(c){
            case 'd':
                return  DIGIT();
                break;
            case 'D':
                return  NOTDIGIT();
                break;
            case 's':
                return  SPACE();
                break;
            case 'S':
                return  NOTSPACE();
                break;
            case 'w':
                return  WORD();
                break;
            case 'W':
                return  NOTWORD();
                break;
            default:
                return new Character(parseCharacterEscape(c, input));
        }
        return new Character(c);
    }

    function parseCharacterEscape(i,input){
        "use strict";
        var c;
        switch(i){
            case 'r':
                c = '\r';
                break;
            case 'n':
                c = '\n';
                break;
            case 'f':
                c = '\f';
                break;
            case 't':
                c = '\t';
                break;
            case 'x':
                var hex = input.next()+input.next();
                c = String.fromCharCode(parseInt(hex,16));
                break;
            case 'u':
                hex = input.next()+input.next()+input.next()+input.next();
                c = String.fromCharCode(parseInt(hex,16));
                break;
            default:
                c = i;
                break;
        }
        return c;
    }

    function parseInterval(base, input){
        var nstr = '';

        while(input.peek()!==','&&input.peek()!=='}'){
            nstr+=input.peek();
            input.next();
        }
        var n1 = parseInt(nstr) || 0;
        nstr='';
        if(input.peek() === ','){
            input.next();

            while(input.peek()!=='}'){
                nstr+=input.peek();
                input.next();
            }

            var n2 = parseInt(nstr) || Infinity;
            input.next();
            return new Interval(base, n1, n2);
        }
        else {
            input.next();
            return new Interval(base,n1,n1);
        }
    }

    var DIGIT = function(){return new CharactersRange('0', '9')};
    var NOTDIGIT = function(){return parseRegExp("[^0-9]")};
    var SPACE = function(){return parseRegExp("[ \\t\\r\\n\xA0]")};
    var NOTSPACE = function(){return parseRegExp("[^ \\t\\r\\n\xA0]")};
    var WORD = function(){return parseRegExp('[a-zA-Z0-9_]')};
    var NOTWORD = function(){return parseRegExp('[^a-zA-Z0-9_]')};
    //TODO: dot is not working right
    var DOT = function(){return parseRegExp('[^\\r\\n]')};

    function parseCharacter(input){
        var c = input.next();
        return new Character(c);
    }

    function parseClassCharacter(input){
        var c = input.peek();
        if(c!='\\'){
            input.eat(c);
            return c;
        }
        input.eat('\\');
        //c = input.next();
        return parseAtomEscape(input);
    }

    function parseClassAtom(input){
        switch (input.peek()) {
                case '\\':
                return parseAtomEscape(input);
            default:
                return parseCharacter(input);
        }
    }

    function parseRange(input){

        var range;

        var from = parseClassAtom(input);
        if(!from.character)//is this a range?
            return from;
        from = from.character;
        if(input.peek()==='-')
        {
            input.eat('-');
            var to = parseClassCharacter(input);
            range = new CharactersRange(from,to);
        }

        else{
            range = new CharactersRange(from,from)
        }
        //range.negate = negate;
        return range;
    }



    regex.parseRegExp = parseRegExp;
    regex.EOF = new RegPart();

})(regex || (regex = {}), automata,StringReader);

if (typeof(module) !== 'undefined') { module.exports = regex; }

},{"./automata":8,"./stringreader":18,"junq":19,"junq/sets":20}],18:[function(require,module,exports){
var StringReader=
    (function (sr,undefined) {
	var StringReader = function StringReader(str){
        if(!(this instanceof StringReader)) return new StringReader(str);
		this.str = str;
		this.pos = 0;
        this.line = 0;
        this.col = 0;
	};

    StringReader.prototype.getPos = function(){
        return this.pos;
    };

	StringReader.prototype.peek = function()
	{
		//TODO: handle EOF
		return this.str.charAt(this.pos);
	};

	StringReader.prototype.eat = function(str)
	{
		var istr = this.str.substring(this.pos,this.pos+str.length);
		if(istr===str){
			this.pos+=str.length;
            this.updatePos(str,1);
		} else {
			throw new Error('Expected "'+str+'", got "'+istr+'"!');
		}
	};

    StringReader.prototype.updatePos = function(str,delta){
        for(var i=0;i<str.length;i++){
            if(str[i]=='\n'){
                this.col=0;
                this.line+=delta;
            }else{
                this.col+=delta;
            }
        }
    };

    StringReader.prototype.rollback = function(str)
    {
        if(typeof str === 'string')
        {
            var istr = this.str.substring(this.pos-str.length,this.pos);
            if(istr===str){
                this.pos-=str.length;
                this.updatePos(str,-1);
            } else {
                throw new Error('Expected "'+str+'", got "'+istr+'"!');
            }
        } else {
            this.pos-=str;
            this.updatePos(str,-1);
        }

    };

	StringReader.prototype.next = function()
	{
		var s = this.str.charAt(this.pos);
		this.pos=this.pos+1;
		this.updatePos(s,1);
		return s;
	};

	StringReader.prototype.more = function()
	{
		return this.pos<this.str.length;
	};

    StringReader.prototype.reset = function(){
        this.pos=0;
    };

	return StringReader;
})( );

if (typeof(module) !== 'undefined') { module.exports = StringReader; }
},{}],19:[function(require,module,exports){
/* Junq library v 1.0.0.0
 Copyright Gabriele Cannata 2013-2014
 */

var junq = (function (undefined) {

    var identity = function (o) { return o; };
    var trueConstant = function () { return true; };
    var falseConstant = function () { return false; };
    var stdcomparison = function (a, b) { return a < b; };
    var equality = function (a, b) { return a === b; };
    var doNothing = function(){};
    var emptyenum = { moveNext: falseConstant, getCurrent: doNothing };

    //junq.prototype.constructor = junq;
    var wrapper = function Junqy(o) {
        this._o = o;
        //not really needed
        return this;
    };



    var junq = function (o) {
        return new wrapper(o);
    };

    junq.identity = identity;

    wrapper.prototype.getEnumerator = function () {
        return junq.enumerate(this._o);
    };

    wrapper.prototype.forEach = function (func) {
        junq.forEach(this, func);
    };
    wrapper.prototype.filter = wrapper.prototype.where = function (func) {
        return junq(junq.filter(this, func));
    };

    wrapper.prototype.toArray = function () {
        return junq.toArray(this);
    };
    wrapper.prototype.select = wrapper.prototype.map = function (func) {
        return junq(junq.select(this, func));
    };

    wrapper.prototype.flatmap = function (func) {
        return junq(junq.flatmap(this,func));
    };

    wrapper.prototype.flatten = function () {
        return junq(junq.flatten(this));
    };

    wrapper.prototype.append = function (o) {
        return junq(junq.append(junq(o)).to(this));
    };

    wrapper.prototype.first = function (f) {
        return junq.first(this, f);
    };

    wrapper.prototype.any = function (f) {
        return junq.any(this, f);
    };

    wrapper.prototype.all = function (f) {
        return junq.all(this, f);
    };

    wrapper.prototype.sum = function () {
        return junq.sum(this);
    };

    wrapper.prototype.min = function (comparison) {
        return junq.min(this, comparison);
    };

    wrapper.prototype.max = function (comparison) {
        return junq.max(this, comparison);
    };
    wrapper.prototype.aggregate = function (aggregator, initial) {
        return junq.aggregate(this, aggregator, initial);
    };

    wrapper.prototype.contains = function (val, eq) {
        return junq.contains(this, val, eq);
    };

    wrapper.prototype.take = wrapper.prototype.top = function (num) {
        return junq.take(this,num);
    };

    wrapper.prototype.last  = function () {
        return junq.last(this);
    };

    wrapper.prototype.nth  = function (num) {
        return junq.nth(this,num);
    };

    wrapper.prototype.odd  = function () {
        return junq(junq.odd(this));
    };
    wrapper.prototype.even  = function () {
        return junq(junq.even(this));
    };

    //junq.prototype.init.prototype = junq.prototype;

    //static methods 

    junq.enumerate = function (o) {

        if (o === undefined) {
            throw new Error('Cannot enumerate undefined!');
        }

        if (o.getEnumerator) {//consider this an enumerable
            return o.getEnumerator();
        }
        /** TODO other special cases **/
        if (o.moveNext && o.getCurrent) {//consider this an enumerator
            return o;
        }

        if(typeof (o) === 'string'){
            return junq.enumerate(arguments);
        }

        if (Array.isArray(o) || o.hasOwnProperty('length')) {
            return new junq.ArrayEnumerator(o);
        }


        if (arguments.length) {
            return junq.enumerate(arguments);
        }

        throw new Error('Cannot enumerate ' + o);
    };
    junq.forEach = function forEach(enumerable, func) {
        var enumerator = junq.enumerate(enumerable);
        while (enumerator.moveNext()) {
            func(enumerator.getCurrent());
        }
    };


    junq.filter = junq.where = function filter(enumerable, predicate) {
        var e = junq.enumerate(enumerable);

        return ({
            moveNext: function () {
                while (e.moveNext()) {
                    if (predicate(e.getCurrent())) {
                        return true;
                    }
                }
                return false;
            },
            getCurrent: function () {
                return e.getCurrent();
            }
        });
    };

    junq.even = function(enumerable){
        return junq.odd(enumerable, true);
    }

    junq.odd = function odd(enumerable, even){
        var odd=even | false;
        var enumerator = junq.enumerate(enumerable);
        return ({
            moveNext: function () {
                while (enumerator.moveNext()) {

                    if(odd=!odd){
                        return true;
                    }


                }
                return false;
            },
            getCurrent: function () {
                return enumerator.getCurrent();
            }
        });
    };

    junq.select = junq.map = function select(enumerable, func) {
        var enumerator = junq.enumerate(enumerable);
        return ({
            moveNext: function () {
                return enumerator.moveNext();
            },
            getCurrent: function () {
                return func(enumerator.getCurrent());
            }
        });

    };

    junq.flatmap = function (enumerable, func) {
        var outer = junq.enumerate(enumerable);
        var f = func || identity;
        var lastres;
        var currentouter;
        return ({
            moveNext: function () {
                do {
                    if (!lastres) {
                        if (!(lastres = outer.moveNext())) return false;
                        currentouter = junq.enumerate(f(outer.getCurrent()));
                    }
                    if (lastres = currentouter.moveNext())
                        return true;
                }
                while (!lastres);
                return false;
            },
            getCurrent: function () {
                return currentouter.getCurrent();
            }
        });

    };

    junq.flatten = function (enumerable, func) {
        var outer = junq.enumerate(enumerable);
        var f = func || identity;
        var lastres;
        var currentouter;
        return ({
            moveNext: function () {
                do {
                    if (!lastres) {
                        if (!(lastres = outer.moveNext())) return false;
                        currentouter = junq.enumerate(outer.getCurrent());
                    }
                    if (lastres = currentouter.moveNext())
                        return true;
                }
                while (!lastres);
                return false;
            },
            getCurrent: function () {
                return f(currentouter.getCurrent());
            }
        });

    };

    junq.toArray = function (enumerable) {
        var a = [];
        junq.forEach(enumerable, function (o) {
            a.push(o);
        });
        return a;
    };

    junq.range = function (length, start, step) {
        return junq({
            getEnumerator: function () {
                return new junq.RangeEnumerator(length, start, step);
            }
        });
    };

    junq.append = function (enumerable) {
        return {
            to: function (other) {
                return junq.concat(other, enumerable);
            }
        };

    };


    junq.concat = function (first, then) {
        return junq.flatten(junq.enumerate([first, then]));
    };

    junq.first = function (enumerable, predicate) {
        var f = predicate || trueConstant;
        var e = junq.enumerate(enumerable);
        while (e.moveNext()) {
            if (f(e.getCurrent())) {
                return e.getCurrent();
            }
        }
        return undefined;
    };

    junq.last = function (enumerable, predicate) {
        var f = predicate || trueConstant;
        var e = junq.enumerate(enumerable);
        var val = undefined;
        while (e.moveNext()) {
            val = e.getCurrent();
        }
        return val;
    };

    junq.any = function (enumerable, predicate) {
        return junq.first(enumerable, predicate) !== undefined;
    };

    junq.all = function (enumerable, predicate) {
        var e = junq.enumerate(enumerable);
        while (e.moveNext()) {
            if (!predicate(e.getCurrent())) {
                return false;
            }
        }
        return true;
    };

    junq.sum = function (enumerable) {
        return junq.aggregate(enumerable, function (acc, x) {
            return acc + x;
        },0);
    };

    junq.min = function (enumerable, comparison) {
        var c = comparison || stdcomparison;

        return junq.aggregate(enumerable, function (acc, x) {
            return acc && c(acc, x) ? acc : x;
        });
    };

    junq.max = function (enumerable, comparison) {
        var c = comparison || stdcomparison;

        return junq.aggregate(enumerable, function (acc, x) {
            return !acc || c(acc, x) ? x : acc;
        });
    };

    junq.aggregate = function (enumerable, agg, initial) {
        var acc = initial;
        junq.forEach(enumerable, function (x) {
            acc = agg(acc, x);
        });
        return acc;
    };

    junq.contains = function (enumerable, o, eq) {
        eq = eq || equality;
        return junq.any(enumerable, function (x) {
            return eq(o, x);
        });
    };

    junq.repeat = function (element, count) {
        return junq({
            getCurrent: function () {
                return element;
            },
            moveNext: function () {
                return (count--) > 0;
            }
        });
    };

    junq.take = junq.top =  function (enumerable, top) {
        var e = junq.enumerate(enumerable);
        return junq({
            getCurrent: function () {
                return e.getCurrent();
            },
            moveNext: function () {
                return (top--) > 0 && e.moveNext();
            }
        });
    };

    junq.nth = function(enumerable,num){
        return junq.take(enumerable,num).last();
    };

    //nested "classes"
    junq.ArrayEnumerator = (function () {
        function ArrayEnumerator(array) {
            this._array = array;
            this._current = -1;
        }
        ArrayEnumerator.prototype.moveNext = function () {
            this._current++;
            return this._current < this._array.length;

        };

        ArrayEnumerator.prototype.getCurrent = function () {
            return this._array[this._current];
        };
        return ArrayEnumerator;
    })();

    junq.RangeEnumerator = (function () {
        function RangeEnumerator(length, start, step) {
            if (start === undefined) {
                start = 0;
            }

            if (step === undefined) {
                step = 1;
            }
            if (length === undefined) {
                throw new Error('length must be speccified');
            }
            this._current = start-step; //is incremented in the first moveNext
            this._length = length;
            this._step = step;
        }
        RangeEnumerator.prototype.moveNext = function () {

            if (this._length > 0) {
                this._length--;
                this._current += this._step;
                return true;
            }
            return false;
        };

        RangeEnumerator.prototype.getCurrent = function () {
            return this._current;
        };
        return RangeEnumerator;
    })();

    return junq;
})();

if (typeof(module) !== 'undefined') { module.exports = junq; }




},{}],20:[function(require,module,exports){
/* Junq library v 1.0.0.0
 Copyright Gabriele Cannata 2013-2014
 Sets extensions
 */

var junq = junq || require('./junq.js');

var sets;
(function (sets, undefined) {


    var Set = (function () {

        var internalRep = function (objects) {
            var self = this;
            self.set = [];
            junq(objects).forEach(function (o) {
                self.add(o);

            });

        };

        function Set(objects) {
            if (objects !== undefined) {
                if (arguments.length == 1)
                    internalRep.call(this, objects);
                else
                    internalRep.call(this, arguments);
            } else {
                internalRep.call(this, []);
            }

        }

        var isSet = function isSet(o) {
            if (o !== undefined) {
                return o.constructor === Set;
            } else {
                return false;
            }

        };
        sets.isSet = isSet;


        Set.prototype.toString = function () {

            return '{' + this.toArray().join(', ') + '}';
        };

        Set.prototype.forEach = function (func) {
            this.set.forEach(func);
            return this;
        };

        Set.prototype.contains = function (element) {
            return (this.set.indexOf(element) >= 0);
            // var l=this.set.length
            // for(var i=0; i<l;i++){
            //     if(this.set[i]===element) return true;
            // }
            // return false;
        };

        Set.prototype.add = function (element) {

            if (!this.contains(element)){
                this.set.push(element);
                return true;
            }
        };

        Set.prototype.addSet = function (other) {
            var done = false;
            var self = this;
            other.forEach(function (e) {
                done = done || self.add(e);
            });
            return done;
        };

        Set.prototype.remove = function (element) {
            var l = this.set.length;
            for (var i = 0; i < l; i++) {
                if (this.set[i] === element) {
                    this.set.splice(i, 1);
                    return true;
                }
            }
            return false;
        };

        Set.prototype.union = function (other) {

            var res = this.clone();
            var done = false;
            if (isSet(other)) {
                other.forEach(function (e) {
                    done = res.add(e)  || done;
                });
            } else {
                done = res.add(other);
            }

            return res;
        };

        Set.prototype.clone = function () {
            var res = new Set();
            res.set = this.set.slice(0, this.set.length);
            return res;
        };

        Set.prototype.intersect = function (other) {
            var res = new Set();
            this.forEach(function (e) {
                if (other.contains(e))
                    res.add(e);
            });

            return res;
        };

        Set.prototype.cardinality = function () {
            return this.set.length;
        };

        Set.prototype.subtract = function (other) {

            var res = this.clone();

            other.forEach(function (e) {
                res.remove(e);
            });
            return res;
        };

        Set.prototype.equalTo = function (other) {
            if (this.cardinality() !== other.cardinality()) return false;
            return this.subtract(other).isEmpty();// && other.subtract(this).isEmpty();

        };

        Set.prototype.isEmpty = function () {
            return this.set.length === 0;

        };

        Set.prototype.getEnumerator = function () {
            return junq.enumerate(this.toArray());
        };

        Set.prototype.toArray = function () {

            return this.set;
        };

        Set.prototype.isSingleton = function () {
            return this.set.length === 1;
        };

        Set.prototype.getElement = function (n) {
            n = n | 0;
            if (this.set.length <= n)
                throw new Error('Not enough elements!');
            return this.set[n];
        };

        Set.prototype.getEnumerator = function () {
            return new junq.ArrayEnumerator(this.set);
        };

        return Set;
    })();
    sets.Set = Set;

})(sets || (sets = {}));

if (typeof(module) !== 'undefined') { module.exports = sets; }
},{"./junq.js":19}],21:[function(require,module,exports){
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

},{"../js/engine":2,"fs":4}]},{},[21]);
