let renderer = null,
  scene = null,
  camera = null,
  geometry = null,
  orbitControls = null,
  distance = 5,
  screenShake = null,
  seconds = 0,
  cannonShotSound = null,
  asteroidImpactSound = null,
  asteroidHitSound = null,
  asteroidDestructionSound = null,
  asteroidMinorImpact = null,
  waitForNewAsteroid = 0,
  explosionsArray = [],
  bulletsArray = [],
  asteroidCount = 0,
  bulletCount = 0,
  asteroidsArray = [],
  elapsedTime = 0,
  score = 0,
  highScore = 0,
  gameOver = false,
  pause = true,
  gunHealth = 20, // players health
  outOfBoundsLimit = 600; // distance from the center of the world where the asteroid will be destroyed

// asteroid tunning
let asteroidConfig = {
  asteroidsDifficulty: 3, // less is more asteroids at once
  asteroidSpeed: 0.3, // More is faster speed
  fireRate: 0.03, // less is faster shooting
  bulletDamage: 10, // damage from every bullet to asteroid
  bulletSpeed: 5, // speed of the bullet
  asteroidDamage: 1, // how much an asteroid hit will deal
  scorePerAsteroidDestroyed: 10, // score per asteroid destroyed (lol)
  asteroidHealth: 100, // health of each asteroid
};

// camera tunning
let cameraControls = {
  movingLeft: false,
  movingUp: false,
  movingDown: false,
  movingRight: false,
  firing: false,
  slowMoving: false,
  cannonPOV: true, // false for orbit controls, true for cannon POV
  zoomedIn: false,
  dispersionAmount: 0.01,
  momentumUp: 0,
  momentumDown: 0,
  momentumLeft: 0,
  momentumRight: 0,
  maxMomentumThreshold: 0.03,
  acceleration: 0.0001, // how fast the camera will accelerate
  cannonRotationSpeed: 0.8, // more is faster rotation
  slowCameraMovementSpeed: 10, // more is slower camera movement
  zoom_sensitivity: 1, // how fast the camera zooms in and out
};

let textureUrl = null;
let bumpTextureUrl = null;
let texture = null;
let bumpTexture = null;
let material = null;
let SHADOW_MAP_WIDTH = 256,
  SHADOW_MAP_HEIGHT = 256;

// This are the world objects, it carries all THREE objects
let world = new THREE.Object3D();
// the moving gun
let movingGun = null,
  sphereGun = null,
  platform = null,
  cannonTip = null,
  ground = null,
  gun = null,
  cannon = null,
  cannonRotation = null,
  cannon2 = null,
  asteroidHome = null,
  reticle = null,
  // collision objects
  invincibleBoxCol = null,
  invincibleBBoxCol = null,
  platformBox = null,
  invincibleBox = null,
  sphereGunBox = null,
  sphereGunBBox = null,
  // models
  asteroidModel = null,
  bulletWrapper = null,
  bulletModel = null,
  minilight = null,
  bulletLight = null;

let duration = 5000; // ms
let currentTime = Date.now();

function createScene(canvas) {
  //health set
  $("#health").html("Health: " + gunHealth);
  renderer = new THREE.WebGLRenderer({ canvas: canvas, antialias: true });
  renderer.setSize(window.innerWidth, window.innerHeight);
  // Turn on shadows      disable for better performance
  renderer.shadowMap.enabled = true;
  // Options are THREE.BasicShadowMap, THREE.PCFShadowMap, PCFSoftShadowMap
  renderer.shadowMap.type = THREE.BasicShadowMap;
  scene = new THREE.Scene();
  // Screen Shake
  screenShake = ScreenShake();
  // skybox
  var loader = new THREE.CubeTextureLoader();
  loader.setPath("images/cubemap/nebula/");
  var textureCube = loader.load(["right.png", "left.png", "up.png", "down.png", "front.png", "back.png"]);
  scene.background = textureCube;
  // Add  a camera so we can view the scene
  camera = new THREE.PerspectiveCamera(90, canvas.width / canvas.height, 0.1, 5000);
  // crosshair
  textureUrl = "images/reticle.png";
  texture = new THREE.TextureLoader().load(textureUrl);
  bumpTexture = new THREE.TextureLoader().load(bumpTextureUrl);
  material = new THREE.MeshBasicMaterial({ map: texture, side: THREE.DoubleSide, transparent: true, opacity: 1 });
  geometry = new THREE.PlaneGeometry(1, 1, 32);
  reticle = new THREE.Mesh(geometry, material);
  reticle.position.set(0, 1.2, -10);
  camera.add(reticle);
  // create an AudioListener and add it to the camera
  var listener = new THREE.AudioListener();
  camera.add(listener);
  // create a global audio source
  cannonShotSound = new THREE.Audio(listener);
  asteroidImpactSound = new THREE.Audio(listener);
  asteroidHitSound = new THREE.Audio(listener);
  asteroidDestructionSound = new THREE.Audio(listener);
  asteroidMinorImpact = new THREE.Audio(listener);
  // load a sound and set it as the Audio object's buffer
  var audioLoader = new THREE.AudioLoader();
  audioLoader.load("sounds/asteroidExplosion.wav", function (buffer) {
    // cannon sound while shooting
    cannonShotSound.setBuffer(buffer);
    cannonShotSound.setLoop(false);
    cannonShotSound.setVolume(0.2);
    cannonShotSound.duration = asteroidConfig.fireRate;
  });
  audioLoader.load("sounds/asteroidImpact.ogg", function (buffer) {
    // asteroid hitting the upper platform
    asteroidImpactSound.setBuffer(buffer);
    asteroidImpactSound.setLoop(false);
    asteroidImpactSound.setVolume(1);
  });
  audioLoader.load("sounds/hitOnAsteroid.wav", function (buffer) {
    // hit on asteroid
    asteroidHitSound.setBuffer(buffer);
    asteroidHitSound.setLoop(false);
    asteroidHitSound.setVolume(0.07);
    asteroidHitSound.duration = asteroidConfig.fireRate;
  });
  audioLoader.load("sounds/asteroidDestruction.wav", function (buffer) {
    // destruction of an asteroid
    asteroidDestructionSound.setBuffer(buffer);
    asteroidDestructionSound.setLoop(false);
    asteroidDestructionSound.setVolume(1.5);
  });
  audioLoader.load("sounds/hitOnAsteroid.wav", function (buffer) {
    // asteroid hitting the lower asteroid rock formation
    asteroidMinorImpact.setBuffer(buffer);
    asteroidMinorImpact.setLoop(false);
    asteroidMinorImpact.setVolume(0.04);
    asteroidMinorImpact.duration = 0.05;
  });

  // model creation
  modelCreation();
  createWorld();
}

