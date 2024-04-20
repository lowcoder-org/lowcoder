var H = Object.defineProperty;
var A = Object.getOwnPropertySymbols;
var V = Object.prototype.hasOwnProperty, W = Object.prototype.propertyIsEnumerable;
var $ = (l, t, n) => t in l ? H(l, t, { enumerable: !0, configurable: !0, writable: !0, value: n }) : l[t] = n, k = (l, t) => {
  for (var n in t || (t = {}))
    V.call(t, n) && $(l, n, t[n]);
  if (A)
    for (var n of A(t))
      W.call(t, n) && $(l, n, t[n]);
  return l;
};
var I = (l, t, n) => new Promise((i, e) => {
  var c = (o) => {
    try {
      r(n.next(o));
    } catch (a) {
      e(a);
    }
  }, s = (o) => {
    try {
      r(n.throw(o));
    } catch (a) {
      e(a);
    }
  }, r = (o) => o.done ? i(o.value) : Promise.resolve(o.value).then(c, s);
  r((n = n.apply(l, t)).next());
});
import { p as J, d as M, s as K } from "./f434312e.js";
import { l as p, e as d, j as S, C as Q, v as U, q as B, u as G, p as q, m as z } from "./08856db2.js";
import { G as X } from "./4504d077.js";
import { r as Y } from "./7ca39633.js";
import "./666097a3.js";
import "./289514c9.js";
import "./691304fa.js";
import "./f69b998c.js";
import "./8e8be6e8.js";
import "./2ff2c7a6.js";
import "./256b619e.js";
const L = (l) => z.sanitizeText(l, d());
let T = {
  dividerMargin: 10,
  padding: 5,
  textHeight: 10,
  curve: void 0
};
const Z = function(l, t, n, i) {
  const e = Object.keys(l);
  p.info("keys:", e), p.info(l), e.forEach(function(c) {
    var y;
    var s, r;
    const o = l[c], f = {
      shape: "rect",
      id: o.id,
      domId: o.domId,
      labelText: L(o.id),
      labelStyle: "",
      style: "fill: none; stroke: black",
      // TODO V10: Flowchart ? Keeping flowchart for backwards compatibility. Remove in next major release
      padding: (y = (s = d().flowchart) == null ? void 0 : s.padding) != null ? y : (r = d().class) == null ? void 0 : r.padding
    };
    t.setNode(o.id, f), P(o.classes, t, n, i, o.id), p.info("setNode", f);
  });
}, P = function(l, t, n, i, e) {
  const c = Object.keys(l);
  p.info("keys:", c), p.info(l), c.filter((s) => l[s].parent == e).forEach(function(s) {
    var x, m;
    var r, o;
    const a = l[s], f = a.cssClasses.join(" "), y = B(a.styles), v = (x = a.label) != null ? x : a.id, b = 0, h = "class_box", u = {
      labelStyle: y.labelStyle,
      shape: h,
      labelText: L(v),
      classData: a,
      rx: b,
      ry: b,
      class: f,
      style: y.style,
      id: a.id,
      domId: a.domId,
      tooltip: i.db.getTooltip(a.id, e) || "",
      haveCallback: a.haveCallback,
      link: a.link,
      width: a.type === "group" ? 500 : void 0,
      type: a.type,
      // TODO V10: Flowchart ? Keeping flowchart for backwards compatibility. Remove in next major release
      padding: (m = (r = d().flowchart) == null ? void 0 : r.padding) != null ? m : (o = d().class) == null ? void 0 : o.padding
    };
    t.setNode(a.id, u), e && t.setParent(a.id, e), p.info("setNode", u);
  });
}, j = function(l, t, n, i) {
  p.info(l), l.forEach(function(e, c) {
    var m;
    var s, r;
    const o = e, a = "", f = { labelStyle: "", style: "" }, y = o.text, v = 0, b = "note", h = {
      labelStyle: f.labelStyle,
      shape: b,
      labelText: L(y),
      noteData: o,
      rx: v,
      ry: v,
      class: a,
      style: f.style,
      id: o.id,
      domId: o.id,
      tooltip: "",
      type: "note",
      // TODO V10: Flowchart ? Keeping flowchart for backwards compatibility. Remove in next major release
      padding: (m = (s = d().flowchart) == null ? void 0 : s.padding) != null ? m : (r = d().class) == null ? void 0 : r.padding
    };
    if (t.setNode(o.id, h), p.info("setNode", h), !o.class || !(o.class in i))
      return;
    const u = n + c, x = {
      id: `edgeNote${u}`,
      //Set relationship style and line type
      classes: "relation",
      pattern: "dotted",
      // Set link type for rendering
      arrowhead: "none",
      //Set edge extra labels
      startLabelRight: "",
      endLabelLeft: "",
      //Set relation arrow types
      arrowTypeStart: "none",
      arrowTypeEnd: "none",
      style: "fill:none",
      labelStyle: "",
      curve: G(T.curve, q)
    };
    t.setEdge(o.id, o.class, x, u);
  });
}, O = function(l, t) {
  const n = d().flowchart;
  let i = 0;
  l.forEach(function(e) {
    var r;
    var c;
    i++;
    const s = {
      //Set relationship style and line type
      classes: "relation",
      pattern: e.relation.lineType == 1 ? "dashed" : "solid",
      id: `id_${e.id1}_${e.id2}_${i}`,
      // Set link type for rendering
      arrowhead: e.type === "arrow_open" ? "none" : "normal",
      //Set edge extra labels
      startLabelRight: e.relationTitle1 === "none" ? "" : e.relationTitle1,
      endLabelLeft: e.relationTitle2 === "none" ? "" : e.relationTitle2,
      //Set relation arrow types
      arrowTypeStart: R(e.relation.type1),
      arrowTypeEnd: R(e.relation.type2),
      style: "fill:none",
      labelStyle: "",
      curve: G(n == null ? void 0 : n.curve, q)
    };
    if (p.info(s, e), e.style !== void 0) {
      const o = B(e.style);
      s.style = o.style, s.labelStyle = o.labelStyle;
    }
    e.text = e.title, e.text === void 0 ? e.style !== void 0 && (s.arrowheadStyle = "fill: #333") : (s.arrowheadStyle = "fill: #333", s.labelpos = "c", ((r = (c = d().flowchart) == null ? void 0 : c.htmlLabels) != null ? r : d().htmlLabels) ? (s.labelType = "html", s.label = '<span class="edgeLabel">' + e.text + "</span>") : (s.labelType = "text", s.label = e.text.replace(z.lineBreakRegex, `
`), e.style === void 0 && (s.style = s.style || "stroke: #333; stroke-width: 1.5px;fill:none"), s.labelStyle = s.labelStyle.replace("color:", "fill:"))), t.setEdge(e.id1, e.id2, s, i);
  });
}, ee = function(l) {
  T = k(k({}, T), l);
}, te = function(l, t, n, i) {
  return I(this, null, function* () {
    var m, _, N, C;
    p.info("Drawing class - ", t);
    const e = (m = d().flowchart) != null ? m : d().class, c = d().securityLevel;
    p.info("config:", e);
    const s = (_ = e == null ? void 0 : e.nodeSpacing) != null ? _ : 50, r = (N = e == null ? void 0 : e.rankSpacing) != null ? N : 50, o = new X({
      multigraph: !0,
      compound: !0
    }).setGraph({
      rankdir: i.db.getDirection(),
      nodesep: s,
      ranksep: r,
      marginx: 8,
      marginy: 8
    }).setDefaultEdgeLabel(function() {
      return {};
    }), a = i.db.getNamespaces(), f = i.db.getClasses(), y = i.db.getRelations(), v = i.db.getNotes();
    p.info(y), Z(a, o, t, i), P(f, o, t, i), O(y, o), j(v, o, y.length + 1, f);
    let b;
    c === "sandbox" && (b = S("#i" + t));
    const h = c === "sandbox" ? S(b.nodes()[0].contentDocument.body) : S("body"), u = h.select(`[id="${t}"]`), x = h.select("#" + t + " g");
    if (yield Y(
      x,
      o,
      ["aggregation", "extension", "composition", "dependency", "lollipop"],
      "classDiagram",
      t
    ), Q.insertTitle(u, "classTitleText", (C = e == null ? void 0 : e.titleTopMargin) != null ? C : 5, i.db.getDiagramTitle()), U(o, u, e == null ? void 0 : e.diagramPadding, e == null ? void 0 : e.useMaxWidth), !(e != null && e.htmlLabels)) {
      const D = c === "sandbox" ? b.nodes()[0].contentDocument : document, F = D.querySelectorAll('[id="' + t + '"] .edgeLabel .label');
      for (const w of F) {
        const E = w.getBBox(), g = D.createElementNS("http://www.w3.org/2000/svg", "rect");
        g.setAttribute("rx", 0), g.setAttribute("ry", 0), g.setAttribute("width", E.width), g.setAttribute("height", E.height), w.insertBefore(g, w.firstChild);
      }
    }
  });
};
function R(l) {
  let t;
  switch (l) {
    case 0:
      t = "aggregation";
      break;
    case 1:
      t = "extension";
      break;
    case 2:
      t = "composition";
      break;
    case 3:
      t = "dependency";
      break;
    case 4:
      t = "lollipop";
      break;
    default:
      t = "none";
  }
  return t;
}
const oe = {
  setConf: ee,
  draw: te
}, ue = {
  parser: J,
  db: M,
  renderer: oe,
  styles: K,
  init: (l) => {
    l.class || (l.class = {}), l.class.arrowMarkerAbsolute = l.arrowMarkerAbsolute, M.clear();
  }
};
export {
  ue as diagram
};
