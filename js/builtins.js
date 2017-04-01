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