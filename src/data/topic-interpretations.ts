/**
 * topic-interpretations.ts
 * Dataset chuyên sâu giải mã 78 lá bài Tarot (hoặc 22 lá Ẩn Chính + 4 bộ Ẩn Phụ)
 * theo 3 trục chủ đề lớn: TÌNH DUYÊN (love), CÔNG VIỆC/HỌC TẬP (career), TÀI CHÍNH/VẬN MAY (finance).
 * Hoàn toàn miễn phí 0đ API, chạy offline/serverless tức thì và đúng trọng tâm 100%.
 */

import type { TopicId } from '@/lib/schemas';

export interface CardTopicDetail {
  upright: {
    meaning: string;
    advice: string;
    keyword: string;
  };
  reversed: {
    meaning: string;
    advice: string;
    keyword: string;
  };
}

export type TopicInterpretationMap = Record<
  'love' | 'career' | 'finance',
  CardTopicDetail
>;

/**
 * Dataset chi tiết chuẩn chỉnh cho 22 lá Ẩn Chính (Major Arcana IDs 0..21)
 */
export const MAJOR_ARCANA_TOPIC_DATASET: Record<number, TopicInterpretationMap> = {
  // 0: The Fool (Kẻ Khờ)
  0: {
    love: {
      upright: {
        meaning: 'Một khởi đầu tình cảm đầy tươi mới, hồn nhiên và không toan tính. Bạn hoặc đối phương đang bước vào mối quan hệ này với trái tim rộng mở, sẵn sàng đón nhận những rung động chân thật nhất.',
        advice: 'Hãy cho phép mình mở lòng yêu thương mà không để những bóng ma quá khứ trói buộc. Tuy nhiên, hãy nhớ mở mắt để nhìn rõ thực tế nhé!',
        keyword: 'Khởi đầu rung động',
      },
      reversed: {
        meaning: 'Cảnh báo sự bốc đồng, ngây thơ quá mức hoặc đâm đầu vào một mối quan hệ mập mờ, thiếu nghiêm túc khi chưa tìm hiểu kỹ đối phương.',
        advice: 'Đừng lấy chữ "tùy duyên" ra để bao biện cho sự mù quáng. Hãy chậm lại một nhịp và quan sát hành động thực tế của người ấy.',
        keyword: 'Bốc đồng mù quáng',
      },
    },
    career: {
      upright: {
        meaning: 'Thời điểm lý tưởng để khởi động dự án mới, chuyển hướng nghề nghiệp hoặc thử sức với một lĩnh vực bạn hằng ấp ủ. Trực giác và lòng can đảm đang dẫn dắt bạn.',
        advice: 'Dám nghĩ dám làm, đừng để nỗi sợ thất bại kìm hãm bước chân bạn. Bước nhảy niềm tin lúc này sẽ mở ra chân trời mới.',
        keyword: 'Bứt phá hướng đi mới',
      },
      reversed: {
        meaning: 'Thiếu kế hoạch chi tiết, hành động liều lĩnh hoặc ngược lại là sợ hãi đến mức không dám bước khỏi vùng an toàn.',
        advice: 'Chuẩn bị kế hoạch dự phòng và rà soát kỹ các điều khoản trước khi đặt bút ký hay đưa ra quyết định nhảy việc.',
        keyword: 'Thiếu chuẩn bị',
      },
    },
    finance: {
      upright: {
        meaning: 'Cơ hội tài chính mới mẻ đang gõ cửa. Bạn có thể kiếm thêm nguồn thu từ những ý tưởng sáng tạo hoặc dự án tay trái ngoài giờ.',
        advice: 'Dành một khoản nhỏ để thử nghiệm cơ hội mới nhưng giữ kỷ luật chi tiêu cơ bản.',
        keyword: 'Cơ hội sinh lời mới',
      },
      reversed: {
        meaning: 'Chi tiêu bốc đồng, vung tay quá trán cho những sở thích nhất thời hoặc đầu tư mạo hiểm khi chưa hiểu rõ bản chất.',
        advice: 'Khóa bớt thẻ tín dụng, tuyệt đối không tham gia vào các lời mời gọi đầu tư kiếm tiền nhanh kẻo mất trắng.',
        keyword: 'Thất thoát bốc đồng',
      },
    },
  },

  // 1: The Magician (Nhà Ảo Thuật)
  1: {
    love: {
      upright: {
        meaning: 'Sức hút cá nhân cực kỳ mạnh mẽ. Bạn hoàn toàn có đủ sự duyên dáng, thông minh và chủ động để thu hút người trong mộng hoặc hâm nóng mối quan hệ.',
        advice: 'Hãy chủ động bật đèn xanh và tự tin thể hiện sức hút của chính mình. Sự chủ động chân thành sẽ mang lại kết quả ngọt ngào.',
        keyword: 'Chủ động chinh phục',
      },
      reversed: {
        meaning: 'Cẩn thận những lời hứa hẹn hoa mỹ nhưng rỗng tuếch, hoặc dấu hiệu thao túng tâm lý (gaslighting) từ phía đối phương.',
        advice: 'Nhìn vào hành động thực tế thay vì nghe những lời nói ngọt ngào lúc nửa đêm. Đừng để bị dẫn dụ cảm xúc.',
        keyword: 'Thao túng & Văn mẫu',
      },
    },
    career: {
      upright: {
        meaning: 'Bạn đang nắm giữ trọn vẹn các nguồn lực cần thiết: chuyên môn, sự nhạy bén và kỹ năng giao tiếp để làm chủ dự án và ghi điểm với cấp trên/đối tác.',
        advice: 'Tập trung cao độ để biến ý tưởng trên giấy thành sản phẩm thực tế. Đây là lúc tỏa sáng chuyên môn của bạn.',
        keyword: 'Làm chủ cuộc chơi',
      },
      reversed: {
        meaning: 'Nói nhiều làm ít, phân tán năng lượng cho quá nhiều việc cùng lúc hoặc lạm dụng mưu mẹo nơi công sở khiến đồng nghiệp mất lòng tin.',
        advice: 'Tập trung hoàn thành dứt điểm từng đầu việc và giữ tính minh bạch trong mọi cam kết công việc.',
        keyword: 'Phân tán thực lực',
      },
    },
    finance: {
      upright: {
        meaning: 'Khả năng kiếm tiền và biến kiến thức thành thu nhập đang ở đỉnh cao. Bạn có tiềm năng mở rộng dòng tiền thông qua sự nhạy bén thương mại.',
        advice: 'Tận dụng triệt để các kỹ năng sẵn có để đa dạng hóa nguồn thu nhập.',
        keyword: 'Khai thông dòng tiền',
      },
      reversed: {
        meaning: 'Rủi ro bị lừa đảo tài chính qua các chiêu trò tinh vi, hoặc ảo tưởng về những kế hoạch kiếm tiền chưa được kiểm chứng.',
        advice: 'Kiểm tra kỹ lưỡng hợp đồng, tránh xa các phi vụ trung gian đáng ngờ.',
        keyword: 'Cạm bẫy chiêu trò',
      },
    },
  },

  // 2: The High Priestess (Nữ Tư Tế)
  2: {
    love: {
      upright: {
        meaning: 'Mối quan hệ mang chiều sâu tâm hồn và trực giác gắn kết đặc biệt. Có những điều đối phương chưa nói thành lời nhưng bạn đã cảm nhận được rõ mồn một.',
        advice: 'Lắng nghe trực giác nhạy bén của bạn. Giữ khoảng lặng cần thiết để đối phương tự bộc lộ sự chân thành.',
        keyword: 'Trực giác mách bảo',
      },
      reversed: {
        meaning: 'Sự nghi ngờ, che giấu bí mật hoặc cảm giác bất an âm ỉ. Bạn đang cố tình phớt lờ linh cảm cảnh báo đỏ chỉ vì muốn tin vào điều dễ nghe.',
        advice: 'Đừng giả điếc trước tiếng nói bên trong. Nếu linh cảm thấy điều gì mập mờ, hãy bình tĩnh tìm hiểu sự thật.',
        keyword: 'Bí mật & Bất an',
      },
    },
    career: {
      upright: {
        meaning: 'Thời điểm thích hợp cho việc nghiên cứu sâu, học tập nâng cao hoặc hoạch định chiến lược trong im lặng thay vì khoe mẽ quá sớm.',
        advice: 'Giữ bí mật kế hoạch cho đến khi hoàn thiện 100%. Lắng nghe kinh nghiệm nội tại và quan sát thế trận xung quanh.',
        keyword: 'Chiến lược kín kẽ',
      },
      reversed: {
        meaning: 'Thiếu minh bạch trong thông tin nội bộ, đàm tiếu thị phi hoặc bạn đang đưa ra quyết định dựa trên cảm tính thay vì dữ liệu chính xác.',
        advice: 'Tìm hiểu ngọn ngành thông tin trước khi lên tiếng, tránh xa các phe phái nơi công sở.',
        keyword: 'Thị phi ngầm',
      },
    },
    finance: {
      upright: {
        meaning: 'Giữ bí mật về tình hình tài chính của bạn. Dòng tiền ổn định khi bạn biết kiềm chế chi tiêu và tích lũy âm thầm.',
        advice: 'Tích lũy quỹ dự phòng kín đáo, không nên cho vay mượn dựa trên lời nài nỉ cảm tính.',
        keyword: 'Tích lũy kín đáo',
      },
      reversed: {
        meaning: 'Khoản chi phát sinh bất ngờ do những điều khoản ẩn mà bạn không để ý, hoặc bị thất thoát tiền bạc vì tin lầm người.',
        advice: 'Soát lại sao kê và các hóa đơn định kỳ để cắt giảm chi phí rò rỉ.',
        keyword: 'Chi phí ẩn giấu',
      },
    },
  },

  // 3: The Empress (Nữ Hoàng)
  3: {
    love: {
      upright: {
        meaning: 'Năng lượng ngập tràn sự dịu dàng, quyến rũ và đủ đầy. Mối quan hệ đang được nuôi dưỡng ấm áp, đối phương trân trọng sự hiện diện của bạn.',
        advice: 'Tập trung yêu thương bản thân, tỏa sáng nét đẹp tự nhiên. Bạn xứng đáng được nâng niu và chiều chuộng.',
        keyword: 'Yêu bản thân trù phú',
      },
      reversed: {
        meaning: 'Hy sinh quá nhiều và đóng vai "bảo mẫu cảm xúc" cho đối phương, dẫn đến kiệt sức và cảm giác bị xem là điều hiển nhiên.',
        advice: 'Ngừng nuông chiều người không biết trân trọng. Thu hồi năng lượng về để chăm sóc lại tâm hồn và cơ thể mình.',
        keyword: 'Kiệt sức vì cho đi',
      },
    },
    career: {
      upright: {
        meaning: 'Môi trường làm việc thuận lợi, ý tưởng sáng tạo dồi dào và các dự án của bạn đang trong giai đoạn đơm hoa kết trái.',
        advice: 'Nuôi dưỡng các mối quan hệ đồng nghiệp tốt đẹp và phát huy tối đa khả năng sáng tạo nghệ thuật/nội dung.',
        keyword: 'Mùa màng bội thu',
      },
      reversed: {
        meaning: 'Bế tắc ý tưởng, môi trường làm việc ngột ngạt hoặc bạn đang ôm đồm việc của người khác khiến tiến độ cá nhân bị đình trệ.',
        advice: 'Học cách từ chối khéo léo và dành thời gian nghỉ ngơi để nạp lại nguồn cảm hứng.',
        keyword: 'Cạn kiệt sáng tạo',
      },
    },
    finance: {
      upright: {
        meaning: 'Tài chính thịnh vượng, dòng tiền dồi dào và có lộc ăn uống, quà tặng hoặc khoản thưởng xứng đáng với công sức bỏ ra.',
        advice: 'Tự thưởng cho bản thân một cách hợp lý và tiếp tục duy trì những thói quen tài chính lành mạnh.',
        keyword: 'Tài lộc dồi dào',
      },
      reversed: {
        meaning: 'Chi tiêu mua sắm quá đà để xả stress, hoặc lạm phát chi tiêu cho các tiện nghi xa xỉ vượt quá ngân sách.',
        advice: 'Lập lại hạn mức chi tiêu cho việc làm đẹp, mua sắm giải trí.',
        keyword: 'Vung tay mua sắm',
      },
    },
  },

  // 4: The Emperor (Hoàng Đế)
  4: {
    love: {
      upright: {
        meaning: 'Mối quan hệ có nền tảng vững chắc, rõ ràng và có trách nhiệm. Đối phương hoặc bạn là người đáng tin cậy, che chở bằng hành động thực tế.',
        advice: 'Thiết lập các ranh giới lành mạnh và nguyên tắc tôn trọng lẫn nhau. Sự rõ ràng sẽ giúp tình cảm bền vững.',
        keyword: 'Vững chãi & Rõ ràng',
      },
      reversed: {
        meaning: 'Sự kiểm soát ngột ngạt, gia trưởng, cái tôi quá lớn hoặc áp đặt suy nghĩ lên đối phương khiến khoảng cách ngày càng lớn.',
        advice: 'Hạ bớt cái tôi xuống, lắng nghe cảm xúc của người kia thay vì chỉ muốn phân bua đúng sai.',
        keyword: 'Kiểm soát & Cứng nhắc',
      },
    },
    career: {
      upright: {
        meaning: 'Thời điểm xác lập quyền lực, khả năng lãnh đạo và kỷ luật thép. Bạn có đủ năng lực để kiểm soát toàn bộ cục diện công việc.',
        advice: 'Hành động có cấu trúc, tuân thủ kỷ luật và mục tiêu đề ra. Sự kiên định sẽ đưa bạn lên vị trí dẫn đầu.',
        keyword: 'Lãnh đạo & Kỷ luật',
      },
      reversed: {
        meaning: 'Lạm quyền, xung đột với sếp/cấp trên hoặc mất phương hướng do thiếu kế hoạch tổ chức khoa học.',
        advice: 'Linh hoạt điều chỉnh phương pháp quản lý, tránh đối đầu trực diện khi chưa đủ thế mạnh.',
        keyword: 'Xung đột quyền lực',
      },
    },
    finance: {
      upright: {
        meaning: 'Kiểm soát tài chính cực kỳ chặt chẽ, tài sản được bảo vệ an toàn và các khoản đầu tư đi vào quỹ đạo ổn định.',
        advice: 'Tuân thủ ngân sách đã lập, đầu tư vào các kênh an toàn mang tính dài hạn.',
        keyword: 'Quản trị ngân sách thép',
      },
      reversed: {
        meaning: 'Tổn thất tài chính do sự bảo thủ, không chịu thay đổi mô hình hoặc thói quen tiêu tiền phô trương uy quyền.',
        advice: 'Rà soát lại danh mục đầu tư, cắt bỏ những khoản đang gánh lỗ vì sĩ diện.',
        keyword: 'Tổn thất do bảo thủ',
      },
    },
  },

  // 5: The Hierophant (Giáo Hoàng)
  5: {
    love: {
      upright: {
        meaning: 'Hướng tới một cam kết chính thức, nghiêm túc và có sự đồng điệu về hệ giá trị sống. Mối quan hệ có sự ủng hộ từ hai bên gia đình hoặc vòng tròn bạn bè.',
        advice: 'Đưa mối quan hệ ra ánh sáng và thảo luận thẳng thắn về tương lai lâu dài. Không có chỗ cho sự mập mờ.',
        keyword: 'Cam kết chính thức',
      },
      reversed: {
        meaning: 'Cảm giác bị gò bó bởi định kiến truyền thống, gia đình phản đối hoặc hai người có quan điểm sống quá lệch pha nhau.',
        advice: 'Tự hỏi điều gì thực sự mang lại hạnh phúc cho bạn thay vì chỉ cố làm vừa lòng kỳ vọng của người ngoài.',
        keyword: 'Lệch pha giá trị',
      },
    },
    career: {
      upright: {
        meaning: 'Nhận được sự chỉ bảo quý báu từ người thầy, tiền bối (mentor) có kinh nghiệm. Phù hợp với việc làm việc trong tổ chức lớn, trường học hoặc quy trình bài bản.',
        advice: 'Lắng nghe lời khuyên từ người đi trước và tuân thủ các chuẩn mực đạo đức nghề nghiệp.',
        keyword: 'Người dẫn đường',
      },
      reversed: {
        meaning: 'Tư duy lối mòn, quan liêu, môi trường làm việc kìm hãm sự sáng tạo hoặc lời khuyên từ tiền bối không còn phù hợp với thực tế mới.',
        advice: 'Dám phá vỡ các khuôn mẫu cũ kỹ để tìm ra cách làm mới hiệu quả hơn.',
        keyword: 'Lối mòn giáo điều',
      },
    },
    finance: {
      upright: {
        meaning: 'Tài chính an toàn khi đi theo các phương thức tích lũy truyền thống như gửi tiết kiệm, vàng hoặc tài sản hữu hình.',
        advice: 'Tránh xa các kênh đầu tư mạo hiểm mới nổi; tuân thủ các nguyên tắc tài chính an toàn.',
        keyword: 'Tài chính an toàn',
      },
      reversed: {
        meaning: 'Chi tiền mù quáng theo đám đông hoặc bị áp đặt trách nhiệm tài chính nặng nề từ phía họ hàng, gia đình.',
        advice: 'Phân định rõ trách nhiệm tài chính cá nhân, không gánh nợ thay cho người khác.',
        keyword: 'Gánh nặng truyền thống',
      },
    },
  },

  // 6: The Lovers (Đôi Tình Nhân)
  6: {
    love: {
      upright: {
        meaning: 'Sự hòa hợp tuyệt đối từ tâm hồn đến thể xác. Đây là mối liên kết định mệnh với sự tôn trọng, đồng điệu sâu sắc và lựa chọn gắn kết tự nguyện.',
        advice: 'Mở lòng đón nhận tình yêu và cùng nhau xây dựng kết nối. Hãy thành thật 100% với cảm xúc của mình.',
        keyword: 'Đồng điệu sâu sắc',
      },
      reversed: {
        meaning: 'Đứng trước ngã ba đường cảm xúc, lưỡng lự giữa hai lựa chọn hoặc có sự rạn nứt trong giao tiếp dẫn đến hiểu lầm.',
        advice: 'Đừng bắt cá hai tay hay trì hoãn quyết định. Hãy chọn người và con đường phù hợp với đạo đức của bạn.',
        keyword: 'Lưỡng lự ngã ba đường',
      },
    },
    career: {
      upright: {
        meaning: 'Cơ hội hợp tác ăn ý với đối tác lý tưởng. Các cuộc đàm phán diễn ra thuận lợi dựa trên nguyên tắc đôi bên cùng có lợi (win-win).',
        advice: 'Chọn đối tác dựa trên sự đồng điệu về tầm nhìn và nguyên tắc làm việc trung thực.',
        keyword: 'Hợp tác Win-Win',
      },
      reversed: {
        meaning: 'Bất đồng quan điểm với cộng sự, rạn nứt hợp đồng hoặc phải đưa ra lựa chọn khó khăn giữa công việc hiện tại và cơ hội mới.',
        advice: 'Làm rõ các điều khoản phân chia quyền lợi ngay từ đầu để tránh tranh chấp.',
        keyword: 'Lệch nhịp đối tác',
      },
    },
    finance: {
      upright: {
        meaning: 'Đưa ra quyết định tài chính sáng suốt. Bạn có thể chung vốn làm ăn có lợi hoặc tìm được nguồn hỗ trợ vốn kịp thời.',
        advice: 'Cân nhắc kỹ lưỡng giữa giá trị dài hạn và lợi ích ngắn hạn trước khi quyết định rót vốn.',
        keyword: 'Lựa chọn đầu tư tốt',
      },
      reversed: {
        meaning: 'Cám dỗ chi tiêu nhất thời khiến bạn chệch hướng khỏi mục tiêu tiết kiệm, hoặc bất đồng tài chính với đối tác/người yêu.',
        advice: 'Tách bạch tiền bạc và cảm xúc cá nhân để tránh làm tổn hại cả hai.',
        keyword: 'Cám dỗ chi tiêu',
      },
    },
  },

  // 7: The Chariot (Cỗ Xe)
  7: {
    love: {
      upright: {
        meaning: 'Chủ động cầm cương cảm xúc, vượt qua khoảng cách địa lý hoặc rào cản ngoại cảnh để đưa mối quan hệ tiến về phía trước.',
        advice: 'Tập trung vào mục tiêu chung, đừng để những lời bàn tán bên ngoài làm lung lay quyết tâm của hai bạn.',
        keyword: 'Vượt mọi rào cản',
      },
      reversed: {
        meaning: 'Mất kiểm soát cảm xúc, nóng vội đốt cháy giai đoạn hoặc ép buộc đối phương phải theo ý mình khiến cỗ xe trật bánh.',
        advice: 'Đạp phanh lại, kiềm chế tính hiếu thắng. Tình cảm cần thời gian bồi đắp chứ không phải cuộc đua tốc độ.',
        keyword: 'Nóng vội trật bánh',
      },
    },
    career: {
      upright: {
        meaning: 'Bứt tốc ngoạn mục hướng tới mục tiêu sự nghiệp. Ý chí kiên định và sự tập trung cao độ sẽ giúp bạn đè bẹp mọi chướng ngại vật.',
        advice: 'Giữ vững tay lái, kiên định với mục tiêu đã định. Thành công và sự thăng tiến đang ở rất gần.',
        keyword: 'Bứt tốc về đích',
      },
      reversed: {
        meaning: 'Mất phương hướng, năng lượng bị phân tán hoặc nản lòng bỏ cuộc trước những cản trở ban đầu.',
        advice: 'Xác định lại tọa độ mục tiêu cốt lõi và củng cố lại tinh thần chiến đấu.',
        keyword: 'Mất phương hướng',
      },
    },
    finance: {
      upright: {
        meaning: 'Đạt được mục tiêu tài chính cụ thể nhờ kỷ luật và sự nỗ lực làm việc bền bỉ. Bạn làm chủ hoàn toàn thu chi của mình.',
        advice: 'Tiếp tục duy trì đà tích lũy và mở rộng dòng thu nhập.',
        keyword: 'Làm chủ tài chính',
      },
      reversed: {
        meaning: 'Chi tiền bốc đồng vào những dự án quá sức hoặc cố gượng ép đầu tư khi tài chính chưa đủ lực.',
        advice: 'Hạ bớt quy mô mục tiêu, củng cố dòng tiền an toàn trước khi mở rộng.',
        keyword: 'Đầu tư quá sức',
      },
    },
  },

  // 8: Strength (Sức Mạnh Nội Tâm)
  8: {
    love: {
      upright: {
        meaning: 'Sức mạnh của sự kiên nhẫn và lòng bao dung. Bạn biết cách thuần hóa những cơn nóng giận hay cái tôi của đối phương bằng sự dịu dàng chân thành.',
        advice: 'Dùng sự mềm mỏng để hóa giải mâu thuẫn. Lạt mềm buộc chặt luôn hiệu quả hơn tranh cãi đúng sai.',
        keyword: 'Bản lĩnh dịu dàng',
      },
      reversed: {
        meaning: 'Tự ti, yếu lòng trước đối phương hoặc ngược lại là bùng nổ cơn giận làm tổn thương mối quan hệ sau thời gian dài nén nhịn.',
        advice: 'Học cách bộc lộ cảm xúc lành mạnh thay vì dồn nén đến lúc bùng nổ mất kiểm soát.',
        keyword: 'Yếu lòng & Dồn nén',
      },
    },
    career: {
      upright: {
        meaning: 'Nội lực kiên cường giúp bạn xử lý những tình huống khủng hoảng hoặc khách hàng khó tính bằng sự chuyên nghiệp, điềm đạm.',
        advice: 'Giữ cái đầu lạnh và thái độ ôn hòa. Sự điềm tĩnh của bạn chính là vũ khí mạnh nhất lúc này.',
        keyword: 'Vững vàng trước bão',
      },
      reversed: {
        meaning: 'Cảm giác kiệt sức, tự nghi ngờ năng lực bản thân hoặc để cảm xúc cá nhân chi phối công việc.',
        advice: 'Nghỉ ngơi lấy lại năng lượng, bạn mạnh mẽ hơn bạn nghĩ rất nhiều.',
        keyword: 'Kiệt sức & Tự ti',
      },
    },
    finance: {
      upright: {
        meaning: 'Kiểm soát tốt các ham muốn tài chính bộc phát. Bạn có sự bền bỉ để vượt qua giai đoạn thắt lưng buộc bụng.',
        advice: 'Duy trì kỷ luật tiết kiệm, thành quả tài chính sẽ đến từ sự kiên nhẫn lâu dài.',
        keyword: 'Kiên nhẫn tích lũy',
      },
      reversed: {
        meaning: 'Đầu hàng trước các cám dỗ mua sắm hoặc nản lòng vì các khoản đầu tư chưa sinh lời ngay.',
        advice: 'Nhắc nhở bản thân về mục tiêu dài hạn, tránh sốt ruột cắt lỗ sai thời điểm.',
        keyword: 'Mất kiên nhẫn',
      },
    },
  },

  // 9: The Hermit (Ẩn Sĩ)
  9: {
    love: {
      upright: {
        meaning: 'Khoảng lặng cần thiết để tự soi chiếu lòng mình. Bạn cần hiểu rõ bản thân thực sự muốn gì trong tình yêu trước khi bước tiếp cùng ai đó.',
        advice: 'Tận hưởng khoảng thời gian độc thân hoặc cho nhau khoảng không gian riêng để chiêm nghiệm.',
        keyword: 'Khoảng lặng soi mình',
      },
      reversed: {
        meaning: 'Tự cô lập bản thân quá mức, đóng chặt cửa lòng vì sợ tổn thương hoặc cảm giác cô đơn gặm nhấm lúc đêm muộn.',
        advice: 'Mở cửa sổ đón ánh nắng, chia sẻ tâm sự với người bạn tin cậy thay vì tự gặm nhấm nỗi buồn.',
        keyword: 'Cô lập & Đóng lòng',
      },
    },
    career: {
      upright: {
        meaning: 'Tập trung trau dồi chuyên môn sâu, nghiên cứu độc lập hoặc xem xét lại định hướng sự nghiệp một cách nghiêm túc.',
        advice: 'Tránh xa những ồn ào công sở, tập trung nâng cao giá trị cốt lõi của bản thân.',
        keyword: 'Nâng tầm chuyên môn',
      },
      reversed: {
        meaning: 'Tách biệt khỏi tập thể, thiếu kết nối với đồng nghiệp hoặc từ chối đón nhận các ý kiến đóng góp mang tính xây dựng.',
        advice: 'Học cách làm việc nhóm và chủ động kết nối lại với đồng nghiệp.',
        keyword: 'Tách biệt cô độc',
      },
    },
    finance: {
      upright: {
        meaning: 'Lối sống tối giản, giảm bớt nhu cầu vật chất không cần thiết và trân trọng những giá trị tinh thần bền vững.',
        advice: 'Rà soát lại toàn bộ chi tiêu và tập trung vào những nhu cầu thiết yếu nhất.',
        keyword: 'Tài chính tối giản',
      },
      reversed: {
        meaning: 'Quá keo kiệt hà khắc với bản thân, hoặc vì sợ rủi ro mà bỏ lỡ những cơ hội sinh lời hợp lý.',
        advice: 'Chi tiêu hợp lý cho sức khỏe và tri thức là khoản đầu tư không bao giờ lỗ.',
        keyword: 'Hà tiện quá mức',
      },
    },
  },

  // 10: Wheel of Fortune (Bánh Xe Số Phận)
  10: {
    love: {
      upright: {
        meaning: 'Cơ hội gặp gỡ định mệnh hoặc bước ngoặt tích cực xoay chuyển cục diện mối quan hệ theo cách bạn không ngờ tới.',
        advice: 'Mở lòng đón nhận duyên lành. Mọi cuộc gặp gỡ lúc này đều mang theo thông điệp vũ trụ gửi tới bạn.',
        keyword: 'Bước ngoặt nhân duyên',
      },
      reversed: {
        meaning: 'Lặp lại vòng lặp tình cảm cũ (yêu người giống người cũ, mập mờ kiểu cũ) do chưa học được bài học tốt nghiệp.',
        advice: 'Thay đổi cách phản ứng của bạn. Nếu muốn kết quả mới, đừng lặp lại hành động cũ.',
        keyword: 'Vòng lặp chưa dứt',
      },
    },
    career: {
      upright: {
        meaning: 'Thời cơ vàng xuất hiện. Sự thay đổi trong cơ cấu tổ chức hoặc cơ hội việc làm mới mở ra đúng lúc bạn cần.',
        advice: 'Nhanh chóng nắm bắt thời cơ khi bánh xe vận may đang quay về phía bạn.',
        keyword: 'Thời cơ chuyển vận',
      },
      reversed: {
        meaning: 'Trở ngại tạm thời ngoài tầm kiểm soát hoặc sự trì hoãn trong việc thăng chức, tăng lương.',
        advice: 'Bình tĩnh thích nghi, không nên chống lại sự thay đổi. Giai đoạn này rồi cũng sẽ qua.',
        keyword: 'Trở ngại tạm thời',
      },
    },
    finance: {
      upright: {
        meaning: 'Tài vận đổi chiều khởi sắc. Có lộc bất ngờ, trúng thưởng hoặc khoản tiền bị trì hoãn nay được giải ngân.',
        advice: 'Tranh thủ lúc dòng tiền dồi dào để trích lập quỹ dự phòng cho những giai đoạn sau.',
        keyword: 'Vận may gõ cửa',
      },
      reversed: {
        meaning: 'Dòng tiền trồi sụt thất thường. Tránh xa các trò cờ bạc may rủi hay lướt sóng tài chính lúc này.',
        advice: 'Thắt chặt chi tiêu và kiên nhẫn chờ thời điểm thuận lợi hơn.',
        keyword: 'Biến động dòng tiền',
      },
    },
  },

  // 11: Justice (Công Lý)
  11: {
    love: {
      upright: {
        meaning: 'Sự công bằng và minh bạch trong tình cảm. Tình yêu đòi hỏi sự cho - nhận cân bằng, không ai phải chịu thiệt thòi.',
        advice: 'Thẳng thắn trao đổi về những điều chưa thỏa đáng. Sự thật và công bằng sẽ chữa lành kết nối.',
        keyword: 'Cân bằng Cho & Nhận',
      },
      reversed: {
        meaning: 'Cảm giác bất công, một bên cho đi quá nhiều còn một bên chỉ biết nhận, hoặc có sự che giấu sự thật.',
        advice: 'Dừng ngay việc chấp nhận sự đối xử bất công. Bạn xứng đáng được trân trọng công bằng.',
        keyword: 'Bất công & Nghiêng lệch',
      },
    },
    career: {
      upright: {
        meaning: 'Mọi nỗ lực của bạn sẽ được đánh giá công tâm. Thuận lợi cho các vấn đề pháp lý, hợp đồng minh bạch.',
        advice: 'Làm việc ngay thẳng, tuân thủ đúng quy định và thỏa thuận văn bản rõ ràng.',
        keyword: 'Minh bạch & Công tâm',
      },
      reversed: {
        meaning: 'Tranh chấp hợp đồng, bị đổ lỗi oan hoặc đối mặt với sự thiên vị không công bằng nơi công sở.',
        advice: 'Lưu giữ đầy đủ bằng chứng, email trao đổi để bảo vệ quyền lợi hợp pháp của bạn.',
        keyword: 'Rủi ro pháp lý & Tranh chấp',
      },
    },
    finance: {
      upright: {
        meaning: 'Các khoản nợ nần được thanh toán dứt điểm, quyết toán tài chính rõ ràng, tiền bạc phân minh.',
        advice: 'Minh bạch hóa mọi khoản nợ và chi phí, thanh toán hóa đơn đúng hạn.',
        keyword: 'Tài chính phân minh',
      },
      reversed: {
        meaning: 'Thiệt hại tiền bạc do tranh chấp, phạt vi phạm hoặc thiếu minh bạch trong các khoản chi tiêu chung.',
        advice: 'Kiểm tra kỹ lưỡng các điều khoản phạt trước khi ký kết bất kỳ giao dịch nào.',
        keyword: 'Tranh chấp tiền bạc',
      },
    },
  },

  // 12: The Hanged Man (Người Treo Ngược)
  12: {
    love: {
      upright: {
        meaning: 'Tạm dừng lại để đổi góc nhìn. Nhận ra rằng ép buộc một kết quả ngay lập tức chỉ làm tình hình thêm bế tắc.',
        advice: 'Lùi lại một bước, quan sát câu chuyện dưới góc nhìn của đối phương để thấu hiểu sâu sắc hơn.',
        keyword: 'Đổi góc nhìn yêu',
      },
      reversed: {
        meaning: 'Tự biến mình thành nạn nhân, hy sinh vô ích cho một người không xứng đáng mà không nhận lại được gì.',
        advice: 'Tự cắt dây bước xuống! Đừng lãng phí thanh xuân để chờ đợi một người không có ý định thay đổi.',
        keyword: 'Hy sinh vô ích',
      },
    },
    career: {
      upright: {
        meaning: 'Giai đoạn tạm chững lại để tái cấu trúc. Khi công việc chưa thể bứt phá ngay, đây là lúc học hỏi và đổi mới tư duy.',
        advice: 'Chấp nhận sự chậm lại như một bước đệm cần thiết để chuẩn bị cho cú nhảy vọt tiếp theo.',
        keyword: 'Khoảng nghỉ tái cấu trúc',
      },
      reversed: {
        meaning: 'Bế tắc kéo dài vì sự chần chừ, trì hoãn và không dám đưa ra quyết định cắt lỗ dự án.',
        advice: 'Chủ động hành động để thoát khỏi vũng lầy thay vì ngồi chờ phép màu.',
        keyword: 'Bế tắc trì trệ',
      },
    },
    finance: {
      upright: {
        meaning: 'Tạm thời gác lại các kế hoạch mua sắm lớn để bảo toàn nguồn vốn qua giai đoạn chuyển giao.',
        advice: 'Thực hiện chính sách thắt lưng buộc bụng tạm thời để đổi lấy sự an toàn lâu dài.',
        keyword: 'Bảo toàn vốn',
      },
      reversed: {
        meaning: 'Khoản tiền bị đóng băng, dòng vốn tắc nghẽn hoặc mất mát do hy sinh tài chính cho người khác.',
        advice: 'Tìm cách thu hồi nợ đọng và ngừng ngay việc cho vay mượn thêm.',
        keyword: 'Vốn bị đóng băng',
      },
    },
  },

  // 13: Death (Sự Chuyển Hóa)
  13: {
    love: {
      upright: {
        meaning: 'Khép lại dứt khoát một chương tình cảm đã hết hạn sử dụng để đón chào một khởi đầu tái sinh hoàn toàn mới.',
        advice: 'Dũng cảm buông bỏ những gì đã không còn thuộc về mình để trái tim có chỗ đón nhận hạnh phúc mới.',
        keyword: 'Khép lại để tái sinh',
      },
      reversed: {
        meaning: 'Cố chấp níu kéo một mối quan hệ đã chết mòn, sợ cô đơn đến mức bám víu vào những kỷ niệm cũ kỹ.',
        advice: 'Càng kéo dài sự kết thúc, bạn càng làm tổn thương chính mình. Hãy để quá khứ ngủ yên.',
        keyword: 'Níu kéo quá khứ',
      },
    },
    career: {
      upright: {
        meaning: 'Sự thay đổi mang tính bước ngoặt: kết thúc công việc cũ, chuyển hẳn sang một môi trường mới phù hợp hơn.',
        advice: 'Đừng sợ sự thay đổi. Đóng cánh cửa này lại sẽ có cánh cửa lớn hơn mở ra cho sự nghiệp của bạn.',
        keyword: 'Chuyển biến nghề nghiệp',
      },
      reversed: {
        meaning: 'Sợ hãi thay đổi khiến bạn mắc kẹt ở một công việc nhàm chán, không còn cơ hội phát triển.',
        advice: 'Can đảm nộp đơn tìm kiếm thử thách mới thay vì chịu đựng sự bào mòn mỗi ngày.',
        keyword: 'Sợ hãi đổi thay',
      },
    },
    finance: {
      upright: {
        meaning: 'Cắt đứt dứt điểm một nguồn tiêu sản, thay đổi toàn diện thói quen quản lý tiền bạc để xây dựng lại từ đầu.',
        advice: 'Chấp nhận đau một lần để dọn sạch nợ nần và thiết lập kế hoạch tài chính mới.',
        keyword: 'Tái sinh tài chính',
      },
      reversed: {
        meaning: 'Tiếp tục rót tiền vào một khoản đầu tư thua lỗ chỉ vì tiếc công sức đã bỏ ra trước đó (chi phí chìm).',
        advice: 'Dứt khoát cắt lỗ ngay lập tức để bảo vệ phần vốn còn lại.',
        keyword: 'Cố chấp ôm lỗ',
      },
    },
  },

  // 14: Temperance (Tiết Độ)
  14: {
    love: {
      upright: {
        meaning: 'Sự dung hòa, nhịp nhàng và thấu hiểu lẫn nhau. Hai người đang dần tìm được tiếng nói chung sau những bất đồng.',
        advice: 'Kiên nhẫn giao tiếp, đi từng bước vừa vặn. Tình cảm sâu đậm cần thời gian pha trộn êm dịu.',
        keyword: 'Dung hòa nhịp nhàng',
      },
      reversed: {
        meaning: 'Thái độ cực đoan: lúc thì vồ vập thái quá, lúc lại lạnh nhạt thờ ơ khiến đối phương hoang mang.',
        advice: 'Hạ nhiệt những phản ứng thái quá, tìm lại sự cân bằng trong cảm xúc của chính bạn.',
        keyword: 'Mất cân bằng cực đoan',
      },
    },
    career: {
      upright: {
        meaning: 'Sự phối hợp hài hòa giữa các bộ phận, cân bằng tốt giữa áp lực công việc và cuộc sống cá nhân.',
        advice: 'Đóng vai trò cầu nối hòa giải trong nhóm, giữ nhịp độ làm việc ổn định không nóng vội.',
        keyword: 'Cân bằng & Điều phối',
      },
      reversed: {
        meaning: 'Xung đột lợi ích trong nhóm, tiến độ bị đốt cháy giai đoạn dẫn đến sai sót nghiêm trọng.',
        advice: 'Điều chỉnh lại tốc độ triển khai, rà soát lại các khâu phối hợp để tránh quá tải.',
        keyword: 'Cháy giai đoạn & Quá tải',
      },
    },
    finance: {
      upright: {
        meaning: 'Dòng tiền cân đối hoàn hảo giữa thu và chi. Bạn duy trì được sự điều độ mà không cảm thấy túng thiếu.',
        advice: 'Tiếp tục duy trì công thức quản lý tài chính cân bằng 50/30/20.',
        keyword: 'Thu chi cân đối',
      },
      reversed: {
        meaning: 'Mất kiểm soát ngân sách: chi nhiều hơn thu hoặc dồn tiền vào một giỏ rủi ro.',
        advice: 'Cân bằng lại danh mục chi tiêu, cắt giảm ngay các khoản mua sắm bốc đồng.',
        keyword: 'Thâm hụt ngân sách',
      },
    },
  },

  // 15: The Devil (Ác Quỷ)
  15: {
    love: {
      upright: {
        meaning: 'Sự cuốn hút mãnh liệt về thể xác (chemistry cực cuốn) nhưng độc hại, phụ thuộc cảm xúc hoặc vướng vào quan hệ mập mờ, cờ đỏ.',
        advice: 'Nhìn rõ sợi xích đang trói buộc bạn. Hãy nhớ rằng bạn hoàn toàn có quyền tự tay tháo bỏ nó.',
        keyword: 'Mối quan hệ độc hại',
      },
      reversed: {
        meaning: 'Thức tỉnh ngoạn mục! Bạn nhận ra sự thao túng và quyết tâm dứt áo ra đi, lấy lại tự do cho bản thân.',
        advice: 'Giữ vững lập trường, chặn liên lạc và không quay đầu lại vũng lầy cũ.',
        keyword: 'Thức tỉnh tháo xích',
      },
    },
    career: {
      upright: {
        meaning: 'Môi trường làm việc độc hại (toxic), bị bóc lột sức lao động hoặc bị ràng buộc bởi những hợp đồng bất lợi.',
        advice: 'Xem xét kỹ các điều khoản pháp lý và chuẩn bị lộ trình thoát khỏi môi trường độc hại.',
        keyword: 'Môi trường Toxic',
      },
      reversed: {
        meaning: 'Thoát khỏi sự chèn ép nơi công sở, từ bỏ một công việc kìm hãm để tìm lại đam mê và sự tự chủ.',
        advice: 'Tự tin bước ra ánh sáng, năng lực của bạn xứng đáng với môi trường tôn trọng hơn.',
        keyword: 'Giải phóng sự nghiệp',
      },
    },
    finance: {
      upright: {
        meaning: 'Cám dỗ tiền bạc mù quáng, nợ nần do tiêu xài hoang phí hoặc dính vào các bẫy tín dụng đen, cờ bạc.',
        advice: 'Tránh xa mọi lời rủ rê cờ bạc, đa cấp hay vay mượn lãi suất cao.',
        keyword: 'Cạm bẫy nợ nần',
      },
      reversed: {
        meaning: 'Bắt đầu trả hết các khoản nợ xấu, cắt đứt thói quen tài chính tự hủy và lấy lại quyền kiểm soát ví tiền.',
        advice: 'Kiên trì theo đuổi kế hoạch trả nợ và thiết lập lối sống tài chính lành mạnh.',
        keyword: 'Thoát bẫy nợ',
      },
    },
  },

  // 16: The Tower (Tòa Tháp)
  16: {
    love: {
      upright: {
        meaning: 'Một cú sốc bất ngờ đánh sập sự ảo tưởng: sự thật phơi bày khiến mối quan hệ lung lay tận gốc rễ.',
        advice: 'Chấp nhận sự thật dù có đau đớn. Thà đau một lần để sáng mắt còn hơn sống mãi trong sự lừa dối.',
        keyword: 'Sụp đổ ảo tưởng',
      },
      reversed: {
        meaning: 'Cố níu giữ một mối quan hệ đã rạn nứt không thể cứu vãn, trì hoãn cuộc chia tay tất yếu.',
        advice: 'Đừng lấy băng keo dán lại bức tường đã đổ nát. Đối diện sự thật sẽ giúp bạn giải thoát sớm hơn.',
        keyword: 'Trì hoãn sự thật',
      },
    },
    career: {
      upright: {
        meaning: 'Biến cố lớn trong công việc: công ty tái cấu trúc bất ngờ, dự án bị hủy hoặc mất việc đột ngột.',
        advice: 'Giữ bình tĩnh, xem đây là cơ hội để vũ trụ dọn dẹp sạch sẽ và mở ra hướng đi đột phá mới.',
        keyword: 'Biến cố giải phóng',
      },
      reversed: {
        meaning: 'Cố bám víu vào chiếc ghế lung lay hoặc trì hoãn đối mặt với sai lầm công việc cho đến khi quá muộn.',
        advice: 'Chủ động nhận trách nhiệm và tìm kiếm phương án thay thế trước khi tình hình nổ tung.',
        keyword: 'Cố chống đỡ cái hỏng',
      },
    },
    finance: {
      upright: {
        meaning: 'Tổn thất tài chính bất ngờ: sự cố hư hỏng tài sản lớn hoặc một khoản đầu tư bị sập.',
        advice: 'Sử dụng quỹ khẩn cấp để xử lý sự cố và rút ra bài học xương máu về quản trị rủi ro.',
        keyword: 'Khủng hoảng tài chính',
      },
      reversed: {
        meaning: 'Tránh được một thảm họa tài chính phút chót nhờ sự can thiệp kịp thời hoặc sự cố ở mức độ nhẹ.',
        advice: 'Nhanh chóng bịt kín các lỗ hổng tài chính ngay sau khi thoát hiểm.',
        keyword: 'Thoát hiểm phút chót',
      },
    },
  },

  // 17: The Star (Ngôi Sao)
  17: {
    love: {
      upright: {
        meaning: 'Giai đoạn chữa lành sâu sắc và hy vọng mới hé rạng. Trái tim bạn đang ấm áp trở lại, sẵn sàng đón nhận tình yêu trong trẻo.',
        advice: 'Giữ niềm tin thuần khiết vào tình yêu. Năng lượng tích cực của bạn đang thu hút người tâm đầu ý hợp.',
        keyword: 'Hy vọng & Chữa lành',
      },
      reversed: {
        meaning: 'Mất niềm tin vào tình cảm, tự ti và nhìn tương lai qua lăng kính bi quan sau những tổn thương cũ.',
        advice: 'Dành thời gian tự chữa lành cho chính mình trước. Ánh sáng bên trong bạn chưa bao giờ tắt.',
        keyword: 'Bi quan mất niềm tin',
      },
    },
    career: {
      upright: {
        meaning: 'Tìm thấy nguồn cảm hứng dồi dào và định hướng nghề nghiệp sáng rõ. Mọi nỗ lực đang được tiếp sức mạnh mẽ.',
        advice: 'Theo đuổi ước mơ với niềm tin tuyệt đối. Cơ hội phát triển và tỏa sáng đang ở phía trước.',
        keyword: 'Cảm hứng tỏa sáng',
      },
      reversed: {
        meaning: 'Cạn kiệt cảm hứng, mất phương hướng và cảm thấy công việc hiện tại không còn ý nghĩa.',
        advice: 'Nghỉ ngơi, kết nối lại với đam mê ban đầu để tìm lại ngọn lửa nhiệt huyết.',
        keyword: 'Cạn cảm hứng',
      },
    },
    finance: {
      upright: {
        meaning: 'Triển vọng tài chính sáng lạn, những khoản đầu tư bắt đầu có tín hiệu phục hồi tích cực.',
        advice: 'Kiên nhẫn nuôi dưỡng các nguồn thu dài hạn, tương lai tài chính rất hứa hẹn.',
        keyword: 'Tương lai sáng lạn',
      },
      reversed: {
        meaning: 'Lo lắng thái quá về tiền bạc khiến bạn mất ăn mất ngủ, đánh mất sự sáng suốt trong chi tiêu.',
        advice: 'Lấy lại sự bình tĩnh, rà soát lại các con số thực tế thay vì tưởng tượng ra kịch bản tồi tệ.',
        keyword: 'Lo âu quá mức',
      },
    },
  },

  // 18: The Moon (Mặt Trăng)
  18: {
    love: {
      upright: {
        meaning: 'Cảm giác mập mờ, hiểu lầm chưa giải tỏa và thói quen overthinking lúc 2h sáng vẽ ra đủ thứ bi kịch.',
        advice: 'Đừng vội tin vào những kịch bản suy diễn trong đêm tối. Hãy chờ sáng mai nói chuyện thẳng thắn.',
        keyword: 'Mập mờ & Suy diễn',
      },
      reversed: {
        meaning: 'Màn sương mập mờ tan biến! Sự thật lộ diện giúp bạn nhìn rõ tâm ý của đối phương.',
        advice: 'Bình tĩnh đón nhận sự thật và đưa ra quyết định sáng suốt dựa trên thực tế.',
        keyword: 'Sương mù tan biến',
      },
    },
    career: {
      upright: {
        meaning: 'Thông tin công việc chưa rõ ràng, có những điều giấu giếm sau lưng khiến bạn hoang mang.',
        advice: 'Không đưa ra quyết định lớn khi thông tin còn mập mờ. Giữ thái độ cẩn trọng.',
        keyword: 'Thông tin mù mờ',
      },
      reversed: {
        meaning: 'Các hiểu lầm trong công việc được làm sáng tỏ, sự thật về một dự án hoặc đồng nghiệp được phơi bày.',
        advice: 'Tận dụng sự sáng tỏ này để điều chỉnh lại kế hoạch hành động.',
        keyword: 'Làm rõ hiểu lầm',
      },
    },
    finance: {
      upright: {
        meaning: 'Rủi ro tài chính tiềm ẩn dưới bề mặt, các điều khoản mập mờ có thể làm bạn mất tiền.',
        advice: 'Tuyệt đối không ký kết hợp đồng tài chính khi chưa hiểu rõ 100% điều khoản.',
        keyword: 'Rủi ro tiềm ẩn',
      },
      reversed: {
        meaning: 'Nhận diện được cái bẫy tài chính trước khi sập bẫy, thoát khỏi sự mù mờ trong sổ sách.',
        advice: 'Minh bạch hóa mọi dòng tiền và loại bỏ các đối tác thiếu trung thực.',
        keyword: 'Phát hiện bẫy ngầm',
      },
    },
  },

  // 19: The Sun (Mặt Trời)
  19: {
    love: {
      upright: {
        meaning: 'Tình yêu rực rỡ, ấm áp, ngập tràn niềm vui và sự chân thành tuyệt đối. Không còn một chút mập mờ nào.',
        advice: 'Tận hưởng hạnh phúc trọn vẹn và chia sẻ niềm vui ấm áp cùng người thương.',
        keyword: 'Hạnh phúc rực rỡ',
      },
      reversed: {
        meaning: 'Niềm vui đến muộn hoặc bạn đang tự gồng mình tỏ ra vui vẻ trong khi bên trong còn nỗi buồn chưa giải tỏa.',
        advice: 'Cho phép mình sống thật với cảm xúc; mặt trời ấm áp vẫn luôn ở đó chờ bạn.',
        keyword: 'Mây mờ tạm thời',
      },
    },
    career: {
      upright: {
        meaning: 'Thành công vang dội! Dự án đạt kết quả xuất sắc, được công nhận và khen thưởng xứng đáng.',
        advice: 'Tự hào ăn mừng chiến thắng và lan tỏa nguồn năng lượng tích cực đến đồng nghiệp.',
        keyword: 'Thành công vang dội',
      },
      reversed: {
        meaning: 'Cái tôi quá lớn hoặc sự tự mãn có thể làm chậm bước tiến của bạn trong gang tấc.',
        advice: 'Giữ thái độ khiêm tốn, lắng nghe góp ý để hoàn thiện kết quả tốt hơn nữa.',
        keyword: 'Tự mãn kiêu ngạo',
      },
    },
    finance: {
      upright: {
        meaning: 'Tài chính rực rỡ đỉnh cao, thu nhập tăng vọt và các nguồn đầu tư sinh lời vượt kỳ vọng.',
        advice: 'Tận dụng đà tài lộc này để củng cố nền tảng tài chính bền vững cho tương lai.',
        keyword: 'Tài lộc đỉnh cao',
      },
      reversed: {
        meaning: 'Lạc quan tếu về tài chính dẫn đến chi tiêu vượt quá mức độ thực tế cho phép.',
        advice: 'Đừng đếm cua trong lỗ; hãy đợi tiền về tài khoản rồi mới lên kế hoạch chi tiêu.',
        keyword: 'Lạc quan quá đà',
      },
    },
  },

  // 20: Judgement (Phán Quyết & Thức Tỉnh)
  20: {
    love: {
      upright: {
        meaning: 'Tiếng gọi thức tỉnh đưa ra quyết định bước ngoặt: tha thứ cho quá khứ để nâng cấp mối quan hệ lên tầm cao mới.',
        advice: 'Bỏ lại những lỗi lầm cũ, mở lòng cho một cơ hội làm lại đầy trưởng thành.',
        keyword: 'Thức tỉnh bước ngoặt',
      },
      reversed: {
        meaning: 'Khắt khe tự dằn vặt bản thân về những sai lầm trong quá khứ hoặc sợ bị phán xét mà không dám bước tiếp.',
        advice: 'Học cách tha thứ cho chính mình. Ai cũng có lúc vấp ngã để trưởng thành hơn.',
        keyword: 'Tự trách & Dằn vặt',
      },
    },
    career: {
      upright: {
        meaning: 'Nhận ra tiếng gọi đam mê thực sự (calling). Thời điểm đưa ra quyết định chuyển đổi quan trọng trong sự nghiệp.',
        advice: 'Đáp lại tiếng gọi của sự thay đổi, tự tin bước vào giai đoạn thăng hoa mới.',
        keyword: 'Tiếng gọi sự nghiệp',
      },
      reversed: {
        meaning: 'Do dự, chần chừ trước cơ hội lớn do sợ thất bại và sợ ánh mắt phán xét của người xung quanh.',
        advice: 'Đừng để nỗi sợ cản bước. Hãy lắng nghe trực giác và quyết đoán nắm bắt cơ hội.',
        keyword: 'Do dự bỏ lỡ',
      },
    },
    finance: {
      upright: {
        meaning: 'Đưa ra phán quyết tài chính dứt khoát: cơ cấu lại toàn bộ nợ và danh mục đầu tư để giải phóng nguồn vốn.',
        advice: 'Hành động quyết liệt để dọn dẹp các khoản tài chính tồn đọng lâu ngày.',
        keyword: 'Quyết định dứt khoát',
      },
      reversed: {
        meaning: 'Tiếp tục trì hoãn việc giải quyết các khoản nợ xấu hoặc lặp lại sai lầm chi tiêu cũ.',
        advice: 'Đối diện thẳng thắn với tình trạng tài chính hiện tại để có giải pháp xử lý kịp thời.',
        keyword: 'Trì hoãn xử lý nợ',
      },
    },
  },

  // 21: The World (Thế Giới Viên Mãn)
  21: {
    love: {
      upright: {
        meaning: 'Cái kết viên mãn trọn vẹn! Mối quan hệ đạt đến sự hòa hợp sâu sắc, mở ra chương mới hạnh phúc viên mãn.',
        advice: 'Tự hào và trân trọng hạnh phúc hiện tại. Hai bạn đã cùng nhau vượt qua một hành trình tuyệt đẹp.',
        keyword: 'Viên mãn trọn vẹn',
      },
      reversed: {
        meaning: 'Còn thiếu một mảnh ghép nhỏ cuối cùng để khép lại chu kỳ cũ, hoặc còn vướng bận chút khúc mắc chưa giải tỏa.',
        advice: 'Kiên nhẫn giải quyết nốt nút thắt còn lại để mối quan hệ được trọn vẹn 100%.',
        keyword: 'Chưa trọn vẹn',
      },
    },
    career: {
      upright: {
        meaning: 'Hoàn thành xuất sắc mục tiêu lớn, dự án về đích thành công rực rỡ và được công nhận rộng rãi.',
        advice: 'Ăn mừng chiến thắng và sẵn sàng chuẩn bị cho những chân trời cơ hội mới ở tầm quốc tế/vĩ mô.',
        keyword: 'Về đích vẻ vang',
      },
      reversed: {
        meaning: 'Bỏ cuộc ngay sát vạch đích hoặc muốn đi đường tắt khi công việc mới chỉ hoàn thành 90%.',
        advice: 'Cố gắng thêm một chút nữa, đừng nản lòng khi đích đến đã ở ngay trước mắt.',
        keyword: 'Chậm đích phút chót',
      },
    },
    finance: {
      upright: {
        meaning: 'Đạt được sự tự do và độc lập tài chính trọn vẹn. Mọi mục tiêu tích lũy đều được hoàn thành mỹ mãn.',
        advice: 'Duy trì sự thịnh vượng này và chia sẻ bớt giá trị cho cộng đồng, người thân.',
        keyword: 'Độc lập tài chính',
      },
      reversed: {
        meaning: 'Khoản thu nhập cuối cùng bị chậm trễ hoặc còn vướng thủ tục thanh lý hợp đồng.',
        advice: 'Kiên nhẫn hoàn tất các thủ tục giấy tờ cuối cùng để nhận trọn vẹn thành quả.',
        keyword: 'Chậm giải ngân',
      },
    },
  },
};

