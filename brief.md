# Personal Finance Mobile App — Product & Technical Brief

## 1. Project Overview

Build a mobile-first personal finance tracking application designed to make recording and understanding personal finances extremely simple.

The core product idea is:

> **Record money quickly → understand the current financial situation → understand where money goes → know whether the user is financially safe.**

The application should not feel like an accounting spreadsheet. It should feel like a modern, lightweight personal finance companion.

A key visual/product identity is the **digital financial receipt**: weekly, monthly, and yearly reports should be automatically generated in a receipt-like format that is compact, readable, informative, and easy to share/save.

The application is intended to be deployable on **Vercel with a low-cost/free-first architecture**, while keeping the codebase clean enough to scale later.

---

# 2. Product Goals

## Primary goals

1. Make recording a transaction extremely fast.
2. Make the user's current financial position immediately understandable.
3. Help users understand spending patterns.
4. Help users manage budgets.
5. Automatically produce useful financial reports.
6. Make reports visually memorable through a receipt-style format.
7. Work well on mobile screens first.
8. Support offline-friendly transaction entry where practical.
9. Keep the initial architecture inexpensive to operate.
10. Keep the codebase maintainable and ready for future expansion.

## Secondary goals

- Encourage consistent financial tracking.
- Reduce cognitive load when looking at financial information.
- Provide useful insights without overwhelming the user.
- Allow users to export/share their financial summaries.
- Support Indonesian users and IDR as a first-class currency.

---

# 3. Product Philosophy

The app should follow these principles.

## 3.1 Speed over complexity

The most frequent task is adding a transaction.

A user should be able to open the application and record something like:

> Makan — Rp25.000

with minimal interaction.

Do not force users through a long accounting form for ordinary transactions.

## 3.2 Information hierarchy over visual decoration

The dashboard should answer these questions immediately:

- How much money do I have?
- How much did I receive?
- How much did I spend?
- How much remains?
- Where did most of the money go?
- Am I spending too quickly?

Charts are secondary to useful information.

## 3.3 Mobile-first

Design for narrow mobile screens first.

Do not simply shrink a desktop dashboard.

Touch targets should be comfortable and important actions should be reachable with one hand.

## 3.4 Progressive complexity

Basic users should be able to use the app without learning accounting concepts.

Advanced features can exist, but they should not clutter the primary experience.

## 3.5 The application should help users make decisions

The product should eventually evolve from:

> "Here is what you spent."

to:

> "Here is what is happening with your money and what it probably means."

For example:

> Your food spending is 18% higher than last week.

or:

> At your current spending rate, you may have approximately Rp450.000 left before the end of the month.

These insights must be based on actual stored data and clearly distinguish calculations from assumptions.

---

# 4. Target User

Initial target:

- Students
- Young adults
- Early-career users
- People managing personal money manually
- Users who use cash, bank accounts, and e-wallets
- Users who want a simpler alternative to complex accounting software

The Indonesian context should be considered from the beginning.

Examples of common financial instruments:

- Cash
- Bank accounts
- DANA
- GoPay
- OVO
- ShopeePay
- Other e-wallets
- Transfers between personal accounts

Do not assume every user only has one bank account.

---

# 5. Core Navigation

Recommended primary mobile navigation:

```text
Home
Transactions
Reports
Profile / More
```

A prominent floating or central action should provide:

```text
+ Add Transaction
```

The add transaction action should be visually obvious without dominating the interface.

Possible future navigation:

```text
Home
Transactions
Reports
Budget
More
```

Do not add navigation items simply because the feature exists. Navigation should stay compact.

---

# 6. Feature Priority

Use the following priority system.

### P0 — Required for MVP

These features must exist before considering the first usable release complete.

- Authentication or secure local/user session strategy
- Add income
- Add expense
- Edit transaction
- Delete transaction
- Transaction history
- Categories
- Accounts/wallets
- Balance calculation
- Transfer between accounts
- Basic dashboard
- Date filtering
- Weekly report
- Monthly report
- Yearly report
- Receipt-style report rendering
- Responsive/mobile-first UI
- IDR currency formatting
- Basic validation
- Database persistence
- Error handling

