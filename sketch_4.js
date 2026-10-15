const chineseFontFamily = "LXGW WenKai TC"; // 設定 Canvas 使用的繁體中文字型
const englishFontFamily = "Isometra"; // 設定英文與數字使用的字型名稱
const questionFileName = "question.csv"; // 設定外部 CSV 題庫檔案名稱
const quizQuestionCount = 5; // 設定每次測驗抽出的題目數量
const correctColor = "#6a994e"; // 設定正確答案背景顏色
const wrongColor = "#780000"; // 設定錯誤答案背景顏色
const normalColor = "#457b9d"; // 設定一般選項背景顏色
const backgroundColor = "#f1faee"; // 設定畫布背景顏色
const textColor = "#1d3557"; // 設定主要文字顏色
const disabledColor = "#a8dadc"; // 設定停用按鈕背景顏色
const borderColor = "#1d3557"; // 設定外框顏色
let fontReady = false; // 儲存繁體中文字型是否已完成載入
let questionBankReady = false; // 儲存題庫是否已完成載入
let questionBankError = false; // 儲存題庫是否發生錯誤
let questionBankErrorMessage = ""; // 儲存題庫錯誤訊息
let questionBank = []; // 儲存從 CSV 讀取的完整題庫
let quizData = []; // 儲存本次隨機抽出的五題
let currentQuestion = 0; // 儲存目前顯示的題目索引
let score = 0; // 儲存本次測驗答對題數
let quizFinished = false; // 儲存測驗是否已完成
let selectedAnswers = []; // 儲存每題使用者選擇的答案索引
let answeredQuestions = []; // 儲存每題是否已經作答
let correctAnswers = []; // 儲存每題是否答對
let layout = {}; // 儲存響應式版面資料
let lastInputTime = 0; // 儲存上一次輸入的時間
let lastInputX = -9999; // 儲存上一次輸入的水平座標
let lastInputY = -9999; // 儲存上一次輸入的垂直座標

function setup() { // 建立 p5.js 初始化函式
  createCanvas(windowWidth, windowHeight); // 建立符合瀏覽器視窗大小的畫布
  pixelDensity(min(window.devicePixelRatio || 1, 2)); // 限制高解析度裝置的畫布像素密度
  textAlign(CENTER, CENTER); // 設定文字水平與垂直對齊方式
  rectMode(CENTER); // 設定矩形以中心點作為定位基準
  initializeQuizState(); // 初始化測驗狀態資料
  updateLayout(); // 計算初始響應式版面
  waitForGoogleFont(); // 等待 HTML 已載入的 Google Fonts
  loadTable("question.csv", "csv", "header", tableLoaded, tableLoadError); // 使用指定格式載入外部 CSV 題庫
  tryEnterFullscreen(); // 嘗試在使用者允許時進入全螢幕模式
} // 結束 setup 函式

function tryEnterFullscreen() { // 建立嘗試進入全螢幕模式的函式
  setTimeout(() => { // 延遲執行以避免瀏覽器阻擋初始化時的全螢幕請求
    if (!fullscreen()) { // 判斷目前是否尚未進入全螢幕
      fullscreen(true); // 嘗試切換到全螢幕模式
    } // 結束全螢幕狀態判斷
  }, 500); // 設定延遲五百毫秒執行
} // 結束 tryEnterFullscreen 函式

function waitForGoogleFont() { // 建立等待 Google Fonts 的函式
  if (!document.fonts || !document.fonts.load || !document.fonts.ready) { // 判斷瀏覽器是否支援字型載入 API
    fontReady = false; // 不支援 API 時保留預設字型狀態
    return; // 結束字型等待流程
  } // 結束字型 API 判斷
  document.fonts.load(`16px "${chineseFontFamily}"`).then(() => { // 等待 LXGW WenKai TC 字型完成載入
    return document.fonts.ready; // 確認所有網頁字型都已準備完成
  }).then(() => { // 執行字型載入完成後的處理
    fontReady = document.fonts.check(`16px "${chineseFontFamily}"`); // 確認指定繁體中文字型可以使用
    textFont(chineseFontFamily); // 將 Canvas 文字設定為 LXGW WenKai TC
    updateLayout(); // 字型載入後重新計算版面
    redraw(); // 字型載入後重新繪製畫面
  }).catch(() => { // 處理字型載入失敗的情況
    fontReady = false; // 字型載入失敗時使用瀏覽器預設字型
  }); // 結束字型載入 Promise 流程
} // 結束 waitForGoogleFont 函式

