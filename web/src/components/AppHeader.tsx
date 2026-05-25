import type { AppScreen } from "../types/app";
import { RefreshIcon } from "./RefreshIcon";

interface AppHeaderProps {
  screen: AppScreen;
  onScreenChange: (screen: AppScreen) => void;
  subtitle: string | null;
  refreshing: boolean;
  onRefresh: () => void;
  groceryCount: number;
}

export function AppHeader({
  screen,
  onScreenChange,
  subtitle,
  refreshing,
  onRefresh,
  groceryCount,
}: AppHeaderProps) {
  return (
    <header className="app-header">
      <div className="app-header-top">
        <nav className="screen-tabs" aria-label="App sections">
          <button
            type="button"
            className={`screen-tab ${screen === "fridge" ? "screen-tab-active screen-tab-fridge" : ""}`}
            onClick={() => onScreenChange("fridge")}
          >
            Fridge Monitor
          </button>
          <button
            type="button"
            className={`screen-tab ${screen === "grocery" ? "screen-tab-active" : ""}`}
            onClick={() => onScreenChange("grocery")}
          >
            Grocery List
            {groceryCount > 0 && <span className="tab-count">{groceryCount}</span>}
          </button>
        </nav>
        <button
          type="button"
          className="btn btn-icon-refresh"
          onClick={onRefresh}
          disabled={refreshing}
          aria-label={refreshing ? "Refreshing" : "Refresh"}
        >
          <RefreshIcon spinning={refreshing} />
        </button>
      </div>
      {subtitle && <p className="subtitle">{subtitle}</p>}
    </header>
  );
}
