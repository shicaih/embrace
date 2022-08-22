let settings;
fetch("./json/settings.json")
  .then((response) => {
    console.log("Fetch test");
    return response.json();
  })
  .then((data) => {
    settings = data;
  });
const DPR = window.devicePixelRatio; //window.devicePixelRatio;
const WORLD_SIZE = 12000;
const WORLD_SIZE_Height = WORLD_SIZE * (1080/1920) // 939/1680 is the ratio of my computer
const STAR_PER_PLAYER = 10;

var iconFrameNames;
var inited = false;
var playersCount = 0;
var puzzlePlayerCount = 0;
var stars;
let bigScreenWorldWidth, bigScreenWorldHeight, bigScreenRatio;
let starGoal;
let isMobile = clientType === 1;
let isBigScreen = clientType === 0;
let isLobby = phase === 0;

if (isBigScreen) {
  bigScreenWorldWidth = innerWidth * DPR;
  bigScreenWorldHeight = innerHeight * DPR;
  bigScreenRatio = bigScreenWorldWidth / WORLD_SIZE;
}

const gameOptions = {
  curCulture: "music",
  curIndex: 0,
  cultures: ["music", "food", "hobby", "finances", "home", "ethnicity"],
  colors: [0xcc3f8d, 0xd15947, 0xc7873e, 0x34a359, 0x5482cc, 0x7755b5],
  paleColors: [0xe1a3be, 0xe6b7a2, 0xebcf9a, 0xc0d0aa, 0xa7d7dc, 0xb6a6d5],
  textColors: [
    "#cc3f8d",
    "#d15947",
    "#c7873e",
    "#34a359",
    "#5482cc",
    "#7755b5",
  ],
  nLevel: 1,
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
  viewportWidth: isMobile ? innerWidth * DPR : bigScreenWorldWidth,
  viewportHeight: isMobile ? innerHeight * DPR : bigScreenWorldHeight,
  worldWidth: isMobile ? WORLD_SIZE : bigScreenWorldWidth,
  worldHeight: isMobile ? WORLD_SIZE_Height : bigScreenWorldHeight,
  wheelRadius: 50 * DPR,
  buttonRadius: 50,
  buttonPadding: 50,
  joyStickRadius: 100,
  joyStickPadding: 100,
  // Options for text display
  cultureTextFontSize: 18 * DPR,
  playerTextDistance: (250 * DPR) / 3,
  playerTextWidth: 300,
  playerTextHeight: 150,
  playerTextFont: "Nunito",
  playerTextFontSize: 24 * DPR,
  playerTextColor: "#ffffff",
  playerTextBackgroundColor: "#f8f0dd",
  playerTextHeightCo: 1.5 * DPR,
  identityBoxStrokeWidth: 1.5 * DPR,
  assignmentTextWidth: 275 * DPR,
  assignmentBoxWidth: 300 * DPR,
  assignmentBoxY: 70 * DPR,
  assignmentBoxPY: 16 * DPR,
  assignmentBoxStrokeWidth: 3 * DPR,
  assignmentBoxStrokeColor: 0xffffff,
  assignmentTextLineSpacing: 24,
  helpRadius: 16 * DPR,
  confettiY: 120 * DPR,
  selectWheelOffset: 30 * DPR,
};

const bigScreenUISettings = {
  width: bigScreenWorldWidth,
  height: bigScreenWorldHeight,
  titleText: {
    fontFamily: "Nunito",
    fontSize: 72 * DPR,
    color: "#946854"
  },
  regularText: {
    fontFamily: "Nunito",
    fontSize: 36 * DPR,
    color: "#946854"
  },
  buttonText: {
    fontFamily: "Nunito",
    fontSize: 36 * DPR,
    color: "#ffffff"
  },
  buttonHeight: 70 * DPR,
  buttonWidth: 250 * DPR,
  buttonRadius: 15 * DPR,
  buttonOutlineDistance: 30 * DPR,
  canvasVerticalMargin: 56 * DPR,
  canvasHorizontalMargin: 70 * DPR,
  buttonColor: 0x946854,
  buttonHoverColor: 0xA48171,
};

const mobileUISettings = {

};

const UITextType = {
  title: "titleText",
  regular: "regularText",
  button: "buttonText",
}
var puzzleOptions = {
  cultures: [],
  values: [],
  points: [],
  expectedPlayerIds: [], // 2d array
};

const culturalAspectEmojiMap = {
  music: "🎧",
  food: "🍴",
  hobby: "⏲",
  finances: "💹",
  ethnicity: "🌎",
  home: "🏠",
};

const assignmentPrefixes = {
  "food": "Find a person \nwho likes \n",
  "music": "Find a person \nwho likes \n",
  "hobby": "Find a person \nwho likes \n",
  "finances": "Find a person \nwith identity \n",
  "ethnicity": "Find a person who's \n",
  "home": "Find a person \nwho's from \n",
} 

