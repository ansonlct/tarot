const majorSeeds = [
  { zh: '愚者', en: 'The Fool', light: '新的開始、自由、冒險、信任', shadow: '衝動、準備不足、逃避責任、風險失衡', advice: '帶著好奇跨出第一步，允許未知成為可能', warning: '先確認安全邊界與基本準備，避免把自由變成魯莽' },
  { zh: '魔術師', en: 'The Magician', light: '意志、資源、行動、創造力', shadow: '操控、分心、資源未整合、言行不一', advice: '你已有可運用的工具，關鍵在於聚焦並實際開始', warning: '不要只靠話術或表面技巧，應把能力落到可驗證的行動' },
  { zh: '女祭司', en: 'The High Priestess', light: '直覺、內在知識、觀察、秘密', shadow: '資訊封閉、忽略直覺、猜疑、過度被動', advice: '答案未必需要立刻公開，先觀察細節與自己的內在反應', warning: '避免用想像填補資訊空白，該確認的事仍要確認' },
  { zh: '皇后', en: 'The Empress', light: '滋養、豐盛、創造、感受', shadow: '過度付出、依賴、停滯、自我忽略', advice: '讓事情在穩定照顧與持續投入中成熟', warning: '照顧他人前也要保留自己的資源與界線' },
  { zh: '皇帝', en: 'The Emperor', light: '秩序、責任、結構、穩定', shadow: '控制僵化、權威衝突、固執、壓迫', advice: '建立明確標準、承諾與可持續的結構', warning: '規則是為了支持目標，不是為了證明誰掌控一切' },
  { zh: '教皇', en: 'The Hierophant', light: '傳統、制度、學習、價值觀', shadow: '打破常規、教條、價值衝突、盲從', advice: '參考可靠經驗、制度或前人智慧，再形成自己的判斷', warning: '尊重規範但不要失去獨立思考' },
  { zh: '戀人', en: 'The Lovers', light: '連結、選擇、價值一致、吸引', shadow: '失衡、選擇困難、價值衝突、關係疏離', advice: '重要的不只是喜歡，而是雙方是否願意在價值與選擇上靠近', warning: '不要用短暫吸引掩蓋真正的分歧' },
  { zh: '戰車', en: 'The Chariot', light: '推進、意志、自律、勝利', shadow: '失控、方向分裂、急躁、阻力', advice: '把分散的力量拉回同一方向，以紀律推進', warning: '速度不是唯一目標，方向錯了時應先修正' },
  { zh: '力量', en: 'Strength', light: '勇氣、耐性、溫柔的力量、自信', shadow: '自我懷疑、壓抑、失去耐性、逞強', advice: '真正的力量來自穩定情緒與柔韌地處理壓力', warning: '不要把忍耐誤當成無限承受，也不要靠強硬掩蓋不安' },
  { zh: '隱者', en: 'The Hermit', light: '內省、獨處、尋找答案、智慧', shadow: '孤立、逃避、封閉、迷失', advice: '暫時減少外界噪音，讓自己的判斷重新清晰', warning: '獨處應帶來理解，而不是變成逃避溝通' },
  { zh: '命運之輪', en: 'Wheel of Fortune', light: '轉機、週期、變化、機會', shadow: '延遲、反覆、失控感、抗拒變化', advice: '局勢正在轉動，抓住可控的部分並為變化留彈性', warning: '不要把所有結果都歸因於運氣，仍需準備與回應' },
  { zh: '正義', en: 'Justice', light: '公平、因果、理性、責任', shadow: '偏見、失衡、逃避責任、不公平', advice: '回到事實、標準與長期後果，做能承擔的選擇', warning: '避免只挑對自己有利的資訊，也別忽略契約與責任' },
  { zh: '吊人', en: 'The Hanged Man', light: '暫停、換角度、放下、等待', shadow: '拖延、犧牲失衡、卡住、拒絕改觀', advice: '現在的突破可能不是更用力，而是先改變看事情的方式', warning: '不要為了維持現狀而無限期等待' },
  { zh: '死神', en: 'Death', light: '結束、轉化、釋放、更新', shadow: '抗拒結束、拖延轉變、執著、停滯', advice: '某個階段需要被完整放下，才能為新的結構騰出空間', warning: '不要把必要的結束解讀成全面失敗，也別反覆抓住已失效的模式' },
  { zh: '節制', en: 'Temperance', light: '平衡、整合、節奏、協調', shadow: '失衡、過量、節奏混亂、難以整合', advice: '透過小幅調整與持續協調，事情會逐步回到穩定', warning: '避免極端做法與一次性用力過猛' },
  { zh: '惡魔', en: 'The Devil', light: '慾望、依附、誘惑、束縛', shadow: '看見束縛、戒除、重新選擇、脫離依賴', advice: '先誠實辨認自己被什麼需求、恐懼或利益綁住', warning: '警惕把依賴合理化，也不要用短期快感交換長期自主' },
  { zh: '高塔', en: 'The Tower', light: '突變、真相揭露、舊結構瓦解、震盪', shadow: '避免不了的調整、延後崩解、內在震盪、抗拒真相', advice: '當舊結構已不穩，及早面對真相會比維持表面安全更有利', warning: '劇烈變化時先處理安全與核心資源，不宜衝動擴大損失' },
  { zh: '星星', en: 'The Star', light: '希望、療癒、信任、願景', shadow: '失望、信心不足、理想脫離現實、耗竭', advice: '在現實可行的步驟中重建希望，讓長期方向重新可見', warning: '希望需要行動支持，不能只靠期待' },
  { zh: '月亮', en: 'The Moon', light: '不確定、直覺、潛意識、迷霧', shadow: '迷霧散去、真相浮現、焦慮、錯誤想像', advice: '目前資訊可能不完整，先區分事實、感受與推測', warning: '不要因恐懼自行補完故事，也不宜在資訊模糊時做不可逆決定' },
  { zh: '太陽', en: 'The Sun', light: '清晰、喜悅、成功、活力', shadow: '延遲的喜悅、過度樂觀、疲憊、期待落差', advice: '把優勢公開化、具體化，讓好的局勢轉成可持續成果', warning: '樂觀仍需細節與節奏，避免因順利而忽略風險' },
  { zh: '審判', en: 'Judgement', light: '覺醒、回顧、決定、重新出發', shadow: '自我否定、逃避召喚、遲疑、舊事纏繞', advice: '回顧經驗後做出清楚決定，不再用過去限制下一步', warning: '不要只反覆評價自己，重點是從經驗中形成新的行動' },
  { zh: '世界', en: 'The World', light: '完成、整合、里程碑、圓滿', shadow: '未完成、延誤、缺最後一步、封閉循環', advice: '一個階段接近完整，適合收尾、整合並準備下一輪', warning: '不要因快完成而忽略最後的驗收與交接' },
];

