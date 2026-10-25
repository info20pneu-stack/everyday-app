/* Native word sets for Connect Four Words — written for native speakers, not translated.
   Same rules as lib/games/connectSets.ts: 4 groups × 4 words, easiest group first, at least one
   red herring per set (see the `// trap:` comments), and exactly one way to split the 16 words.
   Check with: npx tsx scripts/check-connect-sets.ts */

export type NativeGroup = [name: string, words: [string, string, string, string]];
export type NativeSet = [NativeGroup, NativeGroup, NativeGroup, NativeGroup];

/* ═════════════════════════════ EN ═════════════════════════════ */
export const EN: NativeSet[] = [
  [ // trap: Victoria was also a monarch
    ['Cheeses', ['Cheddar', 'Stilton', 'Wensleydale', 'Red Leicester']],
    ['The Beatles', ['Lennon', 'McCartney', 'Harrison', 'Starr']],
    ['Monarchs', ['Elizabeth', 'Henry', 'Edward', 'George']],
    ['Tube lines', ['Central', 'Jubilee', 'Piccadilly', 'Victoria']],
  ],
  [ // trap: Georgia is also a country
    ['Countries', ['France', 'Kenya', 'Peru', 'Japan']],
    ['Card games', ['Poker', 'Bridge', 'Snap', 'Rummy']],
    ['NBA teams', ['Lakers', 'Celtics', 'Bulls', 'Knicks']],
    ['US states', ['Texas', 'Ohio', 'Maine', 'Georgia']],
  ],
  [ // trap: Mars is a chocolate bar, Foot and Hand go before "ball"
    ['Chocolate bars', ['Twix', 'Snickers', 'Bounty', 'Kit Kat']],
    ['___ball', ['Basket', 'Snow', 'Base', 'Meat']],
    ['Body parts', ['Elbow', 'Knee', 'Foot', 'Hand']],
    ['Planets', ['Venus', 'Saturn', 'Mercury', 'Mars']],
  ],
  [ // trap: a hamlet is also a small village
    ['Board games', ['Monopoly', 'Scrabble', 'Cluedo', 'Risk']],
    ['Romantic poets', ['Keats', 'Byron', 'Shelley', 'Wordsworth']],
    ['Settlements', ['Village', 'Town', 'City', 'Borough']],
    ['Shakespeare plays', ['Macbeth', 'Othello', 'Coriolanus', 'Hamlet']],
  ],
  [ // trap: Bacon is breakfast, Constable a police rank
    ['Cocktails', ['Mojito', 'Martini', 'Daiquiri', 'Negroni']],
    ['Breakfast', ['Toast', 'Porridge', 'Crumpet', 'Kipper']],
    ['Police ranks', ['Sergeant', 'Inspector', 'Superintendent', 'Commissioner']],
    ['British painters', ['Turner', 'Hockney', 'Constable', 'Bacon']],
  ],
  [ // trap: Bowler and Hook are cricket words too
    ['Dog breeds', ['Beagle', 'Poodle', 'Labrador', 'Boxer']],
    ['Cricket terms', ['Wicket', 'Over', 'Innings', 'Crease']],
    ['Boxing punches', ['Jab', 'Uppercut', 'Cross', 'Hook']],
    ['Hats', ['Fedora', 'Beanie', 'Stetson', 'Bowler']],
  ],
  [ // trap: Fawkes is also Guy Fawkes
    ['Hogwarts houses', ['Gryffindor', 'Slytherin', 'Hufflepuff', 'Ravenclaw']],
    ['Spells', ['Expelliarmus', 'Lumos', 'Accio', 'Alohomora']],
    ['Bonfire Night', ['Bonfire', 'Fireworks', 'Sparkler', 'Toffee apple']],
    ['Magical creatures', ['Hippogriff', 'Dementor', 'Basilisk', 'Fawkes']],
  ],
  [ // trap: Lincoln was a president, Colorado and Missouri are states
    ['Presidents', ['Kennedy', 'Obama', 'Roosevelt', 'Truman']],
    ['States', ['Texas', 'Ohio', 'Utah', 'Nevada']],
    ['Car brands', ['Chevrolet', 'Tesla', 'Cadillac', 'Lincoln']],
    ['Rivers', ['Mississippi', 'Hudson', 'Colorado', 'Missouri']],
  ],
  [ // trap: Sole is also part of a shoe
    ['Teas', ['Earl Grey', 'Assam', 'Darjeeling', 'Chamomile']],
    ['In the garden', ['Shed', 'Pond', 'Patio', 'Hedge']],
    ['Parts of a shoe', ['Heel', 'Lace', 'Tongue', 'Eyelet']],
    ['Fish', ['Cod', 'Haddock', 'Plaice', 'Sole']],
  ],
  [ // trap: Pint is an imperial unit, Wood a material
    ['Gemstones', ['Ruby', 'Opal', 'Emerald', 'Sapphire']],
    ['Imperial units', ['Inch', 'Gallon', 'Ounce', 'Stone']],
    ['Rolling Stones', ['Jagger', 'Richards', 'Watts', 'Wood']],
    ['Down the pub', ['Darts', 'Quiz', 'Jukebox', 'Pint']],
  ],
  [ // trap: Grumpy is also a mood
    ['Weather', ['Drizzle', 'Sleet', 'Hail', 'Fog']],
    ['Disney films', ['Frozen', 'Moana', 'Cinderella', 'Aladdin']],
    ['Moods', ['Sad', 'Angry', 'Calm', 'Anxious']],
    ['Seven Dwarfs', ['Doc', 'Sneezy', 'Bashful', 'Grumpy']],
  ],
  [ // trap: Date is on the calendar, Lime is a colour
    ['Calendar', ['Day', 'Week', 'Month', 'Year']],
    ['Colours', ['Teal', 'Maroon', 'Navy', 'Crimson']],
    ['___cake', ['Cup', 'Cheese', 'Fish', 'Pan']],
    ['Fruit', ['Apple', 'Lemon', 'Lime', 'Date']],
  ],
  [ // trap: Hamilton is also a musical
    ['Venues', ['Wimbledon', 'Ascot', 'Henley', 'Silverstone']],
    ['Tennis players', ['Murray', 'Federer', 'Nadal', 'Djokovic']],
    ['Musicals', ['Cats', 'Wicked', 'Grease', 'Les Mis']],
    ['F1 drivers', ['Senna', 'Schumacher', 'Verstappen', 'Hamilton']],
  ],
  [ // trap: Apple pie, Gherkin is a pickle
    ['Pies', ['Pork', 'Cottage', 'Shepherd’s', 'Mince']],
    ['City nicknames', ['Big Apple', 'Windy City', 'Big Easy', 'Motor City']],
    ['London landmarks', ['Big Ben', 'Tower Bridge', 'The Shard', 'Gherkin']],
    ['Sauces', ['Mint', 'Bread', 'Brown', 'Apple']],
  ],
];

