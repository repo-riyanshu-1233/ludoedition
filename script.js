const MAINTENANCE_MODE = false;
const MAINTENANCE_REDIRECT_URL = "https://google.com";

function checkMaintenance() {
    if (MAINTENANCE_MODE) {
        const overlay = document.createElement('div');
        overlay.id = 'maintenanceOverlay';
        overlay.style.cssText = 'position:fixed; top:0; left:0; width:100vw; height:100vh; background:#0f0a1c; z-index:9999; display:flex; flex-direction:column; justify-content:center; align-items:center; padding:20px; text-align:center; color:#fff;';
        overlay.innerHTML = `
            <div style="font-size: 52px; color: #ffd700; margin-bottom: 15px;"><i class="fa-solid fa-screwdriver-wrench"></i></div>
            <h2 style="font-size: 22px; margin-bottom: 10px; color: #ffd700;">Game Maintenance</h2>
            <p style="font-size: 14px; max-width: 300px; line-height: 1.5; margin-bottom: 20px; color: #ccc;">The game is being updated please wait a while or check out other game</p>
            <button onclick="window.location.href='${MAINTENANCE_REDIRECT_URL}'" style="background: linear-gradient(180deg, #ffb347, #ff8800); border: none; padding: 12px 35px; border-radius: 10px; font-weight: bold; font-size: 16px; color: #000; cursor: pointer; box-shadow: 0 4px 0 #b35900;">Check</button>
        `;
        document.body.appendChild(overlay);
    }
}
checkMaintenance();

let activePlayersCount = 2;
let isAIMode = false;
let isFriendMode = false;
let isAnimating = false;
let playerColors = ['red', 'green', 'yellow', 'blue'];
let activePlayerNames = [];
let playerLeftStatus = [false, false, false, false];
let currentTurnIndex = 0;
let diceValue = 0;
let hasRolled = false;

let currentRoomCode = '';
let roomPlayersList = [];

const paths = {
    red: [
        'cell-6-1','cell-6-2','cell-6-3','cell-6-4','cell-6-5','cell-5-6','cell-4-6','cell-3-6','cell-2-6','cell-1-6','cell-0-6',
        'cell-0-7','cell-0-8','cell-1-8','cell-2-8','cell-3-8','cell-4-8','cell-5-8','cell-6-9','cell-6-10','cell-6-11','cell-6-12','cell-6-13','cell-6-14',
        'cell-7-14','cell-8-14','cell-8-13','cell-8-12','cell-8-11','cell-8-10','cell-8-9','cell-9-8','cell-10-8','cell-11-8','cell-12-8','cell-13-8','cell-14-8',
        'cell-14-7','cell-14-6','cell-13-6','cell-12-6','cell-11-6','cell-10-6','cell-9-6','cell-8-5','cell-8-4','cell-8-3','cell-8-2','cell-8-1','cell-8-0','cell-7-0',
        'cell-7-1','cell-7-2','cell-7-3','cell-7-4','cell-7-5','home'
    ],
    green: [
        'cell-1-8','cell-2-8','cell-3-8','cell-4-8','cell-5-8','cell-6-9','cell-6-10','cell-6-11','cell-6-12','cell-6-13','cell-6-14',
        'cell-7-14','cell-8-14','cell-8-13','cell-8-12','cell-8-11','cell-8-10','cell-8-9','cell-9-8','cell-10-8','cell-11-8','cell-12-8','cell-13-8','cell-14-8',
        'cell-14-7','cell-14-6','cell-13-6','cell-12-6','cell-11-6','cell-10-6','cell-9-6','cell-8-5','cell-8-4','cell-8-3','cell-8-2','cell-8-1','cell-8-0',
        'cell-7-0','cell-6-0','cell-6-1','cell-6-2','cell-6-3','cell-6-4','cell-6-5','cell-5-6','cell-4-6','cell-3-6','cell-2-6','cell-1-6','cell-0-6','cell-0-7',
        'cell-1-7','cell-2-7','cell-3-7','cell-4-7','cell-5-7','home'
    ],
    yellow: [
        'cell-8-13','cell-8-12','cell-8-11','cell-8-10','cell-8-9','cell-9-8','cell-10-8','cell-11-8','cell-12-8','cell-13-8','cell-14-8',
        'cell-14-7','cell-14-6','cell-13-6','cell-12-6','cell-11-6','cell-10-6','cell-9-6','cell-8-5','cell-8-4','cell-8-3','cell-8-2','cell-8-1','cell-8-0',
        'cell-7-0','cell-6-0','cell-6-1','cell-6-2','cell-6-3','cell-6-4','cell-6-5','cell-5-6','cell-4-6','cell-3-6','cell-2-6','cell-1-6','cell-0-6',
        'cell-0-7','cell-0-8','cell-1-8','cell-2-8','cell-3-8','cell-4-8','cell-5-8','cell-6-9','cell-6-10','cell-6-11','cell-6-12','cell-6-13','cell-6-14','cell-7-14',
        'cell-7-13','cell-7-12','cell-7-11','cell-7-10','cell-7-9','home'
    ],
    blue: [
        'cell-13-6','cell-12-6','cell-11-6','cell-10-6','cell-9-6','cell-8-5','cell-8-4','cell-8-3','cell-8-2','cell-8-1','cell-8-0',
        'cell-7-0','cell-6-0','cell-6-1','cell-6-2','cell-6-3','cell-6-4','cell-6-5','cell-5-6','cell-4-6','cell-3-6','cell-2-6','cell-1-6','cell-0-6',
        'cell-0-7','cell-0-8','cell-1-8','cell-2-8','cell-3-8','cell-4-8','cell-5-8','cell-6-9','cell-6-10','cell-6-11','cell-6-12','cell-6-13','cell-6-14',
        'cell-7-14','cell-8-14','cell-8-13','cell-8-12','cell-8-11','cell-8-10','cell-8-9','cell-9-8','cell-10-8','cell-11-8','cell-12-8','cell-13-8','cell-14-8','cell-14-7',
        'cell-13-7','cell-12-7','cell-11-7','cell-10-7','cell-9-7','home'
    ]
};

