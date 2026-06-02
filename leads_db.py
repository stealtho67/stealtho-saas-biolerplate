#!/usr/bin/env python3
"""
StealthO Leads Database — Persistent lead storage with dedup, tracking, and learning.

Usage:
  from leads_db import LeadsDB
  db = LeadsDB()
  
  # Store new leads (auto-dedup by phone or name+city)
  db.store_leads(leads, niche="plumbers", city="Austin", situation="home-based")
  
  # Get today's leads to call
  leads = db.get_leads_to_call(limit=20)
  
  # Mark outcome
  db.mark_called(lead_id, outcome="interested", notes="Wants website, call back Friday")
  
  # Learn what's working
  stats = db.get_stats()
"""

import sqlite3
import json
import os
from datetime import datetime, date, timedelta

DB_DIR = os.path.dirname(os.path.abspath(__file__))
DB_PATH = os.path.join(DB_DIR, "leads", "leads.db")


class LeadsDB:
    def __init__(self, db_path=None):
        self.db_path = db_path or DB_PATH
        os.makedirs(os.path.dirname(self.db_path), exist_ok=True)
        self._init_db()

    def _init_db(self):
        with sqlite3.connect(self.db_path) as conn:
            conn.executescript("""
                CREATE TABLE IF NOT EXISTS leads (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    name TEXT NOT NULL,
                    phone TEXT,
                    address TEXT,
                    city TEXT,
                    niche TEXT,
                    situation TEXT,
                    has_website INTEGER DEFAULT 0,
                    website_url TEXT,
                    google_rating REAL,
                    review_count INTEGER,
                    address_is_residential INTEGER DEFAULT 0,
                    biggest_gap TEXT,
                    score INTEGER,
                    priority TEXT,
                    pitch_angle TEXT,
                    source_run_id TEXT,
                    status TEXT DEFAULT 'new',
                    -- status: new, called, interested, converted, not_interested, 
                    --         wrong_number, no_answer, callback_scheduled, duplicate
                    created_at TEXT DEFAULT (datetime('now')),
                    UNIQUE(name, city, niche)
                );

                CREATE TABLE IF NOT EXISTS call_log (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    lead_id INTEGER,
                    call_date TEXT DEFAULT (date('now')),
                    outcome TEXT,
                    notes TEXT,
                    follow_up_date TEXT,
                    follow_up_time TEXT,
                    created_at TEXT DEFAULT (datetime('now')),
                    FOREIGN KEY (lead_id) REFERENCES leads(id)
                );

                CREATE TABLE IF NOT EXISTS daily_runs (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    run_date TEXT DEFAULT (date('now')),
                    niche TEXT,
                    city TEXT,
                    situation TEXT,
                    leads_found INTEGER DEFAULT 0,
                    new_leads INTEGER DEFAULT 0,
                    completed_at TEXT,
                    status TEXT DEFAULT 'running'
                );

                CREATE TABLE IF NOT EXISTS learning (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    category TEXT,
                    key TEXT,
                    value TEXT,
                    updated_at TEXT DEFAULT (datetime('now')),
                    UNIQUE(category, key)
                );

                CREATE INDEX IF NOT EXISTS idx_leads_status ON leads(status);
                CREATE INDEX IF NOT EXISTS idx_leads_city_niche ON leads(city, niche);
                CREATE INDEX IF NOT EXISTS idx_leads_phone ON leads(phone);
            """)

    def store_leads(self, leads, niche="", city="", situation="", run_id=None):
        """Store leads, skipping duplicates. Returns count of new leads."""
        if not leads:
            return 0
        
        new_count = 0
        today = date.today().isoformat()
        
        with sqlite3.connect(self.db_path) as conn:
            for lead in leads:
                name = lead.get('name', '').strip()
                phone = lead.get('phone', '').strip()
                address = lead.get('address', '').strip()
                
                if not name:
                    continue
                
                try:
                    conn.execute("""
                        INSERT OR IGNORE INTO leads 
                        (name, phone, address, city, niche, situation, has_website, 
                         website_url, google_rating, review_count, address_is_residential,
                         biggest_gap, score, priority, pitch_angle, source_run_id, status)
                        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'new')
                    """, (
                        name, phone, address, city, niche, situation,
                        1 if lead.get('has_website') else 0,
                        lead.get('website_url', ''),
                        lead.get('google_rating'),
                        lead.get('review_count'),
                        1 if lead.get('address_is_residential') else 0,
                        lead.get('biggest_gap', ''),
                        lead.get('score'),
                        lead.get('priority', 'medium'),
                        lead.get('pitch_angle', lead.get('call_angle', '')),
                        run_id
                    ))
                    if conn.total_changes > 0:
                        new_count += 1
                except sqlite3.IntegrityError:
                    pass
            
            # Log the run
            conn.execute("""
                INSERT INTO daily_runs (run_date, niche, city, situation, leads_found, new_leads, completed_at, status)
                VALUES (?, ?, ?, ?, ?, ?, datetime('now'), 'complete')
            """, (today, niche, city, situation, len(leads), new_count))
        
        return new_count

    def get_leads_to_call(self, limit=20, city=None, niche=None, status='new'):
        """Get leads ready to call — newest first, highest priority."""
        query = "SELECT * FROM leads WHERE status = ?"
        params = [status]
        
        if city:
            query += " AND city = ?"
            params.append(city)
        if niche:
            query += " AND niche = ?"
            params.append(niche)
        
        query += " ORDER BY CASE priority WHEN 'high' THEN 0 WHEN 'medium' THEN 1 ELSE 2 END, score DESC NULLS LAST, created_at DESC LIMIT ?"
        params.append(limit)
        
        with sqlite3.connect(self.db_path) as conn:
            conn.row_factory = sqlite3.Row
            rows = conn.execute(query, params).fetchall()
            return [dict(r) for r in rows]

    def get_leads_by_status(self, status):
        """Get all leads with a given status."""
        with sqlite3.connect(self.db_path) as conn:
            conn.row_factory = sqlite3.Row
            rows = conn.execute(
                "SELECT * FROM leads WHERE status = ? ORDER BY created_at DESC", 
                (status,)
            ).fetchall()
            return [dict(r) for r in rows]

    def mark_called(self, lead_id, outcome="called", notes="", follow_up_date=None, follow_up_time=None):
        """Mark a lead as called and log the outcome.
        
        Outcomes: interested, converted, not_interested, wrong_number, no_answer, callback_scheduled
        """
        now = datetime.now().isoformat()
        
        with sqlite3.connect(self.db_path) as conn:
            # Update lead status
            conn.execute(
                "UPDATE leads SET status = ?, updated_at = ? WHERE id = ?",
                (outcome, now, lead_id)
            )
            
            # Log the call
            conn.execute("""
                INSERT INTO call_log (lead_id, outcome, notes, follow_up_date, follow_up_time)
                VALUES (?, ?, ?, ?, ?)
            """, (lead_id, outcome, notes, follow_up_date, follow_up_time))
            
            # If converted, log the learning
            if outcome == "converted":
                self._update_learning(conn)

    def get_call_history(self, lead_id):
        """Get all call history for a lead."""
        with sqlite3.connect(self.db_path) as conn:
            conn.row_factory = sqlite3.Row
            rows = conn.execute(
                "SELECT * FROM call_log WHERE lead_id = ? ORDER BY call_date DESC",
                (lead_id,)
            ).fetchall()
            return [dict(r) for r in rows]

    def get_stats(self):
        """Get summary stats for the dashboard."""
        with sqlite3.connect(self.db_path) as conn:
            stats = {}
            
            # Total counts
            stats['total_leads'] = conn.execute("SELECT COUNT(*) FROM leads").fetchone()[0]
            stats['new_leads'] = conn.execute("SELECT COUNT(*) FROM leads WHERE status = 'new'").fetchone()[0]
            stats['called'] = conn.execute("SELECT COUNT(*) FROM leads WHERE status IN ('called', 'interested', 'not_interested', 'no_answer')").fetchone()[0]
            stats['interested'] = conn.execute("SELECT COUNT(*) FROM leads WHERE status = 'interested'").fetchone()[0]
            stats['converted'] = conn.execute("SELECT COUNT(*) FROM leads WHERE status = 'converted'").fetchone()[0]
            stats['callback_scheduled'] = conn.execute("SELECT COUNT(*) FROM leads WHERE status = 'callback_scheduled'").fetchone()[0]
            
            # Need to call today
            today = date.today().isoformat()
            stats['to_call_today'] = conn.execute(
                """SELECT COUNT(*) FROM leads WHERE status = 'new' 
                   OR (status = 'callback_scheduled' AND id IN (
                       SELECT lead_id FROM call_log WHERE follow_up_date = ?
                   ))""", (today,)
            ).fetchone()[0]
            
            # Niche breakdown
            rows = conn.execute(
                "SELECT niche, COUNT(*) as count FROM leads GROUP BY niche ORDER BY count DESC"
            ).fetchall()
            stats['by_niche'] = {r[0]: r[1] for r in rows}
            
            # Situation breakdown
            rows = conn.execute(
                "SELECT situation, COUNT(*) as count FROM leads WHERE situation != '' GROUP BY situation ORDER BY count DESC"
            ).fetchall()
            stats['by_situation'] = {r[0]: r[1] for r in rows}
            
            # Conversion rate
            total_called = stats['called'] + stats['interested'] + stats['converted'] + stats['callback_scheduled']
            stats['total_called'] = total_called
            stats['conversion_rate'] = round(stats['converted'] / total_called * 100, 1) if total_called > 0 else 0
            
            # Latest runs
            rows = conn.execute(
                "SELECT * FROM daily_runs ORDER BY run_date DESC LIMIT 7"
            ).fetchall()
            stats['recent_runs'] = [dict(r) for r in rows]
            
            return stats

    def get_lead(self, lead_id):
        """Get a single lead by ID."""
        with sqlite3.connect(self.db_path) as conn:
            conn.row_factory = sqlite3.Row
            row = conn.execute("SELECT * FROM leads WHERE id = ?", (lead_id,)).fetchone()
            return dict(row) if row else None

    def search_leads(self, query):
        """Search leads by name, phone, or address."""
        with sqlite3.connect(self.db_path) as conn:
            conn.row_factory = sqlite3.Row
            rows = conn.execute(
                """SELECT * FROM leads WHERE 
                   name LIKE ? OR phone LIKE ? OR address LIKE ? OR city LIKE ?
                   ORDER BY created_at DESC LIMIT 20""",
                (f'%{query}%', f'%{query}%', f'%{query}%', f'%{query}%')
            ).fetchall()
            return [dict(r) for r in rows]

    def get_universes(self):
        """Get distinct niche+city combinations we've researched."""
        with sqlite3.connect(self.db_path) as conn:
            rows = conn.execute(
                "SELECT niche, city, COUNT(*) as count FROM leads GROUP BY niche, city ORDER BY count DESC"
            ).fetchall()
            return [{"niche": r[0], "city": r[1], "count": r[2]} for r in rows]

    def get_follow_ups_today(self):
        """Get leads with callbacks scheduled for today."""
        today = date.today().isoformat()
        with sqlite3.connect(self.db_path) as conn:
            conn.row_factory = sqlite3.Row
            rows = conn.execute("""
                SELECT l.*, c.follow_up_time, c.notes as last_notes
                FROM leads l
                JOIN call_log c ON c.lead_id = l.id
                WHERE c.follow_up_date = ? AND l.status = 'callback_scheduled'
                ORDER BY c.follow_up_time
            """, (today,)).fetchall()
            return [dict(r) for r in rows]

    def _update_learning(self, conn):
        """Auto-update learning stats when a lead converts."""
        # Track which niche converts best
        niches = conn.execute(
            "SELECT niche, COUNT(*) as count FROM leads WHERE status = 'converted' AND niche != '' GROUP BY niche ORDER BY count DESC"
        ).fetchall()
        for n in niches:
            conn.execute(
                "INSERT OR REPLACE INTO learning (category, key, value, updated_at) VALUES (?, ?, ?, datetime('now'))",
                ('best_niche', n[0], str(n[1]))
            )
        
        # Track which situation converts best
        situations = conn.execute(
            "SELECT situation, COUNT(*) as count FROM leads WHERE status = 'converted' AND situation != '' GROUP BY situation ORDER BY count DESC"
        ).fetchall()
        for s in situations:
            conn.execute(
                "INSERT OR REPLACE INTO learning (category, key, value, updated_at) VALUES (?, ?, ?, datetime('now'))",
                ('best_situation', s[0], str(s[1]))
            )

    def get_learnings(self):
        """Get what the system has learned."""
        with sqlite3.connect(self.db_path) as conn:
            conn.row_factory = sqlite3.Row
            rows = conn.execute("SELECT * FROM learning ORDER BY category, updated_at DESC").fetchall()
            return [dict(r) for r in rows]


