export const spreads = [
  {
    id: 'one-guidance', name: '今日指引／快速占卜', shortName: '一張牌', count: 1,
    description: '聚焦一個最重要的訊息，適合快速整理今日方向或單一問題。',
    positions: [
      { id: 'guidance', name: '核心指引', role: '核心', prompt: '這張牌描述此刻最值得關注的能量與下一步。' }
    ]
  },
  {
    id: 'three-timeline', name: '過去／現在／未來', shortName: '三張牌', count: 3,
    description: '查看事件如何形成、目前重點，以及照現況發展時較可能走向哪裡。',
    positions: [
      { id: 'past', name: '過去', role: '背景', prompt: '形成目前局面的背景、慣性或已發生的影響。' },
      { id: 'present', name: '現在', role: '核心', prompt: '現階段最明顯的狀態、課題與可用資源。' },
      { id: 'future', name: '未來', role: '發展', prompt: '若主要條件不變，接下來較可能出現的發展方向。' }
    ]
  },
  {
    id: 'three-block', name: '現況／阻礙／建議', shortName: '三張牌', count: 3,
    description: '適合卡關、選擇與需要具體下一步的問題。',
    positions: [
      { id: 'situation', name: '現況', role: '核心', prompt: '目前真正發生的事與最主要能量。' },
      { id: 'obstacle', name: '阻礙', role: '阻礙', prompt: '造成延遲、誤判、壓力或內耗的因素。' },
      { id: 'advice', name: '建議', role: '行動', prompt: '最值得採取的態度、策略或可執行下一步。' }
    ]
  },
  {
    id: 'five-insight', name: '五牌深度解析', shortName: '五張牌', count: 5,
    description: '把現況、顯性與隱性因素、建議及潛在結果放在同一個脈絡理解。',
    positions: [
      { id: 'situation', name: '現況', role: '核心', prompt: '問題目前的主要狀態與焦點。' },
      { id: 'factor', name: '關鍵因素', role: '推力', prompt: '最直接影響局勢的條件、資源或人物互動。' },
      { id: 'hidden', name: '隱藏因素', role: '隱性', prompt: '尚未被充分看見，但正在影響判斷或發展的部分。' },
      { id: 'advice', name: '建議', role: '行動', prompt: '較有建設性的態度、界線與具體處理方式。' },
      { id: 'outcome', name: '潛在結果', role: '發展', prompt: '在目前條件與建議被納入後，較可能形成的方向。' }
    ]
  }
];

export const spreadById = Object.fromEntries(spreads.map((spread) => [spread.id, spread]));
