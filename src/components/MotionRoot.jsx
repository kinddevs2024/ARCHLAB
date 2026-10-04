import { useEffect, useRef } from "react";
import { animate, createScope, stagger } from "animejs";

const entrance =
  '.workspace-content, .login-form, .global-search-results, [data-ui="select-menu"], [data-ui="feedback"], .message, .dashboard-cards > *, .settings-grid > *, .empty-state, .workspace-table tbody, .analytics-kpis > *, .analytics-overview > *, .analytics-feed > li';

export function MotionRoot({ children }) {
  const root = useRef(null);
  useEffect(() => {
    const reduced = matchMedia("(prefers-reduced-motion: reduce)");
    const hover = matchMedia("(hover: hover)");
    const seen = new WeakSet(),
      running = new Map(),
      scopes = new Set();
    // Short-lived scopes also cover portals, without retaining completed animations.
    const dispose = (scope) => {
      scopes.delete(scope);
      scope.revert();
    };
    const motion = (targets, parameters, retain = false, complete) => {
      const scope = createScope({ root: document.body });
      scopes.add(scope);
      scope.add(() =>
        animate(targets, {
          ...parameters,
          onComplete: () => {
            complete?.();
            if (!retain) dispose(scope);
          },
        }),
      );
      return scope;
    };
    let frame = 0;
    const pending = new Set();
    const reveal = (nodes) => {
      if (reduced.matches) return;
      const fresh = [...nodes]
        .filter(
          (node) =>
            node.isConnected && !seen.has(node) && node.getClientRects().length,
        )
        .slice(0, 18);
      fresh.forEach((node) => seen.add(node));
      if (fresh.length)
        motion(fresh, {
          opacity: [0, 1],
          y: [6, 0],
          duration: 220,
          delay: stagger(18),
          ease: "out(3)",
        });
    };
    const collect = (node) => {
      if (node.nodeType !== 1) return;
      if (node.matches(entrance)) pending.add(node);
      node.querySelectorAll(entrance).forEach((item) => pending.add(item));
      if (!frame)
        frame = requestAnimationFrame(() => {
          frame = 0;
          reveal(pending);
          pending.clear();
        });
    };
    collect(root.current);
    const observer = new MutationObserver((records) => {
      records.forEach((record) => record.addedNodes.forEach(collect));
      for (const [target, scope] of running)
        if (!target.isConnected) {
          dispose(scope);
          running.delete(target);
        }
    });
    observer.observe(document.body, { childList: true, subtree: true });
    const interact = (event) => {
      const target = event.target.closest(
        '[data-ui="button"], [data-ui="action"], [data-ui="icon-button"]',
      );
      if (
        !target ||
        target.disabled ||
        reduced.matches ||
        target.closest(".mobile-overlay")
      )
        return;
      if (
        event.type === "pointerover" &&
        (!hover.matches || target.contains(event.relatedTarget))
      )
        return;
      if (event.type === "pointerout" && target.contains(event.relatedTarget))
        return;
      const pressed = event.type === "pointerdown";
      const leave = ["pointerout", "pointerup", "pointercancel"].includes(
        event.type,
      );
      const matrix = new DOMMatrixReadOnly(getComputedStyle(target).transform);
      const start = Math.hypot(matrix.a, matrix.b);
      const previous = running.get(target);
      if (previous) dispose(previous);
      const scope = motion(
        target,
        {
          scale: [start, pressed ? 0.975 : leave ? 1 : 1.015],
          duration: pressed ? 90 : 140,
          ease: "out(3)",
        },
        !leave,
        () => {
          if (leave) running.delete(target);
        },
      );
      running.set(target, scope);
    };
    const events = [
      "pointerover",
      "pointerout",
      "pointerdown",
      "pointerup",
      "pointercancel",
    ];
    events.forEach((event) => document.addEventListener(event, interact));
    const theme = () => {
      const content = root.current.querySelector(".workspace-content");
      if (!reduced.matches && content)
        motion(content, { opacity: [0.88, 1], duration: 160, ease: "out(2)" });
    };
    const stopMotion = () => {
      [...scopes].forEach(dispose);
      running.clear();
    };
    const changed = () => {
      if (reduced.matches) stopMotion();
    };
    window.addEventListener("archlab:theme", theme);
    reduced.addEventListener("change", changed);
    return () => {
      observer.disconnect();
      cancelAnimationFrame(frame);
      pending.clear();
      events.forEach((event) => document.removeEventListener(event, interact));
      window.removeEventListener("archlab:theme", theme);
      reduced.removeEventListener("change", changed);
      stopMotion();
    };
  }, []);
  return (
    <div ref={root} className="app-motion-root">
      {children}
    </div>
  );
}
