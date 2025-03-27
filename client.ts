const serverIP = window.location.hostname;
const wb = new WebSocket(`ws://${serverIP}:8080/ws`);

let myID: number | null = null;
let selectedUser: number | null = null;
const chatHistory: Record<number, { sender: number; message: string }[]> = {}; // Guarda mensajes por usuario

wb.addEventListener("open", () => {
  document.getElementById("server")!.textContent = "Conectado al servidor.";
});

wb.addEventListener("message", (event) => {
  const data = JSON.parse(event.data);

  if (data.type === "id") {
    myID = data.id;
    document.getElementById("cliente")!.textContent = `Tu ID: ${myID}`;
  } else if (data.type === "users") {
    updateUserList(data.users);
  } else if (data.type === "message") {
    saveMessage(data.sender, data.message);
    if (selectedUser === data.sender || selectedUser === data.receiver) {
      updateChat(selectedUser);
    }
  } else if (data.type === "error") {
    alert(data.message);
  }
});

document.getElementById("enviar")!.addEventListener("click", () => {
  const input = document.getElementById("mensaje") as HTMLInputElement;
  const message = input.value.trim();

  if (selectedUser !== null && message !== "") {
    // Guardar el mensaje enviado en el historial
    saveMessage(myID!, message);

    // Enviar el mensaje al servidor
    wb.send(JSON.stringify({ type: "private_message", target: selectedUser, message }));

    // Actualizar el chat con el mensaje enviado
    updateChat(selectedUser);

    input.value = "";
  } else {
    alert("Selecciona un usuario antes de enviar un mensaje.");
  }
});

function saveMessage(sender: number, message: string) {
  if (!chatHistory[selectedUser!]) {
    chatHistory[selectedUser!] = [];
  }
  chatHistory[selectedUser!].push({ sender, message });
}

function updateChat(userID: number) {
  const chatDiv = document.getElementById("chat")!;
  chatDiv.innerHTML = ""; // Limpia el chat antes de actualizar

  if (chatHistory[userID]) {
    chatHistory[userID].forEach(({ sender, message }) => {
      const messageElement = document.createElement("p");
      messageElement.textContent = message;
      messageElement.classList.add("alert", "p-2");

      if (sender === myID) {
        messageElement.classList.add("alert-primary", "text-end"); // Mensaje propio en azul
      } else {
        messageElement.classList.add("alert-secondary", "text-start"); // Mensaje recibido en gris
      }

      chatDiv.appendChild(messageElement);
    });
  }
}

function updateUserList(users: number[]) {
  const userListDiv = document.getElementById("usuarios")!;
  userListDiv.innerHTML = "";

  users.forEach((user) => {
    if (user !== myID) {
      const userElement = document.createElement("button");
      userElement.textContent = `Usuario ${user}`;
      userElement.classList.add("list-group-item", "list-group-item-action");
      userElement.onclick = () => selectUser(user);
      userListDiv.appendChild(userElement);
    }
  });
}

function selectUser(userID: number) {
  selectedUser = userID;
  document.getElementById("destino")!.textContent = `Chateando con Usuario ${userID}`;
  updateChat(userID);
}