### P1 — Important after MVP

- Budget
- Recurring transactions
- Financial insights
- Goals / savings targets
- Debt tracking
- Search transactions
- Advanced filtering
- Export to CSV
- Export/share receipt as image
- PDF report
- Backup/restore
- Notifications/reminders

### P2 — Advanced

- Receipt OCR
- Voice transaction input
- Cash-flow forecasting
- Subscription tracking
- Net worth
- Financial health score
- Smart recommendations
- Bank/e-wallet integrations
- Advanced analytics
- Multi-currency
- Automatic transaction categorization

Do not build P1/P2 features before the P0 flow is solid.

---

# 7. Transaction Model

The transaction system is the foundation of the application.

A transaction should support at least:

```text
id
user_id
type
amount
category_id
account_id
date
note
created_at
updated_at
```

Where:

```text
type:
- income
- expense
- transfer
```

For transfers, the data model must represent both source and destination accounts.

Example:

```text
BCA → DANA
Rp200.000
```

This must NOT become an expense.

The system must recognize that the user's total money is unchanged.

A robust implementation may use either:

### Option A
A transfer entity containing:

```text
source_account_id
destination_account_id
amount
date
note
```

### Option B
Linked transaction records representing debit and credit sides.

Choose the model that provides the cleanest accounting consistency.

---

# 8. Accounts

Users can create multiple accounts.

Examples:

```text
Cash
BCA
Mandiri
DANA
GoPay
OVO
Savings
```

Account fields should conceptually include:

```text
id
user_id
name
type
initial_balance
current_balance
currency
created_at
updated_at
```

Possible account types:

- cash
- bank
- ewallet
- savings
- other

The dashboard should aggregate balances across accounts.

Example:

```text
Total Balance
Rp7.250.000

BCA
Rp4.000.000

Cash
Rp750.000

DANA
Rp500.000

Mandiri
Rp2.000.000
```

---

# 9. Categories

Provide default categories but allow customization.

Example expense categories:

- Food
- Transportation
- Shopping
- Bills
- Entertainment
- Health
- Education
- Personal
- Other

Example income categories:

- Salary
- Allowance
- Freelance
- Bonus
- Gift
- Other

Support custom categories.

Consider optional subcategories later.

Example:

```text
Transportation
├── Fuel
├── Ride Hailing
├── Parking
└── Public Transport
```

Category selection should be optimized for mobile.

---

# 10. Add Transaction UX

This is one of the most important screens.

Recommended structure:

```text
Add Transaction

[ Expense ] [ Income ] [ Transfer ]

Amount
Rp25.000

Category
🍔 Food

Account
Cash

Date
Today

Note
Lunch

[ Save Transaction ]
```

Important UX requirements:

- Numeric keypad-friendly amount input.
- Amount should be visually dominant.
- Expense/income selection should be extremely clear.
- Reasonable defaults should reduce typing.
- Date defaults to today.
- Account should remember the user's most recently used account when appropriate.
- Category should remember common choices when appropriate.
- Save action should be obvious.
- Validation should be clear and immediate.

Do not ask unnecessary information before saving a simple transaction.

---

# 11. Dashboard

The dashboard is not an analytics museum.

It should focus on the user's current state.

Recommended structure:

```text
September 2026

TOTAL BALANCE
Rp3.250.000

Income
+Rp4.500.000

Expense
-Rp2.100.000

Net
+Rp2.400.000

Cash Flow
[simple visual]

Recent Transactions

Food               -Rp25.000
Transportation     -Rp18.000
Freelance         +Rp500.000

[ View Reports ]
```

Potential additional section:

```text
Spending This Month
Rp2.100.000 / Rp3.000.000 budget
```

And an insight card:

```text
Insight

Food spending is 14% higher
than last month.
```

Do not overload the dashboard.

---

# 12. Transaction History

The transaction list should be easy to scan.

Recommended grouping:

```text
6 September

Food
Lunch
-Rp25.000

Transportation
Gojek
-Rp18.000

Freelance
+Rp500.000


5 September

Shopping
Supermarket
-Rp240.000
```

Provide:

