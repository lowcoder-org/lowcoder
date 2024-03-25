import { w as ln, c as I } from "./256b619e.js";
import { av as an, aw as j, ax as D, ay as rn, az as y, U as on, aA as K, aB as _, aC as un, aD as t, aE as sn, aF as tn, aG as fn } from "./1269154d.js";
function cn(l) {
  return l.innerRadius;
}
function yn(l) {
  return l.outerRadius;
}
function gn(l) {
  return l.startAngle;
}
function mn(l) {
  return l.endAngle;
}
function pn(l) {
  return l && l.padAngle;
}
function xn(l, h, z, E, v, A, O, a) {
  var B = z - l, i = E - h, n = O - v, m = a - A, r = m * B - n * i;
  if (!(r * r < y))
    return r = (n * (h - A) - m * (l - v)) / r, [l + r * B, h + r * i];
}
function W(l, h, z, E, v, A, O) {
  var a = l - z, B = h - E, i = (O ? A : -A) / K(a * a + B * B), n = i * B, m = -i * a, r = l + n, s = h + m, f = z + n, c = E + m, S = (r + f) / 2, o = (s + c) / 2, p = f - r, g = c - s, R = p * p + g * g, T = v - A, w = r * c - f * s, C = (g < 0 ? -1 : 1) * K(fn(0, T * T * R - w * w)), F = (w * g - p * C) / R, G = (-w * p - g * C) / R, P = (w * g + p * C) / R, x = (-w * p + g * C) / R, d = F - S, e = G - o, u = P - S, U = x - o;
  return d * d + e * e > u * u + U * U && (F = P, G = x), {
    cx: F,
    cy: G,
    x01: -n,
    y01: -m,
    x11: F * (v / T - 1),
    y11: G * (v / T - 1)
  };
}
function vn() {
  var l = cn, h = yn, z = I(0), E = null, v = gn, A = mn, O = pn, a = null, B = ln(i);
  function i() {
    var n, m, r = +l.apply(this, arguments), s = +h.apply(this, arguments), f = v.apply(this, arguments) - rn, c = A.apply(this, arguments) - rn, S = un(c - f), o = c > f;
    if (a || (a = n = B()), s < r && (m = s, s = r, r = m), !(s > y))
      a.moveTo(0, 0);
    else if (S > on - y)
      a.moveTo(s * j(f), s * D(f)), a.arc(0, 0, s, f, c, !o), r > y && (a.moveTo(r * j(c), r * D(c)), a.arc(0, 0, r, c, f, o));
    else {
      var p = f, g = c, R = f, T = c, w = S, C = S, F = O.apply(this, arguments) / 2, G = F > y && (E ? +E.apply(this, arguments) : K(r * r + s * s)), P = _(un(s - r) / 2, +z.apply(this, arguments)), x = P, d = P, e, u;
      if (G > y) {
        var U = sn(G / r * D(F)), L = sn(G / s * D(F));
        (w -= U * 2) > y ? (U *= o ? 1 : -1, R += U, T -= U) : (w = 0, R = T = (f + c) / 2), (C -= L * 2) > y ? (L *= o ? 1 : -1, p += L, g -= L) : (C = 0, p = g = (f + c) / 2);
      }
      var H = s * j(p), J = s * D(p), M = r * j(T), N = r * D(T);
      if (P > y) {
        var Q = s * j(g), V = s * D(g), X = r * j(R), Y = r * D(R), q;
        if (S < an)
          if (q = xn(H, J, X, Y, Q, V, M, N)) {
            var Z = H - q[0], $ = J - q[1], k = Q - q[0], b = V - q[1], nn = 1 / D(tn((Z * k + $ * b) / (K(Z * Z + $ * $) * K(k * k + b * b))) / 2), en = K(q[0] * q[0] + q[1] * q[1]);
            x = _(P, (r - en) / (nn - 1)), d = _(P, (s - en) / (nn + 1));
          } else
            x = d = 0;
      }
      C > y ? d > y ? (e = W(X, Y, H, J, s, d, o), u = W(Q, V, M, N, s, d, o), a.moveTo(e.cx + e.x01, e.cy + e.y01), d < P ? a.arc(e.cx, e.cy, d, t(e.y01, e.x01), t(u.y01, u.x01), !o) : (a.arc(e.cx, e.cy, d, t(e.y01, e.x01), t(e.y11, e.x11), !o), a.arc(0, 0, s, t(e.cy + e.y11, e.cx + e.x11), t(u.cy + u.y11, u.cx + u.x11), !o), a.arc(u.cx, u.cy, d, t(u.y11, u.x11), t(u.y01, u.x01), !o))) : (a.moveTo(H, J), a.arc(0, 0, s, p, g, !o)) : a.moveTo(H, J), !(r > y) || !(w > y) ? a.lineTo(M, N) : x > y ? (e = W(M, N, Q, V, r, -x, o), u = W(H, J, X, Y, r, -x, o), a.lineTo(e.cx + e.x01, e.cy + e.y01), x < P ? a.arc(e.cx, e.cy, x, t(e.y01, e.x01), t(u.y01, u.x01), !o) : (a.arc(e.cx, e.cy, x, t(e.y01, e.x01), t(e.y11, e.x11), !o), a.arc(0, 0, r, t(e.cy + e.y11, e.cx + e.x11), t(u.cy + u.y11, u.cx + u.x11), o), a.arc(u.cx, u.cy, x, t(u.y11, u.x11), t(u.y01, u.x01), !o))) : a.arc(0, 0, r, T, R, o);
    }
    if (a.closePath(), n)
      return a = null, n + "" || null;
  }
  return i.centroid = function() {
    var n = (+l.apply(this, arguments) + +h.apply(this, arguments)) / 2, m = (+v.apply(this, arguments) + +A.apply(this, arguments)) / 2 - an / 2;
    return [j(m) * n, D(m) * n];
  }, i.innerRadius = function(n) {
    return arguments.length ? (l = typeof n == "function" ? n : I(+n), i) : l;
  }, i.outerRadius = function(n) {
    return arguments.length ? (h = typeof n == "function" ? n : I(+n), i) : h;
  }, i.cornerRadius = function(n) {
    return arguments.length ? (z = typeof n == "function" ? n : I(+n), i) : z;
  }, i.padRadius = function(n) {
    return arguments.length ? (E = n == null ? null : typeof n == "function" ? n : I(+n), i) : E;
  }, i.startAngle = function(n) {
    return arguments.length ? (v = typeof n == "function" ? n : I(+n), i) : v;
  }, i.endAngle = function(n) {
    return arguments.length ? (A = typeof n == "function" ? n : I(+n), i) : A;
  }, i.padAngle = function(n) {
    return arguments.length ? (O = typeof n == "function" ? n : I(+n), i) : O;
  }, i.context = function(n) {
    return arguments.length ? (a = n == null ? null : n, i) : a;
  }, i;
}
export {
  vn as a
};
