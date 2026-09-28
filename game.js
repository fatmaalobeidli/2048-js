// Game logic
 
// Connect JavaScript to HTML cells
const cells = document.querySelectorAll(".cell");
const scoreElement = document.getElementById("score");
const bestScoreElement = document.getElementById("best-score");
const restartButton = document.querySelector(".top-right-button");
 
// Initializations:
const SIZE = 4;
let board = [];
let score = 0;
let bestScore = Number(localStorage.getItem("bestScore")) || 0;
let hasWon = false;
 
// Show the saved best score right away
bestScoreElement.textContent = bestScore;

 
/**
 * Creates a new empty SIZE x SIZE game board.
 * Each cell is initialized to 0, which represents an empty tile.
 */
function createEmptyBoard() {
    board = [];
 
    for (let row = 0; row < SIZE; row++) {
        board.push(new Array(SIZE).fill(0));
    }
}
 
 
/**
 * Updates the visual HTML board so that it matches the current
 * JavaScript board state.
 *
 * Empty cells are displayed as blank, while numbered tiles are
 * displayed and given a CSS class based on their value.
 *
 * Also updates the current score and saves a new best score
 * to localStorage when necessary.
 */
function updateBoard() {
    let index = 0;
 
    for (let row = 0; row < SIZE; row++) {
        for (let col = 0; col < SIZE; col++) {
            const value = board[row][col];
 
            cells[index].textContent = value === 0 ? "" : value;
            cells[index].className = "cell";
 
            if (value !== 0) {
                cells[index].classList.add(`tile-${value}`);
            }
 
            index++;
        }
    }
 
    scoreElement.textContent = score;
 
    if (score > bestScore) {
        bestScore = score;
        bestScoreElement.textContent = bestScore;
        localStorage.setItem("bestScore", bestScore);
    }
}
 
 
/**
 * Starts a new 2048 game.
 *
 * Resets the score and win state, creates an empty board,
 * places two random starting tiles, and updates the board.
 */
function startGame() {
    score = 0;
    hasWon = false;
 
    createEmptyBoard();
 
    addRandomTile();
    addRandomTile();
 
    updateBoard();
}
 
 
/**
 * Adds a new random tile to one of the empty cells on the board.
 *
 * First collects all empty positions, selects one randomly,
 * then places either a 2 or a 4 in that position.
 *
 * - 90% chance of generating a 2
 * - 10% chance of generating a 4
 *
 * Does nothing if the board contains no empty cells.
 */
function addRandomTile() {
    const emptyCells = [];
 
    for (let row = 0; row < SIZE; row++) {
        for (let col = 0; col < SIZE; col++) {
            if (board[row][col] === 0) {
                emptyCells.push({ row, col });
            }
        }
    }
 
    if (emptyCells.length === 0) {
        return;
    }
 
    const randomIndex = Math.floor(Math.random() * emptyCells.length);
    const randomCell = emptyCells[randomIndex];
 
    board[randomCell.row][randomCell.col] = Math.random() < 0.9 ? 2 : 4;
}
 
 
/**
 * Slides and merges a single row toward the left.
 *
 * Removes empty spaces, merges adjacent equal tiles once,
 * updates the score for each merge, and fills the remaining
 * spaces with zeros.
 *
 * Ex: [2, 0, 2, 4] -> [4, 4, 0, 0]
 *
 * @param {number[]} row - The row to slide and merge.
 * @returns {number[]} The new row after sliding and merging.
 */
function slide(row) {
    let filteredRow = row.filter(value => value !== 0);
 
    for (let i = 0; i < filteredRow.length - 1; i++) {
        if (filteredRow[i] === filteredRow[i + 1]) {
            filteredRow[i] *= 2;
            score += filteredRow[i];
            filteredRow[i + 1] = 0;
        }
    }
 
    filteredRow = filteredRow.filter(value => value !== 0);
 
    while (filteredRow.length < SIZE) {
        filteredRow.push(0);
    }
 
    return filteredRow;
}
 
 
/**
 * Moves all tiles on the board to the left.
 *
 * @returns {boolean} True if at least one tile moved or merged.
 */
function moveLeft() {
    let moved = false;
 
    for (let row = 0; row < SIZE; row++) {
        const originalRow = [...board[row]];
        const newRow = slide(originalRow);
 
        board[row] = newRow;
 
        if (!arraysEqual(originalRow, newRow)) {
            moved = true;
        }
    }
 
    return moved;
}
 
 
/**
 * Moves all tiles on the board to the right.
 *
 * Each row is reversed, passed through slide(), and then
 * reversed back so that the movement occurs toward the right.
 *
 * @returns {boolean} True if at least one tile moved or merged.
 */
