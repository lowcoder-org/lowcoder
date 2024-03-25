var C = (e, l, s) => new Promise((o, i) => {
  var p = (c) => {
    try {
      a(s.next(c));
    } catch (r) {
      i(r);
    }
  }, f = (c) => {
    try {
      a(s.throw(c));
    } catch (r) {
      i(r);
    }
  }, a = (c) => c.done ? o(c.value) : Promise.resolve(c.value).then(p, f);
  a((s = s.apply(e, l)).next());
});
import { G as F } from "./4bc5ef7f.js";
import { S as G, v as j, x as U, y as H, z as K, o as B, l as g, p as W, c as S, j as q, r as P, q as L, n as A, h as $, A as X, t as J, B as Q } from "./1269154d.js";
import { r as Y } from "./65d3daa9.js";
import { c as Z } from "./000297fb.js";
function O(e) {
  return typeof e == "string" ? new G([document.querySelectorAll(e)], [document.documentElement]) : new G([U(e)], j);
}
function fe(e, l) {
  return !!e.children(l).length;
}
function ue(e) {
  return N(e.v) + ":" + N(e.w) + ":" + N(e.name);
}
var ee = /:/g;
function N(e) {
  return e ? String(e).replace(ee, "\\:") : "";
}
function te(e, l) {
  l && e.attr("style", l);
}
function we(e, l, s) {
  l && e.attr("class", l).attr("class", s + " " + e.attr("class"));
}
function he(e, l) {
  var s = l.graph();
  if (H(s)) {
    var o = s.transition;
    if (K(o))
      return o(e);
  }
  return e;
}
function re(e, l) {
  var s = e.append("foreignObject").attr("width", "100000"), o = s.append("xhtml:div");
  o.attr("xmlns", "http://www.w3.org/1999/xhtml");
  var i = l.label;
  switch (typeof i) {
    case "function":
      o.insert(i);
      break;
    case "object":
      o.insert(function() {
        return i;
      });
      break;
    default:
      o.html(i);
  }
  te(o, l.labelStyle), o.style("display", "inline-block"), o.style("white-space", "nowrap");
  var p = o.node().getBoundingClientRect();
  return s.attr("width", p.width).attr("height", p.height), s;
}
const V = {}, le = function(e) {
  const l = Object.keys(e);
  for (const s of l)
    V[s] = e[s];
}, M = function(e, l, s, o, i, p) {
  return C(this, null, function* () {
    const f = o.select(`[id="${s}"]`), a = Object.keys(e);
    for (const c of a) {
      const r = e[c];
      let y = "default";
      r.classes.length > 0 && (y = r.classes.join(" ")), y = y + " flowchart-label";
      const w = B(r.styles);
      let t = r.text !== void 0 ? r.text : r.id, d;
      if (g.info("vertex", r, r.labelType), r.labelType === "markdown")
        g.info("vertex", r, r.labelType);
      else if (W(S().flowchart.htmlLabels))
        d = re(f, {
          label: t
        }).node(), d.parentNode.removeChild(d);
      else {
        const k = i.createElementNS("http://www.w3.org/2000/svg", "text");
        k.setAttribute("style", w.labelStyle.replace("color:", "fill:"));
        const _ = t.split(q.lineBreakRegex);
        for (const E of _) {
          const v = i.createElementNS("http://www.w3.org/2000/svg", "tspan");
          v.setAttributeNS("http://www.w3.org/XML/1998/namespace", "xml:space", "preserve"), v.setAttribute("dy", "1em"), v.setAttribute("x", "1"), v.textContent = E, k.appendChild(v);
        }
        d = k;
      }
      let b = 0, n = "";
      switch (r.type) {
        case "round":
          b = 5, n = "rect";
          break;
        case "square":
          n = "rect";
          break;
        case "diamond":
          n = "question";
          break;
        case "hexagon":
          n = "hexagon";
          break;
        case "odd":
          n = "rect_left_inv_arrow";
          break;
        case "lean_right":
          n = "lean_right";
          break;
        case "lean_left":
          n = "lean_left";
          break;
        case "trapezoid":
          n = "trapezoid";
          break;
        case "inv_trapezoid":
          n = "inv_trapezoid";
          break;
        case "odd_right":
          n = "rect_left_inv_arrow";
          break;
        case "circle":
          n = "circle";
          break;
        case "ellipse":
          n = "ellipse";
          break;
        case "stadium":
          n = "stadium";
          break;
        case "subroutine":
          n = "subroutine";
          break;
        case "cylinder":
          n = "cylinder";
          break;
        case "group":
          n = "rect";
          break;
        case "doublecircle":
          n = "doublecircle";
          break;
        default:
          n = "rect";
      }
      const T = yield P(t, S());
      l.setNode(r.id, {
        labelStyle: w.labelStyle,
        shape: n,
        labelText: T,
        labelType: r.labelType,
        rx: b,
        ry: b,
        class: y,
        style: w.style,
        id: r.id,
        link: r.link,
        linkTarget: r.linkTarget,
        tooltip: p.db.getTooltip(r.id) || "",
        domId: p.db.lookUpDomId(r.id),
        haveCallback: r.haveCallback,
        width: r.type === "group" ? 500 : void 0,
        dir: r.dir,
        type: r.type,
        props: r.props,
        padding: S().flowchart.padding
      }), g.info("setNode", {
        labelStyle: w.labelStyle,
        labelType: r.labelType,
        shape: n,
        labelText: T,
        rx: b,
        ry: b,
        class: y,
        style: w.style,
        id: r.id,
        domId: p.db.lookUpDomId(r.id),
        width: r.type === "group" ? 500 : void 0,
        type: r.type,
        dir: r.dir,
        props: r.props,
        padding: S().flowchart.padding
      });
    }
  });
}, R = function(e, l, s) {
  return C(this, null, function* () {
    g.info("abc78 edges = ", e);
    let o = 0, i = {}, p, f;
    if (e.defaultStyle !== void 0) {
      const a = B(e.defaultStyle);
      p = a.style, f = a.labelStyle;
    }
    for (const a of e) {
      o++;
      const c = "L-" + a.start + "-" + a.end;
      i[c] === void 0 ? (i[c] = 0, g.info("abc78 new entry", c, i[c])) : (i[c]++, g.info("abc78 new entry", c, i[c]));
      let r = c + "-" + i[c];
      g.info("abc78 new link id to be used is", c, r, i[c]);
      const y = "LS-" + a.start, w = "LE-" + a.end, t = { style: "", labelStyle: "" };
      switch (t.minlen = a.length || 1, a.type === "arrow_open" ? t.arrowhead = "none" : t.arrowhead = "normal", t.arrowTypeStart = "arrow_open", t.arrowTypeEnd = "arrow_open", a.type) {
        case "double_arrow_cross":
          t.arrowTypeStart = "arrow_cross";
        case "arrow_cross":
          t.arrowTypeEnd = "arrow_cross";
          break;
        case "double_arrow_point":
          t.arrowTypeStart = "arrow_point";
        case "arrow_point":
          t.arrowTypeEnd = "arrow_point";
          break;
        case "double_arrow_circle":
          t.arrowTypeStart = "arrow_circle";
        case "arrow_circle":
          t.arrowTypeEnd = "arrow_circle";
          break;
      }
      let d = "", b = "";
      switch (a.stroke) {
        case "normal":
          d = "fill:none;", p !== void 0 && (d = p), f !== void 0 && (b = f), t.thickness = "normal", t.pattern = "solid";
          break;
        case "dotted":
          t.thickness = "normal", t.pattern = "dotted", t.style = "fill:none;stroke-width:2px;stroke-dasharray:3;";
          break;
        case "thick":
          t.thickness = "thick", t.pattern = "solid", t.style = "stroke-width: 3.5px;fill:none;";
          break;
        case "invisible":
          t.thickness = "invisible", t.pattern = "solid", t.style = "stroke-width: 0;fill:none;";
          break;
      }
      if (a.style !== void 0) {
        const n = B(a.style);
        d = n.style, b = n.labelStyle;
      }
      t.style = t.style += d, t.labelStyle = t.labelStyle += b, a.interpolate !== void 0 ? t.curve = L(a.interpolate, A) : e.defaultInterpolate !== void 0 ? t.curve = L(e.defaultInterpolate, A) : t.curve = L(V.curve, A), a.text === void 0 ? a.style !== void 0 && (t.arrowheadStyle = "fill: #333") : (t.arrowheadStyle = "fill: #333", t.labelpos = "c"), t.labelType = a.labelType, t.label = yield P(a.text.replace(q.lineBreakRegex, `
`), S()), a.style === void 0 && (t.style = t.style || "stroke: #333; stroke-width: 1.5px;fill:none;"), t.labelStyle = t.labelStyle.replace("color:", "fill:"), t.id = r, t.classes = "flowchart-link " + y + " " + w, l.setEdge(a.start, a.end, t, o);
    }
  });
}, ae = function(e, l) {
  return l.db.getClasses();
}, oe = function(e, l, s, o) {
  return C(this, null, function* () {
    g.info("Drawing flowchart");
    let i = o.db.getDirection();
    i === void 0 && (i = "TD");
    const { securityLevel: p, flowchart: f } = S(), a = f.nodeSpacing || 50, c = f.rankSpacing || 50;
    let r;
    p === "sandbox" && (r = $("#i" + l));
    const y = p === "sandbox" ? $(r.nodes()[0].contentDocument.body) : $("body"), w = p === "sandbox" ? r.nodes()[0].contentDocument : document, t = new F({
      multigraph: !0,
      compound: !0
    }).setGraph({
      rankdir: i,
      nodesep: a,
      ranksep: c,
      marginx: 0,
      marginy: 0
    }).setDefaultEdgeLabel(function() {
      return {};
    });
    let d;
    const b = o.db.getSubGraphs();
    g.info("Subgraphs - ", b);
    for (let u = b.length - 1; u >= 0; u--)
      d = b[u], g.info("Subgraph - ", d), o.db.addVertex(
        d.id,
        { text: d.title, type: d.labelType },
        "group",
        void 0,
        d.classes,
        d.dir
      );
    const n = o.db.getVertices(), T = o.db.getEdges();
    g.info("Edges", T);
    let k = 0;
    for (k = b.length - 1; k >= 0; k--) {
      d = b[k], O("cluster").append("text");
      for (let u = 0; u < d.nodes.length; u++)
        g.info("Setting up subgraphs", d.nodes[u], d.id), t.setParent(d.nodes[u], d.id);
    }
    yield M(n, t, l, y, w, o), yield R(T, t);
    const _ = y.select(`[id="${l}"]`), E = y.select("#" + l + " g");
    if (yield Y(E, t, ["point", "circle", "cross"], "flowchart", l), X.insertTitle(_, "flowchartTitleText", f.titleTopMargin, o.db.getDiagramTitle()), J(t, _, f.diagramPadding, f.useMaxWidth), o.db.indexNodes("subGraph" + k), !f.htmlLabels) {
      const u = w.querySelectorAll('[id="' + l + '"] .edgeLabel .label');
      for (const x of u) {
        const m = x.getBBox(), h = w.createElementNS("http://www.w3.org/2000/svg", "rect");
        h.setAttribute("rx", 0), h.setAttribute("ry", 0), h.setAttribute("width", m.width), h.setAttribute("height", m.height), x.insertBefore(h, x.firstChild);
      }
    }
    Object.keys(n).forEach(function(u) {
      const x = n[u];
      if (x.link) {
        const m = $("#" + l + ' [id="' + u + '"]');
        if (m) {
          const h = w.createElementNS("http://www.w3.org/2000/svg", "a");
          h.setAttributeNS("http://www.w3.org/2000/svg", "class", x.classes.join(" ")), h.setAttributeNS("http://www.w3.org/2000/svg", "href", x.link), h.setAttributeNS("http://www.w3.org/2000/svg", "rel", "noopener"), p === "sandbox" ? h.setAttributeNS("http://www.w3.org/2000/svg", "target", "_top") : x.linkTarget && h.setAttributeNS("http://www.w3.org/2000/svg", "target", x.linkTarget);
          const I = m.insert(function() {
            return h;
          }, ":first-child"), D = m.select(".label-container");
          D && I.append(function() {
            return D.node();
          });
          const z = m.select(".label");
          z && I.append(function() {
            return z.node();
          });
        }
      }
    });
  });
}, ge = {
  setConf: le,
  addVertices: M,
  addEdges: R,
  getClasses: ae,
  draw: oe
}, ne = (e, l) => {
  const s = Z, o = s(e, "r"), i = s(e, "g"), p = s(e, "b");
  return Q(o, i, p, l);
}, se = (e) => `.label {
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

  .node .katex path {
    fill: #000;
    stroke: #000;
    stroke-width: 1px;
  }

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
    background-color: ${ne(e.edgeLabelBackground, 0.5)};
    // background-color: 
  }

  .cluster rect {
    fill: ${e.clusterBkg};
    stroke: ${e.clusterBorder};
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
`, ye = se;
export {
  te as a,
  re as b,
  he as c,
  we as d,
  ue as e,
  ge as f,
  ye as g,
  fe as i,
  O as s
};
