// 設定 Google 試算表發布後的 CSV 網址
const GOOGLE_SHEET_CSV_URL = "https://docs.google.com/spreadsheets/d/1AhR13qaWnyDcUnu6vVddGWMkHbuC8HM37WXa9qJwlqw/gviz/tq?tqx=out:csv&sheet=question"; // 設定正確的 CSV 網址// 設定繁體中文字型名稱
const chineseFontFamily = "LXGW WenKai TC"; // 設定 Canvas 使用的繁體中文字型

// 設定英文字型名稱
const englishFontFamily = "Isometra"; // 設定英文與數字使用的字型

// 設定每次測驗抽出的題目數量
const quizQuestionCount = 5; // 設定每次抽出五題

// 設定繁體中文字型是否完成載入
let fontReady = false; // 儲存字型載入狀態

// 設定 Google 試算表是否完成載入
let questionBankReady = false; // 儲存題庫載入狀態

// 設定 Google 試算表是否載入失敗
let questionBankError = false; // 儲存題庫錯誤狀態

// 儲存題庫錯誤訊息
let questionBankErrorMessage = ""; // 儲存錯誤畫面要顯示的訊息

// 儲存完整題庫
let questionBank = []; // 建立完整題庫陣列

// 儲存本次隨機抽出的題目
let quizData = []; // 建立本次測驗題目陣列

// 儲存目前題目索引
let currentQuestion = 0; // 設定目前顯示的題目

// 儲存目前答對題數
let score = 0; // 設定目前分數

// 儲存測驗是否已完成
let quizFinished = false; // 設定測驗完成狀態

// 儲存每一題使用者選擇的答案
let selectedAnswers = []; // 建立使用者答案陣列

// 儲存每一題是否已經作答
let answeredQuestions = []; // 建立作答狀態陣列

// 儲存每一題是否答對
let correctAnswers = []; // 建立答對狀態陣列

// 儲存響應式版面資料
let layout = {}; // 建立版面資料物件

// 儲存上一次輸入時間
let lastInputTime = 0; // 建立輸入時間變數

// 儲存上一次輸入的水平座標
let lastInputX = -9999; // 建立水平座標變數

// 儲存上一次輸入的垂直座標
let lastInputY = -9999; // 建立垂直座標變數

// 設定正確答案背景顏色
const correctColor = "#6a994e"; // 設定正確答案綠色背景

// 設定錯誤答案背景顏色
const wrongColor = "#780000"; // 設定錯誤答案深紅色背景

// 設定一般按鈕背景顏色
const normalColor = "#457b9d"; // 設定一般按鈕藍色背景

// 設定畫布背景顏色
const backgroundColor = "#f1faee"; // 設定畫布背景顏色

// 設定主要文字顏色
const textColor = "#1d3557"; // 設定主要文字顏色

// 設定停用按鈕背景顏色
const disabledColor = "#a8dadc"; // 設定停用按鈕顏色

// 設定外框顏色
const borderColor = "#1d3557"; // 設定按鈕外框顏色

function setup() { // 建立 p5.js 初始化函式
  createCanvas(windowWidth, windowHeight); // 建立符合瀏覽器視窗大小的畫布
  pixelDensity(min(window.devicePixelRatio || 1, 2)); // 設定畫布像素密度
  textAlign(CENTER, CENTER); // 設定文字水平與垂直置中
  rectMode(CENTER); // 設定矩形以中心點繪製
  initializeQuizState(); // 初始化測驗狀態
  updateLayout(); // 計算響應式版面
  waitForGoogleFont(); // 等待 HTML 載入的 Google Fonts
  loadGoogleSheetQuestions(); // 載入 Google 試算表題庫
} // 結束 setup 函式

