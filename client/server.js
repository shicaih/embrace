var server = require('http').createServer();
var socketOptions = {
    cors: true,
}
var io = require('socket.io')(server, socketOptions);

var options = {
    cultures: ['music', 'food', 'hobby', 'location', 'economics', 'ethnicity'],
    roomMaxPlayers: 6,
};

var lobbyPlayers = {};
var puzzlePlayers = {};
var puzzleRooms = [];
function Player (id, wheelInfo, socket) {
    this.id = id;
    this.ip = null;
    this.x = 0;
    this.y = 0;
    this.wheelInfo = wheelInfo;
    this.gameObject = null;
    this.text = null;
    this.socket = socket;
}
function Room (id) {
    this.id = id;
    this.playerIds = [];
    this.players = null;
    this.puzzleOptions = null;
    this.realtimePoints = [];
    this.level = 0;
}
function DataEntry (culture, value, point) {
    this.culture = culture;
    this.value = value;
    this.point = point;
    this.ids = [];
}

function PuzzleOptions () {
  this.cultures = [];
  this.values = [];
  this.points = [];
};

let puzzleGenerated = false;

var bucketPoints = [];


class HashTable{
  constructor() {
    this.table = new Array(15);
    //this.size = 0;
    for (var i = 0; i < this.length; i++) {
      this.table[i] = new Array(1000);
    }    
  }

_hash(key) {
    let hash = 0;
    for (let i = 0; i < key.length; i++) {
      hash += key.charCodeAt(i);
    }
    return hash % this.table.length;
  }

set(key, value) {
    const index = this._hash(key);
    let i = 0;
    while(this.table[index][i] !== null){
        i++;
    }
    this.table[index][i] = value;
    //this.size++;
  }

get(key) {
    const target = this._hash(key);
    return this.table[target];
  }
  
get_table(){
    const list = this.table[0];
    for(let i = 1; i < this.table.length; i++){
      list = list.concat(this.table[i]);
    } 
    return list;
  }
  
}




io.sockets.on('connection', function(socket) {
    console.log('A user has logged in');
    console.log(socket.id);
    console.log(socket.handshake.address);
    socket.on ('init', function (data) {
        var id = socket.id;
        socket.phase = data.phase;
        console.log("Phaser is " + data.phase);
        // Creates a new player object with a unique ID number.
        var newPlayer = new Player(id, data.info, socket);
        newPlayer.ip = socket.handshake.address;
        // Adds the newly created player to the array according to its phase state.
        // Sends the connecting client his unique ID, and data about the other players already connected.
        // Sends everyone except the connecting player data about the new player.
        if(socket.phase === 0) {
            lobbyPlayers[id] = newPlayer;
            socket.emit('playerData', {id: id, players: lobbyPlayers});
            socket.join("lobby");
            socket.to("lobby").emit("playerJoined", newPlayer)
        } else {
            puzzleRooms[id] = newPlayer;
            socket.emit('playerData', {id: id, players: puzzlePlayers});
            socket.join("puzzle");
            console.log("and Joined the puzzle Lobby");
            socket.to("puzzle").emit("playerJoined", newPlayer)
        }

        socket.on ('positionUpdate', function (data) {
            if(socket.phase === 0) {
                if(!lobbyPlayers[data.id]) return;
                lobbyPlayers[data.id].x = data.x;
                lobbyPlayers[data.id].y = data.y;
                socket.to("lobby").emit('playerMoved', data);
            } else {
                if(!puzzlePlayers[data.id]) return;
                puzzlePlayers[data.id].x = data.x;
                puzzlePlayers[data.id].y = data.y;
                socket.to("puzzle").emit('playerMoved', data);
            }

        });

        socket.on('disconnect',function(){
            if (socket.phase === 0) {
                if(!lobbyPlayers[socket.id]) return;
                // Update clients with the new player killed 
                delete lobbyPlayers[socket.id];
                socket.to("lobby").emit('playerLeft',socket.id);
            } else {
                if(!puzzlePlayers[socket.id]) return;
                // Update clients with the new player killed 
                
                if(puzzlePlayers[id].wheelInfo[puzzleOptions.cultures[data.index]] === puzzleOptions.values[data.index]) {
                    bucketPoints[data.index] -= 1;
                    checkSolved(socket);
                }
                delete puzzlePlayers[socket.id];
                socket.to("puzzle").emit('playerLeft',socket.id);
            }

        });
      
        socket.on('startPuzzle', function() {
            console.log("Puzzle Started");
            initPuzzles();
            for (let i = 0; i < puzzleRooms.length; i++) {
                socket.to("Room" + i).emit("startPuzzle", puzzleRooms[i].puzzleOptions)
            }
        })
      
        socket.on("admin", function() {
            console.log("deleting");
            delete lobbyPlayers[socket.id];
            socket.to("lobby").emit('playerLeft',socket.id);
        })
        
        socket.on ("bucketIn", (data) => {
            let puzzleOptions = puzzleRooms[0].puzzleOptions;
            if(puzzlePlayers[id].wheelInfo[puzzleOptions.cultures[data.index]] === puzzleOptions.values[data.index]) {
                bucketPoints[data.index] += 1;
                checkSolved(socket);
            }
            console.log(bucketPoints);
        });
      
        socket.on ("bucketOut", (data) => {
            let puzzleOptions = puzzleRooms[0].puzzleOptions;
            if(puzzlePlayers[id].wheelInfo[puzzleOptions.cultures[data.index]] === puzzleOptions.values[data.index]) {
                bucketPoints[data.index] -= 1;
                checkSolved(socket);
            }
            console.log(bucketPoints);
        })
    });
});

