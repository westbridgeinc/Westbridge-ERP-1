# WESTBRIDGE — CURSOR BUILD GUIDE

> You are building **Westbridge** — a premium AI-powered multi-tenant ERP SaaS for Caribbean businesses.
> This document contains every step. Follow them IN ORDER. Do not skip ahead.
> After each step, verify it works before moving to the next.
> If a step breaks something from a previous step, fix it before continuing.

---

## BRAND

- **Name:** Westbridge
- **Tagline:** "Enterprise intelligence for the Caribbean"
- **Domain:** westbridge.gy (marketing), app.westbridge.gy (platform)
- **Voice:** Professional, understated, confident. Never "Hey!" or "Awesome!"
- **Remove all traces of:** ERPNext, Frappe, open-source branding

---

## DESIGN SYSTEM

Study these references — this is the quality bar:
- **linear.app** — sidebar, command palette, transitions, restraint
- **vercel.com/dashboard** — clean layout, dark accents on white
- **stripe.com/dashboard** — data tables, metric cards, professional forms
- **notion.so** — workspace feel, onboarding, page layouts

### Colors
```
Background:      #FFFFFF (primary), #FAFAF9 (secondary), #F5F5F0 (sections)
Text:            #0A0A0A (primary), #6B6B6B (secondary), #9B9B9B (tertiary)
Borders:         #E8E8E3 (default), #D0D0CB (hover)
Accent:          #000000 (buttons, links)
Status:          #16A34A (success/green), #D97706 (warning/yellow), #DC2626 (error/red), #2563EB (info/blue)
Dark sections:   #0A0A0A (CTAs, footer, login left panel)
```

### Typography
```
Font:            Inter (import from Google Fonts)
Body:            14px (text-sm), font-weight 400
Labels:          13px, font-weight 500, text-gray-500
Headings:        font-weight 600, tracking-tight
Hero headlines:  text-5xl to text-7xl, font-weight 600, tracking-tight, leading-[1.08]
Section titles:  text-3xl, font-weight 600
Page titles:     text-2xl, font-weight 600
```

### Spacing
```
4px base grid. Use Tailwind: p-6 for cards, py-24 for sections, gap-4 for grids.
Generous whitespace — cheap sites cram things together. Premium sites breathe.
```

### Components Style
```
Cards:           bg-white rounded-xl p-6 border border-gray-100
Buttons primary: bg-black text-white text-sm font-medium px-5 py-2.5 rounded-md hover:bg-gray-800
Buttons ghost:   text-sm font-medium text-gray-600 hover:text-black
Inputs:          border border-gray-200 rounded-md px-4 py-3 text-sm w-full focus:ring-1 focus:ring-black focus:border-black
Badges:          rounded-full px-2.5 py-0.5 text-xs font-medium
  Paid/Active:   bg-green-50 text-green-700
  Unpaid/Pending:bg-yellow-50 text-yellow-700
  Overdue/Error: bg-red-50 text-red-700
  Draft/Inactive:bg-gray-100 text-gray-600
  Sent/Info:     bg-blue-50 text-blue-700
Tables:          bg-white rounded-xl border border-gray-100 overflow-hidden
  Header:        bg-gray-50 text-xs text-gray-500 uppercase tracking-wider font-medium
  Rows:          hover:bg-gray-50, border-b border-gray-50
  Amounts:       text-right font-medium
```

### Anti-patterns — NEVER do these
```
- Gradients, colored blobs, animated shapes
- Purple/blue AI-looking color schemes
- Stock photo placeholders
- Emojis in headings
- Cards with colored left borders
- "Powered by" badges
- Multiple font families
- Cluttered layouts with no breathing room
- Alert boxes for form validation (use inline errors)
- Full-page redirects for create/edit (use modals or slide-overs)
```

---

## ARCHITECTURE

```
Customer browser → Next.js App (port 3000) → ONLY thing exposed to internet
                        │
                        ├── Public pages (/, /pricing, /modules, /about)
                        ├── Auth pages (/login, /signup)
                        ├── Dashboard pages (/dashboard/*)
                        ├── /api/v1/erp/*  → proxy to ERPNext (port 8080, internal only)
                        └── /api/v1/ai/*   → proxy to AI Gateway (port 8000, Phase 2)

ERPNext is a HEADLESS BACKEND. Customer never sees it. Never knows it exists.
```

---

## MODULE CATALOG (38 total)

All modules with pricing and plan minimums:

### Finance
| Module | Price | Min Plan | ERPNext Doctype |
|--------|-------|----------|-----------------|
| Invoicing & Billing | $39/mo | Starter | Sales Invoice |
| Full Accounting (GL) | $79/mo | Growth | GL Entry, Journal Entry |
| Expense Management | $29/mo | Starter | Expense Claim |
| Budgeting & Forecasting | $49/mo | Growth | Budget |

