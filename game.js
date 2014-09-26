var Game = function() {
  // Set the width and height of the scene.
  this._width = 1280;
  this._height = 720;

  //setup the background canvas
  this.bgRenderer = new PIXI.CanvasRenderer(this._width, this._height);
  document.body.appendChild(this.bgRenderer.view);
  //create the background stage for static elements.
  this.bgStage = new PIXI.Stage();

  // Setup the rendering surface.
  this.renderer = new PIXI.CanvasRenderer(this._width, this._height, null, true);
  document.body.appendChild(this.renderer.view);

  // Create the main stage to draw on.
  this.stage = new PIXI.Stage();  

  // Create a world for the physics engine
  this.world = new p2.World({
    gravity: [0,0]
  });

  //speed parameters for the ship
  this.speed = 500;
  this.turnSpeed = 3;

  //listen for key events
  window.addEventListener('keydown', function(event) {
    this.handleKeys(event.keyCode, true);
  }.bind(this), false);

  window.addEventListener('keyup', function(event) {
    this.handleKeys(event.keyCode, false);
  }.bind(this), false);

  this.enemyBodies = [];
  this.enemyGraphics = [];
  this.removeObjs = [];

  // Start running the game.
  this.build();
};

Game.prototype = {
  /**
   * Build the scene and begin animating.
   */
  build: function() {
    // Draw the star-field in the background.
    this.drawStars();

    // Setup the boundaries of the game's arena.
    this.setupBoundaries();

    //draw the ship into the scene   
    this.createShip();

    //spawn random ships
    this.createEnemies();

    //setup howler.js audio
    this.setupAudio();

    // Begin the first frame.
    requestAnimationFrame(this.tick.bind(this));
  },

  setupAudio: function(){
    this.sounds = new Howl({
      urls: ['expSounds.wav','expSounds.ogg'],
      sprite: {
        boom1: [0, 640],
        boom2: [2000, 2140],
        boom3: [5000, 3000]
      }
    });

    this.music = new Howl({
      urls: ['space.mp3'],
      buffer: true,      
      autoplay: true,
      volume: 0.7,
      loop: true
    });
  },

  /**
   * Draw the field of stars behind all of the action.
   */
  drawStars: function() {
    // Draw randomly positioned stars.
    for (var i=0; i<1500; i++) {
      // Generate random parameters for the stars.
      var x = Math.round(Math.random() * this._width);
      var y = Math.round(Math.random() * this._height);
      var rad = Math.ceil(Math.random() * 2);
      var alpha = Math.min(Math.random() + 0.25, 1);

      // Draw the star.
      var star  = new PIXI.Graphics();
      star.beginFill(0xFFFFFF, alpha);
      star.drawCircle(x, y, rad);
      star.endFill();

      // Attach the star to the (background) stage.
      this.bgStage.addChild(star);
    }

    //render the stars once
    this.bgRenderer.render(this.bgStage);
  },

  /**
   * Draw the boundaries of the space arena.
   */
  setupBoundaries: function() {
    var walls = new PIXI.Graphics();
    walls.beginFill(0xFFFFFF, 0.5);
    walls.drawRect(0, 0, this._width, 10);
    walls.drawRect(this._width - 10, 10, 10, this._height - 20);
    walls.drawRect(0, this._height - 10, this._width, 10);
    walls.drawRect(0, 10, 10, this._height - 20);
    
    // Attach the walls to the stage.
    this.bgStage.addChild(walls);  

    //render the boundaries once
    this.bgRenderer.render(this.bgStage);
  },

  /**
  * Create the ship, the hero of our game
  */

  createShip: function() {

    //Create the ship physics object
    this.ship = new p2.Body({
      mass: 1,
      angularVelocity: 0,// 1 to make it spin!
      damping: 0,
      angularDamping: 0,
      position: [Math.round(this._width /2), Math.round(this._height /2)]
    });

    this.shipShape = new p2.Rectangle(52,69);
    this.ship.addShape(this.shipShape);
    this.world.addBody(this.ship);

    //create the ship graphics object
    var shipGraphics = new PIXI.Graphics();

    shipGraphics.beginFill(0x20d3fe);
    shipGraphics.moveTo(26,0);
    shipGraphics.lineTo(0,60);
    shipGraphics.lineTo(52,60);
    shipGraphics.endFill();

    // Add an engine to the ship
    shipGraphics.beginFill(0x1495d1);
    shipGraphics.drawRect(7, 60, 38, 8);
    shipGraphics.endFill();

    //cache the ship to only use one draw call per tick
    var shipCache = new PIXI.CanvasRenderer(52 ,69 ,null ,true);
    var shipCacheStage = new PIXI.Stage();
    shipCacheStage.addChild(shipGraphics);
    shipCache.render(shipCacheStage);
    var shipTexture = PIXI.Texture.fromCanvas(shipCache.view);
    this.shipGraphics = new PIXI.Sprite(shipTexture);

    //attach to the stage

    this.stage.addChild(this.shipGraphics);
    

  },

  createEnemies: function() {

    //create the graphics object
      var enemyGraphics = new PIXI.Graphics();
      enemyGraphics.beginFill(0x38d41a);
      enemyGraphics.drawCircle(20, 20, 20);
      enemyGraphics.endFill();
      enemyGraphics.beginFill(0x2aff00);
      enemyGraphics.lineStyle(1, 0x239d0b , 1);
      enemyGraphics.drawCircle(20, 20, 10);
      enemyGraphics.endFill();

    //create the enemy cache
    var enemyCache = new PIXI.CanvasRenderer(40,40, null, true);
    var enemyCacheStage = new PIXI.Stage();
    enemyCacheStage.addChild(enemyGraphics);
    enemyCache.render(enemyCacheStage);
    var enemyTexture = PIXI.Texture.fromCanvas(enemyCache.view);

    //create random interval to create new enemies
    this.enemyTimer = setInterval(function() {
      //create the enemy physics body
      var x = Math.round(Math.random() * this._width);
      var y = Math.round(Math.random() * this._height);
      var vx = (Math.random() -0.5) * this.speed;
      var vy = (Math.random() -0.5) * this.speed;
      var va = (Math.random() -0.5) * this.speed;
      var enemy = new p2.Body({
        position: [x, y],
        mass: 1,
        damping: 0,
        angularDamping: 0,
        velocity: [vx, vy],
        angularVelocity: va
      });
      var enemyShape = new p2.Circle(20);
      enemyShape.sensor = true;
      enemy.addShape(enemyShape);
      this.world.addBody(enemy);
      
      var enemySprite = new PIXI.Sprite(enemyTexture);
      this.stage.addChild(enemySprite);

      //keep track of the enemies
      this.enemyBodies.push(enemy);
      this.enemyGraphics.push(enemySprite);

    }.bind(this), 1000);

    this.world.on('beginContact', function(event) {
      if (event.bodyB.id === this.ship.id) {
        this.removeObjs.push(event.bodyA);
      }
    }.bind(this));
  },


  handleKeys: function(code, state) {

    switch (code) {

      case 65:// A
        this.keyLeft = state;
        break;

      case 68: //D
        this.keyRight = state;
        break;

      case 87: //W
        this.keyUp = state;
        break;
    }

  },
  
  updatePhysics: function(){

    //update the ship's angular velocities for rotation
    if (this.keyLeft) {
      this.ship.angularVelocity = -1 * this.turnSpeed;
    } else if (this.keyRight) {
      this.ship.angularVelocity = this.turnSpeed;
    } else {
      this.ship.angularVelocity = 0;
    }

    //apply the force vector to the ship
    if (this.keyUp) {
      var angle = this.ship.angle + Math.PI / 2;
      this.ship.force[0] -= this.speed * Math.cos(angle);
      this.ship.force[1] -= this.speed * Math.sin(angle);
    }

    //Update the pos. of the graphics based on the simulation position
    this.shipGraphics.x = this.ship.position[0];
    this.shipGraphics.y = this.ship.position[1];
    this.shipGraphics.rotation = this.ship.angle;

    //Warp to the other side if the ship reaches the boundaries
    if (this.ship.position[0] > this._width) {
      this.ship.position[0] = 0;
    } else if (this.ship.position[0] < 0) {
      this.ship.position[0] = this._width;
    }

    if (this.ship.position[1] > this._height){
      this.ship.position[1] = 0;
    } else if (this.ship.position[1] < 0) {
      this.ship.position[1] = this._height;
    }    

    //update enemy positions
    for (var i = 0; i < this.enemyBodies.length; i++) {
      var x = this.enemyBodies[i].position[0];
      var y = this.enemyBodies[i].position[1];
      this.enemyGraphics[i].x = x;
      this.enemyGraphics[i].y = y;

      //remove bodies that are off the map
      if (x < 0 || y < 0 || x > this._width || y > this._height){
        this.removeObjs.push(this.enemyBodies[i]);
      }
    }

    //step the physics simulation forward
    this.world.step(1 / 60);

    //remove enemy bodies
    for (i=0; i<this.removeObjs.length; i++) {

      this.world.removeBody(this.removeObjs[i]);

      var index = this.enemyBodies.indexOf(this.removeObjs[i]);

      if (index) {
        this.enemyBodies.splice(index, 1);
        this.stage.removeChild(this.enemyGraphics[index]);
        this.enemyGraphics.splice(index, 1);
      }

      //play random BOOM
      //this.sounds.play('boom' + (Math.ceil(Math.random() * 3)));
      
    }
    
    this.removeObjs.length = 0;

  },

  /**
   * Fires at the end of the gameloop to reset and redraw the canvas.
   */
  tick: function() {
    this.updatePhysics();

    // Render the stage for the current frame.
    this.renderer.render(this.stage);

    // Begin the next frame.
    requestAnimationFrame(this.tick.bind(this));
  }
};