var v = (e, t, r) => new Promise((i, l) => {
  var a = (c) => {
    try {
      n(r.next(c));
    } catch (o) {
      l(o);
    }
  }, s = (c) => {
    try {
      n(r.throw(c));
    } catch (o) {
      l(o);
    }
  }, n = (c) => c.done ? i(c.value) : Promise.resolve(c.value).then(a, s);
  n((r = r.apply(e, t)).next());
});
import { r as N, e as b, f as J, b7 as V, j as C, l as g, C as U, I as ct } from "./08856db2.js";
import { a as it } from "./f69b998c.js";
import { l as ht } from "./8e8be6e8.js";
const ot = (e, t, r, i) => {
  t.forEach((l) => {
    mt[l](e, r, i);
  });
}, yt = (e, t, r) => {
  g.trace("Making markers for ", r), e.append("defs").append("marker").attr("id", r + "_" + t + "-extensionStart").attr("class", "marker extension " + t).attr("refX", 18).attr("refY", 7).attr("markerWidth", 190).attr("markerHeight", 240).attr("orient", "auto").append("path").attr("d", "M 1,7 L18,13 V 1 Z"), e.append("defs").append("marker").attr("id", r + "_" + t + "-extensionEnd").attr("class", "marker extension " + t).attr("refX", 1).attr("refY", 7).attr("markerWidth", 20).attr("markerHeight", 28).attr("orient", "auto").append("path").attr("d", "M 1,1 V 13 L18,7 Z");
}, pt = (e, t, r) => {
  e.append("defs").append("marker").attr("id", r + "_" + t + "-compositionStart").attr("class", "marker composition " + t).attr("refX", 18).attr("refY", 7).attr("markerWidth", 190).attr("markerHeight", 240).attr("orient", "auto").append("path").attr("d", "M 18,7 L9,13 L1,7 L9,1 Z"), e.append("defs").append("marker").attr("id", r + "_" + t + "-compositionEnd").attr("class", "marker composition " + t).attr("refX", 1).attr("refY", 7).attr("markerWidth", 20).attr("markerHeight", 28).attr("orient", "auto").append("path").attr("d", "M 18,7 L9,13 L1,7 L9,1 Z");
}, ft = (e, t, r) => {
  e.append("defs").append("marker").attr("id", r + "_" + t + "-aggregationStart").attr("class", "marker aggregation " + t).attr("refX", 18).attr("refY", 7).attr("markerWidth", 190).attr("markerHeight", 240).attr("orient", "auto").append("path").attr("d", "M 18,7 L9,13 L1,7 L9,1 Z"), e.append("defs").append("marker").attr("id", r + "_" + t + "-aggregationEnd").attr("class", "marker aggregation " + t).attr("refX", 1).attr("refY", 7).attr("markerWidth", 20).attr("markerHeight", 28).attr("orient", "auto").append("path").attr("d", "M 18,7 L9,13 L1,7 L9,1 Z");
}, xt = (e, t, r) => {
  e.append("defs").append("marker").attr("id", r + "_" + t + "-dependencyStart").attr("class", "marker dependency " + t).attr("refX", 6).attr("refY", 7).attr("markerWidth", 190).attr("markerHeight", 240).attr("orient", "auto").append("path").attr("d", "M 5,7 L9,13 L1,7 L9,1 Z"), e.append("defs").append("marker").attr("id", r + "_" + t + "-dependencyEnd").attr("class", "marker dependency " + t).attr("refX", 13).attr("refY", 7).attr("markerWidth", 20).attr("markerHeight", 28).attr("orient", "auto").append("path").attr("d", "M 18,7 L9,13 L14,7 L9,1 Z");
}, dt = (e, t, r) => {
  e.append("defs").append("marker").attr("id", r + "_" + t + "-lollipopStart").attr("class", "marker lollipop " + t).attr("refX", 13).attr("refY", 7).attr("markerWidth", 190).attr("markerHeight", 240).attr("orient", "auto").append("circle").attr("stroke", "black").attr("fill", "transparent").attr("cx", 7).attr("cy", 7).attr("r", 6), e.append("defs").append("marker").attr("id", r + "_" + t + "-lollipopEnd").attr("class", "marker lollipop " + t).attr("refX", 1).attr("refY", 7).attr("markerWidth", 190).attr("markerHeight", 240).attr("orient", "auto").append("circle").attr("stroke", "black").attr("fill", "transparent").attr("cx", 7).attr("cy", 7).attr("r", 6);
}, gt = (e, t, r) => {
  e.append("marker").attr("id", r + "_" + t + "-pointEnd").attr("class", "marker " + t).attr("viewBox", "0 0 10 10").attr("refX", 6).attr("refY", 5).attr("markerUnits", "userSpaceOnUse").attr("markerWidth", 12).attr("markerHeight", 12).attr("orient", "auto").append("path").attr("d", "M 0 0 L 10 5 L 0 10 z").attr("class", "arrowMarkerPath").style("stroke-width", 1).style("stroke-dasharray", "1,0"), e.append("marker").attr("id", r + "_" + t + "-pointStart").attr("class", "marker " + t).attr("viewBox", "0 0 10 10").attr("refX", 4.5).attr("refY", 5).attr("markerUnits", "userSpaceOnUse").attr("markerWidth", 12).attr("markerHeight", 12).attr("orient", "auto").append("path").attr("d", "M 0 5 L 10 10 L 10 0 z").attr("class", "arrowMarkerPath").style("stroke-width", 1).style("stroke-dasharray", "1,0");
}, ut = (e, t, r) => {
  e.append("marker").attr("id", r + "_" + t + "-circleEnd").attr("class", "marker " + t).attr("viewBox", "0 0 10 10").attr("refX", 11).attr("refY", 5).attr("markerUnits", "userSpaceOnUse").attr("markerWidth", 11).attr("markerHeight", 11).attr("orient", "auto").append("circle").attr("cx", "5").attr("cy", "5").attr("r", "5").attr("class", "arrowMarkerPath").style("stroke-width", 1).style("stroke-dasharray", "1,0"), e.append("marker").attr("id", r + "_" + t + "-circleStart").attr("class", "marker " + t).attr("viewBox", "0 0 10 10").attr("refX", -1).attr("refY", 5).attr("markerUnits", "userSpaceOnUse").attr("markerWidth", 11).attr("markerHeight", 11).attr("orient", "auto").append("circle").attr("cx", "5").attr("cy", "5").attr("r", "5").attr("class", "arrowMarkerPath").style("stroke-width", 1).style("stroke-dasharray", "1,0");
}, bt = (e, t, r) => {
  e.append("marker").attr("id", r + "_" + t + "-crossEnd").attr("class", "marker cross " + t).attr("viewBox", "0 0 11 11").attr("refX", 12).attr("refY", 5.2).attr("markerUnits", "userSpaceOnUse").attr("markerWidth", 11).attr("markerHeight", 11).attr("orient", "auto").append("path").attr("d", "M 1,1 l 9,9 M 10,1 l -9,9").attr("class", "arrowMarkerPath").style("stroke-width", 2).style("stroke-dasharray", "1,0"), e.append("marker").attr("id", r + "_" + t + "-crossStart").attr("class", "marker cross " + t).attr("viewBox", "0 0 11 11").attr("refX", -1).attr("refY", 5.2).attr("markerUnits", "userSpaceOnUse").attr("markerWidth", 11).attr("markerHeight", 11).attr("orient", "auto").append("path").attr("d", "M 1,1 l 9,9 M 10,1 l -9,9").attr("class", "arrowMarkerPath").style("stroke-width", 2).style("stroke-dasharray", "1,0");
}, wt = (e, t, r) => {
  e.append("defs").append("marker").attr("id", r + "_" + t + "-barbEnd").attr("refX", 19).attr("refY", 7).attr("markerWidth", 20).attr("markerHeight", 14).attr("markerUnits", "strokeWidth").attr("orient", "auto").append("path").attr("d", "M 19,7 L9,13 L14,7 L9,1 Z");
}, mt = {
  extension: yt,
  composition: pt,
  aggregation: ft,
  dependency: xt,
  lollipop: dt,
  point: gt,
  circle: ut,
  cross: bt,
  barb: wt
}, yr = ot;
function kt(e, t) {
  t && e.attr("style", t);
}
function vt(e) {
  const t = C(document.createElementNS("http://www.w3.org/2000/svg", "foreignObject")), r = t.append("xhtml:div"), i = e.label, l = e.isNode ? "nodeLabel" : "edgeLabel";
  return r.html(
    '<span class="' + l + '" ' + (e.labelStyle ? 'style="' + e.labelStyle + '"' : "") + ">" + i + "</span>"
  ), kt(r, e.labelStyle), r.style("display", "inline-block"), r.style("white-space", "nowrap"), r.attr("xmlns", "http://www.w3.org/1999/xhtml"), t.node();
}
const Lt = (e, t, r, i) => {
  let l = e || "";
  if (typeof l == "object" && (l = l[0]), N(b().flowchart.htmlLabels)) {
    l = l.replace(/\\n|\n/g, "<br />"), g.debug("vertexText" + l);
    const a = {
      isNode: i,
      label: V(l).replace(
        /fa[blrs]?:fa-[\w-]+/g,
        // cspell: disable-line
        (n) => `<i class='${n.replace(":", " ")}'></i>`
      ),
      labelStyle: t.replace("fill:", "color:")
    };
    return vt(a);
  } else {
    const a = document.createElementNS("http://www.w3.org/2000/svg", "text");
    a.setAttribute("style", t.replace("color:", "fill:"));
    let s = [];
    typeof l == "string" ? s = l.split(/\\n|\n|<br\s*\/?>/gi) : Array.isArray(l) ? s = l : s = [];
    for (const n of s) {
      const c = document.createElementNS("http://www.w3.org/2000/svg", "tspan");
      c.setAttributeNS("http://www.w3.org/XML/1998/namespace", "xml:space", "preserve"), c.setAttribute("dy", "1em"), c.setAttribute("x", "0"), r ? c.setAttribute("class", "title-row") : c.setAttribute("class", "row"), c.textContent = n.trim(), a.appendChild(c);
    }
    return a;
  }
}, H = Lt, T = (e, t, r, i) => v(void 0, null, function* () {
  let l;
  const a = t.useHtmlLabels || N(b().flowchart.htmlLabels);
  r ? l = r : l = "node default";
  const s = e.insert("g").attr("class", l).attr("id", t.domId || t.id), n = s.insert("g").attr("class", "label").attr("style", t.labelStyle);
  let c;
  t.labelText === void 0 ? c = "" : c = typeof t.labelText == "string" ? t.labelText : t.labelText[0];
  const o = n.node();
  let h;
  t.labelType === "markdown" ? h = it(n, J(V(c), b()), {
    useHtmlLabels: a,
    width: t.width || b().flowchart.wrappingWidth,
    classes: "markdown-node-label"
  }) : h = o.appendChild(
    H(
      J(V(c), b()),
      t.labelStyle,
      !1,
      i
    )
  );
  let y = h.getBBox();
  const f = t.padding / 2;
  if (N(b().flowchart.htmlLabels)) {
    const p = h.children[0], d = C(h), k = p.getElementsByTagName("img");
    if (k) {
      const x = c.replace(/<img[^>]*>/g, "").trim() === "";
      yield Promise.all(
        [...k].map(
          (u) => new Promise((M) => {
            function E() {
              if (u.style.display = "flex", u.style.flexDirection = "column", x) {
                const $ = b().fontSize ? b().fontSize : window.getComputedStyle(document.body).fontSize, Y = 5, A = parseInt($, 10) * Y + "px";
                u.style.minWidth = A, u.style.maxWidth = A;
              } else
                u.style.width = "100%";
              M(u);
            }
            setTimeout(() => {
              u.complete && E();
            }), u.addEventListener("error", E), u.addEventListener("load", E);
          })
        )
      );
    }
    y = p.getBoundingClientRect(), d.attr("width", y.width), d.attr("height", y.height);
  }
  return a ? n.attr("transform", "translate(" + -y.width / 2 + ", " + -y.height / 2 + ")") : n.attr("transform", "translate(0, " + -y.height / 2 + ")"), t.centerLabel && n.attr("transform", "translate(" + -y.width / 2 + ", " + -y.height / 2 + ")"), n.insert("rect", ":first-child"), { shapeSvg: s, bbox: y, halfPadding: f, label: n };
}), m = (e, t) => {
  const r = t.node().getBBox();
  e.width = r.width, e.height = r.height;
};
function O(e, t, r, i) {
  return e.insert("polygon", ":first-child").attr(
    "points",
    i.map(function(l) {
      return l.x + "," + l.y;
    }).join(" ")
  ).attr("class", "label-container").attr("transform", "translate(" + -t / 2 + "," + r / 2 + ")");
}
function St(e, t) {
  return e.intersect(t);
}
function nt(e, t, r, i) {
  var l = e.x, a = e.y, s = l - i.x, n = a - i.y, c = Math.sqrt(t * t * n * n + r * r * s * s), o = Math.abs(t * r * s / c);
  i.x < l && (o = -o);
  var h = Math.abs(t * r * n / c);
  return i.y < a && (h = -h), { x: l + o, y: a + h };
}
function Mt(e, t, r) {
  return nt(e, t, t, r);
}
function Tt(e, t, r, i) {
  var l, a, s, n, c, o, h, y, f, p, d, k, x, u, M;
  if (l = t.y - e.y, s = e.x - t.x, c = t.x * e.y - e.x * t.y, f = l * r.x + s * r.y + c, p = l * i.x + s * i.y + c, !(f !== 0 && p !== 0 && K(f, p)) && (a = i.y - r.y, n = r.x - i.x, o = i.x * r.y - r.x * i.y, h = a * e.x + n * e.y + o, y = a * t.x + n * t.y + o, !(h !== 0 && y !== 0 && K(h, y)) && (d = l * n - a * s, d !== 0)))
    return k = Math.abs(d / 2), x = s * o - n * c, u = x < 0 ? (x - k) / d : (x + k) / d, x = a * c - l * o, M = x < 0 ? (x - k) / d : (x + k) / d, { x: u, y: M };
}
function K(e, t) {
  return e * t > 0;
}
function Bt(e, t, r) {
  var i = e.x, l = e.y, a = [], s = Number.POSITIVE_INFINITY, n = Number.POSITIVE_INFINITY;
  typeof t.forEach == "function" ? t.forEach(function(d) {
    s = Math.min(s, d.x), n = Math.min(n, d.y);
  }) : (s = Math.min(s, t.x), n = Math.min(n, t.y));
  for (var c = i - e.width / 2 - s, o = l - e.height / 2 - n, h = 0; h < t.length; h++) {
    var y = t[h], f = t[h < t.length - 1 ? h + 1 : 0], p = Tt(
      e,
      r,
      { x: c + y.x, y: o + y.y },
      { x: c + f.x, y: o + f.y }
    );
    p && a.push(p);
  }
  return a.length ? (a.length > 1 && a.sort(function(d, k) {
    var x = d.x - r.x, u = d.y - r.y, M = Math.sqrt(x * x + u * u), E = k.x - r.x, $ = k.y - r.y, Y = Math.sqrt(E * E + $ * $);
    return M < Y ? -1 : M === Y ? 0 : 1;
  }), a[0]) : e;
}
const Et = (e, t) => {
  var r = e.x, i = e.y, l = t.x - r, a = t.y - i, s = e.width / 2, n = e.height / 2, c, o;
  return Math.abs(a) * s > Math.abs(l) * n ? (a < 0 && (n = -n), c = a === 0 ? 0 : n * l / a, o = n) : (l < 0 && (s = -s), c = s, o = l === 0 ? 0 : s * a / l), { x: r + c, y: i + o };
}, Ct = Et, w = {
  node: St,
  circle: Mt,
  ellipse: nt,
  polygon: Bt,
  rect: Ct
}, $t = (e, t) => v(void 0, null, function* () {
  t.useHtmlLabels || b().flowchart.htmlLabels || (t.centerLabel = !0);
  const { shapeSvg: i, bbox: l, halfPadding: a } = yield T(
    e,
    t,
    "node " + t.classes,
    !0
  );
  g.info("Classes = ", t.classes);
  const s = i.insert("rect", ":first-child");
  return s.attr("rx", t.rx).attr("ry", t.ry).attr("x", -l.width / 2 - a).attr("y", -l.height / 2 - a).attr("width", l.width + t.padding).attr("height", l.height + t.padding), m(t, s), t.intersect = function(n) {
    return w.rect(t, n);
  }, i;
}), _t = $t, Rt = (e) => {
  const t = /* @__PURE__ */ new Set();
  for (const r of e)
    switch (r) {
      case "x":
        t.add("right"), t.add("left");
        break;
      case "y":
        t.add("up"), t.add("down");
        break;
      default:
        t.add(r);
        break;
    }
  return t;
}, It = (e, t, r) => {
  const i = Rt(e), l = 2, a = t.height + 2 * r.padding, s = a / l, n = t.width + 2 * s + r.padding, c = r.padding / 2;
  return i.has("right") && i.has("left") && i.has("up") && i.has("down") ? [
    // Bottom
    { x: 0, y: 0 },
    { x: s, y: 0 },
    { x: n / 2, y: 2 * c },
    { x: n - s, y: 0 },
    { x: n, y: 0 },
    // Right
    { x: n, y: -a / 3 },
    { x: n + 2 * c, y: -a / 2 },
    { x: n, y: -2 * a / 3 },
    { x: n, y: -a },
    // Top
    { x: n - s, y: -a },
    { x: n / 2, y: -a - 2 * c },
    { x: s, y: -a },
    // Left
    { x: 0, y: -a },
    { x: 0, y: -2 * a / 3 },
    { x: -2 * c, y: -a / 2 },
    { x: 0, y: -a / 3 }
  ] : i.has("right") && i.has("left") && i.has("up") ? [
    { x: s, y: 0 },
    { x: n - s, y: 0 },
    { x: n, y: -a / 2 },
    { x: n - s, y: -a },
    { x: s, y: -a },
    { x: 0, y: -a / 2 }
  ] : i.has("right") && i.has("left") && i.has("down") ? [
    { x: 0, y: 0 },
    { x: s, y: -a },
    { x: n - s, y: -a },
    { x: n, y: 0 }
  ] : i.has("right") && i.has("up") && i.has("down") ? [
    { x: 0, y: 0 },
    { x: n, y: -s },
    { x: n, y: -a + s },
    { x: 0, y: -a }
  ] : i.has("left") && i.has("up") && i.has("down") ? [
    { x: n, y: 0 },
    { x: 0, y: -s },
    { x: 0, y: -a + s },
    { x: n, y: -a }
  ] : i.has("right") && i.has("left") ? [
    { x: s, y: 0 },
    { x: s, y: -c },
    { x: n - s, y: -c },
    { x: n - s, y: 0 },
    { x: n, y: -a / 2 },
    { x: n - s, y: -a },
    { x: n - s, y: -a + c },
    { x: s, y: -a + c },
    { x: s, y: -a },
    { x: 0, y: -a / 2 }
  ] : i.has("up") && i.has("down") ? [
    // Bottom center
    { x: n / 2, y: 0 },
    // Left pont of bottom arrow
    { x: 0, y: -c },
    { x: s, y: -c },
    // Left top over vertical section
    { x: s, y: -a + c },
    { x: 0, y: -a + c },
    // Top of arrow
    { x: n / 2, y: -a },
    { x: n, y: -a + c },
    // Top of right vertical bar
    { x: n - s, y: -a + c },
    { x: n - s, y: -c },
    { x: n, y: -c }
  ] : i.has("right") && i.has("up") ? [
    { x: 0, y: 0 },
    { x: n, y: -s },
    { x: 0, y: -a }
  ] : i.has("right") && i.has("down") ? [
    { x: 0, y: 0 },
    { x: n, y: 0 },
    { x: 0, y: -a }
  ] : i.has("left") && i.has("up") ? [
    { x: n, y: 0 },
    { x: 0, y: -s },
    { x: n, y: -a }
  ] : i.has("left") && i.has("down") ? [
    { x: n, y: 0 },
    { x: 0, y: 0 },
    { x: n, y: -a }
  ] : i.has("right") ? [
    { x: s, y: -c },
    { x: s, y: -c },
    { x: n - s, y: -c },
    { x: n - s, y: 0 },
    { x: n, y: -a / 2 },
    { x: n - s, y: -a },
    { x: n - s, y: -a + c },
    // top left corner of arrow
    { x: s, y: -a + c },
    { x: s, y: -a + c }
  ] : i.has("left") ? [
    { x: s, y: 0 },
    { x: s, y: -c },
    // Two points, the right corners
    { x: n - s, y: -c },
    { x: n - s, y: -a + c },
    { x: s, y: -a + c },
    { x: s, y: -a },
    { x: 0, y: -a / 2 }
  ] : i.has("up") ? [
    // Bottom center
    { x: s, y: -c },
    // Left top over vertical section
    { x: s, y: -a + c },
    { x: 0, y: -a + c },
    // Top of arrow
    { x: n / 2, y: -a },
    { x: n, y: -a + c },
    // Top of right vertical bar
    { x: n - s, y: -a + c },
    { x: n - s, y: -c }
  ] : i.has("down") ? [
    // Bottom center
    { x: n / 2, y: 0 },
    // Left pont of bottom arrow
    { x: 0, y: -c },
    { x: s, y: -c },
    // Left top over vertical section
    { x: s, y: -a + c },
    { x: n - s, y: -a + c },
    { x: n - s, y: -c },
    { x: n, y: -c }
  ] : [{ x: 0, y: 0 }];
}, P = (e) => e ? " " + e : "", I = (e, t) => `${t || "node default"}${P(e.classes)} ${P(
  e.class
)}`, tt = (e, t) => v(void 0, null, function* () {
  const { shapeSvg: r, bbox: i } = yield T(
    e,
    t,
    I(t, void 0),
    !0
  ), l = i.width + t.padding, a = i.height + t.padding, s = l + a, n = [
    { x: s / 2, y: 0 },
    { x: s, y: -s / 2 },
    { x: s / 2, y: -s },
    { x: 0, y: -s / 2 }
  ];
  g.info("Question main (Circle)");
  const c = O(r, s, s, n);
  return c.attr("style", t.style), m(t, c), t.intersect = function(o) {
    return g.warn("Intersect called"), w.polygon(t, n, o);
  }, r;
}), Ht = (e, t) => {
  const r = e.insert("g").attr("class", "node default").attr("id", t.domId || t.id), i = 28, l = [
    { x: 0, y: i / 2 },
    { x: i / 2, y: 0 },
    { x: 0, y: -i / 2 },
    { x: -i / 2, y: 0 }
  ];
  return r.insert("polygon", ":first-child").attr(
    "points",
    l.map(function(s) {
      return s.x + "," + s.y;
    }).join(" ")
  ).attr("class", "state-start").attr("r", 7).attr("width", 28).attr("height", 28), t.width = 28, t.height = 28, t.intersect = function(s) {
    return w.circle(t, 14, s);
  }, r;
}, Nt = (e, t) => v(void 0, null, function* () {
  const { shapeSvg: r, bbox: i } = yield T(
    e,
    t,
    I(t, void 0),
    !0
  ), l = 4, a = i.height + t.padding, s = a / l, n = i.width + 2 * s + t.padding, c = [
    { x: s, y: 0 },
    { x: n - s, y: 0 },
    { x: n, y: -a / 2 },
    { x: n - s, y: -a },
    { x: s, y: -a },
    { x: 0, y: -a / 2 }
  ], o = O(r, n, a, c);
  return o.attr("style", t.style), m(t, o), t.intersect = function(h) {
    return w.polygon(t, c, h);
  }, r;
}), Ot = (e, t) => v(void 0, null, function* () {
  const { shapeSvg: r, bbox: i } = yield T(e, t, void 0, !0), l = 2, a = i.height + 2 * t.padding, s = a / l, n = i.width + 2 * s + t.padding, c = It(t.directions, i, t), o = O(r, n, a, c);
  return o.attr("style", t.style), m(t, o), t.intersect = function(h) {
    return w.polygon(t, c, h);
  }, r;
}), Wt = (e, t) => v(void 0, null, function* () {
  const { shapeSvg: r, bbox: i } = yield T(
    e,
    t,
    I(t, void 0),
    !0
  ), l = i.width + t.padding, a = i.height + t.padding, s = [
    { x: -a / 2, y: 0 },
    { x: l, y: 0 },
    { x: l, y: -a },
    { x: -a / 2, y: -a },
    { x: 0, y: -a / 2 }
  ];
  return O(r, l, a, s).attr("style", t.style), t.width = l + a, t.height = a, t.intersect = function(c) {
    return w.polygon(t, s, c);
  }, r;
}), Xt = (e, t) => v(void 0, null, function* () {
  const { shapeSvg: r, bbox: i } = yield T(e, t, I(t), !0), l = i.width + t.padding, a = i.height + t.padding, s = [
    { x: -2 * a / 6, y: 0 },
    { x: l - a / 6, y: 0 },
    { x: l + 2 * a / 6, y: -a },
    { x: a / 6, y: -a }
  ], n = O(r, l, a, s);
  return n.attr("style", t.style), m(t, n), t.intersect = function(c) {
    return w.polygon(t, s, c);
  }, r;
}), Yt = (e, t) => v(void 0, null, function* () {
  const { shapeSvg: r, bbox: i } = yield T(
    e,
    t,
    I(t, void 0),
    !0
  ), l = i.width + t.padding, a = i.height + t.padding, s = [
    { x: 2 * a / 6, y: 0 },
    { x: l + a / 6, y: 0 },
    { x: l - 2 * a / 6, y: -a },
    { x: -a / 6, y: -a }
  ], n = O(r, l, a, s);
  return n.attr("style", t.style), m(t, n), t.intersect = function(c) {
    return w.polygon(t, s, c);
  }, r;
}), Dt = (e, t) => v(void 0, null, function* () {
  const { shapeSvg: r, bbox: i } = yield T(
    e,
    t,
    I(t, void 0),
    !0
  ), l = i.width + t.padding, a = i.height + t.padding, s = [
    { x: -2 * a / 6, y: 0 },
    { x: l + 2 * a / 6, y: 0 },
    { x: l - a / 6, y: -a },
    { x: a / 6, y: -a }
  ], n = O(r, l, a, s);
  return n.attr("style", t.style), m(t, n), t.intersect = function(c) {
    return w.polygon(t, s, c);
  }, r;
}), At = (e, t) => v(void 0, null, function* () {
  const { shapeSvg: r, bbox: i } = yield T(
    e,
    t,
    I(t, void 0),
    !0
  ), l = i.width + t.padding, a = i.height + t.padding, s = [
    { x: a / 6, y: 0 },
    { x: l - a / 6, y: 0 },
    { x: l + 2 * a / 6, y: -a },
    { x: -2 * a / 6, y: -a }
  ], n = O(r, l, a, s);
  return n.attr("style", t.style), m(t, n), t.intersect = function(c) {
    return w.polygon(t, s, c);
  }, r;
}), jt = (e, t) => v(void 0, null, function* () {
  const { shapeSvg: r, bbox: i } = yield T(
    e,
    t,
    I(t, void 0),
    !0
  ), l = i.width + t.padding, a = i.height + t.padding, s = [
    { x: 0, y: 0 },
    { x: l + a / 2, y: 0 },
    { x: l, y: -a / 2 },
    { x: l + a / 2, y: -a },
    { x: 0, y: -a }
  ], n = O(r, l, a, s);
  return n.attr("style", t.style), m(t, n), t.intersect = function(c) {
    return w.polygon(t, s, c);
  }, r;
}), Ut = (e, t) => v(void 0, null, function* () {
  const { shapeSvg: r, bbox: i } = yield T(
    e,
    t,
    I(t, void 0),
    !0
  ), l = i.width + t.padding, a = l / 2, s = a / (2.5 + l / 50), n = i.height + s + t.padding, c = "M 0," + s + " a " + a + "," + s + " 0,0,0 " + l + " 0 a " + a + "," + s + " 0,0,0 " + -l + " 0 l 0," + n + " a " + a + "," + s + " 0,0,0 " + l + " 0 l 0," + -n, o = r.attr("label-offset-y", s).insert("path", ":first-child").attr("style", t.style).attr("d", c).attr("transform", "translate(" + -l / 2 + "," + -(n / 2 + s) + ")");
  return m(t, o), t.intersect = function(h) {
    const y = w.rect(t, h), f = y.x - t.x;
    if (a != 0 && (Math.abs(f) < t.width / 2 || Math.abs(f) == t.width / 2 && Math.abs(y.y - t.y) > t.height / 2 - s)) {
      let p = s * s * (1 - f * f / (a * a));
      p != 0 && (p = Math.sqrt(p)), p = s - p, h.y - t.y > 0 && (p = -p), y.y += p;
    }
    return y;
  }, r;
}), zt = (e, t) => v(void 0, null, function* () {
  const { shapeSvg: r, bbox: i, halfPadding: l } = yield T(
    e,
    t,
    "node " + t.classes + " " + t.class,
    !0
  ), a = r.insert("rect", ":first-child"), s = t.positioned ? t.width : i.width + t.padding, n = t.positioned ? t.height : i.height + t.padding, c = t.positioned ? -s / 2 : -i.width / 2 - l, o = t.positioned ? -n / 2 : -i.height / 2 - l;
  if (a.attr("class", "basic label-container").attr("style", t.style).attr("rx", t.rx).attr("ry", t.ry).attr("x", c).attr("y", o).attr("width", s).attr("height", n), t.props) {
    const h = new Set(Object.keys(t.props));
    t.props.borders && (q(a, t.props.borders, s, n), h.delete("borders")), h.forEach((y) => {
      g.warn(`Unknown node property ${y}`);
    });
  }
  return m(t, a), t.intersect = function(h) {
    return w.rect(t, h);
  }, r;
}), Zt = (e, t) => v(void 0, null, function* () {
  const { shapeSvg: r, bbox: i, halfPadding: l } = yield T(
    e,
    t,
    "node " + t.classes,
    !0
  ), a = r.insert("rect", ":first-child"), s = t.positioned ? t.width : i.width + t.padding, n = t.positioned ? t.height : i.height + t.padding, c = t.positioned ? -s / 2 : -i.width / 2 - l, o = t.positioned ? -n / 2 : -i.height / 2 - l;
  if (a.attr("class", "basic cluster composite label-container").attr("style", t.style).attr("rx", t.rx).attr("ry", t.ry).attr("x", c).attr("y", o).attr("width", s).attr("height", n), t.props) {
    const h = new Set(Object.keys(t.props));
    t.props.borders && (q(a, t.props.borders, s, n), h.delete("borders")), h.forEach((y) => {
      g.warn(`Unknown node property ${y}`);
    });
  }
  return m(t, a), t.intersect = function(h) {
    return w.rect(t, h);
  }, r;
}), Gt = (e, t) => v(void 0, null, function* () {
  const { shapeSvg: r } = yield T(e, t, "label", !0);
  g.trace("Classes = ", t.class);
  const i = r.insert("rect", ":first-child"), l = 0, a = 0;
  if (i.attr("width", l).attr("height", a), r.attr("class", "label edgeLabel"), t.props) {
    const s = new Set(Object.keys(t.props));
    t.props.borders && (q(i, t.props.borders, l, a), s.delete("borders")), s.forEach((n) => {
      g.warn(`Unknown node property ${n}`);
    });
  }
  return m(t, i), t.intersect = function(s) {
    return w.rect(t, s);
  }, r;
});
function q(e, t, r, i) {
  const l = [], a = (n) => {
    l.push(n, 0);
  }, s = (n) => {
    l.push(0, n);
  };
  t.includes("t") ? (g.debug("add top border"), a(r)) : s(r), t.includes("r") ? (g.debug("add right border"), a(i)) : s(i), t.includes("b") ? (g.debug("add bottom border"), a(r)) : s(r), t.includes("l") ? (g.debug("add left border"), a(i)) : s(i), e.attr("stroke-dasharray", l.join(" "));
}
const Ft = (e, t) => {
  let r;
  t.classes ? r = "node " + t.classes : r = "node default";
  const i = e.insert("g").attr("class", r).attr("id", t.domId || t.id), l = i.insert("rect", ":first-child"), a = i.insert("line"), s = i.insert("g").attr("class", "label"), n = t.labelText.flat ? t.labelText.flat() : t.labelText;
  let c = "";
  typeof n == "object" ? c = n[0] : c = n, g.info("Label text abc79", c, n, typeof n == "object");
  const o = s.node().appendChild(H(c, t.labelStyle, !0, !0));
  let h = { width: 0, height: 0 };
  if (N(b().flowchart.htmlLabels)) {
    const k = o.children[0], x = C(o);
    h = k.getBoundingClientRect(), x.attr("width", h.width), x.attr("height", h.height);
  }
  g.info("Text 2", n);
  const y = n.slice(1, n.length);
  let f = o.getBBox();
  const p = s.node().appendChild(
    H(y.join ? y.join("<br/>") : y, t.labelStyle, !0, !0)
  );
  if (N(b().flowchart.htmlLabels)) {
    const k = p.children[0], x = C(p);
    h = k.getBoundingClientRect(), x.attr("width", h.width), x.attr("height", h.height);
  }
  const d = t.padding / 2;
  return C(p).attr(
    "transform",
    "translate( " + // (titleBox.width - bbox.width) / 2 +
    (h.width > f.width ? 0 : (f.width - h.width) / 2) + ", " + (f.height + d + 5) + ")"
  ), C(o).attr(
    "transform",
    "translate( " + // (titleBox.width - bbox.width) / 2 +
    (h.width < f.width ? 0 : -(f.width - h.width) / 2) + ", 0)"
  ), h = s.node().getBBox(), s.attr(
    "transform",
    "translate(" + -h.width / 2 + ", " + (-h.height / 2 - d + 3) + ")"
  ), l.attr("class", "outer title-state").attr("x", -h.width / 2 - d).attr("y", -h.height / 2 - d).attr("width", h.width + t.padding).attr("height", h.height + t.padding), a.attr("class", "divider").attr("x1", -h.width / 2 - d).attr("x2", h.width / 2 + d).attr("y1", -h.height / 2 - d + f.height + d).attr("y2", -h.height / 2 - d + f.height + d), m(t, l), t.intersect = function(k) {
    return w.rect(t, k);
  }, i;
}, Qt = (e, t) => v(void 0, null, function* () {
  const { shapeSvg: r, bbox: i } = yield T(
    e,
    t,
    I(t, void 0),
    !0
  ), l = i.height + t.padding, a = i.width + l / 4 + t.padding, s = r.insert("rect", ":first-child").attr("style", t.style).attr("rx", l / 2).attr("ry", l / 2).attr("x", -a / 2).attr("y", -l / 2).attr("width", a).attr("height", l);
  return m(t, s), t.intersect = function(n) {
    return w.rect(t, n);
  }, r;
}), Vt = (e, t) => v(void 0, null, function* () {
  const { shapeSvg: r, bbox: i, halfPadding: l } = yield T(
    e,
    t,
    I(t, void 0),
    !0
  ), a = r.insert("circle", ":first-child");
  return a.attr("style", t.style).attr("rx", t.rx).attr("ry", t.ry).attr("r", i.width / 2 + l).attr("width", i.width + t.padding).attr("height", i.height + t.padding), g.info("Circle main"), m(t, a), t.intersect = function(s) {
    return g.info("Circle intersect", t, i.width / 2 + l, s), w.circle(t, i.width / 2 + l, s);
  }, r;
}), qt = (e, t) => v(void 0, null, function* () {
  const { shapeSvg: r, bbox: i, halfPadding: l } = yield T(
    e,
    t,
    I(t, void 0),
    !0
  ), a = 5, s = r.insert("g", ":first-child"), n = s.insert("circle"), c = s.insert("circle");
  return s.attr("class", t.class), n.attr("style", t.style).attr("rx", t.rx).attr("ry", t.ry).attr("r", i.width / 2 + l + a).attr("width", i.width + t.padding + a * 2).attr("height", i.height + t.padding + a * 2), c.attr("style", t.style).attr("rx", t.rx).attr("ry", t.ry).attr("r", i.width / 2 + l).attr("width", i.width + t.padding).attr("height", i.height + t.padding), g.info("DoubleCircle main"), m(t, n), t.intersect = function(o) {
    return g.info("DoubleCircle intersect", t, i.width / 2 + l + a, o), w.circle(t, i.width / 2 + l + a, o);
  }, r;
}), Jt = (e, t) => v(void 0, null, function* () {
  const { shapeSvg: r, bbox: i } = yield T(
    e,
    t,
    I(t, void 0),
    !0
  ), l = i.width + t.padding, a = i.height + t.padding, s = [
    { x: 0, y: 0 },
    { x: l, y: 0 },
    { x: l, y: -a },
    { x: 0, y: -a },
    { x: 0, y: 0 },
    { x: -8, y: 0 },
    { x: l + 8, y: 0 },
    { x: l + 8, y: -a },
    { x: -8, y: -a },
    { x: -8, y: 0 }
  ], n = O(r, l, a, s);
  return n.attr("style", t.style), m(t, n), t.intersect = function(c) {
    return w.polygon(t, s, c);
  }, r;
}), Kt = (e, t) => {
  const r = e.insert("g").attr("class", "node default").attr("id", t.domId || t.id), i = r.insert("circle", ":first-child");
  return i.attr("class", "state-start").attr("r", 7).attr("width", 14).attr("height", 14), m(t, i), t.intersect = function(l) {
    return w.circle(t, 7, l);
  }, r;
}, rt = (e, t, r) => {
  const i = e.insert("g").attr("class", "node default").attr("id", t.domId || t.id);
  let l = 70, a = 10;
  r === "LR" && (l = 10, a = 70);
  const s = i.append("rect").attr("x", -1 * l / 2).attr("y", -1 * a / 2).attr("width", l).attr("height", a).attr("class", "fork-join");
  return m(t, s), t.height = t.height + t.padding / 2, t.width = t.width + t.padding / 2, t.intersect = function(n) {
    return w.rect(t, n);
  }, i;
}, Pt = (e, t) => {
  const r = e.insert("g").attr("class", "node default").attr("id", t.domId || t.id), i = r.insert("circle", ":first-child"), l = r.insert("circle", ":first-child");
  return l.attr("class", "state-start").attr("r", 7).attr("width", 14).attr("height", 14), i.attr("class", "state-end").attr("r", 5).attr("width", 10).attr("height", 10), m(t, l), t.intersect = function(a) {
    return w.circle(t, 7, a);
  }, r;
}, tr = (e, t) => {
  const r = t.padding / 2, i = 4, l = 8;
  let a;
  t.classes ? a = "node " + t.classes : a = "node default";
  const s = e.insert("g").attr("class", a).attr("id", t.domId || t.id), n = s.insert("rect", ":first-child"), c = s.insert("line"), o = s.insert("line");
  let h = 0, y = i;
  const f = s.insert("g").attr("class", "label");
  let p = 0;
  const d = t.classData.annotations && t.classData.annotations[0], k = t.classData.annotations[0] ? "«" + t.classData.annotations[0] + "»" : "", x = f.node().appendChild(H(k, t.labelStyle, !0, !0));
  let u = x.getBBox();
  if (N(b().flowchart.htmlLabels)) {
    const L = x.children[0], S = C(x);
    u = L.getBoundingClientRect(), S.attr("width", u.width), S.attr("height", u.height);
  }
  t.classData.annotations[0] && (y += u.height + i, h += u.width);
  let M = t.classData.label;
  t.classData.type !== void 0 && t.classData.type !== "" && (b().flowchart.htmlLabels ? M += "&lt;" + t.classData.type + "&gt;" : M += "<" + t.classData.type + ">");
  const E = f.node().appendChild(H(M, t.labelStyle, !0, !0));
  C(E).attr("class", "classTitle");
  let $ = E.getBBox();
  if (N(b().flowchart.htmlLabels)) {
    const L = E.children[0], S = C(E);
    $ = L.getBoundingClientRect(), S.attr("width", $.width), S.attr("height", $.height);
  }
  y += $.height + i, $.width > h && (h = $.width);
  const Y = [];
  t.classData.members.forEach((L) => {
    const S = L.getDisplayDetails();
    let _ = S.displayText;
    b().flowchart.htmlLabels && (_ = _.replace(/</g, "&lt;").replace(/>/g, "&gt;"));
    const W = f.node().appendChild(
      H(
        _,
        S.cssStyle ? S.cssStyle : t.labelStyle,
        !0,
        !0
      )
    );
    let R = W.getBBox();
    if (N(b().flowchart.htmlLabels)) {
      const Q = W.children[0], j = C(W);
      R = Q.getBoundingClientRect(), j.attr("width", R.width), j.attr("height", R.height);
    }
    R.width > h && (h = R.width), y += R.height + i, Y.push(W);
  }), y += l;
  const A = [];
  if (t.classData.methods.forEach((L) => {
    const S = L.getDisplayDetails();
    let _ = S.displayText;
    b().flowchart.htmlLabels && (_ = _.replace(/</g, "&lt;").replace(/>/g, "&gt;"));
    const W = f.node().appendChild(
      H(
        _,
        S.cssStyle ? S.cssStyle : t.labelStyle,
        !0,
        !0
      )
    );
    let R = W.getBBox();
    if (N(b().flowchart.htmlLabels)) {
      const Q = W.children[0], j = C(W);
      R = Q.getBoundingClientRect(), j.attr("width", R.width), j.attr("height", R.height);
    }
    R.width > h && (h = R.width), y += R.height + i, A.push(W);
  }), y += l, d) {
    let L = (h - u.width) / 2;
    C(x).attr(
      "transform",
      "translate( " + (-1 * h / 2 + L) + ", " + -1 * y / 2 + ")"
    ), p = u.height + i;
  }
  let lt = (h - $.width) / 2;
  return C(E).attr(
    "transform",
    "translate( " + (-1 * h / 2 + lt) + ", " + (-1 * y / 2 + p) + ")"
  ), p += $.height + i, c.attr("class", "divider").attr("x1", -h / 2 - r).attr("x2", h / 2 + r).attr("y1", -y / 2 - r + l + p).attr("y2", -y / 2 - r + l + p), p += l, Y.forEach((L) => {
    var _;
    C(L).attr(
      "transform",
      "translate( " + -h / 2 + ", " + (-1 * y / 2 + p + l / 2) + ")"
    );
    const S = L == null ? void 0 : L.getBBox();
    p += ((_ = S == null ? void 0 : S.height) != null ? _ : 0) + i;
  }), p += l, o.attr("class", "divider").attr("x1", -h / 2 - r).attr("x2", h / 2 + r).attr("y1", -y / 2 - r + l + p).attr("y2", -y / 2 - r + l + p), p += l, A.forEach((L) => {
    var _;
    C(L).attr(
      "transform",
      "translate( " + -h / 2 + ", " + (-1 * y / 2 + p) + ")"
    );
    const S = L == null ? void 0 : L.getBBox();
    p += ((_ = S == null ? void 0 : S.height) != null ? _ : 0) + i;
  }), n.attr("style", t.style).attr("class", "outer title-state").attr("x", -h / 2 - r).attr("y", -(y / 2) - r).attr("width", h + t.padding).attr("height", y + t.padding), m(t, n), t.intersect = function(L) {
    return w.rect(t, L);
  }, s;
}, at = {
  rhombus: tt,
  composite: Zt,
  question: tt,
  rect: zt,
  labelRect: Gt,
  rectWithTitle: Ft,
  choice: Ht,
  circle: Vt,
  doublecircle: qt,
  stadium: Qt,
  hexagon: Nt,
  block_arrow: Ot,
  rect_left_inv_arrow: Wt,
  lean_right: Xt,
  lean_left: Yt,
  trapezoid: Dt,
  inv_trapezoid: At,
  rect_right_inv_arrow: jt,
  cylinder: Ut,
  start: Kt,
  end: Pt,
  note: _t,
  subroutine: Jt,
  fork: rt,
  join: rt,
  class_box: tr
};
let D = {};
const pr = (e, t, r) => v(void 0, null, function* () {
  let i, l;
  if (t.link) {
    let a;
    b().securityLevel === "sandbox" ? a = "_top" : t.linkTarget && (a = t.linkTarget || "_blank"), i = e.insert("svg:a").attr("xlink:href", t.link).attr("target", a), l = yield at[t.shape](i, t, r);
  } else
    l = yield at[t.shape](e, t, r), i = l;
  return t.tooltip && l.attr("title", t.tooltip), t.class && l.attr("class", "node default " + t.class), i.attr("data-node", "true"), i.attr("data-id", t.id), D[t.id] = i, t.haveCallback && D[t.id].attr("class", D[t.id].attr("class") + " clickable"), i;
}), fr = (e, t) => {
  D[t.id] = e;
}, xr = () => {
  D = {};
}, dr = (e) => {
  const t = D[e.id];
  g.trace(
    "Transforming node",
    e.diff,
    e,
    "translate(" + (e.x - e.width / 2 - 5) + ", " + e.width / 2 + ")"
  );
  const r = 8, i = e.diff || 0;
  return e.clusterNode ? t.attr(
    "transform",
    "translate(" + (e.x + i - e.width / 2) + ", " + (e.y - e.height / 2 - r) + ")"
  ) : t.attr("transform", "translate(" + e.x + ", " + e.y + ")"), i;
}, rr = ({
  flowchart: e
}) => {
  var s, n;
  var t, r;
  const i = (s = (t = e == null ? void 0 : e.subGraphTitleMargin) == null ? void 0 : t.top) != null ? s : 0, l = (n = (r = e == null ? void 0 : e.subGraphTitleMargin) == null ? void 0 : r.bottom) != null ? n : 0, a = i + l;
  return {
    subGraphTitleTopMargin: i,
    subGraphTitleBottomMargin: l,
    subGraphTitleTotalMargin: a
  };
}, X = {
  aggregation: 18,
  extension: 18,
  composition: 18,
  dependency: 6,
  lollipop: 13.5,
  arrow_point: 5.3
};
function z(e, t) {
  if (e === void 0 || t === void 0)
    return { angle: 0, deltaX: 0, deltaY: 0 };
  e = G(e), t = G(t);
  const [r, i] = [e.x, e.y], [l, a] = [t.x, t.y], s = l - r, n = a - i;
  return { angle: Math.atan(n / s), deltaX: s, deltaY: n };
}
const G = (e) => Array.isArray(e) ? { x: e[0], y: e[1] } : e, ar = (e) => ({
  x: function(t, r, i) {
    let l = 0;
    if (r === 0 && Object.hasOwn(X, e.arrowTypeStart)) {
      const { angle: a, deltaX: s } = z(i[0], i[1]);
      l = X[e.arrowTypeStart] * Math.cos(a) * (s >= 0 ? 1 : -1);
    } else if (r === i.length - 1 && Object.hasOwn(X, e.arrowTypeEnd)) {
      const { angle: a, deltaX: s } = z(
        i[i.length - 1],
        i[i.length - 2]
      );
      l = X[e.arrowTypeEnd] * Math.cos(a) * (s >= 0 ? 1 : -1);
    }
    return G(t).x + l;
  },
  y: function(t, r, i) {
    let l = 0;
    if (r === 0 && Object.hasOwn(X, e.arrowTypeStart)) {
      const { angle: a, deltaY: s } = z(i[0], i[1]);
      l = X[e.arrowTypeStart] * Math.abs(Math.sin(a)) * (s >= 0 ? 1 : -1);
    } else if (r === i.length - 1 && Object.hasOwn(X, e.arrowTypeEnd)) {
      const { angle: a, deltaY: s } = z(
        i[i.length - 1],
        i[i.length - 2]
      );
      l = X[e.arrowTypeEnd] * Math.abs(Math.sin(a)) * (s >= 0 ? 1 : -1);
    }
    return G(t).y + l;
  }
}), er = (e, t, r, i, l) => {
  t.arrowTypeStart && et(e, "start", t.arrowTypeStart, r, i, l), t.arrowTypeEnd && et(e, "end", t.arrowTypeEnd, r, i, l);
}, sr = {
  arrow_cross: "cross",
  arrow_point: "point",
  arrow_barb: "barb",
  arrow_circle: "circle",
  aggregation: "aggregation",
  extension: "extension",
  composition: "composition",
  dependency: "dependency",
  lollipop: "lollipop"
}, et = (e, t, r, i, l, a) => {
  const s = sr[r];
  if (!s) {
    g.warn(`Unknown arrow type: ${r}`);
    return;
  }
  const n = t === "start" ? "Start" : "End";
  e.attr(`marker-${t}`, `url(${i}#${l}_${a}-${s}${n})`);
};
let F = {}, B = {};
const gr = () => {
  F = {}, B = {};
}, ur = (e, t) => {
  const r = N(b().flowchart.htmlLabels), i = t.labelType === "markdown" ? it(e, t.label, {
    style: t.labelStyle,
    useHtmlLabels: r,
    addSvgBackground: !0
  }) : H(t.label, t.labelStyle), l = e.insert("g").attr("class", "edgeLabel"), a = l.insert("g").attr("class", "label");
  a.node().appendChild(i);
  let s = i.getBBox();
  if (r) {
    const c = i.children[0], o = C(i);
    s = c.getBoundingClientRect(), o.attr("width", s.width), o.attr("height", s.height);
  }
  a.attr("transform", "translate(" + -s.width / 2 + ", " + -s.height / 2 + ")"), F[t.id] = l, t.width = s.width, t.height = s.height;
  let n;
  if (t.startLabelLeft) {
    const c = H(t.startLabelLeft, t.labelStyle), o = e.insert("g").attr("class", "edgeTerminals"), h = o.insert("g").attr("class", "inner");
    n = h.node().appendChild(c);
    const y = c.getBBox();
    h.attr("transform", "translate(" + -y.width / 2 + ", " + -y.height / 2 + ")"), B[t.id] || (B[t.id] = {}), B[t.id].startLeft = o, Z(n, t.startLabelLeft);
  }
  if (t.startLabelRight) {
    const c = H(t.startLabelRight, t.labelStyle), o = e.insert("g").attr("class", "edgeTerminals"), h = o.insert("g").attr("class", "inner");
    n = o.node().appendChild(c), h.node().appendChild(c);
    const y = c.getBBox();
    h.attr("transform", "translate(" + -y.width / 2 + ", " + -y.height / 2 + ")"), B[t.id] || (B[t.id] = {}), B[t.id].startRight = o, Z(n, t.startLabelRight);
  }
  if (t.endLabelLeft) {
    const c = H(t.endLabelLeft, t.labelStyle), o = e.insert("g").attr("class", "edgeTerminals"), h = o.insert("g").attr("class", "inner");
    n = h.node().appendChild(c);
    const y = c.getBBox();
    h.attr("transform", "translate(" + -y.width / 2 + ", " + -y.height / 2 + ")"), o.node().appendChild(c), B[t.id] || (B[t.id] = {}), B[t.id].endLeft = o, Z(n, t.endLabelLeft);
  }
  if (t.endLabelRight) {
    const c = H(t.endLabelRight, t.labelStyle), o = e.insert("g").attr("class", "edgeTerminals"), h = o.insert("g").attr("class", "inner");
    n = h.node().appendChild(c);
    const y = c.getBBox();
    h.attr("transform", "translate(" + -y.width / 2 + ", " + -y.height / 2 + ")"), o.node().appendChild(c), B[t.id] || (B[t.id] = {}), B[t.id].endRight = o, Z(n, t.endLabelRight);
  }
  return i;
};
function Z(e, t) {
  b().flowchart.htmlLabels && e && (e.style.width = t.length * 9 + "px", e.style.height = "12px");
}
const br = (e, t) => {
  g.debug("Moving label abc88 ", e.id, e.label, F[e.id], t);
  let r = t.updatedPath ? t.updatedPath : t.originalPath;
  const i = b(), { subGraphTitleTotalMargin: l } = rr(i);
  if (e.label) {
    const a = F[e.id];
    let s = e.x, n = e.y;
    if (r) {
      const c = U.calcLabelPosition(r);
      g.debug(
        "Moving label " + e.label + " from (",
        s,
        ",",
        n,
        ") to (",
        c.x,
        ",",
        c.y,
        ") abc88"
      ), t.updatedPath && (s = c.x, n = c.y);
    }
    a.attr("transform", `translate(${s}, ${n + l / 2})`);
  }
  if (e.startLabelLeft) {
    const a = B[e.id].startLeft;
    let s = e.x, n = e.y;
    if (r) {
      const c = U.calcTerminalLabelPosition(e.arrowTypeStart ? 10 : 0, "start_left", r);
      s = c.x, n = c.y;
    }
    a.attr("transform", `translate(${s}, ${n})`);
  }
  if (e.startLabelRight) {
    const a = B[e.id].startRight;
    let s = e.x, n = e.y;
    if (r) {
      const c = U.calcTerminalLabelPosition(
        e.arrowTypeStart ? 10 : 0,
        "start_right",
        r
      );
      s = c.x, n = c.y;
    }
    a.attr("transform", `translate(${s}, ${n})`);
  }
  if (e.endLabelLeft) {
    const a = B[e.id].endLeft;
    let s = e.x, n = e.y;
    if (r) {
      const c = U.calcTerminalLabelPosition(e.arrowTypeEnd ? 10 : 0, "end_left", r);
      s = c.x, n = c.y;
    }
    a.attr("transform", `translate(${s}, ${n})`);
  }
  if (e.endLabelRight) {
    const a = B[e.id].endRight;
    let s = e.x, n = e.y;
    if (r) {
      const c = U.calcTerminalLabelPosition(e.arrowTypeEnd ? 10 : 0, "end_right", r);
      s = c.x, n = c.y;
    }
    a.attr("transform", `translate(${s}, ${n})`);
  }
}, ir = (e, t) => {
  const r = e.x, i = e.y, l = Math.abs(t.x - r), a = Math.abs(t.y - i), s = e.width / 2, n = e.height / 2;
  return l >= s || a >= n;
}, nr = (e, t, r) => {
  g.debug(`intersection calc abc89:
  outsidePoint: ${JSON.stringify(t)}
  insidePoint : ${JSON.stringify(r)}
  node        : x:${e.x} y:${e.y} w:${e.width} h:${e.height}`);
  const i = e.x, l = e.y, a = Math.abs(i - r.x), s = e.width / 2;
  let n = r.x < t.x ? s - a : s + a;
  const c = e.height / 2, o = Math.abs(t.y - r.y), h = Math.abs(t.x - r.x);
  if (Math.abs(l - t.y) * s > Math.abs(i - t.x) * c) {
    let y = r.y < t.y ? t.y - c - l : l - c - t.y;
    n = h * y / o;
    const f = {
      x: r.x < t.x ? r.x + n : r.x - h + n,
      y: r.y < t.y ? r.y + o - y : r.y - o + y
    };
    return n === 0 && (f.x = t.x, f.y = t.y), h === 0 && (f.x = t.x), o === 0 && (f.y = t.y), g.debug(`abc89 topp/bott calc, Q ${o}, q ${y}, R ${h}, r ${n}`, f), f;
  } else {
    r.x < t.x ? n = t.x - s - i : n = i - s - t.x;
    let y = o * n / h, f = r.x < t.x ? r.x + h - n : r.x - h + n, p = r.y < t.y ? r.y + y : r.y - y;
    return g.debug(`sides calc abc89, Q ${o}, q ${y}, R ${h}, r ${n}`, { _x: f, _y: p }), n === 0 && (f = t.x, p = t.y), h === 0 && (f = t.x), o === 0 && (p = t.y), { x: f, y: p };
  }
}, st = (e, t) => {
  g.debug("abc88 cutPathAtIntersect", e, t);
  let r = [], i = e[0], l = !1;
  return e.forEach((a) => {
    if (!ir(t, a) && !l) {
      const s = nr(t, i, a);
      let n = !1;
      r.forEach((c) => {
        n = n || c.x === s.x && c.y === s.y;
      }), r.some((c) => c.x === s.x && c.y === s.y) || r.push(s), l = !0;
    } else
      i = a, l || r.push(a);
  }), r;
}, wr = function(e, t, r, i, l, a, s) {
  let n = r.points;
  g.debug("abc88 InsertEdge: edge=", r, "e=", t);
  let c = !1;
  const o = a.node(t.v);
  var h = a.node(t.w);
  h != null && h.intersect && (o != null && o.intersect) && (n = n.slice(1, r.points.length - 1), n.unshift(o.intersect(n[0])), n.push(h.intersect(n[n.length - 1]))), r.toCluster && (g.debug("to cluster abc88", i[r.toCluster]), n = st(r.points, i[r.toCluster].node), c = !0), r.fromCluster && (g.debug("from cluster abc88", i[r.fromCluster]), n = st(n.reverse(), i[r.fromCluster].node).reverse(), c = !0);
  const y = n.filter(($) => !Number.isNaN($.y));
  let f = ct;
  r.curve && (l === "graph" || l === "flowchart") && (f = r.curve);
  const { x: p, y: d } = ar(r), k = ht().x(p).y(d).curve(f);
  let x;
  switch (r.thickness) {
    case "normal":
      x = "edge-thickness-normal";
      break;
    case "thick":
      x = "edge-thickness-thick";
      break;
    case "invisible":
      x = "edge-thickness-thick";
      break;
    default:
      x = "";
  }
  switch (r.pattern) {
    case "solid":
      x += " edge-pattern-solid";
      break;
    case "dotted":
      x += " edge-pattern-dotted";
      break;
    case "dashed":
      x += " edge-pattern-dashed";
      break;
  }
  const u = e.append("path").attr("d", k(y)).attr("id", r.id).attr("class", " " + x + (r.classes ? " " + r.classes : "")).attr("style", r.style);
  let M = "";
  (b().flowchart.arrowMarkerAbsolute || b().state.arrowMarkerAbsolute) && (M = window.location.protocol + "//" + window.location.host + window.location.pathname + window.location.search, M = M.replace(/\(/g, "\\("), M = M.replace(/\)/g, "\\)")), er(u, r, M, s, l);
  let E = {};
  return c && (E.updatedPath = n), E.originalPath = r.points, E;
};
export {
  pr as a,
  ur as b,
  wr as c,
  br as d,
  xr as e,
  gr as f,
  rr as g,
  H as h,
  yr as i,
  Ct as j,
  ar as k,
  T as l,
  er as m,
  dr as p,
  fr as s,
  m as u
};
