let socket = io.connect(`${config.server.url.replace(/\/+$/, '')}:${config.server.port}`);

let largestFontSize = 64;
let smallestFontSize = 20;
socket.emit("initBigscreenReport");

socket.on("bigscreenReport", (freq) => {
  console.log(freq)
  let arr = Object.entries(freq)
  let brr = arr.map(x => x[1])
  let max = Math.max(...brr)
  let min = Math.min(...brr)
  let m = (largestFontSize - smallestFontSize) / (max - min)
  arr = arr.map(x => [x[0], smallestFontSize + (x[1]-min) * m])
  console.log(brr)
  WordCloud(document.getElementById('wordcloud'), { 
    list: arr,
    drawOutOfBound: false,
    minSize: 4,
    //weightFactor: largestFontSize / Math.max(...brr),
    //shrinkToFit: true,
    rotateRatio: 0,
    ellipticity: 0.5,
    //origin: [512, 384]
    gridSize: 30,
    color: "#372B24",
    backgroundColor: "#00000000",
    classes: "word",
  });
})