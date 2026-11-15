import { ja } from './locales/ja';

/** The key space and entry shapes, derived from the Japanese dictionary. */
export type Dict = typeof ja;

export type DictKey = keyof Dict;

/** Keys whose entry is a plain string, so `t(key)` takes no params. */
export type StaticKey = {
  [K in DictKey]: Dict[K] extends (params: never) => string ? never : K;
}[DictKey];

/** Keys whose entry interpolates, so `t(key, params)` requires params. */
export type TemplateKey = Exclude<DictKey, StaticKey>;

export type ParamsOf<K extends TemplateKey> = Dict[K] extends (params: infer P) => string
  ? P
  : never;

/**
 * Overloaded so that a static key rejects a params argument and a template key
 * requires exactly its own params object.
 */
export interface Translator {
  <K extends StaticKey>(key: K): string;
  <K extends TemplateKey>(key: K, params: ParamsOf<K>): string;
}
