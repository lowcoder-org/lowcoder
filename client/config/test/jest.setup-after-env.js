// jest-dom adds custom jest matchers for asserting on DOM nodes.
// allows you to do things like:
// expect(element).toHaveTextContent(/react/i)
// learn more: https://github.com/testing-library/jest-dom
import "@testing-library/jest-dom";

// implementation of window.resizeTo for dispatching event
window.resizeTo = function resizeTo(width, height) {
  Object.assign(this, {
    innerWidth: width,
    innerHeight: height,
    outerWidth: width,
    outerHeight: height,
  }).dispatchEvent(new this.Event("resize"));
};

window.ResizeObserver = function () {
  return {
    observe: () => {},
    unobserve: () => {},
    disconnect: () => {},
  };
};

Object.defineProperty(window, 'ImageData', { value: 'yourValue' });
Object.defineProperty(window, 'MediaStreamTrack', { value: 'yourValue' });
Object.defineProperty(window, 'URL', {
  writable: true,
  value: {
    createObjectURL: jest.fn(),
  }
});
Object.defineProperty(window, "navigator", {
  writable: true,
  value: {
    mediaDevices: {
      enumerateDevices: jest.fn(),
    },
    userAgent: '',
    language: '',
    browserLanguage: '',
  },
});

class Worker {
  constructor(stringUrl) {
    this.url = stringUrl;
    this.onmessage = () => {};
  }

  postMessage(msg) {
    this.onmessage(msg);
  }
}

window.Worker = Worker;