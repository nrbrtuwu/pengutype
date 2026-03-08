import english from "./english.json";
import english_1k from "./english_1k.json";
import english_5k from "./english_5k.json";
import hungarian from "./hungarian.json";
import hungarian_1k from "./hungarian_1k.json";
import hungarian_2k from "./hungarian_2k.json";
import spanish from "./spanish.json";
import french from "./french.json";
import german from "./german.json";
import portuguese from "./portuguese.json";
import italian from "./italian.json";
import dutch from "./dutch.json";
import russian from "./russian.json";
import japanese from "./japanese.json";
import korean from "./korean.json";
import chinese from "./chinese.json";
import code_javascript from "./code_javascript.json";
import code_python from "./code_python.json";
import code_typescript from "./code_typescript.json";

export const languages = {
  english,
  english_1k,
  english_5k,
  hungarian,
  hungarian_1k,
  hungarian_2k,
  spanish,
  french,
  german,
  portuguese,
  italian,
  dutch,
  russian,
  japanese,
  korean,
  chinese,
  code_javascript,
  code_python,
  code_typescript,
} as const;

export type LanguageKey =
  | 'english'
  | 'english_1k'
  | 'english_5k'
  | 'hungarian'
  | 'hungarian_1k'
  | 'hungarian_2k'
  | 'spanish'
  | 'french'
  | 'german'
  | 'portuguese'
  | 'italian'
  | 'dutch'
  | 'russian'
  | 'japanese'
  | 'korean'
  | 'chinese'
  | 'code_javascript'
  | 'code_python'
  | 'code_typescript';
