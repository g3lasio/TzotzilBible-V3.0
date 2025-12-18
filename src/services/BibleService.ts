import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';
import { databaseService } from './DatabaseService';
import { WebBibleService } from './WebBibleService';
import { BibleVerse, Book } from '../types/bible';
import bibleBooks from '../../assets/bible_books.json';

const OFFLINE_PROMISES = [
  // Promesas de amor y salvación
  "Porque de tal manera amó Dios al mundo, que ha dado a su Hijo unigénito, para que todo aquel que en él cree, no se pierda, mas tenga vida eterna. - Juan 3:16",
  "Mas Dios muestra su amor para con nosotros, en que siendo aún pecadores, Cristo murió por nosotros. - Romanos 5:8",
  "Porque por gracia sois salvos por medio de la fe; y esto no de vosotros, pues es don de Dios. - Efesios 2:8",
  "Yo soy el camino, y la verdad, y la vida; nadie viene al Padre, sino por mí. - Juan 14:6",
  "Si confesares con tu boca que Jesús es el Señor, y creyeres en tu corazón que Dios le levantó de los muertos, serás salvo. - Romanos 10:9",
  
  // Promesas de paz y consuelo
  "El Señor es mi pastor; nada me faltará. - Salmo 23:1",
  "La paz os dejo, mi paz os doy; yo no os la doy como el mundo la da. No se turbe vuestro corazón, ni tenga miedo. - Juan 14:27",
  "Venid a mí todos los que estáis trabajados y cargados, y yo os haré descansar. - Mateo 11:28",
  "Echando toda vuestra ansiedad sobre él, porque él tiene cuidado de vosotros. - 1 Pedro 5:7",
  "Dios es nuestro amparo y fortaleza, nuestro pronto auxilio en las tribulaciones. - Salmo 46:1",
  "Aunque ande en valle de sombra de muerte, no temeré mal alguno, porque tú estarás conmigo. - Salmo 23:4",
  "Bienaventurados los que lloran, porque ellos recibirán consolación. - Mateo 5:4",
  "El Señor está cerca de los quebrantados de corazón; y salva a los contritos de espíritu. - Salmo 34:18",
  
  // Promesas de fortaleza y valor
  "No temas, porque yo estoy contigo; no desmayes, porque yo soy tu Dios que te esfuerzo. - Isaías 41:10",
  "Todo lo puedo en Cristo que me fortalece. - Filipenses 4:13",
  "Mira que te mando que te esfuerces y seas valiente; no temas ni desmayes, porque Jehová tu Dios estará contigo. - Josué 1:9",
  "El Señor es mi luz y mi salvación; ¿de quién temeré? El Señor es la fortaleza de mi vida; ¿de quién he de atemorizarme? - Salmo 27:1",
  "Cuando pases por las aguas, yo estaré contigo; y si por los ríos, no te anegarán. - Isaías 43:2",
  "Pero los que esperan a Jehová tendrán nuevas fuerzas; levantarán alas como las águilas. - Isaías 40:31",
  "Jehová peleará por vosotros, y vosotros estaréis tranquilos. - Éxodo 14:14",
  "En el día que temo, yo en ti confío. En Dios alabaré su palabra; en Dios he confiado. - Salmo 56:3-4",
  
  // Promesas de dirección y sabiduría
  "Fíate de Jehová de todo tu corazón, y no te apoyes en tu propia prudencia. Reconócelo en todos tus caminos, y él enderezará tus veredas. - Proverbios 3:5-6",
  "Lámpara es a mis pies tu palabra, y lumbrera a mi camino. - Salmo 119:105",
  "Y si alguno de vosotros tiene falta de sabiduría, pídala a Dios, el cual da a todos abundantemente y sin reproche. - Santiago 1:5",
  "Te haré entender, y te enseñaré el camino en que debes andar; sobre ti fijaré mis ojos. - Salmo 32:8",
  "Porque yo sé los pensamientos que tengo acerca de vosotros, dice Jehová, pensamientos de paz, y no de mal, para daros el fin que esperáis. - Jeremías 29:11",
  
  // Promesas de provisión
  "Mi Dios, pues, suplirá todo lo que os falta conforme a sus riquezas en gloria en Cristo Jesús. - Filipenses 4:19",
  "Jehová es mi pastor; nada me faltará. En lugares de delicados pastos me hará descansar. - Salmo 23:1-2",
  "Joven fui, y he envejecido, y no he visto justo desamparado, ni su descendencia que mendigue pan. - Salmo 37:25",
  "Buscad primeramente el reino de Dios y su justicia, y todas estas cosas os serán añadidas. - Mateo 6:33",
  "Gustad, y ved que es bueno Jehová; dichoso el hombre que confía en él. - Salmo 34:8",
  
  // Promesas de protección
  "El ángel de Jehová acampa alrededor de los que le temen, y los defiende. - Salmo 34:7",
  "Porque él mandará a sus ángeles acerca de ti, que te guarden en todos tus caminos. - Salmo 91:11",
  "El que habita al abrigo del Altísimo morará bajo la sombra del Omnipotente. - Salmo 91:1",
  "No te sobrevendrá mal, ni plaga tocará tu morada. - Salmo 91:10",
  "Ningún arma forjada contra ti prosperará. - Isaías 54:17",
  
  // Promesas de perdón y restauración
  "Si confesamos nuestros pecados, él es fiel y justo para perdonar nuestros pecados, y limpiarnos de toda maldad. - 1 Juan 1:9",
  "Cuanto está lejos el oriente del occidente, hizo alejar de nosotros nuestras rebeliones. - Salmo 103:12",
  "Venid luego, dice Jehová, y estemos a cuenta: si vuestros pecados fueren como la grana, como la nieve serán emblanquecidos. - Isaías 1:18",
  "De modo que si alguno está en Cristo, nueva criatura es; las cosas viejas pasaron; he aquí todas son hechas nuevas. - 2 Corintios 5:17",
  "Y os restituiré los años que comió la oruga, el saltón, el revoltón y la langosta. - Joel 2:25",
  
  // Promesas para la oración
  "Y sabemos que a los que aman a Dios, todas las cosas les ayudan a bien. - Romanos 8:28",
  "Pedid, y se os dará; buscad, y hallaréis; llamad, y se os abrirá. - Mateo 7:7",
  "Y todo lo que pidiereis en oración, creyendo, lo recibiréis. - Mateo 21:22",
  "Clama a mí, y yo te responderé, y te enseñaré cosas grandes y ocultas que tú no conoces. - Jeremías 33:3",
  "Los ojos de Jehová están sobre los justos, y atentos sus oídos al clamor de ellos. - Salmo 34:15",
  
  // Promesas de vida eterna y esperanza
  "Porque esta leve tribulación momentánea produce en nosotros un cada vez más excelente y eterno peso de gloria. - 2 Corintios 4:17",
  "He aquí, yo vengo pronto, y mi galardón conmigo, para recompensar a cada uno según sea su obra. - Apocalipsis 22:12",
  "En la casa de mi Padre muchas moradas hay; si así no fuera, yo os lo hubiera dicho; voy, pues, a preparar lugar para vosotros. - Juan 14:2",
  "Enjugará Dios toda lágrima de los ojos de ellos; y ya no habrá muerte, ni habrá más llanto. - Apocalipsis 21:4",
  "Porque de cierto os digo que si tuviereis fe como un grano de mostaza, diréis a este monte: Pásate de aquí allá, y se pasará. - Mateo 17:20",
  
  // Promesas de fidelidad divina
  "Jehová cumplirá su propósito en mí; tu misericordia, oh Jehová, es para siempre. - Salmo 138:8",
  "Fiel es el que os llama, el cual también lo hará. - 1 Tesalonicenses 5:24",
  "Porque los montes se moverán, y los collados temblarán, pero no se apartará de ti mi misericordia. - Isaías 54:10",
  "Grande es tu fidelidad. - Lamentaciones 3:23",
  "Porque yo Jehová no cambio; por esto, hijos de Jacob, no habéis sido consumidos. - Malaquías 3:6",
  "Nunca te dejaré, ni te desampararé. - Hebreos 13:5",
  
  // Promesas de gozo y alabanza
  "Este es el día que hizo Jehová; nos gozaremos y alegraremos en él. - Salmo 118:24",
  "Estad siempre gozosos. Orad sin cesar. Dad gracias en todo. - 1 Tesalonicenses 5:16-18",
  "El gozo de Jehová es vuestra fuerza. - Nehemías 8:10",
  "Me mostrarás la senda de la vida; en tu presencia hay plenitud de gozo. - Salmo 16:11",
  
  // Promesas de amor fraternal
  "Un mandamiento nuevo os doy: Que os améis unos a otros; como yo os he amado. - Juan 13:34",
  "En esto conocerán todos que sois mis discípulos, si tuviereis amor los unos con los otros. - Juan 13:35",
  "Amaos los unos a los otros con amor fraternal; en cuanto a honra, prefiriéndoos los unos a los otros. - Romanos 12:10",
  
  // Promesas especiales
  "He aquí, yo estoy a la puerta y llamo; si alguno oye mi voz y abre la puerta, entraré a él. - Apocalipsis 3:20",
  "Bienaventurados los de limpio corazón, porque ellos verán a Dios. - Mateo 5:8",
  "El ladrón no viene sino para hurtar y matar y destruir; yo he venido para que tengan vida, y para que la tengan en abundancia. - Juan 10:10",
  "Pero buscad primeramente el reino de Dios y su justicia, y todas estas cosas os serán añadidas. - Mateo 6:33"
];

