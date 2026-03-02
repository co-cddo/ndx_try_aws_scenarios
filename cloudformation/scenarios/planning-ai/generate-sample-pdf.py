#!/usr/bin/env python3
"""
Generate a comprehensive sample planning application PDF for the NDX:Try
Planning AI demo. Produces a realistic multi-page UK planning application
with deliberately absurd supplementary content mixed in.

Outputs:
  - sample-planning-application.pdf  (the PDF file)
  - sample_pdf_base64.txt            (base64-encoded PDF for template embedding)
  - sample_document_text.txt         (full text content for Bedrock analysis)

Usage:
  pip install fpdf2
  python3 generate-sample-pdf.py
"""

import base64
import math
import os
import textwrap

from fpdf import FPDF


class PlanningApplicationPDF(FPDF):
    """Custom PDF class for planning application documents."""

    def header(self):
        if self.page_no() == 1:
            return  # Cover page has its own header
        self.set_font("Helvetica", "I", 8)
        self.set_text_color(128, 128, 128)
        self.cell(0, 5, "Testville District Council - Planning Application PA/2024/00456", align="L")
        self.cell(0, 5, f"Page {self.page_no()}", align="R", new_x="LMARGIN", new_y="NEXT")
        self.line(10, 18, 200, 18)
        self.ln(5)

    def footer(self):
        self.set_y(-15)
        self.set_font("Helvetica", "I", 7)
        self.set_text_color(160, 160, 160)
        self.cell(0, 10, "OFFICIAL - Planning Application PA/2024/00456 - Testville District Council", align="C")

    def section_heading(self, text, size=14):
        self.set_font("Helvetica", "B", size)
        self.set_text_color(0, 51, 102)
        self.cell(0, 10, text, new_x="LMARGIN", new_y="NEXT")
        self.set_draw_color(0, 51, 102)
        self.line(10, self.get_y(), 200, self.get_y())
        self.ln(3)
        self.set_text_color(0, 0, 0)

    def sub_heading(self, text):
        self.set_font("Helvetica", "B", 11)
        self.set_text_color(51, 51, 51)
        self.cell(0, 8, text, new_x="LMARGIN", new_y="NEXT")
        self.set_text_color(0, 0, 0)

    def field_row(self, label, value):
        self.set_font("Helvetica", "B", 10)
        self.cell(55, 7, label + ":", new_x="RIGHT")
        self.set_font("Helvetica", "", 10)
        self.multi_cell(0, 7, value, new_x="LMARGIN", new_y="NEXT")

    def body_text(self, text):
        self.set_font("Helvetica", "", 10)
        self.multi_cell(0, 6, text, new_x="LMARGIN", new_y="NEXT")
        self.ln(2)


def draw_existing_floor_plan(pdf):
    """Draw a simple existing ground floor plan programmatically."""
    ox, oy = 30, 50  # origin
    scale = 1.8

    # Title
    pdf.set_font("Helvetica", "B", 10)
    pdf.set_text_color(0, 0, 0)
    pdf.text(ox, oy - 10, "EXISTING GROUND FLOOR PLAN")
    pdf.set_font("Helvetica", "", 8)
    pdf.text(ox, oy - 5, "Scale: 1:100 (approx)")

    pdf.set_draw_color(0, 0, 0)
    pdf.set_line_width(0.4)

    # Outer walls - main house footprint
    w, h = 50 * scale, 40 * scale
    pdf.rect(ox, oy, w, h)

    # Internal walls
    # Kitchen / Living division (vertical)
    kw = 22 * scale
    pdf.line(ox + kw, oy, ox + kw, oy + 25 * scale)

    # Hallway (horizontal)
    hall_y = 25 * scale
    pdf.line(ox, oy + hall_y, ox + w, oy + hall_y)

    # Stairs area
    stairs_x = ox + 18 * scale
    stairs_w = 8 * scale
    pdf.rect(stairs_x, oy + hall_y, stairs_w, 15 * scale)
    # Stair lines
    for i in range(8):
        sy = oy + hall_y + (i * 15 * scale / 8)
        pdf.line(stairs_x, sy, stairs_x + stairs_w, sy)

    # Door openings (gaps in walls)
    pdf.set_draw_color(255, 255, 255)
    pdf.set_line_width(1.5)
    # Front door
    pdf.line(ox + 12 * scale, oy + h, ox + 16 * scale, oy + h)
    # Kitchen door
    pdf.line(ox + kw, oy + 10 * scale, ox + kw, oy + 14 * scale)

    pdf.set_draw_color(0, 0, 0)
    pdf.set_line_width(0.4)

    # Window markings (double lines)
    for wx in [5, 12, 30, 42]:
        wy = oy
        pdf.line(ox + wx * scale, wy - 1, ox + (wx + 4) * scale, wy - 1)
        pdf.line(ox + wx * scale, wy + 1, ox + (wx + 4) * scale, wy + 1)

    # Room labels
    pdf.set_font("Helvetica", "", 7)
    pdf.text(ox + 5 * scale, oy + 12 * scale, "KITCHEN")
    pdf.text(ox + 5 * scale, oy + 15 * scale, "3.8m x 4.2m")
    pdf.text(ox + 28 * scale, oy + 12 * scale, "LIVING ROOM")
    pdf.text(ox + 28 * scale, oy + 15 * scale, "5.0m x 4.2m")
    pdf.text(ox + 5 * scale, oy + 32 * scale, "WC")
    pdf.text(ox + 30 * scale, oy + 32 * scale, "HALLWAY")

    # North arrow
    nx, ny = ox + w + 10, oy + 5
    pdf.set_font("Helvetica", "B", 8)
    pdf.text(nx - 1, ny - 5, "N")
    pdf.line(nx, ny, nx, ny + 12)
    pdf.line(nx, ny, nx - 3, ny + 5)
    pdf.line(nx, ny, nx + 3, ny + 5)

    # Dimensions
    pdf.set_font("Helvetica", "", 6)
    pdf.text(ox + w / 2 - 5, oy - 2, f"{50 * scale / scale:.0f}m (approx)")


def draw_proposed_floor_plan(pdf):
    """Draw proposed ground floor plan with extension."""
    ox, oy = 30, 50
    scale = 1.8

    pdf.set_font("Helvetica", "B", 10)
    pdf.set_text_color(0, 0, 0)
    pdf.text(ox, oy - 10, "PROPOSED GROUND FLOOR PLAN")
    pdf.set_font("Helvetica", "", 8)
    pdf.text(ox, oy - 5, "Scale: 1:100 (approx)")

    pdf.set_draw_color(0, 0, 0)
    pdf.set_line_width(0.4)

    # Original house
    w, h = 50 * scale, 40 * scale
    pdf.rect(ox, oy, w, h)

    # SIDE EXTENSION (two storey) - right side
    ext_w = 15 * scale
    pdf.set_draw_color(200, 0, 0)  # Red for new work
    pdf.set_line_width(0.6)
    pdf.rect(ox + w, oy, ext_w, h)

    # REAR EXTENSION (single storey) - bottom
    rear_h = 12 * scale
    pdf.rect(ox, oy + h, w + ext_w, rear_h)

    pdf.set_draw_color(0, 0, 0)
    pdf.set_line_width(0.4)

    # Internal walls (existing)
    kw = 22 * scale
    pdf.line(ox + kw, oy, ox + kw, oy + 25 * scale)
    hall_y = 25 * scale
    pdf.line(ox, oy + hall_y, ox + w, oy + hall_y)

    # Stairs
    stairs_x = ox + 18 * scale
    stairs_w = 8 * scale
    pdf.rect(stairs_x, oy + hall_y, stairs_w, 15 * scale)
    for i in range(8):
        sy = oy + hall_y + (i * 15 * scale / 8)
        pdf.line(stairs_x, sy, stairs_x + stairs_w, sy)

    # New internal walls (red)
    pdf.set_draw_color(200, 0, 0)
    # Division in side extension
    pdf.line(ox + w, oy + hall_y, ox + w + ext_w, oy + hall_y)
    # Division between rear extension rooms
    pdf.line(ox + 25 * scale, oy + h, ox + 25 * scale, oy + h + rear_h)

    pdf.set_draw_color(0, 0, 0)

    # Room labels
    pdf.set_font("Helvetica", "", 7)
    pdf.text(ox + 5 * scale, oy + 12 * scale, "KITCHEN")
    pdf.text(ox + 28 * scale, oy + 12 * scale, "LIVING ROOM")
    pdf.text(ox + 30 * scale, oy + 32 * scale, "HALLWAY")

    # New rooms (red labels)
    pdf.set_text_color(200, 0, 0)
    pdf.set_font("Helvetica", "B", 7)
    pdf.text(ox + w + 2 * scale, oy + 12 * scale, "STUDY")
    pdf.text(ox + w + 2 * scale, oy + 15 * scale, "2.5m x 4.2m")
    pdf.text(ox + w + 2 * scale, oy + 32 * scale, "UTILITY")
    pdf.text(ox + 5 * scale, oy + h + 6 * scale, "DINING AREA")
    pdf.text(ox + 5 * scale, oy + h + 9 * scale, "4.2m x 2.0m")
    pdf.text(ox + 30 * scale, oy + h + 6 * scale, "FAMILY ROOM")
    pdf.text(ox + 30 * scale, oy + h + 9 * scale, "5.8m x 2.0m")
    pdf.set_text_color(0, 0, 0)

    # Legend
    ly = oy + h + rear_h + 10
    pdf.set_font("Helvetica", "", 8)
    pdf.set_draw_color(0, 0, 0)
    pdf.rect(ox, ly, 5, 3)
    pdf.text(ox + 7, ly + 2.5, "Existing structure")
    pdf.set_draw_color(200, 0, 0)
    pdf.rect(ox + 50, ly, 5, 3)
    pdf.set_draw_color(0, 0, 0)
    pdf.text(ox + 57, ly + 2.5, "Proposed extension (shown in red)")

    # North arrow
    nx, ny = ox + w + ext_w + 10, oy + 5
    pdf.set_font("Helvetica", "B", 8)
    pdf.text(nx - 1, ny - 5, "N")
    pdf.line(nx, ny, nx, ny + 12)
    pdf.line(nx, ny, nx - 3, ny + 5)
    pdf.line(nx, ny, nx + 3, ny + 5)


