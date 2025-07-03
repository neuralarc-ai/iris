# Cron Job Setup for Lead Enrichment

This guide explains how to set up the automatic lead enrichment cron job on Vercel using the official Vercel Cron Jobs feature.

## Overview

The cron job automatically processes all leads in your database, generating AI-powered insights, lead scores, and recommendations. It runs every hour and processes leads sequentially to avoid rate limits.

## Prerequisites

1. **Vercel Account**: You need a Vercel account with a deployed project
2. **Supabase Service Role Key**: For backend database access
3. **Environment Variables**: All required API keys for AI services

## Setup Steps

### 1. Environment Variables

Add these environment variables to your Vercel project:

```bash
# Supabase
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key

# AI Services
GEMINI_API_KEY=your_gemini_api_key
DEEPSEEK_API_KEY=your_deepseek_api_key
TAVILY_API_KEY=your_tavily_api_key

# Cron Security (REQUIRED)
CRON_SECRET=your_random_secret_string
```

**Important**: The `CRON_SECRET` is required for security. Vercel automatically adds this to the Authorization header for all cron job requests.

### 2. Database Migration

Run the database migration to create the job tracking table:

```bash
# If using Supabase CLI
supabase db push

# Or manually run the SQL in your Supabase dashboard
```

### 3. Deploy to Vercel

Deploy your project to Vercel:

```bash
vercel --prod
```

### 4. Verify Cron Job

After deployment, Vercel will automatically start running the cron job every hour. You can:

- Check Vercel dashboard → Functions → Cron Jobs
- Monitor logs in Vercel dashboard → Functions → `/api/cron/lead-enrichment`
- Check the `lead_analysis_job` table in your Supabase database

## Cron Schedule

The job runs every hour at minute 0 (e.g., 1:00, 2:00, 3:00, etc.).

To change the schedule, modify `vercel.json`:

```json
{
  "crons": [
    {
      "path": "/api/cron/lead-enrichment",
      "schedule": "0 * * * *"  // Every hour
    }
  ]
}
```

Common schedules:
- `"0 * * * *"` - Every hour
- `"0 */2 * * *"` - Every 2 hours
- `"0 9 * * *"` - Daily at 9 AM
- `"0 9 * * 1"` - Weekly on Monday at 9 AM

## Monitoring

### 1. Vercel Dashboard

- Go to your Vercel project dashboard
- Navigate to Functions → Cron Jobs
- View execution history and logs

### 2. Database Monitoring

Check the `lead_analysis_job` table:

```sql
SELECT * FROM lead_analysis_job 
WHERE job_name = 'lead_enrichment_cron' 
ORDER BY last_run DESC;
```

### 3. Function Logs

View detailed logs in Vercel dashboard:
- Functions → `/api/cron/lead-enrichment`
- Check for errors, processing counts, and timing

## Manual Testing

You can manually trigger the cron job for testing:

```bash
# Using curl (include the CRON_SECRET)
curl -X GET "https://your-domain.vercel.app/api/cron/lead-enrichment" \
  -H "Authorization: Bearer your_cron_secret"
```

**Note**: The endpoint requires the `CRON_SECRET` in the Authorization header, so you cannot test it directly in a browser.

## Troubleshooting

### Common Issues

1. **Job not running**: Check Vercel cron job status in dashboard
2. **Authentication errors**: Verify `CRON_SECRET` environment variable is set correctly
3. **Database errors**: Check `SUPABASE_SERVICE_ROLE_KEY` permissions
4. **Rate limiting**: The job includes 10-second delays between leads
5. **Timeout errors**: Vercel has a 10-second timeout for cron jobs
6. **401 Unauthorized**: Ensure `CRON_SECRET` matches between environment variable and manual testing

### Debug Steps

1. Check Vercel function logs
2. Verify environment variables are set
3. Test the API endpoint manually
4. Check Supabase database for job status
5. Verify AI service API keys are valid

## Performance Considerations

- **Rate Limiting**: 10-second delay between leads to avoid API limits
- **Timeout**: Vercel cron jobs have a 10-second timeout limit
- **Memory**: Each lead processing uses AI API calls
- **Cost**: Consider API usage costs for AI services

## Alternative: External Cron Service

If you need more control or longer execution times, consider:

1. **GitHub Actions**: Free cron jobs with longer timeouts
2. **Railway**: Simple cron job hosting
3. **Upstash QStash**: Reliable cron job service
4. **Cron-job.org**: Free external cron service

## Security

- The cron job uses Supabase service role key for database access
- **Required `CRON_SECRET`** for authentication (Vercel automatically adds this to requests)
- Job status is tracked in database for monitoring
- Errors are logged and stored for debugging

## Vercel Official Documentation

This implementation follows Vercel's official cron job guidelines:
- [Vercel Cron Jobs Documentation](https://vercel.com/docs/cron-jobs)
- Uses the official `vercel.json` configuration
- Implements proper Authorization header checking
- Follows Vercel's security best practices

## Cost Optimization

- Only process leads not analyzed in the last 24 hours
- Sequential processing to avoid rate limits
- Error handling to prevent unnecessary API calls
- Job status tracking to avoid duplicate runs 