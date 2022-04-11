/**
 * The script is after the code of the suvery.
 * The script contains the logic of the after-survey game process.
 * Including
 *      lobby scene
 *      puzzle scene
 *
 * After the player finished the survey, wheel info is stored in the window.sessionStorage
 * The program will 
 * 1. create a game using lobby scene based on global variable gameconfig.
 * 2. the game will load the UI system and add events.
 * 3. the game will create a Player() object mainPlayer with the fields: id, wheelInfo, gameObject, currentText.
 *    The wheelInfo will be read first from localStorage and other fields will be filled later.
 * 4. In an ideal scenario, the program will generate the sprite according to the wheel info, but I haven't figured this
 *    out. This part will be paused. For now, we will use the default culture wheel asset as the gameObject/sprite
 *    for the mainPlayer.
 * 5. Start the network using socket.io. Once connected, send "init" message to the server and the server will
 *    emit "playerData" with the id of the mainPlayer and other player objects.
 * 6. After receiving the playerData, the program will create other player objects and change the state to initialised
 * 7. The game will update the scene.players array when new player joined by responding to socket message
 * 8.
 */

let settings;
fetch("./settings.json")
.then(response => {
   return response.json();
})
.then(data => {
  settings = data;
});

var game; 
var buckets = [];
var camMoveTimes = 0;
var frameNames;
var inited = false;
var sovledIndeed = false;
var playersCount = 0;
let devicePixelRatio = window.devicePixelRatio;
//devicePixelRatio = 1.5; // just for testing

let isMobile = clientType === 1;
let isLobby = phase === 0;

// all should be empty
var puzzleOptions = {
  cultures: [],
  values: [],
  points: [],
  expectedPlayerIds: [], // 2d array
};

var gameOptions = {
  curCulture: "music",
  curIndex: 0,
  cultures: ["music", "food", "hobby", "finances", "home", "ethnicity"],
  colors: [0xcc3f8d, 0xd15947, 0xc7873e, 0x34a359, 0x5482cc, 0x7755b5],
  textColors:["#cc3f8d", "#d15947", "#c7873e", "#34a359", "#5482cc", "#7755b5"],
  paleColors: [0xe1a3be, 0xe6b7a2, 0xebcf9a, 0xc0d0aa, 0xa7d7dc, 0xb6a6d5],
  colorMapping: {
    music: 0xcc3f8d,
    food: 0xd15947,
    hobby: 0xc7873e,
    economics: 0x34a359,
    location: 0x5482cc,
    ethnicity: 0x7755b5,
  },
  spinDuration: 500, // milliseconds
  speed: 0.10,
  viewportWidth: isMobile ? window.innerWidth * devicePixelRatio : window.innerWidth * 3,
  viewportHeight: isMobile ? window.innerHeight * devicePixelRatio : window.innerHeight * 3,
  worldWidth: isMobile ? 4000: window.innerWidth * 3,
  worldHeight: isMobile ? 4000: window.innerHeight * 3,
  wheelRadius: 150,
  buttonRadius: 50,
  buttonPadding: 50,
  joyStickRadius: 100,
  joyStickPadding: 100,
  // Options for text display
  playerTextDistance: 250,
  playerTextWidth: 300,
  playerTextHeight: 150,
  playerTextFont: "Georgia",
  playerTextFontSize: 48,
  playerTextColor: "#ffffff",
  playerTextBackgroundColor: "#f8f0dd",
  playerTextHeightCo: 1.5,
};

function MainPlayer(info, scores) {
  this.info = info;
  this.scores = scores;
  this.gameObject = null;
  this.text = null;
  this.uuid = null;
}

function generatePos(index){
  let Pos = new Array(16);
  for(let i = 0; i < Pos.length; i++){
    Pos[i] = new Array(2);
  }
  
  let slice = 4;
  let l = gameOptions.worldWidth/slice;
  let h = gameOptions.worldWidth/slice;
  let count = 0;
  let margin = 200;
  
  for(let i = 0; i < slice; i++){//h
    for(let j = 0; j < slice; j++){//l
      Pos[count][0] = getRndInt(j*l+margin, (j+1)*l-margin);
      Pos[count][1] = getRndInt(i*h+margin, (i+1)*h-margin);
      count++;
    }
  }
  
  return Pos[index];
}

function getRndInt(min, max) {
  return Math.floor(Math.random() * (max - min) ) + min;
}


class Lobby extends Phaser.Scene {
  constructor() {
    super("lobby");
  }

