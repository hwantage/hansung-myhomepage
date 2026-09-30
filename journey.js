import * as THREE from "three";

// Shared world coordinates keep visible connectors and signal endpoints aligned.
export const computerPorts = {
  network: { plug: [-4.19, 1.27, -2.11], cable: [-4.19, 1.27, -2.19] },
  usb: { plug: [-4.19, 0.9, -2.11], cable: [-4.19, 0.9, -2.19] },
};
export const hubComputerRoute = [
  [-4.87, 0.3, 1.13],
  [-5.18, 0.22, 1.34],
  [-5.46, 0.21, 0.72],
  [-5.48, 0.22, -0.72],
  [-5.3, 0.28, -2.12],
  [-4.64, 0.43, -2.48],
  [-4.19, 0.87, -2.46],
  [-4.19, 1.27, -2.36],
  computerPorts.network.cable,
];
export const computerKeyboardRoute = [
  computerPorts.network.cable,
  [-4.19, 1.27, -1.95],
  [-4.19, 0.9, -1.95],
  computerPorts.usb.cable,
  [-3.7, 0.43, -2.42],
  [-3.13, 0.2, -1.97],
  [-3.08, 0.18, -0.68],
  [-3.21, 0.18, 0.47],
  [-2.88, 0.18, 1.59],
  [-2.42, 0.3, 1.33],
];

// Camera poses live in the same coordinates as the actual desktop devices.
// Extra poses between stops give the audio section an orbit, rather than a cut.
const poses = [
  { at: 0, eye: [10, 8.8, 13.5], target: [0, 0.55, 0], fov: 34, span: 12 },
  { at: 0.065, eye: [-1.5, 7, 11], target: [-2.7, 0.6, 0.5], fov: 37, span: 7 },
  {
    at: 0.14,
    eye: [-6.9, 2.7, 3.8],
    target: [-4.4, 0.33, 0.58],
    fov: 40,
    span: 2.5,
  },
  {
    at: 0.205,
    eye: [-7.3, 3.4, -1.1],
    target: [-4.9, 0.75, -1.7],
    fov: 42,
    span: 3.2,
  },
  {
    at: 0.26,
    eye: [-6.1, 3.1, -5.5],
    target: [-4.0, 1.05, -1.92],
    fov: 40,
    span: 2.9,
  },
  {
    at: 0.315,
    eye: [-6.8, 4.7, 1.6],
    target: [-3.2, 0.75, -0.2],
    fov: 44,
    span: 4.3,
  },
  {
    at: 0.38,
    eye: [-1.8, 2.9, 4.65],
    target: [-0.55, 0.3, 1.33],
    fov: 46,
    span: 4.4,
  },
  {
    at: 0.49,
    eye: [3.25, 1.8, 3.65],
    target: [2.3, 0.3, 1.38],
    fov: 40,
    span: 1.9,
  },
  {
    at: 0.57,
    eye: [5.7, 2.3, 3.5],
    target: [3.89, 0.35, 1.61],
    fov: 42,
    span: 2.4,
  },
  {
    at: 0.63,
    eye: [6.2, 2.4, 0.6],
    target: [3.9, 0.35, 1],
    fov: 43,
    span: 2.5,
  },
  {
    at: 0.69,
    eye: [5.55, 2.1, 1.65],
    target: [3.94, 0.55, -0.15],
    fov: 40,
    span: 1.7,
  },
  {
    at: 0.8,
    eye: [1, 2.9, 4.8],
    target: [-0.55, 1.98, -0.85],
    fov: 40,
    span: 5.2,
  },
  { at: 0.91, eye: [-2.5, 6.8, 8], target: [0, 0.65, 0], fov: 40, span: 11.8 },
  { at: 1, eye: [8, 8.8, 14], target: [0, 0.65, 0], fov: 34, span: 12 },
];