- Search
- Date filter
- Category filter
- Account filter
- Type filter
- Amount/order sorting where useful

Each transaction should be editable.

Swipe actions can be considered later, but must not cause accidental deletion.

---

# 13. Reports

Reports are a major product identity.

The Reports screen should offer:

```text
[ Weekly ] [ Monthly ] [ Yearly ]
```

Each report should be generated from transaction data automatically.

Do NOT manually store a report as the primary source of truth.

Reports should be derived from the transaction/account/category database.

---

# 14. Receipt-Style Reports

The report should look visually inspired by a receipt, not a spreadsheet.

Design characteristics:

- Narrow/compact layout
- Strong hierarchy
- Monospace or receipt-inspired typography may be used selectively
- Clear separators
- Plenty of whitespace
- Numeric alignment
- Easy vertical scanning
- Minimal decoration
- Important totals should be visually dominant
- The report must remain readable on a mobile screen

Example concept:

```text
╭────────────────────────────╮
│        MY FINANCE          │
│      WEEKLY RECEIPT        │
│       01—07 SEP 2026       │
├────────────────────────────┤
│                            │
│ INCOME             +Rp2.5M │
│ EXPENSE            -Rp1.7M │
│ ─────────────────────────  │
│ NET CASH FLOW       +Rp800K│
│                            │
│ TOP SPENDING               │
│ Food                Rp520K │
│ Transport           Rp280K │
│ Shopping            Rp240K │
│                            │
│ TRANSACTIONS             23│
│                            │
│ VS LAST WEEK               │
│ Expense              +12%  │
│                            │
│ INSIGHT                    │
│ Food spending increased    │
│ by Rp120K this week.       │
│                            │
│ Generated 07 Sep 2026      │
╰────────────────────────────╯
```

This is only a conceptual layout. Do not copy the exact ASCII styling into the UI.

The final implementation should look polished and modern.

---

# 15. Weekly Report

Purpose:

> Help users understand recent spending behavior.

Recommended content:

1. Date range
2. Total income
3. Total expense
4. Net cash flow
5. Number of transactions
6. Top spending categories
7. Comparison with previous week
8. One or more useful insights
9. Optional budget progress
10. Optional largest transaction

Example:

```text
WEEKLY RECEIPT
01–07 September 2026

Income             +Rp2.500.000
Expense            -Rp1.700.000
Net                  Rp800.000

Transactions                 23

Top Categories
Food                 Rp520.000
Transport            Rp280.000
Shopping             Rp240.000

Compared to last week
Expenses              +12%

Insight:
Food spending increased by Rp120.000.
```

Avoid unnecessary metrics.

---

# 16. Monthly Report

Purpose:

> Help users understand and evaluate their month's financial management.

Recommended content:

- Month
- Total income
- Total expenses
- Net cash flow
- Savings amount
- Savings rate
- Transaction count
- Top categories
- Budget usage
- Comparison to previous month
- Largest expense
- Recurring expenses
- Useful insight

Example:

```text
MONTHLY RECEIPT
AUGUST 2026

Income             +Rp4.500.000
Expenses            -Rp2.750.000
Net                 +Rp1.750.000

Savings Rate               38.9%

Top Categories
Food                 Rp650.000
Bills                Rp720.000
Shopping             Rp450.000

Transactions                 87

Compared to July
Expenses               -8%

Largest Expense
Internet              Rp350.000

Insight:
You spent less this month than July.
```

Savings rate calculation should be defined clearly:

```text
Savings Rate = Net Cash Flow / Total Income × 100
```

Handle zero or negative income safely.

---

# 17. Yearly Report

Purpose:

> Give the user a high-level review of financial behavior across the year.

Recommended content:

- Total annual income
- Total annual expense
- Annual net cash flow
- Annual savings
- Average monthly income
- Average monthly expenses
- Savings rate
- Largest spending category
- Best month for saving
- Highest-spending month
- Number of transactions
- Monthly trend
- Useful annual insight

Example:

