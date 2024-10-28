export const BACKEND = {
  PROTOCOL: "http",
  HOST: "192.168.0.28",
  PORT: 10000,

  get prefix() {
    return `${this.PROTOCOL}://${this.HOST}:${this.PORT}`;
  },
};

export const MIN_INTERVAL_SECS = 3;
export const MAX_INTERVAL_SECS = 600;

export const MIN_DURATION_MINS = Math.ceil(MAX_INTERVAL_SECS / 60);

export const MAX_DURATION_MINS = 600;
