# Apple Notes Web

A beautiful, Apple-inspired notes web application.

![Apple Notes Web](https://via.placeholder.com/800x400?text=Apple+Notes+Web)

## ✨ Features

- **🍎 Apple Design** - Clean, minimalist interface inspired by Apple Notes
- **📝 Rich Text Editing** - Format text with headers, lists, code blocks, and more
- **🔍 Search** - Instantly find any note
- **📱 Responsive** - Works beautifully on desktop and mobile
- **💾 Local Storage** - Your notes are saved automatically in your browser
- **⌨️ Keyboard Shortcuts** - Power-user friendly
- **🎨 Dark Mode** - Automatically adapts to system preference
- **🔒 Privacy First** - All data stays on your device

## 🚀 Quick Start

### Local Development

```bash
# Clone the repository
git clone https://github.com/gaarry/apple-notes-web.git
cd apple-notes-web

# Open in browser (macOS)
open index.html

# Or serve with any static server
npx serve .
```

### GitHub Pages Deployment

1. **Enable GitHub Pages:**
   - Go to your repository → Settings → Pages
   - Source: "Deploy from a branch"
   - Branch: "main" → "/ (root)"
   - Click Save

2. **Your site will be live at:**
   ```
   https://gaarry.github.io/apple-notes-web/
   ```

## ⌨️ Keyboard Shortcuts

| Shortcut | Action |
|----------|--------|
| `Cmd/Ctrl + N` | New note |
| `Esc` | Cancel / Back |
| `Backspace` | Delete note (in delete mode) |

## 🎨 Design System

Built with Apple's Human Interface Guidelines in mind:

- **Typography**: SF Pro Display
- **Colors**: System blue (#007AFF), grays
- **Spacing**: 8pt grid system
- **Animations**: 150-250ms ease transitions
- **Radius**: 8px border radius on cards

## 📁 Project Structure

```
apple-notes-web/
├── index.html          # Main HTML structure
├── css/
│   ├── style.css       # Core styles & variables
│   ├── sidebar.css     # Navigation & list styles
│   └── editor.css      # Rich text editor styles
├── js/
│   └── app.js          # Application logic
├── assets/             # Images, icons
├── package.json        # npm configuration
└── README.md           # This file
```

## 🔧 Technologies

- **Vanilla HTML/CSS/JavaScript** - No frameworks needed
- **CSS Custom Properties** - For theming and dark mode
- **Local Storage API** - Persistent data storage
- **ContentEditable** - Rich text editing
- **CSS Flexbox/Grid** - Responsive layouts

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## 📝 License

MIT License - feel free to use for personal or commercial projects.

## 🙏 Acknowledgments

- Design inspired by [Apple Notes](https://support.apple.com/en-us/HT205773)
- Icons from [Heroicons](https://heroicons.com/)
- Font: [SF Pro Display](https://developer.apple.com/fonts/)

---

**Made with ❤️ by Gary**