/* ═════════════════════════════ IT ═════════════════════════════ */
export const IT: NativeSet[] = [
  [ // trap: Lazio è anche una regione
    ['Fiumi', ['Po', 'Tevere', 'Arno', 'Adige']],
    ['Città d’arte', ['Firenze', 'Siena', 'Assisi', 'Ravenna']],
    ['Regioni', ['Toscana', 'Umbria', 'Puglia', 'Liguria']],
    ['Squadre di calcio', ['Juventus', 'Inter', 'Milan', 'Lazio']],
  ],
  [ // trap: farfalle e penne non sono solo pasta
    ['Formaggi', ['Parmigiano', 'Gorgonzola', 'Pecorino', 'Mozzarella']],
    ['Insetti', ['Api', 'Formiche', 'Zanzare', 'Mosche']],
    ['Cancelleria', ['Matite', 'Gomme', 'Righelli', 'Quaderni']],
    ['Pasta', ['Fusilli', 'Rigatoni', 'Farfalle', 'Penne']],
  ],
  [ // trap: Raffaello è anche un pittore
    ['Compositori', ['Verdi', 'Puccini', 'Rossini', 'Vivaldi']],
    ['Scrittori', ['Dante', 'Petrarca', 'Boccaccio', 'Manzoni']],
    ['Pittori', ['Caravaggio', 'Giotto', 'Tiziano', 'Botticelli']],
    ['Tartarughe Ninja', ['Leonardo', 'Donatello', 'Michelangelo', 'Raffaello']],
  ],
  [ // trap: Marocchino è anche una nazionalità
    ['Dolci', ['Tiramisù', 'Cannolo', 'Panettone', 'Pandoro']],
    ['Vini', ['Chianti', 'Barolo', 'Prosecco', 'Lambrusco']],
    ['Nazionalità', ['Francese', 'Tedesco', 'Inglese', 'Spagnolo']],
    ['Caffè', ['Espresso', 'Macchiato', 'Ristretto', 'Marocchino']],
  ],
  [ // trap: Panda è un animale, Uno un numero
    ['Case automobilistiche', ['Fiat', 'Ferrari', 'Lamborghini', 'Maserati']],
    ['Animali', ['Orso', 'Lupo', 'Cervo', 'Volpe']],
    ['Numeri', ['Due', 'Tre', 'Cinque', 'Dieci']],
    ['Modelli Fiat', ['Punto', 'Tipo', 'Panda', 'Uno']],
  ],
  [ // trap: il pantalone è anche un capo d’abbigliamento
    ['Feste', ['Ferragosto', 'Befana', 'Pasquetta', 'Natale']],
    ['Uccelli', ['Passero', 'Merlo', 'Gabbiano', 'Rondine']],
    ['Abbigliamento', ['Gonna', 'Camicia', 'Giacca', 'Maglione']],
    ['Maschere di Carnevale', ['Arlecchino', 'Pulcinella', 'Colombina', 'Pantalone']],
  ],
  [ // trap: Stromboli e Vulcano sono anche isole
    ['Laghi', ['Garda', 'Como', 'Maggiore', 'Trasimeno']],
    ['Monti', ['Cervino', 'Monte Bianco', 'Gran Sasso', 'Marmolada']],
    ['Isole', ['Sicilia', 'Sardegna', 'Capri', 'Elba']],
    ['Vulcani', ['Etna', 'Vesuvio', 'Stromboli', 'Vulcano']],
  ],
  [ // trap: Rossi è anche un calciatore e un cantante
    ['Calciatori', ['Totti', 'Baggio', 'Del Piero', 'Buffon']],
    ['Ciclisti', ['Coppi', 'Bartali', 'Pantani', 'Nibali']],
    ['Cantanti', ['Ramazzotti', 'Pausini', 'Bocelli', 'Celentano']],
    ['Motociclisti', ['Agostini', 'Biaggi', 'Bagnaia', 'Rossi']],
  ],
  [ // trap: la margherita è anche un fiore
    ['Cibo di strada', ['Arancino', 'Supplì', 'Piadina', 'Panzerotto']],
    ['Salumi', ['Prosciutto', 'Mortadella', 'Bresaola', 'Salame']],
    ['Fiori', ['Rosa', 'Tulipano', 'Girasole', 'Giglio']],
    ['Pizze', ['Marinara', 'Capricciosa', 'Diavola', 'Margherita']],
  ],
  [ // trap: il grillo è un insetto
    ['Politici', ['Berlusconi', 'Prodi', 'Meloni', 'Draghi']],
    ['Fumetti', ['Topolino', 'Diabolik', 'Tex', 'Dylan Dog']],
    ['Insetti', ['Formica', 'Zanzara', 'Ape', 'Cicala']],
    ['Personaggi di Pinocchio', ['Geppetto', 'Lucignolo', 'Mangiafuoco', 'Grillo']],
  ],
  [ // trap: il calcio è anche uno sport
    ['Strumenti', ['Violino', 'Pianoforte', 'Chitarra', 'Flauto']],
    ['In cucina', ['Pentola', 'Padella', 'Mestolo', 'Tagliere']],
    ['Sport', ['Tennis', 'Nuoto', 'Ciclismo', 'Sci']],
    ['Elementi', ['Ferro', 'Oro', 'Rame', 'Calcio']],
  ],
  [ // trap: Bolognese è anche un abitante
    ['Monumenti', ['Colosseo', 'Duomo', 'Arena', 'Pantheon']],
    ['Mezzi di trasporto', ['Gondola', 'Vaporetto', 'Tram', 'Funivia']],
    ['Abitanti', ['Milanese', 'Napoletano', 'Fiorentino', 'Veneziano']],
    ['Sughi', ['Pesto', 'Carbonara', 'Amatriciana', 'Bolognese']],
  ],
  [ // trap: Leone è anche un animale, Polo una maglia
    ['Moda', ['Gucci', 'Prada', 'Armani', 'Versace']],
    ['Navigatori', ['Colombo', 'Vespucci', 'Polo', 'Caboto']],
    ['Animali', ['Tigre', 'Orso', 'Lupo', 'Giraffa']],
    ['Registi', ['Fellini', 'Visconti', 'Bertolucci', 'Leone']],
  ],
  [ // trap: spalla e coppa sono anche salumi
    ['Pasta', ['Orecchiette', 'Linguine', 'Tagliatelle', 'Bucatini']],
    ['Premi', ['Medaglia', 'Targa', 'Scudetto', 'Oscar']],
    ['Parti del corpo', ['Gomito', 'Ginocchio', 'Caviglia', 'Spalla']],
    ['Salumi', ['Mortadella', 'Bresaola', 'Prosciutto', 'Coppa']],
  ],
];

/* ═════════════════════════════ FR ═════════════════════════════ */
export const FR: NativeSet[] = [
  [ // trap: la Champagne est aussi une région
    ['Fleuves', ['Seine', 'Loire', 'Garonne', 'Rhône']],
    ['Fromages', ['Camembert', 'Brie', 'Roquefort', 'Reblochon']],
    ['Régions', ['Bretagne', 'Normandie', 'Alsace', 'Provence']],
    ['Vins', ['Bordeaux', 'Chablis', 'Beaujolais', 'Champagne']],
  ],
  [ // trap: Haddock est un poisson, Tournesol une fleur
    ['Astérix', ['Obélix', 'Panoramix', 'Idéfix', 'Abraracourcix']],
    ['Poissons', ['Cabillaud', 'Sole', 'Merlu', 'Bar']],
    ['Fleurs', ['Rose', 'Tulipe', 'Lys', 'Muguet']],
    ['Tintin', ['Milou', 'Dupond', 'Haddock', 'Tournesol']],
  ],
  [ // trap: Camus est aussi un cognac
    ['Peintres', ['Monet', 'Renoir', 'Cézanne', 'Degas']],
    ['Chanteurs', ['Brel', 'Piaf', 'Aznavour', 'Brassens']],
    ['Cognacs', ['Hennessy', 'Martell', 'Rémy Martin', 'Courvoisier']],
    ['Écrivains', ['Hugo', 'Zola', 'Proust', 'Camus']],
  ],
  [ // trap: l’éclair est aussi un phénomène météo
    ['Plats', ['Ratatouille', 'Cassoulet', 'Bouillabaisse', 'Quiche']],
    ['Pains', ['Baguette', 'Ficelle', 'Fougasse', 'Brioche']],
    ['Météo', ['Orage', 'Grêle', 'Brouillard', 'Tonnerre']],
    ['Pâtisseries', ['Macaron', 'Madeleine', 'Mille-feuille', 'Éclair']],
  ],
  [ // trap: le peloton est aussi une unité militaire
    ['Footballeurs', ['Zidane', 'Mbappé', 'Platini', 'Griezmann']],
    ['Rugby', ['Essai', 'Mêlée', 'Touche', 'Drop']],
    ['Armée', ['Bataillon', 'Régiment', 'Compagnie', 'Escadron']],
    ['Tour de France', ['Maillot jaune', 'Échappée', 'Étape', 'Peloton']],
  ],
  [ // trap: Montparnasse est aussi un quartier
    ['Monuments', ['Louvre', 'Panthéon', 'Invalides', 'Sacré-Cœur']],
    ['Ponts', ['Pont Neuf', 'Alexandre-III', 'Pont des Arts', 'Mirabeau']],
    ['Quartiers', ['Montmartre', 'Marais', 'Belleville', 'Pigalle']],
    ['Gares', ['Gare du Nord', 'Gare de Lyon', 'Saint-Lazare', 'Montparnasse']],
  ],
  [ // trap: la pêche est un fruit, la pomme aussi
    ['Jeux', ['Belote', 'Pétanque', 'Tarot', 'Échecs']],
    ['Fruits', ['Poire', 'Prune', 'Cerise', 'Abricot']],
    ['Loisirs', ['Chasse', 'Randonnée', 'Jardinage', 'Pêche']],
    ['___ de terre', ['Ver', 'Tremblement', 'Motte', 'Pomme']],
  ],
  [ // trap: Clio est aussi une muse
    ['Planètes', ['Mars', 'Vénus', 'Saturne', 'Neptune']],
    ['Citroën', ['Ami', 'Saxo', 'Xsara', 'Picasso']],
    ['Muses', ['Calliope', 'Euterpe', 'Thalie', 'Uranie']],
    ['Renault', ['Mégane', 'Twingo', 'Zoé', 'Clio']],
  ],
  [ // trap: le voile de la mariée
    ['Couleurs', ['Rouge', 'Bleu', 'Vert', 'Jaune']],
    ['Chapeaux', ['Béret', 'Képi', 'Canotier', 'Haut-de-forme']],
    ['Mariage', ['Bague', 'Témoin', 'Bouquet', 'Alliance']],
    ['Sports nautiques', ['Aviron', 'Kayak', 'Plongée', 'Voile']],
  ],
  [ // trap: la cigale et la fourmi sont des insectes
    ['Fêtes', ['Noël', 'Pâques', 'Toussaint', 'Chandeleur']],
    ['Oiseaux', ['Moineau', 'Merle', 'Pie', 'Mouette']],
    ['Insectes', ['Abeille', 'Moustique', 'Coccinelle', 'Guêpe']],
    ['Fables de La Fontaine', ['Corbeau', 'Renard', 'Cigale', 'Fourmi']],
  ],
  [ // trap: Cantal et Jura sont aussi des départements
    ['Vins', ['Sancerre', 'Muscadet', 'Pomerol', 'Sauternes']],
    ['Départements', ['Finistère', 'Gironde', 'Savoie', 'Vendée']],
    ['Massifs', ['Alpes', 'Pyrénées', 'Vosges', 'Jura']],
    ['Fromages', ['Comté', 'Munster', 'Saint-Nectaire', 'Cantal']],
  ],
  [ // trap: la Hollande est aussi un pays
    ['Acteurs', ['Depardieu', 'Deneuve', 'Belmondo', 'Delon']],
    ['Footballeurs', ['Zidane', 'Henry', 'Platini', 'Benzema']],
    ['Pays', ['Belgique', 'Suisse', 'Espagne', 'Italie']],
    ['Présidents', ['Mitterrand', 'Chirac', 'Sarkozy', 'Hollande']],
  ],
  [ // trap: la serviette va aussi dans la salle de bain
    ['Outils', ['Marteau', 'Scie', 'Tournevis', 'Pince']],
    ['Instruments', ['Violon', 'Piano', 'Trompette', 'Harpe']],
    ['Salle de bain', ['Savon', 'Brosse à dents', 'Peignoir', 'Douche']],
    ['À table', ['Fourchette', 'Assiette', 'Cuillère', 'Serviette']],
  ],
  [ // trap: la tour du château, la dame et le roi aux échecs
    ['Contes de Perrault', ['Cendrillon', 'Barbe-Bleue', 'Petit Poucet', 'Chat botté']],
    ['Château fort', ['Donjon', 'Douves', 'Pont-levis', 'Créneau']],
    ['Échecs', ['Fou', 'Cavalier', 'Pion', 'Tour']],
    ['Cartes', ['As', 'Valet', 'Roi', 'Dame']],
  ],
];