function waitForGoogleFont() { // 建立等待 Google Fonts 的函式
  if (document.fonts && document.fonts.load) { // 判斷瀏覽器是否支援字型載入 API
    document.fonts.load(`16px "${chineseFontFamily}"`).then(() => { // 載入 LXGW WenKai TC 字型
      return document.fonts.ready; // 等待所有網頁字型完成載入
    }).then(() => { // 執行字型載入完成後的程式
      fontReady = document.fonts.check(`16px "${chineseFontFamily}"`); // 確認繁體中文字型是否可以使用
      applyCanvasFont(); // 將字型套用到畫布
      updateLayout(); // 字型載入後重新計算版面
      redraw(); // 字型載入後重新繪製畫面
    }).catch(() => { // 處理字型載入失敗的情況
      fontReady = false; // 保留預設字型狀態
    }); // 結束字型載入處理
  } else { // 執行瀏覽器不支援字型 API 的情況
    fontReady = false; // 使用預設字型
  } // 結束字型 API 判斷
} // 結束 waitForGoogleFont 函式

function applyCanvasFont() { // 建立套用畫布字型的函式
  if (fontReady) { // 判斷繁體中文字型是否已經載入
    textFont(chineseFontFamily); // 將畫布文字設定為 LXGW WenKai TC
  } else { // 執行字型尚未載入的情況
    textFont("sans-serif"); // 暫時使用預設無襯線字型
  } // 結束字型狀態判斷
} // 結束 applyCanvasFont 函式

function loadGoogleSheetQuestions() { // 建立載入 Google 試算表題庫的函式
  if (GOOGLE_SHEET_CSV_URL.includes("請在這裡貼上")) { // 判斷使用者是否尚未設定試算表網址
    questionBankError = true; // 設定題庫錯誤狀態
    questionBankErrorMessage = "尚未設定 Google 試算表 CSV 網址。"; // 設定錯誤訊息
    return; // 結束題庫載入
  } // 結束網址檢查

  loadTable(GOOGLE_SHEET_CSV_URL, "csv", "header", tableLoaded, tableLoadError); // 載入 Google 試算表 CSV 資料
} // 結束 loadGoogleSheetQuestions 函式

function tableLoaded(table) { // 建立 Google 試算表載入完成函式
  questionBank = []; // 清空原本的完整題庫

  for (let rowIndex = 0; rowIndex < table.getRowCount(); rowIndex++) { // 逐列讀取試算表資料
    const questionText = table.getString(rowIndex, "question").trim(); // 讀取題目文字
    const option1 = table.getString(rowIndex, "option1").trim(); // 讀取第一個選項
    const option2 = table.getString(rowIndex, "option2").trim(); // 讀取第二個選項
    const option3 = table.getString(rowIndex, "option3").trim(); // 讀取第三個選項
    const option4 = table.getString(rowIndex, "option4").trim(); // 讀取第四個選項
    const answerIndex = int(table.getString(rowIndex, "answer").trim()); // 讀取正確答案索引

    if (questionText === "") { // 判斷題目是否為空白
      continue; // 跳過空白題目
    } // 結束題目空白判斷

    if ([option1, option2, option3, option4].some(option => option === "")) { // 判斷是否有空白選項
      continue; // 跳過含有空白選項的資料列
    } // 結束選項空白判斷

    if (answerIndex < 0 || answerIndex > 3 || isNaN(answerIndex)) { // 判斷答案索引是否正確
      continue; // 跳過答案索引錯誤的資料列
    } // 結束答案索引判斷

    questionBank.push({ // 將有效題目加入完整題庫
      question: questionText, // 儲存題目文字
      options: [option1, option2, option3, option4], // 儲存四個答案選項
      answer: answerIndex // 儲存正確答案索引
    }); // 結束加入題庫資料
  } // 結束題庫讀取迴圈

  if (questionBank.length < quizQuestionCount) { // 判斷題庫是否少於五題
    questionBankError = true; // 設定題庫錯誤狀態
    questionBankErrorMessage = `題庫至少需要 ${quizQuestionCount} 題，目前只有 ${questionBank.length} 題。`; // 設定題庫不足訊息
    return; // 結束題庫處理
  } // 結束題庫數量判斷

  questionBankReady = true; // 設定題庫已載入完成
  questionBankError = false; // 清除題庫錯誤狀態
  startNewQuiz(); // 從題庫隨機抽出五題
} // 結束 tableLoaded 函式

