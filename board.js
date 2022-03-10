"use strict";

const socket = new WebSocket("ws://localhost:9002");
let canvas = document.getElementById("game");

let moveHappened = false;
let mouseHeld = false;
let cameraX = null;
let cameraY = null;

let oldMouseX = null;
let oldMouseY = null;

let selectionX = 0;
let selectionY = 0;

let boardWidth = 0;
let boardHeight = 0;

let tileData = [];
let checks = [];

let rotateBoard = false;
let subX = 0;
let subY = 0;

/*	900x900 is the reference size we want to use
 *	because the tiles on the board look nice with it */
let oldCanvasWidth = 900;
let oldCanvasHeight = 900;

let tileSize = 70;
let playerID;

function initImage(url)
{
	let img = new Image;
	img.src = url;
	return img;
}

//	Load images for the pieces from wikimedia
//	TODO load local SVG's rather than remote PNG's
let pieceImages = [
	initImage("https://upload.wikimedia.org/wikipedia/commons/0/04/Chess_plt60.png"),
	initImage("https://upload.wikimedia.org/wikipedia/commons/9/9b/Chess_blt60.png"),
	initImage("https://upload.wikimedia.org/wikipedia/commons/2/28/Chess_nlt60.png"),
	initImage("https://upload.wikimedia.org/wikipedia/commons/5/5c/Chess_rlt60.png"),
	initImage("https://upload.wikimedia.org/wikipedia/commons/4/49/Chess_qlt60.png"),
	initImage("https://upload.wikimedia.org/wikipedia/commons/3/3b/Chess_klt60.png"),

	initImage("https://upload.wikimedia.org/wikipedia/commons/c/cd/Chess_pdt60.png"),
	initImage("https://upload.wikimedia.org/wikipedia/commons/8/81/Chess_bdt60.png"),
	initImage("https://upload.wikimedia.org/wikipedia/commons/f/f1/Chess_ndt60.png"),
	initImage("https://upload.wikimedia.org/wikipedia/commons/a/a0/Chess_rdt60.png"),
	initImage("https://upload.wikimedia.org/wikipedia/commons/a/af/Chess_qdt60.png"),
	initImage("https://upload.wikimedia.org/wikipedia/commons/e/e3/Chess_kdt60.png")
];

