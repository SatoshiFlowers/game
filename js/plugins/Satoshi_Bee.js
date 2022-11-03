//=============================================================================
// Satoshi_Bee
// Satoshi_Bee.js
//=============================================================================


//=============================================================================
/*:
* @target MZ
* @plugindesc [RPG Maker MZ] [Satoshi_Bee Minigame]
* @author Mouradif
* @url https://satoshiflowers.art
*
* @help
* ============================================================================
* Created a plugin command to connect discord
* ============================================================================
*
* @param statusVariable
* @text Status Variable ID
* @desc ID of the variable where the Ethereum Status should be stored (10 = playing, Anything else = not playing)
* @type number
*
* @command start
* @text Start
* @desc Starts the game
*
*/
(function() {
  const pluginName = 'Satoshi_Bee';
  const $thisPlugin = this.$plugins.find(p => p.name === pluginName);
  const phaserScript = document.createElement('script');
  phaserScript.src = 'js/libs/phaser.js';
  document.head.appendChild(phaserScript);

  const cssLink = document.createElement('link');
  cssLink.rel = 'stylesheet';
  cssLink.type = 'text/css';
  cssLink.href = 'css/addon.css';
  document.head.appendChild(cssLink);

  PluginManager.registerCommand(pluginName, 'start', () => {
    $gameVariables.setValue($thisPlugin.parameters.statusVariable, 10);
    console.log('Starting Bee Game');
    const existingMinigame = document.querySelector('body > #minigame');
    if (existingMinigame) return;

    const gameCanvas = document.querySelector('canvas#gameCanvas');
    gameCanvas.classList.add('blurry');
    const minigame = document.createElement('div');
    minigame.id = 'minigame';
    const beegame = document.createElement('div');
    beegame.id = 'beegame';
    minigame.appendChild(beegame);
    document.body.appendChild(minigame);
    const configurations = {
      type: Phaser.AUTO,
      parent: "beegame",
      width: 288,
      height: 512,
      backgroundColor: '#049cd8',
      physics: {
        default: 'matter',
        matter: {
          gravity: false,
          debug: false
        }
      },
      fps: {
        target: 60,
        forceSetTimeOut: true
      },
      scene: {
        preload: preload,
        create: create,
        update: update,
      }
    }

    const game = new Phaser.Game(configurations);
    const baseVelo = 5;
    const baseSpeed = 5;
    let _this;
    let bee, shapes, textScore, init_tap, veloTimeout, speedTimeout, audio1, audio2, goRuche;
    let score = 0;
    let highScore = 0;
    let energy = 10;
    let startEnergy = 10;
    let velo = baseVelo;
    let speed = baseSpeed;
    let speedPerso = 3;
    let addToEnergy = 5;
    let subToEnergy = 0.2;
    let maxEnergy = 10;
    let isGameOver = false;
    let isStarted = false;
    let timerLaunch = false;
    let beez = false;
    let finished = false;


    function preload() {

      this.load.image('healthbg', 'assets/healthbar.png');
      this.load.image('init_tap', 'assets/init_tap.png');
      this.load.image('background', 'assets/bg2.png');
      this.load.image('ruche', 'assets/ruche.png');
      this.load.image('restart', 'assets/restart-button.png');
      this.load.image('ground', 'assets/grass.png');
      this.load.atlas('sprites', 'assets/sprites.png', 'assets/sprites.json');
      this.load.json('shapes', 'assets/test.json');
      this.load.spritesheet('bee', 'assets/bee-sprite2.png', {
        frameWidth: 656,
        frameHeight: 619
      });
      this.load.audio('music', 'assets/audio/Saoshi1_loop.ogg');
      this.load.audio('music2', 'assets/audio/Satoshi2.ogg');
    }

    function create() {
      _this = this;
      this.background = this.add.tileSprite(0, game.config.height/2 - 56, 0, 0, "background");
      this.ground = this.add.tileSprite(0, game.config.height - 22, 0, 0, "ground");
      init_tap = this.add.image(game.config.width/2, game.config.height - 100, 'init_tap').setDepth(20).setOrigin(0.5, 1.0).setScale(1.5).setInteractive();
      this.healthbg = this.add.image(5, 5, 'healthbg').setDepth(10).setOrigin(0, 0).setScale(0.8);
      this.graphics = this.add.graphics();
      setHealthBar(50, this);
      audio = this.sound.add('music');
      audio1 = this.sound.add('music2');

      bee = this.matter.add.sprite(game.config.width/2, game.config.height/2, 'sprites', 'bee1.png').setScale(0.5);
      bee.body.label = "bee";
      bee.ignoreGravity = true;

      // INIT
      energy = startEnergy;
      score = 0;
      init_tap.on('pointerdown', startGame);


      // TEXT
      textScore = this.add.text(game.config.width - 5, 10, '', {
        font: '35px Arial',
        fill: '#f5c31e',
        align: 'right',
        boundsAlignH: 'right',
        boundsAlignV: 'top'
      }).setDepth(15);

      textScore.setOrigin(1.0, 0.0);
      textScore.setText(score);
      //TEST
      //this.matter.world.setBounds(0, 0, game.config.width, game.config.height);

      // CONTROLS
      this.cursor = this.input.keyboard.createCursorKeys();
      this.pointer = this.input.activePointer;

      // LOAD SHAPES
      shapes = this.cache.json.get('shapes');


      // GROUPS
      flowers = this.add.group();
      persos = this.add.group();
      persos2 = this.add.group();
      birds = this.add.group();

      // ANIMS
      createAnims(this);

      var obstacles =['perso', 'perso1', 'birdYellow', 'birdBlue', 'birdFire'];
      var flowerType =['flower', 'flower2', 'flower3'];
      this.matter.world.on('collisionstart', function (event, oA, oB) {
        var bodyA = getRootBody(oA);
        var bodyB = getRootBody(oB);

        if ((bodyA.label === 'bee' && flowerType.includes(bodyB.label)) || (bodyB.label === 'bee' && flowerType.includes(bodyA.label))) {
          if(bodyA.label === 'bee' && bodyB.gameObject != null) {
            if (bodyB.label === 'flower2')
              bonusSpeed();
            if (bodyB.label === 'flower3')
              bonusInverse()
            bodyB.gameObject.destroy();
          } else {
            if (bodyA.gameObject != null) {
              if (bodyA.label === 'flower2')
                bonusSpeed();
              if (bodyA.label === 'flower3')
                bonusInverse()
              bodyA.gameObject.destroy();
            }
          }
          addEnergy();
        }

        if ((bodyA.label === 'bee' && obstacles.includes(bodyB.label)) || (bodyB.label === 'bee' && obstacles.includes(bodyA.label))) {
          if(bodyA.label === 'bee' && bodyB.gameObject != null) {
            bodyB.gameObject.destroy();
          } else {
            if (bodyA.gameObject != null) {
              bodyA.gameObject.destroy();
            }
          }
          gameOver();
        }
      });
    }

    function update() {
      if (finished) return;
      // const percent = Phaser.Math.Clamp(value, 0, 80) / width;

      // NO GAME OVER
      if (!isGameOver) {
        setHealthBar (energy, this)
        this.background.tilePositionX += 0.5;
        this.ground.tilePositionX += 1.5;
        textScore.setText(score);

        if (energy <= 0 || bee.y >= 428) {
          gameOver();
        }

        // DESTROY OUT SCREEN
        flowers.children.iterate(function (child) {
          if (child == undefined)
            return

          if (child.x < -50) {
            child.destroy()
          } else {
            child.x -= speed
          }
        })

        persos.children.iterate(function (child) {
          if (child == undefined)
            return

          if (child.x < -50) {
            child.destroy()
          } else {
            child.x -= speed
          }
        })

        persos2.children.iterate(function (child) {
          if (child == undefined)
            return

          if (child.x < -50) {
            child.destroy()
          } else {
            child.x -= speed
          }
        })

        birds.children.iterate(function (child) {
          if (child == undefined)
            return

          if (child.x < -50) {
            child.destroy()
          } else {
            child.x -= speed
          }
        })
      }

      // BEE MOVE
      if(isStarted) {
        if (bee.x >= 55) {
          bee.x -= 5;
        } else {
          bee.x = 50;
        }
        if (!timerLaunch) {
          // TIMER
          timer = this.time.addEvent({
            delay: 150,
            callback: consoEnergy,
            callbackScope: this,
            loop: true,
          })

          timerFlowers = this.time.addEvent({
            delay: 3000,
            callback: makeFlowers,
            callbackScope: this,
            loop: true,
          })

          timerScore = this.time.addEvent({
            delay: 1000,
            callback: updateScore,
            callbackScope: this,
            loop: true,
          })
          timerLaunch = true;
        }

        if((this.cursor.up.isDown || this.pointer.isDown) && !isGameOver) {
          if(bee.y <= 20) {
            if (velo > 0) {
              bee.setVelocityY(0)
            } else {
              bee.setVelocityY(-velo)
            }
          } else {
            bee.setVelocityY(-velo);
          }

          if (bee.angle > -15)
            bee.angle -= 5
          if (bee.angle < -15)
            bee.angle = -15
        } else {
          bee.setVelocityY(velo)

          if (bee.angle < 30)
            bee.angle += 1

          if(bee.y >= 429)
            bee.setVelocityY(0)

          if(bee.y <= 20)
            bee.y = 20
        }
      } else {
        if (beez) {
          bee.y -= 1;
        } else {
          bee.y += 1;
        }

        if (bee.y <= 240)
          beez = false;

        if (bee.y >= 270)
          beez = true;

      }
    }


    function makeFlowers() {

      let posY = Phaser.Math.Between(100, game.config.height - 120);


      if (Phaser.Math.Between(0, 100) < 40) {
        let type = Phaser.Math.Between(1, 2);
        switch (type) {
          case 1:
            flo = this.matter.add.image(300, posY, 'sprites', 'flower2.png', {shape: shapes.flower2});
            break
          case 2:
            flo = this.matter.add.image(300, posY, 'sprites', 'flower3.png', {shape: shapes.flower3});
            break
        }
      } else {
        flo = this.matter.add.image(300, posY, 'sprites', 'flower.png', {shape: shapes.flower});
      }

      flowers.add(flo);

      if (Phaser.Math.Between(0, 100) < 30) {
        this.time.addEvent({
          delay: 750,
          callback: makePersos,
          callbackScope: this,
          loop: false,
        })
      }

      if (Phaser.Math.Between(0, 100) > 70) {
        this.time.addEvent({
          delay: 1500,
          callback: makePersos2,
          callbackScope: this,
          loop: false,
        })
      }

      if (Phaser.Math.Between(0, 100) > 40) {
        this.time.addEvent({
          delay: 1000,
          callback: makeBirds,
          callbackScope: this,
          loop: false,
        })
      }
    }

    function makePersos() {
      perso = this.matter.add.image(300, game.config.height - 125, 'sprites', 'perso.png', {shape: shapes.perso});
      persos.add(perso);
    }

    function makePersos2() {
      perso = this.matter.add.image(300, game.config.height - 125, 'sprites', 'perso2.png', {shape: shapes.perso});
      persos.add(perso);
    }

    function makeBirds() {
      let posY = Phaser.Math.Between(100, 250);
      let type = Phaser.Math.Between(1, 3);
      if (type == 1) {
        bird = this.matter.add.image(300, posY, 'sprites', 'birdFire.png', {shape: shapes.birdFire});
      }
      if (type == 2) {
        bird = this.matter.add.image(300, posY, 'sprites', 'birdBlue.png', {shape: shapes.birdBlue});
      }
      if (type == 3) {
        bird = this.matter.add.image(300, posY, 'sprites', 'birdYellow.png', {shape: shapes.birdYellow});
      }
      birds.add(bird);
    }

    function getRootBody(body) {
      if (body.parent === body) {
        return body;
      }
      while (body.parent !== body) {
        body = body.parent;
      }
      return body;
    }

    function createAnims(scene) {
      scene.anims.create({
        key: 'fly',
        frames: scene.anims.generateFrameNames('sprites',{
          prefix: "bee",
          suffix: ".png",
          start: 1,
          end: 3,
          zeroPad: 1
        }),
        frameRate: 20,
        repeat: -1
      });
      bee.play("fly");
    }

    function addEnergy() {
      energy = Phaser.Math.MaxAdd(energy, addToEnergy, maxEnergy);
      score += 1;
    }

    function consoEnergy() {
      energy = Phaser.Math.MinSub(energy, subToEnergy, 0);
    }

    function setHealthBar (value, scene) {
      const width = 80;
      const percent = (value / maxEnergy);

      scene.graphics.clear();
      scene.graphics.fillStyle(0x808080);
      scene.graphics.fillRoundedRect(50, 26, width, 10, 2);
      scene.graphics.fillStyle(0xf5c31e);
      scene.graphics.fillRoundedRect(50, 26, width * percent, 10, 2);
      scene.graphics.setDepth(18);
    }

    function updateScore() {
      score += 1;
    }

    function bonusSpeed() {
      speed += 2;
      velo += 1;

      speedTimeout = setTimeout(function() {
        speed = baseSpeed;
        velo = baseVelo;
      }, 5000)
    }

    function bonusInverse() {
      velo = -baseVelo;
      bee.flipY = true;

      if (veloTimeout) {
        clearTimeout(veloTimeout);
      }

      veloTimeout = setTimeout(function() {
        velo = -velo;
        bee.flipY = false;
      }, 5000)
    }


    function startGame() {
      isStarted = true;
      audio.play();
      init_tap.destroy();
    }

    function gameOver(th) {
      isGameOver = true;
      timerFlowers.remove();
      timer.remove();
      timerScore.remove();
      bee.stop('fly');
      audio.stop();
      audio1.play();

      if (highScore < score)
        highScore = score

      bee.setVelocityY(velo)
      if (bee.angle < 40)
        bee.angle += 2

      if(bee.y >= 480)
        bee.setVelocityY(0)

      displayGameOver();
    }

    function displayGameOver() {
      rect = _this.add.rectangle(0, 0, game.config.width, game.config.height, 0x000).setOrigin(0, 0).setDepth(19);
      rect.alpha = 0.5;
      // txtGO = _this.add.text(game.config.width/2, 150, 'Game Over', {
      //     font: '38px Arial',
      //     fill: '#f5c31e',
      //     align: 'center',
      //     boundsAlignH: 'right',
      //     boundsAlignV: 'top'
      // }).setDepth(20);

      // txtGO.setOrigin(0.5, 0.5);

      txtGOScore = _this.add.text(game.config.width/2, game.config.height/2 - 100,'', {
        font: '38px Arial',
        fill: '#f5c31e',
        align: 'center',
        boundsAlignH: 'right',
        boundsAlignV: 'top'
      }).setDepth(20);

      txtGOScore.setOrigin(0.5, 0.5);
      txtGOScore.setText('Score: '+ score + '\n High score: ' + highScore);

      goRuche = _this.add.image(game.config.width/2, 400, 'ruche').setDepth(25).setScale(1.2);

      restartButton = _this.add.image(game.config.width/2, 300, 'restart').setInteractive()
      restartButton.on('pointerdown', restartGame)
      restartButton.setDepth(20)
    }

    function restartGame(th) {
      flowers.clear(true, true);
      persos.clear(true, true);
      persos2.clear(true, true);
      bee.destroy();
      isGameOver = false;
      isStarted = false;
      timerLaunch = false;
      velo = baseVelo;
      speed = baseSpeed;
      clearTimeout(veloTimeout);
      clearTimeout(speedTimeout);
      _this.registry.destroy();
      _this.events.off();
      _this.scene.restart();
      audio1.stop();
      document.body.removeChild(minigame);
      gameCanvas.classList.remove('blurry');
      $gameVariables.setValue($thisPlugin.parameters.statusVariable, 0);
      finished = true;
    }
  })
})();