const suitSeeds = {
  wands: { zh: '權杖', en: 'Wands', light: '行動、熱情、創意、推進', shadow: '衝動、耗竭、競爭、方向不穩', advice: '把能量投入可執行的目標', warning: '留意過度用力與急於證明自己' },
  cups: { zh: '聖杯', en: 'Cups', light: '感受、關係、連結、直覺', shadow: '情緒波動、依戀、失落、界線模糊', advice: '理解感受並建立真誠交流', warning: '避免只依賴情緒推測他人意圖' },
  swords: { zh: '寶劍', en: 'Swords', light: '思考、溝通、決策、真相', shadow: '焦慮、衝突、過度思考、言語傷害', advice: '用清晰資訊與理性溝通處理問題', warning: '避免讓腦內推演取代實際確認' },
  pentacles: { zh: '錢幣', en: 'Pentacles', light: '資源、金錢、工作、穩定', shadow: '匱乏、停滯、物質壓力、投入失衡', advice: '以現實條件、長期價值與可持續投入為準', warning: '注意成本、時間與身體負荷是否超出承受範圍' },
};

const rankSeeds = [
  { key: 'ace', zh: '一', en: 'Ace', light: '起點、機會、種子', shadow: '尚未落地、機會延遲', motion: '新的可能正在出現' },
  { key: '2', zh: '二', en: 'Two', light: '平衡、選擇、互動', shadow: '搖擺、失衡、難以協調', motion: '需要在兩個方向之間建立關係' },
  { key: '3', zh: '三', en: 'Three', light: '擴張、合作、初步成果', shadow: '合作不順、進展分散、期待落差', motion: '事情開始從個人走向協作與發展' },
  { key: '4', zh: '四', en: 'Four', light: '穩定、基礎、停留', shadow: '僵化、停滯、保守過度', motion: '需要穩住基礎並確認安全感' },
  { key: '5', zh: '五', en: 'Five', light: '摩擦、考驗、變動', shadow: '內耗、避免衝突、困局延長', motion: '差異與壓力迫使你重新調整策略' },
  { key: '6', zh: '六', en: 'Six', light: '修復、交流、推進', shadow: '過去牽制、回報失衡、進度延後', motion: '局勢有機會從壓力走向較順暢的流動' },
  { key: '7', zh: '七', en: 'Seven', light: '評估、堅持、策略', shadow: '猶豫、分散、策略失效', motion: '需要評估資源並選擇值得堅持的方向' },
  { key: '8', zh: '八', en: 'Eight', light: '速度、專注、組織', shadow: '阻塞、急躁、重複困住', motion: '事情進入需要更集中與有效率處理的階段' },
  { key: '9', zh: '九', en: 'Nine', light: '成熟、韌性、接近完成', shadow: '疲憊、防衛過強、焦慮累積', motion: '已接近關鍵節點，考驗在於如何守住成果' },
  { key: '10', zh: '十', en: 'Ten', light: '完成、責任、累積', shadow: '過載、收尾困難、負擔過重', motion: '累積已到需要收尾、分配與重新整理的程度' },
  { key: 'page', zh: '侍者', en: 'Page', light: '學習、訊息、好奇、嘗試', shadow: '不成熟、消息延誤、缺乏經驗', motion: '以學習者姿態接觸新的資訊與可能' },
  { key: 'knight', zh: '騎士', en: 'Knight', light: '推進、追求、任務、動力', shadow: '魯莽、延誤、節奏失控', motion: '有一股明確力量推動事情向前' },
  { key: 'queen', zh: '皇后', en: 'Queen', light: '內在掌握、成熟、照顧、判斷', shadow: '情緒或資源失衡、過度內耗、自我忽略', motion: '以成熟內在標準管理這個領域' },
  { key: 'king', zh: '國王', en: 'King', light: '掌控、領導、成果、責任', shadow: '控制過強、僵化、濫用資源', motion: '需要以長期責任與成熟判斷主導局面' },
];


