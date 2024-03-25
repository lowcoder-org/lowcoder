var H = Object.defineProperty;
var C = Object.getOwnPropertySymbols;
var V = Object.prototype.hasOwnProperty, W = Object.prototype.propertyIsEnumerable;
var $ = (l, e, n) => e in l ? H(l, e, { enumerable: !0, configurable: !0, writable: !0, value: n }) : l[e] = n, k = (l, e) => {
  for (var n in e || (e = {}))
    V.call(e, n) && $(l, n, e[n]);
  if (C)
    for (var n of C(e))
      W.call(e, n) && $(l, n, e[n]);
  return l;
};
var I = (l, e, n) => new Promise((i, t) => {
  var c = (o) => {
    try {
      r(n.next(o));
    } catch (a) {
      t(a);
    }
  }, s = (o) => {
    try {
      r(n.throw(o));
    } catch (a) {
      t(a);
    }
  }, r = (o) => o.done ? i(o.value) : Promise.resolve(o.value).then(c, s);
  r((n = n.apply(l, e)).next());
});
import { p as J, d as M, s as K } from "./d4b9d281.js";
import { l as p, c as d, h as S, A as Q, t as U, o as B, q as G, n as q, j as z } from "./1269154d.js";
import { G as X } from "./4bc5ef7f.js";
import { r as Y } from "./65d3daa9.js";
import "./bcc07d29.js";
import "./c4c5f13b.js";
import "./e95fa522.js";
import "./945d7302.js";
import "./e437d53e.js";
import "./2ff2c7a6.js";
import "./256b619e.js";
const L = (l) => z.sanitizeText(l, d());
let T = {
  dividerMargin: 10,
  padding: 5,
  textHeight: 10,
  curve: void 0
};
const Z = function(l, e, n, i) {
  const t = Object.keys(l);
  p.info("keys:", t), p.info(l), t.forEach(function(c) {
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
    e.setNode(o.id, f), P(o.classes, e, n, i, o.id), p.info("setNode", f);
  });
}, P = function(l, e, n, i, t) {
  const c = Object.keys(l);
  p.info("keys:", c), p.info(l), c.filter((s) => l[s].parent == t).forEach(function(s) {
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
      tooltip: i.db.getTooltip(a.id, t) || "",
      haveCallback: a.haveCallback,
      link: a.link,
      width: a.type === "group" ? 500 : void 0,
      type: a.type,
      // TODO V10: Flowchart ? Keeping flowchart for backwards compatibility. Remove in next major release
      padding: (m = (r = d().flowchart) == null ? void 0 : r.padding) != null ? m : (o = d().class) == null ? void 0 : o.padding
    };
    e.setNode(a.id, u), t && e.setParent(a.id, t), p.info("setNode", u);
  });
}, j = function(l, e, n, i) {
  p.info(l), l.forEach(function(t, c) {
    var m;
    var s, r;
    const o = t, a = "", f = { labelStyle: "", style: "" }, y = o.text, v = 0, b = "note", h = {
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
    if (e.setNode(o.id, h), p.info("setNode", h), !o.class || !(o.class in i))
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
    e.setEdge(o.id, o.class, x, u);
  });
}, O = function(l, e) {
  const n = d().flowchart;
  let i = 0;
  l.forEach(function(t) {
    var r;
    var c;
    i++;
    const s = {
      //Set relationship style and line type
      classes: "relation",
      pattern: t.relation.lineType == 1 ? "dashed" : "solid",
      id: `id_${t.id1}_${t.id2}_${i}`,
      // Set link type for rendering
      arrowhead: t.type === "arrow_open" ? "none" : "normal",
      //Set edge extra labels
      startLabelRight: t.relationTitle1 === "none" ? "" : t.relationTitle1,
      endLabelLeft: t.relationTitle2 === "none" ? "" : t.relationTitle2,
      //Set relation arrow types
      arrowTypeStart: R(t.relation.type1),
      arrowTypeEnd: R(t.relation.type2),
      style: "fill:none",
      labelStyle: "",
      curve: G(n == null ? void 0 : n.curve, q)
    };
    if (p.info(s, t), t.style !== void 0) {
      const o = B(t.style);
      s.style = o.style, s.labelStyle = o.labelStyle;
    }
    t.text = t.title, t.text === void 0 ? t.style !== void 0 && (s.arrowheadStyle = "fill: #333") : (s.arrowheadStyle = "fill: #333", s.labelpos = "c", ((r = (c = d().flowchart) == null ? void 0 : c.htmlLabels) != null ? r : d().htmlLabels) ? (s.labelType = "html", s.label = '<span class="edgeLabel">' + t.text + "</span>") : (s.labelType = "text", s.label = t.text.replace(z.lineBreakRegex, `
`), t.style === void 0 && (s.style = s.style || "stroke: #333; stroke-width: 1.5px;fill:none"), s.labelStyle = s.labelStyle.replace("color:", "fill:"))), e.setEdge(t.id1, t.id2, s, i);
  });
}, tt = function(l) {
  T = k(k({}, T), l);
}, et = function(l, e, n, i) {
  return I(this, null, function* () {
    var m, _, N, D;
    p.info("Drawing class - ", e);
    const t = (m = d().flowchart) != null ? m : d().class, c = d().securityLevel;
    p.info("config:", t);
    const s = (_ = t == null ? void 0 : t.nodeSpacing) != null ? _ : 50, r = (N = t == null ? void 0 : t.rankSpacing) != null ? N : 50, o = new X({
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
    p.info(y), Z(a, o, e, i), P(f, o, e, i), O(y, o), j(v, o, y.length + 1, f);
    let b;
    c === "sandbox" && (b = S("#i" + e));
    const h = c === "sandbox" ? S(b.nodes()[0].contentDocument.body) : S("body"), u = h.select(`[id="${e}"]`), x = h.select("#" + e + " g");
    if (yield Y(
      x,
      o,
      ["aggregation", "extension", "composition", "dependency", "lollipop"],
      "classDiagram",
      e
    ), Q.insertTitle(u, "classTitleText", (D = t == null ? void 0 : t.titleTopMargin) != null ? D : 5, i.db.getDiagramTitle()), U(o, u, t == null ? void 0 : t.diagramPadding, t == null ? void 0 : t.useMaxWidth), !(t != null && t.htmlLabels)) {
      const E = c === "sandbox" ? b.nodes()[0].contentDocument : document, F = E.querySelectorAll('[id="' + e + '"] .edgeLabel .label');
      for (const w of F) {
        const A = w.getBBox(), g = E.createElementNS("http://www.w3.org/2000/svg", "rect");
        g.setAttribute("rx", 0), g.setAttribute("ry", 0), g.setAttribute("width", A.width), g.setAttribute("height", A.height), w.insertBefore(g, w.firstChild);
      }
    }
  });
};
function R(l) {
  let e;
  switch (l) {
    case 0:
      e = "aggregation";
      break;
    case 1:
      e = "extension";
      break;
    case 2:
      e = "composition";
      break;
    case 3:
      e = "dependency";
      break;
    case 4:
      e = "lollipop";
      break;
    default:
      e = "none";
  }
  return e;
}
const ot = {
  setConf: tt,
  draw: et
}, ut = {
  parser: J,
  db: M,
  renderer: ot,
  styles: K,
  init: (l) => {
    l.class || (l.class = {}), l.class.arrowMarkerAbsolute = l.arrowMarkerAbsolute, M.clear();
  }
};
export {
  ut as diagram
};
