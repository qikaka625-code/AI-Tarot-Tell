import { CardData, SpreadDef, Suit, Language } from './types';

export const TRANSLATIONS = {
  [Language.CN]: {
    title: "MYSTIC AETHER",
    start: "点击开始",
    shuffling: "洗牌中...",
    reveal: "揭示命运",
    fullAnalysis: "全盘解读",
    analyzing: "分析星象中...",
    fateReport: "命运报告",
    keywords: "关键词",
    interpretation: "解读",
    upright: "正位",
    reversed: "逆位",
    selectSpread: "选择牌阵",
    changeSpread: "切换牌阵",
    systemInit: "系统初始化...",
    connectError: "连接错误"
  },
  [Language.VN]: {
    title: "HUYỀN BÍ AETHER",
    start: "BẮT ĐẦU",
    shuffling: "Đang xáo bài...",
    reveal: "Lật Bài",
    fullAnalysis: "Giải Bài Chi Tiết",
    analyzing: "Đang phân tích...",
    fateReport: "Báo Cáo Định Mệnh",
    keywords: "Từ khóa",
    interpretation: "Luận giải",
    upright: "Xuôi",
    reversed: "Ngược",
    selectSpread: "Chọn Trải Bài",
    changeSpread: "Đổi Trải Bài",
    systemInit: "Đang khởi tạo...",
    connectError: "Lỗi kết nối"
  }
};

export const SUIT_NAMES = {
  [Suit.MAJOR]: { [Language.CN]: "大阿卡纳", [Language.VN]: "Bộ Ẩn Chính" },
  [Suit.WANDS]: { [Language.CN]: "权杖", [Language.VN]: "Gậy" },
  [Suit.CUPS]: { [Language.CN]: "圣杯", [Language.VN]: "Ly" },
  [Suit.SWORDS]: { [Language.CN]: "宝剑", [Language.VN]: "Kiếm" },
  [Suit.PENTACLES]: { [Language.CN]: "星币", [Language.VN]: "Tiền" }
};

// Helper to generate Minor Arcana with bi-lingual support
const generateMinorSuit = (suit: Suit, startId: number): CardData[] => {
  const cnNames = ['一', '二', '三', '四', '五', '六', '七', '八', '九', '十', '侍从', '骑士', '王后', '国王'];
  const vnNames = ['Ách', 'Hai', 'Ba', 'Bốn', 'Năm', 'Sáu', 'Bảy', 'Tám', 'Chín', 'Mười', 'Tiểu Đồng', 'Hiệp Sĩ', 'Nữ Hoàng', 'Vua'];
  
  const suitCn = SUIT_NAMES[suit][Language.CN];
  const suitVn = SUIT_NAMES[suit][Language.VN];

  return cnNames.map((cnName, i) => ({
    id: startId + i,
    suit: suit,
    number: i + 1,
    name_cn: `${suitCn}${cnName}`,
    name_vn: `${vnNames[i]} ${suitVn}`,
    keywords_cn: [`${suitCn}能量`, cnName, '经典含义'],
    keywords_vn: [`Năng lượng ${suitVn}`, vnNames[i], 'Ý nghĩa cổ điển'],
    meaning_upright_cn: `${suitCn}${cnName}代表了该元素在此阶段的本质，象征着行动与显化。`,
    meaning_upright_vn: `${vnNames[i]} ${suitVn} đại diện cho bản chất của nguyên tố ở giai đoạn này, tượng trưng cho hành động và biểu hiện.`,
    meaning_reversed_cn: `逆位的${suitCn}${cnName}暗示了某种阻碍或内在的挣扎。`,
    meaning_reversed_vn: `${vnNames[i]} ${suitVn} ngược ám chỉ sự cản trở hoặc đấu tranh nội tâm.`
  }));
};

