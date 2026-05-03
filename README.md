<div align="center">

# 🧮 Math Helper

**Snap a photo of any math problem — get instant AI-powered solutions.**

[![Preview](https://img.shields.io/badge/Live%20Preview-GitHub%20Pages-6C63FF?style=for-the-badge&logo=github)](https://hammadashraf96.github.io/math-helper/)
[![React Native](https://img.shields.io/badge/React%20Native-0.81-61DAFB?style=for-the-badge&logo=react)](https://reactnative.dev/)
[![Expo](https://img.shields.io/badge/Expo-54-000020?style=for-the-badge&logo=expo)](https://expo.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.9-3178C6?style=for-the-badge&logo=typescript)](https://www.typescriptlang.org/)
[![OpenAI](https://img.shields.io/badge/OpenAI-API-412991?style=for-the-badge&logo=openai)](https://openai.com/)

</div>

---

## ✨ Features

- **📸 Scan & Solve** — Take a photo or upload any math problem (handwritten or printed). AI returns step-by-step solutions with difficulty ratings (Easy / Medium / Hard / Advanced).
- **📚 Structured Lessons** — Browse a full curriculum from Elementary to Advanced college math — Algebra, Geometry, Calculus, Statistics, Trigonometry, and more.
- **🧩 Practice Quizzes** — Test yourself by category and difficulty level. Track your 7-day streak.
- **🔖 Save & Revisit** — Save scanned problems to your personal library and track stats: scans saved, problems solved, topics covered.
- **⚙️ Settings** — Customize your experience with app preferences.

---

## 📱 App Preview

> **[👉 View the live preview here](https://hammadashraf96.github.io/math-helper/)**

<div align="center">
  <img src="https://hammadashraf96.github.io/math-helper/preview.png" alt="App Preview" width="700" />
</div>

---

## 🛠 Tech Stack

| Technology | Purpose |
|---|---|
| React Native 0.81 | Core mobile framework |
| Expo 54 + Expo Router | App bundling & file-based navigation |
| TypeScript | Type safety |
| OpenAI API | AI math analysis from photos |
| AsyncStorage | Persistent local storage for saved scans |
| Expo Image Picker | Camera & gallery access |
| Expo Vector Icons | UI icons |

---

## 🚀 Getting Started

### Prerequisites

- [Node.js](https://nodejs.org/) 18+
- [Expo CLI](https://docs.expo.dev/get-started/installation/)
- An [OpenAI API key](https://platform.openai.com/api-keys)
- Expo Go app on your phone ([iOS](https://apps.apple.com/app/expo-go/id982107779) / [Android](https://play.google.com/store/apps/details?id=host.exp.exponent))

### Installation

```bash
# 1. Clone the repository
git clone https://github.com/hammadashraf96/math-helper.git
cd math-helper

# 2. Install dependencies
npm install

# 3. Add your OpenAI API key
# Create a .env file in the project root:
echo "OPENAI_API_KEY=your_key_here" > .env

# 4. Start the dev server
npm start
```

Then scan the QR code with your phone's camera (iOS) or the Expo Go app (Android).

### Run on specific platforms

```bash
npm run android   # Android emulator / device
npm run ios       # iOS simulator (macOS only)
npm run web       # Browser
```

---

## 📂 Project Structure

```
math-helper/
├── app/
│   ├── (tabs)/
│   │   ├── index.tsx       # Dashboard — scan & recent saves
│   │   ├── learn.tsx       # Structured curriculum browser
│   │   ├── quiz.tsx        # Practice quizzes
│   │   ├── saved.tsx       # Saved problem library
│   │   └── settings.tsx    # App settings
│   └── _layout.tsx
├── components/
│   ├── LessonViewer.tsx    # Lesson content renderer
│   └── MathResults.tsx     # AI result display
├── constants/
│   ├── Colors.ts           # App color palette
│   ├── MockData.ts         # Quiz & user mock data
│   └── lessonData/         # Curriculum content by level
├── services/
│   ├── openai.ts           # OpenAI image analysis
│   └── lessons.ts          # Lesson service helpers
└── store/
    └── savedProblems.tsx   # AsyncStorage state for saved scans
```

---

## 🌐 GitHub Pages Setup

To enable the live preview page, go to your repository **Settings → Pages**, set the source to the `main` branch and `/ (root)` folder, and save. Your preview will be live at:

```
https://hammadashraf96.github.io/math-helper/
```

---

## 📄 License

MIT © [hammadashraf96](https://github.com/hammadashraf96)
