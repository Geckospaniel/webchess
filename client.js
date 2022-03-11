const socket = new WebSocket("ws://localhost:9002");

//	Once the page is fully loaded, ask the server to list rooms
socket.addEventListener("open", function()
{
	socket.send("list");
});
