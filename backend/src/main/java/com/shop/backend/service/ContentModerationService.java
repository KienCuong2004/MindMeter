package com.shop.backend.service;

import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import java.util.*;
import java.util.regex.Pattern;

/**
 * Service để kiểm tra và lọc nội dung comment không phù hợp
 * Phát hiện: thô tục, tục tĩu, phân biệt chủng tộc
 */
@Slf4j
@Service
public class ContentModerationService {

    // Danh sách từ ngữ thô tục và tục tĩu (tiếng Việt và tiếng Anh) - bao gồm cả có dấu và không dấu
    private static final Set<String> PROFANITY_WORDS = new HashSet<>(Arrays.asList(
        // Buồi và variants
        "buồi", "buoi", "dau buoi", "daubuoi", "caidaubuoi", "nhucaidaubuoi", 
        "dau boi", "bòi", "dauboi", "caidauboi", "đầu bòy", "đầu bùi", 
        "dau boy", "dauboy", "caidauboy", "b`",
        
        // Cặc và variants
        "cặc", "cak", "kak", "kac", "cac", "concak", "nungcak", "bucak", 
        "caiconcac", "caiconcak", "cu", "cặk", "dái", "giái", "zái", "kiu",
        
        // Cứt và variants
        "cứt", "cuccut", "cutcut", "cứk", "cuk", "cười ỉa", "cười ẻ",
        
        // Đéo và variants
        "đéo", "đếch", "đếk", "dek", "đết", "đệt", "đách", "dech", "đ'", 
        "deo", "d'", "đel", "đél", "del", "dell ngửi", "dell ngui", "dell chịu", 
        "dell chiu", "dell hiểu", "dell hieu", "dellhieukieugi", "dell nói", 
        "dell noi", "dellnoinhieu", "dell biết", "dell biet", "dell nghe", 
        "dell ăn", "dell an", "dell được", "dell duoc", "dell làm", "dell lam", 
        "dell đi", "dell di", "dell chạy", "dell chay", "deohieukieugi",
        
        // Địt và variants
        "địt", "đm", "dm", "đmm", "dmm", "đmmm", "dmmm", "đmmmm", "dmmmm", 
        "đmmmmm", "dmmmmm", "đcm", "dcm", "đcmm", "dcmm", "đcmmm", "dcmmm", 
        "đcmmmm", "dcmmmm", "đệch", "đệt", "dit", "dis", "diz", "đjt", "djt", 
        "địt mẹ", "địt mịe", "địt má", "địt mía", "địt ba", "địt bà", "địt cha", 
        "địt con", "địt bố", "địt cụ", "dis me", "disme", "dismje", "dismia", 
        "dis mia", "dis mie", "đis mịa", "đis mịe", "ditmemayconcho", "ditmemay", 
        "ditmethangoccho", "ditmeconcho", "dmconcho", "dmcs", "ditmecondi", "ditmecondicho",
        
        // Đù (đủ) má và variants
        "đụ", "đụ mẹ", "đụ mịa", "đụ mịe", "đụ má", "đụ cha", "đụ bà", "đú cha", 
        "đú con mẹ", "đú má", "đú mẹ", "đù cha", "đù má", "đù mẹ", "đù mịe", 
        "đù mịa", "đủ cha", "đủ má", "đủ mẹ", "đủ mé", "đủ mía", "đủ mịa", 
        "đủ mịe", "đủ mie", "đủ mia", "đìu", "đờ mờ", "đê mờ", "đờ ma ma", 
        "đờ mama", "đê mama", "đề mama", "đê ma ma", "đề ma ma", "dou", "doma", 
        "duoma", "dou má", "duo má", "dou ma", "đou má", "đìu má", "á đù", "á đìu", 
        "đậu mẹ", "đậu má",
        
        // Đĩ và variants
        "đĩ", "di~", "đuỹ", "điếm", "cđĩ", "cdi~", "đilol", "điloz", "đilon", 
        "diloz", "dilol", "dilon", "condi", "condi~", "dime", "di me", "dimemay", 
        "condime", "condimay", "condimemay", "con di cho", "con di cho'", "condicho", 
        "bitch", "biz", "bít chi", "con bích", "con bic", "con bíc", "con bít", "phò", "4`",
        
        // Lồn và variants
        "lồn", "l`", "loz", "lìn", "nulo", "ml", "matlon", "cailon", "matlol", 
        "matloz", "thml", "thangmatlon", "thangml", "đỗn lì", "tml", "thml", "diml", 
        "dml", "hãm", "xàm lol", "xam lol", "xạo lol", "xao lol", "con lol", 
        "ăn lol", "an lol", "mát lol", "mat lol", "cái lol", "cai lol", "lòi lol", 
        "loi lol", "ham lol", "củ lol", "cu lol", "ngu lol", "tuổi lol", "tuoi lol", 
        "mõm lol", "mồm lol", "mom lol", "như lol", "nhu lol", "nứng lol", "nung lol", 
        "nug lol", "nuglol", "rảnh lol", "ranh lol", "đách lol", "dach lol", "mu lol", 
        "banh lol", "tét lol", "tet lol", "vạch lol", "vach lol", "cào lol", "cao lol", 
        "tung lol", "mặt lol", "mát lol", "mat lol", "xàm lon", "xam lon", "xạo lon", 
        "xao lon", "con lon", "ăn lon", "an lon", "mát lon", "mat lon", "cái lon", 
        "cai lon", "lòi lon", "loi lon", "ham lon", "củ lon", "cu lon", "ngu lon", 
        "tuổi lon", "tuoi lon", "mõm lon", "mồm lon", "mom lon", "như lon", "nhu lon", 
        "nứng lon", "nung lon", "nug lon", "nuglon", "rảnh lon", "ranh lon", "đách lon", 
        "dach lon", "mu lon", "banh lon", "tét lon", "tet lon", "vạch lon", "vach lon", 
        "cào lon", "cao lon", "tung lon", "mặt lon", "mát lon", "mat lon", "cái lờ", 
        "cl", "clgt", "cờ lờ gờ tờ", "cái lề gì thốn", "đốn cửa lòng", "sml", 
        "sapmatlol", "sapmatlon", "sapmatloz", "sấp mặt", "sap mat", "vlon", "vloz", 
        "vlol", "vailon", "vai lon", "vai lol", "vailol", "nốn lừng", "vcl", "vl", "vleu",
        
        // Sexual related
        "chịch", "chich", "vãi", "v~", "nứng", "nug", "đút đít", "chổng mông", 
        "banh háng", "xéo háng", "xhct", "xephinh", "la liếm", "đổ vỏ", "xoạc", 
        "xoac", "chich choac", "húp sò", "fuck", "fck", "bỏ bú", "buscu",
        
        // English profanity - Common swear words
        "fuck", "fck", "fuk", "fuc", "f*ck", "f**k", "f***", "fucking", "fcking", 
        "fuking", "fucked", "fckd", "fucker", "fckr", "motherfucker", "mtherfcker", 
        "motherfckr", "mthrfckr", "mf", "mofo", "motherf*cker",
        
        // English profanity - Sexual terms
        "shit", "sht", "sh*t", "sh**t", "shitting", "shitted", "bullshit", "bs", 
        "ass", "as", "asshole", "ashole", "a**hole", "arse", "arsehole", "arseh*le",
        "bitch", "bch", "b*tch", "b**ch", "bitches", "bches", "biatch", "biyatch",
        "bastard", "bstrd", "b*stard", "b**tard", "bastards", "bstrds",
        "cunt", "cnt", "c*nt", "c**t", "cunts", "cnts",
        "dick", "dck", "d*ck", "d**k", "dicks", "dcks", "dickhead", "dckhead",
        "cock", "ck", "c*ck", "c**k", "cocks", "cks", "cocksucker", "cksucker",
        "pussy", "pssy", "p*ssy", "p**sy", "pussies", "pssies",
        "whore", "whre", "w*ore", "w**re", "whores", "whres", "ho", "hoe",
        "slut", "slt", "s*ut", "s**t", "sluts", "slts",
        "porn", "prn", "p*rn", "pornography", "prnography",
        "sex", "sx", "s*x", "sexual", "sxual",
        "masturbate", "msturbate", "masturbation", "msturbation",
        "orgasm", "rgasm", "orgasms", "rgasms",
        "penis", "pnis", "p*nis", "penises", "pnis",
        "vagina", "vgina", "v*gina", "vaginas", "vginas",
        "breast", "brst", "breasts", "brsts", "boob", "bb", "boobs", "bbs",
        "nipple", "npple", "nipples", "npples",
        
        // English profanity - Insults and derogatory terms
        "damn", "dmn", "d*mn", "d**n", "damned", "dmned", "damnit", "dmnit",
        "hell", "hll", "h*ll", "h**l", "hells", "hlls",
        "stupid", "stpid", "st*pid", "stupids", "stpids",
        "idiot", "idot", "id*ot", "idiots", "idots",
        "moron", "mron", "m*ron", "morons", "mrons",
        "retard", "rtard", "r*tard", "retards", "rtards", "retarded", "rtarded",
        "nigger", "ngger", "n*gger", "n**ger", "nigga", "ngga", "n*gga", "n**ga",
        "niggas", "nggas", "niggers", "nggers",
        "faggot", "fggot", "f*ggot", "f**got", "faggots", "fggots", "fag", "fg",
        "gay", "gy", "g*y", "gays", "gys",
        "lesbian", "lsbian", "lesbians", "lsbians",
        "homo", "hm", "homos", "hms", "homosexual", "hmsxual",
        "tranny", "trnny", "trannies", "trnnies", "transgender", "trnsgender",
        
        // English profanity - General offensive terms
        "piss", "pss", "p*ss", "pissed", "pssed", "pissing", "pssing",
        "piss off", "pss off", "pissed off", "pssed off",
        "crap", "crp", "c*ap", "craps", "crps",
        "pissed", "pssed", "pissed off", "pssed off",
        "screw", "scrw", "screw you", "scrw you", "screwed", "scrwed",
        "suck", "sck", "s*ck", "sucks", "scks", "sucker", "scker",
        "suck my", "sck my", "suck it", "sck it",
        "screw you", "scrw you", "fuck you", "fck you", "fuk you",
        "go to hell", "gt hell", "go to h*ll",
        "kill yourself", "kys", "kill urself", "k urself",
        "die", "dy", "d*e", "dies", "dys", "dying", "dyng", "death", "dth",
        
        // English profanity - Abbreviations and leetspeak
        "wtf", "wth", "omfg", "omfg", "lmao", "lmfao", "rofl", "stfu", "gtfo",
        "kys", "fml", "smh", "tbh", "idgaf", "idc", "stfu", "gtfo", "foh",
        "af", "asf", "asfk", "tbh", "nvm", "idk", "idgaf", "idc",
        
        // Various humiliation
        "ngu", "óc chó", "occho", "lao cho", "láo chó", "bố láo", "chó má", 
        "cờ hó", "sảng", "thằng chó", "thang cho'", "thang cho", "chó điên", 
        "thằng điên", "thang dien", "đồ điên", "sủa bậy", "sủa tiếp", "sủa đi", "sủa càn",
        
        // Mẹ cha và variants
        "mẹ bà", "mẹ cha mày", "me cha may", "mẹ cha anh", "mẹ cha nhà anh", 
        "mẹ cha nhà mày", "me cha nha may", "mả cha mày", "mả cha nhà mày", 
        "ma cha may", "ma cha nha may", "mả mẹ", "mả cha", "kệ mẹ", "kệ mịe", 
        "kệ mịa", "kệ mje", "kệ mja", "ke me", "ke mie", "ke mia", "ke mja", 
        "ke mje", "bỏ mẹ", "bỏ mịa", "bỏ mịe", "bỏ mja", "bỏ mje", "bo me", 
        "bo mia", "bo mie", "bo mje", "bo mja", "chetme", "chet me", "chết mẹ", 
        "chết mịa", "chết mja", "chết mịe", "chết mie", "chet mia", "chet mie", 
        "chet mja", "chet mje", "thấy mẹ", "thấy mịe", "thấy mịa", "thay me", 
        "thay mie", "thay mia", "tổ cha", "bà cha mày", "cmn", "cmnl",
        
        // Tiên sư và variants
        "tiên sư nhà mày", "tiên sư bố", "tổ sư"
    ));

