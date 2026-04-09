# pdf_report.py

from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, PageBreak
from reportlab.lib.styles import ParagraphStyle, getSampleStyleSheet
from reportlab.lib import colors
from reportlab.lib.units import inch
from reportlab.lib.pagesizes import letter
from reportlab.platypus import Image
from reportlab.graphics.shapes import Drawing, Line
from reportlab.graphics import renderPDF
from reportlab.platypus.flowables import Flowable
import os
from datetime import datetime
from typing import Optional

from report_generator import (
    fetch_session_data,
    compute_session_analytics,
    generate_conversation_summary,
    generate_suggested_intervention
)

class LineDivider(Flowable):
    """Custom flowable to draw a horizontal line"""
    
    def __init__(self, width):
        Flowable.__init__(self)
        self.width = width
        
    def draw(self):
        self.canv.setStrokeColor(colors.grey)
        self.canv.setLineWidth(1)
        self.canv.line(0, 0, self.width, 0)

def create_professional_styles():
    """Create custom styles for professional report layout"""
    styles = getSampleStyleSheet()
    
    # Title style
    title_style = ParagraphStyle(
        'CustomTitle',
        parent=styles['Heading1'],
        fontSize=24,
        spaceAfter=20,
        alignment=1,  # Center alignment
        textColor=colors.HexColor('#2c3e50'),
        fontName='Helvetica-Bold'
    )
    
    # Section header style
    section_style = ParagraphStyle(
        'SectionHeader',
        parent=styles['Heading2'],
        fontSize=14,
        spaceBefore=20,
        spaceAfter=10,
        textColor=colors.HexColor('#34495e'),
        fontName='Helvetica-Bold'
    )
    
    # Normal text style
    normal_style = ParagraphStyle(
        'CustomNormal',
        parent=styles['Normal'],
        fontSize=10,
        spaceAfter=6,
        fontName='Helvetica'
    )
    
    # Table content style
    table_style = ParagraphStyle(
        'TableContent',
        parent=styles['Normal'],
        fontSize=9,
        fontName='Helvetica'
    )
    
    return {
        'title': title_style,
        'section': section_style,
        'normal': normal_style,
        'table': table_style
    }

def create_bordered_table(data, col_widths=None):
    """Create a table with professional borders and styling"""
    
    table = Table(data, colWidths=col_widths)
    table.setStyle(TableStyle([
        # Header row styling
        ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#ecf0f1')),
        ('TEXTCOLOR', (0, 0), (-1, 0), colors.HexColor('#2c3e50')),
        ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
        ('FONTSIZE', (0, 0), (-1, 0), 10),
        
        # Data rows styling  
        ('BACKGROUND', (0, 1), (-1, -1), colors.white),
        ('TEXTCOLOR', (0, 1), (-1, -1), colors.HexColor('#34495e')),
        ('FONTNAME', (0, 1), (-1, -1), 'Helvetica'),
        ('FONTSIZE', (0, 1), (-1, -1), 9),
        
        # Grid and borders
        ('GRID', (0, 0), (-1, -1), 1, colors.HexColor('#bdc3c7')),
        ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
        ('ALIGN', (0, 0), (-1, -1), 'LEFT'),
        
        # Padding
        ('LEFTPADDING', (0, 0), (-1, -1), 8),
        ('RIGHTPADDING', (0, 0), (-1, -1), 8),
        ('TOPPADDING', (0, 0), (-1, -1), 6),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 6),
    ]))
    
    return table

