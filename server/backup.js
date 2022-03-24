    for (let i = 0; i < sameCount; i++) {
        if(playerIds.length != 0) {
            let data = analyzeData(playerIds, cultures);
            let dataCount = data.length;
            puzzleOptions.cultures.push(data[dataCount-1].culture);
            puzzleOptions.values.push(data[dataCount-1].value);
            puzzleOptions.points.push(data[dataCount-1].point);
            cultures = removeListItem(cultures, data[dataCount-1].culture);
            for (let j = 0; j < data[dataCount-1].ids.length; j++) { 
                playerIds = removeListItem(playerIds, data[dataCount-1].ids[j]);
            }
        }
    }