import { M as Re, N as je, R as Be, O as Ze, P as Cn, Q as Jt, T as Dn, c as ge, g as ye, e as xt, s as Mn, a as Sn, F as _n, G as Un, d as Yn, b as Fn, H as Ln, o as En, l as Zt, j as Pt, k as An, m as In, C as Wn } from "./08856db2.js";
import { b as On, t as _e, c as Hn, a as Nn, l as Vn } from "./f9d0127a.js";
import { i as Pn } from "./f9637058.js";
function zn(t, e) {
  let n;
  if (e === void 0)
    for (const r of t)
      r != null && (n < r || n === void 0 && r >= r) && (n = r);
  else {
    let r = -1;
    for (let i of t)
      (i = e(i, ++r, t)) != null && (n < i || n === void 0 && i >= i) && (n = i);
  }
  return n;
}
function Rn(t, e) {
  let n;
  if (e === void 0)
    for (const r of t)
      r != null && (n > r || n === void 0 && r >= r) && (n = r);
  else {
    let r = -1;
    for (let i of t)
      (i = e(i, ++r, t)) != null && (n > i || n === void 0 && i >= i) && (n = i);
  }
  return n;
}
function jn(t) {
  return t;
}
var Rt = 1, Kt = 2, le = 3, zt = 4, Ue = 1e-6;
function Bn(t) {
  return "translate(" + t + ",0)";
}
function Zn(t) {
  return "translate(0," + t + ")";
}
function Xn(t) {
  return (e) => +t(e);
}
function $n(t, e) {
  return e = Math.max(0, t.bandwidth() - e * 2) / 2, t.round() && (e = Math.round(e)), (n) => +t(n) + e;
}
function qn() {
  return !this.__axis;
}
function Xe(t, e) {
  var n = [], r = null, i = null, s = 6, a = 6, k = 3, Y = typeof window != "undefined" && window.devicePixelRatio > 1 ? 0 : 0.5, g = t === Rt || t === zt ? -1 : 1, b = t === zt || t === Kt ? "x" : "y", U = t === Rt || t === le ? Bn : Zn;
  function C(v) {
    var X = r == null ? e.ticks ? e.ticks.apply(e, n) : e.domain() : r, y = i == null ? e.tickFormat ? e.tickFormat.apply(e, n) : jn : i, L = Math.max(s, 0) + k, O = e.range(), W = +O[0] + Y, j = +O[O.length - 1] + Y, B = (e.bandwidth ? $n : Xn)(e.copy(), Y), G = v.selection ? v.selection() : v, x = G.selectAll(".domain").data([null]), A = G.selectAll(".tick").data(X, e).order(), T = A.exit(), F = A.enter().append("g").attr("class", "tick"), D = A.select("line"), w = A.select("text");
    x = x.merge(x.enter().insert("path", ".tick").attr("class", "domain").attr("stroke", "currentColor")), A = A.merge(F), D = D.merge(F.append("line").attr("stroke", "currentColor").attr(b + "2", g * s)), w = w.merge(F.append("text").attr("fill", "currentColor").attr(b, g * L).attr("dy", t === Rt ? "0em" : t === le ? "0.71em" : "0.32em")), v !== G && (x = x.transition(v), A = A.transition(v), D = D.transition(v), w = w.transition(v), T = T.transition(v).attr("opacity", Ue).attr("transform", function(o) {
      return isFinite(o = B(o)) ? U(o + Y) : this.getAttribute("transform");
    }), F.attr("opacity", Ue).attr("transform", function(o) {
      var d = this.parentNode.__axis;
      return U((d && isFinite(d = d(o)) ? d : B(o)) + Y);
    })), T.remove(), x.attr("d", t === zt || t === Kt ? a ? "M" + g * a + "," + W + "H" + Y + "V" + j + "H" + g * a : "M" + Y + "," + W + "V" + j : a ? "M" + W + "," + g * a + "V" + Y + "H" + j + "V" + g * a : "M" + W + "," + Y + "H" + j), A.attr("opacity", 1).attr("transform", function(o) {
      return U(B(o) + Y);
    }), D.attr(b + "2", g * s), w.attr(b, g * L).text(y), G.filter(qn).attr("fill", "none").attr("font-size", 10).attr("font-family", "sans-serif").attr("text-anchor", t === Kt ? "start" : t === zt ? "end" : "middle"), G.each(function() {
      this.__axis = B;
    });
  }
  return C.scale = function(v) {
    return arguments.length ? (e = v, C) : e;
  }, C.ticks = function() {
    return n = Array.from(arguments), C;
  }, C.tickArguments = function(v) {
    return arguments.length ? (n = v == null ? [] : Array.from(v), C) : n.slice();
  }, C.tickValues = function(v) {
    return arguments.length ? (r = v == null ? null : Array.from(v), C) : r && r.slice();
  }, C.tickFormat = function(v) {
    return arguments.length ? (i = v, C) : i;
  }, C.tickSize = function(v) {
    return arguments.length ? (s = a = +v, C) : s;
  }, C.tickSizeInner = function(v) {
    return arguments.length ? (s = +v, C) : s;
  }, C.tickSizeOuter = function(v) {
    return arguments.length ? (a = +v, C) : a;
  }, C.tickPadding = function(v) {
    return arguments.length ? (k = +v, C) : k;
  }, C.offset = function(v) {
    return arguments.length ? (Y = +v, C) : Y;
  }, C;
}
function Gn(t) {
  return Xe(Rt, t);
}
function Qn(t) {
  return Xe(le, t);
}
const Jn = Math.PI / 180, Kn = 180 / Math.PI, Xt = 18, $e = 0.96422, qe = 1, Ge = 0.82521, Qe = 4 / 29, wt = 6 / 29, Je = 3 * wt * wt, tr = wt * wt * wt;
function Ke(t) {
  if (t instanceof at)
    return new at(t.l, t.a, t.b, t.opacity);
  if (t instanceof lt)
    return tn(t);
  t instanceof Be || (t = Cn(t));
  var e = re(t.r), n = re(t.g), r = re(t.b), i = te((0.2225045 * e + 0.7168786 * n + 0.0606169 * r) / qe), s, a;
  return e === n && n === r ? s = a = i : (s = te((0.4360747 * e + 0.3850649 * n + 0.1430804 * r) / $e), a = te((0.0139322 * e + 0.0971045 * n + 0.7141733 * r) / Ge)), new at(116 * i - 16, 500 * (s - i), 200 * (i - a), t.opacity);
}
function er(t, e, n, r) {
  return arguments.length === 1 ? Ke(t) : new at(t, e, n, r == null ? 1 : r);
}
function at(t, e, n, r) {
  this.l = +t, this.a = +e, this.b = +n, this.opacity = +r;
}
Re(at, er, je(Ze, {
  brighter(t) {
    return new at(this.l + Xt * (t == null ? 1 : t), this.a, this.b, this.opacity);
  },
  darker(t) {
    return new at(this.l - Xt * (t == null ? 1 : t), this.a, this.b, this.opacity);
  },
  rgb() {
    var t = (this.l + 16) / 116, e = isNaN(this.a) ? t : t + this.a / 500, n = isNaN(this.b) ? t : t - this.b / 200;
    return e = $e * ee(e), t = qe * ee(t), n = Ge * ee(n), new Be(
      ne(3.1338561 * e - 1.6168667 * t - 0.4906146 * n),
      ne(-0.9787684 * e + 1.9161415 * t + 0.033454 * n),
      ne(0.0719453 * e - 0.2289914 * t + 1.4052427 * n),
      this.opacity
    );
  }
}));
function te(t) {
  return t > tr ? Math.pow(t, 1 / 3) : t / Je + Qe;
}
function ee(t) {
  return t > wt ? t * t * t : Je * (t - Qe);
}
function ne(t) {
  return 255 * (t <= 31308e-7 ? 12.92 * t : 1.055 * Math.pow(t, 1 / 2.4) - 0.055);
}
function re(t) {
  return (t /= 255) <= 0.04045 ? t / 12.92 : Math.pow((t + 0.055) / 1.055, 2.4);
}
function nr(t) {
  if (t instanceof lt)
    return new lt(t.h, t.c, t.l, t.opacity);
  if (t instanceof at || (t = Ke(t)), t.a === 0 && t.b === 0)
    return new lt(NaN, 0 < t.l && t.l < 100 ? 0 : NaN, t.l, t.opacity);
  var e = Math.atan2(t.b, t.a) * Kn;
  return new lt(e < 0 ? e + 360 : e, Math.sqrt(t.a * t.a + t.b * t.b), t.l, t.opacity);
}
function ue(t, e, n, r) {
  return arguments.length === 1 ? nr(t) : new lt(t, e, n, r == null ? 1 : r);
}
function lt(t, e, n, r) {
  this.h = +t, this.c = +e, this.l = +n, this.opacity = +r;
}
function tn(t) {
  if (isNaN(t.h))
    return new at(t.l, 0, 0, t.opacity);
  var e = t.h * Jn;
  return new at(t.l, Math.cos(e) * t.c, Math.sin(e) * t.c, t.opacity);
}
Re(lt, ue, je(Ze, {
  brighter(t) {
    return new lt(this.h, this.c, this.l + Xt * (t == null ? 1 : t), this.opacity);
  },
  darker(t) {
    return new lt(this.h, this.c, this.l - Xt * (t == null ? 1 : t), this.opacity);
  },
  rgb() {
    return tn(this).rgb();
  }
}));
function rr(t) {
  return function(e, n) {
    var r = t((e = ue(e)).h, (n = ue(n)).h), i = Jt(e.c, n.c), s = Jt(e.l, n.l), a = Jt(e.opacity, n.opacity);
    return function(k) {
      return e.h = r(k), e.c = i(k), e.l = s(k), e.opacity = a(k), e + "";
    };
  };
}
const ir = rr(Dn);
function sr(t, e) {
  t = t.slice();
  var n = 0, r = t.length - 1, i = t[n], s = t[r], a;
  return s < i && (a = n, n = r, r = a, a = i, i = s, s = a), t[n] = e.floor(i), t[r] = e.ceil(s), t;
}
const ie = /* @__PURE__ */ new Date(), se = /* @__PURE__ */ new Date();
function K(t, e, n, r) {
  function i(s) {
    return t(s = arguments.length === 0 ? /* @__PURE__ */ new Date() : /* @__PURE__ */ new Date(+s)), s;
  }
  return i.floor = (s) => (t(s = /* @__PURE__ */ new Date(+s)), s), i.ceil = (s) => (t(s = new Date(s - 1)), e(s, 1), t(s), s), i.round = (s) => {
    const a = i(s), k = i.ceil(s);
    return s - a < k - s ? a : k;
  }, i.offset = (s, a) => (e(s = /* @__PURE__ */ new Date(+s), a == null ? 1 : Math.floor(a)), s), i.range = (s, a, k) => {
    const Y = [];
    if (s = i.ceil(s), k = k == null ? 1 : Math.floor(k), !(s < a) || !(k > 0))
      return Y;
    let g;
    do
      Y.push(g = /* @__PURE__ */ new Date(+s)), e(s, k), t(s);
    while (g < s && s < a);
    return Y;
  }, i.filter = (s) => K((a) => {
    if (a >= a)
      for (; t(a), !s(a); )
        a.setTime(a - 1);
  }, (a, k) => {
    if (a >= a)
      if (k < 0)
        for (; ++k <= 0; )
          for (; e(a, -1), !s(a); )
            ;
      else
        for (; --k >= 0; )
          for (; e(a, 1), !s(a); )
            ;
  }), n && (i.count = (s, a) => (ie.setTime(+s), se.setTime(+a), t(ie), t(se), Math.floor(n(ie, se))), i.every = (s) => (s = Math.floor(s), !isFinite(s) || !(s > 0) ? null : s > 1 ? i.filter(r ? (a) => r(a) % s === 0 : (a) => i.count(0, a) % s === 0) : i)), i;
}
const Dt = K(() => {
}, (t, e) => {
  t.setTime(+t + e);
}, (t, e) => e - t);
Dt.every = (t) => (t = Math.floor(t), !isFinite(t) || !(t > 0) ? null : t > 1 ? K((e) => {
  e.setTime(Math.floor(e / t) * t);
}, (e, n) => {
  e.setTime(+e + n * t);
}, (e, n) => (n - e) / t) : Dt);
Dt.range;
const ut = 1e3, nt = ut * 60, ft = nt * 60, ht = ft * 24, ke = ht * 7, Ye = ht * 30, ae = ht * 365, mt = K((t) => {
  t.setTime(t - t.getMilliseconds());
}, (t, e) => {
  t.setTime(+t + e * ut);
}, (t, e) => (e - t) / ut, (t) => t.getUTCSeconds());
mt.range;
const Lt = K((t) => {
  t.setTime(t - t.getMilliseconds() - t.getSeconds() * ut);
}, (t, e) => {
  t.setTime(+t + e * nt);
}, (t, e) => (e - t) / nt, (t) => t.getMinutes());
Lt.range;
const ar = K((t) => {
  t.setUTCSeconds(0, 0);
}, (t, e) => {
  t.setTime(+t + e * nt);
}, (t, e) => (e - t) / nt, (t) => t.getUTCMinutes());
ar.range;
const Et = K((t) => {
  t.setTime(t - t.getMilliseconds() - t.getSeconds() * ut - t.getMinutes() * nt);
}, (t, e) => {
  t.setTime(+t + e * ft);
}, (t, e) => (e - t) / ft, (t) => t.getHours());
Et.range;
const or = K((t) => {
  t.setUTCMinutes(0, 0, 0);
}, (t, e) => {
  t.setTime(+t + e * ft);
}, (t, e) => (e - t) / ft, (t) => t.getUTCHours());
or.range;
const gt = K(
  (t) => t.setHours(0, 0, 0, 0),
  (t, e) => t.setDate(t.getDate() + e),
  (t, e) => (e - t - (e.getTimezoneOffset() - t.getTimezoneOffset()) * nt) / ht,
  (t) => t.getDate() - 1
);
gt.range;
const pe = K((t) => {
  t.setUTCHours(0, 0, 0, 0);
}, (t, e) => {
  t.setUTCDate(t.getUTCDate() + e);
}, (t, e) => (e - t) / ht, (t) => t.getUTCDate() - 1);
pe.range;
const cr = K((t) => {
  t.setUTCHours(0, 0, 0, 0);
}, (t, e) => {
  t.setUTCDate(t.getUTCDate() + e);
}, (t, e) => (e - t) / ht, (t) => Math.floor(t / ht));
cr.range;
function pt(t) {
  return K((e) => {
    e.setDate(e.getDate() - (e.getDay() + 7 - t) % 7), e.setHours(0, 0, 0, 0);
  }, (e, n) => {
    e.setDate(e.getDate() + n * 7);
  }, (e, n) => (n - e - (n.getTimezoneOffset() - e.getTimezoneOffset()) * nt) / ke);
}
const Wt = pt(0), At = pt(1), en = pt(2), nn = pt(3), yt = pt(4), rn = pt(5), sn = pt(6);
Wt.range;
At.range;
en.range;
nn.range;
yt.range;
rn.range;
sn.range;
function Tt(t) {
  return K((e) => {
    e.setUTCDate(e.getUTCDate() - (e.getUTCDay() + 7 - t) % 7), e.setUTCHours(0, 0, 0, 0);
  }, (e, n) => {
    e.setUTCDate(e.getUTCDate() + n * 7);
  }, (e, n) => (n - e) / ke);
}
const an = Tt(0), $t = Tt(1), lr = Tt(2), ur = Tt(3), Mt = Tt(4), fr = Tt(5), hr = Tt(6);
an.range;
$t.range;
lr.range;
ur.range;
Mt.range;
fr.range;
hr.range;
const It = K((t) => {
  t.setDate(1), t.setHours(0, 0, 0, 0);
}, (t, e) => {
  t.setMonth(t.getMonth() + e);
}, (t, e) => e.getMonth() - t.getMonth() + (e.getFullYear() - t.getFullYear()) * 12, (t) => t.getMonth());
It.range;
const dr = K((t) => {
  t.setUTCDate(1), t.setUTCHours(0, 0, 0, 0);
}, (t, e) => {
  t.setUTCMonth(t.getUTCMonth() + e);
}, (t, e) => e.getUTCMonth() - t.getUTCMonth() + (e.getUTCFullYear() - t.getUTCFullYear()) * 12, (t) => t.getUTCMonth());
dr.range;
const dt = K((t) => {
  t.setMonth(0, 1), t.setHours(0, 0, 0, 0);
}, (t, e) => {
  t.setFullYear(t.getFullYear() + e);
}, (t, e) => e.getFullYear() - t.getFullYear(), (t) => t.getFullYear());
dt.every = (t) => !isFinite(t = Math.floor(t)) || !(t > 0) ? null : K((e) => {
  e.setFullYear(Math.floor(e.getFullYear() / t) * t), e.setMonth(0, 1), e.setHours(0, 0, 0, 0);
}, (e, n) => {
  e.setFullYear(e.getFullYear() + n * t);
});
dt.range;
const kt = K((t) => {
  t.setUTCMonth(0, 1), t.setUTCHours(0, 0, 0, 0);
}, (t, e) => {
  t.setUTCFullYear(t.getUTCFullYear() + e);
}, (t, e) => e.getUTCFullYear() - t.getUTCFullYear(), (t) => t.getUTCFullYear());
kt.every = (t) => !isFinite(t = Math.floor(t)) || !(t > 0) ? null : K((e) => {
  e.setUTCFullYear(Math.floor(e.getUTCFullYear() / t) * t), e.setUTCMonth(0, 1), e.setUTCHours(0, 0, 0, 0);
}, (e, n) => {
  e.setUTCFullYear(e.getUTCFullYear() + n * t);
});
kt.range;
function mr(t, e, n, r, i, s) {
  const a = [
    [mt, 1, ut],
    [mt, 5, 5 * ut],
    [mt, 15, 15 * ut],
    [mt, 30, 30 * ut],
    [s, 1, nt],
    [s, 5, 5 * nt],
    [s, 15, 15 * nt],
    [s, 30, 30 * nt],
    [i, 1, ft],
    [i, 3, 3 * ft],
    [i, 6, 6 * ft],
    [i, 12, 12 * ft],
    [r, 1, ht],
    [r, 2, 2 * ht],
    [n, 1, ke],
    [e, 1, Ye],
    [e, 3, 3 * Ye],
    [t, 1, ae]
  ];
  function k(g, b, U) {
    const C = b < g;
    C && ([g, b] = [b, g]);
    const v = U && typeof U.range == "function" ? U : Y(g, b, U), X = v ? v.range(g, +b + 1) : [];
    return C ? X.reverse() : X;
  }
  function Y(g, b, U) {
    const C = Math.abs(b - g) / U, v = On(([, , L]) => L).right(a, C);
    if (v === a.length)
      return t.every(_e(g / ae, b / ae, U));
    if (v === 0)
      return Dt.every(Math.max(_e(g, b, U), 1));
    const [X, y] = a[C / a[v - 1][2] < a[v][2] / C ? v - 1 : v];
    return X.every(y);
  }
  return [k, Y];
}
const [gr, yr] = mr(dt, It, Wt, gt, Et, Lt);
function oe(t) {
  if (0 <= t.y && t.y < 100) {
    var e = new Date(-1, t.m, t.d, t.H, t.M, t.S, t.L);
    return e.setFullYear(t.y), e;
  }
  return new Date(t.y, t.m, t.d, t.H, t.M, t.S, t.L);
}
function ce(t) {
  if (0 <= t.y && t.y < 100) {
    var e = new Date(Date.UTC(-1, t.m, t.d, t.H, t.M, t.S, t.L));
    return e.setUTCFullYear(t.y), e;
  }
  return new Date(Date.UTC(t.y, t.m, t.d, t.H, t.M, t.S, t.L));
}
function Ut(t, e, n) {
  return { y: t, m: e, d: n, H: 0, M: 0, S: 0, L: 0 };
}
function kr(t) {
  var e = t.dateTime, n = t.date, r = t.time, i = t.periods, s = t.days, a = t.shortDays, k = t.months, Y = t.shortMonths, g = Yt(i), b = Ft(i), U = Yt(s), C = Ft(s), v = Yt(a), X = Ft(a), y = Yt(k), L = Ft(k), O = Yt(Y), W = Ft(Y), j = {
    a: c,
    A: Z,
    b: f,
    B: h,
    c: null,
    d: We,
    e: We,
    f: Vr,
    g: Gr,
    G: Jr,
    H: Or,
    I: Hr,
    j: Nr,
    L: on,
    m: Pr,
    M: zr,
    p: _,
    q: $,
    Q: Ne,
    s: Ve,
    S: Rr,
    u: jr,
    U: Br,
    V: Zr,
    w: Xr,
    W: $r,
    x: null,
    X: null,
    y: qr,
    Y: Qr,
    Z: Kr,
    "%": He
  }, B = {
    a: H,
    A: V,
    b: I,
    B: P,
    c: null,
    d: Oe,
    e: Oe,
    f: ri,
    g: di,
    G: gi,
    H: ti,
    I: ei,
    j: ni,
    L: ln,
    m: ii,
    M: si,
    p: it,
    q: rt,
    Q: Ne,
    s: Ve,
    S: ai,
    u: oi,
    U: ci,
    V: li,
    w: ui,
    W: fi,
    x: null,
    X: null,
    y: hi,
    Y: mi,
    Z: yi,
    "%": He
  }, G = {
    a: D,
    A: w,
    b: o,
    B: d,
    c: m,
    d: Ae,
    e: Ae,
    f: Er,
    g: Ee,
    G: Le,
    H: Ie,
    I: Ie,
    j: Ur,
    L: Lr,
    m: _r,
    M: Yr,
    p: F,
    q: Sr,
    Q: Ir,
    s: Wr,
    S: Fr,
    u: xr,
    U: wr,
    V: Cr,
    w: br,
    W: Dr,
    x: u,
    X: S,
    y: Ee,
    Y: Le,
    Z: Mr,
    "%": Ar
  };
  j.x = x(n, j), j.X = x(r, j), j.c = x(e, j), B.x = x(n, B), B.X = x(r, B), B.c = x(e, B);
  function x(p, E) {
    return function(M) {
      var l = [], R = -1, N = 0, q = p.length, Q, et, _t;
      for (M instanceof Date || (M = /* @__PURE__ */ new Date(+M)); ++R < q; )
        p.charCodeAt(R) === 37 && (l.push(p.slice(N, R)), (et = Fe[Q = p.charAt(++R)]) != null ? Q = p.charAt(++R) : et = Q === "e" ? " " : "0", (_t = E[Q]) && (Q = _t(M, et)), l.push(Q), N = R + 1);
      return l.push(p.slice(N, R)), l.join("");
    };
  }
  function A(p, E) {
    return function(M) {
      var l = Ut(1900, void 0, 1), R = T(l, p, M += "", 0), N, q;
      if (R != M.length)
        return null;
      if ("Q" in l)
        return new Date(l.Q);
      if ("s" in l)
        return new Date(l.s * 1e3 + ("L" in l ? l.L : 0));
      if (E && !("Z" in l) && (l.Z = 0), "p" in l && (l.H = l.H % 12 + l.p * 12), l.m === void 0 && (l.m = "q" in l ? l.q : 0), "V" in l) {
        if (l.V < 1 || l.V > 53)
          return null;
        "w" in l || (l.w = 1), "Z" in l ? (N = ce(Ut(l.y, 0, 1)), q = N.getUTCDay(), N = q > 4 || q === 0 ? $t.ceil(N) : $t(N), N = pe.offset(N, (l.V - 1) * 7), l.y = N.getUTCFullYear(), l.m = N.getUTCMonth(), l.d = N.getUTCDate() + (l.w + 6) % 7) : (N = oe(Ut(l.y, 0, 1)), q = N.getDay(), N = q > 4 || q === 0 ? At.ceil(N) : At(N), N = gt.offset(N, (l.V - 1) * 7), l.y = N.getFullYear(), l.m = N.getMonth(), l.d = N.getDate() + (l.w + 6) % 7);
      } else
        ("W" in l || "U" in l) && ("w" in l || (l.w = "u" in l ? l.u % 7 : "W" in l ? 1 : 0), q = "Z" in l ? ce(Ut(l.y, 0, 1)).getUTCDay() : oe(Ut(l.y, 0, 1)).getDay(), l.m = 0, l.d = "W" in l ? (l.w + 6) % 7 + l.W * 7 - (q + 5) % 7 : l.w + l.U * 7 - (q + 6) % 7);
      return "Z" in l ? (l.H += l.Z / 100 | 0, l.M += l.Z % 100, ce(l)) : oe(l);
    };
  }
  function T(p, E, M, l) {
    for (var R = 0, N = E.length, q = M.length, Q, et; R < N; ) {
      if (l >= q)
        return -1;
      if (Q = E.charCodeAt(R++), Q === 37) {
        if (Q = E.charAt(R++), et = G[Q in Fe ? E.charAt(R++) : Q], !et || (l = et(p, M, l)) < 0)
          return -1;
      } else if (Q != M.charCodeAt(l++))
        return -1;
    }
    return l;
  }
  function F(p, E, M) {
    var l = g.exec(E.slice(M));
    return l ? (p.p = b.get(l[0].toLowerCase()), M + l[0].length) : -1;
  }
  function D(p, E, M) {
    var l = v.exec(E.slice(M));
    return l ? (p.w = X.get(l[0].toLowerCase()), M + l[0].length) : -1;
  }
  function w(p, E, M) {
    var l = U.exec(E.slice(M));
    return l ? (p.w = C.get(l[0].toLowerCase()), M + l[0].length) : -1;
  }
  function o(p, E, M) {
    var l = O.exec(E.slice(M));
    return l ? (p.m = W.get(l[0].toLowerCase()), M + l[0].length) : -1;
  }
  function d(p, E, M) {
    var l = y.exec(E.slice(M));
    return l ? (p.m = L.get(l[0].toLowerCase()), M + l[0].length) : -1;
  }
  function m(p, E, M) {
    return T(p, e, E, M);
  }
  function u(p, E, M) {
    return T(p, n, E, M);
  }
  function S(p, E, M) {
    return T(p, r, E, M);
  }
  function c(p) {
    return a[p.getDay()];
  }
  function Z(p) {
    return s[p.getDay()];
  }
  function f(p) {
    return Y[p.getMonth()];
  }
  function h(p) {
    return k[p.getMonth()];
  }
  function _(p) {
    return i[+(p.getHours() >= 12)];
  }
  function $(p) {
    return 1 + ~~(p.getMonth() / 3);
  }
  function H(p) {
    return a[p.getUTCDay()];
  }
  function V(p) {
    return s[p.getUTCDay()];
  }
  function I(p) {
    return Y[p.getUTCMonth()];
  }
  function P(p) {
    return k[p.getUTCMonth()];
  }
  function it(p) {
    return i[+(p.getUTCHours() >= 12)];
  }
  function rt(p) {
    return 1 + ~~(p.getUTCMonth() / 3);
  }
  return {
    format: function(p) {
      var E = x(p += "", j);
      return E.toString = function() {
        return p;
      }, E;
    },
    parse: function(p) {
      var E = A(p += "", !1);
      return E.toString = function() {
        return p;
      }, E;
    },
    utcFormat: function(p) {
      var E = x(p += "", B);
      return E.toString = function() {
        return p;
      }, E;
    },
    utcParse: function(p) {
      var E = A(p += "", !0);
      return E.toString = function() {
        return p;
      }, E;
    }
  };
}
var Fe = { "-": "", _: " ", 0: "0" }, tt = /^\s*\d+/, pr = /^%/, Tr = /[\\^$*+?|[\]().{}]/g;
function z(t, e, n) {
  var r = t < 0 ? "-" : "", i = (r ? -t : t) + "", s = i.length;
  return r + (s < n ? new Array(n - s + 1).join(e) + i : i);
}
function vr(t) {
  return t.replace(Tr, "\\$&");
}
function Yt(t) {
  return new RegExp("^(?:" + t.map(vr).join("|") + ")", "i");
}
function Ft(t) {
  return new Map(t.map((e, n) => [e.toLowerCase(), n]));
}
function br(t, e, n) {
  var r = tt.exec(e.slice(n, n + 1));
  return r ? (t.w = +r[0], n + r[0].length) : -1;
}
function xr(t, e, n) {
  var r = tt.exec(e.slice(n, n + 1));
  return r ? (t.u = +r[0], n + r[0].length) : -1;
}
function wr(t, e, n) {
  var r = tt.exec(e.slice(n, n + 2));
  return r ? (t.U = +r[0], n + r[0].length) : -1;
}
function Cr(t, e, n) {
  var r = tt.exec(e.slice(n, n + 2));
  return r ? (t.V = +r[0], n + r[0].length) : -1;
}
function Dr(t, e, n) {
  var r = tt.exec(e.slice(n, n + 2));
  return r ? (t.W = +r[0], n + r[0].length) : -1;
}
function Le(t, e, n) {
  var r = tt.exec(e.slice(n, n + 4));
  return r ? (t.y = +r[0], n + r[0].length) : -1;
}
function Ee(t, e, n) {
  var r = tt.exec(e.slice(n, n + 2));
  return r ? (t.y = +r[0] + (+r[0] > 68 ? 1900 : 2e3), n + r[0].length) : -1;
}
function Mr(t, e, n) {
  var r = /^(Z)|([+-]\d\d)(?::?(\d\d))?/.exec(e.slice(n, n + 6));
  return r ? (t.Z = r[1] ? 0 : -(r[2] + (r[3] || "00")), n + r[0].length) : -1;
}
function Sr(t, e, n) {
  var r = tt.exec(e.slice(n, n + 1));
  return r ? (t.q = r[0] * 3 - 3, n + r[0].length) : -1;
}
function _r(t, e, n) {
  var r = tt.exec(e.slice(n, n + 2));
  return r ? (t.m = r[0] - 1, n + r[0].length) : -1;
}
function Ae(t, e, n) {
  var r = tt.exec(e.slice(n, n + 2));
  return r ? (t.d = +r[0], n + r[0].length) : -1;
}
function Ur(t, e, n) {
  var r = tt.exec(e.slice(n, n + 3));
  return r ? (t.m = 0, t.d = +r[0], n + r[0].length) : -1;
}
function Ie(t, e, n) {
  var r = tt.exec(e.slice(n, n + 2));
  return r ? (t.H = +r[0], n + r[0].length) : -1;
}
function Yr(t, e, n) {
  var r = tt.exec(e.slice(n, n + 2));
  return r ? (t.M = +r[0], n + r[0].length) : -1;
}
function Fr(t, e, n) {
  var r = tt.exec(e.slice(n, n + 2));
  return r ? (t.S = +r[0], n + r[0].length) : -1;
}
function Lr(t, e, n) {
  var r = tt.exec(e.slice(n, n + 3));
  return r ? (t.L = +r[0], n + r[0].length) : -1;
}
function Er(t, e, n) {
  var r = tt.exec(e.slice(n, n + 6));
  return r ? (t.L = Math.floor(r[0] / 1e3), n + r[0].length) : -1;
}
function Ar(t, e, n) {
  var r = pr.exec(e.slice(n, n + 1));
  return r ? n + r[0].length : -1;
}
function Ir(t, e, n) {
  var r = tt.exec(e.slice(n));
  return r ? (t.Q = +r[0], n + r[0].length) : -1;
}
function Wr(t, e, n) {
  var r = tt.exec(e.slice(n));
  return r ? (t.s = +r[0], n + r[0].length) : -1;
}
function We(t, e) {
  return z(t.getDate(), e, 2);
}
function Or(t, e) {
  return z(t.getHours(), e, 2);
}
function Hr(t, e) {
  return z(t.getHours() % 12 || 12, e, 2);
}
function Nr(t, e) {
  return z(1 + gt.count(dt(t), t), e, 3);
}
function on(t, e) {
  return z(t.getMilliseconds(), e, 3);
}
function Vr(t, e) {
  return on(t, e) + "000";
}
function Pr(t, e) {
  return z(t.getMonth() + 1, e, 2);
}
function zr(t, e) {
  return z(t.getMinutes(), e, 2);
}
function Rr(t, e) {
  return z(t.getSeconds(), e, 2);
}
function jr(t) {
  var e = t.getDay();
  return e === 0 ? 7 : e;
}
function Br(t, e) {
  return z(Wt.count(dt(t) - 1, t), e, 2);
}
function cn(t) {
  var e = t.getDay();
  return e >= 4 || e === 0 ? yt(t) : yt.ceil(t);
}
function Zr(t, e) {
  return t = cn(t), z(yt.count(dt(t), t) + (dt(t).getDay() === 4), e, 2);
}
function Xr(t) {
  return t.getDay();
}
function $r(t, e) {
  return z(At.count(dt(t) - 1, t), e, 2);
}
function qr(t, e) {
  return z(t.getFullYear() % 100, e, 2);
}
function Gr(t, e) {
  return t = cn(t), z(t.getFullYear() % 100, e, 2);
}
function Qr(t, e) {
  return z(t.getFullYear() % 1e4, e, 4);
}
function Jr(t, e) {
  var n = t.getDay();
  return t = n >= 4 || n === 0 ? yt(t) : yt.ceil(t), z(t.getFullYear() % 1e4, e, 4);
}
function Kr(t) {
  var e = t.getTimezoneOffset();
  return (e > 0 ? "-" : (e *= -1, "+")) + z(e / 60 | 0, "0", 2) + z(e % 60, "0", 2);
}
function Oe(t, e) {
  return z(t.getUTCDate(), e, 2);
}
function ti(t, e) {
  return z(t.getUTCHours(), e, 2);
}
function ei(t, e) {
  return z(t.getUTCHours() % 12 || 12, e, 2);
}
function ni(t, e) {
  return z(1 + pe.count(kt(t), t), e, 3);
}
function ln(t, e) {
  return z(t.getUTCMilliseconds(), e, 3);
}
function ri(t, e) {
  return ln(t, e) + "000";
}
function ii(t, e) {
  return z(t.getUTCMonth() + 1, e, 2);
}
function si(t, e) {
  return z(t.getUTCMinutes(), e, 2);
}
function ai(t, e) {
  return z(t.getUTCSeconds(), e, 2);
}
function oi(t) {
  var e = t.getUTCDay();
  return e === 0 ? 7 : e;
}
function ci(t, e) {
  return z(an.count(kt(t) - 1, t), e, 2);
}
function un(t) {
  var e = t.getUTCDay();
  return e >= 4 || e === 0 ? Mt(t) : Mt.ceil(t);
}
function li(t, e) {
  return t = un(t), z(Mt.count(kt(t), t) + (kt(t).getUTCDay() === 4), e, 2);
}
function ui(t) {
  return t.getUTCDay();
}
function fi(t, e) {
  return z($t.count(kt(t) - 1, t), e, 2);
}
function hi(t, e) {
  return z(t.getUTCFullYear() % 100, e, 2);
}
function di(t, e) {
  return t = un(t), z(t.getUTCFullYear() % 100, e, 2);
}
function mi(t, e) {
  return z(t.getUTCFullYear() % 1e4, e, 4);
}
function gi(t, e) {
  var n = t.getUTCDay();
  return t = n >= 4 || n === 0 ? Mt(t) : Mt.ceil(t), z(t.getUTCFullYear() % 1e4, e, 4);
}
function yi() {
  return "+0000";
}
function He() {
  return "%";
}
function Ne(t) {
  return +t;
}
function Ve(t) {
  return Math.floor(+t / 1e3);
}
var bt, qt;
ki({
  dateTime: "%x, %X",
  date: "%-m/%-d/%Y",
  time: "%-I:%M:%S %p",
  periods: ["AM", "PM"],
  days: ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"],
  shortDays: ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"],
  months: ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"],
  shortMonths: ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"]
});
function ki(t) {
  return bt = kr(t), qt = bt.format, bt.parse, bt.utcFormat, bt.utcParse, bt;
}
function pi(t) {
  return new Date(t);
}
function Ti(t) {
  return t instanceof Date ? +t : +/* @__PURE__ */ new Date(+t);
}
function fn(t, e, n, r, i, s, a, k, Y, g) {
  var b = Hn(), U = b.invert, C = b.domain, v = g(".%L"), X = g(":%S"), y = g("%I:%M"), L = g("%I %p"), O = g("%a %d"), W = g("%b %d"), j = g("%B"), B = g("%Y");
  function G(x) {
    return (Y(x) < x ? v : k(x) < x ? X : a(x) < x ? y : s(x) < x ? L : r(x) < x ? i(x) < x ? O : W : n(x) < x ? j : B)(x);
  }
  return b.invert = function(x) {
    return new Date(U(x));
  }, b.domain = function(x) {
    return arguments.length ? C(Array.from(x, Ti)) : C().map(pi);
  }, b.ticks = function(x) {
    var A = C();
    return t(A[0], A[A.length - 1], x == null ? 10 : x);
  }, b.tickFormat = function(x, A) {
    return A == null ? G : g(A);
  }, b.nice = function(x) {
    var A = C();
    return (!x || typeof x.range != "function") && (x = e(A[0], A[A.length - 1], x == null ? 10 : x)), x ? C(sr(A, x)) : b;
  }, b.copy = function() {
    return Nn(b, fn(t, e, n, r, i, s, a, k, Y, g));
  }, b;
}
function vi() {
  return Pn.apply(fn(gr, yr, dt, It, Wt, gt, Et, Lt, mt, qt).domain([new Date(2e3, 0, 1), new Date(2e3, 0, 2)]), arguments);
}
var hn = { exports: {} };
(function(t, e) {
  (function(n, r) {
    t.exports = r();
  })(ge, function() {
    var n = "day";
    return function(r, i, s) {
      var a = function(g) {
        return g.add(4 - g.isoWeekday(), n);
      }, k = i.prototype;
      k.isoWeekYear = function() {
        return a(this).year();
      }, k.isoWeek = function(g) {
        if (!this.$utils().u(g))
          return this.add(7 * (g - this.isoWeek()), n);
        var b, U, C, v, X = a(this), y = (b = this.isoWeekYear(), U = this.$u, C = (U ? s.utc : s)().year(b).startOf("year"), v = 4 - C.isoWeekday(), C.isoWeekday() > 4 && (v += 7), C.add(v, n));
        return X.diff(y, "week") + 1;
      }, k.isoWeekday = function(g) {
        return this.$utils().u(g) ? this.day() || 7 : this.day(this.day() % 7 ? g : g - 7);
      };
      var Y = k.startOf;
      k.startOf = function(g, b) {
        var U = this.$utils(), C = !!U.u(b) || b;
        return U.p(g) === "isoweek" ? C ? this.date(this.date() - (this.isoWeekday() - 1)).startOf("day") : this.date(this.date() - 1 - (this.isoWeekday() - 1) + 7).endOf("day") : Y.bind(this)(g, b);
      };
    };
  });
})(hn);
var bi = hn.exports;
const xi = /* @__PURE__ */ ye(bi);
var dn = { exports: {} };
(function(t, e) {
  (function(n, r) {
    t.exports = r();
  })(ge, function() {
    var n = { LTS: "h:mm:ss A", LT: "h:mm A", L: "MM/DD/YYYY", LL: "MMMM D, YYYY", LLL: "MMMM D, YYYY h:mm A", LLLL: "dddd, MMMM D, YYYY h:mm A" }, r = /(\[[^[]*\])|([-_:/.,()\s]+)|(A|a|YYYY|YY?|MM?M?M?|Do|DD?|hh?|HH?|mm?|ss?|S{1,3}|z|ZZ?)/g, i = /\d\d/, s = /\d\d?/, a = /\d*[^-_:/,()\s\d]+/, k = {}, Y = function(y) {
      return (y = +y) + (y > 68 ? 1900 : 2e3);
    }, g = function(y) {
      return function(L) {
        this[y] = +L;
      };
    }, b = [/[+-]\d\d:?(\d\d)?|Z/, function(y) {
      (this.zone || (this.zone = {})).offset = function(L) {
        if (!L || L === "Z")
          return 0;
        var O = L.match(/([+-]|\d\d)/g), W = 60 * O[1] + (+O[2] || 0);
        return W === 0 ? 0 : O[0] === "+" ? -W : W;
      }(y);
    }], U = function(y) {
      var L = k[y];
      return L && (L.indexOf ? L : L.s.concat(L.f));
    }, C = function(y, L) {
      var O, W = k.meridiem;
      if (W) {
        for (var j = 1; j <= 24; j += 1)
          if (y.indexOf(W(j, 0, L)) > -1) {
            O = j > 12;
            break;
          }
      } else
        O = y === (L ? "pm" : "PM");
      return O;
    }, v = { A: [a, function(y) {
      this.afternoon = C(y, !1);
    }], a: [a, function(y) {
      this.afternoon = C(y, !0);
    }], S: [/\d/, function(y) {
      this.milliseconds = 100 * +y;
    }], SS: [i, function(y) {
      this.milliseconds = 10 * +y;
    }], SSS: [/\d{3}/, function(y) {
      this.milliseconds = +y;
    }], s: [s, g("seconds")], ss: [s, g("seconds")], m: [s, g("minutes")], mm: [s, g("minutes")], H: [s, g("hours")], h: [s, g("hours")], HH: [s, g("hours")], hh: [s, g("hours")], D: [s, g("day")], DD: [i, g("day")], Do: [a, function(y) {
      var L = k.ordinal, O = y.match(/\d+/);
      if (this.day = O[0], L)
        for (var W = 1; W <= 31; W += 1)
          L(W).replace(/\[|\]/g, "") === y && (this.day = W);
    }], M: [s, g("month")], MM: [i, g("month")], MMM: [a, function(y) {
      var L = U("months"), O = (U("monthsShort") || L.map(function(W) {
        return W.slice(0, 3);
      })).indexOf(y) + 1;
      if (O < 1)
        throw new Error();
      this.month = O % 12 || O;
    }], MMMM: [a, function(y) {
      var L = U("months").indexOf(y) + 1;
      if (L < 1)
        throw new Error();
      this.month = L % 12 || L;
    }], Y: [/[+-]?\d+/, g("year")], YY: [i, function(y) {
      this.year = Y(y);
    }], YYYY: [/\d{4}/, g("year")], Z: b, ZZ: b };
    function X(y) {
      var L, O;
      L = y, O = k && k.formats;
      for (var W = (y = L.replace(/(\[[^\]]+])|(LTS?|l{1,4}|L{1,4})/g, function(F, D, w) {
        var o = w && w.toUpperCase();
        return D || O[w] || n[w] || O[o].replace(/(\[[^\]]+])|(MMMM|MM|DD|dddd)/g, function(d, m, u) {
          return m || u.slice(1);
        });
      })).match(r), j = W.length, B = 0; B < j; B += 1) {
        var G = W[B], x = v[G], A = x && x[0], T = x && x[1];
        W[B] = T ? { regex: A, parser: T } : G.replace(/^\[|\]$/g, "");
      }
      return function(F) {
        for (var D = {}, w = 0, o = 0; w < j; w += 1) {
          var d = W[w];
          if (typeof d == "string")
            o += d.length;
          else {
            var m = d.regex, u = d.parser, S = F.slice(o), c = m.exec(S)[0];
            u.call(D, c), F = F.replace(c, "");
          }
        }
        return function(Z) {
          var f = Z.afternoon;
          if (f !== void 0) {
            var h = Z.hours;
            f ? h < 12 && (Z.hours += 12) : h === 12 && (Z.hours = 0), delete Z.afternoon;
          }
        }(D), D;
      };
    }
    return function(y, L, O) {
      O.p.customParseFormat = !0, y && y.parseTwoDigitYear && (Y = y.parseTwoDigitYear);
      var W = L.prototype, j = W.parse;
      W.parse = function(B) {
        var G = B.date, x = B.utc, A = B.args;
        this.$u = x;
        var T = A[1];
        if (typeof T == "string") {
          var F = A[2] === !0, D = A[3] === !0, w = F || D, o = A[2];
          D && (o = A[2]), k = this.$locale(), !F && o && (k = O.Ls[o]), this.$d = function(S, c, Z) {
            try {
              if (["x", "X"].indexOf(c) > -1)
                return new Date((c === "X" ? 1e3 : 1) * S);
              var f = X(c)(S), h = f.year, _ = f.month, $ = f.day, H = f.hours, V = f.minutes, I = f.seconds, P = f.milliseconds, it = f.zone, rt = /* @__PURE__ */ new Date(), p = $ || (h || _ ? 1 : rt.getDate()), E = h || rt.getFullYear(), M = 0;
              h && !_ || (M = _ > 0 ? _ - 1 : rt.getMonth());
              var l = H || 0, R = V || 0, N = I || 0, q = P || 0;
              return it ? new Date(Date.UTC(E, M, p, l, R, N, q + 60 * it.offset * 1e3)) : Z ? new Date(Date.UTC(E, M, p, l, R, N, q)) : new Date(E, M, p, l, R, N, q);
            } catch (Q) {
              return /* @__PURE__ */ new Date("");
            }
          }(G, T, x), this.init(), o && o !== !0 && (this.$L = this.locale(o).$L), w && G != this.format(T) && (this.$d = /* @__PURE__ */ new Date("")), k = {};
        } else if (T instanceof Array)
          for (var d = T.length, m = 1; m <= d; m += 1) {
            A[1] = T[m - 1];
            var u = O.apply(this, A);
            if (u.isValid()) {
              this.$d = u.$d, this.$L = u.$L, this.init();
              break;
            }
            m === d && (this.$d = /* @__PURE__ */ new Date(""));
          }
        else
          j.call(this, B);
      };
    };
  });
})(dn);
var wi = dn.exports;
const Ci = /* @__PURE__ */ ye(wi);
var mn = { exports: {} };
(function(t, e) {
  (function(n, r) {
    t.exports = r();
  })(ge, function() {
    return function(n, r) {
      var i = r.prototype, s = i.format;
      i.format = function(a) {
        var k = this, Y = this.$locale();
        if (!this.isValid())
          return s.bind(this)(a);
        var g = this.$utils(), b = (a || "YYYY-MM-DDTHH:mm:ssZ").replace(/\[([^\]]+)]|Q|wo|ww|w|WW|W|zzz|z|gggg|GGGG|Do|X|x|k{1,2}|S/g, function(U) {
          switch (U) {
            case "Q":
              return Math.ceil((k.$M + 1) / 3);
            case "Do":
              return Y.ordinal(k.$D);
            case "gggg":
              return k.weekYear();
            case "GGGG":
              return k.isoWeekYear();
            case "wo":
              return Y.ordinal(k.week(), "W");
            case "w":
            case "ww":
              return g.s(k.week(), U === "w" ? 1 : 2, "0");
            case "W":
            case "WW":
              return g.s(k.isoWeek(), U === "W" ? 1 : 2, "0");
            case "k":
            case "kk":
              return g.s(String(k.$H === 0 ? 24 : k.$H), U === "k" ? 1 : 2, "0");
            case "X":
              return Math.floor(k.$d.getTime() / 1e3);
            case "x":
              return k.$d.getTime();
            case "z":
              return "[" + k.offsetName() + "]";
            case "zzz":
              return "[" + k.offsetName("long") + "]";
            default:
              return U;
          }
        });
        return s.bind(this)(b);
      };
    };
  });
})(mn);
var Di = mn.exports;
const Mi = /* @__PURE__ */ ye(Di);
var fe = function() {
  var t = function(w, o, d, m) {
    for (d = d || {}, m = w.length; m--; d[w[m]] = o)
      ;
    return d;
  }, e = [6, 8, 10, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24, 25, 26, 27, 28, 30, 32, 33, 35, 37], n = [1, 25], r = [1, 26], i = [1, 27], s = [1, 28], a = [1, 29], k = [1, 30], Y = [1, 31], g = [1, 9], b = [1, 10], U = [1, 11], C = [1, 12], v = [1, 13], X = [1, 14], y = [1, 15], L = [1, 16], O = [1, 18], W = [1, 19], j = [1, 20], B = [1, 21], G = [1, 22], x = [1, 24], A = [1, 32], T = {
    trace: function() {
    },
    yy: {},
    symbols_: { error: 2, start: 3, gantt: 4, document: 5, EOF: 6, line: 7, SPACE: 8, statement: 9, NL: 10, weekday: 11, weekday_monday: 12, weekday_tuesday: 13, weekday_wednesday: 14, weekday_thursday: 15, weekday_friday: 16, weekday_saturday: 17, weekday_sunday: 18, dateFormat: 19, inclusiveEndDates: 20, topAxis: 21, axisFormat: 22, tickInterval: 23, excludes: 24, includes: 25, todayMarker: 26, title: 27, acc_title: 28, acc_title_value: 29, acc_descr: 30, acc_descr_value: 31, acc_descr_multiline_value: 32, section: 33, clickStatement: 34, taskTxt: 35, taskData: 36, click: 37, callbackname: 38, callbackargs: 39, href: 40, clickStatementDebug: 41, $accept: 0, $end: 1 },
    terminals_: { 2: "error", 4: "gantt", 6: "EOF", 8: "SPACE", 10: "NL", 12: "weekday_monday", 13: "weekday_tuesday", 14: "weekday_wednesday", 15: "weekday_thursday", 16: "weekday_friday", 17: "weekday_saturday", 18: "weekday_sunday", 19: "dateFormat", 20: "inclusiveEndDates", 21: "topAxis", 22: "axisFormat", 23: "tickInterval", 24: "excludes", 25: "includes", 26: "todayMarker", 27: "title", 28: "acc_title", 29: "acc_title_value", 30: "acc_descr", 31: "acc_descr_value", 32: "acc_descr_multiline_value", 33: "section", 35: "taskTxt", 36: "taskData", 37: "click", 38: "callbackname", 39: "callbackargs", 40: "href" },
    productions_: [0, [3, 3], [5, 0], [5, 2], [7, 2], [7, 1], [7, 1], [7, 1], [11, 1], [11, 1], [11, 1], [11, 1], [11, 1], [11, 1], [11, 1], [9, 1], [9, 1], [9, 1], [9, 1], [9, 1], [9, 1], [9, 1], [9, 1], [9, 1], [9, 1], [9, 2], [9, 2], [9, 1], [9, 1], [9, 1], [9, 2], [34, 2], [34, 3], [34, 3], [34, 4], [34, 3], [34, 4], [34, 2], [41, 2], [41, 3], [41, 3], [41, 4], [41, 3], [41, 4], [41, 2]],
    performAction: function(o, d, m, u, S, c, Z) {
      var f = c.length - 1;
      switch (S) {
        case 1:
          return c[f - 1];
        case 2:
          this.$ = [];
          break;
        case 3:
          c[f - 1].push(c[f]), this.$ = c[f - 1];
          break;
        case 4:
        case 5:
          this.$ = c[f];
          break;
        case 6:
        case 7:
          this.$ = [];
          break;
        case 8:
          u.setWeekday("monday");
          break;
        case 9:
          u.setWeekday("tuesday");
          break;
        case 10:
          u.setWeekday("wednesday");
          break;
        case 11:
          u.setWeekday("thursday");
          break;
        case 12:
          u.setWeekday("friday");
          break;
        case 13:
          u.setWeekday("saturday");
          break;
        case 14:
          u.setWeekday("sunday");
          break;
        case 15:
          u.setDateFormat(c[f].substr(11)), this.$ = c[f].substr(11);
          break;
        case 16:
          u.enableInclusiveEndDates(), this.$ = c[f].substr(18);
          break;
        case 17:
          u.TopAxis(), this.$ = c[f].substr(8);
          break;
        case 18:
          u.setAxisFormat(c[f].substr(11)), this.$ = c[f].substr(11);
          break;
        case 19:
          u.setTickInterval(c[f].substr(13)), this.$ = c[f].substr(13);
          break;
        case 20:
          u.setExcludes(c[f].substr(9)), this.$ = c[f].substr(9);
          break;
        case 21:
          u.setIncludes(c[f].substr(9)), this.$ = c[f].substr(9);
          break;
        case 22:
          u.setTodayMarker(c[f].substr(12)), this.$ = c[f].substr(12);
          break;
        case 24:
          u.setDiagramTitle(c[f].substr(6)), this.$ = c[f].substr(6);
          break;
        case 25:
          this.$ = c[f].trim(), u.setAccTitle(this.$);
          break;
        case 26:
        case 27:
          this.$ = c[f].trim(), u.setAccDescription(this.$);
          break;
        case 28:
          u.addSection(c[f].substr(8)), this.$ = c[f].substr(8);
          break;
        case 30:
          u.addTask(c[f - 1], c[f]), this.$ = "task";
          break;
        case 31:
          this.$ = c[f - 1], u.setClickEvent(c[f - 1], c[f], null);
          break;
        case 32:
          this.$ = c[f - 2], u.setClickEvent(c[f - 2], c[f - 1], c[f]);
          break;
        case 33:
          this.$ = c[f - 2], u.setClickEvent(c[f - 2], c[f - 1], null), u.setLink(c[f - 2], c[f]);
          break;
        case 34:
          this.$ = c[f - 3], u.setClickEvent(c[f - 3], c[f - 2], c[f - 1]), u.setLink(c[f - 3], c[f]);
          break;
        case 35:
          this.$ = c[f - 2], u.setClickEvent(c[f - 2], c[f], null), u.setLink(c[f - 2], c[f - 1]);
          break;
        case 36:
          this.$ = c[f - 3], u.setClickEvent(c[f - 3], c[f - 1], c[f]), u.setLink(c[f - 3], c[f - 2]);
          break;
        case 37:
          this.$ = c[f - 1], u.setLink(c[f - 1], c[f]);
          break;
        case 38:
        case 44:
          this.$ = c[f - 1] + " " + c[f];
          break;
        case 39:
        case 40:
        case 42:
          this.$ = c[f - 2] + " " + c[f - 1] + " " + c[f];
          break;
        case 41:
        case 43:
          this.$ = c[f - 3] + " " + c[f - 2] + " " + c[f - 1] + " " + c[f];
          break;
      }
    },
    table: [{ 3: 1, 4: [1, 2] }, { 1: [3] }, t(e, [2, 2], { 5: 3 }), { 6: [1, 4], 7: 5, 8: [1, 6], 9: 7, 10: [1, 8], 11: 17, 12: n, 13: r, 14: i, 15: s, 16: a, 17: k, 18: Y, 19: g, 20: b, 21: U, 22: C, 23: v, 24: X, 25: y, 26: L, 27: O, 28: W, 30: j, 32: B, 33: G, 34: 23, 35: x, 37: A }, t(e, [2, 7], { 1: [2, 1] }), t(e, [2, 3]), { 9: 33, 11: 17, 12: n, 13: r, 14: i, 15: s, 16: a, 17: k, 18: Y, 19: g, 20: b, 21: U, 22: C, 23: v, 24: X, 25: y, 26: L, 27: O, 28: W, 30: j, 32: B, 33: G, 34: 23, 35: x, 37: A }, t(e, [2, 5]), t(e, [2, 6]), t(e, [2, 15]), t(e, [2, 16]), t(e, [2, 17]), t(e, [2, 18]), t(e, [2, 19]), t(e, [2, 20]), t(e, [2, 21]), t(e, [2, 22]), t(e, [2, 23]), t(e, [2, 24]), { 29: [1, 34] }, { 31: [1, 35] }, t(e, [2, 27]), t(e, [2, 28]), t(e, [2, 29]), { 36: [1, 36] }, t(e, [2, 8]), t(e, [2, 9]), t(e, [2, 10]), t(e, [2, 11]), t(e, [2, 12]), t(e, [2, 13]), t(e, [2, 14]), { 38: [1, 37], 40: [1, 38] }, t(e, [2, 4]), t(e, [2, 25]), t(e, [2, 26]), t(e, [2, 30]), t(e, [2, 31], { 39: [1, 39], 40: [1, 40] }), t(e, [2, 37], { 38: [1, 41] }), t(e, [2, 32], { 40: [1, 42] }), t(e, [2, 33]), t(e, [2, 35], { 39: [1, 43] }), t(e, [2, 34]), t(e, [2, 36])],
    defaultActions: {},
    parseError: function(o, d) {
      if (d.recoverable)
        this.trace(o);
      else {
        var m = new Error(o);
        throw m.hash = d, m;
      }
    },
    parse: function(o) {
      var d = this, m = [0], u = [], S = [null], c = [], Z = this.table, f = "", h = 0, _ = 0, $ = 2, H = 1, V = c.slice.call(arguments, 1), I = Object.create(this.lexer), P = { yy: {} };
      for (var it in this.yy)
        Object.prototype.hasOwnProperty.call(this.yy, it) && (P.yy[it] = this.yy[it]);
      I.setInput(o, P.yy), P.yy.lexer = I, P.yy.parser = this, typeof I.yylloc == "undefined" && (I.yylloc = {});
      var rt = I.yylloc;
      c.push(rt);
      var p = I.options && I.options.ranges;
      typeof P.yy.parseError == "function" ? this.parseError = P.yy.parseError : this.parseError = Object.getPrototypeOf(this).parseError;
      function E() {
        var ot;
        return ot = u.pop() || I.lex() || H, typeof ot != "number" && (ot instanceof Array && (u = ot, ot = u.pop()), ot = d.symbols_[ot] || ot), ot;
      }
      for (var M, l, R, N, q = {}, Q, et, _t, Vt; ; ) {
        if (l = m[m.length - 1], this.defaultActions[l] ? R = this.defaultActions[l] : ((M === null || typeof M == "undefined") && (M = E()), R = Z[l] && Z[l][M]), typeof R == "undefined" || !R.length || !R[0]) {
          var Qt = "";
          Vt = [];
          for (Q in Z[l])
            this.terminals_[Q] && Q > $ && Vt.push("'" + this.terminals_[Q] + "'");
          I.showPosition ? Qt = "Parse error on line " + (h + 1) + `:
` + I.showPosition() + `
Expecting ` + Vt.join(", ") + ", got '" + (this.terminals_[M] || M) + "'" : Qt = "Parse error on line " + (h + 1) + ": Unexpected " + (M == H ? "end of input" : "'" + (this.terminals_[M] || M) + "'"), this.parseError(Qt, {
            text: I.match,
            token: this.terminals_[M] || M,
            line: I.yylineno,
            loc: rt,
            expected: Vt
          });
        }
        if (R[0] instanceof Array && R.length > 1)
          throw new Error("Parse Error: multiple actions possible at state: " + l + ", token: " + M);
        switch (R[0]) {
          case 1:
            m.push(M), S.push(I.yytext), c.push(I.yylloc), m.push(R[1]), M = null, _ = I.yyleng, f = I.yytext, h = I.yylineno, rt = I.yylloc;
            break;
          case 2:
            if (et = this.productions_[R[1]][1], q.$ = S[S.length - et], q._$ = {
              first_line: c[c.length - (et || 1)].first_line,
              last_line: c[c.length - 1].last_line,
              first_column: c[c.length - (et || 1)].first_column,
              last_column: c[c.length - 1].last_column
            }, p && (q._$.range = [
              c[c.length - (et || 1)].range[0],
              c[c.length - 1].range[1]
            ]), N = this.performAction.apply(q, [
              f,
              _,
              h,
              P.yy,
              R[1],
              S,
              c
            ].concat(V)), typeof N != "undefined")
              return N;
            et && (m = m.slice(0, -1 * et * 2), S = S.slice(0, -1 * et), c = c.slice(0, -1 * et)), m.push(this.productions_[R[1]][0]), S.push(q.$), c.push(q._$), _t = Z[m[m.length - 2]][m[m.length - 1]], m.push(_t);
            break;
          case 3:
            return !0;
        }
      }
      return !0;
    }
  }, F = function() {
    var w = {
      EOF: 1,
      parseError: function(d, m) {
        if (this.yy.parser)
          this.yy.parser.parseError(d, m);
        else
          throw new Error(d);
      },
      // resets the lexer, sets new input
      setInput: function(o, d) {
        return this.yy = d || this.yy || {}, this._input = o, this._more = this._backtrack = this.done = !1, this.yylineno = this.yyleng = 0, this.yytext = this.matched = this.match = "", this.conditionStack = ["INITIAL"], this.yylloc = {
          first_line: 1,
          first_column: 0,
          last_line: 1,
          last_column: 0
        }, this.options.ranges && (this.yylloc.range = [0, 0]), this.offset = 0, this;
      },
      // consumes and returns one char from the input
      input: function() {
        var o = this._input[0];
        this.yytext += o, this.yyleng++, this.offset++, this.match += o, this.matched += o;
        var d = o.match(/(?:\r\n?|\n).*/g);
        return d ? (this.yylineno++, this.yylloc.last_line++) : this.yylloc.last_column++, this.options.ranges && this.yylloc.range[1]++, this._input = this._input.slice(1), o;
      },
      // unshifts one char (or a string) into the input
      unput: function(o) {
        var d = o.length, m = o.split(/(?:\r\n?|\n)/g);
        this._input = o + this._input, this.yytext = this.yytext.substr(0, this.yytext.length - d), this.offset -= d;
        var u = this.match.split(/(?:\r\n?|\n)/g);
        this.match = this.match.substr(0, this.match.length - 1), this.matched = this.matched.substr(0, this.matched.length - 1), m.length - 1 && (this.yylineno -= m.length - 1);
        var S = this.yylloc.range;
        return this.yylloc = {
          first_line: this.yylloc.first_line,
          last_line: this.yylineno + 1,
          first_column: this.yylloc.first_column,
          last_column: m ? (m.length === u.length ? this.yylloc.first_column : 0) + u[u.length - m.length].length - m[0].length : this.yylloc.first_column - d
        }, this.options.ranges && (this.yylloc.range = [S[0], S[0] + this.yyleng - d]), this.yyleng = this.yytext.length, this;
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
      less: function(o) {
        this.unput(this.match.slice(o));
      },
      // displays already matched input, i.e. for error messages
      pastInput: function() {
        var o = this.matched.substr(0, this.matched.length - this.match.length);
        return (o.length > 20 ? "..." : "") + o.substr(-20).replace(/\n/g, "");
      },
      // displays upcoming input, i.e. for error messages
      upcomingInput: function() {
        var o = this.match;
        return o.length < 20 && (o += this._input.substr(0, 20 - o.length)), (o.substr(0, 20) + (o.length > 20 ? "..." : "")).replace(/\n/g, "");
      },
      // displays the character position where the lexing error occurred, i.e. for error messages
      showPosition: function() {
        var o = this.pastInput(), d = new Array(o.length + 1).join("-");
        return o + this.upcomingInput() + `
` + d + "^";
      },
      // test the lexed token: return FALSE when not a match, otherwise return token
      test_match: function(o, d) {
        var m, u, S;
        if (this.options.backtrack_lexer && (S = {
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
        }, this.options.ranges && (S.yylloc.range = this.yylloc.range.slice(0))), u = o[0].match(/(?:\r\n?|\n).*/g), u && (this.yylineno += u.length), this.yylloc = {
          first_line: this.yylloc.last_line,
          last_line: this.yylineno + 1,
          first_column: this.yylloc.last_column,
          last_column: u ? u[u.length - 1].length - u[u.length - 1].match(/\r?\n?/)[0].length : this.yylloc.last_column + o[0].length
        }, this.yytext += o[0], this.match += o[0], this.matches = o, this.yyleng = this.yytext.length, this.options.ranges && (this.yylloc.range = [this.offset, this.offset += this.yyleng]), this._more = !1, this._backtrack = !1, this._input = this._input.slice(o[0].length), this.matched += o[0], m = this.performAction.call(this, this.yy, this, d, this.conditionStack[this.conditionStack.length - 1]), this.done && this._input && (this.done = !1), m)
          return m;
        if (this._backtrack) {
          for (var c in S)
            this[c] = S[c];
          return !1;
        }
        return !1;
      },
      // return next match in input
      next: function() {
        if (this.done)
          return this.EOF;
        this._input || (this.done = !0);
        var o, d, m, u;
        this._more || (this.yytext = "", this.match = "");
        for (var S = this._currentRules(), c = 0; c < S.length; c++)
          if (m = this._input.match(this.rules[S[c]]), m && (!d || m[0].length > d[0].length)) {
            if (d = m, u = c, this.options.backtrack_lexer) {
              if (o = this.test_match(m, S[c]), o !== !1)
                return o;
              if (this._backtrack) {
                d = !1;
                continue;
              } else
                return !1;
            } else if (!this.options.flex)
              break;
          }
        return d ? (o = this.test_match(d, S[u]), o !== !1 ? o : !1) : this._input === "" ? this.EOF : this.parseError("Lexical error on line " + (this.yylineno + 1) + `. Unrecognized text.
` + this.showPosition(), {
          text: "",
          token: null,
          line: this.yylineno
        });
      },
      // return next match that has a token
      lex: function() {
        var d = this.next();
        return d || this.lex();
      },
      // activates a new lexer condition state (pushes the new lexer condition state onto the condition stack)
      begin: function(d) {
        this.conditionStack.push(d);
      },
      // pop the previously active lexer condition state off the condition stack
      popState: function() {
        var d = this.conditionStack.length - 1;
        return d > 0 ? this.conditionStack.pop() : this.conditionStack[0];
      },
      // produce the lexer rule set which is active for the currently active lexer condition state
      _currentRules: function() {
        return this.conditionStack.length && this.conditionStack[this.conditionStack.length - 1] ? this.conditions[this.conditionStack[this.conditionStack.length - 1]].rules : this.conditions.INITIAL.rules;
      },
      // return the currently active lexer condition state; when an index argument is provided it produces the N-th previous condition state, if available
      topState: function(d) {
        return d = this.conditionStack.length - 1 - Math.abs(d || 0), d >= 0 ? this.conditionStack[d] : "INITIAL";
      },
      // alias for begin(condition)
      pushState: function(d) {
        this.begin(d);
      },
      // return the number of states currently on the stack
      stateStackSize: function() {
        return this.conditionStack.length;
      },
      options: { "case-insensitive": !0 },
      performAction: function(d, m, u, S) {
        switch (u) {
          case 0:
            return this.begin("open_directive"), "open_directive";
          case 1:
            return this.begin("acc_title"), 28;
          case 2:
            return this.popState(), "acc_title_value";
          case 3:
            return this.begin("acc_descr"), 30;
          case 4:
            return this.popState(), "acc_descr_value";
          case 5:
            this.begin("acc_descr_multiline");
            break;
          case 6:
            this.popState();
            break;
          case 7:
            return "acc_descr_multiline_value";
          case 8:
            break;
          case 9:
            break;
          case 10:
            break;
          case 11:
            return 10;
          case 12:
            break;
          case 13:
            break;
          case 14:
            this.begin("href");
            break;
          case 15:
            this.popState();
            break;
          case 16:
            return 40;
          case 17:
            this.begin("callbackname");
            break;
          case 18:
            this.popState();
            break;
          case 19:
            this.popState(), this.begin("callbackargs");
            break;
          case 20:
            return 38;
          case 21:
            this.popState();
            break;
          case 22:
            return 39;
          case 23:
            this.begin("click");
            break;
          case 24:
            this.popState();
            break;
          case 25:
            return 37;
          case 26:
            return 4;
          case 27:
            return 19;
          case 28:
            return 20;
          case 29:
            return 21;
          case 30:
            return 22;
          case 31:
            return 23;
          case 32:
            return 25;
          case 33:
            return 24;
          case 34:
            return 26;
          case 35:
            return 12;
          case 36:
            return 13;
          case 37:
            return 14;
          case 38:
            return 15;
          case 39:
            return 16;
          case 40:
            return 17;
          case 41:
            return 18;
          case 42:
            return "date";
          case 43:
            return 27;
          case 44:
            return "accDescription";
          case 45:
            return 33;
          case 46:
            return 35;
          case 47:
            return 36;
          case 48:
            return ":";
          case 49:
            return 6;
          case 50:
            return "INVALID";
        }
      },
      rules: [/^(?:%%\{)/i, /^(?:accTitle\s*:\s*)/i, /^(?:(?!\n||)*[^\n]*)/i, /^(?:accDescr\s*:\s*)/i, /^(?:(?!\n||)*[^\n]*)/i, /^(?:accDescr\s*\{\s*)/i, /^(?:[\}])/i, /^(?:[^\}]*)/i, /^(?:%%(?!\{)*[^\n]*)/i, /^(?:[^\}]%%*[^\n]*)/i, /^(?:%%*[^\n]*[\n]*)/i, /^(?:[\n]+)/i, /^(?:\s+)/i, /^(?:%[^\n]*)/i, /^(?:href[\s]+["])/i, /^(?:["])/i, /^(?:[^"]*)/i, /^(?:call[\s]+)/i, /^(?:\([\s]*\))/i, /^(?:\()/i, /^(?:[^(]*)/i, /^(?:\))/i, /^(?:[^)]*)/i, /^(?:click[\s]+)/i, /^(?:[\s\n])/i, /^(?:[^\s\n]*)/i, /^(?:gantt\b)/i, /^(?:dateFormat\s[^#\n;]+)/i, /^(?:inclusiveEndDates\b)/i, /^(?:topAxis\b)/i, /^(?:axisFormat\s[^#\n;]+)/i, /^(?:tickInterval\s[^#\n;]+)/i, /^(?:includes\s[^#\n;]+)/i, /^(?:excludes\s[^#\n;]+)/i, /^(?:todayMarker\s[^\n;]+)/i, /^(?:weekday\s+monday\b)/i, /^(?:weekday\s+tuesday\b)/i, /^(?:weekday\s+wednesday\b)/i, /^(?:weekday\s+thursday\b)/i, /^(?:weekday\s+friday\b)/i, /^(?:weekday\s+saturday\b)/i, /^(?:weekday\s+sunday\b)/i, /^(?:\d\d\d\d-\d\d-\d\d\b)/i, /^(?:title\s[^\n]+)/i, /^(?:accDescription\s[^#\n;]+)/i, /^(?:section\s[^\n]+)/i, /^(?:[^:\n]+)/i, /^(?::[^#\n;]+)/i, /^(?::)/i, /^(?:$)/i, /^(?:.)/i],
      conditions: { acc_descr_multiline: { rules: [6, 7], inclusive: !1 }, acc_descr: { rules: [4], inclusive: !1 }, acc_title: { rules: [2], inclusive: !1 }, callbackargs: { rules: [21, 22], inclusive: !1 }, callbackname: { rules: [18, 19, 20], inclusive: !1 }, href: { rules: [15, 16], inclusive: !1 }, click: { rules: [24, 25], inclusive: !1 }, INITIAL: { rules: [0, 1, 3, 5, 8, 9, 10, 11, 12, 13, 14, 17, 23, 26, 27, 28, 29, 30, 31, 32, 33, 34, 35, 36, 37, 38, 39, 40, 41, 42, 43, 44, 45, 46, 47, 48, 49, 50], inclusive: !0 } }
    };
    return w;
  }();
  T.lexer = F;
  function D() {
    this.yy = {};
  }
  return D.prototype = T, T.Parser = D, new D();
}();
fe.parser = fe;
const Si = fe;
$dayjs.extend(xi);
$dayjs.extend(Ci);
$dayjs.extend(Mi);
let st = "", Te = "", ve, be = "", Ot = [], Ht = [], xe = {}, we = [], Gt = [], St = "", Ce = "";
const gn = ["active", "done", "crit", "milestone"];
let De = [], Nt = !1, Me = !1, Se = "sunday", he = 0;
const _i = function() {
  we = [], Gt = [], St = "", De = [], jt = 0, me = void 0, Bt = void 0, J = [], st = "", Te = "", Ce = "", ve = void 0, be = "", Ot = [], Ht = [], Nt = !1, Me = !1, he = 0, xe = {}, Ln(), Se = "sunday";
}, Ui = function(t) {
  Te = t;
}, Yi = function() {
  return Te;
}, Fi = function(t) {
  ve = t;
}, Li = function() {
  return ve;
}, Ei = function(t) {
  be = t;
}, Ai = function() {
  return be;
}, Ii = function(t) {
  st = t;
}, Wi = function() {
  Nt = !0;
}, Oi = function() {
  return Nt;
}, Hi = function() {
  Me = !0;
}, Ni = function() {
  return Me;
}, Vi = function(t) {
  Ce = t;
}, Pi = function() {
  return Ce;
}, zi = function() {
  return st;
}, Ri = function(t) {
  Ot = t.toLowerCase().split(/[\s,]+/);
}, ji = function() {
  return Ot;
}, Bi = function(t) {
  Ht = t.toLowerCase().split(/[\s,]+/);
}, Zi = function() {
  return Ht;
}, Xi = function() {
  return xe;
}, $i = function(t) {
  St = t, we.push(t);
}, qi = function() {
  return we;
}, Gi = function() {
  let t = Pe();
  const e = 10;
  let n = 0;
  for (; !t && n < e; )
    t = Pe(), n++;
  return Gt = J, Gt;
}, yn = function(t, e, n, r) {
  return r.includes(t.format(e.trim())) ? !1 : t.isoWeekday() >= 6 && n.includes("weekends") || n.includes(t.format("dddd").toLowerCase()) ? !0 : n.includes(t.format(e.trim()));
}, Qi = function(t) {
  Se = t;
}, Ji = function() {
  return Se;
}, kn = function(t, e, n, r) {
  if (!n.length || t.manualEndTime)
    return;
  let i;
  t.startTime instanceof Date ? i = $dayjs(t.startTime) : i = $dayjs(t.startTime, e, !0), i = i.add(1, "d");
  let s;
  t.endTime instanceof Date ? s = $dayjs(t.endTime) : s = $dayjs(t.endTime, e, !0);
  const [a, k] = Ki(
    i,
    s,
    e,
    n,
    r
  );
  t.endTime = a.toDate(), t.renderEndTime = k;
}, Ki = function(t, e, n, r, i) {
  let s = !1, a = null;
  for (; t <= e; )
    s || (a = e.toDate()), s = yn(t, n, r, i), s && (e = e.add(1, "d")), t = t.add(1, "d");
  return [e, a];
}, de = function(t, e, n) {
  n = n.trim();
  const i = new RegExp("^after\\s+(?<ids>[\\d\\w- ]+)").exec(n);
  if (i !== null) {
    let a = null;
    for (const Y of i.groups.ids.split(" ")) {
      let g = vt(Y);
      g !== void 0 && (!a || g.endTime > a.endTime) && (a = g);
    }
    if (a)
      return a.endTime;
    const k = /* @__PURE__ */ new Date();
    return k.setHours(0, 0, 0, 0), k;
  }
  let s = $dayjs(n, e.trim(), !0);
  if (s.isValid())
    return s.toDate();
  {
    Zt.debug("Invalid date:" + n), Zt.debug("With date format:" + e.trim());
    const a = new Date(n);
    if (a === void 0 || isNaN(a.getTime()) || // WebKit browsers can mis-parse invalid dates to be ridiculously
    // huge numbers, e.g. new Date('202304') gets parsed as January 1, 202304.
    // This can cause virtually infinite loops while rendering, so for the
    // purposes of Gantt charts we'll just treat any date beyond 10,000 AD/BC as
    // invalid.
    a.getFullYear() < -1e4 || a.getFullYear() > 1e4)
      throw new Error("Invalid date:" + n);
    return a;
  }
}, pn = function(t) {
  const e = /^(\d+(?:\.\d+)?)([Mdhmswy]|ms)$/.exec(t.trim());
  return e !== null ? [Number.parseFloat(e[1]), e[2]] : [NaN, "ms"];
}, Tn = function(t, e, n, r = !1) {
  n = n.trim();
  const s = new RegExp("^until\\s+(?<ids>[\\d\\w- ]+)").exec(n);
  if (s !== null) {
    let b = null;
    for (const C of s.groups.ids.split(" ")) {
      let v = vt(C);
      v !== void 0 && (!b || v.startTime < b.startTime) && (b = v);
    }
    if (b)
      return b.startTime;
    const U = /* @__PURE__ */ new Date();
    return U.setHours(0, 0, 0, 0), U;
  }
  let a = $dayjs(n, e.trim(), !0);
  if (a.isValid())
    return r && (a = a.add(1, "d")), a.toDate();
  let k = $dayjs(t);
  const [Y, g] = pn(n);
  if (!Number.isNaN(Y)) {
    const b = k.add(Y, g);
    b.isValid() && (k = b);
  }
  return k.toDate();
};
let jt = 0;
const Ct = function(t) {
  return t === void 0 ? (jt = jt + 1, "task" + jt) : t;
}, ts = function(t, e) {
  let n;
  e.substr(0, 1) === ":" ? n = e.substr(1, e.length) : n = e;
  const r = n.split(","), i = {};
  wn(r, i, gn);
  for (let a = 0; a < r.length; a++)
    r[a] = r[a].trim();
  let s = "";
  switch (r.length) {
    case 1:
      i.id = Ct(), i.startTime = t.endTime, s = r[0];
      break;
    case 2:
      i.id = Ct(), i.startTime = de(void 0, st, r[0]), s = r[1];
      break;
    case 3:
      i.id = Ct(r[0]), i.startTime = de(void 0, st, r[1]), s = r[2];
      break;
  }
  return s && (i.endTime = Tn(i.startTime, st, s, Nt), i.manualEndTime = $dayjs(s, "YYYY-MM-DD", !0).isValid(), kn(i, st, Ht, Ot)), i;
}, es = function(t, e) {
  let n;
  e.substr(0, 1) === ":" ? n = e.substr(1, e.length) : n = e;
  const r = n.split(","), i = {};
  wn(r, i, gn);
  for (let s = 0; s < r.length; s++)
    r[s] = r[s].trim();
  switch (r.length) {
    case 1:
      i.id = Ct(), i.startTime = {
        type: "prevTaskEnd",
        id: t
      }, i.endTime = {
        data: r[0]
      };
      break;
    case 2:
      i.id = Ct(), i.startTime = {
        type: "getStartDate",
        startData: r[0]
      }, i.endTime = {
        data: r[1]
      };
      break;
    case 3:
      i.id = Ct(r[0]), i.startTime = {
        type: "getStartDate",
        startData: r[1]
      }, i.endTime = {
        data: r[2]
      };
      break;
  }
  return i;
};
let me, Bt, J = [];
const vn = {}, ns = function(t, e) {
  const n = {
    section: St,
    type: St,
    processed: !1,
    manualEndTime: !1,
    renderEndTime: null,
    raw: { data: e },
    task: t,
    classes: []
  }, r = es(Bt, e);
  n.raw.startTime = r.startTime, n.raw.endTime = r.endTime, n.id = r.id, n.prevTaskId = Bt, n.active = r.active, n.done = r.done, n.crit = r.crit, n.milestone = r.milestone, n.order = he, he++;
  const i = J.push(n);
  Bt = n.id, vn[n.id] = i - 1;
}, vt = function(t) {
  const e = vn[t];
  return J[e];
}, rs = function(t, e) {
  const n = {
    section: St,
    type: St,
    description: t,
    task: t,
    classes: []
  }, r = ts(me, e);
  n.startTime = r.startTime, n.endTime = r.endTime, n.id = r.id, n.active = r.active, n.done = r.done, n.crit = r.crit, n.milestone = r.milestone, me = n, Gt.push(n);
}, Pe = function() {
  const t = function(n) {
    const r = J[n];
    let i = "";
    switch (J[n].raw.startTime.type) {
      case "prevTaskEnd": {
        const s = vt(r.prevTaskId);
        r.startTime = s.endTime;
        break;
      }
      case "getStartDate":
        i = de(void 0, st, J[n].raw.startTime.startData), i && (J[n].startTime = i);
        break;
    }
    return J[n].startTime && (J[n].endTime = Tn(
      J[n].startTime,
      st,
      J[n].raw.endTime.data,
      Nt
    ), J[n].endTime && (J[n].processed = !0, J[n].manualEndTime = $dayjs(
      J[n].raw.endTime.data,
      "YYYY-MM-DD",
      !0
    ).isValid(), kn(J[n], st, Ht, Ot))), J[n].processed;
  };
  let e = !0;
  for (const [n, r] of J.entries())
    t(n), e = e && r.processed;
  return e;
}, is = function(t, e) {
  let n = e;
  xt().securityLevel !== "loose" && (n = En.sanitizeUrl(e)), t.split(",").forEach(function(r) {
    vt(r) !== void 0 && (xn(r, () => {
      window.open(n, "_self");
    }), xe[r] = n);
  }), bn(t, "clickable");
}, bn = function(t, e) {
  t.split(",").forEach(function(n) {
    let r = vt(n);
    r !== void 0 && r.classes.push(e);
  });
}, ss = function(t, e, n) {
  if (xt().securityLevel !== "loose" || e === void 0)
    return;
  let r = [];
  if (typeof n == "string") {
    r = n.split(/,(?=(?:(?:[^"]*"){2})*[^"]*$)/);
    for (let s = 0; s < r.length; s++) {
      let a = r[s].trim();
      a.charAt(0) === '"' && a.charAt(a.length - 1) === '"' && (a = a.substr(1, a.length - 2)), r[s] = a;
    }
  }
  r.length === 0 && r.push(t), vt(t) !== void 0 && xn(t, () => {
    Wn.runFunc(e, ...r);
  });
}, xn = function(t, e) {
  De.push(
    function() {
      const n = document.querySelector(`[id="${t}"]`);
      n !== null && n.addEventListener("click", function() {
        e();
      });
    },
    function() {
      const n = document.querySelector(`[id="${t}-text"]`);
      n !== null && n.addEventListener("click", function() {
        e();
      });
    }
  );
}, as = function(t, e, n) {
  t.split(",").forEach(function(r) {
    ss(r, e, n);
  }), bn(t, "clickable");
}, os = function(t) {
  De.forEach(function(e) {
    e(t);
  });
}, cs = {
  getConfig: () => xt().gantt,
  clear: _i,
  setDateFormat: Ii,
  getDateFormat: zi,
  enableInclusiveEndDates: Wi,
  endDatesAreInclusive: Oi,
  enableTopAxis: Hi,
  topAxisEnabled: Ni,
  setAxisFormat: Ui,
  getAxisFormat: Yi,
  setTickInterval: Fi,
  getTickInterval: Li,
  setTodayMarker: Ei,
  getTodayMarker: Ai,
  setAccTitle: Mn,
  getAccTitle: Sn,
  setDiagramTitle: _n,
  getDiagramTitle: Un,
  setDisplayMode: Vi,
  getDisplayMode: Pi,
  setAccDescription: Yn,
  getAccDescription: Fn,
  addSection: $i,
  getSections: qi,
  getTasks: Gi,
  addTask: ns,
  findTaskById: vt,
  addTaskOrg: rs,
  setIncludes: Ri,
  getIncludes: ji,
  setExcludes: Bi,
  getExcludes: Zi,
  setClickEvent: as,
  setLink: is,
  getLinks: Xi,
  bindFunctions: os,
  parseDuration: pn,
  isInvalidDate: yn,
  setWeekday: Qi,
  getWeekday: Ji
};
function wn(t, e, n) {
  let r = !0;
  for (; r; )
    r = !1, n.forEach(function(i) {
      const s = "^\\s*" + i + "\\s*$", a = new RegExp(s);
      t[0].match(a) && (e[i] = !0, t.shift(1), r = !0);
    });
}
const ls = function() {
  Zt.debug("Something is calling, setConf, remove the call");
}, ze = {
  monday: At,
  tuesday: en,
  wednesday: nn,
  thursday: yt,
  friday: rn,
  saturday: sn,
  sunday: Wt
}, us = (t, e) => {
  let n = [...t].map(() => -1 / 0), r = [...t].sort((s, a) => s.startTime - a.startTime || s.order - a.order), i = 0;
  for (const s of r)
    for (let a = 0; a < n.length; a++)
      if (s.startTime >= n[a]) {
        n[a] = s.endTime, s.order = a + e, a > i && (i = a);
        break;
      }
  return i;
};
let ct;
const fs = function(t, e, n, r) {
  const i = xt().gantt, s = xt().securityLevel;
  let a;
  s === "sandbox" && (a = Pt("#i" + e));
  const k = s === "sandbox" ? Pt(a.nodes()[0].contentDocument.body) : Pt("body"), Y = s === "sandbox" ? a.nodes()[0].contentDocument : document, g = Y.getElementById(e);
  ct = g.parentElement.offsetWidth, ct === void 0 && (ct = 1200), i.useWidth !== void 0 && (ct = i.useWidth);
  const b = r.db.getTasks();
  let U = [];
  for (const T of b)
    U.push(T.type);
  U = A(U);
  const C = {};
  let v = 2 * i.topPadding;
  if (r.db.getDisplayMode() === "compact" || i.displayMode === "compact") {
    const T = {};
    for (const D of b)
      T[D.section] === void 0 ? T[D.section] = [D] : T[D.section].push(D);
    let F = 0;
    for (const D of Object.keys(T)) {
      const w = us(T[D], F) + 1;
      F += w, v += w * (i.barHeight + i.barGap), C[D] = w;
    }
  } else {
    v += b.length * (i.barHeight + i.barGap);
    for (const T of U)
      C[T] = b.filter((F) => F.type === T).length;
  }
  g.setAttribute("viewBox", "0 0 " + ct + " " + v);
  const X = k.select(`[id="${e}"]`), y = vi().domain([
    Rn(b, function(T) {
      return T.startTime;
    }),
    zn(b, function(T) {
      return T.endTime;
    })
  ]).rangeRound([0, ct - i.leftPadding - i.rightPadding]);
  function L(T, F) {
    const D = T.startTime, w = F.startTime;
    let o = 0;
    return D > w ? o = 1 : D < w && (o = -1), o;
  }
  b.sort(L), O(b, ct, v), An(X, v, ct, i.useMaxWidth), X.append("text").text(r.db.getDiagramTitle()).attr("x", ct / 2).attr("y", i.titleTopMargin).attr("class", "titleText");
  function O(T, F, D) {
    const w = i.barHeight, o = w + i.barGap, d = i.topPadding, m = i.leftPadding, u = Vn().domain([0, U.length]).range(["#00B9FA", "#F95002"]).interpolate(ir);
    j(
      o,
      d,
      m,
      F,
      D,
      T,
      r.db.getExcludes(),
      r.db.getIncludes()
    ), B(m, d, F, D), W(T, o, d, m, w, u, F), G(o, d), x(m, d, F, D);
  }
  function W(T, F, D, w, o, d, m) {
    const S = [...new Set(T.map((h) => h.order))].map((h) => T.find((_) => _.order === h));
    X.append("g").selectAll("rect").data(S).enter().append("rect").attr("x", 0).attr("y", function(h, _) {
      return _ = h.order, _ * F + D - 2;
    }).attr("width", function() {
      return m - i.rightPadding / 2;
    }).attr("height", F).attr("class", function(h) {
      for (const [_, $] of U.entries())
        if (h.type === $)
          return "section section" + _ % i.numberSectionStyles;
      return "section section0";
    });
    const c = X.append("g").selectAll("rect").data(T).enter(), Z = r.db.getLinks();
    if (c.append("rect").attr("id", function(h) {
      return h.id;
    }).attr("rx", 3).attr("ry", 3).attr("x", function(h) {
      return h.milestone ? y(h.startTime) + w + 0.5 * (y(h.endTime) - y(h.startTime)) - 0.5 * o : y(h.startTime) + w;
    }).attr("y", function(h, _) {
      return _ = h.order, _ * F + D;
    }).attr("width", function(h) {
      return h.milestone ? o : y(h.renderEndTime || h.endTime) - y(h.startTime);
    }).attr("height", o).attr("transform-origin", function(h, _) {
      return _ = h.order, (y(h.startTime) + w + 0.5 * (y(h.endTime) - y(h.startTime))).toString() + "px " + (_ * F + D + 0.5 * o).toString() + "px";
    }).attr("class", function(h) {
      const _ = "task";
      let $ = "";
      h.classes.length > 0 && ($ = h.classes.join(" "));
      let H = 0;
      for (const [I, P] of U.entries())
        h.type === P && (H = I % i.numberSectionStyles);
      let V = "";
      return h.active ? h.crit ? V += " activeCrit" : V = " active" : h.done ? h.crit ? V = " doneCrit" : V = " done" : h.crit && (V += " crit"), V.length === 0 && (V = " task"), h.milestone && (V = " milestone " + V), V += H, V += " " + $, _ + V;
    }), c.append("text").attr("id", function(h) {
      return h.id + "-text";
    }).text(function(h) {
      return h.task;
    }).attr("font-size", i.fontSize).attr("x", function(h) {
      let _ = y(h.startTime), $ = y(h.renderEndTime || h.endTime);
      h.milestone && (_ += 0.5 * (y(h.endTime) - y(h.startTime)) - 0.5 * o), h.milestone && ($ = _ + o);
      const H = this.getBBox().width;
      return H > $ - _ ? $ + H + 1.5 * i.leftPadding > m ? _ + w - 5 : $ + w + 5 : ($ - _) / 2 + _ + w;
    }).attr("y", function(h, _) {
      return _ = h.order, _ * F + i.barHeight / 2 + (i.fontSize / 2 - 2) + D;
    }).attr("text-height", o).attr("class", function(h) {
      const _ = y(h.startTime);
      let $ = y(h.endTime);
      h.milestone && ($ = _ + o);
      const H = this.getBBox().width;
      let V = "";
      h.classes.length > 0 && (V = h.classes.join(" "));
      let I = 0;
      for (const [it, rt] of U.entries())
        h.type === rt && (I = it % i.numberSectionStyles);
      let P = "";
      return h.active && (h.crit ? P = "activeCritText" + I : P = "activeText" + I), h.done ? h.crit ? P = P + " doneCritText" + I : P = P + " doneText" + I : h.crit && (P = P + " critText" + I), h.milestone && (P += " milestoneText"), H > $ - _ ? $ + H + 1.5 * i.leftPadding > m ? V + " taskTextOutsideLeft taskTextOutside" + I + " " + P : V + " taskTextOutsideRight taskTextOutside" + I + " " + P + " width-" + H : V + " taskText taskText" + I + " " + P + " width-" + H;
    }), xt().securityLevel === "sandbox") {
      let h;
      h = Pt("#i" + e);
      const _ = h.nodes()[0].contentDocument;
      c.filter(function($) {
        return Z[$.id] !== void 0;
      }).each(function($) {
        var H = _.querySelector("#" + $.id), V = _.querySelector("#" + $.id + "-text");
        const I = H.parentNode;
        var P = _.createElement("a");
        P.setAttribute("xlink:href", Z[$.id]), P.setAttribute("target", "_top"), I.appendChild(P), P.appendChild(H), P.appendChild(V);
      });
    }
  }
  function j(T, F, D, w, o, d, m, u) {
    if (m.length === 0 && u.length === 0)
      return;
    let S, c;
    for (const { startTime: H, endTime: V } of d)
      (S === void 0 || H < S) && (S = H), (c === void 0 || V > c) && (c = V);
    if (!S || !c)
      return;
    if ($dayjs(c).diff($dayjs(S), "year") > 5) {
      Zt.warn(
        "The difference between the min and max time is more than 5 years. This will cause performance issues. Skipping drawing exclude days."
      );
      return;
    }
    const Z = r.db.getDateFormat(), f = [];
    let h = null, _ = $dayjs(S);
    for (; _.valueOf() <= c; )
      r.db.isInvalidDate(_, Z, m, u) ? h ? h.end = _ : h = {
        start: _,
        end: _
      } : h && (f.push(h), h = null), _ = _.add(1, "d");
    X.append("g").selectAll("rect").data(f).enter().append("rect").attr("id", function(H) {
      return "exclude-" + H.start.format("YYYY-MM-DD");
    }).attr("x", function(H) {
      return y(H.start) + D;
    }).attr("y", i.gridLineStartPadding).attr("width", function(H) {
      const V = H.end.add(1, "day");
      return y(V) - y(H.start);
    }).attr("height", o - F - i.gridLineStartPadding).attr("transform-origin", function(H, V) {
      return (y(H.start) + D + 0.5 * (y(H.end) - y(H.start))).toString() + "px " + (V * T + 0.5 * o).toString() + "px";
    }).attr("class", "exclude-range");
  }
  function B(T, F, D, w) {
    let o = Qn(y).tickSize(-w + F + i.gridLineStartPadding).tickFormat(qt(r.db.getAxisFormat() || i.axisFormat || "%Y-%m-%d"));
    const m = /^([1-9]\d*)(millisecond|second|minute|hour|day|week|month)$/.exec(
      r.db.getTickInterval() || i.tickInterval
    );
    if (m !== null) {
      const u = m[1], S = m[2], c = r.db.getWeekday() || i.weekday;
      switch (S) {
        case "millisecond":
          o.ticks(Dt.every(u));
          break;
        case "second":
          o.ticks(mt.every(u));
          break;
        case "minute":
          o.ticks(Lt.every(u));
          break;
        case "hour":
          o.ticks(Et.every(u));
          break;
        case "day":
          o.ticks(gt.every(u));
          break;
        case "week":
          o.ticks(ze[c].every(u));
          break;
        case "month":
          o.ticks(It.every(u));
          break;
      }
    }
    if (X.append("g").attr("class", "grid").attr("transform", "translate(" + T + ", " + (w - 50) + ")").call(o).selectAll("text").style("text-anchor", "middle").attr("fill", "#000").attr("stroke", "none").attr("font-size", 10).attr("dy", "1em"), r.db.topAxisEnabled() || i.topAxis) {
      let u = Gn(y).tickSize(-w + F + i.gridLineStartPadding).tickFormat(qt(r.db.getAxisFormat() || i.axisFormat || "%Y-%m-%d"));
      if (m !== null) {
        const S = m[1], c = m[2], Z = r.db.getWeekday() || i.weekday;
        switch (c) {
          case "millisecond":
            u.ticks(Dt.every(S));
            break;
          case "second":
            u.ticks(mt.every(S));
            break;
          case "minute":
            u.ticks(Lt.every(S));
            break;
          case "hour":
            u.ticks(Et.every(S));
            break;
          case "day":
            u.ticks(gt.every(S));
            break;
          case "week":
            u.ticks(ze[Z].every(S));
            break;
          case "month":
            u.ticks(It.every(S));
            break;
        }
      }
      X.append("g").attr("class", "grid").attr("transform", "translate(" + T + ", " + F + ")").call(u).selectAll("text").style("text-anchor", "middle").attr("fill", "#000").attr("stroke", "none").attr("font-size", 10);
    }
  }
  function G(T, F) {
    let D = 0;
    const w = Object.keys(C).map((o) => [o, C[o]]);
    X.append("g").selectAll("text").data(w).enter().append(function(o) {
      const d = o[0].split(In.lineBreakRegex), m = -(d.length - 1) / 2, u = Y.createElementNS("http://www.w3.org/2000/svg", "text");
      u.setAttribute("dy", m + "em");
      for (const [S, c] of d.entries()) {
        const Z = Y.createElementNS("http://www.w3.org/2000/svg", "tspan");
        Z.setAttribute("alignment-baseline", "central"), Z.setAttribute("x", "10"), S > 0 && Z.setAttribute("dy", "1em"), Z.textContent = c, u.appendChild(Z);
      }
      return u;
    }).attr("x", 10).attr("y", function(o, d) {
      if (d > 0)
        for (let m = 0; m < d; m++)
          return D += w[d - 1][1], o[1] * T / 2 + D * T + F;
      else
        return o[1] * T / 2 + F;
    }).attr("font-size", i.sectionFontSize).attr("class", function(o) {
      for (const [d, m] of U.entries())
        if (o[0] === m)
          return "sectionTitle sectionTitle" + d % i.numberSectionStyles;
      return "sectionTitle";
    });
  }
  function x(T, F, D, w) {
    const o = r.db.getTodayMarker();
    if (o === "off")
      return;
    const d = X.append("g").attr("class", "today"), m = /* @__PURE__ */ new Date(), u = d.append("line");
    u.attr("x1", y(m) + T).attr("x2", y(m) + T).attr("y1", i.titleTopMargin).attr("y2", w - i.titleTopMargin).attr("class", "today"), o !== "" && u.attr("style", o.replace(/,/g, ";"));
  }
  function A(T) {
    const F = {}, D = [];
    for (let w = 0, o = T.length; w < o; ++w)
      Object.prototype.hasOwnProperty.call(F, T[w]) || (F[T[w]] = !0, D.push(T[w]));
    return D;
  }
}, hs = {
  setConf: ls,
  draw: fs
}, ds = (t) => `
  .mermaid-main-font {
    font-family: var(--mermaid-font-family, "trebuchet ms", verdana, arial, sans-serif);
  }

  .exclude-range {
    fill: ${t.excludeBkgColor};
  }

  .section {
    stroke: none;
    opacity: 0.2;
  }

  .section0 {
    fill: ${t.sectionBkgColor};
  }

  .section2 {
    fill: ${t.sectionBkgColor2};
  }

  .section1,
  .section3 {
    fill: ${t.altSectionBkgColor};
    opacity: 0.2;
  }

  .sectionTitle0 {
    fill: ${t.titleColor};
  }

  .sectionTitle1 {
    fill: ${t.titleColor};
  }

  .sectionTitle2 {
    fill: ${t.titleColor};
  }

  .sectionTitle3 {
    fill: ${t.titleColor};
  }

  .sectionTitle {
    text-anchor: start;
    font-family: var(--mermaid-font-family, "trebuchet ms", verdana, arial, sans-serif);
  }


  /* Grid and axis */

  .grid .tick {
    stroke: ${t.gridColor};
    opacity: 0.8;
    shape-rendering: crispEdges;
  }

  .grid .tick text {
    font-family: ${t.fontFamily};
    fill: ${t.textColor};
  }

  .grid path {
    stroke-width: 0;
  }


  /* Today line */

  .today {
    fill: none;
    stroke: ${t.todayLineColor};
    stroke-width: 2px;
  }


  /* Task styling */

  /* Default task */

  .task {
    stroke-width: 2;
  }

  .taskText {
    text-anchor: middle;
    font-family: var(--mermaid-font-family, "trebuchet ms", verdana, arial, sans-serif);
  }

  .taskTextOutsideRight {
    fill: ${t.taskTextDarkColor};
    text-anchor: start;
    font-family: var(--mermaid-font-family, "trebuchet ms", verdana, arial, sans-serif);
  }

  .taskTextOutsideLeft {
    fill: ${t.taskTextDarkColor};
    text-anchor: end;
  }


  /* Special case clickable */

  .task.clickable {
    cursor: pointer;
  }

  .taskText.clickable {
    cursor: pointer;
    fill: ${t.taskTextClickableColor} !important;
    font-weight: bold;
  }

  .taskTextOutsideLeft.clickable {
    cursor: pointer;
    fill: ${t.taskTextClickableColor} !important;
    font-weight: bold;
  }

  .taskTextOutsideRight.clickable {
    cursor: pointer;
    fill: ${t.taskTextClickableColor} !important;
    font-weight: bold;
  }


  /* Specific task settings for the sections*/

  .taskText0,
  .taskText1,
  .taskText2,
  .taskText3 {
    fill: ${t.taskTextColor};
  }

  .task0,
  .task1,
  .task2,
  .task3 {
    fill: ${t.taskBkgColor};
    stroke: ${t.taskBorderColor};
  }

  .taskTextOutside0,
  .taskTextOutside2
  {
    fill: ${t.taskTextOutsideColor};
  }

  .taskTextOutside1,
  .taskTextOutside3 {
    fill: ${t.taskTextOutsideColor};
  }


  /* Active task */

  .active0,
  .active1,
  .active2,
  .active3 {
    fill: ${t.activeTaskBkgColor};
    stroke: ${t.activeTaskBorderColor};
  }

  .activeText0,
  .activeText1,
  .activeText2,
  .activeText3 {
    fill: ${t.taskTextDarkColor} !important;
  }


  /* Completed task */

  .done0,
  .done1,
  .done2,
  .done3 {
    stroke: ${t.doneTaskBorderColor};
    fill: ${t.doneTaskBkgColor};
    stroke-width: 2;
  }

  .doneText0,
  .doneText1,
  .doneText2,
  .doneText3 {
    fill: ${t.taskTextDarkColor} !important;
  }


  /* Tasks on the critical line */

  .crit0,
  .crit1,
  .crit2,
  .crit3 {
    stroke: ${t.critBorderColor};
    fill: ${t.critBkgColor};
    stroke-width: 2;
  }

  .activeCrit0,
  .activeCrit1,
  .activeCrit2,
  .activeCrit3 {
    stroke: ${t.critBorderColor};
    fill: ${t.activeTaskBkgColor};
    stroke-width: 2;
  }

  .doneCrit0,
  .doneCrit1,
  .doneCrit2,
  .doneCrit3 {
    stroke: ${t.critBorderColor};
    fill: ${t.doneTaskBkgColor};
    stroke-width: 2;
    cursor: pointer;
    shape-rendering: crispEdges;
  }

  .milestone {
    transform: rotate(45deg) scale(0.8,0.8);
  }

  .milestoneText {
    font-style: italic;
  }
  .doneCritText0,
  .doneCritText1,
  .doneCritText2,
  .doneCritText3 {
    fill: ${t.taskTextDarkColor} !important;
  }

  .activeCritText0,
  .activeCritText1,
  .activeCritText2,
  .activeCritText3 {
    fill: ${t.taskTextDarkColor} !important;
  }

  .titleText {
    text-anchor: middle;
    font-size: 18px;
    fill: ${t.titleColor || t.textColor};
    font-family: var(--mermaid-font-family, "trebuchet ms", verdana, arial, sans-serif);
  }
`, ms = ds, ps = {
  parser: Si,
  db: cs,
  renderer: hs,
  styles: ms
};
export {
  ps as diagram
};
