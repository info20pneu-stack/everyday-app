import type { Lang } from '../i18n';
import { AR, EN, ES, FR, HI, IT, JA, KO, PT, RU, ZH } from './connectSetsNative';

/* Word sets for "Connect Four Words" (Spoj čtveřici).
   Every set has 4 groups × 4 words, ordered from the easiest group (yellow) to the hardest (purple).
   Each set hides at least one red herring — a word that looks like it belongs to another group
   (noted in the `// trap:` comment). The partition into groups is always unique.
   Regional sets are written for native speakers (CZ / SK / DE / PL here, the other languages in
   connectSetsNative.ts); WORLD sets carry a translation for every app language. Pure data + helpers, safe to import on the server. */

export type Region =
  | 'cz' | 'sk' | 'de' | 'pl'
  | 'en' | 'fr' | 'it' | 'es' | 'pt' | 'ru' | 'zh' | 'ja' | 'ko' | 'ar' | 'hi'
  | 'world';

/** Order of the region picker. */
export const REGIONS: Region[] = ['cz', 'sk', 'de', 'pl', 'en', 'fr', 'it', 'es', 'pt', 'ru', 'zh', 'ja', 'ko', 'ar', 'hi', 'world'];

/** Flag of each region (ISO code for components/Flag; 'world' = globe). */
const REGION_FLAG_CODE: Record<Region, string> = {
  cz: 'cz', sk: 'sk', de: 'de', pl: 'pl', en: 'gb', fr: 'fr', it: 'it', es: 'es', pt: 'pt',
  ru: 'ru', zh: 'cn', ja: 'jp', ko: 'kr', ar: 'sa', hi: 'in', world: 'world',
};

/** Flag code for a region. Portuguese shows Brazil's flag to visitors from Brazil. */
export function regionFlag(region: Region, visitorCountry?: string | null): string {
  if (region === 'pt' && visitorCountry?.toUpperCase() === 'BR') return 'br';
  return REGION_FLAG_CODE[region];
}

/** The same flag as an emoji, for the plain-text share message. */
export function regionFlagEmoji(region: Region, visitorCountry?: string | null): string {
  const code = regionFlag(region, visitorCountry);
  if (code === 'world') return '🌍';
  return [...code.toUpperCase()].map(c => String.fromCodePoint(0x1F1E6 + c.charCodeAt(0) - 65)).join('');
}

/** Language the words of a region are written in (BCP 47). WORLD follows the UI language. */
export const REGION_LANG: Record<Exclude<Region, 'world'>, string> = {
  cz: 'cs', sk: 'sk', de: 'de', pl: 'pl', en: 'en', fr: 'fr', it: 'it', es: 'es', pt: 'pt',
  ru: 'ru', zh: 'zh-Hans', ja: 'ja', ko: 'ko', ar: 'ar', hi: 'hi',
};

export function isRegion(v: unknown): v is Region {
  return typeof v === 'string' && (REGIONS as string[]).includes(v);
}

const COUNTRY_REGION: Record<string, Region> = {
  CZ: 'cz', SK: 'sk', DE: 'de', AT: 'de', PL: 'pl',
  GB: 'en', US: 'en', IE: 'en', CA: 'en', AU: 'en', NZ: 'en',
  IT: 'it', SM: 'it',
  FR: 'fr', BE: 'fr', LU: 'fr', MC: 'fr',
  ES: 'es', MX: 'es', AR: 'es', CO: 'es', CL: 'es', PE: 'es', VE: 'es',
  PT: 'pt', BR: 'pt', AO: 'pt', MZ: 'pt',
  RU: 'ru', BY: 'ru', KZ: 'ru',
  CN: 'zh', TW: 'zh', HK: 'zh', SG: 'zh',
  JP: 'ja', KR: 'ko',
  SA: 'ar', AE: 'ar', EG: 'ar', MA: 'ar', DZ: 'ar', QA: 'ar', KW: 'ar', JO: 'ar',
  IN: 'hi',
};

/** Region from Vercel's `x-vercel-ip-country` header (Switzerland also uses the browser language).
    Null when the country is unknown (e.g. local dev). */
export function regionFromCountry(country: string | null | undefined, acceptLanguage?: string | null): Region | null {
  const cc = (country ?? '').trim().toUpperCase();
  if (!/^[A-Z]{2}$/.test(cc) || cc === 'XX') return null;
  if (cc === 'CH') {
    const first = (acceptLanguage ?? '').split(',')[0].trim().toLowerCase();
    if (first.startsWith('fr')) return 'fr';
    if (first.startsWith('it')) return 'it';
    return 'de';
  }
  return COUNTRY_REGION[cc] ?? 'world';
}

/** Fallback region from the UI language when there is no geolocation. */
export function regionFromLang(lang: Lang): Region {
  if (lang === 'cs') return 'cz';
  return lang;
}

export interface ConnectGroup { name: string; words: string[] }
export interface ConnectSet { region: Region; index: number; groups: ConnectGroup[] }

type LocalGroup = [name: string, words: [string, string, string, string]];
type LocalSet = [LocalGroup, LocalGroup, LocalGroup, LocalGroup];

/* ═════════════════════════════ CZ ═════════════════════════════ */
const CZ: LocalSet[] = [
  [ // trap: Braník is also a beer
    ['Řeky', ['Vltava', 'Ohře', 'Labe', 'Jizera']],
    ['Hokejové pojmy', ['Buly', 'Puk', 'Mantinel', 'Hokejka']],
    ['Pivní značky', ['Kozel', 'Gambrinus', 'Radegast', 'Bernard']],
    ['Pražské čtvrti', ['Žižkov', 'Karlín', 'Podolí', 'Braník']],
  ],
  [ // trap: Krtek is an animal, Fík is a fruit
    ['Ovoce', ['Jablko', 'Hruška', 'Švestka', 'Meruňka']],
    ['Lesní zvířata', ['Liška', 'Jezevec', 'Srnec', 'Veverka']],
    ['Hory', ['Sněžka', 'Lysá hora', 'Praděd', 'Ještěd']],
    ['Večerníčkové postavy', ['Rumcajs', 'Křemílek', 'Krtek', 'Fík']],
  ],
  [ // trap: Vánočka is sweet too
    ['Hlavní jídla', ['Svíčková', 'Guláš', 'Řízek', 'Bramborák']],
    ['Nápoje', ['Kofola', 'Becherovka', 'Slivovice', 'Medovina']],
    ['Sladkosti', ['Koláč', 'Buchta', 'Bábovka', 'Štrúdl']],
    ['Pečivo', ['Rohlík', 'Houska', 'Veka', 'Vánočka']],
  ],
  [ // trap: Hašek is also a writer
    ['Fotbalisté', ['Nedvěd', 'Rosický', 'Čech', 'Schick']],
    ['Tenisté', ['Navrátilová', 'Berdych', 'Kvitová', 'Lendl']],
    ['Spisovatelé', ['Čapek', 'Hrabal', 'Kundera', 'Němcová']],
    ['Hokejisté', ['Jágr', 'Pastrňák', 'Voráček', 'Hašek']],
  ],
  [ // trap: Karlovy Vary is a regional capital
    ['Hrady', ['Karlštejn', 'Křivoklát', 'Kokořín', 'Bouzov']],
    ['Krajská města', ['Brno', 'Ostrava', 'Plzeň', 'Olomouc']],
    ['Rybníky', ['Rožmberk', 'Svět', 'Bezdrev', 'Velký Tisý']],
    ['Lázně', ['Karlovy Vary', 'Luhačovice', 'Teplice', 'Poděbrady']],
  ],
  [ // trap: Liška is also a fox
    ['Stromy', ['Dub', 'Buk', 'Smrk', 'Jedle']],
    ['Byliny', ['Heřmánek', 'Máta', 'Šalvěj', 'Kopřiva']],
    ['Zvířata', ['Jelen', 'Kanec', 'Zajíc', 'Jezevec']],
    ['Houby', ['Hřib', 'Bedla', 'Muchomůrka', 'Liška']],
  ],
  [ // trap: Svěrák also acted
    ['Filmy', ['Pelíšky', 'Kolja', 'Obecná škola', 'Samotáři']],
    ['Seriály', ['Arabela', 'Návštěvníci', 'Pan Tau', 'Chalupáři']],
    ['Herci', ['Hrušínský', 'Menšík', 'Brodský', 'Kemr']],
    ['Režiséři', ['Forman', 'Menzel', 'Hřebejk', 'Svěrák']],
  ],
  [ // trap: Prší is also weather
    ['Počasí', ['Sněží', 'Mrzne', 'Fouká', 'Hřmí']],
    ['Části auta', ['Volant', 'Kapota', 'Blatník', 'Výfuk']],
    ['Hudební nástroje', ['Housle', 'Dudy', 'Cimbál', 'Harmonika']],
    ['Karetní hry', ['Prší', 'Mariáš', 'Kanasta', 'Žolíky']],
  ],
  [ // trap: Kapr is a fish
    ['Ryby', ['Štika', 'Candát', 'Sumec', 'Pstruh']],
    ['Velikonoce', ['Pomlázka', 'Kraslice', 'Beránek', 'Řehtačka']],
    ['Mikulášská', ['Mikuláš', 'Čert', 'Anděl', 'Nadílka']],
    ['Vánoce', ['Kapr', 'Stromek', 'Cukroví', 'Betlém']],
  ],
  [ // trap: Pravítko is also in a school bag
    ['Ve škole', ['Tabule', 'Křída', 'Penál', 'Žákovská']],
    ['V kuchyni', ['Vařečka', 'Struhadlo', 'Naběračka', 'Cedník']],
    ['V kanceláři', ['Sešívačka', 'Šanon', 'Kopírka', 'Razítko']],
    ['Rýsování', ['Kružítko', 'Úhloměr', 'Trojúhelník', 'Pravítko']],
  ],
  [ // trap: Boxer is also a sportsman
    ['Ptáci', ['Sýkora', 'Vrabec', 'Kos', 'Čáp']],
    ['Plazi', ['Ještěrka', 'Užovka', 'Zmije', 'Želva']],
    ['Sportovci', ['Plavec', 'Běžec', 'Šermíř', 'Veslař']],
    ['Psí plemena', ['Pudl', 'Jezevčík', 'Dalmatin', 'Boxer']],
  ],
  [ // trap: Havel was a president
    ['Skladatelé', ['Smetana', 'Dvořák', 'Janáček', 'Martinů']],
    ['Malíři', ['Mucha', 'Lada', 'Kupka', 'Mánes']],
    ['Prezidenti', ['Masaryk', 'Beneš', 'Klaus', 'Zeman']],
    ['Dramatici', ['Tyl', 'Klicpera', 'Čapek', 'Havel']],
  ],
  [ // trap: Sparta also plays football
    ['Automobilky', ['Škoda', 'Tatra', 'Praga', 'Aero']],
    ['Pražské mosty', ['Karlův', 'Mánesův', 'Nuselský', 'Libeňský']],
    ['Fotbalové kluby', ['Zbrojovka', 'Baník', 'Bohemians', 'Viktoria']],
    ['Hokejové kluby', ['Kometa', 'Motor', 'Verva', 'Sparta']],
  ],
  [ // trap: Kilo and Litr are units, Loket is an old unit
    ['Nářadí', ['Kladivo', 'Pila', 'Kleště', 'Šroubovák']],
    ['Části těla', ['Loket', 'Koleno', 'Rameno', 'Kotník']],
    ['Jednotky', ['Metr', 'Gram', 'Sekunda', 'Ampér']],
    ['Slang pro peníze', ['Kilo', 'Litr', 'Pětikilo', 'Bůra']],
  ],
];

