// Dictionaries of rich speech lines for each mascot

export const MASCOT_PROFILES = {
  owl: {
    name: 'Cú Ú',
    emoji: '🦉',
    emojis: { idle: '🦉', happy: '🦉🥳', sad: '🦉🥺', shocked: '🦉🧐', sleepy: '🦉😴', worried: '🦉😰' },
    pitch: 1.0,
    rateOffset: 0.95,
    desc: 'Thích hỏi "Tại sao?", lý luận',
    nudgeIntro: 'khuyên con:',
    achievementPraise: 'Cú Ú tự hào về con lắm! Con đã vượt qua thử thách để nhận phần thưởng cao quý này!',
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
    ],
    carelessTemplates: [
      'Thông thái không đi kèm vội vã. Đọc kỹ lại đề nhé con!',
      'Học toán cần cẩn thận hơn một chút nè! Đọc kỹ đề rồi tính nhé con.'
    ],
    lazyTemplates: [
      'Sách vở đang đợi con mở ra đó! Học bài cùng Cú Ú thôi nào!',
      'Đừng để kiến thức bị đóng bụi nhé! Vào luyện tập thôi con.'
    ],
    streakHighTemplates: [
      'Vĩ đại quá! Con đang tiến bộ vượt bậc với chuỗi đúng liên tiếp!',
      'Trí tuệ của con sáng suốt như ngọn hải đăng vậy! Chuỗi đúng siêu đẳng!'
    ]
  },
  robot: {
    name: 'Rô Bốt',
    emoji: '🤖',
    emojis: { idle: '🤖', happy: '🤖⚡', sad: '🤖⚙️', shocked: '🤖⁉️', sleepy: '🤖😴', worried: '🤖🚨' },
    pitch: 1.25,
    rateOffset: 1.05,
    desc: 'Logic, vẽ sơ đồ sơ chuẩn',
    nudgeIntro: 'nhận thấy:',
    achievementPraise: 'Tuyệt vời! Con đã mở khóa mã lệnh thành tích mới. Tiếp tục tối ưu hiệu suất nhé!',
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
    ],
    carelessTemplates: [
      'Cảnh báo: Tốc độ xử lý quá nhanh dễ gây sai sót. Hãy phân tích lại!',
      'Hệ thống phát hiện lệnh nhập nhanh bất thường. Vui lòng đọc kỹ câu hỏi.'
    ],
    lazyTemplates: [
      'Hệ thống đã ngoại tuyến quá lâu. Khởi động chương trình học toán thôi!',
      'Nạp năng lượng tư duy nào! Hệ thống đang chờ tín hiệu học tập từ con.'
    ],
    streakHighTemplates: [
      'Hiệu suất đạt tối đa! Con đang duy trì chuỗi xử lý hoàn hảo!',
      'Tốc độ và sự chính xác đạt 100%! Chuỗi đúng liên tục hoạt động tốt!'
    ]
  },
  turtle: {
    name: 'Rùa Con',
    emoji: '🐢',
    emojis: { idle: '🐢', happy: '🐢🎉', sad: '🐢💧', shocked: '🐢🧐', sleepy: '🐢😴', worried: '🐢😰' },
    pitch: 0.85,
    rateOffset: 0.88,
    desc: 'Kiên trì, đi chậm mà chắc',
    nudgeIntro: 'khen ngợi:',
    achievementPraise: 'Ôi con giỏi quá! Huy hiệu mới xinh xắn này hoàn toàn xứng đáng với sự kiên trì của con.',
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
    ],
    carelessTemplates: [
      'Chậm mà chắc con ơi! Đọc kỹ đề rồi hãy nhấn nhé.',
      'Rùa khuyên con nên đi chậm để tránh vấp ngã nha con. Đọc kỹ đề nhé.'
    ],
    lazyTemplates: [
      'Mỗi ngày một chút, kiên trì sẽ thành công! Vào học thôi con ơi.',
      'Rùa đang đợi con cùng bò qua thử thách toán mới nè!'
    ],
    streakHighTemplates: [
      'Sự kiên trì của con đã đơm hoa kết trái rồi! Chuỗi đúng tuyệt quá!',
      'Chuỗi đúng liên tiếp thật ấn tượng! Rùa vỗ tay khen con nè.'
    ]
  },
  babyshark: {
    name: 'Baby Shark',
    emoji: '🦈',
    emojis: { idle: '🦈', happy: '🦈🌈', sad: '🦈🥺', shocked: '🦈⁉️', sleepy: '🦈😴', worried: '🦈😰' },
    pitch: 1.4,
    rateOffset: 1.1,
    desc: 'Năng động, vui nhộn vui vẻ',
    nudgeIntro: 'quẫy đuôi bảo:',
    achievementPraise: 'Doo doo doo! Quá xịn sò! Con đã mở khóa được một kho báu thành tích mới dưới đại dương rồi!',
    praiseExclamations: [
      'Doo doo doo! Quá tuyệt!',
      'Wow! Cá mập vỗ vây!',
      'Đúng rồi! Quẫy đuôi reo mừng!',
      'Cá mập con khen ngợi!',
      'Xuất sắc luôn nè!'
    ],
    praiseTemplates: [
      'Con giải toán nhanh như tốc độ cá mập bơi!',
      'Một đáp án chính xác tuyệt đối như ngọc trai biển sâu!',
      'Doo doo doo! Trí tuệ của con đang lướt sóng rất mượt mà!',
      'Bé học giỏi thế này thì cả gia đình cá mập đều tự hào!'
    ],
    encourageExclamations: [
      'Doo doo doo... Chưa trúng rạn san hô rồi!',
      'Ồ, một đợt sóng cuốn nhẹ!',
      'Sóng biển xô lệch đáp án mất rồi!'
    ],
    encourageTemplates: [
      'Cùng thử lại góc bơi khác nhé! Con làm được mà!',
      'Đừng lo, hít một hơi thật sâu như khi bơi dưới đại dương và xem kỹ lại đề nha!',
      'Doo doo doo! Quay đầu bơi lại và chọn đáp án đúng hơn nào!'
    ],
    carelessTemplates: [
      'Bơi chậm lại một tí, ngắm kỹ san hô toán học rồi trả lời nha!',
      'Ối! Nhấn nhanh quá coi chừng va phải đá ngầm đó con!'
    ],
    lazyTemplates: [
      'Doo doo doo... Con đi đâu lâu thế? Về biển học toán cùng bạn Shark nào!',
      'Đại dương kiến thức đang vẫy gọi, bơi vào học bài thôi con!'
    ],
    streakHighTemplates: [
      'Bùng nổ đại dương luôn! Con giỏi quá đi! Doo doo doo!',
      'Chuỗi đúng siêu đỉnh, sóng vỗ rào rào chúc mừng chiến tích của con!'
    ]
  },
  poli: {
    name: 'Poli Cảnh Sát',
    emoji: '🚓',
    emojis: { idle: '🚓', happy: '🚓🚨', sad: '🚓🥺', shocked: '🚓⁉️', sleepy: '🚓😴', worried: '🚓⚠️' },
    pitch: 1.1,
    rateOffset: 1.0,
    desc: 'Dũng cảm, giữ gìn trật tự',
    nudgeIntro: 'nhắc nhở chiến sĩ:',
    achievementPraise: 'Chúc mừng chiến sĩ! Con đã hoàn thành xuất sắc nhiệm vụ và nhận huy hiệu danh giá này!',
    praiseExclamations: [
      'Báo cáo nhiệm vụ: Hoàn thành xuất sắc!',
      'Còi hiệu vang lên: Đúng rồi!',
      'Quá dũng cảm và chính xác!',
      'Lệnh tuần tra: Đạt điểm tối đa!',
      'Mọi thứ an toàn và chuẩn xác!'
    ],
    praiseTemplates: [
      'Con đã giải quyết vụ án toán học này vô cùng tài tình!',
      'Mọi dữ kiện đã được sắp xếp trật tự và đúng luật!',
      'Tuyệt vời! Đội cứu hộ Poli tuyên dương trí thông minh của con!',
      'Đáp án hoàn hảo, xứng đáng nhận huy hiệu cảnh sát danh dự!'
    ],
    encourageExclamations: [
      'Cảnh báo chướng ngại vật!',
      'Có một sự cố giao thông toán học nhẹ!',
      'Radar phát hiện lỗi sai!'
    ],
    encourageTemplates: [
      'Đội cứu hộ Poli sẵn sàng hỗ trợ con! Hãy xem kỹ gợi ý và rẽ hướng tư duy nhé!',
      'Không sao cả, cảnh sát dũng cảm không lùi bước! Cùng tuần tra lại đề bài nha!',
      'Chúng ta hãy kiểm tra kỹ lại bản đồ dữ kiện của đề bài để tìm đáp án đúng nha!'
    ],
    carelessTemplates: [
      'Chú ý an toàn! Đi quá tốc độ dễ gây tai nạn toán học đó. Đi chậm lại nhé con!',
      'Poli nhắc nhở: Tuân thủ quy tắc đọc kỹ đề trước khi bấm nút nha.'
    ],
    lazyTemplates: [
      'Đội tuần tra Poli đã sẵn sàng lên đường! Con cũng xuất phát học toán thôi!',
      'Đừng để động cơ bị rỉ sét, vào luyện tập tuần tra cùng Poli nào!'
    ],
    streakHighTemplates: [
      'Nhiệm vụ hoàn thành xuất sắc! Con xứng đáng nhận huy chương chuỗi đúng!',
      'Chuỗi đúng tuyệt vời, tuần tra giao thông toán học cực kỳ an toàn!'
    ]
  },
  steve: {
    name: 'Steve Minecraft',
    emoji: '⛏️',
    emojis: { idle: '⛏️', happy: '⛏️💎', sad: '⛏️💀', shocked: '⛏️💥', sleepy: '⛏️😴', worried: '⛏️🔥' },
    pitch: 0.8,
    rateOffset: 0.9,
    desc: 'Sáng tạo, xây dựng logic',
    nudgeIntro: 'chế tạo gợi ý:',
    achievementPraise: 'Level-up! Con vừa thu thập thành công khối thành tích siêu hiếm này, chế tạo giáp xịn thôi!',
    praiseExclamations: [
      'Đào trúng kim cương rồi!',
      'Ráp khối gạch khít khao!',
      'Chế tạo thành công!',
      'Wow! Cấp độ Level-up!',
      'Kho báu logic đã mở!'
    ],
    praiseTemplates: [
      'Logic của con vững chắc như khối Obsidian vậy!',
      'Con vừa xây xong một cây cầu logic siêu đẹp dẫn tới đáp án đúng!',
      'Tìm thấy rương kho báu trí tuệ rồi! Con giỏi quá!',
      'Logic được đặt đúng vị trí, khối gạch toán học đã hoàn chỉnh!'
    ],
    encourageExclamations: [
      'Coi chừng Creeper!',
      'Khối gạch đặt chưa khớp rồi!',
      'Đập đi xây lại nào!'
    ],
    encourageTemplates: [
      'Sử dụng gợi ý giống như bật đuốc trong hang tối, thử lại nhé con!',
      'Logic này chưa khớp công thức chế tạo rồi. Đọc kỹ lại đề và ráp lại xem sao!',
      'Không sợ mất tài nguyên, làm sai thì mình đào lại khối khác tốt hơn nha!'
    ],
    carelessTemplates: [
      'Đào đá cuội cũng cần nhắm trúng chứ đào bừa chỉ hỏng cúp thôi con ơi! Nhìn kỹ lại đề nhé!',
      'Đừng vội đặt khối block kẻo sập hầm đó nha con!'
    ],
    lazyTemplates: [
      'Kim cương đang đợi con khai thác ở tầng hầm tiếp theo kìa! Vào đào thôi!',
      'Ngủ trong nhà gỗ đủ rồi, xách cúp đi học toán kiếm kim cương nào!'
    ],
    streakHighTemplates: [
      'Wow! Con vừa đào trúng một mạch kim cương khổng lồ với chuỗi đúng này!',
      'Chế tạo thành công chuỗi đúng siêu cấp, giáp kim cương lấp lánh!'
    ]
  },
  elsa: {
    name: 'Công chúa Elsa',
    emoji: '❄️',
    emojis: { idle: '❄️', happy: '❄️👑', sad: '❄️🥺', shocked: '❄️⁉️', sleepy: '❄️😴', worried: '❄️😰' },
    pitch: 1.2,
    rateOffset: 0.95,
    desc: 'Dịu dàng, phép thuật toán học',
    nudgeIntro: 'dịu dàng bảo:',
    achievementPraise: 'Lấp lánh tuyệt đẹp! Huy hiệu băng giá này đang tỏa sáng để chúc mừng sự thông minh của con!',
    praiseExclamations: [
      'Lấp lánh băng giá! Chuẩn xác!',
      'Phép thuật tuyết rơi! Quá tuyệt!',
      'Sáng như viên pha lê băng!',
      'Đẹp như lâu đài tuyết!',
      'Phép màu lấp lánh!'
    ],
    praiseTemplates: [
      'Trí tuệ của con sáng lấp lánh như viên pha lê tuyết vậy!',
      'Giải toán xuất sắc! Phép màu toán học đang tỏa sáng quanh con!',
      'Một bước lập luận trong trẻo và chuẩn xác vô cùng!',
      'Cơn mưa tuyết lấp lánh đang chúc mừng sự thông minh của con đó!'
    ],
    encourageExclamations: [
      'Ồ, băng đang hơi nứt rồi!',
      'Bông tuyết bay chệch hướng mất rồi!',
      'Gió tuyết đang che mờ đáp án!'
    ],
    encourageTemplates: [
      'Hãy để Elsa sưởi ấm bộ não và cùng đọc kỹ gợi ý để thử lại nhé!',
      'Không sao đâu con yêu, phép thuật cần sự kiên trì. Mình thử vẽ lại đường băng logic nha!',
      'Bình tĩnh nào, tuyết tan sẽ lộ ra câu trả lời chính xác. Xem lại đề cùng ta nha!'
    ],
    carelessTemplates: [
      'Băng giá cần thời gian để kết tinh. Đừng vội vã, hãy để suy nghĩ của con lấp lánh nhé!',
      'Chậm lại một chút để phép thuật đóng băng đáp án chính xác hơn con yêu.'
    ],
    lazyTemplates: [
      'Lâu đài băng đang lạnh lẽo vì thiếu tiếng cười toán học của con đó. Luyện tập nào!',
      'Hãy để ngọn lửa học tập sưởi ấm lâu đài băng giá của chúng ta nhé!'
    ],
    streakHighTemplates: [
      'Phép thuật băng tuyết đang nở rộ rực rỡ quanh con! Chuỗi đúng quá lộng lẫy!',
      'Con đã kiến tạo một vương quốc toán học tuyết rơi tuyệt đẹp rồi!'
    ]
  },
  pinkfong: {
    name: 'Pinkfong',
    emoji: '🦊',
    emojis: { idle: '🦊', happy: '🦊⭐️', sad: '🦊🥺', shocked: '🦊⁉️', sleepy: '🦊😴', worried: '🦊😰' },
    pitch: 1.35,
    rateOffset: 1.05,
    desc: 'Đáng yêu, hát nhạc kỳ diệu',
    nudgeIntro: 'kể chuyện:',
    achievementPraise: 'Hoshi Mogi! Một ngôi sao thành tích kỳ diệu đã xuất hiện để dành tặng cho bạn nhỏ siêu ngoan!',
    praiseExclamations: [
      'Hoshi Mogi! Đúng rồi!',
      'Ngôi sao may mắn tỏa sáng!',
      'Wow! Kỳ diệu quá!',
      'Nhạc vui vang lên!',
      'Đáng yêu xuất sắc!'
    ],
    praiseTemplates: [
      'Pinkfong tặng con một ngôi sao trí tuệ lấp lánh nhất!',
      'Con giải toán hay và nhịp nhàng như một bài hát vui nhộn vậy!',
      'Ngôi sao phép thuật đã kích hoạt nhờ đáp án chính xác của con!',
      'Vừa học vừa vui, con làm tốt hơn cả mong đợi của Pinkfong đó!'
    ],
    encourageExclamations: [
      'Ồ, phép thuật chưa hoạt động!',
      'Ngôi sao lấp lánh tạm ẩn đi!',
      'Gậy phép thuật bị lệch một tí!'
    ],
    encourageTemplates: [
      'Hát một giai điệu ngắn rồi cùng xem lại gợi ý để thử lại nha con!',
      'Không sao đâu, phép thuật toán học luôn cần thử nghiệm lại mà! Cố lên con!',
      'Con có năng lực kỳ diệu trong mình, đọc lại đề một lần nữa sẽ làm được thôi!'
    ],
    carelessTemplates: [
      'Phép thuật sao cần ngắm kỹ mục tiêu nha! Đọc lại đề bài một xíu nào con!',
      'Bùm chíu! Đi chậm lại chút xíu để phép thuật chuẩn xác hơn nhé!'
    ],
    lazyTemplates: [
      'Ngôi sao may mắn đang nhấp nháy gọi tên con học bài đó! Nhanh chân lên nào!',
      'Pinkfong nhớ con lắm rồi, vào học bài cùng âm nhạc kỳ diệu thôi!'
    ],
    streakHighTemplates: [
      'Con là ngôi sao sáng nhất dải ngân hà TonyMath hôm nay với chuỗi đúng!',
      'Phép thuật rực rỡ! Chuỗi đúng liên tiếp siêu phàm của bạn nhỏ!'
    ]
  },
  peppa: {
    name: 'Heo Peppa',
    emoji: '🐷',
    emojis: { idle: '🐷', happy: '🐷🎉', sad: '🐷🥺', shocked: '🐷🐽', sleepy: '🐷😴', worried: '🐷😰' },
    pitch: 1.15,
    rateOffset: 1.0,
    desc: 'Tinh nghịch, nhảy vũng nước',
    nudgeIntro: 'cười khì khì khuyên:',
    achievementPraise: 'Oink oink! Tuyệt quá! Huy hiệu mới này rất xinh xắn, chúng mình cùng cầm nó nhảy vũng nước reo mừng nha!',
    praiseExclamations: [
      'Oink oink! Đúng rồi!',
      'Cười khì khì! Quá giỏi!',
      'Nhảy vũng nước reo mừng!',
      'Tuyệt vời ông mặt trời!',
      'Quá đáng yêu!'
    ],
    praiseTemplates: [
      'Chúng mình cùng nhảy lên vũng nước bong bóng reo hò chúc mừng nào!',
      'Con làm đúng rồi! Cả gia đình Peppa đang vỗ tay cổ vũ con nè!',
      'Ngọt ngào như một chiếc bánh ngọt, con giải toán xuất sắc quá!',
      'Oink oink! Tư duy của con thật nhanh và đáng yêu làm sao!'
    ],
    encourageExclamations: [
      'Oink... Chưa đúng rồi con ơi!',
      'Ồ, bị trượt chân trên bùn rồi!',
      'Rơi vào vũng nước sâu mất rồi!'
    ],
    encourageTemplates: [
      'Cùng Peppa lau sạch bùn đất trên người rồi xem lại bài toán nha!',
      'Không sao cả, ngã thì mình lại đứng lên cười vang và làm lại nhé, oink oink!',
      'Đọc lại đề thật thong thả như khi Peppa đi dạo chơi cùng George nha con!'
    ],
    carelessTemplates: [
      'Oink oink! Nhảy vũng bùn cũng phải nhìn kỹ chứ nhảy nhầm vũng sâu là ướt hết đó!',
      'Đọc kỹ đề bài rồi hãy nhảy sang câu tiếp theo nha con yêu!'
    ],
    lazyTemplates: [
      'Vũng nước bong bóng đang đợi chúng mình nhảy lên chơi đó! Vào học nhanh nào!',
      'Oink oink! Hôm nay con chưa học bài đúng không nè? Đi thôi nào!'
    ],
    streakHighTemplates: [
      'Cười lớn oink oink! Con giỏi nhất luôn! Cả nhà heo tự hào vì chuỗi đúng này!',
      'Huy chương vàng cho chuỗi trả lời đúng liên tiếp của con!'
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
export function getMascotSpeech(mascot, isCorrect, originalMessage, optionsOrArchetype) {
  const profile = MASCOT_PROFILES[mascot] || MASCOT_PROFILES.owl;
  const cleanMsg = originalMessage ? originalMessage.trim() : '';

  let options = {};
  let archetype = null;
  if (typeof optionsOrArchetype === 'string') {
    archetype = optionsOrArchetype;
  } else if (typeof optionsOrArchetype === 'object' && optionsOrArchetype !== null) {
    options = optionsOrArchetype;
  }

  // 1. Check if lazy state is requested
  if (options.isLazy) {
    const lazyPool = profile.lazyTemplates || ['Cùng học toán thôi nào!'];
    return lazyPool[Math.floor(Math.random() * lazyPool.length)];
  }

  // 2. Check if careless state (rushing) is triggered
  if (options.isCareless && !isCorrect) {
    const carelessPool = profile.carelessTemplates || ['Đọc kỹ lại đề bài nhé!'];
    return `${carelessPool[Math.floor(Math.random() * carelessPool.length)]} ${cleanMsg}`.trim();
  }

  // 3. Check if high streak is triggered on correct answers
  if (isCorrect && options.currentStreak && options.currentStreak >= 5) {
    const streakPool = profile.streakHighTemplates || ['Con giỏi quá! Chuỗi đúng liên tiếp!'];
    return `${streakPool[Math.floor(Math.random() * streakPool.length)]} ${cleanMsg}`.trim();
  }

  if (archetype === 'pioneer') {
    if (isCorrect) {
      const pioneerPraises = [
        `Con suy nghĩ rất cẩn thận và chính xác!`,
        `Chuẩn xác! Sự tỉ mỉ đã giúp con giải đúng rồi đó!`,
        `Tuyệt vời! Con đã chậm lại một nhịp và làm đúng rồi!`
      ];
      const template = pioneerPraises[Math.floor(Math.random() * pioneerPraises.length)];
      const exc = profile.praiseExclamations[Math.floor(Math.random() * profile.praiseExclamations.length)];
      return `${exc} ${template} ${cleanMsg}`.trim();
    } else {
      const pioneerEncourages = [
        `Bình tĩnh nào con ơi. Con đang làm rất nhanh, thử dừng lại 2 giây đọc thật kỹ lại câu hỏi nha.`,
        `Đừng vội vã chọn đáp án nhé, đọc kỹ lại sơ đồ và dữ kiện cùng tớ nào!`,
        `Không cần vội đâu con! Bình tĩnh rà soát lại các con số một lần nữa nhé.`
      ];
      const template = pioneerEncourages[Math.floor(Math.random() * pioneerEncourages.length)];
      const exc = profile.encourageExclamations[Math.floor(Math.random() * profile.encourageExclamations.length)];
      return `${exc} ${cleanMsg} ${template}`.trim();
    }
  }

  if (archetype === 'budding_thinker') {
    if (isCorrect) {
      const buddingPraises = [
        `Ôi con giỏi quá! Tớ vô cùng tự hào về sự cố gắng vượt qua thử thách của con!`,
        `Con thấy chưa? Con tự suy nghĩ và làm được rồi nè, xuất sắc quá!`,
        `Tuyệt vời! Con đã dũng cảm đưa ra câu trả lời và đúng rồi!`
      ];
      const template = buddingPraises[Math.floor(Math.random() * buddingPraises.length)];
      const exc = profile.praiseExclamations[Math.floor(Math.random() * profile.praiseExclamations.length)];
      return `${exc} ${template} ${cleanMsg}`.trim();
    } else {
      const buddingEncourages = [
        `Không sao đâu con yêu, sai một chút là cách bộ não con luyện tập để mạnh mẽ hơn mà. Thử lại cùng tớ nhé!`,
        `Sai là một phần của học tập. Con đang làm rất tốt, cứ thong thả suy nghĩ và thử lại nhé.`,
        `Đừng lo lắng nhé con yêu, tớ luôn ở đây đồng hành cùng con. Mình xem lại gợi ý nha.`
      ];
      const template = buddingEncourages[Math.floor(Math.random() * buddingEncourages.length)];
      const exc = profile.encourageExclamations[Math.floor(Math.random() * profile.encourageExclamations.length)];
      return `${exc} ${cleanMsg} ${template}`.trim();
    }
  }

  if (archetype === 'active_seeker') {
    if (isCorrect) {
      const seekerPraises = [
        `Quá xịn sò! Một bước tiến siêu ngầu tiến gần tới kho báu!`,
        `Rất vui nhộn và chính xác! Chúng mình cùng lướt sóng qua câu tiếp theo nào!`,
        `Quá đỉnh! Điểm vàng đã thuộc về nhà thám hiểm thông thái!`
      ];
      const template = seekerPraises[Math.floor(Math.random() * seekerPraises.length)];
      const exc = profile.praiseExclamations[Math.floor(Math.random() * profile.praiseExclamations.length)];
      return `${exc} ${template} ${cleanMsg}`.trim();
    } else {
      const seekerEncourages = [
        `Ồ, lệch một tí rồi! Chúng mình cùng quay lại tìm chiếc rương kho báu đáp án đúng nhé!`,
        `Chưa trúng rạn san hô rồi! Cố gắng vượt qua thử thách này để mở quà nha!`,
        `Tiếc một chút xíu, quay đầu bơi lại và chọn lại đáp án đúng cùng tớ nào!`
      ];
      const template = seekerEncourages[Math.floor(Math.random() * seekerEncourages.length)];
      const exc = profile.encourageExclamations[Math.floor(Math.random() * profile.encourageExclamations.length)];
      return `${exc} ${cleanMsg} ${template}`.trim();
    }
  }

  if (archetype === 'scholar') {
    if (isCorrect) {
      const scholarPraises = [
        `Lập luận cực kỳ thông thái! Con hãy thử khiêu chiến tốc độ nhanh hơn ở câu sau nhé!`,
        `Chính xác! Con tư duy vô cùng khoa học và mạch lạc.`,
        `Xuất sắc! Phương pháp giải rất tối ưu và chuẩn mực.`
      ];
      const template = scholarPraises[Math.floor(Math.random() * scholarPraises.length)];
      const exc = profile.praiseExclamations[Math.floor(Math.random() * profile.praiseExclamations.length)];
      return `${exc} ${template} ${cleanMsg}`.trim();
    } else {
      const scholarEncourages = [
        `Ồ, một chi tiết nhỏ chưa khớp. Hãy thử phân tích lại một chút xem sao con nhé.`,
        `Thuật toán chưa tối ưu rồi. Đọc lại đề và kiểm tra lại phép tính nha con.`,
        `Gần đúng rồi! Con hãy xem lại các dữ kiện để điều chỉnh lại lập luận nhé.`
      ];
      const template = scholarEncourages[Math.floor(Math.random() * scholarEncourages.length)];
      const exc = profile.encourageExclamations[Math.floor(Math.random() * profile.encourageExclamations.length)];
      return `${exc} ${cleanMsg} ${template}`.trim();
    }
  }

  // Fallback to normal
  if (isCorrect) {
    const exc = profile.praiseExclamations[Math.floor(Math.random() * profile.praiseExclamations.length)];
    const template = profile.praiseTemplates[Math.floor(Math.random() * profile.praiseTemplates.length)];
    return `${exc} ${template} ${cleanMsg}`.trim();
  } else {
    const exc = profile.encourageExclamations[Math.floor(Math.random() * profile.encourageExclamations.length)];
    const template = profile.encourageTemplates[Math.floor(Math.random() * profile.encourageTemplates.length)];
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
      motivation: 'Đổi người bạn mascot bất cứ lúc nào để có thêm người đồng hành học toán thật vui!'
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
      whatIsIt: 'Nơi lưu trữ biệt danh của siêu nhân toán học và cấu hình người bạn đồng hành.',
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
  },
  babyshark: {
    level: {
      title: 'Cấp độ bơi lội ⭐',
      intro: 'Cấp độ của chú cá mập nhỏ là {level} doo doo!',
      whatIsIt: 'Chỉ số đo độ lướt sóng toán học của con. Bơi càng xa, giải càng nhiều bài thì cấp độ càng cao!',
      howToIncrease: 'Hãy trả lời đúng và hoàn thành các bài học để tăng tốc độ thăng cấp nha!',
      motivation: 'Hãy bơi thật nhanh lên các cấp độ cao hơn để nhận nhiều phần quà từ đại dương nhé!'
    },
    streak: {
      title: 'Chuỗi ngày lướt sóng 🔥',
      intro: 'Con đã duy trì bơi liên tục trong {streak} ngày!',
      whatIsIt: 'Ghi nhận những ngày con chăm học toán không ngừng nghỉ. Chỉ cần bơi vào học mỗi ngày một bài là ngọn lửa cháy mãi!',
      howToIncrease: 'Nhớ đăng nhập và giải toán mỗi ngày để giữ ngọn lửa lướt sóng không bị tắt nhé!',
      motivation: 'Bơi đều đặn mỗi ngày giúp con có cơ bắp tư duy khỏe mạnh như cá mập vậy!'
    },
    xp: {
      title: 'Điểm san hô vàng 🪙',
      intro: 'Con đang có {xp} điểm san hô vàng lấp lánh!',
      whatIsIt: 'Điểm thưởng khi con giải toán thông minh và chính xác dưới đại dương.',
      howToIncrease: 'Hãy suy nghĩ kỹ trước khi chọn đáp án để nhận được nhiều san hô vàng nhất nha.',
      motivation: 'Thu thập thật nhiều san hô vàng để mở ra kho báu toán học của Baby Shark nhé!'
    },
    unlock: {
      title: 'Mở khóa đại dương 🔓',
      intro: 'Chìa khóa mở ra toàn bộ rạn san hô bài học.',
      whatIsIt: 'Cho phép con tự do bơi đến bất cứ bài học nào con muốn mà không cần đi theo thứ tự.',
      howToIncrease: 'Bấm vào đây để bật tắt chế độ tự do khám phá đại dương toán học.',
      motivation: 'Tự do bơi lội rất vui, nhưng bơi theo bản đồ tuần tự sẽ giúp con không bị lạc đường đâu!'
    },
    sound: {
      title: 'Âm thanh đại dương 🔊',
      intro: 'Hãy nghe Baby Shark hát và đọc bài nhé!',
      whatIsIt: 'Bật tắt loa, điều chỉnh giọng đọc và tốc độ đọc của Baby Shark để nghe rõ nhất.',
      howToIncrease: 'Bật tự động đọc để tớ giúp con đọc đề bài mỗi khi bắt đầu bơi vào bài mới nhé!',
      motivation: 'Âm thanh sống động giúp hành trình học toán vui vẻ như một bữa tiệc âm nhạc!'
    },
    avatar: {
      title: 'Hồ sơ cá mập 👦',
      intro: 'Nơi con đặt tên và xem huy hiệu đại dương.',
      whatIsIt: 'Nơi đổi biệt danh dễ thương và chọn bạn đồng hành học tập dưới biển sâu.',
      howToIncrease: 'Hãy đổi tên riêng của con để Baby Shark biết và gọi tên con thật to nhé!',
      motivation: 'Chọn Baby Shark đi cùng để có thêm người đồng hành học toán thật vui con nha!'
    }
  },
  poli: {
    level: {
      title: 'Cấp bậc cảnh sát ⭐',
      intro: 'Cấp bậc hiện tại của chiến sĩ là cấp {level}!',
      whatIsIt: 'Chỉ số đo lường kinh nghiệm tuần tra và giải quyết các bài toán giao thông logic của con.',
      howToIncrease: 'Hoàn thành các nhiệm vụ giải toán xuất sắc để tích lũy điểm thăng quân hàm nhé!',
      motivation: 'Cấp bậc càng cao, con càng xử lý được nhiều tình huống toán học hóc búa bảo vệ thị trấn!'
    },
    streak: {
      title: 'Ngày tuần tra liên tục 🔥',
      intro: 'Đồng chí đã duy trì tuần tra trong {streak} ngày liên tiếp!',
      whatIsIt: 'Kỷ luật và kiên trì là chìa khóa! Chỉ số này ghi nhận việc học tập đều đặn hàng ngày của con.',
      howToIncrease: 'Mỗi ngày hãy thực hiện ít nhất một nhiệm vụ toán học để giữ chuỗi ngày tuần tra liên tục nhé!',
      motivation: 'Chăm chỉ mỗi ngày giúp con giữ vững phong độ và trật tự an toàn toán học tốt nhất!'
    },
    xp: {
      title: 'Huy chương công trạng 🪙',
      intro: 'Con đang có {xp} huy chương vàng tích lũy!',
      whatIsIt: 'Phần thưởng vinh danh khi con giải đúng các phép toán và vượt qua các thử thách một cách an toàn.',
      howToIncrease: 'Hãy kiểm tra kỹ đề bài để tránh lỗi sai và nhận trọn vẹn huy chương vàng thưởng.',
      motivation: 'Tích lũy huy chương để chứng tỏ con là chiến sĩ toán học tinh nhuệ nhất đội cứu hộ!'
    },
    unlock: {
      title: 'Mở khóa tuyến đường 🔓',
      intro: 'Cắp quyền đi vào tất cả các khu vực bài học.',
      whatIsIt: 'Cho phép con đi tuần tra tự do ở bất cứ bài học nào từ lớp 1 đến lớp 5 mà không cần theo trình tự.',
      howToIncrease: 'Bật nút này để mở rộng toàn bộ bản đồ học tập toán học.',
      motivation: 'Tuần tra tự do rất thú vị, nhưng đi theo lộ trình tuần tự sẽ giúp con xây dựng nền tảng vững chắc nhất!'
    },
    sound: {
      title: 'Bộ đàm Poli 🔊',
      intro: 'Hệ thống liên lạc bộ đàm của đội trưởng Poli.',
      whatIsIt: 'Điều chỉnh âm lượng, bật tắt giọng đọc và tốc độ truyền tin bộ đàm của Poli.',
      howToIncrease: 'Bật loa để nhận hướng dẫn bằng giọng nói của Poli ngay khi bắt đầu nhiệm vụ.',
      motivation: 'Nghe giọng Poli qua bộ đàm sẽ giúp con nắm bắt thông tin hiện trường toán học nhanh chóng!'
    },
    avatar: {
      title: 'Thẻ tuần tra học sinh 👦',
      intro: 'Thông tin chiến sĩ toán học đang thực hiện nhiệm vụ.',
      whatIsIt: 'Nơi con ghi biệt danh của mình, xem các huy chương danh dự đạt được và chọn người bạn mascot dẫn đường.',
      howToIncrease: 'Nhấp bút chì để cập nhật tên chiến sĩ trên thẻ tuần tra nhé!',
      motivation: 'Chọn bạn Poli đi tuần tra cùng sẽ giúp con học tập thật quy củ và tiến bộ nhanh chóng!'
    }
  },
  steve: {
    level: {
      title: 'Cấp độ sinh tồn ⭐',
      intro: 'Cấp độ chế tạo hiện tại của con là cấp {level}!',
      whatIsIt: 'Thể hiện sự trưởng thành và khối lượng tài nguyên toán học con đã khai thác thành công.',
      howToIncrease: 'Tích cực đào sâu suy nghĩ, giải đúng các khối toán để tăng điểm kinh nghiệm thăng cấp.',
      motivation: 'Cấp độ càng cao, con càng chế tạo được nhiều công cụ toán học mạnh mẽ hơn!'
    },
    streak: {
      title: 'Chuỗi ngày sinh tồn 🔥',
      intro: 'Con đã sinh tồn chăm chỉ được {streak} ngày liên tiếp!',
      whatIsIt: 'Sự bền bỉ giữ cho đuốc luôn sáng. Chỉ cần học toán mỗi ngày một lần là ngọn lửa sinh tồn sẽ cháy mãi.',
      howToIncrease: 'Nhớ đăng nhập đào kim cương toán học mỗi ngày, đừng để lũ quái vật làm dập tắt chuỗi ngày học nhé!',
      motivation: 'Kiên trì rèn luyện hàng ngày giúp con xây dựng một pháo đài logic vững chãi nhất.'
    },
    xp: {
      title: 'Quặng sắt vàng tích lũy 🪙',
      intro: 'Con đã thu hoạch được {xp} quặng vàng lấp lánh!',
      whatIsIt: 'Tài nguyên quý giá được thưởng khi con giải toán thông minh và chính xác.',
      howToIncrease: 'Hãy suy nghĩ cẩn thận để đào trúng đáp án ngay lần đầu, con sẽ được thưởng thêm nhiều quặng vàng.',
      motivation: 'Hãy gom thật nhiều quặng vàng để chế tạo những bộ giáp thành tích siêu xịn sò nhé!'
    },
    unlock: {
      title: 'Chế độ Creative 🔓',
      intro: 'Quyền tự do xây dựng và di chuyển trên bản đồ.',
      whatIsIt: 'Cho phép con mở khóa tất cả bài học để tự do khám phá bất cứ quặng toán nào con thích.',
      howToIncrease: 'Nhấp vào nút này để bật chế độ sáng tạo tự do hoặc tắt để quay lại chế độ sinh tồn tuần tự.',
      motivation: 'Steve khuyên con nên học theo trình tự để học hỏi được nhiều công thức chế tạo căn bản nhất.'
    },
    sound: {
      title: 'Nhạc nền thế giới Steve 🔊',
      intro: 'Tớ sẽ đồng hành đọc to các khối văn tự cho con.',
      whatIsIt: 'Nơi điều chỉnh âm thanh, bật tắt giọng đọc tự động hoặc thay đổi tốc độ đọc nhanh chậm của Steve.',
      howToIncrease: 'Bật tự động đọc để Steve giúp con đọc đề bài ngay khi bắt đầu khai phá câu hỏi mới nhé.',
      motivation: 'Nghe giọng đọc giúp con hiểu rõ nhiệm vụ cần chế tạo mà không lo bị Creeper quấy rầy!'
    },
    avatar: {
      title: 'Tài khoản thợ mỏ 👦',
      intro: 'Hồ sơ nhân vật của thợ mỏ nhí.',
      whatIsIt: 'Nơi đặt tên nhân vật, xem các khối thành tích đạt được và chọn skin mascot đồng hành.',
      howToIncrease: 'Bấm vào để chỉnh sửa biệt danh của con cho thật ngầu trong thế giới hình vuông nhé.',
      motivation: 'Đổi skin bạn đồng hành sang Steve để bắt đầu hành trình xây dựng thế giới toán học tuyệt vời!'
    }
  },
  elsa: {
    level: {
      title: 'Tầng lâu đài băng ⭐',
      intro: 'Lâu đài tuyết của con đã xây đến tầng {level}!',
      whatIsIt: 'Chỉ số thể hiện mức độ tinh thông phép thuật toán học của con. Càng giải nhiều bài, lâu đài càng cao!',
      howToIncrease: 'Hãy làm đúng các bài toán để tích lũy tinh thể tuyết kinh nghiệm giúp thăng thêm nhiều tầng mới.',
      motivation: 'Hãy xây dựng tòa lâu đài băng của riêng con thật cao và tráng lệ bằng trí thông minh tuyệt hảo!'
    },
    streak: {
      title: 'Vòng tròn phép thuật 🔥',
      intro: 'Phép thuật tuyết được duy trì liên tục trong {streak} ngày!',
      whatIsIt: 'Sự chăm chỉ hàng ngày giúp giữ cho ngọn lửa năng lượng của lâu đài tuyết luôn rực sáng và ấm áp.',
      howToIncrease: 'Hãy ghé thăm vương quốc toán học mỗi ngày và hoàn thành một bài học nhỏ để giữ vòng tròn phép thuật luôn cháy.',
      motivation: 'Luyện tập mỗi ngày giúp phép thuật toán học của con ngày càng mạnh mẽ và thuần thục!'
    },
    xp: {
      title: 'Tinh thể pha lê băng 🪙',
      intro: 'Con đang tích lũy được {xp} tinh thể pha lê lấp lánh!',
      whatIsIt: 'Được ban tặng từ phép thuật tuyết rơi khi con giải đúng các phép toán và suy luận thông minh.',
      howToIncrease: 'Lập luận thật trong trẻo và chính xác để gom về nhiều pha lê băng nhất nhé.',
      motivation: 'Tích lũy thật nhiều tinh thể pha lê băng để biến lâu đài của con lấp lánh kỳ diệu nhất!'
    },
    unlock: {
      title: 'Cổng gió tuyết tự do 🔓',
      intro: 'Mở lối đi tự do đến mọi nẻo đường trong vương quốc.',
      whatIsIt: 'Cho phép con mở khóa tất cả các bài học toán học để tự do khám phá theo ý thích của mình.',
      howToIncrease: 'Bật nút để mở cánh cổng vương quốc hoặc khóa lại để bước đi tuần tự trên những con đường tuyết.',
      motivation: 'Hãy thử đi tuần tự từng bước nhỏ để cảm nhận vẻ đẹp của toán học một cách vững vàng nhất nhé.'
    },
    sound: {
      title: 'Gió hát Elsa 🔊',
      intro: 'Giọng nói dịu dàng của Elsa luôn bên con.',
      whatIsIt: 'Tùy chỉnh âm lượng, bật tắt giọng đọc tự động hoặc chỉnh tốc độ nói của Elsa để dễ lắng nghe nhất.',
      howToIncrease: 'Hãy bật tự động đọc để Elsa đọc to đề bài bằng giọng nói êm ái mỗi khi con bắt đầu câu hỏi nhé.',
      motivation: 'Nghe Elsa đọc bài sẽ giúp con cảm thấy thư thái và dễ dàng tìm ra câu trả lời chính xác!'
    },
    avatar: {
      title: 'Góc công chúa/hoàng tử 👦',
      intro: 'Hồ sơ của bạn nhỏ đáng yêu trong vương quốc.',
      whatIsIt: 'Nơi con tự đặt tên cho mình, ngắm nhìn bộ sưu tập huy hiệu băng giá và chọn người bạn mascot đồng hành.',
      howToIncrease: 'Hãy chọn bút chì để đặt một cái tên thật đẹp phù hợp với vương quốc của chúng mình nhé.',
      motivation: 'Cùng Elsa tạo nên những phép màu toán học và khám phá lâu đài tuyết tuyệt đẹp nào!'
    }
  },
  pinkfong: {
    level: {
      title: 'Cấp độ phép thuật ⭐',
      intro: 'Cấp độ phép thuật của con là cấp {level} đó!',
      whatIsIt: 'Đo lường mức độ thông thái của chú cáo hồng nhí. Càng học toán giỏi, phép thuật của con càng thăng cấp cao!',
      howToIncrease: 'Hãy cùng Pinkfong giải đúng các câu đố toán để tích lũy điểm kinh nghiệm và thăng lên cấp độ mới nhé!',
      motivation: 'Thăng cấp độ thật cao để mở khóa những điều kỳ diệu mới trong hành trình học tập nào!'
    },
    streak: {
      title: 'Ngọn lửa âm nhạc 🔥',
      intro: 'Ngôi sao âm nhạc đang tỏa sáng liên tục {streak} ngày!',
      whatIsIt: 'Ghi nhận sự chuyên cần rèn luyện của con. Chỉ cần học một bài toán mỗi ngày là ngọn lửa âm nhạc sẽ ngân vang mãi!',
      howToIncrease: 'Con đừng quên ghé thăm Pinkfong mỗi ngày học một chút nha, thói quen tốt sẽ giúp con học rất giỏi đó!',
      motivation: 'Duy trì học tập mỗi ngày giúp bộ não con thông minh và nhanh nhẹn như Pinkfong vậy!'
    },
    xp: {
      title: 'Ngôi sao may mắn 🪙',
      intro: 'Con đang có {xp} ngôi sao may mắn đó!',
      whatIsIt: 'Điểm thưởng may mắn được trao tặng khi con trả lời chính xác các bước giải toán.',
      howToIncrease: 'Làm bài cẩn thận để trả lời đúng ngay lần đầu, con sẽ được thưởng nhiều ngôi sao lấp lánh.',
      motivation: 'Tích lũy thật nhiều ngôi sao để chiếu sáng con đường trở thành trạng nguyên toán học tương lai!'
    },
    unlock: {
      title: 'Vòng quay phép thuật 🔓',
      intro: 'Mở khóa toàn bộ thư viện bài học thần kỳ.',
      whatIsIt: 'Chế độ cho phép con mở khóa tất cả các bài học toán học để tự do tham quan và giải bài tùy thích.',
      howToIncrease: 'Nhấp vào nút để kích hoạt vòng quay mở khóa toàn bộ bài học ngay lập tức.',
      motivation: 'Khám phá tự do rất vui, nhưng học tuần tự từ dễ đến khó sẽ giúp phép thuật của con vững chắc hơn!'
    },
    sound: {
      title: 'Giọng nói phép thuật 🔊',
      intro: 'Pinkfong luôn sẵn sàng kể chuyện toán học cho con.',
      whatIsIt: 'Điều chỉnh âm lượng, bật tắt giọng tự động đọc đề bài hoặc thay đổi tốc độ đọc nói của Pinkfong.',
      howToIncrease: 'Bật tự động đọc để Pinkfong đọc to đề bài cho con nghe ngay khi bắt đầu câu hỏi nhé.',
      motivation: 'Nghe đề bài qua giọng nói vui nhộn giúp toán học trở nên dễ hiểu và thú vị hơn rất nhiều!'
    },
    avatar: {
      title: 'Hồ sơ ngôi sao 👦',
      intro: 'Khu vườn cá nhân của bạn nhỏ thông thái.',
      whatIsIt: 'Nơi con đặt tên nickname, xem bộ sưu tập huy hiệu ngôi sao đạt được và chọn người bạn mascot học cùng.',
      howToIncrease: 'Bấm nút sửa để đặt biệt danh thật dễ thương của con nhé, Pinkfong rất muốn biết tên con!',
      motivation: 'Hãy để Pinkfong vẽ những ngôi sao phép thuật kỳ diệu chúc mừng con tiến bộ mỗi ngày!'
    }
  },
  peppa: {
    level: {
      title: 'Cấp độ gia đình ⭐',
      intro: 'Cấp độ vui nhộn hiện tại của con là cấp {level}!',
      whatIsIt: 'Thể hiện sự tiến bộ ngọt ngào của con trong môn Toán. Càng làm nhiều bài, cấp độ Peppa càng tăng cao!',
      howToIncrease: 'Giải đúng bài tập và hoàn thành các bài học toán học để tích lũy điểm thăng cấp cùng Peppa nhé!',
      motivation: 'Thăng cấp thật cao để cùng Peppa nhảy lên những vũng bùn bong bóng lớn nhất vương quốc nha!'
    },
    streak: {
      title: 'Chuỗi ngày vui vẻ 🔥',
      intro: 'Con đã giữ chuỗi ngày học vui vẻ liên tiếp {streak} ngày!',
      whatIsIt: 'Ghi nhận sự kiên trì ghé thăm mỗi ngày. Chỉ cần học ít nhất một bài toán mỗi ngày là chuỗi ngày vui vẻ sẽ tăng lên!',
      howToIncrease: 'Hãy nhớ đăng nhập và học cùng Peppa mỗi ngày, oink oink! Đừng quên nha con!',
      motivation: 'Học tập đều đặn giúp con thông minh hơn và tạo thành thói quen tốt mỗi ngày đó!'
    },
    xp: {
      title: 'Điểm bong bóng vàng 🪙',
      intro: 'Con đang có {xp} bong bóng vàng lấp lánh!',
      whatIsIt: 'Bong bóng vàng khổng lồ được tạo ra mỗi khi con trả lời đúng hoặc giải quyết xuất sắc bài toán.',
      howToIncrease: 'Suy nghĩ thật kỹ và trả lời chính xác để thổi ra thật nhiều bong bóng vàng to đùng nhé!',
      motivation: 'Gom thật nhiều bong bóng vàng để chứng minh con là siêu nhân toán học đáng yêu nhất!'
    },
    unlock: {
      title: 'Bản đồ dạo chơi 🔓',
      intro: 'Chìa khóa mở cửa toàn bộ các bài học toán.',
      whatIsIt: 'Cho phép con mở khóa tất cả các bài học để tự do đi dạo khắp nơi trên bản đồ mà không cần theo thứ tự.',
      howToIncrease: 'Bấm vào để mở hoặc khóa các bài học tùy theo ý muốn dạo chơi của con.',
      motivation: 'Đi từng bước tuần tự như Peppa đi bộ sẽ giúp con hiểu rõ và vững kiến thức toán học hơn đó!'
    },
    sound: {
      title: 'Giọng nói Heo Peppa 🔊',
      intro: 'Oink oink! Peppa thích trò chuyện cùng con lắm!',
      whatIsIt: 'Điều chỉnh loa phát thanh, bật tắt giọng đọc đề bài tự động hoặc đổi tốc độ nói của Peppa ngọt ngào.',
      howToIncrease: 'Tích chọn tự động đọc để tớ đọc to đề bài cho con nghe ngay khi bắt đầu nhiệm vụ nhé.',
      motivation: 'Nghe Peppa đọc bài giúp con hiểu câu đố nhanh hơn và cảm thấy học toán cực kỳ ấm áp!'
    },
    avatar: {
      title: 'Góc nhỏ của Peppa 👦',
      intro: 'Nơi lưu giữ biệt danh đáng yêu của bé.',
      whatIsIt: 'Nơi con sửa tên nickname của mình, ngắm nhìn bộ sưu tập huy hiệu đáng yêu và chọn bạn đồng hành mascot.',
      howToIncrease: 'Con hãy bấm vào bút chì và gõ tên của mình để Peppa được gọi tên con khi khen ngợi nhé!',
      motivation: 'Cùng Peppa nhảy lên vũng bùn bong bóng vui nhộn và học toán thật hào hứng con nha!'
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