import { MINOR_ARCANA_TOPIC_DATASET } from './minor-arcana-topic-dataset';

export { MINOR_ARCANA_TOPIC_DATASET };

export const FULL_78_TOPIC_DATASET: Record<number, TopicInterpretationMap> = {
  ...MAJOR_ARCANA_TOPIC_DATASET,
  ...MINOR_ARCANA_TOPIC_DATASET,
};

/**
 * Helper lấy dữ liệu giải mã chính xác 100% theo lá bài, chiều lá bài và chủ đề
 */
export function getCardTopicInterpretation(
  cardId: number,
  reversed: boolean,
  topic: TopicId = 'love'
): { meaning: string; advice: string; keyword: string } | null {
  const normTopic: 'love' | 'career' | 'finance' =
    topic === 'crush_school'
      ? 'love'
      : topic === 'study'
      ? 'career'
      : topic === 'daily_luck'
      ? 'finance'
      : topic === 'career'
      ? 'career'
      : topic === 'finance'
      ? 'finance'
      : 'love';

  const cardData =
    cardId <= 21
      ? MAJOR_ARCANA_TOPIC_DATASET[cardId]
      : MINOR_ARCANA_TOPIC_DATASET[cardId];
  if (!cardData) return null;

  const topicBlock = cardData[normTopic] ?? cardData.love;
  return reversed ? topicBlock.reversed : topicBlock.upright;
}

