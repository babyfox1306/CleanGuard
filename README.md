# CleanGuard 🛡️

> **Local. Safe. Clean.** Pre-commit code review with 100% local static analysis - no AI, no cloud.

[![No AI](https://img.shields.io/badge/AI-Free-brightgreen)](https://github.com/nhtua/cleanguard)
[![Local Only](https://img.shields.io/badge/Cloud-Free-blue)](https://github.com/nhtua/cleanguard)
[![VS Code](https://img.shields.io/badge/VS%20Code-Extension-007ACC)](https://marketplace.visualstudio.com/items?itemName=nhtua.cleanguard)
[![Downloads](https://img.shields.io/badge/Downloads-500%2B-brightgreen)](https://marketplace.visualstudio.com/items?itemName=nhtua.cleanguard)

## 🚀 Why CleanGuard?

Tired of AI tools sending your code to the cloud? CleanGuard is **100% local, 100% transparent, 0% AI**. 

- ✅ **No AI** - Pure static analysis using ESLint + custom rules
- ✅ **No Cloud** - Everything runs locally on your machine
- ✅ **No Privacy Risks** - Your code never leaves your computer
- ✅ **Fast & Reliable** - Instant analysis without network delays
- ✅ **Transparent** - All rules are open source and auditable

## 🎯 Features

### 🔒 Security Analysis
- Hardcoded secrets detection
- SQL injection prevention
- XSS vulnerability scanning
- Dangerous function usage (eval, innerHTML)

### ⚡ Performance Optimization
- Inefficient loop detection
- DOM query optimization
- Memory leak prevention
- Synchronous operation warnings

### 🎨 Code Quality
- Style consistency checks
- Magic number detection
- Console statement cleanup
- Debugger statement removal

### 📊 Quality Metrics
- Cyclomatic complexity analysis
- Maintainability index calculation
- Code duplication detection
- Quality score trending

### 📈 Timeline & History
- Visual quality trends
- Review history tracking
- Export capabilities (CSV/JSON)
- Team dashboard insights

## 🚀 Quick Start

1. **Install CleanGuard**
   ```bash
   # Install from VS Code Marketplace
   code --install-extension nhtua.cleanguard
   ```

2. **Review Your Code**
   - Press `Ctrl+Shift+P` → "CleanGuard: Review Current File"
   - Or use the sidebar timeline view

3. **Configure Rules**
   ```json
   // .cleanguardrc
   {
     "enabled": true,
     "rules": {
       "security": true,
       "performance": true,
       "style": true
     },
     "excludePatterns": ["**/node_modules/**"]
   }
   ```

## 📸 Screenshots

### Dashboard Overview
![CleanGuard Dashboard](https://raw.githubusercontent.com/cleanguard/cleanguard/main/images/dashboard.png)

### Issue Detection
![Issue Detection](https://raw.githubusercontent.com/cleanguard/cleanguard/main/images/issues.png)

### Timeline View
![Timeline View](https://raw.githubusercontent.com/cleanguard/cleanguard/main/images/timeline.png)

## 🛠️ Commands

| Command | Description |
|---------|-------------|
| `CleanGuard: Review Current File` | Analyze the currently open file |
| `CleanGuard: Review Workspace` | Scan entire workspace |
| `CleanGuard: Show Timeline` | Open quality timeline dashboard |
| `CleanGuard: Export CSV` | Export timeline data to CSV |
| `CleanGuard: Export JSON` | Export timeline data to JSON |
| `CleanGuard: Export Report` | Generate quality report |

## ⚙️ Configuration

### VS Code Settings
```json
{
  "cleanguard.enabled": true,
  "cleanguard.rules.security": true,
  "cleanguard.rules.performance": true,
  "cleanguard.rules.style": true,
  "cleanguard.autoAnalyzeOnSave": true,
  "cleanguard.showStatusBar": true
}
```

### Workspace Configuration (.cleanguardrc)
```json
{
  "enabled": true,
  "rules": {
    "security": true,
    "performance": true,
    "style": true
  },
  "customRules": [],
  "excludePatterns": [
    "**/node_modules/**",
    "**/dist/**",
    "**/build/**"
  ],
  "maxFileSize": 500,
  "autoAnalyzeOnSave": true
}
```

## 🔧 Custom Rules

Create your own rules by extending the base rule classes:

```typescript
// src/rules/custom/myRule.ts
export class MyCustomRule {
    async analyze(code: string, fileName: string): Promise<Issue[]> {
        // Your custom analysis logic
        return issues;
    }
}
```

## 📊 Supported Languages

- ✅ TypeScript
- ✅ JavaScript
- ✅ React (TSX/JSX)
- 🔄 Python (coming soon)
- 🔄 Java (coming soon)

## 🚀 Performance

- **Startup Time**: < 200ms
- **Memory Usage**: < 50MB
- **Analysis Speed**: < 1s per file
- **UI Responsiveness**: < 100ms

## 🔒 Privacy & Security

CleanGuard is designed with privacy-first principles:

- **No Data Collection**: We don't collect any usage data
- **No Telemetry**: No analytics or tracking
- **No Network Calls**: Everything runs offline
- **Open Source**: All code is auditable
- **Local Storage**: Data stays on your machine

## 🤝 Contributing

We welcome contributions! Here's how to get started:

1. **Fork the repository**
2. **Create a feature branch**
   ```bash
   git checkout -b feature/amazing-feature
   ```
3. **Make your changes**
4. **Run tests**
   ```bash
   npm test
   ```
5. **Submit a pull request**

### Development Setup

```bash
# Clone the repository
git clone https://github.com/cleanguard/cleanguard.git

# Install dependencies
npm install

# Run in development mode
npm run watch

# Package extension
npm run package
```

## 📈 Roadmap

### Version 1.1 (Coming Soon)
- [ ] Python support
- [ ] Java support
- [ ] Custom rule builder UI
- [ ] Team collaboration features

### Version 1.2 (Future)
- [ ] Git integration
- [ ] CI/CD pipeline support
- [ ] Advanced metrics
- [ ] Plugin system

## 🆘 Support

- **Documentation**: [GitHub Wiki](https://github.com/nhtua/cleanguard/wiki)
- **Issues**: [GitHub Issues](https://github.com/nhtua/cleanguard/issues)
- **Discussions**: [GitHub Discussions](https://github.com/nhtua/cleanguard/discussions)
- **Landing Page**: [GitHub Pages](https://nhtua.github.io/cleanguard)

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- ESLint team for the amazing static analysis engine
- VS Code team for the excellent extension API
- Open source community for inspiration and feedback

---

**Made with ❤️ by developers, for developers**

[Install CleanGuard](https://marketplace.visualstudio.com/items?itemName=nhtua.cleanguard) | [View on GitHub](https://github.com/nhtua/cleanguard) | [Report Issues](https://github.com/nhtua/cleanguard/issues)