const sentence = (...parts) => parts.filter(Boolean).join('；') + '。';
const splitTerms = (value) => value.split('、').map((v) => v.trim()).filter(Boolean);

function makeCardBase({ id, zh, en, suit, type, light, shadow, advice, warning, motion = '' }) {
  const uprightKeywords = splitTerms(light).slice(0, 5);
  const reversedKeywords = splitTerms(shadow).slice(0, 5);
  const subject = type === 'Major' ? `${zh}所代表的核心原型` : `${zh}在${suit}領域呈現的課題`;
  const generalUpright = sentence(
    `${subject}偏向「${light}」`,
    `${motion || '事情正在形成一個可被看見的發展方向'}，此時適合先辨認真正重要的資源與選擇`,
    `正位不是保證結果，而是表示這些特質目前較容易被建設性地運用`
  );
  const generalReversed = sentence(
    `${subject}轉為「${shadow}」的表現`,
    `逆位常表示能量受阻、過度、延遲或內化，需要先找出失衡發生在哪一層`,
    `它不必然等於壞結果，更像提醒你改變使用這股能量的方法`
  );
  const loveUpright = sentence(
    `放在感情問題中，${zh}正位強調${light}`,
    `關係品質取決於雙方是否能把感受、期待與實際行動對齊`,
    `若是單身，這張牌也可指向你正在建立更清楚的擇偶標準與互動方式`
  );
  const loveReversed = sentence(
    `感情面向的${zh}逆位提醒${shadow}`,
    `容易出現期待不一致、訊息解讀偏差或投入比例失衡`,
    `先確認事實與界線，再決定要靠近、等待或調整關係`
  );
  const careerUpright = sentence(
    `事業上，${zh}正位可轉化為${light}`,
    `適合把焦點放在可驗證的成果、合作方式與下一個具體里程碑`,
    `若正處於轉職或升遷考量，應比較長期成長而不只看眼前情緒`
  );
  const careerReversed = sentence(
    `工作層面的${zh}逆位呈現${shadow}`,
    `可能是流程、權責、溝通或自身節奏出了偏差`,
    `先處理造成卡點的具體因素，再判斷是否需要換環境或換策略`
  );
  const financeUpright = sentence(
    `財務上，${zh}正位把重點放在${light}`,
    `較適合依預算、現金流、風險承受度與實際資料行動`,
    `牌面只提供反思方向，不構成任何投資建議或獲利保證`
  );
  const financeReversed = sentence(
    `財運問題中的${zh}逆位提醒${shadow}`,
    `應特別檢查支出、合約、風險集中與過度樂觀或悲觀的判斷`,
    `涉及投資時仍應依可靠資料及合資格專業意見決策`
  );
  const lifeUpright = sentence(
    `人生方向上，${zh}正位邀請你運用${light}`,
    `目前較重要的是把抽象感受轉成可以實踐的小步驟`,
    `持續觀察回饋，比追求一次就得到確定答案更有幫助`
  );
  const lifeReversed = sentence(
    `人生層面的${zh}逆位顯示${shadow}`,
    `這常是重新校正價值、節奏與界線的訊號`,
    `先縮小問題、處理可控制部分，再看整體方向會更清楚`
  );
  return {
    id, zhName: zh, enName: en, suit, type,
    image: `./assets/cards/${id}.svg`,
    uprightKeywords, reversedKeywords,
    generalUpright, generalReversed,
    loveUpright, loveReversed,
    careerUpright, careerReversed,
    financeUpright, financeReversed,
    lifeUpright, lifeReversed,
    advice: sentence(advice, `把「${uprightKeywords[0]}」轉成一項今天可以完成的小行動`),
    warning: sentence(warning, `若你發現自己反覆卡在「${reversedKeywords[0]}」，應先降低風險再繼續`),
    action: sentence(`先寫下你現在能控制與不能控制的部分`, `以「${uprightKeywords.slice(0,2).join('、')}」為原則選一個具體下一步，完成後再依回饋調整`),
    emotion: sentence(`${zh}在心理層面會放大你對「${uprightKeywords.slice(0,2).join('、')}」的感受`, `逆位時則要留意${reversedKeywords.slice(0,2).join('、')}是否影響判斷`),
    relationship: sentence(`在人際互動中，這張牌要求你觀察付出、回應與界線是否一致`, `正位有利於以${uprightKeywords[0]}建立連結；逆位則需先處理${reversedKeywords[0]}`),
    timing: sentence(`${motion || '發展會隨你的選擇逐步成形'}`, `正位通常表示能量較順暢，逆位則較可能經歷延遲、反覆或先內部調整再外顯`)
  };
}

