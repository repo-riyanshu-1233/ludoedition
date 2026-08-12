const IS_MAINTENANCE = false;
const WEBSITE_URL = "https://yourwebsite.com";

let currentPlayer = 1;
let lastRoll = 0;
let isRolling = false;

function checkMaintenance() {
  const maintenanceScreen = document.getElementById("maintenance-screen");
  const redirectBtn = document.getElementById("redirect-btn");

  if (IS_MAINTENANCE) {
    maintenanceScreen.classList.remove("hidden");
    redirectBtn.onclick = () => {
      window.location.href = WEBSITE_URL;
    };
  } else {
    maintenanceScreen.classList.add("hidden");
  }
}

function rollDice() {
  if (isRolling || IS_MAINTENANCE) return;
  isRolling = true;

  const dice = document.getElementById("dice");
  const diceValue = document.getElementById("dice-value");

  dice.classList.add("rolling");

  setTimeout(() => {
    lastRoll = Math.floor(Math.random() * 6) + 1;
    diceValue.textContent = lastRoll;
    dice.classList.remove("rolling");
    isRolling = false;

    handleTurnLogic(lastRoll);
  }, 500);
}

function handleTurnLogic(roll) {
  if (roll === 6) {
    updateStatus(`Player ${currentPlayer} got a 6! Extra turn.`);
  } else {
    updateStatus(`Player ${currentPlayer} rolled ${roll}`);
  }
}

function eliminatePlayer(attacker, victim) {
  updateStatus(`Player ${attacker} eliminated Player ${victim}! Extra turn granted!`);
  currentPlayer = attacker;
}

function switchTurn() {
  currentPlayer = currentPlayer === 1 ? 2 : 1;
  updateStatus(`Player ${currentPlayer}'s Turn`);
}

function handleTokenMove(player) {
  let simulatedElimination = false;

  if (simulatedElimination) {
    eliminatePlayer(currentPlayer, currentPlayer === 1 ? 2 : 1);
  } else if (lastRoll !== 6) {
    switchTurn();
  }
}

function updateStatus(msg) {
  document.getElementById("status-bar").textContent = msg;
}

window.onload = () => {
  checkMaintenance();
};
