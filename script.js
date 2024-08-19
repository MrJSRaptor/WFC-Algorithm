let w = 800;
let h = 600;
let cx = w / 2;
let cy = h / 2;
let tileSize = 50; // Define tileSize
let rows = Math.floor(h / tileSize);
let cols = Math.floor(w / tileSize);
let blank, up, right, down, left;
let BLANK, UP, RIGHT, DOWN, LEFT;
let grid = [];
let initialTilePosition = { i: -1, j: -1 };
let gridOn = true;

function preload() {
    blank = loadImage('blank.png');
    up = loadImage('up.png');
    right = loadImage('right.png');
    down = loadImage('down.png');
    left = loadImage('left.png');
    // Dynamically generate rotated tiles
    BLANK = createTile(0, 0, 0, 0, blank);
    UP = createTile(1, 1, 0, 1, up);
    RIGHT = createTile(1, 1, 1, 0, right);
    DOWN = createTile(0, 1, 1, 1, down);
    LEFT = createTile(1, 0, 1, 1, left);
}

function createTile(N, E, S, W, image) {
    return {
        N: N,
        E: E,
        S: S,
        W: W,
        image: image,
        collapsed: true
    };
}

function propagateConstraints(i, j, tile) {
    if (!grid[i] || !grid[i][j]) return;
    
    // Propagate constraints to neighbors, then recalculate their valid tiles
    let neighbors = [
        {di: -1, dj: 0, edge: 'N'},  // North
        {di: 0, dj: 1, edge: 'E'},   // East
        {di: 1, dj: 0, edge: 'S'},   // South
        {di: 0, dj: -1, edge: 'W'}   // West
    ];

    for (let {di, dj, edge} of neighbors) {
        let ni = i + di;
        let nj = j + dj;
        if (ni >= 0 && ni < rows && nj >= 0 && nj < cols) {
            if (!grid[ni][nj].collapsed) {
                grid[ni][nj][edge] = tile[oppositeEdge(edge)];
                grid[ni][nj].validTiles = getValidTiles(ni, nj);
            }
        }
    }
}

function oppositeEdge(edge) {
    return {N: 'S', E: 'W', S: 'N', W: 'E'}[edge];
}

function getValidTiles(i, j) {
    let options = [BLANK, UP, RIGHT, DOWN, LEFT];
    return options.filter(tile => isValidTile(i, j, tile));
}

function collapse(grid) {
    let minEntropy = Infinity;
    let candidates = [];

    // Calculate entropy for each tile in the grid
    for (let i = 0; i < rows; i++) {
        for (let j = 0; j < cols; j++) {
            if (!grid[i][j].collapsed) {
                grid[i][j].validTiles = getValidTiles(i, j); // Set validTiles
                let entropy = grid[i][j].validTiles.length;

                // Find the minimum entropy
                if (entropy < minEntropy) {
                    minEntropy = entropy;
                    candidates = [{ i, j, validTiles: grid[i][j].validTiles }];
                } else if (entropy === minEntropy) {
                    candidates.push({ i, j, validTiles: grid[i][j].validTiles });
                }
            }
        }
    }

    // Choose a random candidate from the lowest entropy options
    if (candidates.length > 0) {
        let choice = random(candidates);
        if (choice && grid[choice.i] && grid[choice.i][choice.j]) {
            let tile = random(choice.validTiles);
            grid[choice.i][choice.j] = tile;
            grid[choice.i][choice.j].collapsed = true; // Mark it as collapsed
            propagateConstraints(choice.i, choice.j, tile);
        } else {
            console.error("Invalid grid cell or choice", choice);
        }
    }
}


function isValidTile(i, j, tile) {
    if (!tile) return false; // Check if tile is valid
    if (i > 0 && grid[i-1][j] && grid[i-1][j].image !== false && grid[i-1][j].S !== tile.N) return false; // North
    if (j < cols - 1 && grid[i][j+1] && grid[i][j+1].image !== false && grid[i][j+1].W !== tile.E) return false; // East
    if (i < rows - 1 && grid[i+1][j] && grid[i+1][j].image !== false && grid[i+1][j].N !== tile.S) return false; // South
    if (j > 0 && grid[i][j-1] && grid[i][j-1].image !== false && grid[i][j-1].E !== tile.W) return false; // West
    return true;
}

function setup() {
    createCanvas(w, h);
    // Initialize 2-D Grid Array of Tiles
    for (let i = 0; i < rows; i++) {
        grid[i] = [];
        for (let j = 0; j < cols; j++) {
            grid[i][j] = {
                N: false,
                E: false,
                S: false,
                W: false,
                image: false,
                collapsed: false,
                validTiles: [] // Initialize validTiles as an empty array
            };
        }
    }
    background(0);
    initial(grid);
    show();
}

function draw() {
    let allCollapsed = true;
    for (let i = 0; i < rows; i++) {
        for (let j = 0; j < cols; j++) {
            if (!grid[i][j].collapsed) {
                allCollapsed = false;
                break;
            }
        }
        if (!allCollapsed) break;
    }

    if (allCollapsed) {
        console.log("All tiles are collapsed. Stopping the loop.");
        noLoop(); // Stop the draw loop once all tiles are collapsed
    } else {
        collapse(grid);
        show();
    }
}


function initial(grid) {
    let I = floor(random(rows));
    let J = floor(random(cols));
    let TILE = floor(random(5));
    let available = [BLANK, UP, RIGHT, DOWN, LEFT];
    let chosenTile = available[TILE];

    console.log(`Initializing tile at (${I}, ${J})`);
    console.log(`Chosen Tile: ${chosenTile === BLANK ? 'BLANK' : chosenTile === UP ? 'UP' : chosenTile === RIGHT ? 'RIGHT' : chosenTile === DOWN ? 'DOWN' : chosenTile === LEFT ? 'LEFT' : 'Unknown'}`);

    grid[I][J] = chosenTile;
    grid[I][J].collapsed = true; // Mark the tile as collapsed

    // Store the initial tile position
    initialTilePosition = { i: I, j: J };

    // Propagate constraints from the initial tile
    propagateConstraints(I, J, chosenTile);
}



function show() {
    background(0); // Clear the background

    // Draw all tiles
    for (let i = 0; i < rows; i++) {
        for (let j = 0; j < cols; j++) {
            let tile = grid[i][j];
            if (tile.image != false) {
                image(tile.image, j * tileSize, i * tileSize, tileSize, tileSize);
            }
        }
    }

    if (gridOn === true) {
        // Draw grid lines
        stroke(122); // Set the color for grid lines (white)
        strokeWeight(1); // Set the thickness of the grid lines

        // Horizontal lines
        for (let i = 1; i < rows; i++) {
            line(0, i * tileSize, w, i * tileSize);
        }

        // Vertical lines
        for (let j = 1; j < cols; j++) {
            line(j * tileSize, 0, j * tileSize, h);
        }
    }

    // Draw a red ellipse at the initial tile position
    if (initialTilePosition.i !== -1 && initialTilePosition.j !== -1) {
        fill('red');
        noStroke();
        ellipse(initialTilePosition.j * tileSize + tileSize / 2, initialTilePosition.i * tileSize + tileSize / 2, 10, 10);
    }
}