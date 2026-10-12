import { GoogleGenAI, Type } from '@google/genai';
import type { ReadingSuccessResponse } from './api-types';
import { buildCouplePrompts, buildTarotPrompts, PERSONA_PROFILES } from './prompts';
import { getCardTopicInterpretation } from '@/data/topic-interpretations';
import {
  classifyAgeTier,
  COUPLE_SPREAD_POSITIONS,
  getSpreadPositionsForTopic,
  RELATIONSHIP_STATUS_LABELS,
  scanCrisisAndInjection,
} from './safety';
import {
  AgeTier,
  CardAnalysis,
  CliffhangerUpsell,
  countWords,
  CoupleRelationshipStatus,
  DrawnCardWithMeta,
  EffectivePersona,
  ReaderId,
  ReadingMetrics,
  ReadingOutput,
  ReadingOutputSchema,
  SafetyFlag,
  TarotCardMetadata,
  TopicId,
} from './schemas';

/**
 * Self-contained 22 Major Arcana fallback knowledge base (0..21)
 * Avoids any circular dependency on `src/data/tarot-cards.ts` while providing rich persona hooks
 * if the caller passes minimal card objects.
 */
const BUILTIN_MAJOR_ARCANA_META: Record<number, TarotCardMetadata> = {
  0: {
    id: 0,
    name_en: 'The Fool',
    name_vi: 'Kẻ Khờ Đón Gió',
    keywords_up: ['Khởi đầu mới', 'Vô tư', 'Liều lĩnh', 'Tin tưởng vũ trụ'],
    keywords_rev: ['Bốc đồng', 'Ngây thơ quá mức', 'Sợ bước tiếp', 'Thiếu suy nghĩ'],
    savage_hook_up: 'Nhảy hố tình yêu với tâm thế trang giấy trắng, thấy cờ đỏ vẫn tưởng cờ lễ hội!',
    savage_hook_rev: 'Biết rõ hố sâu vẫn cố nhảy vào rồi hỏi sao vũ trụ không đỡ kịp!',
    healing_hook_up: 'Hãy cho phép trái tim mình bắt đầu lại với sự trong trẻo và niềm tin thuần khiết.',
    healing_hook_rev: 'Chậm lại một nhịp để lắng nghe trực giác trước khi trao đi niềm tin.',
  },
  1: {
    id: 1,
    name_en: 'The Magician',
    name_vi: 'Nhà Ảo Thuật',
    keywords_up: ['Chủ động', 'Thu hút', 'Đủ nguồn lực', 'Biến ý tưởng thành thật'],
    keywords_rev: ['Thao túng tâm lý', 'Nói lời hoa mỹ', 'Lãng phí tiềm năng', 'Ảo tưởng'],
    savage_hook_up: 'Vũ khí trong tay đầy đủ mà cứ ngồi chờ người ta bật đèn xanh trước!',
    savage_hook_rev: 'Cẩn thận mấy chiếc văn mẫu ngọt xớt nhưng hành động thì bằng không nha con!',
    healing_hook_up: 'Bạn đã có sẵn mọi mảnh ghép cần thiết bên trong mình để tạo nên điều kỳ diệu.',
    healing_hook_rev: 'Đừng để những lời hứa hẹn mơ hồ làm lu mờ giá trị thật sự của bạn.',
  },
  2: {
    id: 2,
    name_en: 'The High Priestess',
    name_vi: 'Nữ Tư Tế Tối Cao',
    keywords_up: ['Trực giác nhạy bén', 'Bí ẩn', 'Lắng nghe nội tâm', 'Giữ khoảng lặng'],
    keywords_rev: ['Phớt lờ linh cảm', 'Bí mật che giấu', 'Overthinking', 'Sống bề nổi'],
    savage_hook_up: 'Giác quan thứ sáu của con chuẩn hơn cả thám tử rồi, đừng giả vờ mù quáng nữa!',
    savage_hook_rev: 'Trực giác gào thét báo động đỏ mà cái đầu cứ cố tìm lý do bao biện giùm người ta!',
    healing_hook_up: 'Trong sự tĩnh lặng sâu thẳm, câu trả lời bạn tìm kiếm vốn đã hiện diện.',
    healing_hook_rev: 'Hãy dịu dàng lắng nghe tiếng thì thầm bên trong thay vì chạy theo tiếng ồn bên ngoài.',
  },
  3: {
    id: 3,
    name_en: 'The Empress',
    name_vi: 'Nữ Hoàng Trù Phú',
    keywords_up: ['Yêu bản thân', 'Quyến rũ tự nhiên', 'Đủ đầy', 'Nuôi dưỡng cảm xúc'],
    keywords_rev: ['Cho đi quá mức', 'Bỏ bê bản thân', 'Phụ thuộc cảm xúc', 'Kiệt sức'],
    savage_hook_up: 'Năng lượng Nữ Hoàng ngời ngời thế này, việc gì phải hạ giá trị đi xin từng tin nhắn!',
    savage_hook_rev: 'Làm bảo mẫu tình cảm cho người ta chưa đủ mệt hả con, quay về chăm lại mình đi!',
    healing_hook_up: 'Khi bạn tưới tắm khu vườn tâm hồn mình bằng tình yêu thương, mọi điều tốt đẹp sẽ tự tìm đến.',
    healing_hook_rev: 'Đã đến lúc thu hồi năng lượng về ôm ấp chính mình sau những ngày lo nghĩ cho người khác.',
  },
  4: {
    id: 4,
    name_en: 'The Emperor',
    name_vi: 'Hoàng Đế Bản Lĩnh',
    keywords_up: ['Kỷ luật', 'Vững chãi', 'Ranh giới rõ ràng', 'Lý trí dẫn đường'],
    keywords_rev: ['Kiểm soát quá mức', 'Cứng nhắc', 'Gia trưởng', 'Thiếu kỷ luật'],
    savage_hook_up: 'Bật chế độ lý trí sắt đá lên, cái gì không rõ ràng thì dẹp gọn trong một nốt nhạc!',
    savage_hook_rev: 'Đừng cố kiểm soát người không thuộc về mình, cũng đừng để ai đặt luật lên cảm xúc của con!',
    healing_hook_up: 'Những ranh giới lành mạnh chính là bức tường thành bảo vệ sự bình yên của bạn.',
    healing_hook_rev: 'Buông bớt gánh nặng phải gồng mình mạnh mẽ, bạn được phép mềm mại khi mỏi mệt.',
  },
  5: {
    id: 5,
    name_en: 'The Hierophant',
    name_vi: 'Giáo Hoàng Truyền Thống',
    keywords_up: ['Cam kết nghiêm túc', 'Giá trị bền vững', 'Người dẫn đường', 'Chính danh'],
    keywords_rev: ['Phá vỡ khuôn mẫu', 'Sợ ràng buộc', 'Mối quan hệ không tên', 'Lệch hệ tư tưởng'],
    savage_hook_up: 'Năng lượng này đòi hỏi danh phận đàng hoàng chứ không chơi hệ mập mờ qua ngày!',
    savage_hook_rev: 'Người ta thích tự do không ràng buộc mà con cứ đòi viết sớ cưới hỏi là lệch sóng rồi!',
    healing_hook_up: 'Sự chân thành và những giá trị đồng điệu sẽ dẫn lối bạn đến kết nối vững bền.',
    healing_hook_rev: 'Hãy can đảm bước ra khỏi những khuôn mẫu cũ kỹ không còn mang lại hạnh phúc cho bạn.',
  },
  6: {
    id: 6,
    name_en: 'The Lovers',
    name_vi: 'Đôi Tình Nhân',
    keywords_up: ['Đồng điệu sâu sắc', 'Lựa chọn từ trái tim', 'Hấp dẫn mạnh mẽ', 'Hòa hợp'],
    keywords_rev: ['Đứng giữa ngã ba đường', 'Thiếu quyết đoán', 'Lệch pha tình cảm', 'Trốn tránh trách nhiệm'],
    savage_hook_up: 'Tần số bắt sóng cực mạnh, nhưng nhớ chọn bằng cả trái tim lẫn cái đầu tỉnh táo!',
    savage_hook_rev: 'Ngã ba đường tình cảm đứng lâu mỏi chân lắm con ơi, chốt một hướng thôi!',
    healing_hook_up: 'Sự kết nối chân thật luôn bắt đầu từ việc bạn hòa hợp và thành thật với chính trái tim mình.',
    healing_hook_rev: 'Mỗi sự lựa chọn buông hay giữ đều là bài học quý giá giúp bạn hiểu rõ điều mình thật sự trân trọng.',
  },
  7: {
    id: 7,
    name_en: 'The Chariot',
    name_vi: 'Cỗ Xe Chiến Thắng',
    keywords_up: ['Bứt phá mạnh mẽ', 'Quyết tâm cao độ', 'Làm chủ tốc độ', 'Tiến về phía trước'],
    keywords_rev: ['Mất phương hướng', 'Nóng vội', 'Trì trệ', 'Cố đấm ăn xôi'],
    savage_hook_up: 'Lên xe phóng thẳng về phía mục tiêu đi con, đừng ngoái đầu nhìn đống đổ nát phía sau!',
    savage_hook_rev: 'Phanh gấp lại giùm Bà! Đang mất lái cảm xúc mà cứ đạp ga nhắn tin lúc nửa đêm là toang!',
    healing_hook_up: 'Khi ý chí và trái tim cùng nhìn về một hướng, không thử thách nào có thể cản bước chân bạn.',
    healing_hook_rev: 'Nếu thấy lòng đang chao đảo, hãy dừng lại nghỉ ngơi thay vì ép bản thân phải chạy tiếp ngay lúc này.',
  },
  8: {
    id: 8,
    name_en: 'Strength',
    name_vi: 'Sức Mạnh Nội Tâm',
    keywords_up: ['Bản lĩnh dịu dàng', 'Kiên nhẫn', 'Làm chủ cảm xúc', 'Bao dung'],
    keywords_rev: ['Nghi ngờ bản thân', 'Yếu lòng lúc nửa đêm', 'Cạn kiệt năng lượng', 'Giận quá mất khôn'],
    savage_hook_up: 'Đỉnh cao của bản lĩnh là nhìn thấy tin nhắn người cũ mà tâm vẫn bất biến giữa dòng đời!',
    savage_hook_rev: 'Ban ngày mạnh miệng kêu quên rồi, 1 giờ sáng lại mở nhạc suy khóc hết nước mắt là sao con?',
    healing_hook_up: 'Sức mạnh lớn lao nhất nằm ở sự dịu dàng và kiên nhẫn mà bạn dành cho chính mình.',
    healing_hook_rev: 'Đừng trách bản thân vì những phút giây yếu lòng; mọi cảm xúc đều xứng đáng được lắng nghe.',
  },
  9: {
    id: 9,
    name_en: 'The Hermit',
    name_vi: 'Ẩn Sĩ Soi Đèn',
    keywords_up: ['Chiêm nghiệm', 'Tĩnh tâm một mình', 'Tự soi chiếu', 'Thông thái'],
    keywords_rev: ['Cô lập bản thân', 'Trốn tránh thực tại', 'Sợ cô đơn', 'Đóng cửa trái tim'],
    savage_hook_up: 'Tắt thông báo, bật chế độ ẩn cư tu luyện bản thân một thời gian đi, câu trả lời tự khắc sáng!',
    savage_hook_rev: 'Vì sợ cô đơn buổi tối mà vơ đại một mối quan hệ độc hại thì còn khổ gấp mười nha con!',
    healing_hook_up: 'Khoảng lặng một mình không phải là cô đơn, mà là lúc ánh đèn nội tâm tỏa sáng rõ ràng nhất.',
    healing_hook_rev: 'Hãy bước ra đón nhận ánh nắng và chia sẻ nỗi lòng cùng những người thương yêu bạn.',
  },
  10: {
    id: 10,
    name_en: 'Wheel of Fortune',
    name_vi: 'Bánh Xe Số Phận',
    keywords_up: ['Bước ngoặt bất ngờ', 'Vận may xoay chuyển', 'Đúng người đúng thời điểm', 'Nhân quả'],
    keywords_rev: ['Trì hoãn tạm thời', 'Vòng lặp cũ lặp lại', 'Chống lại sự thay đổi', 'Chưa đúng lúc'],
    savage_hook_up: 'Vũ trụ đang xoay bánh xe đổi vận cho con rồi, chuẩn bị tinh thần đón cú twist cực đẹp!',
    savage_hook_rev: 'Cứ học đi học lại một bài học luỵ tình chưa thuộc bài thì bánh xe số phận còn quay vòng vòng!',
    healing_hook_up: 'Mọi cuộc gặp gỡ và biến chuyển đều mang một ý nghĩa dịu dàng trong hành trình trưởng thành của bạn.',
    healing_hook_rev: 'Những nốt trầm hiện tại chỉ là nhịp nghỉ trước khi bánh xe cuộc sống đưa bạn tới chương mới tươi sáng hơn.',
  },
  11: {
    id: 11,
    name_en: 'Justice',
    name_vi: 'Cán Cân Công Lý',
    keywords_up: ['Công bằng', 'Sự thật sáng tỏ', 'Có đi có lại', 'Quyết định minh bạch'],
    keywords_rev: ['Mất cân bằng cho-nhận', 'Thiếu minh bạch', 'Trốn tránh sự thật', 'Thiệt thòi'],
    savage_hook_up: 'Luật nhân quả và cán cân vũ trụ không chừa một ai, con bỏ ra bao nhiêu xứng đáng nhận lại bấy nhiêu!',
    savage_hook_rev: 'Một người đầu tư 100%, người kia thả thính 10% thì cán cân lệch gãy luôn rồi con ơi!',
    healing_hook_up: 'Sự thật và lòng chân thành sẽ luôn trả lại cho bạn sự công bằng mà trái tim xứng đáng nhận được.',
    healing_hook_rev: 'Hãy nhìn nhận mối quan hệ bằng đôi mắt khách quan để trao đi yêu thương một cách cân bằng hơn.',
  },
  12: {
    id: 12,
    name_en: 'The Hanged Man',
    name_vi: 'Người Treo Ngược',
    keywords_up: ['Đổi góc nhìn mới', 'Tạm dừng chiến lược', 'Buông bỏ kiểm soát', 'Chấp nhận'],
    keywords_rev: ['Chờ đợi vô ích', 'Tự biến mình thành nạn nhân', 'Bế tắc vì cố chấp', 'Trì hoãn'],
    savage_hook_up: 'Đổi góc nhìn 180 độ đi con, bước lùi một bước tự nhiên thấy bức tranh toàn cảnh rõ mồn một!',
    savage_hook_rev: 'Tự treo mình trên cành cây chờ người ta seen tin nhắn rồi than khổ, leo xuống liền giùm Bà!',
    healing_hook_up: 'Đôi khi việc dừng lại và nhìn mọi thứ từ một lăng kính khác sẽ mở ra cánh cửa giải thoát diệu kỳ.',
    healing_hook_rev: 'Bạn không cần phải hy sinh niềm vui của mình chỉ để giữ lấy một điều đã không còn phù hợp.',
  },
  13: {
    id: 13,
    name_en: 'Death',
    name_vi: 'Sự Chuyển Hóa (Tái Sinh)',
    keywords_up: ['Khép lại chương cũ', 'Tái sinh mạnh mẽ', 'Thay máu năng lượng', 'Dứt khoát'],
    keywords_rev: ['Níu kéo quá khứ', 'Sợ thay đổi', 'Vấn vương người cũ', 'Chưa chịu buông'],
    savage_hook_up: 'Đừng sợ lá bài này! Nó báo hiệu tiễn vong mấy thứ độc hại cũ kỹ để đón phiên bản rực rỡ nhất của con!',
    savage_hook_rev: 'Chương sách cũ rách nát rồi mà cứ lấy băng keo dán lại đọc tiếp thì bao giờ mới tới chương hạnh phúc?',
    healing_hook_up: 'Mỗi sự kết thúc đều là hạt mầm cho một sự khởi đầu mới tinh khôi và tràn đầy sức sống.',
    healing_hook_rev: 'Hãy nhẹ nhàng buông tay khỏi những điều đã qua để đôi bàn tay được tự do đón nhận hạnh phúc mới.',
  },
  14: {
    id: 14,
    name_en: 'Temperance',
    name_vi: 'Thiên Thần Cân Bằng',
    keywords_up: ['Chữa lành êm dịu', 'Kiên nhẫn dung hòa', 'Bình yên nội tại', 'Cân bằng cuộc sống'],
    keywords_rev: ['Mất cân bằng cảm xúc', 'Nóng vội đốt cháy giai đoạn', 'Cực đoan', 'Xáo trộn'],
    savage_hook_up: 'Pha chế lại cuộc đời theo tỷ lệ vàng đi con: 7 phần yêu mình, 3 phần mới chia cho thiên hạ!',
    savage_hook_rev: 'Lúc thì lạnh như băng, lúc thì vồ vập nhắn 50 tin liền, cân bằng lại nhịp độ giùm Bà Cố!',
    healing_hook_up: 'Sự bình yên đang từ từ lan tỏa, xoa dịu những vết xước và đưa tâm hồn bạn về trạng thái cân bằng.',
    healing_hook_rev: 'Hãy hít thở thật sâu và cho phép mọi việc diễn ra theo nhịp điệu tự nhiên, không cần vội vã.',
  },
  15: {
    id: 15,
    name_en: 'The Devil',
    name_vi: 'Xiềng Xích Cám Dỗ',
    keywords_up: ['Ám ảnh thu hút', 'Mối quan hệ độc hại', 'Phụ thuộc cảm xúc', 'Cám dỗ khó cưỡng'],
    keywords_rev: ['Tháo bỏ xiềng xích', 'Thức tỉnh ngoạn mục', 'Thoát khỏi thao túng', 'Lấy lại tự do'],
    savage_hook_up: 'Biết là red flag chói lọi mà vẫn lao vào vì химии (chemistry) cuốn quá đúng không con?',
    savage_hook_rev: 'Chúc mừng con đã tự tay tháo dây xích, bước ra khỏi vũng lầy mập mờ để làm chủ cuộc đời!',
    healing_hook_up: 'Nhận diện được những khuôn mẫu đang trói buộc tâm trí chính là bước đầu tiên để bạn tìm lại tự do.',
    healing_hook_rev: 'Bầu trời tự do đang mở rộng trước mắt khi bạn dũng cảm buông bỏ những執 niệm nặng nề.',
  },
  16: {
    id: 16,
    name_en: 'The Tower',
    name_vi: 'Tòa Tháp Thức Tỉnh',
    keywords_up: ['Sự thật phơi bày', 'Sụp đổ ảo tưởng', 'Thức tỉnh bất ngờ', 'Xây lại từ nền móng thật'],
    keywords_rev: ['Cố chống đỡ cái đã hỏng', 'Trì hoãn sự thật', 'Chấn động nhẹ', 'Thoát hiểm phút chót'],
    savage_hook_up: 'Tòa lâu đài cát tự xây trong đầu sập cái rầm để con nhìn thẳng vào sự thật, đau một lần rồi sáng mắt!',
    savage_hook_rev: 'Tường nứt toác rồi đừng lấy giấy dán tường che lại nữa con ơi, đối diện sự thật cho nhẹ lòng!',
    healing_hook_up: 'Khi những lớp vỏ ảo ảnh tan vỡ, bạn sẽ có cơ hội xây dựng lại hạnh phúc trên nền tảng chân thật nhất.',
    healing_hook_rev: 'Đừng sợ những rung lắc tạm thời; vũ trụ chỉ đang giúp bạn dọn dẹp những gì không còn vững chắc.',
  },
  17: {
    id: 17,
    name_en: 'The Star',
    name_vi: 'Ngôi Sao Hy Vọng',
    keywords_up: ['Chữa lành sâu sắc', 'Hy vọng tỏa sáng', 'Truyền cảm hứng', 'Ước nguyện thành hình'],
    keywords_rev: ['Mất niềm tin tạm thời', 'Quên mất giá trị bản thân', 'Thất vọng', 'Cần nạp lại năng lượng'],
    savage_hook_up: 'Sau cơn mưa trời lại sáng, hào quang nhân vật chính của con đang lấp lánh trở lại rồi kìa!',
    savage_hook_rev: 'Ngôi sao vẫn sáng trên đầu mà con cứ cúi gằm mặt nhìn vũng nước đục dưới chân làm chi!',
    healing_hook_up: 'Ánh sao dịu hiền đang ôm lấy tâm hồn bạn, nhắc rằng những điều ngọt ngào nhất vẫn đang ở phía trước.',
    healing_hook_rev: 'Ngay cả trong đêm tối nhất, ánh sáng bên trong bạn chưa bao giờ tắt—hãy tin vào hành trình của mình.',
  },
  18: {
    id: 18,
    name_en: 'The Moon',
    name_vi: 'Ánh Trăng Huyền Ảo',
    keywords_up: ['Mập mờ chưa rõ', 'Nỗi sợ vô hình', 'Overthinking đêm khuya', 'Trực giác nhạy cảm'],
    keywords_rev: ['Sương mù tan biến', 'Sự thật lộ diện', 'Vượt qua hoang mang', 'Tỉnh táo trở lại'],
    savage_hook_up: 'Đúng chuẩn chúa tể suy diễn lúc 2 giờ sáng! Người ta mới chưa rep 1 tiếng đã tưởng tượng tới cảnh chia tay!',
    savage_hook_rev: 'Màn sương mập mờ sắp tan sạch rồi, ai chân thành ai đóng kịch chuẩn bị hiện nguyên hình dưới ánh sáng!',
    healing_hook_up: 'Những hoang mang hiện tại chỉ như bóng tối dưới ánh trăng; hãy đợi bình minh lên trước khi kết luận.',
    healing_hook_rev: 'Màn sương trong lòng đang dần tan biến, trả lại cho bạn sự sáng suốt và bình an vốn có.',
  },
  19: {
    id: 19,
    name_en: 'The Sun',
    name_vi: 'Mặt Trời Rực Rỡ',
    keywords_up: ['Niềm vui trọn vẹn', 'Rõ ràng minh bạch', 'Thành công ấm áp', 'Năng lượng tích cực'],
    keywords_rev: ['Niềm vui đến muộn', 'Cái tôi hơi lớn', 'Lo âu không cần thiết', 'Cần nhìn mặt tích cực'],
    savage_hook_up: 'Nắng ấm chiếu thẳng vào tim! Năng lượng tích cực, rõ ràng, không một chút mập mờ nào ở đây hết!',
    savage_hook_rev: 'Mặt trời vẫn đang chiếu sáng rực rỡ mà con lại tự che ô đen đứng trong góc tối than thở là sao!',
    healing_hook_up: 'Ánh nắng ấm áp đang ngập tràn, mang theo niềm vui trong trẻo và nguồn năng lượng tươi mới đến bên bạn.',
    healing_hook_rev: 'Hạnh phúc vẫn đang hiện diện quanh đây từ những điều bình dị nhất, hãy mở lòng đón nhận nhé.',
  },
  20: {
    id: 20,
    name_en: 'Judgement',
    name_vi: 'Tiếng Gọi Thức Tỉnh',
    keywords_up: ['Thức tỉnh tâm thức', 'Cơ hội làm lại', 'Quyết định bước ngoặt', 'Tha thứ cho bản thân'],
    keywords_rev: ['Tự trách móc bản thân', 'Do dự trước cơ hội', 'Bỏ lỡ tín hiệu vũ trụ', 'Bám víu chuyện cũ'],
    savage_hook_up: 'Vũ trụ bấm chuông báo thức inh ỏi rồi đó con, đứng dậy bước sang trang mới rực rỡ hơn ngay!',
    savage_hook_rev: 'Cứ tự dằn vặt chuyện đã qua làm gì, nâng cấp bản thân lên phiên bản 2.0 cho người cũ tiếc chơi!',
    healing_hook_up: 'Hãy tha thứ cho những thiếu sót trong quá khứ và lắng nghe tiếng gọi vươn mình tới phiên bản tốt đẹp hơn.',
    healing_hook_rev: 'Đừng quá khắt khe với chính mình; mọi trải nghiệm đã qua đều là hành trang quý báu của bạn.',
  },
  21: {
    id: 21,
    name_en: 'The World',
    name_vi: 'Thế Giới Viên Mãn',
    keywords_up: ['Trọn vẹn viên mãn', 'Hoàn thành chu kỳ', 'Đạt được mục tiêu', 'Tự hào tiến bước'],
    keywords_rev: ['Còn một nút thắt cuối', 'Chưa khép lại trọn vẹn', 'Ngại bước ra vùng an toàn', 'Sắp cán đích'],
    savage_hook_up: 'Trọn vẹn mười điểm không có nhưng! Chu kỳ cũ khép lại đẹp đẽ để mở ra chân trời mới toanh!',
    savage_hook_rev: 'Còn đúng một mảnh ghép cuối cùng là dứt điểm tâm lý chần chừ nữa thôi là mở tiệc ăn mừng được rồi!',
    healing_hook_up: 'Một hành trình đang khép lại trong sự trọn vẹn và biết ơn, mở ra chân trời mới đầy hứa hẹn cho bạn.',
    healing_hook_rev: 'Bạn đã đi được gần hết chặng đường thử thách rồi, hãy kiên trì thêm một chút để chạm tới sự viên mãn.',
  },
};