  preload() {

    // plugins
    let url;
    url =
      "https://raw.githubusercontent.com/rexrainbow/phaser3-rex-notes/master/dist/rexvirtualjoystickplugin.min.js";
    this.load.plugin("rexvirtualjoystickplugin", url, true);
    url =
      "https://raw.githubusercontent.com/rexrainbow/phaser3-rex-notes/master/dist/rexroundrectangleplugin.min.js";
    this.load.plugin("rexroundrectangleplugin", url, true);
    this.load.scenePlugin('rexgesturesplugin', 'https://raw.githubusercontent.com/rexrainbow/phaser3-rex-notes/master/dist/rexgesturesplugin.min.js', 'rexGestures', 'rexGestures');

    // art asset
    this.load.image(
      "BG",
      "https://cdn.glitch.global/41cfbc99-0cac-46f3-96da-fc7dae72a57b/BG.png?v=1647550334928"
    );
    this.load.image(
      "selectWheel",
      "https://cdn.glitch.global/41cfbc99-0cac-46f3-96da-fc7dae72a57b/Wheel%20-%206%20%2B%20I%20%2B%20H.png?v=1648568574661"
    );
    this.load.image(
      "portal",
      "https://cdn.glitch.global/41cfbc99-0cac-46f3-96da-fc7dae72a57b/Portal.png?v=1645844942744"
    );
    this.load.image(
      "bucket",
      "https://cdn.glitch.global/41cfbc99-0cac-46f3-96da-fc7dae72a57b/Pool.png?v=1645850278468"
    );
    this.load.image(
      "arrowForward",
      "https://cdn.glitch.global/41cfbc99-0cac-46f3-96da-fc7dae72a57b/ArrowForward.png?v=1647550701053"
    );
    this.load.image(
      "arrowBackward",
      "https://cdn.glitch.global/41cfbc99-0cac-46f3-96da-fc7dae72a57b/ArrowBackward.png?v=1647550760942"
    );
    this.load.image(
      "QRCode",
      "https://cdn.glitch.global/41cfbc99-0cac-46f3-96da-fc7dae72a57b/QRCode.png?v=1647873061693"
    );
    this.load.atlas(
      "anim",
      "https://cdn.glitch.global/41cfbc99-0cac-46f3-96da-fc7dae72a57b/anim2.png?v=1648100690816",
      "anim2.json"
    );
    this.load.image(
      "thumbUp",
      "https://cdn.glitch.global/41cfbc99-0cac-46f3-96da-fc7dae72a57b/Thumbs%20Up%20v3.png?v=1648879253025"
    );
    this.load.image(
      "mask",
      "https://cdn.glitch.global/41cfbc99-0cac-46f3-96da-fc7dae72a57b/SpinWheelMask.png?v=1648907069896"
    );
    this.load.atlas(
      "bucketIcon",
      "https://cdn.glitch.global/41cfbc99-0cac-46f3-96da-fc7dae72a57b/BucketIcon.png?v=1648760284948",
      "BucketIcon.json",
    )
    this.load.atlas(
      "confetti",
      "https://cdn.glitch.global/41cfbc99-0cac-46f3-96da-fc7dae72a57b/Confetti.png?v=1649195117925",
      "confetti.json",
    )
    this.load.image(
      "smile",
      "https://cdn.glitch.global/41cfbc99-0cac-46f3-96da-fc7dae72a57b/Smile%20v2.png?v=1649173530472",
    )
    
  }

