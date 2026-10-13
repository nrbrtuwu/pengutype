"use client";

import { useEffect, useRef, type RefObject } from "react";
import { createPortal } from "react-dom";
import { isModalOpen } from "./picker-modal";

// Drowsiness goes 0 (awake) to 1 (asleep): it creeps up on its own and every keystroke pushes it back down
const DROWSY_PER_SECOND = 0.09;
const AWAKE_PER_KEY = 0.035;
// At full drowsiness the lids leave a slit open; blinks close them completely
const MAX_DROWSY_CLOSURE = 0.82;
const MAX_BLUR_PX = 3;
const BLINK_EVERY_SECONDS = [3, 7];
const BLINK_SECONDS = 0.3;

const lidClass = "fixed left-[-10vw] w-[120vw] h-[55vh] z-[36] pointer-events-none bg-black will-change-transform";

/**
 * Sleepy fun mode: eyelids close over the screen and `blurTarget` blurs as you get drowsy.
 * Drowsiness only builds once you start typing.
 */
export function Sleepy({ blurTarget }: { blurTarget: RefObject<HTMLElement | null> }) {
  const topLidRef = useRef<HTMLDivElement>(null);
  const bottomLidRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let drowsiness = 0;
    let started = false;
    let nextBlinkAt = 0;
    let blinkStartedAt = -1;
    let last = performance.now();
    let animationId = 0;

    const scheduleBlink = (now: number) => {
      const [min, max] = BLINK_EVERY_SECONDS;
      nextBlinkAt = now + (min + Math.random() * (max - min)) * 1000;
    };

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key.length !== 1 || e.ctrlKey || e.metaKey || e.altKey || isModalOpen()) return;
      if (!started) {
        started = true;
        scheduleBlink(performance.now());
      }
      drowsiness = Math.max(0, drowsiness - AWAKE_PER_KEY);
    };

    const render = (now: number) => {
      const seconds = (now - last) / 1000;
      last = now;

      let closure = 0;
      if (started) {
        drowsiness = Math.min(1, drowsiness + DROWSY_PER_SECOND * seconds);
        closure = drowsiness * MAX_DROWSY_CLOSURE;

        if (blinkStartedAt < 0 && now >= nextBlinkAt) blinkStartedAt = now;
        if (blinkStartedAt >= 0) {
          // drowsy blinks are slower
          const blinkDuration = BLINK_SECONDS * (1 + drowsiness) * 1000;
          const progress = (now - blinkStartedAt) / blinkDuration;
          if (progress >= 1) {
            blinkStartedAt = -1;
            scheduleBlink(now);
          } else {
            closure = Math.max(closure, Math.sin(progress * Math.PI));
          }
        }
      }

      // each lid covers up to half the screen (plus a little overlap so a full blink is fully dark)
      const offset = (1 - closure) * 100;
      if (topLidRef.current) topLidRef.current.style.transform = `translateY(-${offset}%)`;
      if (bottomLidRef.current) bottomLidRef.current.style.transform = `translateY(${offset}%)`;
      if (blurTarget.current) blurTarget.current.style.filter = drowsiness > 0.05 ? `blur(${drowsiness * MAX_BLUR_PX}px)` : "";

      animationId = requestAnimationFrame(render);
    };

    window.addEventListener("keydown", onKeyDown);
    animationId = requestAnimationFrame(render);

    const target = blurTarget.current;
    return () => {
      cancelAnimationFrame(animationId);
      window.removeEventListener("keydown", onKeyDown);
      if (target) target.style.filter = "";
    };
  }, [blurTarget]);

  return createPortal(
    <>
      <div
        ref={topLidRef}
        aria-hidden
        className={`${lidClass} top-0 rounded-b-[50%] shadow-[0_0_60px_30px_black]`}
        style={{ transform: "translateY(-100%)" }}
      />
      <div
        ref={bottomLidRef}
        aria-hidden
        className={`${lidClass} bottom-0 rounded-t-[50%] shadow-[0_0_60px_30px_black]`}
        style={{ transform: "translateY(100%)" }}
      />
    </>,
    document.body
  );
}