def draw_elevations(pdf):
    """Draw simple front, side, and rear elevations."""
    ox = 25

    def draw_house_elevation(x, y, label, width, height, has_extension=False, ext_w=0):
        pdf.set_font("Helvetica", "B", 8)
        pdf.text(x, y - 3, label)
        pdf.set_draw_color(0, 0, 0)
        pdf.set_line_width(0.4)

        # Main house
        pdf.rect(x, y, width, height)
        # Roof (triangle)
        mid = x + width / 2
        pdf.line(x, y, mid, y - 12)
        pdf.line(mid, y - 12, x + width, y)

        # Windows (2 upstairs, 2 downstairs)
        ww, wh = 8, 6
        for wx in [x + 8, x + width - 16]:
            pdf.rect(wx, y + 5, ww, wh)  # upstairs
            pdf.rect(wx, y + height - 14, ww, wh)  # downstairs
            # Window cross
            pdf.line(wx + ww / 2, y + 5, wx + ww / 2, y + 5 + wh)
            pdf.line(wx + ww / 2, y + height - 14, wx + ww / 2, y + height - 14 + wh)

        # Door
        pdf.rect(x + width / 2 - 4, y + height - 14, 8, 14)

        # Extension (dashed outline)
        if has_extension and ext_w > 0:
            pdf.set_draw_color(200, 0, 0)
            pdf.set_line_width(0.5)
            ex = x + width
            pdf.rect(ex, y + 5, ext_w, height - 5)
            # Extension roof
            pdf.line(ex, y + 5, ex + ext_w / 2, y - 4)
            pdf.line(ex + ext_w / 2, y - 4, ex + ext_w, y + 5)
            pdf.set_draw_color(0, 0, 0)
            pdf.set_line_width(0.4)

        # Ground line
        pdf.set_line_width(0.6)
        gx = x - 5
        gw = width + ext_w + 10
        pdf.line(gx, y + height, gx + gw, y + height)
        pdf.set_line_width(0.4)

        # Height annotation
        pdf.set_font("Helvetica", "", 6)
        ax = x + width + ext_w + 8
        pdf.line(ax, y + height, ax, y - 12)
        pdf.line(ax - 2, y + height, ax + 2, y + height)
        pdf.line(ax - 2, y - 12, ax + 2, y - 12)
        pdf.text(ax + 2, y + height / 2, "7.8m ridge")

    y1 = 45
    draw_house_elevation(ox, y1, "FRONT ELEVATION", 60, 35, has_extension=True, ext_w=20)

    y2 = y1 + 70
    draw_house_elevation(ox, y2, "SIDE ELEVATION (East)", 45, 35)

    y3 = y2 + 70
    pdf.set_font("Helvetica", "B", 8)
    pdf.text(ox, y3 - 3, "REAR ELEVATION")
    pdf.set_draw_color(0, 0, 0)
    pdf.rect(ox, y3, 80, 35)
    # Rear extension (single storey)
    pdf.set_draw_color(200, 0, 0)
    pdf.rect(ox, y3 + 20, 80, 18)
    # Flat roof line
    pdf.line(ox, y3 + 20, ox + 80, y3 + 20)
    # Bi-fold doors
    for i in range(5):
        dx = ox + 8 + i * 13
        pdf.rect(dx, y3 + 22, 10, 14)
    pdf.set_draw_color(0, 0, 0)
    pdf.set_line_width(0.6)
    pdf.line(ox - 5, y3 + 35 + 18, ox + 85, y3 + 35 + 18)
    pdf.set_line_width(0.4)


def draw_site_plan(pdf):
    """Draw a site location plan."""
    ox, oy = 25, 45
    pdf.set_font("Helvetica", "B", 10)
    pdf.text(ox, oy - 10, "SITE LOCATION PLAN")
    pdf.set_font("Helvetica", "", 8)
    pdf.text(ox, oy - 5, "Scale: 1:1250 (approx) - Site outlined in red")

    pdf.set_draw_color(180, 180, 180)
    pdf.set_line_width(0.2)

    # Street grid
    # Elm Grove (horizontal road)
    road_y = oy + 55
    pdf.set_fill_color(230, 230, 230)
    pdf.rect(ox - 5, road_y, 170, 12, style="F")
    pdf.set_font("Helvetica", "I", 7)
    pdf.set_text_color(100, 100, 100)
    pdf.text(ox + 60, road_y + 8, "E L M   G R O V E")

    # Cross street
    cross_x = ox + 120
    pdf.rect(cross_x, oy - 5, 10, 160, style="F")
    pdf.text(cross_x + 1, oy + 40, "O")
    pdf.text(cross_x + 1, oy + 45, "A")
    pdf.text(cross_x + 1, oy + 50, "K")

    pdf.set_text_color(0, 0, 0)

    # Houses - north side of Elm Grove
    house_w = 12
    house_h = 18
    for i in range(9):
        hx = ox + i * 13
        hy = oy + 15
        if hx + house_w > cross_x:
            break
        pdf.set_draw_color(160, 160, 160)
        pdf.set_line_width(0.2)
        pdf.rect(hx, hy, house_w, house_h)
        # Garden
        pdf.set_draw_color(200, 200, 200)
        pdf.rect(hx, hy - 12, house_w, 12)
        # Number
        pdf.set_font("Helvetica", "", 5)
        num = (i + 1) * 2
        pdf.text(hx + 3, hy + 10, str(num))

    # Houses - south side
    for i in range(9):
        hx = ox + i * 13
        hy = road_y + 14
        if hx + house_w > cross_x:
            break
        pdf.set_draw_color(160, 160, 160)
        pdf.set_line_width(0.2)
        pdf.rect(hx, hy, house_w, house_h)
        pdf.rect(hx, hy + house_h, house_w, 12)
        pdf.set_font("Helvetica", "", 5)
        num = (i + 1) * 2 - 1
        pdf.text(hx + 3, hy + 10, str(num))

    # Highlight No. 12 (6th house on north side, index 5)
    site_x = ox + 5 * 13
    site_y = oy + 3  # include garden
    site_w = house_w + 2
    site_h = house_h + 14

    pdf.set_draw_color(255, 0, 0)
    pdf.set_line_width(0.8)
    pdf.rect(site_x - 1, site_y, site_w, site_h)

    # Label
    pdf.set_font("Helvetica", "B", 7)
    pdf.set_text_color(255, 0, 0)
    pdf.text(site_x - 1, site_y - 2, "APPLICATION SITE")
    pdf.text(site_x - 1, site_y + site_h + 4, "12 Elm Grove")

    pdf.set_text_color(0, 0, 0)

    # North arrow
    nx, ny = ox + 155, oy + 5
    pdf.set_font("Helvetica", "B", 9)
    pdf.set_draw_color(0, 0, 0)
    pdf.set_line_width(0.5)
    pdf.text(nx - 1, ny - 5, "N")
    pdf.line(nx, ny, nx, ny + 15)
    pdf.line(nx, ny, nx - 4, ny + 6)
    pdf.line(nx, ny, nx + 4, ny + 6)

    # Scale bar
    pdf.set_font("Helvetica", "", 6)
    pdf.set_line_width(0.4)
    sy = oy + 140
    pdf.line(ox, sy, ox + 40, sy)
    pdf.line(ox, sy - 2, ox, sy + 2)
    pdf.line(ox + 40, sy - 2, ox + 40, sy + 2)
    pdf.text(ox + 15, sy + 5, "approx 50m")