/* ═════════════════════════════ SK ═════════════════════════════ */
const SK: LocalSet[] = [
  [ // trap: Nitra and Trenčín are towns
    ['Pohoria', ['Tatry', 'Fatra', 'Pieniny', 'Poľana']],
    ['Mestá', ['Košice', 'Prešov', 'Žilina', 'Trnava']],
    ['Rieky', ['Váh', 'Hron', 'Ipeľ', 'Nitra']],
    ['Hrady', ['Bojnice', 'Devín', 'Strečno', 'Trenčín']],
  ],
  [ // trap: Žinčica is a drink
    ['Jedlá', ['Halušky', 'Kapustnica', 'Lokše', 'Pirohy']],
    ['Zvieratá Tatier', ['Kamzík', 'Svišť', 'Medveď', 'Rys']],
    ['Nápoje', ['Kofola', 'Borovička', 'Slivovica', 'Vinea']],
    ['Z ovčieho mlieka', ['Bryndza', 'Oštiepok', 'Parenica', 'Žinčica']],
  ],
  [ // trap: Mečíř is an Olympic champion
    ['Hokejisti', ['Šatan', 'Hossa', 'Chára', 'Pálffy']],
    ['Futbalisti', ['Hamšík', 'Škriniar', 'Dúbravka', 'Lobotka']],
    ['Olympijskí víťazi', ['Vlhová', 'Kuzminová', 'Martikán', 'Tóth']],
    ['Tenisti', ['Hantuchová', 'Cibulková', 'Hrbatý', 'Mečíř']],
  ],
  [ // trap: Kráľ is also a chess piece
    ['Spisovatelia', ['Hviezdoslav', 'Kukučín', 'Timrava', 'Tajovský']],
    ['Šachové figúrky', ['Veža', 'Strelec', 'Jazdec', 'Pešiak']],
    ['Kroj', ['Kordulka', 'Krpce', 'Parta', 'Opasok']],
    ['Štúrovci', ['Štúr', 'Hurban', 'Hodža', 'Kráľ']],
  ],
  [ // trap: Polka is also a Polish woman
    ['Hudobné nástroje', ['Fujara', 'Gajdy', 'Cimbal', 'Heligónka']],
    ['Tradície', ['Šibačka', 'Fašiangy', 'Dožinky', 'Morena']],
    ['Národnosti', ['Češka', 'Maďarka', 'Rusínka', 'Ukrajinka']],
    ['Tance', ['Odzemok', 'Čardáš', 'Valčík', 'Polka']],
  ],
  [ // trap: Kuriatko is also a chick
    ['Stromy', ['Dub', 'Buk', 'Smrek', 'Jedľa']],
    ['Bylinky', ['Rumanček', 'Mäta', 'Šalvia', 'Žihľava']],
    ['Hydina', ['Sliepka', 'Hus', 'Kačica', 'Morka']],
    ['Huby', ['Dubák', 'Bedľa', 'Muchotrávka', 'Kuriatko']],
  ],
  [ // trap: Dúbravka is also a goalkeeper
    ['Rieky', ['Dunaj', 'Morava', 'Váh', 'Hron']],
    ['Pamiatky Bratislavy', ['Michalská brána', 'Modrý kostolík', 'Slavín', 'Čumil']],
    ['Brankári', ['Halák', 'Lašák', 'Budaj', 'Kozáčik']],
    ['Mestské časti Bratislavy', ['Petržalka', 'Ružinov', 'Karlova Ves', 'Dúbravka']],
  ],
  [ // trap: Prší is also weather
    ['Počasie', ['Sneží', 'Mrzne', 'Fúka', 'Hrmí']],
    ['Časti auta', ['Volant', 'Kapota', 'Blatník', 'Výfuk']],
    ['Hudobné nástroje', ['Husle', 'Gitara', 'Klavír', 'Bubon']],
    ['Kartové hry', ['Prší', 'Mariáš', 'Kanasta', 'Žolíky']],
  ],
  [ // trap: Kapor is a fish
    ['Ryby', ['Šťuka', 'Zubáč', 'Sumec', 'Pstruh']],
    ['Veľká noc', ['Korbáč', 'Kraslica', 'Baránok', 'Oblievačka']],
    ['Na Mikuláša', ['Mikuláš', 'Čert', 'Anjel', 'Čižma']],
    ['Vianoce', ['Kapor', 'Oblátky', 'Kapustnica', 'Stromček']],
  ],
  [ // trap: Pravítko is also in a school bag
    ['V škole', ['Tabuľa', 'Krieda', 'Peračník', 'Žiacka knižka']],
    ['V kuchyni', ['Varecha', 'Strúhadlo', 'Naberačka', 'Cedidlo']],
    ['V kancelárii', ['Zošívačka', 'Šanón', 'Kopírka', 'Pečiatka']],
    ['Rysovanie', ['Kružidlo', 'Uhlomer', 'Trojuholník', 'Pravítko']],
  ],
  [ // trap: Boxer is also a sportsman
    ['Vtáky', ['Sýkorka', 'Vrabec', 'Drozd', 'Bocian']],
    ['Plazy', ['Jašterica', 'Užovka', 'Vretenica', 'Korytnačka']],
    ['Športovci', ['Plavec', 'Bežec', 'Šermiar', 'Veslár']],
    ['Plemená psov', ['Pudel', 'Jazvečík', 'Dalmatín', 'Boxer']],
  ],
  [ // trap: Kováč was a president
    ['Kapely', ['Elán', 'Desmod', 'Peha', 'Tublatanka']],
    ['Skladatelia', ['Suchoň', 'Cikker', 'Moyzes', 'Bella']],
    ['Prezidenti', ['Schuster', 'Gašparovič', 'Kiska', 'Čaputová']],
    ['Remeslá', ['Stolár', 'Murár', 'Krajčír', 'Kováč']],
  ],
  [ // trap: Jaguar is a big cat, Apollo a god
    ['Mačkovité šelmy', ['Lev', 'Tiger', 'Gepard', 'Rys']],
    ['Grécki bohovia', ['Zeus', 'Hermes', 'Poseidón', 'Afrodita']],
    ['Autá zo Slovenska', ['Volkswagen', 'Kia', 'Peugeot', 'Jaguar']],
    ['Bratislavské mosty', ['Most SNP', 'Starý most', 'Lafranconi', 'Apollo']],
  ],
  [ // trap: Lakeť is an old unit
    ['Náradie', ['Kladivo', 'Píla', 'Kliešte', 'Skrutkovač']],
    ['Hudba', ['Tón', 'Rytmus', 'Akord', 'Takt']],
    ['Jednotky', ['Meter', 'Gram', 'Sekunda', 'Ampér']],
    ['Časti tela', ['Lakeť', 'Koleno', 'Rameno', 'Členok']],
  ],
];

/* ═════════════════════════════ DE ═════════════════════════════ */
const DE: LocalSet[] = [
  [ // trap: Bremen is also a city
    ['Flüsse', ['Rhein', 'Elbe', 'Donau', 'Weser']],
    ['Automarken', ['Audi', 'Opel', 'Porsche', 'Mercedes']],
    ['Städte', ['München', 'Köln', 'Leipzig', 'Dortmund']],
    ['Bundesländer', ['Bayern', 'Hessen', 'Sachsen', 'Bremen']],
  ],
  [ // trap: Frankfurter is a sausage, Berliner a person
    ['Getränke', ['Apfelschorle', 'Radler', 'Spezi', 'Glühwein']],
    ['Würste', ['Bratwurst', 'Weißwurst', 'Currywurst', 'Leberwurst']],
    ['Gebäck', ['Brezel', 'Brötchen', 'Semmel', 'Berliner']],
    ['Einwohner', ['Hamburger', 'Frankfurter', 'Kölner', 'Münchner']],
  ],
  [ // trap: Rapunzel is also a salad, Bach a stream
    ['Salate', ['Rucola', 'Eisberg', 'Endivie', 'Chicorée']],
    ['Gewässer', ['Teich', 'See', 'Fluss', 'Weiher']],
    ['Märchen', ['Rotkäppchen', 'Schneewittchen', 'Aschenputtel', 'Rapunzel']],
    ['Komponisten', ['Beethoven', 'Wagner', 'Brahms', 'Bach']],
  ],
  [ // trap: Müller is a trade, Graf a title
    ['Berufe', ['Bäcker', 'Metzger', 'Tischler', 'Maurer']],
    ['Adelstitel', ['Fürst', 'Herzog', 'Baron', 'Freiherr']],
    ['Tennisprofis', ['Becker', 'Kerber', 'Zverev', 'Graf']],
    ['Fußballer', ['Neuer', 'Kroos', 'Lahm', 'Müller']],
  ],
  [ // trap: Kiel is also a city
    ['Inseln', ['Sylt', 'Rügen', 'Usedom', 'Föhr']],
    ['Berge', ['Zugspitze', 'Brocken', 'Watzmann', 'Feldberg']],
    ['Hafenstädte', ['Rostock', 'Lübeck', 'Bremerhaven', 'Cuxhaven']],
    ['Teile eines Schiffs', ['Bug', 'Heck', 'Mast', 'Kiel']],
  ],
  [ // trap: Kiefer is also a tree
    ['Pilze', ['Pfifferling', 'Steinpilz', 'Fliegenpilz', 'Champignon']],
    ['Waldtiere', ['Reh', 'Hirsch', 'Wildschwein', 'Dachs']],
    ['Bäume', ['Eiche', 'Buche', 'Tanne', 'Fichte']],
    ['Körperteile', ['Knie', 'Ellbogen', 'Schulter', 'Kiefer']],
  ],
  [ // trap: Dame is also a chess piece
    ['Kartenspiele', ['Skat', 'Doppelkopf', 'Rommé', 'Mau-Mau']],
    ['Spielzeug', ['Kreisel', 'Puppe', 'Teddy', 'Murmel']],
    ['Schachfiguren', ['König', 'Turm', 'Bauer', 'Springer']],
    ['Brettspiele', ['Schach', 'Mühle', 'Halma', 'Dame']],
  ],
  [ // trap: Flügel is also a piano
    ['Wetter', ['Regen', 'Schnee', 'Hagel', 'Nebel']],
    ['Autoteile', ['Lenkrad', 'Motorhaube', 'Kotflügel', 'Auspuff']],
    ['Instrumente', ['Geige', 'Trompete', 'Harfe', 'Flöte']],
    ['Am Vogel', ['Schnabel', 'Feder', 'Kralle', 'Flügel']],
  ],
  [ // trap: Lebkuchen is sold at the Wiesn
    ['Ostern', ['Osterhase', 'Osterei', 'Osterfeuer', 'Lamm']],
    ['Karneval', ['Kamelle', 'Konfetti', 'Rosenmontag', 'Funkenmariechen']],
    ['Oktoberfest', ['Maß', 'Dirndl', 'Lederhose', 'Wiesn']],
    ['Weihnachten', ['Adventskranz', 'Christstollen', 'Krippe', 'Lebkuchen']],
  ],
  [ // trap: Lineal is also in a school bag
    ['In der Schule', ['Tafel', 'Kreide', 'Federmäppchen', 'Zeugnis']],
    ['In der Küche', ['Kochlöffel', 'Reibe', 'Schöpfkelle', 'Sieb']],
    ['Im Büro', ['Hefter', 'Ordner', 'Kopierer', 'Stempel']],
    ['Geometrie', ['Zirkel', 'Geodreieck', 'Winkelmesser', 'Lineal']],
  ],
  [ // trap: Boxer is also a sportsman
    ['Vögel', ['Amsel', 'Meise', 'Specht', 'Storch']],
    ['Reptilien', ['Eidechse', 'Natter', 'Kreuzotter', 'Schildkröte']],
    ['Sportler', ['Schwimmer', 'Läufer', 'Fechter', 'Ruderer']],
    ['Hunderassen', ['Pudel', 'Dackel', 'Dalmatiner', 'Boxer']],
  ],
  [ // trap: Kohl is also a vegetable
    ['Dichter', ['Goethe', 'Schiller', 'Heine', 'Rilke']],
    ['Maler', ['Dürer', 'Cranach', 'Holbein', 'Richter']],
    ['Gemüse', ['Möhre', 'Lauch', 'Erbse', 'Spinat']],
    ['Kanzler', ['Adenauer', 'Brandt', 'Merkel', 'Kohl']],
  ],
  [ // trap: Golf and Polo are sports
    ['Automarken', ['Audi', 'Opel', 'Porsche', 'BMW']],
    ['Am Fahrrad', ['Lenker', 'Sattel', 'Pedal', 'Speiche']],
    ['Sportarten', ['Tennis', 'Hockey', 'Rugby', 'Squash']],
    ['VW-Modelle', ['Passat', 'Tiguan', 'Golf', 'Polo']],
  ],
  [ // trap: Elle is an old unit
    ['Werkzeug', ['Hammer', 'Säge', 'Zange', 'Schraubenzieher']],
    ['Musik', ['Ton', 'Takt', 'Akkord', 'Rhythmus']],
    ['Einheiten', ['Meter', 'Gramm', 'Sekunde', 'Ampere']],
    ['Am Körper', ['Knie', 'Schulter', 'Knöchel', 'Elle']],
  ],
];

