---
description: Ensure 3D WebGL, GLSL Shaders, GSAP transitions, and micro-interactions remain vivid and unmistakable on Mobile touch devices while maintaining 60 FPS.
---

# Mobile-First 3D & Touch Choreography Invariants

1. **Autonomous Idle 3D Motion + Touch Drag**:
   - Never leave 3D card tilt, foil glare, or GLSL `uMouse` uniforms at `(0, 0)` when no mouse is hovering.
   - Always include an autonomous harmonic figure-8 / orbital sway (`Math.sin(elapsed)` / `Math.cos(elapsed)`) when not actively touched, AND bind `onTouchMove` so dragging a finger tilts 3D cards and deforms GLSL shaders in real time.

2. **Unoccluded 3D Stage Framing on Narrow Viewports (`< 640px`)**:
   - Never hide 3D PBR Totems or GLSL Sacred Rings directly behind an opaque card on mobile.
   - Reserve a dedicated visible 3D Altar Pedestal header/halo zone above the card on mobile (`pt-16` / `pt-20`), and use translucent glass framing (`bg-[#09080D]/68`) so the rotating 3D Totem and glowing GLSL Mandala rings remain 100% visible.

3. **Mobile Touch Burst & Trail (Coarse Pointer Feedback)**:
   - On `pointer: coarse` or touch events (`touchstart`, `touchmove`), `CustomCursorFollower` must render a zero-rerender pooled Touch Ripple & Golden Sparkle Trail instead of only listening to `mousemove`.

4. **Native Touch Scroll Bridge for 3D Scrollytelling**:
   - Always pair `lenis.on('scroll')` with a passive `window.addEventListener('scroll')` fallback that computes normalized scroll progress and velocity from `window.scrollY`, ensuring 3D camera & fan animations react dramatically to mobile finger scrolling.

5. **3D Kinetic Swipe Transitions**:
   - When switching slides/readers on mobile (`ReaderIntroModal`, `ReaderProfileView`), use GSAP 3D perspective transitions (`rotateY`, `scale`, `y`) so card switches feel tangibly 3D on small screens.