def draw_childs_drawing(pdf):
    """Draw a crude child's drawing style house."""
    ox, oy = 55, 70
    pdf.set_draw_color(255, 100, 0)  # Orange crayon
    pdf.set_line_width(1.5)

    # House body
    pdf.rect(ox, oy, 80, 60)

    # Roof
    pdf.line(ox - 5, oy, ox + 40, oy - 30)
    pdf.line(ox + 40, oy - 30, ox + 85, oy)

    # Door (slightly wonky)
    pdf.set_draw_color(0, 100, 200)
    pdf.rect(ox + 30, oy + 25, 18, 35)
    # Door handle
    pdf.set_fill_color(255, 200, 0)
    pdf.ellipse(ox + 43, oy + 42, 3, 3, style="F")

    # Windows (not quite aligned)
    pdf.set_draw_color(0, 150, 255)
    pdf.rect(ox + 8, oy + 8, 18, 15)
    pdf.rect(ox + 55, oy + 10, 16, 14)
    # Window cross lines
    pdf.line(ox + 17, oy + 8, ox + 17, oy + 23)
    pdf.line(ox + 8, oy + 15, ox + 26, oy + 15)
    pdf.line(ox + 63, oy + 10, ox + 63, oy + 24)
    pdf.line(ox + 55, oy + 17, ox + 71, oy + 17)

    # Sun
    pdf.set_draw_color(255, 200, 0)
    pdf.set_fill_color(255, 220, 0)
    pdf.ellipse(ox + 100, oy - 45, 20, 20, style="FD")
    # Sun rays
    for angle in range(0, 360, 30):
        rad = math.radians(angle)
        sx = ox + 110 + 14 * math.cos(rad)
        sy = oy - 35 + 14 * math.sin(rad)
        ex = ox + 110 + 20 * math.cos(rad)
        ey = oy - 35 + 20 * math.sin(rad)
        pdf.line(sx, sy, ex, ey)

    # Flowers
    pdf.set_draw_color(0, 180, 0)
    for fx in [ox - 10, ox + 90, ox + 100]:
        # Stem
        pdf.line(fx, oy + 60, fx, oy + 45)
        # Flower head
        pdf.set_fill_color(255, 50, 150)
        pdf.ellipse(fx - 4, oy + 39, 8, 8, style="F")

    # Cat (Mr Whiskers tribute)
    cx, cy = ox + 115, oy + 40
    pdf.set_draw_color(100, 100, 100)
    pdf.set_line_width(1.0)
    # Body
    pdf.ellipse(cx, cy, 12, 8, style="D")
    # Head
    pdf.ellipse(cx + 10, cy - 6, 8, 7, style="D")
    # Ears
    pdf.line(cx + 12, cy - 12, cx + 10, cy - 6)
    pdf.line(cx + 16, cy - 12, cx + 14, cy - 6)
    # Tail
    pdf.line(cx - 6, cy, cx - 12, cy - 8)

    # Label
    pdf.set_draw_color(150, 0, 200)
    pdf.set_line_width(0.8)
    pdf.set_font("Helvetica", "B", 12)
    pdf.set_text_color(150, 0, 200)
    pdf.text(ox - 5, oy + 85, "MY HOUSE WITH THE NEW BIT")
    pdf.set_font("Helvetica", "", 10)
    pdf.text(ox + 10, oy + 95, "by Lily Johnson, age 7")
    pdf.set_text_color(0, 0, 0)


