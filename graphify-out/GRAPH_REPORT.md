# Graph Report - .  (2026-09-18)

## Corpus Check
- 218 files · ~75,853 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 1200 nodes · 2019 edges · 169 communities (96 shown, 73 thin omitted)
- Extraction: 94% EXTRACTED · 6% INFERRED · 0% AMBIGUOUS · INFERRED: 118 edges (avg confidence: 0.8)
- Token cost: 0 input · 0 output

## Community Hubs (Navigation)
- shadcn Card Component
- Composer Package Config
- shadcn Alert Dialog Component
- Lubricant Purchase & Tax Invoice Deletion
- Cash Sale PDF Controller
- shadcn Sidebar Component
- NPM/Composer Build Scripts
- Daily Invoice Form Controller
- Backend Controllers Index
- Inertia App Bootstrap
- shadcn Breadcrumb Component
- Database Seeders
- Registration Feature Test
- Date Picker & Chart Hooks
- shadcn Toast Component
- shadcn Accordion & Hover Card
- Invoice Summary & Tax Invoice Export
- Cash Sale Page (Frontend)
- User Creation & Password Reset Actions
- TypeScript Compiler Config
- shadcn Toggle Group Component
- Admin User Controller
- Auth & Appearance Middleware
- DataGrid & Invoice History Table
- Client & Vehicle Management Controller
- shadcn Components Manifest
- Auth Card & Layout
- Radix UI Dependencies
- shadcn Carousel Component
- shadcn Menubar Component
- Lint & Format Tooling
- Purchase Summary Controller
- Manage Invoice Controller
- Monthly Sale Controller
- Supplier Controller
- Tax Invoice History Controller
- shadcn Chart Component
- shadcn Command Palette
- shadcn Context Menu Component
- Email & Password Confirmation Tests
- shadcn Sheet Component
- Vite Build Scripts
- shadcn Drawer Component
- shadcn Navigation Menu Component
- Authentication Feature Test
- Profile Update Feature Test
- User Factory
- Password Reset Feature Test
- Two-Factor Auth Feature Test
- Password Update Feature Test
- Cache Warming Command
- shadcn Alert Component
- shadcn Input OTP Component
- Frontend Package Manifest
- shadcn Avatar Component
- shadcn Badge Component
- Fuel Type Badge Component
- shadcn Tabs Component
- Tailwind Animate Plugin
- clsx Dependency
- cmdk Dependency
- date-fns Dependency
- Embla Carousel Dependency
- ESLint Prettier Config Dependency
- ESLint JS Dependency
- ESLint React Plugin
- ESLint React Hooks Plugin
- Globals Dependency
- React Hook Form Resolvers
- Inertia React Dependency
- Input OTP Dependency
- Laravel Vite Plugin
- Laravel Wayfinder Plugin
- Lucide Icons Dependency
- Radix Accordion Dependency
- Radix Alert Dialog Dependency
- Radix Avatar Dependency
- Radix Checkbox Dependency
- Radix Collapsible Dependency
- Radix Dialog Dependency
- Radix Dropdown Menu Dependency
- Radix Hover Card Dependency
- Radix Menubar Dependency
- Radix Popover Dependency
- Radix Progress Dependency
- Radix Radio Group Dependency
- Radix Scroll Area Dependency
- Radix Separator Dependency
- Radix Slider Dependency
- Radix Slot Dependency
- Radix Switch Dependency
- Radix Tabs Dependency
- Radix Toast Dependency
- Radix Toggle Dependency
- Radix Toggle Group Dependency
- Radix Tooltip Dependency
- React Day Picker Dependency
- React DOM Dependency
- React Hook Form Dependency
- React Resizable Panels
- Recharts Dependency
- Sonner Toast Dependency
- Tailwind Merge Dependency
- TanStack Query Dependency
- Vaul Drawer Dependency
- Ziggy Routing Dependency
- Zod Validation Dependency
- PostCSS Dependency
- Prettier Organize Imports Plugin
- Prettier Tailwind Plugin
- Node Types Dependency
- React Types Dependency
- TypeScript Dependency
- TypeScript ESLint Dependency
- Vite Dependency
- Vite React Plugin
- Deps Package Manifest
- Apple Touch Icon Asset
- Favicon Asset
- App Logo Asset
- Robots.txt Crawler Policy