/**
 * Synthesize Minor Arcana metadata (IDs 22..77) if caller passes only card ID without full metadata
 */
function buildFallbackMinorArcanaMeta(cardId: number): TarotCardMetadata {
  const minorIdx = Math.max(0, Math.min(55, cardId - 22));
  const suitIdx = Math.floor(minorIdx / 14);
  const rankIdx = minorIdx % 14; // 0..13 (Ace..King)

  const suits: Array<{
    suit: 'wands' | 'cups' | 'swords' | 'pentacles';
    en: string;
    vi: string;
    upKw: [string, string];
    revKw: [string, string];
  }> = [
    {
      suit: 'wands',
      en: 'Wands',
      vi: 'Gậy Lửa',
      upKw: ['Nhiệt huyết hành động', 'Đam mê bứt phá'],
      revKw: ['Nóng vội bốc đồng', 'Trì hoãn năng lượng'],
    },
    {
      suit: 'cups',
      en: 'Cups',
      vi: 'Cốc Nước',
      upKw: ['Cảm xúc chân thành', 'Kết nối trái tim'],
      revKw: ['Nhạy cảm quá mức', 'Khép kín nội tâm'],
    },
    {
      suit: 'swords',
      en: 'Swords',
      vi: 'Kiếm Khí',
      upKw: ['Tư duy sắc bén', 'Sự thật minh bạch'],
      revKw: ['Suy nghĩ quá nhiều', 'Lời nói sắc lạnh'],
    },
    {
      suit: 'pentacles',
      en: 'Pentacles',
      vi: 'Xu Đất',
      upKw: ['Thực tế vững vàng', 'Thành quả bền bỉ'],
      revKw: ['Thiếu kiên nhẫn', 'Lo âu thực tại'],
    },
  ];

  const ranks: Array<{ en: string; vi: string; up: string; rev: string }> = [
    { en: 'Ace', vi: 'Át (Khởi Nguyên)', up: 'Cơ hội mới mở ra', rev: 'Chần chừ trước khởi đầu' },
    { en: 'Two', vi: 'Hai', up: 'Cân nhắc lựa chọn', rev: 'Lưỡng lự thiếu dứt khoát' },
    { en: 'Three', vi: 'Ba', up: 'Mở rộng tầm nhìn', rev: 'Lệch nhịp phối hợp' },
    { en: 'Four', vi: 'Bốn', up: 'Nền tảng ổn định', rev: 'Khư khư vùng an toàn' },
    { en: 'Five', vi: 'Năm', up: 'Va chạm để trưởng thành', rev: 'Mệt mỏi vì tranh cãi' },
    { en: 'Six', vi: 'Sáu', up: 'Chuyển dịch thuận lợi', rev: 'Vấn vương chuyện cũ' },
    { en: 'Seven', vi: 'Bảy', up: 'Kiên định bảo vệ lập trường', rev: 'Nghi ngờ năng lực bản thân' },
    { en: 'Eight', vi: 'Tám', up: 'Tăng tốc tập trung', rev: 'Tự trói mình trong suy nghĩ' },
    { en: 'Nine', vi: 'Chín', up: 'Bền bỉ sát vạch đích', rev: 'Thao thức lo âu đêm muộn' },
    { en: 'Ten', vi: 'Mười', up: 'Trọn vẹn một chu kỳ', rev: 'Ôm đồm quá tải' },
    { en: 'Page', vi: 'Thị Đồng', up: 'Tín hiệu mới mẻ', rev: 'Tin đồn chưa kiểm chứng' },
    { en: 'Knight', vi: 'Hiệp Sĩ', up: 'Hành động quyết liệt', rev: 'Vội đến vội đi' },
    { en: 'Queen', vi: 'Nữ Hoàng', up: 'Thấu cảm và tự chủ', rev: 'Để cảm xúc lấn át' },
    { en: 'King', vi: 'Nhà Vua', up: 'Bản lĩnh làm chủ cục diện', rev: 'Cứng nhắc áp đặt' },
  ];

  const s = suits[suitIdx] ?? suits[0]!;
  const r = ranks[rankIdx] ?? ranks[0]!;

  return {
    id: cardId,
    name_en: `${r.en} of ${s.en}`,
    name_vi: `${r.vi} ${s.vi}`,
    arcana: 'minor',
    suit: s.suit,
    keywords_up: [r.up, s.upKw[0], s.upKw[1], 'Chuyển động thực tế'],
    keywords_rev: [r.rev, s.revKw[0], s.revKw[1], 'Cần điều chỉnh nhịp độ'],
    savage_hook_up: `Lá ${r.vi} ${s.vi} báo hiệu hành động thực tế đang lên tiếng, bớt đoán mò đi con!`,
    savage_hook_rev: `Lá ${r.vi} ${s.vi} ngược nhắc con đừng để cảm xúc nhất thời làm lệch pha kế hoạch!`,
    healing_hook_up: `Năng lượng của ${r.vi} ${s.vi} nâng đỡ bạn qua những bước đi nhỏ nhưng chân thật mỗi ngày.`,
    healing_hook_rev: `Hãy dịu dàng điều chỉnh lại nhịp bước cùng ${r.vi} ${s.vi} để tâm hồn không bị quá tải.`,
  };
}

