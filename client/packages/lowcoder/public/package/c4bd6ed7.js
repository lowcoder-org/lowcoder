var ve = Object.defineProperty, Ne = Object.defineProperties;
var ke = Object.getOwnPropertyDescriptors;
var ue = Object.getOwnPropertySymbols;
var Ie = Object.prototype.hasOwnProperty, Oe = Object.prototype.propertyIsEnumerable;
var he = (e, a, l) => a in e ? ve(e, a, { enumerable: !0, configurable: !0, writable: !0, value: l }) : e[a] = l, j = (e, a) => {
  for (var l in a || (a = {}))
    Ie.call(a, l) && he(e, l, a[l]);
  if (ue)
    for (var l of ue(a))
      Oe.call(a, l) && he(e, l, a[l]);
  return e;
}, U = (e, a) => Ne(e, ke(a));
var K = (e, a, l) => new Promise((u, n) => {
  var p = (f) => {
    try {
      b(l.next(f));
    } catch (g) {
      n(g);
    }
  }, o = (f) => {
    try {
      b(l.throw(f));
    } catch (g) {
      n(g);
    }
  }, b = (f) => f.done ? u(f.value) : Promise.resolve(f.value).then(p, o);
  b((l = l.apply(e, a)).next());
});
import { c as Te, Z as ne, h as J, i as ze, l as S, E as Ce, B as Ae, o as Re } from "./1269154d.js";
import { c as Be } from "./c4c5f13b.js";
import { i as Pe, c as Fe, b as Ke, d as Me, a as xe, p as Ye } from "./e95fa522.js";
import { G as We } from "./4bc5ef7f.js";
import { o as Ve } from "./92e85b65.js";
import { s as je } from "./2ff7471d.js";
import { c as Ue } from "./000297fb.js";
import "./945d7302.js";
import "./e437d53e.js";
import "./2ff2c7a6.js";
import "./256b619e.js";
import "./f9637058.js";
var de, ge, ie = function() {
  var e = function(D, c, s, i) {
    for (s = s || {}, i = D.length; i--; s[D[i]] = c)
      ;
    return s;
  }, a = [1, 7], l = [1, 13], u = [1, 14], n = [1, 15], p = [1, 19], o = [1, 16], b = [1, 17], f = [1, 18], g = [8, 30], x = [8, 21, 28, 29, 30, 31, 32, 40, 44, 47], E = [1, 23], T = [1, 24], v = [8, 15, 16, 21, 28, 29, 30, 31, 32, 40, 44, 47], N = [8, 15, 16, 21, 27, 28, 29, 30, 31, 32, 40, 44, 47], y = [1, 49], L = {
    trace: function() {
    },
    yy: {},
    symbols_: { error: 2, spaceLines: 3, SPACELINE: 4, NL: 5, separator: 6, SPACE: 7, EOF: 8, start: 9, BLOCK_DIAGRAM_KEY: 10, document: 11, stop: 12, statement: 13, link: 14, LINK: 15, START_LINK: 16, LINK_LABEL: 17, STR: 18, nodeStatement: 19, columnsStatement: 20, SPACE_BLOCK: 21, blockStatement: 22, classDefStatement: 23, cssClassStatement: 24, styleStatement: 25, node: 26, SIZE: 27, COLUMNS: 28, "id-block": 29, end: 30, block: 31, NODE_ID: 32, nodeShapeNLabel: 33, dirList: 34, DIR: 35, NODE_DSTART: 36, NODE_DEND: 37, BLOCK_ARROW_START: 38, BLOCK_ARROW_END: 39, classDef: 40, CLASSDEF_ID: 41, CLASSDEF_STYLEOPTS: 42, DEFAULT: 43, class: 44, CLASSENTITY_IDS: 45, STYLECLASS: 46, style: 47, STYLE_ENTITY_IDS: 48, STYLE_DEFINITION_DATA: 49, $accept: 0, $end: 1 },
    terminals_: { 2: "error", 4: "SPACELINE", 5: "NL", 7: "SPACE", 8: "EOF", 10: "BLOCK_DIAGRAM_KEY", 15: "LINK", 16: "START_LINK", 17: "LINK_LABEL", 18: "STR", 21: "SPACE_BLOCK", 27: "SIZE", 28: "COLUMNS", 29: "id-block", 30: "end", 31: "block", 32: "NODE_ID", 35: "DIR", 36: "NODE_DSTART", 37: "NODE_DEND", 38: "BLOCK_ARROW_START", 39: "BLOCK_ARROW_END", 40: "classDef", 41: "CLASSDEF_ID", 42: "CLASSDEF_STYLEOPTS", 43: "DEFAULT", 44: "class", 45: "CLASSENTITY_IDS", 46: "STYLECLASS", 47: "style", 48: "STYLE_ENTITY_IDS", 49: "STYLE_DEFINITION_DATA" },
    productions_: [0, [3, 1], [3, 2], [3, 2], [6, 1], [6, 1], [6, 1], [9, 3], [12, 1], [12, 1], [12, 2], [12, 2], [11, 1], [11, 2], [14, 1], [14, 4], [13, 1], [13, 1], [13, 1], [13, 1], [13, 1], [13, 1], [13, 1], [19, 3], [19, 2], [19, 1], [20, 1], [22, 4], [22, 3], [26, 1], [26, 2], [34, 1], [34, 2], [33, 3], [33, 4], [23, 3], [23, 3], [24, 3], [25, 3]],
    performAction: function(c, s, i, h, d, t, m) {
      var r = t.length - 1;
      switch (d) {
        case 4:
          h.getLogger().debug("Rule: separator (NL) ");
          break;
        case 5:
          h.getLogger().debug("Rule: separator (Space) ");
          break;
        case 6:
          h.getLogger().debug("Rule: separator (EOF) ");
          break;
        case 7:
          h.getLogger().debug("Rule: hierarchy: ", t[r - 1]), h.setHierarchy(t[r - 1]);
          break;
        case 8:
          h.getLogger().debug("Stop NL ");
          break;
        case 9:
          h.getLogger().debug("Stop EOF ");
          break;
        case 10:
          h.getLogger().debug("Stop NL2 ");
          break;
        case 11:
          h.getLogger().debug("Stop EOF2 ");
          break;
        case 12:
          h.getLogger().debug("Rule: statement: ", t[r]), typeof t[r].length == "number" ? this.$ = t[r] : this.$ = [t[r]];
          break;
        case 13:
          h.getLogger().debug("Rule: statement #2: ", t[r - 1]), this.$ = [t[r - 1]].concat(t[r]);
          break;
        case 14:
          h.getLogger().debug("Rule: link: ", t[r], c), this.$ = { edgeTypeStr: t[r], label: "" };
          break;
        case 15:
          h.getLogger().debug("Rule: LABEL link: ", t[r - 3], t[r - 1], t[r]), this.$ = { edgeTypeStr: t[r], label: t[r - 1] };
          break;
        case 18:
          const R = parseInt(t[r]), W = h.generateId();
          this.$ = { id: W, type: "space", label: "", width: R, children: [] };
          break;
        case 23:
          h.getLogger().debug("Rule: (nodeStatement link node) ", t[r - 2], t[r - 1], t[r], " typestr: ", t[r - 1].edgeTypeStr);
          const F = h.edgeStrToEdgeData(t[r - 1].edgeTypeStr);
          this.$ = [
            { id: t[r - 2].id, label: t[r - 2].label, type: t[r - 2].type, directions: t[r - 2].directions },
            { id: t[r - 2].id + "-" + t[r].id, start: t[r - 2].id, end: t[r].id, label: t[r - 1].label, type: "edge", directions: t[r].directions, arrowTypeEnd: F, arrowTypeStart: "arrow_open" },
            { id: t[r].id, label: t[r].label, type: h.typeStr2Type(t[r].typeStr), directions: t[r].directions }
          ];
          break;
        case 24:
          h.getLogger().debug("Rule: nodeStatement (abc88 node size) ", t[r - 1], t[r]), this.$ = { id: t[r - 1].id, label: t[r - 1].label, type: h.typeStr2Type(t[r - 1].typeStr), directions: t[r - 1].directions, widthInColumns: parseInt(t[r], 10) };
          break;
        case 25:
          h.getLogger().debug("Rule: nodeStatement (node) ", t[r]), this.$ = { id: t[r].id, label: t[r].label, type: h.typeStr2Type(t[r].typeStr), directions: t[r].directions, widthInColumns: 1 };
          break;
        case 26:
          h.getLogger().debug("APA123", this ? this : "na"), h.getLogger().debug("COLUMNS: ", t[r]), this.$ = { type: "column-setting", columns: t[r] === "auto" ? -1 : parseInt(t[r]) };
          break;
        case 27:
          h.getLogger().debug("Rule: id-block statement : ", t[r - 2], t[r - 1]), h.generateId(), this.$ = U(j({}, t[r - 2]), { type: "composite", children: t[r - 1] });
          break;
        case 28:
          h.getLogger().debug("Rule: blockStatement : ", t[r - 2], t[r - 1], t[r]);
          const C = h.generateId();
          this.$ = { id: C, type: "composite", label: "", children: t[r - 1] };
          break;
        case 29:
          h.getLogger().debug("Rule: node (NODE_ID separator): ", t[r]), this.$ = { id: t[r] };
          break;
        case 30:
          h.getLogger().debug("Rule: node (NODE_ID nodeShapeNLabel separator): ", t[r - 1], t[r]), this.$ = { id: t[r - 1], label: t[r].label, typeStr: t[r].typeStr, directions: t[r].directions };
          break;
        case 31:
          h.getLogger().debug("Rule: dirList: ", t[r]), this.$ = [t[r]];
          break;
        case 32:
          h.getLogger().debug("Rule: dirList: ", t[r - 1], t[r]), this.$ = [t[r - 1]].concat(t[r]);
          break;
        case 33:
          h.getLogger().debug("Rule: nodeShapeNLabel: ", t[r - 2], t[r - 1], t[r]), this.$ = { typeStr: t[r - 2] + t[r], label: t[r - 1] };
          break;
        case 34:
          h.getLogger().debug("Rule: BLOCK_ARROW nodeShapeNLabel: ", t[r - 3], t[r - 2], " #3:", t[r - 1], t[r]), this.$ = { typeStr: t[r - 3] + t[r], label: t[r - 2], directions: t[r - 1] };
          break;
        case 35:
        case 36:
          this.$ = { type: "classDef", id: t[r - 1].trim(), css: t[r].trim() };
          break;
        case 37:
          this.$ = { type: "applyClass", id: t[r - 1].trim(), styleClass: t[r].trim() };
          break;
        case 38:
          this.$ = { type: "applyStyles", id: t[r - 1].trim(), stylesStr: t[r].trim() };
          break;
      }
    },
    table: [{ 9: 1, 10: [1, 2] }, { 1: [3] }, { 11: 3, 13: 4, 19: 5, 20: 6, 21: a, 22: 8, 23: 9, 24: 10, 25: 11, 26: 12, 28: l, 29: u, 31: n, 32: p, 40: o, 44: b, 47: f }, { 8: [1, 20] }, e(g, [2, 12], { 13: 4, 19: 5, 20: 6, 22: 8, 23: 9, 24: 10, 25: 11, 26: 12, 11: 21, 21: a, 28: l, 29: u, 31: n, 32: p, 40: o, 44: b, 47: f }), e(x, [2, 16], { 14: 22, 15: E, 16: T }), e(x, [2, 17]), e(x, [2, 18]), e(x, [2, 19]), e(x, [2, 20]), e(x, [2, 21]), e(x, [2, 22]), e(v, [2, 25], { 27: [1, 25] }), e(x, [2, 26]), { 19: 26, 26: 12, 32: p }, { 11: 27, 13: 4, 19: 5, 20: 6, 21: a, 22: 8, 23: 9, 24: 10, 25: 11, 26: 12, 28: l, 29: u, 31: n, 32: p, 40: o, 44: b, 47: f }, { 41: [1, 28], 43: [1, 29] }, { 45: [1, 30] }, { 48: [1, 31] }, e(N, [2, 29], { 33: 32, 36: [1, 33], 38: [1, 34] }), { 1: [2, 7] }, e(g, [2, 13]), { 26: 35, 32: p }, { 32: [2, 14] }, { 17: [1, 36] }, e(v, [2, 24]), { 11: 37, 13: 4, 14: 22, 15: E, 16: T, 19: 5, 20: 6, 21: a, 22: 8, 23: 9, 24: 10, 25: 11, 26: 12, 28: l, 29: u, 31: n, 32: p, 40: o, 44: b, 47: f }, { 30: [1, 38] }, { 42: [1, 39] }, { 42: [1, 40] }, { 46: [1, 41] }, { 49: [1, 42] }, e(N, [2, 30]), { 18: [1, 43] }, { 18: [1, 44] }, e(v, [2, 23]), { 18: [1, 45] }, { 30: [1, 46] }, e(x, [2, 28]), e(x, [2, 35]), e(x, [2, 36]), e(x, [2, 37]), e(x, [2, 38]), { 37: [1, 47] }, { 34: 48, 35: y }, { 15: [1, 50] }, e(x, [2, 27]), e(N, [2, 33]), { 39: [1, 51] }, { 34: 52, 35: y, 39: [2, 31] }, { 32: [2, 15] }, e(N, [2, 34]), { 39: [2, 32] }],
    defaultActions: { 20: [2, 7], 23: [2, 14], 50: [2, 15], 52: [2, 32] },
    parseError: function(c, s) {
      if (s.recoverable)
        this.trace(c);
      else {
        var i = new Error(c);
        throw i.hash = s, i;
      }
    },
    parse: function(c) {
      var s = this, i = [0], h = [], d = [null], t = [], m = this.table, r = "", R = 0, W = 0, F = 2, C = 1, ye = t.slice.call(arguments, 1), w = Object.create(this.lexer), M = { yy: {} };
      for (var $ in this.yy)
        Object.prototype.hasOwnProperty.call(this.yy, $) && (M.yy[$] = this.yy[$]);
      w.setInput(c, M.yy), M.yy.lexer = w, M.yy.parser = this, typeof w.yylloc == "undefined" && (w.yylloc = {});
      var ee = w.yylloc;
      t.push(ee);
      var we = w.options && w.options.ranges;
      typeof M.yy.parseError == "function" ? this.parseError = M.yy.parseError : this.parseError = Object.getPrototypeOf(this).parseError;
      function De() {
        var P;
        return P = h.pop() || w.lex() || C, typeof P != "number" && (P instanceof Array && (h = P, P = h.pop()), P = s.symbols_[P] || P), P;
      }
      for (var I, Y, z, te, V = {}, q, B, ce, Z; ; ) {
        if (Y = i[i.length - 1], this.defaultActions[Y] ? z = this.defaultActions[Y] : ((I === null || typeof I == "undefined") && (I = De()), z = m[Y] && m[Y][I]), typeof z == "undefined" || !z.length || !z[0]) {
          var se = "";
          Z = [];
          for (q in m[Y])
            this.terminals_[q] && q > F && Z.push("'" + this.terminals_[q] + "'");
          w.showPosition ? se = "Parse error on line " + (R + 1) + `:
` + w.showPosition() + `
Expecting ` + Z.join(", ") + ", got '" + (this.terminals_[I] || I) + "'" : se = "Parse error on line " + (R + 1) + ": Unexpected " + (I == C ? "end of input" : "'" + (this.terminals_[I] || I) + "'"), this.parseError(se, {
            text: w.match,
            token: this.terminals_[I] || I,
            line: w.yylineno,
            loc: ee,
            expected: Z
          });
        }
        if (z[0] instanceof Array && z.length > 1)
          throw new Error("Parse Error: multiple actions possible at state: " + Y + ", token: " + I);
        switch (z[0]) {
          case 1:
            i.push(I), d.push(w.yytext), t.push(w.yylloc), i.push(z[1]), I = null, W = w.yyleng, r = w.yytext, R = w.yylineno, ee = w.yylloc;
            break;
          case 2:
            if (B = this.productions_[z[1]][1], V.$ = d[d.length - B], V._$ = {
              first_line: t[t.length - (B || 1)].first_line,
              last_line: t[t.length - 1].last_line,
              first_column: t[t.length - (B || 1)].first_column,
              last_column: t[t.length - 1].last_column
            }, we && (V._$.range = [
              t[t.length - (B || 1)].range[0],
              t[t.length - 1].range[1]
            ]), te = this.performAction.apply(V, [
              r,
              W,
              R,
              M.yy,
              z[1],
              d,
              t
            ].concat(ye)), typeof te != "undefined")
              return te;
            B && (i = i.slice(0, -1 * B * 2), d = d.slice(0, -1 * B), t = t.slice(0, -1 * B)), i.push(this.productions_[z[1]][0]), d.push(V.$), t.push(V._$), ce = m[i[i.length - 2]][i[i.length - 1]], i.push(ce);
            break;
          case 3:
            return !0;
        }
      }
      return !0;
    }
  }, A = function() {
    var D = {
      EOF: 1,
      parseError: function(s, i) {
        if (this.yy.parser)
          this.yy.parser.parseError(s, i);
        else
          throw new Error(s);
      },
      // resets the lexer, sets new input
      setInput: function(c, s) {
        return this.yy = s || this.yy || {}, this._input = c, this._more = this._backtrack = this.done = !1, this.yylineno = this.yyleng = 0, this.yytext = this.matched = this.match = "", this.conditionStack = ["INITIAL"], this.yylloc = {
          first_line: 1,
          first_column: 0,
          last_line: 1,
          last_column: 0
        }, this.options.ranges && (this.yylloc.range = [0, 0]), this.offset = 0, this;
      },
      // consumes and returns one char from the input
      input: function() {
        var c = this._input[0];
        this.yytext += c, this.yyleng++, this.offset++, this.match += c, this.matched += c;
        var s = c.match(/(?:\r\n?|\n).*/g);
        return s ? (this.yylineno++, this.yylloc.last_line++) : this.yylloc.last_column++, this.options.ranges && this.yylloc.range[1]++, this._input = this._input.slice(1), c;
      },
      // unshifts one char (or a string) into the input
      unput: function(c) {
        var s = c.length, i = c.split(/(?:\r\n?|\n)/g);
        this._input = c + this._input, this.yytext = this.yytext.substr(0, this.yytext.length - s), this.offset -= s;
        var h = this.match.split(/(?:\r\n?|\n)/g);
        this.match = this.match.substr(0, this.match.length - 1), this.matched = this.matched.substr(0, this.matched.length - 1), i.length - 1 && (this.yylineno -= i.length - 1);
        var d = this.yylloc.range;
        return this.yylloc = {
          first_line: this.yylloc.first_line,
          last_line: this.yylineno + 1,
          first_column: this.yylloc.first_column,
          last_column: i ? (i.length === h.length ? this.yylloc.first_column : 0) + h[h.length - i.length].length - i[0].length : this.yylloc.first_column - s
        }, this.options.ranges && (this.yylloc.range = [d[0], d[0] + this.yyleng - s]), this.yyleng = this.yytext.length, this;
      },
      // When called from action, caches matched text and appends it on next action
      more: function() {
        return this._more = !0, this;
      },
      // When called from action, signals the lexer that this rule fails to match the input, so the next matching rule (regex) should be tested instead.
      reject: function() {
        if (this.options.backtrack_lexer)
          this._backtrack = !0;
        else
          return this.parseError("Lexical error on line " + (this.yylineno + 1) + `. You can only invoke reject() in the lexer when the lexer is of the backtracking persuasion (options.backtrack_lexer = true).
` + this.showPosition(), {
            text: "",
            token: null,
            line: this.yylineno
          });
        return this;
      },
      // retain first n characters of the match
      less: function(c) {
        this.unput(this.match.slice(c));
      },
      // displays already matched input, i.e. for error messages
      pastInput: function() {
        var c = this.matched.substr(0, this.matched.length - this.match.length);
        return (c.length > 20 ? "..." : "") + c.substr(-20).replace(/\n/g, "");
      },
      // displays upcoming input, i.e. for error messages
      upcomingInput: function() {
        var c = this.match;
        return c.length < 20 && (c += this._input.substr(0, 20 - c.length)), (c.substr(0, 20) + (c.length > 20 ? "..." : "")).replace(/\n/g, "");
      },
      // displays the character position where the lexing error occurred, i.e. for error messages
      showPosition: function() {
        var c = this.pastInput(), s = new Array(c.length + 1).join("-");
        return c + this.upcomingInput() + `
` + s + "^";
      },
      // test the lexed token: return FALSE when not a match, otherwise return token
      test_match: function(c, s) {
        var i, h, d;
        if (this.options.backtrack_lexer && (d = {
          yylineno: this.yylineno,
          yylloc: {
            first_line: this.yylloc.first_line,
            last_line: this.last_line,
            first_column: this.yylloc.first_column,
            last_column: this.yylloc.last_column
          },
          yytext: this.yytext,
          match: this.match,
          matches: this.matches,
          matched: this.matched,
          yyleng: this.yyleng,
          offset: this.offset,
          _more: this._more,
          _input: this._input,
          yy: this.yy,
          conditionStack: this.conditionStack.slice(0),
          done: this.done
        }, this.options.ranges && (d.yylloc.range = this.yylloc.range.slice(0))), h = c[0].match(/(?:\r\n?|\n).*/g), h && (this.yylineno += h.length), this.yylloc = {
          first_line: this.yylloc.last_line,
          last_line: this.yylineno + 1,
          first_column: this.yylloc.last_column,
          last_column: h ? h[h.length - 1].length - h[h.length - 1].match(/\r?\n?/)[0].length : this.yylloc.last_column + c[0].length
        }, this.yytext += c[0], this.match += c[0], this.matches = c, this.yyleng = this.yytext.length, this.options.ranges && (this.yylloc.range = [this.offset, this.offset += this.yyleng]), this._more = !1, this._backtrack = !1, this._input = this._input.slice(c[0].length), this.matched += c[0], i = this.performAction.call(this, this.yy, this, s, this.conditionStack[this.conditionStack.length - 1]), this.done && this._input && (this.done = !1), i)
          return i;
        if (this._backtrack) {
          for (var t in d)
            this[t] = d[t];
          return !1;
        }
        return !1;
      },
      // return next match in input
      next: function() {
        if (this.done)
          return this.EOF;
        this._input || (this.done = !0);
        var c, s, i, h;
        this._more || (this.yytext = "", this.match = "");
        for (var d = this._currentRules(), t = 0; t < d.length; t++)
          if (i = this._input.match(this.rules[d[t]]), i && (!s || i[0].length > s[0].length)) {
            if (s = i, h = t, this.options.backtrack_lexer) {
              if (c = this.test_match(i, d[t]), c !== !1)
                return c;
              if (this._backtrack) {
                s = !1;
                continue;
              } else
                return !1;
            } else if (!this.options.flex)
              break;
          }
        return s ? (c = this.test_match(s, d[h]), c !== !1 ? c : !1) : this._input === "" ? this.EOF : this.parseError("Lexical error on line " + (this.yylineno + 1) + `. Unrecognized text.
` + this.showPosition(), {
          text: "",
          token: null,
          line: this.yylineno
        });
      },
      // return next match that has a token
      lex: function() {
        var s = this.next();
        return s || this.lex();
      },
      // activates a new lexer condition state (pushes the new lexer condition state onto the condition stack)
      begin: function(s) {
        this.conditionStack.push(s);
      },
      // pop the previously active lexer condition state off the condition stack
      popState: function() {
        var s = this.conditionStack.length - 1;
        return s > 0 ? this.conditionStack.pop() : this.conditionStack[0];
      },
      // produce the lexer rule set which is active for the currently active lexer condition state
      _currentRules: function() {
        return this.conditionStack.length && this.conditionStack[this.conditionStack.length - 1] ? this.conditions[this.conditionStack[this.conditionStack.length - 1]].rules : this.conditions.INITIAL.rules;
      },
      // return the currently active lexer condition state; when an index argument is provided it produces the N-th previous condition state, if available
      topState: function(s) {
        return s = this.conditionStack.length - 1 - Math.abs(s || 0), s >= 0 ? this.conditionStack[s] : "INITIAL";
      },
      // alias for begin(condition)
      pushState: function(s) {
        this.begin(s);
      },
      // return the number of states currently on the stack
      stateStackSize: function() {
        return this.conditionStack.length;
      },
      options: {},
      performAction: function(s, i, h, d) {
        switch (h) {
          case 0:
            return 10;
          case 1:
            return s.getLogger().debug("Found space-block"), 31;
          case 2:
            return s.getLogger().debug("Found nl-block"), 31;
          case 3:
            return s.getLogger().debug("Found space-block"), 29;
          case 4:
            s.getLogger().debug(".", i.yytext);
            break;
          case 5:
            s.getLogger().debug("_", i.yytext);
            break;
          case 6:
            return 5;
          case 7:
            return i.yytext = -1, 28;
          case 8:
            return i.yytext = i.yytext.replace(/columns\s+/, ""), s.getLogger().debug("COLUMNS (LEX)", i.yytext), 28;
          case 9:
            this.pushState("md_string");
            break;
          case 10:
            return "MD_STR";
          case 11:
            this.popState();
            break;
          case 12:
            this.pushState("string");
            break;
          case 13:
            s.getLogger().debug("LEX: POPPING STR:", i.yytext), this.popState();
            break;
          case 14:
            return s.getLogger().debug("LEX: STR end:", i.yytext), "STR";
          case 15:
            return i.yytext = i.yytext.replace(/space\:/, ""), s.getLogger().debug("SPACE NUM (LEX)", i.yytext), 21;
          case 16:
            return i.yytext = "1", s.getLogger().debug("COLUMNS (LEX)", i.yytext), 21;
          case 17:
            return 43;
          case 18:
            return "LINKSTYLE";
          case 19:
            return "INTERPOLATE";
          case 20:
            return this.pushState("CLASSDEF"), 40;
          case 21:
            return this.popState(), this.pushState("CLASSDEFID"), "DEFAULT_CLASSDEF_ID";
          case 22:
            return this.popState(), this.pushState("CLASSDEFID"), 41;
          case 23:
            return this.popState(), 42;
          case 24:
            return this.pushState("CLASS"), 44;
          case 25:
            return this.popState(), this.pushState("CLASS_STYLE"), 45;
          case 26:
            return this.popState(), 46;
          case 27:
            return this.pushState("STYLE_STMNT"), 47;
          case 28:
            return this.popState(), this.pushState("STYLE_DEFINITION"), 48;
          case 29:
            return this.popState(), 49;
          case 30:
            return this.pushState("acc_title"), "acc_title";
          case 31:
            return this.popState(), "acc_title_value";
          case 32:
            return this.pushState("acc_descr"), "acc_descr";
          case 33:
            return this.popState(), "acc_descr_value";
          case 34:
            this.pushState("acc_descr_multiline");
            break;
          case 35:
            this.popState();
            break;
          case 36:
            return "acc_descr_multiline_value";
          case 37:
            return 30;
          case 38:
            return this.popState(), s.getLogger().debug("Lex: (("), "NODE_DEND";
          case 39:
            return this.popState(), s.getLogger().debug("Lex: (("), "NODE_DEND";
          case 40:
            return this.popState(), s.getLogger().debug("Lex: ))"), "NODE_DEND";
          case 41:
            return this.popState(), s.getLogger().debug("Lex: (("), "NODE_DEND";
          case 42:
            return this.popState(), s.getLogger().debug("Lex: (("), "NODE_DEND";
          case 43:
            return this.popState(), s.getLogger().debug("Lex: (-"), "NODE_DEND";
          case 44:
            return this.popState(), s.getLogger().debug("Lex: -)"), "NODE_DEND";
          case 45:
            return this.popState(), s.getLogger().debug("Lex: (("), "NODE_DEND";
          case 46:
            return this.popState(), s.getLogger().debug("Lex: ]]"), "NODE_DEND";
          case 47:
            return this.popState(), s.getLogger().debug("Lex: ("), "NODE_DEND";
          case 48:
            return this.popState(), s.getLogger().debug("Lex: ])"), "NODE_DEND";
          case 49:
            return this.popState(), s.getLogger().debug("Lex: /]"), "NODE_DEND";
          case 50:
            return this.popState(), s.getLogger().debug("Lex: /]"), "NODE_DEND";
          case 51:
            return this.popState(), s.getLogger().debug("Lex: )]"), "NODE_DEND";
          case 52:
            return this.popState(), s.getLogger().debug("Lex: )"), "NODE_DEND";
          case 53:
            return this.popState(), s.getLogger().debug("Lex: ]>"), "NODE_DEND";
          case 54:
            return this.popState(), s.getLogger().debug("Lex: ]"), "NODE_DEND";
          case 55:
            return s.getLogger().debug("Lexa: -)"), this.pushState("NODE"), 36;
          case 56:
            return s.getLogger().debug("Lexa: (-"), this.pushState("NODE"), 36;
          case 57:
            return s.getLogger().debug("Lexa: ))"), this.pushState("NODE"), 36;
          case 58:
            return s.getLogger().debug("Lexa: )"), this.pushState("NODE"), 36;
          case 59:
            return s.getLogger().debug("Lex: ((("), this.pushState("NODE"), 36;
          case 60:
            return s.getLogger().debug("Lexa: )"), this.pushState("NODE"), 36;
          case 61:
            return s.getLogger().debug("Lexa: )"), this.pushState("NODE"), 36;
          case 62:
            return s.getLogger().debug("Lexa: )"), this.pushState("NODE"), 36;
          case 63:
            return s.getLogger().debug("Lexc: >"), this.pushState("NODE"), 36;
          case 64:
            return s.getLogger().debug("Lexa: (["), this.pushState("NODE"), 36;
          case 65:
            return s.getLogger().debug("Lexa: )"), this.pushState("NODE"), 36;
          case 66:
            return this.pushState("NODE"), 36;
          case 67:
            return this.pushState("NODE"), 36;
          case 68:
            return this.pushState("NODE"), 36;
          case 69:
            return this.pushState("NODE"), 36;
          case 70:
            return this.pushState("NODE"), 36;
          case 71:
            return this.pushState("NODE"), 36;
          case 72:
            return this.pushState("NODE"), 36;
          case 73:
            return s.getLogger().debug("Lexa: ["), this.pushState("NODE"), 36;
          case 74:
            return this.pushState("BLOCK_ARROW"), s.getLogger().debug("LEX ARR START"), 38;
          case 75:
            return s.getLogger().debug("Lex: NODE_ID", i.yytext), 32;
          case 76:
            return s.getLogger().debug("Lex: EOF", i.yytext), 8;
          case 77:
            this.pushState("md_string");
            break;
          case 78:
            this.pushState("md_string");
            break;
          case 79:
            return "NODE_DESCR";
          case 80:
            this.popState();
            break;
          case 81:
            s.getLogger().debug("Lex: Starting string"), this.pushState("string");
            break;
          case 82:
            s.getLogger().debug("LEX ARR: Starting string"), this.pushState("string");
            break;
          case 83:
            return s.getLogger().debug("LEX: NODE_DESCR:", i.yytext), "NODE_DESCR";
          case 84:
            s.getLogger().debug("LEX POPPING"), this.popState();
            break;
          case 85:
            s.getLogger().debug("Lex: =>BAE"), this.pushState("ARROW_DIR");
            break;
          case 86:
            return i.yytext = i.yytext.replace(/^,\s*/, ""), s.getLogger().debug("Lex (right): dir:", i.yytext), "DIR";
          case 87:
            return i.yytext = i.yytext.replace(/^,\s*/, ""), s.getLogger().debug("Lex (left):", i.yytext), "DIR";
          case 88:
            return i.yytext = i.yytext.replace(/^,\s*/, ""), s.getLogger().debug("Lex (x):", i.yytext), "DIR";
          case 89:
            return i.yytext = i.yytext.replace(/^,\s*/, ""), s.getLogger().debug("Lex (y):", i.yytext), "DIR";
          case 90:
            return i.yytext = i.yytext.replace(/^,\s*/, ""), s.getLogger().debug("Lex (up):", i.yytext), "DIR";
          case 91:
            return i.yytext = i.yytext.replace(/^,\s*/, ""), s.getLogger().debug("Lex (down):", i.yytext), "DIR";
          case 92:
            return i.yytext = "]>", s.getLogger().debug("Lex (ARROW_DIR end):", i.yytext), this.popState(), this.popState(), "BLOCK_ARROW_END";
          case 93:
            return s.getLogger().debug("Lex: LINK", "#" + i.yytext + "#"), 15;
          case 94:
            return s.getLogger().debug("Lex: LINK", i.yytext), 15;
          case 95:
            return s.getLogger().debug("Lex: LINK", i.yytext), 15;
          case 96:
            return s.getLogger().debug("Lex: LINK", i.yytext), 15;
          case 97:
            return s.getLogger().debug("Lex: START_LINK", i.yytext), this.pushState("LLABEL"), 16;
          case 98:
            return s.getLogger().debug("Lex: START_LINK", i.yytext), this.pushState("LLABEL"), 16;
          case 99:
            return s.getLogger().debug("Lex: START_LINK", i.yytext), this.pushState("LLABEL"), 16;
          case 100:
            this.pushState("md_string");
            break;
          case 101:
            return s.getLogger().debug("Lex: Starting string"), this.pushState("string"), "LINK_LABEL";
          case 102:
            return this.popState(), s.getLogger().debug("Lex: LINK", "#" + i.yytext + "#"), 15;
          case 103:
            return this.popState(), s.getLogger().debug("Lex: LINK", i.yytext), 15;
          case 104:
            return this.popState(), s.getLogger().debug("Lex: LINK", i.yytext), 15;
          case 105:
            return s.getLogger().debug("Lex: COLON", i.yytext), i.yytext = i.yytext.slice(1), 27;
        }
      },
      rules: [/^(?:block-beta\b)/, /^(?:block\s+)/, /^(?:block\n+)/, /^(?:block:)/, /^(?:[\s]+)/, /^(?:[\n]+)/, /^(?:((\u000D\u000A)|(\u000A)))/, /^(?:columns\s+auto\b)/, /^(?:columns\s+[\d]+)/, /^(?:["][`])/, /^(?:[^`"]+)/, /^(?:[`]["])/, /^(?:["])/, /^(?:["])/, /^(?:[^"]*)/, /^(?:space[:]\d+)/, /^(?:space\b)/, /^(?:default\b)/, /^(?:linkStyle\b)/, /^(?:interpolate\b)/, /^(?:classDef\s+)/, /^(?:DEFAULT\s+)/, /^(?:\w+\s+)/, /^(?:[^\n]*)/, /^(?:class\s+)/, /^(?:(\w+)+((,\s*\w+)*))/, /^(?:[^\n]*)/, /^(?:style\s+)/, /^(?:(\w+)+((,\s*\w+)*))/, /^(?:[^\n]*)/, /^(?:accTitle\s*:\s*)/, /^(?:(?!\n||)*[^\n]*)/, /^(?:accDescr\s*:\s*)/, /^(?:(?!\n||)*[^\n]*)/, /^(?:accDescr\s*\{\s*)/, /^(?:[\}])/, /^(?:[^\}]*)/, /^(?:end\b\s*)/, /^(?:\(\(\()/, /^(?:\)\)\))/, /^(?:[\)]\))/, /^(?:\}\})/, /^(?:\})/, /^(?:\(-)/, /^(?:-\))/, /^(?:\(\()/, /^(?:\]\])/, /^(?:\()/, /^(?:\]\))/, /^(?:\\\])/, /^(?:\/\])/, /^(?:\)\])/, /^(?:[\)])/, /^(?:\]>)/, /^(?:[\]])/, /^(?:-\))/, /^(?:\(-)/, /^(?:\)\))/, /^(?:\))/, /^(?:\(\(\()/, /^(?:\(\()/, /^(?:\{\{)/, /^(?:\{)/, /^(?:>)/, /^(?:\(\[)/, /^(?:\()/, /^(?:\[\[)/, /^(?:\[\|)/, /^(?:\[\()/, /^(?:\)\)\))/, /^(?:\[\\)/, /^(?:\[\/)/, /^(?:\[\\)/, /^(?:\[)/, /^(?:<\[)/, /^(?:[^\(\[\n\-\)\{\}\s\<\>:]+)/, /^(?:$)/, /^(?:["][`])/, /^(?:["][`])/, /^(?:[^`"]+)/, /^(?:[`]["])/, /^(?:["])/, /^(?:["])/, /^(?:[^"]+)/, /^(?:["])/, /^(?:\]>\s*\()/, /^(?:,?\s*right\s*)/, /^(?:,?\s*left\s*)/, /^(?:,?\s*x\s*)/, /^(?:,?\s*y\s*)/, /^(?:,?\s*up\s*)/, /^(?:,?\s*down\s*)/, /^(?:\)\s*)/, /^(?:\s*[xo<]?--+[-xo>]\s*)/, /^(?:\s*[xo<]?==+[=xo>]\s*)/, /^(?:\s*[xo<]?-?\.+-[xo>]?\s*)/, /^(?:\s*~~[\~]+\s*)/, /^(?:\s*[xo<]?--\s*)/, /^(?:\s*[xo<]?==\s*)/, /^(?:\s*[xo<]?-\.\s*)/, /^(?:["][`])/, /^(?:["])/, /^(?:\s*[xo<]?--+[-xo>]\s*)/, /^(?:\s*[xo<]?==+[=xo>]\s*)/, /^(?:\s*[xo<]?-?\.+-[xo>]?\s*)/, /^(?::\d+)/],
      conditions: { STYLE_DEFINITION: { rules: [29], inclusive: !1 }, STYLE_STMNT: { rules: [28], inclusive: !1 }, CLASSDEFID: { rules: [23], inclusive: !1 }, CLASSDEF: { rules: [21, 22], inclusive: !1 }, CLASS_STYLE: { rules: [26], inclusive: !1 }, CLASS: { rules: [25], inclusive: !1 }, LLABEL: { rules: [100, 101, 102, 103, 104], inclusive: !1 }, ARROW_DIR: { rules: [86, 87, 88, 89, 90, 91, 92], inclusive: !1 }, BLOCK_ARROW: { rules: [77, 82, 85], inclusive: !1 }, NODE: { rules: [38, 39, 40, 41, 42, 43, 44, 45, 46, 47, 48, 49, 50, 51, 52, 53, 54, 78, 81], inclusive: !1 }, md_string: { rules: [10, 11, 79, 80], inclusive: !1 }, space: { rules: [], inclusive: !1 }, string: { rules: [13, 14, 83, 84], inclusive: !1 }, acc_descr_multiline: { rules: [35, 36], inclusive: !1 }, acc_descr: { rules: [33], inclusive: !1 }, acc_title: { rules: [31], inclusive: !1 }, INITIAL: { rules: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 12, 15, 16, 17, 18, 19, 20, 24, 27, 30, 32, 34, 37, 55, 56, 57, 58, 59, 60, 61, 62, 63, 64, 65, 66, 67, 68, 69, 70, 71, 72, 73, 74, 75, 76, 93, 94, 95, 96, 97, 98, 99, 105], inclusive: !0 } }
    };
    return D;
  }();
  L.lexer = A;
  function k() {
    this.yy = {};
  }
  return k.prototype = L, L.Parser = k, new k();
}();
ie.parser = ie;
const Xe = ie;
let O = {}, ae = [], X = {};
const pe = "color", fe = "fill", Ge = "bgFill", Se = ",";
let G = {};
const He = function(e, a = "") {
  G[e] === void 0 && (G[e] = { id: e, styles: [], textStyles: [] });
  const l = G[e];
  a != null && a.split(Se).forEach((u) => {
    const n = u.replace(/([^;]*);/, "$1").trim();
    if (u.match(pe)) {
      const o = n.replace(fe, Ge).replace(pe, fe);
      l.textStyles.push(o);
    }
    l.styles.push(n);
  });
}, qe = function(e, a = "") {
  const l = O[e];
  a != null && (l.styles = a.split(Se));
}, Ze = function(e, a) {
  e.split(",").forEach(function(l) {
    let u = O[l];
    if (u === void 0) {
      const n = l.trim();
      O[n] = { id: n, type: "na", children: [] }, u = O[n];
    }
    u.classes || (u.classes = []), u.classes.push(a);
  });
}, Le = (e, a) => {
  const l = e.flat(), u = [];
  for (const n of l) {
    if (n.type === "classDef") {
      He(n.id, n.css);
      continue;
    }
    if (n.type === "applyClass") {
      Ze(n.id, (n == null ? void 0 : n.styleClass) || "");
      continue;
    }
    if (n.type === "applyStyles") {
      n != null && n.stylesStr && qe(n.id, n == null ? void 0 : n.stylesStr);
      continue;
    }
    if (n.type === "column-setting")
      a.columns = n.columns || -1;
    else if (n.type === "edge")
      X[n.id] ? X[n.id]++ : X[n.id] = 1, n.id = X[n.id] + "-" + n.id, ae.push(n);
    else {
      n.label || (n.type === "composite" ? n.label = "" : n.label = n.id);
      const p = !O[n.id];
      if (p ? O[n.id] = n : (n.type !== "na" && (O[n.id].type = n.type), n.label !== n.id && (O[n.id].label = n.label)), n.children && Le(n.children, n), n.type === "space") {
        const o = n.width || 1;
        for (let b = 0; b < o; b++) {
          const f = Be(n);
          f.id = f.id + "-" + b, O[f.id] = f, u.push(f);
        }
      } else
        p && u.push(n);
    }
  }
  a.children = u;
};
let le = [], H = { id: "root", type: "composite", children: [], columns: -1 };
const Je = () => {
  S.debug("Clear called"), Ce(), H = { id: "root", type: "composite", children: [], columns: -1 }, O = { root: H }, le = [], G = {}, ae = [], X = {};
};
function Qe(e) {
  switch (S.debug("typeStr2Type", e), e) {
    case "[]":
      return "square";
    case "()":
      return S.debug("we have a round"), "round";
    case "(())":
      return "circle";
    case ">]":
      return "rect_left_inv_arrow";
    case "{}":
      return "diamond";
    case "{{}}":
      return "hexagon";
    case "([])":
      return "stadium";
    case "[[]]":
      return "subroutine";
    case "[()]":
      return "cylinder";
    case "((()))":
      return "doublecircle";
    case "[//]":
      return "lean_right";
    case "[\\\\]":
      return "lean_left";
    case "[/\\]":
      return "trapezoid";
    case "[\\/]":
      return "inv_trapezoid";
    case "<[]>":
      return "block_arrow";
    default:
      return "na";
  }
}
function $e(e) {
  switch (S.debug("typeStr2Type", e), e) {
    case "==":
      return "thick";
    default:
      return "normal";
  }
}
function et(e) {
  switch (e.trim()) {
    case "--x":
      return "arrow_cross";
    case "--o":
      return "arrow_circle";
    default:
      return "arrow_point";
  }
}
let be = 0;
const tt = () => (be++, "id-" + Math.random().toString(36).substr(2, 12) + "-" + be), st = (e) => {
  H.children = e, Le(e, H), le = H.children;
}, it = (e) => {
  const a = O[e];
  return a ? a.columns ? a.columns : a.children ? a.children.length : -1 : -1;
}, rt = () => [...Object.values(O)], nt = () => le || [], at = () => ae, lt = (e) => O[e], ot = (e) => {
  O[e.id] = e;
}, ct = () => console, ut = function() {
  return G;
}, ht = {
  getConfig: () => ne().block,
  typeStr2Type: Qe,
  edgeTypeStr2Type: $e,
  edgeStrToEdgeData: et,
  getLogger: ct,
  getBlocksFlat: rt,
  getBlocks: nt,
  getEdges: at,
  setHierarchy: st,
  getBlock: lt,
  setBlock: ot,
  getColumns: it,
  getClasses: ut,
  clear: Je,
  generateId: tt
}, dt = ht, Q = (e, a) => {
  const l = Ue, u = l(e, "r"), n = l(e, "g"), p = l(e, "b");
  return Ae(u, n, p, a);
}, gt = (e) => `.label {
    font-family: ${e.fontFamily};
    color: ${e.nodeTextColor || e.textColor};
  }
  .cluster-label text {
    fill: ${e.titleColor};
  }
  .cluster-label span,p {
    color: ${e.titleColor};
  }



  .label text,span,p {
    fill: ${e.nodeTextColor || e.textColor};
    color: ${e.nodeTextColor || e.textColor};
  }

  .node rect,
  .node circle,
  .node ellipse,
  .node polygon,
  .node path {
    fill: ${e.mainBkg};
    stroke: ${e.nodeBorder};
    stroke-width: 1px;
  }
  .flowchart-label text {
    text-anchor: middle;
  }
  // .flowchart-label .text-outer-tspan {
  //   text-anchor: middle;
  // }
  // .flowchart-label .text-inner-tspan {
  //   text-anchor: start;
  // }

  .node .label {
    text-align: center;
  }
  .node.clickable {
    cursor: pointer;
  }

  .arrowheadPath {
    fill: ${e.arrowheadColor};
  }

  .edgePath .path {
    stroke: ${e.lineColor};
    stroke-width: 2.0px;
  }

  .flowchart-link {
    stroke: ${e.lineColor};
    fill: none;
  }

  .edgeLabel {
    background-color: ${e.edgeLabelBackground};
    rect {
      opacity: 0.5;
      background-color: ${e.edgeLabelBackground};
      fill: ${e.edgeLabelBackground};
    }
    text-align: center;
  }

  /* For html labels only */
  .labelBkg {
    background-color: ${Q(e.edgeLabelBackground, 0.5)};
    // background-color:
  }

  .node .cluster {
    // fill: ${Q(e.mainBkg, 0.5)};
    fill: ${Q(e.clusterBkg, 0.5)};
    stroke: ${Q(e.clusterBorder, 0.2)};
    box-shadow: rgba(50, 50, 93, 0.25) 0px 13px 27px -5px, rgba(0, 0, 0, 0.3) 0px 8px 16px -8px;
    stroke-width: 1px;
  }

  .cluster text {
    fill: ${e.titleColor};
  }

  .cluster span,p {
    color: ${e.titleColor};
  }
  /* .cluster div {
    color: ${e.titleColor};
  } */

  div.mermaidTooltip {
    position: absolute;
    text-align: center;
    max-width: 200px;
    padding: 2px;
    font-family: ${e.fontFamily};
    font-size: 12px;
    background: ${e.tertiaryColor};
    border: 1px solid ${e.border2};
    border-radius: 2px;
    pointer-events: none;
    z-index: 100;
  }

  .flowchartTitleText {
    text-anchor: middle;
    font-size: 18px;
    fill: ${e.textColor};
  }
`, pt = gt;
function me(e, a, l = !1) {
  var u, n, p;
  const o = e;
  let b = "default";
  (((u = o == null ? void 0 : o.classes) == null ? void 0 : u.length) || 0) > 0 && (b = ((o == null ? void 0 : o.classes) || []).join(" ")), b = b + " flowchart-label";
  let f = 0, g = "", x;
  switch (o.type) {
    case "round":
      f = 5, g = "rect";
      break;
    case "composite":
      f = 0, g = "composite", x = 0;
      break;
    case "square":
      g = "rect";
      break;
    case "diamond":
      g = "question";
      break;
    case "hexagon":
      g = "hexagon";
      break;
    case "block_arrow":
      g = "block_arrow";
      break;
    case "odd":
      g = "rect_left_inv_arrow";
      break;
    case "lean_right":
      g = "lean_right";
      break;
    case "lean_left":
      g = "lean_left";
      break;
    case "trapezoid":
      g = "trapezoid";
      break;
    case "inv_trapezoid":
      g = "inv_trapezoid";
      break;
    case "rect_left_inv_arrow":
      g = "rect_left_inv_arrow";
      break;
    case "circle":
      g = "circle";
      break;
    case "ellipse":
      g = "ellipse";
      break;
    case "stadium":
      g = "stadium";
      break;
    case "subroutine":
      g = "subroutine";
      break;
    case "cylinder":
      g = "cylinder";
      break;
    case "group":
      g = "rect";
      break;
    case "doublecircle":
      g = "doublecircle";
      break;
    default:
      g = "rect";
  }
  const E = Re((o == null ? void 0 : o.styles) || []), T = o.label, v = o.size || { width: 0, height: 0, x: 0, y: 0 };
  return {
    labelStyle: E.labelStyle,
    shape: g,
    labelText: T,
    rx: f,
    ry: f,
    class: b,
    style: E.style,
    id: o.id,
    directions: o.directions,
    width: v.width,
    height: v.height,
    x: v.x,
    y: v.y,
    positioned: l,
    intersect: void 0,
    type: o.type,
    padding: x != null ? x : ((p = (n = ne()) == null ? void 0 : n.block) == null ? void 0 : p.padding) || 0
  };
}
function ft(e, a, l) {
  return K(this, null, function* () {
    const u = me(a, l, !1);
    if (u.type === "group")
      return;
    const n = yield xe(e, u), p = n.node().getBBox(), o = l.getBlock(u.id);
    o.size = { width: p.width, height: p.height, x: 0, y: 0, node: n }, l.setBlock(o), n.remove();
  });
}
function bt(e, a, l) {
  return K(this, null, function* () {
    const u = me(a, l, !0);
    l.getBlock(u.id).type !== "space" && (yield xe(e, u), a.intersect = u == null ? void 0 : u.intersect, Ye(u));
  });
}
function oe(e, a, l, u) {
  return K(this, null, function* () {
    for (const n of a)
      yield u(e, n, l), n.children && (yield oe(e, n.children, l, u));
  });
}
function xt(e, a, l) {
  return K(this, null, function* () {
    yield oe(e, a, l, ft);
  });
}
function St(e, a, l) {
  return K(this, null, function* () {
    yield oe(e, a, l, bt);
  });
}
function Lt(e, a, l, u, n) {
  return K(this, null, function* () {
    const p = new We({
      multigraph: !0,
      compound: !0
    });
    p.setGraph({
      rankdir: "TB",
      nodesep: 10,
      ranksep: 10,
      marginx: 8,
      marginy: 8
    });
    for (const o of l)
      o.size && p.setNode(o.id, {
        width: o.size.width,
        height: o.size.height,
        intersect: o.intersect
      });
    for (const o of a)
      if (o.start && o.end) {
        const b = u.getBlock(o.start), f = u.getBlock(o.end);
        if (b != null && b.size && (f != null && f.size)) {
          const g = b.size, x = f.size, E = [
            { x: g.x, y: g.y },
            { x: g.x + (x.x - g.x) / 2, y: g.y + (x.y - g.y) / 2 },
            { x: x.x, y: x.y }
          ];
          yield Fe(
            e,
            { v: o.start, w: o.end, name: o.id },
            U(j({}, o), {
              arrowTypeEnd: o.arrowTypeEnd,
              arrowTypeStart: o.arrowTypeStart,
              points: E,
              classes: "edge-thickness-normal edge-pattern-solid flowchart-link LS-a1 LE-b1"
            }),
            void 0,
            "block",
            p,
            n
          ), o.label && (yield Ke(e, U(j({}, o), {
            label: o.label,
            labelStyle: "stroke: #333; stroke-width: 1.5px;fill:none;",
            arrowTypeEnd: o.arrowTypeEnd,
            arrowTypeStart: o.arrowTypeStart,
            points: E,
            classes: "edge-thickness-normal edge-pattern-solid flowchart-link LS-a1 LE-b1"
          })), yield Me(
            U(j({}, o), { x: E[1].x, y: E[1].y }),
            {
              originalPath: E
            }
          ));
        }
      }
  });
}
const _ = ((ge = (de = Te()) == null ? void 0 : de.block) == null ? void 0 : ge.padding) || 8;
function mt(e, a) {
  if (e === 0 || !Number.isInteger(e))
    throw new Error("Columns must be an integer !== 0.");
  if (a < 0 || !Number.isInteger(a))
    throw new Error("Position must be a non-negative integer." + a);
  if (e < 0)
    return { px: a, py: 0 };
  if (e === 1)
    return { px: 0, py: a };
  const l = a % e, u = Math.floor(a / e);
  return { px: l, py: u };
}
const _t = (e) => {
  let a = 0, l = 0;
  for (const u of e.children) {
    const { width: n, height: p, x: o, y: b } = u.size || { width: 0, height: 0, x: 0, y: 0 };
    S.debug(
      "getMaxChildSize abc95 child:",
      u.id,
      "width:",
      n,
      "height:",
      p,
      "x:",
      o,
      "y:",
      b,
      u.type
    ), u.type !== "space" && (n > a && (a = n / (e.widthInColumns || 1)), p > l && (l = p));
  }
  return { width: a, height: l };
};
function re(e, a, l = 0, u = 0) {
  var n, p, o, b, f, g, x, E, T, v, N;
  S.debug(
    "setBlockSizes abc95 (start)",
    e.id,
    (n = e == null ? void 0 : e.size) == null ? void 0 : n.x,
    "block width =",
    e == null ? void 0 : e.size,
    "sieblingWidth",
    l
  ), (p = e == null ? void 0 : e.size) != null && p.width || (e.size = {
    width: l,
    height: u,
    x: 0,
    y: 0
  });
  let y = 0, L = 0;
  if (((o = e.children) == null ? void 0 : o.length) > 0) {
    for (const d of e.children)
      re(d, a);
    const A = _t(e);
    y = A.width, L = A.height, S.debug("setBlockSizes abc95 maxWidth of", e.id, ":s children is ", y, L);
    for (const d of e.children)
      d.size && (S.debug(
        `abc95 Setting size of children of ${e.id} id=${d.id} ${y} ${L} ${d.size}`
      ), d.size.width = y * (d.widthInColumns || 1) + _ * ((d.widthInColumns || 1) - 1), d.size.height = L, d.size.x = 0, d.size.y = 0, S.debug(
        `abc95 updating size of ${e.id} children child:${d.id} maxWidth:${y} maxHeight:${L}`
      ));
    for (const d of e.children)
      re(d, a, y, L);
    const k = e.columns || -1;
    let D = 0;
    for (const d of e.children)
      D += d.widthInColumns || 1;
    let c = e.children.length;
    k > 0 && k < D && (c = k), e.widthInColumns;
    const s = Math.ceil(D / c);
    let i = c * (y + _) + _, h = s * (L + _) + _;
    if (i < l) {
      S.debug(
        `Detected to small siebling: abc95 ${e.id} sieblingWidth ${l} sieblingHeight ${u} width ${i}`
      ), i = l, h = u;
      const d = (l - c * _ - _) / c, t = (u - s * _ - _) / s;
      S.debug("Size indata abc88", e.id, "childWidth", d, "maxWidth", y), S.debug("Size indata abc88", e.id, "childHeight", t, "maxHeight", L), S.debug("Size indata abc88 xSize", c, "padding", _);
      for (const m of e.children)
        m.size && (m.size.width = d, m.size.height = t, m.size.x = 0, m.size.y = 0);
    }
    if (S.debug(
      `abc95 (finale calc) ${e.id} xSize ${c} ySize ${s} columns ${k}${e.children.length} width=${Math.max(i, ((b = e.size) == null ? void 0 : b.width) || 0)}`
    ), i < (((f = e == null ? void 0 : e.size) == null ? void 0 : f.width) || 0)) {
      i = ((g = e == null ? void 0 : e.size) == null ? void 0 : g.width) || 0;
      const d = k > 0 ? Math.min(e.children.length, k) : e.children.length;
      if (d > 0) {
        const t = (i - d * _ - _) / d;
        S.debug("abc95 (growing to fit) width", e.id, i, (x = e.size) == null ? void 0 : x.width, t);
        for (const m of e.children)
          m.size && (m.size.width = t);
      }
    }
    e.size = {
      width: i,
      height: h,
      x: 0,
      y: 0
    };
  }
  S.debug(
    "setBlockSizes abc94 (done)",
    e.id,
    (E = e == null ? void 0 : e.size) == null ? void 0 : E.x,
    (T = e == null ? void 0 : e.size) == null ? void 0 : T.width,
    (v = e == null ? void 0 : e.size) == null ? void 0 : v.y,
    (N = e == null ? void 0 : e.size) == null ? void 0 : N.height
  );
}
function _e(e, a) {
  var l, u, n, p, o, b, f, g, x, E, T, v, N, y, L, A, k;
  S.debug(
    `abc85 layout blocks (=>layoutBlocks) ${e.id} x: ${(l = e == null ? void 0 : e.size) == null ? void 0 : l.x} y: ${(u = e == null ? void 0 : e.size) == null ? void 0 : u.y} width: ${(n = e == null ? void 0 : e.size) == null ? void 0 : n.width}`
  );
  const D = e.columns || -1;
  if (S.debug("layoutBlocks columns abc95", e.id, "=>", D, e), e.children && // find max width of children
  e.children.length > 0) {
    const c = ((o = (p = e == null ? void 0 : e.children[0]) == null ? void 0 : p.size) == null ? void 0 : o.width) || 0, s = e.children.length * c + (e.children.length - 1) * _;
    S.debug("widthOfChildren 88", s, "posX");
    let i = 0;
    S.debug("abc91 block?.size?.x", e.id, (b = e == null ? void 0 : e.size) == null ? void 0 : b.x);
    let h = (f = e == null ? void 0 : e.size) != null && f.x ? ((g = e == null ? void 0 : e.size) == null ? void 0 : g.x) + (-((x = e == null ? void 0 : e.size) == null ? void 0 : x.width) / 2 || 0) : -_, d = 0;
    for (const t of e.children) {
      const m = e;
      if (!t.size)
        continue;
      const { width: r, height: R } = t.size, { px: W, py: F } = mt(D, i);
      if (F != d && (d = F, h = (E = e == null ? void 0 : e.size) != null && E.x ? ((T = e == null ? void 0 : e.size) == null ? void 0 : T.x) + (-((v = e == null ? void 0 : e.size) == null ? void 0 : v.width) / 2 || 0) : -_, S.debug("New row in layout for block", e.id, " and child ", t.id, d)), S.debug(
        `abc89 layout blocks (child) id: ${t.id} Pos: ${i} (px, py) ${W},${F} (${(N = m == null ? void 0 : m.size) == null ? void 0 : N.x},${(y = m == null ? void 0 : m.size) == null ? void 0 : y.y}) parent: ${m.id} width: ${r}${_}`
      ), m.size) {
        const C = r / 2;
        t.size.x = h + _ + C, S.debug(
          `abc91 layout blocks (calc) px, pyid:${t.id} startingPos=X${h} new startingPosX${t.size.x} ${C} padding=${_} width=${r} halfWidth=${C} => x:${t.size.x} y:${t.size.y} ${t.widthInColumns} (width * (child?.w || 1)) / 2 ${r * ((t == null ? void 0 : t.widthInColumns) || 1) / 2}`
        ), h = t.size.x + C, t.size.y = m.size.y - m.size.height / 2 + F * (R + _) + R / 2 + _, S.debug(
          `abc88 layout blocks (calc) px, pyid:${t.id}startingPosX${h}${_}${C}=>x:${t.size.x}y:${t.size.y}${t.widthInColumns}(width * (child?.w || 1)) / 2${r * ((t == null ? void 0 : t.widthInColumns) || 1) / 2}`
        );
      }
      t.children && _e(t), i += (t == null ? void 0 : t.widthInColumns) || 1, S.debug("abc88 columnsPos", t, i);
    }
  }
  S.debug(
    `layout blocks (<==layoutBlocks) ${e.id} x: ${(L = e == null ? void 0 : e.size) == null ? void 0 : L.x} y: ${(A = e == null ? void 0 : e.size) == null ? void 0 : A.y} width: ${(k = e == null ? void 0 : e.size) == null ? void 0 : k.width}`
  );
}
function Ee(e, { minX: a, minY: l, maxX: u, maxY: n } = { minX: 0, minY: 0, maxX: 0, maxY: 0 }) {
  if (e.size && e.id !== "root") {
    const { x: p, y: o, width: b, height: f } = e.size;
    p - b / 2 < a && (a = p - b / 2), o - f / 2 < l && (l = o - f / 2), p + b / 2 > u && (u = p + b / 2), o + f / 2 > n && (n = o + f / 2);
  }
  if (e.children)
    for (const p of e.children)
      ({ minX: a, minY: l, maxX: u, maxY: n } = Ee(p, { minX: a, minY: l, maxX: u, maxY: n }));
  return { minX: a, minY: l, maxX: u, maxY: n };
}
function Et(e) {
  const a = e.getBlock("root");
  if (!a)
    return;
  re(a, e, 0, 0), _e(a), S.debug("getBlocks", JSON.stringify(a, null, 2));
  const { minX: l, minY: u, maxX: n, maxY: p } = Ee(a), o = p - u, b = n - l;
  return { x: l, y: u, width: b, height: o };
}
const yt = function(e, a) {
  return a.db.getClasses();
}, wt = function(e, a, l, u) {
  return K(this, null, function* () {
    const { securityLevel: n, block: p } = ne(), o = u.db;
    let b;
    n === "sandbox" && (b = J("#i" + a));
    const f = n === "sandbox" ? J(b.nodes()[0].contentDocument.body) : J("body"), g = n === "sandbox" ? f.select(`[id="${a}"]`) : J(`[id="${a}"]`);
    Pe(g, ["point", "circle", "cross"], u.type, a);
    const E = o.getBlocks(), T = o.getBlocksFlat(), v = o.getEdges(), N = g.insert("g").attr("class", "block");
    yield xt(N, E, o);
    const y = Et(o);
    if (yield St(N, E, o), yield Lt(N, v, T, o, a), y) {
      const L = y, A = Math.max(1, Math.round(0.125 * (L.width / L.height))), k = L.height + A + 10, D = L.width + 10, { useMaxWidth: c } = p;
      ze(g, k, D, !!c), S.debug("Here Bounds", y, L), g.attr(
        "viewBox",
        `${L.x - 5} ${L.y - 5} ${L.width + 10} ${L.height + 10}`
      );
    }
    Ve(je);
  });
}, Dt = {
  draw: wt,
  getClasses: yt
}, Kt = {
  parser: Xe,
  db: dt,
  renderer: Dt,
  styles: pt
};
export {
  Kt as diagram
};