## God Nodes (most connected - your core abstractions)
1. `cn()` - 85 edges
2. `User` - 49 edges
3. `useToast()` - 40 edges
4. `TestCase` - 26 edges
5. `Controller` - 23 edges
6. `InvoiceDaily` - 17 edges
7. `LubricantType` - 17 edges
8. `Vat` - 16 edges
9. `compilerOptions` - 16 edges
10. `Client` - 15 edges

## Surprising Connections (you probably didn't know these)
- `useFormField()` --references--> `react`  [EXTRACTED]
  resources/js/components/ui/form.tsx → package.json
- `LoginForm()` --references--> `react`  [EXTRACTED]
  resources/js/components/auth/LoginForm.tsx → package.json
- `useCarousel()` --references--> `react`  [EXTRACTED]
  resources/js/components/ui/carousel.tsx → package.json
- `useChart()` --references--> `react`  [EXTRACTED]
  resources/js/components/ui/chart.tsx → package.json
- `DataGrid()` --references--> `react`  [EXTRACTED]
  resources/js/components/ui/DataGrid.tsx → package.json

## Import Cycles
- None detected.

## Communities (169 total, 73 thin omitted)

### Community 0 - "shadcn Card Component"
Cohesion: 0.06
Nodes (43): Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle, FormControl, FormDescription (+35 more)

### Community 1 - "Composer Package Config"
Cohesion: 0.04
Nodes (45): pestphp/pest-plugin, php-http/discovery, autoload, autoload-dev, psr-4, psr-4, config, allow-plugins (+37 more)

### Community 2 - "shadcn Alert Dialog Component"
Cohesion: 0.10
Nodes (35): AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter(), AlertDialogHeader(), AlertDialogOverlay, AlertDialogTitle (+27 more)

### Community 3 - "Lubricant Purchase & Tax Invoice Deletion"
Cohesion: 0.09
Nodes (10): DeletedTaxInvoice, LubricantPriceHistory, LubricantPurchase, LubricantPurchaseItem, Purchase, Settings, TaxInvoiceInvoiceNo, Illuminate\Database\Eloquent\Model (+2 more)

### Community 4 - "Cash Sale PDF Controller"
Cohesion: 0.09
Nodes (13): CashSaleController, Controller, PasswordController, ProfileController, TwoFactorAuthenticationController, ProfileUpdateRequest, TwoFactorAuthenticationRequest, Illuminate\Foundation\Http\FormRequest (+5 more)

### Community 5 - "shadcn Sidebar Component"
Cohesion: 0.07
Nodes (30): Separator, Sidebar, SidebarContent, SidebarContext, SidebarFooter, SidebarGroup, SidebarGroupAction, SidebarGroupContent (+22 more)

### Community 6 - "NPM/Composer Build Scripts"
Cohesion: 0.07
Nodes (30): scripts, dev, dev:ssr, post-autoload-dump, post-create-project-cmd, post-root-package-install, post-update-cmd, pre-package-uninstall (+22 more)

### Community 7 - "Daily Invoice Form Controller"
Cohesion: 0.12
Nodes (7): DailyInvoiceController, LubricantController, SettingsController, FuelType, LubricantType, Vat, Vehicle

### Community 8 - "Backend Controllers Index"
Cohesion: 0.20
Nodes (3): Carbon\Carbon, Illuminate\Database\Eloquent\Factories\HasFactory, Symfony\Component\HttpFoundation\StreamedResponse

### Community 9 - "Inertia App Bootstrap"
Cohesion: 0.09
Nodes (21): pages, queryClient, Layout(), LayoutProps, navItems, Sidebar(), InertiaLinkProps, NavLink (+13 more)

### Community 10 - "shadcn Breadcrumb Component"
Cohesion: 0.12
Nodes (22): Breadcrumb, BreadcrumbEllipsis(), BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbPage, BreadcrumbSeparator(), ButtonProps (+14 more)

