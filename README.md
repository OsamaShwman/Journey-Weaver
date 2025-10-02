# Journey Weaver

Build and share stunning, interactive map-based stories. Journey Weaver lets you craft custom tours with detailed landmarks, multimedia content (images, video, audio), engaging quizzes, and an integrated AI assistant powered by the Gemini API.

---

## ✨ Features

- **Interactive Leaflet Map:** Smoothly pan, zoom, and fly to different locations on a detailed world map.
- **Custom Tour Upload:** Create your own adventures by uploading a simple JSON file with your points of interest.
- **Rich Landmark Details:** Each stop on your tour can feature:
    - A title and detailed description.
    - A high-resolution image.
    - An embedded YouTube video.
    - An ambient audio track or narration.
- **AI-Powered Q&A:** An integrated "Ask AI" tab, powered by the Gemini API, allows users to ask questions about the current landmark for a more interactive learning experience.
- **Engaging Quizzes:** Add multiple-choice or true/false questions to your landmarks. You can even block navigation until a quiz is successfully completed.
- **Sleek & Responsive UI:** A modern interface built with React, TypeScript, and Tailwind CSS that looks great on any device.
- **Smooth Animations:** Fluid transitions between landmarks create a polished, professional feel.

## 🚀 Getting Started

This application is designed to run directly in the browser with no build step required.

### Configuration

To enable the "Ask AI" feature, you must have a Gemini API key.

1.  Obtain a key from [Google AI Studio](https://aistudio.google.com/app/apikey).
2.  Set it as an environment variable named `API_KEY` in the execution environment where the app is served. The application code will automatically pick it up via `process.env.API_KEY`.

## 🧭 How to Use

1.  **Explore the Default Tour:** When you first load the app, it presents a pre-configured tour of Jordan's most famous landmarks. Use the navigation arrows or click on map icons to explore.
2.  **Upload Your Own Tour:**
    - Click the **Upload** button (the cloud icon with an up arrow) in the bottom-left corner.
    - Select a valid JSON file from your computer that follows the format described below.
    - The map will instantly update with your custom tour, ready for you to explore!

## 📄 Custom Tour JSON Format

To create your own tour, create a `.json` file containing an array of landmark objects. The app is forgiving and will try to parse common variations in key names (e.g., `name` or `city`, `imageUrl` or `image`).

### Basic Structure

```json
[
  {
    "name": "Your Landmark Name",
    "description": "A rich description of the landmark. HTML tags like <p> and <b> are supported for formatting.",
    "coordinates": [LATITUDE, LONGITUDE],
    "imageUrl": "https://example.com/image.jpg",
    "videoUrl": "https://www.youtube.com/watch?v=your_video_id",
    "audioUrl": "https://example.com/audio.mp3",
    "block_navigation": false,
    "quiz": [
      {
        "question": "What year was this built?",
        "type": "multiple-choice",
        "options": [
          { "text": "1990", "isCorrect": false },
          { "text": "2005", "isCorrect": true },
          { "text": "1875", "isCorrect": false }
        ]
      }
    ]
  }
]
```

### Field Reference

| Key | Type | Required | Description |
| :--- | :--- | :--- | :--- |
| `name` | `string` | **Yes** | The primary name of the landmark. |
| `description` | `string` | **Yes** | A description of the landmark. Can include basic HTML for formatting. |
| `coordinates` | `[number, number]` | **Yes** | An array containing `[latitude, longitude]`. |
| `imageUrl` | `string` | No | A URL to a display image. If omitted, a placeholder is used. |
| `videoUrl` | `string` | No | A URL to a YouTube video to be embedded in the "Media" tab. |
| `audioUrl` | `string` | No | A URL to a direct audio file (e.g., `.mp3`) or a SoundCloud track for the "Media" tab. |
| `iconType` | `string` | No | The type of map icon. Can be `"monument"`, `"nature"`, or `"water"`. Defaults to `"monument"`. |
| `block_navigation`| `boolean`| No | If `true` and a `quiz` is present, the user cannot proceed to the next landmark without completing the quiz. Defaults to `false`. |
| `quiz` | `QuizQuestion[]`| No | An array of quiz questions for this landmark. |

### Quiz Structure

The `quiz` array contains question objects.

| Key | Type | Required | Description |
| :--- | :--- | :--- | :--- |
| `question` | `string` | **Yes** | The text of the question. |
| `type` | `string` | **Yes** | The question type. Can be `"multiple-choice"` or `"true-false"`. |
| `options` | `QuizOption[]` | **Yes** | An array of option objects. |

Each object in the `options` array must have:
- `text` (`string`): The answer text.
- `isCorrect` (`boolean`): Set to `true` for the correct answer.

---

This project was created with React, TypeScript, and Tailwind CSS.