function createWorld() {
  asteroidHome = new THREE.Object3D();
  ground = new THREE.Object3D();
  function asteroidBase() {
    textureUrl = "images/asteroid.jpg";
    bumpTextureUrl = "images/asteroidBump.jpg";
    texture = new THREE.TextureLoader().load(textureUrl);
    bumpTexture = new THREE.TextureLoader().load(bumpTextureUrl);
    material = new THREE.MeshPhongMaterial({ map: texture, bumpMap: bumpTexture, bumpScale: 0.3 });

    //                                                                  asteroid base
    geometry = new THREE.TetrahedronGeometry(4, 2);
    ground0 = new THREE.Mesh(geometry, material);
    ground0.receiveShadow = true;
    ground0.castShadow = true;
    ground0.position.set(0, -6, 0);

    ground1 = new THREE.Mesh(geometry, material);
    ground1.receiveShadow = true;
    ground1.castShadow = true;
    ground1.position.set(0, -3, 3);

    ground2 = new THREE.Mesh(geometry, material);
    ground2.receiveShadow = true;
    ground2.castShadow = true;
    ground2.position.set(4, -3, -2);

    ground3 = new THREE.Mesh(geometry, material);
    ground3.receiveShadow = true;
    ground3.castShadow = true;
    ground3.position.set(-4, -3, -2);

    geometry = new THREE.DodecahedronGeometry(3, 1);
    ground8 = new THREE.Mesh(geometry, material);
    ground8.receiveShadow = true;
    ground8.castShadow = true;
    ground8.position.set(0, -2, -3);
    // small asteroids
    geometry = new THREE.TetrahedronGeometry(2, 2);
    ground4 = new THREE.Mesh(geometry, material);
    ground4.receiveShadow = true;
    ground4.castShadow = true;
    ground4.position.set(-5, -4, 2);

    ground5 = new THREE.Mesh(geometry, material);
    ground5.receiveShadow = true;
    ground5.castShadow = true;
    ground5.position.set(-4.5, -1.5, 1.5);

    ground6 = new THREE.Mesh(geometry, material);
    ground6.receiveShadow = true;
    ground6.castShadow = true;
    ground6.position.set(5, -4, 2);

    ground7 = new THREE.Mesh(geometry, material);
    ground7.receiveShadow = true;
    ground7.castShadow = true;
    ground7.position.set(4.5, -1.5, 1.5);

    ground.position.set(0, -0.5, 0);
    ground.add(ground0);
    ground.add(ground1);
    ground.add(ground2);
    ground.add(ground3);
    ground.add(ground4);
    ground.add(ground5);
    ground.add(ground6);
    ground.add(ground7);
    ground.add(ground8);

    // collision object
    material = new THREE.MeshBasicMaterial({ color: 0x0000ff, transparent: true, opacity: 0.5 });
    geometry = new THREE.BoxGeometry(13, 13, 2);
    invincibleBox = new THREE.Mesh(geometry, material);
    invincibleBox.rotation.x = Math.PI / 2;
    invincibleBox.position.y = -5.5;

    invincibleBoxCol = new THREE.Box3().setFromObject(invincibleBox); // collision box3
    invincibleBBoxCol = new THREE.BoxHelper(invincibleBox, 0x00ff00); // box helper
    ground.add(invincibleBox);
    ground.add(invincibleBoxCol);
  }

  function platformFunction() {
    textureUrl = "images/platform.jpg";
    texture = new THREE.TextureLoader().load(textureUrl);
    bumpTextureUrl = "images/platform_specular.png";
    bumpTexture = new THREE.TextureLoader().load(bumpTextureUrl);
    material = new THREE.MeshPhongMaterial({ map: texture, color: 0xffffff, bumpMap: bumpTexture, bumpScale: 0.1, transparent: true, opacity: 1 });
    geometry = new THREE.BoxGeometry(8, 8, 2);
    platform = new THREE.Mesh(geometry, material);
    platform.health = gunHealth;
    platform.castShadow = true;
    platform.receiveShadow = true;
    platform.rotation.x = Math.PI / 2;
    platform.position.set(0, 0, 0);
    // side lights
    let rightLight = new THREE.PointLight(0xffffff, 2, 10);
    rightLight.position.set(2, 0.8, 0);
    rightLight.castShadow = true;
    rightLight.shadow.camera.near = 1;
    rightLight.shadow.camera.far = 10;
    rightLight.shadow.camera.fov = 90;
    rightLight.shadow.mapSize.width = SHADOW_MAP_WIDTH;
    rightLight.shadow.mapSize.height = SHADOW_MAP_HEIGHT;
    asteroidHome.add(rightLight);
    let leftLight = new THREE.PointLight(0xffffff, 2, 10);
    leftLight.position.set(-2, 0.8, 0);
    leftLight.castShadow = true;
    leftLight.shadow.camera.near = 1;
    leftLight.shadow.camera.far = 10;
    leftLight.shadow.camera.fov = 90;
    leftLight.shadow.mapSize.width = SHADOW_MAP_WIDTH;
    leftLight.shadow.mapSize.height = SHADOW_MAP_HEIGHT;
    asteroidHome.add(leftLight);
    platformBox = new THREE.Box3().setFromObject(platform); // collision box3
    platformBBox = new THREE.BoxHelper(platform, 0x00ff00); // box helper

    ground.add(platform);
    ground.add(platformBox);
    ground.add(platformBBox);
    asteroidHome.add(ground);
  }

  function createCannon() {
    // gun wrapper
    gun = new THREE.Object3D();
    // base
    textureUrl = "images/base.jpg";
    texture = new THREE.TextureLoader().load(textureUrl);
    bumpTextureUrl = "images/base.jpg";
    bumpTexture = new THREE.TextureLoader().load(bumpTextureUrl);
    material = new THREE.MeshPhongMaterial({ map: texture, color: 0xffffff, normalMap: bumpTexture, bumpScale: 1 });
    geometry = new THREE.BoxGeometry(2, 2, 1);
    let base = new THREE.Mesh(geometry, material);
    base.castShadow = true;
    base.receiveShadow = true;
    base.rotation.x = Math.PI / 2;
    base.position.set(0, 1, 0);

    gun.add(base);

    // base 2
    geometry = new THREE.BoxGeometry(1.5, 1.5, 0.5);
    let base2 = new THREE.Mesh(geometry, material);
    base2.castShadow = true;
    base2.receiveShadow = true;
    base2.rotation.x = Math.PI / 2;
    base2.position.set(0, 1.35, 0);

    gun.add(base2);

    // the actual moving gun
    movingGun = new THREE.Object3D();
    movingGun.position.set(0, 1.8, 0);
    gun.add(movingGun);

    // sphere
    textureUrl = "images/sphere.jpg";
    texture = new THREE.TextureLoader().load(textureUrl);
    bumpTextureUrl = "images/sphere_specular.png";
    bumpTexture = new THREE.TextureLoader().load(bumpTextureUrl);
    material = new THREE.MeshPhongMaterial({ map: texture, color: 0xfffb09, normalMap: bumpTexture, bumpScale: 1 });
    geometry = new THREE.SphereGeometry(0.75, 32, 32);
    sphereGun = new THREE.Mesh(geometry, material);
    sphereGun.health = gunHealth;
    sphereGunBoxHelper = new THREE.BoxHelper(sphereGun, 0x00ff00);
    sphereGunBoxHelper.visible = false;
    sphereGun.castShadow = true;
    sphereGun.receiveShadow = true;
    sphereGun.rotation.x = Math.PI;

    var sphereGunBox = new THREE.Box3().setFromObject(sphereGun); // collision box3
    var sphereGunBBox = new THREE.BoxHelper(sphereGun, 0x00ff00); // box helper
    movingGun.add(sphereGun);
    movingGun.add(sphereGunBox);

    if (cameraControls.cannonPOV) {
      // camera attached to the sphereGun
      camera.position.set(1.2, -1, -1.5);
      camera.rotation.x = Math.PI / -25;
      camera.rotation.z = Math.PI;
      camera.rotation.y = Math.PI;
      sphereGun.add(camera);
    } else {
      // orbit controls for debugging
      camera.position.z = -30;
      camera.position.y = 3;
      scene.add(camera);
      orbitControls = new THREE.OrbitControls(camera, renderer.domElement);
    }

    // cannon
    textureUrl = "images/sphere.jpg";
    texture = new THREE.TextureLoader().load(textureUrl);
    bumpTextureUrl = "images/sphere_specular.png";
    bumpTexture = new THREE.TextureLoader().load(bumpTextureUrl);
    material = new THREE.MeshPhongMaterial({ map: texture, normalMap: bumpTexture, bumpScale: 1 });
    geometry = new THREE.CylinderGeometry(0.12, 0.22, 0.1, 20, 1, false);
    cannon = new THREE.Mesh(geometry, material);
    cannon.castShadow = true;
    cannon.receiveShadow = true;
    cannon.position.set(0, 0.78, 0);

    geometry = new THREE.CylinderGeometry(0.12, 0.22, 2, 20, 1, false);
    cannon2 = new THREE.Mesh(geometry, material);
    cannon2.castShadow = true;
    cannon2.receiveShadow = true;
    sphereGun.add(cannon2);
    cannon2.rotation.x = Math.PI / 2;
    cannon2.position.z = 1.5;

    // similar to planet rotation this works to rotate the cannon around an object
    cannonRotation = new THREE.Object3D();
    cannonRotation.add(cannon);
    sphereGun.add(cannonRotation);

    // cannonTip is used to set where the bullet should be aiming from the inside of the sphere
    cannonTip = new THREE.Object3D();
    cannonTip.position.set(0, 1.5, 0);
    minilight = new THREE.PointLight(0xff0000, 0, 4.5);
    minilight.position.z += 5;
    minilight.position.y -= 1;
    minilight.castShadow = true;
    minilight.shadow.camera.near = 1;
    minilight.shadow.camera.far = 200;
    minilight.shadow.camera.fov = 90;
    minilight.shadow.mapSize.width = SHADOW_MAP_WIDTH;
    minilight.shadow.mapSize.height = SHADOW_MAP_HEIGHT;
    sphereGun.add(minilight);
    cannonRotation.add(cannonTip);

    asteroidHome.add(gun);
  }

  function planets() {
    textureUrl = "images/sun.jpg"; // sun
    texture = new THREE.TextureLoader().load(textureUrl);
    material = new THREE.MeshBasicMaterial({ map: texture });

    geometry = new THREE.SphereGeometry(400, 80, 80);
    sun = new THREE.Mesh(geometry, material);
    sun.position.set(0, 6, 1000);
    let sunlight = new THREE.SpotLight(0xffc689, 2, 0);
    sunlight.position.z = 2000;
    sunlight.castShadow = true;
    sunlight.shadow.camera.near = 1500;
    sunlight.shadow.camera.far = 4000;
    sunlight.shadow.camera.fov = 45;
    sunlight.shadow.mapSize.width = SHADOW_MAP_WIDTH;
    sunlight.shadow.mapSize.height = SHADOW_MAP_HEIGHT;
    sun.add(sunlight);
    world.add(sun);

    textureUrl = "images/earth_atmos_2048.jpg"; //                                                          earth and moon
    texture = new THREE.TextureLoader().load(textureUrl);
    bumpTextureUrl = "images/earthBump.jpg";
    bumpTexture = new THREE.TextureLoader().load(bumpTextureUrl);
    material = new THREE.MeshPhongMaterial({ map: texture, bumpMap: bumpTexture, bumpScale: 1.5 });
    geometry = new THREE.SphereGeometry(0.25, 50, 50);
    earthGroup = new THREE.Object3D();
    earth = new THREE.Mesh(geometry, material);
    earth.receiveShadow = true;
    earthGroup.add(earth);
    textureUrl = "images/moon_1024.jpg";
    texture = new THREE.TextureLoader().load(textureUrl);
    bumpTextureUrl = "images/moon_bump.jpg";
    bumpTexture = new THREE.TextureLoader().load(bumpTextureUrl);
    material = new THREE.MeshPhongMaterial({ map: texture, bumpMap: bumpTexture, bumpScale: 0.2 });
    geometry = new THREE.SphereGeometry(0.06, 30, 30);
    moon = new THREE.Mesh(geometry, material);
    moon.castShadow = true;
    earthGroup.add(moon);
    moon.position.set(0.3, 0.15, 0);
    earthGroup.position.set(-200, 0, 0);
    earthGroup.scale.set(250, 250, 250);
    world.add(earthGroup);

    //                                                                              mars
    textureUrl = "images/marsmap1k.jpg";
    texture = new THREE.TextureLoader().load(textureUrl);
    bumpTextureUrl = "images/marsbump1k.jpg";
    bumpTexture = new THREE.TextureLoader().load(bumpTextureUrl);
    material = new THREE.MeshPhongMaterial({ map: texture, bumpMap: bumpTexture, bumpScale: 6 });
    geometry = new THREE.SphereGeometry(0.3, 30, 30);
    mars = new THREE.Mesh(geometry, material);
    marsGroup = new THREE.Object3D();
    marsGroup.position.set(300, 15, -800);
    marsGroup.scale.set(200, 200, 200);
    marsGroup.add(mars);
    marsRotation = new THREE.Object3D();
    marsRotation.add(marsGroup);
    world.add(marsRotation);

    //                                                                          saturn
    textureUrl = "images/saturnmap.jpg";
    texture = new THREE.TextureLoader().load(textureUrl);
    bumpTextureUrl = "images/uranusBump.jpg";
    bumpTexture = new THREE.TextureLoader().load(bumpTextureUrl);
    material = new THREE.MeshPhongMaterial({ map: texture, bumpMap: bumpTexture, bumpScale: 7 });
    geometry = new THREE.SphereGeometry(0.5, 50, 50);
    saturn = new THREE.Mesh(geometry, material);
    saturn.castShadow = true;
    saturn.rotation.x = Math.PI / 2;
    // ring
    textureUrl = "images/saturnringcolor.jpg";
    texture = new THREE.TextureLoader().load(textureUrl);
    material = new THREE.MeshPhongMaterial({ map: texture, transparent: false, opacity: 0.7 });
    geometry = new THREE.RingBufferGeometry(3, 5, 64);
    var pos = geometry.attributes.position;
    var v3 = new THREE.Vector3();
    for (let i = 0; i < pos.count; i++) {
      v3.fromBufferAttribute(pos, i);
      geometry.attributes.uv.setXY(i, v3.length() < 4 ? 0 : 1, 1);
    }
    ring = new THREE.Mesh(geometry, material);
    ring.scale.set(0.3, 0.3, 0.3);
    ring.receiveShadow = true;
    // moons
    geometry = new THREE.SphereGeometry(0.02, 20, 20);
    textureUrl = "images/saturnmap.jpg";
    texture = new THREE.TextureLoader().load(textureUrl);
    material = new THREE.MeshPhongMaterial({ map: texture });
    moon1 = new THREE.Mesh(geometry, material);
    moon2 = new THREE.Mesh(geometry, material);
    moon3 = new THREE.Mesh(geometry, material);
    geometry = new THREE.SphereGeometry(0.05, 20, 20);
    moon4 = new THREE.Mesh(geometry, material);
    geometry = new THREE.SphereGeometry(0.02, 20, 20);
    moon5 = new THREE.Mesh(geometry, material);
    moon1.position.set(0.2, 0.5, 0);
    moon2.position.set(0.3, -0.5, 0.5);
    moon3.position.set(-0.2, 0.59, 0);
    moon4.position.set(0.45, 0.45, 0.5);
    moon5.position.set(-0.35, 0.51, -0.5);
    saturnGroup = new THREE.Object3D();
    saturnGroup.rotation.x = Math.PI / -2;
    saturnGroup.rotation.y = Math.PI / -5;
    saturnGroup.position.set(500, -130, 300);
    saturnMoons = new THREE.Object3D();
    saturnGroup.add(saturnMoons);
    saturnGroup.add(saturn);
    saturnGroup.add(ring);
    saturnMoons.add(moon1);
    saturnMoons.add(moon2);
    saturnMoons.add(moon3);
    saturnMoons.add(moon4);
    saturnMoons.add(moon5);
    saturnGroup.scale.set(200, 200, 200);
    world.add(saturnGroup);

    //                                                                                          uranus
    textureUrl = "images/uranusmap.jpg";
    texture = new THREE.TextureLoader().load(textureUrl);
    bumpTextureUrl = "images/uranusBump.jpg";
    bumpTexture = new THREE.TextureLoader().load(bumpTextureUrl);
    material = new THREE.MeshPhongMaterial({ map: texture, bumpMap: bumpTexture, bumpScale: 0.05 });
    geometry = new THREE.SphereGeometry(0.3, 30, 30);
    uranus = new THREE.Mesh(geometry, material);
    geometry = new THREE.SphereGeometry(0.02, 20, 20);
    moon1 = new THREE.Mesh(geometry, material);
    moon2 = new THREE.Mesh(geometry, material);
    moon3 = new THREE.Mesh(geometry, material);
    moon4 = new THREE.Mesh(geometry, material);
    moon5 = new THREE.Mesh(geometry, material);
    moon1.position.set(0.2, 0.5, 0);
    moon2.position.set(0.3, -0.5, 0);
    moon3.position.set(-0.2, 0.59, 0);
    moon4.position.set(0.25, 0.15, 0);
    moon5.position.set(-0.35, 0.1, 0);
    // ring
    material = new THREE.MeshBasicMaterial({ color: 0x506066, side: THREE.DoubleSide });
    geometry = new THREE.RingGeometry(0.4, 0.415, 100);
    ring = new THREE.Mesh(geometry, material);
    uranusGroup = new THREE.Object3D();
    uranusGroup.position.set(0, 400, 0);
    uranusGroup.scale.set(200, 200, 200);
    uranusGroup.add(uranus);
    uranusGroup.add(ring);
    uranusGroup.add(moon1);
    uranusGroup.add(moon2);
    uranusGroup.add(moon3);
    uranusGroup.add(moon4);
    uranusGroup.add(moon5);
    world.add(uranusGroup);
  }

  // World creation
  asteroidBase();
  createCannon();
  platformFunction();
  planets();

  gun.updateMatrixWorld();
  movingGun.updateMatrixWorld();
  sphereGun.updateMatrixWorld();
  //ground.updateMatrixWorld();
  cannonRotation.updateMatrixWorld();
  cannonTip.updateMatrixWorld();

  // world object
  world.position.set(0, 0, 0);
  world.add(asteroidHome);

  scene.add(world);
}

