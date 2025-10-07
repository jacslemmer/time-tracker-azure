# Time Tracker - Azure Native Web Application

**Version:** 1.0.0 (Azure-Native)
**Created:** October 7, 2025
**Purpose:** Learning Azure deployment patterns with simple MVP app

---

## 🎯 Project Overview

This is an **Azure-native rebuild** of the Time Tracker desktop application. Built from scratch with Azure deployment in mind, not ported from existing codebase.

**What it does:**
- Track time for client projects
- Set hourly rates and budgets
- Start/stop timers
- Manual time entry
- Generate reports
- Budget tracking and alerts

---

## 📋 Important: Read Before Starting

**⚠️ MUST READ FIRST:**
```bash
~/Documents/platform-documentation/azure/01-AZURE-DEPLOYMENT-COMPLETE-GUIDE.md
```

This contains all Azure deployment requirements, gotchas, and human intervention steps.

---

## 🏗️ Architecture

**Type:** Web Application (not Electron desktop app)

**Stack:**
- **Backend:** Node.js + Express + TypeScript
- **Frontend:** React (or vanilla JS - TBD)
- **Database:** External PostgreSQL (Supabase) - free tier
- **Storage:** Azure Blob Storage (if needed for files)
- **Hosting:**
  - Backend: Azure Container Apps
  - Frontend: Azure Static Web Apps

**Built For Azure:**
- ✅ No local file storage
- ✅ Console logging only
- ✅ Environment variables
- ✅ CORS configured
- ✅ Health endpoints
- ✅ Proper start scripts
- ✅ Docker containerized

---

## 📁 Project Structure

```
time-tracker-azure/
├── README.md                 # This file
├── SESSION-CONTEXT.md        # Full session history (READ THIS FIRST!)
├── azure.yaml               # Azure deployment config
├── backend/                 # API server
├── frontend/                # Web UI
└── docs/                    # Documentation
```

---

## 🚀 Quick Start

### Prerequisites
1. Read `SESSION-CONTEXT.md` (has all context from previous session)
2. Read platform documentation
3. Set up Supabase account
4. Install Azure CLI and login
5. Register Azure providers

### Development
```bash
# Backend
cd backend
npm install
npm run dev

# Frontend
cd frontend
npm install
npm run dev
```

### Deployment
```bash
# See platform documentation
# Follow Category A checklist
# Complete Category C manual tasks
# Deploy!
```

---

## 📚 Related Projects

**Original Desktop App:**
- Location: `~/git/time-tracker/`
- Type: Electron desktop application
- Storage: Local JSON file
- Purpose: Reference for features to implement

**Failed Deployment Attempt:**
- Project: Guerilla Teaching (aborted)
- Reason: Wrong scope (production site, not MVP)
- Lessons: Documented in platform documentation

---

## 🎓 Learning Goals

1. **Azure-native development patterns**
2. **Smooth deployment experience** (< 1 hour)
3. **Validate platform documentation**
4. **Reusable patterns for future MVPs**

---

## 📊 Success Criteria

- [ ] All Time Tracker features working
- [ ] Deployed to Azure successfully
- [ ] Deployment time < 60 minutes
- [ ] No critical unexpected issues
- [ ] Documentation updated with findings

---

## ⏰ Time Budget

- Architecture: 15 min
- Backend dev: 2-3 hours
- Frontend dev: 2-3 hours
- Deployment: 45 min
- Testing: 30 min
- **Total: 6-7 hours**

---

## 🔗 Quick Links

- **Platform Docs:** `~/Documents/platform-documentation/`
- **Original App:** `~/git/time-tracker/`
- **Azure Portal:** https://portal.azure.com/
- **Supabase:** https://supabase.com/

---

**Status:** Ready for development
**Next:** Review SESSION-CONTEXT.md, then start building!
