// stats-tracker.js

// Get or set visit counts
let pageVisits = localStorage.getItem("pageVisits") || 0;
let uniqueVisits = localStorage.getItem("uniqueVisits") ? 1 : 0;

pageVisits++;
localStorage.setItem("pageVisits", pageVisits);

if (!uniqueVisits) {
  uniqueVisits = 1;
  localStorage.setItem("uniqueVisits", true);
}

// Track tool clicks
document.addEventListener("DOMContentLoaded", () => {
  const tools = document.querySelectorAll("[data-tool]");
  tools.forEach(tool => {
    tool.addEventListener("click", () => {
      const toolName = tool.getAttribute("data-tool");
      let clickedTools = JSON.parse(localStorage.getItem("clickedTools") || "[]");
      if (!clickedTools.includes(toolName)) clickedTools.push(toolName);
      localStorage.setItem("clickedTools", JSON.stringify(clickedTools));
      updateStatsBox();
    });
  });

  updateStatsBox();
});

function updateStatsBox() {
  const clickedTools = JSON.parse(localStorage.getItem("clickedTools") || "[]");
  const lastModified = document.lastModified;

  const statsBox = document.createElement("div");
  statsBox.style.fontSize = "12px";
  statsBox.style.marginTop = "40px";
  statsBox.style.padding = "15px";
  statsBox.style.color = "#888";
  statsBox.style.textAlign = "center";

  statsBox.innerHTML = `
    Last Modified: ${lastModified}<br>
    Page Hits: ${localStorage.getItem("pageVisits")}<br>
    Unique Hits: ${localStorage.getItem("uniqueVisits") ? 1 : 0}<br>
    Tools Clicked: ${clickedTools.length ? clickedTools.join(", ") : "None"}
  `;

  document.body.appendChild(statsBox);
}
