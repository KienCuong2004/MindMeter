// Mock for react-router-dom
// This file is automatically used by Jest when react-router-dom is imported

const React = require("react");

module.exports = {
  BrowserRouter: ({ children }) => React.createElement("div", null, children),
  Routes: ({ children }) => React.createElement("div", null, children),
  Route: ({ children }) => React.createElement("div", null, children),
  Navigate: () => null,
  Link: ({ children, to, ...props }) =>
    React.createElement("a", { href: to, ...props }, children),
  NavLink: ({ children, to, ...props }) =>
    React.createElement("a", { href: to, ...props }, children),
  useNavigate: () => jest.fn(),
  useLocation: () => ({ pathname: "/", search: "", hash: "", state: null }),
  useParams: () => ({}),
  useSearchParams: () => [new URLSearchParams(), jest.fn()],
  useRouteMatch: () => null,
  matchPath: () => null,
  withRouter: (Component) => Component,
  MemoryRouter: ({ children }) => React.createElement("div", null, children),
  Redirect: () => null,
  Switch: ({ children }) => React.createElement("div", null, children),
};