/* ═════════════════════════════ ES ═════════════════════════════ */
export const ES: NativeSet[] = [
  [ // trap: Murcia también es una ciudad
    ['Ríos', ['Ebro', 'Tajo', 'Duero', 'Guadalquivir']],
    ['Islas', ['Mallorca', 'Ibiza', 'Tenerife', 'Lanzarote']],
    ['Ciudades', ['Sevilla', 'Bilbao', 'Málaga', 'Toledo']],
    ['Comunidades', ['Galicia', 'Aragón', 'Cantabria', 'Murcia']],
  ],
  [ // trap: la tortilla y el tequila también son de México
    ['Postres', ['Churros', 'Flan', 'Turrón', 'Alfajor']],
    ['Comida mexicana', ['Tacos', 'Burritos', 'Nachos', 'Enchiladas']],
    ['Bebidas', ['Sangría', 'Horchata', 'Mate', 'Tequila']],
    ['Tapas', ['Croquetas', 'Patatas bravas', 'Gambas al ajillo', 'Tortilla']],
  ],
  [ // trap: García Márquez fue escritor
    ['Futbolistas', ['Messi', 'Iniesta', 'Ramos', 'Xavi']],
    ['Tenistas', ['Nadal', 'Alcaraz', 'Sabatini', 'Del Potro']],
    ['Escritores', ['Cervantes', 'Borges', 'Neruda', 'Allende']],
    ['Pilotos', ['Alonso', 'Sainz', 'Pérez', 'Márquez']],
  ],
  [ // trap: Miró también es un verbo
    ['Directores', ['Almodóvar', 'Buñuel', 'Del Toro', 'Cuarón']],
    ['Cantantes', ['Shakira', 'Rosalía', 'Julio Iglesias', 'Bad Bunny']],
    ['Pintores', ['Goya', 'Velázquez', 'Dalí', 'Kahlo']],
    ['Verbos en pasado', ['Cantó', 'Bailó', 'Corrió', 'Miró']],
  ],
  [ // trap: el flamenco es un ave y la salsa se come
    ['Aves', ['Águila', 'Loro', 'Colibrí', 'Cóndor']],
    ['Para mojar', ['Alioli', 'Mole', 'Chimichurri', 'Guacamole']],
    ['Instrumentos', ['Guitarra', 'Castañuelas', 'Charango', 'Bandoneón']],
    ['Bailes', ['Tango', 'Cumbia', 'Salsa', 'Flamenco']],
  ],
  [ // trap: Mortadelo suena a embutido
    ['Embutidos', ['Chorizo', 'Jamón', 'Salchichón', 'Fuet']],
    ['Fiestas', ['San Fermín', 'Tomatina', 'Fallas', 'Día de Muertos']],
    ['Errores', ['Error', 'Fallo', 'Despiste', 'Lapsus']],
    ['Personajes', ['Mafalda', 'Condorito', 'El Chavo', 'Mortadelo']],
  ],
  [ // trap: la muñeca y la cometa
    ['Herramientas', ['Martillo', 'Sierra', 'Destornillador', 'Alicates']],
    ['Astronomía', ['Estrella', 'Planeta', 'Galaxia', 'Luna']],
    ['Juguetes', ['Peonza', 'Yoyó', 'Pelota', 'Cometa']],
    ['Partes del cuerpo', ['Codo', 'Rodilla', 'Hombro', 'Muñeca']],
  ],
  [ // trap: la lima es una fruta, Santiago un apóstol
    ['Volcanes', ['Popocatépetl', 'Cotopaxi', 'Teide', 'Chimborazo']],
    ['Frutas', ['Limón', 'Mango', 'Piña', 'Papaya']],
    ['Apóstoles', ['Pedro', 'Juan', 'Andrés', 'Mateo']],
    ['Capitales', ['Quito', 'Bogotá', 'Lima', 'Santiago']],
  ],
  [ // trap: León, Toledo e Ibiza; Granada es fruta; Mango es tienda
    ['Frutas', ['Plátano', 'Fresa', 'Melón', 'Sandía']],
    ['Tiendas de moda', ['Zara', 'Desigual', 'Bershka', 'Mango']],
    ['Ciudades', ['Burgos', 'Cádiz', 'Salamanca', 'Granada']],
    ['Modelos SEAT', ['Ibiza', 'León', 'Toledo', 'Arona']],
  ],
  [ // trap: copas y espadas
    ['Profesiones', ['Médico', 'Abogado', 'Bombero', 'Cartero']],
    ['Vajilla', ['Platos', 'Vasos', 'Tazas', 'Cubiertos']],
    ['Armas', ['Lanzas', 'Arcos', 'Hachas', 'Flechas']],
    ['Palos de la baraja', ['Oros', 'Bastos', 'Copas', 'Espadas']],
  ],
  [ // trap: la llama también es fuego
    ['Países', ['Chile', 'Perú', 'Bolivia', 'Ecuador']],
    ['Bebidas', ['Pisco', 'Mate', 'Tequila', 'Ron']],
    ['Fuego', ['Chispa', 'Brasa', 'Ceniza', 'Humo']],
    ['Camélidos', ['Alpaca', 'Vicuña', 'Guanaco', 'Llama']],
  ],
  [ // trap: Rocinante es un caballo famoso
    ['Escritores', ['Lorca', 'Machado', 'Unamuno', 'Quevedo']],
    ['Ciudades manchegas', ['Toledo', 'Cuenca', 'Albacete', 'Ciudad Real']],
    ['Caballos famosos', ['Babieca', 'Bucéfalo', 'Pegaso', 'Marengo']],
    ['Don Quijote', ['Sancho', 'Dulcinea', 'Quijote', 'Rocinante']],
  ],
  [ // trap: el roscón también es un dulce
    ['Nochevieja', ['Uvas', 'Campanadas', 'Cava', 'Cotillón']],
    ['Belén', ['Pastor', 'Buey', 'Mula', 'Ángel']],
    ['Dulces navideños', ['Turrón', 'Polvorón', 'Mazapán', 'Peladillas']],
    ['Noche de Reyes', ['Melchor', 'Gaspar', 'Baltasar', 'Roscón']],
  ],
  [ // trap: la oca también es un ave
    ['Cocina', ['Olla', 'Sartén', 'Cazo', 'Cucharón']],
    ['Tiempo', ['Lluvia', 'Granizo', 'Niebla', 'Nieve']],
    ['Aves de corral', ['Gallina', 'Pato', 'Pavo', 'Gallo']],
    ['Juegos de mesa', ['Parchís', 'Mus', 'Dominó', 'Oca']],
  ],
];