/* ═════════════════════════════ PL ═════════════════════════════ */
const PL: LocalSet[] = [
  [ // trap: Nysa is also a town
    ['Góry', ['Tatry', 'Bieszczady', 'Karkonosze', 'Pieniny']],
    ['Jeziora', ['Śniardwy', 'Mamry', 'Hańcza', 'Gopło']],
    ['Miasta', ['Kraków', 'Gdańsk', 'Poznań', 'Wrocław']],
    ['Rzeki', ['Wisła', 'Odra', 'Warta', 'Nysa']],
  ],
  [ // trap: Kefir is dairy
    ['Potrawy', ['Pierogi', 'Bigos', 'Żurek', 'Gołąbki']],
    ['Desery', ['Sernik', 'Makowiec', 'Szarlotka', 'Pączek']],
    ['Sery', ['Oscypek', 'Bundz', 'Twaróg', 'Bryndza']],
    ['Napoje', ['Kompot', 'Wódka', 'Piwo', 'Kefir']],
  ],
  [ // trap: Żyła is also a vein
    ['Piłkarze', ['Lewandowski', 'Błaszczykowski', 'Szczęsny', 'Boniek']],
    ['Tenisiści', ['Świątek', 'Radwańska', 'Hurkacz', 'Linette']],
    ['Krwiobieg', ['Serce', 'Tętnica', 'Krew', 'Osocze']],
    ['Skoczkowie', ['Małysz', 'Stoch', 'Kubacki', 'Żyła']],
  ],
  [ // trap: Kazimierz is also a king
    ['Pisarze', ['Mickiewicz', 'Sienkiewicz', 'Prus', 'Reymont']],
    ['Kompozytorzy', ['Chopin', 'Moniuszko', 'Penderecki', 'Górecki']],
    ['Królowie', ['Chrobry', 'Sobieski', 'Jagiełło', 'Batory']],
    ['Dzielnice Krakowa', ['Podgórze', 'Nowa Huta', 'Kleparz', 'Kazimierz']],
  ],
  [ // trap: Żabka is a frog, Biedronka a shop
    ['Postacie z bajek', ['Reksio', 'Bolek', 'Lolek', 'Koziołek Matołek']],
    ['Zwierzęta leśne', ['Lis', 'Jeż', 'Dzik', 'Sarna']],
    ['Sklepy', ['Żabka', 'Lidl', 'Auchan', 'Rossmann']],
    ['Owady', ['Mrówka', 'Komar', 'Osa', 'Biedronka']],
  ],
  [ // trap: Kurka is also a little hen
    ['Drzewa', ['Dąb', 'Buk', 'Sosna', 'Brzoza']],
    ['Zioła', ['Rumianek', 'Mięta', 'Szałwia', 'Pokrzywa']],
    ['Drób', ['Kaczka', 'Gęś', 'Indyk', 'Kogut']],
    ['Grzyby', ['Prawdziwek', 'Muchomor', 'Maślak', 'Kurka']],
  ],
  [ // trap: Makao is a city, Tysiąc a number
    ['Instrumenty', ['Skrzypce', 'Gitara', 'Fortepian', 'Bęben']],
    ['Miasta w Azji', ['Tokio', 'Seul', 'Bangkok', 'Hongkong']],
    ['Liczby', ['Sto', 'Milion', 'Miliard', 'Tuzin']],
    ['Gry karciane', ['Wojna', 'Pasjans', 'Makao', 'Tysiąc']],
  ],
  [ // trap: Maska is also a costume
    ['Pogoda', ['Deszcz', 'Śnieg', 'Grad', 'Mgła']],
    ['Narzędzia', ['Młotek', 'Piła', 'Obcęgi', 'Śrubokręt']],
    ['Bal przebierańców', ['Kostium', 'Peruka', 'Konfetti', 'Serpentyna']],
    ['Części auta', ['Kierownica', 'Błotnik', 'Tłumik', 'Maska']],
  ],
  [ // trap: Karp is a fish
    ['Ryby', ['Szczupak', 'Sandacz', 'Sum', 'Pstrąg']],
    ['Wielkanoc', ['Pisanka', 'Śmigus-dyngus', 'Palma', 'Rzeżucha']],
    ['Mikołajki', ['Mikołaj', 'Renifer', 'Sanie', 'Prezent']],
    ['Wigilia', ['Karp', 'Opłatek', 'Barszcz', 'Kutia']],
  ],
  [ // trap: Linijka is also in a pencil case
    ['W szkole', ['Tablica', 'Kreda', 'Piórnik', 'Dzienniczek']],
    ['W kuchni', ['Warząchew', 'Tarka', 'Chochla', 'Durszlak']],
    ['W biurze', ['Zszywacz', 'Segregator', 'Kserokopiarka', 'Pieczątka']],
    ['Geometria', ['Cyrkiel', 'Kątomierz', 'Ekierka', 'Linijka']],
  ],
  [ // trap: Bokser is also a sportsman
    ['Ptaki', ['Wróbel', 'Sikorka', 'Dzięcioł', 'Bocian']],
    ['Gady', ['Jaszczurka', 'Zaskroniec', 'Żmija', 'Żółw']],
    ['Sportowcy', ['Pływak', 'Biegacz', 'Szermierz', 'Wioślarz']],
    ['Rasy psów', ['Pudel', 'Jamnik', 'Dalmatyńczyk', 'Bokser']],
  ],
  [ // trap: Wyspiański also wrote poetry
    ['Prezydenci', ['Wałęsa', 'Kwaśniewski', 'Komorowski', 'Duda']],
    ['Naukowcy', ['Kopernik', 'Skłodowska', 'Heweliusz', 'Banach']],
    ['Poeci', ['Szymborska', 'Miłosz', 'Herbert', 'Tuwim']],
    ['Malarze', ['Matejko', 'Malczewski', 'Kossak', 'Wyspiański']],
  ],
  [ // trap: Wisła is a river, Warszawa a city
    ['Rzeki', ['Odra', 'Warta', 'Bug', 'Narew']],
    ['Miasta', ['Kraków', 'Łódź', 'Gdańsk', 'Lublin']],
    ['Kluby piłkarskie', ['Legia', 'Lech', 'Górnik', 'Wisła']],
    ['Auta z PRL', ['Maluch', 'Polonez', 'Syrena', 'Warszawa']],
  ],
  [ // trap: Łokieć is an old unit
    ['Narzędzia', ['Młotek', 'Piła', 'Obcęgi', 'Wiertarka']],
    ['Muzyka', ['Ton', 'Takt', 'Akord', 'Rytm']],
    ['Jednostki', ['Metr', 'Gram', 'Sekunda', 'Amper']],
    ['Części ciała', ['Kolano', 'Ramię', 'Kostka', 'Łokieć']],
  ],
];

/* ═════════════════════════════ WORLD ═════════════════════════════
   Each string holds one translation per language, separated by "|", in this order: */
const W_LANGS: Lang[] = ['en', 'de', 'it', 'fr', 'cs', 'es', 'pl', 'pt', 'ru', 'zh', 'ja', 'ko', 'ar', 'hi'];

type WorldGroup = [name: string, words: [string, string, string, string]];
type WorldSet = [WorldGroup, WorldGroup, WorldGroup, WorldGroup];

