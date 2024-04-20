var zt = Object.defineProperty;
var bt = Object.getOwnPropertySymbols;
var Et = Object.prototype.hasOwnProperty, Dt = Object.prototype.propertyIsEnumerable;
var At = (e, a, r) => a in e ? zt(e, a, { enumerable: !0, configurable: !0, writable: !0, value: r }) : e[a] = r, tt = (e, a) => {
  for (var r in a || (a = {}))
    Et.call(a, r) && At(e, r, a[r]);
  if (bt)
    for (var r of bt(a))
      Dt.call(a, r) && At(e, r, a[r]);
  return e;
};
import { Z as It, e as qt, W as D, l as ht, s as Bt, a as wt, F as Rt, G as kt, b as Vt, d as Wt, H as Nt, j as pt, k as Ut, f as Qt } from "./08856db2.js";
import { l as St } from "./f9d0127a.js";
import "./f9637058.js";
var yt = function() {
  var e = function(K, s, l, o) {
    for (l = l || {}, o = K.length; o--; l[K[o]] = s)
      ;
    return l;
  }, a = [1, 3], r = [1, 4], x = [1, 5], f = [1, 6], d = [1, 7], c = [1, 5, 13, 15, 17, 19, 20, 25, 27, 28, 29, 30, 31, 32, 33, 34, 37, 38, 40, 41, 42, 43, 44, 45, 46, 47, 48, 49, 50], g = [1, 5, 6, 13, 15, 17, 19, 20, 25, 27, 28, 29, 30, 31, 32, 33, 34, 37, 38, 40, 41, 42, 43, 44, 45, 46, 47, 48, 49, 50], i = [32, 33, 34], y = [2, 7], p = [1, 13], B = [1, 17], N = [1, 18], V = [1, 19], I = [1, 20], b = [1, 21], M = [1, 22], X = [1, 23], C = [1, 24], at = [1, 25], nt = [1, 26], st = [1, 27], U = [1, 30], Q = [1, 31], T = [1, 32], m = [1, 33], _ = [1, 34], t = [1, 35], A = [1, 36], S = [1, 37], k = [1, 38], F = [1, 39], P = [1, 40], v = [1, 41], L = [1, 42], O = [1, 57], Y = [1, 58], z = [5, 22, 26, 32, 33, 34, 40, 41, 42, 43, 44, 45, 46, 47, 48, 49, 50, 51], ct = {
    trace: function() {
    },
    yy: {},
    symbols_: { error: 2, start: 3, eol: 4, SPACE: 5, QUADRANT: 6, document: 7, line: 8, statement: 9, axisDetails: 10, quadrantDetails: 11, points: 12, title: 13, title_value: 14, acc_title: 15, acc_title_value: 16, acc_descr: 17, acc_descr_value: 18, acc_descr_multiline_value: 19, section: 20, text: 21, point_start: 22, point_x: 23, point_y: 24, "X-AXIS": 25, "AXIS-TEXT-DELIMITER": 26, "Y-AXIS": 27, QUADRANT_1: 28, QUADRANT_2: 29, QUADRANT_3: 30, QUADRANT_4: 31, NEWLINE: 32, SEMI: 33, EOF: 34, alphaNumToken: 35, textNoTagsToken: 36, STR: 37, MD_STR: 38, alphaNum: 39, PUNCTUATION: 40, AMP: 41, NUM: 42, ALPHA: 43, COMMA: 44, PLUS: 45, EQUALS: 46, MULT: 47, DOT: 48, BRKT: 49, UNDERSCORE: 50, MINUS: 51, $accept: 0, $end: 1 },
    terminals_: { 2: "error", 5: "SPACE", 6: "QUADRANT", 13: "title", 14: "title_value", 15: "acc_title", 16: "acc_title_value", 17: "acc_descr", 18: "acc_descr_value", 19: "acc_descr_multiline_value", 20: "section", 22: "point_start", 23: "point_x", 24: "point_y", 25: "X-AXIS", 26: "AXIS-TEXT-DELIMITER", 27: "Y-AXIS", 28: "QUADRANT_1", 29: "QUADRANT_2", 30: "QUADRANT_3", 31: "QUADRANT_4", 32: "NEWLINE", 33: "SEMI", 34: "EOF", 37: "STR", 38: "MD_STR", 40: "PUNCTUATION", 41: "AMP", 42: "NUM", 43: "ALPHA", 44: "COMMA", 45: "PLUS", 46: "EQUALS", 47: "MULT", 48: "DOT", 49: "BRKT", 50: "UNDERSCORE", 51: "MINUS" },
    productions_: [0, [3, 2], [3, 2], [3, 2], [7, 0], [7, 2], [8, 2], [9, 0], [9, 2], [9, 1], [9, 1], [9, 1], [9, 2], [9, 2], [9, 2], [9, 1], [9, 1], [12, 4], [10, 4], [10, 3], [10, 2], [10, 4], [10, 3], [10, 2], [11, 2], [11, 2], [11, 2], [11, 2], [4, 1], [4, 1], [4, 1], [21, 1], [21, 2], [21, 1], [21, 1], [39, 1], [39, 2], [35, 1], [35, 1], [35, 1], [35, 1], [35, 1], [35, 1], [35, 1], [35, 1], [35, 1], [35, 1], [35, 1], [36, 1], [36, 1], [36, 1]],
    performAction: function(s, l, o, h, q, n, it) {
      var u = n.length - 1;
      switch (q) {
        case 12:
          this.$ = n[u].trim(), h.setDiagramTitle(this.$);
          break;
        case 13:
          this.$ = n[u].trim(), h.setAccTitle(this.$);
          break;
        case 14:
        case 15:
          this.$ = n[u].trim(), h.setAccDescription(this.$);
          break;
        case 16:
          h.addSection(n[u].substr(8)), this.$ = n[u].substr(8);
          break;
        case 17:
          h.addPoint(n[u - 3], n[u - 1], n[u]);
          break;
        case 18:
          h.setXAxisLeftText(n[u - 2]), h.setXAxisRightText(n[u]);
          break;
        case 19:
          n[u - 1].text += " ⟶ ", h.setXAxisLeftText(n[u - 1]);
          break;
        case 20:
          h.setXAxisLeftText(n[u]);
          break;
        case 21:
          h.setYAxisBottomText(n[u - 2]), h.setYAxisTopText(n[u]);
          break;
        case 22:
          n[u - 1].text += " ⟶ ", h.setYAxisBottomText(n[u - 1]);
          break;
        case 23:
          h.setYAxisBottomText(n[u]);
          break;
        case 24:
          h.setQuadrant1Text(n[u]);
          break;
        case 25:
          h.setQuadrant2Text(n[u]);
          break;
        case 26:
          h.setQuadrant3Text(n[u]);
          break;
        case 27:
          h.setQuadrant4Text(n[u]);
          break;
        case 31:
          this.$ = { text: n[u], type: "text" };
          break;
        case 32:
          this.$ = { text: n[u - 1].text + "" + n[u], type: n[u - 1].type };
          break;
        case 33:
          this.$ = { text: n[u], type: "text" };
          break;
        case 34:
          this.$ = { text: n[u], type: "markdown" };
          break;
        case 35:
          this.$ = n[u];
          break;
        case 36:
          this.$ = n[u - 1] + "" + n[u];
          break;
      }
    },
    table: [{ 3: 1, 4: 2, 5: a, 6: r, 32: x, 33: f, 34: d }, { 1: [3] }, { 3: 8, 4: 2, 5: a, 6: r, 32: x, 33: f, 34: d }, { 3: 9, 4: 2, 5: a, 6: r, 32: x, 33: f, 34: d }, e(c, [2, 4], { 7: 10 }), e(g, [2, 28]), e(g, [2, 29]), e(g, [2, 30]), { 1: [2, 1] }, { 1: [2, 2] }, e(i, y, { 8: 11, 9: 12, 10: 14, 11: 15, 12: 16, 21: 28, 35: 29, 1: [2, 3], 5: p, 13: B, 15: N, 17: V, 19: I, 20: b, 25: M, 27: X, 28: C, 29: at, 30: nt, 31: st, 37: U, 38: Q, 40: T, 41: m, 42: _, 43: t, 44: A, 45: S, 46: k, 47: F, 48: P, 49: v, 50: L }), e(c, [2, 5]), { 4: 43, 32: x, 33: f, 34: d }, e(i, y, { 10: 14, 11: 15, 12: 16, 21: 28, 35: 29, 9: 44, 5: p, 13: B, 15: N, 17: V, 19: I, 20: b, 25: M, 27: X, 28: C, 29: at, 30: nt, 31: st, 37: U, 38: Q, 40: T, 41: m, 42: _, 43: t, 44: A, 45: S, 46: k, 47: F, 48: P, 49: v, 50: L }), e(i, [2, 9]), e(i, [2, 10]), e(i, [2, 11]), { 14: [1, 45] }, { 16: [1, 46] }, { 18: [1, 47] }, e(i, [2, 15]), e(i, [2, 16]), { 21: 48, 35: 29, 37: U, 38: Q, 40: T, 41: m, 42: _, 43: t, 44: A, 45: S, 46: k, 47: F, 48: P, 49: v, 50: L }, { 21: 49, 35: 29, 37: U, 38: Q, 40: T, 41: m, 42: _, 43: t, 44: A, 45: S, 46: k, 47: F, 48: P, 49: v, 50: L }, { 21: 50, 35: 29, 37: U, 38: Q, 40: T, 41: m, 42: _, 43: t, 44: A, 45: S, 46: k, 47: F, 48: P, 49: v, 50: L }, { 21: 51, 35: 29, 37: U, 38: Q, 40: T, 41: m, 42: _, 43: t, 44: A, 45: S, 46: k, 47: F, 48: P, 49: v, 50: L }, { 21: 52, 35: 29, 37: U, 38: Q, 40: T, 41: m, 42: _, 43: t, 44: A, 45: S, 46: k, 47: F, 48: P, 49: v, 50: L }, { 21: 53, 35: 29, 37: U, 38: Q, 40: T, 41: m, 42: _, 43: t, 44: A, 45: S, 46: k, 47: F, 48: P, 49: v, 50: L }, { 5: O, 22: [1, 54], 35: 56, 36: 55, 40: T, 41: m, 42: _, 43: t, 44: A, 45: S, 46: k, 47: F, 48: P, 49: v, 50: L, 51: Y }, e(z, [2, 31]), e(z, [2, 33]), e(z, [2, 34]), e(z, [2, 37]), e(z, [2, 38]), e(z, [2, 39]), e(z, [2, 40]), e(z, [2, 41]), e(z, [2, 42]), e(z, [2, 43]), e(z, [2, 44]), e(z, [2, 45]), e(z, [2, 46]), e(z, [2, 47]), e(c, [2, 6]), e(i, [2, 8]), e(i, [2, 12]), e(i, [2, 13]), e(i, [2, 14]), e(i, [2, 20], { 36: 55, 35: 56, 5: O, 26: [1, 59], 40: T, 41: m, 42: _, 43: t, 44: A, 45: S, 46: k, 47: F, 48: P, 49: v, 50: L, 51: Y }), e(i, [2, 23], { 36: 55, 35: 56, 5: O, 26: [1, 60], 40: T, 41: m, 42: _, 43: t, 44: A, 45: S, 46: k, 47: F, 48: P, 49: v, 50: L, 51: Y }), e(i, [2, 24], { 36: 55, 35: 56, 5: O, 40: T, 41: m, 42: _, 43: t, 44: A, 45: S, 46: k, 47: F, 48: P, 49: v, 50: L, 51: Y }), e(i, [2, 25], { 36: 55, 35: 56, 5: O, 40: T, 41: m, 42: _, 43: t, 44: A, 45: S, 46: k, 47: F, 48: P, 49: v, 50: L, 51: Y }), e(i, [2, 26], { 36: 55, 35: 56, 5: O, 40: T, 41: m, 42: _, 43: t, 44: A, 45: S, 46: k, 47: F, 48: P, 49: v, 50: L, 51: Y }), e(i, [2, 27], { 36: 55, 35: 56, 5: O, 40: T, 41: m, 42: _, 43: t, 44: A, 45: S, 46: k, 47: F, 48: P, 49: v, 50: L, 51: Y }), { 23: [1, 61] }, e(z, [2, 32]), e(z, [2, 48]), e(z, [2, 49]), e(z, [2, 50]), e(i, [2, 19], { 35: 29, 21: 62, 37: U, 38: Q, 40: T, 41: m, 42: _, 43: t, 44: A, 45: S, 46: k, 47: F, 48: P, 49: v, 50: L }), e(i, [2, 22], { 35: 29, 21: 63, 37: U, 38: Q, 40: T, 41: m, 42: _, 43: t, 44: A, 45: S, 46: k, 47: F, 48: P, 49: v, 50: L }), { 24: [1, 64] }, e(i, [2, 18], { 36: 55, 35: 56, 5: O, 40: T, 41: m, 42: _, 43: t, 44: A, 45: S, 46: k, 47: F, 48: P, 49: v, 50: L, 51: Y }), e(i, [2, 21], { 36: 55, 35: 56, 5: O, 40: T, 41: m, 42: _, 43: t, 44: A, 45: S, 46: k, 47: F, 48: P, 49: v, 50: L, 51: Y }), e(i, [2, 17])],
    defaultActions: { 8: [2, 1], 9: [2, 2] },
    parseError: function(s, l) {
      if (l.recoverable)
        this.trace(s);
      else {
        var o = new Error(s);
        throw o.hash = l, o;
      }
    },
    parse: function(s) {
      var l = this, o = [0], h = [], q = [null], n = [], it = this.table, u = "", rt = 0, Tt = 0, Pt = 2, _t = 1, vt = n.slice.call(arguments, 1), E = Object.create(this.lexer), Z = { yy: {} };
      for (var ut in this.yy)
        Object.prototype.hasOwnProperty.call(this.yy, ut) && (Z.yy[ut] = this.yy[ut]);
      E.setInput(s, Z.yy), Z.yy.lexer = E, Z.yy.parser = this, typeof E.yylloc == "undefined" && (E.yylloc = {});
      var xt = E.yylloc;
      n.push(xt);
      var Lt = E.options && E.options.ranges;
      typeof Z.yy.parseError == "function" ? this.parseError = Z.yy.parseError : this.parseError = Object.getPrototypeOf(this).parseError;
      function Ct() {
        var j;
        return j = h.pop() || E.lex() || _t, typeof j != "number" && (j instanceof Array && (h = j, j = h.pop()), j = l.symbols_[j] || j), j;
      }
      for (var W, J, H, ft, et = {}, lt, $, mt, ot; ; ) {
        if (J = o[o.length - 1], this.defaultActions[J] ? H = this.defaultActions[J] : ((W === null || typeof W == "undefined") && (W = Ct()), H = it[J] && it[J][W]), typeof H == "undefined" || !H.length || !H[0]) {
          var gt = "";
          ot = [];
          for (lt in it[J])
            this.terminals_[lt] && lt > Pt && ot.push("'" + this.terminals_[lt] + "'");
          E.showPosition ? gt = "Parse error on line " + (rt + 1) + `:
` + E.showPosition() + `
Expecting ` + ot.join(", ") + ", got '" + (this.terminals_[W] || W) + "'" : gt = "Parse error on line " + (rt + 1) + ": Unexpected " + (W == _t ? "end of input" : "'" + (this.terminals_[W] || W) + "'"), this.parseError(gt, {
            text: E.match,
            token: this.terminals_[W] || W,
            line: E.yylineno,
            loc: xt,
            expected: ot
          });
        }
        if (H[0] instanceof Array && H.length > 1)
          throw new Error("Parse Error: multiple actions possible at state: " + J + ", token: " + W);
        switch (H[0]) {
          case 1:
            o.push(W), q.push(E.yytext), n.push(E.yylloc), o.push(H[1]), W = null, Tt = E.yyleng, u = E.yytext, rt = E.yylineno, xt = E.yylloc;
            break;
          case 2:
            if ($ = this.productions_[H[1]][1], et.$ = q[q.length - $], et._$ = {
              first_line: n[n.length - ($ || 1)].first_line,
              last_line: n[n.length - 1].last_line,
              first_column: n[n.length - ($ || 1)].first_column,
              last_column: n[n.length - 1].last_column
            }, Lt && (et._$.range = [
              n[n.length - ($ || 1)].range[0],
              n[n.length - 1].range[1]
            ]), ft = this.performAction.apply(et, [
              u,
              Tt,
              rt,
              Z.yy,
              H[1],
              q,
              n
            ].concat(vt)), typeof ft != "undefined")
              return ft;
            $ && (o = o.slice(0, -1 * $ * 2), q = q.slice(0, -1 * $), n = n.slice(0, -1 * $)), o.push(this.productions_[H[1]][0]), q.push(et.$), n.push(et._$), mt = it[o[o.length - 2]][o[o.length - 1]], o.push(mt);
            break;
          case 3:
            return !0;
        }
      }
      return !0;
    }
  }, Ft = function() {
    var K = {
      EOF: 1,
      parseError: function(l, o) {
        if (this.yy.parser)
          this.yy.parser.parseError(l, o);
        else
          throw new Error(l);
      },
      // resets the lexer, sets new input
      setInput: function(s, l) {
        return this.yy = l || this.yy || {}, this._input = s, this._more = this._backtrack = this.done = !1, this.yylineno = this.yyleng = 0, this.yytext = this.matched = this.match = "", this.conditionStack = ["INITIAL"], this.yylloc = {
          first_line: 1,
          first_column: 0,
          last_line: 1,
          last_column: 0
        }, this.options.ranges && (this.yylloc.range = [0, 0]), this.offset = 0, this;
      },
      // consumes and returns one char from the input
      input: function() {
        var s = this._input[0];
        this.yytext += s, this.yyleng++, this.offset++, this.match += s, this.matched += s;
        var l = s.match(/(?:\r\n?|\n).*/g);
        return l ? (this.yylineno++, this.yylloc.last_line++) : this.yylloc.last_column++, this.options.ranges && this.yylloc.range[1]++, this._input = this._input.slice(1), s;
      },
      // unshifts one char (or a string) into the input
      unput: function(s) {
        var l = s.length, o = s.split(/(?:\r\n?|\n)/g);
        this._input = s + this._input, this.yytext = this.yytext.substr(0, this.yytext.length - l), this.offset -= l;
        var h = this.match.split(/(?:\r\n?|\n)/g);
        this.match = this.match.substr(0, this.match.length - 1), this.matched = this.matched.substr(0, this.matched.length - 1), o.length - 1 && (this.yylineno -= o.length - 1);
        var q = this.yylloc.range;
        return this.yylloc = {
          first_line: this.yylloc.first_line,
          last_line: this.yylineno + 1,
          first_column: this.yylloc.first_column,
          last_column: o ? (o.length === h.length ? this.yylloc.first_column : 0) + h[h.length - o.length].length - o[0].length : this.yylloc.first_column - l
        }, this.options.ranges && (this.yylloc.range = [q[0], q[0] + this.yyleng - l]), this.yyleng = this.yytext.length, this;
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
      less: function(s) {
        this.unput(this.match.slice(s));
      },
      // displays already matched input, i.e. for error messages
      pastInput: function() {
        var s = this.matched.substr(0, this.matched.length - this.match.length);
        return (s.length > 20 ? "..." : "") + s.substr(-20).replace(/\n/g, "");
      },
      // displays upcoming input, i.e. for error messages
      upcomingInput: function() {
        var s = this.match;
        return s.length < 20 && (s += this._input.substr(0, 20 - s.length)), (s.substr(0, 20) + (s.length > 20 ? "..." : "")).replace(/\n/g, "");
      },
      // displays the character position where the lexing error occurred, i.e. for error messages
      showPosition: function() {
        var s = this.pastInput(), l = new Array(s.length + 1).join("-");
        return s + this.upcomingInput() + `
` + l + "^";
      },
      // test the lexed token: return FALSE when not a match, otherwise return token
      test_match: function(s, l) {
        var o, h, q;
        if (this.options.backtrack_lexer && (q = {
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
        }, this.options.ranges && (q.yylloc.range = this.yylloc.range.slice(0))), h = s[0].match(/(?:\r\n?|\n).*/g), h && (this.yylineno += h.length), this.yylloc = {
          first_line: this.yylloc.last_line,
          last_line: this.yylineno + 1,
          first_column: this.yylloc.last_column,
          last_column: h ? h[h.length - 1].length - h[h.length - 1].match(/\r?\n?/)[0].length : this.yylloc.last_column + s[0].length
        }, this.yytext += s[0], this.match += s[0], this.matches = s, this.yyleng = this.yytext.length, this.options.ranges && (this.yylloc.range = [this.offset, this.offset += this.yyleng]), this._more = !1, this._backtrack = !1, this._input = this._input.slice(s[0].length), this.matched += s[0], o = this.performAction.call(this, this.yy, this, l, this.conditionStack[this.conditionStack.length - 1]), this.done && this._input && (this.done = !1), o)
          return o;
        if (this._backtrack) {
          for (var n in q)
            this[n] = q[n];
          return !1;
        }
        return !1;
      },
      // return next match in input
      next: function() {
        if (this.done)
          return this.EOF;
        this._input || (this.done = !0);
        var s, l, o, h;
        this._more || (this.yytext = "", this.match = "");
        for (var q = this._currentRules(), n = 0; n < q.length; n++)
          if (o = this._input.match(this.rules[q[n]]), o && (!l || o[0].length > l[0].length)) {
            if (l = o, h = n, this.options.backtrack_lexer) {
              if (s = this.test_match(o, q[n]), s !== !1)
                return s;
              if (this._backtrack) {
                l = !1;
                continue;
              } else
                return !1;
            } else if (!this.options.flex)
              break;
          }
        return l ? (s = this.test_match(l, q[h]), s !== !1 ? s : !1) : this._input === "" ? this.EOF : this.parseError("Lexical error on line " + (this.yylineno + 1) + `. Unrecognized text.
` + this.showPosition(), {
          text: "",
          token: null,
          line: this.yylineno
        });
      },
      // return next match that has a token
      lex: function() {
        var l = this.next();
        return l || this.lex();
      },
      // activates a new lexer condition state (pushes the new lexer condition state onto the condition stack)
      begin: function(l) {
        this.conditionStack.push(l);
      },
      // pop the previously active lexer condition state off the condition stack
      popState: function() {
        var l = this.conditionStack.length - 1;
        return l > 0 ? this.conditionStack.pop() : this.conditionStack[0];
      },
      // produce the lexer rule set which is active for the currently active lexer condition state
      _currentRules: function() {
        return this.conditionStack.length && this.conditionStack[this.conditionStack.length - 1] ? this.conditions[this.conditionStack[this.conditionStack.length - 1]].rules : this.conditions.INITIAL.rules;
      },
      // return the currently active lexer condition state; when an index argument is provided it produces the N-th previous condition state, if available
      topState: function(l) {
        return l = this.conditionStack.length - 1 - Math.abs(l || 0), l >= 0 ? this.conditionStack[l] : "INITIAL";
      },
      // alias for begin(condition)
      pushState: function(l) {
        this.begin(l);
      },
      // return the number of states currently on the stack
      stateStackSize: function() {
        return this.conditionStack.length;
      },
      options: { "case-insensitive": !0 },
      performAction: function(l, o, h, q) {
        switch (h) {
          case 0:
            break;
          case 1:
            break;
          case 2:
            return 32;
          case 3:
            break;
          case 4:
            return this.begin("title"), 13;
          case 5:
            return this.popState(), "title_value";
          case 6:
            return this.begin("acc_title"), 15;
          case 7:
            return this.popState(), "acc_title_value";
          case 8:
            return this.begin("acc_descr"), 17;
          case 9:
            return this.popState(), "acc_descr_value";
          case 10:
            this.begin("acc_descr_multiline");
            break;
          case 11:
            this.popState();
            break;
          case 12:
            return "acc_descr_multiline_value";
          case 13:
            return 25;
          case 14:
            return 27;
          case 15:
            return 26;
          case 16:
            return 28;
          case 17:
            return 29;
          case 18:
            return 30;
          case 19:
            return 31;
          case 20:
            this.begin("md_string");
            break;
          case 21:
            return "MD_STR";
          case 22:
            this.popState();
            break;
          case 23:
            this.begin("string");
            break;
          case 24:
            this.popState();
            break;
          case 25:
            return "STR";
          case 26:
            return this.begin("point_start"), 22;
          case 27:
            return this.begin("point_x"), 23;
          case 28:
            this.popState();
            break;
          case 29:
            this.popState(), this.begin("point_y");
            break;
          case 30:
            return this.popState(), 24;
          case 31:
            return 6;
          case 32:
            return 43;
          case 33:
            return "COLON";
          case 34:
            return 45;
          case 35:
            return 44;
          case 36:
            return 46;
          case 37:
            return 46;
          case 38:
            return 47;
          case 39:
            return 49;
          case 40:
            return 50;
          case 41:
            return 48;
          case 42:
            return 41;
          case 43:
            return 51;
          case 44:
            return 42;
          case 45:
            return 5;
          case 46:
            return 33;
          case 47:
            return 40;
          case 48:
            return 34;
        }
      },
      rules: [/^(?:%%(?!\{)[^\n]*)/i, /^(?:[^\}]%%[^\n]*)/i, /^(?:[\n\r]+)/i, /^(?:%%[^\n]*)/i, /^(?:title\b)/i, /^(?:(?!\n||)*[^\n]*)/i, /^(?:accTitle\s*:\s*)/i, /^(?:(?!\n||)*[^\n]*)/i, /^(?:accDescr\s*:\s*)/i, /^(?:(?!\n||)*[^\n]*)/i, /^(?:accDescr\s*\{\s*)/i, /^(?:[\}])/i, /^(?:[^\}]*)/i, /^(?: *x-axis *)/i, /^(?: *y-axis *)/i, /^(?: *--+> *)/i, /^(?: *quadrant-1 *)/i, /^(?: *quadrant-2 *)/i, /^(?: *quadrant-3 *)/i, /^(?: *quadrant-4 *)/i, /^(?:["][`])/i, /^(?:[^`"]+)/i, /^(?:[`]["])/i, /^(?:["])/i, /^(?:["])/i, /^(?:[^"]*)/i, /^(?:\s*:\s*\[\s*)/i, /^(?:(1)|(0(.\d+)?))/i, /^(?:\s*\] *)/i, /^(?:\s*,\s*)/i, /^(?:(1)|(0(.\d+)?))/i, /^(?: *quadrantChart *)/i, /^(?:[A-Za-z]+)/i, /^(?::)/i, /^(?:\+)/i, /^(?:,)/i, /^(?:=)/i, /^(?:=)/i, /^(?:\*)/i, /^(?:#)/i, /^(?:[\_])/i, /^(?:\.)/i, /^(?:&)/i, /^(?:-)/i, /^(?:[0-9]+)/i, /^(?:\s)/i, /^(?:;)/i, /^(?:[!"#$%&'*+,-.`?\\_/])/i, /^(?:$)/i],
      conditions: { point_y: { rules: [30], inclusive: !1 }, point_x: { rules: [29], inclusive: !1 }, point_start: { rules: [27, 28], inclusive: !1 }, acc_descr_multiline: { rules: [11, 12], inclusive: !1 }, acc_descr: { rules: [9], inclusive: !1 }, acc_title: { rules: [7], inclusive: !1 }, title: { rules: [5], inclusive: !1 }, md_string: { rules: [21, 22], inclusive: !1 }, string: { rules: [24, 25], inclusive: !1 }, INITIAL: { rules: [0, 1, 2, 3, 4, 6, 8, 10, 13, 14, 15, 16, 17, 18, 19, 20, 23, 26, 31, 32, 33, 34, 35, 36, 37, 38, 39, 40, 41, 42, 43, 44, 45, 46, 47, 48], inclusive: !0 } }
    };
    return K;
  }();
  ct.lexer = Ft;
  function dt() {
    this.yy = {};
  }
  return dt.prototype = ct, ct.Parser = dt, new dt();
}();
yt.parser = yt;
const Ht = yt, R = It();
class Mt {
  constructor() {
    this.config = this.getDefaultConfig(), this.themeConfig = this.getDefaultThemeConfig(), this.data = this.getDefaultData();
  }
  getDefaultData() {
    return {
      titleText: "",
      quadrant1Text: "",
      quadrant2Text: "",
      quadrant3Text: "",
      quadrant4Text: "",
      xAxisLeftText: "",
      xAxisRightText: "",
      yAxisBottomText: "",
      yAxisTopText: "",
      points: []
    };
  }
  getDefaultConfig() {
    var a, r, x, f, d, c, g, i, y, p, B, N, V, I, b, M, X, C;
    return {
      showXAxis: !0,
      showYAxis: !0,
      showTitle: !0,
      chartHeight: ((a = D.quadrantChart) == null ? void 0 : a.chartWidth) || 500,
      chartWidth: ((r = D.quadrantChart) == null ? void 0 : r.chartHeight) || 500,
      titlePadding: ((x = D.quadrantChart) == null ? void 0 : x.titlePadding) || 10,
      titleFontSize: ((f = D.quadrantChart) == null ? void 0 : f.titleFontSize) || 20,
      quadrantPadding: ((d = D.quadrantChart) == null ? void 0 : d.quadrantPadding) || 5,
      xAxisLabelPadding: ((c = D.quadrantChart) == null ? void 0 : c.xAxisLabelPadding) || 5,
      yAxisLabelPadding: ((g = D.quadrantChart) == null ? void 0 : g.yAxisLabelPadding) || 5,
      xAxisLabelFontSize: ((i = D.quadrantChart) == null ? void 0 : i.xAxisLabelFontSize) || 16,
      yAxisLabelFontSize: ((y = D.quadrantChart) == null ? void 0 : y.yAxisLabelFontSize) || 16,
      quadrantLabelFontSize: ((p = D.quadrantChart) == null ? void 0 : p.quadrantLabelFontSize) || 16,
      quadrantTextTopPadding: ((B = D.quadrantChart) == null ? void 0 : B.quadrantTextTopPadding) || 5,
      pointTextPadding: ((N = D.quadrantChart) == null ? void 0 : N.pointTextPadding) || 5,
      pointLabelFontSize: ((V = D.quadrantChart) == null ? void 0 : V.pointLabelFontSize) || 12,
      pointRadius: ((I = D.quadrantChart) == null ? void 0 : I.pointRadius) || 5,
      xAxisPosition: ((b = D.quadrantChart) == null ? void 0 : b.xAxisPosition) || "top",
      yAxisPosition: ((M = D.quadrantChart) == null ? void 0 : M.yAxisPosition) || "left",
      quadrantInternalBorderStrokeWidth: ((X = D.quadrantChart) == null ? void 0 : X.quadrantInternalBorderStrokeWidth) || 1,
      quadrantExternalBorderStrokeWidth: ((C = D.quadrantChart) == null ? void 0 : C.quadrantExternalBorderStrokeWidth) || 2
    };
  }
  getDefaultThemeConfig() {
    return {
      quadrant1Fill: R.quadrant1Fill,
      quadrant2Fill: R.quadrant2Fill,
      quadrant3Fill: R.quadrant3Fill,
      quadrant4Fill: R.quadrant4Fill,
      quadrant1TextFill: R.quadrant1TextFill,
      quadrant2TextFill: R.quadrant2TextFill,
      quadrant3TextFill: R.quadrant3TextFill,
      quadrant4TextFill: R.quadrant4TextFill,
      quadrantPointFill: R.quadrantPointFill,
      quadrantPointTextFill: R.quadrantPointTextFill,
      quadrantXAxisTextFill: R.quadrantXAxisTextFill,
      quadrantYAxisTextFill: R.quadrantYAxisTextFill,
      quadrantTitleFill: R.quadrantTitleFill,
      quadrantInternalBorderStrokeFill: R.quadrantInternalBorderStrokeFill,
      quadrantExternalBorderStrokeFill: R.quadrantExternalBorderStrokeFill
    };
  }
  clear() {
    this.config = this.getDefaultConfig(), this.themeConfig = this.getDefaultThemeConfig(), this.data = this.getDefaultData(), ht.info("clear called");
  }
  setData(a) {
    this.data = tt(tt({}, this.data), a);
  }
  addPoints(a) {
    this.data.points = [...a, ...this.data.points];
  }
  setConfig(a) {
    ht.trace("setConfig called with: ", a), this.config = tt(tt({}, this.config), a);
  }
  setThemeConfig(a) {
    ht.trace("setThemeConfig called with: ", a), this.themeConfig = tt(tt({}, this.themeConfig), a);
  }
  calculateSpace(a, r, x, f) {
    const d = this.config.xAxisLabelPadding * 2 + this.config.xAxisLabelFontSize, c = {
      top: a === "top" && r ? d : 0,
      bottom: a === "bottom" && r ? d : 0
    }, g = this.config.yAxisLabelPadding * 2 + this.config.yAxisLabelFontSize, i = {
      left: this.config.yAxisPosition === "left" && x ? g : 0,
      right: this.config.yAxisPosition === "right" && x ? g : 0
    }, y = this.config.titleFontSize + this.config.titlePadding * 2, p = {
      top: f ? y : 0
    }, B = this.config.quadrantPadding + i.left, N = this.config.quadrantPadding + c.top + p.top, V = this.config.chartWidth - this.config.quadrantPadding * 2 - i.left - i.right, I = this.config.chartHeight - this.config.quadrantPadding * 2 - c.top - c.bottom - p.top, b = V / 2, M = I / 2;
    return {
      xAxisSpace: c,
      yAxisSpace: i,
      titleSpace: p,
      quadrantSpace: {
        quadrantLeft: B,
        quadrantTop: N,
        quadrantWidth: V,
        quadrantHalfWidth: b,
        quadrantHeight: I,
        quadrantHalfHeight: M
      }
    };
  }
  getAxisLabels(a, r, x, f) {
    const { quadrantSpace: d, titleSpace: c } = f, {
      quadrantHalfHeight: g,
      quadrantHeight: i,
      quadrantLeft: y,
      quadrantHalfWidth: p,
      quadrantTop: B,
      quadrantWidth: N
    } = d, V = !!this.data.xAxisRightText, I = !!this.data.yAxisTopText, b = [];
    return this.data.xAxisLeftText && r && b.push({
      text: this.data.xAxisLeftText,
      fill: this.themeConfig.quadrantXAxisTextFill,
      x: y + (V ? p / 2 : 0),
      y: a === "top" ? this.config.xAxisLabelPadding + c.top : this.config.xAxisLabelPadding + B + i + this.config.quadrantPadding,
      fontSize: this.config.xAxisLabelFontSize,
      verticalPos: V ? "center" : "left",
      horizontalPos: "top",
      rotation: 0
    }), this.data.xAxisRightText && r && b.push({
      text: this.data.xAxisRightText,
      fill: this.themeConfig.quadrantXAxisTextFill,
      x: y + p + (V ? p / 2 : 0),
      y: a === "top" ? this.config.xAxisLabelPadding + c.top : this.config.xAxisLabelPadding + B + i + this.config.quadrantPadding,
      fontSize: this.config.xAxisLabelFontSize,
      verticalPos: V ? "center" : "left",
      horizontalPos: "top",
      rotation: 0
    }), this.data.yAxisBottomText && x && b.push({
      text: this.data.yAxisBottomText,
      fill: this.themeConfig.quadrantYAxisTextFill,
      x: this.config.yAxisPosition === "left" ? this.config.yAxisLabelPadding : this.config.yAxisLabelPadding + y + N + this.config.quadrantPadding,
      y: B + i - (I ? g / 2 : 0),
      fontSize: this.config.yAxisLabelFontSize,
      verticalPos: I ? "center" : "left",
      horizontalPos: "top",
      rotation: -90
    }), this.data.yAxisTopText && x && b.push({
      text: this.data.yAxisTopText,
      fill: this.themeConfig.quadrantYAxisTextFill,
      x: this.config.yAxisPosition === "left" ? this.config.yAxisLabelPadding : this.config.yAxisLabelPadding + y + N + this.config.quadrantPadding,
      y: B + g - (I ? g / 2 : 0),
      fontSize: this.config.yAxisLabelFontSize,
      verticalPos: I ? "center" : "left",
      horizontalPos: "top",
      rotation: -90
    }), b;
  }
  getQuadrants(a) {
    const { quadrantSpace: r } = a, { quadrantHalfHeight: x, quadrantLeft: f, quadrantHalfWidth: d, quadrantTop: c } = r, g = [
      {
        text: {
          text: this.data.quadrant1Text,
          fill: this.themeConfig.quadrant1TextFill,
          x: 0,
          y: 0,
          fontSize: this.config.quadrantLabelFontSize,
          verticalPos: "center",
          horizontalPos: "middle",
          rotation: 0
        },
        x: f + d,
        y: c,
        width: d,
        height: x,
        fill: this.themeConfig.quadrant1Fill
      },
      {
        text: {
          text: this.data.quadrant2Text,
          fill: this.themeConfig.quadrant2TextFill,
          x: 0,
          y: 0,
          fontSize: this.config.quadrantLabelFontSize,
          verticalPos: "center",
          horizontalPos: "middle",
          rotation: 0
        },
        x: f,
        y: c,
        width: d,
        height: x,
        fill: this.themeConfig.quadrant2Fill
      },
      {
        text: {
          text: this.data.quadrant3Text,
          fill: this.themeConfig.quadrant3TextFill,
          x: 0,
          y: 0,
          fontSize: this.config.quadrantLabelFontSize,
          verticalPos: "center",
          horizontalPos: "middle",
          rotation: 0
        },
        x: f,
        y: c + x,
        width: d,
        height: x,
        fill: this.themeConfig.quadrant3Fill
      },
      {
        text: {
          text: this.data.quadrant4Text,
          fill: this.themeConfig.quadrant4TextFill,
          x: 0,
          y: 0,
          fontSize: this.config.quadrantLabelFontSize,
          verticalPos: "center",
          horizontalPos: "middle",
          rotation: 0
        },
        x: f + d,
        y: c + x,
        width: d,
        height: x,
        fill: this.themeConfig.quadrant4Fill
      }
    ];
    for (const i of g)
      i.text.x = i.x + i.width / 2, this.data.points.length === 0 ? (i.text.y = i.y + i.height / 2, i.text.horizontalPos = "middle") : (i.text.y = i.y + this.config.quadrantTextTopPadding, i.text.horizontalPos = "top");
    return g;
  }
  getQuadrantPoints(a) {
    const { quadrantSpace: r } = a, { quadrantHeight: x, quadrantLeft: f, quadrantTop: d, quadrantWidth: c } = r, g = St().domain([0, 1]).range([f, c + f]), i = St().domain([0, 1]).range([x + d, d]);
    return this.data.points.map((p) => ({
      x: g(p.x),
      y: i(p.y),
      fill: this.themeConfig.quadrantPointFill,
      radius: this.config.pointRadius,
      text: {
        text: p.text,
        fill: this.themeConfig.quadrantPointTextFill,
        x: g(p.x),
        y: i(p.y) + this.config.pointTextPadding,
        verticalPos: "center",
        horizontalPos: "top",
        fontSize: this.config.pointLabelFontSize,
        rotation: 0
      }
    }));
  }
  getBorders(a) {
    const r = this.config.quadrantExternalBorderStrokeWidth / 2, { quadrantSpace: x } = a, {
      quadrantHalfHeight: f,
      quadrantHeight: d,
      quadrantLeft: c,
      quadrantHalfWidth: g,
      quadrantTop: i,
      quadrantWidth: y
    } = x;
    return [
      // top border
      {
        strokeFill: this.themeConfig.quadrantExternalBorderStrokeFill,
        strokeWidth: this.config.quadrantExternalBorderStrokeWidth,
        x1: c - r,
        y1: i,
        x2: c + y + r,
        y2: i
      },
      // right border
      {
        strokeFill: this.themeConfig.quadrantExternalBorderStrokeFill,
        strokeWidth: this.config.quadrantExternalBorderStrokeWidth,
        x1: c + y,
        y1: i + r,
        x2: c + y,
        y2: i + d - r
      },
      // bottom border
      {
        strokeFill: this.themeConfig.quadrantExternalBorderStrokeFill,
        strokeWidth: this.config.quadrantExternalBorderStrokeWidth,
        x1: c - r,
        y1: i + d,
        x2: c + y + r,
        y2: i + d
      },
      // left border
      {
        strokeFill: this.themeConfig.quadrantExternalBorderStrokeFill,
        strokeWidth: this.config.quadrantExternalBorderStrokeWidth,
        x1: c,
        y1: i + r,
        x2: c,
        y2: i + d - r
      },
      // vertical inner border
      {
        strokeFill: this.themeConfig.quadrantInternalBorderStrokeFill,
        strokeWidth: this.config.quadrantInternalBorderStrokeWidth,
        x1: c + g,
        y1: i + r,
        x2: c + g,
        y2: i + d - r
      },
      // horizontal inner border
      {
        strokeFill: this.themeConfig.quadrantInternalBorderStrokeFill,
        strokeWidth: this.config.quadrantInternalBorderStrokeWidth,
        x1: c + r,
        y1: i + f,
        x2: c + y - r,
        y2: i + f
      }
    ];
  }
  getTitle(a) {
    if (a)
      return {
        text: this.data.titleText,
        fill: this.themeConfig.quadrantTitleFill,
        fontSize: this.config.titleFontSize,
        horizontalPos: "top",
        verticalPos: "center",
        rotation: 0,
        y: this.config.titlePadding,
        x: this.config.chartWidth / 2
      };
  }
  build() {
    const a = this.config.showXAxis && !!(this.data.xAxisLeftText || this.data.xAxisRightText), r = this.config.showYAxis && !!(this.data.yAxisTopText || this.data.yAxisBottomText), x = this.config.showTitle && !!this.data.titleText, f = this.data.points.length > 0 ? "bottom" : this.config.xAxisPosition, d = this.calculateSpace(f, a, r, x);
    return {
      points: this.getQuadrantPoints(d),
      quadrants: this.getQuadrants(d),
      axisLabels: this.getAxisLabels(f, a, r, d),
      borderLines: this.getBorders(d),
      title: this.getTitle(x)
    };
  }
}
const Xt = qt();
function G(e) {
  return Qt(e.trim(), Xt);
}
const w = new Mt();
function Ot(e) {
  w.setData({ quadrant1Text: G(e.text) });
}
function Yt(e) {
  w.setData({ quadrant2Text: G(e.text) });
}
function $t(e) {
  w.setData({ quadrant3Text: G(e.text) });
}
function jt(e) {
  w.setData({ quadrant4Text: G(e.text) });
}
function Gt(e) {
  w.setData({ xAxisLeftText: G(e.text) });
}
function Kt(e) {
  w.setData({ xAxisRightText: G(e.text) });
}
function Zt(e) {
  w.setData({ yAxisTopText: G(e.text) });
}
function Jt(e) {
  w.setData({ yAxisBottomText: G(e.text) });
}
function te(e, a, r) {
  w.addPoints([{ x: a, y: r, text: G(e.text) }]);
}
function ee(e) {
  w.setConfig({ chartWidth: e });
}
function ie(e) {
  w.setConfig({ chartHeight: e });
}
function ae() {
  const e = qt(), { themeVariables: a, quadrantChart: r } = e;
  return r && w.setConfig(r), w.setThemeConfig({
    quadrant1Fill: a.quadrant1Fill,
    quadrant2Fill: a.quadrant2Fill,
    quadrant3Fill: a.quadrant3Fill,
    quadrant4Fill: a.quadrant4Fill,
    quadrant1TextFill: a.quadrant1TextFill,
    quadrant2TextFill: a.quadrant2TextFill,
    quadrant3TextFill: a.quadrant3TextFill,
    quadrant4TextFill: a.quadrant4TextFill,
    quadrantPointFill: a.quadrantPointFill,
    quadrantPointTextFill: a.quadrantPointTextFill,
    quadrantXAxisTextFill: a.quadrantXAxisTextFill,
    quadrantYAxisTextFill: a.quadrantYAxisTextFill,
    quadrantExternalBorderStrokeFill: a.quadrantExternalBorderStrokeFill,
    quadrantInternalBorderStrokeFill: a.quadrantInternalBorderStrokeFill,
    quadrantTitleFill: a.quadrantTitleFill
  }), w.setData({ titleText: kt() }), w.build();
}
const ne = function() {
  w.clear(), Nt();
}, se = {
  setWidth: ee,
  setHeight: ie,
  setQuadrant1Text: Ot,
  setQuadrant2Text: Yt,
  setQuadrant3Text: $t,
  setQuadrant4Text: jt,
  setXAxisLeftText: Gt,
  setXAxisRightText: Kt,
  setYAxisTopText: Zt,
  setYAxisBottomText: Jt,
  addPoint: te,
  getQuadrantData: ae,
  clear: ne,
  setAccTitle: Bt,
  getAccTitle: wt,
  setDiagramTitle: Rt,
  getDiagramTitle: kt,
  getAccDescription: Vt,
  setAccDescription: Wt
}, re = (e, a, r, x) => {
  var f, d, c;
  function g(t) {
    return t === "top" ? "hanging" : "middle";
  }
  function i(t) {
    return t === "left" ? "start" : "middle";
  }
  function y(t) {
    return `translate(${t.x}, ${t.y}) rotate(${t.rotation || 0})`;
  }
  const p = qt();
  ht.debug(`Rendering quadrant chart
` + e);
  const B = p.securityLevel;
  let N;
  B === "sandbox" && (N = pt("#i" + a));
  const I = (B === "sandbox" ? pt(N.nodes()[0].contentDocument.body) : pt("body")).select(`[id="${a}"]`), b = I.append("g").attr("class", "main"), M = ((f = p.quadrantChart) == null ? void 0 : f.chartWidth) || 500, X = ((d = p.quadrantChart) == null ? void 0 : d.chartHeight) || 500;
  Ut(I, X, M, ((c = p.quadrantChart) == null ? void 0 : c.useMaxWidth) || !0), I.attr("viewBox", "0 0 " + M + " " + X), x.db.setHeight(X), x.db.setWidth(M);
  const C = x.db.getQuadrantData(), at = b.append("g").attr("class", "quadrants"), nt = b.append("g").attr("class", "border"), st = b.append("g").attr("class", "data-points"), U = b.append("g").attr("class", "labels"), Q = b.append("g").attr("class", "title");
  C.title && Q.append("text").attr("x", 0).attr("y", 0).attr("fill", C.title.fill).attr("font-size", C.title.fontSize).attr("dominant-baseline", g(C.title.horizontalPos)).attr("text-anchor", i(C.title.verticalPos)).attr("transform", y(C.title)).text(C.title.text), C.borderLines && nt.selectAll("line").data(C.borderLines).enter().append("line").attr("x1", (t) => t.x1).attr("y1", (t) => t.y1).attr("x2", (t) => t.x2).attr("y2", (t) => t.y2).style("stroke", (t) => t.strokeFill).style("stroke-width", (t) => t.strokeWidth);
  const T = at.selectAll("g.quadrant").data(C.quadrants).enter().append("g").attr("class", "quadrant");
  T.append("rect").attr("x", (t) => t.x).attr("y", (t) => t.y).attr("width", (t) => t.width).attr("height", (t) => t.height).attr("fill", (t) => t.fill), T.append("text").attr("x", 0).attr("y", 0).attr("fill", (t) => t.text.fill).attr("font-size", (t) => t.text.fontSize).attr(
    "dominant-baseline",
    (t) => g(t.text.horizontalPos)
  ).attr("text-anchor", (t) => i(t.text.verticalPos)).attr("transform", (t) => y(t.text)).text((t) => t.text.text), U.selectAll("g.label").data(C.axisLabels).enter().append("g").attr("class", "label").append("text").attr("x", 0).attr("y", 0).text((t) => t.text).attr("fill", (t) => t.fill).attr("font-size", (t) => t.fontSize).attr("dominant-baseline", (t) => g(t.horizontalPos)).attr("text-anchor", (t) => i(t.verticalPos)).attr("transform", (t) => y(t));
  const _ = st.selectAll("g.data-point").data(C.points).enter().append("g").attr("class", "data-point");
  _.append("circle").attr("cx", (t) => t.x).attr("cy", (t) => t.y).attr("r", (t) => t.radius).attr("fill", (t) => t.fill), _.append("text").attr("x", 0).attr("y", 0).text((t) => t.text.text).attr("fill", (t) => t.text.fill).attr("font-size", (t) => t.text.fontSize).attr(
    "dominant-baseline",
    (t) => g(t.text.horizontalPos)
  ).attr("text-anchor", (t) => i(t.text.verticalPos)).attr("transform", (t) => y(t.text));
}, le = {
  draw: re
}, ue = {
  parser: Ht,
  db: se,
  renderer: le,
  styles: () => ""
};
export {
  ue as diagram
};
