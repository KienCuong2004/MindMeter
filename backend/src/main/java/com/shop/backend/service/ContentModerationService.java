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
        "dau boy", "dauboy", "caidauboy",
        
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
        "ffs", "ffs", "omgwtf", "wtfbbq", "wtfh", "wtfomg", "wtfwtf",
        "lmfao", "lmao", "roflmao", "roflcopter", "roflol", "lolwtf",
        "stfu", "stfup", "stfub", "stfua", "gtfo", "gtfoh", "gtfout",
        "kys", "kyso", "kysf", "kysb", "fml", "fmla", "fmlb", "fmlc",
        "smh", "smhmyhead", "smhfh", "tbh", "tbhfam", "idgaf", "idc",
        "nvm", "nvmd", "nvrm", "idk", "idky", "idkw", "idkwtf",
        
        // English profanity - More sexual terms
        "rape", "rp", "r*pe", "raped", "rped", "raping", "rping", "rapist", "rpist",
        "molest", "mlst", "molested", "mlsted", "molesting", "mlsting", "molester", "mlster",
        "pedophile", "pdphile", "pedophilia", "pdphilia", "pedo", "pdo",
        "incest", "ncst", "incestuous", "ncstuous",
        "bestiality", "bstiality", "beastiality", "bstiality",
        "necrophilia", "ncrophilia", "necrophiliac", "ncrophiliac",
        
        // English profanity - More offensive terms
        "scum", "scm", "sc*m", "scumbag", "scmbag", "scumbags", "scmbags",
        "trash", "trsh", "tr*sh", "trashy", "trshy", "trashier", "trshier",
        "garbage", "grbage", "garb*ge", "garbages", "grbages",
        "filth", "flth", "f*lth", "filthy", "flthy", "filthier", "flthier",
        "disgusting", "dsgusting", "disgusting", "dsgusting", "disgust", "dsgust",
        "revolting", "rvlting", "revolting", "rvlting", "revolt", "rvolt",
        "vile", "vle", "v*le", "viler", "vler", "vilest", "vlest",
        "despicable", "dspicable", "despicable", "dspicable",
        "contemptible", "cntmptible", "contemptible", "cntmptible",
        "loathsome", "lthsome", "loathsome", "lthsome",
        "abhorrent", "bhorrent", "abhorrent", "bhorrent",
        "repulsive", "rplsive", "repulsive", "rplsive",
        "repugnant", "rpugnant", "repugnant", "rpugnant",
        
        // English profanity - More insults
        "douche", "dch", "d*che", "douchebag", "dchbag", "douchebags", "dchbags",
        "jerk", "jrk", "j*rk", "jerks", "jrks", "jerkoff", "jrkoff", "jerkoffs", "jrkoffs",
        "asswipe", "aswipe", "asswipes", "aswipes", "asswiper", "aswiper",
        "dipshit", "dpsht", "dipshits", "dpshts", "dipshitty", "dpshtty",
        "dumbass", "dmbass", "dumbasses", "dmbasses", "dumbassery", "dmbassery",
        "dumbfuck", "dmbfck", "dumbfucks", "dmbfcks", "dumbfucking", "dmbfcking",
        "dumbshit", "dmbsht", "dumbshits", "dmbshts", "dumbshitty", "dmbshtty",
        "fucktard", "fcktard", "fucktards", "fcktards", "fucktarded", "fcktarded",
        "shithead", "shthead", "shitheads", "shtheads", "shitheaded", "shtheaded",
        "shitface", "shtface", "shitfaces", "shtfaces", "shitfaced", "shtfaced",
        "shitbag", "shtbag", "shitbags", "shtbags", "shitbaggy", "shtbaggy",
        "shitstain", "shtstain", "shitstains", "shtstains", "shitstained", "shtstained",
        "piece of shit", "pcs of sht", "pieces of shit", "pcs of sht",
        "son of a bitch", "sn of a bch", "sons of bitches", "sns of btches",
        "motherfucking", "mtherfcking", "motherfuckers", "mtherfckers",
        "fucking hell", "fcking hll", "fucking hells", "fcking hlls",
        
        // English profanity - Body parts (offensive context)
        "tits", "tts", "t*ts", "titties", "tties", "titty", "tty",
        "ass", "as", "asses", "ases", "asshole", "ashole", "assholes", "asholes",
        "butt", "btt", "butts", "btts", "butthole", "bthole", "buttholes", "btholes",
        "dick", "dck", "dicks", "dcks", "dickhead", "dckhead", "dickheads", "dckheads",
        "cock", "ck", "cocks", "cks", "cocksucker", "cksucker", "cocksuckers", "cksuckers",
        "pussy", "pssy", "pussies", "pssies", "pussylips", "pssylips",
        "vagina", "vgina", "vaginas", "vginas", "vaginal", "vginal",
        "penis", "pnis", "penises", "pnises", "penile", "pnile",
        "balls", "blls", "ball", "bll", "ballbag", "bllbag", "ballbags", "bllbags",
        "nuts", "nts", "nut", "nt", "nutsack", "ntsack", "nutsacks", "ntsacks",
        
        // English profanity - More derogatory terms
        "scumbag", "scmbag", "scumbags", "scmbags", "scumbaggy", "scmbaggy",
        "lowlife", "lwlife", "lowlifes", "lwlifes", "lowlives", "lwlives",
        "scumbucket", "scmbucket", "scumbuckets", "scmbuckets",
        "dirtbag", "drtbag", "dirtbags", "drtbags", "dirtbaggy", "drtbaggy",
        "sleazebag", "slzbag", "sleazebags", "slzbags", "sleazebaggy", "slzbaggy",
        "sleazeball", "slzball", "sleazeballs", "slzballs",
        "scumbucket", "scmbucket", "scumbuckets", "scmbuckets",
        "dirtbag", "drtbag", "dirtbags", "drtbags", "dirtbaggy", "drtbaggy",
        
        // English profanity - Violence and threats
        "kill", "kll", "k*ll", "kills", "klls", "killed", "klld", "killing", "klling",
        "murder", "mrdr", "murders", "mrdrs", "murdered", "mrdred", "murdering", "mrdring",
        "murderer", "mrdrer", "murderers", "mrdrers", "murderous", "mrdrous",
        "die", "dy", "d*e", "dies", "dys", "died", "dyd", "dying", "dyng", "death", "dth",
        "dead", "dd", "d*d", "deaths", "dths", "deadly", "ddly",
        "suicide", "scide", "suicides", "scides", "suicidal", "scidal",
        "kill yourself", "kll urself", "kill urself", "kll urself", "kys", "kyso",
        "go die", "go dy", "go d*e", "go dies", "go dys", "go death", "go dth",
        "drop dead", "drp dd", "drop d*d", "drop deaths", "drp dths",
        "rot in hell", "rt in hll", "rot in h*ll", "rot in hells", "rt in hlls",
        
        // English profanity - More offensive phrases
        "fuck off", "fck off", "fuk off", "fuck you", "fck you", "fuk you",
        "fuck yourself", "fck urself", "fuk urself", "fuck urself", "fck urself",
        "go fuck yourself", "go fck urself", "go fuk urself", "go fuck urself",
        "fuck your mother", "fck ur mther", "fuk ur mther", "fuck ur mother",
        "fuck your dad", "fck ur dd", "fuk ur dd", "fuck ur dad",
        "fuck your family", "fck ur fmly", "fuk ur fmly", "fuck ur family",
        "screw you", "scrw you", "screw urself", "scrw urself",
        "go to hell", "gt hell", "go to h*ll", "go to hells", "gt hlls",
        "burn in hell", "brn in hll", "burn in h*ll", "burn in hells", "brn in hlls",
        "go to hell and die", "gt hell and dy", "go to h*ll and d*e",
        
        // English profanity - More abbreviations
        "af", "asf", "asfk", "afk", "asfk", "asfk", "afk", "asfk",
        "tbh", "tbhfam", "tbh", "tbhfam", "tbh", "tbhfam",
        "nvm", "nvmd", "nvrm", "nvm", "nvmd", "nvrm",
        "idk", "idky", "idkw", "idkwtf", "idk", "idky", "idkw", "idkwtf",
        "idgaf", "idc", "idgaf", "idc", "idgaf", "idc",
        "stfu", "stfup", "stfub", "stfua", "stfu", "stfup", "stfub", "stfua",
        "gtfo", "gtfoh", "gtfout", "gtfo", "gtfoh", "gtfout",
        "kys", "kyso", "kysf", "kysb", "kys", "kyso", "kysf", "kysb",
        "fml", "fmla", "fmlb", "fmlc", "fml", "fmla", "fmlb", "fmlc",
        "smh", "smhmyhead", "smhfh", "smh", "smhmyhead", "smhfh",
        "wtf", "wth", "omfg", "omfg", "lmao", "lmfao", "rofl", "stfu", "gtfo",
        "ffs", "ffs", "omgwtf", "wtfbbq", "wtfh", "wtfomg", "wtfwtf",
        "lmfao", "lmao", "roflmao", "roflcopter", "roflol", "lolwtf",
        
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
        "con mẹ", "con me", "con mẹ mày", "con me may", "con mẹ này", "con me nay",
        "con mẹ nó", "con me no", "con mẹ nó mày", "con me no may", "con mẹ mày này",
        "con me may nay", "con mẹ anh", "con me anh", "con mẹ nhà mày", "con me nha may",
        "con mẹ nhà anh", "con me nha anh", "con mẹ nhà nó", "con me nha no",
        
        // Tiên sư và variants
        "tiên sư nhà mày", "tiên sư bố", "tổ sư", "tổ sư nhà mày", "tổ sư bố",
        
        // Thêm các từ thô tục khác
        "đồ chó", "do cho", "đồ khỉ", "do khi", "đồ ngu", "do ngu", "đồ dốt", "do dot",
        "đồ ngốc", "do ngoc", "đồ đần", "do dan", "đồ điên", "do dien", "đồ khùng", "do khung",
        "đồ điên khùng", "do dien khung", "đồ ngu xuẩn", "do ngu xuan", "đồ ngu dốt", "do ngu dot",
        "đồ ngu si", "do ngu si", "đồ ngu đần", "do ngu dan", "đồ ngu ngốc", "do ngu ngoc",
        "thằng ngu", "thang ngu", "thằng dốt", "thang dot", "thằng đần", "thang dan",
        "thằng ngốc", "thang ngoc", "thằng điên", "thang dien", "thằng khùng", "thang khung",
        "thằng chó", "thang cho", "thằng khỉ", "thang khi", "thằng lợn", "thang lon",
        "con ngu", "con ngu", "con dốt", "con dot", "con đần", "con dan", "con ngốc", "con ngoc",
        "con điên", "con dien", "con khùng", "con khung", "con chó", "con cho", "con khỉ", "con khi",
        "con lợn", "con lon", "con heo", "con heo", "con bò", "con bo", "con trâu", "con trau",
        
        // Các từ chửi thề khác
        "đồ chết tiệt", "do chet tiet", "đồ chết bầm", "do chet bam", "đồ chết dẫm", "do chet dam",
        "đồ chết đói", "do chet doi", "đồ chết rũ", "do chet ru", "đồ chết thối", "do chet thoi",
        "đồ chết tiệt", "do chet tiet", "đồ chết bầm", "do chet bam", "đồ chết dẫm", "do chet dam",
        "đồ chết đói", "do chet doi", "đồ chết rũ", "do chet ru", "đồ chết thối", "do chet thoi",
        "đồ khốn nạn", "do khon nan", "đồ khốn kiếp", "do khon kiep", "đồ khốn khổ", "do khon kho",
        "đồ khốn đời", "do khon doi", "đồ khốn số", "do khon so", "đồ khốn mạng", "do khon mang",
        "đồ đáng chết", "do dang chet", "đồ đáng ghét", "do dang ghet", "đồ đáng khinh", "do dang khinh",
        "đồ đáng nguyền rủa", "do dang nguyen rua", "đồ đáng trách", "do dang trach",
        
        // Các từ xúc phạm về trí tuệ
        "óc chó", "oc cho", "óc bò", "oc bo", "óc lợn", "oc lon", "óc heo", "oc heo",
        "đầu bò", "dau bo", "đầu lợn", "dau lon", "đầu heo", "dau heo", "đầu chó", "dau cho",
        "não cá vàng", "nao ca vang", "não cá", "nao ca", "não ngắn", "nao ngan",
        "đầu óc ngu dốt", "dau oc ngu dot", "đầu óc đần độn", "dau oc dan don",
        "đầu óc tối tăm", "dau oc toi tam", "đầu óc mù quáng", "dau oc mu quang",
        
        // Các từ xúc phạm về ngoại hình
        "xấu xí", "xau xi", "xấu như chó", "xau nhu cho", "xấu như ma", "xau nhu ma",
        "xấu như quỷ", "xau nhu quy", "xấu như yêu", "xau nhu yeu", "xấu như tàu", "xau nhu tau",
        "xấu như đĩ", "xau nhu di", "xấu như phò", "xau nhu pho", "xấu như điếm", "xau nhu diem",
        "xấu như lồn", "xau nhu lon", "xấu như lờ", "xau nhu lo", "xấu như cứt", "xau nhu cut",
        
        // Các từ xúc phạm về tính cách
        "đồ hèn", "do hen", "đồ nhát", "do nhat", "đồ sợ", "do so", "đồ hèn nhát", "do hen nhat",
        "đồ hèn mọn", "do hen mon", "đồ hèn hạ", "do hen ha", "đồ hèn kém", "do hen kem",
        "đồ đê tiện", "do de tien", "đồ hạ đẳng", "do ha dang", "đồ thấp kém", "do thap kem",
        "đồ ti tiện", "do ti tien", "đồ bần tiện", "do ban tien", "đồ khốn nạn", "do khon nan",
        
        // Các từ xúc phạm về hành vi
        "đồ lừa đảo", "do lua dao", "đồ lừa gạt", "do lua gat", "đồ gian dối", "do gian doi",
        "đồ dối trá", "do doi tra", "đồ lừa bịp", "do lua bip", "đồ lừa lọc", "do lua loc",
        "đồ trộm cắp", "do trom cap", "đồ ăn cắp", "do an cap", "đồ ăn trộm", "do an trom",
        "đồ cướp", "do cuop", "đồ giết người", "do giet nguoi", "đồ sát nhân", "do sat nhan",
        
        // Các từ viết tắt và leetspeak tiếng Việt
        "clmm", "clgt", "clgv", "clgvt", "clgvtd", "clgvtdm", "clgvtdmm", "clgvtdmmm",
        "dclmm", "dclgt", "dclgv", "dclgvt", "dclgvtd", "dclgvtdm", "dclgvtdmm",
        "dclgvtdmmm", "dclgvtdmmmm", "dclgvtdmmmmm", "dclgvtdmmmmmm",
        "vcl", "vl", "vleu", "vlon", "vloz", "vlol", "vailon", "vailol", "vailoz",
        "sml", "sapmatlol", "sapmatlon", "sapmatloz", "sấp mặt", "sap mat",
        "clgt", "cờ lờ gờ tờ", "cái lề gì thốn", "cai le gi thon",
        
        // Các từ xúc phạm về gia đình
        "đồ con hoang", "do con hoang", "đồ con rơi", "do con roi", "đồ con vứt", "do con vut",
        "đồ con bỏ", "do con bo", "đồ con rác", "do con rac", "đồ con rẻ", "do con re",
        "đồ con hèn", "do con hen", "đồ con nhục", "do con nhuc", "đồ con nhà", "do con nha",
        "đồ con chó", "do con cho", "đồ con khỉ", "do con khi", "đồ con lợn", "do con lon",
        "đồ con heo", "do con heo", "đồ con bò", "do con bo", "đồ con trâu", "do con trau",
        
        // Các từ xúc phạm về xuất thân
        "đồ nhà quê", "do nha que", "đồ quê mùa", "do que mua", "đồ thôn quê", "do thon que",
        "đồ nông thôn", "do nong thon", "đồ làng quê", "do lang que", "đồ quê kệch", "do que kech",
        "đồ quê mùa", "do que mua", "đồ quê nát", "do que nat", "đồ quê xệ", "do que xe",
        
        // Các từ xúc phạm về tôn giáo
        "đồ phản bội", "do phan boi", "đồ bội bạc", "do boi bac", "đồ vô ơn", "do vo on",
        "đồ bất hiếu", "do bat hieu", "đồ bất trung", "do bat trung", "đồ bất nghĩa", "do bat nghia",
        "đồ vô đạo", "do vo dao", "đồ vô lương", "do vo luong", "đồ vô tâm", "do vo tam",
        
        // Các từ xúc phạm về địa vị xã hội
        "đồ hạ lưu", "do ha luu", "đồ thấp hèn", "do thap hen", "đồ hèn mọn", "do hen mon",
        "đồ ti tiện", "do ti tien", "đồ bần tiện", "do ban tien", "đồ khốn nạn", "do khon nan",
        "đồ đê tiện", "do de tien", "đồ hạ đẳng", "do ha dang", "đồ thấp kém", "do thap kem"
    ));

    // Danh sách từ ngữ phân biệt chủng tộc
    private static final Set<String> RACIST_WORDS = new HashSet<>(Arrays.asList(
        // Tiếng Việt - Phân biệt chủng tộc
        "mọi rợ", "moi ro", "mọi đen", "moi den", "mọi trắng", "moi trang",
        "mọi da đen", "moi da den", "mọi da trắng", "moi da trang",
        "mọi da vàng", "moi da vang", "mọi da đỏ", "moi da do",
        "da đen", "da den", "da trắng", "da trang", "da vàng", "da vang",
        "da đỏ", "da do", "da nâu", "da nau", "da xám", "da xam",
        "tây ba lô", "tay ba lo", "tây balô", "tay balo", "tây ba lô", "tay ba lo",
        "tàu khựa", "tau khua", "tàu khựa", "tau khua", "tàu cộng", "tau cong",
        "tàu phỉ", "tau phi", "tàu cướp", "tau cuop", "tàu xâm lược", "tau xam luoc",
        "nhật bản", "nhat ban", "hàn quốc", "han quoc", "trung quốc", "trung quoc",
        "mỹ", "my", "mỹ đen", "my den", "mỹ trắng", "my trang", "mỹ la tinh", "my la tinh",
        "đồ tây", "do tay", "đồ tàu", "do tau", "đồ nhật", "do nhat", "đồ hàn", "do han",
        "đồ mỹ", "do my", "đồ nga", "do nga", "đồ pháp", "do phap", "đồ đức", "do duc",
        "đồ anh", "do anh", "đồ ý", "do y", "đồ tây ban nha", "do tay ban nha",
        "đồ bồ đào nha", "do bo dao nha", "đồ hà lan", "do ha lan", "đồ bỉ", "do bi",
        "đồ thụy sĩ", "do thuy si", "đồ áo", "do ao", "đồ thụy điển", "do thuy dien",
        "đồ na uy", "do na uy", "đồ đan mạch", "do dan mach", "đồ phần lan", "do phan lan",
        "đồ thổ nhĩ kỳ", "do tho nhi ky", "đồ hy lạp", "do hy lap", "đồ tây ban nha", "do tay ban nha",
        
        // Tiếng Anh - Phân biệt chủng tộc
        "nigger", "ngger", "n*gger", "n**ger", "nigga", "ngga", "n*gga", "n**ga",
        "niggas", "nggas", "niggers", "nggers", "niggaz", "nggaz", "niggahs", "nggahs",
        "coon", "cn", "c*n", "coons", "cns", "coonass", "cnass", "coonasses", "cnasses",
        "spic", "spc", "sp*c", "spics", "spcs", "spick", "spck", "spicks", "spcks",
        "wetback", "wtback", "wetbacks", "wtbacks", "wetbacker", "wtbacker", "wetbackers", "wtbackers",
        "chink", "chnk", "ch*nk", "chinks", "chnks", "chinky", "chnky", "chinkies", "chnkies",
        "gook", "gk", "g*k", "gooks", "gks", "gooky", "gky", "gookies", "gkies",
        "jap", "jp", "j*p", "japs", "jps", "jappy", "jppy", "jappies", "jppies",
        "nip", "np", "n*p", "nips", "nps", "nippy", "nppy", "nippies", "nppies",
        "slant", "slnt", "sl*nt", "slants", "slnts", "slanty", "slnty", "slanties", "slnties",
        "slanteye", "slnteye", "slanteyes", "slnteyes", "slanteyed", "slnteyed",
        "chinkeye", "chnkeye", "chinkeyes", "chnkeyes", "chinkeyed", "chnkeyed",
        "gookeye", "gkeye", "gookeyes", "gkeyes", "gookeyed", "gkeyed",
        "japeye", "jpeye", "japeyes", "jpeyes", "japeyed", "jpeyed",
        "nipeye", "npeye", "nipeyes", "npeyes", "nipeyed", "npeyed",
        "yellow", "yllw", "y*llw", "yellows", "yllws", "yellowed", "yllwed",
        "yellowbelly", "yllwbelly", "yellowbellies", "yllwbellies", "yellowbellied", "yllwbellied",
        "redskin", "rdskin", "redskins", "rdskins", "redskinned", "rdskinned",
        "redneck", "rdneck", "rednecks", "rdnecks", "rednecked", "rdnecked",
        "cracker", "crcker", "crackers", "crckers", "crackered", "crckered",
        "honky", "hnky", "h*nky", "honkies", "hnkies", "honkys", "hnkys",
        "whitey", "whty", "wh*ty", "whiteys", "whtys", "whities", "whties",
        "whitetrash", "whtetrash", "whitetrashes", "whtetrashes", "whitetrashed", "whtetrashed",
        "blackie", "blckie", "blackies", "blckies", "blackys", "blckys",
        "darkie", "drkie", "darkies", "drkies", "darkys", "drkys",
        "negro", "ngro", "n*gro", "negros", "ngros", "negroes", "ngroes",
        "negroid", "ngroid", "negroids", "ngroids", "negroided", "ngroided",
        "mulatto", "mlatto", "mulattos", "mlattos", "mulattoes", "mlattoes",
        "halfbreed", "hlfbreed", "halfbreeds", "hlfbreeds", "halfbreeded", "hlfbreeded",
        "halfcaste", "hlfcaste", "halfcastes", "hlfcastes", "halfcasted", "hlfcasted",
        "mongrel", "mngrel", "mongrels", "mngrels", "mongreled", "mngreled",
        "mixedbreed", "mxdbreed", "mixedbreeds", "mxdbreeds", "mixedbreeded", "mxdbreeded",
        "mixedrace", "mxdrace", "mixedraces", "mxdraces", "mixedraced", "mxdraced",
        "sandnigger", "sndngger", "sandniggers", "sndnggers", "sandniggered", "sndnggered",
        "sandnigger", "sndngger", "sandniggers", "sndnggers", "sandniggered", "sndnggered",
        "towelhead", "twlhead", "towelheads", "twlheads", "towelheaded", "twlheaded",
        "raghead", "rghead", "ragheads", "rgheads", "ragheaded", "rgheaded",
        "cameljockey", "cmljcky", "cameljockies", "cmljckies", "cameljockeys", "cmljckeys",
        "cameljockeyed", "cmljckyed", "cameljockeying", "cmljckying",
        "towelhead", "twlhead", "towelheads", "twlheads", "towelheaded", "twlheaded",
        "raghead", "rghead", "ragheads", "rgheads", "ragheaded", "rgheaded",
        "terrorist", "trrrst", "terrorists", "trrrsts", "terroristed", "trrrsted",
        "terrorism", "trrrism", "terrorisms", "trrrisms", "terroristic", "trrristic",
        "islamic", "slmic", "islamics", "slmics", "islamicized", "slmicized",
        "muslim", "mslm", "muslims", "mslms", "muslimed", "mslmed",
        "arab", "rb", "r*b", "arabs", "rbs", "arabed", "rbed",
        "persian", "prsian", "persians", "prsians", "persianed", "prsianed",
        "turk", "trk", "t*rk", "turks", "trks", "turked", "trked",
        "pakistani", "pkstani", "pakistanis", "pkstanis", "pakistanied", "pkstanied",
        "afghan", "fghn", "f*ghn", "afghans", "fghns", "afghaned", "fghned",
        "iraqi", "rqi", "r*qi", "iraqis", "rqis", "iraqied", "rqied",
        "iranian", "rnian", "iranians", "rnians", "iranianed", "rnianed",
        "syrian", "syrin", "syrians", "syrins", "syrianed", "syrined",
        "lebanese", "lbnese", "lebaneses", "lbneses", "lebanesed", "lbneseed",
        "palestinian", "plstinian", "palestinians", "plstinians", "palestinianed", "plstinianed",
        "jew", "jw", "j*w", "jews", "jws", "jewed", "jwed",
        "jewish", "jwish", "jewishs", "jwishs", "jewished", "jwished",
        "kike", "kk", "k*ke", "kikes", "kks", "kiked", "kkd",
        "heeb", "hb", "h*b", "heebs", "hbs", "heebed", "hbed",
        "yid", "yd", "y*d", "yids", "yds", "yided", "ydd",
        "zionist", "znist", "zionists", "znists", "zionisted", "znisted",
        "gypsy", "gpsy", "gypsies", "gpsies", "gypsys", "gpsys",
        "romani", "rmni", "romanis", "rmnis", "romanied", "rmnied",
        "roma", "rm", "r*m", "romas", "rms", "romed", "rmd",
        "indian", "ndian", "indians", "ndians", "indianed", "ndianed",
        "native", "ntive", "natives", "ntives", "natived", "ntived",
        "aboriginal", "briginal", "aboriginals", "briginals", "aboriginaled", "briginaled",
        "australian", "strlian", "australians", "strlians", "australianed", "strlianed",
        "maori", "mri", "m*ri", "maoris", "mris", "maoried", "mried",
        "polynesian", "plynesian", "polynesians", "plynesians", "polynesianed", "plynesianed",
        "hawaiian", "hwian", "hawaiians", "hwians", "hawaiianed", "hwianed",
        "samoan", "smon", "sm*on", "samoans", "smons", "samoaned", "smoned",
        "tongan", "tngn", "t*ngn", "tongans", "tngns", "tonganed", "tngned",
        "fijian", "fjin", "fj*n", "fijians", "fjins", "fijianed", "fjined",
        "mexican", "mxican", "mexicans", "mxicans", "mexicaned", "mxicaned",
        "latino", "ltino", "lt*no", "latinos", "ltinos", "latinosed", "ltinosed",
        "latina", "ltina", "lt*na", "latinas", "ltinas", "latinased", "ltinased",
        "hispanic", "hspnic", "hispanics", "hspnics", "hispaniced", "hspniced",
        "puerto rican", "prto rcn", "puerto ricans", "prto rcans", "puerto ricaned", "prto rcaned",
        "cuban", "cbn", "c*bn", "cubans", "cbns", "cubaned", "cbned",
        "brazilian", "brzilian", "brazilians", "brzilians", "brazilianed", "brzilianed",
        "argentinian", "rgentinin", "argentinians", "rgentinins", "argentinianed", "rgentinined",
        "chilean", "chlen", "chl*en", "chileans", "chlens", "chileaned", "chlened",
        "colombian", "clmbian", "colombians", "clmbians", "colombianed", "clmbianed",
        "peruvian", "prvin", "pr*vn", "peruvians", "prvins", "peruvianed", "prvined",
        "venezuelan", "vnzueln", "venezuelans", "vnzuelns", "venezuelaned", "vnzuelned",
        "ecuadorian", "cudorin", "ecuadorians", "cudorins", "ecuadorianed", "cudorined",
        "bolivian", "blvin", "bl*vn", "bolivians", "blvins", "bolivianed", "blvined",
        "paraguayan", "prguyan", "paraguayans", "prguyans", "paraguayaned", "prguyaned",
        "uruguayan", "rguyan", "uruguayans", "rguyans", "uruguayaned", "rguyaned",
        "guatemalan", "gtemln", "guatemalans", "gtemlns", "guatemalaned", "gtemlned",
        "honduran", "hndrn", "h*ndrn", "hondurans", "hndrns", "honduraned", "hndrned",
        "nicaraguan", "ncragun", "nicaraguans", "ncraguns", "nicaraguaned", "ncraguned",
        "costa rican", "cst rcn", "costa ricans", "cst rcans", "costa ricaned", "cst rcaned",
        "panamanian", "pnmanin", "panamanians", "pnmanins", "panamanianed", "pnmanined",
        "salvadoran", "slvdorn", "salvadorans", "slvdorns", "salvadoraned", "slvdorned",
        "dominican", "dmncan", "dominicans", "dmncans", "dominicaned", "dmncaned",
        "haitian", "htin", "h*tn", "haitians", "htins", "haitianed", "htined",
        "jamaican", "jmcan", "jamaicans", "jmcans", "jamaicaned", "jmcaned",
        "trinidadian", "trnddin", "trinidadians", "trnddins", "trinidadianed", "trnddined",
        "barbadian", "brbdin", "barbadians", "brbdins", "barbadianed", "brbdined",
        "bahamian", "bhmn", "b*hmn", "bahamians", "bhms", "bahamianed", "bhmned",
        "caymanian", "cymnin", "caymanians", "cymnins", "caymanianed", "cymnined",
        "bermudian", "brmdin", "bermudians", "brmdins", "bermudianed", "brmdined",
        "virgin islander", "vrgn slnder", "virgin islanders", "vrgn slnders", "virgin islandered", "vrgn slndered",
        "puerto rican", "prto rcn", "puerto ricans", "prto rcans", "puerto ricaned", "prto rcaned",
        "cuban", "cbn", "c*bn", "cubans", "cbns", "cubaned", "cbned",
        "brazilian", "brzilian", "brazilians", "brzilians", "brazilianed", "brzilianed",
        "argentinian", "rgentinin", "argentinians", "rgentinins", "argentinianed", "rgentinined",
        "chilean", "chlen", "chl*en", "chileans", "chlens", "chileaned", "chlened",
        "colombian", "clmbian", "colombians", "clmbians", "colombianed", "clmbianed",
        "peruvian", "prvin", "pr*vn", "peruvians", "prvins", "peruvianed", "prvined",
        "venezuelan", "vnzueln", "venezuelans", "vnzuelns", "venezuelaned", "vnzuelned",
        "ecuadorian", "cudorin", "ecuadorians", "cudorins", "ecuadorianed", "cudorined",
        "bolivian", "blvin", "bl*vn", "bolivians", "blvins", "bolivianed", "blvined",
        "paraguayan", "prguyan", "paraguayans", "prguyans", "paraguayaned", "prguyaned",
        "uruguayan", "rguyan", "uruguayans", "rguyans", "uruguayaned", "rguyaned",
        "guatemalan", "gtemln", "guatemalans", "gtemlns", "guatemalaned", "gtemlned",
        "honduran", "hndrn", "h*ndrn", "hondurans", "hndrns", "honduraned", "hndrned",
        "nicaraguan", "ncragun", "nicaraguans", "ncraguns", "nicaraguaned", "ncraguned",
        "costa rican", "cst rcn", "costa ricans", "cst rcans", "costa ricaned", "cst rcaned",
        "panamanian", "pnmanin", "panamanians", "pnmanins", "panamanianed", "pnmanined",
        "salvadoran", "slvdorn", "salvadorans", "slvdorns", "salvadoraned", "slvdorned",
        "dominican", "dmncan", "dominicans", "dmncans", "dominicaned", "dmncaned",
        "haitian", "htin", "h*tn", "haitians", "htins", "haitianed", "htined",
        "jamaican", "jmcan", "jamaicans", "jmcans", "jamaicaned", "jmcaned",
        "trinidadian", "trnddin", "trinidadians", "trnddins", "trinidadianed", "trnddined",
        "barbadian", "brbdin", "barbadians", "brbdins", "barbadianed", "brbdined",
        "bahamian", "bhmn", "b*hmn", "bahamians", "bhms", "bahamianed", "bhmned",
        "caymanian", "cymnin", "caymanians", "cymnins", "caymanianed", "cymnined",
        "bermudian", "brmdin", "bermudians", "brmdins", "bermudianed", "brmdined",
        "virgin islander", "vrgn slnder", "virgin islanders", "vrgn slnders", "virgin islandered", "vrgn slndered"
    ));

    // Pattern để phát hiện từ ngữ vi phạm (case-insensitive, có dấu/không dấu)
    private static final Pattern PROFANITY_PATTERN = createPattern(PROFANITY_WORDS);
    private static final Pattern RACIST_PATTERN = createPattern(RACIST_WORDS);
    
    // Pattern cho nội dung không dấu (để phát hiện từ không dấu)
    private static final Pattern PROFANITY_PATTERN_NO_DIACRITICS = createPatternNoDiacritics(PROFANITY_WORDS);

    /**
     * Tạo pattern từ set các từ với word boundaries
     * Hỗ trợ cả từ đơn và cụm từ có khoảng trắng
     */
    private static Pattern createPattern(Set<String> words) {
        StringBuilder singleWords = new StringBuilder();
        StringBuilder multiWords = new StringBuilder();
        
        boolean firstSingle = true;
        boolean firstMulti = true;
        
        for (String word : words) {
            // Tách từ đơn và cụm từ (có khoảng trắng)
            if (word.contains(" ")) {
                // Cụm từ: không dùng \b ở giữa, chỉ ở đầu và cuối
                if (!firstMulti) {
                    multiWords.append("|");
                }
                multiWords.append("\\b").append(Pattern.quote(word)).append("\\b");
                firstMulti = false;
            } else {
                // Từ đơn: dùng \b ở cả đầu và cuối
                if (!firstSingle) {
                    singleWords.append("|");
                }
                singleWords.append(Pattern.quote(word));
                firstSingle = false;
            }
        }
        
        StringBuilder patternBuilder = new StringBuilder();
        patternBuilder.append("(?i)"); // Case-insensitive
        
        // Kết hợp pattern cho từ đơn và cụm từ
        if (singleWords.length() > 0 && multiWords.length() > 0) {
            patternBuilder.append("(\\b(").append(singleWords).append(")\\b|").append(multiWords).append(")");
        } else if (singleWords.length() > 0) {
            patternBuilder.append("\\b(").append(singleWords).append(")\\b");
        } else if (multiWords.length() > 0) {
            patternBuilder.append(multiWords);
        } else {
            // Fallback nếu không có từ nào
            patternBuilder.append("(?!.*)");
        }
        
        return Pattern.compile(patternBuilder.toString());
    }
    
    /**
     * Tạo pattern từ set các từ không dấu (sau khi remove diacritics)
     * Sử dụng để phát hiện từ không dấu trong nội dung
     * Hỗ trợ cả từ đơn và cụm từ có khoảng trắng
     */
    private static Pattern createPatternNoDiacritics(Set<String> words) {
        Set<String> wordsNoDiacritics = new HashSet<>();
        for (String word : words) {
            String wordNoDiacritics = word
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
                .toLowerCase();
            wordsNoDiacritics.add(wordNoDiacritics);
        }
        
        StringBuilder singleWords = new StringBuilder();
        StringBuilder multiWords = new StringBuilder();
        
        boolean firstSingle = true;
        boolean firstMulti = true;
        
        for (String word : wordsNoDiacritics) {
            // Tách từ đơn và cụm từ (có khoảng trắng)
            if (word.contains(" ")) {
                // Cụm từ: không dùng \b ở giữa, chỉ ở đầu và cuối
                if (!firstMulti) {
                    multiWords.append("|");
                }
                multiWords.append("\\b").append(Pattern.quote(word)).append("\\b");
                firstMulti = false;
            } else {
                // Từ đơn: dùng \b ở cả đầu và cuối
                if (!firstSingle) {
                    singleWords.append("|");
                }
                singleWords.append(Pattern.quote(word));
                firstSingle = false;
            }
        }
        
        StringBuilder patternBuilder = new StringBuilder();
        patternBuilder.append("(?i)"); // Case-insensitive
        
        // Kết hợp pattern cho từ đơn và cụm từ
        if (singleWords.length() > 0 && multiWords.length() > 0) {
            patternBuilder.append("(\\b(").append(singleWords).append(")\\b|").append(multiWords).append(")");
        } else if (singleWords.length() > 0) {
            patternBuilder.append("\\b(").append(singleWords).append(")\\b");
        } else if (multiWords.length() > 0) {
            patternBuilder.append(multiWords);
        } else {
            // Fallback nếu không có từ nào
            patternBuilder.append("(?!.*)");
        }
        
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

        // Kiểm tra thô tục, tục tĩu - sử dụng pattern với word boundaries để tránh false positive
        java.util.regex.Matcher profanityMatcher = PROFANITY_PATTERN.matcher(normalizedContent);
        boolean hasProfanity = profanityMatcher.find();
        
        // Nếu không tìm thấy với pattern có dấu, kiểm tra với pattern không dấu
        if (!hasProfanity) {
            java.util.regex.Matcher profanityMatcherNoDiacritics = PROFANITY_PATTERN_NO_DIACRITICS.matcher(contentWithoutDiacritics);
            hasProfanity = profanityMatcherNoDiacritics.find();
            if (hasProfanity) {
                profanityMatcher = profanityMatcherNoDiacritics;
            }
        }
        
        if (hasProfanity) {
            violations.add(ViolationType.PROFANITY);
            // Tìm tất cả các từ vi phạm được phát hiện
            profanityMatcher.reset();
            while (profanityMatcher.find()) {
                // Lấy toàn bộ text được match (group 0)
                String matchedText = profanityMatcher.group(0).toLowerCase().trim();
                // Tìm từ gốc tương ứng trong PROFANITY_WORDS
                for (String word : PROFANITY_WORDS) {
                    String wordLower = word.toLowerCase();
                    String wordWithoutDiacritics = removeVietnameseDiacritics(wordLower);
                    // So sánh với từ gốc (có dấu hoặc không dấu)
                    if (matchedText.equals(wordLower) || matchedText.equals(wordWithoutDiacritics)) {
                        if (!detectedWords.contains(word)) {
                            detectedWords.add(word);
                            log.debug("Content moderation: Detected profanity word '{}' in content (matched: '{}')", word, matchedText);
                        }
                        break;
                    }
                }
            }
        }

        // Kiểm tra phân biệt chủng tộc (cần kiểm tra context kỹ hơn)
        java.util.regex.Matcher racistMatcher = RACIST_PATTERN.matcher(normalizedContent);
        if (racistMatcher.find()) {
            // Tạo matcher mới để kiểm tra context (vì matcher hiện tại đã được sử dụng)
            java.util.regex.Matcher contextMatcher = RACIST_PATTERN.matcher(normalizedContent);
            // Kiểm tra context để tránh false positive
            if (isRacistContext(normalizedContent, contextMatcher)) {
                violations.add(ViolationType.RACISM);
                // Tìm tất cả các từ vi phạm được phát hiện
                contextMatcher.reset();
                while (contextMatcher.find()) {
                    // Lấy toàn bộ text được match (group 0)
                    String matchedText = contextMatcher.group(0).toLowerCase().trim();
                    // Tìm từ gốc tương ứng trong RACIST_WORDS
                    for (String word : RACIST_WORDS) {
                        if (matchedText.equals(word.toLowerCase())) {
                            if (!detectedWords.contains(word)) {
                                detectedWords.add(word);
                                log.debug("Content moderation: Detected racist word '{}' in content (matched: '{}')", word, matchedText);
                            }
                            break;
                        }
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
    private boolean isRacistContext(String content, java.util.regex.Matcher matcher) {
        // Các từ chỉ context tiêu cực (tiếng Việt)
        String[] negativeContextVi = {
            "ghét", "xấu", "tệ", "dở", "kém", "thấp kém", "hạ đẳng",
            "không bằng", "thua", "kém cỏi", "đồ", "thằng", "con",
            "xấu xa", "tệ hại", "dở tệ", "kém cỏi", "thấp hèn"
        };
        
        // Các từ chỉ context tiêu cực (tiếng Anh)
        String[] negativeContextEn = {
            "hate", "bad", "worst", "stupid", "inferior", "low",
            "disgusting", "terrible", "awful", "pathetic", "worthless"
        };
        
        // Tìm từ racist được phát hiện
        matcher.reset();
        while (matcher.find()) {
            // Lấy toàn bộ text được match (group 0)
            String matchedWord = matcher.group(0).toLowerCase().trim();
            int matchStart = matcher.start();
            int matchEnd = matcher.end();
            
            // Kiểm tra context xung quanh từ được phát hiện (50 ký tự trước và sau)
            int contextStart = Math.max(0, matchStart - 50);
            int contextEnd = Math.min(content.length(), matchEnd + 50);
            String context = content.substring(contextStart, contextEnd).toLowerCase();
            
            // Kiểm tra context tiêu cực tiếng Việt
            for (String negativeWord : negativeContextVi) {
                if (context.contains(negativeWord)) {
                    log.debug("Content moderation: Negative context detected (Vietnamese): '{}' around word '{}'", 
                        negativeWord, matchedWord);
                    return true;
                }
            }
            
            // Kiểm tra context tiêu cực tiếng Anh
            for (String negativeWord : negativeContextEn) {
                if (context.contains(negativeWord)) {
                    log.debug("Content moderation: Negative context detected (English): '{}' around word '{}'", 
                        negativeWord, matchedWord);
                    return true;
                }
            }
            
            // Kiểm tra các từ racist cụ thể (luôn flag bất kể context)
            String[] alwaysFlagWords = {
                "nigger", "ngger", "nigga", "ngga", "coon", "spic", "wetback",
                "chink", "gook", "jap", "nip", "kike", "heeb", "yid",
                "mọi rợ", "moi ro", "tàu khựa", "tau khua"
            };
            
            for (String alwaysFlagWord : alwaysFlagWords) {
                if (matchedWord.toLowerCase().contains(alwaysFlagWord.toLowerCase())) {
                    log.debug("Content moderation: Always-flag racist word detected: '{}'", matchedWord);
                    return true;
                }
            }
        }
        
        // Nếu không có context tiêu cực và không phải từ luôn flag, không đánh dấu
        // (tránh false positive khi nói về quốc gia/dân tộc một cách tích cực)
        log.debug("Content moderation: No negative context found, not flagging as racist");
        return false;
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

