"""Language catalogue: every language the translation engine supports, with
linguistic metadata (family, script, writing system, direction)."""
from __future__ import annotations

from deep_translator import GoogleTranslator

# ---- Scripts -------------------------------------------------------------
# name, writing-system type, character-set description, UI group, sample glyphs
SCRIPTS: dict[str, dict] = {
    "Latin": dict(system="Alphabet", group="Latin", glyphs="Aa Bb Cc",
                  characters="26 base letters, extended with accents and diacritics in many languages"),
    "Cyrillic": dict(system="Alphabet", group="Cyrillic", glyphs="Ж Я Ш",
                     characters="30–33 letters depending on the language"),
    "Greek": dict(system="Alphabet", group="Other scripts", glyphs="Α Ω Σ",
                  characters="24 letters"),
    "Arabic": dict(system="Abjad (consonant-based, right to left)", group="Arabic", glyphs="ع ب ك",
                   characters="28 base letters in Arabic; extra letters in Persian, Urdu, Pashto and others"),
    "Hebrew": dict(system="Abjad (consonant-based, right to left)", group="Other scripts", glyphs="א ב ש",
                   characters="22 letters (5 have final forms)"),
    "Devanagari": dict(system="Abugida", group="Indic scripts", glyphs="अ क म",
                       characters="about 47 primary letters (vowels and consonants) plus vowel marks"),
    "Bengali–Assamese": dict(system="Abugida", group="Indic scripts", glyphs="অ ক ম",
                             characters="about 50 primary letters plus vowel marks"),
    "Gurmukhi": dict(system="Abugida", group="Indic scripts", glyphs="ਅ ਕ ਮ",
                     characters="35 core letters plus vowel marks"),
    "Gujarati": dict(system="Abugida", group="Indic scripts", glyphs="અ ક મ",
                     characters="about 48 letters plus vowel marks"),
    "Odia": dict(system="Abugida", group="Indic scripts", glyphs="ଅ କ ମ",
                 characters="about 52 letters plus vowel marks"),
    "Tamil": dict(system="Abugida", group="Indic scripts", glyphs="அ க ம",
                  characters="12 vowels and 18 consonants, combining into 247 syllable characters"),
    "Telugu": dict(system="Abugida", group="Indic scripts", glyphs="అ క మ",
                   characters="about 56 letters plus vowel marks"),
    "Kannada": dict(system="Abugida", group="Indic scripts", glyphs="ಅ ಕ ಮ",
                    characters="about 49 letters plus vowel marks"),
    "Malayalam": dict(system="Abugida", group="Indic scripts", glyphs="അ ക മ",
                      characters="about 53 letters plus vowel marks"),
    "Sinhala": dict(system="Abugida", group="Indic scripts", glyphs="අ ක ම",
                    characters="about 60 letters plus vowel marks"),
    "Thaana": dict(system="Abugida (right to left)", group="Other scripts", glyphs="ހ ށ ނ",
                   characters="24 consonants plus vowel signs"),
    "Meitei Mayek": dict(system="Abugida", group="Indic scripts", glyphs="ꯃ ꯀ ꯅ",
                         characters="about 35 letters"),
    "Thai": dict(system="Abugida", group="Southeast Asian", glyphs="ก ข ม",
                 characters="44 consonants and 32 vowel forms; written without spaces between words"),
    "Lao": dict(system="Abugida", group="Southeast Asian", glyphs="ກ ຂ ມ",
                characters="about 33 consonants and vowel signs"),
    "Khmer": dict(system="Abugida", group="Southeast Asian", glyphs="ក ខ ម",
                  characters="33 consonants and about 23 vowel signs"),
    "Myanmar": dict(system="Abugida", group="Southeast Asian", glyphs="က ခ မ",
                    characters="33 consonants plus vowel and tone marks"),
    "Ethiopic": dict(system="Abugida (Ge'ez)", group="Other scripts", glyphs="አ በ ሰ",
                     characters="about 280 syllable characters"),
    "Georgian": dict(system="Alphabet", group="Other scripts", glyphs="ა ბ გ",
                     characters="33 letters"),
    "Armenian": dict(system="Alphabet", group="Other scripts", glyphs="Ա Բ Գ",
                     characters="38 letters"),
    "Hangul": dict(system="Featural alphabet, written in syllable blocks", group="East Asian", glyphs="한 글",
                   characters="24 basic letters (14 consonants, 10 vowels) combined into syllable blocks"),
    "Han (Simplified)": dict(system="Logographic", group="East Asian", glyphs="汉 语",
                             characters="thousands of characters; about 3,000 cover most everyday text"),
    "Han (Traditional)": dict(system="Logographic", group="East Asian", glyphs="漢 語",
                              characters="thousands of characters; about 3,000 cover most everyday text"),
    "Japanese": dict(system="Mixed: logographic kanji with hiragana and katakana syllabaries", group="East Asian",
                     glyphs="あ ア 日",
                     characters="46 hiragana, 46 katakana and about 2,100 everyday kanji"),
}