const WORLD: WorldSet[] = [
  [ // trap: Mercury is also a metal, Tomato a fruit
    ['Fruit|Obst|Frutta|Fruits|Ovoce|Frutas|Owoce|Frutas|Фрукты|水果|果物|과일|فواكه|फल', [
      'Apple|Apfel|Mela|Pomme|Jablko|Manzana|Jabłko|Maçã|Яблоко|苹果|リンゴ|사과|تفاحة|सेब',
      'Banana|Banane|Banana|Banane|Banán|Plátano|Banan|Banana|Банан|香蕉|バナナ|바나나|موز|केला',
      'Cherry|Kirsche|Ciliegia|Cerise|Třešeň|Cereza|Czereśnia|Cereja|Черешня|樱桃|サクランボ|체리|كرز|चेरी',
      'Pear|Birne|Pera|Poire|Hruška|Pera|Gruszka|Pera|Груша|梨|洋ナシ|배|كمثرى|नाशपाती',
    ]],
    ['Vegetables|Gemüse|Verdura|Légumes|Zelenina|Verduras|Warzywa|Legumes|Овощи|蔬菜|野菜|채소|خضروات|सब्ज़ियाँ', [
      'Carrot|Karotte|Carota|Carotte|Mrkev|Zanahoria|Marchew|Cenoura|Морковь|胡萝卜|ニンジン|당근|جزر|गाजर',
      'Potato|Kartoffel|Patata|Pomme de terre|Brambora|Patata|Ziemniak|Batata|Картофель|土豆|ジャガイモ|감자|بطاطس|आलू',
      'Onion|Zwiebel|Cipolla|Oignon|Cibule|Cebolla|Cebula|Cebola|Лук|洋葱|タマネギ|양파|بصل|प्याज़',
      'Tomato|Tomate|Pomodoro|Tomate|Rajče|Tomate|Pomidor|Tomate|Помидор|番茄|トマト|토마토|طماطم|टमाटर',
    ]],
    ['Metals|Metalle|Metalli|Métaux|Kovy|Metales|Metale|Metais|Металлы|金属|金属|금속|معادن|धातुएँ', [
      'Gold|Gold|Oro|Or|Zlato|Oro|Złoto|Ouro|Золото|金|金|금|ذهب|सोना',
      'Silver|Silber|Argento|Argent|Stříbro|Plata|Srebro|Prata|Серебро|银|銀|은|فضة|चाँदी',
      'Iron|Eisen|Ferro|Fer|Železo|Hierro|Żelazo|Ferro|Железо|铁|鉄|철|حديد|लोहा',
      'Copper|Kupfer|Rame|Cuivre|Měď|Cobre|Miedź|Cobre|Медь|铜|銅|구리|نحاس|ताँबा',
    ]],
    ['Planets|Planeten|Pianeti|Planètes|Planety|Planetas|Planety|Planetas|Планеты|行星|惑星|행성|كواكب|ग्रह', [
      'Mars|Mars|Marte|Mars|Mars|Marte|Mars|Marte|Марс|火星|火星|화성|المريخ|मंगल',
      'Venus|Venus|Venere|Vénus|Venuše|Venus|Wenus|Vénus|Венера|金星|金星|금성|الزهرة|शुक्र',
      'Jupiter|Jupiter|Giove|Jupiter|Jupiter|Júpiter|Jowisz|Júpiter|Юпитер|木星|木星|목성|المشتري|बृहस्पति',
      'Mercury|Merkur|Mercurio|Mercure|Merkur|Mercurio|Merkury|Mercúrio|Меркурий|水星|水星|수성|عطارد|बुध',
    ]],
  ],
  [ // trap: the Bat flies, the Dolphin swims
    ['Insects|Insekten|Insetti|Insectes|Hmyz|Insectos|Owady|Insetos|Насекомые|昆虫|昆虫|곤충|حشرات|कीड़े', [
      'Bee|Biene|Ape|Abeille|Včela|Abeja|Pszczoła|Abelha|Пчела|蜜蜂|ハチ|벌|نحلة|मधुमक्खी',
      'Ant|Ameise|Formica|Fourmi|Mravenec|Hormiga|Mrówka|Formiga|Муравей|蚂蚁|アリ|개미|نملة|चींटी',
      'Butterfly|Schmetterling|Farfalla|Papillon|Motýl|Mariposa|Motyl|Borboleta|Бабочка|蝴蝶|チョウ|나비|فراشة|तितली',
      'Mosquito|Mücke|Zanzara|Moustique|Komár|Mosquito|Komar|Mosquito|Комар|蚊子|蚊|모기|بعوضة|मच्छर',
    ]],
    ['Fish|Fische|Pesci|Poissons|Ryby|Peces|Ryby|Peixes|Рыбы|鱼类|魚|물고기|أسماك|मछलियाँ', [
      'Shark|Hai|Squalo|Requin|Žralok|Tiburón|Rekin|Tubarão|Акула|鲨鱼|サメ|상어|قرش|शार्क',
      'Salmon|Lachs|Salmone|Saumon|Losos|Salmón|Łosoś|Salmão|Лосось|三文鱼|サケ|연어|سلمون|सैल्मन',
      'Tuna|Thunfisch|Tonno|Thon|Tuňák|Atún|Tuńczyk|Atum|Тунец|金枪鱼|マグロ|참치|تونة|टूना',
      'Cod|Kabeljau|Merluzzo|Cabillaud|Treska|Bacalao|Dorsz|Bacalhau|Треска|鳕鱼|タラ|대구|سمك القد|कॉड',
    ]],
    ['Birds|Vögel|Uccelli|Oiseaux|Ptáci|Aves|Ptaki|Aves|Птицы|鸟类|鳥|새|طيور|पक्षी', [
      'Eagle|Adler|Aquila|Aigle|Orel|Águila|Orzeł|Águia|Орёл|鹰|ワシ|독수리|نسر|गरुड़',
      'Owl|Eule|Gufo|Hibou|Sova|Búho|Sowa|Coruja|Сова|猫头鹰|フクロウ|부엉이|بومة|उल्लू',
      'Parrot|Papagei|Pappagallo|Perroquet|Papoušek|Loro|Papuga|Papagaio|Попугай|鹦鹉|オウム|앵무새|ببغاء|तोता',
      'Penguin|Pinguin|Pinguino|Pingouin|Tučňák|Pingüino|Pingwin|Pinguim|Пингвин|企鹅|ペンギン|펭귄|بطريق|पेंगुइन',
    ]],
    ['Mammals|Säugetiere|Mammiferi|Mammifères|Savci|Mamíferos|Ssaki|Mamíferos|Млекопитающие|哺乳动物|哺乳類|포유류|ثدييات|स्तनधारी', [
      'Dog|Hund|Cane|Chien|Pes|Perro|Pies|Cão|Собака|狗|イヌ|개|كلب|कुत्ता',
      'Horse|Pferd|Cavallo|Cheval|Kůň|Caballo|Koń|Cavalo|Лошадь|马|ウマ|말|حصان|घोड़ा',
      'Dolphin|Delfin|Delfino|Dauphin|Delfín|Delfín|Delfin|Golfinho|Дельфин|海豚|イルカ|돌고래|دلفين|डॉल्फ़िन',
      'Bat|Fledermaus|Pipistrello|Chauve-souris|Netopýr|Murciélago|Nietoperz|Morcego|Летучая мышь|蝙蝠|コウモリ|박쥐|خفاش|चमगादड़',
    ]],
  ],
  [ // trap: Water polo is also a ball sport
    ['Combat sports|Kampfsport|Sport da combattimento|Sports de combat|Bojové sporty|Deportes de combate|Sporty walki|Desportos de combate|Единоборства|格斗运动|格闘技|격투기|رياضات قتالية|लड़ाकू खेल', [
      'Judo|Judo|Judo|Judo|Judo|Judo|Judo|Judo|Дзюдо|柔道|柔道|유도|جودو|जूडो',
      'Karate|Karate|Karate|Karaté|Karate|Kárate|Karate|Caraté|Карате|空手道|空手|가라테|كاراتيه|कराटे',
      'Boxing|Boxen|Pugilato|Boxe|Box|Boxeo|Boks|Boxe|Бокс|拳击|ボクシング|권투|ملاكمة|मुक्केबाज़ी',
      'Wrestling|Ringen|Lotta|Lutte|Zápas|Lucha|Zapasy|Luta livre|Борьба|摔跤|レスリング|레슬링|مصارعة|कुश्ती',
    ]],
    ['Winter sports|Wintersport|Sport invernali|Sports d’hiver|Zimní sporty|Deportes de invierno|Sporty zimowe|Desportos de inverno|Зимние виды спорта|冬季运动|ウィンタースポーツ|동계 스포츠|رياضات شتوية|शीतकालीन खेल', [
      'Skiing|Skifahren|Sci|Ski|Lyžování|Esquí|Narciarstwo|Esqui|Лыжи|滑雪|スキー|스키|تزلج|स्कीइंग',
      'Ice hockey|Eishockey|Hockey su ghiaccio|Hockey sur glace|Lední hokej|Hockey sobre hielo|Hokej na lodzie|Hóquei no gelo|Хоккей|冰球|アイスホッケー|아이스하키|هوكي الجليد|आइस हॉकी',
      'Biathlon|Biathlon|Biathlon|Biathlon|Biatlon|Biatlón|Biathlon|Biatlo|Биатлон|冬季两项|バイアスロン|바이애슬론|البياثلون|बायथलॉन',
      'Curling|Curling|Curling|Curling|Curling|Curling|Curling|Curling|Кёрлинг|冰壶|カーリング|컬링|الكيرلنغ|कर्लिंग',
    ]],
    ['Ball sports|Ballsport|Sport con la palla|Sports de balle|Míčové sporty|Deportes de pelota|Gry z piłką|Desportos com bola|Игры с мячом|球类运动|球技|구기 종목|رياضات الكرة|गेंद वाले खेल', [
      'Football|Fußball|Calcio|Football|Fotbal|Fútbol|Piłka nożna|Futebol|Футбол|足球|サッカー|축구|كرة القدم|फ़ुटबॉल',
      'Tennis|Tennis|Tennis|Tennis|Tenis|Tenis|Tenis|Ténis|Теннис|网球|テニス|테니스|تنس|टेनिस',
      'Basketball|Basketball|Pallacanestro|Basket|Basketbal|Baloncesto|Koszykówka|Basquetebol|Баскетбол|篮球|バスケットボール|농구|كرة السلة|बास्केटबॉल',
      'Volleyball|Volleyball|Pallavolo|Volley|Volejbal|Voleibol|Siatkówka|Voleibol|Волейбол|排球|バレーボール|배구|كرة الطائرة|वॉलीबॉल',
    ]],
    ['Water sports|Wassersport|Sport acquatici|Sports nautiques|Vodní sporty|Deportes acuáticos|Sporty wodne|Desportos aquáticos|Водные виды спорта|水上运动|水上競技|수상 스포츠|رياضات مائية|जल खेल', [
      'Swimming|Schwimmen|Nuoto|Natation|Plavání|Natación|Pływanie|Natação|Плавание|游泳|水泳|수영|سباحة|तैराकी',
      'Rowing|Rudern|Canottaggio|Aviron|Veslování|Remo|Wioślarstwo|Remo|Гребля|赛艇|ボート|조정|تجديف|नौकायन',
      'Diving|Wasserspringen|Tuffi|Plongeon|Skoky do vody|Saltos|Skoki do wody|Saltos para a água|Прыжки в воду|跳水|飛込|다이빙|غطس|गोताखोरी',
      'Water polo|Wasserball|Pallanuoto|Water-polo|Vodní pólo|Waterpolo|Piłka wodna|Polo aquático|Водное поло|水球|水球|수구|كرة الماء|वॉटर पोलो',
    ]],
  ],
  [ // trap: the Triangle is also a shape
    ['Wind instruments|Blasinstrumente|Strumenti a fiato|Instruments à vent|Dechové nástroje|Instrumentos de viento|Instrumenty dęte|Instrumentos de sopro|Духовые инструменты|管乐器|管楽器|관악기|آلات النفخ|फूँक वाद्य', [
      'Flute|Flöte|Flauto|Flûte|Flétna|Flauta|Flet|Flauta|Флейта|长笛|フルート|플루트|فلوت|बाँसुरी',
      'Trumpet|Trompete|Tromba|Trompette|Trubka|Trompeta|Trąbka|Trompete|Труба|小号|トランペット|트럼펫|بوق|तुरही',
      'Clarinet|Klarinette|Clarinetto|Clarinette|Klarinet|Clarinete|Klarnet|Clarinete|Кларнет|单簧管|クラリネット|클라리넷|كلارينيت|क्लैरिनेट',
      'Saxophone|Saxofon|Sassofono|Saxophone|Saxofon|Saxofón|Saksofon|Saxofone|Саксофон|萨克斯|サックス|색소폰|ساكسفون|सैक्सोफ़ोन',
    ]],
    ['String instruments|Saiteninstrumente|Strumenti a corda|Instruments à cordes|Strunné nástroje|Instrumentos de cuerda|Instrumenty strunowe|Instrumentos de cordas|Струнные инструменты|弦乐器|弦楽器|현악기|آلات وترية|तार वाद्य', [
      'Violin|Geige|Violino|Violon|Housle|Violín|Skrzypce|Violino|Скрипка|小提琴|バイオリン|바이올린|كمان|वायलिन',
      'Guitar|Gitarre|Chitarra|Guitare|Kytara|Guitarra|Gitara|Guitarra|Гитара|吉他|ギター|기타|غيتار|गिटार',
      'Harp|Harfe|Arpa|Harpe|Harfa|Arpa|Harfa|Harpa|Арфа|竖琴|ハープ|하프|قيثارة|हार्प',
      'Cello|Cello|Violoncello|Violoncelle|Violoncello|Violonchelo|Wiolonczela|Violoncelo|Виолончель|大提琴|チェロ|첼로|تشيلو|चेलो',
    ]],
    ['Shapes|Formen|Forme|Formes|Tvary|Formas|Kształty|Formas|Фигуры|形状|図形|도형|أشكال|आकृतियाँ', [
      'Circle|Kreis|Cerchio|Cercle|Kruh|Círculo|Koło|Círculo|Круг|圆形|円|원|دائرة|वृत्त',
      'Square|Quadrat|Quadrato|Carré|Čtverec|Cuadrado|Kwadrat|Quadrado|Квадрат|正方形|正方形|정사각형|مربع|वर्ग',
      'Oval|Oval|Ovale|Ovale|Ovál|Óvalo|Owal|Oval|Овал|椭圆形|楕円|타원|شكل بيضاوي|अंडाकार',
      'Hexagon|Sechseck|Esagono|Hexagone|Šestiúhelník|Hexágono|Sześciokąt|Hexágono|Шестиугольник|六边形|六角形|육각형|سداسي|षट्भुज',
    ]],
    ['Percussion|Schlaginstrumente|Percussioni|Percussions|Bicí nástroje|Percusión|Instrumenty perkusyjne|Percussão|Ударные инструменты|打击乐器|打楽器|타악기|آلات الإيقاع|ताल वाद्य', [
      'Drum|Trommel|Tamburo|Tambour|Buben|Tambor|Bęben|Tambor|Барабан|鼓|太鼓|북|طبل|ढोल',
      'Xylophone|Xylofon|Xilofono|Xylophone|Xylofon|Xilófono|Ksylofon|Xilofone|Ксилофон|木琴|木琴|실로폰|إكسيليفون|ज़ाइलोफ़ोन',
      'Tambourine|Tamburin|Tamburello|Tambourin|Tamburína|Pandereta|Tamburyn|Pandeireta|Бубен|铃鼓|タンバリン|탬버린|دف|डफली',
      'Triangle|Triangel|Triangolo|Triangle|Triangl|Triángulo|Trójkąt|Triângulo|Треугольник|三角铁|トライアングル|트라이앵글|مثلث|त्रिकोण',
    ]],
  ],
  [ // trap: the Sink is in the bathroom too
    ['Furniture|Möbel|Mobili|Meubles|Nábytek|Muebles|Meble|Móveis|Мебель|家具|家具|가구|أثاث|फ़र्नीचर', [
      'Chair|Stuhl|Sedia|Chaise|Židle|Silla|Krzesło|Cadeira|Стул|椅子|椅子|의자|كرسي|कुर्सी',
      'Table|Tisch|Tavolo|Table|Stůl|Mesa|Stół|Mesa|Стол|桌子|テーブル|탁자|طاولة|मेज़',
      'Bed|Bett|Letto|Lit|Postel|Cama|Łóżko|Cama|Кровать|床|ベッド|침대|سرير|पलंग',
      'Sofa|Sofa|Divano|Canapé|Pohovka|Sofá|Kanapa|Sofá|Диван|沙发|ソファ|소파|أريكة|सोफ़ा',
    ]],
    ['Tools|Werkzeug|Attrezzi|Outils|Nářadí|Herramientas|Narzędzia|Ferramentas|Инструменты|工具|工具|공구|أدوات|औज़ार', [
      'Hammer|Hammer|Martello|Marteau|Kladivo|Martillo|Młotek|Martelo|Молоток|锤子|ハンマー|망치|مطرقة|हथौड़ा',
      'Saw|Säge|Sega|Scie|Pila|Sierra|Piła|Serra|Пила|锯子|のこぎり|톱|منشار|आरी',
      'Drill|Bohrmaschine|Trapano|Perceuse|Vrtačka|Taladro|Wiertarka|Berbequim|Дрель|电钻|ドリル|드릴|مثقاب|ड्रिल',
      'Pliers|Zange|Pinze|Pince|Kleště|Alicates|Obcęgi|Alicate|Плоскогубцы|钳子|ペンチ|펜치|كماشة|प्लास',
    ]],
    ['Bathroom|Badezimmer|Bagno|Salle de bain|Koupelna|Baño|Łazienka|Casa de banho|Ванная комната|浴室|浴室|욕실|الحمام|बाथरूम', [
      'Bathtub|Badewanne|Vasca da bagno|Baignoire|Vana|Bañera|Wanna|Banheira|Ванна|浴缸|浴槽|욕조|حوض الاستحمام|बाथटब',
      'Shower|Dusche|Doccia|Douche|Sprcha|Ducha|Prysznic|Chuveiro|Душ|淋浴|シャワー|샤워기|دش|शावर',
      'Towel|Handtuch|Asciugamano|Serviette|Ručník|Toalla|Ręcznik|Toalha|Полотенце|毛巾|タオル|수건|منشفة|तौलिया',
      'Toothbrush|Zahnbürste|Spazzolino|Brosse à dents|Zubní kartáček|Cepillo de dientes|Szczoteczka do zębów|Escova de dentes|Зубная щётка|牙刷|歯ブラシ|칫솔|فرشاة أسنان|टूथब्रश',
    ]],
    ['In the kitchen|In der Küche|In cucina|Dans la cuisine|V kuchyni|En la cocina|W kuchni|Na cozinha|На кухне|厨房里|台所|부엌|في المطبخ|रसोई में', [
      'Pot|Topf|Pentola|Casserole|Hrnec|Olla|Garnek|Panela|Кастрюля|汤锅|鍋|냄비|قدر|पतीला',
      'Frying pan|Pfanne|Padella|Poêle|Pánev|Sartén|Patelnia|Frigideira|Сковорода|平底锅|フライパン|프라이팬|مقلاة|कड़ाही',
      'Kettle|Wasserkocher|Bollitore|Bouilloire|Konvice|Hervidor|Czajnik|Chaleira|Чайник|水壶|やかん|주전자|غلاية|केतली',
      'Sink|Spüle|Lavello|Évier|Dřez|Fregadero|Zlew|Lava-loiça|Раковина|水槽|流し台|싱크대|حوض المطبخ|सिंक',
    ]],
  ],
  [ // trap: Turkey is partly in Europe
    ['South America|Südamerika|Sud America|Amérique du Sud|Jižní Amerika|Sudamérica|Ameryka Południowa|América do Sul|Южная Америка|南美洲|南アメリカ|남아메리카|أمريكا الجنوبية|दक्षिण अमेरिका', [
      'Brazil|Brasilien|Brasile|Brésil|Brazílie|Brasil|Brazylia|Brasil|Бразилия|巴西|ブラジル|브라질|البرازيل|ब्राज़ील',
      'Argentina|Argentinien|Argentina|Argentine|Argentina|Argentina|Argentyna|Argentina|Аргентина|阿根廷|アルゼンチン|아르헨티나|الأرجنتين|अर्जेंटीना',
      'Chile|Chile|Cile|Chili|Chile|Chile|Chile|Chile|Чили|智利|チリ|칠레|تشيلي|चिली',
      'Peru|Peru|Perù|Pérou|Peru|Perú|Peru|Peru|Перу|秘鲁|ペルー|페루|بيرو|पेरू',
    ]],
    ['Africa|Afrika|Africa|Afrique|Afrika|África|Afryka|África|Африка|非洲|アフリカ|아프리카|أفريقيا|अफ़्रीका', [
      'Egypt|Ägypten|Egitto|Égypte|Egypt|Egipto|Egipt|Egito|Египет|埃及|エジプト|이집트|مصر|मिस्र',
      'Kenya|Kenia|Kenya|Kenya|Keňa|Kenia|Kenia|Quénia|Кения|肯尼亚|ケニア|케냐|كينيا|केन्या',
      'Nigeria|Nigeria|Nigeria|Nigeria|Nigérie|Nigeria|Nigeria|Nigéria|Нигерия|尼日利亚|ナイジェリア|나이지리아|نيجيريا|नाइजीरिया',
      'Morocco|Marokko|Marocco|Maroc|Maroko|Marruecos|Maroko|Marrocos|Марокко|摩洛哥|モロッコ|모로코|المغرب|मोरक्को',
    ]],
    ['Europe|Europa|Europa|Europe|Evropa|Europa|Europa|Europa|Европа|欧洲|ヨーロッパ|유럽|أوروبا|यूरोप', [
      'France|Frankreich|Francia|France|Francie|Francia|Francja|França|Франция|法国|フランス|프랑스|فرنسا|फ़्रांस',
      'Spain|Spanien|Spagna|Espagne|Španělsko|España|Hiszpania|Espanha|Испания|西班牙|スペイン|스페인|إسبانيا|स्पेन',
      'Poland|Polen|Polonia|Pologne|Polsko|Polonia|Polska|Polónia|Польша|波兰|ポーランド|폴란드|بولندا|पोलैंड',
      'Norway|Norwegen|Norvegia|Norvège|Norsko|Noruega|Norwegia|Noruega|Норвегия|挪威|ノルウェー|노르웨이|النرويج|नॉर्वे',
    ]],
    ['Asia|Asien|Asia|Asie|Asie|Asia|Azja|Ásia|Азия|亚洲|アジア|아시아|آسيا|एशिया', [
      'Japan|Japan|Giappone|Japon|Japonsko|Japón|Japonia|Japão|Япония|日本|日本|일본|اليابان|जापान',
      'India|Indien|India|Inde|Indie|India|Indie|Índia|Индия|印度|インド|인도|الهند|भारत',
      'Vietnam|Vietnam|Vietnam|Vietnam|Vietnam|Vietnam|Wietnam|Vietname|Вьетнам|越南|ベトナム|베트남|فيتنام|वियतनाम',
      'Turkey|Türkei|Turchia|Turquie|Turecko|Turquía|Turcja|Turquia|Турция|土耳其|トルコ|튀르키예|تركيا|तुर्की',
    ]],
  ],
  [ // trap: the Peanut is not a nut
    ['Flowers|Blumen|Fiori|Fleurs|Květiny|Flores|Kwiaty|Flores|Цветы|花卉|花|꽃|زهور|फूल', [
      'Rose|Rose|Rosa|Rose|Růže|Rosa|Róża|Rosa|Роза|玫瑰|バラ|장미|وردة|गुलाब',
      'Tulip|Tulpe|Tulipano|Tulipe|Tulipán|Tulipán|Tulipan|Túlipa|Тюльпан|郁金香|チューリップ|튤립|توليب|ट्यूलिप',
      'Lily|Lilie|Giglio|Lys|Lilie|Lirio|Lilia|Lírio|Лилия|百合|ユリ|백합|زنبق|लिली',
      'Daisy|Gänseblümchen|Margherita|Marguerite|Sedmikráska|Margarita|Stokrotka|Margarida|Ромашка|雏菊|デイジー|데이지|أقحوان|डेज़ी',
    ]],
    ['Trees|Bäume|Alberi|Arbres|Stromy|Árboles|Drzewa|Árvores|Деревья|树木|木|나무|أشجار|पेड़', [
      'Oak|Eiche|Quercia|Chêne|Dub|Roble|Dąb|Carvalho|Дуб|橡树|ナラ|참나무|بلوط|बलूत',
      'Birch|Birke|Betulla|Bouleau|Bříza|Abedul|Brzoza|Bétula|Берёза|桦树|シラカバ|자작나무|بتولا|भोजपत्र',
      'Maple|Ahorn|Acero|Érable|Javor|Arce|Klon|Bordo|Клён|枫树|カエデ|단풍나무|قيقب|मेपल',
      'Willow|Weide|Salice|Saule|Vrba|Sauce|Wierzba|Salgueiro|Ива|柳树|ヤナギ|버드나무|صفصاف|विलो',
    ]],
    ['Nuts|Nüsse|Frutta a guscio|Fruits à coque|Ořechy|Frutos secos|Orzechy|Frutos secos|Орехи|坚果|ナッツ|견과류|مكسرات|मेवे', [
      'Walnut|Walnuss|Noce|Noix|Vlašský ořech|Nuez|Orzech włoski|Noz|Грецкий орех|核桃|クルミ|호두|جوز|अखरोट',
      'Hazelnut|Haselnuss|Nocciola|Noisette|Lískový ořech|Avellana|Orzech laskowy|Avelã|Фундук|榛子|ヘーゼルナッツ|헤이즐넛|بندق|हेज़लनट',
      'Almond|Mandel|Mandorla|Amande|Mandle|Almendra|Migdał|Amêndoa|Миндаль|杏仁|アーモンド|아몬드|لوز|बादाम',
      'Cashew|Cashew|Anacardo|Noix de cajou|Kešu|Anacardo|Nerkowiec|Caju|Кешью|腰果|カシューナッツ|캐슈너트|كاجو|काजू',
    ]],
    ['Legumes|Hülsenfrüchte|Legumi|Légumineuses|Luštěniny|Legumbres|Rośliny strączkowe|Leguminosas|Бобовые|豆类|豆類|콩류|البقوليات|दलहन', [
      'Pea|Erbse|Pisello|Petit pois|Hrách|Guisante|Groch|Ervilha|Горох|豌豆|エンドウ|완두콩|بازلاء|मटर',
      'Bean|Bohne|Fagiolo|Haricot|Fazole|Judía|Fasola|Feijão|Фасоль|芸豆|インゲン豆|강낭콩|فاصولياء|राजमा',
      'Lentil|Linse|Lenticchia|Lentille|Čočka|Lenteja|Soczewica|Lentilha|Чечевица|小扁豆|レンズ豆|렌틸콩|عدس|मसूर',
      'Peanut|Erdnuss|Arachide|Cacahuète|Arašíd|Cacahuete|Orzeszek ziemny|Amendoim|Арахис|花生|ピーナッツ|땅콩|فول سوداني|मूँगफली',
    ]],
  ],
  [ // trap: the Balloon also flies
    ['On land|An Land|Su strada|Sur terre|Po souši|Por tierra|Na lądzie|Por terra|По суше|陆地交通|陸の乗り物|육상 교통|على اليابسة|ज़मीन पर', [
      'Car|Auto|Auto|Voiture|Auto|Coche|Samochód|Carro|Автомобиль|汽车|自動車|자동차|سيارة|कार',
      'Bus|Bus|Autobus|Bus|Autobus|Autobús|Autobus|Autocarro|Автобус|公交车|バス|버스|حافلة|बस',
      'Train|Zug|Treno|Train|Vlak|Tren|Pociąg|Comboio|Поезд|火车|電車|기차|قطار|रेलगाड़ी',
      'Bicycle|Fahrrad|Bicicletta|Vélo|Kolo|Bicicleta|Rower|Bicicleta|Велосипед|自行车|自転車|자전거|دراجة|साइकिल',
    ]],
    ['On water|Auf dem Wasser|In acqua|Sur l’eau|Na vodě|En el agua|Na wodzie|Na água|На воде|水上交通|水の乗り物|해상 교통|على الماء|पानी पर', [
      'Ship|Schiff|Nave|Navire|Loď|Barco|Statek|Navio|Корабль|轮船|船|배|سفينة|जहाज़',
      'Canoe|Kanu|Canoa|Canoë|Kánoe|Canoa|Kanadyjka|Canoa|Каноэ|独木舟|カヌー|카누|زورق|डोंगी',
      'Yacht|Jacht|Yacht|Yacht|Jachta|Yate|Jacht|Iate|Яхта|游艇|ヨット|요트|يخت|नौका',
      'Submarine|U-Boot|Sottomarino|Sous-marin|Ponorka|Submarino|Okręt podwodny|Submarino|Подводная лодка|潜艇|潜水艦|잠수함|غواصة|पनडुब्बी',
    ]],
    ['In the air|In der Luft|In aria|Dans les airs|Ve vzduchu|En el aire|W powietrzu|No ar|В воздухе|空中交通|空の乗り物|항공|في الجو|हवा में', [
      'Plane|Flugzeug|Aereo|Avion|Letadlo|Avión|Samolot|Avião|Самолёт|飞机|飛行機|비행기|طائرة|हवाई जहाज़',
      'Helicopter|Hubschrauber|Elicottero|Hélicoptère|Vrtulník|Helicóptero|Helikopter|Helicóptero|Вертолёт|直升机|ヘリコプター|헬리콥터|مروحية|हेलीकॉप्टर',
      'Rocket|Rakete|Razzo|Fusée|Raketa|Cohete|Rakieta|Foguete|Ракета|火箭|ロケット|로켓|صاروخ|रॉकेट',
      'Glider|Segelflugzeug|Aliante|Planeur|Kluzák|Planeador|Szybowiec|Planador|Планер|滑翔机|グライダー|글라이더|طائرة شراعية|ग्लाइडर',
    ]],
    ['Birthday party|Geburtstagsfeier|Festa di compleanno|Fête d’anniversaire|Narozeninová oslava|Fiesta de cumpleaños|Przyjęcie urodzinowe|Festa de aniversário|День рождения|生日派对|誕生日パーティー|생일 파티|حفلة عيد ميلاد|जन्मदिन पार्टी', [
      'Cake|Torte|Torta|Gâteau|Dort|Pastel|Tort|Bolo|Торт|蛋糕|ケーキ|케이크|كعكة|केक',
      'Candle|Kerze|Candelina|Bougie|Svíčka|Vela|Świeczka|Vela|Свеча|蜡烛|ろうそく|초|شمعة|मोमबत्ती',
      'Gift|Geschenk|Regalo|Cadeau|Dárek|Regalo|Prezent|Presente|Подарок|礼物|プレゼント|선물|هدية|उपहार',
      'Balloon|Luftballon|Palloncino|Ballon|Balónek|Globo|Balon|Balão|Воздушный шар|气球|風船|풍선|بالون|गुब्बारा',
    ]],
  ],
  [ // trap: the Rainbow is also weather
    ['Seasons|Jahreszeiten|Stagioni|Saisons|Roční období|Estaciones|Pory roku|Estações do ano|Времена года|季节|季節|계절|فصول السنة|ऋतुएँ', [
      'Spring|Frühling|Primavera|Printemps|Jaro|Primavera|Wiosna|Primavera|Весна|春天|春|봄|الربيع|वसंत',
      'Summer|Sommer|Estate|Été|Léto|Verano|Lato|Verão|Лето|夏天|夏|여름|الصيف|गर्मी',
      'Autumn|Herbst|Autunno|Automne|Podzim|Otoño|Jesień|Outono|Осень|秋天|秋|가을|الخريف|पतझड़',
      'Winter|Winter|Inverno|Hiver|Zima|Invierno|Zima|Inverno|Зима|冬天|冬|겨울|الشتاء|सर्दी',
    ]],
    ['Times of day|Tageszeiten|Momenti della giornata|Moments de la journée|Části dne|Momentos del día|Pory dnia|Partes do dia|Время суток|一天中的时段|時間帯|하루의 때|أوقات اليوم|दिन के पहर', [
      'Morning|Morgen|Mattina|Matin|Ráno|Mañana|Rano|Manhã|Утро|早晨|朝|아침|الصباح|सुबह',
      'Noon|Mittag|Mezzogiorno|Midi|Poledne|Mediodía|Południe|Meio-dia|Полдень|中午|昼|정오|الظهر|दोपहर',
      'Evening|Abend|Sera|Soir|Večer|Tarde|Wieczór|Fim de tarde|Вечер|傍晚|夕方|저녁|المساء|शाम',
      'Night|Nacht|Notte|Nuit|Noc|Noche|Noc|Noite|Ночь|夜晚|夜|밤|الليل|रात',
    ]],
    ['Weather|Wetter|Meteo|Météo|Počasí|Tiempo|Pogoda|Tempo|Погода|天气|天気|날씨|الطقس|मौसम', [
      'Rain|Regen|Pioggia|Pluie|Déšť|Lluvia|Deszcz|Chuva|Дождь|雨|雨|비|مطر|बारिश',
      'Snow|Schnee|Neve|Neige|Sníh|Nieve|Śnieg|Neve|Снег|雪|雪|눈|ثلج|बर्फ़',
      'Fog|Nebel|Nebbia|Brouillard|Mlha|Niebla|Mgła|Nevoeiro|Туман|雾|霧|안개|ضباب|कोहरा',
      'Hail|Hagel|Grandine|Grêle|Kroupy|Granizo|Grad|Granizo|Град|冰雹|ひょう|우박|حبات البرد|ओले',
    ]],
    ['In the sky|Am Himmel|Nel cielo|Dans le ciel|Na obloze|En el cielo|Na niebie|No céu|На небе|天空中|空に|하늘에|في السماء|आसमान में', [
      'Moon|Mond|Luna|Lune|Měsíc|Luna|Księżyc|Lua|Луна|月亮|月|달|القمر|चाँद',
      'Star|Stern|Stella|Étoile|Hvězda|Estrella|Gwiazda|Estrela|Звезда|星星|星|별|نجمة|तारा',
      'Comet|Komet|Cometa|Comète|Kometa|Cometa|Kometa|Cometa|Комета|彗星|彗星|혜성|مذنب|धूमकेतु',
      'Rainbow|Regenbogen|Arcobaleno|Arc-en-ciel|Duha|Arcoíris|Tęcza|Arco-íris|Радуга|彩虹|虹|무지개|قوس قزح|इंद्रधनुष',
    ]],
  ],
  [ // trap: Tiramisu is also a dessert
    ['Drinks|Getränke|Bevande|Boissons|Nápoje|Bebidas|Napoje|Bebidas|Напитки|饮料|飲み物|음료|مشروبات|पेय',  [
      'Coffee|Kaffee|Caffè|Café|Káva|Café|Kawa|Café|Кофе|咖啡|コーヒー|커피|قهوة|कॉफ़ी',
      'Tea|Tee|Tè|Thé|Čaj|Té|Herbata|Chá|Чай|茶|お茶|차|شاي|चाय',
      'Juice|Saft|Succo|Jus|Džus|Zumo|Sok|Sumo|Сок|果汁|ジュース|주스|عصير|जूस',
      'Milk|Milch|Latte|Lait|Mléko|Leche|Mleko|Leite|Молоко|牛奶|牛乳|우유|حليب|दूध',
    ]],
    ['Desserts|Desserts|Dolci|Desserts|Dezerty|Postres|Desery|Sobremesas|Десерты|甜点|デザート|디저트|حلويات|मिठाइयाँ', [
      'Ice cream|Eis|Gelato|Glace|Zmrzlina|Helado|Lody|Gelado|Мороженое|冰淇淋|アイスクリーム|아이스크림|آيس كريم|आइसक्रीम',
      'Pancake|Pfannkuchen|Pancake|Crêpe|Palačinka|Tortita|Naleśnik|Panqueca|Блин|煎饼|パンケーキ|팬케이크|فطيرة|पैनकेक',
      'Doughnut|Donut|Ciambella|Beignet|Kobliha|Rosquilla|Pączek|Donut|Пончик|甜甜圈|ドーナツ|도넛|دونات|डोनट',
      'Brownie|Brownie|Brownie|Brownie|Brownie|Brownie|Brownie|Brownie|Брауни|布朗尼|ブラウニー|브라우니|براوني|ब्राउनी',
    ]],
    ['Japanese food|Japanische Küche|Cucina giapponese|Cuisine japonaise|Japonská kuchyně|Comida japonesa|Kuchnia japońska|Comida japonesa|Японская кухня|日本料理|和食|일본 요리|المطبخ الياباني|जापानी खाना', [
      'Sushi|Sushi|Sushi|Sushi|Suši|Sushi|Sushi|Sushi|Суши|寿司|寿司|초밥|سوشي|सुशी',
      'Ramen|Ramen|Ramen|Ramen|Ramen|Ramen|Ramen|Ramen|Рамен|拉面|ラーメン|라멘|رامن|रामेन',
      'Tempura|Tempura|Tempura|Tempura|Tempura|Tempura|Tempura|Tempurá|Темпура|天妇罗|天ぷら|덴푸라|تمبورا|टेम्पुरा',
      'Miso soup|Misosuppe|Zuppa di miso|Soupe miso|Miso polévka|Sopa de miso|Zupa miso|Sopa de missô|Мисо-суп|味噌汤|味噌汁|미소시루|حساء الميسو|मिसो सूप',
    ]],
    ['Italian food|Italienische Küche|Cucina italiana|Cuisine italienne|Italská kuchyně|Comida italiana|Kuchnia włoska|Comida italiana|Итальянская кухня|意大利菜|イタリア料理|이탈리아 요리|المطبخ الإيطالي|इतालवी खाना', [
      'Pizza|Pizza|Pizza|Pizza|Pizza|Pizza|Pizza|Pizza|Пицца|披萨|ピザ|피자|بيتزا|पिज़्ज़ा',
      'Lasagne|Lasagne|Lasagne|Lasagnes|Lasagne|Lasaña|Lasagne|Lasanha|Лазанья|千层面|ラザニア|라자냐|لازانيا|लज़ानिया',
      'Risotto|Risotto|Risotto|Risotto|Rizoto|Risotto|Risotto|Risoto|Ризотто|意式烩饭|リゾット|리소토|ريزوتو|रिसोट्टो',
      'Tiramisu|Tiramisu|Tiramisù|Tiramisu|Tiramisu|Tiramisú|Tiramisu|Tiramisu|Тирамису|提拉米苏|ティラミス|티라미수|تيراميسو|तिरामिसु',
    ]],
  ],
  [ // trap: Skin is the organ of touch
    ['Face|Gesicht|Viso|Visage|Obličej|Cara|Twarz|Rosto|Лицо|脸|顔|얼굴|الوجه|चेहरा', [
      'Eye|Auge|Occhio|Œil|Oko|Ojo|Oko|Olho|Глаз|眼睛|目|눈|عين|आँख',
      'Nose|Nase|Naso|Nez|Nos|Nariz|Nos|Nariz|Нос|鼻子|鼻|코|أنف|नाक',
      'Mouth|Mund|Bocca|Bouche|Ústa|Boca|Usta|Boca|Рот|嘴巴|口|입|فم|मुँह',
      'Ear|Ohr|Orecchio|Oreille|Ucho|Oreja|Ucho|Orelha|Ухо|耳朵|耳|귀|أذن|कान',
    ]],
    ['Emotions|Gefühle|Emozioni|Émotions|Emoce|Emociones|Emocje|Emoções|Эмоции|情绪|感情|감정|المشاعر|भावनाएँ', [
      'Joy|Freude|Gioia|Joie|Radost|Alegría|Radość|Alegria|Радость|快乐|喜び|기쁨|فرح|ख़ुशी',
      'Anger|Wut|Rabbia|Colère|Hněv|Ira|Złość|Raiva|Гнев|愤怒|怒り|분노|غضب|गुस्सा',
      'Fear|Angst|Paura|Peur|Strach|Miedo|Strach|Medo|Страх|恐惧|恐れ|두려움|خوف|डर',
      'Sadness|Trauer|Tristezza|Tristesse|Smutek|Tristeza|Smutek|Tristeza|Грусть|悲伤|悲しみ|슬픔|حزن|उदासी',
    ]],
    ['Senses|Sinne|Sensi|Sens|Smysly|Sentidos|Zmysły|Sentidos|Органы чувств|感官|感覚|감각|الحواس|इंद्रियाँ', [
      'Sight|Sehen|Vista|Vue|Zrak|Vista|Wzrok|Visão|Зрение|视觉|視覚|시각|البصر|दृष्टि',
      'Hearing|Hören|Udito|Ouïe|Sluch|Oído|Słuch|Audição|Слух|听觉|聴覚|청각|السمع|श्रवण',
      'Smell|Riechen|Olfatto|Odorat|Čich|Olfato|Węch|Olfato|Обоняние|嗅觉|嗅覚|후각|الشم|गंध',
      'Taste|Schmecken|Gusto|Goût|Chuť|Gusto|Smak|Paladar|Вкус|味觉|味覚|미각|التذوق|स्वाद',
    ]],
    ['Organs|Organe|Organi|Organes|Orgány|Órganos|Narządy|Órgãos|Органы|器官|臓器|장기|الأعضاء|अंग', [
      'Heart|Herz|Cuore|Cœur|Srdce|Corazón|Serce|Coração|Сердце|心脏|心臓|심장|قلب|दिल',
      'Lung|Lunge|Polmone|Poumon|Plíce|Pulmón|Płuco|Pulmão|Лёгкое|肺|肺|폐|رئة|फेफड़ा',
      'Liver|Leber|Fegato|Foie|Játra|Hígado|Wątroba|Fígado|Печень|肝脏|肝臓|간|كبد|जिगर',
      'Skin|Haut|Pelle|Peau|Kůže|Piel|Skóra|Pele|Кожа|皮肤|皮膚|피부|جلد|त्वचा',
    ]],
  ],
  [ // trap: the Throne belongs to royalty too
    ['Fairy tales|Märchenwesen|Creature delle fiabe|Êtres des contes|Pohádkové bytosti|Seres de cuento|Postacie z baśni|Seres dos contos|Сказочные существа|童话角色|おとぎ話|동화 속 존재|كائنات خرافية|परीकथा के पात्र', [
      'Dragon|Drache|Drago|Dragon|Drak|Dragón|Smok|Dragão|Дракон|龙|ドラゴン|용|تنين|ड्रैगन',
      'Witch|Hexe|Strega|Sorcière|Čarodějnice|Bruja|Czarownica|Bruxa|Ведьма|女巫|魔女|마녀|ساحرة|चुड़ैल',
      'Giant|Riese|Gigante|Géant|Obr|Gigante|Olbrzym|Gigante|Великан|巨人|巨人|거인|عملاق|दानव',
      'Fairy|Fee|Fata|Fée|Víla|Hada|Wróżka|Fada|Фея|仙女|妖精|요정|جنية|परी',
    ]],
    ['Royalty|Königshaus|Famiglia reale|Famille royale|Královská rodina|Realeza|Rodzina królewska|Realeza|Королевская семья|王室|王族|왕족|العائلة المالكة|राजपरिवार', [
      'King|König|Re|Roi|Král|Rey|Król|Rei|Король|国王|王様|왕|ملك|राजा',
      'Queen|Königin|Regina|Reine|Královna|Reina|Królowa|Rainha|Королева|王后|女王|여왕|ملكة|रानी',
      'Prince|Prinz|Principe|Prince|Princ|Príncipe|Książę|Príncipe|Принц|王子|王子|왕자|أمير|राजकुमार',
      'Princess|Prinzessin|Principessa|Princesse|Princezna|Princesa|Księżniczka|Princesa|Принцесса|公主|王女|공주|أميرة|राजकुमारी',
    ]],
    ['Chess pieces|Schachfiguren|Pezzi degli scacchi|Pièces d’échecs|Šachové figurky|Piezas de ajedrez|Figury szachowe|Peças de xadrez|Шахматные фигуры|国际象棋棋子|チェスの駒|체스 말|قطع الشطرنج|शतरंज के मोहरे', [
      'Rook|Turm|Torre|Tour|Věž|Torre|Wieża|Torre|Ладья|车|ルーク|룩|رخ|हाथी',
      'Knight|Springer|Cavallo|Cavalier|Jezdec|Caballo|Skoczek|Cavalo|Конь|马|ナイト|나이트|حصان|घोड़ा',
      'Bishop|Läufer|Alfiere|Fou|Střelec|Alfil|Goniec|Bispo|Слон|象|ビショップ|비숍|فيل|ऊँट',
      'Pawn|Bauer|Pedone|Pion|Pěšec|Peón|Pion|Peão|Пешка|兵|ポーン|폰|بيدق|प्यादा',
    ]],
    ['Castle|Burg|Castello|Château fort|Hrad|Castillo|Zamek|Castelo|Замок|城堡|城|성|القلعة|क़िला', [
      'Moat|Burggraben|Fossato|Douves|Příkop|Foso|Fosa|Fosso|Ров|护城河|堀|해자|خندق|खाई',
      'Gate|Tor|Portone|Porte|Brána|Puerta|Brama|Portão|Ворота|城门|城門|성문|بوابة|फाटक',
      'Wall|Mauer|Mura|Rempart|Hradba|Muralla|Mur|Muralha|Стена|城墙|城壁|성벽|سور|परकोटा',
      'Throne|Thron|Trono|Trône|Trůn|Trono|Tron|Trono|Трон|王座|玉座|왕좌|عرش|सिंहासन',
    ]],
  ],
  [ // trap: Salsa is also a sauce
    ['Card games|Kartenspiele|Giochi di carte|Jeux de cartes|Karetní hry|Juegos de cartas|Gry karciane|Jogos de cartas|Карточные игры|纸牌游戏|トランプゲーム|카드 게임|ألعاب الورق|ताश के खेल', [
      'Poker|Poker|Poker|Poker|Poker|Póquer|Poker|Póquer|Покер|扑克|ポーカー|포커|بوكر|पोकर',
      'Bridge|Bridge|Bridge|Bridge|Bridž|Bridge|Brydż|Bridge|Бридж|桥牌|ブリッジ|브리지|بريدج|ब्रिज',
      'Blackjack|Blackjack|Blackjack|Blackjack|Blackjack|Blackjack|Blackjack|Blackjack|Блэкджек|二十一点|ブラックジャック|블랙잭|بلاك جاك|ब्लैकजैक',
      'Solitaire|Patience|Solitario|Patience|Solitér|Solitario|Pasjans|Paciência|Пасьянс|单人纸牌|ソリティア|솔리테어|سوليتير|सॉलिटेयर',
    ]],
    ['Music genres|Musikrichtungen|Generi musicali|Genres musicaux|Hudební žánry|Géneros musicales|Gatunki muzyczne|Géneros musicais|Музыкальные жанры|音乐流派|音楽ジャンル|음악 장르|أنواع موسيقية|संगीत शैलियाँ', [
      'Jazz|Jazz|Jazz|Jazz|Jazz|Jazz|Jazz|Jazz|Джаз|爵士乐|ジャズ|재즈|جاز|जैज़',
      'Rock|Rock|Rock|Rock|Rock|Rock|Rock|Rock|Рок|摇滚|ロック|록|روك|रॉक',
      'Blues|Blues|Blues|Blues|Blues|Blues|Blues|Blues|Блюз|蓝调|ブルース|블루스|بلوز|ब्लूज़',
      'Reggae|Reggae|Reggae|Reggae|Reggae|Reggae|Reggae|Reggae|Регги|雷鬼|レゲエ|레게|ريغي|रेगे',
    ]],
    ['Sauces|Soßen|Salse|Sauces|Omáčky|Salsas|Sosy|Molhos|Соусы|酱料|ソース|소스|صلصات|सॉस', [
      'Ketchup|Ketchup|Ketchup|Ketchup|Kečup|Kétchup|Keczup|Ketchup|Кетчуп|番茄酱|ケチャップ|케첩|كاتشب|केचप',
      'Mayonnaise|Mayonnaise|Maionese|Mayonnaise|Majonéza|Mayonesa|Majonez|Maionese|Майонез|蛋黄酱|マヨネーズ|마요네즈|مايونيز|मेयोनीज़',
      'Mustard|Senf|Senape|Moutarde|Hořčice|Mostaza|Musztarda|Mostarda|Горчица|芥末酱|マスタード|머스터드|خردل|सरसों',
      'Pesto|Pesto|Pesto|Pesto|Pesto|Pesto|Pesto|Pesto|Песто|青酱|ジェノベーゼ|페스토|بيستو|पेस्टो',
    ]],
    ['Dances|Tänze|Balli|Danses|Tance|Bailes|Tańce|Danças|Танцы|舞蹈|ダンス|춤|رقصات|नृत्य', [
      'Waltz|Walzer|Valzer|Valse|Valčík|Vals|Walc|Valsa|Вальс|华尔兹|ワルツ|왈츠|فالس|वॉल्ट्ज़',
      'Tango|Tango|Tango|Tango|Tango|Tango|Tango|Tango|Танго|探戈|タンゴ|탱고|تانغو|टैंगो',
      'Polka|Polka|Polka|Polka|Polka|Polca|Polka|Polca|Полька|波尔卡|ポルカ|폴카|بولكا|पोल्का',
      'Salsa|Salsa|Salsa|Salsa|Salsa|Salsa|Salsa|Salsa|Сальса|萨尔萨舞|サルサ|살사|سالسا|साल्सा',
    ]],
  ],
  [ // trap: the Second is also a unit
    ['Gases|Gase|Gas|Gaz|Plyny|Gases|Gazy|Gases|Газы|气体|気体|기체|غازات|गैसें', [
      'Oxygen|Sauerstoff|Ossigeno|Oxygène|Kyslík|Oxígeno|Tlen|Oxigénio|Кислород|氧气|酸素|산소|أكسجين|ऑक्सीजन',
      'Hydrogen|Wasserstoff|Idrogeno|Hydrogène|Vodík|Hidrógeno|Wodór|Hidrogénio|Водород|氢气|水素|수소|هيدروجين|हाइड्रोजन',
      'Helium|Helium|Elio|Hélium|Helium|Helio|Hel|Hélio|Гелий|氦气|ヘリウム|헬륨|هيليوم|हीलियम',
      'Nitrogen|Stickstoff|Azoto|Azote|Dusík|Nitrógeno|Azot|Azoto|Азот|氮气|窒素|질소|نيتروجين|नाइट्रोजन',
    ]],
    ['3D shapes|Geometrische Körper|Solidi|Solides|Tělesa|Cuerpos geométricos|Bryły|Sólidos geométricos|Геометрические тела|立体图形|立体|입체 도형|مجسمات|ठोस आकृतियाँ', [
      'Cube|Würfel|Cubo|Cube|Krychle|Cubo|Sześcian|Cubo|Куб|立方体|立方体|정육면체|مكعب|घन',
      'Sphere|Kugel|Sfera|Sphère|Koule|Esfera|Kula|Esfera|Шар|球体|球|구|كرة|गोला',
      'Cone|Kegel|Cono|Cône|Kužel|Cono|Stożek|Cone|Конус|圆锥|円錐|원뿔|مخروط|शंकु',
      'Cylinder|Zylinder|Cilindro|Cylindre|Válec|Cilindro|Walec|Cilindro|Цилиндр|圆柱|円柱|원기둥|أسطوانة|बेलन',
    ]],
    ['Units of measurement|Maßeinheiten|Unità di misura|Unités de mesure|Jednotky|Unidades de medida|Jednostki miary|Unidades de medida|Единицы измерения|计量单位|単位|측정 단위|وحدات القياس|मात्रक', [
      'Metre|Meter|Metro|Mètre|Metr|Metro|Metr|Metro|Метр|米|メートル|미터|متر|मीटर',
      'Litre|Liter|Litro|Litre|Litr|Litro|Litr|Litro|Литр|升|リットル|리터|لتر|लीटर',
      'Gram|Gramm|Grammo|Gramme|Gram|Gramo|Gram|Grama|Грамм|克|グラム|그램|غرام|ग्राम',
      'Watt|Watt|Watt|Watt|Watt|Vatio|Wat|Watt|Ватт|瓦特|ワット|와트|واط|वाट',
    ]],
    ['Units of time|Zeiteinheiten|Unità di tempo|Unités de temps|Jednotky času|Unidades de tiempo|Jednostki czasu|Unidades de tempo|Единицы времени|时间单位|時間の単位|시간 단위|وحدات الزمن|समय की इकाइयाँ', [
      'Second|Sekunde|Secondo|Seconde|Sekunda|Segundo|Sekunda|Segundo|Секунда|秒|秒|초|ثانية|सेकंड',
      'Minute|Minute|Minuto|Minute|Minuta|Minuto|Minuta|Minuto|Минута|分钟|分|분|دقيقة|मिनट',
      'Hour|Stunde|Ora|Heure|Hodina|Hora|Godzina|Hora|Час|小时|時間|시간|ساعة|घंटा',
      'Day|Tag|Giorno|Jour|Den|Día|Dzień|Dia|День|天|日|일|يوم|दिन',
    ]],
  ],
];