function applyDispersion(value, dispersionAmount = 0.01) {
  return value + (Math.random() - 0.5) * 2 * dispersionAmount;
}

function fireBullet(position) {
  let bullet = bulletModel.clone();
  bullet.id = bulletCount;
  bullet.time = Date.now();
  bullet.position = position;
  bullet.position.y += 1.8;
  bullet.time = Date.now();
  bullet.box = new THREE.Box3().setFromObject(bullet);
  bulletCount += 1;

  // update every group's matrix to get their true world positions
  asteroidHome.updateMatrixWorld();
  gun.updateMatrixWorld();
  movingGun.updateMatrixWorld();
  sphereGun.updateMatrixWorld();
  //ground.updateMatrixWorld();
  world.updateMatrixWorld();
  cannon.updateMatrixWorld();
  cannonTip.updateMatrixWorld();

  // get cannontip direction to aim bullet
  let shootDirection = new THREE.Vector3();
  cannonTip.getWorldDirection(shootDirection);
  bullet.shootZ = applyDispersion(shootDirection.z, cameraControls.dispersionAmount);
  bullet.shootY = applyDispersion(shootDirection.y, cameraControls.dispersionAmount);
  bullet.shootX = applyDispersion(shootDirection.x, cameraControls.dispersionAmount);

  bulletsArray.push(bullet);
  world.add(bullet);
}

