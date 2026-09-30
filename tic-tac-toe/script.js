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
let currentTrialIndex = null;
let currentDelayMin = null;
let currentDelayMax = null;
let toastTimeout = null;
let nextTrialTimeout = null;



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
dismissButton.addEventListener('click', () => {
    finishToast("dismiss");
});
openButton.addEventListener('click', () => {
    finishToast("open");
});


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

    toast.className = "toast";
    toast.classList.add(prominence);
    toast.classList.add(animation);

    toast.querySelector(".toast-title").textContent = title;
    toast.querySelector(".toast-body").textContent = message;

    toast.style.display = "block";

    currentTrial = {
        prominence,
        animation,
        duration,
        shownAt: Date.now(),
        response: null,
        responseAt: null,
        responseTime: null
    };

    // Automatically finish if the notification times out
    toastTimeout = setTimeout(() => {
        finishToast("timeout");
    }, durations[duration]);
} // showToast

function runTrial(index, delayMin, delayMax) {

    if (index >= trials.length) {
        console.log("Experiment complete");
        return;
    }

    const condition = trials[index];

    // Remember which trial we're running
    currentTrialIndex = index;
    currentDelayMin = delayMin;
    currentDelayMax = delayMax;

    showToast({
        ...condition,
        title: "Messages",
        message: "Alex sent you a message."
    });
} // runTrial

function finishToast(response) {
    if (!currentTrial) return;

    // Cancel the automatic timeout
    clearTimeout(toastTimeout);

    // Record response
    currentTrial.response = response;
    currentTrial.responseAt = Date.now();

    // Calculate response time
    currentTrial.responseTime = currentTrial.responseAt - currentTrial.shownAt;

    console.log(currentTrial);

    if (response === "open") {
        // Expand the notification
        toast.classList.add("expanded");

        toast.querySelector(".toast-title").textContent =
            "Alex";

        toast.querySelector(".toast-body").textContent =
            "Hey! Just wanted to let you know that the meeting has been moved to tomorrow at 2:00 PM. Let me know if that time still works for you.";

        // Don't hide it yet
        return;
    }

    // Hide toast
    toast.style.display = "none";

    // Save whatever you want to your database here

    // Move to next trial
    const nextIndex = currentTrialIndex + 1;

    const nextDelay = Math.floor(
        Math.random() *
        (currentDelayMax - currentDelayMin + 1)
    ) + currentDelayMin;

    // Clear current trial
    currentTrial = null;

    // Wait before showing next notification
    nextTrialTimeout = setTimeout(() => {
        runTrial(
            nextIndex,
            currentDelayMin,
            currentDelayMax
        );
    }, nextDelay);
} // finishToast


runTrial(0, 5000, 10000);
