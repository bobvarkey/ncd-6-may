import { createClient } from "npm:@supabase/supabase-js@2";

Deno.serve(async () => {
  const url = Deno.env.get("SUPABASE_URL") || "";
  const key = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";
  const password = Deno.env.get("DEVELOPER_INITIAL_PASSWORD") || "";
  if (!password) return new Response(JSON.stringify({ error: "Password unavailable" }), { status: 500 });
  const admin = createClient(url, key, { auth: { autoRefreshToken: false, persistSession: false } });
  const { data: listed, error: listError } = await admin.auth.admin.listUsers({ page: 1, perPage: 1000 });
  if (listError) return new Response(JSON.stringify({ error: listError.message }), { status: 500 });
  const existing = listed.users.find((user) => user.email?.toLowerCase() === "developer@ncdapp.store");
  let userId = existing?.id;
  if (userId) {
    const { error } = await admin.auth.admin.updateUserById(userId, { password, email_confirm: true });
    if (error) return new Response(JSON.stringify({ error: error.message }), { status: 400 });
  } else {
    const { data, error } = await admin.auth.admin.createUser({ email: "developer@ncdapp.store", password, email_confirm: true, user_metadata: { display_name: "Developer" } });
    if (error || !data.user) return new Response(JSON.stringify({ error: error?.message || "Unable to create account" }), { status: 400 });
    userId = data.user.id;
  }
  await admin.from("profiles").upsert({ id: userId, display_name: "Developer" });
  await admin.from("user_roles").upsert({ user_id: userId, role: "developer" }, { onConflict: "user_id,role" });
  return new Response(JSON.stringify({ success: true }), { headers: { "Content-Type": "application/json" } });
});