function createExplosion(position, size) {
  let explosionGeometry = new THREE.SphereGeometry(1, 32, 32);
  let explosionMaterial = new THREE.MeshBasicMaterial({
    color: 0xffe066, // bright yellow-orange
    transparent: true,
    opacity: 0.8, // or 1.0
  });
  let explosion = new THREE.Mesh(explosionGeometry, explosionMaterial);
  explosion.position.copy(position);

  // Add point light
  let explosionLight = new THREE.PointLight(0xffe066, 15, size * 8, 5); // color, intensity, distance, decay
  explosionLight.castShadow = false; // do NOT enable shadows for perf
  explosion.add(explosionLight);
  explosion.light = explosionLight; // Save reference for animation
  explosion.castShadow = false;
  explosion.receiveShadow = false;

  explosion.lifetime = 1.0; // seconds
  explosion.age = 0;
  explosion.startSize = size * 5; // adjust as you like
  explosion.peakSize = size * 8; // adjust as you like
  explosion.materialInitialOpacity = 0.8; // match above

  explosionsArray.push(explosion);
  world.add(explosion);
}

function createAsteroid() {
  // aseroid size between 1 and 5
  const asteroidSize = parseInt(Math.random() * 4 + 1);

  let asteroid = asteroidModel.clone();

  asteroid.castShadow = true;
  asteroid.receiveShadow = true;

  asteroid.scale.set(asteroidSize, asteroidSize, asteroidSize);
  asteroid.id = asteroidCount;
  asteroid.health = asteroidConfig.asteroidHealth + asteroidSize * 5;
  asteroid.date = Date.now();
  asteroid.speed = asteroidConfig.asteroidSpeed - asteroidSize * 0.05;
  asteroid.damage = asteroidSize * asteroidConfig.asteroidDamage; // damage from asteroid hit
  asteroid.scorePerDestruction = asteroidSize * asteroidConfig.scorePerAsteroidDestroyed; // score per asteroid destroyed

  let minSize = 1;
  let maxSize = 5;
  let normalizedSize = (asteroidSize - minSize) / (maxSize - minSize);
  asteroid.material = asteroid.material.clone();
  asteroid.material.color.setRGB(0.4 * normalizedSize, 0, 0);
  asteroidCount += 1;
  x = getRndInteger(1500, 300) - 750;
  y = getRndInteger(1500, 300) - 700;
  z = getRndInteger(1500, 300) - 700;
  asteroid.position.set(x, y, z);
  // asteroid aiming to asteroidHome
  asteroidHome.updateMatrixWorld();
  world.updateMatrixWorld();
  let shootDirection = new THREE.Vector3();
  asteroidHome.getWorldDirection(shootDirection);
  // speed
  asteroid.movZ = z / 200;
  asteroid.movY = y / 200;
  asteroid.movX = x / 200;

  // collision box
  asteroid.box = new THREE.Box3().setFromObject(asteroid);

  asteroidsArray.push(asteroid);
  world.add(asteroid);
  console.log("Asteroid size: " + asteroid.scale.x + ", " + asteroid.scale.y + ", " + asteroid.scale.z);
}

