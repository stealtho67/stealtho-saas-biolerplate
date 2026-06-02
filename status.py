#!/usr/bin/env python3
"""
StealthO Daily Lead Status — Run each morning to see what's ready to call.

Usage:
  python3 status.py          # Full daily digest
  python3 status.py --today  # Just today's leads
  python3 status.py --stats  # Just stats
  python3 status.py --followups  # Scheduled callbacks
"""

import sys
import os
from datetime import date, datetime

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from leads_db import LeadsDB

db = LeadsDB()
today = date.today().isoformat()
day_name = date.today().strftime("%A")


def show_stats():
    stats = db.get_stats()
    print(f"\n{'='*60}")
    print(f"  STEALTHO LEAD DATABASE")
    print(f"  {date.today().strftime('%A, %B %d, %Y')}")
    print(f"{'='*60}\n")

    print(f"  📊 OVERVIEW")
    print(f"  {'Leads in database:':25} {stats['total_leads']}")
    print(f"  {'New to call:':25} {stats['new_leads']}")
    print(f"  {'Called (total):':25} {stats['total_called']}")
    print(f"  {'Interested:':25} {stats['interested']}")
    print(f"  {'Converted:':25} {stats['converted']}")
    print(f"  {'Callback scheduled:':25} {stats['callback_scheduled']}")
    print(f"  {'Conversion rate:':25} {stats['conversion_rate']}%")
    print(f"  {'To call today:':25} {stats['to_call_today']}")
    print()

    # Breakdowns
    if stats.get('by_niche'):
        print(f"  📂 BY NICHE")
        for n, c in sorted(stats['by_niche'].items(), key=lambda x: -x[1])[:8]:
            print(f"  {n:25} {c}")
        print()

    if stats.get('by_situation'):
        print(f"  🎯 BY SITUATION")
        for s, c in sorted(stats['by_situation'].items(), key=lambda x: -x[1])[:8]:
            label = s.replace('-', ' ').title()
            print(f"  {label:25} {c}")
        print()

    # Recent runs
    if stats.get('recent_runs'):
        print(f"  📡 RECENT RUNS")
        for r in stats['recent_runs'][:5]:
            sit = r['situation'].replace('-', ' ') if r['situation'] else 'general'
            print(f"  {r['run_date']} - {r['niche']} in {r['city']} ({sit})")
            print(f"  {' ' * len(r['run_date'])}   Found {r['leads_found']}, New: {r['new_leads']}")
        print()

    return stats


def show_today():
    """Show leads to call today with call script."""
    leads = db.get_leads_to_call(limit=30)
    followups = db.get_follow_ups_today()
    
    print(f"\n{'='*60}")
    print(f"  LEADS TO CALL TODAY")
    print(f"  {date.today().strftime('%A, %B %d, %Y')}")
    print(f"{'='*60}\n")
    
    if followups:
        print(f"  🔄 FOLLOW-UPS ({len(followups)})\n")
        for lead in followups:
            print(f"  [{lead['status']}] {lead['name']} — {lead.get('phone', 'No phone')}")
            print(f"     {lead.get('city', '')} | {lead.get('niche', '')}")
            if lead.get('last_notes'):
                print(f"     Last notes: {lead['last_notes'][:120]}")
            if lead.get('follow_up_time'):
                print(f"     Call at: {lead['follow_up_time']}")
            print()
        print("  " + "-" * 56 + "\n")

    if not leads:
        print("  ✅ No new leads to call! Great job.\n")
        print("  Run a new pipeline:")
        print("    bash daily-leads.sh 'Austin'\n")
        return

    print(f"  📋 NEW LEADS ({len(leads)} to call)\n")
    for i, lead in enumerate(leads, 1):
        pri = lead.get('priority', 'med').upper()
        ws = "❌ No site" if not lead.get('has_website') else "✅ Has site"
        score = lead.get('score', '?')
        name = lead.get('name', '?')
        phone = lead.get('phone', 'No phone')
        gap = lead.get('biggest_gap', '')
        niche = lead.get('niche', '')
        sit = lead.get('situation', '').replace('-', ' ').title()
        
        print(f"  [{i}] [{pri}] {name}")
        print(f"      Score: {score}/10 | {ws} | Gap: {gap}")
        print(f"      📞 {phone} | {niche} | {sit}")
        if lead.get('pitch_angle'):
            pa = lead['pitch_angle'][:120]
            print(f"      🎯 {pa}")
        print()

    # Quick call guide
    print(f"  {'=' * 56}")
    print(f"  CALL SCRIPT QUICK REFERENCE")
    print(f"  {'=' * 56}")
    print(f"""
  1. HI: 'Hey [name], this is Kendall with StealthO —'
  2. HOOK: 'I noticed your Google Business Profile could use some work...'
  3. VALUE: 'I help businesses like yours get found on Google and look professional online.'
  4. OFFER: 'I can build you a website and optimize your Google profile for $497/month.'
  5. CLOSE: 'I have 15 minutes tomorrow to show you what I mean — does that work?'
""")


def show_learnings():
    learnings = db.get_learnings()
    if learnings:
        print(f"\n  🧠 WHAT THE SYSTEM HAS LEARNED\n")
        for l in learnings:
            val = l['value']
            label = l['key'].replace('-', ' ').title()
            if l['category'] == 'best_niche':
                print(f"  Best converting niche: {label} ({val} conversions)")
            elif l['category'] == 'best_situation':
                print(f"  Best converting situation: {label} ({val} conversions)")
        print()


if __name__ == "__main__":
    if len(sys.argv) < 2 or sys.argv[1] == "--all":
        show_stats()
        show_today()
        show_learnings()
    elif sys.argv[1] == "--today":
        show_today()
    elif sys.argv[1] == "--stats":
        show_stats()
    elif sys.argv[1] == "--followups":
        leads = db.get_follow_ups_today()
        if leads:
            print(f"\n🔄 FOLLOW-UPS TODAY ({len(leads)})\n")
            for lead in leads:
                print(f"  {lead['name']} — {lead.get('phone', 'No phone')}")
                if lead.get('last_notes'):
                    print(f"     Notes: {lead['last_notes'][:100]}")
                print()
        else:
            print("\n✅ No follow-ups scheduled for today.\n")
