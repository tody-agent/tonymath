import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT_DIR = path.resolve(__dirname, '..');

const grade4Path = path.join(ROOT_DIR, 'public', 'lessons', 'grade-4', 'math.json');

// We will recreate the Grade 4 file by keeping only the first 60 lessons, then appending 30 correctly formatted ones
let lessons = JSON.parse(fs.readFileSync(grade4Path, 'utf8')).slice(0, 60);

const newLessons = [
  {
    "title": "An và Bình chia kẹo",
    "shortTitle": "Chia kẹo phân số",
    "icon": "🍬",
    "color": "pink",
    "skill": "Tìm phân số của một số",
    "story": "An có 24 cái kẹo ngọt. An cho Bình ăn 1/3 số kẹo của mình. Hỏi An đã cho Bình bao nhiêu cái kẹo?",
    "visual": {
      "type": "bar",
      "values": [24, 8],
      "labels": ["Tổng số kẹo", "Số kẹo cho đi"]
    },
    "retellOptions": [
      "Có 24 cái kẹo, cho đi 1/3 số kẹo, tìm số kẹo đã cho.",
      "Có 24 cái kẹo, mua thêm 3 cái nữa.",
      "Tìm số kẹo còn lại sau khi ăn hết."
    ],
    "correctRetell": 0,
    "facts": [
      "An có tất cả 24 cái kẹo",
      "An cho Bình 1/3 số kẹo đó",
      "Tìm số kẹo An cho Bình"
    ],
    "factRoles": [
      "known",
      "known",
      "unknown"
    ],
    "models": [
      "Mô hình phân số của một số (Lấy tổng nhân với phân số)",
      "Mô hình gộp hai phần",
      "Bảng nhân"
    ],
    "correctModel": 0,
    "operations": [
      "24 ÷ 3",
      "24 + 3",
      "24 - 3"
    ],
    "correctOperation": 0,
    "reasons": [
      "Tìm 1/3 của 24 bằng cách lấy 24 chia cho 3.",
      "Vì Bình được tặng thêm 3 cái kẹo.",
      "Vì số kẹo bị giảm đi 3 cái."
    ],
    "correctReason": 0,
    "answer": 8,
    "unit": "cái kẹo",
    "answerOptions": [
      "An đã cho Bình 8 cái kẹo.",
      "An đã cho Bình 12 cái kẹo.",
      "An đã cho Bình 6 cái kẹo."
    ],
    "correctAnswerSentence": 0,
    "checkQuestion": "Số 8 cái kẹo có bằng đúng một phần ba của 24 không?",
    "checkOptions": [
      "Có, vì 8 nhân 3 bằng 24.",
      "Không, 8 nhân 3 bằng 16."
    ],
    "correctCheck": 0
  },
  {
    "title": "Diện tích mảnh đất hình chữ nhật",
    "shortTitle": "Tính diện tích đất",
    "icon": "📐",
    "color": "green",
    "skill": "Diện tích",
    "story": "Một hình chữ nhật có chu vi là 30 cm. Chiều dài hơn chiều rộng 3 cm. Tính diện tích của hình chữ nhật đó.",
    "visual": {
      "type": "compare",
      "big": 9,
      "small": 6,
      "diff": 3,
      "bigLabel": "Chiều dài",
      "smallLabel": "Chiều rộng"
    },
    "retellOptions": [
      "Chu vi 30 cm, dài hơn rộng 3 cm, tìm diện tích.",
      "Chu vi 30 cm, dài bằng rộng, tìm diện tích.",
      "Tìm chu vi khi biết diện tích."
    ],
    "correctRetell": 0,
    "facts": [
      "Chu vi hình chữ nhật là 30 cm",
      "Chiều dài hơn chiều rộng 3 cm",
      "Tìm diện tích hình chữ nhật"
    ],
    "factRoles": [
      "known",
      "known",
      "unknown"
    ],
    "models": [
      "Sơ đồ đoạn thẳng (Tổng và Hiệu kết hợp diện tích)",
      "Mô hình gộp",
      "Mô hình chia đều"
    ],
    "correctModel": 0,
    "operations": [
      "((30 ÷ 2 + 3) ÷ 2) × ((30 ÷ 2 - 3) ÷ 2)",
      "30 × 3",
      "30 + 3"
    ],
    "correctOperation": 0,
    "reasons": [
      "Tìm nửa chu vi (tổng dài và rộng) là 15, sau đó tìm chiều dài là 9, chiều rộng là 6, rồi nhân lại.",
      "Vì lấy chu vi nhân với hiệu.",
      "Vì diện tích bằng chu vi cộng hiệu."
    ],
    "correctReason": 0,
    "answer": 54,
    "unit": "cm²",
    "answerOptions": [
      "Diện tích hình chữ nhật đó là 54 cm².",
      "Diện tích hình chữ nhật đó là 90 cm².",
      "Diện tích hình chữ nhật đó là 45 cm²."
    ],
    "correctAnswerSentence": 0,
    "checkQuestion": "Nửa chu vi có đúng bằng tổng chiều dài (9) và chiều rộng (6) không?",
    "checkOptions": [
      "Có, 9 + 6 = 15 cm.",
      "Không, 9 + 6 = 18 cm."
      ],
    "correctCheck": 0
  },
  {
    "title": "Mua bút chì ở nhà sách",
    "shortTitle": "Rút về đơn vị mua bút",
    "icon": "✏️",
    "color": "blue",
    "skill": "Rút về đơn vị",
    "story": "Hà mua 4 cái bút chì hết 20 000 đồng. Hỏi nếu Hà mua 7 cái bút chì cùng loại thì hết bao nhiêu tiền?",
    "visual": {
      "type": "bar",
      "values": [20000, 35000],
      "labels": ["Giá tiền 4 bút", "Giá tiền 7 bút"]
    },
    "retellOptions": [
      "Mua 4 bút hết 20 000 đồng, tìm giá tiền mua 7 bút.",
      "Mua 4 bút hết 20 000 đồng, được tặng thêm 7 bút.",
      "Tìm số bút mua được với 100 000 đồng."
    ],
    "correctRetell": 0,
    "facts": [
      "Mua 4 bút hết 20 000 đồng",
      "Hỏi mua 7 cái bút chì",
      "Tìm số tiền mua 7 bút"
    ],
    "factRoles": [
      "known",
      "known",
      "unknown"
    ],
    "models": [
      "Mô hình rút về đơn vị (Tìm giá 1 phần trước)",
      "Mô hình hai giỏ so sánh",
      "Sơ đồ đoạn thẳng"
    ],
    "correctModel": 0,
    "operations": [
      "20000 ÷ 4 × 7",
      "20000 × 4 ÷ 7",
      "20000 + 7"
    ],
    "correctOperation": 0,
    "reasons": [
      "Tìm giá tiền 1 cái bút chì (20000 ÷ 4 = 5000 đồng) rồi nhân với 7.",
      "Vì ta lấy tổng tiền nhân với số bút.",
      "Vì số tiền giảm đi khi mua nhiều bút."
    ],
    "correctReason": 0,
    "answer": 35000,
    "unit": "đồng",
    "answerOptions": [
      "Hà mua 7 cái bút chì hết 35 000 đồng.",
      "Hà mua 7 cái bút chì hết 140 000 đồng.",
      "Hà mua 7 cái bút chì hết 28 000 đồng."
    ],
    "correctAnswerSentence": 0,
    "checkQuestion": "Giá mỗi cái bút chì có phải là 5 000 đồng không?",
    "checkOptions": [
      "Đúng, 20000 chia cho 4 bằng 5000.",
      "Sai, 20000 chia cho 4 bằng 4000."
    ],
    "correctCheck": 0
  },
  {
    "title": "Hai kho chứa thóc nhà bác Ba",
    "shortTitle": "Kho thóc tổng tỉ",
    "icon": "🌾",
    "color": "yellow",
    "skill": "Tổng và Tỉ số",
    "story": "Hai kho thóc nhà bác Ba chứa tất cả 120 tấn thóc. Kho thứ nhất chứa thóc gấp 3 lần kho thứ hai. Hỏi kho thứ hai chứa bao nhiêu tấn thóc?",
    "visual": {
      "type": "compare",
      "big": 90,
      "small": 30,
      "diff": 60,
      "bigLabel": "Kho thứ nhất",
      "smallLabel": "Kho thứ hai"
    },
    "retellOptions": [
      "Tổng hai kho là 120 tấn, kho một gấp 3 lần kho hai, tìm kho hai.",
      "Tổng hai kho là 120 tấn, kho hai nhiều hơn kho một 3 tấn.",
      "Tìm số tấn thóc đã bán ở hai kho."
    ],
    "correctRetell": 0,
    "facts": [
      "Tổng hai kho có 120 tấn thóc",
      "Kho thứ nhất gấp 3 lần kho thứ hai",
      "Tìm số thóc kho thứ hai"
    ],
    "factRoles": [
      "known",
      "known",
      "unknown"
    ],
    "models": [
      "Sơ đồ đoạn thẳng tỉ số (Tổng - Tỉ)",
      "Mô hình gộp hai phần",
      "Bảng nhân"
    ],
    "correctModel": 0,
    "operations": [
      "120 ÷ (3 + 1)",
      "120 ÷ 3",
      "120 - 3"
    ],
    "correctOperation": 0,
    "reasons": [
      "Tìm tổng số phần bằng nhau: 3 + 1 = 4 phần. Số thóc kho hai là 1 phần: 120 ÷ 4 = 30.",
      "Vì chia đều số thóc cho 3 phần.",
      "Vì kho thứ hai ít hơn kho thứ nhất 3 tấn."
    ],
    "correctReason": 0,
    "answer": 30,
    "unit": "tấn thóc",
    "answerOptions": [
      "Kho thứ hai chứa 30 tấn thóc.",
      "Kho thứ hai chứa 90 tấn thóc.",
      "Kho thứ hai chứa 40 tấn thóc."
    ],
    "correctAnswerSentence": 0,
    "checkQuestion": "Số thóc kho thứ nhất (90 tấn) có đúng là gấp 3 lần kho thứ hai (30 tấn) không?",
    "checkOptions": [
      "Có, 30 nhân 3 bằng 90.",
      "Không, 30 nhân 3 bằng 60."
    ],
    "correctCheck": 0
  },
  {
    "title": "Tuổi mẹ và tuổi con",
    "shortTitle": "Tính tuổi hiệu tỉ",
    "icon": "👩‍👦",
    "color": "pink",
    "skill": "Hiệu và Tỉ số",
    "story": "Mẹ hơn con 25 tuổi. Biết rằng tuổi mẹ gấp 6 lần tuổi con. Hỏi con năm nay bao nhiêu tuổi?",
    "visual": {
      "type": "compare",
      "big": 30,
      "small": 5,
      "diff": 25,
      "bigLabel": "Tuổi mẹ",
      "smallLabel": "Tuổi con"
    },
    "retellOptions": [
      "Mẹ hơn con 25 tuổi, tuổi mẹ gấp 6 lần tuổi con, tìm tuổi con.",
      "Mẹ và con có tổng số tuổi là 25 tuổi.",
      "Tìm số tuổi của bố khi biết tuổi mẹ."
    ],
    "correctRetell": 0,
    "facts": [
      "Mẹ hơn con 25 tuổi",
      "Tuổi mẹ gấp 6 lần tuổi con",
      "Tìm số tuổi của con"
    ],
    "factRoles": [
      "known",
      "known",
      "unknown"
    ],
    "models": [
      "Sơ đồ đoạn thẳng tỉ số (Hiệu - Tỉ)",
      "Mô hình gộp hai phần",
      "Bảng nhân"
    ],
    "correctModel": 0,
    "operations": [
      "25 ÷ (6 - 1)",
      "25 ÷ 6",
      "25 + 6"
    ],
    "correctOperation": 0,
    "reasons": [
      "Tìm hiệu số phần bằng nhau: 6 - 1 = 5 phần. Giá trị một phần (tuổi con) là: 25 ÷ 5 = 5.",
      "Vì lấy hiệu chia cho tổng số tuổi.",
      "Vì tuổi con bằng hiệu cộng thêm tỉ số."
    ],
    "correctReason": 0,
    "answer": 5,
    "unit": "tuổi",
    "answerOptions": [
      "Năm nay con 5 tuổi.",
      "Năm nay con 6 tuổi.",
      "Năm nay con 8 tuổi."
    ],
    "correctAnswerSentence": 0,
    "checkQuestion": "Hiệu số tuổi của mẹ (30 tuổi) và con (5 tuổi) có đúng bằng 25 không?",
    "checkOptions": [
      "Đúng, 30 trừ 5 bằng 25.",
      "Sai, 30 trừ 5 bằng 20."
    ],
    "correctCheck": 0
  }
];