function destroyBullet(b) {
  world.remove(b); // destroy bullet
  bulletsArray.splice(bulletsArray.indexOf(b), 1);
}

function getZoomMultiplier() {
  return cameraControls.zoomedIn ? cameraControls.zoom_sensitivity : 1;
}

function destroyAsteroid(as) {
  // create explosion effect
  createExplosion(as.position, as.scale.x);
  // asteroid destruction sound
  asteroidDestructionSound.play();
  // asteroid explosion
  world.remove(as);
  asteroidsArray.splice(asteroidsArray.indexOf(as), 1);
  score += as.scorePerDestruction; // add score
  changeScore(score);
  console.log("Asteroid destroyed: " + as.id);
}

function animate() {
  // game will continue as long as gameOver is not true
  if (!gameOver && !pause) {
    let now = Date.now();
    let deltat = now - currentTime;
    currentTime = now;
    let fract = deltat / duration;
    let angle = Math.PI * 2 * fract;
    elapsedTime += 0.017;
    seconds += 0.01;
    waitForNewAsteroid += 0.01;
    // camera shake
    screenShake.update(camera);

    // instructions clearing
    $("#instructions1").empty();
    $("#instructions2").empty();
    $("#instructions3").empty();
    $("#gameOver").empty();
    $("#gameOverInstructions").empty();
    $("#highScore").empty();
    // score update
    changeScore(score);

    //platform box3 used for collision detection
    sphereGunBox = new THREE.Box3().setFromObject(sphereGun); // collision box3
    platformBox = new THREE.Box3().setFromObject(platform);
    invincibleBoxCol = new THREE.Box3().setFromObject(invincibleBox);

    // asteroidHome rotation
    // asteroidHome.rotation.y += angle / 50;
    earthGroup.rotation.y += angle / 40;
    moon.rotation.y -= angle / 25;
    marsGroup.rotation.y -= angle / 40;
    saturnGroup.rotation.z += angle / 40;

    // camera momentum
    const MOMENTUM_TARGET = cameraControls.maxMomentumThreshold * getZoomMultiplier();
    const MOMENTUM_SMOOTHING = 0.18;

    if (cameraControls.movingUp) {
      cameraControls.momentumUp = cameraControls.momentumUp * (1 - MOMENTUM_SMOOTHING) + MOMENTUM_TARGET * MOMENTUM_SMOOTHING;
    } else {
      cameraControls.momentumUp *= 1 - MOMENTUM_SMOOTHING;
    }

    if (cameraControls.movingDown) {
      cameraControls.momentumDown = cameraControls.momentumDown * (1 - MOMENTUM_SMOOTHING) + MOMENTUM_TARGET * MOMENTUM_SMOOTHING;
    } else {
      cameraControls.momentumDown *= 1 - MOMENTUM_SMOOTHING;
    }

    if (cameraControls.movingLeft) {
      cameraControls.momentumLeft = cameraControls.momentumLeft * (1 - MOMENTUM_SMOOTHING) + MOMENTUM_TARGET * MOMENTUM_SMOOTHING;
    } else {
      cameraControls.momentumLeft *= 1 - MOMENTUM_SMOOTHING;
    }

    if (cameraControls.movingRight) {
      cameraControls.momentumRight = cameraControls.momentumRight * (1 - MOMENTUM_SMOOTHING) + MOMENTUM_TARGET * MOMENTUM_SMOOTHING;
    } else {
      cameraControls.momentumRight *= 1 - MOMENTUM_SMOOTHING;
    }

    // gun rotation
    if ((cameraControls.movingUp || cameraControls.momentumUp > 0) && sphereGun.rotation.x < 4.5) {
      sphereGun.rotation.x += cameraControls.zoomedIn
        ? (cameraControls.momentumUp + angle * cameraControls.cannonRotationSpeed) / cameraControls.slowCameraMovementSpeed
        : cameraControls.momentumUp + angle * cameraControls.cannonRotationSpeed;
    }
    if ((cameraControls.movingDown || cameraControls.momentumDown > 0) && sphereGun.rotation.x > 2.9) {
      sphereGun.rotation.x -= cameraControls.zoomedIn
        ? (cameraControls.momentumDown + angle * cameraControls.cannonRotationSpeed) / cameraControls.slowCameraMovementSpeed
        : cameraControls.momentumDown + angle * cameraControls.cannonRotationSpeed;
    }
    if (cameraControls.movingLeft || cameraControls.momentumLeft > 0) {
      movingGun.rotation.y += cameraControls.zoomedIn
        ? (cameraControls.momentumLeft + angle * cameraControls.cannonRotationSpeed) / cameraControls.slowCameraMovementSpeed
        : cameraControls.momentumLeft + angle * cameraControls.cannonRotationSpeed;
    }
    if (cameraControls.movingRight || cameraControls.momentumRight > 0) {
      movingGun.rotation.y -= cameraControls.zoomedIn
        ? (cameraControls.momentumRight + angle * cameraControls.cannonRotationSpeed) / cameraControls.slowCameraMovementSpeed
        : cameraControls.momentumRight + angle * cameraControls.cannonRotationSpeed;
    }

    //this is used to make the lighting ilusion while shooting the cannon
    if (minilight.intensity >= 0) {
      minilight.intensity -= 1;
    }

    // asteroid generation, asteroidsDifficulty will be lowering as time goes by spawning asteroids quicker
    if (waitForNewAsteroid > asteroidConfig.asteroidsDifficulty) {
      createAsteroid();
      waitForNewAsteroid = 0;
      if (asteroidConfig.asteroidsDifficulty >= 0.99) asteroidConfig.asteroidsDifficulty -= 0.05;
    }

    // decrease firerate if cannon is firing
    if (cameraControls.firing) {
      if (seconds > asteroidConfig.fireRate) {
        cannonShotSound.play();
        minilight.intensity = 4;
        fireBullet(sphereGun.getWorldPosition());
        if (screenShake.enabled == false) {
          screenShake.shake(camera, new THREE.Vector3(0, 0, 0.12), asteroidConfig.fireRate * 1000 - 0.2 /* ms */);
        }
        seconds = 0;
      }
    }
    // bullet dispersion when firing
    if (cameraControls.firing && cameraControls.dispersionAmount < 0.04) cameraControls.dispersionAmount += 0.0002;
    if (!cameraControls.firing) cameraControls.dispersionAmount = cameraControls.dispersionAmount > 0 ? cameraControls.dispersionAmount - 0.0004 : 0;
    if (cameraControls.dispersionAmount > 0)
      if (!cameraControls.zoomedIn) reticle.scale.set(1 + 60 * cameraControls.dispersionAmount, 1 + 60 * cameraControls.dispersionAmount, reticle.scale.z);
      else reticle.scale.set(1.5 + 60 * cameraControls.dispersionAmount, 1.5 + 60 * cameraControls.dispersionAmount, reticle.scale.z);
    asteroidConfig.fireRate = 0.03 + cameraControls.dispersionAmount * 0.7;

    // cannon overheating
    sphereGun.material.color.setRGB(cameraControls.dispersionAmount * 80, 0, 0);

    // bullets update
    for (const bullet of bulletsArray) {
      // movement
      bullet.position.z += bullet.shootZ * asteroidConfig.bulletSpeed;
      bullet.position.y += bullet.shootY * asteroidConfig.bulletSpeed;
      bullet.position.x += bullet.shootX * asteroidConfig.bulletSpeed;
      bullet.box.setFromObject(bullet);

      // delete bullet if it goes out of bounds
      if (
        bullet.position.z < -outOfBoundsLimit ||
        bullet.position.z > outOfBoundsLimit ||
        bullet.position.x < -outOfBoundsLimit ||
        bullet.position.x > outOfBoundsLimit
      )
        destroyBullet(bullet); // remove bullet from the array

      // check for collisions with asteroids
      for (const as of asteroidsArray) {
        let deltaTimeAsteroid = now - as.time;
        if (deltaTimeAsteroid > 13000) destroyAsteroid(as);

        if (as.box.intersectsBox(bullet.box)) {
          asteroidHitSound.play();

          destroyBullet(bullet); // remove bullet from the array
          //lower asteroid health
          as.health -= asteroidConfig.bulletDamage;
          // if asteroid health is lower than 0 we remove it from the scene
          if (as.health <= 0) {
            destroyAsteroid(as);
          }
        }
      }
    }

    // asteroids update
    for (const as of asteroidsArray) {
      // movement
      as.position.z -= as.movZ * as.speed;
      as.position.x -= as.movX * as.speed;
      as.position.y -= as.movY * as.speed;
      as.rotation.x += angle;
      as.rotation.y -= angle;
      as.box.setFromObject(as); // update collision box3

      // asteroids check for collision with objects
      if (invincibleBoxCol.intersectsBox(as.box)) {
        // collision with invincibleBox (placed below the platform, no damage)
        asteroidMinorImpact.play();
        // destroy asteroid
        destroyAsteroid(as);
        // weak camera shake
        if (screenShake.enabled == false) {
          screenShake.shake(camera, new THREE.Vector3(0, 0.1, 0), 250 /* ms */);
        }
      }
      // collision with platformBox
      if (platformBox.intersectsBox(as.box)) {
        // destroy asteroid
        //sound
        asteroidImpactSound.play();
        // lower sphereGun health
        platform.health -= asteroidConfig.asteroidDamage;
        changeHealth(platform.health);
        destroyAsteroid(as);
        if (platform.health <= 0) {
          gameOver = true;
          screenShake.shake(camera, new THREE.Vector3(0, 1.5, 0), 1000 /* ms */);
        }
        // strong camera shake
        if (screenShake.enabled == false) {
          screenShake.shake(camera, new THREE.Vector3(0, 0.8, 0), 250 /* ms */);
        }
      }
    }

    // explosions update
    let delta = deltat / 1000;

    for (let i = explosionsArray.length - 1; i >= 0; i--) {
      let exp = explosionsArray[i];
      exp.age += delta;
      let t = exp.age / exp.lifetime; // t: 0 (start) → 1 (end)

      if (t < 1.0) {
        // Expand size and fade opacity
        let size = THREE.MathUtils.lerp(exp.startSize, exp.peakSize, t);
        exp.scale.set(size, size, size);

        exp.material.opacity = THREE.MathUtils.lerp(exp.materialInitialOpacity, 0.0, t);
        // If you want to make it less bright as it grows, you can also tint the color towards darker:
        //exp.material.color.lerp(new THREE.Color(0x111111), t);
        if (exp.light) {
          exp.light.intensity = THREE.MathUtils.lerp(5, 0, t); // or whatever max you want
          exp.light.distance = THREE.MathUtils.lerp(exp.peakSize * 8, 0, t);
        }
      } else {
        // Remove explosion
        world.remove(exp);
        explosionsArray.splice(i, 1);
      }
    }
  }

  // change screen instructions when paused
  if (pause) {
    $("#instructions1").html("WASD to move cannon");
    $("#instructions2").html("LShift to zoom");
    $("#instructions3").html("SPACEBAR to shoot");
  }
  // remove all asteroids and bullets remaining from the previous game
  if (gameOver) {
    gameOverScreen();

    // remove all asteroids and bullets
    for (const as in asteroidsArray) {
      world.remove(asteroidsArray[as]);
    }
    for (const bu in bulletsArray) {
      world.remove(bulletsArray[bu]);
    }
    asteroidsArray = [];
    bulletsArray = null;
    bulletsArray = [];
  }
}

