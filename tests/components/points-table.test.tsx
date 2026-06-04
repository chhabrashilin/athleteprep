import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import React from "react";

// ─── NrrDisplay helper (extracted for testing) ────────────────────────────────

function NrrDisplay({ nrr }: { nrr: number }) {
  const formatted = nrr >= 0 ? `+${nrr.toFixed(3)}` : nrr.toFixed(3);
  const color = nrr > 0 ? "text-emerald-400" : nrr < 0 ? "text-rose-400" : "text-slate-400";
  return <span className={color} data-testid="nrr">{formatted}</span>;
}

// ─── FormBadge helper ─────────────────────────────────────────────────────────

type FormResult = "W" | "L" | "T" | "NR" | "A";
function FormBadge({ result }: { result: FormResult }) {
  return <span data-testid={`form-${result}`}>{result}</span>;
}

// ─── Minimal empty state component ───────────────────────────────────────────

function EmptyStandingsState({ isAdmin }: { isAdmin: boolean }) {
  return (
    <div data-testid="empty-standings">
      <p>No standings yet. Complete matches and rebuild standings.</p>
      {isAdmin && <button data-testid="rebuild-btn">Rebuild Standings</button>}
    </div>
  );
}

// ─── Minimal points table component ──────────────────────────────────────────

interface Standing {
  id: string;
  teamName: string;
  position: number;
  matchesPlayed: number;
  wins: number;
  losses: number;
  ties: number;
  noResults: number;
  totalPoints: number;
  netRunRate: number;
  form: FormResult[];
}

function PointsTable({ standings }: { standings: Standing[] }) {
  return (
    <table data-testid="points-table">
      <thead>
        <tr>
          <th>#</th><th>Team</th><th>P</th><th>W</th><th>L</th><th>T</th>
          <th>NR</th><th>Total</th><th>NRR</th><th>Form</th>
        </tr>
      </thead>
      <tbody>
        {standings.map((s) => (
          <tr key={s.id} data-testid={`standing-row-${s.id}`}>
            <td>{s.position}</td>
            <td data-testid={`team-name-${s.id}`}>{s.teamName}</td>
            <td>{s.matchesPlayed}</td>
            <td>{s.wins}</td>
            <td>{s.losses}</td>
            <td>{s.ties}</td>
            <td>{s.noResults}</td>
            <td data-testid={`points-${s.id}`}>{s.totalPoints}</td>
            <td><NrrDisplay nrr={s.netRunRate} /></td>
            <td>
              {s.form.map((f, i) => <FormBadge key={i} result={f} />)}
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

// ─── Tests ───────────────────────────────────────────────────────────────────

describe("Points table empty state", () => {
  it("renders empty state message when no standings", () => {
    render(<EmptyStandingsState isAdmin={false} />);
    expect(screen.getByTestId("empty-standings")).toBeDefined();
    expect(screen.getByText(/No standings yet/i)).toBeDefined();
  });

  it("shows rebuild button for admin", () => {
    render(<EmptyStandingsState isAdmin={true} />);
    expect(screen.getByTestId("rebuild-btn")).toBeDefined();
  });

  it("does not show rebuild button for non-admin", () => {
    render(<EmptyStandingsState isAdmin={false} />);
    expect(screen.queryByTestId("rebuild-btn")).toBeNull();
  });
});

describe("PointsTable renders teams", () => {
  const standings: Standing[] = [
    { id: "s1", teamName: "Thunder XI", position: 1, matchesPlayed: 4, wins: 3, losses: 1, ties: 0, noResults: 0, totalPoints: 6, netRunRate: 0.852, form: ["W", "W", "L", "W"] },
    { id: "s2", teamName: "Lightning CC", position: 2, matchesPlayed: 4, wins: 2, losses: 2, ties: 0, noResults: 0, totalPoints: 4, netRunRate: -0.214, form: ["L", "W", "W", "L"] },
  ];

  it("renders both team rows", () => {
    render(<PointsTable standings={standings} />);
    expect(screen.getByTestId("standing-row-s1")).toBeDefined();
    expect(screen.getByTestId("standing-row-s2")).toBeDefined();
  });

  it("renders team names", () => {
    render(<PointsTable standings={standings} />);
    expect(screen.getByTestId("team-name-s1").textContent).toBe("Thunder XI");
    expect(screen.getByTestId("team-name-s2").textContent).toBe("Lightning CC");
  });

  it("renders points correctly", () => {
    render(<PointsTable standings={standings} />);
    expect(screen.getByTestId("points-s1").textContent).toBe("6");
    expect(screen.getByTestId("points-s2").textContent).toBe("4");
  });
});

describe("NrrDisplay", () => {
  it("shows + prefix for positive NRR", () => {
    render(<NrrDisplay nrr={0.852} />);
    const el = screen.getByTestId("nrr");
    expect(el.textContent).toContain("+");
    expect(el.textContent).toContain("0.852");
  });

  it("shows negative NRR without + prefix", () => {
    render(<NrrDisplay nrr={-0.214} />);
    const el = screen.getByTestId("nrr");
    expect(el.textContent).toBe("-0.214");
  });

  it("shows +0.000 for zero NRR", () => {
    render(<NrrDisplay nrr={0} />);
    expect(screen.getByTestId("nrr").textContent).toBe("+0.000");
  });

  it("renders positive NRR in emerald color class", () => {
    render(<NrrDisplay nrr={1.5} />);
    expect(screen.getByTestId("nrr").className).toContain("emerald");
  });

  it("renders negative NRR in rose color class", () => {
    render(<NrrDisplay nrr={-1.5} />);
    expect(screen.getByTestId("nrr").className).toContain("rose");
  });
});

describe("FormBadge", () => {
  it("renders W for win", () => {
    render(<FormBadge result="W" />);
    expect(screen.getByTestId("form-W").textContent).toBe("W");
  });

  it("renders L for loss", () => {
    render(<FormBadge result="L" />);
    expect(screen.getByTestId("form-L").textContent).toBe("L");
  });

  it("renders NR for no result", () => {
    render(<FormBadge result="NR" />);
    expect(screen.getByTestId("form-NR").textContent).toBe("NR");
  });
});