const safeCells = ['cell-6-1', 'cell-1-8', 'cell-8-13', 'cell-13-6', 'cell-2-6', 'cell-6-12', 'cell-12-8', 'cell-8-2'];

let tokens = {
    red: [{pos: -1}, {pos: -1}, {pos: -1}, {pos: -1}],
    green: [{pos: -1}, {pos: -1}, {pos: -1}, {pos: -1}],
    yellow: [{pos: -1}, {pos: -1}, {pos: -1}, {pos: -1}],
    blue: [{pos: -1}, {pos: -1}, {pos: -1}, {pos: -1}]
};

function initBoard() {
    const board = document.getElementById('board');
    for (let r = 0; r < 15; r++) {
        for (let c = 0; c < 15; c++) {
            if ((r < 6 && c < 6) || (r < 6 && c > 8) || (r > 8 && c < 6) || (r > 8 && c > 8) || (r >= 6 && r <= 8 && c >= 6 && c <= 8)) continue;
            
            const cell = document.createElement('div');
            cell.className = 'cell';
            cell.id = `cell-${r}-${c}`;
            cell.style.gridArea = `${r + 1} / ${c + 1}`;

            if (r === 7 && c > 0 && c < 6) cell.classList.add('red-path');
            if (c === 7 && r > 0 && r < 6) cell.classList.add('green-path');
            if (r === 7 && c > 8 && c < 14) cell.classList.add('yellow-path');
            if (c === 7 && r > 8 && r < 14) cell.classList.add('blue-path');
            if (safeCells.includes(cell.id)) cell.classList.add('star-cell');

            board.appendChild(cell);
        }
    }
}
initBoard();

window.addEventListener('resize', () => {
    if (document.getElementById('gameView').style.display === 'flex') {
        renderTokens();
    }
});

function trigger1By1Animations(containerId) {
    const container = document.getElementById(containerId);
    if (!container) return;
    const items = container.querySelectorAll('.animate-item');
    items.forEach((item) => {
        item.style.animation = 'none';
        item.offsetHeight;
        item.style.animation = '';
    });
}