def generate_pdf():
    """Generate the complete planning application PDF."""
    pdf = PlanningApplicationPDF()
    pdf.set_auto_page_break(auto=True, margin=20)
    all_text = []

    # =========================================================================
    # PAGE 1: Cover / Application Summary
    # =========================================================================
    pdf.add_page()
    # Council header
    pdf.set_font("Helvetica", "B", 22)
    pdf.set_text_color(0, 51, 102)
    pdf.cell(0, 15, "TESTVILLE DISTRICT COUNCIL", align="C", new_x="LMARGIN", new_y="NEXT")
    pdf.set_font("Helvetica", "", 12)
    pdf.set_text_color(100, 100, 100)
    pdf.cell(0, 8, "Planning & Development Services", align="C", new_x="LMARGIN", new_y="NEXT")
    pdf.ln(5)
    pdf.set_draw_color(0, 51, 102)
    pdf.set_line_width(1)
    pdf.line(30, pdf.get_y(), 180, pdf.get_y())
    pdf.ln(10)

    pdf.set_font("Helvetica", "B", 18)
    pdf.set_text_color(0, 0, 0)
    pdf.cell(0, 12, "APPLICATION FOR PLANNING PERMISSION", align="C", new_x="LMARGIN", new_y="NEXT")
    pdf.set_font("Helvetica", "", 14)
    pdf.cell(0, 10, "Householder Development", align="C", new_x="LMARGIN", new_y="NEXT")
    pdf.ln(15)

    # Application summary box
    pdf.set_draw_color(0, 51, 102)
    pdf.set_line_width(0.5)
    box_y = pdf.get_y()
    pdf.rect(20, box_y, 170, 85)
    pdf.ln(5)

    pdf.set_x(25)
    pdf.set_font("Helvetica", "B", 11)
    pdf.cell(50, 8, "Application Reference:")
    pdf.set_font("Helvetica", "", 11)
    pdf.cell(0, 8, "PA/2024/00456", new_x="LMARGIN", new_y="NEXT")

    pdf.set_x(25)
    pdf.set_font("Helvetica", "B", 11)
    pdf.cell(50, 8, "Date Received:")
    pdf.set_font("Helvetica", "", 11)
    pdf.cell(0, 8, "28 November 2024", new_x="LMARGIN", new_y="NEXT")

    pdf.set_x(25)
    pdf.set_font("Helvetica", "B", 11)
    pdf.cell(50, 8, "Applicant:")
    pdf.set_font("Helvetica", "", 11)
    pdf.cell(0, 8, "Mrs Sarah Johnson", new_x="LMARGIN", new_y="NEXT")

    pdf.set_x(25)
    pdf.set_font("Helvetica", "B", 11)
    pdf.cell(50, 8, "Site Address:")
    pdf.set_font("Helvetica", "", 11)
    pdf.cell(0, 8, "12 Elm Grove, Testville, TV2 3CD", new_x="LMARGIN", new_y="NEXT")

    pdf.set_x(25)
    pdf.set_font("Helvetica", "B", 11)
    pdf.cell(50, 8, "Proposal:")
    pdf.set_font("Helvetica", "", 11)
    pdf.multi_cell(115, 8, "Two storey side extension and single storey rear extension to form additional living accommodation")

    pdf.set_x(25)
    pdf.set_font("Helvetica", "B", 11)
    pdf.cell(50, 8, "Ward:")
    pdf.set_font("Helvetica", "", 11)
    pdf.cell(0, 8, "Elmwood", new_x="LMARGIN", new_y="NEXT")

    pdf.set_x(25)
    pdf.set_font("Helvetica", "B", 11)
    pdf.cell(50, 8, "Case Officer:")
    pdf.set_font("Helvetica", "", 11)
    pdf.cell(0, 8, "To be assigned", new_x="LMARGIN", new_y="NEXT")

    pdf.ln(10)
    pdf.set_font("Helvetica", "I", 9)
    pdf.set_text_color(100, 100, 100)
    pdf.cell(0, 6, "Town and Country Planning Act 1990 (as amended)", align="C", new_x="LMARGIN", new_y="NEXT")
    pdf.cell(0, 6, "The Town and Country Planning (Development Management Procedure) (England) Order 2015", align="C", new_x="LMARGIN", new_y="NEXT")

    all_text.append("""TESTVILLE DISTRICT COUNCIL
Planning & Development Services

APPLICATION FOR PLANNING PERMISSION
Householder Development

Application Reference: PA/2024/00456
Date Received: 28 November 2024
Applicant: Mrs Sarah Johnson
Site Address: 12 Elm Grove, Testville, TV2 3CD
Proposal: Two storey side extension and single storey rear extension to form additional living accommodation
Ward: Elmwood
Case Officer: To be assigned

Town and Country Planning Act 1990 (as amended)
The Town and Country Planning (Development Management Procedure) (England) Order 2015""")

    # =========================================================================
    # PAGE 2: Applicant & Agent Details
    # =========================================================================
    pdf.add_page()
    pdf.section_heading("1. APPLICANT & AGENT DETAILS")

    pdf.sub_heading("Applicant")
    pdf.field_row("Title", "Mrs")
    pdf.field_row("First Name", "Sarah")
    pdf.field_row("Surname", "Johnson")
    pdf.field_row("Address", "12 Elm Grove, Testville, TV2 3CD")
    pdf.field_row("Telephone", "07700 123456")
    pdf.field_row("Email", "sarah.johnson@email.com")
    pdf.ln(5)

    pdf.sub_heading("Agent")
    pdf.field_row("Name", "Mr David Thompson BSc(Hons) RIBA ARB")
    pdf.field_row("Company", "Thompson & Associates Architecture Ltd")
    pdf.field_row("Company Reg.", "07845612")
    pdf.field_row("Address", "Suite 3, The Old Granary, Market Square, Testville, TV1 1AA")
    pdf.field_row("Telephone", "01234 567890")
    pdf.field_row("Email", "david@thompsonarchitects.co.uk")
    pdf.field_row("RIBA Chartered", "Yes - Member No. 10284756")
    pdf.field_row("RTPI Membership", "N/A (Architecture practice)")
    pdf.field_row("PI Insurance", "Hiscox Professional Indemnity - Policy HPI/2024/88901")

    all_text.append("""1. APPLICANT & AGENT DETAILS

Applicant
Title: Mrs
First Name: Sarah
Surname: Johnson
Address: 12 Elm Grove, Testville, TV2 3CD
Telephone: 07700 123456
Email: sarah.johnson@email.com

Agent
Name: Mr David Thompson BSc(Hons) RIBA ARB
Company: Thompson & Associates Architecture Ltd
Company Reg.: 07845612
Address: Suite 3, The Old Granary, Market Square, Testville, TV1 1AA
Telephone: 01234 567890
Email: david@thompsonarchitects.co.uk
RIBA Chartered: Yes - Member No. 10284756
RTPI Membership: N/A (Architecture practice)
PI Insurance: Hiscox Professional Indemnity - Policy HPI/2024/88901""")

    # =========================================================================
    # PAGE 3: Site Details & Existing Use
    # =========================================================================
    pdf.add_page()
    pdf.section_heading("2. SITE DETAILS & EXISTING USE")

    pdf.sub_heading("Site Information")
    pdf.field_row("Site Address", "12 Elm Grove, Testville, TV2 3CD")
    pdf.field_row("Grid Reference", "TQ 312 784 (Easting: 531234, Northing: 178456)")
    pdf.field_row("Ward", "Elmwood")
    pdf.field_row("Parish", "Testville Town Council")
    pdf.field_row("Site Area", "280 sq.m (0.028 hectares)")
    pdf.field_row("Existing Use", "C3 - Dwelling house (single family residential)")
    pdf.field_row("Current Occupancy", "Owner-occupied since 2015")
    pdf.ln(5)

    pdf.sub_heading("Constraints")
    pdf.field_row("Conservation Area", "No")
    pdf.field_row("Listed Building", "No")
    pdf.field_row("Article 4 Direction", "No")
    pdf.field_row("Tree Preservation Order", "No (one laurel hedge on eastern boundary)")
    pdf.field_row("Flood Zone", "Zone 1 (Low probability)")
    pdf.field_row("SSSI/AONB", "No")
    pdf.field_row("Green Belt", "No")
    pdf.field_row("Article 1(5) Land", "No")
    pdf.ln(5)

    pdf.sub_heading("Planning History")
    pdf.field_row("PA/2019/00891", "Loft conversion with rear dormer - APPROVED 14/06/2019")
    pdf.field_row("PA/2012/00342", "Replacement windows (UPVC to timber) - APPROVED 22/03/2012")
    pdf.body_text("No enforcement history. No extant permissions.")

    all_text.append("""2. SITE DETAILS & EXISTING USE

Site Information
Site Address: 12 Elm Grove, Testville, TV2 3CD
Grid Reference: TQ 312 784 (Easting: 531234, Northing: 178456)
Ward: Elmwood
Parish: Testville Town Council
Site Area: 280 sq.m (0.028 hectares)
Existing Use: C3 - Dwelling house (single family residential)
Current Occupancy: Owner-occupied since 2015

Constraints
Conservation Area: No
Listed Building: No
Article 4 Direction: No
Tree Preservation Order: No (one laurel hedge on eastern boundary)
Flood Zone: Zone 1 (Low probability)
SSSI/AONB: No
Green Belt: No
Article 1(5) Land: No

Planning History
PA/2019/00891: Loft conversion with rear dormer - APPROVED 14/06/2019
PA/2012/00342: Replacement windows (UPVC to timber) - APPROVED 22/03/2012
No enforcement history. No extant permissions.""")

    # =========================================================================
    # PAGE 4: Proposed Development
    # =========================================================================
    pdf.add_page()
    pdf.section_heading("3. PROPOSED DEVELOPMENT")

    pdf.sub_heading("Description of Works")
    pdf.body_text(
        "Two storey side extension and single storey rear extension to provide "
        "additional living accommodation comprising a ground floor study, utility room, "
        "dining area, and family room, with first floor bedroom and en-suite bathroom above "
        "the side extension. The single storey rear extension features a flat roof with "
        "lantern skylight and aluminium bi-fold doors opening onto the rear garden."
    )

    pdf.sub_heading("Dimensions")
    pdf.field_row("Existing floor area", "95 sq.m (ground floor only)")
    pdf.field_row("Proposed floor area", "140 sq.m (ground floor) + 25 sq.m (first floor side)")
    pdf.field_row("Total new floor area", "70 sq.m")
    pdf.field_row("Side extension width", "2.5m")
    pdf.field_row("Side extension depth", "Full depth of existing dwelling (8.4m)")
    pdf.field_row("Rear extension depth", "3.0m projection from existing rear wall")
    pdf.field_row("Rear extension width", "Full width including side extension (10.9m)")
    pdf.field_row("Height to eaves", "5.2m (matching existing)")
    pdf.field_row("Ridge height", "7.8m (matching existing)")
    pdf.field_row("Rear extension height", "3.0m (flat roof with 0.3m parapet)")
    pdf.field_row("Distance to boundary", "Side: 1.0m to eastern boundary")
    pdf.field_row("", "Rear: 8.5m to rear boundary (after extension)")
    pdf.ln(3)

    pdf.sub_heading("Materials Schedule")
    pdf.field_row("External walls", "Smooth render (Dulux Weathershield, colour: Jasmine White) to match existing")
    pdf.field_row("Roof - side ext.", "Clay plain tiles (Marley Acme, colour: Dark Red) to match existing")
    pdf.field_row("Roof - rear ext.", "Single ply membrane (Sarnafil) with 150mm insulation, anthracite grey")
    pdf.field_row("Windows", "Anthracite grey aluminium (RAL 7016), double glazed, thermally broken frames")
    pdf.field_row("Bi-fold doors", "5-panel aluminium bi-fold (Schuco ASS 70 FD), anthracite grey")
    pdf.field_row("Front door", "Retained - existing composite door")
    pdf.field_row("Rainwater goods", "Black uPVC half-round gutters, 68mm round downpipes")
    pdf.field_row("Fascia/soffit", "White uPVC to match existing")

    all_text.append("""3. PROPOSED DEVELOPMENT

Description of Works
Two storey side extension and single storey rear extension to provide additional living accommodation comprising a ground floor study, utility room, dining area, and family room, with first floor bedroom and en-suite bathroom above the side extension. The single storey rear extension features a flat roof with lantern skylight and aluminium bi-fold doors opening onto the rear garden.

Dimensions
Existing floor area: 95 sq.m (ground floor only)
Proposed floor area: 140 sq.m (ground floor) + 25 sq.m (first floor side)
Total new floor area: 70 sq.m
Side extension width: 2.5m
Side extension depth: Full depth of existing dwelling (8.4m)
Rear extension depth: 3.0m projection from existing rear wall
Rear extension width: Full width including side extension (10.9m)
Height to eaves: 5.2m (matching existing)
Ridge height: 7.8m (matching existing)
Rear extension height: 3.0m (flat roof with 0.3m parapet)
Distance to boundary: Side: 1.0m to eastern boundary, Rear: 8.5m to rear boundary (after extension)

Materials Schedule
External walls: Smooth render (Dulux Weathershield, colour: Jasmine White) to match existing
Roof - side extension: Clay plain tiles (Marley Acme, colour: Dark Red) to match existing
Roof - rear extension: Single ply membrane (Sarnafil) with 150mm insulation, anthracite grey
Windows: Anthracite grey aluminium (RAL 7016), double glazed, thermally broken frames
Bi-fold doors: 5-panel aluminium bi-fold (Schuco ASS 70 FD), anthracite grey
Front door: Retained - existing composite door
Rainwater goods: Black uPVC half-round gutters, 68mm round downpipes
Fascia/soffit: White uPVC to match existing""")

    # =========================================================================
    # PAGE 5: Existing Floor Plan Drawing
    # =========================================================================
    pdf.add_page()
    pdf.set_font("Helvetica", "B", 12)
    pdf.cell(0, 10, "Drawing No. 001 Rev A", align="C", new_x="LMARGIN", new_y="NEXT")
    pdf.set_font("Helvetica", "", 10)
    pdf.cell(0, 8, "Existing Ground Floor Plan - Scale 1:100", align="C", new_x="LMARGIN", new_y="NEXT")
    pdf.cell(0, 6, "Thompson & Associates Architecture Ltd", align="C", new_x="LMARGIN", new_y="NEXT")
    draw_existing_floor_plan(pdf)

    all_text.append("""Drawing No. 001 Rev A
Existing Ground Floor Plan - Scale 1:100
Thompson & Associates Architecture Ltd

[Architectural drawing showing existing ground floor layout: Kitchen (3.8m x 4.2m), Living Room (5.0m x 4.2m), WC, Hallway with staircase. Total footprint approximately 8.4m x 10.0m.]""")

    # =========================================================================
    # PAGE 6: Proposed Floor Plan Drawing
    # =========================================================================
    pdf.add_page()
    pdf.set_font("Helvetica", "B", 12)
    pdf.cell(0, 10, "Drawing No. 002 Rev A", align="C", new_x="LMARGIN", new_y="NEXT")
    pdf.set_font("Helvetica", "", 10)
    pdf.cell(0, 8, "Proposed Ground Floor Plan - Scale 1:100", align="C", new_x="LMARGIN", new_y="NEXT")
    pdf.cell(0, 6, "Thompson & Associates Architecture Ltd", align="C", new_x="LMARGIN", new_y="NEXT")
    draw_proposed_floor_plan(pdf)

    all_text.append("""Drawing No. 002 Rev A
Proposed Ground Floor Plan - Scale 1:100
Thompson & Associates Architecture Ltd

[Architectural drawing showing proposed ground floor layout. Existing structure: Kitchen, Living Room, WC, Hallway with staircase. New extensions shown in red: Side extension containing Study (2.5m x 4.2m) and Utility room; Rear extension containing Dining Area (4.2m x 2.0m) and Family Room (5.8m x 2.0m).]""")

    # =========================================================================
    # PAGE 7: Elevations Drawing
    # =========================================================================
    pdf.add_page()
    pdf.set_font("Helvetica", "B", 12)
    pdf.cell(0, 10, "Drawing No. 003 Rev A", align="C", new_x="LMARGIN", new_y="NEXT")
    pdf.set_font("Helvetica", "", 10)
    pdf.cell(0, 8, "Proposed Elevations (Front, Side, Rear) - Scale 1:100", align="C", new_x="LMARGIN", new_y="NEXT")
    pdf.cell(0, 6, "Thompson & Associates Architecture Ltd", align="C", new_x="LMARGIN", new_y="NEXT")
    draw_elevations(pdf)

    all_text.append("""Drawing No. 003 Rev A
Proposed Elevations (Front, Side, Rear) - Scale 1:100
Thompson & Associates Architecture Ltd

[Architectural elevation drawings showing:
- Front Elevation: Existing two-storey dwelling with new two-storey side extension (shown in red). Ridge height 7.8m matching existing. Render finish with clay tile roof.
- Side Elevation (East): Showing existing dwelling profile.
- Rear Elevation: Showing single storey rear extension with flat roof and 5-panel aluminium bi-fold doors (shown in red). Extension height 3.0m.]""")

    # =========================================================================
    # PAGE 8: Site Plan Drawing
    # =========================================================================
    pdf.add_page()
    pdf.set_font("Helvetica", "B", 12)
    pdf.cell(0, 10, "Drawing No. 004", align="C", new_x="LMARGIN", new_y="NEXT")
    pdf.set_font("Helvetica", "", 10)
    pdf.cell(0, 8, "Site Location Plan - Scale 1:1250", align="C", new_x="LMARGIN", new_y="NEXT")
    pdf.cell(0, 6, "Thompson & Associates Architecture Ltd", align="C", new_x="LMARGIN", new_y="NEXT")
    draw_site_plan(pdf)

    all_text.append("""Drawing No. 004
Site Location Plan - Scale 1:1250
Thompson & Associates Architecture Ltd

[Site plan showing 12 Elm Grove within the street context. Application site outlined in red. Property located on the north side of Elm Grove, approximately 65m west of the junction with Oak Lane. North arrow and scale bar shown.]""")

    # =========================================================================
    # PAGE 9: Access, Parking & Transport
    # =========================================================================
    pdf.add_page()
    pdf.section_heading("4. ACCESS, PARKING & TRANSPORT")

    pdf.sub_heading("Vehicle Access")
    pdf.body_text(
        "Existing vehicle crossover to Elm Grove retained without alteration. "
        "No new or modified access proposed. The crossover is approximately 3.6m wide "
        "and was constructed to Testville Highways standard specification in 2003."
    )

    pdf.sub_heading("Parking Provision")
    pdf.field_row("Existing spaces", "2 (one driveway, one integral garage)")
    pdf.field_row("Proposed spaces", "2 (driveway retained; garage converted to utility but driveway unchanged)")
    pdf.body_text(
        "Note: The integral garage is being converted to a utility room as part of "
        "the rear extension. However, the garage was not in regular use for vehicle "
        "parking (used for general storage). The 2 driveway spaces (tandem arrangement) "
        "are retained. This meets the Testville Local Plan standard of 2 spaces for a "
        "4-bedroom dwelling in Zone B."
    )

    pdf.sub_heading("Cycle Storage")
    pdf.body_text(
        "Existing timber cycle shed (1.8m x 1.2m) in rear garden to be retained. "
        "Provides covered, secure storage for 4 bicycles. Accessible via side gate."
    )

    pdf.sub_heading("Bin Storage")
    pdf.body_text(
        "Bin storage area relocated from current position (adjacent to garage door) "
        "to new location adjacent to side boundary fence, screened by 1.2m timber "
        "enclosure. 3 bins accommodated (general waste, recycling, garden waste). "
        "Collection point at front boundary unchanged."
    )

    all_text.append("""4. ACCESS, PARKING & TRANSPORT

Vehicle Access
Existing vehicle crossover to Elm Grove retained without alteration. No new or modified access proposed. The crossover is approximately 3.6m wide and was constructed to Testville Highways standard specification in 2003.

Parking Provision
Existing spaces: 2 (one driveway, one integral garage)
Proposed spaces: 2 (driveway retained; garage converted to utility but driveway unchanged)

Note: The integral garage is being converted to a utility room as part of the rear extension. However, the garage was not in regular use for vehicle parking (used for general storage). The 2 driveway spaces (tandem arrangement) are retained. This meets the Testville Local Plan standard of 2 spaces for a 4-bedroom dwelling in Zone B.

Cycle Storage
Existing timber cycle shed (1.8m x 1.2m) in rear garden to be retained. Provides covered, secure storage for 4 bicycles. Accessible via side gate.

Bin Storage
Bin storage area relocated from current position (adjacent to garage door) to new location adjacent to side boundary fence, screened by 1.2m timber enclosure. 3 bins accommodated (general waste, recycling, garden waste). Collection point at front boundary unchanged.""")

    # =========================================================================
    # PAGE 10: Trees, Ecology & Flood Risk
    # =========================================================================
    pdf.add_page()
    pdf.section_heading("5. TREES, ECOLOGY & FLOOD RISK")

    pdf.sub_heading("Trees and Hedgerows")
    pdf.body_text(
        "No trees subject to Tree Preservation Orders are present on the site or "
        "adjacent land. One mature laurel hedge (approximately 2.8m height) runs along "
        "the eastern boundary. This will be reduced to 1.8m height and trimmed to 0.6m "
        "width to accommodate the side extension. The hedge is not protected and sits "
        "entirely within the applicant's ownership. An ornamental cherry tree (Prunus "
        "'Kanzan') in the front garden is unaffected by the proposals."
    )

    pdf.sub_heading("Ecology")
    pdf.body_text(
        "A preliminary ecological appraisal is not considered necessary for this "
        "application. The site is a residential garden with no features of ecological "
        "significance. There are no ponds within 250m. The existing roof void was "
        "inspected during the 2019 loft conversion (PA/2019/00891) and no evidence of "
        "bats or nesting birds was found. The proposed works affect the side elevation "
        "and rear, which present limited roosting potential."
    )
    pdf.body_text(
        "Notwithstanding the above, works will comply with the Wildlife and Countryside "
        "Act 1981 and vegetation clearance will be undertaken outside the bird nesting "
        "season (March-August) or following a check by a suitably qualified ecologist."
    )

    pdf.sub_heading("Flood Risk")
    pdf.field_row("Flood Zone", "Zone 1 (Low probability)")
    pdf.field_row("Surface water risk", "Very low (Environment Agency mapping)")
    pdf.body_text(
        "The site is in Flood Zone 1 with a less than 1 in 1,000 annual probability of "
        "river or sea flooding. No Flood Risk Assessment is required for minor development "
        "in Flood Zone 1. Surface water drainage from the extensions will connect to "
        "existing soakaways in the rear garden (installed 2003, capacity confirmed adequate "
        "for additional roof area by Thompson & Associates drainage calculation ref. "
        "DC/2024/0456, available on request)."
    )

    all_text.append("""5. TREES, ECOLOGY & FLOOD RISK

Trees and Hedgerows
No trees subject to Tree Preservation Orders are present on the site or adjacent land. One mature laurel hedge (approximately 2.8m height) runs along the eastern boundary. This will be reduced to 1.8m height and trimmed to 0.6m width to accommodate the side extension. The hedge is not protected and sits entirely within the applicant's ownership. An ornamental cherry tree (Prunus 'Kanzan') in the front garden is unaffected by the proposals.

Ecology
A preliminary ecological appraisal is not considered necessary for this application. The site is a residential garden with no features of ecological significance. There are no ponds within 250m. The existing roof void was inspected during the 2019 loft conversion (PA/2019/00891) and no evidence of bats or nesting birds was found.

Works will comply with the Wildlife and Countryside Act 1981 and vegetation clearance will be undertaken outside the bird nesting season (March-August) or following a check by a suitably qualified ecologist.

Flood Risk
Flood Zone: Zone 1 (Low probability)
Surface water risk: Very low (Environment Agency mapping)
The site is in Flood Zone 1. Surface water drainage from the extensions will connect to existing soakaways in the rear garden.""")

    # =========================================================================
    # PAGE 11: SUPPLEMENTARY NOTES (the crazy starts)
    # =========================================================================
    pdf.add_page()
    pdf.section_heading("SUPPLEMENTARY NOTES")
    pdf.body_text(
        "The following additional context is provided for the planning officer's consideration "
        "in determining this application."
    )

    pdf.sub_heading("Note 1: Matters Arising from Pre-Application Advice")
    pdf.body_text(
        "Pre-application advice was sought (ref PRE/2024/00123) and the duty planning officer "
        "confirmed the principle of a two-storey side extension was acceptable subject to "
        "adequate separation from the boundary and subordinate ridge height. The current "
        "proposal addresses both points with a 1.0m setback and matching ridge height."
    )

    pdf.sub_heading("Note 2: Regarding the Neighbourhood Cat Situation")
    pdf.body_text(
        "I feel it is important to bring to the planning officer's attention the ongoing "
        "situation with Mr Whiskers, the ginger tom cat belonging to No. 14 (Mr and Mrs "
        "Pemberton). This cat has, for the past three years, systematically destroyed my "
        "begonias, used my herb garden as a personal lavatory, and on no fewer than SEVEN "
        "occasions left partially deceased field mice on the doorstep of what will be "
        "the new rear extension."
    )
    pdf.body_text(
        "I have raised this matter with the Pembertons on multiple occasions. Mrs Pemberton "
        "suggested I 'try citrus peel' which I can confirm does NOT work and merely attracted "
        "foxes. I am not suggesting this is a material planning consideration, but I wanted "
        "it on record that any damage to the newly rendered walls by said feline during the "
        "construction phase should be noted. Mr Whiskers has no respect for boundaries, "
        "literal or metaphorical."
    )
    pdf.body_text(
        "I have attached a photograph of the damage to my begonias (Appendix Q, not included "
        "in this submission as my printer ran out of colour ink)."
    )

    pdf.sub_heading("Note 3: Victoria Sponge Recipe (Relevant to Kitchen Extension)")
    pdf.body_text(
        "As the proposed extension will significantly improve the kitchen facilities, I am "
        "including my grandmother's Victoria Sponge recipe, which I intend to perfect in the "
        "new space. I believe this demonstrates the domestic amenity value of the extension:"
    )
    pdf.body_text(
        "Ingredients: 225g self-raising flour, 225g caster sugar, 225g butter (softened, "
        "not that margarine nonsense), 4 large free-range eggs, 1 tsp vanilla extract, "
        "2 tbsp milk (whole, from Hartley's Farm Shop - they deliver on Tuesdays)."
    )
    pdf.body_text(
        "Method: Preheat oven to 180C/350F/Gas Mark 4. Cream butter and sugar until light "
        "and fluffy (approximately 5 minutes with the KitchenAid, which will fit beautifully "
        "on the new kitchen island). Add eggs one at a time, beating well after each. Fold in "
        "flour gently. Divide between two 20cm tins (greased and lined). Bake 20-25 minutes "
        "until golden and springy. Cool on wire rack. Fill with raspberry jam (homemade, "
        "obviously) and whipped cream. Dust with icing sugar. Serves 8, or 4 if Gerald from "
        "No. 16 is invited as he takes unreasonably large portions."
    )

    pdf.sub_heading("Note 4: Ley Line Alignment")
    pdf.body_text(
        "My neighbour Mrs Doreen Wetherspoon (No. 10) has informed me that the proposed "
        "extension aligns precisely with the ancient ley line running from Testville Abbey "
        "to the standing stones at Bramblewick Common. She suggests this will bring 'positive "
        "energy flow' to the new family room. While I make no claims as to the planning "
        "materiality of ley lines, I note that the National Planning Policy Framework is "
        "silent on the matter and therefore it cannot be considered a reason for refusal."
    )

    pdf.body_text(
        "P.S. Has anyone seen my garden gnome Gerald? He disappeared from the front garden "
        "on 14th October and has not been seen since. He is approximately 40cm tall, has a "
        "red hat, and is holding a fishing rod. I am not accusing anyone. I am merely noting "
        "his absence. He has been with us since 2009 and is greatly missed."
    )

    all_text.append("""SUPPLEMENTARY NOTES

The following additional context is provided for the planning officer's consideration in determining this application.

Note 1: Matters Arising from Pre-Application Advice
Pre-application advice was sought (ref PRE/2024/00123) and the duty planning officer confirmed the principle of a two-storey side extension was acceptable subject to adequate separation from the boundary and subordinate ridge height. The current proposal addresses both points with a 1.0m setback and matching ridge height.

Note 2: Regarding the Neighbourhood Cat Situation
I feel it is important to bring to the planning officer's attention the ongoing situation with Mr Whiskers, the ginger tom cat belonging to No. 14 (Mr and Mrs Pemberton). This cat has, for the past three years, systematically destroyed my begonias, used my herb garden as a personal lavatory, and on no fewer than SEVEN occasions left partially deceased field mice on the doorstep of what will be the new rear extension.

I have raised this matter with the Pembertons on multiple occasions. Mrs Pemberton suggested I 'try citrus peel' which I can confirm does NOT work and merely attracted foxes. I am not suggesting this is a material planning consideration, but I wanted it on record that any damage to the newly rendered walls by said feline during the construction phase should be noted. Mr Whiskers has no respect for boundaries, literal or metaphorical.

I have attached a photograph of the damage to my begonias (Appendix Q, not included in this submission as my printer ran out of colour ink).

Note 3: Victoria Sponge Recipe (Relevant to Kitchen Extension)
As the proposed extension will significantly improve the kitchen facilities, I am including my grandmother's Victoria Sponge recipe, which I intend to perfect in the new space. I believe this demonstrates the domestic amenity value of the extension:

Ingredients: 225g self-raising flour, 225g caster sugar, 225g butter (softened, not that margarine nonsense), 4 large free-range eggs, 1 tsp vanilla extract, 2 tbsp milk (whole, from Hartley's Farm Shop - they deliver on Tuesdays).

Method: Preheat oven to 180C/350F/Gas Mark 4. Cream butter and sugar until light and fluffy (approximately 5 minutes with the KitchenAid, which will fit beautifully on the new kitchen island). Add eggs one at a time, beating well after each. Fold in flour gently. Divide between two 20cm tins (greased and lined). Bake 20-25 minutes until golden and springy. Cool on wire rack. Fill with raspberry jam (homemade, obviously) and whipped cream. Dust with icing sugar. Serves 8, or 4 if Gerald from No. 16 is invited as he takes unreasonably large portions.

Note 4: Ley Line Alignment
My neighbour Mrs Doreen Wetherspoon (No. 10) has informed me that the proposed extension aligns precisely with the ancient ley line running from Testville Abbey to the standing stones at Bramblewick Common. She suggests this will bring 'positive energy flow' to the new family room. While I make no claims as to the planning materiality of ley lines, I note that the National Planning Policy Framework is silent on the matter and therefore it cannot be considered a reason for refusal.

P.S. Has anyone seen my garden gnome Gerald? He disappeared from the front garden on 14th October and has not been seen since. He is approximately 40cm tall, has a red hat, and is holding a fishing rod. I am not accusing anyone. I am merely noting his absence. He has been with us since 2009 and is greatly missed.""")

    # =========================================================================
    # PAGE 12: ADDITIONAL SUPPORTING INFORMATION
    # =========================================================================
    pdf.add_page()
    pdf.section_heading("ADDITIONAL SUPPORTING INFORMATION")

    pdf.sub_heading("Appendix D: Holiday Packing List (Tenerife, February Half-Term)")
    pdf.body_text(
        "I apologise for the inclusion of this list which was accidentally collated with "
        "the planning documents. However, since it is now paginated, I have left it in:"
    )
    pdf.body_text(
        "Passports (check expiry!), travel insurance documents, sun cream SPF 50 (for the "
        "children) and SPF 30 (for me, I tan quite well actually), swimming costumes x4, "
        "snorkelling gear, that novel everyone recommended about the woman who moves to Italy "
        "(still haven't started it), David's reading glasses (he always forgets), "
        "children's Nintendo Switch and charger, adapter plugs x2, "
        "antihistamines for Lily (the pollen in Tenerife is terrible in February), "
        "the comfortable sandals NOT the ones from TK Maxx that gave me blisters in Corfu, "
        "factor 50 lip balm, aloe vera gel (just in case), "
        "emergency Calpol, Gaviscon for David, mosquito repellent."
    )

    pdf.sub_heading("Appendix E: The Golden Chippy - Restaurant Review")
    pdf.body_text(
        "Rating: 3.5 out of 5 stars"
    )
    pdf.body_text(
        "Visited The Golden Chippy on Station Road (approximately 400m from the application "
        "site, which demonstrates the excellent local amenities available) on Saturday 16th "
        "November. The cod was generous and well-battered, though I felt the chips were slightly "
        "under-seasoned. The mushy peas were excellent - clearly made from scratch rather than "
        "that luminous green tinned variety. David had the haddock which he said was 'fine' "
        "but David says everything is 'fine' so this is not a reliable indicator. Lily had "
        "chicken nuggets (shaped like dinosaurs, which she appreciated). Tom refused to eat "
        "anything and had a meltdown about the vinegar smell. Parking was difficult. Would "
        "visit again but would bring our own salt. The proximity of this establishment to "
        "the application site is, I submit, a material consideration insofar as it demonstrates "
        "the vibrancy of the local high street."
    )

    pdf.sub_heading("Appendix F: Book Club Minutes (November 2024)")
    pdf.body_text(
        "Elm Grove Book Club met at No. 8 (Janice's house, lovely new curtains) on Tuesday "
        "19th November. Present: Sarah (applicant), Janice (No. 8), Margaret (No. 6), "
        "Doreen (No. 10), Linda (No. 18). Apologies from Brenda (hip operation, sends her best)."
    )
    pdf.body_text(
        "This month's book: Pride and Prejudice (re-read for the fourth time at Doreen's "
        "insistence). Discussion centred on whether Mr Darcy would have needed planning "
        "permission for the improvements to Pemberley, and if so, whether the Derbyshire "
        "planning authority would have approved them given the property's likely Grade I "
        "listing. Margaret argued that the Bennets' house would never pass a modern "
        "Building Regulations inspection. Janice brought lemon drizzle cake (recipe available "
        "on request). Next meeting: 17th December, theme: 'Christmas books', venue: Sarah's "
        "(assuming the planning application is approved and the new family room is finished, "
        "which it won't be, but we'll use the existing living room)."
    )

    pdf.sub_heading("Note on Council Roadworks (Elm Grove)")
    pdf.body_text(
        "I would also like to note that the roadworks on Elm Grove which began on 3rd September "
        "were supposed to last 'approximately two weeks' and it is now late November. The "
        "temporary traffic lights have caused considerable congestion and I have been late to "
        "school pickup on three occasions. I appreciate this is a Highways matter rather than "
        "Planning, but given I am writing to the council anyway, I wanted it on record. The "
        "workmen appear to arrive at 9:30, take a tea break at 10, lunch from 12-1:30, another "
        "tea break at 3, and leave at 3:45. I am not complaining; I am merely observing."
    )

    all_text.append("""ADDITIONAL SUPPORTING INFORMATION

Appendix D: Holiday Packing List (Tenerife, February Half-Term)
I apologise for the inclusion of this list which was accidentally collated with the planning documents. However, since it is now paginated, I have left it in:

Passports (check expiry!), travel insurance documents, sun cream SPF 50 (for the children) and SPF 30 (for me, I tan quite well actually), swimming costumes x4, snorkelling gear, that novel everyone recommended about the woman who moves to Italy (still haven't started it), David's reading glasses (he always forgets), children's Nintendo Switch and charger, adapter plugs x2, antihistamines for Lily (the pollen in Tenerife is terrible in February), the comfortable sandals NOT the ones from TK Maxx that gave me blisters in Corfu, factor 50 lip balm, aloe vera gel (just in case), emergency Calpol, Gaviscon for David, mosquito repellent.

Appendix E: The Golden Chippy - Restaurant Review
Rating: 3.5 out of 5 stars

Visited The Golden Chippy on Station Road (approximately 400m from the application site, which demonstrates the excellent local amenities available) on Saturday 16th November. The cod was generous and well-battered, though I felt the chips were slightly under-seasoned. The mushy peas were excellent - clearly made from scratch rather than that luminous green tinned variety. David had the haddock which he said was 'fine' but David says everything is 'fine' so this is not a reliable indicator. Lily had chicken nuggets (shaped like dinosaurs, which she appreciated). Tom refused to eat anything and had a meltdown about the vinegar smell. Parking was difficult. Would visit again but would bring our own salt.

Appendix F: Book Club Minutes (November 2024)
Elm Grove Book Club met at No. 8 (Janice's house, lovely new curtains) on Tuesday 19th November. Present: Sarah (applicant), Janice (No. 8), Margaret (No. 6), Doreen (No. 10), Linda (No. 18). Apologies from Brenda (hip operation, sends her best).

This month's book: Pride and Prejudice. Discussion centred on whether Mr Darcy would have needed planning permission for the improvements to Pemberley, and if so, whether the Derbyshire planning authority would have approved them given the property's likely Grade I listing. Margaret argued that the Bennets' house would never pass a modern Building Regulations inspection.

Note on Council Roadworks (Elm Grove)
I would also like to note that the roadworks on Elm Grove which began on 3rd September were supposed to last 'approximately two weeks' and it is now late November. The temporary traffic lights have caused considerable congestion and I have been late to school pickup on three occasions.""")

    # =========================================================================
    # PAGE 13: My Daughter's Vision
    # =========================================================================
    pdf.add_page()
    pdf.set_font("Helvetica", "B", 14)
    pdf.set_text_color(0, 51, 102)
    pdf.cell(0, 12, "Appendix G: Artist's Impression of Proposed Extension", align="C", new_x="LMARGIN", new_y="NEXT")
    pdf.set_font("Helvetica", "I", 11)
    pdf.set_text_color(100, 100, 100)
    pdf.cell(0, 8, "by Lily Johnson, age 7", align="C", new_x="LMARGIN", new_y="NEXT")
    pdf.ln(5)
    pdf.set_font("Helvetica", "", 9)
    pdf.set_text_color(0, 0, 0)
    pdf.body_text(
        "Lily has requested that her drawing be included in the planning submission. She is "
        "very excited about having a bigger house and has drawn what she describes as 'the "
        "house with the new bit and also Mr Whiskers because he lives next door and also a "
        "cat and some flowers and the sun'. I have explained that planning applications do "
        "not typically include artwork by seven-year-olds but she was quite insistent."
    )

    draw_childs_drawing(pdf)

    all_text.append("""Appendix G: Artist's Impression of Proposed Extension
by Lily Johnson, age 7

Lily has requested that her drawing be included in the planning submission. She is very excited about having a bigger house and has drawn what she describes as 'the house with the new bit and also Mr Whiskers because he lives next door and also a cat and some flowers and the sun'. I have explained that planning applications do not typically include artwork by seven-year-olds but she was quite insistent.

[Child's drawing showing a house with extension, sun, flowers, and a cat (Mr Whiskers)]""")

    # =========================================================================
    # PAGE 14: Neighbour Consultation Responses
    # =========================================================================
    pdf.add_page()
    pdf.section_heading("6. NEIGHBOUR CONSULTATION RESPONSES")

    pdf.body_text(
        "The following representations were received during the 21-day consultation period "
        "(site notice displayed 02/12/2024, neighbour letters posted 01/12/2024):"
    )

    pdf.sub_heading("No. 10 Elm Grove - Mrs Doreen Wetherspoon")
    pdf.body_text(
        "No objection. Mrs Wetherspoon writes: 'Sarah is a lovely neighbour and the extension "
        "looks very tasteful. I do hope she will consider the ley line alignment I mentioned "
        "(see supplementary notes). The family room would benefit enormously from a south-west "
        "facing crystal arrangement. No objection to the planning application.'"
    )

    pdf.sub_heading("No. 16 Elm Grove - Mr Gerald Patterson")
    pdf.body_text(
        "No objection subject to conditions. Mr Patterson notes: 'I have no objection in "
        "principle but request a condition that construction work does not commence before "
        "8:00am on weekdays as I work night shifts at the Royal Mail sorting office. I also "
        "request that the builder does not park his van across my drive as happened during "
        "the loft conversion in 2019. The van was there for six weeks. I had to park on Oak "
        "Lane. This is unacceptable. Otherwise, the plans look fine. When is the new kitchen "
        "finished? Sarah makes excellent cake.'"
    )

    pdf.sub_heading("No. 14 Elm Grove - Mr Gerald Pemberton")
    pdf.body_text(
        "OBJECTION. Mr Pemberton writes (verbatim, original formatting preserved):"
    )
    pdf.body_text(
        "I OBJECT to this application on the following grounds: (1) The extension will "
        "BLOCK the 5G signal to my property. I have been monitoring the electromagnetic "
        "radiation levels on Elm Grove since the new mast was installed on the church tower "
        "and the readings are ALREADY 43% below what they should be. A two-storey extension "
        "will create a SIGNAL SHADOW that will affect my broadband, my smart thermostat, and "
        "my tomato plants. Yes, my tomato plants. There are PEER-REVIEWED studies (which I "
        "will provide on request) showing that 5G frequencies at 3.5GHz DIRECTLY affect "
        "lycopene production in Solanum lycopersicum. My tomatoes have been 23% less red "
        "since the mast went up and this extension will make it WORSE."
    )
    pdf.body_text(
        "(2) Mrs Johnson's daughter drew a picture of MY CAT (Mr Whiskers) without my "
        "permission. This is a breach of Mr Whiskers' intellectual property rights."
    )
    pdf.body_text(
        "(3) The proposed render colour 'Jasmine White' is too white. It will cause "
        "LIGHT POLLUTION and GLARE that will disturb Mr Whiskers, who has sensitive eyes."
    )

    pdf.sub_heading("No. 8 Elm Grove - Mrs Edith Crawley")
    pdf.body_text(
        "Mrs Crawley's response consisted of a handwritten note on floral stationery which "
        "reads in its entirety: 'Dear Planning Department, I am writing about the extension "
        "at number 12. While I am at it, here is my recipe for Seville orange marmalade, "
        "which won second place at the Testville Horticultural Show in 2019 (I was robbed - "
        "Margaret Delaney used SHOP-BOUGHT oranges, everyone knows it). Take 1kg Seville "
        "oranges (January only), 2kg sugar, juice of 2 lemons. Boil oranges whole for 2 hours. "
        "Cut open, remove pips, slice peel thinly. Add sugar and lemon juice. Boil to setting "
        "point (105C on a jam thermometer, not the wrinkle test - the wrinkle test is unreliable). "
        "Pot in sterilised jars. Makes approximately 6 jars. P.S. No objection to the extension.'"
    )

    all_text.append("""6. NEIGHBOUR CONSULTATION RESPONSES

The following representations were received during the 21-day consultation period (site notice displayed 02/12/2024, neighbour letters posted 01/12/2024):

No. 10 Elm Grove - Mrs Doreen Wetherspoon
No objection. 'Sarah is a lovely neighbour and the extension looks very tasteful. I do hope she will consider the ley line alignment I mentioned. No objection to the planning application.'

No. 16 Elm Grove - Mr Gerald Patterson
No objection subject to conditions. 'I have no objection in principle but request a condition that construction work does not commence before 8:00am on weekdays as I work night shifts. I also request that the builder does not park his van across my drive as happened during the loft conversion in 2019.'

No. 14 Elm Grove - Mr Gerald Pemberton
OBJECTION. (1) The extension will BLOCK the 5G signal to my property. I have been monitoring the electromagnetic radiation levels on Elm Grove since the new mast was installed on the church tower and the readings are ALREADY 43% below what they should be. There are PEER-REVIEWED studies showing that 5G frequencies at 3.5GHz DIRECTLY affect lycopene production in Solanum lycopersicum. My tomatoes have been 23% less red since the mast went up and this extension will make it WORSE.
(2) Mrs Johnson's daughter drew a picture of MY CAT (Mr Whiskers) without my permission. This is a breach of Mr Whiskers' intellectual property rights.
(3) The proposed render colour 'Jasmine White' is too white. It will cause LIGHT POLLUTION and GLARE that will disturb Mr Whiskers, who has sensitive eyes.

No. 8 Elm Grove - Mrs Edith Crawley
Mrs Crawley's response included a recipe for Seville orange marmalade which won second place at the Testville Horticultural Show in 2019. P.S. No objection to the extension.""")

    # =========================================================================
    # PAGE 15: Design & Access Statement
    # =========================================================================
    pdf.add_page()
    pdf.section_heading("7. DESIGN & ACCESS STATEMENT")

    pdf.sub_heading("Policy Context")
    pdf.body_text(
        "This application is supported by reference to the following policy framework: "
        "National Planning Policy Framework (NPPF) paragraphs 130-134 (achieving well-designed "
        "places); Testville Local Plan (adopted 2021) Policy H7 (Extensions to Residential "
        "Properties); and the Testville Residential Design Guide SPD (2022)."
    )

    pdf.sub_heading("Character Analysis")
    pdf.body_text(
        "Elm Grove is characterised by semi-detached and detached two-storey dwellings "
        "dating from the 1930s-1950s, predominantly rendered with hipped or gabled roofs in "
        "clay tiles. Properties have a consistent building line setback of approximately 6m "
        "from the highway. Several properties have been extended to the side and rear, "
        "including Nos. 4, 8, 18, and 22, establishing a clear precedent for householder "
        "extensions in the street."
    )

    pdf.sub_heading("Scale and Massing")
    pdf.body_text(
        "The two-storey side extension is designed as a subordinate addition to the host "
        "dwelling. The ridge height matches the existing (7.8m) but the extension is set "
        "back 0.5m from the front building line and 1.0m from the side boundary, avoiding "
        "a 'terracing effect' in accordance with Policy H7(c). The single storey rear "
        "extension has a flat roof (3.0m height), well below the existing first floor "
        "window sills (3.8m), ensuring it reads as a clearly subservient addition."
    )

    pdf.sub_heading("Overlooking and Privacy")
    pdf.body_text(
        "No new windows are proposed in the side elevation at first floor level, preventing "
        "any overlooking of No. 14. The first floor rear window (bedroom) is 12.5m from "
        "the rear boundary, exceeding the 10.5m minimum in the Residential Design Guide. "
        "The rear extension bi-fold doors face the applicant's own garden (south-facing) "
        "and are screened from adjacent properties by existing 1.8m boundary fencing."
    )

    pdf.sub_heading("Daylight and Sunlight")
    pdf.body_text(
        "A 45-degree daylight assessment has been carried out in accordance with BRE guidance "
        "(Site Layout Planning for Daylight and Sunlight, 2022). The side extension passes "
        "the 45-degree test from all relevant windows at No. 14 Elm Grove. The nearest "
        "window at No. 14 is 3.5m from the proposed flank wall (1.0m setback + 2.5m existing "
        "gap), which is sufficient to prevent material loss of daylight. Shadow analysis "
        "indicates no additional overshadowing of No. 14's rear garden beyond the existing "
        "shadow cast by the boundary fence and laurel hedge."
    )

    pdf.sub_heading("Conclusion")
    pdf.body_text(
        "The proposed development is considered to be in accordance with the development plan "
        "and national planning policy. It respects the character of the area, does not cause "
        "unacceptable harm to neighbouring amenity, and provides much-needed additional living "
        "accommodation for a growing family. Approval is respectfully requested."
    )

    all_text.append("""7. DESIGN & ACCESS STATEMENT

Policy Context
This application is supported by reference to: NPPF paragraphs 130-134 (achieving well-designed places); Testville Local Plan (adopted 2021) Policy H7 (Extensions to Residential Properties); Testville Residential Design Guide SPD (2022).

Character Analysis
Elm Grove is characterised by semi-detached and detached two-storey dwellings dating from the 1930s-1950s. Several properties have been extended including Nos. 4, 8, 18, and 22, establishing clear precedent for householder extensions.

Scale and Massing
The two-storey side extension is subordinate to the host dwelling. Ridge height matches existing (7.8m). Extension set back 0.5m from front building line and 1.0m from side boundary, avoiding terracing effect per Policy H7(c). Rear extension has flat roof (3.0m height), clearly subservient.

Overlooking and Privacy
No new windows proposed in side elevation at first floor level. First floor rear window is 12.5m from rear boundary, exceeding 10.5m minimum. Bi-fold doors face applicant's own garden, screened by 1.8m boundary fencing.

Daylight and Sunlight
45-degree daylight assessment carried out per BRE guidance. Side extension passes 45-degree test from all relevant windows at No. 14. No material loss of daylight or additional overshadowing.

Conclusion
The proposed development accords with the development plan and national planning policy. It respects area character, causes no unacceptable harm to neighbouring amenity, and provides additional living accommodation for a growing family. Approval is respectfully requested.""")

    # =========================================================================
    # PAGE 16: Ownership Certificate & Agricultural Declaration
    # =========================================================================
    pdf.add_page()
    pdf.section_heading("8. OWNERSHIP CERTIFICATE & DECLARATIONS")

    pdf.sub_heading("Ownership Certificate A")
    pdf.body_text(
        "I certify that on the day 21 days before the date of this application nobody "
        "except the applicant was the owner of any part of the land or building to which "
        "the application relates, and that none of the land to which the application relates "
        "is part of an agricultural holding."
    )

    pdf.field_row("Certificate type", "Certificate A (sole owner)")
    pdf.field_row("Applicant is owner", "Yes")
    pdf.field_row("Date of acquisition", "12 March 2015")
    pdf.field_row("Title number", "TDC/245678")
    pdf.field_row("Other owners", "None")
    pdf.ln(5)

    pdf.sub_heading("Agricultural Land Declaration")
    pdf.field_row("Agricultural holding", "No")
    pdf.body_text(
        "None of the land to which this application relates is, or is part of, an "
        "agricultural holding. The site is a residential garden in established urban use."
    )
    pdf.ln(5)

    pdf.sub_heading("Article 1(5) Land")
    pdf.field_row("Article 1(5) Land", "No")
    pdf.body_text(
        "The site is not within a National Park, Area of Outstanding Natural Beauty, "
        "the Broads, a conservation area, or a World Heritage Site."
    )

    all_text.append("""8. OWNERSHIP CERTIFICATE & DECLARATIONS

Ownership Certificate A
I certify that on the day 21 days before the date of this application nobody except the applicant was the owner of any part of the land or building to which the application relates.

Certificate type: Certificate A (sole owner)
Applicant is owner: Yes
Date of acquisition: 12 March 2015
Title number: TDC/245678
Other owners: None

Agricultural Land Declaration
Agricultural holding: No
None of the land is part of an agricultural holding. The site is a residential garden in established urban use.

Article 1(5) Land: No
The site is not within a National Park, AONB, the Broads, a conservation area, or a World Heritage Site.""")

    # =========================================================================
    # PAGE 17: Declaration & Signatures
    # =========================================================================
    pdf.add_page()
    pdf.section_heading("9. DECLARATION & SIGNATURES")

    pdf.body_text(
        "I/We hereby apply for planning permission as described in this application and "
        "the accompanying plans and drawings. I/We confirm that, to the best of my/our "
        "knowledge, the information given in this application is correct and complete."
    )

    pdf.body_text(
        "WARNING: It is an offence to knowingly or recklessly provide false or misleading "
        "information in support of a planning application (under section 65(6) of the "
        "Town and Country Planning Act 1990, as amended). A person found guilty of such "
        "an offence may be liable to a fine. The applicant should also be aware that the "
        "council may take enforcement action if development is carried out which differs "
        "from the approved plans without further planning permission."
    )

    pdf.ln(5)
    pdf.sub_heading("Applicant Declaration")
    pdf.field_row("Signed", "S. Johnson")
    pdf.field_row("Name (printed)", "Mrs Sarah Johnson")
    pdf.field_row("Date", "28 November 2024")
    pdf.ln(5)

    pdf.sub_heading("Agent Declaration")
    pdf.body_text(
        "I confirm that I have been appointed as agent for this application and that the "
        "information provided has been prepared with due diligence and care."
    )
    pdf.field_row("Signed", "D. Thompson")
    pdf.field_row("Name (printed)", "Mr David Thompson BSc(Hons) RIBA ARB")
    pdf.field_row("Company", "Thompson & Associates Architecture Ltd")
    pdf.field_row("Date", "28 November 2024")

    pdf.ln(15)
    pdf.set_draw_color(0, 51, 102)
    pdf.set_line_width(0.5)
    pdf.line(20, pdf.get_y(), 190, pdf.get_y())
    pdf.ln(5)
    pdf.set_font("Helvetica", "I", 8)
    pdf.set_text_color(100, 100, 100)
    pdf.body_text(
        "This application has been prepared by Thompson & Associates Architecture Ltd on behalf "
        "of Mrs Sarah Johnson. All drawings are copyright Thompson & Associates Architecture Ltd "
        "and may not be reproduced without permission. Drawing scale accuracy is dependent on "
        "the print medium and should be verified on site."
    )
    pdf.body_text(
        "Testville District Council, Planning Department, Civic Centre, High Street, "
        "Testville, TV1 2AB. Tel: 01234 500000. Email: planning@testville.gov.uk"
    )

    all_text.append("""9. DECLARATION & SIGNATURES

I/We hereby apply for planning permission as described in this application and the accompanying plans and drawings. I/We confirm that, to the best of my/our knowledge, the information given in this application is correct and complete.

Applicant Declaration
Signed: S. Johnson
Name (printed): Mrs Sarah Johnson
Date: 28 November 2024

Agent Declaration
I confirm that I have been appointed as agent for this application and that the information provided has been prepared with due diligence and care.
Signed: D. Thompson
Name (printed): Mr David Thompson BSc(Hons) RIBA ARB
Company: Thompson & Associates Architecture Ltd
Date: 28 November 2024

This application has been prepared by Thompson & Associates Architecture Ltd on behalf of Mrs Sarah Johnson.
Testville District Council, Planning Department, Civic Centre, High Street, Testville, TV1 2AB.""")

    return pdf, "\n\n".join(all_text)