```text
2026 YEARLY RECEIPT

Income             Rp54.200.000
Expenses           Rp39.800.000
Saved              Rp14.400.000

Average / Month
Income              Rp4.516.000
Expense             Rp3.316.000

Biggest Category
Food                Rp9.200.000

Best Month
March

Highest Spending
December

Savings Rate              26.6%
```

Avoid presenting statistics that cannot be computed reliably.

For example, "Best Month" needs an explicit definition such as highest net saving, not a vague AI judgment.

---

# 18. Report Generation Rules

Reports must be deterministic.

Given the same source transactions and the same date range, the same report numbers should be generated.

Do not use an LLM to calculate financial totals.

Use application/database logic for:

- Sum income
- Sum expenses
- Net cash flow
- Category totals
- Transaction counts
- Comparisons
- Savings rate
- Budget percentages

AI may later be used for natural-language explanations, but the numbers must come from deterministic application logic.

---

# 19. Receipt Sharing / Export

The receipt should be usable beyond the app.

Potential actions:

```text
[ Share ]
[ Save Image ]
[ Export PDF ]
```

Recommended initial implementation:

### MVP
- Render report as normal UI
- Provide a clean shareable visual version

### Later
- Export PNG/JPG
- Export PDF

Avoid implementing complicated PDF infrastructure before the core report UI works.

On mobile, a user should be able to share a monthly receipt to messaging applications easily.

---

# 20. Budget

P1 feature.

Users should be able to set:

```text
Food
Budget: Rp1.000.000 / month
Spent:  Rp650.000

65%
██████░░░░
```

Possible states:

- Normal
- Near limit
- Over budget

Example insight:

> You have Rp350.000 remaining for Food this month.

Budget calculations must use the correct date range and category.

---

# 21. Recurring Transactions

P1 feature.

Support recurring:

- Salary
- Rent
- Internet
- Electricity
- Subscription
- Installments
- Monthly allowance

Example:

```text
Internet
Rp350.000
Every month
10th
```

The implementation should avoid duplicate creation if the scheduler runs more than once.

Recurring transaction generation must be idempotent.

---

# 22. Financial Insights

P1 feature.

Insights should be useful, short, and evidence-based.

Good:

> Food spending is 18% higher than last week.

Good:

> You spent Rp450.000 more this month than last month.

Good:

> At your current average daily spending, your balance may reach approximately Rp900.000 by month end.

Avoid unsupported advice such as:

> You are financially unhealthy.

unless a formal scoring system has been designed and explained.

Insights should clearly distinguish facts from projections.

---

# 23. Future Cash-Flow Forecast

P2 feature.

The goal:

> Predict whether current money is likely to last until the end of the selected period.

Conceptual calculation:

```text
Current Balance
+ Expected Income
- Expected Recurring Expenses
- Estimated Variable Spending
= Estimated End Balance
```

The application must show that this is an estimate.

Example:

```text
Estimated End of Month

Current Balance      Rp3.200.000
Upcoming Bills        -Rp850.000
Estimated Spending   -Rp1.200.000
──────────────────────────────
Estimated Balance     Rp1.150.000

Status: Likely Safe
```

Do not present predictions as guaranteed facts.

---

# 24. Savings Goals

P1/P2 feature.

Example:

```text
PS5

Goal                 Rp8.000.000
Current              Rp5.250.000
Progress                   66%

Monthly target        Rp275.000
```

The app may calculate an estimated completion date.

This feature should remain separate from normal transaction balances.

---

# 25. Debt Tracking

Optional P1/P2.

Users may track:

- Money borrowed
- Money lent
- Person
- Amount
- Due date
- Paid amount
- Remaining balance

Example:

```text
Andi
Original          Rp500.000
Paid              Rp200.000
Remaining         Rp300.000
```

Do not mix debt records into ordinary income/expense totals unless a deliberate accounting rule is defined.

---

# 26. Receipt Scanner

P2.

Possible flow:

```text
Take Photo
    ↓
OCR
    ↓
Extract merchant/date/items/total
    ↓
Suggest category
    ↓
User confirms
    ↓
Create transaction
```

Never automatically record an OCR result without user confirmation.

---

# 27. Voice Input

P2.

Possible input:

> "Catat pengeluaran makan tiga puluh lima ribu."

