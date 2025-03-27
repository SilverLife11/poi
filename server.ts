const clients = new Map<number, WebSocket>(); // Mapa ID -> WebSocket
let clientCounter = 1;

Deno.serve({ hostname: "0.0.0.0", port: 8080 }, async (req) => {
  const url = new URL(req.url);

  if (url.pathname === "/ws") {
    if (req.headers.get("upgrade") !== "websocket") {
      return new Response("Este servidor solo acepta WebSockets", { status: 400 });
    }

    const { socket, response } = Deno.upgradeWebSocket(req);
    const clientID = clientCounter++;
    clients.set(clientID, socket);

    function broadcastUsers() {
      const userList = Array.from(clients.keys());
      for (const client of clients.values()) {
        client.send(JSON.stringify({ type: "users", users: userList }));
      }
    }

    socket.addEventListener("open", () => {
      console.log(`Cliente ${clientID} conectado.`);
      socket.send(JSON.stringify({ type: "id", id: clientID }));
      broadcastUsers();
    });

    socket.addEventListener("message", (event) => {
      const data = JSON.parse(event.data);
      console.log(`Cliente ${clientID} envió:`, data);

      if (data.type === "private_message") {
        const targetID = data.target;
        const message = data.message;
        const targetSocket = clients.get(targetID);

        if (targetSocket) {
          targetSocket.send(JSON.stringify({
            type: "message",
            sender: clientID,
            message: message,
          }));
        } else {
          socket.send(JSON.stringify({ type: "error", message: "Usuario no encontrado." }));
        }
      }
    });

    socket.addEventListener("close", () => {
      console.log(`Cliente ${clientID} desconectado.`);
      clients.delete(clientID);
      broadcastUsers();
    });

    return response;
  }

  // Servir archivos estáticos
  if (url.pathname === "/") {
    const file = await Deno.readFile("index.html");
    return new Response(file, { headers: { "Content-Type": "text/html" } });
  } else if (url.pathname === "/client.js") {
    const file = await Deno.readFile("client.js");
    return new Response(file, { headers: { "Content-Type": "application/javascript" } });
  }

  return new Response("404 Not Found", { status: 404 });
});

console.log("Servidor corriendo en http://0.0.0.0:8080");
console.log("WebSocket en ws://0.0.0.0:8080/ws");