export const MAJOR_ARCANA: CardData[] = [
  { 
    id: 0, suit: Suit.MAJOR, number: 0, 
    name_cn: "愚人", name_vn: "Chàng Khờ",
    keywords_cn: ["新的开始", "纯真", "自发性"], keywords_vn: ["Khởi đầu mới", "Ngây thơ", "Tự phát"],
    meaning_upright_cn: "新的开始，天真烂漫，自发性，自由的灵魂，踏上未知的旅程。", meaning_upright_vn: "Khởi đầu mới, sự ngây thơ, tự phát, tâm hồn tự do, bước vào hành trình chưa biết.",
    meaning_reversed_cn: "鲁莽，冒险，轻率，愚蠢的决定。", meaning_reversed_vn: "Liều lĩnh, mạo hiểm, khinh suất, quyết định ngu ngốc."
  },
  { 
    id: 1, suit: Suit.MAJOR, number: 1, 
    name_cn: "魔术师", name_vn: "Ảo Thuật Gia",
    keywords_cn: ["显化", "力量", "行动"], keywords_vn: ["Biểu hiện", "Sức mạnh", "Hành động"],
    meaning_upright_cn: "力量，技巧，专注，行动，足智多谋，将梦想化为现实。", meaning_upright_vn: "Sức mạnh, kỹ năng, tập trung, hành động, tháo vát, biến ước mơ thành hiện thực.",
    meaning_reversed_cn: "操纵，计划不周，潜能未被发掘。", meaning_reversed_vn: "Thao túng, kế hoạch kém, tiềm năng chưa được khai phá."
  },
  { 
    id: 2, suit: Suit.MAJOR, number: 2, 
    name_cn: "女祭司", name_vn: "Nữ Tu Tế",
    keywords_cn: ["直觉", "潜意识", "内在声音"], keywords_vn: ["Trực giác", "Tiềm thức", "Tiếng nói nội tâm"],
    meaning_upright_cn: "直觉，神圣的女性力量，神秘，潜意识，倾听内在的声音。", meaning_upright_vn: "Trực giác, nữ tính thiêng liêng, bí ẩn, tiềm thức, lắng nghe tiếng nói nội tâm.",
    meaning_reversed_cn: "隐藏的动机，忽视直觉，肤浅。", meaning_reversed_vn: "Động cơ tiềm ẩn, phớt lờ trực giác, hời hợt."
  },
  { 
    id: 3, suit: Suit.MAJOR, number: 3, 
    name_cn: "皇后", name_vn: "Hoàng Hậu",
    keywords_cn: ["丰饶", "女性力量", "自然"], keywords_vn: ["Sung túc", "Nữ tính", "Thiên nhiên"],
    meaning_upright_cn: "丰饶，女性特质，美，自然，富足，母性的关怀。", meaning_upright_vn: "Sự sung túc, nữ tính, vẻ đẹp, thiên nhiên, giàu có, sự chăm sóc của người mẹ.",
    meaning_reversed_cn: "创造力受阻，过度依赖。", meaning_reversed_vn: "Sáng tạo bị chặn, phụ thuộc quá mức."
  },
  { 
    id: 4, suit: Suit.MAJOR, number: 4, 
    name_cn: "皇帝", name_vn: "Hoàng Đế",
    keywords_cn: ["权威", "结构", "控制"], keywords_vn: ["Quyền lực", "Cấu trúc", "Kiểm soát"],
    meaning_upright_cn: "权威，父亲形象，结构，稳固的基础，领导力。", meaning_upright_vn: "Quyền lực, hình tượng người cha, cấu trúc, nền tảng vững chắc, khả năng lãnh đạo.",
    meaning_reversed_cn: "支配，过度控制，缺乏纪律，僵化。", meaning_reversed_vn: "Thống trị, kiểm soát quá mức, thiếu kỷ luật, cứng nhắc."
  },
  { 
    id: 5, suit: Suit.MAJOR, number: 5, 
    name_cn: "教皇", name_vn: "Giáo Hoàng",
    keywords_cn: ["传统", "从众", "道德"], keywords_vn: ["Truyền thống", "Tuân thủ", "Đạo đức"],
    meaning_upright_cn: "宗教，群体认同，从众，传统，信仰，精神指引。", meaning_upright_vn: "Tôn giáo, sự phù hợp, truyền thống, niềm tin, hướng dẫn tinh thần.",
    meaning_reversed_cn: "束缚，挑战现状，非传统的信仰。", meaning_reversed_vn: "Ràng buộc, thách thức hiện trạng, niềm tin phi truyền thống."
  },
  { 
    id: 6, suit: Suit.MAJOR, number: 6, 
    name_cn: "恋人", name_vn: "Tình Nhân",
    keywords_cn: ["爱", "结合", "选择"], keywords_vn: ["Tình yêu", "Kết hợp", "Lựa chọn"],
    meaning_upright_cn: "爱，结合，关系，价值观的契合，人生路口的抉择。", meaning_upright_vn: "Tình yêu, sự kết hợp, mối quan hệ, sự hòa hợp giá trị, lựa chọn ngã rẽ cuộc đời.",
    meaning_reversed_cn: "不和谐，失衡，价值观冲突。", meaning_reversed_vn: "Bất hòa, mất cân bằng, xung đột giá trị."
  },
  { 
    id: 7, suit: Suit.MAJOR, number: 7, 
    name_cn: "战车", name_vn: "Cỗ Xe",
    keywords_cn: ["控制", "意志力", "胜利"], keywords_vn: ["Kiểm soát", "Ý chí", "Chiến thắng"],
    meaning_upright_cn: "控制，意志力，成功，行动，决心，克服障碍。", meaning_upright_vn: "Kiểm soát, ý chí, thành công, hành động, quyết tâm, vượt qua trở ngại.",
    meaning_reversed_cn: "缺乏自律，失去方向，失控。", meaning_reversed_vn: "Thiếu kỷ luật, mất phương hướng, mất kiểm soát."
  },
  { 
    id: 8, suit: Suit.MAJOR, number: 8, 
    name_cn: "力量", name_vn: "Sức Mạnh",
    keywords_cn: ["勇气", "影响", "同情"], keywords_vn: ["Can đảm", "Ảnh hưởng", "Trắc ẩn"],
    meaning_upright_cn: "力量，勇气，说服力，影响力，同情心，以柔克刚。", meaning_upright_vn: "Sức mạnh, lòng can đảm, sức thuyết phục, ảnh hưởng, lòng trắc ẩn, lấy nhu thắng cương.",
    meaning_reversed_cn: "自我怀疑，缺乏能量，软弱。", meaning_reversed_vn: "Nghi ngờ bản thân, thiếu năng lượng, yếu đuối."
  },
  { 
    id: 9, suit: Suit.MAJOR, number: 9, 
    name_cn: "隐士", name_vn: "Ẩn Sĩ",
    keywords_cn: ["内省", "独处", "指引"], keywords_vn: ["Nội tâm", "Cô độc", "Dẫn lối"],
    meaning_upright_cn: "灵魂探索，内省，独处，内在指引，智慧。", meaning_upright_vn: "Khám phá tâm hồn, nội tâm, cô độc, dẫn lối nội tại, trí tuệ.",
    meaning_reversed_cn: "孤立，寂寞，退缩，拒绝沟通。", meaning_reversed_vn: "Cô lập, cô đơn, rút lui, từ chối giao tiếp."
  },
  { 
    id: 10, suit: Suit.MAJOR, number: 10, 
    name_cn: "命运之轮", name_vn: "Bánh Xe Vận Mệnh",
    keywords_cn: ["运气", "业力", "循环"], keywords_vn: ["May mắn", "Nghiệp", "Chu kỳ"],
    meaning_upright_cn: "好运，业力，生命周期，命运，转折点。", meaning_upright_vn: "May mắn, nghiệp quả, chu kỳ cuộc sống, định mệnh, bước ngoặt.",
    meaning_reversed_cn: "厄运，抗拒改变，意外的挫折。", meaning_reversed_vn: "Vận rủi, kháng cự thay đổi, thất bại bất ngờ."
  },
  { 
    id: 11, suit: Suit.MAJOR, number: 11, 
    name_cn: "正义", name_vn: "Công Lý",
    keywords_cn: ["正义", "公平", "真相"], keywords_vn: ["Công lý", "Công bằng", "Sự thật"],
    meaning_upright_cn: "正义，公平，真相，因果报应，法律。", meaning_upright_vn: "Công lý, công bằng, sự thật, nhân quả, pháp luật.",
    meaning_reversed_cn: "不公，缺乏责任感，不诚实。", meaning_reversed_vn: "Bất công, thiếu trách nhiệm, không trung thực."
  },
  { 
    id: 12, suit: Suit.MAJOR, number: 12, 
    name_cn: "倒吊人", name_vn: "Người Treo Ngược",
    keywords_cn: ["臣服", "新视角", "牺牲"], keywords_vn: ["Đầu hàng", "Góc nhìn mới", "Hy sinh"],
    meaning_upright_cn: "暂停，臣服，放手，新的视角，牺牲小我。", meaning_upright_vn: "Tạm dừng, đầu hàng, buông bỏ, góc nhìn mới, hy sinh cái tôi.",
    meaning_reversed_cn: "拖延，抗拒，停滞不前。", meaning_reversed_vn: "Trì hoãn, kháng cự, dậm chân tại chỗ."
  },
  { 
    id: 13, suit: Suit.MAJOR, number: 13, 
    name_cn: "死神", name_vn: "Cái Chết",
    keywords_cn: ["结束", "改变", "转化"], keywords_vn: ["Kết thúc", "Thay đổi", "Chuyển hóa"],
    meaning_upright_cn: "结束，改变，转化，过渡，重生。", meaning_upright_vn: "Kết thúc, thay đổi, chuyển hóa, quá độ, tái sinh.",
    meaning_reversed_cn: "抗拒改变，无法释怀，停滞。", meaning_reversed_vn: "Kháng cự thay đổi, không thể buông bỏ, trì trệ."
  },
  { 
    id: 14, suit: Suit.MAJOR, number: 14, 
    name_cn: "节制", name_vn: "Cân Bằng",
    keywords_cn: ["平衡", "适度", "耐心"], keywords_vn: ["Cân bằng", "Điều độ", "Kiên nhẫn"],
    meaning_upright_cn: "平衡，适度，耐心，目标，融合。", meaning_upright_vn: "Cân bằng, điều độ, kiên nhẫn, mục đích, hòa hợp.",
    meaning_reversed_cn: "失衡，过度，缺乏耐心。", meaning_reversed_vn: "Mất cân bằng, thái quá, thiếu kiên nhẫn."
  },
  { 
    id: 15, suit: Suit.MAJOR, number: 15, 
    name_cn: "恶魔", name_vn: "Ác Quỷ",
    keywords_cn: ["阴影", "执念", "束缚"], keywords_vn: ["Bóng tối", "Ám ảnh", "Ràng buộc"],
    meaning_upright_cn: "阴影自我，执念，成瘾，束缚，物质主义。", meaning_upright_vn: "Bản ngã bóng tối, ám ảnh, nghiện ngập, ràng buộc, chủ nghĩa vật chất.",
    meaning_reversed_cn: "释放限制性信念，摆脱束缚。", meaning_reversed_vn: "Giải phóng niềm tin hạn hẹp, thoát khỏi ràng buộc."
  },
  { 
    id: 16, suit: Suit.MAJOR, number: 16, 
    name_cn: "高塔", name_vn: "Tòa Tháp",
    keywords_cn: ["剧变", "动荡", "觉醒"], keywords_vn: ["Biến cố", "Hỗn loạn", "Thức tỉnh"],
    meaning_upright_cn: "突然的改变，动荡，混乱，启示，觉醒。", meaning_upright_vn: "Thay đổi đột ngột, biến động, hỗn loạn, mặc khải, thức tỉnh.",
    meaning_reversed_cn: "避免灾难，恐惧改变。", meaning_reversed_vn: "Tránh được thảm họa, sợ thay đổi."
  },
  { 
    id: 17, suit: Suit.MAJOR, number: 17, 
    name_cn: "星星", name_vn: "Ngôi Sao",
    keywords_cn: ["希望", "信念", "目标"], keywords_vn: ["Hy vọng", "Niềm tin", "Mục đích"],
    meaning_upright_cn: "希望，信念，目标，更新，灵性，宁静。", meaning_upright_vn: "Hy vọng, niềm tin, mục đích, đổi mới, tâm linh, thanh thản.",
    meaning_reversed_cn: "缺乏信念，绝望，自我怀疑。", meaning_reversed_vn: "Thiếu niềm tin, tuyệt vọng, nghi ngờ bản thân."
  },
  { 
    id: 18, suit: Suit.MAJOR, number: 18, 
    name_cn: "月亮", name_vn: "Mặt Trăng",
    keywords_cn: ["幻觉", "恐惧", "不安"], keywords_vn: ["Ảo giác", "Sợ hãi", "Bất an"],
    meaning_upright_cn: "幻觉，恐惧，焦虑，潜意识，直觉，梦境。", meaning_upright_vn: "Ảo giác, sợ hãi, lo lắng, tiềm thức, trực giác, giấc mơ.",
    meaning_reversed_cn: "释放恐惧，被压抑的情绪。", meaning_reversed_vn: "Giải phóng sợ hãi, cảm xúc bị kìm nén."
  },
  { 
    id: 19, suit: Suit.MAJOR, number: 19, 
    name_cn: "太阳", name_vn: "Mặt Trời",
    keywords_cn: ["积极", "快乐", "温暖"], keywords_vn: ["Tích cực", "Niềm vui", "Ấm áp"],
    meaning_upright_cn: "积极，快乐，温暖，成功，活力，显而易见的真相。", meaning_upright_vn: "Tích cực, niềm vui, ấm áp, thành công, sức sống, sự thật rõ ràng.",
    meaning_reversed_cn: "内在孩童受损，情绪低落。", meaning_reversed_vn: "Đứa trẻ bên trong bị tổn thương, cảm xúc trầm lắng."
  },
  { 
    id: 20, suit: Suit.MAJOR, number: 20, 
    name_cn: "审判", name_vn: "Phán Xét",
    keywords_cn: ["审判", "重生", "感召"], keywords_vn: ["Phán xét", "Tái sinh", "Kêu gọi"],
    meaning_upright_cn: "审判，重生，内在感召，宽恕，觉醒。", meaning_upright_vn: "Phán xét, tái sinh, tiếng gọi nội tâm, tha thứ, thức tỉnh.",
    meaning_reversed_cn: "自我怀疑，忽视感召。", meaning_reversed_vn: "Nghi ngờ bản thân, phớt lờ tiếng gọi."
  },
  { 
    id: 21, suit: Suit.MAJOR, number: 21, 
    name_cn: "世界", name_vn: "Thế Giới",
    keywords_cn: ["完成", "整合", "成就"], keywords_vn: ["Hoàn thành", "Hội nhập", "Thành tựu"],
    meaning_upright_cn: "完成，整合，成就，旅行，圆满。", meaning_upright_vn: "Hoàn thành, hội nhập, thành tựu, du hành, viên mãn.",
    meaning_reversed_cn: "寻求闭环，走捷径，延迟。", meaning_reversed_vn: "Tìm kiếm kết thúc, đi đường tắt, trì hoãn."
  },
];

