/* Texts for the BossKey fake office screens (from games-reference/daily-blocks).
   Only 7 languages, as in the demo — anything else falls back to English. */

export interface OfficeTexts {
  book: string; sheet: string; app: string; doc: string; dapp: string;
  menuS: string[]; menuD: string[];
  paste: string; sort: string; ready: string; styles: string[];
  title: string; item: string; total: string; rows: string[]; note: string; noteT: string;
  meet: string; date: string; who: string; agenda: string;
  status: (words: number) => string;
}

export type OfficeLang = 'cs' | 'sk' | 'en' | 'de' | 'pl' | 'es' | 'fr';

export const OFFICE_TEXTS: Record<OfficeLang, OfficeTexts> = {
  cs: {
    book: 'Sešit1', sheet: 'List', app: 'Tabulka', doc: 'Dokument1', dapp: 'Textový editor',
    menuS: ['Soubor', 'Domů', 'Vložit', 'Rozložení stránky', 'Vzorce', 'Data', 'Revize', 'Zobrazení'],
    menuD: ['Soubor', 'Domů', 'Vložení', 'Návrh', 'Rozložení', 'Reference', 'Revize', 'Zobrazení'],
    paste: 'Vložit', sort: 'Seřadit', ready: 'Připraveno', styles: ['Normální', 'Nadpis 1', 'Nadpis 2'],
    title: 'Plán na 4. čtvrtletí – rozpracováno', item: 'Položka', total: 'Celkem', rows: ['Služby', 'Materiál', 'Doprava'],
    note: 'Poznámka:', noteT: 'doplnit podklady od účetní',
    meet: 'Zápis z porady', date: 'Datum', who: 'Účastníci', agenda: 'Body k projednání',
    status: n => `Stránka 1 z 1 · Počet slov: ${n}`,
  },
  sk: {
    book: 'Zošit1', sheet: 'Hárok', app: 'Tabuľka', doc: 'Dokument1', dapp: 'Textový editor',
    menuS: ['Súbor', 'Domov', 'Vložiť', 'Rozloženie strany', 'Vzorce', 'Údaje', 'Revízia', 'Zobraziť'],
    menuD: ['Súbor', 'Domov', 'Vložiť', 'Návrh', 'Rozloženie', 'Referencie', 'Revízia', 'Zobraziť'],
    paste: 'Prilepiť', sort: 'Zoradiť', ready: 'Pripravené', styles: ['Normálny', 'Nadpis 1', 'Nadpis 2'],
    title: 'Plán na 4. štvrťrok – rozpracované', item: 'Položka', total: 'Spolu', rows: ['Služby', 'Materiál', 'Doprava'],
    note: 'Poznámka:', noteT: 'doplniť podklady od účtovníčky',
    meet: 'Zápisnica z porady', date: 'Dátum', who: 'Účastníci', agenda: 'Body na prerokovanie',
    status: n => `Strana 1 z 1 · Počet slov: ${n}`,
  },
  en: {
    book: 'Book1', sheet: 'Sheet', app: 'Spreadsheet', doc: 'Document1', dapp: 'Word processor',
    menuS: ['File', 'Home', 'Insert', 'Page Layout', 'Formulas', 'Data', 'Review', 'View'],
    menuD: ['File', 'Home', 'Insert', 'Design', 'Layout', 'References', 'Review', 'View'],
    paste: 'Paste', sort: 'Sort', ready: 'Ready', styles: ['Normal', 'Heading 1', 'Heading 2'],
    title: 'Q4 plan – draft', item: 'Item', total: 'Total', rows: ['Services', 'Materials', 'Shipping'],
    note: 'Note:', noteT: 'add figures from accounting',
    meet: 'Meeting notes', date: 'Date', who: 'Attendees', agenda: 'Agenda',
    status: n => `Page 1 of 1 · ${n} words`,
  },
  de: {
    book: 'Mappe1', sheet: 'Tabelle', app: 'Tabellenkalkulation', doc: 'Dokument1', dapp: 'Textverarbeitung',
    menuS: ['Datei', 'Start', 'Einfügen', 'Seitenlayout', 'Formeln', 'Daten', 'Überprüfen', 'Ansicht'],
    menuD: ['Datei', 'Start', 'Einfügen', 'Entwurf', 'Layout', 'Referenzen', 'Überprüfen', 'Ansicht'],
    paste: 'Einfügen', sort: 'Sortieren', ready: 'Bereit', styles: ['Standard', 'Überschrift 1', 'Überschrift 2'],
    title: 'Planung Q4 – Entwurf', item: 'Position', total: 'Gesamt', rows: ['Dienstleistungen', 'Material', 'Versand'],
    note: 'Notiz:', noteT: 'Zahlen von der Buchhaltung ergänzen',
    meet: 'Besprechungsprotokoll', date: 'Datum', who: 'Teilnehmer', agenda: 'Tagesordnung',
    status: n => `Seite 1 von 1 · ${n} Wörter`,
  },
  pl: {
    book: 'Zeszyt1', sheet: 'Arkusz', app: 'Arkusz kalkulacyjny', doc: 'Dokument1', dapp: 'Edytor tekstu',
    menuS: ['Plik', 'Narzędzia główne', 'Wstawianie', 'Układ strony', 'Formuły', 'Dane', 'Recenzja', 'Widok'],
    menuD: ['Plik', 'Narzędzia główne', 'Wstawianie', 'Projektowanie', 'Układ', 'Odwołania', 'Recenzja', 'Widok'],
    paste: 'Wklej', sort: 'Sortuj', ready: 'Gotowe', styles: ['Normalny', 'Nagłówek 1', 'Nagłówek 2'],
    title: 'Plan na IV kwartał – wersja robocza', item: 'Pozycja', total: 'Razem', rows: ['Usługi', 'Materiały', 'Transport'],
    note: 'Uwaga:', noteT: 'uzupełnić dane z księgowości',
    meet: 'Notatka ze spotkania', date: 'Data', who: 'Uczestnicy', agenda: 'Punkty do omówienia',
    status: n => `Strona 1 z 1 · Liczba wyrazów: ${n}`,
  },
  es: {
    book: 'Libro1', sheet: 'Hoja', app: 'Hoja de cálculo', doc: 'Documento1', dapp: 'Procesador de texto',
    menuS: ['Archivo', 'Inicio', 'Insertar', 'Disposición de página', 'Fórmulas', 'Datos', 'Revisar', 'Vista'],
    menuD: ['Archivo', 'Inicio', 'Insertar', 'Diseño', 'Disposición', 'Referencias', 'Revisar', 'Vista'],
    paste: 'Pegar', sort: 'Ordenar', ready: 'Listo', styles: ['Normal', 'Título 1', 'Título 2'],
    title: 'Plan del 4.º trimestre – borrador', item: 'Concepto', total: 'Total', rows: ['Servicios', 'Material', 'Transporte'],
    note: 'Nota:', noteT: 'completar datos de contabilidad',
    meet: 'Acta de reunión', date: 'Fecha', who: 'Asistentes', agenda: 'Puntos a tratar',
    status: n => `Página 1 de 1 · ${n} palabras`,
  },
  fr: {
    book: 'Classeur1', sheet: 'Feuil', app: 'Tableur', doc: 'Document1', dapp: 'Traitement de texte',
    menuS: ['Fichier', 'Accueil', 'Insertion', 'Mise en page', 'Formules', 'Données', 'Révision', 'Affichage'],
    menuD: ['Fichier', 'Accueil', 'Insertion', 'Création', 'Mise en page', 'Références', 'Révision', 'Affichage'],
    paste: 'Coller', sort: 'Trier', ready: 'Prêt', styles: ['Normal', 'Titre 1', 'Titre 2'],
    title: 'Plan T4 – brouillon', item: 'Poste', total: 'Total', rows: ['Services', 'Matériel', 'Transport'],
    note: 'Remarque :', noteT: 'compléter avec les chiffres de la compta',
    meet: 'Compte rendu de réunion', date: 'Date', who: 'Participants', agenda: 'Ordre du jour',
    status: n => `Page 1 sur 1 · ${n} mots`,
  },
};

/** Picks the office language: the app language when supported, Slovak for Slovak browsers
 *  (the app itself has no Slovak), otherwise English. */
export function pickOfficeLang(appLang: string, browserLang?: string): OfficeLang {
  const nav = (browserLang ?? '').slice(0, 2).toLowerCase();
  if (nav === 'sk' && (appLang === 'cs' || appLang === 'en')) return 'sk';
  return appLang in OFFICE_TEXTS ? (appLang as OfficeLang) : 'en';
}
