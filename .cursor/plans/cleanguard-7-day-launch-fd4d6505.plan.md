<!-- fd4d6505-5828-4480-aad1-c8d079a68df5 b6d8b441-f425-437a-a58b-b18edfe219fc -->
# CleanGuard - 7-Day Implementation Plan

## Overview

Build **CleanGuard** - a VS Code extension for automated code review using 100% local static analysis (no AI, no cloud). Target: 500+ installs in Week 1.

**Brand Identity:**

- Name: CleanGuard
- Tagline: "Local. Safe. Clean."
- Logo: Shield + brush icon
- Colors: Blue (#007ACC) + Green (#28A745)

## Key Technical Decisions

### Technology Stack

- **TypeScript** (strict mode)
- **ESLint** + custom rules for analysis
- **jscpd** for code duplication detection
- **VS Code Extension API** for UI
- **Local JSON storage** for history (no cloud)

### Language Support (MVP)

- Focus: **TypeScript/JavaScript only**
- Reason: Ship fast, 80% of VS Code users use TS/JS

### Pre-commit Integration

- **VS Code Tasks** (not Git hooks)
- Reason: Easier setup, no permission issues, cross-platform

### Data Storage

- **Workspace-level**: `.vscode/review-history.json`
- Benefits: Per-project tracking, no sync issues

### Monetization

- **Free tier**: 10 rules, 30-day history
- **Pro tier ($4.99/mo)**: 100+ rules, unlimited history, custom rules
- Strategy: Ship all rules, license-gate pro features

## Implementation Phases

### Day 1: Foundation & Core Setup

**Goal**: Working VS Code extension with basic ESLint integration

**Tasks:**

1. Convert `package.json` to VS Code extension format with proper metadata
2. Create TypeScript project structure with proper tsconfig
3. Setup ESLint with @typescript-eslint/parser
4. Implement 5 core security rules (hardcoded secrets, SQL injection, XSS, eval, innerHTML)
5. Create extension activation and basic command registration
6. Test extension loads and runs ESLint on open files

**Files to create:**

- `src/extension.ts` - Main entry point
- `src/core/analyzer.ts` - ESLint wrapper
- `src/rules/security/*.ts` - 5 security rules
- `tsconfig.json`, `.vscodeignore`

### Day 2: Pre-commit Analysis & Blocking

**Goal**: Scan files before commit with quality metrics

**Tasks:**

1. Create VS Code task for pre-commit scan
2. Implement quality metrics calculator (cyclomatic complexity, maintainability index)
3. Add jscpd integration for duplication detection
4. Build diagnostic provider to show issues inline
5. Create "Review Current File" command
6. Add status bar indicator showing issue count

**Files:**

- `src/core/metrics.ts`
- `src/core/scanner.ts`
- `src/providers/diagnosticProvider.ts`
- `src/providers/statusBar.ts`

### Day 3: Timeline & History Tracking

**Goal**: Visual timeline showing code quality over time

**Tasks:**

1. Implement local storage manager (read/write `.vscode/review-history.json`)
2. Create webview provider for timeline visualization
3. Build chart component showing quality score trend
4. Add "Recent Reviews" list in sidebar
5. Implement CSV/JSON export functionality
6. Create sidebar tree view provider

**Files:**

- `src/core/storage.ts`
- `src/providers/timelineView.ts`
- `src/providers/sidebarProvider.ts`
- `src/utils/exporter.ts`

### Day 4: Polish & Performance Rules

**Goal**: Add 15 more rules + UI refinements

**Tasks:**

1. Add 10 performance rules (for...in on arrays, document.write, etc.)
2. Add 5 code style rules (const vs var, === vs ==, etc.)
3. Implement quick-fix actions for common issues
4. Add rule configuration via `.cleanguardrc` file
5. Optimize scanning performance (debouncing, caching)
6. Create "Scan Workspace" bulk operation

**Files:**

- `src/rules/performance/*.ts`
- `src/rules/style/*.ts`
- `src/core/quickFix.ts`
- `src/core/configLoader.ts`

### Day 5: Packaging & Marketing Materials

**Goal**: Ready for marketplace submission

**Tasks:**

1. Create professional README with GIF demos
2. Design extension icon (shield + brush)
3. Add screenshots for marketplace
4. Create CHANGELOG.md
5. Setup pro tier license validation (local check)
6. Package extension with vsce
7. Test on clean VS Code installation

**Files:**

- `README.md` (with badges, GIFs, features)
- `CHANGELOG.md`
- `icon.png`
- `images/*.png` (screenshots)

### Day 6: Publish & Distribution

**Goal**: Live on VS Code Marketplace

**Tasks:**

1. Create VS Code publisher account
2. Publish to VS Code Marketplace
3. Publish to Open VSX Registry (VS Codium users)
4. Setup GitHub repo (public)
5. Add GitHub Actions for CI/CD
6. Create simple landing section in README

**Deliverables:**

- Published extension on marketplace
- Public GitHub repo
- CI/CD pipeline

### Day 7: Marketing Blitz

**Goal**: 500+ downloads

**Tasks:**

1. Post on Reddit (r/vscode, r/programming, r/typescript)
2. Post on Hacker News with demo GIF
3. Write Dev.to article: "I Built a No-AI Code Reviewer in 7 Days"
4. Tweet thread with "Why No AI?" angle
5. Post in VS Code Discord/communities
6. Monitor downloads and respond to feedback
7. Fix any critical bugs reported

**Marketing Message:**

> "Tired of AI tools sending your code to the cloud? CleanGuard is 100% local, 100% transparent, 0% AI. Pre-commit code review that actually respects your privacy."

## File Structure

```
cleanguard/
├── src/
│   ├── extension.ts              # Main activation
│   ├── core/
│   │   ├── analyzer.ts           # ESLint integration
│   │   ├── metrics.ts            # Quality calculations
│   │   ├── scanner.ts            # File scanning
│   │   ├── storage.ts            # Local JSON storage
│   │   ├── configLoader.ts       # .cleanguardrc parser
│   │   └── quickFix.ts           # Code actions
│   ├── providers/
│   │   ├── diagnosticProvider.ts # Inline errors
│   │   ├── timelineView.ts       # Webview charts
│   │   ├── sidebarProvider.ts    # Tree view
│   │   └── statusBar.ts          # Status indicator
│   ├── rules/
│   │   ├── security/             # 5 security rules
│   │   ├── performance/          # 10 performance rules
│   │   └── style/                # 5 style rules
│   └── utils/
│       ├── exporter.ts           # CSV/JSON export
│       └── reporter.ts           # Format results
├── package.json                  # VS Code extension manifest
├── tsconfig.json
├── README.md
├── CHANGELOG.md
├── icon.png
└── .vscodeignore
```

## Success Metrics

| Day | Target | Measure |

|-----|--------|---------|

| D1 | Extension runs | Manual test |

| D2 | Finds 5 real bugs | Test on real projects |

| D3 | Timeline works | View 7-day chart |

| D4 | 20 rules pass | Unit tests |

| D5 | README perfect | Show to 3 devs |

| D6 | Live on marketplace | URL accessible |

| D7 | **500+ downloads** | Marketplace analytics |

## Risk Mitigation

**Risk 1**: ESLint custom rules too complex

- **Mitigation**: Use regex patterns for MVP, refine later

**Risk 2**: Performance issues on large codebases

- **Mitigation**: Scan only changed files, add file size limits

**Risk 3**: Low downloads Week 1

- **Mitigation**: "No AI" angle is timely, prepare 10+ marketing posts

**Risk 4**: Monetization unclear

- **Mitigation**: Free tier is fully functional, pro is "power user" upgrade

## GitHub Strategy - Why & How

GitHub serves multiple purposes beyond just code hosting:

| Purpose | Implementation | Example URL |

|---------|---------------|-------------|

| **Landing page** | GitHub Pages with custom domain | `https://yourname.github.io/cleanguard` |

| **Download link** | Link to VS Code Marketplace | `https://marketplace.visualstudio.com/items?itemName=yourname.cleanguard` |

| **Support & Community** | GitHub Discussions + Issues (no email needed) | `hi@cleanguard.dev` → redirect to Discussions |

| **SEO & Virality** | Beautiful README → shared on X, Reddit, HN | `github.com/yourname/cleanguard` becomes the canonical link |

| **Trust Signal** | Open source = transparent, auditable | Shows "No AI" promise is real |

| **CI/CD** | GitHub Actions for automated testing/publishing | Auto-publish on git tag |

**GitHub Pages Setup (Day 6):**

- Simple one-page site with:
  - Hero section: "Local. Safe. Clean."
  - Feature highlights
  - Install button → VS Code Marketplace
  - GitHub stars badge
  - Demo GIF
- Use `docs/` folder or `gh-pages` branch
- Optional: Custom domain `cleanguard.dev` (CNAME)

**Why This Works:**

- Single source of truth (GitHub repo)
- No need for separate backend/email server
- Community builds around public issues
- Every PR/issue = social proof
- Free hosting forever

## Next Steps After Launch

1. Gather user feedback (GitHub issues)
2. Add Python support (Week 2)
3. Implement team shared configs (Pro feature)
4. Build custom rule creator UI
5. Partnerships with bootcamps/courses

### To-dos

- [ ] Day 1: Setup VS Code extension foundation with TypeScript + ESLint + 5 security rules
- [ ] Day 2: Implement pre-commit scanning with quality metrics and status bar
- [ ] Day 3: Build timeline webview with history tracking and export
- [ ] Day 4: Add 15 more rules (performance + style) and optimize performance
- [ ] Day 5: Create marketing materials (README, icon, screenshots) and package extension
- [ ] Day 6: Publish to VS Code Marketplace and Open VSX, setup GitHub repo
- [ ] Day 7: Execute marketing blitz across Reddit, HN, Dev.to, Twitter - target 500 downloads