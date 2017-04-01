/**
 * Created by gcannata on 27/02/2015.
 */
var root = createBindingContext();
var db = new DB();
var engine = new Engine(db);

/*
 a(X, Y) :- b(X), !, c(Y).
 b(1).
 b(2).
 b(3).

 c(1).
 c(2).
 c(3).
* */



db.addRule(Rule(Pred('a',['X','Y']), [Pred('b',['X']),Cut(),Pred('c',['Y'])]));
db.addRule(Rule(Pred('b',[1]), []));
db.addRule(Rule(Pred('b',[2]), []));
db.addRule(Rule(Pred('b',[3]), []));
db.addRule(Rule(Pred('c',[1]), []));
db.addRule(Rule(Pred('c',[2]), []));
db.addRule(Rule(Pred('c',[3]), []));
var query = Is('X',[
            'X',
            Operand('*',[3,2])
    ]
);

engine.solve(query);

query = Comparator('=<',[3,2]);
engine.solve(query);