### Community 11 - "Database Seeders"
Cohesion: 0.10
Nodes (9): DatabaseSeeder, FuelCategorySeeder, FuelPriceHistorySeeder, FuelTypeSeeder, PaymentMethodsSeeder, SettingsSeeder, UserSeeder, VatSeeder (+1 more)

### Community 12 - "Registration Feature Test"
Cohesion: 0.12
Nodes (8): Illuminate\Foundation\Testing\RefreshDatabase, Illuminate\Foundation\Testing\TestCase, RegistrationTest, TwoFactorChallengeTest, VerificationNotificationTest, DashboardTest, TestCase, ExampleTest

### Community 13 - "Date Picker & Chart Hooks"
Cohesion: 0.10
Nodes (20): react, react, useCarousel(), useChart(), DatePickerField(), DatePickerFieldProps, PopoverContent, Option (+12 more)

### Community 14 - "shadcn Toast Component"
Cohesion: 0.13
Nodes (21): Toast, ToastAction, ToastActionElement, ToastClose, ToastDescription, ToastProps, ToastTitle, toastVariants (+13 more)

### Community 15 - "shadcn Accordion & Hover Card"
Cohesion: 0.08
Nodes (14): AccordionContent, AccordionItem, AccordionTrigger, HoverCardContent, PasswordInput, PasswordInputProps, Progress, RadioGroup (+6 more)

### Community 16 - "Invoice Summary & Tax Invoice Export"
Cohesion: 0.15
Nodes (7): InvoiceSummaryController, TaxInvoiceController, Client, PaymentMethod, TaxInvoice, Carbon, Illuminate\Database\Eloquent\Relations\BelongsToMany

### Community 17 - "Cash Sale Page (Frontend)"
Cohesion: 0.11
Nodes (18): SearchableSelect, useToast(), CashSale(), CashSaleProps, months, RecentEntry, years, Invoice (+10 more)

### Community 18 - "User Creation & Password Reset Actions"
Cohesion: 0.13
Nodes (8): CreateNewUser, ResetUserPassword, AppServiceProvider, FortifyServiceProvider, Illuminate\Support\ServiceProvider, Laravel\Fortify\Contracts\CreatesNewUsers, Laravel\Fortify\Contracts\ResetsUserPasswords, PasswordValidationRules

### Community 19 - "TypeScript Compiler Config"
Cohesion: 0.10
Nodes (20): resources/js/**/*.d.ts, resources/js/**/*.ts, resources/js/**/*.tsx, compilerOptions, allowJs, baseUrl, esModuleInterop, forceConsistentCasingInFileNames (+12 more)

### Community 20 - "shadcn Toggle Group Component"
Cohesion: 0.12
Nodes (17): ToggleGroup, ToggleGroupContext, ToggleGroupItem, Toggle, toggleVariants, Client, FuelTypeOption, Index() (+9 more)

### Community 21 - "Admin User Controller"
Cohesion: 0.15
Nodes (4): UserController, User, Illuminate\Foundation\Auth\User, EmailVerificationTest

### Community 22 - "Auth & Appearance Middleware"
Cohesion: 0.16
Nodes (8): EnsureUserIsAdmin, HandleAppearance, HandleInertiaRequests, SetCacheHeaders, Closure, Illuminate\Foundation\Configuration\Middleware, Inertia\Middleware, Symfony\Component\HttpFoundation\Response

### Community 23 - "DataGrid & Invoice History Table"
Cohesion: 0.12
Nodes (15): Column, DataGrid(), DataGridProps, Client, DeletedRecord, HistoryRecord, InvoiceHistory(), InvoiceHistoryProps (+7 more)

### Community 24 - "Client & Vehicle Management Controller"
Cohesion: 0.15
Nodes (4): ClientDetailsController, PurchaseController, VatBalanceController, Illuminate\Http\Request

### Community 25 - "shadcn Components Manifest"
Cohesion: 0.11
Nodes (17): aliases, components, hooks, lib, ui, utils, iconLibrary, rsc (+9 more)