  create() {
  
    frameNames = this.anims.generateFrameNames('bucketIcon', {
      start: 1,
      end: 12,
      zeroPad: 2,
      suffix: '.png'
    })
    inited = false;
    this.initialized = false;
    this.frameTime = 0;
    let self = this;
    let mainPlayerInfo = {};
    this.createdPlayers = [];
    if (!isMobile) {
      this.mainPlayer = new MainPlayer(mainPlayerInfo);
      window.sessionStorage.setItem("scores", [1,1,1,1,1,1]);
      
    } else {
      // -----------------READ DATA FROM SESSIONSTORAGE-----------------
      // array of cultures player chose others and specify their own answer
      let others = [];
      mainPlayerInfo.others = others;
      
      // Read the player culture info from sessionStorage by providing the culture name,
      // the value is a string containing the user input(string) and if he/she wants to show it to others(bool).
      // split the string and access the input by index 0 and access the bool by index 1.
      // TODO: add handling process for preferNotToSay and null value
      for (let i = 0; i < gameOptions.cultures.length; i++) {
        let culture = gameOptions.cultures[i];
        let cultureInfo = window.sessionStorage[culture].split(","); // the array has a string and a bool
        mainPlayerInfo[culture] = eval(cultureInfo[1]) ? cultureInfo[0] : "⊘";
        if (cultureInfo[2]) {
          others.push(culture);
        }
      }
      let scores = window.sessionStorage.getItem("scores").split(","); 
      
      
      // -----------------create the mainPlayer object and set up the physics-----------------
      
      // generate the custom texture
      this.genWheelTexture(scores, gameOptions.wheelRadius, "userWheel", true);
      let mainPlayerWheel = this.matter.add.sprite(
        400,
        1250,
        "userWheel",
      );
      mainPlayerWheel.setSensor(true);
      this.mainPlayer = new MainPlayer(mainPlayerInfo, scores);
      this.mainPlayer.gameObject = mainPlayerWheel;
      mainPlayerWheel.setCircle(gameOptions.wheelRadius);
      mainPlayerWheel.setStatic(false);
      mainPlayerWheel.setFixedRotation();
      mainPlayerWheel.setDepth(50);

      let rrec = this.add.rexRoundRectangle(
        0,
        0,
        gameOptions.playerTextWidth,
        gameOptions.playerTextHeight,
        32,
        gameOptions.colors[0],
        1
      );
      let text = this.add.text(
        -gameOptions.playerTextWidth / 2,
        -gameOptions.playerTextFontSize,
        gameOptions.curCulture + "\n" + mainPlayerInfo[gameOptions.curCulture],
        {
          fontFamily: gameOptions.playerTextFont,
          fontSize: gameOptions.playerTextFontSize,
          color: gameOptions.playerTextColor,
          align: "center",
        }
      );
      text.setPosition(-text.width / 2, - gameOptions.playerTextFontSize);
      rrec.width = text.width + 100;
      this.mainPlayer.rrec = rrec;
      this.mainPlayer.text = text;

      let containerPosX =
        this.mainPlayer.gameObject.x - gameOptions.playerTextWidth / 2;
      let containerPosY =
        this.mainPlayer.gameObject.y - gameOptions.playerTextHeight / 2;
      let textContainer = this.add.container(containerPosX, containerPosY, [
        rrec,
        text,
      ]);
      textContainer.setDepth(51);
      textContainer.setSize(10, 10);
      let textPContainer = this.matter.add.gameObject(textContainer, {
        isSensor: true,
      });
      this.mainPlayer.playerTextCon = textContainer;
      this.mainPlayer.playerTextPCon = textPContainer;
      let constraint = this.matter.add.constraint(
        mainPlayerWheel,
        textPContainer,
        gameOptions.playerTextDistance,
        1,
        { angularStiffness: 1 }
      );

      rrec = this.add.rexRoundRectangle(
        0,
        0,
        gameOptions.wheelRadius,
        gameOptions.wheelRadius - 50,
        16,
        0xffffff,
        0.75
      );
      text = this.add.text(
        -gameOptions.playerTextWidth / 2,
        -gameOptions.playerTextFontSize / 2,
        window.sessionStorage.getItem("name"),
        {
          fontFamily: gameOptions.playerTextFont,
          fontSize: gameOptions.playerTextFontSize,
          color: "#000000",
          fixedWidth: gameOptions.playerTextWidth,
          align: "center",
        }
      );
      
      let thumbUp = this.add.sprite(0, 0, "thumbUp");
      thumbUp.setScale(0.1).setAlpha(0).setDepth(200);
      thumbUp.canReveal = true;
      
      let smile = this.add.sprite(0, 0, "smile");
      smile.setScale(1).setAlpha(0);
      smile.canReveal = true;

      this.mainPlayer.nameRrec = rrec;
      this.mainPlayer.nameText = text;
      this.mainPlayer.thumbUp = thumbUp;
      this.mainPlayer.smile = smile;

      containerPosX =
        this.mainPlayer.gameObject.x - gameOptions.playerTextWidth / 2;
      containerPosY =
        this.mainPlayer.gameObject.y - gameOptions.playerTextHeight / 2;
      textContainer = this.add.container(containerPosX, containerPosY, [
        rrec,
        text,
        thumbUp,
        smile,
      ]);

      textContainer.setDepth(51);
      textContainer.setSize(10, 10);
      textPContainer = this.matter.add.gameObject(textContainer, {
        isSensor: true,
      });
      this.mainPlayer.nameTextCon = textContainer;
      this.mainPlayer.nameTextPCon = textPContainer;
      constraint = this.matter.add.constraint(
        mainPlayerWheel,
        textPContainer,
        0,
        1
      );

      // set camera that stays in the boundary and follow our playerWheel
      let camera = this.cameras.main;
      if (phase === 0) {
        this.cameras.main.setScroll(0);
        this.cameras.main.setBounds(0, 0, gameOptions.worldWidth, gameOptions.worldHeight);
        this.cameras.main.startFollow(this.mainPlayer.gameObject);
      }
      
    }

    // Networking, may be put into another file afterwards
    let socket = io.connect(settings.server);
    this.socket = socket;
    socket.phase = phase;

    socket.emit("init", {
      phase: phase,
      info: mainPlayerInfo,
      scores: window.sessionStorage.getItem("scores").split(","),
      uuid: window.sessionStorage.getItem("uuid"),
      roomNumber: window.sessionStorage.getItem("roomNumber"),
      lobbyNumber: window.sessionStorage.getItem("lobbyNumber"),
      curLevel: window.sessionStorage.getItem("curLevel"),
      clientType: clientType
    });
    socket.on("uuid", (data, positionIndex) => {
      self.getPos(positionIndex);
      window.sessionStorage.setItem("uuid", data);
      this.mainPlayer.uuid = data;
      console.log("uuid get");
      console.log(this.mainPlayer.uuid);
    });
    socket.on("roomNumber", (data) => {
      window.sessionStorage.setItem("roomNumber", data);
      this.mainPlayer.roomNumber = data;
      console.log("room number get");
      console.log(this.mainPlayer.roomNumber);
    });
    socket.on("playerData", function (data) {
      self.initi(data);
    });
    socket.on("playerJoined", function (data) {
      console.log("PlayerJoined: " + data.uuid);
      if (!self.createdPlayers.includes(data.uuid)) {
        self.addPlayer(data);
      }
      
    });
    socket.on("playerMoved", function (data) {
      self.movePlayer(data);
    });
    socket.on("playerLeft", function (data) {
      self.deactivatePlayer(data);
    });
    socket.on("startIns", function () {
      self.startIns();
    });
    socket.on("startPuzzle", function (puzzleOptions, roomNumber, curLevel, time) {
      self.startPuzzle(puzzleOptions, roomNumber, curLevel, time);
    });
    socket.on("startReport", function () {
      self.startReport();
    });
    socket.on("addPoint", (index, isCorrect) => {
      self.addPoint(index, isCorrect);
    });
    socket.on("subPoint", (index, isCorrect) => {
      self.subPoint(index, isCorrect);
    });
    socket.on("addWheel", (index) => {
      self.addWheel(index);
    });
    socket.on("subWheel", (index) => {
      self.subWheel(index);
    })
    socket.on("solved", () => {
      console.log("solved");
      self.onPuzzleSolved();
    });
    socket.on("notSolved", () => {
      console.log("notSolved");
      self.onPuzzleNotSolved();
    });
    socket.on("reconnect", (to) => {
      if (to === 0 || phase === 0) {
        window.location.href = "/game.html"
      } else {
        window.location.href = "/puzzle.html"
      }
    })
    socket.on("thumbUp", (uuid) => {
      console.log("ThumbUp received");
      console.log(uuid);
      console.log(this.players[uuid]);
      this.showOtherThumbUp(this.players[uuid]);
    }) 
    socket.on("timeUp", () => {
      window.location.href = "/game.html"
    })
    socket.on("timeUpdate", (time) => {
      this.timerText.text = time;
    })
    socket.on("roomStateUpdate", (i, j, isBegin, time) => {
      if (!isMobile) {
        if (isBegin) {
          this.timerText.text = time;
          this.timerText.setDepth(100);
          this.startTimer(time);
        }
        this.countText.text = `Puzzle Solved Team: ${i}/${j}`;
      }
    })

    this.createUI();
    if (phase === 1) {
      this.cameraMoving();
    }
  }
  
  getPos(positionIndex) {
    if (this.mainPlayer.gameObject === null) return;
    this.mainPlayer.gameObject.setPosition(generatePos(positionIndex)[0],
                                           generatePos(positionIndex)[1]);
  }

