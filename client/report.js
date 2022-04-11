let socket = io.connect("https://embrace-lobby-server.glitch.me");

socket.emit("initReport", window.sessionStorage.getItem("uuid"));


//document.getElementById("uuid").innerHTML = sessionStorage.getItem("uuid");

socket.on("playerReport", data => {
    console.log(data)
    document.getElementById("nickname").innerHTML = window.sessionStorage.getItem("name");
    let elements = document.getElementsByClassName("nPlayer")
    Array.from(elements).forEach(e => e.innerHTML = data.nPlayer);
    
    document.getElementById("nPlayerMet").innerHTML = data.nPlayerMet;
    document.getElementById("nTeammate").innerHTML = data.nTeammate;
    document.getElementById("timeSpent").innerHTML = `${data.timeSpentMin} minute${data.timeSpentMin == 1 ? "" : "s"} ${data.timeSpentSec} second${data.timeSpentSec == 1 ? "" : "s"}`;
    
    document.getElementById("nPuzzlesSolved").innerHTML = data.nPuzzlesSolved;
    document.getElementById("speedRank").innerHTML = `${data.speedRank}%`;
    
    document.getElementById("encouragingPerson").style.display = data.nThumbToOthers > 0 ? "inline" : "none"
    document.getElementById("nThumbToOthers").innerHTML = data.nThumbToOthers;
    
    document.getElementById("helpfulPerson").style.display = data.nThumbFromOthers > 0 ? "inline" : "none"
    document.getElementById("alsoHelpful").style.display = data.nThumbToOthers > 0 ? "inline" : "none" 
    document.getElementById("nThumbFromOthers").innerHTML = data.nThumbFromOthers;
    
    document.getElementById("mutualThumb").style.display = data.nMutualThumb > 0 ? "inline" : "none"
    document.getElementById("nMutualThumb").innerHTML = data.nMutualThumb;

    document.getElementById("madeFriends").style.display = data.nThumbFromOthers > 0 || data.nThumbToOthers > 0 ? "inline" : "none"
    
    document.getElementById("nCountriesStates").innerHTML = data.nCountriesStates;
    //document.getElementById("nCountries").innerHTML = data.nCountries;
    //document.getElementById("nStates").innerHTML = data.nStates;
    document.getElementById("nPlayerSameLocation").innerHTML = data.nPlayerSameLocation;
    elements = document.getElementsByClassName("location")
    Array.from(elements).forEach(e => e.innerHTML = data.location);
    document.getElementById("uniqueLocation").style.display = data.nPlayerSameLocation <= 2 ? "inline" : "none"
    document.getElementById("commonLocation").style.display = data.nPlayerSameLocation > 2 ? "inline" : "none"
    
    
    elements = document.getElementsByClassName("locationIsImportant")
    Array.from(elements).forEach(e => e.style.display = data.locationIsImportant ? "inline" : "none");
    document.getElementById("nPlayerLocationImportant").innerHTML = data.nPlayerLocationImportant;
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
    document.getElementById("nSameMusicLocation").innerHTML = data.nSameMusicLocation;
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
    document.getElementById("nSameFoodLocation").innerHTML = data.nSameFoodLocation;
    document.getElementById("sameFoodLocationExamples").innerHTML = data.sameFoodLocationExamples.join(", ");
    document.getElementById("singleFoodLocation").innerHTML = data.sameFoodLocationExamples[0];
    document.getElementById("uniqueFood").style.display = data.nPlayerSameFood == 0 ? "inline" : "none"
    document.getElementById("commonFood").style.display = data.nPlayerSameFood > 0 ? "inline" : "none"
    document.getElementById("multiFoodLocationSentence").style.display = data.multiFoodLocation ? "inline" : "none"
    document.getElementById("singleFoodLocationSentence").style.display = !data.multiFoodLocation == 1 ? "inline" : "none"

});