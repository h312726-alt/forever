# 維爾多深度報導有限公司

一個可用 GitHub Pages 發佈，並可透過 Decap CMS 編輯內容的事件報導網站。

## 你要怎麼用

1. 把這個資料夾上傳到 GitHub 倉庫。
2. 到 [admin/config.yml](admin/config.yml) 把這些地方改成你的真實資訊：
	- `YOUR_GITHUB_USERNAME`
	- `YOUR_REPOSITORY_NAME`
	- `site_url`
3. 到 GitHub 倉庫設定開啟 GitHub Pages，來源選 `main` 分支的根目錄。
4. 另外要設定 Decap CMS 的 GitHub 登入，通常需要一個 GitHub OAuth App 或對應的驗證設定，不然 `/admin/` 雖然打得開，但登入不會成功。
5. 之後用瀏覽器打開 `https://你的GitHubPages網址/admin/`，登入後就可以編輯 [content/reports.json](content/reports.json) 裡的報導內容。

## 內容在哪裡

- 首頁資料來源： [content/reports.json](content/reports.json)
- CMS 後台入口： [admin/index.html](admin/index.html)
- CMS 設定： [admin/config.yml](admin/config.yml)

## 留言區

留言區使用 Giscus，留言會存在 GitHub Discussions 裡，所以重新整理不會消失。要啟用它，你需要把 [index.html](index.html) 裡留言區的 `YOUR_GITHUB_USERNAME / YOUR_REPOSITORY_NAME / YOUR_REPO_ID / YOUR_CATEGORY_ID` 換成真實值，並且讓 GitHub 倉庫開啟 Discussions。

## 本機預覽

直接打開 `index.html` 可以看畫面，但如果要測試 CMS 與資料更新，建議用 GitHub Pages 或本機 HTTP 伺服器開啟。
