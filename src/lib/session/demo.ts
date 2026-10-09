export interface DemoSessionControls {
  login: () => Promise<void>;
  logout: () => void;
}
export interface RouterContext {
  session: typeof import('./service').sessionService;
  demoSession?: DemoSessionControls;
}