# ---- Language metadata -----------------------------------------------------
# code: (English name, native name, family, script)
# Family strings are broad, widely used classifications.
IE = "Indo-European"
M: dict[str, tuple[str, str, str, str]] = {
    "af": ("Afrikaans", "Afrikaans", f"{IE} · Germanic", "Latin"),
    "sq": ("Albanian", "Shqip", f"{IE} · Albanian", "Latin"),
    "am": ("Amharic", "አማርኛ", "Afroasiatic · Semitic", "Ethiopic"),
    "ar": ("Arabic", "العربية", "Afroasiatic · Semitic", "Arabic"),
    "hy": ("Armenian", "Հայերեն", f"{IE} · Armenian", "Armenian"),
    "as": ("Assamese", "অসমীয়া", f"{IE} · Indo-Aryan", "Bengali–Assamese"),
    "ay": ("Aymara", "Aymar aru", "Aymaran", "Latin"),
    "az": ("Azerbaijani", "Azərbaycan dili", "Turkic", "Latin"),
    "bm": ("Bambara", "Bamanankan", "Niger-Congo · Mande", "Latin"),
    "eu": ("Basque", "Euskara", "Language isolate", "Latin"),
    "be": ("Belarusian", "Беларуская", f"{IE} · Slavic", "Cyrillic"),
    "bn": ("Bengali", "বাংলা", f"{IE} · Indo-Aryan", "Bengali–Assamese"),
    "bho": ("Bhojpuri", "भोजपुरी", f"{IE} · Indo-Aryan", "Devanagari"),
    "bs": ("Bosnian", "Bosanski", f"{IE} · Slavic", "Latin"),
    "bg": ("Bulgarian", "Български", f"{IE} · Slavic", "Cyrillic"),
    "ca": ("Catalan", "Català", f"{IE} · Romance", "Latin"),
    "ceb": ("Cebuano", "Cebuano", "Austronesian", "Latin"),
    "ny": ("Chichewa", "Chichewa", "Niger-Congo · Bantu", "Latin"),
    "zh-CN": ("Chinese (Simplified)", "简体中文", "Sino-Tibetan · Sinitic", "Han (Simplified)"),
    "zh-TW": ("Chinese (Traditional)", "繁體中文", "Sino-Tibetan · Sinitic", "Han (Traditional)"),
    "co": ("Corsican", "Corsu", f"{IE} · Romance", "Latin"),
    "hr": ("Croatian", "Hrvatski", f"{IE} · Slavic", "Latin"),
    "cs": ("Czech", "Čeština", f"{IE} · Slavic", "Latin"),
    "da": ("Danish", "Dansk", f"{IE} · Germanic", "Latin"),
    "dv": ("Dhivehi", "ދިވެހި", f"{IE} · Indo-Aryan", "Thaana"),
    "doi": ("Dogri", "डोगरी", f"{IE} · Indo-Aryan", "Devanagari"),
    "nl": ("Dutch", "Nederlands", f"{IE} · Germanic", "Latin"),
    "en": ("English", "English", f"{IE} · Germanic", "Latin"),
    "eo": ("Esperanto", "Esperanto", "Constructed language", "Latin"),
    "et": ("Estonian", "Eesti", "Uralic · Finnic", "Latin"),
    "ee": ("Ewe", "Eʋegbe", "Niger-Congo · Kwa", "Latin"),
    "tl": ("Filipino", "Filipino", "Austronesian", "Latin"),
    "fi": ("Finnish", "Suomi", "Uralic · Finnic", "Latin"),
    "fr": ("French", "Français", f"{IE} · Romance", "Latin"),
    "fy": ("Frisian", "Frysk", f"{IE} · Germanic", "Latin"),
    "gl": ("Galician", "Galego", f"{IE} · Romance", "Latin"),
    "ka": ("Georgian", "ქართული", "Kartvelian", "Georgian"),
    "de": ("German", "Deutsch", f"{IE} · Germanic", "Latin"),
    "el": ("Greek", "Ελληνικά", f"{IE} · Hellenic", "Greek"),
    "gn": ("Guarani", "Avañe'ẽ", "Tupian", "Latin"),
    "gu": ("Gujarati", "ગુજરાતી", f"{IE} · Indo-Aryan", "Gujarati"),
    "ht": ("Haitian Creole", "Kreyòl ayisyen", "French-based creole", "Latin"),
    "ha": ("Hausa", "Hausa", "Afroasiatic · Chadic", "Latin"),
    "haw": ("Hawaiian", "ʻŌlelo Hawaiʻi", "Austronesian · Polynesian", "Latin"),
    "iw": ("Hebrew", "עברית", "Afroasiatic · Semitic", "Hebrew"),
    "hi": ("Hindi", "हिन्दी", f"{IE} · Indo-Aryan", "Devanagari"),
    "hmn": ("Hmong", "Hmoob", "Hmong–Mien", "Latin"),
    "hu": ("Hungarian", "Magyar", "Uralic · Ugric", "Latin"),
    "is": ("Icelandic", "Íslenska", f"{IE} · Germanic", "Latin"),
    "ig": ("Igbo", "Igbo", "Niger-Congo · Volta-Niger", "Latin"),
    "ilo": ("Ilocano", "Ilokano", "Austronesian", "Latin"),
    "id": ("Indonesian", "Bahasa Indonesia", "Austronesian", "Latin"),
    "ga": ("Irish", "Gaeilge", f"{IE} · Celtic", "Latin"),
    "it": ("Italian", "Italiano", f"{IE} · Romance", "Latin"),
    "ja": ("Japanese", "日本語", "Japonic", "Japanese"),
    "jw": ("Javanese", "Basa Jawa", "Austronesian", "Latin"),
    "kn": ("Kannada", "ಕನ್ನಡ", "Dravidian", "Kannada"),
    "kk": ("Kazakh", "Қазақша", "Turkic", "Cyrillic"),
    "km": ("Khmer", "ខ្មែរ", "Austroasiatic", "Khmer"),
    "rw": ("Kinyarwanda", "Ikinyarwanda", "Niger-Congo · Bantu", "Latin"),
    "gom": ("Konkani", "कोंकणी", f"{IE} · Indo-Aryan", "Devanagari"),
    "ko": ("Korean", "한국어", "Koreanic", "Hangul"),
    "kri": ("Krio", "Krio", "English-based creole", "Latin"),
    "ku": ("Kurdish (Kurmanji)", "Kurdî", f"{IE} · Iranian", "Latin"),
    "ckb": ("Kurdish (Sorani)", "کوردیی ناوەندی", f"{IE} · Iranian", "Arabic"),
    "ky": ("Kyrgyz", "Кыргызча", "Turkic", "Cyrillic"),
    "lo": ("Lao", "ລາວ", "Kra–Dai", "Lao"),
    "la": ("Latin", "Latina", f"{IE} · Italic", "Latin"),
    "lv": ("Latvian", "Latviešu", f"{IE} · Baltic", "Latin"),
    "ln": ("Lingala", "Lingála", "Niger-Congo · Bantu", "Latin"),
    "lt": ("Lithuanian", "Lietuvių", f"{IE} · Baltic", "Latin"),
    "lg": ("Luganda", "Luganda", "Niger-Congo · Bantu", "Latin"),
    "lb": ("Luxembourgish", "Lëtzebuergesch", f"{IE} · Germanic", "Latin"),
    "mk": ("Macedonian", "Македонски", f"{IE} · Slavic", "Cyrillic"),
    "mai": ("Maithili", "मैथिली", f"{IE} · Indo-Aryan", "Devanagari"),
    "mg": ("Malagasy", "Malagasy", "Austronesian", "Latin"),
    "ms": ("Malay", "Bahasa Melayu", "Austronesian", "Latin"),
    "ml": ("Malayalam", "മലയാളം", "Dravidian", "Malayalam"),
    "mt": ("Maltese", "Malti", "Afroasiatic · Semitic", "Latin"),
    "mi": ("Maori", "Te Reo Māori", "Austronesian · Polynesian", "Latin"),
    "mr": ("Marathi", "मराठी", f"{IE} · Indo-Aryan", "Devanagari"),
    "mni-Mtei": ("Meiteilon (Manipuri)", "ꯃꯦꯇꯦꯟꯂꯣꯟ", "Sino-Tibetan · Tibeto-Burman", "Meitei Mayek"),
    "lus": ("Mizo", "Mizo ṭawng", "Sino-Tibetan · Tibeto-Burman", "Latin"),
    "mn": ("Mongolian", "Монгол", "Mongolic", "Cyrillic"),
    "my": ("Burmese (Myanmar)", "မြန်မာစာ", "Sino-Tibetan · Tibeto-Burman", "Myanmar"),
    "ne": ("Nepali", "नेपाली", f"{IE} · Indo-Aryan", "Devanagari"),
    "no": ("Norwegian", "Norsk", f"{IE} · Germanic", "Latin"),
    "or": ("Odia", "ଓଡ଼ିଆ", f"{IE} · Indo-Aryan", "Odia"),
    "om": ("Oromo", "Afaan Oromoo", "Afroasiatic · Cushitic", "Latin"),
    "ps": ("Pashto", "پښتو", f"{IE} · Iranian", "Arabic"),
    "fa": ("Persian", "فارسی", f"{IE} · Iranian", "Arabic"),
    "pl": ("Polish", "Polski", f"{IE} · Slavic", "Latin"),
    "pt": ("Portuguese", "Português", f"{IE} · Romance", "Latin"),
    "pa": ("Punjabi", "ਪੰਜਾਬੀ", f"{IE} · Indo-Aryan", "Gurmukhi"),
    "qu": ("Quechua", "Runasimi", "Quechuan", "Latin"),
    "ro": ("Romanian", "Română", f"{IE} · Romance", "Latin"),
    "ru": ("Russian", "Русский", f"{IE} · Slavic", "Cyrillic"),
    "sm": ("Samoan", "Gagana Samoa", "Austronesian · Polynesian", "Latin"),
    "sa": ("Sanskrit", "संस्कृतम्", f"{IE} · Indo-Aryan", "Devanagari"),
    "gd": ("Scots Gaelic", "Gàidhlig", f"{IE} · Celtic", "Latin"),
    "nso": ("Sepedi", "Sesotho sa Leboa", "Niger-Congo · Bantu", "Latin"),
    "sr": ("Serbian", "Српски", f"{IE} · Slavic", "Cyrillic"),
    "st": ("Sesotho", "Sesotho", "Niger-Congo · Bantu", "Latin"),
    "sn": ("Shona", "chiShona", "Niger-Congo · Bantu", "Latin"),
    "sd": ("Sindhi", "سنڌي", f"{IE} · Indo-Aryan", "Arabic"),
    "si": ("Sinhala", "සිංහල", f"{IE} · Indo-Aryan", "Sinhala"),
    "sk": ("Slovak", "Slovenčina", f"{IE} · Slavic", "Latin"),
    "sl": ("Slovenian", "Slovenščina", f"{IE} · Slavic", "Latin"),
    "so": ("Somali", "Soomaali", "Afroasiatic · Cushitic", "Latin"),
    "es": ("Spanish", "Español", f"{IE} · Romance", "Latin"),
    "su": ("Sundanese", "Basa Sunda", "Austronesian", "Latin"),
    "sw": ("Swahili", "Kiswahili", "Niger-Congo · Bantu", "Latin"),
    "sv": ("Swedish", "Svenska", f"{IE} · Germanic", "Latin"),
    "tg": ("Tajik", "Тоҷикӣ", f"{IE} · Iranian", "Cyrillic"),
    "ta": ("Tamil", "தமிழ்", "Dravidian", "Tamil"),
    "tt": ("Tatar", "Татарча", "Turkic", "Cyrillic"),
    "te": ("Telugu", "తెలుగు", "Dravidian", "Telugu"),
    "th": ("Thai", "ไทย", "Kra–Dai", "Thai"),
    "ti": ("Tigrinya", "ትግርኛ", "Afroasiatic · Semitic", "Ethiopic"),
    "ts": ("Tsonga", "Xitsonga", "Niger-Congo · Bantu", "Latin"),
    "tr": ("Turkish", "Türkçe", "Turkic", "Latin"),
    "tk": ("Turkmen", "Türkmençe", "Turkic", "Latin"),
    "ak": ("Twi", "Twi", "Niger-Congo · Kwa", "Latin"),
    "uk": ("Ukrainian", "Українська", f"{IE} · Slavic", "Cyrillic"),
    "ur": ("Urdu", "اردو", f"{IE} · Indo-Aryan", "Arabic"),
    "ug": ("Uyghur", "ئۇيغۇرچە", "Turkic", "Arabic"),
    "uz": ("Uzbek", "Oʻzbekcha", "Turkic", "Latin"),
    "vi": ("Vietnamese", "Tiếng Việt", "Austroasiatic", "Latin"),
    "cy": ("Welsh", "Cymraeg", f"{IE} · Celtic", "Latin"),
    "xh": ("Xhosa", "isiXhosa", "Niger-Congo · Bantu", "Latin"),
    "yi": ("Yiddish", "ייִדיש", f"{IE} · Germanic", "Hebrew"),
    "yo": ("Yoruba", "Yorùbá", "Niger-Congo · Volta-Niger", "Latin"),
    "zu": ("Zulu", "isiZulu", "Niger-Congo · Bantu", "Latin"),
}

