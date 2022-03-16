"use strict";

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

let promotionX = null;
let promotionY = null;

function initImage(url)
{
	let img = new Image;
	img.src = url;
	return img;
}

//	Load SVG's for the pieces from wikimedia
let pieceImages = [
	initImage("https://upload.wikimedia.org/wikipedia/commons/4/45/Chess_plt45.svg"),
	initImage("https://upload.wikimedia.org/wikipedia/commons/b/b1/Chess_blt45.svg"),
	initImage("https://upload.wikimedia.org/wikipedia/commons/7/70/Chess_nlt45.svg"),
	initImage("https://upload.wikimedia.org/wikipedia/commons/7/72/Chess_rlt45.svg"),
	initImage("https://upload.wikimedia.org/wikipedia/commons/1/15/Chess_qlt45.svg"),
	initImage("https://upload.wikimedia.org/wikipedia/commons/4/42/Chess_klt45.svg"),

	initImage("https://upload.wikimedia.org/wikipedia/commons/c/c7/Chess_pdt45.svg"),
	initImage("https://upload.wikimedia.org/wikipedia/commons/9/98/Chess_bdt45.svg"),
	initImage("https://upload.wikimedia.org/wikipedia/commons/e/ef/Chess_ndt45.svg"),
	initImage("https://upload.wikimedia.org/wikipedia/commons/f/ff/Chess_rdt45.svg"),
	initImage("https://upload.wikimedia.org/wikipedia/commons/4/47/Chess_qdt45.svg"),
	initImage("https://upload.wikimedia.org/wikipedia/commons/f/f0/Chess_kdt45.svg")
];

function clear()
{
	let ctx = canvas.getContext("2d");

	let offsetX = 0 + cameraX;
	let offsetY = 0 + cameraY;

	//	In case the board is rotated, the width and height need to be swapped
	let clearWidth = rotateBoard ? boardHeight : boardWidth;
	let clearHeight = rotateBoard ? boardWidth : boardHeight;

	//	If the promotion wheel is visible, clear a slightly larger area
	if(promotionX != null)
	{
		offsetX -= tileSize * 1.5;
		offsetY -= tileSize * 1.5;

		clearWidth *= 3;
		clearHeight *= 3;
	}

	/*	If the canvas should be cleared, calculate how large the board
	 *	is and clear a rectangle that has the size of the board */
	ctx.clearRect(offsetX, offsetY, tileSize * clearWidth, tileSize * clearHeight);
}

function draw()
{
	let ctx = canvas.getContext("2d");
	ctx.lineWidth = 5;
	
	let offsetX = 0 + cameraX;
	let offsetY = 0 + cameraY;

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

				////	Save the old transform and start drawing from the piece position
				//ctx.save();
				//ctx.translate(posX, posY);
				//ctx.scale(1.5, 1.5);

				//ctx.fillStyle = "white";
				//ctx.fill(piecePathData[0]);

				//ctx.restore();
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

	if(promotionX != null)
	{
		let posX = offsetX + (tileSize * Math.abs(subX - promotionX));
		let posY = offsetY + (tileSize * Math.abs(subY - promotionY));

		//	Depending on the view, the pieces on the wheel must be flipped
		let flipX = subX == 0 ? -1 : +1;
		let flipY = subY == 0 ? -1 : +1;
		let angle = 0.0;

		if(rotateBoard)
		{
			/*	When the board is rotated, the order of the wheel pieces won't
			 *	match what the player will be clicking. To fix this let's
			 *	cycle the piece order by 90 degrees and negate Y flip */
			angle = 90.0;
			flipY = -flipY;

			//	Positions and flips also need to be inverted
			let oldX = posX;
			posX = posY;
			posY = oldX;
			oldX = flipX;
			flipX = flipY;
			flipY = oldX;
		}

		//	Draw a filled circle
		ctx.fillStyle = "orange";
		ctx.beginPath();
		ctx.arc(posX + tileSize / 2, posY + tileSize * 0.5, tileSize * 1.5, 0, 2 * Math.PI);
		ctx.fill();

		//	Draw pieces that a pawn can promote to in a circle
		for(let i = 1; i <= 4; i++)
		{
			let rad = angle * Math.PI / 180.0;
			ctx.drawImage(	pieceImages[i],
							posX + Math.cos(rad) * (tileSize * flipX),
							posY + Math.sin(rad) * (tileSize * flipY),
							tileSize, tileSize);

			angle += 90.0;
		}
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

		//	Translate the mouse position to an index on the game board
		selectionX = Math.abs(subX - Math.floor(translatedMouseX / (tileSize)));
		selectionY = Math.abs(subY - Math.floor(translatedMouseY / (tileSize)));

		//	Is the promotion wheel active?
		if(promotionX != null)
		{
			let piece;

			//	Find out which piece the player clicks
			if(selectionX == promotionX && selectionY == promotionY - 1) piece = 3;
			else if(selectionX == promotionX && selectionY == promotionY + 1) piece = 5;
			else if(selectionX == promotionX + 1 && selectionY == promotionY) piece = 4;
			else if(selectionX == promotionX - 1 && selectionY == promotionY) piece = 2;
			else return;

			clear();
			promotionX = null;
			promotionY = null;
			draw();

			//	Tell the server to promote the piece
			socket.send("promote " + piece);
			return;
		}

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
		clear();

		//	Move the camera by the mouse location difference
		cameraX -= (e.x - oldMouseX);
		cameraY -= (e.y - oldMouseY);

		//	Draw the new location
		draw();
	}

	oldMouseX = e.x;
	oldMouseY = e.y;
});

canvas.addEventListener("wheel", function(e)
{
	clear();

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

	draw();
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

		case "promote":
			promotionX = Number(parts[1]);
			promotionY = Number(parts[2]);
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

	draw();
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

window.addEventListener("resize", function()
{
	updateCanvasSize(),
	draw();
});