function applyCanvasFont() { // 建立套用 Canvas 字型的函式
  if (fontReady) { // 判斷繁體中文字型是否已經完成載入
    textFont("LXGW WenKai TC"); // 使用 LXGW WenKai TC 顯示題目與介面文字
  } else { // 執行字型尚未完成載入的情況
    textFont("sans-serif"); // 暫時使用瀏覽器預設無襯線字型
  } // 結束字型狀態判斷
} // 結束 applyCanvasFont 函式

function tableLoaded(table) { // 建立 CSV 題庫載入完成回呼函式
  questionBank = []; // 清空原本的題庫資料
  const requiredColumns = ["question", "option1", "option2", "option3", "option4", "answer"]; // 定義必須存在的 CSV 欄位
  for (let columnIndex = 0; columnIndex < requiredColumns.length; columnIndex++) { // 逐一檢查所有必要欄位
    if (!table.columns.includes(requiredColumns[columnIndex])) { // 判斷目前欄位是否不存在
      questionBankError = true; // 設定題庫錯誤狀態
      questionBankErrorMessage = `CSV 缺少必要欄位：${requiredColumns[columnIndex]}`; // 設定缺少欄位的錯誤訊息
      return; // 停止處理不完整的 CSV
    } // 結束欄位存在判斷
  } // 結束必要欄位檢查迴圈
  for (let rowIndex = 0; rowIndex < table.getRowCount(); rowIndex++) { // 逐列解析 CSV 題庫資料
    const questionText = readTableCell(table, rowIndex, "question"); // 讀取題目文字
    const options = [readTableCell(table, rowIndex, "option1"), readTableCell(table, rowIndex, "option2"), readTableCell(table, rowIndex, "option3"), readTableCell(table, rowIndex, "option4")]; // 讀取四個選項文字
    const answerText = readTableCell(table, rowIndex, "answer"); // 讀取正確答案索引文字
    const answerIndex = Number(answerText); // 將答案索引文字轉換為數字
    const hasBlankOption = options.some((option) => option.length === 0); // 判斷是否有空白選項
    if (questionText.length === 0 || hasBlankOption || !Number.isInteger(answerIndex) || answerIndex < 0 || answerIndex > 3) { // 判斷目前資料列是否有效
      continue; // 跳過空白或格式錯誤的資料列
    } // 結束資料列有效性判斷
    questionBank.push({question: questionText, options: options, answer: answerIndex}); // 將有效題目加入完整題庫
  } // 結束 CSV 題庫解析迴圈
  if (questionBank.length < quizQuestionCount) { // 判斷有效題目是否少於五題
    questionBankError = true; // 設定題庫錯誤狀態
    questionBankErrorMessage = `題庫至少需要 ${quizQuestionCount} 題，目前只有 ${questionBank.length} 題有效資料。`; // 設定題庫不足錯誤訊息
    return; // 停止開始測驗
  } // 結束題庫數量判斷
  questionBankReady = true; // 設定題庫載入完成
  questionBankError = false; // 清除題庫錯誤狀態
  startNewQuiz(); // 從完整題庫隨機抽出五題
} // 結束 tableLoaded 函式

function readTableCell(table, rowIndex, columnName) { // 建立安全讀取 CSV 儲存格的函式
  const cellValue = table.getString(rowIndex, columnName); // 取得指定列與欄位的內容
  return cellValue === null || cellValue === undefined ? "" : String(cellValue).trim(); // 將空值轉成空字串並移除前後空白
} // 結束 readTableCell 函式

