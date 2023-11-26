const Roles = require("./Roles")

const setupRole = (userList, roleList) => {
    if (!Array.isArray(userList) || !Array.isArray(roleList)) {
        return false;
    }
    if (userList.length !== roleList.length) {
        return false;
    }

    let thief = false;
    if (roleList.includes(Roles.THIEF)) {
        thief = true;

        roleList.push(Roles.VILLAGER);
        roleList.push(Roles.VILLAGER);

        do {
            roleList = shuffleArray(roleList);
        } while (roleList.slice(-2).includes(Roles.THIEF));
    } else {
        userList = shuffleArray(userList);
        roleList = shuffleArray(roleList);
    }

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

    const thiefRoles = [];

    if (thief) {
        thiefRoles.push(roleList[userList.length]);
        thiefRoles.push(roleList[userList.length + 1]);
    }

    return { playerRoleArray, thiefRoles };
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
