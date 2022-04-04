// import uuid module. We call uuid() to generate a new uuid
const { v4 : uuidGen } = require("uuid");
// server
var server = require('http').createServer();
// options for websocket  
var socketOptions = {
    cors: true,
}
// websocket object 
var io = require('socket.io')(server, socketOptions);
// server options for the game
var options = {
    cultures: ['music', 'food', 'hobby', 'finances', 'home', 'ethnicity'],
    roomMaxPlayers: [2, 4, 6, 8],
    nLevel: 4
};
// an object containing all the lobby players. key: uuid, value: Player object
var lobbyPlayers = {};
var goneLobbyPlayers = {};
// an object containing all the puzzle players. key: uuid, value: Player object
var puzzlePlayers = {};
var gonePuzzlePlayers = {};
var lobbyRooms = [{}];
// an array of all the Room objects. Array index is the id of Room.
var puzzleRooms = [];
var ht = null;
var firstGroup = null;
var curLevel = 0;
/**
 *
 * @param uuid
 * @param wheelInfo
 * @constructor
 */
function Player (uuid, wheelInfo, scores) {
    this.uuid = uuid;
    this.wheelInfo = wheelInfo;
    this.scores = scores;
    this.x = 0;
    this.y = 0;
    this.gameObject = null;
    this.text = null;
    this.sid = null;
    this.importantAspectIndices = [];

    let scoreRanks = [...Array(this.scores.length).keys()]
    let i = 0
    while (i < scoreRanks.length) {
        if (this.wheelInfo[options.cultures[i]] == "PreferNotToSay" || this.wheelInfo[options.cultures[i]] == "⊘") {
            scoreRanks.splice(i, 1)
        } else {
            i++
        }
    }
    scoreRanks.sort((a,b) => this.scores[b] - this.scores[a])
    i = options.nLevel
    this.importantAspectIndices = scoreRanks.slice(0, i)
    while (i < scoreRanks.length && scoreRanks[i] == scoreRanks[i-1]) {
        this.importantAspectIndices.push(scoreRanks[i++])
    }
}

function Room (id) {
    this.id = id;
    this.players = {};
    this.puzzleOptions = {};
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
}

let puzzleGenerated = false;

var bucketPoints = [];