  update(time, delta) {
    if (isMobile) {
      let x = Phaser.Math.Clamp(this.joyStick.forceX, -100, 100);
      let y = Phaser.Math.Clamp(this.joyStick.forceY, -100, 100);
      this.mainPlayer.gameObject.setVelocity(
        x * gameOptions.speed,
        y * gameOptions.speed
      );
      if (inited) {
        this.frameTime += delta;
        if (this.frameTime > 40) {
          this.frameTime = 0;
          this.socket.emit("positionUpdate", {
            uuid: this.mainPlayer.uuid,
            x: this.mainPlayer.gameObject.x,
            y: this.mainPlayer.gameObject.y,
          });
        }
      }
    }
  }

  
  createUI() {
    // background
    this.bgImage = this.add.tileSprite(0, 0, window.innerWidth * 3, window.innerHeight * 3, 'BG');
    this.bgImage.setOrigin(0).setScrollFactor(1).setDepth(-100);
    //this.bgImage = this.add.image(0, 0, "BG").setOrigin(0).setScrollFactor(1);
    //this.bgImage.setDepth(-100);
    // if mobile device
    if (isMobile) {
      this.createMobileUI();
    }
    // if big screen
    else {
      this.createBigScreenUI();
    }
  }
  
  createMobileUI() {
      this.thumbUpButton = this.add.image(
        gameOptions.viewportWidth - 150,
        gameOptions.viewportHeight / 2,
        "thumbUp"
      );
      this.thumbUpButton.setScrollFactor(0).setDepth(100).setScale(0.5);
      this.thumbUpButton.setInteractive().on("pointerdown", (pointer) => {
        this.showThumbUp();
      });
      this.smileButton = this.add.image(
        gameOptions.viewportWidth - 150,
        gameOptions.viewportHeight / 2 + 200,
        "smile"
      );
      this.smileButton.setScrollFactor(0).setDepth(100).setScale(1);
      this.smileButton.setInteractive().on("pointerdown", (pointer) => {
        this.showSmile();
      });
      //select wheel
      this.selectWheel = this.add
        .image(
          gameOptions.viewportWidth / 2,
          gameOptions.viewportHeight,
          "selectWheel"
        )
        .setScrollFactor(0)
        .setDepth(100)
        .setScale(1.5);
      this.selectWheelMask = this.add
        .image(
          gameOptions.viewportWidth / 2,
          gameOptions.viewportHeight,
          "mask"
        )
        .setScrollFactor(0)
        .setDepth(101)
        .setScale(1.5);
      this.selectWheel.canSpin = true;
      var swipe = this.rexGestures.add.swipe(this.selectWheel, {
        // enable: true,

        // threshold: 10,
        // velocityThreshold: 1000,
        // direction: '8dir',
      });
      swipe.on('swipe', function(swipe, gameObject, lastPointer){
        if (swipe.left) {
          this.nextCulture(-1);
        }
        if (swipe.right) {
          this.nextCulture(1);
        }
        
      }, this);

      // direction control
      this.joyStick = this.plugins
        .get("rexvirtualjoystickplugin")
        .add(this, {
          x: gameOptions.joyStickRadius + gameOptions.joyStickPadding,
          y:
            gameOptions.viewportHeight -
            (gameOptions.joyStickRadius + gameOptions.joyStickPadding),
          radius: gameOptions.joyStickRadius,
          base: this.add.circle(0, 0, gameOptions.joyStickRadius, 0x888888),
          thumb: this.add
            .circle(0, 0, gameOptions.joyStickRadius / 2, 0xcccccc)
            .setScrollFactor(0),
          // dir: '8dir',   // 'up&down'|0|'left&right'|1|'4dir'|2|'8dir'|3
          // forceMin: 16,
          // enable: true
        })
        .on("update", this.moveMainPlayer, this);
      this.joyStick.base.setDepth(-200);
      this.joyStick.thumb.setDepth(-200);
      this.input.on(
        "pointerdown",
        function (pointer) {
          this.joyStick.base.x = pointer.x;
          this.joyStick.base.y = pointer.y;
          this.joyStick.thumb.x = pointer.x;
          this.joyStick.thumb.y = pointer.y;
        },
        this
      );
      
      // puzzle phase
      if (!isLobby) {
        let myStorage = window.sessionStorage;
        puzzleOptions.time = eval(myStorage.getItem("time"))
        this.timerText = this.add.text(
          gameOptions.viewportWidth / 2  - 100,
          200,
          puzzleOptions.time,
          {
            fontFamily: "Georgia",
            fontSize: 48,
            color: "#372c25",
            fixedWidth: 200,
            align: "center",
          })
        this.timerText.setScrollFactor(0);
        this.insText = this.add.text(
          gameOptions.viewportWidth / 2 - 500,
          50,
          "Move your wheel\nto fill the buckets",
          {
            fontFamily: "Georgia",
            fontSize: 48,
            color: "#372c25",
            fixedWidth: 1000,
            align: "center",
          }
        );
        this.insText.setScrollFactor(0);
        this.insText.setDepth(-200);
        this.buckets = [];
        // update the puzzle options from localStorage
        
        puzzleOptions.cultures = myStorage.getItem("puzzleCultures").split(",");
        puzzleOptions.values = myStorage.getItem("puzzleValues").split(",");
        puzzleOptions.points = myStorage.getItem("puzzlePoints").split(",");
        puzzleOptions.time = eval(myStorage.getItem("time"));
        // create the buckets that will read data from puzzleOptions
        for (let i = 0; i < puzzleOptions.cultures.length; i++) {
          this.createBucket(800 + 900 * (i%2), 
                            800 + Math.floor(i/2) * 900, 
                            i, 
                            puzzleOptions.cultures[i],);
        }
      }
  }
  
