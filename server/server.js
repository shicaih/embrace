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
    levelTime: [60, 60, 90, 90], // seconds
    nLevel: 4
};
// an object containing all the lobby players. key: uuid, value: Player object
var lobbyPlayers = {};
var goneLobbyPlayers = {};
// an object containing all the puzzle players. key: uuid, value: Player object
var puzzlePlayers = {};
var gonePuzzlePlayers = {};
var activePlayers = {};
var lobbyRooms = [{}];
// an array of all the Room objects. Array index is the id of Room.
var puzzleRooms = [];
var roomSolved = [];
var ht = null;
var firstGroup = null;
var curLevel = -1;
var posIndex = 0; 
var bigscreenSid = null;
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
    this.playerReport = new PersonalReportData()
    this.teammates = new Set();
    this.thumbsToPlayers = new Set();
    this.thumbsFromPlayers = new Set();
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
    this.expectedPlayerIds = []; // 2D array
}

function PersonalReportData () {
  // personal
  this.nickname = "Jeff"
  this.nPlayerMet = 123
  this.nTeammate = 123
  this.timeSpentMin = 3 // min
  this.timeSpentSec = 26 // sec
  this.nPuzzlesSolved = 123
  this.speedRank = 9 //top n%
  this.nThumbToOthers = 17 //gave thumb-up to n different players
  this.nThumbFromOthers = 8 // recieved thumb-up from n different players
  this.nMutualThumb = 5 // had mutual thumb-up with 3 different players
  
  // location
  this.location = "Asia" 
  this.nPlayerSameLocation = 5
  this.locationIsImportant = true
  this.nPlayerLocationImportant = 23
  this.importantLocationExamples = ["Asia", "Europe", "Texas"]
  this.nImportantLocations = 10 // players who think their locations are important are from n different places
  
  // ethnicity
  this.ethnicityIsImportant= true
  this.nPlayerEthnicityImportant = 20
  this.importantEthnicityExamples = ["East Asian", "Caucasian", "African"]
  this.nImportantEthnicities = 3 // players who think their ethnicities are important are from n different ethnicities
  
  // music
  this.music = "Jazz", 
  this.nPlayerSameMusic = 0 // n "other" playeres also enjoy the same music
  this.nSameMusicLocation = 3 // players from n countries also enjoy the same music
  this.multiMusicLocation = true
  this.sameMusicLocationExamples = ["Asia", "Europe", "Texas"] // if nPlayerSameMusic is 0, this should be an array containing only the player's location
  
  //
  this.food = "Japanese"
  this.nPlayerSameFood = 8  // n "other" playeres also enjoy the same food
  this.nSameFoodLocation = 3 // players from n countries also enjoy the same music
  this.multiFoodLocation = false
  this.sameFoodLocationExamples = ["Asia", "Europe", "Texas"] // if nPlayerSameFood is 0, this should be an array containing only the player's location
}