function tableLoadError(error) { // 建立 CSV 題庫載入失敗回呼函式
  questionBankError = true; // 設定題庫錯誤狀態
  questionBankErrorMessage = "無法讀取 question.csv，請確認檔案與 sketch.js 位於同一個資料夾。"; // 設定題庫讀取失敗訊息
  console.error(error); // 將詳細錯誤輸出至瀏覽器主控台
} // 結束 tableLoadError 函式

function startNewQuiz() { // 建立開始或重新開始測驗的函式
  if (!questionBankReady || questionBank.length < quizQuestionCount) { // 判斷題庫是否尚未準備完成或題目不足
    return; // 題庫不符合條件時停止開始測驗
  } // 結束題庫條件判斷
  const shuffledQuestions = shuffle(questionBank.slice(), true); // 複製題庫並進行隨機排序
  quizData = shuffledQuestions.slice(0, quizQuestionCount); // 從隨機排序後的題庫抽出五題
  initializeQuizState(); // 重設本次測驗的作答狀態
} // 結束 startNewQuiz 函式

function initializeQuizState() { // 建立初始化測驗狀態的函式
  currentQuestion = 0; // 將目前題目設定為第一題
  score = 0; // 將分數歸零
  quizFinished = false; // 將測驗設定為尚未完成
  selectedAnswers = Array(quizQuestionCount).fill(-1); // 初始化每題答案為尚未選擇
  answeredQuestions = Array(quizQuestionCount).fill(false); // 初始化每題為尚未作答
  correctAnswers = Array(quizQuestionCount).fill(false); // 初始化每題為尚未判定答對
} // 結束 initializeQuizState 函式

function draw() { // 建立 p5.js 每一幀執行的繪圖函式
  background(backgroundColor); // 設定畫布背景顏色
  applyCanvasFont(); // 套用目前可使用的 Canvas 字型
  updateLayout(); // 每一幀重新計算響應式版面
  if (questionBankError) { // 判斷題庫是否發生錯誤
    drawErrorScreen(); // 顯示題庫載入失敗畫面
  } else if (!questionBankReady || quizData.length === 0) { // 判斷題庫是否仍在載入中
    drawLoadingScreen(); // 顯示題庫載入中畫面
  } else if (quizFinished) { // 判斷測驗是否已經完成
    drawResultScreen(); // 顯示測驗結果畫面
  } else { // 執行一般測驗進行中的狀態
    drawQuizScreen(); // 顯示目前題目與選項
  } // 結束畫面狀態判斷
} // 結束 draw 函式

