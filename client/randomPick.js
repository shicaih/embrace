let musicList = ["Pop", 
             "Hip hop/Rap", 
             "Rock","R&B", 
             "Country/Western", 
             "EDM",
             "KPOP",
              "Musicals", 
             "Classical", 
             "Latin Music"
             ];
let foodList = ["Italian Food", 
            "Mexican Food",
            "Chinese Food",
            "Regional American Food",
            "Mediterranean Food",
            "Japanese Food",
            "Indian Food",
            "Fusion Food",
            "Spanish Food",
            "Korean Food",
            "Southeast Asia Food",
            ]
let hobbyList = ["Collecting",
             "Arts", 
             "Games",
             "Model & Electronic",
             "Sports & Outdoors",
             "Performing Arts",
              "Music",
             "Spiritual & Mental",
             "Food & Drinks",
             "Pets"
             ];
let financesList = ["Federal Loan",
                 "Private Loan", 
                 "Scholarship", 
                 "Financial Aid/Grants",
                 "Parents Sponsorship",
                 "Personal Funds",
                 "Others Sponsorship"
                  ];
let homeList = ["America", 
                "Europe",
                "Asia",
                "Australia",
                "Africa",
                ];
let ethnicityList = ["East Asian",
                 "Southeast Asian", 
                 "South Asian",
                 "Central Asian",
                 "North Asian",
                 "West Asian",
                 "Hipanic/Latinx",
                 "First Peoples/Indigneous",
                 "Native Hawaiian/Pacific Islander",
                 "North African",
                 "African/African American/Afro-Caribbean/Afro-Latinx/Black",
                 "White/Caucasian/North American/South American/European"
                 ];
let map = {music: musicList,
           food: foodList,
           hobby: hobbyList,
           finances: financesList,
           home: homeList,
           ethnicity: ethnicityList};
let formsSafe = ['name', 'music', 'food', 'hobby', 'finances', 'home', 'ethnicity'];
let scores = [];

// min and max are both included
function getRndInt(min, max) {
  return Math.floor(Math.random() * (max - min) ) + min;
}

function randomGuyGenerator() {
  for (let i = 0; i < formsSafe.length; i++) {
    console.log(i);
    if (i === 0) {
      window.sessionStorage.setItem(formsSafe[i], "RandomGuy");
    } else {
      console.log(formsSafe[i]);
      let cultureList = map[formsSafe[i]];
      let ranInt = getRndInt(0, cultureList.length - 1);
      let entry = [];
      console.log(formsSafe[i]);
      entry.push(cultureList[ranInt]);
      entry.push(true);
      entry.push(false);
      window.sessionStorage.setItem(formsSafe[i], entry);
      ranInt = getRndInt(1, 5);
      scores.push(ranInt);
    }
  }
  console.log(window.sessionStorage);
  window.sessionStorage.setItem("scores", scores);
  //window.location.href = "game.html";
}
//document.getElementById("generator").onclick = function() {randomGuyGenerator()};
randomGuyGenerator();