/// Public Supabase configuration, matching the checked-in fallback used by the
/// Clinical Tools web build. These are publishable values, not secrets.
const supabaseUrl = String.fromEnvironment(
  'SUPABASE_URL',
  defaultValue: 'https://dhwpbfqxypbbljygtlih.supabase.co',
);

const supabasePublishableKey = String.fromEnvironment(
  'SUPABASE_PUBLISHABLE_KEY',
  defaultValue: 'sb_publishable_omXe4-gE00vDE9xe801IrQ_jKLmfX1j',
);

/// Set by main() after Supabase.initialize succeeds.
bool supabaseReady = false;