function tableLoadError(error) { // 建立 Google 試算表載入錯誤函式
  questionBankError = true; // 設定題庫錯誤狀態
  questionBankErrorMessage = "無法讀取 Google 試算表，請檢查 CSV 網址與試算表權限。"; // 設定錯誤訊息
  console.error(error); // 將詳細錯誤輸出到瀏覽器主控台
} // 結束 tableLoadError 函式

function startNewQuiz() { // 建立開始新測驗函式
  if (!questionBankReady) { // 判斷題庫是否尚未完成載入
    return; // 題庫尚未完成時停止執行
  } // 結束題庫狀態判斷

  const shuffledQuestions = shuffle(questionBank.slice(), true); // 複製並隨機打亂完整題庫
  quizData = shuffledQuestions.slice(0, quizQuestionCount); // 抽出五題不重複題目
  initializeQuizState(); // 初始化本次測驗狀態
} // 結束 startNewQuiz 函式

function initializeQuizState() { // 建立初始化測驗狀態函式
  currentQuestion = 0; // 將目前題目設定為第一題
  score = 0; // 將答對題數歸零
  quizFinished = false; // 將測驗設定為尚未完成
  selectedAnswers = Array(quizQuestionCount).fill(-1); // 初始化每題使用者答案
  answeredQuestions = Array(quizQuestionCount).fill(false); // 初始化每題作答狀態
  correctAnswers = Array(quizQuestionCount).fill(false); // 初始化每題答對狀態
} // 結束 initializeQuizState 函式

function draw() { // 建立 p5.js 每幀繪圖函式
  background(backgroundColor); // 設定畫布背景顏色
  applyCanvasFont(); // 套用目前可使用的畫布字型
  updateLayout(); // 每幀重新計算響應式版面

  if (questionBankError) { // 判斷題庫是否載入錯誤
    drawErrorScreen(); // 顯示錯誤畫面
  } else if (!questionBankReady || quizData.length === 0) { // 判斷題庫是否正在載入
    drawLoadingScreen(); // 顯示載入畫面
  } else if (quizFinished) { // 判斷測驗是否完成
    drawResultScreen(); // 顯示測驗結果畫面
  } else { // 執行正常測驗狀態
    drawQuizScreen(); // 顯示測驗題目畫面
  } // 結束畫面狀態判斷
} // 結束 draw 函式

