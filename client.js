const socket = new WebSocket("ws://localhost:9002");

//	Once the page is fully loaded, ask the server to list rooms
window.addEventListener("load", function()
{
	socket.send("list");
});