const isWeb = Platform.OS === 'web';

export class BibleService {
  static async initialize(): Promise<boolean> {
    if (isWeb) {
      return WebBibleService.initialize();
    }
    return databaseService.initDatabase();
  }

  static async getBooks(): Promise<Book[]> {
    try {
      if (isWeb) {
        const books = await WebBibleService.getBooks();
        if (books.length > 0) {
          return books;
        }
      } else if (databaseService.isReady()) {
        const books = await databaseService.getBooks();
        if (books.length > 0) {
          return books;
        }
      }

      return bibleBooks as Book[];
    } catch (error) {
      console.error('Error fetching books:', error);
      return bibleBooks as Book[];
    }
  }

  static async getChapters(book: string): Promise<number[]> {
    try {
      if (isWeb) {
        const chapters = await WebBibleService.getChaptersCount(book);
        if (chapters.length > 0) {
          return chapters;
        }
      } else if (databaseService.isReady()) {
        const chapters = await databaseService.getChaptersCount(book);
        if (chapters.length > 0) {
          return chapters;
        }
      }

      const bookData = bibleBooks.find(b => b.name === book);
      if (bookData) {
        return Array.from({ length: bookData.chapters }, (_, i) => i + 1);
      }

      return [];
    } catch (error) {
      console.error('Error fetching chapters:', error);
      return [];
    }
  }