  createBigScreenUI() {
      this.socket.emit("admin");
      this.insText = this.add.text(
        2000,
        200,
        "Drag anywhere on your screen to move your wheel around\nRotate the spinner at the bottom to inspect different categories",
        {
          fontFamily: "Helvetica",
          fontSize: 120,
          lineSpacing: 50,
          fixedWidth: 3600,
          color: "#946854",
          align: "center",
        }
      );
      this.insText.setPosition(gameOptions.viewportWidth / 2  - this.insText.width / 2, 200);
      this.insText.setDepth(100);
    
      this.timerText = this.add.text(
        gameOptions.viewportWidth / 2 - 1000, 
        900,
        0, 
        {
          fontFamily: "Helvetica",
          fontSize: 200,
          fixedWidth: 2000,
          color: "#000000",
          align: "center",
        }
      )
    
      this.timerText.setDepth(100);
    
      this.QR = this.add.sprite(
        gameOptions.viewportWidth / 2, 
        gameOptions.viewportHeight / 2, 
        "QRCode"
      );
      this.QR.setScale(5);
      this.QR.setDepth(1000);
    
      // puzzle portal
      this.portal = this.add.sprite(
        gameOptions.viewportWidth / 2, 
        gameOptions.viewportHeight / 2 + 1000, 
        "portal");
      this.portal.setDepth(100);
      this.portal.setInteractive().on("pointerdown", (pointer) => {
        this.socket.emit("startPuzzle");
        this.insText.text = "Each bucket requires a specific number of players\nwith certain identities to stand on.\n Try to solve the puzzle by fulfilling all the buckets\nat once with your teammates.";
      });
    
      this.insButton = this.add.circle(
        gameOptions.viewportWidth / 2, 
        gameOptions.viewportHeight / 2 + 1300,
        150, 
        0x888888);
      this.insButtonText = this.add.text(
        gameOptions.viewportWidth / 2 - 100, 
        gameOptions.viewportHeight / 2 + 1252, 
        'Ins', 
        {
          fontFamily: "Helvetica",
          fontSize: 96,
          fixedWidth: 200,
          color: "#ffffff",
          align: "center",
        }
      )
      this.insButton.setInteractive().on("pointerdown", (pointer) => {
        this.socket.emit("startIns");
        this.insText.text = "Read the instructions carefully.";
      });
    
      this.pauseButton = this.add.circle(
        gameOptions.viewportWidth / 2, 
        gameOptions.viewportHeight / 2 + 1600,
        150, 
        0xffffff);
    
      this.pauseButton.setInteractive().on("pointerdown", (pointer) => {
          this.socket.emit("pauseTimer");
          if (this.timer1 !== null) {
            this.timer1.paused = !this.timer1.paused;
            this.timer2.paused = !this.timer2.paused
          }
      })
    
      this.countText = this.add.text(
        gameOptions.viewportWidth - 2000, 
        gameOptions.viewportHeight - 400, 
        'Players: ' + playersCount, 
        {
          fontFamily: "Helvetica",
          fontSize: 96,
          fixedWidth: 2000,
          color: "#000000",
          align: "center",
        }
      )
  }
  
  // data.id is the id of the current socket,
  // data.players is an array of Player objects defined in the server side, it contains the info of main player
  initi(data) {
    window.sessionStorage.setItem("lobbyNumber", data.lobbyNumber);
    this.mainPlayer.lobbyNumber = data.lobbyNumber;
    console.log(this.mainPlayer);
    console.log(data.uuid);
    this.mainPlayer.uuid = data.uuid;
    this.players = data.players;
    for (let uuid in this.players) {
      console.log(uuid);
      if (uuid !== this.mainPlayer.uuid) {
        if (!this.createdPlayers.includes(uuid)){
          this.createPlayerObject(this.players[uuid]);
          this.createdPlayers.push(uuid);
          playersCount += 1;
        }
      }
    }
    if (!isMobile) {
      this.countText.text = "Players: " + playersCount;
    }
    
    this.initialized = true;
    inited = true;
    console.log("initialized");
  }

  addPlayer(player) {
    this.players[player.uuid] = player;
    this.createPlayerObject(player);
    playersCount += 1;
    if (!isMobile) {
      this.countText.text = "Players: " + playersCount;
    }
    console.log(player);
  }

  movePlayer(data) {
    if (this.initialized) {
      this.players[data.uuid].gameObject.x = data.x;
      this.players[data.uuid].gameObject.y = data.y;
    }
  }

  // backup function that is not using now
  moveMainPlayer() {
    //this.mainPlayer.gameObject.setVelocity(this.joyStick.forceX * gameOptions.speed, this.joyStick.forceY * gameOptions.speed);
    //this.mainPlayer.gameObject.x += this.joyStick.forceX * gameOptions.speed;
    //this.mainPlayer.gameObject.y += this.joyStick.forceY * gameOptions.speed;
  }

  createPlayerObject(player) {
    console.log("createNewPlayer, uuid is " + player.uuid)
    this.genWheelTexture(player.scores, gameOptions.wheelRadius, player.uuid, false);
    let newPlayerWheel = this.matter.add.sprite(
      player.x,
      player.y,
      player.uuid
    );
    newPlayerWheel
      .setCircle(gameOptions.wheelRadius)
      .setStatic(true)
      .setSensor(true)
      .setFixedRotation();
    let rrec = this.add.rexRoundRectangle(
      0,
      0,
      gameOptions.playerTextWidth,
      gameOptions.playerTextHeight,
      32,
      gameOptions.colorMapping[gameOptions.cultures[gameOptions.curIndex]],
      1
    );

    let text = this.add.text(
      -gameOptions.playerTextWidth / 2,
      -gameOptions.playerTextFontSize,
      gameOptions.curCulture + "\n" + player.wheelInfo[gameOptions.curCulture],
      {
        fontFamily: gameOptions.playerTextFont,
        fontSize: gameOptions.playerTextFontSize,
        color: gameOptions.playerTextColor,
        align: "center",
      }
    );

    text.setPosition(-text.width / 2, - gameOptions.playerTextFontSize);
    rrec.width = text.width + 100;
    player.gameObject = newPlayerWheel;
    player.rrec = rrec;
    player.text = text;
    let thumbUp = this.matter.add.sprite(0, 0, "thumbUp");
    thumbUp.setSensor(true);
    let smile = this.matter.add.sprite(0, 0, "smile");
    smile.setSensor(true)
         .setStatic(true);
    let constraint = this.matter.add.constraint(
        newPlayerWheel,
        thumbUp,
        0,
        1
      );
    
    let constraint2 = this.matter.add.constraint(
        newPlayerWheel,
        smile,
        0,
        1
      );
    
    thumbUp.setScale(0.1).setAlpha(0);
    thumbUp.canReveal = true;
    smile.setScale(1).setAlpha(0);
    smile.canReveal = true;
    player.thumbUp = thumbUp;
    player.smile = smile;
    if (!isMobile) {
      rrec.setVisible(false);
      text.setVisible(false);
    }
    
    let containerPosX = player.gameObject.x - gameOptions.playerTextWidth / 2;
    let containerPosY = player.gameObject.y - gameOptions.playerTextHeight / 2;
    let textContainer = this.add.container(containerPosX, containerPosY, [
      rrec,
      text,
    ]);
    textContainer.setDepth(25);
    textContainer.setSize(10, 10);
    let textPContainer = this.matter.add.gameObject(textContainer, {
      isSensor: true,
    });
    player.playerTextCon = textContainer;
    player.playerTextPCon = textPContainer;
    this.matter.add.constraint(
      newPlayerWheel,
      textPContainer,
      gameOptions.playerTextDistance,
      1
    );
  }