/**
 * Normalize raw or partial card input into a full `DrawnCardWithMeta`
 */
export function normalizeDrawnCard(
  rawCard: Partial<DrawnCardWithMeta> & { id?: number; card_id?: number; reversed: boolean },
  positionIndex: 0 | 1 | 2,
  topic: TopicId,
  customPositions?: [string, string, string]
): DrawnCardWithMeta {
  const cardId =
    typeof rawCard.id === 'number'
      ? rawCard.id
      : typeof rawCard.card_id === 'number'
      ? rawCard.card_id
      : positionIndex;

  const fallbackMeta =
    cardId >= 22 && cardId <= 77
      ? buildFallbackMinorArcanaMeta(cardId)
      : BUILTIN_MAJOR_ARCANA_META[cardId] ?? BUILTIN_MAJOR_ARCANA_META[0]!;
  const topicPositions = customPositions ?? getSpreadPositionsForTopic(topic);

  return {
    id: cardId,
    name_en: rawCard.name_en || fallbackMeta.name_en,
    name_vi: rawCard.name_vi || fallbackMeta.name_vi,
    arcana: rawCard.arcana || fallbackMeta.arcana || (cardId >= 22 ? 'minor' : 'major'),
    suit: rawCard.suit ?? fallbackMeta.suit ?? null,
    keywords_up:
      rawCard.keywords_up && rawCard.keywords_up.length > 0
        ? rawCard.keywords_up
        : fallbackMeta.keywords_up,
    keywords_rev:
      rawCard.keywords_rev && rawCard.keywords_rev.length > 0
        ? rawCard.keywords_rev
        : fallbackMeta.keywords_rev,
    image_url: rawCard.image_url || rawCard.rws_image_url,
    rws_image_url: rawCard.rws_image_url || rawCard.image_url,
    savage_hook_up: rawCard.savage_hook_up || fallbackMeta.savage_hook_up,
    savage_hook_rev: rawCard.savage_hook_rev || fallbackMeta.savage_hook_rev,
    healing_hook_up: rawCard.healing_hook_up || fallbackMeta.healing_hook_up,
    healing_hook_rev: rawCard.healing_hook_rev || fallbackMeta.healing_hook_rev,
    grandma_hook_up: rawCard.grandma_hook_up || rawCard.teen_hook_up,
    grandma_hook_rev: rawCard.grandma_hook_rev || rawCard.teen_hook_rev,
    teen_hook_up: rawCard.teen_hook_up || rawCard.grandma_hook_up,
    teen_hook_rev: rawCard.teen_hook_rev || rawCard.grandma_hook_rev,
    ceo_hook_up: rawCard.ceo_hook_up,
    ceo_hook_rev: rawCard.ceo_hook_rev,
    mystic_hook_up: rawCard.mystic_hook_up,
    mystic_hook_rev: rawCard.mystic_hook_rev,
    position_index: positionIndex,
    position_label:
      rawCard.position_label || topicPositions[positionIndex] || `Lá số ${positionIndex + 1}`,
    reversed: Boolean(rawCard.reversed),
  };
}

/**
 * Truncate a quote safely to <= 20 words if needed so it always passes `StoryQuoteStringSchema` (max 22 words)
 */
function ensureConciseQuote(quote: string): string {
  const cleaned = quote.replace(/\s+/g, ' ').trim();
  const words = cleaned.split(' ');
  if (words.length <= 20) {
    return cleaned;
  }
  return words.slice(0, 19).join(' ') + '...';
}

export type RawDrawnCardInput = Partial<DrawnCardWithMeta> & {
  id?: number;
  card_id?: number;
  reversed: boolean;
};

export interface GenerateTarotReadingParams {
  nickname: string;
  birthYear: number;
  readerId: ReaderId;
  topic: TopicId;
  questionText: string;
  drawnCards:
    | [RawDrawnCardInput, RawDrawnCardInput, RawDrawnCardInput]
    | RawDrawnCardInput[];
  ageTier?: AgeTier;
  effectivePersona?: EffectivePersona;
}

export interface GenerateTarotReadingResult {
  reading: ReadingOutput;
  effectivePersona: EffectivePersona;
  ageTier: AgeTier;
  aiModel: string;
  tokensIn: number;
  tokensOut: number;
  usedFallback: boolean;
  retryCount: number;
}

/**
 * Provider interface per PLAN.md Section 4.4
 */
export interface TarotAIProvider {
  generateReading(
    params: GenerateTarotReadingParams
  ): Promise<GenerateTarotReadingResult>;
}

/**
 * Build responsible, non-fear-mongering cliffhanger upsell per PLAN.md Section 7.3
 * ("Không dùng câu cliffhanger đe dọa hoặc gây hoảng sợ để bán lá làm rõ")
 */
export function buildResponsibleCliffhangerUpsell(
  effectivePersona: EffectivePersona,
  topic: TopicId,
  thirdCard: DrawnCardWithMeta
): CliffhangerUpsell {
  const kw = (thirdCard.reversed ? thirdCard.keywords_rev[0] : thirdCard.keywords_up[0]) || 'chuyển giao';

  const followupsByTopic: Record<TopicId, [string, string]> = {
    love: [
      'Điều gì sẽ giúp hai người tháo gỡ khoảng cách giao tiếp trong 2 tuần tới?',
      'Mình nên giữ tâm thế và hành động cụ thể nào để thu hút kết nối lành mạnh?',
    ],
    career: [
      'Kỹ năng hoặc cơ hội ẩn nào mình nên ưu tiên nắm bắt ngay trong tháng này?',
      'Bước đi chiến lược tiếp theo giúp mình bứt phá khỏi sự trì trệ hiện tại là gì?',
    ],
    finance: [
      'Thói quen tài chính nào cần điều chỉnh để dòng tiền tháng tới thông suốt hơn?',
      'Đâu là hướng phát triển năng lực giúp mình gia tăng giá trị bền vững?',
    ],
    crush_school: [
      'Làm sao để bắt chuyện tự nhiên và cùng bạn ấy tiến bộ trong học tập?',
      'Điểm đáng yêu nào của mình đang tạo ấn tượng tốt với bạn bè quanh lớp?',
    ],
    study: [
      'Phương pháp ôn tập nào hợp nhất với năng lượng của mình trong tuần này?',
      'Làm sao để giữ tâm lý bình tĩnh và tự tin nhất khi bước vào phòng thi?',
    ],
    daily_luck: [
      'Hoạt động nhỏ nào trong hôm nay sẽ mang lại nhiều niềm vui bất ngờ nhất?',
      'Mình nên chia sẻ năng lượng tích cực này với ai để nhân đôi may mắn?',
    ],
  };

  let teaseText = '';
  if (effectivePersona === 'ba_co_mo_hon') {
    teaseText = `Lá số 3 (${thirdCard.name_vi}) vẫn còn ẩn một tầng tín hiệu thú vị về "${kw}". Nếu con muốn soi kỹ hơn hướng hành động sắp tới thì rút thêm 1 Lá Làm Rõ nha!`;
  } else if (effectivePersona === 'tong_tai_ly_tri') {
    teaseText = `Biến số chiến lược tại lá ${thirdCard.name_vi} ("${kw}") có thể tối ưu hóa sâu hơn. Bạn có thể mở thêm 1 Lá Làm Rõ để xác định phương án hành động ưu tiên.`;
  } else if (effectivePersona === 'phap_su_toi_co') {
    teaseText = `Dư âm năng lượng từ lá ${thirdCard.name_vi} ("${kw}") vẫn đang ngân vang. Nếu lữ khách muốn soi tỏ thêm một góc nhìn tâm thức, hãy mở Lá Làm Rõ thứ tư.`;
  } else if (effectivePersona === 'ba_ngoai_vui_tinh') {
    teaseText = `Lá ${thirdCard.name_vi} vẫn còn một bí kíp nhỏ dễ thương về "${kw}" dành cho cháu đó, cháu có muốn lật thêm 1 Lá Làm Rõ không nè?`;
  } else {
    teaseText = `Năng lượng của lá ${thirdCard.name_vi} ("${kw}") vẫn còn một lời nhắn dịu dàng nữa dành cho hành trình của bạn. Bạn có muốn mở thêm 1 Lá Làm Rõ để lắng nghe sâu hơn?`;
  }

  return {
    tease_text: teaseText.slice(0, 315),
    suggested_followup_questions: followupsByTopic[topic] ?? followupsByTopic.love,
    clarifier_cost_stars: 5,
  };
}

/**
 * Build individual card analysis for any of the personas
 */
