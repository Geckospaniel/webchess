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
	});

	let joinContainer = document.createElement("th");
	joinContainer.appendChild((joinButton));

	let roomName = document.createElement("th");
	roomName.innerHTML = name;

	let playerCount = document.createElement("th");
	playerCount.innerHTML = players + "/" + maxPlayers;

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
});

listRoom("test1", "1", "2");
listRoom("jdsfkjsldfkjkldsgf123", "2", "2");
listRoom("test3", "10", "50");
