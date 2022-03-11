"use strict";

let dark = true;

function listRoom(name, players, maxPlayers)
{
	let rootDiv = document.getElementById("room-picker");

	let entry = document.createElement("tr");
	entry.className = "room-picker-entry";
	entry.style.backgroundColor = dark ? "gray" : "white";

	let joinButton = document.createElement("button");
	joinButton.className = "room-picker-join";
	joinButton.style.backgroundColor = dark ? "gray" : "white";

	//	Tell the user whether they spectate or play
	let spectate = Number(players) >= Number(maxPlayers);
	joinButton.innerHTML = spectate ? "Spectate" : "Join";

	joinButton.addEventListener("click", function(e)
	{
		//	The name of the room is always in the value of the next element
		let roomName = this.nextSibling.innerHTML;
		socket.send("join " + roomName);
	});

	let joinContainer = document.createElement("th");
	joinContainer.appendChild((joinButton));

	let roomName = document.createElement("th");
	roomName.innerHTML = name;

	let playerCount = document.createElement("th");
	playerCount.innerHTML = players + "/" + maxPlayers;

	//	Add the room entry parts
	entry.appendChild(joinButton);
	entry.appendChild(roomName);
	entry.appendChild(playerCount);
	rootDiv.appendChild(entry);

	dark = !dark;
}

socket.addEventListener("message", function(e)
{
	let parts = e.data.split(" ");
	console.log(parts);

	switch(parts[0])
	{
		case "list":
			for(let i = 1; i < parts.length; i++)
				listRoom(parts[i], "1", "2");
		break;

		case "join":
			toggleView();
		break;
	}
});