### Community 26 - "Auth Card & Layout"
Cohesion: 0.19
Nodes (8): AuthCard(), AuthCardProps, AuthLayout(), AuthLayoutProps, FormData, LoginForm(), Button, Checkbox

### Community 27 - "Radix UI Dependencies"
Cohesion: 0.15
Nodes (13): clsx, dependencies, clsx, @radix-ui/react-aspect-ratio, @radix-ui/react-context-menu, @radix-ui/react-label, @radix-ui/react-navigation-menu, @radix-ui/react-select (+5 more)

### Community 28 - "shadcn Carousel Component"
Cohesion: 0.15
Nodes (12): Carousel, CarouselApi, CarouselContent, CarouselContext, CarouselContextProps, CarouselItem, CarouselNext, CarouselOptions (+4 more)

### Community 29 - "shadcn Menubar Component"
Cohesion: 0.17
Nodes (11): Menubar, MenubarCheckboxItem, MenubarContent, MenubarItem, MenubarLabel, MenubarRadioItem, MenubarSeparator, MenubarShortcut() (+3 more)

### Community 30 - "Lint & Format Tooling"
Cohesion: 0.18
Nodes (11): eslint, @eslint/js, devDependencies, eslint, @eslint/js, prettier, tailwindcss, @types/react-dom (+3 more)

### Community 34 - "Supplier Controller"
Cohesion: 0.33
Nodes (3): SupplierController, Supplier, Illuminate\Database\Eloquent\SoftDeletes

### Community 36 - "shadcn Chart Component"
Cohesion: 0.20
Nodes (7): ChartConfig, ChartContainer, ChartContext, ChartContextProps, ChartLegendContent, ChartTooltipContent, THEMES

### Community 37 - "shadcn Command Palette"
Cohesion: 0.20
Nodes (8): Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList, CommandSeparator, CommandShortcut()

### Community 38 - "shadcn Context Menu Component"
Cohesion: 0.20
Nodes (9): ContextMenuCheckboxItem, ContextMenuContent, ContextMenuItem, ContextMenuLabel, ContextMenuRadioItem, ContextMenuSeparator, ContextMenuShortcut(), ContextMenuSubContent (+1 more)

### Community 40 - "shadcn Sheet Component"
Cohesion: 0.22
Nodes (8): SheetContent, SheetContentProps, SheetDescription, SheetFooter(), SheetHeader(), SheetOverlay, SheetTitle, sheetVariants

### Community 41 - "Vite Build Scripts"
Cohesion: 0.25
Nodes (8): scripts, build, build:client, build:ssr, dev, format, lint, preview

### Community 42 - "shadcn Drawer Component"
Cohesion: 0.25
Nodes (6): DrawerContent, DrawerDescription, DrawerFooter(), DrawerHeader(), DrawerOverlay, DrawerTitle

### Community 43 - "shadcn Navigation Menu Component"
Cohesion: 0.25
Nodes (7): NavigationMenu, NavigationMenuContent, NavigationMenuIndicator, NavigationMenuList, NavigationMenuTrigger, navigationMenuTriggerStyle, NavigationMenuViewport

### Community 46 - "User Factory"
Cohesion: 0.43
Nodes (3): UserFactory, Illuminate\Database\Eloquent\Factories\Factory, static

### Community 51 - "shadcn Alert Component"
Cohesion: 0.40
Nodes (4): Alert, AlertDescription, AlertTitle, alertVariants

### Community 52 - "shadcn Input OTP Component"
Cohesion: 0.40
Nodes (4): InputOTP, InputOTPGroup, InputOTPSeparator, InputOTPSlot

### Community 53 - "Frontend Package Manifest"
Cohesion: 0.50
Nodes (3): name, private, type

### Community 54 - "shadcn Avatar Component"
Cohesion: 0.50
Nodes (3): Avatar, AvatarFallback, AvatarImage

### Community 55 - "shadcn Badge Component"
Cohesion: 0.67
Nodes (3): Badge(), BadgeProps, badgeVariants

### Community 56 - "Fuel Type Badge Component"
Cohesion: 0.67
Nodes (3): FuelBadge(), FuelBadgeProps, styleFor()