function updateLayout() { // 建立計算響應式版面的函式
  const shortSide = min(width, height); // 取得畫面短邊尺寸
  const isPortrait = height >= width; // 判斷畫面是否為直向
  const isPhone = shortSide < 600; // 判斷是否為手機尺寸
  const isVeryShort = height < 430; // 判斷是否為特別矮的橫向畫面
  const singleColumn = isPhone && isPortrait; // 手機直向使用單欄選項
  const safeX = constrain(width * 0.045, 12, 42); // 設定左右安全邊距
  const safeTop = constrain(height * 0.025, 8, 28); // 設定上方安全邊距
  const safeBottom = constrain(height * 0.025, 8, 26); // 設定下方安全邊距
  const contentWidth = max(1, min(width - safeX * 2, 960)); // 計算主要內容寬度
  const columnCount = singleColumn ? 1 : 2; // 設定手機直向單欄或寬畫面雙欄
  const rowCount = ceil(4 / columnCount); // 計算四個選項所需的列數
  const gapBase = constrain(shortSide * 0.022, 6, 18); // 計算選項間距基準值
  const columnGap = gapBase; // 設定雙欄選項的欄間距
  const optionWidth = columnCount === 1 ? contentWidth : (contentWidth - columnGap) / 2; // 計算選項寬度
  const navigationHeight = constrain(shortSide * 0.105, 42, 58); // 計算底部按鈕高度
  const navigationWidth = constrain(width * 0.245, 104, 190); // 計算底部按鈕寬度
  const navigationY = height - safeBottom - navigationHeight / 2; // 計算底部按鈕中心位置
  const titleSize = constrain(shortSide * 0.075, 21, 48); // 計算標題文字大小
  const numberSize = constrain(shortSide * 0.038, 14, 26); // 計算題號文字大小
  const baseQuestionSize = constrain(shortSide * 0.052, 17, 34); // 計算題目文字基準大小
  const baseOptionTextSize = constrain(shortSide * 0.037, 13, 23); // 計算選項文字基準大小
  const buttonTextSize = constrain(shortSide * 0.034, 13, 22); // 計算導覽按鈕文字大小
  const titleY = safeTop + titleSize * 0.58; // 計算標題中心位置
  const numberY = titleY + titleSize * 0.88; // 計算題號中心位置
  const questionTop = numberY + numberSize * 0.7 + 8; // 計算題目區域起始位置
  const questionHeight = isVeryShort ? 42 : singleColumn ? 78 : 70; // 設定題目區域高度
  const optionStartY = questionTop + questionHeight + (isVeryShort ? 5 : 12); // 計算選項區域起始位置
  const availableHeight = max(1, navigationY - navigationHeight / 2 - optionStartY - 12); // 計算選項可用高度
  const idealOptionHeight = isVeryShort ? 38 : singleColumn ? 52 : 62; // 設定選項理想高度
  const idealOptionTotalHeight = rowCount * idealOptionHeight + (rowCount - 1) * gapBase; // 計算選項理想總高度
  const scale = constrain(availableHeight / max(idealOptionTotalHeight, 1), 0.52, 1); // 根據可用高度計算縮放比例
  const optionHeight = max(36, idealOptionHeight * scale); // 計算最終選項高度
  const optionGap = max(4, gapBase * scale); // 計算最終選項間距
  const questionSize = max(14, baseQuestionSize * min(1, scale + 0.15)); // 根據畫面高度調整題目字級
  const optionTextSize = max(11, baseOptionTextSize * min(1, scale + 0.12)); // 根據畫面高度調整選項字級
  layout = {shortSide: shortSide, isPortrait: isPortrait, isPhone: isPhone, isVeryShort: isVeryShort, singleColumn: singleColumn, safeX: safeX, contentWidth: contentWidth, columnCount: columnCount, rowCount: rowCount, columnGap: columnGap, optionWidth: optionWidth, optionHeight: optionHeight, optionGap: optionGap, titleSize: titleSize, numberSize: numberSize, questionSize: questionSize, optionTextSize: optionTextSize, buttonTextSize: buttonTextSize, centerX: width / 2, titleY: titleY, numberY: numberY, questionTop: questionTop, questionHeight: questionHeight, optionStartY: optionStartY, navigationY: navigationY, navigationWidth: navigationWidth, navigationHeight: navigationHeight}; // 儲存所有響應式版面資料
} // 結束 updateLayout 函式

function drawLoadingScreen() { // 建立繪製題庫載入中畫面的函式
  fill(textColor); // 設定載入標題顏色
  noStroke(); // 移除文字外框
  textSize(layout.titleSize); // 設定載入標題文字大小
  text("正在載入題庫...", layout.centerX, height * 0.42, layout.contentWidth, 70); // 顯示題庫載入中訊息
  textSize(layout.numberSize); // 設定載入提示文字大小
  text("請稍候", layout.centerX, height * 0.58, layout.contentWidth, 50); // 顯示載入提示
} // 結束 drawLoadingScreen 函式

