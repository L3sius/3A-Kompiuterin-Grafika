import * as THREE from "https://unpkg.com/three@0.123.0/build/three.module.js";
import { TrackballControls } from "https://unpkg.com/three@0.123.0/examples/jsm/controls/TrackballControls.js";
import { ConvexGeometry } from "https://unpkg.com/three@0.123.0/examples/jsm/geometries/ConvexGeometry.js";

const scene = new THREE.Scene();

// create and set camera
var camera = new THREE.PerspectiveCamera(
  45,
  window.innerWidth / window.innerHeight,
  10,
  1000
);
camera.position.x = 40;
camera.position.y = 40;
camera.position.z = 40;
camera.lookAt(scene.position);

// create renderer
var renderer = new THREE.WebGLRenderer();
renderer.setClearColor(0xeeeeee, 1.0);
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;

// add to html
$("#cylinder-output").append(renderer.domElement);
// for camera movement
var trackballControls = new TrackballControls(camera, renderer.domElement);

// add lighting
const ambientLight = new THREE.AmbientLight(0x404040, 1.2);
var spotLight = new THREE.SpotLight(0xffffff, 1.2);
spotLight.angle = (Math.PI / 2) * 0.5;
spotLight.position.set(-20, 70, 60);
spotLight.castShadow = true;
scene.add(ambientLight);
scene.add(spotLight);

// spotlight helper
// const spotLightHelper = new THREE.SpotLightHelper(spotLight);
// scene.add(spotLightHelper);

// add plane
var planeGeometry = new THREE.PlaneGeometry(50, 50);
var planeMaterial = new THREE.MeshLambertMaterial({ color: "grey" });
planeMaterial.side = THREE.DoubleSide;
var plane = new THREE.Mesh(planeGeometry, planeMaterial);
// to turn on shadow
plane.receiveShadow = true;
plane.rotation.x = 0.5 * Math.PI;
plane.position.x = 0;
plane.position.y = 0;
plane.position.z = 0;
scene.add(plane);

var controllers = new (function () {
  this.pointsAmount = 5000;
  this.isPerfect = 0;

  this.shape = function () {
    var options = {
      pointsAmount: controllers.pointsAmount,
      isRandom: controllers.isPerfect,
    };
    drawCylinder(options);
  };
})();

var gui = new dat.GUI();
gui
  .add(controllers, "pointsAmount", 100, 1000000)
  .step(1)
  .onChange(controllers.shape);
gui.add(controllers, "isPerfect", 0, 1).step(1).onChange(controllers.shape);
controllers.shape();

var mesh;

function drawCylinder(options) {
  // if updating gui
  if (mesh) scene.remove(mesh);

  // lower/upper radius
  const R2 = 7;
  const R1 = 8;
  // cylinder height
  const h = 20;
  // cylinder position height
  const position = 12;
  const PreciseForm = options.isRandom;
  let points;

  if (PreciseForm > 0) points = precisePoints(500, R1, R2, h);
  else points = randomPoints(R1, R2, options.pointsAmount, h);

  let CylinderPointsFiltered = filterPoints(R1, R2, points, h);

  const geometry = new ConvexGeometry(CylinderPointsFiltered);

  geometry.faceVertexUvs[0] = [];

  var faces = geometry.faces;

  var wireFrameMat = new THREE.MeshBasicMaterial();
  wireFrameMat.wireframe = true;
  // scene.add(wireFrameMat);

  let u = [3];
  //how often texture is printed
  const textureScale = 2;
  for (var i = 0; i < faces.length; i++) {
    var v1 = geometry.vertices[faces[i].a],
      v2 = geometry.vertices[faces[i].b],
      v3 = geometry.vertices[faces[i].c];

    u[0] = getU(v1.x, v1.z, textureScale);
    u[1] = getU(v2.x, v2.z, textureScale);
    u[2] = getU(v3.x, v3.z, textureScale);

    geometry.faceVertexUvs[0].push([
      new THREE.Vector2(u[0], getV(v1.y, h)),
      new THREE.Vector2(u[1], getV(v2.y, h)),
      new THREE.Vector2(u[2], getV(v3.y, h)),
    ]);
  }
  geometry.uvsNeedUpdate = true;

  const texture = new THREE.TextureLoader().load("./textures/black_white.png");
  texture.wrapS = THREE.RepeatWrapping;
  const material = new THREE.MeshPhongMaterial({ map: texture });

  mesh = new THREE.Mesh(geometry, material);
  mesh.position.y = position;
  mesh.castShadow = true;
  scene.add(mesh);
}

controllers.shape();
render();

function render() {
  renderer.render(scene, camera);
  requestAnimationFrame(render);
  trackballControls.update();
}

function random(min, max) {
  return Math.random() * (max - min) + min;
}

// Check if points are above plane
function filterPoints(R1, R2, points, h) {
  let filteredPoints = [];
  let m = Math.pow(R1 - R2, 2) / Math.pow(h, 2);
  let d = ((h / 2) * (R1 + R2)) / (R1 - R2);
  points.forEach((v) => {
    if (
      Math.pow(v.x, 2) - m * Math.pow(v.y - d, 2) + Math.pow(v.z, 2) <= 0 &&
      v.y >= -h / 2 &&
      v.y <= h / 2
    )
      filteredPoints.push(v);
  });
  return filteredPoints;
}

// R1, R2, pointsAmount, height
function randomPoints(R1, R2, pointsAmount, height) {
  var points = [];
  var v = 1 / 2 - Math.atan(height / R1 / Math.PI);
  for (let i = 0; i < pointsAmount; i++) {
    let x = random(-((1 - v) * R1 + v * R2), (1 - v) * R1 + v * R2);
    let y = random(-((height / 2) * (2 * v - 1)), (height / 2) * (2 * v - 1));
    let z = random(-((1 - v) * R1 + v * R2), (1 - v) * R1 + v * R2);
    points.push(new THREE.Vector3(x, y, z));
  }
  return points;
}

function precisePoints(precision, R1, R2, h) {
  var points = [];
  const a = 1 / precision;
  for (let u = -1; u < 1; u += a) {
    let phi = Math.PI * u;
    const b = 1 / precision;
    for (let v = -1; v < 1; v += b) {
      let x = ((1 - v) * R1 + v * R2) * Math.sin(phi);
      let y = (h / 2) * (2 * v - 1);
      let z = ((1 - v) * R1 + v * R2) * Math.cos(phi);
      points.push(new THREE.Vector3(x, y, z));
    }
  }
  return points;
}

// functions for get U/V
function getU(x, z, s) {
  let phi = Math.atan2(z, x);
  return ((phi + Math.PI) / (2 * Math.PI)) * s;
}

function getV(y, h) {
  return (y + h / 2) / h;
}
