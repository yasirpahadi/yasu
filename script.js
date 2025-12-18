


// --- CONFIG ---
const isMobile = window.innerWidth < 768;
const CONFIG = {
    starCount: 5000,
    cameraStartZ: 50,
    cameraHomeZ: isMobile ? 20 : 10, // Dynamic start
};

// --- DOM ELEMENTS ---
console.log('Script initializing...');
const entryScreen = document.getElementById('entry-screen');
const enterBtn = document.getElementById('enter-btn');
const mainInterface = document.getElementById('main-interface');
const universeContainer = document.getElementById('universe-container');
const navLinks = document.querySelectorAll('.nav-links li');
const skillsPanel = document.getElementById('skills-panel');
const contentSections = document.querySelectorAll('.content-section');
const closeBtns = document.querySelectorAll('.close-btn');

console.log('DOM Elements checked:', { entryScreen, enterBtn, mainInterface });

// --- THREE.JS SETUP ---
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x000000);
scene.fog = new THREE.FogExp2(0x000000, 0.02);

const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
camera.position.set(0, 0, CONFIG.cameraStartZ);

const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(window.devicePixelRatio);
universeContainer.appendChild(renderer.domElement);

const controls = new THREE.OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;
controls.dampingFactor = 0.05;
controls.enableZoom = true;
controls.maxDistance = 100;
controls.minDistance = 2;
controls.autoRotate = true;
controls.autoRotateSpeed = 0.5;

// --- RAYCASTER ---
const raycaster = new THREE.Raycaster();
raycaster.params.Points.threshold = 0.5; // Easier interaction with particles
const mouse = new THREE.Vector2();

// --- OBJECTS ---
const planets = [];

// Helper: Create Planet (Particle System)
function createPlanet(size, color, position, name) {
    // High segment count for dense particle field
    const geometry = new THREE.SphereGeometry(size, 64, 64);

    const material = new THREE.PointsMaterial({
        color: color,
        size: 0.15,
        transparent: true,
        opacity: 0.8,
        sizeAttenuation: true
    });

    const planet = new THREE.Points(geometry, material);
    planet.position.set(position.x, position.y, position.z);
    planet.userData = { name: name, originalColor: color };

    if (size > 1) {
        // Ring as particles
        const ringGeo = new THREE.RingGeometry(size * 1.4, size * 1.5, 64);
        // Rotate ring geometry vertices manually to align with points orientation if needed, 
        // but simple rotation.x works for Points too.
        const ringMat = new THREE.PointsMaterial({
            color: color,
            size: 0.1,
            transparent: true,
            opacity: 0.5
        });
        const ring = new THREE.Points(ringGeo, ringMat);
        ring.rotation.x = Math.PI / 2;
        planet.add(ring);
    }

    scene.add(planet);
    planets.push(planet);
    return planet;
}

// Skill Planets
const skillGroup = new THREE.Group();
scene.add(skillGroup);

const skills = [
    { name: 'WEB', color: 0x00ffff, pos: { x: 8, y: 0, z: 0 } },
    { name: 'AI', color: 0xff00ff, pos: { x: -8, y: 2, z: -2 } },
    { name: 'APP', color: 0x00ff00, pos: { x: 0, y: 8, z: 2 } },
    { name: 'ML', color: 0xffaa00, pos: { x: 0, y: -8, z: -2 } },
    { name: '3D', color: 0xff0000, pos: { x: 5, y: 5, z: 5 } },
    { name: 'VIDEO', color: 0xff0080, pos: { x: -6, y: -4, z: 4 } }, // New Video Planet
];

skills.forEach(skill => {
    // Slightly smaller visual size for skills but dense
    const p = createPlanet(0.8, skill.color, skill.pos, skill.name);
    skillGroup.add(p);
});

// Section Planets
const aboutPlanet = createPlanet(3, 0x3366ff, { x: -20, y: 5, z: -10 }, 'about');
const projectsPlanet = createPlanet(4, 0x9933ff, { x: 25, y: -5, z: 10 }, 'projects');
const contactPlanet = createPlanet(2.5, 0xffffff, { x: 0, y: 15, z: -20 }, 'contact');

// Stars (Particle Universe)
const starGeometry = new THREE.BufferGeometry();
const starMaterial = new THREE.PointsMaterial({
    color: 0xffffff,
    size: 0.1,
    transparent: true,
    opacity: 0.8
});
const starVertices = [];
// Increased count for denser universe
const universeParticlesCount = CONFIG.starCount * 2;
for (let i = 0; i < universeParticlesCount; i++) {
    starVertices.push((Math.random() - 0.5) * 200, (Math.random() - 0.5) * 200, (Math.random() - 0.5) * 200);
}
starGeometry.setAttribute('position', new THREE.Float32BufferAttribute(starVertices, 3));
const stars = new THREE.Points(starGeometry, starMaterial);
scene.add(stars);

// Lighting
// Ambient light is less relevant for PointsMaterial (which is unlit usually), 
// but we keep it for any potential future meshes.
const ambientLight = new THREE.AmbientLight(0x404040, 2);
scene.add(ambientLight);
const sunLight = new THREE.PointLight(0xffffff, 2, 0);
sunLight.position.set(0, 0, 0);
scene.add(sunLight);

