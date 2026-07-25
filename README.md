# Ichki Akademiya — LMS + Admin Dashboard

Bozorcha Super Market xodimlari uchun Full-Stack Web Platforma.
**Stack:** Next.js 14 (App Router) · TypeScript · Tailwind CSS · Prisma ORM · PostgreSQL · NextAuth.js · React Hook Form + Zod · Recharts

---

## 📁 Loyiha strukturasi

```
ichki-akademiya/
├── prisma/
│   ├── schema.prisma              # To'liq data model (User, Branch, Position, Guide, Video, Quiz, Checklist...)
│   └── seed.ts                    # 4 filial, 5 lavozim va boshlang'ich admin yaratadi
│
├── app/
│   ├── layout.tsx                 # Root layout (SessionProvider, fonts, globals.css)
│   ├── page.tsx                   # "/" -> sessiya bo'yicha /login, /dashboard yoki /admin'ga redirect
│   ├── globals.css
│   │
│   ├── (auth)/
│   │   ├── login/page.tsx         # Login formasi (NextAuth credentials)
│   │   └── register/page.tsx      # Ro'yxatdan o'tish (branch/position tanlash)
│   │
│   ├── dashboard/                 # 🧑‍💼 XODIMLAR PORTALI
│   │   ├── layout.tsx             # Auth guard + sidebar
│   │   ├── page.tsx               # Profil paneli, statistik kartalar, so'nggi natijalar
│   │   ├── guides/page.tsx        # PDF ro'yxati + inline PDF Viewer + yuklab olish
│   │   ├── videos/page.tsx        # Video darsliklar (HTML5 <video>)
│   │   ├── quizzes/
│   │   │   ├── page.tsx           # Testlar ro'yxati + oxirgi natija badge
│   │   │   └── [id]/page.tsx      # Testni topshirish, natija darhol ko'rinadi
│   │   └── checklists/page.tsx    # Kunlik/haftalik vazifalarni belgilash + saqlash
│   │
│   ├── admin/                     # 🛡️ ADMIN DASHBOARD (faqat role === 'admin')
│   │   ├── layout.tsx             # Role guard + admin sidebar
│   │   ├── page.tsx               # Statistik panel (Recharts: filiallar kesimida)
│   │   ├── users/page.tsx         # Approve / Reject, status va filial bo'yicha filtr
│   │   └── content/
│   │       ├── guides/page.tsx        # Yo'riqnoma qo'shish (filial/global)
│   │       ├── videos/page.tsx        # Video qo'shish (filial/global)
│   │       ├── quizzes/new/page.tsx   # 🧩 Test konstruktori (dinamik savol+variant)
│   │       └── checklists/new/page.tsx# 🧩 Check-list konstruktori (dinamik vazifalar)
│   │
│   └── api/                       # REST API (Next.js Route Handlers)
│       ├── auth/
│       │   ├── register/route.ts      # POST — ro'yxatdan o'tish (bcrypt, Zod)
│       │   └── [...nextauth]/route.ts # NextAuth handler
│       ├── admin/
│       │   ├── users/route.ts         # GET — filtrlangan ro'yxat
│       │   ├── users/[id]/route.ts    # PATCH (approve/reject), DELETE
│       │   └── stats/route.ts         # GET — filiallar kesimida statistikalar
│       ├── branches/route.ts      # GET — filiallar (formalar uchun)
│       ├── positions/route.ts     # GET — lavozimlar (formalar uchun)
│       ├── guides/route.ts        # GET (scoped), POST (admin)
│       ├── guides/[id]/route.ts   # PATCH, DELETE (admin)
│       ├── videos/route.ts        # GET (scoped), POST (admin)
│       ├── videos/[id]/route.ts   # PATCH, DELETE (admin)
│       ├── quizzes/route.ts       # GET (scoped), POST — nested savol/variant (admin)
│       ├── quizzes/[id]/route.ts  # GET (topshirish uchun, to'g'ri javob yashirin), DELETE
│       ├── quizzes/[id]/submit/route.ts # POST — SERVER-SIDE baholash va QuizResult saqlash
│       ├── checklists/route.ts    # GET (scoped + joriy davr entry), POST (admin)
│       └── checklists/[id]/submit/route.ts # POST — upsert kunlik/haftalik hisobot
│
├── components/
│   ├── ui/                        # Button, Input, Badge (shadcn-uslubidagi primitivlar)
│   ├── dashboard/sidebar.tsx      # Xodim sidebar navigatsiyasi
│   ├── admin/sidebar.tsx          # Admin sidebar navigatsiyasi
│   ├── register-form.tsx         # Ro'yxatdan o'tish client formasi
│   └── session-provider.tsx      # NextAuth SessionProvider wrapper
│
├── lib/
│   ├── prisma.ts                  # PrismaClient singleton
│   ├── auth.ts                    # NextAuthOptions (Credentials + bcrypt + status/role tekshiruvi)
│   ├── api-guard.ts               # requireSession() — API route'lar uchun umumiy ruxsat tekshiruvi
│   ├── validations.ts             # Barcha Zod sxemalar (register, guide, video, quiz, checklist...)
│   └── utils.ts                   # cn() — Tailwind classname birlashtiruvchi
│
├── types/next-auth.d.ts           # Session/JWT uchun TypeScript kengaytmasi (role, branchId va h.k.)
├── middleware.ts                  # /dashboard, /admin va /api/admin uchun himoya
├── tailwind.config.ts / postcss.config.js
├── next.config.js / tsconfig.json
├── package.json
└── .env.example
```

