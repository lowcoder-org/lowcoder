import { c as rt, g as mt, s as kt, a as _t, b as xt, D as vt, C as bt, E as wt, j as St, aq as Lt, h as G, t as Et } from "./1269154d.js";
import { o as At } from "./92e85b65.js";
import { s as Tt } from "./2ff7471d.js";
import "./f9637058.js";
function ot(t, i) {
  let r;
  if (i === void 0)
    for (const c of t)
      c != null && (r < c || r === void 0 && c >= c) && (r = c);
  else {
    let c = -1;
    for (let h of t)
      (h = i(h, ++c, t)) != null && (r < h || r === void 0 && h >= h) && (r = h);
  }
  return r;
}
function yt(t, i) {
  let r;
  if (i === void 0)
    for (const c of t)
      c != null && (r > c || r === void 0 && c >= c) && (r = c);
  else {
    let c = -1;
    for (let h of t)
      (h = i(h, ++c, t)) != null && (r > h || r === void 0 && h >= h) && (r = h);
  }
  return r;
}
function Z(t, i) {
  let r = 0;
  if (i === void 0)
    for (let c of t)
      (c = +c) && (r += c);
  else {
    let c = -1;
    for (let h of t)
      (h = +i(h, ++c, t)) && (r += h);
  }
  return r;
}
function Mt(t) {
  return t.target.depth;
}
function Nt(t) {
  return t.depth;
}
function Ct(t, i) {
  return i - 1 - t.height;
}
function dt(t, i) {
  return t.sourceLinks.length ? t.depth : i - 1;
}
function Pt(t) {
  return t.targetLinks.length ? t.depth : t.sourceLinks.length ? yt(t.sourceLinks, Mt) - 1 : 0;
}
function Y(t) {
  return function() {
    return t;
  };
}
function lt(t, i) {
  return q(t.source, i.source) || t.index - i.index;
}
function at(t, i) {
  return q(t.target, i.target) || t.index - i.index;
}
function q(t, i) {
  return t.y0 - i.y0;
}
function J(t) {
  return t.value;
}
function It(t) {
  return t.index;
}
function $t(t) {
  return t.nodes;
}
function Ot(t) {
  return t.links;
}
function ct(t, i) {
  const r = t.get(i);
  if (!r)
    throw new Error("missing: " + i);
  return r;
}
function ut({ nodes: t }) {
  for (const i of t) {
    let r = i.y0, c = r;
    for (const h of i.sourceLinks)
      h.y0 = r + h.width / 2, r += h.width;
    for (const h of i.targetLinks)
      h.y1 = c + h.width / 2, c += h.width;
  }
}
function jt() {
  let t = 0, i = 0, r = 1, c = 1, h = 24, k = 8, d, g = It, s = dt, l, u, p = $t, v = Ot, y = 6;
  function _() {
    const n = { nodes: p.apply(null, arguments), links: v.apply(null, arguments) };
    return E(n), L(n), A(n), N(n), b(n), ut(n), n;
  }
  _.update = function(n) {
    return ut(n), n;
  }, _.nodeId = function(n) {
    return arguments.length ? (g = typeof n == "function" ? n : Y(n), _) : g;
  }, _.nodeAlign = function(n) {
    return arguments.length ? (s = typeof n == "function" ? n : Y(n), _) : s;
  }, _.nodeSort = function(n) {
    return arguments.length ? (l = n, _) : l;
  }, _.nodeWidth = function(n) {
    return arguments.length ? (h = +n, _) : h;
  }, _.nodePadding = function(n) {
    return arguments.length ? (k = d = +n, _) : k;
  }, _.nodes = function(n) {
    return arguments.length ? (p = typeof n == "function" ? n : Y(n), _) : p;
  }, _.links = function(n) {
    return arguments.length ? (v = typeof n == "function" ? n : Y(n), _) : v;
  }, _.linkSort = function(n) {
    return arguments.length ? (u = n, _) : u;
  }, _.size = function(n) {
    return arguments.length ? (t = i = 0, r = +n[0], c = +n[1], _) : [r - t, c - i];
  }, _.extent = function(n) {
    return arguments.length ? (t = +n[0][0], r = +n[1][0], i = +n[0][1], c = +n[1][1], _) : [[t, i], [r, c]];
  }, _.iterations = function(n) {
    return arguments.length ? (y = +n, _) : y;
  };
  function E({ nodes: n, links: f }) {
    for (const [a, o] of n.entries())
      o.index = a, o.sourceLinks = [], o.targetLinks = [];
    const e = new Map(n.map((a, o) => [g(a, o, n), a]));
    for (const [a, o] of f.entries()) {
      o.index = a;
      let { source: m, target: x } = o;
      typeof m != "object" && (m = o.source = ct(e, m)), typeof x != "object" && (x = o.target = ct(e, x)), m.sourceLinks.push(o), x.targetLinks.push(o);
    }
    if (u != null)
      for (const { sourceLinks: a, targetLinks: o } of n)
        a.sort(u), o.sort(u);
  }
  function L({ nodes: n }) {
    for (const f of n)
      f.value = f.fixedValue === void 0 ? Math.max(Z(f.sourceLinks, J), Z(f.targetLinks, J)) : f.fixedValue;
  }
  function A({ nodes: n }) {
    const f = n.length;
    let e = new Set(n), a = /* @__PURE__ */ new Set(), o = 0;
    for (; e.size; ) {
      for (const m of e) {
        m.depth = o;
        for (const { target: x } of m.sourceLinks)
          a.add(x);
      }
      if (++o > f)
        throw new Error("circular link");
      e = a, a = /* @__PURE__ */ new Set();
    }
  }
  function N({ nodes: n }) {
    const f = n.length;
    let e = new Set(n), a = /* @__PURE__ */ new Set(), o = 0;
    for (; e.size; ) {
      for (const m of e) {
        m.height = o;
        for (const { source: x } of m.targetLinks)
          a.add(x);
      }
      if (++o > f)
        throw new Error("circular link");
      e = a, a = /* @__PURE__ */ new Set();
    }
  }
  function C({ nodes: n }) {
    const f = ot(n, (o) => o.depth) + 1, e = (r - t - h) / (f - 1), a = new Array(f);
    for (const o of n) {
      const m = Math.max(0, Math.min(f - 1, Math.floor(s.call(null, o, f))));
      o.layer = m, o.x0 = t + m * e, o.x1 = o.x0 + h, a[m] ? a[m].push(o) : a[m] = [o];
    }
    if (l)
      for (const o of a)
        o.sort(l);
    return a;
  }
  function j(n) {
    const f = yt(n, (e) => (c - i - (e.length - 1) * d) / Z(e, J));
    for (const e of n) {
      let a = i;
      for (const o of e) {
        o.y0 = a, o.y1 = a + o.value * f, a = o.y1 + d;
        for (const m of o.sourceLinks)
          m.width = m.value * f;
      }
      a = (c - a + d) / (e.length + 1);
      for (let o = 0; o < e.length; ++o) {
        const m = e[o];
        m.y0 += a * (o + 1), m.y1 += a * (o + 1);
      }
      T(e);
    }
  }
  function b(n) {
    const f = C(n);
    d = Math.min(k, (c - i) / (ot(f, (e) => e.length) - 1)), j(f);
    for (let e = 0; e < y; ++e) {
      const a = Math.pow(0.99, e), o = Math.max(1 - a, (e + 1) / y);
      $(f, a, o), M(f, a, o);
    }
  }
  function M(n, f, e) {
    for (let a = 1, o = n.length; a < o; ++a) {
      const m = n[a];
      for (const x of m) {
        let R = 0, D = 0;
        for (const { source: F, value: K } of x.targetLinks) {
          let W = K * (x.layer - F.layer);
          R += S(F, x) * W, D += W;
        }
        if (!(D > 0))
          continue;
        let U = (R / D - x.y0) * f;
        x.y0 += U, x.y1 += U, w(x);
      }
      l === void 0 && m.sort(q), P(m, e);
    }
  }
  function $(n, f, e) {
    for (let a = n.length, o = a - 2; o >= 0; --o) {
      const m = n[o];
      for (const x of m) {
        let R = 0, D = 0;
        for (const { target: F, value: K } of x.sourceLinks) {
          let W = K * (F.layer - x.layer);
          R += O(x, F) * W, D += W;
        }
        if (!(D > 0))
          continue;
        let U = (R / D - x.y0) * f;
        x.y0 += U, x.y1 += U, w(x);
      }
      l === void 0 && m.sort(q), P(m, e);
    }
  }
  function P(n, f) {
    const e = n.length >> 1, a = n[e];
    z(n, a.y0 - d, e - 1, f), I(n, a.y1 + d, e + 1, f), z(n, c, n.length - 1, f), I(n, i, 0, f);
  }
  function I(n, f, e, a) {
    for (; e < n.length; ++e) {
      const o = n[e], m = (f - o.y0) * a;
      m > 1e-6 && (o.y0 += m, o.y1 += m), f = o.y1 + d;
    }
  }
  function z(n, f, e, a) {
    for (; e >= 0; --e) {
      const o = n[e], m = (o.y1 - f) * a;
      m > 1e-6 && (o.y0 -= m, o.y1 -= m), f = o.y0 - d;
    }
  }
  function w({ sourceLinks: n, targetLinks: f }) {
    if (u === void 0) {
      for (const { source: { sourceLinks: e } } of f)
        e.sort(at);
      for (const { target: { targetLinks: e } } of n)
        e.sort(lt);
    }
  }
  function T(n) {
    if (u === void 0)
      for (const { sourceLinks: f, targetLinks: e } of n)
        f.sort(at), e.sort(lt);
  }
  function S(n, f) {
    let e = n.y0 - (n.sourceLinks.length - 1) * d / 2;
    for (const { target: a, width: o } of n.sourceLinks) {
      if (a === f)
        break;
      e += o + d;
    }
    for (const { source: a, width: o } of f.targetLinks) {
      if (a === n)
        break;
      e -= o;
    }
    return e;
  }
  function O(n, f) {
    let e = f.y0 - (f.targetLinks.length - 1) * d / 2;
    for (const { source: a, width: o } of f.targetLinks) {
      if (a === n)
        break;
      e += o + d;
    }
    for (const { target: a, width: o } of n.sourceLinks) {
      if (a === f)
        break;
      e -= o;
    }
    return e;
  }
  return _;
}
var tt = Math.PI, et = 2 * tt, B = 1e-6, zt = et - B;
function nt() {
  this._x0 = this._y0 = // start of current subpath
  this._x1 = this._y1 = null, this._ = "";
}
function gt() {
  return new nt();
}
nt.prototype = gt.prototype = {
  constructor: nt,
  moveTo: function(t, i) {
    this._ += "M" + (this._x0 = this._x1 = +t) + "," + (this._y0 = this._y1 = +i);
  },
  closePath: function() {
    this._x1 !== null && (this._x1 = this._x0, this._y1 = this._y0, this._ += "Z");
  },
  lineTo: function(t, i) {
    this._ += "L" + (this._x1 = +t) + "," + (this._y1 = +i);
  },
  quadraticCurveTo: function(t, i, r, c) {
    this._ += "Q" + +t + "," + +i + "," + (this._x1 = +r) + "," + (this._y1 = +c);
  },
  bezierCurveTo: function(t, i, r, c, h, k) {
    this._ += "C" + +t + "," + +i + "," + +r + "," + +c + "," + (this._x1 = +h) + "," + (this._y1 = +k);
  },
  arcTo: function(t, i, r, c, h) {
    t = +t, i = +i, r = +r, c = +c, h = +h;
    var k = this._x1, d = this._y1, g = r - t, s = c - i, l = k - t, u = d - i, p = l * l + u * u;
    if (h < 0)
      throw new Error("negative radius: " + h);
    if (this._x1 === null)
      this._ += "M" + (this._x1 = t) + "," + (this._y1 = i);
    else if (p > B)
      if (!(Math.abs(u * g - s * l) > B) || !h)
        this._ += "L" + (this._x1 = t) + "," + (this._y1 = i);
      else {
        var v = r - k, y = c - d, _ = g * g + s * s, E = v * v + y * y, L = Math.sqrt(_), A = Math.sqrt(p), N = h * Math.tan((tt - Math.acos((_ + p - E) / (2 * L * A))) / 2), C = N / A, j = N / L;
        Math.abs(C - 1) > B && (this._ += "L" + (t + C * l) + "," + (i + C * u)), this._ += "A" + h + "," + h + ",0,0," + +(u * v > l * y) + "," + (this._x1 = t + j * g) + "," + (this._y1 = i + j * s);
      }
  },
  arc: function(t, i, r, c, h, k) {
    t = +t, i = +i, r = +r, k = !!k;
    var d = r * Math.cos(c), g = r * Math.sin(c), s = t + d, l = i + g, u = 1 ^ k, p = k ? c - h : h - c;
    if (r < 0)
      throw new Error("negative radius: " + r);
    this._x1 === null ? this._ += "M" + s + "," + l : (Math.abs(this._x1 - s) > B || Math.abs(this._y1 - l) > B) && (this._ += "L" + s + "," + l), r && (p < 0 && (p = p % et + et), p > zt ? this._ += "A" + r + "," + r + ",0,1," + u + "," + (t - d) + "," + (i - g) + "A" + r + "," + r + ",0,1," + u + "," + (this._x1 = s) + "," + (this._y1 = l) : p > B && (this._ += "A" + r + "," + r + ",0," + +(p >= tt) + "," + u + "," + (this._x1 = t + r * Math.cos(h)) + "," + (this._y1 = i + r * Math.sin(h))));
  },
  rect: function(t, i, r, c) {
    this._ += "M" + (this._x0 = this._x1 = +t) + "," + (this._y0 = this._y1 = +i) + "h" + +r + "v" + +c + "h" + -r + "Z";
  },
  toString: function() {
    return this._;
  }
};
function ht(t) {
  return function() {
    return t;
  };
}
function Dt(t) {
  return t[0];
}
function Bt(t) {
  return t[1];
}
var Vt = Array.prototype.slice;
function Rt(t) {
  return t.source;
}
function Ut(t) {
  return t.target;
}
function Ft(t) {
  var i = Rt, r = Ut, c = Dt, h = Bt, k = null;
  function d() {
    var g, s = Vt.call(arguments), l = i.apply(this, s), u = r.apply(this, s);
    if (k || (k = g = gt()), t(k, +c.apply(this, (s[0] = l, s)), +h.apply(this, s), +c.apply(this, (s[0] = u, s)), +h.apply(this, s)), g)
      return k = null, g + "" || null;
  }
  return d.source = function(g) {
    return arguments.length ? (i = g, d) : i;
  }, d.target = function(g) {
    return arguments.length ? (r = g, d) : r;
  }, d.x = function(g) {
    return arguments.length ? (c = typeof g == "function" ? g : ht(+g), d) : c;
  }, d.y = function(g) {
    return arguments.length ? (h = typeof g == "function" ? g : ht(+g), d) : h;
  }, d.context = function(g) {
    return arguments.length ? (k = g == null ? null : g, d) : k;
  }, d;
}
function Wt(t, i, r, c, h) {
  t.moveTo(i, r), t.bezierCurveTo(i = (i + c) / 2, r, i, h, c, h);
}
function Gt() {
  return Ft(Wt);
}
function Yt(t) {
  return [t.source.x1, t.y0];
}
function qt(t) {
  return [t.target.x0, t.y1];
}
function Ht() {
  return Gt().source(Yt).target(qt);
}
var it = function() {
  var t = function(g, s, l, u) {
    for (l = l || {}, u = g.length; u--; l[g[u]] = s)
      ;
    return l;
  }, i = [1, 9], r = [1, 10], c = [1, 5, 10, 12], h = {
    trace: function() {
    },
    yy: {},
    symbols_: { error: 2, start: 3, SANKEY: 4, NEWLINE: 5, csv: 6, opt_eof: 7, record: 8, csv_tail: 9, EOF: 10, "field[source]": 11, COMMA: 12, "field[target]": 13, "field[value]": 14, field: 15, escaped: 16, non_escaped: 17, DQUOTE: 18, ESCAPED_TEXT: 19, NON_ESCAPED_TEXT: 20, $accept: 0, $end: 1 },
    terminals_: { 2: "error", 4: "SANKEY", 5: "NEWLINE", 10: "EOF", 11: "field[source]", 12: "COMMA", 13: "field[target]", 14: "field[value]", 18: "DQUOTE", 19: "ESCAPED_TEXT", 20: "NON_ESCAPED_TEXT" },
    productions_: [0, [3, 4], [6, 2], [9, 2], [9, 0], [7, 1], [7, 0], [8, 5], [15, 1], [15, 1], [16, 3], [17, 1]],
    performAction: function(s, l, u, p, v, y, _) {
      var E = y.length - 1;
      switch (v) {
        case 7:
          const L = p.findOrCreateNode(y[E - 4].trim().replaceAll('""', '"')), A = p.findOrCreateNode(y[E - 2].trim().replaceAll('""', '"')), N = parseFloat(y[E].trim());
          p.addLink(L, A, N);
          break;
        case 8:
        case 9:
        case 11:
          this.$ = y[E];
          break;
        case 10:
          this.$ = y[E - 1];
          break;
      }
    },
    table: [{ 3: 1, 4: [1, 2] }, { 1: [3] }, { 5: [1, 3] }, { 6: 4, 8: 5, 15: 6, 16: 7, 17: 8, 18: i, 20: r }, { 1: [2, 6], 7: 11, 10: [1, 12] }, t(r, [2, 4], { 9: 13, 5: [1, 14] }), { 12: [1, 15] }, t(c, [2, 8]), t(c, [2, 9]), { 19: [1, 16] }, t(c, [2, 11]), { 1: [2, 1] }, { 1: [2, 5] }, t(r, [2, 2]), { 6: 17, 8: 5, 15: 6, 16: 7, 17: 8, 18: i, 20: r }, { 15: 18, 16: 7, 17: 8, 18: i, 20: r }, { 18: [1, 19] }, t(r, [2, 3]), { 12: [1, 20] }, t(c, [2, 10]), { 15: 21, 16: 7, 17: 8, 18: i, 20: r }, t([1, 5, 10], [2, 7])],
    defaultActions: { 11: [2, 1], 12: [2, 5] },
    parseError: function(s, l) {
      if (l.recoverable)
        this.trace(s);
      else {
        var u = new Error(s);
        throw u.hash = l, u;
      }
    },
    parse: function(s) {
      var l = this, u = [0], p = [], v = [null], y = [], _ = this.table, E = "", L = 0, A = 0, N = 2, C = 1, j = y.slice.call(arguments, 1), b = Object.create(this.lexer), M = { yy: {} };
      for (var $ in this.yy)
        Object.prototype.hasOwnProperty.call(this.yy, $) && (M.yy[$] = this.yy[$]);
      b.setInput(s, M.yy), M.yy.lexer = b, M.yy.parser = this, typeof b.yylloc == "undefined" && (b.yylloc = {});
      var P = b.yylloc;
      y.push(P);
      var I = b.options && b.options.ranges;
      typeof M.yy.parseError == "function" ? this.parseError = M.yy.parseError : this.parseError = Object.getPrototypeOf(this).parseError;
      function z() {
        var x;
        return x = p.pop() || b.lex() || C, typeof x != "number" && (x instanceof Array && (p = x, x = p.pop()), x = l.symbols_[x] || x), x;
      }
      for (var w, T, S, O, n = {}, f, e, a, o; ; ) {
        if (T = u[u.length - 1], this.defaultActions[T] ? S = this.defaultActions[T] : ((w === null || typeof w == "undefined") && (w = z()), S = _[T] && _[T][w]), typeof S == "undefined" || !S.length || !S[0]) {
          var m = "";
          o = [];
          for (f in _[T])
            this.terminals_[f] && f > N && o.push("'" + this.terminals_[f] + "'");
          b.showPosition ? m = "Parse error on line " + (L + 1) + `:
` + b.showPosition() + `
Expecting ` + o.join(", ") + ", got '" + (this.terminals_[w] || w) + "'" : m = "Parse error on line " + (L + 1) + ": Unexpected " + (w == C ? "end of input" : "'" + (this.terminals_[w] || w) + "'"), this.parseError(m, {
            text: b.match,
            token: this.terminals_[w] || w,
            line: b.yylineno,
            loc: P,
            expected: o
          });
        }
        if (S[0] instanceof Array && S.length > 1)
          throw new Error("Parse Error: multiple actions possible at state: " + T + ", token: " + w);
        switch (S[0]) {
          case 1:
            u.push(w), v.push(b.yytext), y.push(b.yylloc), u.push(S[1]), w = null, A = b.yyleng, E = b.yytext, L = b.yylineno, P = b.yylloc;
            break;
          case 2:
            if (e = this.productions_[S[1]][1], n.$ = v[v.length - e], n._$ = {
              first_line: y[y.length - (e || 1)].first_line,
              last_line: y[y.length - 1].last_line,
              first_column: y[y.length - (e || 1)].first_column,
              last_column: y[y.length - 1].last_column
            }, I && (n._$.range = [
              y[y.length - (e || 1)].range[0],
              y[y.length - 1].range[1]
            ]), O = this.performAction.apply(n, [
              E,
              A,
              L,
              M.yy,
              S[1],
              v,
              y
            ].concat(j)), typeof O != "undefined")
              return O;
            e && (u = u.slice(0, -1 * e * 2), v = v.slice(0, -1 * e), y = y.slice(0, -1 * e)), u.push(this.productions_[S[1]][0]), v.push(n.$), y.push(n._$), a = _[u[u.length - 2]][u[u.length - 1]], u.push(a);
            break;
          case 3:
            return !0;
        }
      }
      return !0;
    }
  }, k = function() {
    var g = {
      EOF: 1,
      parseError: function(l, u) {
        if (this.yy.parser)
          this.yy.parser.parseError(l, u);
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
        var l = s.length, u = s.split(/(?:\r\n?|\n)/g);
        this._input = s + this._input, this.yytext = this.yytext.substr(0, this.yytext.length - l), this.offset -= l;
        var p = this.match.split(/(?:\r\n?|\n)/g);
        this.match = this.match.substr(0, this.match.length - 1), this.matched = this.matched.substr(0, this.matched.length - 1), u.length - 1 && (this.yylineno -= u.length - 1);
        var v = this.yylloc.range;
        return this.yylloc = {
          first_line: this.yylloc.first_line,
          last_line: this.yylineno + 1,
          first_column: this.yylloc.first_column,
          last_column: u ? (u.length === p.length ? this.yylloc.first_column : 0) + p[p.length - u.length].length - u[0].length : this.yylloc.first_column - l
        }, this.options.ranges && (this.yylloc.range = [v[0], v[0] + this.yyleng - l]), this.yyleng = this.yytext.length, this;
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
        var u, p, v;
        if (this.options.backtrack_lexer && (v = {
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
        }, this.options.ranges && (v.yylloc.range = this.yylloc.range.slice(0))), p = s[0].match(/(?:\r\n?|\n).*/g), p && (this.yylineno += p.length), this.yylloc = {
          first_line: this.yylloc.last_line,
          last_line: this.yylineno + 1,
          first_column: this.yylloc.last_column,
          last_column: p ? p[p.length - 1].length - p[p.length - 1].match(/\r?\n?/)[0].length : this.yylloc.last_column + s[0].length
        }, this.yytext += s[0], this.match += s[0], this.matches = s, this.yyleng = this.yytext.length, this.options.ranges && (this.yylloc.range = [this.offset, this.offset += this.yyleng]), this._more = !1, this._backtrack = !1, this._input = this._input.slice(s[0].length), this.matched += s[0], u = this.performAction.call(this, this.yy, this, l, this.conditionStack[this.conditionStack.length - 1]), this.done && this._input && (this.done = !1), u)
          return u;
        if (this._backtrack) {
          for (var y in v)
            this[y] = v[y];
          return !1;
        }
        return !1;
      },
      // return next match in input
      next: function() {
        if (this.done)
          return this.EOF;
        this._input || (this.done = !0);
        var s, l, u, p;
        this._more || (this.yytext = "", this.match = "");
        for (var v = this._currentRules(), y = 0; y < v.length; y++)
          if (u = this._input.match(this.rules[v[y]]), u && (!l || u[0].length > l[0].length)) {
            if (l = u, p = y, this.options.backtrack_lexer) {
              if (s = this.test_match(u, v[y]), s !== !1)
                return s;
              if (this._backtrack) {
                l = !1;
                continue;
              } else
                return !1;
            } else if (!this.options.flex)
              break;
          }
        return l ? (s = this.test_match(l, v[p]), s !== !1 ? s : !1) : this._input === "" ? this.EOF : this.parseError("Lexical error on line " + (this.yylineno + 1) + `. Unrecognized text.
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
      performAction: function(l, u, p, v) {
        switch (p) {
          case 0:
            return this.pushState("csv"), 4;
          case 1:
            return 10;
          case 2:
            return 5;
          case 3:
            return 12;
          case 4:
            return this.pushState("escaped_text"), 18;
          case 5:
            return 20;
          case 6:
            return this.popState("escaped_text"), 18;
          case 7:
            return 19;
        }
      },
      rules: [/^(?:sankey-beta\b)/i, /^(?:$)/i, /^(?:((\u000D\u000A)|(\u000A)))/i, /^(?:(\u002C))/i, /^(?:(\u0022))/i, /^(?:([\u0020-\u0021\u0023-\u002B\u002D-\u007E])*)/i, /^(?:(\u0022)(?!(\u0022)))/i, /^(?:(([\u0020-\u0021\u0023-\u002B\u002D-\u007E])|(\u002C)|(\u000D)|(\u000A)|(\u0022)(\u0022))*)/i],
      conditions: { csv: { rules: [1, 2, 3, 4, 5, 6, 7], inclusive: !1 }, escaped_text: { rules: [6, 7], inclusive: !1 }, INITIAL: { rules: [0, 1, 2, 3, 4, 5, 6, 7], inclusive: !0 } }
    };
    return g;
  }();
  h.lexer = k;
  function d() {
    this.yy = {};
  }
  return d.prototype = h, h.Parser = d, new d();
}();
it.parser = it;
const H = it;
let X = [], Q = [], V = {};
const Xt = () => {
  X = [], Q = [], V = {}, wt();
};
class Qt {
  constructor(i, r, c = 0) {
    this.source = i, this.target = r, this.value = c;
  }
}
const Kt = (t, i, r) => {
  X.push(new Qt(t, i, r));
};
class Zt {
  constructor(i) {
    this.ID = i;
  }
}
const Jt = (t) => (t = St.sanitizeText(t, rt()), V[t] || (V[t] = new Zt(t), Q.push(V[t])), V[t]), te = () => Q, ee = () => X, ne = () => ({
  nodes: Q.map((t) => ({ id: t.ID })),
  links: X.map((t) => ({
    source: t.source.ID,
    target: t.target.ID,
    value: t.value
  }))
}), ie = {
  nodesMap: V,
  getConfig: () => rt().sankey,
  getNodes: te,
  getLinks: ee,
  getGraph: ne,
  addLink: Kt,
  findOrCreateNode: Jt,
  getAccTitle: mt,
  setAccTitle: kt,
  getAccDescription: _t,
  setAccDescription: xt,
  getDiagramTitle: vt,
  setDiagramTitle: bt,
  clear: Xt
}, pt = class st {
  static next(i) {
    return new st(i + ++st.count);
  }
  constructor(i) {
    this.id = i, this.href = `#${i}`;
  }
  toString() {
    return "url(" + this.href + ")";
  }
};
pt.count = 0;
let ft = pt;
const se = {
  left: Nt,
  right: Ct,
  center: Pt,
  justify: dt
}, re = function(t, i, r, c) {
  var z, w, T, S, O, n, f;
  const { securityLevel: h, sankey: k } = rt(), d = Lt.sankey;
  let g;
  h === "sandbox" && (g = G("#i" + i));
  const s = h === "sandbox" ? G(g.nodes()[0].contentDocument.body) : G("body"), l = h === "sandbox" ? s.select(`[id="${i}"]`) : G(`[id="${i}"]`), u = (z = k == null ? void 0 : k.width) != null ? z : d.width, p = (w = k == null ? void 0 : k.height) != null ? w : d.width, v = (T = k == null ? void 0 : k.useMaxWidth) != null ? T : d.useMaxWidth, y = (S = k == null ? void 0 : k.nodeAlignment) != null ? S : d.nodeAlignment, _ = (O = k == null ? void 0 : k.prefix) != null ? O : d.prefix, E = (n = k == null ? void 0 : k.suffix) != null ? n : d.suffix, L = (f = k == null ? void 0 : k.showValues) != null ? f : d.showValues, A = c.db.getGraph(), N = se[y], C = 10;
  jt().nodeId((e) => e.id).nodeWidth(C).nodePadding(10 + (L ? 15 : 0)).nodeAlign(N).extent([
    [0, 0],
    [u, p]
  ])(A);
  const b = At(Tt);
  l.append("g").attr("class", "nodes").selectAll(".node").data(A.nodes).join("g").attr("class", "node").attr("id", (e) => (e.uid = ft.next("node-")).id).attr("transform", function(e) {
    return "translate(" + e.x0 + "," + e.y0 + ")";
  }).attr("x", (e) => e.x0).attr("y", (e) => e.y0).append("rect").attr("height", (e) => e.y1 - e.y0).attr("width", (e) => e.x1 - e.x0).attr("fill", (e) => b(e.id));
  const M = ({ id: e, value: a }) => L ? `${e}
${_}${Math.round(a * 100) / 100}${E}` : e;
  l.append("g").attr("class", "node-labels").attr("font-family", "sans-serif").attr("font-size", 14).selectAll("text").data(A.nodes).join("text").attr("x", (e) => e.x0 < u / 2 ? e.x1 + 6 : e.x0 - 6).attr("y", (e) => (e.y1 + e.y0) / 2).attr("dy", `${L ? "0" : "0.35"}em`).attr("text-anchor", (e) => e.x0 < u / 2 ? "start" : "end").text(M);
  const $ = l.append("g").attr("class", "links").attr("fill", "none").attr("stroke-opacity", 0.5).selectAll(".link").data(A.links).join("g").attr("class", "link").style("mix-blend-mode", "multiply"), P = (k == null ? void 0 : k.linkColor) || "gradient";
  if (P === "gradient") {
    const e = $.append("linearGradient").attr("id", (a) => (a.uid = ft.next("linearGradient-")).id).attr("gradientUnits", "userSpaceOnUse").attr("x1", (a) => a.source.x1).attr("x2", (a) => a.target.x0);
    e.append("stop").attr("offset", "0%").attr("stop-color", (a) => b(a.source.id)), e.append("stop").attr("offset", "100%").attr("stop-color", (a) => b(a.target.id));
  }
  let I;
  switch (P) {
    case "gradient":
      I = (e) => e.uid;
      break;
    case "source":
      I = (e) => b(e.source.id);
      break;
    case "target":
      I = (e) => b(e.target.id);
      break;
    default:
      I = P;
  }
  $.append("path").attr("d", Ht()).attr("stroke", I).attr("stroke-width", (e) => Math.max(1, e.width)), Et(void 0, l, 0, v);
}, oe = {
  draw: re
}, le = (t) => t.replaceAll(/^[^\S\n\r]+|[^\S\n\r]+$/g, "").replaceAll(/([\n\r])+/g, `
`).trim(), ae = H.parse.bind(H);
H.parse = (t) => ae(le(t));
const ye = {
  parser: H,
  db: ie,
  renderer: oe
};
export {
  ye as diagram
};