  /*
    @brief create buckets for the puzzle
  */
  
  createBucket(x, y, index, culture) {
    let graphics = this.add.graphics();
    graphics.lineStyle(50, 0xF28881);
    graphics.strokeRoundedRect(x - 300, y - 300, 600, 600, 32);
    let cultureIndex = gameOptions.cultures.indexOf(culture);
    let bucket = this.matter.add.sprite(x, y, "bucket");
    let rrec = this.add.rexRoundRectangle(
      x,
      y,
      600,
      600,
      32,
      0xffffff,
      1
    );
    bucket.rrec = rrec;
    bucket.graphics = graphics;
    let poolText = this.add.text(
      x - 250,
      y - 96,
      puzzleOptions.cultures[index] + "\n" + puzzleOptions.values[index],
      {
        fontFamily: "Georgia",
        fontSize: 48,
        color: gameOptions.textColors[cultureIndex],
        fixedWidth: 500,
        align: "center",
      }
    );
    bucket.text = poolText;
    
    let iconGroupWidth = 100 * (puzzleOptions.points[index] - 1);
    let iconGroup = this.add.group({
      key: 'bucketIcon', 
      frame: frameNames[cultureIndex * 2].frame, 
      repeat: puzzleOptions.points[index] - 1, 
      setXY: { x: x - iconGroupWidth / 2, y: y + 96, stepX: 100 } 
    })
    iconGroup.scaleXY(1.5);
    bucket.iconGroup = iconGroup;
    bucket.wheels = 0;
    bucket
      .setBody("circle", { isStatic: true, isSensor: true, radius: 200 })
      .setOnCollide((collisionData) => {
        if (collisionData.bodyA.circleRadius === gameOptions.wheelRadius 
            || collisionData.bodyB.circleRadius === gameOptions.wheelRadius) {
          this.socket.emit("bucketIn", { index: index });
        }
      })
      .setOnCollideEnd((collisionData) => {

        if (collisionData.bodyA.circleRadius === gameOptions.wheelRadius
            || collisionData.bodyB.circleRadius === gameOptions.wheelRadius) {
          this.socket.emit("bucketOut", { index: index });
        }
      })
      .setDepth(-1);
    
    bucket.point = 0;
    bucket.iconLit = 0;
    buckets.push(bucket);
  }
  
  checkBucket(bucket) {
    console.log("wheel count is "+bucket.wheels);
    console.log("point is " + bucket.point);
    console.log("iconLit is " + bucket.iconLit)
    let x = bucket.x;
    let y = bucket.y;
    let iconGroup = bucket.iconGroup.getChildren();
    if (bucket.wheels !== iconGroup.length) {
        console.log("wheels number not even close");
        bucket.graphics.lineStyle(50, 0xF28881); // red
        bucket.graphics.strokeRoundedRect(x - 300, y - 300, 600, 600, 32);
        return null;
    }
    if (bucket.iconLit === iconGroup.length){
      if (bucket.point === iconGroup.length) {
        bucket.graphics.lineStyle(50, 0x9AF793); // green
        bucket.graphics.strokeRoundedRect(x - 300, y - 300, 600, 600, 32);
      } else {
        bucket.graphics.lineStyle(50, 0xF5B91F); // yellow
        bucket.graphics.strokeRoundedRect(x - 300, y - 300, 600, 600, 32);
        } 
    } else {
        bucket.graphics.lineStyle(50, 0xF28881); // red
        bucket.graphics.strokeRoundedRect(x - 300, y - 300, 600, 600, 32);
    }
  }
  
  cameraMoving() {
    if (camMoveTimes < buckets.length) {
        this.tweens.add({
          targets: [this.cameras.main],
          scrollX: buckets[camMoveTimes].x - gameOptions.viewportWidth/2,
          scrollY: buckets[camMoveTimes].y - gameOptions.viewportHeight/2,
          duration: 1000,
          ease: "Cubic.easeOut",
          callbackScope: this,
          onComplete: function (tween) {
            camMoveTimes += 1;
            this.cameraMoving();
          },
        });
    } else {
        this.tweens.add({
          targets: [this.cameras.main],
          scrollX: this.mainPlayer.gameObject.x - gameOptions.viewportWidth/2,
          scrollY: this.mainPlayer.gameObject.y - gameOptions.viewportHeight/2,
          duration: 1000,
          ease: "Cubic.easeOut",
          callbackScope: this,
          onComplete: function (tween) {
            this.cameras.main.setScroll(0);
            this.cameras.main.setBounds(0, 0, gameOptions.worldWidth, gameOptions.worldHeight);
            this.cameras.main.startFollow(this.mainPlayer.gameObject);
            this.insText.setDepth(100);
          },
        });
    }
  }
  