if __name__ == "__main__":
    # CLI for quick interaction
    import sys
    db = LeadsDB()
    
    if len(sys.argv) < 2:
        stats = db.get_stats()
        print("\n=== STEALTHO LEADS DATABASE ===\n")
        print(f"Total leads:    {stats['total_leads']}")
        print(f"New (to call):  {stats['new_leads']}")
        print(f"Called:         {stats['total_called']}")
        print(f"Interested:     {stats['interested']}")
        print(f"Converted:      {stats['converted']}")
        print(f"Callback today: {stats['to_call_today']}")
        print(f"Conversion:     {stats['conversion_rate']}%")
        print()
        if stats.get('by_niche'):
            print("By niche:")
            for n, c in stats['by_niche'].items():
                print(f"  {n}: {c}")
        print()
        if stats.get('recent_runs'):
            print("Recent runs:")
            for r in stats['recent_runs'][:5]:
                print(f"  {r['run_date']}: {r['niche']} in {r['city']} ({r['situation']}) - {r['new_leads']} new of {r['leads_found']} found")
        print()
    
    elif sys.argv[1] == "today":
        leads = db.get_leads_to_call(limit=30)
        print(f"\n=== LEADs TO CALL TODAY ({len(leads)}) ===\n")
        for i, lead in enumerate(leads, 1):
            pri = lead.get('priority', 'med').upper()
            ws = "❌" if not lead.get('has_website') else "✅"
            score = lead.get('score', '?')
            name = lead.get('name', '?')
            phone = lead.get('phone', 'No phone')
            print(f"  {i}. [{pri}] [{ws}] (Score: {score}) {name}")
            print(f"     📞 {phone} | {lead.get('city', '')} | {lead.get('niche', '')}")
            if lead.get('pitch_angle'):
                print(f"     🎯 {lead['pitch_angle'][:100]}")
            print()
    
    elif sys.argv[1] == "followups":
        leads = db.get_follow_ups_today()
        print(f"\n=== FOLLOW-UPS TODAY ({len(leads)}) ===\n")
        for lead in leads:
            print(f"  {lead['name']} — {lead.get('phone', 'No phone')}")
            print(f"     Last notes: {lead.get('last_notes', 'N/A')}")
            if lead.get('follow_up_time'):
                print(f"     Call at: {lead['follow_up_time']}")
            print()
    
    elif sys.argv[1] == "mark" and len(sys.argv) >= 4:
        lead_id = int(sys.argv[2])
        outcome = sys.argv[3]
        notes = sys.argv[4] if len(sys.argv) > 4 else ""
        db.mark_called(lead_id, outcome, notes)
        print(f"✅ Lead {lead_id} marked as '{outcome}'")
    
    elif sys.argv[1] == "learnings":
        learnings = db.get_learnings()
        print("\n=== WHAT THE SYSTEM HAS LEARNED ===\n")
        for l in learnings:
            print(f"  {l['category']}: {l['key']} = {l['value']}")
        print()
    
    elif sys.argv[1] == "search" and len(sys.argv) >= 3:
        leads = db.search_leads(sys.argv[2])
        print(f"\n=== SEARCH RESULTS: '{sys.argv[2]}' ({len(leads)} found) ===\n")
        for lead in leads:
            print(f"  [{lead['status']}] {lead['name']} — {lead.get('phone', 'No phone')}")
            print(f"     {lead.get('city', '')} | {lead.get('niche', '')} | {lead.get('situation', '')}")
            print()
