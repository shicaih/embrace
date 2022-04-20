const shuffle = (arr) => {
  let i = arr.length, randInd;
  while (i != 0) {
    // Pick a remaining element.
    randInd = Math.floor(Math.random() * i--);

    // And swap it with the current element.
    [arr[i], arr[randInd]] = [
      arr[randInd], arr[i]];
  }
  return arr;
}

export default shuffle