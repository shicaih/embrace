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

var game; 
var buckets = [];
var frameNames;
var inited = false;
let devicePixelRatio = window.devicePixelRatio;
devicePixelRatio = 1.5; // just for testing

let isMobile = clientType === 1;
let isLobby = phase === 0;

// all should be empty
var puzzleOptions = {
  cultures: ["music", "food", "hobby"],
  values: ["1", "2", "3"],
  points: [5, 5, 5],
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
  speed: 0.05,
  viewportWidth: isMobile ? window.innerWidth * devicePixelRatio : 4000,
  viewportHeight: isMobile ? window.innerHeight * devicePixelRatio : 4000,
  worldWidth: 4000,
  worldHeight: 4000,
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
  }

  create() {
  
    frameNames = this.anims.generateFrameNames('bucketIcon', {
      start: 0,
      end: 12,
      zeroPad: 2,
      suffix: '.png'
    })
    inited = false;
    this.initialized = false;
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
        gameOptions.viewportWidth / 2,
        gameOptions.viewportHeight / 2,
        "userWheel"
      );
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
      
      let thumbUp = this.add.sprite(0, -150, "thumbUp");
      thumbUp.setScale(0.5).setAlpha(0);
      thumbUp.canReveal = true;

      this.mainPlayer.nameRrec = rrec;
      this.mainPlayer.nameText = text;
      this.mainPlayer.thumbUp = thumbUp;

      containerPosX =
        this.mainPlayer.gameObject.x - gameOptions.playerTextWidth / 2;
      containerPosY =
        this.mainPlayer.gameObject.y - gameOptions.playerTextHeight / 2;
      textContainer = this.add.container(containerPosX, containerPosY, [
        rrec,
        text,
        thumbUp,
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
      camera.setBounds(0, 0, gameOptions.worldWidth, gameOptions.worldHeight);
      camera.startFollow(this.mainPlayer.gameObject);
    }

    // Networking, may be put into another file afterwards
    let socket = io.connect("http://embrace.etc.cmu.edu:443/");
    this.socket = socket;
    socket.phase = phase;

    socket.emit("init", {
      phase: phase,
      info: mainPlayerInfo,
      scores: window.sessionStorage.getItem("scores").split(","),
      uuid: window.sessionStorage.getItem("uuid"),
      roomNumber: window.sessionStorage.getItem("roomNumber"),
      lobbyNumber: window.sessionStorage.getItem("lobbyNumber"),
      clientType: clientType
    });
    socket.on("uuid", (data) => {
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
    socket.on("startPuzzle", function (puzzleOptions, roomNumber) {
      self.startPuzzle(puzzleOptions, roomNumber);
    });
    socket.on("addPoint", (index) => {
      self.addPoint(index);
    });
    socket.on("subPoint", (index) => {
      self.subPoint(index);
    });
    socket.on("solved", () => {
      console.log("solved");
      self.onPuzzleSolved();
    });
    socket.on("notSolved", () => {
      console.log("notSolved");
      self.onPuzzleNotSolved();
    });
    socket.on("reconnect", () => {
      if (phase === 0) {
        window.location.href = "/game.html"
      } else {
        window.location.href = "/puzzle.html"
      }
    })
    socket.on("thumbUp", (uuid) => {
      console.log("ThumbUp received");
      this.showOtherThumbUp(this.players[uuid]);
    }) 

    this.createUI();
  }

  update() {
    if (isMobile) {
      let x = Phaser.Math.Clamp(this.joyStick.forceX, -100, 100);
      let y = Phaser.Math.Clamp(this.joyStick.forceY, -100, 100);
      this.mainPlayer.gameObject.setVelocity(
        x * gameOptions.speed,
        y * gameOptions.speed
      );
      if (inited) {
        this.socket.emit("positionUpdate", {
        uuid: this.mainPlayer.uuid,
        x: this.mainPlayer.gameObject.x,
        y: this.mainPlayer.gameObject.y,
        });
      }

    }
  }

  createUI() {

    // background
    this.bgImage = this.add.image(0, 0, "BG").setOrigin(0).setScrollFactor(1);
    this.bgImage.setDepth(-100);

    if (isMobile) {
      this.thumbUpButton = this.add.image(
        gameOptions.viewportWidth - 150,
        gameOptions.viewportHeight / 2,
        "thumbUp"
      );
      this.thumbUpButton.setScrollFactor(0).setDepth(100).setScale(0.5);
      this.thumbUpButton.setInteractive().on("pointerdown", (pointer) => {
        this.showThumbUp();
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
      
      /*
      this.forwardButton = this.add
        .sprite(
          gameOptions.viewportWidth / 2 + 400,
          gameOptions.viewportHeight - 400,
          "arrowForward"
        )
        .setScrollFactor(0)
        .setDepth(100);
        
      this.backwardButton = this.add
        .sprite(
          gameOptions.viewportWidth / 2 - 400,
          gameOptions.viewportHeight - 400,
          "arrowBackward"
        )
        .setScrollFactor(0)
        .setDepth(100);
      this.forwardButton.setInteractive().on("pointerdown", (pointer) => {
        this.nextCulture(-1);
      });
      this.backwardButton.setInteractive().on("pointerdown", (pointer) => {
        this.nextCulture(1);
      });
      */

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
      this.joyStick.base.setDepth(-101);
      this.joyStick.thumb.setDepth(-101);
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
        
        this.insText = this.add.text(
          gameOptions.viewportWidth / 2 - 500,
          gameOptions.viewportHeight - 400,
          "Fill the buckets",
          {
            fontFamily: "Georgia",
            fontSize: 96,
            color: "#372c25",
            backgroundColor: "#f8f0dd",
            fixedWidth: 1000,
            align: "center",
          }
        );
        this.insText.setScrollFactor(0);
        this.insText.setDepth(-10);
        this.buckets = [];
        // update the puzzle options from localStorage
        let myStorage = window.sessionStorage;
        puzzleOptions.cultures = myStorage.getItem("puzzleCultures").split(",");
        puzzleOptions.values = myStorage.getItem("puzzleValues").split(",");
        puzzleOptions.points = myStorage.getItem("puzzlePoints").split(",");
        // create the buckets that will read data from puzzleOptions
        for (let i = 0; i < puzzleOptions.cultures.length; i++) {
          this.createBucket(800 + 800 * (i%2), 400 + Math.floor(i/2) * 650, i, puzzleOptions.cultures[i]);
        }
      }
    }
    // if big screen
    else {
      this.socket.emit("admin");
      let insText = this.add.text(
        2000,
        200,
        "Drag anywhere on your screen to move your wheel around\nRotate the spinner at the bottom to inspect different categories",
        {
          fontFamily: "Helvetica",
          fontSize: 120,
          lineSpacing: 100,
          fixedWidth: 3600,
          color: "#946854",
          align: "center",
        }
      );
      insText.setPosition(2000-insText.width/2, 200);
      this.insText = insText;
      // puzzle portal
      this.portal = this.add.sprite(2000, 3000, "portal");
      this.QR = this.add.sprite(2000, 2000, "QRCode");
      this.QR.setScale(5);
      this.portal.setDepth(100);
      this.portal.setInteractive().on("pointerdown", (pointer) => {
        this.socket.emit("startPuzzle");
        this.insText.text = "Each bucket requires a specific number of players\nwith certain identities to stand on.\n Try to solve the puzzle by fulfilling all the buckets\nat once with your teammates.";
        //window.location.href = "/puzzle.html";
      });
    }
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
          console.log("Actual uuid is: " + uuid);
          this.createPlayerObject(this.players[uuid]);
          this.createdPlayers.push(uuid);
        }
      }
    }
    this.initialized = true;
    inited = true;
    console.log("initialized");
  }

  addPlayer(player) {
    this.players[player.uuid] = player;
    this.createPlayerObject(player);
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
    this.genWheelTexture(player.scores, gameOptions.wheelRadius, player.uuid, false);
    let newPlayerWheel = this.matter.add.sprite(
      player.x,
      player.y,
      player.uuid
    );
    newPlayerWheel
      .setCircle(gameOptions.wheelRadius)
      .setStatic(true)
      .setFixedRotation();
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
    let thumbUp = this.matter.add.sprite(0, -150, "thumbUp");
    let constraint = this.matter.add.constraint(
        newPlayerWheel,
        thumbUp,
        0,
        1
      );
    thumbUp.setScale(0.5).setAlpha(0);
    thumbUp.canReveal = true;
    player.thumbUp = thumbUp;
    

    
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
    console.log(gameOptions.colorMapping[culture])
    bucket.rrec = rrec;
    bucket.graphics = graphics;
    let poolText = this.add.text(
      x - 250,
      y - 96,
      puzzleOptions.values[index],
      {
        fontFamily: "Georgia",
        fontSize: 96,
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
    
    bucket
      .setBody("circle", { isStatic: true, isSensor: true, radius: 200 })
      .setOnCollide((collisionData) => {
        console.log(collisionData.bodyA);
        if (collisionData.bodyA.circleRadius === gameOptions.wheelRadius) {
          this.socket.emit("bucketIn", { index: index });
        }
      })
      .setOnCollideEnd((collisionData) => {
        console.log(collisionData.bodyA);
        if (collisionData.bodyA.circleRadius === gameOptions.wheelRadius) {
          this.socket.emit("bucketOut", { index: index });
        }
      })
      .setDepth(-1);
    bucket.point = 0;
    buckets.push(bucket);
  }
  
  addPoint(index) {
    let culture = puzzleOptions.cultures[index];
    let cultureIndex = gameOptions.cultures.indexOf(culture);
    let bucket = buckets[index];
    let curPoint = bucket.point;
    console.log(frameNames);
    console.log(cultureIndex * 2);
    let iconGroup = bucket.iconGroup.getChildren();
    if (curPoint < iconGroup.length) {
      iconGroup[curPoint].setFrame(frameNames[cultureIndex * 2 + 1].frame);
      buckets[index].point += 1;
      console.log(bucket.point);
    }
    if (buckets[index].point === iconGroup.length) {
      buckets[index].graphics.lineStyle(50, 0x9AF793);
      let x = buckets[index].x;
      let y = buckets[index].y;
      buckets[index].graphics.strokeRoundedRect(x - 300, y - 300, 600, 600, 32);
    }
  }
  
  subPoint(index) {
    let culture = puzzleOptions.cultures[index];
    let cultureIndex = gameOptions.cultures.indexOf(culture);
    let bucket = buckets[index];
    let curPoint = bucket.point;
    let iconGroup = bucket.iconGroup.getChildren();
    iconGroup[curPoint - 1].setFrame(frameNames[cultureIndex * 2].frame)
    buckets[index].point -= 1;
    if (buckets[index].point !== iconGroup.length) {
      buckets[index].graphics.lineStyle(50, 0xF28881);
      let x = buckets[index].x;
      let y = buckets[index].y;
      buckets[index].graphics.strokeRoundedRect(x - 300, y - 300, 600, 600, 32);
    }
  }

  deactivatePlayer(data) {
    console.log("deactivate");
    let index = this.createdPlayers.indexOf(data);
    this.createdPlayers.splice(index, 1);
    this.players[data].text.destroy();
    this.players[data].playerTextCon.destroy();
    this.players[data].playerTextPCon.destroy();
    this.players[data].thumbUp.destroy();
    this.players[data].gameObject.destroy();

    // still needs to delete the player and a lot
    delete this.players[data];
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

  showThumbUp() {
    if (this.mainPlayer.thumbUp.canReveal) {
      this.socket.emit("thumbUp", this.mainPlayer.uuid);
      this.mainPlayer.thumbUp.canReveal = false;
      this.tweens.add({
        targets: this.mainPlayer.thumbUp,
        alpha: 1 - this.mainPlayer.thumbUp.alpha,
        duration: 1000,
        ease: "Cubic.easeOut",
        callbackScope: this,
        onComplete: function (tween) {
          this.mainPlayer.thumbUp.canReveal = true;
        },
      });
    }
  }
  
  showOtherThumbUp(player) {
    if (player.thumbUp.canReveal) {
      player.thumbUp.canReveal = false;
      this.tweens.add({
        targets: player.thumbUp,
        alpha: 1 - player.thumbUp.alpha,
        duration: 1000,
        ease: "Cubic.easeOut",
        callbackScope: this,
        onComplete: function (tween) {
          player.thumbUp.canReveal = true;
        },
      });
    }
  }

  updateCultureText() {
    let culture = gameOptions.curCulture;
    let index = gameOptions.curIndex;
    console.log(index);
    console.log(this.players);
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

  startPuzzle(puzzleOptions, roomNumber) {
    let myStorage = window.sessionStorage;
    myStorage.puzzleCultures = puzzleOptions.cultures;
    myStorage.puzzleValues = puzzleOptions.values;
    myStorage.puzzlePoints = puzzleOptions.points;
    myStorage.setItem("roomNumber", roomNumber);
    console.log(roomNumber);
    if (isMobile) {
      window.location.href = "/puzzle.html";
    }
    
  }

  onPuzzleSolved() {
    this.selectWheel.setVisible(false);
    this.selectWheelMask.setVisible(false);
    //this.forwardButton.setVisible(false);
    //this.backwardButton.setVisible(false);
    this.insText.text = "You solved the puzzle!";
  }
  onPuzzleNotSolved() {
    this.insText.text = "Fill the buckets";
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
  type: Phaser.AUTO,
  backgroundColor: 0x222222,
  fps: {target: 24},
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
