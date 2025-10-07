# Azure Deployment Guide

## ✅ Conversion Complete!

The Express backend has been successfully converted to Azure Functions!

### What Was Done:

1. ✅ **18 Azure Functions created:**
   - `login`, `register` - Authentication
   - `projects-get`, `projects-create`, `projects-update`, `projects-delete` - Project management
   - `timer-start`, `timer-stop`, `timer-current` - Timer operations
   - `timeentries-get`, `timeentries-add-manual`, `timeentries-update`, `timeentries-delete` - Time tracking
   - `warnings-get` - Budget/session warnings
   - `reports-get`, `reports-export-csv`, `reports-export-json` - Reporting
   - `init` - Cosmos DB initialization

2. ✅ **Azure Cosmos DB configured:**
   - Free tier (25GB + 1000 RU/s)
   - Endpoint: https://time-tracker-cosmos.documents.azure.com:443/

3. ✅ **Azure Static Web Apps created:**
   - URL: https://delightful-water-0995f8b0f.1.azurestaticapps.net
   - Free tier

4. ✅ **All code compiles successfully**

## Deployment Steps:

### 1. Add GitHub Secret

1. Go to: https://github.com/jacslemmer/time-tracker-azure/settings/secrets/actions
2. Click **"New repository secret"**
3. Name: `AZURE_STATIC_WEB_APPS_API_TOKEN`
4. Value: Get from Azure CLI: `az staticwebapp secrets list --name time-tracker-app --resource-group time-tracker-rg --query "properties.apiKey" -o tsv`
5. Click **"Add secret"**

### 2. Environment Variables (Already Configured)

Environment variables have been configured in Azure Static Web Apps:
- `COSMOS_ENDPOINT` - Cosmos DB endpoint URL
- `COSMOS_KEY` - Cosmos DB access key
- `JWT_SECRET` - JWT signing secret
- `JWT_EXPIRES_IN` - Token expiration time

To view: `az staticwebapp appsettings list --name time-tracker-app --resource-group time-tracker-rg`

### 3. Push to GitHub

```bash
cd ~/git/time-tracker-azure
git add .
git commit -m "feat: Azure Functions backend + Cosmos DB

- Converted Express backend to 18 Azure Functions
- Configured Azure Cosmos DB Free Tier
- Added GitHub Actions deployment workflow
- Ready for Azure Static Web Apps deployment

🤖 Generated with [Claude Code](https://claude.com/claude-code)

Co-Authored-By: Claude <noreply@anthropic.com>"
git push
```

### 4. Monitor Deployment

1. Go to: https://github.com/jacslemmer/time-tracker-azure/actions
2. Watch the deployment progress
3. Once complete, visit: https://delightful-water-0995f8b0f.1.azurestaticapps.net

## Architecture:

```
┌─────────────────────────────────────┐
│  Azure Static Web Apps (Free)       │
│  ├── Frontend: React + Vite         │
│  └── API: Azure Functions (Node 18) │
└─────────────────────────────────────┘
              │
              ↓
┌─────────────────────────────────────┐
│  Azure Cosmos DB (Free Tier)        │
│  ├── Database: TimeTrackerDB        │
│  ├── Users Container                │
│  ├── Projects Container              │
│  └── TimeEntries Container           │
└─────────────────────────────────────┘
```

## Cost:

**$0.00/month** - Everything is on Azure Free Tier!

- Static Web Apps: Free tier (100GB bandwidth)
- Azure Functions: Consumption plan (1M free requests)
- Cosmos DB: Free tier (25GB storage, 1000 RU/s)

## Next Steps After Deployment:

1. Initialize Cosmos DB: `POST https://delightful-water-0995f8b0f.1.azurestaticapps.net/api/init`
2. Register a user
3. Start tracking time!
