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

let socket = io.connect("http://embrace.etc.cmu.edu:443");


socket.emit("initReport", window.sessionStorage.getItem("uuid"));


//document.getElementById("uuid").innerHTML = sessionStorage.getItem("uuid");

socket.on("playerReport", data => {
    console.log(data)
    document.getElementById("nickname").innerHTML = window.sessionStorage.getItem("name");
    let elements = document.getElementsByClassName("nPlayer")
    Array.from(elements).forEach(e => e.innerHTML = data.nPlayer);

    //document.getElementById("nPlayerMet").innerHTML = pluralize('folk', data.nPlayerMet, true);
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
    elements = document.getElementsByClassName("nPlayerSameLocation");
    Array.from(elements).forEach(e => e.innerHTML = data.nPlayerSameLocation);
    document.getElementById("nPlayerHidLocationWord").innerHTML = `${pluralize('person', data.nPlayerSameLocation)}`;
    document.getElementById("nPlayerSameLocationWord").innerHTML = `${pluralize('person', data.nPlayerSameLocation)} ${data.nPlayerSameLocation == 1 ? 'is' : 'are'}`;
    elements = document.getElementsByClassName("location")
    Array.from(elements).forEach(e => e.innerHTML = data.location);
    elements = document.getElementsByClassName("uniqueLocation");
    Array.from(elements).forEach(e => e.style.display = data.nPlayerSameLocation <= 1 ? "inline" : "none");
    elements = document.getElementsByClassName("commonLocation");
    Array.from(elements).forEach(e => e.style.display = data.nPlayerSameLocation > 1 ? "inline" : "none");
    if (data.location == 'Prefer not to say' || data.location == '⊘' ) {
      document.getElementById("locationHid").style.display = "inline";
      document.getElementById("locationUnhid").style.display = "none";
    }

    elements = document.getElementsByClassName("locationIsImportant")
    Array.from(elements).forEach(e => e.style.display = data.locationIsImportant ? "inline" : "none");
    document.getElementById("nPlayerLocationImportant").innerHTML = data.nPlayerLocationImportant;
    document.getElementById("nPlayerLocationImportantWord").innerHTML = pluralize('person', data.nPlayerLocationImportant);
    document.getElementById("importantLocationExamples").innerHTML = data.importantLocationExamples.join(", ");
    document.getElementById("moreThanThreeLocationExamples").style.display = data.nImportantLocations > data.importantLocationExamples.length ? "inline" : "none"
    document.getElementById("nImportantLocations").innerHTML = data.nImportantLocations - data.importantLocationExamples.length;
    document.getElementById("nImportantLocationsWord").innerHTML = pluralize('place', data.nImportantLocations - data.importantLocationExamples.length)

    elements = document.getElementsByClassName("ethnicityIsImportant")
    Array.from(elements).forEach(e => e.style.display = data.ethnicityIsImportant ? "inline" : "none");
    document.getElementById("nEthnicity").innerHTML = data.nEthnicity + (data.ethnicity == 'Prefer not to say' || data.ethnicity == '⊘' ? 1 : 0);
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
    elements = document.getElementsByClassName("nSameMusicLocation");
    Array.from(elements).forEach(e => e.innerHTML = data.nSameMusicLocation);
    elements = document.getElementsByClassName("nSameMusicLocationWord");
    Array.from(elements).forEach(e => e.innerHTML = `${pluralize('country', data.nSameMusicLocation)}/${pluralize('state', data.nSameMusicLocation)}`);
    elements = document.getElementsByClassName("sameMusicLocationExamples");
    Array.from(elements).forEach(e => e.innerHTML = data.sameMusicLocationExamples.join(", "));
    elements = document.getElementsByClassName("singleMusicLocation");
    Array.from(elements).forEach(e => e.innerHTML = data.sameMusicLocationExamples[0]);
    elements = document.getElementsByClassName("uniqueMusic");
    Array.from(elements).forEach(e => e.style.display = data.nPlayerSameMusic == 0 ? "inline" : "none");
    elements = document.getElementsByClassName("commonMusic")
    Array.from(elements).forEach(e => e.style.display = data.nPlayerSameMusic > 0 ? "inline" : "none");
    elements = document.getElementsByClassName("multiMusicLocationSentence");
    Array.from(elements).forEach(e => e.style.display = data.multiMusicLocation ? "inline" : "none");
    elements = document.getElementsByClassName("singleMusicLocationSentence");
    Array.from(elements).forEach(e => e.style.display = !data.multiMusicLocation == 1 ? "inline" : "none");
    if (data.music == 'Prefer not to say' || data.music == '⊘' ) {
      document.getElementById("musicHid").style.display = "block";
      document.getElementById("musicUnhid").style.display = "none";
    }



    elements = document.getElementsByClassName("food")
    Array.from(elements).forEach(e => e.innerHTML = data.food);
    elements = document.getElementsByClassName("nPlayerSameFood")
    Array.from(elements).forEach(e => e.innerHTML = data.nPlayerSameFood);
    elements = document.getElementsByClassName("nPlayerSameFoodWord")
    Array.from(elements).forEach(e => e.innerHTML = pluralize('person', data.nPlayerSameFood));
    elements = document.getElementsByClassName("nSameFoodLocation");
    Array.from(elements).forEach(e => e.innerHTML = data.nSameFoodLocation);
    elements = document.getElementsByClassName("nSameFoodLocationWord");
    Array.from(elements).forEach(e => e.innerHTML = `${pluralize('country', data.nSameFoodLocation)}/${pluralize('state', data.nSameFoodLocation)}`);
    elements = document.getElementsByClassName("sameFoodLocationExamples");
    Array.from(elements).forEach(e => e.innerHTML = data.sameFoodLocationExamples.join(", "));
    elements = document.getElementsByClassName("singleFoodLocation");
    Array.from(elements).forEach(e => e.innerHTML = data.sameFoodLocationExamples[0]);
    elements = document.getElementsByClassName("uniqueFood");
    Array.from(elements).forEach(e => e.style.display = data.nPlayerSameFood == 0 ? "inline" : "none");
    elements = document.getElementsByClassName("commonFood");
    Array.from(elements).forEach(e => e.style.display = data.nPlayerSameFood > 0 ? "inline" : "none");
    elements = document.getElementsByClassName("multiFoodLocationSentence");
    Array.from(elements).forEach(e => e.style.display = data.multiFoodLocation ? "inline" : "none");
    elements = document.getElementsByClassName("singleFoodLocationSentence");
    Array.from(elements).forEach(e => e.style.display = !data.multiFoodLocation == 1 ? "inline" : "none");
    if (data.food == 'Prefer not to say' || data.food == '⊘' ) {
      document.getElementById("foodHid").style.display = "block";
      document.getElementById("foodUnhid").style.display = "none";
    }

    elements = document.getElementsByClassName("section")
    Array.from(elements).forEach(e => e.style.display = "flex");

});