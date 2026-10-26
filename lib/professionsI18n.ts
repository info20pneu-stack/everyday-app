import type { Lang } from './i18n';

/* Professions the birthdays API detects (app/api/birthdays/route.ts → detectProfession), in 14 languages.
   Each row lists the names in the order of PROFESSIONS. */

const PROFESSIONS = [
  'Actress', 'Actor', 'Director', 'Singer', 'Rapper', 'Musician', 'Composer', 'Songwriter',
  'Footballer', 'Basketball Player', 'Tennis Player', 'Boxer', 'Swimmer', 'Golfer', 'Cyclist',
  'Racing Driver', 'Athlete', 'Comedian', 'Model', 'Producer', 'Screenwriter', 'Author',
  'Politician', 'Scientist', 'Chef', 'Artist', 'Architect', 'Personality',
] as const;

const NAMES: Partial<Record<Lang, string[]>> = {
  de: ['Schauspielerin', 'Schauspieler', 'Regisseur', 'Sänger', 'Rapper', 'Musiker', 'Komponist', 'Songwriter',
    'Fußballer', 'Basketballspieler', 'Tennisspieler', 'Boxer', 'Schwimmer', 'Golfer', 'Radfahrer',
    'Rennfahrer', 'Sportler', 'Comedian', 'Model', 'Produzent', 'Drehbuchautor', 'Autor',
    'Politiker', 'Wissenschaftler', 'Koch', 'Künstler', 'Architekt', 'Persönlichkeit'],
  it: ['Attrice', 'Attore', 'Regista', 'Cantante', 'Rapper', 'Musicista', 'Compositore', 'Cantautore',
    'Calciatore', 'Cestista', 'Tennista', 'Pugile', 'Nuotatore', 'Golfista', 'Ciclista',
    'Pilota', 'Atleta', 'Comico', 'Modella', 'Produttore', 'Sceneggiatore', 'Scrittore',
    'Politico', 'Scienziato', 'Chef', 'Artista', 'Architetto', 'Personaggio'],
  fr: ['Actrice', 'Acteur', 'Réalisateur', 'Chanteur', 'Rappeur', 'Musicien', 'Compositeur', 'Auteur-compositeur',
    'Footballeur', 'Basketteur', 'Joueur de tennis', 'Boxeur', 'Nageur', 'Golfeur', 'Cycliste',
    'Pilote', 'Athlète', 'Humoriste', 'Mannequin', 'Producteur', 'Scénariste', 'Écrivain',
    'Homme politique', 'Scientifique', 'Chef', 'Artiste', 'Architecte', 'Personnalité'],
  cs: ['Herečka', 'Herec', 'Režisér', 'Zpěvák', 'Rapper', 'Hudebník', 'Skladatel', 'Textař',
    'Fotbalista', 'Basketbalista', 'Tenista', 'Boxer', 'Plavec', 'Golfista', 'Cyklista',
    'Závodník', 'Sportovec', 'Komik', 'Model', 'Producent', 'Scenárista', 'Spisovatel',
    'Politik', 'Vědec', 'Kuchař', 'Umělec', 'Architekt', 'Osobnost'],
  es: ['Actriz', 'Actor', 'Director', 'Cantante', 'Rapero', 'Músico', 'Compositor', 'Cantautor',
    'Futbolista', 'Baloncestista', 'Tenista', 'Boxeador', 'Nadador', 'Golfista', 'Ciclista',
    'Piloto', 'Atleta', 'Humorista', 'Modelo', 'Productor', 'Guionista', 'Escritor',
    'Político', 'Científico', 'Chef', 'Artista', 'Arquitecto', 'Personalidad'],
  pl: ['Aktorka', 'Aktor', 'Reżyser', 'Piosenkarz', 'Raper', 'Muzyk', 'Kompozytor', 'Autor piosenek',
    'Piłkarz', 'Koszykarz', 'Tenisista', 'Bokser', 'Pływak', 'Golfista', 'Kolarz',
    'Kierowca wyścigowy', 'Sportowiec', 'Komik', 'Model', 'Producent', 'Scenarzysta', 'Pisarz',
    'Polityk', 'Naukowiec', 'Kucharz', 'Artysta', 'Architekt', 'Osobowość'],
  pt: ['Atriz', 'Ator', 'Realizador', 'Cantor', 'Rapper', 'Músico', 'Compositor', 'Cantautor',
    'Futebolista', 'Basquetebolista', 'Tenista', 'Pugilista', 'Nadador', 'Golfista', 'Ciclista',
    'Piloto', 'Atleta', 'Humorista', 'Modelo', 'Produtor', 'Argumentista', 'Escritor',
    'Político', 'Cientista', 'Chef', 'Artista', 'Arquiteto', 'Personalidade'],
  ru: ['Актриса', 'Актёр', 'Режиссёр', 'Певец', 'Рэпер', 'Музыкант', 'Композитор', 'Автор песен',
    'Футболист', 'Баскетболист', 'Теннисист', 'Боксёр', 'Пловец', 'Гольфист', 'Велогонщик',
    'Автогонщик', 'Спортсмен', 'Комик', 'Модель', 'Продюсер', 'Сценарист', 'Писатель',
    'Политик', 'Учёный', 'Шеф-повар', 'Художник', 'Архитектор', 'Личность'],
  zh: ['女演员', '演员', '导演', '歌手', '说唱歌手', '音乐人', '作曲家', '词曲作者',
    '足球运动员', '篮球运动员', '网球运动员', '拳击手', '游泳运动员', '高尔夫球手', '自行车运动员',
    '赛车手', '运动员', '喜剧演员', '模特', '制片人', '编剧', '作家',
    '政治家', '科学家', '厨师', '艺术家', '建筑师', '知名人物'],
  ja: ['女優', '俳優', '映画監督', '歌手', 'ラッパー', 'ミュージシャン', '作曲家', 'ソングライター',
    'サッカー選手', 'バスケットボール選手', 'テニス選手', 'ボクサー', '競泳選手', 'ゴルファー', '自転車選手',
    'レーシングドライバー', 'アスリート', 'コメディアン', 'モデル', 'プロデューサー', '脚本家', '作家',
    '政治家', '科学者', 'シェフ', 'アーティスト', '建築家', '著名人'],
  ko: ['여배우', '배우', '영화감독', '가수', '래퍼', '음악가', '작곡가', '작사가',
    '축구 선수', '농구 선수', '테니스 선수', '권투 선수', '수영 선수', '골프 선수', '사이클 선수',
    '레이싱 드라이버', '운동선수', '코미디언', '모델', '프로듀서', '시나리오 작가', '작가',
    '정치인', '과학자', '셰프', '예술가', '건축가', '유명인'],
  ar: ['ممثلة', 'ممثل', 'مخرج', 'مغنٍّ', 'مغني راب', 'موسيقي', 'ملحّن', 'كاتب أغانٍ',
    'لاعب كرة قدم', 'لاعب كرة سلة', 'لاعب تنس', 'ملاكم', 'سبّاح', 'لاعب غولف', 'دراج',
    'سائق سباقات', 'رياضي', 'كوميدي', 'عارض أزياء', 'منتج', 'كاتب سيناريو', 'كاتب',
    'سياسي', 'عالِم', 'طاهٍ', 'فنان', 'مهندس معماري', 'شخصية'],
  hi: ['अभिनेत्री', 'अभिनेता', 'निर्देशक', 'गायक', 'रैपर', 'संगीतकार', 'संगीत रचनाकार', 'गीतकार',
    'फ़ुटबॉलर', 'बास्केटबॉल खिलाड़ी', 'टेनिस खिलाड़ी', 'मुक्केबाज़', 'तैराक', 'गोल्फ़र', 'साइकिलिस्ट',
    'रेसिंग ड्राइवर', 'एथलीट', 'हास्य कलाकार', 'मॉडल', 'निर्माता', 'पटकथा लेखक', 'लेखक',
    'राजनेता', 'वैज्ञानिक', 'शेफ़', 'कलाकार', 'वास्तुकार', 'हस्ती'],
};

/** Profession from the birthdays API in the UI language; English (and unknown values) unchanged. */
export function professionName(profession: string, lang: Lang): string {
  const i = (PROFESSIONS as readonly string[]).indexOf(profession);
  return i >= 0 ? NAMES[lang]?.[i] ?? profession : profession;
}
