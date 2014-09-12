var Game = function() {
  // Set the width and height of the scene.
  this._width = 1280;
  this._height = 720;

  // Setup the rendering surface.
  this.renderer = new PIXI.CanvasRenderer(this._width, this._height);
  document.body.appendChild(this.renderer.view);

  // Create the main stage to draw on.
  this.stage = new PIXI.Stage();

  // Create a world for the physics engine
  this.world = new p2.World({
    gravity: [0,0]
  });

  //speed parameters for the ship
  this.speed = 100;
  this.turnspeed = 2;

  //listen for key events
  window.addEventListener('keydown', function(event) {
    this.handleKeys(event.keyCode, true)
  }.bind(this), false);

  window.addEventListener('keyup', function(event) {
    this.handleKeys(event.keyCode, false)
  }.bind(this), false);

  this.enemyBodies = [];
  this.enemyGraphics = [];

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
    //
    this.createShip();

    //spawn random ships
    this.createEnemies();

    // Begin the first frame.
    requestAnimationFrame(this.tick.bind(this));
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

      // Attach the star to the stage.
      this.stage.addChild(star);
    }
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
    this.stage.addChild(walls);    
  },

  /**
  * Create the ship, the hero of our game
  */

  createShip: function() {
    //Create the ship object

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

    this.shipGraphics = new PIXI.Graphics();

    this.shipGraphics.beginFill(0x20d3fe);
    this.shipGraphics.moveTo(0,0);
    this.shipGraphics.lineTo(-26,60);
    this.shipGraphics.lineTo(26,60);
    this.shipGraphics.endFill();

    // Add an engine to the ship
    this.shipGraphics.beginFill(0x1495d1);
    this.shipGraphics.drawRect(-15, 60, 30, 8);
    this.shipGraphics.endFill();

    //attach to the stage

    this.stage.addChild(this.shipGraphics);
    

  },

  createEnemies: function() {
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
        velocities: [vx, vy],
        andularVelocity: va
      });
      var enemyShape = new p2.Circle(20)
      enemy.addShape(enemyShape);
      this.world.addBody(enemy);

      //create the graphics object
      var enemyGraphics = new PIXI.Graphics();
      enemyGraphics.beginFill(0x38d41a);
      enemyGraphics.drawCircle(x, y, 20);
      enemyGraphics.endFill();
      enemyGraphics.beginFill(0x2aff00)
      enemyGraphics.lineStyle(1, 0x239d0b , 1);
      enemyGraphics.drawCircle(x, y, 10);
      enemyGraphics.endFill();

      this.stage.addChild(enemyGraphics);

      //keep track of the enemies
      this.enemyBodies.push(enemy);
      this.enemyGraphics.push(enemyGraphics);

    }.bind(this), 1000)
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
      this.ship.angularVelocity = -1 * this.turnspeed;
    } else if (this.keyRight) {
      this.ship.angularVelocity = 1 * this.turnspeed;
    } else {
      this.ship.angularVelocity = 0;
    }

    //apply the force vector to the ship
    if (this.keyUp) {
      var angle = this.ship.angle + Math.PI / 2;
      this.ship.force[0] -= this.speed * Math.cos(angle);
      this.ship.force[1] -= this.speed * Math.sin(angle);
    }

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

    //Update the pos. of the graphics based on the simulation position
    this.shipGraphics.x = this.ship.position[0];
    this.shipGraphics.y = this.ship.position[1];
    this.shipGraphics.rotation = this.ship.angle;

    //update enemy positions
    for (var i = 0; i < this.enemyBodies.length; i++) {
      this.enemyGraphics[i].x = this.enemyBodies[i].position[0];
      this.enemyGraphics[i].y = this.enemyBodies[i].position[1];
    }

    //step the physics simulation forward
    this.world.step(1 / 60);
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