function moveRight() {
    let moved = false;
 
    for (let row = 0; row < SIZE; row++) {
        const originalRow = [...board[row]];
        const newRow = slide([...originalRow].reverse()).reverse();
 
        board[row] = newRow;
 
        if (!arraysEqual(originalRow, newRow)) {
            moved = true;
        }
    }
 
    return moved;
}
 
 
/**
 * Returns a copy of one column of the board as an array.
 *
 * @param {number} col - The column index.
 * @returns {number[]} The values of that column, top to bottom.
 */
function getColumn(col) {
    const column = [];
 
    for (let row = 0; row < SIZE; row++) {
        column.push(board[row][col]);
    }
 
    return column;
}
 
 
/**
 * Writes an array back into one column of the board.
 *
 * @param {number} col - The column index.
 * @param {number[]} column - The values to write, top to bottom.
 */
function setColumn(col, column) {
    for (let row = 0; row < SIZE; row++) {
        board[row][col] = column[row];
    }
}
 
 
/**
 * Moves all tiles on the board upward.
 *
 * @returns {boolean} True if at least one tile moved or merged.
 */
function moveUp() {
    let moved = false;
 
    for (let col = 0; col < SIZE; col++) {
        const originalColumn = getColumn(col);
        const newColumn = slide(originalColumn);
 
        setColumn(col, newColumn);
 
        if (!arraysEqual(originalColumn, newColumn)) {
            moved = true;
        }
    }
 
    return moved;
}
 
 
/**
 * Moves all tiles on the board downward.
 *
 * Each column is reversed, passed through slide(), and reversed back.
 *
 * @returns {boolean} True if at least one tile moved or merged.
 */
function moveDown() {
    let moved = false;
 
    for (let col = 0; col < SIZE; col++) {
        const originalColumn = getColumn(col);
        const newColumn = slide([...originalColumn].reverse()).reverse();
 
        setColumn(col, newColumn);
 
        if (!arraysEqual(originalColumn, newColumn)) {
            moved = true;
        }
    }
 
    return moved;
}
 
 
/**
 * Compares two arrays element by element.
 *
 * @param {Array} array1 - The first array to compare.
 * @param {Array} array2 - The second array to compare.
 * @returns {boolean} True if both arrays have the same length and
 * the same values in the same positions.
 */
function arraysEqual(array1, array2) {
    return array1.length === array2.length &&
        array1.every((value, index) => value === array2[index]);
}
 
 
/**
 * Checks whether the game is over.
 *
 * The game is over only when there are no empty cells and no equal
 * horizontal or vertical neighboring tiles.
 *
 * @returns {boolean} True if no valid moves remain.
 */
function checkGameOver() {
    for (let row = 0; row < SIZE; row++) {
        for (let col = 0; col < SIZE; col++) {
            if (board[row][col] === 0) {
                return false;
            }
 
            if (col < SIZE - 1 && board[row][col] === board[row][col + 1]) {
                return false;
            }
 
            if (row < SIZE - 1 && board[row][col] === board[row + 1][col]) {
                return false;
            }
        }
    }
 
    return true;
}
 
 
/**
 * Checks whether the player has reached the 2048 tile.
 *
 * @returns {boolean} True if a tile with value 2048 or higher exists.
 */
function checkWin() {
    for (let row = 0; row < SIZE; row++) {
        for (let col = 0; col < SIZE; col++) {
            if (board[row][col] >= 2048) {
                return true;
            }
        }
    }
 
    return false;
}
 
 
/**
 * Listens for arrow-key input and moves the board in the
 * corresponding direction.
 *
 * If the board changes, a new random tile is added, the display
 * is updated, and the game checks for a win or game-over state.
 */
document.addEventListener("keydown", event => {
    let moved = false;
 
    if (event.key === "ArrowLeft") {
        moved = moveLeft();
    } else if (event.key === "ArrowRight") {
        moved = moveRight();
    } else if (event.key === "ArrowUp") {
        moved = moveUp();
    } else if (event.key === "ArrowDown") {
        moved = moveDown();
    } else {
        return;
    }
 
    event.preventDefault();
 
    if (!moved) {
        return;
    }
 
    addRandomTile();
    updateBoard();
 
    if (!hasWon && checkWin()) {
        hasWon = true;
        console.log("You reached 2048! You win :3");
    }
 
    if (checkGameOver()) {
        console.log("Game Over!");
    }
});
 
// Restart the game when the Restart Game button is clicked.
restartButton.addEventListener("click", startGame);
 
// Start the first game.
startGame();