class HashTable{
    constructor() {
        this.table = new Array(15);
        //this.size = 0;
        for (var i = 0; i < this.table.length; i++) {
            this.table[i] = new Array();
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
        //let i = 0;
        /*while(this.table[index][i] !== null){
            i++;
        }*/
      //this.table[0] = 1;
        this.table[index].push(value);
        //this.size++;
    }

    get(key) {
        const target = this._hash(key);
        return this.table[target];
    }

    get_table(){
        let list = this.table[0];
        for(let i = 1; i < this.table.length; i++){
            list = list.concat(this.table[i]);
        }
        return list;
    }

}

//const HT = new HashTable();

function onPlayerJoin() {

}

function initPuzzles() {
    
    if (curLevel === 0) {
      ht = generateHash(lobbyPlayers);
      firstGroup = generateFirstGroup(ht, lobbyPlayers);
     // console.log(firstGroup);
    } else {
      ht = generateHash(puzzlePlayers);
      firstGroup = generateFirstGroup(ht, puzzlePlayers);
     // console.log(firstGroup);
    }
    console.log(curLevel);
    let puzzleGroups = generateGroups(firstGroup, options.roomMaxPlayers[curLevel]);
    //console.log(puzzleGroups);
    console.log("Puzzle Groups finished");
    puzzleRooms = [];
    for (let i = 0; i < puzzleGroups.length; i++) {
        puzzleRooms.push(new Room(i));
        for (let j = 0; j < puzzleGroups[i].length; j++) { 
            let curPlayer = puzzleGroups[i][j];
            if (curPlayer !== undefined) {
              puzzleRooms[i].players[curPlayer.uuid] = curPlayer;
            }
        }
    }
    
    /*if (curLevel === 0) {
        puzzleRooms = dividePlayers(lobbyPlayers, curLevel);
    } else {
        console.log(puzzlePlayers);
        puzzleRooms = dividePlayers(puzzlePlayers, curLevel);
    }*/
    
    
    for (let i = 0; i < puzzleRooms.length; i++) {
        puzzleRooms[i].puzzleOptions = generatePuzzle2(puzzleRooms[i]);
        for (let j = 0; j < puzzleRooms[i].puzzleOptions.cultures.length; j++) {
            puzzleRooms[i].realtimePoints.push(0); // init the real time bucket points array
        }
    }
    curLevel += 1;
}

function generatePuzzle(room) {
    let cultures = [...options.cultures];
    let playerIds = Object.keys(room.players);
    let puzzleOptions = new PuzzleOptions();
    let playerCount = playerIds.length;
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
        if(playerIds.length !== 0) {
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
        ht.set(players[idList[i]].wheelInfo.ethnicity, players[idList[i]]);
    }
    return ht;
}

function generateFirstGroup(ht, players){
    let playerList = ht.get_table();
    let idList = Object.keys(players);
    let groupNumber = idList.length / 2;
    let firstGroup;
    if(groupNumber < 1){
      firstGroup = new Array(1);
    }
    else{
      firstGroup = new Array(Math.floor(groupNumber));
    }
    for(let i = 0; i < firstGroup.length; i++){
        if(i === 0 && (idList.length % 2 !== 0)){
            firstGroup[i] = new Array();
        }
        else{
            firstGroup[i] = new Array();
        }
    }

    let k = 0;
    for(let i = 0; i < 2; i++){
        for(let j = 0; j < firstGroup.length; j++){
            firstGroup[j].push(playerList[k]);
            k++;
        }
    }

    if(idList.length % 2 !== 0){
        firstGroup[0].push(playerList[k]);
    }
    console.log(firstGroup);
    return firstGroup;
}

function queue(firstGroup, checklist, n){
    n = n / 2;
    var intervalId = window.setInteravl(function(){
        let group = new Array();
        while(checklist.length >= n){
            let i = 0;
            for(let j = 0; j < n; j++){
                group[i][j] = firstGroup[checklist[j]];
                checklist = checklist.slice(1);
            }
            i++;
        }
        return group;
    }, 5000)
}

function generateGroups(firstGroup, n){
    if(n === 2)  {
      return firstGroup;
    }

    n = n / 2;
    let len = Math.floor(firstGroup.length / n);
    let group = new Array(len);
    for (let i = 0; i < len; i++) {
      group[i] = new Array();
    }
    let num = 0;
    for (let k = n; k > 0; k--) {
        for(let i = 0; i < len; i++){
            for(let j = 0; j < firstGroup[num].length; j++){
               // console.log(`i: ${i}, j: ${j}, num: ${num}, n: ${n}, len: ${len}, `);
                group[i].push(firstGroup[num][j]);
                //console.log(`l: ${group.length}, l1: ${group[i].length}`);
            }
            num++;
        }
    }
    console.log(num);
    console.log(n);
    console.log(firstGroup.length);
    //if(firstGroup.length % n !== 0){
    if(firstGroup.length - num <= (n/2)){
      for(let i = 0; num+i < firstGroup.length; i++){
        //group[(i+1) % group.length] = group[(i+1) % group.length].concat(firstGroup[num+i]);
        for(let j = 0; j < firstGroup[num+i].length; j++){
                console.log(`i: ${i}, j: ${j}, num: ${num}, n: ${n}, len: ${len}, `);
                group[(i+1) % group.length].push(firstGroup[num+i][j]);
                //console.log(`l: ${group.length}, l1: ${group[i].length}`);
            }
      }
    }
    else{
      group.push(new Array());
      for(let i = 0; num+i < firstGroup.length; i++){
        //group[group.length-1] = group[group.length-1].concat(firstGroup[num+i]);
        for(let j = 0; j < firstGroup[num+i].length; j++){
                //console.log(`i: ${i}, j: ${j}, num: ${num}, n: ${n}, len: ${len}, `);
                group[group.length-1].push(firstGroup[num+i][j]);
                //console.log(`l: ${group.length}, l1: ${group[i].length}`);
            }
      }
    }
   //}
    console.log(group);
    return group;
}

function dividePlayers(players, index) {
    let rooms = [];
    let maxPlayers = options.roomMaxPlayers[index]
    let idList = Object.keys(players);
    // use floor or ceil to decide either append extra players or set a new room
    let roomCount = Math.ceil(idList.length / maxPlayers);
    for (let i = 0; i < roomCount; i++) {
        rooms.push(new Room(i));
    }
    for (let i = 0; i < idList.length; i++) {
        let roomNumber = Math.floor(i / maxPlayers);
        rooms[roomNumber].players[idList[i]] = players[idList[i]];
    }
    return rooms;   
} 

function analyzeData(idList, cultures) {
    let data = {};
    let values = [];
    let cultureNum = cultures.length;
    for (let i = 0; i < idList.length; i++) {
        let info;
        if (curLevel === 0) {
          info = lobbyPlayers[idList[i]].wheelInfo;
        } else {
          info = puzzlePlayers[idList[i]].wheelInfo;
        }
        
        for (let j = 0; j < cultureNum; j++) {
            let culture = cultures[j];
            let value = info[culture];
            if (value == "PreferNotToSay" || value == "⊘") continue;
            if (values.includes(value)) {
                data[value].point += 1;
                data[value].ids.push(idList[i]); 
            } else {
                values.push(value);
                data[value] = new DataEntry(culture, value, 1);
                data[value].ids.push(idList[i]);
            }
        }
    }
    return data;
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

function checkSolved(room) {
    for (let i = 0; i < room.puzzleOptions.cultures.length; i++) {
        if (room.realtimePoints[i] !== room.puzzleOptions.points[i]) {
            io.to("Room" + room.id).emit("notSolved");
            return false;
        }
    }
    io.to("Room" + room.id).emit("solved");
}

function getRandom(arr, n) {
    var result = new Array(),
        others = new Array(),
        takenInd = new Set(),
        len = arr.length,
        taken = new Array(n);

    if (n > len)
        throw new RangeError("getRandom: more elements taken than available");
    while (n--) {
        var x = Math.floor(Math.random() * len);
        //result[n] = arr[x in taken ? taken[x] : x];
        takenInd.add(x in taken ? taken[x] : x)
        taken[x] = --len in taken ? taken[len] : len;

    }
    for (let i = 0; i < arr.length; i++) {
        if (takenInd.has(i)) {
            result.push(arr[i])
        } else {
            others.push(arr[i])
        }
    }
    return {
        result: result,
        others: others
    };
}

function generatePuzzle2(room) {
    let cultures = [...options.cultures];
    let playerIds = Object.keys(room.players);
    let puzzleOptions = new PuzzleOptions();
    let playerCount = playerIds.length;
    let uniqueCount = Math.floor(playerCount / 2);
    let sameCount = playerCount - uniqueCount;

    let samples = getRandom(playerIds, uniqueCount)
    //console.log(samples)
    let uniquePlayerIds = samples.result
    let commonPlayerIds = samples.others
    let data = analyzeData(playerIds, cultures);

    let usedAspectIndices = new Set();
    let players = curLevel === 0? lobbyPlayers: puzzlePlayers; 
    data = sortData(data)
    for (let k = data.length-1; k >= 0 && commonPlayerIds.length > 0; k--) {
        if (usedAspectIndices.has(cultures.indexOf(data[k].culture))) {
            continue;
        }

        let pNum = 0;
        let i = 0;
        while (i < commonPlayerIds.length) {
            if (players[commonPlayerIds[i]].wheelInfo[data[k].culture] == data[k].value) {
                pNum += 1;
                commonPlayerIds.splice(i, 1);
            } else {
                i++
            } 
        }
        if (pNum <= 0) continue;
        puzzleOptions.cultures.push(data[k].culture)
        puzzleOptions.values.push(data[k].value)
        puzzleOptions.points.push(pNum)
        usedAspectIndices.add(cultures.indexOf(data[k].culture))
    }


    let aspectCounts = new Array(cultures.length).fill(0);
    for (var i = 0; i < aspectCounts.length; i++) {
        uniquePlayerIds.forEach(id => {
            if (players[id].importantAspectIndices.includes(i)) { // && importantAspect not used
                aspectCounts[i] += 1;
            }
        })
    }
   
  

    uniquePlayerIds.forEach(id => {
        let players = curLevel === 0? lobbyPlayers: puzzlePlayers;  
        let player = players[id]
        player.importantAspectIndices.sort((i, j) => aspectCounts[j] - aspectCounts[i])
        let selectedAspectInd = 0
        while (selectedAspectInd < player.importantAspectIndices.length && usedAspectIndices.has(selectedAspectInd)) {
            selectedAspectInd++
        }
        if (selectedAspectInd == player.importantAspectIndices.length) {
            // throw new Error(`Can't find unused culture aspect for unique player ${id}`)
            //return; // skip to next element
            let randLitAspect = cultures[Math.floor(Math.random() * 3)]
            puzzleOptions.cultures.push(randLitAspect)
            puzzleOptions.values.push(player.wheelInfo[randLitAspect])
            puzzleOptions.points.push(1)
            return;
        }
        player.importantAspectIndices.splice(player.importantAspectIndices.indexOf(selectedAspectInd), 1)
        usedAspectIndices.add(selectedAspectInd)

        puzzleOptions.cultures.push(cultures[selectedAspectInd])
        puzzleOptions.values.push(player.wheelInfo[cultures[selectedAspectInd]])
        puzzleOptions.points.push(1)
    })

    /*commonPlayerIds.forEach(id => {
        let player = lobbyPlayers[id]
        let info = player.wheelInfo;
        let commonAspectIndics = [...Array(cultures.length).keys()]
        console.log(info)
        console.log(data)
        commonAspectIndics.sort((i, j) => data[info[cultures[j]]].points - data[info[cultures[i]]].points)
        let selectedAspectInd = 0
        while (selectedAspectInd < commonAspectIndics.length && usedAspectIndices.has(selectedAspectInd)) {
            selectedAspectInd++
        }
        if (selectedAspectInd == commonAspectIndics.length) {
            throw new Error(`Can't find unused culture aspect for common player ${id}`)
        }
        usedAspectIndices.add(selectedAspectInd)
        puzzleOptions.cultures.push(cultures[selectedAspectInd])
        puzzleOptions.values.push(info[cultures[selectedAspectInd]])
        puzzleOptions.points.push(1)
    });*/
    
    for (var i = 0; i != puzzleOptions.values.length - 1; i++) {
        let j = i + 1;
        while (j < puzzleOptions.values.length) {
            if (puzzleOptions.values[i] == puzzleOptions.values[j]) {
                puzzleOptions.points[i] += puzzleOptions.points[j];
                puzzleOptions.cultures.splice(j, 1)
                puzzleOptions.values.splice(j, 1)
                puzzleOptions.points.splice(j, 1)
            }
            else j++;
        }
    }
    return puzzleOptions;
}

io.sockets.on('connection', function(socket) {
    console.log('A user has logged in');

    socket.on ('init', function (data) {
        socket.phase = data.phase;
        socket.clientType = data.clientType;
        var newPlayer;
        console.log("Phase is " + data.phase);
        console.log("uuid is: " + data.uuid);
        if (data.uuid === null) {
            // Creates a new player object with a unique ID number.
            let uuid = uuidGen();
            data.uuid = uuid;
            socket.uuid = uuid;
            socket.emit("uuid", uuid);
            newPlayer = new Player(uuid, data.info, data.scores);
        } else {
            if (goneLobbyPlayers[data.uuid] === undefined) {
                console.log("no player found, should be dubugging");
                newPlayer = new Player(data.uuid, data.info, data.scores);
                goneLobbyPlayers[data.uuid] = newPlayer;
            }
            newPlayer = goneLobbyPlayers[data.uuid];
            socket.uuid = data.uuid;
        }
        newPlayer.sid = socket.id;
      

        socket.roomNumber = data.roomNumber; // roomNumber can be null
        console.log(socket.roomNumber); 
        if (socket.roomNumber !== null) { 
            socket.join("Room" + socket.roomNumber);
        }
        // Adds the newly created player to the array according to its phase state.
        // Sends the connecting client his unique ID, and data about the other players already connected.
        // Sends everyone except the connecting player data about the new player.
        if(socket.phase === 0) { 
          
 
            lobbyPlayers[data.uuid] = newPlayer;
            delete goneLobbyPlayers[data.uuid];

            socket.emit('playerData', {uuid: data.uuid, players: lobbyPlayers});
            socket.join("lobby");
            socket.to("lobby").emit("playerJoined", newPlayer)
        } else {
            puzzlePlayers[data.uuid] = newPlayer;
            let players = puzzleRooms[data.roomNumber].players;
            players[data.uuid] = newPlayer;
            socket.emit('playerData', {uuid: data.uuid, players: players});
            socket.join("Room"+data.roomNumber);
            socket.to("Room"+data.roomNumber).emit("playerJoined", newPlayer)
        }
 
        socket.on('disconnect',function(){
            if (socket.phase === 0) { 
                if(!lobbyPlayers[socket.uuid]) return;
                // Update clients with the new player killed
                goneLobbyPlayers[socket.uuid] = lobbyPlayers[socket.uuid];
                delete lobbyPlayers[socket.uuid];
                socket.to("lobby").emit('playerLeft', socket.uuid);
            } else {
                gonePuzzlePlayers[socket.uuid] = puzzlePlayers[socket.uuid];
                if (socket.roomNumber < puzzleRooms.length) {
                  let puzzleOptions = puzzleRooms[socket.roomNumber].puzzleOptions;
                  let players = puzzleRooms[socket.roomNumber].players;
                  if(socket.uuid === undefined || !players[socket.uuid]) return;
                  delete players[socket.uuid];
                }


                // Update clients with the new player killed
                /*
                if(players[socket.uuid].wheelInfo[puzzleOptions.cultures[data.index]] === puzzleOptions.values[data.index]) {
                    puzzleRooms[socket.roomNumber].realtimePoints[data.index] -= 1;
                    checkSolved(puzzleRooms[socket.roomNumber]);
                }
                */
                socket.to("Room" + socket.roomNumber).emit('playerLeft', socket.uuid);
                
                delete puzzlePlayers[socket.uuid];
                
            }
        });
    });

    socket.on ('positionUpdate', function (data) {
        let id = data.uuid;
        if(socket.phase === 0) {
            if(!lobbyPlayers[id]) return;
            lobbyPlayers[id].x = data.x;
            lobbyPlayers[id].y = data.y;
            socket.to("lobby").emit('playerMoved', data);
        } else if (socket.phase === 1) {
            if (socket.roomNumber < puzzleRooms.length) {
                let players = puzzleRooms[socket.roomNumber].players;
                if(!players[id]) return;
                players[id].x = data.x;
                players[id].y = data.y;
                socket.to("Room" + socket.roomNumber).emit('playerMoved', data);
            }

        } else {
            socket.emit("reconnect");
        };
    }); 



    socket.on('startPuzzle', function() {
        console.log("Puzzle Started");
        initPuzzles();
        console.log("init finished");
        console.log(puzzleRooms);
        for (let i = 0; i < puzzleRooms.length; i++) {
            let players = puzzleRooms[i].players;
            let idList = Object.keys(players);
            for (let j = 0; j < idList.length; j++) {
                io.to(players[idList[j]].sid).emit("startPuzzle", puzzleRooms[i].puzzleOptions, i)
            }
        }
    });

    socket.on("admin", function() {
        console.log("deleting bigscreen player");
        delete lobbyPlayers[socket.uuid];
        socket.to("lobby").emit('playerLeft',socket.uuid);
    });

    socket.on ("bucketIn", (data) => {
        if (socket.roomNumber !== undefined) {
            let puzzleOptions = puzzleRooms[socket.roomNumber].puzzleOptions;
            let players = puzzleRooms[socket.roomNumber].players;
            if(players[socket.uuid].wheelInfo[puzzleOptions.cultures[data.index]] === puzzleOptions.values[data.index]) {
                puzzleRooms[socket.roomNumber].realtimePoints[data.index] += 1;
                io.to("Room" + socket.roomNumber).emit("addPoint", data.index);
                checkSolved(puzzleRooms[socket.roomNumber]);
            }
        } else { 
            console.log("Someone dropped off after connection, need reconnect");
        }

    });

    socket.on ("bucketOut", (data) => { 
        if (socket.roomNumber !== undefined) {
            let puzzleOptions = puzzleRooms[socket.roomNumber].puzzleOptions;
            let players = puzzleRooms[socket.roomNumber].players;
            if(players[socket.uuid].wheelInfo[puzzleOptions.cultures[data.index]] === puzzleOptions.values[data.index]) {
                puzzleRooms[socket.roomNumber].realtimePoints[data.index] -= 1;
                io.to("Room" + socket.roomNumber).emit("subPoint", data.index);
                checkSolved(puzzleRooms[socket.roomNumber]);
            }
        } else {
            console.log("Someone dropped off after connection, need reconnect");
        }
    });
  
    socket.on ("thumbUp", (uuid) => {
      console.log(socket.roomNumber);
      if (socket.roomNumber !== null) {
          socket.to("Room" + socket.roomNumber).emit("thumbUp", uuid);
      } else {
          console.log("thumbUp received" + uuid);
          socket.to("lobby").emit("thumbUp", uuid);
      }
    })
});

/*for (var i = 0; i < 10; i++) {
  let id = uuidGen();
  let a = new Array(options.cultures.length)
  lobbyPlayers[id] = new Player(
    id,
    {
      'music': '123',
      'food': '22324',
      'hobby': '1321342',
      'ethnicity': '1231423',
      'finance': '12314134',
      'location': '123141341'
    },
    a.map(() => Math.round(Math.random() * 5))
  )
}*/

console.log ('Server started');
server.listen(6000);
