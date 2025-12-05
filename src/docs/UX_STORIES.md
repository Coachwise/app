# Coachwise App - UX Documentation & User Stories

## Table of Contents
1. [Overview](#overview)
2. [User Roles](#user-roles)
3. [Navigation System](#navigation-system)
4. [Feature Flows](#feature-flows)
5. [Pro vs Free Features](#pro-vs-free-features)
6. [Detailed User Journeys](#detailed-user-journeys)

---

## Overview

**Coachwise** is a mobile fitness and climbing tracking app that unifies strength training and climbing metrics in one platform, targeting both athletes and coaches.

### Design System
- **Primary Color**: Dark Navy Blue (`#0E0E55`)
- **Accent Color**: Yellow (`#eab308`)
- **Style**: Clean, mature, professional aesthetic
- **No gradients** except for specific CTAs (Become Pro button)
- **Typography**: Default system with careful hierarchy

### Language Support
- **English** (LTR)
- **Persian/Farsi** (RTL)
- Full i18n support with `useLanguage` context

---

## User Roles

### 1. **Coach** (Always Pro)
- **Status**: Always Pro user
- **Can**:
  - Create and manage subscription tiers
  - Add athletes manually
  - Assign workout plans to athletes
  - View athlete progress
  - Access Coach Dashboard
  - Post to social feeds
  - All Pro features unlocked

- **Revenue Model**: Earns money through athlete subscriptions

### 2. **Pro Athlete**
- **How to become Pro**:
  - Purchase subscription through app
  - OR be added by a coach AND purchase subscription through coach's marketplace

- **Can**:
  - Schedule workouts to calendar
  - Log workout sessions (sets, reps, weight)
  - Create unlimited personal workout plans
  - View assigned plans from coaches
  - Post to social feeds
  - Access all app features

### 3. **Free Athlete** (Limited)
- **Default state** for new users or manually added athletes

- **Can**:
  - View assigned plans from coaches
  - Post to social feeds (social is free for everyone)
  - Create up to **2 personal plans maximum**
  - View workout plans (read-only)

- **Cannot**:
  - Schedule workouts to calendar (blocked with upgrade prompt)
  - Log workout sessions (blocked with upgrade prompt)
  - Create more than 2 personal plans (blocked with upgrade prompt)

---

## Navigation System

### Bottom Navigation (4 Tabs)
1. **Home** - Dashboard/Feed
2. **Workouts** - Workout plans and sessions
3. **Progress** - Stats and analytics
4. **Profile** - User profile

### Hamburger Menu (Top Right)
**Location**: Available on most screens in top-right corner

#### Menu Contents - Free Athlete:
```
┌─────────────────────────────────────┐
│  👤 John Doe                        │
│  john.doe@example.com               │
├─────────────────────────────────────┤
│  👑 BECOME PRO (gradient button)    │ ← Main CTA
│  📋 Become a Coach (outlined)       │ ← Secondary CTA
├─────────────────────────────────────┤
│  👥 Athletes & Coaches              │
│  🔔 Notifications                   │
│  ⚙️ Settings                        │
│  🔒 Privacy & Security              │
│  👤 Profile Settings                │
│  🚪 Log Out                         │
└─────────────────────────────────────┘
```

#### Menu Contents - Pro Athlete:
```
┌─────────────────────────────────────┐
│  👤 John Doe 👑                     │
│  john.doe@example.com               │
├─────────────────────────────────────┤
│  ✨ PRO MEMBER - ACTIVE             │ ← Status badge
│  All features unlocked               │
├─────────────────────────────────────┤
│  📋 Become a Coach (outlined)       │
│  👥 Athletes & Coaches              │
│  🔔 Notifications                   │
│  ⚙️ Settings                        │
│  🔒 Privacy & Security              │
│  👤 Profile Settings                │
│  🚪 Log Out                         │
└─────────────────────────────────────┘
```

#### Menu Contents - Coach:
```
┌─────────────────────────────────────┐
│  👤 Sarah Martinez 👑               │
│  sarah@example.com                  │
├─────────────────────────────────────┤
│  ✨ PRO MEMBER - ACTIVE             │ ← Status badge
│  All features unlocked               │
├─────────────────────────────────────┤
│  📊 Dashboard (navy button)         │ ← Coach-specific
│  💳 Create Subscription Tier        │ ← Coach-specific
│  👥 Athletes & Coaches              │
│  🔔 Notifications                   │
│  ⚙️ Settings                        │
│  🔒 Privacy & Security              │
│  👤 Profile Settings                │
│  🚪 Log Out                         │
└─────────────────────────────────────┘
```

---

## Feature Flows

### 1. **Workout Session Flow**

#### Starting a Freestyle Session
1. Navigate to **Workouts** tab
2. Click **"My Plans"** tab
3. Click **"Quick Start"** card or **"Start Freestyle Session"**
4. Session screen opens:
   - Timer display (00:00)
   - Rest timer functionality
   - Add exercise button
   - Exercise logging (sets, reps, weight)

#### Free User Limitation:
- Can start timer
- Can add exercises
- **Cannot log sets/reps/weight** → Shows upgrade prompt:
  ```
  🔒 Upgrade to Pro
  Track your sets, reps, and weight to monitor progress
  [Upgrade to Pro] button → navigates to Pro Subscription
  ```

---

### 2. **Workout Plan Management**

#### Viewing Assigned Plans (All Users)
1. Navigate to **Workouts** tab
2. **"Assigned Plans"** tab is default
3. See list of plans from coaches:
   - Coach avatar + name
   - Plan name
   - Progress (Day X of Y)
   - Progress percentage
   - Today's workout (if available)
   - "Start Workout" button

#### Creating Personal Plans

**Free Users**:
- Can create up to **2 plans**
- After 2 plans, sees block message:
  ```
  🔒 Plan Limit Reached
  Free users can create up to 2 personal plans.
  Upgrade to Pro for unlimited plans!
  [Upgrade to Pro] button
  ```

**Pro Users**:
- **Unlimited** plan creation
- Full plan builder access

---

### 3. **Calendar Scheduling**

#### Viewing Weekly Calendar (All Users)
1. Navigate to **Workouts** → **Assigned Plans**
2. See weekly calendar view:
   - 7-day week view
   - Week navigation (◀ ▶)
   - "Back to This Week" button
   - Days show scheduled workouts
   - Today highlighted in yellow

#### Scheduling Workouts

**Free Users**:
- Can **view** scheduled workouts
- **Cannot add** to calendar
- Clicking on a day shows **upgrade prompt**:
  ```
  🔒 Upgrade to Pro to Schedule
  Schedule workouts to your calendar with Pro
  [Upgrade to Pro] button
  ```

**Pro Users**:
- Click any day to open scheduler
- Select from assigned plans
- Add multiple workouts per day
- Toggle complete/incomplete
- Remove scheduled workouts

---

### 4. **Coach Dashboard** (Coaches Only)

#### Accessing Dashboard
1. Open hamburger menu
2. Click **"Dashboard"** button
3. Dashboard shows:
   - **Stats**: Active clients, total revenue, subscription tiers
   - **My Subscription Tiers**: List of created tiers
   - **Active Clients**: List with tier, last active, assigned plan

#### Creating Subscription Tier
1. Click **"Create New Tier"**
2. Form fields:
   - Tier name (e.g., "Basic", "Premium")
   - Monthly price ($)
   - Description
   - Features (multiple checkboxes)
3. Click **"Create Tier"**
4. Tier appears in marketplace

---

### 5. **Coach Marketplace**

#### Browsing Coaches (All Users)
1. Navigate to hamburger menu → **"Athletes & Coaches"**
2. OR from **Workouts** → **"Find a Coach"** (when no assigned plans)
3. Marketplace shows:
   - Search bar (by name or specialty)
   - Filter buttons (All, Strength, Climbing, Mixed)
   - Coach cards with:
     - Avatar + name
     - Rating (⭐ 4.9)
     - Specialty
     - Client count
     - Price starting from $X/month
     - "View Profile" button

#### Viewing Coach Profile
1. Click **"View Profile"**
2. Profile shows:
   - Cover photo + avatar
   - Name, rating, client count
   - About section
   - **Subscription Tiers** (cards):
     - Tier name
     - Price/month
     - Features list
     - "Subscribe" button

#### Subscribing to Coach
1. Click **"Subscribe"** on a tier
2. Athlete becomes **Pro user**
3. Coach earns recurring revenue
4. Athlete can now:
   - Access all Pro features
   - Receive plans from this coach

---

### 6. **Pro Subscription Purchase**

#### Navigation to Pro Purchase
**Entry Points**:
1. Hamburger menu → **"Become Pro"** button
2. Any upgrade prompt → **"Upgrade to Pro"** button
3. Coach marketplace profile → **"View Pro Options"** link

#### Pro Subscription Screen
**Header**:
- "Upgrade to Pro"
- "Unlock all features and take your training to the next level"

**Pricing Tiers** (4 cards):

1. **Monthly** - $5/month
   - Billed monthly
   - (Standard card)

2. **3 Months** - $12 total
   - Save $3 (20% off)
   - $4/month
   - Badge: "SAVE 20%"

3. **6 Months** - $22.50 total ⭐ **MOST POPULAR**
   - Save $7.50 (25% off)
   - $3.75/month
   - Badge: "MOST POPULAR"
   - Gold border

4. **Yearly** - $42/year
   - Save $18 (30% off)
   - $3.50/month
   - Badge: "BEST VALUE"

**Features List**:
- ✅ Schedule workouts to calendar
- ✅ Log workout sessions with full tracking
- ✅ Create unlimited workout plans
- ✅ Access to all coaching features
- ✅ Priority support
- ✅ Advanced analytics

**Footer**:
- "30-day money-back guarantee"
- "Cancel anytime"

**Action**:
- Click tier → **"Subscribe Now"** button
- (Payment flow - not implemented in demo)

---

### 7. **Social Feed**

#### Feed Features (All Users - Social is Free!)
1. Navigate to **Home** tab
2. Feed shows:
   - Posts from athletes/coaches
   - PR (Personal Record) highlights
   - Workout completions
   - Coach announcements

#### Posting (All Users)
1. Click **"+"** or **"Create Post"**
2. Options:
   - Text post
   - Share PR
   - Share workout completion
   - Add photo
3. Post appears in feed

**Note**: Social features are FREE for everyone, including free athletes.

---

### 8. **Profile System**

#### Own Profile View
1. Navigate to **Profile** tab
2. Shows:
   - Avatar with **Pro badge** (if Pro)
   - Name, username
   - Stats (workouts, PRs, followers)
   - Bio
   - Recent activity
   - Personal records

#### Viewing Other Profiles
1. Click user avatar anywhere in app
2. Profile modal opens:
   - Avatar with **Pro badge** (if Pro user)
   - Name, username
   - Follow button
   - Stats
   - Recent workouts
   - "Message" button

#### Pro Badge Display
**Visual**: Yellow crown icon (👑) on avatar
**Appears on**:
- Profile avatars
- Feed posts
- Comments
- Coach marketplace
- Client lists

---

## Pro vs Free Features

### Feature Comparison Table

| Feature | Free Athlete | Pro Athlete | Coach |
|---------|--------------|-------------|-------|
| **View assigned plans** | ✅ Yes | ✅ Yes | ✅ Yes |
| **Create personal plans** | 🔒 Max 2 | ✅ Unlimited | ✅ Unlimited |
| **Schedule to calendar** | ❌ No (upgrade prompt) | ✅ Yes | ✅ Yes |
| **Log workout sessions** | ❌ No (upgrade prompt) | ✅ Yes | ✅ Yes |
| **Post to social feed** | ✅ Yes | ✅ Yes | ✅ Yes |
| **View progress stats** | ✅ Basic | ✅ Advanced | ✅ Advanced |
| **Pro badge on profile** | ❌ No | 👑 Yes | 👑 Yes |
| **Coach dashboard** | ❌ No | ❌ No | ✅ Yes |
| **Create subscription tiers** | ❌ No | ❌ No | ✅ Yes |
| **Earn revenue** | ❌ No | ❌ No | ✅ Yes |

---

## Detailed User Journeys

### Journey 1: New Free Athlete Signs Up

**Persona**: John, wants to try the app before paying

1. **Sign up** → Creates account as Athlete
2. **Onboarding** → Sets preferences, goals
3. **Home screen** → Sees social feed (free!)
4. **Workouts tab** → Empty state, "Find a Coach" or "Create Plan"
5. **Creates 1st plan** → "My Beginner Routine" ✅
6. **Starts freestyle session** → Timer works
7. **Tries to log sets** → 🔒 **Blocked**: "Upgrade to Pro to track sets/reps"
8. **Creates 2nd plan** → "Upper Body" ✅
9. **Tries to create 3rd plan** → 🔒 **Blocked**: "Free users limited to 2 plans"
10. **Sees value** → Clicks "Upgrade to Pro"
11. **Subscribes** → Chooses 6-month plan ($22.50)
12. **Now Pro** → 👑 Badge appears on profile
13. **Creates 3rd plan** → ✅ Works!
14. **Logs full workout** → ✅ Sets, reps, weight tracking works!

**Outcome**: Converted from free to Pro after experiencing limitations

---

### Journey 2: Athlete Finds Coach in Marketplace

**Persona**: Sarah, wants personalized coaching

1. **Workouts tab** → "Assigned Plans" empty
2. **Clicks** "Find a Coach" button
3. **Marketplace** → Browses coaches
4. **Filters** → "Climbing" specialty
5. **Finds** Mike Chen - 4.9⭐, Climbing expert
6. **Views profile** → Reads bio, sees tiers
7. **Subscription tiers**:
   - Basic: $30/month - 2 workouts/week
   - Premium: $60/month - 4 workouts/week + 1:1 calls
8. **Subscribes** → Chooses Premium tier
9. **Becomes Pro** → Automatic with coach subscription
10. **Receives plan** → "Climbing Endurance Week 1"
11. **Views calendar** → Plan scheduled by coach
12. **Logs sessions** → Full tracking enabled
13. **Posts PR** → "Sent my first V6! 🎉"

**Outcome**: Became Pro through coach subscription, gets coaching + Pro features

---

### Journey 3: Free Athlete Added by Coach

**Persona**: Tom, manually added by his coach

1. **Invited by coach** → Receives invite link
2. **Signs up** → Account created as Athlete
3. **Status**: Free user (not subscribed through marketplace)
4. **Receives plans** → Coach assigns "Strength Building Phase 1"
5. **Workouts tab** → Sees assigned plan ✅
6. **Views calendar** → Sees scheduled workouts ✅
7. **Tries to reschedule** → 🔒 **Blocked**: "Upgrade to Pro to schedule"
8. **Starts workout** → Timer works
9. **Tries to log** → 🔒 **Blocked**: "Upgrade to Pro to track sessions"
10. **Posts progress photo** → ✅ Social works (free for all)
11. **Frustrated** → Wants to track progress
12. **Clicks** "Upgrade to Pro"
13. **Sees options**:
    - Subscribe through app ($5/month)
    - Subscribe through coach's tiers
14. **Chooses** App subscription (cheaper)
15. **Becomes Pro** → 👑 All features unlocked

**Outcome**: Manually added athlete upgrades independently

---

### Journey 4: Athlete Becomes Coach

**Persona**: Maria, experienced athlete wants to coach

1. **Current**: Pro Athlete (has subscription)
2. **Hamburger menu** → Clicks "Become a Coach"
3. **Coach application** → Fills form:
   - Certifications
   - Experience
   - Specialties
   - Profile info
4. **Submits** → Application under review
5. **Approved** → Role changes to "Coach"
6. **Now Coach**:
   - Dashboard button appears
   - "Create Subscription Tier" available
   - Keeps Pro status (coaches always Pro)
7. **Dashboard** → Creates first tier:
   - Name: "Beginner Strength"
   - Price: $40/month
   - Features: 3 workouts/week, email support
8. **Tier published** → Appears in marketplace
9. **First client** → John subscribes
10. **Earns revenue** → $40/month recurring
11. **Assigns plans** → Creates custom plan for John
12. **Coaches** → Ongoing relationship

**Outcome**: Transitioned from athlete to revenue-earning coach

---

### Journey 5: Pro User Schedules Training Week

**Persona**: Alex, Pro athlete with multiple coaches

1. **Workouts tab** → "Assigned Plans"
2. **Has 3 coaches**:
   - Coach A: Strength training
   - Coach B: Climbing technique
   - Coach C: Flexibility/mobility
3. **Calendar view** → This week (Dec 5-11)
4. **Plans received**:
   - Monday: "Upper Body Push" (Coach A)
   - Tuesday: "Finger Strength" (Coach B)
   - Wednesday: "Rest"
   - Thursday: "Lower Body" (Coach A)
   - Friday: "Endurance Climbing" (Coach B)
   - Saturday: "Yoga Flow" (Coach C)
   - Sunday: Rest
5. **Adjusts schedule**:
   - Clicks Wednesday
   - Adds "Yoga Flow" (Coach C)
   - Removes from Saturday
6. **Starts Monday workout**:
   - Clicks "Start Workout"
   - Session screen opens
   - Logs: Bench Press 3x8x185lbs
   - Logs: Shoulder Press 3x10x95lbs
   - Completes workout
7. **Marks complete** → Green checkmark on calendar
8. **Progress tracked** → Stats updated

**Outcome**: Successfully manages complex training schedule with Pro features

---

### Journey 6: Coach Manages Clients

**Persona**: Sarah, coach with 15 active clients

1. **Dashboard** → Opens from hamburger menu
2. **Stats**:
   - Active clients: 15
   - Monthly revenue: $650
   - Subscription tiers: 3
3. **Client list** → Views all clients:
   - John Doe - Basic tier - Active 2 days ago
   - Maria Garcia - Premium tier - Active today
   - Tom Wilson - Free (manually added) - Active 1 week ago
4. **Clicks John** → Opens client detail:
   - Current plan: "Week 4 - Upper/Lower Split"
   - Progress: 75% completion
   - Last workout: Dec 3
   - PR history
5. **Assigns new plan**:
   - "Week 5 - Progressive Overload"
   - Schedules for next Monday
6. **Clicks Tom** (free user):
   - Note: "Free user - limited features"
   - Can still assign plans
   - Tom can view but not log
7. **Sends message** → "Great progress this week!"
8. **Creates new tier**:
   - "Elite Training"
   - $100/month
   - 5 workouts/week + 2 video calls + nutrition plan
9. **Publishes** → Now in marketplace

**Outcome**: Coach efficiently manages mixed client roster (free + paid)

---

## ProUpgradeModal Component

**Usage**: Appears when free users hit limitations

### Trigger Scenarios:
1. Try to log workout sets/reps
2. Try to schedule to calendar
3. Try to create 3rd+ personal plan
4. Try to access advanced analytics

### Modal Content:

```
╔═══════════════════════════════════╗
║   🔒 Upgrade to Pro               ║
╟───────────────────────────────────╢
║                                   ║
║   👑 [Feature-specific message]   ║
║                                   ║
║   With Pro you get:               ║
║   ✅ Schedule workouts            ║
║   ✅ Track all sessions           ║
║   ✅ Unlimited plans              ║
║   ✅ Advanced analytics           ║
║   ✅ Priority support             ║
║                                   ║
║   Starting at $3.50/month         ║
║                                   ║
║   [Upgrade to Pro] (yellow)       ║
║   [Find a Coach] (outlined)       ║
║   [Maybe Later] (text)            ║
║                                   ║
╚═══════════════════════════════════╝
```

### Feature-Specific Messages:
- **Calendar**: "Schedule workouts to your calendar with Pro"
- **Session logging**: "Track your sets, reps, and weight to monitor progress"
- **Plan creation**: "Create unlimited workout plans with Pro"
- **General**: "Unlock all features and take your training to the next level"

---

## Component Architecture

### Main Components

1. **App.tsx** - Root component, routing
2. **Home.tsx** - Social feed
3. **WorkoutsHome.tsx** - Workout management
4. **WorkoutSession.tsx** - Active workout logging
5. **ProgressStats.tsx** - Analytics
6. **Profile.tsx** - User profile
7. **CoachMarketplace.tsx** - Browse coaches
8. **CoachProfile.tsx** - Individual coach view
9. **CoachDashboard.tsx** - Coach management (coaches only)
10. **ProSubscription.tsx** - Pro purchase screen
11. **HamburgerMenu.tsx** - Navigation menu
12. **ProBadge.tsx** - Yellow crown badge
13. **ProUpgradeModal.tsx** - Upgrade prompts

### Shared Props Pattern

Most screens receive:
```typescript
interface ScreenProps {
  userRole: 'athlete' | 'coach';
  isPro: boolean;
  onNavigate: (view: string) => void;
}
```

---

## Business Model Summary

### Revenue Streams

1. **Pro Subscriptions**:
   - Direct to consumer
   - Monthly: $5
   - 3-month: $12 (20% off)
   - 6-month: $22.50 (25% off) ⭐ Most Popular
   - Yearly: $42 (30% off)

2. **Coach Subscriptions**:
   - Athlete subscribes to coach tier
   - Coach sets own pricing
   - Platform may take % (implementation detail)

### User Lifecycle Value

**Free Athlete**:
- $0 revenue
- Can convert to Pro or Coach subscription
- Social engagement drives retention

**Pro Athlete**:
- $42-60/year direct subscription
- May also subscribe to coaches

**Coach**:
- Always Pro (no subscription needed)
- Generates revenue through client subscriptions
- Average coach: $30-100/month per client
- Example: 15 clients × $40 = $600/month

---

## Future Enhancements (Not Implemented)

1. **Video integration** - Exercise demonstrations
2. **1:1 messaging** - Direct coach-athlete chat
3. **Nutrition tracking** - Meal logging
4. **Advanced analytics** - AI insights
5. **Challenges** - Community competitions
6. **Certifications** - Coach verification
7. **Payment processing** - Real Stripe integration
8. **Team features** - Group coaching
9. **Climbing-specific** - Route tracking, grade progression
10. **Wearable integration** - Apple Watch, Garmin

---

## Accessibility Considerations

1. **RTL Support** - Full Persian language support
2. **Touch targets** - Minimum 44×44px for mobile
3. **Color contrast** - Navy/Yellow passes WCAG AA
4. **Semantic HTML** - Proper heading hierarchy
5. **Keyboard navigation** - (for web version)
6. **Screen reader** - (for implementation)

---

## Performance Optimizations

1. **Component lazy loading** - Split code by route
2. **Image optimization** - Unsplash with size params
3. **Virtual scrolling** - For long lists (future)
4. **State management** - Context for shared state
5. **Memoization** - React.memo for expensive components

---

## Error States & Edge Cases

### No Internet Connection
- Show offline banner
- Cache recent data
- Queue actions for sync

### No Assigned Plans
- Empty state with "Find a Coach" CTA
- Illustration + encouraging copy

### No Personal Plans (Free User)
- Encourage plan creation
- Show 2/2 limit indicator

### Coach Has No Clients
- Empty state in dashboard
- CTA to improve profile
- Marketing tips

### Payment Failed
- Gracefully downgrade to free
- Notify user via email/notification
- Offer payment retry

---

## Testing Scenarios

### Free User Tests
- [ ] Can view but not schedule to calendar
- [ ] Can create 2 plans, blocked at 3rd
- [ ] Can start session but not log sets
- [ ] Can post to social feed
- [ ] Sees "Become Pro" in menu
- [ ] Upgrade prompts appear correctly

### Pro User Tests
- [ ] Can schedule to calendar
- [ ] Can create unlimited plans
- [ ] Can log full workout sessions
- [ ] Sees Pro badge on profile
- [ ] Menu shows "PRO MEMBER - ACTIVE"

### Coach Tests
- [ ] Dashboard accessible
- [ ] Can create subscription tiers
- [ ] Can manage clients (free + paid)
- [ ] Can assign plans to any client
- [ ] Always has Pro status

### Cross-Language Tests
- [ ] All screens work in English
- [ ] All screens work in Persian (RTL)
- [ ] Date/number formatting correct
- [ ] No hardcoded strings

---

## Support & Help

### In-App Help
- ? icon in top-right (not implemented)
- Contextual tooltips
- Feature tutorials

### Customer Support
- Pro users: Priority support
- Free users: Community forum
- Coaches: Dedicated support channel

---

*Last Updated: December 5, 2024*
*Version: 1.0*
*Platform: Mobile Web (React + Tailwind)*