function showToast(text) {
    const toast = document.getElementById('toastBanner');
    document.getElementById('toastText').innerText = text;
    toast.classList.add('show');
    setTimeout(() => { toast.classList.remove('show'); }, 3000);
}

function closeModal() { document.getElementById('modalOverlay').style.display = 'none'; }
function openModal(content) {
    document.getElementById('modalBox').innerHTML = content;
    document.getElementById('modalOverlay').style.display = 'flex';
}

function openTopMenu() {
    openModal(`
        <h3>MENU</h3>
        <button class="action-btn" onclick="openContactUs()">1. Contact Us</button>
        <button class="action-btn" onclick="openAboutUs()">2. About Us</button>
        <button class="action-btn" onclick="openOtherGames()">3. Other Games</button>
        <button class="action-btn" style="background:#555; color:#fff;" onclick="closeModal()">Close</button>
    `);
}

function openContactUs() {
    openModal(`
        <h3>Contact Us</h3>
        <p style="margin:15px 0; font-size:14px; line-height:1.5;">Connect with us on social platforms or email!</p>
        <button class="action-btn" onclick="window.open('https://instagram.com', '_blank')"><i class="fa-brands fa-instagram"></i> Instagram</button>
        <button class="action-btn" onclick="window.open('mailto:support@ludogame.com', '_blank')"><i class="fa-solid fa-envelope"></i> Email Us</button>
        <button class="action-btn" style="background:#e74c3c; color:#fff;" onclick="openTopMenu()">Back</button>
    `);
}

function openAboutUs() {
    openModal(`
        <h3>About Us</h3>
        <p style="margin:15px 0; font-size:13px; color:#ddd; line-height:1.6;">
            Welcome to Ludo King Style Game! Designed with full smooth fade-in animations, local multiplayer, multi-bot AI mode, and custom room features.
        </p>
        <button class="action-btn" style="background:#e74c3c; color:#fff;" onclick="openTopMenu()">Back</button>
    `);
}

function openOtherGames() {
    openModal(`
        <h3>Other Games</h3>
        <p style="margin:15px 0; font-size:14px;">Explore more awesome games on our official platform!</p>
        <button class="action-btn" style="background:#2ecc71; color:#fff;" onclick="window.open('https://google.com', '_blank')">Check</button>
        <button class="action-btn" style="background:#e74c3c; color:#fff;" onclick="openTopMenu()">Back</button>
    `);
}

function openHelpModal() {
    openModal(`
        <h3>How to Play</h3>
        <p style="margin:15px 0; font-size:12px; color:#ccc; text-align:left; line-height:1.5;">
            1. Roll 6 to move token out of base.<br>
            2. Tap token to move step-by-step.<br>
            3. Eliminate opponent tokens by landing on them.<br>
            4. Reach center HOME to win!
        </p>
        <button class="action-btn" style="background:#e74c3c; color:#fff;" onclick="closeModal()">Close</button>
    `);
}

function openPassNPlayPopup() {
    openModal(`
        <h3>Select Players</h3>
        <p style="margin: 10px 0; font-size:12px; color:#aaa">Pass N Play Local Mode</p>
        <button class="action-btn" onclick="startPassNPlay(2)">2 Players</button>
        <button class="action-btn" onclick="startPassNPlay(3)">3 Players</button>
        <button class="action-btn" onclick="startPassNPlay(4)">4 Players</button>
        <button class="action-btn" style="background:#e74c3c; color:#fff;" onclick="closeModal()">Cancel</button>
    `);
}

function startPassNPlay(count) {
    activePlayersCount = count;
    isAIMode = false;
    isFriendMode = false;
    activePlayerNames = [];
    for(let i=1; i<=count; i++) activePlayerNames.push(`Player ${i}`);
    launchGame();
}

function openComputerMenuPopup() {
    openModal(`
        <h3>Vs Computer</h3>
        <p style="margin: 10px 0; font-size:12px; color:#aaa">1 Real Player + AI Bots</p>
        <button class="action-btn" onclick="startAIMode(2)">2 Players (1 User + 1 AI)</button>
        <button class="action-btn" onclick="startAIMode(3)">3 Players (1 User + 2 AI)</button>
        <button class="action-btn" onclick="startAIMode(4)">4 Players (1 User + 3 AI)</button>
        <button class="action-btn" style="background:#e74c3c; color:#fff;" onclick="closeModal()">Cancel</button>
    `);
}