// Animation Loop
function animate() {
    requestAnimationFrame(animate);

    // Rotate groups/objects
    skillGroup.rotation.y += 0.002;
    aboutPlanet.rotation.y += 0.001;
    projectsPlanet.rotation.y += 0.001;
    contactPlanet.rotation.y += 0.001;

    // Rotate rings slightly independently? (Optional, but looks nice)

    stars.rotation.y += 0.0002; // Slower universe rotation

    controls.update();
    renderer.render(scene, camera);
}
animate();


// --- NAVIGATION & INTERACTION ---

// 1. Entry
let isEntering = false;

enterBtn.addEventListener('click', () => {
    console.log('Enter button clicked');
    if (isEntering) return;
    isEntering = true;

    enterBtn.innerText = 'INITIALIZING...';
    enterBtn.style.opacity = '0.7';

    // Safety functions
    const forceEntry = () => {
        console.warn('Forcing entry transition due to timeout or error.');
        entryScreen.style.display = 'none';
        mainInterface.classList.remove('hidden');
        mainInterface.style.opacity = '1';
        // Reset camera if needed
        camera.position.z = CONFIG.cameraHomeZ;
    };

    // Safety Timeout (3.5s)
    const safetyTimer = setTimeout(forceEntry, 3500);

    try {
        // Check GSAP
        if (typeof gsap === 'undefined') {
            console.error('GSAP not loaded! Using fallback.');
            clearTimeout(safetyTimer);
            forceEntry();
            return;
        }

        // Fade out UI
        gsap.to(entryScreen, {
            opacity: 0,
            duration: 1.5,
            ease: "power2.inOut",
            onComplete: () => {
                clearTimeout(safetyTimer);
                entryScreen.style.display = 'none';
                mainInterface.classList.remove('hidden');
                gsap.to(mainInterface, { opacity: 1, duration: 1 });
            }
        });

        // Camera Move
        gsap.to(camera.position, {
            z: CONFIG.cameraHomeZ,
            duration: 3,
            ease: "power2.inOut",
            onUpdate: () => controls.update()
        });

    } catch (e) {
        console.error('Animation error:', e);
        clearTimeout(safetyTimer);
        forceEntry();
    }
});

// 2. Nav Links
navLinks.forEach(link => {
    link.addEventListener('click', (e) => {
        const target = e.target.dataset.target;
        navigateTo(target);

        // Active State
        navLinks.forEach(l => l.classList.remove('active'));
        e.target.classList.add('active');
    });
});

// 3. Skill List Clicks
// 3. Skill List Clicks
document.querySelectorAll('.skill-list li').forEach(item => {
    item.addEventListener('click', (e) => {
        const skillName = e.target.dataset.skill;
        console.log('Skill clicked:', skillName);

        const mesh = skillGroup.children.find(child => child.userData.name === skillName);

        if (mesh) {
            const targetPos = {
                x: mesh.position.x + 2,
                y: mesh.position.y + 2,
                z: mesh.position.z + 5
            };

            gsap.to(camera.position, {
                x: targetPos.x,
                y: targetPos.y,
                z: targetPos.z,
                duration: 2,
                ease: "power2.inOut"
            });

            gsap.to(controls.target, {
                x: mesh.position.x,
                y: mesh.position.y,
                z: mesh.position.z,
                duration: 2,
                ease: "power2.inOut"
            });

            skillsPanel.classList.remove('open');

            // Show Specific Content for VIDEO
            if (skillName === 'VIDEO') {
                setTimeout(() => {
                    document.getElementById('video-section').classList.remove('hidden');
                }, 1000);
            }
        } else {
            console.error('Planet not found for skill:', skillName);
        }
    });
});

// 6. Hover Interaction (Mouse Move)
let hoveredObject = null;

window.addEventListener('mousemove', (event) => {
    if (!mainInterface.classList.contains('visible')) return;

    mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
    mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;

    raycaster.setFromCamera(mouse, camera);
    const intersects = raycaster.intersectObjects(scene.children, true);

    if (intersects.length > 0) {
        const object = intersects[0].object;
        // Find main parent if part of group or complex mesh
        let target = object;
        if (object.parent && object.parent.userData.name) target = object.parent;

        if (hoveredObject !== target) {
            // Reset previous
            if (hoveredObject) {
                gsap.to(hoveredObject.scale, { x: 1, y: 1, z: 1, duration: 0.3 });
                document.body.style.cursor = 'default';
            }

            // Set new
            hoveredObject = target;

            // Only interact if it has a name (is a planet)
            if (hoveredObject.userData.name) {
                document.body.style.cursor = 'pointer';
                gsap.to(hoveredObject.scale, { x: 1.2, y: 1.2, z: 1.2, duration: 0.3 });
            }
        }
    } else {
        if (hoveredObject) {
            gsap.to(hoveredObject.scale, { x: 1, y: 1, z: 1, duration: 0.3 });
            document.body.style.cursor = 'default';
            hoveredObject = null;
        }
    }
});