function drawErrorScreen() { // 建立繪製題庫錯誤畫面的函式
  fill(wrongColor); // 設定錯誤標題顏色
  noStroke(); // 移除文字外框
  textSize(layout.titleSize); // 設定錯誤標題文字大小
  text("題庫載入失敗", layout.centerX, height * 0.3, layout.contentWidth, 80); // 顯示題庫錯誤標題
  fill(textColor); // 設定錯誤說明文字顏色
  textSize(layout.numberSize); // 設定錯誤說明文字大小
  text(questionBankErrorMessage, layout.centerX, height * 0.5, layout.contentWidth, 150); // 顯示錯誤原因
  text("請確認 question.csv 與 sketch.js 位於同一個資料夾。", layout.centerX, height * 0.7, layout.contentWidth, 100); // 顯示檔案位置提示
} // 結束 drawErrorScreen 函式

function drawQuizScreen() { // 建立繪製測驗題目畫面的函式
  const question = quizData[currentQuestion]; // 取得目前題目資料
  const isAnswered = answeredQuestions[currentQuestion]; // 取得目前題目的作答狀態
  fill(textColor); // 設定標題文字顏色
  noStroke(); // 移除標題外框
  textSize(layout.titleSize); // 套用響應式標題文字大小
  text("p5.js 簡易指令練習測驗", layout.centerX, layout.titleY, layout.contentWidth, layout.titleSize * 1.5); // 顯示測驗標題
  textSize(layout.numberSize); // 套用響應式題號文字大小
  text(`第 ${currentQuestion + 1} 題／共 ${quizQuestionCount} 題`, layout.centerX, layout.numberY, layout.contentWidth, layout.numberSize * 1.6); // 顯示目前題號
  textSize(layout.questionSize); // 套用響應式題目文字大小
  text(question.question, layout.centerX, layout.questionTop + layout.questionHeight / 2, layout.contentWidth, layout.questionHeight); // 顯示題目並自動換行
  for (let optionIndex = 0; optionIndex < question.options.length; optionIndex++) { // 逐一處理四個答案選項
    const position = getOptionPosition(optionIndex); // 取得目前選項的位置
    let optionColor = normalColor; // 設定選項預設背景顏色
    let bounceOffset = 0; // 設定選項預設不跳動
    if (isAnswered) { // 判斷目前題目是否已經作答
      if (optionIndex === question.answer) { // 判斷目前選項是否為正確答案
        optionColor = correctColor; // 將正確答案背景設定為指定綠色
        bounceOffset = sin(frameCount * 0.16) * min(8, height * 0.012); // 讓正確答案持續上下跳動
      } // 結束正確答案判斷
      if (optionIndex === selectedAnswers[currentQuestion] && !correctAnswers[currentQuestion]) { // 判斷目前選項是否為使用者選錯的答案
        optionColor = wrongColor; // 將使用者答錯的選項背景設定為指定深紅色
      } // 結束錯誤答案判斷
    } // 結束作答狀態判斷
    drawOptionButton(question.options[optionIndex], position.x, position.y + bounceOffset, optionColor); // 繪製目前答案選項
  } // 結束四個選項的繪製迴圈
  drawNavigationButtons(); // 繪製底部上一題與下一題按鈕
} // 結束 drawQuizScreen 函式

function getOptionPosition(index) { // 建立計算選項位置的函式
  const row = layout.columnCount === 1 ? index : floor(index / layout.columnCount); // 計算選項所在列
  const column = layout.columnCount === 1 ? 0 : index % layout.columnCount; // 計算選項所在欄
  const totalWidth = layout.columnCount === 1 ? layout.optionWidth : layout.optionWidth * 2 + layout.columnGap; // 計算選項總寬度
  const firstX = layout.centerX - totalWidth / 2 + layout.optionWidth / 2; // 計算第一欄選項中心位置
  const x = firstX + column * (layout.optionWidth + layout.columnGap); // 計算目前選項水平位置
  const y = layout.optionStartY + layout.optionHeight / 2 + row * (layout.optionHeight + layout.optionGap); // 計算目前選項垂直位置
  return {x: x, y: y}; // 回傳目前選項的位置資料
} // 結束 getOptionPosition 函式