function initPuzzles() {
    puzzleRooms = dividePlayers(lobbyPlayers);
    for (let i = 0; i < puzzleRooms.length; i++) {
        puzzleRooms[i].puzzleOptions = generatePuzzle(puzzleRooms[i]);
        for (let j = 0; j < puzzleRooms[i].puzzleOptions.cultures.length; j++) {
            puzzleRooms[i].realtimePoints.push(0); // init the real time bucket points array
        }
    }
}

function generatePuzzle(room) {
    let cultures = [...options.cultures];
    let playerIds = [...room.playerIds];
    let puzzleOptions = new PuzzleOptions();
    let playerCount = room.playerIds.length;
    let uniqueCount = Math.floor(playerCount / 2);
    let sameCount = playerCount - uniqueCount;
    for (let i = 0; i < uniqueCount; i++) {
        if(playerIds.length !== 0) {
            let data = analyzeData(playerIds, cultures);
            puzzleOptions.cultures.push(data[0].culture);
            puzzleOptions.values.push(data[0].value);
            puzzleOptions.points.push(data[0].point);
            removeListItem(cultures, data[0].culture);
            for (let j = 0; j < data[0].ids.length; j++) {
                removeListItem(playerIds, data[0].ids[j]);
            }
        }
    }
  
    for (let i = 0; i < sameCount; i++) {
        if(playerIds.length != 0) {
            let data = analyzeData(playerIds, cultures);
            let dataCount = data.length;
            puzzleOptions.cultures.push(data[dataCount-1].culture);
            puzzleOptions.values.push(data[dataCount-1].value);
            puzzleOptions.points.push(data[dataCount-1].point);
            removeListItem(cultures, data[dataCount-1].culture);
            for (let j = 0; j < data[dataCount-1].ids.length; j++) { 
                removeListItem(playerIds, data[dataCount-1].ids[j]);
            }
        }
    }
    return puzzleOptions;
}

function removeListItem(l, item) {
    let index = l.indexOf(item);
    let test = l.splice(index, 1);
}

function generateHash(players){
  const ht = new HashTable();
  let idList = Object.keys(players);
  for(let i = 0; i < idList.length; i++){
    ht.set(players[idList[i]].wheelInfo.enthnicity, players[idList[i]]);
  }  
}

function generateFirstGroup(ht, players){
  let playerList = ht.get_table();
  let idList = Object.keys(players);
  let groupNumber = idList.length / 2;
  let firstGroup = new Array(Math.floor(groupNumber));
  
  for(let i = 0; i < firstGroup.length; i++){
    if(i = 0 && (idList.length % 2 !== 0)){
      firstGroup[i] = new Array(3);
    }
    else{
      firstGroup[i] = new Array(2);
    }    
  }
  
  let k = 0;
  for(let i = 0; i < 2; i++){
    for(let j = 0; j < firstGroup.length; j++){
      firstGroup[j][i] = playerList[k];
      k++;
    }
  }
  
  if(idList.length % 2 !== 0){
    firstGroup[0][2] = playerList[k];
  }
  
  return firstGroup;
}


function dividePlayers(players) {
    let puzzleRooms = [];
    let maxPlayers = options.roomMaxPlayers;
    let idList = Object.keys(players);
    let roomCount = Math.ceil(idList.length / maxPlayers);
    for (let i = 0; i < roomCount; i++) {
        puzzleRooms.push(new Room(i));
    }
    for (let i = 0; i < idList.length; i++) {
        let roomIndex = Math.floor(i / maxPlayers);
        puzzleRooms[roomIndex].playerIds.push(idList[i]);
        players[idList[i]].socket.join("Room" + roomIndex);
    }
    return puzzleRooms;
}

function analyzeData(idList, cultures) {
    let data = {};
    let values = [];
    let cultureNum = cultures.length;

    for (let i = 0; i < idList.length; i++) {
        let info = lobbyPlayers[idList[i]].wheelInfo;
        for (let j = 0; j < cultureNum; j++) {
            let culture = cultures[j];
            let value = info[culture];
            if (values.includes(value)) {
                data[value].point += 1;
                data[value].ids.push(idList[i]);
            } else {
                values.push(value);
                data[value] = new DataEntry(culture, value, 1);
                data[value].ids.push(idList[i]);
            }
        }
    };
    return sortData(data);
}

function sortData(data) {
    let dataList = [];
    for (var prop in data) {
        dataList.push(data[prop]);
    }
    dataList.sort((a, b) => {
        return a.point - b.point;
    });
    return dataList;
}

// strech goal
function checkOther(idList) {
    let results = {culture: null, 
                  value: null,
                  ids: [],
                  };
    for (let i = 0; i < idList.length; i++) {
        let info = lobbyPlayers[idList[i]].wheelInfo;
        if (info.others.length !== 0) {
            results.culture = info.others[0];
            results.value = info[results.culture];
            results.ids.push(idList[i]);
        }
    };
    return results;
}

function checkSolved(socket) {
    for (let i = 0; i < puzzleRooms[0].puzzleOptions.cultures.length; i++) {
        if (bucketPoints[i] !== puzzleRooms[0].puzzleOptions.points[i]) {
            io.to("puzzle").emit("notSolved");
            return false;
        }
    }
    io.to("puzzle").emit("solved");
    console.log("solved");
};
console.log ('Server started');
server.listen(3000);  