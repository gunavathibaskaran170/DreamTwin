"use client";

import { useEffect, useRef, useState } from "react";
import type { TwinAvatar } from "@/lib/types";

interface Robot3DProps {
  avatar: TwinAvatar;
  syncLevel?: number;
  state?: "idle" | "thinking" | "speaking";
  skin?: string;
}

const COLOR_MAP: Record<TwinAvatar, { primary: string; secondary: string; glow: string }> = {
  spark: { primary: "#a78bfa", secondary: "#7c3aed", glow: "rgba(139, 92, 246, 0.4)" },
  compass: { primary: "#22d3ee", secondary: "#0891b2", glow: "rgba(6, 182, 212, 0.4)" },
  star: { primary: "#fbbf24", secondary: "#d97706", glow: "rgba(245, 158, 11, 0.4)" },
  flame: { primary: "#f87171", secondary: "#dc2626", glow: "rgba(239, 68, 68, 0.4)" },
};

const SKIN_COLOR_MAP: Record<string, { primary: string; secondary: string; glow: string }> = {
  matrix: { primary: "#39ff14", secondary: "#00ff00", glow: "rgba(57, 255, 20, 0.4)" },
  vaporwave: { primary: "#ff007f", secondary: "#00f0ff", glow: "rgba(255, 0, 127, 0.4)" },
  solar: { primary: "#ff7700", secondary: "#ffdd00", glow: "rgba(255, 119, 0, 0.4)" },
};