### Sales
| Module | Price | Min Plan | ERPNext Doctype |
|--------|-------|----------|-----------------|
| Sales Orders & Quotations | $39/mo | Starter | Sales Order, Quotation |
| CRM & Pipeline | $59/mo | Starter | Lead, Opportunity |
| Marketing Campaigns | $49/mo | Growth | Campaign |

### Operations
| Module | Price | Min Plan | ERPNext Doctype |
|--------|-------|----------|-----------------|
| Inventory & Stock | $59/mo | Starter | Stock Entry, Item |
| Procurement & Purchasing | $49/mo | Growth | Purchase Order |
| Manufacturing & BOM | $79/mo | Business | BOM, Work Order |
| Quality Management | $39/mo | Business | Quality Inspection |
| Warehouse Management | $49/mo | Growth | Warehouse |

### People
| Module | Price | Min Plan | ERPNext Doctype |
|--------|-------|----------|-----------------|
| HR & Employee Management | $49/mo | Growth | Employee |
| Payroll (NIS/GYD) | $79/mo | Growth | Salary Slip |
| Leave & Attendance | $29/mo | Growth | Leave Application |
| Recruitment | $39/mo | Business | Job Applicant |
| Training (LMS) | $39/mo | Business | Training Event |

### Projects
| Module | Price | Min Plan | ERPNext Doctype |
|--------|-------|----------|-----------------|
| Project Management | $59/mo | Starter | Project, Task |
| Timesheets & Billing | $29/mo | Growth | Timesheet |

### Assets
| Module | Price | Min Plan | ERPNext Doctype |
|--------|-------|----------|-----------------|
| Asset Management | $49/mo | Growth | Asset |
| Fleet & Vehicle Tracking | $59/mo | Business | Vehicle |

### Retail
| Module | Price | Min Plan | ERPNext Doctype |
|--------|-------|----------|-----------------|
| Point of Sale (POS) | $69/mo | Growth | POS Invoice |
| E-Commerce Integration | $79/mo | Business | Website Item |

### Support
| Module | Price | Min Plan | ERPNext Doctype |
|--------|-------|----------|-----------------|
| Help Desk & Ticketing | $49/mo | Starter | Issue |
| Knowledge Base | $29/mo | Growth | Help Article |
| Customer Portal | $39/mo | Growth | Portal Settings |

### Productivity
| Module | Price | Min Plan | ERPNext Doctype |
|--------|-------|----------|-----------------|
| Document Management | $29/mo | Growth | File |
| Workflow Automation | $59/mo | Business | Workflow |

### Intelligence
| Module | Price | Min Plan | ERPNext Doctype |
|--------|-------|----------|-----------------|
| Reports & Analytics (BI) | $59/mo | Growth | Query Report |
| AI Assistant | $99/mo | Growth | (Custom) |

### Industry-Specific
| Module | Price | Min Plan | ERPNext Doctype |
|--------|-------|----------|-----------------|
| Property Management | $79/mo | Business | (Custom) |
| Lending & Loans | $79/mo | Business | Loan |
| Education Management | $69/mo | Business | Student |
| Healthcare | $99/mo | Business | Patient |

### Communication
| Module | Price | Min Plan | ERPNext Doctype |
|--------|-------|----------|-----------------|
| WhatsApp Notifications | $29/mo | Growth | (Twilio) |
| SMS & Email Automation | $29/mo | Starter | Email Queue |

### Developer
| Module | Price | Min Plan | ERPNext Doctype |
|--------|-------|----------|-----------------|
| API Access | $49/mo | Business | (Custom) |
| Webhooks & Integrations | $39/mo | Business | Webhook |

---

# BUILD STEPS

Each step has a ✅ CHECKPOINT. Do not proceed until the checkpoint passes.

---

## STEP 1: Project Setup

```bash
npx create-next-app@latest westbridge --typescript --tailwind --eslint --app --use-npm --no-src --import-alias "@/*"
cd westbridge
npm install framer-motion lucide-react recharts
```

Add Inter font to app/layout.tsx:
```tsx
import { Inter } from 'next/font/google'
const inter = Inter({ subsets: ['latin'] })

// In the html tag:
<html lang="en">
  <body className={inter.className}>{children}</body>
</html>
```

Make sure app/globals.css ONLY contains:
```css
@tailwind base;
@tailwind components;
@tailwind utilities;
```

✅ CHECKPOINT 1: Run `npm run dev`. Open localhost:3000. You should see the default Next.js page WITH Tailwind styling (not unstyled HTML). If styling is broken, fix Tailwind config before continuing.

---

## STEP 2: Homepage

Replace app/page.tsx with a COMPLETE homepage. Put EVERYTHING in this one file — no component imports yet.

### Navbar (sticky top)
- White bg, border-b border-gray-100
- Left: "Westbridge" text-xl font-semibold tracking-tight
- Center: "Pricing" "Modules" "About" as text-sm text-gray-600 gap-8 links
- Right: "Sign in" text-sm text-gray-600 + "Get started" bg-black text-white text-sm px-4 py-2 rounded-md