def main():
    script_dir = os.path.dirname(os.path.abspath(__file__))

    print("Generating planning application PDF...")
    pdf, full_text = generate_pdf()

    # Save PDF
    pdf_path = os.path.join(script_dir, "sample-planning-application.pdf")
    pdf.output(pdf_path)
    pdf_size = os.path.getsize(pdf_path)
    print(f"PDF saved: {pdf_path} ({pdf_size:,} bytes, {pdf_size/1024:.1f} KB)")

    # Save base64
    with open(pdf_path, "rb") as f:
        pdf_bytes = f.read()
    b64_content = base64.b64encode(pdf_bytes).decode("ascii")
    b64_path = os.path.join(script_dir, "sample_pdf_base64.txt")
    with open(b64_path, "w") as f:
        f.write(b64_content)
    print(f"Base64 saved: {b64_path} ({len(b64_content):,} chars, {len(b64_content)/1024:.1f} KB)")

    # Save text
    text_path = os.path.join(script_dir, "sample_document_text.txt")
    with open(text_path, "w") as f:
        f.write(full_text)
    print(f"Text saved: {text_path} ({len(full_text):,} chars, {len(full_text)/1024:.1f} KB)")

    # Summary
    print(f"\nPDF: {pdf.pages_count} pages")
    print(f"Text: ~{len(full_text.split())} words")
    print(f"Total base64 for template: {len(b64_content)/1024:.1f} KB")


if __name__ == "__main__":
    main()
