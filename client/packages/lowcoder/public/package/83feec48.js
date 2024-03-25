var B = (e, n, t) => new Promise((i, c) => {
  var r = (l) => {
    try {
      a(t.next(l));
    } catch (s) {
      c(s);
    }
  }, o = (l) => {
    try {
      a(t.throw(l));
    } catch (s) {
      c(s);
    }
  }, a = (l) => l.done ? i(l.value) : Promise.resolve(l.value).then(r, o);
  a((t = t.apply(e, n)).next());
});
import { p as Q, d as M, s as X, D as U, a as Z, S as F, b as I, c as tt } from "./6909d829.js";
import { G as et } from "./4bc5ef7f.js";
import { l as T, c as g, h as x, A as ot, i as st, j as w } from "./1269154d.js";
import { r as nt } from "./65d3daa9.js";
import "./bcc07d29.js";
import "./c4c5f13b.js";
import "./e95fa522.js";
import "./945d7302.js";
import "./e437d53e.js";
import "./2ff2c7a6.js";
import "./256b619e.js";
const h = "rect", C = "rectWithTitle", it = "start", ct = "end", rt = "divider", lt = "roundedWithTitle", at = "note", dt = "noteGroup", u = "statediagram", Et = "state", St = `${u}-${Et}`, V = "transition", Tt = "note", pt = "note-edge", _t = `${V} ${pt}`, ut = `${u}-${Tt}`, Dt = "cluster", bt = `${u}-${Dt}`, ft = "cluster-alt", At = `${u}-${ft}`, Y = "parent", W = "note", ht = "state", N = "----", yt = `${N}${W}`, H = `${N}${Y}`, m = "fill:none", z = "fill: #333", j = "c", q = "text", K = "normal";
let y = {}, S = 0;
const gt = function(e) {
  const n = Object.keys(e);
  for (const t of n)
    e[t];
}, $t = function(e, n) {
  return n.db.extract(n.db.getRootDocV2()), n.db.getClasses();
};
function xt(e) {
  return e == null ? "" : e.classes ? e.classes.join(" ") : "";
}
function R(e = "", n = 0, t = "", i = N) {
  const c = t !== null && t.length > 0 ? `${i}${t}` : "";
  return `${ht}-${e}${c}-${n}`;
}
const A = (e, n, t, i, c, r) => {
  const o = t.id, a = xt(i[o]);
  if (o !== "root") {
    let l = h;
    t.start === !0 && (l = it), t.start === !1 && (l = ct), t.type !== U && (l = t.type), y[o] || (y[o] = {
      id: o,
      shape: l,
      description: w.sanitizeText(o, g()),
      classes: `${a} ${St}`
    });
    const s = y[o];
    t.description && (Array.isArray(s.description) ? (s.shape = C, s.description.push(t.description)) : s.description.length > 0 ? (s.shape = C, s.description === o ? s.description = [t.description] : s.description = [s.description, t.description]) : (s.shape = h, s.description = t.description), s.description = w.sanitizeTextOrArray(s.description, g())), s.description.length === 1 && s.shape === C && (s.shape = h), !s.type && t.doc && (T.info("Setting cluster for ", o, G(t)), s.type = "group", s.dir = G(t), s.shape = t.type === Z ? rt : lt, s.classes = s.classes + " " + bt + " " + (r ? At : ""));
    const _ = {
      labelStyle: "",
      shape: s.shape,
      labelText: s.description,
      // typeof newNode.description === 'object'
      //   ? newNode.description[0]
      //   : newNode.description,
      classes: s.classes,
      style: "",
      //styles.style,
      id: o,
      dir: s.dir,
      domId: R(o, S),
      type: s.type,
      padding: 15
      //getConfig().flowchart.padding
    };
    if (_.centerLabel = !0, t.note) {
      const d = {
        labelStyle: "",
        shape: at,
        labelText: t.note.text,
        classes: ut,
        // useHtmlLabels: false,
        style: "",
        // styles.style,
        id: o + yt + "-" + S,
        domId: R(o, S, W),
        type: s.type,
        padding: 15
        //getConfig().flowchart.padding
      }, E = {
        labelStyle: "",
        shape: dt,
        labelText: t.note.text,
        classes: s.classes,
        style: "",
        // styles.style,
        id: o + H,
        domId: R(o, S, Y),
        type: "group",
        padding: 0
        //getConfig().flowchart.padding
      };
      S++;
      const D = o + H;
      e.setNode(D, E), e.setNode(d.id, d), e.setNode(o, _), e.setParent(o, D), e.setParent(d.id, D);
      let p = o, b = d.id;
      t.note.position === "left of" && (p = d.id, b = o), e.setEdge(p, b, {
        arrowhead: "none",
        arrowType: "",
        style: m,
        labelStyle: "",
        classes: _t,
        arrowheadStyle: z,
        labelpos: j,
        labelType: q,
        thickness: K
      });
    } else
      e.setNode(o, _);
  }
  n && n.id !== "root" && (T.trace("Setting node ", o, " to be child of its parent ", n.id), e.setParent(o, n.id)), t.doc && (T.trace("Adding nodes children "), Ct(e, t, t.doc, i, c, !r));
}, Ct = (e, n, t, i, c, r) => {
  T.trace("items", t), t.forEach((o) => {
    switch (o.stmt) {
      case I:
        A(e, n, o, i, c, r);
        break;
      case U:
        A(e, n, o, i, c, r);
        break;
      case F:
        {
          A(e, n, o.state1, i, c, r), A(e, n, o.state2, i, c, r);
          const a = {
            id: "edge" + S,
            arrowhead: "normal",
            arrowTypeEnd: "arrow_barb",
            style: m,
            labelStyle: "",
            label: w.sanitizeText(o.description, g()),
            arrowheadStyle: z,
            labelpos: j,
            labelType: q,
            thickness: K,
            classes: V
          };
          e.setEdge(o.state1.id, o.state2.id, a, S), S++;
        }
        break;
    }
  });
}, G = (e, n = tt) => {
  let t = n;
  if (e.doc)
    for (let i = 0; i < e.doc.length; i++) {
      const c = e.doc[i];
      c.stmt === "dir" && (t = c.value);
    }
  return t;
}, Rt = function(e, n, t, i) {
  return B(this, null, function* () {
    T.info("Drawing state diagram (v2)", n), y = {}, i.db.getDirection();
    const { securityLevel: c, state: r } = g(), o = r.nodeSpacing || 50, a = r.rankSpacing || 50;
    T.info(i.db.getRootDocV2()), i.db.extract(i.db.getRootDocV2()), T.info(i.db.getRootDocV2());
    const l = i.db.getStates(), s = new et({
      multigraph: !0,
      compound: !0
    }).setGraph({
      rankdir: G(i.db.getRootDocV2()),
      nodesep: o,
      ranksep: a,
      marginx: 8,
      marginy: 8
    }).setDefaultEdgeLabel(function() {
      return {};
    });
    A(s, void 0, i.db.getRootDocV2(), l, i.db, !0);
    let _;
    c === "sandbox" && (_ = x("#i" + n));
    const d = c === "sandbox" ? x(_.nodes()[0].contentDocument.body) : x("body"), E = d.select(`[id="${n}"]`), D = d.select("#" + n + " g");
    yield nt(D, s, ["barb"], u, n);
    const p = 8;
    ot.insertTitle(E, "statediagramTitleText", r.titleTopMargin, i.db.getDiagramTitle());
    const b = E.node().getBBox(), L = b.width + p * 2, P = b.height + p * 2;
    E.attr("class", u);
    const O = E.node().getBBox();
    st(E, P, L, r.useMaxWidth);
    const k = `${O.x - p} ${O.y - p} ${L} ${P}`;
    T.debug(`viewBox ${k}`), E.attr("viewBox", k);
    const J = document.querySelectorAll('[id="' + n + '"] .edgeLabel .label');
    for (const $ of J) {
      const v = $.getBBox(), f = document.createElementNS("http://www.w3.org/2000/svg", h);
      f.setAttribute("rx", 0), f.setAttribute("ry", 0), f.setAttribute("width", v.width), f.setAttribute("height", v.height), $.insertBefore(f, $.firstChild);
    }
  });
}, wt = {
  setConf: gt,
  getClasses: $t,
  draw: Rt
}, Yt = {
  parser: Q,
  db: M,
  renderer: wt,
  styles: X,
  init: (e) => {
    e.state || (e.state = {}), e.state.arrowMarkerAbsolute = e.arrowMarkerAbsolute, M.clear();
  }
};
export {
  Yt as diagram
};
