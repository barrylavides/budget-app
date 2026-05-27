# Carry-Over Enhancement: Multiple Items, Sources, Resolve & Links

## Table of Contents
- [Goal](#goal)
- [Data Model](#data-model)
- [UI Changes](#ui-changes)
- [Implementation Steps](#implementation-steps)

## Goal
Enhance carry-overs to support:
1. Multiple carry-over items per deficit (split deficit across items)
2. Multiple sources to cover a deficit (each allocation = its own carry-over item)
3. Resolve one-by-one or all at once
4. Resolved banner always visible with clickable links to source details and origin views

## Data Model
Keep existing per-item structure — create **multiple carry-over items** when assigning sources:
```js
{ id, from, fromLabel, amount, sourceId, resolvedAt }
```
One deficit can produce N carry-over items (one per source allocation). No schema change needed.

## UI Changes

### CarryOverModal (assign sources)
- Show expense breakdown from deficit origin (informational)
- Dynamic allocation rows: source dropdown + amount input
- "Add Source" button to split across multiple sources
- Remaining unallocated tracker
- Save creates one carry-over item per allocation

### CarryOverBanner (pending section)
- Group items by origin (`fromLabel`)
- Individual "Resolve" buttons per item (existing)
- "Resolve All" button when 2+ pending items

### CarryOverBanner (resolved section — always visible)
- Each resolved item shows: origin label, source name, amount
- Origin label is clickable: navigates to that half/month view
- Source name is clickable: opens source detail modal
- Never collapses — always present at top

### HalfView
- Wire up missing `onResolveCarryOver` and `onSaveCarryOver` callbacks

## Implementation Steps
1. Add missing `newCoId` generator
2. Wire carry-over callbacks into HalfView
3. Enhance CarryOverModal for multi-source allocation
4. Add "Resolve All" to banner + handler
5. Enhance resolved section with links and details
6. Update seed data with multiple carry-over examples
7. Add CSS for new elements (allocation rows, link styles, resolve-all button)