  addPoint(index, isCorrectId) {
    let culture = puzzleOptions.cultures[index];
    let cultureIndex = gameOptions.cultures.indexOf(culture);
    let bucket = buckets[index];
    
    let iconLit = bucket.iconLit;
    let iconGroup = bucket.iconGroup.getChildren();
    
    if (iconLit < iconGroup.length) {
      iconGroup[iconLit].setFrame(frameNames[cultureIndex * 2 + 1].frame);
    }
    bucket.iconLit += 1;
    if (isCorrectId) {
      bucket.point += 1;
    }
    this.checkBucket(bucket);

  }
  addWheel(index) {
    console.log("add Wheel");
    buckets[index].wheels += 1;
    this.checkBucket(buckets[index]);
  }
  subWheel(index) {
    console.log("sub Wheel");
    buckets[index].wheels -= 1;
    this.checkBucket(buckets[index]);
  } 
  subPoint(index, isCorrectId) {
    let culture = puzzleOptions.cultures[index];
    let cultureIndex = gameOptions.cultures.indexOf(culture);
    let bucket = buckets[index];
    let curPoint = bucket.point;
    let iconGroup = bucket.iconGroup.getChildren();
    let iconLit = bucket.iconLit;;
    
    if (iconLit - 1 < iconGroup.length) {
      iconGroup[iconLit - 1].setFrame(frameNames[cultureIndex * 2].frame)
    }
    bucket.iconLit -= 1;
    if (isCorrectId) {
      buckets[index].point -= 1;
    }
    console.log("subPoint");
    this.checkBucket(bucket);
  }

  deactivatePlayer(data) {
    console.log("deactivate");
    let index = this.createdPlayers.indexOf(data);
    this.createdPlayers.splice(index, 1);
    this.players[data].text.destroy();
    this.players[data].playerTextCon.destroy();
    this.players[data].playerTextPCon.destroy();
    this.players[data].thumbUp.destroy();
    this.players[data].smile.destroy();
    this.players[data].gameObject.destroy();
    playersCount -= 1;
    this.countText.text = "Players: " + playersCount;
    // still needs to delete the player and a lot
    delete this.players[data];
  }



  showThumbUp() {
    if (this.mainPlayer.thumbUp.canReveal) {
      this.socket.emit("thumbUp", this.mainPlayer.uuid);
      this.mainPlayer.thumbUp.canReveal = false;
      this.tweens.add({
        targets: this.mainPlayer.thumbUp,
        alpha: 1,
        duration: 200,
        ease: "Sine.easeInOut",
        callbackScope: this,
      });
      this.tweens.add({
        targets: this.mainPlayer.thumbUp,
        y: -100,
        scaleX: 0.5,
        scaleY: 0.5,
        duration: 300,
        ease: "Back.easeOut",
        //easeParams: [ 0.1, 0.8 ],
        callbackScope: this,
      });
      this.tweens.add({
        targets: this.mainPlayer.thumbUp,
        alpha: 0,
        delay: 1000,
        duration: 200,
        ease: "Sine.easeInOut",
        callbackScope: this,
        onComplete: function (tween) {
          this.mainPlayer.thumbUp.canReveal = true;
          this.mainPlayer.thumbUp.y = 0;
          this.mainPlayer.thumbUp.scaleX = 0.1;
          this.mainPlayer.thumbUp.scaleY = 0.1;
        },
      });
    }
  }
  
  showSmile() {
    if (this.mainPlayer.smile.canReveal) {
      this.socket.emit("smile", this.mainPlayer.uuid);
      this.mainPlayer.smile.canReveal = false;
      this.tweens.add({
        targets: this.mainPlayer.smile,
        alpha: 1 - this.mainPlayer.smile.alpha,
        duration: 1000,
        ease: "Cubic.easeOut",
        callbackScope: this,
        onComplete: function (tween) {
          this.mainPlayer.smile.canReveal = true;
        },
      });
    }
  }
  
  showOtherThumbUp(player) {
    //if (player.thumbUp.canReveal) {
      //player.thumbUp.canReveal = false;
      /*this.tweens.add({
        targets: player.thumbUp,
        alpha: 1 - player.thumbUp.alpha,
        duration: 1000,
        ease: "Cubic.easeOut",
        callbackScope: this,
        onComplete: function (tween) {
          player.thumbUp.canReveal = true;
        },
      });*/
      
      player.thumbUp.y = -100;
      player.thumbUp.scaleX = 0.1;
      player.thumbUp.scaleY = 0.1;
      player.thumbUp.alpha = 1;
      this.tweens.add({
        targets: player.thumbUp,
        alpha: 1,
        duration: 200,
        ease: "Sine.easeInOut",
        callbackScope: this,
      });
      this.tweens.add({
        targets: player.thumbUp,
        y: -100,
        scaleX: 0.5,
        scaleY: 0.5,
        duration: 300,
        ease: "Back.easeOut",
        //easeParams: [ 0.1, 0.8 ],
        callbackScope: this,
      });
      this.tweens.add({
        targets: player.thumbUp,
        alpha: 0,
        delay: 1000,
        duration: 200,
        ease: "Sine.easeInOut",
        callbackScope: this,
        onComplete: function (tween) {
          //player.thumbUp.canReveal = true;
          player.thumbUp.y = 0;
          player.thumbUp.scaleX = 0.1;
          player.thumbUp.scaleY = 0.1;
        },
      });
    //}
  }
  nextCulture(direction) {
    if (this.selectWheel.canSpin) {
      this.selectWheel.canSpin = false;
      let index = gameOptions.curIndex;
      if (direction === 1) {
        index = index === 0 ? gameOptions.cultures.length - 1 : index - 1;
      } else {
        index = index === gameOptions.cultures.length - 1 ? 0 : index + 1;
      }
      gameOptions.curIndex = index;
      gameOptions.curCulture = gameOptions.cultures[index];
      this.updateCultureText();
      const spinAngle = 360 / gameOptions.cultures.length;
      this.tweens.add({
        targets: [this.selectWheel],
        angle: this.selectWheel.angle + spinAngle * direction,
        duration: gameOptions.spinDuration,
        ease: "Cubic.easeOut",
        callbackScope: this,
        onComplete: function (tween) {
          this.selectWheel.canSpin = true;
        },
      });
    }
  }
  updateCultureText() {
    let culture = gameOptions.curCulture;
    let index = gameOptions.curIndex;
    for (let uuid in this.players) {
      console.log(uuid);
      if (uuid !== this.mainPlayer.uuid) {
        this.players[uuid].text.text =
          gameOptions.curCulture + "\n" + this.players[uuid].wheelInfo[culture];
          this.players[uuid].rrec.setFillStyle(gameOptions.colors[index], 1);
          this.players[uuid].text.setPosition(this.players[uuid].rrec.x - this.players[uuid].text.width / 2, this.players[uuid].rrec.y - gameOptions.playerTextFontSize);
          this.players[uuid].rrec.width = this.players[uuid].text.width + 100;
          
      } else {
        this.mainPlayer.text.text =
          gameOptions.curCulture +
          "\n" +
          this.mainPlayer.info[gameOptions.curCulture];
        this.mainPlayer.rrec.setFillStyle(gameOptions.colors[index], 1);
        this.mainPlayer.text.setPosition(this.mainPlayer.rrec.x - this.mainPlayer.text.width / 2, this.mainPlayer.rrec.y - gameOptions.playerTextFontSize);
        this.mainPlayer.rrec.width = this.mainPlayer.text.width + 100;
      }
    }
  }

