/**
 * Created by gcannata on 27/02/2015.
 */
var root = createBindingContext();
var db = new DB();
var engine = new Engine(db);

/*var p1 = Pred('mortal','Y');
 var p2 = Pred('person','Y');
 var p3 = Pred('person','socrate');
 var p4 = Pred('person','plato');*/

db.addRule(Rule(Pred('f',['a']), []));
db.addRule(Rule(Pred('f',['b']), []));
db.addRule(Rule(Pred('g',['a']), []));
db.addRule(Rule(Pred('g',['b']), []));
db.addRule(Rule(Pred('h',['b']), []));
db.addRule(Rule(Pred('h',['a']), []));
db.addRule(Rule(Pred('k',['X']), [Pred('f',['X']),Pred('g',['X']),Pred('h',['X'])]));
var query = Pred('k','Y');

engine.solve(query);