def generate_pdf_report(session_id: str, output_file: Optional[str] = None) -> Optional[str]:
    """
    Generate a professional PDF report for a specific session
    """
    
    print(f"[REPORT] Starting PDF generation for session: {session_id}")
    
    # Fetch session data from MongoDB
    session_data = fetch_session_data(session_id)
    if not session_data:
        print(f"[REPORT ERROR] No session found with ID: {session_id}")
        return None
    
    print(f"[REPORT] Session data fetched successfully")
    
    # Compute analytics
    analytics = compute_session_analytics(session_data)
    print(f"[REPORT] Analytics computed: {analytics['total_messages']} total messages")
    
    # Generate content
    conversation_summary = generate_conversation_summary(session_data)
    intervention = generate_suggested_intervention(analytics)
    
    # Set output filename
    if output_file is None:
        output_file = f"session_{session_id}.pdf"
    
    # Create document
    doc = SimpleDocTemplate(
        output_file,
        pagesize=letter,
        rightMargin=inch,
        leftMargin=inch,
        topMargin=inch,
        bottomMargin=inch
    )
    
    elements = []
    styles = create_professional_styles()
    
    # Header with logo placeholder (you can add actual logo later)
    # For now, we'll use a text-based header
    elements.append(Paragraph("EmWell AI", styles['title']))
    elements.append(Spacer(1, 0.2*inch))
    
    # Title
    elements.append(Paragraph("AI Session Analytics Report", styles['title']))
    elements.append(Spacer(1, 0.1*inch))
    
    # Divider line
    elements.append(LineDivider(400))
    elements.append(Spacer(1, 0.3*inch))
    
    # Section 1: Session Metadata
    elements.append(Paragraph("Session Metadata", styles['section']))
    
    session = session_data['session']
    session_table_data = [
        ['Field', 'Value'],
        ['Session ID', session_id],
        ['Created Date', session.get('created_at', 'N/A').strftime('%Y-%m-%d %H:%M:%S') if hasattr(session.get('created_at', 'N/A'), 'strftime') else 'N/A'],
        ['Last Updated', session.get('updated_at', 'N/A').strftime('%Y-%m-%d %H:%M:%S') if hasattr(session.get('updated_at', 'N/A'), 'strftime') else 'N/A'],
        ['Session Title', session.get('title', 'Untitled Session') or 'Untitled Session']
    ]
    
    elements.append(create_bordered_table(session_table_data, col_widths=[2*inch, 4*inch]))
    elements.append(Spacer(1, 0.2*inch))
    
    # Section 2: Conversation Statistics
    elements.append(Paragraph("Conversation Statistics", styles['section']))
    
    stats_table_data = [
        ['Metric', 'Value'],
        ['Total Messages', str(analytics['total_messages'])],
        ['User Messages', str(analytics['user_messages'])],
        ['Assistant Messages', str(analytics['assistant_messages'])],
        ['Duration (minutes)', str(analytics['conversation_duration_minutes'])],
        ['Average Emotional Intensity', f"{analytics['average_emotional_intensity']:.2f}"]
    ]
    
    elements.append(create_bordered_table(stats_table_data, col_widths=[2*inch, 4*inch]))
    elements.append(Spacer(1, 0.2*inch))
    
    # Section 3: Emotional Analysis
    elements.append(Paragraph("Emotional Analysis", styles['section']))
    
    emotion_table_data = [['Emotion', 'Distribution (%)', 'Status']]
    
    if analytics['emotion_distribution']:
        for emotion, percentage in analytics['emotion_distribution'].items():
            status = "Dominant" if emotion == analytics['dominant_emotion'] else "Secondary"
            emotion_table_data.append([
                emotion.capitalize(),
                f"{percentage*100:.1f}%",
                status
            ])
    else:
        emotion_table_data.append(['No Emotion Data', 'N/A', 'N/A'])
    
    elements.append(create_bordered_table(emotion_table_data, col_widths=[2*inch, 2*inch, 2*inch]))
    elements.append(Spacer(1, 0.2*inch))
    
    # Section 4: Conversation Summary
    elements.append(Paragraph("Conversation Summary", styles['section']))
    elements.append(Paragraph(conversation_summary, styles['normal']))
    elements.append(Spacer(1, 0.2*inch))
    
    # Section 5: Suggested Intervention
    elements.append(Paragraph("Suggested Intervention", styles['section']))
    elements.append(Paragraph(f"<b>{intervention['title']}</b>", styles['normal']))
    elements.append(Paragraph(intervention['reason'], styles['normal']))
    elements.append(Spacer(1, 0.3*inch))
    
    # Footer information
    elements.append(LineDivider(400))
    elements.append(Spacer(1, 0.1*inch))
    elements.append(Paragraph(
        f"Report generated on {datetime.now().strftime('%Y-%m-%d %H:%M:%S')} by EmWell AI Analytics System",
        ParagraphStyle('Footer', parent=styles['normal'], fontSize=8, textColor=colors.grey)
    ))
    
    # Build PDF
    try:
        doc.build(elements)
        print(f"Professional PDF report generated: {output_file}")
        return output_file
    except Exception as e:
        print(f"Error generating PDF report: {e}")
        return None

# Legacy function for backward compatibility
def generate_pdf_report_legacy(session_data, output_file="session_report.pdf"):
    """
    Legacy PDF generation function maintained for backward compatibility
    """
    
    doc = SimpleDocTemplate(output_file)
    elements = []

    styles = getSampleStyleSheet()
    title_style = styles["Heading1"]
    normal_style = styles["Normal"]

    from report_generator import generate_report_metrics
    metrics = generate_report_metrics(session_data)

    elements.append(Paragraph("Session Summary", title_style))
    elements.append(Spacer(1, 0.3 * inch))

    elements.append(Paragraph(f"Date: {session_data.get('date', 'N/A')}", normal_style))
    elements.append(Paragraph(f"Duration: {session_data.get('duration_minutes', 0)} minutes", normal_style))
    elements.append(Paragraph(f"Confidence: {int(session_data.get('confidence', 0)*100)}%", normal_style))
    elements.append(Spacer(1, 0.3 * inch))

    elements.append(Paragraph("Dominant Emotion:", styles["Heading2"]))
    elements.append(Paragraph(metrics["dominant_emotion"].capitalize(), normal_style))
    elements.append(Spacer(1, 0.3 * inch))

    elements.append(Paragraph("Emotion Distribution:", styles["Heading2"]))

    emotion_data = [[k.capitalize(), f"{int(v*100)}%"]
                    for k, v in session_data.get("emotion_distribution", {}).items()]

    if emotion_data:
        table = Table(emotion_data)
        table.setStyle(TableStyle([
            ('BACKGROUND', (0, 0), (-1, 0), colors.lightgrey),
            ('GRID', (0, 0), (-1, -1), 0.5, colors.grey)
        ]))
        elements.append(table)

    elements.append(Spacer(1, 0.3 * inch))

    elements.append(Paragraph("Session Impact:", styles["Heading2"]))
    elements.append(Paragraph(metrics["impact_label"], normal_style))
    elements.append(Paragraph(f"Impact Score: {metrics['impact_score']}", normal_style))
    elements.append(Spacer(1, 0.3 * inch))

    elements.append(Paragraph("Coherence Score:", styles["Heading2"]))
    elements.append(Paragraph(str(session_data.get("coherence_score", 0)), normal_style))
    elements.append(Spacer(1, 0.3 * inch))

    elements.append(Paragraph("Suggested Intervention:", styles["Heading2"]))
    intervention = session_data.get("suggested_intervention", {})
    elements.append(Paragraph(intervention.get("title", "N/A"), normal_style))
    elements.append(Paragraph(
        f"Reason: {intervention.get('reason', 'N/A')}",
        normal_style
    ))

    doc.build(elements)
    return output_file