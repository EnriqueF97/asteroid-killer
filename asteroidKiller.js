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
  bulletsArray = [],
  asteroidCount = 0,
  bulletCount = 0,
  asteroidsArray = [],
  elapsedTime = 0,
  score = 0,
  highScore = 0,
  gameOver = false,
  pause = false,
  zoomedIn = false,
  dispersionAmount = 0,
  //                                                                                  gameplay tunning
  cannonPOV = true, // false for orbit controls, true for cannon POV
  asteroidsDifficulty = 2, // less is more asteroids at once
  asteroidSpeed = 0.3, // More is faster trayectory
  fireRate = 0.04, // less is faster shooting
  bulletDamage = 10, // damage from every bullet to asteroid
  bulletSpeed = 4, // speed of the bullet
  gunHealth = 20, // players health
  asteroidDamage = 1, // how much an asteroid hit will deal
  cannonRotationSpeed = 1.5, // more is faster rotation
  scorePerAsteroidDestroyed = 10, // score per asteroid destroyed (lol)
  asteroidHealth = 60, // health of each asteroid
  slowCameraMovementSpeed = 5, // more is slower camera movement
  test = true,
  outOfBoundsLimit = 200;

// estados de movimiento de cañon
let movingRight = false,
  movingLeft = false,
  movingUp = false,
  movingDown = false,
  firing = false,
  slowMoving = false;

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
  crosshair = null,
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
  textureUrl = "images/crosshair.png";
  texture = new THREE.TextureLoader().load(textureUrl);
  bumpTexture = new THREE.TextureLoader().load(bumpTextureUrl);
  material = new THREE.MeshBasicMaterial({ map: texture, side: THREE.DoubleSide, transparent: true, opacity: 1 });
  geometry = new THREE.PlaneGeometry(1, 1, 32);
  crosshair = new THREE.Mesh(geometry, material);
  crosshair.position.set(0, 1.2, -10);
  camera.add(crosshair);
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
    cannonShotSound.duration = fireRate;
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
    asteroidHitSound.setVolume(0.04);
    asteroidHitSound.duration = fireRate;
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

    if (cannonPOV) {
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

function fireBullet(position) {
  let bullet = bulletModel.clone();
  bullet.bulletId = bulletCount;
  bullet.time = Date.now();
  bulletCount += 1;
  bullet.position = position;
  bullet.position.y += 1.8;

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
  bullet.shootZ = applyDispersion(shootDirection.z, dispersionAmount);
  bullet.shootY = applyDispersion(shootDirection.y, dispersionAmount);
  bullet.shootX = applyDispersion(shootDirection.x, dispersionAmount);
  // collision
  bullet.box = new THREE.Box3().setFromObject(bullet);
  bullet.bbox = new THREE.BoxHelper(bullet, 0x00ff00);
  bullet.time = Date.now();
  bulletsArray.push(bullet);
  world.add(bullet);
}

function applyDispersion(value, dispersionAmount = 0.01) {
  return value + (Math.random() - 0.5) * 2 * dispersionAmount;
}

function createAsteroid() {
  let asteroid = asteroidModel.clone();
  asteroid.asteroidId = asteroidCount;
  asteroid.health = asteroidHealth;
  asteroid.date = Date.now();
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

    // gun rotation
    if (movingUp) {
      if (sphereGun.rotation.x < 4.5) {
        sphereGun.rotation.x += !zoomedIn ? angle * cannonRotationSpeed : (angle * cannonRotationSpeed) / slowCameraMovementSpeed;
      }
    }
    if (movingDown) {
      if (sphereGun.rotation.x > 2.9) {
        sphereGun.rotation.x -= !zoomedIn ? angle * cannonRotationSpeed : (angle * cannonRotationSpeed) / slowCameraMovementSpeed;
      }
    }
    if (movingLeft) {
      movingGun.rotation.y += !zoomedIn ? angle * cannonRotationSpeed : (angle * cannonRotationSpeed) / slowCameraMovementSpeed;
    }
    if (movingRight) {
      movingGun.rotation.y -= !zoomedIn ? angle * cannonRotationSpeed : (angle * cannonRotationSpeed) / slowCameraMovementSpeed;
    }

    if (firing) {
      if (seconds > fireRate) {
        cannonShotSound.play();
        minilight.intensity = 4;
        fireBullet(sphereGun.getWorldPosition());
        if (screenShake.enabled == false) {
          screenShake.shake(camera, new THREE.Vector3(0, 0, 0.12), fireRate * 1000 - 0.2 /* ms */);
        }
        seconds = 0;
      }
    }
    //this is used to make the lighting ilusion while shooting the cannon
    if (minilight.intensity >= 0) {
      minilight.intensity -= 1;
    }

    // asteroid generation, asteroidsDifficulty will be lowering as time goes by spawning asteroids quicker
    if (waitForNewAsteroid > asteroidsDifficulty) {
      createAsteroid();
      waitForNewAsteroid = 0;
      if (asteroidsDifficulty >= 0.99) asteroidsDifficulty -= 0.05;
    }
    // bullet dispersion

    if (firing && dispersionAmount < 0.03) dispersionAmount += 0.0003;
    if (!firing) dispersionAmount = dispersionAmount > 0 ? dispersionAmount - 0.03 : 0;
    if (dispersionAmount > 0) console.log(dispersionAmount);

    // bullets update
    for (const bullet of bulletsArray) {
      // movement
      bullet.position.z += bullet.shootZ * bulletSpeed;
      bullet.position.y += bullet.shootY * bulletSpeed;
      bullet.position.x += bullet.shootX * bulletSpeed;
      bullet.box = new THREE.Box3().setFromObject(bullet);
      bullet.bbox = new THREE.BoxHelper(bullet, 0x00ff00);

      // delete bullet if it goes out of bounds
      if (
        bullet.position.z < -outOfBoundsLimit ||
        bullet.position.z > outOfBoundsLimit ||
        bullet.position.x < -outOfBoundsLimit ||
        bullet.position.x > outOfBoundsLimit
      ) {
        world.remove(bullet);
        let index = bulletsArray.indexOf(bullet);
        bulletsArray.splice(index, 1);
      }

      // check for collisions with asteroids
      for (const as of asteroidsArray) {
        // removing of bullets who lived to tell the story
        let deltaTimeAsteroid = now - as.time;
        if (deltaTimeAsteroid > 13000) {
          let index = asteroidsArray.indexOf(as);
          world.remove(as);
          asteroidsArray.splice(index, 1);
        }

        if (as.box.intersectsBox(bullet.box)) {
          asteroidHitSound.play();
          // destroy bullet
          world.remove(bullet);

          let index = bulletsArray.indexOf(bullet);
          bulletsArray.splice(index, 1);
          //lower asteroid health
          as.health -= bulletDamage;
          // if asteroid health is lower than 0 we remove it from the scene
          if (as.health <= 0) {
            asteroidDestructionSound.play();
            world.remove(as);

            index = asteroidsArray.indexOf(as);
            asteroidsArray.splice(index, 1);
            score += scorePerAsteroidDestroyed;
            changeScore(score);
          }
        }
      }
    }

    // asteroids update
    for (const as of asteroidsArray) {
      // movement
      as.position.z -= as.movZ * asteroidSpeed;
      as.position.x -= as.movX * asteroidSpeed;
      as.position.y -= as.movY * asteroidSpeed;
      as.rotation.x += angle;
      as.rotation.y -= angle;
      as.box = new THREE.Box3().setFromObject(as);

      // asteroids check for collision with objects
      // collision with invincibleBox
      if (invincibleBoxCol.intersectsBox(as.box)) {
        asteroidMinorImpact.play();
        // destroy asteroid
        let index = asteroidsArray.indexOf(as);
        world.remove(as);
        asteroidsArray.splice(index, 1);
        // weak camera shake
        if (screenShake.enabled == false) {
          screenShake.shake(camera, new THREE.Vector3(0, 0.1, 0), 250 /* ms */);
        }
      }
      // collision with platformBox
      if (platformBox.intersectsBox(as.box)) {
        // destroy asteroid
        let index = asteroidsArray.indexOf(as);
        world.remove(as);
        asteroidsArray.splice(index, 1);
        //sound
        asteroidImpactSound.play();
        // lower sphereGun health
        platform.health -= asteroidDamage;
        changeHealth(platform.health);
        console.log(platform.health);
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
    asteroidsArray = null;
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
      movingRight = true;
    }
    if (event.keyCode === 65) {
      // left
      event.preventDefault();
      movingLeft = true;
    }
    if (event.keyCode === 87) {
      // up
      event.preventDefault();
      movingUp = true;
    }
    if (event.keyCode === 83) {
      // down
      event.preventDefault();
      movingDown = true;
    }
    if (event.keyCode === 32) {
      // fire
      event.preventDefault();
      console.log(dispersionAmount);
      firing = true;
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
      zoomedIn = true;

      camera.zoom = 4;
      camera.rotation.x = Math.PI / -80;
      crosshair.position.set(-0.3, 1.3, -40);
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
      movingRight = false;
    }
    if (event.keyCode === 65) {
      // left
      event.preventDefault();
      movingLeft = false;
    }
    if (event.keyCode === 87) {
      // up
      event.preventDefault();
      movingUp = false;
    }
    if (event.keyCode === 83) {
      // down
      event.preventDefault();
      movingDown = false;
    }
    if (event.keyCode === 32) {
      // fire
      event.preventDefault();
      dispersionAmount > 0 ? dispersionAmount - 0.03 : 0;
      console.log(dispersionAmount);
      firing = false;
    }
    if (event.keyCode === 16) {
      // fast aiming
      event.preventDefault();
      zoomedIn = false;
      camera.zoom = 1;
      dispersionAmount = 0;
      camera.rotation.x = Math.PI / -25;
      camera.updateProjectionMatrix();
      crosshair.position.set(0, 1.2, -10);
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
  asteroidsDifficulty = 3;
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
