import fs from "node:fs/promises";
import path from "node:path";
import crypto from "node:crypto";
import express from "express";
import { fileURLToPath } from "node:url";

const app = express();
const port = 3000;
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const dataDirectory = path.join(__dirname, "data");
const habitsFilePath = path.join(dataDirectory, "habits.json");

const starterHabits = [
    {
        id: "starter-water",
        name: "Drink water before coffee",
        cue: "Start the day gently",
        schedule: "Morning",
        completedToday: true,
        streak: 4
    },
    {
        id: "starter-walk",
        name: "10 minute walk",
        cue: "Reset after lunch",
        schedule: "Afternoon",
        completedToday: false,
        streak: 2
    },
    {
        id: "starter-journal",
        name: "Write one line in a journal",
        cue: "Close the day with reflection",
        schedule: "Evening",
        completedToday: false,
        streak: 6
    }
];

let habits = [];

app.set("view engine", "ejs");
app.use(express.static("public"));
app.use(express.urlencoded({ extended: true }));

async function loadHabits() {
    try {
        const savedHabits = await fs.readFile(habitsFilePath, "utf8");
        const parsedHabits = JSON.parse(savedHabits);

        if (Array.isArray(parsedHabits)) {
            habits = parsedHabits;
            return;
        }
    } catch (error) {
        if (error.code !== "ENOENT") {
            console.error("Unable to read habits.json, using starter habits instead.", error);
        }
    }

    habits = starterHabits;
    await saveHabits();
}

async function saveHabits() {
    await fs.mkdir(dataDirectory, { recursive: true });
    await fs.writeFile(habitsFilePath, JSON.stringify(habits, null, 2));
}

function buildDashboardState() {
    const completedCount = habits.filter((habit) => habit.completedToday).length;
    const totalCount = habits.length;
    const pendingCount = totalCount - completedCount;
    const completionRate = totalCount === 0 ? 0 : Math.round((completedCount / totalCount) * 100);
    const totalStreak = habits.reduce((sum, habit) => sum + habit.streak, 0);

    return {
        habits,
        stats: {
            completedCount,
            pendingCount,
            totalCount,
            completionRate,
            totalStreak
        }
    };
}

app.get("/", (req, res) => {
    res.render("home.ejs");
});

app.get("/dashboard", (req, res) => {
    res.render("dashboard.ejs", buildDashboardState());
});

app.post("/habits", async (req, res, next) => {
    try {
        const name = req.body.name?.trim();
        const cue = req.body.cue?.trim();
        const schedule = req.body.schedule?.trim();

        if (name) {
            habits.push({
                id: crypto.randomUUID(),
                name,
                cue: cue || "A small step that supports your day",
                schedule: schedule || "Anytime",
                completedToday: false,
                streak: 0
            });

            await saveHabits();
        }

        res.redirect("/dashboard");
    } catch (error) {
        next(error);
    }
});

app.post("/habits/:id/toggle", async (req, res, next) => {
    try {
        const habit = habits.find((entry) => entry.id === req.params.id);

        if (habit) {
            const nextCompleted = !habit.completedToday;
            habit.completedToday = nextCompleted;
            habit.streak = nextCompleted ? habit.streak + 1 : Math.max(habit.streak - 1, 0);
            await saveHabits();
        }

        res.redirect("/dashboard");
    } catch (error) {
        next(error);
    }
});

app.post("/habits/:id/delete", async (req, res, next) => {
    try {
        const nextHabits = habits.filter((entry) => entry.id !== req.params.id);

        if (nextHabits.length !== habits.length) {
            habits = nextHabits;
            await saveHabits();
        }

        res.redirect("/dashboard");
    } catch (error) {
        next(error);
    }
});

app.use((error, req, res, next) => {
    console.error("Unexpected error while handling request.", error);
    res.status(500).send("Something went wrong while saving your habits.");
});

await loadHabits();

app.listen(port, () => {
    console.log(`server started on http://localhost:${port}`);
});
