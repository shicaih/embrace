const MAX_CHARS = 25;
const pageIndexMap = {
    "index.html": 0,
    "1music.html": 1,
    "2food.html": 2,
    "3hobby.html": 3,
    "4economics.html": 4,
    "5location.html": 5,
    "6ethnicity.html": 6,
}
// get the name of the html file the script currently running on
const getPageName = () => {
    let url = window.location.pathname;
    let pageName = url.split("/").pop();
    return pageName;
}
const FORMINDEX = pageIndexMap[getPageName()];


let dataEle = document.getElementById("mainInput"); // the culture value droplist element
let myStorage = window.sessionStorage; // can be sessionStorage or localStorage
let formName = myStorage.getItem("forms").split(",")[FORMINDEX]; // key for culture info
let nameInput = document.getElementById("otherInput");
console.log(myStorage);
console.log(formName);


// show/hide the other input bar
dataEle.addEventListener("change", (event) => {
  let otherInput = document.getElementById("otherInput");
  if (dataEle.value === "Other" || dataEle.value === "Multi") { // Multi only applies for Ethnicity
    otherInput.style.display = "block";
  } else {
    otherInput.style.display = "none";
  }
});

// show/hide the tip about text length
nameInput.oninput = (event) => {
  let data = event.target.value.trim();
  let ins = document.getElementById("lengthIns");
  ins.textContent = `Text length cannot exceed ${MAX_CHARS} characters.`
  if (data.length > MAX_CHARS) {
    document.getElementById("lengthIns").style.display = "block";
  } else {
    document.getElementById("lengthIns").style.display = "none";
  }
};

// save the culture info as a list into storage with key as culture name
// the list will be turned into a string by javascript automatically
// use split(",") to deserialise 
function SubmitForm() {
  let dataEle,
    isOther = false;
  // Multi only applies for Ethnicity
  if (document.getElementById("mainInput").value === "Other" || document.getElementById("mainInput").value === "Multi") {
    dataEle = document.getElementById("otherInput");
    isOther = true;
  } else {
    dataEle = document.getElementById("mainInput");
  }
  let notToShowEle = document.getElementById("notToShow");
  let data = [];
  data.push(dataEle.value.trim());
  data.push(!notToShowEle.checked);
  data.push(isOther);
  myStorage.setItem(formName, data);
  return Validate(dataEle);
}

// Validate if the input is: not empty and length not exceeds MAX_CHAR
function Validate(dataEle) {
  // alert when no input
  if (dataEle.value.trim() === "") {
    window.alert("Please enter your answer.");
    dataEle.focus();
    return false;
  }
  // alert when text length exceeds
  if (dataEle.value.trim().length > MAX_CHARS) {
    window.alert(`Nickname length cannot exceed ${MAX_CHARS} characters.`);
    dataEle.focus();
    return false;
  }
  return true;
}