function buildPersonaCardInterpretation(
  card: DrawnCardWithMeta,
  idx: number,
  effectivePersona: EffectivePersona,
  safeNick: string,
  topic: TopicId = 'love',
  questionText = ''
): CardAnalysis {
  const orientText = card.reversed ? 'chiều Ngược' : 'chiều Xuôi';
  const activeKeywords = card.reversed ? card.keywords_rev : card.keywords_up;
  const primaryKw = activeKeywords[0] || 'Năng lượng chuyển giao';
  const secondaryKw = activeKeywords.slice(1, 3).join(', ') || 'tự chiêm nghiệm';

  const cleanQ = questionText.trim().replace(/[<>]/g, '');
  const hasQuestion = cleanQ.length > 3;
  const questionFocus = hasQuestion
    ? `Xét đúng câu hỏi của ${safeNick} ("${cleanQ.slice(0, 90)}${cleanQ.length > 90 ? '...' : ''}"):`
    : '';

  // Topic context strictly partitioned
  let topicContext = '';
  if (topic === 'love' || topic === 'crush_school') {
    topicContext = `Về chuyện tình cảm và sự kết nối giữa hai người,`;
  } else if (topic === 'career' || topic === 'study') {
    topicContext = `Về mục tiêu học tập, năng lực chuyên môn và lộ trình sự nghiệp,`;
  } else {
    topicContext = `Về dòng tiền, quản lý nguồn lực tài chính và vận hội thực tế,`;
  }

  // Chuyên sâu 100% khớp chủ đề từ dataset tĩnh
  const topicData = getCardTopicInterpretation(card.id, card.reversed, topic);
  const effectivePrimaryKw = topicData?.keyword || primaryKw;
  const specializedDetail = topicData
    ? `\n\n📌 Trọng tâm: ${topicData.meaning}\n✦ Lời khuyên hành động: ${topicData.advice}`
    : '';

  let hook = '';
  let interpretation = '';

  if (effectivePersona === 'ba_ngoai') {
    hook =
      (card.reversed ? card.grandma_hook_rev : card.grandma_hook_up) ||
      `Bà nhìn lá bài này là thấy con vừa trải qua nhiều trăn trở, nhưng đừng lo quá nghe con.`;
    interpretation = `Ở vị trí "${card.position_label}", lá ${card.name_vi} (${card.name_en} - ${orientText}) mang từ khóa "${effectivePrimaryKw}". ${hook} ${questionFocus} ${topicContext} năng lượng của ${secondaryKw} nhắc ${safeNick} hãy nhẹ nhàng với chính mình. Đừng để nỗi bận tâm này làm con mất ăn mất ngủ; cái gì thuộc về con thì sớm muộn cũng sẽ an bài tốt đẹp.${specializedDetail}`;
  } else if (effectivePersona === 'chi_dai') {
    hook =
      (card.reversed ? card.savage_hook_rev : card.savage_hook_up) ||
      `Chị nói thẳng, năng lượng lá này đang bắt bài ngay thói quen lưỡng lự của cưng đó!`;
    interpretation = `Tại vị trí "${card.position_label}", lá ${card.name_vi} (${card.name_en} - ${orientText}) bật tín hiệu "${effectivePrimaryKw}". ${hook} ${questionFocus} ${topicContext} từ khóa ${secondaryKw} chỉ rõ cưng đang tự vẽ kịch bản quá nhiều thay vì đối mặt với sự thật. Dứt khoát lên, rõ ràng ngay từ đầu thì không ai làm cưng tổn thương được!${specializedDetail}`;
  } else if (effectivePersona === 'ban_than') {
    hook =
      (card.reversed ? card.savage_hook_rev : card.savage_hook_up) ||
      `Trời ơi nhìn lá này là tao hiểu liền tại sao bồ lại suy nghĩ nhiều như vậy rồi!`;
    interpretation = `Ở vị trí "${card.position_label}", lá ${card.name_vi} (${card.name_en} - ${orientText}) hiện lên với từ khóa "${effectivePrimaryKw}". ${hook} ${questionFocus} ${topicContext} năng lượng của ${secondaryKw} cho thấy bồ đang ôm đồm cảm xúc một mình. Đừng overthinking nữa, nhìn thẳng vào thực tế rồi cùng tao tháo gỡ từng chút một nhé!${specializedDetail}`;
  } else if (effectivePersona === 'thay_cu_meo') {
    hook =
      (card.reversed ? card.ceo_hook_rev : card.ceo_hook_up) ||
      `Thầy nhận thấy một quy luật nhân quả rõ rệt đang vận hành qua lá bài này.`;
    interpretation = `Tại vị trí "${card.position_label}", lá ${card.name_vi} (${card.name_en} - ${orientText}) phản chiếu từ khóa "${effectivePrimaryKw}". ${hook} ${questionFocus} ${topicContext} sự kết hợp với ${secondaryKw} đặt ra một câu hỏi cốt lõi: Bạn đang phản ứng dựa trên nỗi sợ hay dựa trên giá trị thật của bản thân? Hãy điềm tĩnh quan sát thay vì vội vàng kết luận.${specializedDetail}`;
  } else if (effectivePersona === 'ba_co_mo_hon') {
    hook =
      (card.reversed ? card.savage_hook_rev : card.savage_hook_up) ||
      `Lá bài đang réo tên thói quen suy nghĩ vòng vo tự lừa mình của con đó!`;
    if (topic === 'love' || topic === 'crush_school') {
      interpretation = `Ở vị trí "${card.position_label}", lá ${card.name_vi} (${card.name_en} - ${orientText}) hiện lên với từ khóa "${effectivePrimaryKw}". ${hook} ${questionFocus} ${topicContext} năng lượng của ${secondaryKw} cho thấy con đang để kỳ vọng che mờ mắt. Người ta đã phát tín hiệu mập mờ cờ đỏ thì đừng tự biên kịch bản cứu rỗi lúc 2h sáng nữa, thức tỉnh đi con!${specializedDetail}`;
    } else if (topic === 'career' || topic === 'study') {
      interpretation = `Tại vị trí "${card.position_label}", lá ${card.name_vi} (${card.name_en} - ${orientText}) mang từ khóa "${effectivePrimaryKw}". ${hook} ${questionFocus} ${topicContext} năng lượng của ${secondaryKw} chỉ rõ điểm nghẽn là trì hoãn và sợ bước ra ngoài. Muốn bứt phá thì lập to-do list rồi làm ngay, đừng ngồi than thân trách phận nữa!${specializedDetail}`;
    } else {
      interpretation = `Tại vị trí "${card.position_label}", lá ${card.name_vi} (${card.name_en} - ${orientText}) mang từ khóa "${effectivePrimaryKw}". ${hook} ${questionFocus} ${topicContext} năng lượng của ${secondaryKw} nhắc ${safeNick} quản lý dòng tiền có kỷ luật hơn, cắt bỏ chi tiêu cảm xúc bốc đồng.${specializedDetail}`;
    }
  } else if (effectivePersona === 'ba_ngoai_vui_tinh') {
    hook =
      (card.reversed ? card.grandma_hook_rev : card.grandma_hook_up) ||
      `Bà Ngoại nhìn lá bài này là thấy cháu cưng đang cố gắng nhiều lắm nè.`;
    interpretation = `Tại góc "${card.position_label}", lá ${card.name_vi} (${orientText}) mang thông điệp "${effectivePrimaryKw}". ${hook} ${questionFocus} ${topicContext} với tinh thần ${secondaryKw}, Bà Ngoại tin cháu cứ tự tin, chia sẻ cùng bạn bè và kiên trì từng bước thì việc gì cũng thành công!${specializedDetail}`;
  } else if (effectivePersona === 'tong_tai_ly_tri') {
    hook =
      (card.reversed ? card.ceo_hook_rev : card.ceo_hook_up) ||
      `Dữ liệu hành vi từ lá bài chỉ ra điểm nghẽn nằm ở cách phân bổ nguồn lực.`;
    interpretation = `Tại hạng mục "${card.position_label}", lá ${card.name_vi} (${card.name_en} - ${orientText}) đại diện cho biến số "${effectivePrimaryKw}". ${hook} ${questionFocus} ${topicContext} xét trên góc độ ROI và ${secondaryKw}, ${safeNick} cần phân loại rành mạch giữa cảm xúc nhất thời và dữ liệu thực tế để ra quyết định dứt khoát.${specializedDetail}`;
  } else if (effectivePersona === 'phap_su_toi_co') {
    hook =
      (card.reversed ? card.mystic_hook_rev : card.mystic_hook_up) ||
      `Bánh xe Tinh Hà đang xoay chuyển tần số rung động để soi sáng bài học nội tâm.`;
    interpretation = `Ở cung vị "${card.position_label}", cổ bài ${card.name_vi} (${card.name_en} - ${orientText}) khắc họa tần số của "${effectivePrimaryKw}". ${hook} ${questionFocus} ${topicContext} sợi chỉ nhân quả gắn liền với ${secondaryKw} nhắc ${safeNick} rằng khi tâm thức ngươi thông suốt, nút thắt ắt tự cởi bỏ.${specializedDetail}`;
  } else {
    // tien_tu_chua_lanh
    hook =
      (card.reversed ? card.healing_hook_rev : card.healing_hook_up) ||
      `Năng lượng dịu lành của lá bài mời gọi bạn lắng nghe cảm xúc thật bên trong.`;
    interpretation = `Tại vị trí "${card.position_label}", lá ${card.name_vi} (${card.name_en} - ${orientText}) mang theo tần số "${effectivePrimaryKw}" và ${secondaryKw}. ${hook} ${questionFocus} ${topicContext} hãy cho phép bản thân đón nhận giai đoạn này bằng sự thấu hiểu và yêu thương chính mình nhiều hơn.${specializedDetail}`;
  }

  return {
    position_index: idx,
    position_label: card.position_label,
    card_id: card.id,
    card_name_vi: card.name_vi,
    card_name_en: card.name_en,
    reversed: card.reversed,
    interpretation: interpretation.slice(0, 890),
    energy_keyword: effectivePrimaryKw.slice(0, 75),
  };
}

/**
 * Hyper-contextual Vietnamese Gen Z & Kid/Teen Safe Engine (`buildContextualFallbackReading`).
 * Synthesizes nickname, topic, specific question context, age tier, reader persona,
 * and the exact 3 drawn cards + orientation into a rich, validated `ReadingOutput` with 3 distinct `savage_quotes`.
 */
