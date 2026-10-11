/**
 * minor-arcana-topic-dataset.ts
 * Bộ Dataset chuyên sâu chuẩn xác cho toàn bộ 56 lá Ẩn Phụ (Minor Arcana IDs 22 đến 77)
 * Đầy đủ 4 bộ: Gậy (Wands 22..35), Cốc (Cups 36..49), Kiếm (Swords 50..63), Tiền (Pentacles 64..77)
 * Giải mã chi tiết, sắc bén, trực diện theo 3 chủ đề: Tình Duyên (love), Sự Nghiệp (career), Tài Chính (finance)
 * Bao gồm cả 2 chiều lá bài: Xuôi (upright) và Ngược (reversed).
 */

import type { TopicInterpretationMap } from './topic-interpretations';

export const MINOR_ARCANA_TOPIC_DATASET: Record<number, TopicInterpretationMap> = {
  // 22: Ace of Wands (Át Gậy)
  22: {
    love: {
      upright: {
        meaning: "Ngọn lửa đam mê và sự cuốn hút mãnh liệt bùng nổ ngay từ cái nhìn đầu tiên. Mối quan hệ được tiếp thêm nguồn năng lượng tươi mới, thôi thúc cả hai tiến tới những bước ngoặt thân mật và nồng nhiệt.",
        advice: "Hãy mạnh dạn bày tỏ tình cảm và sống trọn vẹn với cảm xúc rung động này. Sự nồng nhiệt chân thành sẽ làm tan chảy mọi khoảng cách.",
        keyword: "Tia sét ái tình",
      },
      reversed: {
        meaning: "Cảm xúc bốc đồng sớm nở chóng tàn, hoặc sự do dự khiến ngọn lửa nhiệt huyết dần nguội lạnh. Có thể bạn đang cảm thấy thiếu cảm hứng hoặc đối phương không còn mặn mà như trước.",
        advice: "Đừng vội vã đốt cháy giai đoạn khi chưa chắc chắn về độ bền của tình cảm. Hãy tìm lại ngọn lửa đam mê từ bên trong chính mình trước.",
        keyword: "Nhiệt huyết nguội lạnh",
      },
    },
    career: {
      upright: {
        meaning: "Một ý tưởng đột phá xuất hiện, mở ra cơ hội khởi nghiệp hoặc bắt đầu một dự án đầy tiềm năng. Bạn tràn đầy năng lượng sáng tạo, nhiệt huyết và sẵn sàng tiên phong dẫn dắt.",
        advice: "Nắm bắt ngay thời cơ này để hành động dứt khoát. Biến ý tưởng thô thành kế hoạch hành động cụ thể ngay khi cảm hứng đang ở đỉnh cao.",
        keyword: "Khởi đầu đột phá",
      },
      reversed: {
        meaning: "Dự án gặp sự trì hoãn, thiếu năng lượng thúc đẩy hoặc ý tưởng thiếu tính khả thi thực tế. Sự thiếu tự tin hoặc thiếu kiên nhẫn đang cản trở bước tiến của bạn.",
        advice: "Xem xét lại tính thực tế của kế hoạch trước khi dốc toàn lực. Đừng vội nản lòng, hãy tập trung vào từng bước nhỏ để tái tạo động lực.",
        keyword: "Trì trệ ý tưởng",
      },
    },
    finance: {
      upright: {
        meaning: "Khởi nguồn của một nguồn thu nhập mới mẻ và đầy hứa hẹn. Năng lượng dồi dào thúc đẩy các kế hoạch làm ăn, kinh doanh tay trái phát triển mạnh mẽ.",
        advice: "Đầu tư vào các dự án hoặc kỹ năng mới mà bạn thực sự có đam mê. Hãy chủ động tìm kiếm các kênh tạo ra dòng tiền mới.",
        keyword: "Cơ hội kiếm tiền mới",
      },
      reversed: {
        meaning: "Kế hoạch tài chính bị đình trệ do thiếu vốn hoặc đánh giá sai tính khả thi. Nguy cơ chi tiêu bốc đồng vào những dự án chưa được nghiên cứu kỹ.",
        advice: "Tránh các khoản chi tiêu cảm tính hoặc rót vốn vào những dự án mơ hồ. Giữ tiền mặt và xem xét lại kế hoạch chi tiêu thực tế.",
        keyword: "Rót vốn vội vàng",
      },
    },
  },

  // 23: Two of Wands (Hai Gậy)
  23: {
    love: {
      upright: {
        meaning: "Bạn đang đứng trước ngã rẽ và lên kế hoạch dài hạn cho mối quan hệ của mình. Sự kết nối đòi hỏi cả hai phải có chung tầm nhìn, cùng hướng về tương lai và sẵn sàng bước ra khỏi vùng an toàn.",
        advice: "Hãy thẳng thắn trò chuyện với đối phương về định hướng tương lai chung. Đừng ngại chia sẻ những mong muốn thực sự của bản thân.",
        keyword: "Hoạch định tương lai",
      },
      reversed: {
        meaning: "Sự ngập ngừng, sợ hãi trước những cam kết lâu dài hoặc bất đồng về kế hoạch tương lai giữa hai người. Cảm giác bế tắc khi không biết nên tiếp tục hay dừng lại.",
        advice: "Đừng để nỗi sợ thất bại giam cầm trái tim bạn. Hãy tự hỏi bản thân thực sự muốn gì trước khi chờ đợi đối phương quyết định thay.",
        keyword: "Do dự cam kết",
      },
    },
    career: {
      upright: {
        meaning: "Giai đoạn lập kế hoạch chiến lược và mở rộng quy mô. Bạn đã có nền tảng vững chắc và đang cân nhắc các cơ hội lớn hơn như hợp tác quốc tế hoặc mở rộng thị trường.",
        advice: "Tư duy dài hạn và xây dựng lộ trình từng bước rõ ràng. Tự tin bước ra khỏi vùng an toàn để nắm bắt những cơ hội tầm cỡ hơn.",
        keyword: "Tầm nhìn chiến lược",
      },
      reversed: {
        meaning: "Kế hoạch bị phân tán hoặc thiếu tính khả thi, sợ hãi không dám thực hiện những thay đổi cần thiết. Quá cẩn trọng dẫn đến bỏ lỡ thời cơ vàng.",
        advice: "Thu hẹp phạm vi mục tiêu và tập trung vào những gì bạn có thể kiểm soát. Hãy hành động thay vì chỉ mải mê vẽ ra các viễn cảnh trên giấy.",
        keyword: "Bỏ lỡ thời cơ",
      },
    },
    finance: {
      upright: {
        meaning: "Tài chính đang ở mức ổn định và đây là lúc tính toán các khoản đầu tư trung và dài hạn. Có tiềm năng mở rộng tài sản thông qua quan hệ hợp tác hoặc thị trường mới.",
        advice: "Lập kế hoạch phân bổ tài sản thông minh và đa dạng hóa danh mục đầu tư. Đặt ra mục tiêu tài chính cụ thể cho 3-5 năm tới.",
        keyword: "Phân bổ tài sản",
      },
      reversed: {
        meaning: "Rủi ro thất thoát do đánh giá quá lạc quan về thị trường hoặc thiếu chuẩn bị phương án dự phòng. Bất đồng tài chính trong các thỏa thuận đối tác.",
        advice: "Tránh mở rộng quy mô đầu tư khi dòng tiền chưa thực sự ổn định. Rà soát lại tất cả các cam kết tài chính trước khi ký kết.",
        keyword: "Toan tính sai lầm",
      },
    },
  },

  // 24: Three of Wands (Ba Gậy)
  24: {
    love: {
      upright: {
        meaning: "Mối quan hệ đang bước vào giai đoạn mở rộng và phát triển đầy hứa hẹn. Những hạt mầm tình cảm đã gieo bắt đầu cho quả ngọt; có thể là chuyến đi xa cùng nhau hoặc tín hiệu tích cực từ một mối quan hệ khoảng cách.",
        advice: "Giữ vững niềm tin và cùng nhau hướng tới những mục tiêu chung lớn lao hơn. Hãy tạo điều kiện cho cả hai cùng trải nghiệm những điều mới mẻ.",
        keyword: "Tương lai rộng mở",
      },
      reversed: {
        meaning: "Sự thất vọng khi kỳ vọng tình cảm không diễn ra đúng như dự tính, hoặc rào cản khoảng cách địa lý khiến mối quan hệ gặp trở ngại. Cảm giác ngóng đợi vô vọng.",
        advice: "Đừng sống mãi trong những kỳ vọng viển vông. Hãy tập trung giải quyết những vấn đề thực tế trước mắt thay vì chờ đợi phép màu.",
        keyword: "Chờ đợi mỏi mòn",
      },
    },
    career: {
      upright: {
        meaning: "Những nỗ lực trước đây bắt đầu mang lại kết quả cụ thể. Công việc mở rộng ra các dự án lớn, hợp tác đối ngoại thành công, hoặc cơ hội công tác, du học, làm việc từ xa rộng mở.",
        advice: "Tiếp tục phóng tầm mắt ra xa và chuẩn bị nguồn lực để đón nhận những vận hội mới. Sự chủ động hội nhập sẽ đưa bạn lên vị thế cao hơn.",
        keyword: "Đón nhận quả ngọt",
      },
      reversed: {
        meaning: "Dự án gặp trở ngại bất ngờ hoặc đối tác chậm trễ thực hiện cam kết. Kế hoạch mở rộng kinh doanh hoặc thăng tiến bị đình trệ ngoài tầm kiểm soát.",
        advice: "Kiên nhẫn điều chỉnh kế hoạch và tìm kiếm các phương án dự phòng thay thế. Đừng dồn tất cả trứng vào một giỏ khi thị trường biến động.",
        keyword: "Trở ngại mở rộng",
      },
    },
    finance: {
      upright: {
        meaning: "Dòng tiền từ các khoản đầu tư trước đây bắt đầu đổ về tài khoản. Cơ hội sinh lời từ thương mại, mở rộng dịch vụ hoặc các nguồn thu từ xa rất khả quan.",
        advice: "Tái đầu tư một phần lợi nhuận để duy trì đà tăng trưởng. Theo dõi sát sao các cơ hội sinh lời ở thị trường mới.",
        keyword: "Dòng tiền hồi đáp",
      },
      reversed: {
        meaning: "Lợi nhuận về chậm hơn dự kiến hoặc các khoản thanh toán đối tác bị trì hoãn. Rủi ro thất thoát trong các giao dịch xuyên biên giới hoặc đầu tư mạo hiểm.",
        advice: "Thắt chặt kiểm soát dòng tiền và chuẩn bị quỹ khẩn cấp. Tránh chi tiêu đón đầu trước khi tiền thực sự về tài khoản.",
        keyword: "Chậm trễ dòng tiền",
      },
    },
  },

  // 25: Four of Wands (Bốn Gậy)
  25: {
    love: {
      upright: {
        meaning: "Cột mốc hạnh phúc viên mãn, gắn kết bền chặt và ngập tràn niềm vui. Thích hợp cho việc ra mắt gia đình, đính hôn, chuyển về sống chung hoặc tổ chức đám cưới đầm ấm.",
        advice: "Hãy tận hưởng trọn vẹn hạnh phúc hiện tại và tri ân người đồng hành. Xây dựng mái ấm dựa trên sự tôn trọng và chở che lẫn nhau.",
        keyword: "Viên mãn sum vầy",
      },
      reversed: {
        meaning: "Bất đồng gia đình, mâu thuẫn nội bộ hoặc cảm giác cô đơn ngay trong chính không gian chung. Lễ kỷ niệm hoặc kế hoạch tụ họp gặp trục trặc, thiếu sự đồng điệu.",
        advice: "Dành thời gian lắng nghe và hạ cái tôi xuống để hàn gắn mối quan hệ. Đừng để những áp lực gia đình phá vỡ sự gắn kết giữa hai người.",
        keyword: "Bất hòa mái ấm",
      },
    },
    career: {
      upright: {
        meaning: "Hoàn thành xuất sắc một giai đoạn quan trọng, dự án ra mắt thành công và được tập thể tán thưởng. Không khí làm việc đoàn kết, gắn bó và cùng nhau chia sẻ thành quả.",
        advice: "Tổ chức ăn mừng cùng đồng đội để khích lệ tinh thần chung. Duy trì sự hợp tác hài hòa này làm bàn đạp cho những dự án tiếp theo.",
        keyword: "Ăn mừng chiến thắng",
      },
      reversed: {
        meaning: "Mâu thuẫn nội bộ trong nhóm làm việc, sự cạnh tranh ngầm hoặc không khí công sở căng thẳng làm giảm hiệu suất. Kế hoạch ra mắt sản phẩm bị hoãn lại.",
        advice: "Tập trung xây dựng lại lòng tin và sự minh bạch trong giao tiếp nhóm. Tránh đứng về phe phái nào trong các xung đột công sở.",
        keyword: "Lục đục nội bộ",
      },
    },
    finance: {
      upright: {
        meaning: "Tài chính vững vàng, sung túc và đạt được mục tiêu an cư lạc nghiệp. Cơ hội mua nhà, tậu xe hoặc thu được lợi nhuận lớn từ bất động sản, liên hoan gia đình.",
        advice: "Trích một phần tài chính để nâng cao chất lượng cuộc sống và chăm sóc gia đình. Tiếp tục duy trì kế hoạch chi tiêu có kỷ luật.",
        keyword: "An cư lạc nghiệp",
      },
      reversed: {
        meaning: "Phát sinh các khoản chi phí tốn kém liên quan đến nhà cửa, sự kiện gia đình hoặc tranh chấp tài sản. Chi tiêu vượt ngân sách cho các buổi tiệc tùng xa xỉ.",
        advice: "Cắt giảm các khoản chi tiêu đãi đằng không cần thiết. Quản lý chặt chẽ ngân sách sửa chữa nhà cửa hoặc chi phí sinh hoạt gia đình.",
        keyword: "Phát sinh chi phí nhà cửa",
      },
    },
  },

  // 26: Five of Wands (Năm Gậy)
  26: {
    love: {
      upright: {
        meaning: "Xung đột cái tôi, cãi vã vặt vãnh và sự bất đồng quan điểm liên tục diễn ra. Cả hai đều muốn giành phần thắng thay vì thấu hiểu, hoặc có sự cạnh tranh nhiều người cùng tán tỉnh một đối tượng.",
        advice: "Lùi lại một bước và hạ bớt cái tôi tự ái. Hãy lắng nghe xem đối phương thực sự muốn gì thay vì biến mọi cuộc trò chuyện thành chiến trường.",
        keyword: "Va chạm cái tôi",
      },
      reversed: {
        meaning: "Tìm được tiếng nói chung sau giai đoạn căng thẳng, hoặc ngược lại là sự im lặng độc hại, né tránh xung đột khiến mâu thuẫn âm ỉ dưới tàn tro.",
        advice: "Đừng né tránh đối thoại chỉ vì sợ tranh cãi. Giải quyết dứt điểm các hiểu lầm bằng sự chân thành và tinh thần xây dựng.",
        keyword: "Hạ nhiệt xung đột",
      },
    },
    career: {
      upright: {
        meaning: "Môi trường làm việc cạnh tranh gay gắt, nhiều ý kiến trái chiều và tranh cãi nảy lửa trong dự án. Bạn phải chứng minh năng lực giữa đám đông đầy tham vọng.",
        advice: "Biến áp lực cạnh tranh thành động lực hoàn thiện bản thân. Giữ thái độ chuyên nghiệp, tập trung vào kết quả công việc thay vì đấu đá cá nhân.",
        keyword: "Cạnh tranh khốc liệt",
      },
      reversed: {
        meaning: "Chấm dứt các tranh chấp nơi công sở, tìm được tiếng nói chung trong nhóm. Hoặc cảm giác mệt mỏi, kiệt sức vì phải liên tục đấu tranh không ngừng nghỉ.",
        advice: "Chủ động làm cầu nối hòa giải các mâu thuẫn nhóm. Nếu môi trường quá độc hại, hãy cân nhắc tìm kiếm không gian phát triển lành mạnh hơn.",
        keyword: "Đình chiến công sở",
      },
    },
    finance: {
      upright: {
        meaning: "Áp lực tài chính do cạnh tranh giá cả gay gắt hoặc tranh chấp hợp đồng, tranh chấp quyền lợi kinh doanh. Nguy cơ chi tiêu mất kiểm soát vì tâm lý so đo hơn thua.",
        advice: "Bảo vệ nguồn thu của mình bằng các điều khoản hợp đồng rõ ràng. Tránh chi tiền chỉ để chứng tỏ bản thân với người khác.",
        keyword: "Tranh chấp lợi ích",
      },
      reversed: {
        meaning: "Giải quyết ổn thỏa các khúc mắc tài chính hoặc các tranh chấp tiền bạc kéo dài. Áp lực cạnh tranh giảm bớt giúp ổn định lại dòng tiền.",
        advice: "Tận dụng thời điểm này để cơ cấu lại các khoản nợ hoặc chi phí cố định. Tập trung xây dựng các kênh kiếm tiền ít biến động hơn.",
        keyword: "Hàn gắn tài chính",
      },
    },
  },

  // 27: Six of Wands (Sáu Gậy)
  27: {
    love: {
      upright: {
        meaning: "Chinh phục thành công trái tim người trong mộng hoặc mối quan hệ được mọi người công nhận, chúc phúc. Bạn cảm thấy tự hào, tự tin và được trân trọng sâu sắc.",
        advice: "Tận hưởng niềm hạnh phúc được sẻ chia và đền đáp. Hãy luôn nhớ rằng tình yêu bền vững cần sự khiêm nhường và chăm sóc mỗi ngày.",
        keyword: "Chinh phục vinh quang",
      },
      reversed: {
        meaning: "Cảm giác bị đối phương ngó lơ, tự ti hoặc thất vọng vì không nhận được sự công nhận xứng đáng. Cái tôi kiêu ngạo quá mức có thể làm tổn thương người kia.",
        advice: "Hạ bớt sự tự phụ và học cách lắng nghe chân thành. Đừng biến tình yêu thành sân khấu biểu diễn để tìm kiếm sự ngưỡng mộ của thiên hạ.",
        keyword: "Tổn thương kiêu hãnh",
      },
    },
    career: {
      upright: {
        meaning: "Thành công vang dội, đạt được mục tiêu lớn và nhận được sự khen ngợi, thăng chức hoặc tăng thưởng xứng đáng. Bạn là tâm điểm của sự chú ý và tôn vinh.",
        advice: "Tận dụng đà chiến thắng này để củng cố vị thế và uy tín nghề nghiệp. Hãy tri ân những người đã hỗ trợ bạn trên hành trình bước lên đỉnh cao.",
        keyword: "Vinh quang thăng tiến",
      },
      reversed: {
        meaning: "Kỳ vọng bị sụp đổ, dự án không đạt chỉ tiêu hoặc bị người khác cướp công trắng trợn. Cảm giác nghi ngờ năng lực bản thân sau một thất bại công khai.",
        advice: "Đừng để một thất bại tạm thời định nghĩa giá trị của bạn. Rút kinh nghiệm sâu sắc, giữ vững sự kiên định và âm thầm xây dựng lại chiến lược.",
        keyword: "Hụt hẫng danh vọng",
      },
    },
    finance: {
      upright: {
        meaning: "Thành quả tài chính vượt mong đợi: thưởng dự án lớn, doanh thu kỷ lục hoặc khoản đầu tư sinh lời vượt bậc. Bạn có vị thế tài chính đàng hoàng và tự tin.",
        advice: "Trích một phần tiền thưởng để tự thưởng cho bản thân và giúp đỡ người thân. Đem phần còn lại tái đầu tư an toàn để duy trì sự thịnh vượng.",
        keyword: "Đột phá doanh thu",
      },
      reversed: {
        meaning: "Kỳ vọng lợi nhuận lớn nhưng thực tế không như mơ, chi tiêu quá tay cho hình thức phô trương bên ngoài. Chậm thanh toán các khoản thưởng dự kiến.",
        advice: "Hạn chế mua sắm đồ xa xỉ chỉ để giữ thể diện. Tập trung kiểm soát chặt chẽ sổ sách và tránh vay nợ để chi tiêu hình thức.",
        keyword: "Hụt hẫng doanh số",
      },
    },
  },

  // 28: Seven of Wands (Bảy Gậy)
  28: {
    love: {
      upright: {
        meaning: "Bạn đang kiên quyết bảo vệ mối quan hệ trước sự phản đối của gia đình, bạn bè hoặc định kiến xã hội. Sự chung thủy và dũng cảm giúp cả hai vượt qua sóng gió bên ngoài.",
        advice: "Vững vàng bảo vệ hạnh phúc của mình nhưng hãy dùng sự bình tĩnh và tình thương để chứng minh, thay vì phản ứng gay gắt với người xung quanh.",
        keyword: "Bảo vệ tình yêu",
      },
      reversed: {
        meaning: "Cảm giác kiệt sức vì phải liên tục thanh minh, bảo vệ mối quan hệ mà không nhận được sự thấu hiểu từ đối phương. Bạn có xu hướng muốn buông xuôi và nhượng bộ.",
        advice: "Tự hỏi bản thân xem mối quan hệ này có thực sự xứng đáng để bạn hao tâm tổn sức đến vậy không. Đôi khi buông bỏ một cuộc chiến vô nghĩa lại là giải thoát.",
        keyword: "Đuối sức phòng thủ",
      },
    },
    career: {
      upright: {
        meaning: "Bạn giữ vững lập trường chuyên môn và vị trí tiên phong trước sự cạnh tranh gay gắt hoặc công kích từ đối thủ. Uy tín và bản lĩnh của bạn được thể hiện rõ ràng nhất trong nghịch cảnh.",
        advice: "Không lùi bước trước áp lực công việc hay sự nghi ngờ của người khác. Tự tin vào năng lực và giá trị bản thân, kết quả thực tế sẽ là câu trả lời đanh thép nhất.",
        keyword: "Vững vàng lập trường",
      },
      reversed: {
        meaning: "Áp lực công việc đè nặng khiến bạn cảm thấy quá tải, mất tự tin và muốn đầu hàng trước sự chỉ trích. Bị dồn vào chân tường trong các cuộc họp hoặc dự án.",
        advice: "Tìm kiếm sự hỗ trợ từ đồng minh đáng tin cậy thay vì đơn thương độc mã. Rà soát lại giới hạn cá nhân và biết nói lời từ chối những đòi hỏi vô lý.",
        keyword: "Quá tải áp lực",
      },
    },
    finance: {
      upright: {
        meaning: "Kiên quyết bảo vệ tài sản và nguồn thu nhập trước các biến động thị trường hoặc nguy cơ lừa đảo. Bạn có khả năng quản lý tài chính vững vàng trong giai đoạn khó khăn.",
        advice: "Giữ chặt các tài sản có giá trị và không dao động trước những tin đồn thị trường thất thiệt. Duy trì kỷ luật tiết kiệm nghiêm ngặt.",
        keyword: "Phòng thủ tài chính",
      },
      reversed: {
        meaning: "Thất thế trong các cuộc đàm phán tài chính, bị buộc phải chịu thiệt hại hoặc mất mát tài sản do thiếu sự chuẩn bị pháp lý vững chắc.",
        advice: "Nhờ đến sự tư vấn của chuyên gia tài chính hoặc luật sư trước khi nhượng bộ bất kỳ điều khoản bất lợi nào. Cắt lỗ kịp thời nếu cần.",
        keyword: "Mất quyền kiểm soát",
      },
    },
  },

  // 29: Eight of Wands (Tám Gậy)
  29: {
    love: {
      upright: {
        meaning: "Tin nhắn tới tấp, tình cảm phát triển với tốc độ tên lửa! Những hiểu lầm được tháo gỡ nhanh chóng, cơ hội gặp gỡ bất ngờ hoặc một chuyến du lịch đầy lãng mạn cùng nhau.",
        advice: "Hãy cởi mở đón nhận và tận hưởng dòng chảy cảm xúc mãnh liệt này. Đừng ngần ngại hồi đáp chân thành và nhanh chóng khi người ấy mở lời.",
        keyword: "Tốc độ bùng nổ",
      },
      reversed: {
        meaning: "Thông tin liên lạc bị gián đoạn, hiểu lầm do tin nhắn vội vã hoặc cảm giác mọi thứ đang diễn ra quá nhanh khiến bạn choáng ngợp và hoảng sợ.",
        advice: "Chậm lại một nhịp, cẩn trọng trong từng lời ăn tiếng nói trên mạng xã hội. Đừng đưa ra quyết định tình cảm quan trọng khi tâm trạng đang kích động.",
        keyword: "Hiểu lầm tốc độ",
      },
    },
    career: {
      upright: {
        meaning: "Mọi nút thắt được tháo gỡ thần tốc, email và hợp đồng chốt liên tục. Tiến độ dự án bứt phá ngoạn mục, cơ hội đi công tác xa hoặc chuyển vùng làm việc nhanh chóng.",
        advice: "Tập trung cao độ để bắt kịp nhịp độ công việc dồn dập. Xử lý dứt điểm các đầu việc quan trọng ngay khi cơ hội đang thuận lợi.",
        keyword: "Tiến độ thần tốc",
      },
      reversed: {
        meaning: "Sự chậm trễ bực bội, email thất lạc, các thủ tục bị đình trệ không rõ nguyên nhân. Hoặc hành động quá vội vàng dẫn đến sai sót kỹ thuật nghiêm trọng.",
        advice: "Kiểm tra kỹ lưỡng mọi văn bản trước khi gửi đi. Kiên nhẫn chờ đợi quy trình xử lý thay vì nóng vội thúc ép làm hỏng chuyện lớn.",
        keyword: "Trì trệ bức xúc",
      },
    },
    finance: {
      upright: {
        meaning: "Tiền bạc về tài khoản nhanh chóng, các giao dịch chuyển khoản diễn ra suôn sẻ không ngờ. Thời điểm tuyệt vời để chốt deal hoặc nhận các khoản hoa hồng thanh toán ngay.",
        advice: "Xử lý các dòng tiền vào thật nhanh, tận dụng thời cơ để giải quyết dứt điểm các khoản nợ hoặc đầu tư sinh lời ngắn hạn.",
        keyword: "Dòng tiền thần tốc",
      },
      reversed: {
        meaning: "Chuyển tiền bị nghẽn, giao dịch ngân hàng gặp trục trặc kỹ thuật hoặc đối tác chậm thanh toán. Nguy cơ mất tiền vì ra quyết định đầu tư chớp nhoáng.",
        advice: "Kiểm tra kỹ thông tin tài khoản trước khi thực hiện các giao dịch lớn. Tuyệt đối không fomo xuống tiền theo các lời rủ rê đầu tư cấp tốc.",
        keyword: "Nghẽn mạch giao dịch",
      },
    },
  },

  // 30: Nine of Wands (Chín Gậy)
  30: {
    love: {
      upright: {
        meaning: "Bạn đang dựng lên bức tường phòng thủ kiên cố vì những vết thương lòng trong quá khứ. Mặc dù còn e dè và cảnh giác, bạn vẫn đủ kiên cường để không từ bỏ niềm tin vào tình yêu chân thật.",
        advice: "Thận trọng là tốt nhưng đừng biến sự cảnh giác thành nhà tù cô lập chính mình. Hãy cho đối phương cơ hội chứng minh lòng chân thành qua thời gian.",
        keyword: "Cảnh giác kiên cường",
      },
      reversed: {
        meaning: "Kiệt sức vì luôn phải đề phòng, nghi ngờ đối phương vô căn cứ hoặc không thể buông bỏ nỗi đau cũ. Cảm giác phòng thủ thái quá đang dần đẩy người yêu thương bạn ra xa.",
        advice: "Đã đến lúc hạ vũ khí và chữa lành đứa trẻ bên trong bạn. Tình yêu đích thực không phải là cuộc chiến sinh tồn cần bạn phải luôn căng thẳng.",
        keyword: "Kiệt sức phòng thủ",
      },
    },
    career: {
      upright: {
        meaning: "Bạn sắp chạm tới đích của một dự án đầy cam go, chỉ còn một thử thách cuối cùng cần vượt qua. Dù cơ thể và tinh thần mỏi mệt, bạn vẫn kiên trì bám trụ tới cùng.",
        advice: "Cố gắng thêm một chút nữa, vạch đích đã ở ngay trước mắt! Giữ vững sự kiên nhẫn và cẩn trọng trong từng khâu nghiệm thu cuối cùng.",
        keyword: "Bám trụ kiên cường",
      },
      reversed: {
        meaning: "Kiệt sức nghề nghiệp (burnout), buông xuôi ngay trước vạch đích do áp lực kéo dài. Sự cứng đầu từ chối thay đổi phương pháp làm việc khiến bạn thêm hao mòn.",
        advice: "Cho phép bản thân nghỉ ngơi phục hồi năng lượng khẩn cấp. Nhận sự giúp đỡ từ đồng đội thay vì ôm đồm gánh vác mọi trách nhiệm một mình.",
        keyword: "Kiệt quệ cận đích",
      },
    },
    finance: {
      upright: {
        meaning: "Tài chính trải qua giai đoạn thử thách nhưng bạn vẫn bảo toàn được nguồn vốn nhờ kỷ luật sắt đá. Sự thận trọng tối đa giúp bạn tránh khỏi các cú sập thị trường.",
        advice: "Tiếp tục duy trì quỹ khẩn cấp và không mạo hiểm vốn liếng vào thời điểm nhạy cảm này. An toàn vốn là ưu tiên số một.",
        keyword: "Bảo toàn vốn liếng",
      },
      reversed: {
        meaning: "Kiệt quệ tài chính sau chuỗi ngày gồng lỗ hoặc gánh nặng nợ nần vượt quá sức chịu đựng. Khủng hoảng tiền bạc khiến bạn mất phương hướng.",
        advice: "Đối diện thẳng thắn với các con số tài chính và tìm kiếm giải pháp giãn nợ. Đừng cố chấp gồng các khoản đầu tư đã mất hết tiềm năng.",
        keyword: "Đuối sức gồng lỗ",
      },
    },
  },

  // 31: Ten of Wands (Mười Gậy)
  31: {
    love: {
      upright: {
        meaning: "Gánh nặng trách nhiệm và áp lực cuộc sống đang đè bẹp sự lãng mạn. Một người đang phải gánh vác quá nhiều cho mối quan hệ, khiến tình yêu trở thành nghĩa vụ nặng nề.",
        advice: "Hãy chia sẻ gánh nặng và trách nhiệm với đối phương. Tình yêu là sự đồng hành hai chiều, bạn không cần phải một mình hy sinh tất cả.",
        keyword: "Gánh nặng tình cảm",
      },
      reversed: {
        meaning: "Quá tải dẫn đến suy sụp hoàn toàn hoặc nhận ra bản thân đang gánh vác những điều vô nghĩa và quyết định buông bỏ. Trút bỏ bớt kỳ vọng nặng nề để giải thoát cho nhau.",
        advice: "Dũng cảm đặt bớt gánh nặng xuống trước khi bạn gãy gục. Học cách buông bỏ những kỳ vọng không thực tế và học cách yêu thương bản thân trước.",
        keyword: "Buông bỏ gánh nặng",
      },
    },
    career: {
      upright: {
        meaning: "Khối lượng công việc khổng lồ, deadline dồn dập và trách nhiệm đè nặng lên vai. Bạn đang ôm đồm quá nhiều việc cùng lúc và đối mặt với nguy cơ kiệt sức.",
        advice: "Học cách ủy quyền công việc và từ chối những nhiệm vụ nằm ngoài phận sự. Sắp xếp lại thứ tự ưu tiên và chỉ tập trung vào việc sống còn.",
        keyword: "Quá tải công việc",
      },
      reversed: {
        meaning: "Chạm đáy chịu đựng, sụp đổ vì kiệt sức hoặc bắt đầu học được cách phân chia công việc hợp lý. Trút bỏ bớt các dự án không hiệu quả để tái sinh.",
        advice: "Kiên quyết từ bỏ những công việc không mang lại giá trị tương xứng. Nghỉ ngơi để lấy lại sức khỏe trước khi tiếp tục hành trình sự nghiệp.",
        keyword: "Giải tỏa áp lực",
      },
    },
    finance: {
      upright: {
        meaning: "Gánh nặng chi phí, nợ nần hoặc trách nhiệm chu cấp gia đình đè nặng lên vai. Toàn bộ thu nhập làm ra chỉ đủ để trang trải các nghĩa vụ cố định.",
        advice: "Lập kế hoạch thanh toán nợ nần có lộ trình cụ thể. Cắt giảm tối đa các chi phí không thiết yếu để giảm bớt áp lực dòng tiền hàng tháng.",
        keyword: "Áp lực nợ nần",
      },
      reversed: {
        meaning: "Tìm ra lối thoát cho khủng hoảng nợ nần hoặc ngược lại là mất khả năng chi trả vì nợ nần chồng chất. Cần cơ cấu lại toàn bộ nợ gấp.",
        advice: "Tìm kiếm sự tư vấn tài chính chuyên nghiệp hoặc đàm phán tái cấu trúc nợ. Tuyệt đối không vay nợ mới để trả nợ cũ.",
        keyword: "Cơ cấu lại nợ",
      },
    },
  },

  // 32: Page of Wands (Tiểu Đồng Gậy)
  32: {
    love: {
      upright: {
        meaning: "Những rung động đầu đời trong trẻo, tin nhắn tán tỉnh dí dỏm và sự tò mò háo hức khám phá về nhau. Nguồn năng lượng trẻ trung, vui vẻ mang lại nhiều tiếng cười cho mối quan hệ.",
        advice: "Hãy giữ sự hồn nhiên và cởi mở đón nhận những cuộc phiêu lưu tình cảm mới. Thể hiện sự hào hứng và chủ động kết nối với đối phương.",
        keyword: "Tò mò hứng khởi",
      },
      reversed: {
        meaning: "Sự trẻ con, nông nổi, hứa suông rồi bỏ quên hoặc thất vọng vì tin nhắn không như mong đợi. Đối phương có thể còn quá non nớt, chưa sẵn sàng cho mối quan hệ nghiêm túc.",
        advice: "Đừng đặt quá nhiều kỳ vọng vào những lời hứa hẹn bốc đồng lúc vui vẻ. Hãy quan sát xem người ấy có sự chín chắn cần thiết hay không.",
        keyword: "Nông nổi hứa suông",
      },
    },
    career: {
      upright: {
        meaning: "Cơ hội học việc mới, khóa đào tạo thú vị hoặc tin vui liên quan đến công việc sáng tạo. Bạn tràn đầy cảm hứng học hỏi, sẵn sàng tiếp thu những kỹ năng và kiến thức mới.",
        advice: "Giữ vững tinh thần học hỏi của người mới bắt đầu. Đừng ngại đặt câu hỏi và thử nghiệm những phương pháp làm việc sáng tạo.",
        keyword: "Khởi đầu học hỏi",
      },
      reversed: {
        meaning: "Thiếu định hướng nghề nghiệp, cả thèm chóng chán hoặc tin tức công việc bị hoãn lại. Bắt đầu nhiều việc với sự nhiệt tình nhưng không việc nào hoàn thành.",
        advice: "Rèn luyện tính kỷ luật và kiên trì theo đuổi một mục tiêu cụ thể. Hoàn thành dứt điểm khóa học hoặc nhiệm vụ hiện tại trước khi bắt đầu cái mới.",
        keyword: "Cả thèm chóng chán",
      },
    },
    finance: {
      upright: {
        meaning: "Tin tức tốt lành về một nguồn thu nhỏ, học bổng hoặc cơ hội kiếm thêm thu nhập từ đam mê sở thích. Khởi đầu thuận lợi cho việc học cách quản lý tài chính cá nhân.",
        advice: "Bắt đầu tích lũy từ những khoản nhỏ nhất và đầu tư vào việc học hỏi kiến thức tài chính. Sử dụng tiền để nâng cao kỹ năng bản thân.",
        keyword: "Mầm ươm tài chính",
      },
      reversed: {
        meaning: "Chi tiêu bồng bột cho những sở thích nhất thời rồi nhanh chóng vứt xó. Nhận tin tức tài chính gây thất vọng hoặc trễ hạn giải ngân.",
        advice: "Dừng ngay việc mua sắm theo cảm hứng nhất thời. Đặt ra hạn mức chi tiêu hàng ngày và tuân thủ nghiêm ngặt.",
        keyword: "Tiêu xài bốc đồng",
      },
    },
  },

  // 33: Knight of Wands (Hiệp Sĩ Gậy)
  33: {
    love: {
      upright: {
        meaning: "Sự theo đuổi cuồng nhiệt, mãnh liệt và đầy quyến rũ. Một đối tượng tự tin, phong trần bước vào cuộc đời bạn với nguồn năng lượng cuốn hút khó cưỡng.",
        advice: "Tận hưởng ngọn lửa đam mê nhưng hãy giữ cho mình một cái đầu lạnh. Đừng để sự cuồng nhiệt làm bạn quên mất việc tìm hiểu chiều sâu tính cách của nhau.",
        keyword: "Theo đuổi cuồng nhiệt",
      },
      reversed: {
        meaning: "Nóng vội, bốc đồng, xuất hiện như một cơn lốc rồi biến mất không dấu vết (ghosting). Mối quan hệ tiềm ẩn nguy cơ thiếu cam kết, chỉ tìm kiếm cảm giác mạnh.",
        advice: "Cảnh giác với những lời đường mật và những hành động vội vã. Đừng vội trao trọn con tim cho người chỉ xem tình yêu là một cuộc chinh phục.",
        keyword: "Cả thèm mau chán",
      },
    },
    career: {
      upright: {
        meaning: "Hành động quyết liệt, xông xáo và dám nghĩ dám làm. Bạn sẵn sàng nhận nhiệm vụ khó, dẫn đầu các chuyến công tác xa và thúc đẩy dự án tiến nhanh về phía trước.",
        advice: "Phát huy tinh thần tiên phong và lòng can đảm. Tận dụng tối đa năng lượng dồi dào để tạo ra những bước đột phá ngoạn mục trong công việc.",
        keyword: "Tiên phong dấn thân",
      },
      reversed: {
        meaning: "Hành động hấp tấp, thiếu kế hoạch chi tiết dẫn đến sai sót và xung đột với đồng nghiệp. Năng lượng bốc đồng nhưng nhanh chóng nản chí khi gặp chướng ngại.",
        advice: "Hãm bớt tốc độ và suy nghĩ thấu đáo về hậu quả trước khi hành động. Học cách lắng nghe góp ý chuyên môn từ những người có kinh nghiệm.",
        keyword: "Hấp tấp hỏng việc",
      },
    },
    finance: {
      upright: {
        meaning: "Dám mạo hiểm đầu tư vào các cơ hội sinh lời cao, dòng tiền luân chuyển nhanh chóng. Khả năng kiếm tiền nhạy bén thông qua các quyết định dứt khoát.",
        advice: "Tận dụng thời cơ để chốt các thương vụ kinh doanh chớp nhoáng, nhưng luôn đảm bảo có giới hạn rủi ro rõ ràng.",
        keyword: "Dám nghĩ dám làm",
      },
      reversed: {
        meaning: "Vung tay quá trán, đầu tư cờ bạc mạo hiểm hoặc đổ tiền vào các trào lưu tài chính nhất thời dẫn đến cháy túi. Thất thoát tài chính vì tính ngông cuồng.",
        advice: "Khóa chặt tài khoản giao dịch mạo hiểm và ngừng ngay các quyết định fomo theo đám đông. Kỷ luật bảo toàn vốn là điều sống còn lúc này.",
        keyword: "Đốt tiền mạo hiểm",
      },
    },
  },

  // 34: Queen of Wands (Hoàng Hậu Gậy)
  34: {
    love: {
      upright: {
        meaning: "Sức hút tự tin, ấm áp, độc lập và rạng rỡ của bạn khiến người khác không thể rời mắt. Bạn làm chủ cảm xúc của mình, yêu say đắm nhưng không hề phụ thuộc.",
        advice: "Hãy là chính mình với toàn bộ sự tự tin và nét quyến rũ riêng có. Tình yêu đích thực sẽ nở rộ khi bạn biết tỏa sáng từ giá trị nội tại.",
        keyword: "Tỏa sáng quyến rũ",
      },
      reversed: {
        meaning: "Ghen tuông vô cớ, thao túng cảm xúc hoặc trở nên đòi hỏi, áp đặt đối phương. Cảm giác bất an bên trong che đậy bằng vẻ ngoài cáu kỉnh và kiểm soát.",
        advice: "Nhìn nhận lại sự bất an của chính mình thay vì trút giận lên người khác. Học cách tin tưởng đối phương và buông bỏ nhu cầu kiểm soát tuyệt đối.",
        keyword: "Ghen tuông kiểm soát",
      },
    },
    career: {
      upright: {
        meaning: "Phong thái lãnh đạo truyền cảm hứng, sự năng động và khả năng kết nối tuyệt vời. Bạn làm chủ các dự án lớn, tạo động lực mạnh mẽ cho tập thể cùng tiến bước.",
        advice: "Tận dụng sự lôi cuốn và tài ngoại giao của bạn để mở rộng mạng lưới quan hệ công việc. Truyền cảm hứng và nâng đỡ đồng nghiệp cùng phát triển.",
        keyword: "Lãnh đạo truyền cảm hứng",
      },
      reversed: {
        meaning: "Lạm quyền, độc đoán hoặc để cảm xúc cá nhân chi phối các quyết định chuyên môn. Cạnh tranh không lành mạnh và tạo thị phi chốn công sở.",
        advice: "Tách bạch cảm xúc cá nhân khỏi công việc chuyên môn. Lắng nghe ý kiến đóng góp của cấp dưới với thái độ khách quan và tôn trọng.",
        keyword: "Độc đoán thị phi",
      },
    },
    finance: {
      upright: {
        meaning: "Tự chủ tài chính vững vàng, kiếm tiền giỏi giang và chi tiêu thông minh, hào phóng đúng lúc. Khả năng tạo ra tài sản từ sự tự tin và tài năng cá nhân.",
        advice: "Đầu tư vào việc phát triển thương hiệu cá nhân và nâng cao giá trị bản thân. Bạn hoàn toàn đủ năng lực tạo ra sự thịnh vượng bền vững.",
        keyword: "Tự chủ thịnh vượng",
      },
      reversed: {
        meaning: "Chi tiêu hoang phí để mua sắm xa xỉ phẩm nhằm khoe mẽ, phô trương thanh thế. Rủi ro thất thoát tiền bạc do tin tưởng sai người hoặc đầu tư cảm tính.",
        advice: "Dừng ngay việc chi tiêu để làm vừa lòng người khác. Xem xét lại các khoản đầu tư và giữ kỷ luật tài chính nghiêm túc.",
        keyword: "Hoang phí phô trương",
      },
    },
  },

  // 35: King of Wands (Vua Gậy)
  35: {
    love: {
      upright: {
        meaning: "Một tình yêu trưởng thành, ấm áp, vững chãi và đầy trách nhiệm. Đối phương hoặc bạn là người bạn đời lý tưởng, luôn chủ động che chở và định hướng cho tương lai cả hai.",
        advice: "Dẫn dắt mối quan hệ bằng sự tôn trọng, lòng bao dung và sự cam kết chân thành. Hãy là chỗ dựa tinh thần vững chắc cho người mình yêu.",
        keyword: "Bản lĩnh che chở",
      },
      reversed: {
        meaning: "Sự gia trưởng, độc đoán, áp đặt suy nghĩ của mình lên đối phương. Thiếu kiên nhẫn, nóng nảy và dễ nổi cơn thịnh nộ khi mọi việc không như ý.",
        advice: "Hạ cái tôi xuống và tôn trọng quyền tự do, ý kiến riêng của người bạn đời. Tình yêu không phải là một vương quốc để bạn làm vua thống trị.",
        keyword: "Gia trưởng áp đặt",
      },
    },
    career: {
      upright: {
        meaning: "Tầm nhìn vĩ mô xuất sắc, năng lực lãnh đạo đỉnh cao và khả năng biến đại kế hoạch thành hiện thực. Bạn là thủ lĩnh uy tín, được đồng nghiệp và đối tác kính nể.",
        advice: "Quyết đoán nắm bắt quyền điều hành và dẫn dắt đội ngũ tiến lên. Tự tin vào tầm nhìn chiến lược của mình để tạo ra những bước ngoặt lớn.",
        keyword: "Thủ lĩnh uy quyền",
      },
      reversed: {
        meaning: "Lãnh đạo độc đoán, thiếu lắng nghe, đưa ra những quyết định nóng vội dẫn đến tổn thất cho cả tập thể. Đặt ra những mục tiêu phi thực tế khiến cấp dưới kiệt sức.",
        advice: "Tập trung lắng nghe phản hồi từ đội ngũ và điều chỉnh kỳ vọng phù hợp với thực tế. Đừng để sự kiêu ngạo làm mù quáng tầm nhìn chiến lược.",
        keyword: "Lãnh đạo độc đoán",
      },
    },
    finance: {
      upright: {
        meaning: "Làm chủ tài chính ở tầm vĩ mô, xây dựng doanh nghiệp thành công hoặc đầu tư sinh lời lớn. Khả năng nhìn ra cơ hội thương mại lớn mà người khác bỏ qua.",
        advice: "Mở rộng quy mô kinh doanh hoặc đầu tư vào các dự án lớn có tiềm năng dài hạn. Quản lý dòng tiền với tầm nhìn chiến lược của một nhà đầu tư thực thụ.",
        keyword: "Tầm nhìn vĩ mô",
      },
      reversed: {
        meaning: "Thất bại tài chính do các quyết định đầu tư liều lĩnh, độc đoán và không lường trước rủi ro. Thâm hụt ngân sách vì theo đuổi những dự án quá tầm tay.",
        advice: "Cần sự tham vấn độc lập từ các chuyên gia tài chính trước khi xuống tiền lớn. Thu hẹp quy mô và dừng ngay các khoản đầu tư phiêu lưu.",
        keyword: "Mạo hiểm tổn thất",
      },
    },
  },

  // 36: Ace of Cups (Át Cốc)
  36: {
    love: {
      upright: {
        meaning: "Dòng chảy tình cảm ngọt ngào, tinh khôi và tràn đầy rung động thuần khiết. Trái tim bạn đang rộng mở để đón nhận tình yêu mới, hoặc mối quan hệ hiện tại bước vào giai đoạn thăng hoa và thấu cảm sâu sắc.",
        advice: "Hãy mở rộng lòng mình và đón nhận tình yêu mà không chút do dự hay e sợ. Sự chân thành và trong sáng chính là chìa khóa mở lối trái tim.",
        keyword: "Tình yêu đong đầy",
      },
      reversed: {
        meaning: "Cảm xúc bị dồn nén, trái tim khép kín vì những tổn thương cũ, hoặc cảm giác hụt hẫng, cạn kiệt trong tình yêu. Bạn đang ngần ngại trao đi hoặc không thể đón nhận tình cảm.",
        advice: "Hãy dành thời gian tự chữa lành và yêu thương chính bản thân mình trước. Đừng ép buộc bản thân phải mở lòng khi vết thương cũ chưa lành.",
        keyword: "Trái tim khép kín",
      },
    },
    career: {
      upright: {
        meaning: "Khởi đầu một công việc bạn thực sự đam mê và tìm thấy ý nghĩa đích thực. Nguồn cảm hứng sáng tạo dồi dào, mối quan hệ với đồng nghiệp hài hòa, chan hòa tình thân ái.",
        advice: "Hãy làm việc bằng cả trái tim và sự tận tâm. Khi bạn thực sự yêu thích những gì mình làm, thành công và sự công nhận sẽ tự nhiên tìm đến.",
        keyword: "Cảm hứng dâng trào",
      },
      reversed: {
        meaning: "Mất cảm hứng trong công việc, cảm thấy vô vị hoặc mệt mỏi vì môi trường làm việc thiếu tình người. Ý tưởng sáng tạo bị tắc nghẽn do tâm lý bất an.",
        advice: "Tìm lại niềm vui từ những khía cạnh nhỏ trong công việc hoặc cân nhắc hướng đi phù hợp hơn với giá trị tinh thần của bản thân.",
        keyword: "Tắc nghẽn cảm hứng",
      },
    },
    finance: {
      upright: {
        meaning: "Tài chính mang lại sự bình an và thỏa mãn tinh thần. Nhận được sự giúp đỡ tài chính từ người thân hoặc có duyên may trong các dự án mang tính cộng đồng, nghệ thuật.",
        advice: "Sử dụng tiền bạc một cách nhân văn và ý nghĩa. Chia sẻ sự may mắn với những người xung quanh sẽ giúp dòng chảy tài lộc càng thêm dồi dào.",
        keyword: "Tài lộc an lành",
      },
      reversed: {
        meaning: "Chi tiêu theo cảm xúc để khỏa lấp nỗi buồn, hoặc thất vọng vì sự giúp đỡ tài chính không như mong đợi. Rủi ro bị lợi dụng lòng tốt về mặt tiền bạc.",
        advice: "Tách bạch cảm xúc ra khỏi các quyết định chi tiêu. Học cách nói lời từ chối trước những lời hỏi vay mượn thiếu minh bạch.",
        keyword: "Chi tiêu cảm xúc",
      },
    },
  },

  // 37: Two of Cups (Hai Cốc)
  37: {
    love: {
      upright: {
        meaning: "Sự hòa hợp tâm hồn hoàn hảo, tình yêu đôi lứa thấu hiểu và tôn trọng lẫn nhau. Tín hiệu tuyệt vời cho sự cam kết gắn bó, lời tỏ tình thành công hoặc mối lương duyên định mệnh.",
        advice: "Trân trọng sự kết nối thiêng liêng này và luôn đối thoại cởi mở, bình đẳng. Hãy cùng nhau nuôi dưỡng tình yêu bằng sự tin tưởng tuyệt đối.",
        keyword: "Tâm đầu ý hợp",
      },
      reversed: {
        meaning: "Mất kết nối cảm xúc, rạn nứt vì hiểu lầm hoặc sự thiếu bình đẳng trong mối quan hệ. Một bên cho đi quá nhiều trong khi bên kia thờ ơ, lãnh đạm.",
        advice: "Cần có một cuộc trò chuyện chân thành từ trái tim để tháo gỡ khúc mắc. Cân bằng lại cán cân cho và nhận trong tình yêu.",
        keyword: "Rạn nứt kết nối",
      },
    },
    career: {
      upright: {
        meaning: "Hợp tác làm ăn song phương vô cùng thuận lợi, tìm được đối tác ăn ý hoặc đồng nghiệp \"cạ cứng\" hỗ trợ nhau hết mình. Các thỏa thuận kinh doanh đạt được sự đồng thuận cao.",
        advice: "Xây dựng mối quan hệ làm việc dựa trên sự tôn trọng và lợi ích đôi bên cùng có lợi (win-win). Tận dụng sức mạnh hợp tác để gia tăng hiệu quả.",
        keyword: "Hợp tác ăn ý",
      },
      reversed: {
        meaning: "Bất đồng quan điểm với đối tác, chia rẽ nội bộ hoặc hợp đồng hợp tác có nguy cơ đổ vỡ do thiếu tin tưởng lẫn nhau. Xung đột lợi ích cá nhân.",
        advice: "Rà soát lại các điều khoản thỏa thuận và thẳng thắn đối thoại để tìm giải pháp hòa giải. Nếu không thể tìm thấy tiếng nói chung, hãy xem xét dừng lại văn minh.",
        keyword: "Đối tác bất hòa",
      },
    },
    finance: {
      upright: {
        meaning: "Thỏa thuận tài chính công bằng và đôi bên cùng có lợi. Cơ hội góp vốn làm ăn chung thuận lợi hoặc nhận được sự hỗ trợ tài chính từ bạn đời/đối tác tin cậy.",
        advice: "Minh bạch mọi con số và thỏa thuận rõ ràng về phân chia lợi nhuận. Sự tin cậy lẫn nhau là tài sản lớn nhất trong các thương vụ hợp tác.",
        keyword: "Đôi bên cùng có lợi",
      },
      reversed: {
        meaning: "Tranh chấp tiền bạc giữa hai bên, chia chác lợi nhuận không sòng phẳng hoặc thỏa thuận tài chính ngầm bị đổ bể. Nguy cơ mất tiền vì tin tưởng nhầm đối tác.",
        advice: "Mọi giao dịch tiền bạc cần phải có hợp đồng và giấy tờ pháp lý rõ ràng. Không dựa vào lời hứa miệng dù mối quan hệ có thân thiết đến đâu.",
        keyword: "Tranh chấp phân chia",
      },
    },
  },

  // 38: Three of Cups (Ba Cốc)
  38: {
    love: {
      upright: {
        meaning: "Niềm vui tụ họp, kỷ niệm ngọt ngào và sự gắn kết chan hòa giữa các mối quan hệ bạn bè, người yêu. Tình cảm được bạn bè và vòng tròn xã hội nhiệt tình ủng hộ, chúc phúc.",
        advice: "Hãy cùng người ấy tham gia vào các buổi gặp gỡ bạn bè và tận hưởng không khí vui vẻ. Đừng quên chia sẻ niềm vui của mình với những người thân thiết.",
        keyword: "Chung vui gắn kết",
      },
      reversed: {
        meaning: "Sự xuất hiện của người thứ ba xen vào mối quan hệ, hoặc tiệc tùng bù khú quá đà gây xao nhãng tình cảm lứa đôi. Bạn bè bàn ra tán vào gây chia rẽ.",
        advice: "Đặt ranh giới rõ ràng với người ngoài và các mối quan hệ bạn bè xã giao. Giữ kín chuyện riêng tư của hai người thay vì tâm sự quá nhiều với người khác.",
        keyword: "Kẻ thứ ba chen ngang",
      },
    },
    career: {
      upright: {
        meaning: "Dự án nhóm hoàn thành xuất sắc, tinh thần đồng đội thăng hoa và tập thể cùng ăn mừng thành quả. Môi trường làm việc thân thiện, hòa đồng và tràn ngập tiếng cười.",
        advice: "Tôn vinh tinh thần làm việc nhóm và đóng góp của từng thành viên. Xây dựng văn hóa gắn kết tập thể để duy trì động lực lâu dài.",
        keyword: "Đồng đội đoàn kết",
      },
      reversed: {
        meaning: "Buôn chuyện thị phi nơi công sở, bè phái chia rẽ hoặc làm việc nhóm kém hiệu quả vì mải vui chơi, đùn đẩy trách nhiệm. Ăn mừng quá sớm khi công việc chưa xong.",
        advice: "Tránh xa các hội nhóm ngồi lê đôi mách và tập trung vào chuyên môn cá nhân. Đặt ra kỷ luật rõ ràng trong công việc nhóm.",
        keyword: "Bè phái thị phi",
      },
    },
    finance: {
      upright: {
        meaning: "Tài chính dồi dào đủ để chi tiêu thoải mái cho các sự kiện vui chơi, tiệc tùng, đám cưới và quà tặng. Nhận được lộc ăn uống, quà biếu từ bạn bè, đồng nghiệp.",
        advice: "Tận hưởng niềm vui cùng bạn bè nhưng vẫn giữ khoản dự phòng nhất định. Hào phóng đúng nơi đúng lúc sẽ mang lại nhiều mối quan hệ giá trị.",
        keyword: "Lộc lá tiệc tùng",
      },
      reversed: {
        meaning: "Vung tay quá trán cho các buổi tiệc tùng, nhậu nhẹt và tụ tập bạn bè vô bổ. Hóa đơn chi tiêu giải trí vượt tầm kiểm soát dẫn đến rỗng túi.",
        advice: "Cắt giảm các cuộc vui chơi không cần thiết. Đừng vì nể nang hay muốn thể hiện trước bạn bè mà chi trả vượt quá khả năng tài chính của mình.",
        keyword: "Hoang phí tiệc tùng",
      },
    },
  },

  // 39: Four of Cups (Bốn Cốc)
  39: {
    love: {
      upright: {
        meaning: "Cảm giác chán chường, thờ ơ và không còn hứng thú với tình cảm. Bạn đang đắm chìm trong sự ủ rũ hoặc chán ngấy những lời tán tỉnh, vô tình bỏ qua một cơ hội chân thành đang ở ngay trước mắt.",
        advice: "Hãy ngẩng đầu lên và nhìn ra xung quanh. Cơ hội tình cảm đích thực có thể đang chờ bạn nhận ra, đừng để sự bi quan làm mờ mắt.",
        keyword: "Thờ ơ khép lòng",
      },
      reversed: {
        meaning: "Thức tỉnh sau chuỗi ngày chán nản, bạn bắt đầu mở lòng trở lại và sẵn sàng đón nhận những cơ hội mới. Nhận ra giá trị của những điều giản dị quanh mình.",
        advice: "Chủ động bước ra ngoài gặp gỡ mọi người và đón nhận những lời mời hẹn hò. Đây là lúc tái sinh năng lượng yêu thương.",
        keyword: "Thức tỉnh mở lòng",
      },
    },
    career: {
      upright: {
        meaning: "Mất động lực làm việc, cảm thấy bế tắc và thiếu cảm hứng sáng tạo. Bạn từ chối các cơ hội mới hoặc lời đề nghị hợp tác vì cảm thấy mọi thứ đều nhàm chán, vô nghĩa.",
        advice: "Đánh giá lại xem sự chán nản này đến từ công việc hay từ tâm lý bên trong bạn. Đừng vội từ chối cơ hội trước khi tìm hiểu kỹ lợi ích của nó.",
        keyword: "Nhàm chán bế tắc",
      },
      reversed: {
        meaning: "Tìm lại được niềm hứng khởi và động lực cống hiến cho công việc. Sẵn sàng nắm bắt một dự án mới mà trước đây bạn từng bỏ qua.",
        advice: "Hành động ngay khi cảm hứng quay trở lại. Hãy tích cực đề xuất các giải pháp cải tiến để thổi luồng gió mới vào công việc hiện tại.",
        keyword: "Tìm lại động lực",
      },
    },
    finance: {
      upright: {
        meaning: "Thờ ơ với các cơ hội kiếm tiền hoặc bỏ lỡ những khoản đầu tư tốt vì tâm lý chán nản, thiếu quyết đoán. Sự trì trệ trong việc quản lý tài chính cá nhân.",
        advice: "Xem xét lại các đề xuất tài chính mà bạn đã bỏ qua. Đừng để sự lười biếng làm tuột mất nguồn thu nhập tiềm năng.",
        keyword: "Bỏ lỡ cơ hội tiền tài",
      },
      reversed: {
        meaning: "Nhận ra cơ hội tài chính tiềm năng và bắt đầu hành động để cải thiện thu nhập. Thoát khỏi tình trạng trì trệ tiền bạc để tìm kiếm hướng đầu tư mới.",
        advice: "Bắt tay vào thực hiện ngay kế hoạch tài chính mới. Học hỏi thêm kiến thức đầu tư để gia tăng tài sản.",
        keyword: "Nắm bắt cơ hội mới",
      },
    },
  },

  // 40: Five of Cups (Năm Cốc)
  40: {
    love: {
      upright: {
        meaning: "Nỗi buồn chia ly, tiếc nuối và đau đớn vì mối tình tan vỡ hoặc kỳ vọng sụp đổ. Bạn đang mải nhìn vào những chiếc cốc đổ mà quên mất rằng vẫn còn hai chiếc cốc nguyên vẹn phía sau lưng.",
        advice: "Cho phép mình được đau buồn nhưng đừng đắm chìm mãi trong quá khứ. Hãy quay lưng lại và nhìn xem ai vẫn đang ở bên yêu thương, đồng hành cùng bạn.",
        keyword: "Tiếc nuối chia ly",
      },
      reversed: {
        meaning: "Vượt qua nỗi đau thất tình, chữa lành vết thương lòng và sẵn sàng tha thứ cho quá khứ. Bạn bắt đầu tìm lại sự bình yên và hy vọng vào tương lai mới.",
        advice: "Buông bỏ hoàn toàn những nuối tiếc cũ để mở đường cho hạnh phúc mới bước vào. Bạn xứng đáng được yêu thương một cách trọn vẹn.",
        keyword: "Chữa lành tha thứ",
      },
    },
    career: {
      upright: {
        meaning: "Thất bại trong một dự án, trượt phỏng vấn hoặc mất đi hợp đồng quan trọng mang lại cảm giác cay đắng và thất vọng. Bạn đang tự trách bản thân quá nhiều.",
        advice: "Chấp nhận thực tế và rút ra bài học kinh nghiệm sâu sắc từ thất bại này. Vẫn còn những cơ hội và nguồn lực khác để bạn làm lại từ đầu.",
        keyword: "Thất bại nuối tiếc",
      },
      reversed: {
        meaning: "Vực dậy tinh thần sau cú ngã nghề nghiệp, nhìn nhận thất bại như một bài học quý giá để trưởng thành. Bắt đầu lại với sự khôn ngoan và kiên cường hơn.",
        advice: "Tập trung vào những gì còn lại và xây dựng lại từ nền tảng đó. Đừng ngần ngại ứng tuyển vào các cơ hội mới với tâm thế vững vàng.",
        keyword: "Đứng dậy sau cú ngã",
      },
    },
    finance: {
      upright: {
        meaning: "Mất mát tài chính, thua lỗ đầu tư hoặc phát sinh chi phí đền bù ngoài ý muốn. Cảm giác đau xót vì số tiền đã mất khiến bạn mất ăn mất ngủ.",
        advice: "Chấp nhận cắt lỗ và dừng việc than vãn. Tập trung bảo vệ số vốn còn lại thay vì cố gắng gỡ gạc trong cơn tức giận kẻo mất thêm.",
        keyword: "Thua lỗ mất mát",
      },
      reversed: {
        meaning: "Dần phục hồi sau tổn thất tài chính, tìm ra cách khắc phục nợ nần hoặc nhận được khoản bồi thường, bảo hiểm an ủi. Dòng tiền bắt đầu ổn định trở lại.",
        advice: "Xây dựng lại kế hoạch tài chính an toàn và kỷ luật hơn. Tránh xa các kênh đầu tư có rủi ro tương tự trong tương lai.",
        keyword: "Phục hồi sau tổn thất",
      },
    },
  },

  // 41: Six of Cups (Sáu Cốc)
  41: {
    love: {
      upright: {
        meaning: "Sự trở lại của người yêu cũ, kỷ niệm thanh xuân ngọt ngào hoặc tình cảm chân thành, ngây thơ như thuở ban đầu. Mối quan hệ mang lại cảm giác ấm áp, an toàn và thân thuộc như người nhà.",
        advice: "Trân trọng những hồi ức đẹp và sự thuần khiết trong tình cảm. Nếu tái hợp, hãy yêu nhau bằng sự bao dung và thấu hiểu của hiện tại.",
        keyword: "Kỷ niệm ngọt ngào",
      },
      reversed: {
        meaning: "Mắc kẹt trong hoài niệm quá khứ, lý tưởng hóa người cũ khiến bạn không thể đón nhận người mới. Hoặc nhận ra người xưa đã thay đổi và không còn phù hợp nữa.",
        advice: "Đã đến lúc đóng lại cuốn sách quá khứ để sống cho hiện tại. Đừng so sánh người hiện tại với hình bóng lý tưởng hóa của quá khứ.",
        keyword: "Mắc kẹt hoài niệm",
      },
    },
    career: {
      upright: {
        meaning: "Được đồng nghiệp cũ giúp đỡ, quay lại công ty cũ làm việc hoặc tìm lại được niềm đam mê công việc từ thời thơ ấu. Cơ hội làm việc trong môi trường ấm cúng, hỗ trợ lẫn nhau.",
        advice: "Tận dụng các mối quan hệ cũ đáng tin cậy để tìm kiếm cơ hội nghề nghiệp. Mang sự hồn nhiên và đam mê thuở ban đầu vào công việc hiện tại.",
        keyword: "Hội ngộ quý nhân",
      },
      reversed: {
        meaning: "Tư duy làm việc bảo thủ, lối mòn lạc hậu không còn phù hợp với xu thế mới. Hoặc bị níu chân bởi công việc cũ thoải mái nhưng không có tương lai phát triển.",
        advice: "Bước ra khỏi vùng an toàn quen thuộc và cập nhật các kỹ năng hiện đại. Đừng vì nể nang tình cũ mà ở lại một môi trường không còn tiềm năng.",
        keyword: "Bảo thủ lối mòn",
      },
    },
    finance: {
      upright: {
        meaning: "Nhận được tài sản thừa kế, quà tặng từ người thân trong gia đình hoặc tiền cho vay từ xưa bất ngờ được hoàn trả. Tài chính mang lại sự an tâm và ấm no.",
        advice: "Trân trọng sự giúp đỡ của gia đình và người thân. Sử dụng khoản tiền may mắn này vào những mục đích có ý nghĩa lâu dài cho tổ ấm.",
        keyword: "Lộc lá người thân",
      },
      reversed: {
        meaning: "Tranh chấp tài sản thừa kế trong gia đình, hoặc sự phụ thuộc tài chính quá mức vào cha mẹ khiến bạn mất đi khả năng tự lập. Vay mượn tiền bạc dây dưa với người quen.",
        advice: "Tự chủ tài chính và tách bạch rõ ràng chuyện tiền nong với người thân trong nhà. Tránh để chuyện tiền bạc làm sứt mẻ tình cảm gia đình.",
        keyword: "Rắc rối tiền thân tộc",
      },
    },
  },

  // 42: Seven of Cups (Bảy Cốc)
  42: {
    love: {
      upright: {
        meaning: "Có quá nhiều sự lựa chọn, mối quan hệ mập mờ hoặc bạn đang vẽ nên viễn cảnh tình yêu màu hồng phi thực tế. Đứng núi này trông núi nọ khiến bạn hoang mang không biết trái tim mình thực sự muốn gì.",
        advice: "Kéo mình trở về mặt đất và nhìn vào con người thật của đối phương sau lớp filter lung linh. Hãy dũng cảm lựa chọn một người và chấm dứt các mối mập mờ.",
        keyword: "Mộng tưởng mập mờ",
      },
      reversed: {
        meaning: "Tỉnh mộng sau cơn say ảo tưởng, nhìn rõ sự thật trần trụi của mối quan hệ và đưa ra quyết định dứt khoát. Bạn không còn bị những lời đường mật đánh lừa.",
        advice: "Hành động dựa trên thực tế thay vì mơ mộng viển vông. Dứt khoát cắt đứt những mối quan hệ độc hại, ảo tưởng để giải phóng bản thân.",
        keyword: "Tỉnh mộng thực tế",
      },
    },
    career: {
      upright: {
        meaning: "Có quá nhiều dự án và cơ hội trước mắt nhưng thiếu sự tập trung, dẫn đến việc \"lắm mối tối nằm không\". Ý tưởng nhiều nhưng thiếu kế hoạch thực thi cụ thể.",
        advice: "Chọn lọc một mục tiêu duy nhất có tính khả thi cao nhất và dồn toàn lực vào đó. Đừng để sự phân tán làm bạn đánh mất cơ hội thực sự.",
        keyword: "Phân tán mục tiêu",
      },
      reversed: {
        meaning: "Tìm ra định hướng nghề nghiệp rõ ràng sau thời gian mông lung. Quyết định dứt khoát loại bỏ các dự án không hiệu quả để tập trung vào mục tiêu cốt lõi.",
        advice: "Lập kế hoạch hành động cụ thể và kiên trì bám sát từng bước. Sự tập trung cao độ sẽ mang lại kết quả rõ rệt.",
        keyword: "Định hình mục tiêu",
      },
    },
    finance: {
      upright: {
        meaning: "Cảnh báo các dự án \"bánh vẽ\", lời mời đầu tư siêu lợi nhuận nhưng thực chất là cạm bẫy lừa đảo. Chi tiêu tiền bạc cho những món đồ ảo tưởng không có giá trị thực.",
        advice: "Tỉnh táo trước những lời dụ dỗ kiếm tiền dễ dàng không cần làm việc. Kiểm tra kỹ tính pháp lý và năng lực thực tế trước khi rót tiền.",
        keyword: "Bánh vẽ lừa đảo",
      },
      reversed: {
        meaning: "Nhận ra cái bẫy tài chính kịp thời và dừng việc vung tiền vào các dự án rủi ro. Khôi phục lại sự tỉnh táo và kỷ luật quản lý tiền bạc.",
        advice: "Tập trung vào các kênh tích lũy và đầu tư truyền thống, minh bạch. Xây dựng lại nền tảng tài chính dựa trên lao động thực tế.",
        keyword: "Thoát bẫy tài chính",
      },
    },
  },

  // 43: Eight of Cups (Tám Cốc)
  43: {
    love: {
      upright: {
        meaning: "Dũng cảm quay lưng bước đi khỏi một mối quan hệ dù đã gắn bó sâu sắc, vì nhận ra nơi đây không còn mang lại hạnh phúc và sự tôn trọng. Hành trình tìm kiếm giá trị đích thực của bản thân.",
        advice: "Hãy lắng nghe tiếng gọi của nội tâm và can đảm dứt áo ra đi. Buông bỏ những gì đã cạn kiệt cảm xúc để tìm kiếm chân trời hạnh phúc mới.",
        keyword: "Dứt áo ra đi",
      },
      reversed: {
        meaning: "Do dự không nỡ rời đi, mắc kẹt trong mối quan hệ độc hại vì sợ cô đơn hoặc sợ phải bắt đầu lại từ đầu. Cố níu kéo những điều đã không còn cứu vãn được.",
        advice: "Đừng tự lừa dối mình thêm nữa. Việc kéo dài sự cam chịu chỉ làm bạn thêm kiệt quệ và đánh mất thanh xuân của chính mình.",
        keyword: "Lưỡng lự níu kéo",
      },
    },
    career: {
      upright: {
        meaning: "Quyết định từ bỏ công việc hiện tại dù mức lương ổn định để theo đuổi đam mê, sứ mệnh hoặc tìm kiếm môi trường mới có ý nghĩa hơn. Nhảy việc vì khát vọng phát triển.",
        advice: "Tin tưởng vào con đường mình đã chọn và sẵn sàng đối mặt với giai đoạn chuyển tiếp. Tương lai tươi sáng đang chờ bạn ở phía trước.",
        keyword: "Rời bỏ vùng an toàn",
      },
      reversed: {
        meaning: "Sợ hãi không dám nghỉ việc dù môi trường làm việc đã cạn kiệt cảm hứng và cơ hội thăng tiến. Hoặc nghỉ việc trong bốc đồng rồi nuối tiếc.",
        advice: "Chuẩn bị kế hoạch tài chính và năng lực kỹ lưỡng trước khi nộp đơn xin nghỉ. Đừng hành động chỉ vì cảm xúc giận dỗi nhất thời.",
        keyword: "Sợ hãi thay đổi",
      },
    },
    finance: {
      upright: {
        meaning: "Chấp nhận từ bỏ một khoản đầu tư không còn tiềm năng để cắt lỗ, chuyển dịch dòng vốn sang các kênh bền vững và an toàn hơn. Nhận ra tiền bạc không phải là tất cả.",
        advice: "Dứt khoát cơ cấu lại danh mục tài sản và loại bỏ các tài sản sinh lời kém. Hướng tới sự an tâm tài chính lâu dài.",
        keyword: "Cắt lỗ chuyển hướng",
      },
      reversed: {
        meaning: "Tiếc của cố gồng lỗ trong các thương vụ thất bại, không nỡ thanh lý tài sản mất giá dẫn đến thiệt hại ngày càng trầm trọng. Khó khăn trong việc buông bỏ.",
        advice: "Học cách chấp nhận mất mát để bảo toàn phần tài sản còn lại. Đừng để sự tiếc nuối làm tê liệt khả năng ra quyết định lý trí.",
        keyword: "Tiếc của gồng lỗ",
      },
    },
  },

  // 44: Nine of Cups (Chín Cốc)
  44: {
    love: {
      upright: {
        meaning: "Lá bài của \"ước gì được nấy\"! Sự hài lòng, viên mãn và tự tin tuyệt đối vào bản thân. Bạn đang tận hưởng tình yêu ngọt ngào hoặc cảm thấy hạnh phúc trọn vẹn ngay cả khi đang độc thân kiêu hãnh.",
        advice: "Tận hưởng niềm hạnh phúc hiện tại và lan tỏa năng lượng tích cực này đến đối phương. Khi bạn yêu bản thân, cả thế giới sẽ yêu bạn.",
        keyword: "Ước nguyện thành toàn",
      },
      reversed: {
        meaning: "Tự mãn, ích kỷ chỉ nghĩ đến sự thỏa mãn của riêng mình mà ngó lơ cảm xúc của đối phương. Vẻ ngoài hào nhoáng che đậy sự trống rỗng sâu kín bên trong tâm hồn.",
        advice: "Học cách sẻ chia và quan tâm chân thành đến người bạn đời thay vì chỉ đòi hỏi được cung phụng. Hạnh phúc thực sự đến từ sự kết nối hai chiều.",
        keyword: "Tự mãn ích kỷ",
      },
    },
    career: {
      upright: {
        meaning: "Đạt được vị trí công việc mơ ước, dự án gặt hái thành công ngoài mong đợi và nhận được sự khen ngợi nồng nhiệt. Bạn hoàn toàn hài lòng với thành quả lao động của mình.",
        advice: "Tự thưởng cho bản thân vì những nỗ lực đã bỏ ra. Tiếp tục duy trì phong độ và sự tự tin để chinh phục những đỉnh cao mới.",
        keyword: "Thành tựu viên mãn",
      },
      reversed: {
        meaning: "Ảo tưởng về thành công của mình, ngủ quên trên chiến thắng dẫn đến sự chểnh mảng và bị tụt lại phía sau. Kỳ vọng quá cao dẫn đến sự thất vọng.",
        advice: "Giữ thái độ khiêm tốn và liên tục trau dồi chuyên môn. Đừng để những lời tung hô nhất thời làm bạn mất đi sự nhạy bén nghề nghiệp.",
        keyword: "Ngủ quên chiến thắng",
      },
    },
    finance: {
      upright: {
        meaning: "Thịnh vượng tài chính, tiền tài sung túc và ước nguyện tài chính được hiện thực hóa. Bạn có đủ điều kiện để chi tiêu cho những tiện nghi xa xỉ và tận hưởng cuộc sống.",
        advice: "Tận hưởng thành quả tài chính xứng đáng nhưng đừng quên duy trì kế hoạch tiết kiệm dài hạn. Hào phóng giúp đỡ những người kém may mắn hơn.",
        keyword: "Tài chính sung túc",
      },
      reversed: {
        meaning: "Thói quen chi tiêu hưởng lạc quá độ, nghiện mua sắm hoặc phung phí tiền bạc vào những thú vui nhất thời dẫn đến hao hụt tài sản nhanh chóng.",
        advice: "Kiểm soát lại cơn nghiện mua sắm và các thói quen tiêu xài xa xỉ. Đặt ra giới hạn chi tiêu nghiêm ngặt để bảo vệ nguồn vốn tích lũy.",
        keyword: "Hưởng lạc hao tài",
      },
    },
  },

  // 45: Ten of Cups (Mười Cốc)
  45: {
    love: {
      upright: {
        meaning: "Hạnh phúc gia đình viên mãn, tình yêu trọn vẹn dưới mái ấm chan hòa yêu thương và tiếng cười. Biểu tượng của hôn nhân hạnh phúc lâu dài, sự đồng lòng và bình yên tuyệt đối.",
        advice: "Cùng nhau vun đắp và giữ gìn ngọn lửa ấm áp của gia đình. Trân trọng từng khoảnh khắc bình yên bên người bạn đời và những người thân yêu.",
        keyword: "Hạnh phúc trọn vẹn",
      },
      reversed: {
        meaning: "Mâu thuẫn gia đình, rạn nứt hôn nhân hoặc vỏ bọc gia đình hạnh phúc giả tạo đang dần sụp đổ. Bất đồng giữa hai bên gia đình nội ngoại cản trở tình cảm.",
        advice: "Chân thành đối thoại để hàn gắn những rạn nứt nội bộ. Đừng cố gắng duy trì một vỏ bọc hoàn hảo trước mặt thiên hạ khi bên trong đang rạn vỡ.",
        keyword: "Bất hòa mái ấm",
      },
    },
    career: {
      upright: {
        meaning: "Môi trường làm việc lý tưởng như một gia đình thứ hai, nơi mọi người hỗ trợ, sẻ chia và cùng nhau phát triển bền vững. Đạt được sự cân bằng hoàn hảo giữa công việc và cuộc sống.",
        advice: "Xây dựng mối quan hệ gắn bó lâu dài với công ty và đồng nghiệp. Chia sẻ kinh nghiệm và nâng đỡ những người đi sau cùng tiến bộ.",
        keyword: "Môi trường lý tưởng",
      },
      reversed: {
        meaning: "Môi trường làm việc giả tạo \"bằng mặt không bằng lòng\", xung đột giá trị đạo đức với công ty. Công việc chiếm quá nhiều thời gian làm ảnh hưởng xấu đến đời sống gia đình.",
        advice: "Thiết lập lại ranh giới giữa công việc và gia đình. Nếu văn hóa doanh nghiệp quá độc hại, hãy cân nhắc tìm kiếm nơi làm việc lành mạnh hơn.",
        keyword: "Xung đột văn hóa",
      },
    },
    finance: {
      upright: {
        meaning: "Tài chính gia đình an toàn tuyệt đối, tích lũy vững chắc đảm bảo tương lai sung túc cho nhiều thế hệ. Thịnh vượng dài lâu và không còn nỗi lo cơm áo gạo tiền.",
        advice: "Lập kế hoạch bảo vệ tài sản gia đình thông qua bảo hiểm, bất động sản hoặc quỹ thừa kế. Đầu tư vào giáo dục và tương lai con cái.",
        keyword: "Gia đạo thịnh vượng",
      },
      reversed: {
        meaning: "Tranh chấp tài chính gia đình, bất đồng về cách quản lý tiền bạc giữa vợ chồng. Chi phí sinh hoạt gia đình vượt mức kiểm soát gây áp lực lớn.",
        advice: "Vợ chồng cần ngồi lại công khai minh bạch mọi khoản thu chi. Thống nhất một kế hoạch tài chính chung để tránh xung đột tiền bạc.",
        keyword: "Bất đồng tài chính gia đình",
      },
    },
  },

  // 46: Page of Cups (Tiểu Đồng Cốc)
  46: {
    love: {
      upright: {
        meaning: "Một lời tỏ tình ngây thơ, tin nhắn tình cảm đáng yêu hoặc một rung động đầu đời trong trẻo. Bạn đang tiếp cận tình yêu với trái tim thuần khiết, nhạy cảm và đầy chất thơ.",
        advice: "Đừng ngại bày tỏ tình cảm chân thật của mình một cách dễ thương và sáng tạo. Hãy để sự dịu dàng và trực giác dẫn dắt bạn.",
        keyword: "Tỏ tình ngây thơ",
      },
      reversed: {
        meaning: "Tính khí trẻ con, hờn dỗi vô cớ, nhạy cảm quá mức dẫn đến tự ái vặt. Hoặc thất vọng vì lời tỏ tình bị từ chối, tin nhắn hẹn hò không nhận được hồi đáp.",
        advice: "Học cách làm chủ cảm xúc của mình và bớt nhạy cảm thái quá. Đừng biến những chuyện nhỏ nhặt thành bi kịch tình cảm.",
        keyword: "Hờn dỗi trẻ con",
      },
    },
    career: {
      upright: {
        meaning: "Tin vui bất ngờ về công việc, cơ hội thử sức trong các lĩnh vực nghệ thuật, sáng tạo hoặc truyền thông. Bạn tràn đầy những ý tưởng độc đáo và góc nhìn mới mẻ.",
        advice: "Lắng nghe trực giác sáng tạo của mình và mạnh dạn đề xuất các ý tưởng mới. Hãy bắt đầu học hỏi với tâm thế cởi mở và nhiệt tình.",
        keyword: "Ý tưởng sáng tạo",
      },
      reversed: {
        meaning: "Mơ mộng viển vông trong công việc, thiếu tính thực tế và dễ nản lòng khi gặp phản hồi tiêu cực. Chậm trễ trong việc phản hồi các thông tin quan trọng.",
        advice: "Kết hợp cảm hứng sáng tạo với tính kỷ luật thực thi. Đón nhận những lời góp ý chuyên môn với thái độ cầu thị thay vì tự ái.",
        keyword: "Mơ mộng phi thực tế",
      },
    },
    finance: {
      upright: {
        meaning: "Nhận được tin tức tài chính tích cực, một khoản tiền thưởng nhỏ hoặc quà tặng bất ngờ. Khởi đầu thuận lợi cho các dự án kinh doanh mang tính sáng tạo nghệ thuật.",
        advice: "Quản lý các khoản tiền nhỏ cẩn thận và đầu tư vào việc bồi dưỡng năng khiếu cá nhân. Trực giác tài chính của bạn đang khá nhạy bén.",
        keyword: "Tin vui tài lộc nhỏ",
      },
      reversed: {
        meaning: "Chi tiêu theo cảm hứng bốc đồng cho những món đồ trang trí, nghệ thuật không cần thiết. Thất vọng về một khoản tiền thưởng bị cắt giảm.",
        advice: "Kiểm soát chặt túi tiền và tránh các khoản chi tiêu vì xúc động nhất thời. Lập ngân sách cụ thể cho việc mua sắm sở thích.",
        keyword: "Chi tiêu bồng bột",
      },
    },
  },

  // 47: Knight of Cups (Hiệp Sĩ Cốc)
  47: {
    love: {
      upright: {
        meaning: "Hình mẫu \"bạch mã hoàng tử\" bước vào đời bạn với những cử chỉ lãng mạn, hoa hồng và những lời thì thầm ngọt ngào. Lời mời hẹn hò đầy chất thơ và sự theo đuổi tinh tế, sâu sắc.",
        advice: "Đón nhận sự lãng mạn ngọt ngào này nhưng vẫn giữ một chút lý trí để quan sát hành động thực tế. Hãy cùng nhau tận hưởng những khoảnh khắc thăng hoa.",
        keyword: "Bạch mã hoàng tử",
      },
      reversed: {
        meaning: "Kẻ đào hoa lăng nhăng, hứa hươu hứa vượn nhưng thiếu trách nhiệm thực tế. Mối quan hệ dựa trên những ảo tưởng màu hồng dễ vỡ tan khi va chạm với cuộc sống thực.",
        advice: "Cảnh giác với những kẻ nói hay làm dở và dùng sự lãng mạn để thao túng cảm xúc của bạn. Hãy nhìn vào hành động có trách nhiệm của họ.",
        keyword: "Đào hoa ảo tưởng",
      },
    },
    career: {
      upright: {
        meaning: "Được mời tham gia vào dự án mơ ước, cơ hội phát triển nghề nghiệp dựa trên sự sáng tạo, ngoại giao khéo léo và sự thấu cảm. Bạn được đồng nghiệp và cấp trên yêu mến.",
        advice: "Sử dụng sự duyên dáng và kỹ năng giao tiếp tinh tế để thương lượng và giải quyết công việc. Đặt trọn tâm huyết vào dự án bạn đam mê.",
        keyword: "Cơ hội mơ ước",
      },
      reversed: {
        meaning: "Thiếu tính quyết đoán, hành động theo cảm tính dẫn đến chậm trễ công việc. Tránh né các quyết định khó khăn hoặc để cảm xúc cá nhân làm hỏng việc chung.",
        advice: "Rèn luyện tính kỷ luật và sự dứt khoát. Tách bạch cảm xúc khỏi công việc chuyên môn và tập trung vào kết quả cụ thể.",
        keyword: "Cảm tính chần chừ",
      },
    },
    finance: {
      upright: {
        meaning: "Nhận được lời đề nghị đầu tư hấp dẫn từ người đáng tin cậy. Dòng tiền đến từ các công việc liên quan đến nghệ thuật, tư vấn hoặc dịch vụ khách hàng.",
        advice: "Lắng nghe trực giác nhưng vẫn cần kiểm tra các con số thực tế trước khi rót vốn. Đầu tư vào các dự án mang lại giá trị nhân văn.",
        keyword: "Cơ hội đầu tư đẹp",
      },
      reversed: {
        meaning: "Bị lừa tiền bởi những lời chào mời đầu tư vẽ ra viễn cảnh màu hồng. Chi tiêu quá nhiều cho hình thức lãng mạn, quà cáp vượt quá khả năng tài chính.",
        advice: "Tuyệt đối không đưa ra quyết định tiền bạc khi đang quá xúc động hoặc cả tin. Xem xét kỹ hợp đồng và các điều khoản pháp lý.",
        keyword: "Mắc bẫy viễn cảnh hồng",
      },
    },
  },

  // 48: Queen of Cups (Hoàng Hậu Cốc)
  48: {
    love: {
      upright: {
        meaning: "Người phụ nữ ấm áp, dịu dàng, giàu lòng trắc ẩn và thấu cảm sâu sắc. Tình yêu ngập tràn sự che chở, nâng niu và thấu hiểu không cần lời nói.",
        advice: "Lắng nghe trực giác mách bảo và dành cho đối phương sự quan tâm dịu dàng nhất. Tình yêu thương vị tha sẽ hóa giải mọi khúc mắc.",
        keyword: "Dịu dàng thấu cảm",
      },
      reversed: {
        meaning: "Cảm xúc bất ổn, thao túng tâm lý bằng sự giận dỗi, đóng vai nạn nhân hoặc ghen tuông mù quáng. Tình cảm trở nên ngột ngạt vì sự phụ thuộc cảm xúc quá mức.",
        advice: "Học cách làm chủ cảm xúc của bản thân thay vì đổ lỗi cho người khác. Tạo cho đối phương không gian riêng và chữa lành sự bất an bên trong bạn.",
        keyword: "Bất ổn thao túng",
      },
    },
    career: {
      upright: {
        meaning: "Khả năng lắng nghe, thấu cảm và giải quyết xung đột xuất sắc nơi công sở. Bạn là chỗ dựa tinh thần đáng tin cậy cho đồng đội, trực giác dẫn lối chuẩn xác trong công việc.",
        advice: "Phát huy trí tuệ cảm xúc (EQ) cao của bạn trong việc quản lý và làm việc nhóm. Tin tưởng vào linh cảm nghề nghiệp của mình.",
        keyword: "Trí tuệ cảm xúc",
      },
      reversed: {
        meaning: "Để cảm xúc cá nhân chi phối công việc, dễ bị tổn thương bởi những lời phê bình chuyên môn. Ôm đồm cảm xúc tiêu cực của người khác khiến bản thân kiệt sức.",
        advice: "Thiết lập ranh giới cảm xúc rõ ràng nơi công sở. Tiếp nhận các phản hồi công việc với tư duy chuyên nghiệp và khách quan.",
        keyword: "Dễ bị tổn thương",
      },
    },
    finance: {
      upright: {
        meaning: "Quản lý tài chính với trực giác nhạy bén và sự chu đáo, đảm bảo gia đình luôn đủ đầy, ấm no. Khả năng chi tiêu nhân văn và biết tích lũy cho người thân.",
        advice: "Lắng nghe linh cảm mách bảo khi đưa ra các quyết định chi tiêu lớn. Duy trì quỹ chăm sóc sức khỏe và hạnh phúc gia đình.",
        keyword: "Chu đáo tích lũy",
      },
      reversed: {
        meaning: "Chi tiền bốc đồng để giải tỏa căng thẳng tâm lý, hoặc bị người khác lợi dụng lòng thương để vay mượn không trả. Thiếu kiểm soát dòng tiền cá nhân.",
        advice: "Học cách nói \"không\" khi người khác hỏi mượn tiền mà không có lý do chính đáng. Đừng để lòng thương hại làm thủng túi tiền của bạn.",
        keyword: "Thủng túi vì cả nể",
      },
    },
  },

  // 49: King of Cups (Vua Cốc)
  49: {
    love: {
      upright: {
        meaning: "Người bạn đời trưởng thành, điềm đạm, bao dung và vững vàng về mặt cảm xúc. Mối quan hệ dựa trên sự tôn trọng, lòng thấu hiểu sâu sắc và tình yêu bền bỉ qua năm tháng.",
        advice: "Giữ sự điềm tĩnh và bao dung trong tình yêu. Hãy là bến đỗ bình yên và chỗ dựa vững chắc cho người mình yêu thương.",
        keyword: "Điềm đạm bao dung",
      },
      reversed: {
        meaning: "Thao túng cảm xúc tinh vi, lạnh lùng tàn nhẫn hoặc ngược lại là mất kiểm soát cảm xúc, nghiện ngập để trốn tránh thực tại. Sự thờ ơ, lãnh đạm làm đóng băng mối quan hệ.",
        advice: "Đối diện thẳng thắn với những bất ổn tâm lý thay vì trốn tránh hoặc thao túng người khác. Tìm kiếm sự cân bằng nội tâm trước khi tiếp tục mối quan hệ.",
        keyword: "Lãnh đạm thao túng",
      },
    },
    career: {
      upright: {
        meaning: "Phong cách lãnh đạo điềm tĩnh, công bằng và giàu lòng nhân ái. Bạn làm chủ cảm xúc trong mọi tình huống khủng hoảng và nhận được sự kính trọng tuyệt đối từ cấp dưới.",
        advice: "Dẫn dắt đội ngũ bằng sự sáng suốt và lòng trắc ẩn. Duy trì sự bình tĩnh tối đa trước mọi sóng gió công việc để đưa ra quyết định đúng đắn.",
        keyword: "Lãnh đạo nhân ái",
      },
      reversed: {
        meaning: "Lãnh đạo thiếu quyết đoán, thiên vị hoặc dùng quyền lực ngầm để trừng phạt người bất đồng ý kiến. Khủng hoảng quản trị do cảm xúc cá nhân chi phối chính sách.",
        advice: "Giữ vững sự công bằng và minh bạch trong mọi quyết định quản lý. Đừng để định kiến cá nhân làm ảnh hưởng đến đánh giá nhân sự.",
        keyword: "Thiên vị độc đoán",
      },
    },
    finance: {
      upright: {
        meaning: "Làm chủ tài chính với sự điềm tĩnh và thận trọng tuyệt đối. Không bị lung lay bởi lòng tham hay sự sợ hãi của thị trường, dòng tiền luôn ổn định vững chắc.",
        advice: "Duy trì chiến lược đầu tư bền vững và dài hạn. Hãy sử dụng tài chính để tạo ra những giá trị an toàn và nhân văn cho xã hội.",
        keyword: "Làm chủ dòng tiền",
      },
      reversed: {
        meaning: "Rủi ro tài chính do tin tưởng những lời hứa hẹn mờ ám hoặc vung tiền cứu giúp người khác một cách mù quáng. Thất thoát tài sản do thiếu kiểm toán chặt chẽ.",
        advice: "Rà soát lại toàn bộ các ủy quyền tài chính và kiểm soát chặt các dòng tiền ra vào. Đừng để cảm xúc làm mờ mắt trước các rủi ro hiển hiện.",
        keyword: "Mất kiểm soát tài chính",
      },
    },
  },

  // 50: Ace of Swords (Át Kiếm)
  50: {
    love: {
      upright: {
        meaning: "Sự thật sáng tỏ, cắt đứt mọi mập mờ và hiểu lầm bấy lâu. Một cuộc trò chuyện thẳng thắn, dứt khoát giúp cả hai nhìn rõ bản chất mối quan hệ và đưa ra quyết định sáng suốt.",
        advice: "Hãy trung thực tuyệt đối với cảm xúc của mình và đối phương. Sự thẳng thắn tuy có thể sắc bén nhưng sẽ giải phóng cả hai khỏi sự dối lừa.",
        keyword: "Chân lý sáng tỏ",
      },
      reversed: {
        meaning: "Lời nói cay độc gây sát thương sâu sắc cho đối phương, hoặc sự hiểu lầm bị bóp méo dẫn đến tranh cãi gay gắt. Cảm giác bối rối, mù mờ không nhìn ra lối thoát.",
        advice: "Uốn lưỡi bảy lần trước khi nói. Tránh dùng những từ ngữ xúc phạm hoặc đưa ra kết luận vội vàng khi tâm trí đang rối loạn.",
        keyword: "Sát thương ngôn từ",
      },
    },
    career: {
      upright: {
        meaning: "Tư duy logic sắc bén, ý tưởng đột phá và khả năng giải quyết vấn đề xuất sắc. Đạt được bước ngoặt lớn trong nghiên cứu, thi cử hoặc đàm phán hợp đồng thành công rực rỡ.",
        advice: "Tập trung cao độ vào mục tiêu trí tuệ và bảo vệ ý kiến chuyên môn bằng lập luận vững chắc. Sự rõ ràng và minh bạch là vũ khí mạnh nhất của bạn.",
        keyword: "Đột phá trí tuệ",
      },
      reversed: {
        meaning: "Tư duy rối loạn, thông tin sai lệch hoặc quyết định thiếu sáng suốt dẫn đến sai lầm nghiêm trọng. Ý tưởng bị chỉ trích gay gắt hoặc thất bại trong kỳ thi, phỏng vấn.",
        advice: "Kiểm tra lại toàn bộ dữ liệu và bằng chứng trước khi đưa ra kết luận. Lắng nghe các ý kiến phản biện để hoàn thiện kế hoạch.",
        keyword: "Tư duy rối loạn",
      },
    },
    finance: {
      upright: {
        meaning: "Nhìn rõ thực trạng tài chính, cắt bỏ các khoản chi tiêu lãng phí và đưa ra quyết định đầu tư lý trí, chính xác. Thắng kiện hoặc giành được quyền lợi tài chính hợp pháp.",
        advice: "Rà soát sổ sách tài chính với sự lạnh lùng và kỷ luật thép. Cắt bỏ ngay những chi phí vô bổ để tối ưu hóa dòng tiền.",
        keyword: "Quyết định lý trí",
      },
      reversed: {
        meaning: "Ký kết hợp đồng tài chính bất lợi do thiếu hiểu biết hoặc bị che giấu điều khoản quan trọng. Rủi ro tranh chấp pháp lý hoặc phạt tiền do sai sót giấy tờ.",
        advice: "Đọc kỹ từng câu chữ trong các điều khoản hợp đồng trước khi đặt bút ký. Tham khảo ý kiến chuyên gia pháp lý nếu còn nghi ngờ.",
        keyword: "Bẫy hợp đồng pháp lý",
      },
    },
  },

  // 51: Two of Swords (Hai Kiếm)
  51: {
    love: {
      upright: {
        meaning: "Tình thế tiến thoái lưỡng nan, bế tắc và né tránh đối diện với sự thật. Bạn đang bịt mắt bịt tai trước vấn đề nhức nhối trong mối quan hệ, không dám lựa chọn giữa buông hay giữ.",
        advice: "Hãy tháo chiếc khăn bịt mắt ra và đối diện với sự thật. Sự im lặng và né tránh chỉ kéo dài thêm nỗi đau cho cả hai mà thôi.",
        keyword: "Tiến thoái lưỡng nan",
      },
      reversed: {
        meaning: "Sự thật vỡ lở không thể trốn tránh thêm được nữa, buộc bạn phải đưa ra quyết định dứt khoát. Thoát khỏi trạng thái bế tắc để đối mặt với thực tế trần trụi.",
        advice: "Dũng cảm chọn một con đường và chấp nhận hậu quả đi kèm. Thà đau một lần rồi thôi còn hơn sống mãi trong sự dằn vặt lấp lửng.",
        keyword: "Bắt buộc lựa chọn",
      },
    },
    career: {
      upright: {
        meaning: "Bị kẹt giữa hai ngã rẽ nghề nghiệp hoặc hai luồng ý kiến trái ngược trong công ty. Trì hoãn ra quyết định vì sợ mắc sai lầm, dẫn đến đình trệ tiến độ công việc.",
        advice: "Thu thập thêm thông tin khách quan và cân nhắc kỹ được mất của từng phương án. Không thể làm hài lòng tất cả mọi người, hãy chọn giải pháp tối ưu nhất.",
        keyword: "Bế tắc quyết định",
      },
      reversed: {
        meaning: "Căng thẳng leo thang buộc bạn phải hành động ngay lập tức, hoặc bị quá tải thông tin dẫn đến quyết định sai lệch. Mối bất hòa nơi công sở không còn cách che giấu.",
        advice: "Giữ bình tĩnh và ưu tiên hành động theo quy trình chuẩn mực. Tránh để cảm giác hoảng loạn thúc ép bạn đưa ra quyết định bốc đồng.",
        keyword: "Vỡ trận trì hoãn",
      },
    },
    finance: {
      upright: {
        meaning: "Đứng trước hai lựa chọn tài chính khó khăn (như bán tháo hay gồng tiếp, đầu tư cái này hay cái kia). Thiếu thông tin rõ ràng khiến bạn đóng băng mọi quyết định.",
        advice: "Tạm hoãn các giao dịch tài chính lớn cho đến khi có đủ dữ liệu đáng tin cậy. Đừng tung đồng xu may rủi với số tiền mồ hôi nước mắt.",
        keyword: "Đóng băng tài chính",
      },
      reversed: {
        meaning: "Sự chậm trễ ra quyết định đã gây ra thiệt hại tài chính. Hoặc buộc phải đưa ra quyết định tài chính trong tình thế bị ép buộc, thiếu lợi thế.",
        advice: "Nhanh chóng xử lý dứt điểm các khoản nợ hoặc tài sản đang tranh chấp. Học bài học về sự quyết đoán trong quản lý tiền bạc.",
        keyword: "Thiệt hại do chần chừ",
      },
    },
  },

  // 52: Three of Swords (Ba Kiếm)
  52: {
    love: {
      upright: {
        meaning: "Nỗi đau thấu tim, sự phản bội, bị cắm sừng hoặc chia tay đau đớn. Những lời nói cay nghiệt xé toang trái tim, để lại vết thương sâu sắc khó lành.",
        advice: "Hãy để những giọt nước mắt tuôn rơi và chấp nhận nỗi đau này như một phần của sự trưởng thành. Đừng cố gắng níu kéo kẻ đã đâm sau lưng bạn.",
        keyword: "Vết cứa con tim",
      },
      reversed: {
        meaning: "Giai đoạn đau đớn nhất đã qua, vết thương lòng bắt đầu khép miệng và hồi phục. Bạn học cách tha thứ cho kẻ phản bội để giải thoát chính tâm hồn mình.",
        advice: "Tập trung chăm sóc bản thân và mở lòng với những nguồn năng lượng tích cực mới. Thời gian sẽ chữa lành mọi vết thương, hãy tin vào điều đó.",
        keyword: "Dần lành vết thương",
      },
    },
    career: {
      upright: {
        meaning: "Bị sa thải, dự án tâm huyết bị hủy bỏ đột ngột hoặc bị đồng nghiệp đâm sau lưng, cướp công. Môi trường công sở độc hại gây tổn thương tinh thần nặng nề.",
        advice: "Giữ phẩm giá và sự chuyên nghiệp trước nghịch cảnh. Rút ra bài học cảnh giác cho tương lai và tìm kiếm một môi trường làm việc tử tế hơn.",
        keyword: "Đâm sau lưng",
      },
      reversed: {
        meaning: "Vượt qua cú sốc thất nghiệp hoặc mâu thuẫn công việc bắt đầu được giải tỏa. Bạn bình tâm trở lại để bắt đầu tìm kiếm những cơ hội mới.",
        advice: "Để lại những thất vọng phía sau và làm mới hồ sơ xin việc. Năng lực thực sự của bạn sẽ tìm được nơi xứng đáng để tỏa sáng.",
        keyword: "Hàn gắn sau cú sốc",
      },
    },
    finance: {
      upright: {
        meaning: "Tổn thất tài chính nặng nề, mất tiền do bị lừa đảo hoặc tranh chấp chia chác tài sản gay gắt. Cảm giác đau xót vì số tiền dành dụm bỗng chốc tan thành mây khói.",
        advice: "Chấp nhận thực tế mất mát để giữ gìn sức khỏe tinh thần. Tránh xa các hành động bốc đồng cố gỡ gạc kẻo lún sâu vào nợ nần.",
        keyword: "Tổn thất nặng nề",
      },
      reversed: {
        meaning: "Dần khắc phục được hậu quả của cú sập tài chính, các khoản nợ bắt đầu được giải quyết từng bước. Tìm lại sự kiểm soát đối với tiền bạc cá nhân.",
        advice: "Lập kế hoạch tái thiết tài chính với sự kỷ luật cao độ. Coi sự mất mát này là học phí đắt giá để trở nên khôn ngoan hơn trên thị trường.",
        keyword: "Tái thiết tài chính",
      },
    },
  },

  // 53: Four of Swords (Bốn Kiếm)
  53: {
    love: {
      upright: {
        meaning: "Giai đoạn tạm dừng để hồi phục, rút lui để tĩnh tâm và chữa lành sau những sóng gió tình cảm. Cả hai cần có khoảng không gian riêng để suy ngẫm trước khi đưa ra quyết định tiếp theo.",
        advice: "Hãy cho bản thân và đối phương một khoảng lặng cần thiết. Đừng thúc ép hay nhắn tin dồn dập khi tâm trí cả hai đều đang kiệt quệ.",
        keyword: "Khoảng lặng phục hồi",
      },
      reversed: {
        meaning: "Thức tỉnh sau thời gian ở ẩn, sẵn sàng quay trở lại với tình yêu và cuộc sống hẹn hò. Hoặc ngược lại là kiệt sức kéo dài vì không chịu nghỉ ngơi.",
        advice: "Nếu đã cảm thấy hồi phục đủ năng lượng, hãy nhẹ nhàng mở lại kết nối với thế giới. Đừng để sự ẩn dật biến thành sự cô lập vĩnh viễn.",
        keyword: "Tái xuất sau tĩnh lặng",
      },
    },
    career: {
      upright: {
        meaning: "Kiệt sức vì công việc, cơ thể và tâm trí phát tín hiệu báo động cần nghỉ ngơi ngay lập tức. Thời điểm thích hợp để xin nghỉ phép, tạm rời xa deadline để tái tạo năng lượng.",
        advice: "Đừng ngần ngại bấm nút \"pause\" và nghỉ ngơi thật sâu. Một kỳ nghỉ ngắn lúc này sẽ giúp bạn lấy lại sự sáng suốt để tiếp tục đường dài.",
        keyword: "Nghỉ ngơi tái tạo",
      },
      reversed: {
        meaning: "Quay trở lại guồng quay công việc với năng lượng mới sau kỳ nghỉ. Hoặc cảnh báo tình trạng kiệt sức cực độ nếu bạn vẫn cố chấp lao vào làm việc không nghỉ.",
        advice: "Bắt nhịp lại công việc từ tốn, không nên ôm đồm ngay lập tức. Sắp xếp lịch trình làm việc và nghỉ ngơi khoa học, bền vững.",
        keyword: "Bắt nhịp trở lại",
      },
    },
    finance: {
      upright: {
        meaning: "Giai đoạn tài chính cần \"án binh bất động\", không nên thực hiện bất kỳ giao dịch mạo hiểm hay đầu tư mới nào. Giữ tiền mặt an toàn và duy trì mức chi tiêu tối thiểu.",
        advice: "Tạm dừng tất cả các kế hoạch rót vốn lớn. Để dòng tiền được nghỉ ngơi và tập trung bảo toàn vốn an toàn tuyệt đối.",
        keyword: "Án binh bất động",
      },
      reversed: {
        meaning: "Dòng tiền bắt đầu chuyển động trở lại sau thời gian đóng băng. Chuẩn bị nguồn lực để kích hoạt lại các dự án làm ăn đang tạm dừng.",
        advice: "Khởi động lại các kế hoạch kiếm tiền một cách thận trọng. Kiểm tra kỹ các điều kiện thị trường trước khi xuống tiền.",
        keyword: "Kích hoạt lại dòng tiền",
      },
    },
  },

  // 54: Five of Swords (Năm Kiếm)
  54: {
    love: {
      upright: {
        meaning: "Cãi vã thắng thua nhưng đánh mất tình cảm; cái tôi kiêu ngạo muốn đè bẹp đối phương dẫn đến sự cay đắng, oán hận. Cảm giác bị phản bội, bị chơi xấu hoặc đối phương dùng chiêu trò đê tiện.",
        advice: "Tự hỏi bản thân: \"Bạn muốn đúng hay muốn hạnh phúc?\". Đôi khi thắng một cuộc tranh cãi lại là khởi đầu cho sự tan vỡ của một mối tình.",
        keyword: "Thắng cuộc đau đớn",
      },
      reversed: {
        meaning: "Buông bỏ mong muốn hơn thua, nhận ra sự vô nghĩa của các cuộc chiến cái tôi và sẵn sàng hòa giải. Hoặc cảm giác bẽ bàng, nhục nhã sau một thất bại tình cảm cay đắng.",
        advice: "Dừng ngay việc tranh cãi và nhận trách nhiệm về phần mình. Hãy hạ vũ khí xuống nếu bạn còn muốn cứu vãn mối quan hệ này.",
        keyword: "Buông bỏ hơn thua",
      },
    },
    career: {
      upright: {
        meaning: "Môi trường công sở độc hại đầy rẫy đấu đá, chơi xấu sau lưng và hạ bệ nhau để tranh giành quyền lực. Bạn có thể thắng một phi vụ nhưng để lại nhiều kẻ thù nguy hiểm.",
        advice: "Biết chọn trận chiến mà đánh; tránh xa những cuộc đấu đá thị phi không mang lại giá trị. Bảo vệ bản thân bằng chứng cứ và sự minh bạch tuyệt đối.",
        keyword: "Đấu đá hạ bệ",
      },
      reversed: {
        meaning: "Chấm dứt các cuộc tranh chấp độc hại nơi công sở, giải tỏa mâu thuẫn hoặc dũng cảm từ bỏ một môi trường làm việc bẩn thỉu để giữ lấy sự liêm chính.",
        advice: "Chủ động tìm tiếng nói chung hoặc rút lui trong danh dự. Đừng để sự thù hận làm hoen ố sự nghiệp và đạo đức nghề nghiệp của bạn.",
        keyword: "Rút lui giữ mình",
      },
    },
    finance: {
      upright: {
        meaning: "Mất mát tài chính do bị lừa gạt, chơi xấu trong làm ăn hoặc tranh chấp hợp đồng gay gắt. Thắng kiện nhưng chi phí pháp lý và thiệt hại danh dự vượt quá số tiền thu về.",
        advice: "Cẩn trọng với những đối tác có dấu hiệu mờ ám, lươn lẹo. Cắt lỗ kịp thời thay vì lao vào các cuộc chiến pháp lý tốn kém vô ích.",
        keyword: "Tranh chấp cay đắng",
      },
      reversed: {
        meaning: "Chấp nhận thiệt hại nhỏ để dàn xếp ổn thỏa tranh chấp tài chính, tránh được hậu quả tồi tệ hơn. Nhận ra bộ mặt thật của kẻ gian lận tiền bạc.",
        advice: "Thỏa hiệp khôn ngoan để dứt điểm các vướng mắc tiền nong. Rút ra bài học cảnh giác cao độ trong mọi giao dịch sau này.",
        keyword: "Dàn xếp ổn thỏa",
      },
    },
  },

  // 55: Six of Swords (Sáu Kiếm)
  55: {
    love: {
      upright: {
        meaning: "Rời bỏ vùng biển giông bão để tiến về vùng nước êm ả hơn. Bạn đang dần buông bỏ quá khứ đau thương, cùng người ấy vượt qua giai đoạn khủng hoảng để tìm lại sự bình yên.",
        advice: "Kiên nhẫn trên hành trình chuyển tiếp này. Hãy để những tổn thương ở lại phía sau và cùng nhau hướng về tương lai tươi sáng hơn.",
        keyword: "Vượt qua sóng gió",
      },
      reversed: {
        meaning: "Mắc kẹt trong quá khứ không thể thoát ra, những vấn đề cũ liên tục quay lại ám ảnh mối quan hệ. Chuyến đi chuyển tiếp gặp trục trặc, bế tắc cảm xúc.",
        advice: "Đừng cố mang theo những rác rưởi của quá khứ lên con thuyền mới. Dũng cảm đối mặt và cắt đứt triệt để những ràng buộc độc hại cũ.",
        keyword: "Mắc kẹt quá khứ",
      },
    },
    career: {
      upright: {
        meaning: "Chuyển đổi công việc, thay đổi vị trí hoặc chuyển đến môi trường làm việc mới thuận lợi và ít áp lực hơn. Giai đoạn khó khăn nhất đã ở lại phía sau.",
        advice: "Chủ động thích nghi với môi trường mới và tiếp thu những quy trình làm việc hiện đại. Sự chuyển dịch này là bước đi hoàn toàn đúng đắn.",
        keyword: "Chuyển dịch êm ả",
      },
      reversed: {
        meaning: "Quá trình chuyển việc gặp trắc trở, thủ tục chuyển công tác bị trì hoãn hoặc môi trường mới không như mong đợi. Vẫn bị vướng víu bởi các trách nhiệm cũ chưa xong.",
        advice: "Giải quyết dứt điểm các công việc tồn đọng trước khi bước sang vị trí mới. Kiên nhẫn thích nghi và không nên vội nản lòng.",
        keyword: "Chuyển tiếp trắc trở",
      },
    },
    finance: {
      upright: {
        meaning: "Tài chính dần thoát khỏi giai đoạn khủng hoảng nợ nần, dòng tiền bắt đầu ổn định và dễ thở hơn. Có thể có chi phí liên quan đến việc di chuyển, chuyển nhà hoặc du lịch.",
        advice: "Duy trì kế hoạch chi tiêu tiết kiệm để tiếp tục tích lũy. Hướng dòng tiền vào những kênh an toàn và ít biến động.",
        keyword: "Ổn định dòng tiền",
      },
      reversed: {
        meaning: "Gặp khó khăn trong việc thanh toán các khoản nợ cũ, chi phí di chuyển hoặc tái định cư vượt ngoài dự kiến. Cảm giác bế tắc tài chính kéo dài.",
        advice: "Tìm kiếm sự hỗ trợ hoặc đàm phán kéo dài thời hạn thanh toán nợ. Hạn chế tối đa các khoản chi phát sinh trong giai đoạn này.",
        keyword: "Chậm trễ phục hồi",
      },
    },
  },

  // 56: Seven of Swords (Bảy Kiếm)
  56: {
    love: {
      upright: {
        meaning: "Cảnh báo sự lừa dối, thiếu trung thực, bắt cá hai tay hoặc lén lút sau lưng. Một bên đang che giấu bí mật lớn hoặc tìm cách thoái thác trách nhiệm trong mối quan hệ.",
        advice: "Mở to mắt nhìn rõ sự thật và tin vào linh cảm của mình. Đừng để những lời ngụy biện che mắt; hãy đối chất thẳng thắn khi có bằng chứng.",
        keyword: "Che giấu dối lừa",
      },
      reversed: {
        meaning: "Sự thật lừa dối bị phơi bày ra ánh sáng, chiếc mặt nạ bị gỡ xuống. Hoặc một bên cảm thấy cắn rứt lương tâm và quyết định thú nhận toàn bộ sự thật.",
        advice: "Dũng cảm đối diện với sự thật dù nó có đau đớn đến đâu. Thành thật là cơ hội duy nhất để cứu vãn mối quan hệ nếu cả hai còn muốn tiếp tục.",
        keyword: "Phơi bày sự thật",
      },
    },
    career: {
      upright: {
        meaning: "Cần sử dụng mưu lược, sự khôn khéo và bảo mật thông tin để bảo vệ dự án. Nguy cơ bị đối thủ chơi xấu, ăn cắp ý tưởng hoặc đồng nghiệp đùn đẩy trách nhiệm.",
        advice: "Giữ kín các kế hoạch chiến lược và tài liệu quan trọng. Đi một mình một cách âm thầm và luôn có phương án bảo mật dữ liệu.",
        keyword: "Chiến thuật ngầm",
      },
      reversed: {
        meaning: "Các hành vi gian lận, đi đường tắt hoặc chơi xấu nơi công sở bị phát giác và trừng phạt. Bị bắt quả tang hoặc kế hoạch lén lút bị đổ bể hoàn toàn.",
        advice: "Hành động minh bạch và tuân thủ tuyệt đối quy định đạo đức nghề nghiệp. Tránh xa các chiêu trò gian lận kẻo hủy hoại danh tiếng cả đời.",
        keyword: "Bại lộ mưu mô",
      },
    },
    finance: {
      upright: {
        meaning: "Nguy cơ bị mất trộm, lừa đảo tài chính qua mạng hoặc bị người khác quỵt tiền. Các giao dịch tài chính thiếu minh bạch tiềm ẩn rủi ro cực lớn.",
        advice: "Đổi mật khẩu, bảo mật tài khoản ngân hàng và kiểm tra kỹ sao kê tài chính. Tuyệt đối không cho vay mượn tiền khi không có giấy tờ pháp lý chuẩn xác.",
        keyword: "Cảnh giác trộm cắp",
      },
      reversed: {
        meaning: "Thoát khỏi một vụ lừa đảo tiền bạc trong gang tấc, hoặc thu hồi lại được tài sản từng bị chiếm đoạt. Kẻ gian lận tài chính bị vạch trần.",
        advice: "Rà soát lại toàn bộ lỗ hổng bảo mật tài chính cá nhân. Học bài học cảnh giác và không bao giờ chủ quan với tiền bạc.",
        keyword: "Thoát hiểm tài chính",
      },
    },
  },

  // 57: Eight of Swords (Tám Kiếm)
  57: {
    love: {
      upright: {
        meaning: "Cảm giác bế tắc, bất lực và bị giam cầm trong một mối quan hệ độc hại. Bạn tự trói buộc mình bằng những nỗi sợ vô hình và tin rằng mình không có lối thoát, dù thực chất lối thoát luôn ở quanh bạn.",
        advice: "Hãy nhận ra rằng chiếc lồng giam giữ bạn do chính tâm lý sợ hãi dựng nên. Mở mắt ra và dũng cảm bước ra khỏi mối quan hệ độc hại này.",
        keyword: "Tự trói buộc",
      },
      reversed: {
        meaning: "Tháo bỏ sợi dây trói buộc, nhìn rõ lối thoát và tìm lại sự tự do cho bản thân. Bạn chấm dứt sự cam chịu và lấy lại quyền tự chủ đối với cuộc đời mình.",
        advice: "Hít một hơi thật sâu và tự tin bước về phía trước. Bạn mạnh mẽ hơn bạn tưởng rất nhiều, hãy tự giải phóng cho chính mình.",
        keyword: "Giải phóng tự do",
      },
    },
    career: {
      upright: {
        meaning: "Cảm thấy bế tắc tột cùng trong công việc hiện tại, ngột ngạt vì quy định khắt khe hoặc tự ti về năng lực bản thân. Bạn nghĩ rằng mình không thể tìm được việc khác tốt hơn.",
        advice: "Nhìn nhận lại năng lực thực tế của bản thân và ngừng việc tự giới hạn mình. Tìm kiếm sự tư vấn từ bên ngoài để nhìn thấy những cơ hội mới.",
        keyword: "Bế tắc công việc",
      },
      reversed: {
        meaning: "Tìm ra giải pháp cho bài toán hóc búa, phá bỏ rào cản tâm lý để thay đổi công việc. Cơ hội việc làm mới mở ra sau chuỗi ngày cảm thấy ngột ngạt.",
        advice: "Nắm bắt ngay cơ hội chuyển mình và tự tin thể hiện khả năng. Đừng để những nỗi sợ trong quá khứ tiếp tục kìm hãm bước tiến của bạn.",
        keyword: "Phá vỡ bế tắc",
      },
    },
    finance: {
      upright: {
        meaning: "Cảm giác bị siết chặt bởi nợ nần và các nghĩa vụ tài chính, không thấy lối thoát. Tâm lý sợ hãi làm tê liệt khả năng tìm kiếm thêm nguồn thu nhập mới.",
        advice: "Đối diện thẳng thắn với các con số thay vì sợ hãi trốn tránh. Lập danh sách các khoản nợ và giải quyết từng bước nhỏ một.",
        keyword: "Siết chặt nợ nần",
      },
      reversed: {
        meaning: "Bắt đầu tháo gỡ được các nút thắt tài chính, tìm ra phương án trả nợ khả thi và giảm bớt gánh nặng tiền bạc. Thoát khỏi khủng hoảng.",
        advice: "Tận dụng đà này để thiết lập lại kỷ luật tài chính nghiêm ngặt. Tích cực gia tăng thu nhập và giữ vững tinh thần lạc quan.",
        keyword: "Tháo gỡ nợ nần",
      },
    },
  },

  // 58: Nine of Swords (Chín Kiếm)
  58: {
    love: {
      upright: {
        meaning: "Mất ngủ, lo âu, ám ảnh và dằn vặt tâm can vì những nghi ngờ hoặc nỗi sợ đổ vỡ trong tình cảm. Bạn đang phóng đại sự việc trong tâm trí và tự hành hạ bản thân.",
        advice: "Hãy chia sẻ nỗi bất an với đối phương thay vì một mình thức trắng đêm suy diễn tiêu cực. Hầu hết những nỗi sợ đều chỉ tồn tại trong trí tưởng tượng của bạn.",
        keyword: "Mất ngủ lo âu",
      },
      reversed: {
        meaning: "Cơn ác mộng dần tan biến, bạn nhận ra mọi chuyện không tệ như mình từng nghĩ và tìm lại được sự bình an trong tâm hồn. Thoát khỏi chứng trầm cảm, lo âu.",
        advice: "Học cách tha thứ cho bản thân và tìm kiếm sự hỗ trợ tâm lý nếu cần. Hãy để ánh sáng của sự thật xua tan bóng tối của những nỗi sợ vô căn cứ.",
        keyword: "Tan biến âu lo",
      },
    },
    career: {
      upright: {
        meaning: "Căng thẳng tột độ, stress nặng nề vì áp lực công việc, deadline hoặc nỗi sợ bị đuổi việc. Bạn cảm thấy cô độc và bất an tột cùng trước tương lai sự nghiệp.",
        advice: "Chia nhỏ khối lượng công việc và giải quyết từng việc một. Đừng ngại chia sẻ áp lực với cấp trên hoặc tìm kiếm sự trợ giúp từ đồng đội.",
        keyword: "Stress kiệt quệ",
      },
      reversed: {
        meaning: "Áp lực công việc hạ nhiệt, tìm ra giải pháp tháo gỡ khó khăn và lấy lại sự tự tin. Bạn học được cách quản lý căng thẳng hiệu quả hơn.",
        advice: "Dành thời gian chăm sóc sức khỏe thể chất và tinh thần. Đừng để công việc hủy hoại giấc ngủ và sự an yên của bạn.",
        keyword: "Hạ nhiệt căng thẳng",
      },
    },
    finance: {
      upright: {
        meaning: "Nỗi sợ hãi mất tiền và áp lực tài chính khiến bạn mất ăn mất ngủ. Ám ảnh về nợ nần hoặc các khoản chi phí khẩn cấp ngoài tầm kiểm soát.",
        advice: "Hít thở sâu và viết ra giấy mọi khoản thu chi cụ thể. Sự rõ ràng sẽ giúp bạn bớt hoảng sợ và tìm ra phương án xử lý từng bước.",
        keyword: "Hoảng sợ tài chính",
      },
      reversed: {
        meaning: "Gánh nặng tài chính giảm bớt, tìm được nguồn tài chính hỗ trợ hoặc tìm ra hướng giải quyết nợ nần. Tâm trí bớt nặng nề về chuyện tiền bạc.",
        advice: "Duy trì lối sống tiết kiệm và tiếp tục bám sát kế hoạch trả nợ. Hãy tập trung vào việc tạo ra giá trị thay vì lo lắng vô ích.",
        keyword: "Giải tỏa gánh nặng tiền bạc",
      },
    },
  },

  // 59: Ten of Swords (Mười Kiếm)
  59: {
    love: {
      upright: {
        meaning: "Sự kết thúc đau đớn, chia tay dứt điểm hoặc một cú sốc phản bội chí mạng khiến bạn gục ngã hoàn toàn. Mối quan hệ đã chạm đáy vực thẳm và không còn đường quay lại.",
        advice: "Chấp nhận rằng mọi chuyện đã thực sự kết thúc. Hãy để nó ra đi hoàn toàn; khi đã chạm đáy nỗi đau, con đường duy nhất còn lại là đi lên đón ánh bình minh.",
        keyword: "Chạm đáy nỗi đau",
      },
      reversed: {
        meaning: "Sự hồi sinh sau cú ngã đau đớn nhất, bắt đầu đứng dậy từ đống tro tàn để làm lại cuộc đời. Thoát khỏi một mối quan hệ độc hại hủy hoại bản thân.",
        advice: "Dũng cảm bước tiếp và không bao giờ nhìn lại phía sau nữa. Bạn đã vượt qua được điều tồi tệ nhất, những ngày tươi sáng hơn chắc chắn đang chờ đón bạn.",
        keyword: "Hồi sinh từ tro tàn",
      },
    },
    career: {
      upright: {
        meaning: "Dự án sụp đổ hoàn toàn, bị sa thải đột ngột hoặc công ty phá sản. Một thất bại nặng nề khép lại một chương sự nghiệp đầy cay đắng.",
        advice: "Đừng cố gắng hồi sinh một thứ đã chết. Hãy chấp nhận kết cục, đóng lại cánh cửa này để chuẩn bị bước qua một cánh cửa cơ hội hoàn toàn mới.",
        keyword: "Sụp đổ hoàn toàn",
      },
      reversed: {
        meaning: "Vực dậy sự nghiệp sau khủng hoảng, tìm được công việc mới tốt hơn sau khi bị sa thải. Bài học từ thất bại đau đớn giúp bạn trở nên bất khả chiến bại.",
        advice: "Bắt đầu lại với tâm thế của một người từng trải và kiên cường. Tận dụng kinh nghiệm xương máu này để xây dựng sự nghiệp mới vững chắc hơn.",
        keyword: "Tái sinh sự nghiệp",
      },
    },
    finance: {
      upright: {
        meaning: "Khủng hoảng tài chính tồi tệ nhất, phá sản, mất trắng hoặc vỡ nợ hoàn toàn. Mọi kế hoạch tài chính trước đây đều bị sụp đổ.",
        advice: "Chấp nhận sự thật mất mát và bắt đầu từ con số không. Tìm kiếm sự trợ giúp pháp lý hoặc hỗ trợ từ người thân để ổn định lại cuộc sống cơ bản.",
        keyword: "Phá sản chạm đáy",
      },
      reversed: {
        meaning: "Thoát khỏi bờ vực phá sản trong gang tấc, bắt đầu tái cơ cấu lại tài sản từ đống đổ nát. Giai đoạn đen tối nhất về tiền bạc đã chính thức khép lại.",
        advice: "Từng bước xây dựng lại quỹ khẩn cấp và nguồn thu nhập ổn định. Tuyệt đối không bao giờ lặp lại những sai lầm tài chính đã qua.",
        keyword: "Thoát hiểm phá sản",
      },
    },
  },

  // 60: Page of Swords (Tiểu Đồng Kiếm)
  60: {
    love: {
      upright: {
        meaning: "Tính tò mò, hay soi mói mạng xã hội của đối phương hoặc những cuộc trò chuyện đấu trí thông minh, sắc sảo. Cẩn thận sự bốc đồng, nói năng thiếu suy nghĩ làm tổn thương tình cảm.",
        advice: "Thẳng thắn trò chuyện trực tiếp thay vì lén lút rình mò thông tin. Dùng sự thông minh để thấu hiểu chứ không phải để bắt bẻ từng câu chữ của nhau.",
        keyword: "Tò mò săm soi",
      },
      reversed: {
        meaning: "Nói xấu sau lưng, lan truyền tin đồn thất thiệt hoặc tính khí bốc đồng, cãi bướng trẻ con phá hỏng mối quan hệ. Gián điệp mạng xã hội dẫn đến ghen tuông hoang tưởng.",
        advice: "Dừng ngay việc soi mói đời tư của người khác trên mạng xã hội. Học cách kiềm chế lời nói và tôn trọng sự riêng tư của đối phương.",
        keyword: "Thị phi soi mói",
      },
    },
    career: {
      upright: {
        meaning: "Đầu óc nhanh nhạy, ham học hỏi và sẵn sàng tiếp thu công nghệ, kiến thức mới. Bạn có khả năng thu thập thông tin và phát hiện vấn đề cực kỳ nhanh chóng.",
        advice: "Hãy đặt nhiều câu hỏi và luôn giữ tinh thần phản biện lành mạnh. Cẩn trọng kiểm chứng thông tin trước khi báo cáo lên cấp trên.",
        keyword: "Nhanh nhạy học hỏi",
      },
      reversed: {
        meaning: "Thích thể hiện, nói nhiều làm ít, hay cãi cấp trên nhưng thiếu kiến thức chuyên môn sâu. Lan truyền tin đồn thất thiệt nơi công sở gây mất đoàn kết.",
        advice: "Học cách lắng nghe nhiều hơn và khiêm tốn tích lũy kinh nghiệm. Đừng vội vã phán xét khi bản thân chưa nắm rõ toàn bộ sự việc.",
        keyword: "Ngựa non háu đá",
      },
    },
    finance: {
      upright: {
        meaning: "Tích cực tìm hiểu kiến thức tài chính, nghiên cứu thị trường và tìm kiếm cơ hội kiếm tiền mới. Tò mò với các kênh đầu tư công nghệ hoặc mô hình mới.",
        advice: "Nghiên cứu kỹ lưỡng trước khi bỏ tiền đầu tư. Dành thời gian học hỏi kiến thức quản lý tài chính từ những nguồn uy tín.",
        keyword: "Nghiên cứu thị trường",
      },
      reversed: {
        meaning: "Nghe ngóng tin đồn thất thiệt trên mạng rồi vội vã mua bán dẫn đến thua lỗ. Chi tiêu tiền bạc cho các khóa học làm giàu ảo chất lượng kém.",
        advice: "Tỉnh táo trước những \"chuyên gia mạng\" và tin đồn đầu tư không có cơ sở. Giữ chặt tiền và tập trung vào các kiến thức tài chính căn bản.",
        keyword: "Tin đồn thất thiệt",
      },
    },
  },

  // 61: Knight of Swords (Hiệp Sĩ Kiếm)
  61: {
    love: {
      upright: {
        meaning: "Sự theo đuổi quyết liệt, thẳng thắn và bộc trực. Một người thông minh, sắc bén và không ngại nói thẳng suy nghĩ của mình bước vào cuộc sống của bạn với tốc độ chóng mặt.",
        advice: "Thẳng thắn bày tỏ quan điểm nhưng hãy giữ sự dịu dàng và tinh tế. Đừng biến cuộc trò chuyện tình yêu thành một cuộc tranh luận nảy lửa.",
        keyword: "Quyết liệt bộc trực",
      },
      reversed: {
        meaning: "Nóng nảy, hung hăng, lời nói thô bạo gây tổn thương sâu sắc. Người đến nhanh rồi đi vội, thiếu sự kiên nhẫn và thấu hiểu cảm xúc của đối phương.",
        advice: "Hãm bớt sự hiếu thắng và cơn nóng giận lại. Nếu đối phương là kẻ bạo lực ngôn từ, hãy dứt khoát tránh xa để bảo vệ an toàn cho bản thân.",
        keyword: "Hung hăng thô bạo",
      },
    },
    career: {
      upright: {
        meaning: "Tấn công mục tiêu thần tốc, quyết đoán và giải quyết công việc với hiệu suất cực cao. Bạn không ngại va chạm và sẵn sàng phá vỡ các rào cản để đạt được thành tựu.",
        advice: "Tập trung cao độ và hành động quyết đoán để nắm bắt cơ hội. Tuy nhiên, hãy nhớ quan sát xung quanh để tránh làm tổn thương đồng đội.",
        keyword: "Thần tốc quyết đoán",
      },
      reversed: {
        meaning: "Hành động liều lĩnh, mù quáng, lao đầu vào ngõ cụt mà không nghe lời can ngăn. Gây thù chuốc oán nơi công sở do tính cách hiếu chiến và ngạo mạn.",
        advice: "Chậm lại và suy nghĩ thấu đáo về hậu quả trước khi ra đòn. Lắng nghe ý kiến của tập thể để tránh những sai lầm chết người do độc đoán.",
        keyword: "Liều lĩnh mù quáng",
      },
    },
    finance: {
      upright: {
        meaning: "Quyết định tài chính chớp nhoáng, nắm bắt cơ hội lướt sóng hoặc đầu tư quyết liệt mang lại kết quả nhanh chóng. Dám chấp nhận rủi ro có tính toán.",
        advice: "Hành động nhanh chóng khi thấy thời cơ chín muồi, nhưng luôn đặt lệnh cắt lỗ nghiêm ngặt để bảo vệ tài khoản.",
        keyword: "Lướt sóng quyết đoán",
      },
      reversed: {
        meaning: "Giao dịch theo cảm xúc, đu đỉnh bắt đáy vội vã dẫn đến \"cháy tài khoản\" trong tích tắc. Thất thoát tài chính do tính hiếu thắng và thiếu kiên nhẫn.",
        advice: "Dừng ngay các giao dịch đòn bẩy cao hoặc lướt sóng mạo hiểm. Kỷ luật và sự kiên nhẫn là bài học đắt giá nhất bạn cần học lúc này.",
        keyword: "Cháy tài khoản vì hấp tấp",
      },
    },
  },

  // 62: Queen of Swords (Hoàng Hậu Kiếm)
  62: {
    love: {
      upright: {
        meaning: "Người phụ nữ thông minh, độc lập, ranh giới rõ ràng và có cái nhìn sâu sắc. Bạn yêu bằng cả trái tim nhưng dùng lý trí sắc bén để bảo vệ phẩm giá của mình.",
        advice: "Duy trì ranh giới cá nhân lành mạnh và giao tiếp thẳng thắn, chân thành. Hãy mở lòng đón nhận tình cảm nhưng không bao giờ hạ thấp tiêu chuẩn của mình.",
        keyword: "Độc lập sắc sảo",
      },
      reversed: {
        meaning: "Cay nghiệt, lạnh lùng, dựng lên bức tường băng giá và phán xét đối phương quá khắt khe. Nỗi đau trong quá khứ biến bạn thành người hay chỉ trích và khó gần.",
        advice: "Hạ bớt sự cay nghiệt và mở rộng lòng bao dung. Đừng trừng phạt người hiện tại vì những lỗi lầm của những kẻ trong quá khứ.",
        keyword: "Lạnh lùng phán xét",
      },
    },
    career: {
      upright: {
        meaning: "Khả năng phân tích chuyên môn xuất sắc, tư duy rành mạch và sự công tâm tuyệt đối trong công việc. Bạn là người giải quyết vấn đề lý tưởng, được đồng nghiệp nể phục.",
        advice: "Dựa vào dữ liệu và lập luận logic để thuyết phục mọi người. Giữ vững lập trường công bằng và tính chuyên nghiệp trong mọi hoàn cảnh.",
        keyword: "Phân tích sắc bén",
      },
      reversed: {
        meaning: "Lãnh đạo độc đoán, soi mói khuyết điểm của cấp dưới và thiếu sự cảm thông con người. Tạo ra môi trường làm việc ngột ngạt và căng thẳng.",
        advice: "Kết hợp sự sắc bén của trí tuệ với lòng nhân ái trong quản lý. Lắng nghe và khích lệ nhân viên thay vì chỉ chăm chăm chỉ trích sai lầm.",
        keyword: "Khắt khe cay nghiệt",
      },
    },
    finance: {
      upright: {
        meaning: "Quản lý tài chính độc lập, minh bạch và có kỷ luật thép. Khả năng nhìn thấu các con số và đưa ra các quyết định đầu tư an toàn, hiệu quả dựa trên lý trí.",
        advice: "Tiếp tục duy trì sự độc lập tài chính và kiểm soát chặt chẽ ngân sách. Không để yếu tố cảm xúc chi phối các quyết định tiền bạc.",
        keyword: "Kỷ luật thép tài chính",
      },
      reversed: {
        meaning: "Quá chi li bủn xỉn hoặc ngược lại bị các quyết định thiên kiến làm sai lệch định giá đầu tư. Tranh chấp tài chính với người thân do sự cứng nhắc quá mức.",
        advice: "Linh hoạt hơn trong việc phân bổ tài chính. Tiền bạc là công cụ phục vụ cuộc sống, đừng biến mình thành nô lệ của những con số khô khan.",
        keyword: "Chi li cứng nhắc",
      },
    },
  },

  // 63: King of Swords (Vua Kiếm)
  63: {
    love: {
      upright: {
        meaning: "Một tình yêu chín chắn, dựa trên sự tôn trọng trí tuệ, bình đẳng và giao tiếp rành mạch. Người bạn đời bản lĩnh, có nguyên tắc sống vững vàng và luôn bảo vệ công lý.",
        advice: "Giao tiếp bằng sự trung thực, rõ ràng và tôn trọng lẫn nhau. Hãy kết hợp lý trí sáng suốt với tình cảm ấm áp để xây dựng mối quan hệ bền vững.",
        keyword: "Trí tuệ bản lĩnh",
      },
      reversed: {
        meaning: "Độc đoán, gia trưởng, dùng lý lẽ sắc bén để chèn ép và thao túng tâm lý đối phương. Sự lạnh lùng vô cảm giết chết mọi cảm xúc lãng mạn trong mối quan hệ.",
        advice: "Tình yêu cần sự dịu dàng và cảm xúc chứ không phải là một phiên tòa phân xử đúng sai. Hãy học cách lắng nghe bằng cả trái tim.",
        keyword: "Độc đoán vô cảm",
      },
    },
    career: {
      upright: {
        meaning: "Đỉnh cao của quyền lực trí tuệ, tư duy chiến lược xuất sắc và thẩm quyền pháp lý vững chắc. Bạn là chuyên gia đầu ngành, người đưa ra các phán quyết quan trọng nhất.",
        advice: "Đưa ra các quyết định dựa trên sự công bằng, đạo đức nghề nghiệp và dữ liệu chuẩn xác. Hãy là người lãnh đạo công tâm và mẫu mực.",
        keyword: "Thẩm quyền tối cao",
      },
      reversed: {
        meaning: "Lạm dụng quyền lực, độc tài chuyên chế hoặc dùng mưu mẹo luật pháp để chèn ép người khác. Thất bại trong quản trị do sự cứng nhắc và xa rời thực tế.",
        advice: "Kiểm điểm lại phong cách lãnh đạo và tôn trọng tiếng nói của cấp dưới. Quyền lực chỉ bền vững khi đi kèm với sự công tâm và lòng nhân đạo.",
        keyword: "Lạm quyền độc tài",
      },
    },
    finance: {
      upright: {
        meaning: "Làm chủ tài chính hoàn toàn bằng tư duy chiến lược và sự am hiểu sâu sắc về luật pháp, thị trường. Ký kết các hợp đồng tài chính lớn với điều khoản vô cùng chặt chẽ.",
        advice: "Quản lý tài sản theo các chuẩn mực pháp lý cao nhất và tham khảo ý kiến luật sư chuyên nghiệp. Đầu tư dựa trên phân tích kỹ thuật và vĩ mô vững chắc.",
        keyword: "Chiến lược tài chính vĩ mô",
      },
      reversed: {
        meaning: "Rủi ro vướng vào các vụ kiện tụng tài chính phức tạp, bị thanh tra hoặc phạt tiền do các sai phạm pháp lý. Thất thoát tài sản do quá tự tin vào suy đoán cá nhân.",
        advice: "Rà soát lại toàn bộ tính hợp pháp của các nguồn thu và hồ sơ thuế. Tuyệt đối không tham gia vào các hoạt động tài chính nằm ngoài khuôn khổ luật pháp.",
        keyword: "Rủi ro pháp lý tài chính",
      },
    },
  },

  // 64: Ace of Pentacles (Át Tiền)
  64: {
    love: {
      upright: {
        meaning: "Khởi đầu một mối quan hệ vững chắc, thực tế và đầy triển vọng lâu dài. Tình cảm được xây dựng trên nền tảng an toàn, sự tin cậy và có điều kiện vật chất thuận lợi để cùng nhau phát triển.",
        advice: "Hãy gieo mầm yêu thương một cách kiên nhẫn và chăm sóc mối quan hệ bằng những hành động thực tế. Sự chân thành và ổn định sẽ mang lại quả ngọt.",
        keyword: "Nền tảng vững chắc",
      },
      reversed: {
        meaning: "Bỏ lỡ cơ hội tình cảm tốt vì sự do dự, hoặc mối quan hệ gặp trở ngại lớn do gánh nặng tài chính, nợ nần bủa vây. Cảm giác thiếu an toàn về tương lai vật chất.",
        advice: "Tập trung giải quyết các bài toán kinh tế thực tế trước khi đặt ra những cam kết quá lớn. Đừng để nỗi lo tiền bạc làm lung lay tình cảm chân thật.",
        keyword: "Rào cản vật chất",
      },
    },
    career: {
      upright: {
        meaning: "Cơ hội vàng trong sự nghiệp: nhận việc làm mới với đãi ngộ cao, thăng chức, tăng lương hoặc dự án kinh doanh mới nhận được vốn đầu tư dồi dào. Khởi đầu thịnh vượng.",
        advice: "Nắm bắt ngay cơ hội thực tế này và bắt tay vào hiện thực hóa mục tiêu. Xây dựng kế hoạch triển khai tỉ mỉ để tạo nền móng vững chắc cho tương lai.",
        keyword: "Cơ hội vàng sự nghiệp",
      },
      reversed: {
        meaning: "Bỏ lỡ cơ hội việc làm tốt, kế hoạch kinh doanh bị từ chối cấp vốn hoặc thỏa thuận hợp đồng lương bổng bị đổ bể vào phút chót. Thiếu nền tảng thực tế.",
        advice: "Xem xét lại tính khả thi của hồ sơ hoặc kế hoạch kinh doanh. Kiên nhẫn tích lũy thêm năng lực và chờ đợi thời cơ chín muồi hơn.",
        keyword: "Hụt mất thời cơ",
      },
    },
    finance: {
      upright: {
        meaning: "Dòng tiền dồi dào gõ cửa, nhận được khoản tiền thưởng lớn, quà tặng có giá trị hoặc cơ hội đầu tư sinh lời bền vững. Nền tảng tài chính bước sang trang mới rực rỡ.",
        advice: "Tận dụng khoản tiền mới này để đầu tư vào các tài sản sinh lời an toàn hoặc tích lũy lâu dài. Đặt nền móng cho sự tự do tài chính trong tương lai.",
        keyword: "Tài lộc dồi dào",
      },
      reversed: {
        meaning: "Mất tiền do đầu tư sai lầm, chi phí phát sinh bất ngờ hoặc kế hoạch nhận tiền bị chậm trễ. Thất thoát tài sản vì thiếu tính toán cẩn trọng.",
        advice: "Thắt chặt chi tiêu và ngừng ngay các khoản đầu tư mạo hiểm. Bảo vệ chặt chẽ số vốn hiện có và kiểm tra lại dòng tiền ra vào.",
        keyword: "Thất thoát dòng vốn",
      },
    },
  },

  // 65: Two of Pentacles (Hai Tiền)
  65: {
    love: {
      upright: {
        meaning: "Bạn đang khéo léo cân bằng giữa tình yêu và các áp lực khác như công việc, gia đình, tiền bạc. Mối quan hệ tràn ngập sự linh hoạt, thích ứng và những trải nghiệm thú vị cùng nhau.",
        advice: "Hãy sắp xếp thời gian hợp lý để người ấy không cảm thấy bị bỏ rơi giữa bộn bề công việc. Sự linh hoạt và nụ cười sẽ giúp cả hai vượt qua mọi thăng trầm.",
        keyword: "Cân bằng khéo léo",
      },
      reversed: {
        meaning: "Mất cân bằng cuộc sống, quá bận rộn kiếm tiền khiến tình cảm nguội lạnh, hoặc cảm giác quá tải vì phải lo toan quá nhiều thứ cùng lúc. Xung đột vì thiếu thời gian cho nhau.",
        advice: "Đặt lại thứ tự ưu tiên trong cuộc sống. Dành một khoảng thời gian cố định trong ngày cho người ấy trước khi khoảng cách vô hình trở nên quá lớn.",
        keyword: "Mất cân bằng quá tải",
      },
    },
    career: {
      upright: {
        meaning: "Quản lý nhiều dự án cùng lúc một cách linh hoạt và nhịp nhàng. Bạn đa nhiệm xuất sắc, thích ứng nhanh với những thay đổi và luôn giữ cho guồng quay công việc vận hành trơn tru.",
        advice: "Duy trì sự tập trung và linh hoạt trong điều phối công việc. Sử dụng các công cụ quản lý thời gian để kiểm soát tiến độ từng đầu việc hiệu quả.",
        keyword: "Đa nhiệm nhịp nhàng",
      },
      reversed: {
        meaning: "Ôm đồm quá nhiều việc dẫn đến \"cháy giáo án\", trễ deadline và sai sót hàng loạt. Cảm giác quay cuồng, kiệt sức và mất kiểm soát tiến độ công việc.",
        advice: "Từ chối bớt các nhiệm vụ phát sinh và tập trung hoàn thành dứt điểm từng việc một. Học cách ủy quyền công việc cho đồng đội.",
        keyword: "Quá tải deadline",
      },
    },
    finance: {
      upright: {
        meaning: "Dòng tiền luân chuyển liên tục, cân đối thu chi khéo léo và biết cách \"liệu cơm gắp mắm\". Bạn có khả năng xoay sở tiền bạc linh hoạt để giải quyết các nhu cầu thiết yếu.",
        advice: "Theo dõi sát sao dòng tiền ra vào hàng ngày. Giữ tính linh hoạt nhưng đừng quên dành ra một khoản tích lũy nhỏ phòng khi cấp bách.",
        keyword: "Luân chuyển dòng tiền",
      },
      reversed: {
        meaning: "Rối loạn dòng tiền, giật gấu vá vai, nợ nần chồng chéo do chi tiêu vượt quá thu nhập. Nguy cơ mất khả năng thanh toán các hóa đơn đến hạn.",
        advice: "Cắt giảm ngay lập tức các khoản chi tiêu không thiết yếu. Lập bảng kế hoạch chi tiêu khẩn cấp và tìm cách gia tăng nguồn thu nhập phụ.",
        keyword: "Mất cân đối thu chi",
      },
    },
  },

  // 66: Three of Pentacles (Ba Tiền)
  66: {
    love: {
      upright: {
        meaning: "Cả hai cùng nhau xây dựng mối quan hệ trên tinh thần hợp tác, tôn trọng và học hỏi lẫn nhau. Tình cảm gắn bó bền chặt khi cùng chung tay hướng tới mục tiêu xây dựng tổ ấm vững chãi.",
        advice: "Hãy xem nhau như những người đồng đội ăn ý nhất. Lắng nghe và trân trọng những đóng góp của đối phương trong việc vun đắp tình yêu.",
        keyword: "Đồng lòng xây đắp",
      },
      reversed: {
        meaning: "Thiếu sự hợp tác, đùn đẩy trách nhiệm hoặc không thể tìm thấy tiếng nói chung trong việc xây dựng tương lai. Cảm giác một người cố xây còn một người phá vỡ.",
        advice: "Cần có một cuộc trao đổi nghiêm túc về vai trò và trách nhiệm của mỗi người trong mối quan hệ. Tình yêu không thể tồn tại nếu thiếu sự hợp tác chân thành.",
        keyword: "Thiếu sự hợp tác",
      },
    },
    career: {
      upright: {
        meaning: "Làm việc nhóm xuất sắc, tinh thần hợp tác chuyên nghiệp và được các chuyên gia, cấp trên đánh giá cao về tay nghề. Cơ hội học hỏi từ những người giỏi nhất trong ngành.",
        advice: "Tận dụng sức mạnh tập thể và tích cực đóng góp chuyên môn của bạn. Sự tỉ mỉ, cầu thị và tinh thần đồng đội sẽ đưa bạn lên vị thế chuyên gia.",
        keyword: "Hợp tác chuyên nghiệp",
      },
      reversed: {
        meaning: "Bất đồng nội bộ trong nhóm làm việc, sự thiếu chuyên nghiệp, tay nghề non kém hoặc tranh cãi về phân chia công việc. Dự án bị chậm trễ do phối hợp kém.",
        advice: "Quy định rõ ràng vai trò và quy trình làm việc của từng cá nhân. Nâng cao kỹ năng giao tiếp nhóm và tôn trọng chuyên môn của đồng nghiệp.",
        keyword: "Phối hợp rời rạc",
      },
    },
    finance: {
      upright: {
        meaning: "Thu nhập tăng trưởng vững chắc nhờ vào kỹ năng chuyên môn cao và các dự án hợp tác thành công. Đầu tư vào việc nâng cấp kỹ năng nghề nghiệp mang lại lợi nhuận lớn.",
        advice: "Tiếp tục đầu tư vào việc học hỏi, nâng cao tay nghề và chứng chỉ chuyên môn. Năng lực thực sự chính là cỗ máy in tiền bền vững nhất.",
        keyword: "Sinh lời từ chuyên môn",
      },
      reversed: {
        meaning: "Thất thoát tiền bạc do thuê mướn nhân sự kém chất lượng hoặc hợp tác kinh doanh thiếu minh bạch. Công việc bị phạt tiền do không đạt tiêu chuẩn kỹ thuật.",
        advice: "Chọn lựa đối tác và nhà thầu cẩn trọng dựa trên uy tín thực tế. Kiểm tra kỹ lưỡng chất lượng sản phẩm trước khi thanh toán nghiệm thu.",
        keyword: "Thiệt hại do tay nghề kém",
      },
    },
  },

  // 67: Four of Pentacles (Bốn Tiền)
  67: {
    love: {
      upright: {
        meaning: "Tâm lý chiếm hữu, kiểm soát quá mức và sợ mất người yêu. Bạn đang giữ chặt đối phương vì nỗi bất an sâu kín, vô tình tạo ra sự ngột ngạt và kìm kẹp trong mối quan hệ.",
        advice: "Học cách mở rộng bàn tay và tin tưởng người mình yêu. Tình yêu giống như nắm cát, bạn càng siết chặt thì nó càng dễ trôi tuột qua kẽ tay.",
        keyword: "Chiếm hữu kìm kẹp",
      },
      reversed: {
        meaning: "Buông bỏ tâm lý kiểm soát, sẵn sàng mở lòng và chia sẻ cảm xúc một cách tự nhiên. Hoặc ngược lại là sự xa cách, buông xuôi do một bên cảm thấy quá ngột ngạt.",
        advice: "Tạo không gian tự do cho nhau để mối quan hệ được hít thở. Sự tin tưởng và tôn trọng ranh giới riêng là nền tảng của tình yêu bền vững.",
        keyword: "Buông bỏ kiểm soát",
      },
    },
    career: {
      upright: {
        meaning: "Bám chặt lấy vị trí an toàn, sợ thay đổi và ngại đón nhận những thử thách mới. Bạn có sự ổn định công việc nhưng lại đánh mất cơ hội bứt phá và thăng tiến lớn hơn.",
        advice: "Sự an toàn là tốt nhưng đừng để nó biến thành chiếc lồng giam hãm tiềm năng của bạn. Dám thử nghiệm những phương pháp mới để nâng tầm bản thân.",
        keyword: "Cố thủ vùng an toàn",
      },
      reversed: {
        meaning: "Mạnh dạn bước ra khỏi vùng an toàn để đón nhận cơ hội nghề nghiệp mới. Hoặc nguy cơ mất việc, mất vị trí do sự bảo thủ, cố chấp từ chối đổi mới.",
        advice: "Chủ động học hỏi các kỹ năng mới và thích ứng với xu thế thị trường. Đừng bám víu vào những hào quang cũ khi thế giới đã thay đổi.",
        keyword: "Đổi mới bứt phá",
      },
    },
    finance: {
      upright: {
        meaning: "Tích lũy tiền bạc an toàn tuyệt đối, chi tiêu cực kỳ tiết kiệm và kiểm soát chặt chẽ ngân sách. Tuy nhiên, có xu hướng bủn xỉn, keo kiệt quá mức với chính mình.",
        advice: "Duy trì thói quen tiết kiệm thông minh nhưng đừng biến mình thành kẻ bủn xỉn. Hãy dùng tiền một cách hợp lý để nâng cao chất lượng cuộc sống.",
        keyword: "Tích lũy chặt chẽ",
      },
      reversed: {
        meaning: "Mất kiểm soát chi tiêu, vung tay quá trán sau thời gian dài thắt lưng buộc bụng. Rủi ro thất thoát tài sản do quyết định đầu tư liều lĩnh không tính toán.",
        advice: "Giữ kỷ luật tài chính điều độ, tránh cực đoan từ quá ki bo sang tiêu xài hoang phí. Cẩn trọng bảo vệ tài sản trước những lời mời gọi mạo hiểm.",
        keyword: "Thất thoát tích lũy",
      },
    },
  },

  // 68: Five of Pentacles (Năm Tiền)
  68: {
    love: {
      upright: {
        meaning: "Cảm giác bị bỏ rơi, cô đơn, giá lạnh và thiếu thốn tình cảm. Cả hai cùng trải qua giai đoạn khó khăn về kinh tế hoặc cảm thấy không ai thấu hiểu nỗi khổ của mình.",
        advice: "Hãy nhớ rằng luôn có sự trợ giúp và ánh sáng ấm áp ở gần bạn (như ô cửa nhà thờ). Đừng ngại ngần mở lời chia sẻ và tìm kiếm sự nâng đỡ từ người yêu thương.",
        keyword: "Cô đơn giá lạnh",
      },
      reversed: {
        meaning: "Vượt qua giai đoạn đen tối nhất trong tình cảm, sự ấm áp và thấu hiểu quay trở lại. Bạn tìm thấy sự an ủi và tình yêu thương chân thành sau chuỗi ngày cô độc.",
        advice: "Đón nhận sự quan tâm của người khác và từng bước mở rộng lòng mình. Mùa đông lạnh giá đã qua, mùa xuân của tình yêu đang trở lại.",
        keyword: "Hơi ấm quay về",
      },
    },
    career: {
      upright: {
        meaning: "Mất việc, thất nghiệp hoặc cảm thấy bị cô lập, gạt ra ngoài lề nơi công sở. Khó khăn chồng chất trong công việc khiến bạn cảm thấy tự ti và bế tắc cùng cực.",
        advice: "Đừng tự cô lập mình trong tuyệt vọng. Chủ động tìm kiếm sự giúp đỡ từ bạn bè, người thân hoặc các tổ chức hỗ trợ việc làm để vượt qua giai đoạn này.",
        keyword: "Khủng hoảng việc làm",
      },
      reversed: {
        meaning: "Tìm được công việc mới, cơ hội việc làm xuất hiện sau thời gian dài thất nghiệp. Khủng hoảng nghề nghiệp chính thức kết thúc, sự nghiệp dần phục hồi.",
        advice: "Nắm bắt ngay cơ hội mới với lòng biết ơn và sự tận tâm. Tiếp tục nâng cao năng lực để xây dựng chỗ đứng vững chắc hơn trong tương lai.",
        keyword: "Phục hồi việc làm",
      },
    },
    finance: {
      upright: {
        meaning: "Khủng hoảng tài chính nghiêm trọng, túng thiếu, nợ nần hoặc mất nguồn thu nhập chính. Cảm giác nghèo khó và lo lắng từng bữa cơm manh áo.",
        advice: "Cắt giảm toàn bộ chi tiêu xuống mức sinh tồn cơ bản và tìm kiếm sự trợ giúp khẩn cấp. Hãy giữ vững ý chí, khó khăn này chỉ là tạm thời.",
        keyword: "Túng thiếu cùng cực",
      },
      reversed: {
        meaning: "Dần thoát khỏi khủng hoảng tài chính, tìm được nguồn thu nhập mới hoặc nhận được sự hỗ trợ tiền bạc quý giá. Nợ nần bắt đầu được trả dần.",
        advice: "Lập kế hoạch quản lý chi tiêu nghiêm ngặt để tái thiết lại quỹ khẩn cấp. Trân trọng từng đồng tiền kiếm được và không lặp lại sai lầm cũ.",
        keyword: "Thoát khỏi khủng hoảng",
      },
    },
  },

  // 69: Six of Pentacles (Sáu Tiền)
  69: {
    love: {
      upright: {
        meaning: "Sự cân bằng hoàn hảo giữa cho và nhận trong tình yêu. Cả hai đối xử với nhau bằng sự hào phóng, vị tha và luôn sẵn sàng hỗ trợ nhau cả về tinh thần lẫn vật chất.",
        advice: "Tiếp tục nuôi dưỡng mối quan hệ bằng sự sẻ chia công bằng và lòng biết ơn. Hãy trao đi tình cảm mà không toan tính vụ lợi.",
        keyword: "Cho và nhận cân bằng",
      },
      reversed: {
        meaning: "Sự bất bình đẳng sâu sắc, một người cho đi quá nhiều trong khi người kia chỉ biết nhận và đòi hỏi. Tình cảm bị chi phối bởi sự ban phát, ơn huệ hoặc thao túng tài chính.",
        advice: "Cân bằng lại cán cân quyền lực và tình cảm trong mối quan hệ. Đừng chấp nhận ở vào thế bị động chỉ biết trông chờ vào sự ban phát của đối phương.",
        keyword: "Bất bình đẳng ban phát",
      },
    },
    career: {
      upright: {
        meaning: "Được quý nhân phù trợ, nhận được sự hướng dẫn tận tình từ người đi trước hoặc được cấp trên tạo điều kiện thăng tiến, tăng lương xứng đáng. Môi trường công bằng.",
        advice: "Đón nhận sự giúp đỡ với lòng biết ơn và nỗ lực cống hiến hết mình. Khi đã vững vàng, hãy sẵn sàng chia sẻ kinh nghiệm và giúp đỡ những người mới.",
        keyword: "Quý nhân nâng đỡ",
      },
      reversed: {
        meaning: "Sự thiên vị nơi công sở, bị chèn ép hoặc lạm dụng quyền lực để đòi hỏi ơn huệ. Bạn làm nhiều nhưng nhận lại phần thưởng không tương xứng.",
        advice: "Đánh giá lại sự công bằng của môi trường làm việc hiện tại. Mạnh dạn đòi hỏi quyền lợi chính đáng hoặc tìm kiếm môi trường ghi nhận đúng thực lực.",
        keyword: "Thiên vị bất công",
      },
    },
    finance: {
      upright: {
        meaning: "Tài chính sung túc đủ để làm từ thiện, giúp đỡ người thân và chi tiêu hào phóng. Nhận được khoản vay thuận lợi, học bổng hoặc tiền thưởng xứng đáng.",
        advice: "Sử dụng tiền bạc để tạo ra phước báu và giá trị tốt đẹp cho cộng đồng. Sự hào phóng chân thành sẽ thu hút thêm nhiều tài lộc dồi dào quay trở lại.",
        keyword: "Hào phóng sẻ chia",
      },
      reversed: {
        meaning: "Bị quỵt tiền vay, mắc bẫy tín dụng đen hoặc làm từ thiện sai chỗ dẫn đến mất tiền vô ích. Chi tiêu hào phóng quá đà để thể hiện khiến bản thân rơi vào cảnh túng thiếu.",
        advice: "Cẩn trọng khi cho người khác vay mượn tiền, chỉ cho vay số tiền bạn sẵn sàng mất. Tránh xa các hình thức vay nợ có lãi suất mập mờ.",
        keyword: "Cho vay mất trắng",
      },
    },
  },

  // 70: Seven of Pentacles (Bảy Tiền)
  70: {
    love: {
      upright: {
        meaning: "Giai đoạn nhìn lại và đánh giá quá trình vun đắp tình cảm. Những nỗ lực kiên nhẫn của cả hai đang bắt đầu cho quả ngọt; cần thêm thời gian để tình yêu chín muồi và đơm hoa kết trái.",
        advice: "Kiên nhẫn chờ đợi và tiếp tục chăm sóc mối quan hệ mỗi ngày. Tình yêu đích thực cần thời gian để thử thách và trưởng thành vững bền.",
        keyword: "Kiên nhẫn chờ quả ngọt",
      },
      reversed: {
        meaning: "Cảm giác sốt ruột, nản lòng vì vun vén nhiều nhưng không thấy kết quả như mong đợi. Bạn bắt đầu tự hỏi liệu mối quan hệ này có thực sự xứng đáng để đầu tư thanh xuân hay không.",
        advice: "Đánh giá lại xem bạn đang đầu tư vào đúng người hay không. Nếu sau nhiều năm vẫn không có sự tiến triển, hãy dũng cảm cân nhắc việc dừng lại.",
        keyword: "Sốt ruột nản lòng",
      },
    },
    career: {
      upright: {
        meaning: "Nhìn nhận lại thành quả lao động sau thời gian dài nỗ lực cày cuốc. Dự án sắp đến ngày thu hoạch, công sức bỏ ra chuẩn bị được đền đáp xứng đáng.",
        advice: "Tiếp tục kiên trì hoàn thành những công đoạn cuối cùng. Đừng nóng vội gặt lúa non; sự chuẩn bị kỹ lưỡng sẽ mang lại mùa màng bội thu.",
        keyword: "Đánh giá thành quả",
      },
      reversed: {
        meaning: "Nỗ lực đổ sông đổ biển, làm việc cật lực nhưng kết quả thu về không đáng là bao do chọn sai hướng đi. Sự chậm trễ tiến độ gây chán nản tột cùng.",
        advice: "Dừng lại để đánh giá lại chiến lược làm việc thay vì tiếp tục cắm đầu làm theo lối mòn. Cắt bỏ các khâu không hiệu quả để tối ưu hóa năng suất.",
        keyword: "Công cốc sai hướng",
      },
    },
    finance: {
      upright: {
        meaning: "Các khoản đầu tư trung và dài hạn đang tăng trưởng ổn định theo đúng kế hoạch. Thời điểm tốt để tái cơ cấu danh mục tài sản và chuẩn bị thu hoạch lợi nhuận.",
        advice: "Duy trì chiến lược đầu tư dài hạn và không nên nóng vội chốt lời quá sớm. Sự kiên nhẫn là chìa khóa của sự tích lũy của cải bền vững.",
        keyword: "Tăng trưởng dài hạn",
      },
      reversed: {
        meaning: "Thua lỗ do đầu tư thiếu kiên nhẫn, chốt non hoặc rót vốn vào các dự án không sinh lời. Cảm giác thất vọng vì tiền bạc bị chôn vốn quá lâu mà không có lãi.",
        advice: "Rà soát lại danh mục đầu tư và xem xét cơ cấu lại dòng vốn. Tránh sốt ruột rút vốn bừa bãi khi thị trường đang trong chu kỳ tích lũy.",
        keyword: "Chôn vốn thất vọng",
      },
    },
  },

  // 71: Eight of Pentacles (Tám Tiền)
  71: {
    love: {
      upright: {
        meaning: "Cả hai cùng nỗ lực không ngừng nghỉ để hoàn thiện bản thân và chăm chút cho từng chi tiết nhỏ trong mối quan hệ. Tình yêu bền chặt được xây dựng từ sự tận tâm và kiên trì mỗi ngày.",
        advice: "Hãy tiếp tục vun đắp tình yêu bằng những hành động quan tâm nhỏ bé nhưng đều đặn. Sự chăm chỉ và cam kết chân thành là nền tảng của hạnh phúc dài lâu.",
        keyword: "Cần cù vun đắp",
      },
      reversed: {
        meaning: "Thiếu sự nỗ lực, lười biếng trong việc hâm nóng tình cảm hoặc ngược lại là cắm đầu vào công việc quá mức khiến người yêu cảm thấy bị bỏ bê, lẻ loi.",
        advice: "Cân bằng giữa công việc và tình cảm. Đừng coi sự hiện diện của đối phương là điều hiển nhiên mà quên mất việc chăm sóc tình yêu mỗi ngày.",
        keyword: "Bỏ bê vun vén",
      },
    },
    career: {
      upright: {
        meaning: "Chuyên tâm rèn luyện tay nghề, nâng cao trình độ chuyên môn và hoàn thành công việc với sự tỉ mỉ, chuẩn xác tuyệt đối. Bạn đang trên đường trở thành bậc thầy trong lĩnh vực của mình.",
        advice: "Tập trung cao độ vào việc mài giũa kỹ năng và chú trọng đến từng chi tiết nhỏ. Sự tận tụy và tâm huyết với nghề sẽ mang lại danh tiếng và thành công rực rỡ.",
        keyword: "Mài giũa tay nghề",
      },
      reversed: {
        meaning: "Làm việc cẩu thả, đốt cháy giai đoạn hoặc chán nản vì công việc lặp đi lặp lại nhàm chán. Thiếu tính kỷ luật dẫn đến sản phẩm kém chất lượng.",
        advice: "Lấy lại sự tập trung và tỉ mỉ trong từng khâu công việc. Tìm kiếm niềm vui sáng tạo ngay trong những công việc thường nhật để duy trì động lực.",
        keyword: "Cẩu thả chán chường",
      },
    },
    finance: {
      upright: {
        meaning: "Thu nhập tăng trưởng đều đặn và bền vững từ chính sức lao động, tay nghề chuyên môn của bạn. Bạn kiếm tiền bằng mồ hôi nước mắt và quản lý tiền bạc cực kỳ chặt chẽ.",
        advice: "Tiếp tục tích lũy kiên trì từ những khoản thu nhập chính đáng. Đầu tư vào việc nâng cấp công cụ làm việc hoặc khóa học chuyên sâu để gia tăng giá trị bản thân.",
        keyword: "Thu nhập chăm chỉ",
      },
      reversed: {
        meaning: "Thu nhập bấp bênh do làm ăn thiếu chuyên nghiệp hoặc mất tiền vì các khóa học nghề lừa đảo. Chi tiêu lãng phí vào những công cụ không dùng tới.",
        advice: "Tập trung nâng cao năng lực thực tế thay vì tìm kiếm các mẹo kiếm tiền nhanh. Quản lý chi tiêu có kỷ luật và kiên nhẫn tích lũy lại từ đầu.",
        keyword: "Bấp bênh tay nghề",
      },
    },
  },

  // 72: Nine of Pentacles (Chín Tiền)
  72: {
    love: {
      upright: {
        meaning: "Độc lập, tự chủ và quyến rũ tuyệt đối! Bạn hạnh phúc trọn vẹn với chính mình, không cần phụ thuộc vào bất kỳ ai để cảm thấy có giá trị. Tình yêu đến với bạn như một sự cộng hưởng ngọt ngào.",
        advice: "Tận hưởng sự tự do và giá trị riêng biệt của bản thân. Khi bạn tự tin và đầy đủ từ bên trong, bạn sẽ thu hút một người bạn đời xứng tầm và tôn trọng bạn.",
        keyword: "Tự chủ quyến rũ",
      },
      reversed: {
        meaning: "Cảm giác cô đơn đằng sau vẻ ngoài giàu sang, hào nhoáng. Hoặc phụ thuộc quá mức vào tài chính của đối phương dẫn đến việc mất đi tiếng nói và tự do cá nhân.",
        advice: "Học cách độc lập tài chính để giữ lấy phẩm giá và tự do cho bản thân. Đừng đánh đổi hạnh phúc đích thực chỉ để lấy sự chu cấp vật chất.",
        keyword: "Cô đơn hào nhoáng",
      },
    },
    career: {
      upright: {
        meaning: "Đạt được đỉnh cao sự nghiệp, làm chủ công việc hoặc kinh doanh độc lập thành công rực rỡ. Bạn được hưởng thụ thành quả xứng đáng sau chuỗi ngày nỗ lực bền bỉ.",
        advice: "Tự hào về những gì bạn đã tự tay xây dựng nên. Tận hưởng vị thế chuyên gia và tiếp tục duy trì tiêu chuẩn làm việc đỉnh cao của mình.",
        keyword: "Độc lập đỉnh cao",
      },
      reversed: {
        meaning: "Khoe khoang thành tích ảo, ngủ quên trên danh vọng hoặc đối mặt với sự sụp đổ hình ảnh chuyên nghiệp do thiếu năng lực thực chất. Áp lực giữ vỏ bọc thành đạt.",
        advice: "Tập trung vào giá trị thực tế thay vì mải mê xây dựng hình ảnh hào nhoáng bên ngoài. Luôn duy trì sự khiêm tốn và trau dồi chuyên môn liên tục.",
        keyword: "Vỏ bọc hào nhoáng",
      },
    },
    finance: {
      upright: {
        meaning: "Tự do tài chính đích thực, của cải sung túc và cuộc sống đủ đầy, sang trọng. Bạn có quyền tự thưởng cho mình những tiện nghi cao cấp nhất mà không cần lo lắng về tiền bạc.",
        advice: "Tận hưởng cuộc sống thịnh vượng nhưng luôn giữ vững kế hoạch quản lý tài sản thông minh. Đầu tư vào sức khỏe, không gian sống và những trải nghiệm tinh tế.",
        keyword: "Tự do tài chính",
      },
      reversed: {
        meaning: "Chi tiêu xa hoa vượt quá khả năng thực tế để khoe mẽ trên mạng xã hội, dẫn đến khủng hoảng nợ nần ngầm. Rủi ro mất mát tài sản do quá tự tin và chủ quan.",
        advice: "Dừng ngay việc sống ảo và chi tiêu để làm vừa lòng người khác. Rà soát lại các khoản nợ thẻ tín dụng và trở về với lối sống thực tế, bền vững.",
        keyword: "Nợ nần sống ảo",
      },
    },
  },

  // 73: Ten of Pentacles (Mười Tiền)
  73: {
    love: {
      upright: {
        meaning: "Hôn nhân viên mãn, gia tộc hòa thuận và nền tảng gia đình vững chắc qua nhiều thế hệ. Tình cảm gắn liền với sự cam kết lâu dài, mua nhà, sinh con và tạo dựng cơ đồ chung.",
        advice: "Cùng nhau xây dựng nền móng gia đình vững bền và tôn trọng các giá trị truyền thống tốt đẹp. Sự gắn kết gia đình là chỗ dựa bình yên nhất của cuộc đời.",
        keyword: "Gia tộc vững bền",
      },
      reversed: {
        meaning: "Tranh chấp tài sản gia đình, mâu thuẫn sâu sắc giữa hai bên nội ngoại hoặc áp lực từ truyền thống gia đình đè nặng lên tình cảm đôi lứa. Nguy cơ đổ vỡ hôn nhân vì tiền.",
        advice: "Bảo vệ tình yêu của hai bạn trước những can thiệp tiêu cực từ người ngoài. Minh bạch và rạch ròi về tài chính gia đình để tránh tranh cãi không đáng có.",
        keyword: "Tranh chấp gia tài",
      },
    },
    career: {
      upright: {
        meaning: "Xây dựng đế chế kinh doanh lâu dài, đạt vị trí lãnh đạo tối cao trong doanh nghiệp lớn hoặc tiếp quản cơ nghiệp gia đình thành công. Sự nghiệp vững như bàn thạch.",
        advice: "Tư duy dài hạn cho nhiều thế hệ và xây dựng hệ thống quy chuẩn bền vững. Để lại di sản nghề nghiệp giá trị cho những thế hệ kế tiếp.",
        keyword: "Đế chế vững bền",
      },
      reversed: {
        meaning: "Khủng hoảng trong doanh nghiệp gia đình, tranh giành quyền lực nội bộ hoặc sự sụp đổ của một công ty lâu đời do quản trị bảo thủ, lạc hậu.",
        advice: "Cải tổ lại bộ máy quản trị và loại bỏ các tư duy gia đình trị kém hiệu quả. Đưa tính chuyên nghiệp và minh bạch vào quy trình điều hành.",
        keyword: "Khủng hoảng cơ nghiệp",
      },
    },
    finance: {
      upright: {
        meaning: "Sự giàu có tột bậc, thịnh vượng truyền đời, nhận tài sản thừa kế khổng lồ hoặc tích lũy bất động sản vững chắc. Đạt được sự an toàn tài chính tuyệt đối cho cả dòng họ.",
        advice: "Lập kế hoạch quản lý tài sản gia đình và lập di chúc, quỹ tín thác rõ ràng. Sử dụng sự giàu có để làm việc thiện và nâng đỡ cộng đồng.",
        keyword: "Thịnh vượng truyền đời",
      },
      reversed: {
        meaning: "Tranh chấp quyền thừa kế gay gắt, thua lỗ tài sản lớn của gia đình hoặc nguy cơ vỡ nợ dây chuyền trong các doanh nghiệp gia đình.",
        advice: "Nhờ đến sự can thiệp của pháp luật để giải quyết rõ ràng các tranh chấp tài sản. Tuyệt đối không để lòng tham phá hủy tình thân ruột thịt.",
        keyword: "Kiện tụng thừa kế",
      },
    },
  },

  // 74: Page of Pentacles (Tiểu Đồng Tiền)
  74: {
    love: {
      upright: {
        meaning: "Một tình cảm chân thành, nghiêm túc và thực tế ngay từ những bước đầu tiên. Đối phương là người đáng tin cậy, muốn xây dựng mối quan hệ có cam kết và tương lai rõ ràng.",
        advice: "Hãy trân trọng sự chân thành và giản dị của người ấy. Từng bước vun đắp mối quan hệ dựa trên những hành động thiết thực và sự tin cậy lẫn nhau.",
        keyword: "Chân thành thực tế",
      },
      reversed: {
        meaning: "Thiếu cam kết, lười biếng hoặc đặt nặng vấn đề vật chất lên trên tình cảm. Kế hoạch hẹn hò bị trì hoãn liên tục do sự thiếu quyết đoán và thiếu chuẩn bị.",
        advice: "Đừng để sự thực dụng làm xói mòn cảm xúc chân thật. Hãy tự hỏi bản thân xem bạn có thực sự muốn cam kết nghiêm túc với người này hay không.",
        keyword: "Thực dụng trì hoãn",
      },
    },
    career: {
      upright: {
        meaning: "Bắt đầu một khóa học nghề mới, nhận công việc tập sự đầy triển vọng hoặc tìm thấy đam mê trong một lĩnh vực chuyên môn thực tế. Tinh thần ham học hỏi và chăm chỉ.",
        advice: "Hãy là một học viên chăm chỉ và kiên nhẫn tích lũy kiến thức nền tảng. Đặt ra những mục tiêu nhỏ và kiên trì hoàn thành từng bước một.",
        keyword: "Khởi đầu học nghề",
      },
      reversed: {
        meaning: "Thiếu tập trung, lười biếng, chểnh mảng trong học tập hoặc thi cử không đạt kết quả tốt. Khó khăn trong việc áp dụng lý thuyết vào thực tế công việc.",
        advice: "Rèn luyện lại tính kỷ luật cá nhân và tập trung vào việc học hành nghiêm túc. Đừng để sự lười biếng làm lãng phí cơ hội phát triển nghề nghiệp.",
        keyword: "Chểnh mảng lười biếng",
      },
    },
    finance: {
      upright: {
        meaning: "Nhận được tin tức tài chính tốt lành, cơ hội kiếm thêm thu nhập từ công việc bán thời gian hoặc bắt đầu học cách tiết kiệm tiền có kế hoạch.",
        advice: "Bắt đầu tích lũy từ những khoản tiền nhỏ nhất và học hỏi kiến thức quản lý tài chính cá nhân. Mỗi đồng tiền tiết kiệm hôm nay là hạt mầm cho tương lai.",
        keyword: "Mầm ươm tài lộc",
      },
      reversed: {
        meaning: "Chi tiêu tiền bạc thiếu suy nghĩ cho những món đồ không cần thiết, hoặc làm mất tiền vì sự bất cẩn, đoảng vị. Kế hoạch tài chính bị vỡ vụn.",
        advice: "Quản lý chặt chẽ chi tiêu hàng ngày và ghi chép sổ sách rõ ràng. Học cách quý trọng giá trị của đồng tiền và tránh tiêu xài bồng bột.",
        keyword: "Bất cẩn hao tiền",
      },
    },
  },

  // 75: Knight of Pentacles (Hiệp Sĩ Tiền)
  75: {
    love: {
      upright: {
        meaning: "Một người bạn đời chung thủy, đáng tin cậy tuyệt đối, kiên định và luôn chu đáo chăm lo cho bạn. Mối quan hệ tiến triển chậm rãi nhưng cực kỳ vững chắc và bền lâu.",
        advice: "Trân trọng sự kiên định và lòng chung thủy của người ấy, dù đôi khi có chút khô khan. Hãy cùng nhau xây đắp tình yêu bằng sự bền bỉ qua năm tháng.",
        keyword: "Chung thủy kiên định",
      },
      reversed: {
        meaning: "Sự khô khan, nhàm chán đến mức tẻ nhạt trong mối quan hệ, hoặc tính cách cứng đầu, bảo thủ từ chối mọi sự lãng mạn. Cuộc sống tình cảm trở nên đơn điệu như một cỗ máy.",
        advice: "Thổi thêm chút lãng mạn và gia vị bất ngờ vào mối quan hệ. Đừng để sự ổn định biến thành sự nhàm chán giết chết cảm xúc yêu đương.",
        keyword: "Khô khan nhàm chán",
      },
    },
    career: {
      upright: {
        meaning: "Làm việc chăm chỉ, cần mẫn, có phương pháp và độ tin cậy tuyệt đối. Bạn hoàn thành mọi nhiệm vụ được giao một cách hoàn hảo, không ngại việc khó và luôn đúng hạn.",
        advice: "Tiếp tục duy trì tính kỷ luật sắt đá và sự tận tụy trong công việc. Uy tín và sự chắc chắn của bạn chính là tấm vé bảo đảm cho sự thăng tiến vững chắc.",
        keyword: "Cần mẫn tin cậy",
      },
      reversed: {
        meaning: "Làm việc theo lối mòn cứng nhắc, năng suất kém do quá cầu toàn hoặc lười biếng, trì hoãn công việc. Khó khăn trong việc thích ứng với các thay đổi mới.",
        advice: "Linh hoạt hơn trong cách giải quyết vấn đề và học cách tối ưu hóa quy trình. Đừng để sự cầu toàn quá mức làm chậm tiến độ chung của dự án.",
        keyword: "Trì trệ cứng nhắc",
      },
    },
    finance: {
      upright: {
        meaning: "Tài chính tích lũy vững chắc theo thời gian nhờ vào sự tiết kiệm có kỷ luật và các khoản đầu tư an toàn, ít rủi ro. Khả năng quản lý tiền bạc cực kỳ chặt chẽ.",
        advice: "Kiên trì theo đuổi chiến lược tích lũy và đầu tư dài hạn đã đề ra. Tránh xa các cám dỗ làm giàu nhanh để bảo vệ an toàn cho số vốn quý giá.",
        keyword: "Tích lũy bền bỉ",
      },
      reversed: {
        meaning: "Tài chính trì trệ, không có sự tăng trưởng hoặc thua lỗ do đầu tư vào các kênh quá bảo thủ không bù nổi lạm phát. Thói quen bủn xỉn làm hạn chế cơ hội kiếm tiền.",
        advice: "Xem xét lại danh mục đầu tư để tìm kiếm các kênh có tỷ suất sinh lời tốt hơn mà vẫn an toàn. Đừng quá sợ hãi rủi ro đến mức đóng băng mọi dòng vốn.",
        keyword: "Trì trệ dòng vốn",
      },
    },
  },

  // 76: Queen of Pentacles (Hoàng Hậu Tiền)
  76: {
    love: {
      upright: {
        meaning: "Người phụ nữ đảm đang, ấm áp, thực tế và biết cách chăm lo chu toàn cho tổ ấm. Tình yêu ngập tràn sự che chở, dinh dưỡng tốt, sự tiện nghi và bình yên trong tâm hồn.",
        advice: "Hãy chăm sóc đối phương bằng sự chu đáo và những cử chỉ yêu thương thực tế. Xây dựng một không gian sống ấm cúng và đầy ắp tiếng cười.",
        keyword: "Chu toàn đảm đang",
      },
      reversed: {
        meaning: "Quá lo lắng về vật chất, bỏ bê bản thân hoặc trở nên kiểm soát, xét nét chuyện chi tiêu trong gia đình. Cảm giác kiệt sức vì phải gánh vác mọi việc nhà cửa.",
        advice: "Dành thời gian chăm sóc và yêu thương bản thân nhiều hơn. Chia sẻ việc nhà và trách nhiệm tài chính với người bạn đời thay vì ôm đồm một mình.",
        keyword: "Bỏ bê kiệt sức",
      },
    },
    career: {
      upright: {
        meaning: "Khả năng quản lý nguồn lực tài tình, sự tháo vát và tài kinh doanh thực tiễn xuất sắc. Bạn tạo ra môi trường làm việc hiệu quả, ấm cúng và nuôi dưỡng nhân tài phát triển.",
        advice: "Phát huy sự khéo léo trong điều phối công việc và chăm sóc đời sống nhân viên. Sự thực tế và chu đáo sẽ giúp doanh nghiệp phát triển bền vững.",
        keyword: "Quản trị tháo vát",
      },
      reversed: {
        meaning: "Quản lý tài chính doanh nghiệp lỏng lẻo hoặc ngược lại là quá chi li bóp nghẹt sự sáng tạo của nhân viên. Mất cân bằng giữa công việc và đời sống cá nhân.",
        advice: "Thiết lập lại quy trình quản lý ngân sách minh bạch và hợp lý. Tạo điều kiện để nhân viên phát huy sáng kiến thay vì kiểm soát quá chi tiết.",
        keyword: "Kiểm soát chi li",
      },
    },
    finance: {
      upright: {
        meaning: "Sự trù phú tài chính, khả năng sinh lời từ nhiều nguồn và quản lý chi tiêu gia đình tuyệt vời. Vừa biết kiếm tiền giỏi vừa biết tận hưởng cuộc sống tiện nghi.",
        advice: "Đầu tư vào bất động sản, chăm sóc sức khỏe và nâng cấp chất lượng sống cho gia đình. Bạn hoàn toàn có đủ năng lực làm chủ sự giàu có này.",
        keyword: "Trù phú sung túc",
      },
      reversed: {
        meaning: "Chi tiêu mất kiểm soát vào việc mua sắm đồ gia dụng xa xỉ hoặc thất thoát tài chính do quản lý sổ sách lỏng lẻo. Lo âu quá mức về tương lai tiền bạc.",
        advice: "Rà soát lại toàn bộ các hóa đơn và ngân sách gia đình. Cân bằng giữa việc tiết kiệm và chi tiêu hợp lý để giải tỏa nỗi lo âu tiền bạc.",
        keyword: "Hao hụt ngân sách",
      },
    },
  },

  // 77: King of Pentacles (Vua Tiền)
  77: {
    love: {
      upright: {
        meaning: "Người bạn đời lý tưởng với sự thành đạt, vững chãi, chung thủy và có khả năng che chở tuyệt vời về mặt kinh tế. Tình yêu bền vững dựa trên sự an toàn và sung túc trọn vẹn.",
        advice: "Hãy là chỗ dựa vững chắc cho gia đình và thể hiện tình yêu bằng sự chở che, hào phóng và có trách nhiệm. Cùng nhau tận hưởng thành quả cuộc sống viên mãn.",
        keyword: "Vững chãi che chở",
      },
      reversed: {
        meaning: "Sự thực dụng, coi trọng đồng tiền hơn tình cảm hoặc dùng tiền bạc để kiểm soát, áp đặt người khác. Tính cách bảo thủ, gia trưởng và khô khan làm mối quan hệ ngột ngạt.",
        advice: "Nhận ra rằng tiền bạc không thể mua được tình yêu chân thật. Hãy mở lòng và lắng nghe cảm xúc của đối phương thay vì chỉ mang tiền về nhà.",
        keyword: "Thực dụng áp đặt",
      },
    },
    career: {
      upright: {
        meaning: "Đỉnh cao của sự nghiệp kinh doanh, năng lực điều hành xuất chúng và sự thành công tài chính vượt bậc. Bạn là nhà lãnh đạo uy tín, đưa doanh nghiệp phát triển thịnh vượng.",
        advice: "Tận dụng kinh nghiệm và bản lĩnh thương trường để mở rộng các dự án lớn. Hãy lãnh đạo bằng sự kiên định, thực tiễn và tính kỷ luật cao.",
        keyword: "Đế vương thương trường",
      },
      reversed: {
        meaning: "Lòng tham vô đáy, đầu cơ trục lợi bất chính hoặc quản lý độc đoán dẫn đến thất bại kinh doanh lớn. Phá sản do đưa ra những quyết định làm ăn mờ ám.",
        advice: "Đặt đạo đức kinh doanh lên hàng đầu và tuân thủ pháp luật nghiêm ngặt. Tránh xa các thương vụ kiếm tiền bất chính kẻo hủy hoại toàn bộ sự nghiệp.",
        keyword: "Tham lam trục lợi",
      },
    },
    finance: {
      upright: {
        meaning: "Sở hữu khối tài sản khổng lồ, dòng tiền sinh lời dồi dào từ bất động sản, kinh doanh và đầu tư chiến lược. Sự giàu có bền vững ở mức độ cao nhất.",
        advice: "Bảo vệ và phát triển khối tài sản thông qua các chiến lược đầu tư giá trị dài hạn. Sử dụng sự thịnh vượng để tạo công ăn việc làm và cống hiến cho xã hội.",
        keyword: "Thịnh vượng đỉnh cao",
      },
      reversed: {
        meaning: "Thất thoát tài sản nghiêm trọng do đánh bạc, đầu cơ liều lĩnh hoặc bị đối tác lừa đảo trong các thương vụ lớn. Khủng hoảng tài chính do lòng tham.",
        advice: "Cắt lỗ ngay lập tức và dừng các hành vi đầu cơ rủi ro cao. Tham khảo ý kiến các chuyên gia tài chính độc lập để tái cấu trúc lại tài sản.",
        keyword: "Thất thoát cơ nghiệp",
      },
    },
  },

};
