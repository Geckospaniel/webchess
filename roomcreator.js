let createButton = document.getElementById("create-room");

createButton.addEventListener("click", function()
{
	let name = document.getElementById("room-name");

	if(name.value.length == 0)
		return;

	/*	Replacing whitespace is kind of important because
	 *	if the room name is "test test", only the first "test" is kept */
	let roomName = name.value.replace(/\s/g, "_");
	socket.send("create " + roomName);
});

socket.addEventListener("message", function(e)
{
	let parts = e.data.split(" ");
	console.log(parts);

	switch(parts[0])
	{
		case "create":
			toggleView();
		break;

		case "room-exists":
			let error = document.getElementById("name-error");
			error.innerHTML = "Room already exists";
		break;
	}
});