/* ═════════════════════════════ PT ═════════════════════════════ */
export const PT: NativeSet[] = [
  [ // armadilha: Porto também é vinho
    ['Cidades brasileiras', ['São Paulo', 'Salvador', 'Recife', 'Manaus']],
    ['Clubes', ['Benfica', 'Sporting', 'Flamengo', 'Corinthians']],
    ['Vinhos', ['Madeira', 'Vinho Verde', 'Douro', 'Moscatel']],
    ['Cidades portuguesas', ['Lisboa', 'Braga', 'Coimbra', 'Porto']],
  ],
  [ // armadilha: brigadeiro também é patente
    ['Bebidas', ['Caipirinha', 'Guaraná', 'Chimarrão', 'Ginjinha']],
    ['Salgados', ['Coxinha', 'Pão de queijo', 'Empada', 'Pastel']],
    ['Patentes', ['Coronel', 'Sargento', 'Capitão', 'General']],
    ['Doces', ['Quindim', 'Pudim', 'Pastel de nata', 'Brigadeiro']],
  ],
  [ // armadilha: Roberto Carlos também jogou futebol
    ['Pilotos', ['Senna', 'Piquet', 'Fittipaldi', 'Barrichello']],
    ['Escritores', ['Machado de Assis', 'Saramago', 'Pessoa', 'Jorge Amado']],
    ['Futebolistas', ['Pelé', 'Eusébio', 'Zico', 'Figo']],
    ['Cantores', ['Caetano Veloso', 'Gilberto Gil', 'Anitta', 'Roberto Carlos']],
  ],
  [ // armadilha: onça também é medida
    ['Árvores', ['Ipê', 'Jacarandá', 'Pau-brasil', 'Sobreiro']],
    ['Corpo', ['Cotovelo', 'Joelho', 'Ombro', 'Tornozelo']],
    ['Medidas', ['Litro', 'Metro', 'Grama', 'Quilo']],
    ['Animais do Brasil', ['Tucano', 'Capivara', 'Arara', 'Onça']],
  ],
  [ // armadilha: a bateria também está no carro
    ['Instrumentos', ['Cavaquinho', 'Pandeiro', 'Berimbau', 'Guitarra portuguesa']],
    ['Danças', ['Samba', 'Forró', 'Frevo', 'Vira']],
    ['Peças do carro', ['Pneu', 'Volante', 'Motor', 'Para-brisa']],
    ['Escola de samba', ['Mestre-sala', 'Porta-bandeira', 'Passista', 'Bateria']],
  ],
  [ // armadilha: Natal é festa, Belém é capital
    ['Praias', ['Copacabana', 'Ipanema', 'Leblon', 'Nazaré']],
    ['Festas', ['Páscoa', 'Carnaval', 'Ano Novo', 'São João']],
    ['Capitais estaduais', ['Manaus', 'Recife', 'Fortaleza', 'Natal']],
    ['Bairros de Lisboa', ['Alfama', 'Chiado', 'Baixa', 'Belém']],
  ],
  [ // armadilha: queijo também é laticínio
    ['Temperos', ['Sal', 'Pimenta', 'Alho', 'Canela']],
    ['Formas', ['Círculo', 'Quadrado', 'Triângulo', 'Losango']],
    ['Laticínios', ['Leite', 'Manteiga', 'Iogurte', 'Requeijão']],
    ['Pão de ___', ['Açúcar', 'Ló', 'Forma', 'Queijo']],
  ],
  [ // armadilha: Santos também é clube
    ['Cores', ['Vermelho', 'Amarelo', 'Verde', 'Azul']],
    ['Árvores', ['Pinheiro', 'Macieira', 'Figueira', 'Eucalipto']],
    ['Clubes', ['Flamengo', 'Palmeiras', 'Grêmio', 'Vasco']],
    ['Sobrenomes', ['Silva', 'Souza', 'Costa', 'Santos']],
  ],
  [ // armadilha: pagode também é templo, bandeira é símbolo
    ['Templos', ['Igreja', 'Mesquita', 'Sinagoga', 'Catedral']],
    ['Símbolos nacionais', ['Hino', 'Brasão', 'Selo', 'Lema']],
    ['Gêneros musicais', ['Samba', 'Fado', 'Sertanejo', 'Pagode']],
    ['Poetas', ['Camões', 'Pessoa', 'Drummond', 'Bandeira']],
  ],
  [ // armadilha: quarto também é fração
    ['Móveis', ['Sofá', 'Mesa', 'Cadeira', 'Armário']],
    ['Eletrodomésticos', ['Geladeira', 'Fogão', 'Micro-ondas', 'Liquidificador']],
    ['Frações', ['Metade', 'Terço', 'Quinto', 'Décimo']],
    ['Cômodos', ['Cozinha', 'Sala', 'Varanda', 'Quarto']],
  ],
  [ // armadilha: Gol é carro, Praia é capital, Brasília é carro
    ['Futebol', ['Pênalti', 'Escanteio', 'Impedimento', 'Falta']],
    ['Paisagens', ['Serra', 'Rio', 'Lagoa', 'Cachoeira']],
    ['Capitais lusófonas', ['Lisboa', 'Luanda', 'Maputo', 'Praia']],
    ['Carros da VW', ['Fusca', 'Kombi', 'Gol', 'Brasília']],
  ],
  [ // armadilha: cebolinha e salsa são temperos, visconde é título
    ['Danças', ['Tango', 'Valsa', 'Samba', 'Forró']],
    ['Títulos', ['Barão', 'Conde', 'Duque', 'Marquês']],
    ['Temperos', ['Coentro', 'Manjericão', 'Alecrim', 'Salsa']],
    ['Turma da Mônica e Sítio', ['Mônica', 'Cascão', 'Cebolinha', 'Visconde']],
  ],
  [ // armadilha: escudo também foi moeda, cruzeiro é clube
    ['Cavaleiro', ['Espada', 'Lança', 'Elmo', 'Armadura']],
    ['Clubes', ['Atlético', 'Internacional', 'Botafogo', 'Fluminense']],
    ['Embarcações', ['Jangada', 'Caravela', 'Canoa', 'Iate']],
    ['Moedas', ['Real', 'Euro', 'Escudo', 'Cruzeiro']],
  ],
  [ // armadilha: manga e punho também estão na camisa
    ['Cores', ['Roxo', 'Rosa', 'Cinza', 'Marrom']],
    ['Corpo', ['Cotovelo', 'Joelho', 'Ombro', 'Queixo']],
    ['Camisa', ['Gola', 'Botão', 'Bolso', 'Punho']],
    ['Frutas', ['Banana', 'Uva', 'Laranja', 'Manga']],
  ],
];