function startAIMode(count) {
    activePlayersCount = count;
    isAIMode = true;
    isFriendMode = false;
    activePlayerNames = ['You (Player 1)'];
    for(let i = 2; i <= count; i++) {
        activePlayerNames.push(`AI Bot ${i-1}`);
    }
    launchGame();
}

function openFriendMenu() {
    openModal(`
        <h3>Play With Friends</h3>
        <input type="text" id="pNameInput" class="modal-input" placeholder="Enter Your Name">
        <button class="action-btn" onclick="handleCreateRoom()">Create Room</button>
        <button class="action-btn" onclick="openEnterCodeScreen()">Enter Code</button>
        <button class="action-btn" style="background:#e74c3c; color:#fff;" onclick="closeModal()">Back</button>
    `);
}

function handleCreateRoom() {
    const userName = document.getElementById('pNameInput').value.trim() || 'Host Player';
    currentRoomCode = Math.floor(1000 + Math.random() * 9000).toString();
    roomPlayersList = [userName];
    closeModal();
    openFullRoomLobby();
}

function openEnterCodeScreen() {
    const name = document.getElementById('pNameInput') ? document.getElementById('pNameInput').value.trim() : '';
    openModal(`
        <h3>Join Room</h3>
        <input type="text" id="pNameJoin" class="modal-input" placeholder="Enter Your Name" value="${name}">
        <input type="number" id="rCodeInput" class="modal-input" placeholder="Enter Room Code">
        <button class="action-btn" style="background:#2ecc71; color:#fff;" onclick="submitJoinRoom()">Join</button>
        <button class="action-btn" style="background:#e74c3c; color:#fff;" onclick="openFriendMenu()">Back</button>
    `);
}

function submitJoinRoom() {
    const userName = document.getElementById('pNameJoin').value.trim() || 'Player 2';
    const code = document.getElementById('rCodeInput').value;
    if (code.length >= 4) {
        currentRoomCode = code;
        roomPlayersList = ['Host Player', userName];
        closeModal();
        openFullRoomLobby();
    } else {
        alert('Please enter valid room code!');
    }
}

function openFullRoomLobby() {
    document.getElementById('lobbyCodeDisplay').innerText = currentRoomCode;
    document.getElementById('lobbyView').style.display = 'flex';
    trigger1By1Animations('lobbyView');
    renderWoodenLobbyList();
}

function renderWoodenLobbyList() {
    const listContainer = document.getElementById('joinedPlayersList');
    const waitingMsg = document.getElementById('waitingMsg');
    listContainer.innerHTML = '';

    roomPlayersList.forEach((player, idx) => {
        const card = document.createElement('div');
        card.className = 'player-card';
        card.innerHTML = `<span>${idx + 1}. ${player}</span> <span class="p-tag">${idx === 0 ? 'HOST' : 'READY'}</span>`;
        listContainer.appendChild(card);
    });

    const startBtn = document.getElementById('startGameBtn');
    if (roomPlayersList.length >= 2) {
        startBtn.style.display = 'block';
        waitingMsg.style.display = 'none';
    } else {
        startBtn.style.display = 'none';
        waitingMsg.style.display = 'block';
    }
}

function closeLobbyAndReturn() {
    document.getElementById('lobbyView').style.display = 'none';
}

function startRoomGame() {
    activePlayerNames = [...roomPlayersList];
    activePlayersCount = roomPlayersList.length;
    isAIMode = false;
    isFriendMode = true;
    document.getElementById('lobbyView').style.display = 'none';
    launchGame();
}

function openOnlineMenu() {
    openModal(`
        <h3>Play Online</h3>
        <input type="text" id="onlineName" class="modal-input" placeholder="Enter Your Name">
        <button class="action-btn" onclick="startMatchmaking()">Find Match</button>
        <button class="action-btn" style="background:#e74c3c; color:#fff;" onclick="closeModal()">Back</button>
    `);
}