function updateLayout() { // 建立響應式版面計算函式
  const shortSide = min(width, height); // 取得畫面短邊尺寸
  const isPortrait = height >= width; // 判斷目前是否為直向畫面
  const isPhone = shortSide < 600; // 判斷目前是否為手機尺寸
  const isVeryShort = height < 480; // 判斷目前是否為超矮畫面
  const useSingleColumn = isPhone && isPortrait; // 判斷是否使用單欄選項
  const safeX = constrain(width * 0.045, 12, 42); // 設定左右安全邊距
  const safeTop = constrain(height * 0.035, 10, 30); // 設定上方安全邊距
  const safeBottom = constrain(height * 0.035, 10, 30); // 設定下方安全邊距
  const contentWidth = min(width - safeX * 2, 960); // 計算主要內容寬度
  const titleSize = constrain(shortSide * 0.075, 22, 48); // 計算標題字級
  const numberSize = constrain(shortSide * 0.038, 15, 26); // 計算題號字級
  const questionSize = constrain(shortSide * 0.052, 18, 34); // 計算題目字級
  const optionTextSize = constrain(shortSide * 0.037, 14, 23); // 計算選項字級
  const buttonTextSize = constrain(shortSide * 0.034, 14, 22); // 計算按鈕字級
  const navigationHeight = constrain(shortSide * 0.105, 42, 58); // 計算導覽按鈕高度
  const navigationWidth = constrain(width * 0.245, 104, 190); // 計算導覽按鈕寬度
  const navigationY = height - safeBottom - navigationHeight / 2; // 計算導覽按鈕位置
  const titleY = safeTop + titleSize * 0.55; // 計算標題位置
  const numberY = titleY + titleSize * 0.9; // 計算題號位置
  const questionY = numberY + numberSize + 12; // 計算題目位置
  const questionHeight = isVeryShort ? 48 : isPhone ? 72 : 88; // 設定題目高度
  const optionStartY = questionY + questionHeight + (isVeryShort ? 8 : 18); // 計算選項起始位置
  const optionGap = constrain(shortSide * 0.022, 7, 18); // 計算選項間距
  const columnCount = useSingleColumn ? 1 : 2; // 設定選項欄數
  const rowCount = ceil(4 / columnCount); // 計算選項列數
  const columnGap = optionGap; // 設定欄位間距
  const optionWidth = columnCount === 1 ? contentWidth : (contentWidth - columnGap) / 2; // 計算選項寬度
  const availableHeight = navigationY - navigationHeight / 2 - optionStartY - 14; // 計算選項可用高度
  const idealOptionHeight = isVeryShort ? 42 : isPhone ? 54 : 66; // 設定理想選項高度
  const idealOptionTotalHeight = rowCount * idealOptionHeight + (rowCount - 1) * optionGap; // 計算理想選項總高度
  const heightScale = constrain(availableHeight / max(idealOptionTotalHeight, 1), 0.55, 1); // 計算高度縮放比例
  const optionHeight = max(40, idealOptionHeight * heightScale); // 計算最終選項高度
  const finalOptionGap = max(5, optionGap * heightScale); // 計算最終選項間距
  const finalQuestionSize = max(15, questionSize * min(1, heightScale + 0.12)); // 計算最終題目字級
  const finalOptionTextSize = max(12, optionTextSize * min(1, heightScale + 0.1)); // 計算最終選項字級

  layout = { // 建立版面資料物件
    shortSide: shortSide, // 儲存畫面短邊
    isPortrait: isPortrait, // 儲存畫面方向
    isPhone: isPhone, // 儲存手機狀態
    isVeryShort: isVeryShort, // 儲存超矮畫面狀態
    safeX: safeX, // 儲存水平安全邊距
    contentWidth: contentWidth, // 儲存主要內容寬度
    centerX: width / 2, // 儲存畫面中央水平位置
    titleSize: titleSize, // 儲存標題文字大小
    numberSize: numberSize, // 儲存題號文字大小
    questionSize: finalQuestionSize, // 儲存題目文字大小
    optionTextSize: finalOptionTextSize, // 儲存選項文字大小
    buttonTextSize: buttonTextSize, // 儲存按鈕文字大小
    titleY: titleY, // 儲存標題垂直位置
    numberY: numberY, // 儲存題號垂直位置
    questionY: questionY, // 儲存題目垂直位置
    questionHeight: questionHeight, // 儲存題目高度
    optionStartY: optionStartY, // 儲存選項起始位置
    optionWidth: optionWidth, // 儲存選項寬度
    optionHeight: optionHeight, // 儲存選項高度
    optionGap: finalOptionGap, // 儲存選項間距
    columnGap: columnGap, // 儲存欄位間距
    columnCount: columnCount, // 儲存選項欄數
    navigationY: navigationY, // 儲存導覽按鈕垂直位置
    navigationWidth: navigationWidth, // 儲存導覽按鈕寬度
    navigationHeight: navigationHeight // 儲存導覽按鈕高度
  }; // 結束版面資料物件
} // 結束 updateLayout 函式

