import { Layout } from "@stellar/design-system";
import "./App.module.css";
import { Outlet } from "react-router-dom";

const App: React.FC = () => (
  <main>
    <Layout.Header projectId="My App" projectTitle="My App" />
    <Outlet />
    <Layout.Footer>
      <span>
        © {new Date().getFullYear()} My App. Licensed under the{" "}
        <a
          href="http://www.apache.org/licenses/LICENSE-2.0"
          target="_blank"
          rel="noopener noreferrer"
        >
          Apache License, Version 2.0
        </a>
        .
      </span>
    </Layout.Footer>
  </main>
);
export default App;