/* ═════════════════════════════ helpers ═════════════════════════════ */

function pick(row: string, lang: Lang): string {
  const parts = row.split('|');
  const i = W_LANGS.indexOf(lang);
  return (i >= 0 && parts[i]) || parts[0];
}

export function setCount(region: Region): number {
  return region === 'world' ? WORLD.length : LOCAL[region].length;
}

const LOCAL: Record<Exclude<Region, 'world'>, LocalSet[]> = {
  cz: CZ, sk: SK, de: DE, pl: PL,
  en: EN, fr: FR, it: IT, es: ES, pt: PT, ru: RU, zh: ZH, ja: JA, ko: KO, ar: AR, hi: HI,
};

/** One set in the language the player sees (WORLD follows the UI language, local regions are fixed). */
export function getSet(region: Region, index: number, lang: Lang): ConnectSet {
  const n = setCount(region);
  const i = ((index % n) + n) % n;
  const groups: ConnectGroup[] = region === 'world'
    ? WORLD[i].map(([name, words]) => ({ name: pick(name, lang), words: words.map(w => pick(w, lang)) }))
    : LOCAL[region][i].map(([name, words]) => ({ name, words: [...words] }));
  return { region, index: i, groups };
}

const DAY_MS = 86_400_000;
const EPOCH = Date.UTC(2026, 0, 1);

/** Days since 2026-01-01 for a UTC day key `yyyy-mm-dd`. */
export function dayNumber(dayKey: string): number {
  return Math.round((Date.parse(`${dayKey}T00:00:00Z`) - EPOCH) / DAY_MS);
}

/** Today's set — the same for everyone in the region (rotates through all sets). */
export function dailySetIndex(region: Region, dayKey: string): number {
  const n = setCount(region);
  return ((dayNumber(dayKey) % n) + n) % n;
}

/** Small seeded PRNG (mulberry32) for the daily tile order. */
export function seededRandom(seedText: string): () => number {
  let h = 1779033703 ^ seedText.length;
  for (let i = 0; i < seedText.length; i++) {
    h = Math.imul(h ^ seedText.charCodeAt(i), 3432918353);
    h = (h << 13) | (h >>> 19);
  }
  let a = h >>> 0;
  return () => {
    a = (a + 0x6D2B79F5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Raw data for the consistency check in scripts/check-connect-sets.ts. */
export const RAW_SETS = { local: LOCAL, world: WORLD, worldLangs: W_LANGS };