  static async getVerses(book: string, chapter: number): Promise<BibleVerse[]> {
    try {
      if (isWeb) {
        const verses = await WebBibleService.getVerses(book, chapter);
        if (verses.length > 0) {
          return verses;
        }
      } else if (databaseService.isReady()) {
        const verses = await databaseService.getVerses(book, chapter);
        if (verses.length > 0) {
          return verses;
        }
      }

      const cacheKey = `verses_${book}_${chapter}`;
      const cachedVerses = await AsyncStorage.getItem(cacheKey);
      if (cachedVerses) {
        return JSON.parse(cachedVerses);
      }

      return [{
        id: 1,
        book_id: 1,
        chapter: chapter,
        verse: 1,
        text: 'Cargando versículos...',
        text_tzotzil: 'Ta xjatav li k\'opetike...',
        book_name: book
      }];
    } catch (error) {
      console.error('Error fetching verses:', error);
      return [];
    }
  }

  static async getRandomPromise(): Promise<string> {
    try {
      if (!isWeb && databaseService.isReady()) {
        const promise = await databaseService.getRandomPromise();
        if (promise) {
          return promise.text;
        }
      }
      
      return this.getSmartRandomPromise();
    } catch (error) {
      console.error('Error fetching random promise:', error);
      return this.getSmartRandomPromise();
    }
  }

  private static async getSmartRandomPromise(): Promise<string> {
    const LAST_PROMISE_KEY = 'last_promise_index';
    const RECENT_PROMISES_KEY = 'recent_promises';
    const MAX_RECENT = 10;
    
    try {
      const recentJson = await AsyncStorage.getItem(RECENT_PROMISES_KEY);
      const recentIndices: number[] = recentJson ? JSON.parse(recentJson) : [];
      
      const availableIndices = OFFLINE_PROMISES
        .map((_, i) => i)
        .filter(i => !recentIndices.includes(i));
      
      const candidateIndices = availableIndices.length > 0 
        ? availableIndices 
        : OFFLINE_PROMISES.map((_, i) => i);
      
      const randomIndex = candidateIndices[Math.floor(Math.random() * candidateIndices.length)];
      
      recentIndices.push(randomIndex);
      if (recentIndices.length > MAX_RECENT) {
        recentIndices.shift();
      }
      await AsyncStorage.setItem(RECENT_PROMISES_KEY, JSON.stringify(recentIndices));
      
      return OFFLINE_PROMISES[randomIndex];
    } catch (error) {
      return OFFLINE_PROMISES[Math.floor(Math.random() * OFFLINE_PROMISES.length)];
    }
  }

  static async searchVerses(query: string): Promise<BibleVerse[]> {
    try {
      if (isWeb) {
        return WebBibleService.searchVerses(query);
      } else if (databaseService.isReady()) {
        return databaseService.searchVerses(query);
      }

      return [];
    } catch (error) {
      console.error('Error searching verses:', error);
      return [];
    }
  }

  static async getVerse(book: string, chapter: number, verse: number): Promise<BibleVerse | null> {
    try {
      if (isWeb) {
        return WebBibleService.getVerse(book, chapter, verse);
      } else if (databaseService.isReady()) {
        return databaseService.getVerse(book, chapter, verse);
      }

      return null;
    } catch (error) {
      console.error('Error fetching verse:', error);
      return null;
    }
  }

  static async clearCache(): Promise<void> {
    try {
      const keys = await AsyncStorage.getAllKeys();
      const bibleKeys = keys.filter(key => 
        key.startsWith('bible_') || 
        key.startsWith('chapters_') || 
        key.startsWith('verses_')
      );
      await AsyncStorage.multiRemove(bibleKeys);
    } catch (error) {
      console.error('Error clearing cache:', error);
    }
  }
}