    // Danh sách từ ngữ phân biệt chủng tộc
    private static final Set<String> RACIST_WORDS = new HashSet<>(Arrays.asList(
        "mọi rợ", "mọi đen", "da đen", "da trắng", "tây ba lô", "tàu khựa",
        "nhật bản", "hàn quốc", "trung quốc" // Cần kiểm tra context
    ));

    // Pattern để phát hiện từ ngữ vi phạm (case-insensitive, có dấu/không dấu)
    private static final Pattern RACIST_PATTERN = createPattern(RACIST_WORDS);

    /**
     * Tạo pattern từ set các từ
     */
    private static Pattern createPattern(Set<String> words) {
        StringBuilder patternBuilder = new StringBuilder();
        patternBuilder.append("(?i)"); // Case-insensitive
        patternBuilder.append("\\b(");
        
        boolean first = true;
        for (String word : words) {
            if (!first) {
                patternBuilder.append("|");
            }
            // Escape special regex characters
            patternBuilder.append(Pattern.quote(word));
            first = false;
        }
        patternBuilder.append(")\\b");
        
        return Pattern.compile(patternBuilder.toString());
    }

    /**
     * Loại bỏ dấu tiếng Việt để so sánh từ không dấu
     */
    private String removeVietnameseDiacritics(String text) {
        if (text == null) return null;
        
        return text
            .replace("à", "a").replace("á", "a").replace("ạ", "a").replace("ả", "a").replace("ã", "a")
            .replace("â", "a").replace("ầ", "a").replace("ấ", "a").replace("ậ", "a").replace("ẩ", "a").replace("ẫ", "a")
            .replace("ă", "a").replace("ằ", "a").replace("ắ", "a").replace("ặ", "a").replace("ẳ", "a").replace("ẵ", "a")
            .replace("è", "e").replace("é", "e").replace("ẹ", "e").replace("ẻ", "e").replace("ẽ", "e")
            .replace("ê", "e").replace("ề", "e").replace("ế", "e").replace("ệ", "e").replace("ể", "e").replace("ễ", "e")
            .replace("ì", "i").replace("í", "i").replace("ị", "i").replace("ỉ", "i").replace("ĩ", "i")
            .replace("ò", "o").replace("ó", "o").replace("ọ", "o").replace("ỏ", "o").replace("õ", "o")
            .replace("ô", "o").replace("ồ", "o").replace("ố", "o").replace("ộ", "o").replace("ổ", "o").replace("ỗ", "o")
            .replace("ơ", "o").replace("ờ", "o").replace("ớ", "o").replace("ợ", "o").replace("ở", "o").replace("ỡ", "o")
            .replace("ù", "u").replace("ú", "u").replace("ụ", "u").replace("ủ", "u").replace("ũ", "u")
            .replace("ư", "u").replace("ừ", "u").replace("ứ", "u").replace("ự", "u").replace("ử", "u").replace("ữ", "u")
            .replace("ỳ", "y").replace("ý", "y").replace("ỵ", "y").replace("ỷ", "y").replace("ỹ", "y")
            .replace("đ", "d")
            .replace("À", "A").replace("Á", "A").replace("Ạ", "A").replace("Ả", "A").replace("Ã", "A")
            .replace("Â", "A").replace("Ầ", "A").replace("Ấ", "A").replace("Ậ", "A").replace("Ẩ", "A").replace("Ẫ", "A")
            .replace("Ă", "A").replace("Ằ", "A").replace("Ắ", "A").replace("Ặ", "A").replace("Ẳ", "A").replace("Ẵ", "A")
            .replace("È", "E").replace("É", "E").replace("Ẹ", "E").replace("Ẻ", "E").replace("Ẽ", "E")
            .replace("Ê", "E").replace("Ề", "E").replace("Ế", "E").replace("Ệ", "E").replace("Ể", "E").replace("Ễ", "E")
            .replace("Ì", "I").replace("Í", "I").replace("Ị", "I").replace("Ỉ", "I").replace("Ĩ", "I")
            .replace("Ò", "O").replace("Ó", "O").replace("Ọ", "O").replace("Ỏ", "O").replace("Õ", "O")
            .replace("Ô", "O").replace("Ồ", "O").replace("Ố", "O").replace("Ộ", "O").replace("Ổ", "O").replace("Ỗ", "O")
            .replace("Ơ", "O").replace("Ờ", "O").replace("Ớ", "O").replace("Ợ", "O").replace("Ở", "O").replace("Ỡ", "O")
            .replace("Ù", "U").replace("Ú", "U").replace("Ụ", "U").replace("Ủ", "U").replace("Ũ", "U")
            .replace("Ư", "U").replace("Ừ", "U").replace("Ứ", "U").replace("Ự", "U").replace("Ử", "U").replace("Ữ", "U")
            .replace("Ỳ", "Y").replace("Ý", "Y").replace("Ỵ", "Y").replace("Ỷ", "Y").replace("Ỹ", "Y")
            .replace("Đ", "D");
    }