function startMatchmaking() {
    openModal(`
        <h3>Searching Players...</h3>
        <div style="border: 4px solid #f3f3f3; border-top: 4px solid #ffb347; border-radius: 50%; width: 35px; height: 35px; animation: spin 1s linear infinite; margin: 20px auto;"></div>
        <style>@keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }</style>
    `);
    setTimeout(() => {
        openModal(`
            <h3 style="color:#e74c3c;">Connection Failed</h3>
            <p style="margin:12px 0; font-size:13px;">No online servers available right now.</p>
            <button class="action-btn" style="background:#e74c3c; color:#fff;" onclick="closeModal()">Back</button>
        `);
    }, 3000);
}

function launchGame() {
    closeModal();
    document.getElementById('menuView').style.display = 'none';
    
    const gameView = document.getElementById('gameView');
    gameView.style.display = 'flex';
    
    trigger1By1Animations('gameView');

    document.getElementById('topMenuBtn').style.display = 'none';
    document.getElementById('topExitBtn').style.display = 'flex';
    
    currentTurnIndex = 0;
    hasRolled = false;
    isAnimating = false;
    playerLeftStatus = [false, false, false, false];

    playerColors.forEach(c => {
        document.getElementById(`overlay-${c}`).style.display = 'none';
    });

    tokens = {
        red: [{pos: -1}, {pos: -1}, {pos: -1}, {pos: -1}],
        green: [{pos: -1}, {pos: -1}, {pos: -1}, {pos: -1}],
        yellow: [{pos: -1}, {pos: -1}, {pos: -1}, {pos: -1}],
        blue: [{pos: -1}, {pos: -1}, {pos: -1}, {pos: -1}]
    };

    createTokenDOM();
    updateTurnUI();
    setTimeout(renderTokens, 60);
}

function exitGameToHome() {
    document.getElementById('menuView').style.display = 'flex';
    document.getElementById('gameView').style.display = 'none';
    document.getElementById('lobbyView').style.display = 'none';
    
    trigger1By1Animations('menuView');

    document.getElementById('topMenuBtn').style.display = 'flex';
    document.getElementById('topExitBtn').style.display = 'none';
    closeModal();
}

function createTokenDOM() {
    document.querySelectorAll('.token').forEach(el => el.remove());

    for (let i = 0; i < activePlayersCount; i++) {
        const color = playerColors[i];
        tokens[color].forEach((tok, index) => {
            const elem = document.createElement('div');
            elem.className = `token ${color}`;
            elem.id = `tok-${color}-${index}`;
            elem.onclick = () => handleTokenClick(color, index);
            document.getElementById('board').appendChild(elem);
        });
    }
}

function renderTokens() {
    if (document.getElementById('gameView').style.display !== 'flex') return;

    const spotGroup = {};

    for (let i = 0; i < activePlayersCount; i++) {
        if (playerLeftStatus[i]) continue;
        
        const color = playerColors[i];
        tokens[color].forEach((tok, index) => {
            let key = '';
            if (tok.pos === -1) {
                key = `${color}-base-${index}`;
            } else if (tok.pos === 'home') {
                key = 'home';
            } else {
                key = paths[color][tok.pos];
            }

            if (!spotGroup[key]) spotGroup[key] = [];
            spotGroup[key].push({ color, index, pos: tok.pos });
        });
    }

    Object.keys(spotGroup).forEach(key => {
        const group = spotGroup[key];
        let targetSpot;

        if (key.includes('base')) {
            targetSpot = document.getElementById(key);
        } else if (key === 'home') {
            targetSpot = document.querySelector('.center-home');
        } else {
            targetSpot = document.getElementById(key);
        }

        group.forEach((item, grpIdx) => {
            const elem = document.getElementById(`tok-${item.color}-${item.index}`);
            if (elem) {
                placeTokenCentered(elem, targetSpot, grpIdx, group.length);
            }
        });
    });
}

