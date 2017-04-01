(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
/**
 * Created by gcannata on 01/03/2015.
 */
window.lexer =  require('jacob/lib/lexer');
window.StringReader =  require('jacob/lib/stringreader');
window.parser =  require('jacob/lib/parser');
window.junq = require('junq');
},{"jacob/lib/lexer":3,"jacob/lib/parser":4,"jacob/lib/stringreader":6,"junq":7}],2:[function(require,module,exports){
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



},{"junq":7,"junq/sets":8}],3:[function(require,module,exports){
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
},{"./automata.js":2,"./regex":5,"./stringreader.js":6,"junq":7,"junq/sets":8}],4:[function(require,module,exports){
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

},{"./automata":2,"junq":7,"junq/sets":8}],5:[function(require,module,exports){
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
    var SPACE = function(){return parseRegExp("[ \\t\\r\\n]")};
    var NOTSPACE = function(){return parseRegExp("[^ \\t\\r\\n]")};
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

},{"./automata":2,"./stringreader":6,"junq":7,"junq/sets":8}],6:[function(require,module,exports){
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
},{}],7:[function(require,module,exports){
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




},{}],8:[function(require,module,exports){
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
},{"./junq.js":7}]},{},[1]);