/* ═════════════════════════════ RU ═════════════════════════════ */
export const RU: NativeSet[] = [
  [ // ловушка: Лена — ещё и имя
    ['Города', ['Казань', 'Самара', 'Омск', 'Тула']],
    ['Озёра', ['Байкал', 'Ладога', 'Онега', 'Селигер']],
    ['Женские имена', ['Ольга', 'Таня', 'Маша', 'Наташа']],
    ['Реки', ['Волга', 'Обь', 'Енисей', 'Лена']],
  ],
  [ // ловушка: Пушкин — ещё и город
    ['Композиторы', ['Чайковский', 'Рахманинов', 'Шостакович', 'Прокофьев']],
    ['Космонавты', ['Гагарин', 'Терешкова', 'Леонов', 'Титов']],
    ['Города', ['Тверь', 'Псков', 'Сочи', 'Тула']],
    ['Писатели', ['Толстой', 'Гоголь', 'Тургенев', 'Пушкин']],
  ],
  [ // ловушка: мимоза — цветок, шуба — одежда
    ['Блюда', ['Борщ', 'Пельмени', 'Блины', 'Окрошка']],
    ['Цветы', ['Роза', 'Тюльпан', 'Ромашка', 'Сирень']],
    ['Одежда', ['Пальто', 'Куртка', 'Шапка', 'Варежки']],
    ['Салаты', ['Оливье', 'Винегрет', 'Мимоза', 'Шуба']],
  ],
  [ // ловушка: зенит — астрономический термин
    ['Хоккеисты', ['Овечкин', 'Малкин', 'Третьяк', 'Буре']],
    ['Теннисисты', ['Шарапова', 'Сафин', 'Медведев', 'Кафельников']],
    ['Астрономия', ['Орбита', 'Комета', 'Созвездие', 'Галактика']],
    ['Футбольные клубы', ['Спартак', 'ЦСКА', 'Локомотив', 'Зенит']],
  ],
  [ // ловушка: шарик — ёлочное украшение
    ['Мультфильмы', ['Чебурашка', 'Крокодил Гена', 'Карлсон', 'Винни-Пух']],
    ['Сказочные герои', ['Баба-яга', 'Кощей', 'Емеля', 'Колобок']],
    ['Ёлочные украшения', ['Гирлянда', 'Звезда', 'Мишура', 'Хлопушка']],
    ['Простоквашино', ['Матроскин', 'Печкин', 'Дядя Фёдор', 'Шарик']],
  ],
  [ // ловушка: Владимир — ещё и князь
    ['Москва', ['Арбат', 'Кремль', 'ВДНХ', 'Лужники']],
    ['Петербург', ['Эрмитаж', 'Невский', 'Петергоф', 'Исаакий']],
    ['Князья', ['Олег', 'Игорь', 'Святослав', 'Ярослав']],
    ['Золотое кольцо', ['Суздаль', 'Ярославль', 'Кострома', 'Владимир']],
  ],
  [ // ловушка: зефир — ещё и ветер
    ['Инструменты', ['Балалайка', 'Гармонь', 'Гусли', 'Баян']],
    ['Напитки', ['Квас', 'Морс', 'Кисель', 'Сбитень']],
    ['Ветры', ['Бриз', 'Муссон', 'Сирокко', 'Пассат']],
    ['Сладости', ['Пряник', 'Пастила', 'Халва', 'Зефир']],
  ],
  [ // ловушка: локоть — старинная мера
    ['Игры', ['Шахматы', 'Лото', 'Домино', 'Городки']],
    ['Оружие', ['Сабля', 'Шашка', 'Булава', 'Копьё']],
    ['Старинные меры', ['Аршин', 'Верста', 'Сажень', 'Пуд']],
    ['Части тела', ['Колено', 'Плечо', 'Висок', 'Локоть']],
  ],
  [ // ловушка: Мороз — ещё и Дед Мороз
    ['Зимний спорт', ['Лыжи', 'Коньки', 'Санки', 'Хоккей']],
    ['Цирк', ['Клоун', 'Акробат', 'Фокусник', 'Дрессировщик']],
    ['Новый год', ['Ёлка', 'Мандарины', 'Снегурочка', 'Куранты']],
    ['Погода', ['Снег', 'Метель', 'Гололёд', 'Мороз']],
  ],
  [ // ловушка: слон и ладья
    ['Единоборства', ['Самбо', 'Бокс', 'Дзюдо', 'Борьба']],
    ['Животные', ['Лев', 'Тигр', 'Жираф', 'Медведь']],
    ['Лодки', ['Байдарка', 'Катер', 'Яхта', 'Плот']],
    ['Шахматы', ['Ферзь', 'Пешка', 'Слон', 'Ладья']],
  ],
  [ // ловушка: лимон — это ещё и миллион
    ['Цвета', ['Красный', 'Синий', 'Зелёный', 'Голубой']],
    ['Камни', ['Рубин', 'Изумруд', 'Сапфир', 'Алмаз']],
    ['Фрукты', ['Яблоко', 'Груша', 'Слива', 'Апельсин']],
    ['Деньги на сленге', ['Пятихатка', 'Сотка', 'Червонец', 'Лимон']],
  ],
  [ // ловушка: Тополь — ещё и дерево, Катюша — ещё и оружие
    ['Транспорт', ['Метро', 'Трамвай', 'Электричка', 'Маршрутка']],
    ['Деревья', ['Берёза', 'Дуб', 'Ель', 'Сосна']],
    ['Песни', ['Калинка', 'Подмосковные вечера', 'Смуглянка', 'Катюша']],
    ['Оружие', ['Калашников', 'Т-34', 'Макаров', 'Тополь']],
  ],
  [ // ловушка: Щелкунчик колет орехи
    ['Художники', ['Репин', 'Шишкин', 'Айвазовский', 'Кандинский']],
    ['Шахматисты', ['Каспаров', 'Карпов', 'Ботвинник', 'Алехин']],
    ['На кухне', ['Тёрка', 'Половник', 'Дуршлаг', 'Скалка']],
    ['Балеты', ['Лебединое озеро', 'Жизель', 'Спящая красавица', 'Щелкунчик']],
  ],
  [ // ловушка: почка и корень
    ['Органы', ['Сердце', 'Печень', 'Лёгкое', 'Желудок']],
    ['Части растения', ['Стебель', 'Лист', 'Цветок', 'Почка']],
    ['Сказки Пушкина', ['Золотая рыбка', 'Царь Салтан', 'Балда', 'Мёртвая царевна']],
    ['Математика', ['Степень', 'Дробь', 'Модуль', 'Корень']],
  ],
];

/* ═════════════════════════════ ZH ═════════════════════════════ */
export const ZH: NativeSet[] = [
  [ // 陷阱：青岛、哈尔滨也是城市，珠江也是啤酒
    ['名山', ['泰山', '黄山', '华山', '峨眉山']],
    ['城市', ['北京', '上海', '广州', '深圳']],
    ['河流', ['长江', '黄河', '淮河', '珠江']],
    ['啤酒', ['雪花', '燕京', '青岛', '哈尔滨']],
  ],
  [ // 陷阱：貂蝉也是三国人物
    ['四大名著', ['西游记', '红楼梦', '水浒传', '三国演义']],
    ['四大发明', ['造纸术', '印刷术', '指南针', '火药']],
    ['三国人物', ['刘备', '关羽', '张飞', '曹操']],
    ['四大美女', ['西施', '王昭君', '杨贵妃', '貂蝉']],
  ],
  [ // 陷阱：苹果和小米
    ['水果', ['香蕉', '西瓜', '葡萄', '苹果']],
    ['粮食', ['大米', '小麦', '玉米', '高粱']],
    ['电脑配件', ['键盘', '鼠标', '显示器', '耳机']],
    ['手机品牌', ['华为', '联想', '魅族', '小米']],
  ],
  [ // 陷阱：元宵既是节日也是食物
    ['运动员', ['姚明', '刘翔', '李娜', '郎平']],
    ['节日', ['春节', '端午', '中秋', '清明']],
    ['棋牌', ['象棋', '围棋', '麻将', '斗地主']],
    ['节日食品', ['饺子', '粽子', '月饼', '元宵']],
  ],
  [ // 陷阱：普洱也是云南的城市
    ['乐器', ['二胡', '古筝', '琵琶', '笛子']],
    ['武术', ['太极', '咏春', '少林', '截拳道']],
    ['云南', ['昆明', '大理', '丽江', '西双版纳']],
    ['名茶', ['龙井', '铁观音', '大红袍', '普洱']],
  ],
  [ // 陷阱：海马也是海洋生物，木马也是电脑病毒
    ['天气', ['台风', '暴雨', '冰雹', '雾霾']],
    ['电脑', ['病毒', '鼠标', '键盘', '硬盘']],
    ['海洋生物', ['鲸鱼', '海豚', '章鱼', '海星']],
    ['___马', ['斑马', '河马', '木马', '海马']],
  ],
  [ // 陷阱：刘德华也唱歌
    ['导演', ['张艺谋', '陈凯歌', '李安', '王家卫']],
    ['作家', ['鲁迅', '莫言', '老舍', '金庸']],
    ['歌手', ['邓丽君', '林俊杰', '蔡依林', '孙燕姿']],
    ['演员', ['成龙', '巩俐', '章子怡', '刘德华']],
  ],
  [ // 陷阱：长城也是景点
    ['互联网公司', ['阿里巴巴', '腾讯', '百度', '字节跳动']],
    ['出行方式', ['高铁', '地铁', '共享单车', '网约车']],
    ['景点', ['故宫', '兵马俑', '西湖', '布达拉宫']],
    ['汽车品牌', ['比亚迪', '吉利', '蔚来', '长城']],
  ],
  [ // 陷阱：八角也是一种形状
    ['火锅', ['毛肚', '鸭血', '黄喉', '虾滑']],
    ['小吃', ['煎饼', '肉夹馍', '凉皮', '臭豆腐']],
    ['形状', ['圆形', '三角形', '正方形', '六边形']],
    ['调料', ['酱油', '醋', '花椒', '八角']],
  ],
  [ // 陷阱：带数字的成语里也有动物
    ['节气', ['立春', '清明', '夏至', '冬至']],
    ['颜色', ['红色', '黄色', '蓝色', '紫色']],
    ['动物成语', ['画蛇添足', '对牛弹琴', '守株待兔', '狐假虎威']],
    ['数字成语', ['一石二鸟', '三心二意', '七上八下', '九牛一毛']],
  ],
  [ // 陷阱：比例尺也是一种“尺”
    ['学科', ['数学', '语文', '物理', '地理']],
    ['星座', ['白羊座', '天蝎座', '双子座', '狮子座']],
    ['地图', ['经线', '纬线', '赤道', '比例尺']],
    ['文具', ['铅笔', '橡皮', '尺子', '圆规']],
  ],
  [ // 陷阱：微信也能支付
    ['家电', ['冰箱', '空调', '洗衣机', '电视']],
    ['快递', ['顺丰', '圆通', '中通', '韵达']],
    ['支付方式', ['现金', '刷卡', '支付宝', '云闪付']],
    ['社交软件', ['微博', '抖音', '小红书', '微信']],
  ],
  [ // 陷阱：嫦娥也是中秋的传说
    ['春节', ['春联', '鞭炮', '红包', '年夜饭']],
    ['天体', ['太阳', '月亮', '彗星', '银河']],
    ['中秋', ['月饼', '赏月', '桂花', '灯笼']],
    ['航天', ['神舟', '天宫', '长征', '嫦娥']],
  ],
  [ // 陷阱：凤爪不是鸟的爪子，而是卤味
    ['身体部位', ['肩膀', '膝盖', '手肘', '脚踝']],
    ['鞋子', ['拖鞋', '球鞋', '高跟鞋', '皮鞋']],
    ['帽子', ['鸭舌帽', '草帽', '礼帽', '毛线帽']],
    ['卤味', ['鸭脖', '鸭舌', '鸡翅', '凤爪']],
  ],
];

