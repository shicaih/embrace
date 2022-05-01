let socket = io.connect(`${config.server.url.replace(/\/+$/, '')}:${config.server.port}`);
const colorMap = {
    music: '#cc3f8d',
    food: '#d15947',
    hobby: '#c7873e',
    finances: '#34a359',
    home: '#5482cc',
    ethnicity: '#7755b5',
  }
const cultures = ['music', 'food', 'hobby', 'finances', 'home', 'ethnicity'];
const colors = ['#cc3f8d', '#d15947', '#c7873e', '#34a359', '#5482cc', '#7755b5'];
let largestFontSize = 72;
let smallestFontSize = 32;

let wordclouds = Array.from(document.getElementsByClassName('wordcloud'));
let buttons = Array.from(document.getElementsByClassName('button'));
buttons.forEach((e, i) => {
  e.onclick = () => {
    wordclouds.forEach((e, j) => {
      e.style.display = 'none'
    })
    buttons.forEach((e, j) => {
      e.classList.remove(`cls-${j}-selected`)
      e.classList.add(`cls-${j}-idle`)
    })
    buttons[i].classList.add(`cls-${i}-selected`)
    buttons[i].classList.remove(`cls-${i}-idle`)
    wordclouds[i].style.display = 'block'
  }
})


socket.emit("initBigscreenReport");

socket.on("bigscreenReport", (data) => {
  let entries = Object.entries(data)
  let wordclouds = document.getElementsByClassName('wordcloud');
  entries.forEach(([cul, freq]) => {
    let index = cultures.indexOf(cul)
    console.log(freq)
    let arr = Object.entries(freq)
    let brr = arr.map(x => x[1])
    let max = Math.max(...brr)
    let min = Math.min(...brr)
    let m = (largestFontSize - smallestFontSize) / (max - min)
    arr = arr.map(x => [x[0], smallestFontSize + (x[1]-min) * m])
    console.log(brr)
    WordCloud(wordclouds[index], { 
      list: arr,
      drawOutOfBound: false,
      minSize: 4,
      //weightFactor: largestFontSize / Math.max(...brr),
      //shrinkToFit: true,
      rotateRatio: 0,
      ellipticity: 0.5,
      //origin: [512, 384]
      gridSize: 30,
      color: colors[index],
      backgroundColor: "#00000000",
      classes: `word word${index}`,
      fontFamily: ['Nunito', 'sans-serif']
    });
 
    wordclouds[index].addEventListener('wordclouddrawn', async () => {
      if (index != 0) wordclouds[index].style.display = 'none';
      let arr = Array.from(wordclouds[index].querySelectorAll('.word'))
      console.log(wordclouds[index].querySelectorAll('.word'))
      for (let j = 0; j < arr.length; j++) {
        arr[j].style.transform = 'translateY(-2.5px)'
        arr[j].style.width = 'fit-content'
      }
      for (let j = 0; j < arr.length; j++) {
          await new Promise(r => setTimeout(r, 200));
          arr[j].style.animationName = 'example'
      }
    }, false);
  })
})