export const journeyStops = [
  {
    at: 0.14,
    key: "hub",
    name: "Network hub",
    title: "It starts with a connection.",
    copy: "작은 신호 하나가 작업실을 깨웁니다. 허브에서 출발한 연결을 따라 들어가 보세요.",
  },
  {
    at: 0.26,
    key: "computer",
    name: "Computer",
    title: "A place to process ideas.",
    copy: "랜선은 컴퓨터 뒤쪽 포트로 들어갑니다. 신호를 받은 컴퓨터에서 키보드로, 다음 연결이 이어집니다.",
  },
  {
    at: 0.38,
    key: "keyboard",
    name: "Keyboard",
    title: "Thoughts become keystrokes.",
    copy: "키 하나, 코드 한 줄. 머릿속의 아이디어를 세상에 꺼내는 가장 작은 움직임입니다.",
  },
  {
    at: 0.49,
    key: "mouse",
    name: "Mouse",
    title: "Every detail finds its place.",
    copy: "연결은 마우스를 돌아 다음으로 이어집니다. 작은 선택들이 하나의 경험을 만듭니다.",
  },
  {
    at: 0.59,
    key: "headphones",
    name: "Headphones",
    title: "Find a little focus.",
    copy: "헤드폰을 감싸 흐르는 신호. 잠시 바깥의 소음을 내려놓고, 만들고 있는 것에 집중합니다.",
  },
  {
    at: 0.69,
    key: "speaker",
    name: "Speakers",
    title: "Let the rhythm carry it.",
    copy: "스피커를 휘감아 흐르는 연결처럼, 생각과 작업에도 자연스러운 리듬이 있습니다.",
  },
  {
    at: 0.8,
    key: "monitor",
    name: "Monitors",
    title: "Make it real. Make it clear.",
    copy: "모든 연결이 화면에 닿습니다. 만든 것이 보이고, 사람에게 닿는 경험이 됩니다.",
  },
  {
    at: 0.94,
    key: "connected",
    name: "Connected workspace",
    title: "A little world, all connected.",
    copy: "모니터에서 노트북과 다른 오브제로. 각자의 역할을 가진 작은 것들이 하나의 작업실을 이룹니다.",
  },
];

export function getJourneyStage(progress) {
  let index = 0;
  for (let i = 1; i < journeyStops.length; i++) {
    if (progress >= (journeyStops[i - 1].at + journeyStops[i].at) / 2)
      index = i;
  }
  return index;
}

const vector = (values) => new THREE.Vector3(...values);
const eyeSegments = [];
const targetSegments = [];
for (let i = 0; i < poses.length - 1; i++) {
  const neighbors = [
    poses[Math.max(0, i - 1)],
    poses[i],
    poses[i + 1],
    poses[Math.min(poses.length - 1, i + 2)],
  ];
  eyeSegments.push(
    new THREE.CatmullRomCurve3(
      neighbors.map((p) => vector(p.eye)),
      false,
      "centripetal",
    ),
  );
  targetSegments.push(
    new THREE.CatmullRomCurve3(
      neighbors.map((p) => vector(p.target)),
      false,
      "centripetal",
    ),
  );
}

export function sampleJourney(progress, eye, target) {
  const p = THREE.MathUtils.clamp(progress, 0, 1);
  let index = poses.length - 2;
  for (let i = 0; i < poses.length - 1; i++) {
    if (p <= poses[i + 1].at) {
      index = i;
      break;
    }
  }
  const a = poses[index],
    b = poses[index + 1];
  const t = (p - a.at) / (b.at - a.at);
  // Sampling the middle third keeps adjacent segments position-continuous.
  eyeSegments[index].getPoint((1 + t) / 3, eye);
  targetSegments[index].getPoint((1 + t) / 3, target);
  const blend = THREE.MathUtils.smoothstep(t, 0, 1);
  return {
    fov: THREE.MathUtils.lerp(a.fov, b.fov, blend),
    span: THREE.MathUtils.lerp(a.span, b.span, blend),
  };
}
