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

import { default as shuffle } from "./scripts/utility.js";
//import WebFontFile from './scripts/WebFontFile.js';
//import * as pluralize from './scripts/pluralize.js'
let settings;
fetch("./settings.json")
  .then((response) => {
    return response.json();
  })
  .then((data) => {
    settings = data;
  });

var game;
var buckets = [];
var camMoveTimes = 0;
var frameNames, iconFrameNames;
var inited = false;
var sovledIndeed = false;
var playersCount = 0;
var puzzlePlayerCount = 0;
let devicePixelRatio = window.innerWidth / window.screen.availWidth; //window.devicePixelRatio;
let worldSize = 8000;
let bigScreenWorldWidth, bigScreenWorldHeight;
let bigScreenRatio = 2;
let starPerPlayer = 15;
let starGoal;

console.log(window.devicePixelRatio);
console.log(window.innerWidth);
console.log(window.innerHeight);
console.log(window.screen.availWidth * window.devicePixelRatio);
console.log(window.screen.availHeight * window.devicePixelRatio);
// devicePixelRatio = 1; // just for testing

let isMobile = clientType === 1;
let isLobby = phase === 0;
if (!isMobile) {
  if (window.innerWidth > window.innerHeight) {
    bigScreenWorldHeight = worldSize;
    bigScreenWorldWidth = window.innerWidth / window.innerHeight * worldSize;
  } else {
    bigScreenWorldWidth = worldSize;
    bigScreenWorldHeight = window.innerHeight / window.innerWidth * worldSize;
  }
}

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
  textColors: [
    "#cc3f8d",
    "#d15947",
    "#c7873e",
    "#34a359",
    "#5482cc",
    "#7755b5",
  ],
  paleColors: [0xe1a3be, 0xe6b7a2, 0xebcf9a, 0xc0d0aa, 0xa7d7dc, 0xb6a6d5],
  puzzleWorldSizes: [4000, 4000, 4000],
  colorMapping: {
    music: 0xcc3f8d,
    food: 0xd15947,
    hobby: 0xc7873e,
    finances: 0x34a359,
    home: 0x5482cc,
    ethnicity: 0x7755b5,
  },
  iconPlaceHolder: "      ",
  spinDuration: 500, // milliseconds
  speed: 0.13,
  viewportWidth: isMobile ? window.innerWidth : bigScreenWorldWidth,
  viewportHeight: isMobile ? window.innerHeight : bigScreenWorldHeight,
  worldWidth: isMobile ? worldSize : bigScreenWorldWidth,
  worldHeight: isMobile ? worldSize : bigScreenWorldHeight,
  wheelRadius: 50 * devicePixelRatio,
  buttonRadius: 50,
  buttonPadding: 50,
  joyStickRadius: 100,
  joyStickPadding: 100,
  // Options for text display
  cultureTextFontSize: 18 * devicePixelRatio,
  playerTextDistance: (250 * devicePixelRatio) / 3,
  playerTextWidth: 300,
  playerTextHeight: 150,
  playerTextFont: "Nunito",
  playerTextFontSize: 24 * devicePixelRatio,
  playerTextColor: "#ffffff",
  playerTextBackgroundColor: "#f8f0dd",
  playerTextHeightCo: 1.5 * devicePixelRatio,
  identityBoxStrokeWidth: 1.5 * devicePixelRatio,
  assignmentTextWidth: 275 * devicePixelRatio,
  assignmentBoxWidth: 300 * devicePixelRatio,
  assignmentBoxY: 70 * devicePixelRatio,
  assignmentBoxPY: 16 * devicePixelRatio,
  assignmentBoxStrokeWidth: 3 * devicePixelRatio,
  assignmentBoxStrokeColor: 0xffffff,
  assignmentTextLineSpacing: 24,
  confettiY: 120 * devicePixelRatio,
  selectWheelOffset: 30 * devicePixelRatio,
};

let culturalAspectEmojiMap = {
  music: "🎧",
  food: "🍴",
  hobby: "⏲",
  finances: "💹",
  ethnicity: "🌎",
  home: "🏠",
};

let assignmentPrefixes = {
  "food": "Find a person \nwho likes \n",
  "music": "Find a person \nwho likes \n",
  "hobby": "Find a person \nwho likes \n",
  "finances": "Find a person \nwith identity \n",
  "ethnicity": "Find a person who's \n",
  "home": "Find a person \nwho's from \n",
} 

let levelIndex = eval(window.sessionStorage.getItem("curLevel"));
if (levelIndex != null) {
  gameOptions.worldWidth = gameOptions.puzzleWorldSizes[levelIndex];
  gameOptions.worldHeight = gameOptions.puzzleWorldSizes[levelIndex];
}

class MainPlayer {
  constructor(info, scores, star) {
    this.info = info;
    this.scores = scores;
    this._star = star;
    this.gameObject = null;
    this.text = null;
    this.uuid = null;
    this.starUI = null;
  }
  set star(val) {
    this._star = val;
    if (this.starUI) this.starUI.text = this._star;
  }

  get star() {
    return this._star;
  }
}

function generatePos(index, horSlice, verSlice, worldWidth, worldHeight) {
  let Pos = new Array(horSlice * verSlice);
  for (let i = 0; i < Pos.length; i++) {
    Pos[i] = new Array(2);
  }

  //let slice = 4;
  let l = worldWidth / horSlice;
  let h = worldHeight / verSlice;
  let count = 0;
  let margin = 200;

  for (let i = 0; i < verSlice; i++) {
    //h
    for (let j = 0; j < horSlice; j++) {
      //l
      Pos[count][0] = getRndInt(j * l + margin, (j + 1) * l - margin);
      Pos[count][1] = getRndInt(i * h + margin, (i + 1) * h - margin);
      count++;
    }
  }

  return Pos[index % (horSlice * verSlice)];
}

