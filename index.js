require("dotenv").config();

const express = require("express");
const multer = require("multer");
const cors = require("cors");
const pdf = require("pdf-parse");
const fs = require("fs");
const { CohereClient } = require("cohere-ai");

const cohere = new CohereClient({
  token: process.env.COHERE_API_KEY
});

const app = express();
const upload = multer({ dest: "uploads/" });

// app.use(cors());
import cors from "cors";

app.use(cors({
  origin: "*"
}));

app.post("/analyze-resume", upload.single("resume"), async (req, res) => {
  try {
    const buffer = fs.readFileSync(req.file.path);
    const pdfData = await pdf(buffer);

    const prompt = `
    PERHATIAN PENTING:
    - GUNAKAN 100% BAHASA INDONESIA FORMAL
    - DILARANG menggunakan bahasa asing apa pun
    - Jika terdapat kata/kalimat bahasa asing, TERJEMAHKAN ke bahasa Indonesia
    - Jangan gunakan huruf atau karakter non-latin

    Kamu adalah HR dan Career Advisor profesional.

    Berikut isi resume kandidat:

    ${pdfData.text}

    Tugas kamu:
    1. Analisa resume kandidat
    2. Jika ada bahasa asing → TERJEMAHKAN
    3. Gunakan istilah profesional Bahasa Indonesia

    Format WAJIB:

    SKOR_KECOCOKAN: (angka 0-100)

    KEAHLIAN_UTAMA:
    - ...

    POSISI_COCOK:
    - ...

    REKOMENDASI_SKILL:
    - ...
    `;

    const response = await cohere.chat({
      model: "command-a-03-2025", // <– model terbaru
      message: prompt,
      temperature: 0.4
    });

    fs.unlinkSync(req.file.path);

    res.json({
      result: response.text
    });

  } catch (err) {
    console.error("COHERE ERROR:", err);
    res.status(500).json({ error: err.message });
  }
});

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log("Backend running on port", PORT);
});
// app.listen(3000, () => {
//   console.log("Backend running on http://localhost:3000");
// });
