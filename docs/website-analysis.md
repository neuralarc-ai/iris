# Website Analysis Feature

## Overview

The company form now includes an AI-powered feature that automatically extracts company descriptions from website URLs using the Exa API.

## How It Works

1. User enters website URL in company form
2. System automatically analyzes website after 2-second delay
3. Exa API extracts relevant company information
4. Description is automatically populated

## Features

- Automatic analysis when URL is entered
- Manual trigger button with loading indicator
- Smart URL validation and formatting
- Error handling with user-friendly messages
- Responsive UI with visual feedback

## API Configuration

Add to `.env.local`:
```
EXA_API_KEY=your_exa_api_key_here
```

## Usage

1. Open Company Profile dialog
2. Enter website URL
3. Wait for auto-analysis or click "Auto-fill from Website"
4. Review and edit extracted description
5. Save company profile 