// Dictionaries of rich speech lines for each mascot

export const MASCOT_PROFILES = {
  owl: {
    name: 'Cú Ú',
    emoji: '🦉',
    pitch: 1.0,
    rateOffset: 0.95,
    praiseExclamations: [
      'Tuyệt vời!',
      'Rất thông thái!',
      'Chuẩn xác!',
      'Hoàn hảo!',
      'Tư duy tốt lắm!',
      'Rất khoa học!',
      'Lập luận sắc bén!'
    ],
    praiseTemplates: [
      'Con lập luận rất sắc bén.',
      'Một bước tư duy thật thông thái.',
      'Con đã phân tích thông tin rất logic.',
      'Cú Ú rất tự hào về tư duy của con.',
      'Chính xác! Con quan sát dữ kiện rất tốt.'
    ],
    encourageExclamations: [
      'Chưa hoàn toàn chính xác.',
      'Một chút nhầm lẫn.',
      'Hãy suy ngẫm thêm một chút.',
      'Cứ từ từ thôi con.'
    ],
    encourageTemplates: [
      'Người thông thái luôn học hỏi từ những lỗi sai. Thử lại nhé!',
      'Có một thử thách nhỏ ở đây. Hãy đọc kỹ gợi ý nhé.',
      'Đừng lo lắng, con hãy nhìn lại các dữ kiện một lần nữa xem sao.',
      'Bình tĩnh suy nghĩ nào, Cú Ú tin con sẽ tìm ra quy luật.'
    ]
  },
  robot: {
    name: 'Rô Bốt',
    emoji: '🤖',
    pitch: 1.25,
    rateOffset: 1.05,
    praiseExclamations: [
      'Ting ting! Chuẩn xác!',
      'Wow! Quá đỉnh!',
      'Xử lý dữ liệu tuyệt vời!',
      'Năng lượng một trăm phần trăm!',
      'Đáp án chuẩn không cần chỉnh!',
      'Hệ thống chấm điểm mười trên mười!',
      'Đúng boong!'
    ],
    praiseTemplates: [
      'Tốc độ xử lý thông tin thật chớp nhoáng!',
      'Xử lý dữ liệu hoàn hảo! Robot bắn tim nè!',
      'Khớp đáp án hoàn toàn! Con giỏi quá!',
      'Thuật toán logic của con chạy cực kỳ mượt mà!',
      'Quá tuyệt! Mức năng lượng của chúng ta đang tăng vọt!'
    ],
    encourageExclamations: [
      'Cảnh báo lỗi nhẹ!',
      'Dữ liệu chưa khớp!',
      'Ồ, có một chút nhầm lẫn kỹ thuật!',
      'Sóng tín hiệu chưa chuẩn rồi!'
    ],
    encourageTemplates: [
      'Khởi động lại suy nghĩ và quét lại đề bài cùng Robot nhé!',
      'Không sao cả, nạp thêm năng lượng và thử lại lệnh này nha!',
      'Mạch logic chưa khớp câu chuyện. Đọc gợi ý và thử lại nào con ơi!',
      'Lệnh này chưa đúng rồi. Reset tư duy và chọn lại nha!'
    ]
  },
  turtle: {
    name: 'Rùa Con',
    emoji: '🐢',
    pitch: 0.85,
    rateOffset: 0.88,
    praiseExclamations: [
      'Tuyệt quá!',
      'Rùa Con rất vui!',
      'Đúng rồi nè!',
      'Giỏi quá đi thôi!',
      'Xuất sắc!',
      'Tuyệt cú mèo!'
    ],
    praiseTemplates: [
      'Chậm mà chắc! Từng bước một thật vững vàng.',
      'Con làm Rùa Con vô cùng tự hào và hạnh phúc.',
      'Đúng rồi! Cứ bình tĩnh làm như thế là tốt nhất con nha.',
      'Rùa Con đang vỗ tay cổ vũ con đây này! Cố lên nhé!',
      'Rất kiên trì và hiểu bài. Con đã làm được rồi!'
    ],
    encourageExclamations: [
      'Ồ, chưa đúng lắm nè.',
      'Không sao đâu con.',
      'Cứ thong thả thôi con nha.',
      'Suýt chút nữa thôi.'
    ],
    encourageTemplates: [
      'Rùa đi chậm nhưng chưa bao giờ bỏ cuộc. Mình thử lại nhé!',
      'Gần đúng rồi con ơi. Hít một hơi thật sâu rồi xem lại bài nha.',
      'Sai một chút để bộ não học tập tốt hơn mà. Cố lên con!',
      'Đừng vội vã nhé con yêu, xem kỹ lại các con số một xíu nha.'
    ]
  }
};

