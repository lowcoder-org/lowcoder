var U = (r, e, t) => new Promise((n, a) => {
  var s = (l) => {
    try {
      o(t.next(l));
    } catch (d) {
      a(d);
    }
  }, i = (l) => {
    try {
      o(t.throw(l));
    } catch (d) {
      a(d);
    }
  }, o = (l) => l.done ? n(l.value) : Promise.resolve(l.value).then(s, i);
  o((t = t.apply(r, e)).next());
});
import { p as _t, f as z } from "./18068d52.js";
import { h as S, f as et, G as Et } from "./4504d077.js";
import { j as x, p as $, q as H, r as rt, e as G, t as at, m as nt, l as R, u as Y, v as Tt } from "./08856db2.js";
import { u as Nt, r as At, p as Ct, l as It, d as M } from "./666097a3.js";
import { a as N, b as st, i as it, c as E, e as ot, d as lt, f as Bt, g as Mt, s as Dt } from "./0c155f84.js";
import { l as Rt } from "./8e8be6e8.js";
import "./7ca39633.js";
import "./289514c9.js";
import "./691304fa.js";
import "./f69b998c.js";
import "./85051678.js";
import "./2ff2c7a6.js";
import "./256b619e.js";
function Gt(r) {
  if (!r.ok)
    throw new Error(r.status + " " + r.statusText);
  return r.text();
}
function Pt(r, e) {
  return fetch(r, e).then(Gt);
}
function Ut(r) {
  return (e, t) => Pt(e, t).then((n) => new DOMParser().parseFromString(n, r));
}
var $t = Ut("image/svg+xml"), X = {
  normal: Vt,
  vee: zt,
  undirected: Yt
};
function Wt(r) {
  X = r;
}
function Vt(r, e, t, n) {
  var a = r.append("marker").attr("id", e).attr("viewBox", "0 0 10 10").attr("refX", 9).attr("refY", 5).attr("markerUnits", "strokeWidth").attr("markerWidth", 8).attr("markerHeight", 6).attr("orient", "auto"), s = a.append("path").attr("d", "M 0 0 L 10 5 L 0 10 z").style("stroke-width", 1).style("stroke-dasharray", "1,0");
  N(s, t[n + "Style"]), t[n + "Class"] && s.attr("class", t[n + "Class"]);
}
function zt(r, e, t, n) {
  var a = r.append("marker").attr("id", e).attr("viewBox", "0 0 10 10").attr("refX", 9).attr("refY", 5).attr("markerUnits", "strokeWidth").attr("markerWidth", 8).attr("markerHeight", 6).attr("orient", "auto"), s = a.append("path").attr("d", "M 0 0 L 10 5 L 0 10 L 4 5 z").style("stroke-width", 1).style("stroke-dasharray", "1,0");
  N(s, t[n + "Style"]), t[n + "Class"] && s.attr("class", t[n + "Class"]);
}
function Yt(r, e, t, n) {
  var a = r.append("marker").attr("id", e).attr("viewBox", "0 0 10 10").attr("refX", 9).attr("refY", 5).attr("markerUnits", "strokeWidth").attr("markerWidth", 8).attr("markerHeight", 6).attr("orient", "auto"), s = a.append("path").attr("d", "M 0 5 L 10 5").style("stroke-width", 1).style("stroke-dasharray", "1,0");
  N(s, t[n + "Style"]), t[n + "Class"] && s.attr("class", t[n + "Class"]);
}
function Ht(r, e) {
  var t = r;
  return t.node().appendChild(e.label), N(t, e.labelStyle), t;
}
function Xt(r, e) {
  for (var t = r.append("text"), n = Ft(e.label).split(`
`), a = 0; a < n.length; a++)
    t.append("tspan").attr("xml:space", "preserve").attr("dy", "1em").attr("x", "1").text(n[a]);
  return N(t, e.labelStyle), t;
}
function Ft(r) {
  for (var e = "", t = !1, n, a = 0; a < r.length; ++a)
    if (n = r[a], t) {
      switch (n) {
        case "n":
          e += `
`;
          break;
        default:
          e += n;
      }
      t = !1;
    } else
      n === "\\" ? t = !0 : e += n;
  return e;
}
function Z(r, e, t) {
  var n = e.label, a = r.append("g");
  e.labelType === "svg" ? Ht(a, e) : typeof n != "string" || e.labelType === "html" ? st(a, e) : Xt(a, e);
  var s = a.node().getBBox(), i;
  switch (t) {
    case "top":
      i = -e.height / 2;
      break;
    case "bottom":
      i = e.height / 2 - s.height;
      break;
    default:
      i = -s.height / 2;
  }
  return a.attr("transform", "translate(" + -s.width / 2 + "," + i + ")"), a;
}
var F = function(r, e) {
  var t = e.nodes().filter(function(s) {
    return it(e, s);
  }), n = r.selectAll("g.cluster").data(t, function(s) {
    return s;
  });
  E(n.exit(), e).style("opacity", 0).remove();
  var a = n.enter().append("g").attr("class", "cluster").attr("id", function(s) {
    var i = e.node(s);
    return i.id;
  }).style("opacity", 0).each(function(s) {
    var i = e.node(s), o = x(this);
    x(this).append("rect");
    var l = o.append("g").attr("class", "label");
    Z(l, i, i.clusterLabelPos);
  });
  return n = n.merge(a), n = E(n, e).style("opacity", 1), n.selectAll("rect").each(function(s) {
    var i = e.node(s), o = x(this);
    N(o, i.style);
  }), n;
};
function qt(r) {
  F = r;
}
let q = function(r, e) {
  var t = r.selectAll("g.edgeLabel").data(e.edges(), function(a) {
    return ot(a);
  }).classed("update", !0);
  t.exit().remove(), t.enter().append("g").classed("edgeLabel", !0).style("opacity", 0), t = r.selectAll("g.edgeLabel"), t.each(function(a) {
    var s = x(this);
    s.select(".label").remove();
    var i = e.edge(a), o = Z(s, e.edge(a), 0).classed("label", !0), l = o.node().getBBox();
    i.labelId && o.attr("id", i.labelId), S(i, "width") || (i.width = l.width), S(i, "height") || (i.height = l.height);
  });
  var n;
  return t.exit ? n = t.exit() : n = t.selectAll(null), E(n, e).style("opacity", 0).remove(), t;
};
function Qt(r) {
  q = r;
}
function j(r, e) {
  return r.intersect(e);
}
var Q = function(r, e, t) {
  var n = r.selectAll("g.edgePath").data(e.edges(), function(i) {
    return ot(i);
  }).classed("update", !0), a = jt(n, e);
  te(n, e);
  var s = n.merge !== void 0 ? n.merge(a) : n;
  return E(s, e).style("opacity", 1), s.each(function(i) {
    var o = x(this), l = e.edge(i);
    l.elem = this, l.id && o.attr("id", l.id), lt(
      o,
      l.class,
      (o.classed("update") ? "update " : "") + "edgePath"
    );
  }), s.selectAll("path.path").each(function(i) {
    var o = e.edge(i);
    o.arrowheadId = Nt("arrowhead");
    var l = x(this).attr("marker-end", function() {
      return "url(" + Jt(location.href, o.arrowheadId) + ")";
    }).style("fill", "none");
    E(l, e).attr("d", function(d) {
      return Zt(e, d);
    }), N(l, o.style);
  }), s.selectAll("defs *").remove(), s.selectAll("defs").each(function(i) {
    var o = e.edge(i), l = t[o.arrowhead];
    l(x(this), o.arrowheadId, o, "arrowhead");
  }), s;
};
function Kt(r) {
  Q = r;
}
function Jt(r, e) {
  var t = r.split("#")[0];
  return t + "#" + e;
}
function Zt(r, e) {
  var t = r.edge(e), n = r.node(e.v), a = r.node(e.w), s = t.points.slice(1, t.points.length - 1);
  return s.unshift(j(n, s[0])), s.push(j(a, s[s.length - 1])), ct(t, s);
}
function ct(r, e) {
  var t = (Rt || $t.line)().x(function(n) {
    return n.x;
  }).y(function(n) {
    return n.y;
  });
  return (t.curve || t.interpolate)(r.curve), t(e);
}
function Ot(r) {
  var e = r.getBBox(), t = r.ownerSVGElement.getScreenCTM().inverse().multiply(r.getScreenCTM()).translate(e.width / 2, e.height / 2);
  return { x: t.e, y: t.f };
}
function jt(r, e) {
  var t = r.enter().append("g").attr("class", "edgePath").style("opacity", 0);
  return t.append("path").attr("class", "path").attr("d", function(n) {
    var a = e.edge(n), s = e.node(n.v).elem, i = At(a.points.length).map(function() {
      return Ot(s);
    });
    return ct(a, i);
  }), t.append("defs"), t;
}
function te(r, e) {
  var t = r.exit();
  E(t, e).style("opacity", 0).remove();
}
var K = function(r, e, t) {
  var n = e.nodes().filter(function(i) {
    return !it(e, i);
  }), a = r.selectAll("g.node").data(n, function(i) {
    return i;
  }).classed("update", !0);
  a.exit().remove(), a.enter().append("g").attr("class", "node").style("opacity", 0), a = r.selectAll("g.node"), a.each(function(i) {
    var o = e.node(i), l = x(this);
    lt(
      l,
      o.class,
      (l.classed("update") ? "update " : "") + "node"
    ), l.select("g.label").remove();
    var d = l.append("g").attr("class", "label"), c = Z(d, o), v = t[o.shape], h = Ct(c.node().getBBox(), "width", "height");
    o.elem = this, o.id && l.attr("id", o.id), o.labelId && d.attr("id", o.labelId), S(o, "width") && (h.width = o.width), S(o, "height") && (h.height = o.height), h.width += o.paddingLeft + o.paddingRight, h.height += o.paddingTop + o.paddingBottom, d.attr(
      "transform",
      "translate(" + (o.paddingLeft - o.paddingRight) / 2 + "," + (o.paddingTop - o.paddingBottom) / 2 + ")"
    );
    var u = x(this);
    u.select(".label-container").remove();
    var p = v(u, h, o).classed("label-container", !0);
    N(p, o.style);
    var y = p.node().getBBox();
    o.width = y.width, o.height = y.height;
  });
  var s;
  return a.exit ? s = a.exit() : s = a.selectAll(null), E(s, e).style("opacity", 0).remove(), a;
};
function ee(r) {
  K = r;
}
function re(r, e) {
  var t = r.filter(function() {
    return !x(this).classed("update");
  });
  function n(a) {
    var s = e.node(a);
    return "translate(" + s.x + "," + s.y + ")";
  }
  t.attr("transform", n), E(r, e).style("opacity", 1).attr("transform", n), E(t.selectAll("rect"), e).attr("width", function(a) {
    return e.node(a).width;
  }).attr("height", function(a) {
    return e.node(a).height;
  }).attr("x", function(a) {
    var s = e.node(a);
    return -s.width / 2;
  }).attr("y", function(a) {
    var s = e.node(a);
    return -s.height / 2;
  });
}
function ae(r, e) {
  var t = r.filter(function() {
    return !x(this).classed("update");
  });
  function n(a) {
    var s = e.edge(a);
    return S(s, "x") ? "translate(" + s.x + "," + s.y + ")" : "";
  }
  t.attr("transform", n), E(r, e).style("opacity", 1).attr("transform", n);
}
function ne(r, e) {
  var t = r.filter(function() {
    return !x(this).classed("update");
  });
  function n(a) {
    var s = e.node(a);
    return "translate(" + s.x + "," + s.y + ")";
  }
  t.attr("transform", n), E(r, e).style("opacity", 1).attr("transform", n);
}
function dt(r, e, t, n) {
  var a = r.x, s = r.y, i = a - n.x, o = s - n.y, l = Math.sqrt(e * e * o * o + t * t * i * i), d = Math.abs(e * t * i / l);
  n.x < a && (d = -d);
  var c = Math.abs(e * t * o / l);
  return n.y < s && (c = -c), { x: a + d, y: s + c };
}
function se(r, e, t) {
  return dt(r, e, e, t);
}
function ie(r, e, t, n) {
  var a, s, i, o, l, d, c, v, h, u, p, y, f, g, k;
  if (a = e.y - r.y, i = r.x - e.x, l = e.x * r.y - r.x * e.y, h = a * t.x + i * t.y + l, u = a * n.x + i * n.y + l, !(h !== 0 && u !== 0 && tt(h, u)) && (s = n.y - t.y, o = t.x - n.x, d = n.x * t.y - t.x * n.y, c = s * r.x + o * r.y + d, v = s * e.x + o * e.y + d, !(c !== 0 && v !== 0 && tt(c, v)) && (p = a * o - s * i, p !== 0)))
    return y = Math.abs(p / 2), f = i * d - o * l, g = f < 0 ? (f - y) / p : (f + y) / p, f = s * l - a * d, k = f < 0 ? (f - y) / p : (f + y) / p, { x: g, y: k };
}
function tt(r, e) {
  return r * e > 0;
}
function T(r, e, t) {
  var n = r.x, a = r.y, s = [], i = Number.POSITIVE_INFINITY, o = Number.POSITIVE_INFINITY;
  e.forEach(function(p) {
    i = Math.min(i, p.x), o = Math.min(o, p.y);
  });
  for (var l = n - r.width / 2 - i, d = a - r.height / 2 - o, c = 0; c < e.length; c++) {
    var v = e[c], h = e[c < e.length - 1 ? c + 1 : 0], u = ie(
      r,
      t,
      { x: l + v.x, y: d + v.y },
      { x: l + h.x, y: d + h.y }
    );
    u && s.push(u);
  }
  return s.length ? (s.length > 1 && s.sort(function(p, y) {
    var f = p.x - t.x, g = p.y - t.y, k = Math.sqrt(f * f + g * g), I = y.x - t.x, _ = y.y - t.y, W = Math.sqrt(I * I + _ * _);
    return k < W ? -1 : k === W ? 0 : 1;
  }), s[0]) : (console.log("NO INTERSECTION FOUND, RETURN NODE CENTER", r), r);
}
function O(r, e) {
  var t = r.x, n = r.y, a = e.x - t, s = e.y - n, i = r.width / 2, o = r.height / 2, l, d;
  return Math.abs(s) * i > Math.abs(a) * o ? (s < 0 && (o = -o), l = s === 0 ? 0 : o * a / s, d = o) : (a < 0 && (i = -i), l = i, d = a === 0 ? 0 : i * s / a), { x: t + l, y: n + d };
}
var J = {
  rect: le,
  ellipse: ce,
  circle: de,
  diamond: he
};
function oe(r) {
  J = r;
}
function le(r, e, t) {
  var n = r.insert("rect", ":first-child").attr("rx", t.rx).attr("ry", t.ry).attr("x", -e.width / 2).attr("y", -e.height / 2).attr("width", e.width).attr("height", e.height);
  return t.intersect = function(a) {
    return O(t, a);
  }, n;
}
function ce(r, e, t) {
  var n = e.width / 2, a = e.height / 2, s = r.insert("ellipse", ":first-child").attr("x", -e.width / 2).attr("y", -e.height / 2).attr("rx", n).attr("ry", a);
  return t.intersect = function(i) {
    return dt(t, n, a, i);
  }, s;
}
function de(r, e, t) {
  var n = Math.max(e.width, e.height) / 2, a = r.insert("circle", ":first-child").attr("x", -e.width / 2).attr("y", -e.height / 2).attr("r", n);
  return t.intersect = function(s) {
    return se(t, n, s);
  }, a;
}
function he(r, e, t) {
  var n = e.width * Math.SQRT2 / 2, a = e.height * Math.SQRT2 / 2, s = [
    { x: 0, y: -a },
    { x: -n, y: 0 },
    { x: 0, y: a },
    { x: n, y: 0 }
  ], i = r.insert("polygon", ":first-child").attr(
    "points",
    s.map(function(o) {
      return o.x + "," + o.y;
    }).join(" ")
  );
  return t.intersect = function(o) {
    return T(t, s, o);
  }, i;
}
function ue() {
  var r = function(e, t) {
    ve(t);
    var n = D(e, "output"), a = D(n, "clusters"), s = D(n, "edgePaths"), i = q(D(n, "edgeLabels"), t), o = K(D(n, "nodes"), t, J);
    It(t), ne(o, t), ae(i, t), Q(s, t, X);
    var l = F(a, t);
    re(l, t), ge(t);
  };
  return r.createNodes = function(e) {
    return arguments.length ? (ee(e), r) : K;
  }, r.createClusters = function(e) {
    return arguments.length ? (qt(e), r) : F;
  }, r.createEdgeLabels = function(e) {
    return arguments.length ? (Qt(e), r) : q;
  }, r.createEdgePaths = function(e) {
    return arguments.length ? (Kt(e), r) : Q;
  }, r.shapes = function(e) {
    return arguments.length ? (oe(e), r) : J;
  }, r.arrows = function(e) {
    return arguments.length ? (Wt(e), r) : X;
  }, r;
}
var fe = {
  paddingLeft: 10,
  paddingRight: 10,
  paddingTop: 10,
  paddingBottom: 10,
  rx: 0,
  ry: 0,
  shape: "rect"
}, pe = {
  arrowhead: "normal",
  curve: $
};
function ve(r) {
  r.nodes().forEach(function(e) {
    var t = r.node(e);
    !S(t, "label") && !r.children(e).length && (t.label = e), S(t, "paddingX") && M(t, {
      paddingLeft: t.paddingX,
      paddingRight: t.paddingX
    }), S(t, "paddingY") && M(t, {
      paddingTop: t.paddingY,
      paddingBottom: t.paddingY
    }), S(t, "padding") && M(t, {
      paddingLeft: t.padding,
      paddingRight: t.padding,
      paddingTop: t.padding,
      paddingBottom: t.padding
    }), M(t, fe), et(["paddingLeft", "paddingRight", "paddingTop", "paddingBottom"], function(n) {
      t[n] = Number(t[n]);
    }), S(t, "width") && (t._prevWidth = t.width), S(t, "height") && (t._prevHeight = t.height);
  }), r.edges().forEach(function(e) {
    var t = r.edge(e);
    S(t, "label") || (t.label = ""), M(t, pe);
  });
}
function ge(r) {
  et(r.nodes(), function(e) {
    var t = r.node(e);
    S(t, "_prevWidth") ? t.width = t._prevWidth : delete t.width, S(t, "_prevHeight") ? t.height = t._prevHeight : delete t.height, delete t._prevWidth, delete t._prevHeight;
  });
}
function D(r, e) {
  var t = r.select("g." + e);
  return t.empty() && (t = r.append("g").attr("class", e)), t;
}
function ht(r, e, t) {
  const n = e.width, a = e.height, s = (n + a) * 0.9, i = [
    { x: s / 2, y: 0 },
    { x: s, y: -s / 2 },
    { x: s / 2, y: -s },
    { x: 0, y: -s / 2 }
  ], o = A(r, s, s, i);
  return t.intersect = function(l) {
    return T(t, i, l);
  }, o;
}
function ut(r, e, t) {
  const a = e.height, s = a / 4, i = e.width + 2 * s, o = [
    { x: s, y: 0 },
    { x: i - s, y: 0 },
    { x: i, y: -a / 2 },
    { x: i - s, y: -a },
    { x: s, y: -a },
    { x: 0, y: -a / 2 }
  ], l = A(r, i, a, o);
  return t.intersect = function(d) {
    return T(t, o, d);
  }, l;
}
function ft(r, e, t) {
  const n = e.width, a = e.height, s = [
    { x: -a / 2, y: 0 },
    { x: n, y: 0 },
    { x: n, y: -a },
    { x: -a / 2, y: -a },
    { x: 0, y: -a / 2 }
  ], i = A(r, n, a, s);
  return t.intersect = function(o) {
    return T(t, s, o);
  }, i;
}
function pt(r, e, t) {
  const n = e.width, a = e.height, s = [
    { x: -2 * a / 6, y: 0 },
    { x: n - a / 6, y: 0 },
    { x: n + 2 * a / 6, y: -a },
    { x: a / 6, y: -a }
  ], i = A(r, n, a, s);
  return t.intersect = function(o) {
    return T(t, s, o);
  }, i;
}
function vt(r, e, t) {
  const n = e.width, a = e.height, s = [
    { x: 2 * a / 6, y: 0 },
    { x: n + a / 6, y: 0 },
    { x: n - 2 * a / 6, y: -a },
    { x: -a / 6, y: -a }
  ], i = A(r, n, a, s);
  return t.intersect = function(o) {
    return T(t, s, o);
  }, i;
}
function gt(r, e, t) {
  const n = e.width, a = e.height, s = [
    { x: -2 * a / 6, y: 0 },
    { x: n + 2 * a / 6, y: 0 },
    { x: n - a / 6, y: -a },
    { x: a / 6, y: -a }
  ], i = A(r, n, a, s);
  return t.intersect = function(o) {
    return T(t, s, o);
  }, i;
}
function yt(r, e, t) {
  const n = e.width, a = e.height, s = [
    { x: a / 6, y: 0 },
    { x: n - a / 6, y: 0 },
    { x: n + 2 * a / 6, y: -a },
    { x: -2 * a / 6, y: -a }
  ], i = A(r, n, a, s);
  return t.intersect = function(o) {
    return T(t, s, o);
  }, i;
}
function wt(r, e, t) {
  const n = e.width, a = e.height, s = [
    { x: 0, y: 0 },
    { x: n + a / 2, y: 0 },
    { x: n, y: -a / 2 },
    { x: n + a / 2, y: -a },
    { x: 0, y: -a }
  ], i = A(r, n, a, s);
  return t.intersect = function(o) {
    return T(t, s, o);
  }, i;
}
function mt(r, e, t) {
  const n = e.height, a = e.width + n / 4, s = r.insert("rect", ":first-child").attr("rx", n / 2).attr("ry", n / 2).attr("x", -a / 2).attr("y", -n / 2).attr("width", a).attr("height", n);
  return t.intersect = function(i) {
    return O(t, i);
  }, s;
}
function xt(r, e, t) {
  const n = e.width, a = e.height, s = [
    { x: 0, y: 0 },
    { x: n, y: 0 },
    { x: n, y: -a },
    { x: 0, y: -a },
    { x: 0, y: 0 },
    { x: -8, y: 0 },
    { x: n + 8, y: 0 },
    { x: n + 8, y: -a },
    { x: -8, y: -a },
    { x: -8, y: 0 }
  ], i = A(r, n, a, s);
  return t.intersect = function(o) {
    return T(t, s, o);
  }, i;
}
function bt(r, e, t) {
  const n = e.width, a = n / 2, s = a / (2.5 + n / 50), i = e.height + s, o = "M 0," + s + " a " + a + "," + s + " 0,0,0 " + n + " 0 a " + a + "," + s + " 0,0,0 " + -n + " 0 l 0," + i + " a " + a + "," + s + " 0,0,0 " + n + " 0 l 0," + -i, l = r.attr("label-offset-y", s).insert("path", ":first-child").attr("d", o).attr("transform", "translate(" + -n / 2 + "," + -(i / 2 + s) + ")");
  return t.intersect = function(d) {
    const c = O(t, d), v = c.x - t.x;
    if (a != 0 && (Math.abs(v) < t.width / 2 || Math.abs(v) == t.width / 2 && Math.abs(c.y - t.y) > t.height / 2 - s)) {
      let h = s * s * (1 - v * v / (a * a));
      h != 0 && (h = Math.sqrt(h)), h = s - h, d.y - t.y > 0 && (h = -h), c.y += h;
    }
    return c;
  }, l;
}
function ye(r) {
  r.shapes().question = ht, r.shapes().hexagon = ut, r.shapes().stadium = mt, r.shapes().subroutine = xt, r.shapes().cylinder = bt, r.shapes().rect_left_inv_arrow = ft, r.shapes().lean_right = pt, r.shapes().lean_left = vt, r.shapes().trapezoid = gt, r.shapes().inv_trapezoid = yt, r.shapes().rect_right_inv_arrow = wt;
}
function we(r) {
  r({ question: ht }), r({ hexagon: ut }), r({ stadium: mt }), r({ subroutine: xt }), r({ cylinder: bt }), r({ rect_left_inv_arrow: ft }), r({ lean_right: pt }), r({ lean_left: vt }), r({ trapezoid: gt }), r({ inv_trapezoid: yt }), r({ rect_right_inv_arrow: wt });
}
function A(r, e, t, n) {
  return r.insert("polygon", ":first-child").attr(
    "points",
    n.map(function(a) {
      return a.x + "," + a.y;
    }).join(" ")
  ).attr("transform", "translate(" + -e / 2 + "," + t / 2 + ")");
}
const me = {
  addToRender: ye,
  addToRenderV2: we
}, kt = {}, xe = function(r) {
  const e = Object.keys(r);
  for (const t of e)
    kt[t] = r[t];
}, St = function(r, e, t, n, a, s) {
  return U(this, null, function* () {
    const i = n ? n.select(`[id="${t}"]`) : x(`[id="${t}"]`), o = a || document, l = Object.keys(r);
    for (const d of l) {
      const c = r[d];
      let v = "default";
      c.classes.length > 0 && (v = c.classes.join(" "));
      const h = H(c.styles);
      let u = c.text !== void 0 ? c.text : c.id, p;
      if (rt(G().flowchart.htmlLabels)) {
        const g = {
          label: yield at(
            u.replace(
              /fa[blrs]?:fa-[\w-]+/g,
              // cspell:disable-line
              (k) => `<i class='${k.replace(":", " ")}'></i>`
            ),
            G()
          )
        };
        p = st(i, g).node(), p.parentNode.removeChild(p);
      } else {
        const g = o.createElementNS("http://www.w3.org/2000/svg", "text");
        g.setAttribute("style", h.labelStyle.replace("color:", "fill:"));
        const k = u.split(nt.lineBreakRegex);
        for (const I of k) {
          const _ = o.createElementNS("http://www.w3.org/2000/svg", "tspan");
          _.setAttributeNS("http://www.w3.org/XML/1998/namespace", "xml:space", "preserve"), _.setAttribute("dy", "1em"), _.setAttribute("x", "1"), _.textContent = I, g.appendChild(_);
        }
        p = g;
      }
      let y = 0, f = "";
      switch (c.type) {
        case "round":
          y = 5, f = "rect";
          break;
        case "square":
          f = "rect";
          break;
        case "diamond":
          f = "question";
          break;
        case "hexagon":
          f = "hexagon";
          break;
        case "odd":
          f = "rect_left_inv_arrow";
          break;
        case "lean_right":
          f = "lean_right";
          break;
        case "lean_left":
          f = "lean_left";
          break;
        case "trapezoid":
          f = "trapezoid";
          break;
        case "inv_trapezoid":
          f = "inv_trapezoid";
          break;
        case "odd_right":
          f = "rect_left_inv_arrow";
          break;
        case "circle":
          f = "circle";
          break;
        case "ellipse":
          f = "ellipse";
          break;
        case "stadium":
          f = "stadium";
          break;
        case "subroutine":
          f = "subroutine";
          break;
        case "cylinder":
          f = "cylinder";
          break;
        case "group":
          f = "rect";
          break;
        default:
          f = "rect";
      }
      R.warn("Adding node", c.id, c.domId), e.setNode(s.db.lookUpDomId(c.id), {
        labelType: "svg",
        labelStyle: h.labelStyle,
        shape: f,
        label: p,
        rx: y,
        ry: y,
        class: v,
        style: h.style,
        id: s.db.lookUpDomId(c.id)
      });
    }
  });
}, Lt = function(r, e, t) {
  return U(this, null, function* () {
    let n = 0, a, s;
    if (r.defaultStyle !== void 0) {
      const i = H(r.defaultStyle);
      a = i.style, s = i.labelStyle;
    }
    for (const i of r) {
      n++;
      const o = "L-" + i.start + "-" + i.end, l = "LS-" + i.start, d = "LE-" + i.end, c = {};
      i.type === "arrow_open" ? c.arrowhead = "none" : c.arrowhead = "normal";
      let v = "", h = "";
      if (i.style !== void 0) {
        const u = H(i.style);
        v = u.style, h = u.labelStyle;
      } else
        switch (i.stroke) {
          case "normal":
            v = "fill:none", a !== void 0 && (v = a), s !== void 0 && (h = s);
            break;
          case "dotted":
            v = "fill:none;stroke-width:2px;stroke-dasharray:3;";
            break;
          case "thick":
            v = " stroke-width: 3.5px;fill:none";
            break;
        }
      c.style = v, c.labelStyle = h, i.interpolate !== void 0 ? c.curve = Y(i.interpolate, $) : r.defaultInterpolate !== void 0 ? c.curve = Y(r.defaultInterpolate, $) : c.curve = Y(kt.curve, $), i.text === void 0 ? i.style !== void 0 && (c.arrowheadStyle = "fill: #333") : (c.arrowheadStyle = "fill: #333", c.labelpos = "c", rt(G().flowchart.htmlLabels) ? (c.labelType = "html", c.label = `<span id="L-${o}" class="edgeLabel L-${l}' L-${d}" style="${c.labelStyle}">${yield at(
        i.text.replace(
          /fa[blrs]?:fa-[\w-]+/g,
          // cspell:disable-line
          (u) => `<i class='${u.replace(":", " ")}'></i>`
        ),
        G()
      )}</span>`) : (c.labelType = "text", c.label = i.text.replace(nt.lineBreakRegex, `
`), i.style === void 0 && (c.style = c.style || "stroke: #333; stroke-width: 1.5px;fill:none"), c.labelStyle = c.labelStyle.replace("color:", "fill:"))), c.id = o, c.class = l + " " + d, c.minlen = i.length || 1, e.setEdge(t.db.lookUpDomId(i.start), t.db.lookUpDomId(i.end), c, n);
    }
  });
}, be = function(r, e) {
  return R.info("Extracting classes"), e.db.getClasses();
}, ke = function(r, e, t, n) {
  return U(this, null, function* () {
    R.info("Drawing flowchart");
    const { securityLevel: a, flowchart: s } = G();
    let i;
    a === "sandbox" && (i = x("#i" + e));
    const o = a === "sandbox" ? x(i.nodes()[0].contentDocument.body) : x("body"), l = a === "sandbox" ? i.nodes()[0].contentDocument : document;
    let d = n.db.getDirection();
    d === void 0 && (d = "TD");
    const c = s.nodeSpacing || 50, v = s.rankSpacing || 50, h = new Et({
      multigraph: !0,
      compound: !0
    }).setGraph({
      rankdir: d,
      nodesep: c,
      ranksep: v,
      marginx: 8,
      marginy: 8
    }).setDefaultEdgeLabel(function() {
      return {};
    });
    let u;
    const p = n.db.getSubGraphs();
    for (let w = p.length - 1; w >= 0; w--)
      u = p[w], n.db.addVertex(u.id, u.title, "group", void 0, u.classes);
    const y = n.db.getVertices();
    R.warn("Get vertices", y);
    const f = n.db.getEdges();
    let g = 0;
    for (g = p.length - 1; g >= 0; g--) {
      u = p[g], Dt("cluster").append("text");
      for (let w = 0; w < u.nodes.length; w++)
        R.warn(
          "Setting subgraph",
          u.nodes[w],
          n.db.lookUpDomId(u.nodes[w]),
          n.db.lookUpDomId(u.id)
        ), h.setParent(n.db.lookUpDomId(u.nodes[w]), n.db.lookUpDomId(u.id));
    }
    yield St(y, h, e, o, l, n), yield Lt(f, h, n);
    const k = new ue();
    me.addToRender(k), k.arrows().none = function(b, L, m, B) {
      const C = b.append("marker").attr("id", L).attr("viewBox", "0 0 10 10").attr("refX", 9).attr("refY", 5).attr("markerUnits", "strokeWidth").attr("markerWidth", 8).attr("markerHeight", 6).attr("orient", "auto").append("path").attr("d", "M 0 0 L 0 0 L 0 0 z");
      N(C, m[B + "Style"]);
    }, k.arrows().normal = function(b, L) {
      b.append("marker").attr("id", L).attr("viewBox", "0 0 10 10").attr("refX", 9).attr("refY", 5).attr("markerUnits", "strokeWidth").attr("markerWidth", 8).attr("markerHeight", 6).attr("orient", "auto").append("path").attr("d", "M 0 0 L 10 5 L 0 10 z").attr("class", "arrowheadPath").style("stroke-width", 1).style("stroke-dasharray", "1,0");
    };
    const I = o.select(`[id="${e}"]`), _ = o.select("#" + e + " g");
    for (k(_, h), _.selectAll("g.node").attr("title", function() {
      return n.db.getTooltip(this.id);
    }), n.db.indexNodes("subGraph" + g), g = 0; g < p.length; g++)
      if (u = p[g], u.title !== "undefined") {
        const w = l.querySelectorAll(
          "#" + e + ' [id="' + n.db.lookUpDomId(u.id) + '"] rect'
        ), b = l.querySelectorAll(
          "#" + e + ' [id="' + n.db.lookUpDomId(u.id) + '"]'
        ), L = w[0].x.baseVal.value, m = w[0].y.baseVal.value, B = w[0].width.baseVal.value, C = x(b[0]).select(".label");
        C.attr("transform", `translate(${L + B / 2}, ${m + 14})`), C.attr("id", e + "Text");
        for (let V = 0; V < u.classes.length; V++)
          b[0].classList.add(u.classes[V]);
      }
    if (!s.htmlLabels) {
      const w = l.querySelectorAll('[id="' + e + '"] .edgeLabel .label');
      for (const b of w) {
        const L = b.getBBox(), m = l.createElementNS("http://www.w3.org/2000/svg", "rect");
        m.setAttribute("rx", 0), m.setAttribute("ry", 0), m.setAttribute("width", L.width), m.setAttribute("height", L.height), b.insertBefore(m, b.firstChild);
      }
    }
    Tt(h, I, s.diagramPadding, s.useMaxWidth), Object.keys(y).forEach(function(w) {
      const b = y[w];
      if (b.link) {
        const L = o.select("#" + e + ' [id="' + n.db.lookUpDomId(w) + '"]');
        if (L) {
          const m = l.createElementNS("http://www.w3.org/2000/svg", "a");
          m.setAttributeNS("http://www.w3.org/2000/svg", "class", b.classes.join(" ")), m.setAttributeNS("http://www.w3.org/2000/svg", "href", b.link), m.setAttributeNS("http://www.w3.org/2000/svg", "rel", "noopener"), a === "sandbox" ? m.setAttributeNS("http://www.w3.org/2000/svg", "target", "_top") : b.linkTarget && m.setAttributeNS("http://www.w3.org/2000/svg", "target", b.linkTarget);
          const B = L.insert(function() {
            return m;
          }, ":first-child"), P = L.select(".label-container");
          P && B.append(function() {
            return P.node();
          });
          const C = L.select(".label");
          C && B.append(function() {
            return C.node();
          });
        }
      }
    });
  });
}, Se = {
  setConf: xe,
  addVertices: St,
  addEdges: Lt,
  getClasses: be,
  draw: ke
}, Ue = {
  parser: _t,
  db: z,
  renderer: Bt,
  styles: Mt,
  init: (r) => {
    r.flowchart || (r.flowchart = {}), r.flowchart.arrowMarkerAbsolute = r.arrowMarkerAbsolute, Se.setConf(r.flowchart), z.clear(), z.setGen("gen-1");
  }
};
export {
  Ue as diagram
};