let globalReportData = {
  // global
  nPlayer: 0,
  nCountries: 5,
  nStates: 20,
  nEthnicity: 8,
  nCountriesStates: 999,
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

function initPuzzles() {
    activePlayers = {};
    let idList = Object.keys(lobbyPlayers);
    for (let i = 0; i < idList.length; i++) {
      activePlayers[idList[i]] = lobbyPlayers[idList[i]];
    }
    idList = Object.keys(puzzlePlayers);
    for (let i = 0; i < idList.length; i++) {
      activePlayers[idList[i]] = puzzlePlayers[idList[i]];
    }
    ht = generateHash(activePlayers);
    firstGroup = generateFirstGroup(ht, activePlayers);
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
    //if(firstGroup.length % n !== 0){
    if(firstGroup.length - num <= (n/2) && group.length != 0){
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
        info = activePlayers[idList[i]].wheelInfo;
        
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
    if (!roomSolved.includes(room.id)) {
      roomSolved.push(room.id);
      io.to(bigscreenSid).emit("roomStateUpdate", roomSolved.length, puzzleRooms.length, false);
    }
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
    let players = activePlayers; 
    data = sortData(data)
    for (let k = data.length-1; k >= 0 && commonPlayerIds.length > 0; k--) {
        if (usedAspectIndices.has(cultures.indexOf(data[k].culture))) {
            continue;
        }

        let pNum = 0;
        let i = 0;
        let expectedPlayerIds = [];
        while (i < commonPlayerIds.length) {
            if (players[commonPlayerIds[i]].wheelInfo[data[k].culture] == data[k].value) {
                pNum += 1;
                expectedPlayerIds.push(commonPlayerIds[i])
                commonPlayerIds.splice(i, 1);
            } else {
                i++
            } 
        }
        if (pNum <= 0) continue;
        puzzleOptions.cultures.push(data[k].culture)
        puzzleOptions.values.push(data[k].value)
        puzzleOptions.points.push(pNum)
        puzzleOptions.expectedPlayerIds.push(expectedPlayerIds)
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
        //let players = curLevel === 0? lobbyPlayers: puzzlePlayers;  
        let players = activePlayers;
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
        puzzleOptions.expectedPlayerIds.push(new Array(id))
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

function generateReportData() {
  globalReportData.nPlayer = Object.keys(gonePuzzlePlayers).length;
  globalReportData.nCountries = 0
  globalReportData.nStates = 20
  globalReportData.nCountriesStates = 999
  globalReportData.nEthnicity = 8
  
  
  
  let importantLocations = [], importantEthnicities = []
  let nPlayerLocationImportant = 0, nPlayerEthnicityImportant = 0;
  let importantLocationFreq = {}, importantEthnicityFreq = {};
  let locationFrequency = {}, ethnicityFrequency = {}, foodToLocation = {}, musicToLocation = {};
  
  for (let playerId in puzzlePlayers) {
    let player = puzzlePlayers[playerId]
    locationFrequency[player.wheelInfo['home']] = 1 + (locationFrequency[player.wheelInfo['home']] || 0)
    ethnicityFrequency[player.wheelInfo['ethnicity']] = 1 + (ethnicityFrequency[player.wheelInfo['ethnicity']] || 0)
    
    if (musicToLocation[player.wheelInfo['music']]) {
      musicToLocation[player.wheelInfo['music']].push(player.wheelInfo['home'])
    } else {
      musicToLocation[player.wheelInfo['music']] = [player.wheelInfo['home']]
    }
    if (foodToLocation[player.wheelInfo['food']]) {
      foodToLocation[player.wheelInfo['food']].push(player.wheelInfo['home'])
    } else {
      foodToLocation[player.wheelInfo['food']] = [player.wheelInfo['home']]
    }
    
    nPlayerLocationImportant += player.scores[4] > 3 ? 1 : 0
    nPlayerEthnicityImportant += player.scores[5] > 3 ? 1 : 0
    
    if (player.scores[4] > 3) importantLocationFreq[player.wheelInfo['home']] = (importantLocationFreq[player.wheelInfo['home']] || 0) + 1;
    if (player.scores[5] > 3) importantEthnicityFreq[player.wheelInfo['ethnicity']] = (importantEthnicityFreq[player.wheelInfo['ethnicity']] || 0) + 1;
  }
  
  globalReportData.nEthnicity = Object.keys(ethnicityFrequency).length - 1
  globalReportData.nCountriesStates = Object.keys(locationFrequency).length
  
  importantLocations = Object.entries(importantLocationFreq).map(([key, value]) => key)
  importantEthnicities = Object.entries(importantEthnicityFreq).map(([key, value]) => key)
  
  for (let music in musicToLocation) {
    musicToLocation[music] = Array.from(new Set(musicToLocation[music]))
  }
  for (let food in foodToLocation) {
    foodToLocation[food] = Array.from(new Set(foodToLocation[food]))
  }
  
  for (let playerId in puzzlePlayers) {
    let player = puzzlePlayers[playerId]
    let data = player.playerReport
    data.nTeammate = player.teammates.size
    data.nThumbToOthers = player.thumbsToPlayers.size
    data.nThumbFromOthers = player.thumbsFromPlayers.size
    data.nMutualThumb = [...player.thumbsToPlayers].filter(x => player.thumbsFromPlayers.has(x)).length
    data.location = player.wheelInfo['home']
    data.nPlayerSameLocation = locationFrequency[player.wheelInfo['home']] - 1
    data.locationIsImportant = player.scores[4] > 3
    data.nPlayerLocationImportant = nPlayerLocationImportant - (data.locationIsImportant ? 1 : 0)
  
    let othersImportantLocationFreq = Object.assign({}, importantLocationFreq)
    if (data.locationIsImportant) othersImportantLocationFreq[player.wheelInfo['home']] -= 1
    data.importantLocationExamples = Object.keys(othersImportantLocationFreq)
    data.nImportantLocations = data.importantLocationExamples.length
    data.importantLocationExamples = data.importantLocationExamples.slice(0, 3)
     
      
    data.ethnicityIsImportant = player.scores[5] > 3
    data.nPlayerEthnicityImportant = nPlayerEthnicityImportant - (data.ethnicityIsImportant ? 1 : 0)
      
    let othersImportantEthnicityFreq = Object.assign({}, importantEthnicityFreq)
    if (data.ethnicityIsImportant) othersImportantEthnicityFreq[player.wheelInfo['ethnicity']] -= 1
    data.importantEthnicityExamples = Object.keys(othersImportantEthnicityFreq)
    data.nImportantEthnicities = data.importantEthnicityExamples.length
    data.importantEthnicityExamples = data.importantEthnicityExamples.slice(0, 3)
    
    data.music = player.wheelInfo['music']
    data.nPlayerSameMusic = musicToLocation[data.music].length - 1
    let musicLocationTypes = musicToLocation[data.music].map(x=>x)
    data.multiMusicLocation = musicLocationTypes.length > 1
    musicLocationTypes.splice(musicLocationTypes.indexOf(data.location), 1)
    data.sameMusicLocationExamples = musicLocationTypes.slice(0, 3)
    
    data.food = player.wheelInfo['food']
    data.nPlayerSameFood = foodToLocation[data.food].length - 1
    let foodLocationTypes = foodToLocation[data.food].map(x=>x)
    data.multiFoodLocation = foodLocationTypes.length > 1
    foodLocationTypes.splice(foodLocationTypes.indexOf(data.location), 1)
    data.sameFoodLocationExamples = foodLocationTypes.slice(0, 3)
    console.log(puzzlePlayers[playerId])
  } 
} 
  
io.sockets.on('connection', function(socket) {
    console.log('A user has logged in');
    socket.on ('init', function (data) {
        socket.phase = data.phase;
        socket.clientType = data.clientType;
        socket.curLevel = data.curLevel;
        socket.roomNumber = data.roomNumber; // roomNumber can be null
        console.log("phase is " + socket.phase);
        console.log("uuid is: " + data.uuid);
        console.log("curLevel is: " + socket.curLevel);
        console.log("Room number is: " + socket.roomNumber); 
      
        var newPlayer;
        if (data.uuid === null) {
            // Creates a new player object with a unique ID number.
            let uuid = uuidGen();
            data.uuid = uuid;
            socket.uuid = uuid;
            let positionIndex = posIndex % 16;
            posIndex++;
            socket.emit("uuid", uuid, positionIndex);
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
        
        if (socket.phase === 1 && socket.roomNumber !== null) { 
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
        } else if (eval(socket.curLevel) === curLevel) {
            puzzlePlayers[data.uuid] = newPlayer;
            if (socket.roomNumber < puzzleRooms.length) {
              let players = puzzleRooms[data.roomNumber].players;
              players[data.uuid] = newPlayer;
              socket.emit('playerData', {uuid: data.uuid, players: players});
              socket.join("Room"+data.roomNumber);
              socket.to("Room"+data.roomNumber).emit("playerJoined", newPlayer)
            } else {
              socket.emit("reconnect", 0);
            } 
        } else {
          socket.emit("reconnect", 0);
        }
  
        socket.on('disconnect',function(){
            if (socket.phase === 0) { // disconnect in Lobby
                if(!lobbyPlayers[socket.uuid]) return;
                // Update clients with the new player killed
                goneLobbyPlayers[socket.uuid] = lobbyPlayers[socket.uuid];
                delete lobbyPlayers[socket.uuid];
                socket.to("lobby").emit('playerLeft', socket.uuid); 
            } else { // disconnect in Puzzle
                gonePuzzlePlayers[socket.uuid] = puzzlePlayers[socket.uuid];
                if (socket.roomNumber < puzzleRooms.length) {
                  let puzzleOptions = puzzleRooms[socket.roomNumber].puzzleOptions;
                  let players = puzzleRooms[socket.roomNumber].players;
                  if(socket.uuid === undefined || !players[socket.uuid]) return;
                  delete players[socket.uuid];
                }
              
                /* check for bucket points */
                if (socket.inBucket > -1) { 
                  io.to("Room" + socket.roomNumber).emit("subWheel", socket.inBucket);
                  if (socket.roomNumber >= puzzleRooms.length) return;
                  let puzzleOptions = puzzleRooms[socket.roomNumber].puzzleOptions;
                  let players = puzzleRooms[socket.roomNumber].players;
                  if(!players[socket.uuid]) return;
                  if(players[socket.uuid].wheelInfo[puzzleOptions.cultures[socket.inBucket]] === puzzleOptions.values[socket.inBucket]) {
                    puzzleRooms[socket.roomNumber].realtimePoints[socket.inBucket] -= 1;
                    if (puzzleOptions.expectedPlayerIds[socket.inBucket].includes(socket.uuid)) {
                      io.to("Room" + socket.roomNumber).emit("subPoint", socket.inBucket, true);
                      checkSolved(puzzleRooms[socket.roomNumber]);
                    } else {
                      io.to("Room" + socket.roomNumber).emit("subPoint", socket.inBucket, false);
                    }
                  }
                }
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
            socket.emit("reconnect", 1);
        };
    }); 



    socket.on('startPuzzle', function() {
        curLevel += 1;
        if (curLevel == options.roomMaxPlayers.length) {
            generateReportData();
            puzzleRooms.forEach(room => {
              for (let playerID in room.players) {
                io.to(room.players[playerID].sid).emit("startReport")
              }
            })
            return;
        }
        console.log("Puzzle Started");
        initPuzzles();
        console.log("init finished");
        for (let i = 0; i < puzzleRooms.length; i++) {
            let players = puzzleRooms[i].players;
            let idList = Object.keys(players);
            for (let j = 0; j < idList.length; j++) {
                for (let k = j+1; k < idList.length; k++) {
                    players[idList[j]].teammates.add(idList[k])
                    players[idList[k]].teammates.add(idList[j])
                }
                io.to(players[idList[j]].sid).emit("startPuzzle", puzzleRooms[i].puzzleOptions, i, curLevel, options.levelTime[curLevel])
            }
        }
        io.to(bigscreenSid).emit("roomStateUpdate", roomSolved.length, puzzleRooms.length, true, options.levelTime[curLevel]);
        
    });
   
    socket.on("timeUp", () => {
      for (let i = 0; i < puzzleRooms.length; i++) {
        io.to("Room" + i).emit("timeUp");
      }
    })
  
    socket.on("timeUpdate", (time) => {
      for (let i = 0; i < puzzleRooms.length; i++) {
        io.to("Room" + i).emit("timeUpdate", time);
      }
    })
    socket.on('startIns', () => {
      console.log("Instruction Started");
      io.to('lobby').emit('startIns');
    })

    socket.on("admin", function() { 
        bigscreenSid = socket.id;
        console.log("deleting bigscreen player");
        delete lobbyPlayers[socket.uuid];
        socket.to("lobby").emit('playerLeft',socket.uuid);
    });

    socket.on ("bucketIn", (data) => {   
        if (socket.roomNumber !== undefined) {
            socket.inBucket = data.index;
            io.to("Room" + socket.roomNumber).emit("addWheel", data.index);
            let puzzleOptions = puzzleRooms[socket.roomNumber].puzzleOptions;
            let players = puzzleRooms[socket.roomNumber].players;
            if(players[socket.uuid].wheelInfo[puzzleOptions.cultures[data.index]] === puzzleOptions.values[data.index]) {
                puzzleRooms[socket.roomNumber].realtimePoints[data.index] += 1;
                if (puzzleOptions.expectedPlayerIds[data.index] === undefined) {
                  return null;
                }
                if (puzzleOptions.expectedPlayerIds[data.index].includes(socket.uuid)) {
                  io.to("Room" + socket.roomNumber).emit("addPoint", data.index, true);
                  checkSolved(puzzleRooms[socket.roomNumber]);
                } else {
                  io.to("Room" + socket.roomNumber).emit("addPoint", data.index, false);
                }
            } 
        } else { 
            console.log("Someone dropped off after connection, need reconnect");
        }  

    });  

    socket.on ("bucketOut", (data) => {       
        if (socket.roomNumber !== undefined) {
            socket.inBucket = -1;
            io.to("Room" + socket.roomNumber).emit("subWheel", data.index);
            let puzzleOptions = puzzleRooms[socket.roomNumber].puzzleOptions;
            let players = puzzleRooms[socket.roomNumber].players;
            if(players[socket.uuid].wheelInfo[puzzleOptions.cultures[data.index]] === puzzleOptions.values[data.index]) {
                puzzleRooms[socket.roomNumber].realtimePoints[data.index] -= 1;
                if (puzzleOptions.expectedPlayerIds[data.index].includes(socket.uuid)) {
                  io.to("Room" + socket.roomNumber).emit("subPoint", data.index, true);
                  checkSolved(puzzleRooms[socket.roomNumber]);
                } else {
                  io.to("Room" + socket.roomNumber).emit("subPoint", data.index, false);
                }
            }
        } else { 
            console.log("Someone dropped off after connection, need reconnect");
        }
    });  
  
    socket.on ("thumbUp", (uuid) => {
      console.log(socket.roomNumber);
      if (socket.roomNumber !== null && socket.phase === 1) {
          socket.to("Room" + socket.roomNumber).emit("thumbUp", uuid);
          for (let playerId in puzzleRooms[socket.roomNumber].players) {
            if (playerId === uuid) continue;
            puzzlePlayers[playerId].thumbsFromPlayers.add(uuid)
            puzzlePlayers[uuid].thumbsToPlayers.add(playerId)
          }
          //console.log(`player[${uuid}] gave thumbs to ${puzzlePlayers[uuid].thumbsToPlayers.size} players`)
      } else {
          console.log("thumbUp received" + uuid);
          socket.to("lobby").emit("thumbUp", uuid);
          for (let playerId in lobbyPlayers) {
            if (playerId === uuid) continue;
            lobbyPlayers[playerId].thumbsFromPlayers.add(uuid)
            lobbyPlayers[uuid].thumbsToPlayers.add(playerId)
          }
          //console.log(`player[${uuid}] gave thumbs to ${lobbyPlayers[uuid].thumbsToPlayers.size} players`)
      }
    })
  
    socket.on("initReport", (uuid) => {
      console.log(`accept player: ${uuid}'s report request`);
      socket.emit("playerReport", { 
        ...globalReportData,
        ...gonePuzzlePlayers[uuid].playerReport,
      });  
    })  
}); 

console.log ('Server started');
server.listen(443);