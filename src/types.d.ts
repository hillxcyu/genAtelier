export {};

declare global {
  interface Window {
    aistudio?: {
      hasSelectedApiKey: () => Promise<boolean>;
      openSelectKey: () => Promise<void>;
    };
  }
  
  namespace NodeJS {
    interface ProcessEnv {
      GEMINI_API_KEY: string;
      API_KEY?: string;
    }
  }
}
