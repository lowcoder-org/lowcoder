import { g as getDefaultExportFromCjs, c as commonjsGlobal } from "./08856db2.js";
var agoraRtmSdk = { exports: {} };
/*
 @preserve
 AgoraRTM Web SDK 1.5.1 - commit: v1.5.1-0-g5bbbcd72
 Copyright (C) 2018-2022 Agora Lab.
 This file is licensed under the AGORA, INC. SDK LICENSE AGREEMENT
 A copy of this license may be found at https://www.agora.io/en/sdk-license-agreement/
*/
agoraRtmSdk.exports;
(function(module, exports) {
  (function(e, t) {
    module.exports = t();
  })(commonjsGlobal, function() {
    function Be(e, t) {
      var n = Object.keys(e);
      if (Object.getOwnPropertySymbols) {
        var r = Object.getOwnPropertySymbols(e);
        t && (r = r.filter(function(o) {
          return Object.getOwnPropertyDescriptor(e, o).enumerable;
        })), n.push.apply(n, r);
      }
      return n;
    }
    function Wa(e) {
      for (var t = 1; t < arguments.length; t++) {
        var n = arguments[t] != null ? arguments[t] : {};
        t % 2 ? Be(Object(n), !0).forEach(function(r) {
          x(e, r, n[r]);
        }) : Object.getOwnPropertyDescriptors ? Object.defineProperties(e, Object.getOwnPropertyDescriptors(n)) : Be(Object(n)).forEach(function(r) {
          Object.defineProperty(e, r, Object.getOwnPropertyDescriptor(n, r));
        });
      }
      return e;
    }
    function qa(e) {
      return (qa = typeof Symbol == "function" && typeof Symbol.iterator == "symbol" ? function(t) {
        return typeof t;
      } : function(t) {
        return t && typeof Symbol == "function" && t.constructor === Symbol && t !== Symbol.prototype ? "symbol" : typeof t;
      })(e);
    }
    function wm(e, t, n, r, o, i, s) {
      try {
        var u = e[i](s), a = u.value;
      } catch (l) {
        return void n(l);
      }
      u.done ? t(a) : Promise.resolve(a).then(r, o);
    }
    function ma(e) {
      return function() {
        var t = this, n = arguments;
        return new Promise(function(r, o) {
          function i(a) {
            wm(u, r, o, i, s, "next", a);
          }
          function s(a) {
            wm(u, r, o, i, s, "throw", a);
          }
          var u = e.apply(t, n);
          i(void 0);
        });
      };
    }
    function va(e, t) {
      if (!(e instanceof t))
        throw new TypeError("Cannot call a class as a function");
    }
    function xm(e, t) {
      for (var n = 0; n < t.length; n++) {
        var r = t[n];
        r.enumerable = r.enumerable || !1, r.configurable = !0, "value" in r && (r.writable = !0), Object.defineProperty(e, r.key, r);
      }
    }
    function eb(e, t, n) {
      return t && xm(e.prototype, t), n && xm(e, n), e;
    }
    function x(e, t, n) {
      return t in e ? Object.defineProperty(e, t, { value: n, enumerable: !0, configurable: !0, writable: !0 }) : e[t] = n, e;
    }
    function Ga(e, t) {
      if (typeof t != "function" && t !== null)
        throw new TypeError("Super expression must either be null or a function");
      e.prototype = Object.create(t && t.prototype, { constructor: { value: e, writable: !0, configurable: !0 } }), t && Jf(e, t);
    }
    function Td(e) {
      return (Td = Object.setPrototypeOf ? Object.getPrototypeOf : function(t) {
        return t.__proto__ || Object.getPrototypeOf(t);
      })(e);
    }
    function Jf(e, t) {
      return (Jf = Object.setPrototypeOf || function(n, r) {
        return n.__proto__ = r, n;
      })(e, t);
    }
    function ym() {
      if (typeof Reflect == "undefined" || !Reflect.construct || Reflect.construct.sham)
        return !1;
      if (typeof Proxy == "function")
        return !0;
      try {
        return Boolean.prototype.valueOf.call(Reflect.construct(Boolean, [], function() {
        })), !0;
      } catch (e) {
        return !1;
      }
    }
    function Ji(e, t, n) {
      return (Ji = ym() ? Reflect.construct : function(r, o, i) {
        var s = [null];
        return s.push.apply(s, o), r = new (Function.bind.apply(r, s))(), i && Jf(r, i.prototype), r;
      }).apply(null, arguments);
    }
    function Kf(e) {
      var t = typeof Map == "function" ? /* @__PURE__ */ new Map() : void 0;
      return (Kf = function(n) {
        function r() {
          return Ji(n, arguments, Td(this).constructor);
        }
        if (n === null || Function.toString.call(n).indexOf("[native code]") === -1)
          return n;
        if (typeof n != "function")
          throw new TypeError("Super expression must either be null or a function");
        if (t !== void 0) {
          if (t.has(n))
            return t.get(n);
          t.set(n, r);
        }
        return r.prototype = Object.create(n.prototype, { constructor: { value: r, enumerable: !1, writable: !0, configurable: !0 } }), Jf(r, n);
      })(e);
    }
    function Ki(e, t) {
      if (e == null)
        return {};
      if (e == null)
        var n = {};
      else {
        n = {};
        var r, o = Object.keys(e);
        for (r = 0; r < o.length; r++) {
          var i = o[r];
          0 <= t.indexOf(i) || (n[i] = e[i]);
        }
      }
      if (Object.getOwnPropertySymbols)
        for (r = Object.getOwnPropertySymbols(e), i = 0; i < r.length; i++)
          o = r[i], 0 <= t.indexOf(o) || Object.prototype.propertyIsEnumerable.call(e, o) && (n[o] = e[o]);
      return n;
    }
    function z(e) {
      if (e === void 0)
        throw new ReferenceError("this hasn't been initialised - super() hasn't been called");
      return e;
    }
    function Ha(e) {
      var t = ym();
      return function() {
        var n = Td(e);
        if (t) {
          var r = Td(this).constructor;
          n = Reflect.construct(n, arguments, r);
        } else
          n = n.apply(this, arguments);
        return n = !n || typeof n != "object" && typeof n != "function" ? z(this) : n;
      };
    }
    function Li(e, t, n) {
      return (Li = typeof Reflect != "undefined" && Reflect.get ? Reflect.get : function(r, o, i) {
        for (; !Object.prototype.hasOwnProperty.call(r, o) && (r = Td(r)) !== null; )
          ;
        if (r)
          return (o = Object.getOwnPropertyDescriptor(r, o)).get ? o.get.call(i) : o.value;
      })(e, t, n || e);
    }
    function $a(e, t) {
      var n = Array.isArray(e) ? e : void 0;
      if (!n)
        if ((n = e && (typeof Symbol != "undefined" && e[Symbol.iterator] || e["@@iterator"])) == null)
          n = void 0;
        else {
          var r, o = [], i = !0, s = !1;
          try {
            for (n = n.call(e); !(i = (r = n.next()).done) && (o.push(r.value), !t || o.length !== t); i = !0)
              ;
          } catch (a) {
            s = !0;
            var u = a;
          } finally {
            try {
              i || n.return == null || n.return();
            } finally {
              if (s)
                throw u;
            }
          }
          n = o;
        }
      if (!(e = n || zm(e, t)))
        throw new TypeError(`Invalid attempt to destructure non-iterable instance.
In order to be iterable, non-array objects must have a [Symbol.iterator]() method.`);
      return e;
    }
    function Z(e) {
      var t = Array.isArray(e) ? Mi(e) : void 0;
      if (t || (t = typeof Symbol != "undefined" && e[Symbol.iterator] != null || e["@@iterator"] != null ? Array.from(e) : void 0), !(e = t || zm(e)))
        throw new TypeError(`Invalid attempt to spread non-iterable instance.
In order to be iterable, non-array objects must have a [Symbol.iterator]() method.`);
      return e;
    }
    function zm(e, t) {
      if (e) {
        if (typeof e == "string")
          return Mi(e, t);
        var n = Object.prototype.toString.call(e).slice(8, -1);
        if (n === "Object" && e.constructor && (n = e.constructor.name), n === "Map" || n === "Set")
          return Array.from(e);
        if (n === "Arguments" || /^(?:Ui|I)nt(?:8|16|32)(?:Clamped)?Array$/.test(n))
          return Mi(e, t);
      }
    }
    function Mi(e, t) {
      (t == null || t > e.length) && (t = e.length);
      for (var n = 0, r = Array(t); n < t; n++)
        r[n] = e[n];
      return r;
    }
    function Da(e, t, n, r, o) {
      var i = {};
      return Object.keys(r).forEach(function(s) {
        i[s] = r[s];
      }), i.enumerable = !!i.enumerable, i.configurable = !!i.configurable, ("value" in i || i.initializer) && (i.writable = !0), i = n.slice().reverse().reduce(function(s, u) {
        return u(e, t, s) || s;
      }, i), o && i.initializer !== void 0 && (i.value = i.initializer ? i.initializer.call(o) : void 0, i.initializer = void 0), i.initializer === void 0 && (Object.defineProperty(e, t, i), i = null), i;
    }
    function xb(e) {
      var t = { exports: {} };
      return e(t, t.exports), t.exports;
    }
    function Ce(e) {
      e || (e = {});
      var t = e.ua;
      if (t || typeof navigator == "undefined" || (t = navigator.userAgent), t && t.headers && typeof t.headers["user-agent"] == "string" && (t = t.headers["user-agent"]), typeof t != "string")
        return !1;
      var n = Zt.test(t) && !$t.test(t) || !!e.tablet && au.test(t);
      return !n && e.tablet && e.featureDetect && navigator && 1 < navigator.maxTouchPoints && t.indexOf("Macintosh") !== -1 && t.indexOf("Safari") !== -1 && (n = !0), n;
    }
    function Am(e, t) {
      var n, r = 3 > arguments.length ? e : arguments[2];
      return Ia(e) === r ? e[t] : (n = dc.f(e, t)) ? ka(n, "value") ? n.value : n.get === void 0 ? void 0 : n.get.call(r) : xa(n = uc(e)) ? Am(n, t, r) : void 0;
    }
    function bu(e) {
      var t = e.charCodeAt(0) << 24, n = 0 | cu(~t), r = 0, o = 0 | e.length, i = "";
      if (5 > n && o >= n) {
        for (t = t << n >>> 24 + n, r = 1; r < n; r = r + 1 | 0)
          t = t << 6 | 63 & e.charCodeAt(r);
        65535 >= t ? i += Ud(t) : 1114111 >= t ? i += Ud(55296 + ((t = t - 65536 | 0) >> 10) | 0, 56320 + (1023 & t) | 0) : r = 0;
      }
      for (; r < o; r = r + 1 | 0)
        i += "�";
      return i;
    }
    function Bm() {
    }
    function du(e) {
      var t = 0 | e.charCodeAt(0);
      if (55296 <= t && 56319 >= t) {
        var n = 0 | e.charCodeAt(1);
        if (!(n == n && 56320 <= n && 57343 >= n))
          return Ud(239, 191, 189);
        if (65535 < (t = (t - 55296 << 10) + n - 56320 + 65536 | 0))
          return Ud(240 | t >>> 18, 128 | t >>> 12 & 63, 128 | t >>> 6 & 63, 128 | 63 & t);
      }
      return 127 >= t ? e : 2047 >= t ? Ud(192 | t >>> 6, 128 | 63 & t) : Ud(224 | t >>> 12, 128 | t >>> 6 & 63, 128 | 63 & t);
    }
    function Cm() {
    }
    function Ba() {
      Ba.init.call(this);
    }
    function Wg(e) {
      if (typeof e != "function")
        throw new TypeError('The "listener" argument must be of type Function. Received type ' + qa(e));
    }
    function Dm(e, t, n, r) {
      Wg(n);
      var o = e._events;
      if (o === void 0)
        o = e._events = /* @__PURE__ */ Object.create(null), e._eventsCount = 0;
      else {
        o.newListener !== void 0 && (e.emit("newListener", t, n.listener ? n.listener : n), o = e._events);
        var i = o[t];
      }
      return i === void 0 ? (o[t] = n, ++e._eventsCount) : (typeof i == "function" ? i = o[t] = r ? [n, i] : [i, n] : r ? i.unshift(n) : i.push(n), 0 < (n = e._maxListeners === void 0 ? Ba.defaultMaxListeners : e._maxListeners) && i.length > n && !i.warned && (i.warned = !0, (n = Error("Possible EventEmitter memory leak detected. " + i.length + " " + String(t) + " listeners added. Use emitter.setMaxListeners() to increase limit")).name = "MaxListenersExceededWarning", n.emitter = e, n.type = t, n.count = i.length, console && console.warn && console.warn(n))), e;
    }
    function eu() {
      if (!this.fired)
        return this.target.removeListener(this.type, this.wrapFn), this.fired = !0, arguments.length === 0 ? this.listener.call(this.target) : this.listener.apply(this.target, arguments);
    }
    function Em(e, t, n) {
      return e = { fired: !1, wrapFn: void 0, target: e, type: t, listener: n }, (t = eu.bind(e)).listener = n, e.wrapFn = t;
    }
    function Fm(e, t, n) {
      if ((e = e._events) === void 0)
        return [];
      if ((t = e[t]) === void 0)
        return [];
      if (typeof t == "function")
        return n ? [t.listener || t] : [t];
      if (n)
        for (n = Array(t.length), e = 0; e < n.length; ++e)
          n[e] = t[e].listener || t[e];
      else
        n = Gm(t, t.length);
      return n;
    }
    function Hm(e) {
      var t = this._events;
      if (t !== void 0) {
        if (typeof (e = t[e]) == "function")
          return 1;
        if (e !== void 0)
          return e.length;
      }
      return 0;
    }
    function Gm(e, t) {
      for (var n = Array(t), r = 0; r < t; ++r)
        n[r] = e[r];
      return n;
    }
    function fu(e, t, n) {
      typeof e.on == "function" && Im(e, "error", t, n);
    }
    function Im(e, t, n, r) {
      if (typeof e.on == "function")
        r.once ? e.once(t, n) : e.on(t, n);
      else {
        if (typeof e.addEventListener != "function")
          throw new TypeError('The "emitter" argument must be of type EventEmitter. Received type ' + qa(e));
        e.addEventListener(t, function o(i) {
          r.once && e.removeEventListener(t, o), n(i);
        });
      }
    }
    function gu(e) {
      return e ? Z(e) : hu(function() {
        return [];
      }, function(t, n) {
        return t.push(n), t;
      });
    }
    function Jm(e, t) {
      var n, r, o, i;
      return N.wrap(function(s) {
        for (; ; )
          switch (s.prev = s.next) {
            case 0:
              n = Km(e)([Lm, Lm, function(u, a) {
                return a;
              }])[2], r = 0;
            case 2:
              if (!(r < t.length)) {
                s.next = 17;
                break;
              }
              if (o = t[r], !((i = n(Ni, o)) instanceof Xg)) {
                s.next = 11;
                break;
              }
              if ((i = Oi(i.deref())) === Ni) {
                s.next = 10;
                break;
              }
              return s.next = 10, i;
            case 10:
              return s.abrupt("return");
            case 11:
              if (i === Ni) {
                s.next = 14;
                break;
              }
              return s.next = 14, i;
            case 14:
              r++, s.next = 2;
              break;
            case 17:
            case "end":
              return s.stop();
          }
      }, iu);
    }
    function Yg(e, t) {
      return t != null && typeof t[Symbol.iterator] == "function" ? Jm(Yg(e), t) : function(n) {
        var r = n[2];
        return ju(n, function(o, i) {
          return r(o, e(i));
        });
      };
    }
    function $c(e) {
      return Object.prototype.toString.call(e).slice(8, -1);
    }
    function De(e) {
      return $c(e) === "Object" && e.constructor === Object && Object.getPrototypeOf(e) === Object.prototype;
    }
    function Mm(e) {
      var t;
      return (t = $c(e) === "Boolean" || $c(e) === "Null" || $c(e) === "Undefined") || (t = $c(e) === "Number" && !isNaN(e)), t || $c(e) === "String" || $c(e) === "Symbol";
    }
    function Vd(e) {
      var t = -1, n = e == null ? 0 : e.length;
      for (this.clear(); ++t < n; ) {
        var r = e[t];
        this.set(r[0], r[1]);
      }
    }
    function Ee(e) {
      var t = -1, n = e == null ? 0 : e.length;
      for (this.clear(); ++t < n; ) {
        var r = e[t];
        this.set(r[0], r[1]);
      }
    }
    function Fe(e) {
      var t = -1, n = e == null ? 0 : e.length;
      for (this.clear(); ++t < n; ) {
        var r = e[t];
        this.set(r[0], r[1]);
      }
    }
    function Lf(e) {
      var t = -1, n = e == null ? 0 : e.length;
      for (this.__data__ = new Zg(); ++t < n; )
        this.add(e[t]);
    }
    function Ge(e) {
      this.size = (this.__data__ = new $g(e)).size;
    }
    function He(e, t, n, r, o, i) {
      var s, u = 1 & t, a = 2 & t, l = 4 & t;
      if (n && (s = o ? n(e, r, o, i) : n(e)), s !== void 0)
        return s;
      if (!Gb(e))
        return e;
      if (r = ub(e)) {
        if (s = ku(e), !u)
          return Pi(e, s);
      } else {
        var f = Mf(e), h = f == "[object Function]" || f == "[object GeneratorFunction]";
        if (Nf(e))
          return Nm(e, u);
        if (f == "[object Object]" || f == "[object Arguments]" || h && !o) {
          if (s = a || h ? {} : Om(e), !u)
            return a ? lu(e, mu(s, e)) : nu(e, ou(s, e));
        } else {
          if (!Oa[f])
            return o ? e : {};
          s = pu(e, f, u);
        }
      }
      if (i || (i = new Ie()), o = i.get(e))
        return o;
      i.set(e, s), qu(e) ? e.forEach(function(p) {
        s.add(He(p, t, n, p, e, i));
      }) : ru(e) && e.forEach(function(p, v) {
        s.set(v, He(p, t, n, v, e, i));
      }), a = l ? a ? Pm : Qi : a ? Of : Wd;
      var d = r ? void 0 : a(e);
      return su(d || e, function(p, v) {
        d && (p = e[v = p]), Qm(s, v, He(p, t, n, v, e, i));
      }), s;
    }
    function Ri(e, t) {
      if (typeof e != "function" || t != null && typeof t != "function")
        throw new TypeError("Expected a function");
      var n = function r() {
        var o = arguments, i = t ? t.apply(this, o) : o[0], s = r.cache;
        return s.has(i) ? s.get(i) : (o = e.apply(this, o), r.cache = s.set(i, o) || s, o);
      };
      return n.cache = new (Ri.Cache || Zg)(), n;
    }
    function Rm(e) {
      if (typeof e == "string")
        return e;
      if (ub(e))
        return Je(e, Rm) + "";
      if (Ke(e))
        return Sm ? Sm.call(e) : "";
      var t = e + "";
      return t == "0" && 1 / e == -tu ? "-0" : t;
    }
    function Si(e, t, n, r, o) {
      var i = -1, s = e.length;
      for (n || (n = uu), o || (o = []); ++i < s; ) {
        var u = e[i];
        0 < t && n(u) ? 1 < t ? Si(u, t - 1, n, r, o) : Ti(o, u) : r || (o[o.length] = u);
      }
      return o;
    }
    function Le(e, t, n, r, o) {
      if (e === t)
        t = !0;
      else if (e == null || t == null || !Hc(e) && !Hc(t))
        t = e != e && t != t;
      else
        t: {
          var i = ub(e), s = ub(t), u = i ? "[object Array]" : Mf(e), a = s ? "[object Array]" : Mf(t), l = (u = u == "[object Arguments]" ? "[object Object]" : u) == "[object Object]";
          if (s = (a = a == "[object Arguments]" ? "[object Object]" : a) == "[object Object]", (a = u == a) && Nf(e)) {
            if (!Nf(t)) {
              t = !1;
              break t;
            }
            i = !0, l = !1;
          }
          if (a && !l)
            o || (o = new Ie()), t = i || Ui(e) ? Tm(e, t, n, r, Le, o) : vu(e, t, u, n, r, Le, o);
          else {
            if (!(1 & n) && (i = l && Um.call(e, "__wrapped__"), u = s && Um.call(t, "__wrapped__"), i || u)) {
              e = i ? e.value() : e, t = u ? t.value() : t, o || (o = new Ie()), t = Le(e, t, n, r, o);
              break t;
            }
            if (a)
              e:
                if (o || (o = new Ie()), i = 1 & n, u = Qi(e), s = u.length, a = Qi(t).length, s == a || i) {
                  for (a = s; a--; ) {
                    var f = u[a];
                    if (!(i ? f in t : wu.call(t, f))) {
                      t = !1;
                      break e;
                    }
                  }
                  if (l = o.get(e), f = o.get(t), l && f)
                    t = l == t && f == e;
                  else {
                    l = !0, o.set(e, t), o.set(t, e);
                    for (var h = i; ++a < s; ) {
                      var d = e[f = u[a]], p = t[f];
                      if (r)
                        var v = i ? r(p, d, f, t, e, o) : r(d, p, f, e, t, o);
                      if (v === void 0 ? d !== p && !Le(d, p, n, r, o) : !v) {
                        l = !1;
                        break;
                      }
                      h || (h = f == "constructor");
                    }
                    l && !h && (n = e.constructor) != (r = t.constructor) && "constructor" in e && "constructor" in t && !(typeof n == "function" && n instanceof n && typeof r == "function" && r instanceof r) && (l = !1), o.delete(e), o.delete(t), t = l;
                  }
                } else
                  t = !1;
            else
              t = !1;
          }
        }
      return t;
    }
    function Pa(e, t, n) {
      this.low = 0 | e, this.high = 0 | t, this.unsigned = !!n;
    }
    function Hb(e) {
      return (e && e.__isLong__) === !0;
    }
    function Xd(e, t) {
      var n;
      if (t) {
        if ((t = 0 <= (e >>>= 0) && 256 > e) && (n = Vm[e]))
          return n;
        n = Qa(e, 0 > (0 | e) ? -1 : 0, !0), t && (Vm[e] = n);
      } else {
        if ((t = -128 <= (e |= 0) && 128 > e) && (n = Wm[e]))
          return n;
        n = Qa(e, 0 > e ? -1 : 0, !1), t && (Wm[e] = n);
      }
      return n;
    }
    function ec(e, t) {
      if (isNaN(e))
        return t ? Yd : fc;
      if (t) {
        if (0 > e)
          return Yd;
        if (e >= Xm)
          return Ym;
      } else {
        if (e <= -Zm)
          return Ib;
        if (e + 1 >= Zm)
          return $m;
      }
      return 0 > e ? ec(-e, t).neg() : Qa(e % Me | 0, e / Me | 0, t);
    }
    function Qa(e, t, n) {
      return new Pa(e, t, n);
    }
    function Vi(e, t, n) {
      if (e.length === 0)
        throw Error("empty string");
      if (e === "NaN" || e === "Infinity" || e === "+Infinity" || e === "-Infinity")
        return fc;
      if (typeof t == "number" ? (n = t, t = !1) : t = !!t, 2 > (n = n || 10) || 36 < n)
        throw RangeError("radix");
      var r;
      if (0 < (r = e.indexOf("-")))
        throw Error("interior hyphen");
      if (r === 0)
        return Vi(e.substring(1), t, n).neg();
      r = ec(ah(n, 8));
      for (var o = fc, i = 0; i < e.length; i += 8) {
        var s = Math.min(8, e.length - i), u = parseInt(e.substring(i, i + s), n);
        8 > s ? (s = ec(ah(n, s)), o = o.mul(s).add(ec(u))) : o = (o = o.mul(r)).add(ec(u));
      }
      return o.unsigned = t, o;
    }
    function vc(e, t) {
      return typeof e == "number" ? ec(e, t) : typeof e == "string" ? Vi(e, t) : Qa(e.low, e.high, typeof t == "boolean" ? t : e.unsigned);
    }
    function ha(e, t) {
      function n() {
        this.constructor = e;
      }
      Wi(e, t), e.prototype = t === null ? Object.create(t) : (n.prototype = t.prototype, new n());
    }
    function Ne(e) {
      return typeof e == "function";
    }
    function Oe(e) {
      setTimeout(function() {
        throw e;
      }, 0);
    }
    function Xi(e) {
      return e !== null && qa(e) === "object";
    }
    function an(e) {
      return e.reduce(function(t, n) {
        return t.concat(n instanceof Pf ? n.errors : n);
      }, []);
    }
    function Yi(e) {
      for (; e; ) {
        var t = e.destination, n = e.isStopped;
        if (e.closed || n)
          return !1;
        e = t && t instanceof za ? t : null;
      }
      return !0;
    }
    function wd(e) {
      return e;
    }
    function Zi() {
      for (var e = [], t = 0; t < arguments.length; t++)
        e[t] = arguments[t];
      return bn(e);
    }
    function bn(e) {
      return e.length === 0 ? wd : e.length === 1 ? e[0] : function(t) {
        return e.reduce(function(n, r) {
          return r(n);
        }, t);
      };
    }
    function cn(e) {
      if (e || (e = gc.Promise || Promise), !e)
        throw Error("no Promise impl found");
      return e;
    }
    function dn() {
      return function(e) {
        return e.lift(new xu(e));
      };
    }
    function Qf(e) {
      return e ? yu(e) : Sb;
    }
    function yu(e) {
      return new ua(function(t) {
        return e.schedule(function() {
          return t.complete();
        });
      });
    }
    function ad(e) {
      return e && typeof e.schedule == "function";
    }
    function $i(e, t) {
      return new ua(function(n) {
        var r = new nb(), o = 0;
        return r.add(t.schedule(function() {
          o === e.length ? n.complete() : (n.next(e[o++]), n.closed || r.add(this.schedule()));
        })), r;
      });
    }
    function Rf(e, t) {
      return t ? $i(e, t) : new ua(en(e));
    }
    function ob() {
      for (var e = [], t = 0; t < arguments.length; t++)
        e[t] = arguments[t];
      return ad(t = e[e.length - 1]) ? (e.pop(), $i(e, t)) : Rf(e);
    }
    function ra(e, t) {
      return new ua(t ? function(n) {
        return t.schedule(zu, 0, { error: e, subscriber: n });
      } : function(n) {
        return n.error(e);
      });
    }
    function zu(e) {
      e.subscriber.error(e.error);
    }
    function Au(e, t) {
      return t === void 0 && (t = 0), function(n) {
        return n.lift(new Bu(e, t));
      };
    }
    function fn(e) {
      return e in aj && (delete aj[e], !0);
    }
    function Ic() {
    }
    function Ea(e, t) {
      return function(n) {
        if (typeof e != "function")
          throw new TypeError("argument is not a function. Are you looking for `mapTo()`?");
        return n.lift(new Cu(e, t));
      };
    }
    function gn(e, t, n) {
      if (t) {
        if (!ad(t))
          return function() {
            for (var r = [], o = 0; o < arguments.length; o++)
              r[o] = arguments[o];
            return gn(e, n).apply(void 0, r).pipe(Ea(function(i) {
              return hc(i) ? t.apply(void 0, i) : t(i);
            }));
          };
        n = t;
      }
      return function() {
        for (var r = [], o = 0; o < arguments.length; o++)
          r[o] = arguments[o];
        var i, s = this, u = { context: s, subject: i, callbackFunc: e, scheduler: n };
        return new ua(function(a) {
          if (n)
            return n.schedule(Du, 0, { args: r, subscriber: a, params: u });
          if (!i) {
            i = new Sf();
            try {
              e.apply(s, r.concat([function() {
                for (var l = [], f = 0; f < arguments.length; f++)
                  l[f] = arguments[f];
                i.next(1 >= l.length ? l[0] : l), i.complete();
              }]));
            } catch (l) {
              Yi(i) ? i.error(l) : console.warn(l);
            }
          }
          return i.subscribe(a);
        });
      };
    }
    function Du(e) {
      var t = this, n = e.args, r = e.subscriber, o = e.params;
      e = o.callbackFunc;
      var i = o.context, s = o.scheduler, u = o.subject;
      if (!u) {
        u = o.subject = new Sf(), o = function() {
          for (var a = [], l = 0; l < arguments.length; l++)
            a[l] = arguments[l];
          t.add(s.schedule(Eu, 0, { value: 1 >= a.length ? a[0] : a, subject: u }));
        };
        try {
          e.apply(i, n.concat([o]));
        } catch (a) {
          u.error(a);
        }
      }
      this.add(u.subscribe(r));
    }
    function Eu(e) {
      var t = e.subject;
      t.next(e.value), t.complete();
    }
    function hn(e, t, n) {
      if (t) {
        if (!ad(t))
          return function() {
            for (var r = [], o = 0; o < arguments.length; o++)
              r[o] = arguments[o];
            return hn(e, n).apply(void 0, r).pipe(Ea(function(i) {
              return hc(i) ? t.apply(void 0, i) : t(i);
            }));
          };
        n = t;
      }
      return function() {
        for (var r = [], o = 0; o < arguments.length; o++)
          r[o] = arguments[o];
        var i = { subject: void 0, args: r, callbackFunc: e, scheduler: n, context: this };
        return new ua(function(s) {
          var u = i.context, a = i.subject;
          if (n)
            return n.schedule(Fu, 0, { params: i, subscriber: s, context: u });
          if (!a) {
            a = i.subject = new Sf();
            try {
              e.apply(u, r.concat([function() {
                for (var l = [], f = 0; f < arguments.length; f++)
                  l[f] = arguments[f];
                (f = l.shift()) ? a.error(f) : (a.next(1 >= l.length ? l[0] : l), a.complete());
              }]));
            } catch (l) {
              Yi(a) ? a.error(l) : console.warn(l);
            }
          }
          return a.subscribe(s);
        });
      };
    }
    function Fu(e) {
      var t = this, n = e.params, r = e.subscriber;
      e = e.context;
      var o = n.callbackFunc, i = n.args, s = n.scheduler, u = n.subject;
      if (!u) {
        u = n.subject = new Sf(), n = function() {
          for (var a = [], l = 0; l < arguments.length; l++)
            a[l] = arguments[l];
          (l = a.shift()) ? t.add(s.schedule(jn, 0, { err: l, subject: u })) : t.add(s.schedule(Gu, 0, { value: 1 >= a.length ? a[0] : a, subject: u }));
        };
        try {
          o.apply(e, i.concat([n]));
        } catch (a) {
          this.add(s.schedule(jn, 0, { err: a, subject: u }));
        }
      }
      this.add(u.subscribe(r));
    }
    function Gu(e) {
      var t = e.subject;
      t.next(e.value), t.complete();
    }
    function jn(e) {
      e.subject.error(e.err);
    }
    function kn(e) {
      return !!e && typeof e.subscribe != "function" && typeof e.then == "function";
    }
    function bj(e, t, n, r, o) {
      if (o === void 0 && (o = new Hu(e, n, r)), !o.closed)
        return t instanceof ua ? t.subscribe(o) : Tf(t)(o);
    }
    function Iu(e, t) {
      return new ua(function(n) {
        var r = new nb();
        return r.add(t.schedule(function() {
          var o = e[Pe]();
          r.add(o.subscribe({ next: function(i) {
            r.add(t.schedule(function() {
              return n.next(i);
            }));
          }, error: function(i) {
            r.add(t.schedule(function() {
              return n.error(i);
            }));
          }, complete: function() {
            r.add(t.schedule(function() {
              return n.complete();
            }));
          } }));
        })), r;
      });
    }
    function Ju(e, t) {
      return new ua(function(n) {
        var r = new nb();
        return r.add(t.schedule(function() {
          return e.then(function(o) {
            r.add(t.schedule(function() {
              n.next(o), r.add(t.schedule(function() {
                return n.complete();
              }));
            }));
          }, function(o) {
            r.add(t.schedule(function() {
              return n.error(o);
            }));
          });
        })), r;
      });
    }
    function Ku(e, t) {
      if (!e)
        throw Error("Iterable cannot be null");
      return new ua(function(n) {
        var r, o = new nb();
        return o.add(function() {
          r && typeof r.return == "function" && r.return();
        }), o.add(t.schedule(function() {
          r = e[xd](), o.add(t.schedule(function() {
            if (!n.closed) {
              try {
                var i = r.next(), s = i.value, u = i.done;
              } catch (a) {
                return void n.error(a);
              }
              u ? n.complete() : (n.next(s), this.schedule());
            }
          }));
        })), o;
      });
    }
    function ln(e, t) {
      if (e != null) {
        if (e && typeof e[Pe] == "function")
          return Iu(e, t);
        if (kn(e))
          return Ju(e, t);
        if (mn(e))
          return $i(e, t);
        if (e && typeof e[xd] == "function" || typeof e == "string")
          return Ku(e, t);
      }
      throw new TypeError((e !== null && qa(e) || e) + " is not observable");
    }
    function Jc(e, t) {
      return t ? ln(e, t) : e instanceof ua ? e : new ua(Tf(e));
    }
    function bd(e, t) {
      if (!t.closed) {
        if (e instanceof ua)
          return e.subscribe(t);
        try {
          var n = Tf(e)(t);
        } catch (r) {
          t.error(r);
        }
        return n;
      }
    }
    function Cb(e, t, n) {
      return n === void 0 && (n = Number.POSITIVE_INFINITY), typeof t == "function" ? function(r) {
        return r.pipe(Cb(function(o, i) {
          return Jc(e(o, i)).pipe(Ea(function(s, u) {
            return t(o, s, i, u);
          }));
        }, n));
      } : (typeof t == "number" && (n = t), function(r) {
        return r.lift(new Lu(e, n));
      });
    }
    function bh(e) {
      return e === void 0 && (e = Number.POSITIVE_INFINITY), Cb(wd, e);
    }
    function nn() {
      for (var e = [], t = 0; t < arguments.length; t++)
        e[t] = arguments[t];
      return bh(1)(ob.apply(void 0, e));
    }
    function yd(e) {
      return new ua(function(t) {
        try {
          var n = e();
        } catch (r) {
          return void t.error(r);
        }
        return (n ? Jc(n) : Qf()).subscribe(t);
      });
    }
    function ch(e, t) {
      return new ua(function(n) {
        var r = e.length;
        if (r === 0)
          n.complete();
        else
          for (var o = Array(r), i = 0, s = 0, u = function(l) {
            var f = Jc(e[l]), h = !1;
            n.add(f.subscribe({ next: function(d) {
              h || (h = !0, s++), o[l] = d;
            }, error: function(d) {
              return n.error(d);
            }, complete: function() {
              ++i !== r && h || (s === r && n.next(t ? t.reduce(function(d, p, v) {
                return d[p] = o[v], d;
              }, {}) : o), n.complete());
            } }));
          }, a = 0; a < r; a++)
            u(a);
      });
    }
    function Db(e, t, n, r) {
      return Ne(n) && (r = n, n = void 0), r ? Db(e, t, n).pipe(Ea(function(o) {
        return hc(o) ? r.apply(void 0, o) : r(o);
      })) : new ua(function(o) {
        on(e, t, function(i) {
          1 < arguments.length ? o.next(Array.prototype.slice.call(arguments)) : o.next(i);
        }, o, n);
      });
    }
    function on(e, t, n, r, o) {
      if (e && typeof e.addEventListener == "function" && typeof e.removeEventListener == "function") {
        e.addEventListener(t, n, o);
        var i = function() {
          return e.removeEventListener(t, n, o);
        };
      } else if (e && typeof e.on == "function" && typeof e.off == "function")
        e.on(t, n), i = function() {
          return e.off(t, n);
        };
      else if (e && typeof e.addListener == "function" && typeof e.removeListener == "function")
        e.addListener(t, n), i = function() {
          return e.removeListener(t, n);
        };
      else {
        if (!e || !e.length)
          throw new TypeError("Invalid event target");
        for (var s = 0, u = e.length; s < u; s++)
          on(e[s], t, n, r, o);
      }
      r.add(i);
    }
    function pn(e, t, n) {
      return n ? pn(e, t).pipe(Ea(function(r) {
        return hc(r) ? n.apply(void 0, r) : n(r);
      })) : new ua(function(r) {
        var o = function() {
          for (var s = [], u = 0; u < arguments.length; u++)
            s[u] = arguments[u];
          return r.next(s.length === 1 ? s[0] : s);
        };
        try {
          var i = e(o);
        } catch (s) {
          return void r.error(s);
        }
        if (Ne(t))
          return function() {
            return t(o, i);
          };
      });
    }
    function Mu(e) {
      var t = e.subscriber, n = e.condition;
      if (!t.closed) {
        if (e.needIterate)
          try {
            e.state = e.iterate(e.state);
          } catch (i) {
            return void t.error(i);
          }
        else
          e.needIterate = !0;
        if (n) {
          var r = void 0;
          try {
            r = n(e.state);
          } catch (i) {
            return void t.error(i);
          }
          if (!r)
            return void t.complete();
          if (t.closed)
            return;
        }
        try {
          var o = e.resultSelector(e.state);
        } catch (i) {
          return void t.error(i);
        }
        if (!t.closed && (t.next(o), !t.closed))
          return this.schedule(e);
      }
    }
    function cj(e) {
      return !hc(e) && 0 <= e - parseFloat(e) + 1;
    }
    function Qe(e, t) {
      return e === void 0 && (e = 0), t === void 0 && (t = cd), (!cj(e) || 0 > e) && (e = 0), t && typeof t.schedule == "function" || (t = cd), new ua(function(n) {
        return n.add(t.schedule(Nu, e, { subscriber: n, counter: 0, period: e })), n;
      });
    }
    function Nu(e) {
      var t = e.subscriber, n = e.counter;
      e = e.period, t.next(n), this.schedule({ subscriber: t, counter: n + 1, period: e }, e);
    }
    function Jb() {
      for (var e = [], t = 0; t < arguments.length; t++)
        e[t] = arguments[t];
      t = Number.POSITIVE_INFINITY;
      var n = null, r = e[e.length - 1];
      return ad(r) ? (n = e.pop(), 1 < e.length && typeof e[e.length - 1] == "number" && (t = e.pop())) : typeof r == "number" && (t = e.pop()), n === null && e.length === 1 && e[0] instanceof ua ? e[0] : bh(t)(Rf(e, n));
    }
    function dj() {
      for (var e = [], t = 0; t < arguments.length; t++)
        e[t] = arguments[t];
      if (e.length === 0)
        return Sb;
      var n = e[0], r = e.slice(1);
      return e.length === 1 && hc(n) ? dj.apply(void 0, n) : new ua(function(o) {
        var i = function() {
          return o.add(dj.apply(void 0, r).subscribe(o));
        };
        return Jc(n).subscribe({ next: function(s) {
          o.next(s);
        }, error: i, complete: i });
      });
    }
    function Ou(e) {
      var t = e.keys, n = e.index, r = e.subscriber, o = e.subscription;
      if (e = e.obj, !r.closed)
        if (n < t.length) {
          var i = t[n];
          r.next([i, e[i]]), o.add(this.schedule({ keys: t, index: n + 1, subscriber: r, subscription: o, obj: e }));
        } else
          r.complete();
    }
    function Pu(e, t) {
      function n() {
        return !n.pred.apply(n.thisArg, arguments);
      }
      return n.pred = e, n.thisArg = t, n;
    }
    function yb(e, t) {
      return function(n) {
        return n.lift(new Qu(e, t));
      };
    }
    function fb() {
      for (var e = [], t = 0; t < arguments.length; t++)
        e[t] = arguments[t];
      if (e.length === 1) {
        if (!hc(e[0]))
          return e[0];
        e = e[0];
      }
      return Rf(e, void 0).lift(new Ru());
    }
    function Su(e) {
      var t = e.start, n = e.index, r = e.subscriber;
      n >= e.count ? r.complete() : (r.next(t), r.closed || (e.index = n + 1, e.start = t + 1, this.schedule(e)));
    }
    function dd(e, t, n) {
      e === void 0 && (e = 0);
      var r = -1;
      return cj(t) ? r = 1 > Number(t) ? 1 : Number(t) : ad(t) && (n = t), ad(n) || (n = cd), new ua(function(o) {
        var i = cj(e) ? e : +e - n.now();
        return n.schedule(Tu, i, { index: 0, period: r, subscriber: o });
      });
    }
    function Tu(e) {
      var t = e.index, n = e.period, r = e.subscriber;
      if (r.next(t), !r.closed) {
        if (n === -1)
          return r.complete();
        e.index = t + 1, this.schedule(e, n);
      }
    }
    function ej() {
      for (var e = [], t = 0; t < arguments.length; t++)
        e[t] = arguments[t];
      return typeof (t = e[e.length - 1]) == "function" && e.pop(), Rf(e, void 0).lift(new Uu(t));
    }
    function dh(e) {
      var t = arguments.length, n = cd;
      ad(arguments[arguments.length - 1]) && (n = arguments[arguments.length - 1], t--);
      var r = null;
      2 <= t && (r = arguments[1]);
      var o = Number.POSITIVE_INFINITY;
      return 3 <= t && (o = arguments[2]), function(i) {
        return i.lift(new Vu(e, r, o, n));
      };
    }
    function qn(e) {
      var t = e.subscriber, n = e.context;
      n && t.closeContext(n), t.closed || (e.context = t.openContext(), e.context.closeAction = this.schedule(e, e.bufferTimeSpan));
    }
    function Wu(e) {
      var t = e.bufferCreationInterval, n = e.bufferTimeSpan, r = e.subscriber, o = e.scheduler, i = r.openContext();
      r.closed || (r.add(i.closeAction = o.schedule(rn, n, { subscriber: r, context: i })), this.schedule(e, t));
    }
    function rn(e) {
      e.subscriber.closeContext(e.context);
    }
    function ab(e) {
      return function(t) {
        var n = new Xu(e);
        return t = t.lift(n), n.caught = t;
      };
    }
    function fj(e, t) {
      return Cb(e, t, 1);
    }
    function sn(e) {
      return e === void 0 && (e = null), function(t) {
        return t.lift(new Yu(e));
      };
    }
    function Zd(e, t) {
      t === void 0 && (t = cd);
      var n = e instanceof Date && !isNaN(+e) ? +e - t.now() : Math.abs(e);
      return function(r) {
        return r.lift(new Zu(n, t));
      };
    }
    function tn(e, t) {
      return function(n) {
        return n.lift(new $u(e, t));
      };
    }
    function $d(e) {
      return e === void 0 && (e = av), function(t) {
        return t.lift(new bv(e));
      };
    }
    function av() {
      return new eh();
    }
    function hb(e) {
      return function(t) {
        return e === 0 ? Qf() : t.lift(new cv(e));
      };
    }
    function fh(e) {
      return function(t) {
        return t.lift(new dv(e));
      };
    }
    function Ca(e, t) {
      var n = 2 <= arguments.length;
      return function(r) {
        return r.pipe(e ? yb(function(o, i) {
          return e(o, i, r);
        }) : wd, hb(1), n ? sn(t) : $d(function() {
          return new eh();
        }));
      };
    }
    function ev() {
      return function(e) {
        return e.lift(new fv());
      };
    }
    function un(e) {
      return function(t) {
        return e === 0 ? Qf() : t.lift(new gv(e));
      };
    }
    function Uf(e) {
      return function(t) {
        return t.lift(new hv(e));
      };
    }
    function gh(e, t) {
      var n = !1;
      return 2 <= arguments.length && (n = !0), function(r) {
        return r.lift(new iv(e, t, n));
      };
    }
    function vn(e, t) {
      return 2 <= arguments.length ? function(n) {
        return Zi(gh(e, t), un(1), sn(t))(n);
      } : function(n) {
        return Zi(gh(function(r, o, i) {
          return e(r, o, i + 1);
        }), un(1))(n);
      };
    }
    function jv(e, t) {
      return function(n) {
        var r = typeof e == "function" ? e : function() {
          return e;
        };
        if (typeof t == "function")
          return n.lift(new kv(r, t));
        var o = Object.create(n, lv);
        return o.source = n, o.subjectFactory = r, o;
      };
    }
    function Re(e) {
      return function(t) {
        return t.lift(new mv(e, t));
      };
    }
    function nv() {
      return new rb();
    }
    function Se() {
      return function(e) {
        return dn()(jv(nv)(e));
      };
    }
    function wn(e, t, n) {
      var r = e && qa(e) === "object" ? e : { bufferSize: e, windowTime: t, refCount: !1, scheduler: n };
      return function(o) {
        return o.lift(ov(r));
      };
    }
    function ov(e) {
      var t, n, r = e.bufferSize, o = r === void 0 ? Number.POSITIVE_INFINITY : r, i = (r = e.windowTime) === void 0 ? Number.POSITIVE_INFINITY : r, s = e.refCount, u = e.scheduler, a = 0, l = !1, f = !1;
      return function(h) {
        if (a++, !t || l) {
          l = !1;
          var d = (t = new Te(o, i, u)).subscribe(this);
          n = h.subscribe({ next: function(p) {
            t.next(p);
          }, error: function(p) {
            l = !0, t.error(p);
          }, complete: function() {
            f = !0, n = void 0, t.complete();
          } }), f && (n = void 0);
        } else
          d = t.subscribe(this);
        this.add(function() {
          a--, d.unsubscribe(), d = void 0, n && !f && s && a === 0 && (n.unsubscribe(), t = n = void 0);
        });
      };
    }
    function Kb(e, t) {
      return typeof t == "function" ? function(n) {
        return n.pipe(Kb(function(r, o) {
          return Jc(e(r, o)).pipe(Ea(function(i, s) {
            return t(r, i, o, s);
          }));
        }));
      } : function(n) {
        return n.lift(new pv(e));
      };
    }
    function Kc(e) {
      return function(t) {
        return t.lift(new qv(e));
      };
    }
    function sa(e, t, n) {
      return function(r) {
        return r.lift(new rv(e, t, n));
      };
    }
    function sv(e, t, n) {
      return t === void 0 && (t = cd), n === void 0 && (n = tv), function(r) {
        return r.lift(new uv(e, t, n.leading, n.trailing));
      };
    }
    function vv(e) {
      e.subscriber.clearThrottle();
    }
    function wv(e, t, n) {
      return n === void 0 && (n = cd), function(r) {
        var o = e instanceof Date && !isNaN(+e), i = o ? +e - n.now() : Math.abs(e);
        return r.lift(new xv(i, o, t, n));
      };
    }
    function Lb(e, t) {
      return t === void 0 && (t = cd), wv(e, ra(new Tb()), t);
    }
    function yv() {
      for (var e = [], t = 0; t < arguments.length; t++)
        e[t] = arguments[t];
      return function(n) {
        var r;
        return typeof e[e.length - 1] == "function" && (r = e.pop()), n.lift(new zv(e, r));
      };
    }
    function xn(e) {
      (gj || e) && (yn.abort(), e && (yn = new AbortController()), gj = e);
    }
    function zn(e, t, n, r, o) {
      e !== t && An(t, function(i, s) {
        if (o || (o = new Ie()), Gb(i)) {
          i = o;
          var u = hj(e, s), a = hj(t, s), l = i.get(a);
          if (l)
            ij(e, s, l);
          else {
            var f = (l = r ? r(u, a, s + "", e, t, i) : void 0) === void 0;
            if (f) {
              var h = ub(a), d = !h && Nf(a), p = !h && !d && Ui(a);
              l = a, h || d || p ? ub(u) ? l = u : Hc(u) && ae(u) ? l = Pi(u) : d ? (f = !1, l = Nm(a, !0)) : p ? (f = !1, l = Bn(a, !0)) : l = [] : Cn(a) || Vf(a) ? (l = u, Vf(u) ? l = Ue(u, Of(u)) : Gb(u) && !jj(u) || (l = Om(a))) : f = !1;
            }
            f && (i.set(a, l), zn(l, a, n, r, i), i.delete(a)), ij(e, s, l);
          }
        } else
          (u = r ? r(hj(e, s), i, s + "", e, t, o) : void 0) === void 0 && (u = i), ij(e, s, u);
      }, Of);
    }
    function Av(e) {
      var t = 1, n = kj;
      (1 >= arguments.length ? 0 : arguments.length - 1) == 1 ? typeof (1 >= arguments.length ? void 0 : arguments[1]) == "number" ? t = 1 >= arguments.length ? void 0 : arguments[1] : n = 1 >= arguments.length ? void 0 : arguments[1] : (1 >= arguments.length ? 0 : arguments.length - 1) == 2 && (t = 1 >= arguments.length ? void 0 : arguments[1], n = 2 >= arguments.length ? void 0 : arguments[2]);
      var r = t || 1;
      return function(o) {
        return o.pipe(gh(function(i, s) {
          var u = n.now(), a = u - e;
          if ((i = i.filter(function(h) {
            return h.until > a;
          })).length >= r) {
            var l = i[i.length - 1], f = i[0].until + e * Math.floor(i.length / r);
            i.push({ delay: l.until < u ? f - u : f - l.until, until: f, value: s });
          } else
            i.push({ delay: 0, until: u, value: s });
          return i;
        }, []), Ea(function(i) {
          return i[i.length - 1];
        }), fj(function(i) {
          var s = ob(i.value);
          return i.delay ? s.pipe(Zd(i.delay, n)) : s;
        }));
      };
    }
    function Bv(e, t) {
      var n = (t = t === void 0 ? { protocols: Dn, makeWebSocket: En } : t).protocols, r = n === void 0 ? Dn : n, o = (t = t.makeWebSocket) === void 0 ? En : t;
      return new ua(function(i) {
        var s, u = new rb(), a = o(e, r), l = !1, f = !1, h = !1, d = function(p) {
          if (s)
            throw l = !0, p = Error("Web socket message factory function called more than once"), i.error(p), p;
          return s = p.subscribe(function(v) {
            a.send(v);
          }), u;
        };
        return a.onopen = function() {
          h = !0, f ? (l = !0, a.close()) : i.next(d);
        }, a.onmessage = function(p) {
          u.next(p.data);
        }, a.onerror = function(p) {
          l = !0, i.error(Error(p.message));
        }, a.onclose = function(p) {
          l || (l = !0, f ? (i.complete(), u.complete()) : i.error(Error(p.code === 1e3 ? "Normal closure" : p.reason)));
        }, function() {
          f = !0, s && s.unsubscribe(), l || (l = !0, h && a.close());
        };
      });
    }
    function hh() {
      this._listeners = {};
    }
    function Fn(e) {
      return typeof Float32Array != "undefined" ? function() {
        function t(a, l, f) {
          i[0] = a, l[f] = s[0], l[f + 1] = s[1], l[f + 2] = s[2], l[f + 3] = s[3];
        }
        function n(a, l, f) {
          i[0] = a, l[f] = s[3], l[f + 1] = s[2], l[f + 2] = s[1], l[f + 3] = s[0];
        }
        function r(a, l) {
          return s[0] = a[l], s[1] = a[l + 1], s[2] = a[l + 2], s[3] = a[l + 3], i[0];
        }
        function o(a, l) {
          return s[3] = a[l], s[2] = a[l + 1], s[1] = a[l + 2], s[0] = a[l + 3], i[0];
        }
        var i = new Float32Array([-0]), s = new Uint8Array(i.buffer), u = s[3] === 128;
        e.writeFloatLE = u ? t : n, e.writeFloatBE = u ? n : t, e.readFloatLE = u ? r : o, e.readFloatBE = u ? o : r;
      }() : function() {
        function t(r, o, i, s) {
          var u = 0 > o ? 1 : 0;
          if (u && (o = -o), o === 0)
            r(0 < 1 / o ? 0 : 2147483648, i, s);
          else if (isNaN(o))
            r(2143289344, i, s);
          else if (34028234663852886e22 < o)
            r((u << 31 | 2139095040) >>> 0, i, s);
          else if (11754943508222875e-54 > o)
            r((u << 31 | Math.round(o / 1401298464324817e-60)) >>> 0, i, s);
          else {
            var a = Math.floor(Math.log(o) / Math.LN2);
            r((u << 31 | a + 127 << 23 | 8388607 & Math.round(o * Math.pow(2, -a) * 8388608)) >>> 0, i, s);
          }
        }
        function n(r, o, i) {
          return i = r(o, i), r = 2 * (i >> 31) + 1, o = i >>> 23 & 255, i &= 8388607, o === 255 ? i ? NaN : 1 / 0 * r : o === 0 ? 1401298464324817e-60 * r * i : r * Math.pow(2, o - 150) * (i + 8388608);
        }
        e.writeFloatLE = t.bind(null, Gn), e.writeFloatBE = t.bind(null, Hn), e.readFloatLE = n.bind(null, In), e.readFloatBE = n.bind(null, Jn);
      }(), typeof Float64Array != "undefined" ? function() {
        function t(a, l, f) {
          i[0] = a, l[f] = s[0], l[f + 1] = s[1], l[f + 2] = s[2], l[f + 3] = s[3], l[f + 4] = s[4], l[f + 5] = s[5], l[f + 6] = s[6], l[f + 7] = s[7];
        }
        function n(a, l, f) {
          i[0] = a, l[f] = s[7], l[f + 1] = s[6], l[f + 2] = s[5], l[f + 3] = s[4], l[f + 4] = s[3], l[f + 5] = s[2], l[f + 6] = s[1], l[f + 7] = s[0];
        }
        function r(a, l) {
          return s[0] = a[l], s[1] = a[l + 1], s[2] = a[l + 2], s[3] = a[l + 3], s[4] = a[l + 4], s[5] = a[l + 5], s[6] = a[l + 6], s[7] = a[l + 7], i[0];
        }
        function o(a, l) {
          return s[7] = a[l], s[6] = a[l + 1], s[5] = a[l + 2], s[4] = a[l + 3], s[3] = a[l + 4], s[2] = a[l + 5], s[1] = a[l + 6], s[0] = a[l + 7], i[0];
        }
        var i = new Float64Array([-0]), s = new Uint8Array(i.buffer), u = s[7] === 128;
        e.writeDoubleLE = u ? t : n, e.writeDoubleBE = u ? n : t, e.readDoubleLE = u ? r : o, e.readDoubleBE = u ? o : r;
      }() : function() {
        function t(r, o, i, s, u, a) {
          var l = 0 > s ? 1 : 0;
          if (l && (s = -s), s === 0)
            r(0, u, a + o), r(0 < 1 / s ? 0 : 2147483648, u, a + i);
          else if (isNaN(s))
            r(0, u, a + o), r(2146959360, u, a + i);
          else if (17976931348623157e292 < s)
            r(0, u, a + o), r((l << 31 | 2146435072) >>> 0, u, a + i);
          else if (22250738585072014e-324 > s)
            r((s /= 5e-324) >>> 0, u, a + o), r((l << 31 | s / 4294967296) >>> 0, u, a + i);
          else {
            var f = Math.floor(Math.log(s) / Math.LN2);
            f === 1024 && (f = 1023), r(4503599627370496 * (s *= Math.pow(2, -f)) >>> 0, u, a + o), r((l << 31 | f + 1023 << 20 | 1048576 * s & 1048575) >>> 0, u, a + i);
          }
        }
        function n(r, o, i, s, u) {
          return o = r(s, u + o), s = r(s, u + i), r = 2 * (s >> 31) + 1, o = 4294967296 * (1048575 & s) + o, (i = s >>> 20 & 2047) === 2047 ? o ? NaN : 1 / 0 * r : i === 0 ? 5e-324 * r * o : r * Math.pow(2, i - 1075) * (o + 4503599627370496);
        }
        e.writeDoubleLE = t.bind(null, Gn, 0, 4), e.writeDoubleBE = t.bind(null, Hn, 4, 0), e.readDoubleLE = n.bind(null, In, 0, 4), e.readDoubleBE = n.bind(null, Jn, 4, 0);
      }(), e;
    }
    function Gn(e, t, n) {
      t[n] = 255 & e, t[n + 1] = e >>> 8 & 255, t[n + 2] = e >>> 16 & 255, t[n + 3] = e >>> 24;
    }
    function Hn(e, t, n) {
      t[n] = e >>> 24, t[n + 1] = e >>> 16 & 255, t[n + 2] = e >>> 8 & 255, t[n + 3] = 255 & e;
    }
    function In(e, t) {
      return (e[t] | e[t + 1] << 8 | e[t + 2] << 16 | e[t + 3] << 24) >>> 0;
    }
    function Jn(e, t) {
      return (e[t] << 24 | e[t + 1] << 16 | e[t + 2] << 8 | e[t + 3]) >>> 0;
    }
    function vb(e, t) {
      this.lo = e >>> 0, this.hi = t >>> 0;
    }
    function Wf(e, t, n) {
      this.fn = e, this.len = t, this.next = void 0, this.val = n;
    }
    function lj() {
    }
    function Cv(e) {
      this.head = e.head, this.tail = e.tail, this.len = e.len, this.next = e.states;
    }
    function Aa() {
      this.len = 0, this.tail = this.head = new Wf(lj, 0, 0), this.states = null;
    }
    function mj(e, t, n) {
      t[n] = 255 & e;
    }
    function nj(e, t) {
      this.len = e, this.next = void 0, this.val = t;
    }
    function oj(e, t, n) {
      for (; e.hi; )
        t[n++] = 127 & e.lo | 128, e.lo = (e.lo >>> 7 | e.hi << 25) >>> 0, e.hi >>>= 7;
      for (; 127 < e.lo; )
        t[n++] = 127 & e.lo | 128, e.lo >>>= 7;
      t[n++] = e.lo;
    }
    function pj(e, t, n) {
      t[n] = 255 & e, t[n + 1] = e >>> 8 & 255, t[n + 2] = e >>> 16 & 255, t[n + 3] = e >>> 24;
    }
    function Lc() {
      qj.call(this);
    }
    function Dv(e, t, n) {
      40 > e.length ? pa.utf8.write(e, t, n) : t.utf8Write ? t.utf8Write(e, n) : t.write(e, n);
    }
    function wc(e, t) {
      return RangeError("index out of range: " + e.pos + " + " + (t || 1) + " > " + e.len);
    }
    function ib(e) {
      this.buf = e, this.pos = 0, this.len = e.length;
    }
    function rj() {
      var e = new Kn(0, 0), t = 0;
      if (!(4 < this.len - this.pos)) {
        for (; 3 > t; ++t) {
          if (this.pos >= this.len)
            throw wc(this);
          if (e.lo = (e.lo | (127 & this.buf[this.pos]) << 7 * t) >>> 0, 128 > this.buf[this.pos++])
            return e;
        }
        return e.lo = (e.lo | (127 & this.buf[this.pos++]) << 7 * t) >>> 0, e;
      }
      for (; 4 > t; ++t)
        if (e.lo = (e.lo | (127 & this.buf[this.pos]) << 7 * t) >>> 0, 128 > this.buf[this.pos++])
          return e;
      if (e.lo = (e.lo | (127 & this.buf[this.pos]) << 28) >>> 0, e.hi = (e.hi | (127 & this.buf[this.pos]) >> 4) >>> 0, 128 > this.buf[this.pos++])
        return e;
      if (t = 0, 4 < this.len - this.pos) {
        for (; 5 > t; ++t)
          if (e.hi = (e.hi | (127 & this.buf[this.pos]) << 7 * t + 3) >>> 0, 128 > this.buf[this.pos++])
            return e;
      } else
        for (; 5 > t; ++t) {
          if (this.pos >= this.len)
            throw wc(this);
          if (e.hi = (e.hi | (127 & this.buf[this.pos]) << 7 * t + 3) >>> 0, 128 > this.buf[this.pos++])
            return e;
        }
      throw Error("invalid varint encoding");
    }
    function ih(e, t) {
      return (e[t - 4] | e[t - 3] << 8 | e[t - 2] << 16 | e[t - 1] << 24) >>> 0;
    }
    function Ln() {
      if (this.pos + 8 > this.len)
        throw wc(this, 8);
      return new Kn(ih(this.buf, this.pos += 4), ih(this.buf, this.pos += 4));
    }
    function be(e) {
      sj.call(this, e);
    }
    function Xf(e, t, n) {
      if (typeof e != "function")
        throw TypeError("rpcImpl must be a function");
      pa.EventEmitter.call(this), this.rpcImpl = e, this.requestDelimited = !!t, this.responseDelimited = !!n;
    }
    function Mn(e) {
      var t = [];
      return function n(r) {
        if (r === null || qa(r) !== "object")
          return r;
        if (t.indexOf(r) !== -1)
          return "[Circular]";
        if (t.push(r), typeof r.toJSON == "function")
          try {
            var o = n(r.toJSON());
            return t.pop(), o;
          } catch (i) {
            return "[Throws: " + (i ? i.message : "?") + "]";
          }
        return Array.isArray(r) ? (o = r.map(n), t.pop(), o) : (o = Object.keys(r).reduce(function(i, s) {
          t: {
            if (Ev.call(r, s))
              try {
                var u = r[s];
                break t;
              } catch (a) {
                u = "[Throws: " + (a ? a.message : "?") + "]";
                break t;
              }
            u = r[s];
          }
          return i[s] = n(u), i;
        }, {}), t.pop(), o);
      }(e);
    }
    function Fv(e) {
      if (!(100 < (e = String(e)).length) && (e = /^(-?(?:\d+)?\.?\d+) *(milliseconds?|msecs?|ms|seconds?|secs?|s|minutes?|mins?|m|hours?|hrs?|h|days?|d|weeks?|w|years?|yrs?|y)?$/i.exec(e))) {
        var t = parseFloat(e[1]);
        switch ((e[2] || "ms").toLowerCase()) {
          case "years":
          case "year":
          case "yrs":
          case "yr":
          case "y":
            return 315576e5 * t;
          case "weeks":
          case "week":
          case "w":
            return 6048e5 * t;
          case "days":
          case "day":
          case "d":
            return 864e5 * t;
          case "hours":
          case "hour":
          case "hrs":
          case "hr":
          case "h":
            return 36e5 * t;
          case "minutes":
          case "minute":
          case "mins":
          case "min":
          case "m":
            return 6e4 * t;
          case "seconds":
          case "second":
          case "secs":
          case "sec":
          case "s":
            return 1e3 * t;
          case "milliseconds":
          case "millisecond":
          case "msecs":
          case "msec":
          case "ms":
            return t;
        }
      }
    }
    function jh(e, t, n, r) {
      return Math.round(e / n) + " " + r + (t >= 1.5 * n ? "s" : "");
    }
    function Gv(e) {
      var t = e.areas, n = e.excludedArea;
      if (t.length === 1 && t[0] === S.GLOBAL && n === S.CHINA)
        return Ve([S.OVERSEA]);
      if (t.includes(S.GLOBAL)) {
        if (e = Yf(kh).filter(function(i) {
          return i !== S.GLOBAL && i !== S.OVERSEA;
        }), n in Zf) {
          t = Zf[n];
          var r = [].concat(Z(t != null ? t : []), [n]);
          return Ve(e.filter(function(i) {
            return !r.includes(i);
          }));
        }
        if (Nn(n)) {
          var o = Hv(n);
          return Ve(e.filter(function(i) {
            return i !== n && i !== o;
          }));
        }
      }
      if (Nn(n) || n in Zf)
        return Ve(t);
      throw new ca("Invalid excludedArea area config");
    }
    function jb(e, t, n) {
      n === void 0 && (n = Object.getOwnPropertyDescriptor(e, t));
      var r = n.value;
      return n.value = function() {
        for (var o = this, i = arguments.length, s = Array(i), u = 0; u < i; u++)
          s[u] = arguments[u];
        this.invokeTracker.apply(this, ["%s: ".concat(0 < s.length ? "%s with args: ".concat(s.map(function() {
          return "%o";
        })) : "%s"), this.name, t].concat(Z(s.map(We))));
        try {
          var a = r.apply(this, s);
        } catch (f) {
          throw this.logError.apply(this, ["".concat(f.code !== void 0 ? "Error Code ".concat(f.code, ": ") : "", "%s failed").concat(0 < s.length ? " with args: ".concat(s.map(function() {
            return "%o";
          })) : ""), t].concat(Z(s.map(We)))), f.originalError && this.logError(f.originalError), this.errorTracker(f), f;
        }
        var l = Date.now();
        return ma(N.mark(function f() {
          var h, d;
          return N.wrap(function(p) {
            for (; ; )
              switch (p.prev = p.next) {
                case 0:
                  return p.prev = 0, p.next = 3, a;
                case 3:
                  h = p.sent, p.next = 12;
                  break;
                case 6:
                  return p.prev = 6, p.t0 = p.catch(0), o.logError.apply(o, ["".concat(p.t0.code !== void 0 ? "Error Code ".concat(p.t0.code, ": ") : "", "%s failed").concat(0 < s.length ? " with args: ".concat(s.map(function() {
                    return "%o";
                  })) : ""), t].concat(Z(s.map(We)))), p.t0.originalError && o.logError(p.t0.originalError), o.errorTracker(p.t0), p.abrupt("return");
                case 12:
                  h !== a ? h === void 0 ? o.resultTracker("%s promise resolves after %dms", t, Date.now() - l) : o.resultTracker("%s promise resolves after %dms, result is %o", t, Date.now() - l, We(h)) : $c(h) !== "Object" || De(h) ? o.resultTracker("%s result is %o", t, We(h)) : o.resultTracker("%s result is %s", t, h.name || ((d = h.constructor) === null || d === void 0 ? void 0 : d.name));
                case 13:
                case "end":
                  return p.stop();
              }
          }, f, null, [[0, 6]]);
        }))(), a;
      }, n;
    }
    function Mc(e, t, n) {
      n === void 0 && (n = Object.getOwnPropertyDescriptor(e, t));
      var r = n.value;
      return n.value = function() {
        for (var o = this, i = arguments.length, s = Array(i), u = 0; u < i; u++)
          s[u] = arguments[u];
        this.invokeTracker.apply(this, ["%s: ".concat(0 < s.length ? "%s with args: ".concat(s.map(function() {
          return "%o";
        })) : "%s"), this.name, t].concat(s));
        try {
          var a = r.apply(this, s);
        } catch (f) {
          throw this.logError.apply(this, ["".concat(f.code !== void 0 ? "Error Code ".concat(f.code, ": ") : "", "%s failed").concat(0 < s.length ? " with args: ".concat(s.map(function() {
            return "%o";
          })) : ""), t].concat(s)), f.originalError && this.logError(f.originalError), this.errorTracker(f), f;
        }
        var l = Date.now();
        return ma(N.mark(function f() {
          var h, d;
          return N.wrap(function(p) {
            for (; ; )
              switch (p.prev = p.next) {
                case 0:
                  return p.prev = 0, p.next = 3, a;
                case 3:
                  h = p.sent, p.next = 12;
                  break;
                case 6:
                  return p.prev = 6, p.t0 = p.catch(0), o.logError.apply(o, ["".concat(p.t0.code !== void 0 ? "Error Code ".concat(p.t0.code, ": ") : "", "%s failed").concat(0 < s.length ? " with args: ".concat(s.map(function() {
                    return "%o";
                  })) : ""), t].concat(s)), p.t0.originalError && o.logError(p.t0.originalError), o.errorTracker(p.t0), p.abrupt("return");
                case 12:
                  h !== a ? h === void 0 ? o.resultTracker("%s promise resolves after %dms", t, Date.now() - l) : o.resultTracker("%s promise resolves after %dms, result is %o", t, Date.now() - l, h) : $c(h) !== "Object" || De(h) ? o.resultTracker("%s result is %o", t, h) : o.resultTracker("%s result is %s", t, h.name || ((d = h.constructor) === null || d === void 0 ? void 0 : d.name));
                case 13:
                case "end":
                  return p.stop();
              }
          }, f, null, [[0, 6]]);
        }))(), a;
      }, n;
    }
    function bb(e, t, n) {
      return tj.apply(this, arguments);
    }
    function tj() {
      return (tj = ma(N.mark(function e(t, n, r) {
        var o, i, s, u = arguments;
        return N.wrap(function(a) {
          for (; ; )
            switch (a.prev = a.next) {
              case 0:
                return o = 3 < u.length && u[3] !== void 0 && u[3], i = Iv[t].encode(n).finish(), s = function() {
                  var l = ma(N.mark(function f(h) {
                    var d, p, v, y = arguments;
                    return N.wrap(function(g) {
                      for (; ; )
                        switch (g.prev = g.next) {
                          case 0:
                            if (!(3 < (p = 1 < y.length && y[1] !== void 0 ? y[1] : 0))) {
                              g.next = 3;
                              break;
                            }
                            return g.abrupt("return");
                          case 3:
                            if (v = Xe(v = r ? "https://".concat((d = fa == null ? void 0 : fa.PROXY_NGINX[0]) !== null && d !== void 0 ? d : "webrtc-cloud-proxy.sd-rtn.com", "/rs/?h=").concat(h, "&p=443&d=events/proto-raw") : "https://".concat(h, "/events/proto-raw"), "sentTs", Math.ceil(Date.now() / 1e3).toString()), v = Xe(v, "id", Jv[t].toString()), !o) {
                              g.next = 9;
                              break;
                            }
                            return g.next = 9, Kv(1e4);
                          case 9:
                            return g.next = 11, lh(v, { body: i, timeout: 2e4, headers: { "Content-Type": "application/octet-stream" } }).catch(function(m) {
                              return s(h, p + 1);
                            });
                          case 11:
                          case "end":
                            return g.stop();
                        }
                    }, f);
                  }));
                  return function(f) {
                    return l.apply(this, arguments);
                  };
                }(), a.prev = 3, a.next = 6, s((fa == null ? void 0 : fa.EVENT_REPORT_DOMAIN[0]) || $f(null) && null || "webcollector-rtm.agora.io");
              case 6:
                a.next = 12;
                break;
              case 8:
                return a.prev = 8, a.t0 = a.catch(3), a.next = 12, s(fa && On(1 < (fa == null ? void 0 : fa.EVENT_REPORT_DOMAIN.length) ? fa == null ? void 0 : fa.EVENT_REPORT_DOMAIN.slice(1) : fa == null ? void 0 : fa.EVENT_REPORT_DOMAIN) || "rtm.statscollector.sd-rtn.com");
              case 12:
              case "end":
                return a.stop();
            }
        }, e, null, [[3, 8]]);
      }))).apply(this, arguments);
    }
    function Xa(e) {
      return e === void 0 ? P.fromNumber(0) : P.fromNumber(Date.now() - e);
    }
    function Ta(e) {
      return typeof e == "string" && /^[\s\w!#$%&()+,.:;<=>?@[\]^{|}~-]{1,64}$/.test(e) && e !== "null";
    }
    function Pn(e) {
      try {
        var t = e.split(".").map(function(r) {
          return Number(r);
        });
      } catch (r) {
        return !1;
      }
      if (t.length !== 4 || t[0] === 0)
        return !1;
      for (e = 0; e < t.length; e++) {
        var n = t[e];
        if (!Number.isInteger(n) || 0 > n || 255 < n)
          return !1;
      }
      return !0;
    }
    function Qn(e, t) {
      if (!Array.isArray(t) || t.length === 0 || 32 < t.length || t.some(function(n) {
        return n.length === 0 || 32 < n.length;
      }))
        throw new ca("arguments is not valid", gb);
      if (!Ta(e))
        throw new ca("ID is invalid", gb);
    }
    function ag(e) {
      var t = e.attributes, n = e.attrSizeMap, r = e.maxAttrsCount, o = e.maxAttrValueSize;
      if (e = e.maxTotalSize, !De(t))
        throw new ca("attributes must be an object", gb);
      if (Object.keys(t).length > r)
        throw new ic("Exceed the limit of ".concat(r, " attributes"), Ye);
      if (Object.keys(t).length === 0)
        throw new ca("The attributes is an empty object", gb);
      var i = 0, s = 0;
      for (t = Object.entries(t); s < t.length; s++) {
        var u = $a(t[s], 2), a = u[1];
        u = new Blob([u[0]]).size;
        var l = new Blob([a]).size;
        if (u === 0 || 32 < u)
          throw new ca("Invalid attribute key", gb);
        if (l > o)
          throw new ic("Invalid attribute value, over the limit of ".concat(o, " bytes"), Ye);
        if (typeof a != "string" || a.length === 0)
          throw new ca("Invalid attribute value", gb);
        i += u, i += l;
      }
      if (i > e)
        throw new ic("The attributes size overflow", Ye);
      if (n !== void 0) {
        if (Object.keys(n).length > r)
          throw new ic("Exceed the limit of ".concat(r, " attributes"), Ye);
        for (i = r = 0, n = Object.entries(n); i < n.length; i++) {
          if (s = (t = $a(n[i], 2))[1], (t = new Blob([t[0]]).size) === 0)
            throw new ca("Invalid attribute key", gb);
          if (s > o)
            throw new ic("Invalid attribute value, over the limit of ".concat(o, " bytes"), Ye);
          r += t, r += s;
        }
        if (r > e)
          throw new ic("The attributes size overflow", Ye);
      }
    }
    function mh(e, t) {
      return Math.floor(Math.random() * (Math.floor(t) - Math.ceil(e) + 1)) + e;
    }
    function nh() {
      var e = mh(0, 4294967295), t = mh(1, 4294967295);
      return new P(e, t, !0);
    }
    function sb(e) {
      return e.toString().padEnd(32, "0");
    }
    function Rn(e, t) {
      return new TypeError("Unexpected ".concat(e, ": ").concat(t));
    }
    function Sn(e, t) {
      return e = e.split(".").map(function(n) {
        return Number(n);
      }), t = t.split(".").map(function(n) {
        return Number(n);
      }), Math.sqrt(1e3 * Math.pow(e[0] - t[0], 2) + 100 * Math.pow(e[1] - t[1], 2) + 10 * Math.pow(e[2] - t[2], 2) + 1 * Math.pow(e[3] - t[3], 2));
    }
    function Tn(e) {
      return e.lessThanOrEqual(Number.MAX_SAFE_INTEGER) ? e.toNumber() : e.toString();
    }
    function uj(e, t) {
      t = "".concat(e).concat(t || "");
      var n = Un.get(t) || 1;
      return Un.set(t, n + 1), "".concat(e).concat(n);
    }
    function Vn(e, t) {
      var n = typeof t == "number" ? t : t !== void 0 && typeof t != "string" ? t.code : void 0;
      return t = typeof t != "number" && typeof t != "string" && t !== void 0 && t.serverCode !== void 0 ? t.serverCode : void 0, n = "".concat(n !== void 0 ? " Error Code ".concat(n) : "").concat(t !== void 0 ? ", server Code ".concat(t) : ""), e = typeof e == "string" && e ? oh(e) : Array.isArray(e) && typeof e[0] == "string" && e[0] ? oh(Wn.apply(void 0, [e[0]].concat(Z(e.slice(1))))) : "", "".concat(n === "" ? "" : "".concat(n, " - ")).concat(e);
    }
    function Kv(e, t) {
      return vj.apply(this, arguments);
    }
    function vj() {
      return (vj = ma(N.mark(function e(t, n) {
        return N.wrap(function(r) {
          for (; ; )
            switch (r.prev = r.next) {
              case 0:
                if (!n || !n.aborted) {
                  r.next = 2;
                  break;
                }
                return r.abrupt("return");
              case 2:
                return r.abrupt("return", new Promise(function(o) {
                  setTimeout(o, t), n == null || n.addEventListener("abort", o);
                }));
              case 3:
              case "end":
                return r.stop();
            }
        }, e);
      }))).apply(this, arguments);
    }
    function lh(e, t, n) {
      return wj.apply(this, arguments);
    }
    function wj() {
      return (wj = ma(N.mark(function e(t, n, r) {
        var o, i, s, u, a, l, f, h, d, p, v, y, g, m, E, w, C, q, J, B, Y, _e, k, L, T, U;
        return N.wrap(function(O) {
          for (; ; )
            switch (O.prev = O.next) {
              case 0:
                if (o = n.body, i = n.headers, s = i === void 0 ? {} : i, u = n.timeout, a = u === void 0 ? 1e4 : u, l = n.signal, f = n.withCredentials, h = f !== void 0 && f, d = (r || {}).useBinaryResponse, p = d !== void 0 && d, (v = new XMLHttpRequest()).open("POST", t, !0), v.responseType = p ? "arraybuffer" : "text", v.withCredentials = h, v.timeout = a, y = o instanceof FormData, g = o instanceof Uint8Array, !(1 < (m = Object.keys(s).filter(function(_) {
                  return _.toLowerCase() === "content-type";
                })).length)) {
                  O.next = 14;
                  break;
                }
                throw new RangeError("multiple content-type");
              case 14:
                m.length === 0 && (g ? s["Content-Type"] = "application/octet-stream" : y || (s["Content-Type"] = "application/json"));
              case 15:
                if ("setRequestHeader" in v) {
                  O.next = 46;
                  break;
                }
                return v.abort(), O.next = 19, fetch(t, { body: y || g ? o : JSON.stringify(o), cache: "no-cache", credentials: h ? "include" : "same-origin", headers: s, method: "POST", mode: "cors", referrer: "no-referrer", signal: l });
              case 19:
                if (E = O.sent, !(200 <= (w = E.status) && 300 > w || w === 304)) {
                  O.next = 31;
                  break;
                }
                if (!p) {
                  O.next = 27;
                  break;
                }
                return O.next = 25, E.arrayBuffer();
              case 25:
                return C = O.sent, O.abrupt("return", { status: w, responseData: C });
              case 27:
                return O.next = 29, E.text();
              case 29:
                return q = O.sent, O.abrupt("return", { status: w, responseText: q });
              case 31:
                return J = new Ja(["Post XHR failure, status %d", w]), O.prev = 32, O.next = 35, E.text();
              case 35:
                throw B = O.sent, J.statusCode = w, J.message = B || "Request failed, status ".concat(w), J;
              case 41:
                throw O.prev = 41, O.t0 = O.catch(32), J.statusCode = w, J.message = "Request failed, status ".concat(w), J;
              case 46:
                if (Object.keys(s).length !== 0)
                  for (Y = 0, _e = Object.entries(s); Y < _e.length; Y++)
                    k = $a(_e[Y], 2), L = k[0], T = k[1], v.setRequestHeader(L, T);
                return l !== void 0 && (U = function _() {
                  v.abort(), l.removeEventListener("abort", _);
                }, l.addEventListener("abort", U)), y || g ? v.send(o) : v.send(JSON.stringify(o)), O.abrupt("return", new Promise(function(_, A) {
                  v.onload = function() {
                    var j = v.status;
                    if (200 <= j && 300 > j || j === 304)
                      _(p ? { status: j, responseData: v.response } : { status: j, responseText: v.responseText });
                    else {
                      var F = new Ja(["Post XHR failure, status %d", j]);
                      F.statusCode = j, F.message = v.response || "Request failed, status ".concat(v.status), A(F);
                    }
                  }, v.ontimeout = function(j) {
                    A(new Ub(["XHR request timed out after %d ms", a], { originalError: j }));
                  }, v.onerror = function() {
                    var j = new Ja(["Post XHR failure, status %d", v.status]);
                    j.statusCode = v.status, j.message = v.response || "Request failed, status ".concat(v.status), A(j);
                  }, v.onabort = function() {
                    try {
                      A(new DOMException("The request aborted.", "AbortError"));
                    } catch (F) {
                      var j = Error("The request aborted.");
                      j.name = "AbortError", A(j);
                    }
                  };
                }));
              case 50:
              case "end":
                return O.stop();
            }
        }, e, null, [[32, 41]]);
      }))).apply(this, arguments);
    }
    function Xn(e, t) {
      if (!De(e))
        throw new ca("message object is not a plain object", t);
      if (e.messageType === void 0)
        if (e.rawMessage instanceof Uint8Array) {
          if (e.messageType = "RAW", e.text !== void 0)
            throw new ca("Raw messages cannot have text property. Use description instead", t);
        } else {
          if (typeof e.text != "string")
            throw new ca("messageType is undefined", t);
          if (e.messageType = "TEXT", e.rawMessage !== void 0)
            throw new ca("Text messages cannot have rawMessage property", t);
        }
    }
    function ph(e) {
      return xj.apply(this, arguments);
    }
    function xj() {
      return (xj = ma(N.mark(function e(t) {
        var n, r, o, i, s, u, a, l, f, h, d, p, v, y, g, m, E, w, C, q, J;
        return N.wrap(function(B) {
          for (; ; )
            switch (B.prev = B.next) {
              case 0:
                if (n = t.message, r = t.peerId, o = t.toPeer, i = t.session, s = t.errorCodes, u = t.diff, a = t.logger, i !== void 0) {
                  B.next = 3;
                  break;
                }
                throw new da("The client is not logged in. Cannot do the operation", s.NOT_LOGGED_IN);
              case 3:
                if (l = !1, f = o ? n.messageType === "TEXT" ? Ka.P2pSMsgNoOfflineFlag : Ka.P2pRMsgNoOfflineFlag : n.messageType === "TEXT" ? Ka.ChannelSMsg : Ka.ChannelRMsg, n.messageType !== "TEXT" || !n.text.startsWith("AgoraRTMLegacyEndcallCompatibleMessagePrefix") || !o) {
                  B.next = 14;
                  break;
                }
                if (h = n.text.split("_"), d = $a(h, 3), p = d[0], v = d[1], d[2] !== void 0 && Ta(v) && p === "AgoraRTMLegacyEndcallCompatibleMessagePrefix") {
                  B.next = 13;
                  break;
                }
                throw i.emit("messageCount", { messageCategory: f, type: "common", key: "sentcount" }), i.emit("messageCount", { messageCategory: f, type: "common", key: "invalidmessagecount" }), new ca("Message is not valid", bg);
              case 13:
                l = !0;
              case 14:
                if (y = Date.now(), g = i.messageSentTimes.length - 1, !((m = i.messageSentTimes[g]) && m + 3e3 < y)) {
                  B.next = 21;
                  break;
                }
                i.messageSentTimes = [y], B.next = 34;
                break;
              case 21:
                E = g;
              case 22:
                if (!(0 <= E)) {
                  B.next = 33;
                  break;
                }
                if (!(i.messageSentTimes[E] + 3e3 < y)) {
                  B.next = 26;
                  break;
                }
                return i.messageSentTimes = i.messageSentTimes.slice(E + 1, g + 1), B.abrupt("break", 33);
              case 26:
                if (!(180 <= g - E + 1)) {
                  B.next = 30;
                  break;
                }
                throw i.emit("messageCount", { messageCategory: f, type: "common", key: "sentcount" }), i.emit("messageCount", { messageCategory: f, type: "common", key: "toooftencount" }), new ic("Message sent failed, exceeded the 180 message in 3 seconds", s.TOO_OFTEN);
              case 30:
                E--, B.next = 22;
                break;
              case 33:
                i.messageSentTimes.push(y);
              case 34:
                B.t0 = n.messageType, B.next = B.t0 === "TEXT" ? 37 : B.t0 === "RAW" ? 42 : 44;
                break;
              case 37:
                if (!l) {
                  B.next = 41;
                  break;
                }
                return w = n.text.split("_"), C = $a(w, 3), q = C[1], J = C[2], a.info("[rtm-API] EndCall message send api is called"), B.abrupt("return", i.sendInvitationMessage({ peerId: r, type: "CallCancel", extra: J, channelId: q, callId: "0" }));
              case 41:
                return B.abrupt("return", i.sendTextMessage(n.text, r, o, 1e4 - u));
              case 42:
                return n.description === void 0 && (n.description = ""), B.abrupt("return", i.sendRawMessage(n.rawMessage, n.description, r, o, 1e4 - u));
              case 44:
                throw i.emit("messageCount", { messageCategory: f, type: "common", key: "sentcount" }), i.emit("messageCount", { messageCategory: f, type: "common", key: "invalidmessagecount" }), new ca("Invalid message type", bg);
              case 47:
              case "end":
                return B.stop();
            }
        }, e);
      }))).apply(this, arguments);
    }
    function Lv(e) {
      var t = !(1 < arguments.length && arguments[1] !== void 0) || arguments[1], n = e.replace(/(https?:\/\/)?(www.)?/i, "");
      return t || (n = n.split(".").slice(e.length - 2).join(".")), n.indexOf("/") !== -1 ? n.split("/")[0] : n;
    }
    function La(e) {
      if (typeof e != "string")
        return "[Sensitive Info]";
      var t = Math.floor(0.7 * e.length), n = e.length;
      return Yn(e, t, n, "*".repeat(n - t));
    }
    function Zn(e, t, n) {
      function r(o) {
        if (e === void 0)
          return e;
        if (Mm(o))
          return o;
        if (Array.isArray(o))
          return o.map(r);
        var i = {}, s = 0;
        for (o = qh(o); s < o.length; s++) {
          var u = $a(o[s], 2), a = u[0];
          if (typeof (u = u[1]) == "string" && n.includes(a)) {
            i[a] = typeof u == "string" ? La(u) : "[Sensitive Info]";
            break;
          }
          t.includes(a) ? i[a] = "[Hidden Info]" : i[a] = u == null ? u : n.includes(a) ? "[Sensitive Info]" : r(u);
        }
        return i;
      }
      return Array.isArray(e) ? e.map(r) : r(e);
    }
    function $n(e) {
      return Object.getOwnPropertyNames(e).forEach(function(t) {
        qa(t = e[t]) == "object" && t !== null && $n(t);
      }), Object.freeze(e);
    }
    function cg(e) {
      return new TextDecoder("utf-8").decode(e.buffer.slice(e.byteOffset, e.byteOffset + e.byteLength));
    }
    function rh(e) {
      return new TextEncoder().encode(e).length;
    }
    function ao() {
      for (var e = 0, t = arguments.length, n = Array(t), r = 0; r < t; r++)
        n[r] = arguments[r];
      for (t = 0; t < n.length; t++)
        e += n[t].length;
      for (e = new Uint8Array(e), r = t = 0; r < n.length; r++) {
        var o = n[r];
        e.set(o, t), t += o.length;
      }
      return e;
    }
    function Xe(e, t, n) {
      var r = e.match(/([^?#]+)(\?[^#]*)?(#.*)?/);
      if (e = r == null ? void 0 : r[1], r = r == null ? void 0 : r[2]) {
        var o;
        for (r = r.substr(1).split("&"), o = 0; o < r.length; o++)
          if (r[o].split("=")[0] == t) {
            r[o] = t + "=" + encodeURIComponent(n);
            break;
          }
        return o == r.length && r.push(t + "=" + encodeURIComponent(n)), e + "?" + r.join("&");
      }
      return e + "?" + t + "=" + encodeURIComponent(n);
    }
    function Yn(e, t, n, r) {
      return typeof e != "string" ? "[Sensitive Info]" : e.substring(0, t) + r + e.substring(n);
    }
    function $f(e) {
      return typeof e == "string" && e.length !== 0 && e !== "false" && e !== "null" && e !== "undefined";
    }
    function Mv(e, t) {
      var n = "".concat(e, "Uri");
      if (typeof (n = yj[n]) != "number" || n === 0)
        throw new TypeError("Got Unknown URI Name");
      return t = new (e = bo[e])(t), t = e.encode(t).finish(), new Nv({ uri: n, data: t });
    }
    function co(e, t) {
      var n = $f(null);
      return "".concat(e.split(".").join("-"), ".edge.").concat(n ? null : t ? "sd-rtn.com" : "agora.io");
    }
    function sh(e, t) {
      return P.fromValue(e).eq(t);
    }
    function th(e, t) {
      var n = t === void 0 ? e.val : t, r = e.isBoolean;
      t = e.isNumber;
      var o = e.oneof, i = e.len;
      if ([r, t, o].filter(function(s) {
        return !s;
      }).length !== 2)
        throw new TypeError("invalid field type");
      if (n !== void 0 && (e = !1, o !== void 0 && (o = zj(o), Ov(o, sh).length === o.length && Pv(o, function(s) {
        return sh(n, s);
      }) !== void 0 && (e = !0)), r = r !== void 0 && (n === 0 || n === 1) && i === 1, t = t !== void 0 && n.toString(2).length <= i, !(e || r || t)))
        throw Error("invalid field value");
    }
    function eo(e) {
      return e.reduce(function(t, n) {
        return t.concat(n instanceof uh.UnsubscriptionError ? n.errors : n);
      }, []);
    }
    function Qv(e, t) {
      do
        dg == 2147483647 ? dg = 0 : dg++;
      while (Ze.hasOwnProperty(dg));
      var n = dg;
      return Ze[n] = { callback: e, parameters: Array.prototype.slice.call(arguments, 2) }, Aj.postMessage({ name: "setInterval", fakeId: n, time: t }), n;
    }
    function fo(e) {
      return function() {
        var t = e();
        if (!t)
          throw new da("Client is not logged in. Cannot do the operation");
        return t;
      };
    }
    var Ya = typeof globalThis != "undefined" ? globalThis : typeof window != "undefined" ? window : typeof commonjsGlobal != "undefined" ? commonjsGlobal : typeof self != "undefined" ? self : {}, vh = function(e) {
      return e && e.Math == Math && e;
    }, R = vh(typeof globalThis == "object" && globalThis) || vh(typeof window == "object" && window) || vh(typeof self == "object" && self) || vh(typeof Ya == "object" && Ya) || function() {
      return this;
    }() || Function("return this")(), la = function(e) {
      try {
        return !!e();
      } catch (t) {
        return !0;
      }
    }, wa = !la(function() {
      return Object.defineProperty({}, 1, { get: function() {
        return 7;
      } })[1] != 7;
    }), go = {}.propertyIsEnumerable, ho = Object.getOwnPropertyDescriptor, eg = ho && !go.call({ 1: 2 }, 1) ? function(e) {
      return !!(e = ho(this, e)) && e.enumerable;
    } : go, Nc = function(e, t) {
      return { enumerable: !(1 & e), configurable: !(2 & e), writable: !(4 & e), value: t };
    }, Rv = {}.toString, xc = function(e) {
      return Rv.call(e).slice(8, -1);
    }, Sv = "".split, fg = la(function() {
      return !Object("z").propertyIsEnumerable(0);
    }) ? function(e) {
      return xc(e) == "String" ? Sv.call(e, "") : Object(e);
    } : Object, Eb = function(e) {
      if (e == null)
        throw TypeError("Can't call method on " + e);
      return e;
    }, Mb = function(e) {
      return fg(Eb(e));
    }, xa = function(e) {
      return typeof e == "object" ? e !== null : typeof e == "function";
    }, Oc = function(e, t) {
      if (!xa(e))
        return e;
      var n, r;
      if (t && typeof (n = e.toString) == "function" && !xa(r = n.call(e)) || typeof (n = e.valueOf) == "function" && !xa(r = n.call(e)) || !t && typeof (n = e.toString) == "function" && !xa(r = n.call(e)))
        return r;
      throw TypeError("Can't convert object to primitive value");
    }, pb = function(e) {
      return Object(Eb(e));
    }, Tv = {}.hasOwnProperty, ka = function(e, t) {
      return Tv.call(pb(e), t);
    }, $e = R.document, wh = xa($e) && xa($e.createElement), io = !wa && !la(function() {
      return Object.defineProperty(wh ? $e.createElement("div") : {}, "a", { get: function() {
        return 7;
      } }).a != 7;
    }), jo = Object.getOwnPropertyDescriptor, dc = { f: wa ? jo : function(e, t) {
      if (e = Mb(e), t = Oc(t, !0), io)
        try {
          return jo(e, t);
        } catch (n) {
        }
      if (ka(e, t))
        return Nc(!eg.call(e, t), e[t]);
    } }, Ia = function(e) {
      if (!xa(e))
        throw TypeError(String(e) + " is not an object");
      return e;
    }, ko = Object.defineProperty, qb = { f: wa ? ko : function(e, t, n) {
      if (Ia(e), t = Oc(t, !0), Ia(n), io)
        try {
          return ko(e, t, n);
        } catch (r) {
        }
      if ("get" in n || "set" in n)
        throw TypeError("Accessors not supported");
      return "value" in n && (e[t] = n.value), e;
    } }, kb = wa ? function(e, t, n) {
      return qb.f(e, t, Nc(1, n));
    } : function(e, t, n) {
      return e[t] = n, e;
    }, Bj = function(e, t) {
      try {
        kb(R, e, t);
      } catch (n) {
        R[e] = t;
      }
      return t;
    }, zd = R["__core-js_shared__"] || Bj("__core-js_shared__", {}), Uv = Function.toString;
    typeof zd.inspectSource != "function" && (zd.inspectSource = function(e) {
      return Uv.call(e);
    });
    var Cj = zd.inspectSource, lo = R.WeakMap, Vv = typeof lo == "function" && /native code/.test(Cj(lo)), Ad = xb(function(e) {
      (e.exports = function(t, n) {
        return zd[t] || (zd[t] = n !== void 0 ? n : {});
      })("versions", []).push({ version: "3.12.1", mode: "global", copyright: "© 2021 Denis Pushkarev (zloirock.ru)" });
    }), Wv = 0, Xv = Math.random(), af = function(e) {
      return "Symbol(" + String(e === void 0 ? "" : e) + ")_" + (++Wv + Xv).toString(36);
    }, mo = Ad("keys"), xh = function(e) {
      return mo[e] || (mo[e] = af(e));
    }, bf = {}, Yv = R.WeakMap;
    if (Vv || zd.state)
      var ce = zd.state || (zd.state = new Yv()), Zv = ce.get, no = ce.has, $v = ce.set, Dj = function(e, t) {
        if (no.call(ce, e))
          throw new TypeError("Object already initialized");
        return t.facade = e, $v.call(ce, e, t), t;
      }, yh = function(e) {
        return Zv.call(ce, e) || {};
      }, Ej = function(e) {
        return no.call(ce, e);
      };
    else {
      var cf = xh("state");
      bf[cf] = !0, Dj = function(e, t) {
        if (ka(e, cf))
          throw new TypeError("Object already initialized");
        return t.facade = e, kb(e, cf, t), t;
      }, yh = function(e) {
        return ka(e, cf) ? e[cf] : {};
      }, Ej = function(e) {
        return ka(e, cf);
      };
    }
    var cb = { set: Dj, get: yh, has: Ej, enforce: function(e) {
      return Ej(e) ? yh(e) : Dj(e, {});
    }, getterFor: function(e) {
      return function(t) {
        var n;
        if (!xa(t) || (n = yh(t)).type !== e)
          throw TypeError("Incompatible receiver, " + e + " required");
        return n;
      };
    } }, Za = xb(function(e) {
      var t = cb.get, n = cb.enforce, r = String(String).split("String");
      (e.exports = function(o, i, s, u) {
        var a = !!u && !!u.unsafe, l = !!u && !!u.enumerable;
        if (u = !!u && !!u.noTargetGet, typeof s == "function") {
          typeof i != "string" || ka(s, "name") || kb(s, "name", i);
          var f = n(s);
          f.source || (f.source = r.join(typeof i == "string" ? i : ""));
        }
        o === R ? l ? o[i] = s : Bj(i, s) : (a ? !u && o[i] && (l = !0) : delete o[i], l ? o[i] = s : kb(o, i, s));
      })(Function.prototype, "toString", function() {
        return typeof this == "function" && t(this).source || Cj(this);
      });
    }), oo = function(e) {
      return typeof e == "function" ? e : void 0;
    }, Pc = function(e, t) {
      return 2 > arguments.length ? oo(R[e]) || oo(R[e]) : R[e] && R[e][t] || R[e] && R[e][t];
    }, aw = Math.ceil, bw = Math.floor, yc = function(e) {
      return isNaN(e = +e) ? 0 : (0 < e ? bw : aw)(e);
    }, cw = Math.min, Ma = function(e) {
      return 0 < e ? cw(yc(e), 9007199254740991) : 0;
    }, dw = Math.max, ew = Math.min, Vb = function(e, t) {
      return 0 > (e = yc(e)) ? dw(e + t, 0) : ew(e, t);
    }, po = function(e) {
      return function(t, n, r) {
        t = Mb(t);
        var o = Ma(t.length);
        if (r = Vb(r, o), e && n != n) {
          for (; o > r; )
            if ((n = t[r++]) != n)
              return !0;
        } else
          for (; o > r; r++)
            if ((e || r in t) && t[r] === n)
              return e || r || 0;
        return !e && -1;
      };
    }, qo = po(!0), Fj = po(!1), ro = function(e, t) {
      e = Mb(e);
      var n, r = 0, o = [];
      for (n in e)
        !ka(bf, n) && ka(e, n) && o.push(n);
      for (; t.length > r; )
        ka(e, n = t[r++]) && (~Fj(o, n) || o.push(n));
      return o;
    }, zh = "constructor hasOwnProperty isPrototypeOf propertyIsEnumerable toLocaleString toString valueOf".split(" "), fw = zh.concat("length", "prototype"), de = { f: Object.getOwnPropertyNames || function(e) {
      return ro(e, fw);
    } }, gg = { f: Object.getOwnPropertySymbols }, so = Pc("Reflect", "ownKeys") || function(e) {
      var t = de.f(Ia(e)), n = gg.f;
      return n ? t.concat(n(e)) : t;
    }, to = function(e, t) {
      for (var n = so(t), r = qb.f, o = dc.f, i = 0; i < n.length; i++) {
        var s = n[i];
        ka(e, s) || r(e, s, o(t, s));
      }
    }, gw = /#|\.prototype\./, Qc = function(e, t) {
      return (e = hw[iw(e)]) == jw || e != kw && (typeof t == "function" ? la(t) : !!t);
    }, iw = Qc.normalize = function(e) {
      return String(e).replace(gw, ".").toLowerCase();
    }, hw = Qc.data = {}, kw = Qc.NATIVE = "N", jw = Qc.POLYFILL = "P", lw = dc.f, ea = function(e, t) {
      var n, r, o, i = e.target, s = e.global, u = e.stat;
      if (r = s ? R : u ? R[i] || Bj(i, {}) : (R[i] || {}).prototype)
        for (o in t) {
          var a = t[o], l = e.noTargetGet ? (n = lw(r, o)) && n.value : r[o];
          if (!(n = Qc(s ? o : i + (u ? "." : "#") + o, e.forced)) && l !== void 0) {
            if (typeof a == typeof l)
              continue;
            to(a, l);
          }
          (e.sham || l && l.sham) && kb(a, "sham", !0);
          try {
            Za(r, o, a, e);
          } catch (f) {
          }
        }
    }, Gj = function() {
      var e = Ia(this), t = "";
      return e.global && (t += "g"), e.ignoreCase && (t += "i"), e.multiline && (t += "m"), e.dotAll && (t += "s"), e.unicode && (t += "u"), e.sticky && (t += "y"), t;
    }, Rc = la(function() {
      var e = /a/y;
      return e.lastIndex = 2, e.exec("abcd") != null;
    }), mw = la(function() {
      var e = /^r/gy;
      return e.lastIndex = 2, e.exec("str") != null;
    }), Ah = RegExp.prototype.exec, nw = Ad("native-string-replace", String.prototype.replace), uo = Ah, Hj = (c = /a/, b = /b*/g, Ah.call(c, "a"), Ah.call(b, "a"), c.lastIndex !== 0 || b.lastIndex !== 0), vo = Rc || mw, Ij = /()??/.exec("")[1] !== void 0, c, b;
    (Hj || Ij || vo) && (uo = function(e) {
      var t, n = vo && this.sticky, r = Gj.call(this), o = this.source, i = 0, s = e;
      if (n) {
        (r = r.replace("y", "")).indexOf("g") === -1 && (r += "g"), s = String(e).slice(this.lastIndex), 0 < this.lastIndex && (!this.multiline || this.multiline && e[this.lastIndex - 1] !== `
`) && (o = "(?: " + o + ")", s = " " + s, i++);
        var u = new RegExp("^(?:" + o + ")", r);
      }
      if (Ij && (u = new RegExp("^" + o + "$(?!\\s)", r)), Hj)
        var a = this.lastIndex;
      var l = Ah.call(n ? u : this, s);
      return n ? l ? (l.input = l.input.slice(i), l[0] = l[0].slice(i), l.index = this.lastIndex, this.lastIndex += l[0].length) : this.lastIndex = 0 : Hj && l && (this.lastIndex = this.global ? l.index + l[0].length : a), Ij && l && 1 < l.length && nw.call(l[0], u, function() {
        for (t = 1; t < arguments.length - 2; t++)
          arguments[t] === void 0 && (l[t] = void 0);
      }), l;
    });
    var hg = uo;
    ea({ target: "RegExp", proto: !0, forced: /./.exec !== hg }, { exec: hg });
    var df = Pc("navigator", "userAgent") || "", wo = R.process, xo = wo && wo.versions, yo = xo && xo.v8;
    if (yo)
      var Bd = yo.split("."), Jj = 4 > Bd[0] ? 1 : Bd[0] + Bd[1];
    else
      df && (Bd = df.match(/Edge\/(\d+)/), (!Bd || 74 <= Bd[1]) && (Bd = df.match(/Chrome\/(\d+)/)) && (Jj = Bd[1]));
    var Cd = Jj && +Jj, Sc = !!Object.getOwnPropertySymbols && !la(function() {
      return !String(Symbol()) || !Symbol.sham && Cd && 41 > Cd;
    }), zo = Sc && !Symbol.sham && typeof Symbol.iterator == "symbol", ig = Ad("wks"), jg = R.Symbol, ow = zo ? jg : jg && jg.withoutSetter || af, Fa = function(e) {
      return ka(ig, e) && (Sc || typeof ig[e] == "string") || (Sc && ka(jg, e) ? ig[e] = jg[e] : ig[e] = ow("Symbol." + e)), ig[e];
    }, pw = Fa("species"), Kj = RegExp.prototype, qw = !la(function() {
      var e = /./;
      return e.exec = function() {
        var t = [];
        return t.groups = { a: "7" }, t;
      }, "".replace(e, "$<a>") !== "7";
    }), Ao = "a".replace(/./, "$0") === "$0", Bo = Fa("replace"), Co = !!/./[Bo] && /./[Bo]("a", "$0") === "", rw = !la(function() {
      var e = /(?:)/, t = e.exec;
      return e.exec = function() {
        return t.apply(this, arguments);
      }, (e = "ab".split(e)).length !== 2 || e[0] !== "a" || e[1] !== "b";
    }), Bh = function(e, t, n, r) {
      var o = Fa(e), i = !la(function() {
        var l = {};
        return l[o] = function() {
          return 7;
        }, ""[e](l) != 7;
      }), s = i && !la(function() {
        var l = !1, f = /a/;
        return e === "split" && ((f = { constructor: {} }).constructor[pw] = function() {
          return f;
        }, f.flags = "", f[o] = /./[o]), f.exec = function() {
          return l = !0, null;
        }, f[o](""), !l;
      });
      if (!i || !s || e === "replace" && (!qw || !Ao || Co) || e === "split" && !rw) {
        var u = /./[o], a = (n = n(o, ""[e], function(l, f, h, d, p) {
          var v = f.exec;
          return v === hg || v === Kj.exec ? i && !p ? { done: !0, value: u.call(f, h, d) } : { done: !0, value: l.call(h, f, d) } : { done: !1 };
        }, { REPLACE_KEEPS_$0: Ao, REGEXP_REPLACE_SUBSTITUTES_UNDEFINED_CAPTURE: Co }))[1];
        Za(String.prototype, e, n[0]), Za(Kj, o, t == 2 ? function(l, f) {
          return a.call(l, this, f);
        } : function(l) {
          return a.call(l, this);
        });
      }
      r && kb(Kj[o], "sham", !0);
    }, sw = Fa("match"), Lj = function(e) {
      var t;
      return xa(e) && ((t = e[sw]) !== void 0 ? !!t : xc(e) == "RegExp");
    }, Wb = function(e) {
      if (typeof e != "function")
        throw TypeError(String(e) + " is not a function");
      return e;
    }, tw = Fa("species"), ee = function(e, t) {
      var n;
      return (e = Ia(e).constructor) === void 0 || (n = Ia(e)[tw]) == null ? t : Wb(n);
    }, Do = function(e) {
      return function(t, n) {
        t = String(Eb(t)), n = yc(n);
        var r, o = t.length;
        if (0 > n || n >= o)
          return e ? "" : void 0;
        var i = t.charCodeAt(n);
        return 55296 > i || 56319 < i || n + 1 === o || 56320 > (r = t.charCodeAt(n + 1)) || 57343 < r ? e ? t.charAt(n) : i : e ? t.slice(n, n + 2) : r - 56320 + (i - 55296 << 10) + 65536;
      };
    }, uw = Do(!1), Eo = Do(!0), Mj = function(e, t, n) {
      return t + (n ? Eo(e, t).length : 1);
    }, ef = function(e, t) {
      var n = e.exec;
      if (typeof n == "function") {
        if (typeof (e = n.call(e, t)) != "object")
          throw TypeError("RegExp exec method returned something other than an Object or null");
        return e;
      }
      if (xc(e) !== "RegExp")
        throw TypeError("RegExp#exec called on incompatible receiver");
      return hg.call(e, t);
    }, vw = [].push, ww = Math.min;
    Bh("split", 2, function(e, t, n) {
      var r = "abbc".split(/(b)*/)[1] == "c" || "test".split(/(?:)/, -1).length != 4 || "ab".split(/(?:ab)*/).length != 2 || ".".split(/(.?)(.?)/).length != 4 || 1 < ".".split(/()()/).length || "".split(/.?/).length ? function(o, i) {
        var s = String(Eb(this));
        if ((i = i === void 0 ? 4294967295 : i >>> 0) === 0)
          return [];
        if (o === void 0)
          return [s];
        if (!Lj(o))
          return t.call(s, o, i);
        var u, a, l, f = [], h = 0;
        for (o = new RegExp(o.source, (o.ignoreCase ? "i" : "") + (o.multiline ? "m" : "") + (o.unicode ? "u" : "") + (o.sticky ? "y" : "") + "g"); (u = hg.call(o, s)) && !((a = o.lastIndex) > h && (f.push(s.slice(h, u.index)), 1 < u.length && u.index < s.length && vw.apply(f, u.slice(1)), l = u[0].length, h = a, f.length >= i)); )
          o.lastIndex === u.index && o.lastIndex++;
        return h === s.length ? (l || !o.test("")) && f.push("") : f.push(s.slice(h)), f.length > i ? f.slice(0, i) : f;
      } : "0".split(void 0, 0).length ? function(o, i) {
        return o === void 0 && i === 0 ? [] : t.call(this, o, i);
      } : t;
      return [function(o, i) {
        var s = Eb(this), u = o == null ? void 0 : o[e];
        return u !== void 0 ? u.call(o, s, i) : r.call(String(s), o, i);
      }, function(o, i) {
        var s = n(r, o, this, i, r !== t);
        if (s.done)
          return s.value;
        var u = Ia(o);
        o = String(this);
        var a = ee(u, RegExp);
        if (s = u.unicode, u = new a(Rc ? "^(?:" + u.source + ")" : u, (u.ignoreCase ? "i" : "") + (u.multiline ? "m" : "") + (u.unicode ? "u" : "") + (Rc ? "g" : "y")), (i = i === void 0 ? 4294967295 : i >>> 0) === 0)
          return [];
        if (o.length === 0)
          return ef(u, o) === null ? [o] : [];
        var l = 0, f = 0;
        for (a = []; f < o.length; ) {
          u.lastIndex = Rc ? 0 : f;
          var h, d = ef(u, Rc ? o.slice(f) : o);
          if (d === null || (h = ww(Ma(u.lastIndex + (Rc ? f : 0)), o.length)) === l)
            f = Mj(o, f, s);
          else {
            if (a.push(o.slice(l, f)), a.length === i)
              return a;
            for (l = 1; l <= d.length - 1; l++)
              if (a.push(d[l]), a.length === i)
                return a;
            f = l = h;
          }
        }
        return a.push(o.slice(l)), a;
      }];
    }, Rc);
    var xw = /^[\t\n\x0B\f\r \u00a0\u1680\u2000\u2001\u2002\u2003\u2004\u2005\u2006\u2007\u2008\u2009\u200a\u202f\u205f\u3000\u2028\u2029\ufeff][\t\n\x0B\f\r \u00a0\u1680\u2000\u2001\u2002\u2003\u2004\u2005\u2006\u2007\u2008\u2009\u200a\u202f\u205f\u3000\u2028\u2029\ufeff]*/, yw = /[\t\n\x0B\f\r \u00a0\u1680\u2000\u2001\u2002\u2003\u2004\u2005\u2006\u2007\u2008\u2009\u200a\u202f\u205f\u3000\u2028\u2029\ufeff][\t\n\x0B\f\r \u00a0\u1680\u2000\u2001\u2002\u2003\u2004\u2005\u2006\u2007\u2008\u2009\u200a\u202f\u205f\u3000\u2028\u2029\ufeff]*$/, Nj = function(e) {
      return function(t) {
        return t = String(Eb(t)), 1 & e && (t = t.replace(xw, "")), 2 & e && (t = t.replace(yw, "")), t;
      };
    }, Oj = Nj(3), Ch = R.parseInt, zw = /^[+-]?0[Xx]/, Fo = Ch(`	
\v\f\r                　\u2028\u2029\uFEFF08`) !== 8 || Ch(`	
\v\f\r                　\u2028\u2029\uFEFF0x16`) !== 22 ? function(e, t) {
      return e = Oj(String(e)), Ch(e, t >>> 0 || (zw.test(e) ? 16 : 10));
    } : Ch;
    ea({ global: !0, forced: parseInt != Fo }, { parseInt: Fo });
    var Dd = function(e, t, n) {
      if (Wb(e), t === void 0)
        return e;
      switch (n) {
        case 0:
          return function() {
            return e.call(t);
          };
        case 1:
          return function(r) {
            return e.call(t, r);
          };
        case 2:
          return function(r, o) {
            return e.call(t, r, o);
          };
        case 3:
          return function(r, o, i) {
            return e.call(t, r, o, i);
          };
      }
      return function() {
        return e.apply(t, arguments);
      };
    }, Ed = Array.isArray || function(e) {
      return xc(e) == "Array";
    }, Aw = Fa("species"), Dh = function(e, t) {
      if (Ed(e)) {
        var n = e.constructor;
        typeof n != "function" || n !== Array && !Ed(n.prototype) ? xa(n) && (n = n[Aw]) === null && (n = void 0) : n = void 0;
      }
      return new (n === void 0 ? Array : n)(t === 0 ? 0 : t);
    }, Go = [].push, Fd = function(e) {
      var t = e == 1, n = e == 2, r = e == 3, o = e == 4, i = e == 6, s = e == 7, u = e == 5 || i;
      return function(a, l, f, h) {
        var d = pb(a), p = fg(d);
        l = Dd(l, f, 3), f = Ma(p.length);
        var v, y = 0;
        for (h = h || Dh, a = t ? h(a, f) : n || s ? h(a, 0) : void 0; f > y; y++)
          if ((u || y in p) && (v = l(h = p[y], y, d), e))
            if (t)
              a[y] = v;
            else if (v)
              switch (e) {
                case 3:
                  return !0;
                case 5:
                  return h;
                case 6:
                  return y;
                case 2:
                  Go.call(a, h);
              }
            else
              switch (e) {
                case 4:
                  return !1;
                case 7:
                  Go.call(a, h);
              }
        return i ? -1 : r || o ? o : a;
      };
    }, fe = Fd(0), Ho = Fd(1), Io = Fd(2), Bw = Fd(3), Cw = Fd(4), Jo = Fd(5), Dw = Fd(6), Ew = Fa("species"), kg = function(e) {
      return 51 <= Cd || !la(function() {
        var t = [];
        return (t.constructor = {})[Ew] = function() {
          return { foo: 1 };
        }, t[e](Boolean).foo !== 1;
      });
    }, Fw = kg("filter");
    ea({ target: "Array", proto: !0, forced: !Fw }, { filter: function(e) {
      return Io(this, e, 1 < arguments.length ? arguments[1] : void 0);
    } });
    var ed = Object.keys || function(e) {
      return ro(e, zh);
    }, Gw = la(function() {
      ed(1);
    });
    ea({ target: "Object", stat: !0, forced: Gw }, { keys: function(e) {
      return ed(pb(e));
    } });
    var ff = function(e, t) {
      var n = [][e];
      return !!n && la(function() {
        n.call(null, t || function() {
          throw 1;
        }, 1);
      });
    }, Hw = [].join, Iw = fg != Object, Jw = ff("join", ",");
    ea({ target: "Array", proto: !0, forced: Iw || !Jw }, { join: function(e) {
      return Hw.call(Mb(this), e === void 0 ? "," : e);
    } });
    var Kw = kg("map");
    ea({ target: "Array", proto: !0, forced: !Kw }, { map: function(e) {
      return Ho(this, e, 1 < arguments.length ? arguments[1] : void 0);
    } });
    var Pj = function(e) {
      var t = e.return;
      if (t !== void 0)
        return Ia(t.call(e)).value;
    }, gf = {}, Lw = Fa("iterator"), Mw = Array.prototype, Qj = function(e) {
      return e !== void 0 && (gf.Array === e || Mw[Lw] === e);
    }, hf = function(e, t, n) {
      (t = Oc(t)) in e ? qb.f(e, t, Nc(0, n)) : e[t] = n;
    }, Nw = Fa("toStringTag"), Ko = {};
    Ko[Nw] = "z";
    var Rj = String(Ko) === "[object z]", Ow = Fa("toStringTag"), Pw = xc(function() {
      return arguments;
    }()) == "Arguments", jf = Rj ? xc : function(e) {
      var t;
      if (e === void 0)
        var n = "Undefined";
      else {
        if (e === null)
          var r = "Null";
        else {
          t: {
            var o = e = Object(e);
            try {
              r = o[Ow];
              break t;
            } catch (i) {
            }
            r = void 0;
          }
          r = typeof (n = r) == "string" ? n : Pw ? xc(e) : (t = xc(e)) == "Object" && typeof e.callee == "function" ? "Arguments" : t;
        }
        n = r;
      }
      return n;
    }, Qw = Fa("iterator"), lg = function(e) {
      if (e != null)
        return e[Qw] || e["@@iterator"] || gf[jf(e)];
    }, ge = function(e) {
      var t, n = pb(e), r = typeof this == "function" ? this : Array, o = arguments.length, i = 1 < o ? arguments[1] : void 0, s = i !== void 0, u = lg(n), a = 0;
      if (s && (i = Dd(i, 2 < o ? arguments[2] : void 0, 2)), u == null || r == Array && Qj(u)) {
        var l = Ma(n.length);
        for (r = new r(l); l > a; a++)
          u = s ? i(n[a], a) : n[a], hf(r, a, u);
      } else
        for (o = (n = u.call(n)).next, r = new r(); !(t = o.call(n)).done; a++) {
          if (s) {
            u = n;
            var f = i;
            t = [t.value, a];
            try {
              l = f(Ia(t)[0], t[1]);
            } catch (h) {
              throw Pj(u), h;
            }
          } else
            l = t.value;
          hf(r, a, u = l);
        }
      return r.length = a, r;
    }, Lo = Fa("iterator"), Mo = !1;
    try {
      var Rw = 0, No = { next: function() {
        return { done: !!Rw++ };
      }, return: function() {
        Mo = !0;
      } };
      No[Lo] = function() {
        return this;
      }, Array.from(No, function() {
        throw 2;
      });
    } catch (e) {
    }
    var Eh = function(e, t) {
      if (!t && !Mo)
        return !1;
      var n = !1;
      try {
        (t = {})[Lo] = function() {
          return { next: function() {
            return { done: n = !0 };
          } };
        }, e(t);
      } catch (r) {
      }
      return n;
    }, Sw = !Eh(function(e) {
      Array.from(e);
    });
    ea({ target: "Array", stat: !0, forced: Sw }, { from: ge });
    var Oo = !la(function() {
      function e() {
      }
      return e.prototype.constructor = null, Object.getPrototypeOf(new e()) !== e.prototype;
    }), Po = xh("IE_PROTO"), Tw = Object.prototype, uc = Oo ? Object.getPrototypeOf : function(e) {
      return e = pb(e), ka(e, Po) ? e[Po] : typeof e.constructor == "function" && e instanceof e.constructor ? e.constructor.prototype : e instanceof Object ? Tw : null;
    }, Sj = Fa("iterator"), Qo = !1, Uw = function() {
      return this;
    }, he;
    if ([].keys) {
      var Ro = [].keys();
      if ("next" in Ro) {
        var So = uc(uc(Ro));
        So !== Object.prototype && (he = So);
      } else
        Qo = !0;
    }
    (he == null || la(function() {
      var e = {};
      return he[Sj].call(e) !== e;
    })) && (he = {}), ka(he, Sj) || kb(he, Sj, Uw);
    var Fh = he, Gh = Qo, To = wa ? Object.defineProperties : function(e, t) {
      Ia(e);
      for (var n, r = ed(t), o = r.length, i = 0; o > i; )
        qb.f(e, n = r[i++], t[n]);
      return e;
    }, Tj = Pc("document", "documentElement"), Uo = xh("IE_PROTO"), Uj = function() {
    }, Vj, Hh = function() {
      try {
        Vj = document.domain && new ActiveXObject("htmlfile");
      } catch (t) {
      }
      if (Vj) {
        var e = Vj;
        e.write("<script><\/script>"), e.close(), e = e.parentWindow.Object;
      } else
        (e = wh ? $e.createElement("iframe") : {}).style.display = "none", Tj.appendChild(e), e.src = "javascript:", (e = e.contentWindow.document).open(), e.write("<script>document.F=Object<\/script>"), e.close(), e = e.F;
      for (Hh = e, e = zh.length; e--; )
        delete Hh.prototype[zh[e]];
      return Hh();
    };
    bf[Uo] = !0;
    var jc = Object.create || function(e, t) {
      if (e !== null) {
        Uj.prototype = Ia(e);
        var n = new Uj();
        Uj.prototype = null, n[Uo] = e;
      } else
        n = Hh();
      return t === void 0 ? n : To(n, t);
    }, Vw = qb.f, Vo = Fa("toStringTag"), zc = function(e, t, n) {
      e && !ka(e = n ? e : e.prototype, Vo) && Vw(e, Vo, { configurable: !0, value: t });
    }, Ww = function() {
      return this;
    }, Wo = function(e, t, n) {
      return t += " Iterator", e.prototype = jc(Fh, { next: Nc(1, n) }), zc(e, t, !1), gf[t] = Ww, e;
    }, tb = Object.setPrototypeOf || ("__proto__" in {} ? function() {
      var e = !1, t = {};
      try {
        var n = Object.getOwnPropertyDescriptor(Object.prototype, "__proto__").set;
        n.call(t, []), e = t instanceof Array;
      } catch (r) {
      }
      return function(r, o) {
        if (Ia(r), !xa(o) && o !== null)
          throw TypeError("Can't set " + String(o) + " as a prototype");
        return e ? n.call(r, o) : r.__proto__ = o, r;
      };
    }() : void 0), mg = Fa("iterator"), Xw = function() {
      return this;
    }, Wj = function(e, t, n, r, o, i, s) {
      Wo(n, t, r), r = function(y) {
        if (y === o && d)
          return d;
        if (!Gh && y in f)
          return f[y];
        switch (y) {
          case "keys":
          case "values":
          case "entries":
            return function() {
              return new n(this, y);
            };
        }
        return function() {
          return new n(this);
        };
      };
      var u, a = t + " Iterator", l = !1, f = e.prototype, h = f[mg] || f["@@iterator"] || o && f[o], d = !Gh && h || r(o), p = t == "Array" && f.entries || h;
      if (p && (e = uc(p.call(new e())), Fh !== Object.prototype && e.next && (uc(e) !== Fh && (tb ? tb(e, Fh) : typeof e[mg] != "function" && kb(e, mg, Xw)), zc(e, a, !0))), o == "values" && h && h.name !== "values" && (l = !0, d = function() {
        return h.call(this);
      }), f[mg] !== d && kb(f, mg, d), gf[t] = d, o) {
        var v = { values: r("values"), keys: i ? d : r("keys"), entries: r("entries") };
        if (s)
          for (u in v)
            !Gh && !l && u in f || Za(f, u, v[u]);
        else
          ea({ target: t, proto: !0, forced: Gh || l }, v);
      }
      return v;
    }, Yw = cb.set, Zw = cb.getterFor("String Iterator");
    Wj(String, "String", function(e) {
      Yw(this, { type: "String Iterator", string: String(e), index: 0 });
    }, function() {
      var e = Zw(this), t = e.string, n = e.index;
      return n >= t.length ? { value: void 0, done: !0 } : (t = Eo(t, n), e.index += t.length, { value: t, done: !1 });
    });
    var Xj = Fa("unscopables"), Yj = Array.prototype;
    Yj[Xj] == null && qb.f(Yj, Xj, { configurable: !0, value: jc(null) });
    var ng = function(e) {
      Yj[Xj][e] = !0;
    }, Xo = !0;
    "find" in [] && Array(1).find(function() {
      Xo = !1;
    }), ea({ target: "Array", proto: !0, forced: Xo }, { find: function(e) {
      return Jo(this, e, 1 < arguments.length ? arguments[1] : void 0);
    } }), ng("find");
    var Yo = function(e) {
      var t = String(Eb(this)), n = "";
      if (0 > (e = yc(e)) || 1 / 0 == e)
        throw RangeError("Wrong number of repetitions");
      for (; 0 < e; (e >>>= 1) && (t += t))
        1 & e && (n += t);
      return n;
    };
    ea({ target: "String", proto: !0 }, { repeat: Yo });
    var Zo = [].indexOf, $o = !!Zo && 0 > 1 / [1].indexOf(1, -0), $w = ff("indexOf");
    ea({ target: "Array", proto: !0, forced: $o || !$w }, { indexOf: function(e) {
      return $o ? Zo.apply(this, arguments) || 0 : Fj(this, e, 1 < arguments.length ? arguments[1] : void 0);
    } });
    var Zt = /(android|bb\d+|meego).+mobile|armv7l|avantgo|bada\/|blackberry|blazer|compal|elaine|fennec|hiptop|iemobile|ip(hone|od)|iris|kindle|lge |maemo|midp|mmp|mobile.+firefox|netfront|opera m(ob|in)i|palm( os)?|phone|p(ixi|re)\/|plucker|pocket|psp|series[46]0|samsungbrowser|symbian|treo|up\.(browser|link)|vodafone|wap|windows (ce|phone)|xda|xiino/i, $t = /CrOS/, au = /android|ipad|playbook|silk/i;
    Ce.isMobile = Ce, Ce.default = Ce, ea({ target: "Number", stat: !0 }, { MAX_SAFE_INTEGER: 9007199254740991 }), ea({ target: "Number", stat: !0 }, { isNaN: function(e) {
      return e != e;
    } }), R.Number.isNaN;
    var ax = Rj ? {}.toString : function() {
      return "[object " + jf(this) + "]";
    };
    Rj || Za(Object.prototype, "toString", ax, { unsafe: !0 });
    var Ih = R.Promise, kf = function(e, t, n) {
      for (var r in t)
        Za(e, r, t[r], n);
      return e;
    }, ap = Fa("species"), og = function(e) {
      e = Pc(e);
      var t = qb.f;
      wa && e && !e[ap] && t(e, ap, { configurable: !0, get: function() {
        return this;
      } });
    }, Ac = function(e, t, n) {
      if (!(e instanceof t))
        throw TypeError("Incorrect " + (n ? n + " " : "") + "invocation");
      return e;
    }, pg = function(e, t) {
      this.stopped = e, this.result = t;
    }, Jh = function(e, t, n) {
      var r, o = !(!n || !n.AS_ENTRIES), i = !(!n || !n.IS_ITERATOR), s = !(!n || !n.INTERRUPTED), u = Dd(t, n && n.that, 1 + o + s), a = function(f) {
        return l && Pj(l), new pg(!0, f);
      };
      if (t = function(f) {
        return o ? (Ia(f), s ? u(f[0], f[1], a) : u(f[0], f[1])) : s ? u(f, a) : u(f);
      }, i)
        var l = e;
      else {
        if (typeof (i = lg(e)) != "function")
          throw TypeError("Target is not iterable");
        if (Qj(i)) {
          for (i = 0, n = Ma(e.length); n > i; i++)
            if ((r = t(e[i])) && r instanceof pg)
              return r;
          return new pg(!1);
        }
        l = i.call(e);
      }
      for (e = l.next; !(i = e.call(l)).done; ) {
        try {
          r = t(i.value);
        } catch (f) {
          throw Pj(l), f;
        }
        if (typeof r == "object" && r && r instanceof pg)
          return r;
      }
      return new pg(!1);
    }, bp = /(?:iphone|ipod|ipad).*applewebkit/i.test(df), fd = xc(R.process) == "process", Kh = R.location, Zj = R.setImmediate, cp = R.clearImmediate, bx = R.process, dp = R.MessageChannel, ak = R.Dispatch, bk = 0, qg = {}, ck = function(e) {
      if (qg.hasOwnProperty(e)) {
        var t = qg[e];
        delete qg[e], t();
      }
    }, dk = function(e) {
      return function() {
        ck(e);
      };
    }, ep = function(e) {
      ck(e.data);
    }, fp = function(e) {
      R.postMessage(e + "", Kh.protocol + "//" + Kh.host);
    };
    if (!Zj || !cp)
      if (Zj = function(e) {
        for (var t = [], n = 1; arguments.length > n; )
          t.push(arguments[n++]);
        return qg[++bk] = function() {
          (typeof e == "function" ? e : Function(e)).apply(void 0, t);
        }, rg(bk), bk;
      }, cp = function(e) {
        delete qg[e];
      }, fd)
        var rg = function(e) {
          bx.nextTick(dk(e));
        };
      else if (ak && ak.now)
        rg = function(e) {
          ak.now(dk(e));
        };
      else if (dp && !bp) {
        var gp = new dp(), hp = gp.port2;
        gp.port1.onmessage = ep, rg = Dd(hp.postMessage, hp, 1);
      } else
        R.addEventListener && typeof postMessage == "function" && !R.importScripts && Kh && Kh.protocol !== "file:" && !la(fp) ? (rg = fp, R.addEventListener("message", ep, !1)) : rg = "onreadystatechange" in (wh ? $e.createElement("script") : {}) ? function(e) {
          Tj.appendChild(wh ? $e.createElement("script") : {}).onreadystatechange = function() {
            Tj.removeChild(this), ck(e);
          };
        } : function(e) {
          setTimeout(dk(e), 0);
        };
    var ek = Zj, cx = /web0s(?!.*chrome)/i.test(df), dx = dc.f, ip = R.MutationObserver || R.WebKitMutationObserver, jp = R.document, kp = R.process, Lh = R.Promise, lp = dx(R, "queueMicrotask"), mp = lp && lp.value, ie, sg;
    if (!mp) {
      var Nh = function() {
        var e;
        for (fd && (e = kp.domain) && e.exit(); ie; ) {
          var t = ie.fn;
          ie = ie.next;
          try {
            t();
          } catch (n) {
            throw ie ? Mh() : sg = void 0, n;
          }
        }
        sg = void 0, e && e.enter();
      };
      if (bp || fd || cx || !ip || !jp)
        if (Lh && Lh.resolve) {
          var fk = Lh.resolve(void 0);
          fk.constructor = Lh;
          var ex = fk.then, Mh = function() {
            ex.call(fk, Nh);
          };
        } else
          Mh = fd ? function() {
            kp.nextTick(Nh);
          } : function() {
            ek.call(R, Nh);
          };
      else {
        var np = !0, op = jp.createTextNode("");
        new ip(Nh).observe(op, { characterData: !0 }), Mh = function() {
          op.data = np = !np;
        };
      }
    }
    var pp = mp || function(e) {
      e = { fn: e, next: void 0 }, sg && (sg.next = e), ie || (ie = e, Mh()), sg = e;
    }, fx = function(e) {
      var t, n;
      this.promise = new e(function(r, o) {
        if (t !== void 0 || n !== void 0)
          throw TypeError("Bad Promise constructor");
        t = r, n = o;
      }), this.resolve = Wb(t), this.reject = Wb(n);
    }, gk = { f: function(e) {
      return new fx(e);
    } }, gx = function(e, t) {
      var n = R.console;
      n && n.error && (arguments.length === 1 ? n.error(e) : n.error(e, t));
    }, hk = function(e) {
      try {
        return { error: !1, value: e() };
      } catch (t) {
        return { error: !0, value: t };
      }
    }, hx = typeof window == "object", ix = Fa("species"), qp = cb.get, jx = cb.set, kx = cb.getterFor("Promise"), je = Ih && Ih.prototype, Xb = Ih, Oh = je, rp = R.TypeError, ik = R.document, jk = R.process, lf = gk.f, lx = lf, mx = !!(ik && ik.createEvent && R.dispatchEvent), sp = typeof PromiseRejectionEvent == "function", tp = !1, tg = Qc("Promise", function() {
      var e = Cj(Xb) !== String(Xb);
      if (!e && Cd === 66)
        return !0;
      if (51 <= Cd && /native code/.test(Xb))
        return !1;
      var t = new Xb(function(r) {
        r(1);
      }), n = function(r) {
        r(function() {
        }, function() {
        });
      };
      return (t.constructor = {})[ix] = n, !(tp = t.then(function() {
      }) instanceof n) || !e && hx && !sp;
    }), nx = tg || !Eh(function(e) {
      Xb.all(e).catch(function() {
      });
    }), up = function(e) {
      var t;
      return !(!xa(e) || typeof (t = e.then) != "function") && t;
    }, kk = function(e, t) {
      if (!e.notified) {
        e.notified = !0;
        var n = e.reactions;
        pp(function() {
          for (var r = e.value, o = e.state == 1, i = 0; n.length > i; ) {
            var s, u = n[i++], a = o ? u.ok : u.fail, l = u.resolve, f = u.reject, h = u.domain;
            try {
              if (a) {
                if (o || (e.rejection === 2 && ox(e), e.rejection = 1), a === !0)
                  var d = r;
                else if (h && h.enter(), d = a(r), h) {
                  h.exit();
                  var p = !0;
                }
                d === u.promise ? f(rp("Promise-chain cycle")) : (s = up(d)) ? s.call(d, l, f) : l(d);
              } else
                f(r);
            } catch (v) {
              h && !p && h.exit(), f(v);
            }
          }
          e.reactions = [], e.notified = !1, t && !e.rejection && px(e);
        });
      }
    }, vp = function(e, t, n) {
      var r;
      if (mx) {
        var o = ik.createEvent("Event");
        o.promise = t, o.reason = n, o.initEvent(e, !1, !0), R.dispatchEvent(o);
      } else
        o = { promise: t, reason: n };
      !sp && (r = R["on" + e]) ? r(o) : e === "unhandledrejection" && gx("Unhandled promise rejection", n);
    }, px = function(e) {
      ek.call(R, function() {
        var t = e.facade, n = e.value;
        if (e.rejection !== 1 && !e.parent) {
          var r = hk(function() {
            fd ? jk.emit("unhandledRejection", n, t) : vp("unhandledrejection", t, n);
          });
          if (e.rejection = fd || e.rejection !== 1 && !e.parent ? 2 : 1, r.error)
            throw r.value;
        }
      });
    }, ox = function(e) {
      ek.call(R, function() {
        var t = e.facade;
        fd ? jk.emit("rejectionHandled", t) : vp("rejectionhandled", t, e.value);
      });
    }, mf = function(e, t, n) {
      return function(r) {
        e(t, r, n);
      };
    }, nf = function(e, t, n) {
      e.done || (e.done = !0, n && (e = n), e.value = t, e.state = 2, kk(e, !0));
    }, lk = function(e, t, n) {
      if (!e.done) {
        e.done = !0, n && (e = n);
        try {
          if (e.facade === t)
            throw rp("Promise can't be resolved itself");
          var r = up(t);
          r ? pp(function() {
            var o = { done: !1 };
            try {
              r.call(t, mf(lk, o, e), mf(nf, o, e));
            } catch (i) {
              nf(o, i, e);
            }
          }) : (e.value = t, e.state = 1, kk(e, !1));
        } catch (o) {
          nf({ done: !1 }, o, e);
        }
      }
    };
    if (tg) {
      Xb = function(e) {
        Ac(this, Xb, "Promise"), Wb(e), mk.call(this);
        var t = qp(this);
        try {
          e(mf(lk, t), mf(nf, t));
        } catch (n) {
          nf(t, n);
        }
      }, Oh = Xb.prototype;
      var mk = function(e) {
        jx(this, { type: "Promise", done: !1, notified: !1, parent: !1, reactions: [], rejection: !1, state: 0, value: void 0 });
      };
      mk.prototype = kf(Oh, { then: function(e, t) {
        var n = kx(this), r = lf(ee(this, Xb));
        return r.ok = typeof e != "function" || e, r.fail = typeof t == "function" && t, r.domain = fd ? jk.domain : void 0, n.parent = !0, n.reactions.push(r), n.state != 0 && kk(n, !1), r.promise;
      }, catch: function(e) {
        return this.then(void 0, e);
      } });
      var qx = function() {
        var e = new mk(), t = qp(e);
        this.promise = e, this.resolve = mf(lk, t), this.reject = mf(nf, t);
      };
      if (gk.f = lf = function(e) {
        return e === Xb || e === rx ? new qx(e) : lx(e);
      }, typeof Ih == "function" && je !== Object.prototype) {
        var sx = je.then;
        tp || (Za(je, "then", function(e, t) {
          var n = this;
          return new Xb(function(r, o) {
            sx.call(n, r, o);
          }).then(e, t);
        }, { unsafe: !0 }), Za(je, "catch", Oh.catch, { unsafe: !0 }));
        try {
          delete je.constructor;
        } catch (e) {
        }
        tb && tb(je, Oh);
      }
    }
    ea({ global: !0, wrap: !0, forced: tg }, { Promise: Xb }), zc(Xb, "Promise", !1), og("Promise");
    var rx = Pc("Promise");
    ea({ target: "Promise", stat: !0, forced: tg }, { reject: function(e) {
      var t = lf(this);
      return t.reject.call(void 0, e), t.promise;
    } }), ea({ target: "Promise", stat: !0, forced: tg }, { resolve: function(e) {
      if (Ia(this), !xa(e) || e.constructor !== this) {
        var t = gk.f(this);
        (0, t.resolve)(e), e = t.promise;
      }
      return e;
    } }), ea({ target: "Promise", stat: !0, forced: nx }, { all: function(e) {
      var t = this, n = lf(t), r = n.resolve, o = n.reject, i = hk(function() {
        var s = Wb(t.resolve), u = [], a = 0, l = 1;
        Jh(e, function(f) {
          var h = a++, d = !1;
          u.push(void 0), l++, s.call(t, f).then(function(p) {
            d || (d = !0, u[h] = p, --l || r(u));
          }, o);
        }), --l || r(u);
      });
      return i.error && o(i.value), n.promise;
    }, race: function(e) {
      var t = this, n = lf(t), r = n.reject, o = hk(function() {
        var i = Wb(t.resolve);
        Jh(e, function(s) {
          i.call(t, s).then(n.resolve, r);
        });
      });
      return o.error && r(o.value), n.promise;
    } });
    var tx = Math.floor, ux = "".replace, vx = /\$([$&'`]|\d{1,2}|<[^>]*>)/g, wx = /\$([$&'`]|\d{1,2})/g, xx = function(e, t, n, r, o, i) {
      var s = n + e.length, u = r.length, a = wx;
      return o !== void 0 && (o = pb(o), a = vx), ux.call(i, a, function(l, f) {
        switch (f.charAt(0)) {
          case "$":
            return "$";
          case "&":
            return e;
          case "`":
            return t.slice(0, n);
          case "'":
            return t.slice(s);
          case "<":
            l = o[f.slice(1, -1)];
            break;
          default:
            var h = +f;
            if (h === 0)
              return l;
            if (h > u)
              return (h = tx(h / 10)) === 0 ? l : h <= u ? r[h - 1] === void 0 ? f.charAt(1) : r[h - 1] + f.charAt(1) : l;
            l = r[h - 1];
        }
        return l === void 0 ? "" : l;
      });
    }, yx = Math.max, zx = Math.min;
    Bh("replace", 2, function(e, t, n, r) {
      var o = r.REGEXP_REPLACE_SUBSTITUTES_UNDEFINED_CAPTURE, i = r.REPLACE_KEEPS_$0, s = o ? "$" : "$0";
      return [function(u, a) {
        var l = Eb(this), f = u == null ? void 0 : u[e];
        return f !== void 0 ? f.call(u, l, a) : t.call(String(l), u, a);
      }, function(u, a) {
        if (!o && i || typeof a == "string" && a.indexOf(s) === -1) {
          var l = n(t, u, this, a);
          if (l.done)
            return l.value;
        }
        var f = Ia(u);
        u = String(this), (l = typeof a == "function") || (a = String(a));
        var h = f.global;
        if (h) {
          var d = f.unicode;
          f.lastIndex = 0;
        }
        for (var p = []; ; ) {
          var v = ef(f, u);
          if (v === null || (p.push(v), !h))
            break;
          String(v[0]) === "" && (f.lastIndex = Mj(u, Ma(f.lastIndex), d));
        }
        for (d = "", h = f = 0; h < p.length; h++) {
          v = p[h];
          for (var y = String(v[0]), g = yx(zx(yc(v.index), u.length), 0), m = [], E = 1; E < v.length; E++) {
            var w = m, C = v[E];
            w.push.call(w, C === void 0 ? C : String(C));
          }
          v = v.groups, l ? (m = [y].concat(m, g, u), v !== void 0 && m.push(v), v = String(a.apply(void 0, m))) : v = xx(y, u, g, m, v, a), g >= f && (d += u.slice(f, g) + v, f = g + y.length);
        }
        return d + u.slice(f);
      }];
    });
    var Ax = kg("slice"), Bx = Fa("species"), Cx = [].slice, Dx = Math.max;
    ea({ target: "Array", proto: !0, forced: !Ax }, { slice: function(e, t) {
      var n = Mb(this), r = Ma(n.length);
      if (e = Vb(e, r), t = Vb(t === void 0 ? r : t, r), Ed(n)) {
        var o = n.constructor;
        if (typeof o != "function" || o !== Array && !Ed(o.prototype) ? xa(o) && (o = o[Bx]) === null && (o = void 0) : o = void 0, o === Array || o === void 0)
          return Cx.call(n, e, t);
      }
      for (o = new (o === void 0 ? Array : o)(Dx(t - e, 0)), r = 0; e < t; e++, r++)
        e in n && hf(o, r, n[e]);
      return o.length = r, o;
    } });
    var Ex = cb.set, Fx = cb.getterFor("Array Iterator"), Gd = Wj(Array, "Array", function(e, t) {
      Ex(this, { type: "Array Iterator", target: Mb(e), index: 0, kind: t });
    }, function() {
      var e = Fx(this), t = e.target, n = e.kind, r = e.index++;
      return !t || r >= t.length ? (e.target = void 0, { value: void 0, done: !0 }) : n == "keys" ? { value: r, done: !1 } : n == "values" ? { value: t[r], done: !1 } : { value: [r, t[r]], done: !1 };
    }, "values");
    gf.Arguments = gf.Array, ng("keys"), ng("values"), ng("entries");
    var wp = typeof ArrayBuffer != "undefined" && typeof DataView != "undefined", of = function(e) {
      if (e === void 0)
        return 0;
      e = yc(e);
      var t = Ma(e);
      if (e !== t)
        throw RangeError("Wrong length or index");
      return t;
    }, Gx = Math.abs, gd = Math.pow, Hx = Math.floor, Ix = Math.log, Jx = Math.LN2, xp = function(e) {
      var t = pb(this), n = Ma(t.length), r = arguments.length, o = Vb(1 < r ? arguments[1] : void 0, n);
      for (n = (r = 2 < r ? arguments[2] : void 0) === void 0 ? n : Vb(r, n); n > o; )
        t[o++] = e;
      return t;
    }, Kx = de.f, Lx = qb.f, pf = cb.get, yp = cb.set, Bc = R.ArrayBuffer, Yb = Bc, Cc = R.DataView, Ph = Cc && Cc.prototype, zp = Object.prototype, Qh = R.RangeError, Ap = function(e, t, n) {
      var r, o = Array(n), i = (1 << (n = 8 * n - t - 1)) - 1, s = i >> 1, u = t === 23 ? gd(2, -24) - gd(2, -77) : 0, a = 0 > e || e === 0 && 0 > 1 / e ? 1 : 0, l = 0;
      if ((e = Gx(e)) != e || 1 / 0 === e) {
        e = e != e ? 1 : 0;
        var f = i;
      } else
        f = Hx(Ix(e) / Jx), 1 > e * (r = gd(2, -f)) && (f--, r *= 2), 2 <= (e = 1 <= f + s ? e + u / r : e + u * gd(2, 1 - s)) * r && (f++, r /= 2), f + s >= i ? (e = 0, f = i) : 1 <= f + s ? (e = (e * r - 1) * gd(2, t), f += s) : (e = e * gd(2, s - 1) * gd(2, t), f = 0);
      for (; 8 <= t; o[l++] = 255 & e, e /= 256, t -= 8)
        ;
      for (f = f << t | e, n += t; 0 < n; o[l++] = 255 & f, f /= 256, n -= 8)
        ;
      return o[--l] |= 128 * a, o;
    }, Bp = function(e, t) {
      var n = e.length, r = 8 * n - t - 1, o = (1 << r) - 1, i = o >> 1;
      r -= 7, --n;
      var s = e[n--], u = 127 & s;
      for (s >>= 7; 0 < r; u = 256 * u + e[n], n--, r -= 8)
        ;
      var a = u & (1 << -r) - 1;
      for (u >>= -r, r += t; 0 < r; a = 256 * a + e[n], n--, r -= 8)
        ;
      if (u === 0)
        u = 1 - i;
      else {
        if (u === o)
          return a ? NaN : s ? -1 / 0 : 1 / 0;
        a += gd(2, t), u -= i;
      }
      return (s ? -1 : 1) * a * gd(2, u - t);
    }, Cp = function(e) {
      return [255 & e];
    }, Dp = function(e) {
      return [255 & e, e >> 8 & 255];
    }, Ep = function(e) {
      return [255 & e, e >> 8 & 255, e >> 16 & 255, e >> 24 & 255];
    }, Fp = function(e) {
      return e[3] << 24 | e[2] << 16 | e[1] << 8 | e[0];
    }, Mx = function(e) {
      return Ap(e, 23, 4);
    }, Nx = function(e) {
      return Ap(e, 52, 8);
    }, Rh = function(e, t) {
      Lx(e.prototype, t, { get: function() {
        return pf(this)[t];
      } });
    }, Hd = function(e, t, n, r) {
      n = of(n);
      var o = pf(e);
      if (n + t > o.byteLength)
        throw Qh("Wrong index");
      return e = pf(o.buffer).bytes, n += o.byteOffset, t = e.slice(n, n + t), r ? t : t.reverse();
    }, Id = function(e, t, n, r, o, i) {
      n = of(n);
      var s = pf(e);
      if (n + t > s.byteLength)
        throw Qh("Wrong index");
      for (e = pf(s.buffer).bytes, n += s.byteOffset, r = r(+o), o = 0; o < t; o++)
        e[n + o] = r[i ? o : t - o - 1];
    };
    if (wp) {
      if (!la(function() {
        Bc(1);
      }) || !la(function() {
        new Bc(-1);
      }) || la(function() {
        return new Bc(), new Bc(1.5), new Bc(NaN), Bc.name != "ArrayBuffer";
      })) {
        Yb = function(e) {
          return Ac(this, Yb), new Bc(of(e));
        };
        for (var Ox = Yb.prototype = Bc.prototype, Gp = Kx(Bc), Hp = 0, nk; Gp.length > Hp; )
          (nk = Gp[Hp++]) in Yb || kb(Yb, nk, Bc[nk]);
        Ox.constructor = Yb;
      }
      tb && uc(Ph) !== zp && tb(Ph, zp);
      var Sh = new Cc(new Yb(2)), Ip = Ph.setInt8;
      Sh.setInt8(0, 2147483648), Sh.setInt8(1, 2147483649), !Sh.getInt8(0) && Sh.getInt8(1) || kf(Ph, { setInt8: function(e, t) {
        Ip.call(this, e, t << 24 >> 24);
      }, setUint8: function(e, t) {
        Ip.call(this, e, t << 24 >> 24);
      } }, { unsafe: !0 });
    } else
      Yb = function(e) {
        Ac(this, Yb, "ArrayBuffer"), e = of(e), yp(this, { bytes: xp.call(Array(e), 0), byteLength: e }), wa || (this.byteLength = e);
      }, Cc = function(e, t, n) {
        Ac(this, Cc, "DataView"), Ac(e, Yb, "DataView");
        var r = pf(e).byteLength;
        if (0 > (t = yc(t)) || t > r)
          throw Qh("Wrong offset");
        if (t + (n = n === void 0 ? r - t : Ma(n)) > r)
          throw Qh("Wrong length");
        yp(this, { buffer: e, byteLength: n, byteOffset: t }), wa || (this.buffer = e, this.byteLength = n, this.byteOffset = t);
      }, wa && (Rh(Yb, "byteLength"), Rh(Cc, "buffer"), Rh(Cc, "byteLength"), Rh(Cc, "byteOffset")), kf(Cc.prototype, { getInt8: function(e) {
        return Hd(this, 1, e)[0] << 24 >> 24;
      }, getUint8: function(e) {
        return Hd(this, 1, e)[0];
      }, getInt16: function(e) {
        var t = Hd(this, 2, e, 1 < arguments.length ? arguments[1] : void 0);
        return (t[1] << 8 | t[0]) << 16 >> 16;
      }, getUint16: function(e) {
        var t = Hd(this, 2, e, 1 < arguments.length ? arguments[1] : void 0);
        return t[1] << 8 | t[0];
      }, getInt32: function(e) {
        return Fp(Hd(this, 4, e, 1 < arguments.length ? arguments[1] : void 0));
      }, getUint32: function(e) {
        return Fp(Hd(this, 4, e, 1 < arguments.length ? arguments[1] : void 0)) >>> 0;
      }, getFloat32: function(e) {
        return Bp(Hd(this, 4, e, 1 < arguments.length ? arguments[1] : void 0), 23);
      }, getFloat64: function(e) {
        return Bp(Hd(this, 8, e, 1 < arguments.length ? arguments[1] : void 0), 52);
      }, setInt8: function(e, t) {
        Id(this, 1, e, Cp, t);
      }, setUint8: function(e, t) {
        Id(this, 1, e, Cp, t);
      }, setInt16: function(e, t) {
        Id(this, 2, e, Dp, t, 2 < arguments.length ? arguments[2] : void 0);
      }, setUint16: function(e, t) {
        Id(this, 2, e, Dp, t, 2 < arguments.length ? arguments[2] : void 0);
      }, setInt32: function(e, t) {
        Id(this, 4, e, Ep, t, 2 < arguments.length ? arguments[2] : void 0);
      }, setUint32: function(e, t) {
        Id(this, 4, e, Ep, t, 2 < arguments.length ? arguments[2] : void 0);
      }, setFloat32: function(e, t) {
        Id(this, 4, e, Mx, t, 2 < arguments.length ? arguments[2] : void 0);
      }, setFloat64: function(e, t) {
        Id(this, 8, e, Nx, t, 2 < arguments.length ? arguments[2] : void 0);
      } });
    zc(Yb, "ArrayBuffer"), zc(Cc, "DataView");
    var ug = { ArrayBuffer: Yb, DataView: Cc }, ok = ug.ArrayBuffer, Jp = ug.DataView, Kp = ok.prototype.slice, Px = la(function() {
      return !new ok(2).slice(1, void 0).byteLength;
    });
    ea({ target: "ArrayBuffer", proto: !0, unsafe: !0, forced: Px }, { slice: function(e, t) {
      if (Kp !== void 0 && t === void 0)
        return Kp.call(Ia(this), e);
      var n = Ia(this).byteLength;
      e = Vb(e, n), t = Vb(t === void 0 ? n : t, n), n = new (ee(this, ok))(Ma(t - e));
      for (var r = new Jp(this), o = new Jp(n), i = 0; e < t; )
        o.setUint8(i++, r.getUint8(e++));
      return n;
    } });
    var Qx = qb.f, Th = R.Int8Array, pk = Th && Th.prototype, Lp = R.Uint8ClampedArray, Mp = Lp && Lp.prototype, Tc = Th && uc(Th), Dc = pk && uc(pk), Np = Object.prototype, Op = Np.isPrototypeOf, Pp = Fa("toStringTag"), qk = af("TYPED_ARRAY_TAG"), hd = wp && !!tb && jf(R.opera) !== "Opera", Qp = !1, Zb, Uc = { Int8Array: 1, Uint8Array: 1, Uint8ClampedArray: 1, Int16Array: 2, Uint16Array: 2, Int32Array: 4, Uint32Array: 4, Float32Array: 4, Float64Array: 8 }, Rx = { BigInt64Array: 8, BigUint64Array: 8 }, Uh = function(e) {
      return !!xa(e) && (e = jf(e), ka(Uc, e) || ka(Rx, e));
    };
    for (Zb in Uc)
      R[Zb] || (hd = !1);
    if ((!hd || typeof Tc != "function" || Tc === Function.prototype) && (Tc = function() {
      throw TypeError("Incorrect invocation");
    }, hd))
      for (Zb in Uc)
        R[Zb] && tb(R[Zb], Tc);
    if ((!hd || !Dc || Dc === Np) && (Dc = Tc.prototype, hd))
      for (Zb in Uc)
        R[Zb] && tb(R[Zb].prototype, Dc);
    if (hd && uc(Mp) !== Dc && tb(Mp, Dc), wa && !ka(Dc, Pp))
      for (Zb in Qp = !0, Qx(Dc, Pp, { get: function() {
        return xa(this) ? this[qk] : void 0;
      } }), Uc)
        R[Zb] && kb(R[Zb], qk, Zb);
    var vg = hd, Rp = Qp && qk, Ua = function(e) {
      if (Uh(e))
        return e;
      throw TypeError("Target is not a typed array");
    }, qf = function(e) {
      if (tb) {
        if (Op.call(Tc, e))
          return e;
      } else
        for (var t in Uc)
          if (ka(Uc, Zb)) {
            var n = R[t];
            if (n && (e === n || Op.call(n, e)))
              return e;
          }
      throw TypeError("Target is not a typed array constructor");
    }, Ra = function(e, t, n) {
      if (wa) {
        if (n)
          for (var r in Uc) {
            var o = R[r];
            if (o && ka(o.prototype, e))
              try {
                delete o.prototype[e];
              } catch (i) {
              }
          }
        Dc[e] && !n || Za(Dc, e, n ? t : hd && pk[e] || t);
      }
    }, Sp = function(e, t, n) {
      var r, o;
      if (wa) {
        if (tb) {
          if (n) {
            for (r in Uc)
              if ((o = R[r]) && ka(o, e))
                try {
                  delete o[e];
                } catch (i) {
                }
          }
          if (Tc[e] && !n)
            return;
          try {
            return Za(Tc, e, n ? t : hd && Tc[e] || t);
          } catch (i) {
          }
        }
        for (r in Uc)
          !(o = R[r]) || o[e] && !n || Za(o, e, t);
      }
    }, Tp = Tc, wg = Dc, Sx = R.ArrayBuffer, ke = R.Int8Array, rk = !vg || !la(function() {
      ke(1);
    }) || !la(function() {
      new ke(-1);
    }) || !Eh(function(e) {
      new ke(), new ke(null), new ke(1.5), new ke(e);
    }, !0) || la(function() {
      return new ke(new Sx(2), 1, void 0).length !== 1;
    }), Vh = function(e, t) {
      if (0 > (e = yc(e)))
        throw RangeError("The argument can't be less than 0");
      if (e % t)
        throw RangeError("Wrong offset");
      return e;
    }, sk = function(e) {
      var t = pb(e), n = arguments.length, r = 1 < n ? arguments[1] : void 0, o = r !== void 0, i = lg(t);
      if (i != null && !Qj(i)) {
        var s = i.call(t), u = s.next;
        for (t = []; !(i = u.call(s)).done; )
          t.push(i.value);
      }
      for (o && 2 < n && (r = Dd(r, arguments[2], 2)), i = Ma(t.length), s = new (qf(this))(i), n = 0; i > n; n++)
        s[n] = o ? r(t[n], n) : t[n];
      return s;
    }, Wh = function(e, t, n) {
      var r, o;
      return tb && typeof (r = t.constructor) == "function" && r !== n && xa(o = r.prototype) && o !== n.prototype && tb(e, o), e;
    }, xg = xb(function(e) {
      var t = de.f, n = cb.get, r = cb.set, o = qb.f, i = dc.f, s = Math.round, u = R.RangeError, a = ug.ArrayBuffer, l = ug.DataView, f = function(g, m) {
        var E = 0, w = m.length;
        for (g = new (qf(g))(w); w > E; )
          g[E] = m[E++];
        return g;
      }, h = function(g, m) {
        o(g, m, { get: function() {
          return n(this)[m];
        } });
      }, d = function(g) {
        var m;
        return g instanceof a || (m = jf(g)) == "ArrayBuffer" || m == "SharedArrayBuffer";
      }, p = function(g, m) {
        return Uh(g) && typeof m != "symbol" && m in g && String(+m) == String(m);
      }, v = function(g, m) {
        return p(g, m = Oc(m, !0)) ? Nc(2, g[m]) : i(g, m);
      }, y = function(g, m, E) {
        return !(p(g, m = Oc(m, !0)) && xa(E) && ka(E, "value")) || ka(E, "get") || ka(E, "set") || E.configurable || ka(E, "writable") && !E.writable || ka(E, "enumerable") && !E.enumerable ? o(g, m, E) : (g[m] = E.value, g);
      };
      wa ? (vg || (dc.f = v, qb.f = y, h(wg, "buffer"), h(wg, "byteOffset"), h(wg, "byteLength"), h(wg, "length")), ea({ target: "Object", stat: !0, forced: !vg }, { getOwnPropertyDescriptor: v, defineProperty: y }), e.exports = function(g, m, E) {
        var w = g.match(/\d+$/)[0] / 8, C = g + (E ? "Clamped" : "") + "Array", q = "get" + g, J = "set" + g, B = R[C], Y = B;
        g = Y && Y.prototype;
        var _e = {}, k = function(L, T) {
          o(L, T, { get: function() {
            var U = n(this);
            return U.view[q](T * w + U.byteOffset, !0);
          }, set: function(U) {
            var O = n(this);
            E && (U = 0 > (U = s(U)) ? 0 : 255 < U ? 255 : 255 & U), O.view[J](T * w + O.byteOffset, U, !0);
          }, enumerable: !0 });
        };
        vg ? rk && (Y = m(function(L, T, U, O) {
          return Ac(L, Y, C), Wh(xa(T) ? d(T) ? O !== void 0 ? new B(T, Vh(U, w), O) : U !== void 0 ? new B(T, Vh(U, w)) : new B(T) : Uh(T) ? f(Y, T) : sk.call(Y, T) : new B(of(T)), L, Y);
        }), tb && tb(Y, Tp), fe(t(B), function(L) {
          L in Y || kb(Y, L, B[L]);
        }), Y.prototype = g) : (Y = m(function(L, T, U, O) {
          Ac(L, Y, C);
          var _ = 0, A = 0;
          if (xa(T)) {
            if (!d(T))
              return Uh(T) ? f(Y, T) : sk.call(Y, T);
            var j = T;
            if (A = Vh(U, w), T = T.byteLength, O === void 0) {
              if (T % w || 0 > (O = T - A))
                throw u("Wrong length");
            } else if ((O = Ma(O) * w) + A > T)
              throw u("Wrong length");
            T = O / w;
          } else
            T = of(T), j = new a(O = T * w);
          for (r(L, { buffer: j, byteOffset: A, byteLength: O, length: T, view: new l(j) }); _ < T; )
            k(L, _++);
        }), tb && tb(Y, Tp), g = Y.prototype = jc(wg)), g.constructor !== Y && kb(g, "constructor", Y), Rp && kb(g, Rp, C), _e[C] = Y, ea({ global: !0, forced: Y != B, sham: !vg }, _e), "BYTES_PER_ELEMENT" in Y || kb(Y, "BYTES_PER_ELEMENT", w), "BYTES_PER_ELEMENT" in g || kb(g, "BYTES_PER_ELEMENT", w), og(C);
      }) : e.exports = function() {
      };
    });
    xg("Uint8", function(e) {
      return function(t, n, r) {
        return e(this, t, n, r);
      };
    });
    var Tx = Math.min, Ux = [].copyWithin || function(e, t) {
      var n = pb(this), r = Ma(n.length), o = Vb(e, r), i = Vb(t, r), s = 2 < arguments.length ? arguments[2] : void 0;
      for (r = Tx((s === void 0 ? r : Vb(s, r)) - i, r - o), s = 1, i < o && o < i + r && (s = -1, i += r - 1, o += r - 1); 0 < r--; )
        i in n ? n[o] = n[i] : delete n[o], o += s, i += s;
      return n;
    };
    Ra("copyWithin", function(e, t) {
      return Ux.call(Ua(this), e, t, 2 < arguments.length ? arguments[2] : void 0);
    }), Ra("every", function(e) {
      return Cw(Ua(this), e, 1 < arguments.length ? arguments[1] : void 0);
    }), Ra("fill", function(e) {
      return xp.apply(Ua(this), arguments);
    }), Ra("filter", function(e) {
      var t = Io(Ua(this), e, 1 < arguments.length ? arguments[1] : void 0), n = ee(this, this.constructor), r = 0, o = t.length;
      for (n = new (qf(n))(o); o > r; )
        n[r] = t[r++];
      return n;
    }), Ra("find", function(e) {
      return Jo(Ua(this), e, 1 < arguments.length ? arguments[1] : void 0);
    }), Ra("findIndex", function(e) {
      return Dw(Ua(this), e, 1 < arguments.length ? arguments[1] : void 0);
    }), Ra("forEach", function(e) {
      fe(Ua(this), e, 1 < arguments.length ? arguments[1] : void 0);
    }), Ra("includes", function(e) {
      return qo(Ua(this), e, 1 < arguments.length ? arguments[1] : void 0);
    }), Ra("indexOf", function(e) {
      return Fj(Ua(this), e, 1 < arguments.length ? arguments[1] : void 0);
    });
    var Up = Fa("iterator"), Vp = R.Uint8Array, Vx = Gd.values, Wx = Gd.keys, Xx = Gd.entries, tk = Vp && Vp.prototype[Up], Wp = !!tk && (tk.name == "values" || tk.name == null), Xp = function() {
      return Vx.call(Ua(this));
    };
    Ra("entries", function() {
      return Xx.call(Ua(this));
    }), Ra("keys", function() {
      return Wx.call(Ua(this));
    }), Ra("values", Xp, !Wp), Ra(Up, Xp, !Wp);
    var Yx = [].join;
    Ra("join", function(e) {
      return Yx.apply(Ua(this), arguments);
    });
    var Zx = Math.min, uk = [].lastIndexOf, Yp = !!uk && 0 > 1 / [1].lastIndexOf(1, -0), $x = ff("lastIndexOf"), ay = Yp || !$x ? function(e) {
      if (Yp)
        return uk.apply(this, arguments) || 0;
      var t = Mb(this), n = Ma(t.length), r = n - 1;
      for (1 < arguments.length && (r = Zx(r, yc(arguments[1]))), 0 > r && (r = n + r); 0 <= r; r--)
        if (r in t && t[r] === e)
          return r || 0;
      return -1;
    } : uk;
    Ra("lastIndexOf", function(e) {
      return ay.apply(Ua(this), arguments);
    }), Ra("map", function(e) {
      return Ho(Ua(this), e, 1 < arguments.length ? arguments[1] : void 0, function(t, n) {
        return new (qf(ee(t, t.constructor)))(n);
      });
    });
    var Zp = function(e) {
      return function(t, n, r, o) {
        Wb(n), t = pb(t);
        var i = fg(t), s = Ma(t.length), u = e ? s - 1 : 0, a = e ? -1 : 1;
        if (2 > r)
          for (; ; ) {
            if (u in i) {
              o = i[u], u += a;
              break;
            }
            if (u += a, e ? 0 > u : s <= u)
              throw TypeError("Reduce of empty array with no initial value");
          }
        for (; e ? 0 <= u : s > u; u += a)
          u in i && (o = n(o, i[u], u, t));
        return o;
      };
    }, $p = Zp(!1), by = Zp(!0);
    Ra("reduce", function(e) {
      return $p(Ua(this), e, arguments.length, 1 < arguments.length ? arguments[1] : void 0);
    }), Ra("reduceRight", function(e) {
      return by(Ua(this), e, arguments.length, 1 < arguments.length ? arguments[1] : void 0);
    });
    var cy = Math.floor;
    Ra("reverse", function() {
      for (var e, t = Ua(this).length, n = cy(t / 2), r = 0; r < n; )
        e = this[r], this[r++] = this[--t], this[t] = e;
      return this;
    });
    var dy = la(function() {
      new Int8Array(1).set({});
    });
    Ra("set", function(e) {
      Ua(this);
      var t = Vh(1 < arguments.length ? arguments[1] : void 0, 1), n = this.length, r = pb(e), o = Ma(r.length), i = 0;
      if (o + t > n)
        throw RangeError("Wrong length");
      for (; i < o; )
        this[t + i] = r[i++];
    }, dy);
    var ey = [].slice, fy = la(function() {
      new Int8Array(1).slice();
    });
    Ra("slice", function(e, t) {
      e = ey.call(Ua(this), e, t);
      var n = ee(this, this.constructor);
      t = 0;
      var r = e.length;
      for (n = new (qf(n))(r); r > t; )
        n[t] = e[t++];
      return n;
    }, fy), Ra("some", function(e) {
      return Bw(Ua(this), e, 1 < arguments.length ? arguments[1] : void 0);
    });
    var gy = [].sort;
    Ra("sort", function(e) {
      return gy.call(Ua(this), e);
    }), Ra("subarray", function(e, t) {
      var n = Ua(this), r = n.length;
      return e = Vb(e, r), new (ee(n, n.constructor))(n.buffer, n.byteOffset + e * n.BYTES_PER_ELEMENT, Ma((t === void 0 ? r : Vb(t, r)) - e));
    });
    var Xh = R.Int8Array, aq = [].toLocaleString, hy = [].slice, iy = !!Xh && la(function() {
      aq.call(new Xh(1));
    }), jy = la(function() {
      return [1, 2].toLocaleString() != new Xh([1, 2]).toLocaleString();
    }) || !la(function() {
      Xh.prototype.toLocaleString.call([1, 2]);
    });
    Ra("toLocaleString", function() {
      return aq.apply(iy ? hy.call(Ua(this)) : Ua(this), arguments);
    }, jy);
    var bq = R.Uint8Array, ky = bq && bq.prototype || {}, Yh = [].toString, ly = [].join;
    la(function() {
      Yh.call({});
    }) && (Yh = function() {
      return ly.call(this);
    }), Ra("toString", Yh, ky.toString != Yh);
    var cq = ug.ArrayBuffer;
    ea({ global: !0, forced: R.ArrayBuffer !== cq }, { ArrayBuffer: cq }), og("ArrayBuffer");
    var my = qb.f, vk = Function.prototype, ny = vk.toString, oy = /^\s*function ([^ (]*)/;
    !wa || "name" in vk || my(vk, "name", { configurable: !0, get: function() {
      try {
        return ny.call(this).match(oy)[1];
      } catch (e) {
        return "";
      }
    } });
    var dq = RegExp.prototype, eq = dq.toString, py = la(function() {
      return eq.call({ source: "a", flags: "b" }) != "/a/b";
    }), qy = eq.name != "toString";
    (py || qy) && Za(RegExp.prototype, "toString", function() {
      var e = Ia(this), t = String(e.source), n = e.flags;
      return "/" + t + "/" + (e = String(n === void 0 && e instanceof RegExp && !("flags" in dq) ? Gj.call(e) : n));
    }, { unsafe: !0 });
    var ry = kg("splice"), sy = Math.max, ty = Math.min;
    ea({ target: "Array", proto: !0, forced: !ry }, { splice: function(e, t) {
      var n, r, o = pb(this), i = Ma(o.length), s = Vb(e, i), u = arguments.length;
      if (u === 0 ? u = n = 0 : u === 1 ? (u = 0, n = i - s) : (u -= 2, n = ty(sy(yc(t), 0), i - s)), 9007199254740991 < i + u - n)
        throw TypeError("Maximum allowed length exceeded");
      var a = Dh(o, n);
      for (r = 0; r < n; r++) {
        var l = s + r;
        l in o && hf(a, r, o[l]);
      }
      if (a.length = n, u < n) {
        for (r = s; r < i - n; r++) {
          var f = r + u;
          (l = r + n) in o ? o[f] = o[l] : delete o[f];
        }
        for (r = i; r > i - n + u; r--)
          delete o[r - 1];
      } else if (u > n)
        for (r = i - n; r > s; r--)
          f = r + u - 1, (l = r + n - 1) in o ? o[f] = o[l] : delete o[f];
      for (r = 0; r < u; r++)
        o[r + s] = arguments[r + 2];
      return o.length = i - n + u, a;
    } });
    var wk = { CSSRuleList: 0, CSSStyleDeclaration: 0, CSSValueList: 0, ClientRectList: 0, DOMRectList: 0, DOMStringList: 0, DOMTokenList: 1, DataTransferItemList: 0, FileList: 0, HTMLAllCollection: 0, HTMLCollection: 0, HTMLFormElement: 0, HTMLSelectElement: 0, MediaList: 0, MimeTypeArray: 0, NamedNodeMap: 0, NodeList: 1, PaintRequestList: 0, Plugin: 0, PluginArray: 0, SVGLengthList: 0, SVGNumberList: 0, SVGPathSegList: 0, SVGPointList: 0, SVGStringList: 0, SVGTransformList: 0, SourceBufferList: 0, StyleSheetList: 0, TextTrackCueList: 0, TextTrackList: 0, TouchList: 0 }, xk = Fa("iterator"), fq = Fa("toStringTag"), yk = Gd.values, Zh;
    for (Zh in wk) {
      var gq = R[Zh], id = gq && gq.prototype;
      if (id) {
        if (id[xk] !== yk)
          try {
            kb(id, xk, yk);
          } catch (e) {
            id[xk] = yk;
          }
        if (id[fq] || kb(id, fq, Zh), wk[Zh]) {
          for (var rf in Gd)
            if (id[rf] !== Gd[rf])
              try {
                kb(id, rf, Gd[rf]);
              } catch (e) {
                id[rf] = Gd[rf];
              }
        }
      }
    }
    var hq = Object.is || function(e, t) {
      return e === t ? e !== 0 || 1 / e == 1 / t : e != e && t != t;
    };
    Bh("search", 1, function(e, t, n) {
      return [function(r) {
        var o = Eb(this), i = r == null ? void 0 : r[e];
        return i !== void 0 ? i.call(r, o) : new RegExp(r)[e](String(o));
      }, function(r) {
        var o = n(t, r, this);
        if (o.done)
          return o.value;
        r = Ia(r);
        var i = String(this);
        return o = r.lastIndex, hq(o, 0) || (r.lastIndex = 0), i = ef(r, i), hq(r.lastIndex, o) || (r.lastIndex = o), i === null ? -1 : i.index;
      }];
    }), xb(function(e) {
      (function(t, n) {
        e.exports ? e.exports = n(t) : n(t);
      })(typeof self != "undefined" ? self : Ya, function(t) {
        function n(k) {
          return btoa(k).replace(/=+$/, "").replace(/\+/g, "-").replace(/\//g, "_");
        }
        function r(k) {
          return k = (k += "===").slice(0, -k.length % 4), atob(k.replace(/-/g, "+").replace(/_/g, "/"));
        }
        function o(k) {
          for (var L = new Uint8Array(k.length), T = 0; T < k.length; T++)
            L[T] = k.charCodeAt(T);
          return L;
        }
        function i(k) {
          return k instanceof ArrayBuffer && (k = new Uint8Array(k)), String.fromCharCode.apply(String, k);
        }
        function s(k) {
          var L = { name: (k.name || k || "").toUpperCase().replace("V", "v") };
          switch (L.name) {
            case "SHA-1":
            case "SHA-256":
            case "SHA-384":
            case "SHA-512":
              break;
            case "AES-CBC":
            case "AES-GCM":
            case "AES-KW":
              k.length && (L.length = k.length);
              break;
            case "HMAC":
              k.hash && (L.hash = s(k.hash)), k.length && (L.length = k.length);
              break;
            case "RSAES-PKCS1-v1_5":
              k.publicExponent && (L.publicExponent = new Uint8Array(k.publicExponent)), k.modulusLength && (L.modulusLength = k.modulusLength);
              break;
            case "RSASSA-PKCS1-v1_5":
            case "RSA-OAEP":
              k.hash && (L.hash = s(k.hash)), k.publicExponent && (L.publicExponent = new Uint8Array(k.publicExponent)), k.modulusLength && (L.modulusLength = k.modulusLength);
              break;
            default:
              throw new SyntaxError("Bad algorithm name");
          }
          return L;
        }
        function u(k) {
          return { HMAC: { "SHA-1": "HS1", "SHA-256": "HS256", "SHA-384": "HS384", "SHA-512": "HS512" }, "RSASSA-PKCS1-v1_5": { "SHA-1": "RS1", "SHA-256": "RS256", "SHA-384": "RS384", "SHA-512": "RS512" }, "RSAES-PKCS1-v1_5": { "": "RSA1_5" }, "RSA-OAEP": { "SHA-1": "RSA-OAEP", "SHA-256": "RSA-OAEP-256" }, "AES-KW": { 128: "A128KW", 192: "A192KW", 256: "A256KW" }, "AES-GCM": { 128: "A128GCM", 192: "A192GCM", 256: "A256GCM" }, "AES-CBC": { 128: "A128CBC", 192: "A192CBC", 256: "A256CBC" } }[k.name][(k.hash || {}).name || k.length || ""];
        }
        function a(k) {
          (k instanceof ArrayBuffer || k instanceof Uint8Array) && (k = JSON.parse(decodeURIComponent(escape(i(k)))));
          var L = { kty: k.kty, alg: k.alg, ext: k.ext || k.extractable };
          switch (L.kty) {
            case "oct":
              L.k = k.k;
            case "RSA":
              "n e d p q dp dq qi oth".split(" ").forEach(function(T) {
                T in k && (L[T] = k[T]);
              });
              break;
            default:
              throw new TypeError("Unsupported key type");
          }
          return L;
        }
        function l(k) {
          return k = a(k), q && (k.extractable = k.ext, delete k.ext), o(unescape(encodeURIComponent(JSON.stringify(k)))).buffer;
        }
        function f(k) {
          var L = h(k), T = !1;
          switch (2 < L.length && (T = !0, L.shift()), k = { ext: !0 }, L[0][0]) {
            case "1.2.840.113549.1.1.1":
              var U = "n e d p q dp dq qi".split(" ");
              for (L = h(L[1]), T && L.shift(), T = 0; T < L.length; T++)
                L[T][0] || (L[T] = L[T].subarray(1)), k[U[T]] = n(i(L[T]));
              k.kty = "RSA";
              break;
            default:
              throw new TypeError("Unsupported key type");
          }
          return k;
        }
        function h(k, L) {
          if (k instanceof ArrayBuffer && (k = new Uint8Array(k)), L || (L = { pos: 0, end: k.length }), 2 > L.end - L.pos || L.end > k.length)
            throw new RangeError("Malformed DER");
          var T = k[L.pos++], U = k[L.pos++];
          if (128 <= U) {
            if (U &= 127, L.end - L.pos < U)
              throw new RangeError("Malformed DER");
            for (var O = 0; U--; )
              O <<= 8, O |= k[L.pos++];
            U = O;
          }
          if (L.end - L.pos < U)
            throw new RangeError("Malformed DER");
          switch (T) {
            case 2:
              T = k.subarray(L.pos, L.pos += U);
              break;
            case 3:
              if (k[L.pos++])
                throw Error("Unsupported bit string");
              U--;
            case 4:
              T = new Uint8Array(k.subarray(L.pos, L.pos += U)).buffer;
              break;
            case 5:
              T = null;
              break;
            case 6:
              if (!((k = btoa(i(k.subarray(L.pos, L.pos += U)))) in B))
                throw Error("Unsupported OBJECT ID " + k);
              T = B[k];
              break;
            case 48:
              for (T = [], U = L.pos + U; L.pos < U; )
                T.push(h(k, L));
              break;
            default:
              throw Error("Unsupported DER tag 0x" + T.toString(16));
          }
          return T;
        }
        function d(k, L) {
          L || (L = []);
          var T = L.length + 2;
          if (L.push(0, 0), k instanceof Uint8Array)
            for (var U = 2, O = k.length, _ = 0; _ < O; _++)
              L.push(k[_]);
          else if (k instanceof ArrayBuffer)
            for (U = 4, O = k.byteLength, k = new Uint8Array(k), _ = 0; _ < O; _++)
              L.push(k[_]);
          else if (k === null)
            U = 5, O = 0;
          else if (typeof k == "string" && k in Y)
            for (U = 6, O = (k = o(atob(Y[k]))).length, _ = 0; _ < O; _++)
              L.push(k[_]);
          else if (k instanceof Array) {
            for (_ = 0; _ < k.length; _++)
              d(k[_], L);
            U = 48, O = L.length - T;
          } else {
            if (!(qa(k) === "object" && k.tag === 3 && k.value instanceof ArrayBuffer))
              throw Error("Unsupported DER value " + k);
            for (U = 3, O = (k = new Uint8Array(k.value)).byteLength, L.push(0), _ = 0; _ < O; _++)
              L.push(k[_]);
            O++;
          }
          if (128 <= O) {
            for (_ = O, O = 4, L.splice(T, 0, _ >> 24 & 255, _ >> 16 & 255, _ >> 8 & 255, 255 & _); 1 < O && !(_ >> 24); )
              _ <<= 8, O--;
            4 > O && L.splice(T, 4 - O), O |= 128;
          }
          return L.splice(T - 2, 2, U, O), L;
        }
        function p(k, L, T, U) {
          Object.defineProperties(this, { _key: { value: k }, type: { value: k.type, enumerable: !0 }, extractable: { value: T === void 0 ? k.extractable : T, enumerable: !0 }, algorithm: { value: L === void 0 ? k.algorithm : L, enumerable: !0 }, usages: { value: U === void 0 ? k.usages : U, enumerable: !0 } });
        }
        function v(k) {
          return k === "verify" || k === "encrypt" || k === "wrapKey";
        }
        function y(k) {
          return k === "sign" || k === "decrypt" || k === "unwrapKey";
        }
        if (typeof Promise != "function")
          throw "Promise support required";
        var g = t.crypto || t.msCrypto;
        if (g) {
          var m = g.subtle || g.webkitSubtle;
          if (m) {
            var E = t.Crypto || g.constructor || Object, w = t.SubtleCrypto || m.constructor || Object;
            t.CryptoKey || t.Key;
            var C = -1 < t.navigator.userAgent.indexOf("Edge/"), q = !!t.msCrypto && !C, J = !g.subtle && !!g.webkitSubtle;
            if (q || J) {
              var B = { KoZIhvcNAQEB: "1.2.840.113549.1.1.1" }, Y = { "1.2.840.113549.1.1.1": "KoZIhvcNAQEB" };
              if (["generateKey", "importKey", "unwrapKey"].forEach(function(k) {
                var L = m[k];
                m[k] = function(T, U, O) {
                  var _ = [].slice.call(arguments);
                  switch (k) {
                    case "generateKey":
                      var A = s(T), j = U, F = O;
                      break;
                    case "importKey":
                      A = s(O), j = _[3], F = _[4], T === "jwk" && ((U = a(U)).alg || (U.alg = u(A)), U.key_ops || (U.key_ops = U.kty !== "oct" ? "d" in U ? F.filter(y) : F.filter(v) : F.slice()), _[1] = l(U));
                      break;
                    case "unwrapKey":
                      A = _[4], j = _[5], F = _[6], _[2] = O._key;
                  }
                  if (k === "generateKey" && A.name === "HMAC" && A.hash)
                    return A.length = A.length || { "SHA-1": 512, "SHA-256": 512, "SHA-384": 1024, "SHA-512": 1024 }[A.hash.name], m.importKey("raw", g.getRandomValues(new Uint8Array(A.length + 7 >> 3)), A, j, F);
                  if (J && k === "generateKey" && A.name === "RSASSA-PKCS1-v1_5" && (!A.modulusLength || 2048 <= A.modulusLength))
                    return (T = s(T)).name = "RSAES-PKCS1-v1_5", delete T.hash, m.generateKey(T, !0, ["encrypt", "decrypt"]).then(function(K) {
                      return Promise.all([m.exportKey("jwk", K.publicKey), m.exportKey("jwk", K.privateKey)]);
                    }).then(function(K) {
                      return K[0].alg = K[1].alg = u(A), K[0].key_ops = F.filter(v), K[1].key_ops = F.filter(y), Promise.all([m.importKey("jwk", K[0], A, !0, K[0].key_ops), m.importKey("jwk", K[1], A, j, K[1].key_ops)]);
                    }).then(function(K) {
                      return { publicKey: K[0], privateKey: K[1] };
                    });
                  if ((J || q && (A.hash || {}).name === "SHA-1") && k === "importKey" && T === "jwk" && A.name === "HMAC" && U.kty === "oct")
                    return m.importKey("raw", o(r(U.k)), O, _[3], _[4]);
                  if (J && k === "importKey" && (T === "spki" || T === "pkcs8"))
                    return m.importKey("jwk", f(U), O, _[3], _[4]);
                  if (q && k === "unwrapKey")
                    return m.decrypt(_[3], O, U).then(function(K) {
                      return m.importKey(T, K, _[4], _[5], _[6]);
                    });
                  try {
                    var X = L.apply(m, _);
                  } catch (K) {
                    return Promise.reject(K);
                  }
                  return q && (X = new Promise(function(K, Q) {
                    X.onabort = X.onerror = function($) {
                      Q($);
                    }, X.oncomplete = function($) {
                      K($.target.result);
                    };
                  })), X = X.then(function(K) {
                    return A.name !== "HMAC" || A.length || (A.length = 8 * K.algorithm.length), A.name.search("RSA") == 0 && (A.modulusLength || (A.modulusLength = (K.publicKey || K).algorithm.modulusLength), A.publicExponent || (A.publicExponent = (K.publicKey || K).algorithm.publicExponent)), K.publicKey && K.privateKey ? { publicKey: new p(K.publicKey, A, j, F.filter(v)), privateKey: new p(K.privateKey, A, j, F.filter(y)) } : new p(K, A, j, F);
                  });
                };
              }), ["exportKey", "wrapKey"].forEach(function(k) {
                var L = m[k];
                m[k] = function(T, U, O) {
                  var _ = [].slice.call(arguments);
                  switch (k) {
                    case "exportKey":
                      _[1] = U._key;
                      break;
                    case "wrapKey":
                      _[1] = U._key, _[2] = O._key;
                  }
                  if ((J || q && (U.algorithm.hash || {}).name === "SHA-1") && k === "exportKey" && T === "jwk" && U.algorithm.name === "HMAC" && (_[0] = "raw"), !J || k !== "exportKey" || T !== "spki" && T !== "pkcs8" || (_[0] = "jwk"), q && k === "wrapKey")
                    return m.exportKey(T, U).then(function(j) {
                      return T === "jwk" && (j = o(unescape(encodeURIComponent(JSON.stringify(a(j)))))), m.encrypt(_[3], O, j);
                    });
                  try {
                    var A = L.apply(m, _);
                  } catch (j) {
                    return Promise.reject(j);
                  }
                  return q && (A = new Promise(function(j, F) {
                    A.onabort = A.onerror = function(X) {
                      F(X);
                    }, A.oncomplete = function(X) {
                      j(X.target.result);
                    };
                  })), k === "exportKey" && T === "jwk" && (A = A.then(function(j) {
                    return (J || q && (U.algorithm.hash || {}).name === "SHA-1") && U.algorithm.name === "HMAC" ? { kty: "oct", alg: u(U.algorithm), key_ops: U.usages.slice(), ext: !0, k: n(i(j)) } : ((j = a(j)).alg || (j.alg = u(U.algorithm)), j.key_ops || (j.key_ops = U.type === "public" ? U.usages.filter(v) : U.type === "private" ? U.usages.filter(y) : U.usages.slice()), j);
                  })), !J || k !== "exportKey" || T !== "spki" && T !== "pkcs8" || (A = A.then(function(j) {
                    var F = [["", null]], X = !1;
                    switch ((j = a(j)).kty) {
                      case "RSA":
                        for (var K = "n e d p q dp dq qi".split(" "), Q = [], $ = 0; $ < K.length && K[$] in j; $++) {
                          var _t = Q[$] = o(r(j[K[$]]));
                          128 & _t[0] && (Q[$] = new Uint8Array(_t.length + 1), Q[$].set(_t, 1));
                        }
                        2 < Q.length && (X = !0, Q.unshift(new Uint8Array([0]))), F[0][0] = "1.2.840.113549.1.1.1";
                        break;
                      default:
                        throw new TypeError("Unsupported key type");
                    }
                    return F.push(new Uint8Array(d(Q)).buffer), X ? F.unshift(new Uint8Array([0])) : F[1] = { tag: 3, value: F[1] }, new Uint8Array(d(F)).buffer;
                  })), A;
                };
              }), ["encrypt", "decrypt", "sign", "verify"].forEach(function(k) {
                var L = m[k];
                m[k] = function(T, U, O, _) {
                  if (q && (!O.byteLength || _ && !_.byteLength))
                    throw Error("Empty input is not allowed");
                  var A = [].slice.call(arguments), j = s(T);
                  if (!q || k !== "sign" && k !== "verify" || T !== "RSASSA-PKCS1-v1_5" && T !== "HMAC" || (A[0] = { name: T }), q && U.algorithm.hash && (A[0].hash = A[0].hash || U.algorithm.hash), q && k === "decrypt" && j.name === "AES-GCM") {
                    var F = T.tagLength >> 3;
                    A[2] = (O.buffer || O).slice(0, O.byteLength - F), T.tag = (O.buffer || O).slice(O.byteLength - F);
                  }
                  q && j.name === "AES-GCM" && A[0].tagLength === void 0 && (A[0].tagLength = 128), A[1] = U._key;
                  try {
                    var X = L.apply(m, A);
                  } catch (K) {
                    return Promise.reject(K);
                  }
                  return q && (X = new Promise(function(K, Q) {
                    X.onabort = X.onerror = function($) {
                      Q($);
                    }, X.oncomplete = function($) {
                      if ($ = $.target.result, k === "encrypt" && $ instanceof AesGcmEncryptResult) {
                        var _t = $.ciphertext, _n = $.tag;
                        ($ = new Uint8Array(_t.byteLength + _n.byteLength)).set(new Uint8Array(_t), 0), $.set(new Uint8Array(_n), _t.byteLength), $ = $.buffer;
                      }
                      K($);
                    };
                  })), X;
                };
              }), q) {
                var _e = m.digest;
                m.digest = function(k, L) {
                  if (!L.byteLength)
                    throw Error("Empty input is not allowed");
                  try {
                    var T = _e.call(m, k, L);
                  } catch (U) {
                    return Promise.reject(U);
                  }
                  return T = new Promise(function(U, O) {
                    T.onabort = T.onerror = function(_) {
                      O(_);
                    }, T.oncomplete = function(_) {
                      U(_.target.result);
                    };
                  });
                }, t.crypto = Object.create(g, { getRandomValues: { value: function(k) {
                  return g.getRandomValues(k);
                } }, subtle: { value: m } }), t.CryptoKey = p;
              }
              J && (g.subtle = m, t.Crypto = E, t.SubtleCrypto = w, t.CryptoKey = p);
            }
          }
        }
      });
    }), function(e) {
      e.console || (e.console = {}), e = e.console;
      for (var t, n = function() {
      }, r = ["memory"], o = "assert clear count debug dir dirxml error exception group groupCollapsed groupEnd info log markTimeline profile profiles profileEnd show table time timeEnd timeline timelineEnd timeStamp trace warn".split(" "); t = r.pop(); )
        e[t] || (e[t] = {});
      for (; t = o.pop(); )
        e[t] || (e[t] = n);
    }(typeof window == "undefined" ? Ya : window), ea({ target: "Object", stat: !0 }, { setPrototypeOf: tb });
    var uy = la(function() {
      uc(1);
    });
    ea({ target: "Object", stat: !0, forced: uy, sham: !Oo }, { getPrototypeOf: function(e) {
      return uc(pb(e));
    } });
    var iq = [].slice, zk = {}, vy = Function.bind || function(e) {
      var t = Wb(this), n = iq.call(arguments, 1), r = function() {
        var o = n.concat(iq.call(arguments));
        if (this instanceof r) {
          var i = o.length;
          if (!(i in zk)) {
            for (var s = [], u = 0; u < i; u++)
              s[u] = "a[" + u + "]";
            zk[i] = Function("C,a", "return new C(" + s.join(",") + ")");
          }
          o = zk[i](t, o);
        } else
          o = t.apply(e, o);
        return o;
      };
      return xa(t.prototype) && (r.prototype = t.prototype), r;
    }, Ak = Pc("Reflect", "construct"), jq = la(function() {
      function e() {
      }
      return !(Ak(function() {
      }, [], e) instanceof e);
    }), kq = !la(function() {
      Ak(function() {
      });
    }), lq = jq || kq;
    ea({ target: "Reflect", stat: !0, forced: lq, sham: lq }, { construct: function(e, t) {
      Wb(e), Ia(t);
      var n = 3 > arguments.length ? e : Wb(arguments[2]);
      if (kq && !jq)
        return Ak(e, t, n);
      if (e == n) {
        switch (t.length) {
          case 0:
            return new e();
          case 1:
            return new e(t[0]);
          case 2:
            return new e(t[0], t[1]);
          case 3:
            return new e(t[0], t[1], t[2]);
          case 4:
            return new e(t[0], t[1], t[2], t[3]);
        }
        return (n = [null]).push.apply(n, t), new (vy.apply(e, n))();
      }
      n = n.prototype, n = jc(xa(n) ? n : Object.prototype);
      var r = Function.apply.call(e, n, t);
      return xa(r) ? r : n;
    } }), ea({ target: "Reflect", stat: !0 }, { get: Am });
    var mq = dc.f, wy = la(function() {
      mq(1);
    });
    ea({ target: "Object", stat: !0, forced: !wa || wy, sham: !wa }, { getOwnPropertyDescriptor: function(e, t) {
      return mq(Mb(e), t);
    } });
    var nq = de.f, xy = {}.toString, oq = typeof window == "object" && window && Object.getOwnPropertyNames ? Object.getOwnPropertyNames(window) : [], Bk = function(e) {
      if (oq && xy.call(e) == "[object Window]")
        try {
          var t = nq(e);
        } catch (n) {
          t = oq.slice();
        }
      else
        t = nq(Mb(e));
      return t;
    }, pq = { f: Fa }, yy = qb.f, $h = function(e) {
      var t = R.Symbol || (R.Symbol = {});
      ka(t, e) || yy(t, e, { value: pq.f(e) });
    }, Nb = xh("hidden"), qq = Fa("toPrimitive"), zy = cb.set, rq = cb.getterFor("Symbol"), kc = Object.prototype, Ob = R.Symbol, yg = Pc("JSON", "stringify"), sq = dc.f, Jd = qb.f, tq = Bk, Ay = eg, jd = Ad("symbols"), zg = Ad("op-symbols"), Ck = Ad("string-to-symbol-registry"), Dk = Ad("symbol-to-string-registry"), By = Ad("wks"), Ek = R.QObject, Fk = !Ek || !Ek.prototype || !Ek.prototype.findChild, Gk = wa && la(function() {
      return jc(Jd({}, "a", { get: function() {
        return Jd(this, "a", { value: 7 }).a;
      } })).a != 7;
    }) ? function(e, t, n) {
      var r = sq(kc, t);
      r && delete kc[t], Jd(e, t, n), r && e !== kc && Jd(kc, t, r);
    } : Jd, Hk = function(e, t) {
      var n = jd[e] = jc(Ob.prototype);
      return zy(n, { type: "Symbol", tag: e, description: t }), wa || (n.description = t), n;
    }, Ik = zo ? function(e) {
      return typeof e == "symbol";
    } : function(e) {
      return Object(e) instanceof Ob;
    }, ai = function(e, t, n) {
      return e === kc && ai(zg, t, n), Ia(e), t = Oc(t, !0), Ia(n), ka(jd, t) ? (n.enumerable ? (ka(e, Nb) && e[Nb][t] && (e[Nb][t] = !1), n = jc(n, { enumerable: Nc(0, !1) })) : (ka(e, Nb) || Jd(e, Nb, Nc(1, {})), e[Nb][t] = !0), Gk(e, t, n)) : Jd(e, t, n);
    }, uq = function(e, t) {
      Ia(e);
      var n = Mb(t);
      return t = ed(n).concat(Jk(n)), fe(t, function(r) {
        wa && !Kk.call(n, r) || ai(e, r, n[r]);
      }), e;
    }, Kk = function(e) {
      e = Oc(e, !0);
      var t = Ay.call(this, e);
      return !(this === kc && ka(jd, e) && !ka(zg, e)) && (!(t || !ka(this, e) || !ka(jd, e) || ka(this, Nb) && this[Nb][e]) || t);
    }, vq = function(e, t) {
      if (e = Mb(e), t = Oc(t, !0), e !== kc || !ka(jd, t) || ka(zg, t)) {
        var n = sq(e, t);
        return !n || !ka(jd, t) || ka(e, Nb) && e[Nb][t] || (n.enumerable = !0), n;
      }
    }, wq = function(e) {
      e = tq(Mb(e));
      var t = [];
      return fe(e, function(n) {
        ka(jd, n) || ka(bf, n) || t.push(n);
      }), t;
    }, Jk = function(e) {
      var t = e === kc;
      e = tq(t ? zg : Mb(e));
      var n = [];
      return fe(e, function(r) {
        !ka(jd, r) || t && !ka(kc, r) || n.push(jd[r]);
      }), n;
    };
    if (Sc || (Ob = function() {
      if (this instanceof Ob)
        throw TypeError("Symbol is not a constructor");
      var e = arguments.length && arguments[0] !== void 0 ? String(arguments[0]) : void 0, t = af(e), n = function(r) {
        this === kc && n.call(zg, r), ka(this, Nb) && ka(this[Nb], t) && (this[Nb][t] = !1), Gk(this, t, Nc(1, r));
      };
      return wa && Fk && Gk(kc, t, { configurable: !0, set: n }), Hk(t, e);
    }, Za(Ob.prototype, "toString", function() {
      return rq(this).tag;
    }), Za(Ob, "withoutSetter", function(e) {
      return Hk(af(e), e);
    }), eg = Kk, qb.f = ai, dc.f = vq, de.f = Bk = wq, gg.f = Jk, pq.f = function(e) {
      return Hk(Fa(e), e);
    }, wa && (Jd(Ob.prototype, "description", { configurable: !0, get: function() {
      return rq(this).description;
    } }), Za(kc, "propertyIsEnumerable", Kk, { unsafe: !0 }))), ea({ global: !0, wrap: !0, forced: !Sc, sham: !Sc }, { Symbol: Ob }), fe(ed(By), function(e) {
      $h(e);
    }), ea({ target: "Symbol", stat: !0, forced: !Sc }, { for: function(e) {
      if (e = String(e), ka(Ck, e))
        return Ck[e];
      var t = Ob(e);
      return Ck[e] = t, Dk[t] = e, t;
    }, keyFor: function(e) {
      if (!Ik(e))
        throw TypeError(e + " is not a symbol");
      if (ka(Dk, e))
        return Dk[e];
    }, useSetter: function() {
      Fk = !0;
    }, useSimple: function() {
      Fk = !1;
    } }), ea({ target: "Object", stat: !0, forced: !Sc, sham: !wa }, { create: function(e, t) {
      return t === void 0 ? jc(e) : uq(jc(e), t);
    }, defineProperty: ai, defineProperties: uq, getOwnPropertyDescriptor: vq }), ea({ target: "Object", stat: !0, forced: !Sc }, { getOwnPropertyNames: wq, getOwnPropertySymbols: Jk }), ea({ target: "Object", stat: !0, forced: la(function() {
      gg.f(1);
    }) }, { getOwnPropertySymbols: function(e) {
      return gg.f(pb(e));
    } }), yg) {
      var Cy = !Sc || la(function() {
        var e = Ob();
        return yg([e]) != "[null]" || yg({ a: e }) != "{}" || yg(Object(e)) != "{}";
      });
      ea({ target: "JSON", stat: !0, forced: Cy }, { stringify: function(e, t, n) {
        for (var r, o = [e], i = 1; arguments.length > i; )
          o.push(arguments[i++]);
        if (r = t, (xa(t) || e !== void 0) && !Ik(e))
          return Ed(t) || (t = function(s, u) {
            if (typeof r == "function" && (u = r.call(this, s, u)), !Ik(u))
              return u;
          }), o[1] = t, yg.apply(null, o);
      } });
    }
    Ob.prototype[qq] || kb(Ob.prototype, qq, Ob.prototype.valueOf), zc(Ob, "Symbol"), bf[Nb] = !0;
    var Dy = qb.f, kd = R.Symbol;
    if (wa && typeof kd == "function" && (!("description" in kd.prototype) || kd().description !== void 0)) {
      var xq = {}, Ag = function() {
        var e = 1 > arguments.length || arguments[0] === void 0 ? void 0 : String(arguments[0]), t = this instanceof Ag ? new kd(e) : e === void 0 ? kd() : kd(e);
        return e === "" && (xq[t] = !0), t;
      };
      to(Ag, kd);
      var Lk = Ag.prototype = kd.prototype;
      Lk.constructor = Ag;
      var Ey = Lk.toString, Fy = String(kd("test")) == "Symbol(test)", Gy = /^Symbol\((.*)\)[^)]+$/;
      Dy(Lk, "description", { configurable: !0, get: function() {
        var e = xa(this) ? this.valueOf() : this, t = Ey.call(e);
        return ka(xq, e) ? "" : (e = Fy ? t.slice(7, -1) : t.replace(Gy, "$1")) === "" ? void 0 : e;
      } }), ea({ global: !0, forced: !0 }, { Symbol: Ag });
    }
    $h("toStringTag"), zc(R.JSON, "JSON", !0), zc(Math, "Math", !0), function() {
      function e(h, d) {
        if (!(h instanceof d))
          throw new TypeError("Cannot call a class as a function");
      }
      function t(h, d) {
        for (var p = 0; p < d.length; p++) {
          var v = d[p];
          v.enumerable = v.enumerable || !1, v.configurable = !0, "value" in v && (v.writable = !0), Object.defineProperty(h, v.key, v);
        }
      }
      function n(h, d, p) {
        return d && t(h.prototype, d), p && t(h, p), h;
      }
      function r(h) {
        return (r = Object.setPrototypeOf ? Object.getPrototypeOf : function(d) {
          return d.__proto__ || Object.getPrototypeOf(d);
        })(h);
      }
      function o(h, d) {
        return (o = Object.setPrototypeOf || function(p, v) {
          return p.__proto__ = v, p;
        })(h, d);
      }
      function i(h) {
        if (h === void 0)
          throw new ReferenceError("this hasn't been initialised - super() hasn't been called");
        return h;
      }
      function s(h) {
        var d = function() {
          if (typeof Reflect == "undefined" || !Reflect.construct || Reflect.construct.sham)
            return !1;
          if (typeof Proxy == "function")
            return !0;
          try {
            return Boolean.prototype.valueOf.call(Reflect.construct(Boolean, [], function() {
            })), !0;
          } catch (p) {
            return !1;
          }
        }();
        return function() {
          var p = r(h);
          if (d) {
            var v = r(this).constructor;
            p = Reflect.construct(p, arguments, v);
          } else
            p = p.apply(this, arguments);
          return p = !p || qa(p) !== "object" && typeof p != "function" ? i(this) : p;
        };
      }
      function u(h, d, p) {
        return (u = typeof Reflect != "undefined" && Reflect.get ? Reflect.get : function(v, y, g) {
          for (; !Object.prototype.hasOwnProperty.call(v, y) && (v = r(v)) !== null; )
            ;
          if (v)
            return (y = Object.getOwnPropertyDescriptor(v, y)).get ? y.get.call(g) : y.value;
        })(h, d, p || h);
      }
      var a = function() {
        function h() {
          e(this, h), Object.defineProperty(this, "listeners", { value: {}, writable: !0, configurable: !0 });
        }
        return n(h, [{ key: "addEventListener", value: function(d, p, v) {
          d in this.listeners || (this.listeners[d] = []), this.listeners[d].push({ callback: p, options: v });
        } }, { key: "removeEventListener", value: function(d, p) {
          if (d in this.listeners) {
            for (var v = 0, y = (d = this.listeners[d]).length; v < y; v++)
              if (d[v].callback === p) {
                d.splice(v, 1);
                break;
              }
          }
        } }, { key: "dispatchEvent", value: function(d) {
          if (d.type in this.listeners) {
            for (var p = this.listeners[d.type].slice(), v = 0, y = p.length; v < y; v++) {
              var g = p[v];
              try {
                g.callback.call(this, d);
              } catch (m) {
                Promise.resolve().then(function() {
                  throw m;
                });
              }
              g.options && g.options.once && this.removeEventListener(d.type, g.callback);
            }
            return !d.defaultPrevented;
          }
        } }]), h;
      }(), l = function(h) {
        function d() {
          e(this, d);
          var v = p.call(this);
          return v.listeners || a.call(i(v)), Object.defineProperty(i(v), "aborted", { value: !1, writable: !0, configurable: !0 }), Object.defineProperty(i(v), "onabort", { value: null, writable: !0, configurable: !0 }), v;
        }
        (function(v, y) {
          if (typeof y != "function" && y !== null)
            throw new TypeError("Super expression must either be null or a function");
          v.prototype = Object.create(y && y.prototype, { constructor: { value: v, writable: !0, configurable: !0 } }), y && o(v, y);
        })(d, h);
        var p = s(d);
        return n(d, [{ key: "toString", value: function() {
          return "[object AbortSignal]";
        } }, { key: "dispatchEvent", value: function(v) {
          v.type === "abort" && (this.aborted = !0, typeof this.onabort == "function" && this.onabort.call(this, v)), u(r(d.prototype), "dispatchEvent", this).call(this, v);
        } }]), d;
      }(a), f = function() {
        function h() {
          e(this, h), Object.defineProperty(this, "signal", { value: new l(), writable: !0, configurable: !0 });
        }
        return n(h, [{ key: "abort", value: function() {
          try {
            var d = new Event("abort");
          } catch (p) {
            typeof document != "undefined" ? document.createEvent ? (d = document.createEvent("Event")).initEvent("abort", !1, !1) : (d = document.createEventObject()).type = "abort" : d = { type: "abort", bubbles: !1, cancelable: !1 };
          }
          this.signal.dispatchEvent(d);
        } }, { key: "toString", value: function() {
          return "[object AbortController]";
        } }]), h;
      }();
      typeof Symbol != "undefined" && Symbol.toStringTag && (f.prototype[Symbol.toStringTag] = "AbortController", l.prototype[Symbol.toStringTag] = "AbortSignal"), function(h) {
        if (h.__FORCE_INSTALL_ABORTCONTROLLER_POLYFILL) {
          console.log("__FORCE_INSTALL_ABORTCONTROLLER_POLYFILL=true is set, will force install polyfill");
          var d = !0;
        } else
          d = typeof h.Request == "function" && !h.Request.prototype.hasOwnProperty("signal") || !h.AbortController;
        d && (h.AbortController = f, h.AbortSignal = l);
      }(typeof self != "undefined" ? self : Ya);
    }();
    var Hy = Math.floor, Iy = Math.log, Jy = Math.LOG2E;
    ea({ target: "Math", stat: !0 }, { clz32: function(e) {
      return (e >>>= 0) ? 31 - Hy(Iy(e + 0.5) * Jy) : 32;
    } });
    var Ky = Math.log, Ly = Math.LN2, cu = Math.clz32 || function(e) {
      return 31 - Ky(e >>> 0) / Ly | 0;
    }, Ud = String.fromCharCode, yq = {}.toString, Mk = window.Uint8Array, Nk = Mk || Array, My = yq.call((window.ArrayBuffer || Nk).prototype), Ok;
    Bm.prototype.decode = function(e) {
      if (e = e && e.buffer || e, yq.call(e) !== My)
        throw Error("Failed to execute 'decode' on 'TextDecoder': The provided value is not of type '(ArrayBuffer or ArrayBufferView)'");
      for (var t = "", n = 0, r = 0 | (e = Mk ? new Nk(e) : e).length; n < r; n = n + 32768 | 0)
        t += Ud.apply(0, e[Mk ? "slice" : "subarray"](n, n + 32768 | 0));
      return t.replace(/[\xc0-\xff][\x80-\xbf]*/g, bu);
    }, window.TextDecoder || (window.TextDecoder = Bm), Cm.prototype.encode = function(e) {
      for (var t = 0 | (e = e === void 0 ? "" : ("" + e).replace(/[\x80-\uD7ff\uDC00-\uFFFF]|[\uD800-\uDBFF][\uDC00-\uDFFF]?/g, du)).length, n = new Nk(t), r = 0; r < t; r = r + 1 | 0)
        n[r] = e.charCodeAt(r);
      return n;
    }, window.TextEncoder || (window.TextEncoder = Cm), function(e) {
      var t, n, r, o, i, s, u, a, l, f, h, d;
      (n = t || (t = {})).LOGIN = "LOGIN", n.LOGIN_SUCCESS = "LOGIN_SUCCESS", n.LOGIN_FAILURE = "LOGIN_FAILURE", n.LOGIN_TIMEOUT = "LOGIN_TIMEOUT", n.INTERRUPTED = "INTERRUPTED", n.LOGOUT = "LOGOUT", n.BANNED_BY_SERVER = "BANNED_BY_SERVER", n.REMOTE_LOGIN = "REMOTE_LOGIN", n.TOKEN_EXPIRED = "TOKEN_EXPIRED", e.ConnectionChangeReason = t, function(p) {
        p.DISCONNECTED = "DISCONNECTED", p.CONNECTING = "CONNECTING", p.CONNECTED = "CONNECTED", p.RECONNECTING = "RECONNECTING", p.ABORTED = "ABORTED";
      }(r || (r = {})), e.ConnectionState = r, function(p) {
        p.IDLE = "IDLE", p.SENT_TO_REMOTE = "SENT_TO_REMOTE", p.RECEIVED_BY_REMOTE = "RECEIVED_BY_REMOTE", p.ACCEPTED_BY_REMOTE = "ACCEPTED_BY_REMOTE", p.REFUSED_BY_REMOTE = "REFUSED_BY_REMOTE", p.CANCELED = "CANCELED", p.FAILURE = "FAILURE";
      }(o || (o = {})), e.LocalInvitationState = o, function(p) {
        p.INVITATION_RECEIVED = "INVITATION_RECEIVED", p.ACCEPT_SENT_TO_LOCAL = "ACCEPT_SENT_TO_LOCAL", p.REFUSED = "REFUSED", p.ACCEPTED = "ACCEPTED", p.CANCELED = "CANCELED", p.FAILURE = "FAILURE";
      }(i || (i = {})), e.RemoteInvitationState = i, function(p) {
        p.UNKNOWN = "UNKNOWN", p.PEER_NO_RESPONSE = "PEER_NO_RESPONSE", p.INVITATION_EXPIRE = "INVITATION_EXPIRE", p.PEER_OFFLINE = "PEER_OFFLINE", p.NOT_LOGGEDIN = "NOT_LOGGEDIN";
      }(s || (s = {})), e.LocalInvitationFailureReason = s, function(p) {
        p.UNKNOWN = "UNKNOWN", p.PEER_OFFLINE = "PEER_OFFLINE", p.ACCEPT_FAILURE = "ACCEPT_FAILURE", p.INVITATION_EXPIRE = "INVITATION_EXPIRE";
      }(u || (u = {})), e.RemoteInvitationFailureReason = u, function(p) {
        p.ONLINE = "ONLINE", p.UNREACHABLE = "UNREACHABLE", p.OFFLINE = "OFFLINE";
      }(a || (a = {})), e.PeerOnlineState = a, (l || (l = {})).ONLINE_STATUS = "ONLINE_STATUS", e.PeerSubscriptionOption = l, function(p) {
        p.TEXT = "TEXT", p.RAW = "RAW";
      }(f || (f = {})), e.MessageType = f, function(p) {
        p.CN = "CN", p.NA = "NA", p.EU = "EU", p.AS = "AS", p.JP = "JP", p.IN = "IN", p.GLOB = "GLOB", p.OC = "OC", p.SA = "SA", p.AF = "AF", p.OVS = "OVS";
      }(h || (h = {})), e.LegacyAreaCode = h, function(p) {
        p.GLOBAL = "GLOBAL", p.INDIA = "INDIA", p.JAPAN = "JAPAN", p.ASIA = "ASIA", p.EUROPE = "EUROPE", p.CHINA = "CHINA", p.NORTH_AMERICA = "NORTH_AMERICA";
      }(d || (d = {})), e.AreaCode = d;
    }(Ok || (Ok = {}));
    var ta = Ok;
    ea({ target: "Array", proto: !0 }, { includes: function(e) {
      return qo(this, e, 1 < arguments.length ? arguments[1] : void 0);
    } }), ng("includes");
    var Pk = function(e) {
      if (Lj(e))
        throw TypeError("The method doesn't accept regular expressions");
      return e;
    }, Ny = Fa("match"), Qk = function(e) {
      var t = /./;
      try {
        "/./"[e](t);
      } catch (n) {
        try {
          return t[Ny] = !1, "/./"[e](t);
        } catch (r) {
        }
      }
      return !1;
    };
    ea({ target: "String", proto: !0, forced: !Qk("includes") }, { includes: function(e) {
      return !!~String(Eb(this)).indexOf(Pk(e), 1 < arguments.length ? arguments[1] : void 0);
    } });
    var Ec = { RECONNECTING_AP_INTERVAL: 2500, RECONNECTING_AP_NUM: 2, DISABLE_MESSAGE_COMPRESSION: !1, LOG_UPLOAD_INTERVAL: 3e3, LOG_HANDLER: void 0, ENABLE_EDGE_AUTO_FALLBACK: !0 };
    $h("iterator"), $h("asyncIterator");
    var Rk = ff("forEach") ? [].forEach : function(e) {
      return fe(this, e, 1 < arguments.length ? arguments[1] : void 0);
    }, zq;
    for (zq in wk) {
      var Aq = R[zq], bi = Aq && Aq.prototype;
      if (bi && bi.forEach !== Rk)
        try {
          kb(bi, "forEach", Rk);
        } catch (e) {
          bi.forEach = Rk;
        }
    }
    var Oy = [].reverse, Bq = [1, 2];
    ea({ target: "Array", proto: !0, forced: String(Bq) === String(Bq.reverse()) }, { reverse: function() {
      return Ed(this) && (this.length = this.length), Oy.call(this);
    } });
    var N = xb(function(e) {
      e = function(t) {
        function n(O, _, A) {
          return Object.defineProperty(O, _, { value: A, enumerable: !0, configurable: !0, writable: !0 }), O[_];
        }
        function r(O, _, A, j) {
          return _ = Object.create((_ && _.prototype instanceof i ? _ : i).prototype), j = new p(j || []), _._invoke = function(F, X, K) {
            var Q = B;
            return function($, _t) {
              if (Q === _e)
                throw Error("Generator is already running");
              if (Q === k) {
                if ($ === "throw")
                  throw _t;
                return y();
              }
              for (K.method = $, K.arg = _t; ; ) {
                if (($ = K.delegate) && ($ = f($, K))) {
                  if ($ === L)
                    continue;
                  return $;
                }
                if (K.method === "next")
                  K.sent = K._sent = K.arg;
                else if (K.method === "throw") {
                  if (Q === B)
                    throw Q = k, K.arg;
                  K.dispatchException(K.arg);
                } else
                  K.method === "return" && K.abrupt("return", K.arg);
                if (Q = _e, ($ = o(F, X, K)).type === "normal") {
                  if (Q = K.done ? k : Y, $.arg === L)
                    continue;
                  return { value: $.arg, done: K.done };
                }
                $.type === "throw" && (Q = k, K.method = "throw", K.arg = $.arg);
              }
            };
          }(O, A, j), _;
        }
        function o(O, _, A) {
          try {
            return { type: "normal", arg: O.call(_, A) };
          } catch (j) {
            return { type: "throw", arg: j };
          }
        }
        function i() {
        }
        function s() {
        }
        function u() {
        }
        function a(O) {
          ["next", "throw", "return"].forEach(function(_) {
            n(O, _, function(A) {
              return this._invoke(_, A);
            });
          });
        }
        function l(O, _) {
          function A(F, X, K, Q) {
            if ((F = o(O[F], O, X)).type !== "throw") {
              var $ = F.arg;
              return (F = $.value) && qa(F) === "object" && E.call(F, "__await") ? _.resolve(F.__await).then(function(_t) {
                A("next", _t, K, Q);
              }, function(_t) {
                A("throw", _t, K, Q);
              }) : _.resolve(F).then(function(_t) {
                $.value = _t, K($);
              }, function(_t) {
                return A("throw", _t, K, Q);
              });
            }
            Q(F.arg);
          }
          var j;
          this._invoke = function(F, X) {
            function K() {
              return new _(function(Q, $) {
                A(F, X, Q, $);
              });
            }
            return j = j ? j.then(K, K) : K();
          };
        }
        function f(O, _) {
          var A = O.iterator[_.method];
          if (A === g) {
            if (_.delegate = null, _.method === "throw") {
              if (O.iterator.return && (_.method = "return", _.arg = g, f(O, _), _.method === "throw"))
                return L;
              _.method = "throw", _.arg = new TypeError("The iterator does not provide a 'throw' method");
            }
            return L;
          }
          return (A = o(A, O.iterator, _.arg)).type === "throw" ? (_.method = "throw", _.arg = A.arg, _.delegate = null, L) : (A = A.arg) ? A.done ? (_[O.resultName] = A.value, _.next = O.nextLoc, _.method !== "return" && (_.method = "next", _.arg = g), _.delegate = null, L) : A : (_.method = "throw", _.arg = new TypeError("iterator result is not an object"), _.delegate = null, L);
        }
        function h(O) {
          var _ = { tryLoc: O[0] };
          1 in O && (_.catchLoc = O[1]), 2 in O && (_.finallyLoc = O[2], _.afterLoc = O[3]), this.tryEntries.push(_);
        }
        function d(O) {
          var _ = O.completion || {};
          _.type = "normal", delete _.arg, O.completion = _;
        }
        function p(O) {
          this.tryEntries = [{ tryLoc: "root" }], O.forEach(h, this), this.reset(!0);
        }
        function v(O) {
          if (O) {
            var _ = O[C];
            if (_)
              return _.call(O);
            if (typeof O.next == "function")
              return O;
            if (!isNaN(O.length)) {
              var A = -1;
              return (_ = function j() {
                for (; ++A < O.length; )
                  if (E.call(O, A))
                    return j.value = O[A], j.done = !1, j;
                return j.value = g, j.done = !0, j;
              }).next = _;
            }
          }
          return { next: y };
        }
        function y() {
          return { value: g, done: !0 };
        }
        var g, m = Object.prototype, E = m.hasOwnProperty, w = typeof Symbol == "function" ? Symbol : {}, C = w.iterator || "@@iterator", q = w.asyncIterator || "@@asyncIterator", J = w.toStringTag || "@@toStringTag";
        try {
          n({}, "");
        } catch (O) {
          n = function(_, A, j) {
            return _[A] = j;
          };
        }
        t.wrap = r;
        var B = "suspendedStart", Y = "suspendedYield", _e = "executing", k = "completed", L = {};
        n(w = {}, C, function() {
          return this;
        });
        var T = Object.getPrototypeOf;
        (T = T && T(T(v([])))) && T !== m && E.call(T, C) && (w = T);
        var U = u.prototype = i.prototype = Object.create(w);
        return s.prototype = u, n(U, "constructor", u), n(u, "constructor", s), s.displayName = n(u, J, "GeneratorFunction"), t.isGeneratorFunction = function(O) {
          return !!(O = typeof O == "function" && O.constructor) && (O === s || (O.displayName || O.name) === "GeneratorFunction");
        }, t.mark = function(O) {
          return Object.setPrototypeOf ? Object.setPrototypeOf(O, u) : (O.__proto__ = u, n(O, J, "GeneratorFunction")), O.prototype = Object.create(U), O;
        }, t.awrap = function(O) {
          return { __await: O };
        }, a(l.prototype), n(l.prototype, q, function() {
          return this;
        }), t.AsyncIterator = l, t.async = function(O, _, A, j, F) {
          F === void 0 && (F = Promise);
          var X = new l(r(O, _, A, j), F);
          return t.isGeneratorFunction(_) ? X : X.next().then(function(K) {
            return K.done ? K.value : X.next();
          });
        }, a(U), n(U, J, "Generator"), n(U, C, function() {
          return this;
        }), n(U, "toString", function() {
          return "[object Generator]";
        }), t.keys = function(O) {
          var _, A = [];
          for (_ in O)
            A.push(_);
          return A.reverse(), function j() {
            for (; A.length; ) {
              var F = A.pop();
              if (F in O)
                return j.value = F, j.done = !1, j;
            }
            return j.done = !0, j;
          };
        }, t.values = v, p.prototype = { constructor: p, reset: function(O) {
          if (this.next = this.prev = 0, this.sent = this._sent = g, this.done = !1, this.delegate = null, this.method = "next", this.arg = g, this.tryEntries.forEach(d), !O)
            for (var _ in this)
              _.charAt(0) === "t" && E.call(this, _) && !isNaN(+_.slice(1)) && (this[_] = g);
        }, stop: function() {
          this.done = !0;
          var O = this.tryEntries[0].completion;
          if (O.type === "throw")
            throw O.arg;
          return this.rval;
        }, dispatchException: function(O) {
          function _($, _t) {
            return X.type = "throw", X.arg = O, A.next = $, _t && (A.method = "next", A.arg = g), !!_t;
          }
          if (this.done)
            throw O;
          for (var A = this, j = this.tryEntries.length - 1; 0 <= j; --j) {
            var F = this.tryEntries[j], X = F.completion;
            if (F.tryLoc === "root")
              return _("end");
            if (F.tryLoc <= this.prev) {
              var K = E.call(F, "catchLoc"), Q = E.call(F, "finallyLoc");
              if (K && Q) {
                if (this.prev < F.catchLoc)
                  return _(F.catchLoc, !0);
                if (this.prev < F.finallyLoc)
                  return _(F.finallyLoc);
              } else if (K) {
                if (this.prev < F.catchLoc)
                  return _(F.catchLoc, !0);
              } else {
                if (!Q)
                  throw Error("try statement without catch or finally");
                if (this.prev < F.finallyLoc)
                  return _(F.finallyLoc);
              }
            }
          }
        }, abrupt: function(O, _) {
          for (var A = this.tryEntries.length - 1; 0 <= A; --A) {
            var j = this.tryEntries[A];
            if (j.tryLoc <= this.prev && E.call(j, "finallyLoc") && this.prev < j.finallyLoc) {
              var F = j;
              break;
            }
          }
          return F && (O === "break" || O === "continue") && F.tryLoc <= _ && _ <= F.finallyLoc && (F = null), (A = F ? F.completion : {}).type = O, A.arg = _, F ? (this.method = "next", this.next = F.finallyLoc, L) : this.complete(A);
        }, complete: function(O, _) {
          if (O.type === "throw")
            throw O.arg;
          return O.type === "break" || O.type === "continue" ? this.next = O.arg : O.type === "return" ? (this.rval = this.arg = O.arg, this.method = "return", this.next = "end") : O.type === "normal" && _ && (this.next = _), L;
        }, finish: function(O) {
          for (var _ = this.tryEntries.length - 1; 0 <= _; --_) {
            var A = this.tryEntries[_];
            if (A.finallyLoc === O)
              return this.complete(A.completion, A.afterLoc), d(A), L;
          }
        }, catch: function(O) {
          for (var _ = this.tryEntries.length - 1; 0 <= _; --_) {
            var A = this.tryEntries[_];
            if (A.tryLoc === O) {
              if ((O = A.completion).type === "throw") {
                var j = O.arg;
                d(A);
              }
              return j;
            }
          }
          throw Error("illegal catch attempt");
        }, delegateYield: function(O, _, A) {
          return this.delegate = { iterator: v(O), resultName: _, nextLoc: A }, this.method === "next" && (this.arg = g), L;
        } }, t;
      }(e.exports);
      try {
        regeneratorRuntime = e;
      } catch (t) {
        (typeof globalThis == "undefined" ? "undefined" : qa(globalThis)) === "object" ? globalThis.regeneratorRuntime = e : Function("r", "regeneratorRuntime = r")(e);
      }
    }), Cq = !la(function() {
      return Object.isExtensible(Object.preventExtensions({}));
    }), Sk = xb(function(e) {
      var t = qb.f, n = af("meta"), r = 0, o = Object.isExtensible || function() {
        return !0;
      }, i = function(u) {
        t(u, n, { value: { objectID: "O" + ++r, weakData: {} } });
      }, s = e.exports = { REQUIRED: !1, fastKey: function(u, a) {
        if (!xa(u))
          return typeof u == "symbol" ? u : (typeof u == "string" ? "S" : "P") + u;
        if (!ka(u, n)) {
          if (!o(u))
            return "F";
          if (!a)
            return "E";
          i(u);
        }
        return u[n].objectID;
      }, getWeakData: function(u, a) {
        if (!ka(u, n)) {
          if (!o(u))
            return !0;
          if (!a)
            return !1;
          i(u);
        }
        return u[n].weakData;
      }, onFreeze: function(u) {
        return Cq && s.REQUIRED && o(u) && !ka(u, n) && i(u), u;
      } };
      bf[n] = !0;
    }), Dq = function(e, t, n) {
      var r = e.indexOf("Map") !== -1, o = e.indexOf("Weak") !== -1, i = r ? "set" : "add", s = R[e], u = s && s.prototype, a = s, l = {}, f = function(g) {
        var m = u[g];
        Za(u, g, g == "add" ? function(E) {
          return m.call(this, E === 0 ? 0 : E), this;
        } : g == "delete" ? function(E) {
          return !(o && !xa(E)) && m.call(this, E === 0 ? 0 : E);
        } : g == "get" ? function(E) {
          return o && !xa(E) ? void 0 : m.call(this, E === 0 ? 0 : E);
        } : g == "has" ? function(E) {
          return !(o && !xa(E)) && m.call(this, E === 0 ? 0 : E);
        } : function(E, w) {
          return m.call(this, E === 0 ? 0 : E, w), this;
        });
      };
      if (Qc(e, typeof s != "function" || !(o || u.forEach && !la(function() {
        new s().entries().next();
      }))))
        a = n.getConstructor(t, e, r, i), Sk.REQUIRED = !0;
      else if (Qc(e, !0)) {
        var h = new a(), d = h[i](o ? {} : -0, 1) != h, p = la(function() {
          h.has(1);
        }), v = Eh(function(g) {
          new s(g);
        }), y = !o && la(function() {
          for (var g = new s(), m = 5; m--; )
            g[i](m, m);
          return !g.has(-0);
        });
        v || ((a = t(function(g, m) {
          return Ac(g, a, e), g = Wh(new s(), g, a), m != null && Jh(m, g[i], { that: g, AS_ENTRIES: r }), g;
        })).prototype = u, u.constructor = a), (p || y) && (f("delete"), f("has"), r && f("get")), (y || d) && f(i), o && u.clear && delete u.clear;
      }
      return l[e] = a, ea({ global: !0, forced: a != s }, l), zc(a, e), o || n.setStrong(a, e, r), a;
    }, Py = qb.f, Eq = Sk.fastKey, Fq = cb.set, Tk = cb.getterFor, Gq = { getConstructor: function(e, t, n, r) {
      var o = e(function(a, l) {
        Ac(a, o, t), Fq(a, { type: t, index: jc(null), first: void 0, last: void 0, size: 0 }), wa || (a.size = 0), l != null && Jh(l, a[r], { that: a, AS_ENTRIES: n });
      }), i = Tk(t), s = function(a, l, f) {
        var h, d = i(a), p = u(a, l);
        return p ? p.value = f : (d.last = p = { index: h = Eq(l, !0), key: l, value: f, previous: l = d.last, next: void 0, removed: !1 }, d.first || (d.first = p), l && (l.next = p), wa ? d.size++ : a.size++, h !== "F" && (d.index[h] = p)), a;
      }, u = function(a, l) {
        a = i(a);
        var f = Eq(l);
        if (f !== "F")
          return a.index[f];
        for (a = a.first; a; a = a.next)
          if (a.key == l)
            return a;
      };
      return kf(o.prototype, { clear: function() {
        for (var a = i(this), l = a.index, f = a.first; f; )
          f.removed = !0, f.previous && (f.previous = f.previous.next = void 0), delete l[f.index], f = f.next;
        a.first = a.last = void 0, wa ? a.size = 0 : this.size = 0;
      }, delete: function(a) {
        var l = i(this);
        if (a = u(this, a)) {
          var f = a.next, h = a.previous;
          delete l.index[a.index], a.removed = !0, h && (h.next = f), f && (f.previous = h), l.first == a && (l.first = f), l.last == a && (l.last = h), wa ? l.size-- : this.size--;
        }
        return !!a;
      }, forEach: function(a) {
        for (var l, f = i(this), h = Dd(a, 1 < arguments.length ? arguments[1] : void 0, 3); l = l ? l.next : f.first; )
          for (h(l.value, l.key, this); l && l.removed; )
            l = l.previous;
      }, has: function(a) {
        return !!u(this, a);
      } }), kf(o.prototype, n ? { get: function(a) {
        return (a = u(this, a)) && a.value;
      }, set: function(a, l) {
        return s(this, a === 0 ? 0 : a, l);
      } } : { add: function(a) {
        return s(this, a = a === 0 ? 0 : a, a);
      } }), wa && Py(o.prototype, "size", { get: function() {
        return i(this).size;
      } }), o;
    }, setStrong: function(e, t, n) {
      var r = t + " Iterator", o = Tk(t), i = Tk(r);
      Wj(e, t, function(s, u) {
        Fq(this, { type: r, target: s, state: o(s), kind: u, last: void 0 });
      }, function() {
        for (var s = i(this), u = s.kind, a = s.last; a && a.removed; )
          a = a.previous;
        return s.target && (s.last = a = a ? a.next : s.state.first) ? u == "keys" ? { value: a.key, done: !1 } : u == "values" ? { value: a.value, done: !1 } : { value: [a.key, a.value], done: !1 } : (s.target = void 0, { value: void 0, done: !0 });
      }, n ? "entries" : "values", !n, !0), og(t);
    } };
    Dq("Set", function(e) {
      return function() {
        return e(this, arguments.length ? arguments[0] : void 0);
      };
    }, Gq);
    var Uk = Pc("Reflect", "apply"), Qy = Function.apply, Ry = !la(function() {
      Uk(function() {
      });
    });
    ea({ target: "Reflect", stat: !0, forced: Ry }, { apply: function(e, t, n) {
      return Wb(e), Ia(n), Uk ? Uk(e, t, n) : Qy.call(e, t, n);
    } }), ea({ target: "Reflect", stat: !0 }, { ownKeys: so });
    var Hq = Fa("isConcatSpreadable"), Sy = 51 <= Cd || !la(function() {
      var e = [];
      return e[Hq] = !1, e.concat()[0] !== e;
    }), Ty = kg("concat");
    ea({ target: "Array", proto: !0, forced: !Sy || !Ty }, { concat: function(e) {
      var t, n = pb(this), r = Dh(n, 0), o = 0, i = -1;
      for (t = arguments.length; i < t; i++) {
        var s = i === -1 ? n : arguments[i], u = s;
        if (xa(u)) {
          var a = u[Hq];
          u = a !== void 0 ? !!a : Ed(u);
        } else
          u = !1;
        if (u) {
          if (9007199254740991 < o + (a = Ma(s.length)))
            throw TypeError("Maximum allowed index exceeded");
          for (u = 0; u < a; u++, o++)
            u in s && hf(r, o, s[u]);
        } else {
          if (9007199254740991 <= o)
            throw TypeError("Maximum allowed index exceeded");
          hf(r, o++, s);
        }
      }
      return r.length = o, r;
    } });
    var Uy = Bk, Vy = la(function() {
      return !Object.getOwnPropertyNames(1);
    });
    ea({ target: "Object", stat: !0, forced: Vy }, { getOwnPropertyNames: Uy });
    var Wy = de.f, Xy = dc.f, Yy = qb.f, Kd = R.Number, ci = Kd.prototype, Zy = xc(jc(ci)) == "Number", Iq = function(e) {
      var t, n = Oc(e, !1);
      if (typeof n == "string" && 2 < n.length) {
        if ((e = (n = Oj(n)).charCodeAt(0)) === 43 || e === 45) {
          if ((e = n.charCodeAt(2)) === 88 || e === 120)
            return NaN;
        } else if (e === 48) {
          switch (n.charCodeAt(1)) {
            case 66:
            case 98:
              e = 2;
              var r = 49;
              break;
            case 79:
            case 111:
              e = 8, r = 55;
              break;
            default:
              return +n;
          }
          var o = (n = n.slice(2)).length;
          for (t = 0; t < o; t++) {
            var i = n.charCodeAt(t);
            if (48 > i || i > r)
              return NaN;
          }
          return parseInt(n, e);
        }
      }
      return +n;
    };
    if (Qc("Number", !Kd(" 0o1") || !Kd("0b1") || Kd("+0x1"))) {
      for (var le = function(e) {
        var t = 1 > arguments.length ? 0 : e, n = this;
        return n instanceof le && (Zy ? la(function() {
          ci.valueOf.call(n);
        }) : xc(n) != "Number") ? Wh(new Kd(Iq(t)), n, le) : Iq(t);
      }, Jq = wa ? Wy(Kd) : "MAX_VALUE MIN_VALUE NaN NEGATIVE_INFINITY POSITIVE_INFINITY EPSILON isFinite isInteger isNaN isSafeInteger MAX_SAFE_INTEGER MIN_SAFE_INTEGER parseFloat parseInt isInteger fromString range".split(" "), Vk = 0, di; Jq.length > Vk; Vk++)
        ka(Kd, di = Jq[Vk]) && !ka(le, di) && Yy(le, di, Xy(Kd, di));
      le.prototype = ci, ci.constructor = le, Za(R, "Number", le);
    }
    var sf = (typeof Reflect == "undefined" ? "undefined" : qa(Reflect)) === "object" ? Reflect : null, Kq = sf && typeof sf.apply == "function" ? sf.apply : function(e, t, n) {
      return Function.prototype.apply.call(e, t, n);
    }, $y = sf && typeof sf.ownKeys == "function" ? sf.ownKeys : Object.getOwnPropertySymbols ? function(e) {
      return Object.getOwnPropertyNames(e).concat(Object.getOwnPropertySymbols(e));
    } : function(e) {
      return Object.getOwnPropertyNames(e);
    }, Lq = Number.isNaN || function(e) {
      return e != e;
    };
    Ba.EventEmitter = Ba, Ba.prototype._events = void 0, Ba.prototype._eventsCount = 0, Ba.prototype._maxListeners = void 0;
    var Mq = 10;
    Object.defineProperty(Ba, "defaultMaxListeners", { enumerable: !0, get: function() {
      return Mq;
    }, set: function(e) {
      if (typeof e != "number" || 0 > e || Lq(e))
        throw new RangeError('The value of "defaultMaxListeners" is out of range. It must be a non-negative number. Received ' + e + ".");
      Mq = e;
    } }), Ba.init = function() {
      this._events !== void 0 && this._events !== Object.getPrototypeOf(this)._events || (this._events = /* @__PURE__ */ Object.create(null), this._eventsCount = 0), this._maxListeners = this._maxListeners || void 0;
    }, Ba.prototype.setMaxListeners = function(e) {
      if (typeof e != "number" || 0 > e || Lq(e))
        throw new RangeError('The value of "n" is out of range. It must be a non-negative number. Received ' + e + ".");
      return this._maxListeners = e, this;
    }, Ba.prototype.getMaxListeners = function() {
      return this._maxListeners === void 0 ? Ba.defaultMaxListeners : this._maxListeners;
    }, Ba.prototype.emit = function(e) {
      for (var t = [], n = 1; n < arguments.length; n++)
        t.push(arguments[n]);
      n = e === "error";
      var r = this._events;
      if (r !== void 0)
        n = n && r.error === void 0;
      else if (!n)
        return !1;
      if (n) {
        var o;
        throw 0 < t.length && (o = t[0]), o instanceof Error ? o : ((t = Error("Unhandled error." + (o ? " (" + o.message + ")" : ""))).context = o, t);
      }
      if ((n = r[e]) === void 0)
        return !1;
      if (typeof n == "function")
        Kq(n, this, t);
      else
        for (r = Gm(n, o = n.length), n = 0; n < o; ++n)
          Kq(r[n], this, t);
      return !0;
    }, Ba.prototype.addListener = function(e, t) {
      return Dm(this, e, t, !1);
    }, Ba.prototype.on = Ba.prototype.addListener, Ba.prototype.prependListener = function(e, t) {
      return Dm(this, e, t, !0);
    }, Ba.prototype.once = function(e, t) {
      return Wg(t), this.on(e, Em(this, e, t)), this;
    }, Ba.prototype.prependOnceListener = function(e, t) {
      return Wg(t), this.prependListener(e, Em(this, e, t)), this;
    }, Ba.prototype.removeListener = function(e, t) {
      var n;
      Wg(t);
      var r = this._events;
      if (r === void 0)
        return this;
      var o = r[e];
      if (o === void 0)
        return this;
      if (o === t || o.listener === t)
        --this._eventsCount == 0 ? this._events = /* @__PURE__ */ Object.create(null) : (delete r[e], r.removeListener && this.emit("removeListener", e, o.listener || t));
      else if (typeof o != "function") {
        var i = -1;
        for (n = o.length - 1; 0 <= n; n--)
          if (o[n] === t || o[n].listener === t) {
            var s = o[n].listener;
            i = n;
            break;
          }
        if (0 > i)
          return this;
        if (i === 0)
          o.shift();
        else {
          for (; i + 1 < o.length; i++)
            o[i] = o[i + 1];
          o.pop();
        }
        o.length === 1 && (r[e] = o[0]), r.removeListener !== void 0 && this.emit("removeListener", e, s || t);
      }
      return this;
    }, Ba.prototype.off = Ba.prototype.removeListener, Ba.prototype.removeAllListeners = function(e) {
      var t = this._events;
      if (t === void 0)
        return this;
      if (t.removeListener === void 0)
        return arguments.length === 0 ? (this._events = /* @__PURE__ */ Object.create(null), this._eventsCount = 0) : t[e] !== void 0 && (--this._eventsCount == 0 ? this._events = /* @__PURE__ */ Object.create(null) : delete t[e]), this;
      if (arguments.length === 0) {
        var n = Object.keys(t);
        for (t = 0; t < n.length; ++t) {
          var r = n[t];
          r !== "removeListener" && this.removeAllListeners(r);
        }
        return this.removeAllListeners("removeListener"), this._events = /* @__PURE__ */ Object.create(null), this._eventsCount = 0, this;
      }
      if (typeof (n = t[e]) == "function")
        this.removeListener(e, n);
      else if (n !== void 0)
        for (t = n.length - 1; 0 <= t; t--)
          this.removeListener(e, n[t]);
      return this;
    }, Ba.prototype.listeners = function(e) {
      return Fm(this, e, !0);
    }, Ba.prototype.rawListeners = function(e) {
      return Fm(this, e, !1);
    }, Ba.listenerCount = function(e, t) {
      return typeof e.listenerCount == "function" ? e.listenerCount(t) : Hm.call(e, t);
    }, Ba.prototype.listenerCount = Hm, Ba.prototype.eventNames = function() {
      return 0 < this._eventsCount ? $y(this._events) : [];
    }, Ba.once = function(e, t) {
      return new Promise(function(n, r) {
        function o(s) {
          e.removeListener(t, i), r(s);
        }
        function i() {
          typeof e.removeListener == "function" && e.removeListener("error", o), n([].slice.call(arguments));
        }
        Im(e, t, i, { once: !0 }), t !== "error" && fu(e, o, { once: !0 });
      });
    };
    var tf = Object.assign, Nq = Object.defineProperty, Bg = !tf || la(function() {
      if (wa && tf({ b: 1 }, tf(Nq({}, "a", { enumerable: !0, get: function() {
        Nq(this, "b", { value: 3, enumerable: !1 });
      } }), { b: 2 })).b !== 1)
        return !0;
      var e = {}, t = {}, n = Symbol();
      return e[n] = 7, "abcdefghijklmnopqrst".split("").forEach(function(r) {
        t[r] = r;
      }), tf({}, e)[n] != 7 || ed(tf({}, t)).join("") != "abcdefghijklmnopqrst";
    }) ? function(e, t) {
      for (var n = pb(e), r = arguments.length, o = 1, i = gg.f, s = eg; r > o; )
        for (var u, a = fg(arguments[o++]), l = i ? ed(a).concat(i(a)) : ed(a), f = l.length, h = 0; f > h; )
          u = l[h++], (!wa || s.call(a, u)) && (n[u] = a[u]);
      return n;
    } : tf;
    ea({ target: "Object", stat: !0, forced: Object.assign !== Bg }, { assign: Bg }), Dq("Map", function(e) {
      return function() {
        return e(this, arguments.length ? arguments[0] : void 0);
      };
    }, Gq);
    var az = Math.log, bz = Math.LN2;
    ea({ target: "Math", stat: !0 }, { log2: function(e) {
      return az(e) / bz;
    } });
    var cz = qb.f, dz = de.f, ez = cb.enforce, fz = Fa("match"), Vc = R.RegExp, Wk = Vc.prototype, Cg = /a/g, Xk = /a/g, Yk = new Vc(Cg) !== Cg;
    if (wa && Qc("RegExp", !Yk || Rc || la(function() {
      return Xk[fz] = !1, Vc(Cg) != Cg || Vc(Xk) == Xk || Vc(Cg, "i") != "/a/i";
    }))) {
      for (var ld = function(e, t) {
        var n, r = this instanceof ld, o = Lj(e), i = t === void 0;
        return !r && o && e.constructor === ld && i || (Yk ? o && !i && (e = e.source) : e instanceof ld && (i && (t = Gj.call(e)), e = e.source), Rc && (n = !!t && -1 < t.indexOf("y")) && (t = t.replace(/y/g, "")), e = Wh(Yk ? new Vc(e, t) : Vc(e, t), r ? this : Wk, ld), Rc && n && (ez(e).sticky = !0)), e;
      }, gz = function(e) {
        e in ld || cz(ld, e, { configurable: !0, get: function() {
          return Vc[e];
        }, set: function(t) {
          Vc[e] = t;
        } });
      }, Oq = dz(Vc), Pq = 0; Oq.length > Pq; )
        gz(Oq[Pq++]);
      Wk.constructor = ld, ld.prototype = Wk, Za(R, "RegExp", ld);
    }
    og("RegExp"), xg("Float32", function(e) {
      return function(t, n, r) {
        return e(this, t, n, r);
      };
    }), xg("Float64", function(e) {
      return function(t, n, r) {
        return e(this, t, n, r);
      };
    }), xg("Uint32", function(e) {
      return function(t, n, r) {
        return e(this, t, n, r);
      };
    }), xg("Uint16", function(e) {
      return function(t, n, r) {
        return e(this, t, n, r);
      };
    });
    var Zk = function(e, t) {
      return e === t ? 0 : e == null ? t == null ? 0 : -1 : t == null ? e == null ? 0 : 1 : typeof e.compare == "function" ? e.compare(t) : typeof t.compare == "function" ? -t.compare(e) : e < t ? -1 : e > t ? 1 : 0;
    }, $k = [], Qq = $k.sort, hz = la(function() {
      $k.sort(void 0);
    }), iz = la(function() {
      $k.sort(null);
    }), jz = ff("sort");
    ea({ target: "Array", proto: !0, forced: hz || !iz || !jz }, { sort: function(e) {
      return e === void 0 ? Qq.call(pb(this)) : Qq.call(pb(this), Wb(e));
    } });
    var Rq = Object.getPrototypeOf({}), Dg = function(e, t) {
      var n;
      return e === t || (e == null ? e == t : qa(e.equiv) === "function" ? e.equiv(t) : t == null ? e == t : qa(t.equiv) === "function" ? t.equiv(e) : qa(e) !== "string" && qa(t) !== "string" && ((n = Object.getPrototypeOf(e)) != null && n !== Rq || (n = Object.getPrototypeOf(t)) != null && n !== Rq ? qa(e) !== "function" && e.length !== void 0 && qa(t) !== "function" && t.length !== void 0 ? lz(e, t) : e instanceof Set && t instanceof Set ? mz(e, t) : e instanceof Map && t instanceof Map ? nz(e, t) : e instanceof Date && t instanceof Date ? e.getTime() === t.getTime() : e instanceof RegExp && t instanceof RegExp ? e.toString() === t.toString() : e != e && t != t : kz(e, t)));
    }, lz = function(e, t) {
      var n = 2 < arguments.length && arguments[2] !== void 0 ? arguments[2] : Dg, r = e.length;
      if (r === t.length)
        for (; 0 <= --r && n(e[r], t[r]); )
          ;
      return 0 > r;
    }, mz = function(e, t) {
      var n = 2 < arguments.length && arguments[2] !== void 0 ? arguments[2] : Dg;
      return e.size === t.size && n(Z(e.keys()).sort(), Z(t.keys()).sort());
    }, nz = function(e, t) {
      var n = 2 < arguments.length && arguments[2] !== void 0 ? arguments[2] : Dg;
      return e.size === t.size && n(Z(e).sort(), Z(t).sort());
    }, kz = function(e, t) {
      var n = 2 < arguments.length && arguments[2] !== void 0 ? arguments[2] : Dg;
      if (Object.keys(e).length !== Object.keys(t).length)
        return !1;
      for (var r in e)
        if (!t.hasOwnProperty(r) || !n(e[r], t[r]))
          return !1;
      return !0;
    }, Sq = function(e) {
      var t = 1 < arguments.length && arguments[1] !== void 0 ? arguments[1] : function(n) {
        return n !== void 0 ? ": " + n : "";
      };
      return function(n) {
        function r(i) {
          return va(this, r), o.call(this, e(i) + t(i));
        }
        Ga(r, n);
        var o = Ha(r);
        return r;
      }(Kf(Error));
    }, oz = Sq(function() {
      return "illegal argument(s)";
    }), ei = function(e) {
      throw new oz(e);
    }, al = Sq(function() {
      return "index out of bounds";
    }), Tq = 1 / 4294967295, pz = function() {
      function e() {
        va(this, e);
      }
      return eb(e, [{ key: "float", value: function() {
        var t = 0 < arguments.length && arguments[0] !== void 0 ? arguments[0] : 1;
        return this.int() * Tq * t;
      } }, { key: "norm", value: function() {
        var t = 0 < arguments.length && arguments[0] !== void 0 ? arguments[0] : 1;
        return 2 * (this.int() * Tq - 0.5) * t;
      } }, { key: "minmax", value: function(t, n) {
        return this.float() * (n - t) + t;
      } }]), e;
    }(), bl = Math.random, qz = new (function(e) {
      function t() {
        return va(this, t), n.apply(this, arguments);
      }
      Ga(t, e);
      var n = Ha(t);
      return eb(t, [{ key: "int", value: function() {
        return 4294967296 * bl() >>> 0;
      } }, { key: "float", value: function() {
        var r = 0 < arguments.length && arguments[0] !== void 0 ? arguments[0] : 1;
        return bl() * r;
      } }, { key: "norm", value: function() {
        var r = 0 < arguments.length && arguments[0] !== void 0 ? arguments[0] : 1;
        return 2 * (bl() - 0.5) * r;
      } }]), t;
    }(pz))(), Ni = Symbol(), Lm = function() {
    }, rz = Sk.onFreeze, cl = Object.freeze, sz = la(function() {
      cl(1);
    });
    ea({ target: "Object", stat: !0, forced: sz, sham: !Cq }, { freeze: function(e) {
      return cl && xa(e) ? cl(rz(e)) : e;
    } });
    var tz = ff("reduce"), uz = !fd && 79 < Cd && 83 > Cd;
    ea({ target: "Array", proto: !0, forced: !tz || uz }, { reduce: function(e) {
      return $p(this, e, arguments.length, 1 < arguments.length ? arguments[1] : void 0);
    } });
    var Km = function(e) {
      return e != null && typeof e.xform == "function" ? e.xform() : e;
    }, Xg = function() {
      function e(t) {
        va(this, e), this.value = t;
      }
      return eb(e, [{ key: "deref", value: function() {
        return this.value;
      } }]), e;
    }(), Oi = function(e) {
      return e instanceof Xg ? e.deref() : e;
    }, hu = function(e, t) {
      return [e, function(n) {
        return n;
      }, t];
    }, vz = N.mark(function(e, t) {
      var n, r, o, i, s, u;
      return N.wrap(function(a) {
        for (; ; )
          switch (a.prev = a.next) {
            case 0:
              n = Km(e)(gu()), r = n[1], o = n[2], i = 0;
            case 4:
              if (!(i < t.length)) {
                a.next = 15;
                break;
              }
              if (s = t[i], !((u = o([], s)) instanceof Xg)) {
                a.next = 10;
                break;
              }
              return a.delegateYield(Oi(r(u.deref())), "t0", 9);
            case 9:
              return a.abrupt("return");
            case 10:
              if (!u.length) {
                a.next = 12;
                break;
              }
              return a.delegateYield(u, "t1", 12);
            case 12:
              i++, a.next = 4;
              break;
            case 15:
              return a.delegateYield(Oi(r([])), "t2", 16);
            case 16:
            case "end":
              return a.stop();
          }
      }, vz);
    }), iu = N.mark(Jm), ju = function(e, t) {
      return [e[0], e[1], t];
    }, wz = function() {
      function e(t) {
        va(this, e), this._length = 0, t && this.into(t);
      }
      return eb(e, [{ key: "length", get: function() {
        return this._length;
      } }, { key: "copy", value: function() {
        return new e(this);
      } }, { key: "empty", value: function() {
        return new e();
      } }, { key: "clear", value: function() {
        this.release();
      } }, { key: "release", value: function() {
        for (var t, n = this.head; n; )
          t = n.next, delete n.value, delete n.prev, delete n.next, n = t;
        return delete this.head, delete this.tail, this._length = 0, !0;
      } }, { key: "compare", value: function(t) {
        var n = this._length;
        if (n < t._length)
          return -1;
        if (n > t._length)
          return 1;
        if (n === 0)
          return 0;
        n = this.head, t = t.head;
        for (var r = 0; n && r == 0; )
          r = Zk(n.value, t.value), n = n.next, t = t.next;
        return r;
      } }, { key: "equiv", value: function(t) {
        if (!(t instanceof e || t != null && typeof t != "function" && t.length !== void 0) || this._length !== t.length)
          return !1;
        if (!this._length || this === t)
          return !0;
        for (var n = this.head, r = 0; r < t.length; r++) {
          if (!Dg(n.value, t[r]))
            return !1;
          n = n.next;
        }
        return !0;
      } }, { key: Symbol.iterator, value: N.mark(function t() {
        var n;
        return N.wrap(function(r) {
          for (; ; )
            switch (r.prev = r.next) {
              case 0:
                n = this.head;
              case 1:
                if (!n) {
                  r.next = 7;
                  break;
                }
                return r.next = 4, n.value;
              case 4:
                n = n.next, r.next = 1;
                break;
              case 7:
              case "end":
                return r.stop();
            }
        }, t, this);
      }) }, { key: "seq", value: function() {
        var t = 0 < arguments.length && arguments[0] !== void 0 ? arguments[0] : 0, n = 1 < arguments.length && arguments[1] !== void 0 ? arguments[1] : this.length;
        if (!(t >= n || 0 > t)) {
          t = this.nthCell(t);
          var r = this.nthCell(n - 1);
          return n = function o(i) {
            return { first: function() {
              return i.value;
            }, next: function() {
              return i !== r && i.next ? o(i.next) : void 0;
            } };
          }, t ? n(t) : void 0;
        }
      } }, { key: "cycle", value: N.mark(function t() {
        return N.wrap(function(n) {
          for (; ; )
            switch (n.prev = n.next) {
              case 0:
                return n.delegateYield(this, "t0", 2);
              case 2:
                n.next = 0;
                break;
              case 4:
              case "end":
                return n.stop();
            }
        }, t, this);
      }) }, { key: "$reduce", value: function(t, n) {
        for (var r = this.head; r && !(n instanceof Xg); )
          n = t(n, r.value), r = r.next;
        return n;
      } }, { key: "drop", value: function() {
        var t = this.head;
        if (t)
          return (this.head = t.next) ? delete this.head.prev : delete this.tail, this._length--, t.value;
      } }, { key: "cons", value: function(t) {
        return t = { value: t, next: this.head }, this.head ? this.head.prev = t : this.tail = t, this.head = t, this._length++, this;
      } }, { key: "insertBefore", value: function(t, n) {
        return t || ei("cell is undefined"), n = { value: n, next: t, prev: t.prev }, t.prev ? t.prev.next = n : this.head = n, t.prev = n, this._length++, this;
      } }, { key: "insertAfter", value: function(t, n) {
        return t || ei("cell is undefined"), n = { value: n, next: t.next, prev: t }, t.next ? t.next.prev = n : this.tail = n, t.next = n, this._length++, this;
      } }, { key: "insertBeforeNth", value: function(t, n) {
        if (0 > t && (t += this._length), 0 >= t)
          return this.cons(n);
        if (0 > t || t >= this._length)
          throw new al(t);
        return this.insertBefore(this.nthCellUnsafe(t), n);
      } }, { key: "insertAfterNth", value: function(t, n) {
        if (0 > t && (t += this._length), t >= this._length - 1)
          return this.push(n);
        if (0 > t || t >= this._length)
          throw new al(t);
        return this.insertAfter(this.nthCellUnsafe(t), n);
      } }, { key: "insertSorted", value: function(t, n) {
        n = n || Zk;
        for (var r = this.head; r; ) {
          if (0 >= n(t, r.value))
            return this.insertBefore(r, t);
          r = r.next;
        }
        return this.push(t);
      } }, { key: "find", value: function(t) {
        for (var n = this.head; n; ) {
          if (n.value === t)
            return n;
          n = n.next;
        }
      } }, { key: "findWith", value: function(t) {
        for (var n = this.head; n; ) {
          if (t(n.value))
            return n;
          n = n.next;
        }
      } }, { key: "concat", value: function() {
        for (var t = this.copy(), n = arguments.length, r = Array(n), o = 0; o < n; o++)
          r[o] = arguments[o];
        for (n = 0; n < r.length; n++)
          t.into(r[n]);
        return t;
      } }, { key: "into", value: function(t) {
        for (var n = 0; n < t.length; n++)
          this.push(t[n]);
      } }, { key: "slice", value: function() {
        var t = 0 < arguments.length && arguments[0] !== void 0 ? arguments[0] : 0, n = 1 < arguments.length && arguments[1] !== void 0 ? arguments[1] : this.length;
        t = 0 > t ? t + this._length : t, n = 0 > n ? n + this._length : n, (0 > t || 0 > n) && ei("invalid indices: ${from} / ${to}");
        for (var r = new e(), o = this.nthCell(t); o && ++t <= n; )
          r.push(o.value), o = o.next;
        return r;
      } }, { key: "splice", value: function(t) {
        var n = 1 < arguments.length && arguments[1] !== void 0 ? arguments[1] : 0, r = 2 < arguments.length ? arguments[2] : void 0;
        if (typeof t == "number") {
          if (0 > t && (t += this._length), 0 > t || t >= this._length)
            throw new al(t);
          var o = this.nthCellUnsafe(t);
        } else
          o = t;
        var i = new e();
        if (0 < n)
          for (; o && 0 < n--; )
            this.remove(o), i.push(o.value), o = o.next;
        else
          o && (o = o.next);
        if (r)
          if (o)
            for (n = 0; n < r.length; n++)
              this.insertBefore(o, r[n]);
          else
            for (o = 0; o < r.length; o++)
              this.push(r[o]);
        return i;
      } }, { key: "remove", value: function(t) {
        return t.prev ? t.prev.next = t.next : this.head = t.next, t.next ? t.next.prev = t.prev : this.tail = t.prev, this._length--, this;
      } }, { key: "swap", value: function(t, n) {
        if (t !== n) {
          var r = t.value;
          t.value = n.value, n.value = r;
        }
        return this;
      } }, { key: "push", value: function(t) {
        return this.tail ? (t = { value: t, prev: this.tail }, this.tail = this.tail.next = t, this._length++, this) : this.cons(t);
      } }, { key: "pop", value: function() {
        var t = this.tail;
        if (t)
          return (this.tail = t.prev) ? delete this.tail.next : delete this.head, this._length--, t.value;
      } }, { key: "first", value: function() {
        return this.head && this.head.value;
      } }, { key: "peek", value: function() {
        return this.tail && this.tail.value;
      } }, { key: "setHead", value: function(t) {
        return this.head ? (this.head.value = t, this) : this.cons(t);
      } }, { key: "setTail", value: function(t) {
        return this.tail ? (this.tail.value = t, this) : this.push(t);
      } }, { key: "setNth", value: function(t, n) {
        var r = this.nthCell(t);
        return !r && ei("index out of bounds: ".concat(t)), r.value = n, this;
      } }, { key: "nth", value: function(t, n) {
        return (t = this.nthCell(t)) ? t.value : n;
      } }, { key: "nthCell", value: function(t) {
        if (0 > t && (t += this._length), !(0 > t || t >= this._length))
          return this.nthCellUnsafe(t);
      } }, { key: "rotateLeft", value: function() {
        switch (this._length) {
          case 0:
          case 1:
            return this;
          case 2:
            return this.swap(this.head, this.tail);
          default:
            return this.push(this.drop());
        }
      } }, { key: "rotateRight", value: function() {
        switch (this._length) {
          case 0:
          case 1:
            return this;
          case 2:
            return this.swap(this.head, this.tail);
          default:
            var t = this.peek();
            return this.pop(), this.cons(t);
        }
      } }, { key: "map", value: function(t) {
        for (var n = new e(), r = this.head; r; )
          n.push(t(r.value)), r = r.next;
        return n;
      } }, { key: "filter", value: function(t) {
        for (var n = new e(), r = this.head; r; )
          t(r.value) && n.push(r.value), r = r.next;
        return n;
      } }, { key: "reduce", value: function(t, n) {
        for (var r = this.head; r; )
          n = t(n, r.value), r = r.next;
        return n;
      } }, { key: "shuffle", value: function(t) {
        var n = 1 < arguments.length && arguments[1] !== void 0 ? arguments[1] : qz;
        if (2 > this._length)
          return this;
        for (t = t != null ? t : Math.ceil(1.5 * Math.log2(this._length)); 0 < t; t--)
          for (var r = this.head; r; ) {
            var o = r.next;
            0.5 > n.float() ? this.asHead(r) : this.asTail(r), r = o;
          }
        return this;
      } }, { key: "sort", value: function() {
        var t = 0 < arguments.length && arguments[0] !== void 0 ? arguments[0] : Zk;
        if (!this._length)
          return this;
        for (var n = 1; ; ) {
          var r = this.head;
          this.tail = this.head = void 0;
          for (var o = 0; r; ) {
            o++;
            for (var i = r, s = 0, u = 0; u < n && (s++, i = i.next); u++)
              ;
            for (u = n; 0 < s || 0 < u && i; ) {
              if (s === 0) {
                var a = i;
                i = i.next, u--;
              } else
                i && u !== 0 ? 0 >= t(r.value, i.value) ? (a = r, r = r.next, s--) : (a = i, i = i.next, u--) : (a = r, r = r.next, s--);
              this.tail ? this.tail.next = a : this.head = a, a.prev = this.tail, this.tail = a;
            }
            r = i;
          }
          if (this.tail.next = void 0, 1 >= o)
            return this;
          n *= 2;
        }
      } }, { key: "reverse", value: function() {
        for (var t = this.head, n = this.tail, r = (this._length >>> 1) + (1 & this._length); t && n && 0 < r; ) {
          var o = t.value;
          t.value = n.value, n.value = o, t = t.next, n = n.prev, r--;
        }
        return this;
      } }, { key: "asHead", value: function(t) {
        return t === this.head || (this.remove(t), this.head.prev = t, t.next = this.head, t.prev = void 0, this.head = t, this._length++), this;
      } }, { key: "asTail", value: function(t) {
        return t === this.tail || (this.remove(t), this.tail.next = t, t.prev = this.tail, t.next = void 0, this.tail = t, this._length++), this;
      } }, { key: "toString", value: function() {
        for (var t = [], n = this.head; n; )
          t.push(String(n.value)), n = n.next;
        return t.join(", ");
      } }, { key: "toJSON", value: function() {
        return Z(this);
      } }, { key: "nthCellUnsafe", value: function(t) {
        if (t <= this._length >> 1)
          var n = this.head, r = "next";
        else
          n = this.tail, r = "prev", t = this._length - t - 1;
        for (; 0 < t-- && n; )
          n = n[r];
        return n;
      } }]), e;
    }(), Wc = function() {
      function e(t, n) {
        va(this, e), n = Object.assign({ maxlen: 1 / 0, maxsize: 1 / 0, map: function() {
          return /* @__PURE__ */ new Map();
        }, ksize: function() {
          return 0;
        }, vsize: function() {
          return 0;
        } }, n), this.map = n.map(), this.items = new wz(), this._size = 0, this.opts = n, t && this.into(t);
      }
      return eb(e, [{ key: "length", get: function() {
        return this.items.length;
      } }, { key: "size", get: function() {
        return this._size;
      } }, { key: Symbol.iterator, value: function() {
        return this.entries();
      } }, { key: "entries", value: function() {
        return Yg(function(t) {
          return [t.k, t];
        }, this.items);
      } }, { key: "keys", value: function() {
        return Yg(function(t) {
          return t.k;
        }, this.items);
      } }, { key: "values", value: function() {
        return Yg(function(t) {
          return t.v;
        }, this.items);
      } }, { key: "copy", value: function() {
        var t = this.empty();
        t.items = this.items.copy();
        for (var n = t.items.head; n; )
          t.map.set(n.value.k, n), n = n.next;
        return t;
      } }, { key: "empty", value: function() {
        return new e(null, this.opts);
      } }, { key: "release", value: function() {
        this._size = 0, this.map.clear();
        var t = this.opts.release;
        if (t) {
          for (var n; n = this.items.drop(); )
            t(n.k, n.v);
          return !0;
        }
        return this.items.release();
      } }, { key: "has", value: function(t) {
        return this.map.has(t);
      } }, { key: "get", value: function(t, n) {
        return (t = this.map.get(t)) ? this.resetEntry(t) : n;
      } }, { key: "set", value: function(t, n) {
        var r = this.opts.ksize(t) + this.opts.vsize(n), o = this.map.get(t);
        return this._size += Math.max(0, r - (o ? o.value.s : 0)), this.ensureSize() && this.doSetEntry(o, t, n, r), n;
      } }, { key: "into", value: function(t) {
        for (var n = 0; n < t.length; n++) {
          var r = t[n];
          this.set(r[0], r[1]);
        }
        return this;
      } }, { key: "getSet", value: function(t, n) {
        var r = this, o = this.map.get(t);
        return o ? Promise.resolve(this.resetEntry(o)) : n().then(function(i) {
          return r.set(t, i);
        });
      } }, { key: "delete", value: function(t) {
        return !!(t = this.map.get(t)) && (this.removeEntry(t), !0);
      } }, { key: "resetEntry", value: function(t) {
        return this.items.asTail(t), t.value.v;
      } }, { key: "ensureSize", value: function() {
        for (var t = this.opts.release, n = this.opts.maxsize, r = this.opts.maxlen; this._size > n || this.length >= r; ) {
          var o = this.items.drop();
          if (!o)
            return !1;
          this.map.delete(o.k), t && t(o.k, o.v), this._size -= o.s;
        }
        return !0;
      } }, { key: "removeEntry", value: function(t) {
        var n = t.value;
        this.map.delete(n.k), this.items.remove(t), this.opts.release && this.opts.release(n.k, n.v), this._size -= n.s;
      } }, { key: "doSetEntry", value: function(t, n, r, o) {
        t ? (t.value.v = r, t.value.s = o, this.items.asTail(t)) : (this.items.push({ k: n, v: r, s: o }), this.map.set(n, this.items.tail));
      } }]), e;
    }(), xz = function(e) {
      function t(r, o) {
        return va(this, t), o = Object.assign({ ttl: 36e5 }, o), n.call(this, r, o);
      }
      Ga(t, e);
      var n = Ha(t);
      return eb(t, [{ key: "empty", value: function() {
        return new t(null, this.opts);
      } }, { key: "has", value: function(r) {
        return this.get(r) !== void 0;
      } }, { key: "get", value: function(r, o) {
        if (r = this.map.get(r)) {
          if (r.value.t >= Date.now())
            return this.resetEntry(r);
          this.removeEntry(r);
        }
        return o;
      } }, { key: "set", value: function(r, o) {
        var i = 2 < arguments.length && arguments[2] !== void 0 ? arguments[2] : this.opts.ttl, s = this.opts.ksize(r) + this.opts.vsize(o), u = this.map.get(r);
        return this._size += Math.max(0, s - (u ? u.value.s : 0)), this.ensureSize() && (i = Date.now() + i, u ? (u.value.v = o, u.value.s = s, u.value.t = i, this.items.asTail(u)) : (this.items.push({ k: r, v: o, s, t: i }), this.map.set(r, this.items.tail))), o;
      } }, { key: "getSet", value: function(r, o) {
        var i = this, s = 2 < arguments.length && arguments[2] !== void 0 ? arguments[2] : this.opts.ttl, u = this.get(r);
        return u ? Promise.resolve(u) : o().then(function(a) {
          return i.set(r, a, s);
        });
      } }, { key: "prune", value: function() {
        for (var r = Date.now(), o = this.items.head; o; )
          o.value.t < r && this.removeEntry(o), o = o.next;
      } }, { key: "ensureSize", value: function() {
        for (var r = this.opts.maxsize, o = this.opts.maxlen, i = Date.now(), s = this.items.head; s && (this._size > r || this.length >= o); )
          s.value.t < i && this.removeEntry(s), s = s.next;
        return Li(Td(t.prototype), "ensureSize", this).call(this);
      } }]), t;
    }(Wc), Uq = qa(Ya) == "object" && Ya && Ya.Object === Object && Ya, yz = (typeof self == "undefined" ? "undefined" : qa(self)) == "object" && self && self.Object === Object && self, $b = Uq || yz || Function("return this")(), lc = $b.Symbol, Vq = Object.prototype, zz = Vq.hasOwnProperty, Az = Vq.toString, Eg = lc ? lc.toStringTag : void 0, Bz = Object.prototype.toString, Wq = lc ? lc.toStringTag : void 0, me = function(e) {
      if (e == null)
        e = e === void 0 ? "[object Undefined]" : "[object Null]";
      else if (Wq && Wq in Object(e)) {
        var t = zz.call(e, Eg), n = e[Eg];
        try {
          e[Eg] = void 0;
          var r = !0;
        } catch (i) {
        }
        var o = Az.call(e);
        r && (t ? e[Eg] = n : delete e[Eg]), e = o;
      } else
        e = Bz.call(e);
      return e;
    }, Gb = function(e) {
      var t = qa(e);
      return e != null && (t == "object" || t == "function");
    }, jj = function(e) {
      return !!Gb(e) && ((e = me(e)) == "[object Function]" || e == "[object GeneratorFunction]" || e == "[object AsyncFunction]" || e == "[object Proxy]");
    }, dl = $b["__core-js_shared__"], Xq = function() {
      var e = /[^.]+$/.exec(dl && dl.keys && dl.keys.IE_PROTO || "");
      return e ? "Symbol(src)_1." + e : "";
    }(), Cz = Function.prototype.toString, ne = function(e) {
      if (e != null) {
        try {
          return Cz.call(e);
        } catch (t) {
        }
        return e + "";
      }
      return "";
    }, Dz = /^\[object .+?Constructor\]$/, Ez = RegExp("^" + Function.prototype.toString.call(Object.prototype.hasOwnProperty).replace(/[\\^$.*+?()[\]{}|]/g, "\\$&").replace(/hasOwnProperty|(function).*?(?=\\\()| for .+?(?=\\\])/g, "$1.*?") + "$"), oe = function(e, t) {
      return e = e == null ? void 0 : e[t], !Gb(e) || Xq && Xq in e || !(jj(e) ? Ez : Dz).test(ne(e)) ? void 0 : e;
    }, Fg = oe(Object, "create"), Fz = Object.prototype.hasOwnProperty, Gz = Object.prototype.hasOwnProperty;
    Vd.prototype.clear = function() {
      this.__data__ = Fg ? Fg(null) : {}, this.size = 0;
    }, Vd.prototype.delete = function(e) {
      return e = this.has(e) && delete this.__data__[e], this.size -= e ? 1 : 0, e;
    }, Vd.prototype.get = function(e) {
      var t = this.__data__;
      return Fg ? (e = t[e]) === "__lodash_hash_undefined__" ? void 0 : e : Fz.call(t, e) ? t[e] : void 0;
    }, Vd.prototype.has = function(e) {
      var t = this.__data__;
      return Fg ? t[e] !== void 0 : Gz.call(t, e);
    }, Vd.prototype.set = function(e, t) {
      var n = this.__data__;
      return this.size += this.has(e) ? 0 : 1, n[e] = Fg && t === void 0 ? "__lodash_hash_undefined__" : t, this;
    };
    var Gg = function(e, t) {
      return e === t || e != e && t != t;
    }, fi = function(e, t) {
      for (var n = e.length; n--; )
        if (Gg(e[n][0], t))
          return n;
      return -1;
    }, Hz = Array.prototype.splice;
    Ee.prototype.clear = function() {
      this.__data__ = [], this.size = 0;
    }, Ee.prototype.delete = function(e) {
      var t = this.__data__;
      return !(0 > (e = fi(t, e))) && (e == t.length - 1 ? t.pop() : Hz.call(t, e, 1), --this.size, !0);
    }, Ee.prototype.get = function(e) {
      var t = this.__data__;
      return 0 > (e = fi(t, e)) ? void 0 : t[e][1];
    }, Ee.prototype.has = function(e) {
      return -1 < fi(this.__data__, e);
    }, Ee.prototype.set = function(e, t) {
      var n = this.__data__, r = fi(n, e);
      return 0 > r ? (++this.size, n.push([e, t])) : n[r][1] = t, this;
    };
    var $g = Ee, Hg = oe($b, "Map"), gi = function(e, t) {
      e = e.__data__;
      var n = qa(t);
      return (n == "string" || n == "number" || n == "symbol" || n == "boolean" ? t !== "__proto__" : t === null) ? e[typeof t == "string" ? "string" : "hash"] : e.map;
    };
    Fe.prototype.clear = function() {
      this.size = 0, this.__data__ = { hash: new Vd(), map: new (Hg || $g)(), string: new Vd() };
    }, Fe.prototype.delete = function(e) {
      return e = gi(this, e).delete(e), this.size -= e ? 1 : 0, e;
    }, Fe.prototype.get = function(e) {
      return gi(this, e).get(e);
    }, Fe.prototype.has = function(e) {
      return gi(this, e).has(e);
    }, Fe.prototype.set = function(e, t) {
      var n = gi(this, e), r = n.size;
      return n.set(e, t), this.size += n.size == r ? 0 : 1, this;
    };
    var Zg = Fe;
    Lf.prototype.add = Lf.prototype.push = function(e) {
      return this.__data__.set(e, "__lodash_hash_undefined__"), this;
    }, Lf.prototype.has = function(e) {
      return this.__data__.has(e);
    };
    var Yq = function(e, t, n, r) {
      var o = e.length;
      for (n += r ? 1 : -1; r ? n-- : ++n < o; )
        if (t(e[n], n, e))
          return n;
      return -1;
    }, Iz = function(e) {
      return e != e;
    }, Jz = function(e, t) {
      var n;
      if (n = !(e == null || !e.length)) {
        if (t == t)
          t: {
            n = -1;
            for (var r = e.length; ++n < r; )
              if (e[n] === t) {
                e = n;
                break t;
              }
            e = -1;
          }
        else
          e = Yq(e, Iz, 0);
        n = -1 < e;
      }
      return n;
    }, Kz = function(e, t, n) {
      for (var r = -1, o = e == null ? 0 : e.length; ++r < o; )
        if (n(t, e[r]))
          return !0;
      return !1;
    }, Lz = function(e, t) {
      return e.has(t);
    }, uf = oe($b, "Set"), Mz = function() {
    }, el = function(e) {
      var t = -1, n = Array(e.size);
      return e.forEach(function(r) {
        n[++t] = r;
      }), n;
    }, Nz = 1 / 0, Oz = uf && 1 / el(new uf([, -0]))[1] == Nz ? function(e) {
      return new uf(e);
    } : Mz, fl = function(e, t, n) {
      var r = -1, o = Jz, i = e.length, s = !0, u = [], a = u;
      if (n)
        s = !1, o = Kz;
      else if (200 <= i) {
        if (o = t ? null : Oz(e))
          return el(o);
        s = !1, o = Lz, a = new Lf();
      } else
        a = t ? [] : u;
      t:
        for (; ++r < i; ) {
          var l = e[r], f = t ? t(l) : l;
          if (l = n || l !== 0 ? l : 0, s && f == f) {
            for (var h = a.length; h--; )
              if (a[h] === f)
                continue t;
            t && a.push(f), u.push(l);
          } else
            o(a, f, n) || (a !== u && a.push(f), u.push(l));
        }
      return u;
    }, Zq = function(e) {
      for (var t = -1, n = e == null ? 0 : e.length, r = {}; ++t < n; ) {
        var o = e[t];
        r[o[0]] = o[1];
      }
      return r;
    }, Je = function(e, t) {
      for (var n = -1, r = e == null ? 0 : e.length, o = Array(r); ++n < r; )
        o[n] = t(e[n], n, e);
      return o;
    };
    Ge.prototype.clear = function() {
      this.__data__ = new $g(), this.size = 0;
    }, Ge.prototype.delete = function(e) {
      var t = this.__data__;
      return e = t.delete(e), this.size = t.size, e;
    }, Ge.prototype.get = function(e) {
      return this.__data__.get(e);
    }, Ge.prototype.has = function(e) {
      return this.__data__.has(e);
    }, Ge.prototype.set = function(e, t) {
      var n = this.__data__;
      if (n instanceof $g) {
        var r = n.__data__;
        if (!Hg || 199 > r.length)
          return r.push([e, t]), this.size = ++n.size, this;
        n = this.__data__ = new Zg(r);
      }
      return n.set(e, t), this.size = n.size, this;
    };
    var Ie = Ge, su = function(e, t) {
      for (var n = -1, r = e == null ? 0 : e.length; ++n < r && t(e[n], n, e) !== !1; )
        ;
      return e;
    }, hi = function() {
      try {
        var e = oe(Object, "defineProperty");
        return e({}, "", {}), e;
      } catch (t) {
      }
    }(), Ig = function(e, t, n) {
      t == "__proto__" && hi ? hi(e, t, { configurable: !0, enumerable: !0, value: n, writable: !0 }) : e[t] = n;
    }, Pz = Object.prototype.hasOwnProperty, Qm = function(e, t, n) {
      var r = e[t];
      Pz.call(e, t) && Gg(r, n) && (n !== void 0 || t in e) || Ig(e, t, n);
    }, Ue = function(e, t, n, r) {
      var o = !n;
      n || (n = {});
      for (var i = -1, s = t.length; ++i < s; ) {
        var u = t[i], a = r ? r(n[u], e[u], u, n, e) : void 0;
        a === void 0 && (a = e[u]), o ? Ig(n, u, a) : Qm(n, u, a);
      }
      return n;
    }, Hc = function(e) {
      return e != null && qa(e) == "object";
    }, $q = function(e) {
      return Hc(e) && me(e) == "[object Arguments]";
    }, ar = Object.prototype, Qz = ar.hasOwnProperty, Rz = ar.propertyIsEnumerable, Vf = $q(function() {
      return arguments;
    }()) ? $q : function(e) {
      return Hc(e) && Qz.call(e, "callee") && !Rz.call(e, "callee");
    }, ub = Array.isArray, Sz = function() {
      return !1;
    }, Nf = xb(function(e, t) {
      var n = (t = t && !t.nodeType && t) && e && !e.nodeType && e;
      t = n && n.exports === t ? $b.Buffer : void 0, e.exports = (t ? t.isBuffer : void 0) || Sz;
    }), Tz = /^(?:0|[1-9]\d*)$/, gl = function(e, t) {
      var n = qa(e);
      return !!(t = t == null ? 9007199254740991 : t) && (n == "number" || n != "symbol" && Tz.test(e)) && -1 < e && e % 1 == 0 && e < t;
    }, hl = function(e) {
      return typeof e == "number" && -1 < e && e % 1 == 0 && 9007199254740991 >= e;
    }, Va = {};
    Va["[object Float32Array]"] = Va["[object Float64Array]"] = Va["[object Int8Array]"] = Va["[object Int16Array]"] = Va["[object Int32Array]"] = Va["[object Uint8Array]"] = Va["[object Uint8ClampedArray]"] = Va["[object Uint16Array]"] = Va["[object Uint32Array]"] = !0, Va["[object Arguments]"] = Va["[object Array]"] = Va["[object ArrayBuffer]"] = Va["[object Boolean]"] = Va["[object DataView]"] = Va["[object Date]"] = Va["[object Error]"] = Va["[object Function]"] = Va["[object Map]"] = Va["[object Number]"] = Va["[object Object]"] = Va["[object RegExp]"] = Va["[object Set]"] = Va["[object String]"] = Va["[object WeakMap]"] = !1;
    var Uz = function(e) {
      return Hc(e) && hl(e.length) && !!Va[me(e)];
    }, ii = function(e) {
      return function(t) {
        return e(t);
      };
    }, vf = xb(function(e, t) {
      var n = t && !t.nodeType && t;
      n = (t = n && e && !e.nodeType && e) && t.exports === n && Uq.process;
      t: {
        try {
          var r = t && t.require && t.require("util").types;
          if (r) {
            var o = r;
            break t;
          }
          o = n && n.binding && n.binding("util");
          break t;
        } catch (i) {
        }
        o = void 0;
      }
      e.exports = o;
    }), br = vf && vf.isTypedArray, Ui = br ? ii(br) : Uz, Vz = Object.prototype.hasOwnProperty, cr = function(e, t) {
      var n = ub(e), r = !n && Vf(e), o = !n && !r && Nf(e), i = !n && !r && !o && Ui(e);
      if (n = n || r || o || i) {
        r = e.length;
        for (var s = String, u = -1, a = Array(r); ++u < r; )
          a[u] = s(u);
        r = a;
      } else
        r = [];
      for (var l in s = r.length, e)
        !t && !Vz.call(e, l) || n && (l == "length" || o && (l == "offset" || l == "parent") || i && (l == "buffer" || l == "byteLength" || l == "byteOffset") || gl(l, s)) || r.push(l);
      return r;
    }, Wz = Object.prototype, il = function(e) {
      var t = e && e.constructor;
      return e === (typeof t == "function" && t.prototype || Wz);
    }, dr = function(e, t) {
      return function(n) {
        return e(t(n));
      };
    }, Xz = dr(Object.keys, Object), Yz = Object.prototype.hasOwnProperty, ae = function(e) {
      return e != null && hl(e.length) && !jj(e);
    }, Wd = function(e) {
      if (ae(e))
        e = cr(e);
      else if (il(e)) {
        var t, n = [];
        for (t in Object(e))
          Yz.call(e, t) && t != "constructor" && n.push(t);
        e = n;
      } else
        e = Xz(e);
      return e;
    }, ou = function(e, t) {
      return e && Ue(t, Wd(t), e);
    }, Zz = Object.prototype.hasOwnProperty, Of = function(e) {
      if (ae(e))
        e = cr(e, !0);
      else if (Gb(e)) {
        var t = il(e), n = [];
        for (r in e)
          (r != "constructor" || !t && Zz.call(e, r)) && n.push(r);
        e = n;
      } else {
        var r = [];
        if (e != null)
          for (t in Object(e))
            r.push(t);
        e = r;
      }
      return e;
    }, mu = function(e, t) {
      return e && Ue(t, Of(t), e);
    }, Nm = xb(function(e, t) {
      var n = (t = t && !t.nodeType && t) && e && !e.nodeType && e, r = (t = n && n.exports === t ? $b.Buffer : void 0) ? t.allocUnsafe : void 0;
      e.exports = function(o, i) {
        return i ? o.slice() : (i = o.length, i = r ? r(i) : new o.constructor(i), o.copy(i), i);
      };
    }), Pi = function(e, t) {
      var n = -1, r = e.length;
      for (t || (t = Array(r)); ++n < r; )
        t[n] = e[n];
      return t;
    }, $z = function(e, t) {
      for (var n = -1, r = e == null ? 0 : e.length, o = 0, i = []; ++n < r; ) {
        var s = e[n];
        t(s, n, e) && (i[o++] = s);
      }
      return i;
    }, er = function() {
      return [];
    }, aA = Object.prototype.propertyIsEnumerable, fr = Object.getOwnPropertySymbols, jl = fr ? function(e) {
      return e == null ? [] : (e = Object(e), $z(fr(e), function(t) {
        return aA.call(e, t);
      }));
    } : er, nu = function(e, t) {
      return Ue(e, jl(e), t);
    }, Ti = function(e, t) {
      for (var n = -1, r = t.length, o = e.length; ++n < r; )
        e[o + n] = t[n];
      return e;
    }, kl = dr(Object.getPrototypeOf, Object), gr = Object.getOwnPropertySymbols ? function(e) {
      for (var t = []; e; )
        Ti(t, jl(e)), e = kl(e);
      return t;
    } : er, lu = function(e, t) {
      return Ue(e, gr(e), t);
    }, hr = function(e, t, n) {
      return t = t(e), ub(e) ? t : Ti(t, n(e));
    }, Qi = function(e) {
      return hr(e, Wd, jl);
    }, Pm = function(e) {
      return hr(e, Of, gr);
    }, ll = oe($b, "DataView"), ml = oe($b, "Promise"), nl = oe($b, "WeakMap"), bA = ne(ll), cA = ne(Hg), dA = ne(ml), eA = ne(uf), fA = ne(nl), pe = me;
    (ll && pe(new ll(new ArrayBuffer(1))) != "[object DataView]" || Hg && pe(new Hg()) != "[object Map]" || ml && pe(ml.resolve()) != "[object Promise]" || uf && pe(new uf()) != "[object Set]" || nl && pe(new nl()) != "[object WeakMap]") && (pe = function(e) {
      var t = me(e);
      if (e = (e = t == "[object Object]" ? e.constructor : void 0) ? ne(e) : "")
        switch (e) {
          case bA:
            return "[object DataView]";
          case cA:
            return "[object Map]";
          case dA:
            return "[object Promise]";
          case eA:
            return "[object Set]";
          case fA:
            return "[object WeakMap]";
        }
      return t;
    });
    var Mf = pe, gA = Object.prototype.hasOwnProperty, ku = function(e) {
      var t = e.length, n = new e.constructor(t);
      return t && typeof e[0] == "string" && gA.call(e, "index") && (n.index = e.index, n.input = e.input), n;
    }, ji = $b.Uint8Array, ol = function(e) {
      var t = new e.constructor(e.byteLength);
      return new ji(t).set(new ji(e)), t;
    }, hA = /\w*$/, ir = lc ? lc.prototype : void 0, jr = ir ? ir.valueOf : void 0, Bn = function(e, t) {
      return t = t ? ol(e.buffer) : e.buffer, new e.constructor(t, e.byteOffset, e.length);
    }, pu = function(e, t, n) {
      var r = e.constructor;
      switch (t) {
        case "[object ArrayBuffer]":
          return ol(e);
        case "[object Boolean]":
        case "[object Date]":
          return new r(+e);
        case "[object DataView]":
          return t = n ? ol(e.buffer) : e.buffer, new e.constructor(t, e.byteOffset, e.byteLength);
        case "[object Float32Array]":
        case "[object Float64Array]":
        case "[object Int8Array]":
        case "[object Int16Array]":
        case "[object Int32Array]":
        case "[object Uint8Array]":
        case "[object Uint8ClampedArray]":
        case "[object Uint16Array]":
        case "[object Uint32Array]":
          return Bn(e, n);
        case "[object Map]":
          return new r();
        case "[object Number]":
        case "[object String]":
          return new r(e);
        case "[object RegExp]":
          return (t = new e.constructor(e.source, hA.exec(e))).lastIndex = e.lastIndex, t;
        case "[object Set]":
          return new r();
        case "[object Symbol]":
          return jr ? Object(jr.call(e)) : {};
      }
    }, kr = Object.create, iA = function() {
      function e() {
      }
      return function(t) {
        return Gb(t) ? kr ? kr(t) : (e.prototype = t, t = new e(), e.prototype = void 0, t) : {};
      };
    }(), Om = function(e) {
      return typeof e.constructor != "function" || il(e) ? {} : iA(kl(e));
    }, jA = function(e) {
      return Hc(e) && Mf(e) == "[object Map]";
    }, lr = vf && vf.isMap, ru = lr ? ii(lr) : jA, kA = function(e) {
      return Hc(e) && Mf(e) == "[object Set]";
    }, mr = vf && vf.isSet, qu = mr ? ii(mr) : kA, Oa = {};
    Oa["[object Arguments]"] = Oa["[object Array]"] = Oa["[object ArrayBuffer]"] = Oa["[object DataView]"] = Oa["[object Boolean]"] = Oa["[object Date]"] = Oa["[object Float32Array]"] = Oa["[object Float64Array]"] = Oa["[object Int8Array]"] = Oa["[object Int16Array]"] = Oa["[object Int32Array]"] = Oa["[object Map]"] = Oa["[object Number]"] = Oa["[object Object]"] = Oa["[object RegExp]"] = Oa["[object Set]"] = Oa["[object String]"] = Oa["[object Symbol]"] = Oa["[object Uint8Array]"] = Oa["[object Uint8ClampedArray]"] = Oa["[object Uint16Array]"] = Oa["[object Uint32Array]"] = !0, Oa["[object Error]"] = Oa["[object Function]"] = Oa["[object WeakMap]"] = !1;
    var Ke = function(e) {
      return qa(e) == "symbol" || Hc(e) && me(e) == "[object Symbol]";
    }, lA = /\.|\[(?:[^[\]]*|(["'])(?:(?!\1)[^\\]|\\.)*?\1)\]/, mA = /^\w*$/, pl = function(e, t) {
      if (ub(e))
        return !1;
      var n = qa(e);
      return !(n != "number" && n != "symbol" && n != "boolean" && e != null && !Ke(e)) || mA.test(e) || !lA.test(e) || t != null && e in Object(t);
    };
    Ri.Cache = Zg;
    var nA = /[^.[\]]+|\[(?:(-?\d+(?:\.\d+)?)|(["'])((?:(?!\2)[^\\]|\\.)*?)\2)\]|(?=(?:\.|\[\])(?:\.|\[\]|$))/g, oA = /\\(\\)?/g, pA = function(e) {
      var t = (e = Ri(e, function(n) {
        return t.size === 500 && t.clear(), n;
      })).cache;
      return e;
    }(function(e) {
      var t = [];
      return e.charCodeAt(0) === 46 && t.push(""), e.replace(nA, function(n, r, o, i) {
        t.push(o ? i.replace(oA, "$1") : r || n);
      }), t;
    }), tu = 1 / 0, nr = lc ? lc.prototype : void 0, Sm = nr ? nr.toString : void 0, ki = function(e, t) {
      return ub(e) ? e : pl(e, t) ? [e] : pA(e == null ? "" : Rm(e));
    }, qA = 1 / 0, Jg = function(e) {
      if (typeof e == "string" || Ke(e))
        return e;
      var t = e + "";
      return t == "0" && 1 / e == -qA ? "-0" : t;
    }, li = function(e, t) {
      for (var n = 0, r = (t = ki(t, e)).length; e != null && n < r; )
        e = e[Jg(t[n++])];
      return n && n == r ? e : void 0;
    }, rA = function(e, t) {
      if (!(2 > (t = ki(t, e)).length)) {
        var n = t, r = 0, o = -1, i = -1, s = n.length;
        for (0 > r && (r = -r > s ? 0 : s + r), 0 > (o = o > s ? s : o) && (o += s), s = r > o ? 0 : o - r >>> 0, r >>>= 0, o = Array(s); ++i < s; )
          o[i] = n[i + r];
        e = li(e, o);
      }
      return (n = e == null) || (n = t == null ? 0 : t.length, n = delete e[Jg(n ? t[n - 1] : void 0)]), n;
    }, or = Function.prototype.toString, sA = Object.prototype.hasOwnProperty, tA = or.call(Object), Cn = function(e) {
      return !(!Hc(e) || me(e) != "[object Object]") && ((e = kl(e)) === null || typeof (e = sA.call(e, "constructor") && e.constructor) == "function" && e instanceof e && or.call(e) == tA);
    }, uA = function(e) {
      return Cn(e) ? void 0 : e;
    }, pr = lc ? lc.isConcatSpreadable : void 0, uu = function(e) {
      return ub(e) || Vf(e) || !!(pr && e && e[pr]);
    }, vA = function(e) {
      return e != null && e.length ? Si(e, 1) : [];
    }, wA = function(e, t, n) {
      switch (n.length) {
        case 0:
          return e.call(t);
        case 1:
          return e.call(t, n[0]);
        case 2:
          return e.call(t, n[0], n[1]);
        case 3:
          return e.call(t, n[0], n[1], n[2]);
      }
      return e.apply(t, n);
    }, qr = Math.max, rr = function(e, t, n) {
      return t = qr(t === void 0 ? e.length - 1 : t, 0), function() {
        for (var r = arguments, o = -1, i = qr(r.length - t, 0), s = Array(i); ++o < i; )
          s[o] = r[t + o];
        for (o = -1, i = Array(t + 1); ++o < t; )
          i[o] = r[o];
        return i[t] = n(s), wA(e, this, i);
      };
    }, xA = function(e) {
      return function() {
        return e;
      };
    }, mi = function(e) {
      return e;
    }, yA = Date.now, sr = function(e) {
      var t = 0, n = 0;
      return function() {
        var r = yA(), o = 16 - (r - n);
        if (n = r, 0 < o) {
          if (800 <= ++t)
            return arguments[0];
        } else
          t = 0;
        return e.apply(void 0, arguments);
      };
    }(hi ? function(e, t) {
      return hi(e, "toString", { configurable: !0, enumerable: !1, value: xA(t), writable: !0 });
    } : mi), ql = function(e) {
      return sr(rr(e, void 0, vA), e + "");
    }(function(e, t) {
      var n = {};
      if (e == null)
        return n;
      var r = !1;
      t = Je(t, function(i) {
        return i = ki(i, e), r || (r = 1 < i.length), i;
      }), Ue(e, Pm(e), n), r && (n = He(n, 7, uA));
      for (var o = t.length; o--; )
        rA(n, t[o]);
      return n;
    }), zA = function(e, t, n, r) {
      for (var o = -1, i = e == null ? 0 : e.length; ++o < i; ) {
        var s = e[o];
        t(r, s, n(s), e);
      }
      return r;
    }, An = function(e, t, n) {
      for (var r = -1, o = Object(e), i = (n = n(e)).length; i--; ) {
        var s = n[++r];
        if (t(o[s], s, o) === !1)
          break;
      }
      return e;
    }, tr = function(e, t) {
      return e && An(e, t, Wd);
    }, rl = function(e, t) {
      return function(n, r) {
        if (n == null)
          return n;
        if (!ae(n))
          return e(n, r);
        for (var o = n.length, i = -1, s = Object(n); ++i < o && r(s[i], i, s) !== !1; )
          ;
        return n;
      };
    }(tr), AA = function(e, t, n, r) {
      return rl(e, function(o, i, s) {
        t(r, o, n(o), s);
      }), r;
    }, ur = function(e, t) {
      for (var n = -1, r = e == null ? 0 : e.length; ++n < r; )
        if (t(e[n], n, e))
          return !0;
      return !1;
    }, Tm = function(e, t, n, r, o, i) {
      var s = 1 & n, u = e.length, a = t.length;
      if (u != a && !(s && a > u))
        return !1;
      a = i.get(e);
      var l = i.get(t);
      if (a && l)
        return a == t && l == e;
      a = -1, l = !0;
      var f = 2 & n ? new Lf() : void 0;
      for (i.set(e, t), i.set(t, e); ++a < u; ) {
        var h = e[a], d = t[a];
        if (r)
          var p = s ? r(d, h, a, t, e, i) : r(h, d, a, e, t, i);
        if (p !== void 0) {
          if (p)
            continue;
          l = !1;
          break;
        }
        if (f) {
          if (!ur(t, function(v, y) {
            if (!f.has(y) && (h === v || o(h, v, n, r, i)))
              return f.push(y);
          })) {
            l = !1;
            break;
          }
        } else if (h !== d && !o(h, d, n, r, i)) {
          l = !1;
          break;
        }
      }
      return i.delete(e), i.delete(t), l;
    }, BA = function(e) {
      var t = -1, n = Array(e.size);
      return e.forEach(function(r, o) {
        n[++t] = [o, r];
      }), n;
    }, vr = lc ? lc.prototype : void 0, sl = vr ? vr.valueOf : void 0, vu = function(e, t, n, r, o, i, s) {
      switch (n) {
        case "[object DataView]":
          if (e.byteLength != t.byteLength || e.byteOffset != t.byteOffset)
            break;
          e = e.buffer, t = t.buffer;
        case "[object ArrayBuffer]":
          if (e.byteLength != t.byteLength || !i(new ji(e), new ji(t)))
            break;
          return !0;
        case "[object Boolean]":
        case "[object Date]":
        case "[object Number]":
          return Gg(+e, +t);
        case "[object Error]":
          return e.name == t.name && e.message == t.message;
        case "[object RegExp]":
        case "[object String]":
          return e == t + "";
        case "[object Map]":
          var u = BA;
        case "[object Set]":
          if (u || (u = el), e.size != t.size && !(1 & r))
            break;
          return (n = s.get(e)) ? n == t : (r |= 2, s.set(e, t), t = Tm(u(e), u(t), r, o, i, s), s.delete(e), t);
        case "[object Symbol]":
          if (sl)
            return sl.call(e) == sl.call(t);
      }
      return !1;
    }, wu = Object.prototype.hasOwnProperty, Um = Object.prototype.hasOwnProperty, CA = function(e, t, n, r) {
      var o = n.length, i = o, s = !r;
      if (e == null)
        return !i;
      for (e = Object(e); o--; ) {
        var u = n[o];
        if (s && u[2] ? u[1] !== e[u[0]] : !(u[0] in e))
          return !1;
      }
      for (; ++o < i; ) {
        var a = (u = n[o])[0], l = e[a], f = u[1];
        if (s && u[2]) {
          if (l === void 0 && !(a in e))
            return !1;
        } else {
          if (u = new Ie(), r)
            var h = r(l, f, a, e, t, u);
          if (h === void 0 ? !Le(f, l, 3, r, u) : !h)
            return !1;
        }
      }
      return !0;
    }, DA = function(e) {
      for (var t = Wd(e), n = t.length; n--; ) {
        var r = t[n], o = e[r];
        t[n] = [r, o, o == o && !Gb(o)];
      }
      return t;
    }, wr = function(e, t) {
      return function(n) {
        return n != null && n[e] === t && (t !== void 0 || e in Object(n));
      };
    }, EA = function(e) {
      var t = DA(e);
      return t.length == 1 && t[0][2] ? wr(t[0][0], t[0][1]) : function(n) {
        return n === e || CA(n, e, t);
      };
    }, FA = function(e, t) {
      return pl(e) && t == t && !Gb(t) ? wr(Jg(e), t) : function(n) {
        var r = n == null ? void 0 : li(n, e);
        if ((r = r === void 0 ? void 0 : r) === void 0 && r === t) {
          if (r = n != null) {
            for (var o = -1, i = (r = ki(r = e, n)).length, s = !1; ++o < i; ) {
              var u = Jg(r[o]);
              if (!(s = n != null && n != null && u in Object(n)))
                break;
              n = n[u];
            }
            s || ++o != i ? r = s : r = !!(i = n == null ? 0 : n.length) && hl(i) && gl(u, i) && (ub(n) || Vf(n));
          }
          u = r;
        } else
          u = Le(t, r, 3);
        return u;
      };
    }, GA = function(e) {
      return function(t) {
        return t == null ? void 0 : t[e];
      };
    }, HA = function(e) {
      return function(t) {
        return li(t, e);
      };
    }, wf = function(e) {
      return typeof e == "function" ? e : e == null ? mi : qa(e) == "object" ? ub(e) ? FA(e[0], e[1]) : EA(e) : pl(e) ? GA(Jg(e)) : HA(e);
    }, tl = function(e, t) {
      return function(n, r) {
        var o = {};
        return (ub(n) ? zA : AA)(n, e, wf(r), o);
      };
    }(function(e, t, n) {
      Ig(e, n, t);
    }), md = function(e, t) {
      var n = {};
      return t = wf(t), tr(e, function(r, o, i) {
        Ig(n, o, t(r, o, i));
      }), n;
    };
    ea({ target: "String", proto: !0, forced: la(function() {
      var e = "".sub('"');
      return e !== e.toLowerCase() || 3 < e.split('"').length;
    }) }, { sub: function() {
      return "<sub>" + String(Eb(this)) + "</sub>";
    } });
    var P = Pa, mc = null;
    try {
      mc = new WebAssembly.Instance(new WebAssembly.Module(new Uint8Array([0, 97, 115, 109, 1, 0, 0, 0, 1, 13, 2, 96, 0, 1, 127, 96, 4, 127, 127, 127, 127, 1, 127, 3, 7, 6, 0, 1, 1, 1, 1, 1, 6, 6, 1, 127, 1, 65, 0, 11, 7, 50, 6, 3, 109, 117, 108, 0, 1, 5, 100, 105, 118, 95, 115, 0, 2, 5, 100, 105, 118, 95, 117, 0, 3, 5, 114, 101, 109, 95, 115, 0, 4, 5, 114, 101, 109, 95, 117, 0, 5, 8, 103, 101, 116, 95, 104, 105, 103, 104, 0, 0, 10, 191, 1, 6, 4, 0, 35, 0, 11, 36, 1, 1, 126, 32, 0, 173, 32, 1, 173, 66, 32, 134, 132, 32, 2, 173, 32, 3, 173, 66, 32, 134, 132, 126, 34, 4, 66, 32, 135, 167, 36, 0, 32, 4, 167, 11, 36, 1, 1, 126, 32, 0, 173, 32, 1, 173, 66, 32, 134, 132, 32, 2, 173, 32, 3, 173, 66, 32, 134, 132, 127, 34, 4, 66, 32, 135, 167, 36, 0, 32, 4, 167, 11, 36, 1, 1, 126, 32, 0, 173, 32, 1, 173, 66, 32, 134, 132, 32, 2, 173, 32, 3, 173, 66, 32, 134, 132, 128, 34, 4, 66, 32, 135, 167, 36, 0, 32, 4, 167, 11, 36, 1, 1, 126, 32, 0, 173, 32, 1, 173, 66, 32, 134, 132, 32, 2, 173, 32, 3, 173, 66, 32, 134, 132, 129, 34, 4, 66, 32, 135, 167, 36, 0, 32, 4, 167, 11, 36, 1, 1, 126, 32, 0, 173, 32, 1, 173, 66, 32, 134, 132, 32, 2, 173, 32, 3, 173, 66, 32, 134, 132, 130, 34, 4, 66, 32, 135, 167, 36, 0, 32, 4, 167, 11])), {}).exports;
    } catch (e) {
    }
    Pa.prototype.__isLong__, Object.defineProperty(Pa.prototype, "__isLong__", { value: !0 }), Pa.isLong = Hb;
    var Wm = {}, Vm = {};
    Pa.fromInt = Xd, Pa.fromNumber = ec, Pa.fromBits = Qa;
    var ah = Math.pow;
    Pa.fromString = Vi, Pa.fromValue = vc;
    var Me = 4294967296, Xm = Me * Me, Zm = Xm / 2, xr = Xd(16777216), fc = Xd(0);
    Pa.ZERO = fc;
    var Yd = Xd(0, !0);
    Pa.UZERO = Yd;
    var xf = Xd(1);
    Pa.ONE = xf;
    var yr = Xd(1, !0);
    Pa.UONE = yr;
    var ul = Xd(-1);
    Pa.NEG_ONE = ul;
    var $m = Qa(-1, 2147483647, !1);
    Pa.MAX_VALUE = $m;
    var Ym = Qa(-1, -1, !0);
    Pa.MAX_UNSIGNED_VALUE = Ym;
    var Ib = Qa(0, -2147483648, !1);
    Pa.MIN_VALUE = Ib;
    var V = Pa.prototype;
    V.toInt = function() {
      return this.unsigned ? this.low >>> 0 : this.low;
    }, V.toNumber = function() {
      return this.unsigned ? (this.high >>> 0) * Me + (this.low >>> 0) : this.high * Me + (this.low >>> 0);
    }, V.toString = function(e) {
      if (2 > (e = e || 10) || 36 < e)
        throw RangeError("radix");
      if (this.isZero())
        return "0";
      if (this.isNegative()) {
        if (this.eq(Ib)) {
          var t = ec(e), n = this.div(t);
          return t = n.mul(t).sub(this), n.toString(e) + t.toInt().toString(e);
        }
        return "-" + this.neg().toString(e);
      }
      n = ec(ah(e, 6), this.unsigned), t = this;
      for (var r = ""; ; ) {
        var o = t.div(n), i = (t.sub(o.mul(n)).toInt() >>> 0).toString(e);
        if ((t = o).isZero())
          return i + r;
        for (; 6 > i.length; )
          i = "0" + i;
        r = "" + i + r;
      }
    }, V.getHighBits = function() {
      return this.high;
    }, V.getHighBitsUnsigned = function() {
      return this.high >>> 0;
    }, V.getLowBits = function() {
      return this.low;
    }, V.getLowBitsUnsigned = function() {
      return this.low >>> 0;
    }, V.getNumBitsAbs = function() {
      if (this.isNegative())
        return this.eq(Ib) ? 64 : this.neg().getNumBitsAbs();
      for (var e = this.high != 0 ? this.high : this.low, t = 31; 0 < t && !(e & 1 << t); t--)
        ;
      return this.high != 0 ? t + 33 : t + 1;
    }, V.isZero = function() {
      return this.high === 0 && this.low === 0;
    }, V.eqz = V.isZero, V.isNegative = function() {
      return !this.unsigned && 0 > this.high;
    }, V.isPositive = function() {
      return this.unsigned || 0 <= this.high;
    }, V.isOdd = function() {
      return (1 & this.low) == 1;
    }, V.isEven = function() {
      return (1 & this.low) == 0;
    }, V.equals = function(e) {
      return Hb(e) || (e = vc(e)), (this.unsigned === e.unsigned || this.high >>> 31 != 1 || e.high >>> 31 != 1) && this.high === e.high && this.low === e.low;
    }, V.eq = V.equals, V.notEquals = function(e) {
      return !this.eq(e);
    }, V.neq = V.notEquals, V.ne = V.notEquals, V.lessThan = function(e) {
      return 0 > this.comp(e);
    }, V.lt = V.lessThan, V.lessThanOrEqual = function(e) {
      return 0 >= this.comp(e);
    }, V.lte = V.lessThanOrEqual, V.le = V.lessThanOrEqual, V.greaterThan = function(e) {
      return 0 < this.comp(e);
    }, V.gt = V.greaterThan, V.greaterThanOrEqual = function(e) {
      return 0 <= this.comp(e);
    }, V.gte = V.greaterThanOrEqual, V.ge = V.greaterThanOrEqual, V.compare = function(e) {
      if (Hb(e) || (e = vc(e)), this.eq(e))
        return 0;
      var t = this.isNegative(), n = e.isNegative();
      return t && !n ? -1 : !t && n ? 1 : this.unsigned ? e.high >>> 0 > this.high >>> 0 || e.high === this.high && e.low >>> 0 > this.low >>> 0 ? -1 : 1 : this.sub(e).isNegative() ? -1 : 1;
    }, V.comp = V.compare, V.negate = function() {
      return !this.unsigned && this.eq(Ib) ? Ib : this.not().add(xf);
    }, V.neg = V.negate, V.add = function(e) {
      Hb(e) || (e = vc(e));
      var t = this.high >>> 16, n = 65535 & this.high, r = this.low >>> 16, o = e.high >>> 16, i = 65535 & e.high, s = e.low >>> 16;
      return r = (s = ((e = (65535 & this.low) + (65535 & e.low)) >>> 16) + (r + s)) >>> 16, Qa((65535 & s) << 16 | 65535 & e, (t = ((r += n + i) >>> 16) + (t + o) & 65535) << 16 | 65535 & r, this.unsigned);
    }, V.subtract = function(e) {
      return Hb(e) || (e = vc(e)), this.add(e.neg());
    }, V.sub = V.subtract, V.multiply = function(e) {
      if (this.isZero())
        return fc;
      if (Hb(e) || (e = vc(e)), mc) {
        var t = mc.mul(this.low, this.high, e.low, e.high);
        return Qa(t, mc.get_high(), this.unsigned);
      }
      if (e.isZero())
        return fc;
      if (this.eq(Ib))
        return e.isOdd() ? Ib : fc;
      if (e.eq(Ib))
        return this.isOdd() ? Ib : fc;
      if (this.isNegative())
        return e.isNegative() ? this.neg().mul(e.neg()) : this.neg().mul(e).neg();
      if (e.isNegative())
        return this.mul(e.neg()).neg();
      if (this.lt(xr) && e.lt(xr))
        return ec(this.toNumber() * e.toNumber(), this.unsigned);
      t = this.high >>> 16;
      var n = 65535 & this.high, r = this.low >>> 16, o = 65535 & this.low, i = e.high >>> 16, s = 65535 & e.high, u = e.low >>> 16, a = o * (e = 65535 & e.low), l = (a >>> 16) + r * e, f = l >>> 16;
      f += (l = (65535 & l) + o * u) >>> 16;
      var h = (f += n * e) >>> 16;
      return Qa((65535 & l) << 16 | 65535 & a, (h = (h += (f = (65535 & f) + r * u) >>> 16) + ((f = (65535 & f) + o * s) >>> 16) + (t * e + n * u + r * s + o * i) & 65535) << 16 | 65535 & f, this.unsigned);
    }, V.mul = V.multiply, V.divide = function(e) {
      if (Hb(e) || (e = vc(e)), e.isZero())
        throw Error("division by zero");
      if (mc)
        return this.unsigned || this.high !== -2147483648 || e.low !== -1 || e.high !== -1 ? Qa(e = (this.unsigned ? mc.div_u : mc.div_s)(this.low, this.high, e.low, e.high), mc.get_high(), this.unsigned) : this;
      if (this.isZero())
        return this.unsigned ? Yd : fc;
      if (this.unsigned) {
        if (e.unsigned || (e = e.toUnsigned()), e.gt(this))
          return Yd;
        if (e.gt(this.shru(1)))
          return yr;
        var t = Yd;
      } else {
        if (this.eq(Ib)) {
          if (e.eq(xf) || e.eq(ul))
            return Ib;
          if (e.eq(Ib))
            return xf;
          var n = this.shr(1).div(e).shl(1);
          if (n.eq(fc))
            return e.isNegative() ? xf : ul;
          var r = this.sub(e.mul(n));
          return n.add(r.div(e));
        }
        if (e.eq(Ib))
          return this.unsigned ? Yd : fc;
        if (this.isNegative())
          return e.isNegative() ? this.neg().div(e.neg()) : this.neg().div(e).neg();
        if (e.isNegative())
          return this.div(e.neg()).neg();
        t = fc;
      }
      for (r = this; r.gte(e); ) {
        n = Math.max(1, Math.floor(r.toNumber() / e.toNumber()));
        var o = Math.ceil(Math.log(n) / Math.LN2);
        o = 48 >= o ? 1 : ah(2, o - 48);
        for (var i = ec(n), s = i.mul(e); s.isNegative() || s.gt(r); )
          s = (i = ec(n -= o, this.unsigned)).mul(e);
        i.isZero() && (i = xf), t = t.add(i), r = r.sub(s);
      }
      return t;
    }, V.div = V.divide, V.modulo = function(e) {
      return Hb(e) || (e = vc(e)), mc ? Qa(e = (this.unsigned ? mc.rem_u : mc.rem_s)(this.low, this.high, e.low, e.high), mc.get_high(), this.unsigned) : this.sub(this.div(e).mul(e));
    }, V.mod = V.modulo, V.rem = V.modulo, V.not = function() {
      return Qa(~this.low, ~this.high, this.unsigned);
    }, V.and = function(e) {
      return Hb(e) || (e = vc(e)), Qa(this.low & e.low, this.high & e.high, this.unsigned);
    }, V.or = function(e) {
      return Hb(e) || (e = vc(e)), Qa(this.low | e.low, this.high | e.high, this.unsigned);
    }, V.xor = function(e) {
      return Hb(e) || (e = vc(e)), Qa(this.low ^ e.low, this.high ^ e.high, this.unsigned);
    }, V.shiftLeft = function(e) {
      return Hb(e) && (e = e.toInt()), (e &= 63) == 0 ? this : 32 > e ? Qa(this.low << e, this.high << e | this.low >>> 32 - e, this.unsigned) : Qa(0, this.low << e - 32, this.unsigned);
    }, V.shl = V.shiftLeft, V.shiftRight = function(e) {
      return Hb(e) && (e = e.toInt()), (e &= 63) == 0 ? this : 32 > e ? Qa(this.low >>> e | this.high << 32 - e, this.high >> e, this.unsigned) : Qa(this.high >> e - 32, 0 <= this.high ? 0 : -1, this.unsigned);
    }, V.shr = V.shiftRight, V.shiftRightUnsigned = function(e) {
      if (Hb(e) && (e = e.toInt()), (e &= 63) === 0)
        return this;
      var t = this.high;
      return 32 > e ? Qa(this.low >>> e | t << 32 - e, t >>> e, this.unsigned) : Qa(e === 32 ? t : t >>> e - 32, 0, this.unsigned);
    }, V.shru = V.shiftRightUnsigned, V.shr_u = V.shiftRightUnsigned, V.toSigned = function() {
      return this.unsigned ? Qa(this.low, this.high, !1) : this;
    }, V.toUnsigned = function() {
      return this.unsigned ? this : Qa(this.low, this.high, !0);
    }, V.toBytes = function(e) {
      return e ? this.toBytesLE() : this.toBytesBE();
    }, V.toBytesLE = function() {
      var e = this.high, t = this.low;
      return [255 & t, t >>> 8 & 255, t >>> 16 & 255, t >>> 24, 255 & e, e >>> 8 & 255, e >>> 16 & 255, e >>> 24];
    }, V.toBytesBE = function() {
      var e = this.high, t = this.low;
      return [e >>> 24, e >>> 16 & 255, e >>> 8 & 255, 255 & e, t >>> 24, t >>> 16 & 255, t >>> 8 & 255, 255 & t];
    }, Pa.fromBytes = function(e, t, n) {
      return n ? Pa.fromBytesLE(e, t) : Pa.fromBytesBE(e, t);
    }, Pa.fromBytesLE = function(e, t) {
      return new Pa(e[0] | e[1] << 8 | e[2] << 16 | e[3] << 24, e[4] | e[5] << 8 | e[6] << 16 | e[7] << 24, t);
    }, Pa.fromBytesBE = function(e, t) {
      return new Pa(e[4] << 24 | e[5] << 16 | e[6] << 8 | e[7], e[0] << 24 | e[1] << 16 | e[2] << 8 | e[3], t);
    };
    var Wi = function(e, t) {
      return (Wi = Object.setPrototypeOf || { __proto__: [] } instanceof Array && function(n, r) {
        n.__proto__ = r;
      } || function(n, r) {
        for (var o in r)
          r.hasOwnProperty(o) && (n[o] = r[o]);
      })(e, t);
    }, vl = !1, gc = { Promise: void 0, set useDeprecatedSynchronousErrorHandling(e) {
      e ? console.warn(`DEPRECATED! RxJS was set to use deprecated synchronous error handling behavior by code at: 
` + Error().stack) : vl && console.log("RxJS: Back to a better error behavior. Thank you. <3"), vl = e;
    }, get useDeprecatedSynchronousErrorHandling() {
      return vl;
    } }, ni = { closed: !0, next: function(e) {
    }, error: function(e) {
      if (gc.useDeprecatedSynchronousErrorHandling)
        throw e;
      Oe(e);
    }, complete: function() {
    } }, hc = Array.isArray || function(e) {
      return e && typeof e.length == "number";
    }, Pf = function() {
      function e(t) {
        return Error.call(this), this.message = t ? t.length + ` errors occurred during unsubscription:
` + t.map(function(n, r) {
          return r + 1 + ") " + n.toString();
        }).join(`
  `) : "", this.name = "UnsubscriptionError", this.errors = t, this;
      }
      return e.prototype = Object.create(Error.prototype), e;
    }(), nb = function() {
      function e(t) {
        this.closed = !1, this._subscriptions = this._parentOrParents = null, t && (this._ctorUnsubscribe = !0, this._unsubscribe = t);
      }
      return e.prototype.unsubscribe = function() {
        if (!this.closed) {
          var t = this._parentOrParents, n = this._ctorUnsubscribe, r = this._unsubscribe, o = this._subscriptions;
          if (this.closed = !0, this._subscriptions = this._parentOrParents = null, t instanceof e)
            t.remove(this);
          else if (t !== null)
            for (var i = 0; i < t.length; ++i)
              t[i].remove(this);
          if (Ne(r)) {
            n && (this._unsubscribe = void 0);
            try {
              r.call(this);
            } catch (u) {
              var s = u instanceof Pf ? an(u.errors) : [u];
            }
          }
          if (hc(o)) {
            for (i = -1, t = o.length; ++i < t; )
              if (Xi(n = o[i]))
                try {
                  n.unsubscribe();
                } catch (u) {
                  s = s || [], u instanceof Pf ? s = s.concat(an(u.errors)) : s.push(u);
                }
          }
          if (s)
            throw new Pf(s);
        }
      }, e.prototype.add = function(t) {
        var n = t;
        if (!t)
          return e.EMPTY;
        switch (qa(t)) {
          case "function":
            n = new e(t);
          case "object":
            if (n === this || n.closed || typeof n.unsubscribe != "function")
              return n;
            if (this.closed)
              return n.unsubscribe(), n;
            n instanceof e || (t = n, (n = new e())._subscriptions = [t]);
            break;
          default:
            throw Error("unrecognized teardown " + t + " added to Subscription.");
        }
        if ((t = n._parentOrParents) === null)
          n._parentOrParents = this;
        else if (t instanceof e) {
          if (t === this)
            return n;
          n._parentOrParents = [t, this];
        } else {
          if (t.indexOf(this) !== -1)
            return n;
          t.push(this);
        }
        return (t = this._subscriptions) === null ? this._subscriptions = [n] : t.push(n), n;
      }, e.prototype.remove = function(t) {
        var n = this._subscriptions;
        n && (t = n.indexOf(t)) !== -1 && n.splice(t, 1);
      }, e.EMPTY = function(t) {
        return t.closed = !0, t;
      }(new e()), e;
    }(), oi = typeof Symbol == "function" ? Symbol("rxSubscriber") : "@@rxSubscriber_" + Math.random(), za = function(e) {
      function t(n, r, o) {
        var i = e.call(this) || this;
        switch (i.syncErrorValue = null, i.syncErrorThrown = !1, i.syncErrorThrowable = !1, i.isStopped = !1, arguments.length) {
          case 0:
            i.destination = ni;
            break;
          case 1:
            if (!n) {
              i.destination = ni;
              break;
            }
            if (qa(n) === "object") {
              n instanceof t ? (i.syncErrorThrowable = n.syncErrorThrowable, i.destination = n, n.add(i)) : (i.syncErrorThrowable = !0, i.destination = new zr(i, n));
              break;
            }
          default:
            i.syncErrorThrowable = !0, i.destination = new zr(i, n, r, o);
        }
        return i;
      }
      return ha(t, e), t.prototype[oi] = function() {
        return this;
      }, t.create = function(n, r, o) {
        return (n = new t(n, r, o)).syncErrorThrowable = !1, n;
      }, t.prototype.next = function(n) {
        this.isStopped || this._next(n);
      }, t.prototype.error = function(n) {
        this.isStopped || (this.isStopped = !0, this._error(n));
      }, t.prototype.complete = function() {
        this.isStopped || (this.isStopped = !0, this._complete());
      }, t.prototype.unsubscribe = function() {
        this.closed || (this.isStopped = !0, e.prototype.unsubscribe.call(this));
      }, t.prototype._next = function(n) {
        this.destination.next(n);
      }, t.prototype._error = function(n) {
        this.destination.error(n), this.unsubscribe();
      }, t.prototype._complete = function() {
        this.destination.complete(), this.unsubscribe();
      }, t.prototype._unsubscribeAndRecycle = function() {
        var n = this._parentOrParents;
        return this._parentOrParents = null, this.unsubscribe(), this.isStopped = this.closed = !1, this._parentOrParents = n, this;
      }, t;
    }(nb), zr = function(e) {
      function t(n, r, o, i) {
        var s = e.call(this) || this;
        if (s._parentSubscriber = n, n = s, Ne(r))
          var u = r;
        else
          r && (u = r.next, o = r.error, i = r.complete, r !== ni && (Ne((n = Object.create(r)).unsubscribe) && s.add(n.unsubscribe.bind(n)), n.unsubscribe = s.unsubscribe.bind(s)));
        return s._context = n, s._next = u, s._error = o, s._complete = i, s;
      }
      return ha(t, e), t.prototype.next = function(n) {
        if (!this.isStopped && this._next) {
          var r = this._parentSubscriber;
          gc.useDeprecatedSynchronousErrorHandling && r.syncErrorThrowable ? this.__tryOrSetError(r, this._next, n) && this.unsubscribe() : this.__tryOrUnsub(this._next, n);
        }
      }, t.prototype.error = function(n) {
        if (!this.isStopped) {
          var r = this._parentSubscriber, o = gc.useDeprecatedSynchronousErrorHandling;
          if (this._error)
            o && r.syncErrorThrowable ? this.__tryOrSetError(r, this._error, n) : this.__tryOrUnsub(this._error, n), this.unsubscribe();
          else if (r.syncErrorThrowable)
            o ? (r.syncErrorValue = n, r.syncErrorThrown = !0) : Oe(n), this.unsubscribe();
          else {
            if (this.unsubscribe(), o)
              throw n;
            Oe(n);
          }
        }
      }, t.prototype.complete = function() {
        var n = this;
        if (!this.isStopped) {
          var r = this._parentSubscriber;
          if (this._complete) {
            var o = function() {
              return n._complete.call(n._context);
            };
            gc.useDeprecatedSynchronousErrorHandling && r.syncErrorThrowable ? this.__tryOrSetError(r, o) : this.__tryOrUnsub(o);
          }
          this.unsubscribe();
        }
      }, t.prototype.__tryOrUnsub = function(n, r) {
        try {
          n.call(this._context, r);
        } catch (o) {
          if (this.unsubscribe(), gc.useDeprecatedSynchronousErrorHandling)
            throw o;
          Oe(o);
        }
      }, t.prototype.__tryOrSetError = function(n, r, o) {
        if (!gc.useDeprecatedSynchronousErrorHandling)
          throw Error("bad call");
        try {
          r.call(this._context, o);
        } catch (i) {
          return gc.useDeprecatedSynchronousErrorHandling ? (n.syncErrorValue = i, n.syncErrorThrown = !0) : Oe(i), !0;
        }
        return !1;
      }, t.prototype._unsubscribe = function() {
        var n = this._parentSubscriber;
        this._parentSubscriber = this._context = null, n.unsubscribe();
      }, t;
    }(za), Pe = typeof Symbol == "function" && Symbol.observable || "@@observable", ua = function() {
      function e(t) {
        this._isScalar = !1, t && (this._subscribe = t);
      }
      return e.prototype.lift = function(t) {
        var n = new e();
        return n.source = this, n.operator = t, n;
      }, e.prototype.subscribe = function(t, n, r) {
        var o = this.operator;
        t: {
          if (t) {
            if (t instanceof za)
              break t;
            if (t[oi]) {
              t = t[oi]();
              break t;
            }
          }
          t = t || n || r ? new za(t, n, r) : new za(ni);
        }
        if (o ? t.add(o.call(t, this.source)) : t.add(this.source || gc.useDeprecatedSynchronousErrorHandling && !t.syncErrorThrowable ? this._subscribe(t) : this._trySubscribe(t)), gc.useDeprecatedSynchronousErrorHandling && t.syncErrorThrowable && (t.syncErrorThrowable = !1, t.syncErrorThrown))
          throw t.syncErrorValue;
        return t;
      }, e.prototype._trySubscribe = function(t) {
        try {
          return this._subscribe(t);
        } catch (n) {
          gc.useDeprecatedSynchronousErrorHandling && (t.syncErrorThrown = !0, t.syncErrorValue = n), Yi(t) ? t.error(n) : console.warn(n);
        }
      }, e.prototype.forEach = function(t, n) {
        var r = this;
        return new (n = cn(n))(function(o, i) {
          var s = r.subscribe(function(u) {
            try {
              t(u);
            } catch (a) {
              i(a), s && s.unsubscribe();
            }
          }, i, o);
        });
      }, e.prototype._subscribe = function(t) {
        var n = this.source;
        return n && n.subscribe(t);
      }, e.prototype[Pe] = function() {
        return this;
      }, e.prototype.pipe = function() {
        for (var t = [], n = 0; n < arguments.length; n++)
          t[n] = arguments[n];
        return t.length === 0 ? this : bn(t)(this);
      }, e.prototype.toPromise = function(t) {
        var n = this;
        return new (t = cn(t))(function(r, o) {
          var i;
          n.subscribe(function(s) {
            return i = s;
          }, function(s) {
            return o(s);
          }, function() {
            return r(i);
          });
        });
      }, e.create = function(t) {
        return new e(t);
      }, e;
    }(), Ld = function() {
      function e() {
        return Error.call(this), this.message = "object unsubscribed", this.name = "ObjectUnsubscribedError", this;
      }
      return e.prototype = Object.create(Error.prototype), e;
    }(), Ar = function(e) {
      function t(n, r) {
        var o = e.call(this) || this;
        return o.subject = n, o.subscriber = r, o.closed = !1, o;
      }
      return ha(t, e), t.prototype.unsubscribe = function() {
        if (!this.closed) {
          this.closed = !0;
          var n = this.subject, r = n.observers;
          this.subject = null, !r || r.length === 0 || n.isStopped || n.closed || (n = r.indexOf(this.subscriber)) !== -1 && r.splice(n, 1);
        }
      }, t;
    }(nb), Br = function(e) {
      function t(n) {
        var r = e.call(this, n) || this;
        return r.destination = n, r;
      }
      return ha(t, e), t;
    }(za), rb = function(e) {
      function t() {
        var n = e.call(this) || this;
        return n.observers = [], n.closed = !1, n.isStopped = !1, n.hasError = !1, n.thrownError = null, n;
      }
      return ha(t, e), t.prototype[oi] = function() {
        return new Br(this);
      }, t.prototype.lift = function(n) {
        var r = new Cr(this, this);
        return r.operator = n, r;
      }, t.prototype.next = function(n) {
        if (this.closed)
          throw new Ld();
        if (!this.isStopped) {
          var r = this.observers, o = r.length;
          r = r.slice();
          for (var i = 0; i < o; i++)
            r[i].next(n);
        }
      }, t.prototype.error = function(n) {
        if (this.closed)
          throw new Ld();
        this.hasError = !0, this.thrownError = n, this.isStopped = !0;
        var r = this.observers, o = r.length;
        r = r.slice();
        for (var i = 0; i < o; i++)
          r[i].error(n);
        this.observers.length = 0;
      }, t.prototype.complete = function() {
        if (this.closed)
          throw new Ld();
        this.isStopped = !0;
        var n = this.observers, r = n.length;
        n = n.slice();
        for (var o = 0; o < r; o++)
          n[o].complete();
        this.observers.length = 0;
      }, t.prototype.unsubscribe = function() {
        this.closed = this.isStopped = !0, this.observers = null;
      }, t.prototype._trySubscribe = function(n) {
        if (this.closed)
          throw new Ld();
        return e.prototype._trySubscribe.call(this, n);
      }, t.prototype._subscribe = function(n) {
        if (this.closed)
          throw new Ld();
        return this.hasError ? (n.error(this.thrownError), nb.EMPTY) : this.isStopped ? (n.complete(), nb.EMPTY) : (this.observers.push(n), new Ar(this, n));
      }, t.prototype.asObservable = function() {
        var n = new ua();
        return n.source = this, n;
      }, t.create = function(n, r) {
        return new Cr(n, r);
      }, t;
    }(ua), Cr = function(e) {
      function t(n, r) {
        var o = e.call(this) || this;
        return o.destination = n, o.source = r, o;
      }
      return ha(t, e), t.prototype.next = function(n) {
        var r = this.destination;
        r && r.next && r.next(n);
      }, t.prototype.error = function(n) {
        var r = this.destination;
        r && r.error && this.destination.error(n);
      }, t.prototype.complete = function() {
        var n = this.destination;
        n && n.complete && this.destination.complete();
      }, t.prototype._subscribe = function(n) {
        return this.source ? this.source.subscribe(n) : nb.EMPTY;
      }, t;
    }(rb), xu = function() {
      function e(t) {
        this.connectable = t;
      }
      return e.prototype.call = function(t, n) {
        var r = this.connectable;
        return r._refCount++, t = new IA(t, r), n = n.subscribe(t), t.closed || (t.connection = r.connect()), n;
      }, e;
    }(), IA = function(e) {
      function t(n, r) {
        return (n = e.call(this, n) || this).connectable = r, n;
      }
      return ha(t, e), t.prototype._unsubscribe = function() {
        var n = this.connectable;
        if (n) {
          this.connectable = null;
          var r = n._refCount;
          0 >= r ? this.connection = null : (n._refCount = r - 1, 1 < r ? this.connection = null : (r = this.connection, n = n._connection, this.connection = null, !n || r && n !== r || n.unsubscribe()));
        } else
          this.connection = null;
      }, t;
    }(za), Dr = function(e) {
      function t(n, r) {
        var o = e.call(this) || this;
        return o.source = n, o.subjectFactory = r, o._refCount = 0, o._isComplete = !1, o;
      }
      return ha(t, e), t.prototype._subscribe = function(n) {
        return this.getSubject().subscribe(n);
      }, t.prototype.getSubject = function() {
        var n = this._subject;
        return n && !n.isStopped || (this._subject = this.subjectFactory()), this._subject;
      }, t.prototype.connect = function() {
        var n = this._connection;
        return n || (this._isComplete = !1, (n = this._connection = new nb()).add(this.source.subscribe(new JA(this.getSubject(), this))), n.closed && (this._connection = null, n = nb.EMPTY)), n;
      }, t.prototype.refCount = function() {
        return dn()(this);
      }, t;
    }(ua), lv = function() {
      var e = Dr.prototype;
      return { operator: { value: null }, _refCount: { value: 0, writable: !0 }, _subject: { value: null, writable: !0 }, _connection: { value: null, writable: !0 }, _subscribe: { value: e._subscribe }, _isComplete: { value: e._isComplete, writable: !0 }, getSubject: { value: e.getSubject }, connect: { value: e.connect }, refCount: { value: e.refCount } };
    }(), JA = function(e) {
      function t(n, r) {
        return (n = e.call(this, n) || this).connectable = r, n;
      }
      return ha(t, e), t.prototype._error = function(n) {
        this._unsubscribe(), e.prototype._error.call(this, n);
      }, t.prototype._complete = function() {
        this.connectable._isComplete = !0, this._unsubscribe(), e.prototype._complete.call(this);
      }, t.prototype._unsubscribe = function() {
        var n = this.connectable;
        if (n) {
          this.connectable = null;
          var r = n._connection;
          n._refCount = 0, n._subject = null, n._connection = null, r && r.unsubscribe();
        }
      }, t;
    }(Br);
    (function(e) {
      function t(n, r) {
        return (n = e.call(this, n) || this).connectable = r, n;
      }
      ha(t, e), t.prototype._unsubscribe = function() {
        var n = this.connectable;
        if (n) {
          this.connectable = null;
          var r = n._refCount;
          0 >= r ? this.connection = null : (n._refCount = r - 1, 1 < r ? this.connection = null : (r = this.connection, n = n._connection, this.connection = null, !n || r && n !== r || n.unsubscribe()));
        } else
          this.connection = null;
      };
    })(za), function(e) {
      function t(n, r, o, i, s) {
        return (n = e.call(this, n) || this).keySelector = r, n.elementSelector = o, n.durationSelector = i, n.subjectSelector = s, n.groups = null, n.attemptedToUnsubscribe = !1, n.count = 0, n;
      }
      ha(t, e), t.prototype._next = function(n) {
        try {
          var r = this.keySelector(n);
        } catch (o) {
          return void this.error(o);
        }
        this._group(n, r);
      }, t.prototype._group = function(n, r) {
        var o = this.groups;
        o || (o = this.groups = /* @__PURE__ */ new Map());
        var i = o.get(r);
        if (this.elementSelector)
          try {
            var s = this.elementSelector(n);
          } catch (u) {
            this.error(u);
          }
        else
          s = n;
        if (!i && (i = this.subjectSelector ? this.subjectSelector() : new rb(), o.set(r, i), n = new wl(r, i, this), this.destination.next(n), this.durationSelector)) {
          n = void 0;
          try {
            n = this.durationSelector(new wl(r, i));
          } catch (u) {
            return void this.error(u);
          }
          this.add(n.subscribe(new KA(r, i, this)));
        }
        i.closed || i.next(s);
      }, t.prototype._error = function(n) {
        var r = this.groups;
        r && (r.forEach(function(o, i) {
          o.error(n);
        }), r.clear()), this.destination.error(n);
      }, t.prototype._complete = function() {
        var n = this.groups;
        n && (n.forEach(function(r, o) {
          r.complete();
        }), n.clear()), this.destination.complete();
      }, t.prototype.removeGroup = function(n) {
        this.groups.delete(n);
      }, t.prototype.unsubscribe = function() {
        this.closed || (this.attemptedToUnsubscribe = !0, this.count === 0 && e.prototype.unsubscribe.call(this));
      };
    }(za);
    var KA = function(e) {
      function t(n, r, o) {
        var i = e.call(this, r) || this;
        return i.key = n, i.group = r, i.parent = o, i;
      }
      return ha(t, e), t.prototype._next = function(n) {
        this.complete();
      }, t.prototype._unsubscribe = function() {
        var n = this.parent, r = this.key;
        this.key = this.parent = null, n && n.removeGroup(r);
      }, t;
    }(za), wl = function(e) {
      function t(n, r, o) {
        var i = e.call(this) || this;
        return i.key = n, i.groupSubject = r, i.refCountSubscription = o, i;
      }
      return ha(t, e), t.prototype._subscribe = function(n) {
        var r = new nb(), o = this.refCountSubscription, i = this.groupSubject;
        return o && !o.closed && r.add(new LA(o)), r.add(i.subscribe(n)), r;
      }, t;
    }(ua), LA = function(e) {
      function t(n) {
        var r = e.call(this) || this;
        return r.parent = n, n.count++, r;
      }
      return ha(t, e), t.prototype.unsubscribe = function() {
        var n = this.parent;
        n.closed || this.closed || (e.prototype.unsubscribe.call(this), --n.count, n.count === 0 && n.attemptedToUnsubscribe && n.unsubscribe());
      }, t;
    }(nb), MA = function(e) {
      function t(n) {
        var r = e.call(this) || this;
        return r._value = n, r;
      }
      return ha(t, e), Object.defineProperty(t.prototype, "value", { get: function() {
        return this.getValue();
      }, enumerable: !0, configurable: !0 }), t.prototype._subscribe = function(n) {
        var r = e.prototype._subscribe.call(this, n);
        return r && !r.closed && n.next(this._value), r;
      }, t.prototype.getValue = function() {
        if (this.hasError)
          throw this.thrownError;
        if (this.closed)
          throw new Ld();
        return this._value;
      }, t.prototype.next = function(n) {
        e.prototype.next.call(this, this._value = n);
      }, t;
    }(rb), Kg = function(e) {
      function t(n, r) {
        var o = e.call(this, n, r) || this;
        return o.scheduler = n, o.work = r, o.pending = !1, o;
      }
      return ha(t, e), t.prototype.schedule = function(n, r) {
        if (r === void 0 && (r = 0), this.closed)
          return this;
        this.state = n, n = this.id;
        var o = this.scheduler;
        return n != null && (this.id = this.recycleAsyncId(o, n, r)), this.pending = !0, this.delay = r, this.id = this.id || this.requestAsyncId(o, this.id, r), this;
      }, t.prototype.requestAsyncId = function(n, r, o) {
        return o === void 0 && (o = 0), setInterval(n.flush.bind(n, this), o);
      }, t.prototype.recycleAsyncId = function(n, r, o) {
        if (o === void 0 && (o = 0), o !== null && this.delay === o && this.pending === !1)
          return r;
        clearInterval(r);
      }, t.prototype.execute = function(n, r) {
        return this.closed ? Error("executing a cancelled action") : (this.pending = !1, (n = this._execute(n, r)) ? n : void (this.pending === !1 && this.id != null && (this.id = this.recycleAsyncId(this.scheduler, this.id, null))));
      }, t.prototype._execute = function(n, r) {
        r = !1;
        var o = void 0;
        try {
          this.work(n);
        } catch (i) {
          r = !0, o = !!i && i || Error(i);
        }
        if (r)
          return this.unsubscribe(), o;
      }, t.prototype._unsubscribe = function() {
        var n = this.id, r = this.scheduler, o = r.actions, i = o.indexOf(this);
        this.state = this.work = null, this.pending = !1, this.scheduler = null, i !== -1 && o.splice(i, 1), n != null && (this.id = this.recycleAsyncId(r, n, null)), this.delay = null;
      }, t;
    }(function(e) {
      function t(n, r) {
        return e.call(this) || this;
      }
      return ha(t, e), t.prototype.schedule = function(n, r) {
        return this;
      }, t;
    }(nb)), NA = function(e) {
      function t(n, r) {
        var o = e.call(this, n, r) || this;
        return o.scheduler = n, o.work = r, o;
      }
      return ha(t, e), t.prototype.schedule = function(n, r) {
        return r === void 0 && (r = 0), 0 < r ? e.prototype.schedule.call(this, n, r) : (this.delay = r, this.state = n, this.scheduler.flush(this), this);
      }, t.prototype.execute = function(n, r) {
        return 0 < r || this.closed ? e.prototype.execute.call(this, n, r) : this._execute(n, r);
      }, t.prototype.requestAsyncId = function(n, r, o) {
        return o === void 0 && (o = 0), o !== null && 0 < o || o === null && 0 < this.delay ? e.prototype.requestAsyncId.call(this, n, r, o) : n.flush(this);
      }, t;
    }(Kg), xl = function() {
      function e(t, n) {
        n === void 0 && (n = e.now), this.SchedulerAction = t, this.now = n;
      }
      return e.prototype.schedule = function(t, n, r) {
        return n === void 0 && (n = 0), new this.SchedulerAction(this, t).schedule(r, n);
      }, e.now = function() {
        return Date.now();
      }, e;
    }(), Lg = function(e) {
      function t(n, r) {
        r === void 0 && (r = xl.now);
        var o = e.call(this, n, function() {
          return t.delegate && t.delegate !== o ? t.delegate.now() : r();
        }) || this;
        return o.actions = [], o.active = !1, o.scheduled = void 0, o;
      }
      return ha(t, e), t.prototype.schedule = function(n, r, o) {
        return r === void 0 && (r = 0), t.delegate && t.delegate !== this ? t.delegate.schedule(n, r, o) : e.prototype.schedule.call(this, n, r, o);
      }, t.prototype.flush = function(n) {
        var r = this.actions;
        if (this.active)
          r.push(n);
        else {
          var o;
          this.active = !0;
          do
            if (o = n.execute(n.state, n.delay))
              break;
          while (n = r.shift());
          if (this.active = !1, o) {
            for (; n = r.shift(); )
              n.unsubscribe();
            throw o;
          }
        }
      }, t;
    }(xl), Mg = new (function(e) {
      function t() {
        return e !== null && e.apply(this, arguments) || this;
      }
      return ha(t, e), t;
    }(Lg))(NA), Sb = new ua(function(e) {
      return e.complete();
    }), en = function(e) {
      return function(t) {
        for (var n = 0, r = e.length; n < r && !t.closed; n++)
          t.next(e[n]);
        t.complete();
      };
    }, yl;
    (function(e) {
      e.NEXT = "N", e.ERROR = "E", e.COMPLETE = "C";
    })(yl || (yl = {}));
    var yf = function() {
      function e(t, n, r) {
        this.kind = t, this.value = n, this.error = r, this.hasValue = t === "N";
      }
      return e.prototype.observe = function(t) {
        switch (this.kind) {
          case "N":
            return t.next && t.next(this.value);
          case "E":
            return t.error && t.error(this.error);
          case "C":
            return t.complete && t.complete();
        }
      }, e.prototype.do = function(t, n, r) {
        switch (this.kind) {
          case "N":
            return t && t(this.value);
          case "E":
            return n && n(this.error);
          case "C":
            return r && r();
        }
      }, e.prototype.accept = function(t, n, r) {
        return t && typeof t.next == "function" ? this.observe(t) : this.do(t, n, r);
      }, e.prototype.toObservable = function() {
        switch (this.kind) {
          case "N":
            return ob(this.value);
          case "E":
            return ra(this.error);
          case "C":
            return Qf();
        }
        throw Error("unexpected notification kind value");
      }, e.createNext = function(t) {
        return t !== void 0 ? new e("N", t) : e.undefinedValueNotification;
      }, e.createError = function(t) {
        return new e("E", void 0, t);
      }, e.createComplete = function() {
        return e.completeNotification;
      }, e.completeNotification = new e("C"), e.undefinedValueNotification = new e("N", void 0), e;
    }(), Bu = function() {
      function e(t, n) {
        n === void 0 && (n = 0), this.scheduler = t, this.delay = n;
      }
      return e.prototype.call = function(t, n) {
        return n.subscribe(new Er(t, this.scheduler, this.delay));
      }, e;
    }(), Er = function(e) {
      function t(n, r, o) {
        return o === void 0 && (o = 0), (n = e.call(this, n) || this).scheduler = r, n.delay = o, n;
      }
      return ha(t, e), t.dispatch = function(n) {
        n.notification.observe(n.destination), this.unsubscribe();
      }, t.prototype.scheduleMessage = function(n) {
        this.destination.add(this.scheduler.schedule(t.dispatch, this.delay, new OA(n, this.destination)));
      }, t.prototype._next = function(n) {
        this.scheduleMessage(yf.createNext(n));
      }, t.prototype._error = function(n) {
        this.scheduleMessage(yf.createError(n)), this.unsubscribe();
      }, t.prototype._complete = function() {
        this.scheduleMessage(yf.createComplete()), this.unsubscribe();
      }, t;
    }(za), OA = function(e, t) {
      this.notification = e, this.destination = t;
    }, Te = function(e) {
      function t(n, r, o) {
        n === void 0 && (n = Number.POSITIVE_INFINITY), r === void 0 && (r = Number.POSITIVE_INFINITY);
        var i = e.call(this) || this;
        return i.scheduler = o, i._events = [], i._infiniteTimeWindow = !1, i._bufferSize = 1 > n ? 1 : n, i._windowTime = 1 > r ? 1 : r, r === Number.POSITIVE_INFINITY ? (i._infiniteTimeWindow = !0, i.next = i.nextInfiniteTimeWindow) : i.next = i.nextTimeWindow, i;
      }
      return ha(t, e), t.prototype.nextInfiniteTimeWindow = function(n) {
        if (!this.isStopped) {
          var r = this._events;
          r.push(n), r.length > this._bufferSize && r.shift();
        }
        e.prototype.next.call(this, n);
      }, t.prototype.nextTimeWindow = function(n) {
        this.isStopped || (this._events.push(new PA(this._getNow(), n)), this._trimBufferThenGetEvents()), e.prototype.next.call(this, n);
      }, t.prototype._subscribe = function(n) {
        var r = this._infiniteTimeWindow, o = r ? this._events : this._trimBufferThenGetEvents(), i = this.scheduler, s = o.length;
        if (this.closed)
          throw new Ld();
        if (this.isStopped || this.hasError)
          var u = nb.EMPTY;
        else
          this.observers.push(n), u = new Ar(this, n);
        if (i && n.add(n = new Er(n, i)), r)
          for (r = 0; r < s && !n.closed; r++)
            n.next(o[r]);
        else
          for (r = 0; r < s && !n.closed; r++)
            n.next(o[r].value);
        return this.hasError ? n.error(this.thrownError) : this.isStopped && n.complete(), u;
      }, t.prototype._getNow = function() {
        return (this.scheduler || Mg).now();
      }, t.prototype._trimBufferThenGetEvents = function() {
        for (var n = this._getNow(), r = this._bufferSize, o = this._windowTime, i = this._events, s = i.length, u = 0; u < s && !(n - i[u].time < o); )
          u++;
        return s > r && (u = Math.max(u, s - r)), 0 < u && i.splice(0, u), i;
      }, t;
    }(rb), PA = function(e, t) {
      this.time = e, this.value = t;
    }, Sf = function(e) {
      function t() {
        var n = e !== null && e.apply(this, arguments) || this;
        return n.value = null, n.hasNext = !1, n.hasCompleted = !1, n;
      }
      return ha(t, e), t.prototype._subscribe = function(n) {
        return this.hasError ? (n.error(this.thrownError), nb.EMPTY) : this.hasCompleted && this.hasNext ? (n.next(this.value), n.complete(), nb.EMPTY) : e.prototype._subscribe.call(this, n);
      }, t.prototype.next = function(n) {
        this.hasCompleted || (this.value = n, this.hasNext = !0);
      }, t.prototype.error = function(n) {
        this.hasCompleted || e.prototype.error.call(this, n);
      }, t.prototype.complete = function() {
        this.hasCompleted = !0, this.hasNext && e.prototype.next.call(this, this.value), e.prototype.complete.call(this);
      }, t;
    }(rb), QA = 1, RA = Promise.resolve(), aj = {}, Fr = { setImmediate: function(e) {
      var t = QA++;
      return aj[t] = !0, RA.then(function() {
        return fn(t) && e();
      }), t;
    }, clearImmediate: function(e) {
      fn(e);
    } }, SA = function(e) {
      function t(n, r) {
        var o = e.call(this, n, r) || this;
        return o.scheduler = n, o.work = r, o;
      }
      return ha(t, e), t.prototype.requestAsyncId = function(n, r, o) {
        return o === void 0 && (o = 0), o !== null && 0 < o ? e.prototype.requestAsyncId.call(this, n, r, o) : (n.actions.push(this), n.scheduled || (n.scheduled = Fr.setImmediate(n.flush.bind(n, null))));
      }, t.prototype.recycleAsyncId = function(n, r, o) {
        if (o === void 0 && (o = 0), o !== null && 0 < o || o === null && 0 < this.delay)
          return e.prototype.recycleAsyncId.call(this, n, r, o);
        n.actions.length === 0 && (Fr.clearImmediate(r), n.scheduled = void 0);
      }, t;
    }(Kg), kj = new (function(e) {
      function t() {
        return e !== null && e.apply(this, arguments) || this;
      }
      return ha(t, e), t.prototype.flush = function(n) {
        this.active = !0, this.scheduled = void 0;
        var r, o = this.actions, i = -1, s = o.length;
        n = n || o.shift();
        do
          if (r = n.execute(n.state, n.delay))
            break;
        while (++i < s && (n = o.shift()));
        if (this.active = !1, r) {
          for (; ++i < s && (n = o.shift()); )
            n.unsubscribe();
          throw r;
        }
      }, t;
    }(Lg))(SA), TA = kj, zl = new Lg(Kg), cd = zl, UA = function(e) {
      function t(n, r) {
        var o = e.call(this, n, r) || this;
        return o.scheduler = n, o.work = r, o;
      }
      return ha(t, e), t.prototype.requestAsyncId = function(n, r, o) {
        return o === void 0 && (o = 0), o !== null && 0 < o ? e.prototype.requestAsyncId.call(this, n, r, o) : (n.actions.push(this), n.scheduled || (n.scheduled = requestAnimationFrame(function() {
          return n.flush(null);
        })));
      }, t.prototype.recycleAsyncId = function(n, r, o) {
        if (o === void 0 && (o = 0), o !== null && 0 < o || o === null && 0 < this.delay)
          return e.prototype.recycleAsyncId.call(this, n, r, o);
        n.actions.length === 0 && (cancelAnimationFrame(r), n.scheduled = void 0);
      }, t;
    }(Kg), Gr = new (function(e) {
      function t() {
        return e !== null && e.apply(this, arguments) || this;
      }
      return ha(t, e), t.prototype.flush = function(n) {
        this.active = !0, this.scheduled = void 0;
        var r, o = this.actions, i = -1, s = o.length;
        n = n || o.shift();
        do
          if (r = n.execute(n.state, n.delay))
            break;
        while (++i < s && (n = o.shift()));
        if (this.active = !1, r) {
          for (; ++i < s && (n = o.shift()); )
            n.unsubscribe();
          throw r;
        }
      }, t;
    }(Lg))(UA), VA = function(e) {
      function t(n, r) {
        n === void 0 && (n = Hr), r === void 0 && (r = Number.POSITIVE_INFINITY);
        var o = e.call(this, n, function() {
          return o.frame;
        }) || this;
        return o.maxFrames = r, o.frame = 0, o.index = -1, o;
      }
      return ha(t, e), t.prototype.flush = function() {
        for (var n, r, o = this.actions, i = this.maxFrames; (r = o[0]) && r.delay <= i && (o.shift(), this.frame = r.delay, !(n = r.execute(r.state, r.delay))); )
          ;
        if (n) {
          for (; r = o.shift(); )
            r.unsubscribe();
          throw n;
        }
      }, t.frameTimeFactor = 10, t;
    }(Lg), Hr = function(e) {
      function t(n, r, o) {
        o === void 0 && (o = n.index += 1);
        var i = e.call(this, n, r) || this;
        return i.scheduler = n, i.work = r, i.index = o, i.active = !0, i.index = n.index = o, i;
      }
      return ha(t, e), t.prototype.schedule = function(n, r) {
        if (r === void 0 && (r = 0), !this.id)
          return e.prototype.schedule.call(this, n, r);
        this.active = !1;
        var o = new t(this.scheduler, this.work);
        return this.add(o), o.schedule(n, r);
      }, t.prototype.requestAsyncId = function(n, r, o) {
        return o === void 0 && (o = 0), this.delay = n.frame + o, (n = n.actions).push(this), n.sort(t.sortActions), !0;
      }, t.prototype.recycleAsyncId = function(n, r, o) {
      }, t.prototype._execute = function(n, r) {
        if (this.active === !0)
          return e.prototype._execute.call(this, n, r);
      }, t.sortActions = function(n, r) {
        return n.delay === r.delay ? n.index === r.index ? 0 : n.index > r.index ? 1 : -1 : n.delay > r.delay ? 1 : -1;
      }, t;
    }(Kg), Al = function() {
      function e() {
        return Error.call(this), this.message = "argument out of range", this.name = "ArgumentOutOfRangeError", this;
      }
      return e.prototype = Object.create(Error.prototype), e;
    }(), eh = function() {
      function e() {
        return Error.call(this), this.message = "no elements in sequence", this.name = "EmptyError", this;
      }
      return e.prototype = Object.create(Error.prototype), e;
    }(), Tb = function() {
      function e() {
        return Error.call(this), this.message = "Timeout has occurred", this.name = "TimeoutError", this;
      }
      return e.prototype = Object.create(Error.prototype), e;
    }(), Cu = function() {
      function e(t, n) {
        this.project = t, this.thisArg = n;
      }
      return e.prototype.call = function(t, n) {
        return n.subscribe(new WA(t, this.project, this.thisArg));
      }, e;
    }(), WA = function(e) {
      function t(n, r, o) {
        return (n = e.call(this, n) || this).project = r, n.count = 0, n.thisArg = o || n, n;
      }
      return ha(t, e), t.prototype._next = function(n) {
        try {
          var r = this.project.call(this.thisArg, n, this.count++);
        } catch (o) {
          return void this.destination.error(o);
        }
        this.destination.next(r);
      }, t;
    }(za), Bl = function(e) {
      function t() {
        return e !== null && e.apply(this, arguments) || this;
      }
      return ha(t, e), t.prototype.notifyNext = function(n, r, o, i, s) {
        this.destination.next(r);
      }, t.prototype.notifyError = function(n, r) {
        this.destination.error(n);
      }, t.prototype.notifyComplete = function(n) {
        this.destination.complete();
      }, t;
    }(za), Hu = function(e) {
      function t(n, r, o) {
        var i = e.call(this) || this;
        return i.parent = n, i.outerValue = r, i.outerIndex = o, i.index = 0, i;
      }
      return ha(t, e), t.prototype._next = function(n) {
        this.parent.notifyNext(this.outerValue, n, this.outerIndex, this.index++, this);
      }, t.prototype._error = function(n) {
        this.parent.notifyError(n, this), this.unsubscribe();
      }, t.prototype._complete = function() {
        this.parent.notifyComplete(this), this.unsubscribe();
      }, t;
    }(za), XA = function(e) {
      return function(t) {
        return e.then(function(n) {
          t.closed || (t.next(n), t.complete());
        }, function(n) {
          return t.error(n);
        }).then(null, Oe), t;
      };
    }, xd = typeof Symbol == "function" && Symbol.iterator ? Symbol.iterator : "@@iterator", YA = function(e) {
      return function(t) {
        for (var n = e[xd](); ; ) {
          var r = void 0;
          try {
            r = n.next();
          } catch (o) {
            return t.error(o), t;
          }
          if (r.done) {
            t.complete();
            break;
          }
          if (t.next(r.value), t.closed)
            break;
        }
        return typeof n.return == "function" && t.add(function() {
          n.return && n.return();
        }), t;
      };
    }, ZA = function(e) {
      return function(t) {
        var n = e[Pe]();
        if (typeof n.subscribe != "function")
          throw new TypeError("Provided object does not correctly implement Symbol.observable");
        return n.subscribe(t);
      };
    }, mn = function(e) {
      return e && typeof e.length == "number" && typeof e != "function";
    }, Tf = function(e) {
      if (e && typeof e[Pe] == "function")
        return ZA(e);
      if (mn(e))
        return en(e);
      if (kn(e))
        return XA(e);
      if (e && typeof e[xd] == "function")
        return YA(e);
      throw e = Xi(e) ? "an invalid object" : "'" + e + "'", new TypeError("You provided " + e + " where a stream was expected. You can provide an Observable, Promise, Array, or Iterable.");
    }, Ir = {}, aB = function() {
      function e(t) {
        this.resultSelector = t;
      }
      return e.prototype.call = function(t, n) {
        return n.subscribe(new $A(t, this.resultSelector));
      }, e;
    }(), $A = function(e) {
      function t(n, r) {
        return (n = e.call(this, n) || this).resultSelector = r, n.active = 0, n.values = [], n.observables = [], n;
      }
      return ha(t, e), t.prototype._next = function(n) {
        this.values.push(Ir), this.observables.push(n);
      }, t.prototype._complete = function() {
        var n = this.observables, r = n.length;
        if (r === 0)
          this.destination.complete();
        else {
          this.toRespond = this.active = r;
          for (var o = 0; o < r; o++)
            this.add(bj(this, n[o], void 0, o));
        }
      }, t.prototype.notifyComplete = function(n) {
        --this.active == 0 && this.destination.complete();
      }, t.prototype.notifyNext = function(n, r, o) {
        var i = (n = this.values)[o];
        i = this.toRespond ? i === Ir ? --this.toRespond : this.toRespond : 0, n[o] = r, i === 0 && (this.resultSelector ? this._tryResultSelector(n) : this.destination.next(n.slice()));
      }, t.prototype._tryResultSelector = function(n) {
        try {
          var r = this.resultSelector.apply(this, n);
        } catch (o) {
          return void this.destination.error(o);
        }
        this.destination.next(r);
      }, t;
    }(Bl), nd = function(e) {
      function t(n) {
        var r = e.call(this) || this;
        return r.parent = n, r;
      }
      return ha(t, e), t.prototype._next = function(n) {
        this.parent.notifyNext(n);
      }, t.prototype._error = function(n) {
        this.parent.notifyError(n), this.unsubscribe();
      }, t.prototype._complete = function() {
        this.parent.notifyComplete(), this.unsubscribe();
      }, t;
    }(za);
    (function(e) {
      function t(n, r, o) {
        var i = e.call(this) || this;
        return i.parent = n, i.outerValue = r, i.outerIndex = o, i;
      }
      ha(t, e), t.prototype._next = function(n) {
        this.parent.notifyNext(this.outerValue, n, this.outerIndex, this);
      }, t.prototype._error = function(n) {
        this.parent.notifyError(n), this.unsubscribe();
      }, t.prototype._complete = function() {
        this.parent.notifyComplete(this), this.unsubscribe();
      };
    })(za);
    var od = function(e) {
      function t() {
        return e !== null && e.apply(this, arguments) || this;
      }
      return ha(t, e), t.prototype.notifyNext = function(n) {
        this.destination.next(n);
      }, t.prototype.notifyError = function(n) {
        this.destination.error(n);
      }, t.prototype.notifyComplete = function() {
        this.destination.complete();
      }, t;
    }(za);
    (function(e) {
      function t() {
        return e !== null && e.apply(this, arguments) || this;
      }
      ha(t, e), t.prototype.notifyNext = function(n, r, o, i) {
        this.destination.next(r);
      }, t.prototype.notifyError = function(n) {
        this.destination.error(n);
      }, t.prototype.notifyComplete = function(n) {
        this.destination.complete();
      };
    })(za);
    var Lu = function() {
      function e(t, n) {
        n === void 0 && (n = Number.POSITIVE_INFINITY), this.project = t, this.concurrent = n;
      }
      return e.prototype.call = function(t, n) {
        return n.subscribe(new bB(t, this.project, this.concurrent));
      }, e;
    }(), bB = function(e) {
      function t(n, r, o) {
        return o === void 0 && (o = Number.POSITIVE_INFINITY), (n = e.call(this, n) || this).project = r, n.concurrent = o, n.hasCompleted = !1, n.buffer = [], n.active = 0, n.index = 0, n;
      }
      return ha(t, e), t.prototype._next = function(n) {
        this.active < this.concurrent ? this._tryNext(n) : this.buffer.push(n);
      }, t.prototype._tryNext = function(n) {
        var r = this.index++;
        try {
          var o = this.project(n, r);
        } catch (i) {
          return void this.destination.error(i);
        }
        this.active++, this._innerSub(o);
      }, t.prototype._innerSub = function(n) {
        var r = new nd(this), o = this.destination;
        o.add(r), (n = bd(n, r)) !== r && o.add(n);
      }, t.prototype._complete = function() {
        this.hasCompleted = !0, this.active === 0 && this.buffer.length === 0 && this.destination.complete(), this.unsubscribe();
      }, t.prototype.notifyNext = function(n) {
        this.destination.next(n);
      }, t.prototype.notifyComplete = function() {
        var n = this.buffer;
        this.active--, 0 < n.length ? this._next(n.shift()) : this.active === 0 && this.hasCompleted && this.destination.complete();
      }, t;
    }(od), Cl = R.parseFloat, Jr = -1 / 0 != 1 / Cl(`	
\v\f\r                　\u2028\u2029\uFEFF-0`) ? function(e) {
      e = Oj(String(e));
      var t = Cl(e);
      return t === 0 && e.charAt(0) == "-" ? -0 : t;
    } : Cl;
    ea({ global: !0, forced: parseFloat != Jr }, { parseFloat: Jr });
    var Dl = new ua(Ic), Qu = function() {
      function e(t, n) {
        this.predicate = t, this.thisArg = n;
      }
      return e.prototype.call = function(t, n) {
        return n.subscribe(new cB(t, this.predicate, this.thisArg));
      }, e;
    }(), cB = function(e) {
      function t(n, r, o) {
        return (n = e.call(this, n) || this).predicate = r, n.thisArg = o, n.count = 0, n;
      }
      return ha(t, e), t.prototype._next = function(n) {
        try {
          var r = this.predicate.call(this.thisArg, n, this.count++);
        } catch (o) {
          return void this.destination.error(o);
        }
        r && this.destination.next(n);
      }, t;
    }(za), Ru = function() {
      function e() {
      }
      return e.prototype.call = function(t, n) {
        return n.subscribe(new dB(t));
      }, e;
    }(), dB = function(e) {
      function t(n) {
        return (n = e.call(this, n) || this).hasFirst = !1, n.observables = [], n.subscriptions = [], n;
      }
      return ha(t, e), t.prototype._next = function(n) {
        this.observables.push(n);
      }, t.prototype._complete = function() {
        var n = this.observables, r = n.length;
        if (r === 0)
          this.destination.complete();
        else {
          for (var o = 0; o < r && !this.hasFirst; o++) {
            var i = bj(this, n[o], void 0, o);
            this.subscriptions && this.subscriptions.push(i), this.add(i);
          }
          this.observables = null;
        }
      }, t.prototype.notifyNext = function(n, r, o) {
        if (!this.hasFirst) {
          for (this.hasFirst = !0, n = 0; n < this.subscriptions.length; n++)
            if (n !== o) {
              var i = this.subscriptions[n];
              i.unsubscribe(), this.remove(i);
            }
          this.subscriptions = null;
        }
        this.destination.next(r);
      }, t;
    }(Bl), Uu = function() {
      function e(t) {
        this.resultSelector = t;
      }
      return e.prototype.call = function(t, n) {
        return n.subscribe(new eB(t, this.resultSelector));
      }, e;
    }(), eB = function(e) {
      function t(n, r, o) {
        return (n = e.call(this, n) || this).resultSelector = r, n.iterators = [], n.active = 0, n.resultSelector = typeof r == "function" ? r : void 0, n;
      }
      return ha(t, e), t.prototype._next = function(n) {
        var r = this.iterators;
        hc(n) ? r.push(new fB(n)) : typeof n[xd] == "function" ? r.push(new gB(n[xd]())) : r.push(new hB(this.destination, this, n));
      }, t.prototype._complete = function() {
        var n = this.iterators, r = n.length;
        if (this.unsubscribe(), r === 0)
          this.destination.complete();
        else {
          this.active = r;
          for (var o = 0; o < r; o++) {
            var i = n[o];
            i.stillUnsubscribed ? this.destination.add(i.subscribe()) : this.active--;
          }
        }
      }, t.prototype.notifyInactive = function() {
        this.active--, this.active === 0 && this.destination.complete();
      }, t.prototype.checkIterators = function() {
        for (var n = this.iterators, r = n.length, o = this.destination, i = 0; i < r; i++) {
          var s = n[i];
          if (typeof s.hasValue == "function" && !s.hasValue())
            return;
        }
        var u = !1, a = [];
        for (i = 0; i < r; i++) {
          var l = (s = n[i]).next();
          if (s.hasCompleted() && (u = !0), l.done)
            return void o.complete();
          a.push(l.value);
        }
        this.resultSelector ? this._tryresultSelector(a) : o.next(a), u && o.complete();
      }, t.prototype._tryresultSelector = function(n) {
        try {
          var r = this.resultSelector.apply(this, n);
        } catch (o) {
          return void this.destination.error(o);
        }
        this.destination.next(r);
      }, t;
    }(za), gB = function() {
      function e(t) {
        this.iterator = t, this.nextResult = t.next();
      }
      return e.prototype.hasValue = function() {
        return !0;
      }, e.prototype.next = function() {
        var t = this.nextResult;
        return this.nextResult = this.iterator.next(), t;
      }, e.prototype.hasCompleted = function() {
        var t = this.nextResult;
        return !(!t || !t.done);
      }, e;
    }(), fB = function() {
      function e(t) {
        this.array = t, this.length = this.index = 0, this.length = t.length;
      }
      return e.prototype[xd] = function() {
        return this;
      }, e.prototype.next = function(t) {
        t = this.index++;
        var n = this.array;
        return t < this.length ? { value: n[t], done: !1 } : { value: null, done: !0 };
      }, e.prototype.hasValue = function() {
        return this.array.length > this.index;
      }, e.prototype.hasCompleted = function() {
        return this.array.length === this.index;
      }, e;
    }(), hB = function(e) {
      function t(n, r, o) {
        return (n = e.call(this, n) || this).parent = r, n.observable = o, n.stillUnsubscribed = !0, n.buffer = [], n.isComplete = !1, n;
      }
      return ha(t, e), t.prototype[xd] = function() {
        return this;
      }, t.prototype.next = function() {
        var n = this.buffer;
        return n.length === 0 && this.isComplete ? { value: null, done: !0 } : { value: n.shift(), done: !1 };
      }, t.prototype.hasValue = function() {
        return 0 < this.buffer.length;
      }, t.prototype.hasCompleted = function() {
        return this.buffer.length === 0 && this.isComplete;
      }, t.prototype.notifyComplete = function() {
        0 < this.buffer.length ? (this.isComplete = !0, this.parent.notifyInactive()) : this.destination.complete();
      }, t.prototype.notifyNext = function(n) {
        this.buffer.push(n), this.parent.checkIterators();
      }, t.prototype.subscribe = function() {
        return bd(this.observable, new nd(this));
      }, t;
    }(od), iB = Object.freeze({ __proto__: null, Observable: ua, ConnectableObservable: Dr, GroupedObservable: wl, observable: Pe, Subject: rb, BehaviorSubject: MA, ReplaySubject: Te, AsyncSubject: Sf, asap: TA, asapScheduler: kj, async: cd, asyncScheduler: zl, queue: Mg, queueScheduler: Mg, animationFrame: Gr, animationFrameScheduler: Gr, VirtualTimeScheduler: VA, VirtualAction: Hr, Scheduler: xl, Subscription: nb, Subscriber: za, Notification: yf, get NotificationKind() {
      return yl;
    }, pipe: Zi, noop: Ic, identity: wd, isObservable: function(e) {
      return !!e && (e instanceof ua || typeof e.lift == "function" && typeof e.subscribe == "function");
    }, ArgumentOutOfRangeError: Al, EmptyError: eh, ObjectUnsubscribedError: Ld, UnsubscriptionError: Pf, TimeoutError: Tb, bindCallback: gn, bindNodeCallback: hn, combineLatest: function() {
      for (var e = [], t = 0; t < arguments.length; t++)
        e[t] = arguments[t];
      var n = t = void 0;
      return ad(e[e.length - 1]) && (n = e.pop()), typeof e[e.length - 1] == "function" && (t = e.pop()), e.length === 1 && hc(e[0]) && (e = e[0]), Rf(e, n).lift(new aB(t));
    }, concat: nn, defer: yd, empty: Qf, forkJoin: function() {
      for (var e = [], t = 0; t < arguments.length; t++)
        e[t] = arguments[t];
      if (e.length === 1) {
        var n = e[0];
        if (hc(n))
          return ch(n, null);
        if (Xi(n) && Object.getPrototypeOf(n) === Object.prototype)
          return ch((e = Object.keys(n)).map(function(o) {
            return n[o];
          }), e);
      }
      if (typeof e[e.length - 1] == "function") {
        var r = e.pop();
        return ch(e = e.length === 1 && hc(e[0]) ? e[0] : e, null).pipe(Ea(function(o) {
          return r.apply(void 0, o);
        }));
      }
      return ch(e, null);
    }, from: Jc, fromEvent: Db, fromEventPattern: pn, generate: function(e, t, n, r, o) {
      if (arguments.length == 1) {
        var i = e.initialState;
        t = e.condition, n = e.iterate;
        var s = e.resultSelector || wd;
        o = e.scheduler;
      } else
        r === void 0 || ad(r) ? (i = e, s = wd, o = r) : (i = e, s = r);
      return new ua(function(u) {
        var a = i;
        if (o)
          return o.schedule(Mu, 0, { subscriber: u, iterate: n, condition: t, resultSelector: s, state: a });
        for (; ; ) {
          if (t) {
            var l = void 0;
            try {
              l = t(a);
            } catch (f) {
              u.error(f);
              break;
            }
            if (!l) {
              u.complete();
              break;
            }
          }
          l = void 0;
          try {
            l = s(a);
          } catch (f) {
            u.error(f);
            break;
          }
          if (u.next(l), u.closed)
            break;
          try {
            a = n(a);
          } catch (f) {
            u.error(f);
            break;
          }
        }
      });
    }, iif: function(e, t, n) {
      return t === void 0 && (t = Sb), n === void 0 && (n = Sb), yd(function() {
        return e() ? t : n;
      });
    }, interval: Qe, merge: Jb, never: function() {
      return Dl;
    }, of: ob, onErrorResumeNext: dj, pairs: function(e, t) {
      return new ua(t ? function(n) {
        var r = Object.keys(e), o = new nb();
        return o.add(t.schedule(Ou, 0, { keys: r, index: 0, subscriber: n, subscription: o, obj: e })), o;
      } : function(n) {
        for (var r = Object.keys(e), o = 0; o < r.length && !n.closed; o++) {
          var i = r[o];
          e.hasOwnProperty(i) && n.next([i, e[i]]);
        }
        n.complete();
      });
    }, partition: function(e, t, n) {
      return [yb(t, n)(new ua(Tf(e))), yb(Pu(t, n))(new ua(Tf(e)))];
    }, race: fb, range: function(e, t, n) {
      return e === void 0 && (e = 0), new ua(function(r) {
        t === void 0 && (t = e, e = 0);
        var o = 0, i = e;
        if (n)
          return n.schedule(Su, 0, { index: o, count: t, start: e, subscriber: r });
        for (; ; ) {
          if (o++ >= t) {
            r.complete();
            break;
          }
          if (r.next(i++), r.closed)
            break;
        }
      });
    }, throwError: ra, timer: dd, using: function(e, t) {
      return new ua(function(n) {
        try {
          var r = e();
        } catch (s) {
          return void n.error(s);
        }
        try {
          var o = t(r);
        } catch (s) {
          return void n.error(s);
        }
        var i = (o ? Jc(o) : Sb).subscribe(n);
        return function() {
          i.unsubscribe(), r && r.unsubscribe();
        };
      });
    }, zip: ej, scheduled: ln, EMPTY: Sb, NEVER: Dl, config: gc }), Vu = function() {
      function e(t, n, r, o) {
        this.bufferTimeSpan = t, this.bufferCreationInterval = n, this.maxBufferSize = r, this.scheduler = o;
      }
      return e.prototype.call = function(t, n) {
        return n.subscribe(new jB(t, this.bufferTimeSpan, this.bufferCreationInterval, this.maxBufferSize, this.scheduler));
      }, e;
    }(), kB = function() {
      this.buffer = [];
    }, jB = function(e) {
      function t(n, r, o, i, s) {
        if ((n = e.call(this, n) || this).bufferTimeSpan = r, n.bufferCreationInterval = o, n.maxBufferSize = i, n.scheduler = s, n.contexts = [], i = n.openContext(), n.timespanOnly = o == null || 0 > o, n.timespanOnly)
          n.add(i.closeAction = s.schedule(qn, r, { subscriber: n, context: i, bufferTimeSpan: r }));
        else {
          var u = { bufferTimeSpan: r, bufferCreationInterval: o, subscriber: n, scheduler: s };
          n.add(i.closeAction = s.schedule(rn, r, { subscriber: n, context: i })), n.add(s.schedule(Wu, o, u));
        }
        return n;
      }
      return ha(t, e), t.prototype._next = function(n) {
        for (var r, o = this.contexts, i = o.length, s = 0; s < i; s++) {
          var u = o[s], a = u.buffer;
          a.push(n), a.length == this.maxBufferSize && (r = u);
        }
        r && this.onBufferFull(r);
      }, t.prototype._error = function(n) {
        this.contexts.length = 0, e.prototype._error.call(this, n);
      }, t.prototype._complete = function() {
        for (var n = this.contexts, r = this.destination; 0 < n.length; ) {
          var o = n.shift();
          r.next(o.buffer);
        }
        e.prototype._complete.call(this);
      }, t.prototype._unsubscribe = function() {
        this.contexts = null;
      }, t.prototype.onBufferFull = function(n) {
        if (this.closeContext(n), (n = n.closeAction).unsubscribe(), this.remove(n), !this.closed && this.timespanOnly) {
          n = this.openContext();
          var r = this.bufferTimeSpan;
          this.add(n.closeAction = this.scheduler.schedule(qn, r, { subscriber: this, context: n, bufferTimeSpan: r }));
        }
      }, t.prototype.openContext = function() {
        var n = new kB();
        return this.contexts.push(n), n;
      }, t.prototype.closeContext = function(n) {
        this.destination.next(n.buffer);
        var r = this.contexts;
        0 <= (r ? r.indexOf(n) : -1) && r.splice(r.indexOf(n), 1);
      }, t;
    }(za), Xu = function() {
      function e(t) {
        this.selector = t;
      }
      return e.prototype.call = function(t, n) {
        return n.subscribe(new lB(t, this.selector, this.caught));
      }, e;
    }(), lB = function(e) {
      function t(n, r, o) {
        return (n = e.call(this, n) || this).selector = r, n.caught = o, n;
      }
      return ha(t, e), t.prototype.error = function(n) {
        if (!this.isStopped) {
          var r = void 0;
          try {
            r = this.selector(n, this.caught);
          } catch (o) {
            return void e.prototype.error.call(this, o);
          }
          this._unsubscribeAndRecycle(), n = new nd(this), this.add(n), (r = bd(r, n)) !== n && this.add(r);
        }
      }, t;
    }(od), Yu = function() {
      function e(t) {
        this.defaultValue = t;
      }
      return e.prototype.call = function(t, n) {
        return n.subscribe(new mB(t, this.defaultValue));
      }, e;
    }(), mB = function(e) {
      function t(n, r) {
        return (n = e.call(this, n) || this).defaultValue = r, n.isEmpty = !0, n;
      }
      return ha(t, e), t.prototype._next = function(n) {
        this.isEmpty = !1, this.destination.next(n);
      }, t.prototype._complete = function() {
        this.isEmpty && this.destination.next(this.defaultValue), this.destination.complete();
      }, t;
    }(za), Zu = function() {
      function e(t, n) {
        this.delay = t, this.scheduler = n;
      }
      return e.prototype.call = function(t, n) {
        return n.subscribe(new nB(t, this.delay, this.scheduler));
      }, e;
    }(), nB = function(e) {
      function t(n, r, o) {
        return (n = e.call(this, n) || this).delay = r, n.scheduler = o, n.queue = [], n.active = !1, n.errored = !1, n;
      }
      return ha(t, e), t.dispatch = function(n) {
        for (var r = n.source, o = r.queue, i = n.scheduler, s = n.destination; 0 < o.length && 0 >= o[0].time - i.now(); )
          o.shift().notification.observe(s);
        0 < o.length ? (r = Math.max(0, o[0].time - i.now()), this.schedule(n, r)) : (this.unsubscribe(), r.active = !1);
      }, t.prototype._schedule = function(n) {
        this.active = !0, this.destination.add(n.schedule(t.dispatch, this.delay, { source: this, destination: this.destination, scheduler: n }));
      }, t.prototype.scheduleNotification = function(n) {
        if (this.errored !== !0) {
          var r = this.scheduler;
          n = new oB(r.now() + this.delay, n), this.queue.push(n), this.active === !1 && this._schedule(r);
        }
      }, t.prototype._next = function(n) {
        this.scheduleNotification(yf.createNext(n));
      }, t.prototype._error = function(n) {
        this.errored = !0, this.queue = [], this.destination.error(n), this.unsubscribe();
      }, t.prototype._complete = function() {
        this.scheduleNotification(yf.createComplete()), this.unsubscribe();
      }, t;
    }(za), oB = function(e, t) {
      this.time = e, this.notification = t;
    }, $u = function() {
      function e(t, n) {
        this.keySelector = t, this.flushes = n;
      }
      return e.prototype.call = function(t, n) {
        return n.subscribe(new pB(t, this.keySelector, this.flushes));
      }, e;
    }(), pB = function(e) {
      function t(n, r, o) {
        return (n = e.call(this, n) || this).keySelector = r, n.values = /* @__PURE__ */ new Set(), o && n.add(bd(o, new nd(n))), n;
      }
      return ha(t, e), t.prototype.notifyNext = function() {
        this.values.clear();
      }, t.prototype.notifyError = function(n) {
        this._error(n);
      }, t.prototype._next = function(n) {
        this.keySelector ? this._useKeySelector(n) : this._finalizeNext(n, n);
      }, t.prototype._useKeySelector = function(n) {
        var r = this.destination;
        try {
          var o = this.keySelector(n);
        } catch (i) {
          return void r.error(i);
        }
        this._finalizeNext(o, n);
      }, t.prototype._finalizeNext = function(n, r) {
        var o = this.values;
        o.has(n) || (o.add(n), this.destination.next(r));
      }, t;
    }(od), bv = function() {
      function e(t) {
        this.errorFactory = t;
      }
      return e.prototype.call = function(t, n) {
        return n.subscribe(new qB(t, this.errorFactory));
      }, e;
    }(), qB = function(e) {
      function t(n, r) {
        return (n = e.call(this, n) || this).errorFactory = r, n.hasValue = !1, n;
      }
      return ha(t, e), t.prototype._next = function(n) {
        this.hasValue = !0, this.destination.next(n);
      }, t.prototype._complete = function() {
        if (this.hasValue)
          return this.destination.complete();
        var n = void 0;
        try {
          n = this.errorFactory();
        } catch (r) {
          n = r;
        }
        this.destination.error(n);
      }, t;
    }(za), cv = function() {
      function e(t) {
        if (this.total = t, 0 > this.total)
          throw new Al();
      }
      return e.prototype.call = function(t, n) {
        return n.subscribe(new rB(t, this.total));
      }, e;
    }(), rB = function(e) {
      function t(n, r) {
        return (n = e.call(this, n) || this).total = r, n.count = 0, n;
      }
      return ha(t, e), t.prototype._next = function(n) {
        var r = this.total, o = ++this.count;
        o <= r && (this.destination.next(n), o === r && (this.destination.complete(), this.unsubscribe()));
      }, t;
    }(za), dv = function() {
      function e(t) {
        this.callback = t;
      }
      return e.prototype.call = function(t, n) {
        return n.subscribe(new sB(t, this.callback));
      }, e;
    }(), sB = function(e) {
      function t(n, r) {
        return (n = e.call(this, n) || this).add(new nb(r)), n;
      }
      return ha(t, e), t;
    }(za), fv = function() {
      function e() {
      }
      return e.prototype.call = function(t, n) {
        return n.subscribe(new tB(t));
      }, e;
    }(), tB = function(e) {
      function t() {
        return e !== null && e.apply(this, arguments) || this;
      }
      return ha(t, e), t.prototype._next = function(n) {
      }, t;
    }(za), gv = function() {
      function e(t) {
        if (this.total = t, 0 > this.total)
          throw new Al();
      }
      return e.prototype.call = function(t, n) {
        return n.subscribe(new uB(t, this.total));
      }, e;
    }(), uB = function(e) {
      function t(n, r) {
        return (n = e.call(this, n) || this).total = r, n.ring = [], n.count = 0, n;
      }
      return ha(t, e), t.prototype._next = function(n) {
        var r = this.ring, o = this.total, i = this.count++;
        r.length < o ? r.push(n) : r[i % o] = n;
      }, t.prototype._complete = function() {
        var n = this.destination, r = this.count;
        if (0 < r)
          for (var o = this.count >= this.total ? this.total : this.count, i = this.ring, s = 0; s < o; s++) {
            var u = r++ % o;
            n.next(i[u]);
          }
        n.complete();
      }, t;
    }(za), hv = function() {
      function e(t) {
        this.value = t;
      }
      return e.prototype.call = function(t, n) {
        return n.subscribe(new vB(t, this.value));
      }, e;
    }(), vB = function(e) {
      function t(n, r) {
        return (n = e.call(this, n) || this).value = r, n;
      }
      return ha(t, e), t.prototype._next = function(n) {
        this.destination.next(this.value);
      }, t;
    }(za), iv = function() {
      function e(t, n, r) {
        r === void 0 && (r = !1), this.accumulator = t, this.seed = n, this.hasSeed = r;
      }
      return e.prototype.call = function(t, n) {
        return n.subscribe(new wB(t, this.accumulator, this.seed, this.hasSeed));
      }, e;
    }(), wB = function(e) {
      function t(n, r, o, i) {
        return (n = e.call(this, n) || this).accumulator = r, n._seed = o, n.hasSeed = i, n.index = 0, n;
      }
      return ha(t, e), Object.defineProperty(t.prototype, "seed", { get: function() {
        return this._seed;
      }, set: function(n) {
        this.hasSeed = !0, this._seed = n;
      }, enumerable: !0, configurable: !0 }), t.prototype._next = function(n) {
        if (this.hasSeed)
          return this._tryNext(n);
        this.seed = n, this.destination.next(n);
      }, t.prototype._tryNext = function(n) {
        var r = this.index++;
        try {
          var o = this.accumulator(this.seed, n, r);
        } catch (i) {
          this.destination.error(i);
        }
        this.seed = o, this.destination.next(o);
      }, t;
    }(za), kv = function() {
      function e(t, n) {
        this.subjectFactory = t, this.selector = n;
      }
      return e.prototype.call = function(t, n) {
        var r = this.selector, o = this.subjectFactory();
        return (t = r(o).subscribe(t)).add(n.subscribe(o)), t;
      }, e;
    }(), mv = function() {
      function e(t, n) {
        this.notifier = t, this.source = n;
      }
      return e.prototype.call = function(t, n) {
        return n.subscribe(new xB(t, this.notifier, this.source));
      }, e;
    }(), xB = function(e) {
      function t(n, r, o) {
        return (n = e.call(this, n) || this).notifier = r, n.source = o, n;
      }
      return ha(t, e), t.prototype.error = function(n) {
        if (!this.isStopped) {
          var r = this.errors, o = this.retries, i = this.retriesSubscription;
          if (o)
            this.retriesSubscription = this.errors = void 0;
          else {
            r = new rb();
            try {
              o = (0, this.notifier)(r);
            } catch (s) {
              return e.prototype.error.call(this, s);
            }
            i = bd(o, new nd(this));
          }
          this._unsubscribeAndRecycle(), this.errors = r, this.retries = o, this.retriesSubscription = i, r.next(n);
        }
      }, t.prototype._unsubscribe = function() {
        var n = this.errors, r = this.retriesSubscription;
        n && (n.unsubscribe(), this.errors = void 0), r && (r.unsubscribe(), this.retriesSubscription = void 0), this.retries = void 0;
      }, t.prototype.notifyNext = function() {
        var n = this._unsubscribe;
        this._unsubscribe = null, this._unsubscribeAndRecycle(), this._unsubscribe = n, this.source.subscribe(this);
      }, t;
    }(od), pv = function() {
      function e(t) {
        this.project = t;
      }
      return e.prototype.call = function(t, n) {
        return n.subscribe(new yB(t, this.project));
      }, e;
    }(), yB = function(e) {
      function t(n, r) {
        return (n = e.call(this, n) || this).project = r, n.index = 0, n;
      }
      return ha(t, e), t.prototype._next = function(n) {
        var r = this.index++;
        try {
          var o = this.project(n, r);
        } catch (i) {
          return void this.destination.error(i);
        }
        this._innerSub(o);
      }, t.prototype._innerSub = function(n) {
        var r = this.innerSubscription;
        r && r.unsubscribe(), r = new nd(this);
        var o = this.destination;
        o.add(r), this.innerSubscription = bd(n, r), this.innerSubscription !== r && o.add(this.innerSubscription);
      }, t.prototype._complete = function() {
        var n = this.innerSubscription;
        n && !n.closed || e.prototype._complete.call(this), this.unsubscribe();
      }, t.prototype._unsubscribe = function() {
        this.innerSubscription = void 0;
      }, t.prototype.notifyComplete = function() {
        this.innerSubscription = void 0, this.isStopped && e.prototype._complete.call(this);
      }, t.prototype.notifyNext = function(n) {
        this.destination.next(n);
      }, t;
    }(od), qv = function() {
      function e(t) {
        this.notifier = t;
      }
      return e.prototype.call = function(t, n) {
        t = new zB(t);
        var r = bd(this.notifier, new nd(t));
        return r && !t.seenValue ? (t.add(r), n.subscribe(t)) : t;
      }, e;
    }(), zB = function(e) {
      function t(n) {
        return (n = e.call(this, n) || this).seenValue = !1, n;
      }
      return ha(t, e), t.prototype.notifyNext = function() {
        this.seenValue = !0, this.complete();
      }, t.prototype.notifyComplete = function() {
      }, t;
    }(od), rv = function() {
      function e(t, n, r) {
        this.nextOrObserver = t, this.error = n, this.complete = r;
      }
      return e.prototype.call = function(t, n) {
        return n.subscribe(new AB(t, this.nextOrObserver, this.error, this.complete));
      }, e;
    }(), AB = function(e) {
      function t(n, r, o, i) {
        return (n = e.call(this, n) || this)._tapNext = Ic, n._tapError = Ic, n._tapComplete = Ic, n._tapError = o || Ic, n._tapComplete = i || Ic, Ne(r) ? (n._context = n, n._tapNext = r) : r && (n._context = r, n._tapNext = r.next || Ic, n._tapError = r.error || Ic, n._tapComplete = r.complete || Ic), n;
      }
      return ha(t, e), t.prototype._next = function(n) {
        try {
          this._tapNext.call(this._context, n);
        } catch (r) {
          return void this.destination.error(r);
        }
        this.destination.next(n);
      }, t.prototype._error = function(n) {
        try {
          this._tapError.call(this._context, n);
        } catch (r) {
          return void this.destination.error(r);
        }
        this.destination.error(n);
      }, t.prototype._complete = function() {
        try {
          this._tapComplete.call(this._context);
        } catch (n) {
          return void this.destination.error(n);
        }
        return this.destination.complete();
      }, t;
    }(za), tv = { leading: !0, trailing: !1 };
    (function(e) {
      function t(n, r, o, i) {
        var s = e.call(this, n) || this;
        return s.destination = n, s.durationSelector = r, s._leading = o, s._trailing = i, s._hasValue = !1, s;
      }
      ha(t, e), t.prototype._next = function(n) {
        this._hasValue = !0, this._sendValue = n, this._throttled || (this._leading ? this.send() : this.throttle(n));
      }, t.prototype.send = function() {
        var n = this._sendValue;
        this._hasValue && (this.destination.next(n), this.throttle(n)), this._hasValue = !1, this._sendValue = void 0;
      }, t.prototype.throttle = function(n) {
        (n = this.tryDurationSelector(n)) && this.add(this._throttled = bd(n, new nd(this)));
      }, t.prototype.tryDurationSelector = function(n) {
        try {
          return this.durationSelector(n);
        } catch (r) {
          return this.destination.error(r), null;
        }
      }, t.prototype.throttlingDone = function() {
        var n = this._throttled, r = this._trailing;
        n && n.unsubscribe(), this._throttled = void 0, r && this.send();
      }, t.prototype.notifyNext = function() {
        this.throttlingDone();
      }, t.prototype.notifyComplete = function() {
        this.throttlingDone();
      };
    })(od);
    for (var uv = function() {
      function e(t, n, r, o) {
        this.duration = t, this.scheduler = n, this.leading = r, this.trailing = o;
      }
      return e.prototype.call = function(t, n) {
        return n.subscribe(new BB(t, this.duration, this.scheduler, this.leading, this.trailing));
      }, e;
    }(), BB = function(e) {
      function t(n, r, o, i, s) {
        return (n = e.call(this, n) || this).duration = r, n.scheduler = o, n.leading = i, n.trailing = s, n._hasTrailingValue = !1, n._trailingValue = null, n;
      }
      return ha(t, e), t.prototype._next = function(n) {
        this.throttled ? this.trailing && (this._trailingValue = n, this._hasTrailingValue = !0) : (this.add(this.throttled = this.scheduler.schedule(vv, this.duration, { subscriber: this })), this.leading ? this.destination.next(n) : this.trailing && (this._trailingValue = n, this._hasTrailingValue = !0));
      }, t.prototype._complete = function() {
        this._hasTrailingValue && this.destination.next(this._trailingValue), this.destination.complete();
      }, t.prototype.clearThrottle = function() {
        var n = this.throttled;
        n && (this.trailing && this._hasTrailingValue && (this.destination.next(this._trailingValue), this._trailingValue = null, this._hasTrailingValue = !1), n.unsubscribe(), this.remove(n), this.throttled = null);
      }, t;
    }(za), xv = function() {
      function e(t, n, r, o) {
        this.waitFor = t, this.absoluteTimeout = n, this.withObservable = r, this.scheduler = o;
      }
      return e.prototype.call = function(t, n) {
        return n.subscribe(new CB(t, this.absoluteTimeout, this.waitFor, this.withObservable, this.scheduler));
      }, e;
    }(), CB = function(e) {
      function t(n, r, o, i, s) {
        return (n = e.call(this, n) || this).absoluteTimeout = r, n.waitFor = o, n.withObservable = i, n.scheduler = s, n.scheduleTimeout(), n;
      }
      return ha(t, e), t.dispatchTimeout = function(n) {
        var r = n.withObservable;
        n._unsubscribeAndRecycle(), n.add(bd(r, new nd(n)));
      }, t.prototype.scheduleTimeout = function() {
        var n = this.action;
        n ? this.action = n.schedule(this, this.waitFor) : this.add(this.action = this.scheduler.schedule(t.dispatchTimeout, this.waitFor, this));
      }, t.prototype._next = function(n) {
        this.absoluteTimeout || this.scheduleTimeout(), e.prototype._next.call(this, n);
      }, t.prototype._unsubscribe = function() {
        this.action = void 0, this.withObservable = this.scheduler = null;
      }, t;
    }(od), zv = function() {
      function e(t, n) {
        this.observables = t, this.project = n;
      }
      return e.prototype.call = function(t, n) {
        return n.subscribe(new DB(t, this.observables, this.project));
      }, e;
    }(), DB = function(e) {
      function t(n, r, o) {
        (n = e.call(this, n) || this).observables = r, n.project = o, n.toRespond = [], o = r.length, n.values = Array(o);
        for (var i = 0; i < o; i++)
          n.toRespond.push(i);
        for (i = 0; i < o; i++)
          n.add(bj(n, r[i], void 0, i));
        return n;
      }
      return ha(t, e), t.prototype.notifyNext = function(n, r, o) {
        this.values[o] = r, 0 < (n = this.toRespond).length && (o = n.indexOf(o)) !== -1 && n.splice(o, 1);
      }, t.prototype.notifyComplete = function() {
      }, t.prototype._next = function(n) {
        this.toRespond.length === 0 && (n = [n].concat(this.values), this.project ? this._tryProject(n) : this.destination.next(n));
      }, t.prototype._tryProject = function(n) {
        try {
          var r = this.project.apply(this, n);
        } catch (o) {
          return void this.destination.error(o);
        }
        this.destination.next(r);
      }, t;
    }(Bl), Kr = xb(function(e) {
      var t = typeof crypto != "undefined" && crypto.getRandomValues && crypto.getRandomValues.bind(crypto) || typeof msCrypto != "undefined" && typeof window.msCrypto.getRandomValues == "function" && msCrypto.getRandomValues.bind(msCrypto);
      if (t) {
        var n = new Uint8Array(16);
        e.exports = function() {
          return t(n), n;
        };
      } else {
        var r = Array(16);
        e.exports = function() {
          for (var o, i = 0; 16 > i; i++)
            !(3 & i) && (o = 4294967296 * Math.random()), r[i] = o >>> ((3 & i) << 3) & 255;
          return r;
        };
      }
    }), zb = [], pi = 0; 256 > pi; ++pi)
      zb[pi] = (pi + 256).toString(16).substr(1);
    var Lr = function(e, t) {
      return t = t || 0, [zb[e[t++]], zb[e[t++]], zb[e[t++]], zb[e[t++]], "-", zb[e[t++]], zb[e[t++]], "-", zb[e[t++]], zb[e[t++]], "-", zb[e[t++]], zb[e[t++]], "-", zb[e[t++]], zb[e[t++]], zb[e[t++]], zb[e[t++]], zb[e[t++]], zb[e[t++]]].join("");
    }, Ng = function(e, t, n) {
      if (n = t && n || 0, typeof e == "string" && (t = e === "binary" ? Array(16) : null, e = null), (e = (e = e || {}).random || (e.rng || Kr)())[6] = 15 & e[6] | 64, e[8] = 63 & e[8] | 128, t)
        for (var r = 0; 16 > r; ++r)
          t[n + r] = e[r];
      return t || Lr(e);
    }, Og = Ng(), gj = !1, yn = new AbortController(), pd, Md, El, Fl, Nd, qe, Fc, re, nc, Gl, qd, se, rd, sd, td, zf;
    (function(e) {
      e[e.ATTRIBUTE_OPERATION_ERR_FAILURE = 2] = "ATTRIBUTE_OPERATION_ERR_FAILURE", e[e.ATTRIBUTE_OPERATION_ERR_INVALID_ARGUMENT = 3] = "ATTRIBUTE_OPERATION_ERR_INVALID_ARGUMENT", e[e.ATTRIBUTE_OPERATION_ERR_SIZE_OVERFLOW = 4] = "ATTRIBUTE_OPERATION_ERR_SIZE_OVERFLOW", e[e.ATTRIBUTE_OPERATION_ERR_TOO_OFTEN = 5] = "ATTRIBUTE_OPERATION_ERR_TOO_OFTEN", e[e.ATTRIBUTE_OPERATION_ERR_USER_NOT_FOUND = 6] = "ATTRIBUTE_OPERATION_ERR_USER_NOT_FOUND", e[e.ATTRIBUTE_OPERATION_ERR_TIMEOUT = 7] = "ATTRIBUTE_OPERATION_ERR_TIMEOUT", e[e.ATTRIBUTE_OPERATION_ERR_USER_NOT_LOGGED_IN = 102] = "ATTRIBUTE_OPERATION_ERR_USER_NOT_LOGGED_IN";
    })(pd || (pd = {})), function(e) {
      e[e.CHANNEL_MESSAGE_ERR_FAILURE = 1] = "CHANNEL_MESSAGE_ERR_FAILURE", e[e.CHANNEL_MESSAGE_ERR_TIMEOUT = 2] = "CHANNEL_MESSAGE_ERR_TIMEOUT", e[e.CHANNEL_MESSAGE_ERR_TOO_OFTEN = 3] = "CHANNEL_MESSAGE_ERR_TOO_OFTEN", e[e.CHANNEL_MESSAGE_ERR_INVALID_MESSAGE = 4] = "CHANNEL_MESSAGE_ERR_INVALID_MESSAGE", e[e.CHANNEL_MESSAGE_ERR_NOT_IN_CHANNEL = 5] = "CHANNEL_MESSAGE_ERR_NOT_IN_CHANNEL", e[e.CHANNEL_MESSAGE_ERR_USER_NOT_LOGGED_IN = 102] = "CHANNEL_MESSAGE_ERR_USER_NOT_LOGGED_IN";
    }(Md || (Md = {})), function(e) {
      e[e.CREATE_CHANNEL_ERR_INVALID_ARGUMENT = 1] = "CREATE_CHANNEL_ERR_INVALID_ARGUMENT";
    }(El || (El = {})), function(e) {
      e[e.CREATE_INSTANCE_ERR_INVALID_ARGUMENT = 1] = "CREATE_INSTANCE_ERR_INVALID_ARGUMENT";
    }(Fl || (Fl = {})), function(e) {
      e[e.GET_MEMBERS_ERR_FAILURE = 1] = "GET_MEMBERS_ERR_FAILURE", e[e.GET_MEMBERS_ERR_REJECTED = 2] = "GET_MEMBERS_ERR_REJECTED", e[e.GET_MEMBERS_ERR_TIMEOUT = 3] = "GET_MEMBERS_ERR_TIMEOUT", e[e.GET_MEMBERS_ERR_TOO_OFTEN = 4] = "GET_MEMBERS_ERR_TOO_OFTEN", e[e.GET_MEMBERS_ERR_NOT_IN_CHANNEL = 5] = "GET_MEMBERS_ERR_NOT_IN_CHANNEL", e[e.GET_MEMBERS_ERR_USER_NOT_LOGGED_IN = 102] = "GET_MEMBERS_ERR_USER_NOT_LOGGED_IN";
    }(Nd || (Nd = {})), function(e) {
      e[e.INVITATION_API_CALL_ERR_INVALID_ARGUMENT = 1] = "INVITATION_API_CALL_ERR_INVALID_ARGUMENT", e[e.INVITATION_API_CALL_ERR_NOT_STARTED = 2] = "INVITATION_API_CALL_ERR_NOT_STARTED", e[e.INVITATION_API_CALL_ERR_ALREADY_END = 3] = "INVITATION_API_CALL_ERR_ALREADY_END", e[e.INVITATION_API_CALL_ERR_ALREADY_ACCEPT = 4] = "INVITATION_API_CALL_ERR_ALREADY_ACCEPT", e[e.INVITATION_API_CALL_ERR_ALREADY_SENT = 5] = "INVITATION_API_CALL_ERR_ALREADY_SENT";
    }(qe || (qe = {})), function(e) {
      e[e.JOIN_CHANNEL_ERR_FAILURE = 1] = "JOIN_CHANNEL_ERR_FAILURE", e[e.JOIN_CHANNEL_ERR_REJECTED = 2] = "JOIN_CHANNEL_ERR_REJECTED", e[e.JOIN_CHANNEL_ERR_INVALID_ARGUMENT = 3] = "JOIN_CHANNEL_ERR_INVALID_ARGUMENT", e[e.JOIN_CHANNEL_TIMEOUT = 4] = "JOIN_CHANNEL_TIMEOUT", e[e.JOIN_CHANNEL_ERR_EXCEED_LIMIT = 5] = "JOIN_CHANNEL_ERR_EXCEED_LIMIT", e[e.JOIN_CHANNEL_ERR_ALREADY_JOINED = 6] = "JOIN_CHANNEL_ERR_ALREADY_JOINED", e[e.JOIN_CHANNEL_ERR_TOO_OFTEN = 7] = "JOIN_CHANNEL_ERR_TOO_OFTEN", e[e.JOIN_CHANNEL_ERR_JOIN_SAME_CHANNEL_TOO_OFTEN = 8] = "JOIN_CHANNEL_ERR_JOIN_SAME_CHANNEL_TOO_OFTEN", e[e.JOIN_CHANNEL_ERR_USER_NOT_LOGGED_IN = 102] = "JOIN_CHANNEL_ERR_USER_NOT_LOGGED_IN", e[e.JOIN_CHANNEL_ERR_ABORTED_BY_LEAVE = 201] = "JOIN_CHANNEL_ERR_ABORTED_BY_LEAVE", e[e.JOIN_CHANNEL_ERR_ALREADY_JOINED_CHANNEL_OF_SAME_ID = 202] = "JOIN_CHANNEL_ERR_ALREADY_JOINED_CHANNEL_OF_SAME_ID";
    }(Fc || (Fc = {})), function(e) {
      e[e.LEAVE_CHANNEL_ERR_FAILURE = 1] = "LEAVE_CHANNEL_ERR_FAILURE", e[e.LEAVE_CHANNEL_ERR_REJECTED = 2] = "LEAVE_CHANNEL_ERR_REJECTED", e[e.LEAVE_CHANNEL_ERR_NOT_IN_CHANNEL = 3] = "LEAVE_CHANNEL_ERR_NOT_IN_CHANNEL", e[e.LEAVE_CHANNEL_ERR_KICKED = 4] = "LEAVE_CHANNEL_ERR_KICKED", e[e.LEAVE_CHANNEL_ERR_USER_NOT_LOGGED_IN = 102] = "LEAVE_CHANNEL_ERR_USER_NOT_LOGGED_IN";
    }(re || (re = {})), function(e) {
      e[e.LOGIN_ERR_UNKNOWN = 1] = "LOGIN_ERR_UNKNOWN", e[e.LOGIN_ERR_REJECTED = 2] = "LOGIN_ERR_REJECTED", e[e.LOGIN_ERR_INVALID_ARGUMENT = 3] = "LOGIN_ERR_INVALID_ARGUMENT", e[e.LOGIN_ERR_INVALID_APP_ID = 4] = "LOGIN_ERR_INVALID_APP_ID", e[e.LOGIN_ERR_INVALID_TOKEN = 5] = "LOGIN_ERR_INVALID_TOKEN", e[e.LOGIN_ERR_TOKEN_EXPIRED = 6] = "LOGIN_ERR_TOKEN_EXPIRED", e[e.LOGIN_ERR_NOT_AUTHORIZED = 7] = "LOGIN_ERR_NOT_AUTHORIZED", e[e.LOGIN_ERR_ALREADY_LOGIN = 8] = "LOGIN_ERR_ALREADY_LOGIN", e[e.LOGIN_ERR_TIMEOUT = 9] = "LOGIN_ERR_TIMEOUT", e[e.LOGIN_ERR_TOO_OFTEN = 10] = "LOGIN_ERR_TOO_OFTEN", e[e.LOGIN_ERR_ABORTED_BY_LOGOUT = 201] = "LOGIN_ERR_ABORTED_BY_LOGOUT";
    }(nc || (nc = {})), function(e) {
      e[e.LOGOUT_ERR_USER_NOT_LOGGED_IN = 102] = "LOGOUT_ERR_USER_NOT_LOGGED_IN";
    }(Gl || (Gl = {})), function(e) {
      e[e.PEER_MESSAGE_ERR_FAILURE = 1] = "PEER_MESSAGE_ERR_FAILURE", e[e.PEER_MESSAGE_ERR_TIMEOUT = 2] = "PEER_MESSAGE_ERR_TIMEOUT", e[e.PEER_MESSAGE_ERR_TOO_OFTEN = 5] = "PEER_MESSAGE_ERR_TOO_OFTEN", e[e.PEER_MESSAGE_ERR_INVALID_USERID = 6] = "PEER_MESSAGE_ERR_INVALID_USERID", e[e.PEER_MESSAGE_ERR_INVALID_MESSAGE = 7] = "PEER_MESSAGE_ERR_INVALID_MESSAGE", e[e.PEER_MESSAGE_ERR_INCOMPATIBLE_MESSAGE = 8] = "PEER_MESSAGE_ERR_INCOMPATIBLE_MESSAGE", e[e.PEER_MESSAGE_ERR_USER_NOT_LOGGED_IN = 102] = "PEER_MESSAGE_ERR_USER_NOT_LOGGED_IN";
    }(qd || (qd = {})), function(e) {
      e[e.QUERY_PEERS_ONLINE_STATUS_ERR_INVALID_ARGUMENT = 2] = "QUERY_PEERS_ONLINE_STATUS_ERR_INVALID_ARGUMENT", e[e.QUERY_PEERS_ONLINE_STATUS_ERR_REJECTED = 3] = "QUERY_PEERS_ONLINE_STATUS_ERR_REJECTED", e[e.QUERY_PEERS_ONLINE_STATUS_ERR_TIMEOUT = 4] = "QUERY_PEERS_ONLINE_STATUS_ERR_TIMEOUT", e[e.QUERY_PEERS_ONLINE_STATUS_ERR_TOO_OFTEN = 5] = "QUERY_PEERS_ONLINE_STATUS_ERR_TOO_OFTEN", e[e.QUERY_PEERS_ONLINE_STATUS_ERR_USER_NOT_LOGGED_IN = 102] = "QUERY_PEERS_ONLINE_STATUS_ERR_USER_NOT_LOGGED_IN";
    }(se || (se = {})), function(e) {
      e[e.RENEW_TOKEN_ERR_FAILURE = 1] = "RENEW_TOKEN_ERR_FAILURE", e[e.RENEW_TOKEN_ERR_INVALID_ARGUMENT = 2] = "RENEW_TOKEN_ERR_INVALID_ARGUMENT", e[e.RENEW_TOKEN_ERR_REJECTED = 3] = "RENEW_TOKEN_ERR_REJECTED", e[e.RENEW_TOKEN_ERR_TOO_OFTEN = 4] = "RENEW_TOKEN_ERR_TOO_OFTEN", e[e.RENEW_TOKEN_ERR_TOKEN_EXPIRED = 5] = "RENEW_TOKEN_ERR_TOKEN_EXPIRED", e[e.RENEW_TOKEN_ERR_INVALID_TOKEN = 6] = "RENEW_TOKEN_ERR_INVALID_TOKEN", e[e.RENEW_TOKEN_ERR_USER_NOT_LOGGED_IN = 102] = "RENEW_TOKEN_ERR_USER_NOT_LOGGED_IN", e[e.RENEW_TOKEN_ERR_ABORTED_BY_LOGOUT = 201] = "RENEW_TOKEN_ERR_ABORTED_BY_LOGOUT";
    }(rd || (rd = {})), function(e) {
      e[e.GET_CHANNEL_MEMBER_COUNT_ERR_FAILURE = 1] = "GET_CHANNEL_MEMBER_COUNT_ERR_FAILURE", e[e.GET_CHANNEL_MEMBER_COUNT_ERR_INVALID_ARGUMENT = 2] = "GET_CHANNEL_MEMBER_COUNT_ERR_INVALID_ARGUMENT", e[e.GET_CHANNEL_MEMBER_COUNT_ERR_TOO_OFTEN = 3] = "GET_CHANNEL_MEMBER_COUNT_ERR_TOO_OFTEN", e[e.GET_CHANNEL_MEMBER_COUNT_ERR_TIMEOUT = 4] = "GET_CHANNEL_MEMBER_COUNT_ERR_TIMEOUT", e[e.GET_CHANNEL_MEMBER_COUNT_ERR_EXCEED_LIMIT = 5] = "GET_CHANNEL_MEMBER_COUNT_ERR_EXCEED_LIMIT", e[e.GET_CHANNEL_MEMBER_COUNT_ERR_NOT_INITIALIZED = 101] = "GET_CHANNEL_MEMBER_COUNT_ERR_NOT_INITIALIZED", e[e.GET_CHANNEL_MEMBER_COUNT_ERR_USER_NOT_LOGGED_IN = 102] = "GET_CHANNEL_MEMBER_COUNT_ERR_USER_NOT_LOGGED_IN";
    }(sd || (sd = {})), function(e) {
      e[e.PEER_SUBSCRIPTION_STATUS_ERR_FAILURE = 1] = "PEER_SUBSCRIPTION_STATUS_ERR_FAILURE", e[e.PEER_SUBSCRIPTION_STATUS_ERR_INVALID_ARGUMENT = 2] = "PEER_SUBSCRIPTION_STATUS_ERR_INVALID_ARGUMENT", e[e.PEER_SUBSCRIPTION_STATUS_ERR_REJECTED = 3] = "PEER_SUBSCRIPTION_STATUS_ERR_REJECTED", e[e.PEER_SUBSCRIPTION_STATUS_ERR_TIMEOUT = 4] = "PEER_SUBSCRIPTION_STATUS_ERR_TIMEOUT", e[e.PEER_SUBSCRIPTION_STATUS_ERR_TOO_OFTEN = 5] = "PEER_SUBSCRIPTION_STATUS_ERR_TOO_OFTEN", e[e.PEER_SUBSCRIPTION_STATUS_ERR_OVERFLOW = 6] = "PEER_SUBSCRIPTION_STATUS_ERR_OVERFLOW", e[e.PEER_SUBSCRIPTION_STATUS_ERR_USER_NOT_LOGGED_IN = 102] = "PEER_SUBSCRIPTION_STATUS_ERR_USER_NOT_LOGGED_IN";
    }(td || (td = {})), function(e) {
      e[e.QUERY_PEERS_BY_SUBSCRIPTION_OPTION_ERR_FAILURE = 1] = "QUERY_PEERS_BY_SUBSCRIPTION_OPTION_ERR_FAILURE", e[e.QUERY_PEERS_BY_SUBSCRIPTION_OPTION_ERR_TIMEOUT = 2] = "QUERY_PEERS_BY_SUBSCRIPTION_OPTION_ERR_TIMEOUT", e[e.QUERY_PEERS_BY_SUBSCRIPTION_OPTION_ERR_TOO_OFTEN = 3] = "QUERY_PEERS_BY_SUBSCRIPTION_OPTION_ERR_TOO_OFTEN", e[e.QUERY_PEERS_BY_SUBSCRIPTION_OPTION_ERR_USER_NOT_LOGGED_IN = 102] = "QUERY_PEERS_BY_SUBSCRIPTION_OPTION_ERR_USER_NOT_LOGGED_IN";
    }(zf || (zf = {}));
    var oc = pd.ATTRIBUTE_OPERATION_ERR_FAILURE, gb = pd.ATTRIBUTE_OPERATION_ERR_INVALID_ARGUMENT, Ye = pd.ATTRIBUTE_OPERATION_ERR_SIZE_OVERFLOW;
    pd.ATTRIBUTE_OPERATION_ERR_TOO_OFTEN;
    var Mr = pd.ATTRIBUTE_OPERATION_ERR_USER_NOT_FOUND, pc = pd.ATTRIBUTE_OPERATION_ERR_TIMEOUT, qc = pd.ATTRIBUTE_OPERATION_ERR_USER_NOT_LOGGED_IN, qi = Md.CHANNEL_MESSAGE_ERR_FAILURE, Hl = Md.CHANNEL_MESSAGE_ERR_TIMEOUT, Nr = Md.CHANNEL_MESSAGE_ERR_TOO_OFTEN, Il = Md.CHANNEL_MESSAGE_ERR_INVALID_MESSAGE, EB = Md.CHANNEL_MESSAGE_ERR_NOT_IN_CHANNEL, Jl = Md.CHANNEL_MESSAGE_ERR_USER_NOT_LOGGED_IN, FB = El.CREATE_CHANNEL_ERR_INVALID_ARGUMENT, Or = Fl.CREATE_INSTANCE_ERR_INVALID_ARGUMENT;
    sd.GET_CHANNEL_MEMBER_COUNT_ERR_FAILURE;
    var Pr = sd.GET_CHANNEL_MEMBER_COUNT_ERR_INVALID_ARGUMENT;
    sd.GET_CHANNEL_MEMBER_COUNT_ERR_TOO_OFTEN;
    var Qr = sd.GET_CHANNEL_MEMBER_COUNT_ERR_TIMEOUT, GB = sd.GET_CHANNEL_MEMBER_COUNT_ERR_EXCEED_LIMIT;
    sd.GET_CHANNEL_MEMBER_COUNT_ERR_NOT_INITIALIZED;
    var HB = sd.GET_CHANNEL_MEMBER_COUNT_ERR_USER_NOT_LOGGED_IN, IB = Nd.GET_MEMBERS_ERR_FAILURE, JB = Nd.GET_MEMBERS_ERR_REJECTED;
    Nd.GET_MEMBERS_ERR_TIMEOUT, Nd.GET_MEMBERS_ERR_TOO_OFTEN;
    var KB = Nd.GET_MEMBERS_ERR_NOT_IN_CHANNEL, LB = Nd.GET_MEMBERS_ERR_USER_NOT_LOGGED_IN, Xc = qe.INVITATION_API_CALL_ERR_INVALID_ARGUMENT, MB = qe.INVITATION_API_CALL_ERR_NOT_STARTED, ri = qe.INVITATION_API_CALL_ERR_ALREADY_END, Rr = qe.INVITATION_API_CALL_ERR_ALREADY_ACCEPT, NB = qe.INVITATION_API_CALL_ERR_ALREADY_SENT, Sr = Fc.JOIN_CHANNEL_ERR_FAILURE;
    Fc.JOIN_CHANNEL_ERR_REJECTED;
    var OB = Fc.JOIN_CHANNEL_ERR_INVALID_ARGUMENT, Tr = Fc.JOIN_CHANNEL_TIMEOUT, Ur = Fc.JOIN_CHANNEL_ERR_EXCEED_LIMIT, Vr = Fc.JOIN_CHANNEL_ERR_ALREADY_JOINED;
    Fc.JOIN_CHANNEL_ERR_TOO_OFTEN;
    var Wr = Fc.JOIN_CHANNEL_ERR_USER_NOT_LOGGED_IN, Xr = Fc.JOIN_CHANNEL_ERR_ALREADY_JOINED_CHANNEL_OF_SAME_ID, Yr = re.LEAVE_CHANNEL_ERR_FAILURE, Zr = re.LEAVE_CHANNEL_ERR_REJECTED, PB = re.LEAVE_CHANNEL_ERR_NOT_IN_CHANNEL, QB = re.LEAVE_CHANNEL_ERR_USER_NOT_LOGGED_IN, RB = re.LEAVE_CHANNEL_ERR_KICKED, $r = nc.LOGIN_ERR_UNKNOWN, Pg = nc.LOGIN_ERR_REJECTED, si = nc.LOGIN_ERR_INVALID_ARGUMENT, as = nc.LOGIN_ERR_INVALID_APP_ID, bs = nc.LOGIN_ERR_INVALID_TOKEN, ti = nc.LOGIN_ERR_TOKEN_EXPIRED;
    nc.LOGIN_ERR_NOT_AUTHORIZED;
    var SB = nc.LOGIN_ERR_ALREADY_LOGIN, TB = nc.LOGIN_ERR_TIMEOUT, UB = nc.LOGIN_ERR_TOO_OFTEN, cs = Gl.LOGOUT_ERR_USER_NOT_LOGGED_IN, ds = qd.PEER_MESSAGE_ERR_FAILURE, Kl = qd.PEER_MESSAGE_ERR_TIMEOUT, es = qd.PEER_MESSAGE_ERR_TOO_OFTEN, fs = qd.PEER_MESSAGE_ERR_INVALID_USERID, bg = qd.PEER_MESSAGE_ERR_INVALID_MESSAGE, Ll = qd.PEER_MESSAGE_ERR_USER_NOT_LOGGED_IN;
    qd.PEER_MESSAGE_ERR_INCOMPATIBLE_MESSAGE;
    var gs = se.QUERY_PEERS_ONLINE_STATUS_ERR_INVALID_ARGUMENT;
    se.QUERY_PEERS_ONLINE_STATUS_ERR_REJECTED;
    var VB = se.QUERY_PEERS_ONLINE_STATUS_ERR_TIMEOUT;
    se.QUERY_PEERS_ONLINE_STATUS_ERR_TOO_OFTEN;
    var WB = se.QUERY_PEERS_ONLINE_STATUS_ERR_USER_NOT_LOGGED_IN, Ml = rd.RENEW_TOKEN_ERR_FAILURE, XB = rd.RENEW_TOKEN_ERR_INVALID_ARGUMENT;
    rd.RENEW_TOKEN_ERR_REJECTED, rd.RENEW_TOKEN_ERR_TOO_OFTEN;
    var YB = rd.RENEW_TOKEN_ERR_TOKEN_EXPIRED, ZB = rd.RENEW_TOKEN_ERR_INVALID_TOKEN, hs = rd.RENEW_TOKEN_ERR_USER_NOT_LOGGED_IN, is = td.PEER_SUBSCRIPTION_STATUS_ERR_FAILURE, Qg = td.PEER_SUBSCRIPTION_STATUS_ERR_INVALID_ARGUMENT;
    td.PEER_SUBSCRIPTION_STATUS_ERR_REJECTED;
    var $B = td.PEER_SUBSCRIPTION_STATUS_ERR_TIMEOUT;
    td.PEER_SUBSCRIPTION_STATUS_ERR_TOO_OFTEN;
    var js = td.PEER_SUBSCRIPTION_STATUS_ERR_OVERFLOW, Nl = td.PEER_SUBSCRIPTION_STATUS_ERR_USER_NOT_LOGGED_IN;
    zf.QUERY_PEERS_BY_SUBSCRIPTION_OPTION_ERR_FAILURE, zf.QUERY_PEERS_BY_SUBSCRIPTION_OPTION_ERR_TIMEOUT, zf.QUERY_PEERS_BY_SUBSCRIPTION_OPTION_ERR_TOO_OFTEN, zf.QUERY_PEERS_BY_SUBSCRIPTION_OPTION_ERR_USER_NOT_LOGGED_IN;
    var aC = function(e, t) {
      var n;
      return rl(e, function(r, o, i) {
        return !(n = t(r, o, i));
      }), !!n;
    }, ui = function(e, t, n) {
      if (!Gb(n))
        return !1;
      var r = qa(t);
      return !!(r == "number" ? ae(n) && gl(t, n.length) : r == "string" && t in n) && Gg(n[t], e);
    }, Ol = function(e, t, n) {
      var r = ub(e) ? ur : aC;
      return n && ui(e, t, n) && (t = void 0), r(e, wf(t));
    }, bC = function(e, t) {
      var n = -1, r = ae(e) ? Array(e.length) : [];
      return rl(e, function(o, i, s) {
        r[++n] = t(o, i, s);
      }), r;
    }, cC = function(e, t) {
      var n = e.length;
      for (e.sort(t); n--; )
        e[n] = e[n].value;
      return e;
    }, dC = function(e, t, n) {
      t = t.length ? Je(t, function(o) {
        return ub(o) ? function(i) {
          return li(i, o.length === 1 ? o[0] : o);
        } : o;
      }) : [mi];
      var r = -1;
      return t = Je(t, ii(wf)), e = bC(e, function(o, i, s) {
        return { criteria: Je(t, function(u) {
          return u(o);
        }), index: ++r, value: o };
      }), cC(e, function(o, i) {
        t: {
          for (var s = -1, u = o.criteria, a = i.criteria, l = u.length, f = n.length; ++s < l; ) {
            e: {
              var h = u[s], d = a[s];
              if (h !== d) {
                var p = h !== void 0, v = h === null, y = h == h, g = Ke(h), m = d !== void 0, E = d === null, w = d == d, C = Ke(d);
                if (!E && !C && !g && h > d || g && m && w && !E && !C || v && m && w || !p && w || !y) {
                  h = 1;
                  break e;
                }
                if (!v && !g && !C && h < d || C && p && y && !v && !g || E && p && y || !m && y || !w) {
                  h = -1;
                  break e;
                }
              }
              h = 0;
            }
            if (h) {
              o = s >= f ? h : h * (n[s] == "desc" ? -1 : 1);
              break t;
            }
          }
          o = o.index - i.index;
        }
        return o;
      });
    }, ks = function(e, t) {
      return sr(rr(e, t, mi), e + "");
    }, ls = ks(function(e, t) {
      if (e == null)
        return [];
      var n = t.length;
      return 1 < n && ui(e, t[0], t[1]) ? t = [] : 2 < n && ui(t[0], t[1], t[2]) && (t = [t[0]]), dC(e, Si(t, 1), []);
    }), ms = function(e) {
      if (e.__esModule)
        return e;
      var t = Object.defineProperty({}, "__esModule", { value: !0 });
      return Object.keys(e).forEach(function(n) {
        var r = Object.getOwnPropertyDescriptor(e, n);
        Object.defineProperty(t, n, r.get ? r : { enumerable: !0, get: function() {
          return e[n];
        } });
      }), t;
    }(iB), ns = xb(function(e, t) {
      Object.defineProperty(t, "__esModule", { value: !0 });
      var n = [], r = function(o, i) {
        return new WebSocket(o, i);
      };
      t.normalClosureMessage = "Normal closure", t.default = function(o, i) {
        var s = (i = i === void 0 ? { protocols: n, makeWebSocket: r } : i).protocols, u = s === void 0 ? n : s, a = (i = i.makeWebSocket) === void 0 ? r : i;
        return new ms.Observable(function(l) {
          var f, h = new ms.Subject(), d = a(o, u), p = !1, v = !1, y = function(g) {
            if (f)
              throw p = !0, g = Error("Web socket message factory function called more than once"), l.error(g), g;
            return f = g.subscribe(function(m) {
              d.send(m);
            }), h;
          };
          return d.onopen = function() {
            v ? (p = !0, d.close()) : l.next(y);
          }, d.onmessage = function(g) {
            h.next(g.data);
          }, d.onerror = function(g) {
            p = !0, l.error(Error(g.message));
          }, d.onclose = function(g) {
            p || (p = !0, v ? (l.complete(), h.complete()) : l.error(Error(g.code === 1e3 ? t.normalClosureMessage : g.reason)));
          }, function() {
            v = !0, f && f.unsubscribe(), p || (p = !0, d.close());
          };
        });
      };
    });
    (function(e) {
      e && e.__esModule && Object.prototype.hasOwnProperty.call(e, "default") && e.default;
    })(ns);
    var ij = function(e, t, n) {
      (n === void 0 || Gg(e[t], n)) && (n !== void 0 || t in e) || Ig(e, t, n);
    }, hj = function(e, t) {
      if ((t !== "constructor" || typeof e[t] != "function") && t != "__proto__")
        return e[t];
    }, eC = function(e) {
      return ks(function(t, n) {
        var r = -1, o = n.length, i = 1 < o ? n[o - 1] : void 0, s = 2 < o ? n[2] : void 0;
        for (i = 3 < e.length && typeof i == "function" ? (o--, i) : void 0, s && ui(n[0], n[1], s) && (i = 3 > o ? void 0 : i, o = 1), t = Object(t); ++r < o; )
          (s = n[r]) && e(t, s, r, i);
        return t;
      });
    }(function(e, t, n, r) {
      zn(e, t, n, r);
    }), fC = Math.floor, gC = Math.random, os = function(e, t) {
      return e + fC(gC() * (t - e + 1));
    }, ps = function(e) {
      var t = e.length;
      return t ? e[os(0, t - 1)] : void 0;
    }, hC = function(e, t) {
      return Je(t, function(n) {
        return e[n];
      });
    }, zj = function(e) {
      return e == null ? [] : hC(e, Wd(e));
    }, iC = function(e) {
      return ps(zj(e));
    }, On = function(e) {
      return (ub(e) ? ps : iC)(e);
    }, Dn = [], En = function(e, t) {
      return new WebSocket(e, t);
    }, jC = Math.floor;
    ea({ target: "Number", stat: !0 }, { isInteger: function(e) {
      return !xa(e) && isFinite(e) && jC(e) === e;
    } }), Sp("from", sk, rk);
    var kC = function(e, t) {
      for (var n = Array(arguments.length - 1), r = 0, o = 2, i = !0; o < arguments.length; )
        n[r++] = arguments[o++];
      return new Promise(function(s, u) {
        n[r] = function(a) {
          if (i)
            if (i = !1, a)
              u(a);
            else {
              for (var l = Array(arguments.length - 1), f = 0; f < l.length; )
                l[f++] = arguments[f];
              s.apply(null, l);
            }
        };
        try {
          e.apply(t || null, n);
        } catch (a) {
          i && (i = !1, u(a));
        }
      });
    }, lC = xb(function(e, t) {
      t.length = function(o) {
        var i = o.length;
        if (!i)
          return 0;
        for (var s = 0; 1 < --i % 4 && o.charAt(i) === "="; )
          ++s;
        return Math.ceil(3 * o.length) / 4 - s;
      };
      var n = Array(64), r = Array(123);
      for (e = 0; 64 > e; )
        r[n[e] = 26 > e ? e + 65 : 52 > e ? e + 71 : 62 > e ? e - 4 : e - 59 | 43] = e++;
      t.encode = function(o, i, s) {
        for (var u, a = null, l = [], f = 0, h = 0; i < s; ) {
          var d = o[i++];
          switch (h) {
            case 0:
              l[f++] = n[d >> 2], u = (3 & d) << 4, h = 1;
              break;
            case 1:
              l[f++] = n[u | d >> 4], u = (15 & d) << 2, h = 2;
              break;
            case 2:
              l[f++] = n[u | d >> 6], l[f++] = n[63 & d], h = 0;
          }
          8191 < f && ((a || (a = [])).push(String.fromCharCode.apply(String, l)), f = 0);
        }
        return h && (l[f++] = n[u], l[f++] = 61, h === 1 && (l[f++] = 61)), a ? (f && a.push(String.fromCharCode.apply(String, l.slice(0, f))), a.join("")) : String.fromCharCode.apply(String, l.slice(0, f));
      }, t.decode = function(o, i, s) {
        for (var u, a = s, l = 0, f = 0; f < o.length; ) {
          var h = o.charCodeAt(f++);
          if (h === 61 && 1 < l)
            break;
          if ((h = r[h]) === void 0)
            throw Error("invalid encoding");
          switch (l) {
            case 0:
              u = h, l = 1;
              break;
            case 1:
              i[s++] = u << 2 | (48 & h) >> 4, u = h, l = 2;
              break;
            case 2:
              i[s++] = (15 & u) << 4 | (60 & h) >> 2, u = h, l = 3;
              break;
            case 3:
              i[s++] = (3 & u) << 6 | h, l = 0;
          }
        }
        if (l === 1)
          throw Error("invalid encoding");
        return s - a;
      }, t.test = function(o) {
        return /^(?:[A-Za-z0-9+/]{4})*(?:[A-Za-z0-9+/]{2}==|[A-Za-z0-9+/]{3}=)?$/.test(o);
      };
    });
    hh.prototype.on = function(e, t, n) {
      return (this._listeners[e] || (this._listeners[e] = [])).push({ fn: t, ctx: n || this }), this;
    }, hh.prototype.off = function(e, t) {
      if (e === void 0)
        this._listeners = {};
      else if (t === void 0)
        this._listeners[e] = [];
      else {
        e = this._listeners[e];
        for (var n = 0; n < e.length; )
          e[n].fn === t ? e.splice(n, 1) : ++n;
      }
      return this;
    }, hh.prototype.emit = function(e) {
      var t = this._listeners[e];
      if (t) {
        for (var n = [], r = 1; r < arguments.length; )
          n.push(arguments[r++]);
        for (r = 0; r < t.length; )
          t[r].fn.apply(t[r++].ctx, n);
      }
      return this;
    };
    var mC = Fn(Fn), nC = function(c) {
      try {
        var b = eval("quire".replace(/^/, "re"))(c);
        if (b && (b.length || Object.keys(b).length))
          return b;
      } catch (e) {
      }
      return null;
    }, oC = xb(function(e, t) {
      t.length = function(n) {
        for (var r, o = 0, i = 0; i < n.length; ++i)
          128 > (r = n.charCodeAt(i)) ? o += 1 : 2048 > r ? o += 2 : (64512 & r) == 55296 && (64512 & n.charCodeAt(i + 1)) == 56320 ? (++i, o += 4) : o += 3;
        return o;
      }, t.read = function(n, r, o) {
        if (1 > o - r)
          return "";
        for (var i, s = null, u = [], a = 0; r < o; )
          128 > (i = n[r++]) ? u[a++] = i : 191 < i && 224 > i ? u[a++] = (31 & i) << 6 | 63 & n[r++] : 239 < i && 365 > i ? (i = ((7 & i) << 18 | (63 & n[r++]) << 12 | (63 & n[r++]) << 6 | 63 & n[r++]) - 65536, u[a++] = 55296 + (i >> 10), u[a++] = 56320 + (1023 & i)) : u[a++] = (15 & i) << 12 | (63 & n[r++]) << 6 | 63 & n[r++], 8191 < a && ((s || (s = [])).push(String.fromCharCode.apply(String, u)), a = 0);
        return s ? (a && s.push(String.fromCharCode.apply(String, u.slice(0, a))), s.join("")) : String.fromCharCode.apply(String, u.slice(0, a));
      }, t.write = function(n, r, o) {
        for (var i, s, u = o, a = 0; a < n.length; ++a)
          128 > (i = n.charCodeAt(a)) ? r[o++] = i : (2048 > i ? r[o++] = i >> 6 | 192 : ((64512 & i) == 55296 && (64512 & (s = n.charCodeAt(a + 1))) == 56320 ? (i = 65536 + ((1023 & i) << 10) + (1023 & s), ++a, r[o++] = i >> 18 | 240, r[o++] = i >> 12 & 63 | 128) : r[o++] = i >> 12 | 224, r[o++] = i >> 6 & 63 | 128), r[o++] = 63 & i | 128);
        return o - u;
      };
    }), pC = function(e, t, n) {
      var r = n || 8192, o = r >>> 1, i = null, s = r;
      return function(u) {
        return 1 > u || u > o ? e(u) : (s + u > r && (i = e(r), s = 0), u = t.call(i, s, s += u), 7 & s && (s = 1 + (7 | s)), u);
      };
    }, te = vb.zero = new vb(0, 0);
    te.toNumber = function() {
      return 0;
    }, te.zzEncode = te.zzDecode = function() {
      return this;
    }, te.length = function() {
      return 1;
    };
    var qC = vb.zeroHash = "\0\0\0\0\0\0\0\0";
    vb.fromNumber = function(e) {
      if (e === 0)
        return te;
      var t = 0 > e;
      t && (e = -e);
      var n = e >>> 0;
      return e = (e - n) / 4294967296 >>> 0, t && (e = ~e >>> 0, n = ~n >>> 0, 4294967295 < ++n && (n = 0, 4294967295 < ++e && (e = 0))), new vb(n, e);
    }, vb.from = function(e) {
      if (typeof e == "number")
        return vb.fromNumber(e);
      if (pa.isString(e)) {
        if (!pa.Long)
          return vb.fromNumber(parseInt(e, 10));
        e = pa.Long.fromString(e);
      }
      return e.low || e.high ? new vb(e.low >>> 0, e.high >>> 0) : te;
    }, vb.prototype.toNumber = function(e) {
      if (!e && this.hi >>> 31) {
        e = 1 + ~this.lo >>> 0;
        var t = ~this.hi >>> 0;
        return e || (t = t + 1 >>> 0), -(e + 4294967296 * t);
      }
      return this.lo + 4294967296 * this.hi;
    }, vb.prototype.toLong = function(e) {
      return pa.Long ? new pa.Long(0 | this.lo, 0 | this.hi, !!e) : { low: 0 | this.lo, high: 0 | this.hi, unsigned: !!e };
    };
    var Od = String.prototype.charCodeAt;
    vb.fromHash = function(e) {
      return e === qC ? te : new vb((Od.call(e, 0) | Od.call(e, 1) << 8 | Od.call(e, 2) << 16 | Od.call(e, 3) << 24) >>> 0, (Od.call(e, 4) | Od.call(e, 5) << 8 | Od.call(e, 6) << 16 | Od.call(e, 7) << 24) >>> 0);
    }, vb.prototype.toHash = function() {
      return String.fromCharCode(255 & this.lo, this.lo >>> 8 & 255, this.lo >>> 16 & 255, this.lo >>> 24, 255 & this.hi, this.hi >>> 8 & 255, this.hi >>> 16 & 255, this.hi >>> 24);
    }, vb.prototype.zzEncode = function() {
      var e = this.hi >> 31;
      return this.hi = ((this.hi << 1 | this.lo >>> 31) ^ e) >>> 0, this.lo = (this.lo << 1 ^ e) >>> 0, this;
    }, vb.prototype.zzDecode = function() {
      var e = -(1 & this.lo);
      return this.lo = ((this.lo >>> 1 | this.hi << 31) ^ e) >>> 0, this.hi = (this.hi >>> 1 ^ e) >>> 0, this;
    }, vb.prototype.length = function() {
      var e = this.lo, t = (this.lo >>> 28 | this.hi << 4) >>> 0, n = this.hi >>> 24;
      return n === 0 ? t === 0 ? 16384 > e ? 128 > e ? 1 : 2 : 2097152 > e ? 3 : 4 : 16384 > t ? 128 > t ? 5 : 6 : 2097152 > t ? 7 : 8 : 128 > n ? 9 : 10;
    };
    var pa = xb(function(e, t) {
      function n(o, i, s) {
        for (var u = Object.keys(i), a = 0; a < u.length; ++a)
          o[u[a]] !== void 0 && s || (o[u[a]] = i[u[a]]);
        return o;
      }
      function r(o) {
        function i(s, u) {
          if (!(this instanceof i))
            return new i(s, u);
          Object.defineProperty(this, "message", { get: function() {
            return s;
          } }), Error.captureStackTrace ? Error.captureStackTrace(this, i) : Object.defineProperty(this, "stack", { value: Error().stack || "" }), u && n(this, u);
        }
        return (i.prototype = Object.create(Error.prototype)).constructor = i, Object.defineProperty(i.prototype, "name", { get: function() {
          return o;
        } }), i.prototype.toString = function() {
          return this.name + ": " + this.message;
        }, i;
      }
      t.asPromise = kC, t.base64 = lC, t.EventEmitter = hh, t.float = mC, t.inquire = nC, t.utf8 = oC, t.pool = pC, t.LongBits = vb, t.isNode = !!(Ya !== void 0 && Ya && Ya.process && Ya.process.versions && Ya.process.versions.node), t.global = t.isNode && Ya || typeof window != "undefined" && window || typeof self != "undefined" && self || Ya, t.emptyArray = Object.freeze ? Object.freeze([]) : [], t.emptyObject = Object.freeze ? Object.freeze({}) : {}, t.isInteger = Number.isInteger || function(o) {
        return typeof o == "number" && isFinite(o) && Math.floor(o) === o;
      }, t.isString = function(o) {
        return typeof o == "string" || o instanceof String;
      }, t.isObject = function(o) {
        return o && qa(o) === "object";
      }, t.isset = t.isSet = function(o, i) {
        var s = o[i];
        return !(s == null || !o.hasOwnProperty(i)) && (qa(s) !== "object" || 0 < (Array.isArray(s) ? s.length : Object.keys(s).length));
      }, t.Buffer = function() {
        try {
          var o = t.inquire("buffer").Buffer;
          return o.prototype.utf8Write ? o : null;
        } catch (i) {
          return null;
        }
      }(), t._Buffer_from = null, t._Buffer_allocUnsafe = null, t.newBuffer = function(o) {
        return typeof o == "number" ? t.Buffer ? t._Buffer_allocUnsafe(o) : new t.Array(o) : t.Buffer ? t._Buffer_from(o) : typeof Uint8Array == "undefined" ? o : new Uint8Array(o);
      }, t.Array = typeof Uint8Array != "undefined" ? Uint8Array : Array, t.Long = t.global.dcodeIO && t.global.dcodeIO.Long || t.global.Long || t.inquire("long"), t.key2Re = /^true|false|0|1$/, t.key32Re = /^-?(?:0|[1-9][0-9]*)$/, t.key64Re = /^(?:[\\x00-\\xff]{8}|-?(?:0|[1-9][0-9]*))$/, t.longToHash = function(o) {
        return o ? t.LongBits.from(o).toHash() : t.LongBits.zeroHash;
      }, t.longFromHash = function(o, i) {
        return o = t.LongBits.fromHash(o), t.Long ? t.Long.fromBits(o.lo, o.hi, i) : o.toNumber(!!i);
      }, t.merge = n, t.lcFirst = function(o) {
        return o.charAt(0).toLowerCase() + o.substring(1);
      }, t.newError = r, t.ProtocolError = r("ProtocolError"), t.oneOfGetter = function(o) {
        for (var i = {}, s = 0; s < o.length; ++s)
          i[o[s]] = 1;
        return function() {
          for (var u = Object.keys(this), a = u.length - 1; -1 < a; --a)
            if (i[u[a]] === 1 && this[u[a]] !== void 0 && this[u[a]] !== null)
              return u[a];
        };
      }, t.oneOfSetter = function(o) {
        return function(i) {
          for (var s = 0; s < o.length; ++s)
            o[s] !== i && delete this[o[s]];
        };
      }, t.toJSONOptions = { longs: String, enums: String, bytes: String, json: !0 }, t._configure = function() {
        var o = t.Buffer;
        o ? (t._Buffer_from = o.from !== Uint8Array.from && o.from || function(i, s) {
          return new o(i, s);
        }, t._Buffer_allocUnsafe = o.allocUnsafe || function(i) {
          return new o(i);
        }) : t._Buffer_from = t._Buffer_allocUnsafe = null;
      };
    }), qj = Aa, Pl, vi = pa.LongBits, qs = pa.base64, rs = pa.utf8, ss = function() {
      return pa.Buffer ? function() {
        return (Aa.create = function() {
          return new Pl();
        })();
      } : function() {
        return new Aa();
      };
    };
    Aa.create = ss(), Aa.alloc = function(e) {
      return new pa.Array(e);
    }, pa.Array !== Array && (Aa.alloc = pa.pool(Aa.alloc, pa.Array.prototype.subarray)), Aa.prototype._push = function(e, t, n) {
      return this.tail = this.tail.next = new Wf(e, t, n), this.len += t, this;
    }, nj.prototype = Object.create(Wf.prototype), nj.prototype.fn = function(e, t, n) {
      for (; 127 < e; )
        t[n++] = 127 & e | 128, e >>>= 7;
      t[n] = e;
    }, Aa.prototype.uint32 = function(e) {
      return this.len += (this.tail = this.tail.next = new nj(128 > (e >>>= 0) ? 1 : 16384 > e ? 2 : 2097152 > e ? 3 : 268435456 > e ? 4 : 5, e)).len, this;
    }, Aa.prototype.int32 = function(e) {
      return 0 > e ? this._push(oj, 10, vi.fromNumber(e)) : this.uint32(e);
    }, Aa.prototype.sint32 = function(e) {
      return this.uint32((e << 1 ^ e >> 31) >>> 0);
    }, Aa.prototype.uint64 = function(e) {
      return e = vi.from(e), this._push(oj, e.length(), e);
    }, Aa.prototype.int64 = Aa.prototype.uint64, Aa.prototype.sint64 = function(e) {
      return e = vi.from(e).zzEncode(), this._push(oj, e.length(), e);
    }, Aa.prototype.bool = function(e) {
      return this._push(mj, 1, e ? 1 : 0);
    }, Aa.prototype.fixed32 = function(e) {
      return this._push(pj, 4, e >>> 0);
    }, Aa.prototype.sfixed32 = Aa.prototype.fixed32, Aa.prototype.fixed64 = function(e) {
      return e = vi.from(e), this._push(pj, 4, e.lo)._push(pj, 4, e.hi);
    }, Aa.prototype.sfixed64 = Aa.prototype.fixed64, Aa.prototype.float = function(e) {
      return this._push(pa.float.writeFloatLE, 4, e);
    }, Aa.prototype.double = function(e) {
      return this._push(pa.float.writeDoubleLE, 8, e);
    };
    var rC = pa.Array.prototype.set ? function(e, t, n) {
      t.set(e, n);
    } : function(e, t, n) {
      for (var r = 0; r < e.length; ++r)
        t[n + r] = e[r];
    };
    Aa.prototype.bytes = function(e) {
      var t = e.length >>> 0;
      if (!t)
        return this._push(mj, 1, 0);
      if (pa.isString(e)) {
        var n = Aa.alloc(t = qs.length(e));
        qs.decode(e, n, 0), e = n;
      }
      return this.uint32(t)._push(rC, t, e);
    }, Aa.prototype.string = function(e) {
      var t = rs.length(e);
      return t ? this.uint32(t)._push(rs.write, t, e) : this._push(mj, 1, 0);
    }, Aa.prototype.fork = function() {
      return this.states = new Cv(this), this.head = this.tail = new Wf(lj, 0, 0), this.len = 0, this;
    }, Aa.prototype.reset = function() {
      return this.states ? (this.head = this.states.head, this.tail = this.states.tail, this.len = this.states.len, this.states = this.states.next) : (this.head = this.tail = new Wf(lj, 0, 0), this.len = 0), this;
    }, Aa.prototype.ldelim = function() {
      var e = this.head, t = this.tail, n = this.len;
      return this.reset().uint32(n), n && (this.tail.next = e.next, this.tail = t, this.len += n), this;
    }, Aa.prototype.finish = function() {
      for (var e = this.head.next, t = this.constructor.alloc(this.len), n = 0; e; )
        e.fn(e.val, t, n), n += e.len, e = e.next;
      return t;
    }, Aa._configure = function(e) {
      Pl = e, Aa.create = ss(), Pl._configure();
    }, (Lc.prototype = Object.create(qj.prototype)).constructor = Lc, Lc._configure = function() {
      Lc.alloc = pa._Buffer_allocUnsafe, Lc.writeBytesBuffer = pa.Buffer && pa.Buffer.prototype instanceof Uint8Array && pa.Buffer.prototype.set.name === "set" ? function(e, t, n) {
        t.set(e, n);
      } : function(e, t, n) {
        if (e.copy)
          e.copy(t, n, 0, e.length);
        else
          for (var r = 0; r < e.length; )
            t[n++] = e[r++];
      };
    }, Lc.prototype.bytes = function(e) {
      pa.isString(e) && (e = pa._Buffer_from(e, "base64"));
      var t = e.length >>> 0;
      return this.uint32(t), t && this._push(Lc.writeBytesBuffer, t, e), this;
    }, Lc.prototype.string = function(e) {
      var t = pa.Buffer.byteLength(e);
      return this.uint32(t), t && this._push(Dv, t, e), this;
    }, Lc._configure();
    var sj = ib, Ql, Kn = pa.LongBits, sC = pa.utf8, ts = typeof Uint8Array != "undefined" ? function(e) {
      if (e instanceof Uint8Array || Array.isArray(e))
        return new ib(e);
      throw Error("illegal buffer");
    } : function(e) {
      if (Array.isArray(e))
        return new ib(e);
      throw Error("illegal buffer");
    }, us = function() {
      return pa.Buffer ? function(e) {
        return (ib.create = function(t) {
          return pa.Buffer.isBuffer(t) ? new Ql(t) : ts(t);
        })(e);
      } : ts;
    };
    ib.create = us(), ib.prototype._slice = pa.Array.prototype.subarray || pa.Array.prototype.slice, ib.prototype.uint32 = function() {
      var e = 4294967295;
      return function() {
        if (e = (127 & this.buf[this.pos]) >>> 0, 128 > this.buf[this.pos++] || (e = (e | (127 & this.buf[this.pos]) << 7) >>> 0, 128 > this.buf[this.pos++]) || (e = (e | (127 & this.buf[this.pos]) << 14) >>> 0, 128 > this.buf[this.pos++]) || (e = (e | (127 & this.buf[this.pos]) << 21) >>> 0, 128 > this.buf[this.pos++]) || (e = (e | (15 & this.buf[this.pos]) << 28) >>> 0, 128 > this.buf[this.pos++]))
          return e;
        if ((this.pos += 5) > this.len)
          throw this.pos = this.len, wc(this, 10);
        return e;
      };
    }(), ib.prototype.int32 = function() {
      return 0 | this.uint32();
    }, ib.prototype.sint32 = function() {
      var e = this.uint32();
      return e >>> 1 ^ -(1 & e) | 0;
    }, ib.prototype.bool = function() {
      return this.uint32() !== 0;
    }, ib.prototype.fixed32 = function() {
      if (this.pos + 4 > this.len)
        throw wc(this, 4);
      return ih(this.buf, this.pos += 4);
    }, ib.prototype.sfixed32 = function() {
      if (this.pos + 4 > this.len)
        throw wc(this, 4);
      return 0 | ih(this.buf, this.pos += 4);
    }, ib.prototype.float = function() {
      if (this.pos + 4 > this.len)
        throw wc(this, 4);
      var e = pa.float.readFloatLE(this.buf, this.pos);
      return this.pos += 4, e;
    }, ib.prototype.double = function() {
      if (this.pos + 8 > this.len)
        throw wc(this, 4);
      var e = pa.float.readDoubleLE(this.buf, this.pos);
      return this.pos += 8, e;
    }, ib.prototype.bytes = function() {
      var e = this.uint32(), t = this.pos, n = this.pos + e;
      if (n > this.len)
        throw wc(this, e);
      return this.pos += e, Array.isArray(this.buf) ? this.buf.slice(t, n) : t === n ? new this.buf.constructor(0) : this._slice.call(this.buf, t, n);
    }, ib.prototype.string = function() {
      var e = this.bytes();
      return sC.read(e, 0, e.length);
    }, ib.prototype.skip = function(e) {
      if (typeof e == "number") {
        if (this.pos + e > this.len)
          throw wc(this, e);
        this.pos += e;
      } else
        do
          if (this.pos >= this.len)
            throw wc(this);
        while (128 & this.buf[this.pos++]);
      return this;
    }, ib.prototype.skipType = function(e) {
      switch (e) {
        case 0:
          this.skip();
          break;
        case 1:
          this.skip(8);
          break;
        case 2:
          this.skip(this.uint32());
          break;
        case 3:
          for (; (e = 7 & this.uint32()) != 4; )
            this.skipType(e);
          break;
        case 5:
          this.skip(4);
          break;
        default:
          throw Error("invalid wire type " + e + " at offset " + this.pos);
      }
      return this;
    }, ib._configure = function(e) {
      Ql = e, ib.create = us(), Ql._configure();
      var t = pa.Long ? "toLong" : "toNumber";
      pa.merge(ib.prototype, { int64: function() {
        return rj.call(this)[t](!1);
      }, uint64: function() {
        return rj.call(this)[t](!0);
      }, sint64: function() {
        return rj.call(this).zzDecode()[t](!1);
      }, fixed64: function() {
        return Ln.call(this)[t](!0);
      }, sfixed64: function() {
        return Ln.call(this)[t](!1);
      } });
    }, (be.prototype = Object.create(sj.prototype)).constructor = be, be._configure = function() {
      pa.Buffer && (be.prototype._slice = pa.Buffer.prototype.slice);
    }, be.prototype.string = function() {
      var e = this.uint32();
      return this.buf.utf8Slice ? this.buf.utf8Slice(this.pos, this.pos = Math.min(this.pos + e, this.len)) : this.buf.toString("utf-8", this.pos, this.pos = Math.min(this.pos + e, this.len));
    }, be._configure(), (Xf.prototype = Object.create(pa.EventEmitter.prototype)).constructor = Xf, Xf.prototype.rpcCall = function e(t, n, r, o, i) {
      if (!o)
        throw TypeError("request must be specified");
      var s = this;
      if (!i)
        return pa.asPromise(e, s, t, n, r, o);
      if (s.rpcImpl)
        try {
          return s.rpcImpl(t, n[s.requestDelimited ? "encodeDelimited" : "encode"](o).finish(), function(u, a) {
            if (u)
              return s.emit("error", u, t), i(u);
            if (a !== null) {
              if (!(a instanceof r))
                try {
                  a = r[s.responseDelimited ? "decodeDelimited" : "decode"](a);
                } catch (l) {
                  return s.emit("error", l, t), i(l);
                }
              return s.emit("data", a, t), i(null, a);
            }
            s.end(!0);
          });
        } catch (u) {
          s.emit("error", u, t), setTimeout(function() {
            i(u);
          }, 0);
        }
      else
        setTimeout(function() {
          i(Error("already ended"));
        }, 0);
    }, Xf.prototype.end = function(e) {
      return this.rpcImpl && (e || this.rpcImpl(null, null, null), this.rpcImpl = null, this.emit("end").off()), this;
    };
    var tC = xb(function(e, t) {
      t.Service = Xf;
    }), uC = {}, Gc = xb(function(e, t) {
      function n() {
        r.util._configure(), r.Writer._configure(r.BufferWriter), r.Reader._configure(r.BufferReader);
      }
      var r = t;
      r.build = "minimal", r.Writer = qj, r.BufferWriter = Lc, r.Reader = sj, r.BufferReader = be, r.util = pa, r.rpc = tC, r.roots = uC, r.configure = n, n();
    });
    Gc.util.Long = P, Gc.configure();
    var M = Gc.Reader, ia = Gc.Writer, D = Gc.util, I = Gc.roots.default || (Gc.roots.default = {}), vC = I.URI = function() {
      var e = {}, t = Object.create(e);
      return t[e[0] = "Unknown"] = 0, t[e[1] = "PingUri"] = 1, t[e[2] = "PongUri"] = 2, t[e[11] = "UserJoinUri"] = 11, t[e[12] = "UserRespUri"] = 12, t[e[15] = "UserTicketNearlyExpireUri"] = 15, t[e[16] = "UserRenewTokenReqUri"] = 16, t[e[17] = "UserRenewTokenRespUri"] = 17, t[e[21] = "UserQuitUri"] = 21, t[e[22] = "UserDropUri"] = 22, t[e[31] = "GroupEnterUri"] = 31, t[e[32] = "GroupLeaveUri"] = 32, t[e[33] = "GroupReplyUri"] = 33, t[e[35] = "GroupDropUri"] = 35, t[e[36] = "GroupEnterNoticeUri"] = 36, t[e[37] = "GroupLeaveNoticeUri"] = 37, t[e[38] = "GroupEventNoticeUri"] = 38, t[e[39] = "GroupCountNoticeUri"] = 39, t[e[41] = "UserStatusListUri"] = 41, t[e[42] = "UserStatusResultUri"] = 42, t[e[51] = "GroupStatusListUri"] = 51, t[e[52] = "GroupStatusResultUri"] = 52, t[e[55] = "GroupAllUsersListUri"] = 55, t[e[56] = "GroupAllUsersResultUri"] = 56, t[e[100] = "MessageUri"] = 100, t[e[101] = "AckUri"] = 101, t[e[201] = "UserJoinNoticeUri"] = 201, t[e[202] = "UserQuitNoticeUri"] = 202, t[e[203] = "UserWaitNoticeUri"] = 203, t[e[301] = "UserAttributeGetUri"] = 301, t[e[302] = "UserAttributeRetUri"] = 302, t[e[303] = "UserAttributeSetUri"] = 303, t[e[304] = "UserAttributeModUri"] = 304, t[e[305] = "UserAttributeDelUri"] = 305, t[e[307] = "UserAttributeRspUri"] = 307, t[e[308] = "UserAttributeErrUri"] = 308, t[e[311] = "UserAttributeKeysGetUri"] = 311, t[e[312] = "UserAttributeKeysRetUri"] = 312, t[e[351] = "GroupAttributeGetUri"] = 351, t[e[352] = "GroupAttributeRetUri"] = 352, t[e[353] = "GroupAttributeSetUri"] = 353, t[e[354] = "GroupAttributeModUri"] = 354, t[e[355] = "GroupAttributeDelUri"] = 355, t[e[356] = "GroupAttributeAltUri"] = 356, t[e[357] = "GroupAttributeRspUri"] = 357, t[e[358] = "GroupAttributeErrUri"] = 358, t[e[361] = "GroupAttributeKeysGetUri"] = 361, t[e[362] = "GroupAttributeKeysRetUri"] = 362, t[e[401] = "SubscribeUserStatusUri"] = 401, t[e[402] = "UnsubscribeUserStatusUri"] = 402, t[e[499] = "SubscribeResponseUri"] = 499, t;
    }(), wi = I.Wrapper = function() {
      function e(t) {
        if (t)
          for (var n = Object.keys(t), r = 0; r < n.length; ++r)
            t[n[r]] != null && (this[n[r]] = t[n[r]]);
      }
      return e.prototype.uri = 0, e.prototype.data = D.newBuffer([]), e.encode = function(t, n) {
        return n || (n = ia.create()), t.uri != null && Object.hasOwnProperty.call(t, "uri") && n.uint32(8).int32(t.uri), t.data != null && Object.hasOwnProperty.call(t, "data") && n.uint32(18).bytes(t.data), n;
      }, e.decode = function(t, n) {
        t instanceof M || (t = M.create(t)), n = n === void 0 ? t.len : t.pos + n;
        for (var r = new I.Wrapper(); t.pos < n; ) {
          var o = t.uint32();
          switch (o >>> 3) {
            case 1:
              r.uri = t.int32();
              break;
            case 2:
              r.data = t.bytes();
              break;
            default:
              t.skipType(7 & o);
          }
        }
        return r;
      }, e;
    }(), wC = I.Ping = function() {
      function e(t) {
        if (t)
          for (var n = Object.keys(t), r = 0; r < n.length; ++r)
            t[n[r]] != null && (this[n[r]] = t[n[r]]);
      }
      return e.prototype.seq = D.Long ? D.Long.fromBits(0, 0, !0) : 0, e.prototype.ms = D.Long ? D.Long.fromBits(0, 0, !0) : 0, e.encode = function(t, n) {
        return n || (n = ia.create()), t.seq != null && Object.hasOwnProperty.call(t, "seq") && n.uint32(8).uint64(t.seq), t.ms != null && Object.hasOwnProperty.call(t, "ms") && n.uint32(16).uint64(t.ms), n;
      }, e.decode = function(t, n) {
        t instanceof M || (t = M.create(t)), n = n === void 0 ? t.len : t.pos + n;
        for (var r = new I.Ping(); t.pos < n; ) {
          var o = t.uint32();
          switch (o >>> 3) {
            case 1:
              r.seq = t.uint64();
              break;
            case 2:
              r.ms = t.uint64();
              break;
            default:
              t.skipType(7 & o);
          }
        }
        return r;
      }, e;
    }(), xC = I.Pong = function() {
      function e(t) {
        if (t)
          for (var n = Object.keys(t), r = 0; r < n.length; ++r)
            t[n[r]] != null && (this[n[r]] = t[n[r]]);
      }
      return e.prototype.seq = D.Long ? D.Long.fromBits(0, 0, !0) : 0, e.prototype.ms = D.Long ? D.Long.fromBits(0, 0, !0) : 0, e.encode = function(t, n) {
        return n || (n = ia.create()), t.seq != null && Object.hasOwnProperty.call(t, "seq") && n.uint32(8).uint64(t.seq), t.ms != null && Object.hasOwnProperty.call(t, "ms") && n.uint32(16).uint64(t.ms), n;
      }, e.decode = function(t, n) {
        t instanceof M || (t = M.create(t)), n = n === void 0 ? t.len : t.pos + n;
        for (var r = new I.Pong(); t.pos < n; ) {
          var o = t.uint32();
          switch (o >>> 3) {
            case 1:
              r.seq = t.uint64();
              break;
            case 2:
              r.ms = t.uint64();
              break;
            default:
              t.skipType(7 & o);
          }
        }
        return r;
      }, e;
    }(), yC = I.UserJoin = function() {
      function e(t) {
        if (t)
          for (var n = Object.keys(t), r = 0; r < n.length; ++r)
            t[n[r]] != null && (this[n[r]] = t[n[r]]);
      }
      return e.prototype.seq = D.Long ? D.Long.fromBits(0, 0, !0) : 0, e.prototype.opt = D.Long ? D.Long.fromBits(0, 0, !0) : 0, e.prototype.instance = D.Long ? D.Long.fromBits(0, 0, !0) : 0, e.prototype.account = "", e.prototype.ticket = "", e.encode = function(t, n) {
        return n || (n = ia.create()), t.seq != null && Object.hasOwnProperty.call(t, "seq") && n.uint32(8).uint64(t.seq), t.opt != null && Object.hasOwnProperty.call(t, "opt") && n.uint32(16).uint64(t.opt), t.instance != null && Object.hasOwnProperty.call(t, "instance") && n.uint32(24).uint64(t.instance), t.account != null && Object.hasOwnProperty.call(t, "account") && n.uint32(34).string(t.account), t.ticket != null && Object.hasOwnProperty.call(t, "ticket") && n.uint32(42).string(t.ticket), n;
      }, e.decode = function(t, n) {
        t instanceof M || (t = M.create(t)), n = n === void 0 ? t.len : t.pos + n;
        for (var r = new I.UserJoin(); t.pos < n; ) {
          var o = t.uint32();
          switch (o >>> 3) {
            case 1:
              r.seq = t.uint64();
              break;
            case 2:
              r.opt = t.uint64();
              break;
            case 3:
              r.instance = t.uint64();
              break;
            case 4:
              r.account = t.string();
              break;
            case 5:
              r.ticket = t.string();
              break;
            default:
              t.skipType(7 & o);
          }
        }
        return r;
      }, e;
    }(), zC = I.UserResp = function() {
      function e(t) {
        if (t)
          for (var n = Object.keys(t), r = 0; r < n.length; ++r)
            t[n[r]] != null && (this[n[r]] = t[n[r]]);
      }
      return e.prototype.seq = D.Long ? D.Long.fromBits(0, 0, !0) : 0, e.prototype.account = "", e.prototype.code = 0, e.encode = function(t, n) {
        return n || (n = ia.create()), t.seq != null && Object.hasOwnProperty.call(t, "seq") && n.uint32(8).uint64(t.seq), t.account != null && Object.hasOwnProperty.call(t, "account") && n.uint32(18).string(t.account), t.code != null && Object.hasOwnProperty.call(t, "code") && n.uint32(24).uint32(t.code), n;
      }, e.decode = function(t, n) {
        t instanceof M || (t = M.create(t)), n = n === void 0 ? t.len : t.pos + n;
        for (var r = new I.UserResp(); t.pos < n; ) {
          var o = t.uint32();
          switch (o >>> 3) {
            case 1:
              r.seq = t.uint64();
              break;
            case 2:
              r.account = t.string();
              break;
            case 3:
              r.code = t.uint32();
              break;
            default:
              t.skipType(7 & o);
          }
        }
        return r;
      }, e;
    }(), AC = I.UserQuit = function() {
      function e(t) {
        if (t)
          for (var n = Object.keys(t), r = 0; r < n.length; ++r)
            t[n[r]] != null && (this[n[r]] = t[n[r]]);
      }
      return e.encode = function(t, n) {
        return n || (n = ia.create()), n;
      }, e.decode = function(t, n) {
        t instanceof M || (t = M.create(t)), n = n === void 0 ? t.len : t.pos + n;
        for (var r = new I.UserQuit(); t.pos < n; ) {
          var o = t.uint32();
          t.skipType(7 & o);
        }
        return r;
      }, e;
    }(), BC = I.UserDrop = function() {
      function e(t) {
        if (t)
          for (var n = Object.keys(t), r = 0; r < n.length; ++r)
            t[n[r]] != null && (this[n[r]] = t[n[r]]);
      }
      return e.prototype.code = 0, e.encode = function(t, n) {
        return n || (n = ia.create()), t.code != null && Object.hasOwnProperty.call(t, "code") && n.uint32(8).uint32(t.code), n;
      }, e.decode = function(t, n) {
        t instanceof M || (t = M.create(t)), n = n === void 0 ? t.len : t.pos + n;
        for (var r = new I.UserDrop(); t.pos < n; ) {
          var o = t.uint32();
          switch (o >>> 3) {
            case 1:
              r.code = t.uint32();
              break;
            default:
              t.skipType(7 & o);
          }
        }
        return r;
      }, e;
    }(), CC = I.UserTicketNearlyExpire = function() {
      function e(t) {
        if (t)
          for (var n = Object.keys(t), r = 0; r < n.length; ++r)
            t[n[r]] != null && (this[n[r]] = t[n[r]]);
      }
      return e.prototype.expireTs = D.Long ? D.Long.fromBits(0, 0, !0) : 0, e.prototype.ticket = "", e.encode = function(t, n) {
        return n || (n = ia.create()), t.expireTs != null && Object.hasOwnProperty.call(t, "expireTs") && n.uint32(8).uint64(t.expireTs), t.ticket != null && Object.hasOwnProperty.call(t, "ticket") && n.uint32(18).string(t.ticket), n;
      }, e.decode = function(t, n) {
        t instanceof M || (t = M.create(t)), n = n === void 0 ? t.len : t.pos + n;
        for (var r = new I.UserTicketNearlyExpire(); t.pos < n; ) {
          var o = t.uint32();
          switch (o >>> 3) {
            case 1:
              r.expireTs = t.uint64();
              break;
            case 2:
              r.ticket = t.string();
              break;
            default:
              t.skipType(7 & o);
          }
        }
        return r;
      }, e;
    }(), DC = I.UserRenewTokenReq = function() {
      function e(t) {
        if (t)
          for (var n = Object.keys(t), r = 0; r < n.length; ++r)
            t[n[r]] != null && (this[n[r]] = t[n[r]]);
      }
      return e.prototype.instance = D.Long ? D.Long.fromBits(0, 0, !0) : 0, e.prototype.seq = D.Long ? D.Long.fromBits(0, 0, !0) : 0, e.prototype.account = "", e.prototype.ticket = "", e.encode = function(t, n) {
        return n || (n = ia.create()), t.instance != null && Object.hasOwnProperty.call(t, "instance") && n.uint32(8).uint64(t.instance), t.seq != null && Object.hasOwnProperty.call(t, "seq") && n.uint32(16).uint64(t.seq), t.account != null && Object.hasOwnProperty.call(t, "account") && n.uint32(26).string(t.account), t.ticket != null && Object.hasOwnProperty.call(t, "ticket") && n.uint32(34).string(t.ticket), n;
      }, e.decode = function(t, n) {
        t instanceof M || (t = M.create(t)), n = n === void 0 ? t.len : t.pos + n;
        for (var r = new I.UserRenewTokenReq(); t.pos < n; ) {
          var o = t.uint32();
          switch (o >>> 3) {
            case 1:
              r.instance = t.uint64();
              break;
            case 2:
              r.seq = t.uint64();
              break;
            case 3:
              r.account = t.string();
              break;
            case 4:
              r.ticket = t.string();
              break;
            default:
              t.skipType(7 & o);
          }
        }
        return r;
      }, e;
    }(), EC = I.UserRenewTokenResp = function() {
      function e(t) {
        if (t)
          for (var n = Object.keys(t), r = 0; r < n.length; ++r)
            t[n[r]] != null && (this[n[r]] = t[n[r]]);
      }
      return e.prototype.seq = D.Long ? D.Long.fromBits(0, 0, !0) : 0, e.prototype.code = 0, e.encode = function(t, n) {
        return n || (n = ia.create()), t.seq != null && Object.hasOwnProperty.call(t, "seq") && n.uint32(8).uint64(t.seq), t.code != null && Object.hasOwnProperty.call(t, "code") && n.uint32(16).uint32(t.code), n;
      }, e.decode = function(t, n) {
        t instanceof M || (t = M.create(t)), n = n === void 0 ? t.len : t.pos + n;
        for (var r = new I.UserRenewTokenResp(); t.pos < n; ) {
          var o = t.uint32();
          switch (o >>> 3) {
            case 1:
              r.seq = t.uint64();
              break;
            case 2:
              r.code = t.uint32();
              break;
            default:
              t.skipType(7 & o);
          }
        }
        return r;
      }, e;
    }(), FC = I.GroupEnter = function() {
      function e(t) {
        if (t)
          for (var n = Object.keys(t), r = 0; r < n.length; ++r)
            t[n[r]] != null && (this[n[r]] = t[n[r]]);
      }
      return e.prototype.seq = D.Long ? D.Long.fromBits(0, 0, !0) : 0, e.prototype.account = "", e.encode = function(t, n) {
        return n || (n = ia.create()), t.seq != null && Object.hasOwnProperty.call(t, "seq") && n.uint32(8).uint64(t.seq), t.account != null && Object.hasOwnProperty.call(t, "account") && n.uint32(18).string(t.account), n;
      }, e.decode = function(t, n) {
        t instanceof M || (t = M.create(t)), n = n === void 0 ? t.len : t.pos + n;
        for (var r = new I.GroupEnter(); t.pos < n; ) {
          var o = t.uint32();
          switch (o >>> 3) {
            case 1:
              r.seq = t.uint64();
              break;
            case 2:
              r.account = t.string();
              break;
            default:
              t.skipType(7 & o);
          }
        }
        return r;
      }, e;
    }(), GC = I.GroupLeave = function() {
      function e(t) {
        if (t)
          for (var n = Object.keys(t), r = 0; r < n.length; ++r)
            t[n[r]] != null && (this[n[r]] = t[n[r]]);
      }
      return e.prototype.account = "", e.encode = function(t, n) {
        return n || (n = ia.create()), t.account != null && Object.hasOwnProperty.call(t, "account") && n.uint32(10).string(t.account), n;
      }, e.decode = function(t, n) {
        t instanceof M || (t = M.create(t)), n = n === void 0 ? t.len : t.pos + n;
        for (var r = new I.GroupLeave(); t.pos < n; ) {
          var o = t.uint32();
          switch (o >>> 3) {
            case 1:
              r.account = t.string();
              break;
            default:
              t.skipType(7 & o);
          }
        }
        return r;
      }, e;
    }(), HC = I.GroupReply = function() {
      function e(t) {
        if (t)
          for (var n = Object.keys(t), r = 0; r < n.length; ++r)
            t[n[r]] != null && (this[n[r]] = t[n[r]]);
      }
      return e.prototype.seq = D.Long ? D.Long.fromBits(0, 0, !0) : 0, e.prototype.account = "", e.prototype.code = 0, e.encode = function(t, n) {
        return n || (n = ia.create()), t.seq != null && Object.hasOwnProperty.call(t, "seq") && n.uint32(8).uint64(t.seq), t.account != null && Object.hasOwnProperty.call(t, "account") && n.uint32(18).string(t.account), t.code != null && Object.hasOwnProperty.call(t, "code") && n.uint32(24).uint32(t.code), n;
      }, e.decode = function(t, n) {
        t instanceof M || (t = M.create(t)), n = n === void 0 ? t.len : t.pos + n;
        for (var r = new I.GroupReply(); t.pos < n; ) {
          var o = t.uint32();
          switch (o >>> 3) {
            case 1:
              r.seq = t.uint64();
              break;
            case 2:
              r.account = t.string();
              break;
            case 3:
              r.code = t.uint32();
              break;
            default:
              t.skipType(7 & o);
          }
        }
        return r;
      }, e;
    }(), vs = I.GroupLeaveNotice = function() {
      function e(t) {
        if (t)
          for (var n = Object.keys(t), r = 0; r < n.length; ++r)
            t[n[r]] != null && (this[n[r]] = t[n[r]]);
      }
      return e.prototype.seq = D.Long ? D.Long.fromBits(0, 0, !0) : 0, e.prototype.user = "", e.prototype.group = "", e.prototype.instance = D.Long ? D.Long.fromBits(0, 0, !0) : 0, e.prototype.size = 0, e.encode = function(t, n) {
        return n || (n = ia.create()), t.seq != null && Object.hasOwnProperty.call(t, "seq") && n.uint32(8).uint64(t.seq), t.user != null && Object.hasOwnProperty.call(t, "user") && n.uint32(18).string(t.user), t.group != null && Object.hasOwnProperty.call(t, "group") && n.uint32(26).string(t.group), t.instance != null && Object.hasOwnProperty.call(t, "instance") && n.uint32(32).uint64(t.instance), t.size != null && Object.hasOwnProperty.call(t, "size") && n.uint32(40).uint32(t.size), n;
      }, e.decode = function(t, n) {
        t instanceof M || (t = M.create(t)), n = n === void 0 ? t.len : t.pos + n;
        for (var r = new I.GroupLeaveNotice(); t.pos < n; ) {
          var o = t.uint32();
          switch (o >>> 3) {
            case 1:
              r.seq = t.uint64();
              break;
            case 2:
              r.user = t.string();
              break;
            case 3:
              r.group = t.string();
              break;
            case 4:
              r.instance = t.uint64();
              break;
            case 5:
              r.size = t.uint32();
              break;
            default:
              t.skipType(7 & o);
          }
        }
        return r;
      }, e;
    }(), ws = I.GroupEnterNotice = function() {
      function e(t) {
        if (t)
          for (var n = Object.keys(t), r = 0; r < n.length; ++r)
            t[n[r]] != null && (this[n[r]] = t[n[r]]);
      }
      return e.prototype.seq = D.Long ? D.Long.fromBits(0, 0, !0) : 0, e.prototype.user = "", e.prototype.group = "", e.prototype.instance = D.Long ? D.Long.fromBits(0, 0, !0) : 0, e.prototype.size = 0, e.encode = function(t, n) {
        return n || (n = ia.create()), t.seq != null && Object.hasOwnProperty.call(t, "seq") && n.uint32(8).uint64(t.seq), t.user != null && Object.hasOwnProperty.call(t, "user") && n.uint32(18).string(t.user), t.group != null && Object.hasOwnProperty.call(t, "group") && n.uint32(26).string(t.group), t.instance != null && Object.hasOwnProperty.call(t, "instance") && n.uint32(32).uint64(t.instance), t.size != null && Object.hasOwnProperty.call(t, "size") && n.uint32(40).uint32(t.size), n;
      }, e.decode = function(t, n) {
        t instanceof M || (t = M.create(t)), n = n === void 0 ? t.len : t.pos + n;
        for (var r = new I.GroupEnterNotice(); t.pos < n; ) {
          var o = t.uint32();
          switch (o >>> 3) {
            case 1:
              r.seq = t.uint64();
              break;
            case 2:
              r.user = t.string();
              break;
            case 3:
              r.group = t.string();
              break;
            case 4:
              r.instance = t.uint64();
              break;
            case 5:
              r.size = t.uint32();
              break;
            default:
              t.skipType(7 & o);
          }
        }
        return r;
      }, e;
    }(), xs = I.Message = function() {
      function e(t) {
        if (this.MiscMap = {}, t)
          for (var n = Object.keys(t), r = 0; r < n.length; ++r)
            t[n[r]] != null && (this[n[r]] = t[n[r]]);
      }
      return e.prototype.instance = D.Long ? D.Long.fromBits(0, 0, !0) : 0, e.prototype.dialogue = D.Long ? D.Long.fromBits(0, 0, !0) : 0, e.prototype.sequence = D.Long ? D.Long.fromBits(0, 0, !0) : 0, e.prototype.options = D.Long ? D.Long.fromBits(0, 0, !0) : 0, e.prototype.src = "", e.prototype.dst = "", e.prototype.payload = D.newBuffer([]), e.prototype.MiscMap = D.emptyObject, e.prototype.ms = D.Long ? D.Long.fromBits(0, 0, !0) : 0, e.encode = function(t, n) {
        if (n || (n = ia.create()), t.instance != null && Object.hasOwnProperty.call(t, "instance") && n.uint32(8).uint64(t.instance), t.dialogue != null && Object.hasOwnProperty.call(t, "dialogue") && n.uint32(16).uint64(t.dialogue), t.sequence != null && Object.hasOwnProperty.call(t, "sequence") && n.uint32(24).uint64(t.sequence), t.options != null && Object.hasOwnProperty.call(t, "options") && n.uint32(32).uint64(t.options), t.src != null && Object.hasOwnProperty.call(t, "src") && n.uint32(42).string(t.src), t.dst != null && Object.hasOwnProperty.call(t, "dst") && n.uint32(50).string(t.dst), t.payload != null && Object.hasOwnProperty.call(t, "payload") && n.uint32(58).bytes(t.payload), t.MiscMap != null && Object.hasOwnProperty.call(t, "MiscMap"))
          for (var r = Object.keys(t.MiscMap), o = 0; o < r.length; ++o)
            n.uint32(66).fork().uint32(10).string(r[o]).uint32(18).bytes(t.MiscMap[r[o]]).ldelim();
        return t.ms != null && Object.hasOwnProperty.call(t, "ms") && n.uint32(72).uint64(t.ms), n;
      }, e.decode = function(t, n) {
        t instanceof M || (t = M.create(t)), n = n === void 0 ? t.len : t.pos + n;
        for (var r, o, i = new I.Message(); t.pos < n; )
          switch (r = t.uint32(), r >>> 3) {
            case 1:
              i.instance = t.uint64();
              break;
            case 2:
              i.dialogue = t.uint64();
              break;
            case 3:
              i.sequence = t.uint64();
              break;
            case 4:
              i.options = t.uint64();
              break;
            case 5:
              i.src = t.string();
              break;
            case 6:
              i.dst = t.string();
              break;
            case 7:
              i.payload = t.bytes();
              break;
            case 8:
              i.MiscMap === D.emptyObject && (i.MiscMap = {});
              var s = t.uint32() + t.pos;
              for (r = "", o = []; t.pos < s; ) {
                var u = t.uint32();
                switch (u >>> 3) {
                  case 1:
                    r = t.string();
                    break;
                  case 2:
                    o = t.bytes();
                    break;
                  default:
                    t.skipType(7 & u);
                }
              }
              i.MiscMap[r] = o;
              break;
            case 9:
              i.ms = t.uint64();
              break;
            default:
              t.skipType(7 & r);
          }
        return i;
      }, e;
    }(), ys = I.Ack = function() {
      function e(t) {
        if (t)
          for (var n = Object.keys(t), r = 0; r < n.length; ++r)
            t[n[r]] != null && (this[n[r]] = t[n[r]]);
      }
      return e.prototype.instance = D.Long ? D.Long.fromBits(0, 0, !0) : 0, e.prototype.dialogue = D.Long ? D.Long.fromBits(0, 0, !0) : 0, e.prototype.sequence = D.Long ? D.Long.fromBits(0, 0, !0) : 0, e.prototype.code = 0, e.encode = function(t, n) {
        return n || (n = ia.create()), t.instance != null && Object.hasOwnProperty.call(t, "instance") && n.uint32(8).uint64(t.instance), t.dialogue != null && Object.hasOwnProperty.call(t, "dialogue") && n.uint32(16).uint64(t.dialogue), t.sequence != null && Object.hasOwnProperty.call(t, "sequence") && n.uint32(24).uint64(t.sequence), t.code != null && Object.hasOwnProperty.call(t, "code") && n.uint32(32).uint32(t.code), n;
      }, e.decode = function(t, n) {
        t instanceof M || (t = M.create(t)), n = n === void 0 ? t.len : t.pos + n;
        for (var r = new I.Ack(); t.pos < n; ) {
          var o = t.uint32();
          switch (o >>> 3) {
            case 1:
              r.instance = t.uint64();
              break;
            case 2:
              r.dialogue = t.uint64();
              break;
            case 3:
              r.sequence = t.uint64();
              break;
            case 4:
              r.code = t.uint32();
              break;
            default:
              t.skipType(7 & o);
          }
        }
        return r;
      }, e;
    }(), IC = I.GroupDrop = function() {
      function e(t) {
        if (t)
          for (var n = Object.keys(t), r = 0; r < n.length; ++r)
            t[n[r]] != null && (this[n[r]] = t[n[r]]);
      }
      return e.prototype.account = "", e.prototype.code = 0, e.encode = function(t, n) {
        return n || (n = ia.create()), t.account != null && Object.hasOwnProperty.call(t, "account") && n.uint32(10).string(t.account), t.code != null && Object.hasOwnProperty.call(t, "code") && n.uint32(16).uint32(t.code), n;
      }, e.decode = function(t, n) {
        t instanceof M || (t = M.create(t)), n = n === void 0 ? t.len : t.pos + n;
        for (var r = new I.GroupDrop(); t.pos < n; ) {
          var o = t.uint32();
          switch (o >>> 3) {
            case 1:
              r.account = t.string();
              break;
            case 2:
              r.code = t.uint32();
              break;
            default:
              t.skipType(7 & o);
          }
        }
        return r;
      }, e;
    }(), JC = I.GroupAllUsersList = function() {
      function e(t) {
        if (t)
          for (var n = Object.keys(t), r = 0; r < n.length; ++r)
            t[n[r]] != null && (this[n[r]] = t[n[r]]);
      }
      return e.prototype.seq = D.Long ? D.Long.fromBits(0, 0, !0) : 0, e.prototype.group = "", e.prototype.pageSize = 0, e.prototype.pageNumber = 0, e.encode = function(t, n) {
        return n || (n = ia.create()), t.seq != null && Object.hasOwnProperty.call(t, "seq") && n.uint32(8).uint64(t.seq), t.group != null && Object.hasOwnProperty.call(t, "group") && n.uint32(18).string(t.group), t.pageSize != null && Object.hasOwnProperty.call(t, "pageSize") && n.uint32(24).uint32(t.pageSize), t.pageNumber != null && Object.hasOwnProperty.call(t, "pageNumber") && n.uint32(32).uint32(t.pageNumber), n;
      }, e.decode = function(t, n) {
        t instanceof M || (t = M.create(t)), n = n === void 0 ? t.len : t.pos + n;
        for (var r = new I.GroupAllUsersList(); t.pos < n; ) {
          var o = t.uint32();
          switch (o >>> 3) {
            case 1:
              r.seq = t.uint64();
              break;
            case 2:
              r.group = t.string();
              break;
            case 3:
              r.pageSize = t.uint32();
              break;
            case 4:
              r.pageNumber = t.uint32();
              break;
            default:
              t.skipType(7 & o);
          }
        }
        return r;
      }, e;
    }(), KC = I.GroupAllUsersResult = function() {
      function e(t) {
        if (this.memberInfos = [], t)
          for (var n = Object.keys(t), r = 0; r < n.length; ++r)
            t[n[r]] != null && (this[n[r]] = t[n[r]]);
      }
      return e.prototype.seq = D.Long ? D.Long.fromBits(0, 0, !0) : 0, e.prototype.group = "", e.prototype.totalSize = 0, e.prototype.pageSize = 0, e.prototype.pageNumber = 0, e.prototype.memberInfos = D.emptyArray, e.encode = function(t, n) {
        if (n || (n = ia.create()), t.seq != null && Object.hasOwnProperty.call(t, "seq") && n.uint32(8).uint64(t.seq), t.group != null && Object.hasOwnProperty.call(t, "group") && n.uint32(18).string(t.group), t.totalSize != null && Object.hasOwnProperty.call(t, "totalSize") && n.uint32(24).uint32(t.totalSize), t.pageSize != null && Object.hasOwnProperty.call(t, "pageSize") && n.uint32(32).uint32(t.pageSize), t.pageNumber != null && Object.hasOwnProperty.call(t, "pageNumber") && n.uint32(40).uint32(t.pageNumber), t.memberInfos != null && t.memberInfos.length)
          for (var r = 0; r < t.memberInfos.length; ++r)
            I.GroupAllUsersResult.MemberInfo.encode(t.memberInfos[r], n.uint32(50).fork()).ldelim();
        return n;
      }, e.decode = function(t, n) {
        t instanceof M || (t = M.create(t)), n = n === void 0 ? t.len : t.pos + n;
        for (var r = new I.GroupAllUsersResult(); t.pos < n; ) {
          var o = t.uint32();
          switch (o >>> 3) {
            case 1:
              r.seq = t.uint64();
              break;
            case 2:
              r.group = t.string();
              break;
            case 3:
              r.totalSize = t.uint32();
              break;
            case 4:
              r.pageSize = t.uint32();
              break;
            case 5:
              r.pageNumber = t.uint32();
              break;
            case 6:
              r.memberInfos && r.memberInfos.length || (r.memberInfos = []), r.memberInfos.push(I.GroupAllUsersResult.MemberInfo.decode(t, t.uint32()));
              break;
            default:
              t.skipType(7 & o);
          }
        }
        return r;
      }, e.MemberInfo = function() {
        function t(n) {
          if (n)
            for (var r = Object.keys(n), o = 0; o < r.length; ++o)
              n[r[o]] != null && (this[r[o]] = n[r[o]]);
        }
        return t.prototype.account = "", t.prototype.ts = 0, t.encode = function(n, r) {
          return r || (r = ia.create()), n.account != null && Object.hasOwnProperty.call(n, "account") && r.uint32(10).string(n.account), n.ts != null && Object.hasOwnProperty.call(n, "ts") && r.uint32(16).uint32(n.ts), r;
        }, t.decode = function(n, r) {
          n instanceof M || (n = M.create(n)), r = r === void 0 ? n.len : n.pos + r;
          for (var o = new I.GroupAllUsersResult.MemberInfo(); n.pos < r; ) {
            var i = n.uint32();
            switch (i >>> 3) {
              case 1:
                o.account = n.string();
                break;
              case 2:
                o.ts = n.uint32();
                break;
              default:
                n.skipType(7 & i);
            }
          }
          return o;
        }, t;
      }(), e;
    }(), LC = I.UserStatusList = function() {
      function e(t) {
        if (this.users = [], t)
          for (var n = Object.keys(t), r = 0; r < n.length; ++r)
            t[n[r]] != null && (this[n[r]] = t[n[r]]);
      }
      return e.prototype.seq = D.Long ? D.Long.fromBits(0, 0, !0) : 0, e.prototype.users = D.emptyArray, e.encode = function(t, n) {
        if (n || (n = ia.create()), t.seq != null && Object.hasOwnProperty.call(t, "seq") && n.uint32(8).uint64(t.seq), t.users != null && t.users.length)
          for (var r = 0; r < t.users.length; ++r)
            n.uint32(18).string(t.users[r]);
        return n;
      }, e.decode = function(t, n) {
        t instanceof M || (t = M.create(t)), n = n === void 0 ? t.len : t.pos + n;
        for (var r = new I.UserStatusList(); t.pos < n; ) {
          var o = t.uint32();
          switch (o >>> 3) {
            case 1:
              r.seq = t.uint64();
              break;
            case 2:
              r.users && r.users.length || (r.users = []), r.users.push(t.string());
              break;
            default:
              t.skipType(7 & o);
          }
        }
        return r;
      }, e;
    }(), MC = I.UserStatusResult = function() {
      function e(t) {
        if (this.userInfos = [], t)
          for (var n = Object.keys(t), r = 0; r < n.length; ++r)
            t[n[r]] != null && (this[n[r]] = t[n[r]]);
      }
      return e.prototype.seq = D.Long ? D.Long.fromBits(0, 0, !0) : 0, e.prototype.userInfos = D.emptyArray, e.encode = function(t, n) {
        if (n || (n = ia.create()), t.seq != null && Object.hasOwnProperty.call(t, "seq") && n.uint32(8).uint64(t.seq), t.userInfos != null && t.userInfos.length)
          for (var r = 0; r < t.userInfos.length; ++r)
            I.UserStatusResult.UserStatusInfo.encode(t.userInfos[r], n.uint32(18).fork()).ldelim();
        return n;
      }, e.decode = function(t, n) {
        t instanceof M || (t = M.create(t)), n = n === void 0 ? t.len : t.pos + n;
        for (var r = new I.UserStatusResult(); t.pos < n; ) {
          var o = t.uint32();
          switch (o >>> 3) {
            case 1:
              r.seq = t.uint64();
              break;
            case 2:
              r.userInfos && r.userInfos.length || (r.userInfos = []), r.userInfos.push(I.UserStatusResult.UserStatusInfo.decode(t, t.uint32()));
              break;
            default:
              t.skipType(7 & o);
          }
        }
        return r;
      }, e.UserStatusInfo = function() {
        function t(n) {
          if (n)
            for (var r = Object.keys(n), o = 0; o < r.length; ++o)
              n[r[o]] != null && (this[r[o]] = n[r[o]]);
        }
        return t.prototype.account = "", t.prototype.ts = 0, t.encode = function(n, r) {
          return r || (r = ia.create()), n.account != null && Object.hasOwnProperty.call(n, "account") && r.uint32(10).string(n.account), n.ts != null && Object.hasOwnProperty.call(n, "ts") && r.uint32(16).uint32(n.ts), r;
        }, t.decode = function(n, r) {
          n instanceof M || (n = M.create(n)), r = r === void 0 ? n.len : n.pos + r;
          for (var o = new I.UserStatusResult.UserStatusInfo(); n.pos < r; ) {
            var i = n.uint32();
            switch (i >>> 3) {
              case 1:
                o.account = n.string();
                break;
              case 2:
                o.ts = n.uint32();
                break;
              default:
                n.skipType(7 & i);
            }
          }
          return o;
        }, t;
      }(), e;
    }(), NC = I.UserAttributeGet = function() {
      function e(t) {
        if (this.attributes = [], t)
          for (var n = Object.keys(t), r = 0; r < n.length; ++r)
            t[n[r]] != null && (this[n[r]] = t[n[r]]);
      }
      return e.prototype.seq = D.Long ? D.Long.fromBits(0, 0, !0) : 0, e.prototype.account = "", e.prototype.attributes = D.emptyArray, e.encode = function(t, n) {
        if (n || (n = ia.create()), t.seq != null && Object.hasOwnProperty.call(t, "seq") && n.uint32(8).uint64(t.seq), t.account != null && Object.hasOwnProperty.call(t, "account") && n.uint32(18).string(t.account), t.attributes != null && t.attributes.length)
          for (var r = 0; r < t.attributes.length; ++r)
            n.uint32(26).string(t.attributes[r]);
        return n;
      }, e.decode = function(t, n) {
        t instanceof M || (t = M.create(t)), n = n === void 0 ? t.len : t.pos + n;
        for (var r = new I.UserAttributeGet(); t.pos < n; ) {
          var o = t.uint32();
          switch (o >>> 3) {
            case 1:
              r.seq = t.uint64();
              break;
            case 2:
              r.account = t.string();
              break;
            case 3:
              r.attributes && r.attributes.length || (r.attributes = []), r.attributes.push(t.string());
              break;
            default:
              t.skipType(7 & o);
          }
        }
        return r;
      }, e;
    }(), OC = I.UserAttributeRet = function() {
      function e(t) {
        if (this.attributeInfos = [], t)
          for (var n = Object.keys(t), r = 0; r < n.length; ++r)
            t[n[r]] != null && (this[n[r]] = t[n[r]]);
      }
      return e.prototype.seq = D.Long ? D.Long.fromBits(0, 0, !0) : 0, e.prototype.attributeInfos = D.emptyArray, e.encode = function(t, n) {
        if (n || (n = ia.create()), t.seq != null && Object.hasOwnProperty.call(t, "seq") && n.uint32(8).uint64(t.seq), t.attributeInfos != null && t.attributeInfos.length)
          for (var r = 0; r < t.attributeInfos.length; ++r)
            I.UserAttributeRet.AttributeInfo.encode(t.attributeInfos[r], n.uint32(18).fork()).ldelim();
        return n;
      }, e.decode = function(t, n) {
        t instanceof M || (t = M.create(t)), n = n === void 0 ? t.len : t.pos + n;
        for (var r = new I.UserAttributeRet(); t.pos < n; ) {
          var o = t.uint32();
          switch (o >>> 3) {
            case 1:
              r.seq = t.uint64();
              break;
            case 2:
              r.attributeInfos && r.attributeInfos.length || (r.attributeInfos = []), r.attributeInfos.push(I.UserAttributeRet.AttributeInfo.decode(t, t.uint32()));
              break;
            default:
              t.skipType(7 & o);
          }
        }
        return r;
      }, e.AttributeInfo = function() {
        function t(n) {
          if (n)
            for (var r = Object.keys(n), o = 0; o < r.length; ++o)
              n[r[o]] != null && (this[r[o]] = n[r[o]]);
        }
        return t.prototype.key = "", t.prototype.value = "", t.encode = function(n, r) {
          return r || (r = ia.create()), n.key != null && Object.hasOwnProperty.call(n, "key") && r.uint32(10).string(n.key), n.value != null && Object.hasOwnProperty.call(n, "value") && r.uint32(18).string(n.value), r;
        }, t.decode = function(n, r) {
          n instanceof M || (n = M.create(n)), r = r === void 0 ? n.len : n.pos + r;
          for (var o = new I.UserAttributeRet.AttributeInfo(); n.pos < r; ) {
            var i = n.uint32();
            switch (i >>> 3) {
              case 1:
                o.key = n.string();
                break;
              case 2:
                o.value = n.string();
                break;
              default:
                n.skipType(7 & i);
            }
          }
          return o;
        }, t;
      }(), e;
    }(), PC = I.UserAttributeSet = function() {
      function e(t) {
        if (this.attributeInfos = [], t)
          for (var n = Object.keys(t), r = 0; r < n.length; ++r)
            t[n[r]] != null && (this[n[r]] = t[n[r]]);
      }
      return e.prototype.seq = D.Long ? D.Long.fromBits(0, 0, !0) : 0, e.prototype.account = "", e.prototype.attributeInfos = D.emptyArray, e.encode = function(t, n) {
        if (n || (n = ia.create()), t.seq != null && Object.hasOwnProperty.call(t, "seq") && n.uint32(8).uint64(t.seq), t.account != null && Object.hasOwnProperty.call(t, "account") && n.uint32(18).string(t.account), t.attributeInfos != null && t.attributeInfos.length)
          for (var r = 0; r < t.attributeInfos.length; ++r)
            I.UserAttributeSet.AttributeInfo.encode(t.attributeInfos[r], n.uint32(26).fork()).ldelim();
        return n;
      }, e.decode = function(t, n) {
        t instanceof M || (t = M.create(t)), n = n === void 0 ? t.len : t.pos + n;
        for (var r = new I.UserAttributeSet(); t.pos < n; ) {
          var o = t.uint32();
          switch (o >>> 3) {
            case 1:
              r.seq = t.uint64();
              break;
            case 2:
              r.account = t.string();
              break;
            case 3:
              r.attributeInfos && r.attributeInfos.length || (r.attributeInfos = []), r.attributeInfos.push(I.UserAttributeSet.AttributeInfo.decode(t, t.uint32()));
              break;
            default:
              t.skipType(7 & o);
          }
        }
        return r;
      }, e.AttributeInfo = function() {
        function t(n) {
          if (n)
            for (var r = Object.keys(n), o = 0; o < r.length; ++o)
              n[r[o]] != null && (this[r[o]] = n[r[o]]);
        }
        return t.prototype.key = "", t.prototype.value = "", t.encode = function(n, r) {
          return r || (r = ia.create()), n.key != null && Object.hasOwnProperty.call(n, "key") && r.uint32(10).string(n.key), n.value != null && Object.hasOwnProperty.call(n, "value") && r.uint32(18).string(n.value), r;
        }, t.decode = function(n, r) {
          n instanceof M || (n = M.create(n)), r = r === void 0 ? n.len : n.pos + r;
          for (var o = new I.UserAttributeSet.AttributeInfo(); n.pos < r; ) {
            var i = n.uint32();
            switch (i >>> 3) {
              case 1:
                o.key = n.string();
                break;
              case 2:
                o.value = n.string();
                break;
              default:
                n.skipType(7 & i);
            }
          }
          return o;
        }, t;
      }(), e;
    }(), QC = I.UserAttributeMod = function() {
      function e(t) {
        if (this.attributeInfos = [], t)
          for (var n = Object.keys(t), r = 0; r < n.length; ++r)
            t[n[r]] != null && (this[n[r]] = t[n[r]]);
      }
      return e.prototype.seq = D.Long ? D.Long.fromBits(0, 0, !0) : 0, e.prototype.account = "", e.prototype.attributeInfos = D.emptyArray, e.encode = function(t, n) {
        if (n || (n = ia.create()), t.seq != null && Object.hasOwnProperty.call(t, "seq") && n.uint32(8).uint64(t.seq), t.account != null && Object.hasOwnProperty.call(t, "account") && n.uint32(18).string(t.account), t.attributeInfos != null && t.attributeInfos.length)
          for (var r = 0; r < t.attributeInfos.length; ++r)
            I.UserAttributeMod.AttributeInfo.encode(t.attributeInfos[r], n.uint32(26).fork()).ldelim();
        return n;
      }, e.decode = function(t, n) {
        t instanceof M || (t = M.create(t)), n = n === void 0 ? t.len : t.pos + n;
        for (var r = new I.UserAttributeMod(); t.pos < n; ) {
          var o = t.uint32();
          switch (o >>> 3) {
            case 1:
              r.seq = t.uint64();
              break;
            case 2:
              r.account = t.string();
              break;
            case 3:
              r.attributeInfos && r.attributeInfos.length || (r.attributeInfos = []), r.attributeInfos.push(I.UserAttributeMod.AttributeInfo.decode(t, t.uint32()));
              break;
            default:
              t.skipType(7 & o);
          }
        }
        return r;
      }, e.AttributeInfo = function() {
        function t(n) {
          if (n)
            for (var r = Object.keys(n), o = 0; o < r.length; ++o)
              n[r[o]] != null && (this[r[o]] = n[r[o]]);
        }
        return t.prototype.key = "", t.prototype.value = "", t.encode = function(n, r) {
          return r || (r = ia.create()), n.key != null && Object.hasOwnProperty.call(n, "key") && r.uint32(10).string(n.key), n.value != null && Object.hasOwnProperty.call(n, "value") && r.uint32(18).string(n.value), r;
        }, t.decode = function(n, r) {
          n instanceof M || (n = M.create(n)), r = r === void 0 ? n.len : n.pos + r;
          for (var o = new I.UserAttributeMod.AttributeInfo(); n.pos < r; ) {
            var i = n.uint32();
            switch (i >>> 3) {
              case 1:
                o.key = n.string();
                break;
              case 2:
                o.value = n.string();
                break;
              default:
                n.skipType(7 & i);
            }
          }
          return o;
        }, t;
      }(), e;
    }(), RC = I.UserAttributeDel = function() {
      function e(t) {
        if (this.attributes = [], t)
          for (var n = Object.keys(t), r = 0; r < n.length; ++r)
            t[n[r]] != null && (this[n[r]] = t[n[r]]);
      }
      return e.prototype.seq = D.Long ? D.Long.fromBits(0, 0, !0) : 0, e.prototype.account = "", e.prototype.attributes = D.emptyArray, e.encode = function(t, n) {
        if (n || (n = ia.create()), t.seq != null && Object.hasOwnProperty.call(t, "seq") && n.uint32(8).uint64(t.seq), t.account != null && Object.hasOwnProperty.call(t, "account") && n.uint32(18).string(t.account), t.attributes != null && t.attributes.length)
          for (var r = 0; r < t.attributes.length; ++r)
            n.uint32(26).string(t.attributes[r]);
        return n;
      }, e.decode = function(t, n) {
        t instanceof M || (t = M.create(t)), n = n === void 0 ? t.len : t.pos + n;
        for (var r = new I.UserAttributeDel(); t.pos < n; ) {
          var o = t.uint32();
          switch (o >>> 3) {
            case 1:
              r.seq = t.uint64();
              break;
            case 2:
              r.account = t.string();
              break;
            case 3:
              r.attributes && r.attributes.length || (r.attributes = []), r.attributes.push(t.string());
              break;
            default:
              t.skipType(7 & o);
          }
        }
        return r;
      }, e;
    }(), SC = I.UserAttributeErr = function() {
      function e(t) {
        if (t)
          for (var n = Object.keys(t), r = 0; r < n.length; ++r)
            t[n[r]] != null && (this[n[r]] = t[n[r]]);
      }
      return e.prototype.seq = D.Long ? D.Long.fromBits(0, 0, !0) : 0, e.prototype.code = 0, e.encode = function(t, n) {
        return n || (n = ia.create()), t.seq != null && Object.hasOwnProperty.call(t, "seq") && n.uint32(8).uint64(t.seq), t.code != null && Object.hasOwnProperty.call(t, "code") && n.uint32(16).uint32(t.code), n;
      }, e.decode = function(t, n) {
        t instanceof M || (t = M.create(t)), n = n === void 0 ? t.len : t.pos + n;
        for (var r = new I.UserAttributeErr(); t.pos < n; ) {
          var o = t.uint32();
          switch (o >>> 3) {
            case 1:
              r.seq = t.uint64();
              break;
            case 2:
              r.code = t.uint32();
              break;
            default:
              t.skipType(7 & o);
          }
        }
        return r;
      }, e;
    }(), TC = I.UserAttributeKeysGet = function() {
      function e(t) {
        if (t)
          for (var n = Object.keys(t), r = 0; r < n.length; ++r)
            t[n[r]] != null && (this[n[r]] = t[n[r]]);
      }
      return e.prototype.seq = D.Long ? D.Long.fromBits(0, 0, !0) : 0, e.prototype.account = "", e.encode = function(t, n) {
        return n || (n = ia.create()), t.seq != null && Object.hasOwnProperty.call(t, "seq") && n.uint32(8).uint64(t.seq), t.account != null && Object.hasOwnProperty.call(t, "account") && n.uint32(18).string(t.account), n;
      }, e.decode = function(t, n) {
        t instanceof M || (t = M.create(t)), n = n === void 0 ? t.len : t.pos + n;
        for (var r = new I.UserAttributeKeysGet(); t.pos < n; ) {
          var o = t.uint32();
          switch (o >>> 3) {
            case 1:
              r.seq = t.uint64();
              break;
            case 2:
              r.account = t.string();
              break;
            default:
              t.skipType(7 & o);
          }
        }
        return r;
      }, e;
    }(), UC = I.UserAttributeKeysRet = function() {
      function e(t) {
        if (this.keys = [], t)
          for (var n = Object.keys(t), r = 0; r < n.length; ++r)
            t[n[r]] != null && (this[n[r]] = t[n[r]]);
      }
      return e.prototype.seq = D.Long ? D.Long.fromBits(0, 0, !0) : 0, e.prototype.keys = D.emptyArray, e.encode = function(t, n) {
        if (n || (n = ia.create()), t.seq != null && Object.hasOwnProperty.call(t, "seq") && n.uint32(8).uint64(t.seq), t.keys != null && t.keys.length)
          for (var r = 0; r < t.keys.length; ++r)
            n.uint32(18).string(t.keys[r]);
        return n;
      }, e.decode = function(t, n) {
        t instanceof M || (t = M.create(t)), n = n === void 0 ? t.len : t.pos + n;
        for (var r = new I.UserAttributeKeysRet(); t.pos < n; ) {
          var o = t.uint32();
          switch (o >>> 3) {
            case 1:
              r.seq = t.uint64();
              break;
            case 2:
              r.keys && r.keys.length || (r.keys = []), r.keys.push(t.string());
              break;
            default:
              t.skipType(7 & o);
          }
        }
        return r;
      }, e;
    }(), VC = I.UserAttributeRsp = function() {
      function e(t) {
        if (t)
          for (var n = Object.keys(t), r = 0; r < n.length; ++r)
            t[n[r]] != null && (this[n[r]] = t[n[r]]);
      }
      return e.prototype.seq = D.Long ? D.Long.fromBits(0, 0, !0) : 0, e.encode = function(t, n) {
        return n || (n = ia.create()), t.seq != null && Object.hasOwnProperty.call(t, "seq") && n.uint32(8).uint64(t.seq), n;
      }, e.decode = function(t, n) {
        t instanceof M || (t = M.create(t)), n = n === void 0 ? t.len : t.pos + n;
        for (var r = new I.UserAttributeRsp(); t.pos < n; ) {
          var o = t.uint32();
          switch (o >>> 3) {
            case 1:
              r.seq = t.uint64();
              break;
            default:
              t.skipType(7 & o);
          }
        }
        return r;
      }, e;
    }(), WC = I.GroupStatusList = function() {
      function e(t) {
        if (this.groups = [], t)
          for (var n = Object.keys(t), r = 0; r < n.length; ++r)
            t[n[r]] != null && (this[n[r]] = t[n[r]]);
      }
      return e.prototype.seq = D.Long ? D.Long.fromBits(0, 0, !0) : 0, e.prototype.groups = D.emptyArray, e.encode = function(t, n) {
        if (n || (n = ia.create()), t.seq != null && Object.hasOwnProperty.call(t, "seq") && n.uint32(8).uint64(t.seq), t.groups != null && t.groups.length)
          for (var r = 0; r < t.groups.length; ++r)
            n.uint32(18).string(t.groups[r]);
        return n;
      }, e.decode = function(t, n) {
        t instanceof M || (t = M.create(t)), n = n === void 0 ? t.len : t.pos + n;
        for (var r = new I.GroupStatusList(); t.pos < n; ) {
          var o = t.uint32();
          switch (o >>> 3) {
            case 1:
              r.seq = t.uint64();
              break;
            case 2:
              r.groups && r.groups.length || (r.groups = []), r.groups.push(t.string());
              break;
            default:
              t.skipType(7 & o);
          }
        }
        return r;
      }, e;
    }(), XC = I.GroupStatusResult = function() {
      function e(t) {
        if (this.groupInfos = [], t)
          for (var n = Object.keys(t), r = 0; r < n.length; ++r)
            t[n[r]] != null && (this[n[r]] = t[n[r]]);
      }
      return e.prototype.seq = D.Long ? D.Long.fromBits(0, 0, !0) : 0, e.prototype.groupInfos = D.emptyArray, e.encode = function(t, n) {
        if (n || (n = ia.create()), t.seq != null && Object.hasOwnProperty.call(t, "seq") && n.uint32(8).uint64(t.seq), t.groupInfos != null && t.groupInfos.length)
          for (var r = 0; r < t.groupInfos.length; ++r)
            I.GroupStatusResult.GroupInfo.encode(t.groupInfos[r], n.uint32(18).fork()).ldelim();
        return n;
      }, e.decode = function(t, n) {
        t instanceof M || (t = M.create(t)), n = n === void 0 ? t.len : t.pos + n;
        for (var r = new I.GroupStatusResult(); t.pos < n; ) {
          var o = t.uint32();
          switch (o >>> 3) {
            case 1:
              r.seq = t.uint64();
              break;
            case 2:
              r.groupInfos && r.groupInfos.length || (r.groupInfos = []), r.groupInfos.push(I.GroupStatusResult.GroupInfo.decode(t, t.uint32()));
              break;
            default:
              t.skipType(7 & o);
          }
        }
        return r;
      }, e.GroupInfo = function() {
        function t(n) {
          if (n)
            for (var r = Object.keys(n), o = 0; o < r.length; ++o)
              n[r[o]] != null && (this[r[o]] = n[r[o]]);
        }
        return t.prototype.group = "", t.prototype.memberCount = 0, t.encode = function(n, r) {
          return r || (r = ia.create()), n.group != null && Object.hasOwnProperty.call(n, "group") && r.uint32(10).string(n.group), n.memberCount != null && Object.hasOwnProperty.call(n, "memberCount") && r.uint32(16).uint32(n.memberCount), r;
        }, t.decode = function(n, r) {
          n instanceof M || (n = M.create(n)), r = r === void 0 ? n.len : n.pos + r;
          for (var o = new I.GroupStatusResult.GroupInfo(); n.pos < r; ) {
            var i = n.uint32();
            switch (i >>> 3) {
              case 1:
                o.group = n.string();
                break;
              case 2:
                o.memberCount = n.uint32();
                break;
              default:
                n.skipType(7 & i);
            }
          }
          return o;
        }, t;
      }(), e;
    }(), YC = I.GroupCountNotice = function() {
      function e(t) {
        if (t)
          for (var n = Object.keys(t), r = 0; r < n.length; ++r)
            t[n[r]] != null && (this[n[r]] = t[n[r]]);
      }
      return e.prototype.instance = D.Long ? D.Long.fromBits(0, 0, !0) : 0, e.prototype.seq = D.Long ? D.Long.fromBits(0, 0, !0) : 0, e.prototype.group = "", e.prototype.size = 0, e.encode = function(t, n) {
        return n || (n = ia.create()), t.instance != null && Object.hasOwnProperty.call(t, "instance") && n.uint32(8).uint64(t.instance), t.seq != null && Object.hasOwnProperty.call(t, "seq") && n.uint32(16).uint64(t.seq), t.group != null && Object.hasOwnProperty.call(t, "group") && n.uint32(26).string(t.group), t.size != null && Object.hasOwnProperty.call(t, "size") && n.uint32(32).uint32(t.size), n;
      }, e.decode = function(t, n) {
        t instanceof M || (t = M.create(t)), n = n === void 0 ? t.len : t.pos + n;
        for (var r = new I.GroupCountNotice(); t.pos < n; ) {
          var o = t.uint32();
          switch (o >>> 3) {
            case 1:
              r.instance = t.uint64();
              break;
            case 2:
              r.seq = t.uint64();
              break;
            case 3:
              r.group = t.string();
              break;
            case 4:
              r.size = t.uint32();
              break;
            default:
              t.skipType(7 & o);
          }
        }
        return r;
      }, e;
    }(), ZC = I.GroupAttributeGet = function() {
      function e(t) {
        if (this.attributes = [], t)
          for (var n = Object.keys(t), r = 0; r < n.length; ++r)
            t[n[r]] != null && (this[n[r]] = t[n[r]]);
      }
      return e.prototype.seq = D.Long ? D.Long.fromBits(0, 0, !0) : 0, e.prototype.group = "", e.prototype.attributes = D.emptyArray, e.encode = function(t, n) {
        if (n || (n = ia.create()), t.seq != null && Object.hasOwnProperty.call(t, "seq") && n.uint32(8).uint64(t.seq), t.group != null && Object.hasOwnProperty.call(t, "group") && n.uint32(18).string(t.group), t.attributes != null && t.attributes.length)
          for (var r = 0; r < t.attributes.length; ++r)
            n.uint32(26).string(t.attributes[r]);
        return n;
      }, e.decode = function(t, n) {
        t instanceof M || (t = M.create(t)), n = n === void 0 ? t.len : t.pos + n;
        for (var r = new I.GroupAttributeGet(); t.pos < n; ) {
          var o = t.uint32();
          switch (o >>> 3) {
            case 1:
              r.seq = t.uint64();
              break;
            case 2:
              r.group = t.string();
              break;
            case 3:
              r.attributes && r.attributes.length || (r.attributes = []), r.attributes.push(t.string());
              break;
            default:
              t.skipType(7 & o);
          }
        }
        return r;
      }, e;
    }(), $C = I.GroupAttributeRet = function() {
      function e(t) {
        if (this.attributeMaps = [], t)
          for (var n = Object.keys(t), r = 0; r < n.length; ++r)
            t[n[r]] != null && (this[n[r]] = t[n[r]]);
      }
      return e.prototype.seq = D.Long ? D.Long.fromBits(0, 0, !0) : 0, e.prototype.attributeMaps = D.emptyArray, e.encode = function(t, n) {
        if (n || (n = ia.create()), t.seq != null && Object.hasOwnProperty.call(t, "seq") && n.uint32(8).uint64(t.seq), t.attributeMaps != null && t.attributeMaps.length)
          for (var r = 0; r < t.attributeMaps.length; ++r)
            I.GroupAttributeRet.AttributeMap.encode(t.attributeMaps[r], n.uint32(18).fork()).ldelim();
        return n;
      }, e.decode = function(t, n) {
        t instanceof M || (t = M.create(t)), n = n === void 0 ? t.len : t.pos + n;
        for (var r = new I.GroupAttributeRet(); t.pos < n; ) {
          var o = t.uint32();
          switch (o >>> 3) {
            case 1:
              r.seq = t.uint64();
              break;
            case 2:
              r.attributeMaps && r.attributeMaps.length || (r.attributeMaps = []), r.attributeMaps.push(I.GroupAttributeRet.AttributeMap.decode(t, t.uint32()));
              break;
            default:
              t.skipType(7 & o);
          }
        }
        return r;
      }, e.AttributeMap = function() {
        function t(n) {
          if (n)
            for (var r = Object.keys(n), o = 0; o < r.length; ++o)
              n[r[o]] != null && (this[r[o]] = n[r[o]]);
        }
        return t.prototype.key = "", t.prototype.value = "", t.prototype.origin = "", t.prototype.ms = D.Long ? D.Long.fromBits(0, 0, !0) : 0, t.encode = function(n, r) {
          return r || (r = ia.create()), n.key != null && Object.hasOwnProperty.call(n, "key") && r.uint32(10).string(n.key), n.value != null && Object.hasOwnProperty.call(n, "value") && r.uint32(18).string(n.value), n.origin != null && Object.hasOwnProperty.call(n, "origin") && r.uint32(26).string(n.origin), n.ms != null && Object.hasOwnProperty.call(n, "ms") && r.uint32(32).uint64(n.ms), r;
        }, t.decode = function(n, r) {
          n instanceof M || (n = M.create(n)), r = r === void 0 ? n.len : n.pos + r;
          for (var o = new I.GroupAttributeRet.AttributeMap(); n.pos < r; ) {
            var i = n.uint32();
            switch (i >>> 3) {
              case 1:
                o.key = n.string();
                break;
              case 2:
                o.value = n.string();
                break;
              case 3:
                o.origin = n.string();
                break;
              case 4:
                o.ms = n.uint64();
                break;
              default:
                n.skipType(7 & i);
            }
          }
          return o;
        }, t;
      }(), e;
    }(), aD = I.GroupAttributeSet = function() {
      function e(t) {
        if (this.attributeInfos = [], t)
          for (var n = Object.keys(t), r = 0; r < n.length; ++r)
            t[n[r]] != null && (this[n[r]] = t[n[r]]);
      }
      return e.prototype.seq = D.Long ? D.Long.fromBits(0, 0, !0) : 0, e.prototype.group = "", e.prototype.broadcast = !1, e.prototype.attributeInfos = D.emptyArray, e.encode = function(t, n) {
        if (n || (n = ia.create()), t.seq != null && Object.hasOwnProperty.call(t, "seq") && n.uint32(8).uint64(t.seq), t.group != null && Object.hasOwnProperty.call(t, "group") && n.uint32(18).string(t.group), t.broadcast != null && Object.hasOwnProperty.call(t, "broadcast") && n.uint32(24).bool(t.broadcast), t.attributeInfos != null && t.attributeInfos.length)
          for (var r = 0; r < t.attributeInfos.length; ++r)
            I.GroupAttributeSet.AttributeInfo.encode(t.attributeInfos[r], n.uint32(34).fork()).ldelim();
        return n;
      }, e.decode = function(t, n) {
        t instanceof M || (t = M.create(t)), n = n === void 0 ? t.len : t.pos + n;
        for (var r = new I.GroupAttributeSet(); t.pos < n; ) {
          var o = t.uint32();
          switch (o >>> 3) {
            case 1:
              r.seq = t.uint64();
              break;
            case 2:
              r.group = t.string();
              break;
            case 3:
              r.broadcast = t.bool();
              break;
            case 4:
              r.attributeInfos && r.attributeInfos.length || (r.attributeInfos = []), r.attributeInfos.push(I.GroupAttributeSet.AttributeInfo.decode(t, t.uint32()));
              break;
            default:
              t.skipType(7 & o);
          }
        }
        return r;
      }, e.AttributeInfo = function() {
        function t(n) {
          if (n)
            for (var r = Object.keys(n), o = 0; o < r.length; ++o)
              n[r[o]] != null && (this[r[o]] = n[r[o]]);
        }
        return t.prototype.key = "", t.prototype.value = "", t.encode = function(n, r) {
          return r || (r = ia.create()), n.key != null && Object.hasOwnProperty.call(n, "key") && r.uint32(10).string(n.key), n.value != null && Object.hasOwnProperty.call(n, "value") && r.uint32(18).string(n.value), r;
        }, t.decode = function(n, r) {
          n instanceof M || (n = M.create(n)), r = r === void 0 ? n.len : n.pos + r;
          for (var o = new I.GroupAttributeSet.AttributeInfo(); n.pos < r; ) {
            var i = n.uint32();
            switch (i >>> 3) {
              case 1:
                o.key = n.string();
                break;
              case 2:
                o.value = n.string();
                break;
              default:
                n.skipType(7 & i);
            }
          }
          return o;
        }, t;
      }(), e;
    }(), bD = I.GroupAttributeMod = function() {
      function e(t) {
        if (this.attributeInfos = [], t)
          for (var n = Object.keys(t), r = 0; r < n.length; ++r)
            t[n[r]] != null && (this[n[r]] = t[n[r]]);
      }
      return e.prototype.seq = D.Long ? D.Long.fromBits(0, 0, !0) : 0, e.prototype.group = "", e.prototype.broadcast = !1, e.prototype.attributeInfos = D.emptyArray, e.encode = function(t, n) {
        if (n || (n = ia.create()), t.seq != null && Object.hasOwnProperty.call(t, "seq") && n.uint32(8).uint64(t.seq), t.group != null && Object.hasOwnProperty.call(t, "group") && n.uint32(18).string(t.group), t.broadcast != null && Object.hasOwnProperty.call(t, "broadcast") && n.uint32(24).bool(t.broadcast), t.attributeInfos != null && t.attributeInfos.length)
          for (var r = 0; r < t.attributeInfos.length; ++r)
            I.GroupAttributeMod.AttributeInfo.encode(t.attributeInfos[r], n.uint32(34).fork()).ldelim();
        return n;
      }, e.decode = function(t, n) {
        t instanceof M || (t = M.create(t)), n = n === void 0 ? t.len : t.pos + n;
        for (var r = new I.GroupAttributeMod(); t.pos < n; ) {
          var o = t.uint32();
          switch (o >>> 3) {
            case 1:
              r.seq = t.uint64();
              break;
            case 2:
              r.group = t.string();
              break;
            case 3:
              r.broadcast = t.bool();
              break;
            case 4:
              r.attributeInfos && r.attributeInfos.length || (r.attributeInfos = []), r.attributeInfos.push(I.GroupAttributeMod.AttributeInfo.decode(t, t.uint32()));
              break;
            default:
              t.skipType(7 & o);
          }
        }
        return r;
      }, e.AttributeInfo = function() {
        function t(n) {
          if (n)
            for (var r = Object.keys(n), o = 0; o < r.length; ++o)
              n[r[o]] != null && (this[r[o]] = n[r[o]]);
        }
        return t.prototype.key = "", t.prototype.value = "", t.encode = function(n, r) {
          return r || (r = ia.create()), n.key != null && Object.hasOwnProperty.call(n, "key") && r.uint32(10).string(n.key), n.value != null && Object.hasOwnProperty.call(n, "value") && r.uint32(18).string(n.value), r;
        }, t.decode = function(n, r) {
          n instanceof M || (n = M.create(n)), r = r === void 0 ? n.len : n.pos + r;
          for (var o = new I.GroupAttributeMod.AttributeInfo(); n.pos < r; ) {
            var i = n.uint32();
            switch (i >>> 3) {
              case 1:
                o.key = n.string();
                break;
              case 2:
                o.value = n.string();
                break;
              default:
                n.skipType(7 & i);
            }
          }
          return o;
        }, t;
      }(), e;
    }(), cD = I.GroupAttributeDel = function() {
      function e(t) {
        if (this.attributes = [], t)
          for (var n = Object.keys(t), r = 0; r < n.length; ++r)
            t[n[r]] != null && (this[n[r]] = t[n[r]]);
      }
      return e.prototype.seq = D.Long ? D.Long.fromBits(0, 0, !0) : 0, e.prototype.group = "", e.prototype.broadcast = !1, e.prototype.attributes = D.emptyArray, e.encode = function(t, n) {
        if (n || (n = ia.create()), t.seq != null && Object.hasOwnProperty.call(t, "seq") && n.uint32(8).uint64(t.seq), t.group != null && Object.hasOwnProperty.call(t, "group") && n.uint32(18).string(t.group), t.broadcast != null && Object.hasOwnProperty.call(t, "broadcast") && n.uint32(24).bool(t.broadcast), t.attributes != null && t.attributes.length)
          for (var r = 0; r < t.attributes.length; ++r)
            n.uint32(34).string(t.attributes[r]);
        return n;
      }, e.decode = function(t, n) {
        t instanceof M || (t = M.create(t)), n = n === void 0 ? t.len : t.pos + n;
        for (var r = new I.GroupAttributeDel(); t.pos < n; ) {
          var o = t.uint32();
          switch (o >>> 3) {
            case 1:
              r.seq = t.uint64();
              break;
            case 2:
              r.group = t.string();
              break;
            case 3:
              r.broadcast = t.bool();
              break;
            case 4:
              r.attributes && r.attributes.length || (r.attributes = []), r.attributes.push(t.string());
              break;
            default:
              t.skipType(7 & o);
          }
        }
        return r;
      }, e;
    }(), dD = I.GroupAttributeAlt = function() {
      function e(t) {
        if (this.attributeMaps = [], t)
          for (var n = Object.keys(t), r = 0; r < n.length; ++r)
            t[n[r]] != null && (this[n[r]] = t[n[r]]);
      }
      return e.prototype.seq = D.Long ? D.Long.fromBits(0, 0, !0) : 0, e.prototype.group = "", e.prototype.instance = D.Long ? D.Long.fromBits(0, 0, !0) : 0, e.prototype.attributeMaps = D.emptyArray, e.encode = function(t, n) {
        if (n || (n = ia.create()), t.seq != null && Object.hasOwnProperty.call(t, "seq") && n.uint32(8).uint64(t.seq), t.group != null && Object.hasOwnProperty.call(t, "group") && n.uint32(18).string(t.group), t.instance != null && Object.hasOwnProperty.call(t, "instance") && n.uint32(24).uint64(t.instance), t.attributeMaps != null && t.attributeMaps.length)
          for (var r = 0; r < t.attributeMaps.length; ++r)
            I.GroupAttributeAlt.AttributeMap.encode(t.attributeMaps[r], n.uint32(34).fork()).ldelim();
        return n;
      }, e.decode = function(t, n) {
        t instanceof M || (t = M.create(t)), n = n === void 0 ? t.len : t.pos + n;
        for (var r = new I.GroupAttributeAlt(); t.pos < n; ) {
          var o = t.uint32();
          switch (o >>> 3) {
            case 1:
              r.seq = t.uint64();
              break;
            case 2:
              r.group = t.string();
              break;
            case 3:
              r.instance = t.uint64();
              break;
            case 4:
              r.attributeMaps && r.attributeMaps.length || (r.attributeMaps = []), r.attributeMaps.push(I.GroupAttributeAlt.AttributeMap.decode(t, t.uint32()));
              break;
            default:
              t.skipType(7 & o);
          }
        }
        return r;
      }, e.AttributeMap = function() {
        function t(n) {
          if (n)
            for (var r = Object.keys(n), o = 0; o < r.length; ++o)
              n[r[o]] != null && (this[r[o]] = n[r[o]]);
        }
        return t.prototype.key = "", t.prototype.value = "", t.prototype.origin = "", t.prototype.ms = D.Long ? D.Long.fromBits(0, 0, !0) : 0, t.encode = function(n, r) {
          return r || (r = ia.create()), n.key != null && Object.hasOwnProperty.call(n, "key") && r.uint32(10).string(n.key), n.value != null && Object.hasOwnProperty.call(n, "value") && r.uint32(18).string(n.value), n.origin != null && Object.hasOwnProperty.call(n, "origin") && r.uint32(26).string(n.origin), n.ms != null && Object.hasOwnProperty.call(n, "ms") && r.uint32(32).uint64(n.ms), r;
        }, t.decode = function(n, r) {
          n instanceof M || (n = M.create(n)), r = r === void 0 ? n.len : n.pos + r;
          for (var o = new I.GroupAttributeAlt.AttributeMap(); n.pos < r; ) {
            var i = n.uint32();
            switch (i >>> 3) {
              case 1:
                o.key = n.string();
                break;
              case 2:
                o.value = n.string();
                break;
              case 3:
                o.origin = n.string();
                break;
              case 4:
                o.ms = n.uint64();
                break;
              default:
                n.skipType(7 & i);
            }
          }
          return o;
        }, t;
      }(), e;
    }(), eD = I.GroupAttributeRsp = function() {
      function e(t) {
        if (t)
          for (var n = Object.keys(t), r = 0; r < n.length; ++r)
            t[n[r]] != null && (this[n[r]] = t[n[r]]);
      }
      return e.prototype.seq = D.Long ? D.Long.fromBits(0, 0, !0) : 0, e.encode = function(t, n) {
        return n || (n = ia.create()), t.seq != null && Object.hasOwnProperty.call(t, "seq") && n.uint32(8).uint64(t.seq), n;
      }, e.decode = function(t, n) {
        t instanceof M || (t = M.create(t)), n = n === void 0 ? t.len : t.pos + n;
        for (var r = new I.GroupAttributeRsp(); t.pos < n; ) {
          var o = t.uint32();
          switch (o >>> 3) {
            case 1:
              r.seq = t.uint64();
              break;
            default:
              t.skipType(7 & o);
          }
        }
        return r;
      }, e;
    }(), fD = I.GroupAttributeErr = function() {
      function e(t) {
        if (t)
          for (var n = Object.keys(t), r = 0; r < n.length; ++r)
            t[n[r]] != null && (this[n[r]] = t[n[r]]);
      }
      return e.prototype.seq = D.Long ? D.Long.fromBits(0, 0, !0) : 0, e.prototype.code = 0, e.encode = function(t, n) {
        return n || (n = ia.create()), t.seq != null && Object.hasOwnProperty.call(t, "seq") && n.uint32(8).uint64(t.seq), t.code != null && Object.hasOwnProperty.call(t, "code") && n.uint32(16).uint32(t.code), n;
      }, e.decode = function(t, n) {
        t instanceof M || (t = M.create(t)), n = n === void 0 ? t.len : t.pos + n;
        for (var r = new I.GroupAttributeErr(); t.pos < n; ) {
          var o = t.uint32();
          switch (o >>> 3) {
            case 1:
              r.seq = t.uint64();
              break;
            case 2:
              r.code = t.uint32();
              break;
            default:
              t.skipType(7 & o);
          }
        }
        return r;
      }, e;
    }(), gD = I.GroupAttributeKeysGet = function() {
      function e(t) {
        if (t)
          for (var n = Object.keys(t), r = 0; r < n.length; ++r)
            t[n[r]] != null && (this[n[r]] = t[n[r]]);
      }
      return e.prototype.seq = D.Long ? D.Long.fromBits(0, 0, !0) : 0, e.prototype.group = "", e.encode = function(t, n) {
        return n || (n = ia.create()), t.seq != null && Object.hasOwnProperty.call(t, "seq") && n.uint32(8).uint64(t.seq), t.group != null && Object.hasOwnProperty.call(t, "group") && n.uint32(18).string(t.group), n;
      }, e.decode = function(t, n) {
        t instanceof M || (t = M.create(t)), n = n === void 0 ? t.len : t.pos + n;
        for (var r = new I.GroupAttributeKeysGet(); t.pos < n; ) {
          var o = t.uint32();
          switch (o >>> 3) {
            case 1:
              r.seq = t.uint64();
              break;
            case 2:
              r.group = t.string();
              break;
            default:
              t.skipType(7 & o);
          }
        }
        return r;
      }, e;
    }(), hD = I.GroupAttributeKeysRet = function() {
      function e(t) {
        if (this.keys = [], t)
          for (var n = Object.keys(t), r = 0; r < n.length; ++r)
            t[n[r]] != null && (this[n[r]] = t[n[r]]);
      }
      return e.prototype.seq = D.Long ? D.Long.fromBits(0, 0, !0) : 0, e.prototype.keys = D.emptyArray, e.encode = function(t, n) {
        if (n || (n = ia.create()), t.seq != null && Object.hasOwnProperty.call(t, "seq") && n.uint32(8).uint64(t.seq), t.keys != null && t.keys.length)
          for (var r = 0; r < t.keys.length; ++r)
            n.uint32(18).string(t.keys[r]);
        return n;
      }, e.decode = function(t, n) {
        t instanceof M || (t = M.create(t)), n = n === void 0 ? t.len : t.pos + n;
        for (var r = new I.GroupAttributeKeysRet(); t.pos < n; ) {
          var o = t.uint32();
          switch (o >>> 3) {
            case 1:
              r.seq = t.uint64();
              break;
            case 2:
              r.keys && r.keys.length || (r.keys = []), r.keys.push(t.string());
              break;
            default:
              t.skipType(7 & o);
          }
        }
        return r;
      }, e;
    }(), iD = I.SubscribeUserStatus = function() {
      function e(t) {
        if (this.users = [], t)
          for (var n = Object.keys(t), r = 0; r < n.length; ++r)
            t[n[r]] != null && (this[n[r]] = t[n[r]]);
      }
      return e.prototype.seq = D.Long ? D.Long.fromBits(0, 0, !0) : 0, e.prototype.users = D.emptyArray, e.encode = function(t, n) {
        if (n || (n = ia.create()), t.seq != null && Object.hasOwnProperty.call(t, "seq") && n.uint32(8).uint64(t.seq), t.users != null && t.users.length)
          for (var r = 0; r < t.users.length; ++r)
            n.uint32(18).string(t.users[r]);
        return n;
      }, e.decode = function(t, n) {
        t instanceof M || (t = M.create(t)), n = n === void 0 ? t.len : t.pos + n;
        for (var r = new I.SubscribeUserStatus(); t.pos < n; ) {
          var o = t.uint32();
          switch (o >>> 3) {
            case 1:
              r.seq = t.uint64();
              break;
            case 2:
              r.users && r.users.length || (r.users = []), r.users.push(t.string());
              break;
            default:
              t.skipType(7 & o);
          }
        }
        return r;
      }, e;
    }(), jD = I.UnsubscribeUserStatus = function() {
      function e(t) {
        if (this.users = [], t)
          for (var n = Object.keys(t), r = 0; r < n.length; ++r)
            t[n[r]] != null && (this[n[r]] = t[n[r]]);
      }
      return e.prototype.seq = D.Long ? D.Long.fromBits(0, 0, !0) : 0, e.prototype.users = D.emptyArray, e.encode = function(t, n) {
        if (n || (n = ia.create()), t.seq != null && Object.hasOwnProperty.call(t, "seq") && n.uint32(8).uint64(t.seq), t.users != null && t.users.length)
          for (var r = 0; r < t.users.length; ++r)
            n.uint32(18).string(t.users[r]);
        return n;
      }, e.decode = function(t, n) {
        t instanceof M || (t = M.create(t)), n = n === void 0 ? t.len : t.pos + n;
        for (var r = new I.UnsubscribeUserStatus(); t.pos < n; ) {
          var o = t.uint32();
          switch (o >>> 3) {
            case 1:
              r.seq = t.uint64();
              break;
            case 2:
              r.users && r.users.length || (r.users = []), r.users.push(t.string());
              break;
            default:
              t.skipType(7 & o);
          }
        }
        return r;
      }, e;
    }(), kD = I.UserJoinNotice = function() {
      function e(t) {
        if (t)
          for (var n = Object.keys(t), r = 0; r < n.length; ++r)
            t[n[r]] != null && (this[n[r]] = t[n[r]]);
      }
      return e.prototype.instance = D.Long ? D.Long.fromBits(0, 0, !0) : 0, e.prototype.seq = D.Long ? D.Long.fromBits(0, 0, !0) : 0, e.prototype.user = "", e.encode = function(t, n) {
        return n || (n = ia.create()), t.instance != null && Object.hasOwnProperty.call(t, "instance") && n.uint32(8).uint64(t.instance), t.seq != null && Object.hasOwnProperty.call(t, "seq") && n.uint32(16).uint64(t.seq), t.user != null && Object.hasOwnProperty.call(t, "user") && n.uint32(26).string(t.user), n;
      }, e.decode = function(t, n) {
        t instanceof M || (t = M.create(t)), n = n === void 0 ? t.len : t.pos + n;
        for (var r = new I.UserJoinNotice(); t.pos < n; ) {
          var o = t.uint32();
          switch (o >>> 3) {
            case 1:
              r.instance = t.uint64();
              break;
            case 2:
              r.seq = t.uint64();
              break;
            case 3:
              r.user = t.string();
              break;
            default:
              t.skipType(7 & o);
          }
        }
        return r;
      }, e;
    }(), lD = I.UserQuitNotice = function() {
      function e(t) {
        if (t)
          for (var n = Object.keys(t), r = 0; r < n.length; ++r)
            t[n[r]] != null && (this[n[r]] = t[n[r]]);
      }
      return e.prototype.instance = D.Long ? D.Long.fromBits(0, 0, !0) : 0, e.prototype.seq = D.Long ? D.Long.fromBits(0, 0, !0) : 0, e.prototype.user = "", e.encode = function(t, n) {
        return n || (n = ia.create()), t.instance != null && Object.hasOwnProperty.call(t, "instance") && n.uint32(8).uint64(t.instance), t.seq != null && Object.hasOwnProperty.call(t, "seq") && n.uint32(16).uint64(t.seq), t.user != null && Object.hasOwnProperty.call(t, "user") && n.uint32(26).string(t.user), n;
      }, e.decode = function(t, n) {
        t instanceof M || (t = M.create(t)), n = n === void 0 ? t.len : t.pos + n;
        for (var r = new I.UserQuitNotice(); t.pos < n; ) {
          var o = t.uint32();
          switch (o >>> 3) {
            case 1:
              r.instance = t.uint64();
              break;
            case 2:
              r.seq = t.uint64();
              break;
            case 3:
              r.user = t.string();
              break;
            default:
              t.skipType(7 & o);
          }
        }
        return r;
      }, e;
    }(), mD = I.UserWaitNotice = function() {
      function e(t) {
        if (t)
          for (var n = Object.keys(t), r = 0; r < n.length; ++r)
            t[n[r]] != null && (this[n[r]] = t[n[r]]);
      }
      return e.prototype.instance = D.Long ? D.Long.fromBits(0, 0, !0) : 0, e.prototype.seq = D.Long ? D.Long.fromBits(0, 0, !0) : 0, e.prototype.user = "", e.encode = function(t, n) {
        return n || (n = ia.create()), t.instance != null && Object.hasOwnProperty.call(t, "instance") && n.uint32(8).uint64(t.instance), t.seq != null && Object.hasOwnProperty.call(t, "seq") && n.uint32(16).uint64(t.seq), t.user != null && Object.hasOwnProperty.call(t, "user") && n.uint32(26).string(t.user), n;
      }, e.decode = function(t, n) {
        t instanceof M || (t = M.create(t)), n = n === void 0 ? t.len : t.pos + n;
        for (var r = new I.UserWaitNotice(); t.pos < n; ) {
          var o = t.uint32();
          switch (o >>> 3) {
            case 1:
              r.instance = t.uint64();
              break;
            case 2:
              r.seq = t.uint64();
              break;
            case 3:
              r.user = t.string();
              break;
            default:
              t.skipType(7 & o);
          }
        }
        return r;
      }, e;
    }(), nD = I.SubscribeResponse = function() {
      function e(t) {
        if (this.errors = [], t)
          for (var n = Object.keys(t), r = 0; r < n.length; ++r)
            t[n[r]] != null && (this[n[r]] = t[n[r]]);
      }
      return e.prototype.seq = D.Long ? D.Long.fromBits(0, 0, !0) : 0, e.prototype.errors = D.emptyArray, e.encode = function(t, n) {
        if (n || (n = ia.create()), t.seq != null && Object.hasOwnProperty.call(t, "seq") && n.uint32(8).uint64(t.seq), t.errors != null && t.errors.length)
          for (var r = 0; r < t.errors.length; ++r)
            I.SubscribeResponse.SubscribeErrorsType.encode(t.errors[r], n.uint32(18).fork()).ldelim();
        return n;
      }, e.decode = function(t, n) {
        t instanceof M || (t = M.create(t)), n = n === void 0 ? t.len : t.pos + n;
        for (var r = new I.SubscribeResponse(); t.pos < n; ) {
          var o = t.uint32();
          switch (o >>> 3) {
            case 1:
              r.seq = t.uint64();
              break;
            case 2:
              r.errors && r.errors.length || (r.errors = []), r.errors.push(I.SubscribeResponse.SubscribeErrorsType.decode(t, t.uint32()));
              break;
            default:
              t.skipType(7 & o);
          }
        }
        return r;
      }, e.SubscribeErrorsType = function() {
        function t(n) {
          if (n)
            for (var r = Object.keys(n), o = 0; o < r.length; ++o)
              n[r[o]] != null && (this[r[o]] = n[r[o]]);
        }
        return t.prototype.account = "", t.prototype.code = 0, t.encode = function(n, r) {
          return r || (r = ia.create()), n.account != null && Object.hasOwnProperty.call(n, "account") && r.uint32(10).string(n.account), n.code != null && Object.hasOwnProperty.call(n, "code") && r.uint32(16).uint32(n.code), r;
        }, t.decode = function(n, r) {
          n instanceof M || (n = M.create(n)), r = r === void 0 ? n.len : n.pos + r;
          for (var o = new I.SubscribeResponse.SubscribeErrorsType(); n.pos < r; ) {
            var i = n.uint32();
            switch (i >>> 3) {
              case 1:
                o.account = n.string();
                break;
              case 2:
                o.code = n.uint32();
                break;
              default:
                n.skipType(7 & i);
            }
          }
          return o;
        }, t;
      }(), e;
    }(), oD = Object.freeze({ __proto__: null, URI: vC, Wrapper: wi, Ping: wC, Pong: xC, UserJoin: yC, UserResp: zC, UserQuit: AC, UserDrop: BC, UserTicketNearlyExpire: CC, UserRenewTokenReq: DC, UserRenewTokenResp: EC, GroupEnter: FC, GroupLeave: GC, GroupReply: HC, GroupLeaveNotice: vs, GroupEnterNotice: ws, Message: xs, Ack: ys, GroupDrop: IC, GroupAllUsersList: JC, GroupAllUsersResult: KC, UserStatusList: LC, UserStatusResult: MC, UserAttributeGet: NC, UserAttributeRet: OC, UserAttributeSet: PC, UserAttributeMod: QC, UserAttributeDel: RC, UserAttributeErr: SC, UserAttributeKeysGet: TC, UserAttributeKeysRet: UC, UserAttributeRsp: VC, GroupStatusList: WC, GroupStatusResult: XC, GroupCountNotice: YC, GroupAttributeGet: ZC, GroupAttributeRet: $C, GroupAttributeSet: aD, GroupAttributeMod: bD, GroupAttributeDel: cD, GroupAttributeAlt: dD, GroupAttributeRsp: eD, GroupAttributeErr: fD, GroupAttributeKeysGet: gD, GroupAttributeKeysRet: hD, SubscribeUserStatus: iD, UnsubscribeUserStatus: jD, UserJoinNotice: kD, UserQuitNotice: lD, UserWaitNotice: mD, SubscribeResponse: nD, default: I }), pD = Math.ceil, zs = function(e) {
      return function(t, n, r) {
        var o = (t = String(Eb(t))).length;
        return r = r === void 0 ? " " : String(r), (n = Ma(n)) <= o || r == "" ? t : (n -= o, (o = Yo.call(r, pD(n / r.length))).length > n && (o = o.slice(0, n)), e ? t + o : o + t);
      };
    }, qD = zs(!1), rD = zs(!0), As = /Version\/10(?:\.\d+){1,2}(?: [\w./]+)?(?: Mobile\/\w+)? Safari\//.test(df);
    ea({ target: "String", proto: !0, forced: As }, { padEnd: function(e) {
      return rD(this, e, 1 < arguments.length ? arguments[1] : void 0);
    } });
    var sD = eg, Bs = function(e) {
      return function(t) {
        t = Mb(t);
        for (var n, r = ed(t), o = r.length, i = 0, s = []; o > i; )
          n = r[i++], wa && !sD.call(t, n) || s.push(e ? [n, t[n]] : t[n]);
        return s;
      };
    }, tD = Bs(!0), uD = Bs(!1);
    ea({ target: "Object", stat: !0 }, { entries: function(e) {
      return tD(e);
    } });
    var vD = dc.f, Cs = "".endsWith, wD = Math.min, Ds = Qk("endsWith"), xD = !Ds && !!function() {
      var e = vD(String.prototype, "endsWith");
      return e && !e.writable;
    }();
    ea({ target: "String", proto: !0, forced: !xD && !Ds }, { endsWith: function(e) {
      var t = String(Eb(this));
      Pk(e);
      var n = 1 < arguments.length ? arguments[1] : void 0, r = Ma(t.length);
      return n = n === void 0 ? r : wD(Ma(n), r), r = String(e), Cs ? Cs.call(t, r, n) : t.slice(n - r.length, n) === r;
    } }), Bh("match", 1, function(e, t, n) {
      return [function(r) {
        var o = Eb(this), i = r == null ? void 0 : r[e];
        return i !== void 0 ? i.call(r, o) : new RegExp(r)[e](String(o));
      }, function(r) {
        var o = n(t, r, this);
        if (o.done)
          return o.value;
        if (r = Ia(r), o = String(this), !r.global)
          return ef(r, o);
        var i = r.unicode;
        r.lastIndex = 0;
        for (var s, u = [], a = 0; (s = ef(r, o)) !== null; )
          s = String(s[0]), u[a] = s, s === "" && (r.lastIndex = Mj(o, Ma(r.lastIndex), i)), a++;
        return a === 0 ? null : u;
      }];
    });
    var yD = dc.f, Es = "".startsWith, zD = Math.min, Fs = Qk("startsWith"), AD = !Fs && !!function() {
      var e = yD(String.prototype, "startsWith");
      return e && !e.writable;
    }();
    ea({ target: "String", proto: !0, forced: !AD && !Fs }, { startsWith: function(e) {
      var t = String(Eb(this));
      Pk(e);
      var n = Ma(zD(1 < arguments.length ? arguments[1] : void 0, t.length)), r = String(e);
      return Es ? Es.call(t, r, n) : t.slice(n, n + r.length) === r;
    } });
    var Wn = function(e) {
      var t = /(%?)(%([jds]))/g, n = Array.prototype.slice.call(arguments, 1);
      return n.length && (e = e.replace(t, function(r, o, i, s) {
        switch (i = n.shift(), s) {
          case "s":
            i = "" + i;
            break;
          case "d":
            i = Number(i);
            break;
          case "j":
            i = JSON.stringify(i);
        }
        return o ? (n.unshift(i), r) : i;
      })), n.length && (e += " " + n.join(" ")), "" + (e = e.replace(/%{2,2}/g, "%"));
    }, BD = /\s/, CD = /^\s+/, Gs = NaN, DD = /^[-+]0x[0-9a-f]+$/i, ED = /^0b[01]+$/i, FD = /^0o[0-7]+$/i, GD = parseInt, xi = function(e) {
      if (typeof e == "number")
        return e;
      if (Ke(e))
        return Gs;
      if (Gb(e) && (e = typeof e.valueOf == "function" ? e.valueOf() : e, e = Gb(e) ? e + "" : e), typeof e != "string")
        return e === 0 ? e : +e;
      if (e) {
        for (var t = e.slice, n = e.length; n-- && BD.test(e.charAt(n)); )
          ;
        e = t.call(e, 0, n + 1).replace(CD, "");
      }
      return (t = ED.test(e)) || FD.test(e) ? GD(e.slice(2), t ? 2 : 8) : DD.test(e) ? Gs : +e;
    }, HD = Math.max, ID = Math.min, JD = function(e, t, n) {
      function r(E) {
        var w = a, C = l;
        return a = l = void 0, p = E, f = e.apply(C, w);
      }
      function o(E) {
        var w = E - d;
        return E -= p, d === void 0 || w >= t || 0 > w || y && E >= m;
      }
      function i() {
        var E = $b.Date.now();
        if (o(E))
          return s(E);
        var w = setTimeout, C = E - p;
        E = t - (E - d), C = y ? ID(E, m - C) : E, h = w(i, C);
      }
      function s(E) {
        return h = void 0, g && a ? r(E) : (a = l = void 0, f);
      }
      function u() {
        var E = $b.Date.now(), w = o(E);
        if (a = arguments, l = this, d = E, w) {
          if (h === void 0)
            return p = E = d, h = setTimeout(i, t), v ? r(E) : f;
          if (y)
            return clearTimeout(h), h = setTimeout(i, t), r(d);
        }
        return h === void 0 && (h = setTimeout(i, t)), f;
      }
      var a, l, f, h, d, p = 0, v = !1, y = !1, g = !0;
      if (typeof e != "function")
        throw new TypeError("Expected a function");
      if (t = xi(t) || 0, Gb(n)) {
        v = !!n.leading;
        var m = (y = "maxWait" in n) ? HD(xi(n.maxWait) || 0, t) : m;
        g = "trailing" in n ? !!n.trailing : g;
      }
      return u.cancel = function() {
        h !== void 0 && clearTimeout(h), p = 0, a = d = l = h = void 0;
      }, u.flush = function() {
        return h === void 0 ? f : s($b.Date.now());
      }, u;
    }, KD = Math.max, LD = Math.min, Hs = 1 / 0, Rl = function(e) {
      return e ? (e = xi(e)) === Hs || e === -Hs ? 17976931348623157e292 * (0 > e ? -1 : 1) : e == e ? e : 0 : e === 0 ? e : 0;
    }, Is = function(e, t, n) {
      return t = Rl(t), n === void 0 ? (n = t, t = 0) : n = Rl(n), (e = xi(e)) >= LD(t, n) && e < KD(t, n);
    }, ac = Gc.Writer, H = Gc.util, Pb = Gc.roots.default || (Gc.roots.default = {}), MD = Pb.Session = function() {
      function e(t) {
        if (t)
          for (var n = Object.keys(t), r = 0; r < n.length; ++r)
            t[n[r]] != null && (this[n[r]] = t[n[r]]);
      }
      return e.prototype.sid = "", e.prototype.userId = "", e.prototype.lts = H.Long ? H.Long.fromBits(0, 0, !1) : 0, e.prototype.elapse = H.Long ? H.Long.fromBits(0, 0, !1) : 0, e.prototype.appId = "", e.prototype.ver = "", e.prototype.buildno = 0, e.prototype.installId = "", e.prototype.os = 0, e.prototype.did = "", e.prototype.index = null, e.prototype.token = "", e.prototype.version = 0, e.prototype.subVersion = 0, e.encode = function(t, n) {
        return n || (n = ac.create()), t.sid != null && Object.hasOwnProperty.call(t, "sid") && n.uint32(10).string(t.sid), t.userId != null && Object.hasOwnProperty.call(t, "userId") && n.uint32(18).string(t.userId), t.lts != null && Object.hasOwnProperty.call(t, "lts") && n.uint32(24).int64(t.lts), t.elapse != null && Object.hasOwnProperty.call(t, "elapse") && n.uint32(32).int64(t.elapse), t.appId != null && Object.hasOwnProperty.call(t, "appId") && n.uint32(42).string(t.appId), t.ver != null && Object.hasOwnProperty.call(t, "ver") && n.uint32(50).string(t.ver), t.buildno != null && Object.hasOwnProperty.call(t, "buildno") && n.uint32(56).int32(t.buildno), t.installId != null && Object.hasOwnProperty.call(t, "installId") && n.uint32(66).string(t.installId), t.os != null && Object.hasOwnProperty.call(t, "os") && n.uint32(128).int32(t.os), t.did != null && Object.hasOwnProperty.call(t, "did") && n.uint32(138).string(t.did), t.index != null && Object.hasOwnProperty.call(t, "index") && Pb.Session.CommonIndex.encode(t.index, n.uint32(162).fork()).ldelim(), t.token != null && Object.hasOwnProperty.call(t, "token") && n.uint32(170).string(t.token), t.version != null && Object.hasOwnProperty.call(t, "version") && n.uint32(176).int32(t.version), t.subVersion != null && Object.hasOwnProperty.call(t, "subVersion") && n.uint32(184).int32(t.subVersion), n;
      }, e.CommonIndex = function() {
        function t(n) {
          if (n)
            for (var r = Object.keys(n), o = 0; o < r.length; ++o)
              n[r[o]] != null && (this[r[o]] = n[r[o]]);
        }
        return t.prototype.index1 = "", t.prototype.index2 = "", t.prototype.index3 = "", t.encode = function(n, r) {
          return r || (r = ac.create()), n.index1 != null && Object.hasOwnProperty.call(n, "index1") && r.uint32(10).string(n.index1), n.index2 != null && Object.hasOwnProperty.call(n, "index2") && r.uint32(18).string(n.index2), n.index3 != null && Object.hasOwnProperty.call(n, "index3") && r.uint32(26).string(n.index3), r;
        }, t;
      }(), e;
    }(), ND = Pb.ApEvent = function() {
      function e(t) {
        if (this.linkServerList = [], t)
          for (var n = Object.keys(t), r = 0; r < n.length; ++r)
            t[n[r]] != null && (this[n[r]] = t[n[r]]);
      }
      return e.prototype.sid = "", e.prototype.userId = "", e.prototype.lts = H.Long ? H.Long.fromBits(0, 0, !1) : 0, e.prototype.elapse = H.Long ? H.Long.fromBits(0, 0, !1) : 0, e.prototype.apAddr = "", e.prototype.linkServerList = H.emptyArray, e.prototype.errCode = 0, e.prototype.serverErrCode = 0, e.prototype.isp = "", e.prototype.opId = H.Long ? H.Long.fromBits(0, 0, !1) : 0, e.prototype.envId = 0, e.prototype.flag = 0, e.prototype.area = "", e.encode = function(t, n) {
        if (n || (n = ac.create()), t.sid != null && Object.hasOwnProperty.call(t, "sid") && n.uint32(10).string(t.sid), t.userId != null && Object.hasOwnProperty.call(t, "userId") && n.uint32(18).string(t.userId), t.lts != null && Object.hasOwnProperty.call(t, "lts") && n.uint32(24).int64(t.lts), t.elapse != null && Object.hasOwnProperty.call(t, "elapse") && n.uint32(32).int64(t.elapse), t.apAddr != null && Object.hasOwnProperty.call(t, "apAddr") && n.uint32(50).string(t.apAddr), t.linkServerList != null && t.linkServerList.length)
          for (var r = 0; r < t.linkServerList.length; ++r)
            n.uint32(58).string(t.linkServerList[r]);
        return t.errCode != null && Object.hasOwnProperty.call(t, "errCode") && n.uint32(72).int32(t.errCode), t.serverErrCode != null && Object.hasOwnProperty.call(t, "serverErrCode") && n.uint32(80).int32(t.serverErrCode), t.isp != null && Object.hasOwnProperty.call(t, "isp") && n.uint32(90).string(t.isp), t.opId != null && Object.hasOwnProperty.call(t, "opId") && n.uint32(96).int64(t.opId), t.envId != null && Object.hasOwnProperty.call(t, "envId") && n.uint32(104).int32(t.envId), t.flag != null && Object.hasOwnProperty.call(t, "flag") && n.uint32(112).int32(t.flag), t.area != null && Object.hasOwnProperty.call(t, "area") && n.uint32(122).string(t.area), n;
      }, e;
    }(), OD = Pb.ApRequest = function() {
      function e(t) {
        if (t)
          for (var n = Object.keys(t), r = 0; r < n.length; ++r)
            t[n[r]] != null && (this[n[r]] = t[n[r]]);
      }
      return e.prototype.sid = "", e.prototype.userId = "", e.prototype.lts = H.Long ? H.Long.fromBits(0, 0, !1) : 0, e.prototype.elapse = H.Long ? H.Long.fromBits(0, 0, !1) : 0, e.prototype.apAddr = "", e.prototype.opId = H.Long ? H.Long.fromBits(0, 0, !1) : 0, e.prototype.envId = 0, e.prototype.flag = 0, e.encode = function(t, n) {
        return n || (n = ac.create()), t.sid != null && Object.hasOwnProperty.call(t, "sid") && n.uint32(10).string(t.sid), t.userId != null && Object.hasOwnProperty.call(t, "userId") && n.uint32(18).string(t.userId), t.lts != null && Object.hasOwnProperty.call(t, "lts") && n.uint32(24).int64(t.lts), t.elapse != null && Object.hasOwnProperty.call(t, "elapse") && n.uint32(32).int64(t.elapse), t.apAddr != null && Object.hasOwnProperty.call(t, "apAddr") && n.uint32(42).string(t.apAddr), t.opId != null && Object.hasOwnProperty.call(t, "opId") && n.uint32(48).int64(t.opId), t.envId != null && Object.hasOwnProperty.call(t, "envId") && n.uint32(56).int32(t.envId), t.flag != null && Object.hasOwnProperty.call(t, "flag") && n.uint32(64).int32(t.flag), n;
      }, e;
    }(), PD = Pb.LinkLoginRequest = function() {
      function e(t) {
        if (t)
          for (var n = Object.keys(t), r = 0; r < n.length; ++r)
            t[n[r]] != null && (this[n[r]] = t[n[r]]);
      }
      return e.prototype.sid = "", e.prototype.userId = "", e.prototype.lts = H.Long ? H.Long.fromBits(0, 0, !1) : 0, e.prototype.elapse = H.Long ? H.Long.fromBits(0, 0, !1) : 0, e.prototype.destServerIp = "", e.prototype.linkId = 0, e.encode = function(t, n) {
        return n || (n = ac.create()), t.sid != null && Object.hasOwnProperty.call(t, "sid") && n.uint32(10).string(t.sid), t.userId != null && Object.hasOwnProperty.call(t, "userId") && n.uint32(18).string(t.userId), t.lts != null && Object.hasOwnProperty.call(t, "lts") && n.uint32(24).int64(t.lts), t.elapse != null && Object.hasOwnProperty.call(t, "elapse") && n.uint32(32).int64(t.elapse), t.destServerIp != null && Object.hasOwnProperty.call(t, "destServerIp") && n.uint32(42).string(t.destServerIp), t.linkId != null && Object.hasOwnProperty.call(t, "linkId") && n.uint32(48).int32(t.linkId), n;
      }, e;
    }(), QD = Pb.Link = function() {
      function e(t) {
        if (t)
          for (var n = Object.keys(t), r = 0; r < n.length; ++r)
            t[n[r]] != null && (this[n[r]] = t[n[r]]);
      }
      return e.prototype.sid = "", e.prototype.userId = "", e.prototype.lts = H.Long ? H.Long.fromBits(0, 0, !1) : 0, e.prototype.elapse = H.Long ? H.Long.fromBits(0, 0, !1) : 0, e.prototype.ec = 0, e.prototype.sc = 0, e.prototype.destServerIp = "", e.prototype.ackedServerIp = "", e.prototype.responseTime = 0, e.encode = function(t, n) {
        return n || (n = ac.create()), t.sid != null && Object.hasOwnProperty.call(t, "sid") && n.uint32(10).string(t.sid), t.userId != null && Object.hasOwnProperty.call(t, "userId") && n.uint32(18).string(t.userId), t.lts != null && Object.hasOwnProperty.call(t, "lts") && n.uint32(24).int64(t.lts), t.elapse != null && Object.hasOwnProperty.call(t, "elapse") && n.uint32(32).int64(t.elapse), t.ec != null && Object.hasOwnProperty.call(t, "ec") && n.uint32(40).int32(t.ec), t.sc != null && Object.hasOwnProperty.call(t, "sc") && n.uint32(48).int32(t.sc), t.destServerIp != null && Object.hasOwnProperty.call(t, "destServerIp") && n.uint32(58).string(t.destServerIp), t.ackedServerIp != null && Object.hasOwnProperty.call(t, "ackedServerIp") && n.uint32(66).string(t.ackedServerIp), t.responseTime != null && Object.hasOwnProperty.call(t, "responseTime") && n.uint32(72).int32(t.responseTime), n;
      }, e;
    }(), RD = Pb.Logout = function() {
      function e(t) {
        if (t)
          for (var n = Object.keys(t), r = 0; r < n.length; ++r)
            t[n[r]] != null && (this[n[r]] = t[n[r]]);
      }
      return e.prototype.sid = "", e.prototype.userId = "", e.prototype.lts = H.Long ? H.Long.fromBits(0, 0, !1) : 0, e.prototype.elapse = H.Long ? H.Long.fromBits(0, 0, !1) : 0, e.encode = function(t, n) {
        return n || (n = ac.create()), t.sid != null && Object.hasOwnProperty.call(t, "sid") && n.uint32(10).string(t.sid), t.userId != null && Object.hasOwnProperty.call(t, "userId") && n.uint32(18).string(t.userId), t.lts != null && Object.hasOwnProperty.call(t, "lts") && n.uint32(24).int64(t.lts), t.elapse != null && Object.hasOwnProperty.call(t, "elapse") && n.uint32(32).int64(t.elapse), n;
      }, e;
    }(), SD = Pb.KickedOff = function() {
      function e(t) {
        if (t)
          for (var n = Object.keys(t), r = 0; r < n.length; ++r)
            t[n[r]] != null && (this[n[r]] = t[n[r]]);
      }
      return e.prototype.sid = "", e.prototype.userId = "", e.prototype.lts = H.Long ? H.Long.fromBits(0, 0, !1) : 0, e.prototype.elapse = H.Long ? H.Long.fromBits(0, 0, !1) : 0, e.prototype.linkId = 0, e.prototype.code = 0, e.prototype.server = "", e.prototype.serverCode = 0, e.encode = function(t, n) {
        return n || (n = ac.create()), t.sid != null && Object.hasOwnProperty.call(t, "sid") && n.uint32(10).string(t.sid), t.userId != null && Object.hasOwnProperty.call(t, "userId") && n.uint32(18).string(t.userId), t.lts != null && Object.hasOwnProperty.call(t, "lts") && n.uint32(24).int64(t.lts), t.elapse != null && Object.hasOwnProperty.call(t, "elapse") && n.uint32(32).int64(t.elapse), t.linkId != null && Object.hasOwnProperty.call(t, "linkId") && n.uint32(48).int32(t.linkId), t.code != null && Object.hasOwnProperty.call(t, "code") && n.uint32(56).int32(t.code), t.server != null && Object.hasOwnProperty.call(t, "server") && n.uint32(66).string(t.server), t.serverCode != null && Object.hasOwnProperty.call(t, "serverCode") && n.uint32(72).int32(t.serverCode), n;
      }, e;
    }(), TD = Pb.ChnJoin = function() {
      function e(t) {
        if (t)
          for (var n = Object.keys(t), r = 0; r < n.length; ++r)
            t[n[r]] != null && (this[n[r]] = t[n[r]]);
      }
      return e.prototype.sid = "", e.prototype.userId = "", e.prototype.lts = H.Long ? H.Long.fromBits(0, 0, !1) : 0, e.prototype.elapse = H.Long ? H.Long.fromBits(0, 0, !1) : 0, e.prototype.cname = "", e.prototype.errCode = 0, e.encode = function(t, n) {
        return n || (n = ac.create()), t.sid != null && Object.hasOwnProperty.call(t, "sid") && n.uint32(10).string(t.sid), t.userId != null && Object.hasOwnProperty.call(t, "userId") && n.uint32(18).string(t.userId), t.lts != null && Object.hasOwnProperty.call(t, "lts") && n.uint32(24).int64(t.lts), t.elapse != null && Object.hasOwnProperty.call(t, "elapse") && n.uint32(32).int64(t.elapse), t.cname != null && Object.hasOwnProperty.call(t, "cname") && n.uint32(50).string(t.cname), t.errCode != null && Object.hasOwnProperty.call(t, "errCode") && n.uint32(56).int32(t.errCode), n;
      }, e;
    }(), UD = Pb.ChnJoinRes = function() {
      function e(t) {
        if (t)
          for (var n = Object.keys(t), r = 0; r < n.length; ++r)
            t[n[r]] != null && (this[n[r]] = t[n[r]]);
      }
      return e.prototype.sid = "", e.prototype.userId = "", e.prototype.lts = H.Long ? H.Long.fromBits(0, 0, !1) : 0, e.prototype.elapse = H.Long ? H.Long.fromBits(0, 0, !1) : 0, e.prototype.cname = "", e.prototype.errCode = 0, e.prototype.serverErrCode = 0, e.encode = function(t, n) {
        return n || (n = ac.create()), t.sid != null && Object.hasOwnProperty.call(t, "sid") && n.uint32(10).string(t.sid), t.userId != null && Object.hasOwnProperty.call(t, "userId") && n.uint32(18).string(t.userId), t.lts != null && Object.hasOwnProperty.call(t, "lts") && n.uint32(24).int64(t.lts), t.elapse != null && Object.hasOwnProperty.call(t, "elapse") && n.uint32(32).int64(t.elapse), t.cname != null && Object.hasOwnProperty.call(t, "cname") && n.uint32(50).string(t.cname), t.errCode != null && Object.hasOwnProperty.call(t, "errCode") && n.uint32(56).int32(t.errCode), t.serverErrCode != null && Object.hasOwnProperty.call(t, "serverErrCode") && n.uint32(64).int32(t.serverErrCode), n;
      }, e;
    }(), VD = Pb.ChnLeave = function() {
      function e(t) {
        if (t)
          for (var n = Object.keys(t), r = 0; r < n.length; ++r)
            t[n[r]] != null && (this[n[r]] = t[n[r]]);
      }
      return e.prototype.sid = "", e.prototype.userId = "", e.prototype.lts = H.Long ? H.Long.fromBits(0, 0, !1) : 0, e.prototype.elapse = H.Long ? H.Long.fromBits(0, 0, !1) : 0, e.prototype.cname = "", e.prototype.errCode = 0, e.encode = function(t, n) {
        return n || (n = ac.create()), t.sid != null && Object.hasOwnProperty.call(t, "sid") && n.uint32(10).string(t.sid), t.userId != null && Object.hasOwnProperty.call(t, "userId") && n.uint32(18).string(t.userId), t.lts != null && Object.hasOwnProperty.call(t, "lts") && n.uint32(24).int64(t.lts), t.elapse != null && Object.hasOwnProperty.call(t, "elapse") && n.uint32(32).int64(t.elapse), t.cname != null && Object.hasOwnProperty.call(t, "cname") && n.uint32(50).string(t.cname), t.errCode != null && Object.hasOwnProperty.call(t, "errCode") && n.uint32(56).int32(t.errCode), n;
      }, e;
    }(), WD = Pb.ConnectionStateChange = function() {
      function e(t) {
        if (t)
          for (var n = Object.keys(t), r = 0; r < n.length; ++r)
            t[n[r]] != null && (this[n[r]] = t[n[r]]);
      }
      return e.prototype.sid = "", e.prototype.userId = "", e.prototype.lts = H.Long ? H.Long.fromBits(0, 0, !1) : 0, e.prototype.elapse = H.Long ? H.Long.fromBits(0, 0, !1) : 0, e.prototype.oldState = 0, e.prototype.newState = 0, e.prototype.reason = 0, e.prototype.reconnId = 0, e.encode = function(t, n) {
        return n || (n = ac.create()), t.sid != null && Object.hasOwnProperty.call(t, "sid") && n.uint32(10).string(t.sid), t.userId != null && Object.hasOwnProperty.call(t, "userId") && n.uint32(18).string(t.userId), t.lts != null && Object.hasOwnProperty.call(t, "lts") && n.uint32(24).int64(t.lts), t.elapse != null && Object.hasOwnProperty.call(t, "elapse") && n.uint32(32).int64(t.elapse), t.oldState != null && Object.hasOwnProperty.call(t, "oldState") && n.uint32(40).int32(t.oldState), t.newState != null && Object.hasOwnProperty.call(t, "newState") && n.uint32(48).int32(t.newState), t.reason != null && Object.hasOwnProperty.call(t, "reason") && n.uint32(56).int32(t.reason), t.reconnId != null && Object.hasOwnProperty.call(t, "reconnId") && n.uint32(64).int32(t.reconnId), n;
      }, e;
    }(), Js = Pb.RtmSdkMessageCount = function() {
      function e(t) {
        if (t)
          for (var n = Object.keys(t), r = 0; r < n.length; ++r)
            t[n[r]] != null && (this[n[r]] = t[n[r]]);
      }
      return e.prototype.lts = H.Long ? H.Long.fromBits(0, 0, !1) : 0, e.prototype.vid = H.Long ? H.Long.fromBits(0, 0, !1) : 0, e.prototype.sid = "", e.prototype.messagecategory = 0, e.prototype.reportsequence = H.Long ? H.Long.fromBits(0, 0, !1) : 0, e.prototype.sentcount = H.Long ? H.Long.fromBits(0, 0, !1) : 0, e.prototype.receivedcount = H.Long ? H.Long.fromBits(0, 0, !1) : 0, e.prototype.peerack10mscount = H.Long ? H.Long.fromBits(0, 0, !1) : 0, e.prototype.peerack25mscount = H.Long ? H.Long.fromBits(0, 0, !1) : 0, e.prototype.peerack50mscount = H.Long ? H.Long.fromBits(0, 0, !1) : 0, e.prototype.peerack75mscount = H.Long ? H.Long.fromBits(0, 0, !1) : 0, e.prototype.peerack100mscount = H.Long ? H.Long.fromBits(0, 0, !1) : 0, e.prototype.peerack150mscount = H.Long ? H.Long.fromBits(0, 0, !1) : 0, e.prototype.peerack200mscount = H.Long ? H.Long.fromBits(0, 0, !1) : 0, e.prototype.peerack250mscount = H.Long ? H.Long.fromBits(0, 0, !1) : 0, e.prototype.peerack300mscount = H.Long ? H.Long.fromBits(0, 0, !1) : 0, e.prototype.peerack400mscount = H.Long ? H.Long.fromBits(0, 0, !1) : 0, e.prototype.peerack500mscount = H.Long ? H.Long.fromBits(0, 0, !1) : 0, e.prototype.peerack600mscount = H.Long ? H.Long.fromBits(0, 0, !1) : 0, e.prototype.peerack800mscount = H.Long ? H.Long.fromBits(0, 0, !1) : 0, e.prototype.peerack1000mscount = H.Long ? H.Long.fromBits(0, 0, !1) : 0, e.prototype.peerack2000mscount = H.Long ? H.Long.fromBits(0, 0, !1) : 0, e.prototype.peerack3000mscount = H.Long ? H.Long.fromBits(0, 0, !1) : 0, e.prototype.peerack5000mscount = H.Long ? H.Long.fromBits(0, 0, !1) : 0, e.prototype.peerack7000mscount = H.Long ? H.Long.fromBits(0, 0, !1) : 0, e.prototype.peerackslowcount = H.Long ? H.Long.fromBits(0, 0, !1) : 0, e.prototype.norecipientack10mscount = H.Long ? H.Long.fromBits(0, 0, !1) : 0, e.prototype.norecipientack25mscount = H.Long ? H.Long.fromBits(0, 0, !1) : 0, e.prototype.norecipientack50mscount = H.Long ? H.Long.fromBits(0, 0, !1) : 0, e.prototype.norecipientack75mscount = H.Long ? H.Long.fromBits(0, 0, !1) : 0, e.prototype.norecipientack100mscount = H.Long ? H.Long.fromBits(0, 0, !1) : 0, e.prototype.norecipientack150mscount = H.Long ? H.Long.fromBits(0, 0, !1) : 0, e.prototype.norecipientack200mscount = H.Long ? H.Long.fromBits(0, 0, !1) : 0, e.prototype.norecipientack250mscount = H.Long ? H.Long.fromBits(0, 0, !1) : 0, e.prototype.norecipientack300mscount = H.Long ? H.Long.fromBits(0, 0, !1) : 0, e.prototype.norecipientack400mscount = H.Long ? H.Long.fromBits(0, 0, !1) : 0, e.prototype.norecipientack500mscount = H.Long ? H.Long.fromBits(0, 0, !1) : 0, e.prototype.norecipientack600mscount = H.Long ? H.Long.fromBits(0, 0, !1) : 0, e.prototype.norecipientack800mscount = H.Long ? H.Long.fromBits(0, 0, !1) : 0, e.prototype.norecipientack1000mscount = H.Long ? H.Long.fromBits(0, 0, !1) : 0, e.prototype.norecipientack2000mscount = H.Long ? H.Long.fromBits(0, 0, !1) : 0, e.prototype.norecipientack3000mscount = H.Long ? H.Long.fromBits(0, 0, !1) : 0, e.prototype.norecipientack5000mscount = H.Long ? H.Long.fromBits(0, 0, !1) : 0, e.prototype.norecipientack7000mscount = H.Long ? H.Long.fromBits(0, 0, !1) : 0, e.prototype.norecipientackslowcount = H.Long ? H.Long.fromBits(0, 0, !1) : 0, e.prototype.acktimeoutcount = H.Long ? H.Long.fromBits(0, 0, !1) : 0, e.prototype.apimajorversion = 0, e.prototype.apiminorversion = 0, e.prototype.os = 0, e.prototype.toooftencount = 0, e.prototype.receiverofflinecount = 0, e.prototype.invalidmessagecount = 0, e.prototype.unknowerrorcount = 0, e.prototype.servercachedcount = 0, e.prototype.timeoutcount = 0, e.prototype.successcount = 0, e.prototype.userid = "", e.encode = function(t, n) {
        return n || (n = ac.create()), t.lts != null && Object.hasOwnProperty.call(t, "lts") && n.uint32(8).int64(t.lts), t.vid != null && Object.hasOwnProperty.call(t, "vid") && n.uint32(16).int64(t.vid), t.sid != null && Object.hasOwnProperty.call(t, "sid") && n.uint32(26).string(t.sid), t.messagecategory != null && Object.hasOwnProperty.call(t, "messagecategory") && n.uint32(32).int32(t.messagecategory), t.reportsequence != null && Object.hasOwnProperty.call(t, "reportsequence") && n.uint32(40).int64(t.reportsequence), t.sentcount != null && Object.hasOwnProperty.call(t, "sentcount") && n.uint32(48).int64(t.sentcount), t.receivedcount != null && Object.hasOwnProperty.call(t, "receivedcount") && n.uint32(56).int64(t.receivedcount), t.peerack10mscount != null && Object.hasOwnProperty.call(t, "peerack10mscount") && n.uint32(64).int64(t.peerack10mscount), t.peerack25mscount != null && Object.hasOwnProperty.call(t, "peerack25mscount") && n.uint32(72).int64(t.peerack25mscount), t.peerack50mscount != null && Object.hasOwnProperty.call(t, "peerack50mscount") && n.uint32(80).int64(t.peerack50mscount), t.peerack75mscount != null && Object.hasOwnProperty.call(t, "peerack75mscount") && n.uint32(88).int64(t.peerack75mscount), t.peerack100mscount != null && Object.hasOwnProperty.call(t, "peerack100mscount") && n.uint32(96).int64(t.peerack100mscount), t.peerack150mscount != null && Object.hasOwnProperty.call(t, "peerack150mscount") && n.uint32(104).int64(t.peerack150mscount), t.peerack200mscount != null && Object.hasOwnProperty.call(t, "peerack200mscount") && n.uint32(112).int64(t.peerack200mscount), t.peerack250mscount != null && Object.hasOwnProperty.call(t, "peerack250mscount") && n.uint32(120).int64(t.peerack250mscount), t.peerack300mscount != null && Object.hasOwnProperty.call(t, "peerack300mscount") && n.uint32(128).int64(t.peerack300mscount), t.peerack400mscount != null && Object.hasOwnProperty.call(t, "peerack400mscount") && n.uint32(136).int64(t.peerack400mscount), t.peerack500mscount != null && Object.hasOwnProperty.call(t, "peerack500mscount") && n.uint32(144).int64(t.peerack500mscount), t.peerack600mscount != null && Object.hasOwnProperty.call(t, "peerack600mscount") && n.uint32(152).int64(t.peerack600mscount), t.peerack800mscount != null && Object.hasOwnProperty.call(t, "peerack800mscount") && n.uint32(160).int64(t.peerack800mscount), t.peerack1000mscount != null && Object.hasOwnProperty.call(t, "peerack1000mscount") && n.uint32(168).int64(t.peerack1000mscount), t.peerack2000mscount != null && Object.hasOwnProperty.call(t, "peerack2000mscount") && n.uint32(176).int64(t.peerack2000mscount), t.peerack3000mscount != null && Object.hasOwnProperty.call(t, "peerack3000mscount") && n.uint32(184).int64(t.peerack3000mscount), t.peerack5000mscount != null && Object.hasOwnProperty.call(t, "peerack5000mscount") && n.uint32(192).int64(t.peerack5000mscount), t.peerack7000mscount != null && Object.hasOwnProperty.call(t, "peerack7000mscount") && n.uint32(200).int64(t.peerack7000mscount), t.peerackslowcount != null && Object.hasOwnProperty.call(t, "peerackslowcount") && n.uint32(208).int64(t.peerackslowcount), t.norecipientack10mscount != null && Object.hasOwnProperty.call(t, "norecipientack10mscount") && n.uint32(216).int64(t.norecipientack10mscount), t.norecipientack25mscount != null && Object.hasOwnProperty.call(t, "norecipientack25mscount") && n.uint32(224).int64(t.norecipientack25mscount), t.norecipientack50mscount != null && Object.hasOwnProperty.call(t, "norecipientack50mscount") && n.uint32(232).int64(t.norecipientack50mscount), t.norecipientack75mscount != null && Object.hasOwnProperty.call(t, "norecipientack75mscount") && n.uint32(240).int64(t.norecipientack75mscount), t.norecipientack100mscount != null && Object.hasOwnProperty.call(t, "norecipientack100mscount") && n.uint32(248).int64(t.norecipientack100mscount), t.norecipientack150mscount != null && Object.hasOwnProperty.call(t, "norecipientack150mscount") && n.uint32(256).int64(t.norecipientack150mscount), t.norecipientack200mscount != null && Object.hasOwnProperty.call(t, "norecipientack200mscount") && n.uint32(264).int64(t.norecipientack200mscount), t.norecipientack250mscount != null && Object.hasOwnProperty.call(t, "norecipientack250mscount") && n.uint32(272).int64(t.norecipientack250mscount), t.norecipientack300mscount != null && Object.hasOwnProperty.call(t, "norecipientack300mscount") && n.uint32(280).int64(t.norecipientack300mscount), t.norecipientack400mscount != null && Object.hasOwnProperty.call(t, "norecipientack400mscount") && n.uint32(288).int64(t.norecipientack400mscount), t.norecipientack500mscount != null && Object.hasOwnProperty.call(t, "norecipientack500mscount") && n.uint32(296).int64(t.norecipientack500mscount), t.norecipientack600mscount != null && Object.hasOwnProperty.call(t, "norecipientack600mscount") && n.uint32(304).int64(t.norecipientack600mscount), t.norecipientack800mscount != null && Object.hasOwnProperty.call(t, "norecipientack800mscount") && n.uint32(312).int64(t.norecipientack800mscount), t.norecipientack1000mscount != null && Object.hasOwnProperty.call(t, "norecipientack1000mscount") && n.uint32(320).int64(t.norecipientack1000mscount), t.norecipientack2000mscount != null && Object.hasOwnProperty.call(t, "norecipientack2000mscount") && n.uint32(328).int64(t.norecipientack2000mscount), t.norecipientack3000mscount != null && Object.hasOwnProperty.call(t, "norecipientack3000mscount") && n.uint32(336).int64(t.norecipientack3000mscount), t.norecipientack5000mscount != null && Object.hasOwnProperty.call(t, "norecipientack5000mscount") && n.uint32(344).int64(t.norecipientack5000mscount), t.norecipientack7000mscount != null && Object.hasOwnProperty.call(t, "norecipientack7000mscount") && n.uint32(352).int64(t.norecipientack7000mscount), t.norecipientackslowcount != null && Object.hasOwnProperty.call(t, "norecipientackslowcount") && n.uint32(360).int64(t.norecipientackslowcount), t.acktimeoutcount != null && Object.hasOwnProperty.call(t, "acktimeoutcount") && n.uint32(368).int64(t.acktimeoutcount), t.apimajorversion != null && Object.hasOwnProperty.call(t, "apimajorversion") && n.uint32(376).int32(t.apimajorversion), t.apiminorversion != null && Object.hasOwnProperty.call(t, "apiminorversion") && n.uint32(384).int32(t.apiminorversion), t.os != null && Object.hasOwnProperty.call(t, "os") && n.uint32(392).int32(t.os), t.toooftencount != null && Object.hasOwnProperty.call(t, "toooftencount") && n.uint32(400).int32(t.toooftencount), t.receiverofflinecount != null && Object.hasOwnProperty.call(t, "receiverofflinecount") && n.uint32(408).int32(t.receiverofflinecount), t.invalidmessagecount != null && Object.hasOwnProperty.call(t, "invalidmessagecount") && n.uint32(416).int32(t.invalidmessagecount), t.unknowerrorcount != null && Object.hasOwnProperty.call(t, "unknowerrorcount") && n.uint32(424).int32(t.unknowerrorcount), t.servercachedcount != null && Object.hasOwnProperty.call(t, "servercachedcount") && n.uint32(432).int32(t.servercachedcount), t.timeoutcount != null && Object.hasOwnProperty.call(t, "timeoutcount") && n.uint32(440).int32(t.timeoutcount), t.successcount != null && Object.hasOwnProperty.call(t, "successcount") && n.uint32(448).int32(t.successcount), t.userid != null && Object.hasOwnProperty.call(t, "userid") && n.uint32(458).string(t.userid), n;
      }, e;
    }(), Iv = Object.freeze({ __proto__: null, Session: MD, ApEvent: ND, ApRequest: OD, LinkLoginRequest: PD, Link: QD, Logout: RD, KickedOff: SD, ChnJoin: TD, ChnJoinRes: UD, ChnLeave: VD, ConnectionStateChange: WD, RtmSdkMessageCount: Js, default: Pb }), XD = la(function() {
      return (/* @__PURE__ */ new Date(NaN)).toJSON() !== null || Date.prototype.toJSON.call({ toISOString: function() {
        return 1;
      } }) !== 1;
    });
    ea({ target: "Date", proto: !0, forced: XD }, { toJSON: function(e) {
      e = pb(this);
      var t = Oc(e);
      return typeof t != "number" || isFinite(t) ? e.toISOString() : null;
    } }), ea({ target: "URL", proto: !0, enumerable: !0 }, { toJSON: function() {
      return URL.prototype.toString.call(this);
    } });
    var Ev = Object.prototype.hasOwnProperty, Ks = function(e, t, n) {
      return JSON.stringify(Mn(e), t, n);
    };
    Ks.ensureProperties = Mn;
    var YD = function(e, t) {
      t = t || {};
      var n = qa(e);
      if (n === "string" && 0 < e.length)
        return Fv(e);
      if (n === "number" && isFinite(e))
        return t.long ? e = 864e5 <= (t = Math.abs(e)) ? jh(e, t, 864e5, "day") : 36e5 <= t ? jh(e, t, 36e5, "hour") : 6e4 <= t ? jh(e, t, 6e4, "minute") : 1e3 <= t ? jh(e, t, 1e3, "second") : e + " ms" : e = 864e5 <= (t = Math.abs(e)) ? Math.round(e / 864e5) + "d" : 36e5 <= t ? Math.round(e / 36e5) + "h" : 6e4 <= t ? Math.round(e / 6e4) + "m" : 1e3 <= t ? Math.round(e / 1e3) + "s" : e + "ms", e;
      throw Error("val is not a non-empty string or a valid number. val=" + JSON.stringify(e));
    }, ZD = function(e) {
      function t(o) {
        function i() {
          for (var a = arguments.length, l = Array(a), f = 0; f < a; f++)
            l[f] = arguments[f];
          if (i.enabled) {
            a = Number(/* @__PURE__ */ new Date()), i.diff = a - (s || a), i.prev = s, s = i.curr = a, l[0] = t.coerce(l[0]), typeof l[0] != "string" && l.unshift("%O");
            var h = 0;
            l[0] = l[0].replace(/%([a-zA-Z%])/g, function(d, p) {
              return d === "%%" ? "%" : (h++, typeof (p = t.formatters[p]) == "function" && (d = p.call(i, l[h]), l.splice(h, 1), h--), d);
            }), t.formatArgs.call(i, l), (i.log || t.log).apply(i, l);
          }
        }
        var s, u = null;
        return i.namespace = o, i.useColors = t.useColors(), i.color = t.selectColor(o), i.extend = n, i.destroy = t.destroy, Object.defineProperty(i, "enabled", { enumerable: !0, configurable: !1, get: function() {
          return u === null ? t.enabled(o) : u;
        }, set: function(a) {
          u = a;
        } }), typeof t.init == "function" && t.init(i), i;
      }
      function n(o, i) {
        return (o = t(this.namespace + (i === void 0 ? ":" : i) + o)).log = this.log, o;
      }
      function r(o) {
        return o.toString().substring(2, o.toString().length - 2).replace(/\.\*\?$/, "*");
      }
      return t.debug = t, t.default = t, t.coerce = function(o) {
        return o instanceof Error ? o.stack || o.message : o;
      }, t.disable = function() {
        var o = [].concat(Z(t.names.map(r)), Z(t.skips.map(r).map(function(i) {
          return "-" + i;
        }))).join(",");
        return t.enable(""), o;
      }, t.enable = function(o) {
        t.save(o), t.names = [], t.skips = [];
        var i, s = (typeof o == "string" ? o : "").split(/[\s,]+/), u = s.length;
        for (i = 0; i < u; i++)
          s[i] && ((o = s[i].replace(/\*/g, ".*?"))[0] === "-" ? t.skips.push(new RegExp("^" + o.substr(1) + "$")) : t.names.push(new RegExp("^" + o + "$")));
      }, t.enabled = function(o) {
        if (o[o.length - 1] === "*")
          return !0;
        var i, s = 0;
        for (i = t.skips.length; s < i; s++)
          if (t.skips[s].test(o))
            return !1;
        for (s = 0, i = t.names.length; s < i; s++)
          if (t.names[s].test(o))
            return !0;
        return !1;
      }, t.humanize = YD, t.destroy = function() {
        console.warn("Instance method `debug.destroy()` is deprecated and no longer does anything. It will be removed in the next major version of `debug`.");
      }, Object.keys(e).forEach(function(o) {
        t[o] = e[o];
      }), t.names = [], t.skips = [], t.formatters = {}, t.selectColor = function(o) {
        for (var i = 0, s = 0; s < o.length; s++)
          i = (i << 5) - i + o.charCodeAt(s), i |= 0;
        return t.colors[Math.abs(i) % t.colors.length];
      }, t.enable(t.load()), t;
    }, Ls = xb(function(e, t) {
      t.formatArgs = function(o) {
        if (o[0] = (this.useColors ? "%c" : "") + this.namespace + (this.useColors ? " %c" : " ") + o[0] + (this.useColors ? "%c " : " ") + "+" + e.exports.humanize(this.diff), this.useColors) {
          var i = "color: " + this.color;
          o.splice(1, 0, i, "color: inherit");
          var s = 0, u = 0;
          o[0].replace(/%[a-zA-Z%]/g, function(a) {
            a !== "%%" && (s++, a === "%c" && (u = s));
          }), o.splice(u, 0, i);
        }
      }, t.save = function(o) {
        try {
          o ? t.storage.setItem("debug", o) : t.storage.removeItem("debug");
        } catch (i) {
        }
      }, t.load = function() {
        try {
          var o = t.storage.getItem("debug");
        } catch (i) {
        }
        return !o && typeof process != "undefined" && "env" in process && (o = process.env.DEBUG), o;
      }, t.useColors = function() {
        return !(typeof window == "undefined" || !window.process || window.process.type !== "renderer" && !window.process.__nwjs) || (typeof navigator == "undefined" || !navigator.userAgent || !navigator.userAgent.toLowerCase().match(/(edge|trident)\/(\d+)/)) && (typeof document != "undefined" && document.documentElement && document.documentElement.style && document.documentElement.style.WebkitAppearance || typeof window != "undefined" && window.console && (window.console.firebug || window.console.exception && window.console.table) || typeof navigator != "undefined" && navigator.userAgent && navigator.userAgent.toLowerCase().match(/firefox\/(\d+)/) && 31 <= parseInt(RegExp.$1, 10) || typeof navigator != "undefined" && navigator.userAgent && navigator.userAgent.toLowerCase().match(/applewebkit\/(\d+)/));
      };
      t: {
        try {
          var n = localStorage;
          break t;
        } catch (o) {
        }
        n = void 0;
      }
      var r;
      t.storage = n, t.destroy = (r = !1, function() {
        r || (r = !0, console.warn("Instance method `debug.destroy()` is deprecated and no longer does anything. It will be removed in the next major version of `debug`."));
      }), t.colors = "#0000CC #0000FF #0033CC #0033FF #0066CC #0066FF #0099CC #0099FF #00CC00 #00CC33 #00CC66 #00CC99 #00CCCC #00CCFF #3300CC #3300FF #3333CC #3333FF #3366CC #3366FF #3399CC #3399FF #33CC00 #33CC33 #33CC66 #33CC99 #33CCCC #33CCFF #6600CC #6600FF #6633CC #6633FF #66CC00 #66CC33 #9900CC #9900FF #9933CC #9933FF #99CC00 #99CC33 #CC0000 #CC0033 #CC0066 #CC0099 #CC00CC #CC00FF #CC3300 #CC3333 #CC3366 #CC3399 #CC33CC #CC33FF #CC6600 #CC6633 #CC9900 #CC9933 #CCCC00 #CCCC33 #FF0000 #FF0033 #FF0066 #FF0099 #FF00CC #FF00FF #FF3300 #FF3333 #FF3366 #FF3399 #FF33CC #FF33FF #FF6600 #FF6633 #FF9900 #FF9933 #FFCC00 #FFCC33".split(" "), t.log = console.debug || console.log || function() {
      }, e.exports = ZD(t), e.exports.formatters.j = function(o) {
        try {
          return JSON.stringify(o);
        } catch (i) {
          return "[UnexpectedJSONParseError]: " + i.message;
        }
      };
    }), Ms = Ls("RTM:DEBUG"), Af;
    Ms.enabled = !1, function(e) {
      e[e.Uploading = 0] = "Uploading", e[e.Free = 1] = "Free";
    }(Af || (Af = {}));
    var $D = function() {
      function e(t) {
        va(this, e), x(this, "uploadRequest", void 0), x(this, "uploadState", void 0), x(this, "uploadResendCount", void 0), x(this, "LogCache", void 0), x(this, "LogsToPost", void 0), x(this, "processId", void 0), x(this, "sdkVersion", void 0), x(this, "logId", void 0), x(this, "rtmConfig", void 0), this.processId = t.processId, this.sdkVersion = t.sdkVersion, this.rtmConfig = t.rtmConfig, this.uploadRequest = t.uploadRequest, this.uploadState = Af.Free, this.uploadResendCount = 0, this.LogCache = [], this.LogsToPost = [], this.logId = 0;
      }
      return eb(e, [{ key: "upload", value: function(t) {
        this.LogCache.push(t), this.uploadState === Af.Free && (this.LogsToPost = 40 > this.LogCache.length ? this.LogCache.splice(0, this.LogCache.length) : this.LogCache.splice(0, 40), this.postLog(this.LogsToPost));
      } }, { key: "postLog", value: function(t) {
        var n = this;
        this.uploadState = Af.Uploading, setTimeout(ma(N.mark(function r() {
          var o, i, s;
          return N.wrap(function(u) {
            for (; ; )
              switch (u.prev = u.next) {
                case 0:
                  return o = { sdk_version: n.sdkVersion, process_id: n.processId, payload: JSON.stringify(t) }, u.prev = 1, u.next = 4, n.uploadRequest(o, (i = n.rtmConfig.enableCloudProxy) !== null && i !== void 0 && i);
                case 4:
                  if (!gj) {
                    u.next = 6;
                    break;
                  }
                  throw Error("RTM is busy");
                case 6:
                  u.next = 13;
                  break;
                case 8:
                  return u.prev = 8, u.t0 = u.catch(1), s = 2 > n.uploadResendCount++ ? 2e3 : 1e4, setTimeout(function() {
                    return n.postLog(n.LogsToPost);
                  }, s), u.abrupt("return");
                case 13:
                  if (Ms('The logs uploaded for "process-'.concat(Og, '"')), n.LogCache.length !== 0) {
                    u.next = 17;
                    break;
                  }
                  return n.uploadState = Af.Free, u.abrupt("return");
                case 17:
                  n.uploadResendCount = 0, n.LogsToPost = 40 > n.LogCache.length ? n.LogCache.splice(0, n.LogCache.length) : n.LogCache.splice(0, 40), n.postLog(n.LogsToPost);
                case 20:
                case "end":
                  return u.stop();
              }
          }, r, null, [[1, 8]]);
        })), ue.getParameter("LOG_UPLOAD_INTERVAL"));
      } }]), e;
    }(), Ns = function(e, t, n, r, o, i, s, u) {
      var a = 0;
      for (s = !!s && Dd(s, u, 3); a < r; ) {
        if (a in n) {
          if (u = s ? s(n[a], a, t) : n[a], 0 < i && Ed(u))
            o = Ns(e, t, u, Ma(u.length), o, i - 1) - 1;
          else {
            if (9007199254740991 <= o)
              throw TypeError("Exceed the acceptable array length");
            e[o] = u;
          }
          o++;
        }
        a++;
      }
      return o;
    }, aE = Ns;
    ea({ target: "Array", proto: !0 }, { flat: function() {
      var e = arguments.length ? arguments[0] : void 0, t = pb(this), n = Ma(t.length), r = Dh(t, 0);
      return r.length = aE(r, t, t, n, 0, e === void 0 ? 1 : yc(e)), r;
    } }), ea({ target: "Object", stat: !0 }, { values: function(e) {
      return uD(e);
    } });
    var ud = function(e) {
      function t(r, o) {
        return va(this, t), x(z(r = n.call(this, Vn(r, o))), "originalError", void 0), x(z(r), "code", void 0), x(z(r), "serverCode", void 0), typeof o == "number" ? r.code = o : typeof o == "string" ? r.name = o : o !== void 0 && (o.originalError && (r.originalError = o.originalError), o.code !== void 0 && (r.code = o.code), o.serverCode !== void 0 && (r.serverCode = o.serverCode)), r;
      }
      Ga(t, e);
      var n = Ha(t);
      return t;
    }(Kf(Error)), rc = function(e) {
      function t(r, o) {
        return va(this, t), x(z(r = n.call(this, Vn(r, o))), "name", "RtmInternalError"), x(z(r), "code", void 0), r.code = o, r;
      }
      Ga(t, e);
      var n = Ha(t);
      return t;
    }(Kf(Error)), yi = function() {
      return function(e) {
        function t(r) {
          va(this, t);
          var o = Object.keys(r);
          return n.call(this, r[o[0]], o[0]);
        }
        Ga(t, e);
        var n = Ha(t);
        return t;
      }(rc);
    }, mb = yi(), Ub = function(e) {
      function t() {
        va(this, t);
        for (var r = arguments.length, o = Array(r), i = 0; i < r; i++)
          o[i] = arguments[i];
        return x(z(r = n.call.apply(n, [this].concat(o))), "name", "RtmTimeoutError"), r;
      }
      Ga(t, e);
      var n = Ha(t);
      return t;
    }(ud), ca = function(e) {
      function t() {
        va(this, t);
        for (var r = arguments.length, o = Array(r), i = 0; i < r; i++)
          o[i] = arguments[i];
        return x(z(r = n.call.apply(n, [this].concat(o))), "name", "RtmInvalidArgumentError"), r;
      }
      Ga(t, e);
      var n = Ha(t);
      return t;
    }(ud), da = function(e) {
      function t() {
        va(this, t);
        for (var r = arguments.length, o = Array(r), i = 0; i < r; i++)
          o[i] = arguments[i];
        return x(z(r = n.call.apply(n, [this].concat(o))), "name", "RtmInvalidStatusError"), r;
      }
      Ga(t, e);
      var n = Ha(t);
      return t;
    }(ud), ic = function(e) {
      function t() {
        va(this, t);
        for (var r = arguments.length, o = Array(r), i = 0; i < r; i++)
          o[i] = arguments[i];
        return x(z(r = n.call.apply(n, [this].concat(o))), "name", "RtmLimitExceededError"), r;
      }
      Ga(t, e);
      var n = Ha(t);
      return t;
    }(ud), bE = function(e) {
      function t() {
        va(this, t);
        for (var r = arguments.length, o = Array(r), i = 0; i < r; i++)
          o[i] = arguments[i];
        return x(z(r = n.call.apply(n, [this].concat(o))), "name", "RtmInvokeTooOftenError"), r;
      }
      Ga(t, e);
      var n = Ha(t);
      return t;
    }(ud), Ja = function(e) {
      function t() {
        va(this, t);
        for (var r = arguments.length, o = Array(r), i = 0; i < r; i++)
          o[i] = arguments[i];
        return x(z(r = n.call.apply(n, [this].concat(o))), "name", "RtmUnavailableError"), x(z(r), "serverCode", void 0), x(z(r), "statusCode", void 0), r;
      }
      Ga(t, e);
      var n = Ha(t);
      return t;
    }(ud), Bf = function(e) {
      function t() {
        va(this, t);
        for (var r = arguments.length, o = Array(r), i = 0; i < r; i++)
          o[i] = arguments[i];
        return x(z(r = n.call.apply(n, [this].concat(o))), "name", "RtmUnauthenticatedError"), x(z(r), "serverCode", void 0), r;
      }
      Ga(t, e);
      var n = Ha(t);
      return t;
    }(ud), ve = function(e) {
      function t() {
        va(this, t);
        for (var r = arguments.length, o = Array(r), i = 0; i < r; i++)
          o[i] = arguments[i];
        return x(z(r = n.call.apply(n, [this].concat(o))), "name", "RtmUnknownError"), r;
      }
      Ga(t, e);
      var n = Ha(t);
      return t;
    }(ud), Ab = function(e) {
      return e instanceof Ub || e instanceof Tb;
    }, Na = function(e) {
      return e instanceof ud;
    }, we = function(e, t, n) {
      return ['Executing "%s.%s" timed out after %ds', e, t, n / 1e3];
    }, cE = ["CODE"], bc, Pd, S;
    (function(e) {
      e.CHINA = "CN", e.ASIA = "AS", e.NORTH_AMERICA = "NA", e.EUROPE = "EU", e.JAPAN = "JP", e.INDIA = "IN", e.OCEANIA = "OC", e.SOUTH_AMERICA = "SA", e.AFRICA = "AF", e.OVERSEA = "OVERSEA", e.GLOBAL = "GLOBAL";
    })(S || (S = {}));
    var dE = { CN: S.CHINA, NA: S.NORTH_AMERICA, EU: S.EUROPE, AS: S.ASIA, JP: S.JAPAN, IN: S.INDIA, GLOB: S.GLOBAL, AF: S.AFRICA, OC: S.OVERSEA, OVS: S.OVERSEA, SA: S.SOUTH_AMERICA }, kh = $n((bc = {}, x(bc, S.ASIA, { CODE: S.ASIA, AP_DOMAINS: ["ap-web-1-asia.agora.io"], AP_BACKUP_DOMAINS: ["ap-web-2-asia.agora.io"], EVENT_REPORT_DOMAIN: ["statscollector-1-asia.agora.io"], EVENT_REPORT_BACKUP_DOMAIN: ["statscollector-2-asia.agora.io"], LOG_UPLOAD_SERVER: ["logservice-asia.agora.io"], PROXY_AP: ["proxy-ap-web-asia.agora.io"], PROXY_NGINX: ["southeast-asia.webrtc-cloud-proxy.sd-rtn.com"] }), x(bc, S.NORTH_AMERICA, { CODE: S.NORTH_AMERICA, AP_DOMAINS: ["ap-web-1-north-america.agora.io"], AP_BACKUP_DOMAINS: ["ap-web-2-north-america.agora.io"], EVENT_REPORT_DOMAIN: ["statscollector-1-north-america.agora.io"], EVENT_REPORT_BACKUP_DOMAIN: ["statscollector-2-north-america.agora.io"], LOG_UPLOAD_SERVER: ["logservice-north-america.agora.io"], PROXY_AP: ["proxy-ap-web-america.agora.io"], PROXY_NGINX: ["east-usa.webrtc-cloud-proxy.sd-rtn.com"] }), x(bc, S.EUROPE, { CODE: S.EUROPE, AP_DOMAINS: ["ap-web-1-europe.agora.io"], AP_BACKUP_DOMAINS: ["ap-web-2-europe.agora.io"], EVENT_REPORT_DOMAIN: ["statscollector-1-europe.agora.io"], EVENT_REPORT_BACKUP_DOMAIN: ["statscollector-2-europe.agora.io"], LOG_UPLOAD_SERVER: ["logservice-europe.agora.io"], PROXY_AP: ["proxy-ap-web-europe.agora.io"], PROXY_NGINX: ["europe.webrtc-cloud-proxy.sd-rtn.com"] }), x(bc, S.JAPAN, { CODE: S.JAPAN, AP_DOMAINS: ["ap-web-1-japan.agora.io"], AP_BACKUP_DOMAINS: ["ap-web-2-japan.agora.io"], EVENT_REPORT_DOMAIN: ["statscollector-1-japan.agora.io"], EVENT_REPORT_BACKUP_DOMAIN: ["statscollector-2-japan.agora.io"], LOG_UPLOAD_SERVER: ["logservice-japan.agora.io"], PROXY_AP: ["proxy-ap-web-japan.agora.io"], PROXY_NGINX: ["japan.webrtc-cloud-proxy.sd-rtn.com"] }), x(bc, S.INDIA, { CODE: S.INDIA, AP_DOMAINS: ["ap-web-1-india.agora.io"], AP_BACKUP_DOMAINS: ["ap-web-2-india.agora.io"], EVENT_REPORT_DOMAIN: ["statscollector-1-india.agora.io"], EVENT_REPORT_BACKUP_DOMAIN: ["statscollector-2-india.agora.io"], LOG_UPLOAD_SERVER: ["logservice-india.agora.io"], PROXY_AP: ["proxy-ap-web-india.agora.io"], PROXY_NGINX: ["india.webrtc-cloud-proxy.sd-rtn.com"] }), x(bc, S.OVERSEA, { CODE: S.OVERSEA, AP_DOMAINS: ["ap-web-1-oversea.agora.io"], AP_BACKUP_DOMAINS: ["ap-web-2-oversea.agora.io"], EVENT_REPORT_DOMAIN: ["statscollector-1-oversea.agora.io"], EVENT_REPORT_BACKUP_DOMAIN: ["statscollector-2-oversea.agora.io"], LOG_UPLOAD_SERVER: ["logservice-oversea.agora.io"], PROXY_AP: ["proxy-ap-web-oversea.agora.io"], PROXY_NGINX: ["webrtc-cloud-proxy.agora.io"] }), x(bc, S.GLOBAL, { CODE: S.GLOBAL, AP_DOMAINS: ["ap-web-1.agora.io", "ap-web-2.agora.io"], AP_BACKUP_DOMAINS: ["ap-web-3.agora.io", "ap-web-4.agora.io"], EVENT_REPORT_DOMAIN: ["webcollector-rtm.agora.io"], EVENT_REPORT_BACKUP_DOMAIN: ["webcollector-1.agora.io"], LOG_UPLOAD_SERVER: ["logservice-rtm.agora.io"], PROXY_AP: ["ap-proxy-1.agora.io", "ap-proxy-2.agora.io"], PROXY_NGINX: ["webrtc-cloud-proxy.sd-rtn.com"] }), x(bc, S.OCEANIA, { CODE: S.OCEANIA, AP_DOMAINS: ["ap-web-1-oceania.agora.io"], AP_BACKUP_DOMAINS: ["ap-web-2-oceania.agora.io"], EVENT_REPORT_DOMAIN: ["statscollector-1-oceania.agora.io"], EVENT_REPORT_BACKUP_DOMAIN: ["statscollector-2-oceania.agora.io"], LOG_UPLOAD_SERVER: ["logservice-oceania.agora.io"], PROXY_AP: ["proxy-ap-web-oceania.agora.io"], PROXY_NGINX: ["oceania.webrtc-cloud-proxy.sd-rtn.com"] }), x(bc, S.SOUTH_AMERICA, { CODE: S.SOUTH_AMERICA, AP_DOMAINS: ["ap-web-1-south-america.agora.io"], AP_BACKUP_DOMAINS: ["ap-web-2-south-america.agora.io"], EVENT_REPORT_DOMAIN: ["statscollector-1-south-america.agora.io"], EVENT_REPORT_BACKUP_DOMAIN: ["statscollector-2-south-america.agora.io"], LOG_UPLOAD_SERVER: ["logservice-south-america.agora.io"], PROXY_AP: ["proxy-ap-web-south-america.agora.io"], PROXY_NGINX: ["south-america.webrtc-cloud-proxy.sd-rtn.com"] }), x(bc, S.AFRICA, { CODE: S.AFRICA, AP_DOMAINS: ["ap-web-1-africa.agora.io"], AP_BACKUP_DOMAINS: ["ap-web-2-africa.agora.io"], EVENT_REPORT_DOMAIN: ["statscollector-1-africa.agora.io"], EVENT_REPORT_BACKUP_DOMAIN: ["statscollector-2-africa.agora.io"], LOG_UPLOAD_SERVER: ["logservice-south-africa.agora.io"], PROXY_AP: ["proxy-ap-web-africa.agora.io"], PROXY_NGINX: ["africa.webrtc-cloud-proxy.sd-rtn.com"] }), x(bc, S.CHINA, { CODE: S.CHINA, AP_DOMAINS: ["webrtc2-2.ap.sd-rtn.com"], AP_BACKUP_DOMAINS: ["webrtc2-4.ap.sd-rtn.com"], EVENT_REPORT_DOMAIN: ["web-3.statscollector.sd-rtn.com"], EVENT_REPORT_BACKUP_DOMAIN: ["web-4.statscollector.sd-rtn.com"], LOG_UPLOAD_SERVER: ["logservice-china.agora.io"], PROXY_AP: ["proxy-ap-web.agoraio.cn"], PROXY_NGINX: ["east-cn.webrtc-cloud-proxy.sd-rtn.com"] }), bc)), Zf = (Pd = {}, x(Pd, S.ASIA, [S.CHINA, S.JAPAN, S.INDIA]), x(Pd, S.EUROPE, []), x(Pd, S.NORTH_AMERICA, []), x(Pd, S.SOUTH_AMERICA, []), x(Pd, S.OCEANIA, []), x(Pd, S.AFRICA, []), Pd), Os = [S.OVERSEA, S.GLOBAL, S.CHINA, S.NORTH_AMERICA, S.EUROPE, S.ASIA, S.JAPAN, S.INDIA, S.OCEANIA, S.SOUTH_AMERICA, S.AFRICA], Nn = function(e) {
      return Object.values(Zf).flat().includes(e);
    }, Hv = function(e) {
      var t;
      return (t = qh(Zf).find(function(n) {
        return (n = $a(n, 2))[0], n[1].includes(e);
      })) === null || t === void 0 ? void 0 : t[0];
    }, eE = function(e) {
      return e.sort(function(t, n) {
        return Os.indexOf(t) - Os.indexOf(n);
      });
    }, Ve = function(e) {
      var t = /* @__PURE__ */ new Set();
      if ((e = eE(e).slice(0, 3).map(function(n) {
        var r = kh[n];
        if (r === void 0)
          throw new rc("invalid area key");
        return n = r.CODE, r = Ki(r, cE), t.add(n), r;
      })).length === 0)
        throw new rc("areas cannot be empty");
      return Wa({ CODES: t }, e.reduce(function(n, r) {
        for (var o = 0, i = qh(n); o < i.length; o++) {
          var s = $a(i[o], 2), u = s[0];
          s = s[1], n[u] = Array.from(new Set([].concat(Z(r[u]), Z(s))));
        }
        return n;
      }));
    }, fa, Ps = function() {
      var e = ma(N.mark(function t(n, r) {
        var o, i, s, u, a, l = arguments;
        return N.wrap(function(f) {
          for (; ; )
            switch (f.prev = f.next) {
              case 0:
                if (!(2 < (i = 2 < l.length && l[2] !== void 0 ? l[2] : 0))) {
                  f.next = 3;
                  break;
                }
                return f.abrupt("return");
              case 3:
                return s = { withCredentials: !0, body: n, timeout: 2e4 }, u = 0 < i ? (fa == null ? void 0 : fa.LOG_UPLOAD_SERVER[0]) || "rtm.logservice.sd-rtn.com" : (fa == null ? void 0 : fa.LOG_UPLOAD_SERVER[0]) || "logservice-rtm.agora.io", a = r ? "https://".concat((o = fa == null ? void 0 : fa.PROXY_NGINX[0]) !== null && o !== void 0 ? o : "webrtc-cloud-proxy.sd-rtn.com", "/ls/?h=").concat(u, "&p=443&d=upload/v1") : "https://".concat(u, "/upload/v1"), f.next = 8, lh(a, s).catch(function(h) {
                  return Ps(n, r, i + 1);
                });
              case 8:
              case "end":
                return f.stop();
            }
        }, t);
      }));
      return function(t, n) {
        return e.apply(this, arguments);
      };
    }(), Qs = new $D({ processId: "process-".concat(Og), sdkVersion: "Agora_RTM_SDK_for_Web_".concat("v1.5.1-0-g5bbbcd72"), uploadRequest: Ps, rtmConfig: {} }), Sl = "text payload rawMessage thumbnail attributeInfos keys value extra".split(" "), Rs = "account ticket uid detail token account fileName cname user group key origin users src dst lastUpdateUserId channel cert wan_ip".split(" "), Ss = ["serverReceivedTs", "hasPeerReceived", "messageType", "enableNotificationToChannelMembers", "lastUpdateTs"], fE = "ChannelMessage MemberLeft MessageFromPeer LocalInvitationRefused LocalInvitationAccepted RemoteInvitationCanceled PeersOnlineStatusChanged AttributesUpdated MemberJoined".split(" "), We = function(e) {
      if (typeof e == "string")
        return La(e);
      if (Array.isArray(e) && e.every(function(i) {
        return typeof i == "string";
      }))
        return e.map(function(i) {
          return La(i);
        });
      if (!Mm(e)) {
        for (var t = {}, n = 0; n < Ss.length; n++) {
          var r = Ss[n];
          r in e && (t[r] = e[r]);
        }
        if (0 < Object.keys(t).length)
          return t;
        if (5 > Object.keys(e).length) {
          for (n = 0, e = Object.entries(e); n < e.length; n++) {
            var o = $a(e[n], 2);
            r = o[0], o = o[1], Sl.includes(r) ? t[r] = "[Hidden Info]" : t[La(r)] = typeof o == "string" ? La(o) : "[Sensitive Info]";
          }
          return t;
        }
        return "[Sensitive Info]";
      }
      return e;
    }, Ts = function(e) {
      return qa(e) === "object" ? De(e) ? Zn(He(e, 5), Sl, Rs) : e.constructor && e.constructor.name : e;
    }, Us = function(e, t) {
      return e instanceof Error ? e.message : typeof e != "string" ? JSON.stringify(Zn(He(e, 5), Sl, Rs)) : (t = t.map(function(n) {
        return n instanceof Error ? n.message : qa(n) === "object" ? Ks(Array.isArray(n) ? n.map(Ts) : Ts(n)) : n;
      }), Wn.apply(void 0, [e.replace(/%[%Oo]/g, function(n) {
        return n === "%%" ? "%" : n === "%o" || n === "%O" ? "%s" : n;
      })].concat(Z(t))));
    }, gE = 1, Vs = function(e, t, n) {
      var r = Ls(e);
      return r.enabled = !0, r.log = n, r.useColors = !1, function(o) {
        for (var i = arguments.length, s = Array(1 < i ? i - 1 : 0), u = 1; u < i; u++)
          s[u - 1] = arguments[u];
        if (t.enableLogUpload) {
          i = oh(o);
          var a = Us(i, s);
          Qs.upload({ log_item_id: "".concat(gE++), log_level: e, payload_str: "[".concat(hE(), "] ").concat(e, " - ").concat(256 < a.length ? a.slice(0, 256) : a) });
        }
        switch (i = function(l) {
          var f = a || Us(oh(o), s), h = Ec.LOG_HANDLER;
          typeof h == "function" && h({ level: l, message: f }), r(f);
        }, e) {
          case "RTM:INFO":
            t.logFilter.info && i("log");
            break;
          case "RTM:WARN":
            t.logFilter.warn && i("warning");
            break;
          case "RTM:ERROR":
            t.logFilter.error && i("error");
            break;
          case "RTM:TRACK":
            t.logFilter.track && i("log");
            break;
          case "RTM:MSG:RECV":
          case "RTM:MSG:SEND":
            t.logFilter.debug && i("debug");
            break;
          case "RTM:DEBUG":
            t.logFilter.debug && i("debug");
        }
      };
    }, Tl, Ws = function(e) {
      return function(t) {
        var n = Tl === 1 || e === void 0 ? "" : "Ins#".concat(e, " ");
        return "".concat(n).concat(t);
      };
    }, Ul = function(e, t, n) {
      var r = Ws(Tl);
      return Vs("RTM:".concat(t), n, function(o) {
        return e(r(o));
      });
    }, sc = function() {
      return function(e) {
        function t(r, o) {
          var i = 2 < arguments.length && arguments[2] !== void 0 && arguments[2];
          va(this, t);
          var s = n.call(this);
          if (x(z(s), "logError", void 0), x(z(s), "invokeTracker", void 0), x(z(s), "resultTracker", void 0), x(z(s), "errorTracker", void 0), x(z(s), "eventTracker", void 0), x(z(s), "info", void 0), x(z(s), "warn", void 0), x(z(s), "log", void 0), x(z(s), "genLogger", void 0), x(z(s), "loggerId", void 0), x(z(s), "logger", void 0), x(z(s), "name", void 0), s.logger = r, s.name = o, s.loggerId = r.loggerId, s.info = r.info, s.warn = r.warn, s.logError = r.logError, s.genLogger = r.genLogger, s.log = r.genLogger("RTM:DEBUG", "<".concat(o, "> ")), s.invokeTracker = r.genTracker("Invoke"), s.eventTracker = r.genTracker("Event"), s.resultTracker = r.genTracker("Result"), s.errorTracker = r.genTracker("Error"), i) {
            var u = s.emit.bind(z(s));
            s.emit = function() {
              for (var a = arguments.length, l = Array(a), f = 0; f < a; f++)
                l[f] = arguments[f];
              a = l[0], f = l.slice(1);
              var h = fE.includes(a);
              s.eventTracker.apply(s, ["%s: ".concat(0 < f.length ? "%s emitted with args: ".concat(f.map(function() {
                return "%o";
              })) : "%s emitted"), o, a].concat(Z(h ? f.map(We) : f)));
              try {
                u.apply(void 0, l);
              } catch (d) {
                s.logError("Caught in the callback function of the event %s", a, d);
              }
            };
          }
          return s;
        }
        Ga(t, e);
        var n = Ha(t);
        return t;
      }(Ba);
    }, iE = function(e) {
      return Ul(console.log.bind(console), "INFO", e);
    }, jE = function(e) {
      return Ul(console.warn.bind(console), "WARN", e);
    }, kE = function(e) {
      return Ul(console.error.bind(console), "ERROR", e);
    }, Xs = function(e, t) {
      return function(n) {
        var r = 1 < arguments.length && arguments[1] !== void 0 ? arguments[1] : "", o = Ws(e), i = console.debug.bind(console), s = Vs(n, t, function(u) {
          return i(o(u));
        });
        return function(u) {
          for (var a = arguments.length, l = Array(1 < a ? a - 1 : 0), f = 1; f < a; f++)
            l[f - 1] = arguments[f];
          return s.apply(void 0, [r + u].concat(l));
        };
      };
    }, lE = function(e, t) {
      return function(n) {
        return Xs(e, t)("RTM:TRACK", "[".concat(n, "] "));
      };
    }, Jv = Object.freeze({ __proto__: null, Counter: 1, ApiExec: 154, Session: 164, ApEvent: 165, Link: 166, Logout: 167, TxMessage: 168, RxMessage: 169, KickedOff: 170, TxMessageRes: 171, ChnJoin: 172, ChnJoinRes: 173, ChnLeave: 174, ChnGetMembers: 175, ChnGetMembersRes: 176, ChnMemberJoined: 177, ChnMemberLeft: 178, QueryPeersOnlineStatus: 179, QueryPeersOnlineStatusRes: 180, RenewToken: 181, OperateAttribute: 186, OperateAttributeRes: 187, ApRequest: 188, LinkTcpEvent: 189, LinkLoginRequest: 190, ConnectionStateChange: 191, RtmSdkMessageCount: 510, default: { Counter: 1, ApiExec: 154, Session: 164, ApEvent: 165, Link: 166, Logout: 167, TxMessage: 168, RxMessage: 169, KickedOff: 170, TxMessageRes: 171, ChnJoin: 172, ChnJoinRes: 173, ChnLeave: 174, ChnGetMembers: 175, ChnGetMembersRes: 176, ChnMemberJoined: 177, ChnMemberLeft: 178, QueryPeersOnlineStatus: 179, QueryPeersOnlineStatusRes: 180, RenewToken: 181, OperateAttribute: 186, OperateAttributeRes: 187, ApRequest: 188, LinkTcpEvent: 189, LinkLoginRequest: 190, ConnectionStateChange: 191, RtmSdkMessageCount: 510 } }), Ka;
    (function(e) {
      e[e.ChannelSMsg = 1] = "ChannelSMsg", e[e.ChannelRMsg = 2] = "ChannelRMsg", e[e.P2pSMsgOfflineFlag = 3] = "P2pSMsgOfflineFlag", e[e.P2pRMsgOfflineFlag = 4] = "P2pRMsgOfflineFlag", e[e.P2pSMsgNoOfflineFlag = 5] = "P2pSMsgNoOfflineFlag", e[e.P2pRMsgNoOfflineFlag = 6] = "P2pRMsgNoOfflineFlag", e[e.P2pCallInvitation = 7] = "P2pCallInvitation", e[e.P2pCallCancellation = 8] = "P2pCallCancellation", e[e.P2pCallAcceptance = 9] = "P2pCallAcceptance", e[e.P2pCallRefusal = 10] = "P2pCallRefusal";
    })(Ka || (Ka = {}));
    var zi = function(e) {
      function t(r, o, i) {
        return va(this, t), x(z(o = n.call(this, o, "MessageReport")), "messagecount", o.getInitMessageCount()), x(z(o), "context", void 0), x(z(o), "rtmMessageCategory", void 0), x(z(o), "seq", P.fromNumber(1, !0)), o.context = r, o.rtmMessageCategory = i, o;
      }
      Ga(t, e);
      var n = Ha(t);
      return eb(t, [{ key: "incGetSeq", value: function() {
        return this.seq = this.seq.add(1);
      } }, { key: "getInitMessageCount", value: function() {
        return { peerack10mscount: P.fromNumber(0), peerack25mscount: P.fromNumber(0), peerack50mscount: P.fromNumber(0), peerack75mscount: P.fromNumber(0), peerack100mscount: P.fromNumber(0), peerack150mscount: P.fromNumber(0), peerack200mscount: P.fromNumber(0), peerack250mscount: P.fromNumber(0), peerack300mscount: P.fromNumber(0), peerack400mscount: P.fromNumber(0), peerack500mscount: P.fromNumber(0), peerack600mscount: P.fromNumber(0), peerack800mscount: P.fromNumber(0), peerack1000mscount: P.fromNumber(0), peerack2000mscount: P.fromNumber(0), peerack3000mscount: P.fromNumber(0), peerack5000mscount: P.fromNumber(0), peerack7000mscount: P.fromNumber(0), peerackslowcount: P.fromNumber(0), norecipientack10mscount: P.fromNumber(0), norecipientack25mscount: P.fromNumber(0), norecipientack50mscount: P.fromNumber(0), norecipientack75mscount: P.fromNumber(0), norecipientack100mscount: P.fromNumber(0), norecipientack150mscount: P.fromNumber(0), norecipientack200mscount: P.fromNumber(0), norecipientack250mscount: P.fromNumber(0), norecipientack300mscount: P.fromNumber(0), norecipientack400mscount: P.fromNumber(0), norecipientack500mscount: P.fromNumber(0), norecipientack600mscount: P.fromNumber(0), norecipientack800mscount: P.fromNumber(0), norecipientack1000mscount: P.fromNumber(0), norecipientack2000mscount: P.fromNumber(0), norecipientack3000mscount: P.fromNumber(0), norecipientack5000mscount: P.fromNumber(0), norecipientack7000mscount: P.fromNumber(0), norecipientackslowcount: P.fromNumber(0), sentcount: P.fromNumber(0), receivedcount: P.fromNumber(0), acktimeoutcount: P.fromNumber(0), toooftencount: 0, receiverofflinecount: 0, invalidmessagecount: 0, unknowerrorcount: 0, servercachedcount: 0, timeoutcount: 0, successcount: 0 };
      } }, { key: "updatePeerAckCount", value: function(r) {
        r /= 2;
        for (var o = [[0, 10], [10, 25], [25, 50], [50, 75], [75, 100], [100, 150], [150, 200], [200, 250], [250, 300], [300, 400], [400, 500], [500, 600], [600, 800], [800, 1e3], [1e3, 2e3], [2e3, 3e3], [3e3, 5e3], [5e3, 7e3]], i = 0; i < o.length; i++) {
          var s, u = o[i];
          if (Is(r, u[0], u[1]))
            u = "peerack".concat(u[1], "mscount"), this.messagecount[u] = (s = this.messagecount[u]) === null || s === void 0 ? void 0 : s.add(1);
          else if (7e3 < r) {
            var a;
            this.messagecount.peerackslowcount = (a = this.messagecount.peerackslowcount) === null || a === void 0 ? void 0 : a.add(1);
          }
        }
      } }, { key: "updateNorecipientackCount", value: function(r) {
        r /= 2;
        for (var o = [[0, 10], [10, 25], [25, 50], [50, 75], [75, 100], [100, 150], [150, 200], [200, 250], [250, 300], [300, 400], [400, 500], [500, 600], [600, 800], [800, 1e3], [1e3, 2e3], [2e3, 3e3], [3e3, 5e3], [5e3, 7e3]], i = 0; i < o.length; i++) {
          var s, u = o[i];
          if (Is(r, u[0], u[1]))
            u = "norecipientack".concat(u[1], "mscount"), this.messagecount[u] = (s = this.messagecount[u]) === null || s === void 0 ? void 0 : s.add(1);
          else if (7e3 < r) {
            var a;
            this.messagecount.norecipientackslowcount = (a = this.messagecount.norecipientackslowcount) === null || a === void 0 ? void 0 : a.add(1);
          }
        }
      } }, { key: "updateCommonCount", value: function(r) {
        var o = this.messagecount[r];
        P.isLong(o) ? this.messagecount[r] = o.add(1) : this.messagecount[r] = o + 1;
      } }, { key: "report", value: function() {
        var r, o;
        bb("RtmSdkMessageCount", new Js(Wa(Wa({}, this.messagecount), {}, { vid: P.fromString((r = this.context.vid) !== null && r !== void 0 ? r : "0"), os: 7, lts: P.fromNumber(Date.now()), sid: this.context.sid, reportsequence: this.incGetSeq(), apimajorversion: 4, apiminorversion: 18, userid: this.context.uid, messagecategory: this.rtmMessageCategory })), (o = this.context.config.enableCloudProxy) !== null && o !== void 0 && o), this.messagecount = Wa(Wa({}, this.messagecount), {}, { toooftencount: 0, receiverofflinecount: 0, invalidmessagecount: 0, unknowerrorcount: 0, servercachedcount: 0, timeoutcount: 0, successcount: 0 });
      } }]), t;
    }(sc()), Un = /* @__PURE__ */ new Map(), hE = function() {
      var e = /* @__PURE__ */ new Date();
      return "".concat(e.toISOString().split("T")[1].replace(/\..+/, ""), ".").concat(e.getMilliseconds());
    }, Yf = Object.keys, qh = Object.entries.bind(Object), oh = function(e) {
      return typeof e == "string" ? e.endsWith(".") ? e : "".concat(e, ".") : e;
    }, yj = I.URI, Nv = wi, mE = Ki(oD, ["Wrapper"]), bo = ql(mE, "URI"), Ys = function(e, t) {
      var n = -1, r = e.length, o = r - 1;
      for (t = t === void 0 ? r : t; ++n < t; ) {
        var i = e[r = os(n, o)];
        e[r] = e[n], e[n] = i;
      }
      return e.length = t, e;
    }, nE = function(e) {
      return Ys(Pi(e));
    }, oE = function(e) {
      return Ys(zj(e));
    }, Cf = function(e) {
      return (ub(e) ? nE : oE)(e);
    }, Df = { 0: 9591, 1: 9593 }, xe = function(e) {
      var t = $f(null);
      return "https://".concat(t ? null : e, "/api/v1");
    }, pE = ob.apply(void 0, Z(Cf(["web-1.ap.sd-rtn.com", "web-2.ap.sd-rtn.com"].map(xe)))), qE = ob.apply(void 0, Z(Cf(["ap-web-1.agora.io", "ap-web-2.agora.io"].map(xe)))), rE = ob.apply(void 0, Z(Cf(["web-3.ap.sd-rtn.com", "web-4.ap.sd-rtn.com"].map(xe)))), sE = ob.apply(void 0, Z(Cf(["ap-web-3.agora.io", "ap-web-4.agora.io"].map(xe)))), Zs = yi(), Vl = function(e) {
      function t(r, o, i, s, u, a) {
        var l, f;
        va(this, t);
        var h = n.call(this, u, uj("Socket-", u.loggerId));
        if (x(z(h), "isActiveClose", !1), x(z(h), "loggedIn", !1), x(z(h), "useNewDomain", void 0), x(z(h), "receivedPacket", new rb()), x(z(h), "open$", void 0), x(z(h), "input$", new rb()), x(z(h), "userJoin$", new rb()), x(z(h), "attemptsSinceLastError", 0), x(z(h), "message$", new rb()), x(z(h), "socket$", void 0), x(z(h), "toClose", new rb()), x(z(h), "toReconnect", new rb()), x(z(h), "sendLogger", void 0), x(z(h), "receiveLogger", void 0), x(z(h), "ip", void 0), x(z(h), "env", void 0), x(z(h), "ticket", void 0), x(z(h), "context", void 0), x(z(h), "getDomain", function() {
          return co(h.ip, h.useNewDomain);
        }), x(z(h), "socketReconnector", function(v) {
          var y = function(g) {
            return h.attemptsSinceLastError += 1, h.warn("The %s of Env %d reconnecting %s", h.name, h.env, g.message), dd(3e3);
          };
          return v.pipe(ab(function(g) {
            return h.log("socket connection closed"), h.loggedIn = !1, 2 <= h.attemptsSinceLastError ? (h.warn("socket connection failure"), h.emit("connectionFailure"), h.close(), ra(g)) : h.isActiveClose ? Sb : (h.emit("reconnect"), h.useNewDomain = !h.useNewDomain, ra(g));
          }), Re(function(g) {
            return g.pipe(Kb(y));
          }));
        }), h.ip = r, h.env = o, h.ticket = i, h.context = s, h.useNewDomain = a != null ? a : 0.5 <= Math.random(), h.sendLogger = h.genLogger("RTM:MSG:SEND"), h.receiveLogger = h.genLogger("RTM:MSG:RECV"), o !== 0 && o !== 1)
          throw new Zs({ ILLEGAL_RTM_ENV: "The env number is out of rtm env count" });
        var d = Df[o];
        h.log("Opening websocket address %s for the Env %d", h.ip, h.env), bb("LinkLoginRequest", { sid: h.context.sid, userId: h.context.uid, lts: P.fromNumber(Date.now()), elapse: Xa(h.context.startTime), destServerIp: h.ip, linkId: h.env }, (l = h.context.config.enableCloudProxy || h.context.socketUseProxy) !== null && l !== void 0 && l), bb("LinkLoginRequest", { sid: h.context.sid, userId: h.context.uid, lts: P.fromNumber(Date.now()), elapse: Xa(h.context.startTime), destServerIp: h.ip, linkId: h.env }, (f = h.context.config.enableCloudProxy || h.context.socketUseProxy) !== null && f !== void 0 && f);
        var p = Jb(h.input$, h.userJoin$.pipe(Av(2)), h.message$).pipe(Ea(function(v) {
          return wi.encode(v).finish();
        }));
        return r = Jb(Bv("", { protocols: [], makeWebSocket: function() {
          if (h.context.config.enableCloudProxy || h.context.socketUseProxy) {
            if (h.context.cloudProxyServers.length === 0)
              throw h.logError("No cloud proxy server to connect"), new Ja();
            var v = $f(null) ? JSON.parse(null.replace(/-/g, ".")) : h.context.cloudProxyServers;
            v = Xe(v = "wss://".concat(co(On(v), !1), "/"), "sid", h.context.sid), v = Xe(v, "remote_port", d.toString()), v = Xe(v, "remote_ip", h.ip), v = Xe(v, "token", h.context.key), v = new WebSocket(v);
          } else
            v = new WebSocket("wss://".concat(h.getDomain(), ":").concat(d));
          return v.binaryType = "arraybuffer", v;
        } }), h.toReconnect), h.socket$ = fb(r, Dl.pipe(Lb(7e3), ab(function(v) {
          return Ab(v) && h.warn("socket open timed out"), ra(v);
        }))).pipe(Ea(function(v) {
          if (v instanceof Error)
            throw h.warn("Env_%d: Force reconnect the socket", h.env), v;
          return v(p).pipe(Ea(function(y) {
            return wi.decode(new Uint8Array(y));
          }));
        }), h.socketReconnector), h.open$ = h.socket$.pipe(sa(function(v) {
          h.log("Websocket opened", h.name), v.subscribe(function(y) {
            var g = y.data;
            y = yj[y.uri].slice(0, -3), g = bo[y].decode(g);
            var m = eC({}, ql(g, "toJSON"), function(q, J) {
              return J instanceof P ? Tn(J) : J;
            }), E = !1;
            if ((g instanceof ws || g instanceof vs) && g.instance.lessThanOrEqual(4294967295) && (E = !0), g instanceof xs || g instanceof ys) {
              var w = g.instance, C = g.sequence;
              (g.dialogue.lessThanOrEqual(4294967295) || w.lessThanOrEqual(4294967295) || C.lessThan(1)) && (E = !0);
            }
            E ? h.warn("Env_%d: Illegal %s, abandoned %o", h.env, y, m) : (y !== "Pong" && h.receiveLogger("Env_%d: %s %o", h.env, y, m), h.receivedPacket.next([y, g]));
          }, function() {
          });
        }), Uf(void 0), Kc(h.toClose), Se()), h;
      }
      Ga(t, e);
      var n = Ha(t);
      return eb(t, [{ key: "address", get: function() {
        return "".concat(this.ip, ":").concat(Df[this.env]);
      } }, { key: "sendPacket", value: function(r, o) {
        if (r !== "Ping") {
          var i = md(o, function(s) {
            return s instanceof P ? Tn(s) : s;
          });
          this.sendLogger("Env_%d: %s %o", this.env, r, i);
        }
        o = Mv(r, o), r === "UserJoin" ? this.userJoin$.next(o) : r === "Message" ? this.message$.next(o) : this.input$.next(o);
      } }, { key: "close", value: function() {
        this.isActiveClose = !0, this.loggedIn = !1, this.toClose.next();
      } }, { key: "fromReceived", value: function(r) {
        return this.receivedPacket.pipe(yb(function(o) {
          return $a(o, 1)[0] === r;
        }), Ea(function(o) {
          return $a(o, 2)[1];
        }));
      } }, { key: "forceReconnect", value: function() {
        this.toReconnect.next(new Zs({ FORCE_RECONNECTING: "Connection seems broken, try force reconnecting" }));
      } }]), t;
    }(sc());
    ea({ target: "String", proto: !0, forced: As }, { padStart: function(e) {
      return qD(this, e, 1 < arguments.length ? arguments[1] : void 0);
    } });
    var tE = function(e) {
      var t = Yf(kh);
      e = Lv(e);
      for (var n = 0; n < t.length; n++) {
        var r = kh[t[n]];
        if (r != null && r.AP_DOMAINS.includes(e) || r != null && r.AP_BACKUP_DOMAINS.includes(e) || r != null && r.PROXY_AP.includes(e))
          return [r.CODE];
      }
      return [S.CHINA, S.GLOBAL];
    }, uE = { INVALID_APP_ID: "Illegal App ID", NO_AUTHORIZED: "Signature verification failed", TOKEN_TIMEOUT: "Dynamic key expired", INVALID_TOKEN_UID: "UID in the security key(token) is not valid", APP_ID_NO_ACTIVATED: "The vendor is not activated", DYNAMIC_KEY_NOT_ENABLED: "The vendor did not enable the dynamic key, but uses the dynamic key", DYNAMIC_ENABLED_BUT_STATIC_KEY: "The vendor enabled the dynamic key, but uses the static key", TOKEN_EXPIRED: "The token has expired", INVALID_USER_ID: "The user ID to login does not match the token", FORBIDDEN_REGION: "Forbidden to access the request in this area", CANNOT_MEET_AREA_DEMAND: "Cannot allocate to meet the requirements of the given area limit" }, $s = { 5: "INVALID_APP_ID", 7: "INVALID_USER_ID", 9: "NO_AUTHORIZED", 10: "TOKEN_TIMEOUT", 11: "APP_ID_NO_ACTIVATED", 12: "INVALID_TOKEN_UID", 13: "TOKEN_EXPIRED", 14: "DYNAMIC_KEY_NOT_ENABLED", 15: "DYNAMIC_ENABLED_BUT_STATIC_KEY", 18: "FORBIDDEN_REGION", 19: "CANNOT_MEET_AREA_DEMAND" }, vE = [100, 101, 102], Ai = /web-(\d)/, at = function(e) {
      function t(r, o) {
        var i = 2 < arguments.length && arguments[2] !== void 0 && arguments[2];
        va(this, t);
        var s = n.call(this, o, "AccessPoint");
        return x(z(s), "handleUniLbsError", function(u, a) {
          var l = u;
          if (4 < u.toString().length) {
            var f = u.toString().padStart(8, "0"), h = parseInt(f.slice(0, 4), 10);
            if (f = parseInt(f.slice(4, 8), 10), h === 201)
              l = f;
            else if (h === 101 && !vE.includes(f))
              return ra(Error("service is currently unavailable"));
          }
          if (h = l.toString(), !Object.keys($s).includes(h))
            return (u = new Ja(["Login is rejected by the server. The response code is %d", u], Pg)).serverCode = l, ra(u);
          switch (h = $s[h], l = uE[h], h) {
            case "INVALID_APP_ID":
            case "APP_ID_NO_ACTIVATED":
              return (a = new Bf(l, as)).serverCode = u, ra(a);
            case "INVALID_USER_ID":
              return (a = new Bf(l, si)).serverCode = u, ra(a);
            case "TOKEN_EXPIRED":
            case "TOKEN_TIMEOUT":
              return (a = new Bf(l, ti)).serverCode = u, ra(a);
            case "NO_AUTHORIZED":
            case "INVALID_TOKEN_UID":
            case "DYNAMIC_KEY_NOT_ENABLED":
            case "DYNAMIC_ENABLED_BUT_STATIC_KEY":
              return (a = new Bf(l, bs)).serverCode = u, ra(a);
            case "CANNOT_MEET_AREA_DEMAND":
              return (a = tE(a)).forEach(function(d) {
                return s.failedAreas.add(d);
              }), s.failedAreas.size === (fa === void 0 ? 2 : fa.CODES.size) ? ((a = new ca(l, Pg)).serverCode = u, ra(a)) : ra(Error("ap ".concat(a.join(", "), " cannot meet requirement")));
            case "FORBIDDEN_REGION":
              return (a = new Ja(l, Pg)).serverCode = u, ra(a);
            default:
              return ra(Rn("ApResErrType", h));
          }
        }), x(z(s), "getApEdgeInfo$", void 0), x(z(s), "getApEdgeInfoEndFirst$", void 0), x(z(s), "apFinish$", new rb()), x(z(s), "retryCount", 0), x(z(s), "failedAreas", /* @__PURE__ */ new Set()), x(z(s), "usedUrl", []), x(z(s), "newDomainUsed", !1), x(z(s), "backupNewDomainUsed", !1), x(z(s), "genUrl", function() {
          return fa === void 0 ? ej.apply(void 0, Z(Cf([pE, qE]))).pipe(fj(function(u) {
            return ob.apply(void 0, Z(u));
          })) : ob.apply(void 0, Z(fa.AP_DOMAINS.slice(0, 3).map(xe)));
        }), x(z(s), "genBackupUrl", function() {
          return fa === void 0 ? ej.apply(void 0, Z(Cf([rE, sE]))).pipe(fj(function(u) {
            return ob.apply(void 0, Z(u));
          })) : ob.apply(void 0, Z(fa.AP_BACKUP_DOMAINS.slice(0, 3).map(xe)));
        }), x(z(s), "getApUrl$", function(u) {
          var a, l;
          return s.genUrl().pipe(yb(function(f) {
            return (!s.newDomainUsed || !f.includes("sd-rtn.com")) && (f.includes("sd-rtn.com") && (s.newDomainUsed = !0), !Ol(s.usedUrl, function(h) {
              var d;
              return h === ((d = f.match(Ai)) === null || d === void 0 ? void 0 : d[1]);
            }));
          }), sa(function(f) {
            var h;
            fa === void 0 && typeof (f = (h = f.match(Ai)) === null || h === void 0 ? void 0 : h[1]) == "string" && s.usedUrl.push(f);
          }), hb(u ? Math.max(Ec.RECONNECTING_AP_NUM, (a = fa == null ? void 0 : fa.CODES.size) !== null && a !== void 0 ? a : 0) : (l = fa == null ? void 0 : fa.CODES.size) !== null && l !== void 0 ? l : 2), $d(function() {
            return t.runOutOfUrlSymbol;
          }), ab(function(f, h) {
            return s.newDomainUsed = !1, f === t.runOutOfUrlSymbol ? (s.usedUrl = [], h) : ra(f);
          }));
        }), x(z(s), "getBackupApUrl$", function(u) {
          var a, l;
          return s.genBackupUrl().pipe(yb(function(f) {
            return (!s.backupNewDomainUsed || !f.includes("sd-rtn.com")) && (f.includes("sd-rtn.com") && (s.backupNewDomainUsed = !0), !Ol(s.usedUrl, function(h) {
              var d;
              return h === ((d = f.match(Ai)) === null || d === void 0 ? void 0 : d[1]);
            }));
          }), sa(function(f) {
            var h;
            fa === void 0 && typeof (f = (h = f.match(Ai)) === null || h === void 0 ? void 0 : h[1]) == "string" && s.usedUrl.push(f);
          }), hb(u ? Math.max(Ec.RECONNECTING_AP_NUM, (a = fa == null ? void 0 : fa.CODES.size) !== null && a !== void 0 ? a : 0) : (l = fa == null ? void 0 : fa.CODES.size) !== null && l !== void 0 ? l : 2), $d(function() {
            return t.runOutOfUrlSymbol;
          }), ab(function(f, h) {
            return s.backupNewDomainUsed = !1, f === t.runOutOfUrlSymbol ? (s.usedUrl = [], h) : ra(f);
          }));
        }), x(z(s), "getProxyApUrl$", function(u) {
          var a, l;
          return ob.apply(void 0, Z(((fa == null ? void 0 : fa.PROXY_AP.slice(0, 3)) || ["ap-proxy-1.agora.io", "ap-proxy-2.agora.io"]).map(xe))).pipe(hb(u ? Math.max(Ec.RECONNECTING_AP_NUM, (a = fa == null ? void 0 : fa.CODES.size) !== null && a !== void 0 ? a : 0) : (l = fa == null ? void 0 : fa.CODES.size) !== null && l !== void 0 ? l : 2));
        }), x(z(s), "context", void 0), x(z(s), "fetchCloudProxy", function(u, a) {
          var l = uj("AP-", s.loggerId);
          s.log("The AccessPoint requests %s(%s)", u, l);
          var f, h = new AbortController();
          return s.apFinish$.pipe(hb(1)).subscribe(function() {
            return h.abort();
          }), yd(ma(N.mark(function d() {
            var p, v;
            return N.wrap(function(y) {
              for (; ; )
                switch (y.prev = y.next) {
                  case 0:
                    return v = mh(0, Number.MAX_SAFE_INTEGER), s.log("%s request opid: %d", l, v), bb("ApRequest", { sid: s.context.sid, userId: s.context.uid, lts: P.fromNumber(Date.now()), elapse: Xa(s.context.startTime), apAddr: u, opId: P.fromNumber(v), envId: 0, flag: 128 }, (p = s.context.config.enableCloudProxy) !== null && p !== void 0 && p), y.abrupt("return", lh(u, { headers: { "X-Packet-Service-Type": "0", "X-Packet-URI": "90", "Content-Type": "application/json" }, body: { sid: s.context.sid, opid: v, appid: s.context.appId, client_ts: Math.ceil(Date.now() / 1e3), request_bodies: [{ uri: 22, buffer: { service_ids: [7, 16], key: a != null ? a : s.context.key, cname: s.context.uid, uid: 0, detail: Wa({}, fa === void 0 ? { 11: [S.CHINA, S.GLOBAL].join(), 12: "1" } : { 11: Array.from(fa.CODES).map(function(g) {
                      return g === S.OVERSEA ? "".concat(S.ASIA, ",").concat(S.EUROPE, ",").concat(S.AFRICA, ",").concat(S.NORTH_AMERICA, ",").concat(S.SOUTH_AMERICA, ",").concat(S.OCEANIA) : g;
                    }).join(","), 12: "1" }) } }] }, signal: h.signal }));
                  case 4:
                  case "end":
                    return y.stop();
                }
            }, d);
          }))).pipe(ab(function(d) {
            return d.name !== "AbortError" && (s.logError(d), s.warn("The AP server %s request failure", u, d)), Sb;
          }), Cb((f = ma(N.mark(function d(p) {
            var v, y, g, m, E, w, C, q, J, B, Y, _e, k, L, T, U, O, _, A;
            return N.wrap(function(j) {
              for (; ; )
                switch (j.prev = j.next) {
                  case 0:
                    if (v = p.responseText, y = JSON.parse(v), s.log("The %s response is %o", l, y), ((g = y.response_body) === void 0 || g.length === 0 || g.some(function(F) {
                      var X;
                      return ((X = F.buffer) === null || X === void 0 ? void 0 : X.code) === void 0 || F.uri !== 23;
                    })) && ra(new Ja("cloud proxy response_body not valid", Pg)), (m = g.filter(function(F) {
                      return F.buffer.code !== 0;
                    })).length === 0) {
                      j.next = 14;
                      break;
                    }
                    if ((E = m.find(function(F) {
                      return F.buffer.flag === 128;
                    })) === void 0) {
                      j.next = 12;
                      break;
                    }
                    return j.abrupt("return", s.handleUniLbsError(E.buffer.code, u));
                  case 12:
                    return s.logError("cloud proxy error response"), j.abrupt("return", s.handleUniLbsError(m[0].buffer.code, u));
                  case 14:
                    for (w = [], C = 0; C < g.length; C++)
                      if (((B = g[C]) == null || (q = B.buffer) === null || q === void 0 ? void 0 : q.flag) === 262144)
                        (Y = B.buffer) === null || Y === void 0 || (_e = Y.edges_services) === null || _e === void 0 || (k = _e.forEach) === null || k === void 0 || k.call(_e, function(F) {
                          Pn(F = F.ip) && s.context.cloudProxyServers.indexOf(F) === -1 && (s.log("got cloud proxy server: %s", F), s.context.cloudProxyServers.push(F));
                        });
                      else if ((B == null || (J = B.buffer) === null || J === void 0 ? void 0 : J.flag) === 128) {
                        for (O = function(F, X) {
                          var K = X[F];
                          w.some(function(Q) {
                            return Q.ip === K.ip;
                          }) || w.push({ ip: K.ip, ticket: B.buffer.cert });
                        }, _ = 0, A = B.buffer.edges_services; _ < A.length; _++)
                          O(_, A);
                        s.context.rtmArea = (L = (T = B.buffer) === null || T === void 0 || (U = T.detail) === null || U === void 0 ? void 0 : U[9]) !== null && L !== void 0 ? L : "";
                      }
                    return j.abrupt("return", ob.apply(void 0, Z(w).concat([Mg])));
                  case 19:
                  case "end":
                    return j.stop();
                }
            }, d);
          })), function(d) {
            return f.apply(this, arguments);
          })), ab(function(d) {
            return Na(d) ? ra(d) : Sb;
          }), bh(), yb(function(d) {
            return d !== void 0 && typeof d.ip == "string" && typeof d.ticket == "string" && Pn(d.ip);
          }));
        }), x(z(s), "fetchAp", function(u, a) {
          var l = uj("AP-", s.loggerId);
          s.log("The AccessPoint requests %s(%s)", u, l);
          var f = new AbortController();
          s.apFinish$.pipe(hb(1)).subscribe(function() {
            return f.abort();
          });
          var h, d = mh(0, Number.MAX_SAFE_INTEGER);
          return yd(ma(N.mark(function p() {
            var v;
            return N.wrap(function(y) {
              for (; ; )
                switch (y.prev = y.next) {
                  case 0:
                    return s.log("%s request opid: %d", l, d), bb("ApRequest", { sid: s.context.sid, userId: s.context.uid, lts: P.fromNumber(Date.now()), elapse: Xa(s.context.startTime), apAddr: u, opId: P.fromNumber(d), envId: 0, flag: 128 }, (v = s.context.config.enableCloudProxy) !== null && v !== void 0 && v), y.abrupt("return", lh(u, { headers: { "X-Packet-Service-Type": "0", "X-Packet-URI": "69", "Content-Type": "application/json" }, body: { flag: 128, opid: d, key: a || s.context.key, cname: s.context.uid, detail: Wa({}, fa === void 0 ? { 11: [S.CHINA, S.GLOBAL].join(), 12: "1" } : { 11: Array.from(fa.CODES).map(function(g) {
                      return g === S.OVERSEA ? "".concat(S.ASIA, ",").concat(S.EUROPE, ",").concat(S.AFRICA, ",").concat(S.NORTH_AMERICA, ",").concat(S.SOUTH_AMERICA, ",").concat(S.OCEANIA) : g;
                    }).join(","), 12: "1" }), uid: 0, sid: s.context.sid }, signal: f.signal }));
                  case 3:
                  case "end":
                    return y.stop();
                }
            }, p);
          }))).pipe(ab(function(p) {
            return p.name !== "AbortError" && (s.logError(p), s.warn("The AP server %s request failure", u, p)), Sb;
          }), Cb((h = ma(N.mark(function p(v) {
            var y, g, m, E, w, C, q, J, B;
            return N.wrap(function(Y) {
              for (; ; )
                switch (Y.prev = Y.next) {
                  case 0:
                    if (g = v.responseText, m = JSON.parse(g), s.log("The %s response is %o", l, m), w = (E = m).code, C = E.addresses, q = E.detail, s.context.vid = q[8], bb("ApEvent", { sid: s.context.sid, userId: s.context.uid, lts: P.fromNumber(Date.now()), elapse: Xa(s.context.startTime), apAddr: u, linkServerList: C.map(function(_e) {
                      return _e.ip;
                    }), serverErrCode: w, flag: 128, envId: 0, opId: P.fromNumber(d), errCode: 0, area: q[9], isp: q[2] }, (y = s.context.config.enableCloudProxy) !== null && y !== void 0 && y), s.info(m), w === 0) {
                      Y.next = 9;
                      break;
                    }
                    return Y.abrupt("return", s.handleUniLbsError(w, u));
                  case 9:
                    if (J = C, $f(null) && (B = JSON.parse(null.replace(/-/g, ".")), J = B.map(function(_e) {
                      return { ip: _e, ticket: J[0].ticket };
                    })), J.length !== 0) {
                      Y.next = 14;
                      break;
                    }
                    return Y.abrupt("return", ra(Error("No available edge address to connect")));
                  case 14:
                    return s.context.rtmArea = q == null ? void 0 : q[9], Y.abrupt("return", ob.apply(void 0, Z(J).concat([Mg])));
                  case 16:
                  case "end":
                    return Y.stop();
                }
            }, p);
          })), function(p) {
            return h.apply(this, arguments);
          })), bh(), ab(function(p) {
            return Na(p) ? ra(p) : Sb;
          }), yb(function(p) {
            return p !== void 0 && typeof p.ip == "string" && typeof p.ticket == "string";
          }));
        }), s.context = r, s.getApEdgeInfoEndFirst$ = function() {
          var u = 0 < arguments.length && arguments[0] !== void 0 && arguments[0];
          return dd(0, u || i ? Ec.RECONNECTING_AP_INTERVAL : 2e3).pipe(hb(1), sa(function() {
            s.retryCount += 1;
          }), Cb(function() {
            return s.context.config.enableCloudProxy || s.context.socketUseProxy ? s.getProxyApUrl$(u || i) : (4 <= s.retryCount && (s.retryCount = 0), 3 >= s.retryCount ? s.getApUrl$(u || i) : s.getBackupApUrl$(u || i));
          }), Cb(function(a) {
            return s.context.config.enableCloudProxy || s.context.socketUseProxy ? s.fetchCloudProxy(a) : s.fetchAp(a);
          }), ab(function(a) {
            return a instanceof Tb && s.warn("AP request timeout"), ra(a);
          }), tn(function(a) {
            return a.ip;
          }), Kc(s.apFinish$));
        }, s.getApEdgeInfo$ = function(u) {
          return dd(0, u || i ? Ec.RECONNECTING_AP_INTERVAL : 2e3).pipe(hb(8), sa(function() {
            s.retryCount += 1;
          }), Cb(function() {
            return s.context.config.enableCloudProxy || s.context.socketUseProxy ? s.getProxyApUrl$(u || i) : 3 >= s.retryCount ? s.getApUrl$(u || i) : s.getBackupApUrl$(u || i);
          }), Cb(function(a) {
            return (s.context.config.enableCloudProxy || s.context.socketUseProxy ? s.fetchCloudProxy(a) : s.fetchAp(a)).pipe();
          }), ab(function(a) {
            return a instanceof Tb && s.warn("AP request timeout"), ra(a);
          }), tn(function(a) {
            return a.ip;
          }), Kc(s.apFinish$));
        }, s;
      }
      Ga(t, e);
      var n = Ha(t);
      return eb(t, [{ key: "clearUp", value: function() {
        this.failedAreas.clear(), this.retryCount = 0;
      } }]), t;
    }(sc());
    x(at, "runOutOfUrlSymbol", Symbol("AP urls are used up"));
    var bt = yi(), ct = function(e) {
      function t(r, o, i) {
        va(this, t);
        var s = n.call(this, o, "Connection");
        x(z(s), "apClient", void 0), x(z(s), "lastOpenSockets", [new Te(1), new Te(1)]), x(z(s), "curOpenSockets", [void 0, void 0]), x(z(s), "ipIterator", 0), x(z(s), "loginSocketOpenFailureCount", 0), x(z(s), "firstEnv", 0.5 <= Math.random() ? 1 : 0), x(z(s), "firstSocketOpener", void 0), x(z(s), "secondSocketOpener", void 0), x(z(s), "firstOpenKeeperSubject", new rb()), x(z(s), "secondOpenKeeperSubject", new rb()), x(z(s), "blacklistedIP", {}), x(z(s), "edgeInfoReplayed", void 0), x(z(s), "firstEnvOpenSocket", void 0), x(z(s), "firstOpenKeeperSub", void 0), x(z(s), "secondOpenKeeperSub", void 0), x(z(s), "context", void 0), x(z(s), "logger", void 0), s.context = r, s.logger = o, s.apClient = new at(s.context, o), s.apClient.apFinish$.subscribe(function() {
          s.log("Ap client fetch finished");
        });
        var u, a = [];
        return s.edgeInfoReplayed = s.apClient.getApEdgeInfo$(i).pipe(Re(function(l) {
          return l.pipe(sa(function(f) {
            if (Na(f))
              throw f;
          }), Zd(i ? ue.getParameter("RECONNECTING_AP_INTERVAL") : 900), Kc(dd(2e4)));
        }), yb(function(l) {
          var f;
          return !Ol(a, l) && 1 >= ((f = s.blacklistedIP[l.ip]) !== null && f !== void 0 ? f : 0);
        }), $d(function() {
          return new bt({ AP_NO_AVAILABLE_EDGE: "No available edge address to connect" });
        }), sa(function(l) {
          a.push(l), s.log("An edge info got %o", l);
        }), sa({ error: function(l) {
          s.emit("connectionInitFailure", l);
        } }), fh(function() {
          s.apClient.clearUp();
        }), wn()), s.firstEnvOpenSocket = s.edgeInfoReplayed.pipe(Cb(function(l) {
          if (l === void 0)
            return ra(Error("Invalid edge info"));
          var f = new Vl(l.ip, s.firstEnv, l.ticket, s.context, o, u);
          if (s.firstEnv = s.firstEnv === 1 ? 0 : 1, f.once("connectionFailure", function() {
            return s.onSocketConnectionFailure(f);
          }), !i && Ec.ENABLE_EDGE_AUTO_FALLBACK && !s.context.config.enableCloudProxy) {
            var h, d = Date.now();
            f.on("reconnect", function() {
              var p;
              s.loginSocketOpenFailureCount += 1, (p = h) !== null && p !== void 0 || (h = Date.now() - d), 500 > h && 1 < s.loginSocketOpenFailureCount && (s.context.socketUseProxy = !0);
            });
          }
          return u = !f.useNewDomain, f.open$.pipe(Uf(f));
        }), sa(function(l) {
          s.log("The websocket of ENV_%d opened to %s:%d", l.env, l.ip, Df[l.env]), s.curOpenSockets[l.env] = l, s.lastOpenSockets[l.env].next(l), s.firstEnv = l.env, s.openSecondSocket(l.env, l.ip, l.useNewDomain);
        }), hb(1), Se()), s.firstSocketOpener = s.firstEnvOpenSocket.pipe(Cb(function(l) {
          return l.open$.pipe(sa(function() {
            s.log("The websocket of first ENV_%d re-opened to %s:%d", l.env, l.ip, Df[l.env]), s.curOpenSockets[l.env] = l, s.lastOpenSockets[l.env].next(l);
          }));
        })), r = s.firstOpenKeeperSubject.pipe(Kb(wd)), s.firstOpenKeeperSub = r.subscribe({ error: s.logError }), s;
      }
      Ga(t, e);
      var n = Ha(t);
      return eb(t, [{ key: "initConnection", value: function() {
        this.firstOpenKeeperSubject.next(this.firstSocketOpener);
      } }, { key: "closeSocket", value: function(r, o) {
        if (![0, 1].includes(r))
          throw new mb({ INVALID_ENV: "The env argument is not 0 or 1" });
        var i = r === this.firstEnv ? this.firstOpenKeeperSub : this.secondOpenKeeperSub;
        this.firstOpenKeeperSub = void 0;
        var s = this.curOpenSockets[r];
        this.curOpenSockets[r] = void 0, s && (s.isActiveClose = !0, setTimeout(function() {
          s.close();
        }, o)), i !== void 0 && setTimeout(function() {
          i == null || i.unsubscribe();
        }, o);
      } }, { key: "waitClosing", value: function(r) {
        var o = this;
        return r.isActiveClose = !0, r.open$.pipe(ev(), ab(function(i) {
          return i.message === ns.normalClosureMessage ? Sb : ra(i);
        }), Lb(5e3), ab(function(i) {
          return i instanceof Tb ? (o.warn("Force closing the ENV_%d connection", r.env), Sb) : ra(i);
        }));
      } }, { key: "onSocketConnectionFailure", value: function(r) {
        var o = [0, 1].filter(function(i) {
          return i !== r.env;
        })[0];
        (o = this.curOpenSockets[o]) && o.loggedIn ? this.reopenSocketWithApRequest(r.env) : this.emit("socketsFailure");
      } }, { key: "openSecondSocket", value: function(r, o, i) {
        var s = this, u = r === 1 ? 0 : 1;
        this.secondSocketOpener = this.edgeInfoReplayed.pipe(vn(function(a, l) {
          return [].concat(Z(a), [l]);
        }, []), Ea(function(a) {
          return ls(a, function(l) {
            return Sn(o, l.ip);
          }).slice(-1)[0];
        }), hb(1), Cb(function(a) {
          if (a === void 0)
            return ra(Error("Invalid edge info"));
          var l = new Vl(a.ip, u, a.ticket, s.context, s.logger, i);
          return l.on("connectionFailure", function() {
            return s.onSocketConnectionFailure(l);
          }), l.open$.pipe(sa(function() {
            s.lastOpenSockets[u].next(l), s.curOpenSockets[u] = l;
          }));
        }), Se()), this.secondOpenKeeperSub = this.secondOpenKeeperSubject.pipe(Kb(wd)).subscribe({ error: this.logError }), this.secondOpenKeeperSubject.next(this.secondSocketOpener);
      } }, { key: "reopenSocketWithApRequest", value: function(r) {
        var o = this, i = [0, 1].filter(function(a) {
          return a !== r;
        })[0];
        if ((i = this.curOpenSockets[i]) !== void 0) {
          var s, u = i.ip;
          i = this.apClient.getApEdgeInfoEndFirst$(!0).pipe($d(function() {
            return new bt({ AP_NO_AVAILABLE_EDGE: "No available edge address to connect" });
          }), Re(function(a) {
            return a.pipe(sa(function(l) {
              if (l.code === ti)
                o.emit("tokenExpired"), o.apClient.apFinish$.next(void 0);
              else if (Na(l))
                throw l;
            }), Zd(ue.getParameter("RECONNECTING_AP_INTERVAL")), Kc(dd(15e3)));
          }), sa(function(a) {
            o.log("An edge info got %o", a);
          }), fh(function() {
            o.apClient.clearUp();
          })).pipe(vn(function(a, l) {
            return [].concat(Z(a), [l]);
          }, []), Ea(function(a) {
            return (a = ls(a, function(l) {
              return Sn(u, l.ip);
            })).length - 1 >= o.ipIterator ? a.slice(-o.ipIterator++ - 1)[0] : (o.ipIterator = 0, a.slice(-1)[0]);
          }), $d(), Cb(function(a) {
            if (a === void 0)
              return ra(Error("Invalid edge info"));
            var l = new Vl(a.ip, r, a.ticket, o.context, o.logger, s);
            return l.on("connectionFailure", function() {
              return o.onSocketConnectionFailure(l);
            }), s = !l.useNewDomain, l.open$.pipe(Uf(l));
          }), sa(function(a) {
            o.log("The websocket of ENV_%d re-opened to %s:%d using ap", a.env, a.ip, Df[a.env]), o.curOpenSockets[r] = a, o.lastOpenSockets[r].next(a);
          }), Cb(function(a) {
            return a.open$.pipe(sa(function() {
              o.log("The websocket of ENV_%d re-opened to %s:%d", a.env, a.ip, Df[a.env]), o.curOpenSockets[r] = a, o.lastOpenSockets[r].next(a);
            }));
          }), Se()), r === this.firstEnv ? this.firstOpenKeeperSubject.next(i) : this.secondOpenKeeperSubject.next(i);
        }
      } }]), t;
    }(sc()), xE = function(e) {
      function t(r, o, i) {
        return va(this, t), x(z(i = n.call(this, i, "Context")), "_token", void 0), x(z(i), "config", void 0), x(z(i), "_uid", void 0), x(z(i), "_sid", void 0), x(z(i), "_vid", void 0), x(z(i), "_startTime", void 0), x(z(i), "_area", "CN"), x(z(i), "_socketUseProxy", !1), x(z(i), "appId", void 0), x(z(i), "enableCloudProxy", !1), x(z(i), "cloudProxyServers", []), i.appId = r, i.config = o, i;
      }
      Ga(t, e);
      var n = Ha(t);
      return eb(t, [{ key: "socketUseProxy", get: function() {
        return this._socketUseProxy && Ec.ENABLE_EDGE_AUTO_FALLBACK;
      }, set: function(r) {
        this.log("socketUseProxy is set to %s", r), this._socketUseProxy = r;
      } }, { key: "token", set: function(r) {
        this._token = typeof r == "string" && r ? r : void 0;
      } }, { key: "uid", get: function() {
        if (typeof this._uid == "string" && this._uid)
          return this._uid;
        throw new rc("Cannot get illegal uid");
      }, set: function(r) {
        if (this.log("The user ID is set to %s", La(r)), !Ta(r))
          throw new rc();
        this._uid = r;
      } }, { key: "vid", get: function() {
        if (typeof this._vid == "string" && this._vid)
          return this._vid;
        throw new rc("Cannot get illegal vid");
      }, set: function(r) {
        this._vid = r;
      } }, { key: "key", get: function() {
        if (typeof this._token == "string" && this._token)
          return this._token;
        if (typeof this.appId == "string" && this.appId)
          return this.appId;
        throw new rc("Cannot get illegal key");
      } }, { key: "sid", get: function() {
        if (typeof this._sid == "string" && this._sid)
          return this._sid;
        throw new rc("Cannot get illegal sid");
      }, set: function(r) {
        if (this.log("sid is set to %s", r), typeof r != "string" || !r)
          throw new rc();
        this._sid = r;
      } }, { key: "startTime", get: function() {
        if (typeof this._startTime == "number" && this._startTime)
          return this._startTime;
        throw new rc("Cannot get illegal startTime");
      }, set: function(r) {
        if (this.log("startTime is set to %s", r), typeof r != "number" || !r)
          throw new rc();
        this._startTime = r;
      } }, { key: "rtmArea", get: function() {
        if (typeof this._area == "string" && this._area)
          return this._area;
        throw new rc("Cannot get illegal area");
      }, set: function(r) {
        this.log("area is set to %s", r), typeof r == "string" && r ? this._area = r : this.warn("set area failed");
      } }]), t;
    }(sc());
    Sp("of", function() {
      for (var e = 0, t = arguments.length, n = new (qf(this))(t); t > e; )
        n[e] = arguments[e++];
      return n;
    }, rk);
    var yE = Math.max, Pv = function(e, t, n) {
      var r = Object(e);
      if (!ae(e)) {
        var o = wf(t);
        e = Wd(e), t = function(i) {
          return o(r[i], i, r);
        };
      }
      return -1 < (t = function(i, s, u) {
        var a = i == null ? 0 : i.length;
        if (!a)
          return -1;
        if (u == null)
          u = 0;
        else {
          var l = (u = Rl(u)) % 1;
          u = u == u ? l ? u - l : u : 0;
        }
        return 0 > u && (u = yE(a + u, 0)), Yq(i, wf(s), u);
      }(e, t, n)) ? r[o ? e[t] : t] : void 0;
    }, Ov = function(e, t) {
      return e && e.length ? fl(e, void 0, typeof t == "function" ? t : void 0) : [];
    }, dt = function() {
      function e() {
        va(this, e), x(this, "size", 0), x(this, "fields", /* @__PURE__ */ new Map());
      }
      return eb(e, [{ key: "define", value: function(t, n, r) {
        if (this.size += r, 64 < this.size)
          throw new RangeError("the struct over 64 bits is not supported");
        th(n = { val: 0, isNumber: n === "number", isBoolean: n === "boolean", oneof: n === "number" || n === "boolean" ? void 0 : n, len: r }), this.fields.set(t, n);
      } }, { key: "set", value: function(t, n) {
        if (!(t = this.fields.get(t)))
          throw Error("field not found");
        var r = t.oneof;
        if (!P.isLong(n) && typeof n != "number")
          if (typeof n == "boolean")
            n = n ? 1 : 0;
          else {
            if (r === void 0)
              throw Error("invalid field type");
            if ((n = r[n]) === void 0)
              throw Error("field type not found");
          }
        th(t, n), t.val = n;
      } }, { key: "toNumber", value: function() {
        for (var t = 0, n = 0, r = 0, o = Array.from(this.fields); r < o.length; r++) {
          var i = $a(o[r], 2)[1], s = i.len;
          (i = i.val) !== void 0 && (t += P.fromValue(i).shiftLeft(n).toNumber(), n += s);
        }
        return t;
      } }, { key: "toLong", value: function() {
        for (var t = P.fromNumber(0, !0), n = 0, r = 0, o = Array.from(this.fields); r < o.length; r++) {
          var i = $a(o[r], 2)[1], s = i.len;
          (i = i.val) !== void 0 && (t = P.fromValue(i).shiftLeft(n).add(t), n += s);
        }
        return t;
      } }, { key: "assert", value: function(t, n) {
        function r(s) {
          if (!P.isLong(s) && typeof s != "number")
            if (typeof s == "boolean")
              s = s ? 1 : 0;
            else {
              if (i === void 0)
                throw Error("invalid field type");
              if ((s = i[s]) === void 0)
                throw Error("field type not found");
            }
          return th(o, s), sh(s, o.val);
        }
        var o = this.fields.get(t);
        if (!o)
          throw Error("field not found");
        var i = o.oneof;
        if (!Array.isArray(n))
          return r(n);
        if (n.length === 1)
          return r(n[0]);
        if (n.every(function(s) {
          return typeof s == "string";
        }) && i !== void 0)
          return n.some(function(s) {
            return r(s);
          });
        throw Error("invalid valueTypes");
      } }, { key: "from", value: function(t) {
        t = P.fromValue(t);
        for (var n = 0, r = 0, o = Array.from(this.fields); r < o.length; r++) {
          var i = $a(o[r], 2)[1], s = i.len, u = P.fromNumber(Math.pow(2, s) - 1, !0).shiftLeft(n);
          th(i, u = t.and(u).shiftRightUnsigned(n)), i.val = u, n += s;
        }
      } }, { key: "typeOf", value: function(t) {
        if ((t = this.fields.get(t)) !== void 0) {
          var n = t.oneof;
          if (t = t.val, n !== void 0) {
            var r = 0;
            for (n = Object.entries(n); r < n.length; r++) {
              var o = $a(n[r], 2), i = o[0];
              if (sh(t, o[1]))
                return i;
            }
          }
        }
        throw new TypeError("can only get type of oneof type");
      } }]), e;
    }(), et = function(e) {
      function t(r) {
        va(this, t);
        var o = n.call(this);
        return o.define("Rejoin", "boolean", 1), o.define("Unused", "number", 31), o.define("Platform", "number", 8), o.define("Version", "number", 12), o.define("Subversion", "number", 12), o.set("Platform", 7), o.set("Version", 4), o.set("Subversion", 18), o.set("Rejoin", r), o;
      }
      Ga(t, e);
      var n = Ha(t);
      return t;
    }(dt), zE = Wa(Wa({}, { PeerTextMessage: 0, ChannelTextMessage: 1, VendorTextMessage: 2 }), { PeerRawMessage: 3, ChannelRawMessage: 4, VendorRawMessage: 5 }), ft = { CallInvite: 101, CallAccept: 102, CallReject: 103, CallCancel: 104 }, AE = Wa(Wa({}, zE), ft), BE = { Uncompressed: 0, Zlib: 1 }, Ef = function(e) {
      function t(r) {
        va(this, t);
        var o = n.call(this);
        if (o.define("MessageType", AE, 8), o.define("BroadcastJumps", "number", 2), o.define("ToCache", "boolean", 1), o.define("FromCache", "boolean", 1), o.define("CompressionMethod", BE, 2), o.define("IterationNumber", "number", 4), o.define("BufferedMessage", "boolean", 1), o.define("ToArchive", "boolean", 1), o.define("FromArchive", "boolean", 1), typeof r == "number" || P.isLong(r))
          o.from(r);
        else if (r !== void 0) {
          var i = 0;
          for (r = qh(r); i < r.length; i++) {
            var s = $a(r[i], 2);
            o.set(s[0], s[1]);
          }
        }
        return o;
      }
      Ga(t, e);
      var n = Ha(t);
      return eb(t, [{ key: "isTextMessage", value: function() {
        return this.assert("MessageType", ["PeerTextMessage", "ChannelTextMessage", "VendorTextMessage"]);
      } }, { key: "isRawMessage", value: function() {
        return this.assert("MessageType", ["ChannelRawMessage", "PeerRawMessage", "VendorRawMessage"]);
      } }, { key: "isRawPeerMessage", value: function() {
        return this.assert("MessageType", "PeerRawMessage");
      } }, { key: "isRawChannelMessage", value: function() {
        return this.assert("MessageType", "ChannelRawMessage");
      } }, { key: "isPeerTextMessage", value: function() {
        return this.assert("MessageType", "PeerTextMessage");
      } }, { key: "isChannelTextMessage", value: function() {
        return this.assert("MessageType", "ChannelTextMessage");
      } }, { key: "isInvitation", value: function(r) {
        var o = this;
        return r !== void 0 ? this.assert("MessageType", r) : Yf(ft).some(function(i) {
          return o.assert("MessageType", i);
        });
      } }, { key: "isPeerMessage", value: function() {
        return this.assert("MessageType", ["PeerTextMessage", "PeerRawMessage"]);
      } }, { key: "isZlibCompressed", value: function() {
        return this.assert("CompressionMethod", "Zlib");
      } }, { key: "isFromCache", value: function() {
        return this.assert("FromCache", !0);
      } }, { key: "isBufferedMessage", value: function() {
        return this.assert("BufferedMessage", !0);
      } }, { key: "getInvitationType", value: function() {
        if (!this.isInvitation())
          throw new TypeError("cannot get InvitationType of a normal message type");
        return this.typeOf("MessageType");
      } }]), t;
    }(dt), CE = function(e) {
      function t(r) {
        return va(this, t), x(z(r = n.call(this, r, "ChatManager")), "dialogueLru", new xz(void 0, { maxlen: 1e4, ttl: 1e4 })), r;
      }
      Ga(t, e);
      var n = Ha(t);
      return eb(t, [{ key: "getChatInfo", value: function(r) {
        var o = this.dialogueLru.get(r);
        if (this.dialogueLru.prune(), o) {
          var i = o.dialogue, s = { dialogue: i, sequence: o = o.sequence.add(1) };
          return this.dialogueLru.set(r, { dialogue: i, sequence: o }), s;
        }
        return i = { dialogue: nh(), sequence: P.fromNumber(1, !0) }, this.dialogueLru.set(r, i), i;
      } }]), t;
    }(sc()), G = {};
    qa(module) == "object" && (module.exports = G), G.parse = function(e, t) {
      var n, r = G.bin.readUshort, o = G.bin.readUint, i = {};
      for (n = (e = new Uint8Array(e)).length - 4; o(e, n) != 101010256; )
        n--;
      var s = r(e, n = n + 4 + 4);
      r(e, n += 2), o(e, n += 2), n = o(e, n += 4);
      for (var u = 0; u < s; u++) {
        o(e, n), n += 4, n += 4, n += 4, o(e, n += 4);
        var a = o(e, n += 4), l = o(e, n += 4), f = r(e, n += 4), h = r(e, n + 2), d = r(e, n + 4);
        n += 6;
        var p = o(e, n += 8);
        n += 4, n += f + h + d, G._readLocal(e, p, i, a, l, t);
      }
      return i;
    }, G._readLocal = function(e, t, n, r, o, i) {
      var s = G.bin.readUshort, u = G.bin.readUint;
      u(e, t), s(e, t += 4), s(e, t += 2);
      var a = s(e, t += 2);
      u(e, t += 2), u(e, t += 4), u = s(e, t = t + 4 + 8);
      var l = s(e, t += 2);
      if (t += 2, s = G.bin.readUTF8(e, t, u), t = t + u + l, i)
        n[s] = { size: o, csize: r };
      else if (e = new Uint8Array(e.buffer, t), a == 0)
        n[s] = new Uint8Array(e.buffer.slice(t, t + r));
      else {
        if (a != 8)
          throw "unknown compression method: " + a;
        t = new Uint8Array(o), G.inflateRaw(e, t), n[s] = t;
      }
    }, G.inflateRaw = function(e, t) {
      return G.F.inflate(e, t);
    }, G.inflate = function(e, t) {
      return e[0], e[1], G.inflateRaw(new Uint8Array(e.buffer, e.byteOffset + 2, e.length - 2), t);
    }, G.deflate = function(e, t) {
      t == null && (t = { level: 6 });
      var n = 0, r = new Uint8Array(50 + Math.floor(1.1 * e.length));
      return r[n] = 120, r[n + 1] = 156, n = G.F.deflateRaw(e, r, n + 2, t.level), e = G.adler(e, 0, e.length), r[n + 0] = e >>> 24 & 255, r[n + 1] = e >>> 16 & 255, r[n + 2] = e >>> 8 & 255, r[n + 3] = e >>> 0 & 255, new Uint8Array(r.buffer, 0, n + 4);
    }, G.deflateRaw = function(e, t) {
      t == null && (t = { level: 6 });
      var n = new Uint8Array(50 + Math.floor(1.1 * e.length)), r = G.F.deflateRaw(e, n, r, t.level);
      return new Uint8Array(n.buffer, 0, r);
    }, G.encode = function(e, t) {
      t == null && (t = !1);
      var n, r = 0, o = G.bin.writeUint, i = G.bin.writeUshort, s = {};
      for (n in e) {
        var u = !G._noNeed(n) && !t, a = e[n], l = G.crc.crc(a, 0, a.length);
        s[n] = { cpr: u, usize: a.length, crc: l, file: u ? G.deflateRaw(a) : a };
      }
      for (n in s)
        r += s[n].file.length + 30 + 46 + 2 * G.bin.sizeUTF8(n);
      for (n in e = new Uint8Array(r + 22), t = 0, a = [], s)
        l = s[n], a.push(t), t = G._writeHeader(e, t, n, l, 0);
      for (n in r = 0, u = t, s)
        l = s[n], a.push(t), t = G._writeHeader(e, t, n, l, 1, a[r++]);
      return s = t - u, o(e, t, 101010256), i(e, t = t + 4 + 4, r), i(e, t += 2, r), o(e, t += 2, s), o(e, t + 4, u), e.buffer;
    }, G._noNeed = function(e) {
      return e = e.split(".").pop().toLowerCase(), "png,jpg,jpeg,zip".indexOf(e) != -1;
    }, G._writeHeader = function(e, t, n, r, o, i) {
      var s = G.bin.writeUint, u = G.bin.writeUshort, a = r.file;
      return s(e, t, o == 0 ? 67324752 : 33639248), t += 4, o == 1 && (t += 2), u(e, t, 20), u(e, t += 2, 0), u(e, t += 2, r.cpr ? 8 : 0), s(e, t += 2, 0), s(e, t += 4, r.crc), s(e, t += 4, a.length), s(e, t += 4, r.usize), u(e, t += 4, G.bin.sizeUTF8(n)), u(e, t += 2, 0), t += 2, o == 1 && (s(e, t = t + 2 + 2 + 6, i), t += 4), t += n = G.bin.writeUTF8(e, t, n), o == 0 && (e.set(a, t), t += a.length), t;
    }, G.crc = { table: function() {
      for (var e = new Uint32Array(256), t = 0; 256 > t; t++) {
        for (var n = t, r = 0; 8 > r; r++)
          n = 1 & n ? 3988292384 ^ n >>> 1 : n >>> 1;
        e[t] = n;
      }
      return e;
    }(), update: function(e, t, n, r) {
      for (var o = 0; o < r; o++)
        e = G.crc.table[255 & (e ^ t[n + o])] ^ e >>> 8;
      return e;
    }, crc: function(e, t, n) {
      return 4294967295 ^ G.crc.update(4294967295, e, t, n);
    } }, G.adler = function(e, t, n) {
      var r = 1, o = 0, i = t;
      for (t += n; i < t; ) {
        for (n = Math.min(i + 5552, t); i < n; )
          o += r += e[i++];
        r %= 65521, o %= 65521;
      }
      return o << 16 | r;
    }, G.bin = { readUshort: function(e, t) {
      return e[t] | e[t + 1] << 8;
    }, writeUshort: function(e, t, n) {
      e[t] = 255 & n, e[t + 1] = n >> 8 & 255;
    }, readUint: function(e, t) {
      return 16777216 * e[t + 3] + (e[t + 2] << 16 | e[t + 1] << 8 | e[t]);
    }, writeUint: function(e, t, n) {
      e[t] = 255 & n, e[t + 1] = n >> 8 & 255, e[t + 2] = n >> 16 & 255, e[t + 3] = n >> 24 & 255;
    }, readASCII: function(e, t, n) {
      for (var r = "", o = 0; o < n; o++)
        r += String.fromCharCode(e[t + o]);
      return r;
    }, writeASCII: function(e, t, n) {
      for (var r = 0; r < n.length; r++)
        e[t + r] = n.charCodeAt(r);
    }, pad: function(e) {
      return 2 > e.length ? "0" + e : e;
    }, readUTF8: function(e, t, n) {
      for (var r, o = "", i = 0; i < n; i++)
        o += "%" + G.bin.pad(e[t + i].toString(16));
      try {
        r = decodeURIComponent(o);
      } catch (s) {
        return G.bin.readASCII(e, t, n);
      }
      return r;
    }, writeUTF8: function(e, t, n) {
      for (var r = n.length, o = 0, i = 0; i < r; i++) {
        var s = n.charCodeAt(i);
        if (!(4294967168 & s))
          e[t + o] = s, o++;
        else if (!(4294965248 & s))
          e[t + o] = 192 | s >> 6, e[t + o + 1] = 128 | s >> 0 & 63, o += 2;
        else if (!(4294901760 & s))
          e[t + o] = 224 | s >> 12, e[t + o + 1] = 128 | s >> 6 & 63, e[t + o + 2] = 128 | s >> 0 & 63, o += 3;
        else {
          if (4292870144 & s)
            throw "e";
          e[t + o] = 240 | s >> 18, e[t + o + 1] = 128 | s >> 12 & 63, e[t + o + 2] = 128 | s >> 6 & 63, e[t + o + 3] = 128 | s >> 0 & 63, o += 4;
        }
      }
      return o;
    }, sizeUTF8: function(e) {
      for (var t = e.length, n = 0, r = 0; r < t; r++) {
        var o = e.charCodeAt(r);
        if (!(4294967168 & o))
          n++;
        else if (!(4294965248 & o))
          n += 2;
        else if (!(4294901760 & o))
          n += 3;
        else {
          if (4292870144 & o)
            throw "e";
          n += 4;
        }
      }
      return n;
    } }, G.F = {}, G.F.deflateRaw = function(e, t, n, r) {
      var o = [[0, 0, 0, 0, 0], [4, 4, 8, 4, 0], [4, 5, 16, 8, 0], [4, 6, 16, 16, 0], [4, 10, 16, 32, 0], [8, 16, 32, 32, 0], [8, 16, 128, 128, 0], [8, 32, 128, 256, 0], [32, 128, 258, 1024, 1], [32, 258, 258, 4096, 1]][r], i = G.F.U, s = G.F._goodIndex;
      G.F._hash;
      var u = G.F._putsE, a = 0;
      n <<= 3;
      var l = 0, f = e.length;
      if (r == 0) {
        for (; a < f; ) {
          var h = Math.min(65535, f - a);
          u(t, n, a + h == f ? 1 : 0), n = G.F._copyExact(e, a, h, t, n + 8), a += h;
        }
        return n >>> 3;
      }
      u = i.lits, r = i.strt;
      var d = i.prev, p = 0, v = 0, y = 0, g = 0, m = 0;
      for (2 < f && (r[m = G.F._hash(e, 0)] = 0), a = 0; a < f; a++) {
        if (h = m, a + 1 < f - 2) {
          m = G.F._hash(e, a + 1);
          var E = a + 1 & 32767;
          d[E] = r[m], r[m] = E;
        }
        if (l <= a) {
          if ((14e3 < p || 26697 < v) && 100 < f - a && (l < a && (u[p] = a - l, p += 2, l = a), n = G.F._writeBlock(a == f - 1 || l == f ? 1 : 0, u, p, g, e, y, a - y, t, n), p = v = g = 0, y = a), E = 0, a < f - 2 && (E = G.F._bestMatch(e, a, d, h, Math.min(o[2], f - a), o[3])), E != 0) {
            h = E >>> 16, E &= 65535;
            var w = s(h, i.of0);
            i.lhst[257 + w]++;
            var C = s(E, i.df0);
            i.dhst[C]++, g += i.exb[w] + i.dxb[C], u[p] = h << 23 | a - l, u[p + 1] = E << 16 | w << 8 | C, p += 2, l = a + h;
          } else
            i.lhst[e[a]]++;
          v++;
        }
      }
      for (y == a && e.length != 0 || (l < a && (u[p] = a - l, p += 2), n = G.F._writeBlock(1, u, p, g, e, y, a - y, t, n)); 7 & n; )
        n++;
      return n >>> 3;
    }, G.F._bestMatch = function(e, t, n, r, o, i) {
      var s = 32767 & t, u = n[s], a = s - u + 32768 & 32767;
      if (u == s || r != G.F._hash(e, t - a))
        return 0;
      for (var l = r = 0, f = Math.min(32767, t); a <= f && --i != 0 && u != s; ) {
        if ((r == 0 || e[t + r] == e[t + r - a]) && (s = G.F._howLong(e, t, a)) > r) {
          if (l = a, (r = s) >= o)
            break;
          a + 2 < s && (s = a + 2);
          for (var h = 0, d = 0; d < s - 2; d++) {
            var p = t - a + d + 32768 & 32767, v = p - n[p] + 32768 & 32767;
            v > h && (h = v, u = p);
          }
        }
        a += (s = u) - (u = n[s]) + 32768 & 32767;
      }
      return r << 16 | l;
    }, G.F._howLong = function(e, t, n) {
      if (e[t] != e[t - n] || e[t + 1] != e[t + 1 - n] || e[t + 2] != e[t + 2 - n])
        return 0;
      var r = t, o = Math.min(e.length, t + 258);
      for (t += 3; t < o && e[t] == e[t - n]; )
        t++;
      return t - r;
    }, G.F._hash = function(e, t) {
      return (e[t] << 8 | e[t + 1]) + (e[t + 2] << 4) & 65535;
    }, G.saved = 0, G.F._writeBlock = function(e, t, n, r, o, i, s, u, a) {
      var l = G.F.U, f = G.F._putsF, h = G.F._putsE;
      l.lhst[256]++;
      var d = G.F.getTrees(), p = d[0], v = d[1], y = d[2], g = d[3], m = d[4], E = d[5], w = d[6];
      d = d[7];
      var C = 32 + (a + 3 & 7 ? 8 - (a + 3 & 7) : 0) + (s << 3), q = r + G.F.contSize(l.fltree, l.lhst) + G.F.contSize(l.fdtree, l.dhst);
      r = r + G.F.contSize(l.ltree, l.lhst) + G.F.contSize(l.dtree, l.dhst), r += 14 + 3 * E + G.F.contSize(l.itree, l.ihst) + (2 * l.ihst[16] + 3 * l.ihst[17] + 7 * l.ihst[18]);
      for (var J = 0; 286 > J; J++)
        l.lhst[J] = 0;
      for (J = 0; 30 > J; J++)
        l.dhst[J] = 0;
      for (J = 0; 19 > J; J++)
        l.ihst[J] = 0;
      if (C = C < q && C < r ? 0 : q < r ? 1 : 2, f(u, a, e), f(u, a + 1, C), a += 3, C == 0) {
        for (; 7 & a; )
          a++;
        a = G.F._copyExact(o, i, s, u, a);
      } else {
        if (C == 1)
          var B = l.fltree, Y = l.fdtree;
        if (C == 2) {
          for (G.F.makeCodes(l.ltree, p), G.F.revCodes(l.ltree, p), G.F.makeCodes(l.dtree, v), G.F.revCodes(l.dtree, v), G.F.makeCodes(l.itree, y), G.F.revCodes(l.itree, y), B = l.ltree, Y = l.dtree, h(u, a, g - 257), h(u, a += 5, m - 1), h(u, a += 5, E - 4), a += 4, e = 0; e < E; e++)
            h(u, a + 3 * e, l.itree[1 + (l.ordr[e] << 1)]);
          a = G.F._codeTiny(w, l.itree, u, a + 3 * E), a = G.F._codeTiny(d, l.itree, u, a);
        }
        for (E = 0; E < n; E += 2) {
          for (w = (e = t[E]) >>> 23, e = i + (8388607 & e); i < e; )
            a = G.F._writeLit(o[i++], B, u, a);
          w != 0 && (e = (p = t[E + 1]) >> 16, s = p >> 8 & 255, p &= 255, h(u, a = G.F._writeLit(257 + s, B, u, a), w - l.of0[s]), a += l.exb[s], f(u, a = G.F._writeLit(p, Y, u, a), e - l.df0[p]), a += l.dxb[p], i += w);
        }
        a = G.F._writeLit(256, B, u, a);
      }
      return a;
    }, G.F._copyExact = function(e, t, n, r, o) {
      var i = o >>> 3;
      return r[i] = n, r[i + 1] = n >>> 8, r[i + 2] = 255 - r[i], r[i + 3] = 255 - r[i + 1], i += 4, r.set(new Uint8Array(e.buffer, t, n), i), o + (n + 4 << 3);
    }, G.F.getTrees = function() {
      for (var e = G.F.U, t = G.F._hufTree(e.lhst, e.ltree, 15), n = G.F._hufTree(e.dhst, e.dtree, 15), r = [], o = G.F._lenCodes(e.ltree, r), i = [], s = G.F._lenCodes(e.dtree, i), u = 0; u < r.length; u += 2)
        e.ihst[r[u]]++;
      for (u = 0; u < i.length; u += 2)
        e.ihst[i[u]]++;
      u = G.F._hufTree(e.ihst, e.itree, 7);
      for (var a = 19; 4 < a && e.itree[1 + (e.ordr[a - 1] << 1)] == 0; )
        a--;
      return [t, n, u, o, s, a, r, i];
    }, G.F.getSecond = function(e) {
      for (var t = [], n = 0; n < e.length; n += 2)
        t.push(e[n + 1]);
      return t;
    }, G.F.nonZero = function(e) {
      for (var t = "", n = 0; n < e.length; n += 2)
        e[n + 1] != 0 && (t += (n >> 1) + ",");
      return t;
    }, G.F.contSize = function(e, t) {
      for (var n = 0, r = 0; r < t.length; r++)
        n += t[r] * e[1 + (r << 1)];
      return n;
    }, G.F._codeTiny = function(e, t, n, r) {
      for (var o = 0; o < e.length; o += 2) {
        var i = e[o], s = e[o + 1];
        r = G.F._writeLit(i, t, n, r);
        var u = i == 16 ? 2 : i == 17 ? 3 : 7;
        15 < i && (G.F._putsE(n, r, s, u), r += u);
      }
      return r;
    }, G.F._lenCodes = function(e, t) {
      for (var n = e.length; n != 2 && e[n - 1] == 0; )
        n -= 2;
      for (var r = 0; r < n; r += 2) {
        var o = e[r + 1], i = r + 3 < n ? e[r + 3] : -1, s = r + 5 < n ? e[r + 5] : -1, u = r == 0 ? -1 : e[r - 1];
        if (o == 0 && i == o && s == o) {
          for (i = r + 5; i + 2 < n && e[i + 2] == o; )
            i += 2;
          11 > (o = Math.min(i + 1 - r >>> 1, 138)) ? t.push(17, o - 3) : t.push(18, o - 11), r += 2 * o - 2;
        } else if (o == u && i == o && s == o) {
          for (i = r + 5; i + 2 < n && e[i + 2] == o; )
            i += 2;
          o = Math.min(i + 1 - r >>> 1, 6), t.push(16, o - 3), r += 2 * o - 2;
        } else
          t.push(o, 0);
      }
      return n >>> 1;
    }, G.F._hufTree = function(e, t, n) {
      var r = [], o = e.length, i = t.length, s = 0;
      for (s = 0; s < i; s += 2)
        t[s] = 0, t[s + 1] = 0;
      for (s = 0; s < o; s++)
        e[s] != 0 && r.push({ lit: s, f: e[s] });
      if (e = r.length, o = r.slice(0), e == 0)
        return 0;
      if (e == 1)
        return t[1 + ((n = r[0].lit) << 1)] = 1, t[1 + ((n == 0 ? 1 : 0) << 1)] = 1;
      r.sort(function(f, h) {
        return f.f - h.f;
      }), s = r[0], i = r[1];
      var u = 0, a = 1, l = 2;
      for (r[0] = { lit: -1, f: s.f + i.f, l: s, r: i, d: 0 }; a != e - 1; )
        s = u != a && (l == e || r[u].f < r[l].f) ? r[u++] : r[l++], i = u != a && (l == e || r[u].f < r[l].f) ? r[u++] : r[l++], r[a++] = { lit: -1, f: s.f + i.f, l: s, r: i };
      for ((r = G.F.setDepth(r[a - 1], 0)) > n && (G.F.restrictDepth(o, n, r), r = n), s = 0; s < e; s++)
        t[1 + (o[s].lit << 1)] = o[s].d;
      return r;
    }, G.F.setDepth = function(e, t) {
      return e.lit != -1 ? e.d = t : Math.max(G.F.setDepth(e.l, t + 1), G.F.setDepth(e.r, t + 1));
    }, G.F.restrictDepth = function(e, t, n) {
      var r = 0, o = 1 << n - t, i = 0;
      for (e.sort(function(u, a) {
        return a.d == u.d ? u.f - a.f : a.d - u.d;
      }), r = 0; r < e.length && e[r].d > t; r++) {
        var s = e[r].d;
        e[r].d = t, i += o - (1 << n - s);
      }
      for (i >>>= n - t; 0 < i; )
        (s = e[r].d) < t ? (e[r].d++, i -= 1 << t - s - 1) : r++;
      for (; 0 <= r; r--)
        e[r].d == t && 0 > i && (e[r].d--, i++);
      i != 0 && console.log("debt left");
    }, G.F._goodIndex = function(e, t) {
      var n = 0;
      return t[16 | n] <= e && (n |= 16), t[8 | n] <= e && (n |= 8), t[4 | n] <= e && (n |= 4), t[2 | n] <= e && (n |= 2), t[1 | n] <= e && (n |= 1), n;
    }, G.F._writeLit = function(e, t, n, r) {
      return G.F._putsF(n, r, t[e << 1]), r + t[1 + (e << 1)];
    }, G.F.inflate = function(e, t) {
      var n = Uint8Array;
      if (e[0] == 3 && e[1] == 0)
        return t || new n(0);
      var r = G.F, o = r._bitsF, i = r._bitsE, s = r._decodeTiny, u = r.makeCodes, a = r.codes2map, l = r._get17, f = r.U, h = t == null;
      h && (t = new n(e.length >>> 2 << 3));
      for (var d, p, v, y, g = 0, m = 0, E = p = 0, w = 0; g == 0; )
        if (g = o(e, w, 1), d = o(e, w + 1, 2), w += 3, d == 0)
          7 & w && (w += 8 - (7 & w)), d = e[(w = 4 + (w >>> 3)) - 4] | e[w - 3] << 8, h && (t = G.F._check(t, E + d)), t.set(new n(e.buffer, e.byteOffset + w, d), E), w = w + d << 3, E += d;
        else {
          if (h && (t = G.F._check(t, E + 131072)), d == 1 && (v = f.flmap, y = f.fdmap, m = 511, p = 31), d == 2) {
            for (p = i(e, w, 5) + 257, d = i(e, w + 5, 5) + 1, v = i(e, w + 10, 4) + 4, w += 14, y = 0; 38 > y; y += 2)
              f.itree[y] = 0, f.itree[y + 1] = 0;
            for (m = 1, y = 0; y < v; y++) {
              var C = i(e, w + 3 * y, 3);
              f.itree[1 + (f.ordr[y] << 1)] = C, C > m && (m = C);
            }
            w += 3 * v, u(f.itree, m), a(f.itree, m, f.imap), v = f.lmap, y = f.dmap, w = s(f.imap, (1 << m) - 1, p + d, e, w, f.ttree), m = (1 << (C = r._copyOut(f.ttree, 0, p, f.ltree))) - 1, p = (1 << (d = r._copyOut(f.ttree, p, d, f.dtree))) - 1, u(f.ltree, C), a(f.ltree, C, v), u(f.dtree, d), a(f.dtree, d, y);
          }
          for (; ; )
            if (w += 15 & (d = v[l(e, w) & m]), (C = d >>> 4) >>> 8 == 0)
              t[E++] = C;
            else {
              if (C == 256)
                break;
              d = E + C - 254, 264 < C && (d = E + ((C = f.ldef[C - 257]) >>> 3) + i(e, w, 7 & C), w += 7 & C), w += 15 & (C = y[l(e, w) & p]);
              var q = ((C = f.ddef[C >>> 4]) >>> 4) + o(e, w, 15 & C);
              for (w += 15 & C, h && (t = G.F._check(t, E + 131072)); E < d; )
                t[E] = t[E++ - q], t[E] = t[E++ - q], t[E] = t[E++ - q], t[E] = t[E++ - q];
              E = d;
            }
        }
      return t.length == E ? t : t.slice(0, E);
    }, G.F._check = function(e, t) {
      var n = e.length;
      return t <= n ? e : ((t = new Uint8Array(Math.max(n << 1, t))).set(e, 0), t);
    }, G.F._decodeTiny = function(e, t, n, r, o, i) {
      for (var s = G.F._bitsE, u = G.F._get17, a = 0; a < n; ) {
        var l = e[u(r, o) & t];
        o += 15 & l;
        var f = l >>> 4;
        if (15 >= f)
          i[a] = f, a++;
        else {
          var h = l = 0;
          for (f == 16 ? (h = 3 + s(r, o, 2), o += 2, l = i[a - 1]) : f == 17 ? (h = 3 + s(r, o, 3), o += 3) : f == 18 && (h = 11 + s(r, o, 7), o += 7), f = a + h; a < f; )
            i[a] = l, a++;
        }
      }
      return o;
    }, G.F._copyOut = function(e, t, n, r) {
      for (var o = 0, i = 0, s = r.length >>> 1; i < n; ) {
        var u = e[i + t];
        r[i << 1] = 0, r[1 + (i << 1)] = u, u > o && (o = u), i++;
      }
      for (; i < s; )
        r[i << 1] = 0, r[1 + (i << 1)] = 0, i++;
      return o;
    }, G.F.makeCodes = function(e, t) {
      var n, r, o = G.F.U, i = e.length, s = o.bl_count;
      for (n = 0; n <= t; n++)
        s[n] = 0;
      for (n = 1; n < i; n += 2)
        s[e[n]]++;
      for (o = o.next_code, n = 0, s[0] = 0, r = 1; r <= t; r++)
        n = n + s[r - 1] << 1, o[r] = n;
      for (t = 0; t < i; t += 2)
        (s = e[t + 1]) != 0 && (e[t] = o[s], o[s]++);
    }, G.F.codes2map = function(e, t, n) {
      for (var r = e.length, o = G.F.U.rev15, i = 0; i < r; i += 2)
        if (e[i + 1] != 0) {
          var s = e[i + 1], u = i >> 1 << 4 | s, a = t - s;
          for (a = (s = e[i] << a) + (1 << a); s != a; )
            n[o[s] >>> 15 - t] = u, s++;
        }
    }, G.F.revCodes = function(e, t) {
      for (var n = G.F.U.rev15, r = 15 - t, o = 0; o < e.length; o += 2)
        e[o] = n[e[o] << t - e[o + 1]] >>> r;
    }, G.F._putsE = function(e, t, n) {
      n <<= 7 & t, e[t >>>= 3] |= n, e[t + 1] |= n >>> 8;
    }, G.F._putsF = function(e, t, n) {
      n <<= 7 & t, e[t >>>= 3] |= n, e[t + 1] |= n >>> 8, e[t + 2] |= n >>> 16;
    }, G.F._bitsE = function(e, t, n) {
      return (e[t >>> 3] | e[1 + (t >>> 3)] << 8) >>> (7 & t) & (1 << n) - 1;
    }, G.F._bitsF = function(e, t, n) {
      return (e[t >>> 3] | e[1 + (t >>> 3)] << 8 | e[2 + (t >>> 3)] << 16) >>> (7 & t) & (1 << n) - 1;
    }, G.F._get17 = function(e, t) {
      return (e[t >>> 3] | e[1 + (t >>> 3)] << 8 | e[2 + (t >>> 3)] << 16) >>> (7 & t);
    }, G.F._get25 = function(e, t) {
      return (e[t >>> 3] | e[1 + (t >>> 3)] << 8 | e[2 + (t >>> 3)] << 16 | e[3 + (t >>> 3)] << 24) >>> (7 & t);
    }, G.F.U = function() {
      var e = Uint16Array, t = Uint32Array;
      return { next_code: new e(16), bl_count: new e(16), ordr: [16, 17, 18, 0, 8, 7, 9, 6, 10, 5, 11, 4, 12, 3, 13, 2, 14, 1, 15], of0: [3, 4, 5, 6, 7, 8, 9, 10, 11, 13, 15, 17, 19, 23, 27, 31, 35, 43, 51, 59, 67, 83, 99, 115, 131, 163, 195, 227, 258, 999, 999, 999], exb: [0, 0, 0, 0, 0, 0, 0, 0, 1, 1, 1, 1, 2, 2, 2, 2, 3, 3, 3, 3, 4, 4, 4, 4, 5, 5, 5, 5, 0, 0, 0, 0], ldef: new e(32), df0: [1, 2, 3, 4, 5, 7, 9, 13, 17, 25, 33, 49, 65, 97, 129, 193, 257, 385, 513, 769, 1025, 1537, 2049, 3073, 4097, 6145, 8193, 12289, 16385, 24577, 65535, 65535], dxb: [0, 0, 0, 0, 1, 1, 2, 2, 3, 3, 4, 4, 5, 5, 6, 6, 7, 7, 8, 8, 9, 9, 10, 10, 11, 11, 12, 12, 13, 13, 0, 0], ddef: new t(32), flmap: new e(512), fltree: [], fdmap: new e(32), fdtree: [], lmap: new e(32768), ltree: [], ttree: [], dmap: new e(32768), dtree: [], imap: new e(512), itree: [], rev15: new e(32768), lhst: new t(286), dhst: new t(30), ihst: new t(19), lits: new t(15e3), strt: new e(65536), prev: new e(32768) };
    }(), function() {
      function e(o, i, s) {
        for (; i-- != 0; )
          o.push(0, s);
      }
      for (var t = G.F.U, n = 0; 32768 > n; n++) {
        var r = n;
        r = (4278255360 & (r = (4042322160 & (r = (3435973836 & (r = (2863311530 & r) >>> 1 | (1431655765 & r) << 1)) >>> 2 | (858993459 & r) << 2)) >>> 4 | (252645135 & r) << 4)) >>> 8 | (16711935 & r) << 8, t.rev15[n] = (r >>> 16 | r << 16) >>> 17;
      }
      for (n = 0; 32 > n; n++)
        t.ldef[n] = t.of0[n] << 3 | t.exb[n], t.ddef[n] = t.df0[n] << 4 | t.dxb[n];
      e(t.fltree, 144, 8), e(t.fltree, 112, 9), e(t.fltree, 24, 7), e(t.fltree, 8, 8), G.F.makeCodes(t.fltree, 9), G.F.codes2map(t.fltree, 9, t.flmap), G.F.revCodes(t.fltree, 9), e(t.fdtree, 32, 5), G.F.makeCodes(t.fdtree, 5), G.F.codes2map(t.fdtree, 5, t.fdmap), G.F.revCodes(t.fdtree, 5), e(t.itree, 19, 0), e(t.ltree, 286, 0), e(t.dtree, 30, 0), e(t.ttree, 320, 0);
    }();
    var DE = Array.isArray || function(e) {
      return e && typeof e.length == "number";
    }, EE = Object.defineProperty({ isArray: DE }, "__esModule", { value: !0 }), FE = Object.defineProperty({ isObject: function(e) {
      return e !== null && qa(e) === "object";
    } }, "__esModule", { value: !0 }), GE = Object.defineProperty({ isFunction: function(e) {
      return typeof e == "function";
    } }, "__esModule", { value: !0 }), HE = function() {
      function e(t) {
        return Error.call(this), this.message = t ? t.length + ` errors occurred during unsubscription:
` + t.map(function(n, r) {
          return r + 1 + ") " + n.toString();
        }).join(`
  `) : "", this.name = "UnsubscriptionError", this.errors = t, this;
      }
      return e.prototype = Object.create(Error.prototype), e;
    }(), uh = Object.defineProperty({ UnsubscriptionError: HE }, "__esModule", { value: !0 }), IE = function() {
      function e(n) {
        this.closed = !1, this._subscriptions = this._parentOrParents = null, n && (this._ctorUnsubscribe = !0, this._unsubscribe = n);
      }
      var t;
      return e.prototype.unsubscribe = function() {
        if (!this.closed) {
          var n = this._parentOrParents, r = this._ctorUnsubscribe, o = this._unsubscribe, i = this._subscriptions;
          if (this.closed = !0, this._subscriptions = this._parentOrParents = null, n instanceof e)
            n.remove(this);
          else if (n !== null)
            for (var s = 0; s < n.length; ++s)
              n[s].remove(this);
          if (GE.isFunction(o)) {
            r && (this._unsubscribe = void 0);
            try {
              o.call(this);
            } catch (a) {
              var u = a instanceof uh.UnsubscriptionError ? eo(a.errors) : [a];
            }
          }
          if (EE.isArray(i)) {
            for (s = -1, n = i.length; ++s < n; )
              if (r = i[s], FE.isObject(r))
                try {
                  r.unsubscribe();
                } catch (a) {
                  u = u || [], a instanceof uh.UnsubscriptionError ? u = u.concat(eo(a.errors)) : u.push(a);
                }
          }
          if (u)
            throw new uh.UnsubscriptionError(u);
        }
      }, e.prototype.add = function(n) {
        var r = n;
        if (!n)
          return e.EMPTY;
        switch (qa(n)) {
          case "function":
            r = new e(n);
          case "object":
            if (r === this || r.closed || typeof r.unsubscribe != "function")
              return r;
            if (this.closed)
              return r.unsubscribe(), r;
            r instanceof e || (n = r, (r = new e())._subscriptions = [n]);
            break;
          default:
            throw Error("unrecognized teardown " + n + " added to Subscription.");
        }
        if ((n = r._parentOrParents) === null)
          r._parentOrParents = this;
        else if (n instanceof e) {
          if (n === this)
            return r;
          r._parentOrParents = [n, this];
        } else {
          if (n.indexOf(this) !== -1)
            return r;
          n.push(this);
        }
        return (n = this._subscriptions) === null ? this._subscriptions = [r] : n.push(r), r;
      }, e.prototype.remove = function(n) {
        var r = this._subscriptions;
        r && (n = r.indexOf(n)) !== -1 && r.splice(n, 1);
      }, e.EMPTY = ((t = new e()).closed = !0, t), e;
    }(), JE = Object.defineProperty({ Subscription: IE }, "__esModule", { value: !0 }), KE = Ya && Ya.__extends || function() {
      var e = function(t, n) {
        return (e = Object.setPrototypeOf || { __proto__: [] } instanceof Array && function(r, o) {
          r.__proto__ = o;
        } || function(r, o) {
          for (var i in o)
            o.hasOwnProperty(i) && (r[i] = o[i]);
        })(t, n);
      };
      return function(t, n) {
        function r() {
          this.constructor = t;
        }
        e(t, n), t.prototype = n === null ? Object.create(n) : (r.prototype = n.prototype, new r());
      };
    }(), LE = function(e) {
      function t(n, r) {
        return e.call(this) || this;
      }
      return KE(t, e), t.prototype.schedule = function(n, r) {
        return this;
      }, t;
    }(JE.Subscription), ME = Object.defineProperty({ Action: LE }, "__esModule", { value: !0 }), NE = Ya && Ya.__extends || function() {
      var e = function(t, n) {
        return (e = Object.setPrototypeOf || { __proto__: [] } instanceof Array && function(r, o) {
          r.__proto__ = o;
        } || function(r, o) {
          for (var i in o)
            o.hasOwnProperty(i) && (r[i] = o[i]);
        })(t, n);
      };
      return function(t, n) {
        function r() {
          this.constructor = t;
        }
        e(t, n), t.prototype = n === null ? Object.create(n) : (r.prototype = n.prototype, new r());
      };
    }(), gt = function(e) {
      function t(n, r) {
        var o = e.call(this, n, r) || this;
        return o.scheduler = n, o.work = r, o.pending = !1, o;
      }
      return NE(t, e), t.prototype.schedule = function(n, r) {
        if (r === void 0 && (r = 0), this.closed)
          return this;
        this.state = n, n = this.id;
        var o = this.scheduler;
        return n != null && (this.id = this.recycleAsyncId(o, n, r)), this.pending = !0, this.delay = r, this.id = this.id || this.requestAsyncId(o, this.id, r), this;
      }, t.prototype.requestAsyncId = function(n, r, o) {
        return o === void 0 && (o = 0), setInterval(n.flush.bind(n, this), o);
      }, t.prototype.recycleAsyncId = function(n, r, o) {
        if (o === void 0 && (o = 0), o !== null && this.delay === o && this.pending === !1)
          return r;
        clearInterval(r);
      }, t.prototype.execute = function(n, r) {
        return this.closed ? Error("executing a cancelled action") : (this.pending = !1, (n = this._execute(n, r)) ? n : void (this.pending === !1 && this.id != null && (this.id = this.recycleAsyncId(this.scheduler, this.id, null))));
      }, t.prototype._execute = function(n, r) {
        r = !1;
        var o = void 0;
        try {
          this.work(n);
        } catch (i) {
          r = !0, o = !!i && i || Error(i);
        }
        if (r)
          return this.unsubscribe(), o;
      }, t.prototype._unsubscribe = function() {
        var n = this.id, r = this.scheduler, o = r.actions, i = o.indexOf(this);
        this.state = this.work = null, this.pending = !1, this.scheduler = null, i !== -1 && o.splice(i, 1), n != null && (this.id = this.recycleAsyncId(r, n, null)), this.delay = null;
      }, t;
    }(ME.Action), OE = function() {
      function e(t, n) {
        n === void 0 && (n = e.now), this.SchedulerAction = t, this.now = n;
      }
      return e.prototype.schedule = function(t, n, r) {
        return n === void 0 && (n = 0), new this.SchedulerAction(this, t).schedule(r, n);
      }, e.now = function() {
        return Date.now();
      }, e;
    }(), ht = Object.defineProperty({ Scheduler: OE }, "__esModule", { value: !0 }), PE = Ya && Ya.__extends || function() {
      var e = function(t, n) {
        return (e = Object.setPrototypeOf || { __proto__: [] } instanceof Array && function(r, o) {
          r.__proto__ = o;
        } || function(r, o) {
          for (var i in o)
            o.hasOwnProperty(i) && (r[i] = o[i]);
        })(t, n);
      };
      return function(t, n) {
        function r() {
          this.constructor = t;
        }
        e(t, n), t.prototype = n === null ? Object.create(n) : (r.prototype = n.prototype, new r());
      };
    }(), it = function(e) {
      function t(n, r) {
        r === void 0 && (r = ht.Scheduler.now);
        var o = e.call(this, n, function() {
          return t.delegate && t.delegate !== o ? t.delegate.now() : r();
        }) || this;
        return o.actions = [], o.active = !1, o.scheduled = void 0, o;
      }
      return PE(t, e), t.prototype.schedule = function(n, r, o) {
        return r === void 0 && (r = 0), t.delegate && t.delegate !== this ? t.delegate.schedule(n, r, o) : e.prototype.schedule.call(this, n, r, o);
      }, t.prototype.flush = function(n) {
        var r = this.actions;
        if (this.active)
          r.push(n);
        else {
          var o;
          this.active = !0;
          do
            if (o = n.execute(n.state, n.delay))
              break;
          while (n = r.shift());
          if (this.active = !1, o) {
            for (; n = r.shift(); )
              n.unsubscribe();
            throw o;
          }
        }
      }, t;
    }(ht.Scheduler), QE = Fa("iterator"), Wl = !la(function() {
      var e = new URL("b?a=1&b=2&c=3", "http://a"), t = e.searchParams, n = "";
      return e.pathname = "c%20d", t.forEach(function(r, o) {
        t.delete("b"), n += o + r;
      }), !t.sort || e.href !== "http://a/c%20d?a=1&c=3" || t.get("c") !== "3" || String(new URLSearchParams("?a=1")) !== "a=1" || !t[QE] || new URL("https://a@b").username !== "a" || new URLSearchParams(new URLSearchParams("a=b")).get("a") !== "b" || new URL("http://тест").host !== "xn--e1aybc" || new URL("http://a#б").hash !== "#%D0%B1" || n !== "a1c3" || new URL("http://x", void 0).host !== "x";
    }), RE = /[^\0-\u007E]/, SE = /[.\u3002\uFF0E\uFF61]/g, Ff = Math.floor, Xl = String.fromCharCode, jt = function(e) {
      var t = lg(e);
      if (typeof t != "function")
        throw TypeError(String(e) + " is not iterable");
      return Ia(t.call(e));
    }, kt = Pc("fetch"), Yl = Pc("Headers"), TE = Fa("iterator"), lt = cb.set, cc = cb.getterFor("URLSearchParams"), UE = cb.getterFor("URLSearchParamsIterator"), VE = /\+/g, mt = Array(4), WE = function(e) {
      try {
        return decodeURIComponent(e);
      } catch (t) {
        return e;
      }
    }, nt = function(e) {
      var t = e.replace(VE, " ");
      e = 4;
      try {
        return decodeURIComponent(t);
      } catch (o) {
        for (; e; ) {
          var n = t.replace, r = e--;
          r = mt[r - 1] || (mt[r - 1] = RegExp("((?:%[\\da-f]{2}){" + r + "})", "gi")), t = n.call(t, r, WE);
        }
        return t;
      }
    }, ot = /[!'()~]|%20/g, XE = { "!": "%21", "'": "%27", "(": "%28", ")": "%29", "~": "%7E", "%20": "+" }, pt = function(e) {
      return XE[e];
    }, qt = function(e, t) {
      if (t) {
        t = t.split("&");
        for (var n, r = 0; r < t.length; )
          (n = t[r++]).length && (n = n.split("="), e.push({ key: nt(n.shift()), value: nt(n.join("=")) }));
      }
    }, YE = function(e) {
      this.entries.length = 0, qt(this.entries, e);
    }, Gf = function(e, t) {
      if (e < t)
        throw TypeError("Not enough arguments");
    }, Zl = Wo(function(e, t) {
      lt(this, { type: "URLSearchParamsIterator", iterator: jt(cc(e).entries), kind: t });
    }, "Iterator", function() {
      var e = UE(this), t = e.kind, n = (e = e.iterator.next()).value;
      return e.done || (e.value = t === "keys" ? n.key : t === "values" ? n.value : [n.key, n.value]), e;
    }), Rg = function() {
      Ac(this, Rg, "URLSearchParams");
      var e, t, n, r = 0 < arguments.length ? arguments[0] : void 0, o = [];
      if (lt(this, { type: "URLSearchParams", entries: o, updateURL: function() {
      }, updateSearchParams: YE }), r !== void 0)
        if (xa(r)) {
          var i = lg(r);
          if (typeof i == "function")
            for (r = i.call(r), i = r.next; !(e = i.call(r)).done; ) {
              var s = (e = jt(Ia(e.value))).next;
              if ((t = s.call(e)).done || (n = s.call(e)).done || !s.call(e).done)
                throw TypeError("Expected sequence with length 2");
              o.push({ key: t.value + "", value: n.value + "" });
            }
          else
            for (e in r)
              ka(r, e) && o.push({ key: e, value: r[e] + "" });
        } else
          qt(o, typeof r == "string" ? r.charAt(0) === "?" ? r.slice(1) : r : r + "");
    }, Bi = Rg.prototype;
    kf(Bi, { append: function(e, t) {
      Gf(arguments.length, 2);
      var n = cc(this);
      n.entries.push({ key: e + "", value: t + "" }), n.updateURL();
    }, delete: function(e) {
      Gf(arguments.length, 1);
      for (var t = cc(this), n = t.entries, r = e + "", o = 0; o < n.length; )
        n[o].key === r ? n.splice(o, 1) : o++;
      t.updateURL();
    }, get: function(e) {
      Gf(arguments.length, 1);
      for (var t = cc(this).entries, n = e + "", r = 0; r < t.length; r++)
        if (t[r].key === n)
          return t[r].value;
      return null;
    }, getAll: function(e) {
      Gf(arguments.length, 1);
      for (var t = cc(this).entries, n = e + "", r = [], o = 0; o < t.length; o++)
        t[o].key === n && r.push(t[o].value);
      return r;
    }, has: function(e) {
      Gf(arguments.length, 1);
      for (var t = cc(this).entries, n = e + "", r = 0; r < t.length; )
        if (t[r++].key === n)
          return !0;
      return !1;
    }, set: function(e, t) {
      Gf(arguments.length, 1);
      for (var n, r = cc(this), o = r.entries, i = !1, s = e + "", u = t + "", a = 0; a < o.length; a++)
        (n = o[a]).key === s && (i ? o.splice(a--, 1) : (i = !0, n.value = u));
      i || o.push({ key: s, value: u }), r.updateURL();
    }, sort: function() {
      var e, t, n = cc(this), r = n.entries, o = r.slice();
      for (t = r.length = 0; t < o.length; t++) {
        var i = o[t];
        for (e = 0; e < t; e++)
          if (r[e].key > i.key) {
            r.splice(e, 0, i);
            break;
          }
        e === t && r.push(i);
      }
      n.updateURL();
    }, forEach: function(e) {
      for (var t, n = cc(this).entries, r = Dd(e, 1 < arguments.length ? arguments[1] : void 0, 3), o = 0; o < n.length; )
        r((t = n[o++]).value, t.key, this);
    }, keys: function() {
      return new Zl(this, "keys");
    }, values: function() {
      return new Zl(this, "values");
    }, entries: function() {
      return new Zl(this, "entries");
    } }, { enumerable: !0 }), Za(Bi, TE, Bi.entries), Za(Bi, "toString", function() {
      for (var e, t = cc(this).entries, n = [], r = 0; r < t.length; )
        e = t[r++], n.push(encodeURIComponent(e.key).replace(ot, pt) + "=" + encodeURIComponent(e.value).replace(ot, pt));
      return n.join("&");
    }, { enumerable: !0 }), zc(Rg, "URLSearchParams"), ea({ global: !0, forced: !Wl }, { URLSearchParams: Rg }), Wl || typeof kt != "function" || typeof Yl != "function" || ea({ global: !0, enumerable: !0, forced: !0 }, { fetch: function(e) {
      var t = [e];
      if (1 < arguments.length) {
        var n = arguments[1];
        if (xa(n)) {
          var r = n.body;
          if (jf(r) === "URLSearchParams") {
            var o = n.headers ? new Yl(n.headers) : new Yl();
            o.has("content-type") || o.set("content-type", "application/x-www-form-urlencoded;charset=UTF-8"), n = jc(n, { body: Nc(0, String(r)), headers: Nc(0, o) });
          }
        }
        t.push(n);
      }
      return kt.apply(this, t);
    } });
    var Sg = R.URL, ZE = Rg, $E = cb.set, db = cb.getterFor("URL"), aF = Math.floor, rt = Math.pow, st = /[A-Za-z]/, bF = /[\d+-.A-Za-z]/, $l = /\d/, cF = /^(0x|0X)/, dF = /^[0-7]+$/, eF = /^\d+$/, tt = /^[\dA-Fa-f]+$/, fF = /[\0\t\n\r #%/:?@[\\]]/, gF = /[\0\t\n\r #/:?@[\\]]/, hF = /^[\u0000-\u001F ]+|[\u0000-\u001F ]+$/g, iF = /[\t\n\r]/g, am = function(e, t) {
      var n;
      if (t.charAt(0) == "[") {
        if (t.charAt(t.length - 1) != "]")
          return "Invalid host";
        var r = jF(t.slice(1, -1));
        if (!r)
          return "Invalid host";
      } else if (wb(e)) {
        for (r = [], t = t.toLowerCase().replace(SE, ".").split("."), n = 0; n < t.length; n++) {
          var o = t[n], i = r, s = i.push;
          if (RE.test(o)) {
            var u = o;
            o = [];
            var a = u;
            u = [];
            for (var l = 0, f = a.length; l < f; ) {
              var h = a.charCodeAt(l++);
              if (55296 <= h && 56319 >= h && l < f) {
                var d = a.charCodeAt(l++);
                (64512 & d) == 56320 ? u.push(((1023 & h) << 10) + (1023 & d) + 65536) : (u.push(h), l--);
              } else
                u.push(h);
            }
            l = u.length, f = 128;
            var p = 0, v = 72;
            for (a = 0; a < u.length; a++) {
              var y = u[a];
              128 > y && o.push(Xl(y));
            }
            for ((d = h = o.length) && o.push("-"); d < l; ) {
              var g = 2147483647;
              for (a = 0; a < u.length; a++)
                (y = u[a]) >= f && y < g && (g = y);
              var m = d + 1;
              if (g - f > Ff((2147483647 - p) / m))
                throw RangeError("Overflow: input needs wider integers to process");
              for (p += (g - f) * m, f = g, a = 0; a < u.length; a++) {
                if ((y = u[a]) < f && 2147483647 < ++p)
                  throw RangeError("Overflow: input needs wider integers to process");
                if (y == f) {
                  var E = p;
                  for (y = 36; !(E < (g = y <= v ? 1 : y >= v + 26 ? 26 : y - v)); y += 36) {
                    var w = 36 - g, C = o;
                    g += (E -= g) % w, C.push.call(C, Xl(g + 22 + 75 * (26 > g))), E = Ff(E / w);
                  }
                  for (o.push(Xl(E + 22 + 75 * (26 > E))), v = m, y = 0, p = d == h ? Ff(p / 700) : p >> 1, p += Ff(p / v); 455 < p; y += 36)
                    p = Ff(p / 35);
                  v = Ff(y + 36 * p / (p + 38)), p = 0, ++d;
                }
              }
              ++p, ++f;
            }
            o = "xn--" + o.join("");
          }
          s.call(i, o);
        }
        if (t = r.join("."), fF.test(t) || (r = kF(t)) === null)
          return "Invalid host";
      } else {
        if (gF.test(t))
          return "Invalid host";
        for (r = "", t = ge(t), n = 0; n < t.length; n++)
          r += Qd(t[n], Ci);
      }
      e.host = r;
    }, kF = function(e) {
      var t, n = e.split(".");
      n.length && n[n.length - 1] == "" && n.pop();
      var r = n.length;
      if (4 < r)
        return e;
      var o = [];
      for (t = 0; t < r; t++) {
        var i = n[t];
        if (i == "")
          return e;
        var s = 10;
        if (1 < i.length && i.charAt(0) == "0" && (s = cF.test(i) ? 16 : 8, i = i.slice(s == 8 ? 1 : 2)), i === "")
          i = 0;
        else {
          if (!(s == 10 ? eF : s == 8 ? dF : tt).test(i))
            return e;
          i = parseInt(i, s);
        }
        o.push(i);
      }
      for (t = 0; t < r; t++)
        if (i = o[t], t == r - 1) {
          if (i >= rt(256, 5 - r))
            return null;
        } else if (255 < i)
          return null;
      for (e = o.pop(), t = 0; t < o.length; t++)
        e += o[t] * rt(256, 3 - t);
      return e;
    }, jF = function(e) {
      var t, n, r = [0, 0, 0, 0, 0, 0, 0, 0], o = 0, i = null, s = 0, u = function() {
        return e.charAt(s);
      };
      if (u() == ":") {
        if (e.charAt(1) != ":")
          return;
        s += 2, i = ++o;
      }
      for (; u(); ) {
        if (o == 8)
          return;
        if (u() == ":") {
          if (i !== null)
            return;
          s++, i = ++o;
        } else {
          for (t = n = 0; 4 > n && tt.test(u()); )
            t = 16 * t + parseInt(u(), 16), s++, n++;
          if (u() == ".") {
            if (n == 0 || (s -= n, 6 < o))
              return;
            for (t = 0; u(); ) {
              if (n = null, 0 < t) {
                if (!(u() == "." && 4 > t))
                  return;
                s++;
              }
              if (!$l.test(u()))
                return;
              for (; $l.test(u()); ) {
                var a = parseInt(u(), 10);
                if (n === null)
                  n = a;
                else {
                  if (n == 0)
                    return;
                  n = 10 * n + a;
                }
                if (255 < n)
                  return;
                s++;
              }
              r[o] = 256 * r[o] + n, ++t != 2 && t != 4 || o++;
            }
            if (t != 4)
              return;
            break;
          }
          if (u() == ":") {
            if (s++, !u())
              return;
          } else if (u())
            return;
          r[o++] = t;
        }
      }
      if (i !== null)
        for (u = o - i, o = 7; o != 0 && 0 < u; )
          t = r[o], r[o--] = r[i + u - 1], r[i + --u] = t;
      else if (o != 8)
        return;
      return r;
    }, Tg = function(e) {
      var t, n;
      if (typeof e == "number") {
        var r = [];
        for (t = 0; 4 > t; t++)
          r.unshift(e % 256), e = aF(e / 256);
        return r.join(".");
      }
      if (typeof e == "object") {
        r = "", t = null;
        for (var o = 1, i = null, s = 0, u = 0; 8 > u; u++)
          e[u] !== 0 ? (s > o && (t = i, o = s), i = null, s = 0) : (i === null && (i = u), ++s);
        for (s > o && (t = i), o = t, t = 0; 8 > t; t++)
          n && e[t] === 0 || (n && (n = !1), o === t ? (r += t ? ":" : "::", n = !0) : (r += e[t].toString(16), 7 > t && (r += ":")));
        return "[" + r + "]";
      }
      return e;
    }, Ci = {}, ut = Bg({}, Ci, { " ": 1, '"': 1, "<": 1, ">": 1, "`": 1 }), vt = Bg({}, ut, { "#": 1, "?": 1, "{": 1, "}": 1 }), bm = Bg({}, vt, { "/": 1, ":": 1, ";": 1, "=": 1, "@": 1, "[": 1, "\\": 1, "]": 1, "^": 1, "|": 1 }), Qd = function(e, t) {
      var n = uw(e, 0);
      return 32 < n && 127 > n && !ka(t, e) ? e : encodeURIComponent(e);
    }, Di = { ftp: 21, file: null, http: 80, https: 443, ws: 80, wss: 443 }, wb = function(e) {
      return ka(Di, e.scheme);
    }, cm = function(e) {
      return !e.host || e.cannotBeABaseURL || e.scheme == "file";
    }, Ug = function(e, t) {
      var n;
      return e.length == 2 && st.test(e.charAt(0)) && ((n = e.charAt(1)) == ":" || !t && n == "|");
    }, wt = function(e) {
      var t;
      return 1 < e.length && Ug(e.slice(0, 2)) && (e.length == 2 || (t = e.charAt(2)) === "/" || t === "\\" || t === "?" || t === "#");
    }, xt = function(e) {
      var t = e.path, n = t.length;
      !n || e.scheme == "file" && n == 1 && Ug(t[0], !0) || t.pop();
    }, dm = {}, yt = {}, em = {}, zt = {}, At = {}, fm = {}, Bt = {}, Ct = {}, Ei = {}, Fi = {}, gm = {}, hm = {}, im = {}, jm = {}, Dt = {}, km = {}, Vg = {}, Yc = {}, Et = {}, ye = {}, vd = {}, Zc = function(e, t, n, r) {
      var o = n || dm, i = 0, s = "", u = !1, a = !1, l = !1;
      for (n || (e.scheme = "", e.username = "", e.password = "", e.host = null, e.port = null, e.path = [], e.query = null, e.fragment = null, e.cannotBeABaseURL = !1, t = t.replace(hF, "")), t = t.replace(iF, ""), t = ge(t); i <= t.length; ) {
        var f = t[i];
        switch (o) {
          case dm:
            if (!f || !st.test(f)) {
              if (n)
                return "Invalid scheme";
              o = em;
              continue;
            }
            s += f.toLowerCase(), o = yt;
            break;
          case yt:
            if (f && (bF.test(f) || f == "+" || f == "-" || f == "."))
              s += f.toLowerCase();
            else {
              if (f != ":") {
                if (n)
                  return "Invalid scheme";
                s = "", o = em, i = 0;
                continue;
              }
              if (n && (wb(e) != ka(Di, s) || s == "file" && (e.username != "" || e.password != "" || e.port !== null) || e.scheme == "file" && !e.host))
                return;
              if (e.scheme = s, n)
                return void (wb(e) && Di[e.scheme] == e.port && (e.port = null));
              s = "", e.scheme == "file" ? o = jm : wb(e) && r && r.scheme == e.scheme ? o = zt : wb(e) ? o = Ct : t[i + 1] == "/" ? (o = At, i++) : (e.cannotBeABaseURL = !0, e.path.push(""), o = Et);
            }
            break;
          case em:
            if (!r || r.cannotBeABaseURL && f != "#")
              return "Invalid scheme";
            if (r.cannotBeABaseURL && f == "#") {
              e.scheme = r.scheme, e.path = r.path.slice(), e.query = r.query, e.fragment = "", e.cannotBeABaseURL = !0, o = vd;
              break;
            }
            o = r.scheme == "file" ? jm : fm;
            continue;
          case zt:
            if (f != "/" || t[i + 1] != "/") {
              o = fm;
              continue;
            }
            o = Ei, i++;
            break;
          case At:
            if (f == "/") {
              o = Fi;
              break;
            }
            o = Yc;
            continue;
          case fm:
            if (e.scheme = r.scheme, f == null)
              e.username = r.username, e.password = r.password, e.host = r.host, e.port = r.port, e.path = r.path.slice(), e.query = r.query;
            else if (f == "/" || f == "\\" && wb(e))
              o = Bt;
            else if (f == "?")
              e.username = r.username, e.password = r.password, e.host = r.host, e.port = r.port, e.path = r.path.slice(), e.query = "", o = ye;
            else {
              if (f != "#") {
                e.username = r.username, e.password = r.password, e.host = r.host, e.port = r.port, e.path = r.path.slice(), e.path.pop(), o = Yc;
                continue;
              }
              e.username = r.username, e.password = r.password, e.host = r.host, e.port = r.port, e.path = r.path.slice(), e.query = r.query, e.fragment = "", o = vd;
            }
            break;
          case Bt:
            if (!wb(e) || f != "/" && f != "\\") {
              if (f != "/") {
                e.username = r.username, e.password = r.password, e.host = r.host, e.port = r.port, o = Yc;
                continue;
              }
              o = Fi;
            } else
              o = Ei;
            break;
          case Ct:
            if (o = Ei, f != "/" || s.charAt(i + 1) != "/")
              continue;
            i++;
            break;
          case Ei:
            if (f != "/" && f != "\\") {
              o = Fi;
              continue;
            }
            break;
          case Fi:
            if (f == "@") {
              for (u && (s = "%40" + s), u = !0, s = ge(s), f = 0; f < s.length; f++) {
                var h = s[f];
                h != ":" || l ? (h = Qd(h, bm), l ? e.password += h : e.username += h) : l = !0;
              }
              s = "";
            } else if (f == null || f == "/" || f == "?" || f == "#" || f == "\\" && wb(e)) {
              if (u && s == "")
                return "Invalid authority";
              i -= ge(s).length + 1, s = "", o = gm;
            } else
              s += f;
            break;
          case gm:
          case hm:
            if (n && e.scheme == "file") {
              o = km;
              continue;
            }
            if (f != ":" || a) {
              if (f == null || f == "/" || f == "?" || f == "#" || f == "\\" && wb(e)) {
                if (wb(e) && s == "")
                  return "Invalid host";
                if (n && s == "" && (e.username != "" || e.password != "" || e.port !== null))
                  return;
                if (o = am(e, s))
                  return o;
                if (s = "", o = Vg, n)
                  return;
                continue;
              }
              f == "[" ? a = !0 : f == "]" && (a = !1), s += f;
            } else {
              if (s == "")
                return "Invalid host";
              if (o = am(e, s))
                return o;
              if (s = "", o = im, n == hm)
                return;
            }
            break;
          case im:
            if (!$l.test(f)) {
              if (f == null || f == "/" || f == "?" || f == "#" || f == "\\" && wb(e) || n) {
                if (s != "") {
                  if (65535 < (o = parseInt(s, 10)))
                    return "Invalid port";
                  e.port = wb(e) && o === Di[e.scheme] ? null : o, s = "";
                }
                if (n)
                  return;
                o = Vg;
                continue;
              }
              return "Invalid port";
            }
            s += f;
            break;
          case jm:
            if (e.scheme = "file", f == "/" || f == "\\")
              o = Dt;
            else {
              if (!r || r.scheme != "file") {
                o = Yc;
                continue;
              }
              if (f == null)
                e.host = r.host, e.path = r.path.slice(), e.query = r.query;
              else if (f == "?")
                e.host = r.host, e.path = r.path.slice(), e.query = "", o = ye;
              else {
                if (f != "#") {
                  wt(t.slice(i).join("")) || (e.host = r.host, e.path = r.path.slice(), xt(e)), o = Yc;
                  continue;
                }
                e.host = r.host, e.path = r.path.slice(), e.query = r.query, e.fragment = "", o = vd;
              }
            }
            break;
          case Dt:
            if (f == "/" || f == "\\") {
              o = km;
              break;
            }
            r && r.scheme == "file" && !wt(t.slice(i).join("")) && (Ug(r.path[0], !0) ? e.path.push(r.path[0]) : e.host = r.host), o = Yc;
            continue;
          case km:
            if (f == null || f == "/" || f == "\\" || f == "?" || f == "#") {
              if (!n && Ug(s))
                o = Yc;
              else {
                if (s == "") {
                  if (e.host = "", n)
                    return;
                } else {
                  if (o = am(e, s))
                    return o;
                  if (e.host == "localhost" && (e.host = ""), n)
                    return;
                  s = "";
                }
                o = Vg;
              }
              continue;
            }
            s += f;
            break;
          case Vg:
            if (wb(e)) {
              if (o = Yc, f != "/" && f != "\\")
                continue;
            } else if (n || f != "?")
              if (n || f != "#") {
                if (f != null && (o = Yc, f != "/"))
                  continue;
              } else
                e.fragment = "", o = vd;
            else
              e.query = "", o = ye;
            break;
          case Yc:
            if (f == null || f == "/" || f == "\\" && wb(e) || !n && (f == "?" || f == "#")) {
              if ((h = (h = s).toLowerCase()) === ".." || h === "%2e." || h === ".%2e" || h === "%2e%2e" ? (xt(e), f == "/" || f == "\\" && wb(e) || e.path.push("")) : s === "." || s.toLowerCase() === "%2e" ? f == "/" || f == "\\" && wb(e) || e.path.push("") : (e.scheme == "file" && !e.path.length && Ug(s) && (e.host && (e.host = ""), s = s.charAt(0) + ":"), e.path.push(s)), s = "", e.scheme == "file" && (f == null || f == "?" || f == "#"))
                for (; 1 < e.path.length && e.path[0] === ""; )
                  e.path.shift();
              f == "?" ? (e.query = "", o = ye) : f == "#" && (e.fragment = "", o = vd);
            } else
              s += Qd(f, vt);
            break;
          case Et:
            f == "?" ? (e.query = "", o = ye) : f == "#" ? (e.fragment = "", o = vd) : f != null && (e.path[0] += Qd(f, Ci));
            break;
          case ye:
            n || f != "#" ? f != null && (f == "'" && wb(e) ? e.query += "%27" : e.query = f == "#" ? e.query + "%23" : e.query + Qd(f, Ci)) : (e.fragment = "", o = vd);
            break;
          case vd:
            f != null && (e.fragment += Qd(f, ut));
        }
        i++;
      }
    }, Rd = function(e) {
      var t = Ac(this, Rd, "URL"), n = 1 < arguments.length ? arguments[1] : void 0, r = String(e), o = $E(t, { type: "URL" });
      if (n !== void 0) {
        if (n instanceof Rd)
          var i = db(n);
        else if (n = Zc(i = {}, String(n)))
          throw TypeError(n);
      }
      if (n = Zc(o, r, null, i))
        throw TypeError(n);
      var s = o.searchParams = new ZE();
      (r = cc(s)).updateSearchParams(o.query), r.updateURL = function() {
        o.query = String(s) || null;
      }, wa || (t.href = Gi.call(t), t.origin = Ft.call(t), t.protocol = Gt.call(t), t.username = Ht.call(t), t.password = It.call(t), t.host = Jt.call(t), t.hostname = Kt.call(t), t.port = Lt.call(t), t.pathname = Mt.call(t), t.search = Nt.call(t), t.searchParams = Ot.call(t), t.hash = Pt.call(t));
    }, lm = Rd.prototype, Gi = function() {
      var e = db(this), t = e.scheme, n = e.username, r = e.password, o = e.host, i = e.port, s = e.path, u = e.query, a = e.fragment, l = t + ":";
      return o !== null ? (l += "//", e.username == "" && e.password == "" || (l += n + (r ? ":" + r : "") + "@"), l += Tg(o), i !== null && (l += ":" + i)) : t == "file" && (l += "//"), l += e.cannotBeABaseURL ? s[0] : s.length ? "/" + s.join("/") : "", u !== null && (l += "?" + u), a !== null && (l += "#" + a), l;
    }, Ft = function() {
      var e = db(this), t = e.scheme, n = e.port;
      if (t == "blob")
        try {
          return new Rd(t.path[0]).origin;
        } catch (r) {
          return "null";
        }
      return t != "file" && wb(e) ? t + "://" + Tg(e.host) + (n !== null ? ":" + n : "") : "null";
    }, Gt = function() {
      return db(this).scheme + ":";
    }, Ht = function() {
      return db(this).username;
    }, It = function() {
      return db(this).password;
    }, Jt = function() {
      var e = db(this), t = e.host;
      return e = e.port, t === null ? "" : e === null ? Tg(t) : Tg(t) + ":" + e;
    }, Kt = function() {
      var e = db(this).host;
      return e === null ? "" : Tg(e);
    }, Lt = function() {
      var e = db(this).port;
      return e === null ? "" : String(e);
    }, Mt = function() {
      var e = db(this), t = e.path;
      return e.cannotBeABaseURL ? t[0] : t.length ? "/" + t.join("/") : "";
    }, Nt = function() {
      var e = db(this).query;
      return e ? "?" + e : "";
    }, Ot = function() {
      return db(this).searchParams;
    }, Pt = function() {
      var e = db(this).fragment;
      return e ? "#" + e : "";
    }, tc = function(e, t) {
      return { get: e, set: t, configurable: !0, enumerable: !0 };
    };
    if (wa && To(lm, { href: tc(Gi, function(e) {
      var t = db(this);
      if (e = Zc(t, String(e)))
        throw TypeError(e);
      cc(t.searchParams).updateSearchParams(t.query);
    }), origin: tc(Ft), protocol: tc(Gt, function(e) {
      var t = db(this);
      Zc(t, String(e) + ":", dm);
    }), username: tc(Ht, function(e) {
      var t = db(this);
      if (e = ge(String(e)), !cm(t)) {
        t.username = "";
        for (var n = 0; n < e.length; n++)
          t.username += Qd(e[n], bm);
      }
    }), password: tc(It, function(e) {
      var t = db(this);
      if (e = ge(String(e)), !cm(t)) {
        t.password = "";
        for (var n = 0; n < e.length; n++)
          t.password += Qd(e[n], bm);
      }
    }), host: tc(Jt, function(e) {
      var t = db(this);
      t.cannotBeABaseURL || Zc(t, String(e), gm);
    }), hostname: tc(Kt, function(e) {
      var t = db(this);
      t.cannotBeABaseURL || Zc(t, String(e), hm);
    }), port: tc(Lt, function(e) {
      var t = db(this);
      cm(t) || ((e = String(e)) == "" ? t.port = null : Zc(t, e, im));
    }), pathname: tc(Mt, function(e) {
      var t = db(this);
      t.cannotBeABaseURL || (t.path = [], Zc(t, e + "", Vg));
    }), search: tc(Nt, function(e) {
      var t = db(this);
      (e = String(e)) == "" ? t.query = null : (e.charAt(0) == "?" && (e = e.slice(1)), t.query = "", Zc(t, e, ye)), cc(t.searchParams).updateSearchParams(t.query);
    }), searchParams: tc(Ot), hash: tc(Pt, function(e) {
      var t = db(this);
      (e = String(e)) == "" ? t.fragment = null : (e.charAt(0) == "#" && (e = e.slice(1)), t.fragment = "", Zc(t, e, vd));
    }) }), Za(lm, "toJSON", function() {
      return Gi.call(this);
    }, { enumerable: !0 }), Za(lm, "toString", function() {
      return Gi.call(this);
    }, { enumerable: !0 }), Sg) {
      var Qt = Sg.createObjectURL, Rt = Sg.revokeObjectURL;
      Qt && Za(Rd, "createObjectURL", function(e) {
        return Qt.apply(Sg, arguments);
      }), Rt && Za(Rd, "revokeObjectURL", function(e) {
        return Rt.apply(Sg, arguments);
      });
    }
    zc(Rd, "URL"), ea({ global: !0, forced: !Wl, sham: !wa }, { URL: Rd });
    var lF = new Blob(["var fakeIdToId = {};onmessage = function (event) {	var data = event.data,		name = data.name,		fakeId = data.fakeId,		time;	if(data.hasOwnProperty('time')) {		time = data.time;	}	switch (name) {		case 'setInterval':			fakeIdToId[fakeId] = setInterval(function () {				postMessage({fakeId: fakeId});			}, time);			break;		case 'clearInterval':			if (fakeIdToId.hasOwnProperty (fakeId)) {				clearInterval(fakeIdToId[fakeId]);				delete fakeIdToId[fakeId];			}			break;	}}"]), mF = window.URL.createObjectURL(lF), Ze = {}, dg = 0, Aj = new Worker(mF);
    Aj.onmessage = function(e) {
      if (e = e.data.fakeId, Ze.hasOwnProperty(e)) {
        var t = Ze[e];
        e = t.callback, t = t.parameters, e.apply(window, t);
      }
    };
    var nF = function(e) {
      function t() {
        return va(this, t), n.apply(this, arguments);
      }
      Ga(t, e);
      var n = Ha(t);
      return eb(t, [{ key: "requestAsyncId", value: function(r, o) {
        var i = 2 < arguments.length && arguments[2] !== void 0 ? arguments[2] : 0;
        return Qv(r.flush.bind(r, this), i);
      } }, { key: "recycleAsyncId", value: function(r, o) {
        var i = 2 < arguments.length && arguments[2] !== void 0 ? arguments[2] : 0;
        if (i !== null && this.delay === i && this.pending === !1)
          return o;
        Ze.hasOwnProperty(o) && (delete Ze[o], Aj.postMessage({ name: "clearInterval", fakeId: o }));
      } }]), t;
    }(gt), oF = new it(nF), pF = ["group"], mm = G.inflate, St = G.deflate, Tt = function(e) {
      function t(o, i, s, u) {
        va(this, t);
        var a = r.call(this, u, "Session");
        return x(z(a), "lastNoticeTicket", ""), x(z(a), "chatManager", void 0), x(z(a), "usedChannelIds", []), x(z(a), "msgDedupLru", new Wc(void 0, { maxlen: 200 })), x(z(a), "startTime", Date.now()), x(z(a), "seq", P.fromNumber(1, !0)), x(z(a), "userJoinOptions", new et(!1)), x(z(a), "seqSentStatuses", [!1, !1]), x(z(a), "dialogueSequenceLru", new Wc(void 0, { maxlen: 1e4 })), x(z(a), "loggedOut", !1), x(z(a), "messageSentTimes", []), x(z(a), "curLoginSockets", [void 0, void 0]), x(z(a), "loginSocketSubs", [{ channels: /* @__PURE__ */ new Map(), receivers: [] }, { channels: /* @__PURE__ */ new Map(), receivers: [] }]), x(z(a), "lastLoginSockets", [new Te(1), new Te(1)]), x(z(a), "dialPendingMsgSubjectMap", /* @__PURE__ */ new Map()), x(z(a), "context", void 0), x(z(a), "connection", void 0), x(z(a), "instanceId", void 0), x(z(a), "lastPingTime", void 0), x(z(a), "chanelStringMessageReport", void 0), x(z(a), "chanelRawMessageReport", void 0), x(z(a), "p2pSMsgNoOfflineReport", void 0), x(z(a), "p2pRMsgNoOfflineReport", void 0), x(z(a), "registerSocketsFailureListener", function() {
          a.connection.once("socketsFailure", function() {
            a.log("socketsFailure, creating a new connection"), yd(function() {
              return a.connection.removeAllListeners(), a.connection = new ct(a.context, a.logger, !0), a.loginHandler(15e3, !0);
            }).pipe(Re(function(l) {
              return l.pipe(Zd(ue.getParameter("RECONNECTING_AP_INTERVAL")));
            }), Kc(a.connection.apClient.apFinish$)).subscribe(function() {
              a.log("new connection connected");
            });
          }), a.connection.listenerCount("tokenExpired") === 0 && a.connection.on("tokenExpired", function() {
            a.emit("tokenExpired");
          });
        }), a.context = o, a.context.startTime = a.startTime, a.connection = i, a.instanceId = s, a.chatManager = new CE(u), a.lastPingTime = [0, 0], a.setMaxListeners(512), a.log("The instanceId is %s", a.instanceId.toString()), a.chanelStringMessageReport = new zi(o, u, Ka.ChannelSMsg), a.chanelRawMessageReport = new zi(o, u, Ka.ChannelRMsg), a.p2pSMsgNoOfflineReport = new zi(o, u, Ka.P2pSMsgNoOfflineFlag), a.p2pRMsgNoOfflineReport = new zi(o, u, Ka.P2pRMsgNoOfflineFlag), a;
      }
      Ga(t, e);
      var n, r = Ha(t);
      return eb(t, [{ key: "loginHandler", value: function() {
        var o = this, i = 0 < arguments.length && arguments[0] !== void 0 ? arguments[0] : 12e3, s = 1 < arguments.length && arguments[1] !== void 0 && arguments[1];
        if (this.loggedOut && s)
          throw new da("Already logged out, request ignored");
        s && this.registerSocketsFailureListener(), this.connection.initConnection();
        var u = this.getSocketLoginObservables(this.connection.lastOpenSockets, this.seq), a = Date.now();
        return u.forEach(function(l, f) {
          var h = o.loginSocketSubs[f].login;
          h !== void 0 && h.unsubscribe(), o.loginSocketSubs[f].login = l.pipe(sa(function(d) {
            var p;
            o.curLoginSockets[f] = d;
            var v = Date.now();
            bb("Link", { ackedServerIp: d.address, destServerIp: d.ip, ec: 0, sc: 0, elapse: Xa(o.startTime), lts: P.fromNumber(v), responseTime: v - a, sid: sb(o.instanceId), userId: o.context.uid }, (p = o.context.config.enableCloudProxy) !== null && p !== void 0 && p), o.emit("userJoined", d.env), s && o.connection.apClient.apFinish$.next(void 0);
          })).subscribe(o.lastLoginSockets[f]);
        }), this.initKeepAliveSender(), this.initKeepAliveReconnector(), this.initLoginReceiver(), Jb.apply(void 0, Z(u).concat([Db(this.connection, "connectionInitFailure").pipe(sa(function(l) {
          throw Na(l) || Ab(l) ? l : new Ja("Login failure", { code: $r, originalError: l });
        }))])).pipe(hb(1), Lb(i), ab(function(l) {
          return l instanceof Tb && o.warn("Client login timeout"), l && l.code === ti && (o.connection.emit("tokenExpired"), o.connection.apClient.apFinish$.next(void 0)), o.clearSockets(0, s), ra(l);
        }), sa(function() {
          s || o.registerSocketsFailureListener();
        }), fh(function() {
          s || o.connection.apClient.apFinish$.next(void 0);
        }));
      } }, { key: "logoutHandler", value: (n = ma(N.mark(function o() {
        var i, s, u, a = this;
        return N.wrap(function(l) {
          for (; ; )
            switch (l.prev = l.next) {
              case 0:
                return this.loggedOut = !0, this.connection.apClient.apFinish$.next(void 0), i = this.getLoginSockets(), s = i.map(function(f) {
                  return f.sendPacket("UserQuit", {}), a.connection.waitClosing(f);
                }), this.clearSockets(5e3), u = i.map(function(f) {
                  return f.env;
                }), [0, 1].filter(function(f) {
                  return !u.includes(f);
                }).forEach(function(f) {
                  a.connection.closeSocket(f, 0);
                }), l.abrupt("return", Jb.apply(void 0, Z(s)).toPromise());
              case 9:
              case "end":
                return l.stop();
            }
        }, o, this);
      })), function() {
        return n.apply(this, arguments);
      }) }, { key: "requestChannelJoin", value: function() {
        var o = ma(N.mark(function i(s) {
          var u, a, l, f = this;
          return N.wrap(function(h) {
            for (; ; )
              switch (h.prev = h.next) {
                case 0:
                  if (this.getLoginSockets().length !== 0) {
                    h.next = 2;
                    break;
                  }
                  throw new da("Client is not logged in. Cannot join the channel", Wr);
                case 2:
                  return u = Db(this, "channelLeft").pipe(yb(function(d) {
                    return s === d;
                  }), hb(1)), a = this.incGetSeq(), (l = this.lastLoginSockets.map(function(d) {
                    return d.pipe(Kb(function(p, v) {
                      v !== 0 && f.incSeqIfNeeded(p.env);
                      var y = v === 0 ? a : f.seq;
                      return p.sendPacket("GroupEnter", { account: s, seq: y }), p.fromReceived("GroupReply").pipe(Ca(function(g) {
                        return y.eq(g.seq);
                      }), sa(function(g) {
                        if ((g = g.code) !== 0)
                          throw new Ja(["Channel join failure. The response code is %d", g], Sr);
                      }));
                    }), Kc(u), Se());
                  })).forEach(function(d, p) {
                    var v = function() {
                      return f.loginSocketSubs[p].channels.delete(s);
                    };
                    f.loginSocketSubs[p].channels.set(s, d.subscribe({ error: v, complete: v }));
                  }), h.next = 8, Jb.apply(void 0, Z(l)).pipe(hb(1), Lb(1e4), ab(function(d) {
                    return d instanceof Tb && f.warn("Channel join timeout"), ra(d);
                  })).toPromise();
                case 8:
                case "end":
                  return h.stop();
              }
          }, i, this);
        }));
        return function(i) {
          return o.apply(this, arguments);
        };
      }() }, { key: "requestChannelLeave", value: function(o) {
        this.getLoginSockets().forEach(function(i) {
          i.sendPacket("GroupLeave", { account: o });
        });
      } }, { key: "requestUpdateEdgeTicket", value: function(o) {
        var i = this, s = this.getLoginSockets();
        if (s.length === 0)
          throw new da("Client is not logged in. Cannot renew token", hs);
        var u = this.incGetSeq();
        return s.forEach(function(a) {
          a.sendPacket("UserRenewTokenReq", { instance: i.instanceId, seq: u, account: i.context.uid, ticket: o });
        }), fb.apply(void 0, [t.genTimeoutError(Ml)].concat(Z(s.map(function(a) {
          return a.fromReceived("UserRenewTokenResp").pipe(Ca(function(l) {
            var f = l.code;
            return u.eq(l.seq) && f === 0;
          }));
        }))));
      } }, { key: "requestChannelMemberList", value: function(o) {
        var i = this.getLoginSockets();
        if (i.length === 0)
          throw new da("Client is not logged in. Cannot get the channel members", JB);
        var s = this.incGetSeq();
        return i.forEach(function(u) {
          u.sendPacket("GroupAllUsersList", { group: o, pageNumber: 0, pageSize: 200, seq: s });
        }), fb.apply(void 0, [t.genTimeoutError(Qr)].concat(Z(i.map(function(u) {
          return u.fromReceived("GroupAllUsersResult").pipe(Ca(function(a) {
            var l = a.seq;
            return a.group === o && s.eq(l);
          }));
        }))));
      } }, { key: "requestPeersOnlineStatus", value: function(o) {
        var i = this.getLoginSockets();
        if (i.length === 0)
          throw new da("Client is not logged in");
        var s = this.incGetSeq();
        return i.forEach(function(u) {
          u.sendPacket("UserStatusList", { users: o, seq: s });
        }), fb.apply(void 0, [t.genTimeoutError(VB)].concat(Z(i.map(function(u) {
          return u.fromReceived("UserStatusResult").pipe(Ca(function(a) {
            return s.eq(a.seq);
          }));
        }))));
      } }, { key: "requestSetLocalUserAttributes", value: function(o, i) {
        var s = this, u = this.getLoginSockets();
        if (u.length === 0)
          throw new da("Client is not logged in");
        var a = this.incGetSeq();
        return u.forEach(function(l, f) {
          i !== void 0 && f !== i || l.sendPacket("UserAttributeSet", { account: s.context.uid, attributeInfos: Object.entries(o).map(function(h) {
            return { key: (h = $a(h, 2))[0], value: h[1] };
          }), seq: a });
        }), fb.apply(void 0, Z(u.map(function(l) {
          return l.fromReceived("UserAttributeErr").pipe(Ca(function(f) {
            return a.eq(f.seq);
          }), Ea(function(f) {
            throw new Ja(["The user attributes set failure, code %d", f.code], oc);
          }));
        })).concat([t.genTimeoutError(pc)], Z(u.map(function(l) {
          return l.fromReceived("UserAttributeRsp").pipe(Ca(function(f) {
            return a.eq(f.seq);
          }));
        }))));
      } }, { key: "requestSetChannelAttributes", value: function(o, i, s) {
        var u = this.getLoginSockets();
        if (u.length === 0)
          throw new da("Client is not logged in");
        var a = this.incGetSeq();
        return u.forEach(function(l) {
          l.sendPacket("GroupAttributeSet", { broadcast: s, group: o, attributeInfos: Object.entries(i).map(function(f) {
            return { key: (f = $a(f, 2))[0], value: f[1] };
          }), seq: a });
        }), fb.apply(void 0, Z(u.map(function(l) {
          return l.fromReceived("GroupAttributeErr").pipe(Ca(function(f) {
            return a.eq(f.seq);
          }), Ea(function(f) {
            throw new Ja(["The group attributes set failure, code %d", f.code], oc);
          }));
        })).concat([t.genTimeoutError(pc)], Z(u.map(function(l) {
          return l.fromReceived("GroupAttributeRsp").pipe(Ca(function(f) {
            return a.eq(f.seq);
          }));
        }))));
      } }, { key: "requestAddOrUpdateLocalUserAttributes", value: function(o) {
        var i = this, s = this.getLoginSockets();
        if (s.length === 0)
          throw new da("Client is not logged in");
        var u = this.incGetSeq();
        return s.forEach(function(a) {
          a.sendPacket("UserAttributeMod", { account: i.context.uid, attributeInfos: Object.entries(o).map(function(l) {
            return { key: (l = $a(l, 2))[0], value: l[1] };
          }), seq: u });
        }), fb.apply(void 0, Z(s.map(function(a) {
          return a.fromReceived("UserAttributeErr").pipe(Ca(function(l) {
            return u.eq(l.seq);
          }), Ea(function(l) {
            throw new Ja(["The user attributes add or update failure, code %d", l.code], oc);
          }));
        })).concat([t.genTimeoutError(pc)], Z(s.map(function(a) {
          return a.fromReceived("UserAttributeRsp").pipe(Ca(function(l) {
            return u.eq(l.seq);
          }));
        }))));
      } }, { key: "requestAddOrUpdateChannelAttributes", value: function(o, i, s) {
        var u = this.getLoginSockets();
        if (u.length === 0)
          throw new da("Client is not logged in");
        var a = this.incGetSeq();
        return u.forEach(function(l) {
          l.sendPacket("GroupAttributeMod", { broadcast: s, group: o, attributeInfos: Object.entries(i).map(function(f) {
            return { key: (f = $a(f, 2))[0], value: f[1] };
          }), seq: a });
        }), fb.apply(void 0, Z(u.map(function(l) {
          return l.fromReceived("GroupAttributeErr").pipe(Ca(function(f) {
            return a.eq(f.seq);
          }), Ea(function(f) {
            throw new Ja(["The group attributes add or update failure, code %d", f.code], oc);
          }));
        })).concat([t.genTimeoutError(pc)], Z(u.map(function(l) {
          return l.fromReceived("GroupAttributeRsp").pipe(Ca(function(f) {
            return a.eq(f.seq);
          }));
        }))));
      } }, { key: "requestDeleteLocalUserAttributesByKeys", value: function(o) {
        var i = this, s = this.getLoginSockets();
        if (s.length === 0)
          throw new da("Client is not logged in");
        var u = this.incGetSeq();
        return s.forEach(function(a) {
          a.sendPacket("UserAttributeDel", { account: i.context.uid, attributes: o, seq: u });
        }), fb.apply(void 0, Z(s.map(function(a) {
          return a.fromReceived("UserAttributeErr").pipe(Ca(function(l) {
            return u.eq(l.seq);
          }), Ea(function(l) {
            throw new Ja(["The user attributes delete failure, code %d", l.code], oc);
          }));
        })).concat([t.genTimeoutError(pc)], Z(s.map(function(a) {
          return a.fromReceived("UserAttributeRsp").pipe(Ca(function(l) {
            return u.eq(l.seq);
          }));
        }))));
      } }, { key: "requestDeleteChannelAttributesByKeys", value: function(o, i, s) {
        var u = this.getLoginSockets();
        if (u.length === 0)
          throw new da("Client is not logged in");
        var a = this.incGetSeq();
        return u.forEach(function(l) {
          l.sendPacket("GroupAttributeDel", { group: o, broadcast: s, attributes: i, seq: a });
        }), fb.apply(void 0, Z(u.map(function(l) {
          return l.fromReceived("GroupAttributeErr").pipe(Ca(function(f) {
            return a.eq(f.seq);
          }), Ea(function(f) {
            throw new Ja(["The channel attributes delete failure, code %d", f.code], oc);
          }));
        })).concat([t.genTimeoutError(pc)], Z(u.map(function(l) {
          return l.fromReceived("GroupAttributeRsp").pipe(Ca(function(f) {
            return a.eq(f.seq);
          }));
        }))));
      } }, { key: "requestClearLocalUserAttributes", value: function() {
        var o = this, i = this.getLoginSockets();
        if (i.length === 0)
          throw new da("Client is not logged in");
        var s = this.incGetSeq();
        return i.forEach(function(u) {
          u.sendPacket("UserAttributeSet", { account: o.context.uid, seq: s, attributeInfos: [] });
        }), fb.apply(void 0, Z(i.map(function(u) {
          return u.fromReceived("UserAttributeErr").pipe(Ca(function(a) {
            return s.eq(a.seq);
          }), Ea(function(a) {
            throw new Ja(["The user attributes clear failure, code %d", a.code], oc);
          }));
        })).concat([t.genTimeoutError(pc)], Z(i.map(function(u) {
          return u.fromReceived("UserAttributeRsp").pipe(Ca(function(a) {
            return s.eq(a.seq);
          }));
        }))));
      } }, { key: "requestClearChannelAttributes", value: function(o, i) {
        var s = this.getLoginSockets();
        if (s.length === 0)
          throw new da("Client is not logged in");
        var u = this.incGetSeq();
        return s.forEach(function(a) {
          a.sendPacket("GroupAttributeSet", { group: o, seq: u, attributeInfos: [], broadcast: i });
        }), fb.apply(void 0, Z(s.map(function(a) {
          return a.fromReceived("GroupAttributeErr").pipe(Ca(function(l) {
            return u.eq(l.seq);
          }), Ea(function(l) {
            throw new Ja(["The channel attributes clear failure, code %d", l.code], oc);
          }));
        })).concat([t.genTimeoutError(pc)], Z(s.map(function(a) {
          return a.fromReceived("GroupAttributeRsp").pipe(Ca(function(l) {
            return u.eq(l.seq);
          }));
        }))));
      } }, { key: "requestGetUserAttributesByKeys", value: function(o, i) {
        var s = this.getLoginSockets();
        if (s.length === 0)
          throw new da("Client is not logged in");
        var u = this.incGetSeq();
        return s.forEach(function(a) {
          a.sendPacket("UserAttributeGet", { account: o, seq: u, attributes: i });
        }), fb.apply(void 0, [t.genTimeoutError(pc)].concat(Z(s.map(function(a) {
          return a.fromReceived("UserAttributeErr").pipe(Ca(function(l) {
            return u.eq(l.seq);
          }), Ea(function(l) {
            throw (l = l.code) === 10008 ? new Ja("The user requested is not online", Mr) : new ve(["User attribute operation unknown error code: %d", l], oc);
          }));
        })), Z(s.map(function(a) {
          return a.fromReceived("UserAttributeRet").pipe(Ca(function(l) {
            return u.eq(l.seq);
          }));
        }))));
      } }, { key: "requestGetChannelAttributesByKeys", value: function(o, i) {
        var s = this.getLoginSockets();
        if (s.length === 0)
          throw new da("Client is not logged in");
        var u = this.incGetSeq();
        return s.forEach(function(a) {
          a.sendPacket("GroupAttributeGet", { group: o, seq: u, attributes: i });
        }), fb.apply(void 0, [t.genTimeoutError(pc)].concat(Z(s.map(function(a) {
          return a.fromReceived("GroupAttributeErr").pipe(Ca(function(l) {
            return u.eq(l.seq);
          }), Ea(function(l) {
            throw new Ja(["The channel attributes get failure, code %d", l.code], oc);
          }));
        })), Z(s.map(function(a) {
          return a.fromReceived("GroupAttributeRet").pipe(Ca(function(l) {
            return u.eq(l.seq);
          }));
        }))));
      } }, { key: "requestGetUserAttributeKeys", value: function(o) {
        var i = this.getLoginSockets();
        if (i.length === 0)
          throw new da("Client is not logged in");
        var s = this.incGetSeq();
        return i.forEach(function(u) {
          u.sendPacket("UserAttributeKeysGet", { account: o, seq: s });
        }), fb.apply(void 0, [t.genTimeoutError(pc)].concat(Z(i.map(function(u) {
          return u.fromReceived("UserAttributeErr").pipe(Ca(function(a) {
            return s.eq(a.seq);
          }), Ea(function(a) {
            throw (a = a.code) === 10008 ? new Ja("The user requested is not online", Mr) : new ve(["User attribute operation unknown error code: %d", a], oc);
          }));
        })), Z(i.map(function(u) {
          return u.fromReceived("UserAttributeKeysRet").pipe(Ca(function(a) {
            return s.eq(a.seq);
          }));
        }))));
      } }, { key: "requestGetChannelAttributesKeys", value: function(o) {
        var i = this.getLoginSockets();
        if (i.length === 0)
          throw new da("Client is not logged in");
        var s = this.incGetSeq();
        return i.forEach(function(u) {
          u.sendPacket("GroupAttributeKeysGet", { group: o, seq: s });
        }), fb.apply(void 0, [t.genTimeoutError(pc)].concat(Z(i.map(function(u) {
          return u.fromReceived("GroupAttributeErr").pipe(Ca(function(a) {
            return s.eq(a.seq);
          }), Ea(function(a) {
            throw new ve(["Channel attribute operation unknown error code: %d", a.code], oc);
          }));
        })), Z(i.map(function(u) {
          return u.fromReceived("GroupAttributeKeysRet").pipe(Ca(function(a) {
            return s.eq(a.seq);
          }));
        }))));
      } }, { key: "requestGetChannelMemberCount", value: function(o) {
        var i = this.getLoginSockets();
        if (i.length === 0)
          throw new da("Client is not logged in");
        var s = this.incGetSeq();
        return i.forEach(function(u) {
          u.sendPacket("GroupStatusList", { groups: o, seq: s });
        }), fb.apply(void 0, [t.genTimeoutError(Qr)].concat(Z(i.map(function(u) {
          return u.fromReceived("GroupStatusResult").pipe(Ca(function(a) {
            return s.eq(a.seq);
          }));
        }))));
      } }, { key: "requestSubscribePeersOnlineStatus", value: function(o) {
        var i = this.getLoginSockets();
        if (i.length === 0)
          throw new da("Client is not logged in");
        var s = this.incGetSeq();
        return i.forEach(function(u) {
          u.sendPacket("SubscribeUserStatus", { seq: s, users: o });
        }), fb.apply(void 0, [t.genTimeoutError($B)].concat(Z(i.map(function(u) {
          return u.fromReceived("SubscribeResponse").pipe(Ca(function(a) {
            return s.eq(a.seq);
          }));
        }))));
      } }, { key: "requestUnsubscribePeersOnlineStatus", value: function(o) {
        var i = this.getLoginSockets();
        if (i.length === 0)
          throw new da("Client is not logged in");
        var s = this.incGetSeq();
        i.forEach(function(u) {
          u.sendPacket("UnsubscribeUserStatus", { seq: s, users: o });
        });
      } }, { key: "sendInvitationMessage", value: function() {
        var o = ma(N.mark(function i(s) {
          var u, a, l, f, h, d, p, v, y, g, m, E, w = this;
          return N.wrap(function(C) {
            for (; ; )
              switch (C.prev = C.next) {
                case 0:
                  if (u = s.peerId, a = s.callId, l = s.extra, f = s.isAcceptAck, h = s.channelId, d = s.type, p = { callId: a }, f === void 0) {
                    C.next = 6;
                    break;
                  }
                  if (d === "CallAccept") {
                    C.next = 5;
                    break;
                  }
                  throw Error("invalid invitation type");
                case 5:
                  p.type = f ? "ack" : "request";
                case 6:
                  return p.channel = h, (d === "CallInvite" || d === "CallCancel" || d === "CallReject" || d === "CallAccept" && f === !1) && l !== void 0 && (p.extra = l), v = nh(), this.log("The sent invitation body is %o", p), y = function(q) {
                    return { MiscMap: {}, sequence: P.fromNumber(1), dialogue: v, instance: w.instanceId, dst: u, ms: P.fromNumber(Date.now(), !0), options: new Ef({ IterationNumber: q, MessageType: d }).toLong(), payload: new TextEncoder().encode(JSON.stringify(p)), src: w.context.uid };
                  }, C.next = 14, Jc(this.sendMessageToRetry(y, !0)).pipe(Lb(1e4), ab(function(q) {
                    return q instanceof Tb && w.warn("Send invitation timeout"), ra(q);
                  })).toPromise();
                case 14:
                  return g = C.sent, m = g.code, E = g.retryTimes, C.abrupt("return", { hasPeerReceived: m === 0, hasReSent: E !== 0 });
                case 18:
                case "end":
                  return C.stop();
              }
          }, i, this);
        }));
        return function(i) {
          return o.apply(this, arguments);
        };
      }() }, { key: "sendRawMessage", value: function() {
        var o = ma(N.mark(function i(s, u, a, l, f) {
          var h, d, p, v, y, g, m, E, w, C, q, J = this;
          return N.wrap(function(B) {
            for (; ; )
              switch (B.prev = B.next) {
                case 0:
                  if (h = Date.now(), d = l ? Ka.P2pRMsgNoOfflineFlag : Ka.ChannelRMsg, Ta(a) && s instanceof Uint8Array && typeof u == "string") {
                    B.next = 4;
                    break;
                  }
                  throw new ca("The send message arguments are not valid", l ? fs : qi);
                case 4:
                  if (!(32768 < s.byteLength + new Blob([u]).size)) {
                    B.next = 8;
                    break;
                  }
                  throw this.emit("messageCount", { messageCategory: d, type: "common", key: "sentcount" }), this.emit("messageCount", { messageCategory: d, type: "common", key: "invalidmessagecount" }), new ic("The message size is over the 32KB limit", l ? bg : Il);
                case 8:
                  return p = !ue.getParameter("DISABLE_MESSAGE_COMPRESSION") && 128 <= s.byteLength, v = this.chatManager.getChatInfo(a), y = v.dialogue, g = v.sequence, m = this.instanceId, this.log('A%s %s raw message is sending to %s: "'.concat(m, "-").concat(y, "#").concat(g, '"'), p ? " compressed" : "", l ? "peer" : "channel", La(a)), E = function(Y) {
                    return { MiscMap: { description: new TextEncoder().encode(u) }, sequence: g, dialogue: y, instance: m, dst: a, ms: P.fromNumber(Date.now(), !0), options: new Ef({ IterationNumber: Y, CompressionMethod: p ? "Zlib" : "Uncompressed", MessageType: l ? "PeerRawMessage" : "ChannelRawMessage", ToCache: !1, ToArchive: !1 }).toLong(), payload: p ? St(s) : s, src: J.context.uid };
                  }, B.next = 15, Jc(this.sendMessageToRetry(E, !0)).pipe(Lb(f === void 0 ? 1e4 : f), ab(function(Y) {
                    return Y instanceof Tb && J.warn("Send message timeout"), ra(Y);
                  })).toPromise();
                case 15:
                  return w = B.sent, C = w.code, q = C === 0, this.emit("messageCount", { messageCategory: d, type: "common", key: "sentcount" }), q && (this.emit("messageCount", { messageCategory: d, type: "common", key: "successcount" }), this.emit("messageCount", { messageCategory: d, type: l ? "peer" : "recipient", delay: Xa(h).toNumber() })), B.abrupt("return", { hasPeerReceived: q });
                case 21:
                case "end":
                  return B.stop();
              }
          }, i, this);
        }));
        return function(i, s, u, a, l) {
          return o.apply(this, arguments);
        };
      }() }, { key: "sendTextMessage", value: function() {
        var o = ma(N.mark(function i(s, u, a, l) {
          var f, h, d, p, v, y, g, m, E, w, C, q, J = this;
          return N.wrap(function(B) {
            for (; ; )
              switch (B.prev = B.next) {
                case 0:
                  if (f = Date.now(), h = a ? Ka.P2pSMsgNoOfflineFlag : Ka.ChannelSMsg, Ta(u)) {
                    B.next = 4;
                    break;
                  }
                  throw new ca("The send message arguments are not valid", a ? fs : qi);
                case 4:
                  if (!(32768 < new Blob([s]).size)) {
                    B.next = 8;
                    break;
                  }
                  throw this.emit("messageCount", { messageCategory: h, type: "common", key: "sentcount" }), this.emit("messageCount", { messageCategory: h, type: "common", key: "invalidmessagecount" }), new ic("The message size is over the 32KB limit", a ? bg : Il);
                case 8:
                  return d = !ue.getParameter("DISABLE_MESSAGE_COMPRESSION") && 128 <= new Blob([s]).size, p = this.chatManager.getChatInfo(u), v = p.dialogue, y = p.sequence, g = this.instanceId, this.log('A%s %s message is sending to %s: "'.concat(g, "-").concat(v, "#").concat(y, '"'), d ? " compressed" : "", a ? "peer" : "channel", La(u)), m = new TextEncoder().encode(s), E = function(Y) {
                    return { MiscMap: {}, sequence: y, dialogue: v, instance: g, dst: u, ms: P.fromNumber(Date.now(), !0), options: new Ef({ IterationNumber: Y, CompressionMethod: d ? "Zlib" : "Uncompressed", MessageType: a ? "PeerTextMessage" : "ChannelTextMessage", ToCache: !1, ToArchive: !1 }).toLong(), payload: d ? St(m) : m, src: J.context.uid };
                  }, B.next = 16, Jc(this.sendMessageToRetry(E, !0)).pipe(Lb(l === void 0 ? 1e4 : l), ab(function(Y) {
                    return Y instanceof Tb && (J.emit("messageCount", { messageCategory: h, type: "common", key: "sentcount" }), J.emit("messageCount", { messageCategory: h, type: "common", key: "timeoutcount" }), J.warn("Send message timeout")), ra(Y);
                  })).toPromise();
                case 16:
                  return w = B.sent, C = w.code, q = C === 0, this.emit("messageCount", { messageCategory: h, type: "common", key: "sentcount" }), q && (this.emit("messageCount", { messageCategory: h, type: "common", key: "successcount" }), this.emit("messageCount", { messageCategory: h, type: a ? "peer" : "recipient", delay: Xa(f).toNumber() })), B.abrupt("return", { hasPeerReceived: q });
                case 22:
                case "end":
                  return B.stop();
              }
          }, i, this);
        }));
        return function(i, s, u, a) {
          return o.apply(this, arguments);
        };
      }() }, { key: "cleanLoginSubs", value: function(o, i) {
        Object.entries(this.loginSocketSubs[o]).forEach(function(s) {
          var u = (s = $a(s, 2))[1];
          s[0] === "channels" && i || (Array.isArray(u) || u instanceof Map ? u.forEach(function(a) {
            return a.unsubscribe();
          }) : u && u.unsubscribe());
        }), this.loginSocketSubs[o] = { channels: i ? this.loginSocketSubs[o].channels : /* @__PURE__ */ new Map(), receivers: [] };
      } }, { key: "sendMessageToRetry", value: function() {
        var o = ma(N.mark(function i(s, u) {
          var a, l, f, h, d, p, v, y, g, m = this, E = arguments;
          return N.wrap(function(w) {
            for (; ; )
              switch (w.prev = w.next) {
                case 0:
                  if (a = 2 < E.length && E[2] !== void 0 ? E[2] : 0, this.log("Attempt to send the message ".concat(u ? " with retrying, %o" : "without retrying"), { retryTimes: a }), (l = this.getLoginSockets()).length !== 0) {
                    w.next = 5;
                    break;
                  }
                  throw Error("no logged-in sockets");
                case 5:
                  return f = s(a), l.forEach(function(C) {
                    C.sendPacket("Message", f);
                  }), h = f.dialogue, d = f.sequence, p = f.instance, v = l.map(function(C) {
                    return C.fromReceived("Ack").pipe(yb(function(q) {
                      return h.eq(q.dialogue) && d.eq(q.sequence) && p.eq(q.instance);
                    }));
                  }), w.prev = 9, w.next = 12, Jb.apply(void 0, Z(v)).pipe(Lb(6e3), ab(function(C) {
                    return Ab(C) && m.warn("Message send timeout, retry times %d", a), ra(C);
                  }), hb(1)).toPromise();
                case 12:
                  return y = w.sent, g = y.code, this.log("The message has been acked, %o", { code: g }), w.abrupt("return", { code: g, retryTimes: a });
                case 18:
                  if (w.prev = 18, w.t0 = w.catch(9), !(w.t0 instanceof Tb && u)) {
                    w.next = 22;
                    break;
                  }
                  return w.abrupt("return", this.sendMessageToRetry(s, !1, a + 1));
                case 22:
                  throw w.t0;
                case 23:
                case "end":
                  return w.stop();
              }
          }, i, this, [[9, 18]]);
        }));
        return function(i, s) {
          return o.apply(this, arguments);
        };
      }() }, { key: "initKeepAliveSender", value: function() {
        var o = this;
        this.lastLoginSockets.map(function(i) {
          return i.pipe(Kb(function(s) {
            return dd(0, 2500, Ce() ? void 0 : oF).pipe(sa(function() {
              o.sendPing(s);
            }));
          }));
        }).forEach(function(i, s) {
          var u = o.loginSocketSubs[s].keepAlive;
          u !== void 0 && u.unsubscribe(), o.loginSocketSubs[s].keepAlive = i.subscribe({ error: function() {
          } });
        });
      } }, { key: "initKeepAliveReconnector", value: function() {
        var o = this;
        this.lastLoginSockets.map(function(i) {
          return i.pipe(Kb(function(s) {
            var u, a = !1, l = s.userJoin$.pipe(sa(function() {
              a = !0;
            })), f = s.input$.pipe(sa(function(h) {
              yj[h.uri].slice(0, -3) !== "Ping" && (a = !1);
            }));
            return Jb(dd(6e3, 1e4).pipe(yv(s.receivedPacket), sa(function(h) {
              h = $a(h, 2), h = $a(h[1], 2)[1], u !== h || a || s.forceReconnect(), u = h;
            })), l, f);
          }));
        }).forEach(function(i, s) {
          var u = o.loginSocketSubs[s].keepAliveReconnector;
          u !== void 0 && u.unsubscribe(), o.loginSocketSubs[s].keepAliveReconnector = i.subscribe({ error: function() {
          } });
        });
      } }, { key: "initLoginReceiver", value: function() {
        var o = this;
        fb.apply(void 0, Z(this.lastLoginSockets.map(function(u) {
          return u.pipe(Kb(function(a) {
            return a.fromReceived("UserTicketNearlyExpire").pipe(sv(5e3), sa(o.onUserTicketNearlyExpire(a)));
          }));
        }))).subscribe();
        var i = Db(this, "messageCount"), s = i.pipe(yb(function(u) {
          return u.messageCategory === Ka.ChannelSMsg;
        }));
        s.subscribe(function(u) {
          return o.updateMessageCount(u);
        }), s.pipe(dh(6e3)).subscribe(function(u) {
          u.length && o.chanelStringMessageReport.report();
        }), Jb(ob(void 0), s).pipe(Kb(function() {
          return Qe(36e5);
        })).subscribe(function() {
          o.chanelStringMessageReport.report();
        }), (s = i.pipe(yb(function(u) {
          return u.messageCategory === Ka.ChannelRMsg;
        }))).subscribe(function(u) {
          return o.updateMessageCount(u);
        }), s.pipe(dh(6e3)).subscribe(function(u) {
          u.length && o.chanelRawMessageReport.report();
        }), Jb(ob(void 0), s).pipe(Kb(function() {
          return Qe(36e5);
        })).subscribe(function() {
          o.chanelRawMessageReport.report();
        }), (s = i.pipe(yb(function(u) {
          return u.messageCategory === Ka.P2pSMsgNoOfflineFlag;
        }))).subscribe(function(u) {
          return o.updateMessageCount(u);
        }), s.pipe(dh(6e3)).subscribe(function(u) {
          u.length && o.p2pSMsgNoOfflineReport.report();
        }), Jb(ob(void 0), s).pipe(Kb(function() {
          return Qe(36e5);
        })).subscribe(function() {
          o.p2pSMsgNoOfflineReport.report();
        }), (i = i.pipe(yb(function(u) {
          return u.messageCategory === Ka.P2pRMsgNoOfflineFlag;
        }))).subscribe(function(u) {
          return o.updateMessageCount(u);
        }), i.pipe(dh(6e3)).subscribe(function(u) {
          u.length && o.p2pRMsgNoOfflineReport.report();
        }), Jb(ob(void 0), i).pipe(Kb(function() {
          return Qe(36e5);
        })).subscribe(function() {
          o.p2pSMsgNoOfflineReport.report();
        }), this.lastLoginSockets.map(function(u) {
          return u.pipe(Kb(function(a) {
            return Jb(Db(a, "reconnect").pipe(sa(o.onSocketReconnect(a))), a.fromReceived("Message").pipe(sa(o.onMessage(a))), a.fromReceived("GroupEnterNotice").pipe(sa(o.onGroupEnterNotice())), a.fromReceived("GroupLeaveNotice").pipe(sa(o.onGroupLeaveNotice())), a.fromReceived("GroupCountNotice").pipe(sa(o.onGroupCountNotice())), a.fromReceived("GroupAttributeAlt").pipe(sa(o.onGroupAttributeAlt())), a.fromReceived("UserJoinNotice").pipe(sa(o.onUserNotice(ta.PeerOnlineState.ONLINE))), a.fromReceived("UserQuitNotice").pipe(sa(o.onUserNotice(ta.PeerOnlineState.OFFLINE))), a.fromReceived("UserWaitNotice").pipe(sa(o.onUserNotice(ta.PeerOnlineState.UNREACHABLE))), a.fromReceived("Pong").pipe(sa(o.onPong())), a.fromReceived("UserDrop").pipe(sa(o.onUserDrop(a))), a.fromReceived("GroupDrop").pipe(sa(o.onGroupDrop()))).pipe(Uf(void 0));
          }));
        }).forEach(function(u, a) {
          o.loginSocketSubs[a].receivers.push(u.subscribe({ error: function() {
          } }));
        });
      } }, { key: "requestSocketLogin", value: function(o, i, s) {
        var u = this;
        return nn(yd(function() {
          u.userJoinOptions = new et(i), o.sendPacket("UserJoin", { account: u.context.uid, instance: u.instanceId, opt: u.userJoinOptions.toLong(), seq: s, ticket: o.ticket });
        }), o.fromReceived("UserResp").pipe(Ca(function(a) {
          return s.eq(a.seq);
        }), sa(function(a) {
          if ((a = a.code) !== 0)
            throw u.clearSockets(), u.logError("Connected to gateway success but the Rtm server rejected login"), new Ja(["Login failure. The response code from the RTM service is %d", a], Pg);
          o.attemptsSinceLastError = 0, o.loggedIn = !0, u.log("ENV_%d logged in", o.env);
        }), Uf(o), Lb(6e3))).pipe(yb(function(a) {
          return a !== void 0;
        }), ab(function(a) {
          return a instanceof Tb && u.warn("Login response timeout, rejoin: %s", i), u.clearSockets(), a.name = "loginRespTimeout", u.emit("banEdgeIP", o.ip), ra(a);
        }));
      } }, { key: "getSocketLoginObservables", value: function(o, i) {
        var s = this;
        return o.map(function(u) {
          return u.pipe(Kb(function(a, l) {
            return s.incSeqIfNeeded(a.env), s.requestSocketLogin(a, l !== 0, l === 0 ? i : s.seq);
          }), Se());
        });
      } }, { key: "incSeqIfNeeded", value: function(o) {
        if (![0, 1].includes(o))
          throw new mb({ INVALID_ENV: "The env argument is not 0 or 1" });
        this.seqSentStatuses[o] && (this.seq = this.seq.add(1), this.seqSentStatuses = [!1, !1]), this.seqSentStatuses[o] = !0;
      } }, { key: "incGetSeq", value: function() {
        return this.seq = this.seq.add(1), this.seqSentStatuses = [!0, !0], this.seq;
      } }, { key: "getLoginSockets", value: function() {
        for (var o = this.curLoginSockets, i = -1, s = o == null ? 0 : o.length, u = 0, a = []; ++i < s; ) {
          var l = o[i];
          l && (a[u++] = l);
        }
        return a;
      } }, { key: "emitMessage", value: function(o, i) {
        var s, u = o.options, a = o.payload, l = o.src, f = o.dst, h = o.instance, d = o.dialogue, p = o.sequence, v = o.ms, y = o.MiscMap;
        this.dialogueSequenceLru.set(d.toString(), p), h = "".concat(h, "-").concat(d, "#").concat(p), this.msgDedupLru.has(h) ? this.warn("Env_%d: Messages out-of-order or not start with 1: %s", i, h) : (this.msgDedupLru.set(h, void 0), u = new Ef(u), this.lastLoginSockets.forEach((s = ma(N.mark(function g(m) {
          var E;
          return N.wrap(function(w) {
            for (; ; )
              switch (w.prev = w.next) {
                case 0:
                  return w.next = 2, m.pipe(hb(1)).toPromise();
                case 2:
                  E = w.sent, t.sendMessageAck(o, E);
                case 4:
                case "end":
                  return w.stop();
              }
          }, g);
        })), function(g) {
          return s.apply(this, arguments);
        })), i = u.isZlibCompressed(), u.isInvitation() ? (f = cg(i ? mm(ao(a, Uint8Array.of(0, 0, 0, 0))) : a), f = JSON.parse(f), this.log("The received invitation body is %o", f), this.emit("invitationMessage", { body: f, type: u.getInvitationType(), peerId: l, serverReceivedTs: v.toNumber() })) : u.isTextMessage() ? (y = u.isPeerTextMessage(), a = cg(i ? mm(ao(a, Uint8Array.of(0, 0, 0, 0))) : a), this.info("Received a %s %s text message from %s to %s, %s", i ? " compressed" : "", y ? "peer" : "channel", La(l), La(f), h), y ? (l = { text: a, peerId: l, properties: { serverReceivedTs: v.toNumber() } }, this.emit("peerTextMessage", l), this.emit("messageCount", { messageCategory: Ka.P2pSMsgNoOfflineFlag, type: "common", key: "receivedcount" })) : (this.emit("channelTextMessage", { channelId: f, memberId: l, text: a, properties: { serverReceivedTs: v.toNumber() } }), this.emit("messageCount", { messageCategory: Ka.ChannelSMsg, type: "common", key: "receivedcount" }))) : u.isRawMessage() && (u = u.isRawPeerMessage(), y = (y = y.description) === void 0 ? "" : cg(y), a = i ? mm(a) : a, this.info("Received a %s %s raw message from %s to %s, %s", i ? " compressed" : "", u ? "peer" : "channel", La(l), La(f), h), u ? (l = { desc: y, raw: a, peerId: l, properties: { serverReceivedTs: v.toNumber() } }, this.emit("peerRawMessage", l), this.emit("messageCount", { messageCategory: Ka.P2pRMsgNoOfflineFlag, type: "common", key: "receivedcount" })) : (this.emit("channelRawMessage", { desc: y, raw: a, channelId: f, memberId: l, properties: { serverReceivedTs: v.toNumber() } }), this.emit("messageCount", { messageCategory: Ka.ChannelRMsg, type: "common", key: "receivedcount" }))));
      } }, { key: "onSocketReconnect", value: function(o) {
        var i = this;
        return function() {
          var s = [0, 1].filter(function(u) {
            return u !== o.env;
          })[0];
          (s = i.connection.curOpenSockets[s]) && !s.loggedIn && i.emit("connectionLost");
        };
      } }, { key: "onUserTicketNearlyExpire", value: function(o) {
        var i = this;
        return function(s) {
          (s = s.ticket) !== i.lastNoticeTicket && s === o.ticket ? (i.lastNoticeTicket = s, i.emit("tokenPrivilegeWillExpire")) : i.requestUpdateEdgeTicket(o.ticket).toPromise();
        };
      } }, { key: "onGroupDrop", value: function() {
        var o = this;
        return function(i) {
          var s, u = i.account;
          bb("ChnLeave", { cname: u, lts: P.fromNumber(Date.now()), elapse: Xa(o.startTime), errCode: RB, sid: sb(o.instanceId), userId: o.context.uid }, (s = o.context.config.enableCloudProxy) !== null && s !== void 0 && s), [0, 1].forEach(function(a) {
            return o.loginSocketSubs[a].channels.delete(u);
          }), o.logError("the user is kicked out of the current channel");
        };
      } }, { key: "onUserDrop", value: function(o) {
        var i = this;
        return function(s) {
          var u;
          s = s.code, bb("KickedOff", { code: 0, elapse: Xa(i.startTime), linkId: parseInt(o.name.split("-")[1], 10), lts: P.fromNumber(Date.now()), server: o.address, serverCode: s, sid: sb(i.instanceId), userId: i.context.uid }, (u = i.context.config.enableCloudProxy) !== null && u !== void 0 && u), s === 10006 || s === 10001 ? i.warn("Login too often and kicked off, reconnect and login") : s === 10009 ? (i.warn("The instance ID conflicts, reconnecting"), i.instanceId = nh(), i.context.sid = sb(i.instanceId), i.emit("instanceChanged", i.instanceId)) : [2, 11, 14, 15, 16].includes(s) && (i.emit("userDrop", s), i.clearSockets());
        };
      } }, { key: "clearSockets", value: function() {
        var o = this, i = 0 < arguments.length && arguments[0] !== void 0 ? arguments[0] : 0, s = 1 < arguments.length && arguments[1] !== void 0 && arguments[1];
        [0, 1].forEach(function(u) {
          o.cleanLoginSubs(u, s), o.connection.closeSocket(u, i);
        });
      } }, { key: "onMessage", value: function(o) {
        var i = this;
        return function(s) {
          var u = s.dialogue, a = s.instance, l = s.sequence, f = s.options;
          if (s.src === i.context.uid)
            i.log("The message is from the local account, ignored");
          else {
            var h = u.toString(), d = i.dialPendingMsgSubjectMap.get(h);
            if (u = "".concat(a, "-").concat(u, "#").concat(l), d)
              d.next(s), i.log("Env_%d: The dialogue has pending messages, next: %s", o.env, u);
            else {
              var p = i.dialogueSequenceLru.get(h);
              if (d = !p && l.eq(1), a = p !== void 0 && l.sub(p).eq(1), d || a)
                i.emitMessage(s, o.env);
              else {
                if (p) {
                  if (l.lte(p))
                    return;
                  i.log("Env_%d: The message pended, the sequence is not continuous with the last: %s", o.env, u);
                } else
                  i.log("Env_%d: The message pended, the first sequence is not equal to 1: %s", o.env, u);
                l = new rb(), i.dialPendingMsgSubjectMap.set(h, l);
                var v = l.pipe(Au(zl), gh(function(y, g) {
                  return [].concat(Z(y), [g]);
                }, []), Ea(function(y) {
                  return Z(y).sort(function(g, m) {
                    return g = g.sequence, m = m.sequence, g.eq(m) ? 0 : g.gt(m) ? 1 : -1;
                  });
                }), wn(1));
                f = !(f = new Ef(f)).isFromCache() && !f.isBufferedMessage(), v.pipe(Kc(dd(f ? 750 : 1500)), Ca(function(y) {
                  if (2 > y.length)
                    return !1;
                  for (var g = p === void 0 ? P.fromNumber(1, !0) : p.add(1), m = 0; m < y.length; g = g.add(1), m++)
                    if (!y[m].sequence.eq(g))
                      return !1;
                  return !0;
                }), fh(function() {
                  i.dialPendingMsgSubjectMap.delete(h);
                })).subscribe(function(y) {
                  y.forEach(function(g) {
                    i.emitMessage(g, o.env), i.log("Env_%d: The message queue has fully ordered, emitting: %s", o.env, "".concat(g.instance, "-").concat(g.dialogue, "#").concat(g.sequence));
                  });
                }, function(y) {
                  y instanceof eh && v.pipe(hb(1)).subscribe(function(g) {
                    return g.forEach(function(m) {
                      i.log("Env_%d: The message pending queue expired, emitting: %s", o.env, "".concat(m.instance, "-").concat(m.dialogue, "#").concat(m.sequence)), i.emitMessage(m, o.env);
                    });
                  });
                }), l.next(s);
              }
            }
          }
        };
      } }, { key: "onPong", value: function() {
        var o = this;
        return function() {
          document.hidden && o.getLoginSockets().forEach(function(i) {
            o.sendPing(i);
          });
        };
      } }, { key: "onGroupEnterNotice", value: function() {
        var o = this;
        return function(i) {
          o.emit("memberNotice", { channelId: i.group, seq: i.seq, instance: i.instance, memberId: i.user, type: "MemberJoined", size: i.size });
        };
      } }, { key: "onGroupLeaveNotice", value: function() {
        var o = this;
        return function(i) {
          o.emit("memberNotice", { channelId: i.group, seq: i.seq, instance: i.instance, memberId: i.user, type: "MemberLeft", size: i.size });
        };
      } }, { key: "onGroupCountNotice", value: function() {
        var o = this;
        return function(i) {
          o.emit("memberNotice", { channelId: i.group, seq: i.seq, instance: i.instance, type: "MemberCountUpdated", size: i.size });
        };
      } }, { key: "onGroupAttributeAlt", value: function() {
        var o = this;
        return function(i) {
          var s = i.group;
          i = Ki(i, pF), o.emit("channelAttributesUpdated", Wa({ channelId: s }, i));
        };
      } }, { key: "onUserNotice", value: function(o) {
        var i = this;
        return function(s) {
          i.emit("peerOnlineStatusChanged", { peerId: s.user, instance: s.instance, seq: s.seq, state: o });
        };
      } }, { key: "sendPing", value: function(o) {
        2500 >= Date.now() - this.lastPingTime[o.env] || (this.incSeqIfNeeded(o.env), o.sendPacket("Ping", { ms: P.fromNumber(Date.now(), !0), seq: this.seq }), this.lastPingTime[o.env] = Date.now());
      } }, { key: "updateMessageCount", value: function(o) {
        var i, s = (i = {}, x(i, Ka.ChannelRMsg, this.chanelRawMessageReport), x(i, Ka.ChannelSMsg, this.chanelStringMessageReport), x(i, Ka.P2pRMsgNoOfflineFlag, this.p2pRMsgNoOfflineReport), x(i, Ka.P2pSMsgNoOfflineFlag, this.p2pSMsgNoOfflineReport), x(i, 3, void 0), x(i, 4, void 0), x(i, 7, void 0), x(i, 8, void 0), x(i, 9, void 0), x(i, 10, void 0), i)[o.messageCategory];
        o.type === "common" ? s == null || s.updateCommonCount(o.key) : o.type === "peer" ? s == null || s.updatePeerAckCount(o.delay) : s == null || s.updateNorecipientackCount(o.delay);
      } }], [{ key: "sendMessageAck", value: function(o, i) {
        var s = new Ef(o.options);
        (s.isInvitation() || s.isPeerMessage()) && i.sendPacket("Ack", { code: 0, dialogue: o.dialogue, instance: o.instance, sequence: o.sequence });
      } }]), t;
    }(sc());
    x(Tt, "genTimeoutError", function(e, t) {
      return ob(void 0).pipe(Zd(t === void 0 ? 1e4 : t), Ea(function() {
        throw new Ub(["Request timed out after %ds", (t === void 0 ? 1e4 : t) / 1e3], e);
      }));
    });
    var Ut, nm, om = 0, pm = 0;
    Ng.v1 = function(e, t, n) {
      n = t && n || 0;
      var r = t || [], o = (e = e || {}).node || Ut, i = e.clockseq !== void 0 ? e.clockseq : nm;
      if (o == null || i == null) {
        var s = Kr();
        o == null && (o = Ut = [1 | s[0], s[1], s[2], s[3], s[4], s[5]]), i == null && (i = nm = 16383 & (s[6] << 8 | s[7]));
      }
      s = e.msecs !== void 0 ? e.msecs : (/* @__PURE__ */ new Date()).getTime();
      var u = e.nsecs !== void 0 ? e.nsecs : pm + 1, a = s - om + (u - pm) / 1e4;
      if (0 > a && e.clockseq === void 0 && (i = i + 1 & 16383), (0 > a || s > om) && e.nsecs === void 0 && (u = 0), 1e4 <= u)
        throw Error("uuid.v1(): Can't create more than 10M uuids/sec");
      for (om = s, pm = u, nm = i, e = (1e4 * (268435455 & (s += 122192928e5)) + u) % 4294967296, r[n++] = e >>> 24 & 255, r[n++] = e >>> 16 & 255, r[n++] = e >>> 8 & 255, r[n++] = 255 & e, e = s / 4294967296 * 1e4 & 268435455, r[n++] = e >>> 8 & 255, r[n++] = 255 & e, r[n++] = e >>> 24 & 15 | 16, r[n++] = e >>> 16 & 255, r[n++] = i >>> 8 | 128, r[n++] = 255 & i, i = 0; 6 > i; ++i)
        r[n + i] = o[i];
      return t || Lr(r);
    }, Ng.v4 = Ng;
    var qm = yi(), Sd, Hf = ta.LocalInvitationFailureReason, Sa = ta.LocalInvitationState, qF = (Sd = function(e) {
      function t(r, o, i) {
        va(this, t);
        var s = n.call(this, i, "RtmLocalInvitation", !0);
        return x(z(s), "state", Sa.IDLE), x(z(s), "localInvitationEnd$", fb(Db(z(s), "LocalInvitationAccepted"), Db(z(s), "LocalInvitationRefused"), Db(z(s), "LocalInvitationFailure"), Db(z(s), "LocalInvitationCanceled")).pipe(hb(1))), x(z(s), "callId", Ng.v4()), x(z(s), "_content", ""), x(z(s), "_channelId", ""), x(z(s), "_response", ""), x(z(s), "calleeId", void 0), x(z(s), "logger", void 0), x(z(s), "getSession", void 0), s.calleeId = r, s.getSession = o, s.logger = i, s;
      }
      Ga(t, e);
      var n = Ha(t);
      return eb(t, [{ key: "channelId", get: function() {
        return this._channelId;
      }, set: function(r) {
        this.state !== Sa.IDLE ? this.info("set channelId only allow before invitation sent to remote") : (this.log("set channelId for %s", this.callId), this._channelId = r);
      } }, { key: "content", get: function() {
        return this._content;
      }, set: function(r) {
        this.log("set content for %s", this.callId), this._content = r;
      } }, { key: "response", get: function() {
        return this._response;
      }, set: function(r) {
        throw new ca('Cannot set the "response" of the LocalInvitation instance.', Xc);
      } }, { key: "send", value: function() {
        var r, o = this;
        if (this.state === Sa.SENT_TO_REMOTE || this.state === Sa.RECEIVED_BY_REMOTE)
          throw new da("The local invitation send failure. The call invitation has already been sent.", NB);
        if (this.isLocalInvitationEnd())
          throw new da("The local invitation send failure. The call invitation has ended.", ri);
        if (0 < this._channelId.length && !Ta(this._channelId))
          throw new ca("Illegal invitation channel ID", Xc);
        if (!Ta(this.calleeId))
          throw new ca("Illegal invitation callee user ID", Xc);
        if (8192 < rh(this._content))
          throw new ca('The length of the "content" overflows. The number of bytes representing content must not exceed 8 × 1024 if encoded in UTF-8.', Xc);
        this.state = Sa.SENT_TO_REMOTE, yd(ma(N.mark(function i() {
          var s, u, a;
          return N.wrap(function(l) {
            for (; ; )
              switch (l.prev = l.next) {
                case 0:
                  return l.next = 2, o.getSession().sendInvitationMessage({ peerId: o.calleeId, callId: o.callId, extra: o._content, type: "CallInvite", channelId: o._channelId });
                case 2:
                  if (s = l.sent, u = s.hasPeerReceived, a = s.hasReSent, !o.isLocalInvitationEnd()) {
                    l.next = 7;
                    break;
                  }
                  throw new Ub("send invitation timeout");
                case 7:
                  if (o.log("The local invitation has sent to the callee"), u || a) {
                    l.next = 11;
                    break;
                  }
                  throw r = new qm({ PEER_NOT_ONLINE: "The peer of the invitation is not online" });
                case 11:
                  if (u) {
                    l.next = 14;
                    break;
                  }
                  throw r = new qm({ RESENT_AND_OFFLINE: "Resent and the peer of the invitation is not online" });
                case 14:
                case "end":
                  return l.stop();
              }
          }, i);
        }))).pipe(Re(function(i) {
          return i.pipe(sa(function(s) {
            if (!(s instanceof qm))
              throw s;
          }), Zd(2e3));
        }), Lb(3e4), ab(function(i) {
          return Ab(i) && o.warn("local invitation ack timed out"), ra(i);
        }), Kc(this.localInvitationEnd$)).subscribe({ next: function() {
          o.state === Sa.RECEIVED_BY_REMOTE ? o.log('The local invitation state is already "RECEIVED_BY_REMOTE", skipped emitting "LocalInvitationReceivedByPeer"') : o.state !== Sa.SENT_TO_REMOTE ? o.log("The invitation has ended, skipped emitting the %s event", "LocalInvitationReceivedByPeer") : (o.info("The peer received the local invitation %s.", o.callId), o.state = Sa.RECEIVED_BY_REMOTE, o.emit("LocalInvitationReceivedByPeer"), o.localInvitationEnd$.pipe(Lb(6e4), ab(function(i) {
            return Ab(i) && o.warn("local invitation expired"), ra(i);
          })).subscribe({ error: function() {
            o.state = Sa.FAILURE, o.emit("LocalInvitationFailure", Hf.INVITATION_EXPIRE);
          } }));
        }, error: function(i) {
          o.isLocalInvitationEnd() ? o.log("The invitation has ended, skipped emitting the %s event", "LocalInvitationFailure") : (o.state = Sa.FAILURE, Ab(i) && r ? r.code === "PEER_NOT_ONLINE" ? o.emit("LocalInvitationFailure", Hf.PEER_OFFLINE) : r.code === "RESENT_AND_OFFLINE" && o.emit("LocalInvitationFailure", Hf.PEER_NO_RESPONSE) : Ab(i) ? o.emit("LocalInvitationFailure", Hf.PEER_NO_RESPONSE) : i.name === "RtmInvalidStatusError" ? o.emit("LocalInvitationFailure", Hf.NOT_LOGGEDIN) : o.emit("LocalInvitationFailure", Hf.UNKNOWN));
        } });
      } }, { key: "cancel", value: function() {
        if (this.isLocalInvitationEnd())
          throw new da("The local invitation cancel failure", ri);
        if (this.state === Sa.IDLE)
          throw new da("The local invitation has not been sent", MB);
        if (8192 < rh(this._content))
          throw new ca('The length of the "content" overflows. The number of bytes representing content must not exceed 8 × 1024 if encoded in UTF-8.', Xc);
        this.getSession().sendInvitationMessage({ callId: this.callId, peerId: this.calleeId, type: "CallCancel", channelId: this._channelId, extra: this._content }), this.state = Sa.CANCELED, this.emit("LocalInvitationCanceled");
      } }, { key: "onAcceptReceived", value: function(r) {
        if (this.isLocalInvitationEnd() && this.state !== Sa.ACCEPTED_BY_REMOTE)
          this.log("The invitation has ended, skipped emitting the %s event", "LocalInvitationAccepted");
        else {
          if (this.state === Sa.IDLE)
            throw new da("the local have not sent the invitation, how can remote accept it?");
          this.getSession().sendInvitationMessage({ callId: this.callId, isAcceptAck: !0, type: "CallAccept", peerId: this.calleeId, channelId: this.channelId }), this.state === Sa.ACCEPTED_BY_REMOTE ? this.log("already in ACCEPTED_BY_REMOTE state, ignore emit ACCEPTED_BY_REMOTE") : (this.state === Sa.SENT_TO_REMOTE && (this.log("receive LocalInvitationAccepted before remote response to the invitation"), this.state = Sa.RECEIVED_BY_REMOTE, this.emit("LocalInvitationReceivedByPeer")), this.state = Sa.ACCEPTED_BY_REMOTE, this._response = r, this.emit("LocalInvitationAccepted", r));
        }
      } }, { key: "onRefuseReceived", value: function(r) {
        if (this.isLocalInvitationEnd())
          this.log("The invitation has ended, skipped emitting the %s event", "LocalInvitationRefused");
        else {
          if (this.state === Sa.IDLE)
            throw new da("the local have not sent the invitation, how can remote refuse it?");
          this.state === Sa.SENT_TO_REMOTE && (this.log("receive LocalInvitationRefused before remote response to the invitation"), this.state = Sa.RECEIVED_BY_REMOTE, this.emit("LocalInvitationReceivedByPeer")), this._response = r, this.state = Sa.REFUSED_BY_REMOTE, this.emit("LocalInvitationRefused", r);
        }
      } }, { key: "isLocalInvitationEnd", value: function() {
        return [Sa.CANCELED, Sa.FAILURE, Sa.ACCEPTED_BY_REMOTE, Sa.REFUSED_BY_REMOTE].includes(this.state);
      } }]), t;
    }(sc()), Da(Sd.prototype, "send", [Mc], Object.getOwnPropertyDescriptor(Sd.prototype, "send"), Sd.prototype), Da(Sd.prototype, "cancel", [Mc], Object.getOwnPropertyDescriptor(Sd.prototype, "cancel"), Sd.prototype), Sd), Hi = ta.RemoteInvitationFailureReason, Fb = ta.RemoteInvitationState, rF = function(e) {
      function t(r) {
        var o = r.invitationChannel, i = r.extraContent, s = r.callId, u = r.callerId, a = r.logger;
        r = r.getSession, va(this, t);
        var l = n.call(this, a, "RtmRemoteInvitation", !0);
        return x(z(l), "state", Fb.INVITATION_RECEIVED), x(z(l), "remoteInvitationEnd$", fb(Db(z(l), "RemoteInvitationCanceled"), Db(z(l), "RemoteInvitationRefused"), Db(z(l), "RemoteInvitationAccepted"), Db(z(l), "RemoteInvitationFailure")).pipe(hb(1))), x(z(l), "callerId", void 0), x(z(l), "callId", void 0), x(z(l), "_getSession", void 0), x(z(l), "logger", void 0), x(z(l), "_content", void 0), x(z(l), "_channelId", void 0), x(z(l), "_response", ""), l._channelId = o, l._content = i, l.callId = s, l.callerId = u, l._getSession = r, l.logger = a, l.remoteInvitationEnd$.pipe(Lb(6e4), ab(function(f) {
          return Ab(f) && l.warn("Remote invitation expired"), ra(f);
        })).subscribe({ error: function() {
          l.state = Fb.FAILURE, l.emit("RemoteInvitationFailure", Hi.INVITATION_EXPIRE);
        } }), l;
      }
      Ga(t, e);
      var n = Ha(t);
      return eb(t, [{ key: "channelId", get: function() {
        return this._channelId;
      }, set: function(r) {
        throw new ca('Cannot set the "response" of the RemoteInvitation instance.', Xc);
      } }, { key: "content", get: function() {
        return this._content;
      }, set: function(r) {
        throw new ca('Cannot set the "content" of the RemoteInvitation instance.', Xc);
      } }, { key: "response", get: function() {
        return this._response;
      }, set: function(r) {
        this._response = r;
      } }, { key: "accept", value: function() {
        var r, o = this;
        if (this.isRemoteInvitationEnd())
          throw new da("The local invitation has ended. Cannot accept.", ri);
        if (this.state === Fb.ACCEPT_SENT_TO_LOCAL)
          throw new da("The remote invitation is accepting. Cannot do the operation.", Rr);
        if (8192 < rh(this._response))
          throw new ca('The length of the "response" overflows. The number of bytes representing content must not exceed 8 × 1024 if encoded in UTF-8.', Xc);
        this.state = Fb.ACCEPT_SENT_TO_LOCAL, Jb(Qe(1e3).pipe(Cb(function() {
          return yd(ma(N.mark(function i() {
            return N.wrap(function(s) {
              for (; ; )
                switch (s.prev = s.next) {
                  case 0:
                    return s.abrupt("return", o._getSession().sendInvitationMessage({ peerId: o.callerId, callId: o.callId, extra: o.response, type: "CallAccept", isAcceptAck: !1, channelId: o.channelId }));
                  case 1:
                  case "end":
                    return s.stop();
                }
            }, i);
          })));
        }), yb(function(i) {
          return r = i.hasPeerReceived;
        }), hb(1)), Db(this, "RemoteInvitationAccepted")).pipe(Lb(5e3), Kc(this.remoteInvitationEnd$)).subscribe({ error: function(i) {
          if (o.logError(i), o.state = Fb.FAILURE, Ab(i))
            switch (r) {
              case void 0:
              case !0:
                return void o.emit("RemoteInvitationFailure", Hi.ACCEPT_FAILURE);
              case !1:
                return void o.emit("RemoteInvitationFailure", Hi.PEER_OFFLINE);
            }
          o.emit("RemoteInvitationFailure", Hi.UNKNOWN);
        } });
      } }, { key: "refuse", value: function() {
        if (this.state === Fb.ACCEPT_SENT_TO_LOCAL)
          throw new da("The remote invitation is accepting. Cannot do the operation.", Rr);
        if (this.isRemoteInvitationEnd())
          throw new da("The invitation is end. Cannot refuse", ri);
        if (8192 < rh(this._response))
          throw new ca('The length of the "response" overflows. The number of bytes representing content must not exceed 8 × 1024 if encoded in UTF-8.', Xc);
        this._getSession().sendInvitationMessage({ peerId: this.callerId, callId: this.callId, extra: this.response, type: "CallReject", channelId: this.channelId }), this.state = Fb.REFUSED, this.emit("RemoteInvitationRefused");
      } }, { key: "onCancelReceived", value: function(r) {
        this.isRemoteInvitationEnd() ? this.log("The invitation has ended, skipped emitting the %s event", "RemoteInvitationCanceled") : (this.state === Fb.ACCEPT_SENT_TO_LOCAL && this.log("caller canceled before receive accept"), this._content = r, this.state = Fb.CANCELED, this.emit("RemoteInvitationCanceled", r));
      } }, { key: "onAcceptAckReceived", value: function() {
        this.state !== Fb.ACCEPT_SENT_TO_LOCAL ? this.log("The invitation has ended, skipped emitting the %s event", "ori:".concat(this.state, ", to: RemoteInvitationAccepted")) : (this.state = Fb.ACCEPTED, this.emit("RemoteInvitationAccepted"));
      } }, { key: "isRemoteInvitationEnd", value: function() {
        return [Fb.ACCEPTED, Fb.REFUSED, Fb.CANCELED, Fb.FAILURE].includes(this.state);
      } }]), t;
    }(sc()), sF = function(e) {
      function t(r, o) {
        va(this, t);
        var i = n.call(this, o, "InvitationManager");
        return x(z(i), "getSession", void 0), x(z(i), "invitationDispatcher", new Ba.EventEmitter()), x(z(i), "outgoingLocalInvitations", /* @__PURE__ */ new Map()), x(z(i), "receivedRemoteInvitations", new Wc(void 0, { maxlen: 1e4 })), x(z(i), "logger", void 0), i.getSession = fo(r), i.logger = o, i.invitationDispatcher.on("remoteInvitationToManager", function(s) {
          var u = s.callId, a = s.extra, l = s.callerId;
          s = s.channelId, i.receivedRemoteInvitations.has(u) || ((a = new rF({ callerId: l, callId: u, getSession: i.getSession, logger: o, extraContent: a, invitationChannel: s })).remoteInvitationEnd$.subscribe(function() {
            i.receivedRemoteInvitations.delete(u);
          }), i.receivedRemoteInvitations.set(u, a), i.emit("remoteInvitationInstance", a));
        }), i.invitationDispatcher.on("acceptAckToRemoteInvitation", function(s) {
          (s = i.receivedRemoteInvitations.get(s.callId)) && s.onAcceptAckReceived();
        }), i.invitationDispatcher.on("cancelToRemoteInvitation", function(s) {
          var u = s.extra;
          (s = i.receivedRemoteInvitations.get(s.callId)) && s.onCancelReceived(u);
        }), i.invitationDispatcher.on("acceptToLocalInvitation", function(s) {
          var u = s.extra;
          (s = i.outgoingLocalInvitations.get(s.callId)) && s.onAcceptReceived(u);
        }), i.invitationDispatcher.on("refuseToLocalInvitation", function(s) {
          var u = s.extra;
          (s = i.outgoingLocalInvitations.get(s.callId)) && s.onRefuseReceived(u);
        }), i;
      }
      Ga(t, e);
      var n = Ha(t);
      return eb(t, [{ key: "invitationMessageHandler", value: function(r) {
        var o = r.body, i = o.callId, s = o.extra;
        s = s === void 0 ? "" : s;
        var u = o.type, a = (o = o.channel) === void 0 ? "" : o, l = r.type;
        switch (o = r.peerId, r = r.serverReceivedTs, l) {
          case "CallAccept":
            u === "ack" ? this.invitationDispatcher.emit("acceptAckToRemoteInvitation", { callId: i }) : u === "request" && this.invitationDispatcher.emit("acceptToLocalInvitation", { callId: i, extra: s });
            break;
          case "CallInvite":
            this.invitationDispatcher.emit("remoteInvitationToManager", { callId: i, callerId: o, extra: s, channelId: a });
            break;
          case "CallCancel":
            if (i === "0") {
              i = "".concat("AgoraRTMLegacyEndcallCompatibleMessagePrefix", "_").concat(a, "_").concat(s), this.getSession().emit("peerTextMessage", { peerId: o, properties: { serverReceivedTs: r }, text: i });
              break;
            }
            this.invitationDispatcher.emit("cancelToRemoteInvitation", { callId: i, extra: s });
            break;
          case "CallReject":
            this.invitationDispatcher.emit("refuseToLocalInvitation", { callId: i, extra: s });
            break;
          default:
            throw Rn("invitationType", l);
        }
      } }, { key: "genLocalInvitation", value: function(r) {
        var o = this, i = new qF(r, this.getSession, this.logger);
        return i.localInvitationEnd$.subscribe(function() {
          o.outgoingLocalInvitations.delete(i.callId);
        }), this.outgoingLocalInvitations.set(i.callId, i), i;
      } }]), t;
    }(sc()), tF = function(e, t, n) {
      var r = !0, o = !0;
      if (typeof e != "function")
        throw new TypeError("Expected a function");
      return Gb(n) && (r = "leading" in n ? !!n.leading : r, o = "trailing" in n ? !!n.trailing : o), JD(e, t, { leading: r, maxWait: t, trailing: o });
    }, Qb, If;
    (function(e) {
      e[e.JOINED = 0] = "JOINED", e[e.LEFT = 1] = "LEFT";
    })(If || (If = {}));
    var Ii = ta.ConnectionState, uF = (Qb = function(e) {
      function t(o, i, s, u) {
        va(this, t);
        var a = r.call(this, u, "RtmChannel", !0);
        return x(z(a), "onMemberCountUpdated", tF(function(l) {
          l !== a.memberCount && (a.memberCount = l, a.emit("MemberCountUpdated", l));
        }, 1e3)), x(z(a), "getSession", void 0), x(z(a), "memberCount", 0), x(z(a), "joinState", "LEFT"), x(z(a), "joinPromise", void 0), x(z(a), "memberJoinedLru", new Wc(void 0, { maxlen: 1e4 })), x(z(a), "memberLeftLru", new Wc(void 0, { maxlen: 1e4 })), x(z(a), "memberJoinStateLru", new Wc(void 0, { maxlen: 1e4 })), x(z(a), "attributesSeqLru", new Wc(void 0, { maxlen: 1e4 })), x(z(a), "channelId", void 0), x(z(a), "client", void 0), x(z(a), "onChannelMemberCountUpdated", function(l, f) {
          a.channelId === l && a.onMemberCountUpdated(f);
        }), x(z(a), "onLogout", function() {
          try {
            a.clearChannel(a.getSession());
          } catch (l) {
          }
        }), x(z(a), "onAttributesUpdated", function(l) {
          var f = l.channelId, h = l.attributeMaps, d = l.seq;
          l = l.instance.toString();
          var p = a.attributesSeqLru.get(l);
          if ((!p || d.greaterThan(p)) && (a.attributesSeqLru.set(l, d), f === a.channelId)) {
            for (f = {}, d = 0; d < h.length; d++) {
              var v = h[d];
              l = v.key, p = v.ms;
              var y = v.value;
              if (v = v.origin, typeof l != "string" || !P.isLong(p) || typeof y != "string" || !Ta(v))
                break;
              f[l] = { value: y, lastUpdateUserId: v, lastUpdateTs: p.toNumber() };
            }
            a.emit("AttributesUpdated", f);
          }
        }), x(z(a), "onChannelTextMessage", function(l) {
          var f = l.memberId, h = l.text, d = l.properties;
          l.channelId === a.channelId && a.emit("ChannelMessage", { text: h, messageType: ta.MessageType.TEXT }, f, d);
        }), x(z(a), "onChannelRawMessage", function(l) {
          var f = l.desc, h = l.raw, d = l.memberId, p = l.properties;
          l.channelId === a.channelId && a.emit("ChannelMessage", { messageType: ta.MessageType.RAW, rawMessage: h, description: f }, d, p);
        }), x(z(a), "onMemberNotice", function(l) {
          var f = l.memberId, h = l.type, d = l.size;
          if (l.channelId === a.channelId) {
            var p = l.instance.toString();
            l = l.seq.toString();
            var v = { MemberLeft: a.memberLeftLru, MemberJoined: a.memberJoinedLru, MemberCountUpdated: void 0 }[h];
            if (v) {
              if (v.has(p + l))
                return void a.log("received duplicated %s notice (seq: %s), channel '%s', member '%s'", h, l, La(a.channelId), La(f || ""));
              if (v.set(p + l, void 0), typeof f != "string")
                return;
              if (f !== a.getSession().context.uid && ((p = a.memberJoinStateLru.get(f)) === If.JOINED && h === "MemberJoined" || p === If.LEFT && h === "MemberLeft"))
                return void a.log("received duplicated %s state (seq: %s), channel '%s', member '%s'", h, l, La(a.channelId), La(f || ""));
              a.memberJoinStateLru.set(f, h === "MemberJoined" ? If.JOINED : If.LEFT);
            }
            a.info("Channel %s - %s, memberId: %s", h, La(a.channelId), h === "MemberCountUpdated" ? "[unknown]" : La(f || "")), p = f === a.getSession().context.uid, h === "MemberLeft" && Ta(f) || h === "MemberJoined" && Ta(f) ? (p || a.emit(h, f), a.onMemberCountUpdated(d)) : h === "MemberCountUpdated" && typeof d == "number" && a.onMemberCountUpdated(d);
          }
        }), a.getSession = fo(i), a.channelId = o, a.client = s, a.info("A channel created, id %s", La(o)), a;
      }
      Ga(t, e);
      var n, r = Ha(t);
      return eb(t, [{ key: "join", value: (n = ma(N.mark(function o() {
        var i, s, u, a, l, f, h, d = this;
        return N.wrap(function(p) {
          for (; ; )
            switch (p.prev = p.next) {
              case 0:
                p.prev = 0, i = this.getSession(), p.next = 7;
                break;
              case 4:
                throw p.prev = 4, p.t0 = p.catch(0), new da("The client is not logged in. Cannot do the operation", Wr);
              case 7:
                if (p.prev = 7, Ta(this.channelId)) {
                  p.next = 10;
                  break;
                }
                throw new ca(["The %s in the arguments is invalid", "channelId"], OB);
              case 10:
                if (this.joinState === "LEFT") {
                  p.next = 13;
                  break;
                }
                throw bb("ChnJoin", { cname: this.channelId, lts: P.fromNumber(Date.now()), userId: i.context.uid, elapse: Xa(i.startTime), errCode: Vr, sid: sb(i.instanceId) }, (a = this.client.context.config.enableCloudProxy) !== null && a !== void 0 && a), new da("The channel has joined. Cannot rejoin", Vr);
              case 13:
                if (!i.usedChannelIds.includes(this.channelId)) {
                  p.next = 16;
                  break;
                }
                throw bb("ChnJoin", { cname: this.channelId, lts: P.fromNumber(Date.now()), userId: i.context.uid, elapse: Xa(i.startTime), errCode: Xr, sid: sb(i.instanceId) }, (l = this.client.context.config.enableCloudProxy) !== null && l !== void 0 && l), new da("A channel of the same channel ID has already joined. Cannot rejoin", Xr);
              case 16:
                if (!(20 <= i.usedChannelIds.length)) {
                  p.next = 19;
                  break;
                }
                throw bb("ChnJoin", { cname: this.channelId, lts: P.fromNumber(Date.now()), userId: i.context.uid, elapse: Xa(i.startTime), errCode: Ur, sid: sb(i.instanceId) }, (f = this.client.context.config.enableCloudProxy) !== null && f !== void 0 && f), new ic("The joined channels has exceeded the limit of 20", Ur);
              case 19:
                return bb("ChnJoin", { cname: this.channelId, lts: P.fromNumber(Date.now()), userId: i.context.uid, elapse: Xa(i.startTime), errCode: 0, sid: sb(i.instanceId) }, (s = this.client.context.config.enableCloudProxy) !== null && s !== void 0 && s), this.log("Joining the channel %s", La(this.channelId)), this.joinState = "JOINING", i.usedChannelIds.push(this.channelId), this.joinPromise = i.requestChannelJoin(this.channelId).then(function() {
                  d.joinState = "JOINED";
                }), p.next = 26, this.joinPromise;
              case 26:
                bb("ChnJoinRes", { cname: this.channelId, lts: P.fromNumber(Date.now()), elapse: Xa(i.startTime), errCode: 0, sid: sb(i.instanceId), serverErrCode: 0, userId: i.context.uid }, (u = this.client.context.config.enableCloudProxy) !== null && u !== void 0 && u), this.info("The channel %s joined successfully", La(this.channelId)), i.on("channelTextMessage", this.onChannelTextMessage), i.on("channelRawMessage", this.onChannelRawMessage), i.on("memberNotice", this.onMemberNotice), i.on("channelAttributesUpdated", this.onAttributesUpdated), this.client.internalEmitter.on("channelMemberCountUpdated", this.onChannelMemberCountUpdated), this.client.internalEmitter.once("LOGOUT", this.onLogout), p.next = 46;
                break;
              case 36:
                if (p.prev = 36, p.t1 = p.catch(7), this.joinState === "JOINING" && (this.joinState = "LEFT"), this.logError(p.t1), !Na(p.t1)) {
                  p.next = 42;
                  break;
                }
                throw p.t1;
              case 42:
                if (!Ab(p.t1)) {
                  p.next = 45;
                  break;
                }
                throw bb("ChnJoinRes", { cname: this.channelId, lts: P.fromNumber(Date.now()), elapse: Xa(i.startTime), errCode: Tr, sid: sb(i.instanceId), serverErrCode: 0, userId: i.context.uid }, (h = this.client.context.config.enableCloudProxy) !== null && h !== void 0 && h), new Ub(["Join channel %s timed out", La(this.channelId)], Tr);
              case 45:
                throw new ve(["The channel %s join failure", La(this.channelId)], { code: Sr, originalError: p.t1 });
              case 46:
              case "end":
                return p.stop();
            }
        }, o, this, [[0, 4], [7, 36]]);
      })), function() {
        return n.apply(this, arguments);
      }) }, { key: "leave", value: function() {
        var o = ma(N.mark(function i() {
          var s, u, a, l;
          return N.wrap(function(f) {
            for (; ; )
              switch (f.prev = f.next) {
                case 0:
                  f.prev = 0, u = this.getSession(), f.next = 7;
                  break;
                case 4:
                  throw f.prev = 4, f.t0 = f.catch(0), new da("The client is not logged in. Cannot do the operation", QB);
                case 7:
                  if (this.joinState !== "LEFT") {
                    f.next = 9;
                    break;
                  }
                  throw new da("The channel does not join. Cannot do the operation", PB);
                case 9:
                  return f.prev = 9, u.requestChannelLeave(this.channelId), f.next = 13, this.clearChannel(u);
                case 13:
                  f.next = 24;
                  break;
                case 15:
                  if (f.prev = 15, f.t1 = f.catch(9), this.logError(f.t1), !Na(f.t1)) {
                    f.next = 22;
                    break;
                  }
                  throw f.t1.code === void 0 && (f.t1.code = Zr), bb("ChnLeave", { cname: this.channelId, lts: P.fromNumber(Date.now()), elapse: Xa(u.startTime), errCode: Zr, sid: sb(u.instanceId), userId: u.context.uid }, (l = this.client.context.config.enableCloudProxy) !== null && l !== void 0 && l), f.t1;
                case 22:
                  throw bb("ChnLeave", { cname: this.channelId, lts: P.fromNumber(Date.now()), elapse: Xa(u.startTime), errCode: Yr, sid: sb(u.instanceId), userId: u.context.uid }, (a = this.client.context.config.enableCloudProxy) !== null && a !== void 0 && a), new ve("The channel leave failure", { code: Yr, originalError: f.t1 });
                case 24:
                  bb("ChnLeave", { cname: this.channelId, lts: P.fromNumber(Date.now()), elapse: Xa(u.startTime), errCode: 0, sid: sb(u.instanceId), userId: u.context.uid }, (s = this.client.context.config.enableCloudProxy) !== null && s !== void 0 && s);
                case 25:
                case "end":
                  return f.stop();
              }
          }, i, this, [[0, 4], [9, 15]]);
        }));
        return function() {
          return o.apply(this, arguments);
        };
      }() }, { key: "sendMessage", value: function() {
        var o = ma(N.mark(function i(s) {
          var u, a = this;
          return N.wrap(function(l) {
            for (; ; )
              switch (l.prev = l.next) {
                case 0:
                  if (Xn(s, Il), this.client.connectionState !== Ii.CONNECTED || this.joinState === "JOINED") {
                    l.next = 3;
                    break;
                  }
                  throw new da("The channel does not join. Cannot do the operation", EB);
                case 3:
                  if (this.client.connectionState !== Ii.RECONNECTING) {
                    l.next = 8;
                    break;
                  }
                  return u = Date.now(), l.next = 7, new Promise(function(f, h) {
                    var d, p = (d = ma(N.mark(function y() {
                      var g;
                      return N.wrap(function(m) {
                        for (; ; )
                          switch (m.prev = m.next) {
                            case 0:
                              return g = Date.now() - u, m.prev = 1, m.next = 4, ph({ message: s, peerId: a.channelId, toPeer: !1, session: a.getSession(), errorCodes: { NOT_LOGGED_IN: Jl, TOO_OFTEN: Nr }, diff: g, logger: a.logger });
                            case 4:
                              f(), m.next = 12;
                              break;
                            case 7:
                              m.prev = 7, m.t0 = m.catch(1), Ab(m.t0) && h(new Ub(we(a.name, "sendMessageToPeer", 1e4), Hl)), Na(m.t0) && h(m.t0), h(new Ja("Channel message send failure", { code: qi, originalError: m.t0 }));
                            case 12:
                              return m.prev = 12, clearTimeout(v), m.finish(12);
                            case 15:
                            case "end":
                              return m.stop();
                          }
                      }, y, null, [[1, 7, 12, 15]]);
                    })), function() {
                      return d.apply(this, arguments);
                    });
                    a.client.internalEmitter.once("RECONNECTED", p);
                    var v = setTimeout(function() {
                      a.client.internalEmitter.off("RECONNECTED", p), h(new Ub(we(a.name, "sendMessageToPeer", 1e4), Hl));
                    }, 9e3);
                  });
                case 7:
                  return l.abrupt("return");
                case 8:
                  if (this.client.connectionState === Ii.CONNECTED) {
                    l.next = 10;
                    break;
                  }
                  throw new da("The client is not logged in. Cannot do the operation", Jl);
                case 10:
                  return l.prev = 10, l.next = 13, ph({ message: s, peerId: this.channelId, toPeer: !1, session: this.getSession(), errorCodes: { NOT_LOGGED_IN: Jl, TOO_OFTEN: Nr }, diff: 0, logger: this.logger });
                case 13:
                  l.next = 23;
                  break;
                case 15:
                  if (l.prev = 15, l.t0 = l.catch(10), !Ab(l.t0)) {
                    l.next = 19;
                    break;
                  }
                  throw new Ub(we(this.name, "sendMessage", 1e4), Hl);
                case 19:
                  if (!Na(l.t0)) {
                    l.next = 22;
                    break;
                  }
                  throw this.logError(l.t0), l.t0;
                case 22:
                  throw new ve("The channel message send failure", qi);
                case 23:
                case "end":
                  return l.stop();
              }
          }, i, this, [[10, 15]]);
        }));
        return function(i) {
          return o.apply(this, arguments);
        };
      }() }, { key: "getMembers", value: function() {
        var o = ma(N.mark(function i() {
          var s, u;
          return N.wrap(function(a) {
            for (; ; )
              switch (a.prev = a.next) {
                case 0:
                  if (a.prev = 0, this.client.connectionState === Ii.CONNECTED) {
                    a.next = 3;
                    break;
                  }
                  throw new da("The client is not logged in. Cannot do the operation", LB);
                case 3:
                  if (this.joinState === "JOINED") {
                    a.next = 5;
                    break;
                  }
                  throw new da("The channel does not join. Cannot do the operation", KB);
                case 5:
                  return s = this.getSession().requestChannelMemberList(this.channelId), a.next = 8, s.pipe(Ea(function(l) {
                    return l.memberInfos.map(function(f) {
                      return f.account;
                    });
                  })).toPromise();
                case 8:
                  return u = a.sent, this.info("Channel %s - get members success, %o", La(this.channelId), u.map(La)), a.abrupt("return", u);
                case 13:
                  if (a.prev = 13, a.t0 = a.catch(0), !Na(a.t0)) {
                    a.next = 18;
                    break;
                  }
                  throw this.logError(a.t0), a.t0;
                case 18:
                  throw new ve("The channel members get failure", IB);
                case 19:
                case "end":
                  return a.stop();
              }
          }, i, this, [[0, 13]]);
        }));
        return function() {
          return o.apply(this, arguments);
        };
      }() }, { key: "clearChannel", value: function() {
        var o = ma(N.mark(function i(s) {
          var u = this;
          return N.wrap(function(a) {
            for (; ; )
              switch (a.prev = a.next) {
                case 0:
                  if (s.emit("channelLeft", this.channelId), this.joinState !== "JOINING") {
                    a.next = 4;
                    break;
                  }
                  return a.next = 4, this.joinPromise;
                case 4:
                  this.joinState = "LEFT", this.memberLeftLru.empty(), this.memberJoinedLru.empty(), this.attributesSeqLru.empty(), this.memberJoinStateLru.empty(), this.memberCount = 0, s.removeListener("channelTextMessage", this.onChannelTextMessage), s.removeListener("channelRawMessage", this.onChannelRawMessage), s.removeListener("memberNotice", this.onMemberNotice), s.removeListener("channelAttributesUpdated", this.onAttributesUpdated), this.client.internalEmitter.removeListener("channelMemberCountUpdated", this.onChannelMemberCountUpdated), this.client.internalEmitter.removeListener("LOGOUT", this.onLogout), s.usedChannelIds = s.usedChannelIds.filter(function(l) {
                    return l !== u.channelId;
                  });
                case 17:
                case "end":
                  return a.stop();
              }
          }, i, this);
        }));
        return function(i) {
          return o.apply(this, arguments);
        };
      }() }]), t;
    }(sc()), Da(Qb.prototype, "join", [Mc], Object.getOwnPropertyDescriptor(Qb.prototype, "join"), Qb.prototype), Da(Qb.prototype, "leave", [Mc], Object.getOwnPropertyDescriptor(Qb.prototype, "leave"), Qb.prototype), Da(Qb.prototype, "sendMessage", [Mc], Object.getOwnPropertyDescriptor(Qb.prototype, "sendMessage"), Qb.prototype), Da(Qb.prototype, "getMembers", [jb], Object.getOwnPropertyDescriptor(Qb.prototype, "getMembers"), Qb.prototype), Qb), W, Rb = ta.ConnectionChangeReason, oa = ta.ConnectionState, Vt = { DISCONNECTED: 1, CONNECTING: 2, CONNECTED: 3, RECONNECTING: 4, ABORTED: 5 }, vF = { LOGIN: 1, LOGIN_SUCCESS: 2, LOGIN_FAILURE: 3, LOGIN_TIMEOUT: 4, INTERRUPTED: 5, LOGOUT: 6, BANNED_BY_SERVER: 7, REMOTE_LOGIN: 8, TOKEN_EXPIRED: 9 }, wF = (W = function(e) {
      function t(o, i, s, u) {
        va(this, t);
        var a = r.call(this, i, "RtmClient", !0);
        return x(z(a), "connectionState", oa.DISCONNECTED), x(z(a), "internalEmitter", new Ba()), x(z(a), "context", void 0), x(z(a), "attributes", {}), x(z(a), "loginPromise", void 0), x(z(a), "attributeDrafts", /* @__PURE__ */ new Set()), x(z(a), "session", void 0), x(z(a), "lastLoginTime", void 0), x(z(a), "reconnId", 0), x(z(a), "channelAttributesCacheLru", new Wc(void 0, { maxlen: 1e4 })), x(z(a), "invitationManager", void 0), x(z(a), "subscribedPeerStatusCache", {}), x(z(a), "pendingPeerStatusSubCount", 0), x(z(a), "peerStatusSeqLru", new Wc(void 0, { maxlen: 1e4 })), x(z(a), "peerUnreachableTimers", {}), x(z(a), "setParameters", void 0), x(z(a), "updateConfig", void 0), x(z(a), "blacklistedIP", {}), x(z(a), "TokenPrivilegeWillExpireHandler", function() {
          a.emit("TokenPrivilegeWillExpire");
        }), x(z(a), "userDropHandler", function(l) {
          if (a.connectionState !== oa.ABORTED)
            switch (l) {
              case 2:
                a.logError("Server banned because of token is expired"), a.onConnectionStateChanged(oa.ABORTED, Rb.TOKEN_EXPIRED), a.emit("TokenExpired");
                break;
              case 11:
                a.logError("Kicked off by remote session"), a.onConnectionStateChanged(oa.ABORTED, Rb.REMOTE_LOGIN);
                break;
              case 14:
              case 15:
              case 16:
                a.logError("Server banned because of illegal ".concat({ 14: "User ID", 15: "IP", 16: "Channel Name" }[l])), a.onConnectionStateChanged(oa.ABORTED, Rb.BANNED_BY_SERVER);
                break;
              default:
                a.logError("User kicked off for unknown code: ".concat(l)), a.onConnectionStateChanged(oa.ABORTED, Rb.INTERRUPTED);
            }
        }), a.context = new xE(o, s, i), a.context.config = s, a.setParameters = u.bind(z(a)), a.updateConfig = u.bind(z(a)), a.invitationManager = new sF(function() {
          return a.session;
        }, i), a.invitationManager.on("remoteInvitationInstance", function(l) {
          a.emit("RemoteInvitationReceived", l);
        }), a.setMaxListeners(512), a.internalEmitter.setMaxListeners(512), a;
      }
      Ga(t, e);
      var n, r = Ha(t);
      return eb(t, [{ key: "renewToken", value: (n = ma(N.mark(function o(i) {
        var s, u, a, l, f = this;
        return N.wrap(function(h) {
          for (; ; )
            switch (h.prev = h.next) {
              case 0:
                if (typeof i == "string" && i.length !== 0) {
                  h.next = 2;
                  break;
                }
                throw new ca("Invalid argument", XB);
              case 2:
                if (this.connectionState !== oa.ABORTED) {
                  h.next = 5;
                  break;
                }
                return h.next = 5, new Promise(function() {
                });
              case 5:
                if (this.connectionState === oa.CONNECTED || this.connectionState === oa.RECONNECTING) {
                  h.next = 7;
                  break;
                }
                throw new da("The client is not logged in", hs);
              case 7:
                if (this.session !== void 0) {
                  h.next = 9;
                  break;
                }
                throw new mb({ SESSION_NOT_FOUND: "Failed to get session of the client" });
              case 9:
                return h.prev = 9, s = this.context.token, this.context.token = i, h.next = 14, this.session.connection.apClient.getApEdgeInfo$(!1).pipe($d(function() {
                  return Error("No available edge address to connect");
                }), Re(function(d) {
                  return d.pipe(sa(function(p) {
                    if (Na(p))
                      throw p;
                  }), Zd(2500), hb(4));
                }), hb(1), Lb(2e4), ab(function(d) {
                  return Ab(d) && f.warn("renewToken timed out"), ra(d);
                })).toPromise();
              case 14:
                u = h.sent, a = u.ticket, h.next = 27;
                break;
              case 18:
                if (h.prev = 18, h.t0 = h.catch(9), this.context.token = s, h.t0.code !== as && h.t0.code !== bs) {
                  h.next = 23;
                  break;
                }
                throw new Bf("Invalid token", ZB);
              case 23:
                if (h.t0.code !== ti) {
                  h.next = 25;
                  break;
                }
                throw new Bf("The token expired", YB);
              case 25:
                if (!Ab(h.t0)) {
                  h.next = 27;
                  break;
                }
                throw new Ub("Renew token timed out", Ml);
              case 27:
                l = this.session, this.session.requestUpdateEdgeTicket(a).toPromise().then(function(d) {
                  if (d.code !== 0)
                    throw new Ja(["RenewToken failure. The response code is %d", d.code], Ml);
                  l.curLoginSockets.filter(function(p) {
                    return p !== void 0;
                  }).forEach(function(p) {
                    return p.ticket = a;
                  });
                });
              case 29:
              case "end":
                return h.stop();
            }
        }, o, this, [[9, 18]]);
      })), function(o) {
        return n.apply(this, arguments);
      }) }, { key: "queryPeersOnlineStatus", value: function() {
        var o = ma(N.mark(function i(s) {
          var u, a, l = this;
          return N.wrap(function(f) {
            for (; ; )
              switch (f.prev = f.next) {
                case 0:
                  if (this.connectionState === oa.CONNECTED) {
                    f.next = 2;
                    break;
                  }
                  throw new da("The client is not logged in", WB);
                case 2:
                  if (this.session !== void 0) {
                    f.next = 4;
                    break;
                  }
                  throw new mb({ SESSION_NOT_FOUND: "Failed to get session of the client" });
                case 4:
                  if (!(!Array.isArray(s) || s.length === 0 || s.some(function(h) {
                    return !Ta(h);
                  }) || 256 < s.length)) {
                    f.next = 6;
                    break;
                  }
                  throw new ca("invalid arguments", gs);
                case 6:
                  return f.next = 8, this.session.requestPeersOnlineStatus(s).toPromise();
                case 8:
                  return u = f.sent, a = md(tl(u.userInfos, "account"), function(h) {
                    return !!h.ts;
                  }), Object.keys(a).forEach(function(h) {
                    if (h in l.subscribedPeerStatusCache && l.subscribedPeerStatusCache[h] !== ta.PeerOnlineState.UNREACHABLE) {
                      var d = a[h] ? ta.PeerOnlineState.ONLINE : ta.PeerOnlineState.OFFLINE;
                      l.emit("PeersOnlineStatusChanged", x({}, h, d)), l.subscribedPeerStatusCache[h] = d;
                    }
                  }), f.abrupt("return", a);
                case 12:
                case "end":
                  return f.stop();
              }
          }, i, this);
        }));
        return function(i) {
          return o.apply(this, arguments);
        };
      }() }, { key: "getChannelMemberCount", value: function() {
        var o = ma(N.mark(function i(s) {
          var u, a, l, f, h, d, p, v, y;
          return N.wrap(function(g) {
            for (; ; )
              switch (g.prev = g.next) {
                case 0:
                  if (this.connectionState === oa.CONNECTED) {
                    g.next = 2;
                    break;
                  }
                  throw new da("The client is not logged in", HB);
                case 2:
                  if (this.session !== void 0) {
                    g.next = 4;
                    break;
                  }
                  throw new mb({ SESSION_NOT_FOUND: "Failed to get session of the client" });
                case 4:
                  if (Array.isArray(s) && s.every(function(m) {
                    return typeof m == "string";
                  }) && s.length !== 0) {
                    g.next = 6;
                    break;
                  }
                  throw new ca("Invalid arguments: channelIds", Pr);
                case 6:
                  if (!(32 < s.length)) {
                    g.next = 8;
                    break;
                  }
                  throw new ca("getChannelMemberCount exceed limit of 32 channelIds", GB);
                case 8:
                  u = 0;
                case 9:
                  if (!(u < s.length)) {
                    g.next = 16;
                    break;
                  }
                  if (Ta(a = s[u])) {
                    g.next = 13;
                    break;
                  }
                  throw new ca(["getChannelMemberCount channel id %s is invalid", a], Pr);
                case 13:
                  u++, g.next = 9;
                  break;
                case 16:
                  return g.next = 18, this.session.requestGetChannelMemberCount(s).toPromise();
                case 18:
                  for (l = g.sent, f = l.groupInfos, h = {}, d = 0; d < f.length; d++)
                    p = f[d], v = p.group, y = p.memberCount, Ta(v) && typeof y == "number" && (this.internalEmitter.emit("channelMemberCountUpdated", v, y), h[v] = y);
                  return g.abrupt("return", h);
                case 23:
                case "end":
                  return g.stop();
              }
          }, i, this);
        }));
        return function(i) {
          return o.apply(this, arguments);
        };
      }() }, { key: "setLocalUserAttributes", value: function() {
        var o = ma(N.mark(function i(s) {
          var u, a;
          return N.wrap(function(l) {
            for (; ; )
              switch (l.prev = l.next) {
                case 0:
                  if (ag({ attributes: s, maxAttrValueSize: 8192, maxAttrsCount: 32, maxTotalSize: 16384 }), this.connectionState === oa.CONNECTED) {
                    l.next = 3;
                    break;
                  }
                  throw new da("The client is not logged in", qc);
                case 3:
                  if (this.session !== void 0) {
                    l.next = 5;
                    break;
                  }
                  throw new mb({ SESSION_NOT_FOUND: "Failed to get session of the client" });
                case 5:
                  return u = this.session.requestSetLocalUserAttributes(s).toPromise(), a = { attribute: s, promise: u }, this.attributeDrafts.add(a), l.prev = 8, l.next = 11, u;
                case 11:
                  this.attributes = s, l.next = 19;
                  break;
                case 14:
                  if (l.prev = 14, l.t0 = l.catch(8), !Na(l.t0)) {
                    l.next = 18;
                    break;
                  }
                  throw l.t0;
                case 18:
                  throw new ca("arguments is not valid", gb);
                case 19:
                  return l.prev = 19, this.attributeDrafts.delete(a), l.finish(19);
                case 22:
                case "end":
                  return l.stop();
              }
          }, i, this, [[8, 14, 19, 22]]);
        }));
        return function(i) {
          return o.apply(this, arguments);
        };
      }() }, { key: "setChannelAttributes", value: function() {
        var o = ma(N.mark(function i(s, u) {
          var a, l, f, h, d, p = arguments;
          return N.wrap(function(v) {
            for (; ; )
              switch (v.prev = v.next) {
                case 0:
                  if (a = 2 < p.length && p[2] !== void 0 ? p[2] : {}, l = a.enableNotificationToChannelMembers, f = l !== void 0 && l, ag({ attributes: u, maxAttrValueSize: 8192, maxAttrsCount: 32, maxTotalSize: 32768 }), this.connectionState === oa.CONNECTED) {
                    v.next = 4;
                    break;
                  }
                  throw new da("The client is not logged in", qc);
                case 4:
                  if (this.session !== void 0) {
                    v.next = 6;
                    break;
                  }
                  throw new mb({ SESSION_NOT_FOUND: "Failed to get session of the client" });
                case 6:
                  return h = this.session.requestSetChannelAttributes(s, u, f).toPromise(), v.prev = 7, v.next = 10, h;
                case 10:
                  d = md(u, function(y) {
                    return new Blob([y]).size;
                  }), this.channelAttributesCacheLru.set(s, d), v.next = 19;
                  break;
                case 14:
                  if (v.prev = 14, v.t0 = v.catch(7), !Na(v.t0)) {
                    v.next = 18;
                    break;
                  }
                  throw v.t0;
                case 18:
                  throw new ca("arguments is not valid", gb);
                case 19:
                case "end":
                  return v.stop();
              }
          }, i, this, [[7, 14]]);
        }));
        return function(i, s) {
          return o.apply(this, arguments);
        };
      }() }, { key: "addOrUpdateLocalUserAttributes", value: function() {
        var o = ma(N.mark(function i(s) {
          var u, a, l;
          return N.wrap(function(f) {
            for (; ; )
              switch (f.prev = f.next) {
                case 0:
                  if (u = Wa(Wa({}, this.attributes), s), ag({ attributes: s, maxAttrValueSize: 8192, maxAttrsCount: 32, maxTotalSize: 16384 }), ag({ attributes: u, maxAttrValueSize: 8192, maxAttrsCount: 32, maxTotalSize: 16384 }), this.connectionState === oa.CONNECTED) {
                    f.next = 5;
                    break;
                  }
                  throw new da("The client is not logged in", qc);
                case 5:
                  if (this.session !== void 0) {
                    f.next = 7;
                    break;
                  }
                  throw new mb({ SESSION_NOT_FOUND: "Failed to get session of the client" });
                case 7:
                  return a = this.session.requestAddOrUpdateLocalUserAttributes(s).toPromise(), l = { attribute: u, promise: a }, this.attributeDrafts.add(l), f.prev = 10, f.next = 13, a;
                case 13:
                  this.attributes = u, f.next = 21;
                  break;
                case 16:
                  if (f.prev = 16, f.t0 = f.catch(10), !Na(f.t0)) {
                    f.next = 20;
                    break;
                  }
                  throw f.t0;
                case 20:
                  throw new ca("arguments is not valid", gs);
                case 21:
                  return f.prev = 21, this.attributeDrafts.delete(l), f.finish(21);
                case 24:
                case "end":
                  return f.stop();
              }
          }, i, this, [[10, 16, 21, 24]]);
        }));
        return function(i) {
          return o.apply(this, arguments);
        };
      }() }, { key: "addOrUpdateChannelAttributes", value: function() {
        var o = ma(N.mark(function i(s, u) {
          var a, l, f, h, d, p, v, y = arguments;
          return N.wrap(function(g) {
            for (; ; )
              switch (g.prev = g.next) {
                case 0:
                  if (a = 2 < y.length && y[2] !== void 0 ? y[2] : {}, l = a.enableNotificationToChannelMembers, f = l !== void 0 && l, h = this.channelAttributesCacheLru.get(s, {}), d = md(u, function(m) {
                    return new Blob([m]).size;
                  }), p = Wa(Wa({}, h), d), ag({ attributes: u, attrSizeMap: p, maxAttrValueSize: 8192, maxAttrsCount: 32, maxTotalSize: 32768 }), this.connectionState === oa.CONNECTED) {
                    g.next = 7;
                    break;
                  }
                  throw new da("The client is not logged in", qc);
                case 7:
                  if (this.session !== void 0) {
                    g.next = 9;
                    break;
                  }
                  throw new mb({ SESSION_NOT_FOUND: "Failed to get session of the client" });
                case 9:
                  return v = this.session.requestAddOrUpdateChannelAttributes(s, u, f).toPromise(), g.prev = 10, g.next = 13, v;
                case 13:
                  this.channelAttributesCacheLru.set(s, p), g.next = 21;
                  break;
                case 16:
                  if (g.prev = 16, g.t0 = g.catch(10), !Na(g.t0)) {
                    g.next = 20;
                    break;
                  }
                  throw g.t0;
                case 20:
                  throw new ca("arguments is not valid", gb);
                case 21:
                case "end":
                  return g.stop();
              }
          }, i, this, [[10, 16]]);
        }));
        return function(i, s) {
          return o.apply(this, arguments);
        };
      }() }, { key: "deleteLocalUserAttributesByKeys", value: function() {
        var o = ma(N.mark(function i(s) {
          var u, a, l, f;
          return N.wrap(function(h) {
            for (; ; )
              switch (h.prev = h.next) {
                case 0:
                  if (Array.isArray(s) && s.length !== 0 && !s.some(function(d) {
                    return d.length === 0;
                  })) {
                    h.next = 2;
                    break;
                  }
                  throw new da("arguments is not valid", gb);
                case 2:
                  if (this.connectionState === oa.CONNECTED) {
                    h.next = 4;
                    break;
                  }
                  throw new da("The client is not logged in", qc);
                case 4:
                  if (this.session !== void 0) {
                    h.next = 6;
                    break;
                  }
                  throw new mb({ SESSION_NOT_FOUND: "Failed to get session of the client" });
                case 6:
                  return u = this.session.requestDeleteLocalUserAttributesByKeys(s).toPromise(), a = { attribute: ql(this.attributes, s), promise: u }, this.attributeDrafts.add(a), h.prev = 9, h.next = 12, u;
                case 12:
                  for (l = 0; l < s.length; l++)
                    f = s[l], delete this.attributes[f];
                  h.next = 20;
                  break;
                case 15:
                  if (h.prev = 15, h.t0 = h.catch(9), !Na(h.t0)) {
                    h.next = 19;
                    break;
                  }
                  throw h.t0;
                case 19:
                  throw new ca("arguments is not valid", gb);
                case 20:
                  return h.prev = 20, this.attributeDrafts.delete(a), h.finish(20);
                case 23:
                case "end":
                  return h.stop();
              }
          }, i, this, [[9, 15, 20, 23]]);
        }));
        return function(i) {
          return o.apply(this, arguments);
        };
      }() }, { key: "deleteChannelAttributesByKeys", value: function() {
        var o = ma(N.mark(function i(s, u) {
          var a, l, f, h, d, p, v, y = arguments;
          return N.wrap(function(g) {
            for (; ; )
              switch (g.prev = g.next) {
                case 0:
                  if (a = 2 < y.length && y[2] !== void 0 ? y[2] : {}, l = a.enableNotificationToChannelMembers, f = l !== void 0 && l, Array.isArray(u) && u.length !== 0 && Ta(s) && !u.some(function(m) {
                    return m.length === 0 || 512 < m.length;
                  })) {
                    g.next = 3;
                    break;
                  }
                  throw new da("arguments is not valid", gb);
                case 3:
                  if (this.connectionState === oa.CONNECTED) {
                    g.next = 5;
                    break;
                  }
                  throw new da("The client is not logged in", qc);
                case 5:
                  if (this.session !== void 0) {
                    g.next = 7;
                    break;
                  }
                  throw new mb({ SESSION_NOT_FOUND: "Failed to get session of the client" });
                case 7:
                  return h = this.session.requestDeleteChannelAttributesByKeys(s, u, f).toPromise(), g.prev = 8, g.next = 11, h;
                case 11:
                  if (d = this.channelAttributesCacheLru.get(s))
                    for (p = 0; p < u.length; p++)
                      v = u[p], delete d[v];
                  g.next = 20;
                  break;
                case 15:
                  if (g.prev = 15, g.t0 = g.catch(8), !Na(g.t0)) {
                    g.next = 19;
                    break;
                  }
                  throw g.t0;
                case 19:
                  throw new ca("arguments is not valid", gb);
                case 20:
                case "end":
                  return g.stop();
              }
          }, i, this, [[8, 15]]);
        }));
        return function(i, s) {
          return o.apply(this, arguments);
        };
      }() }, { key: "clearLocalUserAttributes", value: function() {
        var o = ma(N.mark(function i() {
          var s, u;
          return N.wrap(function(a) {
            for (; ; )
              switch (a.prev = a.next) {
                case 0:
                  if (this.connectionState === oa.CONNECTED) {
                    a.next = 2;
                    break;
                  }
                  throw new da("The client is not logged in", qc);
                case 2:
                  if (this.session !== void 0) {
                    a.next = 4;
                    break;
                  }
                  throw new mb({ SESSION_NOT_FOUND: "Failed to get session of the client" });
                case 4:
                  return s = this.session.requestClearLocalUserAttributes().toPromise(), u = { attribute: {}, promise: s }, this.attributeDrafts.add(u), a.prev = 7, a.next = 10, s;
                case 10:
                  this.attributes = {}, a.next = 18;
                  break;
                case 13:
                  if (a.prev = 13, a.t0 = a.catch(7), !Na(a.t0)) {
                    a.next = 17;
                    break;
                  }
                  throw a.t0;
                case 17:
                  throw new ca("arguments is not valid", gb);
                case 18:
                  return a.prev = 18, this.attributeDrafts.delete(u), a.finish(18);
                case 21:
                case "end":
                  return a.stop();
              }
          }, i, this, [[7, 13, 18, 21]]);
        }));
        return function() {
          return o.apply(this, arguments);
        };
      }() }, { key: "clearChannelAttributes", value: function() {
        var o = ma(N.mark(function i(s) {
          var u, a, l, f, h = arguments;
          return N.wrap(function(d) {
            for (; ; )
              switch (d.prev = d.next) {
                case 0:
                  if (u = 1 < h.length && h[1] !== void 0 ? h[1] : {}, a = u.enableNotificationToChannelMembers, l = a !== void 0 && a, this.connectionState === oa.CONNECTED) {
                    d.next = 3;
                    break;
                  }
                  throw new da("The client is not logged in", qc);
                case 3:
                  if (this.session !== void 0) {
                    d.next = 5;
                    break;
                  }
                  throw new mb({ SESSION_NOT_FOUND: "Failed to get session of the client" });
                case 5:
                  return f = this.session.requestClearChannelAttributes(s, l).toPromise(), d.prev = 6, d.next = 9, f;
                case 9:
                  this.channelAttributesCacheLru.delete(s), d.next = 17;
                  break;
                case 12:
                  if (d.prev = 12, d.t0 = d.catch(6), !Na(d.t0)) {
                    d.next = 16;
                    break;
                  }
                  throw d.t0;
                case 16:
                  throw new ca("arguments is not valid", gb);
                case 17:
                case "end":
                  return d.stop();
              }
          }, i, this, [[6, 12]]);
        }));
        return function(i) {
          return o.apply(this, arguments);
        };
      }() }, { key: "getUserAttributes", value: function() {
        var o = ma(N.mark(function i(s) {
          var u, a, l;
          return N.wrap(function(f) {
            for (; ; )
              switch (f.prev = f.next) {
                case 0:
                  if (Ta(s)) {
                    f.next = 2;
                    break;
                  }
                  throw new ca("Not a valid user ID", gb);
                case 2:
                  if (this.connectionState === oa.CONNECTED) {
                    f.next = 4;
                    break;
                  }
                  throw new da("The client is not logged in", qc);
                case 4:
                  if (this.session !== void 0) {
                    f.next = 6;
                    break;
                  }
                  throw new mb({ SESSION_NOT_FOUND: "Failed to get session of the client" });
                case 6:
                  return f.prev = 6, f.next = 9, this.session.requestGetUserAttributeKeys(s).toPromise();
                case 9:
                  return u = f.sent, a = u.keys, f.next = 13, this.session.requestGetUserAttributesByKeys(s, a.slice(0, 512)).toPromise();
                case 13:
                  l = f.sent, f.next = 21;
                  break;
                case 16:
                  if (f.prev = 16, f.t0 = f.catch(6), !Na(f.t0)) {
                    f.next = 20;
                    break;
                  }
                  throw f.t0;
                case 20:
                  throw new ca("arguments is not valid", gb);
                case 21:
                  return f.abrupt("return", Zq(l.attributeInfos.map(function(h) {
                    return [h.key, h.value];
                  })));
                case 22:
                case "end":
                  return f.stop();
              }
          }, i, this, [[6, 16]]);
        }));
        return function(i) {
          return o.apply(this, arguments);
        };
      }() }, { key: "getChannelAttributes", value: function() {
        var o = ma(N.mark(function i(s) {
          var u, a, l, f, h, d, p, v, y, g, m;
          return N.wrap(function(E) {
            for (; ; )
              switch (E.prev = E.next) {
                case 0:
                  if (Ta(s)) {
                    E.next = 2;
                    break;
                  }
                  throw new ca("Not a valid channel ID", gb);
                case 2:
                  if (this.connectionState === oa.CONNECTED) {
                    E.next = 4;
                    break;
                  }
                  throw new da("The client is not logged in", qc);
                case 4:
                  if (this.session !== void 0) {
                    E.next = 6;
                    break;
                  }
                  throw new mb({ SESSION_NOT_FOUND: "Failed to get session of the client" });
                case 6:
                  return E.prev = 6, E.next = 9, this.session.requestGetChannelAttributesKeys(s).toPromise();
                case 9:
                  return u = E.sent, a = u.keys, E.next = 13, this.session.requestGetChannelAttributesByKeys(s, a).toPromise();
                case 13:
                  l = E.sent, f = l.attributeMaps, E.next = 22;
                  break;
                case 17:
                  if (E.prev = 17, E.t0 = E.catch(6), !Na(E.t0)) {
                    E.next = 21;
                    break;
                  }
                  throw E.t0;
                case 21:
                  throw new ca("arguments is not valid", gb);
                case 22:
                  h = {}, d = 0;
                case 24:
                  if (!(d < f.length)) {
                    E.next = 32;
                    break;
                  }
                  if (p = f[d], v = p.key, y = p.ms, g = p.value, m = p.origin, typeof v == "string" && P.isLong(y) && typeof g == "string" && Ta(m)) {
                    E.next = 28;
                    break;
                  }
                  return E.abrupt("break", 32);
                case 28:
                  h[v] = { value: g, lastUpdateUserId: m, lastUpdateTs: y.toNumber() };
                case 29:
                  d++, E.next = 24;
                  break;
                case 32:
                  return this.channelAttributesCacheLru.set(s, md(h, function(w) {
                    return new Blob([w.value]).size;
                  })), E.abrupt("return", h);
                case 34:
                case "end":
                  return E.stop();
              }
          }, i, this, [[6, 17]]);
        }));
        return function(i) {
          return o.apply(this, arguments);
        };
      }() }, { key: "getChannelAttributesByKeys", value: function() {
        var o = ma(N.mark(function i(s, u) {
          var a, l, f, h, d, p, v, y, g, m;
          return N.wrap(function(E) {
            for (; ; )
              switch (E.prev = E.next) {
                case 0:
                  if (this.connectionState === oa.CONNECTED) {
                    E.next = 2;
                    break;
                  }
                  throw new da("The client is not logged in", qc);
                case 2:
                  if (this.session !== void 0) {
                    E.next = 4;
                    break;
                  }
                  throw new mb({ SESSION_NOT_FOUND: "Failed to get session of the client" });
                case 4:
                  return Qn(s, u), E.prev = 5, E.next = 8, this.session.requestGetChannelAttributesByKeys(s, u).toPromise();
                case 8:
                  a = E.sent, l = a.attributeMaps, E.next = 17;
                  break;
                case 12:
                  if (E.prev = 12, E.t0 = E.catch(5), !Na(E.t0)) {
                    E.next = 16;
                    break;
                  }
                  throw E.t0;
                case 16:
                  throw new ca("arguments is not valid", gb);
                case 17:
                  f = {}, h = this.channelAttributesCacheLru.get(s, {}), d = 0;
                case 20:
                  if (!(d < l.length)) {
                    E.next = 29;
                    break;
                  }
                  if (p = l[d], v = p.key, y = p.ms, g = p.value, m = p.origin, typeof v == "string" && P.isLong(y) && typeof g == "string" && Ta(m)) {
                    E.next = 24;
                    break;
                  }
                  return E.abrupt("break", 29);
                case 24:
                  h[v] = new Blob([g]).size, f[v] = { value: g, lastUpdateUserId: m, lastUpdateTs: y.toNumber() };
                case 26:
                  d++, E.next = 20;
                  break;
                case 29:
                  return this.channelAttributesCacheLru.set(s, h), E.abrupt("return", f);
                case 31:
                case "end":
                  return E.stop();
              }
          }, i, this, [[5, 12]]);
        }));
        return function(i, s) {
          return o.apply(this, arguments);
        };
      }() }, { key: "getUserAttributesByKeys", value: function() {
        var o = ma(N.mark(function i(s, u) {
          var a;
          return N.wrap(function(l) {
            for (; ; )
              switch (l.prev = l.next) {
                case 0:
                  if (this.connectionState === oa.CONNECTED) {
                    l.next = 2;
                    break;
                  }
                  throw new da("The client is not logged in", qc);
                case 2:
                  if (this.session !== void 0) {
                    l.next = 4;
                    break;
                  }
                  throw new mb({ SESSION_NOT_FOUND: "Failed to get session of the client" });
                case 4:
                  return Qn(s, u), l.prev = 5, l.next = 8, this.session.requestGetUserAttributesByKeys(s, u).toPromise();
                case 8:
                  a = l.sent, l.next = 16;
                  break;
                case 11:
                  if (l.prev = 11, l.t0 = l.catch(5), !Na(l.t0)) {
                    l.next = 15;
                    break;
                  }
                  throw l.t0;
                case 15:
                  throw new ca("arguments is not valid", gb);
                case 16:
                  return l.abrupt("return", Zq(a.attributeInfos.map(function(f) {
                    return [f.key, f.value];
                  })));
                case 17:
                case "end":
                  return l.stop();
              }
          }, i, this, [[5, 11]]);
        }));
        return function(i, s) {
          return o.apply(this, arguments);
        };
      }() }, { key: "login", value: function() {
        var o = ma(N.mark(function i(s) {
          var u, a, l, f, h;
          return N.wrap(function(d) {
            for (; ; )
              switch (d.prev = d.next) {
                case 0:
                  if (xn(!0), a = nh(), l = s.token, s.token === this.context.appId && (l = void 0), bb("Session", { appId: this.context.appId, did: navigator.userAgent, elapse: Xa(this.session && this.session.startTime), index: { index1: s.uid, index2: this.context.appId, index3: "enableLogUpload=".concat(this.context.config.enableLogUpload) }, installId: Og, lts: P.fromNumber(Date.now()), os: 7, sid: sb(a), token: l || "", userId: s.uid, ver: "1.5.1", buildno: 418, subVersion: 18, version: 4 }, (u = this.context.config.enableCloudProxy) !== null && u !== void 0 && u, !0), De(s) && Ta(s.uid)) {
                    d.next = 7;
                    break;
                  }
                  throw new ca("not a valid user id", si);
                case 7:
                  if (typeof l != "string" || !l) {
                    d.next = 11;
                    break;
                  }
                  this.context.token = l, d.next = 13;
                  break;
                case 11:
                  if (typeof l == "string" || l == null) {
                    d.next = 13;
                    break;
                  }
                  throw new ca('The "token" is not a valid string.', si);
                case 13:
                  return f = Date.now(), this.context.sid = sb(a), this.loginPromise = this.loginImpl({ uid: s.uid, instanceId: a }), this.info("RTM Client logging in as ".concat(La(s.uid))), d.prev = 17, d.next = 20, this.loginPromise;
                case 20:
                  d.next = 28;
                  break;
                case 22:
                  throw d.prev = 22, d.t0 = d.catch(17), Na(d.t0) && bb("Link", { ackedServerIp: "", destServerIp: "", ec: d.t0.code || 1, sc: d.t0.serverCode, elapse: Xa(this.session && this.session.startTime), lts: P.fromNumber(Date.now()), responseTime: Date.now() - f, sid: sb(a), userId: s.uid }, (h = this.context.config.enableCloudProxy) !== null && h !== void 0 && h), this.context.token = void 0, this.context.socketUseProxy = !1, d.t0;
                case 28:
                  return d.prev = 28, this.loginPromise = void 0, d.finish(28);
                case 31:
                  this.context.socketUseProxy && this.emit("FallbackProxyConnected"), xn(!1);
                case 33:
                case "end":
                  return d.stop();
              }
          }, i, this, [[17, 22, 28, 31]]);
        }));
        return function(i) {
          return o.apply(this, arguments);
        };
      }() }, { key: "logout", value: function() {
        var o = ma(N.mark(function i() {
          var s;
          return N.wrap(function(u) {
            for (; ; )
              switch (u.prev = u.next) {
                case 0:
                  if (!this.loginPromise) {
                    u.next = 3;
                    break;
                  }
                  return u.next = 3, this.loginPromise;
                case 3:
                  if (this.connectionState !== oa.DISCONNECTED) {
                    u.next = 6;
                    break;
                  }
                  throw this.logError("Already in logout state"), new da("Logout failure. The client has already been logged out", cs);
                case 6:
                  if (this.internalEmitter.emit("LOGOUT"), this.connectionState !== oa.ABORTED) {
                    u.next = 11;
                    break;
                  }
                  return this.info('Reset connection state from "ABORTED" to "DISCONNECTED"'), this.onConnectionStateChanged(oa.DISCONNECTED, Rb.LOGOUT), u.abrupt("return");
                case 11:
                  if (this.session !== void 0) {
                    u.next = 14;
                    break;
                  }
                  return this.onConnectionStateChanged(oa.DISCONNECTED, Rb.LOGOUT), u.abrupt("return");
                case 14:
                  return bb("Logout", { elapse: Xa(this.session.startTime), lts: P.fromNumber(Date.now()), sid: sb(this.session.instanceId), userId: this.context.uid }, (s = this.context.config.enableCloudProxy) !== null && s !== void 0 && s), u.next = 17, this.session.logoutHandler();
                case 17:
                  this.onConnectionStateChanged(oa.DISCONNECTED, Rb.LOGOUT), this.log("Log out success");
                case 19:
                case "end":
                  return u.stop();
              }
          }, i, this);
        }));
        return function() {
          return o.apply(this, arguments);
        };
      }() }, { key: "logoutSync", value: function() {
        var o, i = this;
        if (this.connectionState === oa.DISCONNECTED)
          throw this.logError("Already in logout state"), new da("Logout failure. The client has already been logged out", cs);
        this.connectionState === oa.ABORTED ? this.info('Reset connection state from "ABORTED" to "DISCONNECTED"') : this.session !== void 0 && (bb("Logout", { elapse: Xa(this.session.startTime), lts: P.fromNumber(Date.now()), sid: sb(this.session.instanceId), userId: this.context.uid }, (o = this.context.config.enableCloudProxy) !== null && o !== void 0 && o), this.session.logoutHandler().then(function() {
          i.log("Log out success");
        })), this.onConnectionStateChanged(oa.DISCONNECTED, Rb.LOGOUT);
      } }, { key: "sendMessageToPeer", value: function() {
        var o = ma(N.mark(function i(s, u) {
          var a, l, f = this;
          return N.wrap(function(h) {
            for (; ; )
              switch (h.prev = h.next) {
                case 0:
                  if (Xn(s, bg), a = s.messageType === "TEXT" ? Ka.P2pSMsgNoOfflineFlag : Ka.P2pRMsgNoOfflineFlag, this.connectionState !== oa.RECONNECTING) {
                    h.next = 5;
                    break;
                  }
                  return l = Date.now(), h.abrupt("return", new Promise(function(d, p) {
                    var v, y = (v = ma(N.mark(function m() {
                      var E;
                      return N.wrap(function(w) {
                        for (; ; )
                          switch (w.prev = w.next) {
                            case 0:
                              if (f.session !== void 0) {
                                w.next = 2;
                                break;
                              }
                              throw new mb({ SESSION_NOT_FOUND: "Failed to get session of the client" });
                            case 2:
                              return E = Date.now() - l, w.prev = 3, w.t0 = d, w.next = 7, ph({ message: s, peerId: u, toPeer: !0, session: f.session, errorCodes: { NOT_LOGGED_IN: Ll, TOO_OFTEN: es }, diff: E, logger: f.logger });
                            case 7:
                              w.t1 = w.sent, (0, w.t0)(w.t1), w.next = 18;
                              break;
                            case 11:
                              w.prev = 11, w.t2 = w.catch(3), Ab(w.t2) && (f.session.emit("messageCount", { messageCategory: a, type: "common", key: "sentcount" }), f.session.emit("messageCount", { messageCategory: a, type: "common", key: "timeoutcount" }), p(new Ub(we(f.name, "sendMessageToPeer", 1e4), Kl))), Na(w.t2) && p(w.t2), f.session.emit("messageCount", { messageCategory: a, type: "common", key: "sentcount" }), f.session.emit("messageCount", { messageCategory: a, type: "common", key: "unknowerrorcount" }), p(new Ja("Peer-to-peer message send failure", { code: ds, originalError: w.t2 }));
                            case 18:
                              return w.prev = 18, clearTimeout(g), w.finish(18);
                            case 21:
                            case "end":
                              return w.stop();
                          }
                      }, m, null, [[3, 11, 18, 21]]);
                    })), function() {
                      return v.apply(this, arguments);
                    });
                    f.internalEmitter.once("RECONNECTED", y);
                    var g = setTimeout(function() {
                      f.internalEmitter.off("RECONNECTED", y), p(new Ub(we(f.name, "sendMessageToPeer", 1e4), Kl));
                    }, 9e3);
                  }));
                case 5:
                  if (this.connectionState === oa.CONNECTED) {
                    h.next = 7;
                    break;
                  }
                  throw new da("Failed to send the peer-to-peer message. The client is not logged in", Ll);
                case 7:
                  if (this.session !== void 0) {
                    h.next = 9;
                    break;
                  }
                  throw new mb({ SESSION_NOT_FOUND: "Failed to get session of the client" });
                case 9:
                  return h.prev = 9, h.next = 12, ph({ message: s, peerId: u, toPeer: !0, session: this.session, errorCodes: { NOT_LOGGED_IN: Ll, TOO_OFTEN: es }, diff: 0, logger: this.logger });
                case 12:
                  return h.abrupt("return", h.sent);
                case 15:
                  if (h.prev = 15, h.t0 = h.catch(9), !Ab(h.t0)) {
                    h.next = 21;
                    break;
                  }
                  throw this.session.emit("messageCount", { messageCategory: a, type: "common", key: "sentcount" }), this.session.emit("messageCount", { messageCategory: a, type: "common", key: "timeoutcount" }), new Ub(we(this.name, "sendMessageToPeer", 1e4), Kl);
                case 21:
                  if (!Na(h.t0)) {
                    h.next = 23;
                    break;
                  }
                  throw h.t0;
                case 23:
                  throw this.session.emit("messageCount", { messageCategory: a, type: "common", key: "sentcount" }), this.session.emit("messageCount", { messageCategory: a, type: "common", key: "unknowerrorcount" }), new Ja("Peer-to-peer message send failure", { code: ds, originalError: h.t0 });
                case 26:
                case "end":
                  return h.stop();
              }
          }, i, this, [[9, 15]]);
        }));
        return function(i, s) {
          return o.apply(this, arguments);
        };
      }() }, { key: "createChannel", value: function(o) {
        var i = this;
        if (!Ta(o))
          throw new ca(["The %s in the arguments is invalid", Object.keys({ channelId: o })[0]], FB);
        return new uF(o, function() {
          return i.session;
        }, this, this.logger);
      } }, { key: "createLocalInvitation", value: function(o) {
        if (!Ta(o))
          throw new ca(["The %s in the arguments is invalid", Object.keys({ calleeId: o })[0]], Xc);
        return this.invitationManager.genLocalInvitation(o);
      } }, { key: "subscribePeersOnlineStatus", value: function() {
        var o = ma(N.mark(function i(s) {
          var u, a, l, f, h, d, p, v, y, g, m, E, w, C = this;
          return N.wrap(function(q) {
            for (; ; )
              switch (q.prev = q.next) {
                case 0:
                  if (this.connectionState === oa.CONNECTED) {
                    q.next = 2;
                    break;
                  }
                  throw new da("The client is not logged in", Nl);
                case 2:
                  if (this.session !== void 0) {
                    q.next = 4;
                    break;
                  }
                  throw new mb({ SESSION_NOT_FOUND: "Failed to get session of the client" });
                case 4:
                  if (Array.isArray(s) && s.length !== 0) {
                    q.next = 6;
                    break;
                  }
                  throw new ca("Invalid arguments: peerIds", Qg);
                case 6:
                  u = 0;
                case 7:
                  if (!(u < s.length)) {
                    q.next = 14;
                    break;
                  }
                  if (Ta(a = s[u])) {
                    q.next = 11;
                    break;
                  }
                  throw new ca(["subscribePeersOnlineStatus peer id %s is invalid", a], Qg);
                case 11:
                  u++, q.next = 7;
                  break;
                case 14:
                  if (!(512 < (l = s && s.length ? fl(s) : []).length + Object.keys(this.subscribedPeerStatusCache).length + this.pendingPeerStatusSubCount)) {
                    q.next = 17;
                    break;
                  }
                  throw new ic("Subscribed peers overflows", js);
                case 17:
                  return this.pendingPeerStatusSubCount += l.length, q.next = 20, this.session.requestSubscribePeersOnlineStatus(l).toPromise();
                case 20:
                  f = q.sent, h = f.errors, this.pendingPeerStatusSubCount -= l.length, d = [], p = [], v = 0;
                case 26:
                  if (!(v < h.length)) {
                    q.next = 34;
                    break;
                  }
                  if (y = h[v], g = y.code, typeof (m = y.account) == "string") {
                    q.next = 30;
                    break;
                  }
                  throw new Ja("Returned account is invalid", is);
                case 30:
                  g !== 0 && d.push(m);
                case 31:
                  v++, q.next = 26;
                  break;
                case 34:
                  for (E = 0; E < l.length; E++)
                    w = l[E], d.includes(w) || (p.push(w), this.subscribedPeerStatusCache[w] = void 0);
                  if (this.session.requestPeersOnlineStatus(p).pipe(Ea(function(J) {
                    return md(tl(J.userInfos, "account"), function(B) {
                      return !!B.ts;
                    });
                  })).subscribe(function(J) {
                    J = md(J, function(B, Y) {
                      return B = B ? ta.PeerOnlineState.ONLINE : ta.PeerOnlineState.OFFLINE, C.subscribedPeerStatusCache[Y] = B;
                    }), C.emit("PeersOnlineStatusChanged", J);
                  }), d.length === 0) {
                    q.next = 38;
                    break;
                  }
                  throw new Ja("Subscription failed", is);
                case 38:
                case "end":
                  return q.stop();
              }
          }, i, this);
        }));
        return function(i) {
          return o.apply(this, arguments);
        };
      }() }, { key: "unsubscribePeersOnlineStatus", value: function() {
        var o = ma(N.mark(function i(s) {
          var u, a, l, f, h;
          return N.wrap(function(d) {
            for (; ; )
              switch (d.prev = d.next) {
                case 0:
                  if (this.connectionState === oa.CONNECTED) {
                    d.next = 2;
                    break;
                  }
                  throw new da("The client is not logged in", Nl);
                case 2:
                  if (this.session !== void 0) {
                    d.next = 4;
                    break;
                  }
                  throw new mb({ SESSION_NOT_FOUND: "Failed to get session of the client" });
                case 4:
                  if (Array.isArray(s) && s.length !== 0) {
                    d.next = 6;
                    break;
                  }
                  throw new ca("Invalid arguments: peerIds", Qg);
                case 6:
                  u = 0;
                case 7:
                  if (!(u < s.length)) {
                    d.next = 14;
                    break;
                  }
                  if (Ta(a = s[u])) {
                    d.next = 11;
                    break;
                  }
                  throw new ca(["subscribePeersOnlineStatus peer id %s is invalid", a], Qg);
                case 11:
                  u++, d.next = 7;
                  break;
                case 14:
                  if (!(512 < s.length)) {
                    d.next = 16;
                    break;
                  }
                  throw new ic("Unsubscribed peers overflows", js);
                case 16:
                  for (l = s && s.length ? fl(s) : [], this.session.requestUnsubscribePeersOnlineStatus(l), f = 0; f < l.length; f++)
                    h = l[f], delete this.subscribedPeerStatusCache[h];
                case 19:
                case "end":
                  return d.stop();
              }
          }, i, this);
        }));
        return function(i) {
          return o.apply(this, arguments);
        };
      }() }, { key: "queryPeersBySubscriptionOption", value: function() {
        var o = ma(N.mark(function i(s) {
          return N.wrap(function(u) {
            for (; ; )
              switch (u.prev = u.next) {
                case 0:
                  if (this.connectionState === oa.CONNECTED) {
                    u.next = 2;
                    break;
                  }
                  throw new da("The client is not logged in", Nl);
                case 2:
                  if (s !== ta.PeerSubscriptionOption.ONLINE_STATUS) {
                    u.next = 4;
                    break;
                  }
                  return u.abrupt("return", Object.keys(this.subscribedPeerStatusCache));
                case 4:
                  throw new ca("Subscription option not supported", Qg);
                case 5:
                case "end":
                  return u.stop();
              }
          }, i, this);
        }));
        return function(i) {
          return o.apply(this, arguments);
        };
      }() }, { key: "createMessage", value: function(o) {
        return o;
      } }, { key: "loginImpl", value: function() {
        var o = ma(N.mark(function i(s) {
          var u, a, l, f, h, d, p, v, y = this;
          return N.wrap(function(g) {
            for (; ; )
              switch (g.prev = g.next) {
                case 0:
                  if (u = s.uid, a = s.instanceId, l = s.forceLoginTime, f = l === void 0 ? 0 : l, h = a, !(this.lastLoginTime !== void 0 && 500 > Date.now() - this.lastLoginTime)) {
                    g.next = 4;
                    break;
                  }
                  throw new bE(["The frequency of login exceeded the limit of %d queries per second", 2], UB);
                case 4:
                  if (this.connectionState === oa.DISCONNECTED || f !== 0) {
                    g.next = 6;
                    break;
                  }
                  throw new da("The SDK is either logging in or has logged in the Agora RTM system", SB);
                case 6:
                  g.prev = 6, this.context.uid = u, g.next = 13;
                  break;
                case 10:
                  throw g.prev = 10, g.t0 = g.catch(6), new ca(["The %s in the arguments is invalid", Object.keys({ uid: u })[0]], si);
                case 13:
                  return f === 0 && this.onConnectionStateChanged(oa.CONNECTING, Rb.LOGIN), (d = new ct(this.context, this.logger, !1)).blacklistedIP = this.blacklistedIP, this.session = p = new Tt(this.context, d, h, this.logger), v = function() {
                    y.connectionState === oa.CONNECTED && (y.onConnectionStateChanged(oa.RECONNECTING, Rb.INTERRUPTED), y.session) && y.session.once("userJoined", function() {
                      y.onConnectionStateChanged(oa.CONNECTED, Rb.LOGIN_SUCCESS);
                    });
                  }, p.on("connectionLost", v), p.on("tokenExpired", function() {
                    y.emit("TokenExpired");
                  }), p.on("tokenPrivilegeWillExpire", this.TokenPrivilegeWillExpireHandler), p.once("userDrop", this.userDropHandler), this.session.on("peerTextMessage", function(m) {
                    y.emit("MessageFromPeer", { text: m.text, messageType: ta.MessageType.TEXT }, m.peerId, m.properties);
                  }), this.session.on("peerRawMessage", function(m) {
                    y.emit("MessageFromPeer", { rawMessage: m.raw, description: m.desc, messageType: ta.MessageType.RAW }, m.peerId, m.properties);
                  }), p.on("instanceChanged", function(m) {
                    return h = m;
                  }), p.on("peerOnlineStatusChanged", function(m) {
                    var E = m.instance.toString() + m.state, w = y.peerStatusSeqLru.get(E);
                    !w || m.seq.greaterThan(w) ? (y.peerStatusSeqLru.set(E, m.seq), m.state !== y.subscribedPeerStatusCache[m.peerId] && y.emit("PeersOnlineStatusChanged", x({}, m.peerId, m.state)), y.subscribedPeerStatusCache[m.peerId] = m.state, clearTimeout(y.peerUnreachableTimers[E]), m.state === ta.PeerOnlineState.UNREACHABLE && (y.peerUnreachableTimers[E] = setTimeout(function() {
                      y.subscribedPeerStatusCache[m.peerId] === ta.PeerOnlineState.UNREACHABLE && (y.subscribedPeerStatusCache[m.peerId] = ta.PeerOnlineState.ONLINE, y.emit("PeersOnlineStatusChanged", x({}, m.peerId, ta.PeerOnlineState.ONLINE)));
                    }, 3e4))) : y.log("peerOnlineStatusChanged dedup for %s, %d", E, m.seq.toNumber());
                  }), p.on("invitationMessage", this.invitationManager.invitationMessageHandler.bind(this.invitationManager)), p.on("channelAttributesUpdated", function(m) {
                    var E = m.channelId;
                    m = m.attributeMaps;
                    for (var w = {}, C = 0; C < m.length; C++) {
                      var q = m[C], J = q.key, B = q.ms, Y = q.value;
                      if (q = q.origin, typeof J != "string" || !P.isLong(B) || typeof Y != "string" || !Ta(q))
                        break;
                      w[J] = new Blob([Y]).size;
                    }
                    y.channelAttributesCacheLru.set(E, w);
                  }), p.on("userJoined", function(m) {
                    if (Object.keys(y.attributes).length !== 0) {
                      if (y.session === void 0)
                        return;
                      y.session.requestSetLocalUserAttributes(y.attributes, m).toPromise();
                    }
                    if (y.attributeDrafts.size !== 0)
                      for (var E = function(q, J) {
                        var B = (q = J[q]).attribute;
                        q.promise.then(function() {
                          y.session !== void 0 && y.session.requestSetLocalUserAttributes(B, m).toPromise();
                        });
                      }, w = 0, C = Array.from(y.attributeDrafts); w < C.length; w++)
                        E(w, C);
                    Object.keys(y.subscribedPeerStatusCache).length !== 0 && p.requestSubscribePeersOnlineStatus(Object.keys(y.subscribedPeerStatusCache));
                  }), p.on("banEdgeIP", function(m) {
                    y.banIP(m);
                  }), this.lastLoginTime = Date.now(), g.prev = 32, g.next = 35, p.loginHandler().toPromise();
                case 35:
                  g.next = 53;
                  break;
                case 37:
                  if (g.prev = 37, g.t1 = g.catch(32), !(g.t1.name === "loginRespTimeout" && 2 > f)) {
                    g.next = 46;
                    break;
                  }
                  return p.removeAllListeners(), g.next = 43, this.loginImpl({ uid: u, instanceId: a, forceLoginTime: f + 1 });
                case 43:
                  return g.abrupt("return");
                case 46:
                  if (!Ab(g.t1)) {
                    g.next = 49;
                    break;
                  }
                  throw this.onConnectionStateChanged(oa.DISCONNECTED, Rb.LOGIN_TIMEOUT), new Ub(we(this.name, "login", 12e3), TB);
                case 49:
                  if (this.onConnectionStateChanged(oa.DISCONNECTED, Rb.LOGIN_FAILURE), !Na(g.t1)) {
                    g.next = 52;
                    break;
                  }
                  throw g.t1;
                case 52:
                  throw new Ja("Login failure", { code: $r, originalError: g.t1 });
                case 53:
                  this.onConnectionStateChanged(oa.CONNECTED, Rb.LOGIN_SUCCESS);
                case 54:
                case "end":
                  return g.stop();
              }
          }, i, this, [[6, 10], [32, 37]]);
        }));
        return function(i) {
          return o.apply(this, arguments);
        };
      }() }, { key: "onConnectionStateChanged", value: function(o, i) {
        var s, u = this;
        o === oa.RECONNECTING && (this.reconnId += 1), bb("ConnectionStateChange", { elapse: Xa(this.session && this.session.startTime), lts: P.fromNumber(Date.now()), newState: Vt[o], oldState: Vt[this.connectionState], reason: vF[i], sid: sb(this.session && this.session.instanceId || P.fromNumber(0)), userId: this.context.uid, reconnId: this.reconnId }, (s = this.context.config.enableCloudProxy) !== null && s !== void 0 && s), this.connectionState === oa.RECONNECTING && o === oa.CONNECTED && (Object.keys(this.subscribedPeerStatusCache).length !== 0 && this.session !== void 0 && this.session.requestPeersOnlineStatus(Object.keys(this.subscribedPeerStatusCache)).pipe(Ea(function(a) {
          return md(tl(a.userInfos, "account"), function(l) {
            return !!l.ts;
          });
        })).subscribe(function(a) {
          a = md(a, function(l, f) {
            return l = l ? ta.PeerOnlineState.ONLINE : ta.PeerOnlineState.OFFLINE, u.subscribedPeerStatusCache[f] = l;
          }), u.emit("PeersOnlineStatusChanged", a);
        }), this.internalEmitter.emit("RECONNECTED")), this.connectionState = o, o !== oa.ABORTED && o !== oa.DISCONNECTED || (this.pendingPeerStatusSubCount = this.reconnId = 0, this.attributes = {}, this.session && (this.session.removeAllListeners(), this.session.msgDedupLru.empty(), this.session.dialogueSequenceLru.empty(), this.session.dialPendingMsgSubjectMap.clear()), this.channelAttributesCacheLru.empty(), this.peerStatusSeqLru.empty(), this.peerUnreachableTimers = {}, this.subscribedPeerStatusCache = {}, this.attributeDrafts.clear(), this.context.token = void 0), this.emit("ConnectionStateChanged", o, i);
      } }, { key: "banIP", value: function(o) {
        var i;
        this.log("ip banned", o);
        var s = (i = this.blacklistedIP[o]) !== null && i !== void 0 ? i : 0;
        this.blacklistedIP[o] = s + 1;
      } }]), t;
    }(sc()), Da(W.prototype, "renewToken", [jb], Object.getOwnPropertyDescriptor(W.prototype, "renewToken"), W.prototype), Da(W.prototype, "queryPeersOnlineStatus", [jb], Object.getOwnPropertyDescriptor(W.prototype, "queryPeersOnlineStatus"), W.prototype), Da(W.prototype, "getChannelMemberCount", [jb], Object.getOwnPropertyDescriptor(W.prototype, "getChannelMemberCount"), W.prototype), Da(W.prototype, "setLocalUserAttributes", [jb], Object.getOwnPropertyDescriptor(W.prototype, "setLocalUserAttributes"), W.prototype), Da(W.prototype, "setChannelAttributes", [jb], Object.getOwnPropertyDescriptor(W.prototype, "setChannelAttributes"), W.prototype), Da(W.prototype, "addOrUpdateLocalUserAttributes", [jb], Object.getOwnPropertyDescriptor(W.prototype, "addOrUpdateLocalUserAttributes"), W.prototype), Da(W.prototype, "addOrUpdateChannelAttributes", [jb], Object.getOwnPropertyDescriptor(W.prototype, "addOrUpdateChannelAttributes"), W.prototype), Da(W.prototype, "deleteLocalUserAttributesByKeys", [jb], Object.getOwnPropertyDescriptor(W.prototype, "deleteLocalUserAttributesByKeys"), W.prototype), Da(W.prototype, "deleteChannelAttributesByKeys", [jb], Object.getOwnPropertyDescriptor(W.prototype, "deleteChannelAttributesByKeys"), W.prototype), Da(W.prototype, "clearLocalUserAttributes", [Mc], Object.getOwnPropertyDescriptor(W.prototype, "clearLocalUserAttributes"), W.prototype), Da(W.prototype, "clearChannelAttributes", [jb], Object.getOwnPropertyDescriptor(W.prototype, "clearChannelAttributes"), W.prototype), Da(W.prototype, "getUserAttributes", [jb], Object.getOwnPropertyDescriptor(W.prototype, "getUserAttributes"), W.prototype), Da(W.prototype, "getChannelAttributes", [jb], Object.getOwnPropertyDescriptor(W.prototype, "getChannelAttributes"), W.prototype), Da(W.prototype, "getChannelAttributesByKeys", [jb], Object.getOwnPropertyDescriptor(W.prototype, "getChannelAttributesByKeys"), W.prototype), Da(W.prototype, "getUserAttributesByKeys", [jb], Object.getOwnPropertyDescriptor(W.prototype, "getUserAttributesByKeys"), W.prototype), Da(W.prototype, "login", [Mc], Object.getOwnPropertyDescriptor(W.prototype, "login"), W.prototype), Da(W.prototype, "logout", [Mc], Object.getOwnPropertyDescriptor(W.prototype, "logout"), W.prototype), Da(W.prototype, "logoutSync", [Mc], Object.getOwnPropertyDescriptor(W.prototype, "logoutSync"), W.prototype), Da(W.prototype, "sendMessageToPeer", [jb], Object.getOwnPropertyDescriptor(W.prototype, "sendMessageToPeer"), W.prototype), Da(W.prototype, "createChannel", [jb], Object.getOwnPropertyDescriptor(W.prototype, "createChannel"), W.prototype), Da(W.prototype, "createLocalInvitation", [jb], Object.getOwnPropertyDescriptor(W.prototype, "createLocalInvitation"), W.prototype), Da(W.prototype, "subscribePeersOnlineStatus", [jb], Object.getOwnPropertyDescriptor(W.prototype, "subscribePeersOnlineStatus"), W.prototype), Da(W.prototype, "unsubscribePeersOnlineStatus", [jb], Object.getOwnPropertyDescriptor(W.prototype, "unsubscribePeersOnlineStatus"), W.prototype), Da(W.prototype, "queryPeersBySubscriptionOption", [jb], Object.getOwnPropertyDescriptor(W.prototype, "queryPeersBySubscriptionOption"), W.prototype), Da(W.prototype, "createMessage", [Mc], Object.getOwnPropertyDescriptor(W.prototype, "createMessage"), W.prototype), W), rm, sm, tm, um, Wt = (rm = /Chrome\/([0-9.]+)/.exec((tm = window) === null || tm === void 0 || (um = tm.navigator) === null || um === void 0 ? void 0 : um.userAgent)) === null || rm === void 0 || (sm = rm[1]) === null || sm === void 0 ? void 0 : sm.split(".")[0];
    if (Wt && 88 <= parseInt(Wt, 10) && !Ce()) {
      var vm, ze = document.createElement("video"), Ae = document.createElement("canvas");
      ze.setAttribute("style", "display:none"), ze.setAttribute("muted", ""), ze.muted = !0, ze.setAttribute("autoplay", ""), ze.autoplay = !0, ze.setAttribute("playsinline", ""), Ae.setAttribute("style", "display:none"), Ae.setAttribute("width", "1"), Ae.setAttribute("height", "1"), (vm = Ae.getContext("2d")) === null || vm === void 0 || vm.fillRect(0, 0, 1, 1), ze.srcObject = Ae == null ? void 0 : Ae.captureStream();
    }
    var Xt = { LOG_FILTER_OFF: { error: !1, warn: !1, info: !1, track: !1, debug: !1 }, LOG_FILTER_ERROR: { error: !0, warn: !1, info: !1, track: !1, debug: !1 }, LOG_FILTER_WARNING: { error: !0, warn: !0, info: !1, track: !1, debug: !1 }, LOG_FILTER_INFO: { error: !0, warn: !0, info: !0, track: !1, debug: !1 }, LOG_FILTER_DEBUG: { error: !0, warn: !0, info: !0, track: !0, debug: !0 } }, Yt = { enableLogUpload: !1, logFilter: Xt.LOG_FILTER_INFO, enableCloudProxy: !1 }, ue = Wa(Wa({ createInstance: function(e) {
      var t = 1 < arguments.length && arguments[1] !== void 0 ? arguments[1] : {}, n = 2 < arguments.length ? arguments[2] : void 0;
      if (!/^[\dA-Za-z]{32}$/.test(e))
        throw new ca(["The %s in the arguments is invalid", Object.keys({ appId: e })[0]], Or);
      var r = Object.keys(t).filter(function(f) {
        return !(f in Yt);
      });
      if (r.length !== 0)
        throw new ca("Invalid RTM config: ".concat(r.join(", ")), Or);
      var o = Wa(Wa({}, Yt), t);
      if (n !== void 0 && (!Array.isArray(n) || n.length === 0))
        throw new ca("Invalid area config");
      if (n != null) {
        if (!n.every(function(f) {
          return f in ta.LegacyAreaCode;
        }))
          throw new ca("Invalid area codes: ".concat(n.filter(function(f) {
            return !(f in ta);
          }).join(", ")));
        fa = Ve(n.map(function(f) {
          return dE[f];
        }));
      }
      n = Tl = Ya.__global_unique_id__ = (Ya.__global_unique_id__ || 0) + 1;
      var i = iE(o);
      r = jE(o);
      var s = kE(o), u = lE(n, o), a = Xs(n, o), l = a("RTM:DEBUG", "<Entry> ");
      return Qs.rtmConfig = o, i("The Agora RTM Web SDK version is %s", "1.5.1"), t.enableCloudProxy && i("RTM cloud proxy enabled"), t.enableLogUpload && i("Log upload enabled"), fa && l("Area is set to %s", Array.from(fa.CODES).map(function(f) {
        return Yf(S).find(function(h) {
          return S[h] === f;
        });
      }).join(", ")), l("Creating an RtmClient instance"), l('The Git commit ID is "'.concat("v1.5.1-0-g5bbbcd72", '"')), l("The App ID is %s", Yn(e, 4, 10, "*".repeat(6))), i("The process ID is %s", Og), l("The build is %s", "v1.5.1-0-g5bbbcd72"), l("NODE_ENV is %s", "production"), new wF(e, { genLogger: a, genTracker: u, info: i, warn: r, logError: s, loggerId: n }, o, function(f) {
        for (var h = 0, d = Yf(f); h < d.length; h++) {
          var p = d[h];
          try {
            var v = f[p];
            v != null && (f.enableCloudProxy && i("RTM cloud proxy enabled"), f.enableLogUpload && i("Log upload enabled"), o[p] = v);
          } catch (y) {
            throw new ca(["The %s in the arguments is invalid", p], void 0);
          }
        }
      });
    }, BUILD: "v1.5.1-0-g5bbbcd72", VERSION: "1.5.1", END_CALL_PREFIX: "AgoraRTMLegacyEndcallCompatibleMessagePrefix", processId: Og, ConnectionChangeReason: ta.ConnectionChangeReason, ConnectionState: ta.ConnectionState, LocalInvitationFailureReason: ta.LocalInvitationFailureReason, LocalInvitationState: ta.LocalInvitationState, RemoteInvitationFailureReason: ta.RemoteInvitationFailureReason, RemoteInvitationState: ta.RemoteInvitationState, MessageType: ta.MessageType, PeerOnlineState: ta.PeerOnlineState, PeerSubscriptionOption: ta.PeerSubscriptionOption }, Xt), {}, { setParameter: function(e, t) {
      Object.keys(Ec).includes(e) && (Ec[e] = t);
    }, getParameter: function(e) {
      return Ec[e];
    }, setArea: function(e) {
      var t = e.areaCodes;
      if (e = e.excludedArea, !Array.isArray(t) || t.length === 0 || !t.every(function(n) {
        return n in ta.AreaCode;
      }))
        throw new ca("Invalid area config");
      if (e !== void 0 && e === ta.AreaCode.GLOBAL)
        throw new ca("Excluded area cannot be global");
      if (e === void 0)
        fa = Ve(t.map(function(n) {
          return S[n];
        }));
      else {
        if (t.includes(e))
          throw new ca("Excluded area cannot be in areaCodes");
        if (!(e in S))
          throw new ca("Invalid excludedArea:", e);
        fa = Gv({ areas: t.map(function(n) {
          return S[n];
        }), excludedArea: S[e] });
      }
    } });
    return ue;
  });
})(agoraRtmSdk, agoraRtmSdk.exports);
var agoraRtmSdkExports = agoraRtmSdk.exports;
const index = /* @__PURE__ */ getDefaultExportFromCjs(agoraRtmSdkExports), index$1 = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  default: index
}, Symbol.toStringTag, { value: "Module" }));
export {
  index$1 as i
};