function drawOptionButton(label, x, y, colorValue) { // 建立繪製答案選項按鈕的函式
  fill(colorValue); // 設定選項按鈕背景顏色
  stroke(borderColor); // 設定選項按鈕外框顏色
  strokeWeight(2); // 設定選項按鈕外框粗細
  rect(x, y, layout.optionWidth, layout.optionHeight, 10); // 繪製圓角選項按鈕
  fill("#ffffff"); // 設定選項文字顏色
  noStroke(); // 移除選項文字外框
  textSize(layout.optionTextSize); // 套用響應式選項文字大小
  text(label, x, y, layout.optionWidth * 0.88, layout.optionHeight * 0.82); // 顯示選項文字並自動換行
} // 結束 drawOptionButton 函式

function drawNavigationButtons() { // 建立繪製底部導覽按鈕的函式
  const sideMargin = max(10, layout.safeX * 0.65); // 設定導覽按鈕左右安全邊距
  const previousX = sideMargin + layout.navigationWidth / 2; // 計算上一題按鈕水平位置
  const nextX = width - sideMargin - layout.navigationWidth / 2; // 計算下一題按鈕水平位置
  const previousDisabled = currentQuestion === 0; // 判斷上一題按鈕是否停用
  const nextDisabled = !answeredQuestions[currentQuestion]; // 判斷下一題按鈕是否停用
  const nextLabel = currentQuestion === quizQuestionCount - 1 ? "完成測驗" : "下一題"; // 設定下一個按鈕文字
  drawNavigationButton("上一題", previousX, layout.navigationY, previousDisabled); // 繪製上一題按鈕
  drawNavigationButton(nextLabel, nextX, layout.navigationY, nextDisabled); // 繪製下一題或完成測驗按鈕
  layout.previousButton = {x: previousX, y: layout.navigationY, width: layout.navigationWidth, height: layout.navigationHeight}; // 儲存上一題按鈕位置
  layout.nextButton = {x: nextX, y: layout.navigationY, width: layout.navigationWidth, height: layout.navigationHeight}; // 儲存下一題按鈕位置
} // 結束 drawNavigationButtons 函式

function drawNavigationButton(label, x, y, disabled) { // 建立繪製導覽按鈕的函式
  fill(disabled ? disabledColor : borderColor); // 依照按鈕狀態設定背景顏色
  stroke(borderColor); // 設定導覽按鈕外框顏色
  strokeWeight(2); // 設定導覽按鈕外框粗細
  rect(x, y, layout.navigationWidth, layout.navigationHeight, 9); // 繪製圓角導覽按鈕
  fill("#ffffff"); // 設定導覽按鈕文字顏色
  noStroke(); // 移除導覽文字外框
  textSize(layout.buttonTextSize); // 套用響應式導覽文字大小
  text(label, x, y, layout.navigationWidth * 0.88, layout.navigationHeight * 0.75); // 顯示導覽按鈕文字
} // 結束 drawNavigationButton 函式