function drawLoadingScreen() { // 建立繪製載入畫面函式
  fill(textColor); // 設定載入文字顏色
  noStroke(); // 移除文字外框
  textSize(layout.titleSize); // 設定載入標題大小
  text("正在載入 Google 試算表題庫...", layout.centerX, height / 2 - 35, layout.contentWidth, 80); // 顯示載入訊息
  textSize(layout.numberSize); // 設定載入提示大小
  text("請稍候", layout.centerX, height / 2 + 40, layout.contentWidth, 60); // 顯示載入提示
} // 結束 drawLoadingScreen 函式

function drawErrorScreen() { // 建立繪製錯誤畫面函式
  fill(wrongColor); // 設定錯誤標題顏色
  noStroke(); // 移除文字外框
  textSize(layout.titleSize); // 設定錯誤標題大小
  text("題庫載入失敗", layout.centerX, height * 0.3, layout.contentWidth, 90); // 顯示錯誤標題

  fill(textColor); // 設定錯誤訊息顏色
  textSize(layout.numberSize); // 設定錯誤訊息大小
  text(questionBankErrorMessage, layout.centerX, height * 0.48, layout.contentWidth, 150); // 顯示錯誤訊息
  text("可能原因：網址錯誤、試算表未發布、權限不足或網路連線失敗。", layout.centerX, height * 0.68, layout.contentWidth, 120); // 顯示可能原因
} // 結束 drawErrorScreen 函式

function drawQuizScreen() { // 建立繪製測驗畫面函式
  const question = quizData[currentQuestion]; // 取得目前題目資料
  const isAnswered = answeredQuestions[currentQuestion]; // 取得目前題目作答狀態

  fill(textColor); // 設定標題文字顏色
  noStroke(); // 移除文字外框
  textSize(layout.titleSize); // 設定標題文字大小
  text("p5.js 簡易指令練習測驗", layout.centerX, layout.titleY, layout.contentWidth, layout.titleSize * 1.4); // 顯示測驗標題

  textSize(layout.numberSize); // 設定題號文字大小
  text(`第 ${currentQuestion + 1} 題／共 ${quizQuestionCount} 題`, layout.centerX, layout.numberY, layout.contentWidth, layout.numberSize * 1.5); // 顯示題號

  textSize(layout.questionSize); // 設定題目文字大小
  text(question.question, layout.centerX, layout.questionY, layout.contentWidth, layout.questionHeight); // 顯示題目內容

  for (let optionIndex = 0; optionIndex < question.options.length; optionIndex++) { // 逐一處理四個選項
    const position = getOptionPosition(optionIndex); // 取得選項位置
    let optionColor = normalColor; // 設定選項預設顏色
    let bounceOffset = 0; // 設定選項預設跳動距離

    if (isAnswered) { // 判斷目前題目是否已作答
      if (optionIndex === question.answer) { // 判斷是否為正確答案
        optionColor = correctColor; // 將正確答案設定為綠色
        bounceOffset = sin(frameCount * 0.16) * min(8, height * 0.012); // 讓正確答案上下跳動
      } // 結束正確答案判斷

      if (optionIndex === selectedAnswers[currentQuestion] && !correctAnswers[currentQuestion]) { // 判斷是否為使用者錯誤答案
        optionColor = wrongColor; // 將錯誤答案設定為深紅色
      } // 結束錯誤答案判斷
    } // 結束作答狀態判斷

    drawOptionButton(question.options[optionIndex], position.x, position.y + bounceOffset, optionColor); // 繪製目前選項
  } // 結束選項迴圈

  drawNavigationButtons(); // 繪製底部導覽按鈕
} // 結束 drawQuizScreen 函式

