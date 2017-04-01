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

