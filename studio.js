import * as THREE from "three";
import { RoundedBoxGeometry } from "./vendor/RoundedBoxGeometry.js";
import { RoomEnvironment } from "./vendor/RoomEnvironment.js";
import {
  journeyStops,
  getJourneyStage,
  sampleJourney,
  computerPorts,
  hubComputerRoute,
  computerKeyboardRoute,
} from "./journey.js";

const track = document.querySelector(".hero-track");
const studio = document.querySelector("#studio");
const heroCopy = document.querySelector(".hero-copy");
const chapterCopy = document.querySelector(".chapter-copy");
const progressBar = document.querySelector(".scroll-progress span");
const header = document.querySelector(".header");
const motionButton = document.querySelector("#motion-toggle");
const screenButton = document.querySelector("#screen-toggle");
const announcement = document.querySelector("#studio-announcement");
const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
const menuButton = document.querySelector(".menu-toggle");
const mobileMenu = document.querySelector("#mobile-menu");
const journeyNav = document.querySelector(".journey-nav");
const scrollCue = document.querySelector(".scroll-cue");
const journeyTitle = chapterCopy.querySelector("h2");
const journeyDescription = chapterCopy.querySelector("p");
const journeyKicker = chapterCopy.querySelector(".chapter-kicker");
const journeyButtons = journeyStops.map((stop, index) => {
  const button = document.createElement("button");
  button.type = "button";
  button.title = stop.name;
  button.setAttribute("aria-label", `${index + 1}. ${stop.name} 구간으로 이동`);
  button.addEventListener("click", () => {
    window.scrollTo({
      top: track.offsetTop + stop.at * (track.offsetHeight - innerHeight),
      behavior: reducedMotion.matches ? "instant" : "smooth",
    });
  });
  journeyNav.append(button);
  return button;
});
let currentStage = -1;
let journeyStarted = null;
const studioLocation = document.querySelector(".studio-location");
function updateJourneyCopy(progress) {
  const started =
    progress > 0.075 &&
    !reducedMotion.matches &&
    studio.dataset.ready !== "fallback";
  if (started !== journeyStarted) {
    journeyStarted = started;
    journeyNav.hidden = !started;
    scrollCue.hidden = false;
    scrollCue.firstChild.textContent = started
      ? "Skip to about"
      : "Scroll to step inside";
    studioLocation.textContent = started
      ? "Scroll to follow the signal"
      : "Drag to look around";
  }
  const index = getJourneyStage(progress);
  if (index !== currentStage) {
    currentStage = index;
    const stop = journeyStops[index];
    journeyTitle.textContent = stop.title;
    journeyDescription.textContent = stop.copy;
    journeyKicker.textContent = `${String(index + 1).padStart(2, "0")} / 08 — ${stop.name}`;
    journeyButtons.forEach((button, i) => {
      if (i === index) button.setAttribute("aria-current", "step");
      else button.removeAttribute("aria-current");
    });
  }
  studio.dataset.stage =
    progress < 0.075 ? "overview" : journeyStops[index].key;
}

function closeMenu() {
  mobileMenu.hidden = true;
  menuButton.setAttribute("aria-expanded", "false");
}
menuButton.addEventListener("click", () => {
  mobileMenu.hidden = !mobileMenu.hidden;
  menuButton.setAttribute("aria-expanded", String(!mobileMenu.hidden));
});
mobileMenu.addEventListener("click", (event) => {
  if (event.target.closest("a")) closeMenu();
});
document.addEventListener("keydown", (event) => {
  if (event.key === "Escape") {
    closeMenu();
  }
});
window.addEventListener("resize", () => {
  if (innerWidth > 800) closeMenu();
  updateScroll();
});
document.querySelectorAll(".approach-list details").forEach((detail) => {
  detail.addEventListener("toggle", () => {
    if (detail.open)
      document.querySelectorAll(".approach-list details").forEach((other) => {
        if (other !== detail) other.open = false;
      });
  });
});

let scrollProgress = 0;
let requestSceneFrame = () => {};
function updatePresentation(progress) {
  const exit = THREE.MathUtils.smoothstep(progress, 0.025, 0.095);
  const enter = THREE.MathUtils.smoothstep(progress, 0.085, 0.12);
  heroCopy.style.opacity = String(1 - exit);
  heroCopy.style.transform = `perspective(1200px) translateY(${-exit * 70}px) rotateX(${exit * 10}deg)`;
  chapterCopy.style.opacity = String(enter);
  chapterCopy.style.transform = `translateY(${(1 - enter) * 25}px)`;
  progressBar.style.transform = `scaleX(${progress})`;
}
function updateScroll() {
  const rect = track.getBoundingClientRect();
  const staticWorkspace =
    reducedMotion.matches || studio.dataset.ready === "fallback";
  scrollProgress = staticWorkspace
    ? 0
    : THREE.MathUtils.clamp(
        -rect.top / Math.max(1, track.offsetHeight - innerHeight),
        0,
        1,
      );
  if (staticWorkspace) updatePresentation(0);
  header.classList.toggle("scrolled", scrollY > 80);
  requestSceneFrame();
}
let scrollQueued = false;
window.addEventListener(
  "scroll",
  () => {
    if (!scrollQueued) {
      scrollQueued = true;
      requestAnimationFrame(() => {
        scrollQueued = false;
        updateScroll();
      });
    }
  },
  { passive: true },
);
reducedMotion.addEventListener("change", updateScroll);
updateScroll();

function showFallback(error) {
  console.warn(
    "3D workspace unavailable; showing the workspace photograph.",
    error,
  );
  document.querySelector(".studio-loading").hidden = true;
  document.querySelector(".studio-fallback").hidden = false;
  screenButton.hidden = true;
  motionButton.hidden = true;
  studio.dataset.ready = "fallback";
  track.classList.add("static-workspace");
  chapterCopy.hidden = true;
  journeyNav.hidden = true;
  journeyStarted = null;
  scrollCue.hidden = false;
  updateScroll();
}

