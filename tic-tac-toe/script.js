// STATE
// experimental conditions
const durations = {
    short: 5000,
    long: 10000
};
const conditions = [
    { prominence: "low",  animation: "slide", duration: "short" },
    { prominence: "low",  animation: "slide", duration: "long" },
    { prominence: "low",  animation: "fade",  duration: "short" },
    { prominence: "low",  animation: "fade",  duration: "long" },
    { prominence: "low",  animation: "pop",   duration: "short" },
    { prominence: "low",  animation: "pop",   duration: "long" },

    { prominence: "high", animation: "slide", duration: "short" },
    { prominence: "high", animation: "slide", duration: "long" },
    { prominence: "high", animation: "fade",  duration: "short" },
    { prominence: "high", animation: "fade",  duration: "long" },
    { prominence: "high", animation: "pop",   duration: "short" },
    { prominence: "high", animation: "pop",   duration: "long" }
];
const trials = [...conditions].sort(() => Math.random() - 0.5);

// starting state and win condition
let boardState = ["", "", "", "", "", "", "", "", ""];
let currentPlayer = "X";
let isGameActive = true;
const winningConditions = [
    [0, 1, 2], [3, 4, 5], [6, 7, 8], // Rows
    [0, 3, 6], [1, 4, 7], [2, 5, 8], // Columns
    [0, 4, 8], [2, 4, 6]             // Diagonals
];

let currentTrial = null;
let toastTimeout = null;



// DOM
const boardElement = document.getElementById('board');
const cells = document.querySelectorAll('.cell');
const statusText = document.getElementById('status');
const restartBtn = document.getElementById('restart-btn');
const toast = document.getElementById("toast");
const dismissButton = document.getElementById("dismissButton");
const openButton = document.getElementById("openButton");

boardElement.addEventListener('click', handleCellClick);
restartBtn.addEventListener('click', restartGame);
dismissButton.addEventListener("click", finishToast("dismiss"));
openButton.addEventListener("click", finishToast("open"));


// FUNCTIONS
function handleCellClick(e) {
    const clickedCell = e.target;
    const clickedCellIndex = parseInt(clickedCell.getAttribute('data-index'));

    // check if cell is occupied or game is over
    if (boardState[clickedCellIndex] !== "" || !isGameActive) {
        return;
    }

    updateCell(clickedCell, clickedCellIndex);  // add user selection to grid
    checkForWinner();   // check for winner
} // handleCellClick

function updateCell(cell, index) {
    // update board
    boardState[index] = currentPlayer;
    cell.textContent = currentPlayer;

    cell.classList.add(currentPlayer.toLowerCase());    // style
} // updateCell

function changePlayer() {
    currentPlayer = currentPlayer === "X" ? "O" : "X";
    statusText.textContent = `Player ${currentPlayer}'s turn`;

    if (currentPlayer === "O"){
        opponentSelection();
        checkForWinner();
    }
} // changePlayer

function opponentSelection(){
    const emptyIndices = boardState     // get a list of empty cells idx
        .map((item, index) => item === '' ? index : -1)
        .filter(index => index !== -1);

    const randomIndex = emptyIndices[Math.floor(Math.random() * emptyIndices.length)];      // select one

    updateCell(cells[randomIndex], randomIndex);
} // randomSelection

function checkForWinner() {
    let roundWon = false;   // does the round get won?
    for (let i = 0; i < winningConditions.length; i++) {
        const [a, b, c] = winningConditions[i];
        if (boardState[a] === "" || boardState[b] === "" || boardState[c] === "") {
            continue;
        }
        if (boardState[a] === boardState[b] && boardState[b] === boardState[c]) {
            roundWon = true;
            break;
        }
    }

    if (roundWon) {     // if round won
        statusText.textContent = `Player ${currentPlayer} Wins! 🎉`;
        isGameActive = false;
        return;
    }

    if (!boardState.includes("")) {     // check for a tie game
        statusText.textContent = "It's a Draw! 🤝";
        isGameActive = false;
        return;
    }

    changePlayer();     // no win? swap player
} // checkForWinner

function restartGame() {
    boardState = ["", "", "", "", "", "", "", "", ""];
    currentPlayer = "X";
    isGameActive = true;

    statusText.textContent = `Player ${currentPlayer}'s turn`;
    cells.forEach(cell => {
        cell.textContent = "";
        cell.classList.remove('x', 'o');
    });
} // restartGame


// toast!
function showToast({
    prominence = "low",
    animation = "fade",
    duration = "short",
    title = "Messages",
    message = "Alex sent you a message."
}) {
    clearTimeout(toastTimeout);

    // Reset classes
    toast.className = "toast";

    // Apply experimental condition
    toast.classList.add(prominence);
    toast.classList.add(animation);

    // Set content
    toast.querySelector(".toast-title").textContent = title;
    toast.querySelector(".toast-body").textContent = message;

    // Make visible
    toast.style.display = "block";

    // Remove after specified duration
    toastTimeout = setTimeout(() => {
        toast.classList.add("hide");

        setTimeout(() => {
            toast.style.display = "none";
            toast.classList.remove("hide");
        }, 200);

    }, durations[duration]);

    currentTrial = {
        prominence,
        animation,
        duration,
        shownAt: Date.now(),
        response: null,
        responseAt: null,
        responseTime: null
    };
    console.log(currentTrial);
}


// trials!
function runTrial(index, delayMin, delayMax) {
    if (index >= trials.length) {
        console.log("Experiment complete");
        return;
    }

    const condition = trials[index];
    showToast({
        ...condition,
        title: "Messages",
        message: "Alex sent you a message."
    });

    // Random delay before next notification
    const nextDelay = Math.floor(
        Math.random() * (delayMax - delayMin + 1)
    ) + delayMin;

    setTimeout(() => {
        runTrial(index + 1, delayMin, delayMax);
    }, durations[condition.duration] + nextDelay);
}

function finishToast(response) {
    if (!currentTrial) return;

    // Stop the timeout
    clearTimeout(toastTimeout);

    // Record response
    currentTrial.response = response;
    currentTrial.responseAt = Date.now();

    // Calculate response time
    currentTrial.responseTime = currentTrial.responseAt - currentTrial.shownAt;
    console.log(currentTrial);

    // Hide toast
    toast.style.display = "none";

    // Clear current trial
    currentTrial = null;
} // finish toast

runTrial(0, 5000, 10000);
