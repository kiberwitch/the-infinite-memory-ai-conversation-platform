let memory = JSON.parse(localStorage.getItem("aiMemory")) || [];

function loadMemory() {
  const memoryList = document.getElementById("memoryList");
  memoryList.innerHTML = "";

  if (memory.length === 0) {
    memoryList.innerHTML = '<div class="empty-memory">Память пуста</div>';
    return;
  }

  memory.forEach((item, index) => {
    const memoryItem = document.createElement("div");
    memoryItem.className = "memory-item";
    memoryItem.innerHTML = `
                    <strong>Запись ${index + 1}</strong>
                    ${item}
                    <button onclick="removeMemory(${index})">Удалить</button>
                `;
    memoryList.appendChild(memoryItem);
  });
}

function addToMemory() {
  const input = document.getElementById("userInput").value.trim();
  if (!input) {
    showNotification("Введите текст для сохранения в память", "warning");
    return;
  }

  memory.push(input);
  localStorage.setItem("aiMemory", JSON.stringify(memory));
  document.getElementById("userInput").value = "";
  loadMemory();

  addMessage(`Сохранено в память: "${input}"`, "system");
  showNotification("Текст успешно сохранен в память", "success");
}

function removeMemory(index) {
  const removedItem = memory[index];
  memory.splice(index, 1);
  localStorage.setItem("aiMemory", JSON.stringify(memory));
  loadMemory();

  addMessage(`Удалено из памяти: "${removedItem}"`, "system");
}

function clearMemory() {
  if (memory.length === 0) {
    showNotification("Память уже пуста", "warning");
    return;
  }

  if (confirm("Вы уверены, что хотите очистить всю память?")) {
    memory = [];
    localStorage.removeItem("aiMemory");
    loadMemory();
    addMessage("Вся память очищена", "system");
    showNotification("Память успешно очищена", "success");
  }
}

async function sendMessage() {
  const input = document.getElementById("userInput").value.trim();
  if (!input) {
    showNotification("Введите сообщение", "warning");
    return;
  }

  addMessage(input, "user");
  document.getElementById("userInput").value = "";

  // Показываем индикатор загрузки
  const loadingMsg = addMessage("AI обрабатывает запрос...", "ai");

  try {
    // Создаем промпт с памятью
    const memoryContext =
      memory.length > 0
        ? `Контекст (запомни навсегда):\n${memory.join("\n")}\n\n`
        : "";

    const fullPrompt = `${memoryContext}Текущий вопрос: ${input}`;
    const encodedPrompt = encodeURIComponent(fullPrompt);

    const response = await fetch(
      `https://text.pollinations.ai/${encodedPrompt}?model=openai`
    );

    if (!response.ok) throw new Error(`Ошибка HTTP: ${response.status}`);

    const text = await response.text();

    loadingMsg.remove();
    addMessage(text, "ai");
  } catch (error) {
    loadingMsg.remove();
    addMessage(`Ошибка: ${error.message}`, "ai");
    showNotification("Произошла ошибка при запросе к AI", "error");
  }
}

function addMessage(text, sender) {
  const messages = document.getElementById("messages");
  const messageDiv = document.createElement("div");
  messageDiv.className = `message ${sender}-message`;
  messageDiv.textContent = text;
  messages.appendChild(messageDiv);
  messages.scrollTop = messages.scrollHeight;
  return messageDiv;
}

function showNotification(message, type) {
  const notification = document.createElement("div");
  notification.textContent = message;
  notification.style.cssText = `
                position: fixed;
                top: 20px;
                right: 20px;
                padding: 12px 20px;
                border-radius: 6px;
                color: white;
                z-index: 1000;
                font-weight: 500;
                animation: slideInRight 0.3s ease;
            `;

  if (type === "success") {
    notification.style.background = "#333";
    notification.style.borderLeft = "3px solid #555";
  } else if (type === "error") {
    notification.style.background = "#422";
    notification.style.borderLeft = "3px solid #733";
  } else if (type === "warning") {
    notification.style.background = "#332";
    notification.style.borderLeft = "3px solid #663";
  }

  document.body.appendChild(notification);

  setTimeout(() => {
    notification.style.animation = "slideOutRight 0.3s ease";
    setTimeout(() => {
      if (notification.parentNode) {
        notification.parentNode.removeChild(notification);
      }
    }, 300);
  }, 3000);
}

const style = document.createElement("style");
style.textContent = `
            @keyframes slideInRight {
                from { transform: translateX(100%); opacity: 0; }
                to { transform: translateX(0); opacity: 1; }
            }
            
            @keyframes slideOutRight {
                from { transform: translateX(0); opacity: 1; }
                to { transform: translateX(100%); opacity: 0; }
            }
        `;
document.head.appendChild(style);

document.getElementById("userInput").addEventListener("keydown", function (e) {
  if (e.key === "Enter" && !e.shiftKey) {
    e.preventDefault();
    sendMessage();
  }
});

loadMemory();