The system may infer:

```text
Type: Expense
Category: Food
Amount: Rp35.000
Date: Today
```

The user should confirm before saving.

---

# 28. Security

Financial data is sensitive.

Minimum requirements:

- Authenticated user data must be isolated by user ID.
- Database queries must enforce user ownership.
- Never expose another user's transactions.
- Validate server-side, not only client-side.
- Never trust client-provided authorization identifiers.
- Use secure authentication mechanisms.
- Avoid logging sensitive financial details unnecessarily.
- Consider PIN/biometric lock as a future mobile feature.
- Protect API routes with proper authorization.

Do not store plaintext passwords.

Use the authentication system provided by the selected auth provider.

---

# 29. Recommended Initial Architecture

Preferred conceptual stack:

```text
Frontend
Next.js
React
TypeScript
Tailwind CSS

Hosting
Vercel

Backend / Database
Supabase
PostgreSQL

Authentication
Supabase Auth

Optional future storage
Supabase Storage
```

This is a recommendation, not a rigid requirement.

If the project already has an established stack, preserve existing architecture unless there is a strong reason to change it.

Do not introduce unnecessary services.

---

# 30. Cost Philosophy

The project should be designed around a free-first / low-cost deployment model.

Primary expectation:

```text
Vercel
+
Supabase free/low-cost tier
```

However:

> Do not assume free tiers are unlimited.

The application should be engineered efficiently and avoid unnecessarily expensive workloads.

Do not add infrastructure merely because it is technically possible.

Examples of features that may increase costs later:

- Large file storage
- Heavy OCR processing
- AI API usage
- High-frequency background jobs
- Large analytics workloads
- External bank integrations

These should be treated as future scaling concerns.

---

# 31. PWA / Mobile Web

Because the deployment target is Vercel and the primary interaction is mobile, strongly consider a PWA architecture.

Potential capabilities:

- Installable on mobile
- App-like experience
- Offline shell
- Local draft transaction
- Home-screen shortcut
- Fast loading
- Responsive design

Do not implement offline synchronization carelessly.

If offline transactions are supported, the system needs a clear synchronization strategy and conflict handling.

A simpler MVP may first support offline-friendly UI and local draft persistence, then implement full offline transaction synchronization later.

---

# 32. Data Integrity

Financial applications require strong consistency.

Rules:

1. Amounts must not become negative accidentally.
2. Deleted transactions must update totals correctly.
3. Editing a transaction must recalculate affected aggregates.
4. Transfers must not be counted as income or expense.
5. Account balances must remain consistent.
6. Reports must reflect current transactions.
7. Date/time handling must be deliberate.
8. Currency formatting must not change the underlying numeric value.

Prefer integer minor-unit storage where appropriate.

For Indonesian Rupiah, storing whole rupiah values as integers is usually simpler than floating-point arithmetic.

Example:

```text
25000
```

instead of:

```text
25000.00
```

Avoid JavaScript floating-point errors for financial calculations.

---

# 33. Date Handling

Financial reporting depends heavily on dates.

Define a consistent business timezone.

For an Indonesian-first application, the initial assumption can be:

```text
Asia/Makassar
```

but the architecture should allow user timezone configuration later.

Weekly/monthly/yearly date ranges must be explicit.

Example monthly period:

```text
1 September 00:00:00
through
30 September 23:59:59
```

Avoid ambiguous client/server timezone conversions.

---

# 34. IDR Formatting

Indonesian Rupiah should be formatted naturally.

Examples:

```text
Rp25.000
Rp1.250.000
Rp10.000.000
```

Do not store the `Rp` prefix inside the numeric database field.

Use formatting functions at presentation time.

Example conceptual utility:

```text
formatCurrency(25000)
→ "Rp25.000"
```

---

# 35. Responsive Design Requirements

Primary target:

```text
Mobile width
~320px to 480px
```

The app must remain usable on narrow phones.

Also support:

- Tablet
- Desktop browser

Desktop can use additional whitespace and larger containers but should not become a fundamentally different product.

Use responsive components rather than separate duplicated UIs where practical.

---

# 36. Accessibility

The application should:

- Use readable font sizes.
- Maintain adequate contrast.
- Have large enough touch targets.
- Avoid relying on color alone to communicate income/expense status.
- Provide accessible labels.
- Support keyboard navigation on desktop.
- Provide meaningful focus states.
- Respect reduced motion preferences where relevant.

Icons should not replace essential text labels when meaning could become ambiguous.

---

# 37. Error Handling

Financial actions must fail safely.

Examples:

If saving transaction fails:

> Transaction was not saved. Please try again.

Do not show a fake success state.

If an API request times out, prevent accidental double submission.

Use loading states.

Disable repeated submit actions while a transaction is being saved.

For destructive operations:

```text
Delete transaction?

This will permanently remove the transaction.
[Cancel] [Delete]
```

---

# 38. Empty States

Do not show blank pages.

Example dashboard when no transactions exist:

```text
Your finances start here.

Add your first transaction to begin
understanding where your money goes.

[ + Add Transaction ]
```

Reports when there is no data:

```text
No transactions in this period.

Add a transaction to generate your report.
```

---

# 39. Loading States

Use skeletons or purposeful loading UI for:

- Dashboard
- Transaction list
- Reports
- Account data

Avoid unnecessary full-screen spinners.

The user should understand what is loading.

---

# 40. Design Direction

The visual style should be:

- Modern
- Calm
- Minimal
- Trustworthy
- Slightly playful
- Financial but not corporate
- Mobile-first

Do not make the interface look like enterprise accounting software.

Do not overuse charts.

Do not use excessive gradients or decoration.

The receipt reports may have a distinctive visual style separate from the main app, while still belonging to the same design system.

---

# 41. Report Visual Hierarchy

The hierarchy should generally be:

```text
1. Report period
2. Total income / expense / net
3. Major spending categories
4. Comparison
5. Insight
6. Secondary statistics
7. Metadata
```

The user should be able to understand the report by scanning from top to bottom.

Important numbers should align consistently.

Large financial values should not be unnecessarily abbreviated if doing so reduces clarity.

For example:

```text
Rp1.250.000
```

may be preferable to:

```text
Rp1.25M
```

inside a detailed receipt.

---

# 42. Reports Must Be Honest

Never manufacture an insight.

Bad:

> You are doing great financially!

without a defined metric.

Better:

> Your expenses decreased 12% compared with last month.

Better:

> Your savings rate increased from 24% to 31%.

Every generated statement should be traceable to application data.

---

# 43. Future AI Integration

AI should be an enhancement, not the foundation of accounting calculations.

Good AI use cases:

- Explain spending patterns in natural language.
- Summarize a report.
- Suggest categories.
- Convert natural-language transaction input into structured data.
- Help users understand unusual spending.
- Generate personalized educational explanations.

Bad AI use cases:

- Calculating balances.
- Deciding whether an account balance is correct.
- Performing core accounting logic.
- Being the only source of financial truth.

The database and deterministic business logic must remain authoritative.

---

# 44. Database Concept

Recommended conceptual entities:

```text
users
profiles

accounts
categories
transactions

recurring_transactions
budgets
goals
debts

report_preferences
```

Potential relationships:

```text
User
 ├── Accounts
 ├── Categories
 ├── Transactions
 ├── Budgets
 ├── Goals
 ├── Debts
 └── Recurring Transactions
```

Every user-owned record must have a secure ownership relationship.

---

# 45. Suggested Transaction Types

Use explicit transaction semantics.

```text
income
expense
transfer
```

Avoid representing transfers as:

```text
expense from A
income to B
```

at the business-rule level unless linked records are deliberately designed.

The user should see the transfer as one action.

---

# 46. API / Server Rules

All financial mutations should be validated server-side.

Example conceptual endpoints/actions:

```text
POST   /transactions
GET    /transactions
PATCH  /transactions/:id
DELETE /transactions/:id

POST   /transfers
GET    /accounts
POST   /accounts

GET    /reports/weekly
GET    /reports/monthly
GET    /reports/yearly
```

Framework-specific routing can differ.

Prefer server actions or API routes that fit the chosen Next.js architecture.

Do not expose privileged database credentials to the client.

