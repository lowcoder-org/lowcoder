import { as as ft, H as gt, e as mt, l as S, j as q, v as xt, at as _t, au as bt, av as kt } from "./08856db2.js";
import { a as D } from "./eb460319.js";
import "./256b619e.js";
var K = function() {
  var n = function(g, i, r, c) {
    for (r = r || {}, c = g.length; c--; r[g[c]] = i)
      ;
    return r;
  }, t = [6, 8, 10, 11, 12, 14, 16, 17, 20, 21], e = [1, 9], a = [1, 10], s = [1, 11], h = [1, 12], l = [1, 13], p = [1, 16], y = [1, 17], f = {
    trace: function() {
    },
    yy: {},
    symbols_: { error: 2, start: 3, timeline: 4, document: 5, EOF: 6, line: 7, SPACE: 8, statement: 9, NEWLINE: 10, title: 11, acc_title: 12, acc_title_value: 13, acc_descr: 14, acc_descr_value: 15, acc_descr_multiline_value: 16, section: 17, period_statement: 18, event_statement: 19, period: 20, event: 21, $accept: 0, $end: 1 },
    terminals_: { 2: "error", 4: "timeline", 6: "EOF", 8: "SPACE", 10: "NEWLINE", 11: "title", 12: "acc_title", 13: "acc_title_value", 14: "acc_descr", 15: "acc_descr_value", 16: "acc_descr_multiline_value", 17: "section", 20: "period", 21: "event" },
    productions_: [0, [3, 3], [5, 0], [5, 2], [7, 2], [7, 1], [7, 1], [7, 1], [9, 1], [9, 2], [9, 2], [9, 1], [9, 1], [9, 1], [9, 1], [18, 1], [19, 1]],
    performAction: function(i, r, c, d, u, o, I) {
      var x = o.length - 1;
      switch (u) {
        case 1:
          return o[x - 1];
        case 2:
          this.$ = [];
          break;
        case 3:
          o[x - 1].push(o[x]), this.$ = o[x - 1];
          break;
        case 4:
        case 5:
          this.$ = o[x];
          break;
        case 6:
        case 7:
          this.$ = [];
          break;
        case 8:
          d.getCommonDb().setDiagramTitle(o[x].substr(6)), this.$ = o[x].substr(6);
          break;
        case 9:
          this.$ = o[x].trim(), d.getCommonDb().setAccTitle(this.$);
          break;
        case 10:
        case 11:
          this.$ = o[x].trim(), d.getCommonDb().setAccDescription(this.$);
          break;
        case 12:
          d.addSection(o[x].substr(8)), this.$ = o[x].substr(8);
          break;
        case 15:
          d.addTask(o[x], 0, ""), this.$ = o[x];
          break;
        case 16:
          d.addEvent(o[x].substr(2)), this.$ = o[x];
          break;
      }
    },
    table: [{ 3: 1, 4: [1, 2] }, { 1: [3] }, n(t, [2, 2], { 5: 3 }), { 6: [1, 4], 7: 5, 8: [1, 6], 9: 7, 10: [1, 8], 11: e, 12: a, 14: s, 16: h, 17: l, 18: 14, 19: 15, 20: p, 21: y }, n(t, [2, 7], { 1: [2, 1] }), n(t, [2, 3]), { 9: 18, 11: e, 12: a, 14: s, 16: h, 17: l, 18: 14, 19: 15, 20: p, 21: y }, n(t, [2, 5]), n(t, [2, 6]), n(t, [2, 8]), { 13: [1, 19] }, { 15: [1, 20] }, n(t, [2, 11]), n(t, [2, 12]), n(t, [2, 13]), n(t, [2, 14]), n(t, [2, 15]), n(t, [2, 16]), n(t, [2, 4]), n(t, [2, 9]), n(t, [2, 10])],
    defaultActions: {},
    parseError: function(i, r) {
      if (r.recoverable)
        this.trace(i);
      else {
        var c = new Error(i);
        throw c.hash = r, c;
      }
    },
    parse: function(i) {
      var r = this, c = [0], d = [], u = [null], o = [], I = this.table, x = "", E = 0, O = 0, z = 2, H = 1, j = o.slice.call(arguments, 1), k = Object.create(this.lexer), $ = { yy: {} };
      for (var R in this.yy)
        Object.prototype.hasOwnProperty.call(this.yy, R) && ($.yy[R] = this.yy[R]);
      k.setInput(i, $.yy), $.yy.lexer = k, $.yy.parser = this, typeof k.yylloc == "undefined" && (k.yylloc = {});
      var F = k.yylloc;
      o.push(F);
      var A = k.options && k.options.ranges;
      typeof $.yy.parseError == "function" ? this.parseError = $.yy.parseError : this.parseError = Object.getPrototypeOf(this).parseError;
      function w() {
        var L;
        return L = d.pop() || k.lex() || H, typeof L != "number" && (L instanceof Array && (d = L, L = d.pop()), L = r.symbols_[L] || L), L;
      }
      for (var _, T, v, N, P = {}, V, M, Y, G; ; ) {
        if (T = c[c.length - 1], this.defaultActions[T] ? v = this.defaultActions[T] : ((_ === null || typeof _ == "undefined") && (_ = w()), v = I[T] && I[T][_]), typeof v == "undefined" || !v.length || !v[0]) {
          var J = "";
          G = [];
          for (V in I[T])
            this.terminals_[V] && V > z && G.push("'" + this.terminals_[V] + "'");
          k.showPosition ? J = "Parse error on line " + (E + 1) + `:
` + k.showPosition() + `
Expecting ` + G.join(", ") + ", got '" + (this.terminals_[_] || _) + "'" : J = "Parse error on line " + (E + 1) + ": Unexpected " + (_ == H ? "end of input" : "'" + (this.terminals_[_] || _) + "'"), this.parseError(J, {
            text: k.match,
            token: this.terminals_[_] || _,
            line: k.yylineno,
            loc: F,
            expected: G
          });
        }
        if (v[0] instanceof Array && v.length > 1)
          throw new Error("Parse Error: multiple actions possible at state: " + T + ", token: " + _);
        switch (v[0]) {
          case 1:
            c.push(_), u.push(k.yytext), o.push(k.yylloc), c.push(v[1]), _ = null, O = k.yyleng, x = k.yytext, E = k.yylineno, F = k.yylloc;
            break;
          case 2:
            if (M = this.productions_[v[1]][1], P.$ = u[u.length - M], P._$ = {
              first_line: o[o.length - (M || 1)].first_line,
              last_line: o[o.length - 1].last_line,
              first_column: o[o.length - (M || 1)].first_column,
              last_column: o[o.length - 1].last_column
            }, A && (P._$.range = [
              o[o.length - (M || 1)].range[0],
              o[o.length - 1].range[1]
            ]), N = this.performAction.apply(P, [
              x,
              O,
              E,
              $.yy,
              v[1],
              u,
              o
            ].concat(j)), typeof N != "undefined")
              return N;
            M && (c = c.slice(0, -1 * M * 2), u = u.slice(0, -1 * M), o = o.slice(0, -1 * M)), c.push(this.productions_[v[1]][0]), u.push(P.$), o.push(P._$), Y = I[c[c.length - 2]][c[c.length - 1]], c.push(Y);
            break;
          case 3:
            return !0;
        }
      }
      return !0;
    }
  }, b = function() {
    var g = {
      EOF: 1,
      parseError: function(r, c) {
        if (this.yy.parser)
          this.yy.parser.parseError(r, c);
        else
          throw new Error(r);
      },
      // resets the lexer, sets new input
      setInput: function(i, r) {
        return this.yy = r || this.yy || {}, this._input = i, this._more = this._backtrack = this.done = !1, this.yylineno = this.yyleng = 0, this.yytext = this.matched = this.match = "", this.conditionStack = ["INITIAL"], this.yylloc = {
          first_line: 1,
          first_column: 0,
          last_line: 1,
          last_column: 0
        }, this.options.ranges && (this.yylloc.range = [0, 0]), this.offset = 0, this;
      },
      // consumes and returns one char from the input
      input: function() {
        var i = this._input[0];
        this.yytext += i, this.yyleng++, this.offset++, this.match += i, this.matched += i;
        var r = i.match(/(?:\r\n?|\n).*/g);
        return r ? (this.yylineno++, this.yylloc.last_line++) : this.yylloc.last_column++, this.options.ranges && this.yylloc.range[1]++, this._input = this._input.slice(1), i;
      },
      // unshifts one char (or a string) into the input
      unput: function(i) {
        var r = i.length, c = i.split(/(?:\r\n?|\n)/g);
        this._input = i + this._input, this.yytext = this.yytext.substr(0, this.yytext.length - r), this.offset -= r;
        var d = this.match.split(/(?:\r\n?|\n)/g);
        this.match = this.match.substr(0, this.match.length - 1), this.matched = this.matched.substr(0, this.matched.length - 1), c.length - 1 && (this.yylineno -= c.length - 1);
        var u = this.yylloc.range;
        return this.yylloc = {
          first_line: this.yylloc.first_line,
          last_line: this.yylineno + 1,
          first_column: this.yylloc.first_column,
          last_column: c ? (c.length === d.length ? this.yylloc.first_column : 0) + d[d.length - c.length].length - c[0].length : this.yylloc.first_column - r
        }, this.options.ranges && (this.yylloc.range = [u[0], u[0] + this.yyleng - r]), this.yyleng = this.yytext.length, this;
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
      less: function(i) {
        this.unput(this.match.slice(i));
      },
      // displays already matched input, i.e. for error messages
      pastInput: function() {
        var i = this.matched.substr(0, this.matched.length - this.match.length);
        return (i.length > 20 ? "..." : "") + i.substr(-20).replace(/\n/g, "");
      },
      // displays upcoming input, i.e. for error messages
      upcomingInput: function() {
        var i = this.match;
        return i.length < 20 && (i += this._input.substr(0, 20 - i.length)), (i.substr(0, 20) + (i.length > 20 ? "..." : "")).replace(/\n/g, "");
      },
      // displays the character position where the lexing error occurred, i.e. for error messages
      showPosition: function() {
        var i = this.pastInput(), r = new Array(i.length + 1).join("-");
        return i + this.upcomingInput() + `
` + r + "^";
      },
      // test the lexed token: return FALSE when not a match, otherwise return token
      test_match: function(i, r) {
        var c, d, u;
        if (this.options.backtrack_lexer && (u = {
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
        }, this.options.ranges && (u.yylloc.range = this.yylloc.range.slice(0))), d = i[0].match(/(?:\r\n?|\n).*/g), d && (this.yylineno += d.length), this.yylloc = {
          first_line: this.yylloc.last_line,
          last_line: this.yylineno + 1,
          first_column: this.yylloc.last_column,
          last_column: d ? d[d.length - 1].length - d[d.length - 1].match(/\r?\n?/)[0].length : this.yylloc.last_column + i[0].length
        }, this.yytext += i[0], this.match += i[0], this.matches = i, this.yyleng = this.yytext.length, this.options.ranges && (this.yylloc.range = [this.offset, this.offset += this.yyleng]), this._more = !1, this._backtrack = !1, this._input = this._input.slice(i[0].length), this.matched += i[0], c = this.performAction.call(this, this.yy, this, r, this.conditionStack[this.conditionStack.length - 1]), this.done && this._input && (this.done = !1), c)
          return c;
        if (this._backtrack) {
          for (var o in u)
            this[o] = u[o];
          return !1;
        }
        return !1;
      },
      // return next match in input
      next: function() {
        if (this.done)
          return this.EOF;
        this._input || (this.done = !0);
        var i, r, c, d;
        this._more || (this.yytext = "", this.match = "");
        for (var u = this._currentRules(), o = 0; o < u.length; o++)
          if (c = this._input.match(this.rules[u[o]]), c && (!r || c[0].length > r[0].length)) {
            if (r = c, d = o, this.options.backtrack_lexer) {
              if (i = this.test_match(c, u[o]), i !== !1)
                return i;
              if (this._backtrack) {
                r = !1;
                continue;
              } else
                return !1;
            } else if (!this.options.flex)
              break;
          }
        return r ? (i = this.test_match(r, u[d]), i !== !1 ? i : !1) : this._input === "" ? this.EOF : this.parseError("Lexical error on line " + (this.yylineno + 1) + `. Unrecognized text.
` + this.showPosition(), {
          text: "",
          token: null,
          line: this.yylineno
        });
      },
      // return next match that has a token
      lex: function() {
        var r = this.next();
        return r || this.lex();
      },
      // activates a new lexer condition state (pushes the new lexer condition state onto the condition stack)
      begin: function(r) {
        this.conditionStack.push(r);
      },
      // pop the previously active lexer condition state off the condition stack
      popState: function() {
        var r = this.conditionStack.length - 1;
        return r > 0 ? this.conditionStack.pop() : this.conditionStack[0];
      },
      // produce the lexer rule set which is active for the currently active lexer condition state
      _currentRules: function() {
        return this.conditionStack.length && this.conditionStack[this.conditionStack.length - 1] ? this.conditions[this.conditionStack[this.conditionStack.length - 1]].rules : this.conditions.INITIAL.rules;
      },
      // return the currently active lexer condition state; when an index argument is provided it produces the N-th previous condition state, if available
      topState: function(r) {
        return r = this.conditionStack.length - 1 - Math.abs(r || 0), r >= 0 ? this.conditionStack[r] : "INITIAL";
      },
      // alias for begin(condition)
      pushState: function(r) {
        this.begin(r);
      },
      // return the number of states currently on the stack
      stateStackSize: function() {
        return this.conditionStack.length;
      },
      options: { "case-insensitive": !0 },
      performAction: function(r, c, d, u) {
        switch (d) {
          case 0:
            break;
          case 1:
            break;
          case 2:
            return 10;
          case 3:
            break;
          case 4:
            break;
          case 5:
            return 4;
          case 6:
            return 11;
          case 7:
            return this.begin("acc_title"), 12;
          case 8:
            return this.popState(), "acc_title_value";
          case 9:
            return this.begin("acc_descr"), 14;
          case 10:
            return this.popState(), "acc_descr_value";
          case 11:
            this.begin("acc_descr_multiline");
            break;
          case 12:
            this.popState();
            break;
          case 13:
            return "acc_descr_multiline_value";
          case 14:
            return 17;
          case 15:
            return 21;
          case 16:
            return 20;
          case 17:
            return 6;
          case 18:
            return "INVALID";
        }
      },
      rules: [/^(?:%(?!\{)[^\n]*)/i, /^(?:[^\}]%%[^\n]*)/i, /^(?:[\n]+)/i, /^(?:\s+)/i, /^(?:#[^\n]*)/i, /^(?:timeline\b)/i, /^(?:title\s[^#\n;]+)/i, /^(?:accTitle\s*:\s*)/i, /^(?:(?!\n||)*[^\n]*)/i, /^(?:accDescr\s*:\s*)/i, /^(?:(?!\n||)*[^\n]*)/i, /^(?:accDescr\s*\{\s*)/i, /^(?:[\}])/i, /^(?:[^\}]*)/i, /^(?:section\s[^#:\n;]+)/i, /^(?::\s[^#:\n;]+)/i, /^(?:[^#:\n;]+)/i, /^(?:$)/i, /^(?:.)/i],
      conditions: { acc_descr_multiline: { rules: [12, 13], inclusive: !1 }, acc_descr: { rules: [10], inclusive: !1 }, acc_title: { rules: [8], inclusive: !1 }, INITIAL: { rules: [0, 1, 2, 3, 4, 5, 6, 7, 9, 11, 14, 15, 16, 17, 18], inclusive: !0 } }
    };
    return g;
  }();
  f.lexer = b;
  function m() {
    this.yy = {};
  }
  return m.prototype = f, f.Parser = m, new m();
}();
K.parser = K;
const vt = K;
let W = "", st = 0;
const Q = [], U = [], B = [], it = () => ft, rt = function() {
  Q.length = 0, U.length = 0, W = "", B.length = 0, gt();
}, at = function(n) {
  W = n, Q.push(n);
}, lt = function() {
  return Q;
}, ot = function() {
  let n = tt();
  const t = 100;
  let e = 0;
  for (; !n && e < t; )
    n = tt(), e++;
  return U.push(...B), U;
}, ct = function(n, t, e) {
  const a = {
    id: st++,
    section: W,
    type: W,
    task: n,
    score: t || 0,
    //if event is defined, then add it the events array
    events: e ? [e] : []
  };
  B.push(a);
}, ht = function(n) {
  B.find((e) => e.id === st - 1).events.push(n);
}, dt = function(n) {
  const t = {
    section: W,
    type: W,
    description: n,
    task: n,
    classes: []
  };
  U.push(t);
}, tt = function() {
  const n = function(e) {
    return B[e].processed;
  };
  let t = !0;
  for (const [e, a] of B.entries())
    n(e), t = t && a.processed;
  return t;
}, wt = {
  clear: rt,
  getCommonDb: it,
  addSection: at,
  getSections: lt,
  getTasks: ot,
  addTask: ct,
  addTaskOrg: dt,
  addEvent: ht
}, St = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  addEvent: ht,
  addSection: at,
  addTask: ct,
  addTaskOrg: dt,
  clear: rt,
  default: wt,
  getCommonDb: it,
  getSections: lt,
  getTasks: ot
}, Symbol.toStringTag, { value: "Module" })), Et = 12, Z = function(n, t) {
  const e = n.append("rect");
  return e.attr("x", t.x), e.attr("y", t.y), e.attr("fill", t.fill), e.attr("stroke", t.stroke), e.attr("width", t.width), e.attr("height", t.height), e.attr("rx", t.rx), e.attr("ry", t.ry), t.class !== void 0 && e.attr("class", t.class), e;
}, Tt = function(n, t) {
  const a = n.append("circle").attr("cx", t.cx).attr("cy", t.cy).attr("class", "face").attr("r", 15).attr("stroke-width", 2).attr("overflow", "visible"), s = n.append("g");
  s.append("circle").attr("cx", t.cx - 15 / 3).attr("cy", t.cy - 15 / 3).attr("r", 1.5).attr("stroke-width", 2).attr("fill", "#666").attr("stroke", "#666"), s.append("circle").attr("cx", t.cx + 15 / 3).attr("cy", t.cy - 15 / 3).attr("r", 1.5).attr("stroke-width", 2).attr("fill", "#666").attr("stroke", "#666");
  function h(y) {
    const f = D().startAngle(Math.PI / 2).endAngle(3 * (Math.PI / 2)).innerRadius(7.5).outerRadius(6.8181818181818175);
    y.append("path").attr("class", "mouth").attr("d", f).attr("transform", "translate(" + t.cx + "," + (t.cy + 2) + ")");
  }
  function l(y) {
    const f = D().startAngle(3 * Math.PI / 2).endAngle(5 * (Math.PI / 2)).innerRadius(7.5).outerRadius(6.8181818181818175);
    y.append("path").attr("class", "mouth").attr("d", f).attr("transform", "translate(" + t.cx + "," + (t.cy + 7) + ")");
  }
  function p(y) {
    y.append("line").attr("class", "mouth").attr("stroke", 2).attr("x1", t.cx - 5).attr("y1", t.cy + 7).attr("x2", t.cx + 5).attr("y2", t.cy + 7).attr("class", "mouth").attr("stroke-width", "1px").attr("stroke", "#666");
  }
  return t.score > 3 ? h(s) : t.score < 3 ? l(s) : p(s), a;
}, It = function(n, t) {
  const e = n.append("circle");
  return e.attr("cx", t.cx), e.attr("cy", t.cy), e.attr("class", "actor-" + t.pos), e.attr("fill", t.fill), e.attr("stroke", t.stroke), e.attr("r", t.r), e.class !== void 0 && e.attr("class", e.class), t.title !== void 0 && e.append("title").text(t.title), e;
}, ut = function(n, t) {
  const e = t.text.replace(/<br\s*\/?>/gi, " "), a = n.append("text");
  a.attr("x", t.x), a.attr("y", t.y), a.attr("class", "legend"), a.style("text-anchor", t.anchor), t.class !== void 0 && a.attr("class", t.class);
  const s = a.append("tspan");
  return s.attr("x", t.x + t.textMargin * 2), s.text(e), a;
}, $t = function(n, t) {
  function e(s, h, l, p, y) {
    return s + "," + h + " " + (s + l) + "," + h + " " + (s + l) + "," + (h + p - y) + " " + (s + l - y * 1.2) + "," + (h + p) + " " + s + "," + (h + p);
  }
  const a = n.append("polygon");
  a.attr("points", e(t.x, t.y, 50, 20, 7)), a.attr("class", "labelBox"), t.y = t.y + t.labelMargin, t.x = t.x + 0.5 * t.labelMargin, ut(n, t);
}, Nt = function(n, t, e) {
  const a = n.append("g"), s = X();
  s.x = t.x, s.y = t.y, s.fill = t.fill, s.width = e.width, s.height = e.height, s.class = "journey-section section-type-" + t.num, s.rx = 3, s.ry = 3, Z(a, s), pt(e)(
    t.text,
    a,
    s.x,
    s.y,
    s.width,
    s.height,
    { class: "journey-section section-type-" + t.num },
    e,
    t.colour
  );
};
let et = -1;
const Mt = function(n, t, e) {
  const a = t.x + e.width / 2, s = n.append("g");
  et++;
  const h = 300 + 5 * 30;
  s.append("line").attr("id", "task" + et).attr("x1", a).attr("y1", t.y).attr("x2", a).attr("y2", h).attr("class", "task-line").attr("stroke-width", "1px").attr("stroke-dasharray", "4 2").attr("stroke", "#666"), Tt(s, {
    cx: a,
    cy: 300 + (5 - t.score) * 30,
    score: t.score
  });
  const l = X();
  l.x = t.x, l.y = t.y, l.fill = t.fill, l.width = e.width, l.height = e.height, l.class = "task task-type-" + t.num, l.rx = 3, l.ry = 3, Z(s, l), t.x + 14, pt(e)(
    t.task,
    s,
    l.x,
    l.y,
    l.width,
    l.height,
    { class: "task" },
    e,
    t.colour
  );
}, Lt = function(n, t) {
  Z(n, {
    x: t.startx,
    y: t.starty,
    width: t.stopx - t.startx,
    height: t.stopy - t.starty,
    fill: t.fill,
    class: "rect"
  }).lower();
}, At = function() {
  return {
    x: 0,
    y: 0,
    fill: void 0,
    "text-anchor": "start",
    width: 100,
    height: 100,
    textMargin: 0,
    rx: 0,
    ry: 0
  };
}, X = function() {
  return {
    x: 0,
    y: 0,
    width: 100,
    anchor: "start",
    height: 100,
    rx: 0,
    ry: 0
  };
}, pt = function() {
  function n(s, h, l, p, y, f, b, m) {
    const g = h.append("text").attr("x", l + y / 2).attr("y", p + f / 2 + 5).style("font-color", m).style("text-anchor", "middle").text(s);
    a(g, b);
  }
  function t(s, h, l, p, y, f, b, m, g) {
    const { taskFontSize: i, taskFontFamily: r } = m, c = s.split(/<br\s*\/?>/gi);
    for (let d = 0; d < c.length; d++) {
      const u = d * i - i * (c.length - 1) / 2, o = h.append("text").attr("x", l + y / 2).attr("y", p).attr("fill", g).style("text-anchor", "middle").style("font-size", i).style("font-family", r);
      o.append("tspan").attr("x", l + y / 2).attr("dy", u).text(c[d]), o.attr("y", p + f / 2).attr("dominant-baseline", "central").attr("alignment-baseline", "central"), a(o, b);
    }
  }
  function e(s, h, l, p, y, f, b, m) {
    const g = h.append("switch"), r = g.append("foreignObject").attr("x", l).attr("y", p).attr("width", y).attr("height", f).attr("position", "fixed").append("xhtml:div").style("display", "table").style("height", "100%").style("width", "100%");
    r.append("div").attr("class", "label").style("display", "table-cell").style("text-align", "center").style("vertical-align", "middle").text(s), t(s, g, l, p, y, f, b, m), a(r, b);
  }
  function a(s, h) {
    for (const l in h)
      l in h && s.attr(l, h[l]);
  }
  return function(s) {
    return s.textPlacement === "fo" ? e : s.textPlacement === "old" ? n : t;
  };
}(), Ht = function(n) {
  n.append("defs").append("marker").attr("id", "arrowhead").attr("refX", 5).attr("refY", 2).attr("markerWidth", 6).attr("markerHeight", 4).attr("orient", "auto").append("path").attr("d", "M 0,0 V 4 L6,2 Z");
};
function yt(n, t) {
  n.each(function() {
    var e = q(this), a = e.text().split(/(\s+|<br>)/).reverse(), s, h = [], l = 1.1, p = e.attr("y"), y = parseFloat(e.attr("dy")), f = e.text(null).append("tspan").attr("x", 0).attr("y", p).attr("dy", y + "em");
    for (let b = 0; b < a.length; b++)
      s = a[a.length - 1 - b], h.push(s), f.text(h.join(" ").trim()), (f.node().getComputedTextLength() > t || s === "<br>") && (h.pop(), f.text(h.join(" ").trim()), s === "<br>" ? h = [""] : h = [s], f = e.append("tspan").attr("x", 0).attr("y", p).attr("dy", l + "em").text(s));
  });
}
const Pt = function(n, t, e, a) {
  const s = e % Et - 1, h = n.append("g");
  t.section = s, h.attr(
    "class",
    (t.class ? t.class + " " : "") + "timeline-node " + ("section-" + s)
  );
  const l = h.append("g"), p = h.append("g"), f = p.append("text").text(t.descr).attr("dy", "1em").attr("alignment-baseline", "middle").attr("dominant-baseline", "middle").attr("text-anchor", "middle").call(yt, t.width).node().getBBox(), b = a.fontSize && a.fontSize.replace ? a.fontSize.replace("px", "") : a.fontSize;
  return t.height = f.height + b * 1.1 * 0.5 + t.padding, t.height = Math.max(t.height, t.maxHeight), t.width = t.width + 2 * t.padding, p.attr("transform", "translate(" + t.width / 2 + ", " + t.padding / 2 + ")"), zt(l, t, s), t;
}, Ct = function(n, t, e) {
  const a = n.append("g"), h = a.append("text").text(t.descr).attr("dy", "1em").attr("alignment-baseline", "middle").attr("dominant-baseline", "middle").attr("text-anchor", "middle").call(yt, t.width).node().getBBox(), l = e.fontSize && e.fontSize.replace ? e.fontSize.replace("px", "") : e.fontSize;
  return a.remove(), h.height + l * 1.1 * 0.5 + t.padding;
}, zt = function(n, t, e) {
  n.append("path").attr("id", "node-" + t.id).attr("class", "node-bkg node-" + t.type).attr(
    "d",
    `M0 ${t.height - 5} v${-t.height + 2 * 5} q0,-5 5,-5 h${t.width - 2 * 5} q5,0 5,5 v${t.height - 5} H0 Z`
  ), n.append("line").attr("class", "node-line-" + e).attr("x1", 0).attr("y1", t.height).attr("x2", t.width).attr("y2", t.height);
}, C = {
  drawRect: Z,
  drawCircle: It,
  drawSection: Nt,
  drawText: ut,
  drawLabel: $t,
  drawTask: Mt,
  drawBackgroundRect: Lt,
  getTextObj: At,
  getNoteRect: X,
  initGraphics: Ht,
  drawNode: Pt,
  getVirtualNodeHeight: Ct
}, Rt = function(n, t, e, a) {
  var $, R, F;
  var s, h;
  const l = mt(), p = ($ = l.leftMargin) != null ? $ : 50;
  S.debug("timeline", a.db);
  const y = l.securityLevel;
  let f;
  y === "sandbox" && (f = q("#i" + t));
  const m = (y === "sandbox" ? q(f.nodes()[0].contentDocument.body) : q("body")).select("#" + t);
  m.append("g");
  const g = a.db.getTasks(), i = a.db.getCommonDb().getDiagramTitle();
  S.debug("task", g), C.initGraphics(m);
  const r = a.db.getSections();
  S.debug("sections", r);
  let c = 0, d = 0, u = 0, o = 0, I = 50 + p, x = 50;
  o = 50;
  let E = 0, O = !0;
  r.forEach(function(A) {
    const w = {
      number: E,
      descr: A,
      section: E,
      width: 150,
      padding: 20,
      maxHeight: c
    }, _ = C.getVirtualNodeHeight(m, w, l);
    S.debug("sectionHeight before draw", _), c = Math.max(c, _ + 20);
  });
  let z = 0, H = 0;
  S.debug("tasks.length", g.length);
  for (const [A, w] of g.entries()) {
    const _ = {
      number: A,
      descr: w,
      section: w.section,
      width: 150,
      padding: 20,
      maxHeight: d
    }, T = C.getVirtualNodeHeight(m, _, l);
    S.debug("taskHeight before draw", T), d = Math.max(d, T + 20), z = Math.max(z, w.events.length);
    let v = 0;
    for (let N = 0; N < w.events.length; N++) {
      const V = {
        descr: w.events[N],
        section: w.section,
        number: w.section,
        width: 150,
        padding: 20,
        maxHeight: 50
      };
      v += C.getVirtualNodeHeight(m, V, l);
    }
    H = Math.max(H, v);
  }
  S.debug("maxSectionHeight before draw", c), S.debug("maxTaskHeight before draw", d), r && r.length > 0 ? r.forEach((A) => {
    const w = g.filter((N) => N.section === A), _ = {
      number: E,
      descr: A,
      section: E,
      width: 200 * Math.max(w.length, 1) - 50,
      padding: 20,
      maxHeight: c
    };
    S.debug("sectionNode", _);
    const T = m.append("g"), v = C.drawNode(T, _, E, l);
    S.debug("sectionNode output", v), T.attr("transform", `translate(${I}, ${o})`), x += c + 50, w.length > 0 && nt(
      m,
      w,
      E,
      I,
      x,
      d,
      l,
      z,
      H,
      c,
      !1
    ), I += 200 * Math.max(w.length, 1), x = o, E++;
  }) : (O = !1, nt(
    m,
    g,
    E,
    I,
    x,
    d,
    l,
    z,
    H,
    c,
    !0
  ));
  const j = m.node().getBBox();
  S.debug("bounds", j), i && m.append("text").text(i).attr("x", j.width / 2 - p).attr("font-size", "4ex").attr("font-weight", "bold").attr("y", 20), u = O ? c + d + 150 : d + 100, m.append("g").attr("class", "lineWrapper").append("line").attr("x1", p).attr("y1", u).attr("x2", j.width + 3 * p).attr("y2", u).attr("stroke-width", 4).attr("stroke", "black").attr("marker-end", "url(#arrowhead)"), xt(
    void 0,
    m,
    (R = (s = l.timeline) == null ? void 0 : s.padding) != null ? R : 50,
    (F = (h = l.timeline) == null ? void 0 : h.useMaxWidth) != null ? F : !1
  );
}, nt = function(n, t, e, a, s, h, l, p, y, f, b) {
  var m;
  for (const g of t) {
    const i = {
      descr: g.task,
      section: e,
      number: e,
      width: 150,
      padding: 20,
      maxHeight: h
    };
    S.debug("taskNode", i);
    const r = n.append("g").attr("class", "taskWrapper"), d = C.drawNode(r, i, e, l).height;
    if (S.debug("taskHeight after draw", d), r.attr("transform", `translate(${a}, ${s})`), h = Math.max(h, d), g.events) {
      const u = n.append("g").attr("class", "lineWrapper");
      let o = h;
      s += 100, o = o + Ft(n, g.events, e, a, s, l), s -= 100, u.append("line").attr("x1", a + 190 / 2).attr("y1", s + h).attr("x2", a + 190 / 2).attr(
        "y2",
        s + h + (b ? h : f) + y + 120
      ).attr("stroke-width", 2).attr("stroke", "black").attr("marker-end", "url(#arrowhead)").attr("stroke-dasharray", "5,5");
    }
    a = a + 200, b && !((m = l.timeline) != null && m.disableMulticolor) && e++;
  }
  s = s - 10;
}, Ft = function(n, t, e, a, s, h) {
  let l = 0;
  const p = s;
  s = s + 100;
  for (const y of t) {
    const f = {
      descr: y,
      section: e,
      number: e,
      width: 150,
      padding: 20,
      maxHeight: 50
    };
    S.debug("eventNode", f);
    const b = n.append("g").attr("class", "eventWrapper"), g = C.drawNode(b, f, e, h).height;
    l = l + g, b.attr("transform", `translate(${a}, ${s})`), s = s + 10 + g;
  }
  return s = p, l;
}, Vt = {
  setConf: () => {
  },
  draw: Rt
}, Wt = (n) => {
  let t = "";
  for (let e = 0; e < n.THEME_COLOR_LIMIT; e++)
    n["lineColor" + e] = n["lineColor" + e] || n["cScaleInv" + e], _t(n["lineColor" + e]) ? n["lineColor" + e] = bt(n["lineColor" + e], 20) : n["lineColor" + e] = kt(n["lineColor" + e], 20);
  for (let e = 0; e < n.THEME_COLOR_LIMIT; e++) {
    const a = "" + (17 - 3 * e);
    t += `
    .section-${e - 1} rect, .section-${e - 1} path, .section-${e - 1} circle, .section-${e - 1} path  {
      fill: ${n["cScale" + e]};
    }
    .section-${e - 1} text {
     fill: ${n["cScaleLabel" + e]};
    }
    .node-icon-${e - 1} {
      font-size: 40px;
      color: ${n["cScaleLabel" + e]};
    }
    .section-edge-${e - 1}{
      stroke: ${n["cScale" + e]};
    }
    .edge-depth-${e - 1}{
      stroke-width: ${a};
    }
    .section-${e - 1} line {
      stroke: ${n["cScaleInv" + e]} ;
      stroke-width: 3;
    }

    .lineWrapper line{
      stroke: ${n["cScaleLabel" + e]} ;
    }

    .disabled, .disabled circle, .disabled text {
      fill: lightgray;
    }
    .disabled text {
      fill: #efefef;
    }
    `;
  }
  return t;
}, Bt = (n) => `
  .edge {
    stroke-width: 3;
  }
  ${Wt(n)}
  .section-root rect, .section-root path, .section-root circle  {
    fill: ${n.git0};
  }
  .section-root text {
    fill: ${n.gitBranchLabel0};
  }
  .icon-container {
    height:100%;
    display: flex;
    justify-content: center;
    align-items: center;
  }
  .edge {
    fill: none;
  }
  .eventWrapper  {
   filter: brightness(120%);
  }
`, Ot = Bt, Ut = {
  db: St,
  renderer: Vt,
  parser: vt,
  styles: Ot
};
export {
  Ut as diagram
};