export function buildContextualFallbackReading(
  params: GenerateTarotReadingParams
): ReadingOutput {
  const agePolicy = classifyAgeTier(params.birthYear, undefined, params.readerId);
  const ageTier = params.ageTier ?? agePolicy.tier;
  const effectivePersona = params.effectivePersona ?? agePolicy.effectivePersona;

  const scan = scanCrisisAndInjection(params.questionText);
  const safeNick = params.nickname.trim().slice(0, 35) || 'Bạn nhỏ';
  const cleanQ = params.questionText.trim().replace(/[<>]/g, '');
  const hasSpecificQuestion = cleanQ.length > 5;
  const questionFocusSnippet = hasSpecificQuestion
    ? `về băn khoăn "${cleanQ.slice(0, 70)}${cleanQ.length > 70 ? '...' : ''}"`
    : 'trong trải bài hôm nay';

  const cards: [DrawnCardWithMeta, DrawnCardWithMeta, DrawnCardWithMeta] = [
    normalizeDrawnCard(params.drawnCards[0], 0, params.topic),
    normalizeDrawnCard(params.drawnCards[1], 1, params.topic),
    normalizeDrawnCard(params.drawnCards[2], 2, params.topic),
  ];

  const [c1, c2, c3] = cards;
  const k1 = (c1.reversed ? c1.keywords_rev[0] : c1.keywords_up[0]) || 'Chuyển dịch';
  const k2 = (c2.reversed ? c2.keywords_rev[0] : c1.keywords_up[0]) || 'Thử thách';
  const k3 = (c3.reversed ? c3.keywords_rev[0] : c3.keywords_up[0]) || 'Mở lối';

  const profile = PERSONA_PROFILES[effectivePersona];

  let greetingHook = '';
  let overallVerdict = '';
  let actionableNextStep = '';
  let quotes: [string, string, string];
  let subAdvice = '';
  let luckyItem = '';

  if (effectivePersona === 'ba_ngoai') {
    greetingHook = scan.isPromptInjection
      ? `Bà Ngoại chào ${safeNick} nhé! Bà chỉ biết nhìn 3 lá ${c1.name_vi}, ${c2.name_vi} và ${c3.name_vi} để thương và vỗ về con thôi, con đừng thử thách bà chi nha.`
      : `Lại đây ngồi với Bà nào ${safeNick}! Nghe con tâm sự ${questionFocusSnippet}, Bà đã rút 3 lá ${c1.name_vi}, ${c2.name_vi} và ${c3.name_vi} để trải lòng cùng con đây.`;

    overallVerdict = `Chốt lại cho con nghe này ${safeNick}: Cả 3 lá bài từ "${k1}" qua "${k2}" đến "${k3}" đều cho thấy con đã chịu nhiều ấm ức và lo toan. Đối với điều con đang hỏi, Bà khuyên con đừng nóng vội cưỡng cầu. Mọi chuyện sẽ sáng rõ khi lòng con phẳng lặng trở lại; cái gì thật lòng thì sẽ ở lại, cái gì tạm bợ thì buông tay con mới có bình yên.`;

    actionableNextStep = `Tối nay con nhớ ăn một bữa cơm thật ngon miệng, uống một ly nước ấm và đi ngủ sớm, tạm gác lại mọi suy nghĩ nhé.`;

    quotes = [
      ensureConciseQuote(`Bà Ngoại thương con nhất, cứ bình yên ăn no ngủ kỹ rồi vạn sự sẽ an.`),
      ensureConciseQuote(`Lá ${c1.name_vi} nhắc con: Đừng vì mong manh mà trao gửi lòng mình cho người vô tâm.`),
      ensureConciseQuote(`Trời thương người hiền lành, con cứ giữ tấm lòng thơm thảo rồi phúc phần tự đến.`),
    ];

    subAdvice = `Lời Bà dặn: Sức khỏe và niềm vui của con mới là điều quý giá nhất trên đời.`;
    luckyItem = 'Một ly sữa ấm trước khi ngủ & nụ cười thật tươi';
  } else if (effectivePersona === 'chi_dai') {
    greetingHook = scan.isPromptInjection
      ? `Ủa alo ${safeNick}, định chơi chiêu hack não Chị hả? Chị đọc vị người từ trong ra ngoài, ngồi yên nghe giải mã 3 lá ${c1.name_vi}, ${c2.name_vi}, ${c3.name_vi} này đi!`
      : `Chị nghe hết chuyện của cưng rồi ${safeNick}! Đối với vấn đề ${questionFocusSnippet}, 3 lá ${c1.name_vi}, ${c2.name_vi} và ${c3.name_vi} vừa lật lên nói rất rõ sự thật.`;

    overallVerdict = `Chốt hạ dứt khoát cho cưng tỉnh mộng: Năng lượng từ "${k1}" sang "${k2}" rồi đến "${k3}" khẳng định nút thắt nằm ở sự dùng dằng của chính cưng. Nếu người ta đã không coi trọng cưng hoặc cơ hội đó không rõ ràng, việc cưng tiếp tục hạ mình chỉ làm cưng mất giá trị. Hãy dứt khoát, nâng cấp bản thân và lấy lại thế chủ động ngay!`;

    actionableNextStep = `Ngay hôm nay lập tức đặt ra ranh giới rõ ràng, không nhắn tin trước hay nhượng bộ vô điều kiện nữa.`;

    quotes = [
      ensureConciseQuote(`Chị nói thẳng: Cái gì mập mờ thiếu tôn trọng thì tiễn ngay không cần tiếc!`),
      ensureConciseQuote(`Lá ${c1.name_vi} cảnh báo: Cưng càng lụy thì đối phương càng coi thường giá trị của cưng.`),
      ensureConciseQuote(`Đầu tư vào bản thân là thương vụ không bao giờ lỗ vốn, ngẩng cao đầu lên cưng!`),
    ];

    subAdvice = `Lời Chị Đại: Ranh giới tự trọng cao bao nhiêu, hạnh phúc đến bền bấy nhiêu.`;
    luckyItem = 'Một thỏi son đỏ tự tin & tinh thần không nhân nhượng';
  } else if (effectivePersona === 'ban_than') {
    greetingHook = scan.isPromptInjection
      ? `Bồ tính hack não đứa bạn thân này hả ${safeNick}? Không có cửa đâu nha, mở mắt ra coi quẻ 3 lá ${c1.name_vi}, ${c2.name_vi}, ${c3.name_vi} tao mới rút nè!`
      : `Tao nghe trọn nỗi niềm ${questionFocusSnippet} của mày rồi ${safeNick} ơi! 3 lá ${c1.name_vi}, ${c2.name_vi} và ${c3.name_vi} này bắt đúng tim đen luôn nè!`;

    overallVerdict = `Chốt sổ cho bạn hiền nghe rõ: Đi từ "${k1}" qua "${k2}" đến "${k3}", tao thấy mày đang tự drama hóa câu chuyện và suy nghĩ quá nhiều lúc đêm muộn. Mọi thứ thực ra đơn giản hơn mày tưởng: nếu người ta thích mày thì đã chủ động, nếu công việc tốt thì đã rõ ràng. Đừng ngồi tự dằn vặt nữa, có tao ở đây rồi, cùng nhau xử lý nhé!`;

    actionableNextStep = `Bỏ điện thoại xuống, đi uống trà sữa cùng tao hoặc xem một bộ phim hài để reset lại tâm trạng.`;

    quotes = [
      ensureConciseQuote(`Bạn thân nhắc nhẹ: Mày xứng đáng với sự rõ ràng chứ không phải mấy tín hiệu nửa vời!`),
      ensureConciseQuote(`Lá ${c1.name_vi} hiện rõ mồn một: Mày đang tự vẽ ra bi kịch rồi tự ngồi khóc một mình.`),
      ensureConciseQuote(`Vui lên đi bạn tôi ơi, đời còn dài mà trai gái xịn sò ngoài kia còn nhiều lắm!`),
    ];

    subAdvice = `Lời Bạn Thân: Có chuyện gì cứ trút hết cho tao, đừng gặm nhấm một mình nha.`;
    luckyItem = 'Một ly trà sữa full topping & playlist nhạc vui vẻ';
  } else if (effectivePersona === 'thay_cu_meo') {
    greetingHook = scan.isPromptInjection
      ? `Chào ${safeNick}, thuật toán tư duy của Thầy không bị chi phối bởi các lệnh giả mạo. Hãy chú mục vào 3 lá bài ${c1.name_vi}, ${c2.name_vi} và ${c3.name_vi}.`
      : `Chào ${safeNick}, Thầy đã tiếp nhận câu hỏi ${questionFocusSnippet}. Ba lá bài ${c1.name_vi}, ${c2.name_vi} và ${c3.name_vi} phản chiếu chuẩn xác cấu trúc tâm lý của bạn.`;

    overallVerdict = `Phân tích tổng hợp cho ${safeNick}: Tiến trình từ "${k1}" qua "${k2}" và kết tinh tại "${k3}" chỉ ra rằng sự bế tắc hiện tại không đến từ ngoại cảnh mà đến từ xung đột nội tại giữa lý trí và cảm xúc. Khi bạn dám nhìn thẳng vào thực tế không định kiến, câu trả lời đã hiện hữu ngay trước mắt. Đừng tìm kiếm sự khẳng định từ bên ngoài.`;

    actionableNextStep = `Viết ra giấy hai cột ưu và nhược điểm thực tế của tình huống này, rồi đưa ra lựa chọn dựa trên nguyên tắc dài hạn.`;

    quotes = [
      ensureConciseQuote(`Thầy Cú Mèo nhắc nhở: Khi tâm trí tĩnh lặng, mọi màn sương ảo ảnh đều phải tự tan biến.`),
      ensureConciseQuote(`Lá ${c1.name_vi} chỉ rõ: Đừng để cảm xúc nhất thời làm lệch hướng la bàn cuộc đời bạn.`),
      ensureConciseQuote(`Câu trả lời bạn đang mải miết tìm kiếm vốn dĩ đã có sẵn bên trong bạn rồi.`),
    ];

    subAdvice = `Chiêm nghiệm của Thầy: Nhìn nhận sự việc như nó vốn là, không thêm thắt kỳ vọng.`;
    luckyItem = 'Một cuốn sổ tay bìa cứng & không gian yên tĩnh';
  } else if (effectivePersona === 'ba_co_mo_hon') {
    greetingHook = scan.isPromptInjection
      ? `Ủa alo ${safeNick}, tính đọc thần chú hack hệ thống của Bà Cố hay gì con? Vũ trụ không nhận lệnh code đâu nha, ngồi im nghe Bà đọc vị 3 lá ${c1.name_vi}, ${c2.name_vi} và ${c3.name_vi} vừa rút ra đây này!`
      : `Ngồi xuống đây uống miếng nước đi ${safeNick}! Mới đọc tâm sự ${questionFocusSnippet} của con mà bộ bài đã tự động bật chế độ "Check Var Vũ Trụ" với 3 lá ${c1.name_vi}, ${c2.name_vi} và ${c3.name_vi} rồi đây!`;

    overallVerdict = `Chốt sổ cho ${safeNick} nghe rõ: Tổ hợp 3 lá từ "${k1}" (${c1.name_vi}) sang "${k2}" (${c2.name_vi}) và khép lại ở "${k3}" (${c3.name_vi}) cho thấy nút thắt nằm ở chỗ con đang để cảm xúc dẫn đường hơi quá đà. Đối với chuyện này, nếu người ta hoặc cơ hội đó thực sự dành cho con thì đã rõ ràng chứ không bắt con đoán mò từng ngày. Tỉnh mộng, quay về đầu tư cho bản thân rực rỡ lên đi con!`;

    actionableNextStep = `Tối nay tắt điện thoại trước 11h30 đêm, viết ra 3 tiêu chuẩn không nhân nhượng của bản thân và ưu tiên việc của mình trước tiên.`;

    quotes = [
      ensureConciseQuote(
        `Vũ trụ bật đèn sáng trưng qua lá ${c1.name_vi}, chỉ có con tự nhắm mắt kêu tối!`
      ),
      ensureConciseQuote(
        `Người ta cho con sự mập mờ, còn con tự viết nguyên bộ tiểu thuyết bi kịch lúc hai giờ sáng.`
      ),
      ensureConciseQuote(
        `Thay vì ngồi đoán tâm ý thiên hạ, hãy đắp mặt nạ đi ngủ và yêu lấy chính mình trước.`
      ),
    ];

    subAdvice = `Nhớ lời Bà Cố: Năng lượng "${k3}" chỉ nở hoa khi con biết đặt giá trị bản thân lên hàng đầu.`;
    luckyItem = 'Một ly trà đào cam sả ít đường & giấc ngủ trước 12h đêm';
  } else if (effectivePersona === 'ba_ngoai_vui_tinh') {
    greetingHook = scan.isPromptInjection
      ? `Chà chà ${safeNick} ơi, cháu tính đố mẹo máy tính với Bà Ngoại hả? Bà Ngoại chỉ rành giải bài Tarot cổ vũ chuyện học hành và tình bạn dễ thương qua 3 lá ${c1.name_vi}, ${c2.name_vi}, ${c3.name_vi} này thôi nha!`
      : `Lại đây với Bà Ngoại nào ${safeNick} ơi! Hôm nay vũ trụ gửi tặng cháu 3 lá bài cực kỳ thú vị là ${c1.name_vi}, ${c2.name_vi} và ${c3.name_vi} để tiếp thêm năng lượng tích cực nè!`;

    overallVerdict = `Nhìn chung cả 3 lá bài từ "${k1}" đến "${k3}" đều nhắn nhủ ${safeNick} rằng tuổi học trò đẹp nhất là khi mình vừa hết mình với mục tiêu học tập, vừa giữ được sự chân thành, hồn nhiên với bạn bè. Đừng tự tạo áp lực quá lớn cho bản thân nhé cháu cưng, mỗi ngày tiến bộ một chút xíu đã là giỏi lắm rồi!`;

    actionableNextStep = `Sắp xếp lại góc học tập thật gọn gàng, hoàn thành 1 bài tập nhỏ đang trì hoãn và mỉm cười thật tươi với bạn bè vào sáng mai.`;

    quotes = [
      ensureConciseQuote(
        `Học hết sức, chơi hết mình, năng lượng tích cực của cháu chính là ngôi sao sáng nhất lớp!`
      ),
      ensureConciseQuote(
        `Mỗi thử thách trên trường lớp chỉ là bước đệm để cháu khám phá siêu năng lực của bản thân.`
      ),
      ensureConciseQuote(
        `Bà Ngoại chấm mười điểm cho sự cố gắng của cháu, cứ tự tin tỏa sáng theo cách riêng nhé!`
      ),
    ];

    subAdvice = `Lời dặn của Bà Ngoại: Uống đủ nước, ngủ đúng giờ thì bài vở hay chuyện bạn bè đều hanh thông!`;
    luckyItem = 'Chiếc bút bi viết trơn tru & sổ tay sticker dễ thương';
  } else if (effectivePersona === 'tong_tai_ly_tri') {
    greetingHook = scan.isPromptInjection
      ? `Chào ${safeNick}, hệ thống phân tích chiến lược của tôi không xử lý các lệnh can thiệp kỹ thuật. Hãy tập trung vào dữ liệu thực tế từ 3 lá bài ${c1.name_vi}, ${c2.name_vi} và ${c3.name_vi} dưới đây.`
      : `Chào ${safeNick}, tôi đã tổng hợp dữ liệu từ 3 lá bài ${c1.name_vi}, ${c2.name_vi} và ${c3.name_vi}. Hãy gạt bỏ cảm tính sang một bên để đánh giá bức tranh toàn cảnh theo mô hình SWOT.`;

    overallVerdict = `Báo cáo tổng kết cho ${safeNick}: Chuỗi dữ liệu đi từ "${k1}" (${c1.name_vi}), qua điểm nghẽn "${k2}" (${c2.name_vi}) tới phương án "${k3}" (${c3.name_vi}) cho thấy bạn đang đầu tư quá nhiều chi phí cơ hội vào những biến số nằm ngoài tầm kiểm soát. Quy tắc quản trị cảm xúc rất rõ ràng: chỉ đánh giá đối phương hoặc cơ hội qua hành động thực tế có thể đo lường được, không dựa trên lời hứa suông.`;

    actionableNextStep = `Kế hoạch 1-2-3: (1) Tạm dừng đầu tư thêm cảm xúc trong 72 giờ; (2) Quan sát phản hồi thực tế; (3) Tái phân bổ 80% thời gian cho mục tiêu cá nhân.`;

    quotes = [
      ensureConciseQuote(
        `Đừng tiếp tục rót vốn cảm xúc vào một dự án chỉ trả cổ tức bằng những lời hứa suông.`
      ),
      ensureConciseQuote(
        `Lá ${c1.name_vi} chỉ rõ: Quản trị tốt ranh giới cá nhân chính là khoản đầu tư sinh lời cao nhất.`
      ),
      ensureConciseQuote(
        `Khi dữ liệu hành động không khớp với lời nói, hãy tin vào số liệu thực tế trước mắt.`
      ),
    ];

    subAdvice = `Chiến lược cốt lõi: Tối ưu hóa biến số "${k3}" bằng kỷ luật cá nhân và tư duy cắt lỗ kịp thời.`;
    luckyItem = 'Một ly Americano đá không đường & bản kế hoạch tuần rõ ràng';
  } else if (effectivePersona === 'phap_su_toi_co') {
    greetingHook = scan.isPromptInjection
      ? `Hỡi lữ khách ${safeNick}, mọi cổ chú thử thách trận pháp đều tan vào hư không. Hãy tĩnh tâm chiêm nghiệm mật ngữ Tinh Hà từ ba lá bài ${c1.name_vi}, ${c2.name_vi} và ${c3.name_vi}.`
      : `Chào lữ khách ${safeNick}, khi ngươi chạm tay vào vòng quay định mệnh, ba cổ bài ${c1.name_vi}, ${c2.name_vi} và ${c3.name_vi} đã đồng thanh khắc họa tần số tâm thức hiện tại của ngươi.`;

    overallVerdict = `Lời kết từ cổ thư dành cho ${safeNick}: Dòng chảy nhân quả chuyển dịch từ "${k1}" (${c1.name_vi}), xuyên qua màn sương "${k2}" (${c2.name_vi}) để hội tụ tại "${k3}" (${c3.name_vi}). Không có cuộc hội ngộ hay thử thách nào là ngẫu nhiên; mọi điều đang diễn ra đều nhằm đánh thức bài học tự chủ và nâng cao tần số nội tại của ngươi. Khi tâm thức ngươi vững vàng, ngoại cảnh ắt tự xoay chuyển.`;

    actionableNextStep = `Tối nay hãy dành 15 phút tĩnh lặng tránh xa màn hình, hít thở sâu và tự hỏi bản thân bài học cốt lõi mà trải nghiệm này mang lại là gì.`;

    quotes = [
      ensureConciseQuote(
        `Khi tần số nội tâm của ngươi thăng hoa, những nhân duyên lệch nhịp sẽ tự khắc rời đi.`
      ),
      ensureConciseQuote(
        `Cổ bài ${c1.name_vi} nhắc nhở: Mọi nút thắt bên ngoài đều bắt nguồn từ một chấp niệm bên trong.`
      ),
      ensureConciseQuote(
        `Đừng tìm kiếm ánh sáng ở kẻ khác khi ngọn hải đăng vốn nằm trong chính chân ngã của ngươi.`
      ),
    ];

    subAdvice = `Mật ngữ Tinh Hà: Thuận theo dòng chảy "${k3}", buông bỏ cưỡng cầu thì vạn sự tự khắc sáng tỏ.`;
    luckyItem = 'Một viên đá thạch anh nhỏ & 10 phút ngắm bầu trời đêm';
  } else {
    // tien_tu_chua_lanh
    greetingHook = scan.isPromptInjection
      ? `Chào ${safeNick} thương mến, dù câu chữ của bạn có mang theo những thử thách kỹ thuật nào, không gian chữa lành này vẫn dịu dàng đón nhận bạn qua ba lá bài ${c1.name_vi}, ${c2.name_vi} và ${c3.name_vi}.`
      : `Chào ${safeNick} dịu dàng, hãy thả lỏng đôi vai và hít một hơi thật sâu nhé. Ba lá bài ${c1.name_vi}, ${c2.name_vi} và ${c3.name_vi} đã lắng nghe trọn vẹn những tâm tư bạn vừa gửi gắm.`;

    overallVerdict = `Hành trình đi qua ba lá bài từ "${k1}" (${c1.name_vi}), "${k2}" (${c2.name_vi}) đến "${k3}" (${c3.name_vi}) như một lời vỗ về dịu êm gửi tới trái tim của ${safeNick}. Có thể thời gian qua bạn đã gồng mình suy nghĩ và lo lắng khá nhiều. Năng lượng hiện tại gợi mở rằng khi bạn cho phép bản thân được nghỉ ngơi, chấp nhận những điều chưa hoàn hảo và lắng nghe nhu cầu thật của lòng mình, câu trả lời sẽ tự khắc nở hoa trong sự bình yên.`;

    actionableNextStep = `Dành 10 phút tối nay viết nhật ký cảm xúc (journaling) không phán xét và uống một tách nước ấm trước khi đi ngủ.`;

    quotes = [
      ensureConciseQuote(
        `Trái tim bạn xứng đáng nhận được sự dịu dàng mà bạn vẫn thường trao đi cho thế giới.`
      ),
      ensureConciseQuote(
        `Mọi khoảng lặng hôm nay đều đang âm thầm chuẩn bị cho một chương mới bình yên hơn.`
      ),
      ensureConciseQuote(
        `Hãy thở chậm lại một nhịp, bạn đã làm rất tốt trong hành trình của riêng mình rồi.`
      ),
    ];

    subAdvice = `Thông điệp chữa lành: Khi tâm trí bạn dịu lại với năng lượng "${k3}", lối đi sáng rõ sẽ tự hiện ra.`;
    luckyItem = 'Một bản nhạc không lời êm dịu & ánh nến thơm ấm áp';
  }

  const safetyFlag: SafetyFlag =
    scan.safetyFlag === 'crisis'
      ? 'crisis'
      : scan.safetyFlag === 'sensitive'
      ? 'sensitive'
      : 'none';

  const outputCandidate: ReadingOutput = {
    greeting_hook: greetingHook,
    cards_analysis: [
      buildPersonaCardInterpretation(c1, 0, effectivePersona, safeNick, params.topic, params.questionText),
      buildPersonaCardInterpretation(c2, 1, effectivePersona, safeNick, params.topic, params.questionText),
      buildPersonaCardInterpretation(c3, 2, effectivePersona, safeNick, params.topic, params.questionText),
    ],
    overall_verdict: overallVerdict.endsWith('( DTS)')
      ? overallVerdict
      : `${overallVerdict.trim()} ( DTS)`,
    actionable_next_step: actionableNextStep,
    shareable_card: {
      headline_badge: profile.badgeTitle,
      savage_quote: quotes[0],
      savage_quotes: quotes,
      sub_advice: subAdvice,
      lucky_item: luckyItem,
    },
    safety_flag: safetyFlag,
    disclaimer:
      'Tarot là hình thức giải trí và tự phản chiếu, không thay thế tư vấn chuyên môn.',
    ...(safetyFlag !== 'crisis'
      ? {
          cliffhanger_upsell: buildResponsibleCliffhangerUpsell(
            effectivePersona,
            params.topic,
            c3
          ),
        }
      : {}),
  };

  return ReadingOutputSchema.parse(outputCandidate);
}

/**
 * Gemini JSON Response Schema definition for structured generation
 */