function getOptionPosition(index) { // 建立取得選項位置函式
  const row = layout.columnCount === 1 ? index : floor(index / layout.columnCount); // 計算選項所在列
  const column = layout.columnCount === 1 ? 0 : index % layout.columnCount; // 計算選項所在欄
  const totalWidth = layout.columnCount === 1 ? layout.optionWidth : layout.optionWidth * 2 + layout.columnGap; // 計算選項總寬度
  const firstX = layout.centerX - totalWidth / 2 + layout.optionWidth / 2; // 計算第一欄水平位置
  const x = firstX + column * (layout.optionWidth + layout.columnGap); // 計算選項水平位置
  const y = layout.optionStartY + layout.optionHeight / 2 + row * (layout.optionHeight + layout.optionGap); // 計算選項垂直位置
  return { x: x, y: y }; // 回傳選項座標
} // 結束 getOptionPosition 函式

function drawOptionButton(label, x, y, colorValue) { // 建立繪製選項按鈕函式
  fill(colorValue); // 設定選項背景顏色
  stroke(borderColor); // 設定選項外框顏色
  strokeWeight(2); // 設定選項外框粗細
  rect(x, y, layout.optionWidth, layout.optionHeight, 10); // 繪製圓角選項按鈕
  fill("#ffffff"); // 設定選項文字顏色
  noStroke(); // 移除文字外框
  textSize(layout.optionTextSize); // 設定選項文字大小
  text(label, x, y, layout.optionWidth * 0.88, layout.optionHeight * 0.82); // 顯示選項文字
} // 結束 drawOptionButton 函式

function drawNavigationButtons() { // 建立繪製導覽按鈕函式
  const sideMargin = max(10, layout.safeX * 0.65); // 設定導覽按鈕安全邊距
  const previousX = sideMargin + layout.navigationWidth / 2; // 計算上一題水平位置
  const nextX = width - sideMargin - layout.navigationWidth / 2; // 計算下一題水平位置
  const previousDisabled = currentQuestion === 0; // 判斷上一題是否停用
  const nextDisabled = !answeredQuestions[currentQuestion]; // 判斷下一題是否停用
  const nextLabel = currentQuestion === quizQuestionCount - 1 ? "完成測驗" : "下一題"; // 設定下一題按鈕文字

  drawNavigationButton("上一題", previousX, layout.navigationY, previousDisabled); // 繪製上一題按鈕
  drawNavigationButton(nextLabel, nextX, layout.navigationY, nextDisabled); // 繪製下一題按鈕

  layout.previousButton = { x: previousX, y: layout.navigationY, width: layout.navigationWidth, height: layout.navigationHeight }; // 儲存上一題按鈕資料
  layout.nextButton = { x: nextX, y: layout.navigationY, width: layout.navigationWidth, height: layout.navigationHeight }; // 儲存下一題按鈕資料
} // 結束 drawNavigationButtons 函式

function drawNavigationButton(label, x, y, disabled) { // 建立繪製導覽按鈕函式
  fill(disabled ? disabledColor : borderColor); // 依按鈕狀態設定背景顏色
  stroke(borderColor); // 設定按鈕外框顏色
  strokeWeight(2); // 設定按鈕外框粗細
  rect(x, y, layout.navigationWidth, layout.navigationHeight, 9); // 繪製圓角導覽按鈕
  fill("#ffffff"); // 設定導覽文字顏色
  noStroke(); // 移除文字外框
  textSize(layout.buttonTextSize); // 設定導覽文字大小
  text(label, x, y, layout.navigationWidth * 0.88, layout.navigationHeight * 0.75); // 顯示導覽文字
} // 結束 drawNavigationButton 函式

