<script lang="ts">
    import { onDestroy, onMount } from 'svelte';

    let canvas: HTMLCanvasElement;
    let ctx: CanvasRenderingContext2D | null = null;
    let width = 0;
    let height = 0;
    let dpr = 1;
    let raf = 0;

    interface Flake {
        x: number;
        y: number;
        r: number;
        vx: number;
        vy: number;
        phase: number;
        opacity: number;
    }

    let flakes: Flake[] = [];

    function makeFlake(): Flake {
        const r = Math.random() * 2.2 + 0.8; // 0.8 - 3.0 px
        const speed = 0.4 + r * 0.35; // tie speed to size
        return {
            x: Math.random() * width,
            y: -10 - Math.random() * height,
            r,
            vx: (Math.random() - 0.5) * 0.4,
            vy: speed,
            phase: Math.random() * Math.PI * 2,
            opacity: 0.6 + Math.random() * 0.4
        };
    }

    function setCanvasSize() {
        width = window.innerWidth;
        height = window.innerHeight;
        canvas.width = Math.floor(width * dpr);
        canvas.height = Math.floor(height * dpr);
        canvas.style.width = width + 'px';
        canvas.style.height = height + 'px';
        ctx && ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    }

    function populateFlakes(target: number) {
        flakes.length = 0;
        for (let i = 0; i < target; i++) {
            const f = makeFlake();
            f.y = Math.random() * height;
            flakes.push(f);
        }
    }

    function draw() {
        if (!ctx) return;
        ctx.clearRect(0, 0, width, height);
        ctx.fillStyle = '#fff';
        for (const f of flakes) {
            f.phase += 0.01 + f.r * 0.002;
            f.x += f.vx + Math.sin(f.phase) * 0.3;
            f.y += f.vy;

            if (f.y - f.r > height) {
                f.x = Math.random() * width;
                f.y = -f.r - Math.random() * 40;
                f.vx = (Math.random() - 0.5) * 0.4;
                f.phase = Math.random() * Math.PI * 2;
            }

            ctx.globalAlpha = f.opacity;
            ctx.beginPath();
            ctx.arc(f.x, f.y, f.r, 0, Math.PI * 2);
            ctx.fill();
        }
        ctx.globalAlpha = 1;
    }

    function loop() {
        draw();
        raf = requestAnimationFrame(loop);
    }

    function handleResize() {
        setCanvasSize();
        const density = Math.min(220, Math.max(60, Math.floor((width * height) / 15000)));
        populateFlakes(density);
    }

    onMount(() => {
        if (typeof window === 'undefined') return;
        dpr = Math.min(2, window.devicePixelRatio || 1);
        ctx = canvas.getContext('2d');
        if (!ctx) return;
        setCanvasSize();
        handleResize();
        window.addEventListener('resize', handleResize, { passive: true });
        raf = requestAnimationFrame(loop);
        return () => {
            if (typeof cancelAnimationFrame === 'function') cancelAnimationFrame(raf);
            window.removeEventListener('resize', handleResize);
        };
    });

    onDestroy(() => {
        if (typeof cancelAnimationFrame === 'function') cancelAnimationFrame(raf);
        if (typeof window !== 'undefined') window.removeEventListener('resize', handleResize);
    });
</script>

<style>
    canvas {
        position: fixed;
        inset: 0;
        width: 100%;
        height: 100%;
        pointer-events: none;
        z-index: 0;
        filter: drop-shadow(0 0 2px rgba(255, 255, 255, 0.6));
    }
    @media (prefers-reduced-motion: reduce) {
        canvas { display: none; }
    }
</style>

<canvas bind:this={canvas} aria-hidden="true"></canvas>
