import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';

export type BackgroundTheme = 'default' | 'life' | 'physical' | 'space' | 'lab' | 'celebration';

interface ThreeBackgroundProps {
  theme?: BackgroundTheme;
}

export const ThreeBackground: React.FC<ThreeBackgroundProps> = ({ theme = 'default' }) => {
  const mountRef = useRef<HTMLDivElement>(null);
  const themeRef = useRef<BackgroundTheme>(theme);
  themeRef.current = theme;

  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    // Detect software GL
    const isSoftwareGl = (() => {
      try {
        const gl = document.createElement('canvas').getContext('webgl2');
        if (!gl) return true;
        const ext = gl.getExtension('WEBGL_debug_renderer_info');
        const param = ext ? ext.UNMASKED_RENDERER_WEBGL : gl.RENDERER;
        const gpu = String(gl.getParameter(param));
        gl.getExtension('WEBGL_lose_context')?.loseContext();
        return /SwiftShader|llvmpipe|softpipe|Software|Basic Render/i.test(gpu);
      } catch {
        return false;
      }
    })();

    // Scene setup
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(
      60,
      window.innerWidth / window.innerHeight,
      0.1,
      1000
    );
    camera.position.z = 25;

    const renderer = new THREE.WebGLRenderer({
      alpha: true,
      antialias: !isSoftwareGl,
      powerPreference: 'high-performance',
    });
    renderer.setPixelRatio(isSoftwareGl ? 1 : Math.min(window.devicePixelRatio, 1.5));
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    container.appendChild(renderer.domElement);

    // Ambient & Directional Lights
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.7);
    scene.add(ambientLight);

    const dirLight1 = new THREE.DirectionalLight(0x10b981, 1.5);
    dirLight1.position.set(20, 20, 20);
    scene.add(dirLight1);

    const dirLight2 = new THREE.DirectionalLight(0x06b6d4, 1.2);
    dirLight2.position.set(-20, -10, 15);
    scene.add(dirLight2);

    const dirLight3 = new THREE.DirectionalLight(0xf59e0b, 0.8);
    dirLight3.position.set(0, -20, 10);
    scene.add(dirLight3);

    // Root Group for animations
    const mainGroup = new THREE.Group();
    scene.add(mainGroup);

    // 1. Central 3D Science Atom (Nucleus + 3 Electron Orbit Rings + Electrons)
    const atomGroup = new THREE.Group();
    mainGroup.add(atomGroup);
    atomGroup.position.set(-14, 6, -5);

    // Nucleus: Cluster of spheres
    const nucleusGroup = new THREE.Group();
    const nucleusMat1 = new THREE.MeshStandardMaterial({
      color: 0x10b981,
      roughness: 0.25,
      metalness: 0.3,
    });
    const nucleusMat2 = new THREE.MeshStandardMaterial({
      color: 0xf59e0b,
      roughness: 0.25,
      metalness: 0.3,
    });
    const protonGeo = new THREE.SphereGeometry(1.0, 16, 16);

    for (let i = 0; i < 7; i++) {
      const proton = new THREE.Mesh(protonGeo, i % 2 === 0 ? nucleusMat1 : nucleusMat2);
      const angle = (i / 7) * Math.PI * 2;
      proton.position.set(
        Math.cos(angle) * 0.9,
        Math.sin(angle) * 0.9,
        (Math.random() - 0.5) * 1.0
      );
      proton.scale.setScalar(0.75 + Math.random() * 0.25);
      nucleusGroup.add(proton);
    }
    atomGroup.add(nucleusGroup);

    // 3 Orbit Rings
    const orbitRingMat = new THREE.MeshBasicMaterial({
      color: 0x38bdf8,
      transparent: true,
      opacity: 0.45,
    });
    const ringGeo = new THREE.TorusGeometry(6, 0.08, 12, 64);

    const ring1 = new THREE.Mesh(ringGeo, orbitRingMat);
    ring1.rotation.x = Math.PI / 3;
    atomGroup.add(ring1);

    const ring2 = new THREE.Mesh(ringGeo, orbitRingMat);
    ring2.rotation.y = Math.PI / 3;
    ring2.rotation.z = Math.PI / 4;
    atomGroup.add(ring2);

    const ring3 = new THREE.Mesh(ringGeo, orbitRingMat);
    ring3.rotation.x = -Math.PI / 3;
    ring3.rotation.y = Math.PI / 6;
    atomGroup.add(ring3);

    // Electron Spheres on rings
    const electronMat = new THREE.MeshStandardMaterial({
      color: 0x67e8f9,
      roughness: 0.1,
      metalness: 0.8,
    });
    const electronGeo = new THREE.SphereGeometry(0.4, 12, 12);

    const electron1 = new THREE.Mesh(electronGeo, electronMat);
    ring1.add(electron1);

    const electron2 = new THREE.Mesh(electronGeo, electronMat);
    ring2.add(electron2);

    const electron3 = new THREE.Mesh(electronGeo, electronMat);
    ring3.add(electron3);

    // 2. Procedural 3D DNA Double Helix (Authentic Life Science Model)
    const dnaGroup = new THREE.Group();
    mainGroup.add(dnaGroup);
    dnaGroup.position.set(16, -2, -6);

    const dnaCount = 18;
    const strandGeo = new THREE.SphereGeometry(0.35, 12, 12);
    const rungGeo = new THREE.CylinderGeometry(0.08, 0.08, 2.8, 8);
    const strandMatA = new THREE.MeshStandardMaterial({ color: 0x10b981, roughness: 0.3 });
    const strandMatB = new THREE.MeshStandardMaterial({ color: 0x38bdf8, roughness: 0.3 });
    const rungMat = new THREE.MeshStandardMaterial({ color: 0xfbbf24, roughness: 0.4 });

    for (let i = 0; i < dnaCount; i++) {
      const y = (i - dnaCount / 2) * 1.0;
      const angle = (i / dnaCount) * Math.PI * 4;

      const sphereA = new THREE.Mesh(strandGeo, strandMatA);
      sphereA.position.set(Math.cos(angle) * 1.4, y, Math.sin(angle) * 1.4);
      dnaGroup.add(sphereA);

      const sphereB = new THREE.Mesh(strandGeo, strandMatB);
      sphereB.position.set(Math.cos(angle + Math.PI) * 1.4, y, Math.sin(angle + Math.PI) * 1.4);
      dnaGroup.add(sphereB);

      // Connecting base pair rung
      const rung = new THREE.Mesh(rungGeo, rungMat);
      rung.position.set(0, y, 0);
      rung.rotation.z = Math.PI / 2;
      rung.rotation.y = -angle;
      dnaGroup.add(rung);
    }

    // 3. Procedural Planet with Rings (Earth & Space Science)
    const planetGroup = new THREE.Group();
    mainGroup.add(planetGroup);
    planetGroup.position.set(12, 12, -12);

    const planetGeo = new THREE.SphereGeometry(3.2, 24, 24);
    const planetMat = new THREE.MeshStandardMaterial({
      color: 0x0284c7,
      roughness: 0.6,
      metalness: 0.1,
    });
    const planet = new THREE.Mesh(planetGeo, planetMat);
    planetGroup.add(planet);

    // Planet rings
    const planetRingGeo = new THREE.RingGeometry(4.2, 6.2, 32);
    const planetRingMat = new THREE.MeshStandardMaterial({
      color: 0xfbbf24,
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 0.7,
      roughness: 0.4,
    });
    const planetRing = new THREE.Mesh(planetRingGeo, planetRingMat);
    planetRing.rotation.x = Math.PI / 2.3;
    planetGroup.add(planetRing);

    // 4. Chemical Molecule Clusters (e.g. H2O and CO2)
    const moleculeGroup = new THREE.Group();
    mainGroup.add(moleculeGroup);
    moleculeGroup.position.set(-12, -10, -8);

    // Central Oxygen (red) + 2 Hydrogen (white)
    const oxygenMat = new THREE.MeshStandardMaterial({ color: 0xef4444, roughness: 0.3 });
    const hydrogenMat = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.3 });
    const bondMat = new THREE.MeshStandardMaterial({ color: 0x94a3b8, roughness: 0.5 });

    const oxygen = new THREE.Mesh(new THREE.SphereGeometry(1.2, 16, 16), oxygenMat);
    moleculeGroup.add(oxygen);

    const h1 = new THREE.Mesh(new THREE.SphereGeometry(0.65, 12, 12), hydrogenMat);
    h1.position.set(1.4, 1.1, 0);
    moleculeGroup.add(h1);

    const h2 = new THREE.Mesh(new THREE.SphereGeometry(0.65, 12, 12), hydrogenMat);
    h2.position.set(-1.4, 1.1, 0);
    moleculeGroup.add(h2);

    const bond1 = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.12, 1.3, 8), bondMat);
    bond1.position.set(0.7, 0.55, 0);
    bond1.rotation.z = -Math.PI / 4;
    moleculeGroup.add(bond1);

    const bond2 = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.12, 1.3, 8), bondMat);
    bond2.position.set(-0.7, 0.55, 0);
    bond2.rotation.z = Math.PI / 4;
    moleculeGroup.add(bond2);

    // 2. Floating Scientific Polyhedrons / Crystals / DNA beads
    const floatingGroup = new THREE.Group();
    mainGroup.add(floatingGroup);

    const shapes: THREE.Mesh[] = [];
    const geoIcosa = new THREE.IcosahedronGeometry(1.2, 0);
    const geoOcta = new THREE.OctahedronGeometry(1.0, 0);
    const geoTetra = new THREE.TetrahedronGeometry(1.1, 0);
    const geoTorus = new THREE.TorusGeometry(1.2, 0.3, 8, 24);

    const colorPalette = [0x10b981, 0x06b6d4, 0xf59e0b, 0x8b5cf6, 0xec4899];

    for (let i = 0; i < 24; i++) {
      const geo = i % 4 === 0 ? geoIcosa : i % 4 === 1 ? geoOcta : i % 4 === 2 ? geoTetra : geoTorus;
      const mat = new THREE.MeshStandardMaterial({
        color: colorPalette[i % colorPalette.length],
        roughness: 0.3,
        metalness: 0.3,
        transparent: true,
        opacity: 0.55,
      });
      const mesh = new THREE.Mesh(geo, mat);

      // Scatter widely across screen
      mesh.position.set(
        (Math.random() - 0.5) * 55,
        (Math.random() - 0.5) * 35,
        (Math.random() - 0.5) * 20 - 5
      );
      mesh.rotation.set(Math.random() * Math.PI, Math.random() * Math.PI, 0);

      const scale = 0.5 + Math.random() * 0.8;
      mesh.scale.set(scale, scale, scale);

      (mesh as any).rotSpeedX = (Math.random() - 0.5) * 0.02;
      (mesh as any).rotSpeedY = (Math.random() - 0.5) * 0.02;
      (mesh as any).initialY = mesh.position.y;
      (mesh as any).floatSpeed = 0.5 + Math.random() * 1.2;

      floatingGroup.add(mesh);
      shapes.push(mesh);
    }

    // 3. Ambient Star / Molecule Dust Particles
    const dustCount = 80;
    const dustGeo = new THREE.BufferGeometry();
    const dustPositions = new Float32Array(dustCount * 3);
    for (let i = 0; i < dustCount * 3; i += 3) {
      dustPositions[i] = (Math.random() - 0.5) * 70;
      dustPositions[i + 1] = (Math.random() - 0.5) * 50;
      dustPositions[i + 2] = (Math.random() - 0.5) * 30;
    }
    dustGeo.setAttribute('position', new THREE.BufferAttribute(dustPositions, 3));
    const dustMat = new THREE.PointsMaterial({
      color: 0x34d399,
      size: 0.35,
      transparent: true,
      opacity: 0.45,
    });
    const dust = new THREE.Points(dustGeo, dustMat);
    mainGroup.add(dust);

    // Mouse interaction parallax
    let mouseX = 0;
    let mouseY = 0;
    let targetX = 0;
    let targetY = 0;

    const handleMouseMove = (e: MouseEvent) => {
      mouseX = (e.clientX / window.innerWidth - 0.5) * 2;
      mouseY = (e.clientY / window.innerHeight - 0.5) * 2;
    };
    window.addEventListener('mousemove', handleMouseMove, { passive: true });

    // Resize handling
    const handleResize = () => {
      camera.aspect = window.innerWidth / window.innerHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(window.innerWidth, window.innerHeight);
    };
    window.addEventListener('resize', handleResize);

    // Animation Loop
    let frameId = 0;
    let clock = new THREE.Clock();

    const animate = () => {
      frameId = requestAnimationFrame(animate);
      const elapsedTime = clock.getElapsedTime();

      // Smooth mouse damping
      targetX += (mouseX - targetX) * 0.05;
      targetY += (mouseY - targetY) * 0.05;

      mainGroup.rotation.y = targetX * 0.25;
      mainGroup.rotation.x = -targetY * 0.2;

      // Rotate Atom & Orbit electrons
      atomGroup.rotation.y = elapsedTime * 0.35;
      atomGroup.rotation.z = Math.sin(elapsedTime * 0.2) * 0.15;

      // Rotate DNA Double Helix
      dnaGroup.rotation.y = elapsedTime * 0.45;
      dnaGroup.position.y = -2 + Math.sin(elapsedTime * 0.8) * 0.8;

      // Rotate Planet with rings
      planetGroup.rotation.y = elapsedTime * 0.2;
      planetGroup.position.y = 12 + Math.cos(elapsedTime * 0.6) * 0.6;

      // Rotate Chemical Molecule
      moleculeGroup.rotation.x = elapsedTime * 0.3;
      moleculeGroup.rotation.y = elapsedTime * 0.4;
      moleculeGroup.position.y = -10 + Math.sin(elapsedTime * 0.7) * 0.6;

      electron1.position.x = Math.cos(elapsedTime * 2.2) * 6;
      electron1.position.y = Math.sin(elapsedTime * 2.2) * 6;

      electron2.position.x = Math.cos(elapsedTime * 1.8 + 1) * 6;
      electron2.position.y = Math.sin(elapsedTime * 1.8 + 1) * 6;

      electron3.position.x = Math.cos(elapsedTime * 2.5 + 2) * 6;
      electron3.position.y = Math.sin(elapsedTime * 2.5 + 2) * 6;

      // Animate floating shapes
      shapes.forEach((s) => {
        s.rotation.x += (s as any).rotSpeedX;
        s.rotation.y += (s as any).rotSpeedY;
        s.position.y = (s as any).initialY + Math.sin(elapsedTime * (s as any).floatSpeed) * 1.2;
      });

      // Dust rotation
      dust.rotation.y = elapsedTime * 0.03;

      // Apply theme color shifts dynamically
      const activeTheme = themeRef.current;
      if (activeTheme === 'life') {
        dirLight1.color.setHex(0x10b981);
        orbitRingMat.color.setHex(0x34d399);
      } else if (activeTheme === 'physical') {
        dirLight1.color.setHex(0xf59e0b);
        orbitRingMat.color.setHex(0x06b6d4);
      } else if (activeTheme === 'space') {
        dirLight1.color.setHex(0x8b5cf6);
        orbitRingMat.color.setHex(0xa855f7);
      } else if (activeTheme === 'celebration') {
        dirLight1.color.setHex(0xfacc15);
        orbitRingMat.color.setHex(0xfbbf24);
      } else {
        dirLight1.color.setHex(0x34d399);
        orbitRingMat.color.setHex(0x38bdf8);
      }

      renderer.render(scene, camera);
    };

    animate();

    return () => {
      cancelAnimationFrame(frameId);
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('resize', handleResize);
      renderer.dispose();
      if (container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement);
      }
    };
  }, []);

  return (
    <div
      ref={mountRef}
      className="fixed inset-0 pointer-events-none z-0 overflow-hidden opacity-85 transition-opacity duration-700"
      aria-hidden="true"
    />
  );
};
