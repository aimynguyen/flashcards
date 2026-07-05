# Aimie Flashcards

Ứng dụng flashcard học từ vựng dùng React + Vite + Tailwind + Supabase.

## Cài đặt

```bash
cd client
npm install
copy .env.example .env
```

Điền URL và anon key của Supabase vào file .env.

## Chạy local

```bash
cd client
npm run dev
```

## Build production

```bash
cd client
npm run build
```

## Bảng dữ liệu Supabase

Tạo bảng `flashcards` với các cột:

- `id` (uuid, default `gen_random_uuid()`)
- `front` (text)
- `back` (text)
- `created_at` (timestamp with time zone, default `now()`)
- `is_known` (boolean, default `false`)

Nếu muốn lưu trạng thái “đã thuộc” trực tiếp trên Supabase, chạy SQL sau trong SQL Editor:

```sql
alter table flashcards add column if not exists is_known boolean default false;
```