function drawResultScreen() { // 建立繪製結果畫面函式
  const compact = height < 520; // 判斷是否為矮畫面
  const titleSize = constrain(min(width, height) * 0.08, 26, 58); // 計算結果標題大小
  const scoreSize = constrain(min(width, height) * 0.065, 23, 48); // 計算結果分數大小
  const messageSize = constrain(min(width, height) * 0.04, 15, 28); // 計算評語文字大小
  const titleY = compact ? height * 0.16 : height * 0.25; // 計算標題垂直位置
  const scoreY = compact ? height * 0.34 : height * 0.43; // 計算分數垂直位置
  const messageY = compact ? height * 0.5 : height * 0.56; // 計算評語垂直位置
  const restartY = compact ? height * 0.78 : height * 0.72; // 計算重新開始按鈕位置
  const restartWidth = min(width * 0.58, 280); // 計算重新開始按鈕寬度
  const restartHeight = constrain(min(width, height) * 0.115, 46, 62); // 計算重新開始按鈕高度

  fill(textColor); // 設定標題顏色
  noStroke(); // 移除文字外框
  textSize(titleSize); // 設定標題大小
  text("測驗完成！", layout.centerX, titleY, width * 0.9, titleSize * 1.5); // 顯示結果標題

  fill(correctColor); // 設定分數顏色
  textSize(scoreSize); // 設定分數大小
  text(`你答對了 ${score}／${quizQuestionCount} 題`, layout.centerX, scoreY, width * 0.9, scoreSize * 1.5); // 顯示答對題數

  fill(textColor); // 設定評語顏色
  textSize(messageSize); // 設定評語大小

  if (score === quizQuestionCount) { // 判斷是否全部答對
    text("太棒了！全部答對！", layout.centerX, messageY, width * 0.88, 60); // 顯示滿分評語
  } else if (score >= 3) { // 判斷是否答對三題以上
    text("表現很好，繼續練習會更熟悉！", layout.centerX, messageY, width * 0.88, 70); // 顯示良好評語
  } else { // 執行答對題數低於三題的情況
    text("再多練習幾次，就會越來越熟悉！", layout.centerX, messageY, width * 0.88, 70); // 顯示鼓勵評語
  } // 結束評語判斷

  fill(borderColor); // 設定重新開始按鈕背景顏色
  stroke(borderColor); // 設定重新開始按鈕外框顏色
  strokeWeight(2); // 設定重新開始按鈕外框粗細
  rect(layout.centerX, restartY, restartWidth, restartHeight, 10); // 繪製重新開始按鈕
  fill("#ffffff"); // 設定重新開始文字顏色
  noStroke(); // 移除文字外框
  textSize(messageSize); // 設定重新開始文字大小
  text("重新開始", layout.centerX, restartY, restartWidth * 0.85, restartHeight * 0.75); // 顯示重新開始文字
  layout.restartButton = { x: layout.centerX, y: restartY, width: restartWidth, height: restartHeight }; // 儲存重新開始按鈕資料
} // 結束 drawResultScreen 函式

function mousePressed() { // 建立滑鼠按下事件函式
  handleInput(mouseX, mouseY); // 將滑鼠座標交給共用輸入函式
} // 結束 mousePressed 函式

function touchStarted() { // 建立觸控開始事件函式
  if (touches.length > 0) { // 判斷是否存在觸控資料
    handleInput(touches[0].x, touches[0].y); // 將觸控座標交給共用輸入函式
  } // 結束觸控資料判斷
  return false; // 防止瀏覽器滑動與重複觸發
} // 結束 touchStarted 函式

