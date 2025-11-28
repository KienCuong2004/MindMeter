import { render } from "@testing-library/react";
import App from "./App";

// react-router-dom will be automatically mocked from __mocks__/react-router-dom.js

test("renders App component without crashing", () => {
  render(<App />);
});