function draw(clear)
{
	let ctx = canvas.getContext("2d");
	ctx.lineWidth = 5;
	
	let offsetX = 0 + cameraX;
	let offsetY = 0 + cameraY;

	/*	If the canvas should be cleared, calculate how large the board
	 *	is and clear a rectangle that has the size of the board */
	if(clear)
	{
		//	In case the board is rotated, the width and height need to be swapped
		let clearWidth = rotateBoard ? boardHeight : boardWidth;
		let clearHeight = rotateBoard ? boardWidth : boardHeight;

		ctx.clearRect(offsetX, offsetY, tileSize * clearWidth, tileSize * clearHeight);
		return;
	}

	//	If the board is rotated, swap the offsets around for camera movement to work
	if(rotateBoard)
	{
		let oldX = offsetX;
		offsetX = offsetY;
		offsetY = oldX;
	}

	let isBlack = false;

	for(let x = 0; x < boardWidth; x++)
	{
		for(let y = 0; y < boardHeight; y++)
		{
			/*	Calculate the tile offsets. subX and subY determine
			 *	whether the board should be inverted in some direction. */
			let posX = offsetX + (tileSize * Math.abs(subX - x));
			let posY = offsetY + (tileSize * Math.abs(subY - y));

			//	If the board is rotated, swap the positions around
			if(rotateBoard)
			{
				let oldX = posX;
				posX = posY;
				posY = oldX;
			}

			// 	If this is the selected tile, paint the background green
			if(x == selectionX && y == selectionY)
				ctx.fillStyle = "green";

			//	This tile isn't selected so color it light or dark
			else ctx.fillStyle = isBlack ? "#80673e" : "#d1b17d";

			//	Draw the tile
			ctx.fillRect(posX, posY, tileSize, tileSize);

			//	Is there a highlight on this tile?
			if(tileData[x][y].highlight >= 0)
			{
				switch(tileData[x][y].highlight)
				{
					case 0: ctx.strokeStyle = "blue"; break;
					case 1: ctx.strokeStyle = "red"; break;
					case 2: ctx.strokeStyle = "gray"; break;
					case 3: ctx.strokeStyle = "magenta"; break;
				}

				//	Draw a non-filled rectangle on top of this tile
				ctx.strokeRect(posX + 2.5, posY + 2.5, tileSize - 5, tileSize - 5);
			}

			//	Is there a piece on this tile?
			if(tileData[x][y].piece >= 0)
			{
				/*	If this piece belongs to player 0, color it white. Else
				 *	color it black
				 *
				 *	TODO implement random colors for the pieces. */
				let pieceIndex = tileData[x][y].piece + (6 * (tileData[x][y].player > 0));
				ctx.drawImage(pieceImages[pieceIndex], posX, posY, tileSize, tileSize);

				//	Draw the player ID of the piece
				ctx.fillStyle = "black";
				ctx.fillText(String(tileData[x][y].player), posX, posY + tileSize);
			}

			isBlack = !isBlack;
		}

		isBlack = !isBlack;
	}

	//	Draw checks like we did with highlights
	for(let i in checks)
	{
		//	Calculate the position of the checked king
		let posX = offsetX + (tileSize * Math.abs(subX - checks[i].x));
		let posY = offsetY + (tileSize * Math.abs(subY - checks[i].y));

		//	If the board is rotated, swap the positions
		if(rotateBoard)
		{
			let oldX = posX;
			posX = posY;
			posY = oldX;
		}

		//	Draw a yellow non-filled rectangle
		ctx.strokeStyle = "yellow";
		ctx.strokeRect(posX + 2.5, posY + 2.5, tileSize - 5, tileSize - 5);
	}
}

canvas.addEventListener("mousedown", function(e)
{
	//	Was middle click pressed?
	if(e.button === 1)
	{
		mouseHeld = true;
		oldMouseX = e.x;
		oldMouseY = e.y;
	}

	//	Was left click pressed?
	else if(e.button === 0)
	{
		//	Get the real canvas size
		let box = canvas.getBoundingClientRect();

		//	Get a relation between screen space and canvas space
		let x = box.width / canvas.width;
		let y = box.height / canvas.height;

		/*	Translate the mouse position to canvas position
		 *	and move it to the beginning of the board */
		let translatedMouseX = e.x / x - cameraX;
		let translatedMouseY = e.y / y - cameraY;

		//	If the board is rotated, swap the mouse X and Y
		if(rotateBoard)
		{
			let oldX = translatedMouseX;
			translatedMouseX = translatedMouseY;
			translatedMouseY = oldX;
		}

		//	Translate the mouse position to an index in the game board
		selectionX = Math.abs(subX - Math.floor(translatedMouseX / (tileSize)));
		selectionY = Math.abs(subY - Math.floor(translatedMouseY / (tileSize)));

		//	At this point a move hasn't happened but the server might say otherwise
		moveHappened = false;

		//	Request the server to perform a piece move
		socket.send("move " + selectionX + " " + selectionY);

		/*	The server will respond to "move" before this gets answered.
		 *	If no move happened the legal moves will be updated */
		socket.send("legal " + selectionX + " " + selectionY);
	}
});

canvas.addEventListener("mouseup", function(e)
{
	mouseHeld = false;
});

canvas.addEventListener("mousemove", function(e)
{
	//	If the mouse is being held, move the camera
	if(mouseHeld)
	{
		//	Clear the old location
		draw(true);

		//	Move the camera by the mouse location difference
		cameraX -= (e.x - oldMouseX);
		cameraY -= (e.y - oldMouseY);

		//	Draw the new location
		draw(false);
	}

	oldMouseX = e.x;
	oldMouseY = e.y;
});

