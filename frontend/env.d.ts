/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_API_BASEURL: string;
  readonly VITE_DUMMY_API: boolean;
  readonly VITE_MOCK_API: boolean;
  readonly VITE_API_TIMEOUT: number;
}