function drawResultScreen() { // 建立繪製測驗結果畫面的函式
  const compact = height < 520; // 判斷目前是否為矮畫面
  const resultTitleSize = constrain(min(width, height) * 0.08, 26, 58); // 計算結果標題文字大小
  const resultScoreSize = constrain(min(width, height) * 0.065, 23, 48); // 計算結果分數文字大小
  const resultMessageSize = constrain(min(width, height) * 0.04, 15, 28); // 計算結果訊息文字大小
  const titleY = compact ? height * 0.16 : height * 0.25; // 計算結果標題位置
  const scoreY = compact ? height * 0.34 : height * 0.43; // 計算結果分數位置
  const messageY = compact ? height * 0.5 : height * 0.56; // 計算結果訊息位置
  const restartY = compact ? height * 0.78 : height * 0.72; // 計算重新開始按鈕位置
  const restartWidth = min(width * 0.58, 280); // 計算重新開始按鈕寬度
  const restartHeight = constrain(min(width, height) * 0.115, 46, 62); // 計算重新開始按鈕高度
  fill(textColor); // 設定結果標題顏色
  noStroke(); // 移除結果標題外框
  textSize(resultTitleSize); // 套用結果標題文字大小
  text("測驗完成！", layout.centerX, titleY, width * 0.9, resultTitleSize * 1.5); // 顯示測驗完成標題
  fill(correctColor); // 設定結果分數顏色
  textSize(resultScoreSize); // 套用結果分數文字大小
  text(`你答對了 ${score}／${quizQuestionCount} 題`, layout.centerX, scoreY, width * 0.9, resultScoreSize * 1.5); // 顯示答對題數
  fill(textColor); // 設定結果評語顏色
  textSize(resultMessageSize); // 套用結果評語文字大小
  if (score === quizQuestionCount) { // 判斷是否全部答對
    text("太棒了！全部答對！", layout.centerX, messageY, width * 0.88, 70); // 顯示滿分評語
  } else if (score >= 3) { // 判斷是否答對三題以上
    text("表現很好，繼續練習會更熟悉！", layout.centerX, messageY, width * 0.88, 80); // 顯示良好評語
  } else { // 執行答對題數低於三題的情況
    text("再多練習幾次，就會越來越熟悉！", layout.centerX, messageY, width * 0.88, 80); // 顯示鼓勵評語
  } // 結束結果評語判斷
  fill(borderColor); // 設定重新開始按鈕背景顏色
  stroke(borderColor); // 設定重新開始按鈕外框顏色
  strokeWeight(2); // 設定重新開始按鈕外框粗細
  rect(layout.centerX, restartY, restartWidth, restartHeight, 10); // 繪製重新開始按鈕
  fill("#ffffff"); // 設定重新開始文字顏色
  noStroke(); // 移除重新開始文字外框
  textSize(resultMessageSize); // 套用重新開始文字大小
  text("重新開始", layout.centerX, restartY, restartWidth * 0.85, restartHeight * 0.75); // 顯示重新開始文字
  layout.restartButton = {x: layout.centerX, y: restartY, width: restartWidth, height: restartHeight}; // 儲存重新開始按鈕位置
} // 結束 drawResultScreen 函式

function mousePressed() { // 建立滑鼠按下事件函式
  handleInput(mouseX, mouseY); // 將滑鼠座標交給共用輸入處理函式
  return false; // 防止瀏覽器執行額外的滑鼠預設行為
} // 結束 mousePressed 函式

function touchStarted() { // 建立觸控開始事件函式
  if (touches.length > 0) { // 判斷是否存在觸控座標
    handleInput(touches[0].x, touches[0].y); // 將第一個觸控座標交給共用輸入處理函式
  } // 結束觸控座標判斷
  return false; // 防止瀏覽器滑動並避免觸控與滑鼠事件重複
} // 結束 touchStarted 函式