RTL_SCRIPTS = {"Arabic", "Hebrew", "Thaana"}
UNSPACED = {"ja", "zh-CN", "zh-TW", "th", "lo", "km", "my"}  # no spaces between words


def _supported_codes() -> set[str]:
    table = GoogleTranslator(source="auto", target="en").get_supported_languages(as_dict=True)
    return set(table.values())


SUPPORTED = _supported_codes()


def _build() -> dict[str, dict]:
    out: dict[str, dict] = {}
    for code in sorted(SUPPORTED):
        name, native, family, script = M.get(code, (code, code, "Unclassified", "Latin"))
        out[code] = {
            "code": code, "name": name, "native": native, "family": family,
            "script": script, "rtl": script in RTL_SCRIPTS,
            "writing_system": SCRIPTS[script]["system"],
            "characters": SCRIPTS[script]["characters"],
            "group": SCRIPTS[script]["group"],
            "glyphs": SCRIPTS[script]["glyphs"],
            "unspaced": code in UNSPACED,
        }
    return out


CATALOG = _build()


def get(code: str) -> dict | None:
    return CATALOG.get(code)


def search(q: str = "", group: str = "") -> list[dict]:
    q = q.strip().lower()
    items = list(CATALOG.values())
    if group and group.lower() != "all":
        items = [i for i in items if i["group"].lower() == group.lower()]
    if q:
        items = [i for i in items if q in i["name"].lower() or q in i["native"].lower()
                 or q in i["code"].lower() or q in i["family"].lower() or q in i["script"].lower()]
    return sorted(items, key=lambda i: i["name"])


def groups() -> list[str]:
    order = ["Latin", "Cyrillic", "Arabic", "Indic scripts", "East Asian", "Southeast Asian", "Other scripts"]
    present = {i["group"] for i in CATALOG.values()}
    return [g for g in order if g in present]