---

## 🔐 Autentifikatsiya va Ruxsatlar Arxitekturasi

1. **Ro'yxatdan o'tish** (`POST /api/auth/register`) — parol `bcryptjs` bilan hash qilinadi, foydalanuvchi `status: "pending"` holatida yaratiladi.
2. **Kirish** — NextAuth `CredentialsProvider` orqali. `authorize()` funksiyasida:
   - Parol tekshiriladi (`bcrypt.compare`)
   - `status === "pending"` bo'lsa — xatolik: *"Admin tasdig'ini kuting"*
   - `status === "rejected"` bo'lsa — xatolik
   - Muvaffaqiyatli bo'lsa, `role`, `branchId`, `branchName`, `positionName` JWT/session ichiga yoziladi (`lib/auth.ts` va `types/next-auth.d.ts`)
3. **`middleware.ts`** — `/dashboard/*`, `/admin/*`, `/api/admin/*` yo'llarini himoya qiladi; `/admin` ga faqat `role === "admin"` kira oladi, aks holda `/dashboard`ga qaytariladi.
4. **API darajasida** — har bir route `requireSession(requireAdmin)` orqali qo'shimcha tekshiriladi (defense-in-depth: middleware + route ikkalasi ham tekshiradi).
5. **Test baholash xavfsizligi** — `POST /api/quizzes/[id]/submit` to'g'ri javoblarni **hech qachon frontendga yubormaydi**; baholash faqat serverda, DB'dagi `isCorrect` maydoni asosida amalga oshadi.

---

## 🚀 O'rnatish

```bash
# 1. Bog'liqliklarni o'rnatish
npm install

# 2. .env faylini sozlash
cp .env.example .env
# DATABASE_URL va NEXTAUTH_SECRET qiymatlarini kiriting
# NEXTAUTH_SECRET generatsiya qilish uchun: openssl rand -base64 32

# 3. Prisma Client generatsiyasi va DB sxemasini push qilish
npm run db:generate
npm run db:push

# 4. Boshlang'ich ma'lumotlar (4 filial, 5 lavozim, admin foydalanuvchi)
npm run db:seed

# 5. Ishga tushirish
npm run dev
```

Seed'dan so'ng admin bilan kirish:
- **Telefon:** `+998900000000`
- **Parol:** `Admin123!`

> ⚠️ Production'da bu parolni albatta o'zgartiring yoki seed skriptini environment o'zgaruvchisidan o'qiydigan qilib moslang.

---

## 📦 Fayl yuklash (PDF/Video) haqida eslatma

Hozirgi implementatsiyada admin formalari `fileUrl` / `videoUrl` maydonlarini **to'g'ridan-to'g'ri URL** sifatida qabul qiladi. Productionga chiqishdan oldin haqiqiy fayl yuklashni ulashingiz kerak, masalan:
- **Vercel Blob** yoki **AWS S3 / Cloudflare R2** — PDF fayllar uchun
- **Mux** yoki **Cloudflare Stream** — video darsliklar uchun (adaptive streaming)

Fayl yuklangandan so'ng qaytgan public URL shu formalarga kiritiladi — schema va API'lar bunga tayyor (`fileUrl: String`, `videoUrl: String`).

## 🧩 Kengaytirish g'oyalari
- Test/Check-list konstruktoriga **tahrirlash (edit)** funksiyasini qo'shish (hozir faqat yaratish bor)
- Admin uchun har bir xodimning individual progress sahifasi
- Push-bildirishnomalar (yangi video/test qo'shilganda)
- Telegram bot bilan Deep Link orqali integratsiya (`t.me/bot?startapp=...`) — Mini App sifatida ochish
#   a k a d e m i y a - t a s a n n o - o r g  
 #   a k a d e m i y a - t a s a n n o - o r g  
 #   a k a d e m i y a - t a s a n n o - o r g  
 