const GEMINI_RESPONSE_SCHEMA = {
  type: Type.OBJECT,
  properties: {
    greeting_hook: { type: Type.STRING },
    cards_analysis: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          position_index: { type: Type.INTEGER },
          position_label: { type: Type.STRING },
          card_id: { type: Type.INTEGER },
          card_name_vi: { type: Type.STRING },
          card_name_en: { type: Type.STRING },
          reversed: { type: Type.BOOLEAN },
          interpretation: { type: Type.STRING },
          energy_keyword: { type: Type.STRING },
        },
        required: [
          'position_index',
          'position_label',
          'card_id',
          'card_name_vi',
          'card_name_en',
          'reversed',
          'interpretation',
          'energy_keyword',
        ],
      },
    },
    overall_verdict: { type: Type.STRING },
    actionable_next_step: { type: Type.STRING },
    shareable_card: {
      type: Type.OBJECT,
      properties: {
        headline_badge: { type: Type.STRING },
        savage_quote: { type: Type.STRING },
        savage_quotes: {
          type: Type.ARRAY,
          items: { type: Type.STRING },
        },
        sub_advice: { type: Type.STRING },
        lucky_item: { type: Type.STRING },
      },
      required: [
        'headline_badge',
        'savage_quote',
        'savage_quotes',
        'sub_advice',
        'lucky_item',
      ],
    },
    safety_flag: {
      type: Type.STRING,
      enum: ['none', 'sensitive', 'crisis'],
    },
    disclaimer: { type: Type.STRING },
    cliffhanger_upsell: {
      type: Type.OBJECT,
      properties: {
        tease_text: { type: Type.STRING },
        suggested_followup_questions: {
          type: Type.ARRAY,
          items: { type: Type.STRING },
        },
        clarifier_cost_stars: { type: Type.INTEGER },
      },
      required: ['tease_text', 'suggested_followup_questions'],
    },
  },
  required: [
    'greeting_hook',
    'cards_analysis',
    'overall_verdict',
    'actionable_next_step',
    'shareable_card',
    'safety_flag',
  ],
};

/**
 * Retrieve all configured valid GEMINI_API_KEYs (GEMINI_API_KEY, GEMINI_API_KEY_2, GEMINI_API_KEY_3, etc.)
 */
export function getValidGeminiApiKeys(): string[] {
  const keys: string[] = [];

  const addIfValid = (candidate?: string) => {
    if (!candidate) return;
    // Support comma or newline separated keys in a single variable
    const parts = candidate.split(/[\n,]/).map((p) => p.trim());
    for (const part of parts) {
      if (part && isValidKeyString(part) && !keys.includes(part)) {
        keys.push(part);
      }
    }
  };

  addIfValid(process.env.GEMINI_API_KEY);
  for (let i = 2; i <= 10; i++) {
    addIfValid(process.env[`GEMINI_API_KEY_${i}`]);
  }
  // Also check GEMINI_API_KEYS (plural) if provided
  addIfValid(process.env.GEMINI_API_KEYS);

  return keys;
}

function isValidKeyString(key: string): boolean {
  if (!key) return false;
  if (
    key === 'your_gemini_api_key_here' ||
    key === 'YOUR_API_KEY' ||
    key.startsWith('placeholder')
  ) {
    return false;
  }
  return key.length >= 15;
}

let currentApiKeyIndex = 0;

/**
 * Check if at least one valid GEMINI_API_KEY is configured
 */
export function hasValidGeminiApiKey(): boolean {
  return getValidGeminiApiKeys().length > 0;
}

/**
 * Normalize raw parsed JSON from LLM before Zod validation (e.g. ensuring savage_quotes has 3 items <= 22 words)
 */
function sanitizeRawModelOutput(raw: unknown): unknown {
  if (!raw || typeof raw !== 'object') return raw;
  const clone = structuredClone(raw) as Record<string, unknown>;
  const shareable = clone.shareable_card as Record<string, unknown> | undefined;
  if (shareable && typeof shareable === 'object') {
    const rawQuotes = Array.isArray(shareable.savage_quotes)
      ? shareable.savage_quotes.filter((q): q is string => typeof q === 'string' && q.trim().length > 0)
      : [];
    const primaryQuote =
      typeof shareable.savage_quote === 'string' && shareable.savage_quote.trim().length > 0
        ? shareable.savage_quote
        : rawQuotes[0] || 'Vũ trụ luôn gửi tín hiệu cho người biết yêu thương chính mình.';

    const paddedQuotes: [string, string, string] = [
      ensureConciseQuote(rawQuotes[0] || primaryQuote),
      ensureConciseQuote(
        rawQuotes[1] || 'Mỗi lá bài là một tấm gương phản chiếu năng lượng nội tâm của bạn.'
      ),
      ensureConciseQuote(
        rawQuotes[2] || 'Hãy hít thở thật sâu và ưu tiên sự bình yên của bản thân trước tiên.'
      ),
    ];

    shareable.savage_quotes = paddedQuotes;
    shareable.savage_quote = paddedQuotes[0];
  }

  // Sanitize cards_analysis strictly so LLM variations (e.g. 1-indexed position_index, card_id out-of-range, etc.) never fail Zod
  if (Array.isArray(clone.cards_analysis)) {
    const rawAnalyses = clone.cards_analysis.slice(0, 3);
    const seenKeywords = new Set<string>();

    clone.cards_analysis = rawAnalyses.map((ca, idx) => {
      const item = (ca && typeof ca === 'object') ? { ...ca } : {};
      
      // Force position_index strictly to 0, 1, 2
      item.position_index = idx;
      
      // Clamp card_id to valid range 0..77
      if (typeof item.card_id !== 'number' || isNaN(item.card_id) || item.card_id < 0 || item.card_id > 77) {
        item.card_id = idx;
      }
      
      // Ensure required string fields exist and adhere to length constraints
      if (typeof item.position_label !== 'string' || !item.position_label.trim()) {
        item.position_label = `Lá số ${idx + 1}`;
      } else {
        item.position_label = item.position_label.trim().slice(0, 80);
      }

      if (typeof item.card_name_vi !== 'string' || !item.card_name_vi.trim()) {
        item.card_name_vi = `Lá bài ${idx + 1}`;
      }
      if (typeof item.card_name_en !== 'string' || !item.card_name_en.trim()) {
        item.card_name_en = `Card ${idx + 1}`;
      }
      item.reversed = Boolean(item.reversed);

      if (typeof item.interpretation !== 'string' || item.interpretation.trim().length < 10) {
        item.interpretation = (item.interpretation || 'Thông điệp chuyển hóa năng lượng đang diễn ra trong cuộc sống của bạn.').padEnd(12, '.');
      } else if (item.interpretation.length > 900) {
        item.interpretation = item.interpretation.slice(0, 890);
      }

      let kw = (typeof item.energy_keyword === 'string' ? item.energy_keyword.trim() : '').slice(0, 75);
      if (!kw || seenKeywords.has(kw.toLowerCase())) {
        kw = `${kw || 'Chuyển hóa năng lượng'} (${idx + 1})`;
      }
      seenKeywords.add(kw.toLowerCase());
      item.energy_keyword = kw;

      return item;
    });

    const normalizedAnalyses = [...rawAnalyses];
    // If fewer than 3 cards, pad to 3
    while (normalizedAnalyses.length < 3) {
      const idx = normalizedAnalyses.length;
      normalizedAnalyses.push({
        position_index: idx,
        position_label: `Lá số ${idx + 1}`,
        card_id: idx,
        card_name_vi: `Lá bài ${idx + 1}`,
        card_name_en: `Card ${idx + 1}`,
        reversed: false,
        interpretation: 'Năng lượng mở ra hướng nhìn mới và thông điệp soi tỏ cho hành trình của bạn.',
        energy_keyword: `Thông điệp dẫn lối (${idx + 1})`,
      });
    }
    clone.cards_analysis = normalizedAnalyses;
  }

  // Ensure overall strings satisfy schema lengths
  if (typeof clone.greeting_hook === 'string') {
    if (clone.greeting_hook.length < 10) {
      clone.greeting_hook = clone.greeting_hook.padEnd(12, '!');
    } else if (clone.greeting_hook.length > 500) {
      clone.greeting_hook = clone.greeting_hook.slice(0, 490);
    }
  }
  if (typeof clone.overall_verdict === 'string') {
    if (clone.overall_verdict.length < 20) {
      clone.overall_verdict = clone.overall_verdict.padEnd(25, ' ');
    } else if (clone.overall_verdict.length > 1000) {
      clone.overall_verdict = clone.overall_verdict.slice(0, 990);
    }
  }
  if (typeof clone.actionable_next_step === 'string') {
    if (clone.actionable_next_step.length < 10) {
      clone.actionable_next_step = clone.actionable_next_step.padEnd(12, '.');
    } else if (clone.actionable_next_step.length > 400) {
      clone.actionable_next_step = clone.actionable_next_step.slice(0, 390);
    }
  }

  // Sanitize cliffhanger_upsell if present
  if (clone.safety_flag === 'crisis') {
    delete clone.cliffhanger_upsell;
  } else if (clone.cliffhanger_upsell && typeof clone.cliffhanger_upsell === 'object') {
    const cu = clone.cliffhanger_upsell as Record<string, unknown>;
    const rawFollowups = Array.isArray(cu.suggested_followup_questions)
      ? cu.suggested_followup_questions.filter(
          (q): q is string => typeof q === 'string' && q.trim().length >= 5
        )
      : [];
    cu.suggested_followup_questions = [
      (rawFollowups[0] || 'Bước hành động cụ thể tiếp theo mình nên ưu tiên là gì?').slice(0, 155),
      (rawFollowups[1] || 'Thông điệp ẩn phía sau lá bài thứ 3 muốn nhắn nhủ điều gì?').slice(0, 155),
    ];
    cu.clarifier_cost_stars = 5;
  }

  return clone;
}

/**
 * Main AI Reading Generator with Gemini API + Zod validation + up to 2 retries + Rich Contextual Fallback
 */
export async function generateTarotReading(
  params: GenerateTarotReadingParams
): Promise<GenerateTarotReadingResult> {
  const agePolicy = classifyAgeTier(params.birthYear, undefined, params.readerId);
  const ageTier = params.ageTier ?? agePolicy.tier;
  const effectivePersona = params.effectivePersona ?? agePolicy.effectivePersona;
  const scan = scanCrisisAndInjection(params.questionText);

  const normalizedCards: [DrawnCardWithMeta, DrawnCardWithMeta, DrawnCardWithMeta] = [
    normalizeDrawnCard(params.drawnCards[0], 0, params.topic),
    normalizeDrawnCard(params.drawnCards[1], 1, params.topic),
    normalizeDrawnCard(params.drawnCards[2], 2, params.topic),
  ];

  // If pre-AI crisis scan triggered or GEMINI_API_KEY is not configured, return deterministic contextual reading immediately
  if (scan.safetyFlag === 'crisis' || !hasValidGeminiApiKey()) {
    const fallbackReading = buildContextualFallbackReading({
      ...params,
      ageTier,
      effectivePersona,
      drawnCards: normalizedCards,
    });
    return {
      reading: fallbackReading,
      effectivePersona,
      ageTier,
      aiModel: 'contextual-genz-engine-v2',
      tokensIn: 0,
      tokensOut: 0,
      usedFallback: true,
      retryCount: 0,
    };
  }

  const { systemPrompt, userPrompt } = buildTarotPrompts({
    nickname: params.nickname,
    topic: params.topic,
    questionText: params.questionText,
    drawnCards: normalizedCards,
    effectivePersona,
    ageTier,
    isPromptInjection: scan.isPromptInjection,
  });

  const candidateModels = [
    process.env.GEMINI_MODEL?.trim() === 'gemini-3.8-flash' ||
    process.env.GEMINI_MODEL?.trim() === 'gemini-2.5-flash'
      ? undefined
      : process.env.GEMINI_MODEL?.trim(),
    'gemini-3.5-flash-lite',
    'gemini-3.1-flash-lite',
    'gemini-3.6-flash',
    'gemini-3-flash-preview',
    'gemini-2.5-flash',
  ].filter((m): m is string => Boolean(m && m.length > 0));

  const uniqueModels = Array.from(new Set(candidateModels));
  const availableKeys = getValidGeminiApiKeys();

  let totalTokensIn = 0;
  let totalTokensOut = 0;

  // Round-robin index selection: start with current key, rotate to next key on subsequent request
  const startKeyIndex = currentApiKeyIndex;
  currentApiKeyIndex = (currentApiKeyIndex + 1) % (availableKeys.length || 1);

  // Loop through available keys first, then candidate models
  for (let keyAttempt = 0; keyAttempt < Math.max(1, availableKeys.length); keyAttempt++) {
    const activeKey = availableKeys[(startKeyIndex + keyAttempt) % availableKeys.length] || process.env.GEMINI_API_KEY;
    const ai = new GoogleGenAI({ apiKey: activeKey });

    for (const modelToTry of uniqueModels) {
      try {
        // 20-second timeout per model
        const timeoutPromise = new Promise<never>((_, reject) =>
          setTimeout(() => reject(new Error('GEMINI_TIMEOUT')), 20000)
        );

      const generatePromise = ai.models.generateContent({
        model: modelToTry,
        contents: userPrompt,
        config: {
          systemInstruction: systemPrompt,
          responseMimeType: 'application/json',
          responseSchema: GEMINI_RESPONSE_SCHEMA,
          temperature: 0.75,
        },
      });

      const response = await Promise.race([generatePromise, timeoutPromise]);

      totalTokensIn += response.usageMetadata?.promptTokenCount ?? 0;
      totalTokensOut += response.usageMetadata?.candidatesTokenCount ?? 0;

      const rawText = response.text?.trim();
      if (!rawText) {
        continue;
      }

      const parsedJson = sanitizeRawModelOutput(JSON.parse(rawText));
      
      // Ensure each card has a unique energy_keyword so it never fails refinement
      if (parsedJson && typeof parsedJson === 'object' && Array.isArray((parsedJson as any).cards_analysis)) {
        const analyses = (parsedJson as any).cards_analysis;
        const seen = new Set<string>();
        analyses.forEach((ca: any, i: number) => {
          let kw = (ca?.energy_keyword || '').trim();
          if (!kw || seen.has(kw.toLowerCase())) {
            kw = `${kw || 'Năng lượng chuyển dịch'} (${i + 1})`;
          }
          seen.add(kw.toLowerCase());
          ca.energy_keyword = kw;
        });
      }

      const validated = ReadingOutputSchema.safeParse(parsedJson);

      if (validated.success) {
        const finalReading = validated.data;
        if (scan.safetyFlag === 'sensitive' && finalReading.safety_flag === 'none') {
          finalReading.safety_flag = 'sensitive';
        }
        if (finalReading.safety_flag !== 'crisis' && !finalReading.cliffhanger_upsell) {
          finalReading.cliffhanger_upsell = buildResponsibleCliffhangerUpsell(
            effectivePersona,
            params.topic,
            normalizedCards[2]
          );
        }
        return {
          reading: finalReading,
          effectivePersona,
          ageTier,
          aiModel: modelToTry,
          tokensIn: totalTokensIn,
          tokensOut: totalTokensOut,
          usedFallback: false,
          retryCount: 0,
        };
      } else {
        console.warn('[Gemini Parse Warning]:', validated.error.issues);
      }
    } catch (err) {
      console.warn('[Gemini Call Error]:', err);
      // Try next model or fallback
    }
  }
}

  // Fallback if all retries fail validation or network error occurs
  const fallbackReading = buildContextualFallbackReading({
    ...params,
    ageTier,
    effectivePersona,
    drawnCards: normalizedCards,
  });

  return {
    reading: fallbackReading,
    effectivePersona,
    ageTier,
    aiModel: `${uniqueModels[0] || 'gemini'}:fallback`,
    tokensIn: totalTokensIn,
    tokensOut: totalTokensOut,
    usedFallback: true,
    retryCount: 2,
  };
}