function placeTokenCentered(tokenElem, spotElem, grpIdx = 0, totalInGroup = 1) {
    if (!spotElem) return;
    const rect = spotElem.getBoundingClientRect();
    const board = document.getElementById('board');
    const boardRect = board.getBoundingClientRect();
    
    const borderLeft = board.clientLeft || 0;
    const borderTop = board.clientTop || 0;

    let centerX = (rect.left - boardRect.left - borderLeft) + (rect.width / 2);
    let centerY = (rect.top - boardRect.top - borderTop) + (rect.height / 2);

    if (totalInGroup > 1 && !spotElem.id.includes('base')) {
        const offsetVal = 4;
        const offsets = [
            { x: -offsetVal, y: -offsetVal },
            { x: offsetVal, y: offsetVal },
            { x: -offsetVal, y: offsetVal },
            { x: offsetVal, y: -offsetVal }
        ];
        const off = offsets[grpIdx % offsets.length];
        centerX += off.x;
        centerY += off.y;
    }

    tokenElem.style.left = centerX + 'px';
    tokenElem.style.top = centerY + 'px';
}

function rollDice() {
    if (hasRolled || isAnimating) return;
    if (isAIMode && currentTurnIndex !== 0) return;
    if (playerLeftStatus[currentTurnIndex]) {
        nextTurn();
        return;
    }

    isAnimating = true;
    const diceBtn = document.getElementById('diceBtn');
    diceBtn.classList.add('rolling');

    const rollInterval = setInterval(() => {
        diceBtn.innerText = Math.floor(Math.random() * 6) + 1;
    }, 50);

    setTimeout(() => {
        clearInterval(rollInterval);
        diceValue = Math.floor(Math.random() * 6) + 1;
        diceBtn.innerText = diceValue;
        diceBtn.classList.remove('rolling');
        hasRolled = true;
        isAnimating = false;

        checkMovePossibility();
    }, 500);
}

function checkMovePossibility() {
    const color = playerColors[currentTurnIndex];
    const pPath = paths[color];
    let canMove = false;

    tokens[color].forEach(tok => {
        if (tok.pos === -1 && diceValue === 6) canMove = true;
        if (tok.pos >= 0 && tok.pos !== 'home' && (tok.pos + diceValue) < pPath.length) canMove = true;
    });

    if (!canMove) {
        setTimeout(nextTurn, 1000);
    } else if (isAIMode && currentTurnIndex !== 0) {
        setTimeout(autoCPUMove, 600);
    }
}

async function handleTokenClick(color, index) {
    if (!hasRolled || color !== playerColors[currentTurnIndex] || isAnimating) return;

    let tok = tokens[color][index];
    const pPath = paths[color];
    const elem = document.getElementById(`tok-${color}-${index}`);

    let eliminated = false;

    if (tok.pos === -1 && diceValue === 6) {
        isAnimating = true;
        tok.pos = 0;
        elem.classList.add('moving');
        renderTokens();
        await sleep(220);
        elem.classList.remove('moving');
        isAnimating = false;
        finishMove(color, false);
    } else if (tok.pos >= 0 && tok.pos !== 'home' && (tok.pos + diceValue) < pPath.length) {
        isAnimating = true;
        elem.classList.add('moving');

        const targetPos = tok.pos + diceValue;
        while (tok.pos < targetPos) {
            tok.pos++;
            renderTokens();
            await sleep(200);
        }

        if (tok.pos === pPath.length - 1) tok.pos = 'home';
        
        elem.classList.remove('moving');
        eliminated = await checkElimination(color, tok.pos);
        isAnimating = false;
        finishMove(color, eliminated);
    }
}

async function checkElimination(currentColor, pos) {
    if (pos === 'home') return false;
    const currentCell = paths[currentColor][pos];
    if (safeCells.includes(currentCell)) return false;

    let hasEliminated = false;

    for (let i = 0; i < activePlayersCount; i++) {
        if (playerLeftStatus[i]) continue;
        const enemyColor = playerColors[i];
        if (enemyColor === currentColor) continue;

        for (let j = 0; j < tokens[enemyColor].length; j++) {
            let enemyTok = tokens[enemyColor][j];
            if (enemyTok.pos >= 0 && enemyTok.pos !== 'home') {
                const enemyCell = paths[enemyColor][enemyTok.pos];
                if (enemyCell === currentCell) {
                    hasEliminated = true;
                    const enemyElem = document.getElementById(`tok-${enemyColor}-${j}`);
                    enemyElem.classList.add('moving');
                    while (enemyTok.pos > 0) {
                        enemyTok.pos--;
                        renderTokens();
                        await sleep(50);
                    }
                    enemyTok.pos = -1;
                    renderTokens();
                    await sleep(100);
                    enemyElem.classList.remove('moving');
                }
            }
        }
    }
    return hasEliminated;
}

