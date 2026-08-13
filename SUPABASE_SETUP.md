# Supabase 設置指南

## 📝 步驟 1：建立帳號
1. 打開：https://supabase.com
2. 點 **Sign Up**
3. 用 Google、GitHub 或 Email 登錄

## 🚀 步驟 2：建立新專案
1. 進去後點 **New Project**
2. 填寫：
   - **Name**: `verdo-news` (或任意名稱)
   - **Database Password**: 設個隨機密碼（複製存好）
   - **Region**: 選 `ap-southeast-1` (新加坡/亞洲)
3. 點 **Create new project**
4. 等待 5-10 分鐘（會看到進度條）

## 🛠️ 步驟 3：建立數據表
等專案建好後，進去 **SQL Editor**，貼這段代碼並執行：

```sql
-- 建立編輯記錄表
CREATE TABLE edits (
  id BIGINT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  key TEXT NOT NULL UNIQUE,
  value TEXT,
  updated_at TIMESTAMP DEFAULT NOW(),
  updated_by TEXT DEFAULT 'admin'
);

-- 建立 Real-time 訂閱
ALTER PUBLICATION supabase_realtime ADD TABLE edits;
```

執行後會看到 **✓** 勾勾，表示成功！

## 🔑 步驟 4：取得連接信息
1. 左邊選單找 **Settings** → **API**
2. 複製這兩個：
   - `Project URL` (類似 https://xxxxx.supabase.co)
   - `anon public` Key

3. **在下面貼上這三個值**：
```
SUPABASE_URL = 
SUPABASE_ANON_KEY = 
```

✅ 完成後告訴我，我替您貼進代碼裡！