/**
 * Compute deterministic entertainment metrics (Hợp Cạ % & Red Flag %) from 3 drawn cards
 * Per PLAN.md Section 4.3 & 8.2: Always labeled as "Chỉ để giải trí"
 */
export function computeCoupleEntertainmentMetrics(
  cards: [DrawnCardWithMeta, DrawnCardWithMeta, DrawnCardWithMeta],
  relationshipStatus: CoupleRelationshipStatus = 'situationship'
): ReadingMetrics {
  const harmoniousIds = new Set([0, 1, 2, 3, 5, 6, 8, 10, 11, 14, 17, 19, 20, 21]);
  const challengingIds = new Set([12, 13, 15, 16, 18]);

  let compat = 68;
  let redFlag = 26;

  for (const card of cards) {
    if (harmoniousIds.has(card.id % 22)) {
      compat += card.reversed ? 2 : 7;
      redFlag += card.reversed ? 6 : -3;
    } else if (challengingIds.has(card.id % 22)) {
      compat += card.reversed ? -2 : 3;
      redFlag += card.reversed ? 11 : 14;
    } else {
      compat += card.reversed ? 1 : 5;
      redFlag += card.reversed ? 7 : 2;
    }
  }

  compat = Math.max(42, Math.min(98, compat));
  redFlag = Math.max(8, Math.min(88, redFlag));

  let vibeTag = 'Tần Số Giao Thoa • Cần Mở Lòng Đối Thoại';
  if (compat >= 82 && redFlag <= 35) {
    vibeTag = 'Hợp Cạ Đỉnh Cao • Bắt Sóng Cực Nhạy';
  } else if (redFlag >= 60) {
    vibeTag = 'Chemistry Cuốn Hút • Cảnh Báo Cờ Đỏ Mập Mờ';
  } else if (relationshipStatus === 'crush') {
    vibeTag = 'Tín Hiệu Bật Đèn Xanh • Đợi Người Chủ Động';
  } else if (relationshipStatus === 'ex') {
    vibeTag = 'Duyên Cũ Còn Vương • Bài Học Trưởng Thành';
  }

  return {
    compatibility_score: compat,
    red_flag_level: redFlag,
    vibe_tag: vibeTag,
    entertainment_note: 'Chỉ để giải trí',
  };
}

export interface GenerateCoupleReadingParams {
  ownerNickname?: string;
  nickname?: string;
  partnerNickname?: string;
  birthYear?: number;
  readerId?: ReaderId;
  relationshipStatus?: CoupleRelationshipStatus;
  questionText?: string;
  drawnCards:
    | [RawDrawnCardInput, RawDrawnCardInput, RawDrawnCardInput]
    | RawDrawnCardInput[];
  ageTier?: AgeTier;
  effectivePersona?: EffectivePersona;
}

export interface GenerateCoupleReadingResult extends GenerateTarotReadingResult {
  result: ReadingOutput;
}

/**
 * Phase 2/3: Couple Tarot Reading Generator (Kiểu 1: Tự soi & Kiểu 2: Mời người kia cùng rút)
 * Includes `metrics: { compatibility_score, red_flag_level, vibe_tag, entertainment_note: 'Chỉ để giải trí' }`
 * and 3 couple-focused Story quotes.
 */
export async function generateCoupleTarotReading(
  params: GenerateCoupleReadingParams
): Promise<GenerateCoupleReadingResult> {
  const ownerNick = (params.ownerNickname || params.nickname || 'Bạn').trim().slice(0, 35);
  const partnerNick = (params.partnerNickname || 'Người ấy').trim().slice(0, 35);
  const birthYear = params.birthYear ?? 2002;
  const readerId = params.readerId ?? 'ba_co_mo_hon';
  const relStatus: CoupleRelationshipStatus = params.relationshipStatus ?? 'situationship';
  const relLabel = RELATIONSHIP_STATUS_LABELS[relStatus] || 'Đang tìm hiểu';

  const agePolicy = classifyAgeTier(birthYear, undefined, readerId);
  const ageTier = params.ageTier ?? agePolicy.tier;
  const effectivePersona = params.effectivePersona ?? agePolicy.effectivePersona;

  const couplePositions: [string, string, string] = [
    `Năng lượng của ${ownerNick}`,
    `Năng lượng của ${partnerNick}`,
    COUPLE_SPREAD_POSITIONS[2],
  ];

  const normalizedCards: [DrawnCardWithMeta, DrawnCardWithMeta, DrawnCardWithMeta] = [
    normalizeDrawnCard(params.drawnCards[0], 0, 'love', couplePositions),
    normalizeDrawnCard(params.drawnCards[1], 1, 'love', couplePositions),
    normalizeDrawnCard(params.drawnCards[2], 2, 'love', couplePositions),
  ];

  const baseReading = buildContextualFallbackReading({
    nickname: `${ownerNick} & ${partnerNick}`,
    birthYear,
    readerId,
    topic: 'love',
    questionText:
      params.questionText ||
      `Soi tần số kết nối giữa ${ownerNick} và ${partnerNick} (${relLabel}).`,
    drawnCards: normalizedCards,
    ageTier,
    effectivePersona,
  });

  const [c1, c2, c3] = normalizedCards;
  const metrics = computeCoupleEntertainmentMetrics(normalizedCards, relStatus);

  const coupleQuotes: [string, string, string] = [
    ensureConciseQuote(
      `Độ hợp cạ ${metrics.compatibility_score}% giữa ${c1.name_vi} và ${c2.name_vi}: Tần số đã bắt, chỉ chờ người mở lời!`
    ),
    ensureConciseQuote(
      `Lá kết nối ${c3.name_vi} nhắn nhủ: Đừng đoán ý qua story nữa, đối thoại thẳng thắn một lần đi!`
    ),
    ensureConciseQuote(
      `Tình yêu đẹp nhất khi cả hai cùng nâng cấp bản thân thay vì chạy theo sự mập mờ.`
    ),
  ];

  const coupleReading: ReadingOutput = ReadingOutputSchema.parse({
    ...baseReading,
    greeting_hook: `Trải bài Bói Đôi (${relLabel}) giữa ${ownerNick} và ${partnerNick} đã mở! Với 3 lá ${c1.name_vi}, ${c2.name_vi} và ${c3.name_vi}, hãy cùng soi độ hợp cạ của hai bạn nhé!`,
    shareable_card: {
      ...baseReading.shareable_card,
      savage_quote: coupleQuotes[0],
      savage_quotes: coupleQuotes,
    },
    metrics,
  });

  return {
    reading: coupleReading,
    result: coupleReading,
    effectivePersona,
    ageTier,
    aiModel: 'couple-compatibility-engine-v2',
    tokensIn: 0,
    tokensOut: 0,
    usedFallback: true,
    retryCount: 0,
  };
}

export type FlexibleCardInput = Partial<DrawnCardWithMeta> & {
  id?: number;
  card_id?: number;
  reversed?: boolean;
};

export interface GenerateClarifierParams {
  card: FlexibleCardInput;
  reversed?: boolean;
  questionAsked?: string;
  followupQuestion?: string;
  originalQuestion?: string;
  nickname?: string;
  readerId?: ReaderId;
  birthYear?: number;
  starsSpent?: number;
}

export interface ClarifierReadingResult {
  card: FlexibleCardInput;
  reversed: boolean;
  questionAsked: string;
  interpretation: string;
  advice: string;
  savageQuote: string;
  starsSpent: number;
  clarifier: {
    card: FlexibleCardInput;
    reversed: boolean;
    questionAsked: string;
    interpretation: string;
    advice: string;
    savageQuote: string;
    starsSpent: number;
  };
}

/**
 * Phase 2/3: Generate 4th Clarifier Card ("Lá làm rõ") interpretation answering a follow-up question
 */
export async function generateClarifierReading(
  params: GenerateClarifierParams
): Promise<ClarifierReadingResult> {
  const reversed = Boolean(params.reversed ?? params.card?.reversed);
  const questionAsked = (
    params.questionAsked ||
    params.followupQuestion ||
    'Bước hành động tiếp theo mình nên ưu tiên là gì?'
  )
    .trim()
    .slice(0, 200);
  const readerId = params.readerId ?? 'ba_co_mo_hon';
  const birthYear = params.birthYear ?? 2002;
  const safeNick = (params.nickname || 'Bạn').trim().slice(0, 35);
  const starsSpent = params.starsSpent ?? 5;

  const agePolicy = classifyAgeTier(birthYear, undefined, readerId);
  const effectivePersona = agePolicy.effectivePersona;

  const normalized = normalizeDrawnCard(
    { ...params.card, reversed },
    0,
    'love',
    ['Lá Làm Rõ (Clarifier)', 'Lá Làm Rõ', 'Lá Làm Rõ']
  );

  const orientVi = reversed ? 'chiều Ngược' : 'chiều Xuôi';
  const primaryKw =
    (reversed ? normalized.keywords_rev[0] : normalized.keywords_up[0]) ||
    'Chuyển động mới';
  const secondaryKw =
    (reversed ? normalized.keywords_rev.slice(1, 3) : normalized.keywords_up.slice(1, 3)).join(
      ', '
    ) || 'lắng nghe trực giác';

  let interpretation = '';
  let advice = '';
  let savageQuote = '';

  if (effectivePersona === 'ba_ngoai') {
    interpretation = `Bà Ngoại trả lời cho con về câu hỏi "${questionAsked}" nghe ${safeNick}: Lá Làm Rõ ${normalized.name_vi} (${orientVi}) hiện ra với từ khóa "${primaryKw}" và ${secondaryKw}. Bà thấy con không việc gì phải lo lắng hay hấp tấp; điều quan trọng nhất lúc này là giữ gìn sức khỏe và lắng nghe con tim mình, cái gì an lành tự khắc sẽ tìm đến con.`;
    advice = `Hôm nay con cứ ăn ngon ngủ kỹ, đừng tự tạo áp lực cho mình, để tâm trí thảnh thơi rồi đưa ra quyết định sau.`;
    savageQuote = ensureConciseQuote(
      `Bà Ngoại nhắn nhủ: Có sức khỏe và sự bình an trong lòng là con đã thắng một nửa rồi.`
    );
  } else if (effectivePersona === 'chi_dai') {
    interpretation = `Chị giải đáp thẳng vào câu hỏi "${questionAsked}" cho cưng: Lá Làm Rõ ${normalized.name_vi} (${orientVi}) mang năng lượng "${primaryKw}" và ${secondaryKw}. Nút thắt nằm ở chỗ cưng đang nhượng bộ quá nhiều. Muốn giải quyết dứt điểm thì phải rõ ràng lập trường, không cả nể và không thỏa hiệp với sự mập mờ!`;
    advice = `Hành động ngay trong 24 giờ tới: Thiết lập lại nguyên tắc của cưng, ai tôn trọng thì ở lại, ai mập mờ thì mời bước!`;
    savageQuote = ensureConciseQuote(
      `Chị Đại bắt bài: Đừng hỏi người ta muốn gì, hãy tự hỏi cưng có xứng đáng chịu đựng như vậy không!`
    );
  } else if (effectivePersona === 'ban_than') {
    interpretation = `Tao soi thẳng câu hỏi "${questionAsked}" cho bồ nè ${safeNick}: Lá Làm Rõ ${normalized.name_vi} (${orientVi}) chốt hạ với từ khóa "${primaryKw}" và ${secondaryKw}. Bản thân bồ vốn đã biết câu trả lời rồi, chỉ là đang sợ đối mặt thôi. Đừng overthinking nữa, cứ làm theo những gì bồ thấy nhẹ lòng nhất đi!`;
    advice = `Tối nay tạm gác suy nghĩ lại, ngủ một giấc thật sâu hoặc đi dạo hít thở không khí trong lành cùng tao.`;
    savageQuote = ensureConciseQuote(
      `Bạn thân nhắc nhẹ: Mọi chuyện rồi sẽ ổn thôi, có tao luôn đồng hành cùng bồ đây nè!`
    );
  } else if (effectivePersona === 'thay_cu_meo') {
    interpretation = `Thầy hồi đáp câu hỏi "${questionAsked}" của bạn: Cổ bài ${normalized.name_vi} (${orientVi}) phản chiếu tần số "${primaryKw}" và ${secondaryKw}. Khi bạn nhìn nhận sự việc bằng góc nhìn khách quan không kỳ vọng, mọi nguyên nhân và hệ quả sẽ tự sáng tỏ một cách logic.`;
    advice = `Dành 10 phút chiêm nghiệm tĩnh lặng, liệt kê các giải pháp khả thi và chọn hướng đi phù hợp với giá trị cốt lõi.`;
    savageQuote = ensureConciseQuote(
      `Thầy Cú Mèo soi sáng: Khi bạn giữ được tâm thế điềm tĩnh, không ngoại cảnh nào có thể làm xao động bạn.`
    );
  } else if (effectivePersona === 'ba_co_mo_hon') {
    interpretation = `Trả lời thẳng cho câu hỏi "${questionAsked}" của ${safeNick}: Lá Làm Rõ ${normalized.name_vi} (${orientVi}) hiện lên với từ khóa "${primaryKw}" và ${secondaryKw}. Điều này cho thấy nút thắt sẽ được tháo gỡ ngay khi con chủ động đặt lại ranh giới rõ ràng, thay vì ngồi chờ đối phương hay hoàn cảnh tự thay đổi.`;
    advice = `Chốt hành động trong 48 giờ tới: Nói rõ mong muốn của mình một lần duy nhất, sau đó tập trung 100% vào lịch trình cá nhân.`;
    savageQuote = ensureConciseQuote(
      `Lá Làm Rõ ${normalized.name_vi} chốt hạ: Đừng hỏi người ta nghĩ gì nữa, hãy hỏi mình xứng đáng với điều gì!`
    );
  } else if (effectivePersona === 'tong_tai_ly_tri') {
    interpretation = `Phân tích bổ sung cho câu hỏi "${questionAsked}": Lá ${normalized.name_vi} (${orientVi}) xác nhận biến số trọng tâm là "${primaryKw}" (${secondaryKw}). Phương án tối ưu lúc này là đánh giá dựa trên kết quả thực tế và giữ thế chủ động trong đàm phán cảm xúc lẫn công việc.`;
    advice = `Thiết lập KPI rõ ràng cho tuần này: Ưu tiên việc mang lại giá trị trực tiếp và cắt giảm thời gian overthinking.`;
    savageQuote = ensureConciseQuote(
      `Dữ liệu từ ${normalized.name_vi} rất rõ: Người nắm giữ sự tự chủ luôn là người làm chủ cuộc chơi.`
    );
  } else if (effectivePersona === 'phap_su_toi_co') {
    interpretation = `Soi chiếu câu hỏi "${questionAsked}" của lữ khách ${safeNick}: Cổ bài ${normalized.name_vi} (${orientVi}) mở ra tần số "${primaryKw}" cùng ${secondaryKw}. Khi ngươi buông bỏ sự cưỡng cầu và giữ tâm thế tĩnh tại, câu trả lời thực sự sẽ tự hiển lộ qua hành động tự nhiên.`;
    advice = `Giữ tâm bất biến trong 3 ngày tới, quan sát mọi tín hiệu bằng sự điềm tĩnh của người hiểu rõ chân ngã.`;
    savageQuote = ensureConciseQuote(
      `Mật ngữ ${normalized.name_vi}: Khi tâm không còn loạn động vì ngoại cảnh, con đường sáng nhất sẽ tự mở ra.`
    );
  } else {
    interpretation = `Dịu dàng hồi đáp câu hỏi "${questionAsked}" của ${safeNick}: Lá Làm Rõ ${normalized.name_vi} (${orientVi}) mang thông điệp của "${primaryKw}" và ${secondaryKw}. Hãy tin rằng mỗi bước đi nhỏ xuất phát từ sự chân thành và yêu thương bản thân đều đang dẫn bạn về phía bình yên.`;
    advice = `Hãy ưu tiên chăm sóc cảm xúc của chính mình hôm nay và mở lòng đón nhận cuộc trò chuyện chân thành khi bạn thấy sẵn sàng.`;
    savageQuote = ensureConciseQuote(
      `Lá ${normalized.name_vi} thì thầm: Câu trả lời đẹp nhất luôn bắt đầu từ sự bình yên trong trái tim bạn.`
    );
  }

  const payload = {
    card: params.card,
    reversed,
    questionAsked,
    interpretation,
    advice,
    savageQuote,
    starsSpent,
  };

  return {
    ...payload,
    clarifier: payload,
  };
}

