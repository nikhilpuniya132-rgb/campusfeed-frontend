import React, { useEffect, useRef } from 'react';

export default function ThreeDBackground() {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    let animationFrameId;

    let width = (canvas.width = window.innerWidth);
    let height = (canvas.height = window.innerHeight);

    const handleResize = () => {
      if (!canvas) return;
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
    };

    window.addEventListener('resize', handleResize);

    // Mouse / Touch 3D tracking
    const mouse = {
      x: width / 2,
      y: height / 2,
      targetX: width / 2,
      targetY: height / 2,
      isInteracting: false,
    };

    const handleMouseMove = (e) => {
      mouse.targetX = e.clientX;
      mouse.targetY = e.clientY;
      mouse.isInteracting = true;
    };

    const handleTouchMove = (e) => {
      if (e.touches.length > 0) {
        mouse.targetX = e.touches[0].clientX;
        mouse.targetY = e.touches[0].clientY;
        mouse.isInteracting = true;
      }
    };

    window.addEventListener('mousemove', handleMouseMove, { passive: true });
    window.addEventListener('touchmove', handleTouchMove, { passive: true });

    // Interactive Shockwave clicks
    const shockwaves = [];
    const handleClick = (e) => {
      const clientX = e.clientX || (e.touches && e.touches[0]?.clientX) || width / 2;
      const clientY = e.clientY || (e.touches && e.touches[0]?.clientY) || height / 2;
      shockwaves.push({
        x: clientX,
        y: clientY,
        radius: 5,
        maxRadius: Math.min(width, height) * 0.35,
        opacity: 0.8,
        color: Math.random() > 0.5 ? '#ff6200' : '#ff2e93',
      });
    };

    window.addEventListener('pointerdown', handleClick, { passive: true });

    // 3D Particles / Flame Embers
    const particleCount = Math.min(70, Math.floor(width / 20));
    const particles = [];
    const colors = [
      '#ff6200', // Gas Electric Orange
      '#ff8800', // Hot Amber
      '#ff2e93', // Flame Pink
      '#fbbf24', // God Mode Gold
      '#00f0ff', // Electric Cyan
    ];

    for (let i = 0; i < particleCount; i++) {
      particles.push({
        x: Math.random() * width,
        y: Math.random() * height,
        z: Math.random() * 800 + 200, // 3D depth
        size: Math.random() * 3 + 1.5,
        baseAlpha: Math.random() * 0.6 + 0.2,
        color: colors[Math.floor(Math.random() * colors.length)],
        vx: (Math.random() - 0.5) * 0.8,
        vy: -(Math.random() * 1.5 + 0.6), // Floats upward like embers
        swaySpeed: Math.random() * 0.03 + 0.01,
        swayOffset: Math.random() * Math.PI * 2,
      });
    }

    // 3D Glowing Ambient Orbs
    const orbs = [
      { x: width * 0.2, y: height * 0.3, radius: 280, color: 'rgba(255, 98, 0, 0.12)', vx: 0.3, vy: 0.2 },
      { x: width * 0.8, y: height * 0.7, radius: 320, color: 'rgba(255, 46, 147, 0.10)', vx: -0.25, vy: -0.2 },
      { x: width * 0.5, y: height * 0.5, radius: 240, color: 'rgba(251, 191, 36, 0.08)', vx: 0.15, vy: -0.25 },
    ];

    let tick = 0;

    const render = () => {
      tick++;

      // Smooth mouse interpolation (inertia)
      mouse.x += (mouse.targetX - mouse.x) * 0.05;
      mouse.y += (mouse.targetY - mouse.y) * 0.05;

      ctx.clearRect(0, 0, width, height);

      // 1. Draw glowing ambient 3D gradient orbs
      for (const orb of orbs) {
        orb.x += orb.vx;
        orb.y += orb.vy;
        if (orb.x < -orb.radius) orb.x = width + orb.radius;
        if (orb.x > width + orb.radius) orb.x = -orb.radius;
        if (orb.y < -orb.radius) orb.y = height + orb.radius;
        if (orb.y > height + orb.radius) orb.y = -orb.radius;

        // Mouse parallax shift
        const parallaxX = (mouse.x - width / 2) * 0.08;
        const parallaxY = (mouse.y - height / 2) * 0.08;

        const grad = ctx.createRadialGradient(
          orb.x + parallaxX,
          orb.y + parallaxY,
          0,
          orb.x + parallaxX,
          orb.y + parallaxY,
          orb.radius
        );
        grad.addColorStop(0, orb.color);
        grad.addColorStop(1, 'transparent');
        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.arc(orb.x + parallaxX, orb.y + parallaxY, orb.radius, 0, Math.PI * 2);
        ctx.fill();
      }

      // 2. Draw shockwaves
      for (let i = shockwaves.length - 1; i >= 0; i--) {
        const sw = shockwaves[i];
        sw.radius += 4;
        sw.opacity *= 0.94;
        if (sw.opacity < 0.01 || sw.radius > sw.maxRadius) {
          shockwaves.splice(i, 1);
          continue;
        }
        ctx.save();
        ctx.beginPath();
        ctx.arc(sw.x, sw.y, sw.radius, 0, Math.PI * 2);
        ctx.strokeStyle = sw.color;
        ctx.globalAlpha = sw.opacity;
        ctx.lineWidth = 2.5;
        ctx.shadowBlur = 15;
        ctx.shadowColor = sw.color;
        ctx.stroke();
        ctx.restore();
      }

      // 3. Draw 3D Embers & Particles
      const fov = 400; // 3D field of view
      const centerX = width / 2;
      const centerY = height / 2;

      for (const p of particles) {
        // Upward drift + horizontal sway
        p.y += p.vy;
        p.x += p.vx + Math.sin(tick * p.swaySpeed + p.swayOffset) * 0.8;

        // React to mouse proximity (subtle 3D magnetic push)
        const dx = p.x - mouse.x;
        const dy = p.y - mouse.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < 120 && mouse.isInteracting) {
          const force = (120 - dist) / 120;
          p.x += (dx / dist) * force * 3;
          p.y += (dy / dist) * force * 3;
        }

        // Reset if drifted off screen
        if (p.y < -50) {
          p.y = height + 30;
          p.x = Math.random() * width;
        }
        if (p.x < -50) p.x = width + 30;
        if (p.x > width + 50) p.x = -30;

        // 3D Perspective Projection
        const scale = fov / (fov + p.z);
        const mouseParallaxX = (mouse.x - centerX) * (1 - scale) * 0.3;
        const mouseParallaxY = (mouse.y - centerY) * (1 - scale) * 0.3;

        const projX = p.x + mouseParallaxX;
        const projY = p.y + mouseParallaxY;
        const projSize = Math.max(1, p.size * scale * 1.5);

        // Alpha pulses slightly
        const alpha = p.baseAlpha * (0.8 + 0.2 * Math.sin(tick * 0.05 + p.swayOffset));

        ctx.save();
        ctx.globalAlpha = alpha;
        ctx.fillStyle = p.color;
        ctx.shadowBlur = 10 * scale;
        ctx.shadowColor = p.color;

        ctx.beginPath();
        ctx.arc(projX, projY, projSize, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      }

      animationFrameId = requestAnimationFrame(render);
    };

    render();

    return () => {
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('touchmove', handleTouchMove);
      window.removeEventListener('pointerdown', handleClick);
      cancelAnimationFrame(animationFrameId);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        pointerEvents: 'none',
        zIndex: 0,
      }}
    />
  );
}