function checkWinner(color) {
    const allHome = tokens[color].every(tok => tok.pos === 'home');
    if (allHome) {
        const pIndex = playerColors.indexOf(color);
        const name = activePlayerNames[pIndex] || `Player ${pIndex + 1}`;
        openModal(`
            <h2 style="color:#ffd700; margin-bottom:10px;">🏆 WINNER! 🏆</h2>
            <p style="font-size:18px; color:#fff; margin-bottom:20px;"><b>${name}</b> HAS WON THE GAME!</p>
            <button class="action-btn" style="background:#2ecc71; color:#fff;" onclick="exitGameToHome()">PLAY AGAIN</button>
        `);
        return true;
    }
    return false;
}

function finishMove(color, extraTurnGranted = false) {
    hasRolled = false;

    if (checkWinner(color)) return;

    if (diceValue === 6 || extraTurnGranted) {
        document.getElementById('diceBtn').innerText = '🎲';
        if (isAIMode && currentTurnIndex !== 0) setTimeout(rollDice, 600);
    } else {
        nextTurn();
    }
}

function nextTurn() {
    let loopCount = 0;
    do {
        currentTurnIndex = (currentTurnIndex + 1) % activePlayersCount;
        loopCount++;
    } while (playerLeftStatus[currentTurnIndex] && loopCount < activePlayersCount);

    hasRolled = false;
    document.getElementById('diceBtn').innerText = '🎲';
    updateTurnUI();

    if (isAIMode && currentTurnIndex !== 0) {
        setTimeout(rollDice, 600);
    }
}

function updateTurnUI() {
    const color = playerColors[currentTurnIndex];
    const name = activePlayerNames[currentTurnIndex] || `Player ${currentTurnIndex + 1}`;
    const turnDisplay = document.getElementById('turnDisplay');
    
    turnDisplay.innerText = `${name}'s Turn`;
    turnDisplay.style.color = color === 'yellow' ? '#f1c40f' : (color === 'green' ? '#2ecc71' : (color === 'blue' ? '#3498db' : '#e74c3c'));
}

async function autoCPUMove() {
    if (!isAIMode || currentTurnIndex === 0) return;

    const currentBotColor = playerColors[currentTurnIndex];
    const botTokens = tokens[currentBotColor];
    const pPath = paths[currentBotColor];

    let chosenIndex = -1;

    for (let i = 0; i < botTokens.length; i++) {
        let tok = botTokens[i];
        if (tok.pos >= 0 && tok.pos !== 'home' && (tok.pos + diceValue) < pPath.length) {
            let targetCell = pPath[tok.pos + diceValue];
            if (!safeCells.includes(targetCell)) {
                for (let enemyIdx = 0; enemyIdx < activePlayersCount; enemyIdx++) {
                    if (enemyIdx === currentTurnIndex || playerLeftStatus[enemyIdx]) continue;
                    let enemyColor = playerColors[enemyIdx];
                    if (tokens[enemyColor].some(eTok => eTok.pos >= 0 && eTok.pos !== 'home' && paths[enemyColor][eTok.pos] === targetCell)) {
                        chosenIndex = i;
                        break;
                    }
                }
            }
        }
        if (chosenIndex !== -1) break;
    }

    if (chosenIndex === -1 && diceValue === 6) {
        chosenIndex = botTokens.findIndex(tok => tok.pos === -1);
    }

    if (chosenIndex === -1) {
        chosenIndex = botTokens.findIndex(tok => {
            if (tok.pos === -1 && diceValue === 6) return true;
            if (tok.pos >= 0 && tok.pos !== 'home' && (tok.pos + diceValue) < pPath.length) return true;
            return false;
        });
    }

    if (chosenIndex !== -1) {
        await handleTokenClick(currentBotColor, chosenIndex);
    } else {
        nextTurn();
    }
}

function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

trigger1By1Animations('menuView');