canvas.addEventListener("wheel", function(e)
{
	draw(true);

	//	Grow or shrink the tile size depending on how the user scrolled
	let diff = e.wheelDelta / 20;
	tileSize += diff;

	//	If the tile size was modified, move the camera slightly
	//	TODO Make the camera go towards the center of the screen
	if(tileSize >= 50)
	{
		cameraX -= diff;
		cameraY -= diff;
	}

	//	Forbid the tile size going below certain value
	else tileSize = 50;

	draw(false);
    return false; 

}, false);

socket.addEventListener("message", function(e)
{
	let parts = e.data.split(" ");
	console.log(parts);

	switch(parts[0])
	{
		//	Legal moves. This is received after a tile is clicked
		case "legal":

			//	Clear previous highlights
			for(let x in tileData)
				for(let y in tileData[x])
					tileData[x][y].highlight = -1;

			//	If a move happened, don't highlight any tiles
			if(moveHappened)
				break;

			//	If the selected tile isn't our own, highlight it in a different way
			let highlightOffset = tileData[selectionX][selectionY].player == playerID ? 0 : 2;

			for(let i = 1; i < parts.length; i+=3)
			{
				let x = Number(parts[i + 0]);
				let y = Number(parts[i + 1]);
				tileData[x][y].highlight = highlightOffset + Number(parts[i + 2]);
			}
		break;

		//	Information about where kings are checked
		case "check":
			checks = [];
			for(let i = 1; i < parts.length; i+=2)
			{
				checks.push({
					x : Number(parts[i + 0]),
					y : Number(parts[i + 1])
				});
			}
		break;

		//	Update tile data
		case "tile":
			let x = 0;
			let y = 0;
			for(let i = 1; i < parts.length; i+=2)
			{
				tileData[x][y].piece = Number(parts[i + 0]) - 1;
				tileData[x][y].player = Number(parts[i + 1]);

				y++;
				if(y >= boardHeight)
				{
					y = 0;
					x++;
				}
			}
		break;

		case "move":
			console.log("received 'move happened'");
			moveHappened = true;
		break;

		/*	Board size.
		 *	This is received right after we're connnected */
		case "size":
			tileData = [];
			boardWidth = Number(parts[1]);
			boardHeight = Number(parts[2]);

			//	Fill the board with empty tiles
			for(let x = 0; x < boardWidth; x++)
			{
				tileData.push([]);
				for(let y = 0; y < boardHeight; y++)
				{
					tileData[x].push({
						piece : -1,
						highlight : -1,
						player : 0
					});
				}
			}
		break;

		/*	The view message is the server telling us
		 *	how the board should be looked at */
		case "view":
			subX = Number(parts[1]);
			subY = Number(parts[2]);
			rotateBoard = Number(parts[3]);
		break;

		case "id":
			playerID = Number(parts[1]);
		break;
	}

	draw(false);
});

//	If the "kill" button is pressed, tell the server to die
let killer = document.getElementById("quit");
killer.addEventListener("click", function()
{
	socket.send("kill");
});

function updateCanvasSize()
{
	let box = canvas.getBoundingClientRect();

	/*	Calculate a relation between the old canvas size
	 *	and the new canvas size. This is done so that the board
	 *	will always appear the same size even though the window is resized */
	canvas.width /= (oldCanvasWidth / box.width);
	canvas.height /= (oldCanvasHeight / box.height);

	oldCanvasWidth = box.width;
	oldCanvasHeight = box.height;
}

//	Once the page is fully loaded, ask the server about the game
window.addEventListener("load", function()
{
	updateCanvasSize();
	socket.send("new");
});

window.addEventListener("resize", function()
{
	updateCanvasSize(),
	draw();
});