    /**
     * Enum cho các loại vi phạm
     */
    public enum ViolationType {
        PROFANITY,      // Thô tục, tục tĩu
        RACISM,         // Phân biệt chủng tộc
        MULTIPLE        // Nhiều loại vi phạm
    }

    /**
     * Kết quả kiểm tra nội dung
     */
    public static class ModerationResult {
        private boolean isFlagged;
        private ViolationType violationType;
        private String reason;
        private List<String> detectedWords;

        public ModerationResult(boolean isFlagged, ViolationType violationType, String reason, List<String> detectedWords) {
            this.isFlagged = isFlagged;
            this.violationType = violationType;
            this.reason = reason;
            this.detectedWords = detectedWords != null ? detectedWords : new ArrayList<>();
        }

        // Getters
        public boolean isFlagged() {
            return isFlagged;
        }

        public ViolationType getViolationType() {
            return violationType;
        }

        public String getReason() {
            return reason;
        }

        public List<String> getDetectedWords() {
            return detectedWords;
        }
    }

    /**
     * Kiểm tra nội dung comment có vi phạm không
     * 
     * @param content Nội dung comment cần kiểm tra
     * @return ModerationResult chứa thông tin vi phạm
     */
    public ModerationResult checkContent(String content) {
        if (content == null || content.trim().isEmpty()) {
            log.debug("Content moderation: Empty content, returning not flagged");
            return new ModerationResult(false, null, null, null);
        }

        // Chuẩn hóa nội dung: lowercase, loại bỏ khoảng trắng thừa
        String normalizedContent = content.toLowerCase().trim();
        log.debug("Content moderation: Checking content: '{}'", normalizedContent);
        
        // Loại bỏ dấu để kiểm tra cả từ không dấu
        String contentWithoutDiacritics = removeVietnameseDiacritics(normalizedContent);
        
        List<String> detectedWords = new ArrayList<>();
        List<ViolationType> violations = new ArrayList<>();

        // Kiểm tra thô tục, tục tĩu - kiểm tra cả có dấu và không dấu
        boolean hasProfanity = false;
        for (String word : PROFANITY_WORDS) {
            String wordLower = word.toLowerCase();
            String wordWithoutDiacritics = removeVietnameseDiacritics(wordLower);
            
            // Kiểm tra trong nội dung có dấu
            if (normalizedContent.contains(wordLower)) {
                log.debug("Content moderation: Detected profanity word '{}' in content", word);
                hasProfanity = true;
                if (!detectedWords.contains(word)) {
                    detectedWords.add(word);
                }
            }
            // Kiểm tra trong nội dung không dấu (nếu chưa phát hiện)
            else if (contentWithoutDiacritics.contains(wordWithoutDiacritics)) {
                log.debug("Content moderation: Detected profanity word '{}' (without diacritics) in content", word);
                hasProfanity = true;
                if (!detectedWords.contains(word)) {
                    detectedWords.add(word);
                }
            }
        }
        
        if (hasProfanity) {
            violations.add(ViolationType.PROFANITY);
        }

        // Kiểm tra phân biệt chủng tộc (cần kiểm tra context kỹ hơn)
        if (RACIST_PATTERN.matcher(normalizedContent).find()) {
            // Kiểm tra context để tránh false positive
            if (isRacistContext(normalizedContent)) {
                violations.add(ViolationType.RACISM);
                for (String word : RACIST_WORDS) {
                    if (normalizedContent.contains(word.toLowerCase())) {
                        detectedWords.add(word);
                    }
                }
            }
        }

        // Xác định kết quả
        if (violations.isEmpty()) {
            log.debug("Content moderation: No violations found, content is clean");
            return new ModerationResult(false, null, null, null);
        }

        ViolationType violationType = violations.size() > 1 
            ? ViolationType.MULTIPLE 
            : violations.get(0);

        String reason = buildReason(violationType, detectedWords);
        
        log.warn("Content moderation: Content flagged! Type: {}, Reason: {}, Detected words: {}", 
            violationType, reason, detectedWords);

        return new ModerationResult(true, violationType, reason, detectedWords);
    }