function run() {
  requestAnimationFrame(function () {
    run();
  });

  // Render the scene
  renderer.render(scene, camera);

  // Spin the cube for next frame
  animate();
  //orbitControls.update();
}
// cannon movement activation
document.addEventListener(
  "keydown",
  function (event) {
    if (event.keyCode === 68) {
      // right
      event.preventDefault();
      cameraControls.movingRight = true;
    }
    if (event.keyCode === 65) {
      // left
      event.preventDefault();
      cameraControls.movingLeft = true;
    }
    if (event.keyCode === 87) {
      // up
      event.preventDefault();
      cameraControls.movingUp = true;
    }
    if (event.keyCode === 83) {
      // down
      event.preventDefault();
      cameraControls.movingDown = true;
    }
    if (event.keyCode === 32) {
      // fire
      event.preventDefault();
      cameraControls.firing = true;
    }
    if (event.keyCode === 13) {
      // play again
      event.preventDefault();
      if (gameOver) {
        playAgain();
      }
    }
    if (event.keyCode === 16) {
      // slow aiming
      event.preventDefault();
      cameraControls.zoomedIn = true;

      camera.zoom = 4;
      camera.rotation.x = Math.PI / -80;
      reticle.position.set(-0.3, 1.3, -40);
      camera.updateProjectionMatrix();
    }
    if (event.keyCode === 27) {
      // pause
      event.preventDefault();
      pause = !pause;
    }
  }.bind(this)
);

