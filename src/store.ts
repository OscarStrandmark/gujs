export interface StateStore<T extends object> {
  readonly state: T;
  save(): void;
  patch(values: Partial<T>): void;
  reset(): void;
}

export interface StateStoreOptions<T extends object> {
  key: string;
  defaults: T;
  storage?: Storage | null;
  transient?: readonly (keyof T)[];
}

export function createStateStore<T extends object>(options: StateStoreOptions<T>): StateStore<T> {
  const storage = options.storage === undefined ? safeStorage() : options.storage;
  const transient = options.transient ?? [];

  const read = (): T => {
    const state = { ...options.defaults };
    try {
      const raw = storage?.getItem(options.key);
      if (raw) Object.assign(state, JSON.parse(raw) as Partial<T>);
    } catch {
      /* unreadable or disabled storage */
    }
    for (const key of transient) state[key] = options.defaults[key];
    return state;
  };

  const state = read();

  const save = (): void => {
    try {
      storage?.setItem(options.key, JSON.stringify(state));
    } catch {
      /* storage disabled or full */
    }
  };

  return {
    state,
    save,
    patch(values) {
      Object.assign(state, values);
      save();
    },
    reset() {
      Object.assign(state, options.defaults);
      save();
    },
  };
}

function safeStorage(): Storage | null {
  try {
    return typeof localStorage === "undefined" ? null : localStorage;
  } catch {
    return null;
  }
}
