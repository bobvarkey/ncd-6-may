import { createClient } from "npm:@supabase/supabase-js@2";

Deno.serve(async (req) => {
  if (req.headers.get("x-bootstrap-key") !== Deno.env.get("DEVELOPER_BOOTSTRAP_KEY")) {
    return new Response(JSON.stringify({ error: "Not authorized" }), { status: 401 });
  }
  const url = Deno.env.get("SUPABASE_URL") || "";
  const key = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";
  const password = Deno.env.get("DEVELOPER_INITIAL_PASSWORD") || "";
  if (!password) return new Response(JSON.stringify({ error: "Password unavailable" }), { status: 500 });
  const admin = createClient(url, key, { auth: { autoRefreshToken: false, persistSession: false } });
  const { data, error } = await admin.auth.admin.createUser({
    email: "developer@ncdapp.store",
    password,
    email_confirm: true,
    user_metadata: { display_name: "Developer" },
  });
  if (error && !error.message.toLowerCase().includes("already")) {
    return new Response(JSON.stringify({ error: error.message }), { status: 400 });
  }
  let userId = data.user?.id;
  if (!userId) {
    const { data: listed } = await admin.auth.admin.listUsers({ page: 1, perPage: 1000 });
    userId = listed.users.find((user) => user.email?.toLowerCase() === "developer@ncdapp.store")?.id;
  }
  if (!userId) return new Response(JSON.stringify({ error: "Developer account unavailable" }), { status: 500 });
  await admin.from("profiles").upsert({ id: userId, display_name: "Developer" });
  await admin.from("user_roles").upsert({ user_id: userId, role: "developer" }, { onConflict: "user_id,role" });
  return new Response(JSON.stringify({ success: true }), { headers: { "Content-Type": "application/json" } });
});