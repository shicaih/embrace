/**
 * The script contains the logic of the lobby scene
 * after the player finished the survey, the wheel info is stored in the window.localStorage
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
var inited = false;
let devicePixelRatio = window.devicePixelRatio;
devicePixelRatio = 1.5; // just for testing

let isMobile = clientType === 1;
let isLobby = phase === 0;

var puzzleOptions = {
    cultures: null,
    values: null,
    points: null,
}

var gameOptions = {
    curCulture: "music",
    curIndex: 0,
    cultures: [
        "music",
        "food",
        "hobby",
        "economics",
        "location",
        "ethnicity"
    ],
    colors: [
        0xe1338e,
        0xee6731,
        0xfdca32,
        0x49e430,
        0xd23be7,
        0x4e30f0,
    ],
    spinDuration: 500, // milliseconds
    speed: 0.05,
    viewportWidth: isMobile? window.innerWidth * devicePixelRatio : 4000,
    viewportHeight: isMobile? window.innerHeight * devicePixelRatio : 4000,
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
console.log(window.localStorage);

function MainPlayer(info) {
    this.id = null;
    this.info = info;
    this.gameObject = null;
    this.text = null;
}

window.onload = function () {

};

class Lobby extends Phaser.Scene {
    constructor() {
        super("lobby");
    }

    preload() {
        console.log("preload is working");
        // plugins
        let url;
        url =
            "https://raw.githubusercontent.com/rexrainbow/phaser3-rex-notes/master/dist/rexvirtualjoystickplugin.min.js";
        this.load.plugin("rexvirtualjoystickplugin", url, true);
        url = "https://raw.githubusercontent.com/rexrainbow/phaser3-rex-notes/master/dist/rexroundrectangleplugin.min.js"
        this.load.plugin('rexroundrectangleplugin', url, true);

        // art asset
        this.load.image(
            "BG",
            "https://cdn.glitch.global/41cfbc99-0cac-46f3-96da-fc7dae72a57b/BG.png?v=1647550334928"
        );
        this.load.image(
            "userWheel",
            "https://cdn.glitch.global/41cfbc99-0cac-46f3-96da-fc7dae72a57b/Wheel%20-%206.png?v=1647557640443"
        );
        this.load.image(
            "selectWheel",
            "https://cdn.glitch.global/41cfbc99-0cac-46f3-96da-fc7dae72a57b/spinWheel.png?v=1647614597874"
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
            "https://cdn.glitch.global/41cfbc99-0cac-46f3-96da-fc7dae72a57b/QRCode.png?v=1647873061693");
        this.load.atlas(
            "anim",
            "https://cdn.glitch.global/41cfbc99-0cac-46f3-96da-fc7dae72a57b/anim.png?v=1648099488799",
            "anim2.json")
        
    }

    create() {
        this.initialized = false;
        let self = this;
        this.anims.create({
              key: 'anim',
              frames: this.anims.generateFrameNames('anim', {
                  start: 0,
                  end: 47,
                  zeroPad: 3,
                  prefix: 'Attack__',
                  suffix: '.png'
              }),
              frameRate: 8,
              repeat: -1
          });

        this.add.sprite(400, 300, 'anim').play('anim');
        let mainPlayerInfo = {};
        if(!isMobile) {
            this.mainPlayer = new MainPlayer(mainPlayerInfo);
        }
        else {
            let others = [];
            mainPlayerInfo.others = others;
            // Read the player culture info from localStorage by providing the culture name,
            // the value is a string containing the user input(string) and if he/she wants to show it to others(bool).
            // we need to split the string and access the input by index 0 and access the bool by index 1.

            for (let i = 0; i < gameOptions.cultures.length; i++) {
                let culture = gameOptions.cultures[i];
                let cultureInfo = window.localStorage[culture].split(","); // the array has a string and a bool
                mainPlayerInfo[culture] = cultureInfo[1]? cultureInfo[0]: null;
                if(cultureInfo[2]) {
                    others.push(culture);
                }
            }
          
            let mainPlayerWheel = this.matter.add.sprite(
                gameOptions.viewportWidth / 2,
                gameOptions.viewportHeight / 2, "userWheel");
            
          
            // create the mainPlayer object and set up the physics
            this.mainPlayer = new MainPlayer(mainPlayerInfo);
            this.mainPlayer.gameObject = mainPlayerWheel;
            mainPlayerWheel.setCircle(gameOptions.wheelRadius);
            mainPlayerWheel.setStatic(false);
            mainPlayerWheel.setFixedRotation();
            mainPlayerWheel.setDepth(50);
            


            let rrec = this.add.rexRoundRectangle(0,
                                                  0,
                                                  gameOptions.playerTextWidth,
                                                  gameOptions.playerTextHeight, 
                                                  32,
                                                  gameOptions.colors[0],
                                                  1,
                                                  );
            let text = this.add.text(
                -gameOptions.playerTextWidth / 2,
                -gameOptions.playerTextFontSize ,
                gameOptions.curCulture + '\n' + mainPlayerInfo[gameOptions.curCulture],
                {
                    fontFamily: gameOptions.playerTextFont,
                    fontSize: gameOptions.playerTextFontSize,
                    color: gameOptions.playerTextColor,
                    fixedWidth: gameOptions.playerTextWidth,
                    align: "center",
                }
            );
            

            this.mainPlayer.rrec = rrec;
            this.mainPlayer.text = text;
          
            let containerPosX = this.mainPlayer.gameObject.x - gameOptions.playerTextWidth / 2;
            let containerPosY = this.mainPlayer.gameObject.y - gameOptions.playerTextHeight / 2;
            let textContainer = this.add.container(containerPosX, containerPosY, [rrec, text]);
            textContainer.setDepth(51);
            textContainer.setSize(10, 10);
            let textPContainer = this.matter.add.gameObject(textContainer, {isSensor: true});
            this.mainPlayer.playerTextCon = textContainer;
            this.mainPlayer.playerTextPCon = textPContainer;
            let constraint = this.matter.add.constraint(mainPlayerWheel, 
                                                        textPContainer, 
                                                        gameOptions.playerTextDistance, 
                                                        1, {angularStiffness: 1})
            console.log(constraint);
            rrec = this.add.rexRoundRectangle(0,
                                              0,
                                              gameOptions.wheelRadius,
                                              gameOptions.wheelRadius - 50, 
                                              16,
                                              0xffffff,
                                              0.75,
                                              );
            text = this.add.text(
                -gameOptions.playerTextWidth / 2,
                -gameOptions.playerTextFontSize / 2 ,
                window.localStorage.getItem("name"),
                {
                    fontFamily: gameOptions.playerTextFont,
                    fontSize: gameOptions.playerTextFontSize,
                    color: "#000000",
                    fixedWidth: gameOptions.playerTextWidth,
                    align: "center",
                }
            );
            

            this.mainPlayer.nameRrec = rrec;
            this.mainPlayer.nameText = text;
          
            containerPosX = this.mainPlayer.gameObject.x - gameOptions.playerTextWidth / 2;
            containerPosY = this.mainPlayer.gameObject.y - gameOptions.playerTextHeight / 2;
            textContainer = this.add.container(containerPosX, containerPosY, [rrec, text]);
            
            textContainer.setDepth(51);
            textContainer.setSize(10, 10);
            textPContainer = this.matter.add.gameObject(textContainer, {isSensor: true});
            this.mainPlayer.nameTextCon = textContainer;
            this.mainPlayer.nameTextPCon = textPContainer;
            constraint = this.matter.add.constraint(mainPlayerWheel, 
                                                        textPContainer, 
                                                        0, 
                                                        1,)
            
            // set camera that stays in the boundary and follow our playerWheel
            let camera = this.cameras.main;
            camera.setBounds(0, 0, gameOptions.worldWidth, gameOptions.worldHeight);
            camera.startFollow(this.mainPlayer.gameObject);
        }


        // Networking, may be put into another file afterwards
        let socket = io.connect(
            "https://embrace-lobby-server.glitch.me"
        );
        this.socket = socket;
        socket.phase = phase;

        socket.emit("init", {
            phase: phase,
            info: mainPlayerInfo,
        });
        socket.on("playerData", function (data) {
            self.initi(data);
        });
        socket.on("playerJoined", function (data) {
            self.addPlayer(data);
        });
        socket.on("playerMoved", function (data) {
            self.movePlayer(data);
        });
        socket.on("playerLeft", function (data) {
            self.deactivatePlayer(data);
        });
        socket.on("startPuzzle", function (data) {
            self.startPuzzle(data);
        })
        socket.on("solved", () => {
            console.log("solved");
            self.onPuzzleSolved();
        })
        socket.on("notSolved", () => {
            console.log("notSolved");
            self.onPuzzleNotSolved();
        })
      
        this.createUI();
    }

    update() {
        if (isMobile) {
            let x = Phaser.Math.Clamp(this.joyStick.forceX, -100, 100);
            let y = Phaser.Math.Clamp(this.joyStick.forceY, -100, 100)
            this.mainPlayer.gameObject.setVelocity(x * gameOptions.speed,
                y * gameOptions.speed);
            this.socket.emit("positionUpdate", {
                id: this.mainPlayer.id,
                x: this.mainPlayer.gameObject.x,
                y: this.mainPlayer.gameObject.y,
            });
        }
    }

    createUI() {
        // background
        this.bgImage = this.add
            .image(0, 0, "BG")
            .setOrigin(0)
            .setScrollFactor(1);
        this.bgImage.setDepth(-100);

        if (isMobile) {
            //select wheel
            this.selectWheel = this.add
                .image(gameOptions.viewportWidth, gameOptions.viewportHeight, "selectWheel")
                .setScrollFactor(0)
                .setDepth(100);
            this.selectWheel.canSpin = true;
            this.forwardButton = this.add
                .sprite(gameOptions.viewportWidth - (gameOptions.buttonRadius + gameOptions.buttonPadding),
                    gameOptions.viewportHeight - (gameOptions.buttonRadius + gameOptions.buttonPadding + gameOptions.wheelRadius * 2),
                    "arrowForward")
                .setScrollFactor(0)
                .setDepth(100);
            this.backwardButton = this.add
                .sprite(gameOptions.viewportWidth - (gameOptions.buttonRadius + gameOptions.buttonPadding + gameOptions.wheelRadius * 2),
                    gameOptions.viewportHeight - (gameOptions.buttonRadius + gameOptions.buttonPadding),
                    "arrowBackward")
                .setScrollFactor(0)
                .setDepth(100)
                .setAngle(-90);
            this.forwardButton.setInteractive().on("pointerdown", (pointer) => {
                this.nextCulture(-1);
            });
            this.backwardButton.setInteractive().on("pointerdown", (pointer) => {
                this.nextCulture(1);
            });

            // direction control
            this.joyStick = this.plugins
                .get("rexvirtualjoystickplugin")
                .add(this, {
                    x: gameOptions.joyStickRadius + gameOptions.joyStickPadding,
                    y: gameOptions.viewportHeight - (gameOptions.joyStickRadius + gameOptions.joyStickPadding),
                    radius: gameOptions.joyStickRadius,
                    base: this.add.circle(0, 0, gameOptions.joyStickRadius, 0x888888),
                    thumb: this.add.circle(0, 0, gameOptions.joyStickRadius / 2, 0xcccccc).setScrollFactor(0),
                    // dir: '8dir',   // 'up&down'|0|'left&right'|1|'4dir'|2|'8dir'|3
                    // forceMin: 16,
                    // enable: true
                })
                .on("update", this.moveMainPlayer, this);
            this.joyStick.base.setDepth(-101);
            this.joyStick.thumb.setDepth(-101);
            this.input.on('pointerdown', function (pointer) {
                this.joyStick.base.x = pointer.x;
                this.joyStick.base.y = pointer.y;
                this.joyStick.thumb.x = pointer.x;
                this.joyStick.thumb.y = pointer.y;

            }, this);
            if(!isLobby) { // puzzle phase
                this.insText = this.add.text(
                    gameOptions.viewportWidth / 2 - 500,
                    gameOptions.viewportHeight - 48 - 250,
                    "Fill the buckets",
                    {
                        fontFamily: "Georgia",
                        fontSize: 96,
                        color: "#372c25",
                        backgroundColor: "#f8f0dd",
                        fixedWidth: 1000,
                        align: "center",
                    });
                this.insText.setScrollFactor(0);
                this.insText.setDepth(-10);
                this.buckets = [];
                // update the puzzle options from localStorage
                let myStorage = window.localStorage;
                puzzleOptions.cultures = myStorage.getItem("puzzleCultures").split(',');
                puzzleOptions.values = myStorage.getItem("puzzleValues").split(',');
                puzzleOptions.points = myStorage.getItem("puzzlePoints").split(',')
                // create the buckets that will read data from puzzleOptions
                for (let i = 0; i < puzzleOptions.cultures.length; i++) {
                    this.createBucket(800, 
                                      300 + i * 600, 
                                      i);
                };
            };
        }
        // if big screen
        else {
            this.socket.emit("admin");
            // puzzle portal
            this.portal = this.add.sprite(2000, 2500, "portal");
            this.QR = this.add.sprite(2000, 2000, "QRCode");
            this.QR.setScale(3, 3);
            this.portal.setDepth(100);
            this.portal.setInteractive().on("pointerdown", (pointer) => {
                this.socket.emit("startPuzzle");
                window.location.href = "/puzzle.html";
            })
        }
    }

    // data.id is the id of the current socket,
    // data.players is an array of Player objects defined in the server side, it contains the info of main player
    initi(data) {
        console.log(this.mainPlayer);
        console.log(data.id);
        this.mainPlayer.id = data.id;
        this.players = data.players;
        for (let id in this.players) {
            if (id !== this.mainPlayer.id) {
                this.createPlayerObject(
                    this.players[id]
                );
            }
        }
        this.initialized = true;
        inited = true;
        console.log("initialized");
    }

    addPlayer(player) {
        this.players[player.id] = player;
        this.createPlayerObject(player);
        console.log(player);
    }

    movePlayer(data) {
        if (this.initialized) {
            console.log("move a object");
            this.players[data.id].gameObject.x = data.x;
            this.players[data.id].gameObject.y = data.y;
        }
    }

    // backup function that is not using now
    moveMainPlayer() {
        //this.mainPlayer.gameObject.setVelocity(this.joyStick.forceX * gameOptions.speed, this.joyStick.forceY * gameOptions.speed);
        //this.mainPlayer.gameObject.x += this.joyStick.forceX * gameOptions.speed;
        //this.mainPlayer.gameObject.y += this.joyStick.forceY * gameOptions.speed;
    }

    createPlayerObject(player) {
        console.log(player);
        let newPlayerWheel = this.matter.add.sprite(
            player.x,
            player.y,
            "userWheel"
        );
        newPlayerWheel
            .setCircle(gameOptions.wheelRadius)
            .setStatic(true)
            .setFixedRotation();
        let rrec = this.add.rexRoundRectangle(0,
                                              0,
                                              gameOptions.playerTextWidth,
                                              gameOptions.playerTextHeight, 
                                              32,
                                              gameOptions.colors[0],
                                              1,
                                              );
        
        let text = this.add.text(
            -gameOptions.playerTextWidth / 2,
            -gameOptions.playerTextFontSize,
            gameOptions.curCulture + '\n' + player.wheelInfo[gameOptions.curCulture],
            {
                fontFamily: gameOptions.playerTextFont,
                fontSize: gameOptions.playerTextFontSize,
                color: gameOptions.playerTextColor,
                fixedWidth: gameOptions.playerTextWidth,
                align: "center",
            }
        );

        player.gameObject = newPlayerWheel;
        player.rrec = rrec;
        player.text = text;
        let containerPosX = player.gameObject.x - gameOptions.playerTextWidth / 2;
        let containerPosY = player.gameObject.y - gameOptions.playerTextHeight / 2;
        let textContainer = this.add.container(containerPosX, containerPosY, [rrec, text]);
        textContainer.setDepth(25);
        textContainer.setSize(10, 10);
        let textPContainer = this.matter.add.gameObject(textContainer, {isSensor: true});
        player.playerTextCon = textContainer;
        player.playerTextPCon = textPContainer;
        this.matter.add.constraint(newPlayerWheel, textPContainer, gameOptions.playerTextDistance, 1);
    }
  
    /*
    @brief create buckets for the puzzle
    */
    createBucket(x, y, index) {
        let bucket = this.matter.add.sprite(x, y, "bucket");
        let rrec = this.add.rexRoundRectangle(x,
                                              y,
                                              600,
                                              600, 
                                              32,
                                              gameOptions.colors[index],
                                              1,
                                              );
        this.buckets.push(bucket);
        let poolText = this.add.text(
            x - 250,
            y - 48,
            puzzleOptions.values[index] + "\n" + puzzleOptions.points[index],
            {
                fontFamily: "Georgia",
                fontSize: 48,
                color: "#ffffff",
                fixedWidth: 500,
                align: "center",
            })
        bucket
            .setBody("circle", {isStatic: true, isSensor: true, radius: 200})
            .setOnCollide((collisionData) => {
                console.log(collisionData.bodyA);
                if(collisionData.bodyA.circleRadius === gameOptions.wheelRadius) {
                    this.socket.emit("bucketIn", {index: index});
                }

            })
            .setOnCollideEnd((collisionData) => {
                console.log(collisionData.bodyA);
                if(collisionData.bodyA.circleRadius === gameOptions.wheelRadius) {
                    this.socket.emit("bucketOut", {index: index});
                }
            })
            .setDepth(-1);
      
    }

    deactivatePlayer(data) {
        this.players[data].text.destroy();
        this.players[data].playerTextCon.destroy();
        this.players[data].playerTextPCon.destroy();
        this.players[data].gameObject.destroy();
        // still needs to delete the player and a lot
        delete this.players[data];
    }

    nextCulture(direction) {
        if (this.selectWheel.canSpin) {
            this.selectWheel.canSpin = false;
            let index = gameOptions.curIndex;
            if (direction === 1){
                index = index === 0 ? gameOptions.cultures.length - 1: index - 1;
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
    };


    updateCultureText() {
        let culture = gameOptions.curCulture;
        let index = gameOptions.curIndex;
        console.log(index);
        for (let id in this.players) {
            if (id !== this.mainPlayer.id) {
                this.players[id].text.text = gameOptions.curCulture + '\n' + this.players[id].wheelInfo[culture];
                
            } else {
                this.mainPlayer.text.text = gameOptions.curCulture + '\n' + this.mainPlayer.info[gameOptions.curCulture];
                this.mainPlayer.rrec.setFillStyle(gameOptions.colors[index], 1);
            }
        }
    }

    startPuzzle(data) {
        let myStorage = window.localStorage;
        myStorage.puzzleCultures = data.cultures;
        myStorage.puzzleValues = data.values;
        myStorage.puzzlePoints = data.points;
        window.location.href = "/puzzle.html";
    };

    onPuzzleSolved() {
        this.insText.text = "You solved the puzzle!";
    }
    onPuzzleNotSolved() {
        this.insText.text = "Fill the buckets";
    }
}

let gameconfig = {
    type: Phaser.AUTO,
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
                right: true
            }
        },
    },
    scene: Lobby,
};
game = new Phaser.Game(gameconfig);
window.focus();
console.log("scene built finished");