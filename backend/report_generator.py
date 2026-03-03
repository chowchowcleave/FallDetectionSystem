from fpdf import FPDF
from datetime import datetime
from pathlib import Path

class FallReportPDF(FPDF):
    def __init__(self, date_from, date_to, org_name="CAIRE Healthcare"):
        super().__init__()
        self.date_from = date_from
        self.date_to = date_to
        self.org_name = org_name
        self.set_margins(20, 20, 20)
        self.set_auto_page_break(auto=True, margin=20)

    def header(self):
        self.set_font('Helvetica', 'B', 11)
        self.set_text_color(44, 62, 80)
        self.cell(0, 8, f'{self.org_name} - Fall Detection Report', align='L')
        self.set_font('Helvetica', '', 9)
        self.set_text_color(127, 140, 141)
        self.cell(0, 8, f'Generated {datetime.now().strftime("%b %d, %Y %I:%M %p")}', align='R')
        self.ln(4)
        self.set_draw_color(220, 220, 220)
        self.set_line_width(0.3)
        self.line(20, self.get_y(), 190, self.get_y())
        self.ln(6)

    def footer(self):
        self.set_y(-15)
        self.set_font('Helvetica', '', 8)
        self.set_text_color(127, 140, 141)
        self.cell(0, 10, f'Page {self.page_no()}', align='C')

    def section_title(self, title):
        self.set_font('Helvetica', 'B', 13)
        self.set_text_color(44, 62, 80)
        self.cell(0, 8, title, ln=True)
        self.set_draw_color(52, 152, 219)
        self.set_line_width(0.5)
        self.line(20, self.get_y(), 190, self.get_y())
        self.ln(6)

    def stat_cards(self, stats):
        card_w = 40
        card_h = 22
        gap = 4
        colors = [
            (52, 152, 219),
            (231, 76, 60),
            (243, 156, 18),
            (46, 204, 113),
        ]
        labels = ['Total Falls', "Today's Falls", 'This Week', 'Last Fall']
        values = [
            str(stats.get('total_falls', 0)),
            str(stats.get('today_falls', 0)),
            str(stats.get('week_falls', 0)),
            stats.get('last_fall_fmt', 'None'),
        ]

        x_start = self.get_x()
        y_start = self.get_y()

        for i in range(4):
            x = x_start + i * (card_w + gap)
            r, g, b = colors[i]
            self.set_fill_color(r, g, b)
            self.rect(x, y_start, card_w, card_h, style='F')
            self.set_xy(x, y_start + 3)
            self.set_font('Helvetica', '', 8)
            self.set_text_color(255, 255, 255)
            self.set_x(x)
            self.cell(card_w, 5, labels[i], align='C')
            self.set_xy(x, y_start + 10)
            self.set_font('Helvetica', 'B', 13)
            self.set_text_color(255, 255, 255)
            self.set_x(x)
            self.cell(card_w, 8, values[i], align='C')

        self.ln(card_h + 10)

    def falls_per_day_table(self, data):
        if not data:
            self.set_font('Helvetica', 'I', 10)
            self.set_text_color(127, 140, 141)
            self.cell(0, 8, 'No data for selected date range.', ln=True)
            self.ln(4)
            return

        headers = ['Date', 'Falls']
        col_widths = [80, 80]

        self.set_fill_color(44, 62, 80)
        self.set_text_color(255, 255, 255)
        self.set_font('Helvetica', 'B', 10)
        for i, h in enumerate(headers):
            self.cell(col_widths[i], 9, h, border=0, fill=True, align='C')
        self.ln()

        self.set_font('Helvetica', '', 10)
        for idx, row in enumerate(data):
            fill = idx % 2 == 0
            self.set_fill_color(245, 247, 250) if fill else self.set_fill_color(255, 255, 255)
            self.set_text_color(44, 62, 80)
            self.cell(col_widths[0], 8, row['day'], border=0, fill=True, align='C')
            self.cell(col_widths[1], 8, str(row['count']), border=0, fill=True, align='C')
            self.ln()
        self.ln(6)

    def detections_table(self, detections):
        if not detections:
            self.set_font('Helvetica', 'I', 10)
            self.set_text_color(127, 140, 141)
            self.cell(0, 8, 'No detections in selected date range.', ln=True)
            self.ln(4)
            return

        headers = ['#', 'Timestamp', 'Confidence', 'Source']
        col_widths = [15, 95, 35, 35]

        self.set_fill_color(44, 62, 80)
        self.set_text_color(255, 255, 255)
        self.set_font('Helvetica', 'B', 10)
        for i, h in enumerate(headers):
            self.cell(col_widths[i], 9, h, border=0, fill=True, align='C')
        self.ln()

        self.set_font('Helvetica', '', 9)
        for idx, det in enumerate(detections):
            fill = idx % 2 == 0
            self.set_fill_color(245, 247, 250) if fill else self.set_fill_color(255, 255, 255)
            self.set_text_color(44, 62, 80)

            ts = det.get('timestamp', '')
            try:
                ts = datetime.fromisoformat(ts).strftime('%b %d, %Y %I:%M %p')
            except:
                pass

            conf = f"{det.get('confidence', 0) * 100:.1f}%"
            source = det.get('camera_source', '-').capitalize()

            self.cell(col_widths[0], 8, str(idx + 1), border=0, fill=True, align='C')
            self.cell(col_widths[1], 8, ts, border=0, fill=True, align='L')
            self.cell(col_widths[2], 8, conf, border=0, fill=True, align='C')
            self.cell(col_widths[3], 8, source, border=0, fill=True, align='C')
            self.ln()
        self.ln(6)


def generate_report(date_from, date_to, summary, falls_per_day, detections, org_name="CAIRE Healthcare"):
    pdf = FallReportPDF(date_from, date_to, org_name)
    pdf.add_page()

    pdf.set_font('Helvetica', 'B', 18)
    pdf.set_text_color(44, 62, 80)
    pdf.cell(0, 10, 'Fall Detection Report', ln=True)
    pdf.set_font('Helvetica', '', 10)
    pdf.set_text_color(127, 140, 141)
    pdf.cell(0, 6, f'Period: {date_from} to {date_to}', ln=True)
    pdf.ln(6)

    pdf.section_title('Summary')
    pdf.stat_cards(summary)

    pdf.section_title('Falls Per Day')
    pdf.falls_per_day_table(falls_per_day)

    pdf.section_title(f'All Detections in Range ({len(detections)} total)')
    pdf.detections_table(detections)

    return pdf.output()