const majors = majorSeeds.map((seed, index) => makeCardBase({
  id: `major-${String(index).padStart(2,'0')}`,
  zh: seed.zh, en: seed.en, suit: '大阿爾克那', type: 'Major',
  light: seed.light, shadow: seed.shadow, advice: seed.advice, warning: seed.warning,
  motion: `這個原型會把問題拉到更核心的價值與人生階段來看`
}));

const minors = Object.entries(suitSeeds).flatMap(([suitKey, suit]) => rankSeeds.map((rank) => {
  const zhName = `${suit.zh}${rank.zh}`;
  return makeCardBase({
    id: `${suitKey}-${rank.key}`,
    zh: zhName, en: `${rank.en} of ${suit.en}`, suit: suit.zh, type: 'Minor',
    light: `${rank.light}、${suit.light}`,
    shadow: `${rank.shadow}、${suit.shadow}`,
    advice: `${rank.motion}；${suit.advice}`,
    warning: `${suit.warning}；同時避免${rank.shadow}`,
    motion: `${rank.motion}，而${suit.zh}把焦點落在${suit.light}`
  });
}));

export const tarotCards = [...majors, ...minors];
export const cardById = Object.fromEntries(tarotCards.map((card) => [card.id, card]));
export const cardByZhName = Object.fromEntries(tarotCards.map((card) => [card.zhName, card]));
export const tarotMeta = { total: tarotCards.length, majors: majors.length, minors: minors.length };
