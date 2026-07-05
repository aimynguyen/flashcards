import { createClient } from "@supabase/supabase-js";

// Đọc biến môi trường từ file .env để kết nối Supabase.
// Hỗ trợ cả tên VITE_* (Vite) và NEXT_PUBLIC_* (nếu bạn dùng mẫu từ tutorial khác).
const supabaseUrl =
  import.meta.env.VITE_SUPABASE_URL || import.meta.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey =
  import.meta.env.VITE_SUPABASE_ANON_KEY ||
  import.meta.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ||
  import.meta.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn(
    "Supabase environment variables are missing. Please add VITE_SUPABASE_URL/VITE_SUPABASE_ANON_KEY or NEXT_PUBLIC_SUPABASE_URL/NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY.",
  );
}

// Tạo client dùng để đọc/ghi dữ liệu trực tiếp từ frontend.
export const supabase = createClient(supabaseUrl || "", supabaseAnonKey || "");