/* ═════════════════════════════ JA ═════════════════════════════ */
export const JA: NativeSet[] = [
  [ // ひっかけ：キリンは動物でもある
    ['都市', ['東京', '大阪', '京都', '札幌']],
    ['川', ['信濃川', '利根川', '石狩川', '四万十川']],
    ['動物', ['ゾウ', 'ライオン', 'パンダ', 'カバ']],
    ['ビール', ['アサヒ', 'サッポロ', 'サントリー', 'キリン']],
  ],
  [ // ひっかけ：鏡餅もお餅
    ['寿司ネタ', ['マグロ', 'イクラ', 'ウニ', 'エビ']],
    ['麺類', ['ラーメン', 'うどん', 'そば', 'そうめん']],
    ['和菓子', ['大福', '羊羹', '団子', '柏餅']],
    ['お正月', ['おせち', '雑煮', 'お年玉', '鏡餅']],
  ],
  [ // ひっかけ：スバルは星団でもある
    ['野球選手', ['大谷', 'イチロー', '松井', 'ダルビッシュ']],
    ['サッカー選手', ['本田', '香川', '三笘', '中田']],
    ['天体', ['北斗七星', '天の川', '流れ星', '彗星']],
    ['自動車メーカー', ['トヨタ', 'マツダ', 'ホンダ', 'スバル']],
  ],
  [ // ひっかけ：ナルトはラーメンの具、ワンピースは服
    ['ゲーム', ['マリオ', 'ゼルダ', 'ポケモン', 'テトリス']],
    ['ラーメンの具', ['チャーシュー', 'メンマ', '煮卵', 'のり']],
    ['服', ['スカート', 'ブラウス', 'ジャケット', 'コート']],
    ['アニメ', ['ドラゴンボール', '鬼滅の刃', 'ナルト', 'ワンピース']],
  ],
  [ // ひっかけ：鎌倉は時代でもある
    ['戦国武将', ['織田信長', '豊臣秀吉', '徳川家康', '武田信玄']],
    ['寺', ['金閣寺', '清水寺', '東大寺', '本能寺']],
    ['時代', ['縄文', '平安', '室町', '江戸']],
    ['古都', ['京都', '奈良', '金沢', '鎌倉']],
  ],
  [ // ひっかけ：桜と梅は木でもある
    ['苗字', ['佐藤', '鈴木', '高橋', '田中']],
    ['祭り', ['ねぶた', '祇園祭', '阿波踊り', '七夕']],
    ['樹木', ['松', '杉', '檜', '楓']],
    ['花', ['ひまわり', '菊', '桜', '梅']],
  ],
  [ // ひっかけ：はやぶさは鳥でもある
    ['天気', ['晴れ', '雨', '雪', '雷']],
    ['家電', ['冷蔵庫', '洗濯機', '掃除機', '炊飯器']],
    ['鳥', ['ツバメ', 'カラス', 'スズメ', 'ハト']],
    ['新幹線', ['のぞみ', 'ひかり', 'こだま', 'はやぶさ']],
  ],
  [ // ひっかけ：帯は柔道でも使う
    ['相撲', ['横綱', '大関', '関脇', '小結']],
    ['剣道', ['竹刀', '面', '胴', '小手']],
    ['柔道', ['一本', '技あり', '畳', '柔道着']],
    ['着物', ['草履', '足袋', '下駄', '帯']],
  ],
  [ // ひっかけ：夏目漱石は作家でもある
    ['映画監督', ['黒澤明', '宮崎駿', '北野武', '小津安二郎']],
    ['作家', ['芥川龍之介', '太宰治', '村上春樹', '川端康成']],
    ['お菓子', ['ポッキー', 'じゃがりこ', 'うまい棒', 'きのこの山']],
    ['お札の顔', ['福沢諭吉', '野口英世', '渋沢栄一', '夏目漱石']],
  ],
  [ // ひっかけ：広島は都市でもある
    ['干支', ['ネズミ', 'ウシ', 'トラ', 'ウサギ']],
    ['果物', ['リンゴ', 'ミカン', 'ブドウ', 'モモ']],
    ['都市', ['福岡', '仙台', '名古屋', '神戸']],
    ['プロ野球', ['巨人', '阪神', 'ヤクルト', '広島']],
  ],
  [ // ひっかけ：「すき」は気持ちでもある、たこは海の生き物
    ['鍋', ['しゃぶしゃぶ', 'おでん', 'もつ鍋', 'ちゃんこ']],
    ['海の生き物', ['イカ', 'クラゲ', 'ヒトデ', 'カニ']],
    ['気持ち', ['嫌い', '嬉しい', '悲しい', '怖い']],
    ['〇〇焼き', ['お好み', 'もんじゃ', 'たこ', 'すき']],
  ],
  [ // ひっかけ：沖縄は島でもある
    ['名物', ['八ツ橋', 'もみじ饅頭', '明太子', 'ちんすこう']],
    ['方言', ['おおきに', 'なんくるないさ', 'めんそーれ', 'しばれる']],
    ['四つの大きな島', ['北海道', '本州', '四国', '九州']],
    ['県', ['青森', '秋田', '長野', '沖縄']],
  ],
  [ // ひっかけ：棗は果物でもある
    ['楽器', ['三味線', '琴', '尺八', '太鼓']],
    ['武器', ['刀', '槍', '弓', '手裏剣']],
    ['果物', ['柿', '梨', '桃', '栗']],
    ['茶道具', ['茶碗', '茶筅', '茶杓', '棗']],
  ],
  [ // ひっかけ：金星と金、土星と土
    ['方角', ['東', '西', '南', '北']],
    ['金属', ['金', '銀', '銅', '鉄']],
    ['自然', ['土', '石', '砂', '岩']],
    ['惑星', ['水星', '金星', '火星', '土星']],
  ],
];

