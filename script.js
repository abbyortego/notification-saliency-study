// BRIEFING
// state vars
const consentPage = document.getElementById("consent-page");
const gamePage = document.getElementById("game-page");
let GOOGLE_SHEET_URL = null;
const studyId = document.getElementById("study-id");
const consentCheckbox = document.getElementById("consent-checkbox");
const startButton = document.getElementById("start-btn");
const participantId = crypto.randomUUID();
document.getElementById("participant-id").textContent = participantId;

// check studyId input
studyId.addEventListener("change", () => {
    try {
        if (studyId.value.trim() !== "") {
            studyId.classList.add("valid");
            studyId.classList.remove("invalid");
            startButton.disabled = !consentCheckbox.checked;
            GOOGLE_SHEET_URL = `https://script.google.com/macros/s/${studyId.value.trim()}/exec`
        } else {
            throw new Error();
        }
    } catch {
        studyId.classList.add("invalid");
        studyId.classList.remove("valid");
        startButton.disabled = true;
    }
});

// check consent input
consentCheckbox.addEventListener("change", () => {
    startButton.disabled = !consentCheckbox.checked || GOOGLE_SHEET_URL === null;
});

// validate URL
startButton.addEventListener("click", async () => {
    try {
        const response = await fetch(GOOGLE_SHEET_URL, {
            method: "POST",
            body: JSON.stringify({
                participantId: participantId,
                response: "start",
                responseAt: Date.now()
            })
        });

        if (!response.ok) {
            throw new Error(`HTTP ${response.status}`);
        }

        // Link works, so start the study
        consentPage.style.display = "none";
        gamePage.style.display = "block";
        setTimeout(() => {
            runTrial(0, 5000, 10000);
        }, 15000);

    } catch (error) {
        console.error(error);
        alert("The study link could not be verified. Please check the link and try again.");
    }
});


// TIC TAC TOE
// experimental conditions
const gameStats = {
    gamesPlayed: 0,
    wins: 0,
    losses: 0,
    draws: 0,
    totalMoves: 0,
    currentWinStreak: 0,
    longestGame: 0,
    xMoves: 0,
    oMoves: 0
};
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
const shuffledNotifications = Array.from(
    {length: 12},
    (_, i) => i + 1
).sort(() => Math.random() - 0.5);
const shuffledConditions = [...conditions].sort(() => Math.random() - 0.5);
const trials = shuffledConditions.map((condition, index) => ({
    ...condition,
    ...shuffledNotifications[index]
}));

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
let expandedToastTimeout = null;

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
function getMoveCount() {
    return boardState.filter(cell => cell !== "").length;
} // getMoveCount

function generateNotification() {
    return notifications = [
        { title: "Game Stats", message: `You've played ${gameStats.gamesPlayed} games so far.` },
        { title: "Game Stats", message: `You've won ${gameStats.wins} of your last ${gameStats.gamesPlayed} games.` },
        { title: "Game Stats", message: `Your longest game lasted ${gameStats.longestGame} moves.` },
        { title: "Game Stats", message: `You're currently on a ${gameStats.currentWinStreak}-game win streak.` },
        { title: "Fun Fact", message: "The center square is part of 4 possible winning lines." },
        { title: "Fun Fact", message: "Tic-Tac-Toe can always end in a draw with perfect play." },
        { title: "Game Update", message: `You've placed ${gameStats.xMoves} X's this session.` },
        { title: "Tip", message: "Taking the center gives you more ways to build a line." },
        { title: "Challenge", message: "Can you win your next game in fewer than 7 moves?" },
        { title: "Fun Fact", message: "The number of possible Tic-Tac-Toe board positions is much smaller than the number of possible games." },
        { title: "Tip", message: "Look for an opportunity to create two winning lines at once." },
        { title: "Tip", message: "If your opponent has two marks in a row, block them before making your own move."}
    ];
} // generateNotification

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

    if (currentPlayer === "X") {
        gameStats.xMoves++;
    } else {
        gameStats.oMoves++;
    }
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

        // update stats
        gameStats.gamesPlayed++;
        gameStats.totalMoves = getMoveCount();
        if (currentPlayer === "X") {
            gameStats.wins++;
            gameStats.currentWinStreak++;
        } else {
            gameStats.losses++;
            gameStats.currentWinStreak = 0;
        }
        gameStats.longestGame = Math.max(
            gameStats.longestGame,
            gameStats.totalMoves
        );

        return;
    }

    if (!boardState.includes("")) {     // check for a tie game
        statusText.textContent = "It's a Draw! 🤝";
        isGameActive = false;

        // update stats
        gameStats.gamesPlayed++;
        gameStats.draws++;
        gameStats.currentWinStreak = 0;
        gameStats.totalMoves = getMoveCount();
        gameStats.longestGame = Math.max(
            gameStats.longestGame,
            gameStats.totalMoves
        );

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
    title = "",
    message = ""
}) {
    clearTimeout(toastTimeout);

    toast.className = "toast";
    toast.classList.add(prominence);
    toast.classList.add(animation);

    toast.querySelector(".toast-title").textContent = title;
    toast.querySelector(".toast-body").textContent = "";

    toast.style.display = "block";

    currentTrial = {
        participantId,
        currentTrialIndex,
        prominence,
        animation,
        duration,
        title,
        message,
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

        gamePage.style.display = "none";
        document.getElementById("debrief-page").style.display = "block";

        return;
    }

    const condition = trials[index];
    const notification = generateNotification()[index]

    // Remember which trial we're running
    currentTrialIndex = index;
    currentDelayMin = delayMin;
    currentDelayMax = delayMax;

    showToast({...condition, ...notification});
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
    fetch(GOOGLE_SHEET_URL, {
        method: "POST",
        body: JSON.stringify(currentTrial)
    });

    if (response === "open") {
        // Expand the notification
        toast.classList.add("expanded");

        toast.querySelector(".toast-title").textContent = generateNotification()[currentTrialIndex]["title"];

        toast.querySelector(".toast-body").textContent = generateNotification()[currentTrialIndex]["message"];

        clearTimeout(expandedToastTimeout);

        expandedToastTimeout = setTimeout(() => {
            finishToast("opened-timeout");
        }, 15000);

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
