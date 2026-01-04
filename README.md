# K12 Tools

Free, ad-free classroom tools that work offline without accounts. Safe for school IT filtering.

**Website:** [k12tools.org](https://k12tools.org)

## Features

- **No ads, no trackers** - Completely free and private
- **Offline-friendly** - Everything runs client-side in your browser
- **No accounts required** - Just open and use
- **School IT safe** - No external scripts or CDNs
- **Projector-friendly** - Large display modes and fullscreen support
- **Dark mode default** - Easy on the eyes with good contrast

## Tools Included

1. **Countdown Timer** - Presets (1, 3, 5, 10, 15 min) + custom input, optional end beep, fullscreen mode
2. **Stopwatch** - Start/Pause/Reset with lap recording
3. **Random Student Picker** - Import names, "no repeats" option, pick history
4. **Group Maker** - Split students by group size or number of groups, export to CSV
5. **Noise Meter** - Microphone-based visualization (bouncing balls or bar), sensitivity controls
6. **Dice Roller & RNG** - Multiple dice types, random number generator with unique draw option
7. **QR Code Generator** - Offline QR code creation, download as PNG
8. **Agenda Board** - Customizable daily agenda display with presets
9. **Team Points** - Track scores for up to 8 teams
10. **Traffic Light** - Visual classroom management signal
11. **Station Timer** - Multi-stage rotation timer
12. **Seating Chart** - Drag-and-drop seating arrangements with CSV import/export
13. **Soundboard** - Classroom sound effects and attention signals
14. **Bingo Generator** - Create printable bingo cards with custom word lists

## Quick Start

### Option 1: Open Locally
Simply double-click `index.html` to open in your default browser. No server required!

### Option 2: Local Development Server
```bash
# Using Python 3
python -m http.server 8000

# Using Node.js (npx)
npx serve

# Using PHP
php -S localhost:8000
```

Then open `http://localhost:8000` in your browser.

## Hosting

### GitHub Pages

1. Push this repository to GitHub
2. Go to Settings > Pages
3. Select "Deploy from a branch"
4. Choose `main` (or `master`) branch, root folder
5. Save and wait for deployment

### Cloudflare Pages

1. Push to GitHub/GitLab
2. Go to Cloudflare Dashboard > Pages
3. Create a project and connect your repository
4. Build settings:
   - Build command: (leave empty)
   - Build output directory: `/`
5. Deploy

### Netlify

1. Drag and drop the folder to [Netlify Drop](https://app.netlify.com/drop)
2. Or connect your GitHub repository

### Vercel

1. Push to GitHub
2. Import project at [vercel.com](https://vercel.com)
3. Framework: Other
4. Deploy

### Any Static Host

Upload these files to any web server or static hosting:
- `index.html`
- `styles.css`
- `app.js`

## Configuration

### Theme

Toggle between dark and light mode in Settings. Preference is saved locally.

## Privacy

- **No data collection** - Nothing is sent to any server
- **No external requests** - All code runs locally
- **No cookies** - Only localStorage for your preferences
- **Microphone** - Only used when Noise Meter is active, never recorded

## Data Storage

All data is stored in your browser's localStorage:
- Student name lists (Student Picker, Group Maker)
- Theme preference
- Seating charts and rosters

Clear all data via Settings > "Clear All Local Data"

## Browser Support

Works in all modern browsers:
- Chrome/Edge (recommended)
- Firefox
- Safari
- Opera

Note: Noise Meter requires microphone access and WebAudio API support.

## Contact

- **Support:** support@k12tools.org
- **Ideas:** idea@k12tools.org

## License

MIT License - Use freely for any purpose.

---

Made with care for teachers everywhere. A [Little Spruce Labs](https://www.littlesprucelabs.com/) project.
