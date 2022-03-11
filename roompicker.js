"use strict";

let dark = true;

function listRoom(name, players, maxPlayers)
{
	let rootDiv = document.getElementById("room-picker");

	let entry = document.createElement("div");
	entry.className = "room-picker-entry";
	entry.style.backgroundColor = dark ? "gray" : "white";

	let spectate = Number(players) >= Number(maxPlayers);
	let joinButton = document.createElement("button");
	joinButton.className = "room-picker-join";

	//	Tell the user whether they spectate or play
	joinButton.innerHTML = spectate ? "Spectate" : "Join";

	//	Prevent room names being too long
	if(name.length > 20) name = name.slice(0, 20) + "...";

	let roomName = document.createElement("p1");
	roomName.className = "room-picker-name";
	roomName.innerHTML = name;

	let playerCount = document.createElement("p1");
	playerCount.innerHTML = players + "/" + maxPlayers;
	playerCount.className = "room-picker-players";

	entry.appendChild(joinButton);
	entry.appendChild(roomName);
	entry.appendChild(playerCount);
	rootDiv.appendChild(entry);

	dark = !dark;
}

listRoom("test1", "1", "2");
listRoom("jdsfkjsldfkjkldsgf123", "2", "2");
listRoom("test3", "10", "50");
