const swiper = new Swiper('.swiper', {
  // Optional parameters
  direction: 'vertical',
  loop: false,
  slidesPerView: 1,
  mousewheel: true,
  // If we need pagination
  pagination: {
    el: '.swiper-pagination',
    //dynamicBullets: true,
    clickable: true,
    
  },

  // Navigation arrows
  navigation: {
    nextEl: '.next',
    prevEl: '.swiper-button-prev',
  },

  // And if we need scrollbar
  scrollbar: {
    el: '.swiper-scrollbar',
  },
  effect: 'slide',
  fadeEffect: {
    crossFade: true
  },
});

let socket = io.connect("https://embrace-lobby-server.glitch.me");


socket.emit("initReport", window.sessionStorage.getItem("uuid"));


//document.getElementById("uuid").innerHTML = sessionStorage.getItem("uuid");

socket.on("playerReport", data => {
    console.log(data)
    document.getElementById("nickname").innerHTML = window.sessionStorage.getItem("name");
    let elements = document.getElementsByClassName("nPlayer")
    Array.from(elements).forEach(e => e.innerHTML = data.nPlayer);
    
    document.getElementById("nPlayerMet").innerHTML = pluralize('folk', data.nPlayerMet, true);
    document.getElementById("nStar").innerHTML = pluralize('Star', data.nStar, true)
    //document.getElementById("nTeammate").innerHTML = data.nTeammate;
    //document.getElementById("timeSpent").innerHTML = `${pluralize('minute', data.timeSpentMin, true)} ${pluralize('second', data.timeSpentSec, true)}`;
    
    //document.getElementById("nPuzzlesSolved").innerHTML = data.nPuzzlesSolved;
    //document.getElementById("nPuzzlesSolvedWord").innerHTML = pluralize('challenge', data.nPuzzlesSolved);
    //document.getElementById("speedRank").innerHTML = `${data.speedRank}%`;
    
    document.getElementById("encouragingPerson").style.display = data.nThumbToOthers > 0 ? "inline" : "none"
    document.getElementById("nThumbToOthers").innerHTML = data.nThumbToOthers;
    document.getElementById("nThumbToOthersWord").innerHTML = pluralize('person', data.nThumbToOthers);
    
    document.getElementById("helpfulPerson").style.display = data.nThumbFromOthers > 0 ? "inline" : "none"
    document.getElementById("alsoHelpful").style.display = data.nThumbToOthers > 0 ? "inline" : "none" 
    document.getElementById("nThumbFromOthers").innerHTML = data.nThumbFromOthers;
    document.getElementById("nThumbFromOthersWord").innerHTML = `${pluralize('person', data.nThumbFromOthers)}`;
    
    document.getElementById("mutualThumb").style.display = data.nMutualThumb > 0 ? "inline" : "none"
    document.getElementById("nMutualThumb").innerHTML = data.nMutualThumb;
    document.getElementById("nMutualThumbWord").innerHTML = `${pluralize('person', data.nMutualThumb)}`;

    document.getElementById("madeFriends").style.display = data.nThumbFromOthers > 0 || data.nThumbToOthers > 0 ? "inline" : "none"
     
    document.getElementById("nCountriesStates").innerHTML = data.nCountriesStates;
    //document.getElementById("nCountries").innerHTML = data.nCountries;
    //document.getElementById("nStates").innerHTML = data.nStates;
    document.getElementById("nPlayerSameLocation").innerHTML = data.nPlayerSameLocation;
    document.getElementById("nPlayerSameLocationWord").innerHTML = `${pluralize('person', data.nPlayerSameLocation)} ${data.nPlayerSameLocation == 1 ? 'is' : 'are'}`;
    elements = document.getElementsByClassName("location")
    Array.from(elements).forEach(e => e.innerHTML = data.location);
    document.getElementById("uniqueLocation").style.display = data.nPlayerSameLocation <= 1 ? "inline" : "none"
    document.getElementById("commonLocation").style.display = data.nPlayerSameLocation > 1 ? "inline" : "none"
    
    
    elements = document.getElementsByClassName("locationIsImportant")
    Array.from(elements).forEach(e => e.style.display = data.locationIsImportant ? "inline" : "none");
    document.getElementById("nPlayerLocationImportant").innerHTML = data.nPlayerLocationImportant;
    document.getElementById("nPlayerLocationImportantWord").innerHTML = pluralize('person', data.nPlayerLocationImportant);
    document.getElementById("importantLocationExamples").innerHTML = data.importantLocationExamples.join(", ");
    document.getElementById("moreThanThreeLocationExamples").style.display = data.nImportantLocations > data.importantLocationExamples.length ? "inline" : "none"
    document.getElementById("nImportantLocations").innerHTML = data.nImportantLocations - data.importantLocationExamples.length;
    
    elements = document.getElementsByClassName("ethnicityIsImportant")
    Array.from(elements).forEach(e => e.style.display = data.ethnicityIsImportant ? "inline" : "none");
    document.getElementById("nEthnicity").innerHTML = data.nEthnicity;
    document.getElementById("nPlayerEthnicityImportant").innerHTML = data.nPlayerEthnicityImportant;
    document.getElementById("importantEthnicityExamples").innerHTML = data.importantEthnicityExamples.join(", ");
    document.getElementById("moreThanThreeEthnicityExamples").style.display = data.nImportantEthnicities > data.importantEthnicityExamples.length ? "inline" : "none"
    document.getElementById("nImportantEthnicities").innerHTML = data.nImportantEthnicities - data.importantEthnicityExamples.length;
    
    elements = document.getElementsByClassName("music")
    Array.from(elements).forEach(e => e.innerHTML = data.music);
    elements = document.getElementsByClassName("nPlayerSameMusic")
    Array.from(elements).forEach(e => e.innerHTML = data.nPlayerSameMusic);
    elements = document.getElementsByClassName("nPlayerSameMusicWord")
    Array.from(elements).forEach(e => e.innerHTML = pluralize('person', data.nPlayerSameMusic));
    document.getElementById("nSameMusicLocation").innerHTML = data.nSameMusicLocation;
    document.getElementById("nSameMusicLocationWord").innerHTML = `${pluralize('country', data.nSameMusicLocation)}/${pluralize('state', data.nSameMusicLocation)}`;
    document.getElementById("sameMusicLocationExamples").innerHTML = data.sameMusicLocationExamples.join(", ");
    document.getElementById("singleMusicLocation").innerHTML = data.sameMusicLocationExamples[0];
    document.getElementById("uniqueMusic").style.display = data.nPlayerSameMusic == 0 ? "inline" : "none"
    document.getElementById("commonMusic").style.display = data.nPlayerSameMusic > 0 ? "inline" : "none"
    document.getElementById("multiMusicLocationSentence").style.display = data.multiMusicLocation ? "inline" : "none"
    document.getElementById("singleMusicLocationSentence").style.display = !data.multiMusicLocation == 1 ? "inline" : "none"
    
    
    
    elements = document.getElementsByClassName("food")
    Array.from(elements).forEach(e => e.innerHTML = data.food);
    elements = document.getElementsByClassName("nPlayerSameFood")
    Array.from(elements).forEach(e => e.innerHTML = data.nPlayerSameFood);
    elements = document.getElementsByClassName("nPlayerSameFoodWord")
    Array.from(elements).forEach(e => e.innerHTML = pluralize('person', data.nPlayerSameFood));
    document.getElementById("nSameFoodLocation").innerHTML = data.nSameFoodLocation;
    document.getElementById("nSameFoodLocationWord").innerHTML = `${pluralize('country', data.nSameFoodLocation)}/${pluralize('state', data.nSameFoodLocation)}`;
    document.getElementById("sameFoodLocationExamples").innerHTML = data.sameFoodLocationExamples.join(", ");
    document.getElementById("singleFoodLocation").innerHTML = data.sameFoodLocationExamples[0];
    document.getElementById("uniqueFood").style.display = data.nPlayerSameFood == 0 ? "inline" : "none"
    document.getElementById("commonFood").style.display = data.nPlayerSameFood > 0 ? "inline" : "none"
    document.getElementById("multiFoodLocationSentence").style.display = data.multiFoodLocation ? "inline" : "none"
    document.getElementById("singleFoodLocationSentence").style.display = !data.multiFoodLocation == 1 ? "inline" : "none"

    elements = document.getElementsByClassName("section")
    Array.from(elements).forEach(e => e.style.display = "flex");
    
});