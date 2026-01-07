# Epic 5 Gap Analysis: Council Generator vs Real LocalGov Sites

**Date**: 2026-01-02
**Benchmark Site**: Brighton & Hove City Council (https://www.brighton-hove.gov.uk/)
**Generated Site**: Ashworth Borough Council (deployed to pool-006)

## Executive Summary

The council generator successfully creates content nodes (42 pages, 27 images) but **fails to make content discoverable**. The generated site lacks:
- Navigation menus
- Homepage views showing service categories
- News/latest updates sections
- Quick action tiles
- Footer links
- Any mechanism for visitors to find content

**Verdict**: Epic 5 stories are **PARTIAL** - content generation works, but site configuration is missing.

---

## Benchmark Analysis: Brighton & Hove City Council

### Header/Navigation
| Component | Brighton & Hove | Ashworth Borough | Gap |
|-----------|-----------------|------------------|-----|
| Logo with council name | ✅ | ✅ | - |
| Main navigation menu | ✅ Services, Your council, News, Form finder, MyAccount | ❌ Empty | **CRITICAL** |
| Search box | ✅ Prominent | ✅ Present | - |

### Hero Section
| Component | Brighton & Hove | Ashworth Borough | Gap |
|-----------|-----------------|------------------|-----|
| Hero banner | ✅ "How can we help?" | ❌ Missing | **CRITICAL** |
| Alert banner | ✅ System alerts | ❌ Missing | MEDIUM |

### Quick Actions (8 tiles)
| Component | Brighton & Hove | Ashworth Borough | Gap |
|-----------|-----------------|------------------|-----|
| Quick action tiles with icons | ✅ 8 tiles | ❌ None | **CRITICAL** |
| Linked to service pages | ✅ | ❌ | **CRITICAL** |

Examples from Brighton & Hove:
1. Report a problem
2. Rubbish and recycling
3. Council Tax
4. Parking
5. Planning
6. Apply for it
7. Find it
8. Pay for it

### Service Directory (15+ categories)
| Component | Brighton & Hove | Ashworth Borough | Gap |
|-----------|-----------------|------------------|-----|
| Service categories | ✅ 15+ | ❌ None visible | **CRITICAL** |
| 3-5 sub-links per category | ✅ | ❌ | **CRITICAL** |
| Grid layout | ✅ 3-column | ❌ | **CRITICAL** |

Categories from Brighton & Hove:
- Libraries, leisure and arts
- Housing
- Children and learning
- Benefits and financial advice
- Adult Social Care
- Environment
- Births, deaths, marriages
- Health and wellbeing
- Crematorium and cemeteries
- People and communities
- Your council
- Easy read information
- Business

### News Section
| Component | Brighton & Hove | Ashworth Borough | Gap |
|-----------|-----------------|------------------|-----|
| "Newsroom" heading | ✅ | ❌ | **CRITICAL** |
| 3 news cards with images | ✅ | ❌ | **CRITICAL** |
| "Visit the Newsroom" link | ✅ | ❌ | **CRITICAL** |

### Engagement Section
| Component | Brighton & Hove | Ashworth Borough | Gap |
|-----------|-----------------|------------------|-----|
| Newsletter signup | ✅ | ❌ | MEDIUM |
| Contact your councillor | ✅ | ❌ | MEDIUM |

### Footer
| Component | Brighton & Hove | Ashworth Borough | Gap |
|-----------|-----------------|------------------|-----|
| About this website | ✅ | ❌ | LOW |
| Accessibility statement | ✅ | ❌ | LOW |
| Contact Us | ✅ | ❌ | LOW |
| Social media icons | ✅ | ❌ | LOW |
| Copyright | ✅ | ❌ | LOW |

---

## What the Generator Currently Does

Based on CloudWatch logs from 2025-12-30 deployment:

### Content Created ✅
- 42 content nodes total
- Service pages (localgov_services_page)
- Guide pages (localgov_guides_page)
- News articles
- Contact pages
- 27 AI-generated images via Nova Canvas

### What's Missing ❌

1. **Menu Configuration**
   - Main navigation menu not populated
   - Service landing pages not linked
   - News section not accessible from nav

2. **Homepage Views**
   - No "Latest news" view block
   - No "Service categories" view block
   - No "Quick actions" block

3. **Block Placement**
   - Homepage region blocks not configured
   - Service directory block missing
   - Footer blocks missing

4. **Taxonomy/Categories**
   - Service categories taxonomy not fully utilized
   - No view displaying taxonomy terms with child pages

5. **LocalGov Drupal Features**
   - Service landing pages not configured
   - Guide overview pages not set up
   - News listing page not linked

---

## Required Generator Additions

### Phase 1: Navigation (CRITICAL)
```
1. Create/update main navigation menu
   - Services (link to service landing)
   - News (link to news listing)
   - Contact (link to contact page)
   - About (link to about page)

2. Populate service landing menu items
   - Link each service category
```

### Phase 2: Homepage Views (CRITICAL)
```
1. Create or configure "Latest News" view
   - Block display for homepage
   - 3 most recent news articles
   - Card layout with images

2. Create or configure "Service Categories" view
   - Display service taxonomy terms
   - 3-column grid
   - Each term links to service landing page

3. Create "Quick Actions" block
   - 8 prominent action links
   - Icons for each action
```

### Phase 3: Block Placement (CRITICAL)
```
1. Place blocks in homepage regions:
   - Hero region: Council branding
   - Content region: Service directory view
   - Sidebar/Content: Latest news view
   - Footer: Contact info, links
```

### Phase 4: Landing Pages (HIGH)
```
1. Configure service landing page
   - Shows all services in category
   - Breadcrumb navigation

2. Configure news listing page
   - Paginated news archive
   - Filter by category/date

3. Configure guide overview pages
   - Lists all guide steps
   - Progress indication
```

---

## Story Status Update Required

| Story | Previous Status | New Status | Reason |
|-------|-----------------|------------|--------|
| 5-1 | review | done | Module foundation works |
| 5-2 | review | done | Identity generation works |
| 5-3 | review | **partial** | Templates work but no nav/views config |
| 5-4 | review | **partial** | Orchestrator misses nav/views/blocks |
| 5-5 | review | done | Image specs collected correctly |
| 5-6 | review | done | Images generated correctly |
| 5-7 | review | **partial** | Command runs but output incomplete |
| 5-8 | review | **partial** | Guide needs updating for full scope |

**New Stories Required**:
- 5-9: Navigation Menu Configuration
- 5-10: Homepage Views and Blocks
- 5-11: Service/News Landing Pages

---

## Definition of "Complete" for Epic 5

A generated council site is complete when a visitor can:

1. ✅ See the council name and branding on homepage
2. ❌ Navigate to all services via main menu
3. ❌ See latest news on homepage
4. ❌ Browse service categories with sub-links
5. ❌ Find quick action links for common tasks
6. ❌ Access news archive via navigation
7. ❌ Navigate to contact/about pages
8. ❌ See footer with relevant links

**Current Completion: 1/8 (12.5%)**

---

## Immediate Actions

1. **Update sprint-status.yaml** - Mark stories 5-3, 5-4, 5-7, 5-8 as "partial"
2. **Create new stories** - 5-9, 5-10, 5-11 for missing functionality
3. **Disable fallback content** - Remove Westbridge sample data interference
4. **Update generator** - Add menu/view/block configuration phases
5. **Re-deploy and validate** - Full end-to-end test

---

## Technical Implementation Notes

### Menu Configuration via Drupal API
```php
// In ContentGenerationOrchestrator
$menu_link = MenuLinkContent::create([
  'title' => 'Services',
  'link' => ['uri' => 'internal:/services'],
  'menu_name' => 'main',
  'weight' => 0,
]);
$menu_link->save();
```

### View Block Placement via Config
```yaml
# block.block.localgov_news_latest.yml
id: localgov_news_latest
theme: localgov_theme
region: content
plugin: 'views_block:localgov_news-latest'
```

### Homepage Content Type
LocalGov Drupal uses a specific homepage content type with regions. Generator must:
1. Create homepage node OR configure front page
2. Place blocks in homepage layout regions