### Hero (py-32, max-w-3xl)
- Eyebrow: text-sm text-gray-400 uppercase tracking-widest "Enterprise software for the Caribbean"
- Headline: text-5xl md:text-7xl font-semibold tracking-tight leading-[1.08] "Run your entire business from one platform."
- Subtitle: text-lg text-gray-500 max-w-xl mt-6 "Invoicing, inventory, HR, payroll, CRM — with AI built in. Designed for Caribbean businesses from day one."
- Buttons (mt-8, flex gap-3):
  - "Start free trial" → bg-black text-white text-sm font-medium px-5 py-2.5 rounded-md
  - "See pricing →" → text-sm font-medium text-gray-600 hover:text-black
- Fine print: mt-4 text-xs text-gray-400 "Free 14-day trial · No credit card required · Cancel anytime"

### Modules Section (py-24, border-t border-gray-100)
- Eyebrow: text-sm font-medium text-gray-400 uppercase tracking-widest "Platform"
- Title: text-3xl font-semibold tracking-tight mt-2 "38 modules. One subscription."
- Subtitle: text-gray-500 mt-2 "Pick the modules you need. Add more as you grow."
- Grid: grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mt-12
- 6 cards showing: Invoicing ($39), CRM ($59), Inventory ($59), HR & Payroll ($79), Accounting ($79), Project Management ($59)
- Each card: p-6 rounded-xl bg-gray-50 hover:bg-gray-100 transition
  - Name: text-sm font-semibold
  - Description: text-sm text-gray-500 mt-1
  - Price: text-xs text-gray-400 mt-3

### Caribbean Section (py-24, bg-gray-50)
- Title: "Built for the Caribbean, not retrofitted"
- 3 feature cards in grid lg:grid-cols-3 gap-6:
  - "GYD & Caribbean currencies" — native multi-currency support
  - "VAT & NIS compliance" — 14% VAT, NIS deductions built in
  - "WhatsApp native" — business notifications via WhatsApp

### CTA Section (py-24, bg-black text-white, text-center)
- "Ready to modernize your business?"
- "Start your 14-day free trial. No credit card required." text-gray-400
- Button: bg-white text-black text-sm font-medium px-5 py-2.5 rounded-md

### Footer (py-12, bg-black text-white, border-t border-gray-800)
- Left: "© 2026 Westbridge"
- Right: "Pricing · Modules · About · Contact" links
- All text-sm text-gray-500

✅ CHECKPOINT 2: localhost:3000 shows a clean, premium homepage. White bg, black text, gray accents. No colors, no gradients. Looks like linear.app quality. All sections render properly.

---

## STEP 3: Pricing Page

