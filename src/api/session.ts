// Lets the HTTP client read the Redux session and end it without importing the
// store, which would close an import cycle back through Store.ts.
export interface HttpSession {
  getKey: () => number;
  end: () => void;
  // The launch screen reports its own failures, a 429 included.
  isLaunching: () => boolean;
}

let session: HttpSession | null = null;

export const bindHttpSession = (next: HttpSession | null) => {
  session = next;
};

export const getHttpSessionKey = () => session?.getKey();

export const endHttpSession = () => session?.end();

export const isHttpSessionLaunching = () => session?.isLaunching() ?? false;
