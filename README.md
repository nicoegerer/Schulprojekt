# ⚡ Reaction Game

Ein minimalistisches Browser-Reaktionsspiel gebaut mit **Vite**, **React** und **Tailwind CSS**.

## 🚀 Starten

### Voraussetzungen
- [Node.js](https://nodejs.org/) (Version 18 oder neuer)
- Ein Terminal (z.B. PowerShell, Mac Terminal)

### Installation

```bash
# 1. Repository klonen
git clone https://github.com/nicoegerer/Schulprojekt.git
cd Schulprojekt

# 2. Abhängigkeiten installieren
npm install

# 3. Dev-Server starten
npm run dev
```

Dann im Browser öffnen: **http://localhost:5173**

## 🎮 Spielregeln

1. Klicke irgendwo auf den Bildschirm um zu starten
2. Warte bis der Bildschirm **grün** wird
3. Klicke so schnell wie möglich!
4. Klickst du zu früh → Strafe! 🔴

## 🛠️ Tech Stack

| Tool | Verwendung |
|------|-----------|
| **Vite** | Build-Tool & Dev-Server |
| **React** | UI-Komponenten & State |
| **Tailwind CSS** | Styling |

## 📁 Projektstruktur

```
reaction-game/
├── index.html          ← Einstiegspunkt
├── vite.config.js      ← Vite Konfiguration
├── tailwind.config.js  ← Tailwind Konfiguration
├── postcss.config.js   ← PostCSS (für Tailwind)
├── package.json        ← Abhängigkeiten
└── src/
    ├── main.jsx        ← React Einstiegspunkt
    ├── App.jsx         ← Haupt-Komponente (das Spiel)
    └── index.css       ← Tailwind Import + globale Styles
```