  startPuzzle(puzzleOptions, roomNumber, curLevel, time) {
    let myStorage = window.sessionStorage;
    myStorage.puzzleCultures = puzzleOptions.cultures;
    myStorage.puzzleValues = puzzleOptions.values;
    myStorage.puzzlePoints = puzzleOptions.points;
    myStorage.expectedPlayerIds = puzzleOptions.expectedPlayerIds;
    myStorage.setItem("time", time);
    myStorage.setItem("roomNumber", roomNumber);
    myStorage.setItem("curLevel", curLevel);
    console.log("Puzzle room number is" + roomNumber);
    console.log('Current level is' + curLevel);
    if (isMobile) {
      window.location.href = "/puzzle.html";
    }
  }
  
  countMS(milliseconds) {
    return new Promise((resolve) => {
      this.timerId = setTimeout(() => {
        resolve("resolved")
      }, milliseconds)
    })
  }
  async startCountDown(msTime) {
    let time = Math.ceil(msTime / 1000);
    let extraMs = msTime % 1000;
    if (extraMs !== 0) {
      await this.countMS(extraMs);
      time -= 1;
      this.timerText.text = time;
    }
    while (time > 0) {
      await this.countMS(1000);
      time -= 1;
      this.timerText.text = time;
    }
  }
  
  startTimer(time) {
    this.timer1 = this.time.delayedCall(
      (time + 1) * 1000, 
      () => {
        if (!isMobile) {
          this.socket.emit("timeUp");
        }
        this.time.removeEvent(this.timer2);
      },
      [],
      this);
    this.timer2 = this.time.addEvent({
      delay: 1000,
      callback: () => {
        time -= 1;
        this.timerText.text = time;
        if (!isMobile) {
          this.socket.emit("timeUpdate", time);
        }
      },
      callbackScope: this,
      loop: true,
    })
  }
  
  startIns() {
    if (isMobile) {
      window.location.href = "/PuzzleIns1.html";
    }
  }
  
  startReport() {
    window.location.href = "/ResultIns.html";
  }

  onPuzzleSolved() {
    //this.selectWheel.setVisible(false);
    //this.selectWheelMask.setVisible(false);
    //this.forwardButton.setVisible(false);
    //this.backwardButton.setVisible(false);
    sovledIndeed = true;
    this.insText.text = "You solved the puzzle!";
    this.anims.create({
            key: 'confetti',
            frames: this.anims.generateFrameNames('confetti', {
                start: 0,
                end: 64,
                zeroPad: 5,
                prefix: 'Confetti+Text_',
                suffix: '.png'
            }),
            frameRate: 30,
            repeat: -1
        });
    this.confetti = this.add.sprite(gameOptions.viewportWidth / 2 - 300, gameOptions.viewportHeight / 2 - 300, "confetti");
    this.confetti.setDepth(200);
    this.confetti.play('confetti');
    this.confetti.stopAfterRepeat(1);
  }
  onPuzzleNotSolved() {
    if (!sovledIndeed) {
      this.insText.text = "Move your wheel\nto fill the buckets";
    }
  }
  
  drawPieSlice(graphics, x, y, radius, start, end, color) {
    graphics.fillStyle(color, 1)
    graphics.slice(x, y, radius, start, end, false);
    graphics.fill();
  }
  genWheelTexture(scores, radius, textureName, isMainPlayer) {
    let colors = isMainPlayer? gameOptions.colors: gameOptions.paleColors;
    let graphics = this.add.graphics();
    let scoreSum = 0;
    for (let i = 0; i < scores.length; i++) {
      scoreSum += eval(scores[i]);
    }
    let PI2 = Phaser.Math.PI2;
    let pieStart = -PI2 / 4;
    let pieRange = 0;
    let pieEnd = -PI2 / 4;
    for (let i = 0; i < scores.length; i++) {
      let centerX = radius;
      let centerY = radius;
      pieRange = eval(scores[i]) / scoreSum * PI2;
      if (i !== gameOptions.cultures.length - 1) {
        pieEnd = pieStart + pieRange;
      } else {
        pieEnd = -PI2 / 4;
      }
      this.drawPieSlice(graphics, centerX, centerY, radius, pieStart, pieEnd, colors[i]);
      pieStart = pieEnd;
    }
    graphics.generateTexture(textureName, radius * 2, radius * 2);
    graphics.destroy();
  }
}

let gameconfig = {
  type: Phaser.CANVAS,
  fps: {target: 40,  forceSetTimeOut: true},
  backgroundColor: 0x222222,
  scale: {
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH,
    parent: "gameContainer",
    width: gameOptions.viewportWidth,
    height: gameOptions.viewportHeight,
  },
  physics: {
    default: "matter",
    matter: {
      gravity: {
        y: 0.0,
      },
      debug: false,
      setBounds: {
        width: gameOptions.worldWidth,
        height: gameOptions.worldHeight,
        thickness: 200,
        top: true,
        bottom: true,
        left: true,
        right: true,
      },
    },
  },
  scene: Lobby,
};
game = new Phaser.Game(gameconfig);
window.focus();