function getRndInt(min, max) {
  return Math.floor(Math.random() * (max - min)) + min;
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
    this.load.scenePlugin(
      "rexgesturesplugin",
      "https://raw.githubusercontent.com/rexrainbow/phaser3-rex-notes/master/dist/rexgesturesplugin.min.js",
      "rexGestures",
      "rexGestures"
    );

    // load font
    //this.load.addFile(new WebFontFile(this.load, 'Nunito'))

    // art asset
    this.load.image(
      "BG",
      "https://cdn.glitch.global/41cfbc99-0cac-46f3-96da-fc7dae72a57b/BG.png?v=1647550334928"
    );
    this.load.image(
        "bgWheel",
        "https://cdn.glitch.global/41cfbc99-0cac-46f3-96da-fc7dae72a57b/1080p%20X%201080p.png?v=1650493360164"
    )
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
      "./assets/qr-code (4)-bg.png"
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
      "BucketIcon.json"
    );
    this.load.atlas(
      "confetti",
      "https://cdn.glitch.global/41cfbc99-0cac-46f3-96da-fc7dae72a57b/Confetti_GJ.png?v=1650294735085",
      "/json/confetti_GJ.json"
    );
    this.load.atlas(
      "cultureIcon",
      "https://cdn.glitch.global/41cfbc99-0cac-46f3-96da-fc7dae72a57b/icon.png?v=1650236243979",
      "icon.json"
    );
    this.load.atlas(
        "wrong",
        "https://cdn.glitch.global/41cfbc99-0cac-46f3-96da-fc7dae72a57b/wrong.png?v=1650931629319",
        "wrong.json"
    )
    this.load.image(
      "smile",
      "https://cdn.glitch.global/41cfbc99-0cac-46f3-96da-fc7dae72a57b/Smile%20v2.png?v=1649173530472"
    );
    this.load.image(
      "timerIcon",
      "https://cdn.glitch.global/41cfbc99-0cac-46f3-96da-fc7dae72a57b/Timer-Icon.svg?v=1650216225499"
    );
    this.load.image(
      "starCounterIcon",
      "https://cdn.glitch.global/41cfbc99-0cac-46f3-96da-fc7dae72a57b/Decor%20-%20Star%20%2B%20LB.png?v=1650230332206"
    );
    this.load.image(
      "helpIcon",
      "https://cdn.glitch.global/41cfbc99-0cac-46f3-96da-fc7dae72a57b/help-icon.svg?v=1650231502260"
    );
    this.load.image(
      "ethnicityIcon",
      "https://cdn.glitch.global/41cfbc99-0cac-46f3-96da-fc7dae72a57b/Icon%20-%20Ethnicity.png?v=1650234677237"
    );
    this.load.image(
        "bgWheelBW",
        "https://cdn.glitch.global/41cfbc99-0cac-46f3-96da-fc7dae72a57b/1080p%20X%201080p.png?v=1650986608997"
    )

    this.load.svg('bigscreenLeft', 'https://cdn.glitch.global/41cfbc99-0cac-46f3-96da-fc7dae72a57b/bigLeft.svg?v=1650573790728');
    this.load.svg('bigscreenRight', 'https://cdn.glitch.global/41cfbc99-0cac-46f3-96da-fc7dae72a57b/bigRight.svg?v=1650573787709');
    this.load.svg('help1', "https://cdn.glitch.global/41cfbc99-0cac-46f3-96da-fc7dae72a57b/help1.svg?v=1650585517405");
    this.load.svg('help2', 'https://cdn.glitch.global/41cfbc99-0cac-46f3-96da-fc7dae72a57b/help2.svg?v=1650585523755');
    this.load.svg('help3', "https://cdn.glitch.global/41cfbc99-0cac-46f3-96da-fc7dae72a57b/help3.svg?v=1650585520813");
    this.input.setTopOnly(false);
  }

  create() {
    frameNames = this.anims.generateFrameNames("bucketIcon", {
      start: 1,
      end: 12,
      zeroPad: 2,
      suffix: ".png",
    });
    iconFrameNames = this.anims.generateFrameNames("cultureIcon", {
      start: 1,
      end: 6,
      zeroPad: 1,
      suffix: ".png",
    });
    inited = false;
    this.initialized = false;
    this.frameTime = 0;
    let self = this;
    let mainPlayerInfo = {};
    this.createdPlayers = [];
    if (!isMobile) {
      this.mainPlayer = new MainPlayer(mainPlayerInfo);
      window.sessionStorage.setItem("scores", [1, 1, 1, 1, 1, 1]);
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
      let mainPlayerWheel = this.add.image(0, 0, "userWheel");
      this.mainPlayer = new MainPlayer(mainPlayerInfo, scores);
      let rrec = this.add.rexRoundRectangle(
        0,
          -(gameOptions.wheelRadius + 25 * devicePixelRatio),
        gameOptions.playerTextWidth,
        gameOptions.cultureTextFontSize / 2 + (80 * devicePixelRatio) / 3,
        10,
        gameOptions.colors[0],
        1
      );
      
      rrec.setStrokeStyle(
        gameOptions.identityBoxStrokeWidth,
        gameOptions.assignmentBoxStrokeColor,
        1
      );
      let text = this.add.text(
        0,
          -(gameOptions.wheelRadius + 25 * devicePixelRatio),
        gameOptions.iconPlaceHolder + mainPlayerInfo[gameOptions.curCulture],
        {
          fontFamily: gameOptions.playerTextFont,
          fontSize: gameOptions.cultureTextFontSize,
          color: gameOptions.playerTextColor,
          align: "center",
        }
      );
      text.setOrigin(0.5, 0.5);
      let icon = this.add.image(
        -text.width / 2 + (30 * devicePixelRatio) / 3,
          -(gameOptions.wheelRadius + 25 * devicePixelRatio),
        "cultureIcon"
      );
      icon.setOrigin(0.5, 0.5);
      icon.setFrame(iconFrameNames[gameOptions.curIndex].frame);
      icon.setScale(devicePixelRatio / 3);
      rrec.width = text.width + 100;
      this.mainPlayer.rrec = rrec;
      this.mainPlayer.text = text;
      this.mainPlayer.icon = icon;

      /*
      let tagContainer = this.add.container(0, -(gameOptions.wheelRadius + 50 * devicePixelRatio), [
        rrec,
        text,
        icon,
      ]);
      tagContainer.setDepth(51);
      // tagContainer.setSize(10, 10);

       */

      let centerRrec = this.add.rexRoundRectangle(
        0,
        0,
        gameOptions.wheelRadius,
        gameOptions.wheelRadius - 50,
        16,
        0xffffff,
        0.75
      );
      let centerText = this.add.text(
        0,
        0,
        window.sessionStorage.getItem("name"),
        {
          fontFamily: gameOptions.playerTextFont,
          fontSize: gameOptions.cultureTextFontSize,
          color: "#000000",
          fixedWidth: gameOptions.playerTextWidth,
          align: "center",
        }
      );
      centerText.setOrigin(0.5, 0.5);
      let thumbUp = this.add.sprite(0, 0, "thumbUp");
      thumbUp.setScale(0.1).setAlpha(0).setDepth(200);
      thumbUp.canReveal = true;

      let smile = this.add.sprite(0, 0, "smile");
      smile.setScale(1).setAlpha(0);
      smile.canReveal = true;

      this.mainPlayer.nameRrec = centerRrec;
      this.mainPlayer.nameText = centerText;
      this.mainPlayer.thumbUp = thumbUp;
      this.mainPlayer.smile = smile;

      /*
      let centerContainer = this.add.container(0, 0, [
        rrec,
        text,
        thumbUp,
        smile,
      ]);
            centerContainer.setDepth(51);
      centerContainer.setSize(10, 10);

       */


      let mainPlayerContainer = this.add.container(0, 0, [
          mainPlayerWheel,
          rrec,
          text,
          icon,
          centerRrec,
          centerText,
          thumbUp,
          smile,
      ])
      let mainPlayerContainerPhysics = this.matter.add.gameObject(mainPlayerContainer, {
        isSensor: true,
      });

      this.mainPlayer.gameObject = mainPlayerContainerPhysics;
      mainPlayerContainerPhysics.setCircle(gameOptions.wheelRadius);
      mainPlayerContainerPhysics.setStatic(false);
      mainPlayerContainerPhysics.setFixedRotation();
      mainPlayerContainerPhysics.setDepth(50);


      // set camera that stays in the boundary and follow our playerWheel
      let camera = this.cameras.main;
      if (phase === 0) {
        this.cameras.main.setScroll(0);
        this.cameras.main.setBounds(
          0,
          0,
          gameOptions.worldWidth,
          gameOptions.worldHeight
        );
        this.cameras.main.startFollow(this.mainPlayer.gameObject);
      }
    }

    // Networking, may be put into another file afterwards
    let socket = io.connect(`${config.server.url.replace(/\/+$/, '')}:${config.server.port}`);

    this.socket = socket;
    socket.phase = phase;

    socket.emit("init", {
      phase: phase,
      info: mainPlayerInfo,
      star: window.sessionStorage.getItem("star"),
      scores: window.sessionStorage.getItem("scores").split(","),
      uuid: window.sessionStorage.getItem("uuid"),
      roomNumber: window.sessionStorage.getItem("roomNumber"),
      lobbyNumber: window.sessionStorage.getItem("lobbyNumber"),
      curLevel: window.sessionStorage.getItem("curLevel"),
      clientType: clientType,
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
    socket.on("startIns", function () {
      self.startIns();
    });
    socket.on(
      "startPuzzle",
      function (puzzleOptions, roomNumber, curLevel, time) {
        self.startPuzzle(puzzleOptions, roomNumber, curLevel, time);
      }
    );
    socket.on("startAssignment", (assignment, seekTime) => {
      console.log("startAssignment");
      self.startAssignment(assignment, seekTime);
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
    });
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
        window.location.href = "/game.html";
      } else {
        window.location.href = "/puzzle.html";
      }
    });
    socket.on("thumbUp", (thumbUpIdArr) => {
      console.log(thumbUpIdArr)
      thumbUpIdArr.forEach(uuid => {   
        console.log("ThumbUp received");
        console.log(uuid);
        console.log(this.players[uuid]);
        this.showOtherThumbUp(this.players[uuid]);
      })
    });
    socket.on("timeUp", () => {
      window.location.href = "/game.html";
    });
    socket.on("timeUpdate", (time) => {
      this.timerText.text = time;
    });
    socket.on("roomStateUpdate", (i, j, isBegin, time) => {
      if (!isMobile) {
        /*
        if (isBegin) {
          this.timerText.text = time;
          this.timerText.setDepth(100);
          this.startTimer(time);
        } 
        */

      }
    });
    socket.on("addStar", (totalStars) => {
      this.insText.text = "Stars: " + totalStars;
      let starDeg = totalStars / starGoal * 360;
      this.progressBar.slice(0, 0, this.bgWheel.width * 2.5, 0, Phaser.Math.DegToRad(starDeg), false);
    })
    socket.on("puzzlePlayerAdd", () => {
      puzzlePlayerCount += 1;
      this.puzzleCountText.text = "Players: " + puzzlePlayerCount;
    })
    socket.on("puzzlePlayerSub", () => {
      puzzlePlayerCount -= 1;
      this.puzzleCountText.text = "Players: " + puzzlePlayerCount;
    })
    this.createUI();
    this.findPeople = {};
    this.findPeople.nWheelTapped = 0;
    this.findPeople.targetFound = false;
    this.findPeople.state = "IDLE";
    if (phase === 1) {
      //this.cameraMoving();
      this.cameras.main.setScroll(0);
      this.cameras.main.setBounds(
        0,
        0,
        gameOptions.worldWidth,
        gameOptions.worldHeight
      );
      this.cameras.main.startFollow(this.mainPlayer.gameObject);
      // this.insText.setDepth(100);
    }
  }

  setPos(positionIndex, horSlice, verSlice, worldWidth, worldHeight) {
    if (this.mainPlayer.gameObject === null) return;
    this.mainPlayer.gameObject.setPosition(
      generatePos(
        positionIndex,
        horSlice,
        verSlice,
        worldWidth,
        worldHeight
      )[0],
      generatePos(positionIndex, horSlice, verSlice, worldWidth, worldHeight)[1]
    );
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
    //this.bgImage = this.add.tileSprite(0, 0, worldSize, worldSize, 'BG');
    //this.bgImage.setOrigin(0).setScrollFactor(1).setDepth(-100);
    this.bgWheel = this.add.image(gameOptions.worldWidth / 2, gameOptions.worldHeight / 2, "bgWheel");
    this.bgWheel.setOrigin(0.5, 0.5).setDepth(-99).setScale(5).setScrollFactor(1);


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
    this.bgImage = this.add.image(0, 0, "BG").setOrigin(0).setScrollFactor(1).setScale(2);
    this.bgImage.setDepth(-100);
    this.wrongText = this.add.text(gameOptions.viewportWidth * 0.5, gameOptions.viewportHeight * 0.75,
        "Wrong Wheel",
        {
          fontFamily: gameOptions.playerTextFont,
          fontSize: 36 * devicePixelRatio,
          color: gameOptions.playerTextColor,
          align: "center",
          wordWrap: { width: gameOptions.viewportWidth * 0.8 },
        })
    this.wrongText.setOrigin(0.5, 0.5);
    this.wrongText.setDepth(2000);
    this.wrongText.setScrollFactor(false);
    this.wrongText.setVisible(false);
    let self = this;
    this.bgImage
      .setInteractive()
      .on("pointerup", function (pointer, localX, localY, event) {
        //console.log(self)
        self.selectWheel.pointerdown = false;

        //event.stopPropagation();
      });
    var tap = this.rexGestures.add.tap(this.bgImage, {
      // enable: true,
      // bounds: undefined,
      // time: 250,
      tapInterval: 50,
      threshold: 100,
      // tapOffset: 10,
      // taps: undefined,
      // minTaps: undefined,
      // maxTaps: undefined,
    });
    tap.on(
      "tap",
      function (tap, bgImage, lastPointer) {
        console.log(
          `bg clicked: nWheelTapped ${self.findPeople.nWheelTapped}, target found ${self.findPeople.targetFound}`
        );
        if (self.findPeople.nWheelTapped > 0) {
          if (window.navigator && window.navigator.vibrate)
            window.navigator.vibrate(200);
          self.findPeople.nWheelTapped = 0;
          //window.navigator.vibrate(200)
          if (self.findPeople.targetFound) {
            self.findPeople.targetFound = false;
            if (this.findPeople.state != "SOLVING") {
              return;
            }
            // TODO: handle assignment solved emit assignment solved
            this.scoreStar();
            this.clearAssignment(true);
          }
          // wrong target
          else {
            console.log("wrong person");
            this.findPeople.state = "CD";
            this.failBlocker.setVisible(true);
            this.anims.create({
              key: "wrong",
              frames: this.anims.generateFrameNames("wrong", {
                start: 0,
                end: 60,
                zeroPad: 5,
                prefix: "Wrong_",
                suffix: ".png",
              }),
              timeScale: 1,
              frameRate: 120,
              repeat: -1,
            });
            this.wrongAnim = this.add.sprite(
                gameOptions.viewportWidth / 2,
                gameOptions.viewportHeight / 2,
                "wrong"
            );
            this.wrongAnim.setScrollFactor(0);
            this.wrongAnim.on("animationstop", () => {
              this.wrongAnim.destroy();
            });
            this.wrongText.setVisible(true);
            this.wrongAnim.setDepth(200).setScale(devicePixelRatio);
            this.wrongAnim.play("wrong");

            this.wrongAnim.stopAfterRepeat(0);
            this.tweens.add({
              targets: this.failBlocker,
              alpha: 0.5,
              duration: 300,
              yoyo: true,
              hold: 1000,
              callbackScope: this,
              onComplete: (tween) => {
                this.findPeople.state = "SOLVING";
                this.failBlocker.setVisible(false);
                this.wrongText.setVisible(false);
              },
            });
          }
        }
      },
      this
    );
    this.thumbUpButton = this.add.image(
      gameOptions.viewportWidth - (120 * devicePixelRatio) / 3,
      gameOptions.viewportHeight / 2,
      "thumbUp"
    );
    this.thumbUpButton
      .setScrollFactor(0)
      .setDepth(100)
      .setScale((0.5 * devicePixelRatio) / 3);
    this.thumbUpButton
      .setInteractive()
      .on("pointerdown", (pointer, localX, localY, event) => {
        this.showThumbUp();
        event.stopPropagation();
      });

    /*this.smileButton = this.add.image(
        gameOptions.viewportWidth - 120 * devicePixelRatio / 3,
        gameOptions.viewportHeight / 2 + 200 * devicePixelRatio / 3,
        "smile"
      );
     
      this.smileButton.setScrollFactor(0).setDepth(100).setScale(devicePixelRatio / 3);
      this.smileButton.setInteractive().on("pointerdown", (pointer, localX, localY, event) => {
        this.showSmile();
        event.stopPropagation();
      });*/
    //select wheel
    this.selectWheel = this.add
      .image(
        gameOptions.viewportWidth / 2,
        gameOptions.viewportHeight + gameOptions.selectWheelOffset,
        "selectWheel"
      )
      .setScrollFactor(0)
      .setDepth(100)
      .setScale((1.5 * devicePixelRatio) / 3);
    this.selectWheelMask = this.add
      .image(
        gameOptions.viewportWidth / 2,
        gameOptions.viewportHeight + gameOptions.selectWheelOffset,
        "mask"
      )
      .setScrollFactor(0)
      .setDepth(101)
      .setScale((1.5 * devicePixelRatio) / 3);
    this.selectWheel.pointerdown = false;
    console.log(`selcet wheel pointerdown ${this.selectWheel.pointerdown}`);
    this.selectWheel
      .setInteractive()
      .on("pointerdown", (pointer, localX, localY, event) => {
        this.selectWheel.pointerdown = true;
      });
    this.selectWheel.canSpin = true;
    var swipe = this.rexGestures.add.swipe(this.selectWheel, {
      // enable: true,
      // threshold: 10,
      // velocityThreshold: 1000,
      // direction: '8dir',
    });

    swipe.on(
      "swipe",
      function (swipe, gameObject, lastPointer) {
        console.log(lastPointer.event);
        if (swipe.left) {
          this.nextCulture(-1);
        }
        if (swipe.right) {
          this.nextCulture(1);
        }
      },
      this
    );


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
        console.log("pointerdown");
        if (this.selectWheel.pointerdown) return;
        this.joyStick.base.x = pointer.x;
        this.joyStick.base.y = pointer.y;
        this.joyStick.thumb.x = pointer.x;
        this.joyStick.thumb.y = pointer.y;
      },
      this
    );

    let helpIndex = 0;
    let helpTitle, helpText;
    if (isLobby) {
      helpTitle = ["Movement", "Rotation"];
      helpText = ["To move around the lobby, drag your finger on the screen.",
        "To view different attributes, rotate the wheel below.",]
    } else {
      helpTitle = ["Seeking"]
      helpText = ["When you find the wheel meet the requirement.\n" + "Tap it!"]
    }

    this.helpRrec = this.add.rexRoundRectangle(
      0,
      0,
      gameOptions.viewportWidth * 0.8,
      gameOptions.viewportHeight * 0.7,
      32 * devicePixelRatio,
      0x946854,
      0.85
    );
    this.helpTitle = this.add.text(0, this.helpRrec.height * (0.15-0.5),
        helpTitle[0],
        {
          fontFamily: gameOptions.playerTextFont,
          fontSize: 48 * devicePixelRatio,
          color: gameOptions.playerTextColor,
          align: "center",
          wordWrap: { width: this.helpRrec.width * 0.8 },
        })
    this.helpTitle.setOrigin(0.5, 0.5);
    this.helpText = this.add.text(0, this.helpRrec.height * (0.4-0.5),
        helpText[0],
        {
          fontFamily: gameOptions.playerTextFont,
          fontSize: gameOptions.playerTextFontSize,
          color: gameOptions.playerTextColor,
          align: "center",
          wordWrap: { width: this.helpRrec.width * 0.8 },
        });
    this.helpText.setOrigin(0.5, 0.5);
    this.help1 = this.add.image(0, this.helpRrec.height * (0.65 - 0.5), 'help1');
    this.help2 = this.add.image(0, this.helpRrec.height * (0.65 - 0.5), 'help2');
    this.help3 = this.add.image(0, this.helpRrec.height * (0.65 - 0.5), 'help3');
    this.help1.setScale(3).setVisible(false);
    this.help2.setScale(3).setVisible(false);
    this.help3.setScale(3).setVisible(false);
    this.helpImages = isLobby? [this.help1, this.help2]:[this.help3];
    this.helpImages[helpIndex].setVisible(true);

    this.helpButton = this.add.rexRoundRectangle (
        gameOptions.viewportWidth / 2,
        gameOptions.viewportHeight / 2 + this.helpRrec.height * (0.95 - 0.5),
        this.helpRrec.width,
        this.helpRrec.height * 0.1,
        {tl: 32 * devicePixelRatio, tr: 32 * devicePixelRatio, bl: 32 * devicePixelRatio, br: 32 * devicePixelRatio},
        0x372B24,
        1
    )
    this.helpButtonText = this.add.text(
        gameOptions.viewportWidth / 2,
        gameOptions.viewportHeight / 2 + this.helpRrec.height * (0.95 - 0.5),
        isLobby? "Continue":"Done",
        {
          fontFamily: gameOptions.playerTextFont,
          fontSize: gameOptions.playerTextFontSize,
          color: gameOptions.playerTextColor,
          align: "center",
          wordWrap: { width: this.helpRrec.width * 0.8 },
        }
    )
    this.helpButtonText.setOrigin(0.5, 0.5);
    this.helpButton.setDepth(2001);
    this.helpButtonText.setDepth(2002);




    let helpContainer = this.add.container(
      gameOptions.viewportWidth / 2,
      gameOptions.viewportHeight / 2,
      [this.helpRrec, this.helpText, this.helpTitle, this.helpText, this.help1, this.help2, this.help3]
    );
    helpContainer.setScrollFactor(false);
    this.help = helpContainer;
    this.help.isVisible = true;
    this.helpButton.isVisible = true;
    this.helpBUttonText.isVisible = true;
    this.help.setDepth(2000);
    this.helpButton.setScrollFactor(false);
    this.helpButtonText.setScrollFactor(false);
    this.helpButton.setInteractive().on("pointerdown", (pointer, localX, localY, event) => {
      helpIndex += 1;
      console.log("helpButtonPointerd");
      if(helpIndex == helpTitle.length) {
        this.helpTitle.text = helpTitle[0];
        this.helpText.text = helpText[0];
        this.helpImages[helpIndex - 1].setVisible(false);
        this.helpImages[0].setVisible(true);
        this.help.setVisible(false);
        this.help.isVisible = false;
        this.helpButton.setVisible(false);
        this.helpButton.isVisible = false;
        this.helpBUttonText.setVisible(false);
        this.helpButtonText.isVisible = false;
        helpIndex = 0;
      } else {
        this.helpTitle.text = helpTitle[helpIndex];
        this.helpText.text = helpText[helpIndex];
        this.helpImages[helpIndex - 1].setVisible(false);
        this.helpImages[helpIndex].setVisible(true);
        if (helpIndex == helpTitle.length - 1) {
          this.helpButtonText.text = "Done";
        }
      }
      event.stopPropagation();
    });

    this.helpIcon = this.add
        .image(
            gameOptions.viewportWidth - 10 * devicePixelRatio,
            30 * devicePixelRatio,
            "helpIcon"
        )
        .setOrigin(1, 0.5)
        .setScrollFactor(0)
        .setDepth(100)
        .setScale(devicePixelRatio);
    this.helpIcon
        .setInteractive()
        .on("pointerdown", (pointer, localX, localY, event) => {
          this.help.setVisible(!this.help.isVisible);
          this.help.isVisible = !this.help.isVisible;
          this.helpButton.setVisible(!this.helpButton.isVisible);
          this.helpButton.isVisible = !this.helpButton.isVisible;
          this.helpButtonText.setVisible(!this.helpButtonText.isVisible);
          this.helpButtonText.isVisible = !this.helpButtonText.isVisible;
          this.helpButtonText.text = isLobby? "Continue":"Done";
          // TODO: show help msg
          event.stopPropagation();
        });
    // puzzle phase
    if (!isLobby) {
      let myStorage = window.sessionStorage;
      puzzleOptions.time = eval(myStorage.getItem("time"));
      this.timerText = this.add.text(
        42 * devicePixelRatio,
        30 * devicePixelRatio,
        "",
        {
          fontFamily: gameOptions.playerTextFont,
          fontSize: 24 * devicePixelRatio,
          color: "#372B24",
          align: "left",
        }
      );
      this.timerText.setScrollFactor(0);
      this.timerText.setOrigin(0, 0.5).setDepth(2000);
      console.log(`viewport width: ${gameOptions.viewportWidth}`);
      this.timerIcon = this.add
        .image(10 * devicePixelRatio, 30 * devicePixelRatio, "timerIcon")
        .setOrigin(0, 0.5)
        .setScrollFactor(0)
        .setDepth(100)
        .setScale(1 * devicePixelRatio);

      /*
        
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
        
        */

      this.starText = this.make
        .text({
          x: gameOptions.viewportWidth / 2 + 12 * devicePixelRatio,
          y: 30 * devicePixelRatio,
          text: "0",
          style: {
            fontFamily: gameOptions.playerTextFont,
            fontSize: 24 * devicePixelRatio,
            color: "#372B24",
            align: "left",
          },
        })
        .setOrigin(0, 0.5)
        .setDepth(100);
      this.starText.setScrollFactor(0);
      this.starCounterIcon = this.add
        .image(
          gameOptions.viewportWidth / 2 - 20 * devicePixelRatio,
          30 * devicePixelRatio,
          "starCounterIcon"
        )
        .setOrigin(0, 0.5)
        .setScrollFactor(0)
        .setDepth(100)
        .setScale(0.1 * devicePixelRatio);
      this.mainPlayer.starUI = this.starText;



      this.failBlocker = this.add
        .rexRoundRectangle(
          0,
          0,
          gameOptions.viewportWidth,
          gameOptions.viewportHeight,
          0,
          gameOptions.colors[0],
          1
        )
        .setAlpha(0)
        .setOrigin(0)
        .setScrollFactor(0)
        .setDepth(300)
        .setVisible(false);
      this.failBlocker
        .setInteractive()
        .on("pointerdown", (pointer, localX, localY, event) => {
          event.stopPropagation();
        });

      this.buckets = [];
      // update the puzzle options from localStorage

      puzzleOptions.cultures = myStorage.getItem("puzzleCultures").split(",");
      puzzleOptions.values = myStorage.getItem("puzzleValues").split(",");
      puzzleOptions.points = myStorage.getItem("puzzlePoints").split(",");
      puzzleOptions.time = eval(myStorage.getItem("time"));
      // create the buckets that will read data from puzzleOptions
      /*
        for (let i = 0; i < puzzleOptions.cultures.length; i++) {
          this.createBucket(800 + 900 * (i%2), 
                            800 + Math.floor(i/2) * 900, 
                            i, 
                            puzzleOptions.cultures[i],);
        } */

      this.assignmentText = this.add
        .text(0, gameOptions.assignmentBoxPY, ``, {
          fontFamily: gameOptions.playerTextFont,
          fontSize: gameOptions.playerTextFontSize,
          color: gameOptions.playerTextColor,
          align: "center",
          lineSpacing: gameOptions.assignmentTextLineSpacing,
          wordWrap: { width: gameOptions.assignmentTextWidth },
        })
        .setOrigin(0.5, 0);

      this.assignmentText.setScrollFactor(0);
      this.assignmentText.setDepth(200);

      let rrec = this.add
        .rexRoundRectangle(
          0,
          0,
          gameOptions.assignmentBoxWidth,
          300,
          10 * devicePixelRatio,
          gameOptions.colorMapping[gameOptions.cultures[gameOptions.curIndex]],
          1
        )
        .setOrigin(0.5, 0);
      rrec.setStrokeStyle(
        gameOptions.assignmentBoxStrokeWidth,
        gameOptions.assignmentBoxStrokeColor,
        1
      );
      rrec.strokeColor = gameOptions.assignmentBoxStrokeColor;
      this.assignmentBox = this.add
        .container(-gameOptions.viewportWidth / 2, gameOptions.assignmentBoxY, [
          rrec,
          this.assignmentText,
        ])
        .setDepth(51)
        .setScrollFactor(0);
    }
  }

  createBigScreenUI() {
    this.bgWheel.setDepth(-101);
    let curPage = 0;
    let bigscreenText = [
        "small or large\n" +
        "\n" +
        "Continously evovling \n" +
        "way of life",
    ]
    let bigscreenTitle = [
        "Culture",
        "Cultural Identity",
        "Cultural Humility",
        "Embrace"
    ]
    this.bgImage = this.add.tileSprite(0, 0, bigScreenWorldWidth, bigScreenWorldHeight, 'BG');
    this.bgImage.setOrigin(0).setScrollFactor(1).setDepth(-100);
    this.socket.emit("admin");

    this.bigscreenLeft = this.add.image(0, gameOptions.worldHeight, 'bigscreenLeft');
    this.bigscreenLeft.setOrigin(0, 1).setScale(3 * bigScreenRatio);
    this.bigscreenRight = this.add.image(gameOptions.worldWidth, 0, "bigscreenRight");
    this.bigscreenRight.setOrigin(1, 0).setScale(3 * bigScreenRatio);
    this.insText = this.add.text(
      0,
      0,
      "Let's\ncompose\na circle!",
      {
        fontFamily: gameOptions.playerTextFont,
        fontSize: 250 * bigScreenRatio,
        fixedWidth: gameOptions.worldWidth - 2000,
        color: "#946854",
        align: "center",
      }
    );
    this.insText.setDepth(-101).setOrigin(0.5, 0.5);
    this.insText.setPosition(
        gameOptions.worldWidth / 2,
        gameOptions.worldHeight / 2)

    this.timerText = this.add
      .text(gameOptions.viewportWidth / 2 - 1000, 900, 0, {
        fontFamily: gameOptions.playerTextFont,
        fontSize: 200,
        fixedWidth: 2000,
        color: "#000000",
        align: "center",
      })
      .setDepth(-2000);

    this.QR = this.add.sprite(
      gameOptions.viewportWidth / 2,
      gameOptions.viewportHeight / 2,
      "QRCode"
    );
    this.QR.setScale(2.05);
    this.QR.setDepth(-101);
    this.tweens.add({
      targets: this.QR,
      scale: 1.9,
      duration: 5000,
      yoyo: true,
      callbackScope: this,
      loop: -1,
      ease: 'Power2'
    });
    this.tweens.add({
      targets: this.QR,
      rotation: 6.28,
      duration: 100000,
      callbackScope: this,
      loop: -1
    });


    this.countText = this.add.text(
        gameOptions.viewportWidth - 700 * bigScreenRatio  - 2000 * bigScreenRatio / 2,
        gameOptions.viewportHeight - 1100 * bigScreenRatio,
        "Players: " + playersCount,
        {
          fontFamily: gameOptions.playerTextFont,
          fontSize: 96 * bigScreenRatio,
          fixedWidth: 2000 * bigScreenRatio,
          color: "#000000",
          align: "center",
        }
    );
    this.countText.setDepth(-101);
    this.puzzleCountText = this.add.text(
        gameOptions.viewportWidth - 700 * bigScreenRatio  - 2000 * bigScreenRatio / 2,
        gameOptions.viewportHeight - 1100 * bigScreenRatio,
        "Player: " + puzzlePlayerCount,
        {
          fontFamily: gameOptions.playerTextFont,
          fontSize: 96 * bigScreenRatio,
          fixedWidth: 2000 * bigScreenRatio,
          color: "#000000",
          align: "center",
        }
    );
    this.puzzleCountText.setDepth(-101);
    // puzzle portal
    this.toggleQR = this.add.rexRoundRectangle(
        gameOptions.viewportWidth  - 700 * bigScreenRatio,
        gameOptions.viewportHeight - 800 * bigScreenRatio,
        600 * bigScreenRatio,
        150 * bigScreenRatio,
        50 * bigScreenRatio,
        0x946854,
        1,
    );
    this.toggleQR.setDepth(-101);
    this.toggleQR.setInteractive().on("pointerdown", (pointer) => {
      this.QR.setVisible(!this.QR.visible);
      this.toggleText.text = this.QR.visible? "Hide Code" : "Show Code"
      this.toggleQR.setFillStyle(0x4F2816);
    });
    this.toggleQR.on("pointerover", () => {
      this.toggleQR.setFillStyle(0xA48171);
    })
    this.toggleQR.on("pointerout", () => {
      this.toggleQR.setFillStyle(0x946854);
    })
    this.toggleQR.on("pointerup", () => {
      this.toggleQR.setFillStyle(0x946854);
    })
    this.toggleText = this.add.text(
        this.toggleQR.x - 1000 * bigScreenRatio / 2,
        this.toggleQR.y - 100 * bigScreenRatio / 2,
        "Hide Code",
        {
          fontFamily: gameOptions.playerTextFont,
          fontSize: 100 * bigScreenRatio,
          fixedWidth: 1000 * bigScreenRatio,
          color: "#ffffff",
          align: "center",
        })
    this.toggleText.setDepth(-101);

    this.bigscreenTitle = this.add.text(
        0,
        0,
        bigscreenTitle[curPage],
        {
          fontFamily: gameOptions.playerTextFont,
          fontSize: 450 * bigScreenRatio,
          color: "#000000",
          align: "left",
        }
    );

    this.bigscreenTitle.setDepth(-99).setOrigin(0, 0.5);
    this.bigscreenTitle.setPosition(
        gameOptions.worldWidth * 0.15,
        gameOptions.worldHeight * 0.15)

    this.bigscreenText = this.add.text(
        0,
        0,
        bigscreenText[curPage],
        {
          fontFamily: gameOptions.playerTextFont,
          fontSize: 250 * bigScreenRatio,
          wordWrap: {width: gameOptions.worldWidth * 0.7},
          color: "#000000",
          align: "left",
        }
    );

    this.bigscreenText.setDepth(-99).setOrigin(0, 0.5);
    this.bigscreenText.setPosition(
        gameOptions.worldWidth * 0.15,
        gameOptions.worldHeight * 0.53)


    // puzzle portal
    this.portal = this.add.rexRoundRectangle(
      gameOptions.viewportWidth  - 700 * bigScreenRatio,
      gameOptions.viewportHeight - 600 * bigScreenRatio,
      600 * bigScreenRatio,
      150 * bigScreenRatio,
      50 * bigScreenRatio,
      0x946854,
      1,
    );
    this.portal.setDepth(1000);
    curPage = bigscreenText.length;
    this.portal.setInteractive().on("pointerdown", (pointer) => {
      curPage += 1;
      this.portal.setFillStyle(0x4F2816);
      if (curPage < bigscreenText.length) {
        this.bigscreenTitle.text = bigscreenTitle[curPage];
        this.bigscreenText.text = bigscreenText[curPage]
        if (curPage == bigscreenText.length - 1) {
          this.portalText.text = "Go to the Lobby";
          this.portal.width = this.portalText.width + 50 * bigScreenRatio;
        }
      } else if (curPage <= bigscreenText.length + 2){
        if (curPage === bigscreenText.length + 1) {
          this.portalText.text = "Report";
          this.bgWheelBW = this.add.image(gameOptions.worldWidth / 2, gameOptions.worldHeight / 2, "bgWheelBW");
          this.bgWheelBW.setOrigin(0.5, 0.5).setDepth(-99).setScale(5).setScrollFactor(1);
          this.bgWheel.setDepth(-97);
          this.QR.setVisible(false);
          this.QR.isVisible = false;
          this.toggleText.text = "Show Code";
          this.insText.text = "Stars: 0";
          starGoal = playersCount * starPerPlayer;
          this.countText.setVisible(false);
          this.puzzleCountText.setDepth(2000);
          this.progressBar = this.add.graphics();
          this.bgWheel.mask = new Phaser.Display.Masks.GeometryMask(this, this.progressBar);
          this.progressBar.slice(0, 0, this.bgWheel.width * 2.5, 0, 0, false);
          this.progressBar.x = gameOptions.worldWidth / 2;
          this.progressBar.y = gameOptions.worldHeight / 2;
          this.bigscreenPuzzle = true;

        } else {
          this.portalText.text = "Reset";
          this.puzzleCountText.setVisible(false);
          this.countText.setVisible(true);

        }
        this.socket.emit("startPuzzle");
        if (this.timer1 !== null) {
          this.time.removeEvent(this.timer1);
          this.time.removeEvent(this.timer2);
        }
      } else {
        this.socket.emit("reset");
        window.location.reload();
      }

    });
    this.portal.on("pointerover", () => {
      this.portal.setFillStyle(0xA48171);
    })
    this.portal.on("pointerout", () => {
      this.portal.setFillStyle(0x946854);
    })
    this.portal.on("pointerup", () => {
      this.portal.setFillStyle(0x946854);
    })
    this.portalText = this.add.text(
        this.portal.x - 1000 * bigScreenRatio / 2,
        this.portal.y - 100 * bigScreenRatio / 2,
        "Next",
        {
          fontFamily: gameOptions.playerTextFont,
          fontSize: 100 * bigScreenRatio,
          fixedWidth: 1000 * bigScreenRatio,
          color: "#ffffff",
          align: "center",
        })
    this.portalText.setDepth(2001);

    this.portalText.text = "Start";
    this.portal.width = 600 * bigScreenRatio;
    this.bigscreenTitle.setVisible(false);
    this.bigscreenText.setVisible(false);
    this.QR.setDepth(2000);
    this.bgWheel.setDepth(-99);
    this.insText.setDepth(-99);
    this.countText.setDepth(2000);
    this.toggleQR.setDepth(2000);
    this.toggleText.setDepth(2000);


  }

  // data.id is the id of the current socket,
  // data.players is an array of Player objects defined in the server side, it contains the info of main player
  initi(data) {
    window.sessionStorage.setItem("lobbyNumber", data.lobbyNumber);
    this.mainPlayer.lobbyNumber = data.lobbyNumber;
    console.log(this.mainPlayer);
    console.log("Main Player uuid is:" + data.uuid);
    this.mainPlayer.uuid = data.uuid;
    this.players = data.players;
    this.mainPlayer.star = data.players[data.uuid].star;
    this.setPos(
      data.posIndex,
      4,
      4,
      gameOptions.worldWidth,
      gameOptions.worldHeight
    );
    for (let uuid in this.players) {
      console.log(uuid);
      if (uuid !== this.mainPlayer.uuid) {
        if (!this.createdPlayers.includes(uuid)) {
          this.createPlayerObject(this.players[uuid]);
          playersCount += 1;
          this.createdPlayers.push(uuid);
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
      for (let uuid in data) {
        if (uuid === this.mainPlayer.uuid) continue;
        if (isMobile) {
          this.players[uuid].gameObject.x = data[uuid].x;
          this.players[uuid].gameObject.y = data[uuid].y;
        } else {
          this.players[uuid].gameObject.x = data[uuid].x + (gameOptions.worldWidth - worldSize) / 2;
          this.players[uuid].gameObject.y = data[uuid].y + (gameOptions.worldHeight - worldSize) / 2;
        }
      }
    }
  };

  // backup function that is not using now
  moveMainPlayer() {
    //this.mainPlayer.gameObject.setVelocity(this.joyStick.forceX * gameOptions.speed, this.joyStick.forceY * gameOptions.speed);
    //this.mainPlayer.gameObject.x += this.joyStick.forceX * gameOptions.speed;
    //this.mainPlayer.gameObject.y += this.joyStick.forceY * gameOptions.speed;
  }

  createPlayerObject(player) {
    console.log("createNewPlayer, uuid is " + player.uuid);
    this.genWheelTexture(
      player.scores,
      gameOptions.wheelRadius,
      player.uuid,
      false
    );
    let newPlayerWheel = this.add.image(
      0,
      0,
      player.uuid // the name of the wheel texture
    );
    /*
    newPlayerWheel
      .setCircle(gameOptions.wheelRadius)
      .setStatic(true)
      .setSensor(true)
      .setFixedRotation();

     */
    var tap = this.rexGestures.add.tap(newPlayerWheel, {
      // enable: true,
      // bounds: undefined,
      // time: 250,
      tapInterval: 50,
      threshold: 100,
      // tapOffset: 10,
      // taps: undefined,
      // minTaps: undefined,
      // maxTaps: undefined,
    });
    tap.on(
      "tap",
      function (tap, newPlayerWheel, lastPointer) {
        console.log("tapped");
        if (this.findPeople.state != "SOLVING") return;
        this.findPeople.nWheelTapped += 1;
        if (
          this.targetIds &&
          this.targetIds.includes(newPlayerWheel.texture.key)
        ) {
          this.findPeople.targetFound = true;
          this.findPeople.tappedTarget = newPlayerWheel;
        }
      },
      this
    );
    let rrec = this.add.rexRoundRectangle(
      0,
      -(gameOptions.wheelRadius + 25 * devicePixelRatio),
      gameOptions.playerTextWidth,
      gameOptions.cultureTextFontSize / 2 + (80 * devicePixelRatio) / 3,
      10,
      gameOptions.colorMapping[gameOptions.cultures[gameOptions.curIndex]],
      1
    );
    rrec.setStrokeStyle(
      gameOptions.identityBoxStrokeWidth,
      gameOptions.assignmentBoxStrokeColor,
      1
    );

    let text = this.add.text(
      0,
      -(gameOptions.wheelRadius + 25 * devicePixelRatio),
      gameOptions.iconPlaceHolder + player.wheelInfo[gameOptions.curCulture],
      {
        fontFamily: gameOptions.playerTextFont,
        fontSize: gameOptions.cultureTextFontSize,
        color: gameOptions.playerTextColor,
        align: "center",
      }
    );
    text.setOrigin(0.5, 0.5);

    let icon = this.add.sprite(
      -text.width / 2 + (30 * devicePixelRatio) / 3,
      -(gameOptions.wheelRadius + 25 * devicePixelRatio),
      "cultureIcon"
    );
    icon.setFrame(iconFrameNames[gameOptions.curIndex].frame);
    icon.setScale(devicePixelRatio / 3);

    rrec.width = text.width + 100;

    player.rrec = rrec;
    player.text = text;
    player.icon = icon;
    let thumbUp = this.add.image(0, 0, "thumbUp");
    let smile = this.add.image(0, 0, "smile");

    thumbUp.setScale((0.1 * devicePixelRatio) / 3).setAlpha(0);
    thumbUp.canReveal = true;
    smile.setScale((1 * devicePixelRatio) / 3).setAlpha(0);
    smile.canReveal = true;
    player.thumbUp = thumbUp;
    player.smile = smile;
    if (!isMobile) {
      rrec.setVisible(false);
      text.setVisible(false);
      icon.setVisible(false);
    }

    let playerContainer = this.add.container(0, 0, [
        newPlayerWheel,
      rrec,
      text,
      icon,
        thumbUp,
        smile,

    ]);
    playerContainer.setDepth(25);
    playerContainer.setPosition(player.x, player.y);
    player.gameObject = playerContainer;

  }

  /*
    @brief create buckets for the puzzle
  */

  createBucket(x, y, index, culture) {
    let graphics = this.add.graphics();
    graphics.lineStyle(50, 0xf28881);
    graphics.strokeRoundedRect(x - 300, y - 300, 600, 600, 32);
    let cultureIndex = gameOptions.cultures.indexOf(culture);
    let bucket = this.matter.add.sprite(x, y, "bucket");
    let rrec = this.add.rexRoundRectangle(x, y, 600, 600, 32, 0xffffff, 1);
    bucket.rrec = rrec;
    bucket.graphics = graphics;
    let poolText = this.add.text(
      x - 250,
      y - 96,
      puzzleOptions.cultures[index] + "\n" + puzzleOptions.values[index],
      {
        fontFamily: gameOptions.playerTextFont,
        fontSize: 48,
        color: gameOptions.textColors[cultureIndex],
        fixedWidth: 500,
        align: "center",
      }
    );
    bucket.text = poolText;

    let iconGroupWidth = 100 * (puzzleOptions.points[index] - 1);
    let iconGroup = this.add.group({
      key: "bucketIcon",
      frame: frameNames[cultureIndex * 2].frame,
      repeat: puzzleOptions.points[index] - 1,
      setXY: { x: x - iconGroupWidth / 2, y: y + 96, stepX: 100 },
    });
    iconGroup.scaleXY(1.5);
    bucket.iconGroup = iconGroup;
    bucket.wheels = 0;
    bucket
      .setBody("circle", { isStatic: true, isSensor: true, radius: 200 })
      .setOnCollide((collisionData) => {
        if (
          collisionData.bodyA.circleRadius === gameOptions.wheelRadius ||
          collisionData.bodyB.circleRadius === gameOptions.wheelRadius
        ) {
          this.socket.emit("bucketIn", { index: index });
        }
      })
      .setOnCollideEnd((collisionData) => {
        if (
          collisionData.bodyA.circleRadius === gameOptions.wheelRadius ||
          collisionData.bodyB.circleRadius === gameOptions.wheelRadius
        ) {
          this.socket.emit("bucketOut", { index: index });
        }
      })
      .setDepth(-1);

    bucket.point = 0;
    bucket.iconLit = 0;
    buckets.push(bucket);
  }

  checkBucket(bucket) {
    console.log("wheel count is " + bucket.wheels);
    console.log("point is " + bucket.point);
    console.log("iconLit is " + bucket.iconLit);
    let x = bucket.x;
    let y = bucket.y;
    let iconGroup = bucket.iconGroup.getChildren();
    if (bucket.wheels !== iconGroup.length) {
      console.log("wheels number not even close");
      bucket.graphics.lineStyle(50, 0xf28881); // red
      bucket.graphics.strokeRoundedRect(x - 300, y - 300, 600, 600, 32);
      return null;
    }
    if (bucket.iconLit === iconGroup.length) {
      if (bucket.point === iconGroup.length) {
        bucket.graphics.lineStyle(50, 0x9af793); // green
        bucket.graphics.strokeRoundedRect(x - 300, y - 300, 600, 600, 32);
      } else {
        bucket.graphics.lineStyle(50, 0xf5b91f); // yellow
        bucket.graphics.strokeRoundedRect(x - 300, y - 300, 600, 600, 32);
      }
    } else {
      bucket.graphics.lineStyle(50, 0xf28881); // red
      bucket.graphics.strokeRoundedRect(x - 300, y - 300, 600, 600, 32);
    }
  }

  cameraMoving() {
    if (camMoveTimes < buckets.length) {
      this.tweens.add({
        targets: [this.cameras.main],
        scrollX: buckets[camMoveTimes].x - gameOptions.viewportWidth / 2,
        scrollY: buckets[camMoveTimes].y - gameOptions.viewportHeight / 2,
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
        scrollX: this.mainPlayer.gameObject.x - gameOptions.viewportWidth / 2,
        scrollY: this.mainPlayer.gameObject.y - gameOptions.viewportHeight / 2,
        duration: 1000,
        ease: "Cubic.easeOut",
        callbackScope: this,
        onComplete: function (tween) {
          this.cameras.main.setScroll(0);
          this.cameras.main.setBounds(
            0,
            0,
            gameOptions.worldWidth,
            gameOptions.worldHeight
          );
          this.cameras.main.startFollow(this.mainPlayer.gameObject);
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
    let iconLit = bucket.iconLit;

    if (iconLit - 1 < iconGroup.length) {
      iconGroup[iconLit - 1].setFrame(frameNames[cultureIndex * 2].frame);
    }
    bucket.iconLit -= 1;
    if (isCorrectId) {
      buckets[index].point -= 1;
    }
    console.log("subPoint");
    this.checkBucket(bucket);
  }

  deactivatePlayer(data) {
    console.log("deactivate player " + data);
    if (data == this.mainPlayer.uuid) {
      document.location.reload(true);
      return;
    }
    let index = this.createdPlayers.indexOf(data);
    this.createdPlayers.splice(index, 1);
    this.players[data].text.destroy();
    this.players[data].thumbUp.destroy();
    this.players[data].smile.destroy();
    this.players[data].gameObject.destroy();
    playersCount -= 1;
    if (!isMobile) {
      this.countText.text = "Players: " + playersCount;
    }
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

    if (isMobile) {
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
    } else {
      player.thumbUp.y = -100;
      player.thumbUp.scaleX = 0.5;
      player.thumbUp.scaleY = 0.5;
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
        scaleX: 2.5,
        scaleY: 2.5,
        duration: 800,
        ease: "Sine.easeOut",
        //easeParams: [ 0.1, 0.8 ],
        callbackScope: this,
      });
      this.tweens.add({
        targets: player.thumbUp,
        alpha: 0,
        delay: 800,
        duration: 500,
        ease: "Sine.easeInOut",
        callbackScope: this,
        onComplete: function (tween) {
          //player.thumbUp.canReveal = true;
          player.thumbUp.y = 0;
          player.thumbUp.scaleX = 0.1;
          player.thumbUp.scaleY = 0.1;
        },
      });
    }
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
          gameOptions.iconPlaceHolder + this.players[uuid].wheelInfo[culture];
        this.players[uuid].rrec.setFillStyle(gameOptions.colors[index], 1);
        /*
        this.players[uuid].text.setPosition(
          this.players[uuid].rrec.x - this.players[uuid].text.width / 2,
          this.players[uuid].text.y
        );

         */
        this.players[uuid].rrec.width = this.players[uuid].text.width + 100;
        this.players[uuid].icon.setFrame(
          iconFrameNames[gameOptions.curIndex].frame
        );
        this.players[uuid].icon.x =
          this.players[uuid].rrec.x -
          this.players[uuid].text.width / 2 +
          (30 * devicePixelRatio) / 3;
      } else {
        this.mainPlayer.text.text =
          gameOptions.iconPlaceHolder +
          this.mainPlayer.info[gameOptions.curCulture];
        this.mainPlayer.rrec.setFillStyle(gameOptions.colors[index], 1);
        this.mainPlayer.rrec.width = this.mainPlayer.text.width + 100;
        this.mainPlayer.icon.setFrame(
          iconFrameNames[gameOptions.curIndex].frame
        );
        this.mainPlayer.icon.x =
          this.mainPlayer.rrec.x -
          this.mainPlayer.text.width / 2 +
          (30 * devicePixelRatio) / 3;
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
    console.log("Current level is" + curLevel);
    if (isMobile) {
      window.location.href = "/puzzle.html";
    }
  }

  startAssignment(assignment, seekTime) {
    this.assignment = assignment;
    this.findPeople.seekTime = seekTime;
    this.targetIdentities = assignment.identities;
    this.targetIds = assignment.ids;
    //this.findPeople.state = "SOLVING";
    if (this.findPeople.state == "IDLE") {
      this.releaseAssignment();
    }
  }

  releaseAssignment() {
    let identitiesWithEmoji = [];
    this.assignment.identities.map((el, i) => {
      identitiesWithEmoji.push(
        `${culturalAspectEmojiMap[this.assignment.aspects[i]]} ${el}`
      );
    });
    /*for (let i = 0; i < assignment.identities.length; i++) {
      identitiesWithEmoji.push(culturalAspectEmojiMap[assignment.aspects[i]] + assignment.identities[i])
    }*/

    this.assignmentText.text = `${assignmentPrefixes[this.assignment.aspects[0]]}${identitiesWithEmoji.join(
      ", \n"
    )}`;
    this.assignmentBox.first.height =
      this.assignmentText.displayHeight + 2 * gameOptions.assignmentBoxPY;
    this.assignmentBox.first.fillColor =
      gameOptions.colorMapping[this.assignment.aspects[0]];
    console.log("target ids:");
    console.log(this.assignment.ids);

    this.assignmentBox.x = -gameOptions.viewportWidth;
    this.tweens.add({
      targets: this.assignmentBox,
      x: gameOptions.viewportWidth / 2,
      duration: 800,
      ease: "Sine.easeInOut",
      callbackScope: this,
      onComplete: function (tween) {
        this.findPeople.state = "SOLVING";
        this.startLocalTimer(this.findPeople.seekTime, () => {
          // time's up; fail
          this.clearAssignment(false);
          //this.findPeople.state = "IDLE";
        });
      },
    });
    let self = this;
  }

  clearAssignment(success) {
    this.socket.emit("seekFinished", success);
    this.findPeople.state = "CD";
    this.stopLocalTimer();
    this.tweens.add({
      targets: this.assignmentBox,
      x: (gameOptions.viewportWidth / 2) * 3,
      delay: 700,
      duration: 800,
      ease: "Sine.easeInOut",
      callbackScope: this,
      onCompleteDelay: 800,
      onComplete: function (tween) {
        this.releaseAssignment();
      },
    });

    this.failBlocker.setVisible(false);
    this.failBlocker.alpha = 0;
    this.tweens.getTweensOf(this.failBlocker).forEach((tween) => {
      tween.remove();
    });
    this.tweens.add({
      targets: this.failBlocker,
      alpha: 0.5,
      duration: 300,
      yoyo: true,
      hold: 1000,
      callbackScope: this,
      onComplete: (tween) => {
        this.findPeople.state = "SOLVING";
        this.failBlocker.setVisible(false);
      },
    });
  }

  scoreStar() {
    this.onPuzzleSolved();
    let star = this.add.sprite(0, 0, "starCounterIcon");
    star
      .setScale(0.05 * devicePixelRatio)
      .setAlpha(0)
      .setDepth(200)
      .setScrollFactor(0);
    star.setPosition(
      this.findPeople.tappedTarget.x - this.cameras.main.worldView.x,
      this.findPeople.tappedTarget.y - this.cameras.main.worldView.y
    );
    this.tweens.add({
      targets: star,
      alpha: 1,
      duration: 200,
      ease: "Sine.easeInOut",
      callbackScope: this,
    });
    this.tweens.add({
      targets: star,
      y: star.y - 50 * devicePixelRatio,
      scaleX: 0.25 * devicePixelRatio,
      scaleY: 0.25 * devicePixelRatio,
      duration: 300,
      ease: "Back.easeOut",
      //easeParams: [ 0.1, 0.8 ],
      callbackScope: this,
    });
    this.tweens.add({
      targets: star,
      y: 30 * devicePixelRatio,
      x: gameOptions.viewportWidth / 2,
      duration: 1000,
      delay: 800,
      ease: "Sine.easeInOut",
      //easeParams: [ 0.1, 0.8 ],
      callbackScope: this,
      onComplete: function (tween) {
        this.mainPlayer.star++;
      },
    });
    this.tweens.add({
      targets: star,
      alpha: 0,
      delay: 1500,
      duration: 500,
      ease: "Sine.easeOut",
      //easeParams: [ 0.1, 0.8 ],
      callbackScope: this,
      onComplete: function (tween) {
        star.destroy();
      },
    });
    this.tweens.add({
      targets: star,
      scaleX: 0.15 * devicePixelRatio,
      scaleY: 0.15 * devicePixelRatio,
      delay: 1300,
      duration: 500,
      ease: "Sine.easeOut",
      //easeParams: [ 0.1, 0.8 ],
      callbackScope: this,
      onComplete: function (tween) {},
    });
    this.tweens.add({
      targets: this.starText,
      y: this.starText.y - 10 * devicePixelRatio,
      delay: 1600,
      duration: 250,
      ease: "Sine.easeInOut",
      yoyo: true,
      //easeParams: [ 0.1, 0.8 ],
      callbackScope: this,
    });
    this.tweens.add({
      targets: this.starText,
      scaleX: this.starText.scaleX * 1.5,
      scaleY: this.starText.scaleY * 1.5,
      delay: 1600,
      duration: 250,
      ease: "Sine.easeInOut",
      yoyo: true,
      //easeParams: [ 0.1, 0.8 ],
      callbackScope: this,
    });
  }

  countMS(milliseconds) {
    return new Promise((resolve) => {
      this.timerId = setTimeout(() => {
        resolve("resolved");
      }, milliseconds);
    });
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
      this
    );
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
    });
  }

  startLocalTimer(time, callback) {
    console.log(`start timer ${time}`);
    this.timer1 = this.time.delayedCall(time * 1000, callback, [], this);
    this.timerText.text = time;
    this.timer2 = this.time.addEvent({
      delay: 1000,
      callback: () => {
        time -= 1;
        this.timerText.text = time;
      },
      callbackScope: this,
      loop: true,
    });
  }

  stopLocalTimer() {
    this.timerText.text = "0";
    if (this.timer1) {
      this.time.removeEvent(this.timer1);
      this.time.removeEvent(this.timer2);
    }
  }

  startIns() {
    if (isMobile) {
      window.location.href = "/PuzzleIns1.html";
    }
  }

  startReport() {
    window.location.href = "/report.html";
  }

  onPuzzleSolved() {
    //this.selectWheel.setVisible(false);
    //this.selectWheelMask.setVisible(false);
    //this.forwardButton.setVisible(false);
    //this.backwardButton.setVisible(false);
    sovledIndeed = true;
    // this.insText.text = "You solved the puzzle!";
    this.anims.create({
      key: "confetti",
      frames: this.anims.generateFrameNames("confetti", {
        start: 0,
        end: 64,
        zeroPad: 5,
        prefix: "GJ_",
        suffix: ".png",
      }),
      timeScale: 1,
      frameRate: 120,
      repeat: -1,
    });
    this.confetti = this.add.sprite(
      gameOptions.viewportWidth / 2,
      gameOptions.confettiY,
      "confetti"
    );
    this.confetti.setScrollFactor(0);
    //this.confetti.anims.setTimeScale(2);
    this.confetti.on("animationstop", () => {
      //this.confetti.setDepth(-101);
      this.confetti.destroy();
    });
    this.confetti.setDepth(200);
    this.confetti.play("confetti");
    this.confetti.stopAfterRepeat(0);
  }

  onPuzzleNotSolved() {
    if (!sovledIndeed) {
      // this.insText.text = "Move your wheel\nto fill the buckets";
    }
  }

  drawPieSlice(graphics, x, y, radius, start, end, color) {
    graphics.fillStyle(color, 1);
    graphics.slice(x, y, radius, start, end, false);
    graphics.fill();
  }

  genWheelTexture(scores, radius, textureName, isMainPlayer) {
    let colors = isMainPlayer ? gameOptions.colors : gameOptions.paleColors;
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
      pieRange = (eval(scores[i]) / scoreSum) * PI2;
      if (i !== gameOptions.cultures.length - 1) {
        pieEnd = pieStart + pieRange;
      } else {
        pieEnd = -PI2 / 4;
      }
      this.drawPieSlice(
        graphics,
        centerX,
        centerY,
        radius,
        pieStart,
        pieEnd,
        colors[i]
      );
      pieStart = pieEnd;
    }
    graphics.generateTexture(textureName, radius * 2, radius * 2);
    graphics.destroy();
  }
}

let gameconfig = {
  type: isMobile? Phaser.CANVAS : Phaser.CANVAS,
  fps: { target: 40, forceSetTimeOut: true },
  backgroundColor: 0x222222,
  width: gameOptions.viewportWidth,
  height: gameOptions.viewportHeight,
  scale: {
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH,
    parent: "gameContainer",
    //width: 375*2,
    //height: 667*2,
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
