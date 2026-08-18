# 廣大中學智慧管理平台 Demo

給澳門廣大中學校長演示用的**本機可點構想稿**。沒有後端、沒有登入、資料全是假的。看起來像一間約 960 人、24 班、90 多名教師的中學正在運作。

這不是上線產品，也不是報價用的架構。

## 線上看

https://jamescheong324.github.io/kwong-tai-school-platform-demo/

倉庫是 private。若打不開，多半是 GitHub Pages 對 private repo 有方案限制，把你加進 Collaborators 或改成 public 即可。

## 本機開啟

需要已安裝 [Node.js](https://nodejs.org/) 18 或更新版本。

```bash
git clone git@github.com:jamescheong324/kwong-tai-school-platform-demo.git
cd kwong-tai-school-platform-demo
npm install
npm run dev
```

終端出現 `http://localhost:5173/` 後，用瀏覽器打開即可。關掉終端就停止。

之後若要再看一次，在同一資料夾再執行 `npm run dev`。

## 建議先點這條路徑

1. 今日 → 出勤偏低班級  
2. 進入 **中三B**  
3. 學生名單點 **陳嘉豪**  
4. 打開 **六年趨勢**

左下角可切換「校長／主任／教師」，教師檢視只看得到自己的班。

## 側欄還有什麼

| 頁面 | 在看什麼 |
| --- | --- |
| 今日 | 全校出勤、排課衝突、教師例外（請假／公幹／會議） |
| 班級 | 24 班名單、交接、班長評選 |
| 學生 | 全校搜尋、品行與身心健康 |
| 教師 | 92 人狀態、培訓、獲獎、班主任成效 |
| 排課 | 按班級或教師看本週課表；撞堂可改派，點兩格可對調 |
| 招生 | 各班剩餘學位 |
| 升學 | 依院校與年份追溯學生、原班、導師 |
| 策略 | 校策推行前後的數字對照 |
| 報表 | 年級出勤與成績 |
| 科組資源 | 校本教案／課件，不隨老師離職帶走 |

假資料在 `src/school.ts`，每次整理都重新生成，不會寫進資料庫。

## 技術

Vite + React + TypeScript。純前端。
