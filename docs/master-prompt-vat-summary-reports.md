# Master Prompt — VAT Output & Input Tax Summary Reports

> Paste everything below the line into a fresh AI session in the target project.
> Replace the **ADAPT** blocks with that project's real table/column names first.

---

## Context

Build two mirror-image VAT schedule reports that every accounting system needs:

1. **Sales / Output Tax Summary** — every tax invoice *issued to customers* in a
   date range (VAT collected).
2. **Purchase / Input Tax Summary** — every tax invoice *received from suppliers*
   in a date range (VAT paid, reclaimable).

Together these are the two halves of a VAT return. They are filed with the tax
authority, so column names and totals are prescribed — do not rename columns to
be "friendlier", and never let a displayed total disagree with the underlying
data.

Both reports are the same machine with different inputs. Build one shared
pattern, instantiate it twice.

---

## ADAPT — domain model

Map these roles onto the target schema before writing code:

| Role | Sales report | Purchase report |
|---|---|---|
| Header table | `tax_invoice` (invoices you issued) | `purchase` (invoices you received) |
| Counterparty | `client` / customer | `supplier` / vendor |
| Date column | `invoice_date` | `date` |
| Document no. | `tax_invoice_no` | `tax_invoice_no` (supplier's number) |
| Net (excl. VAT) | `subtotal` | `net_amount` |
| VAT | `vat_amount` | `vat_amount` |
| Optional filter | payment method | product category |
| Line items (optional) | `invoice_line` for the description | n/a |

If the target system has more than one source table for either side (e.g.
separate tables for two product families), see **Rule 6 — union pattern**.

---

## Report 1 — Sales / Output Tax Summary

**Page:** `GET /invoice-summary`
**Search:** `GET /api/invoice-summary/search`
**Export:** `GET /api/invoice-summary/export-csv`

**Filters:** From Date *(required)*, To Date *(required, ≥ From Date)*,
Customer *(optional, "All")*, Payment Method *(optional, "All")*.

**Columns (exact order and labels):**

| # | Column | Source |
|---|---|---|
| 1 | `#` | running serial (see Rule 2) |
| 2 | Invoice Date | header date, `MM/DD/YYYY` |
| 3 | Tax Invoice No | document number |
| 4 | Purchaser's TIN | Rule 3 |
| 5 | Name of the Purchaser | counterparty legal name (Rule 4) |
| 6 | Description | Rule 5 |
| 7 | Value of Supply | net, excl. VAT, 2 dp |
| 8 | VAT Amount | 2 dp |

**Totals row:** `Value of Supply` and `VAT Amount` only.
**Sort:** date DESC, then document no. DESC (screen) / ASC, ASC (CSV).

---

## Report 2 — Purchase / Input Tax Summary

**Page:** `GET /purchase-summary`
**Search:** `GET /api/purchase-summary/search`
**Export:** `GET /api/purchase-summary/export-csv`

**Filters:** From Date *(required)*, To Date *(required, ≥ From Date)*,
Category *(optional, "All")*.

**Columns:** identical to Report 1 except:
- 4 → **Supplier's TIN**, 5 → **Name of the Supplier**
- 7 → **Value of Purchase**
- 9 → **Disallowed VAT Amount** (extra trailing column)

**Totals row:** Value of Purchase, VAT Amount, Disallowed VAT.
**Sort:** date ASC.

> **Disallowed VAT** = input tax you may *not* reclaim (private use, exempt
> supplies, blocked categories). Wire it to a real per-line flag or rate. Do not
> ship it hardcoded to `0.00` — the original did, and it silently understates
> the true reclaim position.

---

## Behavioural contract — the rules that matter

These are the parts that are easy to get wrong and expensive to get wrong.

**Rule 1 — Totals span the whole filtered set, never the page.**
Compute totals from the full filtered query *before* pagination. Do not sum the
20 rows on screen. Two safe shapes:
- Simple query → clone the builder and aggregate the clone.
- Union/compound query → wrap it as a subquery and aggregate that
  (`SELECT SUM(net), SUM(vat) FROM (<union>) AS combined`).

**Rule 2 — Serial number is display-only and continues across pages.**
`serial = ((page - 1) * perPage) + rowIndex + 1`. It is not an ID and must never
be persisted or used as a key. In the CSV (unpaginated) it runs 1..N.

**Rule 3 — TIN is derived, not stored.**
TIN = first 9 characters of the counterparty's VAT registration number
(`substr(vat_no, 0, 9)`). Compute at render time. Guard against null.
*(Adapt the length if the target jurisdiction differs.)*

**Rule 4 — Resolve the counterparty's legal name defensively.**
Header rows often store a denormalised name string. Look the counterparty up to
get the *legal* name and VAT number, and fall back to the stored string when the
record is missing or soft-deleted — a deleted customer must never blank out a
historical invoice row. **Prefer a real foreign key in a new build** (see
Pitfalls).

**Rule 5 — Description reflects what the document actually contains.**
If one document bundles several product types, use a generic label
(`"Fuel Purchase"`). Only name a specific product when the document covers
exactly one. Deriving the label from the first line item is wrong whenever a
document is mixed.

**Rule 6 — Union pattern for multiple source tables.**
When one side of the ledger spans several tables, `UNION ALL` them into a single
identical column shape, aliasing each source's columns to common names and
emitting a literal `description` per branch. Then paginate and total the union
as one query. If a filter only applies to one branch (e.g. a category that the
other branch has no concept of), applying that filter must exclude the other
branch entirely rather than silently returning unfiltered rows from it.

**Rule 7 — CSV export must be GET and stream.**
The browser triggers it with `window.open(url)`, so it cannot be POST. Stream
the response rather than buffering. Send:
`Content-Type: text/csv`,
`Content-Disposition: attachment; filename="<report>-<from>-to-<to>.csv"`,
and no-store cache headers.
Structure: header row → all rows (no pagination) → totals row (blank leading
cells, numeric cells populated).

**Rule 8 — Export uses the same filters as the screen.**
Identical validation, identical query builder. Extract the query construction
into one shared private method so the two can never drift apart.

**Rule 9 — Date range is inclusive at both ends.**
Normalise to `startOfDay(from)` and `endOfDay(to)` so same-day filters return
that day's rows. Validate `to_date >= from_date` server-side.

**Rule 10 — Money.** Store as `DECIMAL(15,2)` (never float/double), round to 2 dp
at the boundary, and format with thousands separators + exactly 2 dp on screen.
Volumes/quantities, if shown, use 3 dp.

**Rule 11 — Empty state is a first-class UI state.**
Three distinct states: *not yet searched* (show nothing), *searched with zero
results* (show an empty-state panel), *has results* (table + totals + pagination).
Only offer the CSV button once results exist.

**Rule 12 — Scope every query to the authenticated tenant/user.**
Both endpoints expose full financial history. Apply the app's ownership scope in
the base query, not in the controller's tail.

---

## Reference implementation (Laravel 12 + Inertia + React)

Adjust freely for the target stack — the contract above is what must survive.

### Routes

```php
Route::middleware(['auth'])->group(function () {
    Route::get('/invoice-summary',  [InvoiceSummaryController::class, 'index']);
    Route::get('/purchase-summary', [PurchaseSummaryController::class, 'index']);

    Route::prefix('api/invoice-summary')->group(function () {
        Route::get('/search',     [InvoiceSummaryController::class, 'search']);
        Route::get('/export-csv', [InvoiceSummaryController::class, 'exportCsv']);
    });
    Route::prefix('api/purchase-summary')->group(function () {
        Route::get('/search',     [PurchaseSummaryController::class, 'search']);
        Route::get('/export-csv', [PurchaseSummaryController::class, 'exportCsv']);
    });
});
```

### Controller shape (both reports)

```php
public function index()   // Inertia page + filter dropdown options
public function search(Request $r)      // JSON: { records: {...paginator}, totals: {...} }
public function exportCsv(Request $r): StreamedResponse
private function buildQuery(Carbon $from, Carbon $to, $filterId)  // shared by search + export
private function mapRow($row, int $offset, int $index): array     // shared row shape
```

Validation (both endpoints, identical):

```php
$r->validate([
    'from_date' => 'required|date',
    'to_date'   => 'required|date|after_or_equal:from_date',
    'filter_id' => 'nullable|integer|exists:<table>,id',
]);
```

Totals over a union (Rule 1):

```php
$totalsRaw = DB::query()->fromSub($query, 'combined')
    ->selectRaw('SUM(net_amount) AS sum_net, SUM(vat_amount) AS sum_vat')
    ->first();
```

Streamed CSV (Rule 7):

```php
return new StreamedResponse(function () use ($rows) {
    $h = fopen('php://output', 'w');
    fputcsv($h, ['Serial No','Invoice Date','Tax Invoice No',
                 "Purchaser's TIN",'Name of the Purchaser','Description',
                 'Value of supply','VAT Amount']);
    $sumNet = $sumVat = 0.0;
    foreach ($rows as $i => $row) {
        $sumNet += $row->net; $sumVat += $row->vat;
        fputcsv($h, [$i + 1, /* ...cells... */]);
    }
    fputcsv($h, ['','','','','','', round($sumNet,2), round($sumVat,2)]);
    fclose($h);
}, 200, [
    'Content-Type'        => 'text/csv',
    'Content-Disposition' => 'attachment; filename="'.$filename.'"',
    'Cache-Control'       => 'no-store, no-cache',
]);
```

### JSON response shape

```jsonc
{
  "records": {                 // or "invoices"
    "data": [ { "id":1, "serial_no":1, "invoice_date":"07/24/2026",
                "tax_invoice_no":"INV-0001", "tin":"104028462",
                "purchaser_name":"ABC Pvt Ltd", "description":"Fuel Purchase",
                "net_amount":23137.00, "vat_amount":4164.66 } ],
    "current_page":1, "last_page":5, "per_page":20, "total":93
  },
  "totals": { "sum_net":463740.00, "sum_vat":83473.20 }
}
```

### React page shape

One component per report, same skeleton:

- State: `filters`, `rows`, `totals`, `pagination`, `isLoading`, `hasSearched`.
- Filter panel: searchable selects prepended with an `{ value: '', label: 'All …' }`
  option, plus two date pickers. Client-side guard: both dates required.
- `handleSearch(page = 1)` builds `URLSearchParams` and GETs the search endpoint.
- Results: `<table>` inside `overflow-x-auto`, `<tfoot>` grand-total row,
  numeric columns right-aligned with `tabular-nums`, `whitespace-nowrap` on
  dates/amounts.
- Pagination: prev/next + numbered buttons, ellipsis when `last_page > 7`
  (always show first and last; window of ±1 around current).
- `handleExportCsv()` → `window.open('/api/…/export-csv?' + params, '_blank')`.

---

## Pitfalls found in the original — fix these in the new build

1. **Counterparty joined by name string, not FK.** The header stores
   `client_name` and the report re-looks-up the customer by that string. Renaming
   a customer silently orphans their history. It also validates
   `exists:client,id` and then filters by name — two different identities for one
   concept. **Use a foreign key.**
2. **`disallowed_vat` hardcoded to `0.00`.** A real VAT concept stubbed out.
3. **Money stored as `double`.** Use `DECIMAL(15,2)`.
4. **Three separate aggregate round-trips** (`->sum()` called once per column).
   One `selectRaw` with three `SUM()`s is a single query.
5. **Duplicated filter branch** — the union builder tested the same condition
   twice in a row.
6. **No tenant/ownership scoping** on either endpoint.
7. **Description derived from the first line item**, which mislabels any mixed
   document (Rule 5).
8. **Totals and line items can disagree** where legacy rows were stored at the
   wrong scale and repaired only on the line-item path, not in the header totals.
   Repair data once, at the source — never in the presentation layer.

---

## Acceptance checklist

- [ ] Same-day range (from == to) returns that day's records.
- [ ] Grand total equals the sum of **all** matching rows, not just page 1 —
      verify by comparing page 1's total against a 3-page result set.
- [ ] Serial numbers continue across pages (page 2 starts at 21).
- [ ] CSV contains every row (not just the current page) plus a totals row, and
      its totals match the screen exactly.
- [ ] Deleting a counterparty leaves historical rows readable.
- [ ] A document bundling two product types shows the generic description.
- [ ] Category filter excludes the branch that has no category (Rule 6).
- [ ] Zero results renders the empty state and hides the CSV button.
- [ ] Amounts show exactly 2 dp with thousands separators.
- [ ] Both endpoints reject `to_date < from_date`.
- [ ] Neither endpoint returns another tenant's data.