// cannon movement deactivation
document.addEventListener(
  "keyup",
  function (event) {
    if (event.keyCode === 68) {
      // right
      event.preventDefault();
      cameraControls.movingRight = false;
    }
    if (event.keyCode === 65) {
      // left
      event.preventDefault();
      cameraControls.movingLeft = false;
    }
    if (event.keyCode === 87) {
      // up
      event.preventDefault();
      cameraControls.movingUp = false;
    }
    if (event.keyCode === 83) {
      // down
      event.preventDefault();
      cameraControls.movingDown = false;
    }
    if (event.keyCode === 32) {
      // fire
      event.preventDefault();
      cameraControls.firing = false;
    }
    if (event.keyCode === 16) {
      // fast aiming
      event.preventDefault();
      cameraControls.zoomedIn = false;
      camera.zoom = 1;
      camera.rotation.x = Math.PI / -25;
      camera.updateProjectionMatrix();
      reticle.position.set(0, 1.2, -10);
    }
  }.bind(this)
);

function modelCreation() {
  // asteroid
  textureUrl = "images/asteroid.jpg";
  texture = new THREE.TextureLoader().load(textureUrl);
  bumpTextureUrl = "images/asteroidBump.jpg";
  bumpTexture = new THREE.TextureLoader().load(bumpTextureUrl);
  material = new THREE.MeshPhongMaterial({ map: texture, bumpMap: bumpTexture, bumpScale: 0.5 });

  geometry = new THREE.TetrahedronGeometry(3, 2);
  asteroidModel = new THREE.Mesh(geometry, material);
  asteroidModel.receiveShadow = true;

  // bullet
  geometry = new THREE.DodecahedronGeometry(0.3, 0);
  material = new THREE.MeshBasicMaterial({ color: 0xff0000 });
  bulletModel = new THREE.Mesh(geometry, material);
  bulletModel.castShadow = true;
  bulletModel.receiveShadow = true;

  // cannon light that emulates light when firing the cannon
  minilight = new THREE.PointLight(0xff0000, 0, 4.5);
  minilight.position.z += 5;
  minilight.position.y -= 1;
  minilight.castShadow = true;
  minilight.shadow.camera.near = 1;
  minilight.shadow.camera.far = 200;
  minilight.shadow.camera.fov = 90;
  minilight.shadow.mapSize.width = SHADOW_MAP_WIDTH;
  minilight.shadow.mapSize.height = SHADOW_MAP_HEIGHT;
}

function playAgain() {
  gunHealth = 20;
  score = 0;
  bulletsArray = null;
  bulletsArray = [];
  asteroidsArray = null;
  asteroidsArray = [];
  gameOver = false;
  sphereGun.health = gunHealth;
  platform.health = gunHealth;
  changeHealth(gunHealth);
  changeScore(score);
}

function changeHealth(givenHealth) {
  $("#health").html("Health: " + givenHealth);
}
function changeScore(givenScore) {
  $("#score").html("Score: " + givenScore);
}
function gameOverScreen() {
  if (score > highScore) highScore = score;
  $("#gameOver").html("GAME OVER");
  $("#gameOverInstructions").html("PRESS ENTER TO PLAY AGAIN!");
  $("#highScore").html("High score: " + highScore);
}

function getRndInteger(min, max) {
  return Math.floor(Math.random() * (max - min)) + min;
}
