pageIndexMap = {
    "index.html": 0,
    "1music.html": 1,
    "2food.html": 2,
    "3hobby.html": 3,
    "4economics.html": 4,
    "5location.html": 5,
    "6ethnicity.html": 6,
}
const getPageName = () => {
    let url = window.location.pathname;
    let pageName = url.split("/").pop();
    return pageName;
}
const FORMINDEX = pageIndexMap[getPageName()];
let dataEle = document.getElementById("mainInput");
dataEle.addEventListener("change", (event) => {
  let otherInput = document.getElementById("otherInput");
  if (dataEle.value === "Other") {
    otherInput.style.display = "block";
  } else {
    otherInput.style.display = "none";
  }
});


let myStorage = window.sessionStorage;
console.log(myStorage);
let formName = myStorage.getItem("forms").split(",")[FORMINDEX];
console.log(formName);
let nameInput = document.getElementById("otherInput");
nameInput.oninput = (event) => {
  let data = event.target.value.trim();
  if (data.length > 10) {
    document.getElementById("lengthIns").style.display = "block";
  } else {
    document.getElementById("lengthIns").style.display = "none";
  }
};
function SubmitForm() {
  let dataEle,
    isOther = false;
  if (document.getElementById("mainInput").value === "Other") {
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

function Validate(dataEle) {
  if (dataEle.value.trim() === "") {
    window.alert("Please enter your answer.");
    dataEle.focus();
    return false;
  }
  if (dataEle.value.trim().length > 10) {
    window.alert("Nickname length cannot exceed 10 characters.");
    dataEle.focus();
    return false;
  }
  return true;
}
