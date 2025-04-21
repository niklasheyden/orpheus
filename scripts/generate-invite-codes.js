import { createClient } from '@supabase/supabase-js';
import { customAlphabet } from 'nanoid';
import * as dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

// Get the directory path of the current module
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load environment variables from the root .env file
dotenv.config({ path: join(__dirname, '..', '.env') });

if (!process.env.VITE_SUPABASE_URL || !process.env.VITE_SUPABASE_ANON_KEY) {
  console.error('Missing required environment variables');
  process.exit(1);
}

// Initialize Supabase client
const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.VITE_SUPABASE_ANON_KEY
);

// Create a custom nanoid generator with only uppercase letters and numbers
const generateCode = customAlphabet('ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789', 8);

async function generateInviteCodes() {
  try {
    const codes = new Set();
    
    // Generate 200 unique codes
    while (codes.size < 200) {
      codes.add(generateCode());
    }

    const codesArray = Array.from(codes).map(code => ({
      code,
      is_used: false,
      created_at: new Date().toISOString()
    }));

    // Insert codes into the database
    const { data, error } = await supabase
      .from('invite_codes')
      .insert(codesArray)
      .select();

    if (error) {
      throw error;
    }

    console.log('Successfully generated and inserted 200 invite codes');
    console.log('First 5 codes as preview:', Array.from(codes).slice(0, 5).join(', '));
  } catch (error) {
    console.error('Error:', error.message || error);
    process.exit(1);
  }
}

generateInviteCodes(); 