function navigateTo(target) {
    closeAllContent();
    controls.autoRotate = true;

    let targetPos = null;
    let targetLookAt = new THREE.Vector3(0, 0, 0);

    switch (target) {
        case 'home':
            targetPos = { x: 0, y: 0, z: CONFIG.cameraHomeZ };
            document.getElementById('home-content').classList.remove('hidden');
            break;
        case 'about':
            targetPos = {
                x: aboutPlanet.position.x + 5,
                y: aboutPlanet.position.y + 2,
                z: aboutPlanet.position.z + 5
            };
            targetLookAt = aboutPlanet.position;
            controls.autoRotate = false;
            setTimeout(() => {
                document.getElementById('about-section').classList.remove('hidden');
                document.getElementById('about-section').style.pointerEvents = 'auto';
            }, 1000);
            break;
        case 'projects':
            targetPos = {
                x: projectsPlanet.position.x - 6,
                y: projectsPlanet.position.y + 3,
                z: projectsPlanet.position.z + 6
            };
            targetLookAt = projectsPlanet.position;
            controls.autoRotate = false;
            setTimeout(() => {
                document.getElementById('projects-section').classList.remove('hidden');
            }, 1000);
            break;
        case 'contact':
            targetPos = {
                x: contactPlanet.position.x,
                y: contactPlanet.position.y,
                z: contactPlanet.position.z + 6
            };
            targetLookAt = contactPlanet.position;
            controls.autoRotate = false;
            setTimeout(() => {
                document.getElementById('contact-section').classList.remove('hidden');
            }, 1000);
            break;
        case 'skills':
            targetPos = { x: 0, y: 15, z: 15 };
            skillsPanel.classList.add('open');
            break;
    }

    if (targetPos) {
        gsap.to(camera.position, {
            x: targetPos.x,
            y: targetPos.y,
            z: targetPos.z,
            duration: 2,
            ease: "power3.inOut"
        });

        gsap.to(controls.target, {
            x: targetLookAt.x,
            y: targetLookAt.y,
            z: targetLookAt.z,
            duration: 2,
            ease: "power3.inOut"
        });
    }
}

// 4. Close Buttons
closeBtns.forEach(btn => {
    btn.addEventListener('click', () => {
        closeAllContent();
    });
});

function closeAllContent() {
    skillsPanel.classList.remove('open');
    contentSections.forEach(sec => sec.classList.add('hidden'));
}

// 5. Raycasting
window.addEventListener('click', (event) => {
    console.log('Global Click DETECTED on:', event.target); // Debug log
    if (!mainInterface.classList.contains('visible')) return;

    mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
    mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;

    raycaster.setFromCamera(mouse, camera);

    const intersects = raycaster.intersectObjects(scene.children, true);

    if (intersects.length > 0) {
        const object = intersects[0].object;
        let targetName = object.userData.name;
        if (!targetName && object.parent) targetName = object.parent.userData.name;

        if (targetName) {
            console.log('Clicked:', targetName);
            const menuMap = {
                'about': 'about',
                'projects': 'projects',
                'contact': 'contact'
            };
            const isSkill = skills.find(s => s.name === targetName);
            if (isSkill) {
                navigateTo('skills');
            } else if (menuMap[targetName]) {
                navigateTo(menuMap[targetName]);
                navLinks.forEach(l => l.classList.remove('active'));
                const navItem = document.querySelector(`.nav-links li[data-target="${menuMap[targetName]}"]`);
                if (navItem) navItem.classList.add('active');
            }
        }
    }
});


// Resize logic with Mobile check
function handleResize() {
    const width = window.innerWidth;
    const height = window.innerHeight;

    camera.aspect = width / height;
    camera.updateProjectionMatrix();

    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2)); // Ensure sharpness but cap for performance

    // Dynamic Mobile Adjustment
    if (width < 768) {
        CONFIG.cameraHomeZ = 20; // Pull back on mobile to keep items in view
    } else {
        CONFIG.cameraHomeZ = 10; // Desktop default
    }

    // Smoothly adjust camera if user is at the "Home" position
    // This prevents the view from looking "zoomed in" when resizing from desktop to mobile
    const dist = camera.position.distanceTo(new THREE.Vector3(0, 0, 0));
    if (dist < 30 && Math.abs(camera.position.x) < 5 && Math.abs(camera.position.y) < 5) {
        // Only adjust if we are roughly at home, not exploring other planets
        gsap.to(camera.position, { z: CONFIG.cameraHomeZ, duration: 1 });
    }
}

window.addEventListener('resize', handleResize);
// Call once on init
handleResize();







    var typed = new Typed("#typed-text", {
    strings: [
        "A Professional Filmmaker.",
        "Programmer.",
        "Designer.",
        "3D Artist.",
        "A Universe of Skill.",
        "The YAS"
    ],
    typeSpeed: 60,      // Har character type hone ki speed
    backSpeed: 40,      // Delete hone ki speed
    backDelay: 1000,    // Ek word ke baad rukne ka time (ms)
    loop: true          // Infinite loop
});