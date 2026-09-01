const MAINTENANCE_MODE = true;
const MAINTENANCE_REDIRECT_URL = "https://arcade-edition.onrender.com/";

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

let gameActive = false;
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

let winnersList = [];
let finishedPlayers = [false, false, false, false];
let isSpectating = false;

let turnTimerInterval = null;
let turnTimeRemaining = 50;

let currentRoomCode = '';
let roomPlayersList = [];

let peer = null;
let connections = [];
let hostConn = null;
let isHost = false;
let myPlayerIndex = 0;

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

function generateRoomCode() {
    return Math.random().toString(36).substring(2, 8).toUpperCase();
}

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
    if (gameActive && document.getElementById('gameView').style.display === 'flex') {
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

function broadcastData(data) {
    if (!isFriendMode) return;
    if (isHost) {
        connections.forEach(conn => {
            if (conn && conn.open) conn.send(data);
        });
    } else if (hostConn && hostConn.open) {
        hostConn.send(data);
    }
}

function syncGameState() {
    if (!isFriendMode) return;
    broadcastData({
        type: 'STATE_SYNC',
        tokens: tokens,
        currentTurnIndex: currentTurnIndex,
        finishedPlayers: finishedPlayers,
        playerLeftStatus: playerLeftStatus,
        winnersList: winnersList,
        hasRolled: hasRolled,
        diceValue: diceValue
    });
}

function handlePlayerLeft(idx) {
    if (idx < 0 || idx >= activePlayersCount) return;
    if (playerLeftStatus[idx]) return;

    playerLeftStatus[idx] = true;
    const color = playerColors[idx];
    const pName = activePlayerNames[idx] || `PLAYER_${idx + 1}`;

    const leftSpan = document.getElementById(`left-text-${color}`);
    if (leftSpan) leftSpan.innerText = `${pName}_LEFT`;
    const overlay = document.getElementById(`overlay-${color}`);
    if (overlay) overlay.style.display = 'flex';

    tokens[color].forEach((tok, index) => {
        const elem = document.getElementById(`tok-${color}-${index}`);
        if (elem) elem.style.display = 'none';
    });

    showToast(`${pName} Left`);
    renderTokens();

    let activeStillPlaying = [];
    for (let i = 0; i < activePlayersCount; i++) {
        if (!finishedPlayers[i] && !playerLeftStatus[i]) {
            activeStillPlaying.push(i);
        }
    }

    if (activeStillPlaying.length <= 1) {
        if (activeStillPlaying.length === 1) {
            const winnerIdx = activeStillPlaying[0];
            if (!winnersList.includes(winnerIdx)) winnersList.push(winnerIdx);
            for (let i = 0; i < activePlayersCount; i++) {
                if (i !== winnerIdx && !winnersList.includes(i)) winnersList.push(i);
            }
        }
        stopTurnTimer();
        setTimeout(showFinalLeaderboard, 800);
        return;
    }

    if (currentTurnIndex === idx) {
        hasRolled = false;
        isAnimating = false;
        if (!isFriendMode || currentTurnIndex === myPlayerIndex) {
            nextTurn();
        }
    }
}

function handlePeerMessage(data, senderIdx) {
    if (data.type === 'DICE_ROLL') {
        
        performDiceRoll(data.val);
    } else if (data.type === 'TOKEN_MOVE') {
        handleTokenClick(data.color, data.index, true);
    } else if (data.type === 'PLAYER_LEFT') {
        handlePlayerLeft(data.playerIdx);
    } else if (data.type === 'STATE_SYNC') {
        tokens = data.tokens;
        currentTurnIndex = data.currentTurnIndex;
        finishedPlayers = data.finishedPlayers;
        playerLeftStatus = data.playerLeftStatus;
        winnersList = data.winnersList;
        hasRolled = data.hasRolled;
        diceValue = data.diceValue;
        
        document.getElementById('diceBtn').innerText = hasRolled ? diceValue : '🎲';
        
        updateTurnUI();
        renderTokens();
        resetTurnTimer();
    }
}

function resetTurnTimer() {
    clearInterval(turnTimerInterval);
    if (!gameActive) return;
    turnTimeRemaining = 50;
    const secSpan = document.getElementById('timerSec');
    if (secSpan) secSpan.innerText = turnTimeRemaining;

    turnTimerInterval = setInterval(() => {
        if (!gameActive) {
            clearInterval(turnTimerInterval);
            return;
        }
        turnTimeRemaining--;
        if (secSpan) secSpan.innerText = turnTimeRemaining;

        if (turnTimeRemaining <= 0) {
            clearInterval(turnTimerInterval);
            showToast(`${activePlayerNames[currentTurnIndex] || 'Player'} Time Out!`);
            hasRolled = false;
            isAnimating = false;
            if (!isFriendMode || currentTurnIndex === myPlayerIndex) {
                nextTurn();
            }
        }
    }, 1000);
}

function stopTurnTimer() {
    clearInterval(turnTimerInterval);
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
        <button class="action-btn" onclick="window.open('https://instagram.com/riynshu1233', '_blank')"><i class="fa-brands fa-instagram"></i> Instagram</button>
        <button class="action-btn" onclick="window.open('mailto:riyanshusinh@gmail.com', '_blank')"><i class="fa-solid fa-envelope"></i> Email Us</button>
        <button class="action-btn" style="background:#e74c3c; color:#fff;" onclick="openTopMenu()">Back</button>
    `);
}

function openAboutUs() {
    openModal(`
        <h3>About Us</h3>
        <p style="margin:15px 0; font-size:13px; color:#ddd; line-height:1.6;">
            Welcome to Ludo Edition! Designed by riyanshu.devl.Ai, local multiplayer, multi-bot AI mode , and custom room features.
        </p>
        <button class="action-btn" style="background:#e74c3c; color:#fff;" onclick="openTopMenu()">Back</button>
    `);
}

function openOtherGames() {
    openModal(`
        <h3>Other Games</h3>
        <p style="margin:15px 0; font-size:14px;">Explore more awesome games on our official platform!</p>
        <button class="action-btn" style="background:#2ecc71; color:#fff;" onclick="window.open('https://arcade-edition.onrender.com/', '_blank')">Check</button>
        <button class="action-btn" style="background:#e74c3c; color:#fff;" onclick="openTopMenu()">Back</button>
    `);
}

function openHelpModal() {
    openModal(`
        <h3>How to Play</h3>
        <p style="margin:15px 0; font-size:12px; color:#ccc; text-align:left; line-height:1.5;">
            1. Roll 6 to move token out of base.<br>
            2. Tap token to move step-by-step.<br>
            3. Eliminate opponent tokens to get an extra turn.<br>
            4. Reach center HOME to get an extra turn.<br>
            5. Reach HOME with all 4 tokens to WIN!
        </p>
        <button class="action-btn" style="background:#e74c3c; color:#fff;" onclick="closeModal()">Close</button>
    `);
}

function openPassNPlayPopup() {
    openModal(`
        <h3>Select Players</h3>
        <p style="margin: 10px 0; font-size:12px; color:#aaa">Pass N Play Local Mode</p>
        <button class="action-btn" onclick="openPassNPlayNames(2)">2 Players</button>
        <button class="action-btn" onclick="openPassNPlayNames(3)">3 Players</button>
        <button class="action-btn" onclick="openPassNPlayNames(4)">4 Players</button>
        <button class="action-btn" style="background:#e74c3c; color:#fff;" onclick="closeModal()">Cancel</button>
    `);
}

function openPassNPlayNames(count) {
    let inputsHTML = `<h3>Enter Player Names</h3>`;
    for(let i = 1; i <= count; i++) {
        inputsHTML += `<input type="text" id="pNameInput_${i}" class="modal-input" placeholder="Player ${i} Name" value="Player ${i}">`;
    }
    inputsHTML += `
        <button class="action-btn" style="background:#2ecc71; color:#fff;" onclick="startPassNPlayWithNames(${count})">Start Game</button>
        <button class="action-btn" style="background:#e74c3c; color:#fff;" onclick="openPassNPlayPopup()">Back</button>
    `;
    openModal(inputsHTML);
}

function startPassNPlayWithNames(count) {
    activePlayersCount = count;
    isAIMode = false;
    isFriendMode = false;
    activePlayerNames = [];
    for(let i = 1; i <= count; i++) {
        const val = document.getElementById(`pNameInput_${i}`).value.trim();
        activePlayerNames.push(val || `Player ${i}`);
    }
    launchGame();
}

function openComputerMenuPopup() {
    openModal(`
        <h3>Vs Computer</h3>
        <p style="margin: 10px 0; font-size:12px; color:#aaa">1 Real Player + Smart AI Bots</p>
        <input type="text" id="aiPlayerName" class="modal-input" placeholder="Enter Your Name" value="You">
        <button class="action-btn" onclick="startAIModeWithNames(2)">2 Players (You + 1 AI)</button>
        <button class="action-btn" onclick="startAIModeWithNames(3)">3 Players (You + 2 AI)</button>
        <button class="action-btn" onclick="startAIModeWithNames(4)">4 Players (You + 3 AI)</button>
        <button class="action-btn" style="background:#e74c3c; color:#fff;" onclick="closeModal()">Cancel</button>
    `);
}

function startAIModeWithNames(count) {
    const userVal = document.getElementById('aiPlayerName').value.trim() || 'You';
    activePlayersCount = count;
    isAIMode = true;
    isFriendMode = false;
    activePlayerNames = [userVal];
    for(let i = 2; i <= count; i++) {
        activePlayerNames.push(`Bot ${i-1}`);
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
    currentRoomCode = generateRoomCode();
    isHost = true;
    myPlayerIndex = 0;
    roomPlayersList = [userName];
    connections = [];

    closeModal();

    if (peer) peer.destroy();
    peer = new Peer(`ludo-king-room-${currentRoomCode}`);

    peer.on('open', () => {
        openFullRoomLobby();
    });

    peer.on('connection', (conn) => {
        conn.on('data', (data) => {
            if (data.type === 'JOIN_REQ') {
                if (roomPlayersList.length >= 4) {
                    conn.send({ type: 'REJECT', reason: 'Room Full' });
                    setTimeout(() => conn.close(), 500);
                    return;
                }

                const newIdx = roomPlayersList.length;
                conn.playerIndex = newIdx;
                connections.push(conn);
                roomPlayersList.push(data.name);

                connections.forEach(c => {
                    if (c && c.open) {
                        c.send({
                            type: 'LOBBY_UPDATE',
                            players: roomPlayersList
                        });
                    }
                });

                renderWoodenLobbyList();
            } else {
                handlePeerMessage(data, conn.playerIndex);
                connections.forEach(c => {
                    if (c !== conn && c && c.open) c.send(data);
                });
            }
        });

        conn.on('close', () => {
            const idx = conn.playerIndex;
            if (idx !== undefined) {
                if (gameActive) {
                    handlePlayerLeft(idx);
                    broadcastData({ type: 'PLAYER_LEFT', playerIdx: idx });
                } else {
                    roomPlayersList.splice(idx, 1);
                    connections = connections.filter(c => c !== conn);
                    connections.forEach((c, newI) => c.playerIndex = newI + 1);
                    connections.forEach(c => {
                        if (c && c.open) c.send({ type: 'LOBBY_UPDATE', players: roomPlayersList });
                    });
                    renderWoodenLobbyList();
                }
            }
        });
    });

    peer.on('error', () => {
        alert('Could not create room. Try again.');
    });
}

function openEnterCodeScreen() {
    const name = document.getElementById('pNameInput') ? document.getElementById('pNameInput').value.trim() : '';
    openModal(`
        <h3>Join Room</h3>
        <input type="text" id="pNameJoin" class="modal-input" placeholder="Enter Your Name" value="${name}">
        <input type="text" id="rCodeInput" class="modal-input" style="text-transform:uppercase" placeholder="Enter 6-Char Room Code" maxlength="6">
        <button class="action-btn" style="background:#2ecc71; color:#fff;" onclick="submitJoinRoom()">Join</button>
        <button class="action-btn" style="background:#e74c3c; color:#fff;" onclick="openFriendMenu()">Back</button>
    `);
}

function submitJoinRoom() {
    const userName = document.getElementById('pNameJoin').value.trim() || 'Player 2';
    const code = document.getElementById('rCodeInput').value.trim().toUpperCase();

    if (code.length < 6) {
        alert('Please enter valid 6-character room code!');
        return;
    }

    currentRoomCode = code;
    isHost = false;

    closeModal();
    openModal(`
        <h3>Joining Room...</h3>
        <div style="border: 4px solid #f3f3f3; border-top: 4px solid #ffb347; border-radius: 50%; width: 35px; height: 35px; animation: spin 1s linear infinite; margin: 20px auto;"></div>
        <style>@keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }</style>
    `);

    if (peer) peer.destroy();
    peer = new Peer();

    peer.on('open', () => {
        hostConn = peer.connect(`ludo-king-room-${code}`);

        hostConn.on('open', () => {
            closeModal();
            hostConn.send({ type: 'JOIN_REQ', name: userName });
            openFullRoomLobby();
        });

        hostConn.on('data', (data) => {
            if (data.type === 'LOBBY_UPDATE') {
                roomPlayersList = data.players;
                myPlayerIndex = roomPlayersList.indexOf(userName);
                if (myPlayerIndex === -1) myPlayerIndex = roomPlayersList.length - 1;
                renderWoodenLobbyList();
            } else if (data.type === 'GAME_START') {
                activePlayerNames = data.players;
                activePlayersCount = data.count;
                playerColors = data.colors;
                currentTurnIndex = data.startTurn;
                isAIMode = false;
                isFriendMode = true;
                document.getElementById('lobbyView').style.display = 'none';
                launchGame(true);
            } else {
                handlePeerMessage(data);
            }
        });

        hostConn.on('close', () => {
            showToast('Host disconnected!');
        });
    });

    peer.on('error', () => {
        closeModal();
        alert('Room not found or Host offline!');
    });
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
    if (isHost) {
        if (roomPlayersList.length >= 2) {
            startBtn.style.display = 'block';
            waitingMsg.style.display = 'none';
        } else {
            startBtn.style.display = 'none';
            waitingMsg.innerText = 'Waiting for friends to join...';
            waitingMsg.style.display = 'block';
        }
    } else {
        startBtn.style.display = 'none';
        waitingMsg.innerText = 'Waiting for Host to start game...';
        waitingMsg.style.display = 'block';
    }
}

function closeLobbyAndReturn() {
    if (peer) peer.destroy();
    document.getElementById('lobbyView').style.display = 'none';
}

function startRoomGame() {
    if (!isHost) return;
    activePlayerNames = [...roomPlayersList];
    activePlayersCount = roomPlayersList.length;
    isAIMode = false;
    isFriendMode = true;

    setupRandomColorsAndTurn();

    broadcastData({
        type: 'GAME_START',
        players: activePlayerNames,
        count: activePlayersCount,
        colors: playerColors,
        startTurn: currentTurnIndex
    });

    document.getElementById('lobbyView').style.display = 'none';
    launchGame(true);
}

function setupRandomColorsAndTurn() {
    const defaultColors = ['red', 'green', 'yellow', 'blue'];
    let availableColors = defaultColors.slice(0, activePlayersCount);
    for (let i = availableColors.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [availableColors[i], availableColors[j]] = [availableColors[j], availableColors[i]];
    }
    playerColors = availableColors;
    currentTurnIndex = Math.floor(Math.random() * activePlayersCount);
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

function launchGame(skipSetup = false) {
    closeModal();
    gameActive = true;
    document.getElementById('menuView').style.display = 'none';
    
    const gameView = document.getElementById('gameView');
    gameView.style.display = 'flex';
    
    trigger1By1Animations('gameView');

    document.getElementById('topMenuBtn').style.display = 'none';
    document.getElementById('topExitBtn').style.display = 'flex';
    
    if (!skipSetup) {
        setupRandomColorsAndTurn();
    }

    hasRolled = false;
    isAnimating = false;
    playerLeftStatus = [false, false, false, false];
    finishedPlayers = [false, false, false, false];
    winnersList = [];
    isSpectating = false;

    if (!isFriendMode) myPlayerIndex = 0;

    ['red', 'green', 'yellow', 'blue'].forEach(c => {
        document.getElementById(`overlay-${c}`).style.display = 'none';
        const tag = document.getElementById(`houseName${c.charAt(0).toUpperCase() + c.slice(1)}`);
        if (tag) tag.style.display = 'none';
    });

    for (let i = 0; i < activePlayersCount; i++) {
        const c = playerColors[i];
        const tag = document.getElementById(`houseName${c.charAt(0).toUpperCase() + c.slice(1)}`);
        if (tag) {
            tag.innerText = activePlayerNames[i] || `PLAYER ${i + 1}`;
            tag.style.display = 'block';
        }
    }

    tokens = {
        red: [{pos: -1}, {pos: -1}, {pos: -1}, {pos: -1}],
        green: [{pos: -1}, {pos: -1}, {pos: -1}, {pos: -1}],
        yellow: [{pos: -1}, {pos: -1}, {pos: -1}, {pos: -1}],
        blue: [{pos: -1}, {pos: -1}, {pos: -1}, {pos: -1}]
    };

    createTokenDOM();
    updateTurnUI();
    resetTurnTimer();
    setTimeout(renderTokens, 60);

    if (isAIMode && currentTurnIndex !== 0) {
        setTimeout(() => { if (gameActive) performDiceRoll(); }, 800);
    }
}

function exitGameToHome() {
    gameActive = false;
    stopTurnTimer();
    if (peer) peer.destroy();
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
    if (!gameActive || document.getElementById('gameView').style.display !== 'flex') return;

    const spotGroup = {};
    const currentActiveColor = playerColors[currentTurnIndex];

    for (let i = 0; i < activePlayersCount; i++) {
        const color = playerColors[i];

        if (playerLeftStatus[i]) {
            tokens[color].forEach((tok, index) => {
                const elem = document.getElementById(`tok-${color}-${index}`);
                if (elem) elem.style.display = 'none';
            });
            continue;
        }
        
        tokens[color].forEach((tok, index) => {
            let key = '';
            if (tok.pos === -1) {
                key = `${color}-base-${index}`;
            } else if (tok.pos === 'home') {
                key = `home-${color}`;
            } else {
                key = paths[color][tok.pos];
            }

            if (!spotGroup[key]) spotGroup[key] = [];
            spotGroup[key].push({ color, index, pos: tok.pos });
        });
    }

    Object.keys(spotGroup).forEach(key => {
        const group = spotGroup[key];

        group.sort((a, b) => {
            if (a.color === currentActiveColor) return 1;
            if (b.color === currentActiveColor) return -1;
            return 0;
        });

        group.forEach((item, grpIdx) => {
            let targetSpot;
            if (key.includes('base')) {
                targetSpot = document.getElementById(key);
            } else if (key.startsWith('home-')) {
                const homeColor = key.split('-')[1];
                targetSpot = document.getElementById(`home-tri-${homeColor}`);
            } else {
                targetSpot = document.getElementById(key);
            }

            const elem = document.getElementById(`tok-${item.color}-${item.index}`);
            if (elem) {
                elem.style.display = 'block';

                const canBeMoved = hasRolled && (
                    (item.pos === -1 && diceValue === 6) ||
                    (typeof item.pos === 'number' && item.pos >= 0 && (item.pos + diceValue) < paths[item.color].length)
                );

                if (item.color === currentActiveColor && !finishedPlayers[currentTurnIndex] && item.pos !== 'home' && canBeMoved) {
                    elem.classList.add('active-turn-token');
                } else {
                    elem.classList.remove('active-turn-token');
                }

                placeTokenCentered(elem, targetSpot, grpIdx, group.length, item.color, key);
            }
        });
    });
}

function placeTokenCentered(tokenElem, spotElem, grpIdx = 0, totalInGroup = 1, color = 'red', key = '') {
    if (!spotElem) return;
    const rect = spotElem.getBoundingClientRect();
    const board = document.getElementById('board');
    const boardRect = board.getBoundingClientRect();
    
    const borderLeft = board.clientLeft || 0;
    const borderTop = board.clientTop || 0;

    let centerX = (rect.left - boardRect.left - borderLeft) + (rect.width / 2);
    let centerY = (rect.top - boardRect.top - borderTop) + (rect.height / 2);

    if (key.startsWith('home-')) {
        const offsets = {
            red:    [{x:-12, y:-6}, {x:-12, y:6}, {x:-20, y:0}, {x:-6, y:0}],
            green:  [{x:-6, y:-12}, {x:6, y:-12}, {x:0, y:-20}, {x:0, y:-6}],
            yellow: [{x:12, y:-6}, {x:12, y:6}, {x:20, y:0}, {x:6, y:0}],
            blue:   [{x:-6, y:12}, {x:6, y:12}, {x:0, y:20}, {x:0, y:6}]
        };
        const cOffsets = offsets[color] || offsets.red;
        const off = cOffsets[grpIdx % cOffsets.length];
        centerX += off.x;
        centerY += off.y;
    } else if (totalInGroup > 1 && !spotElem.id.includes('base')) {
        const offsetVal = 5;
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

    tokenElem.style.zIndex = color === playerColors[currentTurnIndex] ? (50 + grpIdx) : (10 + grpIdx);

    tokenElem.style.left = centerX + 'px';
    tokenElem.style.top = centerY + 'px';
}

function onDiceClick() {
    if (!gameActive || hasRolled || isAnimating) return;
    if (finishedPlayers[currentTurnIndex]) return;
    if (isAIMode && currentTurnIndex !== 0) return;
    if (isFriendMode && currentTurnIndex !== myPlayerIndex) return;

    if (playerLeftStatus[currentTurnIndex]) {
        if (!isFriendMode || currentTurnIndex === myPlayerIndex) {
            nextTurn();
        }
        return;
    }

    performDiceRoll();
}

function performDiceRoll(predeterminedVal = null) {
    if (!gameActive) return;
    stopTurnTimer();
    isAnimating = true;
    const diceBtn = document.getElementById('diceBtn');
    diceBtn.classList.add('rolling');

    
    const isRemoteRoll = (isFriendMode && predeterminedVal !== null);

    const rollInterval = setInterval(() => {
        diceBtn.innerText = Math.floor(Math.random() * 6) + 1;
    }, 50);

    setTimeout(() => {
        clearInterval(rollInterval);
        if (!gameActive) return;

        diceValue = predeterminedVal !== null ? predeterminedVal : (Math.floor(Math.random() * 6) + 1);
        diceBtn.innerText = diceValue;
        diceBtn.classList.remove('rolling');
        hasRolled = true;
        isAnimating = false;

        if (isFriendMode && predeterminedVal === null) {
            broadcastData({ type: 'DICE_ROLL', val: diceValue });
        }

        checkMovePossibility(isRemoteRoll);
    }, 500);
}

function checkMovePossibility(isRemoteRoll = false) {
    if (!gameActive) return;
    const color = playerColors[currentTurnIndex];
    const pPath = paths[color];
    let movableTokenIndices = [];

    tokens[color].forEach((tok, idx) => {
        if (tok.pos === 'home') return;
        if (tok.pos === -1 && diceValue === 6) movableTokenIndices.push(idx);
        if (typeof tok.pos === 'number' && tok.pos >= 0 && (tok.pos + diceValue) < pPath.length) movableTokenIndices.push(idx);
    });

    renderTokens();
    const activeTurnAtRoll = currentTurnIndex;

    if (movableTokenIndices.length === 0) {
        setTimeout(() => { 
            if (gameActive) {
                if (!isFriendMode || (!isRemoteRoll && activeTurnAtRoll === myPlayerIndex)) {
                    nextTurn();
                }
            } 
        }, 1000);
    } else if (movableTokenIndices.length === 1) {
        resetTurnTimer();
        setTimeout(() => {
            if (!gameActive) return;
            if (isAIMode && activeTurnAtRoll !== 0) {
                autoCPUMove();
            } else if (isFriendMode && (isRemoteRoll || activeTurnAtRoll !== myPlayerIndex)) {
                // Remote player sirf wait karega, uske system ko token apne aap click nahi karne dena hai
            } else {
                handleTokenClick(color, movableTokenIndices[0]);
            }
        }, 400);
    } else {
        resetTurnTimer();
        if (isAIMode && currentTurnIndex !== 0) {
            setTimeout(() => { if (gameActive) autoCPUMove(); }, 600);
        }
    }
}

async function handleTokenClick(color, index, isRemote = false, isAICall = false) {
    if (!gameActive || !hasRolled || isAnimating) return;
    if (color !== playerColors[currentTurnIndex]) return;
    if (finishedPlayers[currentTurnIndex]) return;
    if (isFriendMode && !isRemote && currentTurnIndex !== myPlayerIndex) return;
    if (isAIMode && currentTurnIndex !== 0 && !isAICall) return;

    let tok = tokens[color][index];
    const pPath = paths[color];
    const elem = document.getElementById(`tok-${color}-${index}`);

    let canBeMoved = false;
    if (tok.pos === -1 && diceValue === 6) canBeMoved = true;
    if (typeof tok.pos === 'number' && tok.pos >= 0 && (tok.pos + diceValue) < pPath.length) canBeMoved = true;

    if (!canBeMoved) return;

    stopTurnTimer();

    if (isFriendMode && !isRemote) {
        broadcastData({ type: 'TOKEN_MOVE', color: color, index: index });
    }

    let eliminated = false;
    let homeReachedExtraTurn = false;

    if (tok.pos === -1 && diceValue === 6) {
        isAnimating = true;
        tok.pos = 0;
        elem.classList.add('moving');
        renderTokens();
        await sleep(220);
        elem.classList.remove('moving');
        isAnimating = false;
        finishMove(color, false);
    } else if (typeof tok.pos === 'number' && tok.pos >= 0 && (tok.pos + diceValue) < pPath.length) {
        isAnimating = true;
        elem.classList.add('moving');

        const targetPos = tok.pos + diceValue;
        while (tok.pos < targetPos && gameActive) {
            tok.pos++;
            renderTokens();
            await sleep(200);
        }

        if (tok.pos === pPath.length - 1) {
            tok.pos = 'home';
            homeReachedExtraTurn = true;
            showToast(`${activePlayerNames[currentTurnIndex] || 'Player'} reached HOME! +1 Turn`);
        }
        
        elem.classList.remove('moving');
        eliminated = await checkElimination(color, tok.pos);
        isAnimating = false;
        finishMove(color, eliminated || homeReachedExtraTurn);
    }
}

async function checkElimination(currentColor, pos) {
    if (!gameActive || pos === 'home') return false;
    const currentCell = paths[currentColor][pos];
    if (safeCells.includes(currentCell)) return false;

    let hasEliminated = false;

    for (let i = 0; i < activePlayersCount; i++) {
        if (playerLeftStatus[i] || finishedPlayers[i]) continue;
        const enemyColor = playerColors[i];
        if (enemyColor === currentColor) continue;

        for (let j = 0; j < tokens[enemyColor].length; j++) {
            let enemyTok = tokens[enemyColor][j];
            if (typeof enemyTok.pos === 'number' && enemyTok.pos >= 0) {
                const enemyCell = paths[enemyColor][enemyTok.pos];
                if (enemyCell === currentCell) {
                    hasEliminated = true;
                    showToast(`${activePlayerNames[currentTurnIndex] || 'Player'} eliminated ${activePlayerNames[i]}! +1 Turn`);
                    const enemyElem = document.getElementById(`tok-${enemyColor}-${j}`);
                    enemyElem.classList.add('moving');
                    while (enemyTok.pos > 0 && gameActive) {
                        enemyTok.pos--;
                        renderTokens();
                        await sleep(40);
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
    const pIndex = playerColors.indexOf(color);
    if (finishedPlayers[pIndex]) return true;

    const allHome = tokens[color].every(tok => tok.pos === 'home');
    if (allHome) {
        finishedPlayers[pIndex] = true;
        winnersList.push(pIndex);

        const rankSuffixes = ['1st', '2nd', '3rd', '4th'];
        const positionStr = rankSuffixes[winnersList.length - 1] || `${winnersList.length}th`;
        const winnerName = activePlayerNames[pIndex] || `Player ${pIndex + 1}`;

        if (pIndex === myPlayerIndex) {
            openModal(`
                <h2 style="color:#ffd700; margin-bottom:10px;">🏆 CONGRATULATIONS! 🏆</h2>
                <p style="font-size:16px; color:#fff; margin-bottom:20px;">You win at <b>${positionStr}</b> Position!</p>
                <button class="action-btn" style="background:#2ecc71; color:#fff;" onclick="spectateGame()">SPECTATE</button>
                <button class="action-btn" style="background:#e74c3c; color:#fff;" onclick="exitGameToHome()">EXIT TO HOME</button>
            `);
        } else {
            showToast(`${winnerName} finished at ${positionStr} Place!`);
        }

        checkRemainingPlayersGameEnd();
        return true;
    }
    return false;
}

function spectateGame() {
    isSpectating = true;
    closeModal();
}

function checkRemainingPlayersGameEnd() {
    let activeStillPlaying = [];
    for (let i = 0; i < activePlayersCount; i++) {
        if (!finishedPlayers[i] && !playerLeftStatus[i]) {
            activeStillPlaying.push(i);
        }
    }

    if (activeStillPlaying.length <= 1) {
        if (activeStillPlaying.length === 1) {
            const loserIdx = activeStillPlaying[0];
            if (!winnersList.includes(loserIdx)) winnersList.push(loserIdx);
            for (let i = 0; i < activePlayersCount; i++) {
                if (i !== loserIdx && !winnersList.includes(i)) winnersList.push(i);
            }
        }

        stopTurnTimer();
        setTimeout(showFinalLeaderboard, 1200);
        return true;
    }
    return false;
}

function showFinalLeaderboard() {
    stopTurnTimer();
    let lbHTML = `
        <h2 style="color:#ffd700; margin-bottom:10px;"><i class="fa-solid fa-trophy"></i> GAME OVER</h2>
        <p style="font-size:13px; color:#ccc; margin-bottom:15px;">Final Leaderboard Ranks</p>
        <div class="leaderboard-list">
    `;

    const rankTitles = ['🥇 1st Place', '🥈 2nd Place', '🥉 3rd Place', ' Loser'];
    const rankClasses = ['rank-1', 'rank-2', 'rank-3', 'rank-loser'];

    winnersList.forEach((pIdx, idx) => {
        const pName = activePlayerNames[pIdx] || `Player ${pIdx + 1}`;
        const title = idx === winnersList.length - 1 && activePlayersCount > 1 ? ' Loser' : (rankTitles[idx] || `${idx + 1}th Place`);
        const cls = idx === winnersList.length - 1 && activePlayersCount > 1 ? 'rank-loser' : (rankClasses[idx] || 'rank-2');

        lbHTML += `
            <div class="lb-card ${cls}">
                <span>${title}</span>
                <span>${pName}</span>
            </div>
        `;
    });

    lbHTML += `
        </div>
        <button class="action-btn" style="background:#2ecc71; color:#fff;" onclick="exitGameToHome()">MAIN MENU</button>
    `;

    openModal(lbHTML);
}

function finishMove(color, extraTurnGranted = false) {
    hasRolled = false;

    if (isFriendMode && currentTurnIndex !== myPlayerIndex) return;

    if (isFriendMode) {
        syncGameState();
    }

    if (checkWinner(color)) {
        if (!checkRemainingPlayersGameEnd()) {
            nextTurn();
        }
        return;
    }

    if (diceValue === 6 || extraTurnGranted) {
        document.getElementById('diceBtn').innerText = '🎲';
        renderTokens();
        resetTurnTimer();
        if (isAIMode && currentTurnIndex !== 0) {
            setTimeout(() => { if (gameActive) performDiceRoll(); }, 600);
        }
        if (isFriendMode) {
            syncGameState();
        }
    } else {
        nextTurn();
    }
}

function nextTurn() {
    if (!gameActive) return;

    if (isFriendMode && currentTurnIndex !== myPlayerIndex) return;

    let loopCount = 0;
    do {
        currentTurnIndex = (currentTurnIndex + 1) % activePlayersCount;
        loopCount++;
    } while ((playerLeftStatus[currentTurnIndex] || finishedPlayers[currentTurnIndex]) && loopCount < activePlayersCount);

    hasRolled = false;
    isAnimating = false;
    document.getElementById('diceBtn').innerText = '🎲';
    updateTurnUI();
    renderTokens();

    if (isFriendMode) {
        syncGameState();
    }

    if (checkRemainingPlayersGameEnd()) return;

    resetTurnTimer();

    if (isAIMode && currentTurnIndex !== 0 && !playerLeftStatus[currentTurnIndex] && !finishedPlayers[currentTurnIndex]) {
        setTimeout(() => { if (gameActive) performDiceRoll(); }, 600);
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
    if (!gameActive || !isAIMode || currentTurnIndex === 0 || finishedPlayers[currentTurnIndex]) return;

    const currentBotColor = playerColors[currentTurnIndex];
    const botTokens = tokens[currentBotColor];
    const pPath = paths[currentBotColor];

    let chosenIndex = -1;
    let highestScore = -9999;

    for (let i = 0; i < botTokens.length; i++) {
        let tok = botTokens[i];
        let score = 0;

        if (tok.pos === -1) {
            if (diceValue === 6) score = 400;
            else continue;
        } else if (typeof tok.pos === 'number' && tok.pos >= 0 && (tok.pos + diceValue) < pPath.length) {
            const targetPos = tok.pos + diceValue;
            const targetCell = pPath[targetPos];

            if (targetPos < pPath.length - 1 && !safeCells.includes(targetCell)) {
                for (let eIdx = 0; eIdx < activePlayersCount; eIdx++) {
                    if (eIdx === currentTurnIndex || playerLeftStatus[eIdx] || finishedPlayers[eIdx]) continue;
                    let enemyColor = playerColors[eIdx];
                    if (tokens[enemyColor].some(eTok => typeof eTok.pos === 'number' && eTok.pos >= 0 && paths[enemyColor][eTok.pos] === targetCell)) {
                        score += 2000;
                    }
                }
            }

            if (targetPos === pPath.length - 1) {
                score += 1500;
            }

            if (safeCells.includes(targetCell)) {
                score += 500;
            }

            for (let eIdx = 0; eIdx < activePlayersCount; eIdx++) {
                if (eIdx === currentTurnIndex || playerLeftStatus[eIdx] || finishedPlayers[eIdx]) continue;
                let enemyColor = playerColors[eIdx];
                tokens[enemyColor].forEach(eTok => {
                    if (typeof eTok.pos === 'number' && eTok.pos >= 0) {
                        let eCell = paths[enemyColor][eTok.pos];
                        let dist = pPath.indexOf(eCell) - targetPos;
                        if (dist > 0 && dist <= 6) {
                            score += 350;
                        }
                    }
                });
            }

            score += targetPos * 10;
        } else {
            continue;
        }

        if (score > highestScore) {
            highestScore = score;
            chosenIndex = i;
        }
    }

    if (chosenIndex !== -1) {
        await handleTokenClick(currentBotColor, chosenIndex, false, true);
    } else {
        nextTurn();
    }
}

function sleep(ms) {
    return new Promise(resolve => {
        const t = setTimeout(resolve, ms);
        if (!gameActive) clearTimeout(t);
    });
}

trigger1By1Animations('menuView');
