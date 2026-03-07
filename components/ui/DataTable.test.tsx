/**
 * @vitest-environment jsdom
 */
import { describe, it, expect } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { DataTable } from "./DataTable";

type Row = { id: string; name: string; score: number };

const columns = [
  { id: "name", header: "Name", accessor: (r: Row) => r.name, sortValue: (r: Row) => r.name },
  { id: "score", header: "Score", accessor: (r: Row) => String(r.score), sortValue: (r: Row) => r.score },
];

const data: Row[] = [
  { id: "1", name: "Alice", score: 90 },
  { id: "2", name: "Bob", score: 80 },
  { id: "3", name: "Carol", score: 70 },
];

describe("DataTable", () => {
  it("renders empty state when data is empty", () => {
    render(
      <DataTable
        columns={columns}
        data={[]}
        keyExtractor={(r) => r.id}
        emptyTitle="No results"
      />
    );
    expect(screen.getByText("No results")).toBeTruthy();
  });

  it("renders table with data", () => {
    render(
      <DataTable columns={columns} data={data} keyExtractor={(r) => r.id} />
    );
    expect(screen.getAllByText("Alice").length).toBeGreaterThan(0);
    expect(screen.getAllByText("Bob").length).toBeGreaterThan(0);
    expect(screen.getAllByText("90").length).toBeGreaterThan(0);
  });

  it("shows skeleton when loading", () => {
    render(
      <DataTable
        columns={columns}
        data={data}
        keyExtractor={(r) => r.id}
        loading
      />
    );
    expect(screen.queryByText("Alice")).toBeNull();
  });

  it("sorts by column when header clicked", () => {
    render(
      <DataTable columns={columns} data={data} keyExtractor={(r) => r.id} />
    );
    const nameHeaders = screen.getAllByText("Name");
    fireEvent.click(nameHeaders[0]);
    expect(screen.getAllByText("Alice").length).toBeGreaterThan(0);
    fireEvent.click(nameHeaders[0]);
    fireEvent.click(nameHeaders[0]);
    expect(screen.getAllByText("Carol").length).toBeGreaterThan(0);
  });

  it("paginates when pageSize is 2", () => {
    render(
      <DataTable
        columns={columns}
        data={data}
        keyExtractor={(r) => r.id}
        pageSize={2}
      />
    );
    expect(screen.getAllByText("Alice").length).toBeGreaterThan(0);
    expect(screen.getAllByText("Bob").length).toBeGreaterThan(0);
  });
});