function handleInput(inputX, inputY) { // 建立滑鼠與觸控共用輸入函式
  const now = millis(); // 取得目前時間
  const distance = dist(inputX, inputY, lastInputX, lastInputY); // 計算輸入座標距離

  if (now - lastInputTime < 400 && distance < 30) { // 判斷是否為重複輸入
    return; // 忽略重複輸入事件
  } // 結束重複輸入判斷

  lastInputTime = now; // 儲存本次輸入時間
  lastInputX = inputX; // 儲存本次輸入水平位置
  lastInputY = inputY; // 儲存本次輸入垂直位置

  if (questionBankError || !questionBankReady || quizData.length === 0) { // 判斷是否尚未進入測驗
    return; // 載入或錯誤狀態不處理輸入
  } // 結束載入狀態判斷

  if (quizFinished) { // 判斷測驗是否已完成
    const button = layout.restartButton; // 取得重新開始按鈕資料

    if (button && isInsideButton(inputX, inputY, button.x, button.y, button.width, button.height)) { // 判斷是否點擊重新開始
      startNewQuiz(); // 重新隨機抽取五題
    } // 結束重新開始判斷

    return; // 結束結果畫面輸入處理
  } // 結束測驗完成判斷

  const question = quizData[currentQuestion]; // 取得目前題目資料

  if (!answeredQuestions[currentQuestion]) { // 判斷目前題目是否尚未作答
    for (let optionIndex = 0; optionIndex < question.options.length; optionIndex++) { // 逐一檢查四個選項
      const position = getOptionPosition(optionIndex); // 取得目前選項位置

      if (isInsideButton(inputX, inputY, position.x, position.y, layout.optionWidth, layout.optionHeight)) { // 判斷是否點擊目前選項
        selectedAnswers[currentQuestion] = optionIndex; // 記錄使用者選擇的選項
        answeredQuestions[currentQuestion] = true; // 設定目前題目已作答
        correctAnswers[currentQuestion] = optionIndex === question.answer; // 判斷答案是否正確

        if (correctAnswers[currentQuestion]) { // 判斷使用者是否答對
          score++; // 增加答對題數
        } // 結束答對判斷

        return; // 結束本次輸入處理
      } // 結束選項點擊判斷
    } // 結束選項檢查迴圈
  } // 結束尚未作答判斷

  const sideMargin = max(10, layout.safeX * 0.65); // 設定導覽按鈕邊距
  const previousX = sideMargin + layout.navigationWidth / 2; // 計算上一題按鈕水平位置
  const nextX = width - sideMargin - layout.navigationWidth / 2; // 計算下一題按鈕水平位置

  if (currentQuestion > 0 && isInsideButton(inputX, inputY, previousX, layout.navigationY, layout.navigationWidth, layout.navigationHeight)) { // 判斷是否點擊上一題
    currentQuestion--; // 回到上一題
    return; // 結束本次輸入處理
  } // 結束上一題判斷

  if (answeredQuestions[currentQuestion] && isInsideButton(inputX, inputY, nextX, layout.navigationY, layout.navigationWidth, layout.navigationHeight)) { // 判斷是否點擊下一題
    if (currentQuestion === quizQuestionCount - 1) { // 判斷是否為最後一題
      quizFinished = true; // 將測驗設定為完成
    } else { // 執行尚未到最後一題的情況
      currentQuestion++; // 前往下一題
    } // 結束最後一題判斷
  } // 結束下一題判斷
} // 結束 handleInput 函式

function isInsideButton(pointX, pointY, buttonX, buttonY, buttonWidth, buttonHeight) { // 建立按鈕範圍判斷函式
  const left = buttonX - buttonWidth / 2; // 計算按鈕左邊界
  const right = buttonX + buttonWidth / 2; // 計算按鈕右邊界
  const top = buttonY - buttonHeight / 2; // 計算按鈕上邊界
  const bottom = buttonY + buttonHeight / 2; // 計算按鈕下邊界
  return pointX >= left && pointX <= right && pointY >= top && pointY <= bottom; // 回傳座標是否在按鈕內
} // 結束 isInsideButton 函式

function keyPressed() { // 建立鍵盤按下事件函式
  if (key === "f" || key === "F") { // 判斷是否按下 F 鍵
    fullscreen(!fullscreen()); // 切換全螢幕狀態
  } // 結束全螢幕切換判斷
} // 結束 keyPressed 函式

function windowResized() { // 建立視窗大小改變函式
  resizeCanvas(windowWidth, windowHeight); // 重新調整畫布尺寸
  updateLayout(); // 重新計算響應式版面
} // 結束 windowResized 函式