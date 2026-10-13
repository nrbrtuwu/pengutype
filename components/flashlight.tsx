"use client";

import { useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { useTypingStore } from "@/lib/store";
import { themes } from "@/lib/themes";

const START_RADIUS = 340; // css px
const MIN_RADIUS = 70;
const SHRINK_PER_WORD = 0.93;
// The light is a soft gradient, so it can render at a fraction of CSS resolution and be upscaled for free
const RENDER_SCALE = 0.5;
// Read-ahead glow on the next word: extra room around it (css px) and how bright it gets (0..1)
const NEXT_WORD_PADDING = 18;
const NEXT_WORD_STRENGTH = 0.25;

const VERTEX_SHADER = `
attribute vec2 a_position;
void main() {
  gl_Position = vec4(a_position, 0.0, 1.0);
}`;

// Darkness everywhere except a soft, slightly flickering, beam-shaped light around the caret
const FRAGMENT_SHADER = `
precision mediump float;

uniform vec2 u_center;   // caret position in canvas pixels, origin bottom-left
uniform float u_radius;  // light radius in canvas pixels
uniform vec3 u_dark;     // darkness color
uniform float u_time;
uniform vec2 u_next;     // center of the next word, canvas pixels
uniform vec2 u_nextSize; // half width/height of the glow around the next word
uniform float u_nextStrength;

float hash(vec2 p) {
  return fract(sin(dot(p, vec2(12.9898, 78.233))) * 43758.5453);
}

void main() {
  float flicker = 1.0
    + 0.025 * sin(u_time * 11.0)
    + 0.015 * sin(u_time * 23.7 + 1.3)
    + 0.02 * (hash(vec2(floor(u_time * 18.0))) - 0.5);
  float radius = u_radius * flicker;

  vec2 offset = gl_FragCoord.xy - u_center;
  offset.y *= 1.25; // wider than tall, like a beam on a page of text
  float dist = length(offset);

  float light = 1.0 - smoothstep(radius * 0.4, radius, dist);

  // smaller, dimmer glow on the next word so you can read ahead (also across line breaks)
  float nextDist = length((gl_FragCoord.xy - u_next) / max(u_nextSize, vec2(1.0)));
  light = max(light, (1.0 - smoothstep(0.55, 1.0, nextDist)) * u_nextStrength);
  // faint bright rim at the edge of the beam
  float rim = smoothstep(radius * 0.85, radius, dist) * (1.0 - smoothstep(radius, radius * 1.2, dist)) * 0.07;
  float grain = (hash(gl_FragCoord.xy + fract(u_time)) - 0.5) * 0.04;

  float alpha = clamp(1.0 - light - rim + grain, 0.0, 0.98);
  gl_FragColor = vec4(u_dark * alpha, alpha);
}`;

/** Light radius after `correctWords` correct words: shrinks geometrically down to a minimum. */
export function flashlightRadius(correctWords: number) {
  return Math.max(MIN_RADIUS, START_RADIUS * SHRINK_PER_WORD ** correctWords);
}

function compileProgram(gl: WebGLRenderingContext) {
  const compile = (type: number, source: string) => {
    const shader = gl.createShader(type)!;
    gl.shaderSource(shader, source);
    gl.compileShader(shader);
    return shader;
  };

  const program = gl.createProgram()!;
  gl.attachShader(program, compile(gl.VERTEX_SHADER, VERTEX_SHADER));
  gl.attachShader(program, compile(gl.FRAGMENT_SHADER, FRAGMENT_SHADER));
  gl.linkProgram(program);
  return gl.getProgramParameter(program, gl.LINK_STATUS) ? program : null;
}

/** Theme background, darkened, as 0..1 RGB. */
function darkColor(hex: string): [number, number, number] {
  return [1, 3, 5].map((i) => (parseInt(hex.slice(i, i + 2), 16) / 255) * 0.55) as [number, number, number];
}

/** osu!-style flashlight: a WebGL overlay above the whole page that follows the caret (the element marked `data-caret`). */
export function Flashlight({ correctWords }: { correctWords: number }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const targetRadiusRef = useRef(flashlightRadius(correctWords));
  targetRadiusRef.current = flashlightRadius(correctWords);
  const darkRef = useRef<[number, number, number]>([0, 0, 0]);
  darkRef.current = darkColor(themes[useTypingStore((state) => state.theme)].bg);

  useEffect(() => {
    const canvas = canvasRef.current;
    const gl = canvas?.getContext("webgl", {
      alpha: true,
      premultipliedAlpha: true,
      antialias: false,
      depth: false,
      stencil: false,
      powerPreference: "low-power",
    });
    if (!canvas || !gl) return;

    const program = compileProgram(gl);
    if (!program) return;
    gl.useProgram(program);

    // One triangle pair covering the whole screen
    gl.bindBuffer(gl.ARRAY_BUFFER, gl.createBuffer());
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, -1, 1, 1, -1, 1, 1]), gl.STATIC_DRAW);
    const position = gl.getAttribLocation(program, "a_position");
    gl.enableVertexAttribArray(position);
    gl.vertexAttribPointer(position, 2, gl.FLOAT, false, 0, 0);

    const uniforms = {
      center: gl.getUniformLocation(program, "u_center"),
      radius: gl.getUniformLocation(program, "u_radius"),
      dark: gl.getUniformLocation(program, "u_dark"),
      time: gl.getUniformLocation(program, "u_time"),
      next: gl.getUniformLocation(program, "u_next"),
      nextSize: gl.getUniformLocation(program, "u_nextSize"),
      nextStrength: gl.getUniformLocation(program, "u_nextStrength"),
    };

    const resize = () => {
      canvas.width = Math.ceil(window.innerWidth * RENDER_SCALE);
      canvas.height = Math.ceil(window.innerHeight * RENDER_SCALE);
      gl.viewport(0, 0, canvas.width, canvas.height);
    };
    resize();
    window.addEventListener("resize", resize);

    let radius = targetRadiusRef.current;
    let center = { x: window.innerWidth / 2, y: window.innerHeight / 2 };
    let next = { x: center.x, y: center.y, halfWidth: 0, halfHeight: 0, strength: 0 };
    const ease = (from: number, to: number, amount: number) => from + (to - from) * amount;
    let animationId = 0;
    const startedAt = performance.now();

    const render = () => {
      const caret = document.querySelector("[data-caret]")?.getBoundingClientRect();
      if (caret) center = { x: caret.left + caret.width / 2, y: caret.top + caret.height / 2 };
      // ease toward the target so the light visibly closes in after each word
      radius += (targetRadiusRef.current - radius) * 0.08;

      const nextWord = document.querySelector("[data-next-word]")?.getBoundingClientRect();
      if (nextWord) {
        // glide to the next word instead of jumping, and pad the glow around it
        next = {
          x: ease(next.x, nextWord.left + nextWord.width / 2, 0.25),
          y: ease(next.y, nextWord.top + nextWord.height / 2, 0.25),
          halfWidth: ease(next.halfWidth, nextWord.width / 2 + NEXT_WORD_PADDING, 0.25),
          halfHeight: ease(next.halfHeight, nextWord.height / 2 + NEXT_WORD_PADDING, 0.25),
          strength: ease(next.strength, NEXT_WORD_STRENGTH, 0.15),
        };
      } else {
        next.strength = ease(next.strength, 0, 0.15);
      }

      gl.clearColor(0, 0, 0, 0);
      gl.clear(gl.COLOR_BUFFER_BIT);
      gl.uniform2f(uniforms.center, center.x * RENDER_SCALE, (window.innerHeight - center.y) * RENDER_SCALE);
      gl.uniform1f(uniforms.radius, radius * RENDER_SCALE);
      gl.uniform3f(uniforms.dark, ...darkRef.current);
      gl.uniform1f(uniforms.time, (performance.now() - startedAt) / 1000);
      gl.uniform2f(uniforms.next, next.x * RENDER_SCALE, (window.innerHeight - next.y) * RENDER_SCALE);
      gl.uniform2f(uniforms.nextSize, next.halfWidth * RENDER_SCALE, next.halfHeight * RENDER_SCALE);
      gl.uniform1f(uniforms.nextStrength, next.strength);
      gl.drawArrays(gl.TRIANGLES, 0, 6);

      animationId = requestAnimationFrame(render);
    };
    animationId = requestAnimationFrame(render);

    return () => {
      cancelAnimationFrame(animationId);
      window.removeEventListener("resize", resize);
    };
  }, []);

  // Portaled to <body> so it sits above the header and footer too (popups stay above it)
  return createPortal(
    <canvas ref={canvasRef} aria-hidden className="fixed inset-0 z-[35] w-screen h-screen pointer-events-none" />,
    document.body
  );
}