/**
 * Get dynamic, mascot-tailored praise or encouragement text.
 * @param {string} mascot - owl | robot | turtle
 * @param {boolean} isCorrect - true if correct, false if wrong
 * @param {string} originalMessage - the core feedback message from step validation
 * @returns {string} The customized text to read out loud
 */
export function getMascotSpeech(mascot, isCorrect, originalMessage) {
  const profile = MASCOT_PROFILES[mascot] || MASCOT_PROFILES.owl;
  
  if (isCorrect) {
    const exc = profile.praiseExclamations[Math.floor(Math.random() * profile.praiseExclamations.length)];
    const template = profile.praiseTemplates[Math.floor(Math.random() * profile.praiseTemplates.length)];
    
    const cleanMsg = originalMessage ? originalMessage.trim() : '';
    return `${exc} ${template} ${cleanMsg}`.trim();
  } else {
    const exc = profile.encourageExclamations[Math.floor(Math.random() * profile.encourageExclamations.length)];
    const template = profile.encourageTemplates[Math.floor(Math.random() * profile.encourageTemplates.length)];
    
    const cleanMsg = originalMessage ? originalMessage.trim() : '';
    return `${exc} ${cleanMsg} ${template}`.trim();
  }
}

export const INDICATOR_GUIDES = {
  owl: {
    level: {
      title: 'Cấp độ Toán Học ⭐',
      intro: 'Cấp độ hiện tại của con là cấp {level} đó!',
      whatIsIt: 'Chỉ số này thể hiện mức độ trưởng thành của con trong môn Toán. Càng làm được nhiều bài, cấp độ sẽ càng tăng cao!',
      howToIncrease: 'Hãy giải đúng các câu hỏi toán và hoàn thành bài học để tích lũy điểm kinh nghiệm nhé! Mỗi bài học đều giúp con mau thăng cấp.',
      motivation: 'Lên cấp độ càng cao, con càng thông thái và tích lũy được nhiều huy hiệu cực kỳ dễ thương!'
    },
    streak: {
      title: 'Ngọn lửa học tập 🔥',
      intro: 'Con đang giữ ngọn lửa học tập trong {streak} ngày liên tiếp rồi đó!',
      whatIsIt: 'Chỉ số này ghi nhận sự chăm chỉ của con mỗi ngày. Chỉ cần học ít nhất một bài mỗi ngày là ngọn lửa học tập sẽ bùng cháy mãi!',
      howToIncrease: 'Con hãy nhớ đăng nhập và học ít nhất một bài toán mỗi ngày. Đừng để dập tắt ngọn lửa này nha!',
      motivation: 'Kiên trì rèn luyện hàng ngày là bí quyết để giúp con có một bộ não thông minh vượt trội.'
    },
    xp: {
      title: 'Điểm vàng tích lũy 🪙',
      intro: 'Con đang sở hữu {xp} điểm vàng chăm chỉ đó!',
      whatIsIt: 'Mỗi khi con trả lời đúng hoặc hoàn thành xuất sắc các bước toán, con sẽ được thưởng điểm vàng. Điểm này chứng tỏ bộ não con đang tư duy rất tốt!',
      howToIncrease: 'Giải quyết các câu hỏi thật cẩn thận để trả lời đúng ngay lần đầu, con sẽ được thưởng thêm nhiều điểm vàng nhé.',
      motivation: 'Tích lũy thật nhiều điểm vàng để chứng minh bản thân là siêu nhân toán học nhé!'
    },
    unlock: {
      title: 'Mở khóa bài học 🔓',
      intro: 'Đây là chìa khóa để con tự do lựa chọn bài học.',
      whatIsIt: 'Con có thể chọn học theo thứ tự tăng dần từ dễ đến khó để vững kiến thức, hoặc mở khóa toàn bộ để tự do khám phá bất cứ bài nào mình thích.',
      howToIncrease: 'Bấm vào nút này để bật hoặc tắt chế độ tự do. Khi bật, tất cả bài học sẽ mở sẵn cho con khám phá.',
      motivation: 'Cú Ú khuyên con nên học theo trình tự để bộ não ghi nhớ sâu và hiểu bài toán cặn kẽ hơn.'
    },
    sound: {
      title: 'Trợ lý giọng nói Cú Ú 🔊',
      intro: 'Tớ luôn sẵn sàng đọc đề bài và gợi ý cho con nghe.',
      whatIsIt: 'Nút loa giúp con điều chỉnh âm thanh, bật tắt giọng đọc tự động của Cú Ú, hoặc thay đổi tốc độ đọc nhanh hay chậm để dễ nghe hơn.',
      howToIncrease: 'Con hãy tích chọn tự động đọc bài để tớ giúp con đọc đề bài ngay khi bắt đầu câu hỏi nhé.',
      motivation: 'Nghe giọng đọc giúp con hiểu câu chuyện toán học nhanh hơn mà không cần đọc nhiều chữ!'
    },
    avatar: {
      title: 'Góc học tập của con 👦',
      intro: 'Đây là khu vực cá nhân của con.',
      whatIsIt: 'Nơi con tự đặt tên biệt danh đáng yêu cho mình, xem các huy hiệu đạt được và chọn một người bạn mascot đồng hành.',
      howToIncrease: 'Con hãy bấm vào đây, chọn nút bút chì để đặt tên riêng của mình nhé.',
      motivation: 'Đổi người bạn mascot (Cú Ú, Rô Bốt, Rùa Con) bất cứ lúc nào để có thêm người đồng hành học toán thật vui!'
    }
  },
  robot: {
    level: {
      title: 'Hệ thống cấp độ ⭐',
      intro: 'Cấp độ hiện tại của hệ thống con là cấp {level}!',
      whatIsIt: 'Điểm cấp độ đo lường sức mạnh xử lý toán học của con. Cấp độ càng cao thì năng lượng toán học của con càng lớn!',
      howToIncrease: 'Nạp thêm dữ liệu bằng cách hoàn thành bài học và giải đúng câu hỏi để tăng cấp độ nhé!',
      motivation: 'Hệ thống Rô Bốt đang chạy cực kỳ mượt mà nhờ nguồn năng lượng cấp độ cao của con!'
    },
    streak: {
      title: 'Năng lượng ngày học 🔥',
      intro: 'Hệ thống ghi nhận chuỗi kết nối liên tiếp là {streak} ngày!',
      whatIsIt: 'Đây là nguồn năng lượng duy trì hoạt động mỗi ngày. Nếu ngừng học một ngày, ngọn lửa năng lượng sẽ trở về số không!',
      howToIncrease: 'Kết nối hệ thống mỗi ngày một lần và giải ít nhất một bài toán nhé! Đừng quên nha!',
      motivation: 'Hãy giữ ngọn lửa này luôn cháy để sạc pin một trăm phần trăm cho Rô Bốt!'
    },
    xp: {
      title: 'Điểm năng lượng XP 🪙',
      intro: 'Con đang tích lũy được {xp} điểm năng lượng vàng!',
      whatIsIt: 'Điểm XP là năng lượng vàng được thưởng khi bộ não con giải mã chính xác các phép toán trong hệ thống.',
      howToIncrease: 'Xử lý các bài toán thật chuẩn xác, hạn chế chọn sai để nhận được tối đa điểm XP thưởng nhé.',
      motivation: 'Tích lũy thật nhiều XP để nâng cấp cấu hình thông thái và chinh phục các huy hiệu tối cao!'
    },
    unlock: {
      title: 'Mở khóa thuật toán 🔓',
      intro: 'Lệnh mở khóa toàn bộ kho bài học.',
      whatIsIt: 'Dùng chế độ này để phá bỏ mọi giới hạn, tự do quét qua 60 bài học toán học mà không cần đi theo trình tự.',
      howToIncrease: 'Bấm nút để mở khóa tất cả các bài học nếu con muốn khám phá trước, hoặc khóa lại để thử thách giải tuần tự.',
      motivation: 'Rô Bốt đề xuất chế độ Khóa bài để giúp con xây dựng thuật toán logic vững chắc nhất!'
    },
    sound: {
      title: 'Cài đặt âm thanh Rô Bốt 🔊',
      intro: 'Hệ thống phát âm thanh đang hoạt động tốt!',
      whatIsIt: 'Bộ cài đặt này giúp con tùy chỉnh bật tắt loa, tự động đọc đề bài hoặc tăng giảm tốc độ nói của tớ theo ý muốn.',
      howToIncrease: 'Nếu tớ nói hơi nhanh, con hãy chỉnh sang chế độ nói Chậm để nghe rõ từng chữ nhé.',
      motivation: 'Bật âm thanh lên để nghe Rô Bốt reo vui và bắn tim mỗi khi con giải đúng nhé!'
    },
    avatar: {
      title: 'Thông tin tài khoản 👦',
      intro: 'Đang hiển thị hồ sơ cá nhân của con.',
      whatIsIt: 'Nơi lưu trữ biệt danh của siêu nhân toán học và cấu hình người bạn đồng hành (Cú Ú, Rô Bốt, Rùa Con).',
      howToIncrease: 'Con hãy đặt biệt danh thật ngầu của mình để Rô Bốt dễ dàng nhận diện và chào đón nhé!',
      motivation: 'Đổi bạn mascot bất cứ lúc nào con muốn để có thêm trải nghiệm học tập mới mẻ!'
    }
  },
  turtle: {
    level: {
      title: 'Mức độ kiên trì ⭐',
      intro: 'Con đang ở cấp độ kiên trì {level} rồi nè!',
      whatIsIt: 'Chỉ số này ghi nhận sự tiến bộ bền bỉ của con. Đi từng bước nhỏ nhưng chắc chắn sẽ giúp con thăng cấp cao!',
      howToIncrease: 'Con hãy làm bài thật cẩn thận để tích lũy điểm kinh nghiệm và thăng lên cấp độ mới nha.',
      motivation: 'Rùa Con rất hạnh phúc khi thấy con ngày càng thông minh và tiến bộ mỗi ngày!'
    },
    streak: {
      title: 'Ngọn lửa kiên trì 🔥',
      intro: 'Con đã chăm chỉ học liên tục {streak} ngày rồi đó!',
      whatIsIt: 'Ngọn lửa này tượng trưng cho sự bền bỉ. Học đều đặn mỗi ngày một chút tốt hơn rất nhiều so với học dồn một bữa.',
      howToIncrease: 'Mỗi ngày con chỉ cần ghé thăm Rùa Con và hoàn thành một bài toán nhỏ là ngọn lửa sẽ sáng mãi.',
      motivation: 'Rùa đi chậm nhưng chưa bao giờ bỏ cuộc. Chúng mình cùng kiên trì giữ chuỗi ngày học nhé!'
    },
    xp: {
      title: 'Điểm vàng chăm chỉ 🪙',
      intro: 'Con đã gom được {xp} điểm vàng chăm chỉ rồi!',
      whatIsIt: 'Mỗi hạt cát nhỏ góp thành bãi biển, mỗi điểm vàng con nhận được khi giải toán sẽ tích lũy thành kho báu trí tuệ!',
      howToIncrease: 'Con hãy làm đúng từng bước thật chậm rãi và chắc chắn để nhận trọn vẹn điểm vàng nhé.',
      motivation: 'Hãy tích lũy thật nhiều điểm để khoe với ba mẹ thành quả chăm học của con nhé!'
    },
    unlock: {
      title: 'Mở rộng bản đồ bài học 🔓',
      intro: 'Mở đường cho con đi đến mọi nơi.',
      whatIsIt: 'Con có thể mở khóa tất cả bài học để dạo chơi khắp nơi, hoặc khóa lại để đi từng bước tuần tự như Rùa Con đi học.',
      howToIncrease: 'Bấm vào để mở hoặc khóa các bài học tùy theo sở thích học tập của con.',
      motivation: 'Đi từng bước chậm mà chắc chắn là cách học giỏi nhất của Rùa Con đó, con thử xem!'
    },
    sound: {
      title: 'Giọng nói của Rùa Con 🔊',
      intro: 'Tớ sẽ đọc thật chậm rãi cho con nghe nha.',
      whatIsIt: 'Bấm nút loa để tớ và các bạn đọc câu hỏi bằng giọng nói thân thiện, dễ thương giúp con hiểu bài dễ dàng.',
      howToIncrease: 'Con có thể chọn tốc độ đọc Chậm để Rùa Con đọc thật từ tốn giúp con có nhiều thời gian suy nghĩ hơn.',
      motivation: 'Hãy bật loa để chúng mình cùng học toán như đang trò chuyện cùng nhau nha!'
    },
    avatar: {
      title: 'Hồ sơ của bé 👦',
      intro: 'Góc nhỏ của riêng bạn nhỏ chăm học.',
      whatIsIt: 'Nơi ghi biệt danh đáng yêu của con, xem các huy hiệu đạt được và chọn người bạn mascot đồng hành học cùng.',
      howToIncrease: 'Con bấm vào đây để đặt tên của mình nhé, Rùa Con rất muốn được gọi tên con đó!',
      motivation: 'Chọn Rùa Con đi cùng để tụi mình cùng tiến bước thật vui vẻ mỗi ngày con nha!'
    }
  }
};

/**
 * Gets the mascot's customized explanation for a specific header indicator.
 * @param {string} mascot - owl | robot | turtle
 * @param {string} indicator - level | streak | xp | unlock | sound | avatar
 * @param {object} progress - current progress state containing level, streak, xp
 * @returns {object} The title, intro, explanation, tip, and motivation text
 */
export function getIndicatorGuide(mascot, indicator, progress) {
  const selectedMascot = INDICATOR_GUIDES[mascot] ? mascot : 'owl';
  const guide = INDICATOR_GUIDES[selectedMascot][indicator] || INDICATOR_GUIDES[selectedMascot]['level'];
  
  // Format variables in intro
  let introFormatted = guide.intro;
  if (indicator === 'level') {
    introFormatted = introFormatted.replace('{level}', progress.level || 1);
  } else if (indicator === 'streak') {
    introFormatted = introFormatted.replace('{streak}', progress.streak || 0);
  } else if (indicator === 'xp') {
    introFormatted = introFormatted.replace('{xp}', progress.xp || 0);
  }
  
  return {
    ...guide,
    intro: introFormatted
  };
}

