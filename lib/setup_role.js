const setupRole = (playerList, roleList) => {
    if (!Array.isArray(playerList) || !Array.isArray(roleList)) {
        return false;
    }
    if (playerList.length !== roleList.length) {
        return false;
    }
    playerList = shuffleArray(playerList);
    roleList = shuffleArray(roleList);

    let playerRoleArray = [];
    for (let i = 0; i < playerList.length; i++) {
        playerRoleArray.push({
            player: playerList[i],
            role: roleList[i]
        });
    }

    return playerRoleArray;
} 

const shuffleArray = (arrayToShuffle) => {
    const shuffledArray = arrayToShuffle.slice();
    for (let i = shuffledArray.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [shuffledArray[i], shuffledArray[j]] = [shuffledArray[j], shuffledArray[i]];
    }
    return shuffledArray;
}

module.exports = setupRole;