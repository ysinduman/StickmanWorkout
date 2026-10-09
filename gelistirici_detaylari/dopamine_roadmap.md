# Dopamine roadmap

One concrete feature slice per entry. Later loop ticks append exactly one new idea and must not repeat an earlier mechanism. Implement a slice only after a successful Android build, and only when it is small and safe.

## 001 — Ember drop on workout save

Status: implemented

Category: Variable Reward
Mechanism: When a workout is saved, roll one cosmetic for the stickman from a fixed table — chalk dust 70%, wrist wrap 25%, ember crown 5% — equip it on the avatar immediately, and persist the owned cosmetics in local storage. There is no purchase path.
Psychological Hook: The rare ember crown cannot be predicted, so finishing a workout stays compelling after the XP gain itself feels familiar.

## 002 — Midnight flame-risk banner

Status: implemented

Category: FOMO
Mechanism: From 21:00 local time, if today's planned workout is still unfinished, Home shows a banner that names the current streak and counts down to midnight, when a missed day extinguishes the flame completely.
Psychological Hook: A visible deadline makes the loss feel close, so putting the session off until later becomes harder to justify.

## 003 — Pinned muscle

Status: implemented

Category: User Investment
Mechanism: Home lets the user pin one of the seven zones — Left Arm, Right Arm, Shoulders, Back, Abs, Glutes, or Legs. The pin is stored locally and that zone's name stays on the stickman until a missed day clears it together with the flame.
Psychological Hook: Naming a muscle makes the streak feel like a personal project, so skipping the day also abandons a choice the user already made.

## 004 — Ember shelf

Status: implemented

Category: Micro-transaction
Mechanism: Home shows a shelf of three locked cosmetics priced in Embers earned from saved workouts (10, 25, and 60). The balance is stored locally, and the shelf has no real-money button.
Psychological Hook: A visible price in earned currency makes the next workout feel like progress toward an item the user has already chosen.

## 005 — Flame stamp

Status: implemented

Category: Social Proof
Mechanism: When the streak reaches 3, Home replaces the plain streak badge with a stamp that reads "Flame kept {{count}} days" and stores the highest stamp locally. A missed day extinguishes the flame and removes the stamp.
Psychological Hook: A badge written like something other people could see makes the streak feel observed, so letting it die costs more than a private number.

## 006 — Pinned-zone bar

Status: implemented

Category: User Investment
Mechanism: A saved workout adds XP only to the pinned zone. When that zone's bar fills, the matching stickman limb thickens one step and the next bar starts at 12% instead of empty.
Psychological Hook: The leftover 12% and the thicker limb make the user want to come back and finish a body part they already started.

## 007 — Hot start

Status: implemented

Category: Variable Reward
Mechanism: When a pinned zone's bar fills, roll a bonus onto the 12% seed: +0 XP (60%), +8 XP (30%), or +20 XP (10%), and show which bonus landed. The bonus never replaces the 12% seed.
Psychological Hook: The size of the head start after a level-up is uncertain, so filling the bar stays exciting after the limb change itself is expected.

## 008 — Evening unfinished bar

Status: implemented

Category: FOMO
Mechanism: From 18:00 local time, if a zone is pinned and its bar is above 12% with today's planned workout still unsaved, Home names that zone and its percent under the streak. A missed day still extinguishes the flame completely.
Psychological Hook: Hearing the exact unfinished percentage in the evening makes the partial bar feel like progress that will be wasted tonight.

## 009 — Seven-day kept line

Status: implemented

Category: Social Proof
Mechanism: Home shows "Kept {{count}} of the last 7 days" beside the streak, counted only from this device's saved workouts. The line does not invent other people, and a missed day still extinguishes the flame completely.
Psychological Hook: A visible score of the last week makes the next open feel like staying consistent with a record the user can already see.

## 010 — Closest Ember tag

Status: implemented

Category: Micro-transaction
Mechanism: The cheapest unsold Ember shelf item shows a "closest" tag when the balance is within 5 Embers of its price. The price does not change, and there is no real-money button.
Psychological Hook: Being a few Embers short makes the next workout feel like the last step toward an item already sitting on the shelf.

## 011 — Kept-day Ember flicker

Status: implemented

Category: Variable Reward
Mechanism: When a saved workout is the first one that counts for a new day in the 7-day kept line, roll a 25% chance to add 1 Ember and show "kept day bonus" on the save alert. It happens at most once per saved workout, and there is no purchase.
Psychological Hook: Some saved days quietly pay an extra Ember, so finishing a workout can feel luckier than the XP alone.

## 012 — Zone step label

Status: implemented

Category: User Investment
Mechanism: Home shows the pinned zone's visual step under its bar as "Step {{level}}". A missed day clears the pin name but leaves the step and the thicker limb in place.
Psychological Hook: The body change outlasts the label, so the user can still see the work after the flame goes out.

## 013 — Double step

Status: implemented

Category: Variable Reward
Mechanism: When a pinned zone's bar fills and the limb thickens one step, roll a 20% chance to thicken it a second step immediately and show "double step" on the save alert. The next bar still starts at 12%, and there is no purchase.
Psychological Hook: Most level-ups change the limb once, but some change it twice, so the next filled bar stays uncertain.

## 014 — Step on the line

Status: implemented

Category: FOMO
Mechanism: From 20:00 local time, if the pinned zone's step is 1 or higher and today's planned workout is still unsaved, Home adds "Step {{level}} is on the line tonight" under the step label. A missed day still extinguishes the flame and clears the pin name, but does not remove the step.
Psychological Hook: Naming the step in the evening makes the visible body change feel like it needs another session, even though the drawing itself stays.

## 015 — Double-step tally

Status: implemented

Category: Social Proof
Mechanism: Each time a double step lands, Home adds one to a local "Double steps kept: {{count}}" line beside the 7-day count. The count comes only from this device, and a missed day does not erase it.
Psychological Hook: A running tally of the rare double steps makes that lucky outcome feel like a record the user can keep seeing.

## 016 — Belt tally mark

Status: implemented

Category: Micro-transaction
Mechanism: While the double-step tally is under 3, the gold belt row shows "3 double steps" beside its Ember price. Reaching 3 removes that note. The price does not change, and there is no real-money button.
Psychological Hook: A second track on the most expensive shelf item makes a rare double step feel like progress toward the belt without discounting it.

## 017 — Belt mark earned

Status: unimplemented

Category: User Investment
Mechanism: When the double-step tally reaches 3, the gold belt row replaces "3 double steps" with "Belt mark earned". The belt still costs 60 Embers, and a missed day does not remove the mark.
Psychological Hook: The mark is proof the user already spent rare steps on the belt, so leaving it unbought feels like walking away from finished work.
