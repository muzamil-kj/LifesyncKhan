import sys
import json
import re
from fpdf import FPDF
from datetime import datetime
import google.generativeai as genai

# Configure Google Generative AI
genai.configure(api_key="AIzaSyASbtmGTMfPqJjbRWNlti0vjLnviz_fP-s")

class PDF(FPDF):
    def __init__(self):
        super().__init__()
        self.set_left_margin(20)
        self.set_right_margin(20)

    def header(self):
        self.set_font('Helvetica', 'B', 16)
        
        self.ln(10)

    def write_with_formatting(self, text):
        lines = text.split("\n")
        for line in lines:
            stripped_line = line.strip()
            if not stripped_line:
                self.ln(5)
                continue
            parts = re.split(r"(\*\*.*?\*\*|\*.*?\*)", stripped_line)
            for part in parts:
                if part.startswith("**") and part.endswith("**"):
                    self.set_font("Helvetica", "B", 12)
                    self.write(6, part[2:-2])
                    self.set_font("Helvetica", "", 12)
                elif part.startswith("*") and part.endswith("*"):
                    self.set_font("Helvetica", "I", 12)
                    self.write(6, part[1:-1])
                    self.set_font("Helvetica", "", 12)
                else:
                    self.write(6, part)
            self.ln(8)

def parse_mongodb_date(date_obj):
    """Handle MongoDB date format which can be either ISO string or {'$date': 'ISO string'}"""
    if isinstance(date_obj, dict) and '$date' in date_obj:
        date_str = date_obj['$date']
    elif isinstance(date_obj, str):
        date_str = date_obj
    else:
        return None
        
    try:
        # Remove Z if present and parse
        date_str = date_str.replace('Z', '')
        if '.' in date_str:  # Handle milliseconds
            return datetime.fromisoformat(date_str.split('.')[0])
        return datetime.fromisoformat(date_str)
    except (ValueError, AttributeError, TypeError):
        return None

def get_date_range(mood_data):
    if not mood_data:
        return "the past week"
    
    dates = []
    for entry in mood_data:
        date_value = entry.get("date")
        parsed_date = parse_mongodb_date(date_value)
        if parsed_date:
            dates.append(parsed_date)
    
    if not dates:
        return "the past week"
    
    min_date = min(dates).strftime("%B %d")
    max_date = max(dates).strftime("%B %d, %Y")
    return f"{min_date} to {max_date}"

def process_mood_data(mood_data):
    processed = []
    for entry in mood_data:
        date_value = entry.get("date")
        mood_value = entry.get("value", 0)
        
        parsed_date = parse_mongodb_date(date_value)
        if parsed_date:
            processed.append({
                "date": parsed_date.strftime("%Y-%m-%d"),
                "value": mood_value,
                "mood_label": get_mood_label(mood_value)
            })
    return processed

def get_mood_label(value):
    mood_labels = {
        0: "Very Poor",
        1: "Poor",
        2: "Fair",
        3: "Good",
        4: "Very Good",
        5: "Excellent"
    }
    return mood_labels.get(value, "Unknown")

def process_chats_data(chats_data):
    messages = []
    if isinstance(chats_data, list):
        for chat in chats_data:
            if isinstance(chat, dict) and 'messages' in chat:
                messages.extend(chat['messages'])
    elif isinstance(chats_data, dict) and 'messages' in chats_data:
        messages = chats_data['messages']
    return messages

def generate_ai_report(first_name, mood_data, active_time_data, messages):
    date_range = get_date_range(mood_data)
    
    prompt = f"""
Generate a detailed weekly LifeSync report for {first_name} covering {date_range}.

**1. Mood Overview:**
Analyze this mood data: {json.dumps(mood_data, indent=2)}
Provide insights about mood patterns and changes.

**2. Chat Insights:**
Analyze these chat messages: {json.dumps(messages, indent=2)}
(total messages: {len(messages)})
Identify key themes and topics discussed.

**3. Activity Analysis:**
Review this activity data: {json.dumps(active_time_data, indent=2)}
Provide insights about activity patterns.

**4. Recommendations:**
Provide 3-5 personalized wellness suggestions based on the data.

**5. Closing Message:**
End with an encouraging note.
"""
    
    try:
        model = genai.GenerativeModel("gemini-1.5-flash")
        response = model.generate_content(prompt)
        return response.text if response and response.text else None
    except Exception as e:
        print(f"Gemini API error: {e}", file=sys.stderr)
        return None

def generate_pdf(first_name, content):
    pdf = PDF()
    pdf.add_page()
    pdf.set_auto_page_break(auto=True, margin=15)
    
    # Header
    pdf.set_font('Helvetica', 'B', 16)
    pdf.cell(0, 10, f"LifeSync Weekly Report - {first_name}", 0, 1, 'C')
    pdf.ln(10)
    
    # Date
    pdf.set_font('Helvetica', '', 12)
    pdf.cell(0, 10, f"Date: {datetime.now().strftime('%B %d, %Y')}", 0, 1)
    pdf.ln(10)
    
    # Content
    pdf.set_font("Helvetica", "", 12)
    safe_content = content.replace("\u2019", "'").replace("\u2013", "-")
    pdf.write_with_formatting(safe_content)
    
    return pdf.output(dest="S").encode("latin1", "replace")

def main():
    try:
        data = json.load(sys.stdin)
        print("Python script received data:", json.dumps({
            "displayName": data.get("displayName"),
            "progresses": bool(data.get("progresses")),
            "chats": len(data.get("chats", [])),
            "moodData": len(data.get("progresses", {}).get("moodData", [])),
            "activeTime": len(data.get("progresses", {}).get("activeTimePerDay", []))
        }, indent=2))
    except Exception as e:
        print(f"❌ Failed to read input JSON: {e}", file=sys.stderr)
        sys.exit(1)

    display_name = data.get("displayName", "User")
    first_name = display_name.split(" ")[0] if display_name else "User"
    
    progresses = data.get("progresses", {})
    mood_data = process_mood_data(progresses.get("moodData", []))
    active_time_data = progresses.get("activeTimePerDay", [])
    messages = process_chats_data(data.get("chats", []))
    
    # Generate AI report content
    report_content = generate_ai_report(first_name, mood_data, active_time_data, messages)
    
    # Fallback if AI fails
    if not report_content:
        report_content = f"""
Hi {first_name},

**1. Mood Overview:**
You recorded {len(mood_data)} mood entries this period.
{format_mood_summary(mood_data)}

**2. Chat Insights:**
You had {len(messages)} messages with your LifeSync assistant.

**3. Activity Analysis:**
You were active on {len(active_time_data)} days this period.

**4. Recommendations:**
- Continue tracking your mood patterns
- Review your chat history for insights
- Maintain consistent activity levels

**5. Closing Message:**
Your wellness journey is important to us!
"""
    
    # Generate PDF
    pdf = generate_pdf(first_name, report_content)
    sys.stdout.buffer.write(pdf)

def format_mood_summary(mood_data):
    if not mood_data:
        return "No mood data available."
    
    mood_counts = {}
    for entry in mood_data:
        label = entry.get("mood_label", "Unknown")
        mood_counts[label] = mood_counts.get(label, 0) + 1
    
    summary = []
    for mood, count in mood_counts.items():
        summary.append(f"- {count} {mood} mood entries")
    
    return "\n".join(summary)

if __name__ == "__main__":
    main()