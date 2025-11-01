// --- DOM elements ---
const chatForm = document.getElementById("chatForm");
const userInput = document.getElementById("userInput");
const chatWindow = document.getElementById("chatWindow");

// cloudfare URL
const workerURL = 'https://square-hill-a227.jacobbaskiewicz.workers.dev/';

// --- System prompt for L'Oréal/beauty-only answers ---
const systemPrompt =
  "You are a helpful assistant for L’Oréal. Only answer questions about L’Oréal products, beauty routines, skincare, haircare, and beauty-related recommendations. If a question is not related to these topics, politely reply: 'Sorry, I can only answer questions about L’Oréal products, beauty routines, or beauty-related topics.'";

// --- Get OpenAI API key from secret.js ---
// secret.js should define: window.OPENAI_API_KEY = "sk-...";
let apiKey = "";
if (window.OPENAI_API_KEY) {
  apiKey = window.OPENAI_API_KEY;
}

// --- Helper: append message to chat window ---
function appendMessage(text, sender) {
  const msgDiv = document.createElement("div");
  msgDiv.className = `msg ${sender}`;
  msgDiv.textContent = text;
  chatWindow.appendChild(msgDiv);
  chatWindow.scrollTop = chatWindow.scrollHeight;
}

// --- Initial greeting ---
chatWindow.innerHTML = "";
appendMessage("👋 Hello! How can I help you today?", "ai");

// --- Store chat history for context ---
const messages = [{ role: "system", content: systemPrompt }];

// --- Handle form submit ---
chatForm.addEventListener("submit", async (e) => {
  e.preventDefault();
  const userMsg = userInput.value.trim();
  if (!userMsg) return;

  // Show user message
  appendMessage(userMsg, "user");
  messages.push({ role: "user", content: userMsg });
  userInput.value = "";

  // Show loading message
  const loadingMsg = document.createElement("div");
  loadingMsg.className = "msg ai";
  loadingMsg.textContent = "Thinking...";
  chatWindow.appendChild(loadingMsg);
  chatWindow.scrollTop = chatWindow.scrollHeight;

  try {
    // Call Cloudflare Worker endpoint instead of OpenAI API directly
    const response = await fetch(workerURL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        messages: messages,
      }),
    });
    const data = await response.json();
    let aiMsg = "Sorry, I couldn't get a response.";
    // Expecting the worker to return { choices: [ { message: { content: ... } } ] }
    if (
      data &&
      data.choices &&
      data.choices[0] &&
      data.choices[0].message &&
      data.choices[0].message.content
    ) {
      aiMsg = data.choices[0].message.content.trim();
      messages.push({ role: "assistant", content: aiMsg });
    }
    loadingMsg.remove();
    appendMessage(aiMsg, "ai");
  } catch (err) {
    loadingMsg.remove();
    appendMessage("Sorry, there was an error connecting to the AI.", "ai");
  }
});
