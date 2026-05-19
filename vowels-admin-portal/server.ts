import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import fs from "fs/promises";
import { existsSync } from "fs";

const DATA_FILE = path.join(process.cwd(), "students.json");

// Mock student data for initial setup
const INITIAL_STUDENTS: any[] = [];

async function readStudents() {
  if (!existsSync(DATA_FILE)) {
    await fs.writeFile(DATA_FILE, JSON.stringify(INITIAL_STUDENTS, null, 2));
    return INITIAL_STUDENTS;
  }
  try {
    const data = await fs.readFile(DATA_FILE, "utf-8");
    return JSON.parse(data);
  } catch (err) {
    console.error("Error reading students.json, falling back to empty:", err);
    return INITIAL_STUDENTS;
  }
}

async function writeStudents(students: any[]) {
  await fs.writeFile(DATA_FILE, JSON.stringify(students, null, 2));
}

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json({ limit: "10mb" }));

  // API Route for students
  app.get("/api/students", async (req, res) => {
    try {
      const students = await readStudents();
      res.json(students);
    } catch (err) {
      res.status(500).json({ error: "Failed to read students" });
    }
  });

  app.post("/api/students", async (req, res) => {
    try {
      const students = await readStudents();
      const newStudent = {
        id: students.length > 0 ? Math.max(...students.map((s: any) => s.id)) + 1 : 1,
        ...req.body
      };
      students.push(newStudent);
      await writeStudents(students);
      res.status(201).json(newStudent);
    } catch (err) {
      res.status(500).json({ error: "Failed to add student" });
    }
  });

  app.put("/api/students/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id, 10);
      let students = await readStudents();
      const index = students.findIndex((s: any) => s.id === id);
      if (index === -1) {
        return res.status(404).json({ error: "Student not found" });
      }
      students[index] = { ...students[index], ...req.body, id };
      await writeStudents(students);
      res.json(students[index]);
    } catch (err) {
      res.status(500).json({ error: "Failed to update student" });
    }
  });

  app.delete("/api/students/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id, 10);
      let students = await readStudents();
      students = students.filter((s: any) => s.id !== id);
      await writeStudents(students);
      res.json({ message: "Student deleted successfully" });
    } catch (err) {
      res.status(500).json({ error: "Failed to delete student" });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