---

# 47. Testing Strategy

At minimum, test:

## Transaction logic

- Add expense
- Add income
- Edit transaction
- Delete transaction
- Transfer
- Multiple accounts
- Multiple categories

## Reporting

- Weekly totals
- Monthly totals
- Yearly totals
- Previous-period comparisons
- Category aggregation
- Savings rate
- Empty periods

## Edge cases

- Zero income
- Negative net cash flow
- Very large amounts
- Same-day transfers
- Transaction at month boundary
- Year boundary
- Timezone changes
- Duplicate form submission
- Deleted category referenced by old transaction

Financial calculations should have automated unit tests.

---

# 48. MVP User Flow

## First launch

```text
Open App
    ↓
Sign In / Create Account
    ↓
Create first account
    ↓
Set initial balance
    ↓
Dashboard
```

## Recording spending

```text
Dashboard
    ↓
+ Add Transaction
    ↓
Expense
    ↓
Amount
    ↓
Category
    ↓
Account
    ↓
Save
    ↓
Dashboard updates
```

## Viewing report

```text
Dashboard
    ↓
Reports
    ↓
Weekly / Monthly / Yearly
    ↓
Receipt
    ↓
View / Share / Export
```

---

# 49. Critical MVP Acceptance Criteria

The MVP should not be considered complete until:

### Transaction

- User can add an expense.
- User can add income.
- User can edit a transaction.
- User can delete a transaction.
- User can assign a category.
- User can assign an account.

### Account

- User can create multiple accounts.
- Balances are correct.
- Transfers do not incorrectly inflate income or expense.

### Dashboard

- Current balance is correct.
- Monthly income is correct.
- Monthly expense is correct.
- Recent transactions are visible.

### Reports

- Weekly report works.
- Monthly report works.
- Yearly report works.
- Report values match transaction data.
- Receipt-style UI works on mobile.
- Empty periods are handled correctly.

### Quality

- Responsive mobile UI.
- Loading states.
- Error states.
- Form validation.
- No unauthorized data access.
- No duplicate transaction creation due to repeated submission.

---

# 50. Important Things the AI Agent Must NOT Do

Do not:

1. Build every future feature immediately.
2. Over-engineer the MVP.
3. Replace deterministic financial calculations with AI.
4. Create fake sample functionality presented as real functionality.
5. Store financial amounts as imprecise floating-point values without a deliberate reason.
6. Count transfers as expenses/income.
7. Trust user IDs from the browser for authorization.
8. Put secrets in client-side code.
9. Prioritize charts over transaction usability.
10. Make the dashboard overly crowded.
11. Introduce unnecessary infrastructure.
12. Assume free hosting tiers are unlimited.
13. Create complicated offline synchronization without a clear data-consistency strategy.
14. Generate misleading financial insights.

---

# 51. Development Strategy

Work incrementally.

Recommended order:

```text
Phase 1
Project setup
Authentication
Database schema
Basic design system

Phase 2
Accounts
Categories
Transactions
Transfers

Phase 3
Dashboard
Transaction history
Filters

Phase 4
Weekly/monthly/yearly reporting
Receipt UI

Phase 5
Budget
Recurring transactions
Insights

Phase 6
Export/share
PWA improvements
Offline capabilities

Phase 7
Advanced features
OCR
Voice input
Forecasting
AI assistance
```

After every major phase:

1. Run tests.
2. Check mobile responsiveness.
3. Check financial calculations.
4. Check authorization.
5. Check error states.
6. Verify that existing functionality still works.

Do not silently break existing features while adding new ones.

---

# 52. Suggested Component Structure

This is conceptual and may be adapted.

```text
app/
  dashboard/
  transactions/
  reports/
  accounts/
  settings/

components/
  finance/
    transaction-form
    transaction-list
    account-card
    category-picker
    balance-card
    budget-progress
    insight-card
    report-receipt

lib/
  finance/
    calculations
    reports
    currency
    dates
    validation

db/
  schema
  queries
```

Keep business logic separate from UI components.

Do not place complex financial calculations directly inside presentation components.

---

# 53. Suggested Business Logic Utilities