Create app/pricing/page.tsx. Same navbar as homepage (copy it — we'll extract later).

### Header
- "Simple, transparent pricing" text-4xl font-semibold text-center
- "Start with what you need. Add modules as you grow." text-gray-500 text-center

### Plan Cards (max-w-5xl mx-auto, grid-cols-1 md:grid-cols-3 gap-6 mt-12)

Each card: p-8 rounded-xl border border-gray-200

**Starter — $99/mo**
- "For small businesses getting started"
- Up to 3 modules, 5 users, Email support, Basic reports
- Button: outlined (border border-gray-200 hover:border-black)

**Growth — $249/mo** (highlighted: border-black ring-1 ring-black + "Most popular" badge)
- "For growing businesses that need more"
- Up to 10 modules, 25 users, AI Assistant, WhatsApp, Priority support, Advanced analytics
- Button: bg-black text-white (solid — this is the one we want clicks on)

**Business — $499/mo**
- "For established companies that want everything"
- All 38 modules, 100 users, Priority AI + API, Dedicated support, Custom workflows
- Button: outlined

**Enterprise row below** (full width, bg-gray-50 rounded-xl p-8 mt-6, flex justify-between)
- "Enterprise" + "Dedicated instance, white-label, unlimited users, SLA"
- "Contact sales →" link

### Module Comparison Table (mt-20)

Full HTML table with all 38 modules grouped by category.
- Left column: Module name (bold category headers as separator rows with bg-gray-50)
- 3 plan columns: Starter / Growth / Business
- Checkmark (✓) or dash (—) per cell
- Style: text-sm, border-b border-gray-100, even rows bg-gray-50/50
- Sticky header on scroll

Use the module catalog above to populate — each module shows ✓ for its minimum plan and above, — for plans below.

✅ CHECKPOINT 3: localhost:3000/pricing shows all 3 plan cards + enterprise row + complete module comparison table with all 38 modules. No missing modules, no broken layout.

---

## STEP 4: Modules Catalog Page

Create app/modules/page.tsx.

- Category filter tabs at top: All, Finance, Sales, Operations, People, Projects, Assets, Retail, Support, Productivity, Intelligence, Industry, Communication, Developer
- Tabs: horizontal scroll, text-sm, active tab has border-b-2 border-black font-medium
- Grid below: grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4
- Each module card: bg-white rounded-xl p-6 border border-gray-100 hover:border-gray-200
  - Icon (use Lucide icon matching the module — FileText, Calculator, Users, Package, etc.)
  - Module name: text-base font-semibold mt-3
  - Description: text-sm text-gray-500 mt-1
  - Bottom row: price badge "From $39/mo" + plan badge "Starter" / "Growth" / "Business"
- Category tabs filter the grid (client-side filtering with useState)
- Show ALL 38 modules from the catalog above

✅ CHECKPOINT 4: localhost:3000/modules shows filterable grid of all 38 modules. Clicking category tabs filters correctly. Every module has icon, name, description, price, plan badge.

---

## STEP 5: Login Page

Create app/login/page.tsx.

Split screen, full viewport height:
- Left 55% (bg-black, min-h-screen, flex items-center justify-center):
  - "Westbridge" text-3xl font-semibold text-white
  - "Enterprise intelligence for the Caribbean" text-sm text-gray-500 mt-2
- Right 45% (bg-white, min-h-screen, flex items-center justify-center):
  - Container: max-w-sm w-full px-8
  - "Sign in" text-2xl font-semibold mb-8
  - Email label + input
  - Password label + input (mt-4)
  - "Sign in" button: w-full bg-black text-white py-3 rounded-md text-sm font-medium mt-6
  - "Don't have an account? Start free trial" text-sm text-gray-500 mt-6 text-center
  - "Forgot password?" text-sm text-gray-400 mt-2 text-center

Form is static UI only for now — no submission logic yet.

✅ CHECKPOINT 5: localhost:3000/login shows a premium split-screen login. Left panel is solid black with white text. Right panel has clean form. No ERPNext branding anywhere.

---

## STEP 6: Dashboard Layout

Create app/dashboard/layout.tsx — this wraps ALL /dashboard/* pages.

### Sidebar (fixed left, w-60, bg-white, border-r border-gray-100, h-screen)
- Top: Black "W" square (w-8 h-8 bg-black text-white rounded-md flex items-center justify-center text-sm font-bold) + "Westbridge" text
- Divider: border-t border-gray-100 my-3
- Nav sections with category headers (text-xs text-gray-400 uppercase tracking-wider font-medium mb-2 mt-6):

**OVERVIEW**
- Dashboard → /dashboard

**FINANCE**
- Invoices → /dashboard/invoices
- Accounting → /dashboard/accounting
- Expenses → /dashboard/expenses

**SALES**
- CRM → /dashboard/crm
- Quotations → /dashboard/quotations

**OPERATIONS**
- Inventory → /dashboard/inventory
- Procurement → /dashboard/procurement

**PEOPLE**
- HR → /dashboard/hr
- Payroll → /dashboard/payroll

**REPORTS**
- Analytics → /dashboard/analytics

Each nav item: flex items-center gap-3 px-3 py-2 text-sm text-gray-600 rounded-md hover:bg-gray-50 cursor-pointer transition
Active item (based on current pathname): bg-gray-100 text-black font-medium

Add Lucide icons to each nav item (LayoutDashboard, FileText, Calculator, Receipt, Users, FileBarChart, Package, Truck, UserCog, DollarSign, BarChart3).

- Bottom of sidebar: user section with avatar circle (w-8 h-8 bg-gray-200 rounded-full) + "Admin" text-sm + "Settings" link → /dashboard/settings
- Main content: ml-60 min-h-screen bg-gray-50/30 p-8

Use Next.js `usePathname()` to highlight active sidebar item.
Use Next.js `<Link>` for all navigation.

✅ CHECKPOINT 6: localhost:3000/dashboard shows sidebar on left with all nav items, icons, and active state highlighting. Clicking items navigates between pages. Content area is on the right.

---

## STEP 7: Dashboard Home Page

Create app/dashboard/page.tsx.

- Title: "Dashboard" text-2xl font-semibold + "Welcome back." text-sm text-gray-500

### Metric Cards (grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mt-6)
Each card: bg-white rounded-xl p-6 border border-gray-100
- Label: text-sm text-gray-500
- Value: text-2xl font-semibold mt-1
- Change: text-xs mt-2

Cards:
1. Revenue — GYD 2.45M — +12.4% from last month (text-green-600)
2. Invoices — 24 open — -3 from last month (text-red-600)
3. Inventory — GYD 8.2M — +2.1% from last month (text-green-600)
4. Employees — 47 — +5 from last month (text-green-600)

### Revenue Chart (mt-8, bg-white rounded-xl p-6 border border-gray-100)
- Title: "Revenue" text-base font-semibold + "Last 12 months" text-sm text-gray-400
- Use recharts AreaChart. Black line (#0A0A0A), fill with 5% opacity.
- Data: Mar 1.8M, Apr 2.1M, May 1.9M, Jun 2.3M, Jul 2.5M, Aug 2.2M, Sep 2.8M, Oct 3.1M, Nov 2.9M, Dec 3.4M, Jan 3.0M, Feb 3.2M
- Clean axis labels, no grid lines, minimal style

### Two Columns Below (grid grid-cols-1 lg:grid-cols-3 gap-6 mt-6)

**Recent Activity (col-span-2):** bg-white rounded-xl p-6 border border-gray-100
- "Recent Activity" text-base font-semibold mb-4
- List of 5 items, each with: dot indicator, description text-sm, timestamp text-xs text-gray-400 on right
  1. Invoice INV-008 is overdue — 2 min ago (red dot)
  2. Payment received from Georgetown Hardware Ltd — 1 hr ago (green dot)
  3. New employee Priya Ramdeen added to HR — 3 hrs ago (blue dot)
  4. INV-006 sent to New Amsterdam Builders — Yesterday (gray dot)
  5. Payroll run completed — 47 employees — 2 days ago (green dot)

**Quick Actions:** bg-white rounded-xl p-6 border border-gray-100
- "Quick Actions" text-base font-semibold mb-4
- 4 buttons stacked: "Create Invoice", "Add Customer", "Record Payment", "Run Payroll"
- Each: w-full text-left px-4 py-3 text-sm rounded-lg hover:bg-gray-50 border border-gray-100 transition

✅ CHECKPOINT 7: Dashboard shows 4 metric cards, area chart with real recharts rendering, activity feed with colored dots, and quick action buttons. Everything in white cards on subtle gray background.

---

## STEP 8: Invoice List Page

Create app/dashboard/invoices/page.tsx.

- Top row: "Invoices" text-2xl font-semibold (left) + "Create Invoice" button bg-black text-white text-sm px-4 py-2.5 rounded-md (right)
- Search + filters row (mt-4): search input (w-80) + filter pills: All, Draft, Unpaid, Paid, Overdue
  - Active filter: bg-black text-white text-xs px-3 py-1.5 rounded-full
  - Inactive: bg-gray-100 text-gray-600 text-xs px-3 py-1.5 rounded-full hover:bg-gray-200

### Table (mt-4)
Columns: Invoice #, Customer, Amount (GYD), Status, Date, Due Date

8 rows with Caribbean business data:
| INV-001 | Georgetown Hardware Ltd | 245,000 | Paid | 15 Feb 2026 | 15 Mar 2026 |
| INV-002 | Demerara Shipping Co | 1,200,000 | Overdue | 01 Feb 2026 | 01 Mar 2026 |
| INV-003 | Stabroek Market Foods | 89,000 | Unpaid | 20 Feb 2026 | 20 Mar 2026 |
| INV-004 | BerbiceTech Solutions | 450,000 | Draft | 25 Feb 2026 | — |
| INV-005 | Essequibo Farms Inc | 178,000 | Paid | 10 Feb 2026 | 10 Mar 2026 |
| INV-006 | New Amsterdam Builders | 2,100,000 | Unpaid | 18 Feb 2026 | 18 Mar 2026 |
| INV-007 | Linden Mining Corp | 890,000 | Paid | 05 Feb 2026 | 05 Mar 2026 |
| INV-008 | Bartica Gold Trading | 3,400,000 | Overdue | 28 Jan 2026 | 28 Feb 2026 |

Format amounts with commas: "GYD 1,200,000"
Status badges use the design system colors defined above.

Pagination at bottom: "Showing 1-8 of 24 invoices" (left) + Previous / Next buttons (right)

Filter pills should actually filter the table rows (client-side useState).

✅ CHECKPOINT 8: Invoice list page shows search, filter pills, full data table with proper formatting, status badges, and working filters. Clicking filter pills shows/hides matching rows.

---

## STEP 9: CRM Pipeline Page

Create app/dashboard/crm/page.tsx.

Kanban board layout:
- Top: "CRM Pipeline" text-2xl font-semibold + "Add Deal" button
- Board: flex gap-4 overflow-x-auto, each column min-w-[280px]

4 columns with header showing count + total value:
- **Lead** (4 deals · GYD 2.8M)
- **Qualified** (3 deals · GYD 4.2M)
- **Proposal** (2 deals · GYD 3.1M)
- **Won** (5 deals · GYD 8.9M)

Column style: bg-gray-50 rounded-xl p-3
Card style: bg-white rounded-lg p-4 border border-gray-100 hover:border-gray-200 cursor-pointer

Deal cards — each shows: company name (font-medium), deal value (text-gray-500), contact name (text-xs text-gray-400), avatar initials circle + date

Data:
- Lead: Demerara Distillers GYD 800K, Banks DIH Ltd GYD 1.2M, Guyana Sugar Corp GYD 500K, Berbice Shipping GYD 300K
- Qualified: Stabroek Holdings GYD 2.1M, Ogle Energy GYD 1.5M, Mahaica Farms GYD 600K
- Proposal: E-Networks Inc GYD 1.8M, GT&T Telecom GYD 1.3M
- Won: Republic Bank GY GYD 3.2M, Guyoil GYD 2.1M, GBTI GYD 1.5M, Beharry Group GYD 1.2M, Nand Persaud & Co GYD 900K

✅ CHECKPOINT 9: CRM page shows 4-column kanban board. Each column has cards with deal info. Horizontal scroll works on smaller screens.

---

## STEP 10: Remaining Dashboard Pages

Build all these pages following the same patterns established above. Each page lives in app/dashboard/[name]/page.tsx.

### Accounting (app/dashboard/accounting/page.tsx)
- 3 metric cards: Revenue YTD GYD 18.4M, Expenses YTD GYD 12.1M, Net Profit GYD 6.3M
- Recharts BarChart: monthly revenue (black) vs expenses (gray-300) for Sep-Feb
  - Revenue: 2.8M, 3.1M, 2.9M, 3.4M, 3.0M, 3.2M
  - Expenses: 1.8M, 2.0M, 1.9M, 2.2M, 2.0M, 2.1M
- Accounts Receivable Aging: list with progress bars — Current 1.2M, 1-30 days 800K, 31-60 days 450K, 61-90 days 200K, 90+ days 150K

### Expenses (app/dashboard/expenses/page.tsx)
- Stats: GYD 2.1M this month / 47 pending / 312 total
- Table: Date, Description, Category, Amount, Submitted By, Status
- 6 rows with realistic data and Approved/Pending/Rejected badges

### HR (app/dashboard/hr/page.tsx)
- Stats: 47 Total / 44 Active / 3 On Leave
- Employee table: Name, Department, Position, Status, Joined
- 8 employees with Guyanese names: Priya Ramdeen, Devendra Singh, Shantelle Williams, Rajiv Persaud, Camille Thomas, Akash Doobay, Natasha Charles, Marcus Fernandes

### Payroll (app/dashboard/payroll/page.tsx)
- Alert banner: bg-yellow-50 border-yellow-200 "February payroll due in 3 days"
- Stats: GYD 4.8M monthly / 47 employees / Next run: Mar 1
- Table: Employee, Base Salary, NIS (14%), Income Tax, Net Pay, Status
- 6 rows with GYD amounts

### Inventory (app/dashboard/inventory/page.tsx)
- Stats: 1,247 Items / 23 Low Stock (yellow) / 8 Out of Stock (red)
- Table: Item Code, Name, Category, In Stock, Reorder Level, Value, Status
- 8 Caribbean-relevant items: Portland Cement, Demerara Gold Rum, Galvanize Sheets, Basmati Rice, Car Battery, Printer Paper, Safety Helmets, Diesel Fuel

### Quotations (app/dashboard/quotations/page.tsx)
- Table: Quote #, Customer, Amount, Valid Until, Status
- 6 rows with Sent (blue badge), Accepted (green), Expired (gray), Draft (gray) statuses

### Procurement (app/dashboard/procurement/page.tsx)
- Table: PO #, Supplier, Amount, Order Date, Expected Delivery, Status
- 6 rows with Guyanese suppliers

### Analytics (app/dashboard/analytics/page.tsx)
- 4 small metric cards: Revenue GYD 3.2M, Expenses GYD 2.1M, Profit Margin 34.4%, Outstanding GYD 1.8M
- Large recharts AreaChart: 12-month revenue trend (black line, subtle fill)
- Two columns below:
  - Top Customers by Revenue (ranked list of 5)
  - Revenue by Category (horizontal bar chart)

### Settings (app/dashboard/settings/page.tsx)
- Left: vertical tab list — General, Billing, Team, Modules, API, Notifications
- Right: form for selected tab (default: General)
  - Company name input (pre-filled "Georgetown Hardware Ltd")
  - Country select (Guyana)
  - Currency (GYD)
  - Timezone (America/Guyana)
  - "Save changes" button
- Static UI, no functionality yet

✅ CHECKPOINT 10: Every sidebar link leads to a real page with data. Navigate through ALL pages and confirm: no broken links, no empty pages, no missing data, consistent styling across all pages.

---

## STEP 11: Extract Shared Components

Now that all pages work, extract repeated patterns into reusable components:

Create components/ directory with:
- components/Navbar.tsx — the marketing page navbar (used on /, /pricing, /modules, /about)
- components/Sidebar.tsx — dashboard sidebar (used in dashboard/layout.tsx)
- components/DataTable.tsx — reusable table component with search, filters, pagination
- components/MetricCard.tsx — the stat card used on dashboard and other pages
- components/StatusBadge.tsx — status badges (Paid, Overdue, Active, etc.)
- components/PageHeader.tsx — "Page Title" + action button pattern

Replace all the duplicated code in each page with these components.

✅ CHECKPOINT 11: All pages still work exactly the same after refactoring. No visual changes, just cleaner code.

---

## STEP 12: Signup / Onboarding Flow

Create app/signup/page.tsx — a multi-step onboarding wizard.

### Step 1: "Tell us about your business"
- Company name input
- Industry dropdown: Construction, Retail, Services, Manufacturing, Agriculture, Mining, Logistics, Technology, Other
- Country: default Guyana, dropdown with Caribbean countries
- "Continue" button

### Step 2: "What does your business need?"
- Module picker grid — show all 38 modules as small selectable cards
- Click to toggle selection (selected = border-black bg-gray-50, unselected = border-gray-200)
- Running total at bottom: "4 modules selected — Growth plan: $249/mo"
- Smart suggestions based on industry selected in step 1

### Step 3: "Choose your plan"
- Same plan cards as pricing page but with selected modules checked
- Recommended plan highlighted based on module count
- Annual/monthly toggle

### Step 4: "Create your account"
- Name, email, password inputs
- "Start 14-day free trial" button
- "No credit card required" text

Progress bar at top: 4 dots/steps, current step highlighted.
Navigation: Back / Continue buttons.
All steps managed with useState in one page component.

✅ CHECKPOINT 12: localhost:3000/signup shows 4-step onboarding. Can navigate forward and back. Module picker works. Plan recommendation updates based on selections.

---

## STEP 13: About Page

Create app/about/page.tsx with the marketing navbar.

- Hero: "Built in Georgetown, for the Caribbean" text-4xl font-semibold
- Story section: brief text about Westbridge being built to give Caribbean businesses the same enterprise tools Fortune 500s use
- Values: 3 cards — "Caribbean First" / "AI Native" / "Simple Pricing"
- CTA: "Ready to get started?" with trial button

✅ CHECKPOINT 13: localhost:3000/about renders cleanly with consistent styling.

---

## STEP 14: Connect Navigation

Wire up all cross-page navigation:
- Navbar "Pricing" → /pricing
- Navbar "Modules" → /modules  
- Navbar "About" → /about
- Navbar "Sign in" → /login
- Navbar "Get started" → /signup
- Homepage "Start free trial" → /signup
- Homepage "See pricing" → /pricing
- Pricing "Start free trial" buttons → /signup
- Dashboard sidebar links → all working (already done)
- Login "Start free trial" link → /signup
- Footer links → all connected

✅ CHECKPOINT 14: Click through every link on every page. Zero broken links. Every navigation path works.

---

## STEP 15: Polish & Responsive

- Test every page at mobile (375px), tablet (768px), desktop (1280px)
- Sidebar collapses to hidden on mobile with a hamburger menu toggle
- Marketing pages stack properly on mobile
- Tables scroll horizontally on mobile
- Pricing cards stack vertically on mobile
- CRM kanban scrolls horizontally on mobile
- All text is readable at every breakpoint
- Add smooth page transitions with framer-motion (subtle fade, 150ms)

✅ CHECKPOINT 15: Site looks premium at every screen size. No horizontal overflow, no overlapping elements, no text cutoff.

---

## STEP 16: Backend — Docker + ERPNext

Create docker-compose.yml in project root:

```yaml
version: '3.8'
services:
  mariadb:
    image: mariadb:10.11
    restart: always
    environment:
      MYSQL_ROOT_PASSWORD: westbridge_dev_123
      MYSQL_DATABASE: frappe
    volumes:
      - mariadb-data:/var/lib/mysql
    ports:
      - "3307:3306"

  redis:
    image: redis:6.2-alpine
    restart: always
    ports:
      - "6380:6379"

  erpnext:
    image: frappe/erpnext:v16
    restart: always
    volumes:
      - erpnext-sites:/home/frappe/frappe-bench/sites
    environment:
      - FRAPPE_REDIS_CACHE=redis://redis:6379/0
      - FRAPPE_REDIS_QUEUE=redis://redis:6379/1
      - FRAPPE_REDIS_SOCKETIO=redis://redis:6379/2
    depends_on:
      - mariadb
      - redis
    ports:
      - "8080:8080"

  erpnext-worker:
    image: frappe/erpnext:v16
    restart: always
    command: bench worker --queue long,default,short
    volumes:
      - erpnext-sites:/home/frappe/frappe-bench/sites
    depends_on:
      - mariadb
      - redis

volumes:
  mariadb-data:
  erpnext-sites:
```

✅ CHECKPOINT 16: `docker compose up -d` starts all services. `docker compose ps` shows all containers running. ERPNext responds at localhost:8080 (may take 2-3 minutes to initialize).

---

## STEP 17: Backend — API Client

Create lib/erpnext.ts:

```typescript
const ERPNEXT_URL = process.env.ERPNEXT_URL || 'http://localhost:8080';

export async function erpnextFetch(endpoint: string, sessionId?: string, options?: RequestInit) {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };
  
  if (sessionId) {
    headers['Cookie'] = `sid=${sessionId}`;
  }

  try {
    const res = await fetch(`${ERPNEXT_URL}/api${endpoint}`, {
      ...options,
      headers: { ...headers, ...options?.headers },
      cache: 'no-store',
    });

    if (!res.ok) return null;
    return res.json();
  } catch (error) {
    console.error('ERPNext API error:', error);
    return null;
  }
}

export async function getList(doctype: string, sessionId: string, params?: Record<string, string>) {
  const query = new URLSearchParams({
    limit_page_length: '20',
    order_by: 'creation desc',
    ...params,
  }).toString();
  const data = await erpnextFetch(`/resource/${doctype}?${query}`, sessionId);
  return data?.data || [];
}

export async function getDoc(doctype: string, name: string, sessionId: string) {
  const data = await erpnextFetch(`/resource/${doctype}/${name}`, sessionId);
  return data?.data || null;
}

export async function createDoc(doctype: string, body: Record<string, any>, sessionId: string) {
  return erpnextFetch(`/resource/${doctype}`, sessionId, {
    method: 'POST',
    body: JSON.stringify(body),
  });
}
```

Create lib/auth.ts:

```typescript
export async function loginToERPNext(email: string, password: string): Promise<string> {
  const res = await fetch(`${process.env.ERPNEXT_URL}/api/method/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ usr: email, pwd: password }),
  });
  
  if (!res.ok) throw new Error('Invalid credentials');
  
  const cookies = res.headers.getSetCookie();
  const sid = cookies.find(c => c.startsWith('sid='));
  if (!sid) throw new Error('No session returned');
  
  return sid.split('=')[1].split(';')[0];
}
```

✅ CHECKPOINT 17: lib/erpnext.ts and lib/auth.ts exist and compile without TypeScript errors.

---

## STEP 18: Backend — Auth Routes

Create app/api/auth/login/route.ts:
- POST handler: takes { email, password }, calls loginToERPNext
- On success: sets httpOnly cookie 'westbridge_sid', returns { success: true }
- On error: returns 401 with error message

Create app/api/auth/logout/route.ts:
- POST handler: deletes 'westbridge_sid' cookie, returns { success: true }

Create middleware.ts (project root):
- If path starts with /dashboard and no westbridge_sid cookie → redirect to /login
- If path is /login and has westbridge_sid cookie → redirect to /dashboard

Update the login page form to actually call /api/auth/login on submit:
- Show loading state on button while submitting
- Show inline error message below form on failure
- Redirect to /dashboard on success using router.push

✅ CHECKPOINT 18: Login form submits to API. Without ERPNext running, shows "Invalid credentials" error inline (not an alert box). With ERPNext running, successful login redirects to dashboard.

---

## STEP 19: Backend — Proxy to ERPNext

Add to next.config.ts:

```typescript
async rewrites() {
  return [
    {
      source: '/api/v1/:path*',
      destination: `${process.env.ERPNEXT_URL || 'http://localhost:8080'}/api/:path*`,
    },
  ];
}
```

Create .env.local:
```
ERPNEXT_URL=http://localhost:8080
NEXTAUTH_SECRET=change-this-to-a-random-64-char-string
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

✅ CHECKPOINT 19: With ERPNext running via docker compose, visiting localhost:3000/api/v1/method/ping returns a response from ERPNext.

---

## STEP 20: Production Dockerfile

Create Dockerfile in project root:

```dockerfile
FROM node:20-alpine AS deps
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci

FROM node:20-alpine AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN npm run build

FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static
COPY --from=builder /app/public ./public
EXPOSE 3000
CMD ["node", "server.js"]
```

Add to next.config.ts: `output: 'standalone'`

Create render.yaml for Render deployment:
```yaml
services:
  - type: web
    name: westbridge-app
    runtime: docker
    plan: starter
    envVars:
      - key: ERPNEXT_URL
        sync: false
      - key: NEXTAUTH_SECRET
        generateValue: true
    domains:
      - app.westbridge.gy
```

✅ CHECKPOINT 20: `docker build -t westbridge-app .` succeeds. Image runs with `docker run -p 3000:3000 westbridge-app`. Site loads at localhost:3000.

---

## FINAL VERIFICATION

Go through every page one more time:

1. localhost:3000 — Homepage (clean, premium, all sections)
2. localhost:3000/pricing — Pricing cards + full module table
3. localhost:3000/modules — Filterable module grid (all 38)
4. localhost:3000/about — About page
5. localhost:3000/login — Split-screen login
6. localhost:3000/signup — 4-step onboarding
7. localhost:3000/dashboard — Metric cards + chart + activity
8. localhost:3000/dashboard/invoices — Table with filters
9. localhost:3000/dashboard/crm — Kanban board
10. localhost:3000/dashboard/accounting — P&L chart + aging
11. localhost:3000/dashboard/expenses — Expense table
12. localhost:3000/dashboard/hr — Employee directory
13. localhost:3000/dashboard/payroll — Payroll table + NIS
14. localhost:3000/dashboard/inventory — Stock table
15. localhost:3000/dashboard/quotations — Quote table
16. localhost:3000/dashboard/procurement — PO table
17. localhost:3000/dashboard/analytics — Charts + rankings
18. localhost:3000/dashboard/settings — Settings form

Every page should:
- Load without errors
- Have consistent styling
- Use the Westbridge design system
- Show realistic Caribbean business data
- Work on mobile, tablet, and desktop
- Have zero ERPNext/Frappe branding visible

This is not a demo. This is the product.