/* ═════════════════════════════ KO ═════════════════════════════ */
export const KO: NativeSet[] = [
  [ // 함정: 대구는 생선이기도 하다
    ['산', ['한라산', '설악산', '지리산', '북한산']],
    ['섬', ['제주도', '독도', '울릉도', '거제도']],
    ['생선', ['고등어', '갈치', '연어', '명태']],
    ['도시', ['서울', '부산', '인천', '대구']],
  ],
  [ // 함정: 떡볶이에도 떡이 들어간다
    ['술', ['소주', '막걸리', '맥주', '동동주']],
    ['명절', ['설날', '추석', '단오', '정월대보름']],
    ['떡', ['송편', '인절미', '가래떡', '백설기']],
    ['음식', ['김치', '불고기', '비빔밥', '떡볶이']],
  ],
  [ // 함정: 공유는 SNS 기능이기도 하다
    ['아이돌', ['방탄소년단', '블랙핑크', '트와이스', '엑소']],
    ['축구 선수', ['손흥민', '박지성', '차범근', '이강인']],
    ['SNS', ['좋아요', '댓글', '구독', '알림']],
    ['배우', ['송강호', '이병헌', '전지현', '공유']],
  ],
  [ // 함정: 경복궁은 역 이름이기도 하다
    ['한강 다리', ['마포대교', '한남대교', '성수대교', '반포대교']],
    ['민속놀이', ['윷놀이', '제기차기', '연날리기', '팽이치기']],
    ['궁', ['창덕궁', '덕수궁', '창경궁', '경희궁']],
    ['지하철역', ['시청', '종로3가', '서울역', '경복궁']],
  ],
  [ // 함정: 셋은 고유어 숫자이기도 하다
    ['자음 이름', ['기역', '니은', '디귿', '리을']],
    ['한자어 숫자', ['일', '이', '삼', '사']],
    ['고유어 숫자', ['하나', '둘', '다섯', '여섯']],
    ['테니스 용어', ['서브', '듀스', '발리', '셋']],
  ],
  [ // 함정: 배는 과일, 눈은 날씨
    ['탈것', ['비행기', '기차', '자전거', '버스']],
    ['날씨', ['비', '바람', '안개', '우박']],
    ['과일', ['사과', '포도', '감', '배']],
    ['얼굴', ['코', '입', '귀', '눈']],
  ],
  [ // 함정: 괴물·도깨비는 전설 속 존재이기도 하다
    ['해산물', ['문어', '새우', '꽃게', '전복']],
    ['전설 속 존재', ['구미호', '저승사자', '해태', '처녀귀신']],
    ['영화', ['기생충', '올드보이', '부산행', '괴물']],
    ['드라마', ['오징어 게임', '대장금', '겨울연가', '도깨비']],
  ],
  [ // 함정: 띠는 열두 띠이기도 하다
    ['스포츠', ['태권도', '씨름', '양궁', '쇼트트랙']],
    ['새', ['까치', '두루미', '참새', '비둘기']],
    ['열두 띠', ['쥐', '소', '용', '호랑이']],
    ['태권도 용어', ['품새', '겨루기', '도복', '띠']],
  ],
  [ // 함정: 간호사도 직업이다
    ['학교', ['교실', '칠판', '급식', '운동장']],
    ['과목', ['국어', '수학', '과학', '체육']],
    ['직업', ['의사', '선생님', '경찰', '소방관']],
    ['병원', ['주사', '진료', '처방전', '간호사']],
  ],
  [ // 함정: 너구리는 동물이기도 하다
    ['기업', ['삼성', '현대', '엘지', '기아']],
    ['자동차', ['쏘나타', '그랜저', '아반떼', '싼타페']],
    ['동물', ['고양이', '토끼', '다람쥐', '여우']],
    ['라면', ['신라면', '진라면', '짜파게티', '너구리']],
  ],
  [ // 함정: 김은 성씨이기도 하다
    ['계절', ['봄', '여름', '가을', '겨울']],
    ['방위', ['동', '서', '남', '북']],
    ['성씨', ['이', '박', '최', '정']],
    ['반찬', ['나물', '멸치볶음', '계란말이', '김']],
  ],
  [ // 함정: 안산은 도시이기도 하다
    ['영화감독', ['봉준호', '박찬욱', '홍상수', '이창동']],
    ['가수', ['아이유', '싸이', '보아', '임영웅']],
    ['도시', ['수원', '전주', '광주', '울산']],
    ['운동선수', ['김연아', '박세리', '손연재', '안산']],
  ],
  [ // 함정: 한강도 '한'으로 시작한다
    ['전통 음료', ['식혜', '수정과', '유자차', '오미자차']],
    ['국악기', ['가야금', '거문고', '장구', '해금']],
    ['한___', ['한복', '한옥', '한지', '한식']],
    ['강', ['낙동강', '금강', '영산강', '한강']],
  ],
  [ // 함정: 바나나우유도 편의점 대표 메뉴
    ['커피', ['아메리카노', '라떼', '에스프레소', '모카']],
    ['빵', ['소보로', '단팥빵', '크루아상', '식빵']],
    ['과일', ['딸기', '수박', '참외', '귤']],
    ['편의점', ['삼각김밥', '컵라면', '도시락', '바나나우유']],
  ],
];

/* ═════════════════════════════ AR ═════════════════════════════ */
export const AR: NativeSet[] = [
  [ // فخ: الأردن نهر ودولة
    ['عواصم', ['القاهرة', 'الرياض', 'بغداد', 'دمشق']],
    ['مدن مقدسة', ['مكة', 'المدينة', 'القدس', 'النجف']],
    ['دول', ['المغرب', 'تونس', 'لبنان', 'اليمن']],
    ['أنهار', ['النيل', 'الفرات', 'دجلة', 'الأردن']],
  ],
  [ // فخ: الملوخية خضار أيضًا
    ['حلويات', ['كنافة', 'بقلاوة', 'بسبوسة', 'قطايف']],
    ['مشروبات', ['قهوة', 'شاي', 'عصير قصب', 'سحلب']],
    ['خضار', ['باذنجان', 'كوسا', 'بامية', 'فلفل']],
    ['أكلات', ['كبسة', 'منسف', 'كسكس', 'ملوخية']],
  ],
  [ // فخ: الفيروز حجر كريم
    ['لاعبون', ['محمد صلاح', 'رياض محرز', 'حكيم زياش', 'سامي الجابر']],
    ['أدباء', ['نجيب محفوظ', 'طه حسين', 'جبران', 'المتنبي']],
    ['أحجار كريمة', ['ياقوت', 'زمرد', 'ألماس', 'لؤلؤ']],
    ['مطربون', ['أم كلثوم', 'عبد الحليم', 'عمرو دياب', 'فيروز']],
  ],
  [ // فخ: صفر رقم وشهر
    ['أركان الإسلام', ['الشهادة', 'الصلاة', 'الزكاة', 'الحج']],
    ['أعياد', ['عيد الفطر', 'عيد الأضحى', 'المولد النبوي', 'رأس السنة']],
    ['أرقام', ['واحد', 'ثلاثة', 'عشرة', 'مئة']],
    ['أشهر هجرية', ['رمضان', 'شعبان', 'رجب', 'صفر']],
  ],
  [ // فخ: العقرب من حيوانات الصحراء، والحمل خروف صغير
    ['ألوان', ['الأحمر', 'الأزرق', 'الأخضر', 'الأصفر']],
    ['كواكب', ['المريخ', 'الزهرة', 'زحل', 'المشتري']],
    ['حيوانات الصحراء', ['الجمل', 'الضب', 'الغزال', 'الصقر']],
    ['الأبراج', ['الجوزاء', 'الدلو', 'الحمل', 'العقرب']],
  ],
  [ // فخ: العود عطر أيضًا، والقانون آلة
    ['مدن خليجية', ['دبي', 'الدوحة', 'مسقط', 'المنامة']],
    ['المحكمة', ['قاضي', 'محامي', 'شاهد', 'متهم']],
    ['عطور', ['مسك', 'عنبر', 'ورد', 'بخور']],
    ['آلات موسيقية', ['ناي', 'دربكة', 'قانون', 'عود']],
  ],
  [ // فخ: الإدريسي عالم أيضًا
    ['شعراء', ['أحمد شوقي', 'نزار قباني', 'محمود درويش', 'أبو تمام']],
    ['خلفاء', ['أبو بكر', 'عمر', 'عثمان', 'علي']],
    ['علماء', ['ابن سينا', 'الخوارزمي', 'ابن الهيثم', 'الرازي']],
    ['رحالة', ['ابن بطوطة', 'ابن جبير', 'ابن فضلان', 'الإدريسي']],
  ],
  [ // فخ: الحمام طائر أيضًا
    ['أثاث', ['كرسي', 'طاولة', 'سرير', 'خزانة']],
    ['أدوات المطبخ', ['قدر', 'مقلاة', 'ملعقة', 'سكين']],
    ['طيور', ['صقر', 'نسر', 'بومة', 'عصفور']],
    ['أجزاء البيت', ['مطبخ', 'صالة', 'غرفة نوم', 'حمام']],
  ],
  [ // فخ: البتراء من المعالم أيضًا
    ['صحارى', ['الربع الخالي', 'النفود', 'الصحراء الكبرى', 'سيناء']],
    ['بحار', ['البحر الأحمر', 'البحر المتوسط', 'بحر العرب', 'البحر الميت']],
    ['معالم', ['الأهرامات', 'برج خليفة', 'قصر الحمراء', 'أبو الهول']],
    ['مدن قديمة', ['قرطاج', 'تدمر', 'بابل', 'البتراء']],
  ],
  [ // فخ: الهلال من أطوار القمر
    ['ألعاب', ['شطرنج', 'طاولة زهر', 'دومينو', 'كوتشينة']],
    ['رياضات', ['سباحة', 'فروسية', 'رماية', 'مصارعة']],
    ['أطوار القمر', ['البدر', 'المحاق', 'الأحدب', 'التربيع']],
    ['أندية', ['الأهلي', 'الزمالك', 'الوداد', 'الهلال']],
  ],
  [ // فخ: الرمان فاكهة، والرمانة قنبلة
    ['ملابس', ['ثوب', 'عباية', 'شماغ', 'جلابية']],
    ['طقس', ['مطر', 'رياح', 'غبار', 'برق']],
    ['مشروبات', ['كركديه', 'لبن', 'تمر هندي', 'عرقسوس']],
    ['فواكه', ['تمر', 'تين', 'عنب', 'رمان']],
  ],
  [ // فخ: التاريخ مادة دراسية وتقويم
    ['مهن', ['طبيب', 'مهندس', 'معلم', 'طيار']],
    ['أدوات مدرسية', ['قلم', 'مسطرة', 'ممحاة', 'دفتر']],
    ['تقويم', ['يوم', 'أسبوع', 'شهر', 'سنة']],
    ['مواد دراسية', ['رياضيات', 'علوم', 'جغرافيا', 'تاريخ']],
  ],
  [ // فخ: العين ينبوع ماء أيضًا
    ['أشكال', ['دائرة', 'مربع', 'مثلث', 'نجمة']],
    ['عدة النجار', ['مطرقة', 'منشار', 'مفك', 'كماشة']],
    ['مصادر الماء', ['بئر', 'نهر', 'بحيرة', 'واحة']],
    ['الجسم', ['يد', 'رأس', 'قلب', 'عين']],
  ],
  [ // فخ: الفانوس للإنارة أيضًا
    ['ألف ليلة وليلة', ['علاء الدين', 'علي بابا', 'السندباد', 'شهرزاد']],
    ['كائنات أسطورية', ['الغول', 'العنقاء', 'الجن', 'الرخ']],
    ['إنارة', ['شمعة', 'مصباح', 'ثريا', 'قنديل']],
    ['رمضان', ['سحور', 'إفطار', 'تراويح', 'فانوس']],
  ],
];