    /**
     * Kiểm tra context để xác định có phải phân biệt chủng tộc không
     * (Tránh false positive khi nói về quốc gia một cách tích cực)
     */
    private boolean isRacistContext(String content) {
        // Các từ chỉ context tiêu cực
        String[] negativeContext = {
            "ghét", "xấu", "tệ", "dở", "kém", "thấp kém", "hạ đẳng",
            "không bằng", "thua", "kém cỏi", "đồ", "thằng", "con"
        };

        for (String context : negativeContext) {
            if (content.contains(context)) {
                return true;
            }
        }
        
        // Nếu không có context tiêu cực, có thể là false positive
        // Nhưng vẫn đánh dấu để admin review
        return true; // Conservative approach: flag để admin review
    }

    /**
     * Xây dựng lý do vi phạm
     */
    private String buildReason(ViolationType violationType, List<String> detectedWords) {
        StringBuilder reason = new StringBuilder();
        
        switch (violationType) {
            case PROFANITY:
                reason.append("Comment chứa từ ngữ thô tục, tục tĩu");
                break;
            case RACISM:
                reason.append("Comment có nội dung phân biệt chủng tộc");
                break;
            case MULTIPLE:
                reason.append("Comment vi phạm nhiều quy tắc cộng đồng");
                break;
        }

        if (!detectedWords.isEmpty()) {
            reason.append(": ").append(String.join(", ", detectedWords));
        }

        return reason.toString();
    }
}

