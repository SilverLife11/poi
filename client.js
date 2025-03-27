var serverIP = window.location.hostname;
var wb = new WebSocket("ws://".concat(serverIP, ":8080/ws"));
var myID = null;
var selectedUser = null;
var chatHistory = {}; // Guarda mensajes por usuario
wb.addEventListener("open", function () {
    document.getElementById("server").textContent = "Conectado al servidor.";
});
wb.addEventListener("message", function (event) {
    var data = JSON.parse(event.data);
    if (data.type === "id") {
        myID = data.id;
        document.getElementById("cliente").textContent = "Tu ID: ".concat(myID);
    }
    else if (data.type === "users") {
        updateUserList(data.users);
    }
    else if (data.type === "message") {
        saveMessage(data.sender, data.message);
        if (selectedUser === data.sender || selectedUser === data.receiver) {
            updateChat(selectedUser);
        }
    }
    else if (data.type === "error") {
        alert(data.message);
    }
});
document.getElementById("enviar").addEventListener("click", function () {
    var input = document.getElementById("mensaje");
    var message = input.value.trim();
    if (selectedUser !== null && message !== "") {
        // Guardar el mensaje enviado en el historial
        saveMessage(myID, message);
        // Enviar el mensaje al servidor
        wb.send(JSON.stringify({ type: "private_message", target: selectedUser, message: message }));
        // Actualizar el chat con el mensaje enviado
        updateChat(selectedUser);
        input.value = "";
    }
    else {
        alert("Selecciona un usuario antes de enviar un mensaje.");
    }
});
function saveMessage(sender, message) {
    if (!chatHistory[selectedUser]) {
        chatHistory[selectedUser] = [];
    }
    chatHistory[selectedUser].push({ sender: sender, message: message });
}
function updateChat(userID) {
    var chatDiv = document.getElementById("chat");
    chatDiv.innerHTML = ""; // Limpia el chat antes de actualizar
    if (chatHistory[userID]) {
        chatHistory[userID].forEach(function (_a) {
            var sender = _a.sender, message = _a.message;
            var messageElement = document.createElement("p");
            messageElement.textContent = message;
            messageElement.classList.add("alert", "p-2");
            if (sender === myID) {
                messageElement.classList.add("alert-primary", "text-end"); // Mensaje propio en azul
            }
            else {
                messageElement.classList.add("alert-secondary", "text-start"); // Mensaje recibido en gris
            }
            chatDiv.appendChild(messageElement);
        });
    }
}
function updateUserList(users) {
    var userListDiv = document.getElementById("usuarios");
    userListDiv.innerHTML = "";
    users.forEach(function (user) {
        if (user !== myID) {
            var userElement = document.createElement("button");
            userElement.textContent = "Usuario ".concat(user);
            userElement.classList.add("list-group-item", "list-group-item-action");
            userElement.onclick = function () { return selectUser(user); };
            userListDiv.appendChild(userElement);
        }
    });
}
function selectUser(userID) {
    selectedUser = userID;
    document.getElementById("destino").textContent = "Chateando con Usuario ".concat(userID);
    updateChat(userID);
}
