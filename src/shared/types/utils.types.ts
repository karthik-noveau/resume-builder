export type DeepPartial<T> = T extends object
  ? { [P in keyof T]?: DeepPartial<T[P]> }
  : T

export type NonEmptyArray<T> = [T, ...T[]]

export type Nullable<T> = T | null

export type ID = string
