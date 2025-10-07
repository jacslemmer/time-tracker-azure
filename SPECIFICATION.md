# Time Tracker Application - Technical Specification

**Version:** 1.0.0 (Azure-Native Web Application)
**Source Platform:** macOS Desktop (Electron 38.2.1)
**Target Platform:** Azure Web Application
**Language:** TypeScript
**Last Updated:** October 7, 2025

---

## Table of Contents

1. [Overview](#overview)
2. [Core Features](#core-features)
3. [Data Model](#data-model)
4. [User Interface](#user-interface)
5. [Business Logic](#business-logic)
6. [Safety Features](#safety-features)
7. [Reporting System](#reporting-system)
8. [API Reference](#api-reference)
9. [Azure Adaptations](#azure-adaptations)
10. [Development Priorities](#development-priorities)

---

## Overview

### Purpose
Time Tracker is a web application for tracking billable hours across multiple client projects with integrated budget management and comprehensive reporting capabilities.

### Target Users
- Freelancers
- Consultants
- Agencies managing multiple client projects
- Any professional billing by the hour

### Key Value Propositions
1. **Real-time tracking** with visual timer display
2. **Budget monitoring** with automated warnings
3. **Flexible time entry** (timer-based or manual)
4. **Comprehensive reporting** with multiple aggregation views
5. **Data safety** with automatic warnings for long sessions
6. **Export capabilities** for billing and record-keeping
7. **Cloud-based access** from anywhere

### Original Desktop Context
This specification is based on the Time Tracker v1.0.0 desktop application (Electron) and adapted for Azure cloud deployment as a web application.

---

## 🎯 Core Functionality

### 1. Project Management

**Create Project:**
- Client Name (text, optional - can be empty)
- Project Name (text, required)
- Hourly Rate (number, currency format - R, required)
- Budget (number, currency format - R, required)
- Auto-generate unique ID on creation (timestamp-based)
- Initialize total time to 0 seconds

**Edit Project:**
- Modify client name
- Modify project name
- Update hourly rate
- Update budget
- Cannot edit while timer is running

**Delete Project:**
- Confirmation dialog required
- Warning: "All time entries will be lost"
- Cascading delete of all associated time entries
- Remove project from database

**View Projects:**
- List all projects (grid/card layout)
- Empty state message: "No projects yet" with call-to-action

---

### 2. Time Tracking

**Timer-Based Tracking:**
- Start timer for project
  - Only one timer can run at a time (single project focus)
  - Record start timestamp with millisecond precision
  - Set project status to "running"
  - Begin live timer display (HH:MM:SS format)
  - Store start time as Unix timestamp (ms)

- Stop timer for project
  - Calculate elapsed time: `Math.floor((Date.now() - startTime) / 1000)`
  - Add elapsed seconds to project total
  - Create time entry record with start/end timestamps
  - Reset running status (isRunning = false)
  - Clear startTime property
  - Save data immediately

**Live Timer Display:**
- Format: HH:MM:SS (e.g., 02:45:30)
- Update every second (1000ms interval)
- Show cumulative time (project.totalSeconds + current session elapsed)
- Monospace font family (Courier New or similar)
- Large, prominent display (2rem font size)

**Manual Time Entry:**
- Add hours manually to any project (useful for offline work or retroactive entries)
- Input field: decimal hours (e.g., 2.5 for 2.5 hours)
- Support decimal precision (minimum 0.01 hours)
- Convert hours to seconds: `Math.floor(hours * 3600)`
- Add to project total
- Create time entry with isManual flag set to true
- Use same timestamp (Date.now()) for both start and end times

---

### 3. Project Display & Statistics

**Each Project Card Shows:**

1. **Header Section:**
   - Client name (uppercase, colored accent)
   - Project name (large, bold)
   - Edit button
   - Delete button

2. **Timer Display:**
   - Large digital clock format
   - Shows current total (including running time if active)

3. **Statistics Grid:**
   - **Total Hours:** totalSeconds / 3600, 2 decimal places
   - **Hourly Rate:** R format, 2 decimal places
   - **Billing:**
     - Calculation: (totalHours * hourlyRate) / budget
     - Format: R billing / R budget
     - Color coding:
       - Normal: < 80% of budget (default background)
       - Warning: 80-99% of budget (yellow background)
       - Danger: ≥ 100% of budget (red background)

4. **Action Buttons:**
   - Start/Stop timer (conditional based on running state)
   - Add Manual Hours
   - View Entries

---

### 4. Time Entry Management

**Time Entry Record Contains:**
- Project ID (reference)
- Seconds (duration)
- Start time (timestamp)
- End time (timestamp)
- Is manual flag (boolean)
- Index (for editing/deletion)

**View Time Entries:**
- Show all entries for specific project
- Display in table format
- Columns:
  - Date (localized date/time string)
  - Duration (HH:MM:SS format)
  - Hours (decimal, 2 places)
  - Type (Manual ✍️ or Timer ⏱️)
  - Actions (Edit, Delete buttons)
- Sort by most recent first (descending by startTime)
- Modal overlay presentation

**Edit Time Entry:**
- Show current hours
- Allow editing hours (decimal input)
- Calculate difference from old time
- Update project total accordingly
- Can reduce or increase hours
- Prevent negative project totals

**Delete Time Entry:**
- Confirmation required
- Subtract entry seconds from project total
- Remove entry from database
- Refresh project display
- Prevent negative project totals (floor at 0)

---

### 5. Reporting System

**Report Types:**

1. **All Entries Report**
   - Shows every time entry across all projects
   - Columns:
     - Date
     - Client
     - Project
     - Start Time (or "Manual")
     - End Time (or "Manual")
     - Hours (2 decimal places)
     - Rate (R format)
     - Billing (calculated: hours * rate)
     - Type (Manual/Tracked badge)
   - Summary totals:
     - Total Entries count
     - Total Hours
     - Total Billing (R format)

2. **By Client Report**
   - Group all entries by client name
   - Columns:
     - Client name
     - Entry count
     - Total hours
     - Total billing
   - Summary totals:
     - Total Clients count
     - Total Hours
     - Total Billing

3. **By Project Report**
   - Group entries by project (client + project name)
   - Columns:
     - Client
     - Project
     - Entry count
     - Hours
     - Billing
     - Budget
     - Remaining (Budget - Billing)
   - Color code remaining:
     - Green if positive
     - Red if negative
   - Summary totals:
     - Total Projects count
     - Total Hours
     - Total Billing

**Date Filters:**
- All Time (default)
- Today
- This Week (from Sunday)
- This Month (from 1st)
- This Year (from Jan 1)
- Custom Range (start date + end date picker)

**Export Functions:**
- **CSV Export:**
  - Convert current report to CSV format
  - Headers: first row
  - Quote all values
  - File dialog with suggested name: `time-tracker-report-YYYY-MM-DD.csv`
  - Success message shows file path

- **JSON Export:**
  - Export current report data as JSON
  - Pretty print (2 spaces indent)
  - File dialog with suggested name: `time-tracker-data-YYYY-MM-DD.json`
  - Success message shows file path

---

### 6. System Integration Features

**Auto-Stop Timers:**

1. **On App Quit:**
   - Stop all running timers
   - Calculate elapsed time
   - Create time entries
   - Save data
   - Triggered before app closes

2. **On System Sleep:**
   - Detect Mac sleep event
   - Stop all running timers
   - Save all entries
   - Notify user on wake: "System going to sleep"
   - Update UI to reflect stopped state

**Timer Warnings:**

1. **Long Session Detection:**
   - Check every 5 minutes
   - Warn if timer ≥ 8 hours
   - Dialog message:
     ```
     ⚠️ WARNING: Timer has been running for X hours.
     Did you forget to stop it?

     Project: [Name]
     Duration: X hours

     Would you like to stop this timer now?
     ```
   - If Yes: stop timer
   - If No: continue running
   - Show warning once per 30-minute window

2. **Idle Detection:**
   - Check system idle time every 5 minutes
   - Warn if idle ≥ 15 minutes with timers running
   - Dialog message:
     ```
     ⚠️ IDLE DETECTION: System has been idle for X minutes
     with N timer(s) running.

     Running timers: [Project Names]

     Would you like to stop all running timers?
     ```
   - If Yes: stop all running timers
   - If No: continue running
   - Show warning once per 30-minute window

**Startup Behavior:**
- Load all data from storage
- Reset all running states to false (safety)
- Clear all startTime values
- Display projects in last saved order

---

## 🎨 User Interface Requirements

### Layout Structure

**Main Navigation:**
- Tab-based navigation
- Tabs: Projects | Reports
- Active tab highlighted (white background)

**Projects View:**
- Grid of project cards
- Responsive grid (auto-fit, min 200px columns)
- Empty state when no projects

**Reports View:**
- Filter controls at top
- Report results area below
- Export buttons in filter section

### Color Scheme

**Primary Colors:**
- Primary: #667eea (purple-blue)
- Secondary: #764ba2 (purple)
- Background gradient: 135deg from #667eea to #764ba2

**Status Colors:**
- Success: #28a745 (green)
- Warning: #ffc107 (yellow/amber)
- Danger: #dc3545 (red)
- Info: #17a2b8 (cyan)
- Secondary: #6c757d (gray)

**Budget Alerts:**
- Normal: default background (#f8f9fa)
- Warning (80-99%): #fff3cd background, #ffc107 border
- Danger (100%+): #f8d7da background, #dc3545 border

### Typography

**Fonts:**
- System font stack: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, etc.
- Timer display: monospace (Courier New)

**Text Sizes:**
- Page title: 2.5rem
- Project title: 1.5rem
- Timer display: 2rem
- Stats values: 20px
- Body text: 14px
- Labels: 12px

### Component Styles

**Buttons:**
- Padding: 10px 20px (regular), 8px 16px (small), 5px 10px (tiny)
- Border radius: 6px
- Font weight: 600
- Transition: all 0.3s ease
- Hover: lift effect (translateY(-2px)) + shadow

**Cards:**
- Background: white
- Border radius: 12px
- Padding: 20px
- Shadow: 0 4px 6px rgba(0,0,0,0.1)
- Hover: deeper shadow + lift effect

**Modals:**
- Overlay: rgba(0,0,0,0.5)
- Content: white background, rounded, centered
- Max-width: 500px (forms), 800px (tables)
- Click outside to close

**Forms:**
- Input border: 2px solid #e0e0e0
- Focus border: #667eea
- Border radius: 6px
- Full-width inputs

**Tables:**
- Border collapse
- Header background: #f8f9fa
- Row borders: 1px solid #e0e0e0
- Hover: #f8f9fa background

---

## 💾 Data Model

### Project Schema
```typescript
interface Project {
  id: string;              // Unique identifier (timestamp-based)
  clientName: string;      // Client/company name
  name: string;            // Project name
  hourlyRate: number;      // Billing rate in currency
  budget: number;          // Total budget in currency
  totalSeconds: number;    // Cumulative time tracked
  isRunning: boolean;      // Timer active state
  startTime?: number;      // Timestamp when timer started (if running)
}
```

### Time Entry Schema
```typescript
interface TimeEntry {
  projectId: string;       // Reference to project
  seconds: number;         // Duration of this entry
  startTime: number;       // When entry started (timestamp)
  endTime: number;         // When entry ended (timestamp)
  isManual: boolean;       // True if manually added, false if tracked
}
```

### Application Data Schema
```typescript
interface AppData {
  projects: Project[];
  timeEntries: TimeEntry[];
}
```

---

## 🔧 Business Logic Rules

### Timer Lifecycle

```
[Stopped] --Start--> [Running] --Stop--> [Create Entry] --> [Stopped]
                        │
                        └--Auto-Stop--> [Create Entry] --> [Stopped]
```

### Time Calculations

1. **Total Hours Display:**
   - Formula: `totalSeconds / 3600`
   - Format: 2 decimal places (e.g., 8.50)

2. **Time Formatting (HH:MM:SS):**
   ```javascript
   hours = Math.floor(seconds / 3600).toString().padStart(2, '0')
   minutes = Math.floor((seconds % 3600) / 60).toString().padStart(2, '0')
   secs = (seconds % 60).toString().padStart(2, '0')
   // Result: "08:30:45"
   ```

3. **Billing Calculation:**
   - Formula: `(totalSeconds / 3600) * hourlyRate`
   - Format: 2 decimal places with currency symbol (R)

4. **Budget Percentage:**
   - Formula: `(billing / budget) * 100`
   - Thresholds:
     - 0-79%: Normal (default background)
     - 80-99%: Warning (yellow background #fff3cd, border #ffc107)
     - ≥ 100%: Danger (red background #f8d7da, border #dc3545)

5. **Running Timer Display:**
   ```javascript
   currentSeconds = project.totalSeconds + Math.floor((Date.now() - project.startTime) / 1000)
   ```

### Timer Rules

1. **Single Timer Constraint:**
   - Only one timer can run at a time across all projects
   - Starting a new timer should stop any existing running timer (future enhancement)
   - Current implementation: Single timer focus per session

2. **Timer State Management:**
   - On start:
     - Set isRunning = true
     - Record startTime = Date.now()
     - Start UI update interval (1000ms)
   - On stop:
     - Calculate elapsed = Math.floor((Date.now() - startTime) / 1000)
     - Add elapsed to totalSeconds
     - Create entry with start/end timestamps
     - Set isRunning = false
     - Delete startTime property
     - Clear UI update interval
     - Save data immediately
   - On app start:
     - Reset all isRunning to false (safety feature)
     - Clear all startTime values

3. **Elapsed Time Calculation:**
   - Formula: `Math.floor((Date.now() - startTime) / 1000)`
   - Always floor to whole seconds (no fractional seconds)

### Entry Editing Logic

When editing a time entry:
```javascript
oldSeconds = entry.seconds
newSeconds = Math.floor(newHours * 3600)
difference = newSeconds - oldSeconds
project.totalSeconds += difference
if (project.totalSeconds < 0) project.totalSeconds = 0
entry.seconds = newSeconds
```

When deleting a time entry:
```javascript
project.totalSeconds -= entry.seconds
if (project.totalSeconds < 0) project.totalSeconds = 0
removeEntry(entryIndex)
```

### Data Integrity

1. **Project Deletion:**
   - Must delete all associated time entries (cascading delete)
   - Confirm before deletion with clear warning
   - Message: "Are you sure you want to delete this project? All time entries will be lost."

2. **Time Entry Modification:**
   - Recalculate project total when editing entry
   - Never allow negative project totals (floor at 0)
   - Update both entry record and project total atomically
   - Refresh UI immediately after changes

3. **Manual Entry Timestamps:**
   - Use same timestamp for startTime and endTime
   - Use current timestamp (Date.now())
   - Set isManual = true to distinguish from tracked entries

---

## 🎭 User Experience Features

### Feedback & Notifications

**Success States:**
- File export success: show file path
- Project created: immediate display in list
- Timer started/stopped: immediate UI update

**Error Handling:**
- Export cancelled: no error, silent
- Export failed: show error message
- Delete confirmation: clear warning about data loss

**Loading States:**
- Projects load on startup
- Reports regenerate on filter change
- Time entries refresh after edit/delete

### Validation

**Form Validation:**
- All fields required for project creation
- Positive numbers only for rates/budgets
- Minimum 0.01 hours for manual entry
- Date range validation for custom reports

**Confirmation Dialogs:**
- Delete project
- Delete time entry
- Long-running timer warning
- Idle system warning

### Accessibility

**Button Labels:**
- Clear action text
- Icon + text combinations
- Color not sole indicator (use text too)

**Modal Behavior:**
- Click outside to close
- Cancel buttons always available
- Escape key support (nice to have)

---

## 📡 API Reference

### RESTful API Endpoints (Backend)

The Azure-native web version will implement a RESTful API instead of IPC handlers. Below are the required endpoints:

#### Project Management

**`GET /api/projects`**
- Returns: `Project[]`
- Description: Retrieves all projects for authenticated user
- Auth: Required

**`POST /api/projects`**
- Body: `{ clientName: string, name: string, hourlyRate: number, budget: number }`
- Returns: `Project`
- Description: Creates new project with unique ID (timestamp-based)
- Auth: Required

**`PUT /api/projects/:id`**
- Params: `id` (project ID)
- Body: `Partial<Project>` (fields to update)
- Returns: `Project`
- Description: Updates project properties
- Auth: Required

**`DELETE /api/projects/:id`**
- Params: `id` (project ID)
- Returns: `{ success: boolean }`
- Description: Deletes project and all related time entries (cascading)
- Auth: Required

#### Timer Operations

**`POST /api/projects/:id/timer/start`**
- Params: `id` (project ID)
- Returns: `Project`
- Description: Starts timer for specified project
- Note: Only one timer can run at a time
- Auth: Required

**`POST /api/projects/:id/timer/stop`**
- Params: `id` (project ID)
- Returns: `{ project: Project, entry: TimeEntry }`
- Description: Stops timer, creates time entry, updates project total
- Auth: Required

**`GET /api/projects/:id/timer/current`**
- Params: `id` (project ID)
- Returns: `{ seconds: number, isRunning: boolean }`
- Description: Returns elapsed seconds for running timer (0 if stopped)
- Auth: Required

#### Time Entry Management

**`GET /api/time-entries`**
- Query: `?projectId=<id>` (optional filter)
- Returns: `TimeEntry[]`
- Description: Retrieves all time entries (optionally filtered by project)
- Auth: Required

**`POST /api/projects/:id/entries/manual`**
- Params: `id` (project ID)
- Body: `{ hours: number }`
- Returns: `{ project: Project, entry: TimeEntry }`
- Description: Adds manual time entry
- Auth: Required

**`PUT /api/time-entries/:index`**
- Params: `index` (entry index)
- Body: `{ hours: number }`
- Returns: `{ success: boolean, project: Project }`
- Description: Updates hours for time entry
- Auth: Required

**`DELETE /api/time-entries/:index`**
- Params: `index` (entry index)
- Returns: `{ success: boolean, project: Project }`
- Description: Removes time entry and updates project total
- Auth: Required

#### Reporting & Export

**`GET /api/reports`**
- Query params:
  - `type`: "all" | "by-client" | "by-project"
  - `dateFilter`: "all" | "today" | "this-week" | "this-month" | "this-year" | "custom"
  - `startDate`: ISO date string (if custom)
  - `endDate`: ISO date string (if custom)
- Returns: `ReportData[]`
- Description: Generates report based on filters
- Auth: Required

**`POST /api/reports/export/csv`**
- Body: `{ data: ReportData[] }`
- Returns: CSV file download
- Description: Exports report data as CSV
- Auth: Required

**`POST /api/reports/export/json`**
- Body: `{ data: ReportData[] }`
- Returns: JSON file download
- Description: Exports report data as JSON
- Auth: Required

#### Safety & Monitoring

**`GET /api/warnings`**
- Returns: `Warning[]`
- Description: Checks for long-running sessions (web version doesn't check system idle)
- Auth: Required

```typescript
interface Warning {
  type: 'long-session';
  message: string;
  projectId: string;
  projectName: string;
  hours: string;
}
```

### WebSocket Events (Real-time Updates)

Optional enhancement for real-time timer updates across devices:

**`timer:started`**
- Payload: `{ projectId: string, startTime: number }`
- Description: Notifies when timer starts

**`timer:stopped`**
- Payload: `{ projectId: string, entry: TimeEntry }`
- Description: Notifies when timer stops

**`project:updated`**
- Payload: `{ project: Project }`
- Description: Notifies when project changes

---

## 🚀 Azure-Specific Adaptations

### Changes from Desktop Version

**Storage:**
- Desktop: Local JSON file
- Azure: External PostgreSQL database (Supabase)

**Architecture:**
- Desktop: Electron (single app)
- Azure: Separate backend API + frontend SPA

**System Integration:**
- Desktop: Power monitor, idle detection
- Azure: Not applicable (web app)
  - Remove system sleep detection
  - Remove idle time detection
  - Remove auto-stop on quit (handle session expiry instead)

**File Exports:**
- Desktop: Native file dialogs
- Azure: Browser download triggers

### Features to Remove for Web Version

1. **System Sleep Detection**
   - Not available in browser
   - Consider: session timeout instead

2. **Idle Detection**
   - Browser doesn't have system idle access
   - Consider: page inactivity detection (optional)

3. **Auto-stop on Quit**
   - Not applicable (persistent web app)
   - Consider: warn on page close if timer running

4. **Native File Dialogs**
   - Use browser download API
   - Trigger download with suggested filename

### Features to Add for Web Version

1. **User Authentication**
   - Simple email/password or OAuth
   - Each user sees only their data

2. **Session Management**
   - Auto-save on changes
   - Handle connection loss gracefully
   - Resume state on reconnect

3. **Responsive Design**
   - Mobile-friendly layout
   - Touch-friendly buttons
   - Adaptive grid layouts

---

## 📊 Success Criteria

**Feature Parity:**
- ✅ All CRUD operations for projects
- ✅ Timer start/stop functionality
- ✅ Manual time entry
- ✅ Time entry editing/deletion
- ✅ All three report types
- ✅ Date filtering
- ✅ CSV/JSON export
- ✅ Budget tracking and alerts
- ✅ Long-running timer warnings (adapted)

**UI/UX Parity:**
- ✅ Same visual design language
- ✅ Same color scheme
- ✅ Same layout structure
- ✅ Responsive and mobile-friendly

**Azure Readiness:**
- ✅ External database (no local files)
- ✅ RESTful API backend
- ✅ Environment-based configuration
- ✅ Console logging only
- ✅ CORS configured
- ✅ Docker containerized

---

## 🎯 Development Priorities

### Phase 1: Core MVP (Essential)
1. Project CRUD operations
2. Timer start/stop
3. Basic time display
4. Manual time entry
5. Project list view

### Phase 2: Enhanced Features
1. Time entry management
2. Budget tracking and alerts
3. Edit/delete time entries
4. Project statistics display

### Phase 3: Reporting
1. All Entries report
2. By Client report
3. By Project report
4. Date filtering
5. CSV/JSON export

### Phase 4: Polish
1. Long-running timer warnings
2. Responsive design
3. Error handling
4. Loading states
5. User feedback

---

## 📋 Known Limitations & Future Enhancements

### Current Limitations
1. No cloud sync in desktop version (single device only)
2. No data encryption at rest in desktop version
3. No concurrent timer support (single timer focus)
4. Currency locked to Rand (R)
5. No project archiving
6. No invoice/billing integration
7. No time rounding options

### Potential Future Enhancements for Web Version
1. **Multi-currency Support**: Beyond South African Rand
2. **Invoice Generation**: PDF invoices from time entries
3. **Calendar Integration**: Sync with external calendars
4. **Team Collaboration**: Multi-user support with role-based access
5. **Advanced Analytics**: Charts, trends, predictions
6. **Task Management**: Sub-tasks within projects
7. **Time Goals**: Daily/weekly targets
8. **Break Reminders**: Pomodoro-style intervals
9. **Dark Mode**: System-aware theme switching
10. **Mobile Apps**: Native iOS/Android applications
11. **API Access**: Public API for integrations
12. **Webhooks**: Real-time notifications to external systems

---

## 🏗️ Azure Implementation Architecture

### Recommended Technology Stack

**Backend:**
- Runtime: Node.js 18+
- Framework: Express + TypeScript
- Database: PostgreSQL (Supabase free tier)
- Hosting: Azure Container Apps
- Authentication: JWT or OAuth

**Frontend:**
- Framework: React + TypeScript OR Vanilla TypeScript
- Build Tool: Vite
- Hosting: Azure Static Web Apps
- State Management: React Context or Zustand

**Infrastructure:**
- Container Registry: Azure Container Registry
- Database: External PostgreSQL (Supabase)
- Monitoring: Azure Application Insights (optional)
- CDN: Azure CDN (optional)

### Deployment Requirements
- ✅ No local file storage
- ✅ Console logging only (no file logs)
- ✅ Environment variables for configuration
- ✅ CORS configured for frontend/backend separation
- ✅ Health endpoint (`/health`)
- ✅ Proper start script in package.json
- ✅ Docker containerized backend
- ✅ azure.yaml configuration file

---

## ✅ Success Criteria Checklist

**Feature Parity:**
- [ ] All CRUD operations for projects
- [ ] Timer start/stop functionality
- [ ] Manual time entry
- [ ] Time entry editing/deletion
- [ ] All three report types (All, By Client, By Project)
- [ ] Date filtering (All, Today, Week, Month, Year, Custom)
- [ ] CSV/JSON export
- [ ] Budget tracking and visual alerts
- [ ] Long-running timer warnings (adapted for web)

**UI/UX Parity:**
- [ ] Same visual design language
- [ ] Same color scheme (#667eea → #764ba2 gradient)
- [ ] Same layout structure (tabs, cards, modals)
- [ ] Responsive and mobile-friendly

**Azure Readiness:**
- [ ] External database (Supabase PostgreSQL)
- [ ] RESTful API backend
- [ ] Environment-based configuration
- [ ] Console logging only
- [ ] CORS configured
- [ ] Docker containerized
- [ ] Health endpoint
- [ ] Proper error handling

---

**Specification Version:** 2.0 (Azure-Native Web Application)
**Last Updated:** October 7, 2025
**Based On:** Time Tracker Desktop v1.0.0 (Electron 38.2.1)
**Status:** Ready for Azure implementation
**Estimated Development Time:** 6-7 hours (per SESSION-CONTEXT.md)