export const DECK: CardData[] = [
  ...MAJOR_ARCANA,
  ...generateMinorSuit(Suit.WANDS, 22),
  ...generateMinorSuit(Suit.CUPS, 36),
  ...generateMinorSuit(Suit.SWORDS, 50),
  ...generateMinorSuit(Suit.PENTACLES, 64),
];

export const SPREADS: SpreadDef[] = [
  {
    name: "One Card",
    name_cn: "单张占卜",
    name_vn: "Một Lá Bài",
    description_cn: "每日指引或特定问题的简单解答。",
    description_vn: "Hướng dẫn hàng ngày hoặc câu trả lời đơn giản.",
    positions: [
      { id: 1, x: 0, y: 0, z: 0, rotationZ: 0, label: "insight" }
    ]
  },
  {
    name: "Three Card",
    name_cn: "圣三角牌阵",
    name_vn: "Ba Lá Bài",
    description_cn: "洞察过去、现在与未来。",
    description_vn: "Khám phá quá khứ, hiện tại và tương lai.",
    positions: [
      { id: 1, x: -5.0, y: 0, z: 0, rotationZ: 0, label: "past" },
      { id: 2, x: 0, y: 0, z: 0, rotationZ: 0, label: "present" },
      { id: 3, x: 5.0, y: 0, z: 0, rotationZ: 0, label: "future" }
    ]
  },
  {
    name: "Celtic Cross",
    name_cn: "凯尔特十字",
    name_vn: "Thập Tự Celtic",
    description_cn: "全方位深入解析当前处境。",
    description_vn: "Phân tích chuyên sâu về mọi khía cạnh.",
    positions: [
      { id: 1, x: 0, y: 0, z: 0, rotationZ: 0, label: "present" },
      { id: 2, x: 0, y: 0, z: 0.1, rotationZ: Math.PI / 2, label: "challenge" },
      { id: 3, x: 0, y: -3.5, z: 0, rotationZ: 0, label: "foundation" },
      { id: 4, x: -3.5, y: 0, z: 0, rotationZ: 0, label: "past" },
      { id: 5, x: 0, y: 3.5, z: 0, rotationZ: 0, label: "goal" },
      { id: 6, x: 3.5, y: 0, z: 0, rotationZ: 0, label: "future" },
      { id: 7, x: 6.5, y: -5.0, z: 0, rotationZ: 0, label: "self" },
      { id: 8, x: 6.5, y: -1.6, z: 0, rotationZ: 0, label: "environment" },
      { id: 9, x: 6.5, y: 1.6, z: 0, rotationZ: 0, label: "hopes" },
      { id: 10, x: 6.5, y: 5.0, z: 0, rotationZ: 0, label: "outcome" }
    ]
  }
];