### Community 57 - "shadcn Tabs Component"
Cohesion: 0.50
Nodes (3): TabsContent, TabsList, TabsTrigger

### Community 79 - "Tailwind Animate Plugin"
Cohesion: 0.67
Nodes (3): tailwindcss-animate, tailwindcss-animate, tailwindcss-animate

## Knowledge Gaps
- **406 isolated node(s):** `type`, `$schema`, `style`, `rsc`, `tsx` (+401 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **73 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `dependencies` connect `Radix UI Dependencies` to `Ziggy Routing Dependency`, `Zod Validation Dependency`, `Date Picker & Chart Hooks`, `Frontend Package Manifest`, `Tailwind Animate Plugin`, `cmdk Dependency`, `date-fns Dependency`, `Embla Carousel Dependency`, `ESLint Prettier Config Dependency`, `React Hook Form Resolvers`, `Inertia React Dependency`, `Input OTP Dependency`, `Lucide Icons Dependency`, `Radix Accordion Dependency`, `Radix Alert Dialog Dependency`, `Radix Avatar Dependency`, `Radix Checkbox Dependency`, `Radix Collapsible Dependency`, `Radix Dialog Dependency`, `Radix Dropdown Menu Dependency`, `Radix Hover Card Dependency`, `Radix Menubar Dependency`, `Radix Popover Dependency`, `Radix Progress Dependency`, `Radix Radio Group Dependency`, `Radix Scroll Area Dependency`, `Radix Separator Dependency`, `Radix Slider Dependency`, `Radix Slot Dependency`, `Radix Switch Dependency`, `Radix Tabs Dependency`, `Radix Toast Dependency`, `Radix Toggle Dependency`, `Radix Toggle Group Dependency`, `Radix Tooltip Dependency`, `React Day Picker Dependency`, `React DOM Dependency`, `React Hook Form Dependency`, `React Resizable Panels`, `Recharts Dependency`, `Sonner Toast Dependency`, `Tailwind Merge Dependency`, `TanStack Query Dependency`, `Vaul Drawer Dependency`?**
  _High betweenness centrality (0.116) - this node is a cross-community bridge._
- **Why does `react` connect `Date Picker & Chart Hooks` to `shadcn Card Component`, `shadcn Sidebar Component`, `Cash Sale Page (Frontend)`, `DataGrid & Invoice History Table`, `Auth Card & Layout`, `Radix UI Dependencies`?**
  _High betweenness centrality (0.100) - this node is a cross-community bridge._
- **Why does `cn()` connect `shadcn Breadcrumb Component` to `shadcn Card Component`, `shadcn Alert Dialog Component`, `shadcn Sidebar Component`, `Inertia App Bootstrap`, `Date Picker & Chart Hooks`, `shadcn Toast Component`, `shadcn Accordion & Hover Card`, `shadcn Toggle Group Component`, `DataGrid & Invoice History Table`, `Auth Card & Layout`, `shadcn Carousel Component`, `shadcn Menubar Component`, `shadcn Chart Component`, `shadcn Command Palette`, `shadcn Context Menu Component`, `shadcn Sheet Component`, `shadcn Drawer Component`, `shadcn Navigation Menu Component`, `shadcn Alert Component`, `shadcn Input OTP Component`, `shadcn Avatar Component`, `shadcn Badge Component`, `Fuel Type Badge Component`, `shadcn Tabs Component`?**
  _High betweenness centrality (0.091) - this node is a cross-community bridge._
- **Are the 31 inferred relationships involving `User` (e.g. with `.run()` and `.test_users_can_authenticate_using_the_login_screen()`) actually correct?**
  _`User` has 31 INFERRED edges - model-reasoned connections that need verification._
- **What connects `type`, `$schema`, `style` to the rest of the system?**
  _406 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `shadcn Card Component` be split into smaller, more focused modules?**
  _Cohesion score 0.06313497822931785 - nodes in this community are weakly interconnected._
- **Should `Composer Package Config` be split into smaller, more focused modules?**
  _Cohesion score 0.043478260869565216 - nodes in this community are weakly interconnected._