const names = ["Lan", "Vy", "Bo", "Nam", "Mai", "Phúc", "Duy", "Linh", "Khoa", "Hà", "Minh", "Tuấn"];
const foods = ["quả cam", "quả xoài", "viên kẹo", "hộp sữa", "quyển vở", "chiếc bút"];

// Add 25 more unique exercises
for (let i = 0; i < 25; i++) {
  const name1 = names[i % names.length];
  const name2 = names[(i + 3) % names.length];
  const food = foods[i % foods.length];
  
  let lesson = {};
  
  const typeIndex = i % 6; // We rotate between 6 types of problems
  
  if (typeIndex === 0) {
    // 1. Tìm phân số
    const total = 40 + (i * 2);
    const ans = total / 5 * 2;
    lesson = {
      "title": `Hái ${food} trong vườn`,
      "shortTitle": `Phân số ${food}`,
      "icon": "🍊",
      "color": "orange",
      "skill": "Tìm phân số của một số",
      "story": `${name1} hái được ${total} ${food}. ${name1} tặng cho ${name2} 2/5 số ${food} đó. Hỏi ${name1} đã tặng bao nhiêu ${food}?`,
      "visual": {
        "type": "bar",
        "values": [total, ans],
        "labels": ["Tổng hái được", "Tặng đi"]
      },
      "retellOptions": [
        `Có ${total} ${food}, cho đi 2/5 số đó, tìm số lượng đã cho.`,
        `Có ${total} ${food}, được tặng thêm 2/5 số đó.`,
        `Tìm số còn lại.`
      ],
      "correctRetell": 0,
      "facts": [
        `${name1} hái được ${total} ${food}`,
        `Cho đi 2/5 số đó`,
        `Tìm số ${food} cho đi`
      ],
      "factRoles": ["known", "known", "unknown"],
      "models": [
        "Mô hình phân số của một số (Lấy tổng nhân với phân số)",
        "Mô hình gộp hai phần",
        "Bảng nhân"
      ],
      "correctModel": 0,
      "operations": [
        `${total} × 2 ÷ 5`,
        `${total} + 2 - 5`,
        `${total} - 2 + 5`
      ],
      "correctOperation": 0,
      "reasons": [
        `Tìm 2/5 của ${total} bằng cách lấy ${total} nhân với 2 rồi chia cho 5.`,
        `Vì ta cộng thêm phân số.`,
        `Vì số lượng bị giảm đi.`
      ],
      "correctReason": 0,
      "answer": ans,
      "unit": food,
      "answerOptions": [
        `${name1} đã tặng ${ans} ${food}.`,
        `${name1} đã tặng ${ans + 4} ${food}.`,
        `${name1} đã tặng ${ans - 4} ${food}.`
      ],
      "correctAnswerSentence": 0,
      "checkQuestion": `Số ${ans} có phải là bằng 2/5 của ${total} không?`,
      "checkOptions": [
        `Đúng, vì ${total} chia 5 nhân 2 bằng ${ans}.`,
        `Sai, kết quả phải lớn hơn.`
      ],
      "correctCheck": 0
    };
  } else if (typeIndex === 1) {
    // 2. Tổng và Hiệu
    const diff = 10 + (i * 2);
    const sum = 60 + (i * 4);
    const big = (sum + diff) / 2;
    lesson = {
      "title": `Thu gom ${food} bảo vệ môi trường`,
      "shortTitle": `Thu gom ${food} tổng hiệu`,
      "icon": "⚖️",
      "color": "green",
      "skill": "Tổng và Hiệu",
      "story": `${name1} và ${name2} thu gom được tổng cộng ${sum} ${food}. ${name1} thu gom được nhiều hơn ${name2} ${diff} ${food}. Hỏi ${name1} thu gom được bao nhiêu ${food}?`,
      "visual": {
        "type": "compare",
        "big": big,
        "small": sum - big,
        "diff": diff,
        "bigLabel": name1,
        "smallLabel": name2
      },
      "retellOptions": [
        `Tổng thu gom là ${sum} ${food}, ${name1} nhiều hơn ${name2} ${diff} ${food}, tìm số của ${name1}.`,
        `Tìm hiệu khi biết tổng số.`,
        `Tìm số thu gom của ${name2} khi biết tỉ số.`
      ],
      "correctRetell": 0,
      "facts": [
        `Tổng số thu gom của hai bạn là ${sum} ${food}`,
        `${name1} nhiều hơn ${name2} ${diff} ${food}`,
        `Tìm số ${food} của ${name1}`
      ],
      "factRoles": ["known", "known", "unknown"],
      "models": [
        "Sơ đồ đoạn thẳng (Tổng và Hiệu)",
        "Mô hình chia đều",
        "Bảng nhân"
      ],
      "correctModel": 0,
      "operations": [
        `(${sum} + ${diff}) ÷ 2`,
        `(${sum} - ${diff}) ÷ 2`,
        `${sum} + ${diff}`
      ],
      "correctOperation": 0,
      "reasons": [
        `Tìm số lớn bằng cách lấy (Tổng + Hiệu) chia đôi: (${sum} + ${diff}) ÷ 2 = ${big}.`,
        `Vì lấy tổng trừ đi hiệu.`,
        `Vì số lượng gấp đôi.`
      ],
      "correctReason": 0,
      "answer": big,
      "unit": food,
      "answerOptions": [
        `${name1} thu gom được ${big} ${food}.`,
        `${name1} thu gom được ${sum - big} ${food}.`,
        `${name1} thu gom được ${sum} ${food}.`
      ],
      "correctAnswerSentence": 0,
      "checkQuestion": `Tổng số của hai bạn (${big} và ${sum - big}) có đúng bằng ${sum} không?`,
      "checkOptions": [
        `Có, ${big} + ${sum - big} = ${sum}.`,
        `Không, tổng bằng số khác.`
      ],
      "correctCheck": 0
    };
  } else if (typeIndex === 2) {
    // 3. Tổng và Tỉ số
    const small = 10 + i;
    const sum = small * 4;
    const big = small * 3;
    lesson = {
      "title": `Tuổi của cha và con`,
      "shortTitle": `Tuổi cha con tổng tỉ`,
      "icon": "🧮",
      "color": "blue",
      "skill": "Tổng và Tỉ số",
      "story": `Tổng số tuổi của bố và ${name1} là ${sum} tuổi. Tuổi bố gấp 3 lần tuổi ${name1}. Hỏi ${name1} năm nay bao nhiêu tuổi?`,
      "visual": {
        "type": "compare",
        "big": big,
        "small": small,
        "diff": big - small,
        "bigLabel": "Tuổi bố",
        "smallLabel": `Tuổi ${name1}`
      },
      "retellOptions": [
        `Tổng số tuổi là ${sum}, bố gấp 3 lần con, tìm tuổi con.`,
        `Bố hơn con 3 tuổi.`,
        `Tìm tuổi bố khi biết hiệu số tuổi.`
      ],
      "correctRetell": 0,
      "facts": [
        `Tổng số tuổi hai bố con là ${sum} tuổi`,
        `Tuổi bố gấp 3 lần tuổi ${name1}`,
        `Tìm số tuổi của ${name1}`
      ],
      "factRoles": ["known", "known", "unknown"],
      "models": [
        "Sơ đồ đoạn thẳng tỉ số (Tổng - Tỉ)",
        "Mô hình gộp hai phần",
        "Bảng nhân"
      ],
      "correctModel": 0,
      "operations": [
        `${sum} ÷ (3 + 1)`,
        `${sum} ÷ 3`,
        `${sum} - 3`
      ],
      "correctOperation": 0,
      "reasons": [
        `Tìm tổng số phần bằng nhau: 3 + 1 = 4 phần. Số tuổi của con là 1 phần: ${sum} ÷ 4 = ${small}.`,
        `Vì chia đều số tuổi cho 3 phần.`,
        `Vì con ít hơn bố 3 tuổi.`
      ],
      "correctReason": 0,
      "answer": small,
      "unit": "tuổi",
      "answerOptions": [
        `Năm nay ${name1} ${small} tuổi.`,
        `Năm nay ${name1} ${small + 2} tuổi.`,
        `Năm nay ${name1} ${big} tuổi.`
      ],
      "correctAnswerSentence": 0,
      "checkQuestion": `Tuổi bố (${big}) có đúng là gấp 3 lần tuổi con (${small}) không?`,
      "checkOptions": [
        `Có, ${small} nhân 3 bằng ${big}.`,
        `Không, ${small} nhân 3 bằng ${big + 5}.`
      ],
      "correctCheck": 0
    };
  } else if (typeIndex === 3) {
    // 4. Hiệu và Tỉ số
    const small = 8 + i;
    const diff = small * 3;
    const big = small * 4;
    lesson = {
      "title": `Chiều dài hai sợi ruy-băng`,
      "shortTitle": `Sợi dây hiệu tỉ`,
      "icon": "📐",
      "color": "pink",
      "skill": "Hiệu và Tỉ số",
      "story": `Sợi dây màu xanh dài hơn sợi dây màu đỏ ${diff} cm. Biết rằng sợi dây màu xanh dài gấp 4 lần sợi dây màu đỏ. Hỏi sợi dây màu đỏ dài bao nhiêu xăng-ti-mét?`,
      "visual": {
        "type": "compare",
        "big": big,
        "small": small,
        "diff": diff,
        "bigLabel": "Sợi xanh",
        "smallLabel": "Sợi đỏ"
      },
      "retellOptions": [
        `Sợi xanh dài hơn đỏ ${diff} cm, sợi xanh gấp 4 lần đỏ, tìm sợi đỏ.`,
        `Tổng chiều dài hai sợi dây là ${diff} cm.`,
        `Tìm chiều dài sợi dây màu xanh.`
      ],
      "correctRetell": 0,
      "facts": [
        `Sợi dây màu xanh dài hơn sợi đỏ ${diff} cm`,
        `Sợi xanh dài gấp 4 lần sợi đỏ`,
        `Tìm chiều dài sợi đỏ`
      ],
      "factRoles": ["known", "known", "unknown"],
      "models": [
        "Sơ đồ đoạn thẳng tỉ số (Hiệu - Tỉ)",
        "Mô hình gộp hai phần",
        "Bảng nhân"
      ],
      "correctModel": 0,
      "operations": [
        `${diff} ÷ (4 - 1)`,
        `${diff} ÷ 4`,
        `${diff} + 4`
      ],
      "correctOperation": 0,
      "reasons": [
        `Tìm hiệu số phần bằng nhau: 4 - 1 = 3 phần. Chiều dài sợi đỏ là 1 phần: ${diff} ÷ 3 = ${small}.`,
        `Vì lấy hiệu chia cho tỉ số.`,
        `Vì chiều dài sợi đỏ bằng hiệu cộng tỉ số.`
      ],
      "correctReason": 0,
      "answer": small,
      "unit": "cm",
      "answerOptions": [
        `Sợi dây màu đỏ dài ${small} cm.`,
        `Sợi dây màu đỏ dài ${big} cm.`,
        `Sợi dây màu đỏ dài ${small + 5} cm.`
      ],
      "correctAnswerSentence": 0,
      "checkQuestion": `Hiệu chiều dài hai sợi dây (${big} cm và ${small} cm) có đúng bằng ${diff} cm không?`,
      "checkOptions": [
        `Đúng, ${big} trừ ${small} bằng ${diff}.`,
        `Sai, ${big} trừ ${small} bằng số khác.`
      ],
      "correctCheck": 0
    };
  } else if (typeIndex === 4) {
    // 5. Rút về đơn vị
    const baseNum = 5;
    const priceOne = 6000 + (i * 1000);
    const basePrice = priceOne * baseNum;
    const targetNum = 8;
    const targetPrice = priceOne * targetNum;
    lesson = {
      "title": `Giá tiền mua ${food}`,
      "shortTitle": `Mua ${food} rút đơn vị`,
      "icon": "📦",
      "color": "purple",
      "skill": "Rút về đơn vị",
      "story": `Mua ${baseNum} ${food} hết ${basePrice} đồng. Hỏi nếu mua ${targetNum} ${food} như thế thì phải trả bao nhiêu tiền?`,
      "visual": {
        "type": "bar",
        "values": [basePrice, targetPrice],
        "labels": [`Giá tiền ${baseNum} chiếc`, `Giá tiền ${targetNum} chiếc`]
      },
      "retellOptions": [
        `Mua ${baseNum} chiếc hết ${basePrice} đồng, tìm giá mua ${targetNum} chiếc.`,
        `Mua ${baseNum} chiếc được tặng ${targetNum} chiếc.`,
        `Tìm số lượng chiếc mua được.`
      ],
      "correctRetell": 0,
      "facts": [
        `Mua ${baseNum} ${food} hết ${basePrice} đồng`,
        `Hỏi mua ${targetNum} ${food}`,
        `Tìm số tiền mua ${targetNum} ${food}`
      ],
      "factRoles": ["known", "known", "unknown"],
      "models": [
        "Mô hình rút về đơn vị (Tìm giá 1 phần trước)",
        "Mô hình hai giỏ so sánh",
        "Sơ đồ đoạn thẳng"
      ],
      "correctModel": 0,
      "operations": [
        `${basePrice} ÷ ${baseNum} × ${targetNum}`,
        `${basePrice} × ${baseNum} ÷ ${targetNum}`,
        `${basePrice} + ${targetNum}`
      ],
      "correctOperation": 0,
      "reasons": [
        `Tìm giá 1 ${food} (${basePrice} ÷ ${baseNum} = ${priceOne} đồng) rồi nhân với ${targetNum}.`,
        `Vì lấy giá tiền nhân số lượng.`,
        `Vì giá tiền giảm đi.`
      ],
      "correctReason": 0,
      "answer": targetPrice,
      "unit": "đồng",
      "answerOptions": [
        `Mua ${targetNum} ${food} hết ${targetPrice} đồng.`,
        `Mua ${targetNum} ${food} hết ${targetPrice + 10000} đồng.`,
        `Mua ${targetNum} ${food} hết ${targetPrice - 10000} đồng.`
      ],
      "correctAnswerSentence": 0,
      "checkQuestion": `Giá 1 ${food} có phải là ${priceOne} đồng không?`,
      "checkOptions": [
        `Đúng, vì ${basePrice} chia ${baseNum} bằng ${priceOne}.`,
        `Sai, chia ra số khác.`
      ],
      "correctCheck": 0
    };
  } else {
    // 6. Diện tích
    const side = 5 + (i % 5);
    const perimeter = side * 4;
    const area = side * side;
    lesson = {
      "title": `Khu vườn hình vuông của bà`,
      "shortTitle": `Vườn hoa diện tích`,
      "icon": "🟩",
      "color": "green",
      "skill": "Diện tích",
      "story": `Một vườn hoa hình vuông có chu vi là ${perimeter} m. Tính diện tích của vườn hoa đó.`,
      "visual": {
        "type": "bar",
        "values": [perimeter, area],
        "labels": ["Chu vi vườn (m)", "Diện tích vườn (m²)"]
      },
      "retellOptions": [
        `Khu vườn hình vuông có chu vi ${perimeter} m, tính diện tích.`,
        `Biết diện tích, tính chu vi vườn.`,
        `So sánh diện tích hai khu vườn.`
      ],
      "correctRetell": 0,
      "facts": [
        `Khu vườn có chu vi ${perimeter} m`,
        `Hình vuông có 4 cạnh bằng nhau`,
        `Tìm diện tích vườn`
      ],
      "factRoles": ["known", "known", "unknown"],
      "models": [
        "Diện tích hình vuông (Cạnh nhân cạnh)",
        "Mô hình gộp hai phần",
        "Bảng nhân"
      ],
      "correctModel": 0,
      "operations": [
        `(${perimeter} ÷ 4) × (${perimeter} ÷ 4)`,
        `${perimeter} × 4`,
        `${perimeter} + 4`
      ],
      "correctOperation": 0,
      "reasons": [
        `Tìm cạnh vườn hoa (${perimeter} ÷ 4 = ${side} m) rồi tính diện tích: ${side} × ${side} = ${area} m².`,
        `Vì diện tích bằng chu vi nhân 4.`,
        `Vì diện tích bằng chu vi cộng 4.`
      ],
      "correctReason": 0,
      "answer": area,
      "unit": "m²",
      "answerOptions": [
        `Diện tích vườn hoa là ${area} m².`,
        `Diện tích vườn hoa là ${perimeter} m².`,
        `Diện tích vườn hoa là ${area * 2} m².`
      ],
      "correctAnswerSentence": 0,
      "checkQuestion": `Cạnh vườn hoa (${side} m) nhân với chính nó có đúng bằng ${area} không?`,
      "checkOptions": [
        `Có, ${side} nhân ${side} bằng ${area}.`,
        `Không, kết quả bằng số khác.`
      ],
      "correctCheck": 0
    };
  }
  
  newLessons.push(lesson);
}

newLessons.forEach((l, index) => {
  l.id = `lesson-${61 + index}`;
});

lessons = lessons.concat(newLessons);
fs.writeFileSync(grade4Path, JSON.stringify(lessons, null, 2), 'utf8');
console.log(`Successfully generated and appended 30 new lessons to Grade 4. Total: ${lessons.length} lessons.`);
