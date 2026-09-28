// game logic

// Connect JavaScript to HTML cells
const cells = document.querySelectorAll(".cell");
const scoreElement = document.getElementById("score");
const bestScoreElement = document.getElementById("best-score");
const restartButton = document.getElementById("restart-button");
const reduceMotionToggle = document.getElementById("reduce-motion-toggle");

// Initializations:
const SIZE = 4;
let board = [];
let score = 0;
let bestScore = Number(localStorage.getItem("bestScore")) || 0;
let hasWon = false;

// Positions to animate in the updateBoard() call, ex { row: 0, col: 3 }
let newCells = [];
let mergedCells = [];

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
 * Cells listed in newCells get the "tile-new" class (appear animation),
 * cells listed in mergedCells get the "tile-merged" class (pop animation).
 *
 * Also updates the current score and saves a new best score
 * to localStorage when necessary.
 */
function updateBoard() {
    let index = 0;

    for (let row = 0; row < SIZE; row++) {
        for (let col = 0; col < SIZE; col++) {
            const value = board[row][col];
            const cell = cells[index];

            const isNew = containsPosition(newCells, row, col);
            const isMerged = containsPosition(mergedCells, row, col);

            cell.textContent = value === 0 ? "" : value;
            cell.className = "cell";

            // Reading offsetWidth forces the browser to apply the class reset
            // above, so the animation restarts even if the class was already there.
            if (isNew || isMerged) {
                void cell.offsetWidth;
            }

            if (value !== 0) {
                cell.classList.add(value > 2048 ? "tile-super" : `tile-${value}`);
            }

            if (isNew) {
                cell.classList.add("tile-new");
            } else if (isMerged) {
                cell.classList.add("tile-merged");
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

    mergedCells = [];
    newCells = [addRandomTile(), addRandomTile()];

    updateBoard();
}


/**
 * Checks whether a list of positions contains the given cell.
 *
 * @param {{row: number, col: number}[]} list - The positions to search.
 * @param {number} row - The row index.
 * @param {number} col - The column index.
 * @returns {boolean} True if the position is in the list.
 */
function containsPosition(list, row, col) {
    return list.some(position => position.row === row && position.col === col);
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
 *
 * @returns {{row: number, col: number} | null} The position of the new
 * tile, or null if no tile was added.
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
        return null;
    }

    const randomIndex = Math.floor(Math.random() * emptyCells.length);
    const randomCell = emptyCells[randomIndex];

    board[randomCell.row][randomCell.col] = Math.random() < 0.9 ? 2 : 4;

    return randomCell;
}


/**
 * Slides and merges a single row toward the left.
 *
 * Removes empty spaces, merges adjacent equal tiles once,
 * updates the score for each merge, and fills the remaining
 * spaces with zeros.
 *
 * Ex: [2, 0, 2, 4] -> row: [4, 4, 0, 0], merged: [0]
 *
 * @param {number[]} row - The row to slide and merge.
 * @returns {{row: number[], merged: number[]}} The new row, and the
 * indices in the new row where a merge happened.
 */
function slide(row) {
    const tiles = row.filter(value => value !== 0);
    const newRow = [];
    const merged = [];

    for (let i = 0; i < tiles.length; i++) {
        if (i < tiles.length - 1 && tiles[i] === tiles[i + 1]) {
            const mergedValue = tiles[i] * 2;

            newRow.push(mergedValue);
            score += mergedValue;
            merged.push(newRow.length - 1);

            i++; // skip the partner tile, so each tile merges only once
        } else {
            newRow.push(tiles[i]);
        }
    }

    while (newRow.length < SIZE) {
        newRow.push(0);
    }

    return { row: newRow, merged };
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
        const result = slide(originalRow);
        const newRow = result.row;

        board[row] = newRow;
        result.merged.forEach(i => mergedCells.push({ row, col: i }));

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
        const result = slide([...originalRow].reverse());
        const newRow = result.row.reverse();

        board[row] = newRow;
        // index i in the reversed row is column SIZE - 1 - i on the board
        result.merged.forEach(i => mergedCells.push({ row, col: SIZE - 1 - i }));

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
        const result = slide(originalColumn);
        const newColumn = result.row;

        setColumn(col, newColumn);
        result.merged.forEach(i => mergedCells.push({ row: i, col }));

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
        const result = slide([...originalColumn].reverse());
        const newColumn = result.row.reverse();

        setColumn(col, newColumn);
        // index i in the reversed column is row SIZE - 1 - i on the board
        result.merged.forEach(i => mergedCells.push({ row: SIZE - 1 - i, col }));

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

    mergedCells = [];
    newCells = [];

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

    const spawned = addRandomTile();

    if (spawned) {
        newCells.push(spawned);
    }

    updateBoard();

    if (!hasWon && checkWin()) {
        hasWon = true;
        console.log("You reached 2048! You win :3");
    }

    if (checkGameOver()) {
        console.log("Game Over!");
    }
});

/**
 * Turns the "Reduce motion" setting on or off.
 *
 * Adds or removes the "reduce-motion" class on <body> (the CSS uses it
 * to disable animations), syncs the checkbox and saves the choice.
 *
 * @param {boolean} enabled - True to turn animations off.
 */
function setReduceMotion(enabled) {
    document.body.classList.toggle("reduce-motion", enabled);
    reduceMotionToggle.checked = enabled;
    localStorage.setItem("reduceMotion", enabled);
}


/**
 * Loads the "Reduce motion" setting.
 *
 * Uses the player's saved choice if there is one. Otherwise it follows
 * the "reduce motion" setting of the operating system.
 */
function loadReduceMotion() {
    const saved = localStorage.getItem("reduceMotion");

    if (saved !== null) {
        setReduceMotion(saved === "true");
    } else {
        const systemSetting = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
        document.body.classList.toggle("reduce-motion", systemSetting);
        reduceMotionToggle.checked = systemSetting;
    }
}

// Restart the game when the Restart Game button is clicked.
restartButton.addEventListener("click", startGame);

// Update the setting when the checkbox is clicked.
reduceMotionToggle.addEventListener("change", () => {
    setReduceMotion(reduceMotionToggle.checked);
});

// Apply the saved or system motion setting before the first render.
loadReduceMotion();

// Start the first game.
startGame();
