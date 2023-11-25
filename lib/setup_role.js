const Roles = require("./Roles")

const setupRole = (userList, roleList) => {
    if (!Array.isArray(userList) || !Array.isArray(roleList)) {
        return false;
    }
    if (userList.length !== roleList.length) {
        return false;
    }
    userList = shuffleArray(userList);
    roleList = shuffleArray(roleList);

    let playerRoleArray = [];
    for (let i = 0; i < userList.length; i++) {
        if (roleList[i] === Roles.WITCH) {
            playerRoleArray.push({
                player: userList[i],
                role: roleList[i],
                isDead: false,
                lifePotion: true,
                deathPotion: true
            })
        } else {
            playerRoleArray.push({
                player: userList[i],
                role: roleList[i],
                isDead: false
            });
        }
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