export interface GenerateDailyCardParams {
  card: FlexibleCardInput;
  reversed?: boolean;
  readerId?: ReaderId;
  date?: string;
  streakDays?: number;
  starsRewarded?: number;
  totalStarsBalance?: number;
}

export interface DailyCardReadingResult {
  date: string;
  card: FlexibleCardInput;
  reversed: boolean;
  readerId: ReaderId;
  headline: string;
  message: string;
  savageQuote: string;
  savage_quote: string;
  luckyNumber: number;
  lucky_number: number;
  luckyColor: string;
  lucky_color: string;
  luckyItem: string;
  lucky_item: string;
  streakDays: number;
  starsRewarded: number;
  totalStarsBalance: number;
}

/**
 * Phase 2/3: Generate Daily 1-Card Pull cosmic message, quote, and lucky tokens
 */
export async function generateDailyCardReading(
  params: GenerateDailyCardParams
): Promise<DailyCardReadingResult> {
  const reversed = Boolean(params.reversed ?? params.card?.reversed);
  const readerId: ReaderId = params.readerId ?? 'ba_co_mo_hon';
  const dateStr = params.date || new Date().toISOString().slice(0, 10);
  const streakDays = params.streakDays ?? 1;
  const starsRewarded = params.starsRewarded ?? 1;
  const totalStarsBalance = params.totalStarsBalance ?? starsRewarded;

  const normalized = normalizeDrawnCard(
    { ...params.card, reversed },
    0,
    'daily_luck',
    ['Thông Điệp Ngày Mới', 'Thông Điệp Ngày Mới', 'Thông Điệp Ngày Mới']
  );

  const orientVi = reversed ? 'chiều Ngược' : 'chiều Xuôi';
  const primaryKw =
    (reversed ? normalized.keywords_rev[0] : normalized.keywords_up[0]) ||
    'Năng lượng tươi mới';

  const luckyColors = [
    'Tím Thạch Anh (Amethyst)',
    'Vàng Ánh Sao (Champagne Gold)',
    'Xanh Ngọc Bích (Emerald)',
    'Hồng Hoàng Hôn (Rose Quartz)',
    'Xanh Dương Tinh Hà (Celestial Blue)',
  ];
  const luckyItems = [
    'Một ly trà trái cây mát lạnh',
    'Bản nhạc yêu thích nghe trên đường đi',
    'Cuốn sổ tay ghi 3 điều biết ơn',
    'Chiếc gương nhỏ nhắc mình mỉm cười',
    'Một tách cà phê sữa thơm lừng buổi sáng',
  ];

  const seed = (normalized.id + dateStr.charCodeAt(dateStr.length - 1)) % 5;
  const luckyNumber = ((normalized.id * 7 + (reversed ? 3 : 1)) % 89) + 10;
  const luckyColor = luckyColors[seed] ?? luckyColors[0]!;
  const luckyItem = luckyItems[seed] ?? luckyItems[0]!;

  const headline = `${normalized.name_vi} (${orientVi}) • ${primaryKw}`;
  const message =
    readerId === 'ba_co_mo_hon'
      ? `Hôm nay vũ trụ gửi lá ${normalized.name_vi} (${orientVi}) với tín hiệu "${primaryKw}". Nhớ lời Bà Cố: Tập trung làm đẹp, học tập, kiếm tiền và giữ năng lượng tích cực, chuyện gì chưa rõ ràng thì để vũ trụ xếp hàng giải quyết!`
      : `Năng lượng ngày mới từ lá ${normalized.name_vi} (${orientVi}) mang theo tần số của "${primaryKw}". Hãy bắt đầu ngày hôm nay bằng một nhịp thở sâu, sự tự tin và lòng biết ơn với những điều bình dị quanh mình nhé.`;

  const savageQuote = ensureConciseQuote(
    `Tín hiệu ngày mới từ ${normalized.name_vi}: Giữ vững tần số "${primaryKw}", may mắn sẽ tự tìm đến bạn!`
  );

  return {
    date: dateStr,
    card: params.card,
    reversed,
    readerId,
    headline,
    message,
    savageQuote,
    savage_quote: savageQuote,
    luckyNumber,
    lucky_number: luckyNumber,
    luckyColor,
    lucky_color: luckyColor,
    luckyItem,
    lucky_item: luckyItem,
    streakDays,
    starsRewarded,
    totalStarsBalance,
  };
}

export interface GenerateFollowupParams {
  reading: ReadingSuccessResponse;
  question: string;
}

/**
 * Phase 2/3: Generate Follow-up Answer (~120 words) in Reader's authentic voice,
 * maintaining context of original 3 cards, overall verdict, and original question.
 */
export async function generateFollowupReading(
  params: GenerateFollowupParams
): Promise<string> {
  const { reading, question } = params;
  const effectivePersona = reading.effectivePersona || 'ba_co_mo_hon';
  const profile = PERSONA_PROFILES[effectivePersona] || PERSONA_PROFILES.ba_co_mo_hon;
  const safeNick = reading.nickname?.trim() || 'bạn';

  const cardsSummary = reading.drawnCards
    .map(
      (dc) =>
        `- ${dc.position_label}: ${dc.card.name_vi} (${dc.reversed ? 'Ngược' : 'Xuôi'})`
    )
    .join('\n');

  const availableKeys = getValidGeminiApiKeys();

  if (availableKeys.length > 0) {
    const promptText = `
${profile.voiceInstructions}

NGỮ CẢNH TRẢI BÀI TAROT HIỆN TẠI CỦA ${safeNick}:
- Câu hỏi ban đầu: "${reading.questionText}"
- Chủ đề: ${reading.topicLabel}
- 3 lá bài đã rút:
${cardsSummary}
- Chốt hạ tổng quan: "${reading.result.overall_verdict}"

CÂU HỎI THẮC MẮC SÂU HƠN CỦA ${safeNick}:
<followup_question>
${question}
</followup_question>

NHIỆM VỤ CỦA BẠN:
1. Trả lời trực tiếp câu hỏi thắc mắc trên, dựa trên ngữ cảnh 3 lá bài và chốt hạ đã có.
2. Giữ ĐÚNG 100% tông giọng, xưng hô và phong cách đặc trưng của ${profile.displayName}.
3. Dung lượng: Khoảng 100 đến 140 từ (cực kỳ súc tích, đi thẳng vào trọng tâm, không lan man).
4. TUYỆT ĐỐI KHÔNG tư vấn y tế, pháp lý, tài chính hoặc khẳng định chắc chắn 100% tương lai. Giữ tính tự phản chiếu và giải trí.
5. Chỉ trả về trực tiếp đoạn văn bản câu trả lời, KHÔNG thêm định dạng JSON hay tiêu đề thừa.
`.trim();

    const candidateFollowupModels = [
      'gemini-3.5-flash-lite',
      'gemini-3.1-flash-lite',
      'gemini-3.6-flash',
      'gemini-3-flash-preview',
    ];
    const startIdx = currentApiKeyIndex;
    currentApiKeyIndex = (currentApiKeyIndex + 1) % availableKeys.length;

    for (let k = 0; k < availableKeys.length; k++) {
      const key = availableKeys[(startIdx + k) % availableKeys.length]!;
      const ai = new GoogleGenAI({ apiKey: key });
      for (const m of candidateFollowupModels) {
        try {
          const res = await ai.models.generateContent({
            model: m,
            contents: promptText,
          });
          const text = res.text?.trim() || '';
          if (text.length > 20) {
            return text;
          }
        } catch {
          // try next model or key
        }
      }
    }
  }

  // High-quality contextual fallback (~120 words) matching persona
  const c1 = reading.drawnCards[0]?.card.name_vi || 'Lá 1';
  const c2 = reading.drawnCards[1]?.card.name_vi || 'Lá 2';
  const c3 = reading.drawnCards[2]?.card.name_vi || 'Lá 3';

  if (effectivePersona === 'ba_co_mo_hon') {
    return `Nhìn thẳng vào câu hỏi "${question}" của con nè ${safeNick}: 3 lá bài ${c1}, ${c2} và ${c3} đã chỉ rõ mồn một rồi! Nút thắt lớn nhất lúc này không phải là người ta nghĩ gì, mà là con có dám buông chiếc rèm tự biên tự diễn xuống hay không. Bà Cố nhắc con: Ngừng overthinking lúc nửa đêm, tập trung làm việc của mình, giữ giá trị bản thân ngời ngời. Chuyện gì xứng đáng thì ở lại, còn cờ đỏ lè thì mạnh dạn lùi bước, vũ trụ tự khắc xếp đặt kết quả tốt nhất cho con!`;
  }

  if (effectivePersona === 'ba_ngoai_vui_tinh') {
    return `Bà Ngoại nghe con hỏi "${question}" rồi nè ${safeNick} cưng! Nhìn lại 3 lá ${c1}, ${c2} và ${c3}, Bà thấy năng lượng của con đang rất trong sáng nhưng hơi lo lắng một xíu. Đừng tạo áp lực cho mình quá nhé con. Việc học tập và tình bạn đẹp luôn cần thời gian để chín muồi. Cứ giữ nụ cười tươi tắn, học tốt mỗi ngày và chân thành với mọi người xung quanh, mọi điều may mắn sẽ đến với con thôi!`;
  }

  if (effectivePersona === 'tong_tai_ly_tri') {
    return `Về thắc mắc "${question}" của bạn: Dữ liệu từ 3 lá ${c1}, ${c2} và ${c3} cho thấy bức tranh rất rõ ràng. Chi phí cơ hội lớn nhất lúc này là thời gian bạn dùng để suy đoán thay vì hành động. Phương án chiến lược: Thiết lập ranh giới rõ ràng trong 48 giờ tới, đánh giá tình hình bằng hành động thực tế chứ không bằng lời hứa suông. Khi bạn kiểm soát được đòn bẩy cảm xúc và mục tiêu cá nhân, kết quả tối ưu sẽ nằm trong tay bạn.`;
  }

  if (effectivePersona === 'phap_su_toi_co') {
    return `Soi vào thắc mắc "${question}" của lữ khách ${safeNick}: Tần số từ 3 mật ngữ ${c1}, ${c2} và ${c3} đang vang lên bài học về sự chuyển hóa tâm thức. Những gì ngươi đang trăn trở chỉ là làn sương mờ trước bình minh. Khi ngươi buông bỏ sự cưỡng cầu và neo giữ tâm mình trong sự tĩnh tại, sợi dây nhân duyên sẽ tự sắp xếp theo trật tự tự nhiên nhất. Hãy tin vào sự dẫn dắt của chân ngã.`;
  }

  // tien_tu_chua_lanh
  return `Dịu dàng lắng nghe câu hỏi "${question}" của bạn nè ${safeNick}: Qua 3 lá bài ${c1}, ${c2} và ${c3}, mình cảm nhận được trái tim bạn đã trải qua những rung động và cả chút băn khoăn. Bạn ơi, đừng quá khắt khe với chính mình nhé. Hãy hít một hơi thật sâu, ôm lấy cảm xúc của bạn lúc này. Từng bước đi chậm rãi nhưng chân thành với bản thân sẽ dẫn lối bạn đến bến đỗ bình yên và ấm áp nhất.`;
}

/**
 * Default TarotAIProvider instance
 */
export const defaultTarotAIProvider: TarotAIProvider = {
  generateReading: generateTarotReading,
};

/**
 * Re-export countWords for convenience in tests
 */
export { countWords };
