let mainMenuActive = true;

function toggleView()
{
	let menu = document.getElementById("main-menu");
	let board = document.getElementById("game");

	menu.hidden = mainMenuActive;
	board.hidden = !mainMenuActive;

	/*	If the board is being revealed, do some
	 *	preparations so that it renders correctly */
	if(!board.hidden)
	{
		updateCanvasSize();
		draw();
	}

	console.log("Menu hidden", menu.hidden);
	console.log("board hidden", board.hidden);

	mainMenuActive = !mainMenuActive;
}
