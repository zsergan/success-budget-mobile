// Lets the HTTP client read the Redux session and end it without importing the
// store, which would close an import cycle back through Store.ts.
export interface HttpSession {
  getKey: () => number;
  end: () => void;
}

let session: HttpSession | null = null;

export const bindHttpSession = (next: HttpSession | null) => {
  session = next;
};

export const getHttpSessionKey = () => session?.getKey();

export const endHttpSession = () => session?.end();
