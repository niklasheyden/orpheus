import { supabase } from '../src/lib/supabase';
import { customAlphabet } from 'nanoid';

// Create a custom nanoid generator with only uppercase letters and numbers
const generateCode = customAlphabet('ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789', 8);

async function generateInviteCodes() {
  const codes = new Set<string>();
  
  // Generate 200 unique codes
  while (codes.size < 200) {
    codes.add(generateCode());
  }

  // Insert codes into the database
  const { data, error } = await supabase
    .from('invite_codes')
    .insert(
      Array.from(codes).map(code => ({
        code,
        is_used: false,
        created_at: new Date().toISOString()
      }))
    );

  if (error) {
    console.error('Error inserting invite codes:', error);
    return;
  }

  console.log('Successfully generated and inserted 200 invite codes');
  console.log('First 5 codes as preview:', Array.from(codes).slice(0, 5));
}

generateInviteCodes(); 