function C(s, e) {
  Object.entries(e).forEach(([r, n]) => s.style.setProperty(r, n));
}
function g(s, e, r) {
  return e - r < s && s < e + r;
}
function _(s) {
  const { tl: e, tr: r, br: n, bl: i } = s, t = Math.min(e.x, r.x, n.x, i.x), c = Math.max(e.x, r.x, n.x, i.x), a = Math.min(e.y, r.y, n.y, i.y), l = Math.max(e.y, r.y, n.y, i.y);
  return {
    left: t,
    right: c,
    top: a,
    bottom: l,
    width: c - t,
    height: l - a,
    offsetLeft: t - e.x,
    offsetRight: c - e.x,
    offsetTop: a - e.y,
    offsetBottom: l - e.y
  };
}
function Y(...s) {
  const e = Math.min(...s.map((t) => t.left)), r = Math.max(...s.map((t) => t.right)), n = Math.min(...s.map((t) => t.top)), i = Math.max(...s.map((t) => t.bottom));
  return { left: e, right: r, top: n, bottom: i, width: r - e, height: i - n };
}
function k(s, e) {
  const r = (s.y - e.y) / (s.x - e.x), n = s.y - r * s.x;
  if (r === 0) {
    const i = Math.sign(e.x - s.x) * (1 / 0), t = s.y;
    return {
      k: r,
      b: n,
      reverseFunc: () => i,
      func: () => t,
      A: s,
      B: e
    };
  } else {
    if (Number.isFinite(r))
      return {
        k: r,
        b: n,
        reverseFunc: (i) => (i - n) / r,
        func: (i) => r * i + n,
        A: s,
        B: e
      };
    {
      const i = Math.sign(e.y - s.y) * (1 / 0), t = s.x;
      return {
        k: r,
        b: n,
        reverseFunc: () => t,
        func: () => i,
        A: s,
        B: e
      };
    }
  }
}
function L(s, e) {
  if (!Number.isFinite(e.k))
    return { x: e.reverseFunc(0), y: s.y };
  if (e.k === 0)
    return { x: s.x, y: e.func(0) };
  const r = (s.x + e.k * s.y - e.k * e.b) / (e.k * e.k + 1), n = (e.k * e.k * s.y + e.k * s.x + e.b) / (e.k * e.k + 1);
  return { x: r, y: n };
}
function p(s, e, r = "left", n = "top") {
  return s.toLocalPoint(e, r, n);
}
var X = Object.defineProperty, $ = Object.defineProperties, D = Object.getOwnPropertyDescriptors, w = Object.getOwnPropertySymbols, I = Object.prototype.hasOwnProperty, N = Object.prototype.propertyIsEnumerable, R = (s, e, r) => e in s ? X(s, e, { enumerable: !0, configurable: !0, writable: !0, value: r }) : s[e] = r, P = (s, e) => {
  for (var r in e || (e = {}))
    I.call(e, r) && R(s, r, e[r]);
  if (w)
    for (var r of w(e))
      N.call(e, r) && R(s, r, e[r]);
  return s;
}, T = (s, e) => $(s, D(e));
const E = 5, M = 5, B = {
  tl: "br",
  mt: "mb",
  tr: "bl",
  mr: "ml",
  br: "tl",
  mb: "mt",
  bl: "tr",
  ml: "mr"
}, G = {
  tl: "br",
  br: "tl",
  mt: "mb",
  mb: "mt",
  tr: "bl",
  bl: "tr",
  mr: "ml",
  ml: "mr"
}, O = {
  tl: "tr",
  tr: "tl",
  mr: "ml",
  ml: "mr",
  br: "bl",
  bl: "br",
  mt: "mt",
  mb: "mb"
}, F = {
  tl: "bl",
  bl: "tl",
  mt: "mb",
  mb: "mt",
  tr: "br",
  br: "tr",
  ml: "ml",
  mr: "mr"
};
class U {
  constructor(e) {
    this.canvas = null, this.lineRenderer = null, this.working = !1, this.draggingAdsorption = E, this.scalingAdsorption = M, this.objects = [], this.handleWorkBefore = (r) => {
      const n = r.target;
      if (n && this.canvas) {
        const i = n.type === "activeSelection" ? n._objects : null;
        this.objects = this.canvas._objects.reduce((t, c) => (i != null && i.includes(c) || t.push(T(P({}, _(c.aCoords)), {
          target: c
        })), t), []), i && this.objects.push(T(P({}, _(n.aCoords)), {
          target: n
        })), this.working = !0;
      }
    }, this.handleWork = (r) => {
      if (!this.working)
        return;
      switch (r.transform.action) {
        case "drag":
          this.handleDrag(r);
          break;
        case "scale":
          this.handleScale(r);
          break;
        case "scaleX":
        case "scaleY":
          this.handleScaleXOrY(r);
          break;
      }
    }, this.handleWorkAfter = (r) => {
      var n;
      this.working && (this.working = !1, (n = this.lineRenderer) == null || n.clearAuxiliaryLines());
    }, this.draggingAdsorption = Math.abs(
      typeof (e == null ? void 0 : e.draggingAdsorption) == "number" ? e.draggingAdsorption : E
    ), this.scalingAdsorption = Math.abs(
      typeof (e == null ? void 0 : e.scalingAdsorption) == "number" ? e.scalingAdsorption : M
    ), this.lineRenderer = e != null && e.auxiliaryLineRenderer ? e.auxiliaryLineRenderer : null;
  }
  mount(e) {
    var r;
    this.unmount(), (r = this.lineRenderer) == null || r.mount(e), this.canvas = e, this.canvas.on("mouse:down", this.handleWorkBefore), this.canvas.on("object:moving", this.handleWork), this.canvas.on("object:scaling", this.handleWork), this.canvas.on("mouse:up", this.handleWorkAfter);
  }
  unmount() {
    var e;
    this.canvas && (this.canvas.off("mouse:down", this.handleWorkBefore), this.canvas.off("object:moving", this.handleWork), this.canvas.off("object:scaling", this.handleWork), this.canvas.off("mouse:up", this.handleWorkAfter)), (e = this.lineRenderer) == null || e.unmount();
  }
  handleDrag(e) {
    var r, n;
    (r = this.lineRenderer) == null || r.clearAuxiliaryLines();
    const i = e.target, t = this.objects.find((o) => o.target === i), c = i.left + t.offsetLeft, a = i.left + t.offsetRight, l = i.top + t.offsetTop, u = i.top + t.offsetBottom;
    this.objects.forEach((o) => {
      var f, y, A, m, h, b, v, d;
      o.target !== i && (g(c, o.left, this.draggingAdsorption) ? (i.set("left", o.left - t.offsetLeft), (f = this.lineRenderer) == null || f.addEffectToAuxiliaryLine("vertical-left", i, o)) : g(c, o.right, this.draggingAdsorption) && (i.set("left", o.right - t.offsetLeft), (y = this.lineRenderer) == null || y.addEffectToAuxiliaryLine("vertical-right", i, o)), g(a, o.right, this.draggingAdsorption) ? (i.set("left", o.right - t.offsetRight), (A = this.lineRenderer) == null || A.addEffectToAuxiliaryLine("vertical-right", i, o)) : g(a, o.left, this.draggingAdsorption) && (i.set("left", o.left - t.offsetRight), (m = this.lineRenderer) == null || m.addEffectToAuxiliaryLine("vertical-left", i, o)), g(l, o.top, this.draggingAdsorption) ? (i.set("top", o.top - t.offsetTop), (h = this.lineRenderer) == null || h.addEffectToAuxiliaryLine("horizon-top", i, o)) : g(l, o.bottom, this.draggingAdsorption) && (i.set("top", o.bottom - t.offsetTop), (b = this.lineRenderer) == null || b.addEffectToAuxiliaryLine("horizon-bottom", i, o)), g(u, o.bottom, this.draggingAdsorption) ? (i.set("top", o.bottom - t.offsetBottom), (v = this.lineRenderer) == null || v.addEffectToAuxiliaryLine("horizon-bottom", i, o)) : g(u, o.top, this.draggingAdsorption) && (i.set("top", o.top - t.offsetBottom), (d = this.lineRenderer) == null || d.addEffectToAuxiliaryLine("horizon-top", i, o)));
    }), (n = this.lineRenderer) == null || n.renderAuxiliarylines();
  }
  handleScale(e) {
    var r, n;
    (r = this.lineRenderer) == null || r.clearAuxiliaryLines();
    const i = e.target, t = e.transform;
    if ([t.originX, t.originY].some((h) => h === "center"))
      return;
    const c = e.pointer, a = t.shiftKey, l = t.original.flipX !== i.flipX, u = t.original.flipY !== i.flipY;
    let o = t.corner;
    l && u ? o = G[o] : l ? o = O[o] : u && (o = F[o]);
    const f = (360 + i.angle % 360) % 360, y = _(i.aCoords);
    let A, m;
    this.objects.some((h) => {
      if (h.target === i)
        return;
      const b = k(i.oCoords[o], i.oCoords[B[o]]), v = L(c, b);
      let d;
      switch (o) {
        case "tl":
        case "br":
          f !== 45 && f !== 225 && (g(v.x, h.right, this.scalingAdsorption) ? (d = { x: h.right, y: a ? c.y : b.func(h.right) }, this.updateAuxiliaryLine({ key: "vertical-right", active: i, rect: y, object: h })) : g(v.x, h.left, this.scalingAdsorption) && (d = { x: h.left, y: a ? c.y : b.func(h.left) }, this.updateAuxiliaryLine({ key: "vertical-left", active: i, rect: y, object: h }))), f !== 135 && f !== 315 && (g(v.y, h.bottom, this.scalingAdsorption) ? (d = { x: a ? c.x : b.reverseFunc(h.bottom), y: h.bottom }, this.updateAuxiliaryLine({ key: "horizon-bottom", active: i, rect: y, object: h })) : g(v.y, h.top, this.scalingAdsorption) && (d = { x: a ? c.x : b.reverseFunc(h.top), y: h.top }, this.updateAuxiliaryLine({ key: "horizon-top", active: i, rect: y, object: h })));
          break;
        case "tr":
        case "bl":
          f !== 135 && f !== 315 && (g(v.x, h.right, this.scalingAdsorption) ? (d = { x: h.right, y: a ? c.y : b.func(h.right) }, this.updateAuxiliaryLine({ key: "vertical-right", active: i, rect: y, object: h })) : g(v.x, h.left, this.scalingAdsorption) && (d = { x: h.left, y: a ? c.y : b.func(h.left) }, this.updateAuxiliaryLine({ key: "vertical-left", active: i, rect: y, object: h }))), f !== 45 && f !== 225 && (g(v.y, h.bottom, this.scalingAdsorption) ? (d = { x: a ? c.x : b.reverseFunc(h.bottom), y: h.bottom }, this.updateAuxiliaryLine({ key: "horizon-bottom", active: i, rect: y, object: h })) : g(v.y, h.top, this.scalingAdsorption) && (d = { x: a ? c.x : b.reverseFunc(h.top), y: h.top }, this.updateAuxiliaryLine({ key: "horizon-top", active: i, rect: y, object: h })));
          break;
      }
      if (!!d)
        switch (o) {
          case "tl":
            A = d, m = p(i, d, "right", "bottom");
            break;
          case "tr":
            A = L(d, k(i.oCoords.tl, i.oCoords.bl)), m = p(i, d, "left", "bottom");
            break;
          case "br":
            A = i.oCoords.tl, m = p(i, d, "left", "top");
            break;
          case "bl":
            A = L(d, k(i.oCoords.tl, i.oCoords.tr)), m = p(i, d, "right", "top");
            break;
        }
    }), A && m && i.set({
      left: A.x,
      top: A.y,
      scaleX: Math.abs(m.x) / i.width,
      scaleY: Math.abs(m.y) / i.height
    }), (n = this.lineRenderer) == null || n.renderAuxiliarylines();
  }
  handleScaleXOrY(e) {
    var r, n;
    (r = this.lineRenderer) == null || r.clearAuxiliaryLines();
    const i = e.transform;
    if ([i.originX, i.originY].some((v) => v === "center"))
      return;
    const t = e.target, c = e.pointer;
    let a = i.corner;
    i.original.flipX !== t.flipX ? a = O[a] : i.original.flipY !== t.flipY && (a = F[a]);
    let l, u, o, f;
    const y = (360 + t.angle % 360) % 360, A = _(t.aCoords), m = 0 <= y && y < 90 || 180 <= y && y < 270;
    m && a === "ml" || !m && a === "mr" ? (l = k(t.oCoords.bl, t.oCoords.br), u = k(t.oCoords.tl, t.oCoords.tr)) : m && a === "mr" || !m && a === "ml" ? (l = k(t.oCoords.tl, t.oCoords.tr), u = k(t.oCoords.bl, t.oCoords.br)) : m && a === "mt" || !m && a === "mb" ? (l = k(t.oCoords.tr, t.oCoords.br), u = k(t.oCoords.tl, t.oCoords.bl)) : (l = k(t.oCoords.tl, t.oCoords.bl), u = k(t.oCoords.tr, t.oCoords.br));
    const h = L(c, l), b = L(c, u);
    this.objects.forEach((v) => {
      if (v.target === t)
        return;
      const { xTouchPoint: d, yTouchPoint: x } = this.getTouchedPoint({
        angle: y,
        xPoint: h,
        yPoint: b,
        xLinear: l,
        yLinear: u,
        object: v,
        active: t,
        rect: A
      });
      if (m)
        switch (a) {
          case "ml":
            d && (o = L(d, u), f = p(t, o, "right", "bottom")), x && (o = x, f = p(t, o, "right", "bottom"));
            break;
          case "mr":
            d && (o = t.aCoords.tl, f = p(t, d, "left", "bottom")), x && (o = t.aCoords.tl, f = p(t, x, "left", "top"));
            break;
          case "mt":
            d && (o = L(d, u), f = p(t, o, "right", "bottom")), x && (o = x, f = p(t, o, "right", "bottom"));
            break;
          case "mb":
            d && (o = t.aCoords.tl, f = p(t, d, "right", "top")), x && (o = t.aCoords.tl, f = p(t, x, "left", "top"));
            break;
        }
      else
        switch (a) {
          case "ml":
            d && (o = d, f = p(t, o, "right", "bottom")), x && (o = L(x, l), f = p(t, o, "right", "bottom"));
            break;
          case "mr":
            d && (o = t.aCoords.tl, f = p(t, d, "left", "top")), x && (o = t.aCoords.tl, f = p(t, x, "left", "bottom"));
            break;
          case "mt":
            d && (o = L(d, l), f = p(t, o, "right", "bottom")), x && (o = L(x, l), f = p(t, o, "right", "bottom"));
            break;
          case "mb":
            d && (o = t.aCoords.tl, f = p(t, d, "left", "top")), x && (o = t.aCoords.tl, f = p(t, x, "right", "top"));
            break;
        }
    }), o && f && t.set({
      left: o.x,
      top: o.y,
      scaleX: Math.abs(f.x) / t.width,
      scaleY: Math.abs(f.y) / t.height
    }), (n = this.lineRenderer) == null || n.renderAuxiliarylines();
  }
  getTouchedPoint(e) {
    const { angle: r, xPoint: n, yPoint: i, object: t, xLinear: c, yLinear: a, active: l, rect: u } = e;
    let o, f;
    return r !== 90 && r !== 270 && (g(n.x, t.right, this.scalingAdsorption) ? (o = { x: t.right, y: c.func(t.right) }, this.updateAuxiliaryLine({ key: "vertical-right", active: l, rect: u, object: t })) : g(n.x, t.left, this.scalingAdsorption) && (o = { x: t.left, y: c.func(t.left) }, this.updateAuxiliaryLine({ key: "vertical-left", active: l, rect: u, object: t }))), r !== 0 && r !== 180 && (g(i.y, t.bottom, this.scalingAdsorption) ? (f = { x: a.reverseFunc(t.bottom), y: t.bottom }, this.updateAuxiliaryLine({ key: "horizon-bottom", active: l, rect: u, object: t })) : g(i.y, t.top, this.scalingAdsorption) && (f = { x: a.reverseFunc(t.top), y: t.top }, this.updateAuxiliaryLine({ key: "horizon-top", active: l, rect: u, object: t }))), { xTouchPoint: o, yTouchPoint: f };
  }
  updateAuxiliaryLine(e) {
    var r, n, i, t;
    const { key: c, active: a, rect: l, object: u } = e;
    switch (c) {
      case "vertical-left":
        (g(l.right, u.left, 1e-5) || g(l.left, u.left, 1e-5)) && ((r = this.lineRenderer) == null || r.addEffectToAuxiliaryLine("vertical-left", a, u));
        break;
      case "vertical-right":
        (g(l.right, u.right, 1e-5) || g(l.left, u.right, 1e-5)) && ((n = this.lineRenderer) == null || n.addEffectToAuxiliaryLine("vertical-right", a, u));
        break;
      case "horizon-top":
        (g(l.top, u.top, 1e-5) || g(l.bottom, u.top, 1e-5)) && ((i = this.lineRenderer) == null || i.addEffectToAuxiliaryLine("horizon-top", a, u));
        break;
      case "horizon-bottom":
        (g(l.top, u.bottom, 1e-5) || g(l.bottom, u.bottom, 1e-5)) && ((t = this.lineRenderer) == null || t.addEffectToAuxiliaryLine("horizon-bottom", a, u));
        break;
    }
  }
}
const S = 1, W = "dashed", z = "#fd7801";
class K {
  constructor(e) {
    this.container = null, this.lineMap = /* @__PURE__ */ new Map(), this.lineStyle = `${S}px ${W} ${z}`;
    const r = typeof (e == null ? void 0 : e.lineWidth) == "number" ? e.lineWidth : S, n = (e == null ? void 0 : e.lineStyle) || W, i = (e == null ? void 0 : e.lineColor) || z;
    this.lineStyle = `${r}px ${n} ${i}`;
  }
  mount(e) {
    this.unmount();
    const r = e.getElement();
    this.container = document.createElement("div"), C(this.container, {
      position: "relative",
      width: `${r.width}px`,
      height: `${r.height}px`,
      border: r.style.border,
      "border-width": r.style.borderWidth,
      "border-left-width": r.style.borderLeftWidth,
      "border-top-width": r.style.borderTopWidth,
      overflow: "hidden"
    }), r.after(this.container);
  }
  unmount() {
    var e;
    (e = this.container) == null || e.remove(), this.container = null, this.lineMap.clear();
  }
  setAuxiliaryLine(e) {
    var r;
    let n = this.lineMap.get(e);
    if (n)
      return n;
    const i = document.createElement("div");
    i.setAttribute("data-auxiliary-line-key", e), (r = this.container) == null || r.appendChild(i);
    const t = this.lineStyle;
    return n = {
      element: i,
      render(c) {
        var a;
        if (!i)
          return;
        const {
          left: l = 0,
          top: u = 0,
          width: o = 0,
          height: f = 0
        } = this.active && ((a = this.effects) == null ? void 0 : a.length) ? c(e, this.active, this.effects) : {};
        C(i, {
          position: "absolute",
          transform: `translate3d(${l}px, ${u}px, 0)`,
          width: `${o}px`,
          height: `${f}px`,
          "border-left": o === 0 && f !== 0 ? t : "none",
          "border-top": f === 0 && o !== 0 ? t : "none"
        });
      }
    }, this.lineMap.set(e, n), n;
  }
  addEffectToAuxiliaryLine(e, r, ...n) {
    const i = this.setAuxiliaryLine(e), t = i.effects || [];
    t.push(...n), i.active = r, i.effects = t;
  }
  clearAuxiliaryLines() {
    var e;
    (e = this.container) == null || e.style.setProperty("visibility", "hidden"), this.lineMap.forEach((r) => {
      delete r.active, r.effects = [];
    });
  }
  renderAuxiliaryLine(e, r, n) {
    let i = 0, t = 0, c = 0, a = 0;
    const l = Y(
      _(r.aCoords),
      ...n
    );
    switch (e) {
      case "vertical-left":
        i = n[0].left - 1, t = l.top, a = l.height;
        break;
      case "vertical-right":
        i = n[0].right, t = l.top, a = l.height;
        break;
      case "horizon-top":
        i = l.left, t = n[0].top - 1, c = l.width;
        break;
      case "horizon-bottom":
        i = l.left, t = n[0].bottom, c = l.width;
        break;
    }
    return { left: i, top: t, width: c, height: a };
  }
  renderAuxiliarylines() {
    var e;
    this.lineMap.forEach((r) => {
      var n;
      return (n = r.render) == null ? void 0 : n.call(r, this.renderAuxiliaryLine);
    }), (e = this.container) == null || e.style.setProperty("visibility", "visible");
  }
}
const H = {
  FabricAutoAdsorber: U,
  AuxiliaryLineRenderer: K
};
export {
  H as default
};
