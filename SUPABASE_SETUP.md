# Supabase Setup Guide for POS System

## 1. Create a Supabase Project

1. Go to [https://supabase.com](https://supabase.com)
2. Sign up or log in to your account
3. Click "New Project"
4. Fill in:
   - Project name: `my-pos` (or your preferred name)
   - Database Password: (save this securely)
   - Region: Choose closest to you
5. Click "Create Project" and wait for setup

## 2. Get Your API Keys

1. Once project is created, go to **Settings** → **API**
2. Copy these values:
   - **Project URL**: `https://[YOUR-PROJECT-REF].supabase.co`
   - **Anon/Public Key**: `eyJ...` (long string)

## 3. Set Up Environment Variables

1. Create a `.env.local` file in your project root
2. Add your Supabase credentials:

```env
EXPO_PUBLIC_SUPABASE_URL=https://[YOUR-PROJECT-REF].supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=eyJ...your-anon-key...
```

## 4. Create Database Tables

1. Go to **SQL Editor** in Supabase dashboard
2. Click "New Query"
3. Copy and paste the entire contents of `supabase/schema.sql`
4. Click "Run" to create all tables

## 5. Add Sample Data (Optional)

1. In SQL Editor, create a new query
2. Copy and paste contents of `supabase/seed.sql`
3. Click "Run" to add sample data

## 6. Enable Authentication

1. Go to **Authentication** → **Providers**
2. Enable **Email** provider for basic auth
3. Configure email templates if needed

## 7. Storage Setup (for product images)

1. Go to **Storage**
2. Create a new bucket called `products`
3. Set it to **Public** if you want images accessible without auth
4. Update RLS policies as needed

## 8. Test Your Connection

Run your app with:
```bash
npm start
```

The app should now connect to your Supabase backend!

## Database Schema Overview

- **products**: Product inventory
- **categories**: Product categories
- **customers**: Customer information
- **transactions**: Sales transactions
- **transaction_items**: Individual items in transactions
- **stock_movements**: Track stock in/out
- **suppliers**: Supplier information

## Security Notes

- Row Level Security (RLS) is enabled on all tables
- Currently allows all authenticated users full access
- Customize policies based on your needs (e.g., role-based access)

## Next Steps

1. Implement authentication screens
2. Replace mock data with Supabase queries
3. Set up real-time subscriptions for inventory
4. Configure offline sync with AsyncStorage
5. Add image upload for products