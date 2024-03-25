var X = (n, t, e) => new Promise((r, i) => {
  var a = (l) => {
    try {
      d(e.next(l));
    } catch (h) {
      i(h);
    }
  }, u = (l) => {
    try {
      d(e.throw(l));
    } catch (h) {
      i(h);
    }
  }, d = (l) => l.done ? r(l.value) : Promise.resolve(l.value).then(a, u);
  d((e = e.apply(n, t)).next());
});
import { i as N, G as H } from "./4bc5ef7f.js";
import { m as J, l as V } from "./bcc07d29.js";
import { c as U } from "./c4c5f13b.js";
import { i as W, u as _, s as q, a as z, b as K, g as T, p as $, c as Q, d as Y, e as Z, f as I, h as L, j as D } from "./e95fa522.js";
import { l as s, c as O, p as B, h as R } from "./1269154d.js";
import { a as tt } from "./945d7302.js";
function m(n) {
  var t = {
    options: {
      directed: n.isDirected(),
      multigraph: n.isMultigraph(),
      compound: n.isCompound()
    },
    nodes: et(n),
    edges: nt(n)
  };
  return N(n.graph()) || (t.value = U(n.graph())), t;
}
function et(n) {
  return J(n.nodes(), function(t) {
    var e = n.node(t), r = n.parent(t), i = { v: t };
    return N(e) || (i.value = e), N(r) || (i.parent = r), i;
  });
}
function nt(n) {
  return J(n.edges(), function(t) {
    var e = n.edge(t), r = { v: t.v, w: t.w };
    return N(t.name) || (r.name = t.name), N(e) || (r.value = e), r;
  });
}
let f = {}, g = {}, P = {};
const it = () => {
  g = {}, P = {}, f = {};
}, p = (n, t) => (s.trace("In isDescendant", t, " ", n, " = ", g[t].includes(n)), !!g[t].includes(n)), st = (n, t) => (s.info("Descendants of ", t, " is ", g[t]), s.info("Edge is ", n), n.v === t || n.w === t ? !1 : g[t] ? g[t].includes(n.v) || p(n.v, t) || p(n.w, t) || g[t].includes(n.w) : (s.debug("Tilt, ", t, ",not in descendants"), !1)), k = (n, t, e, r) => {
  s.warn(
    "Copying children of ",
    n,
    "root",
    r,
    "data",
    t.node(n),
    r
  );
  const i = t.children(n) || [];
  n !== r && i.push(n), s.warn("Copying (nodes) clusterId", n, "nodes", i), i.forEach((a) => {
    if (t.children(a).length > 0)
      k(a, t, e, r);
    else {
      const u = t.node(a);
      s.info("cp ", a, " to ", r, " with parent ", n), e.setNode(a, u), r !== t.parent(a) && (s.warn("Setting parent", a, t.parent(a)), e.setParent(a, t.parent(a))), n !== r && a !== n ? (s.debug("Setting parent", a, n), e.setParent(a, n)) : (s.info("In copy ", n, "root", r, "data", t.node(n), r), s.debug(
        "Not Setting parent for node=",
        a,
        "cluster!==rootId",
        n !== r,
        "node!==clusterId",
        a !== n
      ));
      const d = t.edges(a);
      s.debug("Copying Edges", d), d.forEach((l) => {
        s.info("Edge", l);
        const h = t.edge(l.v, l.w, l.name);
        s.info("Edge data", h, r);
        try {
          st(l, r) ? (s.info("Copying as ", l.v, l.w, h, l.name), e.setEdge(l.v, l.w, h, l.name), s.info("newGraph edges ", e.edges(), e.edge(e.edges()[0]))) : s.info(
            "Skipping copy of edge ",
            l.v,
            "-->",
            l.w,
            " rootId: ",
            r,
            " clusterId:",
            n
          );
        } catch (w) {
          s.error(w);
        }
      });
    }
    s.debug("Removing node", a), t.removeNode(a);
  });
}, F = (n, t) => {
  const e = t.children(n);
  let r = [...e];
  for (const i of e)
    P[i] = n, r = [...r, ...F(i, t)];
  return r;
}, C = (n, t) => {
  s.trace("Searching", n);
  const e = t.children(n);
  if (s.trace("Searching children of id ", n, e), e.length < 1)
    return s.trace("This is a valid node", n), n;
  for (const r of e) {
    const i = C(r, t);
    if (i)
      return s.trace("Found replacement for", n, " => ", i), i;
  }
}, S = (n) => !f[n] || !f[n].externalConnections ? n : f[n] ? f[n].id : n, rt = (n, t) => {
  if (!n || t > 10) {
    s.debug("Opting out, no graph ");
    return;
  } else
    s.debug("Opting in, graph ");
  n.nodes().forEach(function(e) {
    n.children(e).length > 0 && (s.warn(
      "Cluster identified",
      e,
      " Replacement id in edges: ",
      C(e, n)
    ), g[e] = F(e, n), f[e] = { id: C(e, n), clusterData: n.node(e) });
  }), n.nodes().forEach(function(e) {
    const r = n.children(e), i = n.edges();
    r.length > 0 ? (s.debug("Cluster identified", e, g), i.forEach((a) => {
      if (a.v !== e && a.w !== e) {
        const u = p(a.v, e), d = p(a.w, e);
        u ^ d && (s.warn("Edge: ", a, " leaves cluster ", e), s.warn("Descendants of XXX ", e, ": ", g[e]), f[e].externalConnections = !0);
      }
    })) : s.debug("Not a cluster ", e, g);
  });
  for (let e of Object.keys(f)) {
    const r = f[e].id, i = n.parent(r);
    i !== e && f[i] && !f[i].externalConnections && (f[e].id = i);
  }
  n.edges().forEach(function(e) {
    const r = n.edge(e);
    s.warn("Edge " + e.v + " -> " + e.w + ": " + JSON.stringify(e)), s.warn("Edge " + e.v + " -> " + e.w + ": " + JSON.stringify(n.edge(e)));
    let i = e.v, a = e.w;
    if (s.warn(
      "Fix XXX",
      f,
      "ids:",
      e.v,
      e.w,
      "Translating: ",
      f[e.v],
      " --- ",
      f[e.w]
    ), f[e.v] && f[e.w] && f[e.v] === f[e.w]) {
      s.warn("Fixing and trixing link to self - removing XXX", e.v, e.w, e.name), s.warn("Fixing and trixing - removing XXX", e.v, e.w, e.name), i = S(e.v), a = S(e.w), n.removeEdge(e.v, e.w, e.name);
      const u = e.w + "---" + e.v;
      n.setNode(u, {
        domId: u,
        id: u,
        labelStyle: "",
        labelText: r.label,
        padding: 0,
        shape: "labelRect",
        style: ""
      });
      const d = structuredClone(r), l = structuredClone(r);
      d.label = "", d.arrowTypeEnd = "none", l.label = "", d.fromCluster = e.v, l.toCluster = e.v, n.setEdge(i, u, d, e.name + "-cyclic-special"), n.setEdge(u, a, l, e.name + "-cyclic-special");
    } else if (f[e.v] || f[e.w]) {
      if (s.warn("Fixing and trixing - removing XXX", e.v, e.w, e.name), i = S(e.v), a = S(e.w), n.removeEdge(e.v, e.w, e.name), i !== e.v) {
        const u = n.parent(i);
        f[u].externalConnections = !0, r.fromCluster = e.v;
      }
      if (a !== e.w) {
        const u = n.parent(a);
        f[u].externalConnections = !0, r.toCluster = e.w;
      }
      s.warn("Fix Replacing with XXX", i, a, e.name), n.setEdge(i, a, r, e.name);
    }
  }), s.warn("Adjusted Graph", m(n)), G(n, 0), s.trace(f);
}, G = (n, t) => {
  if (s.warn("extractor - ", t, m(n), n.children("D")), t > 10) {
    s.error("Bailing out");
    return;
  }
  let e = n.nodes(), r = !1;
  for (const i of e) {
    const a = n.children(i);
    r = r || a.length > 0;
  }
  if (!r) {
    s.debug("Done, no node has children", n.nodes());
    return;
  }
  s.debug("Nodes = ", e, t);
  for (const i of e)
    if (s.debug(
      "Extracting node",
      i,
      f,
      f[i] && !f[i].externalConnections,
      !n.parent(i),
      n.node(i),
      n.children("D"),
      " Depth ",
      t
    ), !f[i])
      s.debug("Not a cluster", i, t);
    else if (!f[i].externalConnections && // !graph.parent(node) &&
    n.children(i) && n.children(i).length > 0) {
      s.warn(
        "Cluster without external connections, without a parent and with children",
        i,
        t
      );
      let u = n.graph().rankdir === "TB" ? "LR" : "TB";
      f[i] && f[i].clusterData && f[i].clusterData.dir && (u = f[i].clusterData.dir, s.warn("Fixing dir", f[i].clusterData.dir, u));
      const d = new H({
        multigraph: !0,
        compound: !0
      }).setGraph({
        rankdir: u,
        // Todo: set proper spacing
        nodesep: 50,
        ranksep: 50,
        marginx: 8,
        marginy: 8
      }).setDefaultEdgeLabel(function() {
        return {};
      });
      s.warn("Old graph before copy", m(n)), k(i, n, d, i), n.setNode(i, {
        clusterNode: !0,
        id: i,
        clusterData: f[i].clusterData,
        labelText: f[i].labelText,
        graph: d
      }), s.warn("New graph after copy node: (", i, ")", m(d)), s.debug("Old graph after copy", m(n));
    } else
      s.warn(
        "Cluster ** ",
        i,
        " **not meeting the criteria !externalConnections:",
        !f[i].externalConnections,
        " no parent: ",
        !n.parent(i),
        " children ",
        n.children(i) && n.children(i).length > 0,
        n.children("D"),
        t
      ), s.debug(f);
  e = n.nodes(), s.warn("New list of nodes", e);
  for (const i of e) {
    const a = n.node(i);
    s.warn(" Now next level", i, a), a.clusterNode && G(a.graph, t + 1);
  }
}, j = (n, t) => {
  if (t.length === 0)
    return [];
  let e = Object.assign(t);
  return t.forEach((r) => {
    const i = n.children(r), a = j(n, i);
    e = [...e, ...a];
  }), e;
}, at = (n) => j(n, n.children()), ct = (n, t) => {
  s.info("Creating subgraph rect for ", t.id, t);
  const e = O(), r = n.insert("g").attr("class", "cluster" + (t.class ? " " + t.class : "")).attr("id", t.id), i = r.insert("rect", ":first-child"), a = B(e.flowchart.htmlLabels), u = r.insert("g").attr("class", "cluster-label"), d = t.labelType === "markdown" ? tt(u, t.labelText, { style: t.labelStyle, useHtmlLabels: a }) : u.node().appendChild(L(t.labelText, t.labelStyle, void 0, !0));
  let l = d.getBBox();
  if (B(e.flowchart.htmlLabels)) {
    const c = d.children[0], o = R(d);
    l = c.getBoundingClientRect(), o.attr("width", l.width), o.attr("height", l.height);
  }
  const h = 0 * t.padding, w = h / 2, x = t.width <= l.width + h ? l.width + h : t.width;
  t.width <= l.width + h ? t.diff = (l.width - t.width) / 2 - t.padding / 2 : t.diff = -t.padding / 2, s.trace("Data ", t, JSON.stringify(t)), i.attr("style", t.style).attr("rx", t.rx).attr("ry", t.ry).attr("x", t.x - x / 2).attr("y", t.y - t.height / 2 - w).attr("width", x).attr("height", t.height + h);
  const { subGraphTitleTopMargin: v } = T(e);
  a ? u.attr(
    "transform",
    // This puts the label on top of the box instead of inside it
    `translate(${t.x - l.width / 2}, ${t.y - t.height / 2 + v})`
  ) : u.attr(
    "transform",
    // This puts the label on top of the box instead of inside it
    `translate(${t.x}, ${t.y - t.height / 2 + v})`
  );
  const y = i.node().getBBox();
  return t.width = y.width, t.height = y.height, t.intersect = function(c) {
    return D(t, c);
  }, r;
}, ot = (n, t) => {
  const e = n.insert("g").attr("class", "note-cluster").attr("id", t.id), r = e.insert("rect", ":first-child"), i = 0 * t.padding, a = i / 2;
  r.attr("rx", t.rx).attr("ry", t.ry).attr("x", t.x - t.width / 2 - a).attr("y", t.y - t.height / 2 - a).attr("width", t.width + i).attr("height", t.height + i).attr("fill", "none");
  const u = r.node().getBBox();
  return t.width = u.width, t.height = u.height, t.intersect = function(d) {
    return D(t, d);
  }, e;
}, lt = (n, t) => {
  const e = O(), r = n.insert("g").attr("class", t.classes).attr("id", t.id), i = r.insert("rect", ":first-child"), a = r.insert("g").attr("class", "cluster-label"), u = r.append("rect"), d = a.node().appendChild(L(t.labelText, t.labelStyle, void 0, !0));
  let l = d.getBBox();
  if (B(e.flowchart.htmlLabels)) {
    const c = d.children[0], o = R(d);
    l = c.getBoundingClientRect(), o.attr("width", l.width), o.attr("height", l.height);
  }
  l = d.getBBox();
  const h = 0 * t.padding, w = h / 2, x = t.width <= l.width + t.padding ? l.width + t.padding : t.width;
  t.width <= l.width + t.padding ? t.diff = (l.width + t.padding * 0 - t.width) / 2 : t.diff = -t.padding / 2, i.attr("class", "outer").attr("x", t.x - x / 2 - w).attr("y", t.y - t.height / 2 - w).attr("width", x + h).attr("height", t.height + h), u.attr("class", "inner").attr("x", t.x - x / 2 - w).attr("y", t.y - t.height / 2 - w + l.height - 1).attr("width", x + h).attr("height", t.height + h - l.height - 3);
  const { subGraphTitleTopMargin: v } = T(e);
  a.attr(
    "transform",
    `translate(${t.x - l.width / 2}, ${t.y - t.height / 2 - t.padding / 3 + (B(e.flowchart.htmlLabels) ? 5 : 3) + v})`
  );
  const y = i.node().getBBox();
  return t.height = y.height, t.intersect = function(c) {
    return D(t, c);
  }, r;
}, ft = (n, t) => {
  const e = n.insert("g").attr("class", t.classes).attr("id", t.id), r = e.insert("rect", ":first-child"), i = 0 * t.padding, a = i / 2;
  r.attr("class", "divider").attr("x", t.x - t.width / 2 - a).attr("y", t.y - t.height / 2).attr("width", t.width + i).attr("height", t.height + i);
  const u = r.node().getBBox();
  return t.width = u.width, t.height = u.height, t.diff = -t.padding / 2, t.intersect = function(d) {
    return D(t, d);
  }, e;
}, dt = { rect: ct, roundedWithTitle: lt, noteGroup: ot, divider: ft };
let M = {};
const ut = (n, t) => {
  s.trace("Inserting cluster");
  const e = t.shape || "rect";
  M[t.id] = dt[e](n, t);
}, ht = () => {
  M = {};
}, A = (n, t, e, r, i, a) => X(void 0, null, function* () {
  s.info("Graph in recursive render: XXX", m(t), i);
  const u = t.graph().rankdir;
  s.trace("Dir in recursive render - dir:", u);
  const d = n.insert("g").attr("class", "root");
  t.nodes() ? s.info("Recursive render XXX", t.nodes()) : s.info("No nodes found for", t), t.edges().length > 0 && s.trace("Recursive edges", t.edge(t.edges()[0]));
  const l = d.insert("g").attr("class", "clusters"), h = d.insert("g").attr("class", "edgePaths"), w = d.insert("g").attr("class", "edgeLabels"), x = d.insert("g").attr("class", "nodes");
  yield Promise.all(
    t.nodes().map(function(c) {
      return X(this, null, function* () {
        const o = t.node(c);
        if (i !== void 0) {
          const b = JSON.parse(JSON.stringify(i.clusterData));
          s.info("Setting data for cluster XXX (", c, ") ", b, i), t.setNode(i.id, b), t.parent(c) || (s.trace("Setting parent", c, i.id), t.setParent(c, i.id, b));
        }
        if (s.info("(Insert) Node XXX" + c + ": " + JSON.stringify(t.node(c))), o && o.clusterNode) {
          s.info("Cluster identified", c, o.width, t.node(c));
          const b = yield A(
            x,
            o.graph,
            e,
            r,
            t.node(c),
            a
          ), E = b.elem;
          _(o, E), o.diff = b.diff || 0, s.info("Node bounds (abc123)", c, o, o.width, o.x, o.y), q(E, o), s.warn("Recursive render complete ", E, o);
        } else
          t.children(c).length > 0 ? (s.info("Cluster - the non recursive path XXX", c, o.id, o, t), s.info(C(o.id, t)), f[o.id] = { id: C(o.id, t), node: o }) : (s.info("Node - the non recursive path", c, o.id, o), yield z(x, t.node(c), u));
      });
    })
  ), t.edges().forEach(function(c) {
    const o = t.edge(c.v, c.w, c.name);
    s.info("Edge " + c.v + " -> " + c.w + ": " + JSON.stringify(c)), s.info("Edge " + c.v + " -> " + c.w + ": ", c, " ", JSON.stringify(t.edge(c))), s.info("Fix", f, "ids:", c.v, c.w, "Translating: ", f[c.v], f[c.w]), K(w, o);
  }), t.edges().forEach(function(c) {
    s.info("Edge " + c.v + " -> " + c.w + ": " + JSON.stringify(c));
  }), s.info("#############################################"), s.info("###                Layout                 ###"), s.info("#############################################"), s.info(t), V(t), s.info("Graph after layout:", m(t));
  let v = 0;
  const { subGraphTitleTotalMargin: y } = T(a);
  return at(t).forEach(function(c) {
    const o = t.node(c);
    s.info("Position " + c + ": " + JSON.stringify(t.node(c))), s.info(
      "Position " + c + ": (" + o.x,
      "," + o.y,
      ") width: ",
      o.width,
      " height: ",
      o.height
    ), o && o.clusterNode ? (o.y += y, $(o)) : t.children(c).length > 0 ? (o.height += y, ut(l, o), f[o.id].node = o) : (o.y += y / 2, $(o));
  }), t.edges().forEach(function(c) {
    const o = t.edge(c);
    s.info("Edge " + c.v + " -> " + c.w + ": " + JSON.stringify(o), o), o.points.forEach((E) => E.y += y / 2);
    const b = Q(h, c, o, f, e, t, r);
    Y(o, b);
  }), t.nodes().forEach(function(c) {
    const o = t.node(c);
    s.info(c, o.type, o.diff), o.type === "group" && (v = o.diff);
  }), { elem: d, diff: v };
}), Et = (n, t, e, r, i) => X(void 0, null, function* () {
  W(n, e, r, i), Z(), I(), ht(), it(), s.warn("Graph at first:", JSON.stringify(m(t))), rt(t), s.warn("Graph after:", JSON.stringify(m(t)));
  const a = O();
  yield A(n, t, r, i, void 0, a);
});
export {
  Et as r
};
