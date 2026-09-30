import * as THREE from "three";
import { RoundedBoxGeometry } from "./vendor/RoundedBoxGeometry.js";
import { RoomEnvironment } from "./vendor/RoomEnvironment.js";

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
function updateScroll() {
  const rect = track.getBoundingClientRect();
  scrollProgress = THREE.MathUtils.clamp(
    -rect.top / Math.max(1, track.offsetHeight - innerHeight),
    0,
    1,
  );
  const exit = reducedMotion.matches
    ? 0
    : THREE.MathUtils.smoothstep(scrollProgress, 0.08, 0.43);
  const enter = reducedMotion.matches
    ? 0
    : THREE.MathUtils.smoothstep(scrollProgress, 0.42, 0.76);
  heroCopy.style.opacity = String(1 - exit);
  heroCopy.style.transform = `perspective(1200px) translateY(${-exit * 70}px) rotateX(${exit * 10}deg)`;
  chapterCopy.style.opacity = String(enter);
  chapterCopy.style.transform = `translateY(${(1 - enter) * 25}px)`;
  progressBar.style.transform = `scaleX(${scrollProgress})`;
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
}

function createWorkspace() {
  const renderer = new THREE.WebGLRenderer({
    antialias: true,
    alpha: false,
    powerPreference: "low-power",
  });
  renderer.setPixelRatio(
    Math.min(devicePixelRatio, innerWidth < 800 ? 1.5 : 1.75),
  );
  renderer.setClearColor(0xd9e8f1, 1);
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
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
  for (let col = 0; col < 4; col++)
    keycap(-1.53 + col * 0.255, 0.47, 0.223, labelIndex++);
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

  const notebook = group(-4.26, 0.23, 1.35);
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

  const plant = group(-4.78, 0.48, 0.2);
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

  const floor = new THREE.Mesh(
    new THREE.PlaneGeometry(100, 100),
    new THREE.ShadowMaterial({ opacity: 0.12 }),
  );
  floor.rotation.x = -Math.PI / 2;
  floor.position.y = -1.65;
  floor.receiveShadow = true;
  scene.add(floor);

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
    motionButton.setAttribute("aria-pressed", String(paused));
    motionButton.textContent = paused ? "움직임 재생" : "움직임 멈춤";
    announcement.textContent = paused
      ? "작업실 움직임을 멈췄습니다."
      : "작업실 움직임을 재생합니다.";
    requestSceneFrame();
  });

  function resize() {
    const { width, height } = studio.getBoundingClientRect();
    if (!width || !height) return;
    renderer.setSize(width, height, false);
    camera.aspect = width / height;
    camera.updateProjectionMatrix();
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
    const middle = THREE.MathUtils.smoothstep(p, 0, 0.6);
    const end = THREE.MathUtils.smoothstep(p, 0.55, 1);
    const mobile = innerWidth <= 800;
    const fit = Math.max(1, (mobile ? 1.24 + end * 0.3 : 1.56) / camera.aspect);
    const cameraX = (10 - middle * 5.1 + end * 2.2) * fit;
    const cameraY = (8.8 - middle * 3.3 + end * 0.2) * fit;
    const cameraZ = (13.5 - middle * 4.4 + end * 1.8) * fit;
    camera.position.set(
      cameraX + pointerX * 0.65,
      cameraY + pointerY * 0.32 + (1 - easeEntrance) * 1.7,
      cameraZ,
    );
    lookTarget.set(mobile ? -0.1 : -end * 2.4, 0.55 + middle * 0.35, 0);
    camera.lookAt(lookTarget);
    world.rotation.y = pointerX * 0.04 + dragRotation;
    world.position.y = -(1 - easeEntrance) * 0.38;
    for (const { object, y, amount } of liftObjects)
      object.position.y = y + end * amount;
    for (const key of keyMeshes)
      key.position.y = key === hoveredKey ? 0.125 : 0.153;
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
    renderer.domElement.hidden = true;
    showFallback("WebGL context lost");
  });
  renderer.domElement.addEventListener("webglcontextrestored", () => {
    visible = true;
    renderer.domElement.hidden = false;
    document.querySelector(".studio-fallback").hidden = true;
    screenButton.hidden = false;
    motionButton.hidden = reducedMotion.matches;
    studio.dataset.ready = "true";
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
