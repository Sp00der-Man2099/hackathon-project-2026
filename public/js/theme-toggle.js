const root = document.documentElement;
const themeToggle = document.querySelector("[data-theme-toggle]");
const themeToggleLabel = themeToggle?.querySelector(".theme-toggle-label");

function applyTheme(theme) {
    root.setAttribute("data-theme", theme);

    if (themeToggle) {
        themeToggle.setAttribute("aria-pressed", String(theme === "dark"));
    }

    if (themeToggleLabel) {
        themeToggleLabel.textContent = theme === "dark" ? " Light mode" : " Dark mode";
    }
}

const savedTheme = localStorage.getItem("drift-theme");
const activeTheme = savedTheme || root.getAttribute("data-theme") || "light";

applyTheme(activeTheme);

if (themeToggle) {
    themeToggle.addEventListener("click", () => {
        const nextTheme = root.getAttribute("data-theme") === "dark" ? "light" : "dark";
        localStorage.setItem("drift-theme", nextTheme);
        applyTheme(nextTheme);
    });
}