let bigscreenLevelCounter;
let levelIndex = eval(window.sessionStorage.getItem("curLevel"));
if (phase == 1 && levelIndex != null) { // phase is only valid for mobile devices
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
    let progressBar = this.add.graphics();
    let progressBox = this.add.graphics();
    progressBox.fillStyle(0x222222, 0.8);
    progressBox.fillRect(240, 270, 320, 50);

    this.load.on("progress", (value) => {
      console.log(value);
      progressBar.clear();
      progressBar.fillStyle(0xffffff, 1);
      progressBar.fillRect(250, 280, 300 * value, 30);
    })
    this.load.on("fileprogress", (file) => {
      console.log(file.src);
    })
    this.load.on("complete", () => {
      console.log("Loading Complete");
      progressBar.destroy();
      progressBox.destroy();
    })

    // plugins
    this.load.plugin(
      "rexvirtualjoystickplugin", 
      "./plugins/rexvirtualjoystickplugin.min.js", true);
    this.load.plugin(
      "rexroundrectangleplugin", 
      "./plugins/rexroundrectangleplugin.min.js", true);
    this.load.scenePlugin(
      "rexgesturesplugin",
      "./plugins/rexgesturesplugin.min.js",
      "rexGestures",
      "rexGestures"
    );
    // font
    this.load.addFile(new WebFontFile(this.load, 'Nunito'));
    // art asset
    this.load.atlas(
      "anim",
      "./assets/anim.png",
      "./json/anim2.json"
    );
    this.load.image(
      "arrowBackward",
      "./assets/arrowBackward.png"
    );
    this.load.image(
      "arrowForward",
      "./assets/arrowForward.png"
    );
    this.load.image(
      "BG",
      "./assets/BG.png"
    );
    this.load.image(
      "seamlessBG",
      "./assets/seamlessBG_1000x1000.png"
    )
    this.load.image(
      "bgWheel",
      "./assets/bgWheel.png"
    )
    this.load.image(
      "bgWheelBW",
      "./assets/bgWheelBW.png"
    )
    this.load.svg(
      "bigscreenLeft", 
      "./assets/bigscreenLeft.svg"
    );
    this.load.svg(
      "bigscreenRight", 
      "./assets/bigscreenRight.svg"
    );
    this.load.atlas(
      "confetti",
      "./assets/confetti.png",
      "./json/confetti_GJ.json"
    );
    this.load.atlas(
      "cultureIcon",
      "./assets/cultureIcon.png",
      "./json/icon.json"
    );
    this.load.image(
      "ethnicityIcon",
      "./assets/ethnicityIcon.png"
    );
    this.load.svg(
      'help1', 
      "./assets/help1.svg"
    );
    this.load.svg(
      'help2', 
      "./assets/help2.svg"
    );
    this.load.svg(
      'help3', 
      "./assets/help3.svg"
    )
    this.load.image(
      "helpIcon",
      "./assets/helpIcon.svg"
    );
    this.load.image(
      "mask",
      "./assets/mask.png"
    );
    this.load.image(
      "portal",
      "./assets/portal.png"
    );
    this.load.image(
      "QRCode",
      "./assets/qr-code (4)-bg.png"
    );
    this.load.image(
      "selectWheel",
      "./assets/selectWheel.png"
    );
    this.load.image(
      "smile",
      "./assets/smile.png"
    );
    this.load.image(
      "starCounterIcon",
      "./assets/starCounterIcon.png"
    );
    this.load.image(
      "thumbUp",
      "./assets/thumbUp.png"
    );
    this.load.image(
      "timerIcon",
      "./assets/timerIcon.svg"
    );
    this.load.image(
      'wheelMask', 
      './assets/wheelMask.png'
    );
    this.load.atlas(
        "wrong",
        "./assets/wrong.png",
        "./json/wrong.json"
    );
    this.input.setTopOnly(false);
  }

  create() {
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

    if (isBigScreen) {
      this.mainPlayer = new MainPlayer(mainPlayerInfo);
      window.sessionStorage.setItem("scores", [1, 1, 1, 1, 1, 1]);
    }
    
    //#region ******************** START of Phaser Mobile Scene Initialising ********************
    if (isMobile) {
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

      // ----------------- create the mainPlayer object and set up the physics -----------------
      // generate the custom texture
      this.genWheelTexture(scores, gameOptions.wheelRadius, "userWheel", true);
      let mainPlayerWheel = this.add.image(0, 0, "userWheel");
      this.mainPlayer = new MainPlayer(mainPlayerInfo, scores);
      // culture text
      let rrec = this.add.rexRoundRectangle(
        0,
          -(gameOptions.wheelRadius + 25 * DPR),
        gameOptions.playerTextWidth,
        gameOptions.cultureTextFontSize / 2 + (80 * DPR) / 3,
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
          -(gameOptions.wheelRadius + 25 * DPR),
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
        -text.width / 2 + (30 * DPR) / 3,
          -(gameOptions.wheelRadius + 25 * DPR),
        "cultureIcon"
      );
      icon.setOrigin(0.5, 0.5);
      icon.setFrame(iconFrameNames[gameOptions.curIndex].frame);
      icon.setScale(DPR / 3);
      rrec.width = text.width + 100;
      this.mainPlayer.rrec = rrec;
      this.mainPlayer.text = text;
      this.mainPlayer.icon = icon;
      // name text
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
      // set thumbUp
      let thumbUp = this.add.sprite(0, 0, "thumbUp");
      thumbUp.setScale(0.1).setAlpha(0).setDepth(200);
      thumbUp.canReveal = true;
      // set smile
      let smile = this.add.sprite(0, 0, "smile");
      smile.setScale(1).setAlpha(0);
      smile.canReveal = true;
      // binding
      this.mainPlayer.nameRrec = centerRrec;
      this.mainPlayer.nameText = centerText;
      this.mainPlayer.thumbUp = thumbUp;
      this.mainPlayer.smile = smile;


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

      // -----------------Set Camera-----------------
      this.cameras.main.setScroll(0);
      this.cameras.main.setBounds(
          -100 * DPR,
          -300 * DPR,
          gameOptions.worldWidth + 200 * DPR,
          gameOptions.worldHeight + 400 * DPR
      );
      this.cameras.main.startFollow(this.mainPlayer.gameObject);
    }
    //#endregion ******************** END of Phaser Mobile Scene Initialising ********************

    //#region ******************** NETWORKING ********************
    let socket = io.connect(`${config.server.url.replace(/\/+$/, '')}:${config.server.port}`);
    this.socket = socket;
    socket.phase = phase;
    let initInfo = {
      phase: phase,
      info: mainPlayerInfo,
      star: window.sessionStorage.getItem("star"),
      scores: window.sessionStorage.getItem("scores").split(","),
      uuid: window.sessionStorage.getItem("uuid"),
      roomNumber: window.sessionStorage.getItem("roomNumber"),
      lobbyNumber: window.sessionStorage.getItem("lobbyNumber"),
      curLevel: window.sessionStorage.getItem("curLevel"),
      clientType: clientType,
    };

    socket.emit("init", initInfo);
    console.log(initInfo);
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
    socket.on("reconnect", (to) => {
      if (to === 0 || phase === 0) {
        window.location.href = "/HTMLs/game.html";
      } else {
        window.location.href = "/HTMLs/puzzle.html";
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
      window.location.href = "/HTMLs/game.html";
    });
    socket.on("timeUpdate", (time) => {
      this.timerText.text = time;
    });
    socket.on("addStar", (totalStars) => {
      stars = totalStars;
      this.insText.text = "Stars: " + totalStars;
      let starDeg = totalStars / starGoal * 360;
      this.progressBar.slice(0, 0, this.bgWheel.width * 2.5, 0, Phaser.Math.DegToRad(starDeg), false);
      window.sessionStorage.setItem("stars", stars);
      console.log("add a star");
    })
    socket.on("puzzlePlayerAdd", () => {
      puzzlePlayerCount += 1;
      this.puzzleCountText.text = "Players: " + puzzlePlayerCount;
    })
    socket.on("puzzlePlayerSub", () => {
      puzzlePlayerCount -= 1;
      this.puzzleCountText.text = "Players: " + puzzlePlayerCount;
    })
    //#endregion

    // create UI
    this.createUI();
    this.findPeople = {};
    this.findPeople.nWheelTapped = 0;
    this.findPeople.targetFound = false;
    this.findPeople.state = "IDLE";
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

  // does this function working?
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
    this.bgWheel = this.add.image(gameOptions.worldWidth / 2, gameOptions.worldHeight / 2, "bgWheel");
    this.bgWheel.setOrigin(0.5, 0.5).setDepth(-99).setScale(5).setScrollFactor(1);

    if (isMobile) {
      this.createMobileUI();
    }

    if (isBigScreen) {
      this.createBigScreenUI();
    }
  }

  createTextObject(UISettings, x, y, text, textType,fixedWidth) {
    let textFontSetting = UISettings[textType];
    let textObject = this.add.text(
      x,
      y,
      text,
      {
        fontFamily: textFontSetting.fontFamily,
        fontSize: textFontSetting.fontSize,
        fixedWidth: fixedWidth,
        color: textFontSetting.color,
        align: "center",
      }
    );
    textObject.setOrigin(0.5, 0.5);
    return textObject;
  }

  createUIButton(UISettings, x, y, text, textType) {
    let button = this.add.rexRoundRectangle(
      x,
      y,
      UISettings.buttonWidth, // width
      UISettings.buttonHeight, // height
      UISettings.buttonRadius, // radius
      UISettings.buttonColor,
      1, // alpha
    );
    button.on("pointerover", () => {
      button.setFillStyle(UISettings.buttonHoverColor);
    })
    button.on("pointerout", () => {
      button.setFillStyle(UISettings.buttonColor);
    })
    button.on("pointerup", () => {
      button.setFillStyle(UISettings.buttonColor);
    })
    button.textObject = this.createTextObject(UISettings, x, y, text, textType, UISettings.buttonWidth * 0.8);
    return button;
  }

  setButtonDepth(button, depth) {
    button.setDepth(depth);
    button.textObject.setDepth(depth);
  }

  createMobileUI() {
    // background 
    this.bgImage = this.add.tileSprite(0, 0, 4000, 4000, 'seamlessBG');
    this.bgImage.setOrigin(0).setScrollFactor(1).setDepth(-100).setScale(gameOptions.worldWidth / 4000);
    //wrong text
    this.wrongText = this.add.text(gameOptions.viewportWidth * 0.5, gameOptions.viewportHeight * 0.75,
        "Wrong Wheel",
        {
          fontFamily: gameOptions.playerTextFont,
          fontSize: 36 * DPR,
          color: gameOptions.playerTextColor,
          align: "center",
          wordWrap: { width: gameOptions.viewportWidth * 0.8 },
        })
    this.wrongText.setOrigin(0.5, 0.5);
    this.wrongText.setDepth(2000);
    this.wrongText.setScrollFactor(false);
    this.wrongText.setVisible(false);

    // tap related
    let self = this;
    this.bgImage
      .setInteractive()
      .on("pointerup", function (pointer, localX, localY, event) {
        self.selectWheel.pointerdown = false;
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
            this.wrongAnim.setDepth(200).setScale(DPR);
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
      gameOptions.viewportWidth - (120 * DPR) / 3,
      gameOptions.viewportHeight / 2,
      "thumbUp"
    );
    this.thumbUpButton
      .setScrollFactor(0)
      .setDepth(100)
      .setScale((0.5 * DPR) / 3)
      .setInteractive()
      .on("pointerdown", (pointer, localX, localY, event) => {
        this.showThumbUp();
        event.stopPropagation();
      });
    
    //select wheel and it's interaction
    this.selectWheel = this.add
      .image(
        gameOptions.viewportWidth / 2,
        gameOptions.viewportHeight + gameOptions.selectWheelOffset,
        "selectWheel"
      )
      .setScrollFactor(0)
      .setDepth(100)
      .setScale((1.5 * DPR) / 3);
    this.selectWheelMask = this.add
      .image(
        gameOptions.viewportWidth / 2,
        gameOptions.viewportHeight + gameOptions.selectWheelOffset,
        "mask"
      )
      .setScrollFactor(0)
      .setDepth(101)
      .setScale((1.5 * DPR) / 3);
    this.selectWheel.pointerdown = false;
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
      (swipe, gameObject, lastPointer) => {
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
        base: this.add.circle(0, 0, gameOptions.joyStickRadius, 0x000000),
        thumb: this.add
          .circle(0, 0, gameOptions.joyStickRadius / 2, 0x000000)
          .setScrollFactor(0),
        // dir: '8dir',   // 'up&down'|0|'left&right'|1|'4dir'|2|'8dir'|3
        // forceMin: 16,
        // enable: true
      });
      //.on("update", this.moveMainPlayer, this);
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

    // help UI
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
      gameOptions.helpRadius,
      0x946854,
      0.85
    );
    this.helpRrec.setStrokeStyle(
        gameOptions.identityBoxStrokeWidth,
        gameOptions.assignmentBoxStrokeColor,
        1
    );
    this.helpTitle = this.add.text(0, this.helpRrec.height * (0.15-0.5),
        helpTitle[0],
        {
          fontFamily: gameOptions.playerTextFont,
          fontSize: 48 * DPR,
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
        gameOptions.helpRadius,
        0x372B24,
        1
    )
    this.helpButton.setStrokeStyle(
        gameOptions.identityBoxStrokeWidth,
        gameOptions.assignmentBoxStrokeColor,
        1
    );

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
    this.helpButtonText.isVisible = true;
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
        this.helpButtonText.setVisible(false);
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
            gameOptions.viewportWidth - 10 * DPR,
            30 * DPR,
            "helpIcon"
        )
        .setOrigin(1, 0.5)
        .setScrollFactor(0)
        .setDepth(101)
        .setScale(DPR);
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
      this.bgWheel.setScale(2.5);
      let myStorage = window.sessionStorage;
      this.topContainer = this.add.rexRoundRectangle (
          gameOptions.viewportWidth / 2,
          30 * DPR,
          gameOptions.viewportWidth - 5 * DPR,
          50 * DPR,
          {tl: 10 * DPR, tr: 10 * DPR, bl: 10 * DPR, br: 10 * DPR},
          0xffffff,
          1
      )
      this.topContainer.setScrollFactor(false);
      this.topContainer.setStrokeStyle(gameOptions.assignmentBoxStrokeWidth, 0x946955);
      this.topContainer.setDepth(100);
      puzzleOptions.time = eval(myStorage.getItem("time"));
      this.timerText = this.add.text(
        42 * DPR,
        30 * DPR,
        "",
        {
          fontFamily: gameOptions.playerTextFont,
          fontSize: 24 * DPR,
          color: "#372B24",
          align: "left",
        }
      );
      this.timerText.setScrollFactor(0);
      this.timerText.setOrigin(0, 0.5).setDepth(2000);
      console.log(`viewport width: ${gameOptions.viewportWidth}`);
      this.timerIcon = this.add
        .image(10 * DPR, 30 * DPR, "timerIcon")
        .setOrigin(0, 0.5)
        .setScrollFactor(0)
        .setDepth(100)
        .setScale(1 * DPR);

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
          x: gameOptions.viewportWidth / 2 + 12 * DPR,
          y: 30 * DPR,
          text: "0",
          style: {
            fontFamily: gameOptions.playerTextFont,
            fontSize: 24 * DPR,
            color: "#372B24",
            align: "left",
          },
        })
        .setOrigin(0, 0.5)
        .setDepth(100);
      this.starText.setScrollFactor(0);
      this.starCounterIcon = this.add
        .image(
          gameOptions.viewportWidth / 2 - 20 * DPR,
          30 * DPR,
          "starCounterIcon"
        )
        .setOrigin(0, 0.5)
        .setScrollFactor(0)
        .setDepth(100)
        .setScale(0.1 * DPR);
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
      puzzleOptions.cultures = myStorage.getItem("puzzleCultures").split(",");
      puzzleOptions.values = myStorage.getItem("puzzleValues").split(",");
      puzzleOptions.points = myStorage.getItem("puzzlePoints").split(",");
      puzzleOptions.time = eval(myStorage.getItem("time"));

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
          10 * DPR,
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
    bigscreenLevelCounter = 0;
    this.bgWheel.setDepth(-101);
    this.bgWheel.setScale(5 * (gameOptions.worldWidth / WORLD_SIZE));
    this.bgImage = this.add.tileSprite(0, 0, bigScreenWorldWidth, bigScreenWorldHeight, 'BG');
    this.bgImage.setOrigin(0).setScrollFactor(1).setDepth(-100);
    this.socket.emit("admin");

    this.bigscreenLeft = this.add.image(0, gameOptions.worldHeight, 'bigscreenLeft');
    this.bigscreenLeft.setOrigin(0, 1).setScale(DPR);
    this.bigscreenRight = this.add.image(gameOptions.worldWidth, 0, "bigscreenRight");
    this.bigscreenRight.setOrigin(1, 0).setScale(DPR);

    this.insText = this.createTextObject(
      bigScreenUISettings,
      bigScreenUISettings.width / 2,
      bigScreenUISettings.height / 2,
      "Let's\ncompose\na circle!",
      UITextType.title,
      bigScreenUISettings.width * 0.75,
    );

    this.timerText = this.add
      .text(gameOptions.viewportWidth / 2 - 1000, 900, 0, {
        fontFamily: gameOptions.playerTextFont,
        fontSize: 200,
        fixedWidth: gameOptions.worldWidth * 0.75,
        color: "#000000",
        align: "center",
      })
      .setDepth(-2000);

    this.QR = this.add.sprite(
      gameOptions.viewportWidth / 2,
      gameOptions.viewportHeight / 2,
      "QRCode"
    );
    this.QR.setScale(bigScreenRatio);
    this.tweens.add({
      targets: this.QR,
      scale: 0.9 * bigScreenRatio,
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

    this.playerCountText = this.createTextObject(
      bigScreenUISettings,
      bigScreenUISettings.width - (bigScreenUISettings.canvasHorizontalMargin + bigScreenUISettings.buttonWidth / 2),
      bigScreenUISettings.height - (bigScreenUISettings.canvasVerticalMargin + bigScreenUISettings.buttonOutlineDistance * 2 + bigScreenUISettings.buttonHeight * 2 + bigScreenUISettings.regularText.fontSize / 2),
      "Players: " + playersCount,
      UITextType.regular,
      bigScreenUISettings.buttonWidth * 0.75,
    )

    this.puzzleCountText = this.createTextObject(
      bigScreenUISettings,
      bigScreenUISettings.width - (bigScreenUISettings.canvasHorizontalMargin + bigScreenUISettings.buttonWidth / 2),
      bigScreenUISettings.height - (bigScreenUISettings.canvasVerticalMargin + bigScreenUISettings.buttonOutlineDistance * 3 + bigScreenUISettings.buttonHeight * 2 + bigScreenUISettings.regularText.fontSize * 1.5),
      "Players: " + playersCount,
      UITextType.regular,
      bigScreenUISettings.buttonWidth * 0.75,
    )

    // puzzle portal
    this.toggleQR = this.createUIButton(
      bigScreenUISettings,
      bigScreenUISettings.width - (bigScreenUISettings.canvasHorizontalMargin + bigScreenUISettings.buttonWidth / 2),
      bigScreenUISettings.height - (bigScreenUISettings.canvasVerticalMargin + bigScreenUISettings.buttonHeight / 2),
      "Hide Code",
      UITextType.button
    )
    console.log("button finished");
    this.toggleQR.setInteractive().on("pointerdown", (pointer) => {
      this.QR.setVisible(!this.QR.visible);
      this.toggleQR.textObject.text = this.QR.visible? "Hide Code" : "Show Code";
    });

    this.portal = this.createUIButton(
      bigScreenUISettings,
      bigScreenUISettings.width - (bigScreenUISettings.canvasHorizontalMargin + bigScreenUISettings.buttonWidth / 2),
      bigScreenUISettings.height - (bigScreenUISettings.canvasVerticalMargin + bigScreenUISettings.buttonOutlineDistance * 1 + bigScreenUISettings.buttonHeight * 1 + bigScreenUISettings.buttonHeight / 2),
      "Start",
      UITextType.button
    );
    this.portal.textObject.text = "Start";
    levelIndex = eval(window.sessionStorage.getItem("levelIndex"));
    bigscreenLevelCounter = levelIndex ? levelIndex : 0;
    console.log(levelIndex);
    if (levelIndex) {
      let starValue = eval(window.sessionStorage.getItem("stars"));
      stars = starValue ? starValue : 0;
      bigscreenLevelCounter = levelIndex;
      if (bigscreenLevelCounter === gameOptions.nLevel) {
        this.portal.textObject.text = "Report";
      }
      if (bigscreenLevelCounter > gameOptions.nLevel) {
        this.portal.textObject.text = "Reset";
      }
      this.bgWheelBW = this.add.image(gameOptions.worldWidth / 2, gameOptions.worldHeight / 2, "bgWheelBW");
      this.bgWheelBW
      .setOrigin(0.5, 0.5)
      .setDepth(-99)
      .setScale(5 * (gameOptions.worldWidth / WORLD_SIZE) * (648 / 1080))
      .setScrollFactor(1);
      this.bgWheel.setDepth(-97);
      this.QR.setVisible(false);
      this.QR.isVisible = false;
      this.toggleQR.textObject.text = "Show Code";
      this.insText.text = "Stars: " + stars;
      starGoal = playersCount * STAR_PER_PLAYER;
      this.playerCountText.setVisible(false);
      this.progressBar = this.add.graphics();
      this.bgWheel.mask = new Phaser.Display.Masks.GeometryMask(this, this.progressBar);
      this.progressBar.slice(0, 0, this.bgWheel.width * 5 * 0.5 * (gameOptions.worldWidth / WORLD_SIZE), 0, 0, false);
      this.progressBar.x = gameOptions.worldWidth / 2;
      this.progressBar.y = gameOptions.worldHeight / 2;
    }
    this.portal.setInteractive().on("pointerdown", (pointer) => {
      stars = 0;
      bigscreenLevelCounter += 1;
      window.sessionStorage.setItem("levelIndex", bigscreenLevelCounter);
      if (bigscreenLevelCounter <= gameOptions.nLevel){
        if (bigscreenLevelCounter === gameOptions.nLevel) {
          this.portal.textObject.text = "Report";
        }
        if (!this.bgWheelBW) {
          this.bgWheelBW = this.add.image(gameOptions.worldWidth / 2, gameOptions.worldHeight / 2, "bgWheelBW");
        }
        this.bgWheelBW
        .setOrigin(0.5, 0.5)
        .setDepth(-99)
        .setScale(5 * (gameOptions.worldWidth / WORLD_SIZE) * (648 / 1080))
        .setScrollFactor(1);
        this.bgWheel.setDepth(-97);
        this.QR.setVisible(false);
        this.QR.isVisible = false;
        this.toggleQR.textObject.text = "Show Code";
        this.insText.text = "Stars: " + stars;
        starGoal = playersCount * STAR_PER_PLAYER;
        this.playerCountText.setVisible(false);
        this.puzzleCountText.setDepth(2000);
        if (this.progressBar) {
          this.progressBar.destroy();
        }
        if (this.bgWheel.mask) {
          this.bgWheel.mask.destroy();
        }
        this.progressBar = this.add.graphics();
        this.bgWheel.mask = new Phaser.Display.Masks.GeometryMask(this, this.progressBar);
        this.progressBar.slice(0, 0, this.bgWheel.width * 5 * 0.5 * (gameOptions.worldWidth / WORLD_SIZE), 0, 0, false);
        this.progressBar.x = gameOptions.worldWidth / 2;
        this.progressBar.y = gameOptions.worldHeight / 2;
        this.bigscreenPuzzle = true;
        this.socket.emit("startPuzzle");
      }
      else if (bigscreenLevelCounter === gameOptions.nLevel + 1) {
        window.open("./HTMLs/bigscreenReport.html");
        this.portal.textObject.text = "Reset";
        this.puzzleCountText.setVisible(false);
        this.playerCountText.setVisible(true);
        this.socket.emit("startPuzzle");
      }
      else {
        this.socket.emit("reset");
        window.sessionStorage.removeItem("stars");
        window.sessionStorage.removeItem("levelIndex");
        window.location.reload();
      }
      if (this.timer1 !== null) {
        this.time.removeEvent(this.timer1);
        this.time.removeEvent(this.timer2);
      }
    });

    
    this.QR.setDepth(2000);
    this.bgWheel.setDepth(-99);
    this.insText.setDepth(-99);
    this.playerCountText.setDepth(2000);
    //this.puzzleCountText.setVisible(false);
    this.setButtonDepth(this.toggleQR, 2000);
    this.setButtonDepth(this.portal, 2000);
    console.log("UI finished");
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
      this.playerCountText.text = "Players: " + playersCount;
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
      this.playerCountText.text = "Players: " + playersCount;
    }
    console.log(player);
  }

  movePlayer(data) {
    if (this.initialized) {
      for (let uuid in data) {
        if (uuid === this.mainPlayer.uuid) continue;
        if (isMobile && this.players[uuid]) {
          this.players[uuid].gameObject.x = data[uuid].x;
          this.players[uuid].gameObject.y = data[uuid].y;
        } 
        if (isBigScreen && this.players[uuid]) {
          let ratio = bigScreenWorldWidth / WORLD_SIZE;
          this.players[uuid].gameObject.x = data[uuid].x * ratio;
          this.players[uuid].gameObject.y = data[uuid].y * ratio;
        }
      }
    }
  };

  createPlayerObject(player) {
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
    newPlayerWheel.wheelMask = this.add.image(0, 0, 'wheelMask').setOrigin(0.5).setScale(0.9*DPR).setAlpha(0);
    
    newPlayerWheel
      .setInteractive()
      .on("pointerdown", (pointer, localX, localY, event) => {
          console.log('TTTTint')
         newPlayerWheel.setScale(0.9);
         newPlayerWheel.wheelMask.setAlpha(0.2);
         setTimeout(()=> {
           newPlayerWheel.setScale(1);
           newPlayerWheel.wheelMask.setAlpha(0);
         }, 250);
        })
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
      (tap, newPlayerWheel, lastPointer) => {
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
        newPlayerWheel.setScale(1);
        newPlayerWheel.wheelMask.setAlpha(0);
      },
      this
    );
    let rrec = this.add.rexRoundRectangle(
      0,
      -(gameOptions.wheelRadius + 25 * DPR),
      gameOptions.playerTextWidth,
      gameOptions.cultureTextFontSize / 2 + (80 * DPR) / 3,
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
      -(gameOptions.wheelRadius + 25 * DPR),
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
      -text.width / 2 + (30 * DPR) / 3,
      -(gameOptions.wheelRadius + 25 * DPR),
      "cultureIcon"
    );
    icon.setFrame(iconFrameNames[gameOptions.curIndex].frame);
    icon.setScale(DPR / 3);

    rrec.width = text.width + 100;

    player.rrec = rrec;
    player.text = text;
    player.icon = icon;
    let thumbUp = this.add.image(0, 0, "thumbUp");
    let smile = this.add.image(0, 0, "smile");

    thumbUp.setScale(DPR / 3).setAlpha(0);
    thumbUp.canReveal = true;
    smile.setScale(DPR / 3).setAlpha(0);
    smile.canReveal = true;
    player.thumbUp = thumbUp;
    player.smile = smile;
    let playerContainer = this.add.container(0, 0, [
      newPlayerWheel,
      rrec,
      text,
      icon,
      newPlayerWheel.wheelMask,
      thumbUp,
      smile,
    ]);
    playerContainer.setDepth(25);
    playerContainer.setPosition(player.x, player.y);
    if (isBigScreen) {
      playerContainer.getAt(1).setVisible(false);
      playerContainer.getAt(2).setVisible(false);
      playerContainer.getAt(3).setVisible(false);
      playerContainer.getAt(5).setScale(DPR / 3 * bigScreenRatio);
      playerContainer.setScale(bigScreenRatio);
    }
    player.gameObject = playerContainer;
    console.log("createNewPlayer, uuid is " + player.uuid);
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

  deactivatePlayer(data) {
    if (data == this.mainPlayer.uuid) {
      document.location.reload(true);
      return;
    }
    if (this.players[data]) {
      let index = this.createdPlayers.indexOf(data);
      this.createdPlayers.splice(index, 1);
      this.players[data].text.destroy();
      this.players[data].thumbUp.destroy();
      this.players[data].smile.destroy();
      this.players[data].gameObject.destroy();
      playersCount -= 1;
      if (isBigScreen) {
        this.playerCountText.text = "Players: " + playersCount;
      }
      delete this.players[data];
      console.log("deactivate player " + data);
    }
    else {
      console.log(`deactivate: player uuid ${data} cannot be found`);
    }
  }

  showThumbUp() {
    if (this.mainPlayer.thumbUp.canReveal) {
      this.socket.emit("thumbUp", this.mainPlayer.uuid);
      this.mainPlayer.thumbUp.canReveal = false;
      this.mainPlayer.thumbUp.scaleX = 0.1 * DPR / 3; // 3 is the highest DPR when we created the image asset
      this.mainPlayer.thumbUp.scaleY = 0.1 * DPR / 3;
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
        scaleX: 0.5 * DPR / 3,
        scaleY: 0.5 * DPR / 3,
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
    if (isMobile) {
      player.thumbUp.y = -100;
      player.thumbUp.scaleX = 0.1 * DPR / 3;
      player.thumbUp.scaleY = 0.1 * DPR / 3;
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
        scaleX: 0.5 * DPR / 3,
        scaleY: 0.5 * DPR / 3,
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
    } 
    if (isBigScreen) {
      player.thumbUp.y = -100;
      player.thumbUp.scaleX = 0.5 * bigScreenRatio;
      player.thumbUp.scaleY = 0.5 * bigScreenRatio;
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
        scaleX: player.thumbUp.scaleX * 5,
        scaleY: player.thumbUp.scaleX * 5,
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
        this.players[uuid].rrec.width = this.players[uuid].text.width + 100;
        this.players[uuid].icon.setFrame(
          iconFrameNames[gameOptions.curIndex].frame
        );
        this.players[uuid].icon.x =
          this.players[uuid].rrec.x -
          this.players[uuid].text.width / 2 +
          (30 * DPR) / 3;
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
          (30 * DPR) / 3;
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
      window.location.href = "/HTMLs/puzzle.html";
    }
  }

  startAssignment(assignment, seekTime) {
    this.assignment = assignment;
    this.findPeople.seekTime = seekTime;
    this.targetIdentities = assignment.identities;
    this.targetIds = assignment.ids;
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
      .setScale(0.05 * DPR)
      .setAlpha(0)
      .setDepth(200)
      .setScrollFactor(0);
    star.setPosition(
      this.findPeople.tappedTarget.parentContainer.x - this.cameras.main.worldView.x,
      this.findPeople.tappedTarget.parentContainer.y - this.cameras.main.worldView.y
    );
    console.log(this.findPeople.tappedTarget);
    console.log(this.findPeople.tappedTarget.y);
    this.tweens.add({
      targets: star,
      alpha: 1,
      duration: 200,
      ease: "Sine.easeInOut",
      callbackScope: this,
    });
    this.tweens.add({
      targets: star,
      y: star.y - 50 * DPR,
      scaleX: 0.25 * DPR,
      scaleY: 0.25 * DPR,
      duration: 300,
      ease: "Back.easeOut",
      //easeParams: [ 0.1, 0.8 ],
      callbackScope: this,
    });
    this.tweens.add({
      targets: star,
      y: 30 * DPR,
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
      scaleX: 0.15 * DPR,
      scaleY: 0.15 * DPR,
      delay: 1300,
      duration: 500,
      ease: "Sine.easeOut",
      //easeParams: [ 0.1, 0.8 ],
      callbackScope: this,
      onComplete: function (tween) {},
    });
    this.tweens.add({
      targets: this.starText,
      y: this.starText.y - 10 * DPR,
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
    window.location.href = "/HTMLs/report.html";
  }

  onPuzzleSolved() {
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

let game = new Phaser.Game(gameconfig);
window.focus();