Create reusable functions for concepts such as:

```text
calculateAccountBalance()
calculateNetCashFlow()
calculateCategoryTotals()
calculateSavingsRate()
calculateBudgetProgress()
calculatePeriodComparison()
generateWeeklyReport()
generateMonthlyReport()
generateYearlyReport()
```

These should be deterministic and testable.

---

# 54. Period Comparison

For reports:

### Weekly

Compare current week with previous week.

### Monthly

Compare current month with previous month.

### Yearly

Compare current year with previous year when previous-year data exists.

Do not display comparison percentages when the comparison baseline is zero unless the UI has a clear alternative.

Example:

Instead of:

```text
+∞%
```

display:

```text
No previous spending recorded
```

---

# 55. Financial Terminology

Use language that ordinary users understand.

Prefer:

```text
Income
Expense
Balance
Saved
Spent
Transfer
Budget
Goal
```

Avoid unnecessarily technical accounting language unless the user enables an advanced mode.

The app should be understandable by a student using it for the first time.

---

# 56. Localization

Initial language:

```text
Indonesian
```

Initial currency:

```text
IDR
```

Architecture should allow English/localization later.

Do not hardcode language strings directly across components.

Use a centralized translation strategy once the app becomes large enough.

---

# 57. UX Details That Matter

Small details are important.

Examples:

After saving:

```text
✓ Transaction saved
```

After editing:

```text
✓ Transaction updated
```

When deleting:

```text
Transaction deleted
[Undo]
```

An undo action can be implemented later.

When switching report period:

```text
‹ September 2026 ›
```

This should feel instant.

---

# 58. The Signature Feature

The signature feature is:

> **Automatic financial receipts.**

The user should eventually feel:

> "At the end of the week/month/year, my finances give me a receipt."

The receipt should summarize the period without requiring manual report generation.

Conceptually:

```text
Weekly
   ↓
Monthly
   ↓
Yearly
```

Each level becomes a different depth of financial reflection.

Weekly:
> "What happened recently?"

Monthly:
> "How did I manage my money?"

Yearly:
> "What did my financial year look like?"

This hierarchy should inform both UX and report content.

---

# 59. Product Personality

The application should feel:

> Calm, clear, useful, and trustworthy.

It should not shame users for spending money.

Bad:

> "You wasted too much money."

Better:

> "Food spending increased 22% this month."

The product should present information honestly and let the user make decisions.

---

# 60. Final Product Definition

The product can be summarized as:

> A mobile-first personal finance application that makes transaction recording extremely fast and automatically transforms financial activity into simple, receipt-style weekly, monthly, and yearly reports.

The first release should focus on:

```text
Fast Transaction Entry
+
Accurate Account Balances
+
Simple Dashboard
+
Automatic Financial Reports
+
Receipt-Style Presentation
```

Everything else should support those foundations.

---

# 61. Instruction to AI Coding Agent

When implementing this project:

1. Read this document before changing architecture.
2. Treat financial correctness as higher priority than visual polish.
3. Treat mobile UX as higher priority than desktop optimization.
4. Keep the MVP scope controlled.
5. Reuse components and business logic.
6. Never duplicate financial calculation logic unnecessarily.
7. Never trust client-side authorization.
8. Write tests for financial calculations.
9. Verify every report against raw transaction data.
10. Keep the receipt report visually distinctive but highly readable.
11. Prefer simple, maintainable infrastructure.
12. Preserve the ability to deploy on Vercel.
13. Avoid introducing paid services unless clearly necessary.
14. Clearly document environment variables and setup requirements.
15. When making a design or architecture decision that affects future scalability, document the reason in code or project documentation.

The agent should prefer:

> **Simple + accurate + maintainable**

over:

> **Complex + impressive + fragile**.

---

# 62. Definition of Success

The app succeeds when a new user can:

```text
Open app
   ↓
See how much money they have
   ↓
Record a transaction in seconds
   ↓
Continue using the app naturally
   ↓
Open Reports
   ↓
Immediately understand their spending
   ↓
Receive a clean receipt-style summary
```

The experience should make financial tracking feel lightweight enough to become a habit.
