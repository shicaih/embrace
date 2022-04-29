let socket = io.connect(`${config.server.url.replace(/\/+$/, '')}:${config.server.port}`);
const colorMap = {
    music: '#cc3f8d',
    food: '#d15947',
    hobby: '#c7873e',
    finances: '#34a359',
    home: '#5482cc',
    ethnicity: '#7755b5',
  }
let largestFontSize = 64;
let smallestFontSize = 20;
socket.emit("initBigscreenReport");

socket.on("bigscreenReport", (data) => {
  let entries = Object.entries(data)
  let wordclouds = document.getElementsByClassName('wordcloud');
  for (let i = 0; i < 6; i++) {
    let cul = entries[i][0]
    let freq = entries[i][1]
    console.log(freq)
    let arr = Object.entries(freq)
    let brr = arr.map(x => x[1])
    let max = Math.max(...brr)
    let min = Math.min(...brr)
    let m = (largestFontSize - smallestFontSize) / (max - min)
    arr = arr.map(x => [x[0], smallestFontSize + (x[1]-min) * m])
    console.log(brr)
    WordCloud(wordclouds[i], { 
      list: arr,
      drawOutOfBound: false,
      minSize: 4,
      //weightFactor: largestFontSize / Math.max(...brr),
      //shrinkToFit: true,
      rotateRatio: 0,
      ellipticity: 0.5,
      //origin: [512, 384]
      gridSize: 30,
      color: colorMap[cul],
      backgroundColor: "#00000000",
      classes: "word",
    });

    wordclouds[i].addEventListener('wordclouddrawn', async () => {

      let arr = Array.from(wordclouds[i].querySelectorAll('.word'))
      console.log(wordclouds[i].querySelectorAll('.word'))
      for (let i = 0; i < arr.length; i++) {
        arr[i].style.transform = 'translate(-5px)'
      }
      for (let i = 0; i < arr.length; i++) {
          await new Promise(r => setTimeout(r, 200));
          arr[i].style.animationName = 'example'
      }
    }, false);
  }
})