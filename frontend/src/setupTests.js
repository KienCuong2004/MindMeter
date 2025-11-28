// jest-dom adds custom jest matchers for asserting on DOM nodes.
// allows you to do things like:
// expect(element).toHaveTextContent(/react/i)
// learn more: https://github.com/testing-library/jest-dom
import "@testing-library/jest-dom";

// Mock date-fns/locale to avoid ES module issues
jest.mock("date-fns/locale", () => ({
  vi: {
    formatDistance: jest.fn((token, count) => {
      const distances = {
        lessThanXSeconds: "dưới {{count}} giây",
        xSeconds: "{{count}} giây",
        halfAMinute: "nửa phút",
        lessThanXMinutes: "dưới {{count}} phút",
        xMinutes: "{{count}} phút",
        aboutXHours: "khoảng {{count}} giờ",
        xHours: "{{count}} giờ",
        xDays: "{{count}} ngày",
        aboutXWeeks: "khoảng {{count}} tuần",
        xWeeks: "{{count}} tuần",
        aboutXMonths: "khoảng {{count}} tháng",
        xMonths: "{{count}} tháng",
        aboutXYears: "khoảng {{count}} năm",
        xYears: "{{count}} năm",
        overXYears: "hơn {{count}} năm",
        almostXYears: "gần {{count}} năm",
      };
      return distances[token] || token;
    }),
  },
  enUS: {
    formatDistance: jest.fn((token, count) => {
      const distances = {
        lessThanXSeconds: "less than {{count}} seconds",
        xSeconds: "{{count}} seconds",
        halfAMinute: "half a minute",
        lessThanXMinutes: "less than {{count}} minutes",
        xMinutes: "{{count}} minutes",
        aboutXHours: "about {{count}} hours",
        xHours: "{{count}} hours",
        xDays: "{{count}} days",
        aboutXWeeks: "about {{count}} weeks",
        xWeeks: "{{count}} weeks",
        aboutXMonths: "about {{count}} months",
        xMonths: "{{count}} months",
        aboutXYears: "about {{count}} years",
        xYears: "{{count}} years",
        overXYears: "over {{count}} years",
        almostXYears: "almost {{count}} years",
      };
      return distances[token] || token;
    }),
  },
}));

// Mock axios
const mockAxiosInstance = {
  get: jest.fn(() => Promise.resolve({ data: {} })),
  post: jest.fn(() => Promise.resolve({ data: {} })),
  put: jest.fn(() => Promise.resolve({ data: {} })),
  delete: jest.fn(() => Promise.resolve({ data: {} })),
  interceptors: {
    request: { use: jest.fn(), eject: jest.fn() },
    response: { use: jest.fn(), eject: jest.fn() },
  },
};

jest.mock("axios", () => {
  return {
    __esModule: true,
    default: {
      create: jest.fn(() => mockAxiosInstance),
      get: mockAxiosInstance.get,
      post: mockAxiosInstance.post,
      put: mockAxiosInstance.put,
      delete: mockAxiosInstance.delete,
    },
    ...mockAxiosInstance,
  };
});

// Mock window.matchMedia
Object.defineProperty(window, "matchMedia", {
  writable: true,
  value: jest.fn().mockImplementation((query) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: jest.fn(), // deprecated
    removeListener: jest.fn(), // deprecated
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
    dispatchEvent: jest.fn(),
  })),
});

// Mock IntersectionObserver
global.IntersectionObserver = class IntersectionObserver {
  constructor() {}
  disconnect() {}
  observe() {}
  takeRecords() {
    return [];
  }
  unobserve() {}
};

// Mock ResizeObserver
global.ResizeObserver = class ResizeObserver {
  constructor() {}
  disconnect() {}
  observe() {}
  unobserve() {}
};

// Suppress console errors in tests
const originalError = console.error;
beforeAll(() => {
  console.error = (...args) => {
    if (
      typeof args[0] === "string" &&
      (args[0].includes("Warning: ReactDOM.render") ||
        args[0].includes("Warning: validateDOMNesting"))
    ) {
      return;
    }
    originalError.call(console, ...args);
  };
});

afterAll(() => {
  console.error = originalError;
});

// Mock window.scrollTo
Object.defineProperty(window, "scrollTo", {
  writable: true,
  value: jest.fn(),
});

// Mock HTMLElement.scrollIntoView (JSDOM doesn't support it)
if (!HTMLElement.prototype.scrollIntoView) {
  HTMLElement.prototype.scrollIntoView = jest.fn();
}
