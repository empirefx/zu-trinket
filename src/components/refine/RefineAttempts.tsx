// The attempts log: every roll of the session as a HeroUI table row (15 per
// page, HeroUI pagination) plus the session's totals boxes.
import { useState } from "react";
import { Card, Pagination, Table } from "@heroui/react";
import { refineIconClass } from "../../lib/icons";
import { num } from "./refineBits";
import { useRefineSim } from "./RefineSim";

const PER_PAGE = 15;

export function RefineAttempts() {
  const sim = useRefineSim();
  const { attempts, totals } = sim;
  const [pg, setPg] = useState(0);
  const pages = Math.max(1, Math.ceil(attempts.length / PER_PAGE));
  const page = Math.min(pg, pages - 1);
  const rows = attempts.slice(page * PER_PAGE, page * PER_PAGE + PER_PAGE);
  // a 5-link window centred on the current page
  const start = Math.max(0, Math.min(page - 2, pages - 5));
  const pageLinks = Array.from({ length: Math.min(5, pages) }, (_, i) => start + i);

  return (
    <Card className="r-card r-log" aria-label="Attempt log" data-testid="refine-log">
      <Card.Header><Card.Title>Attempts</Card.Title></Card.Header>
      <Card.Content className="r-log-body">
        <Table aria-label="Attempt log" className="r-log-table">
          <Table.ScrollContainer>
            <Table.Content aria-label="Attempt log">
              <Table.Header>
                <Table.Column isRowHeader>#</Table.Column>
                <Table.Column>Action</Table.Column>
                <Table.Column>Result</Table.Column>
                <Table.Column>Change</Table.Column>
                <Table.Column>Bones</Table.Column>
                <Table.Column>Materials</Table.Column>
              </Table.Header>
              <Table.Body>
                {rows.map((a, i) => (
                  <Table.Row key={page * PER_PAGE + i} id={`att-${page * PER_PAGE + i}`}>
                    <Table.Cell>{page * PER_PAGE + i + 1}</Table.Cell>
                    <Table.Cell>{a.kind === "rank" ? "Rank" : "Enchant"}</Table.Cell>
                    <Table.Cell className={a.ok ? "r-ok" : "r-bad"}>{a.ok ? "Success" : "Failure"}</Table.Cell>
                    <Table.Cell>{a.kind === "rank" ? `R${a.from} → R${a.to}` : `+${a.from} → +${a.to}`}</Table.Cell>
                    <Table.Cell>{a.gold ? num(a.gold) : "—"}</Table.Cell>
                    <Table.Cell>
                      <span className="r-log-mats">
                        {a.mats.map((m) => (
                          <span key={m.name} className="r-log-mat">
                            <span className={`r-gicon zs ${m.icon ? refineIconClass(m.icon) ?? "" : ""}`}>{m.icon ? "" : "◆"}</span>
                            {m.name} ×{m.count}
                          </span>
                        ))}
                      </span>
                    </Table.Cell>
                  </Table.Row>
                ))}
                {attempts.length === 0 && (
                  <Table.Row id="att-none">
                    <Table.Cell>—</Table.Cell>
                    <Table.Cell colSpan={5}>No attempts yet</Table.Cell>
                  </Table.Row>
                )}
              </Table.Body>
            </Table.Content>
          </Table.ScrollContainer>
        </Table>
        {attempts.length > PER_PAGE && (
          <div className="r-pager" data-testid="refine-pager">
            <span className="r-muted r-pager-sum">
              {page * PER_PAGE + 1}–{Math.min(attempts.length, page * PER_PAGE + PER_PAGE)} of {attempts.length}
            </span>
            <Pagination size="lg">
              <Pagination.Content>
                <Pagination.Item>
                  <Pagination.Previous onPress={() => setPg(Math.max(0, page - 1))} isDisabled={page === 0}>‹</Pagination.Previous>

                </Pagination.Item>
                {pageLinks.map((p) => (
                  <Pagination.Item key={p}>
                    <Pagination.Link isActive={p === page} onPress={() => setPg(p)}>{p + 1}</Pagination.Link>
                  </Pagination.Item>
                ))}
                <Pagination.Item>
                  <Pagination.Next onPress={() => setPg(Math.min(pages - 1, page + 1))} isDisabled={page === pages - 1}>›</Pagination.Next>
                </Pagination.Item>
              </Pagination.Content>
            </Pagination>
          </div>
        )}
        <div className="r-totals">
          <div className="r-box"><small>Attempts</small><strong>{attempts.length}</strong></div>
          <div className="r-box"><small>Results</small><strong><span className="r-ok">{totals.ok}</span> · <span className="r-bad">{totals.fail}</span></strong></div>
          <div className="r-box"><small>Bones</small><strong>{num(totals.gold)}</strong></div>
          <div className="r-box r-box-mats">
            <small>Materials</small>
            <span className="r-tot-mats">
              {totals.mats.map(([n, m]) => (
                <span key={n} className="r-log-mat">
                  <span className={`r-gicon zs ${m.icon ? refineIconClass(m.icon) ?? "" : ""}`}>{m.icon ? "" : "◆"}</span>
                  {n} ×{m.count}
                </span>
              ))}
              {totals.mats.length === 0 && "—"}
            </span>
          </div>
        </div>
      </Card.Content>
    </Card>
  );
}