/* ═════════════════════════════ HI ═════════════════════════════ */
export const HI: NativeSet[] = [
  [ // जाल: दार्जिलिंग हिल स्टेशन भी है
    ['शहर', ['दिल्ली', 'मुंबई', 'कोलकाता', 'चेन्नई']],
    ['नदियाँ', ['गंगा', 'यमुना', 'गोदावरी', 'कावेरी']],
    ['हिल स्टेशन', ['शिमला', 'मनाली', 'ऊटी', 'मसूरी']],
    ['चाय', ['मसाला', 'अदरक', 'इलायची', 'दार्जिलिंग']],
  ],
  [ // जाल: आशा एक भावना भी है
    ['क्रिकेटर', ['सचिन', 'धोनी', 'कोहली', 'कपिल']],
    ['अभिनेता', ['शाहरुख़', 'सलमान', 'आमिर', 'अमिताभ']],
    ['भावनाएँ', ['प्रेम', 'क्रोध', 'डर', 'ख़ुशी']],
    ['गायक', ['लता', 'किशोर', 'रफ़ी', 'आशा']],
  ],
  [ // जाल: केसर मसाला भी है
    ['खाना', ['बिरयानी', 'समोसा', 'डोसा', 'पनीर']],
    ['मिठाई', ['जलेबी', 'रसगुल्ला', 'लड्डू', 'बर्फ़ी']],
    ['मसाले', ['हल्दी', 'जीरा', 'इलायची', 'लौंग']],
    ['आम की किस्में', ['अल्फ़ांसो', 'लंगड़ा', 'दशहरी', 'केसर']],
  ],
  [ // जाल: दीपक दीये जैसा लगता है
    ['नृत्य', ['भरतनाट्यम', 'कथक', 'भांगड़ा', 'गरबा']],
    ['खेल', ['कबड्डी', 'खो-खो', 'गिल्ली-डंडा', 'कैरम']],
    ['दिवाली', ['दीया', 'रंगोली', 'पटाखे', 'लक्ष्मी पूजा']],
    ['राग', ['यमन', 'भैरवी', 'मल्हार', 'दीपक']],
  ],
  [ // जाल: लगान एक कर भी है
    ['अभिनेत्रियाँ', ['माधुरी', 'ऐश्वर्या', 'दीपिका', 'काजोल']],
    ['खलनायक', ['गब्बर', 'मोगैंबो', 'शाकाल', 'कांचा']],
    ['पैसों के शब्द', ['किराया', 'ब्याज', 'जुर्माना', 'शुल्क']],
    ['फ़िल्में', ['शोले', 'दंगल', 'पीके', 'लगान']],
  ],
  [ // जाल: कमल फूल है, आम फल है
    ['शतरंज के मोहरे', ['वज़ीर', 'ऊँट', 'घोड़ा', 'हाथी']],
    ['फल', ['केला', 'अमरूद', 'पपीता', 'लीची']],
    ['फूल', ['गुलाब', 'गेंदा', 'चमेली', 'सूरजमुखी']],
    ['राष्ट्रीय प्रतीक', ['बाघ', 'मोर', 'कमल', 'आम']],
  ],
  [ // जाल: आदित्य सूर्य का नाम भी है
    ['ग्रह', ['मंगल', 'बुध', 'शुक्र', 'शनि']],
    ['वैज्ञानिक', ['कलाम', 'रमन', 'भाभा', 'बोस']],
    ['सूर्य के नाम', ['रवि', 'भानु', 'दिनकर', 'सूरज']],
    ['इसरो मिशन', ['चंद्रयान', 'मंगलयान', 'गगनयान', 'आदित्य']],
  ],
  [ // जाल: बेलन एक आकार भी है
    ['रिश्ते', ['चाचा', 'मामा', 'बुआ', 'मौसी']],
    ['कपड़े', ['साड़ी', 'कुर्ता', 'धोती', 'लहँगा']],
    ['रसोई', ['तवा', 'कड़ाही', 'चिमटा', 'कुकर']],
    ['आकार', ['गोला', 'घन', 'शंकु', 'बेलन']],
  ],
  [ // जाल: बादशाह और बेगम शासक भी हैं
    ['क्रिकेट', ['छक्का', 'चौका', 'विकेट', 'ओवर']],
    ['मुग़ल', ['अकबर', 'बाबर', 'शाहजहाँ', 'औरंगज़ेब']],
    ['शासक', ['सम्राट', 'राजा', 'नवाब', 'महाराजा']],
    ['ताश', ['इक्का', 'ग़ुलाम', 'बादशाह', 'बेगम']],
  ],
  [ // जाल: सर्दी मौसम भी है, उत्तर जवाब भी
    ['शरीर', ['हाथ', 'पैर', 'सिर', 'कान']],
    ['दिशाएँ', ['उत्तर', 'दक्षिण', 'पूर्व', 'पश्चिम']],
    ['मौसम', ['गर्मी', 'बरसात', 'बसंत', 'पतझड़']],
    ['बीमारियाँ', ['बुखार', 'खाँसी', 'ज़ुकाम', 'सर्दी']],
  ],
  [ // जाल: थार रेगिस्तान भी है
    ['कंपनियाँ', ['रिलायंस', 'इन्फ़ोसिस', 'विप्रो', 'अदाणी']],
    ['ऐप', ['पेटीएम', 'ज़ोमैटो', 'स्विगी', 'ओला']],
    ['भारत का भूगोल', ['हिमालय', 'दक्कन', 'सुंदरबन', 'कच्छ']],
    ['कारें', ['स्विफ़्ट', 'नैनो', 'स्कॉर्पियो', 'थार']],
  ],
  [ // जाल: अर्जुन एक पुरस्कार भी है
    ['रामायण', ['राम', 'सीता', 'हनुमान', 'रावण']],
    ['ग्रंथ', ['वेद', 'उपनिषद', 'गीता', 'पुराण']],
    ['पुरस्कार', ['खेल रत्न', 'ध्यानचंद', 'पद्म श्री', 'भारत रत्न']],
    ['महाभारत', ['भीम', 'कृष्ण', 'कर्ण', 'अर्जुन']],
  ],
  [ // जाल: शताब्दी समय की इकाई भी है
    ['वाहन', ['रिक्शा', 'ऑटो', 'बस', 'स्कूटर']],
    ['सड़क', ['हाईवे', 'चौराहा', 'फ़्लाईओवर', 'टोल']],
    ['समय', ['दशक', 'सदी', 'वर्ष', 'युग']],
    ['ट्रेनें', ['राजधानी', 'दुरंतो', 'वंदे भारत', 'शताब्दी']],
  ],
  [ // जाल: तिलक श्रृंगार भी है, बोस वैज्ञानिक भी
    ['प्रधानमंत्री', ['नेहरू', 'इंदिरा', 'वाजपेयी', 'मोदी']],
    ['वैज्ञानिक', ['रमन', 'भाभा', 'कलाम', 'साराभाई']],
    ['श्रृंगार', ['बिंदी', 'सिंदूर', 'मेहँदी', 'काजल']],
    ['स्वतंत्रता सेनानी', ['भगत सिंह', 'आज़ाद', 'तिलक', 'बोस']],
  ],
];