export default function Robot3D({ avatar, syncLevel = 50, state = "idle", skin = "default" }: Robot3DProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [mouse, setMouse] = useState({ x: 0, y: 0 });

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!containerRef.current) return;
      const rect = containerRef.current.getBoundingClientRect();
      const cx = rect.left + rect.width / 2;
      const cy = rect.top + rect.height / 2;
      // Normalized coordinates (-1 to 1)
      const x = (e.clientX - cx) / (window.innerWidth / 2);
      const y = (e.clientY - cy) / (window.innerHeight / 2);
      setMouse({
        x: Math.min(1, Math.max(-1, x)),
        y: Math.min(1, Math.max(-1, y)),
      });
    };

    window.addEventListener("mousemove", handleMouseMove);
    return () => window.removeEventListener("mousemove", handleMouseMove);
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let animationId: number;
    let time = 0;
    let blinkTimer = 0;
    let isBlinking = false;

    // Define 3D vertices of a cybernetic robot head
    // Head shape: a structured hexagonal cylinder (12 vertices)
    const rawVertices = [
      // Top plate (hex)
      { x: -25, y: -30, z: -25 }, // 0
      { x: 0, y: -35, z: -35 },   // 1 (front center top)
      { x: 25, y: -30, z: -25 },  // 2
      { x: 25, y: -30, z: 25 },   // 3
      { x: 0, y: -30, z: 35 },    // 4
      { x: -25, y: -30, z: 25 },  // 5

      // Bottom chin/jaw plate (hex)
      { x: -20, y: 30, z: -20 },  // 6
      { x: 0, y: 38, z: -30 },    // 7 (front jaw tip)
      { x: 20, y: 30, z: -20 },   // 8
      { x: 20, y: 25, z: 20 },    // 9
      { x: 0, y: 25, z: 30 },     // 10
      { x: -20, y: 25, z: 20 },   // 11

      // Visor/eyes vertices
      { x: -18, y: -8, z: -30 },  // 12 (top-left)
      { x: 18, y: -8, z: -30 },   // 13 (top-right)
      { x: 18, y: 8, z: -30 },    // 14 (bottom-right)
      { x: -18, y: 8, z: -30 },   // 15 (bottom-left)

      // Antennas
      { x: -25, y: -30, z: 0 },   // 16 Left antenna base
      { x: -35, y: -55, z: 0 },   // 17 Left antenna tip
      { x: 25, y: -30, z: 0 },    // 18 Right antenna base
      { x: 35, y: -55, z: 0 },    // 19 Right antenna tip
    ];

    // Connectivity lines (edges) between vertices
    const edges = [
      // Top plate perimeter
      [0, 1], [1, 2], [2, 3], [3, 4], [4, 5], [5, 0],
      // Bottom plate perimeter
      [6, 7], [7, 8], [8, 9], [9, 10], [10, 11], [11, 6],
      // Vertical pillars joining plates
      [0, 6], [1, 7], [2, 8], [3, 9], [4, 10], [5, 11],
      // Antenna lines
      [16, 17], [18, 19],
    ];

    const colors = skin && SKIN_COLOR_MAP[skin] ? SKIN_COLOR_MAP[skin] : (COLOR_MAP[avatar] || COLOR_MAP.spark);

    // Standard 3D Rotation Formulas
    const rotateX = (x: number, y: number, z: number, angle: number) => {
      const cos = Math.cos(angle);
      const sin = Math.sin(angle);
      return { x, y: y * cos - z * sin, z: y * sin + z * cos };
    };

    const rotateY = (x: number, y: number, z: number, angle: number) => {
      const cos = Math.cos(angle);
      const sin = Math.sin(angle);
      return { x: x * cos + z * sin, y, z: -x * sin + z * cos };
    };

    const rotateZ = (x: number, y: number, z: number, angle: number) => {
      const cos = Math.cos(angle);
      const sin = Math.sin(angle);
      return { x: x * cos - y * sin, y: x * sin + y * cos, z };
    };

    const resize = () => {
      const rect = containerRef.current?.getBoundingClientRect();
      canvas.width = (rect?.width ?? 200) * window.devicePixelRatio;
      canvas.height = (rect?.height ?? 200) * window.devicePixelRatio;
      canvas.style.width = "100%";
      canvas.style.height = "100%";
    };

    resize();
    window.addEventListener("resize", resize);

    const render = () => {
      time += 0.035;
      blinkTimer += 1;

      // Handle eye blink timers
      if (blinkTimer > 180) {
        isBlinking = true;
        if (blinkTimer > 186) {
          isBlinking = false;
          blinkTimer = 0;
        }
      }

      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.save();
      ctx.scale(window.devicePixelRatio, window.devicePixelRatio);

      const cx = canvas.width / (2 * window.devicePixelRatio);
      const cy = canvas.height / (2 * window.devicePixelRatio);

      // Target rotation sways dynamically with time (hover breathing) and mouse movements
      const targetAngleY = mouse.x * 0.45 + Math.sin(time * 0.4) * 0.05;
      const targetAngleX = -mouse.y * 0.35 + Math.cos(time * 0.35) * 0.05;

      const focalLength = 300;

      // Draw futuristic background grid scan lines in the canvas for cyber portals
      ctx.strokeStyle = "rgba(255, 255, 255, 0.02)";
      ctx.lineWidth = 1;
      const gridSpacing = 20;
      for (let x = 0; x < canvas.width; x += gridSpacing) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, canvas.height);
        ctx.stroke();
      }
      for (let y = 0; y < canvas.height; y += gridSpacing) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(canvas.width, y);
        ctx.stroke();
      }

      // 1. Draw Sync holographic particle rings revolving around the robot
      const drawSyncRings = () => {
        const ringCount = 2;
        ctx.lineWidth = 1;
        for (let r = 0; r < ringCount; r++) {
          const ringRad = 65 + r * 15;
          const ringYOffset = (r === 0 ? -8 : 12) + Math.sin(time + r) * 3;
          const ringAngle = time * 0.25 * (r === 0 ? 1 : -1);

          ctx.beginPath();
          for (let deg = 0; deg <= 360; deg += 6) {
            const rad = (deg * Math.PI) / 180;
            // Dotted circle points in 3D
            const localX = Math.cos(rad) * ringRad;
            const localZ = Math.sin(rad) * ringRad;

            // Apply rotations
            let rot = rotateY(localX, ringYOffset, localZ, ringAngle);
            rot = rotateX(rot.x, rot.y, rot.z, targetAngleX);
            rot = rotateY(rot.x, rot.y, rot.z, targetAngleY);

            // Perspective project
            const scale = focalLength / (focalLength + rot.z);
            const px = cx + rot.x * scale;
            const py = cy + rot.y * scale;

            if (deg === 0) ctx.moveTo(px, py);
            else ctx.lineTo(px, py);
          }
          ctx.strokeStyle = `rgba(${parseInt(colors.primary.slice(1, 3), 16) || 167}, ${
            parseInt(colors.primary.slice(3, 5), 16) || 139
          }, ${parseInt(colors.primary.slice(5, 7), 16) || 250}, ${0.1 + (syncLevel / 100) * 0.25})`;
          ctx.stroke();
        }
      };

      drawSyncRings();

      // 2. Project all 3D vertices to 2D coordinates
      const projected = rawVertices.map((v) => {
        // Apply Y float (floating vertical movement)
        const floatY = v.y + Math.sin(time * 1.2) * 2;

        let r = { x: v.x, y: floatY, z: v.z };
        // Apply mouse rotations
        r = rotateX(r.x, r.y, r.z, targetAngleX);
        r = rotateY(r.x, r.y, r.z, targetAngleY);

        // Perspective Projection scale
        const scale = focalLength / (focalLength + r.z);
        return {
          x: cx + r.x * scale,
          y: cy + r.y * scale,
          z: r.z,
          scale,
        };
      });

      // 3. Draw structural skull grid edges (neon wireframe)
      ctx.strokeStyle = colors.primary;
      ctx.shadowBlur = 12;
      ctx.shadowColor = colors.primary;
      ctx.lineWidth = 1.5;

      edges.forEach(([p1, p2]) => {
        const v1 = projected[p1];
        const v2 = projected[p2];
        if (!v1 || !v2) return;

        // Fade opacity slightly for back lines (Z index depth simulation)
        const avgZ = (v1.z + v2.z) / 2;
        const opacity = Math.max(0.2, Math.min(1, (150 - avgZ) / 180));

        ctx.strokeStyle = colors.primary + Math.round(opacity * 255).toString(16).padStart(2, "0");
        ctx.beginPath();
        ctx.moveTo(v1.x, v1.y);
        ctx.lineTo(v2.x, v2.y);
        ctx.stroke();
      });

      // 4. Draw glowing visors (eyes)
      const vLeftTop = projected[12];
      const vRightTop = projected[13];
      const vRightBottom = projected[14];
      const vLeftBottom = projected[15];

      if (vLeftTop && vRightTop && vRightBottom && vLeftBottom) {
        ctx.beginPath();
        ctx.moveTo(vLeftTop.x, vLeftTop.y);
        ctx.lineTo(vRightTop.x, vRightTop.y);
        ctx.lineTo(vRightBottom.x, vRightBottom.y);
        ctx.lineTo(vLeftBottom.x, vLeftBottom.y);
        ctx.closePath();

        // Fill background of visor
        ctx.fillStyle = "rgba(15, 10, 26, 0.75)";
        ctx.fill();
        ctx.lineWidth = 2;
        ctx.strokeStyle = colors.primary;
        ctx.stroke();

        // Visor glow content
        ctx.save();
        // Clip visor area
        ctx.beginPath();
        ctx.moveTo(vLeftTop.x, vLeftTop.y);
        ctx.lineTo(vRightTop.x, vRightTop.y);
        ctx.lineTo(vRightBottom.x, vRightBottom.y);
        ctx.lineTo(vLeftBottom.x, vLeftBottom.y);
        ctx.closePath();
        ctx.clip();

        // Draw Visor HUD elements based on states
        if (state === "thinking") {
          // Animated horizontal scanning laser bar
          const scanY = vLeftTop.y + ((Math.sin(time * 3) + 1) / 2) * (vLeftBottom.y - vLeftTop.y);
          ctx.strokeStyle = "#ffffff";
          ctx.shadowColor = "#ffffff";
          ctx.shadowBlur = 15;
          ctx.beginPath();
          ctx.moveTo(vLeftTop.x - 5, scanY);
          ctx.lineTo(vRightTop.x + 5, scanY);
          ctx.stroke();
        } else if (state === "speaking") {
          // Draw pulsing audio visualizer waves
          ctx.strokeStyle = colors.primary;
          ctx.shadowColor = colors.primary;
          ctx.shadowBlur = 8;
          ctx.lineWidth = 1.5;
          ctx.beginPath();

          const barCount = 6;
          const visorWidth = vRightTop.x - vLeftTop.x;
          const startX = vLeftTop.x + visorWidth * 0.15;
          const stepX = (visorWidth * 0.7) / barCount;
          const midY = (vLeftTop.y + vLeftBottom.y) / 2;

          for (let i = 0; i <= barCount; i++) {
            const h = Math.abs(Math.sin(time * 4.5 + i)) * (vLeftBottom.y - vLeftTop.y) * 0.4;
            const x = startX + i * stepX;
            ctx.moveTo(x, midY - h);
            ctx.lineTo(x, midY + h);
          }
          ctx.stroke();
        } else {
          // Idle state - two clean cybernetic eye lines
          if (!isBlinking) {
            ctx.fillStyle = colors.primary;
            ctx.shadowBlur = 10;
            ctx.shadowColor = colors.primary;

            // Draw left eye dot/dash
            const eyeW = (vRightTop.x - vLeftTop.x) * 0.22;
            const eyeH = 2.5;
            const eyeY = (vLeftTop.y + vLeftBottom.y) / 2 - eyeH / 2;

            ctx.fillRect(vLeftTop.x + eyeW * 0.7, eyeY, eyeW, eyeH);
            ctx.fillRect(vRightTop.x - eyeW * 1.7, eyeY, eyeW, eyeH);
          }
        }
        ctx.restore();
      }

      // 5. Draw interactive node points
      projected.forEach((v, index) => {
        if (index > 15) return; // Skip antenna tips
        const pulseSize = index < 12 ? 2.5 : 1.5; // Visor dots vs head vertices
        ctx.beginPath();
        ctx.arc(v.x, v.y, pulseSize * v.scale, 0, 2 * Math.PI);
        ctx.fillStyle = colors.primary;
        ctx.fill();
      });

      // Draw top antenna bulbs
      const antLeft = projected[17];
      const antRight = projected[19];
      ctx.fillStyle = "#ffffff";
      ctx.shadowColor = "#ffffff";
      ctx.shadowBlur = 20;

      if (antLeft) {
        ctx.beginPath();
        ctx.arc(antLeft.x, antLeft.y, 4 * antLeft.scale, 0, 2 * Math.PI);
        ctx.fill();
      }
      if (antRight) {
        ctx.beginPath();
        ctx.arc(antRight.x, antRight.y, 4 * antRight.scale, 0, 2 * Math.PI);
        ctx.fill();
      }

      ctx.restore();
      animationId = requestAnimationFrame(render);
    };

    render();

    return () => {
      cancelAnimationFrame(animationId);
      window.removeEventListener("resize", resize);
    };
  }, [avatar, mouse, syncLevel, state, skin]);

  return (
    <div
      ref={containerRef}
      className="w-full h-full min-h-[180px] max-h-[300px] flex items-center justify-center relative select-none"
    >
      <canvas ref={canvasRef} className="block w-full h-full" />
    </div>
  );
}