function handleInput(inputX, inputY) { // 建立滑鼠與觸控共用輸入處理函式
  const now = millis(); // 取得目前輸入時間
  const inputDistance = dist(inputX, inputY, lastInputX, lastInputY); // 計算本次輸入與上次輸入的距離
  if (now - lastInputTime < 400 && inputDistance < 30) { // 判斷是否為觸控後產生的重複事件
    return; // 忽略重複輸入事件
  } // 結束重複事件判斷
  lastInputTime = now; // 記錄本次輸入時間
  lastInputX = inputX; // 記錄本次輸入水平座標
  lastInputY = inputY; // 記錄本次輸入垂直座標
  if (questionBankError || !questionBankReady || quizData.length === 0) { // 判斷是否仍在載入或錯誤狀態
    return; // 載入或錯誤狀態不處理點擊
  } // 結束載入與錯誤狀態判斷
  if (quizFinished) { // 判斷測驗是否已經完成
    const button = layout.restartButton; // 取得重新開始按鈕資料
    if (button && isInsideButton(inputX, inputY, button.x, button.y, button.width, button.height)) { // 判斷是否點擊重新開始按鈕
      startNewQuiz(); // 重新隨機抽出五題並開始測驗
    } // 結束重新開始按鈕判斷
    return; // 結束結果畫面的輸入處理
  } // 結束測驗完成狀態判斷
  const question = quizData[currentQuestion]; // 取得目前題目資料
  if (!answeredQuestions[currentQuestion]) { // 判斷目前題目是否尚未作答
    for (let optionIndex = 0; optionIndex < question.options.length; optionIndex++) { // 逐一檢查四個答案選項
      const position = getOptionPosition(optionIndex); // 取得目前選項位置
      if (isInsideButton(inputX, inputY, position.x, position.y, layout.optionWidth, layout.optionHeight)) { // 判斷是否點擊目前答案選項
        selectedAnswers[currentQuestion] = optionIndex; // 記錄使用者選擇的答案索引
        answeredQuestions[currentQuestion] = true; // 設定目前題目已經作答
        correctAnswers[currentQuestion] = optionIndex === question.answer; // 判斷使用者答案是否正確
        if (correctAnswers[currentQuestion]) { // 判斷使用者是否答對
          score++; // 將答對題數增加一題
        } // 結束答對判斷
        return; // 結束本次輸入處理
      } // 結束選項點擊判斷
    } // 結束答案選項檢查迴圈
  } // 結束尚未作答判斷
  const sideMargin = max(10, layout.safeX * 0.65); // 設定導覽按鈕左右安全邊距
  const previousX = sideMargin + layout.navigationWidth / 2; // 計算上一題按鈕水平位置
  const nextX = width - sideMargin - layout.navigationWidth / 2; // 計算下一題按鈕水平位置
  if (currentQuestion > 0 && isInsideButton(inputX, inputY, previousX, layout.navigationY, layout.navigationWidth, layout.navigationHeight)) { // 判斷是否點擊上一題按鈕
    currentQuestion--; // 回到上一題
    return; // 結束本次輸入處理
  } // 結束上一題按鈕判斷
  if (answeredQuestions[currentQuestion] && isInsideButton(inputX, inputY, nextX, layout.navigationY, layout.navigationWidth, layout.navigationHeight)) { // 判斷是否點擊下一題或完成測驗按鈕
    if (currentQuestion === quizQuestionCount - 1) { // 判斷是否位於最後一題
      quizFinished = true; // 將測驗狀態設定為已完成
    } else { // 執行尚未到最後一題的情況
      currentQuestion++; // 前往下一題
    } // 結束最後一題判斷
  } // 結束下一題按鈕判斷
} // 結束 handleInput 函式

function isInsideButton(pointX, pointY, buttonX, buttonY, buttonWidth, buttonHeight) { // 建立判斷座標是否位於按鈕內的函式
  const left = buttonX - buttonWidth / 2; // 計算按鈕左邊界
  const right = buttonX + buttonWidth / 2; // 計算按鈕右邊界
  const top = buttonY - buttonHeight / 2; // 計算按鈕上邊界
  const bottom = buttonY + buttonHeight / 2; // 計算按鈕下邊界
  return pointX >= left && pointX <= right && pointY >= top && pointY <= bottom; // 回傳座標是否位於按鈕範圍內
} // 結束 isInsideButton 函式

function keyPressed() { // 建立鍵盤按下事件函式
  if (key === "f" || key === "F") { // 判斷是否按下 F 鍵
    fullscreen(!fullscreen()); // 切換全螢幕狀態
  } // 結束全螢幕切換判斷
} // 結束 keyPressed 函式

function windowResized() { // 建立瀏覽器視窗尺寸改變函式
  resizeCanvas(windowWidth, windowHeight); // 重新調整畫布大小
  updateLayout(); // 重新計算所有響應式版面
} // 結束 windowResized 函式