function createWorkspace() {
  const renderer = new THREE.WebGLRenderer({
    antialias: true,
    alpha: false,
    powerPreference: "high-performance",
  });
  renderer.setPixelRatio(
    Math.min(devicePixelRatio, innerWidth < 800 ? 1.5 : 1.75),
  );
  renderer.setClearColor(0xd9e8f1, 1);
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  // Camera travel does not change the light-space shadow map.
  renderer.shadowMap.autoUpdate = false;
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.17;
  renderer.domElement.setAttribute("aria-hidden", "true");
  renderer.domElement.title =
    "드래그하여 둘러보세요. 모니터, 키보드, 마우스를 클릭하면 화면이 바뀝니다.";
  studio.prepend(renderer.domElement);

  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0xd9e8f1);
  const pmrem = new THREE.PMREMGenerator(renderer);
  const environment = new RoomEnvironment();
  const environmentTarget = pmrem.fromScene(environment, 0.04);
  scene.environment = environmentTarget.texture;
  scene.environmentIntensity = 0.55;
  environment.dispose();
  pmrem.dispose();

  const camera = new THREE.PerspectiveCamera(34, 1, 0.1, 100);
  const world = new THREE.Group();
  scene.add(world);
  scene.add(new THREE.HemisphereLight(0xf5f8ff, 0x8c9fbc, 2.5));
  const keyLight = new THREE.DirectionalLight(0xffffff, 4.2);
  keyLight.position.set(-5, 11, 7);
  keyLight.castShadow = true;
  keyLight.shadow.mapSize.set(
    innerWidth < 800 ? 1024 : 2048,
    innerWidth < 800 ? 1024 : 2048,
  );
  Object.assign(keyLight.shadow.camera, {
    left: -10,
    right: 10,
    top: 10,
    bottom: -10,
    near: 0.5,
    far: 30,
  });
  keyLight.shadow.bias = -0.0002;
  keyLight.shadow.normalBias = 0.025;
  keyLight.shadow.radius = 4;
  scene.add(keyLight);
  const rimLight = new THREE.DirectionalLight(0xaeb3ff, 2.1);
  rimLight.position.set(7, 5, -5);
  scene.add(rimLight);

  const mat = {
    white: new THREE.MeshStandardMaterial({
      color: 0xf1f5fc,
      roughness: 0.3,
      metalness: 0.1,
    }),
    porcelain: new THREE.MeshStandardMaterial({
      color: 0xf8f8fd,
      roughness: 0.46,
    }),
    blue: new THREE.MeshStandardMaterial({
      color: 0x3932dc,
      roughness: 0.28,
      metalness: 0.12,
    }),
    lavender: new THREE.MeshStandardMaterial({
      color: 0xb3b9ee,
      roughness: 0.55,
    }),
    mat: new THREE.MeshStandardMaterial({ color: 0xb9c8e5, roughness: 0.9 }),
    silver: new THREE.MeshStandardMaterial({
      color: 0xabbace,
      roughness: 0.28,
      metalness: 0.75,
    }),
    dark: new THREE.MeshStandardMaterial({ color: 0x171e39, roughness: 0.45 }),
    screenEdge: new THREE.MeshStandardMaterial({
      color: 0x333951,
      roughness: 0.3,
      metalness: 0.3,
    }),
    green: new THREE.MeshStandardMaterial({
      color: 0x5e8f88,
      roughness: 0.7,
      side: THREE.DoubleSide,
    }),
    soil: new THREE.MeshStandardMaterial({ color: 0x403e51, roughness: 1 }),
    light: new THREE.MeshStandardMaterial({
      color: 0xf9fcff,
      emissive: 0xb8c3ff,
      emissiveIntensity: 0.65,
    }),
  };
  const geometryCache = new Map();
  const interactables = [];
  const liftObjects = [];
  const keyMeshes = [];
  function group(x, y, z, parent = world) {
    const object = new THREE.Group();
    object.position.set(x, y, z);
    parent.add(object);
    return object;
  }
  function mesh(geometry, material, x, y, z, parent = world) {
    const object = new THREE.Mesh(geometry, material);
    object.position.set(x, y, z);
    object.castShadow = true;
    object.receiveShadow = true;
    parent.add(object);
    return object;
  }
  function box(w, h, d, material, x, y, z, parent = world, radius = 0.06) {
    const key = [w, h, d, radius].join(",");
    if (!geometryCache.has(key))
      geometryCache.set(
        key,
        new RoundedBoxGeometry(
          w,
          h,
          d,
          2,
          Math.min(radius, w / 2, h / 2, d / 2),
        ),
      );
    return mesh(geometryCache.get(key), material, x, y, z, parent);
  }
  function cylinder(top, bottom, height, material, x, y, z, parent = world) {
    return mesh(
      new THREE.CylinderGeometry(top, bottom, height, 40),
      material,
      x,
      y,
      z,
      parent,
    );
  }
  function tube(points, radius, material, parent = world) {
    return mesh(
      new THREE.TubeGeometry(
        new THREE.CatmullRomCurve3(
          points.map((point) => new THREE.Vector3(...point)),
        ),
        40,
        radius,
        8,
        false,
      ),
      material,
      0,
      0,
      0,
      parent,
    );
  }
  function makeTexture(width, height, draw) {
    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
    const context = canvas.getContext("2d");
    draw(context, width, height);
    const texture = new THREE.CanvasTexture(canvas);
    texture.colorSpace = THREE.SRGBColorSpace;
    texture.anisotropy = Math.min(8, renderer.capabilities.getMaxAnisotropy());
    return { canvas, context, texture };
  }
  function panel(w, h, texture, x, y, z, parent) {
    const object = mesh(
      new THREE.PlaneGeometry(w, h),
      new THREE.MeshBasicMaterial({ map: texture, toneMapped: false }),
      x,
      y,
      z,
      parent,
    );
    object.castShadow = false;
    return object;
  }
  function lifted(object, amount) {
    liftObjects.push({ object, y: object.position.y, amount });
  }

  // A real miniature desk: the surfaces, stands, devices and individual keys are meshes.
  box(12.3, 0.18, 7.5, mat.lavender, 0, -1.53, 0, world, 0.09);
  box(12.3, 0.09, 7.5, mat.white, 0, -1.4, 0, world, 0.04);
  box(10.8, 0.22, 5.5, mat.porcelain, 0, 0, 0, world, 0.105);
  box(10.45, 0.08, 5.2, mat.lavender, 0, -0.14, 0, world, 0.03);
  for (const x of [-4.5, 4.5]) {
    for (const z of [-1.95, 1.95])
      box(0.17, 1.22, 0.17, mat.silver, x, -0.78, z, world, 0.04);
    box(0.33, 0.09, 4.3, mat.white, x, -1.34, 0, world, 0.045);
  }
  box(5.4, 0.035, 2.2, mat.mat, 0.25, 0.13, 1.2, world, 0.017);
  const deskLabel = makeTexture(1024, 100, (ctx) => {
    ctx.fillStyle = "#edf0fa";
    ctx.fillRect(0, 0, 1024, 100);
    ctx.fillStyle = "#66718b";
    ctx.font = "34px monospace";
    ctx.fillText("hwantage / workspace", 50, 64);
  });
  panel(2.4, 0.15, deskLabel.texture, -3.25, -0.018, 2.756, world);

  let screenMode = 0;
  const modes = ["Build", "Design", "Ship"];
  const editor = makeTexture(1600, 950, (ctx) => drawEditor(ctx, 0));
  function drawEditor(ctx, mode) {
    ctx.fillStyle = "#151b35";
    ctx.fillRect(0, 0, 1600, 950);
    ctx.fillStyle = "#222943";
    ctx.fillRect(0, 0, 1600, 76);
    ["#f0889d", "#e7c686", "#93c8b7"].forEach((color, i) => {
      ctx.fillStyle = color;
      ctx.beginPath();
      ctx.arc(38 + i * 36, 38, 9, 0, Math.PI * 2);
      ctx.fill();
    });
    ctx.font = "23px monospace";
    ctx.fillStyle = "#a4afcc";
    ctx.fillText("hwantage — workspace", 570, 46);
    ctx.fillStyle = "#1b223c";
    ctx.fillRect(0, 76, 260, 770);
    ctx.font = "22px monospace";
    ctx.fillStyle = "#91a0c7";
    [
      "EXPLORER",
      "workspace",
      "  src",
      "    App.tsx",
      "    studio.ts",
      "    style.css",
      "  package.json",
    ].forEach((line, i) => ctx.fillText(line, 26, 125 + i * 51));
    ctx.fillStyle = "#303754";
    ctx.fillRect(262, 76, 246, 63);
    ctx.fillStyle = "#e1e8fc";
    ctx.fillText(
      mode === 0 ? "App.tsx" : mode === 1 ? "design.ts" : "terminal",
      287,
      117,
    );
    const code =
      mode === 0
        ? [
            ["#8591b6", "// small ideas, real experiences."],
            ["#baa8f8", "export default function Workspace() {"],
            ["#9db7ed", '  const developer = "hwantage";'],
            ["#9db7ed", '  const purpose = "people first";'],
            ["#e7ecfa", ""],
            ["#baa8f8", "  return ("],
            ["#8fd5cc", "    <Experience"],
            ["#e7c68e", '      craft="with care"'],
            ["#e7c68e", "      curiosity={Infinity}"],
            ["#8fd5cc", "    />"],
            ["#baa8f8", "  );"],
            ["#baa8f8", "}"],
          ]
        : mode === 1
          ? [
              ["#8591b6", "// every detail has a reason."],
              ["#baa8f8", "const experience = {"],
              ["#e7c68e", "  clear: true,"],
              ["#e7c68e", "  accessible: true,"],
              ["#e7c68e", "  thoughtful: true,"],
              ["#baa8f8", "};"],
              ["#e7ecfa", ""],
              ["#8fd5cc", "understand(people);"],
              ["#8fd5cc", "design(withIntent);"],
              ["#8fd5cc", "build(somethingGood);"],
            ]
          : [
              ["#8591b6", "$ npm run build"],
              ["#e1e8fc", "  Creating a little world..."],
              ["#93d7b5", "  ✓ Interfaces crafted"],
              ["#93d7b5", "  ✓ Details considered"],
              ["#93d7b5", "  ✓ Ready for the real world"],
              ["#e7ecfa", ""],
              ["#8591b6", '$ git commit -m "make it better"'],
              ["#c0aaff", "  Built with curiosity."],
              ["#e7ecfa", ""],
              ["#93d7b5", "  All systems go."],
            ];
    ctx.font = "31px monospace";
    code.forEach(([color, text], i) => {
      ctx.fillStyle = "#505d80";
      ctx.fillText(String(i + 1).padStart(2, " "), 288, 197 + i * 49);
      ctx.fillStyle = color;
      ctx.fillText(text, 364, 197 + i * 49);
    });
    ctx.fillStyle = "#3932dc";
    ctx.fillRect(0, 876, 1600, 74);
    ctx.fillStyle = "#f1f0ff";
    ctx.font = "23px monospace";
    ctx.fillText("main*", 25, 921);
    ctx.fillText(`${modes[mode]} with intent.`, 270, 921);
    ctx.fillText("TypeScript     UTF-8", 1260, 921);
  }
  const mainMonitor = group(-0.55, 1.98, -0.85);
  box(4.45, 2.78, 0.2, mat.white, 0, 0, 0, mainMonitor, 0.095);
  box(4.25, 2.56, 0.04, mat.screenEdge, 0, 0.035, 0.11, mainMonitor, 0.02);
  const mainScreen = panel(
    4.1,
    2.435,
    editor.texture,
    0,
    0.04,
    0.138,
    mainMonitor,
  );
  interactables.push(mainScreen);
  cylinder(
    0.033,
    0.033,
    0.012,
    mat.dark,
    0,
    1.315,
    0.11,
    mainMonitor,
  ).rotation.x = Math.PI / 2;
  box(0.36, 0.91, 0.29, mat.silver, 0, -1.69, -0.03, mainMonitor, 0.07);
  box(1.42, 0.07, 0.87, mat.silver, 0, -1.81, 0.06, mainMonitor, 0.035);
  lifted(mainMonitor, 0.12);

  const webPreview = makeTexture(720, 1100, (ctx) => {
    ctx.fillStyle = "#fafafd";
    ctx.fillRect(0, 0, 720, 1100);
    ctx.fillStyle = "#3932dc";
    ctx.fillRect(0, 0, 720, 58);
    ctx.fillStyle = "#d7d6ff";
    ctx.font = "18px monospace";
    ctx.fillText("localhost:3000", 252, 37);
    ctx.fillStyle = "#13162b";
    ctx.font = "bold 38px sans-serif";
    ctx.fillText("hwantage.", 46, 142);
    ctx.font = "bold 78px sans-serif";
    ctx.fillText("Hello,", 46, 300);
    ctx.fillText("little world.", 46, 382);
    ctx.font = "23px sans-serif";
    ctx.fillStyle = "#747991";
    ctx.fillText("A place to think, build, and repeat.", 46, 445);
    ctx.fillStyle = "#d9e8f1";
    ctx.fillRect(46, 500, 628, 328);
    ctx.fillStyle = "#3932dc";
    ctx.font = "bold 124px monospace";
    ctx.fillText("</>", 226, 711);
    ctx.fillStyle = "#13162b";
    ctx.font = "bold 31px sans-serif";
    ctx.fillText("Built for people.", 46, 903);
    ctx.fillStyle = "#747991";
    ctx.font = "23px sans-serif";
    ctx.fillText("Thoughtful, from the first pixel.", 46, 955);
    ctx.fillStyle = "#3932dc";
    ctx.fillRect(46, 997, 230, 55);
    ctx.fillStyle = "white";
    ctx.font = "22px sans-serif";
    ctx.fillText("Let's talk", 107, 1033);
  });
  const secondMonitor = group(2.85, 1.93, -1.22);
  secondMonitor.rotation.y = -0.27;
  box(1.8, 2.8, 0.17, mat.white, 0, 0, 0, secondMonitor, 0.075);
  box(1.66, 2.63, 0.025, mat.screenEdge, 0, 0, 0.095, secondMonitor, 0.012);
  const secondaryScreen = panel(
    1.54,
    2.49,
    webPreview.texture,
    0,
    0,
    0.112,
    secondMonitor,
  );
  interactables.push(secondaryScreen);
  box(0.23, 0.81, 0.24, mat.silver, 0, -1.59, -0.02, secondMonitor);
  box(0.95, 0.075, 0.72, mat.silver, 0, -1.77, 0.05, secondMonitor, 0.037);
  lifted(secondMonitor, 0.25);

  const tower = group(-3.92, 1.13, -1.12);
  box(1.15, 2.04, 1.75, mat.white, 0, 0, 0, tower, 0.095);
  box(0.99, 1.82, 0.025, mat.lavender, 0, -0.02, 0.883, tower, 0.012);
  box(0.87, 1.63, 0.035, mat.dark, 0, -0.08, 0.904, tower, 0.017);
  for (const y of [0.49, -0.07, -0.63]) {
    const fan = group(0, y, 0.94, tower);
    const ring = mesh(
      new THREE.TorusGeometry(0.23, 0.021, 10, 40),
      mat.blue,
      0,
      0,
      0,
      fan,
    );
    ring.material = new THREE.MeshStandardMaterial({
      color: 0x7574e8,
      emissive: 0x3932dc,
      emissiveIntensity: 0.45,
      roughness: 0.3,
    });
    const disc = cylinder(0.19, 0.19, 0.025, mat.screenEdge, 0, 0, 0, fan);
    disc.rotation.x = Math.PI / 2;
    for (let i = 0; i < 6; i++) {
      const blade = box(
        0.065,
        0.15,
        0.017,
        mat.silver,
        Math.sin((i * Math.PI) / 3) * 0.1,
        Math.cos((i * Math.PI) / 3) * 0.1,
        0.023,
        fan,
        0.008,
      );
      blade.rotation.z = (-i * Math.PI) / 3 + 0.35;
    }
    const hub = cylinder(0.055, 0.055, 0.035, mat.dark, 0, 0, 0.033, fan);
    hub.rotation.x = Math.PI / 2;
  }
  box(0.026, 1.66, 1.45, mat.silver, 0.586, 0, -0.02, tower, 0.013);
  for (let i = 0; i < 12; i++)
    box(
      0.008,
      0.023,
      0.79,
      mat.screenEdge,
      0.604,
      -0.6 + i * 0.1,
      -0.12,
      tower,
      0.004,
    );
  cylinder(0.039, 0.039, 0.015, mat.blue, 0.32, 1.035, 0.52, tower);
  // Rear I/O: the network cable enters the back, never a front intake fan.
  box(0.97, 1.83, 0.028, mat.silver, 0, 0, -0.884, tower, 0.02);
  box(0.39, 1.08, 0.025, mat.dark, -0.27, 0.24, -0.91, tower, 0.02);
  for (const y of [0.6, 0.43]) {
    box(0.23, 0.083, 0.024, mat.silver, -0.27, y, -0.93, tower, 0.008);
    box(0.17, 0.038, 0.025, mat.screenEdge, -0.27, y, -0.946, tower, 0.005);
  }
  box(0.26, 0.17, 0.025, mat.silver, -0.27, 0.14, -0.932, tower, 0.009);
  box(0.2, 0.105, 0.027, mat.dark, -0.27, 0.14, -0.951, tower, 0.006);
  box(0.18, 0.085, 0.16, mat.blue, ...computerPorts.network.plug, world, 0.012);
  box(0.1, 0.019, 0.1, mat.lavender, -0.27, 0.192, -1.0, tower, 0.004);
  box(0.034, 0.025, 0.016, mat.blue, -0.08, 0.19, -0.938, tower, 0.004);
  box(0.23, 0.11, 0.027, mat.dark, -0.27, -0.23, -0.935, tower, 0.006);
  box(0.18, 0.063, 0.16, mat.silver, ...computerPorts.usb.plug, world, 0.009);
  mesh(
    new THREE.TorusGeometry(0.25, 0.018, 8, 32),
    mat.dark,
    0.23,
    0.56,
    -0.925,
    tower,
  );
  for (let i = 0; i < 8; i++)
    box(
      0.34,
      0.018,
      0.019,
      mat.screenEdge,
      0.23,
      0.38 + i * 0.051,
      -0.934,
      tower,
      0.003,
    );
  for (let i = 0; i < 4; i++)
    box(0.77, 0.045, 0.023, mat.dark, 0, -0.35 - i * 0.14, -0.93, tower, 0.006);
  lifted(tower, 0.08);

  const keyboard = group(-0.55, 0.245, 1.33);
  keyboard.rotation.y = -0.04;
  box(3.7, 0.16, 1.31, mat.white, 0, 0, 0, keyboard, 0.075);
  box(3.55, 0.026, 1.18, mat.lavender, 0, 0.092, 0, keyboard, 0.013);
  const legends = [
    "Esc",
    "1",
    "2",
    "3",
    "4",
    "5",
    "6",
    "7",
    "8",
    "9",
    "0",
    "−",
    "=",
    "←",
    "Tab",
    "Q",
    "W",
    "E",
    "R",
    "T",
    "Y",
    "U",
    "I",
    "O",
    "P",
    "[",
    "]",
    "\\",
    "Caps",
    "A",
    "S",
    "D",
    "F",
    "G",
    "H",
    "J",
    "K",
    "L",
    ";",
    "'",
    "Enter",
    "Shift",
    "Z",
    "X",
    "C",
    "V",
    "B",
    "N",
    "M",
    ",",
    ".",
    "/",
    "Shift",
    "Fn",
    "Ctrl",
    "Alt",
    "Cmd",
    "",
    "Cmd",
    "Alt",
    "←",
    "↓",
    "↑",
    "→",
  ];
  const keyAtlas = makeTexture(2048, 1024, (ctx) => {
    ctx.clearRect(0, 0, 2048, 1024);
    ctx.fillStyle = "#3d4664";
    ctx.font = "34px sans-serif";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    legends.forEach((label, i) =>
      ctx.fillText(label, (i % 16) * 128 + 64, Math.floor(i / 16) * 128 + 64),
    );
  });
  const legendMaterial = new THREE.MeshBasicMaterial({
    map: keyAtlas.texture,
    transparent: true,
    depthWrite: false,
    toneMapped: false,
  });
  function keycap(x, z, width, labelIndex, blue = false) {
    const key = group(x, 0.153, z, keyboard);
    const cap = box(
      width,
      0.105,
      0.195,
      blue ? mat.blue : mat.porcelain,
      0,
      0,
      0,
      key,
      0.032,
    );
    interactables.push(cap);
    cap.userData.key = key;
    keyMeshes.push(key);
    if (labelIndex !== null && !blue) {
      const geometry = new THREE.PlaneGeometry(Math.min(width, 0.23), 0.18);
      const uv = geometry.attributes.uv;
      const column = labelIndex % 16,
        row = Math.floor(labelIndex / 16);
      for (let i = 0; i < uv.count; i++)
        uv.setXY(i, (column + uv.getX(i)) / 16, 1 - (row + 1 - uv.getY(i)) / 8);
      const label = mesh(geometry, legendMaterial, 0, 0.055, 0, key);
      label.rotation.x = -Math.PI / 2;
      label.castShadow = false;
    }
  }
  let labelIndex = 0;
  for (let row = 0; row < 4; row++) {
    const count = row === 0 || row === 1 ? 14 : 13;
    const step = 3.43 / count;
    for (let col = 0; col < count; col++)
      keycap(
        -1.715 + step * (col + 0.5),
        -0.45 + row * 0.23,
        step - 0.034,
        labelIndex++,
        (row === 0 && col === 0) || (row === 2 && col === count - 1),
      );
  }
  // Leave a real gap before the spacebar; coplanar overlapping key tops flicker.
  for (let col = 0; col < 4; col++)
    keycap(-1.63 + col * 0.24, 0.47, 0.223, labelIndex++);
  keycap(0.04, 0.47, 1.61, null, true);
  for (let col = 0; col < 4; col++)
    keycap(1.0 + col * 0.235, 0.47, 0.201, labelIndex++);
  lifted(keyboard, 0.2);

  const mouse = group(2.3, 0.29, 1.38);
  mouse.rotation.y = -0.16;
  const mouseShape = mesh(
    new THREE.SphereGeometry(1, 40, 24),
    mat.white,
    0,
    0,
    0,
    mouse,
  );
  mouseShape.scale.set(0.36, 0.19, 0.52);
  interactables.push(mouseShape);
  box(0.025, 0.014, 0.42, mat.silver, 0, 0.173, -0.11, mouse, 0.007);
  const wheel = cylinder(0.055, 0.055, 0.055, mat.blue, 0, 0.175, -0.17, mouse);
  wheel.rotation.z = Math.PI / 2;
  lifted(mouse, 0.23);

  // A compact laptop with a terminal sits alongside the main display.
  const laptop = group(-2.63, 0.24, 0.49);
  laptop.rotation.y = 0.3;
  box(1.6, 0.09, 1.07, mat.silver, 0, 0, 0, laptop, 0.045);
  box(1.44, 0.017, 0.44, mat.screenEdge, 0, 0.059, -0.18, laptop, 0.008);
  for (let row = 0; row < 3; row++)
    for (let col = 0; col < 10; col++)
      box(
        0.111,
        0.013,
        0.09,
        mat.dark,
        -0.6 + col * 0.133,
        0.074,
        -0.31 + row * 0.12,
        laptop,
        0.005,
      );
  box(0.46, 0.008, 0.27, mat.lavender, 0, 0.052, 0.3, laptop, 0.004);
  const lid = group(0, 0.63, -0.51, laptop);
  lid.rotation.x = -0.17;
  box(1.6, 1.13, 0.072, mat.silver, 0, 0, 0, lid, 0.036);
  const terminal = makeTexture(800, 560, (ctx) => {
    ctx.fillStyle = "#182139";
    ctx.fillRect(0, 0, 800, 560);
    ctx.fillStyle = "#7789bc";
    ctx.font = "20px monospace";
    ctx.fillText("~/hwantage/workspace", 35, 48);
    ctx.font = "27px monospace";
    [
      "$ npm run dev",
      "",
      "> ready in 248ms",
      "",
      "  Local: localhost:3000",
      "",
      "  Make something good.",
    ].forEach((line, i) => {
      ctx.fillStyle = i === 2 ? "#9fd7b6" : "#cdd9fc";
      ctx.fillText(line, 35, 125 + i * 51);
    });
  });
  const laptopScreen = panel(1.47, 0.98, terminal.texture, 0, 0, 0.042, lid);
  interactables.push(laptopScreen);
  lifted(laptop, 0.11);

  for (const x of [-2.98, 3.94]) {
    const speaker = group(x, 0.51, -0.15);
    box(0.39, 0.77, 0.38, mat.white, 0, 0, 0, speaker, 0.06);
    for (const [y, r] of [
      [-0.12, 0.12],
      [0.21, 0.059],
    ]) {
      const driver = cylinder(r, r, 0.017, mat.dark, 0, y, 0.2, speaker);
      driver.rotation.x = Math.PI / 2;
      const center = cylinder(
        r * 0.45,
        r * 0.45,
        0.025,
        mat.silver,
        0,
        y,
        0.214,
        speaker,
      );
      center.rotation.x = Math.PI / 2;
    }
  }
  const mug = group(-3.06, 0.43, 1.93);
  const profile = [
    [0.0, 0],
    [0.22, 0],
    [0.25, 0.04],
    [0.26, 0.51],
    [0.23, 0.54],
    [0.21, 0.51],
    [0.2, 0.08],
  ].map(([x, y]) => new THREE.Vector2(x, y - 0.27));
  mesh(new THREE.LatheGeometry(profile, 48), mat.blue, 0, 0, 0, mug);
  cylinder(0.205, 0.205, 0.01, mat.soil, 0, 0.195, 0, mug);
  const handle = mesh(
    new THREE.TorusGeometry(0.18, 0.046, 12, 40),
    mat.blue,
    0.28,
    0,
    0,
    mug,
  );
  handle.rotation.y = Math.PI / 2;

  const notebook = group(-4.48, 0.23, 1.92);
  notebook.scale.setScalar(0.78);
  notebook.rotation.y = -0.22;
  box(1.05, 0.08, 1.43, mat.blue, 0, 0, 0, notebook, 0.027);
  box(0.98, 0.045, 1.37, mat.porcelain, 0.012, 0.038, -0.012, notebook, 0.012);
  box(1.05, 0.015, 1.43, mat.lavender, 0, 0.073, 0, notebook, 0.007);
  box(0.045, 0.013, 1.42, mat.blue, 0.34, 0.09, 0, notebook, 0.006);
  const pen = cylinder(
    0.026,
    0.026,
    0.92,
    mat.silver,
    -0.05,
    0.13,
    0.05,
    notebook,
  );
  pen.rotation.x = Math.PI / 2;
  pen.rotation.z = 0.22;

  const headphones = group(3.89, 0.23, 1.61);
  headphones.rotation.y = -0.4;
  const band = mesh(
    new THREE.TorusGeometry(0.48, 0.054, 12, 48, Math.PI * 1.2),
    mat.blue,
    0,
    0.2,
    0,
    headphones,
  );
  band.rotation.x = -Math.PI / 2;
  band.rotation.z = -0.1 * Math.PI;
  for (const x of [-0.46, 0.46]) {
    box(0.2, 0.22, 0.37, mat.white, x, 0.04, 0.2, headphones, 0.09);
    box(
      0.08,
      0.21,
      0.31,
      mat.dark,
      x + (x > 0 ? -0.1 : 0.1),
      0.04,
      0.2,
      headphones,
      0.039,
    );
  }
  lifted(headphones, 0.1);

  const lamp = group(4.53, 0.17, -1.93);
  cylinder(0.4, 0.42, 0.07, mat.white, 0, 0, 0, lamp);
  tube(
    [
      [0, 0, 0],
      [0.02, 0.8, 0],
      [0.22, 1.85, -0.15],
      [-0.22, 2.9, 0],
      [-0.65, 2.92, 0.15],
    ],
    0.047,
    mat.silver,
    lamp,
  );
  const shade = group(-0.64, 2.86, 0.17, lamp);
  shade.rotation.z = -0.25;
  cylinder(0.13, 0.4, 0.36, mat.blue, 0, 0, 0, shade);
  cylinder(0.36, 0.36, 0.01, mat.light, 0, -0.19, 0, shade);

  const plant = group(-4.98, 0.48, -0.6);
  cylinder(0.37, 0.27, 0.66, mat.porcelain, 0, 0, 0, plant);
  cylinder(0.331, 0.331, 0.01, mat.soil, 0, 0.326, 0, plant);
  for (let i = 0; i < 7; i++) {
    const angle = i * 2.4,
      height = 0.64 + (i % 3) * 0.17;
    const x = Math.cos(angle) * 0.33,
      z = Math.sin(angle) * 0.33;
    tube(
      [
        [0, 0.32, 0],
        [x * 0.4, height * 0.8, z * 0.4],
        [x, height, z],
      ],
      0.013,
      mat.green,
      plant,
    );
    const leaf = mesh(
      new THREE.SphereGeometry(1, 16, 12),
      mat.green,
      x * 1.2,
      height + 0.11,
      z * 1.2,
      plant,
    );
    leaf.scale.set(0.13, 0.3, 0.043);
    leaf.rotation.set(0.4 * Math.sin(angle), angle, 0.5 * Math.cos(angle));
  }

  tube(
    [
      [-0.55, 0.2, -0.8],
      [-0.7, 0.16, -2.2],
      [-2.1, 0.15, -2.42],
      [-3.91, 0.3, -1.92],
    ],
    0.022,
    mat.silver,
  );
  tube(
    [
      [2.85, 0.18, -1.2],
      [2.4, 0.15, -2.3],
      [0.6, 0.15, -2.44],
      [-2.4, 0.16, -2.4],
    ],
    0.018,
    mat.silver,
  );
  tube(
    [
      [-0.55, 0.25, 0.68],
      [-0.75, 0.16, 0.4],
      [-1.8, 0.15, 0.34],
      [-2.05, 0.15, -0.8],
    ],
    0.019,
    mat.silver,
  );

  const hub = group(-4.4, 0.31, 0.58);
  box(1.42, 0.27, 0.78, mat.white, 0, 0, 0, hub, 0.055);
  box(1.32, 0.18, 0.021, mat.silver, 0, -0.01, 0.398, hub, 0.01);
  const hubLabel = makeTexture(1024, 256, (ctx) => {
    ctx.fillStyle = "#eff3fa";
    ctx.fillRect(0, 0, 1024, 256);
    ctx.fillStyle = "#3932dc";
    ctx.font = "bold 54px monospace";
    ctx.fillText("WORKSPACE / LINK", 48, 108);
    ctx.fillStyle = "#67738c";
    ctx.font = "30px monospace";
    ctx.fillText("01    02    03    04", 64, 202);
  });
  const label = panel(1.22, 0.3, hubLabel.texture, 0, 0.138, 0, hub);
  label.rotation.x = -Math.PI / 2;
  const ledOn = new THREE.MeshBasicMaterial({
    color: 0x71c6c0,
    toneMapped: false,
  });
  for (let i = 0; i < 4; i++) {
    const x = -0.47 + i * 0.315;
    box(0.24, 0.115, 0.03, mat.dark, x, -0.012, 0.416, hub, 0.012);
    box(0.17, 0.066, 0.025, mat.soil, x, -0.018, 0.434, hub, 0.005);
    for (let pin = 0; pin < 6; pin++)
      box(
        0.009,
        0.024,
        0.013,
        mat.silver,
        x - 0.064 + pin * 0.025,
        0.019,
        0.452,
        hub,
        0.003,
      );
    box(
      0.026,
      0.018,
      0.011,
      i === 0 ? ledOn : mat.lavender,
      x + 0.082,
      0.073,
      0.421,
      hub,
      0.003,
    );
  }
  box(0.19, 0.087, 0.16, mat.blue, -0.47, -0.012, 0.479, hub, 0.013);

  // A signal is revealed along one continuous route, then fans out to the desk.
  const links = [];
  const signalMaterial = new THREE.MeshBasicMaterial({
    color: 0x3932dc,
    toneMapped: false,
  });
  const haloMaterial = new THREE.MeshBasicMaterial({
    color: 0x7378ff,
    transparent: true,
    opacity: 0.18,
    depthWrite: false,
    toneMapped: false,
  });
  const unlitMaterial = new THREE.MeshStandardMaterial({
    color: 0x9daed1,
    roughness: 0.5,
  });
  function signalLink(points, from, to, branch = false) {
    const curve = new THREE.CatmullRomCurve3(
      points.map((point) => new THREE.Vector3(...point)),
      false,
      "centripetal",
    );
    const segments = branch ? 96 : 160;
    const cable = mesh(
      new THREE.TubeGeometry(curve, segments, 0.012, 8, false),
      unlitMaterial,
      0,
      0,
      0,
    );
    const core = mesh(
      new THREE.TubeGeometry(curve, segments, 0.027, 8, false),
      signalMaterial,
      0,
      0,
      0,
    );
    const halo = mesh(
      new THREE.TubeGeometry(curve, segments, 0.068, 8, false),
      haloMaterial,
      0,
      0,
      0,
    );
    // Decorative signal paths do not need animated shadows.
    cable.castShadow = core.castShadow = halo.castShadow = false;
    core.geometry.setDrawRange(0, 0);
    halo.geometry.setDrawRange(0, 0);
    links.push({ curve, core, halo, cable, segments, from, to, branch });
  }
  signalLink(hubComputerRoute, 0.11, 0.26);
  signalLink(computerKeyboardRoute, 0.26, 0.38);
  signalLink(
    [
      [-2.42, 0.3, 1.33],
      [-2.4, 0.2, 1.93],
      [-1.8, 0.18, 2.15],
      [-0.3, 0.18, 2.22],
      [1.4, 0.18, 2.16],
      [2.1, 0.22, 1.97],
      [2.3, 0.31, 1.84],
    ],
    0.38,
    0.49,
  );
  signalLink(
    [
      [2.3, 0.31, 1.84],
      [2.85, 0.23, 1.83],
      [2.98, 0.22, 1.2],
      [2.58, 0.24, 0.74],
      [2.06, 0.22, 0.82],
      [1.76, 0.2, 1.4],
      [2.02, 0.2, 1.98],
      [2.9, 0.2, 2.24],
      [3.89, 0.25, 2.13],
    ],
    0.49,
    0.59,
  );
  signalLink(
    [
      [3.89, 0.25, 2.13],
      [4.65, 0.24, 2.25],
      [4.96, 0.28, 1.57],
      [4.5, 0.31, 0.87],
      [3.57, 0.3, 0.8],
      [3.03, 0.26, 1.38],
      [3.23, 0.21, 2.04],
      [3.94, 0.22, 2.46],
      [4.83, 0.23, 1.94],
      [4.6, 0.3, 0.6],
      [3.94, 0.3, 0.12],
    ],
    0.59,
    0.69,
  );
  signalLink(
    [
      [3.94, 0.3, 0.12],
      [4.28, 0.36, 0.18],
      [4.32, 0.78, 0.18],
      [4, 1.01, 0.18],
      [3.6, 0.77, 0.18],
      [3.64, 0.32, 0.18],
      [3.94, 0.22, 0.18],
      [3.2, 0.2, -0.32],
      [2.05, 0.22, -0.65],
      [0.95, 0.24, -0.3],
      [-0.55, 0.25, -0.3],
      [-0.55, 0.63, -0.7],
    ],
    0.69,
    0.8,
  );
  const origin = [-0.55, 0.63, -0.7];
  signalLink(
    [origin, [0.3, 0.42, -1.82], [1.72, 0.35, -1.93], [2.85, 0.61, -1.11]],
    0.81,
    0.93,
    true,
  );
  signalLink(
    [origin, [-1.2, 0.34, -0.31], [-1.9, 0.32, 0.06], [-2.63, 0.48, -0.32]],
    0.83,
    0.94,
    true,
  );
  signalLink(
    [origin, [-1.05, 0.25, 0.65], [-1.85, 0.23, 1.99], [-3.06, 0.18, 1.93]],
    0.85,
    0.96,
    true,
  );
  signalLink(
    [
      origin,
      [-1.44, 0.31, -2.36],
      [-3.6, 0.26, -2.43],
      [-5.08, 0.28, -1.28],
      [-4.98, 0.75, -0.6],
    ],
    0.86,
    0.97,
    true,
  );
  signalLink(
    [origin, [0.4, 0.26, -2.4], [3.26, 0.24, -2.43], [4.53, 0.22, -1.93]],
    0.88,
    0.99,
    true,
  );
  const signalHead = mesh(
    new THREE.SphereGeometry(0.07, 20, 12),
    new THREE.MeshBasicMaterial({ color: 0xd0eaff, toneMapped: false }),
    0,
    0,
    0,
  );
  const signalHalo = mesh(
    new THREE.SphereGeometry(0.15, 16, 10),
    new THREE.MeshBasicMaterial({
      color: 0x7878ff,
      transparent: true,
      opacity: 0.2,
      depthWrite: false,
      toneMapped: false,
    }),
    0,
    0,
    0,
  );
  signalHead.castShadow = signalHalo.castShadow = false;
  function updateSignal(progress) {
    let active = null;
    for (const link of links) {
      const amount = THREE.MathUtils.clamp(
        (progress - link.from) / (link.to - link.from),
        0,
        1,
      );
      const indices = Math.floor(amount * link.segments) * 8 * 6;
      link.core.geometry.setDrawRange(0, indices);
      link.halo.geometry.setDrawRange(0, indices);
      link.cable.visible = progress > 0.07;
      if (!link.branch && amount > 0 && amount < 1) active = { link, amount };
    }
    signalHead.visible = signalHalo.visible = Boolean(active);
    if (active) {
      active.link.curve.getPointAt(active.amount, signalHead.position);
      signalHalo.position.copy(signalHead.position);
    }
    studio.dataset.signal = progress.toFixed(3);
  }

  const floor = new THREE.Mesh(
    new THREE.PlaneGeometry(100, 100),
    new THREE.ShadowMaterial({ opacity: 0.12 }),
  );
  floor.rotation.x = -Math.PI / 2;
  floor.position.y = -1.65;
  floor.receiveShadow = true;
  scene.add(floor);

  // Repeated keys, pins and ventilation slots share GPU draw calls. The source
  // meshes stay in the graph for accurate picking and keyboard hover movement.
  const meshBatches = [];
  const repeatedMeshes = new Map();
  world.updateMatrixWorld(true);
  world.traverse((object) => {
    if (
      !object.isMesh ||
      Array.isArray(object.material) ||
      object.material.transparent
    )
      return;
    const key = [
      object.geometry.uuid,
      object.material.uuid,
      object.castShadow,
      object.receiveShadow,
    ].join(":");
    if (!repeatedMeshes.has(key)) repeatedMeshes.set(key, []);
    repeatedMeshes.get(key).push(object);
  });
  const instanceMatrix = new THREE.Matrix4();
  const inverseWorld = new THREE.Matrix4();
  function updateMeshBatch(batch) {
    world.updateWorldMatrix(true, false);
    inverseWorld.copy(world.matrixWorld).invert();
    batch.objects.forEach((object, index) => {
      object.updateWorldMatrix(true, false);
      instanceMatrix.multiplyMatrices(inverseWorld, object.matrixWorld);
      batch.mesh.setMatrixAt(index, instanceMatrix);
    });
    batch.mesh.instanceMatrix.needsUpdate = true;
    batch.mesh.computeBoundingSphere();
  }
  for (const objects of repeatedMeshes.values()) {
    if (objects.length < 3) continue;
    const source = objects[0];
    const mesh = new THREE.InstancedMesh(
      source.geometry,
      source.material,
      objects.length,
    );
    mesh.castShadow = source.castShadow;
    mesh.receiveShadow = source.receiveShadow;
    const batch = {
      mesh,
      objects,
      dynamic: objects.some((object) => object.userData.key),
    };
    updateMeshBatch(batch);
    objects.forEach((object) => {
      object.visible = false;
    });
    world.add(mesh);
    meshBatches.push(batch);
  }
  let batchedHoveredKey = null;

  function changeScreen() {
    screenMode = (screenMode + 1) % modes.length;
    drawEditor(editor.context, screenMode);
    editor.texture.needsUpdate = true;
    screenButton.dataset.mode = modes[screenMode];
    announcement.textContent = `모니터 화면: ${modes[screenMode]}`;
    requestSceneFrame();
  }
  screenButton.addEventListener("click", changeScreen);

  let paused = false,
    visible = true,
    frameId = 0,
    previousTime = 0;
  let targetPointerX = 0,
    targetPointerY = 0,
    pointerX = 0,
    pointerY = 0;
  let smoothProgress = scrollProgress,
    dragRotation = 0,
    targetDragRotation = 0;
  let pointerDown = null,
    hoveredKey = null;
  const raycaster = new THREE.Raycaster();
  const pointer = new THREE.Vector2();
  const lookTarget = new THREE.Vector3();
  const cameraEye = new THREE.Vector3();
  const cameraOffset = new THREE.Vector3();
  const startedAt = performance.now();
  let entrance = reducedMotion.matches ? 1 : 0;
  const useMotion = () => !paused && !reducedMotion.matches;

  function pick(event) {
    const rect = renderer.domElement.getBoundingClientRect();
    pointer.set(
      ((event.clientX - rect.left) / rect.width) * 2 - 1,
      (-(event.clientY - rect.top) / rect.height) * 2 + 1,
    );
    raycaster.setFromCamera(pointer, camera);
    return raycaster.intersectObjects(interactables, false)[0]?.object;
  }
  studio.addEventListener("pointermove", (event) => {
    if (event.pointerType === "touch") return;
    const rect = studio.getBoundingClientRect();
    targetPointerX = ((event.clientX - rect.left) / rect.width - 0.5) * 2;
    targetPointerY = ((event.clientY - rect.top) / rect.height - 0.5) * 2;
    if (pointerDown && useMotion()) {
      targetDragRotation = THREE.MathUtils.clamp(
        pointerDown.rotation + (event.clientX - pointerDown.x) * 0.004,
        -0.65,
        0.65,
      );
      if (Math.abs(event.clientX - pointerDown.x) > 4)
        pointerDown.dragged = true;
    }
    const hit = pick(event);
    hoveredKey = useMotion() ? hit?.userData.key || null : null;
    studio.style.cursor = pointerDown?.dragged
      ? "grabbing"
      : hit
        ? "pointer"
        : "grab";
    requestSceneFrame();
  });
  studio.addEventListener("pointerleave", () => {
    targetPointerX = 0;
    targetPointerY = 0;
    hoveredKey = null;
    requestSceneFrame();
  });
  studio.addEventListener("pointerdown", (event) => {
    if (event.pointerType === "mouse" && event.button === 0) {
      pointerDown = {
        x: event.clientX,
        rotation: targetDragRotation,
        dragged: false,
      };
      studio.setPointerCapture(event.pointerId);
    }
  });
  studio.addEventListener("pointerup", (event) => {
    if (!pointerDown?.dragged && pick(event)) changeScreen();
    pointerDown = null;
    studio.style.cursor = "grab";
    if (studio.hasPointerCapture(event.pointerId))
      studio.releasePointerCapture(event.pointerId);
    requestSceneFrame();
  });
  studio.addEventListener("pointercancel", () => {
    pointerDown = null;
    hoveredKey = null;
    requestSceneFrame();
  });
  motionButton.addEventListener("click", () => {
    paused = !paused;
    updateScroll();
    motionButton.setAttribute("aria-pressed", String(paused));
    motionButton.textContent = paused ? "움직임 재생" : "움직임 멈춤";
    announcement.textContent = paused
      ? "작업실 움직임을 멈췄습니다."
      : "작업실 움직임을 재생합니다.";
    requestSceneFrame();
  });

  let viewportWidth = 0,
    viewportHeight = 0,
    overviewTop = 0,
    overviewBottom = 0;
  let shadowRotation = Infinity,
    shadowPosition = Infinity,
    shadowKey = null;
  function resize() {
    const { width, height } = studio.getBoundingClientRect();
    if (!width || !height) return;
    if (width !== viewportWidth || height !== viewportHeight) {
      viewportWidth = width;
      viewportHeight = height;
      renderer.setSize(width, height, false);
    }
    const styles = getComputedStyle(studio);
    overviewTop =
      (parseFloat(styles.getPropertyValue("--studio-top")) / 100) * height;
    overviewBottom = parseFloat(styles.getPropertyValue("--studio-bottom"));
    requestSceneFrame();
  }
  function render(time) {
    frameId = 0;
    if (!visible || document.hidden) return;
    const delta = Math.min((time - previousTime) / 1000 || 0.016, 0.05);
    previousTime = time;
    const damping = 1 - Math.exp(-delta * 6);
    const motion = useMotion();
    if (motion) {
      smoothProgress += (scrollProgress - smoothProgress) * damping;
      pointerX += (targetPointerX - pointerX) * damping;
      pointerY += (targetPointerY - pointerY) * damping;
      dragRotation += (targetDragRotation - dragRotation) * damping;
    } else if (reducedMotion.matches) {
      smoothProgress = 0;
      pointerX = pointerY = dragRotation = 0;
    }
    entrance = motion ? Math.min(1, (time - startedAt) / 1600) : 1;
    const easeEntrance = 1 - Math.pow(1 - entrance, 3);
    const p = reducedMotion.matches ? 0 : smoothProgress;
    updatePresentation(p);
    const open = THREE.MathUtils.smoothstep(p, 0.02, 0.11);
    const top = overviewTop * (1 - open);
    const viewHeight = Math.max(
      1,
      viewportHeight - top - overviewBottom * (1 - open),
    );
    // Expand the camera's view on a stable full-screen drawing buffer. Resizing
    // that buffer on scroll clears it and causes expensive GPU reallocations.
    const framing = sampleJourney(p, cameraEye, lookTarget);
    camera.fov = framing.fov;
    camera.setViewOffset(
      viewportWidth,
      viewHeight,
      0,
      -top,
      viewportWidth,
      viewportHeight,
    );
    const mobile = innerWidth <= 800;
    const overview = 1 - THREE.MathUtils.smoothstep(p, 0.025, 0.115);
    cameraOffset.copy(cameraEye).sub(lookTarget);
    const horizontalFit =
      framing.span /
      (2 *
        Math.tan(THREE.MathUtils.degToRad(framing.fov / 2)) *
        cameraOffset.length() *
        camera.aspect);
    const fit = Math.max(
      1,
      (overview * (mobile ? 1.24 : 1.56)) / camera.aspect,
      horizontalFit,
    );
    cameraOffset.multiplyScalar(fit);
    camera.position.copy(lookTarget).add(cameraOffset);
    camera.position.x += pointerX * (0.12 + overview * 0.53);
    camera.position.y +=
      pointerY * (0.07 + overview * 0.25) + (1 - easeEntrance) * 1.7;
    camera.lookAt(lookTarget);
    world.rotation.y = (pointerX * 0.04 + dragRotation) * overview;
    world.position.y = -(1 - easeEntrance) * 0.38;
    for (const { object, y, amount } of liftObjects) object.position.y = y;
    for (const key of keyMeshes)
      key.position.y = key === hoveredKey ? 0.125 : 0.153;
    if (hoveredKey !== batchedHoveredKey) {
      for (const batch of meshBatches)
        if (batch.dynamic) updateMeshBatch(batch);
      batchedHoveredKey = hoveredKey;
    }
    if (
      Math.abs(world.rotation.y - shadowRotation) > 0.002 ||
      Math.abs(world.position.y - shadowPosition) > 0.002 ||
      hoveredKey !== shadowKey
    ) {
      renderer.shadowMap.needsUpdate = true;
      shadowRotation = world.rotation.y;
      shadowPosition = world.position.y;
      shadowKey = hoveredKey;
    }
    updateSignal(p);
    updateJourneyCopy(p);
    renderer.render(scene, camera);
    studio.dataset.progress = p.toFixed(3);
    studio.dataset.camera = camera.position
      .toArray()
      .map((n) => n.toFixed(3))
      .join(",");
    const unsettled =
      Math.abs(scrollProgress - smoothProgress) > 0.0002 ||
      Math.abs(targetPointerX - pointerX) > 0.001 ||
      Math.abs(targetPointerY - pointerY) > 0.001 ||
      Math.abs(targetDragRotation - dragRotation) > 0.001;
    if (motion && (entrance < 1 || unsettled)) requestSceneFrame();
  }
  requestSceneFrame = () => {
    if (!frameId && visible && !document.hidden)
      frameId = requestAnimationFrame(render);
  };
  const resizeObserver = new ResizeObserver(resize);
  resizeObserver.observe(studio);
  const visibilityObserver = new IntersectionObserver(([entry]) => {
    visible = entry.isIntersecting;
    if (visible) requestSceneFrame();
    else if (frameId) {
      cancelAnimationFrame(frameId);
      frameId = 0;
    }
  });
  visibilityObserver.observe(track);
  document.addEventListener("visibilitychange", requestSceneFrame);
  reducedMotion.addEventListener("change", requestSceneFrame);
  renderer.domElement.addEventListener("webglcontextlost", (event) => {
    event.preventDefault();
    visible = false;
    if (frameId) cancelAnimationFrame(frameId);
    frameId = 0;
    renderer.domElement.hidden = true;
    showFallback("WebGL context lost");
  });
  renderer.domElement.addEventListener("webglcontextrestored", () => {
    visible = true;
    renderer.domElement.hidden = false;
    document.querySelector(".studio-fallback").hidden = true;
    screenButton.hidden = false;
    motionButton.hidden = reducedMotion.matches;
    track.classList.remove("static-workspace");
    chapterCopy.hidden = false;
    studio.dataset.ready = "true";
    renderer.shadowMap.autoUpdate = false;
    renderer.shadowMap.needsUpdate = true;
    resize();
    updateScroll();
    requestSceneFrame();
  });
  document.querySelector(".studio-loading").hidden = true;
  motionButton.hidden = reducedMotion.matches;
  reducedMotion.addEventListener("change", () => {
    motionButton.hidden = reducedMotion.matches;
  });
  studio.dataset.ready = "true";
  resize();
  document.fonts.ready.then(() => {
    drawEditor(editor.context, screenMode);
    editor.texture.needsUpdate = true;
    requestSceneFrame();
  });
}

try {
  createWorkspace();
} catch (error) {
  showFallback(error);
}
